import { redirect } from "next/navigation";

import { getAuthenticatedUserContext } from "@/lib/auth-context";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getAuthenticatedUserContext();

  redirect(user ? "/dashboard/inventory" : "/login");
}
