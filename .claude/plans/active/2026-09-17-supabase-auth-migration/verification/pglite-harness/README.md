# PGlite verification harness

Executes the SQL of `../../PLAN.md` Appendix A in PGlite (PostgreSQL 17.5 and 18.3 compiled to WebAssembly) against a Supabase stub whose roles, grants and ACLs were copied from the TEST project with read-only queries. No Docker, no network, no Supabase project is touched.

## Run

```sh
npm install            # in this folder: PGlite 0.5.8 (PG18) and 0.3.16 as pglite17 (PG17)
./run-final.sh         # 692 scenarios per engine against the SQL in PLAN.md Appendix A
```

The Drizzle app-layer scenarios import `drizzle-orm` and `@quicktalog/common` from the repo root `node_modules`, so run `npm install` at the root first. Results land in `results/` (git-ignored).

Expected output (2026-09-17):

```
pg17 plan-sql: statementModeErrors=0 applyFailures=1 failed scenarios=0/692
pg18 plan-sql: statementModeErrors=0 applyFailures=1 failed scenarios=0/692
```

The one apply failure is intentional: M04 applied without M00 must refuse to run.

## Files

| File | Purpose |
|---|---|
| `tools/extract-plan.mjs` | Extracts every `sql` block of PLAN.md Appendix A into `plan-sql/` (A.14 also split per migration) |
| `final.mjs`, `final-lib.mjs`, `final-scen.mjs`, `final-gate-*.mjs` | Final run: migrations in phase order, gates A-I (perimeter, owner matrix, AI ledger, M07-M10, import, re-key, rollback, re-cutover, A.14 reverse, audits) |
| `lib.mjs`, `base.mjs`, `apply.mjs` | Supabase stub and migration application (baseline = `supabase/migrations/*.sql` of the repo) |
| `drizzle-app.mjs`, `drizzle-app-final.mjs` | Real drizzle-orm SQL for the converted call sites, run through the planned `withUser`/`withPublic` wrapper |
| `run.mjs`, `run-all.sh`, `run-decision.mjs`, `rls.original.sql`, `rls.patched.sql`, `decision-sql.sql` | First run against the design drafts (see `../pglite-results.md`) |

## Limits

PGlite runs one connection, so it cannot show lock races between connections, `statement_timeout` cancellation, Supavisor pooling, supautils, or live GoTrue/PostgREST behaviour. Those are covered by the integration tests planned in PLAN.md section 11. Phase 1 ports this harness to `tests/db-pglite/` and points it at the real migration files.
