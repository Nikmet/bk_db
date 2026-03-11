import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard/inventory");
  }

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md bg-[var(--bk-panel)]">
        <CardHeader>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--bk-primary)]">Система поставок Бургер Кинг</p>
          <CardTitle className="text-3xl">Вход в систему</CardTitle>
          <CardDescription>Введите логин и пароль сотрудника для доступа к расчётам поставки.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={params.callbackUrl} />
        </CardContent>
      </Card>
    </div>
  );
}
