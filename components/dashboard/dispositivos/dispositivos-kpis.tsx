"use client";

import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

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
        <p className="text-xs text-muted-foreground">Total dispositivos</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(total)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Online</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(online)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">En error</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {metricFormatter.format(error)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">Última telemetría</p>
        <p className="mt-0.5 font-semibold tabular-nums text-foreground sm:text-lg">
          {formatLast(lastTelemetry)}
        </p>
      </div>
    </div>
  );
}
