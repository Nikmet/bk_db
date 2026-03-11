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
    <div className="flex w-full flex-col gap-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-semibold text-[var(--bk-text)]">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "h-9 w-full rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none transition-colors duration-150 placeholder:text-[#a1968c] focus:border-[var(--bk-border-strong)] focus:ring-0 disabled:bg-[#f3efe9] disabled:text-[#a1968c]",
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
