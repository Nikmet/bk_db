import { redirect } from "next/navigation";

import { RestaurantsCatalog } from "@/components/features/restaurants-catalog";
import { getAuthenticatedUserContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RestaurantsPage() {
  const user = await getAuthenticatedUserContext();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard/inventory");
  }

  const [restaurants, activeManagerCounts] = await Promise.all([
    prisma.restaurant.findMany({
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
      },
    }),
    prisma.user.groupBy({
      by: ["restaurantId"],
      where: {
        role: "MANAGER",
        isActive: true,
        restaurantId: {
          not: null,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const managersCountByRestaurantId = new Map(
    activeManagerCounts
      .filter((record): record is typeof record & { restaurantId: string } => Boolean(record.restaurantId))
      .map((record) => [record.restaurantId, record._count._all]),
  );

  return (
    <RestaurantsCatalog
      restaurants={restaurants.map((restaurant) => ({
        id: restaurant.id,
        code: restaurant.code,
        name: restaurant.name,
        isActive: restaurant.isActive,
        managersCount: managersCountByRestaurantId.get(restaurant.id) ?? 0,
      }))}
    />
  );
}
