"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, authReady } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authReady) return;
    if (session?.role !== "owner") {
      router.replace("/login");
    }
  }, [authReady, session, router]);

  if (!authReady || session?.role !== "owner") {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 18 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -18 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        className="flex min-h-0 flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
