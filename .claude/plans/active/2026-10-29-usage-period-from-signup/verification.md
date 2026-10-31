# Verification, 2026-10-29

## The two mirrors agree

The window has to be computed in two places (the database for every charge and count, the
shared TypeScript helper for the Cloudflare Worker, which reads over REST). They were
compared directly rather than assumed: the same 7 signup dates through both, at two
different "now" values - one before the switch-over epoch, where the clamp is inert, and
one after it, where it binds.

TypeScript: `usagePeriod()` from the built `@quicktalog/common` (`dist/helpers/usage-period.js`).
SQL: the `usage_period_anchor` / `_start` / `_end` expressions of
`supabase/migrations/20261029120000_usage_period_from_signup.sql`, run on TEST with `now()`
substituted (read-only `select`, nothing applied).

**now = 2026-10-29 21:00 UTC (before the epoch)**

| signup | period start | reset |
|---|---|---|
| 2026-10-30 00:00 (future, clock skew) | 2026-10-30 | 2026-11-29 |
| 2026-10-29 20:00 | 2026-10-29 | 2026-11-28 |
| 2026-09-29 00:00 | 2026-10-29 | 2026-11-28 |
| 2026-08-30 12:00 | 2026-10-29 | 2026-11-28 |
| 2026-02-28 12:00 | 2026-10-26 | 2026-11-25 |
| 2025-12-31 23:00 | 2026-10-27 | 2026-11-26 |
| 2024-02-29 00:00 (leap day) | 2026-10-16 | 2026-11-15 |

**now = 2026-11-15 10:00 UTC (after the epoch, so it clamps)**

| signup | period start | reset |
|---|---|---|
| 2026-10-28 09:00 | 2026-11-01 (clamped from 2026-10-28) | 2026-11-27 |
| 2026-09-28 09:00 | 2026-11-01 (clamped from 2026-10-28) | 2026-11-27 |
| 2026-01-05 09:00 | 2026-11-01 (clamped from 2026-10-02) | 2026-12-01 |
| 2020-03-01 00:00 | 2026-11-01 (clamped from 2026-10-26) | 2026-11-25 |
| 2026-10-16 23:30 | 2026-11-15 | 2026-12-15 |
| 2026-11-15 23:59 | 2026-11-15 | 2026-12-15 |
| 2026-11-16 05:00 (future) | 2026-11-16 | 2026-12-16 |

14 of 14 rows identical, to the second. The clamp shortens the first period and never
moves a reset date, as intended: 2026-01-05 still resets on 2026-12-01.

## On TEST, after the migration was applied (2026-10-29)

`@quicktalog/common` 1.79.0 released, migration applied. Checked read-only:

- All six functions live, with the right signatures - `my_usage()` returns
  `period_start` and `period_end` - and `app_user` the only role that may execute them
  (`anon` and `authenticated` both denied).
- `begin_ai_turn`, `refund_ai_turn` and `my_usage` all read
  `private.usage_period_start`; none of them still reads `date_trunc('month', …)`;
  `refund_ai_turn` reads the renamed `ai_refund_cap_per_period`.
- **Nobody's counted usage changed at the switch.** For all 10 TEST accounts, credits
  counted in the new period are identical to credits counted under the old calendar-month
  rule (0, 15, 3, 7, 0, 0, 0, 0, 73, 0). Their anchors land between 6 and 28 October, so
  no window reaches back before 1 October.
- The published helper agrees with the applied SQL on the real `created_at` of 5 of those
  accounts, to the millisecond.
- `tests/unit/lib/users/usage-period.test.ts` (8 rows) asserts the table above against the
  released helper: green.

## Still to run

- `supabase start && supabase test db` (pgTAP, including the new `21_usage_period`) - no
  Docker daemon on this machine.
- A browser check of the Usage tab's reset date and the credit ring on TEST.
