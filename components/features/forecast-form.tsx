"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { calculateOrderAction } from "@/actions/calculate-order-action";
import { forecastFormSchema, type ForecastFormValues } from "@/lib/validation/forecast";

interface RevenuePoint {
  date: string;
  revenue: number;
  isForecast?: boolean;
}

const historicalRevenue: RevenuePoint[] = [
  { date: "03.03", revenue: 284000 },
  { date: "04.03", revenue: 301500 },
  { date: "05.03", revenue: 297200 },
  { date: "06.03", revenue: 315900 },
  { date: "07.03", revenue: 329400 },
  { date: "08.03", revenue: 322100 },
  { date: "09.03", revenue: 336800 },
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function toNumber(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function getTomorrowLabel(calculationDate: string): string {
  if (!calculationDate) {
    return "Завтра";
  }

  const parsedDate = new Date(calculationDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Завтра";
  }

  parsedDate.setDate(parsedDate.getDate() + 1);
  return parsedDate.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

export function ForecastForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCalculating, startCalculateTransition] = useTransition();
  const [lastOrderCalculationId, setLastOrderCalculationId] = useState<string | null>(null);

  const form = useForm<ForecastFormValues>({
    resolver: zodResolver(forecastFormSchema),
    defaultValues: {
      calculationDate: new Date().toISOString().slice(0, 10),
      nearestSupplyDate: "",
      nextSupplyDate: "",
      turnoverBeforeNearest: 0,
      turnoverBeforeNext: 0,
      safetyStockDays: 2,
    },
    mode: "onSubmit",
  });

  const calculationDate = form.watch("calculationDate");
  const turnoverBeforeNext = Number(form.watch("turnoverBeforeNext") ?? 0);

  const forecastRevenue = useMemo(() => {
    if (turnoverBeforeNext > 0) {
      return Math.round(turnoverBeforeNext / 2);
    }

    const lastHistorical = historicalRevenue[historicalRevenue.length - 1]?.revenue ?? 0;
    return Math.round(lastHistorical * 1.04);
  }, [turnoverBeforeNext]);

  const chartData = useMemo(() => {
    return [
      ...historicalRevenue,
      {
        date: getTomorrowLabel(calculationDate),
        revenue: forecastRevenue,
        isForecast: true,
      },
    ];
  }, [calculationDate, forecastRevenue]);

  const handleCalculate = form.handleSubmit(
    (values) => {
      startCalculateTransition(async () => {
        const result = await calculateOrderAction(values);

        if (result.ok) {
          setLastOrderCalculationId(result.orderCalculationId ?? null);
          toast({
            type: "success",
            title: "Расчёт успешно выполнен",
          });
          return;
        }

        toast({
          type: "error",
          title: "Не все данные введены",
        });
      });
    },
    () => {
      toast({
        type: "error",
        title: "Не все данные введены",
      });
    },
  );

  return (
    <div className="space-y-6">
      <Card className="border-[var(--bk-primary)] bg-[var(--bk-primary-soft)]">
        <CardContent className="py-4">
          <p className="text-sm font-semibold text-[var(--bk-primary-strong)]">
            Поставка осуществляется по понедельникам, средам и пятницам
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Параметры прогноза поставки</CardTitle>
          <CardDescription>Заполните обязательные поля для расчёта заказа.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCalculate} className="grid gap-4 md:grid-cols-2">
            <Input
              type="date"
              label="Дата расчёта"
              error={form.formState.errors.calculationDate?.message}
              {...form.register("calculationDate")}
            />
            <Input
              type="date"
              label="Дата ближайшей поставки"
              error={form.formState.errors.nearestSupplyDate?.message}
              {...form.register("nearestSupplyDate")}
            />
            <Input
              type="date"
              label="Дата следующей поставки"
              error={form.formState.errors.nextSupplyDate?.message}
              {...form.register("nextSupplyDate")}
            />
            <Input
              type="number"
              min={0}
              step={1000}
              label="Товарооборот до ближайшей поставки"
              error={form.formState.errors.turnoverBeforeNearest?.message}
              {...form.register("turnoverBeforeNearest", { valueAsNumber: true })}
            />
            <Input
              type="number"
              min={0}
              step={1000}
              label="Товарооборот до следующей поставки"
              error={form.formState.errors.turnoverBeforeNext?.message}
              {...form.register("turnoverBeforeNext", { valueAsNumber: true })}
            />
            <Input
              type="number"
              min={1}
              step={1}
              label="Страховой запас в днях"
              error={form.formState.errors.safetyStockDays?.message}
              {...form.register("safetyStockDays", { valueAsNumber: true })}
            />

            <div className="md:col-span-2 flex flex-wrap justify-end gap-2 pt-2">
              <Button type="submit" loading={isCalculating}>
                Рассчитать заказ
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  if (lastOrderCalculationId) {
                    router.push(`/dashboard/calculation/result?orderCalculationId=${lastOrderCalculationId}`);
                    return;
                  }

                  router.push("/dashboard/calculation/result");
                }}
              >
                Показать заказ
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>График выручки</CardTitle>
          <CardDescription>Моковые исторические данные и прогноз на следующий день.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-80 w-full rounded-xl border border-[var(--bk-border)] bg-white p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0d7bf" />
                <XAxis dataKey="date" tick={{ fill: "#6f4b2f", fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fill: "#6f4b2f", fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatMoney(toNumber(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #f5cba7",
                    backgroundColor: "#fff",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#d62300"
                  strokeWidth={3}
                  dot={(props) => {
                    const payload = props.payload as RevenuePoint;
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={payload.isForecast ? 6 : 4}
                        fill={payload.isForecast ? "#0f8f58" : "#d62300"}
                        stroke="#fff"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-[var(--bk-success)] bg-[var(--bk-success-soft)] p-4">
            <p className="text-sm text-[var(--bk-text-muted)]">Прогноз на следующий день</p>
            <p className="mt-1 text-2xl font-black text-[var(--bk-success)]">{formatMoney(forecastRevenue)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
