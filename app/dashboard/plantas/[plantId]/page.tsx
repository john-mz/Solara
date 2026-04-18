"use client";

import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { PlantDashboard } from "@/components/dashboard/plant-dashboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { mapPlantDoc } from "@/lib/firestore-hooks";
import type { PlantDoc } from "@/lib/types";

export default function PlantaDetallePage() {
  const params = useParams();
  const router = useRouter();
  const plantId =
    typeof params.plantId === "string"
      ? params.plantId
      : Array.isArray(params.plantId)
        ? params.plantId[0] ?? ""
        : "";

  const plantQuery = useQuery({
    queryKey: ["plant", plantId],
    queryFn: async (): Promise<PlantDoc | null> => {
      if (!plantId) return null;
      const ref = doc(db, "plants", plantId);
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      try {
        return mapPlantDoc(snap.id, snap.data());
      } catch {
        return null;
      }
    },
    enabled: Boolean(plantId),
    staleTime: 60_000,
  });

  function handleBack() {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/dashboard/plantas");
    }
  }

  if (!plantId) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-20 sm:pb-5">
        <div className="shrink-0 pt-3 sm:pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            ← Volver
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Planta no válida.</p>
      </main>
    );
  }

  if (plantQuery.isLoading) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-20 sm:pb-5">
        <div className="sticky top-0 z-10 -mx-5 border-b border-white/10 bg-background/80 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            ← Volver
          </Button>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <Skeleton className="h-40 w-full shrink-0 rounded-[var(--radius-xl)] sm:h-48 sm:w-64" />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Skeleton className="h-8 w-3/4 max-w-md" />
            <Skeleton className="h-4 w-full max-w-lg" />
            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-[var(--radius-lg)]" />
              ))}
            </div>
          </div>
        </div>
        <Skeleton className="min-h-[200px] w-full flex-1 rounded-[var(--radius-xl)]" />
      </main>
    );
  }

  if (plantQuery.isError || !plantQuery.data) {
    return (
      <main className="flex min-h-0 flex-1 flex-col gap-3 px-5 pb-20 sm:pb-5">
        <div className="sticky top-0 z-10 -mx-5 border-b border-white/10 bg-background/80 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            ← Volver
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          No se encontró esta planta o los datos no son válidos.
        </p>
      </main>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-background/80 px-5 py-3 backdrop-blur-md sm:static sm:border-0 sm:bg-transparent sm:px-5 sm:py-3 sm:backdrop-blur-none">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="-ml-2 gap-1 text-muted-foreground hover:text-foreground"
          onClick={handleBack}
        >
          ← Volver
        </Button>
      </div>
      <PlantDashboard plant={plantQuery.data} />
    </div>
  );
}
