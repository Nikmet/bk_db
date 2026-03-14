import type { ReactNode } from "react";

import { PrivateShell } from "@/components/layout/private-shell";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  return <PrivateShell>{children}</PrivateShell>;
}
