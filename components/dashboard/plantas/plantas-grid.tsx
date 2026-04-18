"use client";

import {
  dashboardBrandBadgeClass,
  dashboardChipDanger,
  dashboardChipNeutral,
  dashboardChipOnline,
  dashboardChipWarning,
} from "@/lib/dashboard-chips";
import type { DailySummaryDoc, PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});

function statusPill(uptime: number | undefined) {
  if (uptime == null) {
    return {
      label: "Sin datos hoy",
      className: dashboardChipNeutral,
    };
  }
  if (uptime >= 99.5) {
    return {
      label: "En línea",
      className: dashboardChipOnline,
    };
  }
  if (uptime >= 95) {
    return {
      label: "Advertencia",
      className: dashboardChipWarning,
    };
  }
  return {
    label: "SLA comprometido",
    className: dashboardChipDanger,
  };
}

export type PlantasGridProps = {
  plants: PlantDoc[];
  summaryByPlantId: Map<string, DailySummaryDoc>;
  isLoading: boolean;
};

export function PlantasGrid({
  plants,
  summaryByPlantId,
  isLoading,
}: PlantasGridProps) {
  if (isLoading) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pb-2 sm:grid-cols-2 lg:grid-cols-3 scrollbar-hide">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-[var(--radius-xl)] border border-white/15 bg-white/10"
          />
        ))}
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No hay plantas con este filtro.
      </p>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pb-2 sm:grid-cols-2 lg:grid-cols-3 scrollbar-hide">
      {plants.map((p) => {
        const s = summaryByPlantId.get(p.id);
        const uptime = s?.avg_uptime_percent;
        const pill = statusPill(uptime);
        const expected =
          p.contract_commitments?.expected_uptime_percent ?? 99.5;
        return (
          <article
            key={p.id}
            className={cn(cardPaper, "flex flex-col gap-2 p-4")}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                  dashboardBrandBadgeClass(p.brand)
                )}
              >
                {p.brand}
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                  pill.className
                )}
              >
                {pill.label}
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-foreground">
              {p.name}
            </h2>
            <p className="text-xs text-muted-foreground">
              {p.location} · {metricFormatter.format(p.installed_capacity_kw)} kW
            </p>
            <div className="grid grid-cols-2 gap-2 border-t border-white/15 pt-2 text-xs">
              <div>
                <span className="text-muted-foreground">Uptime hoy</span>
                <p className="font-semibold tabular-nums text-foreground">
                  {uptime != null ? `${metricFormatter.format(uptime)}%` : "—"}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Energía hoy</span>
                <p className="font-semibold tabular-nums text-foreground">
                  {s != null
                    ? `${metricFormatter.format(s.total_energy_kwh)} kWh`
                    : "—"}
                </p>
              </div>
            </div>
            <p className="text-[0.65rem] text-muted-foreground">
              SLA contractual: {metricFormatter.format(expected)}% esperado
              {p.contract_commitments?.expected_energy_kwh_month != null
                ? ` · ${metricFormatter.format(p.contract_commitments.expected_energy_kwh_month)} kWh/mes`
                : ""}
            </p>
          </article>
        );
      })}
    </div>
  );
}
