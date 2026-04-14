"use client";

import { FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface LoginFormProps {
  callbackUrl?: string;
}

async function getCsrfToken(): Promise<string | null> {
  const response = await fetch("/api/auth/csrf");

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { csrfToken?: string };
  return data.csrfToken ?? null;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [errorText, setErrorText] = useState<string | null>(null);

  const targetUrl =
    callbackUrl && callbackUrl.startsWith("/dashboard") ? callbackUrl : "/dashboard/inventory";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const username = formData.get("username")?.toString().trim() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    setErrorText(null);

    if (username.length < 3) {
      setErrorText("Логин должен содержать минимум 3 символа");
      return;
    }

    if (password.length < 6) {
      setErrorText("Пароль должен содержать минимум 6 символов");
      return;
    }

    startTransition(async () => {
      const csrfToken = await getCsrfToken();

      if (!csrfToken) {
        const message = "Не удалось инициализировать форму входа";
        setErrorText(message);
        toast({
          type: "error",
          title: "Ошибка входа",
          description: message,
        });
        return;
      }

      const response = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          username,
          password,
          csrfToken,
          callbackUrl: targetUrl,
          json: "true",
        }),
      });

      const data = (await response.json()) as { url?: string };
      const error = data.url ? new URL(data.url, window.location.origin).searchParams.get("error") : "CredentialsSignin";

      if (!response.ok || error) {
        const message = "Неверный логин или пароль";
        setErrorText(message);
        toast({
          type: "error",
          title: "Ошибка входа",
          description: message,
        });
        return;
      }

      toast({
        type: "success",
        title: "Успешный вход",
        description: "Переходим в рабочую панель.",
      });

      router.push(data.url ?? targetUrl);
      router.refresh();
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input name="username" label="Логин" placeholder="например, менеджер" autoComplete="username" autoFocus required />
      <Input
        name="password"
        label="Пароль"
        type="password"
        autoComplete="current-password"
        required
        error={errorText ?? undefined}
      />
      <Button type="submit" className="w-full" size="lg" loading={isPending}>
        Войти
      </Button>
    </form>
  );
}
