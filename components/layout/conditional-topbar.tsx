"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Topbar } from "@/components/layout/topbar";

export function ConditionalTopbar() {
  const pathname = usePathname();
  if (pathname !== "/" && !pathname.startsWith("/dashboard")) return null;
  return (
    <>
      <Topbar />
      <BottomNav />
    </>
  );
}
