# How the agent is limited by plan: findings (2026-10-24)

What the builder agent (`/api/agent`) enforces from the user's plan today, where it can
run past it, and what is already fine. Read from the code on branch `test` at `1c59c70`;
nothing was run against TEST or PROD.

## How the cap works today

```
route.ts POST
  openAiTurn → startAiTurn → private.begin_ai_turn     charge the base (2) up front
  … agent runs, up to 16 steps / 38 s …
  onFinish → private.settle_ai_turn                    add +1/extra task, +2/page read
           → private.refund_ai_turn                    if nothing applied and no open plan
```

`begin_ai_turn` (current body: `supabase/migrations/20260929120000_schema_consistency.sql:276`)
checks the balance only when a request **starts**:

- new ask: `used + 2 > limit` → refused
- continuation of a plan: `used >= limit` → refused

`settle_ai_turn` then adds the variable part **with no check against the limit**
(`least(credits + extra, 100)`). The archived design said this was deliberate:
"Let the last plan overshoot and block the *next* ask" (`archive/2026-09-21-ai-credits/PLAN.md` §2.3).
`docs/architecture/ai-credits.md` §3 says the overshoot is "at most one task's worth". It is not.

## Overage paths

### O1. One request settles past the cap (every plan)

The base check only proves the base is affordable. Everything else is added at the end.

| Plan | Before | Ask | After |
|---|---|---|---|
| Starter (15) | 13 | 4-task plan, all land in one request | 13 + 2 + 3 = **18** |
| Basic (50) | 48 | 6 tasks + 3 page reads | 48 + 2 + 5 + 6 = **61** |
| Any paid | limit − 2 | 12 tasks + 3 page reads (paid maximum) | limit **+ 17** |

### O2. Continuations only need one credit left, then settle several

A continuation at 49/50 passes `used < limit`, and its `onFinish` settles every task it
completed (often 2–5). Same unbounded settle as O1.

### O3. Parallel requests multiply O1 and O2

The `users` row lock is held only inside `begin_ai_turn`. Nothing is reserved for the
work that follows, so:

- at 40/50, five asks sent at once all pass (40, 42, 44, 46, 48 + 2 ≤ 50), and each can
  settle up to +17. The ledger can end around **135/50**, with five times the DeepSeek
  and Firecrawl spend.
- the same continuation body sent N times at once passes N times (up to `plan_budget`,
  max 8), because the check is `continuations < plan_budget` and `used < limit`. Each copy
  works the same tasks and settles them.

The rate limiter (`aiBurst` 10/min) allows this, and it **fails open** when Redis is down
(`src/lib/rate-limit.ts:49`), so it cannot be what bounds the cap.

### O4. A request that only read pages is refunded

`route.ts` refunds when `session.applied.length === 0 && !unfinished`. It does not look at
page reads. "Read these three pages and tell me what is on them" costs Firecrawl three
calls and the user 0 credits, up to the 30-refunds-a-month cap. The docs and the help
page (`src/content/docs/quick-ai.tsx:257`) both say a page read costs 2.

### O5. Work done after the last settle is never charged

Charges beyond the base are written only in `onFinish`. If the function is killed at
60 s, or frozen before that transaction commits, the request's tasks and page reads
are free. A continuation takes no base, so the whole request is then free. This is rare
because of the 38 s and 50 s guards, but nothing persists earlier.

### O6. Skipped tasks are free even when their edits landed

Only `completeTask` is billed (`session.tasksCompleted`). A task whose edits landed and
which the model then marks skipped costs nothing. A user can steer this from chat
("do each of these, then skip it"). Flagged as open question 3 in the archived plan.

### Minor: client pre-check disagrees with the server

`useCatalogueChat.isOverLimit` blocks at `used >= limit`; the server refuses at
`used + 2 > limit`. At 49/50 the ask is sent and comes back as a 429. This is only a UX
problem, not overage.

## Plan features, element limits, tester reports

Moved to [2026-10-24-agent-plan-limits/FINDINGS.md](../2026-10-24-agent-plan-limits/FINDINGS.md).

## Already respected (checked, no change needed)

- `branding`: logo, contact, SEO, legal, header and footer are refused in the applier
  (`operations.ts` `update_catalogue`/`update_header`/`update_footer`) and reshaped on save.
- `sections` flags (divider, embedding, customVisual): fail-closed in the applier, and
  `contentWithinPlan` refuses added gated blocks.
- `items_per_catalogue` and `sections_per_catalogue` are refused on save against the
  stored row (text blocks aside). The agent's own check is weaker; see T1 and the
  second pass.
- `integrations.tracking`: the agent has no field for it, and the save strips it.
- `catalogues`: the agent never creates a catalogue.
- Starter guards (`lib/ai/limits.ts`): no page reads (`fetchUrl` removed), 4-task plans,
  `deepseek-flash`, confirmed email required in SQL.
- Identity, ownership and plan come from the session and `users.plan_id` in the same
  transaction as the charge. Nothing is taken from the request body.
- The month boundary is computed in SQL.
- `utils/deepseek.ts` has no importers, so `/api/agent` is the only paid AI entry point.
