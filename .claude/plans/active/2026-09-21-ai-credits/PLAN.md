# Prompts to AI credits, with credits on the free plan

Status: proposed

Written 2026-09-21 against `test` (`d9c8ce2`). Supersedes **Part 2** of
[`../ai-agent-plan-mode.md`](../ai-agent-plan-mode.md), which sketched the same idea
before plan mode shipped and before the AI surfaces changed. Part 1 of that document
(plan mode) is built and is assumed here.

Two things are being decided at once, and they are not separable:

1. **The unit changes.** `ai_prompts` (a row count) becomes `ai_credits` (a priced
   balance), because plan mode turned one user ask into up to nine HTTP requests and
   because a "prompt" never told anyone what it buys.
2. **The free plan gets AI.** Starter (`tiers[0]`, the plan every new account is
   provisioned on, `lib/users/provision.ts:9`) has `ai_prompts: 0` today, so a free
   user sees the assistant and is refused by it. Giving it a small credit balance
   turns the product's best demo into something a visitor can actually run.

---

## 1. What is actually there today

Verified in the repo and with read-only SELECTs on TEST (`imhinsgyzzyblghwnedk`).

### 1.1 The AI surfaces that cost money

| Surface | Entry point | Model / vendor | Metered today |
|---|---|---|---|
| Builder agent | `app/api/agent/route.ts` | `deepseek-v4-pro`, up to 16 steps (`agent/model.ts`) | one `prompts` row per charged request |
| Item description writer | `writeItemDescription`, `actions/ai.ts` | `deepseek-flash`, one call (`utils/deepseek.ts`) | one `prompts` row |
| Web page read | `readPage` tool, `agent/web.ts` | Firecrawl, capped at 3 per ask (`agent/session.ts:33`) | not metered |
| Image lookup | `agent/images.ts` | Unsplash, free | not metered |
| Image OCR | `hooks/useChatImageOcr.ts` | tesseract.js, **in the browser** | not metered |

Two things follow from that table and they both matter:

- **`ocr_ai_import` is a phantom limit.** OCR moved into the browser; nothing inserts
  into `public.ocr` anywhere in the codebase, so `usage.ocr` is always 0, the donut in
  `MonthlyUsage.tsx:48` always reads empty, and the pricing page still sells
  "N OCR AI imports per month" (`PricingColumn.tsx:68-72`) for a thing that costs
  nothing and is not counted. It should be retired, not converted.
- **`/api/ai` and `AIBuilder` are gone.** Part 2 of the old plan priced a
  `catalogue.generate` action at 10 credits; there is no such route in the repo.

### 1.2 Metering is broken, so the current limit barely binds

```
prompts_service_catalogue_key  UNIQUE (catalogue)     -- confirmed on TEST
```

`meter()` (`lib/ai/access.ts:95-101`) inserts `(user_id, catalogue)`. The second
insert for the same catalogue violates that unique constraint. Consequences:

- **Agent:** the error is caught and sent to Sentry (`app/api/agent/route.ts:125-128`),
  so every ask after the first *on a given catalogue* is free. A free-plan-sized
  allowance has never actually been enforced against real traffic.
- **Item descriptions:** the `meter()` call sits inside the action's `try`
  (`actions/ai.ts:58`), so a successful generation is reported to the user as
  "Generation failed. Try again." once that catalogue already has a prompt row.

**This is the single biggest risk in the whole change.** The day the constraint is
dropped, enforcement becomes real for the first time. Allowances have to be set with
that in mind, or a paying user's experience gets worse on launch day.

### 1.3 Other defects the change has to carry

| Defect | Where | Effect |
|---|---|---|
| Month window computed at module import, in local time, compared against a UTC `timestamptz` | `helpers/client.ts:22-23` | in a warm serverless instance the window never rolls over; balances stop resetting |
| `catalogue` FK is `ON DELETE CASCADE` | `prompts_catalogue_fkey` | deleting a catalogue deletes its charges and refunds the month |
| `user_id` nullable | `public.prompts` | a null row silently leaves the count |
| Check-then-insert with no lock | `lib/ai/access.ts:67-72` then `meter()` | N parallel requests all pass the same check |
| The charge is written in `onFinish` | `app/api/agent/route.ts:112` | a turn killed at the 60s platform ceiling is free, after full model spend |

### 1.4 The auth migration already owns most of this

`.claude/plans/active/supabase-auth-migration/` (approved, Phase 0A soaking, M00 not
yet applied) rebuilds `prompts` into a proper ledger:

- **M03 §3.7** drops `UNIQUE(catalogue)`, makes the catalogue FK `ON DELETE SET NULL`
  with `catalogue` nullable, makes `user_id NOT NULL`, adds `turn_id` (unique, with a
  default), `continuations`, `refunded_at`, and the `(user_id, datetime)` index.
- **M06** adds `kind`, `plan_open`, `plan_budget`, `plan_hash` and the definer
  functions `private.begin_ai_turn` / `set_plan_state` / `refund_ai_turn`, which
  charge **before** model spend, serialise a user's charges with
  `FOR NO KEY UPDATE` on their `users` row, and make a plan continuation free only
  when the client presents the turn id it was given plus the hash of the plan it is
  resuming.

That SQL is PGlite-verified over 692 scenarios. **This plan must not re-invent it.**

---

## 2. The decisions

### 2.1 Credits ride on `prompts`, not on a new table

The old Part 2 proposed a new `public.ai_credits` table. Don't. M06 already builds
turn binding, refunds, per-user locking, RLS policies and pgTAP tests on `prompts`; a
second table means all of it twice, applied weeks apart, with two sources of truth for
"what has this user spent".

**Add one column instead:**

```sql
alter table public.prompts add column credits integer not null default 1;
```

and change the balance query from `count(*)` to `coalesce(sum(credits), 0)`. One row
is still one charge; it now has a price. Every index, policy, function and test in the
auth migration keeps working. The word "prompts" stays as a table name and disappears
from the product vocabulary — that is an acceptable trade for not forking the schema.

### 2.2 Sequencing: ship credits first, let the auth migration absorb it

Free-plan credits is a growth change and should not wait for the Clerk cutover. But
both streams touch the same table, so the contract has to be explicit:

- A new migration **C01** lands **before** M00. It lifts M03 §3.7 *verbatim* (that SQL
  is already verified and is written name-independently, with `if not exists` and a
  constraint-lookup loop) and adds `credits`, plus `kind` from M06.
- M03 §3.7 and M06's `alter table` block then re-run as **no-ops**. Confirm this by
  re-running the PGlite harness with C01 applied first; do not assume it.
- The `begin_ai_turn` in M06 changes `count(*)` → `sum(credits)` and gains a
  `p_credits` argument. That is a two-line edit to unapplied SQL.

Until the auth cutover, Drizzle still connects as `postgres` (BYPASSRLS), so the
balance check lives in TypeScript. Write it behind an interface that does not care:

```ts
// lib/ai/credits.ts
export async function beginTurn(args: {
  userId: string; catalogue: string; kind: "agent" | "describe";
  limit: number; credits: number; continuationOf?: string; planHash?: string;
}): Promise<{ outcome: "charged" | "continued" | "limit" | "not_found"; turnId?: string }>;

export async function settleTurn(turnId: string, extraCredits: number): Promise<void>;
export async function refundTurn(turnId: string): Promise<void>;
```

Phase 1 implements those three against Drizzle inside one transaction with
`select ... from users where id = $1 for no key update` (which fixes the concurrency
hole in §1.3 today, not just after the cutover). Phase 2 of the auth migration swaps
the bodies for `private.begin_ai_turn(...)` calls. Callers never change.

### 2.3 Reserve at the start, settle at the end

The price of a turn is not known until it is over, but charging only at the end means
a turn killed at 60s is free. So:

1. **Before any model call**, insert the row with the base price (`beginTurn`). The
   pre-flight test is a floor test — "has this user got anything left" — not "can they
   afford what is coming".
2. **In `onFinish`**, add the variable part to that same row (`settleTurn`): one credit
   per task settled this request, two per page fetched.
3. **If the turn changed nothing and fetched nothing**, set the row to 0 credits
   (`refundTurn`). A question stays free, as it is today.

A long plan can therefore finish a few credits into the red. That is the right trade:
the alternative is abandoning a half-applied plan mid-way, which is exactly the state
plan mode exists to prevent. Let the last plan overshoot and block the *next* ask.

### 2.4 The price list

| Action | Credits | Why |
|---|---|---|
| `agent` turn, base | **2** | `deepseek-v4-pro`, a large system prompt, up to 16 steps. Charged once per user ask; continuations are free |
| each task settled beyond the first | **+1** | a 4-task build costs 5, a one-liner costs 2 |
| `readPage` | **+2** | Firecrawl is the only hard per-call cash cost in the loop |
| image lookup | **0** | Unsplash is free and already capped at 24 per turn |
| `describe` (item description) | **1** | one `deepseek-flash` call — this is the floor, and the unit the pricing page explains |
| a turn that applied nothing and fetched nothing | **0** | refunded; asking questions must stay free |
| OCR scan | **0** | runs in the user's browser; only the chat turn that uses the text is charged |

Two properties to preserve when tuning: **a question is free**, and **1 credit is the
smallest useful action**, so "1 credit ≈ one AI-written description" is a sentence that
can go on the pricing page.

These ratios are a starting point, not revenue. Set the absolute allowances from
measured cost — §5 Phase 0 exists to produce that measurement.

### 2.5 Allowances, including the free plan

| Plan | `ai_prompts` today | `ai_credits` | ≈ asks / month | Reasoning |
|---|---|---|---|---|
| **Starter (free)** | 0 | **15** | ~5 | Enough to build one catalogue with the agent and edit it, which is the whole demo. The plan caps out at 1 catalogue / 5 sections / 15 items anyway, so there is a natural ceiling on what those credits can produce |
| Basic | 0 | **40** | ~13 | AI stops being a paid-tier teaser; the cheapest paid plan must clearly beat free |
| Pro | 10 | **120** | ~40 | |
| Growth | 25 | **300** | ~100 | |
| Premium | 50 | **600** | ~200 | |
| German Silva (custom) | 0 | **40** | ~13 | Matches Basic — **confirm with the owner before shipping** |

"≈ asks" assumes an average ask of 3 credits (base 2, plus roughly one task or fetch).
Paid tiers land at roughly 4× today's nominal prompt count. That looks generous, and it
is deliberate: §1.2 means today's nominal number was never actually enforced, so
launching at parity would feel like a downgrade to every active user.

**No rollover, no welcome bonus.** Unused credits expire at the month boundary
(simpler to explain, and it keeps the liability bounded). A one-time signup grant was
considered and rejected: it multiplies the payoff of farming accounts without making
the first session meaningfully better than a 15-credit monthly grant already does.

### 2.6 What a free user can actually do

Worth stating explicitly, because it is the point of the change:

- **Write and improve item descriptions** — 1 credit each, ~15 a month.
- **Build a catalogue by chatting** — "make me a menu for a small coffee shop with 10
  items" is one ask, a 3-4 task plan, ~5 credits.
- **Scan a photo of a printed menu** and have the agent turn it into sections — the
  OCR itself is free (browser-side); the chat turn that uses it is a normal ask.
- **Not** read a web page. See §3.

Running out mid-build is the conversion moment, and the limit modal is what has to land
it (§4.4).

---

## 3. Guarding free AI

Free credits mean cost attached to an unpaid account, so the controls come with the
feature, not after it.

| Control | Where | Why |
|---|---|---|
| **No `readPage` on the free plan** | `agent/session.ts` — make `MAX_FETCHES_PER_TURN` come from the plan, 0 for Starter; drop the tool from the toolset so the model does not try and fail | Firecrawl is the only hard cash cost per call and the only surface that pulls a stranger's content into a model holding write tools |
| **Cheaper model on the free plan** | `agent/model.ts` — `agentModel` becomes `modelFor(planId)`, `deepseek-flash` for Starter | The largest single lever on free-tier cost. Costs some quality; measure before deciding (§5 Phase 0) |
| **Shorter plans on the free plan** | `MAX_PLAN_TASKS` from the plan, 4 for Starter | Bounds the worst single ask |
| **Verified email required for AI** | `authorize()` in `lib/ai/access.ts` | Cheapest defence against signup farming. Clerk exposes primary-email verification; check it there rather than in middleware |
| **Rate limit per user** | `@upstash/ratelimit` (already a dependency) in `app/api/agent/route.ts` and `writeItemDescription`, e.g. 10/min and 60/hour | Stops a script burning a month of credits in seconds and takes pressure off the balance check |
| **Row-level serialisation** | `beginTurn` transaction, `for no key update` on the caller's `users` row | Closes the parallel-request hole today, and is what `private.begin_ai_turn` will do after the cutover |

Not included, but worth revisiting if abuse shows up: a disposable-email-domain
blocklist, and a global monthly ceiling on free-tier spend with a kill switch.

---

## 4. The work

### 4.1 `@quicktalog/common` (`../quicktalog-packages`) — needs a release

| Change | File |
|---|---|
| `PricingPlan.features.ai_credits: number`; keep `ai_prompts` until Phase 4 | `src/types/general.ts` |
| `Usage.credits: number`; keep `prompts`, drop `ocr` in Phase 4 | `src/types/general.ts` |
| `AreLimitesReached.credits` | `src/types/general.ts` |
| `LimitType`: keep `"ai"`, drop `"ocr"` in Phase 4 | `src/types/enums.ts` |
| `ai_credits` on all six tiers per §2.5 | `src/constants/pricing.ts` |
| Regenerate schema after C01 (`drizzle-kit pull`) | `src/drizzle/migrations/` |

Order matters: migration → `drizzle-kit pull` → release → bump the app.

### 4.2 Database — migration `C01_ai_credits_ledger`

```sql
-- 1. M03 §3.7 lifted verbatim: drop UNIQUE(catalogue) and the CASCADE FK by lookup,
--    catalogue nullable with ON DELETE SET NULL, back up and delete null-user rows,
--    user_id NOT NULL, turn_id uuid unique default gen_random_uuid(),
--    continuations, refunded_at, (user_id, datetime) index, catalogue index.
-- 2. kind, from M06:
alter table public.prompts add column if not exists kind text not null default 'agent';
alter table public.prompts add constraint prompts_kind_check check (kind in ('agent','describe'));
-- 3. the unit:
alter table public.prompts add column if not exists credits integer not null default 1;
alter table public.prompts add constraint prompts_credits_range check (credits between 0 and 100);
-- 4. analysis only, never billing:
alter table public.prompts add column if not exists metadata jsonb;
```

RLS is already enabled on `prompts` and no policies exist (deny by default, `postgres`
bypasses). A new column needs nothing further — but **do not** grant anything to
`anon`/`authenticated`: the M00 guard in `20260917133921_perimeter_close.sql` fails the
migration if they hold privileges in `public`.

Apply to TEST, soak, then PROD. Never edit an applied migration.

### 4.3 App — server

| # | Change | File |
|---|---|---|
| 1 | Compute the month window per call, in UTC. Export `monthWindow()`; delete the module-level constants | `helpers/client.ts:22-23`, callers in `lib/users/fetchUserData.ts` |
| 2 | `beginTurn` / `settleTurn` / `refundTurn` over Drizzle, one transaction, `for no key update` | `lib/ai/credits.ts` (new) |
| 3 | `authorize()` returns `{ balance, planId, limits }` and checks `sum(credits) < ai_credits`; add the verified-email check | `lib/ai/access.ts:34-85` |
| 4 | Delete `meter()`; its two callers move to `beginTurn`/`settleTurn` | `lib/ai/access.ts:95` |
| 5 | Agent route: `beginTurn` before the stream, `settleTurn`/`refundTurn` in `onFinish` from `session.applied`, tasks settled this request and fetches this request. Return `turnId` in stream metadata (it is what M06 will bind continuations to) | `app/api/agent/route.ts` |
| 6 | Expose `tasksSettledThisRequest` and `fetchesThisRequest` on the session | `agent/session.ts` |
| 7 | Plan-derived `MAX_FETCHES_PER_TURN`, `MAX_PLAN_TASKS`, model choice | `agent/session.ts`, `agent/plan.ts`, `agent/model.ts`, `agent/index.ts` |
| 8 | `writeItemDescription`: `beginTurn(kind:"describe")` before the call, `settleTurn` after; move it **out** of the `try` that currently swallows it into a false "Generation failed" | `actions/ai.ts:58` |
| 9 | `usage.credits` as `sum(credits)` over the UTC month; keep `usage.prompts` during the dual window | `lib/users/fetchUserData.ts:95-113` |
| 10 | Rate limits on both AI entry points | `app/api/agent/route.ts`, `actions/ai.ts` |

### 4.4 App — client and UI

| # | Change | File |
|---|---|---|
| 1 | Gate on `usage.credits >= ai_credits` | `hooks/useAiAssist.ts:25-28`, `hooks/useCatalogueChat.ts:205-208` |
| 2 | `areLimitesReached.credits`; drop the `ocr` entry | `app/admin/dashboard/[[...rest]]/page.tsx:35-36` |
| 3 | "AI Prompts" donut becomes "AI Credits"; remove the OCR donut | `components/dashboard/MonthlyUsage.tsx:38-56` |
| 4 | Remaining balance in the chat panel footer — under credits the cost per ask is no longer constant, so discovering the limit through a modal is worse than it was | `components/catalogue/chat/CatalogueChat.tsx` |
| 5 | "4 things · about 5 credits" on the checklist once `createPlan` returns, before the first edit lands | `components/catalogue/chat/PlanChecklist.tsx` |
| 6 | Limit modal: credits copy, next tier's credit figure, and for a free user the specific "you have 15 free credits a month, Basic gives you 40" framing | `components/modals/limits/limitContent.ts`, `LimitUpgradeComparison.tsx` |
| 7 | `"{n} AI prompts per month"` → `"{n} AI credits per month"`, plus the §2.4 price table nearby (without it the number means nothing), and Starter's credits shown on the free tier | `components/home/Pricing/PricingColumn.tsx:62-72` |
| 8 | Drop the `ocr_ai_import` row | `components/dashboard/subscription/BillingHistory.tsx:12,50` |

### 4.5 Tests

Alongside `tests/unit/agent/` and `tests/unit/server_actions/ai.test.ts`:

- `credits.test.ts` — base charge on `beginTurn`; `settleTurn` adds task and fetch
  credits; a no-op turn refunds to 0; a user at exactly the limit is refused; a user one
  credit under is allowed and may overshoot; two concurrent `beginTurn` calls for the
  same user cannot both pass (integration, against a real Postgres).
- `access.test.ts` — free plan with balance is allowed (this is the regression that
  proves the feature); unverified email refused; a failed `fetchUserData` still fails
  closed.
- `session.test.ts` — Starter gets 0 fetches and the `readPage` tool absent; Starter's
  plan is capped at 4 tasks.
- `route.test.ts` — a continuation does not charge a second base credit; a turn killed
  mid-stream leaves the base charge in place.
- Month-boundary test for `monthWindow()` across a UTC month rollover.
- Update the `ai_prompts` fixtures in `tests/unit/helpers/client.test.ts:158-183`.

Before finishing: `npx tsc --noEmit`, `npm run check`, `npm test`.

### 4.6 Docs

- `docs/architecture/ai-chat-flow.md` is already flagged outdated; refresh it in the
  same change — metering is one of its boxes.
- New `docs/architecture/ai-credits.md`: the price list, the allowances, where the
  balance is enforced, and what happens at the month boundary. This is the page the
  pricing copy should be written from.
- Archive `ai-agent-plan-mode.md` once this ships, per `.claude/plans/README.md`.

---

## 5. Rollout

| Phase | What | Gate to the next phase |
|---|---|---|
| **0. Measure** | Record token usage and vendor cost per turn into `prompts.metadata` (add the column early, write from `onFinish`). Fix the month-window bug. Change no enforcement | Two weeks of real data: cost per turn per model, tasks per ask, fetches per ask |
| **1. Ledger** | C01 on TEST → soak → PROD. `lib/ai/credits.ts`, reserve-and-settle, concurrency lock, rate limits. Write `credits` on every row. **Still enforce on the old count** | The ledger's numbers match what the old counter would have said, and nobody is newly blocked |
| **2. Price** | Set the final §2.4 and §2.5 numbers from Phase 0 and Phase 1 data. Release `@quicktalog/common` | Owner signs off on the numbers, including the custom plan |
| **3. Flip** | Enforce on credits. Free plan on. All UI. Pricing page rewrite. Free-plan guards (§3) ship **in this phase, not later** | One week with no spike in free-tier cost and no support reports of wrongly blocked paid users |
| **4. Clean up** | Delete `ai_prompts`, `ocr_ai_import`, the `ocr` table and `LimitType: "ocr"`. Keep `prompts` rows as history | — |

Phase 3 is the first moment the limit ever truly binds (§1.2). Before flipping, run the
Phase 1 ledger against the proposed allowances and count how many *current* users would
have been blocked last month. If that number is not near zero for paid plans, the
allowances are wrong, not the users.

---

## 6. Open questions for the owner

1. **15 free credits** — the number is a judgement call, not a derivation. Too low and
   the free user never reaches the "oh, it built my menu" moment; too high and there is
   no reason to pay for Basic.
2. **`deepseek-flash` for free-plan turns** — a real cost lever with a real quality
   cost. Worth a side-by-side on three typical asks before deciding.
3. **Does a skipped task cost a credit?** Proposed: no, only `completeTask` charges.
   Watch for a model that learns to skip its way to cheapness.
4. **The custom plan (`tiers[5]`)** — 40 credits is a guess against a contract this
   plan has not seen.
5. **Rollover** — proposed no. If it ever becomes yes, it needs a balance table rather
   than a sum over a window, which is a much bigger change; decide now.
6. **Should credits be purchasable as a top-up?** Out of scope here, but the ledger
   shape (a sum over a window) makes it awkward later. Same decision as rollover.
