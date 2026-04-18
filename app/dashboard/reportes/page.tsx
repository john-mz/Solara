"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import { ReportesTabs } from "@/components/dashboard/reportes/reportes-tabs";
import {
  useFrequencyAlarmsForMonth,
  useMonthlySummaries,
  usePlants,
} from "@/lib/firestore-hooks";

export default function ReportesPage() {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();

  const monthLabel = now.toLocaleString("es-CO", {
    month: "long",
    year: "numeric",
  });

  const daysInSample = useMemo(() => {
    const start = new Date(year, monthIndex, 1);
    const end = new Date();
    return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  }, [year, monthIndex]);

  const summariesQuery = useMonthlySummaries(year, monthIndex);
  const plantsQuery = usePlants("ALL");
  const freqQuery = useFrequencyAlarmsForMonth(year, monthIndex);

  const loading =
    summariesQuery.isLoading || plantsQuery.isLoading || freqQuery.isLoading;

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-5">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-1 py-3 sm:py-4"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-primary/70">
          Analítica
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Reportes
        </h1>
      </motion.div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando reportes...</p>
      ) : (
        <ReportesTabs
          summaries={summariesQuery.data ?? []}
          plants={plantsQuery.data ?? []}
          frequencyAlarms={freqQuery.data ?? []}
          monthLabel={monthLabel}
          daysInSample={daysInSample}
        />
      )}
    </main>
  );
}
