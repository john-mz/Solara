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
  const showCount = !isLoading && !errorMessage && alarms.length > 0;

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
        <div className="flex min-h-0 min-w-[640px] flex-1 flex-col text-xs sm:text-sm">

          {/* Column header — outside the vertical scroll area, never hidden by scrolling rows */}
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: "110px" }} />
              <col style={{ width: "200px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "120px" }} />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground/80">
                <th className="px-3 py-3">Severidad</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Planta</th>
                <th className="px-3 py-3">Dispositivo</th>
                <th className="px-3 py-3">Lectura / umbral</th>
                <th className="px-3 py-3">Hace</th>
              </tr>
            </thead>
          </table>

          {/* Body — only this part scrolls vertically */}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: "110px" }} />
                <col style={{ width: "200px" }} />
                <col style={{ width: "140px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "120px" }} />
                <col />
              </colgroup>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      Cargando alarmas...
                    </td>
                  </tr>
                ) : errorMessage ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-destructive">
                      {errorMessage}
                    </td>
                  </tr>
                ) : alarms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
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
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
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
            {isFetchingNextPage ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
