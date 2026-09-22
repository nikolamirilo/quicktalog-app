# Pull Environment Variables from Vercel

This guide explains how to pull environment variables from your Vercel project into your local `.env` file.

---

## Prerequisites

- **Vercel CLI installed**

  ```bash
  npm install -g vercel
  ```

- **Logged in to Vercel**

  ```bash
  vercel login
  ```

---

## Linking Your Local Project to Vercel

Before pulling environment variables, make sure your local project is linked to the correct Vercel project. If you haven't already linked it, run:

```bash
vercel link
```

Follow the prompts to select or specify your Vercel project.

---

## Command to Pull Environment Variables

Use the following command to pull all environment variables from your Vercel project:

### Simple

```bash
vercel env pull .env
```

### Advanced (environment specific)

#### Development

```bash
vercel env pull .env.local --environment=development
```

#### Test

```bash
vercel env pull .env.test --environment=preview
```

#### Production

```bash
vercel env pull .env.production --environment=production
```

This will download your project's environment variables and store them in a local `.env` file.

---

## Notes

- The command pulls variables from the selected environment (default is development).
- To pull from another environment, use:

  ```bash
  vercel env pull .env.production --environment=production
  ```

- **Do not commit your `.env` file to version control unless it’s safe to share.**

---

## Useful Links

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)

## Database connections

The app uses two:

- `DB_CONNECTION_STRING` — user and visitor traffic. After migration M08 this is
  the `app_rls` login, which owns nothing and can only switch into the app roles.
- `DB_ADMIN_CONNECTION_STRING` — webhooks, provisioning, e2e cleanup and
  `drizzle-kit pull`. Stays on `postgres`, which bypasses RLS.

Before M08 they are the same URL and the admin one may be omitted. After M08 they
must differ. Both are pooler URLs on port 6543.

## Runtime switches

Three things have to change without a deploy, because a redeploy is too slow
and too risky during a maintenance window. They live in Vercel Global Config
(formerly Edge Config) and are read by `lib/ops/flags.ts`.

Hobby allows one Global Config store per account, so PROD and TEST share it and
are told apart by the key suffix (`_prod` / `_test`), chosen from `VERCEL_ENV`.

| Key | Type | Effect | Env-var fallback |
|---|---|---|---|
| `maintenance_<env>` | boolean | Write paths and server actions return 503; `middleware.ts` enforces it | `MAINTENANCE_MODE=1` |
| `banner_<env>` | string | A message shown to everyone, e.g. to announce the sign-in change | `BANNER_MESSAGE` |
| `clerk_frozen_<env>` | boolean | The account settings page shows "Account changes are paused" | `CLERK_FROZEN=1` |

The environment variable is the fallback when no store is connected — local, CI
and previews. With a store connected it is ignored.

**Every switch fails safe rather than closed.** An unreachable store must not
take the site down or freeze a page nobody asked to freeze, so a failed read
falls through to the environment variable (maintenance) or returns "off"
(banner, freeze). The one exception is `maintenanceBypass()`, which fails
closed: with no `MAINTENANCE_BYPASS_TOKEN`, or one shorter than 32 characters,
nobody gets past maintenance.

Propagation takes up to about 10 seconds. After writing `maintenance_prod`,
wait 15 seconds and check from two separate requests before relying on it.

`clerk_frozen_<env>` is switched on at T-3 of the Clerk → Supabase cutover and
off once the switch is done; the account forms still work, the notice only warns
that a change made now will not be carried across.

## Every environment variable

There is no `.env.example` in this repo: a git hook refuses to write any
`.env*` path, so the list lives here instead. For local work, create
`.env.local` by hand from the tables below — only the **App runtime** section is
needed to boot the app.

Audited against the code on 2026-09-22 (`grep` for `process.env.*` plus the
dynamic lookups in `scripts/lib/guard.ts` and `scripts/supabase/auth-config.ts`).

### App runtime

Set on Vercel for every environment the app serves, and in `.env.local` for
development. A `NEXT_PUBLIC_` prefix means **the value ships to the browser** —
never give one to a key that grants more than a visitor already has.

| Variable | Purpose |
|---|---|
| `AUTH_PROVIDER` | `clerk` or `supabase`. `next.config.ts` copies it to `NEXT_PUBLIC_AUTH_PROVIDER`, so set only this one. |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL. Decides which project everything else talks to. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser auth client. Safe to expose; every table is closed to it. |
| `SUPABASE_SECRET_KEY` | Server-side auth only (`/auth/callback`, `/auth/confirm`, middleware refresh). Bypasses RLS — never `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Captcha widget. Must be set **and deployed** before captcha is enabled in Supabase, or every password sign-in, sign-up and reset is rejected. |
| `DB_CONNECTION_STRING` | User and visitor traffic. See *Database connections* above. |
| `DB_ADMIN_CONNECTION_STRING` | Webhooks, provisioning, e2e cleanup. Required once M08 is applied. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Catalogue draft cache. |
| `REDIS_KEY_PREFIX` | Keyspace separation: `prod`, `test`, `ci`, `dev-<name>`. **Unset falls back to `dev`**, so an unset PROD shares a keyspace with local development. |
| `REVALIDATE_SECRET` | Shared with the worker; authenticates `/api/revalidate`. |
| `RESEND_API_KEY` | Transactional email from the app (welcome, cancellation, contact). Separate from the SMTP credentials Supabase Auth uses. |
| `PADDLE_API_KEY`, `PADDLE_CUSTOM_DATA_SECRET`, `PADDLE_NOTIFICATION_WEBHOOK_SECRET` | Checkout, signed `customData`, webhook verification. |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `NEXT_PUBLIC_PADDLE_ENV` | Paddle.js in the browser. |
| `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Only while `AUTH_PROVIDER=clerk`. Removed at Phase 5. |
| `DEEPSEEK_API_KEY`, `FIRECRAWL_API_KEY` | The catalogue builder agent and web page fetching. |
| `NEXT_PUBLIC_BASE_URL` | Canonical origin. Also read by Playwright to decide what it is testing. |
| `NEXT_PUBLIC_APP_URL` | QR code target. Falls back to `https://quicktalog.com` — note the `.com`, which is not this product's domain; set it explicitly. |

Analytics and monitoring, all optional and inert when unset:
`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN` (build-time source maps),
`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_API_KEY`,
`POSTHOG_PROJECT_ID`, `GTM_ID`, `NEXT_PUBLIC_LOGO_DEV_TOKEN`,
`NEXT_PUBLIC_CALENDLY_URL`, `NEXT_PUBLIC_DISABLE_LOGGING`.

### Set by the platform

`NODE_ENV`, `VERCEL_ENV`, `VERCEL_URL`, `NEXT_RUNTIME`, `CI`, `BASE_PATH`.
Do not set these by hand. `NODE_ENV` in particular is currently overridden on
all three Vercel environments, and anything other than `production` on a
deployed environment disables Sentry (`sentry.server.config.ts`) and stops
session cookies being marked `Secure` (`lib/auth/cookie-options.ts`).

### Operator scripts

Exported in the shell for one run, never committed and never in `.env.local`.
See `scripts/README.md`.

| Variable | Used by |
|---|---|
| `MIGRATION_DATABASE_URL` | every cutover script — `postgres`, session pooler 5432 or direct, never 6543 |
| `DRY_RUN`, `ALLOW_PROD`, `CONFIRM_REF`, `ALLOW_UNKNOWN_REF` | the shared guard |
| `CLERK_CSV`, `EXPORTED_AT`, `CLERK_FIXTURE`, `CLERK_DELETED_AFTER_EXPORT` | the Clerk import |
| `OUT_DIR`, `CONCURRENCY` | import and rollback push reports |
| `MAX_DELETIONS`, `KEEP_USER_IDS`, `KEEP_EMAILS`, `SKIP_CONFIRM`, `CONFIRM_COUNT` | the purge and Redis cleanup scripts |
| `SUPABASE_ACCESS_TOKEN` | `auth-config.ts` — a personal access token for the Management API. Account-wide: treat it as a root credential. |
| `SUPABASE_SMTP_PASS`, `SUPABASE_CAPTCHA_SECRET`, `SUPABASE_GOOGLE_CLIENT_ID`, `SUPABASE_GOOGLE_SECRET` | `auth-config.ts` secret fields. Omitted values are simply not sent — but the non-secret settings around them **are**, which is how captcha gets enabled without a secret. |

### Tests

`E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD`,
`E2E_SUPABASE_USER_EMAIL`, `SUPABASE_PUBLISHABLE_KEY` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DB_RLS_CONNECTION_STRING` (the `app_rls`
login, so the M08 assertions actually run), `REHEARSAL=1` (the cutover
rehearsal, which rewrites every user). See `docs/guides/e2e-testing.md`.

### Cloudflare Worker (`../quicktalog-backend`)

`SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `WORKER_ADMIN_TOKEN`,
`REVALIDATE_SECRET`, `APP_URL`, `JOBS_PAUSED`, `ENVIRONMENT`,
`UPLOADTHING_TOKEN`, `POSTHOG_API_KEY`, `POSTHOG_HOST`, `POSTHOG_PROJECT_ID`.

`REVALIDATE_SECRET` must be identical to the app's.

### Known drift

- `BACKEND_BASE_URL` is set on Vercel and in CI but is **not referenced anywhere
  in the app**. Confirm before deleting.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` on production are pre-rename leftovers;
  the app reads `NEXT_PUBLIC_SUPABASE_URL` and the anon key has been disabled.
- `POSTHGOG_API_KEY` sits alongside `POSTHOG_API_KEY` on both targets — a typo.
