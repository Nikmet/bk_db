"use server";

import { calculateAndSaveOrder } from "@/lib/services/calculate-order";
import { forecastFormSchema, type ForecastFormValues } from "@/lib/validation/forecast";

export interface CalculateOrderActionResult {
  ok: boolean;
  message: string;
  orderCalculationId?: string;
}

export async function calculateOrderAction(values: ForecastFormValues): Promise<CalculateOrderActionResult> {
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
