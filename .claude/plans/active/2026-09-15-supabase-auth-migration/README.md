# Clerk to Supabase Auth migration, user-level RLS and DB access

Plan written 2026-09-16/17. Implementation in progress: Phase 0A code and the M00 migration file are written but not yet deployed or applied.

**For the short version, read [`HIGH_LEVEL_PLAN.md`](HIGH_LEVEL_PLAN.md).** For details, see [`PLAN.md`](PLAN.md). Section 0 has the decisions, section 5 the phases, section 12 the cutover runbook, section 14 the inputs needed from you. Progress is tracked in [`TO_DO.md`](TO_DO.md).

| Folder | Contents |
|---|---|
| `research/` | Phase-1 reports: Clerk surface, all DB call sites, public/system paths, AI agent, where the Clerk id lives, and research on identity migration, Supabase SSR sessions and RLS with Drizzle |
| `decision/` | How the database-access architecture was chosen (three proposals, scores, rationale) |
| `verification/` | PGlite runs of the SQL (`final-sql-results.md`, `pglite-harness/`), red-team reviews, completeness review, repository and external fact-checks |

Where a supporting file disagrees with `PLAN.md`, the plan is authoritative.
