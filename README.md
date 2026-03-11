# BK Supply Calculator

Production-ready каркас внутренней системы расчёта заказов поставки для Burger King.

## Стек

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- Prisma + PostgreSQL
- NextAuth (Credentials)
- Bun

## Функциональная база

- Публичная страница входа `/login`
- Приватные страницы:
  - `/dashboard/inventory` - ввод остатков
  - `/dashboard/calculation/params` - параметры расчёта
  - `/dashboard/calculation/result` - результат расчёта (заглушка)
- Защита приватных роутов через `middleware.ts`
- Авторизация `username + password` через Prisma `User`
- Server actions для сохранения остатков и параметров
- UI-kit: `Button`, `Input`, `Card`, `Table`, `Badge`, `Toast`

## Быстрый старт

1. Установите зависимости:

```bash
bun install
```

2. Подготовьте окружение:

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

5. Запустите проект:

```bash
bun dev
```

Откройте `http://localhost:3000`.

## Тестовый доступ

- Логин: `admin`
- Пароль: `admin123`

## Важные переменные окружения

- `DATABASE_URL` - подключение к PostgreSQL
- `NEXTAUTH_URL` - базовый URL приложения
- `NEXTAUTH_SECRET` - секрет подписи JWT/сессии

## Полезные команды

```bash
bun lint
bun run build
bun db:studio
bun db:push
```
