"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/stocks", label: "Остатки" },
  { href: "/calculation/params", label: "Параметры расчёта" },
  { href: "/calculation/result", label: "Результат" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {links.map((link) => {
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-semibold transition-colors",
              isActive
                ? "bg-[var(--bk-primary)] text-white"
                : "bg-[var(--bk-surface)] text-[var(--bk-text-muted)] hover:bg-[var(--bk-primary-soft)]",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
