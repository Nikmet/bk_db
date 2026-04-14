"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

import { requireAdminUserContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import {
  createManagerSchema,
  updateManagerSchema,
  type CreateManagerValues,
  type UpdateManagerValues,
} from "@/lib/validation/manager-management";

export interface ManageManagerActionResult {
  ok: boolean;
  message: string;
}

function revalidateManagerPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/managers");
}

export async function createManagerAction(values: CreateManagerValues): Promise<ManageManagerActionResult> {
  try {
    await requireAdminUserContext();
  } catch {
    return {
      ok: false,
      message: "Недостаточно прав для управления менеджерами.",
    };
  }

  const parsed = createManagerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность формы менеджера.",
    };
  }

  const data = parsed.data;

  const [restaurant, duplicate] = await Promise.all([
    prisma.restaurant.findFirst({
      where: {
        id: data.restaurantId,
        isActive: true,
      },
      select: {
        id: true,
      },
    }),
    prisma.user.findUnique({
      where: {
        username: data.username,
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!restaurant) {
    return {
      ok: false,
      message: "Выбранный ресторан не найден или недоступен.",
    };
  }

  if (duplicate) {
    return {
      ok: false,
      message: "Пользователь с таким логином уже существует.",
    };
  }

  const passwordHash = await hash(data.password, 10);

  await prisma.user.create({
    data: {
      username: data.username,
      fullName: data.fullName,
      passwordHash,
      role: "MANAGER",
      isActive: true,
      restaurantId: data.restaurantId,
    },
  });

  revalidateManagerPaths();

  return {
    ok: true,
    message: "Менеджер успешно создан.",
  };
}

export async function updateManagerAction(
  managerId: string,
  values: UpdateManagerValues,
): Promise<ManageManagerActionResult> {
  try {
    await requireAdminUserContext();
  } catch {
    return {
      ok: false,
      message: "Недостаточно прав для управления менеджерами.",
    };
  }

  const parsed = updateManagerSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность формы менеджера.",
    };
  }

  const data = parsed.data;

  const [manager, restaurant, duplicate] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
      },
      select: {
        id: true,
      },
    }),
    prisma.restaurant.findFirst({
      where: {
        id: data.restaurantId,
        isActive: true,
      },
      select: {
        id: true,
      },
    }),
    prisma.user.findFirst({
      where: {
        username: data.username,
        NOT: {
          id: managerId,
        },
      },
      select: {
        id: true,
      },
    }),
  ]);

  if (!manager) {
    return {
      ok: false,
      message: "Менеджер не найден.",
    };
  }

  if (!restaurant) {
    return {
      ok: false,
      message: "Выбранный ресторан не найден или недоступен.",
    };
  }

  if (duplicate) {
    return {
      ok: false,
      message: "Пользователь с таким логином уже существует.",
    };
  }

  await prisma.user.update({
    where: {
      id: managerId,
    },
    data: {
      username: data.username,
      fullName: data.fullName,
      isActive: data.isActive,
      restaurantId: data.restaurantId,
      ...(data.password ? { passwordHash: await hash(data.password, 10) } : {}),
    },
  });

  revalidateManagerPaths();

  return {
    ok: true,
    message: "Менеджер успешно обновлён.",
  };
}
