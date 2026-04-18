import { Skeleton } from "@/components/ui/skeleton";

export default function ReportesLoading() {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-5 pb-20 sm:pb-5">
      <div className="flex shrink-0 flex-col gap-2 py-3 sm:py-4">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-8 w-36 max-w-full sm:h-9" />
      </div>

      <div className="flex shrink-0 gap-2 border-b border-white/10 pb-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <Skeleton className="h-24 w-full rounded-[var(--radius-xl)]" />
        <div className="flex min-h-0 flex-1 flex-col gap-2 rounded-[var(--radius-xl)] border border-white/15 bg-white/5 p-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-md" />
          ))}
        </div>
      </div>
    </main>
  );
}
