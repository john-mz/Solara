"use client";

import "@/lib/firebase";
import { AlarmProvider } from "@/components/providers/alarm-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";

function AppToaster() {
  return (
    <Toaster
      closeButton
      duration={8000}
      position="top-right"
      richColors
      theme="light"
    />
  );
}

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AlarmProvider>{children}</AlarmProvider>
        <AppToaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
