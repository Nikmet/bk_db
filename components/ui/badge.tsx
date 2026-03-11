import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--bk-primary-soft)] text-[var(--bk-primary-strong)]",
  success: "bg-[var(--bk-success-soft)] text-[var(--bk-success)]",
  warning: "bg-[var(--bk-warning-soft)] text-[var(--bk-warning)]",
  danger: "bg-[var(--bk-danger-soft)] text-[var(--bk-danger)]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variantClasses[variant], className)}
      {...props}
    />
  );
}
