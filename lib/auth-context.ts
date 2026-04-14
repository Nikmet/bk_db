import { cookies } from "next/headers";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const ACTIVE_RESTAURANT_COOKIE = "bk_active_restaurant_id";

export interface AuthenticatedUserContext {
  id: string;
  username: string;
  fullName: string;
  role: "ADMIN" | "MANAGER";
  isActive: boolean;
  restaurantId: string | null;
  restaurantName: string | null;
}

export interface RestaurantOption {
  id: string;
  code: string;
  name: string;
}

export interface RestaurantScope {
  user: AuthenticatedUserContext;
  restaurantId: string | null;
  restaurantName: string | null;
  availableRestaurants: RestaurantOption[];
}

export interface ResolvedRestaurantScope extends RestaurantScope {
  restaurantId: string;
}

export async function getAuthenticatedUserContext(): Promise<AuthenticatedUserContext | null> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      isActive: true,
      restaurantId: true,
      restaurant: {
        select: {
          name: true,
          isActive: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const restaurantIsAvailable = user.restaurantId && user.restaurant?.isActive;

  if (user.role === "MANAGER" && !restaurantIsAvailable) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    isActive: user.isActive,
    restaurantId: restaurantIsAvailable ? user.restaurantId : null,
    restaurantName: restaurantIsAvailable ? user.restaurant?.name ?? null : null,
  };
}

export async function requireAuthenticatedUserContext(): Promise<AuthenticatedUserContext> {
  const user = await getAuthenticatedUserContext();

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireAdminUserContext(): Promise<AuthenticatedUserContext> {
  const user = await requireAuthenticatedUserContext();

  if (user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function getRestaurantScope(): Promise<RestaurantScope> {
  const user = await requireAuthenticatedUserContext();

  if (user.role === "MANAGER") {
    return {
      user,
      restaurantId: user.restaurantId,
      restaurantName: user.restaurantName,
      availableRestaurants: user.restaurantId && user.restaurantName
        ? [{ id: user.restaurantId, code: user.restaurantId, name: user.restaurantName }]
        : [],
    };
  }

  const activeRestaurants = await prisma.restaurant.findMany({
    where: {
      isActive: true,
    },
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  const cookieStore = await cookies();
  const activeRestaurantId = cookieStore.get(ACTIVE_RESTAURANT_COOKIE)?.value ?? null;
  const currentRestaurant = activeRestaurants.find((restaurant) => restaurant.id === activeRestaurantId) ?? activeRestaurants[0] ?? null;

  return {
    user,
    restaurantId: currentRestaurant?.id ?? null,
    restaurantName: currentRestaurant?.name ?? null,
    availableRestaurants: activeRestaurants,
  };
}

export async function requireRestaurantScope(): Promise<ResolvedRestaurantScope> {
  const scope = await getRestaurantScope();

  if (!scope.restaurantId) {
    throw new Error("RESTAURANT_REQUIRED");
  }

  return {
    ...scope,
    restaurantId: scope.restaurantId,
  };
}
