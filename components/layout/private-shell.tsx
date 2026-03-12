import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

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
            <Link href="/dashboard/inventory" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Burger King Supply"
                width={220}
                height={42}
                priority
                className="h-9 w-auto object-contain"
              />
            </Link>
            <AppNav />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {role === "ADMIN" ? (
              <Link
                href="/dashboard/products"
                className="inline-flex h-9 items-center rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface-soft)] px-4 text-sm font-semibold text-[var(--bk-text)] transition-colors hover:border-[var(--bk-border-strong)] hover:bg-[#ece6df]"
              >
                Справочник товаров
              </Link>
            ) : null}
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
