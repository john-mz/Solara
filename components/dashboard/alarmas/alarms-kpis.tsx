"use client";

import { formatDistanceStrict } from "date-fns";
import { es } from "date-fns/locale/es";
import { useAlarmKpis } from "@/lib/firestore-hooks";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

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
        <p className="text-xs text-muted-foreground">Total activas</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(data.totalActive)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Críticas activas</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(data.criticalActive)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Dispositivos offline</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(data.offlineActive)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Tiempo prom. sin resolver</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {formatAvgUnresolved(data.avgUnresolvedMs)}
        </p>
        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
          Promedio desde creación
        </p>
      </div>
    </div>
  );
}
