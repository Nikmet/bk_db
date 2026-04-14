"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createRestaurantAction, updateRestaurantAction } from "@/actions/manage-restaurant-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type ActivityFilter = "all" | "active" | "inactive";

interface RestaurantRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  managersCount: number;
}

interface RestaurantFormState {
  code: string;
  name: string;
  isActive: boolean;
}

interface RestaurantsCatalogProps {
  restaurants: RestaurantRecord[];
}

function getDefaultFormState(): RestaurantFormState {
  return {
    code: "",
    name: "",
    isActive: true,
  };
}

function toFormState(restaurant: RestaurantRecord): RestaurantFormState {
  return {
    code: restaurant.code,
    name: restaurant.name,
    isActive: restaurant.isActive,
  };
}

export function RestaurantsCatalog({ restaurants }: RestaurantsCatalogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("active");
  const [editingRestaurantId, setEditingRestaurantId] = useState<string | null>(null);
  const [formState, setFormState] = useState<RestaurantFormState>(getDefaultFormState());
  const [isPending, startTransition] = useTransition();

  const filteredRestaurants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      if (activityFilter === "active" && !restaurant.isActive) {
        return false;
      }

      if (activityFilter === "inactive" && restaurant.isActive) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        restaurant.code.toLowerCase().includes(query) ||
        restaurant.name.toLowerCase().includes(query)
      );
    });
  }, [activityFilter, restaurants, searchQuery]);

  const activeCount = useMemo(() => restaurants.filter((restaurant) => restaurant.isActive).length, [restaurants]);

  const resetForm = () => {
    setEditingRestaurantId(null);
    setFormState(getDefaultFormState());
  };

  const handleChange = <K extends keyof RestaurantFormState>(key: K, value: RestaurantFormState[K]) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const payload = {
        code: formState.code,
        name: formState.name,
        isActive: formState.isActive,
      } as const;

      const result = editingRestaurantId
        ? await updateRestaurantAction(editingRestaurantId, payload)
        : await createRestaurantAction(payload);

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Справочник ресторанов обновлён" : "Не удалось сохранить ресторан",
        description: result.message,
      });

      if (result.ok) {
        resetForm();
        router.refresh();
      }
    });
  };

  const handleEdit = (restaurant: RestaurantRecord) => {
    setEditingRestaurantId(restaurant.id);
    setFormState(toFormState(restaurant));
  };

  const handleToggleActive = (restaurant: RestaurantRecord) => {
    startTransition(async () => {
      const result = await updateRestaurantAction(restaurant.id, {
        code: restaurant.code,
        name: restaurant.name,
        isActive: !restaurant.isActive,
      });

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Статус ресторана обновлён" : "Не удалось обновить ресторан",
        description: result.message,
      });

      if (result.ok) {
        if (editingRestaurantId === restaurant.id) {
          resetForm();
        }
        router.refresh();
      }
    });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-3xl">Справочник ресторанов</CardTitle>
              <CardDescription>Создавайте рестораны и управляйте их доступностью для менеджеров и админа.</CardDescription>
            </div>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Новый ресторан
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Всего ресторанов: {restaurants.length}</Badge>
            <Badge variant="success">Активных: {activeCount}</Badge>
            <Badge variant="warning">В таблице: {filteredRestaurants.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Поиск по коду и названию"
              placeholder="Например: ARBAT, Арбат"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="restaurants-activity-filter">
                Активность
              </label>
              <select
                id="restaurants-activity-filter"
                value={activityFilter}
                onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
                className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
              >
                <option value="active">Только активные</option>
                <option value="inactive">Только неактивные</option>
                <option value="all">Все рестораны</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRestaurants.length === 0 ? (
            <EmptyState
              title="Рестораны не найдены"
              description="Измените фильтр или создайте новый ресторан через форму справа."
            />
          ) : (
            <div className="max-h-[72vh] overflow-auto rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)]">
              <table className="min-w-[760px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--bk-surface-strong)]">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Код</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Название</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Менеджеров</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Статус</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map((restaurant) => (
                    <tr key={restaurant.id} className="border-t border-[var(--bk-border)] odd:bg-[#fdfbf8]">
                      <td className="px-3 py-2 font-mono text-xs">{restaurant.code}</td>
                      <td className="px-3 py-2 font-medium">{restaurant.name}</td>
                      <td className="px-3 py-2 text-right">{restaurant.managersCount}</td>
                      <td className="px-3 py-2">
                        <Badge variant={restaurant.isActive ? "success" : "warning"}>
                          {restaurant.isActive ? "Активен" : "Отключён"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(restaurant)}>
                            Редактировать
                          </Button>
                          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => handleToggleActive(restaurant)}>
                            {restaurant.isActive ? "Отключить" : "Включить"}
                          </Button>
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
          <CardTitle className="text-2xl">{editingRestaurantId ? "Редактирование ресторана" : "Новый ресторан"}</CardTitle>
          <CardDescription>
            {editingRestaurantId
              ? "Измените код, название и статус ресторана."
              : "Создайте новый ресторан для привязки менеджеров и работы админа."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Код"
            value={formState.code}
            onChange={(event) => handleChange("code", event.target.value.toUpperCase())}
            placeholder="Например: BK_ARBAT"
          />
          <Input
            label="Название"
            value={formState.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="Например: BK Арбат"
          />
          {editingRestaurantId ? (
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--bk-text)]">
              <input
                type="checkbox"
                checked={formState.isActive}
                onChange={(event) => handleChange("isActive", event.target.checked)}
                className="h-4 w-4 rounded border-[var(--bk-border)] accent-[var(--bk-primary)]"
              />
              Ресторан активен
            </label>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--bk-border)] pt-4">
            <Button type="button" variant="secondary" onClick={resetForm}>
              Сбросить
            </Button>
            <Button type="button" onClick={handleSubmit} loading={isPending}>
              {editingRestaurantId ? "Сохранить изменения" : "Создать ресторан"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
