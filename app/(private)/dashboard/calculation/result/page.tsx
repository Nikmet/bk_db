import { OrderCalculationResultPanel } from "@/components/features/calculation-result-panel";
import { prisma } from "@/lib/prisma";

interface CalculationResultPageProps {
  searchParams: Promise<{ orderCalculationId?: string }>;
}

export default async function CalculationResultPage({ searchParams }: CalculationResultPageProps) {
  const params = await searchParams;

  const latestCalculation = params.orderCalculationId
    ? await prisma.orderCalculation.findUnique({
        where: {
          id: params.orderCalculationId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  code: true,
                  name: true,
                  unit: true,
                  orderMode: true,
                },
              },
            },
            orderBy: {
              product: {
                code: "asc",
              },
            },
          },
          inventorySession: {
            select: {
              location: true,
              sessionDate: true,
            },
          },
        },
      })
    : await prisma.orderCalculation.findFirst({
        orderBy: [{ calculatedAt: "desc" }],
        include: {
          items: {
            include: {
              product: {
                select: {
                  code: true,
                  name: true,
                  unit: true,
                  orderMode: true,
                },
              },
            },
            orderBy: {
              product: {
                code: "asc",
              },
            },
          },
          inventorySession: {
            select: {
              location: true,
              sessionDate: true,
            },
          },
        },
      });

  return <OrderCalculationResultPanel calculation={latestCalculation} />;
}
