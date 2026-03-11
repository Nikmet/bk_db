import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ResultData {
  id: string;
  status: "DRAFT" | "READY";
  createdAt: Date;
  summary: unknown;
  params?: {
    forecastGuests: number;
    leadTimeDays: number;
    safetyPercent: number;
  } | null;
  inventorySnapshot?: {
    location: string;
    snapshotDate: Date;
  } | null;
}

interface CalculationResultPanelProps {
  result: ResultData | null;
}

function getSuggestedOrders(summary: unknown): { buns: number; patties: number; fries: number } {
  if (!summary || typeof summary !== "object") {
    return { buns: 0, patties: 0, fries: 0 };
  }

  const suggestedOrders = (summary as { suggestedOrders?: Record<string, unknown> }).suggestedOrders;

  if (!suggestedOrders || typeof suggestedOrders !== "object") {
    return { buns: 0, patties: 0, fries: 0 };
  }

  return {
    buns: Number(suggestedOrders.buns ?? 0),
    patties: Number(suggestedOrders.patties ?? 0),
    fries: Number(suggestedOrders.fries ?? 0),
  };
}

export function CalculationResultPanel({ result }: CalculationResultPanelProps) {
  if (!result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет данных для отображения</CardTitle>
          <CardDescription>Сначала заполните остатки и параметры расчёта.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const suggestedOrders = getSuggestedOrders(result.summary);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Последний расчёт заказа</CardTitle>
              <CardDescription>
                Сформирован {new Date(result.createdAt).toLocaleString("ru-RU")} для точки{" "}
                {result.inventorySnapshot?.location ?? "не указана"}
              </CardDescription>
            </div>
            <Badge variant={result.status === "READY" ? "success" : "warning"}>{result.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Card className="p-4">
              <CardDescription>Прогноз гостей</CardDescription>
              <p className="mt-1 text-2xl font-black text-[var(--bk-text)]">{result.params?.forecastGuests ?? 0}</p>
            </Card>
            <Card className="p-4">
              <CardDescription>Срок поставки</CardDescription>
              <p className="mt-1 text-2xl font-black text-[var(--bk-text)]">{result.params?.leadTimeDays ?? 0} дн.</p>
            </Card>
            <Card className="p-4">
              <CardDescription>Страховой запас</CardDescription>
              <p className="mt-1 text-2xl font-black text-[var(--bk-text)]">{result.params?.safetyPercent ?? 0}%</p>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Рекомендованные позиции к заказу</CardTitle>
          <CardDescription>Демо-результат для валидации интерфейса и потоков данных.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Позиция</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Единица</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Булочки</TableCell>
                <TableCell>{suggestedOrders.buns}</TableCell>
                <TableCell>шт.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Котлеты</TableCell>
                <TableCell>{suggestedOrders.patties}</TableCell>
                <TableCell>шт.</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Картофель фри</TableCell>
                <TableCell>{suggestedOrders.fries}</TableCell>
                <TableCell>порции</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
