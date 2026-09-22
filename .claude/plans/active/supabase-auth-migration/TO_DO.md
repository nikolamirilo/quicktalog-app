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
| K.3 | Edge functions: require a webhook secret header instead of the service JWT | Claude | Done |
| K.4 | Apply M09 (webhooks send only the header); remove the Vault `service_role_key` | Nikola | Done |
| K.5 | Disable legacy API keys; watch logs 24h | Nikola | Done |
| 1.1 | Local and CI setup: `config.toml`, seed, PGlite harness in `tests/db-pglite/`, `db-tests` CI job | Claude | Done |
| 1.2 | Write M01-M07 migrations (private roles, policies, functions) and pgTAP tests | Claude | Done |
| 1.3 | Apply M01-M06 on TEST; run advisors and perimeter queries | Nikola | Done |
| 1.4 | Packages: `drizzle-kit pull` without policies, release, bump app and worker | Claude | Done |
| 1.5 | App code: RLS wrapper (`withUser`/`withPublic`/`asAdmin`), convert every query, cookie consent to DB, provider-neutral auth UI, import guardrails, skills and docs | Claude | Done |
| 1.6 | Deploy to TEST; soak 3 days | Nikola | To Do |
| 1.7 | Apply M07 on TEST | Nikola | To Do |
| 1.8 | Apply M08 on TEST, set `app_rls` password, add separate user/admin connection strings, load smoke test | Nikola | To Do |
| 1.9 | PROD: preflight, M01-M06, deploy, soak 3 days, M07, M08, smoke | Nikola | To Do |
| 2.1 | Add Supabase auth packages and clients; Supabase branch of `getVerifiedIdentity` | Claude | To Do |
| 2.2 | Runtime switches (maintenance, banner) and middleware with session refresh | Claude | To Do |
| 2.3 | Auth UI: sign-in, sign-up, Google, password reset, callback and confirm routes, consent page | Claude | To Do |
| 2.4 | Account settings: profile, email and password change, sign out, delete account | Claude | To Do |
| 2.5 | Write M10 (sync `auth.users` → `users`) and apply on TEST, then PROD | Claude / Nikola | To Do |
| 2.6 | Supabase config as code (`auth-config.ts`); apply on TEST and PROD with sign-ups off | Claude / Nikola | To Do |
| 2.7 | Google provider: client ID and secret from Google Cloud | Nikola | To Do |
| 2.8 | ES256 signing keys on both projects; revoke legacy JWT secret | Nikola | To Do |
| 2.9 | Email: Resend per project, `auth.quicktalog.app` domain, DMARC, templates | Nikola | To Do |
| 2.10 | Security hardening: CSP report-only, Origin checks | Claude | To Do |
| 2.11 | Cutover scripts: Clerk import, re-key, verify, rollback | Claude | To Do |
| 2.12 | Tests: auth triggers, sign-up integration, Playwright Supabase setup, CI matrix `clerk`/`supabase` | Claude | To Do |
| 2.13 | Test all auth flows on a TEST preview with `AUTH_PROVIDER=supabase`; PROD stays on `clerk` for 72h | Nikola | To Do |
| 3.1 | Fixture rehearsal in CI (import, re-key, verify, reverse, re-key) | Claude | To Do |
| 3.2 | Full TEST dress rehearsal: cutover, rollback, re-cutover; time every step | Nikola | To Do |
| 3.3 | Optional: PROD data rehearsal on a local copy | Nikola | To Do |
| 3.4 | Clerk freeze at T-3 (account changes paused notice) | Claude / Nikola | To Do |
| 3.5 | PROD dark import at T-3; reconcile and decide on every conflict | Nikola | To Do |
| 4.1 | Deploy freeze from T-7; go/no-go checklist at T-1 | Nikola | To Do |
| 4.2 | Cutover window: maintenance on, pause worker, final import, backup, re-key user ids | Nikola | To Do |
| 4.3 | Switch `AUTH_PROVIDER=supabase`, sign-ups on, maintenance off, resume worker | Nikola | To Do |
| 4.4 | Smoke tests S1-S14; monitor 24h; users sign in once | Nikola | To Do |
| 5.1 | T+14: remove Clerk code, packages, provider switch and e2e leg | Claude | To Do |
| 5.2 | T+30: remove Clerk DNS records, then delete Clerk instances and Google callback URI | Nikola | To Do |
| 5.3 | Shred CSV exports; revoke the cutover secret key | Nikola | To Do |
| 5.4 | Write and apply M12 (uuid ids check) and M13 (drop backup tables) | Claude / Nikola | To Do |
| 5.5 | Update terms, privacy policy, README, docs and skills | Claude | To Do |
| 5.6 | Move this plan to `.claude/plans/archive/` | Claude | To Do |
