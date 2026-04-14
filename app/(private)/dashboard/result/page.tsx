import { redirect } from "next/navigation";

import { requireRestaurantScope } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

export default async function ResultIndexPage() {
  let scope;

  try {
    scope = await requireRestaurantScope();
  } catch {
    redirect("/dashboard/forecast");
  }

  const latest = await prisma.orderCalculation.findFirst({
    where: {
      restaurantId: scope.restaurantId,
    },
    orderBy: [{ calculatedAt: "desc" }],
    select: {
      id: true,
    },
  });

  if (!latest) {
    redirect("/dashboard/forecast");
  }

  redirect(`/dashboard/result/${latest.id}`);
}
