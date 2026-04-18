"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";

export function ConditionalTopbar() {
  const pathname = usePathname();
  if (pathname === "/login") return null;
  return <Topbar />;
}
