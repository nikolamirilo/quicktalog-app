# AI credit limits: the short version

The plain-language summary of [PLAN.md](PLAN.md). The detail and the evidence are in
[FINDINGS.md](FINDINGS.md).

## The problem

Every plan comes with a monthly allowance of AI credits: 15 on the free plan, 50 on
Basic, up to 600 on Premium. A request costs 2 credits, plus 1 for each extra item on its
checklist and 2 for each web page it reads. A request that only asks a question is free.

The allowance should be a hard ceiling. Today it isn't: a user can end the month above
their allowance, and in some cases well above it.

## What goes wrong today

**The check only happens at the start.**
Before a request starts, we check that the user can pay the base 2 credits. Everything
else (extra checklist items, page reads) is added at the end, without checking whether
there is room. A free user on 13 of 15 can ask for a 4-part build and finish on 18. On a
paid plan one request can finish up to 17 over.

**Long requests keep going on one credit.**
A big request is split into several rounds. Each new round only checks that one credit is
left, then can charge for several items.

**Several requests at once multiply it.**
Nothing is set aside while a request runs. Five requests sent at the same moment all pass
the check against the same balance, and each one can then go over. The rate limit
doesn't prevent this, and it switches itself off if its storage is down.

**Some work is never charged.**
- A request that only read web pages is refunded, so the page reads (which cost us real
  money) are free. The help page says they cost 2 credits.
- If a request is cut off before it finishes, its extra charges are never written.
- An item on the checklist that the AI worked on but then marked "skipped" costs nothing.

**The screen and the server disagree.**
At 49 of 50 the chat lets you send, and the server refuses. A small thing, but confusing.

## The fix in one idea

**Set the credits aside before the work starts.**

When a request starts, the database reserves the most that request could cost, but never
more than the user has left. Reserved credits count as used while the request runs, so
two requests at once cannot both spend the same credits. The AI can only spend from its
own reservation: if the next checklist item or page read doesn't fit, it doesn't start
it. What was actually spent is written down after every step, and whatever is left over
goes back to the user when the request ends. If a request crashes, its reservation
expires on its own after 90 seconds.

The result: the balance can never go over the allowance, however the requests arrive.

## What users will notice

- The AI knows how many credits are left before it plans, so it plans what fits.
- If credits run out partway, it stops before the next item, says what was done and
  what's left, and the limit window opens.
- The credit counter and the chat agree on when you're out.
- Prices don't change.

## Decisions we made (please confirm)

- **Hard ceiling.** This replaces the original design, which let the last request go a
  little over and blocked the next one. A long request may now stop partway when credits
  run out.
- **A skipped item costs a credit if the AI already worked on it.** An item skipped
  before any work stays free.
- **Reading a web page is always charged**, even if nothing else changed.
- **Each request sets aside enough for its biggest possible job** (18 credits on paid
  plans, 4 on the free plan), for at most 90 seconds. While one request holds your last
  credits, a second one sent at the same time is refused.
- **Prices stay as they are.**

## Order of work

1. The database learns to reserve credits, spend from a reservation, and release it.
2. A small counter that tracks what one request has reserved and spent.
3. The AI spends only from that counter, and refuses work it can't pay for.
4. When credits run out, the AI gets one last turn to explain, then stops.
5. Requests reserve at the start, write the spend after every step, and release at the
   end.
6. The chat's "out of credits" check matches the server, plus updated docs and help
   text, and a hands-on check on TEST.
7. After it's live everywhere, remove the old charging function.

Each step has its own tests and is reviewed before the next one starts. Unlike the plan
limits work, this one changes the database (one new migration, applied to TEST first).

## Not in this plan

Plan limits for catalogue content (items, sections, block types, locked settings) are a
separate plan:
[2026-10-24-agent-plan-limits](../2026-10-24-agent-plan-limits/OVERVIEW.md).
