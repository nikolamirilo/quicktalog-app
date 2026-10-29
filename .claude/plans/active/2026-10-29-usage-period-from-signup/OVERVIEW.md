# Allowances that reset 30 days after signup: the short version

The detail is in [PLAN.md](PLAN.md).

## The problem

Every plan comes with an allowance that is meant to last a month: page views across all
your catalogues (from 1,000 on the free plan upwards) and AI credits for Quick AI (15 on
the free plan upwards). Today both reset on the 1st, counted in UTC. So the length of a
new account's first allowance depends on the day it signed up: sign up on the 2nd and you
get a month, sign up on the 28th and you get three days. Nothing says so on the pricing
page, which promises an allowance "per month".

## What goes wrong today

**Someone who signs up late in the month pays for a month and gets a few days.** A free
account created on 28 October can spend its 15 credits that evening and is then locked out
of Quick AI for three days; a paid account created on the 28th hits the same wall with its
page views, and its catalogues go offline until the 1st.

**The reset date is nowhere in the product.** The credit ring says "Resets at the start of
each month" and the Usage tab says nothing at all, so the only way to know how long you
have to wait is to know the rule.

**Upgrading mid-month does not extend anything.** The allowance is bound to the calendar,
not to the account, so a plan bought on the 29th buys two days of its page views.

## The fix in one idea

**Each account gets its own 30-day clock, started on the day it was created.** Credits and
page views are counted inside the current 30-day period and reset at the end of it, every
30 days, for as long as the account exists. An account created on 28 October resets on 27
November, then 27 December, and so on.

1. The database works out the period from the signup date and counts usage inside it — the
   same number the dashboard shows, the builder enforces and the nightly traffic check
   uses.
2. The dashboard names the date: "Resets on 27 November".
3. The switch-over itself is neutral: no account's counted usage can go up on the day we
   turn this on, so nobody is suddenly over their limit.

The guarantee: whatever day you join, your first allowance lasts as long as everyone
else's.

## What users will notice

- The Usage tab says when the allowance resets, and the credit ring in the builder says
  "Resets every 30 days" instead of naming the 1st.
- A new account's allowance no longer runs out early because of the day it joined.
- The messages about running out — the limit pop-up, the AI's own explanation, the refusal
  when a catalogue cannot go live — talk about "this period" and the reset date instead of
  "this month".
- The pricing page and the plan tables say "per 30 days" instead of "per month".
- Nothing about the allowance *sizes* changes, and nothing about billing changes: a
  subscription is still charged monthly or yearly by Paddle on its own date.

## Decisions we made (please confirm)

- **The clock starts at signup for everyone, free and paid.** Simple, and every account
  has a signup date. The cost: for a paying subscriber the reset date slowly drifts away
  from the renewal date — 30-day periods give 12.17 resets a year against 12 payments.
  Anchoring paid accounts on their renewal date instead is possible but needs the renewal
  date stored on the account, which it is not today.
- **A period is 30 days, not "the same date next month".** Predictable and equal for
  everyone; the trade-off is that the reset date moves back by a day or two each month
  rather than staying on, say, the 28th.
- **Page views and AI credits share one period.** One date to show, one rule to explain.
  The catalogue limit is unaffected — it counts what you have, not what you used.
- **The reset happens at midnight UTC on the reset day.** Page views are recorded per day,
  so a boundary in the middle of a day could not be counted exactly.
- **Nobody loses allowance on the day we switch over.** An account's first 30-day period
  is cut short rather than reaching back into days that the old monthly reset had already
  forgiven. In practice some accounts get a slightly generous first period, and none get a
  worse one. This ties the change to the month we deploy it in (November 2026 as written);
  deploying in a different month means changing that date first.
- **AI credit refunds are capped per period** rather than per calendar month, so the cap
  follows the same clock as the allowance it protects.

## Order of work

1. The database works out each account's 30-day period and counts credits and page views
   inside it.
2. The shared package gets the same rule so every part of the product agrees on it.
3. The nightly job that takes catalogues offline over the traffic limit uses the account's
   period.
4. The dashboard reads the period and shows the reset date.
5. The wording across the builder, the limit pop-ups, the manual and the pricing page.
6. The written documentation of how the limit works.
7. Rollout: test environment first, checked in a browser against a real account, then
   live.

Each step is checked with the project's test suites (database tests for step 1, the app's
own tests for the rest) plus a browser check on TEST. The database changes: three existing
functions start counting from the account's period instead of the 1st of the month, and a
new helper works the period out. No table or column changes, so no data is moved and
nothing is lost if we need to go back.

## Not in this plan

- Anchoring paid accounts on their Paddle renewal date (see the first decision).
- Carrying unused credits over into the next period; they still expire.
- Any change to the allowance sizes or prices.
