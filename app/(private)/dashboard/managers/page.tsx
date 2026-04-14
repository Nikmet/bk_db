import { redirect } from "next/navigation";

import { ManagersCatalog } from "@/components/features/managers-catalog";
import { getAuthenticatedUserContext } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ManagersPage() {
  const user = await getAuthenticatedUserContext();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/dashboard/inventory");
  }

  const [managers, restaurants] = await Promise.all([
    prisma.user.findMany({
      where: {
        role: "MANAGER",
      },
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        username: true,
        fullName: true,
        isActive: true,
        restaurantId: true,
        restaurant: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.restaurant.findMany({
      where: {
        isActive: true,
      },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  return (
    <ManagersCatalog
      managers={managers.map((manager) => ({
        id: manager.id,
        username: manager.username,
        fullName: manager.fullName,
        restaurantId: manager.restaurantId,
        restaurantName: manager.restaurant?.name ?? null,
        isActive: manager.isActive,
      }))}
      restaurants={restaurants}
    />
  );
}
