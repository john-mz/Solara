import { Skeleton } from "@/components/ui/skeleton";

export default function PlantasLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <div className="flex shrink-0 flex-col gap-2 py-3 sm:py-4">
        <Skeleton className="h-3 w-16 rounded-md" />
        <Skeleton className="h-8 w-40 max-w-full sm:h-9" />
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-3 rounded-[var(--radius-xl)] border border-white/15 bg-white/10 px-4 py-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Skeleton className="h-10 w-full max-w-xs rounded-[var(--radius-lg)]" />
        <Skeleton className="h-9 w-40 rounded-full" />
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton
            key={i}
            className="aspect-[4/3] min-h-[180px] w-full rounded-[var(--radius-xl)]"
          />
        ))}
      </div>
    </main>
  );
}
