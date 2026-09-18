> First PGlite run, against the design drafts (2026-09-16). The final run against the plan's own SQL is `final-sql-results.md`.

# PGlite verification of the RLS migrations (decision B, draft `rls.sql`)

**Harness:** `pglite-harness (first run) ` (`./run-all.sh`, about 15 s, no network, no Supabase access).

**Engines:**
- PGlite 0.3.16 = PostgreSQL **17.5** (TEST runs 17.6)
- PGlite 0.5.8 = PostgreSQL **18.3** (forward check)

**Result files:**
- `results-{original,patched}-{17,18}.json` (every scenario with expected and actual)
- `results-decision-17.json`
- `results-identity-m4-17.json`

## 1. Bottom line

- **No syntax or semantic SQL error in `rls.sql`.**
  - Every section (01-10 plus the RUNBOOK) applies statement by statement and as one transaction per migration, as `postgres`, on PG17 and PG18.
- **The core RLS model works as designed.**
  - 475 scenarios ran exactly as the app would issue them. That includes the real `drizzle-orm` 0.45.2 SQL from `@quicktalog/common` 1.54.0 for every P1 call site in `app-changes.md` §2.3-2.6, executed inside the decision §5.3 `set_config` wrapper.
  - Owner isolation, column grants, WITH CHECK, `app_public` column withholding, definer entry points, AI ledger, perimeter (anon, `authenticated` with uuid and Clerk subs), `app_rls` fail-closed, and remap plus 09 all behave as specified. Results are identical for Clerk text ids and post-cutover uuid ids.
- **Seven defects found. Five are fixed in `pglite-harness/rls.patched.sql` (PATCH P1-P5) and re-verified.**

| Run | PG17 failures | PG18 failures |
|---|---|---|
| `rls.sql` as written | **19 / 475** | 19 / 475 |
| `rls.patched.sql` | **4 / 475** | 4 / 475 |

- **The 4 remaining failures cannot be fixed by a migration running as `postgres`:**
  - temp-table shadowing on the postgres-login pool needs a TS wrapper change
  - pg_net objects are PUBLIC and granted by `supabase_admin`

## 2. What was emulated (fidelity)

**Supabase stub, calibrated against TEST with read-only catalog queries (2026-09-16):**
- `postgres` is LOGIN CREATEROLE BYPASSRLS, not superuser, and member of anon/authenticated/service_role/authenticator plus pg_read_all_data etc. Login `search_path` is `"\$user", public, extensions`.
- `authenticator` is NOINHERIT, with SET-only membership in anon/authenticated/service_role.
- `supabase_auth_admin`: login `search_path=auth`, owns `auth.users`; postgres holds `arwdDxtm`.
- `auth.uid()/jwt()/role()` bodies copied from TEST.
- Database ACL `=Tc/postgres`, so **PUBLIC has TEMP**.
- `net` schema `=U`. `net.http_post` has a NULL ACL and is **SECURITY INVOKER**. `net.http_request_queue` and `net._http_response` are `=arwdDxtm` (**PUBLIC has ALL**).
- vault and pg_cron stubs.
- `supabase_admin` default ACLs in `public`.

**How the harness runs things:**
- **Sessions:** `SET SESSION AUTHORIZATION` plus an emulated login (RESET ALL, then the role's `rolconfig`, so migration 07's `ALTER ROLE app_rls SET` is honoured).
- **App schema:** all 4 files in `supabase/migrations` applied as `postgres`. Only the 6 `CREATE EXTENSION` statements were stripped (pg_cron, pg_net, pg_stat_statements, pgcrypto, supabase_vault, uuid-ossp); the stub provides them.
- **Seed:** Clerk-style users A, B, C, and post-cutover uuid users. Each user has active and draft catalogues. Also seeded: themes, duplicate qr_configs, case-variant newsletter and product_newsletter duplicates, prompts (including a null user), ocr, analytics, subscriptions, job_logs, plans.
- **App path:** `BEGIN` → one parameterised `select pg_catalog.set_config('role',$1,true), set_config('request.jwt.claims',$2,true), statement_timeout, lock_timeout, idle_in_transaction_session_timeout` → queries → `COMMIT`/`ROLLBACK`. The same wrapper runs under an `app_rls` login for 07.
- **Drizzle:** the real query builder through the pg-proxy driver. Nested `tx.transaction` is emulated as SAVEPOINT.
- **PostgREST path:** `authenticator` session → `set_config('role', anon|authenticated|service_role, true)` plus claims.
- **GoTrue path:** `supabase_auth_admin`, `search_path=auth`. `admin.createUser` is emulated faithfully: one transaction, INSERT, then a separate UPDATE of `raw_app_meta_data`, as in supabase/auth `internal/api/admin.go` `adminUserCreate` (`tx.Create(user)` … `user.UpdateAppMetaData(tx, params.AppMetaData)`, fetched from GitHub master).

## 3. Findings (failing scenarios), most severe first

### F1 High: imported Clerk users get a default-plan `public.users` row, and the cutover RUNBOOK then aborts
- **Where:**
  - `rls.sql:1059-1061` (`if raw_app_meta_data ? 'clerk_user_id' then return`)
  - trigger `rls.sql:1166-1168`
  - pgTAP plan `rls-design.md:900` (asserts the skip with a direct INSERT carrying app_metadata)
- **Why it breaks:** GoTrue `admin.createUser` INSERTs `auth.users` with only `user_metadata` and applies `app_metadata` in a later UPDATE of the same transaction. The AFTER INSERT row trigger therefore never sees `clerk_user_id`.
- **Observed:**
  - Every imported user got `public.users(id=<uuid>, plan_id=Starter)`. A Brevo webhook is queued too when a URL is configured.
  - The RUNBOOK precondition then raised `P0001 a target uuid is already present in public.users` (`rls.sql:1212`), so the remap cannot run.
  - With the remap blocked: 09 fails (`23514 … violated by some row`), stale Clerk ids stay writable, and the old Clerk `sub` still sees its catalogues.
  - 7 G7 scenarios plus 1 G6 scenario fail.
  - The pgTAP test in `rls-design.md:900` would pass anyway, because it does not reproduce GoTrue's INSERT-then-UPDATE order.
- **Fix (PATCH P5, verified: 0 rows for imports, remap plus 09 succeed):**
  - Create `migration.clerk_user_map` in 08 instead of RUNBOOK R1 (R1 stays idempotent).
  - The import script inserts `(clerk_user_id, supabase_user_id, 'pending')` **before** `admin.createUser`.
  - The trigger also returns early when `exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = new.id)`.
  - Change the pgTAP 50 fixture to INSERT then UPDATE app_metadata.
  - Do **not** move the marker into `user_metadata`: it is user-writable.

### F2 High: Phase 1/2 window. Owner policies are inert while converted `withUser` code is live
- **Where:** `rls.sql:486-490` (policies created in 04, "inert until 06"), RLS enabled only at `rls.sql:921-926` (06).
- **Observed (01-05 applied, emulated `withUser(A)`):**
  - A read all 4 catalogues, including B's draft.
  - A renamed B (`update users … where id=B` affected 1).
  - A deleted B's `b-live`.
  - A read B's newsletter subscriber emails.
- **Fix (PATCH P1):** enable RLS on all 12 tables in 04. Add temporary permissive policies that mirror today's anon GRANTs exactly, and drop them in 06:
  - `legacy_anon_users` / `legacy_anon_catalogues` / `legacy_anon_subscriptions` / `legacy_anon_analytics`: `for all to anon using (true) with check (true)`
  - `legacy_anon_newsletter`: `for select`
  - `legacy_anon_job_logs`: `for insert`
- **Verified:** the four leak scenarios become 0 rows. Today's anon supabase-js paths still work: Clerk webhook users upsert and delete, Paddle subscriptions upsert, dashboard analytics and newsletter counts, job_logs insert, `/api/items` catalogues read. The 06 perimeter still ends at zero.
- `postgres` (today's Drizzle) and `service_role` (worker) are unaffected: BYPASSRLS.

### F3 Medium (defence in depth): temp-table shadowing across tenants on pooled backends
- **Preconditions:**
  - PUBLIC holds TEMP on the database (TEST `datacl =Tc/postgres`).
  - `pg_temp` is searched **first** unless it is listed in `search_path`.
  - Drizzle emits **unqualified** names (`select … from "catalogues"`, verified from `toSQL`).
  - Supavisor transaction mode reuses backends.
- **Observed** (any SQL-injection primitive inside `withUser` by tenant A):
  - A runs `create temp table catalogues (like public.catalogues)`.
  - B's `loadOwnedCatalogue` on the same backend returned A's forged row.
  - B's `createCatalogue` INSERT went into A's temp table, 0 rows in `public`.
  - A then read B's captured content.
  - The same happens under the 07 `app_rls` login as written (`search_path "$user", public`).
- **Fixes (verified):**
  1. TS wrapper (decision §5.3, `rls-design.md:338`): add `pg_catalog.set_config('search_path', 'public, pg_temp', true)` to the one `set_config` statement. The forged row is no longer read and builtins still resolve.
  2. **PATCH P4:** `alter role app_rls set search_path = public, pg_temp` in 07. Verified under an `app_rls` login.
  3. Optional: `revoke temporary on database postgres from public; grant temporary … to postgres, service_role, authenticated, anon, dashboard_user`. Verified: `app_user` gets 42501 and postgres keeps TEMP. Impact on other Supabase services is unverified.

### F4 Medium (defence in depth, not fixable by a migration): pg_net objects are PUBLIC
- **Observed as `app_public` (and `app_user`):**
  - `select headers->>'Authorization' from net.http_request_queue` returned `Bearer <Vault service_role_key>` for a pending Brevo webhook. The webhook was queued by an `app_user` rename through the SECURITY DEFINER trigger, which works correctly.
  - `select net.http_post('http://169.254.169.254/…')` succeeded, i.e. arbitrary outbound HTTP.
  - `delete from net.http_request_queue` succeeded, which suppresses CRM and Discord webhooks.
- **Fix feasibility (verified):** `revoke all on net.http_request_queue from public` as postgres is a no-op (`WARNING: no privileges could be revoked`), because `supabase_admin` is the grantor.
- **Recommended:**
  - Stop sending the service_role key from `call_edge_function_with_vault_secret`. Use a dedicated per-webhook secret checked by the edge functions (sources not in any repo, unverified).
  - Move `DB_CONNECTION_STRING` to `app_rls` (07) early, and keep the `sql.raw` ban.
  - Rotate the key if an injection is ever found.
  - Ask Supabase whether revoking PUBLIC on `net.*` is supported (unverified).

### F5 Medium (cross-document): `identity-cutover.md` §8.1 M4 conflicts with `rls.sql` 08, cannot be re-run, and stores null consents
Executed verbatim (`identity-m4.sql`, with the §5.2 DDL inlined):
- **First apply on 01-07:** ok.
- **Re-apply:** `42501 must be owner of relation users` at `drop trigger if exists on_auth_user_created on auth.users` (`identity-cutover.md:1261-1263`). `DROP TRIGGER IF EXISTS` needs table ownership once the trigger exists, and postgres does not own `auth.users`. The same probe confirms the `rls.sql` claim that postgres can CREATE but not DROP triggers there.
- **`rls.sql` 08 then identity M4:** 42501 at the same line. **Identity M4 then `rls.sql` 08:** `42710 trigger "on_auth_user_created" … already exists`. Exactly one of the two may ever be applied, and trigger names are permanent.
  - Later changes must use `create or replace function` only.
  - Delete the three `drop trigger if exists` lines, which only work when they are no-ops.
  - Pick one document's M4 (`rls.sql` 08 plus P5 covers identity-cutover A1).
- **Null consents:** a sign-up without `terms_version` metadata stored `{"terms-and-conditions": null, …}`, not `false`. The cause is `v_accepted := v_terms is not null and (… ->> 'terms_version') = v_terms` (`identity-cutover.md:1225`). Fix: wrap it in `coalesce(…, false)`.
- **Anonymous users:** identity M4 creates a row with a plan for them. `rls.sql` 08 skips them.

### F6 Low: the 01 GRANT fallback fails when postgres lacks ADMIN OPTION
- **Where:** `rls.sql:78-84` claims a CREATEROLE user "could always execute a GRANT". The DO block is at `rls.sql:109-111`.
- **Observed:** when `app_user` or `app_public` already exist and were created by another role, the migration fails with a bare `42501 permission denied to grant role "app_user"`. PG16+ requires ADMIN OPTION.
- **Fix (PATCH P2, verified):** check `pg_has_role(current_user, r, 'USAGE WITH ADMIN OPTION')` (or superuser) first. Raise an actionable message naming the exact GRANT a superuser must run.
- Whether supautils ever creates roles as superuser is unverified.

### F7 Low: `private` objects are owned by the applier; if a superuser applies 01-05, asAdmin cannot write
- **Observed:** with 01-05 applied as `supabase_admin`, `private`, `private.settings` and `private.paddle_events` are owned by `supabase_admin`. `insert into private.paddle_events` as postgres gave 42501. SELECT still worked through `pg_read_all_data`.
- **Fix (PATCH P3, verified):** explicit `alter schema private owner to postgres` and `alter table private.<settings|paddle_events|backup_*> owner to postgres`. These are no-ops when postgres applies them.
- Which role the CLI applies migrations as is unverified.

### F8 Low / info: size CHECK semantics on grandfathered rows
- **Observed:**
  - The CHECK measures the **raw** size on INSERT/UPDATE: a new compressible 1.5 MB value gives 23514.
  - A legacy 1.5 MB compressible `content` is stored toasted at 17,186 bytes, so 06 `VALIDATE` passes.
  - Updating `heading` or `content = content` is ok (TOAST pointer).
  - **Any real content edit fails with 23514.**
- **Consequence:** owners of large catalogues silently lose the ability to save. The PROD pre-check `max(pg_column_size(content))` (`rls.sql:311`) reports **compressed** size and under-reports.
- **Fix:** audit with `max(octet_length(content::text))`, and pick the limit (or an exemption) from that result.

### F9 Low: Phase 1 behaviour change for today's newsletter actions
- After 03, today's `newsletterSignup` / `productNewsletterSignup` pre-check is case-sensitive (`actions/newsletter.ts:25-44,64-74`). A case-variant duplicate hits `23505 newsletter_catalogue_email_key` and the catch returns `{status:"error"}`.
- This goes away when the P1 definer-based actions ship. Ship them together, or accept the effect.

### F10 Low: pgTAP under `SET ROLE app_user` needs EXECUTE, not just USAGE
- **Observed:** after 01's global `alter default privileges for role postgres revoke execute on functions from public`, a function postgres creates later (for example in `extensions`) is not EXECUTE-able by app roles.
- **Fix:** if `create extension pgtap` objects end up owned by postgres (unverified, depends on supautils), `rls-design.md` §7's "optional" `grant execute on all functions in schema extensions to app_user, app_public` (rolled back per test) is mandatory.

### F11 Info (by design, recorded): the SQL-injection threat model
- **Phases 1-3 (postgres login):** injected SQL inside `withUser` can re-set `request.jwt.claims` (seen: B's rows read) and `RESET ROLE` back to BYPASSRLS postgres. The DB also lets that session `SET ROLE service_role/authenticated/anon/authenticator`. Only the TS allowlist prevents that.
- **After 07:** `RESET ROLE` lands on `app_rls` (42501 everywhere) and only `app_user`/`app_public` are reachable. A claims rewrite remains possible.
- This supports moving 07 earlier, as `redteam-rls.md` also argues.

### F12 SQL copied from the binding decision text (not `rls.sql`)
Ran `decision-sql.sql` (M1-M5 verbatim, placeholders filled):
- **Without the prose "dedupe" step**, M1 fails with `23505 could not create unique index` on `qr_configs_catalogue_key`, then `newsletter_catalogue_email_key`, then `product_newsletter_email_key`. M3 and M4 then fail on missing `app_user` / `private`. `rls.sql` 03 implements the dedupe with backups.
- **After a manual dedupe**, M1-M4 apply.
- **Divergences that `rls.sql` already fixes:**
  - `subscribe_catalogue_newsletter` casts `(footer->>'newsletter')::boolean`. It raises `22P02` for an active catalogue whose value is a non-boolean string (e.g. `"maybe"`; `"yes"` is a valid boolean literal), which breaks the constant response.
  - The ocr FK is only mentioned in a comment, so it stays `ON DELETE CASCADE` (OCR quota resets on delete).
  - M4 stores a `javascript:` avatar URL.
  - M4 creates rows for anonymous users.
  - Nullable `turn_id` with no default: a continuation right after a Phase-1 `meter()` row increments that legacy row, then charges anyway.

## 4. Design claims confirmed by execution (selection)

| Claim | Result |
|---|---|
| INSERT must be table-level because Drizzle lists every column with `default` | Drizzle `insert` emits all 21 catalogues columns. Table-level INSERT plus the pin trigger works. A client `id`/`created_at` is overwritten. |
| Column UPDATE grants block mass assignment | `created_by`, `name`, `id`, `created_at`, `source` → 42501. Drizzle `set({...data})` without `pickEditable` → 42501. |
| WITH CHECK blocks `status='active'` inserts and foreign `created_by` | 42501, both raw and Drizzle. |
| `app_public` cannot read `created_by`; `select *` / `findFirst()` without `columns` → 42501 | Confirmed. `count(*)` works; filtering on `created_by` is denied. |
| One policy InitPlan per statement | `EXPLAIN` shows `Index Cond: (created_by = (InitPlan 1).col1)`. |
| `ON CONFLICT DO UPDATE` onto another owner's row raises, not a silent no-op | qr_configs: 42501. `upsertQrConfig` maps it to "Not found" via `DrizzleQueryError.cause` (`pgError` logic works). |
| `SELECT … FOR UPDATE` allowed with UPDATE(name, cookie_preferences) | Own row: 1 row. B's row: 0 rows. |
| SAVEPOINT retry in `duplicateItem` keeps role and claims | After `ROLLBACK TO SAVEPOINT`: `current_user=app_user`, sub unchanged. Claims changed inside the savepoint are reverted. |
| No leakage after COMMIT, error, or autocommit misuse | `current_user=postgres`, claims empty, timeouts reset in all three cases. `withPublic` after `withUser` carries no sub. |
| `SET ROLE` does not apply `ALTER ROLE … SET` | Confirmed (8s from the wrapper, not the role's 1234ms). |
| Claims injection harmless with bound parameters | A sub containing `x', true); drop table public.users; --"\` is returned literally; 0 rows; users intact. |
| No Supabase service role can become an app role | authenticator, storage/auth/realtime admins, anon, authenticated, service_role: all `SET ROLE app_user/app_public` → 42501. |
| PostgREST perimeter after 06 | 168/168 S/I/U/D on 12 tables plus 2 views for anon, authenticated (uuid sub) and authenticated (Clerk sub) → 42501 (views: 55000 on writes). Private functions and dropped `get_pageview_totals` denied. |
| Forgotten wrapper under `app_rls` fails closed | 42501 on tables, views, private functions. `RESET ROLE` injection → 42501. |
| Newsletter definer | Owner derived from the row; draft, disabled, invalid, 300-character, random-uuid, case-variant and null inputs are silent no-ops; spoofed direct inserts → 42501. |
| AI ledger | charged, limit, continued, forged continuation charged, 9-cap charged, refund rules, previous month not counted, null limit is unlimited, catalogue delete keeps rows (catalogue set NULL), `user_id NOT NULL`, app_user UPDATE → 42501. |
| Remap | Aborts on unmapped Clerk users and on `analytics_upsert_trigger`. Cascades all 6 ownership FKs. Does not bump `updated_at`. 09 blocks stale ids (23514, FK 23503). |
| 02 per-project URL | Seeded from a base64url JWT with `-`/`_` and no padding. `sb_secret_` key: no URL, users update ok, WARNING. Brevo fires on name, not on cookie_preferences. Cron posts to this project only. |
| `proconfig` stores `search_path=""` | Confirmed (resolves `rls-design.md` §14 unverified item). |
| Trigger functions in `private` fire for `supabase_auth_admin` without USAGE/EXECUTE | Sign-up, email sync, metadata sync (no clobber of in-app name), delete cascade all work; missing plan → P0001. |

Per-group results (original → patched): G0 22 (2→0), G1 10 (4→0), G2 141 (0), G3 25 (0), G4 19 (4→4), G5 11 (1→0), G6 15 (1→0), G7 129 (7→0), G8 96 (0; Drizzle app layer run as Clerk/postgres-login, uuid, and Clerk/`app_rls`), G9 7 (0).

## 5. Limitations
- **PGlite does not enforce `statement_timeout`:** `pg_sleep(4)` under the 3s wrapper completed. The GUC values are set per transaction as designed, but cancellation is unverified.
- **Single connection:** no concurrency. The `begin_ai_turn` FOR UPDATE race, Supavisor transaction-mode backend reuse and pool leaks across real connections are reasoned, not run. The temp-table scenario emulates reuse by running tenants sequentially on one session.
- **No supautils:** its reserved-role and privileged-extension hooks are not emulated (e.g. whether `CREATE ROLE`/`CREATE EXTENSION pgtap` run as superuser, or whether `GRANT app_user TO authenticator` is blocked; TEST `reserved_memberships` includes authenticator).
- **Not run for real:** PostgREST, GoTrue, Realtime and Supavisor are emulated through role switches only. GoTrue ordering comes from its source, not a live call.
- **pgTAP not installed:** fetching it was denied. The 00_perimeter assertions ran as plain SQL; other pgTAP files are covered by equivalent scenarios.
- **Stubs:** vault is a plain table, and pg_cron jobs were executed manually as the job owner.
- **Stale common schema:** Drizzle ran against the current `@quicktalog/common` schema (pre-regeneration: no `turn_id`, qr_configs `id` typed serial). SQL shapes may change after `drizzle-kit pull`.
- **TEST and PROD:** TEST ACLs were read (read-only). PROD was never queried.
