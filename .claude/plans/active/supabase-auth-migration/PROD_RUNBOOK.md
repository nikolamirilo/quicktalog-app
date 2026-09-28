# PROD runbook: Clerk → Supabase Auth

Written for the operator running the PROD cutover.

`PLAN.md` is the reasoning. `TO_DO.md` is the tracker. **This file is the
sequence.** `scripts/README.md` documents every script in detail.

- PROD project ref: `uhfbapjuzvlyzyodxhqn`
- TEST project ref: `imhinsgyzzyblghwnedk`
- PROD site: `https://www.quicktalog.app`

> ## ⚠️ PROD is wide open. Read this before anything else.
>
> A0 was run for real on **2026-09-26**. The tracker was wrong: **PROD is at
> migration 3 of 16.** M00 — the perimeter migration — has never been applied,
> and neither has anything after it.
>
> **All 12 public tables have RLS disabled**, and the `anon` role holds:
>
> | Table | anon privileges |
> |---|---|
> | `users` | **DELETE / INSERT / SELECT / UPDATE** |
> | `catalogues` | INSERT / SELECT / UPDATE |
> | `subscriptions` | INSERT / SELECT / UPDATE |
> | `analytics` | INSERT / SELECT |
> | `newsletter` | SELECT |
> | `job_logs` | INSERT |
>
> Both the legacy `anon` JWT and the `sb_publishable_` key are **enabled**
> (`disabled: false`). A publishable key ships in the browser bundle by design,
> so anyone who views source on the site can reach `/rest/v1/users` and read,
> alter or delete any of **2171 users, 72 of them paying** — including changing
> `plan_id`. Supabase's own advisor reports this at ERROR level, EXTERNAL
> facing.
>
> This is risk **R1** in `PLAN.md`, rated critical, and it is live in
> production. See "P0" below before continuing with Part A.

---

## P0 — the open perimeter

There is no one-command fix, and that is why Phase 0A was sequenced the way it
was: **M00 can only land once the app has stopped using PostgREST.** PROD's
deployed code predates Phase 0A — production has no `DB_CONNECTION_STRING`, so
it cannot be using Drizzle — and the logs confirm it is serving real traffic
through `/rest/v1`. Enabling RLS underneath it would take the site down.

### What the logs actually show (24h to 2026-09-26)

| Role | Request | Count |
|---|---|---|
| **anon** | `GET /rest/v1/catalogues` | **2163** |
| anon | `GET /rest/v1/analytics` | 10 |
| anon | `HEAD /rest/v1/newsletter` | 10 |
| anon | `GET /rest/v1/catalogues` (406) | 10 |
| **anon** | **`POST /rest/v1/subscriptions` → 200** | **1** |
| service_role | GET catalogues, GET users, POST job_logs, POST analytics | 1 each |
| `sb_` keys | assorted reads, plus 401s on tables anon has no grant for | 11 |

Two things fall out of this.

**The public catalogue pages depend on anon `SELECT` on `catalogues`.** 2163
reads a day. That grant cannot be revoked until the app stops using PostgREST.

**Everything else anon *can* do, it isn't doing.** There were zero anon requests
to `/rest/v1/users` in 24 hours, despite anon holding DELETE/INSERT/SELECT/UPDATE
on it.

> **The one anomaly: `POST /rest/v1/subscriptions` as `anon`, returning 200.**
> A browser key writing to the billing table. That is exactly the forged-
> subscription vector exposure audit E2 exists to find. Identify that request
> before revoking the grant — and treat a forged row as plausible until the
> reconciliation against Paddle says otherwise.

### The remediation, in order

1. **Revoke what the logs show nothing uses.** Evidence-based, and it leaves the
   2163 daily catalogue reads intact:
   ```sql
   revoke all on public.users from anon;              -- zero anon traffic in 24h
   revoke insert, update on public.catalogues from anon;
   revoke insert on public.analytics from anon;
   revoke insert on public.job_logs from anon;
   revoke select, update on public.subscriptions from anon;
   ```
   That closes the read of 2171 email addresses, the plan-tampering path and the
   catalogue-reassignment path in one statement each.

   **The 24h window is the caveat.** A weekly or monthly code path would not
   appear in it. Re-run the query over a few more days, or grep the deployed
   code, before treating the list as complete.

2. **Do NOT disable the legacy API keys yet.** K.5 was done on TEST, and my
   first draft of this section said to do the same here. The logs say otherwise:
   **2198 of 2209 requests authenticate with legacy JWT keys.** Disabling them
   today takes the site down. They can only go once the app is off PostgREST.

3. **Reconcile the subscriptions table against Paddle** (exposure audit E2) and
   run E1/E3/E4/E5 while you are there. The hole has been open for the whole
   history of the project; the audit is how you find out whether it was used.

4. **Then run Part A properly** — it is the rest of the fix, and M00 lands in A5.

Do not simply `supabase db push`: that applies 13 migrations at once, including
M01–M08, against code that has never been deployed to PROD.

---

## The shape of it

| Part | What | User impact | When |
|---|---|---|---|
| **A. Preparation** | Audit, env vars, Supabase config, migrations, edge functions | **None.** Clerk stays live and nothing users touch changes | Any time, spread over days |
| **B. Deployment** | Ship the code with `AUTH_PROVIDER=clerk` | None if A is complete | After A, then soak |
| **C. Migration** | Rehearse, dark import, cutover window | Maintenance window, one forced sign-in | A scheduled date |
| **D. After** | Monitor, remove Clerk, Phase 5 migrations | None | T+0 → T+30 |

**Part A is the whole point of this split.** Nearly everything can be done
ahead of time, in daylight, with Clerk serving traffic and no window booked.
The only irreversible, user-visible step is C3.

---

## The four traps TEST hit

They will recur on PROD unless the order below is followed.

| Trap | What happens | Avoided by |
|---|---|---|
| Captcha enabled before the site key is deployed | Every password sign-in, sign-up and reset rejected. Google keeps working, so it reads as a partial outage | A3 before A4 |
| Deploying the app before M10 | `welcome_email_sent_at` is in every Drizzle query on `users`; the dashboard dies with 42703 | A5 before B1 |
| `SUPABASE_SECRET_KEY` missing on the environment | OAuth callback and email confirm fail as "that link is no longer valid"; everything else looks fine | A2 |
| One bad field in `--apply` | The Management API rejects the **whole** batch, so one unfinished setting blocks nine good ones | `--only` / `--skip` |

---

# Part A — Preparation

Nothing here changes what a user sees. PROD keeps running on Clerk throughout.
A1 is the long pole; start it first and do the rest while you wait.

## A0. Establish where PROD actually is

Read-only. Do not skip — the tracker has been wrong twice already.

```sh
supabase migration list --project-ref uhfbapjuzvlyzyodxhqn   # expect M00-M08
```

```sql
select count(*) as users,
       count(*) filter (where id like 'user\_%') as clerk_ids,
       count(*) filter (where customer_id is not null) as paying
  from public.users;
select name from vault.secrets order by 1;                 -- names only
select jobname, schedule, active from cron.job;
select to_regclass('migration.clerk_user_map') as map;     -- null before M10
```

Record the counts. They are the baseline every later check compares against.

```sh
npx tsx scripts/supabase/auth-config.ts --project prod --check
```

Expect drift similar to TEST's fifteen settings. **Do not apply yet.**

## A1. The Clerk export (long lead — start first)

Clerk dashboard → **production instance** → Settings → **User exports**.

If it is not there, open a support request for an export including
`password_digest` and `password_hasher`. Multi-day turnaround.

The file holds password digests **and** `totp_secret`. Encrypted volume only.

> Without it there is no cutover: the decision was full import with passwords,
> and the Backend API never returns digests.

## A2. Vercel environment variables (Production)

Adding variables changes nothing until a deploy, so this is safe now.

| Variable | Value | Why |
|---|---|---|
| `DB_CONNECTION_STRING` | `postgres.<prod-ref>` pooler URL, port 6543 | Production only has the old `DATABASE_URL`; 0A.6's rename never reached it |
| `DB_ADMIN_CONNECTION_STRING` | `postgres.<prod-ref>` pooler URL, port 6543 | Absent everywhere. After M08 the app login cannot do admin work |
| `REVALIDATE_SECRET` | same as the Cloudflare worker | Byte-identical or revalidation is rejected |
| `REDIS_KEY_PREFIX` | `prod` | Unset falls back to `"dev"`, sharing a keyspace with local development |
| `AUTH_PROVIDER` | `clerk` | Set now; C3 flips it |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile **site** key | A3 |
| `NEXT_PUBLIC_APP_URL` | `https://www.quicktalog.app` | Falls back to `quicktalog.com` — wrong TLD — in QR codes |

### The two database URLs, and the order they must be set in

Both are Supavisor **transaction-pooler** URLs on port 6543 — the app sets
`prepare: false` for that mode, and a 5432 session-mode URL would silently defeat it.
Only the **username** differs, and only after M08. The `.<ref>` suffix is pooler tenant
routing, not part of the role name.

```bash
# Set both now, identical. This is the whole of A2 for the database.
DB_CONNECTION_STRING=postgresql://postgres.<prod-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DB_ADMIN_CONNECTION_STRING=postgresql://postgres.<prod-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres

# Later, when M08 is live and the app login switches over, ONLY the first one moves:
DB_CONNECTION_STRING=postgresql://app_rls.<prod-ref>:<app_rls-password>@aws-0-<region>.pooler.supabase.com:6543/postgres
DB_ADMIN_CONNECTION_STRING=postgresql://postgres.<prod-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres   # unchanged
```

> **Set `DB_ADMIN_CONNECTION_STRING` before `DB_CONNECTION_STRING` ever becomes
> `app_rls`.** `getAdminDb()` falls back to `DB_CONNECTION_STRING`
> (`src/utils/db/pool.ts:51`). Flip the user string first and the fallback hands a
> no-privilege role to every `asAdmin` path — Paddle webhook, user provisioning, e2e
> cleanup — and all of them fail with `42501`. Setting both to the same `postgres` URL
> now makes that ordering impossible to get wrong later.

**This also gates type regeneration.** `drizzle-kit pull` runs in
`../quicktalog-packages`, whose config reads `DB_ADMIN_CONNECTION_STRING`. Introspection
reads `pg_catalog`, which `app_rls` cannot do, so after the switch that variable is the
only way to regenerate `@quicktalog/common`.

### The `app_rls` switch itself is not yet a step in this runbook

TEST got it from `PLAN.md` step 8; PROD has no equivalent. It needs, in this order:

1. `alter role app_rls with password '<generated>'` in the PROD SQL editor — out of band,
   never committed, no `VALID UNTIL`. (On TEST this is already done: verified 2026-09-28,
   `rolcanlogin=true`, `rolbypassrls=false`, connection limit 40, password set.)
2. Vercel Production `DB_CONNECTION_STRING` → `app_rls.<prod-ref>`; redeploy.
3. `forgotten-wrapper.test.ts` against PROD with `DB_RLS_CONNECTION_STRING` pointing at the
   `app_rls` login — otherwise it falls back to `DB_CONNECTION_STRING` and the M08
   assertions do not actually run.
4. Watch `pg_stat_activity` by `usename` for the first minutes.

**Unverified, and it blocks step 2:** `PLAN.md:2517` flags that "whether Supavisor
authenticates a custom login role on each project" has never been confirmed. Postgres
having the role and password proves nothing about the pooler's own credential mapping —
that needs a real connection attempt as `app_rls.<test-ref>`, on TEST, before PROD.

Already correct: `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Check `NODE_ENV` too — it is set explicitly on all three environments, and
anything but `production` disables Sentry and stops session cookies being
`Secure`.

Remove once the rename lands: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (disabled
since K.5), `DATABASE_URL`, and the typo'd `POSTHGOG_API_KEY`.

## A3. Turnstile — before any captcha setting

1. Cloudflare → Turnstile. Domains must include `www.quicktalog.app` and
   `quicktalog.app`.
2. Vercel → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the **site** key, Production.
3. **Redeploy.** `NEXT_PUBLIC_` values are compiled into the bundle.
4. Confirm the widget renders.

Site key → app. Secret key → Supabase. Both start `0x4AAAAAAA`.

> On PROD the widget only renders once `AUTH_PROVIDER=supabase`, so nothing is
> visible yet. Do it anyway — A4 depends on it.

## A4. Supabase Auth configuration

All of it is inert while `AUTH_PROVIDER=clerk`: nobody reaches Supabase Auth.

**A4.1 Google.** Google Cloud → OAuth client → Authorized redirect URIs, add:

```
https://uhfbapjuzvlyzyodxhqn.supabase.co/auth/v1/callback
```

**Leave Clerk's existing URI in place** — both must work until T+30.
JavaScript origins: `https://www.quicktalog.app`.

**A4.2 SMTP.** Verify the sending domain in Resend, **turn click and open
tracking off** (a rewritten link is a burned one-time token), use a PROD-only
API key. Then Authentication → Emails → SMTP Settings:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (literally) |
| Password | the Resend API key |
| Sender | must match the verified domain |

Without custom SMTP you are capped at two emails per hour.

**A4.3 Redirect URLs.** `auth-config.prod.json` allows only
`https://www.quicktalog.app/**`. **If the bare apex is reachable, sign-in from
it will fail** — the return URL is built from `window.location.origin`. Either
redirect apex → www at the edge, or add `https://quicktalog.app/**`.

**A4.4 Apply.**

```sh
export SUPABASE_ACCESS_TOKEN=sbp_...          # account-wide, treat as root
export SUPABASE_SMTP_PASS=re_...
export SUPABASE_CAPTCHA_SECRET=0x...
export SUPABASE_GOOGLE_CLIENT_ID=...
export SUPABASE_GOOGLE_SECRET=...

npx tsx scripts/supabase/auth-config.ts --project prod --check
npx tsx scripts/supabase/auth-config.ts --project prod --apply
```

A 400 means one field is invalid and blocked the batch. Bisect with `--skip`.

Finish when `--check` says `0 setting(s) differ` with no go/no-go warnings.
`disable_signup` stays **true** until C3.

**A4.5 JWT keys.** Project Settings → JWT Keys: an ES256 key must be *Current*
so `getClaims()` verifies locally instead of calling out per request. Wait
1h15m after promoting before revoking the legacy secret.

## A5. Database migrations

> **⚠️ This section contradicts the rest of this document. Unresolved 2026-09-28.**
>
> The line below says PROD is at M08. **This runbook's own header says otherwise** —
> "A0 was run for real on 2026-09-26. The tracker was wrong: **PROD is at migration 3 of
> 16.** M00 — the perimeter migration — has never been applied, and neither has anything
> after it." P0 agrees ("production has no `DB_CONNECTION_STRING`, so it cannot be using
> Drizzle … M00 lands in A5"), and so does the audit in [`TO_DO.md`](TO_DO.md).
>
> Three places say migration 3; only this line says M08. It reads as a leftover from the
> tracker the 2026-09-26 audit corrected, missed because A5 was not rewritten.
>
> **Resolve with `supabase migration list --project-ref uhfbapjuzvlyzyodxhqn` before
> running anything in this section.** The difference is whether M00–M08 still need to
> land — and pushing them against pre-Phase-0A code is exactly what P0 warns takes the
> site down. Not checked here: querying PROD needs explicit sign-off.

PROD is at M08 and needs **M10 then M09**.

```sh
supabase link --project-ref uhfbapjuzvlyzyodxhqn
supabase migration list
supabase db push
```

Both are safe while Clerk is live: M10 adds a column and triggers on an empty
`auth.users`, and M09's function still falls back to `service_role_key` until
the Vault secret exists (A6).

**M12 and M13 live in `supabase/phase5/`, deliberately outside the push path.**
They are T+30 work and M12 refuses to run before the re-key. Do not move them.

Then the setting M10 leaves to an operator:

```sql
insert into private.settings (key, value)
values ('terms_version', '<your terms version>')
on conflict (key) do update set value = excluded.value;
```

**Without it the sign-up form disables itself** — `currentTermsVersion()`
returns null and the form refuses to render rather than record a consent it
cannot honour.

## A6. Track K: edge functions

The four sources exist in no repo. Download them first:

```sh
cd supabase
for fn in create-brevo-contact create-crm-contact discord-subscription-alert sync-available-plans; do
  supabase functions download "$fn" --project-ref uhfbapjuzvlyzyodxhqn --use-api
done
```

Read them before changing anything. Phase 0A wanted three answers that are
still unanswered: does any use the **anon key** (M00 is applied, so it is
already broken if so); does any store `users.id` as an external CRM id (those
become uuids at the re-key, so CRM records must be updated **by email before
T-0**); which user columns do they read.

Then add the `x-webhook-secret` check, set `verify_jwt = false`, redeploy, and
only then create the secret:

```sql
select vault.create_secret('<long random value>', 'edge_webhook_secret');
```

M09's function prefers `edge_webhook_secret` over `service_role_key`, so the
switch happens the moment the secret exists — deploy the functions first.

> TEST deliberately has none of this; the integrations are PROD-only.

---

# Part B — Deployment

## B1. Ship the code

**Only after A5.** `@quicktalog/common` 1.59.0 names `welcome_email_sent_at` in
every Drizzle query on `users`; deploying first takes out the dashboard, the
Paddle webhook and Clerk provisioning.

Merge to `main`, deploy, and **tag the commit** — rollback is a tagged-commit
redeploy, not Vercel's Instant Rollback, which only reaches the previous
deployment.

`AUTH_PROVIDER` is still `clerk`, so nothing user-visible changes.

## B2. Soak

Watch Sentry and the Paddle webhook for a few days. Everything in Part A is now
live but dormant; this is the window to notice anything that is not.

---

# Part C — Migration

## C1. Rehearse (never skip)

Do not let PROD be the first real run.

- **3.2, TEST dress rehearsal:** purge, import, re-key, `verify.sql`, rollback,
  re-key again — **every step timed**. Those timings size the PROD window.
- **3.3, local rehearsal on real data.** At 2200 users, worth the afternoon:
  `pg_dump --data-only --schema=public` to an encrypted volume, restore into a
  local stack at the same migration level, import with the PROD CSV, re-key,
  verify, measure the lock. Wipe afterwards; never commit or upload it.

## C2. T-3: freeze and dark import

**C2.1 Clerk freeze.** Global Config `clerk_frozen_prod` = `true` — the account
page then shows "Account changes are paused". Disable password reset and profile
edits in Clerk's Account Portal where the settings allow. Sign-up stays public.

The freeze matters because a password changed after the export lands in Clerk
and not in the import.

**C2.2 Preflight.**

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/preflight.sql > preflight-t3.txt
```

Every `pass` must be `t`. G2 — a paying user with no migrated map row — is a
hard stop.

**C2.3 Import.** Operator machine only. Never CI, never Vercel.

```sh
export NEXT_PUBLIC_SUPABASE_URL=https://uhfbapjuzvlyzyodxhqn.supabase.co
export SUPABASE_SECRET_KEY=<PROD sb_secret_>
export MIGRATION_DATABASE_URL=<postgres, session pooler 5432 or direct — NOT 6543>
export CLERK_SECRET_KEY=sk_live_...
export CLERK_CSV=/Volumes/cutover/users.csv
export EXPORTED_AT=<UTC ISO time of the export>
export OUT_DIR=/Volumes/cutover/reports

DRY_RUN=1 ALLOW_PROD=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
DRY_RUN=0 ALLOW_PROD=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
```

It asks you to type the project ref. It aborts before writing if the Clerk key
and the Supabase project are different environments, if sign-ups are open, if
M10 is missing, or if the CSV is short.

**Imported identities are dormant.** Nobody's data moves until C3, and nobody
can use them while `AUTH_PROVIDER=clerk`.

**C2.4 Reconcile.** Every row in `conflicts.csv`, `skipped.csv` and
`errors.csv` needs a written decision. Unverified addresses on accounts that own
data get contacted to verify in Clerk, then re-imported. `needs-reset.csv` is
whose password could not be carried — decide now whether they get an email.

## C3. T-0: the cutover window

The only irreversible, user-visible part. A low-traffic weekday, at least 90
minutes clear of the 03:00 UTC worker cron.

1. Global Config `maintenance_prod` = `true`. **Wait 15 seconds**, then confirm
   from two separate requests — propagation takes up to ~10s.
2. Worker: Cloudflare `JOBS_PAUSED` = `true`.
3. Freeze Clerk sign-ups; disable the Clerk webhook.
4. Second Clerk CSV export; note the new `EXPORTED_AT`.
5. Delta import: the same command with `--delta`.
6. Backup:
   ```sh
   pg_dump "$MIGRATION_DATABASE_URL" --data-only --schema=public \
     --schema=migration -Fc -f prod-pre-remap-$(date +%s).dump
   ```
7. Preflight again → `preflight-t0.txt`. **This is the V6 baseline.** Terminate
   idle-in-transaction sessions holding `public.users`.
8. **Re-key:**
   ```sh
   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
        -f scripts/cutover/remap-user-ids.sql
   ```
   On a lock timeout, terminate the blockers and retry **once**. Any other
   exception rolls back completely and no user is affected — stop and diagnose.
9. Verify:
   ```sh
   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
        -v accepted_orphans=<count from V1> \
        -f scripts/cutover/verify.sql > verify-t0.txt
   ```
   Nothing may say `f`. **V12 is the password go/no-go** and must pass before
   sign-ups reopen.
10. Vercel `AUTH_PROVIDER` = `supabase` → redeploy the tagged commit, with
    maintenance still on.
11. Smoke-test as an operator using the maintenance bypass cookie.
12. Reopen: `disable_signup` = `false`, `maintenance_prod` = `false`,
    `clerk_frozen_prod` = `false`, `JOBS_PAUSED` = `false`.

## C4. Rollback (within 72h)

1. Maintenance on, sign-ups off, worker paused.
2. Snapshot `verify.sql`.
3. Carry back anyone who signed up during the window:
   ```sh
   DRY_RUN=0 ALLOW_PROD=1 npx tsx scripts/cutover/push-supabase-users-to-clerk.ts
   ```
   `rollback-remap.sql` refuses to start until this has run.
4. `psql ... -f scripts/cutover/rollback-remap.sql`
5. Clerk sign-up public, webhook on.
6. `AUTH_PROVIDER` = `clerk` → redeploy the **pre-cutover tagged commit**.
7. Maintenance off, worker resumed, affected users emailed.

Restoring the dump is a repair, not a rollback: restore into a scratch schema
and fix rows through the map. Never restore over a live database.

---

# Part D — After the cutover

| When | Do |
|---|---|
| T+0 → T+7 | Sentry alerts on `auth.signin_failed`, `db.42501`, `paddle.unresolved`. Re-test canaries at T+15m, T+1h (first token-expiry wave) and T+4h |
| T+1h | Paddle dashboard shows no failed deliveries for the window |
| T+14 | Remove Clerk code, packages, the provider switch and the e2e leg (5.1) |
| T+30 | Orphan triage done → move `supabase/phase5/*.sql` into `supabase/migrations/` one at a time and push. **Export `migration.cutover_log` before M13 drops it** |
| T+30 | Delete the Clerk instance, remove its DNS and Google callback URI, shred the CSVs, revoke the `cutover-script` secret key |
