import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

export default async function ResultIndexPage() {
  const latest = await prisma.orderCalculation.findFirst({
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
