"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "energy", label: "Energy" },
  { id: "sensors", label: "Sensors" },
  { id: "reports", label: "Reports" },
];

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

export function Topbar() {
  const [active, setActive] = useState("dashboard");

  return (
    <header className="w-full shrink-0 bg-transparent">
      <div className="mx-auto flex h-20 w-full items-center justify-between gap-6 px-8 lg:px-10">

        {/* Logo */}
        <div className="flex shrink-0 items-center gap-3">
          <Image
            src="/solara-logo.webp"
            alt="Solara"
            width={40}
            height={40}
            className="size-10 shrink-0 rounded-[6px] object-contain drop-shadow-md"
          />
          <div className="flex min-w-0 flex-col gap-0.5 leading-none">
            <span className="font-[family-name:var(--font-heading)] text-[1.15rem] font-semibold tracking-tight text-foreground">
              Solara
            </span>
            <span className="text-[0.7rem] font-normal tracking-wide text-muted-foreground">
              by Techos Rentables
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-4" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={cn(
                "relative rounded-lg px-6 py-2.5 text-base font-medium transition-colors",
                active === item.id
                  ? "bg-gradient-to-br from-[color-mix(in_oklch,var(--primary),white_9%)] to-[color-mix(in_oklch,var(--primary),black_7%)] text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            aria-label="Notificaciones"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <BellIcon className="size-5" />
          </button>

          {/* Avatar placeholder */}
          <div
            className="size-9 shrink-0 overflow-hidden rounded-md bg-accent/30 ring-2 ring-border"
            aria-label="Perfil de usuario"
          >
            <svg
              className="size-full"
              viewBox="0 0 36 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <rect width="36" height="36" fill="var(--color-accent)" opacity="0.2" />
              <circle cx="18" cy="14" r="6" fill="var(--color-accent)" opacity="0.8" />
              <path d="M6 32c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="var(--color-accent)" opacity="0.8" />
            </svg>
          </div>
        </div>

      </div>
    </header>
  );
}
