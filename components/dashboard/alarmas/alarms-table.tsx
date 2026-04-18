"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  dashboardSeverityCriticalDot,
  dashboardSeverityWarningDot,
} from "@/lib/dashboard-chips";
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
  return (
    <div
      className={cn(
        cardPaper,
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4"
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto scrollbar-hide">
        <table className="w-full min-w-[640px] border-collapse text-left text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-[oklch(0.97_0.015_85/0.92)] backdrop-blur-sm">
            <tr className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2">Severidad</th>
              <th className="px-2 py-2">Tipo</th>
              <th className="px-2 py-2">Planta</th>
              <th className="px-2 py-2">Dispositivo</th>
              <th className="px-2 py-2">Lectura / umbral</th>
              <th className="px-2 py-2">Hace</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                  Cargando alarmas...
                </td>
              </tr>
            ) : errorMessage ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-destructive">
                  {errorMessage}
                </td>
              </tr>
            ) : alarms.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                  No hay alarmas activas con este filtro.
                </td>
              </tr>
            ) : (
              alarms.map((a) => {
                const plantName =
                  plantNameById.get(a.plant_id) ?? a.plant_id.slice(0, 12);
                const read = a.details?.reading_value;
                const thr = a.details?.threshold_value;
                const readStr =
                  read != null ? String(read) : "—";
                const thrStr =
                  thr != null ? ` / ${thr}` : "";
                return (
                  <tr
                    key={a.id}
                    className="border-t border-white/15 align-middle hover:bg-white/[0.06]"
                  >
                    <td className="px-2 py-2">
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
                    <td className="px-2 py-2 font-medium text-foreground">
                      {alarmTypeLabel(a.type)}
                    </td>
                    <td className="max-w-[140px] truncate px-2 py-2 text-muted-foreground">
                      {plantName}
                    </td>
                    <td className="px-2 py-2 font-mono text-[0.7rem] text-muted-foreground">
                      {a.device_id || "—"}
                    </td>
                    <td className="px-2 py-2 tabular-nums text-muted-foreground">
                      {readStr}
                      {thrStr}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                      {formatDistanceToNow(a.created_at.toDate(), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {hasNextPage ? (
        <div className="shrink-0 border-t border-white/15 pt-3">
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={onLoadMore}
            className="w-full rounded-lg border border-white/20 bg-white/10 py-2 text-sm font-medium text-foreground backdrop-blur-sm hover:bg-white/20 disabled:opacity-50"
          >
            {isFetchingNextPage ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
