"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";

export function ConditionalTopbar() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/privacidad") return null;
  return <Topbar />;
}
