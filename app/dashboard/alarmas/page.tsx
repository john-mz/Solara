"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { AlarmsKpis } from "@/components/dashboard/alarmas/alarms-kpis";
import { AlarmsTable } from "@/components/dashboard/alarmas/alarms-table";
import { PlantSearch } from "@/components/dashboard/shared/plant-search";
import {
  flattenAlarmPages,
  useAlarms,
  useAllPlantsForSearch,
  type AlarmsFilter,
} from "@/lib/firestore-hooks";
import type { PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";

type PillId = "ALL" | "CRITICAL" | "OFFLINE" | "PLANT";

const PILLS: { id: PillId; label: string }[] = [
  { id: "ALL", label: "Todas" },
  { id: "CRITICAL", label: "Críticas" },
  { id: "OFFLINE", label: "Offline >5 min" },
  { id: "PLANT", label: "Por planta" },
];

export default function AlarmasPage() {
  const [pill, setPill] = useState<PillId>("ALL");
  const [plantFilter, setPlantFilter] = useState<PlantDoc | null>(null);

  const filter: AlarmsFilter = useMemo(() => {
    if (pill === "PLANT" && plantFilter) {
      return { plantId: plantFilter.id };
    }
    if (pill === "CRITICAL") return "CRITICAL";
    if (pill === "OFFLINE") return "OFFLINE";
    return "ALL";
  }, [pill, plantFilter]);

  const plantsQuery = useAllPlantsForSearch();
  const alarmsEnabled = pill !== "PLANT" || plantFilter != null;
  const alarmsQuery = useAlarms(filter, alarmsEnabled);

  const plantNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of plantsQuery.data ?? []) {
      m.set(p.id, p.name);
    }
    return m;
  }, [plantsQuery.data]);

  const alarms = flattenAlarmPages(alarmsQuery.data);
  const alarmsErrorMessage = alarmsQuery.isError
    ? "No se pudieron cargar las alarmas. Verifica los indices de Firestore para esta consulta."
    : undefined;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-1 py-3 sm:py-4"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-primary/70">
          Operación
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Alarmas activas
        </h1>
      </motion.div>

      <AlarmsKpis />

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filtros de alarmas"
        >
          {PILLS.map((p) => {
            const active = pill === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setPill(p.id);
                  if (p.id !== "PLANT") setPlantFilter(null);
                }}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                  active
                    ? "bg-gradient-to-br from-[color-mix(in_oklch,var(--primary),white_9%)] to-[color-mix(in_oklch,var(--primary),black_7%)] text-primary-foreground shadow-sm"
                    : "border border-white/20 bg-white/10 text-muted-foreground hover:bg-white/15 hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        {pill === "PLANT" ? (
          <PlantSearch
            plants={plantsQuery.data}
            value={plantFilter}
            onChange={setPlantFilter}
            className="w-full sm:max-w-sm"
          />
        ) : null}
      </div>

      {pill === "PLANT" && !plantFilter ? (
        <p className="text-sm text-muted-foreground">
          Selecciona una planta para ver sus alarmas activas.
        </p>
      ) : (
        <AlarmsTable
          alarms={alarms}
          plantNameById={plantNameById}
          isLoading={alarmsQuery.isLoading}
          errorMessage={alarmsErrorMessage}
          hasNextPage={alarmsQuery.hasNextPage}
          isFetchingNextPage={alarmsQuery.isFetchingNextPage}
          onLoadMore={() => alarmsQuery.fetchNextPage()}
        />
      )}
    </main>
  );
}
