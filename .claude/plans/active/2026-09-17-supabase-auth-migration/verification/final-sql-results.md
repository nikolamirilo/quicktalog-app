# Final PGlite run of the plan's SQL

Run on 2026-09-17 against every `sql` block of `../PLAN.md` Appendix A, on PGlite 0.3.16 (PostgreSQL 17.5) and 0.5.8 (PostgreSQL 18.3), with a Supabase stub calibrated from TEST (non-superuser `postgres`, TEST ACLs including pg_net PUBLIC and database TEMP for PUBLIC, vault/pg_cron stubs, `auth.users` owned by `supabase_auth_admin`, `auth.identities`, `vault.secrets` and `supabase_migrations.schema_migrations` as on TEST).

**Order (real phase order, fresh stub per chain):** baseline 4 app migrations + seed, M00 (gate A), M01-M06 (gate B), M07 (gate C), M08 (gate D), M09 (gate E), M10 (gate F), import emulation + A.R1 + M11 + A.R2 + re-cutover A.R1 + M12 + M13 (gate G), A.14 in reverse (gate H), A.15/A.16 (gate I). Each migration is one transaction as `postgres`; A.R1/A.R2 run as psql scripts.

**"original"** is the Appendix A SQL as first written; **"patched"** adds fixes W1-W9, which are now part of `../PLAN.md` (marked `CHANGE Wn`).

**Re-run on the published plan (2026-09-17):** the SQL extracted from `../PLAN.md` as it stands gives `failed scenarios=0/692` on PostgreSQL 17.5 and 18.3 (`pglite-harness/run-final.sh`).

## Totals

| Run | Scenarios | Failed | Statement-mode SQL errors (M00-M10) | Apply failures |
|---|---|---|---|---|
| original PG17 | 692 | 15 | 0 | 1 (expected: M04 without M00 must fail) |
| original PG18 | 692 | 15 | 0 | 1 (expected: M04 without M00 must fail) |
| patched PG17 | 692 | 0 | 0 | 1 (expected: M04 without M00 must fail) |
| patched PG18 | 692 | 0 | 0 | 1 (expected: M04 without M00 must fail) |

## Per group

| Group | Scenarios | orig PG17 fail | orig PG18 fail | patched PG17 fail | patched PG18 fail |
|---|---|---|---|---|---|
| A gate 0A: baseline + M00 | 12 | 0 | 0 | 0 | 0 |
| B gate 1: M01..M06 (Clerk ids) | 7 | 0 | 0 | 0 | 0 |
| B1 migration mechanics (M01-M06) | 14 | 0 | 0 | 0 | 0 |
| B2 owner matrix (Clerk ids, postgres login, plan wrapper) | 124 | 0 | 0 | 0 | 0 |
| B3 usage + AI ledger incl. M06 plan binding (C7, C8) | 31 | 0 | 0 | 0 | 0 |
| B4 admin, worker and PostgREST perimeter (M01-M06) | 20 | 0 | 0 | 0 | 0 |
| B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | 17 | 0 | 0 | 0 | 0 |
| B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | 28 | 0 | 0 | 0 | 0 |
| B7 misc SQL semantics | 4 | 0 | 0 | 0 | 0 |
| C gate 1: M07 validate after audit | 6 | 1 | 1 | 0 | 0 |
| D gate 1 end: M08 app_rls | 9 | 0 | 0 | 0 | 0 |
| E Track K: M09 | 1 | 0 | 0 | 0 | 0 |
| F gate 2: M10 | 1 | 0 | 0 | 0 | 0 |
| D2 owner matrix and Drizzle app layer under the app_rls login | 152 | 0 | 0 | 0 | 0 |
| E Track K: M09 edge webhook secret | 11 | 2 | 2 | 0 | 0 |
| F gate 2: M10 auth sync | 25 | 1 | 1 | 0 | 0 |
| G1 import emulation (M00-M10 applied) | 4 | 2 | 2 | 0 | 0 |
| G2 A.R1 preconditions (each on a copy of the post-import state) | 7 | 0 | 0 | 0 | 0 |
| G3 A.R1 re-key, M11, V-queries, post-cutover isolation | 159 | 0 | 0 | 0 | 0 |
| G4 cutover window, A.R2 rollback-remap, re-cutover | 5 | 1 | 1 | 0 | 0 |
| G5 M12 and M13 | 5 | 1 | 1 | 0 | 0 |
| H A.14 rollback SQL in reverse | 38 | 3 | 3 | 0 | 0 |
| I read-only scripts A.15 / A.16 | 12 | 4 | 4 | 0 | 0 |

## Failures of the SQL as written (identical on PG17 and PG18) and the verified fix

| Scenario | Expected | Actual (original, PG17) | Fix | Patched PG17/PG18 |
|---|---|---|---|---|
| C gate 1: M07 validate after audit: NOT VALID semantics vs the M03 header comment: legacy row whose STORED colors exceed 4 KiB - unrelated UPDATE (set name = name); then M07 VALIDATE | M03 comment claims only UPDATEs that rewrite the column are checked: unrelated update ok; M07 23514 | update=ERROR 23514: new row for relation "user_themes" violates check constraint "user_themes_colors_size"; M07=ERROR 23514: check constraint "user_themes_colors_size" of relation "user_themes" is violated by some row @M07 line 5 :: alter table public.user_themes validate constraint user_themes_colors_size; | W8 (M03 header comment) | pass / pass |
| E Track K: M09 edge webhook secret: Sync Plans command with neither secret nor key in Vault | no request (trigger function skips in that case) | ok rows=[{"http_post":6}] affected=1; [{"url":"https://abcdefghijklmnopqrst.supabase.co/functions/v1/sync-available-plans","secret":null,"has_auth":true,"auth":null,"id":null}] | W7 (M09 cron WHERE) | pass / pass |
| E Track K: M09 edge webhook secret: validation of the edge_functions_base_url setting: trailing slash, http/foreign host, query suffix, leading space are rejected; local stack URL accepted | 4 rejected (23514); local ok | "https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1/" -> accepted \| "http://attacker.example/functions/v1" -> accepted \| "https://abcdefghijklmnopqrst.supabase.co/functions/v1?x=" -> accepted \| " https://abcdefghijklmnopqrst.supabase.co/functions/v1" -> accepted \| local -> accepted | W6 (M02 CHECK) | pass / pass |
| F gate 2: M10 auth sync: unconfirmed email sign-up and the Brevo webhook: no CRM contact for an address nobody has confirmed (anyone can sign up with a third party's email) | 0 Brevo calls before confirmation; row + 1 call after email_confirmed_at is set | rows before confirm=1; calls=[{"id":"f0000001-0000-4000-8000-000000000001","email":"victim@example.com","url":"https://abcdefghijklmnopqrst.supabase.co/functions/v1/create-brevo-contact"}] | W1 (M10 create_user_row + confirm path) | pass / pass |
| G1 import emulation (M00-M10 applied): A.R1 lock order (C12 'strongest lock first'): locks already held on public.users when ACCESS EXCLUSIVE is requested | none (no AccessShare -> AccessExclusive upgrade; preconditions checked under the lock) | held=AccessShareLock; error before lock=null | W9 (A.R1/A.R2 lock before the preconditions) | pass / pass |
| G1 import emulation (M00-M10 applied): A.R2 lock order (C12 'strongest lock first'): locks already held on public.users when ACCESS EXCLUSIVE is requested | none (no AccessShare -> AccessExclusive upgrade; preconditions checked under the lock) | held=AccessShareLock; error before lock=null | W9 (A.R1/A.R2 lock before the preconditions) | pass / pass |
| G4 cutover window, A.R2 rollback-remap, re-cutover: re-cutover: A.R1 again after A.R2 (plan: map-based rollback and re-cutover, section 5.6 drill with an account deletion in the window) | COMMIT | ERROR P0001: map rows marked migrated without an auth.users row @line 11 | W2 (M10 delete trigger marks map row deleted) | pass / pass |
| G5 M12 and M13: after M13: account deletion (authAdmin().deleteUser -> DELETE auth.users -> M10 trigger) | ok; public.users row removed | ERROR 42P01: relation "migration.auth_user_deletions" does not exist; [{"n":1}] | W3 (M13 replaces delete trigger body first) | pass / pass |
| H A.14 rollback SQL in reverse: [all applied through M13] A.14 rollback M01 | runnable: runs without error and leaves the previous migration's schema, still usable | ERROR 2BP01: cannot drop schema private because other objects depend on it :: drop schema if exists private;; expect=-;  | W4 (A.14 M01 text) | pass / pass |
| H A.14 rollback SQL in reverse: [all applied through M12, R2 still in its window] A.14 rollback M01 | runnable: runs without error and leaves the previous migration's schema, still usable | ERROR 2BP01: cannot drop schema private because other objects depend on it :: drop schema if exists private;; expect=-;  | W4 (A.14 M01 text) | pass / pass |
| H A.14 rollback SQL in reverse: [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M01 | runnable: runs without error and leaves the previous migration's schema, still usable | ERROR 2BP01: cannot drop schema private because other objects depend on it :: drop schema if exists private;; expect=-;  | W4 (A.14 M01 text) | pass / pass |
| I read-only scripts A.15 / A.16: [PROD today (baseline, before M00)] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 3 rows | query returned 0 rows: [] | W5 (A.15 query) | pass / pass |
| I read-only scripts A.15 / A.16: [after M00] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 3 rows | query returned 0 rows: [] | W5 (A.15 query) | pass / pass |
| I read-only scripts A.15 / A.16: [after M00-M10] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 7 rows | query returned 0 rows: [] | W5 (A.15 query) | pass / pass |
| I read-only scripts A.15 / A.16: [after cutover (A.R1 + M11)] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 7 rows | query returned 0 rows: [] | W5 (A.15 query) | pass / pass |

## Patches (exact old/new text in the patch list; applied by the patch tool)

| Id | Severity | Appendix A block (plan lines) | Change |
|---|---|---|---|
| W3 | high | A.13 M13 (3068) | replace `private.handle_auth_user_deleted()` body (no insert into the log, keep map status update) before `drop table if exists migration.auth_user_deletions`; without it every auth.users DELETE fails 42P01 |
| W2 | medium | A.10 M10 10.7 (2763) | delete trigger sets `migration.clerk_user_map.status = 'deleted'`; without it A.R1 re-cutover aborts after an imported account was deleted in the R1/R2 window |
| W1 | medium | A.10 M10 10.5, 10.6, 10.9, 10.10 (2676-2841); A.14 M10 (3089) | new definer `private.create_user_row(...)`; `handle_auth_user_created` skips unconfirmed email sign-ups; `handle_auth_user_updated` creates the row when `email_confirmed_at` goes from null to set; trigger column list adds `email_confirmed_at` |
| W4 | medium | A.14 M01 (3155) | state M01 is irreversible once M10 is applied; before M10 drop the M03 tables in `private` first |
| W9 | low | A.R1 (2855-2893), A.R2 (2998-3013) | take the ACCESS EXCLUSIVE / SHARE ROW EXCLUSIVE locks before the precondition DO block |
| W5 | low | A.15 (3187) | trigger inventory filtered by `pg_namespace`, not by `regclass::text like 'public.%'` |
| W6 | low | A.2 M02 (before 1492) | CHECK constraint on `private.settings` for `edge_functions_base_url` format |
| W7 | low | A.9 M09 (2573) | Sync Plans WHERE requires a credential |
| W8 | low | A.3 M03 header (1617-1618) | corrected NOT VALID semantics comment |

## Notes and limitations

- Non-runnable text in Appendix A (recorded, not a defect): `\set ON_ERROR_STOP on` in A.R1/A.R2 is a psql meta-command (stripped by the psql emulation); A.14 parts for M13, M12, R1, M09, M02 and the first half of M06 are prose or commented SQL (emulated literally: M12 = the statement in the comment, R1 = A.R2, M09 = M02 sections 2.2+2.3, M06 = M05 sections 5.5-5.7 then the drops, M02 = remote_schema.sql:55-91 + unnarrowed trigger + lockdown.sql:242-267 + delete setting); the commented consent-default statement in A.14 M10 was not run; A.15 Phase 3/4 queries are commented (run uncommented in gate G); A.16 E6 is Logs Explorer SQL, not Postgres.
- `verify.sql` (V1-V12) is not in Appendix A; V1-V10 were reconstructed from section 6.7 wording (V8, V11, V12 approximated or out of scope: V12 needs the CSV). With W1, V3 must count only confirmed users.
- PGlite is single-connection: lock blocking, statement_timeout cancellation and Supavisor backend reuse are not observable. C7 was verified by reading the tuple header lock bits with pageinspect (`FOR NO KEY UPDATE` = no HEAP_KEYS_UPDATED).
- GoTrue, PostgREST and pg_cron are emulated by role switches (`supabase_auth_admin` INSERT then app_metadata UPDATE then confirm UPDATE; `authenticator` + SET ROLE; cron command run as its owner).
- Drizzle scenarios use the real drizzle-orm 0.45.2 query builder from the app's node_modules with the plan B.3 wrapper (search_path in the set_config statement) and B.10 metering signatures.
- Runtime notes: ["re-cutover needed a manual 'deleted' classification of map rows for accounts deleted in the window; second A.R1: ok"]

## All scenarios

| # | Group | Scenario | Expected | orig PG17 | orig PG18 | patched PG17 | patched PG18 |
|---|---|---|---|---|---|---|---|
| 1 | A gate 0A: baseline + M00 | baseline (today's grants): anon reads catalogues through PostgREST | 4 rows (the hole M00 closes) | pass | pass | pass | pass |
| 2 | A gate 0A: baseline + M00 | baseline: anon self-upgrades users.plan_id | 1 row (hole) | pass | pass | pass | pass |
| 3 | A gate 0A: baseline + M00 | apply M00 as one transaction as postgres on today's grants | ok (all DO assertions pass) | pass | pass | pass | pass |
| 4 | A gate 0A: baseline + M00 | M00: RLS enabled on the 12 public tables | analytics,catalogues,job_logs,newsletter,ocr,plans,product_newsletter,prompts,qr_configs,subscriptions,user_themes,users | pass | pass | pass | pass |
| 5 | A gate 0A: baseline + M00 | M00 creates no policy (RLS on + zero grants = deny) | 0 policies | pass | pass | pass | pass |
| 6 | A gate 0A: baseline + M00 | M00 PostgREST perimeter: anon, authenticated (uuid sub), authenticated (Clerk sub) x 14 relations x S/I/U/D + sequence + RPCs | all 177 denied (42501 / 55000 on views / 42883 dropped RPC) | pass | pass | pass | pass |
| 7 | A gate 0A: baseline + M00 | M00: postgres default ACLs in public grant nothing to anon/authenticated | no anon=/authenticated= entries | pass | pass | pass | pass |
| 8 | A gate 0A: baseline + M00 | Phase 0A app paths after M00 (DB_CONNECTION_STRING/DATABASE_ADMIN_URL = postgres): Clerk upsert/ensure/delete, Paddle plan update + subscriptions upsert (fires CRM triggers), public items read, dashboard analytics | all ok | pass | pass | pass | pass |
| 9 | A gate 0A: baseline + M00 | worker (service_role over PostgREST) after M00: read catalogues, insert job_logs, inactivate | ok, ok, 2 rows | pass | pass | pass | pass |
| 10 | A gate 0A: baseline + M00 | re-apply M00 (idempotent) | ok | pass | pass | pass | pass |
| 11 | A gate 0A: baseline + M00 | C1: M00 with a function in public that PUBLIC can execute | fails with 'functions in public are still executable by anon/authenticated (PUBLIC grant?)' | pass | pass | pass | pass |
| 12 | A gate 0A: baseline + M00 | C1: M00 when supabase_admin created a table in public (its default ACL grants anon ALL; postgres is not the grantor) | fails loudly (RLS off or anon privileges message), nothing applied | pass | pass | pass | pass |
| 13 | B gate 1: M01..M06 (Clerk ids) | C5: M01..M04 without M00 on a fresh stub | M04 fails with 'M04: apply M00_perimeter_close first' | pass | pass | pass | pass |
| 14 | B gate 1: M01..M06 (Clerk ids) | apply M01 (after M00) as one transaction as postgres | ok | pass | pass | pass | pass |
| 15 | B gate 1: M01..M06 (Clerk ids) | apply M02 (after M00) as one transaction as postgres | ok | pass | pass | pass | pass |
| 16 | B gate 1: M01..M06 (Clerk ids) | apply M03 (after M00) as one transaction as postgres | ok | pass | pass | pass | pass |
| 17 | B gate 1: M01..M06 (Clerk ids) | apply M04 (after M00) as one transaction as postgres | ok | pass | pass | pass | pass |
| 18 | B gate 1: M01..M06 (Clerk ids) | apply M05 (after M00) as one transaction as postgres | ok | pass | pass | pass | pass |
| 19 | B gate 1: M01..M06 (Clerk ids) | apply M06 (after M00) as one transaction as postgres | ok | pass | pass | pass | pass |
| 20 | B1 migration mechanics (M01-M06) | re-apply M01 when roles/schema already exist (idempotent) | ok | pass | pass | pass | pass |
| 21 | B1 migration mechanics (M01-M06) | re-apply M04 (policies already exist) | fails 42710 (policies are not idempotent; migrations run once) - informational | pass | pass | pass | pass |
| 22 | B1 migration mechanics (M01-M06) | P2: M01 when app_user/app_public exist without ADMIN OPTION for postgres | stops with the actionable ADMIN OPTION message | pass | pass | pass | pass |
| 23 | B1 migration mechanics (M01-M06) | P3: M01-M06 applied by supabase_admin: asAdmin writes private.paddle_events / paddle_unresolved_events, Brevo trigger reads private.settings | apply ok; all ok | pass | pass | pass | pass |
| 24 | B1 migration mechanics (M01-M06) | M02 seeds edge_functions_base_url from a base64url JWT in Vault | https://abcdefghijklmnopqrst.supabase.co/functions/v1 | pass | pass | pass | pass |
| 25 | B1 migration mechanics (M01-M06) | M02 Brevo trigger: none on cookie_preferences update, one on name update to this project's URL | 0 then 1 | pass | pass | pass | pass |
| 26 | B1 migration mechanics (M01-M06) | M02 'Sync Plans' cron command (as postgres) posts to this project's URL | .../sync-available-plans | pass | pass | pass | pass |
| 27 | B1 migration mechanics (M01-M06) | M02 with an sb_secret_ Vault key: no URL, update ok with WARNING, cron posts nothing | ok, 0, 0 | pass | pass | pass | pass |
| 28 | B1 migration mechanics (M01-M06) | C3 + dedupe: forged-owner row backed up and deleted first; dedupe keeps earliest legitimate row | forged backup ...00f0; kept ...0001; dupes backup ...0002 | pass | pass | pass | pass |
| 29 | B1 migration mechanics (M01-M06) | M03 qr_configs dedupe keeps most recently updated | kept ...0002 | pass | pass | pass | pass |
| 30 | B1 migration mechanics (M01-M06) | M03 product_newsletter dedupe | p@x.io 1, q@x.io 1 | pass | pass | pass | pass |
| 31 | B1 migration mechanics (M01-M06) | M03/M06 ledger shape: null-user rows backed up, FKs ON DELETE SET NULL, UNIQUE(catalogue) gone, turn_id/kind/plan columns | nulls 0, backup 1, ocr_backup 1, fks n,n, uniques 0 | pass | pass | pass | pass |
| 32 | B1 migration mechanics (M01-M06) | size CHECK on a NEW highly compressible 1.5 MB content | 23514 | pass | pass | pass | pass |
| 33 | B1 migration mechanics (M01-M06) | C4: asAdmin inserts private.paddle_unresolved_events; app_user/app_public denied; not reachable via PostgREST schema (service_role has no USAGE on private) | ok; 42501; 42501; 42501 | pass | pass | pass | pass |
| 34 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A selects users | only A | pass | pass | pass | pass |
| 35 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own plan_id | 42501 | pass | pass | pass | pass |
| 36 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own customer_id | 42501 | pass | pass | pass | pass |
| 37 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own email | 42501 | pass | pass | pass | pass |
| 38 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own consents | 42501 | pass | pass | pass | pass |
| 39 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own id | 42501 | pass | pass | pass | pass |
| 40 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own image | 42501 | pass | pass | pass | pass |
| 41 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own created_at | 42501 | pass | pass | pass | pass |
| 42 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates B's name | 0 rows | pass | pass | pass | pass |
| 43 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A updates own cookie_preferences | 1 row | pass | pass | pass | pass |
| 44 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: cookie_preferences > 2 KiB | 23514 | pass | pass | pass | pass |
| 45 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: getPlanForUpdate SELECT ... FOR NO KEY UPDATE own row | 1 row | pass | pass | pass | pass |
| 46 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: SELECT ... FOR NO KEY UPDATE on B's row | 0 rows | pass | pass | pass | pass |
| 47 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A inserts a users row | 42501 | pass | pass | pass | pass |
| 48 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] users: A deletes B (cascade-delete attack) | 42501 | pass | pass | pass | pass |
| 49 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A selects all | a-draft, a-live (not B's) | pass | pass | pass | pass |
| 50 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A updates B's active catalogue | 0 rows | pass | pass | pass | pass |
| 51 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A deletes B's draft | 0 rows | pass | pass | pass | pass |
| 52 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A sets created_by on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 53 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A sets name on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 54 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A sets id on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 55 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A sets created_at on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 56 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A sets source on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 57 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A updates own editable fields (returning) | 1 row, updated_at touched | pass | pass | pass | pass |
| 58 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: invalid status | 23514 | pass | pass | pass | pass |
| 59 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: publish own draft (status active via UPDATE) | 1 row | pass | pass | pass | pass |
| 60 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A inserts status active | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 61 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A inserts created_by = B | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 62 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: Drizzle-shaped INSERT (every column, default, client id/created_at) + RETURNING | 1 row; id and created_at pinned; status draft | pass | pass | pass | pass |
| 63 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: duplicateItem (INSERT ... SELECT own row as draft) | 1 row | pass | pass | pass | pass |
| 64 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: duplicate B's catalogue (source row invisible) | 0 rows inserted | pass | pass | pass | pass |
| 65 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: publishCatalogue mass-assignment of createdBy/id | 42501 | pass | pass | pass | pass |
| 66 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: content > 1 MiB | 23514 | pass | pass | pass | pass |
| 67 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: insert with a taken slug | 23505 | pass | pass | pass | pass |
| 68 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: A deletes own a-draft; usage rows survive (prompts catalogue set NULL) | deleted; prompts kept with catalogue NULL; analytics kept | pass | pass | pass | pass |
| 69 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: fail closed with claims {} (no sub) | 0 rows | pass | pass | pass | pass |
| 70 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] catalogues: fail closed with sub '' | 0 rows | pass | pass | pass | pass |
| 71 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select name from catalogues | a-live, b-live | pass | pass | pass | pass |
| 72 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select * (created_by not granted) | 42501 | pass | pass | pass | pass |
| 73 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: PUBLIC_CATALOGUE_COLUMNS select of an active catalogue | 1 row | pass | pass | pass | pass |
| 74 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: draft by name | 0 rows | pass | pass | pass | pass |
| 75 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: insert into public.catalogues | 42501 | pass | pass | pass | pass |
| 76 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: update public.catalogues set | 42501 | pass | pass | pass | pass |
| 77 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: delete from public.catalogues | 42501 | pass | pass | pass | pass |
| 78 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from users | 42501 | pass | pass | pass | pass |
| 79 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from newsletter | 42501 | pass | pass | pass | pass |
| 80 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from prompts | 42501 | pass | pass | pass | pass |
| 81 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from ocr | 42501 | pass | pass | pass | pass |
| 82 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from analytics | 42501 | pass | pass | pass | pass |
| 83 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from qr_configs | 42501 | pass | pass | pass | pass |
| 84 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from user_themes | 42501 | pass | pass | pass | pass |
| 85 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from subscriptions | 42501 | pass | pass | pass | pass |
| 86 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from plans | 42501 | pass | pass | pass | pass |
| 87 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from job_logs | 42501 | pass | pass | pass | pass |
| 88 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from product_newsletter | 42501 | pass | pass | pass | pass |
| 89 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from contacts | 42501 | pass | pass | pass | pass |
| 90 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select from active_subscriptions | 42501 | pass | pass | pass | pass |
| 91 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select private.catalogue_name_available('x') | 42501 | pass | pass | pass | pass |
| 92 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select private.my_usage() | 42501 | pass | pass | pass | pass |
| 93 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select private.begin_ai_turn('a-live', 1, 'agent', null, null) | 42501 | pass | pass | pass | pass |
| 94 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select private.set_plan_state(gen_random_uuid(), false, 0, null) | 42501 | pass | pass | pass | pass |
| 95 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select private.refund_ai_turn(gen_random_uuid()) | 42501 | pass | pass | pass | pass |
| 96 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: select private.current_user_id() | 42501 | pass | pass | pass | pass |
| 97 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_public: private.settings | 42501 | pass | pass | pass | pass |
| 98 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: app_public signup x3 (case/space variants) to active+enabled b-live | 3 calls ok; exactly 1 row foo@example.com owner user_2bBbbbbbbbbbbbbbbbbbbbb2 | pass | pass | pass | pass |
| 99 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: draft / disabled / invalid / 300-char / random uuid / case-variant / null / C6 formula (=HYPERLINK, DDE pipe), quotes, apostrophe, no TLD -> silent no-op | 13 calls ok, 0 new rows | pass | pass | pass | pass |
| 100 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] C6: normal addresses (dots, plus tag, subdomains, %, _, -) are accepted; a leading + is also accepted (CSV export escaping must neutralise it) | +3 rows | pass | pass | pass | pass |
| 101 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: malformed catalogue id | 22P02 (TS must validate) | pass | pass | pass | pass |
| 102 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: app_public direct insert with spoofed owner_id | 42501 | pass | pass | pass | pass |
| 103 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: app_user direct insert | 42501 | pass | pass | pass | pass |
| 104 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] product newsletter: X@y.io, x@Y.io, existing P@X.io, formula payload | all ok; +1 row | pass | pass | pass | pass |
| 105 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability: B's draft slug | false | pass | pass | pass | pass |
| 106 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability: free slug | true | pass | pass | pass | pass |
| 107 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability: own slug | false | pass | pass | pass | pass |
| 108 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability: empty string | false | pass | pass | pass | pass |
| 109 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability: null | false | pass | pass | pass | pass |
| 110 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability: free slug with no sub | false | pass | pass | pass | pass |
| 111 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] name availability leaks nothing else: A cannot read B's draft row | 0 rows | pass | pass | pass | pass |
| 112 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: insert for own a-draft | 1 row | pass | pass | pass | pass |
| 113 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: insert for B's b-draft | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 114 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: upsert onto B's existing b-live row | 42501 | pass | pass | pass | pass |
| 115 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: select B's | 0 rows | pass | pass | pass | pass |
| 116 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: delete B's | 0 rows | pass | pass | pass | pass |
| 117 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: upsertQrConfig on own existing row | 1 row config v=2 | pass | pass | pass | pass |
| 118 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: move own config to B's catalogue | 42501 | pass | pass | pass | pass |
| 119 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] qr_configs: second row for the same catalogue | 23505 | pass | pass | pass | pass |
| 120 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] user_themes: insert for B | 42501 | pass | pass | pass | pass |
| 121 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] user_themes: persistTheme upsert twice | 1 row, colors {i:1} | pass | pass | pass | pass |
| 122 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] user_themes: update B's | 0 rows | pass | pass | pass | pass |
| 123 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] user_themes: reassign own theme to B | 42501 | pass | pass | pass | pass |
| 124 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] user_themes: select | own only (t1) | pass | pass | pass | pass |
| 125 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] analytics: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 126 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] analytics: insert | 42501 | pass | pass | pass | pass |
| 127 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] analytics: update | 42501 | pass | pass | pass | pass |
| 128 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] analytics: delete | 42501 | pass | pass | pass | pass |
| 129 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] prompts: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 130 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] prompts: insert | 42501 | pass | pass | pass | pass |
| 131 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] prompts: update | 42501 | pass | pass | pass | pass |
| 132 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] prompts: delete | 42501 | pass | pass | pass | pass |
| 133 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] ocr: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 134 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] ocr: insert | 42501 | pass | pass | pass | pass |
| 135 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] ocr: update | 42501 | pass | pass | pass | pass |
| 136 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] ocr: delete | 42501 | pass | pass | pass | pass |
| 137 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 138 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: insert | 42501 | pass | pass | pass | pass |
| 139 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: update | 42501 | pass | pass | pass | pass |
| 140 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] newsletter: delete | 42501 | pass | pass | pass | pass |
| 141 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from public.subscriptions | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 142 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from public.plans | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 143 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from public.job_logs | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 144 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from public.product_newsletter | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 145 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from public.contacts | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 146 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from public.active_subscriptions | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 147 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from private.settings | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 148 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from private.paddle_events | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 149 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from private.paddle_unresolved_events | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 150 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from private.backup_prompts_null_user | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 151 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select from private.backup_newsletter_forged_owner | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 152 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: truncate public.catalogues | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 153 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: create table public.x (a int) | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 154 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: create function private.x() returns int language sql as 'select 1' | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 155 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select public.call_edge_function_with_vault_secret() | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 156 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select private.display_name_from_meta('{}') | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 157 | B2 owner matrix (Clerk ids, postgres login, plan wrapper) | [clerk ids] app_user: select private.handle_auth_user_created() | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 158 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | my_usage for A | {catalogues:2, prompts:1, ocr:1, pageviews:10, unique_visitors:4} | pass | pass | pass | pass |
| 159 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | my_usage with no sub | 0 | pass | pass | pass | pass |
| 160 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | begin_ai_turn on B's catalogue | not_found | pass | pass | pass | pass |
| 161 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | agent turn without continuation | charged | pass | pass | pass | pass |
| 162 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: continuation of a charged turn whose plan was never opened (no set_plan_state) | charged (new row) | pass | pass | pass | pass |
| 163 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: set_plan_state(open, 3 pending, H1) on own charged turn | true; budget 3, hash H1 | pass | pass | pass | pass |
| 164 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: continuation with correct turn id + hash within budget | continued, same turn id, continuations 1 | pass | pass | pass | pass |
| 165 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: forged hash (H2) with the right turn id | charged; continuations unchanged | pass | pass | pass | pass |
| 166 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: continuation without hash / without turn id | charged, charged | pass | pass | pass | pass |
| 167 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: right turn id + hash but a different catalogue | charged | pass | pass | pass | pass |
| 168 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: kind describe presenting the agent turn id + hash | charged (describe never continues) | pass | pass | pass | pass |
| 169 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: A presents B's open-plan turn id + hash (on B's catalogue / on own catalogue) | not_found, charged | pass | pass | pass | pass |
| 170 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: A calls set_plan_state on B's turn | false; B plan still open | pass | pass | pass | pass |
| 171 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: set_plan_state cannot raise the budget after the first open (8 requested) | true; budget stays 3 | pass | pass | pass | pass |
| 172 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: budget exhaustion (budget 3: continuations 2, 3 continue; 4th charged) | continued, continued, charged | pass | pass | pass | pass |
| 173 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: set_plan_state after a continuation updates the hash (budget unchanged); old hash charged, new hash continued | charged, continued; budget 5 | pass | pass | pass | pass |
| 174 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: plan closed by set_plan_state(null plan) -> continuation | charged; plan_open false, hash null | pass | pass | pass | pass |
| 175 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: expired window (turn 16 minutes old): continuation, set_plan_state | charged, false | pass | pass | pass | pass |
| 176 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8: describe turn: set_plan_state false; describe continuation charged | charged, false, charged | pass | pass | pass | pass |
| 177 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C8 validation: invalid kind 22023; bad hash format 22023 (uppercase too); negative limit 22023; no sub 42501; null catalogue not_found; null kind 22023 | 22023, 22023, 22023, 22023, 42501, not_found, 22023 | pass | pass | pass | pass |
| 178 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | limit check vs continuation (limit 1, 1 used): new turn / proven continuation / forged continuation | limit, continued (free), limit (no row added) | pass | pass | pass | pass |
| 179 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | refund own no-op turn, then again | true, false | pass | pass | pass | pass |
| 180 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | refund rules: open plan false; continued (then closed) false; >10 min false; B's turn false; no sub false | false x5 | pass | pass | pass | pass |
| 181 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | refunded row does not count towards the limit (limit = unrefunded + 1) | charged | pass | pass | pass | pass |
| 182 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | refund cap per month (ai_refund_cap_per_month = 2, 1 refund already this month) | true, false, false | pass | pass | pass | pass |
| 183 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | refund cap setting not numeric -> default 30 | true | pass | pass | pass | pass |
| 184 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | rows from a previous month are not counted | limit at current count, charged at +1 | pass | pass | pass | pass |
| 185 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | owner deletes a-draft: AI ledger rows survive | count 10, catalogue NULL | pass | pass | pass | pass |
| 186 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | ledger constraints: null user 23502; app_user UPDATE refunded_at / plan columns 42501; kind check 23514; budget range 23514 | 23502, 42501, 42501, 23514, 23514 | pass | pass | pass | pass |
| 187 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | M05 begin_ai_turn(text, integer, boolean) no longer exists after M06 | 42883 | pass | pass | pass | pass |
| 188 | B3 usage + AI ledger incl. M06 plan binding (C7, C8) | C7: begin_ai_turn (M06) and getPlanForUpdate lock the caller's users row FOR NO KEY UPDATE (no HEAP_KEYS_UPDATED), unlike FOR UPDATE | begin_ai_turn: excl lock-only, keys_updated=false; drizzle no key update: same; FOR UPDATE reference: keys_updated=true | pass | pass | pass | pass |
| 189 | B4 admin, worker and PostgREST perimeter (M01-M06) | asAdmin Paddle idempotency | 1 row then 0 | pass | pass | pass | pass |
| 190 | B4 admin, worker and PostgREST perimeter (M01-M06) | asAdmin Paddle: update users plan_id/customer_id | 1 row | pass | pass | pass | pass |
| 191 | B4 admin, worker and PostgREST perimeter (M01-M06) | asAdmin CRM view contacts | ok | pass | pass | pass | pass |
| 192 | B4 admin, worker and PostgREST perimeter (M01-M06) | worker: inactivate B's catalogues (touch trigger fires as service_role) | 2 rows | pass | pass | pass | pass |
| 193 | B4 admin, worker and PostgREST perimeter (M01-M06) | worker: analytics upsert | ok | pass | pass | pass | pass |
| 194 | B4 admin, worker and PostgREST perimeter (M01-M06) | PostgREST perimeter after M06: 3 identities x 14 relations x S/I/U/D + 9 RPCs | all 195 denied | pass | pass | pass | pass |
| 195 | B4 admin, worker and PostgREST perimeter (M01-M06) | no Supabase service role can SET ROLE app_user/app_public | all denied | pass | pass | pass | pass |
| 196 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: RLS enabled on every public table | empty | pass | pass | pass | pass |
| 197 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: anon/authenticated: no table or column privilege in public | empty | pass | pass | pass | pass |
| 198 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: anon/authenticated: no sequence privilege | empty | pass | pass | pass | pass |
| 199 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: anon/authenticated: no EXECUTE on public/private functions | empty | pass | pass | pass | pass |
| 200 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: no Supabase service role can become an app role | empty | pass | pass | pass | pass |
| 201 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: no private function is executable by PUBLIC | empty | pass | pass | pass | pass |
| 202 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: every SECURITY DEFINER function pins search_path to empty | empty | pass | pass | pass | pass |
| 203 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: app_public has no privilege on any public table except catalogues | empty | pass | pass | pass | pass |
| 204 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: app_user has nothing on system tables and CRM views | empty | pass | pass | pass | pass |
| 205 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: every policy uses (select private.current_user_id()) or no identity | empty | pass | pass | pass | pass |
| 206 | B4 admin, worker and PostgREST perimeter (M01-M06) | 00_perimeter catalog query: every policy targets app_user or app_public only | empty | pass | pass | pass | pass |
| 207 | B4 admin, worker and PostgREST perimeter (M01-M06) | postgres SET-only membership; no private USAGE for anon/authenticated; app_public no created_by | s=t u=f f f f | pass | pass | pass | pass |
| 208 | B4 admin, worker and PostgREST perimeter (M01-M06) | grants-match-columns: app_user UPDATE on catalogues | appearance,business_type,contact,content,currency,footer,header,heading,language,legal,logo,metadata,partners,status,tags,updated_at | pass | pass | pass | pass |
| 209 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | claims injection via bound parameter | literal sub; 0 rows; users intact | pass | pass | pass | pass |
| 210 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | wrapper sets role and search_path transaction-locally | app_user, 'public, pg_temp' | pass | pass | pass | pass |
| 211 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | after COMMIT: role/claims/search_path/timeouts reset on the pooled session | postgres, '', login search_path, 0 | pass | pass | pass | pass |
| 212 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | temp-table shadowing on a postgres-login pooled backend: A plants pg_temp.catalogues; B's unqualified Drizzle read/insert under the plan wrapper | B reads the real row; B's insert lands in public; builtins resolve | pass | pass | pass | pass |
| 213 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | threat model (phases 1 until M08, postgres login): injected SQL can rewrite claims and RESET ROLE to postgres | B's rows; postgres (documented residual risk R3) | pass | pass | pass | pass |
| 214 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | claims carrying role:'service_role' cannot change the DB role | app_user | pass | pass | pass | pass |
| 215 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | malformed claims string reaching the helper | 22P02 (fail closed) | pass | pass | pass | pass |
| 216 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | non-string sub (number) | uid '123', 0 rows | pass | pass | pass | pass |
| 217 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | DB-side role reachability from the postgres DB_CONNECTION_STRING session (until M08) | app_user/app_public allowed; service_role/authenticated/anon also allowed (TS allowlist only); supabase_admin denied | pass | pass | pass | pass |
| 218 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | after an error inside withUser (COMMIT acts as ROLLBACK) | postgres, uid null, login search_path | pass | pass | pass | pass |
| 219 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | wrapper statement accidentally run in autocommit: is_local settings end with the statement | postgres, uid null | pass | pass | pass | pass |
| 220 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | withPublic after withUser on the same connection carries no sub | {"role":"app_public"} | pass | pass | pass | pass |
| 221 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | SET ROLE does not apply ALTER ROLE ... SET (why the wrapper sets timeouts) | 8s | pass | pass | pass | pass |
| 222 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | ROLLBACK TO SAVEPOINT restores claims and keeps role and search_path | app_user, user_2aAaaaaaaaaaaaaaaaaaaaa1, public, pg_temp | pass | pass | pass | pass |
| 223 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | app_public: count(*) works with column grants; filtering on created_by denied | 2; 42501 | pass | pass | pass | pass |
| 224 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | app_user cannot create objects in public (operator/function shadowing); TEMP allowed (PUBLIC TEMP on the database, neutralised by search_path) | 42501; ok | pass | pass | pass | pass |
| 225 | B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path | pg_net residual (documented, not fixable by a postgres migration): app_user rename queues the webhook through the definer; app_public can read the queue and call net.http_post | rename ok; queue readable; http_post allowed | pass | pass | pass | pass |
| 226 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] createCatalogue (pickEditable strips createdBy/status/id) | created_by = A, status draft, id not client-chosen | pass | pass | pass | pass |
| 227 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] createCatalogue BUG variant: created_by = B | 42501 | pass | pass | pass | pass |
| 228 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] createCatalogue BUG variant: status active | 42501 | pass | pass | pass | pass |
| 229 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] createCatalogue with another owner's slug | 23505 via DrizzleQueryError.cause | pass | pass | pass | pass |
| 230 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] createCatalogue over plan quota | PlanLimitError catalogues | pass | pass | pass | pass |
| 231 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] duplicateItem: slug taken -> SAVEPOINT rollback -> -copy retry | a-live-copy, draft, A; role app_user and sub A after ROLLBACK TO SAVEPOINT | pass | pass | pass | pass |
| 232 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] duplicateItem of B's catalogue id | null | pass | pass | pass | pass |
| 233 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] publishCatalogue own draft with mass-assignment payload | active, A, id unchanged | pass | pass | pass | pass |
| 234 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] publishCatalogue BUG variant with createdBy | 42501 | pass | pass | pass | pass |
| 235 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] publishCatalogue of B's draft | null | pass | pass | pass | pass |
| 236 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] publishCatalogue over traffic limit (my_usage) | PlanLimitError traffic | pass | pass | pass | pass |
| 237 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] updateItemStatus on B's id | null | pass | pass | pass | pass |
| 238 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] updateItemStatus own | {name: a-live} | pass | pass | pass | pass |
| 239 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] deleteMultipleItems([own, B's]) all-or-nothing | null; both exist | pass | pass | pass | pass |
| 240 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] deleteItem('b-live') as A | false | pass | pass | pass | pass |
| 241 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] upsertQrConfig own twice + getOwnedQrConfig | success x2, v=2 | pass | pass | pass | pass |
| 242 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] upsertQrConfig onto B's catalogue | Not found (42501); B unchanged | pass | pass | pass | pass |
| 243 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] saveTheme upsert twice + list | same id, #222, only A's | pass | pass | pass | pass |
| 244 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] deleteSavedTheme(B's id) | false | pass | pass | pass | pass |
| 245 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] getMyUserData | A's row with usage | pass | pass | pass | pass |
| 246 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] saveCookiePreferences | true | pass | pass | pass | pass |
| 247 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] startAiTurn (getPlanForUpdate FOR NO KEY UPDATE + begin_ai_turn M06): charged, set_plan_state open, continuation with turn id + hash, B's catalogue, describe unlimited + refund, refund of open-plan turn | charged, true, continued (same turn id), not_found, charged, true, false | pass | pass | pass | pass |
| 248 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] checkCatalogueName | false, true | pass | pass | pass | pass |
| 249 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] public reads: active row without createdBy, draft null, names == active set | row; null; equal | pass | pass | pass | pass |
| 250 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] app_public select() / findFirst() without columns | 42501 both | pass | pass | pass | pass |
| 251 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] newsletterSignup x2 + productNewsletterSignup | 1 row owner user_2bBbbbbbbbbbbbbbbbbbbbb2 | pass | pass | pass | pass |
| 252 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] dashboard routes | only A's rows | pass | pass | pass | pass |
| 253 | B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login) | [clerk ids, M06] asAdmin claimEvent twice | true, false | pass | pass | pass | pass |
| 254 | B7 misc SQL semantics | policy helper planned as InitPlan | InitPlan | pass | pass | pass | pass |
| 255 | B7 misc SQL semantics | postgres can CREATE but not DROP a trigger on auth.users | ok; 42501 | pass | pass | pass | pass |
| 256 | B7 misc SQL semantics | after M01 a new postgres function in public is not executable by anon/app roles (global default revoke) | false,false | pass | pass | pass | pass |
| 257 | B7 misc SQL semantics | F8: legacy 1.5 MB compressible content passes M07 VALIDATE (compressed); heading update ok; content edit 23514; A.15 octet_length audit sees the raw size | validated; ok; 23514; raw > 1 MiB | pass | pass | pass | pass |
| 258 | C gate 1: M07 validate after audit | M07 on data that passes the A.15 audit | ok; 6 constraints validated | pass | pass | pass | pass |
| 259 | C gate 1: M07 validate after audit | M07 constraints validated | all 6 true | pass | pass | pass | pass |
| 260 | C gate 1: M07 validate after audit | C9 after M07: bad slug (app_user) 23514; 101-char slug 23514; oversized appearance 23514; normal update ok; bad slug via asAdmin 23514 | 23514, 23514, 23514, ok, 23514 | pass | pass | pass | pass |
| 261 | C gate 1: M07 validate after audit | M07 with a legacy bad slug ('Legacy Name'): fails loudly, whole migration rolled back | 23514 catalogues_name_slug; no M07 constraint left; size checks still NOT VALID | pass | pass | pass | pass |
| 262 | C gate 1: M07 validate after audit | M07 with an oversized appearance (no individual NOT VALID check existed): fails loudly on catalogues_other_json_size | 23514 | pass | pass | pass | pass |
| 263 | C gate 1: M07 validate after audit | NOT VALID semantics vs the M03 header comment: legacy row whose STORED colors exceed 4 KiB - unrelated UPDATE (set name = name); then M07 VALIDATE | M03 comment claims only UPDATEs that rewrite the column are checked: unrelated update ok; M07 23514 | **FAIL** | **FAIL** | pass | pass |
| 264 | D gate 1 end: M08 app_rls | apply M08 as postgres | ok | pass | pass | pass | pass |
| 265 | E Track K: M09 | apply M09 as postgres | ok | pass | pass | pass | pass |
| 266 | F gate 2: M10 | apply M10 as postgres | ok | pass | pass | pass | pass |
| 267 | D gate 1 end: M08 app_rls | app_rls login: search_path and backstop timeouts applied at login | search_path 'public, pg_temp'; 8s / 3s / 10s | pass | pass | pass | pass |
| 268 | D gate 1 end: M08 app_rls | forgotten wrapper: raw queries as app_rls (tables, views, private functions, unqualified names) | all 42501 | pass | pass | pass | pass |
| 269 | D gate 1 end: M08 app_rls | app_rls + wrapper: withUser(A) / withPublic | a-draft,a-live / a-live,b-live | pass | pass | pass | pass |
| 270 | D gate 1 end: M08 app_rls | app_rls role reachability | only app_user, app_public (and itself) | pass | pass | pass | pass |
| 271 | D gate 1 end: M08 app_rls | injected RESET ROLE inside the wrapper lands on app_rls without privileges; SET ROLE postgres denied | 42501 (current_user app_rls; set postgres 42501) | pass | pass | pass | pass |
| 272 | D gate 1 end: M08 app_rls | temp-table shadowing under app_rls: planted pg_temp.catalogues vs B's unqualified read (with wrapper search_path / with M08 login search_path only) | real row both times | pass | pass | pass | pass |
| 273 | D gate 1 end: M08 app_rls | app_rls attributes and SET-only memberships | login, noinherit, nobypassrls, connlimit 40, SET true / USAGE false | pass | pass | pass | pass |
| 274 | D gate 1 end: M08 app_rls | re-apply M08 (role exists) | ok | pass | pass | pass | pass |
| 275 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A selects users | only A | pass | pass | pass | pass |
| 276 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own plan_id | 42501 | pass | pass | pass | pass |
| 277 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own customer_id | 42501 | pass | pass | pass | pass |
| 278 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own email | 42501 | pass | pass | pass | pass |
| 279 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own consents | 42501 | pass | pass | pass | pass |
| 280 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own id | 42501 | pass | pass | pass | pass |
| 281 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own image | 42501 | pass | pass | pass | pass |
| 282 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own created_at | 42501 | pass | pass | pass | pass |
| 283 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates B's name | 0 rows | pass | pass | pass | pass |
| 284 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A updates own cookie_preferences | 1 row | pass | pass | pass | pass |
| 285 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: cookie_preferences > 2 KiB | 23514 | pass | pass | pass | pass |
| 286 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: getPlanForUpdate SELECT ... FOR NO KEY UPDATE own row | 1 row | pass | pass | pass | pass |
| 287 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: SELECT ... FOR NO KEY UPDATE on B's row | 0 rows | pass | pass | pass | pass |
| 288 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A inserts a users row | 42501 | pass | pass | pass | pass |
| 289 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] users: A deletes B (cascade-delete attack) | 42501 | pass | pass | pass | pass |
| 290 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A selects all | a-draft, a-live (not B's) | pass | pass | pass | pass |
| 291 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A updates B's active catalogue | 0 rows | pass | pass | pass | pass |
| 292 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A deletes B's draft | 0 rows | pass | pass | pass | pass |
| 293 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A sets created_by on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 294 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A sets name on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 295 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A sets id on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 296 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A sets created_at on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 297 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A sets source on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 298 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A updates own editable fields (returning) | 1 row, updated_at touched | pass | pass | pass | pass |
| 299 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: invalid status | 23514 | pass | pass | pass | pass |
| 300 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: publish own draft (status active via UPDATE) | 1 row | pass | pass | pass | pass |
| 301 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A inserts status active | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 302 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A inserts created_by = B | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 303 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: Drizzle-shaped INSERT (every column, default, client id/created_at) + RETURNING | 1 row; id and created_at pinned; status draft | pass | pass | pass | pass |
| 304 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: duplicateItem (INSERT ... SELECT own row as draft) | 1 row | pass | pass | pass | pass |
| 305 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: duplicate B's catalogue (source row invisible) | 0 rows inserted | pass | pass | pass | pass |
| 306 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: publishCatalogue mass-assignment of createdBy/id | 42501 | pass | pass | pass | pass |
| 307 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: content > 1 MiB | 23514 | pass | pass | pass | pass |
| 308 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: insert with a taken slug | 23505 | pass | pass | pass | pass |
| 309 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: A deletes own a-draft; usage rows survive (prompts catalogue set NULL) | RESET ROLE lands on app_rls: count query 42501 | pass | pass | pass | pass |
| 310 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: fail closed with claims {} (no sub) | 0 rows | pass | pass | pass | pass |
| 311 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] catalogues: fail closed with sub '' | 0 rows | pass | pass | pass | pass |
| 312 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select name from catalogues | a-live, b-live | pass | pass | pass | pass |
| 313 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select * (created_by not granted) | 42501 | pass | pass | pass | pass |
| 314 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: PUBLIC_CATALOGUE_COLUMNS select of an active catalogue | 1 row | pass | pass | pass | pass |
| 315 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: draft by name | 0 rows | pass | pass | pass | pass |
| 316 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: insert into public.catalogues | 42501 | pass | pass | pass | pass |
| 317 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: update public.catalogues set | 42501 | pass | pass | pass | pass |
| 318 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: delete from public.catalogues | 42501 | pass | pass | pass | pass |
| 319 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from users | 42501 | pass | pass | pass | pass |
| 320 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from newsletter | 42501 | pass | pass | pass | pass |
| 321 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from prompts | 42501 | pass | pass | pass | pass |
| 322 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from ocr | 42501 | pass | pass | pass | pass |
| 323 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from analytics | 42501 | pass | pass | pass | pass |
| 324 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from qr_configs | 42501 | pass | pass | pass | pass |
| 325 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from user_themes | 42501 | pass | pass | pass | pass |
| 326 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from subscriptions | 42501 | pass | pass | pass | pass |
| 327 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from plans | 42501 | pass | pass | pass | pass |
| 328 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from job_logs | 42501 | pass | pass | pass | pass |
| 329 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from product_newsletter | 42501 | pass | pass | pass | pass |
| 330 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from contacts | 42501 | pass | pass | pass | pass |
| 331 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select from active_subscriptions | 42501 | pass | pass | pass | pass |
| 332 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select private.catalogue_name_available('x') | 42501 | pass | pass | pass | pass |
| 333 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select private.my_usage() | 42501 | pass | pass | pass | pass |
| 334 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select private.begin_ai_turn('a-live', 1, 'agent', null, null) | 42501 | pass | pass | pass | pass |
| 335 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select private.set_plan_state(gen_random_uuid(), false, 0, null) | 42501 | pass | pass | pass | pass |
| 336 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select private.refund_ai_turn(gen_random_uuid()) | 42501 | pass | pass | pass | pass |
| 337 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: select private.current_user_id() | 42501 | pass | pass | pass | pass |
| 338 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_public: private.settings | 42501 | pass | pass | pass | pass |
| 339 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: app_public signup x3 (case/space variants) to active+enabled b-live | 3 calls ok; exactly 1 row foo@example.com owner user_2bBbbbbbbbbbbbbbbbbbbbb2 | pass | pass | pass | pass |
| 340 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: draft / disabled / invalid / 300-char / random uuid / case-variant / null / C6 formula (=HYPERLINK, DDE pipe), quotes, apostrophe, no TLD -> silent no-op | 13 calls ok, 0 new rows | pass | pass | pass | pass |
| 341 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] C6: normal addresses (dots, plus tag, subdomains, %, _, -) are accepted; a leading + is also accepted (CSV export escaping must neutralise it) | +3 rows | pass | pass | pass | pass |
| 342 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: malformed catalogue id | 22P02 (TS must validate) | pass | pass | pass | pass |
| 343 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: app_public direct insert with spoofed owner_id | 42501 | pass | pass | pass | pass |
| 344 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: app_user direct insert | 42501 | pass | pass | pass | pass |
| 345 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] product newsletter: X@y.io, x@Y.io, existing P@X.io, formula payload | all ok; +1 row | pass | pass | pass | pass |
| 346 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability: B's draft slug | false | pass | pass | pass | pass |
| 347 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability: free slug | true | pass | pass | pass | pass |
| 348 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability: own slug | false | pass | pass | pass | pass |
| 349 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability: empty string | false | pass | pass | pass | pass |
| 350 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability: null | false | pass | pass | pass | pass |
| 351 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability: free slug with no sub | false | pass | pass | pass | pass |
| 352 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] name availability leaks nothing else: A cannot read B's draft row | 0 rows | pass | pass | pass | pass |
| 353 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: insert for own a-draft | 1 row | pass | pass | pass | pass |
| 354 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: insert for B's b-draft | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 355 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: upsert onto B's existing b-live row | 42501 | pass | pass | pass | pass |
| 356 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: select B's | 0 rows | pass | pass | pass | pass |
| 357 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: delete B's | 0 rows | pass | pass | pass | pass |
| 358 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: upsertQrConfig on own existing row | 1 row config v=2 | pass | pass | pass | pass |
| 359 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: move own config to B's catalogue | 42501 | pass | pass | pass | pass |
| 360 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] qr_configs: second row for the same catalogue | 23505 | pass | pass | pass | pass |
| 361 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] user_themes: insert for B | 42501 | pass | pass | pass | pass |
| 362 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] user_themes: persistTheme upsert twice | 1 row, colors {i:1} | pass | pass | pass | pass |
| 363 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] user_themes: update B's | 0 rows | pass | pass | pass | pass |
| 364 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] user_themes: reassign own theme to B | 42501 | pass | pass | pass | pass |
| 365 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] user_themes: select | own only (t1) | pass | pass | pass | pass |
| 366 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] analytics: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 367 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] analytics: insert | 42501 | pass | pass | pass | pass |
| 368 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] analytics: update | 42501 | pass | pass | pass | pass |
| 369 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] analytics: delete | 42501 | pass | pass | pass | pass |
| 370 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] prompts: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 371 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] prompts: insert | 42501 | pass | pass | pass | pass |
| 372 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] prompts: update | 42501 | pass | pass | pass | pass |
| 373 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] prompts: delete | 42501 | pass | pass | pass | pass |
| 374 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] ocr: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 375 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] ocr: insert | 42501 | pass | pass | pass | pass |
| 376 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] ocr: update | 42501 | pass | pass | pass | pass |
| 377 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] ocr: delete | 42501 | pass | pass | pass | pass |
| 378 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 379 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: insert | 42501 | pass | pass | pass | pass |
| 380 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: update | 42501 | pass | pass | pass | pass |
| 381 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] newsletter: delete | 42501 | pass | pass | pass | pass |
| 382 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from public.subscriptions | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 383 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from public.plans | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 384 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from public.job_logs | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 385 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from public.product_newsletter | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 386 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from public.contacts | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 387 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from public.active_subscriptions | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 388 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from private.settings | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 389 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from private.paddle_events | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 390 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from private.paddle_unresolved_events | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 391 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from private.backup_prompts_null_user | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 392 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select from private.backup_newsletter_forged_owner | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 393 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: truncate public.catalogues | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 394 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: create table public.x (a int) | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 395 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: create function private.x() returns int language sql as 'select 1' | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 396 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select public.call_edge_function_with_vault_secret() | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 397 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select private.display_name_from_meta('{}') | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 398 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, app_rls login] app_user: select private.handle_auth_user_created() | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 399 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] createCatalogue (pickEditable strips createdBy/status/id) | created_by = A, status draft, id not client-chosen | pass | pass | pass | pass |
| 400 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] createCatalogue BUG variant: created_by = B | 42501 | pass | pass | pass | pass |
| 401 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] createCatalogue BUG variant: status active | 42501 | pass | pass | pass | pass |
| 402 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] createCatalogue with another owner's slug | 23505 via DrizzleQueryError.cause | pass | pass | pass | pass |
| 403 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] createCatalogue over plan quota | PlanLimitError catalogues | pass | pass | pass | pass |
| 404 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] duplicateItem: slug taken -> SAVEPOINT rollback -> -copy retry | a-live-copy, draft, A; role app_user and sub A after ROLLBACK TO SAVEPOINT | pass | pass | pass | pass |
| 405 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] duplicateItem of B's catalogue id | null | pass | pass | pass | pass |
| 406 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] publishCatalogue own draft with mass-assignment payload | active, A, id unchanged | pass | pass | pass | pass |
| 407 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] publishCatalogue BUG variant with createdBy | 42501 | pass | pass | pass | pass |
| 408 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] publishCatalogue of B's draft | null | pass | pass | pass | pass |
| 409 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] publishCatalogue over traffic limit (my_usage) | PlanLimitError traffic | pass | pass | pass | pass |
| 410 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] updateItemStatus on B's id | null | pass | pass | pass | pass |
| 411 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] updateItemStatus own | {name: a-live} | pass | pass | pass | pass |
| 412 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] deleteMultipleItems([own, B's]) all-or-nothing | null; both exist | pass | pass | pass | pass |
| 413 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] deleteItem('b-live') as A | false | pass | pass | pass | pass |
| 414 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] upsertQrConfig own twice + getOwnedQrConfig | success x2, v=2 | pass | pass | pass | pass |
| 415 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] upsertQrConfig onto B's catalogue | Not found (42501); B unchanged | pass | pass | pass | pass |
| 416 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] saveTheme upsert twice + list | same id, #222, only A's | pass | pass | pass | pass |
| 417 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] deleteSavedTheme(B's id) | false | pass | pass | pass | pass |
| 418 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] getMyUserData | A's row with usage | pass | pass | pass | pass |
| 419 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] saveCookiePreferences | true | pass | pass | pass | pass |
| 420 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] startAiTurn (getPlanForUpdate FOR NO KEY UPDATE + begin_ai_turn M06): charged, set_plan_state open, continuation with turn id + hash, B's catalogue, describe unlimited + refund, refund of open-plan turn | charged, true, continued (same turn id), not_found, charged, true, false | pass | pass | pass | pass |
| 421 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] checkCatalogueName | false, true | pass | pass | pass | pass |
| 422 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] public reads: active row without createdBy, draft null, names == active set | row; null; equal | pass | pass | pass | pass |
| 423 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] app_public select() / findFirst() without columns | 42501 both | pass | pass | pass | pass |
| 424 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] newsletterSignup x2 + productNewsletterSignup | 1 row owner user_2bBbbbbbbbbbbbbbbbbbbbb2 | pass | pass | pass | pass |
| 425 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] dashboard routes | only A's rows | pass | pass | pass | pass |
| 426 | D2 owner matrix and Drizzle app layer under the app_rls login | [clerk ids, DB_CONNECTION_STRING=app_rls] asAdmin claimEvent twice | true, false | pass | pass | pass | pass |
| 427 | E Track K: M09 edge webhook secret | M09 function definition: SECURITY DEFINER, search_path '', ACL without PUBLIC/anon/authenticated | x-webhook-secret in body; acl postgres+service_role | pass | pass | pass | pass |
| 428 | E Track K: M09 edge webhook secret | no edge_functions_base_url: update ok, trigger warns and skips | ok; 0 calls; WARNING | pass | pass | pass | pass |
| 429 | E Track K: M09 edge webhook secret | base url but no Vault credential: update ok, skipped with WARNING | ok; 0 calls | pass | pass | pass | pass |
| 430 | E Track K: M09 edge webhook secret | transition fallback (only service_role_key in Vault): Bearer header | 1 call with Authorization Bearer, no x-webhook-secret | pass | pass | pass | pass |
| 431 | E Track K: M09 edge webhook secret | C10: with edge_webhook_secret: app_user rename (users trigger) and subscriptions insert (CRM + Discord triggers) send x-webhook-secret and NO Authorization header | 3 calls, each x-webhook-secret=whsec_test_123, has_auth=false | pass | pass | pass | pass |
| 432 | E Track K: M09 edge webhook secret | residual (documented): app roles can read the pg_net queue, which now holds the webhook secret instead of the service_role key | readable (pg_net PUBLIC ACL, not fixable by a postgres migration) | pass | pass | pass | pass |
| 433 | E Track K: M09 edge webhook secret | Sync Plans cron definition after M09 | one job, '0 8 */3 * *', owner postgres, command reads private.settings + edge_webhook_secret | pass | pass | pass | pass |
| 434 | E Track K: M09 edge webhook secret | Sync Plans command as postgres (job owner) with the secret | 1 call to .../sync-available-plans with x-webhook-secret, no Authorization | pass | pass | pass | pass |
| 435 | E Track K: M09 edge webhook secret | Sync Plans command with neither secret nor key in Vault | no request (trigger function skips in that case) | **FAIL** | **FAIL** | pass | pass |
| 436 | E Track K: M09 edge webhook secret | validation of the edge_functions_base_url setting: trailing slash, http/foreign host, query suffix, leading space are rejected; local stack URL accepted | 4 rejected (23514); local ok | **FAIL** | **FAIL** | pass | pass |
| 437 | E Track K: M09 edge webhook secret | M09 apply keeps exactly one 'Sync Plans' job (cron.schedule upsert by name) | ok; 1 job | pass | pass | pass | pass |
| 438 | F gate 2: M10 auth sync | C11: M10 on a project with live webhooks: apply ok, legacy consent marker update sends no webhook, existing booleans kept + source legacy_default | ok; 0 calls; every row source=legacy_default | pass | pass | pass | pass |
| 439 | F gate 2: M10 auth sync | M10 shape: 3 triggers on auth.users enabled, default plan seeded, not-accepted consents default, migration schema private, function ACLs | as designed | pass | pass | pass | pass |
| 440 | F gate 2: M10 auth sync | plan 6.3 import-script guard: pg_get_functiondef('private.handle_auth_user_created'::regproc) contains clerk_user_map | true | pass | pass | pass | pass |
| 441 | F gate 2: M10 auth sync | email sign-up (unconfirmed, GoTrue INSERT then app_metadata UPDATE): public.users row, default plan, not-accepted consents (never null), non-Google avatar dropped | row; plan Starter; consents false x3, source signup; image null; name Ana | pass | pass | pass | pass |
| 442 | F gate 2: M10 auth sync | unconfirmed email sign-up and the Brevo webhook: no CRM contact for an address nobody has confirmed (anyone can sign up with a third party's email) | 0 Brevo calls before confirmation; row + 1 call after email_confirmed_at is set | **FAIL** | **FAIL** | pass | pass |
| 443 | F gate 2: M10 auth sync | confirmation (GoTrue UPDATE email_confirmed_at): row exists afterwards with sign-up metadata; exactly one Brevo call in total | row; 1 call | pass | pass | pass | pass |
| 444 | F gate 2: M10 auth sync | OAuth (Google) user with confirmed email: row with Google avatar, full_name, consents not accepted (gate) | image lh3, name 'Gee Google', consents false | pass | pass | pass | pass |
| 445 | F gate 2: M10 auth sync | OAuth insert then separate confirm UPDATE: exactly one row with the Google avatar ('picture') | 1 row, image lh3 | pass | pass | pass | pass |
| 446 | F gate 2: M10 auth sync | consent contract: terms_version unset -> false; matching -> true with version/accepted_at; stale version or legacy booleans in metadata -> false | false/null; true 2026-09 + accepted_at; false | pass | pass | pass | pass |
| 447 | F gate 2: M10 auth sync | imported Clerk user (map row claimed first, then INSERT + app_metadata UPDATE + later confirm/metadata UPDATE): no public.users row, no Brevo call | 0 rows; 0 calls | pass | pass | pass | pass |
| 448 | F gate 2: M10 auth sync | why the claim must come first: same createUser order WITHOUT a map row creates a default public.users row (app_metadata arrives after the INSERT) | 1 row (documented P5 behaviour) | pass | pass | pass | pass |
| 449 | F gate 2: M10 auth sync | anonymous user: no row; phone user (no email): row with null email | 0; 1 | pass | pass | pass | pass |
| 450 | F gate 2: M10 auth sync | avatar rules (Google lh*.googleusercontent.com over https only, <= 2048 chars, avatar_url wins over picture) | all as expected | pass | pass | pass | pass |
| 451 | F gate 2: M10 auth sync | email change sync (after confirmation): lowercased; one Brevo call | changed@example.com; 1 call | pass | pass | pass | pass |
| 452 | F gate 2: M10 auth sync | no name sync from user_metadata; existing image not overwritten; null image filled from a Google avatar | name Custom, image unchanged; filled | pass | pass | pass | pass |
| 453 | F gate 2: M10 auth sync | public.users consents default is not-accepted (source default) | false x3, source default | pass | pass | pass | pass |
| 454 | F gate 2: M10 auth sync | current_terms_version: app_user and app_public read it; anon via PostgREST denied | 2026-09, 2026-09, 42501 | pass | pass | pass | pass |
| 455 | F gate 2: M10 auth sync | record_consents: stale 22023, null 22023, current ok (true, version, accepted_at, source gate), no sub 42501, app_public 42501 | 22023, 22023, ok, 42501, 42501 | pass | pass | pass | pass |
| 456 | F gate 2: M10 auth sync | claim_welcome_email: once per user; app_public denied; other users untouched | 1 row (victim@example.com, Ana), 0 rows, 42501 | pass | pass | pass | pass |
| 457 | F gate 2: M10 auth sync | deletion: auth.users delete removes public.users and owned rows; migration.auth_user_deletions logs both (clerk id only for the mapped user) | users 0, cats 0, 2 log rows | pass | pass | pass | pass |
| 458 | F gate 2: M10 auth sync | uuid user under withUser sees only own row; same user with a real JWT via PostgREST 42501; app_user cannot read migration.* | own row; 42501; 42501 | pass | pass | pass | pass |
| 459 | F gate 2: M10 auth sync | contacts view (CRM export) still works with the new consents objects | ok | pass | pass | pass | pass |
| 460 | F gate 2: M10 auth sync | missing default_plan_id blocks sign-up loudly | P0001 | pass | pass | pass | pass |
| 461 | F gate 2: M10 auth sync | sign-up with webhook secret + base url present succeeds (Brevo trigger does not block) | ok | pass | pass | pass | pass |
| 462 | F gate 2: M10 auth sync | re-apply M10 | fails 42710 trigger exists (informational: migrations run once; never add DROP TRIGGER) | pass | pass | pass | pass |
| 463 | G1 import emulation (M00-M10 applied) | import of 3 Clerk users (claim -> admin.createUser order -> confirm -> identities -> migrated): no uuid public.users rows, no webhook calls | all steps ok; 0 rows; 0 calls | pass | pass | pass | pass |
| 464 | G1 import emulation (M00-M10 applied) | A.15 Phase 3/4 queries (uncommented) after the import | claimed 0 / migrated 3; unmapped_auth_users 0; unmapped_paying_users 0 | pass | pass | pass | pass |
| 465 | G1 import emulation (M00-M10 applied) | A.R1 lock order (C12 'strongest lock first'): locks already held on public.users when ACCESS EXCLUSIVE is requested | none (no AccessShare -> AccessExclusive upgrade; preconditions checked under the lock) | **FAIL** | **FAIL** | pass | pass |
| 466 | G1 import emulation (M00-M10 applied) | A.R2 lock order (C12 'strongest lock first'): locks already held on public.users when ACCESS EXCLUSIVE is requested | none (no AccessShare -> AccessExclusive upgrade; preconditions checked under the lock) | **FAIL** | **FAIL** | pass | pass |
| 467 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: unmapped user with a Paddle customer_id (C) | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 468 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: analytics_upsert_trigger present | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 469 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: map row still claimed | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 470 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: auth.users row outside the map (dark test user) | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 471 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: mapped uuid already present in public.users | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 472 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: map row migrated without auth.users | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 473 | G2 A.R1 preconditions (each on a copy of the post-import state) | A.R1 aborts: default_plan_id not in plans | exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO) | pass | pass | pass | pass |
| 474 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | A.R1 as psql -v ON_ERROR_STOP=1 (meta-command \set is psql-only and was not sent to the server) | COMMIT | pass | pass | pass | pass |
| 475 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | A.R1: per-user plan, customer and owned counts preserved across the re-key (A, B re-keyed; C legacy orphan untouched) | no differences | pass | pass | pass | pass |
| 476 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | A.R1 profile rules: emails from auth.users lowercased; Clerk image -> null (A) or mapped Google avatar (B); newer cookie consent (A); welcome_email_sent_at set; D inserted with default plan, name Dora, not-accepted consents | as designed | pass | pass | pass | pass |
| 477 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | V-queries after A.R1 (reconstructed): V1=1 (accepted orphan C), V2=0, V3=0, V4=0, V5=0, V7=0, V9 OOO, V10 false; catalogues.updated_at unchanged; no webhooks; cutover_log remap | as listed | pass | pass | pass | pass |
| 478 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | M11 after A.R1 (constraint already present) and again | ok, ok; still NOT VALID | pass | pass | pass | pass |
| 479 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | after the re-key: legacy orphan row cannot be updated (NOT VALID CHECK); stale Clerk id insert 23514; stale owner FK 23503; old Clerk sub sees nothing; uuid sub sees own | 23514, 23514, 23503, 0 rows, a-draft/a-live | pass | pass | pass | pass |
| 480 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | migrated users (re-keyed A, inserted D) never receive a welcome email | 0 rows, 0 rows | pass | pass | pass | pass |
| 481 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A selects users | only A | pass | pass | pass | pass |
| 482 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own plan_id | 42501 | pass | pass | pass | pass |
| 483 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own customer_id | 42501 | pass | pass | pass | pass |
| 484 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own email | 42501 | pass | pass | pass | pass |
| 485 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own consents | 42501 | pass | pass | pass | pass |
| 486 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own id | 42501 | pass | pass | pass | pass |
| 487 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own image | 42501 | pass | pass | pass | pass |
| 488 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own created_at | 42501 | pass | pass | pass | pass |
| 489 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates B's name | 0 rows | pass | pass | pass | pass |
| 490 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A updates own cookie_preferences | 1 row | pass | pass | pass | pass |
| 491 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: cookie_preferences > 2 KiB | 23514 | pass | pass | pass | pass |
| 492 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: getPlanForUpdate SELECT ... FOR NO KEY UPDATE own row | 1 row | pass | pass | pass | pass |
| 493 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: SELECT ... FOR NO KEY UPDATE on B's row | 0 rows | pass | pass | pass | pass |
| 494 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A inserts a users row | 42501 | pass | pass | pass | pass |
| 495 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] users: A deletes B (cascade-delete attack) | 42501 | pass | pass | pass | pass |
| 496 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A selects all | a-draft, a-live (not B's) | pass | pass | pass | pass |
| 497 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A updates B's active catalogue | 0 rows | pass | pass | pass | pass |
| 498 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A deletes B's draft | 0 rows | pass | pass | pass | pass |
| 499 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A sets created_by on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 500 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A sets name on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 501 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A sets id on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 502 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A sets created_at on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 503 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A sets source on own catalogue (mass assignment) | 42501 | pass | pass | pass | pass |
| 504 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A updates own editable fields (returning) | 1 row, updated_at touched | pass | pass | pass | pass |
| 505 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: invalid status | 23514 | pass | pass | pass | pass |
| 506 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: publish own draft (status active via UPDATE) | 1 row | pass | pass | pass | pass |
| 507 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A inserts status active | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 508 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A inserts created_by = B | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 509 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: Drizzle-shaped INSERT (every column, default, client id/created_at) + RETURNING | 1 row; id and created_at pinned; status draft | pass | pass | pass | pass |
| 510 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: duplicateItem (INSERT ... SELECT own row as draft) | 1 row | pass | pass | pass | pass |
| 511 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: duplicate B's catalogue (source row invisible) | 0 rows inserted | pass | pass | pass | pass |
| 512 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: publishCatalogue mass-assignment of createdBy/id | 42501 | pass | pass | pass | pass |
| 513 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: content > 1 MiB | 23514 | pass | pass | pass | pass |
| 514 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: insert with a taken slug | 23505 | pass | pass | pass | pass |
| 515 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: A deletes own a-draft; usage rows survive (prompts catalogue set NULL) | RESET ROLE lands on app_rls: count query 42501 | pass | pass | pass | pass |
| 516 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: fail closed with claims {} (no sub) | 0 rows | pass | pass | pass | pass |
| 517 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] catalogues: fail closed with sub '' | 0 rows | pass | pass | pass | pass |
| 518 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select name from catalogues | a-live, b-live | pass | pass | pass | pass |
| 519 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select * (created_by not granted) | 42501 | pass | pass | pass | pass |
| 520 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: PUBLIC_CATALOGUE_COLUMNS select of an active catalogue | 1 row | pass | pass | pass | pass |
| 521 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: draft by name | 0 rows | pass | pass | pass | pass |
| 522 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: insert into public.catalogues | 42501 | pass | pass | pass | pass |
| 523 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: update public.catalogues set | 42501 | pass | pass | pass | pass |
| 524 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: delete from public.catalogues | 42501 | pass | pass | pass | pass |
| 525 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from users | 42501 | pass | pass | pass | pass |
| 526 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from newsletter | 42501 | pass | pass | pass | pass |
| 527 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from prompts | 42501 | pass | pass | pass | pass |
| 528 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from ocr | 42501 | pass | pass | pass | pass |
| 529 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from analytics | 42501 | pass | pass | pass | pass |
| 530 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from qr_configs | 42501 | pass | pass | pass | pass |
| 531 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from user_themes | 42501 | pass | pass | pass | pass |
| 532 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from subscriptions | 42501 | pass | pass | pass | pass |
| 533 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from plans | 42501 | pass | pass | pass | pass |
| 534 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from job_logs | 42501 | pass | pass | pass | pass |
| 535 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from product_newsletter | 42501 | pass | pass | pass | pass |
| 536 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from contacts | 42501 | pass | pass | pass | pass |
| 537 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select from active_subscriptions | 42501 | pass | pass | pass | pass |
| 538 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select private.catalogue_name_available('x') | 42501 | pass | pass | pass | pass |
| 539 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select private.my_usage() | 42501 | pass | pass | pass | pass |
| 540 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select private.begin_ai_turn('a-live', 1, 'agent', null, null) | 42501 | pass | pass | pass | pass |
| 541 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select private.set_plan_state(gen_random_uuid(), false, 0, null) | 42501 | pass | pass | pass | pass |
| 542 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select private.refund_ai_turn(gen_random_uuid()) | 42501 | pass | pass | pass | pass |
| 543 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: select private.current_user_id() | 42501 | pass | pass | pass | pass |
| 544 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_public: private.settings | 42501 | pass | pass | pass | pass |
| 545 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: app_public signup x3 (case/space variants) to active+enabled b-live | 3 calls ok; exactly 1 row foo@example.com owner 22222222-2222-4222-8222-222222222222 | pass | pass | pass | pass |
| 546 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: draft / disabled / invalid / 300-char / random uuid / case-variant / null / C6 formula (=HYPERLINK, DDE pipe), quotes, apostrophe, no TLD -> silent no-op | 13 calls ok, 0 new rows | pass | pass | pass | pass |
| 547 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] C6: normal addresses (dots, plus tag, subdomains, %, _, -) are accepted; a leading + is also accepted (CSV export escaping must neutralise it) | +3 rows | pass | pass | pass | pass |
| 548 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: malformed catalogue id | 22P02 (TS must validate) | pass | pass | pass | pass |
| 549 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: app_public direct insert with spoofed owner_id | 42501 | pass | pass | pass | pass |
| 550 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: app_user direct insert | 42501 | pass | pass | pass | pass |
| 551 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] product newsletter: X@y.io, x@Y.io, existing P@X.io, formula payload | all ok; +1 row | pass | pass | pass | pass |
| 552 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability: B's draft slug | false | pass | pass | pass | pass |
| 553 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability: free slug | true | pass | pass | pass | pass |
| 554 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability: own slug | false | pass | pass | pass | pass |
| 555 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability: empty string | false | pass | pass | pass | pass |
| 556 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability: null | false | pass | pass | pass | pass |
| 557 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability: free slug with no sub | false | pass | pass | pass | pass |
| 558 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] name availability leaks nothing else: A cannot read B's draft row | 0 rows | pass | pass | pass | pass |
| 559 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: insert for own a-draft | 1 row | pass | pass | pass | pass |
| 560 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: insert for B's b-draft | 42501 (WITH CHECK) | pass | pass | pass | pass |
| 561 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: upsert onto B's existing b-live row | 42501 | pass | pass | pass | pass |
| 562 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: select B's | 0 rows | pass | pass | pass | pass |
| 563 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: delete B's | 0 rows | pass | pass | pass | pass |
| 564 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: upsertQrConfig on own existing row | 1 row config v=2 | pass | pass | pass | pass |
| 565 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: move own config to B's catalogue | 42501 | pass | pass | pass | pass |
| 566 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] qr_configs: second row for the same catalogue | 23505 | pass | pass | pass | pass |
| 567 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] user_themes: insert for B | 42501 | pass | pass | pass | pass |
| 568 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] user_themes: persistTheme upsert twice | 1 row, colors {i:1} | pass | pass | pass | pass |
| 569 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] user_themes: update B's | 0 rows | pass | pass | pass | pass |
| 570 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] user_themes: reassign own theme to B | 42501 | pass | pass | pass | pass |
| 571 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] user_themes: select | own only (t1) | pass | pass | pass | pass |
| 572 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] analytics: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 573 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] analytics: insert | 42501 | pass | pass | pass | pass |
| 574 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] analytics: update | 42501 | pass | pass | pass | pass |
| 575 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] analytics: delete | 42501 | pass | pass | pass | pass |
| 576 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] prompts: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 577 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] prompts: insert | 42501 | pass | pass | pass | pass |
| 578 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] prompts: update | 42501 | pass | pass | pass | pass |
| 579 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] prompts: delete | 42501 | pass | pass | pass | pass |
| 580 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] ocr: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 581 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] ocr: insert | 42501 | pass | pass | pass | pass |
| 582 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] ocr: update | 42501 | pass | pass | pass | pass |
| 583 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] ocr: delete | 42501 | pass | pass | pass | pass |
| 584 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: select | only own rows (foreign = 0, n > 0) | pass | pass | pass | pass |
| 585 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: insert | 42501 | pass | pass | pass | pass |
| 586 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: update | 42501 | pass | pass | pass | pass |
| 587 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] newsletter: delete | 42501 | pass | pass | pass | pass |
| 588 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from public.subscriptions | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 589 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from public.plans | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 590 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from public.job_logs | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 591 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from public.product_newsletter | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 592 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from public.contacts | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 593 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from public.active_subscriptions | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 594 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from private.settings | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 595 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from private.paddle_events | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 596 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from private.paddle_unresolved_events | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 597 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from private.backup_prompts_null_user | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 598 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select from private.backup_newsletter_forged_owner | 42501 (or 42P01 once dropped by M13) | pass | pass | pass | pass |
| 599 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: truncate public.catalogues | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 600 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: create table public.x (a int) | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 601 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: create function private.x() returns int language sql as 'select 1' | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 602 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select public.call_edge_function_with_vault_secret() | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 603 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select private.display_name_from_meta('{}') | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 604 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, app_rls login] app_user: select private.handle_auth_user_created() | 42501 (or not found / trigger-only) | pass | pass | pass | pass |
| 605 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] createCatalogue (pickEditable strips createdBy/status/id) | created_by = A, status draft, id not client-chosen | pass | pass | pass | pass |
| 606 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] createCatalogue BUG variant: created_by = B | 42501 | pass | pass | pass | pass |
| 607 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] createCatalogue BUG variant: status active | 42501 | pass | pass | pass | pass |
| 608 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] createCatalogue with another owner's slug | 23505 via DrizzleQueryError.cause | pass | pass | pass | pass |
| 609 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] createCatalogue over plan quota | PlanLimitError catalogues | pass | pass | pass | pass |
| 610 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] duplicateItem: slug taken -> SAVEPOINT rollback -> -copy retry | a-live-copy, draft, A; role app_user and sub A after ROLLBACK TO SAVEPOINT | pass | pass | pass | pass |
| 611 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] duplicateItem of B's catalogue id | null | pass | pass | pass | pass |
| 612 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] publishCatalogue own draft with mass-assignment payload | active, A, id unchanged | pass | pass | pass | pass |
| 613 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] publishCatalogue BUG variant with createdBy | 42501 | pass | pass | pass | pass |
| 614 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] publishCatalogue of B's draft | null | pass | pass | pass | pass |
| 615 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] publishCatalogue over traffic limit (my_usage) | PlanLimitError traffic | pass | pass | pass | pass |
| 616 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] updateItemStatus on B's id | null | pass | pass | pass | pass |
| 617 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] updateItemStatus own | {name: a-live} | pass | pass | pass | pass |
| 618 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] deleteMultipleItems([own, B's]) all-or-nothing | null; both exist | pass | pass | pass | pass |
| 619 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] deleteItem('b-live') as A | false | pass | pass | pass | pass |
| 620 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] upsertQrConfig own twice + getOwnedQrConfig | success x2, v=2 | pass | pass | pass | pass |
| 621 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] upsertQrConfig onto B's catalogue | Not found (42501); B unchanged | pass | pass | pass | pass |
| 622 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] saveTheme upsert twice + list | same id, #222, only A's | pass | pass | pass | pass |
| 623 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] deleteSavedTheme(B's id) | false | pass | pass | pass | pass |
| 624 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] getMyUserData | A's row with usage | pass | pass | pass | pass |
| 625 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] saveCookiePreferences | true | pass | pass | pass | pass |
| 626 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] startAiTurn (getPlanForUpdate FOR NO KEY UPDATE + begin_ai_turn M06): charged, set_plan_state open, continuation with turn id + hash, B's catalogue, describe unlimited + refund, refund of open-plan turn | charged, true, continued (same turn id), not_found, charged, true, false | pass | pass | pass | pass |
| 627 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] checkCatalogueName | false, true | pass | pass | pass | pass |
| 628 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] public reads: active row without createdBy, draft null, names == active set | row; null; equal | pass | pass | pass | pass |
| 629 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] app_public select() / findFirst() without columns | 42501 both | pass | pass | pass | pass |
| 630 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] newsletterSignup x2 + productNewsletterSignup | 1 row owner 22222222-2222-4222-8222-222222222222 | pass | pass | pass | pass |
| 631 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] dashboard routes | only A's rows | pass | pass | pass | pass |
| 632 | G3 A.R1 re-key, M11, V-queries, post-cutover isolation | [uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls] asAdmin claimEvent twice | true, false | pass | pass | pass | pass |
| 633 | G4 cutover window, A.R2 rollback-remap, re-cutover | A.R2 then A.R1 with no activity in the window: back to Clerk ids, then to the same uuids; per-user data identical at every step | COMMIT, COMMIT; identical counts; ids UA,UB,UD + C; CHECK NOT VALID again | pass | pass | pass | pass |
| 634 | G4 cutover window, A.R2 rollback-remap, re-cutover | cutover window: Supabase-only sign-up (confirmed, paying), unconfirmed sign-up, imported user D deletes account, A changes email | S row; D gone + deletion log with Clerk id; A email synced | pass | pass | pass | pass |
| 635 | G4 cutover window, A.R2 rollback-remap, re-cutover | A.R2 rollback-remap after the window (S pushed to Clerk as rollback_push, unconfirmed U dropped): no uuid ids, CHECK dropped, triggers on, per-user counts/plan/customer preserved, Clerk sub works again | COMMIT; uuid_left 0; no differences; A sees a-draft/a-live | pass | pass | pass | pass |
| 636 | G4 cutover window, A.R2 rollback-remap, re-cutover | re-cutover: A.R1 again after A.R2 (plan: map-based rollback and re-cutover, section 5.6 drill with an account deletion in the window) | COMMIT | **FAIL** | **FAIL** | pass | pass |
| 637 | G4 cutover window, A.R2 rollback-remap, re-cutover | re-cutover result: rollback_push user S maps back to its uuid with customer/plan; counts preserved; V2/V3/V5 = 0 | S uuid, ctm_s; no differences | pass | pass | pass | pass |
| 638 | G5 M12 and M13 | M12 before orphan triage (legacy C row still present) | fails 23514 (validation refuses legacy ids) | pass | pass | pass | pass |
| 639 | G5 M12 and M13 | M12 after triage (C owned nothing, deleted) | ok; convalidated true | pass | pass | pass | pass |
| 640 | G5 M12 and M13 | M13: backups and scratch tables dropped; map kept and minimised | ok; 0 tables; pii 0; map rows kept | pass | pass | pass | pass |
| 641 | G5 M12 and M13 | after M13: account deletion (authAdmin().deleteUser -> DELETE auth.users -> M10 trigger) | ok; public.users row removed | **FAIL** | **FAIL** | pass | pass |
| 642 | G5 M12 and M13 | after M13: sign-up and email change still work | ok; row; ok | pass | pass | pass | pass |
| 643 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M13 | irreversible (comment only): skipped | pass | pass | pass | pass |
| 644 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M12 | statement inside the comment: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 645 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback R1 | A.R2 after M13 is outside its window (cutover_log dropped): skipped | pass | pass | pass | pass |
| 646 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M10 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 647 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M09 | prose: re-run M02 2.2 + 2.3: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 648 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M08 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 649 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M07 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 650 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M06 | prose (re-run M05 5.5-5.7) + runnable drops: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 651 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M05 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 652 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M04 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 653 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M03 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 654 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M02 | prose (optional): original function body, unnarrowed trigger, original cron: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 655 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M01 | runnable: runs without error and leaves the previous migration's schema, still usable | **FAIL** | **FAIL** | pass | pass |
| 656 | H A.14 rollback SQL in reverse | [all applied through M13] A.14 rollback M00 | runnable example: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 657 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M13 | irreversible (comment only): skipped | pass | pass | pass | pass |
| 658 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M12 | statement inside the comment: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 659 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback R1 | A.R2: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 660 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M10 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 661 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M09 | prose: re-run M02 2.2 + 2.3: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 662 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M08 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 663 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M07 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 664 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M06 | prose (re-run M05 5.5-5.7) + runnable drops: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 665 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M05 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 666 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M04 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 667 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M03 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 668 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M02 | prose (optional): original function body, unnarrowed trigger, original cron: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 669 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M01 | runnable: runs without error and leaves the previous migration's schema, still usable | **FAIL** | **FAIL** | pass | pass |
| 670 | H A.14 rollback SQL in reverse | [all applied through M12, R2 still in its window] A.14 rollback M00 | runnable example: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 671 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M09 | prose: re-run M02 2.2 + 2.3: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 672 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M08 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 673 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M07 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 674 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M06 | prose (re-run M05 5.5-5.7) + runnable drops: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 675 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M05 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 676 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M04 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 677 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M03 | runnable: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 678 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M02 | prose (optional): original function body, unnarrowed trigger, original cron: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 679 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M01 | runnable: runs without error and leaves the previous migration's schema, still usable | **FAIL** | **FAIL** | pass | pass |
| 680 | H A.14 rollback SQL in reverse | [Phase 1 rollback: M00-M09 applied (before M10)] A.14 rollback M00 | runnable example: runs without error and leaves the previous migration's schema, still usable | pass | pass | pass | pass |
| 681 | I read-only scripts A.15 / A.16 | [PROD today (baseline, before M00)] A15 parses and runs read-only as postgres | 29 statements, 0 errors | pass | pass | pass | pass |
| 682 | I read-only scripts A.15 / A.16 | [PROD today (baseline, before M00)] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 3 rows | **FAIL** | **FAIL** | pass | pass |
| 683 | I read-only scripts A.15 / A.16 | [PROD today (baseline, before M00)] A16 parses and runs read-only as postgres | 6 statements, 0 errors | pass | pass | pass | pass |
| 684 | I read-only scripts A.15 / A.16 | [after M00] A15 parses and runs read-only as postgres | 29 statements, 0 errors | pass | pass | pass | pass |
| 685 | I read-only scripts A.15 / A.16 | [after M00] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 3 rows | **FAIL** | **FAIL** | pass | pass |
| 686 | I read-only scripts A.15 / A.16 | [after M00] A16 parses and runs read-only as postgres | 6 statements, 0 errors | pass | pass | pass | pass |
| 687 | I read-only scripts A.15 / A.16 | [after M00-M10] A15 parses and runs read-only as postgres | 29 statements, 0 errors | pass | pass | pass | pass |
| 688 | I read-only scripts A.15 / A.16 | [after M00-M10] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 7 rows | **FAIL** | **FAIL** | pass | pass |
| 689 | I read-only scripts A.15 / A.16 | [after M00-M10] A16 parses and runs read-only as postgres | 6 statements, 0 errors | pass | pass | pass | pass |
| 690 | I read-only scripts A.15 / A.16 | [after cutover (A.R1 + M11)] A15 parses and runs read-only as postgres | 29 statements, 0 errors | pass | pass | pass | pass |
| 691 | I read-only scripts A.15 / A.16 | [after cutover (A.R1 + M11)] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...) | 7 rows | **FAIL** | **FAIL** | pass | pass |
| 692 | I read-only scripts A.15 / A.16 | [after cutover (A.R1 + M11)] A16 parses and runs read-only as postgres | 6 statements, 0 errors | pass | pass | pass | pass |
