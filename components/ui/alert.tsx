import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type AlertVariant = "info" | "success" | "warning" | "error";

const variantClasses: Record<AlertVariant, string> = {
  info: "border-[var(--bk-border-strong)] bg-[var(--bk-surface-strong)] text-[var(--bk-brown)]",
  success: "border-[#9adcbf] bg-[var(--bk-success-soft)] text-[var(--bk-success)]",
  warning: "border-[#ffd28f] bg-[var(--bk-warning-soft)] text-[var(--bk-warning)]",
  error: "border-[#efb8b4] bg-[var(--bk-danger-soft)] text-[var(--bk-danger)]",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
}

export function Alert({ className, variant = "info", ...props }: AlertProps) {
  return (
    <div
      className={cn("rounded-xl border px-4 py-3 text-sm font-medium", variantClasses[variant], className)}
      {...props}
    />
  );
}
