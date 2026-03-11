"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ToastType = "info" | "success" | "error";

export interface ToastInput {
  type?: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastRecord {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = crypto.randomUUID();
      const nextToast: ToastRecord = {
        id,
        type: input.type ?? "info",
        title: input.title,
        description: input.description,
      };

      setToasts((current) => [...current, nextToast]);

      const durationMs = input.durationMs ?? 3000;
      setTimeout(() => dismiss(id), durationMs);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      toast,
      dismiss,
    }),
    [dismiss, toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((item) => (
          <Toast
            key={item.id}
            type={item.type}
            title={item.title}
            description={item.description}
            onClose={() => dismiss(item.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}

interface ToastProps {
  type: ToastType;
  title: string;
  description?: string;
  onClose: () => void;
}

const toastStyles: Record<ToastType, string> = {
  info: "border-[var(--bk-border)] bg-white",
  success: "border-[var(--bk-success)] bg-[var(--bk-success-soft)]",
  error: "border-[var(--bk-danger)] bg-[var(--bk-danger-soft)]",
};

export function Toast({ type, title, description, onClose }: ToastProps) {
  return (
    <div className="pointer-events-auto rounded-xl border shadow-lg">
      <div className={cn("rounded-xl border p-3", toastStyles[type])}>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[var(--bk-text)]">{title}</p>
            {description ? <p className="text-sm text-[var(--bk-text-muted)]">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-[var(--bk-text-muted)] hover:text-[var(--bk-text)]"
            aria-label="Закрыть уведомление"
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
}
