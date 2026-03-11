import type { ReactNode } from "react";

import { AppNav } from "@/components/layout/app-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";

interface PrivateShellProps {
  children: ReactNode;
  username: string;
  role: "ADMIN" | "MANAGER";
}

export function PrivateShell({ children, username, role }: PrivateShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bk-bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--bk-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="font-black uppercase tracking-wide text-[var(--bk-primary)]">Burger King Supply</p>
            <AppNav />
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="default">{role}</Badge>
            <p className="text-sm font-semibold text-[var(--bk-text)]">{username}</p>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
