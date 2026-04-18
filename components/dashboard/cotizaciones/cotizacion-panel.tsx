"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  dashboardFilterPillActive,
  dashboardFilterPillInactive,
} from "@/lib/dashboard-chips";

const ANALYZE_INVOICE_API = "/api/analyze-invoice";

const HSP_VALLE_H = 4.25;
const PERFORMANCE_RATIO = 0.77;
const PANEL_KW = 0.55;
const CAPEX_PER_KWP_COP = 5_750_000;
/** Duration in ms that the bar takes to reach 88% — matches the typical API time */
const PROGRESS_FILL_MS = 22_000;

export type ConsumoMes = {
  Mes: string;
  kWh: string;
  Valor: string;
  "Dias facturados": string;
};

export type RangoTarifa = {
  rango: string;
  valor_kwh: string;
  consumo_wats: string;
  total_energia: string;
  subsidio: string;
  total: string;
};

export type AnalyzeInvoiceData = {
  total_factura: string;
  total_energia: string;
  rangos: RangoTarifa[];
  consumo_pasado: ConsumoMes[];
};

type AnalyzeInvoiceResponse = {
  success: boolean;
  data?: AnalyzeInvoiceData;
  execution_time_ms?: number;
  error?: string;
};

export function parseCopFromString(value: string): number {
  const v = value.trim();
  if (!v) return 0;
  const hasComma = v.includes(",");
  const hasDot = v.includes(".");
  if (hasComma && hasDot) {
    const lastComma = v.lastIndexOf(",");
    const lastDot = v.lastIndexOf(".");
    if (lastComma > lastDot) return Number(v.replace(/\./g, "").replace(",", ".")) || 0;
    return Number(v.replace(/,/g, "")) || 0;
  }
  if (hasComma && !hasDot) {
    const parts = v.split(",");
    if (parts.length === 2 && parts[1].length <= 2)
      return Number(parts[0].replace(/\./g, "") + "." + parts[1]) || 0;
    return Number(v.replace(/,/g, "")) || 0;
  }
  if (!hasComma && hasDot) {
    const parts = v.split(".");
    if (parts.length === 2 && parts[1].length <= 2)
      return Number(parts[0].replace(/\./g, "") + "." + parts[1]) || 0;
    return Number(v.replace(/\./g, "")) || 0;
  }
  return Number(v.replace(/[^\d]/g, "")) || 0;
}

function parseKwh(value: string): number {
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function roundKwUpToHalf(kw: number): number {
  if (!Number.isFinite(kw) || kw <= 0) return 0.5;
  return Math.ceil(kw * 2) / 2;
}

function formatCop(n: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function formatNumberEs(n: number, maxFrac = 1): string {
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(n);
}

export type QuoteComputation = {
  avgKwhMonth: number;
  avgSpendMonth: number;
  annualSpendEstimate: number;
  kwhDailyAvg: number;
  kWp: number;
  panelCount: number;
  capexEstimate: number;
  monthlySavingEstimate: number;
  paybackYears: number | null;
  paybackMonths: number | null;
  ivaExclusionEstimate: number;
  rentaDeduction50: number;
  inverterKey: "growatt" | "huawei" | "deye";
  inverterLabel: string;
  inverterRationale: string;
};

export function computeQuoteFromConsumo(
  consumo: ConsumoMes[]
): QuoteComputation | null {
  if (!consumo.length) return null;

  let sumKwh = 0;
  let sumValor = 0;
  for (const row of consumo) {
    sumKwh += parseKwh(row.kWh);
    sumValor += parseCopFromString(row.Valor);
  }
  const n = consumo.length;
  const avgKwhMonth = sumKwh / n;
  const avgSpendMonth = sumValor / n;
  const annualSpendEstimate = avgSpendMonth * 12;
  const kwhDailyAvg = avgKwhMonth / 30;
  const denom = HSP_VALLE_H * PERFORMANCE_RATIO;
  const kWp = roundKwUpToHalf(denom > 0 ? kwhDailyAvg / denom : 0);
  const panelCount = Math.max(1, Math.ceil(kWp / PANEL_KW));
  const capexEstimate = kWp * CAPEX_PER_KWP_COP;
  const monthlySavingEstimate = avgSpendMonth;
  const paybackMonths = monthlySavingEstimate > 0 ? capexEstimate / monthlySavingEstimate : null;
  const paybackYears = paybackMonths != null ? paybackMonths / 12 : null;
  const ivaExclusionEstimate = capexEstimate * 0.19;
  const rentaDeduction50 = capexEstimate * 0.5;

  let inverterKey: QuoteComputation["inverterKey"];
  let inverterLabel: string;
  let inverterRationale: string;

  if (kWp <= 3) {
    inverterKey = "growatt";
    inverterLabel = "Growatt (On-Grid, residencial)";
    inverterRationale =
      "Para sistemas hasta ~3 kWp, Growatt ofrece la mejor relación costo/beneficio en conexión a red. Rango típico: $1.860.000 (1,5 kW) a $4.090.000 (3 kW).";
  } else if (kWp <= 6) {
    inverterKey = "huawei";
    inverterLabel = "Huawei (premium / seguridad)";
    inverterRationale =
      "En el rango medio-alto, Huawei aporta estándares corporativos y funciones de seguridad avanzadas. Modelos 5–6 kW: $3.350.000 – $6.641.000.";
  } else {
    inverterKey = "deye";
    inverterLabel = "Deye (híbrido / baterías)";
    inverterRationale =
      "Para potencias mayores o respaldo con baterías, Deye es referencia en híbridos. ~5 kW híbrido ~$7.990.000; ~12 kW ~$11.400.000.";
  }

  return {
    avgKwhMonth, avgSpendMonth, annualSpendEstimate, kwhDailyAvg,
    kWp, panelCount, capexEstimate, monthlySavingEstimate,
    paybackYears, paybackMonths, ivaExclusionEstimate, rentaDeduction50,
    inverterKey, inverterLabel, inverterRationale,
  };
}

/** Animated progress bar that fills to 88% over PROGRESS_FILL_MS, then snaps to 100% */
function ProgressBar({ loading, done }: { loading: boolean; done: boolean }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    if (!loading && !done) { setPct(0); return; }
    if (done) { setPct(100); return; }
    // kick off: first set 0, then on next frame jump toward 88%
    setPct(0);
    const id = setTimeout(() => setPct(88), 60);
    return () => clearTimeout(id);
  }, [loading, done]);

  if (pct === 0 && !loading && !done) return null;

  const steps = [
    { label: "Descargando factura", threshold: 25 },
    { label: "Extrayendo datos", threshold: 55 },
    { label: "Calculando consumo", threshold: 78 },
    { label: "Generando cotización", threshold: 95 },
  ];
  const currentStep = steps.filter((s) => pct >= s.threshold).at(-1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-2 rounded-[var(--radius-xl)] border border-white/15 bg-white/[0.07] p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground/90">
          {done
            ? "¡Listo!"
            : (currentStep?.label ?? "Iniciando análisis…")}
        </span>
        <span className="text-xs tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
      </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-primary transition-all ease-linear"
            style={{
              width: `${pct}%`,
              transitionDuration: done ? "300ms" : `${PROGRESS_FILL_MS}ms`,
            }}
          />
        </div>
      {!done && (
        <p className="text-[0.65rem] text-muted-foreground">
          Esto suele tardar ~20 segundos mientras descargamos y analizamos su factura.
        </p>
      )}
    </motion.div>
  );
}

/** Animated bar chart — CSS transitions driven by a ready state */
function ConsumoChart({ rows }: { rows: ConsumoMes[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const t = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(t);
  }, [rows]);

  const maxKwh = useMemo(
    () => Math.max(...rows.map((r) => parseKwh(r.kWh)), 1),
    [rows]
  );

  /** Fixed pixel height for the bar zone */
  const BAR_ZONE_H = 128;

  return (
    <div
      className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 pb-2.5 pt-3"
      role="img"
      aria-label="Gráfico de barras de consumo mensual en kWh"
    >
      {/* bar zone */}
      <div className="flex items-end gap-1.5" style={{ height: BAR_ZONE_H }}>
        {rows.map((row, i) => {
          const k = parseKwh(row.kWh);
          const barH = Math.max(Math.round((k / maxKwh) * BAR_ZONE_H), 4);
          const isMax = k === maxKwh;
          return (
            <div
              key={row.Mes}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-0.5"
            >
              {/* kWh label — fades in after bars rise */}
              <span
                className={cn(
                  "text-[0.58rem] font-semibold tabular-nums transition-opacity duration-300",
                  isMax ? "text-foreground" : "text-muted-foreground",
                  ready ? "opacity-100" : "opacity-0"
                )}
                style={{ transitionDelay: `${i * 70 + 500}ms` }}
              >
                {k}
              </span>
              {/* bar */}
              <div
                className={cn(
                  "w-full max-w-10 rounded-t-md transition-all ease-out",
                  isMax ? "bg-primary" : "bg-foreground/20"
                )}
                style={{
                  height: ready ? barH : 0,
                  transitionDuration: "550ms",
                  transitionDelay: `${i * 70}ms`,
                }}
                title={`${row.Mes}: ${k} kWh`}
              />
            </div>
          );
        })}
      </div>
      {/* month labels */}
      <div className="mt-1.5 flex gap-1.5">
        {rows.map((row) => (
          <div
            key={row.Mes}
            className="flex-1 text-center text-[0.6rem] font-medium text-muted-foreground"
          >
            {row.Mes}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Visual payback timeline 0–25 years */
function PaybackTimeline({
  paybackYears,
  capex,
  monthlySaving,
}: {
  paybackYears: number;
  capex: number;
  monthlySaving: number;
}) {
  const MAX_YEARS = 25;
  const clampedYears = Math.min(paybackYears, MAX_YEARS);
  const pct = (clampedYears / MAX_YEARS) * 100;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="font-[family-name:var(--font-heading)] text-4xl font-bold tracking-tight text-foreground">
          {formatNumberEs(paybackYears, 1)}
          <span className="ml-1 text-xl font-semibold text-muted-foreground">años</span>
        </span>
        <span className="text-sm text-muted-foreground">
          tiempo estimado de retorno
        </span>
      </div>

      <div className="relative">
        <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-yellow-400"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          />
        </div>
        {/* year markers */}
        {[5, 10, 15, 20, 25].map((y) => (
          <div
            key={y}
            className="absolute top-0 flex flex-col items-center"
            style={{ left: `${(y / MAX_YEARS) * 100}%`, transform: "translateX(-50%)" }}
          >
            <div className="h-3 w-px bg-white/25" />
            <span className="mt-0.5 text-[0.55rem] text-muted-foreground/60">{y}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-foreground/80">
        <span>
          Inversión:{" "}
          <strong className="text-foreground">{formatCop(capex)}</strong>
        </span>
        <span>
          Ahorro/mes:{" "}
          <strong className="text-foreground">{formatCop(monthlySaving)}</strong>
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Residencial típico en Colombia: 5–7 años · Comercial: 3,5–6 años ·
        Vida útil de paneles: más de 25 años de generación
      </p>
    </div>
  );
}

const CARD =
  "rounded-[var(--radius-xl)] border border-white/15 bg-white/5 p-4 shadow-sm backdrop-blur-sm sm:p-5";

export function CotizacionPanel() {
  const [matricula, setMatricula] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [response, setResponse] = useState<AnalyzeInvoiceResponse | null>(null);
  const [selectedInverterTab, setSelectedInverterTab] = useState<
    "growatt" | "huawei" | "deye"
  >("growatt");

  const data = response?.success ? response.data : undefined;
  const quote = useMemo(
    () => (data?.consumo_pasado ? computeQuoteFromConsumo(data.consumo_pasado) : null),
    [data]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const num = matricula.trim();
      if (!num) { toast.error("Ingresa el número de matrícula"); return; }
      setLoading(true);
      setDone(false);
      setResponse(null);
      try {
        const res = await fetch(ANALYZE_INVOICE_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ num_matricula: num }),
        });
        const json = (await res.json()) as AnalyzeInvoiceResponse;
        if (!res.ok || json.success === false) {
          toast.error(
            typeof json.error === "string" ? json.error : "No se pudo analizar la factura"
          );
          setResponse(json);
          return;
        }
        setResponse(json);
        const q = json.data?.consumo_pasado
          ? computeQuoteFromConsumo(json.data.consumo_pasado)
          : null;
        if (q) setSelectedInverterTab(q.inverterKey);
        toast.success("Pre-cotización generada");
      } catch {
        toast.error("Error de red al contactar el servicio");
      } finally {
        setDone(true);
        setLoading(false);
      }
    },
    [matricula]
  );

  const showProgress = loading || (done && !response?.success === false);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pb-2">
      {/* Search form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-white/15 bg-white/[0.07] p-4 sm:flex-row sm:items-end sm:gap-4"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="matricula" className="text-xs font-medium text-foreground/80">
            Número de matrícula
          </label>
          <input
            id="matricula"
            name="matricula"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Ej. 1847440"
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            disabled={loading}
            className="h-11 w-full rounded-xl border border-white/20 bg-background/60 px-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:opacity-60"
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="h-11 shrink-0 rounded-xl px-6 sm:min-w-[175px]"
        >
          {loading ? "Analizando…" : "Generar pre-cotización"}
        </Button>
      </form>

      {/* Progress bar */}
      <AnimatePresence>
        {(loading || done) && (
          <ProgressBar loading={loading} done={done} />
        )}
      </AnimatePresence>

      {/* Error state */}
      {!loading && response && !response.success && (
        <div className={cn(CARD, "border-destructive/40 bg-destructive/5")}>
          <p className="text-sm font-medium text-destructive">No se obtuvo un resultado válido.</p>
          {response.error && (
            <p className="mt-1 text-sm text-muted-foreground">{response.error}</p>
          )}
        </div>
      )}

      {!loading && response?.success && data && !quote && (
        <div className={CARD}>
          <p className="text-sm font-medium text-foreground">
            La factura se analizó, pero no hay historial de consumo suficiente para dimensionar el sistema.
          </p>
          {data.total_factura && (
            <p className="mt-2 text-sm text-muted-foreground">Total factura: {data.total_factura}</p>
          )}
        </div>
      )}

      {/* Results */}
      {!loading && data && quote && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4"
        >
          {/* Execution time */}
          {response?.execution_time_ms != null && (
            <p className="text-[0.65rem] text-muted-foreground">
              Tiempo de análisis: {(response.execution_time_ms / 1000).toFixed(1)} s ·
              Factura: {data.total_factura} · Energía: {data.total_energia}
            </p>
          )}

          {/* ── Card 1: Diagnóstico + Sistema ── */}
          <section className={CARD} aria-labelledby="diag-heading">
            {/* Stats strip */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StatPill label="Consumo mensual prom." value={`${formatNumberEs(quote.avgKwhMonth, 1)} kWh`} />
              <StatPill label="Gasto mensual prom." value={formatCop(quote.avgSpendMonth)} />
              <StatPill label="Gasto anual estimado" value={formatCop(quote.annualSpendEstimate)} />
            </div>

            {/* Animated chart */}
            <h2 id="diag-heading" className="mt-5 text-xs font-semibold uppercase tracking-widest text-foreground/60">
              Historial de consumo — últimos {data.consumo_pasado.length} meses
            </h2>
            <ConsumoChart rows={data.consumo_pasado} />

            {/* Divider */}
            <hr className="my-5 border-white/10" />

            {/* Dimensionamiento */}
            <h2
              id="sys-heading"
              className="font-[family-name:var(--font-heading)] text-base font-semibold text-foreground"
            >
              Sistema recomendado
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Calculado con HSP Valle del Cauca {HSP_VALLE_H} h/día y factor de rendimiento {PERFORMANCE_RATIO}.
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <StatPill label="Potencia estimada" value={`${formatNumberEs(quote.kWp, 1)} kWp`} />
              <StatPill label={`Paneles ~${PANEL_KW * 1000} W c/u`} value={`${quote.panelCount} unidades`} />
              <StatPill label="Consumo diario prom." value={`${formatNumberEs(quote.kwhDailyAvg, 2)} kWh/día`} />
            </div>

            {/* Aclaración tecnológica — nota inline */}
            <div className="mt-4 flex gap-2.5 rounded-xl border border-white/10 bg-white/[0.05] p-3">
              <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>☀️</span>
              <p className="text-xs leading-relaxed text-foreground/80">
                <strong className="text-foreground">Paneles Tier 1 recomendados:</strong>{" "}
                JA Solar, Jinko o Longi (400–600 W+). Precio orientativo: $450.000 – $687.000 COP/unidad.{" "}
                <span className="text-muted-foreground">
                  Nota: Growatt, Huawei y Deye son marcas de <em>inversores</em>, no de paneles.
                </span>
              </p>
            </div>

            {/* Inversor tabs */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/60">
                Inversor sugerido para {formatNumberEs(quote.kWp, 1)} kWp
              </p>
              <div
                className="flex flex-wrap gap-2"
                role="tablist"
                aria-label="Familia de inversor"
              >
                {(
                  [
                    ["growatt", "Growatt"],
                    ["huawei", "Huawei"],
                    ["deye", "Deye híbrido"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={selectedInverterTab === id}
                    onClick={() => setSelectedInverterTab(id)}
                    className={cn(
                      "cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 sm:text-sm",
                      selectedInverterTab === id
                        ? dashboardFilterPillActive
                        : dashboardFilterPillInactive
                    )}
                  >
                    {label}
                    {id === quote.inverterKey && (
                      <span className="ml-1.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                        rec.
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedInverterTab}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="mt-3 rounded-xl border border-white/10 bg-white/[0.05] p-3 text-sm text-foreground/90"
                >
                  {selectedInverterTab === "growatt" && (
                    <p><strong>Growatt:</strong> ideal para máximo ahorro residencial On-Grid. Desde ~$1.860.000 (1,5 kW) hasta ~$4.090.000 (3 kW).</p>
                  )}
                  {selectedInverterTab === "huawei" && (
                    <p><strong>Huawei:</strong> enfoque premium y seguridad avanzada. Rango 5–6 kW: $3.350.000 – $6.641.000.</p>
                  )}
                  {selectedInverterTab === "deye" && (
                    <p><strong>Deye (híbrido / DeyeCloud):</strong> líder en sistemas con batería y fase dividida. ~5 kW ~$7.990.000; ~12 kW robusto ~$11.400.000.</p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Rangos de tarifa */}
            {data.rangos?.length ? (
              <div className="mt-4 overflow-x-auto">
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-foreground/60">
                  Rangos de tarifa (factura actual)
                </p>
                <table className="w-full min-w-[480px] text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-white/15 text-muted-foreground">
                      <th className="py-1.5 pr-3 font-medium">Rango</th>
                      <th className="py-1.5 pr-3 font-medium">$/kWh</th>
                      <th className="py-1.5 pr-3 font-medium">Subsidio</th>
                      <th className="py-1.5 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rangos.map((r) => (
                      <tr key={r.rango} className="border-b border-white/8 text-foreground/85">
                        <td className="py-1.5 pr-3">{r.rango}</td>
                        <td className="py-1.5 pr-3">{r.valor_kwh}</td>
                        <td className="py-1.5 pr-3">{r.subsidio}</td>
                        <td className="py-1.5">{r.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          {/* ── Card 2: Inversión + ROI + Narrativa ── */}
          <section className={CARD} aria-labelledby="inv-heading">
            <h2
              id="inv-heading"
              className="font-[family-name:var(--font-heading)] text-base font-semibold text-foreground"
            >
              Inversión, ahorro y retorno
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              CAPEX llave en mano estimado a {formatCop(CAPEX_PER_KWP_COP)}/kWp (promedio colombiano). Los beneficios tributarios son referenciales; valide con su contador.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatPill label="CAPEX estimado" value={formatCop(quote.capexEstimate)} />
              <StatPill label="Ahorro mensual orientativo" value={formatCop(quote.monthlySavingEstimate)} />
              <StatPill label="Exclusión IVA ~19%" value={formatCop(quote.ivaExclusionEstimate)} />
              <StatPill label="Deducción renta ~50%" value={formatCop(quote.rentaDeduction50)} />
            </div>

            {/* Beneficios tributarios — inline list */}
            <ul className="mt-3 space-y-1 text-xs text-foreground/75">
              <li className="flex gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Deducción del 50% del valor total en impuesto de renta (hasta 15 años).</li>
              <li className="flex gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Exclusión del 19% de IVA en la compra de equipos (Ley 1715 / 2099).</li>
              <li className="flex gap-2"><span className="mt-0.5 text-emerald-500">✓</span>Cero aranceles en componentes importados y depreciación acelerada.</li>
            </ul>

            {/* Payback timeline */}
            {quote.paybackYears != null && quote.paybackMonths != null ? (
              <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4">
                <PaybackTimeline
                  paybackYears={quote.paybackYears}
                  capex={quote.capexEstimate}
                  monthlySaving={quote.monthlySavingEstimate}
                />
              </div>
            ) : null}

            <hr className="my-5 border-white/10" />

            {/* Narrativa comercial */}
            <h2 className="font-[family-name:var(--font-heading)] text-base font-semibold text-foreground">
              Cómo presentar la propuesta
            </h2>
            <ol className="mt-3 space-y-3">
              {[
                {
                  n: "1",
                  title: "Diagnóstico",
                  body: `Su gasto anual estimado es ${formatCop(quote.annualSpendEstimate)}. Muéstrale el problema económico concreto antes de mencionar equipos.`,
                },
                {
                  n: "2",
                  title: "Solución financiera",
                  body: `Con ~${formatNumberEs(quote.kWp, 1)} kWp puede ahorrar ~${formatCop(quote.monthlySavingEstimate)}/mes en la factura y generar excedentes que Celsia u otro operador acredita a su favor.`,
                },
                {
                  n: "3",
                  title: "Inversor recomendado",
                  body: `${quote.inverterLabel} — ${quote.inverterRationale}`,
                },
                {
                  n: "4",
                  title: "Cierre",
                  body: `El sistema se paga con el ahorro y los descuentos tributarios. Después del payback, más de ${25 - Math.round(quote.paybackYears ?? 7)} años de energía con costo marginal mínimo.`,
                },
              ].map((step) => (
                <li key={step.n} className="flex gap-3 text-sm">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-bold text-foreground">
                    {step.n}
                  </span>
                  <span className="text-foreground/85">
                    <strong className="text-foreground">{step.title}:</strong> {step.body}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </motion.div>
      )}
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5">
      <p className="text-[0.62rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-[family-name:var(--font-heading)] text-[1.05rem] font-semibold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}
