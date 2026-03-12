"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { saveInventorySessionAction } from "@/actions/save-inventory-session-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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

function formatPrintDate(): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
}

export function InventoryTableForm({ categories }: InventoryTableFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();
  const [printDate, setPrintDate] = useState("");

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

  const totalProducts = allProducts.length;
  const visibleProducts = filteredCategories.reduce((sum, category) => sum + category.products.length, 0);

  useEffect(() => {
    setPrintDate(formatPrintDate());
  }, []);

  const handlePrintBlank = () => {
    window.print();
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

  if (totalProducts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ввод остатков продуктов</CardTitle>
          <CardDescription>Справочник товаров пока пуст. Загрузите или заполните номенклатуру перед вводом остатков.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <EmptyState
            title="Нет товаров для ввода"
            description="Перейдите в справочник товаров, чтобы загрузить импорт или создать позиции вручную."
          />
          <div className="flex justify-end">
            <Button type="button" onClick={() => router.push("/dashboard/products")}>
              Перейти к справочнику товаров
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="print:rounded-none print:border-none print:bg-white print:p-0">
      <div className="print:hidden">
        <CardHeader className="gap-4">
          <CardTitle className="text-4xl">Ввод остатков продуктов</CardTitle>
          <CardDescription>
            Пустые поля автоматически считаются как 0. Общее количество рассчитывается мгновенно на основе коробок,
            упаковок и единиц.
          </CardDescription>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Позиций: {totalProducts}</Badge>
            <Badge variant="warning">Отображается: {visibleProducts}</Badge>
            {isPending ? <Badge variant="success">Сохранение...</Badge> : null}
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <Input
              label="Поиск по коду и наименованию"
              placeholder="Например: BUN или булочка"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <Button type="button" variant="secondary" className="self-end" onClick={handlePrintBlank}>
              Распечатать бланк
            </Button>
            <Button type="submit" form="inventory-session-form" className="self-end" loading={isPending}>
              Далее
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form id="inventory-session-form" onSubmit={onSubmit} className="space-y-3">
            {isPending ? (
              <div className="space-y-2 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] p-4">
                <Skeleton className="h-8 w-52" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : null}
            <div className="max-h-[72vh] overflow-auto rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)]">
              <table className="min-w-[1320px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-20 bg-[var(--bk-surface-strong)] text-[var(--bk-text)]">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Код номенклатуры
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Наименование продукта
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Штук в коробке
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Штук в упаковке
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Единица
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Ввод коробок
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Ввод упаковок
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Ввод штук/кг/л
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Общее количество
                    </th>
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
                        <tr className="bg-[var(--bk-surface-soft)]">
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
                            <tr key={product.id} className="border-t border-[var(--bk-border)] odd:bg-[#fdfbf8]">
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
                                  className="h-8 w-full rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-2 text-right text-sm outline-none transition-colors focus:border-[var(--bk-border-strong)] focus:ring-0"
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
                                  className="h-8 w-full rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-2 text-right text-sm outline-none transition-colors focus:border-[var(--bk-border-strong)] focus:ring-0"
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
                                  className="h-8 w-full rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-2 text-right text-sm outline-none transition-colors focus:border-[var(--bk-border-strong)] focus:ring-0"
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
              <div className="rounded-xl border border-[#efb8b4] bg-[var(--bk-danger-soft)] px-3 py-2 text-sm text-[var(--bk-danger)]">
                Проверьте введённые значения в таблице.
              </div>
            ) : null}
          </form>
        </CardContent>
      </div>

      <div className="print-inventory-blank hidden print:block">
        <div className="mb-3 space-y-1">
          <h1 className="text-xl font-bold text-[#1f1f1f]">Бланк ввода остатков продуктов</h1>
          <p className="text-xs text-[#555]">Дата печати: {printDate || "—"}</p>
          <p className="text-xs text-[#555]">Поля ввода заполняются вручную. Все пустые графы предназначены для печатного бланка.</p>
        </div>

        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-left font-semibold uppercase tracking-wide text-[#444]">
                Код номенклатуры
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-left font-semibold uppercase tracking-wide text-[#444]">
                Наименование продукта
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-right font-semibold uppercase tracking-wide text-[#444]">
                Штук в коробке
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-right font-semibold uppercase tracking-wide text-[#444]">
                Штук в упаковке
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-center font-semibold uppercase tracking-wide text-[#444]">
                Единица
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-right font-semibold uppercase tracking-wide text-[#444]">
                Ввод коробок
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-right font-semibold uppercase tracking-wide text-[#444]">
                Ввод упаковок
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-right font-semibold uppercase tracking-wide text-[#444]">
                Ввод штук/кг/л
              </th>
              <th className="border border-[#bdb7b0] px-1.5 py-1 text-right font-semibold uppercase tracking-wide text-[#444]">
                Общее количество
              </th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <Fragment key={category.id}>
                <tr>
                  <td colSpan={9} className="border border-[#bdb7b0] bg-[#f1ebe4] px-1.5 py-1.5 text-left font-semibold text-[#222]">
                    {category.name}
                  </td>
                </tr>
                {category.products.map((product) => (
                  <tr key={product.id}>
                    <td className="border border-[#bdb7b0] px-1.5 py-1 font-mono text-[9px]">{product.code}</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1">{product.name}</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1 text-right">{product.unitsPerBox}</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1 text-right">{product.unitsPerPack}</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1 text-center">{getUnitLabel(product.unit)}</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1">&nbsp;</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1">&nbsp;</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1">&nbsp;</td>
                    <td className="border border-[#bdb7b0] px-1.5 py-1">&nbsp;</td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
