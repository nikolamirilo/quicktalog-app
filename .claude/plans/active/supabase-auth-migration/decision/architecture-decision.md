# Architecture decision: how the app talks to Postgres with RLS

> Decision record from 2026-09-16: a judge scored three independent proposals (A: Drizzle into standard `authenticated`/`anon` roles, B: private app roles, C: supabase-js/PostgREST first) and picked B with grafts. The SQL and runbook details below were later corrected by verification. **`../PLAN.md` is authoritative**; use this file for the reasoning.

## Scores

| Proposal | Security | Correctness for this repo | DX | Serverless fit | Migration effort/risk | Future flexibility | Total |
|---|---|---|---|---|---|---|---|
| A-standard-authenticated | 7 | 7 | 5 | 7 | 4 | 8 | **6.35** |
| B-private-app-role | 8.5 | 6.5 | 7 | 7 | 7 | 5.5 | **7.13** |
| C-supabase-js-first | 6.5 | 5.5 | 5 | 7.5 | 3 | 8 | **5.98** |

## Judge rationale per proposal

### A-standard-authenticated

Strong and careful. It is the only proposal that noticed Drizzle lists every column in an INSERT (verified at node_modules/drizzle-orm/pg-core/dialect.js:356-392), so column-limited INSERT grants would break every Drizzle insert. It also has a good wrapper (one parameterized set_config, allowlisted role, branded identity, legacy claim blanking), careful AI reservation, and Paddle idempotency. The core cost is that it accepts every `authenticated` grant as a public PostgREST API for all signed-in users. That forces plan rules into PL/pgSQL:
- private.plan_features copies `tiers`
- content_stats re-implements helpers/catalogueOperations.ts counting over jsonb
- normalizing triggers silently rewrite data

The result is permanent TS/SQL drift, a guard trigger whose bug blocks every save, and the largest effort (27-38 days). Two minor errors: its `alter default privileges ... in schema private revoke execute from public` is ineffective (TEST has no global default ACL; per-schema defaults cannot remove the hard-wired PUBLIC grant), though it also revokes explicitly. Its authenticated SELECT policy exposes created_by of all active catalogues. It scores best on flexibility because it uses the standard roles.

### B-private-app-role

It removes the core tension instead of mitigating it. User traffic runs as NOLOGIN app_user/app_public, which authenticator is not a member of (verified on TEST: authenticator's memberships are anon/authenticated/service_role only). anon/authenticated keep zero grants, so a signed-in user holding a Supabase JWT reaches nothing through PostgREST. That lets plan and business rules stay in TypeScript with `tiers` as the single source of truth, and Drizzle keeps transactions. The private helper that reads request.jwt.claims is required, not a stylistic choice: on TEST, schema `auth` USAGE is granted to postgres without grant option, so custom roles cannot call auth.jwt(). Policies survive the Clerk to Supabase cutover unchanged, and the fail-closed app_rls end state is included. Its analysis is the most precise: timeouts on the SET ROLE path, pooler per-user pools, advisor blind spots.

Correctness defects:
- Column-limited INSERT grants on catalogues, qr_configs and user_themes would make every Drizzle insert fail with 42501.
- It claims PUBLIC function EXECUTE is already revoked by default ACL. That is wrong in mechanism: the public-schema proacls on TEST are clean only because of explicit REVOKEs in the lockdown migration.
- Its per-schema default-privilege revoke is ineffective.
- The newsletter function wrongly requires footer.type='custom'.

All of these are cheap to fix. It is less flexible for future Realtime postgres_changes, browser data access or Storage policies that consult public tables, but that is reversible per table. Lowest effort and risk for the data layer (13-17 days before Auth).

### C-supabase-js-first

Strengths:
- The DB verifies the JWT, and DB_CONNECTION_STRING leaves Vercel, though the secret key there is an equivalent bypass.
- Guard triggers bind every writer, including the Clerk-period Drizzle writes and the worker.
- It correctly uses the global ALTER DEFAULT PRIVILEGES revoke, which matches the TEST pg_default_acl facts.
- One-RPC round trips fit serverless well, with no connection pools.
- Sound agent token-binding analysis, DB-side continuation counting, refunded flag instead of deletes, and size CHECKs.

Weaknesses:
- It rewrites 39 Drizzle references that already work, into a second type system with no interactive transactions (an RPC for every multi-statement operation) and max_rows truncation hazards.
- It carries the same public `authenticated` surface as A, so plan rules are duplicated in plpgsql.
- User-level RLS on the app's own queries arrives only after the Auth cutover, which delays the user's goal 2.
- The Phase 3a moment exposes PostgREST to every user at once, and rollback after 3b is hard.

Highest effort and risk.

## Grafts taken from the runners-up

- From A: never use column-limited INSERT grants, because Drizzle's buildInsertQuery lists every column and emits `default` (dialect.js:356-392). Use table-level INSERT plus a policy WITH CHECK plus a small BEFORE INSERT trigger that pins server-owned columns (id, created_at, updated_at). Keep column-level grants only for UPDATE and for app_public SELECT.
- From A: a branded VerifiedIdentity type that only lib/auth/identity.ts can mint. It copies only sub/session_id, never user_metadata, never lets the token choose the DB role, and switches provider with AUTH_PROVIDER.
- From A: lazy pool creation (bundle-analysis CI builds with no env), and unwrapping DrizzleQueryError.cause to reach postgres-js code and hint (verified at node_modules/drizzle-orm/errors.js:10-18).
- From A: after the id remap, add a uuid-format CHECK on users.id so any stale Clerk id written back fails loudly through the FKs.
- From A: Paddle hardening. private.paddle_events idempotency, rethrow instead of swallowing (process-webhook.ts:44-50), link by customData.user_id at checkout.
- From A: narrow the Brevo trigger to UPDATE OF email, name, plan_id, customer_id, and disable that named trigger (never ALL) during the remap.
- From A: a PROD-ref guard in e2e cleanup and in migration/remap scripts, a pool-leak test with max:1, a lint-independent import-graph architecture test, and a real PostgREST perimeter test with a real user JWT.
- From A and C: disable Supabase Auth sign-ups and anonymous sign-ins on TEST and PROD until cutover, and never configure the Clerk third-party provider.
- From A: use getClaims() for normal requests and getUser() for sensitive operations (account deletion, credential changes, billing portal); signOut scope 'local'; add a Sentry cookie denylist before the first sb-* cookie exists.
- From C: use the global `alter default privileges for role postgres revoke execute on functions from public` (no IN SCHEMA) plus explicit per-function REVOKEs. Verified on TEST that no global entry exists, so the schema-scoped form used by A and B would not work.
- From C: server-authoritative continuation metering in the DB. A continuation is free only if a charged, unrefunded turn for the same user and catalogue exists that is younger than 15 minutes and has fewer than 9 continuations; otherwise charge a new turn. This needs no client-supplied token.
- From C: prompts/ocr catalogue FK changes to ON DELETE SET NULL (keep the FK), a refunded_at flag instead of deleting ledger rows, and a server-only refund with a narrow window.
- From C: jsonb size CHECK constraints (content, colors, config, cookie_preferences) and a catalogues.status CHECK constraint.
- From C: Redis draft cache only behind a DB ownership proof. Env-prefixed keys with a TTL, createdBy stripped on write, and id/name/status/createdBy overlaid from the DB row on read. Redis keys and revalidation always use names from DB-returned rows.
- From C: validate body.catalogue.name === body.catalogueName in the agent route, and the curl-abuse table turned into an acceptance test (every table and RPC gives 401/403/42501 for the publishable key with and without a user JWT).
- From C and A: the escape hatch. If a future browser, Realtime or Storage feature needs direct table access, grant `authenticated` on that one table only after its non-ownership rules are moved into DB triggers or definer functions (A's recipe), and reuse private.current_user_id() in its policies.

## Decision (as written by the judge)


**Status:** decided. Proposal B (private app roles) with grafts from A and C.

**Scope:**
- How quicktalog-app reads and writes Postgres with user-level RLS, during the Clerk period and after the move to Supabase Auth.
- Which credential each path uses.
- How rules that aren't row ownership are protected.

**Evidence labels:**
- `file:line` refers to quicktalog-app on branch `test` unless prefixed.
- "TEST" means verified with read-only SELECTs on `imhinsgyzzyblghwnedk`.
- "(unverified)" marks anything nobody checked.

---

## 0. The decision in one paragraph

All application data goes through **Drizzle over the Supavisor transaction pooler (6543)**, inside short transactions that switch into one of two private roles:
- **`app_user`** for signed-in requests
- **`app_public`** for visitors, ISR and public signups

Both are `NOLOGIN NOINHERIT NOBYPASSRLS`. The PostgREST login role `authenticator` is **not** a member of either, so no JWT can reach them. Policies are written `TO app_user` / `TO app_public` and read identity from `private.current_user_id()`, which returns the `sub` the server verified and put in `request.jwt.claims`. That is the Clerk id today and the Supabase `auth.users.id` (as text) after cutover, so **policies do not change at cutover**. `anon` and `authenticated` keep **zero** privileges in `public`: the Data API answers 42501 for every table even with a valid Supabase user JWT. That is why rules beyond ownership (plan limits, status transitions, branding) can stay in TypeScript, where `tiers` already lives. The structural invariants that must hold even if app code has bugs live in the DB: column UPDATE grants, WITH CHECK, CHECK constraints, unique indexes, and append-only ledgers written by SECURITY DEFINER functions.

Everything else:
- **supabase-js:** Supabase Auth only (SSR cookie client, middleware, browser auth client), plus a secret-key client used only for `auth.admin.*`.
- **Webhooks, provisioning, e2e cleanup:** a separately credentialed Drizzle admin client (`postgres`, BYPASSRLS) that only an allowlist of modules may import.
- **Worker:** keeps `service_role` over PostgREST.
- **End state:** user traffic logs in as a dedicated `app_rls` login role with no grants of its own, so a forgotten wrapper fails closed with 42501.

---

## 1. Correcting the "ORM only / supabase client / hybrid" framing

The three options choose a client library. Security actually depends on four other decisions, and two premises behind the options are wrong for this codebase.

1. **Every viable option is a hybrid.**
   - The Paddle webhook, user provisioning, account deletion (`auth.admin.deleteUser` needs the secret key), e2e cleanup and the Cloudflare worker (`../quicktalog-backend/src/lib/supabase.ts:4-8`, service_role) have no end user, so they must bypass RLS whatever you pick.
   - Supabase Auth itself is only reachable through supabase-js.
   - "ORM only" is therefore impossible. The real question is how **user and visitor** traffic reaches Postgres.
2. **"ORM only via DB_CONNECTION_STRING" is today's state, and it means no RLS at all.**
   - `utils/drizzle.ts:7` connects as `postgres`, which has `rolbypassrls = true` on TEST.
   - Enabling RLS changes nothing for the 39 Drizzle references until each request switches to a non-bypass role inside a transaction.
3. **Keys are not access paths.**
   - The publishable key acts as `anon`, or as `authenticated` when a user JWT is attached. Its power is exactly the grants and policies of those roles.
   - The secret key acts as `service_role` (BYPASSRLS). It is as powerful as `DB_CONNECTION_STRING`, just over HTTP.
4. **Avoiding supabase-js does not avoid the Data API.**
   - After the move to Supabase Auth, every signed-in user holds a JWT that PostgREST accepts together with the public publishable key.
   - Anything granted to `authenticated` becomes a public API for every user, **whichever library the app uses**. A Drizzle wrapper that switches into `authenticated` inherits the same exposure.
   - The boundary is grants, policies, exposed schemas and role reachability, not the client library.

The decisions that matter, and the answer:

| Decision | Answer |
|---|---|
| Who issues identity | Clerk now, Supabase Auth after cutover. Postgres only ever sees a `sub` the server has verified. |
| DB role for user and visitor traffic | Private `app_user` / `app_public`, reachable only by SET ROLE from the server's DB connection. |
| Transport for user and visitor traffic | Drizzle over Supavisor 6543, `prepare:false`, one short transaction per server action. |
| What the public Data API reaches | Nothing in `public` for `anon`/`authenticated`. The worker keeps `service_role`. |
| Where non-ownership rules live | TypeScript in the same DB transaction (single source: `tiers`), backed by DB structural invariants. |

So the answer is **"hybrid by library, single path by data":**
- supabase-js for Auth
- Drizzle for all app data
- a Drizzle admin client for system writes
- the secret key only for `auth.admin`
- service_role only for the worker

---

## 2. Target state at a glance

| Caller | Credential (env) | Postgres role | Module |
|---|---|---|---|
| Signed-in server action, route handler or RSC | `DB_CONNECTION_STRING` | `app_user` (SET ROLE per tx) | `withUser` in `utils/db/rls.ts` |
| Visitor, ISR, sitemap, public signup | `DB_CONNECTION_STRING` | `app_public` (SET ROLE per tx) | `withPublic` in `utils/db/rls.ts` |
| Paddle webhook, Clerk webhook (until removed), provisioning, e2e cleanup, scripts | `DATABASE_ADMIN_URL` | `postgres` (BYPASSRLS) | `asAdmin` in `utils/db/admin.ts` |
| Account deletion, identity import, optional session bridge | `SUPABASE_SECRET_KEY` | `service_role` via GoTrue admin API only | `authAdmin` in `utils/supabase/auth-admin.ts` |
| Auth UI, middleware, session refresh | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | GoTrue only; `.from()`/`.rpc()` are banned | `utils/supabase/{server,middleware,client}.ts` |
| Cloudflare worker | worker `SUPABASE_SECRET_KEY` (`sb_secret_`) | `service_role` via PostgREST | `../quicktalog-backend` (unchanged) |
| Anyone else via `/rest/v1` or `/graphql/v1` | publishable key, with or without a user JWT | `anon` / `authenticated` | zero grants, so 42501 |

---

## 3. Postgres roles (exact)

| Role | Attributes | Member of (SET option) | Purpose |
|---|---|---|---|
| `app_user` | NOLOGIN NOINHERIT NOBYPASSRLS | none | Policies and grants for signed-in owners |
| `app_public` | NOLOGIN NOINHERIT NOBYPASSRLS | none | Visitor grants (active catalogues, signup functions) |
| `postgres` (exists) | LOGIN, BYPASSRLS, CREATEROLE | gets `app_user`, `app_public` WITH INHERIT FALSE, SET TRUE | Phases 1-3 user pool (SET ROLE), admin pool, migrations |
| `app_rls` (M3) | LOGIN NOINHERIT NOBYPASSRLS NOCREATEDB NOCREATEROLE, CONNECTION LIMIT 40 | `app_user`, `app_public` WITH INHERIT FALSE, SET TRUE | End-state `DB_CONNECTION_STRING` user. Has no table grants of its own, so forgetting the wrapper gives 42501. |
| `anon`, `authenticated` | Supabase defaults | – | Zero grants in `public`, no USAGE on `private` |
| `service_role` | BYPASSRLS | – | Worker only |
| `authenticator` | Supabase | anon, authenticated, service_role only (TEST) | **Must never** be granted `app_user`/`app_public`. A pgTAP test asserts this. |

Why a private helper and not `auth.jwt()`:
- On TEST, schema `auth` ACL is `postgres=U/supabase_admin` with no grant option, so `postgres` cannot grant `auth` USAGE to custom roles.
- B's probe showed a non-auth role gets 42501 on `auth.jwt()`.
- The private helper also decouples policies from the auth provider.

Why this cannot be reached from outside:
- PostgREST, Realtime and Storage SET ROLE from `authenticator` (or their own admin roles), and none of them are members of the app roles (TEST `pg_auth_members`).
- `supautils.reserved_memberships` includes `authenticator`.

---

## 4. Credentials and environment layout

Vercel env vars can be scoped per environment (Production / Preview / Development), not per function. Import restrictions (§5.6) are what keep admin credentials out of user code.

| Variable | Vercel Production (PROD `uhfbapjuzvlyzyodxhqn`) | Vercel Preview / test.quicktalog.app (TEST `imhinsgyzzyblghwnedk`) | Local dev | CI (GitHub Actions) |
|---|---|---|---|---|
| `DB_CONNECTION_STRING` | Phases 1-3: `postgresql://postgres.<prod-ref>:<pw>@aws-…pooler.supabase.com:6543/postgres`. After M3: `app_rls.<prod-ref>` | same pattern, TEST ref and password | local stack `postgresql://postgres:postgres@127.0.0.1:54322/postgres` (or TEST) | local stack from `supabase start` |
| `DATABASE_ADMIN_URL` (new) | `postgres.<prod-ref>` on 6543 | `postgres.<test-ref>` on 6543 | local stack | local stack; e2e job uses TEST only |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_`, exists) | PROD | TEST | local or TEST | local |
| `SUPABASE_SECRET_KEY` (`sb_secret_`, new in the Auth phase, **never** `NEXT_PUBLIC_`) | PROD | TEST | local | local, plus TEST for e2e user seeding |
| `AUTH_PROVIDER` | `clerk`, then `supabase` at cutover | same, flipped first | either | matches the env under test |
| `REVALIDATE_SECRET` (new) | random | random | dev value | test value |
| `REDIS_KEY_PREFIX` (new) | `prod` | `test` | `dev-<name>` | `ci` |
| `CLERK_*`, `E2E_CLERK_*` | until Phase 7 | until Phase 7 | until Phase 7 | until Phase 7 |
| `MIGRATION_DATABASE_URL` | **not in Vercel**; operator machine only (session pooler 5432 or direct) | same | – | local stack |

Worker (`../quicktalog-backend/wrangler.jsonc`):
- `SUPABASE_URL` per env. **Fix the test env at :18/:28**, which points at `tpcfltcupcofteovrvmu`, to TEST.
- `SUPABASE_SECRET_KEY` (`sb_secret_`) replaces `SUPABASE_SERVICE_ROLE_KEY`.
- `REVALIDATE_SECRET` is shared with the app.

Vault:
- Rotate `service_role_key` to `sb_secret_` before disabling legacy keys (legacy keys end in late 2026).
- Parameterise the edge-function base URL per project; it is hard-coded to PROD today.

The `app_rls` password is set once per project in the SQL editor (`alter role app_rls with password '…'`). It is never committed and has no `VALID UNTIL` (an expired role gives EAUTHQUERY at the pooler). The local seed sets a dev password.

---

## 5. Modules (exact paths, exports, allowed importers)

`utils/drizzle.ts` is **deleted**. Every DB module starts with `import "server-only"`. Next.js aliases `server-only`. Add the `server-only` package to dependencies so vitest resolves it (whether Vitest needs the package is unverified).

### 5.1 `lib/auth/identity.ts`: the only producer of identity
```ts
import "server-only";
import { cache } from "react";

declare const verified: unique symbol;
export type VerifiedIdentity = Readonly<{
  userId: string;                 // equals public.users.id (Clerk "user_…" now, auth.users.id uuid string later)
  sessionId: string | null;
  provider: "clerk" | "supabase";
  [verified]: true;
}>;
export class UnauthorizedError extends Error { constructor() { super("Unauthorized"); } }

const CLERK_ID = /^user_[A-Za-z0-9]{10,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const mint = (v: { userId: string; sessionId: string | null; provider: "clerk" | "supabase" }) =>
  Object.freeze(v) as VerifiedIdentity;   // the only cast in the codebase that creates an identity

export const getVerifiedIdentity = cache(async (): Promise<VerifiedIdentity | null> => {
  if ((process.env.AUTH_PROVIDER ?? "clerk") === "clerk") {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId, sessionId } = await auth();        // verified by clerkMiddleware; no Backend API call (unlike currentUser())
    return userId && CLERK_ID.test(userId) ? mint({ userId, sessionId: sessionId ?? null, provider: "clerk" }) : null;
  }
  const { createClient } = await import("@/utils/supabase/server");
  const { data, error } = await (await createClient()).auth.getClaims();   // local ES256 verify via JWKS
  const c = data?.claims;
  if (error || !c || c.role !== "authenticated" || c.is_anonymous === true || typeof c.sub !== "string" || !UUID.test(c.sub)) return null;
  return mint({ userId: c.sub, sessionId: typeof c.session_id === "string" ? c.session_id : null, provider: "supabase" });
});

export async function requireIdentity(): Promise<VerifiedIdentity> {
  const me = await getVerifiedIdentity();
  if (!me) throw new UnauthorizedError();
  return me;
}

/** Sensitive operations only (delete account, email/password change, billing portal): server round trip that sees bans and deletions. */
export async function requireFreshUser(): Promise<VerifiedIdentity & { email: string | null }>;
// Supabase: supabase.auth.getUser(); Clerk phase: auth() + clerkClient().users.getUser(userId).
```
Rules:
- Never copy `user_metadata`/`app_metadata` into claims.
- Never let a token pick a role.
- Never call `getSession()` for authorization.
- Only this file may import `@clerk/nextjs/server` for identity. (`app/api/clerk`, `update-consent` and UI components keep their own Clerk imports until Phase 7.)

### 5.2 `utils/db/pool.ts` (internal: only `rls.ts` and `admin.ts` may import it)
```ts
import "server-only";
import { schema } from "@quicktalog/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function make(url: string | undefined, envName: string, max: number) {
  if (!url) throw new Error(`${envName} is not set`);          // lazy: CI bundle-analysis builds without env
  return drizzle(postgres(url, { prepare: false, max, idle_timeout: 5, max_lifetime: 600, connect_timeout: 10 }), { schema });
}
type Db = ReturnType<typeof make>;
let userDb: Db | undefined;
let adminDb: Db | undefined;
export const getUserDb = () => (userDb ??= make(process.env.DB_CONNECTION_STRING, "DB_CONNECTION_STRING", 3));
export const getAdminDb = () => (adminDb ??= make(process.env.DATABASE_ADMIN_URL, "DATABASE_ADMIN_URL", 2));
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
```

### 5.3 `utils/db/rls.ts`: the only way user and visitor traffic touches the DB
```ts
import "server-only";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { getUserDb, type Tx } from "./pool";

type AppRole = "app_user" | "app_public";
const LIMITS = {
  app_user:   { statement: "8s", lock: "3s", idle: "10s" },
  app_public: { statement: "3s", lock: "1s", idle: "5s" },
} as const;   // SET ROLE does not apply ALTER ROLE settings (TEST probe), so set them per transaction

async function inRole<T>(role: AppRole, claims: { sub?: string; session_id?: string }, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (role !== "app_user" && role !== "app_public") throw new Error("invalid app role");   // never from input
  const l = LIMITS[role];
  return getUserDb().transaction(async (tx) => {
    // ONE statement, bound parameters (no sql.raw), all transaction-local (is_local = true).
    await tx.execute(sql`select
      pg_catalog.set_config('role', ${role}, true),
      pg_catalog.set_config('request.jwt.claims', ${JSON.stringify({ ...claims, role })}, true),
      pg_catalog.set_config('statement_timeout', ${l.statement}, true),
      pg_catalog.set_config('lock_timeout', ${l.lock}, true),
      pg_catalog.set_config('idle_in_transaction_session_timeout', ${l.idle}, true)`);
    return fn(tx);
  });   // no finally/reset: COMMIT/ROLLBACK discards local settings; a reset in an aborted tx throws 25P02
}

/** Signed-in owner. One block per server action. Never hold it across Redis, fetch, revalidate*, model calls or streaming. */
export function withUser<T>(me: VerifiedIdentity, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inRole("app_user", { sub: me.userId, ...(me.sessionId ? { session_id: me.sessionId } : {}) }, fn);
}
/** Visitor, build, ISR, public signups. Takes no identity and must never read cookies. */
export function withPublic<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inRole("app_public", {}, fn);
}
export type { Tx };
```
`utils/db/index.ts` re-exports only `withUser`, `withPublic`, `Tx`, plus the helpers from `errors.ts` and `columns.ts`.

### 5.4 `utils/db/admin.ts` (BYPASSRLS, allowlisted)
```ts
import "server-only";
import { sql } from "drizzle-orm";
import { getAdminDb, type Tx } from "./pool";
export async function asAdmin<T>(op: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return getAdminDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_catalog.set_config('statement_timeout', '15s', true),
                                pg_catalog.set_config('application_name', ${`admin:${op}`}, true)`);
    return fn(tx);
  });
}
```
`utils/db/private-schema.ts` holds the Drizzle `pgSchema("private")` definitions used only by admin code (`private.paddle_events`).

### 5.5 Other modules
| Path | Exports | Notes |
|---|---|---|
| `utils/db/errors.ts` | `pgError(e: unknown): { code?: string; constraint?: string; hint?: string } \| null`, `isUniqueViolation(e)`, `isPermissionDenied(e)` | Walks `.cause`: drizzle-orm 0.45 wraps postgres-js errors in `DrizzleQueryError` with `.cause` (verified at `node_modules/drizzle-orm/errors.js:10-18`). |
| `utils/db/columns.ts` | `PUBLIC_CATALOGUE_COLUMNS` (Drizzle select object: every catalogues column **except** `createdBy`), `CATALOGUE_EDITABLE_FIELDS = ["logo","heading","language","currency","businessType","content","legal","appearance","contact","header","footer","partners","metadata","tags"] as const`, `pickEditable(input)` | Must match the SQL column grants (§8, a test enforces this). |
| `utils/supabase/server.ts` | `createClient()` via `createServerClient` (getAll/setAll) | **Remove `"use server"`** (line 1), add `import "server-only"`. Auth only. |
| `utils/supabase/middleware.ts` | `updateSession(request)` | Supabase Auth phase (§12). |
| `utils/supabase/client.ts` | `createBrowserClient` | Auth only (sign-in forms, `onAuthStateChange`). |
| `utils/supabase/auth-admin.ts` | `authAdmin()` returns `createClient(URL, SUPABASE_SECRET_KEY, {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}}).auth.admin` | Returns only `.auth.admin`, so `.from()` cannot be called on it. |
| `lib/entitlements/plan.ts` | `getPlanForUpdate(tx: Tx, me): Promise<{ planId: string; tier: Tier; features: TierFeatures }>` | `select … from users where id = me.userId for update` (app_user holds UPDATE(name, cookie_preferences), so FOR UPDATE is permitted). Maps `plan_id` to `tiers` from `@quicktalog/common`. **Throws on an unknown plan_id (fail closed).** |
| `lib/entitlements/catalogue.ts` | `assertCatalogueQuota(tx, me, features)`, `applyPlanToCatalogue(input, features)` (forces header/footer `type:'default'` without branding, `footer.newsletter=false` without newsletter), `assertContentWithinPlan(features, before, after)` (reuses the counting in `helpers/catalogueOperations.ts:41-71`; growth-only so grandfathered rows stay editable), `assertCanActivate(tx, me, features)` (sum of this month's `analytics.pageview_count` vs `traffic_limit`) | Throws `PlanLimitError { limit: "catalogues" \| "sections" \| "items" \| "section_type" \| "traffic" }`. |
| `lib/ai/metering.ts` | `beginAiTurn(tx, me, { catalogue, limit, continuation }): Promise<{ outcome: "charged" \| "continued" \| "limit" \| "not_found"; turnId: string \| null }>`, `refundAiTurn(tx, me, turnId)` | Wraps `private.begin_ai_turn` / `private.refund_ai_turn`. |
| `lib/catalogue/public.ts` | `getPublicCatalogue(name)`, `getPublicCatalogueMeta(name)`, `listPublicCatalogueNames()` | `withPublic` + `PUBLIC_CATALOGUE_COLUMNS` + `eq(status,'active')`. |
| `lib/catalogue/draft-cache.ts` | `draftKey(name)`, `readOwnedDraft(tx, me, name)`, `writeOwnedDraft(row)`, `deleteDrafts(names)` | §11. |
| `lib/themes/upsert.ts` | `upsertTheme(tx, name, colors)` | Replaces the exported `persistTheme(userId,…)` in `actions/themes.ts:37`. `user_id` comes from the claims via the policy and is passed as `me.userId`. |
| `lib/users/my-user-data.ts` | `getMyUserData(tx, me)` | Replaces `lib/users/fetchUserData.ts`. `users` row + `private.my_usage()`. |
| `lib/users/provision.ts` | `ensureUserRow(me, profile)` via `asAdmin`, `insert … on conflict (id) do nothing` | Clerk phase only; deleted at cutover. |

### 5.6 Guardrails
- **`biome.json`** (Biome 2.2.6; `noRestrictedImports` is in the `style` group; overrides use `includes`). The exact glob semantics of `includes` are unverified; confirm with `biome lint`.
```json
"linter": { "rules": { "style": { "noRestrictedImports": { "level": "error", "options": { "paths": {
  "@/utils/drizzle": "Removed. Use withUser/withPublic from @/utils/db.",
  "@/utils/db/admin": "BYPASSRLS. Only webhooks, provisioning, scripts and tests. Use withUser/withPublic.",
  "@/utils/db/pool": "Internal to utils/db.",
  "@/utils/supabase/auth-admin": "Secret key. Only account deletion, identity import and tests.",
  "postgres": "Use @/utils/db.",
  "drizzle-orm/postgres-js": "Use @/utils/db."
} } } } } },
"overrides": [
  { "includes": ["utils/db/**", "utils/paddle/**", "app/api/paddle/**", "app/api/clerk/**", "lib/users/provision.ts", "actions/account.ts", "scripts/**", "tests/**"],
    "linter": { "rules": { "style": { "noRestrictedImports": "off" } } } }
]
```
- **`tests/unit/architecture/db-boundaries.test.ts`** (independent of lint) walks imports and fails when:
  - `@/utils/db/admin` is imported outside `utils/paddle/**`, `app/api/paddle/**`, `app/api/clerk/**`, `lib/users/provision.ts`, `scripts/**`, `tests/**`
  - `@/utils/supabase/auth-admin` is imported outside `actions/account.ts`, `app/auth/bridge/route.ts` (optional), `scripts/**`, `tests/**`
  - `set_config(` or `SET ROLE` appears outside `utils/db/rls.ts` / `utils/db/admin.ts`
  - `sql.raw(` appears anywhere under `actions`, `app`, `lib`, `utils`, `agent`, `helpers`
  - supabase-js `.from(` or `.rpc(` appears anywhere in the app
- **`.claude/skills/server-action-and-route/SKILL.md`** is updated to prescribe `requireIdentity()` + `withUser`.

---

## 6. Which path each call-site category must use

| Category | Call sites (today) | Required path | Rules |
|---|---|---|---|
| **Owner reads/writes** | `actions/catalogue.ts` (deleteItem :41-62, deleteMultipleItems :64-88, updateItemStatus :90-130, duplicateItem :132-175, createCatalogue :177-239, updateCatalogue :241-282, publishCatalogue :323-365); `actions/themes.ts:11-101`; `actions/qr-configs.ts:8-72`; `actions/users.ts:9-39`; `lib/users/fetchUserData.ts:36-160`; `app/api/dashboard/{catalogues,newsletter,analytics}/route.ts`; `app/admin/[name]/{builder,qr-editor,analytics}/page.tsx`; `app/api/update-consent/route.ts` (after cutover) | `const me = await requireIdentity()`, then **one** `withUser(me, tx => …)` | Keep explicit `created_by = me.userId` filters. Read `.returning()` lengths, because RLS-blocked UPDATE/DELETE affect 0 rows silently. Business rules run through `lib/entitlements/*` **inside the same transaction**. Redis, `revalidate*` and emails run **after** commit, with names taken from DB-returned rows. |
| **Public reads** | `app/api/items/route.ts:6-53`, `app/api/items/[name]/route.ts`, `app/catalogues/[name]/page.tsx:14,52,113`, `app/sitemap.ts:11` | `lib/catalogue/public.ts` (`withPublic`) | Never read cookies or identity. Always use `PUBLIC_CATALOGUE_COLUMNS` (`select *` / `findFirst` without `columns` gives 42501 because `created_by` is not granted). `?status` is no longer caller-controlled. A missing row returns 404, not a `.single()` 500. |
| **Public writes** | `actions/newsletter.ts:19-87` (callers `components/catalogue/view/CatalogueFooter.tsx:42-46`, `components/navigation/Footer.tsx:31`) | IP rate limit (`@upstash/ratelimit`, new dependency), then `withPublic` → `private.subscribe_catalogue_newsletter` / `private.subscribe_product_newsletter` | The `ownerId` parameter is removed. The same `success` response is returned for new, existing and ineligible signups. |
| **Cross-tenant fixed-shape checks** | slug checks `actions/catalogue.ts:151,187`; `hooks/useCatalogueName.ts:91` (downloads every slug today) | New server action `checkCatalogueName(name)`: `requireIdentity` + rate limit + `withUser` → `private.catalogue_name_available` | The unique index `catalogues_new_name_key` stays the final guard. Map 23505 to "name taken"; duplicate retries with the next suffix. |
| **Editor draft cache (Redis)** | `app/admin/[name]/builder/page.tsx:11-21`, `qr-editor/page.tsx:16-26`, `app/catalogues/[name]/preview/page.tsx:14-42`, `getCatalogueByName` `actions/catalogue.ts:284-321`, `components/dashboard/components/DashboardItem.tsx:35-62` | `readOwnedDraft(tx, me, name)` inside `withUser` | `getCatalogueByName` is **replaced** by `getOwnedCatalogueForEditor(name)`. Preview requires sign-in and ownership. Redis `createdBy` is never trusted. |
| **AI agent / AI assist** | `app/api/agent/route.ts:40-131`, `actions/ai.ts:29-66`, `lib/ai/access.ts`, `agent/session.ts:68-90`, `agent/tools.ts:425-433` | Identity before streaming, then short `withUser` blocks (§10) | Never call `cookies()`/`auth()` in tool `execute` or `onFinish`. |
| **Billing webhook** | `utils/paddle/process-webhook.ts:22-243`, `app/api/paddle/route.ts` | `asAdmin("paddle:<event>", tx => …)`, one tx per event | Idempotency row in `private.paddle_events`. **Rethrow** (today errors are swallowed at :44-50) so Paddle retries. Link users by `customData.user_id` from checkout (`components/home/Pricing/PricingColumn.tsx:141-146`) instead of by email (:219-223). |
| **Clerk webhook and provisioning (Clerk phase only)** | `app/api/clerk/route.ts`, `lib/users/syncFromClerk.ts:94-195`, `actions/users.ts:75-101`, on-demand sync `lib/users/fetchUserData.ts:46-74` | `asAdmin` | The upsert **never** overwrites `plan_id`/`customer_id` (`on conflict (id) do update set email, name, image` only). Deleted at cutover and replaced by `auth.users` triggers (M4). |
| **Account deletion (Supabase phase)** | new `actions/account.ts` | `requireFreshUser()`, then `authAdmin().deleteUser(me.userId)` | The `auth.users` delete trigger removes `public.users`, and FK cascades remove the rest. Then `deleteDrafts(names)` and revalidate. |
| **Worker** | `../quicktalog-backend` | service_role over PostgREST | `subscriptionProcessingJob.ts:29` stops calling `/api/users/{id}` and computes the catalogue count and monthly analytics sum itself. **Delete `app/api/users/[id]/route.ts`.** `/api/revalidate` requires the `x-revalidate-secret` header (`app/api/revalidate/route.ts:5`; worker helper `src/helpers/index.ts:2`). |
| **Tests and scripts** | `tests/e2e/helpers/cleanup.ts:12-55`, `scripts/**` | `DATABASE_ADMIN_URL` (raw postgres or `asAdmin`) | Throw if the connection string or `NEXT_PUBLIC_SUPABASE_URL` contains `uhfbapjuzvlyzyodxhqn` unless `ALLOW_PROD=1`. |

Conversion notes that change behaviour:
- **Arguments removed:**
  - `getUserData(userId?)` becomes `getUserData()`; update the caller `context/UserContext.tsx:36`.
  - `updateItemStatus(id, status, name)` loses `name`; the Redis key and revalidation use the name returned by the UPDATE.
  - `createCatalogue(…, branding)` loses `branding`; the plan decides (`hooks/useCreateCatalogue.ts:22-25`).
  - `newsletterSignup(email, catalogueId, ownerId)` loses `ownerId`.
- **Owner-write actions:**
  - `publishCatalogue` / `updateCatalogue` / `createCatalogue` write only `pickEditable(sanitizeAppearance(input))`. Any attempt to set `createdBy`/`id`/`name` fails with 42501 from the column grants instead of mass-assigning (`actions/catalogue.ts:337-347`).
  - `duplicateItem` and `createCatalogue` insert with `status: "draft"`.
  - `context/CatalogueContext.tsx:284-290` stops stamping `createdBy`.
- **Upserts and dashboard routes:**
  - `upsertQrConfig` becomes `insert … onConflictDoUpdate({ target: qrConfigs.catalogue, set: { config, updatedAt } })`.
  - Theme saves become `onConflictDoUpdate` on `(user_id, name)`.
  - Dashboard routes return 401 when `getVerifiedIdentity()` is null (today they 500 by destructuring null at `app/api/dashboard/catalogues/route.ts:12`).
  - `app/admin/[name]/analytics/page.tsx:41-57` verifies ownership with `withUser` before querying PostHog and escapes `name` in HogQL.

---

## 7. How policies read identity, and why they survive the cutover unchanged

```sql
create or replace function private.current_user_id() returns text
language sql stable set search_path = ''
as $$ select nullif((nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb) ->> 'sub', '') $$;
revoke all on function private.current_user_id() from public;
grant execute on function private.current_user_id() to app_user;
```
- Every policy uses `(select private.current_user_id())`. The subquery wrapper gives an initPlan evaluated once per statement. Advisor lint 0003 does not recognise this helper, so the wrapper is mandatory by code review.
- Ownership columns stay `text`: `users.id`, `catalogues.created_by`, `analytics.user_id`, `newsletter.owner_id`, `ocr.user_id`, `prompts.user_id`, `user_themes.user_id`.
- **Clerk phase:** `withUser` puts the Clerk `user_…` id in `sub`. **After the remap:** it puts the `auth.users.id` uuid string. The policy text, the grants and the roles are identical in both phases. Only `AUTH_PROVIDER` and the data remap (M5) change at cutover.
- `auth.uid()` is never used. It casts to uuid and throws 22P02 on Clerk ids (TEST).
- The helper reads the same GUC PostgREST sets. If a table is ever deliberately opened to `authenticated` (§16 escape hatch), its policies can reuse the same helper after `grant usage on schema private to authenticated` and EXECUTE on the helper.

---

## 8. Database objects (all in `supabase/migrations/*.sql`; never drizzle-kit)

**General rules for these migrations:**
- Roles are cluster-global, so role creation uses `IF NOT EXISTS`.
- Constraint names marked (unverified) must first be read from `pg_constraint` on TEST, and by the user on PROD.
- After each migration: regenerate `@quicktalog/common` with `drizzle-kit pull`, strip `pgPolicy` (the stale policy at `../quicktalog-packages/src/drizzle/migrations/schema.ts:35`), and release.
- Fix or delete both `drizzle.config.ts` files so nobody runs push/generate.

### M1 `<ts>_app_roles_rls_foundation.sql`: additive, safe while Clerk and today's code are live
```sql
-- 1. Roles
do $$ begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_user') then
    create role app_user nologin noinherit nobypassrls; end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_public') then
    create role app_public nologin noinherit nobypassrls; end if;
end $$;
-- postgres (CREATEROLE) holds ADMIN OPTION on roles it creates (PG16+, createrole_self_grant='' on TEST).
-- PG docs: that user can GRANT itself the membership. INHERIT must be stated (it would default to true).
grant app_user   to postgres with inherit false, set true;
grant app_public to postgres with inherit false, set true;
-- Fallback if the GRANT is refused on some project: `set local createrole_self_grant = 'set';` before CREATE ROLE (unverified need).

-- 2. Private schema (NOT in the Data API exposed schemas; anon/authenticated get no USAGE)
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to app_user, app_public;
-- GLOBAL form: TEST has no global pg_default_acl entry for postgres functions, and per-schema defaults cannot remove the hard-wired PUBLIC EXECUTE.
alter default privileges for role postgres revoke execute on functions from public;

-- 3. Identity helper: see §7

-- 4. Table privileges for app roles (anon/authenticated are untouched until M2)
grant select on public.users to app_user;
grant update (name, cookie_preferences) on public.users to app_user;        -- never id, email, plan_id, customer_id, consents, image

grant select, insert, delete on public.catalogues to app_user;              -- INSERT stays table-level: Drizzle lists every column
grant update (logo, heading, status, language, currency, business_type, content, legal, appearance,
              contact, header, footer, partners, metadata, tags, updated_at) on public.catalogues to app_user;   -- no id, name, created_by, created_at, source
grant select (id, name, logo, heading, status, source, language, currency, business_type, content, legal,
              appearance, contact, header, footer, partners, metadata, tags, created_at, updated_at)
  on public.catalogues to app_public;                                        -- created_by withheld

grant select, insert, delete on public.qr_configs to app_user;
grant update (config, updated_at) on public.qr_configs to app_user;
grant select, insert, delete on public.user_themes to app_user;
grant update (name, colors, updated_at) on public.user_themes to app_user;
grant select on public.analytics, public.prompts, public.ocr, public.newsletter to app_user;   -- read-only; ledger writes via definer functions
-- No app-role privileges at all on: subscriptions, plans, job_logs, product_newsletter, views contacts / active_subscriptions.

-- 5. Policies (one per role+command; all TO an app role)
create policy users_select_self on public.users for select to app_user using (id = (select private.current_user_id()));
create policy users_update_self on public.users for update to app_user
  using (id = (select private.current_user_id())) with check (id = (select private.current_user_id()));

create policy catalogues_select_owner on public.catalogues for select to app_user
  using (created_by = (select private.current_user_id()));                 -- app_user does NOT see others' active rows, so "row returned" means "owned"
create policy catalogues_insert_owner on public.catalogues for insert to app_user
  with check (created_by = (select private.current_user_id()) and status in ('draft', 'in preparation'));
create policy catalogues_update_owner on public.catalogues for update to app_user
  using (created_by = (select private.current_user_id())) with check (created_by = (select private.current_user_id()));
create policy catalogues_delete_owner on public.catalogues for delete to app_user
  using (created_by = (select private.current_user_id()));
create policy catalogues_select_public on public.catalogues for select to app_public using (status = 'active');

create policy qr_configs_owner on public.qr_configs for all to app_user
  using      (catalogue in (select c.name from public.catalogues c where c.created_by = (select private.current_user_id())))
  with check (catalogue in (select c.name from public.catalogues c where c.created_by = (select private.current_user_id())));
create policy user_themes_owner on public.user_themes for all to app_user
  using (user_id = (select private.current_user_id())) with check (user_id = (select private.current_user_id()));
create policy analytics_select_owner  on public.analytics  for select to app_user using (user_id  = (select private.current_user_id()));
create policy prompts_select_owner    on public.prompts    for select to app_user using (user_id  = (select private.current_user_id()));
create policy ocr_select_owner        on public.ocr        for select to app_user using (user_id  = (select private.current_user_id()));
create policy newsletter_select_owner on public.newsletter for select to app_user using (owner_id = (select private.current_user_id()));

-- 6. Server-owned columns
create or replace function private.catalogues_pin_insert() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'app_user' then
    new.id := gen_random_uuid(); new.created_at := now(); new.updated_at := now();
  end if;
  return new;
end $$;
create or replace function private.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
revoke all on function private.catalogues_pin_insert(), private.touch_updated_at() from public;
grant execute on function private.catalogues_pin_insert(), private.touch_updated_at() to app_user;  -- harmless; avoids relying on fire-time ACL behaviour
create trigger catalogues_pin_insert before insert on public.catalogues for each row execute function private.catalogues_pin_insert();
create trigger catalogues_touch_updated_at  before update on public.catalogues  for each row execute function private.touch_updated_at();
create trigger qr_configs_touch_updated_at  before update on public.qr_configs  for each row execute function private.touch_updated_at();
create trigger user_themes_touch_updated_at before update on public.user_themes for each row execute function private.touch_updated_at();

-- 7. Structural invariants (dedupe/audit first; NOT VALID + VALIDATE so PROD data problems surface separately)
alter table public.catalogues add constraint catalogues_status_check
  check (status in ('active','inactive','draft','in preparation','error')) not valid;
alter table public.catalogues validate constraint catalogues_status_check;
alter table public.catalogues  add constraint catalogues_content_size check (pg_column_size(content) < 1048576) not valid;   -- limit is a product decision
alter table public.user_themes add constraint user_themes_colors_size check (pg_column_size(colors) < 4096) not valid;
alter table public.qr_configs  add constraint qr_configs_config_size  check (pg_column_size(config) < 65536) not valid;
alter table public.users       add constraint users_cookie_prefs_size check (cookie_preferences is null or pg_column_size(cookie_preferences) < 2048) not valid;
-- dedupe (keep one row per key), then:
create unique index if not exists qr_configs_catalogue_key         on public.qr_configs (catalogue);
create unique index if not exists newsletter_catalogue_email_key   on public.newsletter (catalogue_id, lower(email));
create unique index if not exists product_newsletter_email_key     on public.product_newsletter (lower(email));

-- 8. AI ledger integrity
alter table public.prompts drop constraint if exists prompts_service_catalogue_key;             -- verified on TEST; breaks metering
alter table public.prompts drop constraint prompts_catalogue_fkey;                               -- actual name (unverified)
alter table public.prompts alter column catalogue drop not null;
alter table public.prompts add constraint prompts_catalogue_fkey foreign key (catalogue)
  references public.catalogues(name) on update cascade on delete set null;                       -- deleting a catalogue no longer resets quota
delete from public.prompts where user_id is null;                                                -- count on PROD first
alter table public.prompts alter column user_id set not null;
alter table public.prompts add column if not exists turn_id uuid,
  add column if not exists continuations integer not null default 0,
  add column if not exists refunded_at timestamptz;
create unique index if not exists prompts_turn_id_key on public.prompts (turn_id);
create index if not exists prompts_user_datetime_idx on public.prompts (user_id, datetime);
-- same FK change (ON DELETE SET NULL, catalogue nullable) and user_id NOT NULL for public.ocr

-- 9. Narrow SECURITY DEFINER entry points (owner postgres; unreachable from PostgREST: private is not exposed and anon/authenticated lack USAGE)
create or replace function private.catalogue_name_available(p_name text) returns boolean
language sql stable security definer set search_path = ''
as $$ select private.current_user_id() is not null and not exists (select 1 from public.catalogues c where c.name = p_name) $$;

create or replace function private.subscribe_catalogue_newsletter(p_catalogue_id uuid, p_email text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email)); v_owner text;
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
  select c.created_by into v_owner from public.catalogues c
   where c.id = p_catalogue_id and c.status = 'active'
     and coalesce((c.footer ->> 'newsletter')::boolean, false);        -- Footer.newsletter: boolean (common types/catalogue.d.ts:122-126)
  if v_owner is null then return; end if;                              -- silent: no oracle
  insert into public.newsletter (email, catalogue_id, owner_id) values (v_email, p_catalogue_id, v_owner)
  on conflict (catalogue_id, lower(email)) do nothing;
end $$;

create or replace function private.subscribe_product_newsletter(p_email text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
  insert into public.product_newsletter (email) values (v_email) on conflict (lower(email)) do nothing;
end $$;

create or replace function private.my_usage()
returns table (catalogues bigint, prompts bigint, ocr bigint, pageviews bigint, unique_visitors bigint)
language sql stable security invoker set search_path = '' as $$      -- runs under app_user RLS; month bounds computed in SQL (fixes helpers/client.ts:21-23)
  with me as (select private.current_user_id() uid),
       m  as (select date_trunc('month', now()) s, date_trunc('month', now()) + interval '1 month' e)
  select (select count(*) from public.catalogues c, me where c.created_by = me.uid),
         (select count(*) from public.prompts p, me, m where p.user_id = me.uid and p.refunded_at is null and p.datetime >= m.s and p.datetime < m.e),
         (select count(*) from public.ocr o, me, m where o.user_id = me.uid and o.datetime >= m.s and o.datetime < m.e),
         (select coalesce(sum(a.pageview_count), 0)  from public.analytics a, me, m where a.user_id = me.uid and a.date >= m.s and a.date < m.e),
         (select coalesce(sum(a.unique_visitors), 0) from public.analytics a, me, m where a.user_id = me.uid and a.date >= m.s and a.date < m.e)
$$;

create or replace function private.begin_ai_turn(p_catalogue text, p_limit integer, p_continuation boolean)
returns table (outcome text, ai_turn_id uuid)
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid text := private.current_user_id(); v_used bigint; v_turn uuid;
begin
  if v_uid is null then raise exception 'no identity' using errcode = '42501'; end if;
  if not exists (select 1 from public.catalogues c where c.name = p_catalogue and c.created_by = v_uid) then
    return query select 'not_found'::text, null::uuid; return;
  end if;
  perform 1 from public.users u where u.id = v_uid for update;               -- serialises this user's charges (closes the race)
  if p_continuation then                                                    -- free only if a recent real turn exists (caps are product decisions)
    update public.prompts p set continuations = p.continuations + 1
     where p.id = (select p2.id from public.prompts p2
                    where p2.user_id = v_uid and p2.catalogue = p_catalogue and p2.refunded_at is null
                      and p2.datetime > now() - interval '15 minutes' and p2.continuations < 9
                    order by p2.datetime desc limit 1)
    returning p.turn_id into v_turn;
    if v_turn is not null then return query select 'continued'::text, v_turn; return; end if;
  end if;                                                                   -- forged/expired continuation falls through and is charged
  select count(*) into v_used from public.prompts p
   where p.user_id = v_uid and p.refunded_at is null and p.datetime >= date_trunc('month', now());
  if p_limit is not null and v_used >= p_limit then return query select 'limit'::text, null::uuid; return; end if;
  insert into public.prompts (user_id, catalogue, turn_id) values (v_uid, p_catalogue, gen_random_uuid())
  returning turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end $$;
-- p_limit comes from server code (tiers via users.plan_id read in the same tx). Acceptable because app_user is reachable only by the server.

create or replace function private.refund_ai_turn(p_turn_id uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
  with r as (update public.prompts set refunded_at = now()
              where turn_id = p_turn_id and user_id = private.current_user_id()
                and continuations = 0 and refunded_at is null and datetime > now() - interval '10 minutes'
              returning 1)
  select exists (select 1 from r)
$$;

revoke all on function private.catalogue_name_available(text), private.subscribe_catalogue_newsletter(uuid, text),
  private.subscribe_product_newsletter(text), private.my_usage(), private.begin_ai_turn(text, integer, boolean),
  private.refund_ai_turn(uuid) from public;
grant execute on function private.catalogue_name_available(text), private.my_usage(),
  private.begin_ai_turn(text, integer, boolean), private.refund_ai_turn(uuid) to app_user;
grant execute on function private.subscribe_catalogue_newsletter(uuid, text), private.subscribe_product_newsletter(text) to app_public, app_user;

-- 10. Paddle idempotency (admin only)
create table if not exists private.paddle_events (event_id text primary key, event_type text not null,
  occurred_at timestamptz not null, processed_at timestamptz not null default now());

-- 11. Brevo trigger: stop firing on every users UPDATE (copy the exact current definition via pg_get_triggerdef first)
drop trigger "Brevo New Contact Webhook" on public.users;
create trigger "Brevo New Contact Webhook" after insert or update of email, name, plan_id, customer_id on public.users
  for each row execute function public.call_edge_function_with_vault_secret('create-brevo-contact');

-- 12. RLS on tables no current anon path uses (postgres and service_role bypass, so nothing breaks)
alter table public.prompts enable row level security;
alter table public.ocr enable row level security;
alter table public.qr_configs enable row level security;
alter table public.user_themes enable row level security;
alter table public.product_newsletter enable row level security;
alter table public.plans enable row level security;
```

### M2 `<ts>_close_data_api.sql`
Apply only after the Drizzle-only code is deployed to that environment. On PROD this also requires `test` to be merged into `main` first, because main still ships anon-client routes.
```sql
alter table public.users         enable row level security;
alter table public.catalogues    enable row level security;
alter table public.analytics     enable row level security;
alter table public.newsletter    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.job_logs      enable row level security;
revoke all on all tables    in schema public from anon, authenticated;   -- includes the views contacts / active_subscriptions
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
drop function if exists public.get_pageview_totals(timestamptz, timestamptz);   -- errors with 42804 today; no callers on test
```
Exposed Data API schemas stay exactly `public, graphql_public`. `private` and `migration` are never added.

### M3 `<ts>_app_rls_login_role.sql`: fail-closed user pool
```sql
do $$ begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_rls') then
    create role app_rls login noinherit nobypassrls nocreatedb nocreaterole connection limit 40; end if;
end $$;
grant app_user   to app_rls with inherit false, set true;
grant app_public to app_rls with inherit false, set true;
alter role app_rls set statement_timeout = '8s';
alter role app_rls set lock_timeout = '3s';
alter role app_rls set idle_in_transaction_session_timeout = '10s';
-- password per project, out of band, no VALID UNTIL
```
Then switch `DB_CONNECTION_STRING` to `app_rls.<ref>`. Rollback is pointing it back at `postgres.<ref>`; the policies still apply because the wrapper always switches role.

### M4 `<ts>_auth_users_sync.sql` (Supabase Auth build phase; signups still disabled)
```sql
create table if not exists private.settings (key text primary key, value text not null);
-- seed per project (Paddle sandbox vs live price ids may differ - unverified):
insert into private.settings values ('default_plan_id', '<Starter monthly price id>') on conflict (key) do nothing;

create or replace function private.handle_auth_user_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data ? 'clerk_user_id' then return new; end if;     -- imported users keep their remapped row
  insert into public.users (id, email, name, image, plan_id)
  values (new.id::text, lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
          new.raw_user_meta_data ->> 'avatar_url',
          (select s.value from private.settings s where s.key = 'default_plan_id'))   -- never from metadata
  on conflict (id) do nothing;
  return new;
end $$;
create or replace function private.handle_auth_user_email_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin update public.users set email = lower(new.email) where id = new.id::text; return new; end $$;
create or replace function private.handle_auth_user_deleted() returns trigger
language plpgsql security definer set search_path = '' as $$
begin delete from public.users where id = old.id::text; return old; end $$;     -- FK cascades remove owned rows
revoke all on function private.handle_auth_user_created(), private.handle_auth_user_email_changed(), private.handle_auth_user_deleted() from public;
create trigger on_auth_user_created       after insert          on auth.users for each row execute function private.handle_auth_user_created();
create trigger on_auth_user_email_changed after update of email on auth.users for each row execute function private.handle_auth_user_email_changed();
create trigger on_auth_user_deleted       after delete          on auth.users for each row execute function private.handle_auth_user_deleted();
```
- On TEST the default ACL for `auth` tables gives postgres TRIGGER.
- A failing `handle_auth_user_created` blocks **every** signup ("Database error saving new user"). Cover it with pgTAP and a real local signup test. Whether `supabase_auth_admin` needs anything to fire triggers whose functions live in `private` is (unverified); the local signup test settles it.

### M5 cutover remap
This is a runbook script, `scripts/cutover/remap-user-ids.sql`, run with `MIGRATION_DATABASE_URL`, followed by the CHECK as a migration:
```sql
begin;
alter table public.users disable trigger "Brevo New Contact Webhook";      -- named trigger only, never ALL
update public.users u set id = m.supabase_user_id::text
  from migration.clerk_user_map m where m.clerk_user_id = u.id and m.status = 'migrated';   -- 6 FKs are ON UPDATE CASCADE
alter table public.users enable trigger "Brevo New Contact Webhook";
alter table public.users add constraint users_id_is_uuid
  check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');   -- stale Clerk ids now fail loudly
commit;
```
The remap assumes `analytics_upsert_trigger` is absent on PROD (a cascaded update would double counters); check before running (unverified). `migration` is a non-exposed schema with no grants.

---

## 9. Rules that are not ownership: where each one is enforced

**Why TypeScript enforcement is sound here:** the only roles that hold the relevant grants (`app_user`, `app_public`) are reachable **only** through server code holding `DB_CONNECTION_STRING`. There is no second channel (PostgREST, GraphQL, Realtime) in which a user could replay a write with arbitrary values. The DB therefore enforces the invariants that must survive app bugs, and TS enforces the plan logic with `tiers` as the single source of truth.

| Rule | DB enforcement (survives app bugs) | TS enforcement (inside the same `withUser` tx) |
|---|---|---|
| Plan escalation (`users.plan_id`, `customer_id`, `email`, `consents`, `id`) | No app-role UPDATE on those columns (only `name`, `cookie_preferences`). Only `asAdmin` (Paddle) writes them. | Entitlements are always read from `users.plan_id`, never from JWT claims or the client. |
| Ownership reassignment or slug rename (`actions/catalogue.ts:337-347`) | No UPDATE grant on `id`, `name`, `created_by`, `created_at` (42501). WITH CHECK pins `created_by`. The insert trigger pins `id`/timestamps. | `pickEditable()` whitelist. |
| Catalogue count per plan (client-only today, `hooks/useCreateCatalogue.ts:59`) | – | `getPlanForUpdate` (row lock), then `assertCatalogueQuota` in create and duplicate. |
| Create or duplicate directly as `active` (`:161`, `:204`) | INSERT WITH CHECK `status in ('draft','in preparation')`; `catalogues_status_check`. | Insert uses `status:'draft'`; `active` only via publish or updateItemStatus. |
| Activation over the traffic limit | – | `assertCanActivate` in `publishCatalogue` and `updateItemStatus` (for `active`). |
| Branding and newsletter toggle per plan (`actions/catalogue.ts:179,201`) | – | `applyPlanToCatalogue` on create, update and publish. The client `branding` argument is removed. |
| Section types and sections/items per catalogue (UI and agent only today) | Content size CHECK. | `assertContentWithinPlan(before, after)` on update and publish (growth-only). The agent keeps its session limits. |
| AI quota (UNIQUE(catalogue), cascade reset, forged continuation, race, stale month) | Ledger is append-only for app roles (SELECT only). Charge and refund go through `private.begin_ai_turn` / `refund_ai_turn`. FK `ON DELETE SET NULL`, `user_id NOT NULL`, `turn_id` unique. Month bounds computed in SQL. | Limit value resolved from `tiers`; refund only for no-op turns. |
| Newsletter owner spoofing, drafts, oracle | No INSERT grant. The definer derives the owner and requires `active` + `footer.newsletter`. Unique index with ON CONFLICT DO NOTHING. | IP rate limit; constant response. The plan's newsletter feature is enforced when `footer.newsletter` is written. |
| Slug enumeration | No cross-tenant SELECT for app_user. `catalogue_name_available` returns one boolean per call. | Signed-in, rate-limited server action. |
| Draft leakage via public reads | `catalogues_select_public` allows only `status='active'`; `created_by` is not granted to app_public. | `lib/catalogue/public.ts` only. |
| QR config tampering (`actions/qr-configs.ts:8-48`) | `qr_configs_owner` policy (USING + WITH CHECK). | `requireIdentity`. |
| Author HTML/CSS safety | Not a DB rule. | Write-time `sanitizeAppearance` (`actions/catalogue.ts:25-39`). Render-time `components/general/HtmlContent.tsx:28-35` allowlist, `CustomCode.tsx:202` sandbox without `allow-same-origin`, `serializeThemeCss`. |
| Paddle linking and replay | `private.paddle_events` PK. | `customData.user_id`, rethrow, `occurred_at` ordering. |

---

## 10. AI agent stream (Vercel Hobby 60s)

```ts
// app/api/agent/route.ts
export async function POST(request: Request) {
  const body = parseBody(await request.json());
  if (!body || body.catalogue?.name !== body.catalogueName) return Response.json({ code: "bad_request" }, { status: 400 });
  const me = await getVerifiedIdentity();                 // the ONLY cookie/auth() read, before streaming
  if (!me) return Response.json({ code: "unauthorized" }, { status: 401 });
  const continuation = isPlanContinuation(body.messages); // client history is only a hint; the DB decides if it is free

  const start = await withUser(me, async (tx) => {        // one short tx: plan + usage + charge
    const plan = await getPlanForUpdate(tx, me);
    const turn = await beginAiTurn(tx, me, { catalogue: body.catalogueName, limit: plan.features.ai_prompts ?? null, continuation });
    return { plan, turn };
  });
  if (start.turn.outcome === "not_found") return Response.json({ code: "not_found" }, { status: 404 });
  if (start.turn.outcome === "limit") return Response.json({ code: "limit" }, { status: 429 });

  const session = new CatalogueSession(body.catalogue, limitsFrom(start.plan), start.plan.features.sections,
    loadedSkillsFromMessages(body.messages),
    { saveTheme: (name, colors) => withUser(me, (tx) => upsertTheme(tx, me, name, colors)) },   // a port, not a raw user id
    continuation ? planFromMessages(body.messages) : null, fetchesFromMessages(body.messages));

  return createAgentUIStreamResponse({ /* agent, uiMessages, abortSignal as today */
    onFinish: async () => {
      if (start.turn.outcome === "charged" && session.applied.length === 0 && !session.plan)
        await withUser(me, (tx) => refundAiTurn(tx, me, start.turn.turnId!)).catch(reportToSentry);
    },
  });
}
```
- **No transaction spans the stream.** Each DB touch (start, mid-stream theme save, refund) is its own short `withUser` block.
- **Identity is a plain object captured before streaming.** Postgres never checks `exp` on this path, so a token expiring mid-turn is harmless.
- **The charge happens before any model spend.** A function killed at 60s stays charged (fail closed). Today the charge is lost after the stream (`route.ts:112-129`).
- **Continuations are free only by DB evidence:** the same user and catalogue, younger than 15 minutes, with fewer than 9 continuations. Forged history gets charged.
- `actions/ai.ts` (`writeItemDescription`) uses the same `beginAiTurn` (no continuation) and calls `refundAiTurn` if generation fails.
- `persistTheme` leaves the `"use server"` module (`actions/themes.ts:1,37`). `agent/session.ts:68-90` carries the `saveTheme` port instead of a Clerk id.
- **Budget:** start adds about 3 extra round trips (BEGIN, set_config, COMMIT) plus the lock and count. Co-locate the Vercel function region with the DB (PROD eu-central-1 means `fra1`; the current region is unverified).

---

## 11. ISR, Next data cache, Redis

- **Public data:**
  - Only `lib/catalogue/public.ts` (`withPublic`) may feed ISR pages, `generateMetadata`, `generateStaticParams`, the sitemap or `unstable_cache`.
  - `withUser` needs `getVerifiedIdentity()`, which reads `auth()`/`cookies()`, so Next throws if a per-user query is placed in a cache scope.
  - The root layout (`app/layout.tsx`) never reads the session.
  - The `/api/items*` route handlers stay (existing fetch tags `catalogue-${name}`, `catalogues-list` keep working) but call `lib/catalogue/public.ts`.
- **`/api/revalidate` requires `REVALIDATE_SECRET`.** Revalidation always uses names returned by the DB statement.
- **Redis draft mirror** (`lib/catalogue/draft-cache.ts`):
  - Key: `${REDIS_KEY_PREFIX}:catalogue:${name}`, with a 30-day TTL.
  - `writeOwnedDraft` stores the draft **without** `createdBy`, and only after a `withUser` statement proved ownership.
  - `readOwnedDraft(tx, me, name)` first loads the row under `withUser` (null means missing or not owned), then overlays the Redis draft and forces `id`, `name`, `status`, `createdBy` from the DB row.
  - `deleteItem` and `deleteMultipleItems` delete keys for the names they got back (the bulk path does not today, `actions/catalogue.ts:79`).
  - The prefix change drops existing unsaved drafts once; flush again at the remap.

---

## 12. Sessions and cookies (Supabase Auth phase)

- **Packages:** `@supabase/ssr` ^0.12.7 and `@supabase/supabase-js` ^2.116 (`package.json:59-60`).
- **`middleware.ts`** calls `updateSession()`:
  - `createServerClient` with getAll/setAll, then `getClaims()`.
  - Return the exact response carrying refreshed cookies and cache headers.
  - Redirect unauthenticated `/admin(.*)` to `/auth?next=` (validated relative path).
  - Matcher excludes `_next/static`, `_next/image`, static assets, `/ingest`, `/monitoring`, `/api/paddle`, `/api/clerk`.
  - At cutover, expire leftover Clerk cookies (`__session`, `__client_uat`).
- **Cookies:**
  - `sb-<ref>-auth-token` (chunked, `base64-` prefixed).
  - SameSite=Lax, 400-day max-age, `secure` in production, **not HttpOnly** (required by `@supabase/ssr`, since the browser client refreshes).
  - Refresh tokens rotate with a 10s reuse window. Concurrent requests (agent resume plus `refreshUserData`) must tolerate a null session.
- **Server reads:**
  - RSC uses `getVerifiedIdentity()`.
  - Every server action and route handler calls `requireIdentity()` itself; a page check does not protect its actions.
  - Sensitive operations use `requireFreshUser()` (`getUser()`), because `getClaims` does not see deletion, bans or sign-out until `exp` (3600s).
- **Client:** `AuthProvider` with `onAuthStateChange` then `router.refresh()`. `signOut({ scope: "local" })`; `"others"` after a password change.
- **Before the first Supabase cookie exists:**
  - Add a Sentry denylist for `sb-*` cookies and `Authorization` (`sendDefaultPii: true` at `sentry.server.config.ts:19`, `sentry.edge.config.ts:20`, `instrumentation-client.ts:42`).
  - Remove `*` + credentials CORS on `/api/*` (`next.config.ts:26-31`).
  - Keep `CustomCode` sandboxed without `allow-same-origin`. Consider a CSP, since GTM, Clarity and PostHog can read `document.cookie`.
- **The data layer never forwards the user JWT to Postgres.** It forwards only the verified `sub`.

---

## 13. Identity migration (data-layer view)

1. Freeze Clerk sign-ups and profile edits. Export the CSV (bcrypt `password_digest`) and pull Backend API user lists (created_at, external accounts, metadata).
2. Create `migration.clerk_user_map(clerk_user_id text primary key, supabase_user_id uuid unique not null, status text, password_imported boolean, google_sub text)`. Pre-generate the uuids.
3. `scripts/migrate-clerk-to-supabase.ts` runs locally or in CI, never on Vercel:
   - `authAdmin().createUser({ id: <uuid>, email, email_confirm: <Clerk verified>, password_hash, user_metadata: { full_name, avatar_url }, app_metadata: { clerk_user_id } })`
   - Pre-create `auth.identities` for verified Google accounts, and flag conflicts.
4. Maintenance window:
   - pause the worker cron
   - final delta import
   - M5 remap (disable the named Brevo trigger only)
   - flush the Redis prefix
   - revalidate everything
   - set `AUTH_PROVIDER=supabase` and redeploy
   - enable sign-ups
   - recreate the e2e user
   - resume cron
5. Forced re-login. Passwords were imported, so no reset is needed. The optional bridge route (`app/auth/bridge/route.ts`: Clerk `auth()`, then map lookup, then `authAdmin().generateLink` magiclink, then server `verifyOtp`) is extra scope.
6. **No policy, grant or role changes at cutover** (§7).

---

## 14. Rollout order

| Phase | Work | Exit gate |
|---|---|---|
| **0 Prerequisites** | See the list below the table. | PROD pre-checks returned clean. |
| **1 M1 on TEST** | Additive migration; pgTAP suite added. | pgTAP green; advisors reviewed (0007 on users/catalogues/analytics/newsletter is expected until M2). |
| **2 Code on Clerk** | `lib/auth/identity.ts` (Clerk branch), `utils/db/*`, Biome rules and architecture test. Move the six supabase-js data files: Paddle and Clerk webhooks + on-demand sync to `asAdmin`; `/api/items*` to `withPublic`; dashboard analytics to `withUser`. Convert every Drizzle call site (§6). Add entitlements, AI metering, Redis draft cache, IDOR fixes, delete `/api/users/[id]` with the worker change, revalidate secret, newsletter signature change, e2e PROD guard. | Unit + pgTAP + leak test green. e2e on TEST. Agent pre-stream work within budget. |
| **3 M2 on TEST, soak, then PROD** | PROD order: merge `test`→`main`, M1, deploy code, M2. | A curl with the publishable key gets 42501/401 on every table. Advisor 0013 clear. Paddle sandbox webhook ok. Worker jobs ok. |
| **4 M3 (`app_rls`)** | TEST then PROD; switch `DB_CONNECTION_STRING`. | Forgotten-wrapper test: raw query on the user pool gives 42501. |
| **5 Supabase Auth build (dark)** | SSR clients, middleware behind `AUTH_PROVIDER`, `/auth` UI, `/auth/callback`, `/auth/confirm`, Resend SMTP, token_hash templates, redirect allow-lists, Google provider per project, M4, import dry runs on TEST, Sentry scrub. | Local signup test passes with M4. PostgREST perimeter test with a **real user JWT** gets 42501 everywhere. |
| **6 Cutover** | §13. | Smoke: password and Google sign-in, dashboard, create/publish, agent turn, Paddle sandbox, account deletion. |
| **7 Cleanup** | Remove Clerk (app files, tests, `css/clerk.css`, env, legal text). Worker and Vault to `sb_secret_`, then disable legacy keys. Optionally move the worker to direct Postgres and turn the Data API off. | – |

Phase 0 prerequisites:
- Merge `test`→`main` (sequencing only).
- The user runs read-only on PROD:
  - `select version()` (must be ≥16 for `WITH INHERIT/SET`)
  - app role names are unused
  - FK/constraint names
  - duplicate newsletter/product_newsletter/qr_configs keys
  - null `prompts.user_id`
  - `analytics_upsert_trigger` absent
- Point the test worker at TEST.
- Add `DATABASE_ADMIN_URL`.
- Disable Supabase Auth sign-ups and anonymous sign-ins on both projects.
- Set the Vercel function region.

---

## 15. Tests and acceptance gates

- **pgTAP** (`supabase/tests/database/`, run by `supabase start && supabase test db` in `.github/workflows/ci.yaml`):
  - `00_perimeter.test.sql`:
    - RLS enabled on every `public` table
    - zero table, column, sequence and function privileges for `anon`/`authenticated` in `public`
    - `not pg_has_role('authenticator','app_user','MEMBER')`, and the same for `app_public`, `anon`, `authenticated`, `service_role`, `supabase_realtime_admin`
    - no USAGE on `private` for anon/authenticated
    - no function in `private` executable by PUBLIC
    - `not has_column_privilege('app_user','public.users','plan_id','UPDATE')`
  - `10_catalogues.test.sql`:
    - owner A vs B read/update/delete (0 rows)
    - `update … set created_by` / `name` / `id` gives 42501
    - insert with `status='active'` gives 42501
    - app_public sees only active rows, and `select created_by` gives 42501
    - app_user does not see B's active rows
  - `20_users_usage.test.sql`: self-only reads; `plan_id` update gives 42501; `delete from prompts` gives 42501.
  - `30_qr_themes_newsletter.test.sql`: QR config for a non-owned catalogue fails WITH CHECK; newsletter signup derives the owner and ignores inactive or disabled catalogues; the duplicate is a no-op.
  - `40_ai_ledger.test.sql`:
    - begin charges
    - over-limit gives `limit`
    - continuation within 15 minutes gives `continued`
    - forged continuation with no recent turn is charged
    - refund only when there are no continuations and only within 10 minutes
    - deleting the catalogue keeps prompts rows
  - `50_auth_triggers.test.sql` (after M4): insert into auth.users creates the users row with the default plan; the imported-user skip; email sync; delete cascade.
  - Tests switch identity with `set local role app_user; select set_config('request.jwt.claims','{"sub":"user_A"}', true);`.
- **Vitest integration** (`tests/integration/db/`, local stack):
  - `rls-leak.test.ts`: `max:1` pool, `withUser(A)` then a raw query shows `current_user = session user` and null claims, including after a thrown error.
  - `forgotten-wrapper.test.ts` (M3): raw query on the user pool gives 42501.
  - `grants-match-columns.test.ts`: the SQL UPDATE column grant on catalogues equals `CATALOGUE_EDITABLE_FIELDS ∪ {status, updatedAt}`.
  - `postgrest-perimeter.test.ts`: publishable key without and with a signed-in user JWT gets 401/403/42501 for GET/POST/PATCH/DELETE on every table, and for `/rpc/*` on the private function names.
- **Unit:**
  - Replace mocks of `currentUser`/`@/utils/drizzle` (`tests/unit/server_actions/ai.test.ts:3-24`, `tests/unit/agent/tools.test.ts:24,336-401`) with `@/lib/auth/identity` and `@/utils/db` fakes.
  - The non-owner case becomes `not_found`.
  - Route tests: unauthenticated, non-owner, limit, forged continuation charged, refund on a no-op turn.
- **Ops:** Supabase advisors after every migration. 0008 on subscriptions/plans/job_logs is intentional. 0003 cannot see the helper, so enforce the `(select …)` wrapper in review.

---

## 16. Rejected alternatives, and the escape hatch

- **Drizzle switching into standard `authenticated`/`anon` (research option 1b, proposal A):**
  - Every grant the app needs (e.g. UPDATE catalogues) becomes directly callable by every signed-in user via `/rest/v1` with the public publishable key.
  - Plan rules would have to be rebuilt in PL/pgSQL: a `plan_features` copy of `tiers`, a jsonb re-implementation of `helpers/catalogueOperations.ts`, normalizing triggers that silently rewrite data. That means permanent drift and a guard trigger whose bug blocks every save.
  - About twice the SQL work for a strictly larger attack surface.
- **supabase-js/PostgREST first (proposal C, option 2):**
  - Rewrites 39 working Drizzle references into a second type system.
  - No interactive transactions (an RPC per multi-statement operation), max_rows truncation.
  - The same public surface as A.
  - Token binding for the 60s agent.
  - User-level RLS on the app's own queries arrives only after the Auth cutover.
- **supabase-js for user CRUD + Drizzle admin (option 3):** two privileged surfaces, two query APIs, two type systems.
- **App-layer checks only with zero anon/authenticated grants (option 4):** used as the perimeter step (M2) but insufficient alone, because it does not contain IDORs like `getUserData(userId)` or `upsertQrConfig`.
- **Clerk third-party auth into PostgREST before cutover:** 60s Clerk tokens against 50s agent turns, MAU cost, all thrown away at cutover.
- **Turning the Data API off now:** the worker needs service_role over PostgREST. Revisit after the worker moves to direct Postgres.
- **Converting id columns to `uuid`:** requires dropping and recreating the dependent views, and a two-phase type change. Text ids plus the uuid CHECK give the same fail-loud property.
- **Escape hatch for future browser, Realtime or Storage needs:** open **one** table to `authenticated` only after moving that table's non-ownership rules into DB triggers or definer functions (proposal A's recipe). Reuse `private.current_user_id()` in its policies (grant USAGE on `private` + EXECUTE to `authenticated`), and add the table to the perimeter test's allowlist explicitly. For Realtime, prefer Broadcast with `realtime.messages` policies; for Storage, prefer server-issued signed upload URLs or folder policies on `auth.uid()`.

---

## 17. Items to verify before or during implementation (unverified)

- **PROD database state:** PG version; whether the lockdown migration is applied; FK and constraint names; duplicates and nulls blocking the new indexes and NOT NULL; `analytics_upsert_trigger` absent; `pg_graphql` status.
- **Role mechanics on PROD:** `GRANT app_user TO postgres WITH INHERIT FALSE, SET TRUE` succeeds (TEST PG 17.6 per docs; fallback `createrole_self_grant`). Custom login role `app_rls.<ref>` authenticates through Supavisor on each project, and the pooler pool size is budgeted per user against `max_connections=60`.
- **Firing-time behaviour of `private`-schema functions:** auth.users triggers fire when GoTrue (`supabase_auth_admin`) inserts; trigger functions need no EXECUTE at fire time (EXECUTE is granted to app_user anyway).
- **Vercel and Supabase settings:** Vercel function region; whether Supabase Auth sign-ups and anonymous sign-ins are currently enabled; the Paddle price ids per project for `default_plan_id`; whether Paddle subscription events carry `customData.user_id`.
- **Tooling:** exact Biome 2.2.6 override glob semantics; the continuation caps (15 min / 9) against plan-mode turn counts in `plans/active/ai-agent-plan-mode.md`.
- **External dependencies:** what the PROD edge functions do with `users.id`; whether Upstash Redis is shared across environments.
