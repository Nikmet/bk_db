import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "danger";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border border-[#f3d4c8] bg-[#f7e7de] text-[var(--bk-primary)]",
  success: "border border-[#c7e3d3] bg-[var(--bk-success-soft)] text-[var(--bk-success)]",
  warning: "border border-[#edd5a8] bg-[var(--bk-warning-soft)] text-[var(--bk-warning)]",
  danger: "border border-[#edc2be] bg-[var(--bk-danger-soft)] text-[var(--bk-danger)]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
