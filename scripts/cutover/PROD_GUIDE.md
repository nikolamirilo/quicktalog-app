# PROD cutover: the commands

Every command, in order. Run them from the repo root.

For the reasoning behind each step, see
`.claude/plans/active/supabase-auth-migration/PROD_RUNBOOK.md`. This file is
just what to type.

---

## Before you start

Put credentials in `.env.cutover` at the repo root. It is gitignored.

```sh
MIGRATION_DATABASE_URL=postgresql://postgres.uhfbapjuzvlyzyodxhqn:<password>@<host>:5432/postgres
SUPABASE_SECRET_KEY=sb_secret_...
CLERK_SECRET_KEY=sk_live_...
SUPABASE_ACCESS_TOKEN=sbp_...
```

Use port **5432**, not 6543. The re-key holds a lock across several statements
and needs a session connection.

### Building that URL

Copy the host from the Supabase dashboard: project, Connect, Session pooler. Do
not type it from memory - the `aws-0` / `aws-1` prefix differs from project to
project.

The username is `<role>.<project-ref>`, one dot. The role replaces `postgres`;
it never goes in front of it.

```sh
postgres.uhfbapjuzvlyzyodxhqn            # right
app_rls.uhfbapjuzvlyzyodxhqn             # right
app_rls.postgres.uhfbapjuzvlyzyodxhqn    # wrong: asks for the role "app_rls.postgres"
```

Supavisor splits the username at the last dot, so the wrong one looks up a role
that does not exist and fails with `(EAUTHQUERY) user not found in the
database`. That reads like a database problem. It is a typo.

The password is the project's database password. If you do not have it, reset it
in Settings, Database - that rotates it, so update Vercel, GitHub Actions and the
worker in the same pass.

Check the string before you need it:

```sh
psql "$MIGRATION_DATABASE_URL" -c "select current_user"
```

Then point every command at PROD:

```sh
export CUTOVER_PROJECT=prod
```

Paths and the project URL come from `config.ts`. You do not need to set them.

Check psql is installed:

```sh
psql --version
```

If it is missing: `brew install libpq` and add
`/opt/homebrew/opt/libpq/bin` to your PATH.

---

## Step 1: get the Clerk export

Clerk dashboard, production instance, Settings, User exports.

Save it to `/Volumes/cutover/users.csv` (an encrypted disk image). The file
holds password hashes and MFA secrets, so it does not belong in Downloads.

Set the export time in `scripts/cutover/config.ts`:

```ts
prod: {
  exportedAt: "2026-10-01T09:00:00Z",   // when you generated the CSV
}
```

This one matters. A password is only imported if Clerk says it has not changed
since that moment. Get it wrong and people lose their passwords for no reason.

---

## Step 2: close sign-ups

```sh
npx tsx scripts/cutover/signups.ts --status
npx tsx scripts/cutover/signups.ts --off
```

The import refuses to run while sign-ups are open. Between claiming an email
and creating the identity, someone could register that address and take the
account.

---

## Step 3: check the database is ready

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/preflight.sql > preflight-t3.txt
grep -c '|f$' preflight-t3.txt
```

The count must be **0**. Anything else is a stop, not a warning.

Read the go/no-go table at the bottom:

```sh
tail -30 preflight-t3.txt
```

---

## Step 4: import the users

Dry run first. It writes nothing.

```sh
npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
```

Read the output. Then run it for real:

```sh
DRY_RUN=0 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
```

It asks you to type the project ref before writing.

Expect the first attempt to stop on something. It has about a dozen checks and
each one exists because skipping it breaks somebody's account.

When it finishes, C1 to C8 must all say `ok`.

### Check the reports

They are in `/Volumes/cutover/reports`.

| File | What it means |
|---|---|
| `needs-reset.csv` | No password could be carried over. Includes Google-only users, who are fine. Split those out before emailing anyone. |
| `conflicts.csv` | Two accounts want the same email, or a Google account is already taken. Each one needs a decision. |
| `skipped.csv` | Unverified email on an account that owns data. Ask them to verify in Clerk, then import again. |
| `errors.csv` | Must be empty. |

---

## Step 5: back up

```sh
pg_dump "$MIGRATION_DATABASE_URL" --data-only --schema=public --schema=migration -Fc -f prod-pre-remap-$(date +%s).dump
```

---

## Step 6: switch the ids

This is the point of no return for the window. Time it.

```sh
time psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/remap-user-ids.sql
```

It must end with `COMMIT`.

If it fails on a lock timeout, find what is holding the lock, end that session,
and run it once more. **Any other error means it rolled back and nobody was
touched.** Stop and work out why before trying again.

---

## Step 7: verify

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -v accepted_orphans=0 -f scripts/cutover/verify.sql > verify-t0.txt
grep -c '|f$' verify-t0.txt
```

Must be **0**. V12 is the password check, and it has to pass before you let
anyone in.

---

## Step 8: switch the app over

1. Vercel, Production, set `AUTH_PROVIDER=supabase`
2. Redeploy the tagged commit
3. Leave maintenance on

---

## Step 9: check the emails

Every Supabase Auth message (confirm signup, password reset, email change)
plus every Resend message (welcome, cancellation, contact form) comes from a
template committed to the repo. The moment sign-ups reopen, real users start
receiving these. If the templates on PROD drift from the files in the repo,
people get the old GoTrue defaults. Check first, then eyeball each one.

### 9a. Drift check

`scripts/supabase/auth-config.ts` reads the desired templates from
`scripts/supabase/auth-config.prod.json` (which references the files in
`supabase/templates/`) and compares them to the live project. A non-empty
list means PROD has drifted from git and needs to be brought back in line.

```sh
npx tsx scripts/supabase/auth-config.ts --project prod --check
```

For a focused report on just the email-related settings:

```sh
npx tsx scripts/supabase/auth-config.ts --project prod --check \
  --only mailer_templates_confirmation_content,mailer_templates_recovery_content,mailer_templates_email_change_content,mailer_subjects_confirmation,mailer_subjects_recovery,mailer_subjects_email_change
```

If anything is reported as different, take it back to the desired state:

```sh
npx tsx scripts/supabase/auth-config.ts --project prod --apply \
  --only mailer_templates_confirmation_content,mailer_templates_recovery_content,mailer_templates_email_change_content,mailer_subjects_confirmation,mailer_subjects_recovery,mailer_subjects_email_change
```

A drift of just the Resend templates (welcome, cancellation, contact) cannot
happen through this script - those are React components in `src/components/emails/`
shipped with the Next.js build, so a redeploy of the right commit is enough.

### 9b. Visual preview

The Supabase templates are managed by the Management API, but the React Email
templates are part of the Next.js bundle, so the only way to be sure both
sources look right is to send each one to your own inbox and read it.

`scripts/test-emails.ts` renders all six messages and sends them to
`quicktalog@outlook.com` (override with `TEST_EMAIL`). The React templates go
through `@react-email/render`; the GoTrue templates get the same
`{{ .SiteURL }}` / `{{ .RedirectTo }}` / `{{ .TokenHash }}` substitution that
the Management API would do at send time.

```sh
export RESEND_API_KEY=re_xxx
export PREVIEW_BASE_URL=https://www.quicktalog.app   # or https://test.quicktalog.app
npx tsx --tsconfig tsconfig.scripts.json scripts/test-emails.ts
```

For just the Supabase ones:

```sh
npx tsx --tsconfig tsconfig.scripts.json scripts/test-emails.ts confirmation recovery email-change
```

Read each one in your inbox before continuing. Pay particular attention to:

- **confirmation** - hero, "Confirm my email" button, fallback link, footer
- **recovery** - "Choose a new password" button and the 1-hour expiry copy
- **email-change** - the From / To cards show `{{ .Email }}` and `{{ .NewEmail }}`
  filled in with the sample address, not as literal placeholder text
- **welcome / cancellation / contact** - the brand bar dot, hero eyebrow, amber
  CTA, footer links all render; no unstyled HTML sneaking through

If any of the six look wrong, fix the source (one of
`src/components/emails/*.tsx` or `supabase/templates/*.html`) and redeploy or
re-apply. Do not move on until every message reads cleanly.

---

## Step 10: sign in yourself, before anyone else can

SQL passing is not the same as sign-in working. On the TEST rehearsal every
check passed while Google sign-in was broken, and only clicking the button
found it.

Test all three:

- **A password user.** Their old Clerk password must work.
- **A Google user.** They must land on their existing account with their
  catalogues, not an empty new one.
- **A password reset.** The email must arrive and the link must work.

---

## Step 11: open up

```sh
npx tsx scripts/cutover/signups.ts --on
```

Then turn maintenance off, unpause the worker, and watch Sentry.

---

## If it goes wrong

Within 72 hours you can go back.

```sh
DRY_RUN=0 npx tsx scripts/cutover/push-supabase-users-to-clerk.ts
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/rollback-remap.sql
```

The first command gives anyone who signed up during the window a Clerk account.
The second puts the old ids back. Without the first, the second refuses to run.

Then set `AUTH_PROVIDER=clerk`, redeploy the commit from before the cutover,
and turn the Clerk webhook back on.

---

## After

- Shred the CSV and the reports
- Revoke the `cutover-script` secret key
- At T+30, move the files in `supabase/phase5/` into `supabase/migrations/` one
  at a time and push them
