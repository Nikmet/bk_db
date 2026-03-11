import { z } from "zod";

export const forecastFormSchema = z.object({
  calculationDate: z.string().min(1, "Укажите дату расчёта"),
  nearestSupplyDate: z.string().min(1, "Укажите дату ближайшей поставки"),
  nextSupplyDate: z.string().min(1, "Укажите дату следующей поставки"),
  turnoverBeforeNearest: z.coerce.number().positive("Введите товарооборот до ближайшей поставки"),
  turnoverBeforeNext: z.coerce.number().positive("Введите товарооборот до следующей поставки"),
  safetyStockDays: z.coerce.number().int("Введите целое число дней").min(1, "Введите страховой запас в днях"),
});

export type ForecastFormValues = z.infer<typeof forecastFormSchema>;
