"use client";

import { useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { session, authReady } = useAuth();
  const router = useRouter();

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

  return <>{children}</>;
}
