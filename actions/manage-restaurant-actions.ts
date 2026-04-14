"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUserContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";
import { restaurantManagementSchema, type RestaurantManagementValues } from "@/lib/validation/restaurant-management";

export interface ManageRestaurantActionResult {
  ok: boolean;
  message: string;
}

function revalidateRestaurantPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/inventory");
  revalidatePath("/dashboard/forecast");
  revalidatePath("/dashboard/result");
  revalidatePath("/dashboard/restaurants");
}

export async function createRestaurantAction(values: RestaurantManagementValues): Promise<ManageRestaurantActionResult> {
  try {
    await requireAdminUserContext();
  } catch {
    return {
      ok: false,
      message: "Недостаточно прав для управления ресторанами.",
    };
  }

  const parsed = restaurantManagementSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность формы ресторана.",
    };
  }

  const data = parsed.data;

  const duplicate = await prisma.restaurant.findFirst({
    where: {
      OR: [{ code: data.code }, { name: data.name }],
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  if (duplicate) {
    return {
      ok: false,
      message: duplicate.code === data.code ? "Ресторан с таким кодом уже существует." : "Ресторан с таким названием уже существует.",
    };
  }

  await prisma.restaurant.create({
    data,
  });

  revalidateRestaurantPaths();

  return {
    ok: true,
    message: "Ресторан успешно создан.",
  };
}

export async function updateRestaurantAction(
  restaurantId: string,
  values: RestaurantManagementValues,
): Promise<ManageRestaurantActionResult> {
  try {
    await requireAdminUserContext();
  } catch {
    return {
      ok: false,
      message: "Недостаточно прав для управления ресторанами.",
    };
  }

  const parsed = restaurantManagementSchema.safeParse(values);

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность формы ресторана.",
    };
  }

  const data = parsed.data;

  const [restaurant, duplicate] = await Promise.all([
    prisma.restaurant.findUnique({
      where: {
        id: restaurantId,
      },
      select: {
        id: true,
        isActive: true,
      },
    }),
    prisma.restaurant.findFirst({
      where: {
        OR: [{ code: data.code }, { name: data.name }],
        NOT: {
          id: restaurantId,
        },
      },
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
  ]);

  if (!restaurant) {
    return {
      ok: false,
      message: "Ресторан не найден.",
    };
  }

  if (duplicate) {
    return {
      ok: false,
      message: duplicate.code === data.code ? "Ресторан с таким кодом уже существует." : "Ресторан с таким названием уже существует.",
    };
  }

  if (!data.isActive && restaurant.isActive) {
    const [activeManagersCount, activeRestaurantsCount] = await Promise.all([
      prisma.user.count({
        where: {
          role: "MANAGER",
          isActive: true,
          restaurantId,
        },
      }),
      prisma.restaurant.count({
        where: {
          isActive: true,
        },
      }),
    ]);

    if (activeRestaurantsCount <= 1) {
      return {
        ok: false,
        message: "Нельзя деактивировать последний активный ресторан.",
      };
    }

    if (activeManagersCount > 0) {
      return {
        ok: false,
        message: "Сначала переназначьте или деактивируйте активных менеджеров этого ресторана.",
      };
    }
  }

  await prisma.restaurant.update({
    where: {
      id: restaurantId,
    },
    data,
  });

  revalidateRestaurantPaths();

  return {
    ok: true,
    message: data.isActive ? "Ресторан успешно обновлён." : "Ресторан деактивирован.",
  };
}
