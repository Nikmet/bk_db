import { InventoryForm } from "@/components/features/inventory-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

function pickNumber(items: unknown, key: string): number {
  if (!items || typeof items !== "object") {
    return 0;
  }

  const value = (items as Record<string, unknown>)[key];
  return Number(value ?? 0);
}

export default async function StocksPage() {
  const recentSnapshots = await prisma.inventorySnapshot.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ввод остатков</CardTitle>
          <CardDescription>Фиксируйте текущие остатки ключевых продуктов перед расчётом поставки.</CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Последние зафиксированные остатки</CardTitle>
          <CardDescription>История для проверки данных перед запуском расчёта.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Точка</TableHead>
                <TableHead>Булочки</TableHead>
                <TableHead>Котлеты</TableHead>
                <TableHead>Фри</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSnapshots.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-[var(--bk-text-muted)]">
                    Пока нет сохранённых остатков.
                  </TableCell>
                </TableRow>
              ) : (
                recentSnapshots.map((snapshot) => (
                  <TableRow key={snapshot.id}>
                    <TableCell>{new Date(snapshot.snapshotDate).toLocaleDateString("ru-RU")}</TableCell>
                    <TableCell>{snapshot.location}</TableCell>
                    <TableCell>{pickNumber(snapshot.items, "buns")}</TableCell>
                    <TableCell>{pickNumber(snapshot.items, "patties")}</TableCell>
                    <TableCell>{pickNumber(snapshot.items, "fries")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
