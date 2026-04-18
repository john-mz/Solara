"use client";

import type { DailySummaryDoc, PlantBrand, PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
});

const BRANDS: PlantBrand[] = ["deye", "huawei", "growatt"];

const BRAND_LABEL: Record<PlantBrand, string> = {
  deye: "Deye",
  huawei: "Huawei",
  growatt: "Growatt",
};

function computeBrandErrorStats(
  plants: PlantDoc[],
  summaries: DailySummaryDoc[] | undefined
) {
  const summaryByPlantId = new Map(
    (summaries ?? []).map((s) => [s.plant_id, s] as const)
  );

  const result: Record<PlantBrand, { total: number; errorCount: number }> = {
    deye: { total: 0, errorCount: 0 },
    huawei: { total: 0, errorCount: 0 },
    growatt: { total: 0, errorCount: 0 },
  };

  for (const p of plants) {
    const stats = result[p.brand];
    stats.total += 1;
    const s = summaryByPlantId.get(p.id);
    if (s && s.avg_uptime_percent < 90) {
      stats.errorCount += 1;
    }
  }
  return result;
}

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
    if (s.avg_uptime_percent < 90) slaBreached += 1;
  }

  const brandErrorStats = computeBrandErrorStats(plants, todaySummaries);

  if (isLoading) {
    return (
      <div className="flex shrink-0 flex-col gap-3">
        <div
          className={cn(
            cardPaper,
            "h-[4.75rem] animate-pulse border border-white/15 bg-white/10"
          )}
        />
        <div
          className={cn(
            cardPaper,
            "h-[4.75rem] animate-pulse border border-white/15 bg-white/10"
          )}
        />
      </div>
    );
  }

  return (
    <div className="flex shrink-0 flex-col gap-3">
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
          <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
            Resumen del día &lt; 90% uptime
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

      <div
        className={cn(
          cardPaper,
          "grid shrink-0 grid-cols-1 gap-x-6 gap-y-3 px-4 py-3 sm:grid-cols-3"
        )}
      >
        {BRANDS.map((brand) => {
          const { total, errorCount } = brandErrorStats[brand];
          const pct =
            total > 0 ? (errorCount / total) * 100 : null;
          const label = BRAND_LABEL[brand];

          return (
            <div key={brand} className="min-w-0">
              <p className="text-xs text-muted-foreground">Error {label}</p>
              <p
                className={cn(
                  "mt-0.5 font-semibold tabular-nums sm:text-lg",
                  pct !== null && pct > 0
                    ? "text-destructive"
                    : "text-foreground"
                )}
              >
                {pct === null ? "—" : `${percentFormatter.format(pct)}%`}
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                {total === 0
                  ? "Sin plantas de esta marca"
                  : `${errorCount} / ${total} plantas con uptime &lt; 90%`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
