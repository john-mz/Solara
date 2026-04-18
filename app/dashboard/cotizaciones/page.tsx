"use client";

import { motion } from "framer-motion";
import { CotizacionPanel } from "@/components/dashboard/cotizaciones/cotizacion-panel";

export default function CotizacionesPage() {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="flex shrink-0 flex-col gap-1 py-3 sm:py-4"
        initial={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-foreground/70">
          Comercial
        </p>
        <h1 className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Pre-cotizaciones
        </h1>
      </motion.div>

      <CotizacionPanel />
    </main>
  );
}
