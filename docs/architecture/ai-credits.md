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
| `describe` (item description) | **1** | one `deepseek-flash` call - the floor, and the unit the pricing page explains |
| a turn that applied nothing and fetched nothing | **0** | refunded; asking a question stays free |
| OCR scan | **0** | runs in the user's browser; only the chat turn that uses the text is charged |

Two properties to preserve when tuning: **a question is free**, and **1 credit is
the smallest useful action**, so "1 credit ≈ one AI-written description" stays true.

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

In the database, not in TypeScript. `private.begin_ai_turn` is a definer function
called through `withUser`, so the caller's identity comes from the session rather
than the request body.

```
openAiTurn            lib/ai/turn.ts     picks the base price for the kind of turn
  startAiTurn         lib/ai/metering.ts one transaction, users row locked
    private.begin_ai_turn                ownership, floor test, insert
```

It does four things in one transaction:

1. Refuses a catalogue the caller does not own (`not_found`).
2. Takes `for no key update` on the caller's `users` row, so two parallel requests
   cannot both pass the same check.
3. Floor test: `sum(credits)` for the current UTC month against the plan's
   `ai_credits`. This asks "has this user got anything left", **not** "can they
   afford what is coming".
4. Inserts the row with the base price **before** any model call.

Charging up front is deliberate: a turn killed at the 60s platform ceiling stays
charged, after the model spend has already happened.

### Settling and refunding

- `private.settle_ai_turn` adds the variable part in the route's `onFinish`:
  one credit per task settled this request, two per page read this request.
- `private.refund_ai_turn` marks `refunded_at` when a turn changed nothing and
  opened no plan. The balance query skips refunded rows, so that is a zero charge.

The floor test is `used + base > limit`, not `used >= limit`: a turn that cannot
pay its base price never starts. One credit can therefore be left stranded at the
end of a month, which is the honest reading of a cap.

**A turn can still finish slightly over**, because the settle price is not known
until the turn ends - at most one task's worth. It cannot run far over: a
continuation is refused as soon as the balance is spent (below), so a long plan
stops on a task boundary rather than spending the month.

The billable unit is a **completed task**, counted from `completeTask` - not
`session.applied`, which holds one entry per edit. Charging per edit is what put a
free user on 16 of 15 credits from a single catalogue build. Skipped tasks are free,
so the model cannot skip its way to a cheap turn.

### Continuations

A plan spanning several requests is one charge. `begin_ai_turn` returns
`continued` when the client presents the turn id it was given plus the hash of the
plan it is resuming, and the database holds that user's open plan on that
catalogue, younger than 15 minutes, under its continuation budget. Anything that
is not a proven continuation falls through and is charged.

A continuation takes no charge up front but settles one credit per task when it
ends, so it is **refused once the balance is spent**. The browser turns that
refusal into a `credits` plan halt, and the checklist says which tasks landed.
Without this the cap did not bind at all mid-plan: `continued` returns before the
floor test is reached.

The base price covers the turn's first task, so only the request that took the
charge discounts one. Every task settled by a later continuation is extra.

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
10/min, `aiHourly` 60/hour, keyed by user id), and the row-level lock above.

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

`public.prompts` is the ledger; one row is one charge.

| Column | Meaning |
|---|---|
| `credits` | the price of this turn, 0-100 |
| `turn_id` | what a continuation binds to |
| `continuations` | continuations spent against `plan_budget` |
| `refunded_at` | set by a refund; refunded rows leave the balance |
| `kind` | `agent` or `describe` |
| `plan_open`, `plan_budget`, `plan_hash` | continuation binding |
| `metadata` | analysis only, never billing |

Balance is `coalesce(sum(credits), 0)` over the UTC month where
`refunded_at is null`.
