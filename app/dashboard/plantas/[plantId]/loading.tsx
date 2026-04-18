import { Skeleton } from "@/components/ui/skeleton";

export default function PlantaDetalleLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <div className="sticky top-0 z-10 -mx-5 border-b border-white/10 bg-background/80 px-5 py-3 backdrop-blur-md sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <Skeleton className="h-40 w-full shrink-0 rounded-[var(--radius-xl)] sm:h-48 sm:w-64" />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <Skeleton className="h-8 w-3/4 max-w-md" />
          <Skeleton className="h-4 w-full max-w-lg" />
          <Skeleton className="h-4 w-5/6 max-w-md" />
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
