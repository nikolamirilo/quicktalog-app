# Database gate (PGlite)

Applies `supabase/migrations` and the remaining Appendix A SQL of
`.claude/plans/active/supabase-auth-migration/PLAN.md` to an in-memory Postgres
and runs 692 RLS and migration scenarios on PostgreSQL 17 and 18. It needs no
Docker, no network and no Supabase access, so it runs on every PR.

```sh
npm run test:db        # from the repo root
```

## How it maps to the repo

- `PHASE_MIGRATIONS` in `lib.mjs` lists the migrations this harness applies
  itself, in the plan's phase order. **Add a migration here when you write it**,
  otherwise it silently becomes part of the baseline and the scenarios around it
  no longer prove anything.
- Every other file in `supabase/migrations` is the baseline the scenarios start
  from.
- Phase SQL that has no migration file yet (M08 and later, the cutover scripts
  and the rollbacks) is extracted from the plan by `tools/extract-plan.mjs` into
  the gitignored `plan-sql/`.

## Reading a failure

`node final.mjs plan-sql 17 results/plan-17.json` prints one line per failed
scenario with what was expected and what happened, and writes the full run to
`results/`. One apply failure is expected: a chain applies M04 without M00 on
purpose, and the scenario asserts that the apply is rejected.

## Limits

PGlite is a single connection with no supautils, no Supavisor and no real
`statement_timeout`; PostgREST, GoTrue and the pooler are emulated with role
switches. Locking, timeouts, trigger DDL on `auth.users` and anything involving
live Supabase services are proven by the pgTAP tests on the local stack and on
TEST instead.
