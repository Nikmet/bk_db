"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { saveInventorySessionAction } from "@/actions/save-inventory-session-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { inventoryFormSchema, type InventoryFormValues } from "@/lib/validation/inventory";

type Unit = "PIECE" | "KILOGRAM" | "LITER";

interface InventoryProduct {
  id: string;
  code: string;
  name: string;
  unit: Unit;
  unitsPerBox: number;
  unitsPerPack: number;
}

interface InventoryCategory {
  id: string;
  name: string;
  products: InventoryProduct[];
}

interface InventoryTableFormProps {
  categories: InventoryCategory[];
}

function parseCountInput(value: unknown): number {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? Math.max(0, Math.trunc(numeric)) : 0;
}

function toNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
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

export function InventoryTableForm({ categories }: InventoryTableFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const allProducts = useMemo(() => categories.flatMap((category) => category.products), [categories]);

  const rowIndexByProductId = useMemo(() => {
    const map = new Map<string, number>();

    allProducts.forEach((product, index) => {
      map.set(product.id, index);
    });

    return map;
  }, [allProducts]);

  const form = useForm<z.input<typeof inventoryFormSchema>, unknown, InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      rows: allProducts.map((product) => ({
        productId: product.id,
        boxCount: 0,
        packCount: 0,
        pieceCount: 0,
      })),
    },
  });

  const watchedRows = form.watch("rows");

  const filteredCategories = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return categories;
    }

    return categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) => {
          const code = product.code.toLowerCase();
          const name = product.name.toLowerCase();
          return code.includes(normalizedQuery) || name.includes(normalizedQuery);
        }),
      }))
      .filter((category) => category.products.length > 0);
  }, [categories, searchQuery]);

  const handleDownloadBlank = () => {
    const headers = [
      "Категория",
      "Код номенклатуры",
      "Наименование продукта",
      "Штук в коробке",
      "Штук в упаковке",
      "Единица",
      "Ввод коробок",
      "Ввод упаковок",
      "Ввод штук/кг/л",
      "Общее количество",
    ];

    const rows = categories.flatMap((category) =>
      category.products.map((product) =>
        [
          category.name,
          product.code,
          product.name,
          product.unitsPerBox,
          product.unitsPerPack,
          getUnitLabel(product.unit),
          "",
          "",
          "",
          "",
        ].join(";"),
      ),
    );

    const csv = `\uFEFF${[headers.join(";"), ...rows].join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-blank-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveInventorySessionAction(values);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Остатки сохранены" : "Ошибка сохранения",
        description: result.message,
      });

      if (result.ok && result.nextUrl) {
        router.push(result.nextUrl);
        router.refresh();
      }
    });
  });

  return (
    <Card>
      <CardHeader className="gap-3">
        <CardTitle>Ввод остатков продуктов</CardTitle>
        <CardDescription>
          Пустые поля автоматически считаются как 0. Общее количество рассчитывается мгновенно на основе коробок,
          упаковок и единиц.
        </CardDescription>
        <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <Input
            label="Поиск по коду и наименованию"
            placeholder="Например: BUN или булочка"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
          <Button type="button" variant="secondary" className="self-end" onClick={handleDownloadBlank}>
            Скачать бланк подсчёта
          </Button>
          <Button type="submit" form="inventory-session-form" className="self-end" loading={isPending}>
            Далее
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form id="inventory-session-form" onSubmit={onSubmit} className="space-y-3">
          <div className="overflow-auto rounded-2xl border border-[var(--bk-border)] bg-white shadow-sm">
            <table className="min-w-[1320px] w-full border-collapse text-sm">
              <thead className="sticky top-0 z-20 bg-[var(--bk-surface)] text-[var(--bk-text)]">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">Код номенклатуры</th>
                  <th className="px-3 py-3 text-left font-semibold">Наименование продукта</th>
                  <th className="px-3 py-3 text-right font-semibold">Штук в коробке</th>
                  <th className="px-3 py-3 text-right font-semibold">Штук в упаковке</th>
                  <th className="px-3 py-3 text-center font-semibold">Единица</th>
                  <th className="px-3 py-3 text-right font-semibold">Ввод коробок</th>
                  <th className="px-3 py-3 text-right font-semibold">Ввод упаковок</th>
                  <th className="px-3 py-3 text-right font-semibold">Ввод штук/кг/л</th>
                  <th className="px-3 py-3 text-right font-semibold">Общее количество</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-[var(--bk-text-muted)]">
                      По вашему запросу товары не найдены.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <Fragment key={category.id}>
                      <tr className="bg-[var(--bk-surface-strong)]">
                        <td colSpan={9} className="px-3 py-2 text-sm font-semibold text-[var(--bk-text)]">
                          {category.name}
                        </td>
                      </tr>
                      {category.products.map((product) => {
                        const rowIndex = rowIndexByProductId.get(product.id);

                        if (rowIndex === undefined) {
                          return null;
                        }

                        const rowValue = watchedRows?.[rowIndex];
                        const totalQuantity =
                          toNumber(rowValue?.boxCount) * product.unitsPerBox +
                          toNumber(rowValue?.packCount) * product.unitsPerPack +
                          toNumber(rowValue?.pieceCount);

                        return (
                          <tr key={product.id} className="border-t border-[var(--bk-border)] odd:bg-[#fffdf9]">
                            <td className="px-3 py-2 font-mono text-xs">{product.code}</td>
                            <td className="px-3 py-2">{product.name}</td>
                            <td className="px-3 py-2 text-right">{product.unitsPerBox}</td>
                            <td className="px-3 py-2 text-right">{product.unitsPerPack}</td>
                            <td className="px-3 py-2 text-center">{getUnitLabel(product.unit)}</td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="h-9 w-full rounded-lg border border-[var(--bk-border)] bg-white px-2 text-right text-sm outline-none focus:border-[var(--bk-primary)] focus:ring-2 focus:ring-[var(--bk-primary-soft)]"
                                {...form.register(`rows.${rowIndex}.boxCount`, {
                                  setValueAs: parseCountInput,
                                })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="h-9 w-full rounded-lg border border-[var(--bk-border)] bg-white px-2 text-right text-sm outline-none focus:border-[var(--bk-primary)] focus:ring-2 focus:ring-[var(--bk-primary-soft)]"
                                {...form.register(`rows.${rowIndex}.packCount`, {
                                  setValueAs: parseCountInput,
                                })}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="number"
                                min={0}
                                step={1}
                                className="h-9 w-full rounded-lg border border-[var(--bk-border)] bg-white px-2 text-right text-sm outline-none focus:border-[var(--bk-primary)] focus:ring-2 focus:ring-[var(--bk-primary-soft)]"
                                {...form.register(`rows.${rowIndex}.pieceCount`, {
                                  setValueAs: parseCountInput,
                                })}
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-semibold text-[var(--bk-primary-strong)]">
                              {totalQuantity}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {form.formState.errors.rows ? (
            <p className="text-sm text-[var(--bk-danger)]">Проверьте введённые значения в таблице.</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
