# Clerk to Supabase Auth + RLS: To Do

High-level task list for [`PLAN.md`](PLAN.md) (section 5 has the detailed steps). Every task runs on TEST first, then PROD.

Phases: **0A** close open database access · **0B** integrity and billing hardening · **K** legacy API key exit (parallel from 0B) · **1** DB layer and RLS, still on Clerk · **2** Supabase Auth built behind a switch · **3** import and re-key rehearsals · **4** PROD cutover · **5** remove Clerk.

| Order | Task | Assignee | Status |
|---|---|---|---|
| 0A.1 | PROD read-only preflight and exposure audit (grants, suspicious data, `/rest/v1` write logs) | Nikola | Done |
| 0A.2 | Turn off sign-ups and anonymous sign-ins in Supabase Auth (TEST and PROD) | Nikola | Done |
| 0A.3 | Check PROD migration history matches the repo (`supabase migration list`, repair if needed) | Nikola | Done |
| 0A.4 | App code: new auth/db/security modules, move supabase-js data calls to Drizzle, IDOR fixes, secured `/api/revalidate`, Sentry scrubbing, middleware matcher | Claude | Done |
| 0A.5 | Worker code: bearer token on HTTP routes, `JOBS_PAUSED`, usage computed in the job, safe image cleanup | Claude | Done |
| 0A.6 | Rename DB env vars to `DB_CONNECTION_STRING` (app, packages, CI) | Claude | Done |
| 0A.7 | Write M00 migration (RLS on all tables, revoke `anon`/`authenticated`) | Claude | Done |
| 0A.8 | Review and commit Phase 0A changes (app, worker, packages) | Nikola | Done |
| 0A.9 | Set secrets: Vercel (`DB_CONNECTION_STRING`, `AUTH_PROVIDER`, `REVALIDATE_SECRET`, `REDIS_KEY_PREFIX`), GitHub (`DB_CONNECTION_STRING`), Cloudflare (`WORKER_ADMIN_TOKEN`, `REVALIDATE_SECRET`, `JOBS_PAUSED`, `SUPABASE_SECRET_KEY`; then delete `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`) | Nikola | Done |
| 0A.10 | Deploy worker, then app, to TEST | Nikola | Done |
| 0A.11 | Soak 24h on TEST; confirm no app `/rest/v1` traffic | Nikola | Done |
| 0A.12 | Apply M00 on TEST and run the perimeter check | Nikola | Done |
| 0A.13 | PROD: check edge functions, backup, merge `test` → `main`, deploy, soak 24h, apply M00, perimeter check, re-run audit | Nikola | Done |
| 0A.14 | Fix any tampered data found by the audit; record the GDPR notification decision | Nikola | Done |
| 0B.1 | Catalogue actions: owner in every update, server-side status and plan limits, no `createdBy` in Redis | Claude | Done |
| 0B.2 | Newsletter validation and rate limit; CSV export escaping | Claude | Done |
| 0B.3 | Move helpers out of `"use server"` files (themes, emails, contact form) | Claude | Done |
| 0B.4 | Paddle: pinned customer at checkout, signed `customData`, webhook user resolution, downgrade rules | Claude | Done |
| 0B.5 | Clerk `user.deleted`: cancel Paddle subscriptions before deleting | Claude | Done |
| 0B.6 | Paddle sandbox test: checkout, activation, renewal, cancel | Nikola | Done |
| 0B.7 | Deploy to TEST, then PROD; soak 48h | Nikola | Done |
| K.1 | Create named `sb_secret_` keys per project | Nikola | Done |
| K.2 | Worker: replace `SUPABASE_SERVICE_ROLE_KEY` with the secret key, remove `SUPABASE_ANON_KEY` | Claude | Done |
| K.3 | Edge functions: require a webhook secret header instead of the service JWT | Claude / Nikola | In Progress |
| K.4 | Apply M09 (webhooks send only the header); remove the Vault `service_role_key` | Nikola | In Progress |
| K.5 | Disable legacy API keys; watch logs 24h | Nikola | Done |
| 1.1 | Local and CI setup: `config.toml`, seed, PGlite harness in `tests/db-pglite/`, `db-tests` CI job | Claude | Done |
| 1.2 | Write M01-M07 migrations (private roles, policies, functions) and pgTAP tests | Claude | Done |
| 1.3 | Apply M01-M06 on TEST; run advisors and perimeter queries | Nikola | Done |
| 1.4 | Packages: `drizzle-kit pull` without policies, release, bump app and worker | Claude | Done |
| 1.5 | App code: RLS wrapper (`withUser`/`withPublic`/`asAdmin`), convert every query, cookie consent to DB, provider-neutral auth UI, import guardrails, skills and docs | Claude | Done |
| 1.6 | Deploy to TEST; soak 3 days | Nikola | Done |
| 1.7 | Apply M07 on TEST | Nikola | Done |
| 1.8 | Apply M08 on TEST, set `app_rls` password, add separate user/admin connection strings, load smoke test | Nikola | Done |
| 1.9 | PROD: preflight, M01-M06, deploy, soak 3 days, M07, M08, smoke | Nikola | Done |
| 2.1 | Add Supabase auth packages and clients; Supabase branch of `getVerifiedIdentity` | Claude | Done |
| 2.2 | Runtime switches (maintenance, banner) and middleware with session refresh | Claude | Done |
| 2.3 | Auth UI: sign-in, sign-up, Google, password reset, callback and confirm routes, consent page | Claude | Done |
| 2.4 | Account settings: profile, email and password change, sign out, delete account | Claude | Done |
| 2.5 | Write M10 (sync `auth.users` → `users`) and apply on TEST, then PROD | Claude / Nikola | In Progress |
| 2.6 | Supabase config as code (`auth-config.ts`); apply on TEST and PROD with sign-ups off | Claude / Nikola | Done |
| 2.7 | Google provider: client ID and secret from Google Cloud | Nikola | Done |
| 2.8 | ES256 signing keys on both projects; revoke legacy JWT secret | Nikola | Done |
| 2.9 | Email: Resend per project, `auth.quicktalog.app` domain, DMARC, templates | Nikola | Done |
| 2.10 | Security hardening: CSP report-only, Origin checks | Claude | Done |
| 2.11 | Cutover scripts: Clerk import, re-key, verify, rollback | Claude | Done |
| 2.12 | Tests: auth triggers, sign-up integration, Playwright Supabase setup, CI matrix `clerk`/`supabase` | Claude | Done |
| 2.13 | Test all auth flows on a TEST preview with `AUTH_PROVIDER=supabase`; PROD stays on `clerk` for 72h | Nikola | To Do |
| 3.1 | Fixture rehearsal in CI (import, re-key, verify, reverse, re-key) | Claude | In Progress |
| 3.2 | Full TEST dress rehearsal: cutover, rollback, re-cutover; time every step | Nikola | To Do |
| 3.3 | Optional: PROD data rehearsal on a local copy | Nikola | To Do |
| 3.4 | Clerk freeze at T-3 (account changes paused notice) | Claude / Nikola | In Progress |
| 3.5 | PROD dark import at T-3; reconcile and decide on every conflict | Nikola | To Do |
| 4.1 | Deploy freeze from T-7; go/no-go checklist at T-1 | Nikola | To Do |
| 4.2 | Cutover window: maintenance on, pause worker, final import, backup, re-key user ids | Nikola | To Do |
| 4.3 | Switch `AUTH_PROVIDER=supabase`, sign-ups on, maintenance off, resume worker | Nikola | To Do |
| 4.4 | Smoke tests S1-S14; monitor 24h; users sign in once | Nikola | To Do |
| 5.1 | T+14: remove Clerk code, packages, provider switch and e2e leg | Claude | To Do |
| 5.2 | T+30: remove Clerk DNS records, then delete Clerk instances and Google callback URI | Nikola | To Do |
| 5.3 | Shred CSV exports; revoke the cutover secret key | Nikola | To Do |
| 5.4 | Write and apply M12 (uuid ids check) and M13 (drop backup tables) | Claude / Nikola | In Progress |
| 5.5 | Update terms, privacy policy, README, docs and skills | Claude | To Do |
| 5.6 | Move this plan to `.claude/plans/archive/` | Claude | To Do |

## Where things stand

_Verified read-only against TEST on 2026-09-22. PROD has not been inspected._

**Applied on TEST:** everything through `20260922090003_edge_webhook_secret`. That is M00–M08, M10 and M09.
Verified after the push: `call_edge_function_with_vault_secret()` prefers `x-webhook-secret`, the three `auth.users`
triggers exist, the `migration` schema tables are there, `users_id_is_uuid` is absent (correct, the re-key has not
run) and all 3 users are still Clerk-keyed.

**Not applied anywhere:** M12 and M13. They live in `supabase/phase5/`, deliberately outside the
`supabase db push` path — see the note under 5.4 below.

**Applied on PROD:** unknown beyond M00–M08 (1.9). M09 and M10 are not.

## Next actions — Nikola

In this order. 2 blocks 2.13; 4 is the one that may be hurting users today.

| # | Task | Why now |
|---|---|---|
| 1 | Commit and push | CI has never run the rehearsal, the sign-up tests or M09/M12/M13. ~18 tests execute for the first time. |
| 2 | Set `private.settings.terms_version` on TEST | **Blocks 2.13.** Without it `currentTermsVersion()` returns null and the sign-up form disables itself, so Supabase sign-up cannot be tested at all. |
| 3 | Release `@quicktalog/common` and bump app + worker | M10 changed `public.users`; the installed 1.58.0 predates it. `drizzle-kit pull`, release, bump. |
| 3b | **Do not deploy the app to PROD until M10 is applied there** | `@quicktalog/common` 1.59.0 adds `welcome_email_sent_at` to the Drizzle `users` schema. Drizzle names every column of a table in an INSERT and in `select()`, so **every** read or insert on `users` fails with 42703 on a database without M10. PROD does not have M10. This reverses the plan's usual deploy-then-migrate order for this one migration. |
| 4 | Check PROD's edge-function state | If PROD has the Vault `service_role_key` gone, M09 unapplied and its functions deployed, the Brevo contact sync is failing silently (`raise warning`, no error anywhere). |
| 5 | K.3 on PROD: download the four function sources | Prerequisite for everything else in Track K, and an outstanding Phase 0A step. Then hand them to Claude for the `x-webhook-secret` change. |
| 6 | 2.13 | Once 2, 3 and 5 are done. |

Later, in phase order: 3.2 (TEST dress rehearsal), 3.5, then Phase 4.

## Next actions — Claude

| # | Task | Blocked on |
|---|---|---|
| 1 | Fix whatever the first CI run turns up in the rehearsal and sign-up tests | Nikola action 1 |
| 2 | Add the `x-webhook-secret` check and `verify_jwt = false` to the four edge functions | Nikola action 5 |
| 3 | Wire `banner()` to the UI (see open items) | nothing — say the word |
| 4 | 5.1, 5.5, 5.6 | the cutover |

## Open questions and decisions

- **Decided (Nikola, 2026-09-22): the edge-function integrations are PROD-only.** TEST does not need them, so TEST's
  state is correct and final — `edge_functions_base_url` unset, no functions deployed,
  `call_edge_function_with_vault_secret()` returning at its first check without posting. Leave the three triggers in
  place: they are cheap no-ops and `remap-user-ids.sql` already disables the Brevo one for the re-key. **Do not
  "fix" TEST.** All Track K edge work is PROD-only.
- **Open:** `migration.t0_password_digests` is created by `migrate-clerk-to-supabase.ts` rather than by a migration.
  It is now load-bearing in three places (V12 in `verify.sql`, the rollback push's drift detection, and M13 drops it).
  Worth promoting to a migration.
- **Open:** which Clerk Account Portal settings can actually be frozen for 3.4 is still unverified.
- **Open:** `banner()` in `lib/ops/flags.ts` is not wired to any UI, so plan 12's T-30min announcement banner has
  nowhere to appear.

## Corrections to earlier "Done" marks

- **K.3 was never done.** There is no edge-function source in any of the three repos: `grep -r x-webhook-secret`
  matches only the plan documents and `supabase/functions/` does not exist. Plan 10.6 says as much — "sources in no
  repo". The four functions (`create-brevo-contact`, `create-crm-contact`, `discord-subscription-alert`,
  `sync-available-plans`) live only in the PROD dashboard.
- **0A.13's "check edge functions" needs confirming.** The same evidence suggests the Phase 0A download-and-grep step
  never happened. If it did, and the answers to "does any function use the anon key / store `users.id` as an external
  id" are known, record them here; if not, it rides along with K.3 action 5.
- **K.4 is not finished.** M09 is applied on TEST, but the Vault secret `edge_webhook_secret` does not exist and the
  functions that would accept it are not deployed. PROD-only work now, per the decision above.
- **2.5 was marked Done before M10 was applied.** M10 is on TEST now; PROD still pending.

## Notes on specific tasks

- **5.4 — M12 and M13 are written but must not be pushed.** They live in `supabase/phase5/` because anything in
  `supabase/migrations/` is applied by the next `supabase db push`, and those two are only correct at T+30, after the
  cutover and orphan triage. A `supabase db push` on 2026-09-22 proved the point: M12 refused, correctly, because
  `users_id_is_uuid` does not exist yet. Move a file into `supabase/migrations/` when it is time to apply it; see
  `supabase/phase5/README.md`. Both are still covered by `npm run test:db` on PG17 and PG18.
- **3.1 — written, never executed.** The rehearsal drives the real scripts against a real Postgres and GoTrue, but
  there is no Docker or `psql` on the dev machine, so its first run is in CI. Expect fixes.
- **3.4 — the notice is built, the freeze is not applied.** `ClerkAccount.tsx` shows "Account changes are paused" when
  the `clerk_frozen_<env>` Global Config key is true (env fallback `CLERK_FROZEN=1`); the runtime-switches table in
  `docs/guides/vercel-env.md` documents all three switches. At T-3, flip the key and do the Clerk dashboard half.
- **2.3/2.4 — the welcome email now works on the Supabase path.** M10 created `private.claim_welcome_email()` but
  nothing called it, so under `AUTH_PROVIDER=supabase` new users got no welcome email at all (smoke test S13).
  `getUserData()` now claims and sends it through `next/server`'s `after()`. Imported users are unaffected:
  `remap-user-ids.sql` backfills `welcome_email_sent_at` during the re-key.
- **2.13 — set `terms_version` first** (Nikola action 2), or it tests the wrong consent behaviour.
- **e2e was broken in four ways, now fixed** (2026-09-22). `globalSetup` called `clerkSetup()` on both legs, so the
  Supabase leg died before any test ran; `auth.supabase.setup.ts` opened the magic link and went straight to the
  dashboard, but `/auth/confirm` only parks the token and the interstitial has to be *pressed* twice, so no session was
  ever made; `playwright.config.ts` started a dev server on localhost even when `NEXT_PUBLIC_BASE_URL` pointed at TEST,
  and had no guard against production; and both setup files told the reader to see `.env.test.local.example`, which
  does not exist and cannot be created (a git hook blocks every `.env*` path). The variables now live in
  `docs/guides/e2e-testing.md`, which the error messages point at.
- **`npm run test:db` caught the M10 deploy constraint**, which is how it was found. Three app-layer scenarios ran
  today's schema against pre-M10 snapshots. `appLayer` now brings a snapshot to M10 before running app SQL, and the
  Phase 0A gate asserts the 42703 explicitly so the constraint is documented rather than rediscovered in production.
  Delete that assertion when the baseline includes M10.
