"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  createProductAction,
  deactivateProductAction,
  updateProductAction,
} from "@/actions/manage-product-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type Unit = "PIECE" | "KILOGRAM" | "LITER";
type OrderMode = "PIECE" | "PACK" | "BOX";
type ActivityFilter = "all" | "active" | "inactive";

interface CategoryOption {
  id: string;
  name: string;
}

interface ProductRecord {
  id: string;
  code: string;
  name: string;
  unit: Unit;
  unitsPerBox: number;
  unitsPerPack: number;
  consumptionRate: number;
  orderMode: OrderMode;
  orderStep: number;
  isActive: boolean;
  categoryId: string;
  categoryName: string;
}

interface ProductsCatalogProps {
  products: ProductRecord[];
  categories: CategoryOption[];
}

interface ProductFormState {
  categoryId: string;
  code: string;
  name: string;
  unit: Unit;
  unitsPerBox: string;
  unitsPerPack: string;
  consumptionRate: string;
  orderMode: OrderMode;
  orderStep: string;
  isActive: boolean;
}

const unitOptions: Array<{ value: Unit; label: string }> = [
  { value: "PIECE", label: "Штуки" },
  { value: "KILOGRAM", label: "Килограммы" },
  { value: "LITER", label: "Литры" },
];

const orderModeOptions: Array<{ value: OrderMode; label: string }> = [
  { value: "PIECE", label: "Штуки" },
  { value: "PACK", label: "Упаковки" },
  { value: "BOX", label: "Коробки" },
];

function getDefaultFormState(categoryId: string): ProductFormState {
  return {
    categoryId,
    code: "",
    name: "",
    unit: "PIECE",
    unitsPerBox: "0",
    unitsPerPack: "0",
    consumptionRate: "0",
    orderMode: "BOX",
    orderStep: "1",
    isActive: true,
  };
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

function getOrderModeLabel(orderMode: OrderMode): string {
  if (orderMode === "PACK") {
    return "Упаковка";
  }

  if (orderMode === "BOX") {
    return "Коробка";
  }

  return "Штука";
}

function toFormState(product: ProductRecord): ProductFormState {
  return {
    categoryId: product.categoryId,
    code: product.code,
    name: product.name,
    unit: product.unit,
    unitsPerBox: String(product.unitsPerBox),
    unitsPerPack: String(product.unitsPerPack),
    consumptionRate: String(product.consumptionRate),
    orderMode: product.orderMode,
    orderStep: String(product.orderStep),
    isActive: product.isActive,
  };
}

export function ProductsCatalog({ products, categories }: ProductsCatalogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("active");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ProductFormState>(getDefaultFormState(categories[0]?.id ?? ""));
  const [isPending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      if (categoryFilter !== "all" && product.categoryId !== categoryFilter) {
        return false;
      }

      if (activityFilter === "active" && !product.isActive) {
        return false;
      }

      if (activityFilter === "inactive" && product.isActive) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        product.code.toLowerCase().includes(query) ||
        product.name.toLowerCase().includes(query) ||
        product.categoryName.toLowerCase().includes(query)
      );
    });
  }, [activityFilter, categoryFilter, products, searchQuery]);

  const activeCount = useMemo(() => products.filter((product) => product.isActive).length, [products]);

  const resetForm = () => {
    setEditingProductId(null);
    setFormState(getDefaultFormState(categories[0]?.id ?? ""));
  };

  const handleEdit = (product: ProductRecord) => {
    setEditingProductId(product.id);
    setFormState(toFormState(product));
  };

  const handleChange = <K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    if (!categories.length) {
      toast({
        type: "error",
        title: "Нет категорий",
        description: "Сначала загрузите категории через импорт товаров.",
      });
      return;
    }

    startTransition(async () => {
      const payload = {
        categoryId: formState.categoryId,
        code: formState.code,
        name: formState.name,
        unit: formState.unit,
        unitsPerBox: Number(formState.unitsPerBox),
        unitsPerPack: Number(formState.unitsPerPack),
        consumptionRate: Number(formState.consumptionRate),
        orderMode: formState.orderMode,
        orderStep: Number(formState.orderStep),
        isActive: formState.isActive,
      } as const;

      const result = editingProductId
        ? await updateProductAction(editingProductId, payload)
        : await createProductAction(payload);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Справочник обновлён" : "Не удалось сохранить товар",
        description: result.message,
      });

      if (result.ok) {
        resetForm();
        router.refresh();
      }
    });
  };

  const handleDeactivate = (product: ProductRecord) => {
    if (!product.isActive) {
      return;
    }

    const shouldProceed = window.confirm(`Деактивировать товар "${product.name}"?`);

    if (!shouldProceed) {
      return;
    }

    startTransition(async () => {
      const result = await deactivateProductAction(product.id);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Товар обновлён" : "Не удалось деактивировать товар",
        description: result.message,
      });

      if (result.ok) {
        if (editingProductId === product.id) {
          resetForm();
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-3xl">Справочник товаров</CardTitle>
              <CardDescription>
                Управляйте рабочей номенклатурой: фильтруйте, редактируйте и отключайте товары без удаления истории.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Новый товар
              </Button>
              <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/products/import")}>
                Импорт товаров
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Всего товаров: {products.length}</Badge>
            <Badge variant="success">Активных: {activeCount}</Badge>
            <Badge variant="warning">В таблице: {filteredProducts.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <Input
              label="Поиск по коду, названию и категории"
              placeholder="Например: 51610, майонез, кулер"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="products-category-filter">
                Категория
              </label>
              <select
                id="products-category-filter"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
              >
                <option value="all">Все категории</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="products-activity-filter">
                Активность
              </label>
              <select
                id="products-activity-filter"
                value={activityFilter}
                onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
                className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
              >
                <option value="active">Только активные</option>
                <option value="inactive">Только неактивные</option>
                <option value="all">Все товары</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="Товары не найдены"
              description="Измените фильтры или создайте новую номенклатурную позицию через боковую форму."
            />
          ) : (
            <div className="max-h-[72vh] overflow-auto rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)]">
              <table className="min-w-[1220px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--bk-surface-strong)]">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Код
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Наименование
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Категория
                    </th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Ед.
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      В коробке
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      В упаковке
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Норма расхода
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Режим заказа
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Шаг
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Статус
                    </th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-[var(--bk-border)] odd:bg-[#fdfbf8]">
                      <td className="px-3 py-2 font-mono text-xs">{product.code}</td>
                      <td className="px-3 py-2 font-medium">{product.name}</td>
                      <td className="px-3 py-2">{product.categoryName}</td>
                      <td className="px-3 py-2 text-center">{getUnitLabel(product.unit)}</td>
                      <td className="px-3 py-2 text-right">{product.unitsPerBox}</td>
                      <td className="px-3 py-2 text-right">{product.unitsPerPack}</td>
                      <td className="px-3 py-2 text-right">{product.consumptionRate}</td>
                      <td className="px-3 py-2">{getOrderModeLabel(product.orderMode)}</td>
                      <td className="px-3 py-2 text-right">{product.orderStep}</td>
                      <td className="px-3 py-2">
                        <Badge variant={product.isActive ? "success" : "warning"}>
                          {product.isActive ? "Активен" : "Неактивен"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(product)}>
                            Редактировать
                          </Button>
                          {product.isActive ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeactivate(product)}
                              disabled={isPending}
                            >
                              Деактивировать
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit xl:sticky xl:top-24">
        <CardHeader>
          <CardTitle className="text-2xl">{editingProductId ? "Редактирование товара" : "Новый товар"}</CardTitle>
          <CardDescription>
            {editingProductId
              ? "Изменения применяются сразу к рабочему справочнику."
              : "Добавьте новую позицию в рабочий справочник товаров."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.length === 0 ? (
            <EmptyState
              title="Нет категорий"
              description="Сначала загрузите справочник через импорт, чтобы появились категории для выбора."
            />
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="product-category">
                  Категория
                </label>
                <select
                  id="product-category"
                  value={formState.categoryId}
                  onChange={(event) => handleChange("categoryId", event.target.value)}
                  className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Код номенклатуры"
                value={formState.code}
                onChange={(event) => handleChange("code", event.target.value.toUpperCase())}
                placeholder="Например: 51610"
              />
              <Input
                label="Наименование продукта"
                value={formState.name}
                onChange={(event) => handleChange("name", event.target.value)}
                placeholder="Например: Майонез 65%"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="product-unit">
                    Единица
                  </label>
                  <select
                    id="product-unit"
                    value={formState.unit}
                    onChange={(event) => handleChange("unit", event.target.value as Unit)}
                    className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
                  >
                    {unitOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="product-order-mode">
                    Режим заказа
                  </label>
                  <select
                    id="product-order-mode"
                    value={formState.orderMode}
                    onChange={(event) => handleChange("orderMode", event.target.value as OrderMode)}
                    className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
                  >
                    {orderModeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Штук в коробке"
                  type="number"
                  min={0}
                  step="1"
                  value={formState.unitsPerBox}
                  onChange={(event) => handleChange("unitsPerBox", event.target.value)}
                />
                <Input
                  label="Штук в упаковке"
                  type="number"
                  min={0}
                  step="1"
                  value={formState.unitsPerPack}
                  onChange={(event) => handleChange("unitsPerPack", event.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Норма расхода"
                  type="number"
                  min={0}
                  step="0.0001"
                  value={formState.consumptionRate}
                  onChange={(event) => handleChange("consumptionRate", event.target.value)}
                />
                <Input
                  label="Шаг заказа"
                  type="number"
                  min={0.0001}
                  step="0.0001"
                  value={formState.orderStep}
                  onChange={(event) => handleChange("orderStep", event.target.value)}
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--bk-text)]">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={(event) => handleChange("isActive", event.target.checked)}
                  className="h-4 w-4 rounded border-[var(--bk-border)] accent-[var(--bk-primary)]"
                />
                Товар активен и доступен в рабочих сценариях
              </label>

              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--bk-border)] pt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Сбросить
                </Button>
                <Button type="button" onClick={handleSubmit} loading={isPending}>
                  {editingProductId ? "Сохранить изменения" : "Создать товар"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
