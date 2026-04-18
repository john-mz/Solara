"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { EnergyChart } from "@/components/dashboard/energy-chart";
import { Button } from "@/components/ui/button";
import { getMockSolarOverview } from "@/lib/mock-solar-data";

const metricFormatter = new Intl.NumberFormat("es-PE", {
  maximumFractionDigits: 1,
});

type MetricCardProps = {
  label: string;
  value: string;
  helper: string;
};

function MetricCard({ label, value, helper }: MetricCardProps) {
  return (
    <div className="rounded-4xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-card-foreground">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
    </div>
  );
}

export function OverviewDashboard() {
  const { resolvedTheme, setTheme } = useTheme();
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["solar-overview"],
    queryFn: getMockSolarOverview,
    refetchInterval: 60_000,
  });

  const isDark = resolvedTheme === "dark";

  async function handleManualRefresh() {
    const result = await refetch();

    if (result.data) {
      toast.success("Telemetria sincronizada", {
        description: `Ultima actualizacion ${format(
          new Date(result.data.updatedAt),
          "HH:mm:ss"
        )}`,
      });
      return;
    }

    toast.error("No se pudo actualizar la telemetria");
  }

  if (!data) {
    return (
      <main className="flex min-h-full flex-1 items-center justify-center px-6 py-16">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="rounded-4xl border border-border bg-card px-6 py-5 text-sm text-muted-foreground shadow-sm"
          initial={{ opacity: 0, y: 12 }}
        >
          Cargando dashboard base...
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-full flex-1 px-6 py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm backdrop-blur"
          initial={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.45 }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Solara control center
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-card-foreground">
                {data.siteName}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Base inicial para monitoreo solar con modo oscuro, polling de datos,
                notificaciones y visualizacion de rendimiento horario.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTheme(isDark ? "light" : "dark")}
              >
                {isDark ? "Cambiar a claro" : "Cambiar a oscuro"}
              </Button>
              <Button size="sm" onClick={handleManualRefresh}>
                {isFetching ? "Sincronizando..." : "Sincronizar ahora"}
              </Button>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
              Polling cada 60 s con React Query
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Ultima lectura {format(new Date(data.updatedAt), "HH:mm:ss")}
            </span>
            <motion.span
              animate={{ opacity: [0.65, 1, 0.65], scale: [1, 1.03, 1] }}
              className="rounded-full bg-destructive/12 px-3 py-1 text-destructive"
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY }}
            >
              {data.activeAlerts} alertas activas
            </motion.span>
          </div>
        </motion.section>

        <section className="grid gap-4 md:grid-cols-3">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 14 }}
            transition={{ delay: 0.05, duration: 0.35 }}
          >
            <MetricCard
              helper="Potencia instantanea reportada por el middleware"
              label="Potencia actual"
              value={`${metricFormatter.format(data.currentPowerKw)} kW`}
            />
          </motion.div>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 14 }}
            transition={{ delay: 0.1, duration: 0.35 }}
          >
            <MetricCard
              helper="Energia acumulada durante la jornada"
              label="Generacion diaria"
              value={`${metricFormatter.format(data.dailyGenerationKwh)} kWh`}
            />
          </motion.div>
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 14 }}
            transition={{ delay: 0.15, duration: 0.35 }}
          >
            <MetricCard
              helper={data.status === "online" ? "Operacion estable" : "Dos inversores con latencia"}
              label="Eficiencia"
              value={`${metricFormatter.format(data.efficiency)}%`}
            />
          </motion.div>
        </section>

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-border bg-card/80 p-6 shadow-sm backdrop-blur"
          initial={{ opacity: 0, y: 18 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">
                Generacion horaria
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                `recharts` queda listo para reemplazar este mock por tu endpoint
                real sin tocar el componente visual.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Fecha de muestra {format(new Date(data.updatedAt), "dd/MM/yyyy")}
            </p>
          </div>

          <EnergyChart points={data.points} />
        </motion.section>
      </div>
    </main>
  );
}
