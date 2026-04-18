"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function GridIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v18h18" />
      <path d="M7 12v5M12 8v9M17 5v12" />
    </svg>
  );
}

const ITEMS = [
  { href: "/dashboard/alarmas", label: "Alarmas", Icon: BellIcon },
  { href: "/dashboard/plantas", label: "Plantas", Icon: GridIcon },
  { href: "/dashboard/reportes", label: "Reportes", Icon: ChartIcon },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { session } = useAuth();

  if (session?.role !== "owner") {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/15 bg-background/90 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-md sm:hidden"
      aria-label="Navegación principal"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 pt-1">
        {ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg py-2 text-[0.65rem] font-medium transition-colors",
                active
                  ? "text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active ? (
                <motion.span
                  layoutId="nav-pill-mobile"
                  className="absolute inset-0 rounded-lg bg-foreground shadow-sm ring-1 ring-foreground/20"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="relative z-10 size-5 shrink-0" />
              <span className="relative z-10 truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
