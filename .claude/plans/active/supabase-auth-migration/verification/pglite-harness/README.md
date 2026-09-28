# PGlite harness — evidence only

The runnable harness lives in [`tests/db-pglite/`](../../../../../../tests/db-pglite/)
(`npm run test:db`). It was ported from this folder (PLAN.md §652) and is the version CI
runs; the copy that used to sit here was an older snapshot of the same scripts and was
removed on 2026-09-27 to keep one harness, not two.

`plan-sql/` is not kept either — `tests/db-pglite/tools/extract-plan.mjs` regenerates it
from `PLAN.md` Appendix A on every run.

What stays here is the input SQL of the **first** run, which the write-ups cite and which
no longer exists anywhere else:

| File | Cited by |
|---|---|
| `rls.original.sql` | `../pglite-results.md` — the SQL as first drafted |
| `rls.patched.sql` | `../pglite-results.md` — the same SQL with PATCH P1–P5 applied |
| `decision-sql.sql` | `../../decision/architecture-decision.md` — proposal B's SQL |

To reproduce the final run (692 scenarios, PG 17 and 18), use `npm run test:db`.
