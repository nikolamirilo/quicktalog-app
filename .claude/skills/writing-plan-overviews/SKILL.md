---
name: writing-plan-overviews
description: Use when creating or updating any plan in .claude/plans/ (a new PLAN.md, a plan split or re-scoped, decisions changed) - every plan folder needs a plain-language OVERVIEW.md next to the detailed PLAN.md, written for the owner and non-engineers such as testers.
---

# Writing plan overviews

## Overview

Every plan folder holds two plans of the same work:

| File | Reader | Contains |
|---|---|---|
| `PLAN.md` | the engineer or agent implementing it | files, signatures, tests, commands (see superpowers:writing-plans) |
| `OVERVIEW.md` | the owner, a tester, anyone non-technical | what is wrong, the fix in one idea, what users notice, decisions, order of work |

Write `PLAN.md` first, then `OVERVIEW.md` from it, in the same session. When `PLAN.md`
changes its scope, decisions or task list, update `OVERVIEW.md` in the same change.

## The contract: OVERVIEW.md is these sections, in this order

1. `# <Topic>: the short version`, then one line linking `[PLAN.md](PLAN.md)` (the detail)
   and `[FINDINGS.md](FINDINGS.md)` (the evidence) when it exists.
2. **The problem**: 2-4 sentences. What the product promises and where it doesn't hold.
   Include the real numbers that make it concrete (plan limits, prices).
3. **What goes wrong today**: one bold, plain sentence per problem, then 1-3 sentences or
   bullets explaining it with one concrete example. Group related findings; this has
   about 4-6 headings, not one per finding. Name tester reports in their own words.
4. **The fix in one idea**: one bold sentence, then a short paragraph or a numbered list
   of at most 3-4 points. Close with the guarantee it gives.
5. **What users will notice**: bullets, each one a visible change in the product.
6. **Decisions we made (please confirm)**: one bullet per decision in `PLAN.md`. Bold the
   decision, then give its cost or trade-off in one sentence.
7. **Order of work**: a numbered list matching `PLAN.md`'s tasks one to one, a short
   phrase each. Then one line on how each step is checked, and whether the database
   changes.
8. **Not in this plan**: related work that lives in another plan, with a link.

## Writing rules

- Use the product's words: items, sections, credits, the builder, the chat, the save,
  the free plan. Leave out file names, function names, code, SQL, test names and task
  internals. Those belong in `PLAN.md`.
- Talk about the behaviour, not the mechanism ("the browser applies the AI's changes
  without checking", not "`applyAiOperations` passes `undefined` limits").
- One concrete example beats a general statement ("Basic reached 50 items instead of 30").
- Mark anything unconfirmed as unconfirmed ("not reproduced yet; we'll confirm with the
  tester's steps first").
- Aim for about one screen per section and 500-900 words in total.
- Link `OVERVIEW.md` from `PLAN.md`'s **Spec** line, and mention it in the plans
  `README.md` row when the row is written.

## Example (shape only)

```markdown
**The AI misunderstands the limit.**
Nobody tells the AI what the limits are. When it hits one, the message says "nothing
added to *Coffee*", so it concludes the limit is per category. The limit is 15 for the
whole catalogue.
```

## Common mistakes

| Mistake | Fix |
|---|---|
| A shortened copy of `PLAN.md` (files, function names) | Rewrite every point as what a user or owner would see |
| One heading per finding (10+) | Group findings into 4-6 problems |
| Decisions in `PLAN.md` but missing here | Every decision appears, with its cost |
| Order of work doesn't match the task list | Same count, same order |
| `PLAN.md` updated, `OVERVIEW.md` stale | Update both in the same change |
