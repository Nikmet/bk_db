"use client";

import { useTransition } from "react";

import { Button } from "@/components/ui/button";

async function getCsrfToken(): Promise<string | null> {
  const response = await fetch("/api/auth/csrf");

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { csrfToken?: string };
  return data.csrfToken ?? null;
}

export function LogoutButton() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      const csrfToken = await getCsrfToken();

      if (!csrfToken) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          csrfToken,
          callbackUrl: "/login",
          json: "true",
        }),
      });

      const data = (await response.json()) as { url?: string };
      window.location.href = data.url ?? "/login";
    });
  };

  return (
    <Button size="sm" variant="secondary" onClick={handleLogout} loading={isPending}>
      Выйти
    </Button>
  );
}
