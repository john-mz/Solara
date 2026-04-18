"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
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
  const [signingOut, setSigningOut] = useState(false);

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
          <button
            type="button"
            aria-label="Notificaciones"
            className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <BellIcon className="size-5" />
          </button>

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
