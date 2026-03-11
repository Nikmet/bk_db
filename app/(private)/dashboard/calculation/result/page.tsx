import { CalculationResultPanel } from "@/components/features/calculation-result-panel";
import { prisma } from "@/lib/prisma";

export default async function CalculationResultPage() {
  const latestResult = await prisma.calculationResult.findFirst({
    orderBy: { createdAt: "desc" },
    include: {
      params: {
        select: {
          forecastGuests: true,
          leadTimeDays: true,
          safetyPercent: true,
        },
      },
      inventorySnapshot: {
        select: {
          location: true,
          snapshotDate: true,
        },
      },
    },
  });

  return <CalculationResultPanel result={latestResult} />;
}

