# Catalogue analytics

The page `/admin/[name]/analytics` shows how many people opened one published catalogue: page views and unique visitors per day, four KPI cards with a comparison to the previous period, a line chart and a "By day" table.

## Where things live

| Module | Purpose |
|---|---|
| `src/app/admin/[name]/analytics/page.tsx` | Server page: identity, ownership, range, then PostHog |
| `src/lib/catalogue/ownership.ts` | `ownsCatalogue` and `listOwnedCatalogues` (the switcher) |
| `src/lib/analytics/catalogue-traffic.ts` | The two HogQL queries, their placeholder values, and parsing into periods |
| `src/lib/analytics/traffic.ts` | Pure helpers: range parsing, day filling, summaries, deltas, day labels |
| `src/utils/posthog.ts` | Our wrapper around PostHog's query API: settings, `fetch`, timeout, response shape |
| `src/components/analytics/*` | Controls, KPI cards, "By day" table |
| `src/components/charts/LineChart.tsx` | The ApexCharts area chart (browser only) |

## Ownership and the database

1. `requireUser` signs the visitor in or redirects.
2. One `withUser` block checks `ownsCatalogue` and, only if it passes, reads `listOwnedCatalogues` for the switcher. A catalogue that is not the caller's is a 404.
3. The block closes, then PostHog is called. A database connection is never held across the network round trip (see [data-access.md](data-access.md)).

Both helpers keep the explicit `created_by = me` predicate even though RLS enforces it too.

## Range, periods and deltas

- `?range=` accepts only `7`, `30` or `90`; anything else (missing, `365`, `7; drop table`) falls back to 30 (`parseTrafficRange`).
- The **current period** is the last `range` days, today included. The **previous period** is the `range` days before it. Both are zero-filled, oldest first.
- KPIs: total views, unique visitors over the whole period (not a sum of daily uniques), the busiest day (the most recent one on a tie), and the average views per day (`views / range`).
- Deltas (`describeDelta`) compare each KPI with the previous period: `+12.3%` / `−4.0%`, rounded to one decimal. A change that rounds to zero is `0.0%` (flat). An empty previous period is never divided by: it reads "No views in the previous 30 days" (or "No visitors…").
- The "By day" table lists the last 10 days, newest first. Its "Busiest" badge and bar scale come from the whole period's busiest day, which may be older than the rows shown.

## The two PostHog queries

Both run in parallel through `runHogQL` and share one `WHERE`:

```sql
event = '$pageview'
and properties.$host = {host}
and properties.$pathname in ({path}, {pathSlash})
and timestamp >= toDateTime({from}, 'UTC')
and timestamp <  toDateTime({until}, 'UTC')
```

1. **Daily:** views and distinct visitors per UTC day across both periods.
2. **Period:** distinct visitors in the current period and in the previous one.

**Values are never spliced into the query text.** They are sent in the request's `values` object and referenced as `{name}` placeholders, which PostHog parses as constants:

```json
{ "query": { "kind": "HogQLQuery", "query": "… = {host} …", "values": { "host": "www.quicktalog.app", … } } }
```

This is `HogQLQuery.values` in PostHog's query schema ("Constant values that can be referenced with the {placeholder} syntax in the query", `frontend/src/queries/schema/schema-general.ts`).

**Matching.** A visit counts when `$host` equals the host of `NEXT_PUBLIC_BASE_URL` and `$pathname` is `/catalogues/<name>` (with or without a trailing slash). Matching the whole `$current_url` would miss links with `?utm_*`, `?fbclid=…` or a `#fragment`.

## Timezone: UTC days

All days are UTC calendar days:

- The app computes "today" as the UTC date and sends the window bounds as values.
- Events are bucketed with `toDate(toTimeZone(timestamp, 'UTC'))`.
- Bounds use `toDateTime('…', 'UTC')`, because PostHog parses date literals in the **project's** timezone unless one is given ([SQL expressions](https://posthog.com/docs/sql/expressions)).

Why not HogQL's `today()`: in PostHog's function table `today` is not timezone-aware (it runs in the ClickHouse server's zone), while `now()` and `timestamp` follow the project timezone (`posthog/hogql/functions/clickhouse/datetime.py`). Mixing them could shift the window by a day against the buckets. Using UTC explicitly on both sides keeps the chart, the totals and the unique counts on the same days, whatever the project's timezone setting.

The labels (`formatDay`) print those dates as calendar days (UTC), so they never shift in the viewer's timezone.

## Time budget

The route runs on Vercel Hobby, capped at 60 seconds. Each query has a 20-second timeout (`HOGQL_TIMEOUT_MS`) and both run in parallel. If PostHog fails, the page still renders with an "Error loading analytics" panel and the error goes to Sentry.

## Settings

`NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_PROJECT_ID` and `POSTHOG_API_KEY` (a personal API key with query read access; server only). `NEXT_PUBLIC_BASE_URL` gives the host and path to match.
