# Cutover scripts

The Clerk → Supabase Auth cutover, run by hand from an operator machine.
The plan these implement is `.claude/plans/active/supabase-auth-migration/PLAN.md`
(section 6 for the identity migration, section 12 for the runbook).

**These scripts never run on Vercel and never run in CI against PROD.** They
hold the Supabase secret key and a `postgres` connection string, so they can act
as any user and write any row. Read this file before running any of them.

## The rules they all follow

- **Dry run by default.** `DRY_RUN` unset, or set to anything but `0`, means the
  script reads, decides and prints what it *would* do, and writes nothing.
  `DRY_RUN=0` is the only way to write.
- **PROD needs `ALLOW_PROD=1`** and, on top of that, typing the project ref at
  the prompt (or `CONFIRM_REF=<ref>` when there is no terminal).
- **One environment per run.** The environment is derived twice — from
  `NEXT_PUBLIC_SUPABASE_URL` and from `MIGRATION_DATABASE_URL` — and the run is
  refused unless both say the same project. `assertSameInstance()` then proves
  it against live data: a user the Auth API can see must exist in the connected
  database. A TEST database with PROD auth credentials is the accident this
  exists to stop.
- **No secrets in output.** Password digests, tokens, keys and connection
  strings never reach stdout or a report; every error message goes through
  `redact()`. Emails appear only as `a***@example.com`. The real addresses live
  in `migration.clerk_user_map` in the database, which is where you look them up.

Environment variables (export them from the encrypted volume; nothing here reads
a `.env` file):

| Variable | Used by | Meaning |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | all | Target project. Decides TEST vs PROD. |
| `SUPABASE_SECRET_KEY` | all | The `cutover-script` secret key. Never a `NEXT_PUBLIC_` one. |
| `MIGRATION_DATABASE_URL` | all | `postgres` login, session pooler 5432 or direct. Operator machine only. |
| `DRY_RUN` | all | `0` to write. Anything else is a rehearsal. |
| `ALLOW_PROD` | all | `1` to allow the PROD project at all. |
| `CONFIRM_REF` | all | The project ref, when stdin is not a terminal. |
| `CLERK_CSV`, `EXPORTED_AT` | import | The Clerk dashboard export and its UTC ISO export time. |
| `CLERK_SECRET_KEY` | import, push | Import: optional, pulls profiles, Google accounts and consents from the Clerk Backend API. Push: required. |
| `CLERK_FIXTURE` | import | Optional: a JSON snapshot instead of the Clerk API (rehearsals, tests). |
| `OUT_DIR` | import, push | Where the reports go. Required for a live import; put it on the encrypted volume. |
| `CONCURRENCY` | import, push | Users in flight, default 4. |
| `KEEP_USER_IDS`, `KEEP_EMAILS`, `MAX_DELETIONS` | purge | Allowlist and safety cap. |

## Order

| # | When | Script | Writes |
|---|---|---|---|
| 1 | before the TEST rehearsal | `cutover/purge-dark-test-users.ts` | deletes TEST-only auth users |
| 2 | T-3 | `cutover/preflight.sql` | nothing (read-only) |
| 3 | T-3 | `cutover/migrate-clerk-to-supabase.ts` | `auth.users`, `auth.identities`, `migration.clerk_user_map` |
| 4 | T-0 step 6 | `cutover/migrate-clerk-to-supabase.ts --delta` | the same, deltas only |
| 5 | T-0 step 8 | `cutover/preflight.sql` | nothing (read-only) |
| 6 | T-0 step 9 | `cutover/remap-user-ids.sql` | re-keys `public.users` and everything it owns |
| 7 | T-0 step 11 | `cutover/verify.sql` | nothing (read-only) |
| — | rollback R1/R2 step 3 | `cutover/push-supabase-users-to-clerk.ts` | Clerk users; `migration.clerk_user_map` |
| — | rollback R1/R2 step 4 | `cutover/rollback-remap.sql` | re-keys `public.users` back to Clerk ids |

### 1. `cutover/purge-dark-test-users.ts`

Deletes auth users that are **not** in `migration.clerk_user_map` — on a TEST
project during Phase 2 those can only be the dark build's own sign-up tests, and
the re-key refuses to start while any of them exist.

```sh
DRY_RUN=1 npx tsx scripts/cutover/purge-dark-test-users.ts
DRY_RUN=0 npx tsx scripts/cutover/purge-dark-test-users.ts
```

It **refuses PROD outright** — `ALLOW_PROD=1` does not unlock it. On PROD the
same query would select the real people who signed up during the cutover window;
those are carried back to Clerk by the rollback push (12.5 step 3), never
deleted. It also refuses when more than `MAX_DELETIONS` (default 50) users match,
and skips anything in `KEEP_USER_IDS` / `KEEP_EMAILS`.

A second run finds nothing to do and exits cleanly.

### 2 and 5. `cutover/preflight.sql`

Appendix A.15 with the Phase 3/4 queries enabled. Read-only, and read-only
twice over: the whole file runs inside a `READ ONLY` transaction, so an
`UPDATE` edited in by accident is refused by the server rather than by review.

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/preflight.sql > preflight-t0.txt
```

Run it at T-3 and again at T-0 step 8, and keep both files. **The T-0 output is
the baseline `verify.sql` V6 is compared against** — catalogues, pageviews,
subscriptions and users with a `customer_id`.

It prints the perimeter (private roles, `anon`/`authenticated` grants, default
ACLs, RLS per table), the schema the re-key depends on (the cascading foreign
keys, every user trigger in `public`), data integrity, payload sizes against
the M03 limits, user and billing counts, the platform objects (vault secret
*names*, `pg_cron` jobs) and the sessions that would block the `ACCESS
EXCLUSIVE` lock. It never terminates a session; it prints the pids and the
command to do it by hand.

Two summaries close it:

- **Cutover gates G1-G3** — auth users outside the map, paying users with no
  `migrated` map row, map rows still `claimed`. These need M10; before it, the
  section says so instead of failing.
- **Go / no-go P1-P8** — server version, the `anon`/`authenticated` perimeter,
  RLS coverage, `analytics_upsert_trigger`, the default plan, duplicate emails
  and sessions holding a lock on `public.users`.

A run is a go only when every `pass` is `t`. A null `pass` is a number to read,
not a gate.

### 2 and 3. `cutover/migrate-clerk-to-supabase.ts`

Creates one Supabase identity per Clerk user, from the dashboard CSV (the only
self-serve source of password digests) plus a profile snapshot from the Clerk
Backend API or a fixture.

```sh
# T-3 rehearsal, then the real thing
DRY_RUN=1 ALLOW_PROD=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
DRY_RUN=0 ALLOW_PROD=1 OUT_DIR=/Volumes/cutover/reports \
  npx tsx scripts/cutover/migrate-clerk-to-supabase.ts

# T-0, after the second export
DRY_RUN=0 ALLOW_PROD=1 OUT_DIR=/Volumes/cutover/reports \
  npx tsx scripts/cutover/migrate-clerk-to-supabase.ts --delta
```

Flags: `--delta` (T-0 sync of digests, emails, bans and unlinked Google
accounts), `--only id1,id2` (repair a named user; reconciliation is skipped),
`--fixture path.json` (profiles from a file), `--csv-only` (no profile source:
no Google identities, no consents, no `created_at` fidelity), `--allow-delete`
(see below), `--out dir`.

**It aborts before any write** when: the Clerk key and the Supabase project are
from different environments (`sk_live_` with a non-PROD project, or the reverse);
`migration.clerk_user_map` is missing; `private.handle_auth_user_created` does
not consult the map (M10 missing or outdated — every imported user would get a
second `public.users` row); the project still accepts sign-ups
(`disable_signup` is not `true`); the CSV is missing a required column;
`EXPORTED_AT` does not parse, is in the future, or is over 24h old for
`--delta`; Clerk returned fewer users than its own `totalCount` (a partial list
must never look like a set of deletions); or a `--delta` user came back without
a `raw` payload, so `password_last_updated_at` cannot be read.

**The ordering that matters:** the uuid is claimed in `migration.clerk_user_map`
*before* `auth.admin.createUser`. The M10 sign-up trigger skips a user that is
already in the map; GoTrue writes `app_metadata` only in a later UPDATE, so a
row written after the create would arrive too late and the imported user would
get a second, empty `public.users` row.

**A second run creates nothing twice.** The claim is an upsert on
`clerk_user_id` and returns the uuid that was already reserved; creation is
skipped when that uuid already exists in `auth.users`; Google identities are
inserted `on conflict (provider_id, provider) do nothing`. A re-run repairs
missing pieces and rewrites the reports. Once the re-key has happened the script
detects **post-cutover mode** (a mapped uuid owns rows in `public.users`) and
will not delete or recreate anyone — it only fills in what is missing.

Outcomes per user follow 6.3 and 6.5: no usable email → `skipped`; an unverified
email on an account that owns catalogues or is billed → `skipped`
(`verify-in-clerk`); an email already taken in Supabase → `conflict`; a Google
`sub` already owned by another uuid → `conflict`. Passwords are imported only
for bcrypt/argon2 digests, only for users without MFA, and only when Clerk says
the password has not changed since the export.

Reports land in `OUT_DIR`: `clerk-supabase-map.<ts>.json`, `needs-reset.csv`,
`conflicts.csv`, `skipped.csv`, `errors.csv`, `mfa-users.csv`, `orphans.csv`.
Reconciliation C1–C8 is printed; the process exits non-zero if any equality
fails, any user errored, or an unmapped `public.users` row carries a Paddle
`customer_id` (that one is a go/no-go blocker: the re-key refuses to run).

For V12 it also records a **sha256 fingerprint** of each imported digest in
`migration.t0_password_digests`. The digest itself is never stored, printed or
read back; `verify.sql` compares fingerprints.

`--allow-delete` is the only destructive path here: it removes identities whose
Clerk user no longer exists. It is refused after the re-key, refused with
`--csv-only` or `--only`, and refused when more than `max(3, 1% of users)` would
go.

### 4. `cutover/remap-user-ids.sql`

Appendix A.R1, copied unchanged. One transaction that re-keys `public.users`
from Clerk ids to uuids and lets the six `ON UPDATE CASCADE` foreign keys carry
the children. Run it with psql, never through a pooler in transaction mode:

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/remap-user-ids.sql
```

It takes `ACCESS EXCLUSIVE` on `public.users` *before* its precondition reads,
so a webhook cannot change a checked row between the check and the re-key, and
it refuses to run if: an `analytics_upsert_trigger` exists; `auth.users` holds
anyone outside the map; a target uuid is already in `public.users`; a `migrated`
map row has no `auth.users` row; any map row is still `claimed`; the default
plan is missing; or an unmapped user carries a `customer_id`.

On a lock timeout, terminate the idle-in-transaction sessions touching `users`
and retry once. Any other exception rolls the whole transaction back and no user
is affected.

### 5. `cutover/verify.sql`

V1–V12 from 6.7. Read-only, re-runnable, and the input to go/no-go #2:

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/verify.sql > verify-t0.txt
```

Every row carries `pass`; a run is a go only when nothing says `f` and nothing
is null. Pass `-v accepted_orphans=N` when legacy `user_%` rows are deliberately
being kept (12.6). V11 switches to `app_user` inside a transaction that is
rolled back. V12 is the password go/no-go **before sign-ups are reopened**.

### Rollback step 3. `cutover/push-supabase-users-to-clerk.ts`

Anyone who signed up while Supabase was live has no row in
`migration.clerk_user_map`, and `rollback-remap.sql` refuses to start until they
do. This script creates the Clerk user that row points at.

```sh
DRY_RUN=1 ALLOW_PROD=1 npx tsx scripts/cutover/push-supabase-users-to-clerk.ts
DRY_RUN=0 ALLOW_PROD=1 OUT_DIR=/Volumes/cutover/reports \
  npx tsx scripts/cutover/push-supabase-users-to-clerk.ts
```

It runs four steps, in order:

1. **Push.** Every confirmed, unbanned `auth.users` row outside the map gets a
   Clerk user with `externalId` = the uuid, and a map row with
   `origin='rollback_push'`, `status='migrated'`. A bcrypt digest is carried
   across, so the password still works; anything else means
   `skipPasswordRequirement` and a reset.
2. **Drop.** Unconfirmed, banned, soft-deleted and address-less accounts are
   *not* pushed — an unconfirmed address is one nobody has proven they own, and
   pushing a banned account would quietly unban it. They are listed in
   `rollback-dropped.csv` and need an email; the report holds uuids and masked
   addresses, and prints the query for the real ones.
3. **Erase.** Every `migration.auth_user_deletions` row with a `clerk_user_id`
   is deleted in Clerk. Those people asked for their account to be removed
   during the window and a rollback must not resurrect it. A 404 counts as
   success.
4. **Re-push passwords.** An imported user whose current digest no longer
   matches its `migration.t0_password_digests` fingerprint changed their
   password while Supabase was live; where the new digest is bcrypt it is
   pushed to Clerk. Without the fingerprint table this step is skipped, loudly.

**It is built to be run twice**, because it runs during an incident: a Clerk
user is looked up by `externalId` before one is created, the map insert is an
upsert, and deletions tolerate a missing user. It ends by evaluating the exact
precondition `rollback-remap.sql` raises on and refuses to report success while
any uuid-keyed user still has no `migrated` map row.

It aborts before any write when `CLERK_SECRET_KEY` is missing or belongs to the
other environment (`sk_live_` with a non-PROD project, or the reverse), when
`migration.clerk_user_map` is missing (nothing was imported, so there is nothing
to roll back), or when `migration.auth_user_deletions` is missing (M10 is not
applied).

### Rollback step 4. `cutover/rollback-remap.sql`

Appendix A.R2, copied unchanged. Step 4 of the R1/R2 rollback: re-keys
`public.users` back to Clerk ids through the same map, and drops the
`users_id_is_uuid` constraint.

It refuses to run while a uuid-keyed user has no `migrated` map row, which is
the case for anyone who signed up during the window — run
`push-supabase-users-to-clerk.ts` first so those users get a Clerk id written
into the map with `origin='rollback_push'`.

## What cannot be undone

- **`purge-dark-test-users.ts` with `DRY_RUN=0`.** Deleting an auth user
  cascades through the M10 delete trigger to `public.users` and from there to
  that user's catalogues, analytics, newsletter subscribers, OCR jobs, prompts
  and themes. There is no undo and no soft delete.
- **`migrate-clerk-to-supabase.ts --allow-delete`.** Same cascade, for
  identities whose Clerk user is gone.
- **Claiming a uuid.** Once a `clerk_user_id` is in the map, the sign-up trigger
  will never create a `public.users` row for that identity again. That is the
  point, but it means a wrongly claimed row has to be resolved by hand, not by
  deleting the map row.
- **The re-key itself** is reversible only while the Clerk instance and the T-0
  export are still valid: R1/R2 up to T+72h. After that the plan is fix-forward
  only, and the point of no return is the deletion of the Clerk instance at
  T+30.
- **`push-supabase-users-to-clerk.ts` step 3.** Deleting a Clerk user is final,
  and it is meant to be: those people asked for their account to be erased. A
  wrong `migration.auth_user_deletions` row therefore erases somebody who never
  asked, so check that table before a live run.
- **Anything a rollback leaves behind.** `rollback-remap.sql` restores the ids;
  it does not undo emails sent, Paddle events already resolved, or the
  `auth.users` rows created in between (which stay dormant).
- **Restoring from `prod-pre-remap-*.dump`** is a repair, not a rollback:
  restore into a scratch schema and fix rows through the map. Never restore the
  whole database over a live one.

## Also in `scripts/`

`scripts/supabase/auth-config.ts` (with its `auth-config.<env>.json` files) is
the Phase 2 auth-configuration tool, not part of the cutover sequence. It is
used at T-14 to apply the project settings and at T-0 step 14 to reopen
sign-ups.
