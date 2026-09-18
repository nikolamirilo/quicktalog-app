# Clerk to Supabase Auth, user-level RLS and DB access - Development Plan

Generated 2026-09-16, verified 2026-09-17.

**Status:** in progress. Phase 0A code and the M00 migration file are written (uncommitted, M00 not applied); deploy, soak and M00 apply are pending. DB access decision confirmed by the owner on 2026-09-17: Drizzle ORM for all data through private roles, supabase-js for login only (section 3.4). Every phase is implemented on TEST first, then repeated on PROD (separate Supabase projects and databases).

**Scope:** quicktalog-app (branch `test`, `fcee862`), `../quicktalog-backend` (worker), `../quicktalog-packages` (`@quicktalog/common`), Supabase TEST `imhinsgyzzyblghwnedk` and PROD `uhfbapjuzvlyzyodxhqn`.

**What this answers:**
1. How to move auth from Clerk to Supabase Auth, including how identities migrate and how session cookies work.
2. How to enforce RLS so a user can reach only their own data.
3. How the app should talk to the database, and why "ORM only / supabase client / hybrid" is the wrong question.

**Inputs and process:**
1. Eight phase-1 research reports on the codebase and the platforms (`research/`).
2. Three architecture proposals (A: Drizzle into standard roles, B: private app roles, C: supabase-js first), scored by a judge. The binding decision is proposal B (`decision/architecture-decision.md`).
3. Design drafts for the SQL, the identity cutover and the app changes (earlier drafts, not included; superseded by this plan).
4. A first PGlite run of the draft SQL (475 scenarios, `verification/pglite-results.md`).
5. Two red-team reviews, one of RLS and one of the cutover runbook (`verification/redteam-rls.md`, `verification/redteam-runbook.md`), and a completeness review (`verification/completeness-review.md`).
6. This plan, then a PGlite execution of its final Appendix A SQL on PostgreSQL 17.5 and 18.3 (692 scenarios; the 9 defects found are fixed here as CHANGE W1-W9 and re-run green; `verification/final-sql-results.md`).
7. A repository fact-check of the `file:line` citations (sections 1, 2, 5, 6, 9, 10, 12 and all 76 rows of Appendix C) and an external fact-check of third-party claims against vendor docs and sources (2026-09-17); corrections are applied in place and listed at the end of D.4.

**This document supersedes the drafts wherever they disagree.** Appendix D.5 lists every contradiction and how it was settled. Use the SQL in Appendix A, not the SQL in the drafts.

**Evidence labels:**
- `file:line` = quicktalog-app on `test`, unless prefixed `backend/` or `packages/`.
- **TEST** = verified with read-only SELECTs on `imhinsgyzzyblghwnedk` (re-checked while writing this plan and again on 2026-09-17).
- **PGlite** = executed in `verification/pglite-harness` against a Supabase stub calibrated from TEST catalogs.
- **External** = checked on 2026-09-17 against vendor documentation, vendor source on GitHub or the installed library source; the URL or file is given inline.
- **(unverified)** = nobody could check it. PROD was never queried.

---

## 0. TL;DR (the decisions)

1. **DB interaction: hybrid by library, single path by data.**
   - All app data goes through **Drizzle over the Supavisor transaction pooler (6543)**, one short transaction per server action, switching into private roles `app_user` (signed-in) or `app_public` (visitors, ISR, public signups).
   - **supabase-js is used for Auth only** (SSR cookie client, middleware, browser auth client). `.from()` and `.rpc()` are banned in the app.
   - System writes (Paddle webhook, provisioning, e2e cleanup) use a separately credentialed **admin Drizzle client** (`postgres`, BYPASSRLS) that only an allowlist of modules may import.
   - The **secret key** is used only for `auth.admin.*`. The worker keeps a service key over PostgREST.
2. **Your three options are framed around a library; security is decided elsewhere.**
   - "ORM only via `DB_CONNECTION_STRING`" is **today's state and means no RLS**: `utils/drizzle.ts:7` connects as `postgres`, which has `rolbypassrls = true` (TEST).
   - Every viable option is a hybrid: Supabase Auth is only reachable through supabase-js, and webhooks/worker have no end user.
   - **Avoiding supabase-js does not avoid the Data API.** Once users hold Supabase JWTs, anything granted to `authenticated` is a public API for every signed-in user, whichever library the app uses. What decides security is grants, policies, exposed schemas and which roles can be reached.
3. **RLS reads identity from `private.current_user_id()`**, which returns the `sub` the server verified. It is the Clerk id today and the `auth.users.id` (as text) after cutover, so **policies do not change at cutover**. `auth.uid()` is never used (it throws 22P02 on Clerk ids, TEST).
4. **`anon` and `authenticated` keep zero privileges in `public`.** `app_user`/`app_public` are `NOLOGIN NOINHERIT NOBYPASSRLS` and `authenticator` is not a member, so no JWT can reach them (PGlite: every Supabase service role gets 42501 on `SET ROLE app_user`). That is why plan limits can stay in TypeScript (`tiers`), backed by DB invariants: column UPDATE grants, WITH CHECK, CHECK constraints, unique indexes and definer-written ledgers.
5. **Fix the worst hole first, independent of the migration.** The publishable key today gives anyone DELETE/UPDATE on `users` and write access to `catalogues`/`subscriptions` with RLS off (TEST). Phase 0A moves the six supabase-js data paths off `anon` and applies **M00 `perimeter_close`** within days, not after the RLS refactor.
6. **Order that avoids the verified cross-tenant window:** M00 (RLS on everywhere, zero anon grants) → M01-M06 (roles, policies, definers) → converted `withUser` code → M08 `app_rls` fail-closed login → Supabase Auth. Owner policies are therefore enforced from the first `withUser` deploy (PGlite found a real leak when RLS was enabled later).
7. **Identity migration:** operator script imports Clerk users with `auth.admin.createUser({ id, password_hash })`. The uuid is **claimed in `migration.clerk_user_map` before `createUser`**, because GoTrue writes `app_metadata` in a later UPDATE (verified in supabase/auth source and PGlite). Bcrypt digests and Google identities carry over. `users.id` stays `text` holding the uuid; one transaction re-keys it and 6 FKs cascade.
8. **Sessions:** everyone signs in once more at cutover (no session bridge). `@supabase/ssr` 0.12.7 cookies `sb-<ref>-auth-token`; `getClaims()` for normal requests, `getUser()` for sensitive ones; middleware refreshes only on session paths so public ISR responses never carry `Set-Cookie`.
9. **Cutover:** one PROD maintenance window with a **runtime** maintenance switch (Vercel Global Config, formerly Edge Config, not Instant Rollback, which on Hobby only reaches the previous deployment). Rollback within 72h = reverse re-key, with Supabase-only users pushed into Clerk and recorded in the same map.
10. **Verification status:** every SQL block of Appendix A, including all `CHANGE C1-C12` statements, was executed in its final form in PGlite on PostgreSQL 17.5 and 18.3 (692 scenarios per engine, migrations applied in phase order, one transaction each, plus the import, re-key, rollback, re-cutover, A.14 rollback and A.15/A.16 audits). As first written, 15 scenarios failed on both engines, caused by 9 defects; they are fixed in Appendix A as `CHANGE W1-W9` and the re-run fails 0 of 692 on both engines (`verification/final-sql-results.md`). PGlite cannot show locking between connections, `statement_timeout`, Supavisor, supautils or live GoTrue/PostgREST; those stay with the integration tests on the local stack and TEST (section 11). The harness is ported into the repo in Phase 1 and must stay green.
11. **Effort:** roughly 55-81 developer-days; 3.5-4.5 months calendar including soaks and rehearsals (section 15).

---

## 1. Current state (verified)

### 1.1 Stack and environments

| Item | Today | Evidence |
|---|---|---|
| App | Next.js 15.5 App Router on Vercel **Hobby**, React 19; agent route pinned to `maxDuration = 60` (Hobby with Fluid compute allows up to 300 s; the design keeps turns under 60 s regardless) | initial inventory; `app/api/agent/route.ts:13`; https://vercel.com/docs/functions/limitations |
| Auth | `@clerk/nextjs` 6.39.3, `clerkMiddleware` protects `/admin(.*)` | `middleware.ts:1-14`, `package.json:21` |
| Data | `drizzle-orm` 0.45.2 + `postgres` (prepare:false) over `DB_CONNECTION_STRING` = Supavisor 6543 as `postgres.<ref>` | `utils/drizzle.ts:5-8` |
| Supabase client | `@supabase/ssr` ^0.5.2, `supabase-js` ^2.47.10 (installed 2.105.3), publishable key, cookie client, file marked `"use server"` | `package.json:59-60`, `utils/supabase/server.ts:1` |
| Worker | Cloudflare Worker, supabase-js with legacy `SUPABASE_SERVICE_ROLE_KEY`; test env points at a **third project** `tpcfltcupcofteovrvmu` | `backend/src/lib/supabase.ts:9-13` at HEAD `6d3a5cf` (`:4-8` in the uncommitted working tree, which also removes the anon `supabaseClient` at HEAD `:3-6`), `backend/wrangler.jsonc:18,28` |
| Packages | `@quicktalog/common` 1.54.0 = `drizzle-kit pull` output with drift and a stale `pgPolicy` | `packages/src/drizzle/migrations/schema.ts:35` |
| Projects | TEST eu-west-1 PG 17.6; PROD eu-central-1 (PG version unverified) | TEST |
| Branches | `test` is 39 commits ahead of `main` (PROD). `main` has no `supabase/migrations/` and still ships removed anon routes | `research/public-and-system-surfaces.md` TL;DR 8 |
| Local stack | `supabase/config.toml:16` pins `major_version = 15` (M01 needs 16+) | repo |

### 1.2 Auth today

- Clerk `<SignIn>`/`<SignUp>` with hash routing (`components/auth/Auth.tsx:46-56`); consent modal only in sign-up mode, stored in localStorage (`:14-31`). OAuth sign-ups never see it; `users.consents` defaults to all-true.
- 16 server `currentUser()` sites that only need `user.id` (`research/auth-surface.md` section 2). `currentUser()` is a Clerk Backend API call per request.
- Client identity: `context/UserContext.tsx:36` passes the Clerk id to the `getUserData(userId)` server action; `context/CatalogueContext.tsx:284-290` stamps `createdBy`.
- Account management is Clerk `<UserProfile/>` (`components/dashboard/Settings.tsx:39`). Deleting an account does not cancel Paddle, purge Redis or revalidate.
- Clerk webhook (`app/api/clerk/route.ts`) writes `public.users` through the **anon** client; `user.created` redelivery overwrites `plan_id`/`customer_id` (`lib/users/syncFromClerk.ts:103-110`).
- Cookie consent for signed-in users lives in Clerk `publicMetadata` (`app/api/update-consent/route.ts:25-42`).
- Evidence of Google OAuth and password sign-in (TEST avatars and e2e). PROD methods, MFA, passkeys and counts are unknown (section 14).

### 1.3 DB access paths today

| Path | Role | Call sites | RLS effect |
|---|---|---|---|
| Drizzle `drizzleClient` | `postgres` (BYPASSRLS) | 39 references: `actions/catalogue.ts`, `newsletter.ts`, `qr-configs.ts`, `themes.ts`, `lib/ai/access.ts`, `lib/users/fetchUserData.ts`, `app/api/dashboard/{catalogues,newsletter}` | none |
| supabase-js cookie client | `anon` (no Supabase session exists) | `app/api/items/route.ts:11`, `app/api/items/[name]/route.ts:11`, `app/api/dashboard/analytics/route.ts:8`, `app/api/clerk/route.ts:51`, `lib/users/fetchUserData.ts:53`, `utils/paddle/process-webhook.ts:62,217` | grants only |
| Raw postgres | `postgres` | `tests/e2e/helpers/cleanup.ts:12-55` | none |
| Worker | `service_role` | analytics and subscription jobs, image cleanup | bypass |
| Redis mirror | n/a | key = slug, value = full row incl. `createdBy`, no TTL | not protectable by RLS |

All 76 call sites are mapped in Appendix C (the initial inventory's "68" is stale; the call-site inventory in `research/data-access.md` has 76).

### 1.4 Grants and RLS state (TEST, re-checked)

| Fact | Value |
|---|---|
| Postgres | 17.6 |
| Tables in `public` / with RLS / policies | 12 / **0** / **0** |
| `anon` grants | users `SELECT/INSERT/UPDATE/DELETE`; catalogues `SELECT/INSERT/UPDATE`; subscriptions `SELECT/INSERT/UPDATE`; analytics `SELECT/INSERT`; newsletter `SELECT`; job_logs `INSERT`; EXECUTE `get_pageview_totals` (broken, 42804) |
| `authenticated` grants | none |
| Database ACL | `=Tc/postgres` → **PUBLIC can create TEMP tables** |
| `net.http_request_queue` ACL | `=arwdDxtm/supabase_admin` → **PUBLIC can read/write the pg_net queue**; `postgres` cannot revoke it (PGlite) |
| `auth.users` / `public.users` | 0 / 3 (all `user_...` ids) |
| App roles, `private`, `migration` schemas | do not exist yet |
| `postgres` | LOGIN, CREATEROLE, BYPASSRLS; member of anon/authenticated/service_role with SET |
| `authenticator` | member only of anon, authenticated, service_role |
| Schema `auth` | `postgres=U` without grant option → custom roles cannot use `auth.jwt()` |
| `auth.users` | owned by `supabase_auth_admin`; `postgres` holds TRIGGER and, through `supautils.drop_trigger_grants` (TEST lists `auth.users` for `postgres`), may DROP triggers on it; PGlite cannot model supautils, so trigger DDL on `auth.users` is verified on the local stack and TEST, not PGlite |
| FKs to `users.id` | catalogues, analytics, newsletter, ocr, prompts, user_themes: all `ON UPDATE CASCADE ON DELETE CASCADE`; subscriptions → `users.customer_id` |
| AI ledger defects | `prompts_service_catalogue_key UNIQUE(catalogue)`; prompts/ocr → catalogues `ON DELETE CASCADE`; `user_id` nullable |
| DB webhooks | `call_edge_function_with_vault_secret` posts `to_jsonb(NEW)` with the Vault `service_role_key` as Bearer to a **hard-coded PROD URL**; TEST Vault is empty |

### 1.5 Identity coupling

- Clerk ids live only in `users.id` and the 6 FK columns (TEST scan found none in jsonb).
- Outside Postgres: Redis values (`createdBy`), ISR payloads (`created_by` in every public page), client state, Clerk metadata (cookie consent), `users.image` on `img.clerk.com`, Brevo/CRM payloads, the worker URL `/api/users/${id}`, Sentry cookies (`sendDefaultPii: true`).
- Two write-back paths would restore a stale Clerk id after a re-key: `publishCatalogue` spreads client `createdBy` (`actions/catalogue.ts:337-347`) and `newsletterSignup` trusts `ownerId`.

### 1.6 Security findings that exist today

Severity: **Critical** = exploitable now by anyone with public information; **High** = exploitable by any signed-in user or leaks PII; **Medium/Low** as usual. "Immediate" means it ships in Phase 0A, before any migration work.

| # | Finding | Sev | Evidence | Fixed in |
|---|---|---|---|---|
| S1 | Publishable key + anon DML with RLS off: dump all users, self-upgrade `plan_id`, cascade-delete any user, id-swap takeover, deface catalogues, read every subscriber email, forge subscriptions (fires CRM/Discord) | **Critical** | TEST grants (1.4); `research/data-access.md` "security today" | **0A (immediate)**: M00 |
| S2 | Unauthenticated PII/billing IDOR: `GET /api/users/[id]` (CORS `*`), `getUserData(userId)` server action, `/api/items` returns every `created_by` | **Critical** | `app/api/users/[id]/route.ts:6-31`, `actions/users.ts:9-39`, `app/api/items/route.ts:13` | **0A (immediate)** |
| S3 | Drafts and unsaved edits public: `/catalogues/[name]/preview` and `getCatalogueByName` have no auth | High | `app/catalogues/[name]/preview/page.tsx:28`, `actions/catalogue.ts:284-321` | **0A (immediate)** |
| S4 | `upsertQrConfig`/`getQrConfig` have no auth | High | `actions/qr-configs.ts:8-72` | **0A (immediate)** |
| S5 | Cross-tenant PostHog analytics + HogQL injection | High | `app/admin/[name]/analytics/page.tsx:41-57` | **0A (immediate)** |
| S6 | Worker HTTP routes unauthenticated, including `/api/images/cleanup?delete=true`; test worker reads a third project | High | `backend/src/index.ts:25-26`, `backend/wrangler.jsonc:18,28` | **0A (immediate)**, before the test worker is repointed |
| S7 | `publishCatalogue` mass assignment (`createdBy`, `id`) | High | `actions/catalogue.ts:337-347` | 0B code; DB guard in 1 (column grants) |
| S8 | `createCatalogue`/`duplicateItem` accept client `status`/`branding`; plan limits client-only | High | `actions/catalogue.ts:161,177-239`, `hooks/useCreateCatalogue.ts:22-25,59` | 0B code; 1 (entitlements + WITH CHECK) |
| S9 | Newsletter signup trusts `ownerId`/`catalogueId`, no validation or rate limit, subscription oracle | High | `actions/newsletter.ts:19-58` | 0B; 1 (definer) |
| S10 | Paddle: customer linked by email (spoofable), all errors swallowed (paid users stay free, no retry) | High | `utils/paddle/process-webhook.ts:44-50,214-223` | 0A (rethrow), 0B (signed checkout) |
| S11 | AI quota bypasses: `UNIQUE(catalogue)` makes metering fail, catalogue delete resets quota, forged plan continuation skips metering, check-then-charge race, stale month bounds | High | `research/ai-agent.md` section 5 | 1 (M03, M05, M06) |
| S12 | `/api/pdf` SSRF (puppeteer on any URL) | Medium | `app/api/pdf/route.ts:5-25` | **0A (immediate)** |
| S13 | `/api/revalidate` unauthenticated global purge | Medium | `app/api/revalidate/route.ts:5-9` | **0A (immediate)** |
| S14 | UploadThing fake auth (`{id:'fakeId'}`) | Medium | `app/api/items/uploadthing/core.ts:6` | **0A (immediate)** |
| S15 | CORS `*` together with `Allow-Credentials: true` on `/api/*` | Medium | `next.config.ts:23-45` | **0A (immediate)** |
| S16 | Sentry `sendDefaultPii: true` ships Clerk `__session` JWTs now and would ship `sb-*` refresh tokens later | Medium | `sentry.server.config.ts:19`, `sentry.edge.config.ts:20`, `instrumentation-client.ts:42` | **0A (immediate)** |
| S17 | Clerk `user.created` redelivery / on-demand sync downgrades a paying user | Medium | `lib/users/syncFromClerk.ts:103-110,142` | 0A (admin upsert never touches plan) |
| S18 | `updateItemStatus` patches Redis/revalidates an unchecked `name`; status not validated | Medium | `actions/catalogue.ts:90-130` | 0B; 1 (status CHECK) |
| S19 | Bulk delete leaves Redis drafts readable | Medium | `actions/catalogue.ts:79` | 0A (preview owner-only), 1 (id-keyed drafts) |
| S20 | Helpers exported from `"use server"` modules take ids/recipients (`persistTheme(userId)`, email senders) | Medium | `actions/themes.ts:37`, `actions/users.ts:41-127`, `actions/email.ts:37-83` | 0B |
| S21 | `sendContactEmail` has no validation or rate limit | Medium | `actions/email.ts:9-36` | 0B |
| S22 | Clerk account deletion leaves Paddle billing active | Medium | `research/auth-surface.md` section 4 | 0B |
| S23 | pg_net queue readable by any role that can run SQL (carries the service_role bearer); PUBLIC TEMP lets a planted temp table shadow Drizzle's unqualified names on a pooled backend | Medium (needs SQL injection) | TEST ACLs, PGlite F3/F4 | 1 (wrapper `search_path`, M08) + Track K (M09); residual risk in section 13 |
| S24 | DB webhooks and the Sync Plans cron post to the PROD URL from any project with a Vault key | Medium (latent) | `supabase/migrations/20260911213819_remote_schema.sql:55-91` (webhook function; trigger `:437`), `supabase/migrations/20260912093000_lockdown_privileges_and_schema_fixes.sql:242-267` (Sync Plans cron, URL `:250`) | 1 (M02) |
| S25 | `get_pageview_totals` broken and anon-executable | Low | TEST 42804 | 0A (M00) |
| S26 | PROD `main` still ships removed anon routes (`POST/PATCH /api/items`, `/api/analytics*`, `/api/subscriptions/check`) | High on PROD | `research/public-and-system-surfaces.md` | 0A (merge `test`→`main` before M00 on PROD) |

### 1.7 What is unknown about PROD (never queried)

PG version (M01 needs ≥16); whether the 4 app migrations and the lockdown migration are applied; anon/authenticated grants and default privileges; constraint names; duplicate newsletter/qr keys; null `prompts.user_id`; `analytics_upsert_trigger` presence (a re-key blocker); Vault key format; edge function sources and whether they use the anon key or store `users.id`; consumers of the `contacts`/`active_subscriptions` views; user counts and Clerk PROD settings; whether the open anon grants were ever abused. Phase 0A step 1 collects these read-only.

---

## 2. Target architecture

### 2.1 Diagram (end state, after cutover)

```
                       sb-<ref>-auth-token cookies (SameSite=Lax, not HttpOnly)
 Browser ----------------------------------------------------------------+
   |  supabase-js browser client: signIn/signUp/OAuth start/updateUser   |
   +------------------------------> GoTrue  /auth/v1  (Turnstile token)  |
   |                                                                     v
   |  same-origin fetch / server actions                  Vercel (Next.js, region co-located with DB)
   +---------------------------------------------------->  middleware.ts
                                                            - maintenance switch (Global Config)
                                                            - updateSession() only on session paths
                                                          lib/auth/identity.ts
                                                            - getClaims() -> VerifiedIdentity {userId=sub}
                                                          utils/db/rls.ts  withUser / withPublic
                                                            | DB_CONNECTION_STRING = app_rls.<ref>  (6543)
                                                            v
                                                          Supavisor --> Postgres
                                                                         BEGIN
                                                                         set_config(role=app_user|app_public,
                                                                                    request.jwt.claims={sub},
                                                                                    search_path, timeouts)
                                                                         policies TO app_user/app_public
                                                                         read private.current_user_id()
                                                                         COMMIT
                                                          utils/db/admin.ts  asAdmin (webhooks, provisioning)
                                                            | DATABASE_ADMIN_URL = postgres.<ref> (BYPASSRLS)
                                                          utils/supabase/auth-admin.ts
                                                            | SUPABASE_SECRET_KEY -> GoTrue /admin only

 Cloudflare worker --- sb_secret_ key ---> PostgREST (service_role, bypass)
 Anyone --- publishable key (with or without a user JWT) ---> PostgREST /rest/v1, /graphql/v1
                                                               anon/authenticated: zero grants -> 42501
```

### 2.2 The decisions that actually matter

| Decision | Answer |
|---|---|
| Who issues identity | Clerk until cutover, Supabase Auth after. Postgres only ever sees a `sub` the server verified. |
| DB role for user and visitor traffic | Private `app_user` / `app_public`, reachable only by `SET ROLE` from the server's DB connection |
| Transport for user and visitor traffic | Drizzle over Supavisor 6543, `prepare:false`, one short transaction per server action |
| What the public Data API reaches | Nothing in `public` for `anon`/`authenticated`. Exposed schemas stay `public, graphql_public`. The worker keeps a service key. |
| Where non-ownership rules live | TypeScript in the same DB transaction (single source: `tiers`), backed by DB structural invariants |
| Where system writes run | `asAdmin` on a separate credential, importable only by allowlisted modules |

### 2.3 Postgres roles

| Role | Attributes | Member of | Purpose |
|---|---|---|---|
| `app_user` | NOLOGIN NOINHERIT NOBYPASSRLS | none | Signed-in owner policies and grants |
| `app_public` | NOLOGIN NOINHERIT NOBYPASSRLS | none | Visitors: active catalogues (without `created_by`), signup definers |
| `postgres` (exists) | LOGIN, BYPASSRLS, CREATEROLE | gets `app_user`, `app_public` WITH INHERIT FALSE, SET TRUE | `DB_CONNECTION_STRING` until M08; `DATABASE_ADMIN_URL`; migrations |
| `app_rls` (M08) | LOGIN NOINHERIT NOBYPASSRLS, CONNECTION LIMIT 40, `search_path = public, pg_temp` | `app_user`, `app_public` WITH INHERIT FALSE, SET TRUE | End-state `DB_CONNECTION_STRING` login. Owns no privileges, so a query outside the wrapper gets 42501. |
| `anon`, `authenticated` | Supabase defaults | - | Zero privileges in `public`, no USAGE on `private` |
| `service_role` | BYPASSRLS | - | Worker only |
| `authenticator`, `supabase_*_admin` | Supabase | never `app_user`/`app_public` | pgTAP asserts non-membership |

### 2.4 Modules

| Path | Exports | Allowed importers / rule |
|---|---|---|
| `lib/auth/identity.ts` | `VerifiedIdentity` (branded), `getVerifiedIdentity`, `requireIdentity`, `requireFreshUser`, `identityFromSupabaseAuth`, `UnauthorizedError` | The only producer of identity and the only `@clerk/nextjs/server` identity import. Copies only `sub`/`session_id`; rejects `is_anonymous` and non-`authenticated` roles. |
| `lib/auth/session.ts` | `getSessionUser`, `requireUser` (redirect), `requireUserForAction` (throw) | Facade for pages and actions |
| `lib/auth/provider.ts` | `AUTH_PROVIDER` (build-time constant) | Client, middleware, server |
| `lib/auth/redirects.ts` | `safeNext()` (isomorphic, origin comparison) | Client and server |
| `lib/auth/cookie-options.ts` | `COOKIE_OPTIONS` | All three Supabase clients |
| `lib/ops/flags.ts` | `isMaintenance()`, `maintenanceBypass(req)` | Middleware, `/api/paddle` |
| `utils/db/pool.ts` | `getUserDb`, `getAdminDb`, `Tx` | Only `rls.ts`, `admin.ts` |
| `utils/db/rls.ts` | `withUser`, `withPublic` | Everyone (via `utils/db/index.ts`) |
| `utils/db/admin.ts` | `asAdmin`, `Tx` | `utils/paddle/**`, `lib/paddle/resolve-user.ts`, `lib/paddle/customer.ts`, `app/api/paddle/**`, `app/api/clerk/**` (until Phase 5), `lib/users/provision.ts` (until Phase 4), `scripts/**`, `tests/**` |
| `utils/db/{errors,columns,private-schema,index}.ts` | `pgError`, `PUBLIC_CATALOGUE_COLUMNS`, `CATALOGUE_EDITABLE_FIELDS`, `pickEditable`, Drizzle `private` tables | `private-schema` admin code only |
| `utils/supabase/{server,middleware,client}.ts` | Auth-only facades `{ auth }` | `.from()`/`.rpc()` unreachable by type |
| `utils/supabase/server-forwarded.ts` | Secret-key auth facade that forwards the end-user IP (`sb-forwarded-for`) and exposes only `exchangeCodeForSession`, `verifyOtp`, `getClaims` (a secret-key client skips captcha and reaches `auth.admin`) | `app/auth/callback`, `app/auth/confirm`, `utils/supabase/middleware.ts` |
| `utils/supabase/auth-admin.ts` | `authAdmin()` returning `.auth.admin` only | `actions/account.ts`, `scripts/**`, `tests/**` |
| `lib/entitlements/{plan,catalogue}.ts` | `getPlanForUpdate`, `assertCatalogueQuota`, `applyPlanToCatalogue`, `assertContentWithinPlan`, `assertCanActivate`, `applyPlanDowngrade` | Server |
| `lib/ai/metering.ts` | `startAiTurn`, `beginAiTurn`, `refundAiTurn`, `setPlanState`, `planHash` | Server |
| `lib/catalogue/{public,draft-cache,slug}.ts` | public reads (`withPublic`), id-keyed Redis drafts, `toSlug` | Server |
| `lib/paddle/{checkout,customer,resolve-user,subscriptions}.ts` | server-created checkout with signed `customData` and a pinned `customerId`, get-or-create Paddle customer, user resolution, cancel | Server |
| `lib/users/{my-user-data,provision,welcome}.ts` | `getMyUserData`, Clerk-period provisioning, `claimWelcomeEmail` | Server |
| `lib/observability/sentry-scrub.ts`, `lib/rate-limit.ts`, `lib/http/secret.ts` | scrubber, Upstash rate limits, timing-safe compare | Server |

`utils/drizzle.ts` is deleted in Phase 1. Every server module starts with `import "server-only"`; Vitest aliases it to the absolute file: `alias: { "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)) }` (the subpath is not in the package's `exports`, so a bare `server-only/empty.js` alias fails with ERR_PACKAGE_PATH_NOT_EXPORTED; `node_modules/server-only/package.json`). Skeletons are in Appendix B.

### 2.5 Credentials and environment variables (the single matrix)

> **Naming change (2026-09-17, owner decision):** `DATABASE_URL` was renamed to `DB_CONNECTION_STRING` and `DATABASE_ADMIN_URL` was merged into it (one variable, the `postgres.<ref>` pooler URL), used by `utils/drizzle.ts`, `utils/db/pool.ts` (`getAdminDb`), `drizzle.config.ts`, e2e cleanup and CI. Read `DATABASE_ADMIN_URL` below as `DB_CONNECTION_STRING` until M08. M08 needs two logins (`app_rls` for user traffic, `postgres` for `asAdmin`), so a second variable must be reintroduced then.

| Variable | Vercel Production (PROD) | Vercel Preview + test.quicktalog.app (TEST) | Local dev | GitHub Actions | Worker | Introduced / removed |
|---|---|---|---|---|---|---|
| `DB_CONNECTION_STRING` | `postgres.<prod-ref>` @ pooler 6543; **`app_rls.<prod-ref>` after M08** | same pattern, TEST ref | local stack or TEST pooler | db job: local stack; e2e: TEST (`app_rls` after M08) | - | exists |
| `DATABASE_ADMIN_URL` | `postgres.<prod-ref>` 6543 | `postgres.<test-ref>` 6543 | same as `DB_CONNECTION_STRING` | local / TEST | - | 0A |
| `MIGRATION_DATABASE_URL` | **never** | **never** | - | local stack only | - | operator machine only (session pooler 5432 or direct); Phase 3 |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (`sb_publishable_`) | PROD | TEST | TEST or local | TEST/local | `SUPABASE_URL` per env | exists |
| `SUPABASE_SECRET_KEY` (`sb_secret_`, never `NEXT_PUBLIC_`) | PROD key `vercel-app` | TEST key `vercel-app` | local | TEST key `ci-e2e` | worker key `worker` (Track K) | Phase 2 (app), Track K (worker) |
| `AUTH_PROVIDER` (mirrored to `NEXT_PUBLIC_AUTH_PROVIDER` by `next.config.ts` `env`, so they can never differ) | `clerk` → `supabase` at T-0 | `clerk` → `supabase` at TEST cutover | either | matrix | - | 0A → removed Phase 5 |
| Global Config (formerly Edge Config) store items `maintenance_prod`, `maintenance_test`, `banner_prod`, `banner_test` (+ `GLOBAL_CONFIG` connection string; Hobby allows ONE store per account, so PROD and TEST share the store and differ only by key suffix; https://vercel.com/docs/global-config/migration-guide) | yes | yes | unset (env fallback `MAINTENANCE_MODE`) | unset | - | Phase 2 |
| `MAINTENANCE_BYPASS_TOKEN` (≥32 chars; bypass is disabled when unset) | set | set | unset | unset | - | Phase 2 |
| `REVALIDATE_SECRET` | random | random (different) | dev value | test value | same value per env | 0A |
| `REDIS_KEY_PREFIX` | `prod` | `test` | `dev-<name>` | `ci` | - | 0A |
| `PADDLE_CUSTOM_DATA_SECRET` | random | random | dev value | test value | - | 0B |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | PROD widget (`www.quicktalog.app`) | TEST widget (real, not always-pass; hostnames `test.quicktalog.app`, exact preview aliases, `localhost`) | real TEST widget when pointing at TEST; Cloudflare test key only against the local stack (captcha disabled in `config.toml`) | local stack: test key; e2e against TEST: real TEST widget site key. UI sign-in tests use the test key only on the local stack; tests that need a signed-in TEST user use admin `generateLink` + `verifyOtp` (not captcha-gated). Cloudflare test keys produce a dummy token that real secret keys reject (https://developers.cloudflare.com/turnstile/troubleshooting/testing/) | - | Phase 2 |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth`, `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth?mode=signup` | set | set | set | set | - | 0A → Phase 5 |
| `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `E2E_CLERK_USER_*` | until Phase 5 | until Phase 5 | until Phase 5 | until R2 closes (Clerk e2e leg) | - | Phase 5 |
| `E2E_USER_EMAIL`, `E2E_USER_PASSWORD` | - | - | `.env.test.local` | TEST env | - | Phase 2 |
| `WORKER_ADMIN_TOKEN` | - | - | - | - | per env | 0A |
| `JOBS_PAUSED` | - | - | - | - | `false`; `true` during re-key | 0A |
| Vault `edge_webhook_secret` (replaces sending `service_role_key`) | PROD | TEST (only after M02) | - | - | - | Track K |
| `SUPABASE_ACCESS_TOKEN` (Management API) | - | - | operator | - | - | Phase 2 (`scripts/supabase/auth-config.ts`) |

Terms version lives only in `private.settings.terms_version` (read through `private.current_terms_version()`), never in an env var.

### 2.6 Access-path rules per call-site category

| Category | Call sites (today) | Required path | Rules |
|---|---|---|---|
| Owner reads/writes | `actions/catalogue.ts`, `actions/themes.ts`, `actions/qr-configs.ts`, `actions/users.ts`, `lib/users/fetchUserData.ts`, `app/api/dashboard/*`, `app/admin/[name]/*` pages | `const me = await requireIdentity()` then **one** `withUser(me, tx => ...)` | **Every statement keeps an explicit owner predicate** (`created_by = me.userId`) in addition to RLS (defence in depth; enforced by a unit test on generated SQL). Read `.returning()` lengths (RLS-blocked UPDATE/DELETE affect 0 rows silently). Entitlements run inside the same transaction. Redis, `revalidate*`, emails run **after** commit using DB-returned names/ids. |
| Public reads | `app/api/items*`, `app/catalogues/[name]/page.tsx:14,52,113`, `app/sitemap.ts:11` | `lib/catalogue/public.ts` (`withPublic`) | Never read cookies or identity. Always `PUBLIC_CATALOGUE_COLUMNS` (`select *` gives 42501). `status='active'` is enforced by policy and query. 404 on miss. |
| Public writes | `actions/newsletter.ts` (callers `CatalogueFooter.tsx:42-46`, `Footer.tsx:31`) | IP rate limit, zod, then `withPublic` → `private.subscribe_*` | No `ownerId` parameter. Constant `success` response. |
| Cross-tenant fixed-shape checks | slug checks `actions/catalogue.ts:151,187`, `hooks/useCatalogueName.ts:91` | `checkCatalogueName` action: `requireIdentity` + rate limit + `withUser` → `private.catalogue_name_available` | Unique index stays the final guard; map 23505 to `name_taken`. |
| Editor drafts (Redis) | builder, qr-editor, preview pages, `DashboardItem.tsx:35-62` | `readOwnedDraft(me, name)`: DB row under `withUser`, then Redis overlay **keyed by catalogue id**, server fields forced from the row | Redis never decides ownership. |
| AI agent / assist | `app/api/agent/route.ts`, `actions/ai.ts` | Identity once before streaming, then short `withUser` blocks (section 4.8) | Never call `cookies()`/`auth()` inside tool `execute` or `onFinish`. |
| Billing webhook | `utils/paddle/process-webhook.ts`, `app/api/paddle/route.ts` | `asAdmin("paddle:<event>")`, one tx per event, idempotency row | Rethrow. Signed `customData`. Plan changes only where `users.customer_id` = event customer. 503 while maintenance is on. |
| Clerk webhook, provisioning (Clerk period) | `app/api/clerk/route.ts`, `lib/users/syncFromClerk.ts`, `fetchUserData.ts:46-74` | `asAdmin` via `lib/users/provision.ts` | Upsert sets only `email, name, image`; `user.deleted` cancels Paddle first. Deleted in Phase 5. |
| Account deletion (Supabase period) | new `actions/account.ts` | `requireFreshUser()` → cancel Paddle → `authAdmin().deleteUser` → M10 trigger | Abort if Paddle cancel fails. |
| Worker | `../quicktalog-backend` | service key over PostgREST | Computes usage itself; authenticated HTTP routes; `JOBS_PAUSED`. |
| Tests, scripts | `tests/e2e/helpers/cleanup.ts`, `scripts/**` | `DATABASE_ADMIN_URL` / `MIGRATION_DATABASE_URL` | Refuse the PROD ref unless `ALLOW_PROD=1`. |

### 2.7 How RLS reads identity, before and after cutover

```sql
create or replace function private.current_user_id() returns text language sql stable set search_path = ''
as $$ select nullif((nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb) ->> 'sub', '') $$;
```

| | Clerk period (Phases 0-3) | Supabase period (Phase 4+) |
|---|---|---|
| Who verifies | `auth()` from `@clerk/nextjs/server` (verified by `clerkMiddleware`) | `supabase.auth.getClaims()` (local ES256 verification via JWKS) |
| `sub` written by `withUser` | `user_2abc...` | `0f8e...-...` (uuid as text) |
| Policy text, grants, roles | identical | identical |
| Ownership columns | text Clerk ids | text uuid strings after the re-key |
| What changes at cutover | `AUTH_PROVIDER` and the data re-key only | |

Rules: policies call `(select private.current_user_id())` so it is an InitPlan (PGlite `EXPLAIN` confirmed); claims are bound parameters in one `set_config` statement; the token never chooses the role; `user_metadata`/`app_metadata` are never copied into claims; an empty or missing `sub` matches nothing (PGlite: fail closed).

### 2.8 How rules that are not ownership are protected against direct Data API use

Direct Data API use is impossible for app data after M00 (zero grants for `anon`/`authenticated`, PGlite perimeter 168/168 denied). The only roles that hold app grants are reachable only by server code holding `DB_CONNECTION_STRING`. So the DB enforces invariants that must survive app bugs, and TypeScript enforces plan logic.

| Rule | DB enforcement (survives app bugs) | TS enforcement (same `withUser` tx) |
|---|---|---|
| Plan escalation (`plan_id`, `customer_id`, `email`, `consents`, `id`) | No `app_user` UPDATE on those columns (only `name`, `cookie_preferences`) | Entitlements read from `users.plan_id` only |
| Ownership reassignment / slug rename | No UPDATE grant on `id, name, created_by, created_at, source`; WITH CHECK pins `created_by`; insert trigger pins `id`/timestamps | `pickEditable()` |
| Catalogue count per plan | - | `getPlanForUpdate` (row lock) + `assertCatalogueQuota` |
| Create/duplicate straight to `active` | INSERT WITH CHECK `status in ('draft','in preparation')`; status CHECK | insert `status:'draft'` |
| Activation over traffic limit | - | `assertCanActivate` on publish and re-activation |
| Branding / newsletter per plan | - | `applyPlanToCatalogue` on create, update, publish **and re-activation**; `applyPlanDowngrade` in the Paddle cancel/downgrade handler (deactivates over-quota catalogues, strips paid header/footer features) |
| Sections/items per plan | content size CHECK | `assertContentWithinPlan` (growth-only) |
| AI quota | Ledger writable only by definers; `turn_id` unique; FK `ON DELETE SET NULL`; month in SQL; per-user row lock; continuation bound to a server-recorded open plan (turn id + plan hash + budget ≤ 8); refund cap per month | limit from `tiers` |
| Newsletter spoofing / oracle | No INSERT grant; definer derives owner and requires `active` + `footer.newsletter`; unique `(catalogue_id, lower(email))` | rate limit, constant response, CSV export escaping |
| Slug enumeration / format | No cross-tenant SELECT; one boolean per call; slug CHECK (M07) | rate limit, `toSlug` |
| Draft leakage | `app_public` sees only `active`, never `created_by` | `lib/catalogue/public.ts` |
| QR config tampering | `qr_configs_owner` USING + WITH CHECK; unique per catalogue; size CHECK | `requireIdentity` |
| Oversized JSON | size CHECKs on content, colors, config, cookie prefs, plus a row cap on the other catalogue jsonb columns (M07) | Next 1 MB action body limit |
| Author HTML/CSS | not a DB rule | `sanitizeAppearance`, `HtmlContent` allowlist, `CustomCode.tsx:202` sandbox without `allow-same-origin` (unit test) |
| Paddle linking / replay | `private.paddle_events` PK; `private.paddle_unresolved_events` | signed `customData`, rethrow, `occurred_at` ordering |

---

## 3. Decision record: how the app talks to the database

### 3.1 Correcting the framing

The question was "ORM only (Drizzle via `DB_CONNECTION_STRING`), supabase client (publishable + secret keys), or hybrid". Four premises behind it do not hold for this codebase:

1. **Every viable option is a hybrid.** Supabase Auth exists only in supabase-js. The Paddle webhook, account deletion (`auth.admin.deleteUser` needs the secret key), e2e cleanup and the worker have no end user and must bypass RLS whatever you pick. The real question is how **user and visitor** traffic reaches Postgres.
2. **"ORM only via DB_CONNECTION_STRING" is today, and today has no RLS.** `DB_CONNECTION_STRING` logs in as `postgres` (BYPASSRLS). Enabling RLS changes nothing for the 39 Drizzle references until each request switches to a non-bypass role inside a transaction.
3. **Keys are not access paths.** The publishable key acts as `anon`, or as `authenticated` when a user JWT is attached; its power is exactly those roles' grants and policies. The secret key acts as `service_role` (BYPASSRLS), as powerful as `DB_CONNECTION_STRING`, just over HTTP.
4. **Avoiding supabase-js does not avoid the Data API.** After the move to Supabase Auth every signed-in user holds a JWT that PostgREST accepts with the public publishable key. Anything granted to `authenticated` becomes a public API, including a Drizzle wrapper that switches into `authenticated`.

### 3.2 Options compared

| Option | What it means here | Who enforces plan rules | Public surface for a signed-in user |
|---|---|---|---|
| **1. ORM only, as today** | Drizzle as `postgres` everywhere | App code only; RLS inert | Whatever `anon` grants remain |
| **1b / A. ORM + standard roles** | Drizzle wrapper `SET ROLE authenticated/anon` with claims | Must move into PL/pgSQL (copy of `tiers`, jsonb counting, normalising triggers), because every grant is callable via PostgREST | Every `authenticated` grant (e.g. UPDATE catalogues) |
| **2 / C. supabase-js first** | Rewrite data access to PostgREST + RPCs | Same as A, plus an RPC per multi-statement operation | Same as A |
| **3. Hybrid: supabase-js for user CRUD, Drizzle admin for system writes** | Two query APIs, two type systems | Split across both | Same as A |
| **4. App-layer only** | Keep Drizzle as `postgres`, revoke all anon/authenticated grants | App code only | none, but no containment of app bugs (IDORs stay possible) |
| **B. ORM + private app roles (chosen)** | Drizzle wrapper `SET ROLE app_user/app_public`, roles unreachable from PostgREST; `anon`/`authenticated` zero grants | TypeScript (`tiers`) inside the same tx, plus DB invariants | none |

### 3.3 Scores (judge, weighted 0-10)

Source: the judge's decision record, `decision/architecture-decision.md`.

| Proposal | Security | Correctness for this repo | DX / maintainability | Serverless fit | Migration effort / risk | Future flexibility | **Total** |
|---|---|---|---|---|---|---|---|
| A: Drizzle into standard `authenticated` | 7 | 7 | 5 | 7 | 4 | 8 | 6.35 |
| **B: private app roles** | **8.5** | 6.5 | 7 | 7 | **7** | 5.5 | **7.13** |
| C: supabase-js first | 6.5 | 5.5 | 5 | 7.5 | 3 | 8 | 5.98 |

Options 1, 3 and 4 were not scored numerically: 1 provides no RLS, 3 inherits A's public surface with two privileged paths, and 4 is kept as B's first step (M00) but does not contain app bugs on its own. B's correctness score was raised by the grafts it adopted (table-level INSERT plus pin trigger, global default-privilege revoke, etc.) and by the PGlite fixes.

### 3.4 Why B

- It removes the core tension instead of mitigating it: a signed-in user's JWT reaches nothing through PostgREST, so plan rules stay in one place (`tiers`) and Drizzle keeps real transactions.
- The private helper is required, not stylistic: custom roles cannot use `auth.jwt()` (TEST schema ACL).
- Policies survive the cutover unchanged, so RLS on the app's own queries arrives **before** the auth migration (user goal 2 does not wait for goal 1).
- Lowest effort and risk for the data layer (39 existing Drizzle references keep their shape).
- Fail-closed end state (`app_rls` login owns nothing).

**Confirmed by the owner (2026-09-17)** against three requirements for the data layer:

| Requirement | How B meets it |
|---|---|
| Enforce RLS like the Supabase client does | The `withUser`/`withPublic` wrapper sets the role and the verified user id per transaction, the same mechanism PostgREST uses; policies apply to every Drizzle query, and a query outside the wrapper gets 42501 after M08 |
| Migrations handled like the Supabase CLI | All schema, policy and function changes are Supabase CLI migrations (`supabase migration new`, `supabase db push` to TEST, then PROD); `drizzle-kit pull` only refreshes TypeScript types, `drizzle-kit push/migrate` are never used |
| camelCase in the app, snake_case in the DB | Built into Drizzle: the schema declares `createdBy: text("created_by")`, and `drizzle-kit pull` generates camelCase keys by default |

A supabase-js-only layer with a custom camelCase wrapper was considered and rejected: it would need top-level-only key mapping (jsonb columns hold app JSON), mapped filter/select column names, plan rules rewritten in SQL, RPC functions for every multi-statement operation, and it leaves the Data API open to every signed-in user (option C / 3 in 3.2).

### 3.5 Rejected alternatives

| Alternative | Why rejected |
|---|---|
| A: Drizzle into `authenticated`/`anon` | Every grant becomes a public API; plan rules would be duplicated in PL/pgSQL with permanent drift; about twice the SQL for a larger attack surface. |
| C: supabase-js/PostgREST first | Rewrites 39 working references into a second type system, no interactive transactions, `max_rows` truncation, same public surface as A, RLS on app queries only after cutover. |
| 3: supabase-js CRUD + Drizzle admin | Two privileged surfaces, two query APIs, two type systems. |
| 4 alone | Used as M00, but does not contain IDORs such as `getUserData(userId)`. |
| Clerk third-party auth into PostgREST before cutover | 60s Clerk tokens vs 50s agent turns, MAU cost, thrown away at cutover. |
| Turning the Data API off now | The worker needs PostgREST with a service key. Revisit after the worker moves to direct Postgres. |
| Converting ids to `uuid` | Requires dropping/recreating the `contacts`/`active_subscriptions` views and a two-phase type change; text ids + uuid CHECK give the same fail-loud property. |

**Escape hatch** for a future browser, Realtime or Storage need: open **one** table to `authenticated` only after moving that table's non-ownership rules into triggers or definer functions; reuse `private.current_user_id()` (grant USAGE on `private` and EXECUTE on the helper to `authenticated`); add the table to the perimeter test allowlist. For Realtime prefer Broadcast with `realtime.messages` policies; for Storage prefer server-issued signed upload URLs.

---

## 4. RLS design

### 4.1 Access matrix (after M00-M06)

Legend: **own** = owner column equals `(select private.current_user_id())`; **fn** = only through the named definer function; **-** = no privilege (42501); **bypass** = BYPASSRLS role.

| Table | Command | `app_user` | `app_public` | `postgres` (asAdmin) | worker | `anon`/`authenticated` |
|---|---|---|---|---|---|---|
| users | SELECT | own row | - | bypass | bypass | - |
| users | UPDATE | own row; columns `name`, `cookie_preferences` only | - | bypass | bypass | - |
| users | INSERT/DELETE | - | - | bypass; M10 definer triggers | bypass | - |
| catalogues | SELECT | own rows, any status | `status='active'`, all columns except `created_by` | bypass | bypass | - |
| catalogues | INSERT | `created_by = me` and `status in ('draft','in preparation')`; `id`/timestamps pinned by trigger | - | bypass | bypass | - |
| catalogues | UPDATE | own rows; columns `logo, heading, status, language, currency, business_type, content, legal, appearance, contact, header, footer, partners, metadata, tags, updated_at`; WITH CHECK `created_by = me` | - | bypass | bypass | - |
| catalogues | DELETE | own rows (FK: qr_configs/newsletter cascade; prompts/ocr SET NULL) | - | bypass | bypass | - |
| qr_configs | ALL | rows for my catalogue names (USING + WITH CHECK); UPDATE `config, updated_at`; one per catalogue | - | bypass | bypass | - |
| user_themes | ALL | `user_id = me`; UPDATE `name, colors, updated_at` | - | bypass | bypass | - |
| analytics, ocr | SELECT | own | - | bypass | bypass | - |
| prompts | SELECT | own | - | bypass | bypass | - |
| prompts | INSERT/UPDATE | **fn** `begin_ai_turn`, `refund_ai_turn`, `set_plan_state` | - | bypass | bypass | - |
| newsletter | SELECT | own (`owner_id`) | - | bypass | bypass | - |
| newsletter | INSERT | **fn** `subscribe_catalogue_newsletter` | **fn** same | bypass | bypass | - |
| product_newsletter | INSERT | **fn** `subscribe_product_newsletter` | **fn** same | bypass | bypass | - |
| subscriptions, plans, job_logs, views `contacts`/`active_subscriptions` | all | - | - | bypass | bypass | - |
| `private.*`, `migration.*` | all | only via granted functions | only via granted functions | owner | - | - (schemas not exposed, no USAGE) |

Function EXECUTE: `current_user_id`, `catalogue_name_available`, `my_usage`, `begin_ai_turn`, `refund_ai_turn`, `set_plan_state`, `claim_welcome_email`, `record_consents` → `app_user`; `subscribe_*`, `current_terms_version` → `app_user`, `app_public`; auth trigger functions and `create_user_row` → nobody; PUBLIC → nothing in `private`.

### 4.2 Migration inventory (full SQL in Appendix A)

| # | File name | Phase | Apply when (gate) | Behaviour change for code running at that time | Verification |
|---|---|---|---|---|---|
| **M00** | `perimeter_close` | 0A | Phase 0A code live 24h in that env; no anon `/rest/v1` traffic in logs; PROD: `test` merged, edge functions checked, exposure audit saved | anon/authenticated lose every privilege; RLS on all 12 tables | PGlite-verified (final run): C1, today's grants, 177/177 PostgREST requests denied, idempotent |
| M01 | `app_roles_private_schema` | 1 | PROD PG ≥16 confirmed | none | PGlite-verified (final run): P2, P3, idempotent |
| M02 | `edge_functions_per_project` | 1 | PROD confirms seeded `edge_functions_base_url` right after apply | Brevo fires only on email/name/plan_id/customer_id; TEST never posts to PROD; a malformed base URL fails on write (W6) | PGlite-verified (final run), incl. W6 |
| M03 | `integrity_constraints_ai_ledger` | 1 | PROD audits: status values, `octet_length` sizes, duplicates, null ledger users, forged newsletter owners | today's `meter()` starts succeeding (quotas start counting); catalogue delete keeps charges; case-variant newsletter duplicates hit 23505 in today's action (ship P1 newsletter action together) | PGlite-verified (final run): P3, C2-C4; header comment corrected (W8) |
| M04 | `app_role_grants_policies` | 1 | M00 applied (the migration asserts it) | `updated_at` touched on every catalogue UPDATE | PGlite-verified (final run): C5, owner matrix |
| M05 | `private_entry_points` | 1 | with M04 | none (new functions) | PGlite-verified (final run): C6, C7 |
| M06 | `ai_turn_plan_binding` | 1 | with M05, before Phase 1 code | none (replaces unused functions) | PGlite-verified (final run): C8 |
| M07 | `validate_after_audit` | 1 | PROD audit shows zero violations | oversized rows and bad slugs rejected on write | PGlite-verified (final run): C9 |
| M08 | `app_rls_login_role` | 1 (end) | Phase 1 code soaked; then switch `DB_CONNECTION_STRING` | none until the switch | PGlite-verified (final run): P4; Supavisor acceptance on TEST only |
| M09 | `edge_webhook_secret` | Track K | edge functions accept `x-webhook-secret` | webhooks stop sending the service_role key once the Vault secret exists | PGlite-verified (final run): C10, incl. W7 |
| M10 | `auth_users_sync` | 2 | Supabase sign-ups disabled; `default_plan_id` exists in `plans` | none until `auth.users` gets rows; consents default becomes not-accepted; `public.users` rows only for confirmed email addresses (W1) | PGlite-verified (final run): P5, C11, incl. W1, W2; trigger DDL under supautils only on the local stack and TEST |
| R1 | `scripts/cutover/remap-user-ids.sql` (runbook, not a migration) | 4 | maintenance window | re-keys `users.id` (cascades) | PGlite-verified (final run): C12, incl. W9; 7 precondition aborts; rollback and re-cutover |
| M11 | `users_id_uuid_check` | 4 | right after R1 commits | records the NOT VALID CHECK in migration history | PGlite-verified (final run): idempotent |
| M12 | `validate_users_id_uuid` | 5 | orphan triage done (T+30) | legacy ids rejected everywhere | PGlite-verified (final run): 23514 before orphan triage, validates after |
| M13 | `post_cutover_cleanup` | 5 | retention period agreed | drops backups and scratch tables; minimises the map (kept permanently) | PGlite-verified (final run), incl. W3 |

Author and apply with the Supabase CLI only (`supabase migration new`, `supabase db push --linked --dry-run`, then `supabase db push --linked --skip-vault`; without `--skip-vault`, `db push` also writes Vault secrets from `config.toml`). Never `drizzle-kit push/generate`.

### 4.3 Policies, grants and helpers in one paragraph each

- **Grants.** INSERT is table-level because Drizzle lists every column and emits `default` (`node_modules/drizzle-orm/pg-core/dialect.js:356-392`); a BEFORE INSERT trigger pins `id`, `created_at`, `updated_at` for `app_user`. UPDATE is column-level. `app_public` SELECT on catalogues is column-level without `created_by`.
- **Policies.** One permissive policy per role and command, always `TO app_user` or `TO app_public`, always `(select private.current_user_id())`. `app_user` never sees other owners' active catalogues, so "a row came back" means "owned".
- **Definers.** All in `private`, owned by `postgres`, `security definer set search_path = ''`, every name qualified, EXECUTE revoked from PUBLIC and granted per role. A global `alter default privileges for role postgres revoke execute on functions from public` covers future functions (TEST has no global entry, so the per-schema form would not work).
- **Server-owned columns.** `private.catalogues_pin_insert` and `private.touch_updated_at` triggers.
- **Roles.** `postgres` gets SET-only membership. `createrole_self_grant='set'` first; the fallback GRANT checks ADMIN OPTION and fails with an actionable message (P2).

### 4.4 Constraint and data fixes

| Fix | Why | Migration |
|---|---|---|
| `catalogues.status` CHECK (5 values), validated | status was unvalidated (`actions/catalogue.ts:105`); public policy keys on it | M03 |
| jsonb size CHECKs (content 1 MiB, colors 4 KiB, QR 64 KiB, cookie prefs 2 KiB) NOT VALID, validated after audit | owners can write these directly; limits are product decisions | M03, M07 |
| Row cap for other catalogue jsonb columns; slug format CHECK | invariants for URL/Redis/revalidate keys and oversized payloads | M07 |
| Dedupe + unique `newsletter(catalogue_id, lower(email))`, `product_newsletter(lower(email))`, `qr_configs(catalogue)` with backups | ON CONFLICT instead of racy pre-checks | M03 |
| Remove newsletter rows whose `owner_id` differs from the catalogue owner (backup first) | forged rows injected through today's client-trusted `ownerId` | M03 (C3) |
| Drop `prompts UNIQUE(catalogue)`; prompts/ocr catalogue FK → `ON DELETE SET NULL`; `user_id NOT NULL`; `turn_id` unique with default; `continuations`, `refunded_at` | AI metering defects | M03 |
| `prompts.kind`, `plan_open`, `plan_budget`, `plan_hash` | server-authoritative continuations | M06 |
| `private.paddle_events`, `private.paddle_unresolved_events` | idempotency and a review queue instead of infinite retries | M03 |
| `users.welcome_email_sent_at`; consents default not-accepted; legacy rows marked `source: legacy_default` | welcome email once; consent never recorded by default | M10 |
| `users_id_is_uuid` CHECK (NOT VALID at cutover, validated at T+30) | a stale Clerk id written back fails loudly | R1/M11, M12 |

### 4.5 Testing summary (details in section 11, results in Appendix D)

- **PGlite, first run (done):** 475 scenarios on the drafts; the drafts as written failed 19, the patched SQL failed 4, and those 4 are not fixable by a migration (temp-table shadowing needs the TS wrapper change adopted here; pg_net ACLs are owned by `supabase_admin`). Real `drizzle-orm` SQL for every converted call site: 96/96 pass (Clerk ids, uuid ids, `app_rls` login). Details: `verification/pglite-results.md`.
- **PGlite, final run (done, 2026-09-17):** every Appendix A block as written in this plan, byte-identical to the plan text, applied in phase order (M00, M01-M06, M07, M08, M09, M10, import emulation, A.R1, M11, a cutover window with activity, A.R2, re-cutover, M12, M13, A.14 in reverse in three variants, A.15/A.16 in four states) on PostgreSQL 17.5 and 18.3. 692 scenarios per engine, including the owner matrix under the `postgres` login (124), under the `app_rls` login (152) and again under `app_rls` with uuid ids after the re-key, real `drizzle-orm` 0.45.2 SQL with the B.3 wrapper, and the C1-C12 scenarios of D.3. As written: 15 failures on both engines from 9 defects; with CHANGE W1-W9 applied: 0 failures on both (D.3). Statement-mode SQL errors in M00-M10: 0. Details: `verification/final-sql-results.md`; reproduce with `verification/pglite-harness/run-final.sh` (about 40 s).
- **Not covered by PGlite:** `statement_timeout` cancellation, real concurrency (`begin_ai_turn` lock race, lock blocking; C7 was checked through tuple lock bits only), Supavisor, PostgREST/GoTrue/pg_cron live behaviour (emulated by role switches), supautils (for example trigger DROP on `auth.users`), PROD data. These are covered by the integration tests in section 11 on a local Supabase stack and on TEST.
- **pgTAP** (`supabase/tests/database/`): `00_perimeter`, `10_catalogues`, `15_clerk_ids` (deleted with M11), `20_users_usage`, `30_qr_themes_newsletter`, `40_ai_ledger`, `41_ai_plan_binding`, `45_integrity`, `50_auth_triggers` (includes: `postgres` can drop and re-create the M10 triggers on the local stack), `55_remap`, `60_edge_functions`. Each file grants the app roles USAGE **and EXECUTE** on `extensions` inside the rolled-back transaction (PGlite F10).

### 4.6 Supabase advisor expectations

| After | Security | Performance | Action |
|---|---|---|---|
| today (TEST) | 0013 `rls_disabled_in_public` on users, catalogues, subscriptions, analytics, newsletter | 0005 on `subscriptions_price_id_idx`, `users_plan_id_idx` | baseline |
| M00 | 0013 cleared; 0008 `rls_enabled_no_policy` (INFO) on all 12 tables | unchanged | expected until M04 |
| M03 | - | 0005 INFO on the new indexes until used; 0001 must stay clear | expected |
| M04 | 0008 remains only on subscriptions, job_logs, plans, product_newsletter (intentional); 0006 must not appear | - | document 0008 as accepted |
| M05-M13 | none new (`private`/`migration` not exposed) | - | - |

Advisor 0003 cannot see `private.current_user_id()`; the `(select ...)` wrapper is enforced by a CI catalog query (`pg_get_expr(polqual)` must contain `SELECT private.current_user_id()`). Also run the `00_perimeter` catalog queries against TEST and PROD after every migration: `supabase_admin` has default ACLs granting `anon`/`authenticated` ALL on objects it creates in `public` (TEST), which `postgres` cannot change.

### 4.7 Performance, pooling and timeouts

- **Round trips:** a `withUser` block is BEGIN + one `set_config` statement + N queries + COMMIT (~3 extra RTT). Group each action into one block. `private.my_usage()` replaces 4 queries. Agent start is ~4-5 RTT.
- **Region:** co-locate Vercel functions with PROD: set `"regions": ["fra1"]` in `vercel.json` (Hobby allows exactly one region; the new-project default is `iad1`, so check Settings > Functions today; https://vercel.com/docs/functions/configuring-functions/region). TEST (eu-west-1) is then about 20 ms from `fra1`, which is acceptable. The project's current region is (unverified): the quicktalog project was not reachable from the checked Vercel account.
- **Pools:** per warm instance user `max: 3`, admin `max: 2`, `idle_timeout 5s`, `max_lifetime 600`, lazy creation (bundle-analysis CI builds with no env). `app_rls` CONNECTION LIMIT 40; TEST `max_connections = 60`; Supavisor pool size per (db, user) for a custom login role is (unverified) → load smoke after M08.
- **Timeouts:** `SET ROLE` does not apply `ALTER ROLE ... SET` (PGlite), so the wrapper sets `statement_timeout` (8s user / 3s public), `lock_timeout` (3s / 1s) and `idle_in_transaction_session_timeout` per transaction. Cancellation itself is (unverified: PGlite does not enforce it).
- **Locks:** `begin_ai_turn` and `getPlanForUpdate` take `FOR NO KEY UPDATE` on the caller's `users` row (C7): it serialises one user's charges without blocking FK key-share locks from inserts into child tables.
- **Indexes behind policies:** `users_pkey`, `catalogues_created_by_idx`, `qr_configs_catalogue_key`, `user_themes_user_id_name_key`, `analytics_user_id_date_idx`, `prompts_user_datetime_idx`, `ocr_user_id_idx`, `newsletter_owner_id_idx`. Add `catalogues(name) where status='active'` only if sitemap/static params get slow.
- **Error payloads:** `DrizzleQueryError.message` embeds `params:` (claims JSON, emails); the Sentry scrubber strips it.

### 4.8 AI agent under the 60s Hobby limit

The 60 s ceiling is the route's own `export const maxDuration = 60` (`app/api/agent/route.ts:13`), or Fluid compute being off; with Fluid compute on, Hobby allows up to 300 s (https://vercel.com/docs/functions/limitations). The design keeps every turn under 60 s either way.

- Identity is resolved once, before streaming (`getVerifiedIdentity()`), and captured as a plain object. Postgres never checks `exp` on this path.
- **Start (one short tx):** `getPlanForUpdate` + `private.begin_ai_turn(catalogue, limit, kind, continuationOf, planHash)`. The charge happens **before** any model spend; a function killed at 60s stays charged.
- **Continuation is free only if** the client sends the turn id it received in stream metadata **and** the hash of the plan it resumes, **and** the DB holds that user's open agent plan on that catalogue younger than 15 minutes with `continuations < plan_budget` (≤ 8, matching `MAX_PLAN_CONTINUATIONS`). Anything else is charged.
- **Mid-stream theme save:** its own `withUser` block through a `saveTheme` port.
- **onFinish (own short tx):** if the turn left an unfinished plan → `set_plan_state(turn, open, pendingTasks, hash)`; if a charged turn changed nothing and opened no plan → `refund_ai_turn` (capped per month).
- `body.catalogue.name` must equal `body.catalogueName` (400 otherwise).
- Any future `ai_credits` ledger (`plans/active/ai-agent-plan-mode.md` Part 2) must use server-minted turn ids through a definer; its current client-minted `turnId` design is superseded.

---

## 5. Phased plan

### 5.0 Phase map and gates

| Phase | Name | Environments in order | User-visible | Gate to leave |
|---|---|---|---|---|
| **0A** | Stop the bleeding (Clerk, app + worker, M00) | TEST → merge `test`→`main` → PROD | No | **G0A:** M00 live on TEST and PROD; perimeter test denies everything; exposure audit recorded |
| **0B** | Integrity and billing hardening (Clerk) | TEST → PROD | No | **G0B:** Paddle sandbox lifecycle passes with signed `customData`; unit tests green |
| **K** | Legacy API key exit (parallel track) | TEST → PROD | No | **GK:** worker and DB webhooks no longer use legacy keys; legacy keys disabled before the Supabase shutdown date |
| **1** | DB layer + RLS on Clerk, ends with `app_rls` | local → TEST → PROD | No | **G1:** pgTAP + PGlite + integration green; forgotten-wrapper test gives 42501 on TEST and PROD |
| **2** | Supabase Auth built dark | local → TEST preview → PROD (flag `clerk`) | No | **G2:** auth flows pass on TEST preview; perimeter with a real user JWT denies everything; PROD unchanged 72h |
| **3** | Import + re-key rehearsals, PROD dark import | local fixtures → TEST full cutover + rollback drill → PROD dark import | TEST users only | **G3:** rehearsal green in CI; TEST cutover, rollback and re-cutover verified; PROD reconciliation holds |
| **4** | PROD cutover | PROD | **Yes (one re-login)** | **G4:** smoke tests + 24h monitoring without a rollback trigger |
| **5** | Decommission Clerk | TEST → PROD | No | **G5:** `grep -ri clerk` finds only history; M12, M13 applied |

**Crosswalk to earlier documents** (their numbering conflicts; use this plan's):

The last four columns are the earlier documents: the decision record (`decision/architecture-decision.md`, section 14) and three earlier drafts (not included; superseded by this plan): the identity-cutover draft, the app-changes draft and the SQL draft, whose migration files were numbered 01-10 plus a RUNBOOK.

| This plan | Decision record §14 | Identity-cutover draft | App-changes draft | SQL draft (files) |
|---|---|---|---|---|
| 0A | 0 + M2 of 3 | part of 0 | part of P0 + early M2 | 06 (perimeter half) |
| 0B | security items of 2 | part of 0 and 1 | P0 | - |
| K | part of 7 | part of 5 (T+30) | P5 | - |
| 1 | 1, 2, 4 | 1 | P1 | 01-05, 06 (validate half), 07 |
| 2 | 5 | 2 | P2 | 08 |
| 3 | 6 (prep) | 3 | P3 | RUNBOOK rehearsal |
| 4 | 6 | 4 | P4 | RUNBOOK, 09 |
| 5 | 7 | 5 | P5 | 10 |

### 5.1 Phase 0A: Stop the bleeding

**Goal:** close S1-S6 and S12-S17 within days, on today's Drizzle client, with no new DB roles.

**Entry:** none. Decision needed first: merging `test` into `main` (39 commits) is acceptable (input 1).

**Steps:**

1. **PROD read-only preflight and exposure audit** (you run it; `scripts/audit/preflight.sql` and `scripts/audit/exposure-audit.sql`, Appendix A.15-A.16). Record:
   - PG version, `supabase_migrations.schema_migrations`, anon/authenticated grants and default privileges, functions executable by anon, constraint names, `analytics_upsert_trigger`, duplicates, null ledger users, Vault secret **names** and key format, `cron.job`.
   - Exposure audit: paid plans without an active subscription; subscriptions unknown to Paddle; newsletter rows whose owner differs from the catalogue owner; analytics rows for users without catalogues or with outlier counts; catalogues whose owner was created after the catalogue.
   - Supabase Logs Explorer: `/rest/v1/*` requests with non-GET methods over the retention window (ClickHouse query in A.16, verified on TEST; one 24 h window per query).
2. **Lock Supabase Auth on both projects:** sign-ups off, anonymous sign-ins off (dashboard). Nobody uses Supabase Auth yet.
3. **Establish the PROD migration mechanism:** `supabase link --project-ref <ref>`, `supabase migration list --linked`, `supabase db diff --linked`. If PROD lacks the 4 baseline versions but the schema matches, `supabase migration repair --linked --status applied <version>` for those 4 only. If the schema does not match, stop and reconcile by hand (input 8).
4. **App code on `test`** (one PR per bullet):
   - New modules (Appendix B): `utils/db/{pool,admin,errors,columns}.ts`, `lib/auth/{identity,session,provider,redirects}.ts` (Clerk branch), `lib/http/secret.ts`, `lib/rate-limit.ts`, `lib/observability/sentry-scrub.ts`, `lib/users/provision.ts`. Add `server-only`, `zod` and `@upstash/ratelimit@^2.1.0` as direct dependencies, and bump `@upstash/redis` to `^1.38.2` in the same PR (peer requirement of `@upstash/ratelimit` 2.1.0; 1.38.0 is installed). Add `DATABASE_ADMIN_URL` (same value as `DB_CONNECTION_STRING` for now) and `AUTH_PROVIDER=clerk`.
   - **Move every supabase-js data call off `anon`:**
     - `utils/paddle/process-webhook.ts:62-243` → `asAdmin`; **remove the catch-all at `:44-50`** so `app/api/paddle/route.ts` returns 500 and Paddle retries. Removing the catch-all is not enough on its own: in the `asAdmin` rewrite every `if (error) { Sentry...; return; }` branch (`:91-97, :112-122, :140-146, :157-167, :176-183, :197-204, :225-230`) becomes a throw; the unlinked-customer skip (`:79-85`) stays a logged 200 until 0B's unresolved queue. Email linking stays until 0B but is case-insensitive and only when exactly one user matches.
     - `app/api/clerk/route.ts:51` and `lib/users/syncFromClerk.ts:142,171` → `upsertClerkUser` (`on conflict (id) do update set email, name, image` only) and `deleteClerkUser`; welcome email via `after()`.
     - `lib/users/fetchUserData.ts:46-74` → delete the anon on-demand sync; `ensureUserRow` via `asAdmin` with `on conflict do nothing`.
     - `app/api/dashboard/analytics/route.ts:6-49` → Drizzle, `user_id = me` / `owner_id = me`, 401 without identity.
     - `app/api/items/route.ts:6-53` → Drizzle `select name ... where status='active'`; ignore `status`/`type` params.
     - `app/api/items/[name]/route.ts` → `PUBLIC_CATALOGUE_COLUMNS`, `status='active'`, 404 on miss (`type=meta` adds `logo`).
   - **IDOR fixes:**
     - `getUserData()` loses its parameter (`actions/users.ts:9-39`; caller `context/UserContext.tsx:36`).
     - `getCatalogueByName` requires identity, reads `where name=$1 and created_by=me`, never fills Redis from the DB (`actions/catalogue.ts:284-321`).
     - `/catalogues/[name]/preview` requires the owner, `robots: noindex` (`app/catalogues/[name]/preview/page.tsx`).
     - `upsertQrConfig`/`getQrConfig` require the owner (`actions/qr-configs.ts:8-72`); `getQrConfig` moves to `lib/qr/configs.ts`.
     - `/admin/[name]/analytics` requires the owner, validates the slug and escapes the HogQL string, `=` instead of `like` (`app/admin/[name]/analytics/page.tsx:41-57`).
     - `hooks/useCatalogueName.ts:89-119` → debounced `checkCatalogueName` server action (ships with the `/api/items` change, which no longer returns draft names).
     - `app/api/dashboard/catalogues/route.ts:12` → 401 instead of a null-destructure 500.
   - **Unauthenticated endpoints:** `/api/revalidate` becomes POST with `x-revalidate-secret` and validated `names` (GET removed); delete `app/api/pdf/route.ts` and `puppeteer`; UploadThing middleware uses `getVerifiedIdentity()` plus a rate limit (`app/api/items/uploadthing/core.ts:6`); delete the CORS block (`next.config.ts:23-45`); `"use server"` → `import "server-only"` in `utils/supabase/server.ts:1` and `helpers/server.ts:1`.
   - **Sentry:** wire `scrubEvent` into `sentry.server.config.ts:22`, `sentry.edge.config.ts:23`, `instrumentation-client.ts:74` (+ `beforeSendTransaction`, `beforeBreadcrumb`), strip `params:` from Drizzle error messages, set `sendDefaultPii: false` in all three (legal may re-enable it on the client only, input 12).
   - **Middleware:** exclude `/monitoring`, `/ingest`, `/api/paddle`, `/api/clerk`, `/api/revalidate` and static assets from the matcher; set `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth` and `NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth?mode=signup` so `auth.protect()` stops redirecting to the Clerk Account Portal.
   - `tests/e2e/helpers/cleanup.ts`: `DATABASE_ADMIN_URL` + `assertNotProd`.
   - Tests: `tests/unit/lib/auth/{identity,redirects}.test.ts`, `tests/unit/api/revalidate.test.ts`, `tests/unit/lib/observability/sentry-scrub.test.ts`, `tests/unit/paddle/process-webhook.test.ts` (rethrow), updated `ai.test.ts`/`tools.test.ts` mocks.
5. **Worker (`../quicktalog-backend`), deployed before the app:**
   - Bearer `WORKER_ADMIN_TOKEN` on every HTTP route (`src/index.ts:25-26`), CORS `*` removed; `/api/images/cleanup` defaults to dry-run and refuses to delete when the referenced-key count is 0 or when more than 20% of listed files would be deleted (floor is a proposal).
   - `subscriptionProcessingJob.ts:29` computes usage itself (catalogue count by `created_by`, paginated sum of this month's `analytics.pageview_count`), then POSTs the inactivated names to `/api/revalidate` with the secret (`src/helpers/index.ts:1-3`).
   - `JOBS_PAUSED` check at the top of `scheduled()`.
   - **Only after route auth is live and input 5 (UploadThing token per environment) is answered:** point `wrangler.jsonc:18,28` at TEST and set the TEST key for the test env.
6. **Deploy order:** secrets in Vercel and Cloudflare → worker → app to TEST → `app/api/users/[id]/route.ts` deleted in the same app deploy (the worker no longer calls it).
7. **TEST soak 24h.** Check Supabase API logs: no `/rest/v1` traffic from the app.
8. **Apply M00 on TEST.** Run `tests/integration/db/postgrest-perimeter.test.ts` (publishable key only) and the `00_perimeter` catalog queries.
9. **PROD:** download edge functions (`supabase functions download <name> --project-ref uhfbapjuzvlyzyodxhqn --use-api`; without `--use-api` the command needs Docker) and grep for anon-key or PostgREST use; identify consumers of `contacts`/`active_subscriptions`; take a PITR note or `pg_dump`; merge `test`→`main`; deploy; soak 24h; **apply M00**; perimeter test; re-run the exposure audit.
10. **Remediate any tampering** found by the audit through a reviewed `asAdmin` script with backups (plan resets reconciled against the Paddle API, forged subscriptions and analytics removed). Record the legal decision on GDPR Art. 33/34 notification if subscriber emails or user PII were exposed (input 13).

**Exit (G0A):** publishable key gets 401/403/42501 on every table and on `/rpc/get_pageview_totals` in both projects; advisor 0013 cleared; Paddle sandbox `subscription.created` updates `plan_id` and a forced DB error returns 5xx; the TEST worker writes a `job_logs` row **in TEST**; e2e green; no 5xx on `/api/items*` for 24h.

**Rollback:**
- Code: revert and redeploy (Hobby Instant Rollback only reaches the previous deployment).
- M00: if a missed anon path is found, re-grant only that privilege **and** add a temporary permissive anon policy for that table while keeping RLS on (A.14). Never disable RLS.
- Worker: redeploy the previous version.

### 5.2 Phase 0B: Integrity and billing hardening

**Goal:** close S7-S10 and S18-S22 in code before the DB layer lands, so Phase 1 only changes transport.

**Steps:**

1. **Catalogue actions** (`actions/catalogue.ts`, still on today's client):
   - `publishCatalogue`: ownership in the UPDATE predicate, `.set({...pickEditable(sanitizeAppearance(data)), status:'active'})`, Redis written with the returned row and without `createdBy`.
   - `createCatalogue(data)`: drop the `branding` parameter (plan decides from `users.plan_id`); `status:'draft'`; `toSlug`; server-side catalogue count; 23505 → `name_taken`. Caller `hooks/useCreateCatalogue.ts:22-25`.
   - `duplicateItem`: source by id and owner; `status:'draft'`; bounded retries on 23505.
   - `updateItemStatus(id, status)`: status allowlist; name from `returning`; callers `components/dashboard/Overview.tsx:116-132` (call at `:122`; `ItemDropdownMenu.tsx:120,250` via the prop).
   - `deleteMultipleItems`: delete Redis keys for returned names; revalidate each.
   - `updateCatalogue`: Redis draft without `createdBy` or client `status`.
   - `context/CatalogueContext.tsx:284-290`: stop stamping `createdBy`.
2. **Newsletter:** `newsletterSignup(email, catalogueId)` with zod, IP rate limit, owner derived from an active catalogue with `footer->'newsletter' = true`, constant `success` (`actions/newsletter.ts:19-87`; callers `CatalogueFooter.tsx:42-51`, `Footer.tsx:31-40`). Escape the CSV export: double quotes and a leading `'` for cells starting with `= + - @` (`components/dashboard/overview/NewsletterTable.tsx:29`).
3. **Helpers out of `"use server"`:** `persistTheme` → `lib/themes/upsert.ts upsertTheme(me, ...)` with the agent `saveTheme` port (`agent/session.ts:68-90`, `agent/tools.ts:425-433`); email senders and `retryOperation` → `lib/email/transactional.ts`; `sendContactEmail` gets zod + IP rate limit (fail closed).
4. **Paddle linking** (`lib/paddle/checkout.ts`, `lib/paddle/customer.ts`, `lib/paddle/resolve-user.ts`, Appendix B.11):
   - Before creating the transaction, get or create the Paddle customer for the signed-in user by their auth email and store it in `users.customer_id` inside `asAdmin` when the user has none; create the transaction with `customerId`, so checkout cannot switch to another customer. Paddle reuses an existing customer entity when an email that already belongs to a customer is typed at checkout (https://developer.paddle.com/build/customers/create-update-customers/), so without a pinned `customerId` an event for user B can carry user A's `customer_id`.
   - A server action creates the Paddle transaction with `customerId` and `customData: { user_id, sig }`, `sig = HMAC-SHA256(PADDLE_CUSTOM_DATA_SECRET, "v1." + user_id)`; `PricingColumn.tsx:141-146` opens `Paddle.Checkout.open({ transactionId })` (verified against `@paddle/paddle-node-sdk` 3.8.0 and `@paddle/paddle-js` 1.6.4; requires an approved default payment link under Paddle > Checkout > Checkout settings, https://developer.paddle.com/build/transactions/pass-transaction-checkout/).
   - Webhook resolution order: (1) valid `sig`: if `customData.user_id` (mapped through `migration.clerk_user_map` for Clerk ids) differs from the user linked to the event's `customer_id`, record the event as unresolved with reason `conflict` and return 200; (2) user linked by `customer_id`; (3) valid `sig` and that user has no `customer_id` → link; (4) otherwise log to Sentry fatal and return 200 (Phase 1 writes it to `private.paddle_unresolved_events`). Remove email linking (`process-webhook.ts:214-223`).
   - `plan_id` is changed only `where users.customer_id = event.customerId`. On cancel/downgrade with no remaining active subscription: set Starter and run `applyPlanDowngrade` (deactivate catalogues over the new quota, force default header/footer when branding is lost, `footer.newsletter=false` when the feature is lost), then revalidate after commit.
   - Out-of-order protection: `setWhere updated_at <= occurred_at` on the subscriptions upsert.
   - **Gate:** Paddle sandbox checkout, activation, a simulated renewal and a cancel all resolve the right user. Paddle copies transaction `custom_data` to the created subscription and to renewal transactions (documented, https://developer.paddle.com/build/transactions/custom-data); the sandbox gate confirms it; `transaction.completed` stays as a secondary link point.
5. **Clerk `user.deleted`:** read `customer_id`, cancel active Paddle subscriptions **before** deleting; on cancel failure return 500 (Svix retries). Purge Redis drafts and revalidate after commit.
6. **UI results:** `ActionButtons.tsx:39-46,88-99` checks `res.success` (today `if (!res)` never fires).

**Exit (G0B):** unit tests for the new action shapes; Paddle sandbox gate above; e2e green on TEST; PROD deployed and soaked 48h.

**Rollback:** code revert. No DB change in 0B.

### 5.3 Track K: Legacy API key exit (runs in parallel from Phase 0B)

**Why now:** Supabase will delete legacy `anon`/`service_role` JWT keys in late 2026 (official date still "TBC" in https://github.com/orgs/supabase/discussions/29260 as of 2026-09-17; re-check the dashboard banner monthly and record it at the Phase 1 kickoff). The worker and the DB webhooks depend on `service_role`. Waiting for T+30 would likely cross the deadline.

**Steps:**
1. Create named `sb_secret_` keys per project (`worker`, later `vercel-app`, `cutover-script`, `ci-e2e`); multiple named secret keys are documented (https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys). Secret keys return 401 when the User-Agent looks like a browser, so never use them from browser-like runtimes or Playwright page contexts.
2. Worker: commit the pending removal of the anon `supabaseClient` first; then `SUPABASE_SECRET_KEY` replaces `SUPABASE_SERVICE_ROLE_KEY` (`backend/src/lib/supabase.ts:9-13` at HEAD `6d3a5cf`, `:4-8` in the uncommitted working tree, which also removes the anon `supabaseClient` at HEAD `:3-6`; `src/types/index.ts:4-5`); remove the unused `SUPABASE_ANON_KEY`. Deploy TEST, then PROD.
3. Edge functions (sources downloaded in 0A): set `verify_jwt = false` and require header `x-webhook-secret` equal to function env `WEBHOOK_SECRET`; during transition accept either the header or a valid service JWT.
4. After M01 and M02: set Vault secret `edge_webhook_secret` (same value) and apply **M09**. Webhooks and the Sync Plans cron then send only the header, so the service_role key no longer sits in the PUBLIC-readable pg_net queue.
5. Remove the JWT fallback from the edge functions; delete the Vault `service_role_key`; disable legacy API keys; watch logs 24h. Revoking the legacy JWT secret itself happens in Phase 2 after the ES256 signing key is current.

**Exit (GK):** worker cron and all four edge-function paths work with legacy keys disabled, at least 4 weeks before the shutdown date.

### 5.4 Phase 1: DB layer and RLS, still on Clerk

**Goal:** every user and visitor query runs as `app_user`/`app_public` under RLS; system writes run through `asAdmin`; `DB_CONNECTION_STRING` ends on the fail-closed `app_rls` login.

**Entry:** G0A. G0B may run in parallel but must land before the Phase 1 code deploy on PROD.

**Steps (TEST first, then PROD):**

1. **Local and CI foundation:**
   - `supabase/config.toml`: `major_version = 17` (`:16`), `project_id = "quicktalog"` (`:1`), `site_url = "http://localhost:3000"` (`:21`, today PROD), `additional_redirect_urls = ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]` (`:23`, today PROD+TEST), `[auth] minimum_password_length = 8`, `[auth.email] double_confirm_changes = true`, `secure_password_change = true`, `[auth.email.template.*] content_path = "./supabase/templates/<name>.html"`, `[db.seed] sql_paths = ["./seed.sql"]`; `supabase/seed.sql` seeds the Starter plan and `private.settings.default_plan_id`.
   - Port `verification/pglite-harness` into `tests/db-pglite/` (no Docker) and change its apply step to read `supabase/migrations/*.sql` **in file order**. Its final-run scenarios (692, including CHANGE C1-C12 and W1-W9, Appendix D.3) come with it and are all green on the Appendix A SQL. This is the fast CI gate.
   - Add the `db-tests` CI job: `supabase start` → `supabase test db` → `npm run test:integration`. Whether `20260911213819_remote_schema.sql` replays on the CLI image (pg_cron, pg_net, vault) is (unverified); fix it in the first run.
2. **Write M01-M07 as migration files** (Appendix A) and pgTAP files; both CI gates green.
3. **Apply M01-M06 on TEST** (`supabase db push --linked --skip-vault`). Run advisors and `00_perimeter` queries against TEST. Confirm `private.settings.edge_functions_base_url` is absent on TEST (empty Vault).
4. **Packages:** in `../quicktalog-packages` set `schemaFilter: ["public"]` and `entities: { roles: false }`; `drizzle-kit pull` with an **admin** URL; strip `pgPolicy`; fix the double version bump (`.husky/pre-push` runs `npm version minor` as well); `npm run release`; bump `@quicktalog/common` in the app (`package.json:28`) and the worker.
5. **App code** (PR groups; full file map in Appendix C):
   1. `utils/db/rls.ts` (with `search_path` in the `set_config` statement), `utils/db/index.ts`, `utils/db/private-schema.ts`; delete `utils/drizzle.ts`.
   2. Domain modules: `lib/entitlements/*`, `lib/ai/metering.ts`, `lib/catalogue/{public,draft-cache}.ts` (drafts keyed by catalogue id), `lib/users/my-user-data.ts`, `lib/themes/upsert.ts` (tx signature), `lib/qr/configs.ts`.
   3. Convert all call sites (Appendix C): actions, dashboard routes, admin pages, public reads, preview, agent route, `actions/ai.ts` (delete `lib/ai/access.ts`), Paddle idempotency (`private.paddle_events`) and unresolved queue.
   4. Cookie consent to the DB: `saveCookiePreferences` action; `CookieBanner`/`CookiePreferencesModal` read `UserContext`; move `<CookieBanner/>` inside `UserContextProvider` (`components/wrappers/PageWrapperClient.tsx:21-26`); delete `app/api/update-consent/route.ts`.
   5. Provider-neutral client auth: `context/AuthContext.tsx`, `ClerkAuthProvider`, `AuthProvider`, `components/navigation/UserMenu.tsx` replacing `<UserButton/>` (`AuthLinks.tsx`), `Settings.tsx` split.
   6. Guardrails: Biome `noRestrictedImports`; `tests/unit/architecture/db-boundaries.test.ts` built on resolved imports (TypeScript compiler API or dependency-cruiser, including root files `middleware.ts`, `instrumentation*.ts`) with rules in Appendix B.12; unit test asserting every `withUser` statement in `actions/**` carries an owner predicate (Drizzle `toSQL()` snapshot).
   7. Skills and docs: `.claude/skills/server-action-and-route/SKILL.md`, `code-conventions`, `data-revalidation`; new `docs/architecture/data-access.md`.
6. **Deploy to TEST; soak 3 days.** Abort thresholds (proposals): p95 agent pre-stream start < 800 ms; admin dashboard RSC p95 regression < 300 ms; more than 5 Postgres `53300`/`57014`/`55P03` errors in any 15 minutes → investigate; above 1% of requests → revert code (M01-M06 stay; they are inert for `postgres`).
7. **M07 on TEST** (audit queries first).
8. **M08 on TEST:** `alter role app_rls with password '<generated>'` in the SQL editor (never committed, no `VALID UNTIL`); Vercel Preview `DB_CONNECTION_STRING=postgresql://app_rls.<test-ref>:<pw>@<pooler>:6543/postgres`; redeploy. Run `forgotten-wrapper.test.ts` against TEST, e2e, and a load smoke (autocannon or k6, 50 concurrent dashboard + agent-start requests for 5 minutes) while watching `pg_stat_activity` by `usename`.
9. **PROD:** re-run preflight; `octet_length` audit for M03 limits; M01-M06; deploy; soak 3 days; M07; M08 + switch; smoke.

**Exit (G1):** pgTAP, PGlite harness, unit and integration tests green; e2e on TEST green; forgotten-wrapper gives 42501 on TEST and PROD; Redis `SCAN` sample has no `createdBy`; a public catalogue's HTML contains no `created_by`; advisors match 4.6.

**Rollback:**
- Code: revert; M01-M07 are inert for `postgres`.
- M08: point `DB_CONNECTION_STRING` back at `postgres.<ref>`; policies still apply because the wrapper always switches role.
- Per-migration SQL in A.14. M01 is reversible only before Phase 2: once M10 exists, the `auth.users` triggers depend on functions in `private`, so treat M01 as not reversible after Phase 2 (A.14).

### 5.5 Phase 2: Supabase Auth built dark

**Goal:** the complete Supabase Auth experience exists behind `AUTH_PROVIDER`, tested on TEST previews, deployed to PROD with the flag on `clerk`.

**Entry:** G1 on TEST (M01 needed for M10).

**Steps:**

1. **Packages:** `@supabase/ssr@^0.12.7`, `@supabase/supabase-js@^2.116.0`, `@marsidev/react-turnstile`, `@vercel/global-config`; devDependencies `csv-parse`, `tsx`, `@clerk/backend` (pinned to the installed transitive 2.33.3).
2. **Clients** (Appendix B): `utils/supabase/{server,client,middleware,auth-admin,server-forwarded}.ts`, `lib/auth/cookie-options.ts`; Supabase branch of `getVerifiedIdentity()` and `requireFreshUser()`.
3. **Runtime switches:** `lib/ops/flags.ts` reads Global Config items `maintenance_<env>` and `banner_<env>` (fallback env `MAINTENANCE_MODE`). Vercel renamed Edge Config to Global Config: a newly connected store creates `GLOBAL_CONFIG`, and the legacy `@vercel/edge-config` SDK reads only `EDGE_CONFIG`, so it would never see the store (https://vercel.com/docs/global-config/migration-guide). Global Config is available on Hobby (1 store, 250 writes/month, up to 10 s write propagation; https://vercel.com/docs/global-config/global-config-limits); if the account's single store is already used elsewhere, read an Upstash key with a 5s in-memory cache instead. `AUTH_PROVIDER` stays build-time and single-sourced through `next.config.ts` `env`.
4. **`middleware.ts`** per Appendix B.8: fail-closed maintenance bypass, 503 on write paths and `next-action` requests, provider switch, `updateSession()` only on `NEEDS_SESSION` paths, Clerk cookie expiry only for cookies present and only on session paths. `/api/paddle` returns 503 while maintenance is on.
5. **Auth UI** (`/auth` URLs unchanged; `app/auth/[[...rest]]/page.tsx` picks the implementation):
   - Browser client for `signInWithPassword`, `signUp` (name, email, password, required terms checkbox, `options.data = { full_name, terms_version }` where the version comes from a server-rendered prop via `private.current_terms_version()`), `resetPasswordForEmail`, `signInWithOAuth` (Google); `signUp`, `signInWithPassword` and `resetPasswordForEmail` each with a Turnstile `captchaToken` (`signInWithOAuth`, `updateUser` and `reauthenticate` are not captcha-gated; supabase/auth `internal/api/api.go`); `autocomplete="username"`/`"current-password"`.
   - `app/auth/callback/route.ts` (PKCE exchange via the forwarded-IP client, `safeNext`, `claimWelcomeEmail`).
   - `app/auth/confirm/route.ts` + `app/auth/confirm/continue/page.tsx` interstitial (Appendix B.13): types `email`, `recovery`, `email_change`; token in a 10-minute `__Host-qt-confirm` HttpOnly cookie; the continue action refuses when a session already exists and shows the account email before redirecting (login-CSRF guard); IP rate limit.
   - `app/auth/update-password/page.tsx`, `app/auth/consent/page.tsx` (gate: new `app/admin/layout.tsx` (does not exist today) compares `users.consents->>'version'` with `private.current_terms_version()` in the same `withUser` tx and redirects).
6. **Account settings** (`components/dashboard/account/*`): profile name (`updateProfile`, rate-limited 5/hour), email change (secure double confirm), password change (`current_password`, reauthenticate nonce, then `signOut({ scope: "others" })`), identities (link Google only if manual linking is enabled), sign out / sign out everywhere, delete account (`actions/account.ts`: `requireFreshUser` → cancel Paddle → `authAdmin().deleteUser` → purge drafts → revalidate → `signOut({ scope: "local" })`).
7. **Client state:** `SupabaseAuthProvider` (`onAuthStateChange` → `router.refresh()` on user change); `AuthProvider` switch.
8. **DB:** **M10** on TEST (local sign-up test green first), then on PROD in the same release (inert while PROD sign-ups are off and nobody is imported). Insert `private.settings.terms_version` per project (input 14).
9. **Supabase config as code:** `scripts/supabase/auth-config.ts` with `--check` and `--apply` (section 8); TEST then PROD (`disable_signup: true`). Enable `security_sb_forwarded_for_enabled` on both projects, then prove forwarding on TEST with a scripted server-side test (Node, secret key): (a) 40 `verifyOtp` calls with an invalid `token_hash`, each with a different `Sb-Forwarded-For` value (TEST-NET 198.51.100.1-40), must return no 429 (only otp errors); (b) 40 calls with the same `Sb-Forwarded-For` value must return 429 from about the 31st call; (c) repeat (a) through a deployed TEST preview route using real client IPs from at least two networks. Log `over_request_rate_limit` in the TEST auth logs for (b) only. (A single tester sending one IP cannot pass a "no 429" test: `/verify` allows 30 requests per 5 minutes per IP with bursts up to 30, whether or not forwarding works; https://supabase.com/docs/guides/auth/rate-limits.)
10. **Signing keys:** ES256 must be the **current** key on both projects; if PROD is on HS256, migrate and rotate, wait 1h15m, then revoke the legacy JWT secret (Track K must be done).
11. **Email:** Resend with separate API keys (and, if the plan shares quotas, separate accounts) per project; `auth.quicktalog.app` sending subdomain; DMARC; **click and open tracking disabled** for the auth domain; templates point at `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=...`. GoTrue substitutes the caller's redirect URL there (or the Site URL when it is absent or not allow-listed), so every `signUp`/`resetPasswordForEmail`/`updateUser` call passes `emailRedirectTo`/`redirectTo` = `window.location.origin` exactly (no path, no query; unit test). PROD templates may use `{{ .SiteURL }}` instead, since PROD has one host (https://supabase.com/docs/guides/auth/auth-email-templates).
12. **Security hardening:** CSP in `Content-Security-Policy-Report-Only` (allowlist-based: GTM, Clarity, PostHog `/ingest`, Paddle, Turnstile, UploadThing, Supabase, Google; `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'self'`); Origin check on cookie-authenticated mutating route handlers; GTM publish rights restricted; unit test that `CustomCode.tsx:202` sandbox has no `allow-same-origin`.
13. **Scripts** (Phase 3 uses them): `scripts/lib/guard.ts`, `scripts/cutover/{preflight.sql,migrate-clerk-to-supabase.ts,remap-user-ids.sql,verify.sql,rollback-remap.sql,push-supabase-users-to-clerk.ts,purge-dark-test-users.ts}`, `scripts/redis/delete-legacy-keys.ts`.
14. **Tests:** pgTAP `50_auth_triggers`; `tests/integration/auth/signup.test.ts` (real GoTrue: an email sign-up creates a row only when the address is confirmed (W1), a Google sign-up creates it whether GoTrue confirms the email at INSERT or in a later UPDATE; `admin.createUser({ app_metadata: { clerk_user_id } })` with a pre-claimed map row creates **no** row; Brevo trigger with a Vault secret present does not block sign-up); Playwright Supabase setup (`auth.supabase.setup.ts` using admin `generateLink` + `verifyOtp`, which is not captcha-gated); CI e2e matrix `auth: [clerk, supabase]`; middleware, `safeNext`, confirm, callback and account unit tests.

**Exit (G2):** on a TEST preview with `AUTH_PROVIDER=supabase`: admin-created users can sign in with password and Google, reset password, change email (both links), delete account (sandbox subscription cancelled, public page 404); perimeter test with a **real user JWT** denies every table and RPC; Sentry events from TEST contain no `sb-*` values; `auth-config.ts --check` reports no drift; Resend mail lands in Gmail and Outlook inboxes; PROD with flag `clerk` shows no behaviour change for 72h.

**Rollback:** flags stay `clerk`; `drop trigger if exists <name> on auth.users` for the three M10 triggers (allowed through `supautils.drop_trigger_grants` on TEST; confirm the setting on PROD first with `select setting from pg_settings where name = 'supautils.drop_trigger_grants'`), or neutralise the functions (A.14) if PROD lacks the grant; keep `disable_signup: true`. The DROP path is not PGlite-verified (no supautils); prove it on the local stack (pgTAP `50_auth_triggers`) and TEST first.

### 5.6 Phase 3: Import and re-key rehearsals

**Entry:** G2 on TEST; M10 applied where rehearsing.

**Steps:**
1. **Fixture rehearsal (CI):** local stack, Clerk-id fixtures (unverified email, non-bcrypt hasher, Google-only, banned, MFA, user without a `public.users` row, orphan row, paying unmapped user). Run the import with `CLERK_FIXTURE`/`CLERK_CSV`, then R1, `verify.sql`, password sign-in with a fixture digest, reverse re-key, re-key again. `tests/integration/cutover/rehearsal.test.ts`.
2. **TEST dress rehearsal (full section 12 runbook against TEST and the Clerk dev instance):**
   - `purge-dark-test-users.ts` first (deletes Phase 2 dark-test `auth.users` outside the map).
   - Record the duration of every timed step.
   - Between cutover and rollback, perform a Supabase-only sign-up, a password change, an account deletion and a Paddle sandbox checkout; then rollback R1; then cut over again and verify V1-V12. This exercises map-based rollback and re-cutover (the re-cutover after an account deletion depends on CHANGE W2; the same sequence passed in the final PGlite run).
   - Rehearse the Vercel path used in rollback (redeploy of a tagged commit with changed env) and measure its duration.
   - TEST stays on Supabase afterwards; the Clerk e2e leg keeps running locally against the Clerk dev instance until R2 closes on PROD.
3. **PROD data rehearsal on a local copy** (recommended above ~50 PROD users or on anomalies): `pg_dump --data-only --schema=public` to an encrypted volume, restore into a local stack at the same migration level, run the import against local GoTrue with the PROD CSV (read-only on Clerk), R1, verify; measure lock time. Wipe afterwards; never commit or upload it.
4. **Clerk freeze at T-3:** Clerk PROD dashboard: disable password reset and profile edits in the Account Portal where settings allow (which settings can be frozen is unverified), ship the `ClerkAccount.tsx` "account changes paused" notice, sign-up mode stays public until T-0.
5. **PROD dark import at T-3:** `DRY_RUN=1` then real run with `ALLOW_PROD=1`; reconcile C1-C8; every `conflict`/`skipped`/`error` row gets a written decision; users with unverified email who own data are contacted to verify in Clerk.

**Exit (G3):** fixture rehearsal green in CI; TEST cutover, rollback and re-cutover pass verification; PROD reconciliation holds; re-key duration known (target under 60s) and the window sized to it.

**Rollback:** before the re-key, imported `auth.users` are inert; `purge` them by map rows (the delete trigger finds no uuid rows yet). The import script refuses destructive work once any mapped uuid exists in `public.users` (section 6.3).

### 5.7 Phase 4: PROD cutover

**Entry:** G3; section 12 go/no-go signed; inputs in section 14 answered; deploy freeze on `main` from T-7 except cutover fixes.

**Work:** runbook in section 12.

**Exit (G4):** smoke S1-S14 pass; 24h monitoring without a rollback trigger.

**Rollback:** R0/R1/R2/R3 in section 12.

### 5.8 Phase 5: Decommission Clerk

**Entry:** T+14 and no open rollback trigger; R2 closed at T+7.

**T+14 (code):** remove `@clerk/nextjs`, `@clerk/testing`, `@clerk/backend`; delete the Clerk branches in `lib/auth/identity.ts`, `middleware.ts`, `AuthProvider`, `Auth.tsx`, `Settings.tsx`; delete `app/api/clerk/`, `lib/users/{syncFromClerk,provision}.ts`, `constants/users.ts`, `css/clerk.css` (+ `css/index.css:4`, `@layer clerk` in `app/globals.css:5`), Clerk e2e setup and CI leg; move `app/auth/[[...rest]]` → `app/auth/page.tsx` and `app/admin/dashboard/[[...rest]]` → `page.tsx`; narrow the middleware matcher; remove Clerk `ignoreErrors` (`instrumentation-client.ts:58-60`); remove `AUTH_PROVIDER` and the provider switch.

**T+30 (platform, in this order):**
1. Remove Clerk DNS records (`clerk.quicktalog.app` CNAME, any `clkmail`/`clk._domainkey` records) **before** deleting the instances, to avoid a subdomain-takeover window.
2. Delete the Clerk production and development instances; remove the Clerk callback URI from the Google client.
3. Shred CSV exports and JSON snapshots; revoke the `cutover-script` secret key.
4. Orphan triage done → **M12** (validate `users_id_is_uuid`); **M13** (drop backups and scratch tables, minimise the map).
5. Terms sub-processor list (`app/terms-and-conditions/page.tsx:403`), privacy policy wording, README, docs, skills.

**Exit (G5):** `grep -ri clerk` finds only migration history and legal archives; M12, M13 applied.

---

## 6. Identity migration details

### 6.1 What to export and from where

Per Clerk instance (dev instance → TEST, production instance → PROD; users cannot move between instances).

| Source | How | Fields used | Handling |
|---|---|---|---|
| Clerk Dashboard CSV | Settings → User exports → Export (download expires) | `id`, `primary_email_address`, `verified_email_addresses`, `username`, `password_digest`, `password_hasher` | Only self-serve source of bcrypt digests. Encrypted volume outside any repo. Record `EXPORTED_AT`. The CSV also contains `totp_secret`: treat the file as MFA-secret material (encrypted volume, shred at T+30, never load `totp_secret` into the map). |
| Clerk Backend API `users.getUserList({ limit: 500, offset, orderBy: "+created_at" })` | Import script | primary email and verification, names, `externalAccounts` (provider, `providerUserId`, verification, `imageUrl`), `publicMetadata.cookieConsent`, `createdAt`, `lastSignInAt`, `passwordEnabled`, `raw.password_last_updated_at` (ms epoch; `@clerk/backend` 2.33.3 does not map it onto `User`), `totpEnabled`, `backupCodeEnabled`, `twoFactorEnabled`, `banned`, `totalCount` | JSON snapshot next to the CSV. Limits: prod 1000 req/10s, dev 100 req/10s; retry 429. |
| Clerk Dashboard settings | Screenshots at T-14 | identifiers, strategies, social providers and custom credentials, MFA, passkeys, sign-up mode, webhooks, session lifetime | Decides edge-case handling (6.5) |
| PROD `public.users` | `preflight.sql` | Clerk ids, emails, `customer_id`, `image`, `cookie_preferences` | Reconciliation (6.7) |

### 6.2 Mapping table

`migration.clerk_user_map` is created by **M10** (not by the runbook), because the sign-up trigger must see it. The schema is not exposed and has no grants.

| Column | Meaning |
|---|---|
| `clerk_user_id` (PK) | Clerk `user_...` id |
| `supabase_user_id` (unique) | Pre-generated uuid, claimed **before** `admin.createUser` |
| `origin` | `import` or `rollback_push` (users created during a rollback window) |
| `status` | `claimed` → `migrated` / `conflict` / `skipped` / `error` / `deleted` |
| `email`, `email_verified`, `password_imported`, `password_hasher`, `google_sub`, `avatar_url`, `cookie_consent`, `mfa_enabled`, `banned`, `owns_data`, `clerk_created_at`, `clerk_last_sign_in_at`, `detail` | Import evidence and inputs to R1 |

**Retention:** the map is kept permanently in minimised form (`clerk_user_id`, `supabase_user_id`, `origin`, `status`) for Paddle legacy resolution of signed Clerk ids and support; M13 nulls the PII columns at T+30. Also created by M10: `migration.auth_user_deletions` (written by the delete trigger, used in rollback) and `migration.cutover_log`. The delete trigger also sets the map row to `deleted` (CHANGE W2), so a re-cutover after a rollback window with an account deletion is not blocked; M13 replaces the trigger body before it drops `migration.auth_user_deletions` (CHANGE W3).

### 6.3 Import script `scripts/cutover/migrate-clerk-to-supabase.ts`

Runs on the operator machine only (never Vercel, never CI for PROD). Env: `CLERK_SECRET_KEY`, `CLERK_CSV`, `EXPORTED_AT`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SECRET_KEY` (`cutover-script`), `MIGRATION_DATABASE_URL`, `DRY_RUN`, `CONCURRENCY=4`, `ALLOW_PROD`.

**Guards (abort before any write):**
- `sk_live_` Clerk key must pair with the PROD ref, and PROD requires `ALLOW_PROD=1` plus typing the ref interactively.
- `migration.clerk_user_map` exists and `pg_get_functiondef('private.handle_auth_user_created'::regproc)` contains `clerk_user_map`.
- `GET /auth/v1/settings` shows `disable_signup: true`.
- CSV header matches the expected columns; `EXPORTED_AT` parses (and is under 24h old for `--delta`).
- Fetched Clerk users must equal `totalCount`; otherwise abort (a partial list must never look like deletions).
- **Mode detection:** if any `migration.clerk_user_map.supabase_user_id` exists as `public.users.id`, the script runs in **post-cutover mode**: it never calls `deleteUser`, never recreates users, and only creates missing users and map rows, or updates password digests in place.

**Per Clerk user (ordered by `created_at`):**
1. Choose the email: verified primary; else the single verified secondary; else unverified primary. No email → `skipped`.
2. Unverified email **and** the user owns catalogues or has a `customer_id` → `skipped` with `detail = verify-in-clerk` (prevents a later Google sign-in from claiming migrated data through GoTrue's unconfirmed-identity handling).
3. **Claim the uuid first:** `insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, email, status) values (..., gen_random_uuid(), ..., 'claimed') on conflict (clerk_user_id) do update set email = excluded.email returning supabase_user_id`.
4. Password importability: `bcrypt` (`$2a/$2b$`) or `argon2*` digest in the CSV. **MFA users (`totpEnabled`, `backupCodeEnabled`, `twoFactorEnabled`) are imported without a password** unless Supabase TOTP enrolment is built before T-0 (input 7): they reset by email or use Google.
5. `admin.createUser({ id, email, email_confirm: verified, password_hash?, user_metadata: { full_name }, app_metadata: { clerk_user_id } /* audit only */, ban_duration: banned ? "876000h" : undefined })`. `email_exists` → `conflict`.
6. Optional fidelity: `update auth.users set created_at = <Clerk createdAt> where id = $1` over `MIGRATION_DATABASE_URL`.
7. Google: for each verified `oauth_google` external account insert `auth.identities (provider_id = providerUserId, user_id, provider 'google', identity_data {sub, provider_id, email, email_verified})` `on conflict (provider_id, provider) do nothing`; if owned by another uuid → `conflict`.
8. Record `migrated` with evidence columns (`avatar_url` only if it matches `^https://lh[0-9]+\.googleusercontent\.com/`, else null; the Clerk `image_url` is usually a Clerk proxy).

**Delta run (`--delta`, T-0):**
- For existing users compare `auth.users.encrypted_password` with the fresh CSV digest; if they differ and the CSV digest is importable, `update auth.users set encrypted_password = $csv, updated_at = now()` (row DML, no recreate).
- Sync email, `email_confirm` and bans through `admin.updateUserById`; delete Google identities no longer present on the Clerk user.
- Users whose `user.raw?.password_last_updated_at` > `EXPORTED_AT` go to `needs-reset.csv`; abort the run if `user.raw` is null for any user (the field must be present, never assumed absent). `@clerk/backend` 2.33.3 has no `passwordLastUpdatedAt` on `User` (`node_modules/@clerk/backend/dist/api/resources/User.d.ts`; the value is in `JSON.d.ts:547`), so `user.passwordLastUpdatedAt` would always be undefined. Unit test: a fixture with `password_last_updated_at` after `EXPORTED_AT` lands in `needs-reset.csv`.

**Destructive cleanup (pre-cutover only):** map rows whose Clerk user is gone are deleted from Auth only with `--allow-delete`, only in pre-cutover mode, and only when the deletion set is at most max(3, 1% of users).

**Outputs:** `clerk-supabase-map.<ts>.json`, `needs-reset.csv`, `conflicts.csv`, `mfa-users.csv`, `skipped.csv`; reconciliation C1-C8 printed; non-zero exit on any failed equality. Unit tests: CSV parsing, hasher detection, email choice, PROD guard, claim-before-create ordering, post-cutover mode refusing deletes.

### 6.4 Google identities

- `provider_id` (Google `sub`) matching wins over email linking, so pre-created identities attach the next Google sign-in to the migrated uuid even if the Google email differs.
- PROD: reuse Clerk's Google Cloud OAuth client if Clerk PROD uses custom credentials (unverified); add redirect URI `https://uhfbapjuzvlyzyodxhqn.supabase.co/auth/v1/callback` and keep Clerk's until T+30. If Clerk used shared credentials, create a new Web client; the Google `sub` is per Google account either way.
- Other OAuth providers are not enabled unless Clerk PROD shows use (input 6).

### 6.5 Edge cases

| Case | Handling | User experience |
|---|---|---|
| Verified email + bcrypt digest | `password_hash` import (cost 10 kept) | same password works; `weakPassword` hint shows a non-blocking banner |
| Non-bcrypt/argon2 hasher | no password; `needs-reset.csv` | T+0 email: use "Forgot password" |
| Password changed after an export | T-0 delta digest compare (6.3) | none |
| Google-only | pre-created identity | "Continue with Google" |
| Email-code / magic-link only | if Clerk PROD has it enabled, add `signInWithOtp({ shouldCreateUser: false })`; else reset | chosen per input 6 |
| Unverified primary email, owns nothing | import `email_confirm:false`, no password | "Forgot password" (completing recovery confirms the email; supabase/auth `internal/api/verify.go` `recoverVerify`) |
| Unverified email, owns data | `skipped`, contact user | verify in Clerk before T-3, then re-import |
| No email (phone/username/web3 only) | `skipped`; row stays legacy for triage | support contact |
| Username identifier | import by email | comms: sign in with email |
| MFA enabled | no password import (unless TOTP built) | comms without advertising the gap: "use Forgot password or Google" |
| Passkeys | not exportable | password or Google |
| Banned | `ban_duration` | cannot sign in |
| `email_exists` conflict | inspect stray auth user; delete if it owns nothing; re-run `--only` | - |
| Google `sub` owned by another uuid | `conflict`; manual merge | - |
| Clerk user without `public.users` row | R1 step 7 inserts a default row | consent gate on first visit |
| `public.users` row without Clerk user | 12.6 triage: owns nothing → delete before T-0; owns data → contact | - |
| Duplicate `lower(email)` in `public.users` | resolve before import | - |
| Unmapped user with a `customer_id` | **go/no-go blocker**; R1 refuses to run | - |

### 6.6 Re-key

`scripts/cutover/remap-user-ids.sql` (Appendix A.R1) in one transaction with `MIGRATION_DATABASE_URL`:
1. `lock table public.users in access exclusive mode` **first**, before any precondition read (a read would take ACCESS SHARE and turn the lock into an upgrade, and a webhook could change a checked row between check and re-key; CHANGE W9), then `share row exclusive` on the six child tables; `lock_timeout 5s`, retry once after terminating idle-in-transaction sessions.
2. Preconditions, checked under the lock: no `analytics_upsert_trigger`; no `auth.users` outside the map; no mapped uuid already present in `public.users`; no `migrated` map row without an `auth.users` row; no `claimed` rows; default plan exists; **no unmapped user with a `customer_id`**.
3. `add constraint users_id_is_uuid ... not valid` (a stale Clerk id written later fails; legacy orphans are validated at T+30).
4. Disable only the named triggers `"Brevo New Contact Webhook"`, `catalogues_touch_updated_at`, `user_themes_touch_updated_at` (never `DISABLE TRIGGER ALL`, which also skips the RI triggers that implement the cascade).
5. Snapshot per-user counts into `migration.pre_remap_counts`.
6. `update public.users set id = map.supabase_user_id::text` for `migrated` rows; the 6 FKs cascade.
7. Profile fields: email from `auth.users`; Clerk-hosted images replaced by the Google URL or null; newer `cookie_consent` from the map; `welcome_email_sent_at` set so existing users never get a welcome email.
8. Insert rows for mapped users that never had one.
9. Re-enable the three triggers; assert plan, customer and every owned count unchanged; log.

### 6.7 Reconciliation and verification queries

| # | Check | Expected |
|---|---|---|
| C1 | Clerk `totalCount` = CSV rows + users created after `EXPORTED_AT` − users deleted after it | equal |
| C2 | map rows = Clerk `totalCount` + `deleted` rows | equal |
| C3 | map `migrated` = `auth.users` rows whose id is in the map | equal |
| C4 | `claimed` = 0 after the run | 0 |
| C5 | `password_imported` = importable, non-stale, non-MFA CSV rows | equal |
| C6 | `auth.identities where provider='google'` = map rows with `google_sub` | equal |
| C7 | `public.users` Clerk-id rows = mapped rows + listed orphans | equal |
| C8 | V1-V12 after the re-key | below |
| V1 | `public.users` rows with `user_%` ids | = accepted orphans (target 0) |
| V2 | uuid `public.users` rows without an `auth.users` row | 0 |
| V3 | `auth.users` rows with `email_confirmed_at is not null` (or a phone) without a `public.users` row (unconfirmed email sign-ups get their row at confirmation, W1) | 0 |
| V4 | mapped users whose `public.users.email` ≠ `lower(auth.users.email)` | 0 |
| V5 | child rows still owned by `user_%` ids | = rows of accepted orphans (target 0) |
| V6 | totals (catalogues, pageviews, subscriptions, users with `customer_id`) | equal to the T-0 preflight |
| V7 | **mapped** users with `img.clerk.com` images | 0 |
| V8 | catalogues with `updated_at` in the last 30 minutes | ≈0 |
| V9 | the three disabled triggers are enabled again | `O` |
| V10 | `users_id_is_uuid` `convalidated` | false until T+30 |
| V11 | as `app_user` with a migrated `sub`: catalogue count | = that user's pre-re-key count |
| V12 | for 100% of `password_imported` rows, `auth.users.encrypted_password` equals the T-0 CSV digest | true (**go/no-go before sign-ups open**) |

---

## 7. Sessions and cookies

### 7.1 How a Supabase session works in this app

| Aspect | Behaviour |
|---|---|
| Library | `@supabase/ssr` ^0.12.7 with `supabase-js` ^2.116 (`getAll`/`setAll(cookies, headers)`, expired-JWT `getClaims` fix) |
| Cookie | `sb-<first label of the Supabase URL host>-auth-token`, value `base64-` prefixed, chunked as `.0`, `.1` above ~3180 chars; PKCE verifier `...-auth-token-code-verifier` during OAuth |
| Attributes | `Path=/`, `SameSite=Lax`, `Secure` in production, host-only (no `Domain`), 400-day max-age; **not HttpOnly** (the browser client must read and rotate the refresh token) |
| Tokens | access JWT 3600s (`supabase/config.toml:25`); refresh-token rotation with a 10s reuse interval (`:26-27`) |
| Session lifetime | enforced by Supabase, not the cookie; time-box/inactivity controls need a paid plan (input 11) |
| Verification | `getClaims()` verifies the access token locally against the project JWKS when an asymmetric key (ES256) is **current**; with legacy HS256 it silently becomes a network call |

**Cookie names per environment:**

| Where | Supabase URL | Session cookie |
|---|---|---|
| PROD `www.quicktalog.app` | `https://uhfbapjuzvlyzyodxhqn.supabase.co` | `sb-uhfbapjuzvlyzyodxhqn-auth-token` |
| TEST `test.quicktalog.app` and TEST previews | `https://imhinsgyzzyblghwnedk.supabase.co` | `sb-imhinsgyzzyblghwnedk-auth-token` |
| Local dev against TEST | TEST URL | `sb-imhinsgyzzyblghwnedk-auth-token` on `localhost` |
| Local stack | `http://127.0.0.1:54321` | `sb-127-auth-token` (tests must not hard-code refs) |
| PROD with a custom auth domain (only if adopted before T-14) | `auth.quicktalog.app` | `sb-auth-auth-token` |
| App-owned confirm helper | - | `__Host-qt-confirm` (HttpOnly, Secure, Lax, 10 min) |
| Maintenance bypass (operators only) | - | `qt-maint-bypass` |

Confirm that apex `quicktalog.app` redirects to `www` (input 16): PKCE started on one host fails on the other.

### 7.2 Where each call runs

| Call | Runs in | Rate limited by |
|---|---|---|
| `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `signInWithOAuth` start, `updateUser`, `reauthenticate` | browser client (Turnstile token on `signUp`/`signInWithPassword`/`resetPasswordForEmail`) | end-user IP |
| `exchangeCodeForSession` (`/auth/callback`) | server, forwarded-IP client | end-user IP via `sb-forwarded-for` (verified: all IP-limited endpoints, supabase/auth PR #2295) |
| `verifyOtp` (confirm interstitial) | server, forwarded-IP client | same |
| token refresh in middleware | Edge middleware, forwarded-IP client | same |
| `getClaims()` in RSC/actions | server | none (local verification) |
| `getUser()` in `requireFreshUser()` | server | not IP-limited except email updates |
| `auth.admin.*` | server (`actions/account.ts`), scripts | no GoTrue limiter |

Supabase per-IP limits (defaults, all customizable through the Management API; https://supabase.com/docs/guides/auth/rate-limits): `/verify` 30 per 5 minutes (`rate_limit_verify`), `/token` 150 per 5 minutes shared by password, refresh and PKCE grants (`rate_limit_token_refresh`), sign-up/sign-in/recover/otp 30 per 5 minutes; bursts up to 30. The "360/h and 1800/h" figures quoted elsewhere are the same limits per hour. Server-side calls from Vercel share egress IPs, so the forwarded-IP auth client is built in Phase 2 (`Sb-Forwarded-For` is honoured by every IP-limited endpoint, supabase/auth PR #2295). Record the current values with `GET /config/auth`; raising `rate_limit_token_refresh` for cutover week is an optional extra lever, not a substitute for forwarding. The forwarded-IP client uses `SUPABASE_SECRET_KEY` but exposes only `exchangeCodeForSession`, `verifyOtp` and `getClaims` (B.7) and is allowlisted in the architecture test.

### 7.3 `getClaims()` vs `getUser()`

- **Normal requests** (RSC, server actions, route handlers, middleware): `getClaims()` through `getVerifiedIdentity()`. It does not see sign-out elsewhere, bans or deletion until `exp` (≤ 1h).
- **Sensitive operations** (delete account, email/password change, billing portal): `requireFreshUser()` → `getUser()` round trip.
- **Never** use `getSession()` for authorization, and never trust `user_metadata`/`app_metadata` for decisions.
- After account deletion the access token stays valid until `exp`, but `withUser` finds no `public.users` row and `requireFreshUser()` fails.

### 7.4 Middleware and ISR safety

- Middleware creates a Supabase client **only** for `NEEDS_SESSION` paths (`/admin`, `/auth`, `/catalogues/<name>/preview`, `/api/{dashboard,agent,items/uploadthing}`) and for `next-action` requests. Public catalogue pages, `/api/items*`, the sitemap and marketing pages never run GoTrue and never receive `Set-Cookie` (unit test).
- When cookies are refreshed, `@supabase/ssr` ≥ 0.10 passes `Cache-Control: private, no-store` headers, which middleware copies onto the response, so a CDN never caches a refreshed session.
- The root layout never reads cookies (`app/layout.tsx`); `AuthProvider` hydrates in the browser; a new `app/admin/layout.tsx` (Phase 2; it does not exist today) reads identity server-side.
- Public data goes only through `withPublic`, which takes no identity; a per-user query placed inside `unstable_cache` fails loudly because identity reads `cookies()`.
- `/admin` pages stay dynamic; every server action and route handler calls `requireIdentity()` itself (a page check does not protect its actions).

### 7.5 Sign-out

| Action | Call | Effect |
|---|---|---|
| Sign out (menu, settings) | `signOut({ scope: "local" })` then `router.push("/")`, `router.refresh()` | this browser only (the JS default `global` is wrong for normal logout) |
| After password change | `signOut({ scope: "others" })` | other devices lose refresh tokens; access tokens live until `exp` |
| Sign out everywhere | `signOut({ scope: "global" })` | all sessions |
| Account deletion | `deleteUser` removes sessions, then `signOut({ scope: "local" })` | cookies cleared |

### 7.6 Security hardening that the session model requires

- **XSS equals takeover:** the refresh token is readable by any script on `www.quicktalog.app` (GTM, Clarity, PostHog, any XSS). Controls: `CustomCode` sandbox without `allow-same-origin` (unit test), `HtmlContent` allowlist, GTM publish rights restricted to named people with 2FA, CSP report-only in Phase 2 then enforced after two clean weeks.
- **Sentry:** scrubber and `sendDefaultPii: false` before the first `sb-*` cookie exists (Phase 0A); Sentry project Data Scrubber with `sb-*-auth-token`, `access_token`, `refresh_token`, `token_hash`, `code`, `apikey`, `password`; Replay blocked on `/auth/*`.
- **Open redirect:** one isomorphic `safeNext` that resolves against the current origin and rejects control characters and backslashes; used by forms, callback, confirm and middleware; tests for `//evil.com`, `/\evil.com`, `/%09/evil.com`, `/\t/evil.com`, `javascript:`.
- **Login CSRF:** the confirm interstitial refuses to verify when a session exists and shows the account email before continuing; IP rate limit.
- **Secret-key auth clients:** never run captcha-gated calls through a secret-key client (GoTrue skips captcha for admin credentials, supabase/auth `internal/api/middleware.go` `verifyCaptcha`); the forwarded-IP client exposes no such method (B.7, B.12).
- **Redirect allow-lists:** exact Vercel branch aliases on TEST only; **no** `https://*-<team>.vercel.app/**` glob (anyone can claim a matching alias and receive a victim's PKCE code).
- **Duplicate/tossed cookies:** middleware clears `sb-<ref>-auth-token` cookies that arrive twice (e.g. one set with a `Domain` attribute by a sibling subdomain).
- **CORS:** removed in Phase 0A; Origin check on cookie-authenticated mutating route handlers.

### 7.7 What users experience at cutover

- Every open tab loses its Clerk session on the next navigation to a session path (middleware expires the Clerk cookies that are present: `__session`, `__client_uat`, `__refresh`, `__clerk_db_jwt`, `__clerk_handshake`, `__clerk_handshake_nonce`, `__clerk_redirect_count` and their suffixed variants (`<name>_<suffix>`); host-only and, on PROD only, `Domain=quicktalog.app`; clerk-js cookie domains are checked on TEST. It also strips the `__clerk_handshake`, `__clerk_help`, `__clerk_hs_reason`, `__dev_session` and `__clerk_synced` query parameters from redirects; those are query parameters, not cookies, per `@clerk/backend` constants).
- `/admin/*` redirects to `/auth?next=...`. Users sign in with the **same email and password** or **Continue with Google**.
- First visit: consent gate (once), then the dashboard with the same catalogues, plan and usage.
- Unsaved builder drafts survive (Redis is not flushed; drafts are keyed by catalogue id). Builder saves that hit the maintenance 503 are kept in `localStorage` with a "saved locally, sign in again to sync" notice.
- `needs-reset.csv` and MFA users use "Forgot password" (or Google).
- **Emails:** T-7 announcement (date, one sign-out, same credentials, Google works, username users sign in with email; no mention of a 2FA gap); T-30min banner; T+0 note to `needs-reset.csv` and MFA users. Sent through Resend from the app sender, throttled to the plan quota.

---

## 8. Supabase project configuration checklist

Applied with `scripts/supabase/auth-config.ts` (Management API `GET/PATCH /v1/projects/{ref}/config/auth`, JSON per project in `scripts/supabase/auth-config.{test,prod}.json`, secrets from env). **Never** `supabase config push` against hosted projects. Field names were checked against the Management API schema in Supabase CLI 2.115; `uri_allow_list` is one comma-separated string; `security_update_password_require_reauthentication` = Secure password change; "require current password" has no Management API field and is set and screenshot-checked in the dashboard.

| Setting | TEST `imhinsgyzzyblghwnedk` | PROD `uhfbapjuzvlyzyodxhqn` | Local (`supabase/config.toml`) |
|---|---|---|---|
| Site URL (`site_url`) | `https://test.quicktalog.app` | `https://www.quicktalog.app` | `http://localhost:3000` |
| Redirect allow-list (`uri_allow_list`, one comma-separated string) | `https://test.quicktalog.app/**`, `http://localhost:3000/**`, exact preview aliases | `https://www.quicktalog.app/**` only | `http://localhost:3000/**`, `http://127.0.0.1:3000/**` |
| Allow new users to sign up (`disable_signup`) | off (Phase 0A) until TEST cutover, then on | off until T-0 step 14, then on | on |
| Anonymous sign-ins | off | off | off |
| Confirm email (`mailer_autoconfirm = false`) | on | on (**go/no-go**) | on |
| Secure email change (`mailer_secure_email_change_enabled`) | on | on (**go/no-go**) | on |
| Secure password change (`security_update_password_require_reauthentication`) / require current password (dashboard only) | on / on | on / on | on / on |
| Password min length / characters | 8 / letters + digits | match Clerk PROD policy (input 6) | 8 |
| Leaked password protection | Pro+ only (`password_hibp_enabled`) | Pro+ only | n/a |
| JWT expiry / rotation / reuse | 3600 / on / 10 | 3600 / on / 10 | same |
| JWT signing key | ES256 **current** | ES256 **current**; legacy secret revoked after Track K | n/a |
| Custom SMTP | Resend (`smtp.resend.com:465`, user `resend`), TEST-scoped key, `Quicktalog TEST <no-reply@auth.quicktalog.app>`, tracking off | Resend (`smtp.resend.com:465`, user `resend`), PROD key, `Quicktalog <no-reply@auth.quicktalog.app>`, tracking off | Mailpit |
| `rate_limit_email_sent` | 30/h | 100/h cutover week, then 60/h (within the Resend quota) | n/a |
| IP address forwarding (`security_sb_forwarded_for_enabled`) | on (Phase 2) | on (Phase 2) | n/a |
| Captcha | Turnstile, real widget for `test.quicktalog.app` | Turnstile, widget for `www.quicktalog.app` | disabled |
| Google provider | TEST OAuth client | PROD client (reused from Clerk if custom) | TEST client, `http://127.0.0.1:54321/auth/v1/callback` |
| Manual identity linking | off unless "Connect Google" ships | same | off |
| MFA (TOTP) | only if built (input 7) | same | same |
| Auth hooks | none | none | none |
| Email templates | `{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email|recovery|email_change`; reauthentication `{{ .Token }}`; security notifications on | same (PROD subjects) | `supabase/templates/*.html` |
| Data API exposed schemas | `public, graphql_public` | same | `["public"]` |
| Legacy API keys | disabled after Track K | disabled after Track K | n/a |
| Session inactivity timeout | Pro+ only (`sessions_inactivity_timeout`): 30 days | Pro+ only: 30 days | n/a |

The Local column is the target state; today's `supabase/config.toml` differs (`site_url` and the redirect list point at PROD/TEST, password, email-change and template settings are missing; see 5.4 step 1).

**Go/no-go assertions before any environment enables sign-ups:** `mailer_autoconfirm=false`, `mailer_secure_email_change_enabled=true`, `disable_signup` as expected, anonymous off, captcha on, `private.settings.default_plan_id` and `terms_version` present, `auth-config.ts --check` clean.

---

## 9. App change map

The 76 DB call sites are mapped one by one in **Appendix C**. This section lists the Clerk touchpoints and the non-DB files.

### 9.1 Clerk touchpoints

| Touchpoint | Today | Replacement | Phase |
|---|---|---|---|
| `middleware.ts:1-14` | `clerkMiddleware`, broad matcher incl. `/monitoring`, `/ingest` | 0A: narrower matcher + sign-in URL env; 2: maintenance + provider switch + `updateSession` on session paths; 5: Supabase only | 0A/2/5 |
| `components/wrappers/PageWrapperClient.tsx:6,16-20,29` | `<ClerkProvider>` | `<AuthProvider>` (Clerk bridge in 1, Supabase in 2); `CookieBanner` moved inside `UserContextProvider` | 1/2 |
| `components/auth/Auth.tsx`, `app/auth/[[...rest]]/page.tsx` | `<SignIn>`/`<SignUp>`, localStorage consent | Supabase forms, Google button, forgot/update password, callback, confirm interstitial, consent page | 2/5 |
| `components/navigation/AuthLinks.tsx:3,15,34-80,104-112` | `useUser`, `<UserButton>`, `.cl-userButtonBox` click hack | `useAuth()` + `UserMenu` | 1 |
| `components/dashboard/Settings.tsx:6,33-39` | `<SignOutButton>`, `<UserProfile/>` | `ClerkAccount` (1) → `AccountSettings` (2) | 1/2 |
| `context/UserContext.tsx:3-4,23,36,46-50` | `useUser` → `getUserData(clerkUser.id)` | `useAuth()` → `getUserData()` | 0A/1 |
| `context/CatalogueContext.tsx:9,73,284-290` | stamps `createdBy` | removed | 0B |
| `components/general/CookieBanner.tsx`, `components/modals/CookiePreferencesModal.tsx`, `utils/cookies.ts:87-106`, `app/api/update-consent/route.ts` | Clerk `publicMetadata.cookieConsent` | `users.cookie_preferences` via `saveCookiePreferences`; route deleted | 1 |
| `actions/catalogue.ts:14,43,66,96,134,182,243,325`; `actions/themes.ts:3,17,79,88`; `actions/users.ts:5,11-27`; `lib/ai/access.ts:5,35`; `app/admin/[name]/{builder,qr-editor}/page.tsx`; `app/api/dashboard/*` | `currentUser()` | `requireIdentity()` / `getVerifiedIdentity()` / `requireUser()` | 0A/0B |
| `app/api/users/[id]/route.ts` | `auth()` + `currentUser()` | deleted | 0A |
| `app/api/clerk/route.ts`, `lib/users/syncFromClerk.ts`, `constants/users.ts`, `actions/users.ts:41-127` | anon webhook sync | `asAdmin` via `lib/users/provision.ts` (0A); M10 triggers (2); deleted (5) | 0A/2/5 |
| `agent/session.ts:68-69,81,90`, `agent/tools.ts:425-433` | Clerk id in session | `saveTheme` port | 0B |
| `tests/e2e/global.setup.ts`, `tests/e2e/auth.setup.ts`, `playwright.config.ts:5,9` | `@clerk/testing` | provider switch; Supabase setup via admin `generateLink` + `verifyOtp`; storage `playwright/.auth/user.json` | 2/5 |
| `tests/unit/context/CatalogueContext.test.tsx:6-8`, `tests/unit/server_actions/ai.test.ts`, `tests/unit/agent/tools.test.ts:24,331-402` | Clerk mocks (`CatalogueContext.test.tsx:6-8`, `ai.test.ts:11`), `@/utils/drizzle` mock (`ai.test.ts:12`), `@/actions/themes` `persistTheme` mock + session `userId` (`tools.test.ts:24,331-402`) | `@/lib/auth/identity`, `@/utils/db`, `@/lib/ai/metering` mocks; non-owner → `not_found` | 0A/1 |
| `css/clerk.css`, `css/index.css:4`, `app/globals.css:5`, `instrumentation-client.ts:58-60` | Clerk styling and ignoreErrors | deleted | 5 |
| `package.json:21,111`, `.gitignore:25,55-56`, `.github/workflows/ci.yaml:45-48`, `.env.local` | Clerk deps, paths, secrets | removed (CI secrets after R2 closes) | 5 |
| `app/terms-and-conditions/page.tsx:403`, `README.md:37`, `docs/architecture/ai-chat-flow.md:61`, `plans/archive/sentry-remediation-plan.md:35,83-85,167-171`, skills | Clerk references | updated | 1/5 |
| `constants/schemas.ts:270` | `auth??mode=signup` typo | fixed | 0A |
| `public.users.image` on `img.clerk.com` | Clerk CDN avatars | R1 replaces with Google URL or null; initials fallback in `UserMenu` and `components/dashboard/components/UserProfile.tsx` | 4 |

### 9.2 Other files touched

| File | Change | Phase |
|---|---|---|
| `next.config.ts` | delete CORS block (`:23-45`); remove `puppeteer` (`:7`); `env: { NEXT_PUBLIC_AUTH_PROVIDER }`; CSP report-only header | 0A/2 |
| `sentry.server.config.ts:19,22`, `sentry.edge.config.ts:20,23`, `instrumentation-client.ts:42,47,74` | scrubber, `sendDefaultPii: false`; during the cutover week temporarily report (not ignore) "An unexpected response was received from the server." | 0A/4 |
| `vercel.json` | `"regions": ["fra1"]` (Hobby: single region, supported) | 1 |
| `vitest.config.ts` | alias `server-only` to the absolute file `fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url))` (a bare `server-only/empty.js` alias fails: the subpath is not exported); new `vitest.integration.config.ts` | 0A/1 |
| `app/admin/layout.tsx` (new) | server-side `requireUser()` + consent-version gate inside one `withUser` tx | 2 |
| `biome.json`, `.github/workflows/ci.yaml` | restricted imports; `biome lint --error-on-warnings`; `db-tests` job; PGlite job; e2e matrix | 1/2 |
| `drizzle.config.ts` (app) | delete (points at a non-existent schema) | 1 |
| `docs/guides/drizzle.md`, new `docs/architecture/data-access.md`, new `docs/architecture/auth.md` | schema changes via `supabase/migrations` only; roles and helpers; auth flows and local setup | 1/2 |
| `plans/active/ai-agent-plan-mode.md` Part 2 | note: server-minted turn ids through a definer only | 1 |

---

## 10. Coordinated changes outside the app

### 10.1 Worker (`../quicktalog-backend`)

| Change | Phase | Details |
|---|---|---|
| HTTP route auth | 0A | Bearer `WORKER_ADMIN_TOKEN` on `/api/images/cleanup` and `/api/generate/pdf` (`src/index.ts:25-26`); drop CORS `*` (`:16-23`); cleanup dry-run by default with a deletion floor |
| Usage computed in the worker | 0A | `subscriptionProcessingJob.ts:17-54`: count catalogues, paginated monthly `analytics` sum; inactivation returns names; POST `/api/revalidate` with secret and names |
| Kill switch | 0A | `JOBS_PAUSED` checked at the top of `scheduled()` (`src/index.ts:31-36`) |
| Test env project | 0A (after route auth + input 5) | `wrangler.jsonc:18,28` → TEST; TEST secret key |
| `@quicktalog/common` | 0A, then after each release | lock is 1.51.0 |
| `sb_secret_` key | Track K | replaces `SUPABASE_SERVICE_ROLE_KEY` |
| Cutover | 4 | `JOBS_PAUSED=true` through the window; keep the window 90 minutes clear of the 03:00 UTC cron |
| Starter traffic enforcement | input 17 | today skipped (`:17-20`) |

### 10.2 `@quicktalog/common`

After M03, M06 and M10: `drizzle-kit pull` against TEST with an admin URL, `schemaFilter: ["public"]`, `entities: { roles: false }`, strip `pgPolicy`, `npm run release` once per migration batch (fix the double bump in `.husky/pre-push`), bump app and worker. Expected diff: prompts `turn_id`, `continuations`, `refunded_at`, `kind`, `plan_open`, `plan_budget`, `plan_hash`, nullable `catalogue`, `user_id` not null; ocr nullability; unique qr_configs; `users.welcome_email_sent_at`. Expression indexes may not round-trip (unverified). No type change for ids.

### 10.3 Redis (Upstash)

- Keys become `${REDIS_KEY_PREFIX}:catalogue:${catalogueId}` with a 30-day sliding TTL; values never contain `createdBy`; server fields always come from the DB row. Keying by the immutable catalogue id means a reused slug never shows the previous owner's draft.
- Rate-limit keys `${prefix}:rl:<rule>:<key>`.
- Legacy unprefixed slug keys are dropped once with `scripts/redis/delete-legacy-keys.ts` after **both** environments run Phase 1 code (if Redis is shared across environments, only after PROD is on Phase 1; input 4). Unsaved legacy drafts are lost once (input 18 if they must be migrated).
- No flush at cutover.

### 10.4 Next ISR and data cache

- Only `lib/catalogue/public.ts` feeds `/api/items*`, `generateStaticParams`, `generateMetadata`, the sitemap and any future `unstable_cache`; tags `catalogue-${name}`, `catalogues-list`, `catalogue-detail`, `catalogue-metadata` are kept.
- Revalidate after the Phase 0A and Phase 1 deploys (payloads lose `created_by`), after worker inactivation (names posted), and at T-0.
- `withPublic` in `generateStaticParams` needs `DB_CONNECTION_STRING` in the Vercel build environment (unverified that it is set); the bundle-analysis CI build returns `[]` when no URL exists.

### 10.5 Paddle

| Topic | Change | Phase |
|---|---|---|
| Checkout | Paddle customer resolved or created first and pinned as `customerId`; server-created transaction, signed `customData` | 0B |
| Resolution | signed `customData.user_id` (Clerk id through the map only when the signature verifies) that contradicts the user linked to `customer_id` → unresolved queue (`conflict`); else linked `customer_id` → signed user without a `customer_id` (link) → unresolved queue (200, Sentry fatal) | 0B/1 |
| Errors | rethrow → 500 → Paddle retries; any response other than 200 within 5 s counts as a failure (https://developer.paddle.com/webhooks/about/respond-to-webhooks/) | 0A |
| Idempotency, ordering | `private.paddle_events`; `occurred_at` guard | 1 |
| Plan changes | only `where users.customer_id = event.customerId`; `applyPlanDowngrade` on loss of plan | 0B |
| Maintenance window | `/api/paddle` returns 503 while maintenance is on. Live Paddle retries 60 times over 3 days (20 in the first hour), so PROD events are redelivered. Sandbox retries only 3 times within 15 minutes: after every TEST rehearsal, list notifications with status `failed` (Paddle API `GET /notifications?status=failed`) and replay them (`POST /notifications/{id}/replay`) | 2/4 |
| Account deletion | cancel before delete (Clerk webhook in 0B, `actions/account.ts` in 2) | 0B/2 |
| `subscription.updated` plan change | does not update `plan_id` today; decide (input 19) | - |
| Email changes | `users.email` follows auth; Paddle customer email only if chosen (input 20) | 2 |

### 10.6 Brevo, CRM and edge functions (sources in no repo)

- Download PROD functions `create-brevo-contact`, `create-crm-contact`, `discord-subscription-alert`, `sync-available-plans` in Phase 0A. Check anon-key use (M00 blocker), whether they store `users.id` as an external id (duplicates after uuids; update CRM records by email with the map before T-0) and which user columns they read.
- M02 parameterises the base URL per project and narrows the Brevo trigger to `email, name, plan_id, customer_id`. Name changes are bounded by the `updateProfile` rate limit, and M10 never syncs names from `user_metadata`.
- Track K replaces the service_role bearer with `x-webhook-secret`.
- `contacts.id` changes from Clerk ids to uuids at the re-key; notify whoever consumes the views (input 9). Legacy consent rows are marked `source: legacy_default`; the `contacts` view and CRM payload should treat them as unknown (legal, input 14).
- Account deletion does not erase Brevo/CRM contacts; manual process or an edge function (input 9).

### 10.7 Legal, docs, skills

| Item | Change | Phase |
|---|---|---|
| Terms sub-processors (`app/terms-and-conditions/page.tsx:403`) | remove Clerk; add Resend if missing; Cloudflare covers Turnstile | 5 (text prepared in 2) |
| Privacy policy | auth data in Supabase, Turnstile bot check, auth email via Resend, `sb-*` essential cookies | 2 |
| Consent contract | DB default not-accepted, `terms_version`, consent gate for OAuth, imported and legacy users | 2 (legal sign-off, input 14) |
| Exposure notification | decision on GDPR Art. 33/34 after the Phase 0A audit | 0A |
| `.claude/skills/server-action-and-route/SKILL.md:20-101` | `requireIdentity()` + one `withUser` with owner predicate, `.returning()` checks, post-commit side effects | 1 |
| `.claude/skills/code-conventions/SKILL.md:16,35,45`, `data-revalidation/SKILL.md` | `@/utils/db`, `lib/<domain>`, AuthContext vs UserContext, id-keyed drafts | 1 |

---

## 11. Testing strategy and CI

### 11.1 Layers

| Layer | Where | What it proves | Runs |
|---|---|---|---|
| Unit | `tests/unit/**` (Vitest, `server-only` aliased) | identity minting, `safeNext`, scrubber, action shapes (`pickEditable` keys, owner predicates, returned names), entitlements, draft cache (id keys, no `createdBy`), Paddle signature and resolution, agent route (401/400/404/429, forged continuation charged, refund rules), middleware (no `Set-Cookie` on public paths, fail-closed bypass), import script guards | every PR |
| Architecture | `tests/unit/architecture/db-boundaries.test.ts` | resolved-import allowlists; no role/claims switching outside `utils/db`; no `sql.raw(` and no `.execute(` with a non-template argument; no `SET SESSION ROLE`/`RESET ROLE`/`RESET ALL`; no supabase-js `.from/.rpc/.schema`; only `identity.ts` mints `VerifiedIdentity`; no `"use server"` export takes `userId`/`ownerId`/`createdBy`; no `"use server"` module transitively imports `utils/db/admin` | every PR |
| PGlite harness | `tests/db-pglite/` (ported from `verification/pglite-harness`) | the **actual** `supabase/migrations/*.sql` applied in file order on PG17 and PG18, the 692 scenarios of the final run (including C1-C12 and W1-W9), including real Drizzle SQL for every call site, temp-table shadowing blocked by the wrapper, pg_net exposure documented | every PR touching `supabase/` or `utils/db/` |
| pgTAP | `supabase/tests/database/*.test.sql` | perimeter, policies, grants, definers, ledger, integrity, auth triggers, remap, edge-function wiring | `db-tests` job |
| Integration (local Supabase stack) | `tests/integration/**` | `rls-leak` (pool `max:1`, no leaked role/claims after commit or error); `forgotten-wrapper` (M08); `grants-match-columns`; `postgrest-perimeter` (publishable key without and with a real user JWT: every table and RPC 401/403/404/42501); `ai-charge-race` (two pools, limit 1: exactly one `charged`); `migration-order` (fresh stack applies all files); `auth/signup` (real GoTrue incl. `admin.createUser` with a pre-claimed map row → no row; unconfirmed email sign-up → no row until confirmation); `cutover/rehearsal` | `db-tests` job |
| e2e (Playwright) | `tests/e2e/**` | create/publish catalogue; Supabase sign-in UI; `next=//evil.com` lands on the dashboard; sign-out clears cookies; one agent turn with a metering assertion via `DATABASE_ADMIN_URL`. UI tests that submit captcha-gated forms run against the local stack (captcha off); against TEST they only use the `generateLink` session | TEST and local stack; matrix `auth: [clerk, supabase]` until R2 closes on PROD |
| Manual gates | Paddle sandbox lifecycle (0B, 2, 4); Google sign-in (2, 3, 4); email deliverability (2) | flows CI cannot run | per phase |
| Load smoke | autocannon or k6 against a TEST preview after M08 | pool budget, 53300/57014/55P03 absent | Phase 1 |
| Scheduled perimeter check | GitHub Action cron (daily) with the publishable key and a dedicated monitor account JWT against TEST and PROD | drift (Studio edits, extension objects created by `supabase_admin` in `public`, new tables without RLS) | from G0A |

### 11.2 CI jobs (`.github/workflows/ci.yaml`)

1. `lint`: `npx biome lint --error-on-warnings .` (today `npm run lint` runs `biome lint --write`, which rewrites instead of failing).
2. `unit-tests`: `npm test` (includes the architecture test).
3. `db-pglite`: `sh tests/db-pglite/run-final.sh` (the harness ships shell entry points, no `run-all.mjs`: `run-final.sh` replays the final run in about 40 s, `run-all.sh` the first run in about 15 s; no Docker). After the port, point the apply step at `supabase/migrations/*.sql` (5.4 step 1).
4. `db-tests`: `supabase/setup-cli` → `supabase start -x studio,imgproxy,logflare,vector,edge-runtime` → `supabase test db` → `npm run test:integration`. Fallback if the baseline dump does not replay on the CLI image: keep `db-pglite` as the blocking gate and mark `db-tests` non-blocking until fixed.
5. `e2e-tests`: matrix `auth`; Supabase leg non-blocking until M10 is live on TEST.
6. `bundle-analysis.yaml` unchanged: the "no env at import" canary.

### 11.3 Test data rules

- pgTAP fixtures use uuid-shaped ids except `15_clerk_ids.test.sql`, which is deleted with M11.
- `50_auth_triggers` reproduces GoTrue's order: INSERT into `auth.users`, then UPDATE `raw_app_meta_data`, then the confirming UPDATE of `email_confirmed_at` (W1), with and without a pre-claimed map row.
- e2e cleanup uses `DATABASE_ADMIN_URL` and refuses the PROD ref.
- No real PII in CI; the PROD data rehearsal stays on an encrypted local volume.

---

## 12. Cutover runbook (PROD)

**Roles:** Operator (scripts, dashboards) and Verifier (smoke tests, logs). One person can do both; steps are written for two.

**Timing:** a low-traffic weekday, at least 90 minutes clear of the 03:00 UTC worker cron. Durations marked "rehearsal" come from the TEST dress rehearsal.

### 12.1 Before T-0

| When | Step | Go/no-go evidence |
|---|---|---|
| T-14 | Phases 0A, 0B, 1, 2 done on PROD (M00-M08, M10 applied; `main` contains the dark build; flag `clerk`); Track K done | `schema_migrations`; perimeter test green on PROD; legacy keys disabled |
| T-14 | Section 14 inputs answered (MFA, avatars, consent/legal, Paddle cancel timing, apex host, UploadThing token, retention) | written decisions in the cutover PR |
| T-14 | PROD auth config applied with `disable_signup: true`; `auth-config.ts --check prod` clean; `mailer_autoconfirm=false`, `mailer_secure_email_change_enabled=true` | no drift |
| T-14 | ES256 current on PROD; Google redirect URI added; Resend domain verified; Turnstile widget live | screenshots, test mail in inbox |
| T-14 | Backups: PITR/backup state recorded (input 11); `pg_dump` rehearsed with `MIGRATION_DATABASE_URL` | dump restores locally |
| T-14 | Deploy freeze plan: from T-7 only cutover fixes; the rollback path is a tagged-commit redeploy, not Instant Rollback | tags created |
| T-10 | TEST dress rehearsal incl. rollback R1 and re-cutover (Phase 3) | timings; V1-V12 green twice |
| T-7 | Announcement email; banner item `banner_prod` prepared in Global Config | sent count |
| T-7 | Optional PROD data rehearsal on a local copy | re-key < 60s |
| T-3 | Clerk freeze (profile edits, password reset notice); CSV export #1; dry-run then real import; C1-C8 | every non-migrated row has a decision |
| T-3 | `preflight.sql` on PROD | `unmapped_auth_users = 0`, no `analytics_upsert_trigger`, default plan ok, no duplicate emails, **no unmapped user with `customer_id`** |
| T-1 | Go/no-go meeting (below); Global Config `maintenance_prod` toggle tested on PROD during a 1-minute off-peak test (wait 15 s after the write, check from two requests) | all yes |
| T-1 | `JOBS_PAUSED` tested on the TEST worker (`wrangler dev` `/__scheduled` logs "paused") | log line |

**T-1 go/no-go (all yes):** TEST R1 drill passed; PROD import reconciled; scripts tagged; `MIGRATION_DATABASE_URL` works from the operator machine; Clerk PROD admin available; Vercel, Supabase, Cloudflare, Paddle dashboards logged in; no open Paddle incident; rollback owner named; 4h monitoring time available; Sentry alert rules (12.4) active; canary accounts ready (imported password user, imported Google user, fresh inbox).

### 12.2 T-0 ordered steps

| # | Time | Step | Command / action | Check |
|---|---|---|---|---|
| 1 | 2m | Banner on | Global Config `banner_prod` = cutover notice (30 minutes before start); wait 15 s after the write, then check from two requests before proceeding | banner visible |
| 2 | 2m | Pause worker | `wrangler secret put JOBS_PAUSED --env prod` (`true`) | no running `scheduled` |
| 3 | 1m | **Maintenance on** | Global Config `maintenance_prod = true`; wait 15 s after the write (propagation takes up to 10 s), then check from two requests before proceeding | `/admin/dashboard` and any `next-action` POST → 503; public catalogue → 200; `/api/paddle` → 503 |
| 4 | 2m | Freeze Clerk | Clerk PROD: sign-up mode Restricted; disable the `/api/clerk` webhook | Clerk UI |
| 5 | 3m | Final export | Clerk CSV #2 to the encrypted dir; `export EXPORTED_AT=<UTC ISO>` | header check |
| 6 | rehearsal | Delta import | `DRY_RUN=1 ALLOW_PROD=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts --delta`, then `DRY_RUN=0` | C1-C8 hold; 0 `error`; digest updates applied |
| 7 | rehearsal | Backup | `pg_dump "$MIGRATION_DATABASE_URL" --data-only --schema=public --schema=migration -Fc -f prod-pre-remap-<ts>.dump` | exit 0 |
| 8 | 2m | Preflight | `psql ... -f scripts/cutover/preflight.sql > preflight-t0.txt`; list and terminate idle-in-transaction sessions touching `users` | values as at T-3; V6 baselines recorded |
| 9 | rehearsal | **Re-key** | `psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/remap-user-ids.sql` | `COMMIT`; on lock timeout retry once; any other exception → stop (automatic rollback, no user impact) |
| 10 | 1m | Record M11 | `supabase db push --linked --skip-vault` (M11 is idempotent) | migration listed |
| 11 | 3m | Verify | `psql ... -f scripts/cutover/verify.sql > verify-t0.txt` | V1-V12. **Go/no-go #2** |
| 12 | rehearsal | Flip provider | Vercel Production env `AUTH_PROVIDER=supabase` → redeploy the tagged cutover commit (maintenance still on) | `/auth` renders Supabase form for operators |
| 13 | 20m | Smoke behind maintenance | Operator and Verifier set `qt-maint-bypass=<token>`; run S1-S12 | all pass. **Go/no-go #3** (no-go → R1 with no user exposed) |
| 14 | 2m | Open sign-ups | `auth-config.ts --apply prod --set disable_signup=false` | `GET /auth/v1/settings` |
| 15 | 1m | **Maintenance off** | Global Config `maintenance_prod = false`; banner off; wait 15 s after the write, then check from two requests before proceeding | `/admin/dashboard` → 307 `/auth` when signed out |
| 16 | 10m | Post-open checks | S13, S14 from a fresh browser | pass |
| 17 | 1m | Revalidate | `curl -fsS -X POST -H "x-revalidate-secret: $REVALIDATE_SECRET" -d '{"dashboard":true}' https://www.quicktalog.app/api/revalidate` | 200 |
| 18 | 2m | Resume worker | `JOBS_PAUSED=false` | next run writes `job_logs` |
| 19 | - | Log and comms | `insert into migration.cutover_log(step, detail) values ('go-live', ...)`; T+0 emails | sent |

### 12.3 Smoke tests

| # | Test | Pass |
|---|---|---|
| S1 | Password sign-in with an imported account | lands on `/admin/dashboard`; `sb-uhfbapjuzvlyzyodxhqn-auth-token` set; Clerk cookies gone |
| S2 | Dashboard data | plan, catalogue count, monthly usage equal `preflight-t0.txt` |
| S3 | Continue with Google (imported Google user) | same uuid as the map; no duplicate `auth.users` |
| S4 | Consent gate | shown once; `consents->>'version'` set |
| S5 | Builder edit + publish own catalogue; open another user's slug | own works; other 404 |
| S6 | Public page and `/api/items/<slug>` signed out | 200, no `Set-Cookie`, no `created_by` |
| S7 | Preview own draft signed in / signed out | 200 / redirect to `/auth` |
| S8 | Agent turn; continuation of a real plan; forged continuation (script) | one charge; continuation free; forged charged |
| S9 | Cookie preferences change + reload | persisted in `users.cookie_preferences` |
| S10 | Forgot password → email → interstitial → new password → sign in | pass; no `token_hash` in PostHog URLs |
| S11 | Sentry test event from `/admin` | no cookies, `authorization`, tokens |
| S12 | Sign out (local) | cookie cleared; `/admin` redirects |
| S13 | New sign-up (fresh inbox, no bypass): confirm, dashboard, welcome email once; delete account | row with default plan and not-accepted consents until the gate; delete removes auth + public rows + drafts |
| S14 | Perimeter test with the S13 user's JWT against PROD (read-only requests, before deletion) | 401/403/42501 everywhere |

### 12.4 Monitoring (T+0 to T+7)

- **Sentry alert rules** on tagged events emitted by the auth UI and server: `auth.signin_failed{imported, reason}`, `auth.signup_failed`, `db.23514`, `db.23503`, `db.42501`, `paddle.unresolved`, 5xx on `/admin/*`, `/auth/*`, `/api/agent`.
- **Read-only SQL loop** every 5 minutes for the first 4 hours from the operator machine: V2, V3 (confirmed users only, as defined in 6.7), adoption (`last_sign_in_at > T-0` among mapped users), new sign-ups, `paddle_unresolved_events` count.
- **Canaries** re-tested at T+15m, T+1h (first access-token expiry wave), T+4h: password user, Google user, reset flow.
- **Paddle:** at T+1h, Paddle dashboard > Notifications shows no failed deliveries for the window; `/api/paddle` p95 stays under 2 s (Paddle needs a 200 within 5 s).
- **Auth logs:** `over_request_rate_limit` on `/token`/`/verify` (forwarded IP should prevent them), `flow_state_not_found` (apex/www), `otp_expired` clusters, `Database error saving new user`.

**Rollback triggers (any one):** V12 fails or a canary cannot sign in with its strategy; the sign-up trigger fails and cannot be fixed within 30 minutes; >1% 5xx on `/admin/*` or `/auth/*` for 15 minutes with no fix in sight; Paddle events cannot be resolved; any cross-user data exposure.

### 12.5 Rollback tiers

| Tier | Window | Procedure |
|---|---|---|
| **R0** | before step 9 (re-key) | Global Config `maintenance_prod=false`; Clerk sign-up Public; re-enable Clerk webhook; `JOBS_PAUSED=false`. Imported `auth.users` stay dormant. |
| **R1** | step 9 to T+2h | steps below |
| **R2** | T+2h to T+72h (closed at T+7 at the latest) | same as R1, with more Supabase-only users; the decision owner weighs it against fixing forward |
| **R3** | after R2 closes, or once the Clerk instance or export is stale | fix forward only; point of no return is Clerk instance deletion at T+30 |

**R1/R2 steps:**
1. Global Config `maintenance_prod=true` (no deploy; wait 15 s after the write, then check from two requests before proceeding); `disable_signup=true`; `JOBS_PAUSED=true`.
2. Snapshot `verify.sql` output.
3. `ALLOW_PROD=1 npx tsx scripts/cutover/push-supabase-users-to-clerk.ts`:
   - only users outside the map **with `email_confirmed_at is not null` and not banned**; unconfirmed sign-ups are dropped and emailed;
   - Clerk `createUser({ emailAddress, externalId: uuid, passwordDigest (bcrypt) | skipPasswordRequirement })` (Restricted mode allows Backend API creation and such emails are verified by default, per https://clerk.com/docs/guides/secure/restricting-access and https://clerk.com/docs/reference/backend/user/create-user; confirm once in the TEST drill);
   - insert the new Clerk id into **`migration.clerk_user_map` with `origin='rollback_push'`, `status='migrated'`**, so a later re-cutover maps them back;
   - users in `migration.auth_user_deletions` that have a `clerk_user_id` are deleted in Clerk (their account erasure must not be undone; their map rows already carry `status='deleted'`, W2);
   - migrated users whose Supabase digest differs from the T-0 CSV: `clerkClient.users.updateUser(id, { passwordDigest, passwordHasher: "bcrypt" })`.
4. `psql ... -f scripts/cutover/rollback-remap.sql` (Appendix A.R2); verify no uuid ids remain and per-user counts match step 2 through the map.
5. Clerk PROD: sign-up Public, webhook on.
6. Vercel env `AUTH_PROVIDER=clerk` → redeploy the tagged pre-cutover commit.
7. Global Config `maintenance_prod=false`; revalidate; `JOBS_PAUSED=false`; email users created or changed during the window.
8. Paddle: checkouts during the window carry signed uuids; resolution maps them through the map in both directions.

**Data repair (not rollback):** restore affected tables from `prod-pre-remap-*.dump` into a scratch schema and repair row by row through the map. Never restore the whole database.

### 12.6 Orphan triage (before M12)

| Case | Detection | Action |
|---|---|---|
| `public.users` row with a Clerk id whose Clerk user no longer exists | V1 rows absent from the Clerk list | owns nothing → delete before T-0; owns data → contact, import as a new auth user with a map row, re-key that row alone |
| Map `skipped` / `conflict` | status | resolve manually, then the single-user re-key |
| Accepted legacy rows | V1 | the NOT VALID CHECK makes them un-updatable, so none may have `customer_id` or active subscriptions (R1 precondition); keep until T+30, then delete and apply M12 |

---

## 13. Risks and mitigations

| # | Risk | Likelihood / impact | Mitigation | Residual |
|---|---|---|---|---|
| R1 | Anon Data API hole abused before M00 | Unknown (key public by design; a browser client existed in history) / critical | Phase 0A first, measured in days; exposure audit before and after; remediation script | Past abuse may already exist; audit decides notification |
| R2 | A missed anon caller breaks when M00 lands (e.g. an edge function using the anon key) | Medium / high | Logs check, edge function download and grep, TEST soak; targeted re-grant rollback that keeps RLS on | Low |
| R3 | SQL injection inside `withUser` | Low (no dynamic SQL; lint bans `sql.raw` and string `execute`) / high | Parameterised `set_config`; `search_path` pinned per tx; M08 so `RESET ROLE` lands on a role with no privileges; architecture test | **Open:** after M08 an injection can still rewrite `request.jwt.claims` and impersonate another tenant, and can read the pg_net queue (a webhook secret after Track K). Optional future hardening: HMAC-signed claims verified in a definer helper (not designed here). |
| R4 | `supabase_admin` default ACL grants `anon`/`authenticated` ALL on objects it creates in `public` | Low / high | Daily perimeter check; `00_perimeter` catalog queries after every extension change | Detection, not prevention |
| R5 | `statement_timeout` / pooling behave differently from PGlite | Medium / medium | Integration tests on the local stack; load smoke after M08; abort thresholds | Supavisor per-role pool size unverified |
| R6 | Supavisor rejects the custom `app_rls` login | Low / medium | Test on TEST first; rollback = `DB_CONNECTION_STRING` back to `postgres` (policies still apply) | - |
| R7 | Imported users get a default row (GoTrue app_metadata order) | Fixed / critical | Map-based skip (verified); integration test with real GoTrue | - |
| R8 | Import script deletes data after the re-key | Fixed by design / critical | Post-cutover mode, `--allow-delete`, `totalCount` check, deletion threshold, unit tests | - |
| R9 | Re-key lock deadlock with webhooks | Low / high (window aborted) | ACCESS EXCLUSIVE before the precondition reads (W9, PGlite-verified: no lock upgrade); Paddle 503 during maintenance; terminate idle sessions; retry once | - |
| R10 | GoTrue per-IP limits from Vercel egress | Medium / high on cutover day | Browser-side credential calls; forwarded-IP client for server calls (forwarding covers every IP-limited endpoint); TEST forwarding test with distinct and repeated `Sb-Forwarded-For` values | - |
| R11 | Legacy key shutdown before migration | Medium / high | Track K with a recorded date, 4-week buffer | Official date still TBC |
| R12 | Hobby rollback limits (Instant Rollback reaches only the previous deployment) | High / medium | Runtime maintenance switch via Global Config (available on Hobby; per-environment keys in the single store); tagged-commit redeploys; deploy freeze | Up to 10 s write propagation (wait 15 s and check); Upstash fallback if the account's store is taken |
| R13 | Refresh token readable by JS (XSS = session takeover for 400 days) | Low / high | CustomCode sandbox test, HtmlContent allowlist, CSP, GTM rights, inactivity timeout if plan allows | Inherent to `@supabase/ssr` |
| R14 | Paddle `customData` not present on subscription events | Low (copying to the subscription is documented) / high (unlinked customers) | Sandbox gate in 0B; `transaction.completed` fallback; unresolved queue with manual link; `customerId` pinned at checkout so a reused customer cannot credit another user | - |
| R15 | Forged plan continuations / chat-only refunds abused for free model spend | Medium / medium (cost) | Continuation bound to a recorded open plan (turn id, hash, budget ≤ 8); refund cap per month | Steering within one paid plan remains; `planFromMessages` must reproduce the server plan hash (unit test) |
| R16 | Legacy oversized or odd-slug rows become un-updatable under NOT VALID CHECKs | Medium / medium | `octet_length` and slug audits before M03/M07; raise limits or fix rows first | - |
| R17 | Email change without confirmation lets a user point `users.email` at a third party | Low / medium | Go/no-go asserts `mailer_autoconfirm=false` and secure email change | - |
| R18 | MFA users lose their second factor | Depends on counts / medium | Import without password unless TOTP is built | Users must reset or use Google |
| R19 | Brevo/CRM duplicates when `users.id` becomes a uuid | Unknown (edge function source not in repo) / low | Inspect functions in 0A; update CRM by email before T-0 | - |
| R20 | Merge of 39 commits `test`→`main` brings unrelated regressions | Medium / medium | Soak on PROD 24h before M00; Sentry watch | - |
| R21 | Unauthenticated worker cleanup deletes PROD images if tokens are shared | Unknown / high | Route auth and dry-run default before the test worker is repointed; input 5 | - |
| R22 | Consent/legal contract rejected by legal after build | Medium / medium | Legal sign-off at Phase 2 start (input 14) | - |
| R23 | The Appendix A SQL (C1-C12, W1-W9) contains a defect PGlite cannot see | Low (final run: 692 scenarios, 0 failures on PG17.5 and PG18.3 after W1-W9; the 15 failures of the SQL as first written were all fixed) / medium | PGlite harness in the repo runs the migration files on every PR; pgTAP and integration tests on the local stack; TEST before PROD | Behaviour PGlite cannot model: multi-connection locking, `statement_timeout`, Supavisor, supautils (trigger DROP on `auth.users`), live GoTrue/PostgREST/pg_cron |

---

## 14. Inputs needed from you

| # | Question | Why it matters | Needed by |
|---|---|---|---|
| 1 | Is merging `test` into `main` (39 commits) acceptable as part of Phase 0A? | M00 on PROD depends on it | 0A start |
| 2 | Clerk PROD user counts: total, with password, with verified Google, MFA-enabled, banned, unverified email, username-only, 30-day active | rollback cost, comms, go/no-go | T-14 |
| 3 | Output of the read-only PROD `preflight.sql` and `exposure-audit.sql` | M00/M01/M03 safety, re-key blockers | 0A |
| 4 | Is Upstash Redis shared across TEST, PROD, local and CI? | legacy key deletion timing | 1 |
| 5 | Is `UPLOADTHING_TOKEN` shared between the test and prod workers/apps? | blast radius of the cleanup route; test worker repoint | 0A |
| 6 | Clerk PROD settings: identifiers, strategies (password, email code/link, username), social providers and whether Google uses custom credentials, passkeys, password policy, bot protection, session lifetime | edge cases, Google client reuse, UI scope | 2 start |
| 7 | If MFA users exist: build Supabase TOTP before cutover, or import them without passwords (reset by email / Google)? | account security at cutover | 2 |
| 8 | If PROD migration history does not match the repo: approve a manual reconciliation session | M00 mechanism | 0A |
| 9 | Behaviour of the PROD edge functions (key usage, `users.id` storage, columns read); consumers of `contacts`/`active_subscriptions`; who erases Brevo/CRM contacts on deletion | M00 safety, CRM duplicates, GDPR erasure | 0A / T-14 |
| 10 | Vercel: plan (Hobby confirmed), team slug, function region, Fluid compute setting, preview branches needing auth, whether the account's single Global Config store is free | region co-location, allow-lists, maintenance switch | 1 / 2 |
| 11 | Supabase plan tier per project (PITR/backups, leaked-password protection, session controls, custom domain) | backup gate, hardening | 2 |
| 12 | Sentry `sendDefaultPii`: keep `false` everywhere (plan default) or re-enable on the client with the scrubber? | privacy | 0A |
| 13 | Legal decision on breach notification if the exposure audit finds abuse or PII access | GDPR Art. 33/34 | 0A exit |
| 14 | Legal: current terms version string; not-accepted consent default; prompting existing and imported users once; treatment of legacy all-true consents; processor wording (Supabase Auth, Resend, Turnstile) | M10, consent gate, legal pages | 2 start |
| 15 | Cutover date and window, acceptable maintenance duration (~60-90 minutes of write freeze), operator and verifier names | runbook | T-14 |
| 16 | Does apex `quicktalog.app` redirect to `www`? | PKCE host consistency | 2 |
| 17 | Should the worker enforce the Starter traffic limit (skipped today)? | worker change | 0A |
| 18 | Legacy unsaved Redis drafts: drop once (plan default) or migrate? | Phase 1 | 1 |
| 19 | Should `subscription.updated` plan changes update `plan_id`? | billing correctness | 0B |
| 20 | Should the Paddle customer email follow auth email changes? | billing contact | 2 |
| 21 | Product limits: content 1 MiB, colors 4 KiB, QR 64 KiB, cookie prefs 2 KiB, other catalogue jsonb 1 MiB total, AI continuation window 15 min and budget 8, refund window 10 min and cap 30/month, rate limits | M03, M06, M07 | 1 |
| 22 | Resend: `auth.quicktalog.app` as the auth sending subdomain; DNS access; plan quota; separate account for TEST? | deliverability | 2 |
| 23 | Access to the Google Cloud project holding Clerk's Google credentials (if custom) | Google provider | 2 |
| 24 | Avatars: drop Clerk-uploaded custom avatars (initials fallback, plan default) or re-host in Supabase Storage? | R1 image handling | 3 |
| 25 | Paddle: sandbox vs live per environment, Starter price id per environment, cancel immediately or at period end on account deletion | M10 seed, deletion flow | 2 |
| 26 | What is Supabase project `tpcfltcupcofteovrvmu`, and may it be abandoned? | worker repoint | 0A |
| 27 | Rollback window: Clerk instances kept 30 days, R2 closed at T+7? | runbook | T-14 |
| 28 | Retention for `migration.clerk_user_map` (plan: kept minimised forever) and `private.backup_*` tables | M13, GDPR | 5 |
| 29 | Should chat OCR be metered and `ocr_ai_import` enforced (the `ocr` table is never written today)? | entitlements | 1 |
| 30 | Can the worker's D1 `logs` table hold user ids or PII? | data inventory | 0A |
| 31 | Is a unique index on `lower(users.email)` intended? | import, support | 3 |
| 32 | Any external consumers of `/api/pdf` or the worker's `/api/generate/pdf` before deletion/lockdown? | 0A deletions | 0A |
| 33 | Should owners be able to share draft previews through signed links (preview becomes owner-only)? | product | 0A |
| 34 | Custom Supabase auth domain wanted? (must be adopted before T-14 or it signs everyone out again) | Google consent screen branding | 2 |

---

## 15. Effort estimate (rough, honest)

Developer-days assume one developer who knows the codebase; calendar includes soaks, rehearsals and waiting on inputs.

| Phase | Work | Dev-days | Calendar |
|---|---|---|---|
| 0A | 6 supabase-js paths, IDOR quick fixes, unauthenticated endpoints, Sentry, worker auth and usage, M00 on TEST and PROD, exposure audit, merge `test`→`main` | 6-9 | 1.5-2 weeks |
| 0B | catalogue action integrity, newsletter, helpers out of `"use server"`, Paddle signed checkout and resolution, Clerk deletion cancels Paddle | 5-8 | 1-1.5 weeks (overlaps 1) |
| K | worker key, edge function header auth (sources first), M09, disable legacy keys | 2-4 | spread over 3-4 weeks |
| 1 | M01-M08 + pgTAP + PGlite harness port + CI; `utils/db`, entitlements, metering + agent binding, draft cache, all 76 call sites, cookie consent, AuthContext/UserMenu, guardrails, tests; TEST and PROD rollout with soaks | 18-25 | 4-6 weeks |
| 2 | clients, middleware, flags, auth UI, confirm/callback, consent gate, account settings, deletion, M10, auth config as code, Resend/Google/Turnstile, CSP, e2e matrix | 14-20 | 3-4 weeks |
| 3 | import script with guards, fixture rehearsal, TEST cutover + rollback drill, PROD local rehearsal, dark import | 6-9 | 2 weeks |
| 4 | window (half a day) plus hotfix and monitoring buffer | 2-3 | 1 week |
| 5 | Clerk removal, DNS, legal/docs, M12/M13 | 2-3 | T+14 to T+30 |
| **Total** | | **55-81** | **~3.5-4.5 months** |

Largest uncertainties: PROD state (migration history, data anomalies), edge function sources, legal turnaround on consent, and whether the baseline dump replays in CI.

---

## Appendix A. Proposed SQL (verified version plus marked changes)

**How to read this appendix:**
- Each `MIGRATION Mnn_<name>` block becomes `supabase/migrations/<UTC timestamp>_<name>.sql`, in this order. `R1`/`R2` are operator scripts, not migrations. A.15-A.16 are read-only scripts.
- Text without a tag comes from the SQL verified in the first PGlite run (patches P1-P5 applied as described in Appendix D.2; `verification/pglite-results.md`).
- `-- CHANGE Cn` marks every statement added or changed after the first PGlite run. `-- CHANGE Wn` marks the fixes from the final run.
- **Status of every block, including every `CHANGE Cn` and `CHANGE Wn` statement: PGlite-verified (final run)** on PostgreSQL 17.5 and 18.3, 692 scenarios, 0 failures (`verification/final-sql-results.md`, Appendix D.1 and D.3). The exceptions are text that is not Postgres SQL and was emulated or run separately: the psql meta-command `\set ON_ERROR_STOP on` in A.R1/A.R2; the prose and commented parts of A.14 (M13, M12, R1, M09, M02, the first half of M06, the commented consent default and the commented `drop trigger` alternative for M10, which PGlite cannot run because it has no supautils); the commented Phase 3/4 queries of A.15 (run uncommented in the final run); A.16 E6 (ClickHouse log SQL, run on TEST Logs). `verify.sql` (V1-V12) is not in this appendix; the final run rebuilt V1-V10 from section 6.7.
- The harness ported into the repo (Phase 1 step 1) must keep all of it green before TEST.
- Local stack prerequisite: `supabase/config.toml` `major_version = 17` (`GRANT ... WITH INHERIT FALSE, SET TRUE` is PG16+).
- After each batch: `drizzle-kit pull` in `quicktalog-packages` with an admin URL, strip `pgPolicy`, release, bump consumers.

### A.0 `MIGRATION M00_perimeter_close` (Phase 0A; CHANGE C1, PGlite-verified (final run))

```sql
-- CHANGE C1 (PGlite-verified, final run): statements from verified migration 06 of the SQL draft (sections 6.1-6.3, 6.5), now applied BEFORE M01.
-- The temporary legacy anon policies of PATCH P1 are not needed with this order: RLS is on and anon holds no
-- grants before any app_user policy or withUser code exists.
-- Gate: Phase 0A code live 24h in this environment; no app /rest/v1 traffic in API logs; PROD: test merged
-- into main, edge functions checked for anon-key use, exposure audit saved.
-- postgres (Drizzle today) and service_role (worker) bypass RLS. No policies are created: RLS on + zero grants = deny.
-- Rollback: A.14 (re-grant one privilege plus a temporary permissive anon policy; never disable RLS).

alter table public.users              enable row level security;
alter table public.catalogues         enable row level security;
alter table public.analytics          enable row level security;
alter table public.newsletter         enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.job_logs           enable row level security;
alter table public.prompts            enable row level security;
alter table public.ocr                enable row level security;
alter table public.qr_configs         enable row level security;
alter table public.user_themes        enable row level security;
alter table public.product_newsletter enable row level security;
alter table public.plans              enable row level security;

-- Stale grants from 20260912093000_lockdown_privileges_and_schema_fixes.sql:57-119 (views included).
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
-- CHANGE C1: PROD may still carry default privileges granting anon/authenticated on new objects.
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- Declares user_id uuid over a text column: 42804 on every call (TEST). No caller on `test`.
drop function if exists public.get_pageview_totals(timestamp with time zone, timestamp with time zone);

-- CHANGE C1: fail the migration instead of leaving a hole (e.g. a PROD function with a PUBLIC EXECUTE grant).
do $$
declare
  v_bad text;
begin
  select pg_catalog.string_agg(c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
  if v_bad is not null then
    raise exception 'M00: RLS is still off on: %', v_bad;
  end if;

  select pg_catalog.string_agg(r.rolname || ':' || c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
   where n.nspname = 'public'
     and (   (c.relkind in ('r', 'p', 'v', 'm', 'f')
              and (pg_catalog.has_table_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                   or pg_catalog.has_any_column_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')))
          or (c.relkind = 'S' and pg_catalog.has_sequence_privilege(r.rolname, c.oid, 'USAGE,SELECT,UPDATE')));
  if v_bad is not null then
    raise exception 'M00: anon/authenticated still hold privileges on: %', v_bad;
  end if;

  select pg_catalog.string_agg(r.rolname || ':' || p.oid::regprocedure::text, ', ') into v_bad
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
   where n.nspname = 'public' and pg_catalog.has_function_privilege(r.rolname, p.oid, 'EXECUTE');
  if v_bad is not null then
    raise exception 'M00: functions in public are still executable by anon/authenticated (PUBLIC grant?): %. Revoke EXECUTE from PUBLIC for each, grant it back to postgres/service_role explicitly, then re-run.', v_bad;
  end if;
end $$;

notify pgrst, 'reload schema';
```

### A.1 `MIGRATION M01_app_roles_private_schema` (Phase 1)

```sql
-- Verified (PGlite, patches P2 and P3). Additive; nothing that runs today changes behaviour.

-- 1.1 Private application roles. NOLOGIN NOINHERIT NOBYPASSRLS; never granted to authenticator (TEST:
-- authenticator is a member of anon/authenticated/service_role only). A CREATEROLE non-superuser that creates
-- a role gets ADMIN OPTION; createrole_self_grant='set' makes the implicit grant SET TRUE / INHERIT FALSE.
set createrole_self_grant = 'set';

do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_user') then
    create role app_user nologin noinherit nobypassrls;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_public') then
    create role app_public nologin noinherit nobypassrls;
  end if;
end $$;

reset createrole_self_grant;

do $$
declare
  r text;
begin
  foreach r in array array['app_user', 'app_public'] loop
    if exists (select 1 from pg_catalog.pg_roles
                where rolname = r and (rolcanlogin or rolbypassrls or rolsuper or rolinherit or rolcreaterole)) then
      raise exception 'role % already exists with unsafe attributes; refusing to continue', r;
    end if;
    if not pg_catalog.pg_has_role('postgres', r, 'SET') then
      -- PATCH P2: PG16+ GRANT needs ADMIN OPTION; fail with the fix instead of a bare 42501.
      if not (select rolsuper from pg_catalog.pg_roles where rolname = current_user)
         and not pg_catalog.pg_has_role(current_user, r, 'USAGE WITH ADMIN OPTION') then
        raise exception 'role % exists but % has no ADMIN OPTION on it; ask a superuser (Supabase support) to run: grant % to postgres with inherit false, set true', r, current_user, r
          using errcode = '42501';
      end if;
      execute pg_catalog.format('grant %I to postgres with inherit false, set true', r);
    end if;
  end loop;
end $$;

comment on role app_user is
  'Signed-in owner traffic. Reached only by SET ROLE inside utils/db/rls.ts withUser(). Never grant to authenticator.';
comment on role app_public is
  'Visitor/ISR/public-signup traffic. Reached only by SET ROLE inside utils/db/rls.ts withPublic(). Never grant to authenticator.';

-- 1.2 Private schema (not exposed through the Data API; anon/authenticated get no USAGE)
create schema if not exists private;
alter schema private owner to postgres;   -- PATCH P3
revoke all on schema private from public;
grant usage on schema private to app_user, app_public;
comment on schema private is
  'Not exposed via the Data API. Helpers for app_user/app_public and admin-only tables. No anon/authenticated access.';

-- Global form (no IN SCHEMA): TEST has no global default ACL entry for postgres functions, and a per-schema
-- entry cannot remove the hard-wired PUBLIC EXECUTE. Every function below also revokes explicitly.
alter default privileges for role postgres revoke execute on functions from public;

-- 1.3 Identity helper: the verified subject set by withUser(); NULL when unset, so owner policies match nothing.
create or replace function private.current_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif((nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb) ->> 'sub', '')
$$;
alter function private.current_user_id() owner to postgres;
revoke all on function private.current_user_id() from public;
grant execute on function private.current_user_id() to app_user;

-- 1.4 Per-project settings read only by postgres-owned SECURITY DEFINER functions
create table if not exists private.settings (
  key        text primary key check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table private.settings owner to postgres;   -- PATCH P3
revoke all on table private.settings from public;
```

### A.2 `MIGRATION M02_edge_functions_per_project` (Phase 1; CHANGE W6, PGlite-verified (final run))

```sql
-- Verified (PGlite, first and final run; CHANGE W6 PGlite-verified, final run). Makes DB webhooks post to THIS
-- project's edge functions (never PROD from TEST) and stops the Brevo webhook firing on every users UPDATE.
-- PROD check right after apply: select value from private.settings where key = 'edge_functions_base_url'
-- must be https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1; insert it by hand if the Vault key is not a JWT.
-- Comments below come from earlier drafts (not included; superseded by this plan); the SQL is the verified file.

-- 2.0 CHANGE W6: a mistyped or foreign base URL fails on write instead of silently posting user rows elsewhere
alter table private.settings add constraint settings_edge_functions_base_url_format
  check (key <> 'edge_functions_base_url'
         or value ~ '^(https://[a-z]{20}\.supabase\.co|http://(127\.0\.0\.1|localhost|host\.docker\.internal|kong):[0-9]{2,5})/functions/v1$');

-- 2.1 Seed the base URL from this project's own Vault key -------------------------------------------------
-- WHY: legacy service_role keys are JWTs whose payload carries "ref" = the project ref (verified on TEST: the
-- legacy JWT payload carries ref; the PROD Vault value is still checked right after apply). Deriving the URL
-- from the key already stored in THIS project's Vault means
-- PROD keeps working with no manual step, and TEST (0 Vault secrets) gets no URL -> no outbound call.
do $$
declare
  v_token   text;
  v_part    text;
  v_payload jsonb;
  v_ref     text;
begin
  if exists (select 1 from private.settings where key = 'edge_functions_base_url') then
    return;
  end if;
  select ds.decrypted_secret into v_token
    from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
  if v_token is null or v_token !~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' then
    raise notice 'edge_functions_base_url not seeded (no JWT service_role_key in Vault). Insert it manually if this project must call edge functions.';
    return;
  end if;
  v_part := pg_catalog.translate(pg_catalog.split_part(v_token, '.', 2), '-_', '+/');
  v_part := pg_catalog.rpad(v_part, ((pg_catalog.length(v_part) + 3) / 4) * 4, '=');
  v_payload := pg_catalog.convert_from(pg_catalog.decode(v_part, 'base64'), 'UTF8')::jsonb;
  v_ref := v_payload ->> 'ref';
  if v_ref ~ '^[a-z]{20}$' then
    insert into private.settings (key, value)
    values ('edge_functions_base_url', 'https://' || v_ref || '.supabase.co/functions/v1');
    raise notice 'edge_functions_base_url seeded for project %', v_ref;
  else
    raise notice 'edge_functions_base_url not seeded (JWT has no usable ref claim).';
  end if;
exception when others then
  raise notice 'edge_functions_base_url not seeded: %', sqlerrm;
end $$;

-- 2.2 Webhook trigger function reads the base URL -------------------------------------------------------
-- WHY: 20260911213819_remote_schema.sql:74 hard-codes https://uhfbapjuzvlyzyodxhqn.supabase.co, so any
-- TEST row with a Vault key would post real user rows to PROD Brevo/CRM/Discord. search_path tightened
-- from 'public' to '' (every name qualified). CREATE OR REPLACE keeps the existing ACL
-- (TEST: postgres + service_role only) and the three triggers that reference it.
create or replace function public.call_edge_function_with_vault_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base       text;
  v_token      text;
  v_request_id bigint;
begin
  select s.value into v_base from private.settings s where s.key = 'edge_functions_base_url';
  if v_base is null then
    raise warning 'call_edge_function_with_vault_secret: edge_functions_base_url not set, skipping %', tg_argv[0];
    return new;
  end if;

  select ds.decrypted_secret into v_token
    from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
  if v_token is null then
    raise warning 'call_edge_function_with_vault_secret: service_role_key not found in Vault, skipping %', tg_argv[0];
    return new;
  end if;

  select net.http_post(
    url                  := v_base || '/' || tg_argv[0],
    headers              := pg_catalog.jsonb_build_object('Content-type', 'application/json',
                                                          'Authorization', 'Bearer ' || v_token),
    body                 := pg_catalog.to_jsonb(new),
    timeout_milliseconds := 5000
  ) into v_request_id;

  return new;
end;
$$;
alter function public.call_edge_function_with_vault_secret() owner to postgres;
revoke all on function public.call_edge_function_with_vault_secret() from public, anon, authenticated;

-- 2.3 "Sync Plans" cron job reads the same setting ----------------------------------------------------
-- WHY: 20260912093000_lockdown_privileges_and_schema_fixes.sql:245-264 schedules a POST to the PROD URL
-- from every project. Zero rows in private.settings -> the SELECT returns nothing -> no request.
do $do$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'Sync Plans',
      '0 8 */3 * *',
      $job$
      select net.http_post(
        url := s.value || '/sync-available-plans',
        headers := jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                          where name = 'service_role_key' limit 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      )
      from private.settings s
      where s.key = 'edge_functions_base_url'
      $job$
    );
  end if;
end
$do$;

-- 2.4 Brevo trigger: only on columns Brevo cares about ----------------------------------------------------
-- WHY: AFTER INSERT OR UPDATE (remote_schema.sql:437) posts the whole row on every UPDATE. After this plan,
-- app_user updates users.cookie_preferences (saveCookiePreferences, Phase 1) and the re-key (R1)
-- rewrites users.id; neither should create CRM traffic. Which columns the PROD edge function actually reads
-- is (unverified) - its source is in no repo.
drop trigger if exists "Brevo New Contact Webhook" on public.users;
create trigger "Brevo New Contact Webhook"
  after insert or update of email, name, plan_id, customer_id on public.users
  for each row execute function public.call_edge_function_with_vault_secret('create-brevo-contact');
```

### A.3 `MIGRATION M03_integrity_constraints_ai_ledger` (Phase 1; CHANGE C2-C4, W8, PGlite-verified (final run))

```sql
-- Verified (PGlite, patch P3) plus CHANGE C2-C4 (PGlite-verified, final run).
-- PROD PRE-CHECKS (read-only, A.15): status values; prompts/ocr rows with null user_id; duplicate
-- newsletter (catalogue_id, lower(email)), product_newsletter lower(email), qr_configs.catalogue; forged
-- newsletter owners; and CHANGE C2: sizes measured as max(octet_length(content::text)) (and colors, config,
-- cookie_preferences), because pg_column_size reports the compressed size and under-reports (PGlite F8).
-- CHANGE W8 (comment corrected; PGlite-verified, final run):
-- If any row exceeds a limit below, raise the limit or fix the row BEFORE applying: NOT VALID checks are still
-- enforced on every INSERT and on every UPDATE of the row, including updates that do not touch the column (for an
-- unchanged toasted column pg_column_size sees the stored, possibly compressed, size).
-- Behaviour change on code running at this time: dropping UNIQUE(catalogue) makes today's meter() succeed after
-- the first prompt per catalogue (quotas start counting); case-variant newsletter duplicates hit 23505 in
-- today's newsletter action (ship the Phase 1 newsletter action with this migration).

-- 3.1 catalogues.status domain --------------------------------------------------------------------------
-- WHY: updateItemStatus (actions/catalogue.ts:105) writes an unvalidated status; the public policy keys on
-- status = 'active'. Values from ../quicktalog-packages/src/types/enums.ts:9-14. TEST has only active/draft.
alter table public.catalogues
  add constraint catalogues_status_check
  check (status in ('active', 'inactive', 'draft', 'in preparation', 'error')) not valid;
alter table public.catalogues validate constraint catalogues_status_check;

-- 3.2 jsonb size ceilings ---------------------------------------------------------------------------------
-- WHY: app_user can write these columns directly; a size cap stops one owner from storing arbitrarily large
-- blobs (DoS on ISR, Redis mirror, Sentry). Limits are product decisions (TEST maxima are far below).
-- NOT VALID now (enforced for new writes); validated in M07 after the PROD audit.
alter table public.catalogues  add constraint catalogues_content_size
  check (pg_column_size(content) < 1048576) not valid;
alter table public.user_themes add constraint user_themes_colors_size
  check (pg_column_size(colors) < 4096) not valid;
alter table public.qr_configs  add constraint qr_configs_config_size
  check (pg_column_size(config) < 65536) not valid;
alter table public.users       add constraint users_cookie_prefs_size
  check (cookie_preferences is null or pg_column_size(cookie_preferences) < 2048) not valid;

-- 3.3 Backups for the destructive steps below -------------------------------------------------------------
create table if not exists private.backup_newsletter_dupes         (like public.newsletter);
create table if not exists private.backup_product_newsletter_dupes (like public.product_newsletter);
create table if not exists private.backup_qr_configs_dupes         (like public.qr_configs);
create table if not exists private.backup_prompts_null_user        (like public.prompts);
create table if not exists private.backup_ocr_null_user            (like public.ocr);
alter table private.backup_newsletter_dupes         owner to postgres;   -- PATCH P3
alter table private.backup_product_newsletter_dupes owner to postgres;
alter table private.backup_qr_configs_dupes         owner to postgres;
alter table private.backup_prompts_null_user        owner to postgres;
alter table private.backup_ocr_null_user            owner to postgres;
revoke all on table private.backup_newsletter_dupes, private.backup_product_newsletter_dupes,
  private.backup_qr_configs_dupes, private.backup_prompts_null_user, private.backup_ocr_null_user from public;

-- 3.3b CHANGE C3: remove subscriber rows injected with a forged owner_id (today's action trusts the client
-- ownerId). Backed up first. Runs before the dedupe so a forged earliest row cannot win.
create table if not exists private.backup_newsletter_forged_owner (like public.newsletter);
alter table private.backup_newsletter_forged_owner owner to postgres;
revoke all on table private.backup_newsletter_forged_owner from public;
insert into private.backup_newsletter_forged_owner
select n.* from public.newsletter n
  join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;
delete from public.newsletter n
 using public.catalogues c
 where c.id = n.catalogue_id and c.created_by is distinct from n.owner_id;

-- 3.4 newsletter: one row per (catalogue, case-insensitive email) -----------------------------------------
-- WHY: actions/newsletter.ts:25-44 dedupes with a racy SELECT; the replacement definer function
-- (M05) relies on ON CONFLICT against this index. Keeps the earliest row.
insert into private.backup_newsletter_dupes
select n.* from public.newsletter n
 where exists (select 1 from public.newsletter d
                where d.catalogue_id = n.catalogue_id and lower(d.email) = lower(n.email)
                  and (d.created_at, d.id) < (n.created_at, n.id));
delete from public.newsletter n
 using public.newsletter d
 where d.catalogue_id = n.catalogue_id and lower(d.email) = lower(n.email)
   and (d.created_at, d.id) < (n.created_at, n.id);
create unique index if not exists newsletter_catalogue_email_key
  on public.newsletter (catalogue_id, lower(email));
-- Leading column catalogue_id now serves the FK newsletter_catalogue_id_fkey; avoid lint 0005/0009.
drop index if exists public.newsletter_catalogue_id_idx;

-- 3.5 product_newsletter: one row per case-insensitive email ------------------------------------------------
-- WHY: actions/newsletter.ts:64-74 SELECT-then-INSERT; replaced by ON CONFLICT in M05.
insert into private.backup_product_newsletter_dupes
select n.* from public.product_newsletter n
 where exists (select 1 from public.product_newsletter d where lower(d.email) = lower(n.email) and d.id < n.id);
delete from public.product_newsletter n
 using public.product_newsletter d
 where lower(d.email) = lower(n.email) and d.id < n.id;
create unique index if not exists product_newsletter_email_key
  on public.product_newsletter (lower(email));

-- 3.6 qr_configs: one config per catalogue --------------------------------------------------------------
-- WHY: actions/qr-configs.ts:14-33 select-then-insert race; the new code uses
-- INSERT ... ON CONFLICT (catalogue) DO UPDATE. TEST has only a non-unique index even though the Drizzle
-- schema declares qr_configs_catalogue_key (../quicktalog-packages/src/drizzle/migrations/schema.ts:124).
-- Keeps the most recently updated row.
insert into private.backup_qr_configs_dupes
select q.* from public.qr_configs q
 where exists (select 1 from public.qr_configs d
                where d.catalogue = q.catalogue
                  and (coalesce(d.updated_at, '-infinity'::timestamp), d.id)
                    > (coalesce(q.updated_at, '-infinity'::timestamp), q.id));
delete from public.qr_configs q
 using public.qr_configs d
 where d.catalogue = q.catalogue
   and (coalesce(d.updated_at, '-infinity'::timestamp), d.id)
     > (coalesce(q.updated_at, '-infinity'::timestamp), q.id);
create unique index if not exists qr_configs_catalogue_key on public.qr_configs (catalogue);
drop index if exists public.qr_configs_catalogue_idx;

-- 3.7 AI ledger (prompts) --------------------------------------------------------------------------------
-- WHY (each defect is from research/ai-agent.md s.5):
--   a) UNIQUE(catalogue) makes every meter() after the first per catalogue fail (lib/ai/access.ts:98;
--      swallowed at app/api/agent/route.ts:123-127) -> drop it.
--   b) catalogue FK ON DELETE CASCADE: deleting a catalogue (actions/catalogue.ts:52) deletes its charges
--      and resets the monthly quota; FK actions bypass RLS -> ON DELETE SET NULL, catalogue nullable.
--   c) user_id nullable -> a null row silently leaves the count -> NOT NULL.
--   d) turn_id (unique), continuations, refunded_at support server-authoritative metering in
--      private.begin_ai_turn / refund_ai_turn (M05, replaced by M06). turn_id gets a DB default so today's meter()
--      insert (Drizzle schema without turn_id) keeps working during Phase 1.
-- Constraint lookups are name-independent so a differently named FK/UNIQUE on PROD cannot be skipped
-- silently (an IF EXISTS on the wrong name would leave the CASCADE FK in place next to the new one).
do $$
declare
  r record;
begin
  for r in
    select c.conname
      from pg_catalog.pg_constraint c
     where c.conrelid = 'public.prompts'::regclass
       and (   (c.contype = 'f' and c.confrelid = 'public.catalogues'::regclass)
            or (c.contype = 'u' and c.conkey = array[(select a.attnum from pg_catalog.pg_attribute a
                                                       where a.attrelid = 'public.prompts'::regclass
                                                         and a.attname = 'catalogue')]::int2[]))
  loop
    execute pg_catalog.format('alter table public.prompts drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.prompts alter column catalogue drop not null;
alter table public.prompts
  add constraint prompts_catalogue_fkey foreign key (catalogue)
  references public.catalogues (name) on update cascade on delete set null;

insert into private.backup_prompts_null_user select * from public.prompts where user_id is null;
delete from public.prompts where user_id is null;
alter table public.prompts alter column user_id set not null;

alter table public.prompts
  add column if not exists turn_id       uuid,
  add column if not exists continuations integer not null default 0,
  add column if not exists refunded_at   timestamptz;
update public.prompts set turn_id = gen_random_uuid() where turn_id is null;
alter table public.prompts
  alter column turn_id set default gen_random_uuid(),
  alter column turn_id set not null;
alter table public.prompts
  add constraint prompts_continuations_range check (continuations between 0 and 1000);
create unique index if not exists prompts_turn_id_key       on public.prompts (turn_id);
create index        if not exists prompts_user_datetime_idx on public.prompts (user_id, datetime);
create index        if not exists prompts_catalogue_idx     on public.prompts (catalogue);   -- FK cascade lookups (was served by the dropped UNIQUE)
drop index if exists public.prompts_user_id_idx;                                              -- superseded by (user_id, datetime)

-- 3.8 ocr (same ledger rules; nothing writes it today, TEST 0 rows) ---------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.conname from pg_catalog.pg_constraint c
     where c.conrelid = 'public.ocr'::regclass and c.contype = 'f'
       and c.confrelid = 'public.catalogues'::regclass
  loop
    execute pg_catalog.format('alter table public.ocr drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.ocr alter column catalogue drop not null;
alter table public.ocr alter column catalogue drop default;   -- '' can never satisfy the FK to catalogues(name)
alter table public.ocr
  add constraint ocr_catalogue_fkey foreign key (catalogue)
  references public.catalogues (name) on update cascade on delete set null;
insert into private.backup_ocr_null_user select * from public.ocr where user_id is null;
delete from public.ocr where user_id is null;
alter table public.ocr alter column user_id set not null;

-- 3.9 Paddle webhook idempotency (admin only) ---------------------------------------------------------------
-- WHY: utils/paddle/process-webhook.ts has no idempotency or ordering (research/public-and-system-surfaces.md
-- finding at :22-40) and swallows errors (:44-50). asAdmin inserts event_id first, ON CONFLICT DO NOTHING
-- -> already processed. No app-role grants.
create table if not exists private.paddle_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  processed_at timestamptz not null default now()
);
alter table private.paddle_events owner to postgres;   -- PATCH P3 (PGlite run: asAdmin got 42501 when a superuser applied 03)
revoke all on table private.paddle_events from public;

-- 3.10 CHANGE C4: Paddle events that cannot be linked to a user go to a review queue (200 to Paddle, Sentry
-- fatal), instead of silent drops or infinite retries. Admin only.
create table if not exists private.paddle_unresolved_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  customer_id  text,
  reason       text not null,
  payload      jsonb not null,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
alter table private.paddle_unresolved_events owner to postgres;
revoke all on table private.paddle_unresolved_events from public;
```

### A.4 `MIGRATION M04_app_role_grants_policies` (Phase 1; CHANGE C5, PGlite-verified (final run))

```sql
-- Verified (PGlite) minus section 4.8 (PATCH P1 legacy anon policies, not needed after M00) plus CHANGE C5
-- (PGlite-verified, final run).
-- Grant rules: INSERT table-level (Drizzle lists every column and emits `default`,
-- node_modules/drizzle-orm/pg-core/dialect.js:356-392) with a pin trigger; UPDATE column-level; app_public
-- SELECT on catalogues without created_by; one permissive policy per role and command, always TO an app role.

-- 4.0 CHANGE C5: refuse to create owner policies unless the perimeter is closed and RLS is on everywhere.
-- This makes the cross-tenant window found by PGlite (policies inert while withUser code runs) impossible.
do $$
declare
  v_bad text;
begin
  select pg_catalog.string_agg(c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
  if v_bad is not null then
    raise exception 'M04: apply M00_perimeter_close first (RLS off on: %)', v_bad;
  end if;
  select pg_catalog.string_agg(r.rolname || ':' || c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
   where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
     and (pg_catalog.has_table_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,DELETE')
          or pg_catalog.has_any_column_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE'));
  if v_bad is not null then
    raise exception 'M04: apply M00_perimeter_close first (anon/authenticated privileges on: %)', v_bad;
  end if;
end $$;

-- 4.1 users -----------------------------------------------------------------------------------------------
-- Call sites: lib/users/fetchUserData.ts:42,64 -> lib/users/my-user-data.ts; lib/entitlements/plan.ts
-- (SELECT ... FOR UPDATE needs UPDATE on >= 1 column, satisfied by name/cookie_preferences);
-- app/api/update-consent/route.ts (cookie_preferences, Supabase phase).
-- Denied: plan_id, customer_id, email, consents, id, image, created_at (Paddle/auth sync write them via admin).
grant select on public.users to app_user;
grant update (name, cookie_preferences) on public.users to app_user;

create policy users_select_self on public.users
  for select to app_user
  using (id = (select private.current_user_id()));
create policy users_update_self on public.users
  for update to app_user
  using      (id = (select private.current_user_id()))
  with check (id = (select private.current_user_id()));

-- 4.2 catalogues ------------------------------------------------------------------------------------------
-- Call sites (app_user): actions/catalogue.ts:46,52 deleteItem; :69,79 deleteMultipleItems; :99,105
-- updateItemStatus; :137,161 duplicateItem; :204 createCatalogue; :246 updateCatalogue ownership proof;
-- :328,340 publishCatalogue; :289 getCatalogueByName -> getOwnedCatalogueForEditor; lib/ai/access.ts:40;
-- app/api/dashboard/catalogues/route.ts:18; app/api/dashboard/newsletter/route.ts:35;
-- app/admin/[name]/{builder,qr-editor,analytics}/page.tsx ownership reads.
-- Call sites (app_public): app/api/items/route.ts:13, app/api/items/[name]/route.ts:13 via
-- lib/catalogue/public.ts, feeding app/catalogues/[name]/page.tsx:14,52,113 and app/sitemap.ts:11.
grant select, insert, delete on public.catalogues to app_user;
grant update (logo, heading, status, language, currency, business_type, content, legal, appearance,
              contact, header, footer, partners, metadata, tags, updated_at)
  on public.catalogues to app_user;                                  -- NOT id, name, created_by, created_at, source
grant select (id, name, logo, heading, status, source, language, currency, business_type, content, legal,
              appearance, contact, header, footer, partners, metadata, tags, created_at, updated_at)
  on public.catalogues to app_public;                                -- NOT created_by

-- Owners see only their own rows, including their own active ones; app_user never sees other owners'
-- active catalogues, so "a row came back" always means "owned" (lib/ai/access.ts:47 style checks stay
-- correct; public reads use app_public).
create policy catalogues_select_owner on public.catalogues
  for select to app_user
  using (created_by = (select private.current_user_id()));
-- New rows must belong to the caller and start unpublished: blocks createCatalogue with status:'active'
-- (actions/catalogue.ts:204) and duplicating an active catalogue straight to live (:161).
create policy catalogues_insert_owner on public.catalogues
  for insert to app_user
  with check (created_by = (select private.current_user_id())
              and status in ('draft', 'in preparation'));
create policy catalogues_update_owner on public.catalogues
  for update to app_user
  using      (created_by = (select private.current_user_id()))
  with check (created_by = (select private.current_user_id()));
create policy catalogues_delete_owner on public.catalogues
  for delete to app_user
  using (created_by = (select private.current_user_id()));
-- Drafts never reach visitors, ISR, generateMetadata or the sitemap (today /api/items returns drafts).
create policy catalogues_select_public on public.catalogues
  for select to app_public
  using (status = 'active');

-- 4.3 qr_configs (no owner column; ownership through catalogues.name) ------------------------------------
-- Call sites: actions/qr-configs.ts:14,21,30 upsertQrConfig (no auth today), :54 getQrConfig.
-- The subquery runs under app_user's catalogues policy too, so it can only ever return the caller's names.
-- INSERT ... ON CONFLICT DO UPDATE on another owner's existing row RAISES (UPDATE USING violation), it does
-- not silently no-op.
grant select, insert, delete on public.qr_configs to app_user;
grant update (config, updated_at) on public.qr_configs to app_user;
create policy qr_configs_owner on public.qr_configs
  for all to app_user
  using      (catalogue in (select c.name from public.catalogues c
                             where c.created_by = (select private.current_user_id())))
  with check (catalogue in (select c.name from public.catalogues c
                             where c.created_by = (select private.current_user_id())));

-- 4.4 user_themes ------------------------------------------------------------------------------------------
-- Call sites: actions/themes.ts:20 list, :48/:57/:62 persistTheme (-> lib/themes/upsert.ts ON CONFLICT
-- (user_id, name)), :91 delete; agent/tools.ts:433 via the saveTheme port.
grant select, insert, delete on public.user_themes to app_user;
grant update (name, colors, updated_at) on public.user_themes to app_user;
create policy user_themes_owner on public.user_themes
  for all to app_user
  using      (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

-- 4.5 Read-only owner views of ledgers and subscribers ----------------------------------------------------
-- Call sites: lib/users/fetchUserData.ts:93,98,112,123 (-> private.my_usage()), app/api/dashboard/
-- analytics/route.ts:17,22, app/api/dashboard/newsletter/route.ts:18.
-- No INSERT/UPDATE/DELETE: quota rows are written only by private.begin_ai_turn/refund_ai_turn (definer)
-- or the worker (service_role); subscriber rows only by private.subscribe_catalogue_newsletter.
grant select on public.analytics, public.prompts, public.ocr, public.newsletter to app_user;
create policy analytics_select_owner  on public.analytics  for select to app_user
  using (user_id  = (select private.current_user_id()));
create policy prompts_select_owner    on public.prompts    for select to app_user
  using (user_id  = (select private.current_user_id()));
create policy ocr_select_owner        on public.ocr        for select to app_user
  using (user_id  = (select private.current_user_id()));
create policy newsletter_select_owner on public.newsletter for select to app_user
  using (owner_id = (select private.current_user_id()));

-- No app-role privileges at all on: subscriptions, plans, job_logs, product_newsletter, views contacts and
-- active_subscriptions (CRM exports; postgres/service_role only; security_invoker already on).

-- 4.6 Server-owned columns -----------------------------------------------------------------------------------
-- WHY: INSERT must stay table-level (see header), so pin id/created_at/updated_at for app_user inserts;
-- a client-chosen catalogue id could otherwise collide with or shadow Redis/ISR keys. updated_at is touched
-- on every UPDATE regardless of caller (the worker's inactivation now bumps it too - intended).
create or replace function private.catalogues_pin_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user = 'app_user' then
    new.id         := pg_catalog.gen_random_uuid();
    new.created_at := pg_catalog.now();
    new.updated_at := pg_catalog.now();
  end if;
  return new;
end;
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

alter function private.catalogues_pin_insert() owner to postgres;
alter function private.touch_updated_at()      owner to postgres;
revoke all on function private.catalogues_pin_insert(), private.touch_updated_at() from public;
-- Harmless and avoids relying on fire-time ACL behaviour (PG checks EXECUTE at CREATE TRIGGER time).
grant execute on function private.catalogues_pin_insert(), private.touch_updated_at() to app_user;

drop trigger if exists catalogues_pin_insert        on public.catalogues;
drop trigger if exists catalogues_touch_updated_at  on public.catalogues;
drop trigger if exists qr_configs_touch_updated_at  on public.qr_configs;
drop trigger if exists user_themes_touch_updated_at on public.user_themes;
create trigger catalogues_pin_insert        before insert on public.catalogues
  for each row execute function private.catalogues_pin_insert();
create trigger catalogues_touch_updated_at  before update on public.catalogues
  for each row execute function private.touch_updated_at();
create trigger qr_configs_touch_updated_at  before update on public.qr_configs
  for each row execute function private.touch_updated_at();
create trigger user_themes_touch_updated_at before update on public.user_themes
  for each row execute function private.touch_updated_at();

-- 4.7 RLS on tables no anon path uses ---------------------------------------------------------------------
-- WHY now: postgres (today's Drizzle) and service_role (worker) bypass RLS, and anon/authenticated hold no
-- grants on these (TEST relacl), so enabling RLS changes nothing that runs today and makes app_user
-- enforcement real for qr_configs/user_themes/prompts/ocr from the first converted call site.
-- plans and product_newsletter intentionally get no policies (advisor 0008 INFO is expected).
alter table public.prompts            enable row level security;
alter table public.ocr                enable row level security;
alter table public.qr_configs         enable row level security;
alter table public.user_themes        enable row level security;
alter table public.product_newsletter enable row level security;
alter table public.plans              enable row level security;
```

### A.5 `MIGRATION M05_private_entry_points` (Phase 1; CHANGE C6, C7, PGlite-verified (final run))

```sql
-- Verified (PGlite) plus CHANGE C6 (stricter email pattern: no quotes or spreadsheet-formula payloads) and
-- CHANGE C7 (FOR NO KEY UPDATE: serialises one user's charges without blocking FK key-share locks); both
-- PGlite-verified (final run; C7 through the tuple lock bits, since PGlite has one connection).
-- begin_ai_turn and refund_ai_turn defined here are replaced by M06 before any code calls them.

-- 5.1 Slug availability, drafts included -------------------------------------------------------------------
-- Call sites: actions/catalogue.ts:151 (duplicate loop), :187 (create pre-check), hooks/useCatalogueName.ts:91
-- (today downloads every slug via GET /api/items?type=name). app_user cannot see other owners' rows, so a
-- definer check is required. One boolean per call, signed-in only, rate-limited in the server action.
-- catalogues_new_name_key stays the final guard (map 23505 to "name taken").
create or replace function private.catalogue_name_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_id() is not null
     and p_name is not null
     and pg_catalog.length(p_name) > 0
     and not exists (select 1 from public.catalogues c where c.name = p_name)
$$;

-- 5.2 Catalogue newsletter signup ----------------------------------------------------------------------------
-- Call site: actions/newsletter.ts:19-58 (callers components/catalogue/view/CatalogueFooter.tsx:42-46).
-- WHY: today owner_id and catalogue_id come from the browser and the catalogue need not be active or have
-- the newsletter enabled. The owner is now derived from the row; draft/inactive/disabled catalogues and
-- malformed emails are silently ignored and duplicates are no-ops, so the caller gets one constant response
-- (no subscription or catalogue-state oracle). Footer.newsletter is a boolean
-- (../quicktalog-packages/src/types/catalogue.d.ts:175); jsonb equality avoids cast errors on bad data.
create or replace function private.subscribe_catalogue_newsletter(p_catalogue_id uuid, p_email text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(p_email));
  v_owner text;
begin
  if v_email is null or pg_catalog.length(v_email) > 254
     or v_email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}$' then   -- CHANGE C6
    return;
  end if;
  select c.created_by into v_owner
    from public.catalogues c
   where c.id = p_catalogue_id
     and c.status = 'active'
     and (c.footer -> 'newsletter') = 'true'::jsonb;
  if v_owner is null then
    return;
  end if;
  insert into public.newsletter (email, catalogue_id, owner_id)
  values (v_email, p_catalogue_id, v_owner)
  on conflict (catalogue_id, (pg_catalog.lower(email))) do nothing;
end;
$$;

-- 5.3 Product newsletter signup -----------------------------------------------------------------------------
-- Call site: actions/newsletter.ts:60-87 (caller components/navigation/Footer.tsx:31).
create or replace function private.subscribe_product_newsletter(p_email text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(p_email));
begin
  if v_email is null or pg_catalog.length(v_email) > 254
     or v_email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}$' then   -- CHANGE C6
    return;
  end if;
  insert into public.product_newsletter (email)
  values (v_email)
  on conflict ((pg_catalog.lower(email))) do nothing;
end;
$$;

-- 5.4 Usage for the signed-in user (SECURITY INVOKER: runs under app_user RLS) ------------------------------
-- Call sites: lib/users/fetchUserData.ts:93,98,112,123 (4 queries, month bounds frozen at module load in
-- helpers/client.ts:21-23). One round trip; month bounds computed in SQL in UTC.
create or replace function private.my_usage()
returns table (catalogues bigint, prompts bigint, ocr bigint, pageviews bigint, unique_visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select private.current_user_id() as uid),
       m  as (select pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') as s,
                     pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') + interval '1 month' as e)
  select
    (select pg_catalog.count(*) from public.catalogues c, me where c.created_by = me.uid),
    (select pg_catalog.count(*) from public.prompts p, me, m
      where p.user_id = me.uid and p.refunded_at is null and p.datetime >= m.s and p.datetime < m.e),
    (select pg_catalog.count(*) from public.ocr o, me, m
      where o.user_id = me.uid and o.datetime >= m.s and o.datetime < m.e),
    (select coalesce(pg_catalog.sum(a.pageview_count), 0)::bigint from public.analytics a, me, m
      where a.user_id = me.uid and a.date >= m.s and a.date < m.e),
    (select coalesce(pg_catalog.sum(a.unique_visitors), 0)::bigint from public.analytics a, me, m
      where a.user_id = me.uid and a.date >= m.s and a.date < m.e)
$$;

-- 5.5 AI charge (server-authoritative metering) ---------------------------------------------------------------
-- Call sites: app/api/agent/route.ts:56 (authorize, before streaming) and :112-129 (onFinish meter, today
-- after the stream and skipped for client-forged plan continuations at :123); actions/ai.ts:29,58.
-- Charges BEFORE any model spend, in the same short withUser transaction that read the plan
-- (lib/entitlements/plan.ts getPlanForUpdate). Serialised per user by locking the users row, which closes
-- the check-then-charge race (lib/ai/access.ts:66-75). A continuation is free only if the DB holds a recent,
-- unrefunded, charged turn for the same user and catalogue (<15 min, <9 continuations; caps are product
-- decisions, unverified against plans/active/ai-agent-plan-mode.md). A forged continuation falls through and is
-- charged. p_limit comes from `tiers` via users.plan_id read in the same transaction; acceptable because
-- app_user is reachable only by server code.
create or replace function private.begin_ai_turn(p_catalogue text, p_limit integer, p_continuation boolean)
returns table (outcome text, ai_turn_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid  text := private.current_user_id();
  v_used bigint;
  v_turn uuid;
begin
  if v_uid is null then
    raise exception 'begin_ai_turn: no verified identity' using errcode = '42501';
  end if;
  if p_limit is not null and p_limit < 0 then
    raise exception 'begin_ai_turn: invalid limit %', p_limit using errcode = '22023';
  end if;

  if p_catalogue is null or not exists (
       select 1 from public.catalogues c where c.name = p_catalogue and c.created_by = v_uid) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  -- The catalogue FK guarantees the users row exists; lock it to serialise this user's charges.
  perform 1 from public.users u where u.id = v_uid for no key update;   -- CHANGE C7

  if coalesce(p_continuation, false) then
    update public.prompts p
       set continuations = p.continuations + 1
     where p.id = (select p2.id
                     from public.prompts p2
                    where p2.user_id = v_uid
                      and p2.catalogue = p_catalogue
                      and p2.refunded_at is null
                      and p2.datetime > pg_catalog.now() - interval '15 minutes'
                      and p2.continuations < 9
                    order by p2.datetime desc, p2.id desc   -- id breaks ties (now() is constant within one transaction)
                    limit 1)
    returning p.turn_id into v_turn;
    if v_turn is not null then
      return query select 'continued'::text, v_turn;
      return;
    end if;
  end if;

  select pg_catalog.count(*) into v_used
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if p_limit is not null and v_used >= p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.prompts (user_id, catalogue, turn_id)
  values (v_uid, p_catalogue, pg_catalog.gen_random_uuid())
  returning prompts.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

-- 5.6 AI refund (only for a turn that did nothing) ---------------------------------------------------------
-- Call sites: app/api/agent/route.ts onFinish when session.applied is empty and no plan was created;
-- actions/ai.ts when generation fails. Only the caller's own, un-continued, un-refunded turn younger than
-- 10 minutes. Rows are flagged, never deleted (append-only ledger).
create or replace function private.refund_ai_turn(p_turn_id uuid)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  with r as (
    update public.prompts
       set refunded_at = pg_catalog.now()
     where turn_id = p_turn_id
       and user_id = private.current_user_id()
       and continuations = 0
       and refunded_at is null
       and datetime > pg_catalog.now() - interval '10 minutes'
    returning 1
  )
  select exists (select 1 from r)
$$;

-- 5.7 Ownership and EXECUTE --------------------------------------------------------------------------------
alter function private.catalogue_name_available(text)               owner to postgres;
alter function private.subscribe_catalogue_newsletter(uuid, text)     owner to postgres;
alter function private.subscribe_product_newsletter(text)             owner to postgres;
alter function private.my_usage()                                     owner to postgres;
alter function private.begin_ai_turn(text, integer, boolean)          owner to postgres;
alter function private.refund_ai_turn(uuid)                           owner to postgres;

revoke all on function
  private.catalogue_name_available(text),
  private.subscribe_catalogue_newsletter(uuid, text),
  private.subscribe_product_newsletter(text),
  private.my_usage(),
  private.begin_ai_turn(text, integer, boolean),
  private.refund_ai_turn(uuid)
from public;

grant execute on function
  private.catalogue_name_available(text),
  private.my_usage(),
  private.begin_ai_turn(text, integer, boolean),
  private.refund_ai_turn(uuid)
to app_user;

grant execute on function
  private.subscribe_catalogue_newsletter(uuid, text),
  private.subscribe_product_newsletter(text)
to app_public, app_user;
```

### A.6 `MIGRATION M06_ai_turn_plan_binding` (Phase 1, CHANGE C8, PGlite-verified (final run))

```sql
-- CHANGE C8 (PGlite-verified, final run).
-- Resolves the red-team finding that forged plan continuations gave ~10 steerable free turns per charged turn,
-- and caps no-op refunds. A continuation is free only when the client presents the turn id it received in the
-- stream metadata AND the hash of the plan it resumes, and the DB holds that user's open agent plan on that
-- catalogue, younger than 15 minutes, with continuations < plan_budget (<= 8 = MAX_PLAN_CONTINUATIONS).
-- The plan state is written only by server code at the end of a turn (private.set_plan_state).
-- New pgTAP file: 41_ai_plan_binding.test.sql. Replaces the M05 AI functions before any code calls them.

alter table public.prompts
  add column if not exists kind        text    not null default 'agent',
  add column if not exists plan_open   boolean not null default false,
  add column if not exists plan_budget integer not null default 0,
  add column if not exists plan_hash   text;
alter table public.prompts add constraint prompts_kind_check        check (kind in ('agent', 'describe'));
alter table public.prompts add constraint prompts_plan_budget_range check (plan_budget between 0 and 8);
alter table public.prompts add constraint prompts_plan_hash_format  check (plan_hash is null or plan_hash ~ '^[0-9a-f]{64}$');

drop function if exists private.begin_ai_turn(text, integer, boolean);

create or replace function private.begin_ai_turn(
  p_catalogue       text,
  p_limit           integer,
  p_kind            text,
  p_continuation_of uuid,
  p_plan_hash       text)
returns table (outcome text, ai_turn_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid  text := private.current_user_id();
  v_used bigint;
  v_turn uuid;
begin
  if v_uid is null then
    raise exception 'begin_ai_turn: no verified identity' using errcode = '42501';
  end if;
  if p_limit is not null and p_limit < 0 then
    raise exception 'begin_ai_turn: invalid limit %', p_limit using errcode = '22023';
  end if;
  if p_kind is null or p_kind not in ('agent', 'describe') then
    raise exception 'begin_ai_turn: invalid kind' using errcode = '22023';
  end if;

  if p_catalogue is null or not exists (
       select 1 from public.catalogues c where c.name = p_catalogue and c.created_by = v_uid) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  -- Serialise this user's charges without blocking FK key-share locks (CHANGE C7).
  perform 1 from public.users u where u.id = v_uid for no key update;

  if p_kind = 'agent' and p_continuation_of is not null and p_plan_hash is not null then
    update public.prompts p
       set continuations = p.continuations + 1
     where p.turn_id = p_continuation_of
       and p.user_id = v_uid
       and p.catalogue = p_catalogue
       and p.kind = 'agent'
       and p.plan_open
       and p.plan_hash = p_plan_hash
       and p.refunded_at is null
       and p.datetime > pg_catalog.now() - interval '15 minutes'
       and p.continuations < p.plan_budget
    returning p.turn_id into v_turn;
    if v_turn is not null then
      return query select 'continued'::text, v_turn;
      return;
    end if;
  end if;
  -- Anything that is not a proven continuation falls through and is charged.

  select pg_catalog.count(*) into v_used
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if p_limit is not null and v_used >= p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.prompts (user_id, catalogue, turn_id, kind)
  values (v_uid, p_catalogue, pg_catalog.gen_random_uuid(), p_kind)
  returning prompts.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

-- Called by the agent route in onFinish of a charged turn or a continuation, with values derived from the
-- server-side session. The budget is fixed at the first open and never grows; closing is always allowed.
create or replace function private.set_plan_state(
  p_turn_id       uuid,
  p_open          boolean,
  p_tasks_pending integer,
  p_plan_hash     text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_open boolean := coalesce(p_open, false) and coalesce(p_tasks_pending, 0) > 0 and p_plan_hash is not null;
begin
  if p_plan_hash is not null and p_plan_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'set_plan_state: invalid plan hash' using errcode = '22023';
  end if;
  update public.prompts p
     set plan_open   = v_open,
         plan_budget = case
                         when p.plan_budget = 0 and p.continuations = 0 and v_open
                           then least(8, greatest(coalesce(p_tasks_pending, 0), 0))
                         else p.plan_budget
                       end,
         plan_hash   = case when v_open then p_plan_hash else null end
   where p.turn_id = p_turn_id
     and p.user_id = private.current_user_id()
     and p.kind = 'agent'
     and p.refunded_at is null
     and p.datetime > pg_catalog.now() - interval '15 minutes';
  return found;
end;
$$;

-- Refund only a charged turn that did nothing: own, not continued, no open plan, not refunded, < 10 minutes old,
-- and below the monthly refund cap (private.settings.ai_refund_cap_per_month, default 30; product decision).
create or replace function private.refund_ai_turn(p_turn_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid      text := private.current_user_id();
  v_cap      integer;
  v_refunded bigint;
begin
  if v_uid is null then
    return false;
  end if;
  select coalesce((select s.value from private.settings s
                    where s.key = 'ai_refund_cap_per_month' and s.value ~ '^[0-9]{1,6}$')::integer, 30)
    into v_cap;
  select pg_catalog.count(*) into v_refunded
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if v_refunded >= v_cap then
    return false;
  end if;
  update public.prompts p
     set refunded_at = pg_catalog.now()
   where p.turn_id = p_turn_id
     and p.user_id = v_uid
     and p.continuations = 0
     and not p.plan_open
     and p.refunded_at is null
     and p.datetime > pg_catalog.now() - interval '10 minutes';
  return found;
end;
$$;

alter function private.begin_ai_turn(text, integer, text, uuid, text)  owner to postgres;
alter function private.set_plan_state(uuid, boolean, integer, text)    owner to postgres;
alter function private.refund_ai_turn(uuid)                            owner to postgres;
revoke all on function
  private.begin_ai_turn(text, integer, text, uuid, text),
  private.set_plan_state(uuid, boolean, integer, text),
  private.refund_ai_turn(uuid)
from public;
grant execute on function
  private.begin_ai_turn(text, integer, text, uuid, text),
  private.set_plan_state(uuid, boolean, integer, text),
  private.refund_ai_turn(uuid)
to app_user;
```

### A.7 `MIGRATION M07_validate_after_audit` (Phase 1, CHANGE C9, PGlite-verified (final run))

```sql
-- CHANGE C9 (PGlite-verified, final run: validates on clean data; a legacy bad slug or oversized row makes the
-- whole migration fail with 23514 and roll back).
-- Apply only after the A.15 audits return zero violations on that project. Kept separate from the perimeter
-- migration so a single oversized PROD row cannot roll back security changes.

alter table public.catalogues  validate constraint catalogues_content_size;
alter table public.user_themes validate constraint user_themes_colors_size;
alter table public.qr_configs  validate constraint qr_configs_config_size;
alter table public.users       validate constraint users_cookie_prefs_size;

-- Slugs are public URLs, Redis/rate-limit key parts and revalidate tags. TEST: all names match.
alter table public.catalogues add constraint catalogues_name_slug
  check (name ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and pg_catalog.length(name) <= 100) not valid;
alter table public.catalogues validate constraint catalogues_name_slug;

-- Row cap for the owner-writable jsonb/array columns that have no individual ceiling (limit is a product decision).
alter table public.catalogues add constraint catalogues_other_json_size
  check (  coalesce(pg_catalog.pg_column_size(appearance), 0) + coalesce(pg_catalog.pg_column_size(legal), 0)
         + coalesce(pg_catalog.pg_column_size(contact), 0)    + coalesce(pg_catalog.pg_column_size(header), 0)
         + coalesce(pg_catalog.pg_column_size(footer), 0)     + coalesce(pg_catalog.pg_column_size(partners), 0)
         + coalesce(pg_catalog.pg_column_size(metadata), 0)   + coalesce(pg_catalog.pg_column_size(tags), 0)
         < 1048576) not valid;
alter table public.catalogues validate constraint catalogues_other_json_size;
```

### A.8 `MIGRATION M08_app_rls_login_role` (Phase 1 end)

```sql
-- Verified (PGlite, patch P4). After applying: set the password out of band, then switch DB_CONNECTION_STRING to
-- app_rls.<ref> on 6543. Whether Supavisor authenticates a custom login role on each project is (unverified);
-- test on TEST first. Rollback: DB_CONNECTION_STRING back to postgres.<ref>, then A.14.

do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_rls') then
    create role app_rls login noinherit nobypassrls nocreatedb nocreaterole connection limit 40;
  end if;
  if exists (select 1 from pg_catalog.pg_roles
              where rolname = 'app_rls' and (rolbypassrls or rolsuper or rolinherit or rolcreaterole)) then
    raise exception 'role app_rls exists with unsafe attributes';
  end if;
end $$;

grant app_user   to app_rls with inherit false, set true;
grant app_public to app_rls with inherit false, set true;

-- Backstops only (applied at login; the wrapper still sets per-transaction limits because SET ROLE does not
-- apply ALTER ROLE settings).
alter role app_rls set statement_timeout = '8s';
alter role app_rls set lock_timeout = '3s';
alter role app_rls set idle_in_transaction_session_timeout = '10s';
-- PATCH P4: PUBLIC holds TEMP on the database (TEST datacl =Tc/postgres) and pg_temp is searched FIRST unless listed.
-- Drizzle emits unqualified table names, so a temp table planted on a pooled backend (via any SQL-injection
-- primitive) would shadow public.catalogues for the next tenant on that backend (PGlite run: forged read and a
-- captured INSERT). Listing pg_temp last makes unqualified names resolve to public. The TS wrapper should also
-- set it per transaction (set_config('search_path', 'public, pg_temp', true)) for the postgres-login phases 1-3.
alter role app_rls set search_path = public, pg_temp;

comment on role app_rls is
  'DB_CONNECTION_STRING login for user/visitor traffic. No own privileges; may only SET ROLE app_user/app_public.';
```

### A.9 `MIGRATION M09_edge_webhook_secret` (Track K, CHANGE C10, W7, PGlite-verified (final run))

```sql
-- CHANGE C10 and W7 (PGlite-verified, final run).
-- Apply only after the edge functions accept header x-webhook-secret (verify_jwt = false) and the Vault secret
-- `edge_webhook_secret` is set. Once the secret exists, the service_role key is no longer placed in the
-- PUBLIC-readable pg_net queue. Residual: the webhook secret itself is readable there (it only authorises the
-- four edge functions).

create or replace function public.call_edge_function_with_vault_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base       text;
  v_secret     text;
  v_token      text;
  v_headers    jsonb;
  v_request_id bigint;
begin
  select s.value into v_base from private.settings s where s.key = 'edge_functions_base_url';
  if v_base is null then
    raise warning 'call_edge_function_with_vault_secret: edge_functions_base_url not set, skipping %', tg_argv[0];
    return new;
  end if;

  select ds.decrypted_secret into v_secret
    from vault.decrypted_secrets ds where ds.name = 'edge_webhook_secret' limit 1;
  if v_secret is not null then
    v_headers := pg_catalog.jsonb_build_object('Content-type', 'application/json', 'x-webhook-secret', v_secret);
  else
    -- Transition fallback until the Vault secret exists.
    select ds.decrypted_secret into v_token
      from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
    if v_token is null then
      raise warning 'call_edge_function_with_vault_secret: no webhook credential in Vault, skipping %', tg_argv[0];
      return new;
    end if;
    v_headers := pg_catalog.jsonb_build_object('Content-type', 'application/json', 'Authorization', 'Bearer ' || v_token);
  end if;

  select net.http_post(
    url                  := v_base || '/' || tg_argv[0],
    headers              := v_headers,
    body                 := pg_catalog.to_jsonb(new),
    timeout_milliseconds := 5000
  ) into v_request_id;
  return new;
end;
$$;
alter function public.call_edge_function_with_vault_secret() owner to postgres;
revoke all on function public.call_edge_function_with_vault_secret() from public, anon, authenticated;

-- CHANGE W7: like the trigger function, the Sync Plans job posts nothing when Vault holds neither credential
-- (it would otherwise send an unauthenticated request with "Authorization": null).
do $do$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'Sync Plans',
      '0 8 */3 * *',
      $job$
      select net.http_post(
        url := s.value || '/sync-available-plans',
        headers := case
                     when w.secret is not null
                       then jsonb_build_object('Content-type', 'application/json', 'x-webhook-secret', w.secret)
                     else jsonb_build_object('Content-type', 'application/json', 'Authorization', 'Bearer ' ||
                            (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1))
                   end,
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      )
      from private.settings s
      left join lateral (select decrypted_secret as secret from vault.decrypted_secrets
                          where name = 'edge_webhook_secret' limit 1) w on true
      where s.key = 'edge_functions_base_url'
        and (w.secret is not null
             or exists (select 1 from vault.decrypted_secrets where name = 'service_role_key'))
      $job$
    );
  end if;
end
$do$;
```

### A.10 `MIGRATION M10_auth_users_sync` (Phase 2; CHANGE C11, W1, W2, PGlite-verified (final run))

```sql
-- Verified core: the map-based skip (PATCH P5), trigger functions in `private` firing for supabase_auth_admin,
-- anonymous skip, missing-plan failure, delete cascade (PGlite G7/scenario 08).
-- CHANGE C11 (PGlite-verified, final run): one reconciled auth-sync migration replacing the two earlier drafts
-- (not included) - map columns and statuses, consent contract via terms_version (coalesce to false), Google-only
-- avatars, no name sync from user_metadata, legacy consent marker, deletion log, welcome/consent/terms definers.
-- CHANGE W1 and W2 (PGlite-verified, final run): rows only for confirmed email addresses; deletions mark the map row.
-- Sign-ups and anonymous sign-ins must stay DISABLED on the project. A failing AFTER INSERT trigger on auth.users
-- blocks EVERY sign-up ("Database error saving new user").
-- postgres does not own auth.users. On hosted Supabase it may DROP TRIGGER there through
-- supautils.drop_trigger_grants (TEST); PGlite has no supautils and returns 42501, so trigger DDL on auth.users is
-- verified on the local stack and TEST only. Prefer CREATE OR REPLACE FUNCTION for behaviour changes; before a
-- re-run of this migration, drop the three triggers first (drop trigger if exists ... on auth.users).

-- 10.1 Per-project settings (terms_version is inserted by an operator per project after legal sign-off)
insert into private.settings (key, value)
select 'default_plan_id', p.id
  from public.plans p
 where p.id = 'pri_01k27ajepm199twd1x77rpwdrq'
on conflict (key) do nothing;

-- 10.2 Migration schema (must exist before the sign-up trigger)
create schema if not exists migration;
alter schema migration owner to postgres;
revoke all on schema migration from public;

create table if not exists migration.clerk_user_map (
  clerk_user_id          text primary key check (clerk_user_id ~ '^user_[A-Za-z0-9]+$'),
  supabase_user_id       uuid not null unique,
  origin                 text not null default 'import' check (origin in ('import', 'rollback_push')),
  status                 text not null default 'claimed'
                         check (status in ('claimed', 'migrated', 'conflict', 'skipped', 'error', 'deleted')),
  email                  text,
  email_verified         boolean,
  password_imported      boolean not null default false,
  password_hasher        text,
  google_sub             text,
  avatar_url             text,
  cookie_consent         jsonb,
  mfa_enabled            boolean not null default false,
  banned                 boolean not null default false,
  owns_data              boolean not null default false,
  clerk_created_at       timestamptz,
  clerk_last_sign_in_at  timestamptz,
  detail                 text,
  updated_at             timestamptz not null default now()
);
create table if not exists migration.auth_user_deletions (
  supabase_user_id uuid primary key,
  clerk_user_id    text,
  deleted_at       timestamptz not null default now()
);
create table if not exists migration.cutover_log (
  id     bigint generated always as identity primary key,
  at     timestamptz not null default now(),
  step   text not null,
  detail jsonb
);
alter table migration.clerk_user_map      owner to postgres;
alter table migration.auth_user_deletions owner to postgres;
alter table migration.cutover_log         owner to postgres;
revoke all on table migration.clerk_user_map, migration.auth_user_deletions, migration.cutover_log from public;

-- 10.3 users columns and consent default (legal sign-off: section 14 input 14)
alter table public.users add column if not exists welcome_email_sent_at timestamptz;
alter table public.users alter column consents set default
  '{"terms-and-conditions": false, "privacy-policy": false, "refund-policy": false, "source": "default"}'::jsonb;
-- Existing rows carry the old all-true default that nobody actively gave; mark them so CRM exports treat them as unknown.
-- consents is not in the Brevo trigger column list, so this update sends no webhooks.
update public.users
   set consents = coalesce(consents, '{}'::jsonb) || '{"source": "legacy_default"}'::jsonb
 where not (coalesce(consents, '{}'::jsonb) ? 'source');

-- 10.4 Metadata normalisers (user_metadata is user-writable: cosmetic only, capped). No {m,n} above 255.
create or replace function private.display_name_from_meta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.left(pg_catalog.btrim(coalesce(p_meta ->> 'full_name', p_meta ->> 'name', '')), 200)
$$;

create or replace function private.avatar_from_meta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
           when v ~ '^https://lh[0-9]+\.googleusercontent\.com/\S*$' and pg_catalog.length(v) <= 2048 then v
           else null
         end
    from (select coalesce(p_meta ->> 'avatar_url', p_meta ->> 'picture') as v) s
$$;

-- 10.5 Row creation on sign-up
-- CHANGE W1: the row, and with it the Brevo/CRM webhook, exists only for a confirmed email address. An unconfirmed
-- email sign-up gets its row when GoTrue sets email_confirmed_at (handle_auth_user_updated below).
create or replace function private.create_user_row(p_id uuid, p_email text, p_user_meta jsonb, p_app_meta jsonb, p_is_anonymous boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta     jsonb := coalesce(p_user_meta, '{}'::jsonb);
  v_plan     text;
  v_terms    text;
  v_accepted boolean;
begin
  -- PATCH P5: imported Clerk users are claimed in the map BEFORE admin.createUser; GoTrue writes app_metadata in a
  -- later UPDATE, so the app_metadata check alone never matches at INSERT time.
  if exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = p_id) then
    return;
  end if;
  if coalesce(p_app_meta, '{}'::jsonb) ? 'clerk_user_id' then
    return;
  end if;
  if coalesce(p_is_anonymous, false) then
    return;
  end if;

  select s.value into v_plan from private.settings s where s.key = 'default_plan_id';
  if v_plan is null then
    raise exception 'private.settings.default_plan_id is not set' using errcode = 'P0001';
  end if;
  select s.value into v_terms from private.settings s where s.key = 'terms_version';
  v_accepted := coalesce(v_terms is not null and (v_meta ->> 'terms_version') = v_terms, false);

  insert into public.users (id, email, name, image, plan_id, consents)
  values (
    p_id::text,
    pg_catalog.lower(p_email),
    private.display_name_from_meta(v_meta),
    private.avatar_from_meta(v_meta),
    v_plan,
    pg_catalog.jsonb_build_object(
      'terms-and-conditions', v_accepted,
      'privacy-policy',       v_accepted,
      'refund-policy',        v_accepted,
      'version',              case when v_accepted then v_terms end,
      'accepted_at',          case when v_accepted then pg_catalog.now() end,
      'source',               'signup'))
  on conflict (id) do nothing;
end;
$$;

create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- PATCH P5 (kept inline: the import script guard greps this definition for clerk_user_map)
  if exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = new.id) then
    return new;
  end if;
  if new.email is not null and new.email_confirmed_at is null then   -- CHANGE W1
    return new;
  end if;
  perform private.create_user_row(new.id, new.email, new.raw_user_meta_data, new.raw_app_meta_data, new.is_anonymous);
  return new;
end;
$$;

-- 10.6 Email sync and avatar fill (no name sync: users edit names in-app and it would amplify Brevo calls)
create or replace function private.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_img text;
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then   -- CHANGE W1
    perform private.create_user_row(new.id, new.email, new.raw_user_meta_data, new.raw_app_meta_data, new.is_anonymous);
  end if;
  -- auth.users.email changes only after confirmation when mailer_autoconfirm=false and secure email change are on
  -- (asserted in the section 8 go/no-go).
  if new.email is distinct from old.email and new.email is not null then
    update public.users u set email = pg_catalog.lower(new.email) where u.id = new.id::text;
  end if;
  if new.raw_user_meta_data is distinct from old.raw_user_meta_data then
    v_img := private.avatar_from_meta(coalesce(new.raw_user_meta_data, '{}'::jsonb));
    if v_img is not null then
      update public.users u set image = v_img where u.id = new.id::text and u.image is null;
    end if;
  end if;
  return new;
end;
$$;

-- 10.7 Deletion. actions/account.ts cancels Paddle BEFORE authAdmin().deleteUser (hard delete). FK cascades remove
-- owned rows and subscriptions (via customer_id). The log lets a rollback delete the matching Clerk user.
create or replace function private.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into migration.auth_user_deletions (supabase_user_id, clerk_user_id)
  values (old.id, (select m.clerk_user_id from migration.clerk_user_map m where m.supabase_user_id = old.id))
  on conflict (supabase_user_id) do nothing;
  -- CHANGE W2: a deleted account must not stay 'migrated' in the map, or the re-cutover A.R1 precondition
  -- 'map rows marked migrated without an auth.users row' blocks after a rollback drill with a deletion.
  update migration.clerk_user_map m set status = 'deleted', updated_at = pg_catalog.now()
   where m.supabase_user_id = old.id and m.status <> 'deleted';
  delete from public.users u where u.id = old.id::text;
  return old;
end;
$$;

-- 10.8 App-callable definers
create or replace function private.current_terms_version()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.value from private.settings s where s.key = 'terms_version'
$$;

create or replace function private.claim_welcome_email()
returns table (email text, name text)
language sql
volatile
security definer
set search_path = ''
as $$
  update public.users u
     set welcome_email_sent_at = pg_catalog.now()
   where u.id = private.current_user_id()
     and u.welcome_email_sent_at is null
  returning u.email, u.name
$$;

create or replace function private.record_consents(p_version text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid text := private.current_user_id();
begin
  if v_uid is null then
    raise exception 'record_consents: no verified identity' using errcode = '42501';
  end if;
  if p_version is null or p_version is distinct from (select s.value from private.settings s where s.key = 'terms_version') then
    raise exception 'record_consents: stale terms version' using errcode = '22023';
  end if;
  update public.users u
     set consents = pg_catalog.jsonb_build_object(
           'terms-and-conditions', true, 'privacy-policy', true, 'refund-policy', true,
           'version', p_version, 'accepted_at', pg_catalog.now(), 'source', 'gate')
   where u.id = v_uid;
end;
$$;

-- 10.9 Ownership and EXECUTE
alter function private.display_name_from_meta(jsonb)  owner to postgres;
alter function private.avatar_from_meta(jsonb)        owner to postgres;
alter function private.create_user_row(uuid, text, jsonb, jsonb, boolean) owner to postgres;   -- CHANGE W1
alter function private.handle_auth_user_created()     owner to postgres;
alter function private.handle_auth_user_updated()     owner to postgres;
alter function private.handle_auth_user_deleted()     owner to postgres;
alter function private.current_terms_version()        owner to postgres;
alter function private.claim_welcome_email()          owner to postgres;
alter function private.record_consents(text)          owner to postgres;
revoke all on function
  private.display_name_from_meta(jsonb), private.avatar_from_meta(jsonb),
  private.create_user_row(uuid, text, jsonb, jsonb, boolean),
  private.handle_auth_user_created(), private.handle_auth_user_updated(), private.handle_auth_user_deleted(),
  private.current_terms_version(), private.claim_welcome_email(), private.record_consents(text)
from public;
grant execute on function private.claim_welcome_email(), private.record_consents(text) to app_user;
grant execute on function private.current_terms_version() to app_user, app_public;

-- 10.10 Triggers (postgres holds TRIGGER on auth.users; TEST has none yet)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_auth_user_created();
create trigger on_auth_user_updated
  after update of email, email_confirmed_at, raw_user_meta_data on auth.users   -- CHANGE W1
  for each row execute function private.handle_auth_user_updated();
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function private.handle_auth_user_deleted();
```

### A.R1 `scripts/cutover/remap-user-ids.sql` (Phase 4 runbook step 9; CHANGE C12 and W9 on top of the verified remap, PGlite-verified (final run))

```sql
-- Operator machine, MIGRATION_DATABASE_URL (session pooler 5432 or direct), inside the maintenance window:
-- maintenance on (writes and /api/paddle return 503), worker paused, Clerk frozen, delta import done.
-- The wrapper script refuses the PROD ref unless ALLOW_PROD=1.
-- CHANGE C12 and W9 (PGlite-verified, final run, run as a psql script).
\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local statement_timeout = '10min';
set local application_name = 'cutover:remap';

-- 1. CHANGE C12 + W9: strongest lock first, BEFORE the precondition reads (they would otherwise take ACCESS SHARE on
-- public.users and turn this into a lock upgrade, and a webhook could change a checked row before the lock).
lock table public.users in access exclusive mode;
lock table public.catalogues, public.analytics, public.newsletter, public.ocr, public.prompts, public.user_themes
  in share row exclusive mode;

-- 0. Preconditions
do $$
begin
  if exists (select 1 from pg_catalog.pg_trigger where tgname = 'analytics_upsert_trigger' and not tgisinternal) then
    raise exception 'analytics_upsert_trigger exists: a cascaded UPDATE would double analytics counters';
  end if;
  if exists (select 1 from auth.users a
              where not exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = a.id)) then
    raise exception 'auth.users has users outside the map (sign-ups not disabled? run purge-dark-test-users on TEST)';
  end if;
  if exists (select 1 from migration.clerk_user_map m join public.users u on u.id = m.supabase_user_id::text) then
    raise exception 'a target uuid is already present in public.users';
  end if;
  if exists (select 1 from migration.clerk_user_map m left join auth.users a on a.id = m.supabase_user_id
              where m.status = 'migrated' and a.id is null) then
    raise exception 'map rows marked migrated without an auth.users row';
  end if;
  if exists (select 1 from migration.clerk_user_map where status = 'claimed') then
    raise exception 'map rows still claimed: finish or classify them';
  end if;
  if not exists (select 1 from public.plans where id = (select s.value from private.settings s where s.key = 'default_plan_id')) then
    raise exception 'private.settings.default_plan_id is not a row in public.plans';
  end if;
  -- CHANGE C12: legacy rows stay un-updatable under the NOT VALID check, so no paying user may be left unmapped.
  if exists (select 1 from public.users u
              where u.customer_id is not null
                and not exists (select 1 from migration.clerk_user_map m where m.clerk_user_id = u.id and m.status = 'migrated')) then
    raise exception 'unmapped users with a Paddle customer_id: resolve them before the re-key';
  end if;
end $$;

-- 2. From here a stale Clerk id written back fails loudly. NOT VALID: accepted legacy orphans are validated at T+30 (M12).
alter table public.users add constraint users_id_is_uuid
  check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') not valid;

-- 3. Named triggers only. Never DISABLE TRIGGER ALL or session_replication_role (they skip the RI cascade triggers).
alter table public.users       disable trigger "Brevo New Contact Webhook";
alter table public.catalogues  disable trigger catalogues_touch_updated_at;
alter table public.user_themes disable trigger user_themes_touch_updated_at;

-- 4. Evidence for the assertions and verify.sql
drop table if exists migration.pre_remap_counts;
create table migration.pre_remap_counts as
select u.id as old_id, u.plan_id, u.customer_id,
       (select count(*) from public.catalogues  c where c.created_by = u.id) as catalogues,
       (select count(*) from public.analytics   a where a.user_id    = u.id) as analytics,
       (select coalesce(sum(a.pageview_count), 0) from public.analytics a where a.user_id = u.id) as pageviews,
       (select count(*) from public.newsletter  n where n.owner_id   = u.id) as newsletter,
       (select count(*) from public.ocr         o where o.user_id    = u.id) as ocr,
       (select count(*) from public.prompts     p where p.user_id    = u.id) as prompts,
       (select count(*) from public.user_themes t where t.user_id    = u.id) as themes
  from public.users u;

-- 5. Re-key; the 6 ownership FKs are ON UPDATE CASCADE (TEST). subscriptions link via customer_id and are untouched.
update public.users u
   set id = m.supabase_user_id::text
  from migration.clerk_user_map m
 where m.clerk_user_id = u.id
   and m.status = 'migrated';

-- 6. Profile fields gathered at import
update public.users u
   set email = pg_catalog.lower(a.email),
       image = case
                 when u.image ~* '^https://(img\.clerk\.com|images\.clerk\.dev)/'
                   then case when m.avatar_url ~ '^https://lh[0-9]+\.googleusercontent\.com/' then m.avatar_url end
                 else u.image
               end,
       cookie_preferences = case
                              when m.cookie_consent is not null
                               and (u.cookie_preferences is null
                                    or coalesce(m.cookie_consent ->> 'timestamp', '') > coalesce(u.cookie_preferences ->> 'timestamp', ''))
                                then m.cookie_consent
                              else u.cookie_preferences
                            end,
       welcome_email_sent_at = coalesce(u.welcome_email_sent_at, u.created_at, pg_catalog.now())
  from migration.clerk_user_map m
  join auth.users a on a.id = m.supabase_user_id
 where u.id = m.supabase_user_id::text;

-- 7. Migrated Clerk users that never had a public.users row (webhook gap). Consents take the M10 default -> gate.
insert into public.users (id, email, name, image, plan_id, cookie_preferences, welcome_email_sent_at)
select m.supabase_user_id::text,
       pg_catalog.lower(a.email),
       private.display_name_from_meta(coalesce(a.raw_user_meta_data, '{}'::jsonb)),
       case when m.avatar_url ~ '^https://lh[0-9]+\.googleusercontent\.com/' then m.avatar_url end,
       (select s.value from private.settings s where s.key = 'default_plan_id'),
       m.cookie_consent,
       pg_catalog.now()
  from migration.clerk_user_map m
  join auth.users a on a.id = m.supabase_user_id
 where m.status = 'migrated'
   and not exists (select 1 from public.users u where u.id = m.supabase_user_id::text);

-- 8. Re-enable exactly what step 3 disabled
alter table public.users       enable trigger "Brevo New Contact Webhook";
alter table public.catalogues  enable trigger catalogues_touch_updated_at;
alter table public.user_themes enable trigger user_themes_touch_updated_at;

-- 9. Nothing owned, billed or counted changed hands
do $$
begin
  if exists (
    select 1
      from migration.pre_remap_counts b
      join migration.clerk_user_map m on m.clerk_user_id = b.old_id and m.status = 'migrated'
      join public.users u on u.id = m.supabase_user_id::text
     where b.plan_id is distinct from u.plan_id
        or b.customer_id is distinct from u.customer_id
        or b.catalogues <> (select count(*) from public.catalogues  c where c.created_by = u.id)
        or b.analytics  <> (select count(*) from public.analytics   a where a.user_id    = u.id)
        or b.pageviews  <> (select coalesce(sum(a.pageview_count), 0) from public.analytics a where a.user_id = u.id)
        or b.newsletter <> (select count(*) from public.newsletter  n where n.owner_id   = u.id)
        or b.ocr        <> (select count(*) from public.ocr         o where o.user_id    = u.id)
        or b.prompts    <> (select count(*) from public.prompts     p where p.user_id    = u.id)
        or b.themes     <> (select count(*) from public.user_themes t where t.user_id    = u.id)
  ) then
    raise exception 'ownership, plan, customer or counters changed during re-key';
  end if;
end $$;

insert into migration.cutover_log (step, detail)
values ('remap', pg_catalog.jsonb_build_object(
  'uuid_users',        (select count(*) from public.users where id ~ '^[0-9a-f]{8}-'),
  'legacy_users_left', (select count(*) from public.users where id like 'user\_%')));
commit;
```

### A.R2 `scripts/cutover/rollback-remap.sql` (R1/R2 rollback step 4; CHANGE W9, PGlite-verified (final run))

```sql
\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local application_name = 'cutover:rollback-remap';
lock table public.users in access exclusive mode;   -- W9: before the check
lock table public.catalogues, public.analytics, public.newsletter, public.ocr, public.prompts, public.user_themes
  in share row exclusive mode;

-- Supabase-only users must already have Clerk ids written into the map (origin rollback_push).
do $$
begin
  if exists (select 1 from public.users u
              where u.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                and not exists (select 1 from migration.clerk_user_map m
                                 where m.supabase_user_id::text = u.id and m.status = 'migrated')) then
    raise exception 'uuid users without a Clerk id: run push-supabase-users-to-clerk.ts first';
  end if;
end $$;

alter table public.users drop constraint if exists users_id_is_uuid;
alter table public.users       disable trigger "Brevo New Contact Webhook";
alter table public.catalogues  disable trigger catalogues_touch_updated_at;
alter table public.user_themes disable trigger user_themes_touch_updated_at;

update public.users u
   set id = m.clerk_user_id
  from migration.clerk_user_map m
 where u.id = m.supabase_user_id::text
   and m.status = 'migrated';

alter table public.users       enable trigger "Brevo New Contact Webhook";
alter table public.catalogues  enable trigger catalogues_touch_updated_at;
alter table public.user_themes enable trigger user_themes_touch_updated_at;

insert into migration.cutover_log (step, detail)
values ('rollback-remap', pg_catalog.jsonb_build_object(
  'uuid_left', (select count(*) from public.users where id ~ '^[0-9a-f]{8}-')));
commit;
-- auth.users rows stay (dormant under Clerk). A re-cutover maps rollback_push users back through the same map.
-- After a rollback, M11 is recorded as applied but the constraint is gone; the next re-key adds it again.
```

### A.11 `MIGRATION M11_users_id_uuid_check` (Phase 4, immediately after A.R1 commits)

```sql
-- Records the constraint added inside the re-key transaction in migration history; idempotent.
-- Delete supabase/tests/database/15_clerk_ids.test.sql in the same commit.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
                  where conrelid = 'public.users'::regclass and conname = 'users_id_is_uuid') then
    alter table public.users add constraint users_id_is_uuid
      check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') not valid;
  end if;
end $$;
```

### A.12 `MIGRATION M12_validate_users_id_uuid` (Phase 5, T+30 after orphan triage)

```sql
alter table public.users validate constraint users_id_is_uuid;
```

### A.13 `MIGRATION M13_post_cutover_cleanup` (Phase 5, after the agreed retention; CHANGE W3, PGlite-verified (final run))

```sql
drop table if exists private.backup_newsletter_dupes;
drop table if exists private.backup_product_newsletter_dupes;
drop table if exists private.backup_qr_configs_dupes;
drop table if exists private.backup_prompts_null_user;
drop table if exists private.backup_ocr_null_user;
drop table if exists private.backup_newsletter_forged_owner;
drop table if exists migration.pre_remap_counts;
-- CHANGE W3: the M10 delete trigger inserts into migration.auth_user_deletions; replace its body first, or every
-- auth.admin.deleteUser fails with 42P01 after this migration.
create or replace function private.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update migration.clerk_user_map m set status = 'deleted', updated_at = pg_catalog.now()
   where m.supabase_user_id = old.id and m.status <> 'deleted';
  delete from public.users u where u.id = old.id::text;
  return old;
end;
$$;
drop table if exists migration.auth_user_deletions;
-- Keep migration.clerk_user_map permanently, minimised (signed legacy Paddle ids, support); export cutover_log first.
update migration.clerk_user_map
   set email = null, avatar_url = null, cookie_consent = null, google_sub = null, password_hasher = null,
       detail = null, clerk_last_sign_in_at = null, updated_at = now();
drop table if exists migration.cutover_log;
```

### A.14 Rollback SQL (roll back later migrations first)

Status: PGlite-verified (final run) in reverse order in three variants (everything applied through M13; through M12 with R2 in its window; Phase 1 rollback with M00-M09 only), with CHANGE W1 and W4 applied; each step leaves the previous migration's catalog state and a working database. Prose and commented lines were emulated literally. The commented `drop trigger` alternative for M10 is not PGlite-verified (no supautils); verify it on the local stack and TEST.

```sql
-- M13: irreversible (backups dropped, map minimised).
-- M12: alter table public.users drop constraint if exists users_id_is_uuid;   (then re-add NOT VALID if still needed)
-- R1:  A.R2, only while Clerk is still available.

-- M10: keep disable_signup = true. Hosted Supabase lets postgres drop triggers on auth.users through
-- supautils.drop_trigger_grants (TEST); check it first on that project:
--   select setting from pg_settings where name = 'supautils.drop_trigger_grants';
-- If auth.users is listed for postgres, drop the triggers (not PGlite-verified; local stack and TEST first):
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop trigger if exists on_auth_user_updated on auth.users;
--   drop trigger if exists on_auth_user_deleted on auth.users;
-- Otherwise (and in PGlite, which has no supautils) neutralise the functions:
create or replace function private.handle_auth_user_created() returns trigger
  language plpgsql security definer set search_path = '' as $$ begin return new; end $$;
create or replace function private.handle_auth_user_updated() returns trigger
  language plpgsql security definer set search_path = '' as $$ begin return new; end $$;
create or replace function private.handle_auth_user_deleted() returns trigger
  language plpgsql security definer set search_path = '' as $$ begin return old; end $$;
drop function if exists private.create_user_row(uuid, text, jsonb, jsonb, boolean);   -- CHANGE W1
-- Consent default: restore only on legal instruction
-- alter table public.users alter column consents set default '{"refund-policy": true, "privacy-policy": true, "terms-and-conditions": true}'::jsonb;

-- M09: re-run the M02 body of public.call_edge_function_with_vault_secret() and the M02 cron DO block.

-- M08: set DB_CONNECTION_STRING back to postgres.<ref>, redeploy, wait for drain, then:
select pg_catalog.pg_terminate_backend(pid) from pg_catalog.pg_stat_activity where usename = 'app_rls';
drop role if exists app_rls;

-- M07:
alter table public.catalogues drop constraint if exists catalogues_name_slug;
alter table public.catalogues drop constraint if exists catalogues_other_json_size;
-- (size checks stay; validation is harmless)

-- M06: re-run the M05 definitions of begin_ai_turn(text, integer, boolean) and refund_ai_turn(uuid), then:
drop function if exists private.begin_ai_turn(text, integer, text, uuid, text);
drop function if exists private.set_plan_state(uuid, boolean, integer, text);
-- prompts columns kind/plan_* may stay (defaults are harmless).

-- M05:
drop function if exists private.refund_ai_turn(uuid);
drop function if exists private.begin_ai_turn(text, integer, boolean);
drop function if exists private.my_usage();
drop function if exists private.subscribe_product_newsletter(text);
drop function if exists private.subscribe_catalogue_newsletter(uuid, text);
drop function if exists private.catalogue_name_available(text);

-- M04 (RLS stays on: M00 owns that):
drop trigger if exists catalogues_pin_insert        on public.catalogues;
drop trigger if exists catalogues_touch_updated_at  on public.catalogues;
drop trigger if exists qr_configs_touch_updated_at  on public.qr_configs;
drop trigger if exists user_themes_touch_updated_at on public.user_themes;
drop function if exists private.catalogues_pin_insert();
drop function if exists private.touch_updated_at();
drop policy if exists users_select_self        on public.users;
drop policy if exists users_update_self        on public.users;
drop policy if exists catalogues_select_owner  on public.catalogues;
drop policy if exists catalogues_insert_owner  on public.catalogues;
drop policy if exists catalogues_update_owner  on public.catalogues;
drop policy if exists catalogues_delete_owner  on public.catalogues;
drop policy if exists catalogues_select_public on public.catalogues;
drop policy if exists qr_configs_owner         on public.qr_configs;
drop policy if exists user_themes_owner        on public.user_themes;
drop policy if exists analytics_select_owner   on public.analytics;
drop policy if exists prompts_select_owner     on public.prompts;
drop policy if exists ocr_select_owner         on public.ocr;
drop policy if exists newsletter_select_owner  on public.newsletter;
revoke all on public.users, public.catalogues, public.qr_configs, public.user_themes,
              public.analytics, public.prompts, public.ocr, public.newsletter
  from app_user, app_public;

-- M03: the ledger defects (UNIQUE(catalogue), ON DELETE CASCADE, nullable user_id) are NOT restored.
alter table public.catalogues  drop constraint if exists catalogues_status_check;
alter table public.catalogues  drop constraint if exists catalogues_content_size;
alter table public.user_themes drop constraint if exists user_themes_colors_size;
alter table public.qr_configs  drop constraint if exists qr_configs_config_size;
alter table public.users       drop constraint if exists users_cookie_prefs_size;
-- Restore deduped or forged rows only if they are really wanted back:
-- insert into public.newsletter select * from private.backup_newsletter_dupes;   (drop newsletter_catalogue_email_key first)
-- insert into public.newsletter select * from private.backup_newsletter_forged_owner;

-- M02: only if M02 misbehaves on PROD (re-introduces TEST->PROD posting): recreate the function body from
-- 20260911213819_remote_schema.sql:55-88, the unnarrowed Brevo trigger, and the cron DO block from
-- 20260912093000_lockdown_privileges_and_schema_fixes.sql:242-267; delete from private.settings where key = 'edge_functions_base_url'.

-- M01 (CHANGE W4) cannot be rolled back once M10 is applied: the auth.users triggers depend on
-- private.handle_auth_user_*() (leave roles and schema in place; dropping the triggers first is possible only where
-- supautils allows it, see M10 above). Before M10, after M02-M09 are rolled back (export private.paddle_events /
-- paddle_unresolved_events first if they are still needed):
drop table if exists private.paddle_events, private.paddle_unresolved_events,
  private.backup_newsletter_dupes, private.backup_product_newsletter_dupes, private.backup_qr_configs_dupes,
  private.backup_prompts_null_user, private.backup_ocr_null_user, private.backup_newsletter_forged_owner;
drop function if exists private.current_user_id();
drop table if exists private.settings;
alter default privileges for role postgres grant execute on functions to public;
drop schema if exists private;
drop role if exists app_public;
drop role if exists app_user;

-- M00: prefer rolling the app forward. If one missed anon path must work again while RLS stays on,
-- re-grant only that privilege and add a temporary permissive policy for it, for example:
grant select on public.catalogues to anon;
create policy tmp_rollback_anon_catalogues_select on public.catalogues for select to anon using (true);
notify pgrst, 'reload schema';
-- Never "disable row level security": once M04 exists that would let app_user read every row.
```

### A.15 `scripts/audit/preflight.sql` (read-only; you run it on PROD; copied to `scripts/cutover/preflight.sql` with the Phase 3/4 queries enabled)

Status: PGlite-verified (final run): all statements parse and run read-only as `postgres` before M00, after M00, after M00-M10 and after the cutover, including the Phase 3/4 queries uncommented; the trigger inventory query is fixed by CHANGE W5 (as first written it always returned 0 rows).

```sql
select current_setting('server_version') as pg_version;                                    -- must be >= 16
select version from supabase_migrations.schema_migrations order by version;
select rolname from pg_roles where rolname in ('app_user', 'app_public', 'app_rls');          -- expect none before M01
select grantee, table_name, string_agg(privilege_type, '/' order by privilege_type) as privs
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 1, 2 order by 1, 2;
select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'));
select defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl from pg_default_acl order by 1, 2;
select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' order by 1;
select conrelid::regclass, conname, contype, pg_get_constraintdef(oid) from pg_constraint
 where conrelid in ('public.prompts'::regclass, 'public.ocr'::regclass, 'public.catalogues'::regclass, 'public.users'::regclass) order by 1, 2;
-- CHANGE W5: filter by pg_namespace; regclass text omits "public." for tables on the search_path
select t.tgrelid::regclass, t.tgname, t.tgenabled from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
 where not t.tgisinternal and n.nspname = 'public' order by 1, 2;
select count(*) as analytics_upsert_trigger from pg_trigger where tgname = 'analytics_upsert_trigger' and not tgisinternal;
select status, count(*) from public.catalogues group by 1;
select count(*) filter (where user_id is null) as prompts_null_user from public.prompts;
select count(*) filter (where user_id is null) as ocr_null_user from public.ocr;
select catalogue_id, lower(email), count(*) from public.newsletter group by 1, 2 having count(*) > 1;
select lower(email), count(*) from public.product_newsletter group by 1 having count(*) > 1;
select catalogue, count(*) from public.qr_configs group by 1 having count(*) > 1;
select count(*) as forged_newsletter_owner from public.newsletter n join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;
-- CHANGE C2: raw sizes, not compressed
select max(octet_length(content::text)) as content_bytes from public.catalogues;
select max(octet_length(colors::text)) as colors_bytes from public.user_themes;
select max(octet_length(config::text)) as qr_config_bytes from public.qr_configs;
select max(octet_length(cookie_preferences::text)) as cookie_prefs_bytes from public.users;
select name from public.catalogues where name !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(name) > 100;
select count(*) as users, count(*) filter (where id like 'user\_%') as clerk_ids,
       count(*) filter (where email is null) as null_email, count(*) filter (where customer_id is not null) as with_customer
  from public.users;
select lower(email), count(*) from public.users group by 1 having count(*) > 1;
select exists (select 1 from public.plans where id = 'pri_01k27ajepm199twd1x77rpwdrq') as starter_plan_present;
select name from vault.secrets order by 1;                                                     -- names only
select jobname, schedule, command from cron.job;
select count(*) as auth_users from auth.users;
select count(*) as user_ids_in_jsonb from public.catalogues
 where content::text ~ 'user_[A-Za-z0-9]{10,}' or metadata::text ~ 'user_[A-Za-z0-9]{10,}';
-- Phase 3/4 additions once M10 exists:
-- select status, count(*) from migration.clerk_user_map group by 1;
-- select count(*) as unmapped_auth_users from auth.users a where not exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = a.id);
-- select count(*) as unmapped_paying_users from public.users u where u.customer_id is not null
--   and not exists (select 1 from migration.clerk_user_map m where m.clerk_user_id = u.id and m.status = 'migrated');
```

### A.16 `scripts/audit/exposure-audit.sql` (read-only; PROD before and after M00)

Status: E1-E5 PGlite-verified (final run) read-only as `postgres` in four states. E6 is ClickHouse log SQL, not Postgres; the same `logs` / `log_attributes` form was executed read-only on TEST logs on 2026-09-17 and returned `/rest/v1` rows.

```sql
-- E1 paid plan without a live subscription for the linked customer (compare with the Paddle API)
select u.id, u.email, u.plan_id, u.customer_id, u.created_at
  from public.users u
 where u.plan_id <> 'pri_01k27ajepm199twd1x77rpwdrq'   -- add the Starter yearly id if it exists
   and not exists (select 1 from public.subscriptions s
                    where s.customer_id = u.customer_id and s.subscription_status in ('active', 'trialing', 'past_due'));
-- E2 all subscription ids, to reconcile against a Paddle export (rows unknown to Paddle were forged)
select subscription_id, customer_id, subscription_status, price_id from public.subscriptions order by 1;
-- E3 newsletter rows whose owner is not the catalogue owner (forged ownerId)
select n.id, n.email, n.catalogue_id, n.owner_id, c.created_by
  from public.newsletter n join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;
-- E4 analytics for users without catalogues, and outliers
select a.user_id, count(*), sum(a.pageview_count) from public.analytics a
 where not exists (select 1 from public.catalogues c where c.created_by = a.user_id) group by 1;
select * from public.analytics
 where pageview_count > 10 * (select percentile_cont(0.99) within group (order by pageview_count) from public.analytics);
-- E5 catalogues owned by a user created after the catalogue (possible reassignment through anon PATCH)
select c.name, c.created_by, c.created_at, u.created_at as owner_created_at
  from public.catalogues c join public.users u on u.id = c.created_by
 where u.created_at > c.created_at + interval '1 minute';
-- E6 Supabase logs (ClickHouse SQL; Logs Explorer or Management API /analytics/endpoints/logs; max 24 h per query,
-- repeat per day within retention; https://supabase.com/docs/guides/observability/advanced-log-filtering)
-- select timestamp, log_attributes['request.method'] as method, log_attributes['request.path'] as path,
--        toInt32OrZero(log_attributes['response.status_code']) as status
--   from logs
--  where source = 'edge_logs' and log_attributes['request.path'] like '/rest/v1/%'
--    and log_attributes['request.method'] in ('POST', 'PATCH', 'PUT', 'DELETE')
--  order by timestamp desc limit 1000;
```

---

## Appendix B. TypeScript module skeletons

Load-bearing code only; UI omitted. All server modules start with `import "server-only"`.

### B.1 `lib/auth/identity.ts`

```ts
import "server-only";
import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

declare const verified: unique symbol;
export type VerifiedIdentity = Readonly<{
  userId: string;               // = public.users.id: Clerk "user_..." now, auth.users.id uuid string after cutover
  sessionId: string | null;
  provider: "clerk" | "supabase";
  [verified]: true;
}>;
export class UnauthorizedError extends Error { constructor() { super("Unauthorized"); } }

const CLERK_ID = /^user_[A-Za-z0-9]{10,64}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const mint = (v: { userId: string; sessionId: string | null; provider: "clerk" | "supabase" }) =>
  Object.freeze(v) as VerifiedIdentity;   // the ONLY cast that creates an identity (architecture test)

type AuthApi = Pick<SupabaseClient["auth"], "getClaims">;

export async function identityFromSupabaseAuth(auth: AuthApi): Promise<VerifiedIdentity | null> {
  const { data, error } = await auth.getClaims();          // local ES256 verification when an asymmetric key is current
  const c = data?.claims;
  if (error || !c || c.role !== "authenticated" || c.is_anonymous === true) return null;
  if (typeof c.sub !== "string" || !UUID.test(c.sub)) return null;
  return mint({ userId: c.sub, sessionId: typeof c.session_id === "string" ? c.session_id : null, provider: "supabase" });
}

export const getVerifiedIdentity = cache(async (): Promise<VerifiedIdentity | null> => {
  if (AUTH_PROVIDER === "clerk") {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId, sessionId } = await auth();             // verified by clerkMiddleware; no Backend API call
    return userId && CLERK_ID.test(userId) ? mint({ userId, sessionId: sessionId ?? null, provider: "clerk" }) : null;
  }
  const { createClient } = await import("@/utils/supabase/server");
  return identityFromSupabaseAuth((await createClient()).auth);
});

export async function requireIdentity(): Promise<VerifiedIdentity> {
  const me = await getVerifiedIdentity();
  if (!me) throw new UnauthorizedError();
  return me;
}

/** Delete account, credential changes, billing portal: a round trip that sees bans, deletion and sign-out. */
export async function requireFreshUser(): Promise<VerifiedIdentity & { email: string | null }> {
  const me = await requireIdentity();
  if (me.provider === "clerk") {
    const { clerkClient } = await import("@clerk/nextjs/server");
    const u = await (await clerkClient()).users.getUser(me.userId);
    if (u.banned || u.locked) throw new UnauthorizedError();
    return Object.freeze({ ...me, email: u.primaryEmailAddress?.emailAddress?.toLowerCase() ?? null });
  }
  const { createClient } = await import("@/utils/supabase/server");
  const { data, error } = await (await createClient()).auth.getUser();
  if (error || !data.user || data.user.id !== me.userId) throw new UnauthorizedError();
  return Object.freeze({ ...me, email: data.user.email?.toLowerCase() ?? null });
}
```

`lib/auth/provider.ts`: `export const AUTH_PROVIDER = process.env.NEXT_PUBLIC_AUTH_PROVIDER === "supabase" ? "supabase" : "clerk";` with `next.config.ts` `env: { NEXT_PUBLIC_AUTH_PROVIDER: process.env.AUTH_PROVIDER === "supabase" ? "supabase" : "clerk" }`. One source, inlined at build; a flip is a redeploy inside the maintenance window.

### B.2 `utils/db/pool.ts`

```ts
import "server-only";
import { schema } from "@quicktalog/common";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

function make(url: string | undefined, envName: string, max: number) {
  if (!url) throw new Error(`${envName} is not set`);      // lazy: bundle-analysis CI builds without env
  return drizzle(postgres(url, { prepare: false, max, idle_timeout: 5, max_lifetime: 600, connect_timeout: 10 }), { schema });
}
type Db = ReturnType<typeof make>;
let userDb: Db | undefined;
let adminDb: Db | undefined;
export const getUserDb = () => (userDb ??= make(process.env.DB_CONNECTION_STRING, "DB_CONNECTION_STRING", 3));
export const getAdminDb = () => (adminDb ??= make(process.env.DATABASE_ADMIN_URL, "DATABASE_ADMIN_URL", 2));
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
```

### B.3 `utils/db/rls.ts`

```ts
import "server-only";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { getUserDb, type Tx } from "./pool";

type AppRole = "app_user" | "app_public";
const LIMITS = {                                              // SET ROLE does not apply ALTER ROLE settings (PGlite)
  app_user: { statement: "8s", lock: "3s", idle: "10s" },
  app_public: { statement: "3s", lock: "1s", idle: "5s" },
} as const;

async function inRole<T>(role: AppRole, claims: { sub?: string; session_id?: string }, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (role !== "app_user" && role !== "app_public") throw new Error("invalid app role");   // never from input
  const l = LIMITS[role];
  return getUserDb().transaction(async (tx) => {
    // ONE statement, bound parameters, all transaction-local. search_path puts pg_temp LAST so a temp table
    // planted on a pooled backend cannot shadow Drizzle's unqualified table names (PGlite F3, verified).
    await tx.execute(sql`select
      pg_catalog.set_config('role', ${role}, true),
      pg_catalog.set_config('request.jwt.claims', ${JSON.stringify({ ...claims, role })}, true),
      pg_catalog.set_config('search_path', 'public, pg_temp', true),
      pg_catalog.set_config('statement_timeout', ${l.statement}, true),
      pg_catalog.set_config('lock_timeout', ${l.lock}, true),
      pg_catalog.set_config('idle_in_transaction_session_timeout', ${l.idle}, true)`);
    return fn(tx);
  });                 // no finally/reset: COMMIT/ROLLBACK discards local settings; a reset in an aborted tx throws 25P02
}

/** One block per server action. Never hold it across Redis, fetch, revalidate*, model calls or streaming. */
export function withUser<T>(me: VerifiedIdentity, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inRole("app_user", { sub: me.userId, ...(me.sessionId ? { session_id: me.sessionId } : {}) }, fn);
}
/** Visitors, build, ISR, public signups. Takes no identity and never reads cookies. */
export function withPublic<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
  return inRole("app_public", {}, fn);
}
export type { Tx };
```

### B.4 `utils/db/admin.ts` and `utils/db/errors.ts`

```ts
// utils/db/admin.ts - BYPASSRLS, allowlisted importers only
import "server-only";
import { sql } from "drizzle-orm";
import { getAdminDb, type Tx } from "./pool";
export type { Tx };
export async function asAdmin<T>(op: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!/^[a-z][a-z0-9:._-]{0,62}$/.test(op)) throw new Error("invalid admin op label");
  return getAdminDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_catalog.set_config('statement_timeout', '15s', true),
                                pg_catalog.set_config('application_name', ${`admin:${op}`}, true)`);
    return fn(tx);
  });
}

// utils/db/errors.ts - drizzle-orm 0.45 wraps postgres-js errors in DrizzleQueryError.cause (errors.js:10-18)
import "server-only";
export function pgError(e: unknown): { code: string; constraint?: string } | null {
  for (let cur: unknown = e, i = 0; cur && typeof cur === "object" && i < 5; cur = (cur as { cause?: unknown }).cause, i++) {
    const c = cur as { code?: unknown; constraint_name?: unknown };
    if (typeof c.code === "string" && /^[0-9A-Z]{5}$/.test(c.code))
      return { code: c.code, constraint: typeof c.constraint_name === "string" ? c.constraint_name : undefined };
  }
  return null;
}
export const isUniqueViolation = (e: unknown) => pgError(e)?.code === "23505";
export const isPermissionDenied = (e: unknown) => pgError(e)?.code === "42501";   // missing grant OR WITH CHECK failure
export const isCheckViolation = (e: unknown) => pgError(e)?.code === "23514";
```

### B.5 `lib/auth/redirects.ts` (isomorphic, no `server-only`)

```ts
const FALLBACK = "/admin/dashboard";
const hasUnsafeChars = (s: string) =>
  [...s].some((ch) => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127 || ch === "\\");

/** Same-origin relative path or fallback. Used by forms (browser), callback, confirm and middleware. */
export function safeNext(raw: string | null | undefined, origin?: string, fallback = FALLBACK): string {
  if (typeof raw !== "string" || raw.length > 512 || hasUnsafeChars(raw)) return fallback;   // /<TAB>/evil.com, /\evil.com
  let decoded: string;
  try { decoded = decodeURIComponent(raw); } catch { return fallback; }
  if (hasUnsafeChars(decoded)) return fallback;                                             // /%09/evil.com, /%5Cevil.com
  if (!raw.startsWith("/") || raw.startsWith("//")) return fallback;
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "http://local.invalid");
  try {
    const u = new URL(raw, base);
    if (u.origin !== new URL(base).origin) return fallback;
    const out = `${u.pathname}${u.search}${u.hash}`;
    return out.startsWith("/auth") && !out.startsWith("/auth/update-password") ? fallback : out;
  } catch {
    return fallback;
  }
}
```

### B.6 `lib/ops/flags.ts`

```ts
import { get } from "@vercel/global-config";
/** Runtime switch that flips without a deploy (Global Config, verified available on Hobby; env fallback).
 *  One store per Hobby account, so PROD and TEST share it and differ by key suffix. */
const ENV = process.env.VERCEL_ENV === "production" ? "prod" : "test";
export async function isMaintenance(): Promise<boolean> {
  if (process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG) {
    try { return (await get<boolean>(`maintenance_${ENV}`)) === true; } catch { /* fall back to env */ }
  }
  return process.env.MAINTENANCE_MODE === "1";
}
/** Fail closed: no token configured, or a short token, means nobody bypasses. */
export function maintenanceBypass(cookieValue: string | undefined): boolean {
  const t = process.env.MAINTENANCE_BYPASS_TOKEN;
  return !!t && t.length >= 32 && cookieValue === t;
}
```

### B.7 `utils/supabase/server-forwarded.ts` (auth-only, allowlisted)

```ts
import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { COOKIE_OPTIONS } from "@/lib/auth/cookie-options";

/** exchangeCodeForSession / verifyOtp from Vercel, rate-limited per END-USER IP via sb-forwarded-for.
 *  Requires security_sb_forwarded_for_enabled and a secret key (honoured by every IP-limited endpoint).
 *  Narrow facade: a secret-key client skips captcha (admin credentials) and exposes auth.admin, so neither
 *  .admin nor signInWithPassword/signUp/resetPasswordForEmail/signInWithOtp/resend is reachable from here. */
export type ForwardedAuth = Pick<SupabaseClient["auth"], "exchangeCodeForSession" | "verifyOtp" | "getClaims">;
export async function createForwardedAuthClient(): Promise<ForwardedAuth> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase auth env is not set");
  const [jar, h] = await Promise.all([cookies(), headers()]);
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();          // set by Vercel
  const client = createServerClient(url, key, {
    cookieOptions: COOKIE_OPTIONS,
    global: { headers: ip ? { "sb-forwarded-for": ip } : {} },
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => { for (const { name, value, options } of list) jar.set(name, value, options); },
    },
  });
  return {                                                             // .from()/.rpc()/.admin never exposed
    exchangeCodeForSession: (code: string) => client.auth.exchangeCodeForSession(code),
    verifyOtp: (p: { type: "email" | "recovery" | "email_change"; token_hash: string }) => client.auth.verifyOtp(p),
    getClaims: () => client.auth.getClaims(),
  } as ForwardedAuth;
}
```

The middleware variant is the same shape built on `request.cookies`/`NextResponse` (B.8).

### B.8 `middleware.ts` (dual period)

```ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";          // removed in Phase 5
import { type NextFetchEvent, type NextRequest, NextResponse } from "next/server";
import { AUTH_PROVIDER } from "@/lib/auth/provider";
import { isMaintenance, maintenanceBypass } from "@/lib/ops/flags";
import { updateSession } from "@/utils/supabase/middleware";

const clerk = clerkMiddleware(async (auth, req) => { if (createRouteMatcher(["/admin(.*)"])(req)) await auth.protect(); });

const NEEDS_SESSION = /^\/(admin|auth)(\/|$)|^\/catalogues\/[^/]+\/preview$|^\/api\/(dashboard|agent|items\/uploadthing)(\/|$)/;
const PROTECTED = /^\/admin(\/|$)|^\/catalogues\/[^/]+\/preview$/;
const WRITE_PATHS = /^\/(admin|auth)(\/|$)|^\/api\/(dashboard|agent|items\/uploadthing)(\/|$)/;

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  const path = req.nextUrl.pathname;
  const isAction = req.headers.has("next-action");
  if ((WRITE_PATHS.test(path) || isAction) && (await isMaintenance())
      && !maintenanceBypass(req.cookies.get("qt-maint-bypass")?.value)) {
    return new NextResponse("Quicktalog is upgrading sign-in. Back in a few minutes.", { status: 503, headers: { "Retry-After": "900" } });
  }
  if (AUTH_PROVIDER !== "supabase") return clerk(req, event);
  if (!NEEDS_SESSION.test(path) && !isAction) return NextResponse.next();   // public pages: no GoTrue call, no Set-Cookie
  const res = await updateSession(req, { protectedPath: PROTECTED });     // getClaims(); redirect to /auth?next=safeNext(...)
  expirePresentClerkCookies(req, res);                                     // only cookies present; host-only + Domain on PROD
  dropDuplicateSessionCookies(req, res);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|ingest|monitoring|api/paddle|api/clerk|api/revalidate|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|webmanifest|woff2?|ttf|map)$).*)"],
};
```

`app/api/paddle/route.ts` starts with `if (await isMaintenance()) return new Response(null, { status: 503 });` so Paddle retries after the window (live: 60 retries over 3 days; sandbox: only 3 within 15 minutes, so failed TEST notifications are replayed after a rehearsal, 10.5).

### B.9 `lib/catalogue/draft-cache.ts`

```ts
import "server-only";
import * as Sentry from "@sentry/nextjs";
import { schema, type Catalogue } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { type Tx, withUser } from "@/utils/db";
import { getRedis } from "@/utils/redis";

const TTL_SECONDS = 60 * 60 * 24 * 30;
const c = schema.catalogues;
/** Keyed by the immutable catalogue id: a reused slug never shows a previous owner's draft. */
export const draftKey = (catalogueId: string) => `${process.env.REDIS_KEY_PREFIX ?? "dev"}:catalogue:${catalogueId}`;

export async function loadOwnedCatalogue(tx: Tx, me: VerifiedIdentity, name: string): Promise<Catalogue | null> {
  const [row] = await tx.select().from(c).where(and(eq(c.name, name), eq(c.createdBy, me.userId))).limit(1);
  return (row as Catalogue | undefined) ?? null;
}

/** DB row under withUser first (own short tx), then Redis OUTSIDE the tx; server fields always from the row. */
export async function readOwnedDraft(me: VerifiedIdentity, name: string): Promise<Catalogue | null> {
  const row = await withUser(me, (tx) => loadOwnedCatalogue(tx, me, name));
  if (!row) return null;
  let draft: Partial<Catalogue> | null = null;
  try {
    const raw = await getRedis().getex(draftKey(row.id), { ex: TTL_SECONDS });
    draft = typeof raw === "string" ? JSON.parse(raw) : (raw as Partial<Catalogue> | null);
  } catch (err) {
    Sentry.captureException(err, { level: "warning", tags: { op: "readOwnedDraft" } });
  }
  return { ...row, ...(draft ?? {}), id: row.id, name: row.name, status: row.status, source: row.source,
           createdBy: row.createdBy, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

/** Call only after a withUser statement proved ownership; never stores createdBy. */
export async function writeOwnedDraft(row: Partial<Catalogue> & { id: string }): Promise<void> {
  const { createdBy: _drop, ...rest } = row;
  await getRedis().set(draftKey(row.id), JSON.stringify(rest), { ex: TTL_SECONDS });
}
export async function deleteDrafts(catalogueIds: string[]): Promise<void> {
  if (catalogueIds.length) await getRedis().del(...catalogueIds.map(draftKey));
}
```

### B.10 `lib/ai/metering.ts` and the agent route delta

```ts
import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { getPlanForUpdate } from "@/lib/entitlements/plan";
import { type Tx, withUser } from "@/utils/db";

export type AiTurnOutcome = "charged" | "continued" | "limit" | "not_found";
type Plan = { revision: number; tasks: { title: string; status: string }[] };

/** Canonical hash of the plan; the server stores it at onFinish and the client must resend the same plan. */
export function planHash(plan: Plan): string {
  const canonical = JSON.stringify({ r: plan.revision, t: plan.tasks.map((t) => [t.title, t.status]) });
  return createHash("sha256").update(canonical).digest("hex");
}

export function startAiTurn(me: VerifiedIdentity, a: { catalogue: string; kind: "agent" | "describe"; continuationOf: string | null; plan: Plan | null }) {
  return withUser(me, async (tx) => {
    const plan = await getPlanForUpdate(tx, me);                               // FOR NO KEY UPDATE on the users row
    const limit = typeof plan.features.ai_prompts === "number" ? plan.features.ai_prompts : null;
    const [r] = await tx.execute<{ outcome: AiTurnOutcome; ai_turn_id: string | null }>(sql`
      select outcome, ai_turn_id from private.begin_ai_turn(${a.catalogue}, ${limit}::int, ${a.kind},
        ${a.continuationOf}::uuid, ${a.plan ? planHash(a.plan) : null}::text)`);
    return { plan, turn: { outcome: r.outcome, turnId: r.ai_turn_id } };
  });
}

export async function setPlanState(tx: Tx, turnId: string, plan: Plan | null) {
  const pending = plan ? plan.tasks.filter((t) => t.status !== "done").length : 0;
  await tx.execute(sql`select private.set_plan_state(${turnId}::uuid, ${pending > 0}, ${pending}::int, ${plan ? planHash(plan) : null}::text)`);
}

export async function refundAiTurn(tx: Tx, turnId: string): Promise<boolean> {
  const [r] = await tx.execute<{ refunded: boolean }>(sql`select private.refund_ai_turn(${turnId}::uuid) as refunded`);
  return r?.refunded === true;
}
```

Agent route (`app/api/agent/route.ts`) changes on top of today's file:
- Validate the body; `catalogue.name === catalogueName` else 400; `const me = await getVerifiedIdentity()` else 401, **before** streaming.
- `const resuming = isPlanContinuation(messages)`; `const clientPlan = resuming ? planFromMessages(messages) : null`; `continuationOf` comes from the request body (the id the client received in stream message metadata).
- `start = await startAiTurn(me, { catalogue, kind: "agent", continuationOf, plan: clientPlan })`; `not_found` → 404, `limit` → 429.
- The root turn id to track is `start.turn.turnId` (for `continued`, the root turn id returned by the DB); send it to the client in message metadata.
- `onFinish`: `withUser(me, tx => session.plan && unfinished ? setPlanState(tx, rootTurnId, session.plan) : setPlanState(tx, rootTurnId, null))`; if `outcome === "charged"` and nothing was applied and no plan was opened → `refundAiTurn`. Errors go to Sentry; never call `cookies()` here.
- `actions/ai.ts` uses `kind: "describe"` and refunds when generation fails.
- Unit test: `planHash(planFromMessages(replayed stream))` equals the hash of `session.plan` at the end of the previous turn (unverified until written).

### B.11 `lib/paddle/checkout.ts` and `lib/paddle/resolve-user.ts`

```ts
// lib/paddle/checkout.ts
"use server";   // the only export is session-deriving; signing lives in a server-only helper
import { requireIdentity } from "@/lib/auth/identity";
import { ensurePaddleCustomer } from "@/lib/paddle/customer";
import { signUserId } from "@/lib/paddle/signature";
import { getPaddleInstance } from "@/utils/paddle/get-paddle-instance";

export async function createCheckout(priceId: string): Promise<{ transactionId: string }> {
  const me = await requireIdentity();
  // lib/paddle/customer.ts (server-only): users.customer_id if set; else find the Paddle customer by the auth email
  // or create it, and store it in users.customer_id inside asAdmin. Pinning customerId stops Paddle Checkout from
  // switching to another existing customer when a different email is typed.
  const customerId = await ensurePaddleCustomer(me);
  // Paddle Billing API, verified signature for @paddle/paddle-node-sdk 3.8.0
  const tx = await getPaddleInstance().transactions.create({
    items: [{ priceId, quantity: 1 }],
    customerId,
    customData: { user_id: me.userId, sig: signUserId(me.userId) },
  });
  return { transactionId: tx.id };           // client: Paddle.Checkout.open({ transactionId })
}

// lib/paddle/signature.ts
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
export const signUserId = (userId: string) =>
  createHmac("sha256", process.env.PADDLE_CUSTOM_DATA_SECRET!).update(`v1.${userId}`).digest("hex");
export function verifyUserIdSig(userId: unknown, sig: unknown): userId is string {
  if (typeof userId !== "string" || typeof sig !== "string" || userId.length > 64) return false;
  const a = Buffer.from(signUserId(userId)), b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

// lib/paddle/resolve-user.ts (inside asAdmin)
import "server-only";
import { schema } from "@quicktalog/common";
import { and, eq, isNull, sql } from "drizzle-orm";
import type { Tx } from "@/utils/db/admin";
import { verifyUserIdSig } from "@/lib/paddle/signature";

async function signedUserId(tx: Tx, customData: { user_id?: unknown; sig?: unknown } | null): Promise<string | null> {
  if (!verifyUserIdSig(customData?.user_id, customData?.sig)) return null;    // unsigned or forged
  let userId = customData!.user_id as string;
  if (userId.startsWith("user_")) {                                           // signed pre-cutover Clerk id
    const present = await tx.execute<{ ok: boolean }>(sql`select to_regclass('migration.clerk_user_map') is not null as ok`);
    if (present[0]?.ok) {
      const [m] = await tx.execute<{ id: string }>(sql`select supabase_user_id::text as id from migration.clerk_user_map
                                                     where clerk_user_id = ${userId} and status = 'migrated'`);
      if (m) userId = m.id;
    }
  }
  return userId;
}

export type Resolution = { userId: string } | { unresolved: "conflict" | "unlinked" };

export async function resolveUserId(tx: Tx, customData: { user_id?: unknown; sig?: unknown } | null, customerId: string): Promise<Resolution> {
  const u = schema.users;
  const signed = await signedUserId(tx, customData);                          // signature checked BEFORE the linked row is trusted
  const [linked] = await tx.select({ id: u.id }).from(u).where(eq(u.customerId, customerId)).limit(1);
  if (linked) {
    if (signed && signed !== linked.id) return { unresolved: "conflict" };    // 1. a reused customer would credit the wrong user
    return { userId: linked.id };                                             // 2. linked and not contradicted
  }
  if (!signed) return { unresolved: "unlinked" };                             // 4. review queue
  const [row] = await tx.update(u).set({ customerId })                         // 3. link only an unlinked user
    .where(and(eq(u.id, signed), isNull(u.customerId))).returning({ id: u.id });
  return row ? { userId: row.id } : { unresolved: "unlinked" };
}
```

Webhook rules: `plan_id` updates use `where customer_id = event.customerId`; unresolved events (`conflict` or `unlinked`) insert into `private.paddle_unresolved_events` with that reason and return 200; any other error rethrows (500, Paddle retries); side effects (cancels, emails, revalidation) run after commit. Paddle requires a 200 within 5 s (https://developer.paddle.com/webhooks/about/respond-to-webhooks/): keep the `asAdmin` transaction to the idempotency row and the DB changes, run cancels, emails and revalidation with `next/server` `after()`, and alert on p95 > 2 s for `/api/paddle`. Delivery order is not guaranteed; keep the `occurred_at` guard.

### B.12 Architecture test rules (`tests/unit/architecture/db-boundaries.test.ts`)

Built on **resolved** module specifiers (TypeScript compiler API or dependency-cruiser), scanning `actions agent app components context helpers hooks lib utils scripts` plus root files `middleware.ts`, `instrumentation.ts`, `instrumentation-client.ts`, `sentry.*.config.ts`.

| Rule | Allowed in |
|---|---|
| imports of `utils/drizzle` | nowhere (file deleted) |
| imports of `utils/db/pool` | `utils/db/rls.ts`, `utils/db/admin.ts` |
| imports of `utils/db/admin`, `utils/db/private-schema` | `utils/paddle/**`, `app/api/paddle/**`, `app/api/clerk/**`, `lib/paddle/resolve-user.ts`, `lib/paddle/customer.ts`, `lib/users/provision.ts`, `scripts/**`, `tests/**` |
| imports of `utils/supabase/auth-admin` | `actions/account.ts`, `scripts/**`, `tests/**` |
| imports of `utils/supabase/server-forwarded`, `SUPABASE_SECRET_KEY` reads | `app/auth/callback/**`, `app/auth/confirm/**`, `utils/supabase/middleware.ts`, `utils/supabase/auth-admin.ts` |
| `.admin`, `signInWithPassword`, `signUp`, `resetPasswordForEmail`, `signInWithOtp`, `resend` reachable from `utils/supabase/server-forwarded.ts` | nowhere (type-level test): a secret-key client bypasses captcha and exposes `auth.admin` |
| imports of `@clerk/nextjs/server` | `lib/auth/identity.ts`, `lib/users/provision.ts`, `middleware.ts`, `app/api/clerk/**` (until Phase 5) |
| imports of `postgres`, `drizzle-orm/postgres-js` | `utils/db/pool.ts`, `scripts/**`, `tests/**` |
| `set_config(`, `SET ROLE`, `SET SESSION ROLE`, `RESET ROLE`, `RESET ALL` | `utils/db/rls.ts`, `utils/db/admin.ts` |
| `sql.raw(`, `.execute(` with an argument that is not a `sql` tagged template | nowhere in app code |
| supabase-js `.from(` / `.rpc(` / `.schema(` | nowhere |
| `as VerifiedIdentity` | `lib/auth/identity.ts` |
| `"use server"` export with a first parameter named `userId`/`ownerId`/`createdBy` | nowhere |
| a `"use server"` module whose transitive imports include `utils/db/admin` or `utils/supabase/auth-admin` | only `actions/account.ts` and `lib/paddle/checkout.ts` (reviewed; every export derives identity itself) |
| `withUser` statements in `actions/**` without an owner predicate | nowhere (Drizzle `toSQL()` snapshot test) |

### B.13 Confirm interstitial (`app/auth/confirm/route.ts`, `app/auth/confirm/continue/`)

```ts
// route.ts (GET): no session work, token moved out of the URL
const TYPES = new Set(["email", "recovery", "email_change"]);
export async function GET(req: NextRequest) {
  const hash = req.nextUrl.searchParams.get("token_hash");
  const type = req.nextUrl.searchParams.get("type");
  const fail = NextResponse.redirect(new URL("/auth?error=link", req.nextUrl.origin));
  if (!hash || !/^[A-Za-z0-9_-]{16,128}$/.test(hash) || !type || !TYPES.has(type)) return fail;
  const res = NextResponse.redirect(new URL("/auth/confirm/continue", req.nextUrl.origin), 303);
  res.cookies.set("__Host-qt-confirm", JSON.stringify({ h: hash, t: type }),
    { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}

// continue/actions.ts ("use server"): runs only when the user presses "Confirm and continue"
export async function confirmEmailToken() {
  if (!(await checkRateLimit("confirm", await clientIp()))) return { ok: false as const, code: "rate_limited" };
  if (await getVerifiedIdentity()) return { ok: false as const, code: "signed_in" };   // login-CSRF guard: sign out first
  const jar = await cookies();
  const raw = jar.get("__Host-qt-confirm")?.value;
  jar.delete("__Host-qt-confirm");
  if (!raw) return { ok: false as const, code: "expired" };
  const { h, t } = JSON.parse(raw) as { h: string; t: "email" | "recovery" | "email_change" };
  const auth = await createForwardedAuthClient();                                       // narrow facade (B.7)
  const { data, error } = await auth.verifyOtp({ type: t, token_hash: h });
  if (error || !data.user) return { ok: false as const, code: "link" };
  // The page shows data.user.email and asks the user to continue as that account before redirecting.
  return { ok: true as const, email: data.user.email, next: t === "recovery" ? "/auth/update-password" : "/admin/dashboard" };
}
```

---

## Appendix C. Call-site map (all 76 entries of the call-site inventory in `research/data-access.md`)

Legend: **U** `withUser` (`app_user`), **P** `withPublic` (`app_public`), **A** `asAdmin` (`postgres`), **W** worker service key. "0A→1" = logic fix on today's client in 0A/0B, transport to U/P in Phase 1. Every U statement keeps an explicit owner predicate.

| # | Call site (today) | Today | Target | Phase |
|---|---|---|---|---|
| 1 | `actions/catalogue.ts:46` deleteItem pre-read | Drizzle, check-then-act | merged into #2 | 0B→1 |
| 2 | `actions/catalogue.ts:52` deleteItem DELETE | no owner predicate | U `delete ... where name and created_by=me returning id,name`; `deleteDrafts([id])`, revalidate returned name | 0B→1 |
| 3 | `actions/catalogue.ts:69` deleteMultipleItems pre-read | compare in JS | U owned-id count in the same tx (all-or-nothing) | 0B→1 |
| 4 | `actions/catalogue.ts:79` bulk DELETE | no Redis cleanup | U `returning id,name`; drafts deleted; per-name revalidate | 0B→1 |
| 5 | `actions/catalogue.ts:99` updateItemStatus pre-read | by id | U `select status where id and owner` | 0B→1 |
| 6 | `actions/catalogue.ts:105` status UPDATE | unvalidated status, unchecked `name` | U allowlist; `assertCanActivate` + `applyPlanToCatalogue` on activation; `returning name`; status CHECK | 0B→1 |
| 7 | `actions/catalogue.ts:137` duplicate source read | `select *` then compare | U `where id and owner` | 0B→1 |
| 8 | `actions/catalogue.ts:151` duplicate slug loop | cross-tenant `while(true)` | insert in SAVEPOINT, retry 23505 up to 20 | 0B→1 |
| 9 | `actions/catalogue.ts:161` duplicate INSERT | copies status | U quota lock, `pickEditable`, `status:'draft'`; WITH CHECK; pin trigger | 0B→1 |
| 10 | `actions/catalogue.ts:187` create slug check | cross-tenant read | unique index → `name_taken`; UI via `checkCatalogueName` (U definer) | 0A→1 |
| 11 | `actions/catalogue.ts:204` create INSERT | client status/id/branding, no server quota | U plan lock, quota, `applyPlanToCatalogue`, `assertContentWithinPlan`, draft | 0B→1 |
| 12 | `actions/catalogue.ts:246` updateCatalogue owner read (Redis save) | client payload incl. `createdBy` to Redis | U `loadOwnedCatalogue` + plan shaping; `writeOwnedDraft` after commit | 0B→1 |
| 13 | `actions/catalogue.ts:289` getCatalogueByName | no auth, fills Redis | `getOwnedCatalogueForEditor` → `readOwnedDraft` | 0A→1 |
| 14 | `actions/catalogue.ts:328` publish pre-read | separate read | U same tx | 0B→1 |
| 15 | `actions/catalogue.ts:340` publish UPDATE | mass assignment | U `set {...applyPlan(pickEditable(sanitize)), status:'active'} where id and owner returning *`; column grants | 0B→1 |
| 16 | `actions/newsletter.ts:25` dedupe read | oracle | removed (unique index, ON CONFLICT) | 0B→1 |
| 17 | `actions/newsletter.ts:40` signup INSERT | trusts ownerId/catalogueId | rate limit → P `private.subscribe_catalogue_newsletter`; constant response | 0B→1 |
| 18 | `actions/newsletter.ts:64` product dedupe read | oracle | removed | 0B→1 |
| 19 | `actions/newsletter.ts:74` product INSERT | no validation | zod + rate limit → P `private.subscribe_product_newsletter` | 0B→1 |
| 20 | `actions/qr-configs.ts:14` existence read | no auth | removed (single upsert) | 0A→1 |
| 21 | `actions/qr-configs.ts:21` UPDATE | no auth | U `insert ... on conflict (catalogue) do update`; 42501 → "Not found" | 0A→1 |
| 22 | `actions/qr-configs.ts:30` INSERT | no auth, racy | same as #21 | 0A→1 |
| 23 | `actions/qr-configs.ts:54` getQrConfig | action without auth | `lib/qr/configs.ts` inside the page's U block | 0A→1 |
| 24 | `actions/themes.ts:20` listSavedThemes | filter by Clerk id | U | 1 |
| 25 | `actions/themes.ts:48` persistTheme lookup | exported with `userId` | `lib/themes/upsert.ts` `on conflict (user_id,name)` | 0B→1 |
| 26 | `actions/themes.ts:57` persistTheme UPDATE | race | same upsert (U) | 1 |
| 27 | `actions/themes.ts:62` persistTheme INSERT | `user_id` from argument | same upsert; WITH CHECK | 1 |
| 28 | `actions/themes.ts:91` deleteSavedTheme | filter by Clerk id | U `returning id` | 1 |
| 29 | `actions/users.ts:83` handleUserDeletion | anon DELETE | A `deleteClerkUser` (cancel Paddle first); Supabase: `actions/account.ts` → M10 trigger | 0A/0B/2 |
| 30 | `actions/users.ts:29` getUserData(userId?) | IDOR | `getUserData()` → U `getMyUserData` | 0A→1 |
| 31 | `lib/ai/access.ts:40` authorize ownership | `currentUser()` + compare | `begin_ai_turn` ownership (U) | 1 |
| 32 | `lib/ai/access.ts:98` meter | after stream; fails on UNIQUE; forged continuation skip | `begin_ai_turn` before model spend; `set_plan_state`; capped refund | 1 |
| 33 | `lib/users/fetchUserData.ts:42` users row | no auth inside | U `getMyUserData` | 1 |
| 34 | `lib/users/fetchUserData.ts:55` on-demand sync | anon upsert overwriting plan | A `ensureUserRow` (Clerk only, do nothing on conflict); M10 after cutover | 0A |
| 35 | `lib/users/fetchUserData.ts:64` re-read | Drizzle | retry `getMyUserData` once (U) | 0A→1 |
| 36 | `lib/users/fetchUserData.ts:93` catalogue count | parallel queries | U `private.my_usage()` | 1 |
| 37 | `lib/users/fetchUserData.ts:98` traffic | stale month bounds | U `my_usage()` (month in SQL) | 1 |
| 38 | `lib/users/fetchUserData.ts:112` OCR count | - | U `my_usage()` | 1 |
| 39 | `lib/users/fetchUserData.ts:123` prompts count | counts deletable rows | U `my_usage()` excluding refunded | 1 |
| 40 | `lib/users/syncFromClerk.ts:142` upsertUser | anon merge forcing default plan | A `upsertClerkUser` (email, name, image only) | 0A |
| 41 | `lib/users/syncFromClerk.ts:171` updateOrCreateUser | anon; resets cookie prefs | A `upsertClerkUser`; prefs untouched | 0A |
| 42 | `app/api/clerk/route.ts:67` user.created | anon; fire-and-forget email | A + `after(sendWelcomeEmailSafely)` | 0A → delete 5 |
| 43 | `app/api/clerk/route.ts:78` user.updated | anon | A | 0A → delete 5 |
| 44 | `app/api/clerk/route.ts:95` user.deleted | anon, no cleanup | A `deleteClerkUser` after Paddle cancel; drafts + revalidate | 0A/0B → delete 5 |
| 45 | `app/api/dashboard/analytics/route.ts:17` analytics | anon supabase-js | U sums `user_id = me`; 401 | 0A→1 |
| 46 | `app/api/dashboard/analytics/route.ts:22` newsletter count | anon (reason for anon SELECT) | U count `owner_id = me` | 0A→1 |
| 47 | `app/api/dashboard/catalogues/route.ts:18` | null destructure → 500 | U; 401 | 0A→1 |
| 48 | `app/api/dashboard/newsletter/route.ts:18` subscribers | Drizzle | U join `newsletter ⟕ catalogues where owner_id = me` | 1 |
| 49 | `app/api/dashboard/newsletter/route.ts:35` names | no owner filter | merged into #48 with `catalogues.created_by = me` in the join | 1 |
| 50 | `app/api/items/route.ts:13` list | anon `select *`, all statuses | P `listPublicCatalogueNames()` → `[{name}]` | 0A→1 |
| 51 | `app/api/items/[name]/route.ts:13` detail/meta | anon, drafts, 500 on miss | P `getPublicCatalogue`/`Meta`, 404 | 0A→1 |
| 52 | `app/catalogues/[name]/page.tsx:14` generateStaticParams | fetch #50 | unchanged fetch | - |
| 53 | `app/catalogues/[name]/page.tsx:52` generateMetadata | draft titles leak | drafts 404; `logo` included | - |
| 54 | `app/catalogues/[name]/page.tsx:113` page | `created_by` in RSC props | payload without `created_by` | - |
| 55 | `app/sitemap.ts:11` | full rows | `?type=name` | 0A |
| 56 | `hooks/useCatalogueName.ts:91` | downloads every slug | debounced `checkCatalogueName` (U definer, rate limited) | 0A→1 |
| 57 | `app/admin/[name]/builder/page.tsx:13` | ownership from Redis | `requireUser` + `readOwnedDraft` + U `getMyUserData` | 0A→1 |
| 58 | `app/admin/[name]/qr-editor/page.tsx:18` | ownership from Redis | `requireUser` + U owned row + config | 0A→1 |
| 59 | `app/admin/dashboard/[[...rest]]/page.tsx:14` | `getUserData()` | `requireUser` + U | 1 |
| 60 | `components/dashboard/components/DashboardItem.tsx:35` | unauthenticated action id | `getOwnedCatalogueForEditor` → `publishCatalogue` result object | 0A→1 |
| 61 | `app/catalogues/[name]/preview/page.tsx:28` | no auth, Redis | `requireUser` + `readOwnedDraft`; noindex | 0A→1 |
| 62 | `utils/paddle/process-webhook.ts:73` linked lookup | anon | A `resolveUserId` | 0A/0B |
| 63 | `utils/paddle/process-webhook.ts:87` subscriptions upsert | anon; errors swallowed | A upsert with `occurred_at` guard; idempotency row; rethrow | 0A/1 |
| 64 | `utils/paddle/process-webhook.ts:106` active subs (activate) | anon; inline cancel | A select; cancel after commit | 0A |
| 65 | `utils/paddle/process-webhook.ts:136` set plan | anon UPDATE | A `where customer_id = event customer` | 0A/0B |
| 66 | `utils/paddle/process-webhook.ts:151` active subs (cancel) | anon | A | 0A |
| 67 | `utils/paddle/process-webhook.ts:170` user for email | anon | A returned by the downgrade UPDATE | 0A |
| 68 | `utils/paddle/process-webhook.ts:192` downgrade | anon | A + `applyPlanDowngrade`; email after commit | 0A/0B |
| 69 | `utils/paddle/process-webhook.ts:220` link by email | spoofable | removed; signed `customData` | 0B |
| 70 | `agent/tools.ts:433` setCustomTheme | Clerk id in session | `session.saveTheme` port → U `upsertTheme` | 0B→1 |
| 71 | `app/api/agent/route.ts:56` authorize | `currentUser()` + 6 queries | identity before stream; U `startAiTurn`; name match check | 1 |
| 72 | `app/api/agent/route.ts:125` onFinish meter | skipped on forged plan | U `set_plan_state` / capped refund | 1 |
| 73 | `actions/ai.ts:29` writeItemDescription | charge after DeepSeek, fails on UNIQUE | U `startAiTurn(kind 'describe')` first; refund on failure | 1 |
| 74 | `app/api/users/[id]/route.ts:31` | public IDOR for the worker | deleted; worker computes usage (W) | 0A |
| 75 | `tests/e2e/helpers/cleanup.ts:16` | raw postgres via `DB_CONNECTION_STRING` | `DATABASE_ADMIN_URL` + PROD guard; draft keys by id | 0A/1 |
| 76 | `tests/e2e/helpers/cleanup.ts:53` | same | same | 0A/1 |

**Outside the 76:** `app/admin/[name]/analytics/page.tsx:41-57` (owner check U before PostHog, escaped HogQL; 0A→1); `app/api/update-consent/route.ts` (deleted; `saveCookiePreferences` U; 1); `app/api/revalidate/route.ts` (secret POST; 0A); `app/api/pdf/route.ts` (deleted; 0A); `app/api/items/uploadthing/core.ts:6` (real identity + rate limit; 0A); `actions/email.ts:9-36` (zod + rate limit; 0B); `actions/account.ts` (new; 2); worker jobs (W; 0A).

---

## Appendix D. Verification results and how every finding was resolved

### D.1 PGlite run (`verification/pglite-harness`; first run `./run-all.sh`, about 15s; final run `./run-final.sh`, about 40s)

#### Final run: the Appendix A SQL of this plan (2026-09-17)

**Input:** every `sql` block of Appendix A, extracted byte-identical to the plan text (19 of 19 blocks; A.14 also split per migration), once as first written and once with CHANGE W1-W9 applied (those fixes are now in Appendix A). Results and every scenario: `verification/final-sql-results.md`. After the fixes and status comments were written into this document, its Appendix A blocks were extracted again and re-run: 0 of 692 failures on PG17.5 and on PG18.3, 0 statement-mode errors, and only the expected M04-without-M00 apply failure.

**Order (fresh Supabase stub per chain, one transaction per migration as `postgres`, like `supabase db push`):** baseline (4 app migrations + seed) → M00 → M01-M06 → M07 → M08 → M09 → M10 → import emulation (claim first, GoTrue INSERT, then `app_metadata` UPDATE, then confirm, one Google identity) → A.R1 as a psql script → M11 → V-queries → cutover window with activity (Supabase-only paying sign-up, unconfirmed sign-up, imported user deleting the account, email change) → A.R2 → re-cutover A.R1 → M12 → M13 → A.14 in reverse (three variants) → A.15/A.16 read-only in four states.

**Stub additions over the first run,** calibrated with read-only SELECTs on TEST: `auth.identities` columns and owner, the `vault.secrets` ACL, `supabase_migrations.schema_migrations`.

| Run | Scenarios | Failed | Statement-mode SQL errors (M00-M10) | Apply failures |
|---|---|---|---|---|
| as first written, PG17.5 | 692 | 15 | 0 | 1 (expected: M04 without M00 must fail) |
| as first written, PG18.3 | 692 | 15 (identical set) | 0 | 1 (expected) |
| with W1-W9 (this plan), PG17.5 | 692 | **0** | 0 | 1 (expected) |
| with W1-W9 (this plan), PG18.3 | 692 | **0** | 0 | 1 (expected) |

| Group | Scenarios | As first written, failures (PG17 / PG18) | This plan, failures (PG17 / PG18) |
|---|---|---|---|
| A gate 0A: baseline + M00 | 12 | 0 / 0 | 0 / 0 |
| B gate 1: M01-M06 (Clerk ids) | 7 | 0 / 0 | 0 / 0 |
| B1 migration mechanics (M01-M06) | 14 | 0 / 0 | 0 / 0 |
| B2 owner matrix (Clerk ids, `postgres` login, B.3 wrapper) | 124 | 0 / 0 | 0 / 0 |
| B3 usage and AI ledger incl. M06 plan binding (C7, C8) | 31 | 0 / 0 | 0 / 0 |
| B4 admin, worker and PostgREST perimeter (M01-M06) | 20 | 0 / 0 | 0 / 0 |
| B5 wrapper semantics: injection, leakage, temp-table shadowing | 17 | 0 / 0 | 0 / 0 |
| B6 app layer: real `drizzle-orm` SQL with the wrapper (Clerk ids, `postgres` login) | 28 | 0 / 0 | 0 / 0 |
| B7 misc SQL semantics | 4 | 0 / 0 | 0 / 0 |
| C gate 1: M07 validate after audit | 6 | 1 / 1 | 0 / 0 |
| D gate 1 end: M08 `app_rls` | 9 | 0 / 0 | 0 / 0 |
| D2 owner matrix and Drizzle app layer under the `app_rls` login | 152 | 0 / 0 | 0 / 0 |
| E Track K: M09 (apply + edge webhook secret) | 12 | 2 / 2 | 0 / 0 |
| F gate 2: M10 (apply + auth sync) | 26 | 1 / 1 | 0 / 0 |
| G1 import emulation (M00-M10 applied) | 4 | 2 / 2 | 0 / 0 |
| G2 A.R1 preconditions (each on a copy of the post-import state) | 7 | 0 / 0 | 0 / 0 |
| G3 A.R1 re-key, M11, V-queries, post-cutover isolation | 159 | 0 / 0 | 0 / 0 |
| G4 cutover window, A.R2, re-cutover | 5 | 1 / 1 | 0 / 0 |
| G5 M12 and M13 | 5 | 1 / 1 | 0 / 0 |
| H A.14 rollback SQL in reverse | 38 | 3 / 3 | 0 / 0 |
| I read-only scripts A.15 / A.16 | 12 | 4 / 4 | 0 / 0 |
| **Total** | **692** | **15 / 15** | **0 / 0** |

**Claims confirmed by the final run (in addition to the first run below):** M00 on today's grants turns RLS on for all 12 tables with no policies and denies 177 of 177 PostgREST requests (anon, authenticated with a uuid sub and with a Clerk sub; 42501, 55000 on views, 42883 for the dropped RPC), fails loudly for a PUBLIC-executable function or a `supabase_admin`-created table in `public`, and is idempotent; Phase 0A paths (Drizzle as `postgres`, worker as `service_role`) keep working after M00; M01-M04 without M00 stop at the M04 assertion; M02 seeds the base URL from a base64url JWT and gives no URL for an `sb_secret_` key; C3 forged-owner rows are backed up and deleted before the dedupe; C6 rejects formula, DDE and quote payloads silently; C7 locks the users row `FOR NO KEY UPDATE` (tuple lock bits via pageinspect); C8 charges every continuation that is not proven (hash, turn id, catalogue, kind, age, budget) and enforces the refund cap; M07 fails as one transaction on legacy bad rows; M08 fails closed (forgotten wrapper 42501, `RESET ROLE` lands on a role with no privileges, `SET ROLE postgres` 42501); M09 sends `x-webhook-secret` and no `Authorization` once the secret exists; M10 sends no Brevo call for the legacy consent marker, skips pre-claimed imports and anonymous users, keeps consents non-null; all 7 A.R1 precondition aborts roll back fully; A.R1 keeps per-user plan, customer and owned counts, does not touch `updated_at` and sends no webhooks; after A.R1 a stale Clerk id insert gives 23514 and an old Clerk sub sees nothing; A.R2 then A.R1 round-trips exactly; M12 fails before orphan triage and validates after; M13 drops backups and scratch tables and minimises the map; A.14 steps other than M01 (as first written) restore the previous catalog state; A.15 and A.16 run read-only in all four states.

**Text that is not runnable Postgres SQL (emulated or run separately):** `\set ON_ERROR_STOP on` in A.R1/A.R2 (psql meta-command); the prose and commented parts of A.14; the commented Phase 3/4 queries of A.15 (run uncommented after the import, passed); A.16 E6 (ClickHouse log SQL). `verify.sql` (V1-V12) is not in Appendix A; V1-V10 were rebuilt from section 6.7 (V8, V11, V12 approximated or out of scope; V12 needs the CSV).

**Limits of the final run:** single connection, so lock blocking, `statement_timeout` cancellation and Supavisor backend reuse cannot be observed; GoTrue, PostgREST and pg_cron are emulated with role switches; no supautils.

#### First run: the design drafts (`verification/pglite-results.md`)

**Fidelity:** PGlite 0.3.16 = PostgreSQL 17.5 and PGlite 0.5.8 = PostgreSQL 18.3. Supabase stub calibrated from TEST catalogs: `postgres` non-superuser with BYPASSRLS and CREATEROLE, `authenticator` memberships, `supabase_auth_admin` owning `auth.users`, `auth.uid()/jwt()` bodies, database ACL with PUBLIC TEMP, pg_net ACLs, Vault and pg_cron stubs, the 4 app migrations. Drizzle SQL generated by `drizzle-orm` 0.45.2 from `@quicktalog/common` 1.54.0 inside the real `set_config` wrapper. GoTrue `admin.createUser` emulated as INSERT then UPDATE of `raw_app_meta_data` (supabase/auth `internal/api/admin.go`).

| Group | Scenarios | Drafts as written (failures) | Patched (failures) |
|---|---|---|---|
| G0 apply 01-10 + runbook, statement by statement and per migration | 22 | 2 | 0 |
| G1 Phase 1/2 window, role reachability | 10 | 4 | 0 |
| G2 owner isolation, column grants, WITH CHECK, app_public | 141 | 0 | 0 |
| G3 definers (newsletter, slug, usage) | 25 | 0 | 0 |
| G4 temp tables and pg_net | 19 | 4 | 4 (not fixable by a migration) |
| G5 ownership of private objects | 11 | 1 | 0 |
| G6 remap and 09 | 15 | 1 | 0 |
| G7 auth triggers incl. GoTrue import order | 129 | 7 | 0 |
| G8 real Drizzle SQL per call site (Clerk ids, uuid ids, `app_rls` login) | 96 | 0 | 0 |
| G9 misc (InitPlan, trigger DROP ownership, size CHECK) | 7 | 0 | 0 |
| **Total** | **475** | **19** | **4** |

**Claims confirmed by execution:** table-level INSERT + pin trigger works with Drizzle's all-column insert; column grants turn mass assignment into 42501; WITH CHECK blocks `status='active'` and foreign `created_by`; `app_public` cannot read `created_by` (`select *` → 42501); one InitPlan per statement; ON CONFLICT DO UPDATE onto another owner's QR row raises 42501; `SELECT ... FOR UPDATE` allowed with UPDATE(name, cookie_preferences); SAVEPOINT retries keep role and claims; no leakage after COMMIT, error or autocommit misuse; `SET ROLE` ignores `ALTER ROLE ... SET`; claims injection through bound parameters is harmless; no Supabase service role can `SET ROLE app_user`; PostgREST perimeter 168/168 denied; `app_rls` fails closed; newsletter definer derives owner and is silent on bad input; AI ledger matrix; remap cascades 6 FKs without bumping `updated_at`; M02 per-project URL seeding; trigger functions in `private` fire for `supabase_auth_admin` without extra grants; `postgres` can CREATE but not DROP triggers on `auth.users` in PGlite (which has no supautils; on hosted Supabase `supautils.drop_trigger_grants` lets `postgres` drop them, TEST).

**Limitations (covered elsewhere in this plan):** `statement_timeout` not enforced by PGlite; single connection (no real concurrency, no Supavisor backend reuse); no supautils; PostgREST/GoTrue/Supavisor emulated by role switches; pgTAP not installed (equivalent SQL assertions used); stale common schema; PROD never queried.

### D.2 Patches from the first PGlite run and how this plan adopts them

| Patch | Problem found | Adopted as |
|---|---|---|
| P1 | RLS enabled only in 06 while `withUser` code ran: A read and deleted B's catalogues, renamed B, read B's subscribers | **Superseded by ordering:** M00 enables RLS on all 12 tables with zero anon grants before M04 creates policies; M04 asserts it. No temporary allow-all anon policies are ever created (so the critic's "latent allow-all policy" conflict cannot occur). |
| P2 | 01 GRANT fallback failed with a bare 42501 without ADMIN OPTION | M01 verbatim |
| P3 | objects owned by a superuser applier blocked `asAdmin` writes | M01, M03 verbatim |
| P4 | `app_rls` login `search_path` let temp tables shadow tables | M08 verbatim; plus the wrapper `set_config('search_path', 'public, pg_temp', true)` (verified) |
| P5 | GoTrue writes `app_metadata` after INSERT, so imported users got default rows and the remap aborted | M10 map-based skip; import script claims the uuid first; pgTAP 50 reproduces INSERT-then-UPDATE; integration test with real GoTrue |

### D.3 Changes made after the first PGlite run (all executed in the final run)

| Change | Where | Scenario | Final run (PG17.5 / PG18.3) |
|---|---|---|---|
| C1 | M00: perimeter first, default-privilege revokes, assertions | apply M00 on the stub with today's grants: all assertions pass; anon/authenticated denied on every table; app (`postgres`) and worker unaffected; a PUBLIC-executable function in `public` makes M00 fail with the message | PGlite-verified (final run): pass / pass |
| C2 | M03 header / A.15: `octet_length` audit | none (comments and read-only query); A.15 runs read-only in four states | PGlite-verified (final run): pass / pass; M03 header wording corrected by W8 |
| C3 | M03: forged newsletter owner cleanup with backup | seed a forged row: backed up and deleted; legitimate rows kept | PGlite-verified (final run): pass / pass |
| C4 | M03: `private.paddle_unresolved_events` | `asAdmin` insert works; app roles and `service_role` denied | PGlite-verified (final run): pass / pass |
| C5 | M04: perimeter assertion | M04 before M00 raises; after M00 passes | PGlite-verified (final run): pass / pass |
| C6 | M05: stricter email pattern | `=HYPERLINK("x")@a.io`, DDE pipe, quotes rejected silently; normal addresses accepted (a leading `+` is accepted, so CSV export escaping must handle it) | PGlite-verified (final run): pass / pass |
| C7 | M05/M06: `FOR NO KEY UPDATE` | tuple lock bits show a lock-only row lock without `HEAP_KEYS_UPDATED`; the multi-connection race stays an integration test | PGlite-verified (final run): pass / pass (race: integration test on the local stack) |
| C8 | M06: plan binding, `set_plan_state`, refund cap | continuation without turn id/hash charged; wrong hash charged; budget exhaustion charged; closed plan charged; `set_plan_state` cannot raise the budget; refund cap; describe turns never continue | PGlite-verified (final run): pass / pass |
| C9 | M07: slug and row-size checks | bad slug 23514; oversized appearance 23514; validation on clean data; legacy bad row makes M07 roll back | PGlite-verified (final run): pass / pass |
| C10 | M09: webhook secret header | with secret: header only, no `Authorization`; without: legacy bearer; cron job command | PGlite-verified (final run): pass / pass, after W7 |
| C11 | M10: reconciled auth sync | consents with/without `terms_version` (never null); Google-only avatar; no name sync; email sync; avatar fill-if-null; deletion log; `claim_welcome_email` once; `record_consents` stale version 22023; `current_terms_version` for `app_public`; legacy marker update sends no Brevo webhook | PGlite-verified (final run): pass / pass, after W1 and W2 |
| C12 | R1: ACCESS EXCLUSIVE first, NOT VALID check before UPDATE, avatar rule, paying-unmapped precondition | precondition raises with an unmapped `customer_id`; re-key and assertions pass; legacy orphan row cannot be updated afterwards; R2 restores ids and a second R1 maps `rollback_push` users back | PGlite-verified (final run): pass / pass, after W9 (and W2 for re-cutover after a deletion) |

**Fixes from the final run (CHANGE W1-W9, all in Appendix A; each failed identically on PG17.5 and PG18.3 as first written and passes on both with the fix):**

| Change | Severity | Where | Defect as first written (evidence) | Fix |
|---|---|---|---|---|
| W3 | High | A.13 M13 | M13 dropped `migration.auth_user_deletions` while the M10 delete trigger still inserts into it: after M13 every account deletion failed with 42P01 ("Database error deleting user") and the `public.users` row stayed | M13 replaces `private.handle_auth_user_deleted()` first (map status update + row delete, no log insert); `CREATE OR REPLACE` keeps owner and ACL |
| W2 | Medium | A.10 M10 10.7 | an imported user deleting the account between A.R1 and A.R2 left the map row `migrated`; the re-cutover A.R1 aborted with "map rows marked migrated without an auth.users row" (the 5.6 drill hits this) | the delete trigger sets the map row to `deleted` |
| W1 | Medium | A.10 M10 10.5, 10.6, 10.9, 10.10; A.14 M10; 6.7 V3 | every email sign-up got a `public.users` row and a Brevo webhook at INSERT, so anyone could push a third party's unconfirmed address into the CRM and Brevo | new definer `private.create_user_row(...)`; the INSERT trigger skips unconfirmed email sign-ups; the UPDATE trigger creates the row when `email_confirmed_at` goes from null to set (trigger column list adds `email_confirmed_at`); V3 counts only confirmed users. Verified: exactly one Brevo call after confirmation; OAuth confirmed at INSERT or later; pre-claimed imports still get no row; the import-script guard still finds `clerk_user_map` in the function definition |
| W4 | Medium | A.14 M01 | `drop schema if exists private` failed with 2BP01 in all three rollback variants: M03 objects in `private` were never dropped, and after M10 the `auth.users` triggers depend on `private` functions | M01 documented as not reversible once M10 is applied; before M10 the M03 tables in `private` are dropped first (verified: roles and schema gone) |
| W9 | Low | A.R1, A.R2 | the precondition DO block ran before `lock table public.users in access exclusive mode`, so the transaction already held ACCESS SHARE (checked in `pg_locks`) and the lock was an upgrade; checked rows could change before the lock | both locks moved before the precondition block; all 7 precondition aborts still raise and roll back |
| W5 | Low | A.15 | the trigger inventory filtered on `regclass::text like 'public.%'`, but regclass omits the schema for tables on the search_path: always 0 rows | filter by `pg_namespace` and add `tgenabled` |
| W6 | Low | A.2 M02 | `edge_functions_base_url` accepted a trailing slash, an `http` or foreign host, a query suffix or a leading space | CHECK constraint on `private.settings` for that key (Supabase URL or local stack URL only) |
| W7 | Low | A.9 M09 | the Sync Plans job posted with `"Authorization": null` when Vault held neither credential | the job's WHERE requires a credential. The M02 job keeps the same gap until M09 is applied (M02 was not changed) |
| W8 | Low | A.3 M03 header comment | the comment said NOT VALID checks apply only to UPDATEs that rewrite the column; PostgreSQL checks the whole new row on every UPDATE (`update ... set name = name` on a legacy oversized row gave 23514) | comment corrected; no SQL change |

### D.4 Finding resolution (verification, RLS red team, runbook red team, completeness review)

Source labels: **verification** and **F1-F10** = the first PGlite run (`verification/pglite-results.md`); **red team** = the RLS red team (`verification/redteam-rls.md`); **runbook** = the cutover runbook red team (`verification/redteam-runbook.md`); **critic** = the completeness review (`verification/completeness-review.md`); **final run** = `verification/final-sql-results.md` (rows W1-W9 are in D.3); **repo check** and **external check** = the 2026-09-17 fact-checks (rows at the end of this table). Names such as `M2`, `M4`, "06" or "the two M4 contracts" refer to the decision record and the earlier drafts described in D.5.

| Finding (severity) | Resolution | Where |
|---|---|---|
| **Imported-user skip never matches (High, verification F1 and red team)** | Map-based skip; claim before `createUser`; map created in M10; pgTAP and real-GoTrue test | M10, 6.3, 11.1 |
| **RLS inert while `withUser` code runs (High, F2 and red team)** | M00 before M04, assertion in M04, explicit owner predicates required by a test | 5.1, 5.4, A.0, A.4, B.12 |
| **Closing anon DML gated on the whole refactor (High, red team)** | Phase 0A with M00 independent of M01; precondition is "no supabase-js data path deployed" | 5.1 |
| **Early M2 not executable with 06 / conflicts with P1 (High, critic)** | 06 split: perimeter in M00 (no dependency on `private` or M03), validation in M07; P1 not needed | A.0, A.7, D.2 |
| **Verified fixes not propagated (High, critic)** | Appendix A is built from the patched file; wrapper `search_path`; pgTAP 50 fixture; `octet_length` audit; harness ported into the repo | App. A, B.3, 4.5, 5.4 |
| **No PROD audit for past exploitation (High, critic)** | Exposure audit before and after M00, logs query, remediation script, legal decision | 5.1 steps 1, 9, 10; A.16; input 13 |
| **Two incompatible runbooks and M4 contracts (High, critic and runbook red team)** | One runbook (section 12), one M10, one map schema; reconciliation in D.5 | 12, A.10, D.5 |
| **Worker cleanup route + UploadThing token (High, critic)** | Route auth and dry-run default before repointing; input 5 | 5.1 step 5, 10.1 |
| **Import script can delete data after re-key (Critical, runbook)** | Post-cutover mode, `--allow-delete`, `totalCount` check, deletion threshold, tests | 6.3 |
| **Delta import never refreshes digests (High, runbook)** | Digest compare and in-place update; sync email/verification/bans; Clerk freeze at T-3; V12 gate | 6.3, 5.6, 6.7 |
| **Browser-set `customData` (High/Low, runbook and red team)** | Server-created transaction with HMAC; link only unlinked users; plan changes by `customer_id`; review queue; map lookup only for signed Clerk ids | 5.2, 10.5, B.11 |
| **Legacy keys end before T+30 (High, runbook)** | Track K starts in 0B with a recorded deadline | 5.3 |
| pg_net PUBLIC and TEMP (Medium, F3/F4, critic) | Wrapper `search_path` (verified), M08 P4, M09 webhook secret, earlier `app_rls`; residual risk R3 | B.3, A.8, A.9, 13 |
| SQL-injection containment gaps (Medium, red team) | M08 at the end of Phase 1; architecture rules for string `execute`, `SET SESSION ROLE`, `RESET`; residual claims rewrite documented | B.12, 13 R3 |
| Forged continuations (Medium, red team) | M06 plan binding (turn id + hash + budget) | A.6, B.10, 4.8 |
| Redis overlay keyed by slug (Medium, red team) | Drafts keyed by catalogue id | B.9, 10.3 |
| Brevo amplification via name changes (Medium, red team) | No name sync from `user_metadata`; `updateProfile` rate limit | A.10, 5.5 |
| Worker unauthenticated routes (Medium, red team) | Phase 0A | 5.1 |
| GoTrue per-IP limits from shared Vercel egress (Medium, runbook; its premise that the limits are not customizable was corrected by the external check) | Forwarded-IP auth client built in Phase 2; raising limits is at most an extra lever; TEST forwarding test with distinct and repeated forwarded IPs | 7.2, 5.5, B.7 |
| Re-key lock upgrade deadlock (Medium, runbook) | ACCESS EXCLUSIVE before the precondition reads (W9, final run); Paddle 503; terminate idle sessions; retry once | A.R1, 12.2 |
| Rollback pushes unconfirmed users / revives deleted ones (Medium, runbook) | Confirmed-only push; `migration.auth_user_deletions` → delete in Clerk | 12.5, A.10 |
| Re-cutover after rollback blocked (Medium, runbook) | Pushed users written into the main map (`origin rollback_push`); deleted accounts marked `deleted` in the map (W2, final run); TEST drill exercises it | 12.5, 5.6, A.10 |
| Hobby rollback mechanics (Medium, runbook) | Global Config (formerly Edge Config) maintenance switch; tagged-commit redeploys; deploy freeze; no boot-time throw | 5.5, 12 |
| Monitoring depends on manual log reading (Medium, runbook) | Sentry alert rules, SQL loop, canaries, deterministic triggers | 12.4 |
| M2 on PROD before edge functions and history inspected; default privileges (Medium, runbook) | 0A steps 1, 3, 9; default-privilege revokes in M00; advisor gate corrected | 5.1, A.0, 4.6 |
| Maintenance fails open; sign-ups before smoke; lost edits (Medium, runbook) | Fail-closed bypass; sign-ups after go/no-go #3; localStorage save on 503; error not ignored in cutover week | B.6, 12.2, 7.7, 9.2 |
| Open redirect in browser `next` (Medium, runbook) | Isomorphic `safeNext` with origin comparison and control-character rejection | B.5 |
| MFA downgrade (Medium, runbook) | No password import for MFA users unless TOTP built; comms wording | 6.3, 6.5, input 7 |
| TEST always-pass captcha and shared Resend quota; link tracking (Medium, runbook) | Real TEST widget; e2e via `generateLink` + `verifyOtp`; separate keys/accounts; tracking off | 8, 5.5 |
| NOT VALID uuid CHECK makes legacy rows un-updatable (Medium, runbook) | Go/no-go: no unmapped user with `customer_id` (R1 precondition); V5/V7 scoped to mapped users | A.R1, 6.7, 12.6 |
| Consent gate cannot read `private.settings` (Medium, critic) | `private.current_terms_version()` definer for app roles; no env var | A.10, 5.5 |
| Map retention contradiction (Medium, critic) | Map kept minimised; M13 drops only backups/scratch | 6.2, A.13 |
| Paddle linking designs disagree; `customData` unverified (Medium, critic) | One design; `customData` copying to subscriptions is documented (external check); sandbox gate in 0B; `transaction.completed` fallback; review queue | 5.2, 10.5 |
| Middleware designs contradict (Medium, critic) | `NEEDS_SESSION` gating, maintenance branch, present-only Clerk cookie expiry | B.8, 7.4 |
| Env/config contradictions incl. preview glob (Medium, critic) | One env matrix; no vercel.app glob; one provider mechanism; normalised paths | 2.5, 7.6, D.5 |
| Phase numbering conflicts (Medium, critic) | One phase list with gates and a crosswalk | 5.0 |
| Rollback steps that cannot run (Medium, critic) | M10 rollback drops the triggers where supautils allows it, else no-op function bodies; one reverse script (PGlite-verified in the final run, M01 fixed by W4); PITR/dump before M00/M01 and re-key; Phase 1 abort thresholds | A.14, A.R2, 5.1, 5.4 |
| Unverified claims stated as fact (Medium, critic) | Corrected (ADMIN OPTION, size CHECK semantics, supautils argument dropped); rate-limit numbers verified by the external check | 1.4, 4.4, 7.2 |
| Test coverage gaps (Medium, critic) | Migration-order test, PGlite in CI, temp/pg_net tests, load smoke, agent e2e, Clerk e2e leg until R2 | 11 |
| Entitlements only on writes; downgrade keeps features (Low, red team) | `applyPlanDowngrade` in the Paddle handler; re-activation applies plan | 2.8, 5.2 |
| Size ceilings on 4 columns only; VALIDATE bundled with perimeter (Low, red team) | Row cap and validation in M07 | A.7 |
| No slug CHECK (Low, red team) | M07 | A.7 |
| CSV formula payloads; legacy forged subscribers (Low, red team) | Stricter pattern (C6), export escaping, cleanup (C3) | A.5, A.3, 5.2 |
| Perimeter checked only in CI; supautils overstated (Low, red team) | Daily hosted perimeter check; supautils argument removed | 11.1, 4.6 |
| Import guardrails alias-only (Low, red team) | Resolved-import graph, root files, `"use server"` transitive rule | B.12 |
| Refund-on-no-op unlimited (Low, red team) | Monthly refund cap | A.6 |
| FOR UPDATE blocks FK key-share locks (Low, red team) | `FOR NO KEY UPDATE` | A.5, A.6 |
| Email sync without confirmation; default consents (Low, red team) | Go/no-go settings; not-accepted default | 8, A.10 |
| Login CSRF via confirm (Low, runbook) | Refuse when signed in; show account email; rate limit | B.13 |
| Clerk cookie expiry scope (Low, runbook) | Present-only, session paths, per-environment domain handling | 7.7, B.8 |
| Avatar copies Clerk proxy URL (Low, runbook) | Google-only regex at import, R1 and M10; fill-if-null on Google sign-in | 6.3, A.R1, A.10 |
| Unconfirmed-email accounts owning data (Low, runbook) | Skipped and contacted | 6.3, 6.5 |
| Clerk DNS removed after instance deletion (Low, runbook) | DNS first | 5.8 |
| Clerk-mode CI removed too early (Low, runbook) | Clerk e2e leg until R2 closes | 5.6, 11.1 |
| Legacy all-true consents exported as real (Low, runbook) | `source: legacy_default` marker; legal input | A.10, input 14 |
| Phase-1 open questions not recorded (Low, critic) | ai_credits note (4.8); inputs 29-33 | 4.8, 14 |
| Clerk-period deletion leaves Paddle billing (Low, critic) | Cancel before delete in the Clerk webhook | 5.2 |
| Framing correction only in the decision (Low, critic) | Sections 0 and 3 | 0, 3 |
| Size CHECK passes VALIDATE on compressed legacy rows (Low, F8) | `octet_length` audit gate before M03 | A.3, A.15 |
| Newsletter 23505 in today's action after 03 (Low, F9) | Ship the Phase 1 newsletter action with M03 | 4.2 |
| pgTAP needs EXECUTE on `extensions` (Low, F10) | Mandatory in every pgTAP file | 4.5 |
| Final-run defects W1-W9 (High to Low, final run) | Fixed in Appendix A and re-run: 0 of 692 failures on PG17.5 and PG18.3 | D.3, App. A |
| Maintenance switch reads `EDGE_CONFIG` via `@vercel/edge-config`, but Vercel renamed the product to Global Config and new stores set `GLOBAL_CONFIG`; Hobby has one store per account (High, external check) | `@vercel/global-config`, per-environment keys, 15 s wait after writes | 2.5, 5.5, B.6, 12 |
| Forwarded auth client with the secret key skips captcha and exposes `auth.admin` (Medium, external check) | Narrow facade; architecture rule | B.7, B.12, 7.6 |
| `postgres` can drop triggers on `auth.users` through supautils on hosted Supabase (Medium, external check) | Rollback drops triggers after checking the setting, else neutralises functions; verified on the local stack and TEST, not PGlite | 1.4, 5.5, A.10, A.14 |
| Turnstile test keys rejected by real secret keys (Medium, external check) | Real TEST widget against TEST; test key only on the local stack | 2.5, 11.1 |
| Paddle 5 s response deadline and sandbox's 3 retries in 15 minutes (Medium, external check) | Short webhook transaction, `after()` side effects, replay failed sandbox notifications | 10.5, B.11, 12.4 |
| Paddle Checkout reuses an existing customer by email, so a linked `customer_id` can credit the wrong user (Medium, external check) | Customer pinned at checkout; signature checked before the linked row is trusted; `conflict` queue | 5.2, 10.5, B.11 |
| `passwordLastUpdatedAt` does not exist on `@clerk/backend` 2.33.3 `User` (Medium, external check) | `user.raw.password_last_updated_at`; abort if `raw` is missing; unit test | 6.1, 6.3 |
| Forwarding load test cannot pass from one IP (Medium, external check) | Distinct vs repeated `Sb-Forwarded-For` values, plus a preview test from two networks | 5.5 |
| Local `supabase/config.toml` differs from the section 8 Local column (Medium, repo check) | Full list of edits in Phase 1 step 1; note under section 8 | 5.4, 8 |
| Line-range and file corrections (Low, repo check): `app/admin/layout.tsx` is new; S24 cron location; `Overview.tsx`, `ActionButtons.tsx`, worker `src/index.ts` ranges; worker `supabase.ts` HEAD vs working tree; `run-all.sh` entry point; test mock locations; Paddle webhook early returns | Corrected in place | 1.1, 1.6, 5.1-5.5, 9.1, 9.2, 10.1, 11.2 |

### D.5 Contradictions between the earlier drafts and the decision taken here

The earlier documents named below are: the **decision record** (`decision/architecture-decision.md`; its migration `M2 close_data_api` removed the anon/authenticated grants), and three earlier drafts (not included; superseded by this plan): the **SQL draft** (migration files `01`-`10` plus a runbook; file `06` enabled RLS and closed the grants; **patched SQL** = that draft after the first-run patches P1-P5), the **identity draft** (identity cutover; its migration `M4` created the `auth.users` sync triggers) and the **app-changes draft** (app code phases `P0`-`P5`). The right-hand column is what this plan does and is self-contained.

| Topic | Draft positions | This plan |
|---|---|---|
| When the anon grants close | decision record: M2 after all app code; identity and app-changes drafts: apply the grant-closing SQL (file 06) early | M00 in Phase 0A, independent of M01 |
| Legacy anon policies (P1) | patched SQL: create temporary allow-all anon policies in file 04, drop them in file 06 | not created; ordering makes them unnecessary |
| Map columns | SQL draft: 7 columns; identity draft: 17 columns | identity draft set + `origin`, `owns_data` |
| Map statuses | `pending/migrated/failed/skipped` vs `claimed/migrated/conflict/skipped/error/deleted` | `claimed/migrated/conflict/skipped/error/deleted` |
| Rollback id storage | separate `migration.rollback_clerk_ids` | main map with `origin='rollback_push'` |
| Auth trigger names | `on_auth_user_updated` vs `on_auth_user_email_changed` | `on_auth_user_created`, `on_auth_user_updated`, `on_auth_user_deleted` |
| `DROP TRIGGER IF EXISTS` on `auth.users` | identity draft M4 used it | not in M10 (PGlite, which has no supautils, gives 42501 once the triggers exist). Hosted Supabase allows it for `postgres` through `supautils.drop_trigger_grants` (TEST), so the M10 rollback may drop the triggers after checking that setting (A.14); verified on the local stack and TEST only |
| Consent contract | SQL draft: booleans from metadata, all-true default; identity draft: `terms_version`, gate, not-accepted default; app-changes draft: env var | `terms_version` in DB only, gate, not-accepted default, `coalesce(..., false)`, legacy marker; rows only for confirmed email addresses (W1) |
| Welcome email | first-sign-in heuristic vs `claim_welcome_email()` | `claim_welcome_email()` |
| Avatar source | any `https` metadata URL, `user_metadata.avatar_url` at import, or Google-only | Google-only everywhere; never in `user_metadata` at import |
| Name sync from metadata | SQL draft: yes (guarded); identity draft: no | no |
| Unverified primary emails | skip vs import unconfirmed | import unconfirmed only if the user owns nothing |
| Redis flush at cutover | decision record: flush; identity draft: no flush; app-changes draft: flush on hits | no flush; keys by catalogue id |
| Draft cache key | slug | catalogue id |
| Provider flag | runtime env vs build-time mirror vs two vars + boot throw | build-time single source via `next.config.ts` `env`; maintenance is the runtime switch |
| Maintenance | env + redeploy; bypass fails open | Global Config (formerly Edge Config); fail-closed bypass; Paddle 503 |
| Middleware | refresh on every matched path vs session paths only | session paths only |
| Confirm route | direct `verifyOtp` vs interstitial | interstitial with login-CSRF guard; types `email`, `recovery`, `email_change` |
| Server-side GoTrue calls | contingency vs default | forwarded-IP client by default |
| Preview redirect allow-list | `*-<team>.vercel.app` glob vs exact aliases | exact aliases, TEST only |
| `sendDefaultPii` | off vs pending legal | off (input 12 may re-enable on the client) |
| Turnstile on TEST | always-pass vs optional | real widget; e2e avoids captcha through admin links |
| Legacy key migration | T+30 | Track K from Phase 0B |
| Uuid CHECK | validated at cutover vs NOT VALID | NOT VALID in R1, validated at T+30 (M12) |
| Re-key lock | SHARE ROW EXCLUSIVE, ADD CONSTRAINT later | ACCESS EXCLUSIVE on `users` first, before the precondition reads (W9), CHECK before UPDATE |
| Paddle resolution | customData only / email fallback / map for Clerk ids | signed customData checked first; customer pinned at checkout; no email linking; map only for signed Clerk ids |
| Module/script paths | `utils/supabase/cookie-options.ts` vs `lib/auth/cookie-options.ts`; `scrub.ts` vs `sentry-scrub.ts`; `scripts/` vs `scripts/cutover/`; `rollback-remap.sql` vs `unmap-user-ids.sql` | `lib/auth/cookie-options.ts`, `lib/observability/sentry-scrub.ts`, `scripts/cutover/*`, `rollback-remap.sql` |
| Phase numbering | decision record 0-7, identity draft 0-5, app-changes draft P0-P5, SQL draft file headers | 0A, 0B, K, 1-5 with gates (5.0) |
