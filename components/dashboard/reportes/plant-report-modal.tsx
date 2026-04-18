"use client";

import NextImage from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import type { DailySummaryDoc, PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ─── formatters ─────────────────────────────────────────────────────── */
const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

/* ─── pill styles aligned with the warm glass design system ─────────── */
/**
 * Active: amber primary tint — matches the app's --primary color.
 * Inactive: translucent warm with border, works on the glass background.
 */
const pillBase = "rounded-full px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200";
const pillActive =
  "bg-primary text-primary-foreground shadow-sm border-2 border-primary/60";
const pillInactive =
  "border border-foreground/20 bg-white/20 text-foreground hover:bg-white/35";

/* ─── glass card used inside the modal ──────────────────────────────── */
const glassPanel =
  "rounded-xl border border-white/30 bg-white/20 shadow-sm backdrop-blur-sm";

/* ─── helpers ────────────────────────────────────────────────────────── */
type PeriodMode = "month" | "week" | "day";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getWeekBounds(year: number, monthIndex: number, weekNum: number) {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const startDay = (weekNum - 1) * 7 + 1;
  const endDay = Math.min(weekNum * 7, lastDay);
  const ym = `${year}-${pad2(monthIndex + 1)}`;
  return {
    startStr: `${ym}-${pad2(startDay)}`,
    endStr: `${ym}-${pad2(endDay)}`,
  };
}

function filterByPeriod(
  rows: DailySummaryDoc[],
  mode: PeriodMode,
  opts: { year: number; monthIndex: number; weekNum: number; dayStr: string | null }
): DailySummaryDoc[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  if (mode === "month") return sorted;
  if (mode === "week") {
    const { startStr, endStr } = getWeekBounds(opts.year, opts.monthIndex, opts.weekNum);
    return sorted.filter((r) => r.date >= startStr && r.date <= endStr);
  }
  if (mode === "day" && opts.dayStr) {
    return sorted.filter((r) => r.date === opts.dayStr);
  }
  return sorted;
}

function periodLabel(
  mode: PeriodMode,
  monthLabel: string,
  weekNum: number,
  dayStr: string | null,
  year: number,
  monthIndex: number
): string {
  if (mode === "month") return monthLabel;
  if (mode === "week") {
    const { startStr, endStr } = getWeekBounds(year, monthIndex, weekNum);
    return `Semana ${weekNum} · ${startStr} → ${endStr}`;
  }
  if (mode === "day" && dayStr) {
    return new Date(dayStr + "T12:00:00").toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }
  return monthLabel;
}

/* ─── logo loader for PDF ────────────────────────────────────────────── */
async function loadLogoForPdf(): Promise<string | null> {
  try {
    const res = await fetch("/solara-logo-2.webp");
    if (!res.ok) return null;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    try {
      return await new Promise<string | null>((resolve) => {
        const img = document.createElement("img");
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext("2d");
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL("image/png"));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

/* ─── motion presets ─────────────────────────────────────────────────── */
const subRowAnim = {
  initial: { opacity: 0, height: 0 },
  animate: { opacity: 1, height: "auto" as const },
  exit: { opacity: 0, height: 0 },
  transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1] as const },
};

const tableAnim = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
  transition: { duration: 0.18, ease: [0, 0, 0.2, 1] as const },
};

/* ─── props ──────────────────────────────────────────────────────────── */
export type PlantReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: PlantDoc | null;
  plantDisplayName: string;
  summariesForPlant: DailySummaryDoc[];
  monthLabel: string;
  year: number;
  monthIndex: number;
};

/* ─── component ──────────────────────────────────────────────────────── */
export function PlantReportModal({
  open,
  onOpenChange,
  plant,
  plantDisplayName,
  summariesForPlant,
  monthLabel,
  year,
  monthIndex,
}: PlantReportModalProps) {
  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [weekNum, setWeekNum] = useState(1);

  const sortedDates = useMemo(() => {
    const set = new Set(summariesForPlant.map((s) => s.date));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [summariesForPlant]);

  const [dayStr, setDayStr] = useState<string | null>(
    sortedDates[sortedDates.length - 1] ?? null
  );

  const effectiveDayStr = useMemo(() => {
    if (sortedDates.length === 0) return null;
    if (dayStr && sortedDates.includes(dayStr)) return dayStr;
    return sortedDates[sortedDates.length - 1] ?? null;
  }, [dayStr, sortedDates]);

  const filteredRows = useMemo(
    () =>
      filterByPeriod(summariesForPlant, periodMode, {
        year,
        monthIndex,
        weekNum,
        dayStr: effectiveDayStr,
      }),
    [summariesForPlant, periodMode, year, monthIndex, weekNum, effectiveDayStr]
  );

  const totals = useMemo(() => {
    let kwh = 0, co2 = 0, savings = 0;
    for (const r of filteredRows) {
      kwh += r.total_energy_kwh;
      co2 += r.co2_mitigated_tons;
      savings += r.financial_savings;
    }
    return { kwh, co2, savings };
  }, [filteredRows]);

  const displayName = plant?.name?.trim() || plantDisplayName;
  const location = plant?.location?.trim() || "—";
  const capacity =
    plant != null && plant.installed_capacity_kw > 0
      ? `${metricFormatter.format(plant.installed_capacity_kw)} kW`
      : "—";

  /* ── PDF generation ──────────────────────────────────────────────── */
  const handleDownloadPdf = useCallback(async () => {
    const label = periodLabel(periodMode, monthLabel, weekNum, effectiveDayStr, year, monthIndex);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const logoData = await loadLogoForPdf();

    if (logoData) doc.addImage(logoData, "PNG", 14, 10, 14, 14);
    const titleY = 18;
    const metaStartY = logoData ? 30 : 26;

    doc.setTextColor(55, 35, 10);
    doc.setFontSize(15);
    doc.text(`Reporte — ${displayName}`, logoData ? 32 : 14, titleY);
    doc.setFontSize(10);
    doc.setTextColor(90, 70, 40);
    doc.text(`Ubicación: ${location}`, 14, metaStartY);
    doc.text(`Capacidad: ${capacity}`, 14, metaStartY + 6);
    doc.text(`Período: ${label}`, 14, metaStartY + 12);

    const head = [["Fecha", "kWh", "CO₂ (t)", "Ahorro (COP)"]];
    const body = filteredRows.map((r) => [
      r.date,
      metricFormatter.format(r.total_energy_kwh),
      metricFormatter.format(r.co2_mitigated_tons),
      copFormatter.format(r.financial_savings),
    ]);
    const foot = [[
      "Total",
      metricFormatter.format(totals.kwh),
      metricFormatter.format(totals.co2),
      copFormatter.format(totals.savings),
    ]];

    autoTable(doc, {
      startY: metaStartY + 20,
      head,
      body,
      foot,
      theme: "striped",
      headStyles: { fillColor: [180, 120, 40], textColor: 255, fontStyle: "bold" },
      footStyles: { fontStyle: "bold", fillColor: [245, 235, 210], textColor: [55, 35, 10] },
      alternateRowStyles: { fillColor: [253, 249, 240] },
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
        textColor: [55, 35, 10],
        lineColor: [210, 195, 165],
        lineWidth: 0.2,
      },
    });

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(140, 120, 80);
    doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, pageH - 8);

    const safeSlug = displayName.replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 40);
    doc.save(`reporte-${safeSlug || "planta"}.pdf`);
  }, [
    periodMode, monthLabel, weekNum, effectiveDayStr, year, monthIndex,
    displayName, location, capacity, filteredRows,
    totals.kwh, totals.co2, totals.savings,
  ]);

  /* ── render ──────────────────────────────────────────────────────── */
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(92vh,840px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl",
          "border border-white/30 bg-white/60 shadow-xl backdrop-blur-xl"
        )}
        showCloseButton
      >
        {/* ── header ── */}
        <div className="shrink-0 border-b border-white/25 px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
          <DialogHeader className="space-y-0 text-left">
            <div className="flex items-start gap-3 pr-10">
              <NextImage
                src="/solara-logo-2.webp"
                alt=""
                width={40}
                height={40}
                className="size-10 shrink-0 rounded-[8px] object-contain drop-shadow-sm"
              />
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-base text-foreground sm:text-lg">
                  Reporte detallado
                </DialogTitle>
                <DialogDescription asChild>
                  <div className="mt-1.5 space-y-0.5 text-left">
                    <p className="font-semibold text-foreground">{displayName}</p>
                    <p className="text-xs text-foreground/65">
                      {location} · {capacity}
                    </p>
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── scrollable body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3">

            {/* Period selector */}
            <div>
              <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-foreground/55">
                Período
              </p>
              <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de período">
                {(
                  [
                    ["month", "Mes"],
                    ["week", "Semana"],
                    ["day", "Día"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={periodMode === id}
                    onClick={() => setPeriodMode(id)}
                    className={cn(pillBase, periodMode === id ? pillActive : pillInactive)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sub-selectors with animated entry */}
            <AnimatePresence mode="wait">
              {periodMode === "week" && (
                <motion.div
                  key="week-picker"
                  className="flex flex-wrap items-center gap-2 overflow-hidden"
                  {...subRowAnim}
                >
                  <span className="text-xs text-foreground/65">Semana:</span>
                  {[1, 2, 3, 4, 5].map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWeekNum(w)}
                      className={cn(
                        "h-8 min-w-8 cursor-pointer rounded-full px-2 text-xs font-medium transition-all duration-200",
                        weekNum === w ? pillActive : pillInactive
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </motion.div>
              )}

              {periodMode === "day" && (
                <motion.div
                  key="day-picker"
                  className="flex flex-wrap items-center gap-2 overflow-hidden"
                  {...subRowAnim}
                >
                  <label
                    htmlFor="plant-report-day"
                    className="cursor-pointer text-xs text-foreground/65"
                  >
                    Día:
                  </label>
                  <select
                    id="plant-report-day"
                    className={cn(
                      "h-9 min-w-[200px] cursor-pointer rounded-lg border border-foreground/15 px-3 text-sm text-foreground outline-none",
                      "bg-white/40 shadow-sm backdrop-blur-sm transition-colors duration-150",
                      "focus-visible:ring-2 focus-visible:ring-primary/50",
                      "disabled:cursor-not-allowed disabled:opacity-50"
                    )}
                    value={effectiveDayStr ?? ""}
                    onChange={(e) => setDayStr(e.target.value || null)}
                    disabled={sortedDates.length === 0}
                  >
                    {sortedDates.length === 0 ? (
                      <option value="">Sin datos</option>
                    ) : (
                      sortedDates.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))
                    )}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Data table with animated swap on period change */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${periodMode}-${weekNum}-${effectiveDayStr ?? "none"}`}
                className={cn(glassPanel, "overflow-hidden")}
                {...tableAnim}
              >
                <table className="w-full border-collapse text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/25 bg-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-foreground/70">
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5 text-right">kWh</th>
                      <th className="px-3 py-2.5 text-right">CO₂ (t)</th>
                      <th className="px-3 py-2.5 text-right">Ahorro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-3 py-8 text-center text-foreground/55">
                          No hay registros para este período.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((r) => (
                        <tr
                          key={r.date}
                          className="border-t border-white/20 odd:bg-white/10 hover:bg-white/25"
                        >
                          <td className="px-3 py-2 tabular-nums text-foreground/80">
                            {r.date}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-foreground">
                            {metricFormatter.format(r.total_energy_kwh)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-foreground">
                            {metricFormatter.format(r.co2_mitigated_tons)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-foreground">
                            {copFormatter.format(r.financial_savings)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredRows.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 border-white/30 bg-primary/10 font-semibold text-foreground">
                        <td className="px-3 py-2.5">Total</td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {metricFormatter.format(totals.kwh)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {metricFormatter.format(totals.co2)}
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {copFormatter.format(totals.savings)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </motion.div>
            </AnimatePresence>

          </div>
        </div>

        {/* ── footer ── */}
        <DialogFooter
          className={cn(
            "shrink-0 flex-col gap-3 border-t border-white/25 px-5 py-4",
            "sm:flex-row sm:items-center sm:justify-between sm:px-6"
          )}
        >
          <p className="max-w-full text-[0.65rem] leading-snug text-foreground/60">
            {periodLabel(periodMode, monthLabel, weekNum, effectiveDayStr, year, monthIndex)}
          </p>
          <Button
            type="button"
            className="w-full cursor-pointer shrink-0 sm:w-auto"
            onClick={() => void handleDownloadPdf()}
            disabled={filteredRows.length === 0}
          >
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
