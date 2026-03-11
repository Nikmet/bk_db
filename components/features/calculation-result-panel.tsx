import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface OrderCalculationResultPanelProps {
  calculation:
    | {
        id: string;
        status: "DRAFT" | "READY";
        calculatedAt: Date;
        summary: unknown;
        inventorySession?: {
          location: string;
          sessionDate: Date;
        } | null;
        items: Array<{
          id: string;
          currentStock: number;
          predictedConsumption: number;
          safetyStockQuantity: number;
          recommendedOrderQty: number;
          recommendedOrderRoundedQty: number;
          product: {
            code: string;
            name: string;
            unit: "PIECE" | "KILOGRAM" | "LITER";
            orderMode: "PIECE" | "PACK" | "BOX";
          };
        }>;
      }
    | null;
}

function getUnitLabel(unit: "PIECE" | "KILOGRAM" | "LITER"): string {
  if (unit === "KILOGRAM") {
    return "кг";
  }

  if (unit === "LITER") {
    return "л";
  }

  return "шт";
}

export function OrderCalculationResultPanel({ calculation }: OrderCalculationResultPanelProps) {
  if (!calculation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет данных для отображения</CardTitle>
          <CardDescription>Выполните расчёт на странице прогноза и откройте заказ повторно.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalRoundedOrder = calculation.items.reduce(
    (sum, item) => sum + item.recommendedOrderRoundedQty,
    0,
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Результат расчёта заказа</CardTitle>
              <CardDescription>
                Сформирован {new Date(calculation.calculatedAt).toLocaleString("ru-RU")} для точки{" "}
                {calculation.inventorySession?.location ?? "не указана"}
              </CardDescription>
            </div>
            <Badge variant={calculation.status === "READY" ? "success" : "warning"}>{calculation.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Card className="p-4">
              <CardDescription>Позиций в расчёте</CardDescription>
              <p className="mt-1 text-2xl font-black text-[var(--bk-text)]">{calculation.items.length}</p>
            </Card>
            <Card className="p-4">
              <CardDescription>Суммарный округлённый заказ</CardDescription>
              <p className="mt-1 text-2xl font-black text-[var(--bk-text)]">{totalRoundedOrder.toFixed(2)}</p>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Детализация по товарам</CardTitle>
          <CardDescription>Расчётные поля и округлённое количество заказа по каждому продукту.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Код</TableHead>
                <TableHead>Продукт</TableHead>
                <TableHead>Текущий остаток</TableHead>
                <TableHead>Прогноз расхода</TableHead>
                <TableHead>Страховой запас</TableHead>
                <TableHead>Потребность</TableHead>
                <TableHead>Рекоменд. заказ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calculation.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-xs">{item.product.code}</TableCell>
                  <TableCell>{item.product.name}</TableCell>
                  <TableCell>{item.currentStock.toFixed(2)} {getUnitLabel(item.product.unit)}</TableCell>
                  <TableCell>{item.predictedConsumption.toFixed(2)} {getUnitLabel(item.product.unit)}</TableCell>
                  <TableCell>{item.safetyStockQuantity.toFixed(2)} {getUnitLabel(item.product.unit)}</TableCell>
                  <TableCell>{item.recommendedOrderQty.toFixed(2)} {getUnitLabel(item.product.unit)}</TableCell>
                  <TableCell>
                    <span className="font-semibold text-[var(--bk-primary-strong)]">
                      {item.recommendedOrderRoundedQty.toFixed(2)} {item.product.orderMode}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
