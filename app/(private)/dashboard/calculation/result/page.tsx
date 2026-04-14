import { redirect } from "next/navigation";

export default async function LegacyCalculationResultPage() {
  redirect("/dashboard/result");
}
