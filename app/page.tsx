"use client";

import { PlantDashboard } from "@/components/dashboard/plant-dashboard";
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
      <main className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-5">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </main>
    );
  }

  return <PlantDashboard plant={session.plant} />;
}
