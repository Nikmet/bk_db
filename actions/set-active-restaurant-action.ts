"use server";

import { cookies } from "next/headers";

import type { ActionResult } from "@/actions/action-result";
import { ACTIVE_RESTAURANT_COOKIE, requireAdminUserContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

export async function setActiveRestaurantAction(restaurantId: string): Promise<ActionResult> {
  try {
    await requireAdminUserContext();
  } catch {
    return {
      ok: false,
      message: "Недостаточно прав для выбора ресторана.",
    };
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: {
      id: restaurantId,
      isActive: true,
    },
    select: {
      id: true,
    },
  });

  if (!restaurant) {
    return {
      ok: false,
      message: "Активный ресторан не найден.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_RESTAURANT_COOKIE, restaurant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return {
    ok: true,
    message: "Ресторан выбран.",
  };
}
