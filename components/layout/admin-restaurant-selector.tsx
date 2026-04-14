"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { setActiveRestaurantAction } from "@/actions/set-active-restaurant-action";
import { useToast } from "@/components/ui/toast";

interface AdminRestaurantSelectorProps {
  currentRestaurantId: string | null;
  restaurants: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export function AdminRestaurantSelector({ currentRestaurantId, restaurants }: AdminRestaurantSelectorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  if (!restaurants.length) {
    return (
      <div className="rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface-soft)] px-3 py-2 text-xs text-[var(--bk-text-muted)]">
        Нет активных ресторанов
      </div>
    );
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="font-semibold text-[var(--bk-text)]">Ресторан</span>
      <select
        value={currentRestaurantId ?? restaurants[0]?.id ?? ""}
        disabled={isPending}
        onChange={(event) => {
          const nextRestaurantId = event.target.value;

          startTransition(async () => {
            const result = await setActiveRestaurantAction(nextRestaurantId);

            if (!result.ok) {
              toast({
                type: "error",
                title: "Не удалось выбрать ресторан",
                description: result.message,
              });
              return;
            }

            router.refresh();
          });
        }}
        className="h-9 min-w-[220px] rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
      >
        {restaurants.map((restaurant) => (
          <option key={restaurant.id} value={restaurant.id}>
            {restaurant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
