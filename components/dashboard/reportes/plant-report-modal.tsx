"use client";

import { useCallback, useMemo, useState } from "react";
import {
  dashboardFilterPillActive,
  dashboardFilterPillInactive,
} from "@/lib/dashboard-chips";
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

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const dateDisplayFormatter = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
});

type PeriodMode = "month" | "week" | "day";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function getWeekBounds(
  year: number,
  monthIndex: number,
  weekNum: number
): { startStr: string; endStr: string } {
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
  opts: {
    year: number;
    monthIndex: number;
    weekNum: number;
    dayStr: string | null;
  }
): DailySummaryDoc[] {
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  if (mode === "month") return sorted;
  if (mode === "week") {
    const { startStr, endStr } = getWeekBounds(
      opts.year,
      opts.monthIndex,
      opts.weekNum
    );
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
    return `Semana ${weekNum} (${startStr} → ${endStr})`;
  }
  if (mode === "day" && dayStr) {
    const d = new Date(dayStr + "T12:00:00");
    return dateDisplayFormatter.format(d);
  }
  return monthLabel;
}

export type PlantReportModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plant: PlantDoc | null;
  /** Fallback when plant doc is missing */
  plantDisplayName: string;
  summariesForPlant: DailySummaryDoc[];
  monthLabel: string;
  year: number;
  monthIndex: number;
};

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

  const defaultDayStr = sortedDates[sortedDates.length - 1] ?? null;
  const [dayStr, setDayStr] = useState<string | null>(defaultDayStr);

  // Keep day in range when data loads
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
    [
      summariesForPlant,
      periodMode,
      year,
      monthIndex,
      weekNum,
      effectiveDayStr,
    ]
  );

  const totals = useMemo(() => {
    let kwh = 0;
    let co2 = 0;
    let savings = 0;
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

  const handleDownloadPdf = useCallback(() => {
    const label = periodLabel(
      periodMode,
      monthLabel,
      weekNum,
      effectiveDayStr,
      year,
      monthIndex
    );

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.setFontSize(16);
    doc.text(`Reporte de planta — ${displayName}`, 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Ubicación: ${location}`, 14, 26);
    doc.text(`Capacidad instalada: ${capacity}`, 14, 32);
    doc.text(`Período: ${label}`, 14, 38);
    doc.setTextColor(0, 0, 0);

    const head = [["Fecha", "kWh", "CO₂ (t)", "Ahorro (COP)"]];
    const body = filteredRows.map((r) => [
      r.date,
      metricFormatter.format(r.total_energy_kwh),
      metricFormatter.format(r.co2_mitigated_tons),
      copFormatter.format(r.financial_savings),
    ]);
    const foot = [
      [
        "Total",
        metricFormatter.format(totals.kwh),
        metricFormatter.format(totals.co2),
        copFormatter.format(totals.savings),
      ],
    ];

    autoTable(doc, {
      startY: 44,
      head,
      body,
      foot,
      theme: "striped",
      headStyles: { fillColor: [33, 37, 41] },
      footStyles: { fontStyle: "bold", fillColor: [240, 240, 240] },
      styles: { fontSize: 9, cellPadding: 2 },
    });

    const pageH = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generado: ${new Date().toLocaleString("es-CO")}`, 14, pageH - 8);

    const safeSlug = displayName
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 40);
    doc.save(`reporte-${safeSlug || "planta"}.pdf`);
  }, [
    periodMode,
    monthLabel,
    weekNum,
    effectiveDayStr,
    year,
    monthIndex,
    displayName,
    location,
    capacity,
    filteredRows,
    totals.kwh,
    totals.co2,
    totals.savings,
  ]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[min(90vh,720px)] max-w-[calc(100%-2rem)] gap-4 overflow-hidden sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="pr-8">Reporte detallado</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-1 text-left">
              <p className="font-medium text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {location} · {capacity}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 overflow-hidden">
          <div>
            <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
              Período
            </p>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Tipo de período"
            >
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
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-medium",
                    periodMode === id
                      ? dashboardFilterPillActive
                      : dashboardFilterPillInactive
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {periodMode === "week" && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Semana del mes:</span>
              {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setWeekNum(w)}
                  className={cn(
                    "h-8 min-w-8 rounded-full px-2 text-xs font-medium",
                    weekNum === w
                      ? dashboardFilterPillActive
                      : dashboardFilterPillInactive
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {periodMode === "day" && (
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor="plant-report-day"
                className="text-xs text-muted-foreground"
              >
                Día:
              </label>
              <select
                id="plant-report-day"
                className="h-9 min-w-[200px] rounded-lg border border-white/20 bg-white/10 px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={effectiveDayStr ?? ""}
                onChange={(e) => setDayStr(e.target.value || null)}
                disabled={sortedDates.length === 0}
              >
                {sortedDates.length === 0 ? (
                  <option value="">Sin datos</option>
                ) : (
                  sortedDates.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/15 bg-white/5">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/15 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2 text-right">kWh</th>
                  <th className="px-3 py-2 text-right">CO₂ (t)</th>
                  <th className="px-3 py-2 text-right">Ahorro</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-8 text-center text-muted-foreground"
                    >
                      No hay registros para este período.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr
                      key={r.date}
                      className="border-t border-white/10 hover:bg-white/[0.06]"
                    >
                      <td className="px-3 py-2 tabular-nums text-foreground">
                        {r.date}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {metricFormatter.format(r.total_energy_kwh)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {metricFormatter.format(r.co2_mitigated_tons)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        {copFormatter.format(r.financial_savings)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredRows.length > 0 && (
                <tfoot>
                  <tr className="border-t-2 border-white/20 bg-white/[0.08] font-semibold">
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
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <p className="text-[0.65rem] text-muted-foreground">
            {periodLabel(
              periodMode,
              monthLabel,
              weekNum,
              effectiveDayStr,
              year,
              monthIndex
            )}
          </p>
          <Button
            type="button"
            onClick={handleDownloadPdf}
            disabled={filteredRows.length === 0}
          >
            Descargar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
