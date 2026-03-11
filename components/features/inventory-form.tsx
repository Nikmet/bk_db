"use client";

import { FormEvent, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveInventoryAction } from "@/actions/save-inventory-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function InventoryForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const initialDate = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await saveInventoryAction(formData);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Остатки сохранены" : "Ошибка сохранения",
        description: result.message,
      });

      if (result.ok) {
        form.reset();
        const dateInput = form.querySelector<HTMLInputElement>('input[name="snapshotDate"]');
        if (dateInput) {
          dateInput.value = initialDate;
        }
        router.refresh();
      }
    });
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <Input name="location" label="Точка поставки" placeholder="BK Москва #12" required />
      <Input name="snapshotDate" type="date" label="Дата остатков" defaultValue={initialDate} required />
      <Input name="buns" type="number" min={0} label="Булочки (шт.)" defaultValue={0} required />
      <Input name="patties" type="number" min={0} label="Котлеты (шт.)" defaultValue={0} required />
      <Input name="fries" type="number" min={0} label="Картофель фри (порции)" defaultValue={0} required />
      <div className="md:col-span-2">
        <label htmlFor="comment" className="mb-1.5 block text-sm font-medium text-[var(--bk-text-muted)]">
          Комментарий
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={3}
          className="w-full rounded-xl border border-[var(--bk-border)] bg-white px-3 py-2 text-sm text-[var(--bk-text)] shadow-sm outline-none transition focus:border-[var(--bk-primary)] focus:ring-2 focus:ring-[var(--bk-primary-soft)]"
          placeholder="Например: поставка курицы задерживается"
        />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" size="lg" loading={isPending}>
          Сохранить остатки
        </Button>
      </div>
    </form>
  );
}
