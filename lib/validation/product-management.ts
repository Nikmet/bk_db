import { z } from "zod";

const unitEnum = z.enum(["PIECE", "KILOGRAM", "LITER"]);

const orderModeEnum = z.enum(["PIECE", "PACK", "BOX"]);

export const productManagementSchema = z.object({
  categoryId: z.string().trim().min(1, "Выберите категорию."),
  code: z
    .string()
    .trim()
    .min(1, "Укажите код номенклатуры.")
    .max(64, "Код номенклатуры слишком длинный.")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(1, "Укажите наименование продукта.").max(255, "Наименование слишком длинное."),
  unit: unitEnum,
  unitsPerBox: z.coerce.number().int("Укажите целое значение.").min(0, "Значение не может быть отрицательным.").max(1_000_000),
  unitsPerPack: z.coerce.number().int("Укажите целое значение.").min(0, "Значение не может быть отрицательным.").max(1_000_000),
  consumptionRate: z.coerce.number().min(0, "Значение не может быть отрицательным.").max(1_000_000),
  orderMode: orderModeEnum,
  orderStep: z.coerce.number().positive("Шаг заказа должен быть больше 0.").max(1_000_000),
  isActive: z.boolean(),
});

export type ProductManagementValues = z.infer<typeof productManagementSchema>;
