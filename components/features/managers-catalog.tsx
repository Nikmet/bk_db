"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createManagerAction, updateManagerAction } from "@/actions/manage-manager-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

type ActivityFilter = "all" | "active" | "inactive";

interface RestaurantOption {
  id: string;
  name: string;
}

interface ManagerRecord {
  id: string;
  username: string;
  fullName: string;
  restaurantId: string | null;
  restaurantName: string | null;
  isActive: boolean;
}

interface ManagerFormState {
  username: string;
  fullName: string;
  password: string;
  restaurantId: string;
  isActive: boolean;
}

interface ManagersCatalogProps {
  managers: ManagerRecord[];
  restaurants: RestaurantOption[];
}

function getDefaultFormState(restaurants: RestaurantOption[]): ManagerFormState {
  return {
    username: "",
    fullName: "",
    password: "",
    restaurantId: restaurants[0]?.id ?? "",
    isActive: true,
  };
}

function toFormState(manager: ManagerRecord): ManagerFormState {
  return {
    username: manager.username,
    fullName: manager.fullName,
    password: "",
    restaurantId: manager.restaurantId ?? "",
    isActive: manager.isActive,
  };
}

export function ManagersCatalog({ managers, restaurants }: ManagersCatalogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("active");
  const [editingManagerId, setEditingManagerId] = useState<string | null>(null);
  const [formState, setFormState] = useState<ManagerFormState>(getDefaultFormState(restaurants));
  const [isPending, startTransition] = useTransition();

  const filteredManagers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return managers.filter((manager) => {
      if (activityFilter === "active" && !manager.isActive) {
        return false;
      }

      if (activityFilter === "inactive" && manager.isActive) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        manager.username.toLowerCase().includes(query) ||
        manager.fullName.toLowerCase().includes(query) ||
        (manager.restaurantName ?? "").toLowerCase().includes(query)
      );
    });
  }, [activityFilter, managers, searchQuery]);

  const activeCount = useMemo(() => managers.filter((manager) => manager.isActive).length, [managers]);

  const resetForm = () => {
    setEditingManagerId(null);
    setFormState(getDefaultFormState(restaurants));
  };

  const handleChange = <K extends keyof ManagerFormState>(key: K, value: ManagerFormState[K]) => {
    setFormState((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = () => {
    if (!restaurants.length) {
      toast({
        type: "error",
        title: "Нет доступных ресторанов",
        description: "Сначала создайте активный ресторан.",
      });
      return;
    }

    startTransition(async () => {
      const result = editingManagerId
        ? await updateManagerAction(editingManagerId, {
            username: formState.username,
            fullName: formState.fullName,
            password: formState.password || undefined,
            restaurantId: formState.restaurantId,
            isActive: formState.isActive,
          })
        : await createManagerAction({
            username: formState.username,
            fullName: formState.fullName,
            password: formState.password,
            restaurantId: formState.restaurantId,
          });

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Менеджеры обновлены" : "Не удалось сохранить менеджера",
        description: result.message,
      });

      if (result.ok) {
        resetForm();
        router.refresh();
      }
    });
  };

  const handleEdit = (manager: ManagerRecord) => {
    setEditingManagerId(manager.id);
    setFormState(toFormState(manager));
  };

  const handleToggleActive = (manager: ManagerRecord) => {
    startTransition(async () => {
      const result = await updateManagerAction(manager.id, {
        username: manager.username,
        fullName: manager.fullName,
        password: undefined,
        restaurantId: manager.restaurantId ?? restaurants[0]?.id ?? "",
        isActive: !manager.isActive,
      });

      toast({
        type: result.ok ? "success" : "error",
        title: result.ok ? "Статус менеджера обновлён" : "Не удалось обновить менеджера",
        description: result.message,
      });

      if (result.ok) {
        if (editingManagerId === manager.id) {
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
              <CardTitle className="text-3xl">Справочник менеджеров</CardTitle>
              <CardDescription>Создавайте учётные записи менеджеров и закрепляйте их за ресторанами.</CardDescription>
            </div>
            <Button type="button" variant="secondary" onClick={resetForm}>
              Новый менеджер
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Всего менеджеров: {managers.length}</Badge>
            <Badge variant="success">Активных: {activeCount}</Badge>
            <Badge variant="warning">В таблице: {filteredManagers.length}</Badge>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              label="Поиск по логину, ФИО и ресторану"
              placeholder="Например: admin, Иванов, Арбат"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="managers-activity-filter">
                Активность
              </label>
              <select
                id="managers-activity-filter"
                value={activityFilter}
                onChange={(event) => setActivityFilter(event.target.value as ActivityFilter)}
                className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
              >
                <option value="active">Только активные</option>
                <option value="inactive">Только неактивные</option>
                <option value="all">Все менеджеры</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredManagers.length === 0 ? (
            <EmptyState
              title="Менеджеры не найдены"
              description="Измените фильтр или создайте нового менеджера через форму справа."
            />
          ) : (
            <div className="max-h-[72vh] overflow-auto rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)]">
              <table className="min-w-[820px] w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-[var(--bk-surface-strong)]">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Логин</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">ФИО</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Ресторан</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Статус</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--bk-text-muted)]">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredManagers.map((manager) => (
                    <tr key={manager.id} className="border-t border-[var(--bk-border)] odd:bg-[#fdfbf8]">
                      <td className="px-3 py-2 font-mono text-xs">{manager.username}</td>
                      <td className="px-3 py-2 font-medium">{manager.fullName}</td>
                      <td className="px-3 py-2">{manager.restaurantName ?? "Не назначен"}</td>
                      <td className="px-3 py-2">
                        <Badge variant={manager.isActive ? "success" : "warning"}>
                          {manager.isActive ? "Активен" : "Отключён"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="secondary" size="sm" onClick={() => handleEdit(manager)}>
                            Редактировать
                          </Button>
                          <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => handleToggleActive(manager)}>
                            {manager.isActive ? "Отключить" : "Включить"}
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
          <CardTitle className="text-2xl">{editingManagerId ? "Редактирование менеджера" : "Новый менеджер"}</CardTitle>
          <CardDescription>
            {editingManagerId
              ? "Обновите логин, ФИО, ресторан и при необходимости задайте новый пароль."
              : "Создайте нового менеджера и закрепите его за рестораном."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {restaurants.length === 0 ? (
            <EmptyState
              title="Нет активных ресторанов"
              description="Сначала создайте активный ресторан, чтобы можно было назначать менеджеров."
            />
          ) : (
            <>
              <Input
                label="Логин"
                value={formState.username}
                onChange={(event) => handleChange("username", event.target.value.trim())}
                placeholder="Например: manager.arbat"
              />
              <Input
                label="ФИО"
                value={formState.fullName}
                onChange={(event) => handleChange("fullName", event.target.value)}
                placeholder="Например: Иванов Иван"
              />
              <Input
                label={editingManagerId ? "Новый пароль" : "Пароль"}
                type="password"
                value={formState.password}
                onChange={(event) => handleChange("password", event.target.value)}
                placeholder={editingManagerId ? "Оставьте пустым, чтобы не менять" : "Минимум 6 символов"}
              />
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--bk-text)]" htmlFor="manager-restaurant">
                  Ресторан
                </label>
                <select
                  id="manager-restaurant"
                  value={formState.restaurantId}
                  onChange={(event) => handleChange("restaurantId", event.target.value)}
                  className="h-9 rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface)] px-3 text-sm text-[var(--bk-text)] outline-none focus:border-[var(--bk-border-strong)]"
                >
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.id} value={restaurant.id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              {editingManagerId ? (
                <label className="inline-flex items-center gap-2 text-sm font-medium text-[var(--bk-text)]">
                  <input
                    type="checkbox"
                    checked={formState.isActive}
                    onChange={(event) => handleChange("isActive", event.target.checked)}
                    className="h-4 w-4 rounded border-[var(--bk-border)] accent-[var(--bk-primary)]"
                  />
                  Менеджер активен
                </label>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--bk-border)] pt-4">
                <Button type="button" variant="secondary" onClick={resetForm}>
                  Сбросить
                </Button>
                <Button type="button" onClick={handleSubmit} loading={isPending}>
                  {editingManagerId ? "Сохранить изменения" : "Создать менеджера"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
