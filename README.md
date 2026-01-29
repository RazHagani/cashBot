# cashBot – Multi-User Personal Finance Tracker + Telegram Bot

## Apps
- `apps/web`: Next.js (App Router) dashboard + Supabase Auth + RLS
- `apps/bot`: GrammY Telegram bot + OpenAI parsing + Supabase (Service Role)

## Prerequisites
- Node.js 20+
- Supabase project
- Telegram bot token
- OpenAI API key

## 1) Database (Supabase)
Run the SQL in:
- `supabase/migrations/0001_init.sql`

Then, in Supabase Auth:
- Enable **Email/Password**
- (Optional) Enable **Google** provider

## 2) Environment variables

### Web (`apps/web/.env.local`)
Copy from `apps/web/.env.example` and set values.
- `NEXT_PUBLIC_SITE_URL`: נדרש ל־Google OAuth redirect (ב־Vercel לשים את הדומיין של הפרויקט)

### Bot (`apps/bot/.env.local`)
Copy from `apps/bot/.env.example` and set values.
- `SUPABASE_SERVICE_ROLE_KEY` הוא סוד שרת בלבד (לא לשים ב־web).

## 3) Install dependencies
From repo root:

```bash
npm install
```

## 4) Run

```bash
# Web
npm run dev:web

# Bot (polling)
npm run dev:bot
```

## Deployment (recommended)

### Web (Vercel)
- **Build Command**: `npm run build:web`
- **Install Command**: `npm install`
- **Output**: Next.js default
- **Env vars** (Project Settings → Environment Variables):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SITE_URL` (למשל `https://your-project.vercel.app`)

### Bot (Railway/Render/Fly)
הבוט צריך לרוץ כתהליך Node.js מתמשך (polling).

- **Start Command**: `npm run start:bot`
- **Env vars**:
  - `TELEGRAM_BOT_TOKEN`
  - `OPENAI_API_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Quick setup checklist
- להריץ SQL: `supabase/migrations/0001_init.sql`
- להגדיר Auth Providers ב־Supabase
- למלא env ב־`apps/web/.env.local` ו־`apps/bot/.env.local`
- `npm install`
- `npm run dev:web` ואז להתחבר/להרשם
- `/settings` → ליצור Sync Code ולשלוח לבוט
- לשלוח לבוט הודעה כמו: `Lunch 50`

## Notes
- Web relies on Supabase RLS for multi-user isolation.
- Bot uses Supabase **Service Role** (server-only) and maps `telegram_chat_id -> user_id` via `profiles`.

