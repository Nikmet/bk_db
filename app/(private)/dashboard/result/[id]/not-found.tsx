import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResultNotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Расчёт не найден</CardTitle>
        <CardDescription>Возможно, запись была удалена или идентификатор устарел.</CardDescription>
      </CardHeader>
      <CardContent>
        <Link
          href="/dashboard/forecast"
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--bk-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--bk-primary-strong)]"
        >
          Вернуться к параметрам расчёта
        </Link>
      </CardContent>
    </Card>
  );
}
