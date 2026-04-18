"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { useActiveAlarms, useDismissAlarm } from "@/components/providers/alarm-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { alarmTypeLabel } from "@/lib/use-alarm-watcher";
import type { AlarmDoc } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const OWNER_NAV = [
  { href: "/dashboard/alarmas", label: "Alarmas" },
  { href: "/dashboard/plantas", label: "Plantas" },
  { href: "/dashboard/reportes", label: "Reportes" },
] as const;

const PLANT_NAV = [{ href: "/", label: "Panel" }] as const;

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

function BellCriticalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BellWarningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function alarmRelativeTime(alarm: AlarmDoc): string {
  try {
    return formatDistanceToNow(alarm.created_at.toDate(), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    return "";
  }
}

function LogOutIcon({ className }: { className?: string }) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const activeAlarms = useActiveAlarms();
  const dismissAlarm = useDismissAlarm();
  const [signingOut, setSigningOut] = useState(false);
  const alarmCount = activeAlarms.length;
  const alarmsHref =
    session?.role === "owner" ? "/dashboard/alarmas" : "/";

  const navItems = session?.role === "plant" ? PLANT_NAV : OWNER_NAV;
  const logoHref = session?.role === "plant" ? "/" : "/dashboard/alarmas";

  const displayName =
    session?.role === "owner"
      ? (session.firebaseUser.displayName?.split(" ")[0] ??
         session.firebaseUser.email?.split("@")[0] ??
         "Owner")
      : session?.role === "plant"
        ? session.plant.name
        : null;

  const avatarUrl =
    session?.role === "owner" ? session.firebaseUser.photoURL : null;

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      router.replace("/login");
    } catch {
      toast.error("No se pudo cerrar sesión");
      setSigningOut(false);
    }
  }

  return (
    <header className="w-full shrink-0 bg-transparent">
      <div className="mx-auto flex h-14 w-full items-center justify-between gap-3 px-4 sm:h-20 sm:gap-6 sm:px-8 lg:px-10">
        {/* Logo */}
        <Link
          href={logoHref}
          className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 outline-none ring-ring focus-visible:ring-2"
        >
          <Image
            src="/solara-logo-2.webp"
            alt="Solara"
            width={40}
            height={40}
            className="size-9 shrink-0 rounded-[6px] object-contain drop-shadow-md sm:size-10"
            priority
          />
          <div className="flex min-w-0 flex-col gap-0.5 leading-none">
            <span className="font-[family-name:var(--font-heading)] text-[1.05rem] font-semibold tracking-tight text-foreground sm:text-[1.15rem]">
              Solara
            </span>
            <span className="hidden text-[0.7rem] font-normal tracking-wide text-muted-foreground sm:block">
              by Techos Rentables
            </span>
          </div>
        </Link>

        {/* Nav — desktop/tablet; mobile uses BottomNav for owner */}
        <nav
          className="hidden items-center gap-4 sm:flex"
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-lg px-6 py-2.5 text-base font-medium transition-colors",
                  active
                    ? "text-background"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-lg bg-foreground shadow-sm ring-1 ring-foreground/20"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <span className="relative z-10">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={
                  alarmCount > 0
                    ? `Alertas activas, ${alarmCount}`
                    : "Notificaciones"
                }
                className="relative flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <BellIcon className="size-5" />
                {alarmCount > 0 ? (
                  <span className="absolute -right-1 -top-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[0.6rem] font-bold tabular-nums leading-none text-white shadow-sm ring-2 ring-background">
                    {alarmCount > 9 ? "9+" : alarmCount}
                  </span>
                ) : null}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-[min(calc(100vw-2rem),20rem)] p-0 sm:w-80"
            >
              <div className="border-b border-border/60 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Alertas activas
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {alarmCount === 0
                    ? "Todo en orden"
                    : `${alarmCount} ${alarmCount === 1 ? "alerta" : "alertas"}`}
                </p>
              </div>

              {alarmCount === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Sin alertas activas
                </p>
              ) : (
                <ul
                  className="flex max-h-[min(50vh,18rem)] flex-col gap-2 overflow-y-auto overscroll-contain p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  aria-label="Lista de alertas activas"
                >
                  {activeAlarms.map((alarm) => {
                    const critical = alarm.severity === "CRITICAL";
                    return (
                      <li key={alarm.id}>
                        <div
                          className={cn(
                            "flex gap-3 rounded-xl px-3 py-2.5",
                            critical
                              ? "bg-red-500/10"
                              : "bg-amber-500/10"
                          )}
                        >
                          <span
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-full",
                              critical
                                ? "bg-red-100 text-red-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {critical ? (
                              <BellCriticalIcon className="size-4" />
                            ) : (
                              <BellWarningIcon className="size-4" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {alarmTypeLabel(alarm.type)}
                            </p>
                            <p className="truncate font-mono text-[0.7rem] text-muted-foreground">
                              {alarm.plant_id || "—"}
                            </p>
                            <p className="text-[0.65rem] text-muted-foreground">
                              {alarmRelativeTime(alarm)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1 self-start">
                            <span
                              className={cn(
                                "rounded-full border px-1.5 py-0.5 text-[0.55rem] font-bold uppercase tracking-wide",
                                critical
                                  ? "border-red-800/40 bg-red-100 text-red-950"
                                  : "border-amber-800/40 bg-amber-100 text-amber-950"
                              )}
                            >
                              {alarm.severity}
                            </span>
                            <button
                              type="button"
                              onClick={() => dismissAlarm(alarm.id)}
                              aria-label="Quitar alerta de la campana"
                              className="flex size-5 items-center justify-center rounded-full text-muted-foreground/60 transition-colors hover:bg-black/10 hover:text-muted-foreground"
                            >
                              <svg viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="border-t border-border/60 p-2">
                <Link
                  href={alarmsHref}
                  className="flex w-full items-center justify-center rounded-xl bg-foreground py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
                >
                  Ver todas las alarmas
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Avatar + dropdown */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Abrir menú de perfil"
                  className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 bg-background/60 px-2 py-1.5 outline-none transition-colors hover:bg-background/90 data-[state=open]:bg-background/90"
                >
                  <Avatar className="size-7 shrink-0 rounded-md ring-1 ring-border">
                    {avatarUrl ? (
                      <AvatarImage
                        src={avatarUrl}
                        alt={displayName ?? "Usuario"}
                        referrerPolicy="no-referrer"
                      />
                    ) : null}
                    <AvatarFallback className="rounded-md bg-accent/30 text-xs font-semibold text-foreground">
                      {displayName?.charAt(0)?.toUpperCase() ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  {displayName ? (
                    <span className="hidden text-sm font-medium text-foreground lg:block">
                      {displayName}
                    </span>
                  ) : null}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                onCloseAutoFocus={(e) => e.preventDefault()}
                className="w-44 rounded-xl border-border/70 bg-[oklch(0.99_0.008_85)] p-1.5 shadow-lg"
              >
                <DropdownMenuItem
                  onSelect={handleSignOut}
                  disabled={signingOut}
                  variant="destructive"
                  className="cursor-pointer rounded-lg"
                >
                  <LogOutIcon className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
