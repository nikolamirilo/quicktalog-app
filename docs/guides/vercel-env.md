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
