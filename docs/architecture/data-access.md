# Data access

How the app talks to Postgres, and why a query that skips this path fails.

## The short version

Every query runs inside one of three blocks from `utils/db`:

| Block | For | Database role | Sees |
|---|---|---|---|
| `withUser(me, tx => …)` | a signed-in user's own work | `app_user` | only rows that belong to them |
| `withPublic(tx => …)` | visitors, ISR, sitemap, public signups | `app_public` | only active catalogues, and never `created_by` |
| `asAdmin(op, tx => …)` | webhooks, provisioning, scripts | `postgres` | everything; **bypasses RLS** |

A query outside these blocks runs as a role that holds no privileges and fails with `42501`. That is the design: forgetting the wrapper is a loud error, not a silent data leak.

## Why roles and not just careful code

The app used to connect as `postgres`, which ignores row level security, so every `where created_by = …` was the only thing standing between one merchant's catalogue and another's. `utils/db/rls.ts` switches the transaction into `app_user` or `app_public` and sets the verified user id as a transaction-local claim:

```sql
select
  set_config('role', 'app_user', true),
  set_config('request.jwt.claims', '{"sub":"…","role":"app_user"}', true),
  set_config('search_path', 'public, pg_temp', true),
  …
```

Policies read the id through `private.current_user_id()`, so they apply to every statement in the transaction. Application code still writes the owner predicate: RLS is the lock, the predicate is what a reviewer can see.

`app_user` and `app_public` are NOLOGIN roles that only the app's own connection can switch into. The public Supabase API cannot reach them, and `anon`/`authenticated` hold no privileges at all, so a stolen publishable key opens nothing.

### Details that are easy to get wrong

- **Transaction-local settings.** Everything is set with `true` (local), so a COMMIT or ROLLBACK discards it. Connections are pooled and reused; a session-level setting would leak into the next request.
- **`pg_temp` is last in `search_path`.** Otherwise a temp table planted on a pooled backend could shadow a real table name.
- **Timeouts per role**, because `SET ROLE` does not apply the role's own `ALTER ROLE` settings.
- **No reset afterwards.** Resetting inside an aborted transaction throws `25P02`; the commit already discards the settings.

## The two connection strings

| Variable | Used by | Role |
|---|---|---|
| `DB_CONNECTION_STRING` | `getUserDb()`, i.e. `withUser` and `withPublic` | `postgres` today; the fail-closed `app_rls` login after M08 |
| `DB_ADMIN_CONNECTION_STRING` | `getAdminDb()`, i.e. `asAdmin`, e2e cleanup, `drizzle-kit pull` | `postgres`, which may bypass RLS |

Until M08 both point at the same URL and the admin variable may be left unset;
the code falls back to the other one. After M08 they must differ, or every
webhook write fails with `42501`.

`app_rls` owns no privileges at all: it may only `SET ROLE` to `app_user` or
`app_public`. That is what makes a forgotten wrapper an error rather than a
silent full-table read, and it is what
`tests/integration/db/forgotten-wrapper.test.ts` checks.

## Rules that follow from this

1. **Never hold a block open across slow work** — no `fetch`, Redis, `revalidate*`, model call or streaming inside it. Each block pins a pooled connection.
2. **Identity is derived, never passed.** A server action calls `getVerifiedIdentity()` itself. Helpers that take a user id live in `server-only` modules under `lib/`, so they cannot be called from a browser.
3. **Keep the owner predicate** even though RLS enforces it, and check what `returning(...)` gave back: zero rows means "not yours or gone", not an error.
4. **The client decides nothing that matters.** Status, plan flags, ids and owners come from the database. `pickEditable()` filters catalogue payloads down to the fields a client may set; `lib/entitlements/` decides what a plan allows.
5. **`asAdmin` is not ordinary code.** It is importable only from `@/utils/db/admin`, and `tests/unit/architecture/db-boundaries.test.ts` fails the build if a server action can reach it, even transitively.

## Where things live

| Module | Purpose |
|---|---|
| `utils/db/index.ts` | the entry point: `withUser`, `withPublic`, `pickEditable`, error helpers |
| `utils/db/rls.ts` | the role switch and per-role timeouts |
| `utils/db/admin.ts` | `asAdmin`, for system writes only |
| `utils/db/pool.ts` | the two connection pools; nothing else may open one |
| `lib/catalogue/public.ts` | visitor-facing reads |
| `lib/catalogue/draft-cache.ts` | Redis drafts, keyed by catalogue **id** so a reused name cannot show a previous owner's draft |
| `lib/entitlements/` | plan limits, read from the database with the user's row locked |
| `lib/ai/metering.ts` | AI turns, charged before any model call |

## Verifying a change

- `npm run test:db` — applies `supabase/migrations` on an in-memory Postgres (17 and 18) and runs the RLS scenarios. No Docker.
- `supabase start && supabase test db` — the pgTAP suite in `supabase/tests/database/` against the real Postgres image.
- `npm test` — includes the architecture boundaries above.

See [the Drizzle guide](../guides/drizzle.md) for how a schema change flows from a migration to the app's types.
