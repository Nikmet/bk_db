import { z } from "zod";

const numericInputSchema = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}, z.number().int("Введите целое число").min(0, "Значение не может быть отрицательным"));

export const inventoryRowSchema = z.object({
  productId: z.string().min(1, "Не указан товар"),
  boxCount: numericInputSchema,
  packCount: numericInputSchema,
  pieceCount: numericInputSchema,
});

export const inventoryFormSchema = z.object({
  rows: z.array(inventoryRowSchema).min(1, "Список товаров пуст"),
});

export type InventoryFormValues = z.infer<typeof inventoryFormSchema>;
