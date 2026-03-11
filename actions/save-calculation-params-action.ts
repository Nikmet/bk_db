"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import type { ActionResult } from "@/actions/action-result";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  forecastGuests: z.coerce.number().int().min(1, "Прогноз гостей должен быть больше нуля"),
  leadTimeDays: z.coerce.number().int().min(0, "Срок поставки не может быть отрицательным"),
  safetyPercent: z.coerce.number().min(0, "Страховой запас не может быть отрицательным").max(100),
  notes: z.string().max(500).optional(),
});

export async function saveCalculationParamsAction(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, message: "Сессия истекла. Выполните вход повторно." };
  }

  const parsed = paramsSchema.safeParse({
    forecastGuests: formData.get("forecastGuests"),
    leadTimeDays: formData.get("leadTimeDays"),
    safetyPercent: formData.get("safetyPercent"),
    notes: formData.get("notes")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность параметров.",
    };
  }

  const { forecastGuests, leadTimeDays, safetyPercent, notes } = parsed.data;

  const latestSnapshot = await prisma.inventorySnapshot.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  await prisma.$transaction(async (tx) => {
    const params = await tx.calculationParams.create({
      data: {
        forecastGuests,
        leadTimeDays,
        safetyPercent,
        notes,
        createdById: session.user.id,
      },
    });

    const safetyMultiplier = 1 + safetyPercent / 100;

    await tx.calculationResult.create({
      data: {
        status: "READY",
        createdById: session.user.id,
        paramsId: params.id,
        inventorySnapshotId: latestSnapshot?.id,
        summary: {
          formulaVersion: "demo-v1",
          projectedGuests: forecastGuests,
          leadTimeDays,
          safetyPercent,
          suggestedOrders: {
            buns: Math.ceil(forecastGuests * 1.15 * safetyMultiplier),
            patties: Math.ceil(forecastGuests * 1.0 * safetyMultiplier),
            fries: Math.ceil(forecastGuests * 0.4 * safetyMultiplier),
          },
        },
      },
    });
  });

  return {
    ok: true,
    message: "Параметры расчёта сохранены. Результат обновлён.",
  };
}
