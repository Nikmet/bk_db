"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard/inventory", label: "Остатки" },
  { href: "/dashboard/products/import", label: "Импорт товаров" },
  { href: "/dashboard/forecast", label: "Прогноз" },
  { href: "/dashboard/result", label: "Результат" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-xl border px-3 py-2 text-sm font-semibold transition-all",
              isActive
                ? "border-[var(--bk-primary)] bg-[var(--bk-primary)] text-white shadow-sm"
                : "border-[var(--bk-border)] bg-[var(--bk-surface)] text-[var(--bk-text-muted)] hover:border-[var(--bk-border-strong)] hover:bg-[var(--bk-surface-soft)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
