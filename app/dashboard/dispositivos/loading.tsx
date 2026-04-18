import { Skeleton } from "@/components/ui/skeleton";

export default function DispositivosLoading() {
  return (
    <main className="relative flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <div className="flex shrink-0 flex-col gap-2 py-3 sm:py-4">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-8 w-44 max-w-full sm:h-9" />
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <Skeleton className="h-10 w-full max-w-md rounded-[var(--radius-lg)]" />
        <Skeleton className="h-10 w-40 rounded-[var(--radius-lg)]" />
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[4.75rem] rounded-[var(--radius-xl)]" />
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
