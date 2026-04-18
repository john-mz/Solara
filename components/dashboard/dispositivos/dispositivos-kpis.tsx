"use client";

import { KpiCard } from "@/components/dashboard/shared/kpi-card";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

export type DispositivosKpisProps = {
  total: number;
  online: number;
  error: number;
  lastTelemetry: Date | null;
  isLoading: boolean;
};

function formatLast(ts: Date | null) {
  if (!ts) return "—";
  return ts.toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function DispositivosKpis({
  total,
  online,
  error,
  lastTelemetry,
  isLoading,
}: DispositivosKpisProps) {
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
        icon="📟"
        label="Total dispositivos"
        value={metricFormatter.format(total)}
      />
      <KpiCard
        icon="✅"
        label="Online"
        value={metricFormatter.format(online)}
      />
      <KpiCard
        icon="🔴"
        label="En error"
        value={metricFormatter.format(error)}
      />
      <KpiCard
        icon="⏱️"
        label="Última telemetría"
        value={formatLast(lastTelemetry)}
      />
    </div>
  );
}
