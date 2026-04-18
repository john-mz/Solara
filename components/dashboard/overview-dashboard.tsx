"use client";

import { useQuery } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { motion } from "framer-motion";
import Image from "next/image";
import { toast } from "sonner";
import { EnergyChart } from "@/components/dashboard/energy-chart";
import { Button } from "@/components/ui/button";
import {
  getMockFleetOverview,
  getMockSolarOverview,
  type Alarm,
  type Plant,
} from "@/lib/mock-solar-data";
import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

const metricFormatter = new Intl.NumberFormat("es-PE", {
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

function brandBadgeClass(brand: Plant["brand"]) {
  switch (brand) {
    case "deye":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300 ring-1 ring-amber-500/35";
    case "huawei":
      return "bg-red-500/10 text-red-800 dark:text-red-300 ring-1 ring-red-500/30";
    case "growatt":
      return "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 ring-1 ring-emerald-500/30";
    default:
      return "bg-muted text-muted-foreground ring-1 ring-border";
  }
}

function statusLabel(status: Plant["status"]) {
  switch (status) {
    case "ONLINE":
      return "En linea";
    case "OFFLINE":
      return "Fuera de linea";
    case "WARNING":
      return "Advertencia";
    default:
      return status;
  }
}

function statusPillClass(status: Plant["status"]) {
  switch (status) {
    case "ONLINE":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300";
    case "OFFLINE":
      return "bg-muted text-muted-foreground";
    case "WARNING":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
    default:
      return "bg-muted";
  }
}

function alarmTypeLabel(type: Alarm["type"]) {
  switch (type) {
    case "DEVICE_OFFLINE":
      return "Dispositivo offline";
    case "FREQUENCY_OUT_OF_RANGE":
      return "Frecuencia fuera de rango";
    case "VOLTAGE_OUT_OF_RANGE":
      return "Voltaje fuera de rango";
    case "LOW_GENERATION":
      return "Baja generacion";
    default:
      return type;
  }
}

export function OverviewDashboard() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["solar-overview"],
    queryFn: getMockSolarOverview,
    refetchInterval: 60_000,
  });

  const fleetQuery = useQuery({
    queryKey: ["fleet-overview"],
    queryFn: getMockFleetOverview,
    refetchInterval: 60_000,
  });

  async function handleManualRefresh() {
    const [solarResult, fleetResult] = await Promise.all([
      refetch(),
      fleetQuery.refetch(),
    ]);
    if (solarResult.data && fleetResult.data) {
      toast.success("Telemetria sincronizada", {
        description: `Ultima actualizacion ${format(new Date(solarResult.data.updatedAt), "HH:mm:ss")}`,
      });
      return;
    }
    toast.error("No se pudo actualizar la telemetria");
  }

  const fleet = fleetQuery.data;
  const isLoadingFleet = fleetQuery.isLoading;

  if (!data || !fleet || isLoadingFleet) {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5">
        <motion.p
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
        >
          Cargando...
        </motion.p>
      </main>
    );
  }

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-20 md:overflow-hidden sm:pb-5">
      {/* Page header — title + actions, between topbar and grid */}
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 items-end justify-between gap-4 py-4"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-primary/70">
            Solar Power Report
          </p>
          <h1 className="mt-0.5 font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {data.siteName}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-xs text-muted-foreground">
            {format(new Date(data.updatedAt), "dd MMM yyyy · HH:mm")}
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={isFetching || fleetQuery.isFetching}
            onClick={handleManualRefresh}
          >
            {isFetching || fleetQuery.isFetching
              ? "Sincronizando..."
              : "Sincronizar"}
          </Button>
        </div>
      </motion.div>

      <div className="grid w-full grid-cols-1 gap-3 md:min-h-0 md:flex-1 md:grid-cols-[1fr_1.5fr_1fr] md:grid-rows-2">
        {/* Card A — metrics */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            cardPaper,
            "flex min-h-[180px] min-w-0 flex-col justify-between gap-3 p-4 md:min-h-0"
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35 }}
        >
          <div className="grid min-h-0 grid-cols-3 gap-2 text-xs sm:text-sm">
            <div>
              <p className="text-muted-foreground">Potencia</p>
              <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                {metricFormatter.format(data.currentPowerKw)}{" "}
                <span className="font-normal text-muted-foreground">kW</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Diaria</p>
              <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                {metricFormatter.format(data.dailyGenerationKwh)}{" "}
                <span className="font-normal text-muted-foreground">kWh</span>
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Eficiencia</p>
              <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                {metricFormatter.format(data.efficiency)}
                <span className="font-normal text-muted-foreground"> %</span>
              </p>
            </div>
          </div>
          <p className="text-[0.7rem] text-muted-foreground">
            {data.status === "online"
              ? "Operacion estable"
              : "Dos inversores con latencia"}
          </p>
        </motion.div>

        {/* Center top — floating house image (no card) */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative flex h-48 min-w-0 flex-col md:h-auto md:min-h-0 md:flex-1"
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {/* image with bottom fade */}
          <div className="relative min-h-0 flex-1 [mask-image:linear-gradient(to_top,transparent_0%,black_55%)]">
            <Image
              src="/casacolonial-paneles.png"
              alt="Vivienda con paneles solares"
              fill
              className="object-contain object-bottom"
              priority
              sizes="(max-width: 768px) 100vw, 40vw"
            />
          </div>
          {/* site label */}
          <div className="shrink-0 pb-1 text-center">
            <p className="font-[family-name:var(--font-heading)] text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-foreground/40">
              {data.siteName}
            </p>
          </div>
        </motion.div>

        {/* Card C — environmental + fleet kW */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            cardPaper,
            "flex min-h-[180px] min-w-0 flex-col gap-3 overflow-hidden p-4 md:min-h-0"
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.08 }}
        >
          <h2 className="shrink-0 text-sm font-semibold tracking-tight text-foreground">
            Impacto y capacidad
          </h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 text-sm scrollbar-hide">
            <div>
              <p className="text-muted-foreground">CO2 mitigado (hoy)</p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl">
                {co2Formatter.format(fleet.totalCo2Tons)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  t
                </span>
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                ~0.4 kg CO2 / kWh
              </p>
            </div>
            <div className="border-t border-white/20 pt-3">
              <p className="text-muted-foreground">Ahorro estimado</p>
              <p className="mt-0.5 text-base font-semibold tabular-nums tracking-tight text-foreground sm:text-lg">
                {copFormatter.format(fleet.totalFinancialSavings)}
              </p>
              <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                ~500 COP / kWh
              </p>
            </div>
            <div className="border-t border-white/20 pt-3">
              <p className="text-muted-foreground">Capacidad instalada</p>
              <p className="mt-0.5 font-semibold tabular-nums text-foreground">
                {metricFormatter.format(fleet.totalInstalledKw)}{" "}
                <span className="font-normal text-muted-foreground">kW</span>
              </p>
              <p className="mt-1 text-[0.65rem] text-muted-foreground">
                {fleet.plants.length} plantas · energia hoy{" "}
                {metricFormatter.format(fleet.totalEnergyTodayKwh)} kWh
              </p>
            </div>
          </div>
        </motion.div>

        {/* Card B — plants list */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            cardPaper,
            "flex min-h-[180px] min-w-0 flex-col gap-2 overflow-hidden p-4 md:min-h-0"
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          aria-labelledby="plants-heading"
        >
          <h2
            id="plants-heading"
            className="shrink-0 text-sm font-semibold tracking-tight text-foreground"
          >
            Plantas
          </h2>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
            {fleet.plants.map((plant) => (
              <li
                key={plant.id}
                className="rounded-[var(--radius-lg)] border border-white/18 bg-white/[0.07] px-2.5 py-2 backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                      brandBadgeClass(plant.brand)
                    )}
                  >
                    {plant.brand}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[0.65rem] font-medium",
                      statusPillClass(plant.status)
                    )}
                  >
                    {statusLabel(plant.status)}
                  </span>
                </div>
                <p className="mt-1 text-xs font-semibold text-foreground sm:text-sm">
                  {plant.name}
                </p>
                <p className="text-[0.7rem] text-muted-foreground">
                  {plant.location} · {plant.installed_capacity_kw} kW
                </p>
                <div className="mt-1.5 grid grid-cols-2 gap-2 text-[0.7rem]">
                  <div>
                    <span className="text-muted-foreground">Hoy</span>
                    <span className="ml-1 font-semibold tabular-nums text-foreground">
                      {metricFormatter.format(plant.energy_today_kwh)} kWh
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="ml-1 font-semibold tabular-nums text-foreground">
                      {metricFormatter.format(plant.avg_uptime_percent)}%
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="shrink-0 text-[0.65rem] text-muted-foreground">
            Flota actualizada {format(new Date(fleet.updatedAt), "HH:mm:ss")}
          </p>
        </motion.div>

        {/* Card E — chart */}
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
              Generacion horaria
            </h2>
            <p className="text-xs text-muted-foreground">
              {format(new Date(data.updatedAt), "dd/MM/yyyy")}
            </p>
          </div>
          <div className="min-h-0 flex-1">
            <EnergyChart points={data.points} />
          </div>
        </motion.div>

        {/* Card D — alarms */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            cardPaper,
            "flex min-h-[180px] min-w-0 flex-col gap-2 overflow-hidden p-4 md:min-h-0"
          )}
          initial={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.35, delay: 0.14 }}
          aria-labelledby="alarms-heading"
        >
          <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-2">
            <h2
              id="alarms-heading"
              className="text-sm font-semibold tracking-tight text-foreground"
            >
              Alarmas activas
            </h2>
            <span className="text-[0.7rem] text-muted-foreground">
              {fleet.activeAlarms.length} en{" "}
              <code className="rounded bg-white/15 px-1 text-[0.65rem] backdrop-blur-sm">
                alarms
              </code>
            </span>
          </div>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 scrollbar-hide">
            {fleet.activeAlarms.map((alarm) => (
              <li
                key={alarm.id}
                className="rounded-[var(--radius-lg)] border border-white/18 bg-white/[0.08] px-2.5 py-2 backdrop-blur-sm"
              >
                <div className="flex gap-2">
                  <span
                    className={cn(
                      "mt-1 size-1.5 shrink-0 rounded-full",
                      alarm.severity === "CRITICAL"
                        ? "bg-destructive"
                        : "bg-amber-500"
                    )}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 gap-y-0.5">
                      <span className="text-xs font-medium text-foreground">
                        {alarmTypeLabel(alarm.type)}
                      </span>
                      <span className="rounded-md bg-white/16 px-1 py-0.5 text-[0.6rem] font-medium text-muted-foreground backdrop-blur-sm">
                        {alarm.severity}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-muted-foreground">
                      {alarm.description}
                    </p>
                    <p className="mt-1 font-mono text-[0.6rem] text-muted-foreground">
                      {alarm.device_id}
                    </p>
                    <p className="text-[0.6rem] text-muted-foreground">
                      {formatDistanceToNow(new Date(alarm.created_at), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </main>
  );
}
