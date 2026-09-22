# PROD runbook: Clerk → Supabase Auth

Written for the operator running the PROD cutover. Everything that was done to
TEST, in the order it has to happen, plus the cutover itself.

`PLAN.md` is the reasoning. `TO_DO.md` is the tracker. **This file is the
sequence.** `scripts/README.md` documents every script in detail.

- PROD project ref: `uhfbapjuzvlyzyodxhqn`
- TEST project ref: `imhinsgyzzyblghwnedk`
- PROD site: `https://www.quicktalog.app`

> **PROD has never been inspected during this work.** Every "current state"
> claim below is an assumption from the plan's history, not something that was
> verified. Step 0 exists to check them.

---

## The four traps TEST hit

They will all happen again on PROD unless the order below is followed.

| Trap | What happens | Avoided by |
|---|---|---|
| Captcha enabled before the site key is deployed | Every password sign-in, sign-up and reset is rejected. Google keeps working, so it looks like a partial outage | Step 3 before step 4 |
| Deploying the app before M10 | `welcome_email_sent_at` is in every Drizzle query on `users`; the whole dashboard dies with 42703 | Step 5 before step 6 |
| `SUPABASE_SECRET_KEY` missing on the environment | OAuth callback and email confirm fail as "that link is no longer valid"; everything else looks fine | Step 2 |
| `--apply` sending one bad field | The Management API rejects the **whole** batch, so one unfinished setting blocks nine good ones | `--only` / `--skip` |

---

## 0. Establish where PROD actually is

Read-only. Do not skip — the tracker has been wrong before.

```sh
# Migration history. Expect M00-M08; M09 and M10 should be missing.
supabase migration list --project-ref uhfbapjuzvlyzyodxhqn
```

In the SQL editor:

```sql
select count(*) as users,
       count(*) filter (where id like 'user\_%') as clerk_ids,
       count(*) filter (where customer_id is not null) as paying
  from public.users;
select name from vault.secrets order by 1;                 -- names only
select jobname, schedule, active from cron.job;
select to_regclass('migration.clerk_user_map') as map;     -- null before M10
```

Record the user counts. They are the baseline every later check compares to.

```sh
npx tsx scripts/supabase/auth-config.ts --project prod --check
```

Expect drift similar to TEST's fifteen settings. **Do not apply yet.**

---

## 1. Long-lead item: the Clerk export

Start this first; it gates the whole cutover.

Clerk dashboard → **production instance** → Settings → **User exports** →
Export. The download expires, so fetch it when you are ready to use it.

If the option is not there, open a Clerk support request for an export
including `password_digest` and `password_hasher`. Multi-day lead time.

The file contains password digests **and** `totp_secret`. Encrypted volume
only — see `docs/guides/vercel-env.md` and step 9.

---

## 2. Vercel environment variables (Production)

Four are missing on production and the app will not work without them.

| Variable | Value | Why |
|---|---|---|
| `DB_CONNECTION_STRING` | the pooler URL, port 6543 | Production still only has the old `DATABASE_URL`; 0A.6's rename never reached it |
| `DB_ADMIN_CONNECTION_STRING` | `postgres` pooler URL | Absent on every environment. After M08 the app login cannot do admin work, so webhooks and provisioning need this |
| `REVALIDATE_SECRET` | same value as the Cloudflare worker | Byte-identical on both sides or revalidation is rejected |
| `REDIS_KEY_PREFIX` | `prod` | Unset falls back to `"dev"`, sharing a keyspace with local development |
| `AUTH_PROVIDER` | `clerk` | Set it now; step 12 flips it |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | the Turnstile **site** key | Step 3 |
| `NEXT_PUBLIC_APP_URL` | `https://www.quicktalog.app` | Falls back to `quicktalog.com` — the wrong TLD — in QR codes |

Already present and correct: `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Check `NODE_ENV` while you are there. It is set explicitly on all three
environments; anything other than `production` disables Sentry and stops session
cookies being marked `Secure`.

Dead entries to remove once the rename lands: `SUPABASE_URL`,
`SUPABASE_ANON_KEY` (disabled since K.5), `DATABASE_URL`, and the typo'd
`POSTHGOG_API_KEY`.

**Every server-side variable needs a redeploy to take effect.**

---

## 3. Turnstile, before any captcha setting

1. Cloudflare → Turnstile → the existing site, or a new one. Domains must
   include `www.quicktalog.app` and `quicktalog.app`.
2. Vercel → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the **site** key, Production.
3. **Redeploy.** It is a `NEXT_PUBLIC_` variable, so it is compiled into the
   bundle; an existing deployment will not pick it up.
4. Load `/auth` on production and confirm the widget renders.

Only then does step 4 enable captcha. Site key → app; secret key → Supabase.
They are easy to confuse and both start `0x4AAAAAAA`.

---

## 4. Supabase Auth configuration

Everything is in `scripts/supabase/auth-config.prod.json`. Do not hand-edit the
dashboard: it drifts and nobody notices.

**4.1 Google provider.** Google Cloud → the OAuth client → Authorized redirect
URIs must include:

```
https://uhfbapjuzvlyzyodxhqn.supabase.co/auth/v1/callback
```

Leave Clerk's existing URI in place — both providers must work until T+30.
Authorized JavaScript origins: `https://www.quicktalog.app`.

**4.2 SMTP.** Verify the sending domain in Resend and turn **click and open
tracking off** — a rewritten link is a burned one-time token. Use a PROD-only
Resend API key. Then Supabase → Authentication → Emails → SMTP Settings:

| Field | Value |
|---|---|
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (literally) |
| Password | the Resend API key |
| Sender | matches the verified domain |

Without custom SMTP, `rate_limit_email_sent` cannot be raised and you are stuck
on two emails per hour.

**4.3 Redirect URLs.** `auth-config.prod.json` allows only
`https://www.quicktalog.app/**`. **If the bare apex is reachable, sign-in from
it will fail** — the OAuth return URL is built from `window.location.origin`.
Either redirect apex → www at the edge, or add `https://quicktalog.app/**` to
the config.

**4.4 Apply.**

```sh
export SUPABASE_ACCESS_TOKEN=sbp_...          # account-wide, treat as root
export SUPABASE_SMTP_PASS=re_...
export SUPABASE_CAPTCHA_SECRET=0x...
export SUPABASE_GOOGLE_CLIENT_ID=...
export SUPABASE_GOOGLE_SECRET=...

npx tsx scripts/supabase/auth-config.ts --project prod --check
npx tsx scripts/supabase/auth-config.ts --project prod --apply
```

A 400 usually means one field is invalid and it blocked the batch. Bisect with
`--skip <field>` until it applies, then fix the offender.

`--check` must end at `0 setting(s) differ` with no go/no-go warnings.
`disable_signup` stays **true** until step 12.

**4.5 JWT signing keys.** Project Settings → JWT Keys: an ES256 key must be
*Current*, so `getClaims()` verifies locally instead of calling out on every
request. Wait 1h15m after promoting before revoking the legacy secret — tokens
signed by it live an hour.

---

## 5. Database migrations

PROD is at M08. It needs **M10 then M09**.

```sh
supabase link --project-ref uhfbapjuzvlyzyodxhqn
supabase migration list        # confirm what is pending
supabase db push
```

`db push` applies everything pending in `supabase/migrations/`. Today that is
`20260922090002_auth_users_sync` (M10) and `20260922090003_edge_webhook_secret`
(M09).

**M12 and M13 live in `supabase/phase5/`, deliberately outside the push path.**
They are T+30 work and M12 refuses to run before the re-key. Do not move them.

Then set the per-project setting M10 leaves to an operator:

```sql
insert into private.settings (key, value)
values ('terms_version', '<your terms version>')
on conflict (key) do update set value = excluded.value;
```

**Without it the sign-up form disables itself** — `currentTermsVersion()`
returns null and the form refuses to render rather than record a consent it
cannot honour.

---

## 6. Deploy the app

**Only after step 5.** `@quicktalog/common` 1.59.0 names `welcome_email_sent_at`
in every Drizzle query on `users`; deploying before M10 takes out the dashboard,
the Paddle webhook and Clerk provisioning with 42501/42703.

Merge to `main`, deploy, and **tag the commit** — the rollback path is a
tagged-commit redeploy, not Vercel's Instant Rollback, which only reaches the
previous deployment.

`AUTH_PROVIDER` is still `clerk`, so nothing user-visible changes. Soak it.

---

## 7. Track K: edge functions

The four function sources exist in no repo. Download them from PROD first:

```sh
cd supabase
for fn in create-brevo-contact create-crm-contact discord-subscription-alert sync-available-plans; do
  supabase functions download "$fn" --project-ref uhfbapjuzvlyzyodxhqn --use-api
done
```

Read them before changing anything — Phase 0A wanted three answers that are
still unanswered: does any use the **anon key** (M00 is applied, so it is
already broken if so), does any store `users.id` as an external CRM id (those
become uuids at the re-key, so CRM records need updating by email **before**
T-0), and which user columns do they read.

Then add the `x-webhook-secret` check, set `verify_jwt = false`, redeploy, and
only then create the Vault secret:

```sql
select vault.create_secret('<long random value>', 'edge_webhook_secret');
```

M09's function prefers `edge_webhook_secret` and falls back to
`service_role_key`, so the switch happens the moment the secret exists.

> TEST deliberately has none of this — the integrations are PROD-only.

---

## 8. Rehearse before you touch PROD data

Do not run a first import against PROD. Task 3.2 is the full TEST dress
rehearsal: purge, import, re-key, `verify.sql`, rollback, re-key again, with
every step timed. **Those timings size the PROD maintenance window.**

Above ~50 users the plan also recommends a local rehearsal on real data (3.3).
At 2200 it is worth the afternoon: `pg_dump --data-only --schema=public` to an
encrypted volume, restore into a local stack at the same migration level, run
the import against local GoTrue with the PROD CSV, re-key, verify, measure the
lock time. Wipe it afterwards; never commit or upload it.

---

## 9. T-3: freeze and dark import

**9.1 Clerk freeze.** Set the Global Config key `clerk_frozen_prod` to `true` —
the account page then shows "Account changes are paused". Disable password reset
and profile edits in Clerk's Account Portal where the settings allow. Sign-up
stays public until T-0.

The freeze matters because a password changed after your export lands in Clerk
and not in the import.

**9.2 Preflight.**

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/preflight.sql > preflight-t3.txt
```

Every `pass` must be `t`. G2 — a paying user with no migrated map row — is a
hard stop: the re-key refuses to run.

**9.3 Import.** Operator machine only, never CI, never Vercel.

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

It asks you to type the project ref. It aborts before writing anything if the
Clerk key and the Supabase project are different environments, if sign-ups are
open, if M10 is missing, or if the CSV is short.

**9.4 Reconcile.** Every row in `conflicts.csv`, `skipped.csv` and
`errors.csv` needs a written decision. Unverified addresses on accounts that own
data are contacted to verify in Clerk, then re-imported. `needs-reset.csv` is
the list of people whose password could not be carried — decide now whether they
get an email.

---

## 10. T-0: the cutover window

A low-traffic weekday, at least 90 minutes clear of the 03:00 UTC worker cron.

1. Global Config `maintenance_prod` = `true`. **Wait 15 seconds**, then confirm
   from two separate requests — propagation takes up to ~10s.
2. Pause the worker: Cloudflare `JOBS_PAUSED` = `true`.
3. Freeze Clerk sign-ups; disable the Clerk webhook.
4. Second Clerk CSV export; note the new `EXPORTED_AT`.
5. Delta import: same command with `--delta`.
6. Backup:
   ```sh
   pg_dump "$MIGRATION_DATABASE_URL" --data-only --schema=public \
     --schema=migration -Fc -f prod-pre-remap-$(date +%s).dump
   ```
7. Preflight again → `preflight-t0.txt`. **This is the V6 baseline.** Terminate
   any idle-in-transaction sessions holding `public.users`.
8. **Re-key:**
   ```sh
   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
        -f scripts/cutover/remap-user-ids.sql
   ```
   On a lock timeout, terminate the blocking sessions and retry **once**. Any
   other exception rolls back completely and no user is affected — stop and
   diagnose.
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

---

## 11. Rollback (within 72h)

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

## 12. After

- **T+0 to T+7:** monitor Sentry for `auth.signin_failed`, `db.42501`,
  `paddle.unresolved`; re-test canaries at T+15m, T+1h (the first token-expiry
  wave) and T+4h.
- **T+1h:** Paddle dashboard shows no failed deliveries for the window.
- **T+14:** remove Clerk code (5.1).
- **T+30:** orphan triage done → move `supabase/phase5/*.sql` into
  `supabase/migrations/` one at a time and push. M12 validates the uuid check;
  M13 drops the backups and minimises the map. Export
  `migration.cutover_log` before M13 drops it.
- **T+30:** delete the Clerk instance, remove its DNS and its Google callback
  URI, shred the CSVs, revoke the `cutover-script` secret key.
