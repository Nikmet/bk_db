import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--bk-text-muted)]">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-10 w-full rounded-xl border border-[var(--bk-border)] bg-white px-3 text-sm text-[var(--bk-text)] shadow-sm outline-none transition focus:border-[var(--bk-primary)] focus:ring-2 focus:ring-[var(--bk-primary-soft)]",
          error && "border-[var(--bk-danger)] focus:border-[var(--bk-danger)] focus:ring-[var(--bk-danger-soft)]",
          className,
        )}
        {...props}
      />
      {error ? <p className="text-sm text-[var(--bk-danger)]">{error}</p> : null}
    </div>
  );
});
