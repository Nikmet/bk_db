"use server";

import { getServerSession } from "next-auth";
import { z } from "zod";

import type { ActionResult } from "@/actions/action-result";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const inventorySchema = z.object({
  location: z.string().min(2, "Укажите точку поставки"),
  snapshotDate: z.string().min(1, "Укажите дату"),
  buns: z.coerce.number().int().min(0, "Остаток булочек не может быть отрицательным"),
  patties: z.coerce.number().int().min(0, "Остаток котлет не может быть отрицательным"),
  fries: z.coerce.number().int().min(0, "Остаток картофеля не может быть отрицательным"),
  comment: z.string().max(500).optional(),
});

export async function saveInventoryAction(formData: FormData): Promise<ActionResult> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { ok: false, message: "Сессия истекла. Выполните вход повторно." };
  }

  const parsed = inventorySchema.safeParse({
    location: formData.get("location"),
    snapshotDate: formData.get("snapshotDate"),
    buns: formData.get("buns"),
    patties: formData.get("patties"),
    fries: formData.get("fries"),
    comment: formData.get("comment")?.toString().trim() || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Проверьте корректность данных.",
    };
  }

  const { location, snapshotDate, buns, patties, fries, comment } = parsed.data;

  await prisma.inventorySnapshot.create({
    data: {
      location,
      snapshotDate: new Date(snapshotDate),
      comment,
      items: {
        buns,
        patties,
        fries,
      },
      createdById: session.user.id,
    },
  });

  return { ok: true, message: "Остатки сохранены." };
}
