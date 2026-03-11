import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export function EmptyState({ className, title, description, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed border-[var(--bk-border-strong)] bg-[var(--bk-surface)] px-6 py-8 text-center",
        className,
      )}
      {...props}
    >
      <p className="text-base font-semibold text-[var(--bk-text)]">{title}</p>
      {description ? <p className="mt-1 text-sm text-[var(--bk-text-muted)]">{description}</p> : null}
    </div>
  );
}
