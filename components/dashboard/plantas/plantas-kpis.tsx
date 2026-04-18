"use client";

import type { DailySummaryDoc, PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

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
      <div
        className={cn(
          cardPaper,
          "h-[4.75rem] shrink-0 animate-pulse border border-white/15 bg-white/10"
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        cardPaper,
        "grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-4"
      )}
    >
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Total plantas</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(plants.length)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">En línea (SLA hoy)</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(online)}
        </p>
        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
          Resumen del día ≥ 99.5% uptime
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">SLA comprometido hoy</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(slaBreached)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Generación total hoy</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(genToday)}{" "}
          <span className="font-normal text-muted-foreground">kWh</span>
        </p>
      </div>
    </div>
  );
}
