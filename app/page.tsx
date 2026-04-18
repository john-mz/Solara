"use client";

import { OverviewDashboard } from "@/components/dashboard/overview-dashboard";
import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { session, authReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authReady) return;
    if (session?.role === "owner") {
      router.replace("/dashboard/alarmas");
    }
  }, [authReady, session, router]);

  if (!authReady || session?.role === "owner") {
    return (
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  return <OverviewDashboard />;
}
