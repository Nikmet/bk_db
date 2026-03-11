"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { calculateAndSaveOrder } from "@/lib/services/calculate-order";
import { forecastFormSchema, type ForecastFormValues } from "@/lib/validation/forecast";

export interface CalculateOrderActionResult {
  ok: boolean;
  message: string;
  orderCalculationId?: string;
}

export async function calculateOrderAction(values: ForecastFormValues): Promise<CalculateOrderActionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      ok: false,
      message: "Сессия истекла. Выполните вход повторно.",
    };
  }

  const parsed = forecastFormSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Не все данные введены",
    };
  }

  try {
    const result = await calculateAndSaveOrder({
      calculationDate: new Date(parsed.data.calculationDate),
      nearestSupplyDate: new Date(parsed.data.nearestSupplyDate),
      nextSupplyDate: new Date(parsed.data.nextSupplyDate),
      turnoverToNearestDelivery: parsed.data.turnoverBeforeNearest,
      turnoverToNextDelivery: parsed.data.turnoverBeforeNext,
      safetyStockDays: parsed.data.safetyStockDays,
      userId: session.user.id,
    });

    return {
      ok: true,
      message: "Расчёт успешно выполнен",
      orderCalculationId: result.orderCalculationId,
    };
  } catch {
    return {
      ok: false,
      message: "Не все данные введены",
    };
  }
}
