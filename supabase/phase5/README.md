# Phase 5 migrations (not yet applicable)

These are finished migrations that must **not** be applied yet. They are kept
out of `supabase/migrations/` on purpose: everything in that directory is
applied by the next `supabase db push`, and these two are only correct once the
cutover is done and the orphan triage of plan 12.6 has finished (T+30).

| File | Plan | Apply when |
|---|---|---|
| `20260922090012_validate_users_id_uuid.sql` | M12 (A.12) | after the re-key, once no `public.users` row carries a non-uuid id |
| `20260922090013_post_cutover_cleanup.sql` | M13 (A.13) | after the agreed retention period; export `migration.cutover_log` first |

M12 refuses to run before its time — it checks that `users_id_is_uuid` exists
and that no Clerk-keyed rows are left, and raises P0001 naming the count if
not. That refusal is the safety net, not the plan: **move the file into
`supabase/migrations/` only when you are ready to apply it.**

## Applying one, at T+30

```sh
git mv supabase/phase5/20260922090012_validate_users_id_uuid.sql supabase/migrations/
supabase db push
```

Give it a fresh timestamp first if anything has been applied since, so it sorts
after the last remote migration.

## They are still tested

`npm run test:db` applies both from here, in phase order, on PostgreSQL 17 and
18 (`PHASE_MIGRATIONS` in `tests/db-pglite/lib.mjs` looks in this directory as
well as in `supabase/migrations/`). Keeping them out of the push path does not
take them out of the test suite.
