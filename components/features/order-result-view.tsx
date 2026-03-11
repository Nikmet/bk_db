"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

type Unit = "PIECE" | "KILOGRAM" | "LITER";

type SortDirection = "asc" | "desc";

interface ResultItem {
  id: string;
  code: string;
  name: string;
  categoryName: string;
  currentStock: number;
  predictedConsumption: number;
  safetyStockQuantity: number;
  recommendedOrderQty: number;
  recommendedOrderRoundedQty: number;
  unit: Unit;
}

interface ResultViewData {
  id: string;
  status: "DRAFT" | "READY";
  calculatedAt: string;
  location?: string;
  items: ResultItem[];
}

interface OrderResultViewProps {
  calculation: ResultViewData;
}

function getUnitLabel(unit: Unit): string {
  if (unit === "KILOGRAM") {
    return "кг";
  }

  if (unit === "LITER") {
    return "л";
  }

  return "шт";
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ru-RU");
}

export function OrderResultView({ calculation }: OrderResultViewProps) {
  const router = useRouter();
  const [onlyOrderItems, setOnlyOrderItems] = useState(false);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const processedItems = useMemo(() => {
    const filtered = onlyOrderItems
      ? calculation.items.filter((item) => item.recommendedOrderRoundedQty > 0)
      : calculation.items;

    const sorted = [...filtered].sort((a, b) => {
      const categoryA = a.categoryName.toLowerCase();
      const categoryB = b.categoryName.toLowerCase();

      if (categoryA !== categoryB) {
        return sortDirection === "asc"
          ? categoryA.localeCompare(categoryB, "ru")
          : categoryB.localeCompare(categoryA, "ru");
      }

      return a.code.localeCompare(b.code, "ru");
    });

    return sorted;
  }, [calculation.items, onlyOrderItems, sortDirection]);

  const totalRounded = processedItems.reduce((sum, item) => sum + item.recommendedOrderRoundedQty, 0);

  const exportCsv = () => {
    const headers = [
      "Категория",
      "Код номенклатуры",
      "Наименование продукта",
      "Текущий остаток",
      "Прогнозируемый расход",
      "Страховой запас",
      "Рекомендуемое количество",
      "Округлённое количество",
      "Единица измерения",
    ];

    const rows = processedItems.map((item) =>
      [
        item.categoryName,
        item.code,
        item.name,
        item.currentStock.toFixed(2),
        item.predictedConsumption.toFixed(2),
        item.safetyStockQuantity.toFixed(2),
        item.recommendedOrderQty.toFixed(2),
        item.recommendedOrderRoundedQty.toFixed(2),
        getUnitLabel(item.unit),
      ].join(";"),
    );

    const csv = `\uFEFF${[headers.join(";"), ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `order-result-${calculation.id}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="print:shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Результат расчёта заказа</CardTitle>
              <CardDescription>
                Расчёт от {formatDate(calculation.calculatedAt)} • Точка: {calculation.location ?? "не указана"}
              </CardDescription>
            </div>
            <Badge variant={calculation.status === "READY" ? "success" : "warning"}>{calculation.status}</Badge>
          </div>
          <div className="print:hidden grid gap-3 md:grid-cols-[auto_auto_1fr_auto_auto_auto] md:items-center">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--bk-text)]">
              <input
                type="checkbox"
                checked={onlyOrderItems}
                onChange={(event) => setOnlyOrderItems(event.target.checked)}
                className="h-4 w-4 rounded border-[var(--bk-border)] accent-[var(--bk-primary)]"
              />
              показывать только товары к заказу
            </label>

            <label className="inline-flex items-center gap-2 text-sm">
              <span className="text-[var(--bk-text-muted)]">Сортировка по категории</span>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                className="h-9 rounded-lg border border-[var(--bk-border)] bg-[var(--bk-surface)] px-2 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-orange)] focus:ring-2 focus:ring-[var(--bk-orange-soft)]"
              >
                <option value="asc">A-Z</option>
                <option value="desc">Z-A</option>
              </select>
            </label>

            <div />

            <Button type="button" variant="secondary" onClick={exportCsv}>
              Экспорт в CSV
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Печатная версия
            </Button>
            <Button type="button" onClick={() => router.push("/dashboard/forecast")}>
              Назад к параметрам
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex items-center justify-between text-sm text-[var(--bk-text-muted)]">
            <p>Позиций в таблице: {processedItems.length}</p>
            <p className="font-semibold">Итого округлённое количество: {totalRounded.toFixed(2)}</p>
          </div>

          {processedItems.length === 0 ? (
            <EmptyState
              title="Нет товаров к заказу"
              description="Измените фильтр или выполните новый расчёт с другими параметрами."
            />
          ) : (
            <div className="max-h-[68vh] overflow-auto rounded-2xl border border-[var(--bk-border)] bg-[var(--bk-surface)] print:max-h-none print:overflow-visible">
            <table className="min-w-[1240px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-[var(--bk-surface-strong)] shadow-sm print:static">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Код номенклатуры</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Наименование продукта</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Текущий остаток</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Прогнозируемый расход</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Страховой запас</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Рекомендуемое количество</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Округлённое количество</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Единица измерения</th>
                </tr>
              </thead>
              <tbody>
                {processedItems.map((item) => (
                  <tr key={item.id} className="border-t border-[var(--bk-border)] odd:bg-[#fffdfa]">
                    <td className="px-3 py-2 font-mono text-xs">{item.code}</td>
                    <td className="px-3 py-2">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-[var(--bk-text-muted)]">{item.categoryName}</p>
                    </td>
                    <td className="px-3 py-2 text-right">{item.currentStock.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{item.predictedConsumption.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{item.safetyStockQuantity.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">{item.recommendedOrderQty.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-[var(--bk-primary-strong)]">
                      {item.recommendedOrderRoundedQty.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-center">{getUnitLabel(item.unit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}

          <div className="print:hidden mt-4 flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/forecast")}>
              Назад к параметрам
            </Button>
            <Button type="button" onClick={() => router.push("/dashboard/inventory")}>
              Новый расчёт
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
