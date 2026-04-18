"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { PlantasGrid } from "@/components/dashboard/plantas/plantas-grid";
import { PlantasKpis } from "@/components/dashboard/plantas/plantas-kpis";
import {
  getTodayDateString,
  useDailySummariesForDate,
  usePlants,
} from "@/lib/firestore-hooks";
import {
  dashboardFilterPillActive,
  dashboardFilterPillInactive,
} from "@/lib/dashboard-chips";
import type { PlantBrand } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function PlantasPage() {
  const [brand, setBrand] = useState<PlantBrand | "ALL">("ALL");
  const [slaOnly, setSlaOnly] = useState(false);
  const today = getTodayDateString();

  const plantsQuery = usePlants(brand);
  const summariesQuery = useDailySummariesForDate(today);

  const summaryByPlantId = useMemo(() => {
    const m = new Map(
      (summariesQuery.data ?? []).map((s) => [s.plant_id, s] as const)
    );
    return m;
  }, [summariesQuery.data]);

  const breachedIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of summariesQuery.data ?? []) {
      if (s.avg_uptime_percent < 99.5) set.add(s.plant_id);
    }
    return set;
  }, [summariesQuery.data]);

  const displayedPlants = useMemo(() => {
    const list = plantsQuery.data ?? [];
    if (!slaOnly) return list;
    return list.filter((p) => breachedIds.has(p.id));
  }, [plantsQuery.data, slaOnly, breachedIds]);

  const loading = plantsQuery.isLoading || summariesQuery.isLoading;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-1 py-3 sm:py-4"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-primary/70">
          Flota
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Plantas
        </h1>
      </motion.div>

      <PlantasKpis
        plants={plantsQuery.data ?? []}
        todaySummaries={summariesQuery.data}
        isLoading={loading}
      />

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0">Marca</span>
          <select
            value={brand}
            onChange={(e) =>
              setBrand(e.target.value as PlantBrand | "ALL")
            }
            className="rounded-[var(--radius-lg)] border border-white/20 bg-white/15 px-3 py-2 text-sm text-foreground backdrop-blur-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="ALL">Todas</option>
            <option value="deye">Deye</option>
            <option value="huawei">Huawei</option>
            <option value="growatt">Growatt</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => setSlaOnly((v) => !v)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
            slaOnly ? dashboardFilterPillActive : dashboardFilterPillInactive
          )}
        >
          Solo SLA comprometido
        </button>
      </div>

      <PlantasGrid
        plants={displayedPlants}
        summaryByPlantId={summaryByPlantId}
        isLoading={loading}
      />
    </main>
  );
}
