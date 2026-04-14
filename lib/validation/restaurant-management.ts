import { z } from "zod";

export const restaurantManagementSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Код ресторана должен содержать минимум 2 символа.")
    .max(32)
    .regex(/^[A-Z0-9_-]+$/, "Код ресторана может содержать только латинские буквы, цифры, дефис и нижнее подчёркивание.")
    .transform((value) => value.toUpperCase()),
  name: z.string().trim().min(3, "Введите название ресторана.").max(120),
  isActive: z.boolean(),
});

export type RestaurantManagementValues = z.infer<typeof restaurantManagementSchema>;
