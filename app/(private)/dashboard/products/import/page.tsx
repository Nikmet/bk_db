import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { ProductsImportForm } from "@/components/features/products-import-form";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductsImportPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard/inventory");
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/dashboard/products"
          className="inline-flex h-9 items-center rounded-md border border-[var(--bk-border)] bg-[var(--bk-surface-soft)] px-4 text-sm font-semibold text-[var(--bk-text)] transition-colors hover:border-[var(--bk-border-strong)] hover:bg-[#ece6df]"
        >
          К справочнику товаров
        </Link>
      </div>
      <ProductsImportForm />
    </div>
  );
}
