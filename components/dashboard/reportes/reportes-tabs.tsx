"use client";

import { useMemo, useState } from "react";
import type { AlarmDoc, DailySummaryDoc, PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

const intFormatter = new Intl.NumberFormat("es-CO", {
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
};

export function ReportesTabs({
  summaries,
  plants,
  frequencyAlarms,
  monthLabel,
  daysInSample,
}: ReportesTabsProps) {
  const [tab, setTab] = useState<TabId>("gen");

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
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <div className={cn(cardPaper, "px-3 py-2.5 sm:px-4 sm:py-3")}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            ⚡ Generación total flota
          </p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold tabular-nums">
            {metricFormatter.format(headerTotals.gen)} kWh
          </p>
          <p className="text-[0.65rem] text-muted-foreground">{monthLabel}</p>
        </div>
        <div className={cn(cardPaper, "px-3 py-2.5 sm:px-4 sm:py-3")}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            🌿 CO₂ total mitigado
          </p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold tabular-nums">
            {metricFormatter.format(headerTotals.co2t)} t
          </p>
        </div>
        <div className={cn(cardPaper, "px-3 py-2.5 sm:px-4 sm:py-3")}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            💰 Ahorro total
          </p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold tabular-nums">
            {new Intl.NumberFormat("es-CO", {
              style: "currency",
              currency: "COP",
              maximumFractionDigits: 0,
            }).format(headerTotals.money)}
          </p>
        </div>
        <div className={cn(cardPaper, "px-3 py-2.5 sm:px-4 sm:py-3")}>
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            ⚠️ Plantas en incumplimiento
          </p>
          <p className="mt-1 font-[family-name:var(--font-heading)] text-lg font-semibold tabular-nums">
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
              "rounded-full px-3 py-1.5 text-xs font-medium sm:text-sm",
              tab === t.id
                ? "bg-gradient-to-br from-[color-mix(in_oklch,var(--primary),white_9%)] to-[color-mix(in_oklch,var(--primary),black_7%)] text-primary-foreground shadow-sm"
                : "border border-white/20 bg-white/10 text-muted-foreground hover:bg-white/15"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className={cn(
          cardPaper,
          "min-h-0 flex-1 overflow-hidden p-3 sm:p-4"
        )}
      >
        <div className="h-full overflow-auto scrollbar-hide">
          {tab === "gen" ? (
            <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-white/20 backdrop-blur-sm">
                <tr className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Planta</th>
                  <th className="px-2 py-2">Total kWh mes</th>
                  <th className="px-2 py-2">Prom. kWh/día</th>
                </tr>
              </thead>
              <tbody>
                {rankingGen.map((r) => (
                  <tr
                    key={r.plant_id}
                    className="border-t border-white/10 hover:bg-white/[0.06]"
                  >
                    <td className="px-2 py-2 tabular-nums text-muted-foreground">
                      {r.rank}
                    </td>
                    <td className="px-2 py-2 font-medium text-foreground">
                      {plantName.get(r.plant_id) ?? r.plant_id}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {metricFormatter.format(r.total_kwh)}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-muted-foreground">
                      {metricFormatter.format(r.avg_per_day)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "co2" ? (
            <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-white/20 backdrop-blur-sm">
                <tr className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Planta</th>
                  <th className="px-2 py-2">CO₂ (t)</th>
                  <th className="px-2 py-2">Equivalente</th>
                </tr>
              </thead>
              <tbody>
                {rankingCo2.map((r) => (
                  <tr
                    key={r.plant_id}
                    className="border-t border-white/10 hover:bg-white/[0.06]"
                  >
                    <td className="px-2 py-2 tabular-nums text-muted-foreground">
                      {r.rank}
                    </td>
                    <td className="px-2 py-2 font-medium text-foreground">
                      {plantName.get(r.plant_id) ?? r.plant_id}
                    </td>
                    <td className="px-2 py-2 tabular-nums">
                      {metricFormatter.format(r.tons)}
                    </td>
                    <td className="px-2 py-2 text-muted-foreground">
                      {treesEquivalent(r.tons)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}

          {tab === "contract" ? (
            <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-white/20 backdrop-blur-sm">
                <tr className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">Planta</th>
                  <th className="px-2 py-2">Generado (mes)</th>
                  <th className="px-2 py-2">Esperado</th>
                  <th className="px-2 py-2">Δ %</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {contractual.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-2 py-6 text-center text-muted-foreground"
                    >
                      Ninguna planta con compromiso mensual por debajo del
                      mínimo (o sin datos de contrato).
                    </td>
                  </tr>
                ) : (
                  contractual.map((r) => (
                    <tr
                      key={r.plant_id}
                      className="border-t border-white/10 hover:bg-white/[0.06]"
                    >
                      <td className="px-2 py-2 font-medium text-foreground">
                        {plantName.get(r.plant_id) ?? r.plant_id}
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {metricFormatter.format(r.generated)} kWh
                      </td>
                      <td className="px-2 py-2 tabular-nums text-muted-foreground">
                        {metricFormatter.format(r.expected)} kWh
                      </td>
                      <td className="px-2 py-2 tabular-nums text-destructive">
                        {metricFormatter.format(r.deltaPct)}%
                      </td>
                      <td className="px-2 py-2">
                        <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-[0.65rem] font-semibold text-destructive">
                          INCUMPLIMIENTO
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}

          {tab === "freq" ? (
            <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
              <thead className="sticky top-0 bg-white/20 backdrop-blur-sm">
                <tr className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-2 py-2">#</th>
                  <th className="px-2 py-2">Planta</th>
                  <th className="px-2 py-2">Desviaciones (mes)</th>
                  <th className="px-2 py-2">Peor Hz</th>
                  <th className="px-2 py-2">Último incidente</th>
                </tr>
              </thead>
              <tbody>
                {freqByPlant.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-2 py-6 text-center text-muted-foreground"
                    >
                      Sin alarmas de frecuencia en el período.
                    </td>
                  </tr>
                ) : (
                  freqByPlant.map((r, i) => (
                    <tr
                      key={r.plant_id}
                      className="border-t border-white/10 hover:bg-white/[0.06]"
                    >
                      <td className="px-2 py-2 text-muted-foreground">
                        {i + 1}
                      </td>
                      <td className="px-2 py-2 font-medium text-foreground">
                        {plantName.get(r.plant_id) ?? r.plant_id}
                      </td>
                      <td className="px-2 py-2 tabular-nums">{r.count}</td>
                      <td className="px-2 py-2 tabular-nums text-destructive">
                        {r.worst ? `${metricFormatter.format(r.worst)} Hz` : "—"}
                      </td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {r.last
                          ? r.last.toLocaleString("es-CO", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}
