"use client";

import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale/es";
import { KpiCard } from "@/components/dashboard/shared/kpi-card";
import { useAlarmKpis } from "@/lib/firestore-hooks";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

function formatAvgUnresolved(ms: number | null) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const ref = new Date(Date.now() - ms);
  return formatDistanceStrict(ref, new Date(), {
    locale: es,
    unit: "minute",
    roundingMethod: "floor",
  });
}

export function AlarmsKpis() {
  const { data, isLoading } = useAlarmKpis();

  if (isLoading || !data) {
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
        icon="🔴"
        label="Total alarmas activas"
        value={metricFormatter.format(data.totalActive)}
      />
      <KpiCard
        icon="🟡"
        label="Críticas activas"
        value={metricFormatter.format(data.criticalActive)}
      />
      <KpiCard
        icon="⚫"
        label="Dispositivos offline"
        value={metricFormatter.format(data.offlineActive)}
      />
      <KpiCard
        icon="⏱️"
        label="Tiempo prom. sin resolver"
        value={formatAvgUnresolved(data.avgUnresolvedMs)}
        sublabel="Promedio desde creación"
      />
    </div>
  );
}
