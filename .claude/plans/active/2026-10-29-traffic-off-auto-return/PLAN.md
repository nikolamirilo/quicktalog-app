Status: in progress (code complete; `@quicktalog/common` 1.80.0 published and the migration applied to TEST 2026-10-30, both repos on `^1.80.0`. Pending: pgTAP - no Docker on this machine - and a real check, which needs TEST analytics data since the table is empty ([verification.md](verification.md)); then PROD)

# Catalogues come back when the allowance resets, and the free plan is checked too: implementation plan

**Goal:** A catalogue the plan-check job switched off for the traffic limit goes back online by itself in the first run after the owner's 30-day period rolls over. And the free plan's 500 page views are enforced by that job like every other plan's, instead of only when the owner next tries to publish.

**Architecture:** `catalogues.traffic_off_at` records when the job switched a catalogue off for traffic, and a `before update` trigger clears it whenever anyone changes that catalogue's status without setting the flag themselves - so the flag only ever marks "the job switched this off and nobody has touched it since". The job re-activates a flagged catalogue once, in the first run after its period start passes it, if the catalogue still fits the plan; either way the flag is resolved in that run, so the automatic return is a single bounded attempt rather than an open-ended promise.

Including the free plan turns the per-account traffic query into a problem: the job would make one analytics query per account and would blow the Worker's subrequest budget, and the unpaged `users` select would silently stop at 1,000 rows. Both go: the job reads every account in pages, and sums page views for all of them in one pass over the days any period can still cover.

**Tech Stack:** Supabase Postgres (plpgsql trigger, pgTAP), Cloudflare Worker (`../quicktalog-backend`), `@quicktalog/common` (Drizzle schema), Next.js 15 dashboard.

**Spec:** Plain-language summary: [OVERVIEW.md](OVERVIEW.md). What was checked on TEST: [verification.md](verification.md). Builds on [2026-10-29-usage-period-from-signup](../2026-10-29-usage-period-from-signup/PLAN.md), which made the allowance reset 30 days after signup.

## Decisions to confirm

| # | Decision | Why / cost |
|---|---|---|
| D1 | **The free plan is checked like the rest.** The `.neq(plan_id, Starter)` filter goes | The owner asked for it. The app already refuses to publish or re-activate a free catalogue that is over 500 page views, so the job was the inconsistent half. The cost: the first run after deploy switches off every free catalogue already over its allowance - real pages going offline, with no warning email, since the job sends none |
| D2 | **One automatic attempt, at the roll-over.** A flagged catalogue is re-activated in the first run after its period start passes `traffic_off_at`; if it cannot come back then (it no longer fits the plan), the flag is cleared and it stays off until the owner acts | Keeps the promise bounded: nothing comes back online weeks later out of nowhere. The cost: a catalogue that is both over traffic and over its plan needs one owner action after the reset |
| D3 | **Any status change by anyone else cancels the automatic return**, enforced by a trigger rather than by remembering to clear the flag in each app path | The owner switching a catalogue off deliberately must not be undone by the job. A trigger cannot be forgotten by a future server action; it is role-independent, and the job keeps its own stamp because it sets the flag in the same statement |
| D4 | **Misfit deactivations are not flagged.** Only the traffic limit gets an automatic return | A catalogue over its plan needs content changes or an upgrade; coming back on its own would hide that. Re-activating after an upgrade can be a later, separate decision |
| D5 | **Page views for every account are summed in one pass** over `analytics` from the earliest live period start, instead of one query per account | A query per account breaks the Worker's subrequest limit once the free plan is in. The cost: the job holds a day-by-day map in memory; bounded by 30 days of rows |
| D6 | **No email.** The job still only logs and revalidates | Out of scope here; worth its own decision, since going offline with no notice is the real gap |

## Global Constraints

- Work on TEST (`imhinsgyzzyblghwnedk`). Touch PROD only when the owner asks explicitly.
- The column and the trigger go in a new file in `supabase/migrations/`. Never edit an applied migration.
- After the migration is on TEST, run `drizzle-kit pull` in `@quicktalog/common` and release it: `catalogues` gains a column, so the schema has to be regenerated.
- The migration goes on the database **before** the worker is deployed; the worker as deployed today does not know the column, and the app does not write it at all.
- `app_user` gets `select` on the new column and nothing else: `selectMyCatalogues` reads every column, so it would start failing with 42501 without it. `app_public` needs nothing - public reads name their columns.
- Before calling a task done: `npx tsc --noEmit`, `npm run check` and `npm test` in the app, `npx tsc --noEmit` in the worker repo. Say plainly what was not run.
- No commits or branches unless the owner asks.

## Review Focus

1. **The owner switches a catalogue off on purpose while it is flagged.** Expected: the flag lapses at that moment and the job never puts it back. Covered by pgTAP on the trigger.
2. **The job's own deactivation keeps its stamp**, even though the same statement changes the status. Covered by pgTAP.
3. **A flagged catalogue that no longer fits the plan** is not re-activated, and does not keep being retried every run. Covered by the worker change and a log line.
4. **The first run after deploy.** Expected: free accounts over their allowance go offline (D1, the known cost) and nothing else changes - no account's page view count moves, because the window is the one the app already uses.
5. **Scale.** Expected: a bounded number of subrequests whatever the number of accounts - pages of users, pages of analytics, pages of flagged catalogues, then one update per account that actually changes.

---

### Task 1: The column, the trigger and the index

**Files:**
- Create: `supabase/migrations/20261029180000_catalogue_traffic_off_at.sql`
- Create: `supabase/tests/database/22_catalogue_traffic_off.test.sql`

**Produces:**
- `public.catalogues.traffic_off_at timestamptz` (nullable, no default, so no table rewrite), with a column comment, `grant select (traffic_off_at) … to app_user`, and a partial index for the job's lookup.
- `private.catalogue_status_clears_traffic_off()` (`security invoker`, `search_path = ''`, owner `postgres`, revoked from `public`, execute granted to `app_user` - the same pattern as `private.touch_updated_at`) and a `before update … for each row` trigger on `public.catalogues`.

**Steps:**
- [x] Migration written.
- [x] pgTAP `22_catalogue_traffic_off.test.sql` (8 rows): the column is nullable and starts null; a status write that sets the flag in the same statement keeps it; an owner status change clears it; an owner content save keeps it; a same-value status write keeps it; `app_user` may select the column and may not write it.
- [x] `supabase db push` to TEST, `drizzle-kit pull` + 1.80.0 published, both consumers on `^1.80.0` (2026-10-30). The deployed trigger and function body match the migration.
- [ ] `supabase test db` (needs Docker, which is not running on this machine).

### Task 2: The job

**Files:** Edit `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts`

- Every account, paged (D1, D5).
- `pageviewsByUser`: one paged pass over `analytics` from the earliest live period start, summed against each account's own window.
- Over the limit → switch off active catalogues and stamp `traffic_off_at`.
- Under the limit → resolve every flagged catalogue whose `traffic_off_at` is older than the current period start: re-activate it if it still fits the plan, otherwise clear the flag (D2).
- `deactivateMisfits` takes the account list instead of reading users again.
- Re-activated names are revalidated with the switched-off ones, so their public pages come back.

Done. `npx tsc --noEmit` in that repo is back to its two pre-existing `src/index.ts` errors and nothing else.

Two things the rewrite had to fix to make D1 safe, beyond dropping the filter:
- the `users` select was unpaged, so with the free plan in it would have stopped at Supabase's 1,000-row default and quietly skipped everyone after that;
- an account whose `plan_id` matches no tier is now **skipped and logged** instead of falling back to Starter. The old code threw for those; with the free plan in, a silent Starter fallback would judge a paying customer against a 500 page view limit and take their catalogues offline. (`deactivateMisfits` still falls back to Starter for them - pre-existing, and worth its own look.)

### Task 3: The dashboard says it is coming back

**Files:** Edit `src/components/dashboard/overview/DashboardItem.tsx`

An inactive catalogue with `traffic_off_at` gets one more row in the detail list: `Back online: <the owner's reset date>`, which the component already has in `usage.period.end`. Typed as an optional field until the `@quicktalog/common` release carries the column.

Done. A client can never write the column: `pickEditable` (`utils/db/columns.ts`) is an allowlist that does not include it, and `app_user` holds no UPDATE grant on it either. The local stand-in type is gone now that 1.80.0 carries `trafficOffAt`.

### Task 4: Docs

**Files:** `docs/architecture/analytics.md` (the traffic limit section), `docs/architecture/ai-credits.md` §4 if the period wording needs it.

Done: `analytics.md` gains a "The traffic limit" section (who checks, the stamp, the one attempt, the trigger, what is not stamped, no email). `ai-credits.md` needed nothing. The manual copy that told owners to switch their catalogues back on by hand now says they return by themselves: `dashboard`, `analytics`, `publish`, `troubleshooting`, `plans`.
