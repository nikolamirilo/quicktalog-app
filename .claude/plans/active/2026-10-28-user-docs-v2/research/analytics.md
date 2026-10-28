# Catalogue analytics — research for end-user docs

Read-only research, 2026-10-28. Every fact ends with `path:line` evidence. Paths are relative to
`/Users/nikola/Desktop/Quicktalog/quicktalog-app` unless prefixed with `../quicktalog-packages` or
`../quicktalog-backend`.

Two different things in the product are called "analytics" and they use **different data sources**:

1. **The catalogue analytics page** (`/admin/[name]/analytics`) — reads PostHog live, per catalogue.
2. **The dashboard numbers and the Usage meter** — read the `analytics` rollup table in Postgres,
   written once a day by a Cloudflare Worker, all catalogues together.

They can disagree. See [Surprising behavior](#surprising-behavior).

---

## How to reach it

- Route: `/admin/<catalogue-slug>/analytics`, optional `?range=7|30|90` — `src/app/admin/[name]/analytics/page.tsx:21`, `src/app/admin/[name]/analytics/page.tsx:24`.
- The page is rendered fresh on every request (no caching) — `src/app/admin/[name]/analytics/page.tsx:19`.
- Signed out: redirected to `/auth?next=/admin/<slug>/analytics` — `src/app/admin/[name]/analytics/page.tsx:25`, `src/lib/auth/session.ts:12`.
- Not the owner (or unknown slug): Next.js not-found page — `src/app/admin/[name]/analytics/page.tsx:29`.
- The only in-app link is on the dashboard: Overview tab → **Catalogues** section → a catalogue card → the outline button labelled exactly `Analytics` (bar-chart icon) — `src/components/dashboard/overview/DashboardItem.tsx:157`, label at `src/components/dashboard/overview/DashboardItem.tsx:160`.
- That button appears **only when the catalogue status is `active`** — `src/components/dashboard/overview/DashboardItem.tsx:152`. A draft or inactive catalogue shows `Continue Editing` and `Publish Catalogue` instead — `src/components/dashboard/overview/DashboardItem.tsx:165`.
- The dashboard section heading above the cards is `Catalogues` — `src/components/dashboard/Overview.tsx:176`.
- There is **no** "Analytics" entry in the navbar or any dashboard tab; the dashboard tabs are `Overview`, `Subscription`, `Usage`, `Settings`, `Support` — `src/constants/dashboard.tsx:11`-`src/constants/dashboard.tsx:15`; nav links contain no analytics URL — `src/constants/navigation.ts:23`-`src/constants/navigation.ts:129`.
- The `⋮` menu on a catalogue card has no Analytics entry (Edit, Change Status, Share, QR Code, Embed, Duplicate, Delete) — `src/components/dashboard/overview/ItemDropdownMenu.tsx:114`-`src/components/dashboard/overview/ItemDropdownMenu.tsx:171`.
- Once on the page, the catalogue switcher reaches **every** catalogue the user owns, newest created first, whatever its status — `src/lib/catalogue/ownership.ts:44`, order at `src/lib/catalogue/ownership.ts:52`. So an inactive catalogue's analytics *can* be opened through the switcher even though no button links to it.

## Page header

- Eyebrow line above the title: `Catalogue analytics` — `src/components/analytics/CatalogueAnalytics.tsx:36`.
- H1: `Analytics for {Title}` where Title is the slug with dashes turned into spaces and each word capitalised ("bean-there" → "Bean There") — `src/components/analytics/CatalogueAnalytics.tsx:37`, `src/components/analytics/CatalogueAnalytics.tsx:30`, `src/lib/format/text.ts:1`.
- Subtitle: `Track your catalogue performance and visitor insights.` — `src/components/analytics/CatalogueAnalytics.tsx:40`.
- The marketing footer is hidden on this page only — `src/app/admin/[name]/analytics/page.tsx:45`, `src/components/navigation/AppShell.tsx:10`, `src/components/navigation/AppShell.tsx:42`.

## The control bar

- Two controls, in this order left to right: the catalogue switcher, then the date-range group — `src/components/analytics/AnalyticsControls.tsx:58`, `src/components/analytics/AnalyticsControls.tsx:75`.
- Catalogue switcher: a dropdown, accessible name `Catalogue`, showing the prettified catalogue name — `src/components/analytics/AnalyticsControls.tsx:61`, `src/components/analytics/AnalyticsControls.tsx:69`. Choosing one navigates to that catalogue's analytics keeping the current range — `src/components/analytics/AnalyticsControls.tsx:59`, `src/components/analytics/AnalyticsControls.tsx:33`.
- Date-range group: a radio group with accessible name `Date range` — `src/components/analytics/AnalyticsControls.tsx:76`.
- The three options, exact labels: `7 days`, `30 days`, `90 days` — `src/components/analytics/AnalyticsControls.tsx:93` with `TRAFFIC_RANGES = [7, 30, 90]` at `src/lib/analytics/traffic.ts:8`.
- Default: **30 days**. Any other `?range=` value (missing, `365`, `7; drop table`) silently falls back to 30 — `src/lib/analytics/traffic.ts:10`, `src/lib/analytics/traffic.ts:13`; tested at `tests/unit/lib/analytics/traffic.test.ts:19`.
- Clicking a range changes the URL to `?range=<days>` — `src/components/analytics/AnalyticsControls.tsx:35`. The whole page re-reads PostHog.
- Arrow keys (left/right/up/down) move **and select** the next range, wrapping around — `src/hooks/useRadioKeys.ts:10`.
- While the new range loads, the control bar is marked busy and dims to 70% opacity — `src/components/analytics/AnalyticsControls.tsx:52`.

## What counts as a view (the matching rule)

- The page counts PostHog `$pageview` events where the host is Quicktalog's own host **and** the path is exactly `/catalogues/<slug>` or `/catalogues/<slug>/` — `src/lib/analytics/catalogue-traffic.ts:30`-`src/lib/analytics/catalogue-traffic.ts:36`, values built at `src/lib/analytics/catalogue-traffic.ts:57`-`src/lib/analytics/catalogue-traffic.ts:65`.
- Because it matches the path and not the full URL, links carrying `?utm_*`, `?fbclid=…` or a `#fragment` **are** counted — `src/lib/analytics/catalogue-traffic.ts:19`, `docs/architecture/analytics.md:65`.
- What is therefore **not** counted on this page:
  - the builder and dashboard (`/admin/...`) — path does not match (`src/lib/analytics/catalogue-traffic.ts:32`);
  - the owner's draft preview at `/catalogues/<slug>/preview` — path does not match (route: `src/app/catalogues/[name]/preview/page.tsx:19`);
  - the marketing demo at `/demo` — path does not match (route dir `src/app/(site)/demo`);
  - a URL typed with different capitalisation, since the comparison is an exact string match (`src/lib/analytics/catalogue-traffic.ts:32`).
- The pageview itself is captured by PostHog in the browser, enabled for the whole app with autocapture, heatmaps, session recording and page-leave all switched off — `src/instrumentation-client.ts:5`, `capture_pageview: true` at `src/instrumentation-client.ts:11`.
- **The owner's own visits count.** There is no exclusion by identity, cookie or session anywhere in the query (`src/lib/analytics/catalogue-traffic.ts:30`) or in the capture setup (`src/instrumentation-client.ts:5`). Opening your own live catalogue adds a view and a visitor.
- An **embedded** catalogue counts: the downloaded embed snippet iframes the plain catalogue URL — `src/lib/catalogue/download.ts:3`, built from `src/components/dashboard/overview/ItemDropdownMenu.tsx:112`.
- A catalogue shown on Quicktalog's own `/showcases` page also counts: the iframe only adds a `qt_frame=1` query parameter, which does not change the path — `src/components/showcases/ShowcaseFrame.tsx:71`, `src/lib/catalogue/tracking-providers.ts:256`. The in-code comment there is about the *owner's own* GA/Pixel tags, not about Quicktalog's own counting — `src/components/showcases/ShowcaseFrame.tsx:68`.

## Metric cards (four, in this order)

Grid: 2 columns on narrow screens, 4 columns from 1100px — `src/components/analytics/KpiCards.tsx:86`. Each card is a bordered card with the label at top left, an icon tile top right, the big number, an optional note, then the change line — `src/components/analytics/KpiCards.tsx:54`-`src/components/analytics/KpiCards.tsx:73`.

### 1. `Total views`
- Exact label `Total views`, eye icon — `src/components/analytics/KpiCards.tsx:94`, `src/components/analytics/KpiCards.tsx:93`.
- Counts every page open of this catalogue in the chosen period: the sum of the daily `count()` of `$pageview` events — `src/lib/analytics/catalogue-traffic.ts:38`, summed at `src/lib/analytics/traffic.ts:70`, `src/lib/analytics/traffic.ts:81`.
- Does **not** de-duplicate repeat visits by the same person; does not count scrolls, clicks, item taps, QR scans, newsletter sign-ups or anything but a page open (`autocapture: false`, `src/instrumentation-client.ts:9`).
- Formatted with thousands separators, US style — `src/components/analytics/KpiCards.tsx:18`.

### 2. `Unique visitors`
- Exact label `Unique visitors`, people icon — `src/components/analytics/KpiCards.tsx:105`, `src/components/analytics/KpiCards.tsx:104`.
- Counts distinct PostHog `distinct_id`s over the **whole** period, from a separate query — `src/lib/analytics/catalogue-traffic.ts:40`, carried through at `src/lib/analytics/traffic.ts:31`.
- It is **not** the sum of the daily visitor numbers in the table: someone who comes back on three days is one visitor here and three in the table rows — `src/lib/analytics/traffic.ts:31`, `docs/architecture/analytics.md:38`.
- A "visitor" is a browser, not a person: a new device, a new browser, a cleared cookie or private mode is a new visitor (`distinct_id` is PostHog's browser identifier, `src/lib/analytics/catalogue-traffic.ts:38`).

### 3. `Most popular day`
- Exact label `Most popular day`, calendar icon — `src/components/analytics/KpiCards.tsx:115`, `src/components/analytics/KpiCards.tsx:114`.
- Value is the date of the day with the most views in the period, written like `Sat, Sep 20` — `src/components/analytics/KpiCards.tsx:117`, `src/lib/analytics/traffic.ts:135`.
- The note under it reads `<N> views`, e.g. `42 views` — `src/components/analytics/KpiCards.tsx:116`.
- On a tie the **most recent** day wins — `src/lib/analytics/traffic.ts:62`, tested at `tests/unit/lib/analytics/traffic.test.ts:104`.
- With no views at all in the period, the value is the single character `–` (en dash) and no note is shown — `src/components/analytics/KpiCards.tsx:117`.
- Ranked by views only; a day with fewer views but more visitors never wins — `src/lib/analytics/traffic.ts:65`.

### 4. `Avg. views / day`
- Exact label `Avg. views / day`, trending-up icon — `src/components/analytics/KpiCards.tsx:126`, `src/components/analytics/KpiCards.tsx:125`.
- Total views divided by the number of days in the range (7, 30 or 90), always shown with two decimals, e.g. `2.00` — `src/lib/analytics/traffic.ts:90`, `src/components/analytics/KpiCards.tsx:127`.
- It divides by the **whole** range even if the catalogue was published two days ago, so a brand-new catalogue's average looks low — `src/lib/analytics/traffic.ts:91`.

## The change ("delta") line under each number

- Format: a coloured percentage then grey text, e.g. `+12.3% vs previous 30 days` — `src/lib/analytics/traffic.ts:127`, rendered at `src/components/analytics/KpiCards.tsx:20`.
- Period wording always reads `previous <range> days` — `src/lib/analytics/traffic.ts:116`.
- The comparison period is the `range` days immediately **before** the current period, same length, so a 30-day view compares days −29…0 with days −59…−30 — window built at `src/lib/analytics/catalogue-traffic.ts:62`, split at `src/lib/analytics/catalogue-traffic.ts:90`.
- Maths: `(current − previous) / previous × 100`, rounded to one decimal — `src/lib/analytics/traffic.ts:122`.
- Rise: green, with a leading `+` — `src/components/analytics/KpiCards.tsx:27`, `src/lib/analytics/traffic.ts:129`.
- Fall: red, with a real minus sign `−` (U+2212, not a hyphen) — `src/components/analytics/KpiCards.tsx:28`, `src/lib/analytics/traffic.ts:129`; tested at `tests/unit/lib/analytics/traffic.test.ts:52`.
- A change that rounds to zero shows `0.0%` in neutral grey plus `vs previous 30 days` — `src/lib/analytics/traffic.ts:125`, `src/components/analytics/KpiCards.tsx:29`.
- Nothing in the previous period but something now: no percentage at all, text `No views in the previous 30 days` — `src/lib/analytics/traffic.ts:119`. On the Unique visitors card the noun changes: `No visitors in the previous 30 days` — `src/components/analytics/KpiCards.tsx:102`, `src/lib/analytics/traffic.ts:119`, tested at `tests/unit/lib/analytics/traffic.test.ts:74`.
- Nothing in either period: `No change vs previous 30 days` — `src/lib/analytics/traffic.ts:120`.
- What each card compares:
  - Total views → previous period's total views (`src/components/analytics/KpiCards.tsx:88`).
  - Unique visitors → previous period's distinct visitors (`src/components/analytics/KpiCards.tsx:98`, `src/lib/analytics/catalogue-traffic.ts:40`).
  - Most popular day → the **views of the previous period's busiest day**, i.e. peak vs peak, not date vs date (`src/components/analytics/KpiCards.tsx:110`).
  - Avg. views / day → previous period's average (`src/components/analytics/KpiCards.tsx:120`).

## The chart

- Card title: `Traffic overview` — `src/components/analytics/CatalogueAnalytics.tsx:99`.
- Card subtitle: `Daily page views over time` — `src/components/analytics/CatalogueAnalytics.tsx:101`.
- A legend chip on the right of the card header reads `Page views` next to a short coloured dash — `src/components/analytics/CatalogueAnalytics.tsx:110`.
- Type: a smooth-curved **area** chart (line with a gradient fill fading downwards), animations off — `src/components/charts/LineChart.tsx:62`, `src/components/charts/LineChart.tsx:71`, `src/components/charts/LineChart.tsx:73`.
- X axis: one category per day of the **current** period, oldest on the left, labelled like `Sep 20` — `src/components/analytics/CatalogueAnalytics.tsx:77`, `src/components/analytics/CatalogueAnalytics.tsx:78`, `src/components/charts/LineChart.tsx:98`. At most 6 tick labels are drawn and overlapping ones are hidden — `src/components/charts/LineChart.tsx:99`, `src/components/charts/LineChart.tsx:108`.
- Y axis: page views, starts at 0, about 4 ticks, whole numbers with thousands separators, horizontal grid lines only — `src/components/charts/LineChart.tsx:113`-`src/components/charts/LineChart.tsx:119`, `src/components/charts/LineChart.tsx:93`.
- One point = one calendar day (UTC) and its **page views** only; visitors are not plotted — `src/components/analytics/CatalogueAnalytics.tsx:80`.
- Hover tooltip: big `<N> views`, then the long date `Sat, Sep 20`, then ` · <N> visitors` — `src/components/charts/LineChart.tsx:155`, data at `src/components/analytics/CatalogueAnalytics.tsx:79`-`src/components/analytics/CatalogueAnalytics.tsx:81`.
- The last point always carries a dark pill label reading `Today · <N>` — `src/components/charts/LineChart.tsx:136`. It says "Today" regardless of the number, including `Today · 0`.
- Size: 330px tall, full card width; below a 900px viewport it drops to 280px — `src/components/charts/LineChart.tsx:164`, `src/components/charts/LineChart.tsx:158`.
- The chart is hidden from screen readers; its text alternative is `Line chart of daily page views for the last <range> days. The most recent days are listed in the table below.` — `src/components/analytics/CatalogueAnalytics.tsx:114`, `src/components/analytics/CatalogueAnalytics.tsx:117`.
- The chart renders in the browser only (no server render), so it appears a moment after the rest of the page — `src/components/charts/LineChart.tsx:5`.

## The table

- Heading: `By day` — `src/components/analytics/ByDayTable.tsx:37`.
- Sub-line: `Most recent <N> days` where N is the number of rows actually shown — `src/components/analytics/ByDayTable.tsx:40`.
- Always the last **10** days of the period, newest first — `ROWS = 10` at `src/components/analytics/ByDayTable.tsx:12`, `src/components/analytics/ByDayTable.tsx:27`. A 30- or 90-day range still lists only 10 rows; there is no paging, sorting or "show more" control.
- Column headers, exactly: `Date`, `Page views` (right-aligned), `Unique visitors` (right-aligned), and a fourth column whose header is screen-reader-only text `Share of the busiest day` — `src/components/analytics/ByDayTable.tsx:47`, `:50`, `:52`, `:55`.
- The fourth column (a bar) is hidden below a 521px viewport — `src/components/analytics/ByDayTable.tsx:54`, `src/components/analytics/ByDayTable.tsx:79`.
- Dates read like `Sat, Sep 20` — `src/components/analytics/ByDayTable.tsx:66`, `src/lib/analytics/traffic.ts:135`.
- `Unique visitors` in the table is **per day**: the same person visiting on two days is counted on both — `src/lib/analytics/catalogue-traffic.ts:38`. Adding the column up does not give the Unique visitors card.
- A pill badge reading `Busiest` sits beside the date of the period's busiest day — `src/components/analytics/ByDayTable.tsx:68`.
- The badge and the bar scale come from the busiest day of the **whole period**, which may be older than any row shown — so on a 90-day range the badge is often absent and every bar is short — `src/components/analytics/ByDayTable.tsx:14`, `src/components/analytics/ByDayTable.tsx:24`, `src/components/analytics/CatalogueAnalytics.tsx:124`.
- Bar width = that day's views ÷ the busiest day's views — `src/components/analytics/ByDayTable.tsx:62`; screen readers hear `<N>% of the busiest day` — `src/components/analytics/ByDayTable.tsx:86`.
- Numbers use US thousands separators — `src/components/analytics/ByDayTable.tsx:74`, `src/components/analytics/ByDayTable.tsx:77`.
- There is **no** "most viewed items", "top sections", "referrers", "countries" or "devices" table anywhere; `src/components/analytics/` contains only the controls, the KPI cards and this table (`ls src/components/analytics` → `AnalyticsControls.tsx`, `ByDayTable.tsx`, `CatalogueAnalytics.tsx`, `KpiCards.tsx`).

## Time zone

- Days are **UTC calendar days**, end to end. "Today" is computed as the UTC date — `src/lib/analytics/catalogue-traffic.ts:43`; events are bucketed with `toDate(toTimeZone(timestamp, 'UTC'))` — `src/lib/analytics/catalogue-traffic.ts:24`; the window bounds are explicitly UTC — `src/lib/analytics/catalogue-traffic.ts:34`.
- Dates are printed as plain calendar days forced to UTC, so they never shift for the reader's own time zone — `src/lib/analytics/traffic.ts:135`, `src/lib/format/date.ts:10`.
- Why UTC and not PostHog's `today()`: `today()` is not timezone-aware while `timestamp` follows the project timezone, and mixing them could shift the window by a day — `src/lib/analytics/catalogue-traffic.ts:12`, `docs/architecture/analytics.md:75`.
- **For the reader:** a visit at 11pm local time in, say, Madrid (UTC+2) lands on the *next* UTC day, so an evening spike can appear on "tomorrow". The day marked `Today · N` is the current UTC day, which for anyone west of UTC starts in the middle of their previous afternoon/evening.
- The monthly traffic allowance is also measured on UTC month boundaries — `supabase/migrations/20260929120000_schema_consistency.sql:486`.

## Freshness — how long after a visit the numbers move

- **The analytics page: effectively immediately.** The page is `force-dynamic` (`src/app/admin/[name]/analytics/page.tsx:19`) and every request posts two live HogQL queries to PostHog with `cache: "no-store"` — `src/lib/analytics/catalogue-traffic.ts:115`, `src/utils/posthog.ts:60`. Any ingestion delay is PostHog's own, not Quicktalog's.
- **The dashboard totals and the Usage meter: up to about a day behind.** They read the `analytics` rollup table (`src/lib/dashboard/overview.ts:33`, `src/lib/users/my-user-data.ts:80`), which is written by the Worker's daily job at **03:00 UTC** — `../quicktalog-backend/wrangler.jsonc:50`, `../quicktalog-backend/src/index.ts:31`, `../quicktalog-backend/src/index.ts:42`.
- The plan check that switches catalogues off runs three times a day: **03:00, 11:00 and 19:00 UTC** — `../quicktalog-backend/wrangler.jsonc:50`, `../quicktalog-backend/src/index.ts:46`.
- Each query to PostHog is given 20 seconds and the two run in parallel — `src/utils/posthog.ts:22`, `src/lib/analytics/catalogue-traffic.ts:115`.

## Empty states and error states (exact text)

- There is **no** dedicated "no data yet" panel. Missing days are filled with zeros and the page renders normally — `src/lib/analytics/traffic.ts:43`, `src/lib/analytics/catalogue-traffic.ts:86`. A brand-new catalogue shows four cards reading `0`, `0`, `–`, `0.00`, a flat chart at zero with a `Today · 0` label, and ten table rows of zeros.
- Delta lines in that state: `No change vs previous 30 days` on every card — `src/lib/analytics/traffic.ts:120`.
- PostHog unreachable, mis-configured or slow → the whole report is replaced by a red alert panel:
  - heading `Error loading analytics`;
  - body `Unable to load analytics data at this time. Please try again later.`
  — `src/components/analytics/CatalogueAnalytics.tsx:63`, `src/components/analytics/CatalogueAnalytics.tsx:65`; triggered by the caught error at `src/app/admin/[name]/analytics/page.tsx:37`, reported to Sentry at `src/app/admin/[name]/analytics/page.tsx:40`.
  The control bar and the title stay visible above it — `src/components/analytics/CatalogueAnalytics.tsx:44`.
- The chart's own "no points" fallback (a single `-` category) exists but is unreachable from this page, because the day list is always zero-filled to the full range — `src/components/charts/LineChart.tsx:53` vs `src/lib/analytics/catalogue-traffic.ts:86`.

## History per plan

- **No plan gates the analytics page at all.** Every plan gets 7 / 30 / 90 days: the range comes only from the URL and the fixed list, with no tier lookup anywhere on the page — `src/lib/analytics/traffic.ts:8`, `src/lib/analytics/traffic.ts:13`, `src/app/admin/[name]/analytics/page.tsx:24` (no `getPlanForUpdate`/`tiers` import in the page or in `src/components/analytics/*`).
- There is therefore **no** "your plan only keeps N days" message, and no upgrade prompt on the analytics page. Searching the app for such text finds nothing (`grep -rn "analytics" src` results list no plan-gated analytics string).
- Plans do carry an `analytics` label of `"Basic"` or `"Advanced"`, but it is only printed in pricing/subscription tables — `../quicktalog-packages/src/constants/pricing.ts:21` (Starter `"Basic"`), `:60`, `:83`, `:114` (Growth `"Advanced"`), `:145`, `:184`; rendered at `src/constants/pricing.ts:111` and `src/constants/pricing.ts:304`. No code reads it to change behaviour.
- The public FAQ states this correctly: "Every catalogue has its own analytics page on every plan, covering the last 7, 30 or 90 days." — `src/constants/details.ts:105`.
- The rollup table behind the dashboard totals has no retention/cleanup job, so `Total Views` on the dashboard is all-time (the one `delete from public.analytics` is a one-off de-duplication inside a migration — `supabase/migrations/20260929120000_schema_consistency.sql:196`).

## The monthly traffic limit

### The limit per plan (page views per month, all catalogues together)

| Plan | Page views / month | Evidence |
|---|---|---|
| Starter (free) | 500 | `../quicktalog-packages/src/constants/pricing.ts:18` |
| Basic | 2,000 | `../quicktalog-packages/src/constants/pricing.ts:49` |
| Pro | 5,000 | `../quicktalog-packages/src/constants/pricing.ts:80` |
| Growth | 15,000 | `../quicktalog-packages/src/constants/pricing.ts:111` |
| Premium | 40,000 | `../quicktalog-packages/src/constants/pricing.ts:142` |
| "German Silva Custom Plan" (one customer) | 4,000 | `../quicktalog-packages/src/constants/pricing.ts:173` |

- The allowance is shared across all the owner's catalogues and resets at the start of each **UTC** month — summed by `private.my_usage()` over the current UTC month — `supabase/migrations/20260929120000_schema_consistency.sql:486`, `supabase/migrations/20260929120000_schema_consistency.sql:493`.
- Rows of a **deleted** catalogue keep their `user_id` with a null `catalogue_id`, so views from a catalogue you deleted still count against the month — `docs/architecture/analytics.md:31`, schema `../quicktalog-packages/src/drizzle/migrations/schema.ts:173` (`catalogue_id` nullable, `on delete set null` at `:180`).

### What the owner sees

- **Usage tab** (`?tab=usage`): heading `Usage Overview`, lead `Monitor your resource consumption and track usage across all features`, then three meters in order `Traffic`, `Catalogues`, `AI Credits` — `src/components/dashboard/MonthlyUsage.tsx:98`, `:99`, `:71`, `:80`, `:87`. The AI Credits meter is hidden when the plan has none — `src/components/dashboard/MonthlyUsage.tsx:92`.
- The `Traffic` meter is a semicircular arc with the percentage in the middle, the words `of limit` under it, and `<used> / <limit> views` below — `src/components/dashboard/MonthlyUsage.tsx:72`-`:75`, `src/components/charts/GaugeChart.tsx:83`, `src/components/charts/GaugeChart.tsx:86`, `src/components/charts/GaugeChart.tsx:91`.
- Over the limit the words change to `over limit` and the arc stops at 100% while the number keeps going — `src/components/charts/GaugeChart.tsx:86`, `src/components/charts/GaugeChart.tsx:44`.
- The percentage is rounded **down**, so it reads 100% only at or past the limit — `src/components/charts/GaugeChart.tsx:26`.
- At 80% of the limit the card turns amber and shows a pill reading `Near limit` — `src/components/charts/GaugeChart.tsx:22`, `src/components/dashboard/MonthlyUsage.tsx:40`.
- At the limit the card turns red and the pill reads `Limit reached`; past the limit it reads `<N> views over` — `src/components/dashboard/MonthlyUsage.tsx:46`, `src/components/dashboard/MonthlyUsage.tsx:48`.
- Screen-reader text for the meter: `<used> of <limit> views, <percent>%` — `src/components/charts/GaugeChart.tsx:55`.
- **Overview tab banner**, shown while used ≥ limit: title `You've reached your traffic limit`, body `Upgrade your plan to increase your traffic limit and reactivate your catalogues.`, button `Upgrade plan` → `/pricing` — `src/components/dashboard/overview/LimitCTAs.tsx:27`-`src/components/dashboard/overview/LimitCTAs.tsx:33`, rendered above the catalogue cards at `src/components/dashboard/Overview.tsx:179`.
- **`⋮` → Change Status → `Activate`** is disabled at the limit, with the hover title `Traffic limit reached` — `src/components/dashboard/overview/ItemDropdownMenu.tsx:101`, `:207`, `:217`; the status labels are `Activate` / `Deactivate` / `Save` — `src/components/dashboard/overview/ItemDropdownMenu.tsx:67`-`:71`.
- **If a publish or re-activation is attempted anyway**, the server refuses with the toast text `This month's traffic limit for your plan is reached` — `src/lib/entitlements/plan.ts:93`, checked at `src/lib/entitlements/plan.ts:90`; call sites: re-activation `src/actions/catalogue.ts:147` and publish `src/actions/catalogue.ts:453`; surfaced as a toast at `src/components/dashboard/Overview.tsx:111`.
- The `+` floating button on the dashboard dims to 60% opacity while the traffic limit is reached (the same flag also covers the catalogue quota) — `src/app/admin/dashboard/page.tsx:70`, `src/components/dashboard/FloatingActionMenu.tsx:35`.
- The catalogue card then shows the status pill `Inactive` — `src/components/dashboard/overview/StatusBadge.tsx:16`.
- A visitor opening a switched-off catalogue gets the Next.js not-found page: the public read only returns published catalogues — `src/app/api/items/[name]/route.ts:7`, `src/app/catalogues/[name]/page.tsx:126` (`notFound()`).
- The in-app `Traffic` upgrade modal, when it opens, reads `Your catalogue is getting noticed! Upgrade to get <N> page views per month and keep serving customers without interruption.` with the benefit line `Handle more visitors without your catalogue going offline` — `src/components/modals/limits/limitContent.ts:144`, `:148`. (No code path in this repo passes `type="traffic"` to `LimitsModal`; the dashboard only opens it for `"catalogue"` — `src/components/dashboard/overview/ItemDropdownMenu.tsx:263`. Flagged below.)
- **No email** is sent when the traffic limit switches catalogues off: the only "we took these offline" email is the cancellation one, about the catalogue quota — `src/components/emails/CancelationEmail.tsx:23`, `src/components/emails/CancelationEmail.tsx:45`.
- Marketing/FAQ wording the docs should stay consistent with: "Page views are the only one your customers notice: when your catalogues together use the month's allowance they go offline, and you can put them back online next month or straight away after upgrading." — `src/constants/details.ts:127`; also `src/constants/pricingFaqs.ts:36`, and "Every time someone opens one of your catalogue pages. The allowance is shared across all your catalogues and resets each month." — `src/constants/pricingFaqs.ts:32`.

### Who actually gets switched off

- The Worker's plan check loads users **whose plan is not the free Starter monthly price** and inactivates all their active catalogues once the month's pageviews reach the limit — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126` (`.neq("plan_id", tiers[0].priceId.month)`), `:143`-`:158`.
- So a **free-plan** owner over 500 views is **not** switched off by the cron; they only hit the wall when they try to publish or re-activate (`src/lib/entitlements/plan.ts:90`). Documented as surprising behaviour below.
- Switched-off catalogues are revalidated so their public pages stop being served from cache — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:171`.

## Dashboard numbers (a different source)

- Overview tab → section heading `Dashboard` → four stat cards in this order: `Total Views`, `Total Visitors`, `Catalogues`, `Newsletter` — `src/components/dashboard/Overview.tsx:162`, cards at `src/components/dashboard/overview/OverallAnalytics.tsx:81`, `:87`, `:93`, `:99`.
- Grid: 2 columns, 4 from 1100px — `src/components/dashboard/overview/OverallAnalytics.tsx:78`.
- Each card has an `About <label>` info button that opens a modal titled `<Label> Explained` — `src/components/dashboard/overview/OverallAnalytics.tsx:49`, title built at `src/components/dashboard/Overview.tsx:231`.
- Explainer text, exact:
  - `Total Views` → `This shows the total number of times your catalogues have been viewed by visitors. It includes all page visits across all your catalogues.` — `src/components/dashboard/overview/OverallAnalytics.tsx:15`.
  - `Total Visitors` → `This represents the number of individuals who have visited your catalogues. Each person is counted only once per day, regardless of how many times they visit your catalogue on that day.` — `src/components/dashboard/overview/OverallAnalytics.tsx:19`.
  - `Catalogues` → `This displays the total number of catalogues you have created. Each catalogue represents a different business or service offering.` — `src/components/dashboard/overview/OverallAnalytics.tsx:23`.
  - `Newsletter` → `This shows how many people have subscribed to your newsletter service. These are users who have opted in to receive updates from you.` — `src/components/dashboard/overview/OverallAnalytics.tsx:27`.
- These two traffic numbers are **all-time sums of the rollup table**, with no date filter at all — `src/lib/dashboard/overview.ts:33`-`:39`, served by `src/app/api/dashboard/analytics/route.ts:14`.
- `Total Visitors` there is a sum of **daily** unique visitors, so a weekly regular is counted once per day — matching its explainer (`src/components/dashboard/overview/OverallAnalytics.tsx:19`) but unlike the catalogue page's `Unique visitors` (`src/lib/analytics/traffic.ts:31`).
- Signed-out or failed request: the route answers `{"error":"Unauthorized"}` 401 or `{"error":"Failed to fetch analytics"}` 500 — `src/app/api/dashboard/analytics/route.ts:11`, `:24`. These are API strings, not screen text; the dashboard falls back to a skeleton/zero (`src/components/dashboard/Overview.tsx` values default via `Number(value ?? 0)` at `src/components/dashboard/overview/OverallAnalytics.tsx:58`).

## Surprising behavior (things that will confuse a reader)

1. **The owner's own visits inflate their numbers.** Nothing excludes the signed-in owner from PostHog counting (`src/instrumentation-client.ts:11`, `src/lib/analytics/catalogue-traffic.ts:30`). Yet the owner's **own GA/Meta tags** deliberately skip any browser holding a Quicktalog session and any `/preview` page — `src/components/catalogue/view/CatalogueAnalytics.tsx:80`, `:94`. So Quicktalog's page and the owner's Google Analytics will never agree, by design.
2. **Preview is excluded from the analytics page but counts towards the traffic limit.** The page requires the exact path (`src/lib/analytics/catalogue-traffic.ts:32`), while the Worker's rollup matches any URL containing `/catalogues/` and takes the first path segment as the slug — `../quicktalog-backend/src/utils/analytics.ts:18`, `../quicktalog-backend/src/handlers/analyticsProcessingJob.ts:86`. A `/catalogues/<slug>/preview` visit therefore adds to the Usage meter and the dashboard totals but is invisible on the analytics page.
3. **Being featured on Quicktalog's `/showcases` page adds views to the owner's analytics and allowance** — the showcase iframe loads the real catalogue URL with only a `qt_frame=1` parameter added — `src/components/showcases/ShowcaseFrame.tsx:71`, `src/lib/catalogue/tracking-providers.ts:259`. That parameter suppresses the owner's own tags only — `src/components/catalogue/view/CatalogueAnalytics.tsx:72`.
4. **`Unique visitors` (card) ≠ the sum of the `Unique visitors` column.** Period-wide distinct count vs per-day counts — `src/lib/analytics/catalogue-traffic.ts:40` vs `:38`.
5. **The dashboard `Total Visitors` and the analytics page `Unique visitors` are computed differently** (sum of daily uniques vs distinct over the period) — `src/lib/dashboard/overview.ts:35` vs `src/lib/analytics/traffic.ts:31`.
6. **Summed URL variants make daily visitors an upper bound** in the rollup: the Worker sums several URL spellings of the same page into one day, so the same person counted under two URL variants becomes two visitors — `../quicktalog-backend/src/handlers/analyticsProcessingJob.ts:111`-`:143`, `docs/architecture/analytics.md:30`.
7. **Each day's rollup row is written once and never updated.** The daily job's window is "now minus 24h → now" (`../quicktalog-backend/src/handlers/analyticsProcessingJob.ts:13`-`:25`) and the upsert uses `ignoreDuplicates: true` on `(catalogue_id, day)` (`../quicktalog-backend/src/handlers/analyticsProcessingJob.ts:149`-`:152`). The row for a day is therefore created by the run that first sees that day — the 03:00 UTC run, which has only seen 00:00–03:00 of it — and the next run's fuller figure for the same day is discarded. Consequence: the dashboard totals and the monthly traffic usage can be **much lower** than the analytics page's totals for the same days. This is the single biggest numeric discrepancy found.
8. **The traffic cut-off does not apply to free-plan owners** (the cron skips them) — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126`. Their catalogues stay online over 500 views, but they cannot publish or re-activate anything — `src/lib/entitlements/plan.ts:90`. The FAQ promises they "go offline" — `src/constants/details.ts:127`.
9. **`Avg. views / day` always divides by the full range**, so a catalogue published yesterday on a 90-day range shows a tiny average — `src/lib/analytics/traffic.ts:91`.
10. **The `Most popular day` delta compares peaks, not the same date** — `src/components/analytics/KpiCards.tsx:110`.
11. **The `Busiest` badge can be missing from the table** on a 30- or 90-day range, because the table shows only the last 10 days while the badge belongs to the whole period — `src/components/analytics/ByDayTable.tsx:14`.
12. **The chart's last point always says `Today`**, including `Today · 0` on a quiet day — `src/components/charts/LineChart.tsx:136`.
13. **Deactivating a catalogue does not remove its past analytics**, and the Analytics button disappears from the card (`src/components/dashboard/overview/DashboardItem.tsx:152`) even though the data is still reachable through the switcher (`src/lib/catalogue/ownership.ts:44`).
14. **`?range=365` silently becomes 30 days** rather than erroring — `src/lib/analytics/traffic.ts:13`.
15. **A visit counted on the analytics page is a browser, not a person**: PostHog identity is `distinct_id`, session recording and autocapture are off, and no login is involved on a public catalogue — `src/lib/analytics/catalogue-traffic.ts:38`, `src/instrumentation-client.ts:9`.

## Layout facts for drawing the screen

Top to bottom, inside the signed-in shell (fixed navbar, max 1280px content, no footer — `src/components/navigation/AppShell.tsx:28`, `:42`):

1. **Header row** — left: eyebrow `Catalogue analytics`, H1 `Analytics for {Title}` (clamped 26–34px, extra-bold), subtitle; right: the control bar. Side by side and bottom-aligned from 900px, stacked below that, 18px bottom margin — `src/components/analytics/CatalogueAnalytics.tsx:34`.
2. **Control bar** — catalogue dropdown (40px tall, rounded, flexes from 180px) then the three-button range group in a bordered rounded pill, buttons 32px min height, 13px semibold, the selected one on a white card background with a shadow — `src/components/analytics/AnalyticsControls.tsx:58`, `:62`, `:77`, `:88`.
3. **Four metric cards** — order `Total views`, `Unique visitors`, `Most popular day`, `Avg. views / day`; 2×2 with 10px gaps, 1×4 with 14px gaps from 1100px; 16px padding; label top-left (13px semibold), 34px rounded icon tile top-right, number 22–30px extra-bold tabular, optional note, then the delta line (12.5px) — `src/components/analytics/KpiCards.tsx:86`, `:54`-`:72`, `:87`-`:128`.
4. **Chart card** — 18px padding, 14px bottom margin; header row with title `Traffic overview` (17px extra-bold) + subtitle on the left and the `Page views` legend chip on the right; chart 330px tall (280px under 900px) — `src/components/analytics/CatalogueAnalytics.tsx:88`, `:93`, `src/components/charts/LineChart.tsx:164`.
5. **`By day` card** — 18px padding; heading (17px extra-bold) + `Most recent 10 days` sub-line; then a 4-column table, 10 rows, numbers right-aligned and tabular, the bar column 34% wide and hidden under 521px — `src/components/analytics/ByDayTable.tsx:31`, `:33`, `:44`, `:79`.
6. Cards are the standard product card: rounded, 1px border, card background, soft shadow — `src/components/ui/card.tsx:12`.
7. Colours come from the product tokens (`--product-primary` amber for bars and the selected range, `--product-chart` for the line, green/red for deltas) — `src/components/charts/LineChart.tsx:55`, `src/components/analytics/ByDayTable.tsx:83`, `src/components/analytics/KpiCards.tsx:27`.

---

## Contradictions

1. **Pricing promises "Advanced analytics" that does not exist.** `Growth` and `Premium` carry `analytics: "Advanced"` (`../quicktalog-packages/src/constants/pricing.ts:114`, `:145`) and the explainer says "Advanced analytics provide detailed insights on popular services and visitor behavior patterns" (`src/constants/pricing.ts:166`). No code reads `features.analytics` for anything but printing it (`src/constants/pricing.ts:111`, `:304`); every plan sees the identical page (`src/lib/analytics/traffic.ts:8`). There is no "popular services" or "visitor behaviour" view anywhere.
2. **"Real-Time Analytics" / "Real-time analytics" claims.** `src/components/home/Benefits/Benefits.tsx:56`, `src/constants/schemas.ts:77`. The per-catalogue page is live, but the dashboard totals and the allowance are a once-a-day rollup (`../quicktalog-backend/src/index.ts:42`).
3. **QR article claims scan tracking.** "Carries scan analytics, so you can see how often it is used" and "Every scan — tracked in your analytics" — `src/content/articles/qr-code-catalog-guide.tsx:104`, `:175`. Nothing counts scans; only `$pageview` on the catalogue path is counted (`src/lib/analytics/catalogue-traffic.ts:30`). A scan is indistinguishable from a typed link.
4. **"they go offline" for free-plan owners.** `src/constants/details.ts:127` and `src/constants/pricingFaqs.ts:36` vs the cron skipping free users — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126`.
5. **The architecture doc says the rollup is "One row per catalogue per UTC day"** (`docs/architecture/analytics.md:29`). The Worker's query buckets with bare `toDate(timestamp)` (`../quicktalog-backend/src/utils/analytics.ts:11`), which PostHog evaluates in the **project's** timezone, not UTC — the opposite of the explicit `toTimeZone(timestamp, 'UTC')` the app uses (`src/lib/analytics/catalogue-traffic.ts:24`). Whether this actually shifts days depends on the PostHog project timezone, which is not in any repo.
6. **The architecture doc describes the rollup writer as mapping "each `/catalogues/<slug>` URL"** (`docs/architecture/analytics.md:30`) and says nothing about sub-paths; in fact the filter is `%/catalogues/%` and the slug regex stops at the first `/`, so `/catalogues/<slug>/preview` is folded into `<slug>` — `../quicktalog-backend/src/utils/analytics.ts:18`, `../quicktalog-backend/src/handlers/analyticsProcessingJob.ts:86`.
7. **The architecture doc does not mention that rollup rows are never updated** (`ignoreDuplicates: true`, `../quicktalog-backend/src/handlers/analyticsProcessingJob.ts:151`), which is what makes the dashboard totals and the analytics page disagree.
8. **The existing user doc says the page shows "views and visitors" per day and "marks the busiest day of the whole period"** (`src/content/docs/track-performance.tsx:96`) — correct — but also "a short table lists the most recent days one by one", without saying it is capped at 10 even on a 90-day range (`src/components/analytics/ByDayTable.tsx:12`).
9. **A `Traffic` limit modal exists but is never opened.** `src/components/modals/limits/limitContent.ts:140` defines its copy and `src/lib/entitlements/required-plan.ts:26` supports `"traffic"`, but no component passes `type="traffic"` to `LimitsModal` (only `"catalogue"` at `src/components/dashboard/overview/ItemDropdownMenu.tsx:263` and `"notFound"` at `src/app/catalogues/[name]/preview/page.tsx:33`). Treat that copy as unreachable; do not document it as something the user will see.
10. **The traffic modal's icon is a folder-tree, not the chart icon** its own `getIcon` returns for `"traffic"` — `src/components/modals/limits/limitContent.ts:143` vs `src/components/modals/limits/limitContent.ts:36`. Cosmetic, but it means two different icons claim to represent traffic.

## Could not confirm

- **PostHog's own retention and project timezone.** How far back `$pageview` data actually exists (so whether a 90-day range can ever be empty for an old catalogue) and the project timezone that `toDate(timestamp)` uses in the Worker query are PostHog project settings, not code. Not queried (instructed not to query PostHog).
- **Whether a 90-day range can hit the row cap.** `DAILY_QUERY` ends `limit 1000` (`src/lib/analytics/catalogue-traffic.ts:38`); 180 day-rows is well inside it, so in practice no — but I could not prove PostHog never returns extra rows for the same day.
- **Whether the owner is counted in practice with an ad-blocker or Do-Not-Track**, and whether `NEXT_PUBLIC_POSTHOG_KEY` is set in production at all. Env values are not readable (project rule) and `src/instrumentation-client.ts:5` only initialises when the key exists.
- **Observed numbers.** No database or PostHog query was run, so every claim about magnitudes (e.g. how badly item 7 under "Surprising behavior" undercounts) is read from code, not measured.
- **Whether any out-of-band notice (email, in-app toast on next sign-in) is sent when the cron switches catalogues off.** None found in this repo (`src/components/emails/` has no traffic email) and the Worker only writes console logs and `job_logs` rows (`../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:171`, `:109`); a notice sent from somewhere else (Supabase edge function, PROD-only) cannot be ruled out, since per project memory TEST has no edge functions and their sources live in no repo.
- **Exact rendered text of the `Usage Overview` meter when `traffic_limit` is 0** — no plan sets 0 (`../quicktalog-packages/src/constants/pricing.ts:18`+), so the "limit of 0 is reached by any use" branch (`src/components/charts/GaugeChart.tsx:20`) is unreachable in practice.
- **`docs/architecture/analytics.md` references `src/lib/analytics/traffic.ts` line numbers and a `my_usage` reader list that I verified, but its claim that `private.my_usage()` is "the usage meters" source and the worker's plan check "both sum `pageviews` by `user_id` over the UTC month"** (`docs/architecture/analytics.md:32`) is only half confirmable here: the app side matches (`supabase/migrations/20260929120000_schema_consistency.sql:493`), the Worker sums with its own UTC month helper (`../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:16`), which agrees — but the two read different code paths, so they could drift.
