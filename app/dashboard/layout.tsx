"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";

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
      <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
        <div className="flex shrink-0 flex-col gap-2 py-3 sm:py-4">
          <Skeleton className="h-3 w-24 rounded-md" />
          <Skeleton className="h-8 w-56 max-w-full sm:h-9" />
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-xl)] border border-white/15 bg-white/10 px-4 py-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden rounded-[var(--radius-xl)] border border-white/15 bg-white/5 p-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md" />
          ))}
        </div>
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
