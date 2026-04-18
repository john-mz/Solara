"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale/es";
import { AnimatePresence, motion } from "framer-motion";
import { useDeviceTelemetry } from "@/lib/firestore-hooks";
import type { DeviceDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 2,
});

export type DevicePanelProps = {
  open: boolean;
  device: DeviceDoc | null;
  errorsOnly: boolean;
  onErrorsOnlyChange: (v: boolean) => void;
  onClose: () => void;
};

export function DevicePanel({
  open,
  device,
  errorsOnly,
  onErrorsOnlyChange,
  onClose,
}: DevicePanelProps) {
  const tel = useDeviceTelemetry(device?.id ?? null, errorsOnly);

  return (
    <AnimatePresence>
      {open && device ? (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar panel"
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/20 bg-background/95 shadow-2xl backdrop-blur-md"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-start justify-between gap-2 border-b border-white/15 px-4 py-3">
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
                  Telemetría
                </p>
                <h2 className="truncate font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
                  {device.original_id}
                </h2>
                <p className="truncate text-xs text-muted-foreground">
                  {device.model} · {device.brand}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-lg border border-white/20 px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                Cerrar
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-2">
              <span className="text-xs text-muted-foreground">
                Últimas lecturas
              </span>
              <label className="flex cursor-pointer items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={errorsOnly}
                  onChange={(e) => onErrorsOnlyChange(e.target.checked)}
                  className="rounded border-border"
                />
                Solo errores
              </label>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 scrollbar-hide">
              {tel.isLoading ? (
                <p className="p-4 text-sm text-muted-foreground">Cargando...</p>
              ) : !tel.data?.length ? (
                <p className="p-4 text-sm text-muted-foreground">
                  No hay lecturas recientes.
                </p>
              ) : (
                <ul className="space-y-2">
                  {tel.data.map((row) => {
                    const err = row.kpis.status === "ERROR";
                    return (
                      <li
                        key={row.id}
                        className={cn(
                          "rounded-[var(--radius-lg)] border px-3 py-2 text-xs",
                          err
                            ? "border-destructive/40 bg-destructive/10"
                            : "border-white/15 bg-white/10"
                        )}
                      >
                        <p className="font-medium text-foreground">
                          {format(row.timestamp.toDate(), "dd MMM HH:mm:ss", {
                            locale: es,
                          })}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          Energía hoy:{" "}
                          <span className="font-semibold tabular-nums text-foreground">
                            {metricFormatter.format(row.kpis.energy_today_kwh)}{" "}
                            kWh
                          </span>
                        </p>
                        <p className="text-muted-foreground">
                          V / I / Hz:{" "}
                          <span className="tabular-nums text-foreground">
                            {metricFormatter.format(row.kpis.voltage_ac)} V ·{" "}
                            {metricFormatter.format(row.kpis.current_ac)} A ·{" "}
                            {metricFormatter.format(row.kpis.frequency_hz)} Hz
                          </span>
                        </p>
                        <p
                          className={cn(
                            "mt-1 font-semibold",
                            err ? "text-destructive" : "text-foreground"
                          )}
                        >
                          {row.kpis.status}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
