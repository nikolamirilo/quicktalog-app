Status: in progress (code complete; `@quicktalog/common` 1.79.0 released and the migration applied to TEST 2026-10-29, verified against all 10 TEST accounts. Pending: the pgTAP run - Docker was not running on this machine - a TEST browser check, the worker and app deploys, then PROD)

# Plan allowances reset 30 days from signup, not on the 1st: implementation plan

**Goal:** AI credits and page views reset 30 days after the day the account was created, and every 30 days after that, instead of on the 1st of each calendar month. Someone who signs up on the 28th gets a full allowance for a full period, not two days of one.

**Architecture:** One SQL helper, `private.usage_period_start(signup)`, turns an account's signup timestamp into the start of its current 30-day period (whole 30-day steps from the signup day, in UTC days so the boundary is 00:00 UTC and lines up with `analytics.day`). The three database functions that counted "since `date_trunc('month', now())`" — `begin_ai_turn`, `refund_ai_turn`, `my_usage` — call it instead. `my_usage()` also returns the window it used, so every surface that shows usage can name the reset date from the same source that enforces it. The Cloudflare Worker, which cannot reach `private.*` over REST, computes the same window in TypeScript from a shared helper in `@quicktalog/common`.

**Tech Stack:** Supabase Postgres (plpgsql, pgTAP), Drizzle via `withUser`, Next.js 15, `@quicktalog/common`, Cloudflare Worker (`../quicktalog-backend`), Vitest.

**Spec:** Plain-language summary: [OVERVIEW.md](OVERVIEW.md). Cross-check of the two window mirrors: [verification.md](verification.md).

## Decisions to confirm

| # | Decision | Why / cost |
|---|---|---|
| D1 | **The anchor is `users.created_at`, for every plan, free and paid.** A period is exactly 30 days, not "the same day next month" | What the owner asked for, and the only date every account has. Cost: for a paid subscriber the reset date drifts away from the Paddle renewal date (30-day periods give 12.17 resets a year against 12 payments). Anchoring paid accounts on their renewal instead would need a reliable period-start from Paddle on the user row; it is not stored today |
| D2 | **Both allowances move together**: AI credits and page views use one window. The catalogue limit is untouched — it counts what exists, not what was used | One window to explain, one to test. `private.my_usage()` already returns both |
| D3 | **The period boundary is 00:00 UTC on the reset day**, derived from the signup *day* and not the signup *time* | `analytics` is stored per UTC day, so a mid-day boundary could not be counted exactly for traffic. Cost: a user who signs up at 23:00 UTC loses an hour of their first period |
| D4 | **No period reaches back before the switch-over** (`2026-11-01 00:00 UTC`, the `USAGE_PERIOD_EPOCH`). The first period after the change starts at the later of the signup anchor and that date; the reset date is unaffected | Without it, a user whose anchor falls before the 1st would have usage counted that the calendar-month reset had already forgiven — and could be over the traffic limit the moment we deploy, which switches their catalogues off at the next 03:00 UTC run. With it, the first period is only ever shorter, never longer. Cost: the date is a literal in two places (`supabase/migrations/20261029120000_usage_period_from_signup.sql` and `@quicktalog/common`); **both must be edited together if the migration is applied outside November 2026**, so that it stays the first day of the month the switch lands in |
| D5 | **The AI refund cap counts within the period**, and the (unset, default 30) setting key is renamed `ai_refund_cap_per_month` → `ai_refund_cap_per_period` | It is a per-allowance cap; leaving it on calendar months would be a second, invisible clock. No row exists for the old key on TEST or PROD, so nothing to migrate |
| D6 | **The copy says "every 30 days"** and the dashboard names the exact reset date. "This month's traffic limit for your plan is reached" becomes "Your plan's page view limit for this period is reached" | The error string is quoted verbatim in the manual (`troubleshooting`, `publish`), so the two change together |

## Global Constraints

- Work on TEST (`imhinsgyzzyblghwnedk`). Touch PROD only when the owner asks explicitly.
- Function changes go only in a new file in `supabase/migrations/`. Never edit an applied migration. Never run `drizzle-kit push/generate/migrate` or `supabase db reset`. Apply with `supabase link --project-ref imhinsgyzzyblghwnedk` then `supabase db push`.
- No table or column changes, so `drizzle-kit pull` is not needed. `@quicktalog/common` still needs a release: the shared window helper and the `Usage` type.
- The migration goes on the database **before** the app and the worker are deployed. The app deployed while it lands keeps working: `my_usage()` grows two columns that the old reader ignores.
- Plan limits stay server-derived from `users.plan_id` → `tiers`. The window is derived from `users.created_at` in the same transaction as the charge, never passed in by a caller.
- Before calling a task done: `npx tsc --noEmit`, `npm run check`, `npm test`, plus `supabase start && supabase test db` for the SQL tasks. Say plainly what was not run.
- No commits or branches unless the owner asks.

## Review Focus

1. **A user signs up on the 28th.** Expected: a full allowance until the 27th of the next month, not a reset three days later. Covered by pgTAP `21_usage_period`.
2. **The switch-over day.** Expected: no account's counted usage grows at the moment we deploy, so nobody's catalogues are switched off by the 03:00 UTC run that night. Covered by the epoch rows of `21_usage_period` and a TEST check against a real `created_at`.
3. **A period rolls over while a hold is live.** Expected: a hold taken in the previous period does not reduce the new period's allowance (the case `42_ai_credit_holds` row g16 covers for months).
4. **The worker and the database disagree.** Expected: they cannot — same anchor, same 30 days, same epoch, both in UTC days. Covered by a Vitest unit test on the shared helper that asserts the boundary dates it produces, and by the pgTAP rows using the same fixtures.
5. **The dashboard, the credit ring and the limit modal all name the same reset date**, and it is the date enforcement actually uses: `my_usage()` returns it.

---

### Task 1: The window in the database

**Files:**
- Create: `supabase/migrations/20261029120000_usage_period_from_signup.sql`
- Create: `supabase/tests/database/21_usage_period.test.sql`
- Edit: `supabase/tests/database/20_users_usage.test.sql` (fixture comments and the two new columns)

**Produces** (owner `postgres`, `search_path = ''`, `revoke all … from public`, `grant execute … to app_user`):
- `private.usage_period_anchor(p_signup timestamptz) returns timestamptz` — the unclamped start: signup day + 30 × whole periods elapsed, at 00:00 UTC.
- `private.usage_period_start(p_signup timestamptz) returns timestamptz` — the anchor, never earlier than `USAGE_PERIOD_EPOCH` once that date has passed (D4).
- `private.usage_period_end(p_signup timestamptz) returns timestamptz` — the anchor plus 30 days. Computed from the anchor, not the clamped start, so the epoch never moves a reset date.
- `private.my_usage()` re-created (its return type changes, so it is dropped first) with `period_start timestamptz` and `period_end timestamptz` alongside the four counts.
- `private.begin_ai_turn(...)` and `private.refund_ai_turn(uuid)` re-created: they read `users.created_at` (`begin_ai_turn` in the `for no key update` select it already takes) and count from `private.usage_period_start(created_at)` instead of `date_trunc('month', now(), 'UTC')`. `refund_ai_turn` reads the renamed setting key (D5).

**Steps:**
- [x] Write the migration. Keep every other predicate of the three functions byte-identical to `20261024120000_ai_credit_holds.sql` / `20260929120000_schema_consistency.sql`; only the window changes.
- [x] `begin_ai_turn` raises `42501` when the account row is missing, instead of counting against a null window.
- [x] pgTAP `21_usage_period.test.sql` (16 rows): the anchor steps (2/31/60/61 days and a future signup), `now()` always inside the period, the epoch clamp, a charge in the previous period excluded and the current one counted, `my_usage()` reporting the window. `20_users_usage`, `41_ai_plan_binding` and `42_ai_credit_holds` fixtures re-expressed against the period instead of `date_trunc('month', …)`.
- [x] Applied to TEST 2026-10-29. All six functions live with the right signatures, `app_user` the only grantee (`anon`/`authenticated` denied); `begin_ai_turn`, `refund_ai_turn` and `my_usage` all read the period and none still reads `date_trunc('month', …)`.
- [ ] `supabase start && supabase test db` (pgTAP, including `21_usage_period`). **Not run** - no Docker daemon on this machine. Nothing else gates on it; the live checks in [verification.md](verification.md) stand in for now.

### Task 2: The shared window helper

**Files:**
- Edit: `../quicktalog-packages/src/constants/pricing.ts` (or a new `usage.ts` re-exported from the package index)
- Edit: `../quicktalog-packages/src/types/general.ts` (`Usage` gains `period: { start: string; end: string }`)
- Create: a Vitest unit test in the app for the boundary dates (the package has no test runner)

**Produces:** `USAGE_PERIOD_DAYS = 30`, `USAGE_PERIOD_EPOCH = "2026-11-01T00:00:00.000Z"`, `usagePeriod(signupAt, now?) => { start: Date; end: Date }` and `usagePeriodDays()` (the `YYYY-MM-DD` form `analytics.day` is filtered on), in `src/helpers/usage-period.ts`, with a comment in each naming the migration that mirrors it. `Usage` gains `period`.

Done and released as `@quicktalog/common` 1.79.0. `tests/unit/lib/users/usage-period.test.ts` (8 rows) asserts the anchor steps, month-length and leap-day cases, the clock-skew guard, the invariant that `now()` is always inside the period, and the switch-over clamp - against the dates the applied SQL produced ([verification.md](verification.md)).

Files: `../quicktalog-packages/src/helpers/usage-period.ts` (new), `src/helpers/index.ts`, `src/types/general.ts`. `npx tsc --noEmit` green in the package.

### Task 3: The worker counts the same window

**Files:** Edit `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts`

`currentMonthRange()` goes; the user query also selects `created_at`; `monthlyPageviews` becomes `periodPageviews(supabase, user)` and takes its range from `usagePeriodDays(user.created_at)`.

Done. That repo was two releases behind (1.51.0 installed, `^1.73.0` asked for), so it was moved to `^1.79.0`: `package.json` and `package-lock.json` changed there too. `npx tsc --noEmit` now reports only the two pre-existing `src/index.ts` errors (the chanfana `handle()` signature, untouched by this work) - the three `@quicktalog/common` import errors are gone, including `catalogueFitsPlan` and `misfitMessage`, the release debt from [2026-10-24-agent-plan-limits](../2026-10-24-agent-plan-limits/PLAN.md).

### Task 4: The app reads and shows the period

**Files:** Edit `src/lib/users/my-user-data.ts`, `src/lib/entitlements/plan.ts`, `src/components/dashboard/MonthlyUsage.tsx` → `src/components/dashboard/UsageOverview.tsx`, `src/components/dashboard/Dashboard.tsx`

The usage payload carries the window; the Usage tab says when the allowance resets; `canActivate`'s refusal names the period instead of the month.

Done. `MonthlyUsage` is `UsageOverview` (the name was wrong twice over) and reads `usage.period` from `Usage` in 1.79.0; the local stand-in type the pre-release build needed is gone.

### Task 5: Copy

**Files:** `src/components/catalogue/chat/CreditMeter.tsx`, `PlanChecklist.tsx`, `src/components/modals/limits/limitContent.ts`, `LimitUpgradeComparison.tsx`, `src/agent/core/credits.ts`, `src/components/manual/screens/{CreditMeterScreen,QuickAiScreen}.tsx`, `src/content/manual/{ai-credits,dashboard,glossary-terms,manage-catalogues,analytics,quickstart,troubleshooting,quick-ai,publish}.*`, `src/constants/{details,pricingFaqs,pricing}.ts`, `src/components/pricing/PricingPlans.tsx`

Every "this month", "each month", "resets on the 1st" about an allowance becomes the 30-day period. Pricing labels become "Page views per 30 days" / "AI credits per 30 days". The two places that quote the activation refusal verbatim change with it.

Done, including the two app strings the manual quotes: the activation refusal (`lib/entitlements/plan.ts`) and the AI limit error (`lib/ai/turn.ts`, now "You have reached your AI credit limit for this period."). Three test expectations followed (`pricing.test.ts` ×2, `creditMeter.test.tsx`). Billing copy about the Paddle renewal is untouched: that clock has not changed.

### Task 6: Docs

**Files:** `docs/architecture/` — the usage window gets a short section (where it is computed, the three functions, the worker, the epoch).

Done: `ai-credits.md` §4 is now "The period boundary" and carries the rule, the two mirrors and the epoch; `analytics.md` and `ai-chat-flow.md` follow.

### Task 7: Rollout

- [x] `@quicktalog/common` 1.79.0 released; the app and the worker both ask for `^1.79.0`.
- [x] Migration on TEST 2026-10-29.
- [ ] pgTAP run (needs Docker).
- [ ] Browser check of the Usage tab and the credit ring against a known `created_at`.
- [ ] App and worker deploys.
- [ ] PROD: migration, then app and worker. **Apply on or after 1 November 2026.** The epoch literal is `2026-11-01` and D4 only holds while that is the first day of the month of the apply. Applying in October instead would leave the clamp inert, and an account whose 30-day anchor falls in the last days of September would have one or two days of already-forgiven usage counted again - enough, for a heavy account, to take its catalogues offline. If PROD has to go sooner, a follow-up migration with an October epoch is the fix; the applied file must not be edited.
