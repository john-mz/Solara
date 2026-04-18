"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import {
  dashboardBrandBadgeClass,
  dashboardChipDanger,
  dashboardChipNeutral,
  dashboardChipOnline,
} from "@/lib/dashboard-chips";
import type { DeviceDoc, TelemetryDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

export type DispositivosTableProps = {
  devices: DeviceDoc[];
  latestByDeviceId: Map<string, TelemetryDoc>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
};

export function DispositivosTable({
  devices,
  latestByDeviceId,
  selectedId,
  onSelect,
  isLoading,
}: DispositivosTableProps) {
  return (
    <div
      className={cn(
        cardPaper,
        "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-3 sm:p-4"
      )}
    >
      <div className="min-h-0 flex-1 overflow-auto scrollbar-hide">
        <table className="w-full min-w-[560px] border-collapse text-left text-xs sm:text-sm">
          <thead className="sticky top-0 z-10 bg-white/20 backdrop-blur-sm">
            <tr className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
              <th className="px-2 py-2">Estado</th>
              <th className="px-2 py-2">ID</th>
              <th className="px-2 py-2">Marca</th>
              <th className="px-2 py-2">Tipo</th>
              <th className="px-2 py-2">Modelo</th>
              <th className="px-2 py-2">Última lectura</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                  Cargando dispositivos...
                </td>
              </tr>
            ) : devices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 py-8 text-center text-muted-foreground">
                  No hay dispositivos para esta planta.
                </td>
              </tr>
            ) : (
              devices.map((d) => {
                const latest = latestByDeviceId.get(d.id);
                const st = latest?.kpis.status;
                const err = st === "ERROR";
                const active = selectedId === d.id;
                const lastAt = d.last_telemetry_at ?? latest?.timestamp;
                return (
                  <tr
                    key={d.id}
                    className={cn(
                      "cursor-pointer border-t border-white/15 align-middle hover:bg-white/[0.06]",
                      active && "bg-white/10"
                    )}
                    onClick={() => onSelect(d.id)}
                  >
                    <td className="px-2 py-2">
                      {err ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold",
                            dashboardChipDanger
                          )}
                        >
                          ERROR
                        </span>
                      ) : st === "ONLINE" ? (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.65rem] font-medium",
                            dashboardChipOnline
                          )}
                        >
                          ONLINE
                        </span>
                      ) : (
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.65rem]",
                            dashboardChipNeutral
                          )}
                        >
                          {st ?? "—"}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 font-mono text-[0.7rem] text-foreground">
                      {d.original_id}
                    </td>
                    <td className="px-2 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase",
                          dashboardBrandBadgeClass(d.brand)
                        )}
                      >
                        {d.brand}
                      </span>
                    </td>
                    <td className="px-2 py-2 capitalize text-muted-foreground">
                      {d.type}
                    </td>
                    <td className="max-w-[120px] truncate px-2 py-2 text-muted-foreground">
                      {d.model || "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2 text-muted-foreground">
                      {lastAt
                        ? formatDistanceToNow(lastAt.toDate(), {
                            addSuffix: true,
                            locale: es,
                          })
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
