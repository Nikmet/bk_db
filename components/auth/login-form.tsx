"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

interface LoginFormProps {
  callbackUrl?: string;
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
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (!result || result.error) {
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

      router.push(targetUrl);
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
