# Research: RLS and the data layer (Drizzle vs supabase-js)

> Phase-1 report produced on 2026-09-16 while preparing `../PLAN.md`. It reflects branch `test` at `fcee862` and read-only queries on the TEST project. Where it disagrees with `../PLAN.md`, the plan wins.

Scope: `quicktalog-app` (Next.js 15.5.16, Vercel Hobby), `../quicktalog-packages` (Drizzle schema) and `../quicktalog-backend` (worker). I ignored `.kilo/`, `.next/` and `node_modules/`, except to read installed library source. TEST project `imhinsgyzzyblghwnedk`: I ran only read-only SELECTs, plus transaction-local `set_config` probes that change no data.

---

## TL;DR

1. **The 3-option framing leaves out two decisions that change the answer.**
   - **Who issues the JWT.** Today it's Clerk. `auth.uid()` casts `sub` to uuid, and I confirmed on TEST that it throws `22P02 invalid input syntax for type uuid: "user_3JKG..."` for Clerk ids. With Clerk, `@supabase/ssr` cookies forward nothing (there is no Supabase session), so "automatic JWT forwarding" only exists if you move to Supabase Auth.
   - **Every option is already a hybrid.** Webhooks (Clerk, Paddle) and the worker have no end user, so they need a path that bypasses RLS whatever you pick: a secret key or a Drizzle "admin" client. The real choice is the **transport for user-scoped traffic**: PostgREST over HTTP, or Drizzle over TCP through Supavisor.
   - There is also a real **option 4**: keep authorization in app code only and revoke all `anon`/`authenticated` grants.
2. **Recommendation: Drizzle-first hybrid (option 1b, optionally hardened to 1c later).**
   - **User and public requests:** Drizzle inside a short transaction that runs, in one parameterized statement, `set_config('request.jwt.claims', …, true)`, `set_config('role', 'authenticated'|'anon', true)` and `set_config('statement_timeout', …, true)`. Claims come from identity the server has already verified (Clerk `auth()` today, `supabase.auth.getClaims()` if you move to Supabase Auth).
   - **System paths:** a separate Drizzle admin client, import-restricted (webhooks, on-demand user seed, AI metering, e2e cleanup).
   - **supabase-js:** removed from the app's data path; kept only for Supabase Auth if you adopt it. The worker stays on `service_role`.
   - **Policies:** SQL in `supabase/migrations`, written against `(select auth.jwt()->>'sub')` on the existing `text` columns. That works for Clerk now and for Supabase Auth later.
3. **Why it matters now:** the app already has missing authorization checks (IDORs) that RLS would have contained, and TEST currently grants `anon` DELETE on `users` with RLS off. See §1.4.

---

## 0. Is the framing correct?

| Axis | Choices | Why it matters |
|---|---|---|
| Identity provider | Clerk (third-party) vs Supabase Auth | Decides whether `auth.uid()` works (it doesn't with Clerk), whether PostgREST can accept user tokens (Clerk needs the Third-Party Auth integration plus a `role` claim), and token lifetime (Clerk session JWT = 60 s). |
| DB role for user requests | `postgres` (BYPASSRLS) vs `authenticated`/`anon` | The only thing that makes RLS apply. |
| Transport | PostgREST over HTTPS vs Postgres over TCP through Supavisor | Affects transactions, types, latency and connection limits. |
| Data API exposure | Keep enabled vs disable or narrow | The worker uses PostgREST with `service_role` (`quicktalog-backend/src/lib/supabase.ts:5`, `src/handlers/analyticsProcessingJob.ts:28`), so you can't simply turn the Data API off. |

**Key insight: grants to `authenticated`/`anon` are shared by PostgREST and a Drizzle `SET ROLE` path.** You can't grant `authenticated` a privilege "only for Drizzle".
- With Clerk and no Third-Party Auth integration, PostgREST can't mint `authenticated` from a Clerk token. Only `anon` is reachable with the publishable key, so the `authenticated` grants are effectively reachable only through the server-side wrapper.
- With Supabase Auth, every signed-up user holds a JWT that PostgREST accepts, so **policies become the real boundary** even if the app never calls PostgREST.

Options compared below:
- **1a:** Drizzle as `postgres` (today)
- **1b:** Drizzle plus RLS wrapper plus admin client
- **1c:** 1b with a dedicated NOINHERIT login role
- **2:** supabase-js only (user JWT plus secret key)
- **3:** supabase-js for user CRUD plus Drizzle admin
- **4:** app-layer authorization only, with zero anon/authenticated grants

---

## 1. Current state (evidence)

### 1.1 Connections
- `utils/drizzle.ts:5-8`:
  - `postgres(DB_CONNECTION_STRING, { prepare: false })`, with no `max`, `idle_timeout` or `max_lifetime`.
  - postgres-js defaults: `max: 10`, `idle_timeout: null`, `max_lifetime` 30-60 min (`node_modules/postgres/src/index.js:448-456`, `:515-517`).
  - DB_CONNECTION_STRING is Supavisor transaction mode (6543) as `postgres.<ref>`.
- `utils/supabase/server.ts:4-45`: `createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, cookies)`. With Clerk there are no Supabase auth cookies, so every call runs as `anon`.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is referenced only in `utils/supabase/server.ts:8,25`, so it is not in any client bundle today. The key is still public by design ("Safe to expose online", Supabase API keys doc).
- `middleware.ts:3-7`: `clerkMiddleware` protects only `/admin(.*)`.

### 1.2 Complete DB call-site inventory

**Drizzle as `postgres` (BYPASSRLS), 39 non-import references:**

| File:line | Operation | Authorization in code |
|---|---|---|
| `app/api/dashboard/catalogues/route.ts:18` | catalogues findMany by createdBy | `currentUser()` at :12. Destructures null, so an unauthenticated call is a 500, not a 401. |
| `app/api/dashboard/newsletter/route.ts:18,35` | newsletter by owner; catalogues by ids | `currentUser()` at :12 |
| `actions/catalogue.ts:46,52` deleteItem | read owner, delete | check at :50 |
| `actions/catalogue.ts:69,79` deleteMultipleItems | read owners, delete | check at :73-77 |
| `actions/catalogue.ts:99,105` updateItemStatus | read owner, update | check at :103 |
| `actions/catalogue.ts:137,151,161` duplicateItem | read, name loop, insert | check at :142 |
| `actions/catalogue.ts:187,204` createCatalogue | exists check, insert | createdBy set to `user.id` at :209 |
| `actions/catalogue.ts:246` updateCatalogue | owner read (writes only Redis) | check at :250 |
| `actions/catalogue.ts:289` getCatalogueByName | read full row (Redis first) | **none** |
| `actions/catalogue.ts:328,340` publishCatalogue | owner read by name, `update.set({...rest})` | check at :332 is by name only. `rest` comes from the client payload (:337), so `createdBy`/`id` can be overwritten. |
| `actions/qr-configs.ts:14,21,30` upsertQrConfig | read, update, insert | **none** |
| `actions/qr-configs.ts:54` getQrConfig | read | **none** |
| `actions/newsletter.ts:25,40` newsletterSignup | exists check, insert | `ownerId` supplied by the client (`components/catalogue/view/CatalogueFooter.tsx:42-46`) |
| `actions/newsletter.ts:64,74` productNewsletterSignup | exists check, insert | public by design |
| `actions/themes.ts:20,48,57,62,91` | list, upsert, delete | `currentUser()`, except `persistTheme(userId, …)` at :37, which trusts its `userId` argument (called from `agent/tools.ts:433`) |
| `lib/ai/access.ts:40` authorize | owner read | check at :47 |
| `lib/ai/access.ts:98` meter | insert prompts | caller-supplied `userId` |
| `lib/users/fetchUserData.ts:42,64,93,98,112,123` | users row plus 4 usage counts | **none inside**; relies on callers |
| `tests/e2e/helpers/cleanup.ts:14-16,50-55` | raw `postgres` DELETE | test-only admin |

**supabase-js as `anon` (15 `.from("…")` calls):**

| File:line | Operation |
|---|---|
| `app/api/items/route.ts:13-21` | `select *` (or `name`) from **all** catalogues, optional status filter. Public, no auth. Used by `app/sitemap.ts:11`, `app/catalogues/[name]/page.tsx:15` and `hooks/useCatalogueName.ts:91` (which needs draft names too). |
| `app/api/items/[name]/route.ts:13-17` | one catalogue by name, including drafts. The status check happens in the page (`app/catalogues/[name]/page.tsx:142`). |
| `app/api/dashboard/analytics/route.ts:17-25` | analytics by user_id; newsletter head count |
| `app/api/clerk/route.ts:51` then `lib/users/syncFromClerk.ts:142` (upsert), `:171-175` (update); `actions/users.ts:83-87` (delete) | Clerk webhook user sync |
| `lib/users/fetchUserData.ts:53-55` | on-demand user upsert |
| `utils/paddle/process-webhook.ts:73,87,106,136,151,170,192,220` | users lookups and updates (`plan_id`, `customer_id`), subscriptions upsert and select |

- The app has no `.transaction(`, `sql\``, `.execute(` or `.rpc(` anywhere (grep over actions, app, lib, utils, agent, helpers).
- The app never writes `ocr`, `plans` or `job_logs`. `job_logs` is written only by the worker (`quicktalog-backend/src/handlers/analyticsProcessingJob.ts:157,167`).

### 1.3 Verified on TEST
- **Roles:**
  - `postgres`: `rolsuper=false`, `rolbypassrls=true`, `rolcreaterole=true`.
  - `postgres` is a member of `anon`, `authenticated` and `service_role` with `admin_option=true, inherit=true, set=true`.
  - `authenticator` is a member of the same three with `inherit=false, set=true`. That NOINHERIT pattern is what PostgREST uses.
- **Role switch works:** `select set_config('role','authenticated',true), current_user` returned `current_user=authenticated`, `session_user=postgres`, `bypassrls=false`.
- **Helper functions:**
  - `auth.uid()` = `coalesce(request.jwt.claim.sub, request.jwt.claims->>'sub')::uuid`. With `sub = 'user_3JKGexample'` it raised `22P02`.
  - `auth.jwt()->>'sub'` returned `user_3JKGexample`.
- **Role-level settings:** `authenticated` has `statement_timeout=8s`, `anon` has `3s`, `authenticator` has `statement_timeout=8s, lock_timeout=8s` plus `safeupdate`.
- **Server:** `max_connections=60`, PostgREST 14.5, Postgres 17.6, region **eu-west-1**.
- **Data:** 3 users, all Clerk ids; `auth.users` has 0 rows; no `private` schema; no pgtap.
- **Grants:** `anon` has users DELETE/INSERT/SELECT/UPDATE, catalogues INSERT/SELECT/UPDATE, subscriptions INSERT/SELECT/UPDATE, analytics INSERT/SELECT, newsletter SELECT, job_logs INSERT. `get_pageview_totals` is EXECUTE for anon. `authenticated` has nothing.
- **Advisor:** lint `0013_rls_disabled_in_public` (ERROR) flags users, catalogues, subscriptions, analytics and newsletter (the tables anon can reach).

### 1.4 Authorization gaps RLS would have contained (the defense-in-depth case)
1. **`actions/users.ts:9-13`:** `getUserData(userId?)` uses `userId ?? profile?.id` with no ownership check. It is imported by a client component (`context/UserContext.tsx:3,36`), so any caller, even unauthenticated, can pass any id. They get the user row minus `cookiePreferences` (`lib/users/fetchUserData.ts:143`): email, customerId, planId, consents, usage.
2. **`app/api/users/[id]/route.ts:11-31`:** the same data, with no auth gate. No code references this route, but it is deployed.
3. **`actions/qr-configs.ts:8-57`:** no auth at all. Any client can overwrite any catalogue's QR config (the client caller is `components/qr-editor/QrPreview.tsx:81`).
4. **`actions/catalogue.ts:284-303`:** `getCatalogueByName` returns draft catalogues to anyone (client caller `components/dashboard/components/DashboardItem.tsx:35`).
5. **`actions/catalogue.ts:337-347`:** `publishCatalogue` spreads the client payload into `.set()`, so it can change `created_by`/`id`.
6. **`actions/newsletter.ts:19-44`:** trusts a client-supplied `ownerId`.
7. **`app/api/items/route.ts`:** exposes every catalogue (drafts, `created_by`) publicly.
8. **Live on TEST:** `anon` has DELETE on `users` with RLS off. Anyone holding the publishable key could `DELETE /rest/v1/users?id=neq.x`, and FKs `ON DELETE CASCADE` would remove all catalogues. `pg-safeupdate` only requires a WHERE clause. The only mitigation today is that the key hasn't been shipped to a browser.
9. **Outside RLS scope:** `app/catalogues/[name]/preview/page.tsx:28` serves any catalogue straight from Redis with no auth.

### 1.5 Drift and latent bugs found while checking
- **Metering breaks after the first prompt:** `prompts` has `UNIQUE (catalogue)` (`prompts_service_catalogue_key`), so `meter()` (`lib/ai/access.ts:98`) fails on the second AI prompt per catalogue. `actions/ai.ts:58` would then report "Generation failed" after the model already answered.
- **QR config duplicates possible:** `qr_configs.catalogue` has only a non-unique index on TEST, but the Drizzle schema declares `unique("qr_configs_catalogue_key")` (`quicktalog-packages/src/drizzle/migrations/schema.ts:124`). The check-then-insert in `upsertQrConfig` can race.
- **Column and default drift:**
  - `qr_configs.id`: uuid in the DB, `serial` in Drizzle.
  - `job_logs.id`: bigint in the DB, uuid in Drizzle.
  - `job_logs.log`: jsonb in the DB, text in Drizzle.
  - `users.plan_id`: NOT NULL in the DB, nullable in Drizzle.
  - `users.image`: Drizzle still has default `'NULL'`.
- **Stale policy in the shared schema:** it declares `pgPolicy("Enable read access for authenticated users to users", { to: ["authenticated"], using: sql\`true\` })` (`schema.ts:35`), which does not exist in the DB. Running drizzle-kit from that schema would enable RLS on `users` with a read-all policy.
- **Both drizzle-kit configs point at files that don't exist:** `quicktalog-app/drizzle.config.ts:5` (`./drizzle/schema.ts`) and `quicktalog-packages/drizzle.config.ts:5` (`./src/drizzle/schema.ts`). The real file is `src/drizzle/migrations/schema.ts`, a `drizzle-kit pull` output.
- **`get_pageview_totals` looks broken:** it declares `RETURNS TABLE(user_id uuid, …)` but selects `analytics.user_id` (text), which would error at runtime (inferred). Its only caller, `app/api/subscriptions/check`, no longer exists.
- **Stale migration comments:** the lockdown migration's justifications cite `utils/paddle/get-customer-id.ts`, `app/api/subscriptions/check/route.ts`, `app/api/analytics/route.ts` and the `app/api/items` POST/PATCH handlers (`supabase/migrations/20260912093000_lockdown_privileges_and_schema_fixes.sql:52-80`), none of which exist. The anon catalogues INSERT/UPDATE, analytics INSERT, job_logs INSERT and RPC grants are therefore stale.

---

## 2. Drizzle + RLS (question 1)

### 2.1 Why Drizzle ignores RLS today
The pooled user `postgres.<ref>` authenticates as role `postgres`, which has `rolbypassrls=true` (verified). Enabling RLS and adding policies therefore changes **nothing** for the ~39 Drizzle references. Conversely, enabling RLS **does** immediately break every anon supabase-js path in §1.2 (the webhooks, `/api/items`, dashboard analytics) unless those paths move or get policies first. That dictates the migration order (§10).

### 2.2 The official Drizzle pattern, and what's wrong with copying it verbatim
The Drizzle RLS docs (https://orm.drizzle.team/docs/rls) and `rphlmr/drizzle-supabase-rls/database/drizzle.ts` define `createDrizzle(token, { admin, client })`. It returns `admin` plus `rls(tx => …)`, which runs this inside `client.transaction`:
```ts
await tx.execute(sql`
  select set_config('request.jwt.claims', '${sql.raw(JSON.stringify(token))}', TRUE);
  select set_config('request.jwt.claim.sub', '${sql.raw(token.sub ?? "")}', TRUE);
  set local role ${sql.raw(token.role ?? "anon")};`);
// ... finally { reset claims; reset role; }
```
The token comes from `createClient().auth.getSession()` plus `decode(access_token)`. In the example repo, `admin` uses `postgres` and `client` uses a separate `rls_client` login role that is granted `anon` and `authenticated` (`supabase/seed.sql`). The MakerKit recipe copies the same code.

Problems for production:
1. **SQL injection.** `sql.raw(JSON.stringify(token))` doesn't escape `'`. With Supabase Auth, the access token carries `user_metadata`, which the user can edit ("raw_user_meta_data can be updated by the authenticated user", RLS docs). A crafted name can inject SQL that runs **before** the role switch, as a BYPASSRLS role.
2. **Unverified identity.** `getSession()` plus decode doesn't verify the JWT. Supabase says to use `getClaims()` to verify.
3. **Role taken from the token.** `set local role ${sql.raw(token.role)}` means a forged `"role":"service_role"` becomes BYPASSRLS, because `postgres` is a member of `service_role` (verified). Allowlist `anon`/`authenticated`.
4. **The `finally` block masks errors.** If a query fails, the transaction is aborted, so the reset statement throws `25P02` and replaces the original error (inferred from JS `finally` semantics). The reset is also unnecessary: `is_local = true` settings end at COMMIT or ROLLBACK.
5. **Multi-statement text works only because there are no bound parameters.** postgres-js uses the simple protocol only when `args.length === 0` (`node_modules/postgres/src/index.js:124,141`; Drizzle calls `client.unsafe(query, params)` in `drizzle-orm/postgres-js/session.js:33`). Parameterizing that multi-statement text naively will fail. Use one SELECT with several `set_config` calls instead.
6. **Role settings don't carry over.** `SET ROLE` doesn't apply `ALTER ROLE … SET` settings ("Role-specific variable settings take effect only at login; SET ROLE … do not process role-specific variable settings", PostgreSQL ALTER ROLE docs). PostgREST does apply them per transaction (PostgREST v14 transactions docs), so to get the same 8 s/3 s timeouts you must set `statement_timeout` yourself.
7. **Stale API name.** The docs show `pgTable.withRLS(...)`. Installed drizzle-orm 0.45.2 only has `table.enableRLS()` (`pg-core/table.js:49-52`); `withRLS` appears 0 times in `pg-core`.
8. **Wrong role helper.** `drizzle-orm/supabase` exports `postgresRole = pgRole("postgres_role")` (`node_modules/drizzle-orm/supabase/rls.js:6`), a role Supabase doesn't have. Its `authUid` is `(select auth.uid())` (`rls.js:34`), which fails with Clerk ids. `crudPolicy` exists only in `drizzle-orm/neon` and uses Neon's `auth.user_id()` (`neon/rls.js:61`), so don't import it for Supabase.

### 2.3 Hardened wrapper for this codebase
```ts
// utils/db/index.ts
import "server-only";
import { schema } from "@quicktalog/common";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DB_CONNECTION_STRING!, {
  prepare: false,        // Supavisor transaction mode (6543) has no prepared statements
  max: 3,                // per function instance (default 10); Nano/Micro pooler = 200 clients total
  idle_timeout: 5,       // seconds; release idle sockets before the instance suspends
  max_lifetime: 60 * 10,
});
const db = drizzle(client, { schema });
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type DbRole = "anon" | "authenticated";
const TIMEOUT: Record<DbRole, string> = { anon: "3s", authenticated: "8s" }; // mirror role settings

export async function withRls<T>(role: DbRole, claims: Record<string, unknown>, fn: (tx: Tx) => Promise<T>) {
  if (role !== "anon" && role !== "authenticated") throw new Error("invalid db role");
  return db.transaction(async (tx) => {
    // ONE statement, bound parameters, transaction-local (is_local = true)
    await tx.execute(sql`select
      set_config('request.jwt.claims', ${JSON.stringify({ ...claims, role })}, true),
      set_config('role', ${role}, true),
      set_config('statement_timeout', ${TIMEOUT[role]}, true)`);
    return fn(tx);
  });
}
export { db as adminDb }; // re-export ONLY via utils/db/admin.ts; restrict with Biome noRestrictedImports
```
```ts
// utils/db/session.ts - Clerk today
import "server-only";
import { auth } from "@clerk/nextjs/server";
export async function asUser<T>(fn: (tx: Tx) => Promise<T>) {
  const { userId } = await auth();            // token already verified by clerkMiddleware; no network call
  if (!userId) throw new UnauthorizedError();
  return withRls("authenticated", { sub: userId }, fn);
}
export const asAnon = <T,>(fn: (tx: Tx) => Promise<T>) => withRls("anon", {}, fn);

// Supabase Auth variant (if you migrate): verify, then pass only allowlisted claims
// const { data, error } = await (await createClient()).auth.getClaims();
// if (error || !data?.claims?.sub) throw new UnauthorizedError();
// const { sub, email, aal, session_id, app_metadata } = data.claims; // never user_metadata
// return withRls("authenticated", { sub, email, aal, session_id, app_metadata }, fn);
```
- The server can set claims because only the server holds `DB_CONNECTION_STRING`. That means the Drizzle path needs **no** Supabase Third-Party Auth integration for Clerk.
- It also means RLS on this path guards against **app bugs** (like §1.4), not against a compromised server, which holds a BYPASSRLS credential anyway.
- Use `auth()` rather than `currentUser()`. `currentUser()` calls `clerkClient().users.getUser()` and "counts towards the Backend API request rate limit" (`node_modules/@clerk/nextjs/dist/esm/app-router/server/currentUser.js:10`; `.d.ts:10`).

Example conversion. Queries inside, Redis and revalidation outside the transaction:
```ts
export async function deleteItem(name: string) {
  const rows = await asUser((tx) =>
    tx.delete(catalogues).where(eq(catalogues.name, name)).returning({ id: catalogues.id }));
  if (rows.length === 0) return false;       // not found OR not owner - RLS filtered it silently
  await syncCache(() => getRedis().del(name));
  revalidateCatalogue(name); revalidateDashboard();
  return true;
}
```
`tx.query.catalogues.findFirst(...)` works, since `PgTransaction` extends `PgDatabase`, so the relational-query call sites convert with minimal changes.

### 2.4 Supavisor transaction mode (6543)
- Supabase: transaction mode "Does not support session-level features (`SET`, `LISTEN/NOTIFY`, temporary tables that span transactions, or advisory locks)" and "does not support prepared statements" (docs: accessing-postgres; connecting-to-postgres; disabling-prepared-statements).
- `set_config(..., true)` / `SET LOCAL` inside an explicit transaction is safe: it lives exactly as long as the pooler lends you the backend.
- **Session-level `set_config(..., false)` or plain `SET` would leak claims or role to the next tenant that gets that backend connection.** That is a cross-user data leak.
- `prepare: false` stays required. postgres-js then sends unnamed extended-protocol statements, which transaction mode handles.

### 2.5 Cost
- **Round trips:** each `rls()` block is BEGIN, one `set_config` statement, N queries, COMMIT. That's about 3 extra round trips over today's single autocommit query (inferred from postgres-js `begin`). Group a whole server action's queries into one block rather than wrapping each query.
- **Concurrency inside a block:** a transaction pins one connection. `Promise.all` inside it (e.g. `lib/users/fetchUserData.ts:91-133`) is pipelined on that one connection rather than run in parallel on several.
- **Region matters more than the wrapper:** TEST is eu-west-1. If the Vercel functions run in the default region (iad1), each extra round trip costs a transatlantic RTT, and the wrapper overhead can dominate. I couldn't verify the Vercel region because the Quicktalog project isn't in the Vercel team I can access. Check Project Settings → Functions → Region and co-locate. PostgREST does BEGIN, set_config, query and COMMIT server-side in one HTTP request, so cross-region it can be faster per single query (inferred).
- **Never hold an `rls()` transaction across Redis, `revalidate*`, AI streaming, or the agent's 50 s turn** (`app/api/agent/route.ts:24`). Each open transaction pins a pooler backend.
- **Vercel and connection limits:**
  - Nano/Micro: 60 Postgres connections and 200 pooler clients (Supabase compute docs).
  - With postgres-js default `max: 10` per instance, ~20 warm instances exhaust the pooler.
  - Vercel recommends a short idle timeout (~5 s) and a small minimum pool.
  - `attachDatabasePool` from `@vercel/functions` lists pg, mysql2, MariaDB, MongoDB, ioredis, cassandra "and other compatible pool types". postgres.js isn't named (uncertain), so rely on `idle_timeout`.
  - Known Supavisor issue where client connections grew under Fluid plus `attachDatabasePool` (TLS zombie clients; fixed in supavisor#783): supabase discussion #40671.

---

## 3. Dedicated login role instead of `postgres` (question 2, option 1c)

```sql
-- migration (set the password out-of-band, never in git)
create role app_rls login nobypassrls noinherit;
grant anon to app_rls with inherit false, set true;           -- PG16+ syntax; TEST is PG17
grant authenticated to app_rls with inherit false, set true;  -- mirrors authenticator's memberships (verified)
```
Connect as `postgresql://app_rls.<ref>:<pwd>@aws-…pooler.supabase.com:6543/postgres` for user traffic, and keep `postgres.<ref>` for the admin client.

- **Why membership is required:** `SET ROLE` / `set_config('role', …)` only succeeds if the session user is a member of the target role with the SET option. `postgres` already is (admin=true, set=true, verified), which is why 1b works with no DDL. `postgres` also has `rolcreaterole` and ADMIN OPTION on anon/authenticated (verified), so it can create `app_rls` and grant these memberships.
- **Pros over 1b:** fail-closed. If code forgets the wrapper, the connection has no BYPASSRLS and (with NOINHERIT) no table privileges, so you get `42501` instead of a silent bypass. A leaked user-path credential can't bypass RLS. The admin credential can live only where webhooks run.
- **Cons:**
  - A second secret to manage.
  - A second pool (double the per-instance pooler clients).
  - The role and its password live outside the Supabase migration flow.
  - Custom roles through Supavisor work but are less documented (inferred).
  - With INHERIT, policies `TO authenticated` would also match `app_rls` without SET ROLE, because RLS checks role privileges through inheritance (inferred). Use NOINHERIT.

Suggested sequence: ship 1b first (no DDL needed), add 1c once the wrapper covers all call sites.

---

## 4. supabase-js / PostgREST with RLS (question 3, option 2)

- **JWT forwarding:**
  - Only automatic with **Supabase Auth**: `@supabase/ssr` reads session cookies, and middleware must refresh them with `supabase.auth.getClaims()`. Supabase's Next.js guide now shows `proxy.ts` (Next 16); on 15.5 it's `middleware.ts`.
  - With **Clerk** you must enable Supabase Third-Party Auth for Clerk, add the `role: authenticated` claim, and pass `accessToken: async () => (await auth()).getToken()` (Supabase and Clerk docs).
  - The Clerk session JWT lives 60 s and is refreshed every 50 s by the frontend (Clerk docs). The agent route runs up to 50 s (`app/api/agent/route.ts:24`) and meters in `onFinish` (`:112-125`), so a token captured at request start can expire mid-request (inferred).
- **No transactions:** "supabase-js does not group multiple queries into one transaction. For multi-statement transactional logic, use a database function (`supabase.rpc(...)`)" (JS reference, rollback modifier). Here that means RPCs for `duplicateItem`'s name loop and insert (`actions/catalogue.ts:150-164`), and for any future atomic plan-limit checks. RPC functions default to SECURITY INVOKER; if you use DEFINER you must `set search_path = ''` (Database Functions docs).
- **Other limits:**
  - `max_rows = 1000` (`supabase/config.toml:11`) silently truncates `app/api/items/route.ts`, which feeds the sitemap and `generateStaticParams`.
  - jsonb columns are replaced whole on PATCH; partial updates need an RPC.
  - Joins need detectable FKs (embedded resources).
  - Types come from `supabase gen types`, which is a second source of truth next to `@quicktalog/common` Drizzle types. The current supabase-js call sites are already untyped (`supabase: any` in `lib/users/syncFromClerk.ts:139,167`, `actions/users.ts:76`).
- **Secret key for webhooks and cron:**
  - Create it with plain `createClient(url, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false, autoRefreshToken: false } })` in an `import "server-only"` module, without the `NEXT_PUBLIC_` prefix.
  - Don't use `createServerClient` with cookies: "Supabase will adhere to the RLS policy of the signed-in user, even if the client library is initialized with a Service Key" (RLS docs).
  - Secret keys return 401 when the User-Agent looks like a browser (API keys docs).
  - Legacy `anon`/`service_role` JWT keys "will work until the end of 2026" (Next.js tutorial). The worker reads `SUPABASE_SERVICE_ROLE_KEY` (`quicktalog-backend/src/types/index.ts:5`); if that's a legacy key, rotate to `sb_secret_…`.
- **Effort here:** rewrite ~39 Drizzle references into PostgREST calls, add RPCs, set up an auth integration, add a second type system. High.

---

## 5. Hybrid patterns and option 4 (question 4)

- **Common production pattern (MakerKit recipe, rphlmr repo):** supabase-js for **Auth only**; Drizzle `rls()` for user queries; Drizzle `admin` for webhooks, cron and migrations. MakerKit's guidance: Drizzle for complex joins and full type inference; supabase-js for Realtime and Storage. That is option 1b.
- **Other variant (option 3):** supabase-js for user CRUD plus Drizzle admin for complex or privileged work. It gives you two privileged surfaces (secret key and admin DB URL), two query APIs and two type systems. Not a good fit here, since 72% of call sites are already Drizzle.
- **Option 4: app-layer authorization only, with all `anon`/`authenticated` grants revoked.**
  - Move the six supabase-js files to Drizzle admin, then `REVOKE ALL … FROM anon, authenticated`.
  - The publishable key then reaches nothing, and lint 0013 clears because it only flags tables reachable by anon/authenticated.
  - The Data API stays for the worker's `service_role`.
  - It is cheap and closes the public-key perimeter. **But it doesn't contain app-layer bugs, and §1.4 shows six already exist.**
  - Supabase's position: "You might be tempted to discard RLS completely and simply filter by user within the where clause … we recommend RLS as a general best practice since RLS is always applied even as new queries and application logic is introduced in the future" (RAG with Permissions docs). Grants are table-wide, so one mistaken grant exposes every row; RLS is the second lock.
  - **Option 4 is a good intermediate step** before policies land.

---

## 6. Policy best practices, applied to Quicktalog (question 5)

Rules from the Supabase RLS, performance and advisor docs:
- **Wrap auth helpers in a sub-select:** `(select auth.jwt()->>'sub')` / `(select auth.uid())` gets an initPlan evaluated once per statement (179 ms → 9 ms benchmark). Lint `0003_auth_rls_initplan` flags unwrapped calls.
- **Always add `TO authenticated` / `TO anon`:** it prevents evaluating the policy for other roles (170 ms → <0.1 ms).
- **Index policy columns:** `catalogues_created_by_idx`, `analytics_user_id_date_idx`, `newsletter_owner_id_idx`, `ocr_user_id_idx`, `prompts_user_id_idx` and `user_themes_user_id_name_key` already exist (verified).
- **Keep app-side filters** (`.where(eq(createdBy, id))`) as well; they help the planner.
- **Avoid joining the source table in a policy.** Use `col in (select … where user = (select auth…))`, or a SECURITY DEFINER function in a **non-exposed** schema.
- **Policy expressions run with the caller's privileges:** grant `usage on schema private` and `execute` on the helper, and revoke EXECUTE from PUBLIC.
- **One policy per command, or one merged policy:** two permissive policies for the same role and command trigger `0006_multiple_permissive_policies`.
- **USING vs WITH CHECK:** USING filters existing rows (select/update/delete). WITH CHECK validates new rows (insert/update). UPDATE also needs a SELECT policy.
- **Blocked writes are silent:** UPDATE/DELETE filtered by RLS affect 0 rows without an error; only INSERT/UPDATE WITH CHECK failures raise `42501`. Check `.returning()` lengths.
- **Constraints and cascades bypass RLS:** unique, PK and FK checks and `ON DELETE/UPDATE CASCADE` ignore policies (PostgreSQL behavior). So an FK to a catalogue doesn't prove ownership; check it in WITH CHECK.
- **Views:** keep `security_invoker = on` (already set on `contacts` and `active_subscriptions`, lockdown migration :145-146) and give them no anon/authenticated grants.
- **Column protection:** use column GRANTs (Column Level Security docs), or simply don't grant UPDATE on `users` to `authenticated`. Users here never update their own row: Clerk and Paddle webhooks do, via the admin path.
- **Restrictive policies** make good belts (e.g. `as restrictive … using ((select auth.jwt()->>'sub') is not null)`, or Clerk `fva` MFA checks).
- **Never base policies on `user_metadata`** (lint 0015).
- **Testing:**
  - pgTAP via `supabase test db`, plus basejump `supabase_test_helpers` (`tests.authenticate_as`, `tests.rls_enabled('public')`).
  - With Clerk ids, set claims manually: `select set_config('request.jwt.claims','{"sub":"user_test_1","role":"authenticated"}',true); set local role authenticated;`, then `results_eq` / `throws_ok '42501'`.
  - Run advisors after every migration.

Concrete migration sketch, Clerk-compatible and unchanged if you later move to Supabase Auth with text ids:
```sql
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- catalogues: public reads active, owners read/write own
alter table public.catalogues enable row level security;
revoke all on public.catalogues from anon, authenticated;
grant select on public.catalogues to anon;
grant select, insert, update, delete on public.catalogues to authenticated;
create policy catalogues_select on public.catalogues for select to anon, authenticated
  using (status = 'active' or created_by = (select auth.jwt() ->> 'sub'));   -- one policy => no 0006 lint
create policy catalogues_insert on public.catalogues for insert to authenticated
  with check (created_by = (select auth.jwt() ->> 'sub'));
create policy catalogues_update on public.catalogues for update to authenticated
  using (created_by = (select auth.jwt() ->> 'sub'))
  with check (created_by = (select auth.jwt() ->> 'sub'));                    -- blocks publishCatalogue owner rewrite
create policy catalogues_delete on public.catalogues for delete to authenticated
  using (created_by = (select auth.jwt() ->> 'sub'));

-- users: read own row only; all writes via admin (webhooks)
alter table public.users enable row level security;
revoke all on public.users from anon, authenticated;
grant select on public.users to authenticated;
create policy users_select_own on public.users for select to authenticated
  using (id = (select auth.jwt() ->> 'sub'));

-- usage tables: read own, never write (quota integrity; metering uses admin)
alter table public.analytics enable row level security;
alter table public.ocr enable row level security;
alter table public.prompts enable row level security;
revoke all on public.analytics, public.ocr, public.prompts from anon, authenticated;
grant select on public.analytics, public.ocr, public.prompts to authenticated;
create policy analytics_own on public.analytics for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy ocr_own on public.ocr for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));
create policy prompts_own on public.prompts for select to authenticated using (user_id = (select auth.jwt() ->> 'sub'));

-- user_themes: full CRUD on own rows
alter table public.user_themes enable row level security;
revoke all on public.user_themes from anon, authenticated;
grant select, insert, update, delete on public.user_themes to authenticated;
create policy user_themes_own on public.user_themes for all to authenticated
  using (user_id = (select auth.jwt() ->> 'sub')) with check (user_id = (select auth.jwt() ->> 'sub'));

-- qr_configs: owner of the referenced catalogue (set form, no join to source table)
alter table public.qr_configs enable row level security;
revoke all on public.qr_configs from anon, authenticated;
grant select, insert, update on public.qr_configs to authenticated;
create policy qr_configs_owner on public.qr_configs for all to authenticated
  using (catalogue in (select name from public.catalogues where created_by = (select auth.jwt() ->> 'sub')))
  with check (catalogue in (select name from public.catalogues where created_by = (select auth.jwt() ->> 'sub')));
create unique index if not exists qr_configs_catalogue_key on public.qr_configs (catalogue);

-- newsletter: owner reads; public signup cannot spoof owner
alter table public.newsletter enable row level security;
revoke all on public.newsletter from anon, authenticated;
grant select, delete on public.newsletter to authenticated;
grant insert (email, catalogue_id, owner_id) on public.newsletter to anon, authenticated;
create policy newsletter_owner_read on public.newsletter for select to authenticated
  using (owner_id = (select auth.jwt() ->> 'sub'));
create policy newsletter_signup on public.newsletter for insert to anon, authenticated
  with check (exists (select 1 from public.catalogues c
                      where c.id = catalogue_id and c.created_by = owner_id and c.status = 'active'));
create unique index if not exists newsletter_catalogue_email_key on public.newsletter (catalogue_id, lower(email));
-- then: insert ... on conflict do nothing (no RETURNING for anon, which has no SELECT)

-- product_newsletter: insert-only
alter table public.product_newsletter enable row level security;
revoke all on public.product_newsletter from anon, authenticated;
grant insert (email) on public.product_newsletter to anon, authenticated;
create policy product_newsletter_signup on public.product_newsletter for insert to anon, authenticated
  with check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
create unique index if not exists product_newsletter_email_key on public.product_newsletter (lower(email));

-- system-only tables: RLS on, no policies, no grants (lint 0008 INFO is intentional)
alter table public.subscriptions enable row level security;
alter table public.plans enable row level security;
alter table public.job_logs enable row level security;
revoke all on public.subscriptions, public.plans, public.job_logs from anon, authenticated;
revoke execute on function public.get_pageview_totals(timestamptz, timestamptz) from anon;

-- name availability incl. drafts, without exposing drafts (not reachable over PostgREST)
create or replace function private.catalogue_name_taken(p_name text) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.catalogues where name = p_name) $$;
revoke all on function private.catalogue_name_taken(text) from public;
grant execute on function private.catalogue_name_taken(text) to authenticated;
```
Also fix `prompts_service_catalogue_key UNIQUE(catalogue)`: drop it or replace it with a non-unique index.

---

## 7. ID types (question 6)

- **Staying on Clerk:** keep `text`. Use `created_by = (select auth.jwt() ->> 'sub')`: text = text, btree index usable, cast-free, initPlan-cached. **Never use `auth.uid()`** (throws 22P02, verified). Don't use `drizzle-orm/supabase`'s `authUid`. The Clerk integration docs use exactly `(select auth.jwt()->>'sub') = user_id::text` with `user_id text`.
- **Moving to Supabase Auth:**
  - **Option (a), keep text columns (recommended):** write policies with `auth.jwt()->>'sub'` (the uuid as a string) or `(select auth.uid())::text`. The cast is on the constant side and runs once per statement, and the column index still works. Map old Clerk ids to new uuids by `UPDATE users SET id = <uuid>::text`; every user FK is `ON UPDATE CASCADE` (verified), so children follow.
  - **Option (b), convert columns to `uuid` with FKs to `auth.users`:** type changes on the `users` PK and 6 FK columns, dual-running ids during cutover, and Drizzle schema changes in `@quicktalog/common`. It saves a few bytes per row but adds a cross-schema FK into a Supabase-managed schema. Not worth it at 3 users.
  - **Avoid `created_by::uuid = auth.uid()`.** Casting the column prevents the btree index being used and errors on any non-uuid legacy value.

---

## 8. Migration tooling (question 7)

- **Put policies, grants, roles and `private` helpers in `supabase/migrations` SQL.**
  - That directory already owns the history: the remote_schema baseline, the lockdown and FK fixes.
  - The Supabase docs bundle grants with RLS in the same migration ("Bundle grants with your RLS setup in the same migration").
  - The CLI gives `db diff` (pg-delta), `db reset`, `test db` and `gen types`.
  - Caveat: policy renames don't diff cleanly (CLI workflows doc).
- **drizzle-kit does support policies:**
  - `pgPolicy` (`pg-core/policies.d.ts`), `enableRLS()`, and `pgRole(...).existing()`.
  - `entities.roles.provider: "supabase"` excludes anon, authenticator, authenticated, service_role, supabase_auth_admin, supabase_storage_admin, dashboard_user and supabase_admin (`node_modules/drizzle-kit/bin.cjs:16880-16890`).
  - Reported issues: policies not applied by `push` (drizzle-orm #3504); `pull` importing only the last policy (#4407).
  - Neither repo's config points at a real schema file (§1.5), and the published schema carries a policy that doesn't exist in the DB.
- **Recommendation:** treat `@quicktalog/common`'s Drizzle schema as **types only**. Regenerate it with `drizzle-kit pull` after each Supabase migration, strip `pgPolicy`, and never run `drizzle-kit push/generate/migrate` against Supabase. Delete or fix `quicktalog-app/drizzle.config.ts` to prevent accidents.

---

## 9. Decision matrix (this codebase; 5 = best)

| Criterion | 1a Drizzle as postgres (today) | **1b Drizzle + RLS wrapper + admin** | 1c = 1b + NOINHERIT login role | 2 supabase-js only (JWT + secret key) | 3 supabase-js user CRUD + Drizzle admin | 4 App-layer only, zero anon/auth grants |
|---|---|---|---|---|---|---|
| Security | 1: RLS inert; anon can DELETE users (TEST) | 4: contains app IDORs; bypass limited to admin module | 5: fail-closed if wrapper forgotten | 4 with Supabase Auth (DB verifies JWT); 3 with Clerk (third-party setup, 60 s tokens) | 3: two privileged surfaces | 2: perimeter closed, IDORs uncontained |
| DX | 5 | 4: `asUser(tx => …)`, same Drizzle API | 3: two credentials and pools | 2: rewrite, RPCs | 2: two APIs | 5 |
| Performance | 5 | 4: +3 RTT per block; region-sensitive | 4 | 3: HTTP hop, but 1 round trip per query server-side | 3 | 5 |
| Transactions | 5 | 5: wrapper is a transaction | 5 | 2: RPC only | 3 | 5 |
| Type safety | 4 (schema drift) | 4 | 4 | 3 (`gen types`, separate) | 2 (two sources) | 4 |
| Effort here | 5 (none) | 3: wrap ~39 refs in 10 files, move 6 supabase-js files, 1 migration | 2 | 1: ~39 refs rewritten, RPCs, auth integration | 2 | 4: move 6 files, revoke grants |
| Vercel 60 s / serverless fit | 4 (default max 10 per instance risky) | 4: short tx, `max: 3`, `idle_timeout: 5`; never span the agent turn | 3: doubled pooler clients | 3 with Clerk (token expiry across 50 s turns); 4 with Supabase Auth (no pool) | 3 | 4 |

---

## 10. Recommendation and ordering

**Choose 1b now (Drizzle-first hybrid), consider 1c later, and keep supabase-js only for Supabase Auth if you adopt it.**

Reasons:
- 72% of data access is already Drizzle, and types come from `@quicktalog/common`.
- Clerk ids are text, and `auth.jwt()->>'sub'` policies work unchanged across an auth migration.
- Transactions come for free.
- The wrapper doesn't depend on Clerk token lifetime during 50 s agent turns.
- It removes PostgREST from the app, so the publishable key can end up with zero table grants except the anon reads that policies define.

Order matters, because enabling RLS silently breaks the anon supabase-js paths but not Drizzle-as-postgres:
1. **Add `utils/db/{index,session,admin}.ts`** (§2.3). Restrict `admin` imports with Biome `noRestrictedImports` (available in the Biome 2.2 schema) to `app/api/clerk`, `utils/paddle`, the user-sync helper, AI metering and `tests/`.
2. **Move the 6 supabase-js files:**
   - Clerk webhook, Paddle webhook and on-demand seed → admin.
   - `/api/items` and `/api/items/[name]` → `asAnon`.
   - Dashboard analytics → `asUser`.
3. **Fix the app-layer IDORs** (§1.4). Stop taking `userId`/`ownerId`/`createdBy` from callers, whitelist columns in `publishCatalogue`, and delete `/api/users/[id]` or require `callerId === id`.
4. **Run the option-4 migration:** revoke all anon/authenticated grants, including the stale ones and `get_pageview_totals`. This is safe once steps 2-3 ship.
5. **Convert Drizzle call sites to `asUser`/`asAnon`.** Keep app checks for friendly errors, and check `returning()` lengths.
6. **Run the RLS migration** (§6): enable RLS, minimal grants, policies, `private` helpers, unique indexes, and fix the `prompts` unique constraint. Add pgTAP tests and run advisors.
7. **Optionally** switch user traffic to `app_rls` (1c).
8. **Operational:**
   - Co-locate the Vercel function region with the DB (eu-west-1).
   - Set postgres-js `max` / `idle_timeout`.
   - Rotate the worker to `sb_secret_…` before legacy keys end (end of 2026).
   - Remember Redis and the preview page (`app/catalogues/[name]/preview/page.tsx:28`) sit outside RLS.

---

## Sources
- Drizzle RLS docs: https://orm.drizzle.team/docs/rls
- Example repo: https://github.com/rphlmr/drizzle-supabase-rls (`database/drizzle.ts`, `supabase/seed.sql`)
- MakerKit recipe: https://makerkit.dev/docs/next-supabase-turbo/recipes/drizzle-supabase
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- RLS performance: https://supabase.com/docs/guides/database/postgres/row-level-security-performance
- RLS best practices: https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv
- Column Level Security: https://supabase.com/docs/guides/database/postgres/column-level-security
- Securing your API: https://supabase.com/docs/guides/api/securing-your-api
- API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase + Clerk: https://supabase.com/docs/guides/auth/third-party/clerk
- Clerk + Supabase: https://clerk.com/docs/guides/development/integrations/databases/supabase
- Clerk session tokens: https://clerk.com/docs/guides/how-clerk-works/overview
- Connecting to Postgres: https://supabase.com/docs/guides/database/connecting-to-postgres
- Accessing Postgres (transaction mode limits): https://supabase.com/docs/guides/self-hosting/accessing-postgres
- Disabling prepared statements: https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements-qL8lEL
- Compute and disk limits: https://supabase.com/docs/guides/platform/compute-and-disk
- Database advisors: https://supabase.com/docs/guides/database/database-advisors
- pgTAP extended testing: https://supabase.com/docs/guides/local-development/testing/pgtap-extended
- CLI workflows: https://supabase.com/docs/guides/local-development/cli-workflows
- Database functions: https://supabase.com/docs/guides/database/functions
- JS rollback modifier (no transactions): https://supabase.com/docs/reference/javascript/using-modifiers-rollback
- Next.js tutorial (getClaims, legacy keys): https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs
- RAG with permissions: https://supabase.com/docs/guides/ai/rag-with-permissions
- PostgREST transactions: https://docs.postgrest.org/en/v14/references/transactions.html
- PostgreSQL ALTER ROLE: https://www.postgresql.org/docs/current/sql-alterrole.html
- Vercel connection pooling: https://vercel.com/kb/guide/connection-pooling-with-functions
- `@vercel/functions` reference: https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package
- Supavisor client growth issue: https://github.com/orgs/supabase/discussions/40671
- drizzle-orm issues: https://github.com/drizzle-team/drizzle-orm/issues/3504, https://github.com/drizzle-team/drizzle-orm/issues/4407

## facts
- (verified-in-source) On TEST, role postgres has rolbypassrls=true and rolsuper=false, so every Drizzle query over DB_CONNECTION_STRING (postgres.<ref>) ignores RLS policies. [TEST SQL: select rolname, rolsuper, rolbypassrls from pg_roles]
- (verified-in-source) postgres is a member of anon, authenticated and service_role with admin_option=true, inherit=true, set=true; authenticator is a member of the same roles with inherit=false, set=true. postgres also has rolcreaterole=true. [TEST SQL: pg_auth_members join pg_roles]
- (verified-in-source) On TEST, select set_config('role','authenticated',true) switches current_user to authenticated (session_user stays postgres, current role bypassrls=false). [TEST SQL probe (transaction-local)]
- (verified-in-source) auth.uid() is defined as coalesce(request.jwt.claim.sub, request.jwt.claims->>'sub')::uuid and raises 22P02 'invalid input syntax for type uuid' for a Clerk id like user_3JKGexample, while (auth.jwt()->>'sub') returns the text id. [TEST SQL: pg_get_functiondef(auth.uid) and set_config probe]
- (verified-in-source) Role-level settings on TEST: authenticated statement_timeout=8s, anon statement_timeout=3s, authenticator statement_timeout=8s and lock_timeout=8s plus safeupdate. [TEST SQL: pg_roles.rolconfig]
- (verified-in-docs) Role-specific variable settings take effect only at login; SET ROLE does not process them, so a Drizzle SET LOCAL ROLE path does not inherit the 8s/3s timeouts. [https://www.postgresql.org/docs/current/sql-alterrole.html]
- (verified-in-docs) PostgREST applies impersonated role settings (e.g. statement_timeout) as transaction-scoped settings per request. [https://docs.postgrest.org/en/v14/references/transactions.html]
- (verified-in-source) TEST: max_connections=60, PostgREST 14.5, Postgres 17.6, region eu-west-1; users has 3 rows all with Clerk ids; auth.users has 0 rows; no private schema; no pgtap extension. [TEST SQL + get_project]
- (verified-in-source) TEST anon grants: users DELETE/INSERT/SELECT/UPDATE, catalogues INSERT/SELECT/UPDATE, subscriptions INSERT/SELECT/UPDATE, analytics INSERT/SELECT, newsletter SELECT, job_logs INSERT; get_pageview_totals EXECUTE to anon; authenticated has none. RLS disabled and 0 policies on all public tables. [TEST SQL: information_schema.role_table_grants, pg_class.relrowsecurity, has_function_privilege]
- (verified-in-source) Security advisor lint 0013_rls_disabled_in_public (ERROR) currently flags users, catalogues, subscriptions, analytics, newsletter. [Supabase get_advisors(security) on TEST]
- (verified-in-source) utils/drizzle.ts creates postgres(DB_CONNECTION_STRING, { prepare: false }) with no max/idle_timeout; postgres-js defaults are max 10, idle_timeout null, max_lifetime 30-60 min. [utils/drizzle.ts:5-8; node_modules/postgres/src/index.js:448-456,515-517]
- (verified-in-source) utils/supabase/server.ts builds a @supabase/ssr server client with NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; with Clerk auth there are no Supabase session cookies so all its queries run as anon. [utils/supabase/server.ts:4-45; middleware.ts:1-7]
- (verified-in-source) Drizzle call sites (postgres role): app/api/dashboard/catalogues/route.ts:18, app/api/dashboard/newsletter/route.ts:18,35, actions/catalogue.ts:46,52,69,79,99,105,137,151,161,187,204,246,289,328,340, actions/qr-configs.ts:14,21,30,54, actions/newsletter.ts:25,40,64,74, actions/themes.ts:20,48,57,62,91, lib/ai/access.ts:40,98, lib/users/fetchUserData.ts:42,64,93,98,112,123, tests/e2e/helpers/cleanup.ts:14-16,50-55. [grep over quicktalog-app (excluding .kilo/.next/node_modules)]
- (verified-in-source) supabase-js (anon) call sites: app/api/items/route.ts:13-21, app/api/items/[name]/route.ts:13-17, app/api/dashboard/analytics/route.ts:17-25, app/api/clerk/route.ts:51 -> lib/users/syncFromClerk.ts:142,171-175 and actions/users.ts:83-87, lib/users/fetchUserData.ts:53-55, utils/paddle/process-webhook.ts:73,87,106,136,151,170,192,220. [grep over quicktalog-app]
- (verified-in-source) The app contains no .transaction(, raw sql`, .execute( or .rpc( calls. [grep over actions, app, lib, utils, agent, helpers]
- (verified-in-source) getUserData(userId?) accepts an arbitrary userId with no ownership check and is imported by a client component, exposing another user's row (email, customerId, planId, consents) plus usage. [actions/users.ts:9-13,29; context/UserContext.tsx:3,36; lib/users/fetchUserData.ts:143]
- (verified-in-source) GET /api/users/[id] returns fetchUserData for any id without requiring authentication; no app code references the route. [app/api/users/[id]/route.ts:11-31]
- (verified-in-source) upsertQrConfig and getQrConfig server actions have no authentication or ownership check and are called from a client component. [actions/qr-configs.ts:8-57; components/qr-editor/QrPreview.tsx:81]
- (verified-in-source) getCatalogueByName server action has no auth and returns draft catalogues; it is called from a client component. [actions/catalogue.ts:284-303; components/dashboard/components/DashboardItem.tsx:35]
- (verified-in-source) publishCatalogue checks ownership by name then spreads the client payload into update().set({...rest}), allowing created_by/id to be overwritten. [actions/catalogue.ts:328-347]
- (verified-in-source) newsletterSignup trusts a client-supplied ownerId. [actions/newsletter.ts:19-44; components/catalogue/view/CatalogueFooter.tsx:42-46]
- (verified-in-docs) The official Drizzle Supabase RLS example (createDrizzle token {admin, client}) injects claims with sql.raw(JSON.stringify(token)), takes the role from the token via set local role ${sql.raw(token.role)}, decodes the token from getSession, and resets in a finally block. [https://orm.drizzle.team/docs/rls; https://github.com/rphlmr/drizzle-supabase-rls/blob/main/database/drizzle.ts]
- (verified-in-docs) The rphlmr example uses a separate rls_client LOGIN user granted anon and authenticated for the RLS client, and the postgres user for admin. [https://github.com/rphlmr/drizzle-supabase-rls (supabase/seed.sql)]
- (verified-in-source) postgres-js uses the simple query protocol only when a query has no bound parameters (simple: args.length === 0); drizzle's postgres-js session calls client.unsafe(query, params). [node_modules/postgres/src/index.js:124,141; node_modules/drizzle-orm/postgres-js/session.js:33]
- (verified-in-source) drizzle-orm 0.45.2 exposes table.enableRLS() and has no withRLS in pg-core (docs still show pgTable.withRLS). [node_modules/drizzle-orm/pg-core/table.js:49-52; grep withRLS count 0]
- (verified-in-source) drizzle-orm/supabase exports authUid = sql`(select auth.uid())` and postgresRole = pgRole('postgres_role').existing() (a non-existent role name); crudPolicy lives only in drizzle-orm/neon and uses auth.user_id(). [node_modules/drizzle-orm/supabase/rls.js:6,34; node_modules/drizzle-orm/neon/rls.js:5-61]
- (verified-in-source) drizzle-kit 0.31.10 entities.roles.provider 'supabase' excludes anon, authenticator, authenticated, service_role, supabase_auth_admin, supabase_storage_admin, dashboard_user, supabase_admin from role management. [node_modules/drizzle-kit/bin.cjs:16873-16900]
- (verified-in-docs) Supavisor transaction mode does not support session-level features (SET, LISTEN/NOTIFY, cross-transaction temp tables, advisory locks) nor prepared statements. [https://supabase.com/docs/guides/self-hosting/accessing-postgres; https://supabase.com/docs/guides/database/connecting-to-postgres]
- (verified-in-docs) Nano and Micro compute: 60 database max connections and 200 connection pooler max clients. [https://supabase.com/docs/guides/platform/compute-and-disk]
- (verified-in-docs) Supabase RLS perf guidance: wrap auth.uid()/auth.jwt() in select for initPlan caching, add TO role, index policy columns, avoid joins to source table, security definer functions must not live in exposed schemas. [https://supabase.com/docs/guides/database/postgres/row-level-security]
- (verified-in-docs) Supabase will adhere to the signed-in user's RLS even if the client library is initialized with a service key; secret keys return 401 when used from a browser User-Agent and bypass RLS via service_role BYPASSRLS. [https://supabase.com/docs/guides/database/postgres/row-level-security; https://supabase.com/docs/guides/getting-started/api-keys]
- (verified-in-docs) supabase-js does not group multiple queries into one transaction; multi-statement transactional logic must use a database function via rpc(). [https://supabase.com/docs/reference/javascript/using-modifiers-rollback]
- (verified-in-docs) Use getClaims to verify identity server-side; getSession's user object must not be trusted for authorization when stored in cookies. [https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs; node_modules/@supabase/auth-js/dist/module/GoTrueClient.d.ts:1313-1318,2393]
- (verified-in-docs) Legacy anon and service_role keys work until the end of 2026; publishable/secret keys are recommended. [https://supabase.com/docs/guides/getting-started/tutorials/with-nextjs]
- (verified-in-docs) Clerk + Supabase integration uses text user_id columns with default auth.jwt()->>'sub' and policies (select auth.jwt()->>'sub') = user_id; server client uses accessToken: async () => (await auth()).getToken(); integration adds role: authenticated to session tokens. [https://clerk.com/docs/guides/development/integrations/databases/supabase; https://supabase.com/docs/guides/auth/third-party/clerk]
- (verified-in-docs) Clerk session tokens are 60-second JWTs refreshed every 50 seconds by the frontend SDK. [https://clerk.com/docs/guides/how-clerk-works/overview]
- (verified-in-source) Clerk currentUser() calls clerkClient().users.getUser() and counts toward the Backend API rate limit; auth() is sufficient to get the verified userId. [node_modules/@clerk/nextjs/dist/esm/app-router/server/currentUser.js:4-11; dist/types/app-router/server/currentUser.d.ts:10]
- (verified-in-source) The agent route has maxDuration 60, a 50s server timeout, and meters usage in onFinish after streaming. [app/api/agent/route.ts:13,24,56,112-125]
- (verified-in-source) prompts has a UNIQUE (catalogue) constraint (prompts_service_catalogue_key) on TEST, so a second meter() insert for the same catalogue violates it. [TEST SQL: pg_constraint; lib/ai/access.ts:98]
- (verified-in-source) qr_configs.catalogue has no unique constraint on TEST (only qr_configs_catalogue_idx), while the Drizzle schema declares unique qr_configs_catalogue_key; qr_configs.id is uuid in DB vs serial in Drizzle; job_logs.id bigint vs uuid; job_logs.log jsonb vs text. [TEST SQL: pg_constraint/information_schema.columns; ../quicktalog-packages/src/drizzle/migrations/schema.ts:103-125]
- (verified-in-source) The published Drizzle schema declares a pgPolicy on users (authenticated, using true) that does not exist in the database. [../quicktalog-packages/src/drizzle/migrations/schema.ts:35; node_modules/@quicktalog/common/dist/drizzle/migrations/schema.js:31; TEST SQL pg_policy count 0]
- (verified-in-source) Both drizzle-kit configs point to schema files that do not exist (quicktalog-app ./drizzle/schema.ts; quicktalog-packages ./src/drizzle/schema.ts). [quicktalog-app/drizzle.config.ts:5; quicktalog-packages/drizzle.config.ts:5; ls]
- (verified-in-source) The lockdown migration's anon grants cite files that no longer exist (utils/paddle/get-customer-id.ts, app/api/subscriptions/check/route.ts, app/api/analytics/route.ts, app/api/items POST/PATCH). [supabase/migrations/20260912093000_lockdown_privileges_and_schema_fixes.sql:52-90,113-119; ls app/api]
- (verified-in-source) The worker uses a service-role supabase-js client for all DB access (SUPABASE_SERVICE_ROLE_KEY), so disabling the Data API would break it. [quicktalog-backend/src/lib/supabase.ts:5; src/handlers/analyticsProcessingJob.ts:28; src/handlers/subscriptionProcessingJob.ts:14; src/types/index.ts:5]
- (verified-in-docs) attachDatabasePool supports pg, mysql2, MariaDB, MongoDB, ioredis, cassandra-driver and other compatible pools; Vercel recommends ~5s idle timeout and minimum pool size 1. postgres.js is not explicitly listed. [https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package; https://vercel.com/kb/guide/connection-pooling-with-functions]
- (inferred) The Drizzle official createDrizzle example is vulnerable to SQL injection when any claim contains a single quote (e.g. user-editable user_metadata), executing before the role switch while still BYPASSRLS. [Analysis of https://orm.drizzle.team/docs/rls code + Supabase RLS docs on raw_user_meta_data]
- (inferred) In the official example's finally block, the reset statement fails with 25P02 inside an aborted transaction and masks the original error. [JS finally semantics + Postgres aborted transaction behavior]
- (inferred) Each Drizzle RLS block adds roughly 3 round trips (BEGIN, set_config, COMMIT) versus a single autocommit query; cross-region latency (e.g. iad1 to eu-west-1) would amplify this. [postgres-js begin() implementation reasoning]
- (uncertain) The Vercel function region for Quicktalog could not be verified (project not in the accessible Vercel team); TEST DB is eu-west-1. [Vercel MCP list_projects; Supabase get_project]
- (inferred) get_pageview_totals declares RETURNS TABLE(user_id uuid, ...) but analytics.user_id is text, so the function likely errors at runtime with a result type mismatch. [TEST SQL pg_get_functiondef + information_schema.columns]
- (uncertain) drizzle-kit has reported issues: RLS policies not applied with push (#3504) and pull importing only the last policy (#4407). [https://github.com/drizzle-team/drizzle-orm/issues/3504; https://github.com/drizzle-team/drizzle-orm/issues/4407]
## gotchas
- Enabling RLS does nothing for Drizzle-over-DB_CONNECTION_STRING (postgres has BYPASSRLS) but immediately breaks every anon supabase-js path: Clerk webhook user sync, Paddle webhook, /api/items, /api/items/[name], dashboard analytics, on-demand user seed. Move those first.
- auth.uid() throws 22P02 on Clerk ids (verified on TEST). Policies must use (select auth.jwt()->>'sub'), and drizzle-orm/supabase's authUid helper (which emits auth.uid()) cannot be used.
- Never copy the Drizzle docs' createDrizzle verbatim: sql.raw(JSON.stringify(token)) is SQL-injectable, the role comes from the token (a forged service_role claim means BYPASSRLS, since postgres is a member of service_role), the token is decoded from getSession without verification, and the finally reset masks errors in aborted transactions.
- If you parameterize the docs' multi-statement set_config block, it breaks: postgres-js only uses the simple protocol (multi-statement allowed) when there are no parameters. Use one SELECT with several set_config(...) calls.
- Only use set_config(..., true) / SET LOCAL inside an explicit transaction. Session-level SET through Supavisor transaction mode leaks role and claims to whichever request reuses that backend connection.
- SET ROLE does not apply ALTER ROLE ... SET settings, so the authenticated 8s and anon 3s statement_timeouts are NOT in effect on the Drizzle path unless you set statement_timeout yourself.
- Grants to authenticated/anon are shared by PostgREST and the Drizzle SET ROLE path. With Supabase Auth, every user can call the Data API directly with the same privileges, so policies are the real boundary even if the app never uses PostgREST.
- Don't hold an RLS transaction open across Redis calls, revalidateTag/Path, AI calls or the 50s agent stream: each open transaction pins a pooler backend. Keep blocks short and do side effects after commit.
- postgres-js default max is 10 connections per instance. Nano/Micro pooler allows 200 clients total, so set max around 2-3 and idle_timeout around 5 seconds.
- UPDATE/DELETE blocked by RLS USING succeed silently with 0 rows; only WITH CHECK violations raise 42501. Check .returning() lengths instead of assuming success.
- UPDATE needs a matching SELECT policy. INSERT ... RETURNING needs SELECT visibility, so for anon inserts (newsletter signup) don't use RETURNING. Use a unique index plus ON CONFLICT DO NOTHING instead of a pre-check SELECT.
- FK checks and ON DELETE/UPDATE CASCADE bypass RLS. An FK to a catalogue doesn't prove ownership; qr_configs/prompts WITH CHECK must verify the owner.
- Policy expressions run with the caller's privileges: a helper in schema private needs GRANT USAGE on the schema and EXECUTE on the function to anon/authenticated, and EXECUTE revoked from PUBLIC (functions default to PUBLIC EXECUTE).
- Two permissive policies for the same role and command trigger lint 0006; merge public-active and owner SELECT on catalogues into one policy.
- Usage and quota tables (prompts, ocr, analytics) must not be writable or deletable by authenticated, or users can reset their own quota. Meter through the admin path.
- With Clerk plus supabase-js, the JWT lives 60s. A token captured at the start of a 50s agent turn can expire before onFinish metering.
- A secret-key supabase-js client must not be created with @supabase/ssr createServerClient plus cookies: if a user session is present, requests run under that user's RLS instead of bypassing it.
- PostgREST max_rows=1000 (supabase/config.toml:11) silently truncates /api/items, which feeds the sitemap and generateStaticParams.
- The @quicktalog/common Drizzle schema contains a stale pgPolicy (users, authenticated, using true) and type drift; running drizzle-kit push/generate against Supabase would create it. Never let drizzle-kit manage policies here.
- prompts has UNIQUE(catalogue) on TEST, so AI metering fails after the first prompt per catalogue; actions/ai.ts would report 'Generation failed' after a successful generation.
- Redis cache and app/catalogues/[name]/preview/page.tsx serve catalogue data (drafts included) with no DB authorization; RLS does not cover them.
- The worker still uses SUPABASE_SERVICE_ROLE_KEY; if it's the legacy JWT key, it stops working after end of 2026.
- The lockdown migration comments justify anon grants with files that no longer exist, so the anon catalogues INSERT/UPDATE, analytics INSERT, job_logs INSERT and get_pageview_totals EXECUTE grants are stale exposure today.
- Vercel Hobby 60s cap: keep DB work in the agent route to short, separate transactions (authorize, then meter); never one transaction spanning the stream.
## recommendations
- Adopt option 1b (Drizzle-first hybrid): user and public queries via a hardened withRls wrapper (asUser/asAnon), system paths via an import-restricted Drizzle admin client, and supabase-js removed from the app data path (kept only for Supabase Auth if adopted).
- Implement the wrapper as ONE parameterized statement inside db.transaction: select set_config('request.jwt.claims', $claims, true), set_config('role', $role, true), set_config('statement_timeout', $t, true); allowlist role in ('anon','authenticated'); build claims server-side from Clerk auth() now, or from supabase.auth.getClaims() with allowlisted claims later.
- Sequence the rollout: (1) add utils/db modules; (2) move the 6 supabase-js files (Clerk webhook, Paddle webhook, on-demand seed to admin; /api/items to asAnon; dashboard analytics to asUser); (3) fix the app-layer IDORs (getUserData userId, /api/users/[id], qr-configs, getCatalogueByName, newsletter ownerId, publishCatalogue set spread); (4) revoke all anon/authenticated grants (option-4 state); (5) convert Drizzle call sites; (6) migration enabling RLS with minimal grants and policies; (7) optionally switch user traffic to a NOINHERIT app_rls login role.
- Write all policies against (select auth.jwt()->>'sub') and keep ownership columns as text: works with Clerk today and with Supabase Auth later (remap users.id via ON UPDATE CASCADE) without converting columns to uuid.
- Author RLS, grants, private helper functions and roles only in supabase/migrations SQL; treat the @quicktalog/common Drizzle schema as types-only (regenerate with drizzle-kit pull, strip pgPolicy), and delete or fix the broken drizzle.config.ts files so nobody runs push/generate.
- Use a private schema for SECURITY DEFINER helpers (e.g. private.catalogue_name_taken(text) for draft-aware name checks) with search_path = '', EXECUTE revoked from PUBLIC and granted only to needed roles.
- Configure postgres-js for Vercel: prepare:false, max 2-3, idle_timeout 5 (seconds), max_lifetime ~10 min; co-locate the Vercel function region with the Supabase region (TEST is eu-west-1) and verify it in project settings.
- Replace currentUser() with auth() for authorization checks (currentUser hits Clerk's Backend API and its rate limit); fetch the full profile only where needed.
- Add unique indexes that let public writes avoid pre-check SELECTs: newsletter (catalogue_id, lower(email)), product_newsletter (lower(email)), qr_configs (catalogue); drop or replace prompts UNIQUE(catalogue).
- Add pgTAP RLS tests (supabase test db, basejump supabase_test_helpers or manual set_config claims with Clerk-style ids) covering owner, non-owner and anon for every table; run Supabase security and performance advisors after each migration (watch 0003, 0006, 0008, 0013, 0024).
- Restrict admin client imports with Biome noRestrictedImports (allow only app/api/clerk, utils/paddle, the user-sync helper, AI metering, tests) and mark all DB modules with import 'server-only'.
- Rotate the worker to an sb_secret_ key before legacy service_role JWT keys end (end of 2026), and never expose secret keys via NEXT_PUBLIC_ variables.