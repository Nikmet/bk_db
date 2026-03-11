import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, error, hint, id, ...props },
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
          "h-10 w-full rounded-xl border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] shadow-sm outline-none transition-all duration-150 placeholder:text-[#9b7c61] focus:border-[var(--bk-orange)] focus:ring-2 focus:ring-[var(--bk-orange-soft)] disabled:bg-[#f8efe3] disabled:text-[#9b7c61]",
          error && "border-[var(--bk-danger)] focus:border-[var(--bk-danger)] focus:ring-[var(--bk-danger-soft)]",
          className,
        )}
        {...props}
      />
      {!error && hint ? <p className="text-xs text-[var(--bk-text-muted)]">{hint}</p> : null}
      {error ? <p className="text-sm text-[var(--bk-danger)]">{error}</p> : null}
    </div>
  );
});
