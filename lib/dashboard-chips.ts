import type { PlantBrand } from "@/lib/types";

/**
 * High-contrast chip styles for glass dashboards on warm / green-tinted page backgrounds.
 * Uses opaque tints + near-black text in light mode (avoids green-on-green / amber-on-amber).
 */

export function dashboardBrandBadgeClass(brand: PlantBrand): string {
  switch (brand) {
    case "deye":
      return "border border-amber-900/50 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-400/60 dark:bg-amber-950 dark:text-amber-50";
    case "huawei":
      return "border border-red-900/45 bg-red-100 text-red-950 shadow-sm dark:border-red-400/55 dark:bg-red-950 dark:text-red-50";
    case "growatt":
      return "border border-emerald-900/50 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-400/60 dark:bg-emerald-950 dark:text-emerald-50";
    default:
      return "border border-border bg-muted text-foreground";
  }
}

/** Plant / device “online” or SLA OK */
export const dashboardChipOnline =
  "border border-emerald-900/50 bg-emerald-100 text-emerald-950 shadow-sm dark:border-emerald-400/60 dark:bg-emerald-950 dark:text-emerald-50";

/** Warning / degraded */
export const dashboardChipWarning =
  "border border-amber-900/50 bg-amber-100 text-amber-950 shadow-sm dark:border-amber-400/60 dark:bg-amber-950 dark:text-amber-50";

/** Neutral / offline / no data */
export const dashboardChipNeutral =
  "border border-foreground/20 bg-muted text-foreground dark:border-border dark:bg-muted dark:text-foreground";

/** Critical / error / SLA breach — label chips */
export const dashboardChipDanger =
  "border border-red-800/55 bg-red-100 text-red-950 shadow-sm dark:border-red-400/55 dark:bg-red-950 dark:text-red-50";

/** Rounded-full filter tabs (Alarmas, Plantas, Reportes, etc.) */
export const dashboardFilterPillActive =
  "border-2 border-foreground/80 bg-foreground text-background shadow-sm";

export const dashboardFilterPillInactive =
  "border border-white/35 bg-white/12 text-foreground hover:bg-white/20 hover:text-foreground";

/** Compact controls inside a segmented bar (e.g. rango temporal en plant dashboard) */
export const dashboardSegmentedActive =
  "bg-foreground text-background shadow-sm ring-1 ring-foreground/25";

export const dashboardSegmentedInactive =
  "text-foreground/90 hover:bg-white/15";

/** Severity indicator dot — WARNING */
export const dashboardSeverityWarningDot =
  "bg-amber-800 ring-2 ring-amber-100 dark:bg-amber-400 dark:ring-amber-950/60";

/** Severity indicator dot — CRITICAL / destructive */
export const dashboardSeverityCriticalDot =
  "bg-destructive ring-2 ring-red-100 dark:ring-red-950/50";
