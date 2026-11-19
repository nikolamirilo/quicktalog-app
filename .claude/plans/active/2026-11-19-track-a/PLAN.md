# Track A — engineering fixes from the combined action plan

Status: in progress — code complete 2026-11-19, migrations written but **not applied**

Spec: [OVERVIEW.md](OVERVIEW.md) — the same plan in plain language.
Source: "Quicktalog — Combined action plan", 19 Nov 2026 (@Reactify Solutions), Track A
items QT-01, QT-03, QT-04, QT-05, QT-06, QT-08, QT-09, QT-10, QT-11. Track B (PB-xx) is
not in this plan.

## 1. What the code actually does today (verified by reading, 19 Nov 2026)

The action plan says the draft "lives in a server-side store outside `public.catalogues`
that hasn't been identified". It is **Upstash Redis**:

- `src/lib/catalogue/draft-cache.ts` keys drafts `${REDIS_KEY_PREFIX}:catalogue:${id}`
  with a **30-day sliding TTL** (`TTL_SECONDS`, refreshed on each read via `getex`).
- `updateCatalogue` (`src/actions/catalogue.ts`) — what the **Save** button calls — only
  ever calls `writeOwnedDraft`. It never touches `public.catalogues`. That is why
  `content = []` and `updated_at = created_at` after "Catalogue saved successfully".
- `publishCatalogue` is the only path that writes `catalogues.content`.
- `getCatalogueByName` returns the row with the Redis draft spread on top.

So the reported symptom is correct, the store is identified, and the two real defects
are (a) drafts are not durable (eviction, TTL, a cache outage loses work) and (b) the
save is manual, so a user who never presses Save and never publishes leaves an empty
row — 160 of 628 on PROD.

Other verified starting points:

| Item | What the code does now |
|---|---|
| QT-03 | `useCreateCatalogue` closes the dialog, then `await refreshUserData()`, then `router.push`. The dialog already has a loading state; the dead time is the awaited refresh. |
| QT-04 | A new catalogue opens empty; Quick AI is a pill (`CatalogueChat`), its four `SUGGESTIONS` all assume existing content; the heading is left empty. No PostHog events exist in app code at all. |
| QT-05 | Prices come only from `usePaddlePrices` (Paddle.js, client). `PriceAmount` renders `–` + sr-only "Price loading". The server SDK (`getPaddleInstance`) is already used for checkout. |
| QT-06 | `/demo` is a `PageHero` plus `DemoTour`, an iframe mounted after hydration. No product content in the server HTML. |
| QT-08 | `DashboardItem` shows name, status, updated/created. No item count, no draft state, no banner. |
| QT-09 | `users.acquisition_source` is the **self-reported** answer only (`AcquisitionSourceModal`). No UTM or referrer capture anywhere. |
| QT-10 | `FaqAccordion` renders answers in the SSR HTML but inside `hidden` panels, so markdown/readability fetches drop them. Only `/help` has FAQPage JSON-LD; `/pricing` and `/` do not. |
| QT-11 | 215 occurrences of "catalog" (not "catalogue") across `src`, most of them SEO article bodies and keyword lists. |

## 2. Decisions

1. **Drafts move to Postgres, not Redis.** A new `public.catalogue_drafts` table is the
   source of truth. Redis leaves the draft path entirely (it keeps rate limiting, ops
   flags and the stock-photo cache). Cost: one more table and a migration; gain: the
   draft read joins the row read in the same `withUser` transaction (one round trip
   instead of a Postgres transaction plus an Upstash HTTPS call), and conflict detection
   becomes a single `where updated_at = $base`.
2. **The draft is the whole editable payload as `jsonb`**, not `content` alone — that is
   what the Redis draft already held (appearance, heading, header, footer, …), and
   narrowing it would lose unsaved style edits.
3. **"Unpublished changes" is a timestamp comparison, not a deep diff.**
   `catalogue_drafts.published_at` is stamped by Publish; `updated_at > published_at`
   (or `published_at is null`) means unpublished. Cost: an edit that is undone by hand
   still reads as unpublished until the next publish or reload.
4. **No `drizzle-kit pull` / package release in this plan.** The new tables and columns
   are read and written with parameterised raw SQL inside `withUser`, the same way
   `acquisition_source` already is. Follow-up: a `drizzle-kit pull` in
   `@quicktalog/common` and a release, after which these call sites can move to Drizzle.
5. **Migrations are written, not applied.** `supabase/migrations/*.sql` are added here;
   applying them to TEST (then PROD) is an operator step, per `CLAUDE.md`.
6. **The first-touch record is written by the browser, not middleware.** The middleware
   deliberately returns public pages without `Set-Cookie` so the CDN can cache them;
   setting `qt_ft` there would make the landing page uncacheable for every visitor. A
   first-party cookie written by a small client component is not blocked by ad blockers
   (the problem the action plan raises), and `httpOnly` is not meaningful for
   attribution data. Cost: a deviation from the action plan's step 1.
7. **Acquisition is written at the two sign-up entry points** (`/auth/callback` for
   Google, `confirmEmailToken` for email), which can both read and clear the cookie.
   Cost: a sign-up that never reaches either path keeps a null source.
8. **Version history keeps 10 autosaves per catalogue** in `catalogue_draft_versions`,
   restorable from the save-status chip. Cost: up to 10 copies of a catalogue's JSON per
   catalogue.
9. **QT-11 covers UI copy, page titles, meta, emails and toasts — not article bodies,
   article slugs or the keyword list.** The articles target "digital catalog" as a
   US-spelling search term and their slugs are live URLs; renaming them would undo
   QT-05/QT-10's SEO work and break links. `KEYWORDS` in `src/constants/index.ts` now
   carries **both** spellings, since most people searching for this product type
   "catalog" and the `keywords` meta tag costs nothing either way. Those two places are
   the only exceptions, and `tests/unit/architecture/catalogueSpelling.test.ts` fails if
   a third appears.
10. **Server-rendered prices are fetched with the Paddle Node SDK and cached for an
    hour**; the client toggle and the localised client preview still run, and replace the
    server values when they arrive. Cost: a visitor in a non-USD country sees USD for a
    moment.

## 3. Tasks

Each task is independently shippable and listed in the action plan's priority order.

### T1 — QT-01 Remove Save, autosave drafts, flush on exit, keep Publish

**Migration** `supabase/migrations/20261119120000_catalogue_drafts.sql`

```sql
create table public.catalogue_drafts (
  catalogue_id uuid primary key references public.catalogues (id) on delete cascade,
  user_id      text not null references public.users (id) on update cascade on delete cascade,
  draft        jsonb not null,
  updated_at   timestamptz not null default now(),
  published_at timestamptz,
  constraint catalogue_drafts_size check (pg_column_size(draft) < 2097152)
);
create index catalogue_drafts_user_id_idx on public.catalogue_drafts (user_id);

create table public.catalogue_draft_versions (
  id           bigint generated always as identity primary key,
  catalogue_id uuid not null references public.catalogues (id) on delete cascade,
  user_id      text not null references public.users (id) on update cascade on delete cascade,
  draft        jsonb not null,
  created_at   timestamptz not null default now(),
  constraint catalogue_draft_versions_size check (pg_column_size(draft) < 2097152)
);
create index catalogue_draft_versions_catalogue_idx
  on public.catalogue_draft_versions (catalogue_id, created_at desc);
```

RLS on both, `for all to app_user using/with check (user_id = (select
private.current_user_id()))`, plus a `with check` that the `catalogue_id` is one of the
caller's catalogues. `grant select, insert, update, delete` to `app_user` (column-level
update on `draft`, `updated_at`, `published_at`). No grants to `app_public`.

**Server** `src/lib/catalogue/draft-store.ts` (replaces `draft-cache.ts`)

- `readOwnedDraft(me, name)` → `{ catalogue, draftUpdatedAt, unpublished } | null`
  (row + draft on top, server-owned fields always from the row).
- `saveOwnedDraft(tx, me, { catalogueId, draft, baseUpdatedAt })` → `{ ok, updatedAt }`
  or `{ conflict: true, updatedAt }`. Upsert guarded by `base is null and no row` or
  `updated_at = base`.
- `recordDraftVersion(tx, …)` + trim to the 10 newest.
- `markDraftPublished(tx, …)`; `deleteDrafts(ids)` kept for the delete paths (now a DB
  delete, cascaded by the FK, so it becomes a no-op helper that is removed).
- `listDraftVersions(tx, me, catalogueId)` and `restoreDraftVersion(...)`.

**Actions** `src/actions/catalogue.ts`

- `updateCatalogue(data, baseUpdatedAt?)` → `{ success, data, draftUpdatedAt,
  unpublished }` or `{ success: false, conflict: true }`. Plan limits unchanged
  (`contentWithinPlan` against the stored draft).
- `publishCatalogue` also stamps `published_at` and refreshes the draft row.
- `getCatalogueByName` keeps its shape (the dashboard card uses it);
  `getBuilderCatalogue(name)` is the builder's loader and returns the draft metadata.
- `restoreDraftVersion(name, versionId)`.

**Route** `src/app/api/catalogue/draft/route.ts` — `POST`, same-origin check,
`getVerifiedIdentity`, body `{ name, draft, baseUpdatedAt }`, calls the same save path.
This is what `sendBeacon` / `keepalive` hits; server actions are not reliable from
`pagehide`.

**Client**

- `src/hooks/useAutosave.ts`: debounce 1500 ms after the last change; never while
  `aiReview` is open; immediate save on Keep (already `useKeepAiChanges`); retry with
  backoff on failure; `visibilitychange(hidden)` and `pagehide` flush through the route.
  Exposes `{ status, lastSavedAt, conflict, retry }`.
- `src/components/catalogue/builder/SaveStatus.tsx`: "Saving…" / "All changes saved" /
  "Offline – retrying"; opens the version-history dialog.
- `src/components/catalogue/builder/VersionHistoryDialog.tsx`.
- `BuilderRail` and `BuilderBottomBar`: the Save action goes, the status takes its slot.
  `useBuilderActions` keeps an internal save for Preview and Publish.
- Publish button and dashboard card show "Unpublished changes".
- `NavigationGuard` stays as the last resort but is only armed when a save is pending.

**Migration of existing drafts** `scripts/redis/migrate-drafts-to-db.ts`: scans the
prefixed draft keys, writes each into `catalogue_drafts` as admin, dry run unless
`DRY_RUN=0`, same confirmation shape as `delete-legacy-keys.ts`.

### T2 — QT-03 Go straight to the builder after Create Catalog

`useCreateCatalogue`: keep the dialog open and loading, `router.push` as soon as the
insert resolves, refresh user data without awaiting it, and
`router.prefetch('/admin/[name]/builder')`-equivalent on dialog open (prefetch the
dashboard-independent route once the name is known is not possible, so prefetch on the
first keystroke of a valid name).

### T3 — QT-04 New catalogue opens with Quick AI first

- `CatalogueContext` gains `isChatExpandedOnLoad` behaviour through a new
  `useEmptyCatalogueOnboarding` hook in the builder: when `content.length === 0`, open
  the chat on desktop with a prefilled prompt built from business type + name; on phones
  leave it closed, pulse the Quick AI button and show a one-time hint.
- `CatalogueChat`: `SUGGESTIONS` become content-creating when the catalogue is empty
  ("Build my catalogue from a description", "Import from a photo of my menu", "Start
  from a template"); the third opens the template picker, the second opens the attach
  picker.
- `createCatalogue` fills `heading` from the catalogue name (`wrapHeading`).
- After a generation that added sections, a toast offers "Add photos".
- `src/lib/analytics/events.ts`: `captureEvent(name, props)` over `posthog-js`; fires
  `builder_opened_empty`, `quick_ai_first_used`, `first_section_created`,
  `first_publish`.

### T4 — QT-05 Server-render prices

- `src/lib/paddle/prices.ts`: `getServerPrices()` — Paddle Node SDK `pricePreview` for
  every tier price id, formatted, `unstable_cache` with `revalidate: 3600`.
- `/pricing` and the home pricing block pass `initialPrices` into `PricingPlans` →
  `usePricingPlans` → `usePaddlePrices(…, { initial })`. `PriceAmount` renders the
  server value immediately.
- Product/Offer JSON-LD built from the real tiers and prices, replacing the hardcoded
  `$0`/`$10` offers in `pricingPageSchema`.

### T5 — QT-06 /demo renders content without JavaScript

A server-rendered `DemoPreview` above the tour: the real feature list, a static
catalogue sample (headings, sections, a few items, prices) and the CTA — all plain
server HTML. The tour stays, below it, with its own heading.

### T6 — QT-08 Dashboard shows draft state and nudges Publish

- `loadDashboardOverview` and `/api/dashboard/catalogues` return a per-catalogue draft
  summary (`itemCount`, `draftUpdatedAt`, `unpublished`) computed in SQL from
  `catalogue_drafts` joined to `catalogues`.
- `DashboardItem`: item count, last saved, `Unpublished changes` / `Not published yet`
  badge, Publish as the primary button, "Finish your catalogue" for an empty draft.
- `Overview`: a banner when the user has catalogues but none published.

### T7 — QT-09 Capture acquisition source

**Migration** `supabase/migrations/20261119130000_user_acquisition_tracking.sql`:
`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`,
`referrer_domain`, `landing_path`, `first_seen_at`, `self_reported_source` on
`public.users`, length checks, column grants to `app_user`; the self-reported answer
moves to `self_reported_source` and `acquisition_source` becomes the derived channel;
view `public.acquisition_funnel` (channel → signups → published → paying, by month),
`security_invoker`, readable by `postgres`/`service_role` only.

**App**
- `src/lib/analytics/first-touch.ts` + `FirstTouch` client component in the root layout:
  records once, cookie when analytics consent is not declined, `sessionStorage` when it
  is (promoted to a session cookie on `/auth`).
- `src/lib/users/acquisition.ts`: `deriveChannel(firstTouch)` with the action plan's
  mapping, and `recordFirstTouch(me, raw)` writing the columns where `first_seen_at is
  null`.
- Called from `/auth/callback` and `confirmEmailToken`, which then clear the cookie.
- `saveAcquisitionSource` writes `self_reported_source` and no longer overwrites the
  tracked channel.
- `UserContext` calls `posthog.identify(userData.id)`.
- Catalogue footer links carry
  `?utm_source=catalogue&utm_medium=referral&utm_campaign=badge`.

**Backfill** `scripts/supabase/backfill-acquisition.ts` — PostHog persons
(`$initial_utm_source`, `$initial_referring_domain`) through the same mapping, dry run by
default.

### T8 — QT-10 FAQ answers in server HTML

`FaqAccordion` renders every answer in the HTML (`hidden` only when JS is available is
not expressible, so the panel is always present and collapsed with CSS `grid-template-
rows` instead of the `hidden` attribute). `FAQPage` JSON-LD added to `/pricing` and `/`.

### T9 — QT-11 Use catalogue everywhere

UI copy, dialog titles, page titles, meta titles/descriptions, email templates, toasts
and plan/feature strings move to "catalogue". Article bodies, article slugs and the
keyword lists that deliberately carry the US spelling stay. A unit test asserts no
"catalog" outside "catalogue" in `src/constants/metadata.ts`, `src/components/emails`
and the dialog/toast strings.

## 4. Verification

- `npx tsc --noEmit`, `npm run check`, `npm test` after every task.
- New unit tests: draft save/conflict logic, autosave debounce and gating on `aiReview`,
  acquisition channel derivation, server price shaping, draft summary SQL shaping,
  spelling test.
- Not run here: the migrations against TEST, the Redis→Postgres draft migration script,
  the PostHog backfill, and any browser check. All are operator steps.

## 5. Follow-ups (not in this plan)

- Apply both migrations to TEST, then PROD.
- `drizzle-kit pull` in `@quicktalog/common` + release; move the raw SQL in
  `draft-store.ts` and `acquisition.ts` onto the generated schema.
- Run `scripts/redis/migrate-drafts-to-db.ts`, then delete the Redis draft keys.
- Delete the test catalogue `claude-test-bistro` on PROD (action plan, open items).

## 6. What shipped, and where it differs from §3

Code complete 2026-11-19. Three things ended up different from the plan above:

1. **The leave warning is armed only while a save is failing** (`retrying` or
   `conflict`), not on every unsaved second. Autosave flushes a pending edit on unmount
   as well as on `pagehide`, so an in-app link no longer loses the debounce; and warning
   on every edit would leave a spare history entry behind, which is what
   `NavigationGuard` does when it goes from dirty to clean.
2. **The exit flush prefers `sendBeacon`** and falls back to `fetch(keepalive)`. Both cap
   the body at 64 KiB, so a long catalogue falls through to an ordinary request that may
   not outlive the page — acceptable, because the 1.5s debounce has almost always saved
   by then.
3. **The FAQ collapses with CSS grid rows rather than the `hidden` attribute**, and every
   question is rendered even past "Load more". That is what puts the answers in the HTML
   a text fetcher reads; `hidden` is what made them disappear from the page fetch in the
   first place.

Verified in a production build (`npx next build`) rather than only by test:

| Claim | Evidence |
|---|---|
| Prices are in the HTML | `.next/server/app/pricing.html` contains `$5`, `$12`, `$30`, `$60` and zero "Price loading"; `/pricing` is ISR with a 1h revalidate |
| The offers are real | 5 `"@type":"Offer"` entries with prices 0, 5, 12, 30, 60 |
| FAQ answers are in the HTML | 7 `role="region"` panels on `/pricing`, each with its answer text, plus one `FAQPage` block |
| `/demo` shows product content | `.next/server/app/demo.html` contains the sample catalogue (sections, items, prices) |
| One spelling | the only "catalog" left in `index.html` is the `keywords` meta tag |

`npx tsc --noEmit`, `npx tsc --noEmit -p tsconfig.scripts.json`, `npm run check` and
`npm test` (99 files, 901 tests) all pass. The one `npm run check` warning,
`src/context/MainContext.tsx:33`, is pre-existing and untouched.

### Deploy order

**The migrations go first, then the app.** The builder reads `catalogue_drafts` in the
same statement as the catalogue, so a deploy that lands before `20261119120000` would
404 every builder page. The signed-in user query is deliberately not like that - it
reads `self_reported_source` through `to_jsonb`, so a missing column is a null rather
than a dead dashboard - but the builder has no such fallback, and nor should it: a
draft store that silently answers "no draft" would lose work.

**Not done here, and all of it is an operator step:** applying the two migrations (TEST,
then PROD), `scripts/redis/migrate-drafts-to-db.ts`, `scripts/supabase/backfill-acquisition.ts`,
the `drizzle-kit pull` + `@quicktalog/common` release that retires the raw SQL, renaming
the Paddle products (they live in the Paddle dashboard, not in this repo), and a browser
check of the builder, the dashboard and `/demo`.
