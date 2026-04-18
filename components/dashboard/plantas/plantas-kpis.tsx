"use client";

import { KpiCard } from "@/components/dashboard/shared/kpi-card";
import type { DailySummaryDoc, PlantDoc } from "@/lib/types";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});

export type PlantasKpisProps = {
  plants: PlantDoc[];
  todaySummaries: DailySummaryDoc[] | undefined;
  isLoading: boolean;
};

export function PlantasKpis({
  plants,
  todaySummaries,
  isLoading,
}: PlantasKpisProps) {
  let online = 0;
  let slaBreached = 0;
  let genToday = 0;
  for (const s of todaySummaries ?? []) {
    genToday += s.total_energy_kwh;
    if (s.avg_uptime_percent >= 99.5) online += 1;
    if (s.avg_uptime_percent < 99.5) slaBreached += 1;
  }

  if (isLoading) {
    return (
      <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[4.5rem] animate-pulse rounded-[var(--radius-xl)] border border-white/15 bg-white/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-4">
      <KpiCard
        icon="🏭"
        label="Total plantas"
        value={metricFormatter.format(plants.length)}
      />
      <KpiCard
        icon="✅"
        label="En línea (SLA hoy)"
        value={metricFormatter.format(online)}
        sublabel="Resumen del día ≥ 99.5% uptime"
      />
      <KpiCard
        icon="⚠️"
        label="SLA comprometido hoy"
        value={metricFormatter.format(slaBreached)}
      />
      <KpiCard
        icon="⚡"
        label="Generación total hoy"
        value={`${metricFormatter.format(genToday)} kWh`}
      />
    </div>
  );
}
