"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  dashboardSeverityCriticalDot,
  dashboardSeverityWarningDot,
} from "@/lib/dashboard-chips";
import { Skeleton } from "@/components/ui/skeleton";
import { AlarmSolutionModal } from "@/components/dashboard/alarmas/alarm-solution-modal";
import type { AlarmDoc, AlarmType } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

function alarmTypeLabel(type: AlarmType) {
  switch (type) {
    case "DEVICE_OFFLINE":
      return "Dispositivo offline";
    case "FREQUENCY_OUT_OF_RANGE":
      return "Frecuencia fuera de rango";
    case "VOLTAGE_OUT_OF_RANGE":
      return "Voltaje fuera de rango";
    case "LOW_GENERATION":
      return "Baja generación";
    default:
      return type;
  }
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
  );
}

export type AlarmsTableProps = {
  alarms: AlarmDoc[];
  plantNameById: Map<string, string>;
  isLoading: boolean;
  errorMessage?: string;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
};

export function AlarmsTable({
  alarms,
  plantNameById,
  isLoading,
  errorMessage,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: AlarmsTableProps) {
  const showCount = !isLoading && !errorMessage && alarms.length > 0;
  const [solutionAlarm, setSolutionAlarm] = useState<AlarmDoc | null>(null);

  return (
    <div
      className={cn(
        cardPaper,
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      )}
    >
      {/* Card header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Lista de alarmas
        </h3>
        {showCount && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-muted-foreground ring-1 ring-white/15">
            {alarms.length} {alarms.length === 1 ? "alarma" : "alarmas"}
          </span>
        )}
      </div>

      {/* Outer container: handles horizontal scroll for both header and body together */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
        <div className="flex min-h-0 min-w-[720px] flex-1 flex-col text-xs sm:text-sm">

          {/* Column header — outside the vertical scroll area, never hidden by scrolling rows */}
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: "100px" }} />
              <col style={{ width: "190px" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "150px" }} />
              <col style={{ width: "110px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "56px" }} />
            </colgroup>
            <thead>
              <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground/80">
                <th className="px-3 py-3">Severidad</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Planta</th>
                <th className="px-3 py-3">Dispositivo</th>
                <th className="px-3 py-3">Lectura / umbral</th>
                <th className="px-3 py-3">Hace</th>
                <th className="px-2 py-3"></th>
              </tr>
            </thead>
          </table>

          {/* Body — only this part scrolls vertically */}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: "100px" }} />
                <col style={{ width: "190px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "150px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "56px" }} />
              </colgroup>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 7 }).map((_, i) => (
                    <tr key={i} className="border-t border-white/10">
                      <td className="px-3 py-2.5"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-3 py-2.5"><Skeleton className="h-5 w-full" /></td>
                      <td className="px-3 py-2.5"><Skeleton className="h-5 w-full" /></td>
                      <td className="px-3 py-2.5"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-3 py-2.5"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-3 py-2.5"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-2 py-2.5"><Skeleton className="size-7" /></td>
                    </tr>
                  ))
                ) : errorMessage ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-destructive">
                      {errorMessage}
                    </td>
                  </tr>
                ) : alarms.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                      No hay alarmas activas con este filtro.
                    </td>
                  </tr>
                ) : (
                  alarms.map((a) => {
                    const plantName =
                      plantNameById.get(a.plant_id) ?? a.plant_id.slice(0, 12);
                    const read = a.details?.reading_value;
                    const thr = a.details?.threshold_value;
                    const readStr = read != null ? String(read) : "—";
                    const thrStr = thr != null ? ` / ${thr}` : "";
                    return (
                      <tr
                        key={a.id}
                        className="border-t border-white/10 align-middle hover:bg-white/[0.06]"
                      >
                        <td className="px-3 py-2.5">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className={cn(
                                "size-1.5 shrink-0 rounded-full",
                                a.severity === "CRITICAL"
                                  ? dashboardSeverityCriticalDot
                                  : dashboardSeverityWarningDot
                              )}
                              aria-hidden
                            />
                            <span className="font-medium">{a.severity}</span>
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-foreground">
                          {alarmTypeLabel(a.type)}
                        </td>
                        <td className="truncate px-3 py-2.5 text-muted-foreground">
                          {plantName}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-[0.7rem] text-muted-foreground">
                          {a.device_id || "—"}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                          {readStr}
                          {thrStr}
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">
                          <span className="whitespace-nowrap">
                            {formatDistanceToNow(a.created_at.toDate(), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </span>
                          <span className="block whitespace-nowrap font-mono text-[0.62rem] text-muted-foreground/60">
                            {format(a.created_at.toDate(), "dd/MM/yyyy HH:mm:ss")}
                          </span>
                        </td>
                        <td className="px-2 py-2.5">
                          <button
                            type="button"
                            onClick={() => setSolutionAlarm(a)}
                            title="Ver solución sugerida"
                            className="flex size-7 items-center justify-center rounded-lg border border-border/70 bg-background/50 text-accent transition-all hover:scale-110 hover:bg-accent/10 hover:text-accent active:scale-95"
                          >
                            <LightbulbIcon className="size-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
      {hasNextPage ? (
        <div className="shrink-0 border-t border-white/15 px-4 py-3">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-medium text-foreground backdrop-blur-sm hover:bg-white/20 disabled:opacity-50"
          >
            Cargar más
          </button>
        </div>
      ) : null}

      {/* Solution modal */}
      <AlarmSolutionModal
        alarm={solutionAlarm}
        plantName={
          solutionAlarm
            ? plantNameById.get(solutionAlarm.plant_id) ?? undefined
            : undefined
        }
        onClose={() => setSolutionAlarm(null)}
      />
    </div>
  );
}
