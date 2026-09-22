# Quicktalog app

## Rules

### Git
- Do not commit, push or create branches unless explicitly asked; use read-only git commands.

### Environments and data
- Work on TEST (`imhinsgyzzyblghwnedk`) by default. Never query or change PROD (`uhfbapjuzvlyzyodxhqn`) unless explicitly asked.
- SQL run through MCP or scripts is read-only (SELECT) unless explicitly asked.
- Schema, RLS policies, grants, functions and triggers change only through new Supabase CLI migration files in `supabase/migrations/`. Never edit an applied migration. Never run `drizzle-kit push/generate/migrate` or `supabase db reset`.
- After a migration, regenerate types with `drizzle-kit pull` in `@quicktalog/common`; shared types, schema and constants change in `../quicktalog-packages` and need a release.
- Never read, print or commit `.env*` values. Server secrets never get a `NEXT_PUBLIC_` prefix.

### Data access and security
- All data access goes through Drizzle, inside one of the three blocks in `utils/db`: `withUser` (signed-in), `withPublic` (visitors, ISR) or `asAdmin` (webhooks, provisioning only). A query outside them fails with 42501. See `docs/architecture/data-access.md`.
- supabase-js is for auth only (no `.from()` / `.rpc()` in new code).
- Never hold a `withUser`/`withPublic`/`asAdmin` block open across `fetch`, Redis, `revalidate*`, a model call or streaming: it pins a pooled connection.
- Every server action and route handler checks identity itself; middleware and page checks are not enough.
- Never trust `userId`, `ownerId`, `createdBy`, `status` or plan flags from the client; derive them from the session and the database.
- Every owner query keeps an explicit owner filter, and updates/deletes check the returned row count.
- Plan limits are enforced on the server from `users.plan_id` and `tiers`, never only in the UI.
- Files with `"use server"` export only real actions; helpers that take a user id live in `server-only` modules.
- Public pages and ISR never read cookies or user identity; never put per-user queries inside a cache.

### Code
- Follow S.O.L.I.D. (`docs/standards/solid-principles.md`) through the project skills: `code-conventions`, `server-action-and-route`, `data-revalidation`, `adding-new-content-block`.
- Use `@/` imports and Biome formatting.
- Routes must finish within 60s (Vercel Hobby); long work must survive being cut off.

### Verification
- Before finishing code changes run `npx tsc --noEmit`, `npm run check` and `npm test`; say plainly what was not run or failed.
- Playwright e2e runs only against TEST.

### Docs and plans
- `docs/` is human documentation of the system as it is now: `guides/` (how to work on the project), `standards/` (coding rules), `architecture/` (how features work). Update it when behaviour changes.
- `/.claude/plans/` is for AI work done before implementation: plans, analyses, investigations, research. Never put these in `docs/`.
- Create every new plan in `/.claude/plans/active/YYYY-MM-DD-<slug>/` with a `PLAN.md` that starts with a status line (`Status: proposed | approved | in progress | done`). Supporting files (research, verification) go in the same folder.
- When a plan is fully implemented or dropped, move it to `/.claude/plans/archive/`, update `/.claude/plans/README.md`, and move any lasting knowledge into `docs/`.
- Code, skills and `CLAUDE.md` link to `docs/`, not to plans (except while a plan is actively being implemented).
- When a pattern changes, update the matching skill in `.claude/skills/`.

## Tech stack

| Area | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript | Web app: marketing pages, public catalogues (ISR), admin builder and dashboard |
| Hosting | Vercel (Hobby plan) | App hosting; route `maxDuration` kept at 60s |
| Database | Supabase Postgres (TEST and PROD are separate projects) | All app data |
| Data access | Drizzle ORM (`drizzle-orm` + `postgres`) through `utils/db` | All app queries; camelCase in the app, snake_case in the DB. Runs as the private roles `app_user`/`app_public` so RLS applies; `asAdmin` (postgres) is for webhooks and provisioning only |
| Migrations | Supabase CLI (`supabase/migrations/*.sql`) | Schema, RLS policies, grants, functions, triggers; applied to TEST first, then PROD. Never `drizzle-kit push/generate/migrate` |
| DB types | `drizzle-kit pull` in `@quicktalog/common` | Regenerates TypeScript schema/types after each migration |
| Auth | Clerk (current, behind `AuthProvider`/`useAuth`) → Supabase Auth via `@supabase/ssr` / supabase-js (planned) | Sign-in, sign-up, Google login, sessions. After migration supabase-js is used for auth only, never data queries |
| Shared package | `@quicktalog/common` (`../quicktalog-packages`) | Shared types, constants (pricing `tiers`), Drizzle schema |
| Background jobs | Cloudflare Worker (`../quicktalog-backend`) | Daily cron: analytics ingestion, plan/traffic enforcement, image cleanup |
| Cache | Upstash Redis | Catalogue draft cache for the builder and preview |
| Payments | Paddle (Billing) | Checkout, subscriptions, webhooks that set the user's plan |
| File uploads | UploadThing | Catalogue images |
| Email | Resend (+ React Email) | Transactional emails (welcome, cancellation, contact) |
| AI | Vercel AI SDK (`ai`) with DeepSeek, Firecrawl | Catalogue builder agent, item description writing, web page fetching |
| OCR | tesseract.js | In-browser text recognition from images |
| UI | Tailwind CSS 3, Radix UI / shadcn components, Framer Motion, lucide/react-icons | Styling, accessible components, animation, icons |
| Editors and visuals | Monaco editor, qr-code-styling, Recharts / ApexCharts | Custom code editing, QR codes, dashboard charts |
| Client data | SWR, React Context, react-hook-form | Dashboard data fetching, app state, forms |
| Analytics | PostHog, Microsoft Clarity, Google Tag Manager | Product analytics and catalogue traffic |
| Monitoring | Sentry | Error tracking |
| Testing | Vitest (+ Testing Library, happy-dom), Playwright | Unit tests, end-to-end tests |
| Code quality | Biome, Husky | Lint and format, git hooks |

