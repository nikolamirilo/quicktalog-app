# Verification, 2026-10-30

## On TEST, after the migration was applied

`@quicktalog/common` 1.80.0 published, migration `20261029180000` applied (logged), both
repos moved to `^1.80.0`. Checked read-only:

- `catalogues.traffic_off_at` exists, nullable, no default. 15 catalogue rows, none flagged -
  correct, the job has not run against the column yet.
- `catalogues_traffic_off_at_idx` exists.
- `app_user` may **select** the column and may **not** update it. The client cannot reach it
  twice over: `pickEditable` is an allowlist that omits it, and the grant is absent.
- The deployed trigger is `BEFORE UPDATE ON public.catalogues FOR EACH ROW`, and the
  deployed function body is exactly the one in the migration (clear the stamp when the
  status changes and the writer did not set the stamp itself).
- `trafficOffAt` is in the published Drizzle schema, so the dashboard's "Back online" row
  no longer needs a local type.
- App: `npx tsc --noEmit`, `npm run check`, `npm test` (857) green. Worker:
  `npx tsc --noEmit` back to its two pre-existing `src/index.ts` errors.

## The gap: nothing can exercise it on TEST

`public.analytics` on TEST is **empty** - 0 rows, all time. Every account therefore has 0
page views in its current period, so:

- the traffic limit can never be reached on TEST, which means the free-plan enforcement
  (the `.neq` removal) and the switch-off path never run;
- nothing ever gets stamped, so the switch-back never runs either;
- the Usage tab's traffic meter reads 0, which is correct but proves nothing.

The static checks above plus `22_catalogue_traffic_off.test.sql` are all the evidence there
is until either Docker is available for `supabase test db`, or TEST is seeded.

### What a real check would need (writes to TEST, not done)

1. Insert `analytics` rows for one Starter account, inside its period, summing over 500
   page views.
2. Run the job (wait for 03:00 / 11:00 / 19:00 UTC, or trigger it).
   Expect: that account's active catalogues go `inactive`, each stamped `traffic_off_at`,
   its public page stops resolving, and the dashboard card shows "Back online: <reset date>".
3. Change one of those catalogues' status as the owner. Expect: its stamp clears, and the
   job never brings that one back.
4. Backdate the remaining stamp to before the account's period start and delete the seeded
   analytics rows (standing in for the period rolling over). Run the job again.
   Expect: back `active`, stamp cleared, public page resolving.
5. Delete whatever is left of the fixtures.
