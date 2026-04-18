"use client";

import { useMemo, useState } from "react";
import { PlantReportModal } from "@/components/dashboard/reportes/plant-report-modal";
import {
  dashboardChipDanger,
  dashboardFilterPillActive,
  dashboardFilterPillInactive,
} from "@/lib/dashboard-chips";
import type { AlarmDoc, DailySummaryDoc, PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

const reportActionBtnClass =
  "cursor-pointer rounded-full border border-foreground/25 bg-foreground/10 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wide text-foreground shadow-sm transition-colors duration-150 hover:bg-foreground/[0.15]";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const TABS = [
  { id: "gen", label: "Generación" },
  { id: "co2", label: "CO₂" },
  { id: "contract", label: "Contractual" },
  { id: "freq", label: "Frecuencia" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function treesEquivalent(tonsCo2: number) {
  const trees = Math.round(tonsCo2 * 45);
  return `≈ ${intFormatter.format(trees)} árboles/año`;
}

export type ReportesTabsProps = {
  summaries: DailySummaryDoc[];
  plants: PlantDoc[];
  frequencyAlarms: AlarmDoc[];
  monthLabel: string;
  daysInSample: number;
  year: number;
  monthIndex: number;
};

export function ReportesTabs({
  summaries,
  plants,
  frequencyAlarms,
  monthLabel,
  daysInSample,
  year,
  monthIndex,
}: ReportesTabsProps) {
  const [tab, setTab] = useState<TabId>("gen");
  const [openPlant, setOpenPlant] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const openPlantSummaries = useMemo(() => {
    if (!openPlant) return [];
    return summaries.filter((s) => s.plant_id === openPlant.id);
  }, [summaries, openPlant]);

  const openPlantDoc = useMemo(() => {
    if (!openPlant) return null;
    return plants.find((p) => p.id === openPlant.id) ?? null;
  }, [plants, openPlant]);

  const plantName = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of plants) m.set(p.id, p.name);
    return m;
  }, [plants]);

  const aggregates = useMemo(() => {
    const energy = new Map<string, number>();
    const co2 = new Map<string, number>();
    const savings = new Map<string, number>();
    for (const s of summaries) {
      energy.set(s.plant_id, (energy.get(s.plant_id) ?? 0) + s.total_energy_kwh);
      co2.set(s.plant_id, (co2.get(s.plant_id) ?? 0) + s.co2_mitigated_tons);
      savings.set(
        s.plant_id,
        (savings.get(s.plant_id) ?? 0) + s.financial_savings
      );
    }
    return { energy, co2, savings };
  }, [summaries]);

  const rankingGen = useMemo(() => {
    return [...aggregates.energy.entries()]
      .map(([plant_id, total_kwh]) => ({
        plant_id,
        total_kwh,
        avg_per_day: daysInSample > 0 ? total_kwh / daysInSample : 0,
      }))
      .sort((a, b) => b.total_kwh - a.total_kwh)
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }, [aggregates.energy, daysInSample]);

  const rankingCo2 = useMemo(() => {
    return [...aggregates.co2.entries()]
      .map(([plant_id, tons]) => ({ plant_id, tons }))
      .sort((a, b) => b.tons - a.tons)
      .map((row, i) => ({ ...row, rank: i + 1 }));
  }, [aggregates.co2]);

  const contractual = useMemo(() => {
    const rows: {
      plant_id: string;
      generated: number;
      expected: number;
      deltaPct: number;
    }[] = [];
    for (const p of plants) {
      const expected = p.contract_commitments?.expected_energy_kwh_month;
      if (expected == null || expected <= 0) continue;
      const generated = aggregates.energy.get(p.id) ?? 0;
      if (generated >= expected) continue;
      const deltaPct = ((generated - expected) / expected) * 100;
      rows.push({ plant_id: p.id, generated, expected, deltaPct });
    }
    rows.sort((a, b) => a.deltaPct - b.deltaPct);
    return rows;
  }, [plants, aggregates.energy]);

  const freqByPlant = useMemo(() => {
    const counts = new Map<
      string,
      { count: number; worst: number; last: Date | null }
    >();
    for (const a of frequencyAlarms) {
      const pid = a.plant_id;
      const cur = counts.get(pid) ?? {
        count: 0,
        worst: 0,
        last: null as Date | null,
      };
      cur.count += 1;
      const read = a.details?.reading_value;
      if (typeof read === "number") {
        const dev = Math.abs(read - 60);
        if (dev > Math.abs(cur.worst - 60)) cur.worst = read;
      }
      const t = a.created_at.toDate();
      if (!cur.last || t > cur.last) cur.last = t;
      counts.set(pid, cur);
    }
    return [...counts.entries()]
      .map(([plant_id, v]) => ({ plant_id, ...v }))
      .sort((a, b) => b.count - a.count);
  }, [frequencyAlarms]);

  const headerTotals = useMemo(() => {
    let gen = 0;
    let co2t = 0;
    let money = 0;
    for (const s of summaries) {
      gen += s.total_energy_kwh;
      co2t += s.co2_mitigated_tons;
      money += s.financial_savings;
    }
    return { gen, co2t, money, breach: contractual.length };
  }, [summaries, contractual.length]);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 overflow-hidden">
      <div
        className={cn(
          cardPaper,
          "grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-4"
        )}
      >
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Generación flota</p>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
            {metricFormatter.format(headerTotals.gen)}{" "}
            <span className="font-normal text-muted-foreground">kWh</span>
          </p>
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            {monthLabel}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">CO₂ mitigado</p>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
            {metricFormatter.format(headerTotals.co2t)}{" "}
            <span className="font-normal text-muted-foreground">t</span>
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Ahorro total</p>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
            {copFormatter.format(headerTotals.money)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Plantas en incumplimiento</p>
          <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
            {intFormatter.format(headerTotals.breach)}
          </p>
        </div>
      </div>

      <div
        className="flex shrink-0 flex-wrap gap-2 border-b border-white/10 pb-2"
        role="tablist"
        aria-label="Reportes"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm",
              tab === t.id ? dashboardFilterPillActive : dashboardFilterPillInactive
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={cn(cardPaper, "flex min-h-0 flex-1 flex-col overflow-hidden")}>

        {/* ── Tab: Generación ── */}
        {tab === "gen" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
            <div className="flex min-h-0 min-w-[640px] flex-1 flex-col text-xs sm:text-sm">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "40px" }} />
                  <col />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "110px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-foreground/75">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Planta</th>
                    <th className="px-3 py-3">Total kWh mes</th>
                    <th className="px-3 py-3">Prom. kWh/día</th>
                    <th className="px-2 py-3 text-right">Acción</th>
                  </tr>
                </thead>
              </table>
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                <table className="w-full table-fixed border-collapse text-left">
                  <colgroup>
                    <col style={{ width: "40px" }} />
                    <col />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "110px" }} />
                  </colgroup>
                  <tbody>
                    {rankingGen.map((r) => (
                      <tr key={r.plant_id} className="border-t border-white/10 hover:bg-white/[0.06]">
                        <td className="px-3 py-2.5 tabular-nums text-foreground/65">{r.rank}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {plantName.get(r.plant_id) ?? r.plant_id}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-foreground">{metricFormatter.format(r.total_kwh)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-foreground/90">
                          {metricFormatter.format(r.avg_per_day)}
                        </td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            type="button"
                            className={reportActionBtnClass}
                            onClick={() =>
                              setOpenPlant({
                                id: r.plant_id,
                                name: plantName.get(r.plant_id) ?? r.plant_id,
                              })
                            }
                          >
                            Ver reporte
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: CO₂ ── */}
        {tab === "co2" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
            <div className="flex min-h-0 min-w-[640px] flex-1 flex-col text-xs sm:text-sm">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "40px" }} />
                  <col />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "160px" }} />
                  <col style={{ width: "110px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-foreground/75">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Planta</th>
                    <th className="px-3 py-3">CO₂ (t)</th>
                    <th className="px-3 py-3">Equivalente</th>
                    <th className="px-2 py-3 text-right">Acción</th>
                  </tr>
                </thead>
              </table>
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                <table className="w-full table-fixed border-collapse text-left">
                  <colgroup>
                    <col style={{ width: "40px" }} />
                    <col />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "160px" }} />
                    <col style={{ width: "110px" }} />
                  </colgroup>
                  <tbody>
                    {rankingCo2.map((r) => (
                      <tr key={r.plant_id} className="border-t border-white/10 hover:bg-white/[0.06]">
                        <td className="px-3 py-2.5 tabular-nums text-foreground/65">{r.rank}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {plantName.get(r.plant_id) ?? r.plant_id}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-foreground">{metricFormatter.format(r.tons)}</td>
                        <td className="px-3 py-2.5 text-foreground/85">{treesEquivalent(r.tons)}</td>
                        <td className="px-2 py-2.5 text-right">
                          <button
                            type="button"
                            className={reportActionBtnClass}
                            onClick={() =>
                              setOpenPlant({
                                id: r.plant_id,
                                name: plantName.get(r.plant_id) ?? r.plant_id,
                              })
                            }
                          >
                            Ver reporte
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Contractual ── */}
        {tab === "contract" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
            <div className="flex min-h-0 min-w-[680px] flex-1 flex-col text-xs sm:text-sm">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "72px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "110px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-foreground/75">
                    <th className="px-3 py-3">Planta</th>
                    <th className="px-3 py-3">Generado (mes)</th>
                    <th className="px-3 py-3">Esperado</th>
                    <th className="px-3 py-3">Δ %</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-2 py-3 text-right">Acción</th>
                  </tr>
                </thead>
              </table>
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                <table className="w-full table-fixed border-collapse text-left">
                  <colgroup>
                    <col />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "72px" }} />
                    <col style={{ width: "120px" }} />
                    <col style={{ width: "110px" }} />
                  </colgroup>
                  <tbody>
                    {contractual.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-foreground/75">
                          Ninguna planta con compromiso mensual por debajo del mínimo (o sin datos de contrato).
                        </td>
                      </tr>
                    ) : (
                      contractual.map((r) => (
                        <tr key={r.plant_id} className="border-t border-white/10 hover:bg-white/[0.06]">
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            {plantName.get(r.plant_id) ?? r.plant_id}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-foreground">{metricFormatter.format(r.generated)} kWh</td>
                          <td className="px-3 py-2.5 tabular-nums text-foreground/85">
                            {metricFormatter.format(r.expected)} kWh
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-destructive">
                            {metricFormatter.format(r.deltaPct)}%
                          </td>
                          <td className="px-3 py-2.5">
                            <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-semibold", dashboardChipDanger)}>
                              INCUMPLIMIENTO
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <button
                              type="button"
                              className={reportActionBtnClass}
                              onClick={() =>
                                setOpenPlant({
                                  id: r.plant_id,
                                  name: plantName.get(r.plant_id) ?? r.plant_id,
                                })
                              }
                            >
                              Ver reporte
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Frecuencia ── */}
        {tab === "freq" && (
          <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
            <div className="flex min-h-0 min-w-[700px] flex-1 flex-col text-xs sm:text-sm">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "40px" }} />
                  <col />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "88px" }} />
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "110px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-foreground/75">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Planta</th>
                    <th className="px-3 py-3">Desviaciones (mes)</th>
                    <th className="px-3 py-3">Peor Hz</th>
                    <th className="px-3 py-3">Último incidente</th>
                    <th className="px-2 py-3 text-right">Acción</th>
                  </tr>
                </thead>
              </table>
              <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                <table className="w-full table-fixed border-collapse text-left">
                  <colgroup>
                    <col style={{ width: "40px" }} />
                    <col />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "88px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "110px" }} />
                  </colgroup>
                  <tbody>
                    {freqByPlant.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-foreground/75">
                          Sin alarmas de frecuencia en el período.
                        </td>
                      </tr>
                    ) : (
                      freqByPlant.map((r, i) => (
                        <tr key={r.plant_id} className="border-t border-white/10 hover:bg-white/[0.06]">
                          <td className="px-3 py-2.5 text-foreground/65">{i + 1}</td>
                          <td className="px-3 py-2.5 font-medium text-foreground">
                            {plantName.get(r.plant_id) ?? r.plant_id}
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-foreground">{r.count}</td>
                          <td className="px-3 py-2.5 tabular-nums text-destructive">
                            {r.worst ? `${metricFormatter.format(r.worst)} Hz` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-foreground/85">
                            {r.last
                              ? r.last.toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })
                              : "—"}
                          </td>
                          <td className="px-2 py-2.5 text-right">
                            <button
                              type="button"
                              className={reportActionBtnClass}
                              onClick={() =>
                                setOpenPlant({
                                  id: r.plant_id,
                                  name: plantName.get(r.plant_id) ?? r.plant_id,
                                })
                              }
                            >
                              Ver reporte
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      <PlantReportModal
        key={openPlant?.id ?? "closed"}
        open={openPlant != null}
        onOpenChange={(next) => {
          if (!next) setOpenPlant(null);
        }}
        plant={openPlantDoc}
        plantDisplayName={openPlant?.name ?? ""}
        summariesForPlant={openPlantSummaries}
        monthLabel={monthLabel}
        year={year}
        monthIndex={monthIndex}
      />
    </div>
  );
}
