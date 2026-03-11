"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import NextTopLoader from "nextjs-toploader";

import { ToastProvider } from "@/components/ui/toast";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <NextTopLoader
        color="#d62300"
        height={3}
        showSpinner={false}
        crawlSpeed={180}
        easing="ease"
        speed={220}
      />
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  );
}
