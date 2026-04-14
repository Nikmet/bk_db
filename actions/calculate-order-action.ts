"use server";

import { calculateAndSaveOrder } from "@/lib/services/calculate-order";
import { requireRestaurantScope } from "@/lib/auth-context";
import { forecastFormSchema, type ForecastFormValues } from "@/lib/validation/forecast";

export interface CalculateOrderActionResult {
  ok: boolean;
  message: string;
  orderCalculationId?: string;
}

export async function calculateOrderAction(values: ForecastFormValues): Promise<CalculateOrderActionResult> {
  let scope;

  try {
    scope = await requireRestaurantScope();
  } catch {
    return {
      ok: false,
      message: "Сессия истекла или ресторан недоступен.",
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
      userId: scope.user.id,
      restaurantId: scope.restaurantId,
      restaurantName: scope.restaurantName ?? "Ресторан",
    });

    return {
      ok: true,
      message: "Расчёт успешно выполнен",
      orderCalculationId: result.orderCalculationId,
    };
  } catch {
    return {
      ok: false,
      message: "Не удалось выполнить расчёт",
    };
  }
}
