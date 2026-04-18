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
  const showCount = !isLoading && devices.length > 0;

  return (
    <div className={cn(cardPaper, "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden")}>
      {/* Card header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Lista de dispositivos
        </h3>
        {showCount && (
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-muted-foreground ring-1 ring-white/15">
            {devices.length} {devices.length === 1 ? "dispositivo" : "dispositivos"}
          </span>
        )}
      </div>

      {/* Outer container: handles horizontal scroll for both header and body together */}
      <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
        <div className="flex min-h-0 min-w-[560px] flex-1 flex-col text-xs sm:text-sm">

          {/* Column header — outside the vertical scroll area */}
          <table className="w-full table-fixed border-collapse text-left">
            <colgroup>
              <col style={{ width: "90px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "100px" }} />
              <col style={{ width: "120px" }} />
              <col />
            </colgroup>
            <thead>
              <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground/80">
                <th className="px-3 py-3">Estado</th>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Marca</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Modelo</th>
                <th className="px-3 py-3">Última lectura</th>
              </tr>
            </thead>
          </table>

          {/* Body — only this part scrolls vertically */}
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: "90px" }} />
                <col style={{ width: "160px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "100px" }} />
                <col style={{ width: "120px" }} />
                <col />
              </colgroup>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                      Cargando dispositivos...
                    </td>
                  </tr>
                ) : devices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
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
                          "cursor-pointer border-t border-white/10 align-middle hover:bg-white/[0.06]",
                          active && "bg-white/10"
                        )}
                        onClick={() => onSelect(d.id)}
                      >
                        <td className="px-3 py-2.5">
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
                        <td className="px-3 py-2.5 font-mono text-[0.7rem] text-foreground">
                          {d.original_id}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase",
                              dashboardBrandBadgeClass(d.brand)
                            )}
                          >
                            {d.brand}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 capitalize text-muted-foreground">
                          {d.type}
                        </td>
                        <td className="truncate px-3 py-2.5 text-muted-foreground">
                          {d.model || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-muted-foreground">
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
      </div>
    </div>
  );
}
