"use client";

import { cn } from "@/lib/utils";

const cardPaper =
  "border border-white/18 bg-white/10 shadow-[0_2px_18px_rgb(0,0,0,0.035)] backdrop-blur-md rounded-[var(--radius-xl)]";

export type KpiCardProps = {
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
};

export function KpiCard({ label, value, sublabel, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        cardPaper,
        "flex min-w-0 flex-col gap-1 px-3 py-2.5 sm:px-4 sm:py-3",
        className
      )}
    >
      <div className="text-[0.65rem] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <p className="font-[family-name:var(--font-heading)] text-lg font-semibold tabular-nums tracking-tight text-foreground sm:text-xl">
        {value}
      </p>
      {sublabel ? (
        <p className="text-[0.65rem] text-muted-foreground">{sublabel}</p>
      ) : null}
    </div>
  );
}
