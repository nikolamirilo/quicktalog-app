# AI credits

What an AI turn costs, where the balance is enforced, and what happens at the
month boundary. This is the page the pricing copy should be written from.

Credits replaced a per-prompt row count: plan mode turned one user ask into up to
nine HTTP requests, so "prompts per month" no longer described anything a user
could reason about.

---

## 1. The price list

Set in [`src/lib/ai/pricing.ts`](../../src/lib/ai/pricing.ts). Change it there and the
server charge, the builder's plan estimate and the tests all move together.

| Action | Credits | Why |
|---|---|---|
| `agent` turn, base | **2** | `deepseek-v4-pro`, a large system prompt, up to 16 steps. Charged once per user ask; continuations of the same plan are free |
| each task settled beyond the first | **+1** | a 4-task build costs 5, a one-liner costs 2 |
| page read (`fetchUrl`) | **+2** | Firecrawl is the only hard per-call cash cost in the loop |
| image lookup | **0** | Unsplash is free and already capped per turn |
| `describe` | **1** | no surface charges it since the item-description writer was removed (2026-10-15); the price and the DB kind stay for existing ledger rows |
| a turn that applied nothing and fetched nothing | **0** | refunded; asking a question stays free |
| OCR scan | **0** | runs in the user's browser; only the chat turn that uses the text is charged |

A task is billed when it is completed, or when it is skipped after one of its edits
landed. A task skipped before any edit is free. A request that read a page is never
refunded, even if it changed nothing.

Two properties to preserve when tuning: **a question is free**, and **1 credit is
the smallest useful action**.

## 2. Allowances

`ai_credits` on each tier in `@quicktalog/common` (`src/constants/pricing.ts`).

| Plan | Credits / month | ≈ asks |
|---|---|---|
| Starter (free) | 15 | ~5 |
| Basic | 50 | ~17 |
| Pro | 150 | ~50 |
| Growth | 300 | ~100 |
| Premium | 600 | ~200 |
| German Silva (custom) | 50 | ~17 |

"≈ asks" assumes an average ask of 3 credits. **No rollover and no signup bonus** -
unused credits expire at the month boundary.

## 3. Where the balance is enforced

In the database, not in TypeScript, and as a **hard cap**: at every moment, confirmed
credits plus live holds stay at or below `ai_credits` for the UTC month, however many
requests run at once. `private.begin_ai_turn` is a definer function called through
`withUser`, so the caller's identity comes from the session, not the request body.

```
openAiTurn            lib/ai/turn.ts     base price, hold size, the request's budget
  startAiTurn         lib/ai/metering.ts one transaction, users row locked
    private.begin_ai_turn                ownership, balance test, charge + hold
route onStepEnd       spendAiHold        what the steps spent, moved from hold to charge
route onFinish        closingCharge      refund or the rest of the spend, then release
```

### Holding

`begin_ai_turn`, in one transaction:

1. Refuses a catalogue the caller does not own (`not_found`).
2. Takes `for no key update` on the caller's `users` row, so two parallel requests
   cannot both pass the same check.
3. Reads the balance: `sum(credits)` plus every hold still live (`held_until > now()`),
   over the current UTC month.
4. **A new turn** must be able to pay its base (`used + base <= limit`). It is charged
   the base and holds `least(requestHoldFor, limit - used - base)`.
5. **A continuation** needs one credit of room. It takes no base and holds
   `least(requestHoldFor, limit - used)`. Only one request per turn can hold at a
   time; a parallel copy is not a continuation and is charged as a new turn.

`requestHoldFor` (`lib/ai/limits.ts`) is the largest request a plan allows: every task
of the longest plan plus every page read (18 on paid plans, 4 on Starter). A hold lasts
90 seconds (`maxDuration` plus margin), so a request that was killed gives its hold back
on its own.

### Spending

The agent spends only from its own hold (`agent/credits.ts`, `RequestCredits`):

- A **page read** is paid before Firecrawl is called (2 credits).
- A **task** is paid before its first edit lands (1 credit; the base covers the first
  task of a charged request). If the hold cannot pay, the edit is refused, the model gets
  one text-only step to tell the user what landed, and the loop ends.
- The model is told the budget when it binds ("CREDITS: this request can pay for up to
  N tasks"), so it plans what fits instead of stopping half way.

After every step the route moves what was spent into the charge (`spend_ai_hold`, which
never moves more than is held). When the request ends it charges the rest, or refunds a
question (`closingCharge`), and releases the hold (`release_ai_hold`).

### Continuations

A plan spanning several requests is one base charge. `begin_ai_turn` returns
`continued` when the client presents the turn id it was given plus the hash of the
plan it is resuming, and the database holds that user's open plan on that catalogue,
younger than 15 minutes, under its continuation budget. Anything that is not a proven
continuation falls through and is charged. A continuation refused for want of credits
becomes the checklist's `credits` halt.

## 4. The month boundary

`date_trunc('month', now(), 'UTC')`, computed in SQL on every call - in both
`begin_ai_turn` and `private.my_usage`. It is never computed in Node: a warm
serverless instance would keep using the month it started in, and balances would
stop resetting.

## 5. Free-plan guards

Starter has credits, so an unpaid account can cost real money. The controls ship
with the feature, in [`src/lib/ai/limits.ts`](../../src/lib/ai/limits.ts):

| Control | Free | Paid |
|---|---|---|
| Page reads per ask | **0**, and `fetchUrl` is removed from the toolset | 3 |
| Model | `deepseek-flash` | `deepseek-v4-pro` |
| Tasks per plan | 4 | 12 |

**A free-tier turn also requires a confirmed email address.** `begin_ai_turn`
returns `unverified` (403) when the caller's `auth.users` row has a null
`email_confirmed_at`. Two details matter:

- It reads `auth.users.email_confirmed_at`, **not** the JWT's
  `user_metadata.email_verified`. That claim is writable by the user it describes
  (`supabase.auth.updateUser({ data: … })`), so gating on it would be forgeable by
  exactly the accounts the check exists to stop.
- A `public.users` row with no `auth.users` match is left alone. Those predate the
  Supabase cutover and cannot be a fresh unconfirmed signup; requiring a match
  would lock out legacy accounts instead of farmers.

The check costs nothing extra: it runs inside the transaction that already reads
the plan and takes the row lock.

Plus, for everyone: two rate-limit windows on both AI entry points (`aiBurst`
10/min, `aiHourly` 60/hour, keyed by user id), and the row-level lock above. The rate
limit is not what bounds the cap (it lets requests through when Redis is down); the
holds are.

Not implemented, worth revisiting if abuse shows up: a disposable-email-domain
blocklist, and a global monthly ceiling on free-tier spend with a kill switch.

## 6. What the user sees

- **Dashboard** - an "AI Credits" donut, `usage.credits` against `ai_credits`.
- **Chat footer** - credits left, highlighted under 5. An ask no longer costs a
  fixed amount, so finding the limit only through a modal is worse than it was.
- **Plan checklist** - "Working through 4 things · about 5 credits", shown as soon
  as `createPlan` returns and before the first edit lands.
- **Limit modal** - a free user is told what they already get, not only what they
  are missing; running out mid-build is the conversion moment.

## 7. Schema

`public.ai_credits` is the ledger; one row is one charge.

| Column | Meaning |
|---|---|
| `catalogue_id` | the catalogue the turn ran on; set to null when the catalogue is deleted, so the charge still counts |
| `credits` | the price of this turn, 0-100 |
| `turn_id` | what a continuation binds to |
| `continuations` | continuations spent against `plan_budget` |
| `refunded_at` | set by a refund; refunded rows leave the balance |
| `kind` | `agent` or `describe` |
| `plan_open`, `plan_budget`, `plan_hash` | continuation binding |
| `held` | credits a running request has reserved, 0-100; counts against the balance while live |
| `held_until` | when the hold lapses if the request never releases it |
| `metadata` | analysis only, never billing |

Usage (the dashboard, `private.my_usage`) is `coalesce(sum(credits), 0)` over the UTC
month where `refunded_at is null`. The balance `begin_ai_turn` judges by adds every live
hold to that.
