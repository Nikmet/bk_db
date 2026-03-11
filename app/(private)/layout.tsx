import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import type { ReactNode } from "react";

import { PrivateShell } from "@/components/layout/private-shell";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return <PrivateShell username={session.user.username} role={session.user.role}>{children}</PrivateShell>;
}
