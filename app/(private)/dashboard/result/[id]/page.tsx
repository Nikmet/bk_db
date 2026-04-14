import { notFound, redirect } from "next/navigation";

import { OrderResultView } from "@/components/features/order-result-view";
import { requireRestaurantScope } from "@/lib/auth-context";
import { prisma } from "@/lib/prisma";

interface ResultByIdPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultByIdPage({ params }: ResultByIdPageProps) {
  const { id } = await params;

  let scope;

  try {
    scope = await requireRestaurantScope();
  } catch {
    redirect("/dashboard/forecast");
  }

  const calculation = await prisma.orderCalculation.findFirst({
    where: {
      id,
      restaurantId: scope.restaurantId,
    },
    include: {
      inventorySession: {
        select: {
          location: true,
          restaurant: {
            select: {
              name: true,
            },
          },
        },
      },
      items: {
        include: {
          product: {
            select: {
              code: true,
              name: true,
              unitsPerBox: true,
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!calculation) {
    notFound();
  }

  const viewData = {
    id: calculation.id,
    status: calculation.status,
    calculatedAt: calculation.calculatedAt.toISOString(),
    location: calculation.inventorySession?.restaurant.name ?? calculation.inventorySession?.location,
    items: calculation.items.map((item) => ({
      id: item.id,
      code: item.product.code,
      name: item.product.name,
      categoryName: item.product.category.name,
      currentStock: item.currentStock,
      predictedConsumption: item.predictedConsumption,
      safetyStockQuantity: item.safetyStockQuantity,
      recommendedOrderQty: item.recommendedOrderQty,
      recommendedOrderRoundedQty: item.recommendedOrderRoundedQty,
      unitsPerBox: item.product.unitsPerBox,
    })),
  };

  return <OrderResultView calculation={viewData} managerUsername={scope.user.fullName} />;
}
