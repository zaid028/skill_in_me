# Daymark

Daymark is a SvelteKit + TypeScript productivity workspace backed by Supabase PostgreSQL. The dashboard supports a local demo fallback and persists tasks through Supabase when configured.

## Stack

- SvelteKit and Svelte 5
- TypeScript
- Tailwind CSS
- Supabase Auth, PostgreSQL, RLS, and Realtime-ready schema
- Vitest and Playwright
- Vercel adapter

## Local setup

```sh
pnpm install
Copy-Item .env.example .env
pnpm dev
```

Set these values in `.env`:

```env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

The visible login/signup screens are intentionally disabled. The server creates a Supabase anonymous session so task ownership and RLS remain enforced without exposing a login flow. Enable Anonymous Sign-Ins in Supabase Authentication settings before testing persistence.

## Database

Apply [supabase/migrations/0001_initial_schema.sql](supabase/migrations/0001_initial_schema.sql) using the Supabase SQL editor or the Supabase CLI:

```sh
supabase db push
```

The migration creates profiles, lists, todos, shared-list memberships, indexes, ownership rules, and role-aware RLS policies. The browser never receives a service-role credential and never submits `owner_id`.

## Backend API

- `GET /api/todos` loads the current anonymous user's active tasks.
- `POST /api/todos` validates and creates a task server-side.
- `PATCH /api/todos` validates a UUID and completion update, scoped to the current owner.

When Supabase variables are missing, the dashboard uses its local in-memory demo state so the UI remains viewable.

## Verification

```sh
pnpm check
pnpm test:unit
pnpm build
```

The Vercel adapter targets Node 24. On Windows, the final Vercel packaging step may require symlink permissions; deployment on Vercel is unaffected.
