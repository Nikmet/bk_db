"use client";

import { FormEvent, useTransition } from "react";
import { useRouter } from "next/navigation";

import { saveCalculationParamsAction } from "@/actions/save-calculation-params-action";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

export function CalculationParamsForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await saveCalculationParamsAction(formData);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Параметры приняты" : "Ошибка сохранения",
        description: result.message,
      });

      if (result.ok) {
        router.push("/dashboard/calculation/result");
        router.refresh();
      }
    });
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
      <Input
        name="forecastGuests"
        type="number"
        min={1}
        defaultValue={450}
        label="Прогноз гостей на смену"
        required
      />
      <Input
        name="leadTimeDays"
        type="number"
        min={0}
        defaultValue={2}
        label="Срок поставки (дни)"
        required
      />
      <Input
        name="safetyPercent"
        type="number"
        min={0}
        max={100}
        defaultValue={8}
        label="Страховой запас (%)"
        required
      />
      <div className="md:col-span-2">
        <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-[var(--bk-text-muted)]">
          Комментарий к расчёту
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="w-full rounded-xl border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 py-2 text-sm text-[var(--bk-text)] shadow-sm outline-none transition focus:border-[var(--bk-orange)] focus:ring-2 focus:ring-[var(--bk-orange-soft)]"
          placeholder="Например: ожидается пик по доставке в вечерние часы"
        />
      </div>
      <div className="md:col-span-2 flex justify-end gap-2">
        <Button type="submit" size="lg" loading={isPending}>
          Сохранить и открыть результат
        </Button>
      </div>
    </form>
  );
}
