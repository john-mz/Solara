"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { DevicePanel } from "@/components/dashboard/dispositivos/device-panel";
import { DispositivosKpis } from "@/components/dashboard/dispositivos/dispositivos-kpis";
import { DispositivosTable } from "@/components/dashboard/dispositivos/dispositivos-table";
import { PlantSearch } from "@/components/dashboard/shared/plant-search";
import {
  useAllPlantsForSearch,
  useDevices,
  useLatestTelemetryForDevices,
} from "@/lib/firestore-hooks";
import type { PlantDoc, TelemetryDoc } from "@/lib/types";

export default function DispositivosPage() {
  const [plant, setPlant] = useState<PlantDoc | null>(null);
  const [type, setType] = useState<"inverter" | "microinverter" | "ALL">(
    "ALL"
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelErrorsOnly, setPanelErrorsOnly] = useState(false);

  const plantsQuery = useAllPlantsForSearch();
  const devicesQuery = useDevices(plant?.id ?? null, type);
  const devices = useMemo(
    () => devicesQuery.data ?? [],
    [devicesQuery.data]
  );
  const ids = useMemo(() => devices.map((d) => d.id), [devices]);
  const latestQuery = useLatestTelemetryForDevices(ids);

  const latestByDeviceId = useMemo((): Map<string, TelemetryDoc> => {
    return latestQuery.data ?? new Map();
  }, [latestQuery.data]);

  const stats = useMemo(() => {
    let online = 0;
    let error = 0;
    let lastMs = 0;
    for (const d of devices) {
      const t = latestByDeviceId.get(d.id);
      const st = t?.kpis.status;
      if (st === "ONLINE") online += 1;
      if (st === "ERROR") error += 1;
      const ts = d.last_telemetry_at ?? t?.timestamp;
      if (ts) {
        const ms = ts.toMillis();
        if (ms > lastMs) lastMs = ms;
      }
    }
    return {
      online,
      error,
      lastTelemetry: lastMs ? new Date(lastMs) : null,
    };
  }, [devices, latestByDeviceId]);

  const selectedDevice =
    devices.find((d) => d.id === selectedId) ?? null;

  return (
    <main className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-1 py-3 sm:py-4"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-foreground/70">
          Inventario
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Dispositivos
        </h1>
      </motion.div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <PlantSearch
          plants={plantsQuery.data}
          value={plant}
          onChange={(p) => {
            setPlant(p);
            setSelectedId(null);
          }}
          className="w-full sm:max-w-md"
        />
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Tipo</span>
          <select
            value={type}
            onChange={(e) =>
              setType(
                e.target.value as "inverter" | "microinverter" | "ALL"
              )
            }
            className="rounded-[var(--radius-lg)] border border-white/20 bg-white/15 px-3 py-2 text-sm text-foreground backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Todos</option>
            <option value="inverter">Inverter</option>
            <option value="microinverter">Microinverter</option>
          </select>
        </label>
      </div>

      {!plant ? (
        <p className="text-sm text-muted-foreground">
          Busca y selecciona una planta para ver sus dispositivos.
        </p>
      ) : (
        <>
          <DispositivosKpis
            total={devices.length}
            online={stats.online}
            error={stats.error}
            lastTelemetry={stats.lastTelemetry}
            isLoading={devicesQuery.isLoading || latestQuery.isLoading}
          />
          <DispositivosTable
            devices={devices}
            latestByDeviceId={latestByDeviceId}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            isLoading={devicesQuery.isLoading || latestQuery.isLoading}
          />
        </>
      )}

      <DevicePanel
        open={Boolean(selectedId && selectedDevice)}
        device={selectedDevice}
        errorsOnly={panelErrorsOnly}
        onErrorsOnlyChange={setPanelErrorsOnly}
        onClose={() => setSelectedId(null)}
      />
    </main>
  );
}
