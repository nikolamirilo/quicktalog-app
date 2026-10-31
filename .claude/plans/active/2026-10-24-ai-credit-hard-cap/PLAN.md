Status: in progress (code done 2026-10-24; pending: migration on TEST, drizzle-kit pull + package release, TEST check, then Task 10 drop of settle_ai_turn)

# AI credit hard cap and full plan enforcement for the builder agent: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The builder agent never spends more AI credits than the user's plan allows, in any order of requests.

**Architecture:** `begin_ai_turn` holds the most a request can spend, under the `users` row lock it already takes, and every live hold counts against the month's balance. The agent spends only from its own hold: it refuses a page read, or the first edit of a task, that the hold cannot pay for. The route writes what was spent to the ledger after every step and releases the rest when the request ends. The appearance and newsletter flags are added to the operation limits, the toolset and the save path, the same way `branding` already is.

**Tech Stack:** Supabase Postgres (plpgsql, pgTAP), Next.js 15 route handler, AI SDK 7.0.97 `ToolLoopAgent` (`prepareStep`) and `createAgentUIStreamResponse` (`onStepEnd`), Drizzle via `withUser`, Vitest.

**Spec:** [FINDINGS.md](FINDINGS.md): overage paths O1–O6. Plain-language summary: [OVERVIEW.md](OVERVIEW.md).

## Decisions to confirm before work starts

| # | Decision | Why / cost |
|---|---|---|
| D1 | **Hard cap.** At every moment, confirmed credits plus live holds stay at or below `ai_credits` for the UTC month, however many requests run in parallel. This replaces "let the last plan overshoot and block the next ask" (archived `2026-09-21-ai-credits` §2.3) | Closes O1, O2 and O3. The cost: a long plan can stop on a task boundary when the balance runs out. The model is told the balance before it writes a plan, so it plans what fits |
| D2 | A task costs 1 when it is **completed, or skipped after one of its edits landed**. A task skipped before any edit stays free | Closes O6 (archived open question 3) |
| D3 | A request that read a page is **never refunded** | Closes O4. The docs and the help page already say this |
| D4 | One request holds `maxPlanTasks × 1 + maxFetches × 2` credits (18 on paid plans, 4 on Starter), clamped to what is left, for at most **90 s** | Enough for the largest plan plus every page read, so a full-balance request never runs short. A second ask sent in parallel at a low balance is refused while the first runs |
| D5 | Price list unchanged: base 2, +1 per task after the first, +2 per page read, a question is free | The pricing copy stays valid |

## Global Constraints

- Work on TEST (`imhinsgyzzyblghwnedk`). Touch PROD only when the owner asks explicitly.
- Schema and function changes go only in new files in `supabase/migrations/`. Never edit an applied migration. Never run `drizzle-kit push/generate/migrate` or `supabase db reset`. Apply with `supabase link --project-ref imhinsgyzzyblghwnedk` then `supabase db push` (`docs/guides/drizzle.md`).
- After the migration is on TEST, run `drizzle-kit pull` in `@quicktalog/common` (`../quicktalog-packages`, which was not checked out on this machine on 2026-10-24) and release it, so `ai_credits` gets `held` and `held_until`.
- Every query runs inside `withUser`. Never keep one open across a model call, `fetch` or the response stream: each per-step write is its own short `withUser`.
- Plan limits come from `users.plan_id` → `tiers`, read in the same transaction as the hold. Never from the request body.
- `/api/agent` stays within `maxDuration = 60`.
- The migration goes on the database **before** the Task 5 app code is deployed. The old app keeps working against it: `p_hold` defaults to 0, and `settle_ai_turn` is left alone until Task 10.
- Sentry: capture failures of the spend/release path (it is billing). Never double-capture.
- Before calling a task done, run `npx tsc --noEmit`, `npm run check` and `npm test`, plus `supabase start && supabase test db` for SQL tasks. Say plainly what was not run.
- No commits or branches unless the owner asks. Each task ends at "ready for review".

## Review Focus

The five cases most likely to break for a real user. Each now has a test in the task named.

1. **Two tabs at a low balance send asks at the same time.** Expected: one runs, the other gets the limit modal, and the ledger never goes over. Covered by pgTAP rows 2 and 14 (Task 1) and a manual TEST check (Task 9).
2. **The function is killed at 60 s mid-plan.** Expected: steps already written stay charged, nothing goes above the hold, the hold expires within 90 s and the next ask works. Covered by pgTAP rows 8–9 (Task 1).
3. **The plan is downgraded (Paddle webhook) while a plan is being continued.** Expected: the next continuation is judged against the new, lower allowance and refused, and the checklist shows the credits halt. Covered by pgTAP row 15 (Task 1).
4. **The month rolls over while a hold is live.** Expected: last month's hold does not reduce the new month's allowance. Covered by pgTAP row 16 (Task 1).
5. **Starter at 13/15 asks for a 4-part build.** Expected: the plan is refused because only one task fits. The model makes the single most important change, the month ends at exactly 15 (never 16), and the next ask opens the limit modal. Covered by a session test (Task 3) and `canStartAsk` (Task 9).

---

### Task 1: Ledger holds in the database

**Files:**
- Create: `supabase/migrations/20261024120000_ai_credit_holds.sql`
- Create: `supabase/tests/database/42_ai_credit_holds.test.sql`

**Interfaces:**
- Produces (all `security definer`, `search_path = ''`, owner `postgres`, `revoke all … from public`, `grant execute … to app_user`, the same pattern as the end of `20260926190000_ai_credit_limit_binding.sql`):
  - `public.ai_credits.held integer not null default 0` with `constraint ai_credits_held_range check (held between 0 and 100)`, and `public.ai_credits.held_until timestamptz`
  - `private.begin_ai_turn(p_catalogue text, p_limit integer, p_kind text, p_continuation_of uuid, p_plan_hash text, p_credits integer default 1, p_require_verified boolean default false, p_hold integer default 0) returns table (outcome text, ai_turn_id uuid, held integer)`. The old 7-argument form is dropped.
  - `private.spend_ai_hold(p_turn_id uuid, p_credits integer) returns integer`: moves `least(p_credits, held)` from `held` to `credits` on the caller's own, unrefunded, unexpired row and returns how much it moved (0 otherwise). `p_credits` outside 0–100 raises 22023.
  - `private.release_ai_hold(p_turn_id uuid) returns boolean`: sets `held = 0, held_until = null` on the caller's own row.
- Unchanged: `settle_ai_turn` (dropped in Task 10), `refund_ai_turn`, `set_plan_state`, `my_usage` (confirmed credits only; holds are not usage).

**Rules the SQL must implement** (the only part the signatures do not settle):
- Balance in `begin_ai_turn` = `sum(credits)` plus `sum(held)` where `held_until > now()`, over unrefunded rows created in the current UTC month.
- New turn: refused when `used + p_credits > p_limit`. Inserts `held = least(p_hold, p_limit − used − p_credits)` (or `p_hold` when `p_limit` is null) and `held_until = now() + interval '90 seconds'`.
- Continuation: refused when `used >= p_limit`. The existing `update` also requires `(a.held = 0 or a.held_until <= now())`, so a turn has at most one request in flight. It sets `held = least(p_hold, p_limit − used)` and `held_until` as above.
- `p_hold` outside 0–100 raises 22023. Add a comment that 90 s means `maxDuration` (60) plus margin.

- [ ] **Step 1: Write `42_ai_credit_holds.test.sql`** using the fixtures and role switching of `40_ai_ledger.test.sql` (own fixture plan, two uuid users, one catalogue each, all inside a transaction that is rolled back). Limit 20 unless the row says otherwise:

| # | Setup | Call | Assert |
|---|---|---|---|
| 1 | A, used 0 | `begin(new, p_credits 2, p_hold 18)` | `charged`, `held = 18` |
| 2 | after 1 | `begin(new, 2, 18)` | `limit` (a second begin sees the first hold) |
| 3 | after 1 | `spend_ai_hold(t1, 5)` | returns 5; row `credits = 7`, `held = 13` |
| 4 | after 3 | `spend_ai_hold(t1, 50)` | returns 13; `credits = 20`, `held = 0` |
| 5 | after 4 | `spend_ai_hold(t1, 1)` | returns 0; `credits = 20` |
| 6 | used 18 | `begin(new, 2, 18)` | `charged`, `held = 0` |
| 7 | used 19 | `begin(new, 2, 18)` | `limit` |
| 8 | row with `held = 10`, `held_until = now() − 1 s`, credits 2 | `begin(new, 2, 18)` | `charged`, `held = 16` (the expired hold is not counted) |
| 9 | the expired row from 8 | `spend_ai_hold(it, 1)` | returns 0 |
| 10 | live hold | `release_ai_hold(t)` | true; `held = 0` |
| 11 | A's live hold, called as B | `spend_ai_hold` / `release_ai_hold` | 0 / false; A's row unchanged |
| 12 | open plan, hash h, budget 3, used = 20 | `begin(cont, h)` | `limit` |
| 13 | same, used 19 | `begin(cont, h, p_hold 18)` | `continued`, `held = 1` |
| 14 | after 13, hold still live | `begin(cont, h)` again | not `continued` |
| 15 | open plan, used 30, called with `p_limit 15` (downgraded) | `begin(cont, h)` | `limit` |
| 16 | row `created_at = month start − 1 s`, live `held = 10` | `begin(new, 2, 18)` | `held = 18` |
| 17 | — | `begin(…, p_hold −1)` and `101` | SQLSTATE 22023 |
| 18 | — | `spend_ai_hold(t, −1)` | SQLSTATE 22023 |
| 19 | live hold of 18 | `select credits from private.my_usage()` | confirmed credits only |
| 20 | after every row above | user A: confirmed + live holds this month | `<= 20` |

- [ ] **Step 2: Run** `supabase start && supabase test db`. Expected: `42_ai_credit_holds` fails (functions missing or the wrong signature); 40 and 41 pass.
- [ ] **Step 3: Write the migration** to the rules above.
- [ ] **Step 4: Run** `supabase test db`. Expected: all files pass. 40 and 41 call the old arity and still resolve because of the defaults; if one selects `*` from `begin_ai_turn`, change only that test to name its columns.
- [ ] **Step 5: Apply to TEST** (`supabase link --project-ref imhinsgyzzyblghwnedk`, `supabase db push`). Then, read-only on TEST: `select pg_get_function_identity_arguments('private.begin_ai_turn'::regproc)` lists 8 arguments.
- [ ] **Step 6:** run `drizzle-kit pull` in `@quicktalog/common`, release, and bump the app's dependency. Ready for review.

---

### Task 2: `RequestCredits`, the per-request budget

**Files:**
- Create: `src/agent/credits.ts`
- Test: `tests/unit/agent/credits.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type RequestBudget = {
  	/** Credits this request may commit beyond the base, as held by the database. */
  	available: number;
  	/** True when this request took the base charge, which pays for its first task. */
  	baseCoversFirstTask: boolean;
  };
  /** No ledger behind it: tests and code paths that never meter. */
  export const UNMETERED: RequestBudget; // { available: Infinity, baseCoversFirstTask: true }

  export class RequestCredits {
  	constructor(budget: RequestBudget);
  	/** Page reads plus billable settled tasks, never the base. What the ledger is charged. Never above `available`. */
  	get billed(): number;
  	/** True once a task could not be paid for. */
  	get exhausted(): boolean;
  	/** Tasks this request can still pay for, the unused base slot included. */
  	get tasksAffordable(): number;
  	payForFetch(): boolean;                 // 2 credits; false leaves `exhausted` alone
  	reserveTask(index: number): boolean;    // idempotent; base slot first, then 1 credit; false sets `exhausted`
  	recordEdit(index: number): void;
  	settleTask(index: number, status: "done" | "skipped"): boolean;
  }
  ```
- Accounting rule: `committed` = page-read credits plus every credit-backed reservation. A reservation is affordable when `committed + 1 <= available`. `settleTask("done")` reserves first if needed (on false nothing settles and `exhausted` is set) and bills the task. `settleTask("skipped")` bills the task only if `recordEdit` was called for it; otherwise its reservation goes back (a base-slot reservation returns the base slot). `billed` never counts reservations still pending: a task left unfinished when the request ends is billed by the request that finishes it.

- [ ] **Step 1: Write the failing tests:**

| Test | Budget | Calls | Assert |
|---|---|---|---|
| `pays for the first task from the base` | `{0, true}` | `reserveTask(0)` | true; `billed` 0 |
| `refuses a second task when nothing is held` | `{0, true}` | `reserveTask(0)`, `reserveTask(1)` | second false; `exhausted` true |
| `bills each completed task after the first` | `{3, true}` | reserve+done ×3 | `billed` 2 |
| `bills every task on a continuation` | `{2, false}` | reserve+done 0, 1; `reserveTask(2)` | `billed` 2; third false |
| `charges a page read two credits` | `{3, true}` | `payForFetch()` ×2 | true then false; `billed` 2; `exhausted` false |
| `counts a pending reservation against what is left` | `{1, false}` | `reserveTask(0)`, `payForFetch()` | false |
| `skipping an untouched task is free` | `{1, false}` | `reserveTask(0)`, `settleTask(0,"skipped")`, `reserveTask(1)` | `billed` 0; `reserveTask(1)` true |
| `skipping a worked task still bills it` | `{2, false}` | reserve, `recordEdit(0)`, skip | `billed` 1 |
| `completing an unpaid task needs a credit` | `{0, false}` | `settleTask(0,"done")` | false; `exhausted`; `billed` 0 |
| `a task left pending is not billed` | `{2, false}` | `reserveTask(0)`, `recordEdit(0)` | `billed` 0 |
| `reserving twice holds once` | `{1, false}` | `reserveTask(0)` ×2, `reserveTask(1)` | true, true, false |
| `tasksAffordable counts the base slot` | `{3, true}` | none | 4 |
| `never bills past the budget` | `{5, true}` | 200 random calls with a fixed seed | `billed <= 5` after each call |
| `UNMETERED never refuses` | `UNMETERED` | 50 reserve+done, 10 fetches | all true |

- [ ] **Step 2: Run** `npx vitest run tests/unit/agent/credits.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement `src/agent/credits.ts`.** It is pure: no I/O, no `server-only`.
- [ ] **Step 4: Run** it again. Expected: PASS. Ready for review.

---

### Task 3: The session spends only from its budget

**Files:**
- Modify: `src/agent/session.ts`, `src/types/ai.ts`
- Test: `tests/unit/agent/session.test.ts`, `tests/unit/agent/free-plan-guards.test.ts`

**Interfaces:**
- Consumes: `RequestBudget`, `UNMETERED`, `RequestCredits` (Task 2).
- Produces:
  - `new CatalogueSession(catalogue, limits, access, loadedSkills, userId, plan, fetches, aiLimits, budget: RequestBudget = UNMETERED)`
  - `session.credits: RequestCredits` (readonly). `tasksSettledThisRequest` is removed, because billing reads `session.credits.billed`. `fetchesThisRequest` stays.
  - The failed `AgentToolResult` in `src/types/ai.ts` gains `outOfCredits?: true`.
  - `export const OUT_OF_CREDITS = "The user is out of AI credits for this request. Make no more changes. Tell them which tasks are done, which are left, and that credits reset on the 1st of the month or come with a bigger plan."`
- Behaviour:
  - `run(op)`: with an active plan task, `reserveTask(active)` happens **before** the operation is applied. If refused, return `{ ok: false, error: OUT_OF_CREDITS, outOfCredits: true }` and apply nothing. If the operation lands, call `recordEdit(active)`. With no active task on a request whose budget has `baseCoversFirstTask: false`, refuse the same way, because nothing pays for an unplanned edit on a continuation.
  - `completeTask` / `skipTask`: call `credits.settleTask(index, status)` first. If it returns false, refuse with `OUT_OF_CREDITS` and leave the task pending.
  - `allowWebFetch()`: keep the count cap, then `credits.payForFetch()`. If that is false: "Reading a page costs 2 credits and this request has fewer left. Work from what the user gave you."
  - `createPlan(titles)`: after the `maxPlanTasks` check, if `titles.length > credits.tasksAffordable`, refuse and name `tasksAffordable`. When that is below `MIN_PLAN_TASKS`, tell the model to make the single most important change and tell the user the rest needs credits.

- [ ] **Step 1: Write the failing tests** in `session.test.ts`:
  - `refuses an edit for a task the request cannot pay for, and applies nothing`: budget `{0, false}`, resumed plan with task 0 pending, `run(add_section)` → `ok` false, `outOfCredits` true, `session.operations` empty.
  - `lets the base pay for the first task with nothing held`: `{0, true}`, plan of 2, first edit lands.
  - `refuses an unplanned edit on a continuation`: `{5, false}`, no plan → refused.
  - `refuses a plan longer than the balance pays for, naming what fits`: `{2, true}`, `createPlan` of 4 → error matches `/3 tasks/`; of 3 → ok.
  - `Starter at 13 of 15 gets one change, not a checklist` (Review Focus 5): `{0, true}` on Starter limits, `createPlan` of 4 → error matches the single-change wording; one unplanned edit lands; `credits.billed` 0.
  - `a 4-task build bills what the price list says`: `{18, true}`, 4× (edit + `completeTask`) → `credits.billed === estimatePlanCredits(4) - CREDITS.agentBase`.
  - In `free-plan-guards.test.ts`, replace the `tasksSettledThisRequest` assertion with `credits.billed`, and add `refuses a page read the budget cannot pay for` (`{1, true}` on Pro → `allowWebFetch()` error matches `/2 credits/`).
- [ ] **Step 2: Run** `npx vitest run tests/unit/agent`. Expected: the new tests FAIL; the existing ones pass (the default is `UNMETERED`).
- [ ] **Step 3: Implement** the behaviour above.
- [ ] **Step 4: Run** `npx vitest run tests/unit/agent`. Expected: PASS. Ready for review.

---

### Task 4: The loop ends cleanly when credits run out

**Files:**
- Modify: `src/agent/index.ts`, `src/agent/instructions.ts`
- Test: `tests/unit/agent/instructions.test.ts`, `tests/unit/agent/tools.test.ts`

**Interfaces:**
- Consumes: `session.credits` (Task 3).
- Produces: `export function creditStep(session: CatalogueSession): { toolChoice: "none" } | undefined`, passed to `ToolLoopAgent` as `prepareStep`. Once `credits.exhausted` is set, the model gets one text-only step to write its wrap-up, and the loop ends because no tool is called.
- Instructions:
  - Rules block, one fixed line: if a tool says the user is out of AI credits, make no more changes and do what it says.
  - Context block (per-request values stay there, as the existing test requires), only when `credits.tasksAffordable < aiLimits.maxPlanTasks` or a page read is unaffordable: `CREDITS: this request can pay for up to {n} task(s){ and {m} page read(s)}. Plan within that; if the user asked for more, do the most important part and say the rest needs more credits.`

- [ ] **Step 1: Write the failing tests:**
  - `creditStep forces a text-only step once credits are exhausted`: an exhausted session → `{ toolChoice: "none" }`; a fresh one → `undefined`.
  - `states the credit budget only when it binds`: `{2, true}` → the context contains `up to 3 task`; `UNMETERED` → no `CREDITS:` line.
- [ ] **Step 2: Run** `npx vitest run tests/unit/agent`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** it again. Expected: PASS. Ready for review.

---

### Task 5: Hold in, spend per step, close at the end

**Files:**
- Modify: `src/lib/ai/limits.ts`, `src/lib/ai/metering.ts`, `src/lib/ai/turn.ts`, `src/app/api/agent/route.ts`
- Test: `tests/unit/ai/limits.test.ts`, create `tests/unit/ai/closing.test.ts`

**Interfaces:**
- Consumes: Task 1's SQL, `RequestBudget` (Task 2), `session.credits` (Task 3), `creditStep` (Task 4).
- Produces:
  - `requestHoldFor(ai: AiPlanLimits): number` in `limits.ts` = `maxPlanTasks × CREDITS.perExtraTask + maxFetches × CREDITS.perPageFetch`
  - `startAiTurn` sends `p_hold = requestHoldFor(aiLimitsFor(plan))`, using the plan read in the same transaction, and returns `turn.held`.
  - `spendAiHold(tx: Tx, turnId: string, credits: number): Promise<number>` and `releaseAiHold(tx: Tx, turnId: string): Promise<void>` in `metering.ts`. `settleAiTurn` is deleted.
  - `TurnGrant.budget: RequestBudget` = `{ available: held, baseCoversFirstTask: charged }`
  - `closingCharge(a: { charged: boolean; applied: number; planOpen: boolean; billed: number; persisted: number }): { refund: boolean; spend: number }` in `turn.ts`. Refund only when `charged && applied === 0 && !planOpen && billed === 0`. `spend` is 0 on a refund, otherwise `billed − persisted`.
- Route:
  - The session gets `turn.budget`.
  - `onStepEnd`: if `session.credits.billed − persisted > 0`, open a short `withUser`, call `spendAiHold`, then `persisted += moved`. Wrap it in try/catch with Sentry (`op: "catalogueAgentMeter"`). It must never throw into the stream. If `moved < due`, capture one Sentry message: the hold expired before the charge was written.
  - `onFinish`, in one `withUser`: `setPlanState`, then `closingCharge`, then refund or `spendAiHold(spend)`, then **always** `releaseAiHold`.

- [ ] **Step 1: Write the failing tests:**
  - `limits.test.ts`, `holds enough for the largest request on each plan`: `requestHoldFor(aiLimitsFor(starter)) === 4`, Pro `=== 18`.
  - `closing.test.ts`:
    - `refunds a question`: charged, 0 applied, no plan, billed 0 → `{ refund: true, spend: 0 }`
    - `charges a request that only read a page`: billed 2 → `{ refund: false, spend: 2 }`
    - `never refunds a continuation`: not charged, 0 applied → `{ refund: false, spend: 0 }`
    - `charges only what the steps did not already write`: billed 3, persisted 2 → spend 1
    - `keeps the charge while a plan is open`: 0 applied, plan open → refund false
- [ ] **Step 2: Run** `npx vitest run tests/unit/ai`. Expected: FAIL.
- [ ] **Step 3: Implement**, then `npx tsc --noEmit` (it catches every caller of the removed `settleAiTurn` / `tasksSettledThisRequest`).
- [ ] **Step 4: Run** `npx tsc --noEmit && npm run check && npm test`. Expected: all pass. Ready for review.

---

### Tasks 6–8: moved

The plan-flag, save-path and section-count work moved to [2026-10-24-agent-plan-limits](../2026-10-24-agent-plan-limits/PLAN.md) (its Tasks 1, 2, 4 and 8). Numbering here is kept so the references below stay valid.

---

### Task 9: Client pre-check, docs, TEST rollout

**Files:**
- Modify: `src/lib/ai/pricing.ts`, `src/hooks/useCatalogueChat.ts`, `docs/architecture/ai-credits.md`, `docs/architecture/ai-chat-flow.md`, `src/content/docs/quick-ai.tsx`, `.claude/plans/README.md`
- Test: `tests/unit/ai/pricing.test.ts`

**Interfaces:**
- Produces: `canStartAsk(used: number, limit: number | undefined): boolean` in `pricing.ts`. It returns true when `limit` is not a number, otherwise `used + CREDITS.agentBase <= limit`.
- `useCatalogueChat`: `isOverLimit` becomes `!canStartAsk(...)`. A tool result with `outOfCredits` opens the AI limits modal (`setShowAiLimits(true)`).

- [ ] **Step 1: Write the failing test** `canStartAsk matches the server's base check`: (13, 15) → true; (14, 15) → false; (0, undefined) → true.
- [ ] **Step 2: Run** `npx vitest run tests/unit/ai/pricing.test.ts`. Expected: FAIL. **Step 3:** implement. **Step 4:** PASS.
- [ ] **Step 5: Docs.**
  - `ai-credits.md`:
    - §1: the task rule from D2, and that a page read is never refunded.
    - §3: rewrite as hold → spend per step → release, with the invariant and the 90 s expiry; delete "A turn can still finish slightly over".
    - §5: state that the rate limit is not what bounds the cap.
    - §7: add `held` and `held_until`.
  - `ai-chat-flow.md`: replace `settle_ai_turn` in both diagrams.
  - `quick-ai.tsx`: "a request that ends up changing nothing and reading no pages", plus one line saying Quick AI stops before the next item on the list when credits run out and says so.
  - `.claude/plans/README.md`: add this plan. Also, the `2026-09-21-ai-credits` row still points at `active/`, but that plan is in `archive/`; fix the link.
- [ ] **Step 6: Verify:** `npx tsc --noEmit && npm run check && npm test`, all pass.
- [ ] **Step 7: TEST rollout.** The migration from Task 1 is already applied. Deploy the app to TEST, then check by hand with a Starter test account:
  - At 13/15, ask for a 4-part build. Expect one change and a balance of 15/15; the next ask opens the limit modal.
  - At 40/50 on a Basic test account, send asks from two tabs at once. Expect one to run and the other to be refused.
  - After each check, read-only on TEST: for that user, `sum(credits)` this month `<= ai_credits`.
  - PROD (migration, then deploy) only when the owner asks.

---

### Task 10: Drop the legacy settle entry point

Only after the Task 5 app code is live on **both** TEST and PROD.

**Files:**
- Create: `supabase/migrations/<timestamp>_drop_settle_ai_turn.sql`: `drop function private.settle_ai_turn(uuid, integer);`
- Test: `supabase/tests/database/42_ai_credit_holds.test.sql`, adding `has_function` false for `settle_ai_turn`

- [ ] **Step 1:** add the assertion. **Step 2:** `supabase test db` FAILs. **Step 3:** write the migration. **Step 4:** `supabase test db` PASSes; apply to TEST, and to PROD when asked. When everything has shipped, set this plan's status to `done`, move it to `archive/`, and update the index.
