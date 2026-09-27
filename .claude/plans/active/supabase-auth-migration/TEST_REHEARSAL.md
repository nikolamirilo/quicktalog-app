# TEST rehearsal (task 3.2)

The full Clerk → Supabase migration, end to end, on TEST. **This is the step
that de-risks PROD**: the scripts have never run against a real Postgres and a
real GoTrue together, and its timings are what size the PROD window.

Run it before anything in `PROD_RUNBOOK.md` Part C.

---

## Where TEST is (checked 2026-09-26)

| | |
|---|---|
| `public.users` | **0 Clerk-keyed**, 2 uuid-keyed |
| `auth.users` | 2, both confirmed, **both outside the map** |
| `migration.clerk_user_map` | empty |
| `users_id_is_uuid` | absent (correct — no re-key yet) |
| Migrations | M00–M08, M10, M09 |
| `private.settings` | `default_plan_id`, `terms_version` both set |

**The Clerk-era rows are gone.** Whatever is left is from Phase 2 testing. A
re-key with nothing to re-key proves nothing, so step 1 rebuilds a realistic
pre-cutover state.

---

## 1. Reset to a pre-cutover state

### 1.1 Remove the Phase 2 test accounts

They are uuid-keyed with no map row, and `remap-user-ids.sql` refuses to start
while any `auth.users` row sits outside the map.

```sh
DRY_RUN=1 npx tsx scripts/cutover/purge-dark-test-users.ts
DRY_RUN=0 npx tsx scripts/cutover/purge-dark-test-users.ts
```

It refuses PROD outright — there is no flag for it.

### 1.2 Seed the Clerk-era rows from the CSV

```sh
export CUTOVER_PROJECT=test
export MIGRATION_DATABASE_URL='postgresql://postgres.imhinsgyzzyblghwnedk:<password>@...:5432/postgres'

DRY_RUN=1 npx tsx scripts/cutover/seed-test-users-from-csv.ts
DRY_RUN=0 npx tsx scripts/cutover/seed-test-users-from-csv.ts --catalogues
```

`CUTOVER_PROJECT` selects the block in `scripts/cutover/config.ts`, which
supplies the Supabase URL, the CSV path and the report directory. Paths are
keyed per project, so a PROD run cannot fall through to the TEST export.
Anything exported inline still wins.

Reads every row from the export, so it works the same for 3 users or 2000.
Rows are keyed by **Clerk id**, which is the point: that is the shape PROD is in
today, and it is what gives the re-key something to re-key. The uuid arrives in
step 4, and until then a rollback is just putting the Clerk id back.

`--catalogues` gives each user one catalogue so the re-key's `ON UPDATE CASCADE`
is genuinely exercised rather than assumed.

It creates **only** `public.users`. The `auth.users` records are step 2's job —
the import claims a uuid in `migration.clerk_user_map` *before* calling
`admin.createUser`, and the M10 sign-up trigger depends on that ordering. A user
row created here and an identity created there are joined by the map, not by a
shared id.

It refuses to run if any uuid-keyed user already exists (do 1.1 first), if
`default_plan_id` is unset or does not name a real plan, and against PROD
outright — PROD's rows already exist, and inserting there would invent users.

> **A paying user is the one case worth adding deliberately.** The re-key
> refuses to run if any user with a `customer_id` has no migrated map row, and
> that precondition has never been exercised against a real database. Set
> `customer_id` on one of the three *after* the import, confirm the re-key
> refuses, then clear it and continue.

### 1.3 Confirm sign-ups are closed

Already `disable_signup: true` from the config apply. The import refuses to run
otherwise — between claiming an email and creating the identity, a real person
could take it.

---

## 2. Import

Operator machine, from the repo root.

```sh
export CUTOVER_PROJECT=test               # URL, CSV path and OUT_DIR from config.ts
export SUPABASE_SECRET_KEY=<TEST sb_secret_>
export MIGRATION_DATABASE_URL=<postgres, session pooler 5432 or direct — NOT 6543>
export CLERK_SECRET_KEY=<dev instance sk_test_...>
export EXPORTED_AT=2026-09-22T18:20:32Z   # when the CSV was exported, not when the users signed up

DRY_RUN=1 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
DRY_RUN=0 npx tsx scripts/cutover/migrate-clerk-to-supabase.ts
```

`CLERK_SECRET_KEY` is not optional here. Two of the three users have **no
password digest** — they are Google-only, and without the Backend API the
script cannot fetch their Google `sub`. They would import with no way to sign in
at all, and the rehearsal would miss the most common real case.

`MIGRATION_DATABASE_URL` must not be the transaction-mode pooler on 6543: the
script runs transactions.

`EXPORTED_AT` is load-bearing, not bookkeeping: a password is imported only when
Clerk reports `password_last_updated_at` **older** than it. Set it too early and
the one bcrypt user silently lands with no password — and the rehearsal's most
important assertion (step 6) fails for a reason that has nothing to do with the
code. The value above is the CSV's mtime; use the real export time if you have
it.

**Expect the first run to abort.** It has about a dozen preconditions and
hitting them here is the point.

Verified against the file on 2026-09-26: 3 rows, all required columns present,
ids matching the seed in 1.2. Two users are Google-only; only
`office@reactify-solutions.com` carries a bcrypt digest.

### What to check afterwards

```sql
select clerk_user_id, status, origin, password_imported, google_sub is not null as has_google
  from migration.clerk_user_map order by clerk_user_id;
select count(*) from auth.users;                       -- 3
select count(*) from public.users where id like 'user\_%';  -- still 3, not re-keyed yet
```

One user should show `password_imported = true`, two `has_google = true`. The
identities are dormant: nothing has moved, and `AUTH_PROVIDER` still decides who
can sign in.

---

## 3. Preflight

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/preflight.sql > preflight-test.txt
```

Every `pass` must be `t`. This is also the first real run of `preflight.sql`
against a hosted project — it has only ever run in PGlite.

---

## 4. Re-key — time this

```sh
time psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/remap-user-ids.sql
```

**Write the duration down.** With 3 users it will be instant; the number that
matters is from the local rehearsal on a copy of PROD (3.3). This run is about
correctness.

Then:

```sql
select count(*) filter (where id like 'user\_%') as clerk_left,
       count(*) filter (where id ~ '^[0-9a-f]{8}-') as uuid_now
  from public.users;
select count(*) from public.catalogues c
 where not exists (select 1 from public.users u where u.id = c.created_by);  -- 0
```

Catalogues must have followed their owners via `ON UPDATE CASCADE`. A non-zero
second query means the cascade did not fire and the rehearsal has found a real
bug.

---

## 5. Verify

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -v accepted_orphans=0 \
     -f scripts/cutover/verify.sql > verify-test.txt
```

Nothing may say `f`. V12 is the password go/no-go.

---

## 6. Sign in as a migrated user

The whole point of importing digests. With `AUTH_PROVIDER=supabase` on a TEST
preview:

- **`office@reactify-solutions.com`** — the bcrypt user. Their **old Clerk
  password** must work. If it does not, V12 lied and the PROD cutover would lock
  everyone out.
- **A Google user** — click Google, no password. Must land on the existing
  account with its catalogues, not a fresh one.
- The dashboard must show the catalogues seeded in 1.2. If it is empty, the
  re-key mapped the user to the wrong uuid.

---

## 7. Rollback drill

The half nobody rehearses, and the half you need under pressure.

Create a Supabase-only user first (sign up on the preview) so the drill has the
case that actually occurs — someone who joined during the window:

```sh
DRY_RUN=1 npx tsx scripts/cutover/push-supabase-users-to-clerk.ts
DRY_RUN=0 npx tsx scripts/cutover/push-supabase-users-to-clerk.ts
```

It creates real users in the Clerk **dev** instance. Then:

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/rollback-remap.sql
```

`public.users` must be entirely Clerk-keyed again, and the window sign-up must
now carry a Clerk id with `origin = 'rollback_push'`.

---

## 8. Re-cutover

Prove it round-trips:

```sh
psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
     -f scripts/cutover/remap-user-ids.sql
```

Uuid-keyed again, including the pushed user. **Only after this passes is the
cutover path proven.**

---

## Done when

- [ ] Import completes with no `error` rows; every `conflict`/`skipped` has a reason you understand
- [ ] Re-key leaves zero orphaned catalogues
- [ ] `verify.sql` all `t`, twice (after re-key, and after re-cutover)
- [ ] The bcrypt user signs in with their **old** password
- [ ] A Google user lands on their existing account
- [ ] Rollback restores Clerk ids; re-cutover restores uuids
- [ ] Every duration recorded

Anything that fails here is a bug found for free. The same failure at T-0 on
PROD is 2171 people locked out.
