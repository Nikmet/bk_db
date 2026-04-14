import { z } from "zod";

export const createManagerSchema = z.object({
  username: z.string().trim().min(3, "Логин должен содержать минимум 3 символа.").max(50),
  fullName: z.string().trim().min(3, "Введите ФИО менеджера.").max(120),
  password: z.string().min(6, "Пароль должен содержать минимум 6 символов.").max(128),
  restaurantId: z.string().trim().min(1, "Выберите ресторан."),
});

export const updateManagerSchema = z.object({
  username: z.string().trim().min(3, "Логин должен содержать минимум 3 символа.").max(50),
  fullName: z.string().trim().min(3, "Введите ФИО менеджера.").max(120),
  password: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => !value || value.length >= 6, "Пароль должен содержать минимум 6 символов."),
  restaurantId: z.string().trim().min(1, "Выберите ресторан."),
  isActive: z.boolean(),
});

export type CreateManagerValues = z.infer<typeof createManagerSchema>;
export type UpdateManagerValues = z.infer<typeof updateManagerSchema>;
