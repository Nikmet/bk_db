# Система расчёта поставок Burger King

Внутренняя веб-система для ввода остатков, расчёта заказа и работы со справочником товаров.

## Технологии

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (Credentials)
- Bun

## Основные страницы

- `/login` — вход в систему
- `/dashboard/inventory` — ввод остатков
- `/dashboard/forecast` — параметры прогноза и запуск расчёта
- `/dashboard/result/[id]` — результат расчёта
- `/dashboard/products/import` — импорт справочника товаров

## Локальный запуск

1. Установите зависимости:

```bash
bun install
```

2. Создайте `.env`:

```bash
cp .env.example .env
```

3. Примените миграции и сгенерируйте Prisma Client:

```bash
bun prisma:migrate
bun prisma:generate
```

4. Создайте тестового пользователя:

```bash
bun prisma:seed
```

5. Запустите приложение:

```bash
bun dev
```

## Проверка перед деплоем

```bash
bun lint
bun run build
```

## Переменные окружения

- `DATABASE_URL` — строка подключения PostgreSQL
- `NEXTAUTH_URL` — базовый URL приложения
- `NEXTAUTH_SECRET` — секрет для подписи JWT/сессии

## Деплой на Vercel

Проект уже подготовлен к деплою:

- добавлен `vercel.json` c Bun-командами сборки;
- добавлен `.vercelignore` для уменьшения deployment context;
- `postinstall` выполняет `prisma generate`.

### Вариант 1: через интерфейс Vercel

1. Импортируйте репозиторий в Vercel.
2. В `Environment Variables` добавьте:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (например `https://<project>.vercel.app`)
   - `NEXTAUTH_SECRET`
3. Запустите Deploy.

### Вариант 2: через Vercel CLI

```bash
vercel
```

Для production-деплоя:

```bash
vercel --prod
```

## Полезные команды

```bash
bun prisma:generate
bun prisma:migrate
bun prisma:seed
bun db:push
bun db:studio
```
