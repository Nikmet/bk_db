import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { PrivateShell } from "@/components/layout/private-shell";
import { getAuthenticatedUserContext, getRestaurantScope } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

export default async function PrivateLayout({ children }: { children: ReactNode }) {
  const user = await getAuthenticatedUserContext();

  if (!user) {
    redirect("/login");
  }

  const scope = await getRestaurantScope();

  return (
    <PrivateShell
      fullName={user.fullName}
      username={user.username}
      role={user.role}
      restaurantName={scope.restaurantName}
      currentRestaurantId={scope.restaurantId}
      availableRestaurants={scope.availableRestaurants}
    >
      {children}
    </PrivateShell>
  );
}
