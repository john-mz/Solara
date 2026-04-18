"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  differenceInCalendarDays,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";
import { es } from "date-fns/locale/es";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { fetchDailySummaries, type DailySummaryRow } from "@/lib/plant-queries";
import {
  dashboardBrandBadgeClass,
  dashboardSegmentedActive,
  dashboardSegmentedInactive,
} from "@/lib/dashboard-chips";
import type { PlantDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

const PEAK_SUN_HOURS_CO = 4.5;
/** kg CO₂ absorbed per tree per year (rough equivalence for copy) */
const KG_CO2_PER_TREE_YEAR = 21;

export type PlantRangeKey = "day" | "two_weeks" | "month" | "year";

const RANGE_LABELS: Record<PlantRangeKey, string> = {
  day: "Día",
  two_weeks: "2 Semanas",
  month: "Mes",
  year: "Año",
};

const metricFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 1,
});

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const co2Formatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 3,
});

function getRangeBounds(key: PlantRangeKey): { start: string; end: string } {
  const end = new Date();
  const endStr = format(end, "yyyy-MM-dd");
  switch (key) {
    case "day":
      return { start: endStr, end: endStr };
    case "two_weeks": {
      const start = subDays(end, 13);
      return { start: format(start, "yyyy-MM-dd"), end: endStr };
    }
    case "month": {
      const start = startOfMonth(end);
      return { start: format(start, "yyyy-MM-dd"), end: endStr };
    }
    case "year": {
      const start = startOfYear(end);
      return { start: format(start, "yyyy-MM-dd"), end: endStr };
    }
  }
}

function daysInInclusiveRange(start: string, end: string): number {
  return differenceInCalendarDays(parseISO(end), parseISO(start)) + 1;
}

function aggregateMetrics(rows: DailySummaryRow[]) {
  let totalKwh = 0;
  let totalSavings = 0;
  let totalCo2 = 0;
  let uptimeSum = 0;
  let uptimeCount = 0;
  for (const r of rows) {
    totalKwh += r.total_energy_kwh;
    totalSavings += r.financial_savings;
    totalCo2 += r.co2_mitigated_tons;
    uptimeSum += r.avg_uptime_percent;
    uptimeCount += 1;
  }
  const avgUptime = uptimeCount > 0 ? uptimeSum / uptimeCount : 0;
  return { totalKwh, totalSavings, totalCo2, avgUptime };
}

function performanceRatioPercent(
  totalKwh: number,
  installedKw: number,
  days: number
): number | null {
  if (installedKw <= 0 || days <= 0) return null;
  const theoretical = installedKw * PEAK_SUN_HOURS_CO * days;
  if (theoretical <= 0) return null;
  return (totalKwh / theoretical) * 100;
}

function uptimeToneClass(pct: number) {
  if (pct >= 99.5) return "text-emerald-800 dark:text-emerald-500";
  if (pct >= 90) return "text-amber-800 dark:text-amber-500";
  return "text-destructive";
}

function uptimeBarClass(pct: number) {
  if (pct >= 99.5) return "bg-emerald-800 dark:bg-emerald-500";
  if (pct >= 90) return "bg-amber-800 dark:bg-amber-500";
  return "bg-destructive";
}

type ChartPoint = {
  label: string;
  dateKey: string;
  total_energy_kwh: number;
};

function buildChartPoints(
  rows: DailySummaryRow[],
  range: PlantRangeKey
): ChartPoint[] {
  if (range !== "year") {
    return rows.map((r) => ({
      label: format(parseISO(r.date), "d MMM", { locale: es }),
      dateKey: r.date,
      total_energy_kwh: r.total_energy_kwh,
    }));
  }
  const weekMap = new Map<string, number>();
  for (const r of rows) {
    const d = parseISO(r.date);
    const y = getISOWeekYear(d);
    const w = getISOWeek(d);
    const key = `${y}-S${String(w).padStart(2, "0")}`;
    weekMap.set(key, (weekMap.get(key) ?? 0) + r.total_energy_kwh);
  }
  return [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, total_energy_kwh]) => ({
      label: key,
      dateKey: key,
      total_energy_kwh,
    }));
}

function treesEquivalent(tonsCo2: number): number {
  const kg = tonsCo2 * 1000;
  if (kg <= 0) return 0;
  return Math.round(kg / KG_CO2_PER_TREE_YEAR);
}

function kmCarEquivalent(tonsCo2: number): number {
  /** ~0.12 kg CO₂ / km passenger car rough average */
  const kgPerKm = 0.12;
  const kg = tonsCo2 * 1000;
  if (kg <= 0) return 0;
  return Math.round(kg / kgPerKm);
}

/**
 * Picks an illustration based on installed capacity (kW).
 * Thresholds ensure all 6 images are reachable:
 *   ≤  3 kW → campestre-pequeña  (small rural residential)
 *   ≤  8 kW → campestre-grande   (large rural residential)
 *   ≤ 20 kW → moderna            (modern house)
 *   ≤ 60 kW → edificio           (apartment/office building)
 *   ≤150 kW → gasolinera         (commercial / gas station)
 *   > 150 kW → fábrica           (industrial)
 */
export function illustrationFor(kw: number): { src: string; alt: string } {
  if (kw <= 3)
    return { src: "/illustrations/campestre-pequeña.png", alt: "Casa campestre pequeña con paneles solares" };
  if (kw <= 8)
    return { src: "/illustrations/campestre-grande.png", alt: "Casa campestre grande con paneles solares" };
  if (kw <= 20)
    return { src: "/illustrations/moderna.png", alt: "Casa moderna con paneles solares" };
  if (kw <= 60)
    return { src: "/illustrations/edificio.png", alt: "Edificio con paneles solares" };
  if (kw <= 150)
    return { src: "/illustrations/gasolinera.png", alt: "Gasolinera con paneles solares" };
  return { src: "/illustrations/fábrica.png", alt: "Fábrica con paneles solares" };
}

type PlantDashboardProps = {
  plant: PlantDoc;
  onBack?: () => void;
};

export function PlantDashboard({ plant, onBack }: PlantDashboardProps) {
  const [range, setRange] = useState<PlantRangeKey>("month");
  const bounds = getRangeBounds(range);
  const daysInRange = daysInInclusiveRange(bounds.start, bounds.end);

  const summariesQuery = useQuery({
    queryKey: ["plant-summaries", plant.id, bounds.start, bounds.end],
    queryFn: () =>
      fetchDailySummaries(plant.id, bounds.start, bounds.end),
    staleTime: 60_000,
  });

  const rows = summariesQuery.data ?? [];
  const { totalKwh, totalSavings, totalCo2, avgUptime } = aggregateMetrics(rows);
  const pr = performanceRatioPercent(
    totalKwh,
    plant.installed_capacity_kw,
    daysInRange
  );
  const targetPr = plant.contract_commitments?.target_pr;
  const chartPoints = buildChartPoints(rows, range);

  const sparklinePoints = chartPoints.map((p) => ({
    dateKey: p.dateKey,
    total_energy_kwh: p.total_energy_kwh,
  }));

  const illustration = illustrationFor(plant.installed_capacity_kw);

  async function handleRefresh() {
    await summariesQuery.refetch();
  }

  if (summariesQuery.isLoading && !summariesQuery.data) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-20 sm:pb-5">
        {onBack ? (
          <div className="sticky top-0 z-10 -mx-5 border-b border-white/10 bg-background/80 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
              onClick={onBack}
            >
              ← Volver
            </Button>
          </div>
        ) : null}
        <div className="flex shrink-0 flex-col gap-3 py-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-8 w-56 sm:h-9" />
          </div>
          <Skeleton className="h-9 w-44 rounded-lg" />
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[var(--radius-xl)]" />
          ))}
        </div>
        <div className="mt-3 flex flex-1 flex-col gap-3">
          <Skeleton className="min-h-[260px] w-full flex-1 rounded-[var(--radius-xl)]" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-[var(--radius-xl)]" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-20 sm:pb-5">
      {onBack ? (
        <div className="sticky top-0 z-10 -mx-5 border-b border-white/10 bg-background/80 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={onBack}
          >
            ← Volver
          </Button>
        </div>
      ) : null}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-3 py-4 sm:flex-row sm:items-end sm:justify-between"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <div className="min-w-0 space-y-1">
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-primary/70">
            Mi instalación
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Planta Solar {plant.name}
            </h1>
            <span className="text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground sm:text-base">
              {plant.location}
            </span>
            <span className="text-muted-foreground">·</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                dashboardBrandBadgeClass(plant.brand)
              )}
            >
              {plant.brand}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <div
            className="flex flex-wrap gap-1.5 rounded-[var(--radius-lg)] border border-white/18 bg-white/[0.06] p-1 backdrop-blur-sm"
            role="tablist"
            aria-label="Rango temporal"
          >
            {(Object.keys(RANGE_LABELS) as PlantRangeKey[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={range === k}
                onClick={() => setRange(k)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  range === k ? dashboardSegmentedActive : dashboardSegmentedInactive
                )}
              >
                {RANGE_LABELS[k]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {format(parseISO(bounds.start), "dd MMM yyyy", { locale: es })} —{" "}
              {format(parseISO(bounds.end), "dd MMM yyyy", { locale: es })}
            </p>
            <Button
              size="sm"
              variant="outline"
              disabled={summariesQuery.isFetching}
              onClick={handleRefresh}
            >
              {summariesQuery.isFetching ? "Sincronizando..." : "Sincronizar"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* 3-column × 2-row main grid — mirrors overview layout */}
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-[1fr_1.5fr_1fr] md:grid-rows-[minmax(160px,auto)_minmax(160px,auto)]">

        {/* Row 1, Col 1 — C1 Energía & ahorro */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardPaper, "flex min-h-[160px] min-w-0 flex-col gap-2 p-4 md:min-h-[160px]")}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Energía generada y ahorro
          </p>
          <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {metricFormatter.format(totalKwh)}{" "}
            <span className="text-base font-normal text-muted-foreground">
              kWh
            </span>
          </p>
          <p className="text-sm font-medium tabular-nums text-foreground">
            {copFormatter.format(totalSavings)}{" "}
            <span className="font-normal text-muted-foreground">
              COP ahorrados
            </span>
          </p>
          <div className="mt-auto h-12 min-h-0 w-full">
            {sparklinePoints.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={sparklinePoints}
                  margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="sparkEnergy" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="total_energy_kwh"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    fill="url(#sparkEnergy)"
                    animationDuration={700}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : sparklinePoints.length === 1 ? (
              <div className="flex h-full items-center gap-2">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ background: "var(--color-chart-1)" }}
                />
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {metricFormatter.format(sparklinePoints[0].total_energy_kwh)} kWh hoy
                </span>
              </div>
            ) : (
              <p className="text-[0.7rem] text-muted-foreground">Sin datos en este rango</p>
            )}
          </div>
        </motion.div>

        {/* Row 1, Col 2 — Illustration (no card, bottom fade) */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative flex h-48 min-w-0 flex-col md:h-auto md:min-h-[180px] md:flex-1"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_top,transparent_0%,black_55%)]">
            <Image
              src={illustration.src}
              alt={illustration.alt}
              fill
              className="object-contain object-bottom"
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
          <div className="shrink-0 pb-1 text-center">
            <p className="font-[family-name:var(--font-heading)] text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-foreground/40">
              {plant.name}
            </p>
          </div>
        </motion.div>

        {/* Row 1, Col 3 — C2 Uptime */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardPaper, "flex min-h-[160px] min-w-0 flex-col gap-3 p-4 md:min-h-[160px]")}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.04 }}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Uptime
          </p>
          <p
            className={cn(
              "font-[family-name:var(--font-heading)] text-3xl font-semibold tabular-nums tracking-tight",
              uptimeToneClass(avgUptime)
            )}
          >
            {metricFormatter.format(avgUptime)}
            <span className="text-lg font-normal"> %</span>
          </p>
          <p className="text-[0.7rem] text-muted-foreground">
            Promedio del rango · objetivo típico ≥ 99,5 %
          </p>
          <div className="mt-auto h-2 w-full overflow-hidden rounded-full bg-white/15">
            <motion.div
              className={cn("h-full rounded-full", uptimeBarClass(avgUptime))}
              initial={{ width: "0%" }}
              animate={{ width: `${Math.min(100, Math.max(0, avgUptime))}%` }}
              transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
            />
          </div>
        </motion.div>

        {/* Row 2, Col 1 — C3 Performance ratio */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardPaper, "flex min-h-[160px] min-w-0 flex-col gap-2 p-4 md:min-h-[160px]")}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            Performance ratio
          </p>
          {pr != null ? (
            <>
              <p className="font-[family-name:var(--font-heading)] text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                {metricFormatter.format(pr)}
                <span className="text-lg font-normal text-muted-foreground"> %</span>
              </p>
              {targetPr != null ? (
                <p className="text-xs text-muted-foreground">
                  Meta contractual: {metricFormatter.format(targetPr)} %
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sin meta contractual en planta
                </p>
              )}
              {targetPr != null && targetPr > 0 ? (
                <div className="mt-auto space-y-1">
                  <div className="flex justify-between text-[0.65rem] text-muted-foreground">
                    <span>0 %</span>
                    <span>{metricFormatter.format(targetPr)} % meta</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/15">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: "0%" }}
                      animate={{ width: `${Math.min(100, (pr / targetPr) * 100)}%` }}
                      transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-auto h-2 w-full rounded-full bg-white/15">
                  <motion.div
                    className="h-full rounded-full bg-[var(--color-chart-1)]"
                    initial={{ width: "0%" }}
                    animate={{ width: `${Math.min(100, pr)}%` }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No se puede calcular (capacidad o rango inválido)
            </p>
          )}
          <p className="text-[0.65rem] text-muted-foreground">
            Teórico: {metricFormatter.format(plant.installed_capacity_kw)} kW ×{" "}
            {PEAK_SUN_HOURS_CO} h pico × {daysInRange} d
          </p>
        </motion.div>

        {/* Row 2, Col 2 — Trend chart */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            cardPaper,
            "flex min-h-[220px] min-w-0 flex-col gap-2 overflow-hidden p-4 md:min-h-0"
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Tendencia de generación (kWh)
            </h2>
            <p className="text-xs text-muted-foreground">
              {range === "year" ? "Por semana ISO" : "Por día"}
            </p>
          </div>
          <div className="min-h-0 flex-1">
            {chartPoints.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartPoints}
                  margin={{ top: 16, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="plantTrendFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-border)" strokeDasharray="4 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={16}
                    tickMargin={12}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                    width={48}
                    tickFormatter={(v: number) => `${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-xl)",
                      background: "var(--color-card)",
                      color: "var(--color-card-foreground)",
                    }}
                    formatter={(value) => [
                      `${metricFormatter.format(Number(value ?? 0))} kWh`,
                      "Generación",
                    ]}
                    labelFormatter={(label) => String(label)}
                  />
                  <Area
                    animationDuration={700}
                    dataKey="total_energy_kwh"
                    fill="url(#plantTrendFill)"
                    name="Generación"
                    stroke="var(--color-chart-1)"
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : chartPoints.length === 1 ? (
              <div className="flex h-full min-h-[8rem] flex-col items-center justify-center gap-1">
                <p
                  className="font-[family-name:var(--font-heading)] text-3xl font-semibold tabular-nums tracking-tight"
                  style={{ color: "var(--color-chart-1)" }}
                >
                  {metricFormatter.format(chartPoints[0].total_energy_kwh)}
                  <span className="ml-1 text-base font-normal text-muted-foreground">kWh</span>
                </p>
                <p className="text-xs text-muted-foreground">{chartPoints[0].label}</p>
              </div>
            ) : (
              <div className="flex h-full min-h-[8rem] items-center justify-center text-sm text-muted-foreground">
                Sin datos en daily_summaries para este rango.
              </div>
            )}
          </div>
        </motion.div>

        {/* Row 2, Col 3 — C4 CO₂ */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(cardPaper, "flex min-h-[160px] min-w-0 flex-col gap-2 p-4 md:min-h-[160px]")}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.14 }}
        >
          <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
            CO₂ mitigado
          </p>
          <p className="font-[family-name:var(--font-heading)] text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {co2Formatter.format(totalCo2)}{" "}
            <span className="text-base font-normal text-muted-foreground">t</span>
          </p>
          <p className="text-[0.7rem] leading-snug text-muted-foreground">
            ≈ {treesEquivalent(totalCo2)} árboles plantados (equiv. anual) · ≈{" "}
            {kmCarEquivalent(totalCo2)} km no recorridos en auto
          </p>
        </motion.div>
      </div>

      {/* Table */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className={cn(cardPaper, "mt-3 flex h-[220px] flex-col overflow-hidden")}
        initial={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.35, delay: 0.16 }}
      >
        {/* Card header bar */}
        <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Resumen diario
          </h2>
          {rows.length > 0 && (
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-muted-foreground ring-1 ring-white/15">
              {rows.length} {rows.length === 1 ? "día" : "días"}
            </span>
          )}
        </div>

        {/* Outer container: horizontal scroll for both header and body */}
        <div className="flex min-h-0 flex-1 flex-col overflow-x-auto scrollbar-hide">
          <div className="flex min-h-0 min-w-[520px] flex-1 flex-col text-xs sm:text-sm">

            {/* Column header — outside the vertical scroll area */}
            <table className="w-full table-fixed border-collapse text-left">
              <colgroup>
                <col style={{ width: "110px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "90px" }} />
                <col />
                <col style={{ width: "80px" }} />
              </colgroup>
              <thead>
                <tr className="border-b border-white/20 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground/80">
                  <th className="px-3 py-3">Fecha</th>
                  <th className="px-3 py-3 text-right">kWh</th>
                  <th className="px-3 py-3 text-right">Uptime %</th>
                  <th className="px-3 py-3 text-right">Ahorro COP</th>
                  <th className="px-3 py-3 text-right">CO₂ t</th>
                </tr>
              </thead>
            </table>

            {/* Body — only this part scrolls vertically */}
            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hide">
              <table className="w-full table-fixed border-collapse text-left">
                <colgroup>
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "90px" }} />
                  <col style={{ width: "90px" }} />
                  <col />
                  <col style={{ width: "80px" }} />
                </colgroup>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                        Sin filas para mostrar.
                      </td>
                    </tr>
                  ) : (
                    [...rows]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((r) => (
                        <tr key={r.id} className="border-t border-white/10 hover:bg-white/[0.06]">
                          <td className="px-3 py-2.5 tabular-nums text-foreground">
                            {format(parseISO(r.date), "dd/MM/yyyy", { locale: es })}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {metricFormatter.format(r.total_energy_kwh)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {metricFormatter.format(r.avg_uptime_percent)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {copFormatter.format(r.financial_savings)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {co2Formatter.format(r.co2_mitigated_tons)}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </motion.div>
    </main>
  );
}
