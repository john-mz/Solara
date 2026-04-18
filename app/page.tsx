"use client";

import { PlantDashboard } from "@/components/dashboard/plant-dashboard";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { session, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (session?.role === "owner") {
      router.replace("/dashboard/alarmas");
    }
  }, [authReady, session, router]);

  useEffect(() => {
    if (!authReady) return;
    if (session === null) {
      router.replace("/login");
    }
  }, [authReady, session, router]);

  if (
    !authReady ||
    session?.role === "owner" ||
    session === null
  ) {
    return (
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 pb-20 sm:pb-5">
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
        </div>
      </main>
    );
  }

  return <PlantDashboard plant={session.plant} />;
}
