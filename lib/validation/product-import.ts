import { z } from "zod";

const numericFieldSchema = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = Number(String(value).replace(",", "."));
  return Number.isFinite(normalized) ? normalized : NaN;
}, z.number());

export const productImportRowSchema = z.object({
  code: z.string().trim().min(1, "Пустой код"),
  name: z.string().trim().min(1, "Пустое наименование"),
  category: z.string().trim().min(1, "Пустая категория"),
  unitsPerBox: numericFieldSchema.refine((value) => value >= 0, "unitsPerBox должен быть >= 0"),
  unitsPerPack: numericFieldSchema.refine((value) => value >= 0, "unitsPerPack должен быть >= 0"),
  unit: z.string().trim().min(1, "Пустая единица"),
  consumptionRate: numericFieldSchema.refine((value) => value >= 0, "consumptionRate должен быть >= 0"),
  orderMode: z.string().trim().min(1, "Пустой orderMode"),
  orderStep: numericFieldSchema.refine((value) => value > 0, "orderStep должен быть > 0"),
});

export type ProductImportRowData = z.infer<typeof productImportRowSchema>;

export interface ProductImportDraftRow {
  code: string;
  name: string;
  category: string;
  unitsPerBox: number | string;
  unitsPerPack: number | string;
  unit: string;
  consumptionRate: number | string;
  orderMode: string;
  orderStep: number | string;
}
