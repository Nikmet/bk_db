import type { ReactNode } from "react";

import { AppNav } from "@/components/layout/app-nav";
import { LogoutButton } from "@/components/layout/logout-button";
import { Badge } from "@/components/ui/badge";

interface PrivateShellProps {
  children: ReactNode;
  username: string;
  role: "ADMIN" | "MANAGER";
}

function getRoleLabel(role: "ADMIN" | "MANAGER"): string {
  return role === "ADMIN" ? "Администратор" : "Менеджер";
}

export function PrivateShell({ children, username, role }: PrivateShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bk-bg)]">
      <header className="sticky top-0 z-30 border-b border-[var(--bk-border)] bg-[var(--bk-surface)] print:hidden">
        <div className="flex w-full flex-col gap-3 px-4 py-2.5 md:flex-row md:items-center md:justify-between md:px-6 xl:px-8 2xl:px-10">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-5">
            <p className="text-[24px] font-extrabold uppercase tracking-[0.05em] text-[var(--bk-primary)]">Система поставок Бургер Кинг</p>
            <AppNav />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default" className="px-3 py-1">
              {getRoleLabel(role)}: {username}
            </Badge>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="w-full px-4 py-6 md:px-6 xl:px-8 2xl:px-10 print:px-0 print:py-0">{children}</main>
    </div>
  );
}
