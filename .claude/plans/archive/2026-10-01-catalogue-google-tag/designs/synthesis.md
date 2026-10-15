# How a customer adds their Google tag / GA4: synthesized design

Status: proposed (judge's synthesis of the three 2026-10-01 designs). Written 2026-10-01.

It answers the founder's question "How the google tag and analytics will be added". It explains, end to end, how a Quicktalog owner connects their own Google Analytics 4 (GA4) property to a published catalogue and what that catalogue's visitors experience.

**Inputs**
- The three designs, read in full: `ship-fast.md` (**SF**), `security-first.md` (**SecF**) and `customer-value.md` (**CV**).
- The five notes in `../research/`, also read in full.
- My own re-checks today:
  - code reads in all three repos on `test` HEAD `d785bb8`, `quicktalog-packages` `7a2ca85` (1.66.0) and `quicktalog-backend`;
  - two read-only SELECTs on TEST (`imhinsgyzzyblghwnedk`);
  - read-only `git` ancestry checks;
  - live fetches of three Google pages.
- PROD was not queried. Nothing in the repos was changed. Appendix B lists every check.

**Labels**
- **Fact**: read in code (repo-relative `file:line`; other repos prefixed `quicktalog-packages/` or `quicktalog-backend/`), returned by a TEST query, or stated on a cited page.
- **Inference**: my reasoning.
- **Decision**: what this design chooses.
- **(snippet)**: taken from a search-result excerpt only.
- **(probe)**: a headless-Chromium result recorded in a research note.
- **Provenance tags** say where an idea came from: [SF], [SecF], [CV], or [J] for something new in this synthesis.

---

## 0. The answer on one page

### What the owner does (about two minutes)
1. **Open the setting.** It is a **Google Analytics** card on the catalogue's **Analytics** page, `/admin/<slug>/analytics`, below the built-in numbers [SF, SecF, CV].
   - The builder's General tab has a one-line pointer that opens it in a new tab [SecF, CV].
2. **Paste the Measurement ID** (`G-XXXXXXXXXX`) and press **Save**.
   - Pasting Google's whole snippet also works: the browser picks out the single `G-` ID, and refuses outright if the snippet contains a `GTM-` container [all three].
3. **The server checks it.** It verifies identity, the plan and a strict anchored pattern, then writes `catalogues.integrations` and revalidates the catalogue.
   - **Active catalogue:** live on the next request.
   - **Draft:** live from its first publish.
   - There is no Publish step for this setting [all three].
4. **The card shows a status and a preview.**
   - Status: *Not connected*, *Connected*, *Saved, starts when you publish*, or *Needs your business name*.
   - A static preview of the notice visitors will see [SecF, CV].
   - Test steps [SF, CV] and an honest "why Google shows fewer visits" note [all three].
5. **Wrong IDs are refused with guidance:**
   - `GTM-` containers, `GT-` Google tag IDs, `AW-` Google Ads IDs, `UA-` IDs, and Meta Pixel digits [all three].

### What a visitor gets
1. **Nothing changes at first.** The menu renders exactly as today, and no request goes to Google.
2. **A notice appears**, but only if the catalogue has a valid ID **and** a business name.
   - It is a small, non-blocking bottom sheet in the catalogue's language, naming the business and Google.
   - **Reject** and **Accept** have equal weight, with **Details** beside them.
   - Scrolling past it without answering collapses it to a "Privacy choices" pill. Nothing is stored and nothing loads [SecF, CV].
3. **On Accept**, Quicktalog's own bundled code runs, with no inline script and nothing owner-supplied [all three]. In order, it:
   - pushes a tag-type blocklist (gated on the probe in §15) [SecF];
   - sets Consent Mode v2: everything denied, then analytics granted;
   - turns ad signals off;
   - scopes cookies to this one catalogue;
   - only then injects `gtag.js?id=G-…&l=qtDataLayer`.
4. **On Reject, or with no answer**, there are zero requests to Google, ever. The choice is kept on the device for that catalogue for 6 months.
5. **Changing your mind.** A "Privacy choices" link after the footer reopens the notice at any time. Withdrawing consent denies, stops GA, deletes the cookies and reloads the page [SecF].
6. **Where the tag never runs:**
   - the owner preview, the builder, `/admin`, and framed copies;
   - documents that arrived by client-side navigation;
   - browsers holding a Quicktalog session. These see a small "paused while you're signed in" note [SF guards; SecF and CV note]. If a session appears later, the tag stops and the page reloads [SecF].

### What lands in the owner's GA4 with no setup
- `page_view` plus GA4's Enhanced Measurement: scrolls, outbound clicks, and site search once the search URL is debounced.
- `view_item` when an item is opened, which fills "Items viewed" [SecF, CV].
- `generate_lead` with `lead_source` for phone, email, WhatsApp, Viber, SMS, Messenger and Telegram taps and for newsletter sign-ups [CV].
- `book_appointment` and `get_directions` from booking-provider and map links [CV].

### What Quicktalog changes about its own tools on published catalogues
- **Off:** its GTM container (GA4 and Hotjar) and Microsoft Clarity [all three], and Sentry Replay [all three].
- **Fixed:** the site cookie banner's path check [SecF, CV].
- **Cookieless:** PostHog switches to cookieless counting on published catalogue pages, gated on a TEST check that the traffic meter is unchanged [SecF, CV]. It is not a blocker for the GA slice [SF].

### Refused while catalogues share `www.quicktalog.app` with the signed-in builder
- `GTM-` containers and free-form head code, until public catalogues move to a separate registrable domain [all three].
- `GT-` IDs, until a probe shows they are restricted like `G-` [all three].
- Native `AW-` and Meta Pixel are later phases.

### Launch gates
1. The Phase 0 security probe with a real GA4 property (§15, R1-R2) [SecF, CV].
2. The PROD migration order (§2).
3. Before general availability, beyond the beta:
   - a server-side consent log;
   - counsel's sign-off on the notice, the processor terms and the cookie lifetime;
   - notice translations for the languages EU catalogues actually use [SecF, CV].

### How the three designs scored (detail in Appendix C)

| Design | Overall | Why |
|---|---|---|
| Ship-fast | **7.9** | Most correct and cheapest. It caught the `LimitsOverlay` trap and has the most robust exit guard. Its gaps are additive: no consent log, a soft legal-name check, thin events, and PostHog left unchanged |
| Customer-value | **7.8** | By far the most owner value (events, attribution, guided setup, Basic+). But its `/catalogues`-wide cookie path weakens tenant isolation, its scope is large, and it reuses `LockedGroup` |
| Security-first | **7.5** | Strongest hardening and legal posture. But the separate root layout as a launch gate is costly and unproven, its flags-store kill switch would add an uncached fetch to the ISR page, and it reuses `LockedGroup` |

**Base:** this synthesis starts from **ship-fast**. It grafts security-first's hardening and legal gates and customer-value's owner value, and reverses two structural choices (the cookie path and the root-layout gate).

---

## Conflicts resolved, with provenance

| # | Question | SF | SecF | CV | **Decision** | Why |
|---|---|---|---|---|---|---|
| C1 | Mount structure | Sibling + guards | Separate root layout as a launch gate | Sibling + guards; root layout in Phase 4 | **Sibling in the published page + guards now; separate root layout in Phase 4** [SF, CV] | Option C moves the whole app under a route group and needs not-found and global-error rework (`../research/code-render-path.md` §9.4), unproven by any build. Session cookies stay script-readable on the catalogue document either way (`src/lib/auth/cookie-options.ts:8-21`), so the session guard is the control that matters. Guards are needed even under C for catalogue-to-catalogue soft navigation |
| C2 | Cookie scope | Per catalogue | Per catalogue | Per measurement ID, path `/catalogues` | **Per catalogue**: prefix from the catalogue id, path `/catalogues/<slug>` [SF, SecF] | With path `/catalogues` every tenant's `qt_<id>_ga` cookie is readable through `document.cookie` on every other catalogue. A tenant container with the Google-provided First Party Cookie variable could then learn which catalogues a visitor has opened (inference from RFC 6265 path matching and the restrict doc, §6). The cost, separate users per catalogue for one business, is accepted and documented |
| C3 | Prefix | `qt` + 8 hex | `qt_` + 12 hex | `qt_<measurement id>` | **`qt_` + first 12 hex of the catalogue UUID** [SecF] | Immutable, and survives slug reuse after deletion |
| C4 | Plan tier | Pro+ | Pro+ | Basic+ | **Recommend Basic+; founder decides.** The code is identical either way [CV] | The business name is a precondition, and only plans with `branding` can set it (`src/components/catalogue/inputs/sidebar/FooterTab.tsx:15`, `:76-82`; Basic has `branding: true`, `quicktalog-packages/src/constants/pricing.ts:56`). With Basic+ only paid-to-free removes the feature |
| C5 | Downgrade | Clear | Clear | Pause and resume | **Clear in both webhook branches + revalidate; list in the cancellation email** [SF, SecF] | No extra CHECK key or render branch. Re-pasting a 12-character ID is cheap |
| C6 | Business-name requirement | Soft warning | Hard block at save time | Hard gate at render time | **Render-time gate + card status; no save-time block** [CV] | Legal fields change through publish, so a save-time check goes stale. A render gate always matches what visitors see |
| C7 | Advertising purpose | None in v1 | Owner checkbox | Owner switch | **None in v1: ad consent denied and ad signals forced off. The owner switch is Phase 2** [SF now; SecF/CV design later] | It doubles the legal surface. GA4 alone answers the question |
| C8 | Event mechanism and set | Contact taps only | Context + moderate set | DOM event bus + rich set | **React Context for item and newsletter events [SecF], a capture-listener link classifier [SF, CV], and CV's core set** (view_item, generate_lead + lead_source, book_appointment, get_directions) | Context is the project convention (`.claude/skills/code-conventions/SKILL.md`, "State: React Context"). The remaining custom events are Phase 2 |
| C9 | Search URL | Debounce | Stop mirroring + sanitized search event | Debounce + search event | **Debounce at 800 ms, ignore echoes, skip the URL write for text that looks like an email or phone number; no separate `search` event** [SF + CV's PII filter] | GA's own `view_search_results` fills the site-search report; a second event would double-count |
| C10 | PostHog | Unchanged | Cookieless | Cookieless | **Cookieless on published catalogue documents in Phase 0, gated on a TEST meter check; not a blocker** [SecF, CV; SF's decoupling] | Pageviews drive the meter and keep flowing ([PostHog](https://posthog.com/tutorials/cookieless-tracking)) |
| C11 | Consent log | None | Phase 2, public insert policy + `/api/consent` | Phase 1, private SECURITY DEFINER function | **Before general availability (Phase 1b), through the newsletter-style private function** [CV implementation; SecF timing] | It matches `src/actions/newsletter.ts:26-57` exactly |
| C12 | Privacy notice | Details layer | In-page generated sheet | New `/catalogues/[name]/privacy` route | **In-page generated "Details" sheet** [SecF] | A new route would pass the worker's `LIKE '%/catalogues/%'` filter and count toward the meter (`quicktalog-backend/src/utils/analytics.ts:18`) |
| C13 | Notice languages | EN, SR Latin, SR Cyrillic | 19 | 32 | **EN + SR Latin + SR Cyrillic for the beta; then the languages PROD catalogues actually use, each native-reviewed** [SF + data-driven] | It is legal text. Counsel decides whether an English fallback is acceptable at general availability |
| C14 | Kill switch | Env var + redeploy | Global Config via `src/lib/ops/flags.ts` | Env var + allowlist | **Env var read at render + redeploy + purge; beta allowlist for the card** [SF, CV] | `@vercel/global-config` 1.5.1 fetches with `cache: "no-store"` (`node_modules/@vercel/global-config/dist/index.js:197-200`, `:220`). Reading it inside the ISR page risks dynamic rendering [J] |
| C15 | Cookie lifetime | Google's 2-year default | 13 months | 13 months, not extended | **13 months with `cookie_update: false`** [CV]; counsel may change it | Conservative and disclosable as "up to 13 months" |
| C16 | ID pattern | `^G-[A-Z0-9]{4,15}$` | Same, in the shared package | `{6,20}` | **`^G-[A-Z0-9]{4,15}$` from one constant in `@quicktalog/common`, plus a test that compares it with the migration** [SF, SecF] | Re-verified as a CHECK today over 21 samples (Appendix B) |
| C17 | Withdrawal | In place | Deny + delete + reload | In place | **Deny, `ga-disable`, delete the cookies, reload** [SecF] | A loaded gtag.js cannot be unloaded. Reloading guarantees no Google code remains |
| C18 | `gtm.blocklist` | No | Yes (unverified) | No | **Yes, gated on probe item (b)** [SecF] | Google says data-layer lists "override any and all configuration in the container" ([Google](https://developers.google.com/tag-platform/tag-manager/restrict), fetched today) |
| C19 | Session watcher | No | Yes | No | **Yes** [SecF] | Covers a session that appears after the tag loaded |
| C20 | Lock UI on the Analytics page | Plain locked state | `LockedGroup` | `LockedGroup` | **Plain locked state with a link** [SF] | `LimitsOverlay` saves whatever `CatalogueContext` holds before opening `/pricing` (`src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:17`, `:26-36`) |
| C21 | Exit-guard placement | `window` capture + `stopImmediatePropagation` | Plain `<a>` in the separate layout | `document` capture | **`window` capture** [SF] | It runs before any `document` listener, React's root included |
| C22 | Dashboard links into catalogues | Unchanged | Full loads through the separate layout | Plain `<a>` | **Unchanged** [SF] | Plain `<a>` would add owners' own views to the PostHog meter, which counts hard loads only (`../research/code-render-path.md` §5, inference there). The landing guard already covers the entry [J] |
| C23 | "Found at Google" tag check | No | No | Yes | **Phase 2, optional** [CV] | Relies on an undocumented container format (CV risk 4) |
| C24 | Event routing | `send_to: id` | Group `qt_tenant` | `send_to: id` | **`send_to: <measurement id>`** [SF, CV] | Simplest, with a private data layer and a single config |

### Corrections found while judging [J]
1. **Kill switch.** SecF's `catalogueTagsEnabled()` via `src/lib/ops/flags.ts` would call `@vercel/global-config`, whose client defaults to `cache: "no-store"` (`node_modules/@vercel/global-config/dist/index.js:197-200`, `:220`, `:610-613`). In the App Router a `no-store` fetch during render makes the route dynamic ([Next.js 15 fetch](https://nextjs.org/docs/15/app/api-reference/functions/fetch)), which would silently end ISR for every catalogue. A build check is required before any flags-store read in the published page.
2. **Revalidation runbook.** `revalidateCatalogue()` without a name touches only `/catalogues` and `catalogues-list` (`src/lib/cache/revalidate.ts:9-10`). A purge must pass at least one name, which revalidates the shared `catalogue-detail` tag that every catalogue page fetch carries (`:15`; `src/app/catalogues/[name]/page.tsx:120`).
3. **Session-cookie detection.** All three designs match `sb-[a-z0-9]+-auth-token`. But `sessionCookieName()` falls back to `sb-auth-token` and uses the first host label, which may contain hyphens (`src/lib/auth/cookie-options.ts:24-33`). The guard below derives the exact name from that helper and adds a broad pattern.
4. **Notice placement.** The catalogue root sets its font, radius and shadow variables inline (`src/components/catalogue/view/Catalogue.tsx:188-203`). Custom themes are a global class rule (`src/lib/themes/custom-theme.ts:232`). So the notice is portalled into `.catalogue-root` rather than wrapped in a theme class (SF's wrapper would lose the inline variables).
5. **Paid-to-paid plan changes.** `SubscriptionUpdated` is processed but never updates `users.plan_id`; only Activated, Trialing and Resumed do (`src/utils/paddle/process-webhook.ts:58-64`, `:131-155`). Plan switches therefore reach this feature only through a new activation, which is why clearing goes in the activation branch too (pre-existing; SF R10 confirmed).

---

## 1. Owner UX

### 1.1 Where it lives (Decision) [SF, SecF, CV]
- **The Analytics page card.**
  - **Fact.** The page is server-rendered and `force-dynamic`, and already proves ownership inside one `withUser` block before anything renders (`src/app/admin/[name]/analytics/page.tsx:19`, `:25-34`).
  - **Fact.** `ownsCatalogue` does not check status, so draft catalogues work (`src/lib/catalogue/ownership.ts:19-41`).
- **Not a builder tab.**
  - **Fact.** The tab bar is four equal columns sized for 360 px (`src/components/catalogue/inputs/sidebar/index.tsx:28-33`, `:128`).
  - **Inference.** Every other builder field is draft-then-publish, so an immediately saved field there would mislead.
- **A General-tab pointer [SecF, CV].**
  - A last `PanelSection`, "Analytics & tracking", shows "Connected: G-…" or "Not connected".
  - Its button opens the Analytics page in a new tab, so unsaved builder edits survive.
  - It is the first item to cut.

### 1.2 The card
**Wireframe** (connected state):
```
Google Analytics                                                    ● Connected
See where visitors come from and what they open, in your own Google Analytics 4.

Measurement ID  [ G-PSW1MY7HB4              ]  [Save]   Remove
Saving applies to your published catalogue right away. You don't need to publish again.

▸ Preview the notice your visitors see        ▸ Check that it works
▸ Why Google shows fewer visits               ▸ I don't have a Measurement ID yet
```

**The field**
- **Label:** Measurement ID. **Placeholder:** `G-XXXXXXXXXX`.
- **Help text:** "In Google Analytics: Admin → Data streams → your web stream. The Measurement ID starts with G-. You can also paste Google's whole tag code; we'll take the ID from it." Google documents the format and location ([Google](https://support.google.com/analytics/answer/12270356)).
- **Silent normalization:** trim, upper-case, and turn typographic dashes into `-` [CV]. Non-ASCII characters are refused [SecF].

**Validation messages.** The same pure functions run in the form (for hints) and in the action (as the authority); see §3.1.

| Input | Message |
|---|---|
| Empty, on Save | Remove flow ("Google Analytics removed. Your catalogue stops loading it within a minute.") |
| `GTM-…`, alone or anywhere in a snippet | "This is Google Tag Manager. Tag Manager isn't supported on Quicktalog catalogues, because a container can run any code on your page. Paste your Google Analytics Measurement ID (G-…) instead." |
| `GT-…` | "This is a Google tag ID. Paste the Measurement ID of your GA4 web stream; it starts with G-." |
| `AW-…` | "This is a Google Ads ID. Paste your GA4 Measurement ID here, and link Google Analytics to Google Ads to measure ads." |
| `UA-…` | "This is an old Universal Analytics ID, which Google no longer processes. Create a GA4 property and paste its G- Measurement ID." |
| 8-20 digits | "This looks like a Meta Pixel ID. This field takes your GA4 Measurement ID (G-…)." |
| A snippet with one `G-` ID | Fills the field: "We found G-ABC123XYZ in what you pasted." |
| A snippet with several different `G-` IDs | "What you pasted contains more than one Measurement ID. Paste the one for this catalogue." |
| Anything else | "That doesn't look like a Measurement ID. It starts with G- followed by letters and numbers, like G-PSW1MY7HB4." |
| Server: plan | "Google Analytics is available on Basic and higher." (the tier the founder picks) |
| Server: rate limit | "Too many changes. Try again in an hour." |
| Server: other | "Couldn't save. Please try again." |

**Status line.** It is computed by one pure function, `trackingStatus()` (§3.4), on the server page and again from the action's result.

| Status | When | Copy |
|---|---|---|
| Not connected | No ID | "Not connected." |
| Connected | ID set, catalogue active, business name present | "Connected. Google Analytics loads on your published catalogue for visitors who accept. Quicktalog can't see whether Google receives the data; use 'Check that it works'." The status never claims "working" [SecF] |
| Saved, starts when you publish | ID set, catalogue draft or inactive | "Saved. It starts when you publish this catalogue." (`app_public` sees active rows only: `supabase/migrations/20260921181104_app_role_grants_policies.sql:82-84`) |
| Needs your business name | ID set, published row has no `legal.legalName` | "Visitors must be told who is asking. Add your business name in the builder (Footer → Business information) and publish." [CV] |
| Paused by Quicktalog | The kill switch is on (§4.6) | "Google Analytics is temporarily paused on all catalogues. Your ID is kept." [J] |

**Locked state.** Shown when the plan lacks `features.integrations.googleAnalytics`.
- Copy: "Google Analytics is available on Basic and higher. [See plans]".
- The field is dimmed and inert.
- `LimitsOverlay` is **not** used, because its button saves `CatalogueContext` (C20) [SF].
- **Remove** stays enabled, so a downgraded owner can always clear the ID [SF, SecF, CV].

**Notice preview** [SecF, CV]. The card renders the same `ConsentSheet` component in a static, side-effect-free preview mode, in the catalogue's language. No tag ever loads in `/admin`.

**"Check that it works"** [SF, CV]
1. Open a **private window**, or sign out. Google Analytics never runs while you are signed in to Quicktalog in that browser. That protects your account and keeps your own visits out of your reports.
2. Open `https://www.quicktalog.app/catalogues/<slug>?qt_debug=1` and tap **Accept**. The `qt_debug` flag marks only that visitor's hits as debug traffic, so they show in **Admin → DebugView** ([Google](https://support.google.com/analytics/answer/7201382)). Google: events are not visible in debug mode without analytics consent (same page).
3. Open an item and tap your phone link. Within seconds DebugView or **Reports → Realtime** shows `page_view`, `view_item` and `generate_lead`.
4. Tag Assistant also works, run from the private window. Its compatibility with the renamed data layer is a QA item (§13.4).
5. Afterwards, mark `generate_lead` (and `book_appointment`) as key events [CV].

**"Why Google shows fewer visits"** [all three]
- The copy: "Quicktalog counts every visit. Google Analytics only counts visitors who accept, usually half to two-thirds in Europe, and misses visitors with ad blockers."
- The figure comes from [Didomi](https://www.didomi.io/blog/benchmark-average-consent-rate-europe), vendor data: 55.7-67.6% opt-in of banners shown.
- The block also says:
  - "Your business is responsible for its Google Analytics data; mention it in your privacy policy."
  - "Google Ads conversions from visitors in Europe need an advertising choice in the notice; that is coming in a later update." (Google: ads measurement expects `ad_user_data`, [Google](https://support.google.com/analytics/answer/14275483).)

**"I don't have a Measurement ID yet"** [CV]. Static numbered steps:
1. Create a GA4 property.
2. Choose the business objective **Generate leads**. Where this option sits in Google's UI is taken from (snippet) [lovesdata](https://www.lovesdata.com/blog/google-analytics-lead-reports/).
3. Create a web stream with the catalogue URL (copy button).
4. Copy the Measurement ID.
5. Paste it here.

**Notice-language line** [SF, SecF]: "Notice language: Serbian (Cyrillic)", or "English, because your catalogue's language isn't translated yet."

### 1.3 Signed-in visitors on the public page [SecF, CV]
- **What they see.** A small dismissible note instead of the notice: "Google Analytics is paused while you're signed in to Quicktalog. Open this page in a private window to test it."
- **How it decides.** The note is client-only after hydration. It reads cookie presence, never a value or an identity, so the ISR rule holds (§10).

---

## 2. Data model and migration

### 2.1 Migration (`supabase migration new catalogue_integrations`) [SF; expression re-verified today]
```sql
-- Owner-chosen tracking IDs rendered on the published catalogue. IDs only: never markup, URLs,
-- snippets or secrets. Public: app_public reads it and /api/items/<slug> returns it.
alter table public.catalogues
  add column integrations jsonb not null default '{}'::jsonb;   -- constant default: no table rewrite

alter table public.catalogues
  add constraint catalogues_integrations_check check (
        jsonb_typeof(integrations) = 'object'
    and pg_catalog.pg_column_size(integrations) < 512
    and integrations - 'ga4MeasurementId' = '{}'::jsonb          -- key allowlist: a new vendor needs a migration
    and (not integrations ? 'ga4MeasurementId'
         or (jsonb_typeof(integrations->'ga4MeasurementId') = 'string'
             and integrations->>'ga4MeasurementId' ~ '^G-[A-Z0-9]{4,15}$'))  -- = GA4_MEASUREMENT_ID_SOURCE
  );

comment on column public.catalogues.integrations is
  'Tracking IDs rendered on the published catalogue, e.g. {"ga4MeasurementId":"G-XXXX"}. '
  'Written only by updateCatalogueIntegrations and plan downgrades. Public.';

-- Both privileges are column-level (20260921181104_app_role_grants_policies.sql:55-60).
-- Without these, every owner write and every public read fails with 42501.
grant update (integrations) on public.catalogues to app_user;
grant select (integrations) on public.catalogues to app_public;
```
**Facts (Appendix B, TEST, today)**
- The CHECK **accepts** exactly `{}`, `G-PSW1MY7HB4` and `G-TEST123`.
- It **rejects** 18 others, among them lowercase, `GTM-`, `GT-`, `AW-`, a script payload, a trailing newline, a leading space, fullwidth letters and a 3- or 16-character suffix.
- It also rejects a number, JSON null, a nested object, an array root, a scalar-null root, an extra `headCode` key, a `metaPixelId`-only object and the Phase 2 `advertising` key.

**Facts on grants**
- On TEST, `app_user` UPDATE and `app_public` SELECT on `catalogues` are column-level and name no tracking column.
- `app_user` holds table-level INSERT, SELECT and DELETE.
- There is no `integrations` column yet.

**Why the CHECK admits only `ga4MeasurementId` (Decision) [SF].** The database never admits a value no code renders. Phase 2 (`advertising`) and Phase 3 (`metaPixelId`) widen it by migration, and each needs a package release anyway.

### 2.2 pgTAP (`supabase/tests/database/10_catalogues.test.sql`, currently `plan(20)` at `:24`)
- An owner can update `integrations` on their own row; the same update on another owner's row affects 0 rows.
- `app_public` reads `integrations` on active rows only.
- The CHECK raises `23514` for `GTM-…`, an unknown key and a script payload.
- The existing grant assertions still pass.

### 2.3 Package (`quicktalog-packages`, one commit; the pre-commit hook bumps 1.66.0 to 1.67.0)

| File | Change |
|---|---|
| `src/drizzle/migrations/schema.ts` | `npx drizzle-kit pull` against TEST only. Never hand-edited; never `drizzle-kit push/generate/migrate` (`.claude/CLAUDE.md`) |
| `src/types/catalogue.ts:15-29` | `integrations: CatalogueIntegrations` in the `Update` map. Without it the column types as a required `unknown` (`src/types/functions.ts:1-3`) |
| `src/types/catalogue.ts` (new type) | `CatalogueIntegrations` (below) |
| `src/constants/catalogue.ts:3` | `integrations: {}` in `defaultCatalogueData`. It is typed `Omit<Catalogue,"id">`, so the build fails otherwise |
| `src/constants/integrations.ts` (new) | `GA4_MEASUREMENT_ID_SOURCE` and `GA4_MEASUREMENT_ID` [SecF] |
| `src/types/general.ts:25-46` | `integrations: { googleAnalytics: boolean }` in `PricingPlan.features`, documented as **not** the built-in dashboard (`analytics: string`, `:39`) |
| `src/constants/pricing.ts` | The flag on all six tiers (Starter `:6`, Basic `:39`, Pro `:71`, Growth `:103`, Premium `:135`, custom `:167`), values per §12 |

```ts
// quicktalog-packages/src/types/catalogue.ts
/**
 * Owner-entered tracking settings for the published catalogue. Public by construction:
 * the ISR page and /api/items/<slug> return it. IDs only - the DB CHECK refuses unknown keys.
 */
export type CatalogueIntegrations = {
  /** GA4 measurement ID, e.g. "G-PSW1MY7HB4". The only Google ID type accepted on the shared origin. */
  ga4MeasurementId?: string;
};

// quicktalog-packages/src/constants/integrations.ts
/** Must equal the regex in catalogues_integrations_check; a unit test compares the two. */
export const GA4_MEASUREMENT_ID_SOURCE = "^G-[A-Z0-9]{4,15}$";
export const GA4_MEASUREMENT_ID = new RegExp(GA4_MEASUREMENT_ID_SOURCE);
```

### 2.4 Release order (critical) [all three]
1. **Write and test locally.** Write the migration, then run `npm run test:db` and `supabase test db` (`docs/guides/drizzle.md:19-31`).
2. **Push to TEST:** `supabase db push`.
3. **Release the package.** In `../quicktalog-packages`: `drizzle-kit pull`, the package edits, commit, release. Then bump `@quicktalog/common` in the app.
4. **PROD:** apply the pending migrations in order, then this one, **before** deploying any app build that knows the column.
   - Drizzle's bare `select()` and `.returning()` list every schema column (`src/lib/catalogue/draft-cache.ts:26-31`), so builder load, save, publish and duplicate would fail with `42703`.
   - A missing `app_public` grant makes `/api/items/[name]` return 500 (`src/app/api/items/[name]/route.ts:26-35`). The page then renders the not-found modal, which ISR can keep for 24 h (`src/app/catalogues/[name]/page.tsx:11`, `:143-151`).
   - **Fact.** PROD lags TEST: it still renders legacy `category` blocks (`../research/code-write-path.md` §1, probe B3).

The backend pins `@quicktalog/common ^1.42.0` and reads only traffic limits, so it needs no change (`../research/code-write-path.md` §1).

---

## 3. Write path

### 3.1 Shared ID checks (pure: used by the form, the action and the render path) [SecF structure, CV normalization, SF extraction]
```ts
// src/lib/tracking/ids.ts
import { GA4_MEASUREMENT_ID } from "@quicktalog/common";

export type IdRefusal =
  | "empty" | "gtm" | "google_tag" | "google_ads" | "universal" | "meta_pixel" | "multiple" | "invalid";
export type IdCheck = { ok: true; id: string; extracted: boolean } | { ok: false; reason: IdRefusal };

const DASHES = /[‐-―−]/g; // typographic dashes and the minus sign -> "-"

/** The authority, on the server: one bare value, never markup. */
export function checkGa4Id(raw: unknown): IdCheck {
  if (typeof raw !== "string") return { ok: false, reason: "invalid" };
  const s = raw.trim().replace(DASHES, "-");
  if (!s) return { ok: false, reason: "empty" };
  // ASCII before upper-casing: "ſ".toUpperCase() is "S", and fullwidth letters must not slip through.
  if (s.length > 32 || !/^[\x21-\x7E]+$/.test(s)) return { ok: false, reason: "invalid" };
  const id = s.toUpperCase();
  if (id.startsWith("GTM-")) return { ok: false, reason: "gtm" };        // runs any code: refused on the shared origin
  if (id.startsWith("GT-")) return { ok: false, reason: "google_tag" };  // restriction unverified
  if (id.startsWith("AW-")) return { ok: false, reason: "google_ads" };
  if (id.startsWith("UA-")) return { ok: false, reason: "universal" };
  if (/^\d{8,20}$/.test(id)) return { ok: false, reason: "meta_pixel" };
  return GA4_MEASUREMENT_ID.test(id) ? { ok: true, id, extracted: false } : { ok: false, reason: "invalid" };
}

/** Browser-only convenience for a pasted Google snippet. The server never sees the snippet. */
export function idFromPaste(text: string): IdCheck {
  const sample = text.slice(0, 10_000);
  if (/\bGTM-[A-Z0-9]{4,}\b/i.test(sample)) return { ok: false, reason: "gtm" };  // never half-accept a container
  const ids = [...new Set(sample.toUpperCase().match(/\bG-[A-Z0-9]{4,15}\b/g) ?? [])];
  if (ids.length > 1) return { ok: false, reason: "multiple" };
  return ids.length === 1 ? { ok: true, id: ids[0], extracted: true } : checkGa4Id(sample);
}
```
- `\bG-` cannot match inside `GTM-…`, because there the `G` is followed by `T`. A standard gtag snippet repeats one ID twice, and the `Set` collapses it.
- Google's suggested pattern `[A-Z]{1,3}\w{5,}[\w]*` must not be used. It has no hyphen, so anchored it rejects every real ID, and unanchored it matches inside `GTM-…` (`../research/google-tag-docs.md` §2.2; [Google CMS guide](https://developers.google.com/tag-platform/devguides/gtag-integration)).
- `refusalMessage(reason: IdRefusal | "plan")` in `src/lib/tracking/messages.ts` returns the §1.2 copy, so the form and the action say the same thing [CV].

### 3.2 Input schema (`src/constants/schemas.ts`, next to `qrConfigSchema`) [SecF]
```ts
export const integrationsInputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("connect"), ga4MeasurementId: z.string().max(64) }).strict(),
  z.object({ action: z.literal("remove") }).strict(),
]);
```

### 3.3 Server-only helpers
```ts
// src/lib/catalogue/integrations.ts
import "server-only";
import { type CatalogueIntegrations, schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { Tx } from "@/utils/db";

const c = schema.catalogues;

/** Owner-scoped write. null = 0 rows (not the caller's, or no such name). */
export async function setOwnedIntegrations(tx: Tx, me: VerifiedIdentity, name: string, next: CatalogueIntegrations) {
  const [row] = await tx
    .update(c)
    .set({ integrations: next })
    .where(and(eq(c.name, name), eq(c.userId, me.userId)))   // explicit owner predicate
    .returning({ name: c.name, status: c.status, integrations: c.integrations, legal: c.legal });
  return row ?? null;
}

/** The card's initial state, read inside the Analytics page's existing withUser block. */
export async function readOwnedTrackingState(tx: Tx, me: VerifiedIdentity, name: string) {
  const [row] = await tx
    .select({ status: c.status, integrations: c.integrations, legal: c.legal, language: c.language })
    .from(c)
    .where(and(eq(c.name, name), eq(c.userId, me.userId)))
    .limit(1);
  return row ?? null;
}
```
```ts
// src/lib/entitlements/integrations.ts (pure, so the card can use it too)
import type { PricingPlan } from "@quicktalog/common";
/** Fails closed for a tier without the key. Not features.analytics, which is the built-in dashboard tier. */
export const allowsGoogleAnalytics = (plan: PricingPlan | undefined) =>
  plan?.features?.integrations?.googleAnalytics === true;
```

### 3.4 The action [SF shape; skill rules from `.claude/skills/server-action-and-route/SKILL.md`]
```ts
// src/actions/integrations.ts - "use server", exports only this action
"use server";
import * as Sentry from "@sentry/nextjs";
import type { CatalogueIntegrations } from "@quicktalog/common";
import { integrationsInputSchema } from "@/constants/schemas";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { revalidateCatalogue } from "@/lib/cache/revalidate";
import { setOwnedIntegrations } from "@/lib/catalogue/integrations";
import { allowsGoogleAnalytics } from "@/lib/entitlements/integrations";
import { getPlanForUpdate } from "@/lib/entitlements/plan";
import { withinRateLimit } from "@/lib/rate-limit";
import { trackingBetaAllows } from "@/lib/tracking/beta";          // server-only; deleted at general availability
import { checkGa4Id } from "@/lib/tracking/ids";
import { refusalMessage } from "@/lib/tracking/messages";
import { trackingStatus } from "@/lib/tracking/status";
import type { IntegrationsResult } from "@/lib/tracking/types";
import { pgError, withUser } from "@/utils/db";

export async function updateCatalogueIntegrations(catalogue: string, input: unknown): Promise<IntegrationsResult> {
  try {
    const me = await getVerifiedIdentity();                                     // 1. identity first
    if (!me) return { success: false, error: "Unauthorized" };
    if (typeof catalogue !== "string" || catalogue.length > 200) return { success: false, error: "Catalogue not found" };

    const parsed = integrationsInputSchema.safeParse(input);                    // 2. trust nothing from the client
    if (!parsed.success) return { success: false, error: "Invalid request" };

    let next: CatalogueIntegrations = {};                                       // "remove" = {}
    if (parsed.data.action === "connect") {
      const id = checkGa4Id(parsed.data.ga4MeasurementId);
      if (!id.ok) return { success: false, error: refusalMessage(id.reason) };
      if (!trackingBetaAllows(me.userId)) return { success: false, error: "Google Analytics isn't available on your account yet." };
      next = { ga4MeasurementId: id.id };
    }

    // Redis before the block: each save purges every catalogue's `catalogue-detail` cache (revalidate.ts:15).
    if (!(await withinRateLimit("integrations", me.userId))) {
      return { success: false, error: "Too many changes. Try again in an hour." };
    }

    const out = await withUser(me, async (tx) => {                            // 3. one short block
      // Connecting needs the plan (users.plan_id + tiers, row locked). Removing is always allowed.
      if (next.ga4MeasurementId && !allowsGoogleAnalytics(await getPlanForUpdate(tx, me))) return "locked" as const;
      return setOwnedIntegrations(tx, me, catalogue, next);                     // 4. owner predicate + row check
    });
    if (out === "locked") return { success: false, error: refusalMessage("plan") };
    if (!out) return { success: false, error: "Catalogue not found" };

    revalidateCatalogue(out.name);                                              // 5. after the block, never inside
    return {
      success: true,
      data: { integrations: out.integrations as CatalogueIntegrations, status: trackingStatus(out) },
    };
  } catch (err) {
    const pg = pgError(err);
    if (pg?.code === "23514" && pg.constraint === "catalogues_integrations_check") {
      return { success: false, error: refusalMessage("invalid") };              // DB backstop: not a Sentry event
    }
    // Unlike upsertQrConfig (qr-configs.ts:55-57), a 42501 here cannot mean "someone else's row" (a plain
    // UPDATE on a foreign row returns 0 rows), so it is a missing column grant - a deploy bug for Sentry.
    Sentry.captureException(err, { tags: { op: "updateCatalogueIntegrations" } });
    console.error("Unexpected error while saving tracking settings:", err);
    return { success: false, error: "Couldn't save. Please try again." };
  }
}
```
```ts
// src/lib/tracking/status.ts (pure)
import type { CatalogueIntegrations } from "@quicktalog/common";
export type TrackingStatus = "not_connected" | "connected" | "waiting_for_publish" | "needs_business_name";
export function trackingStatus(row: { status: string; integrations: unknown; legal: { legalName?: string } | null }): TrackingStatus {
  if (!(row.integrations as CatalogueIntegrations | null)?.ga4MeasurementId) return "not_connected";
  if (row.status !== "active") return "waiting_for_publish";
  return row.legal?.legalName?.trim() ? "connected" : "needs_business_name";
}
```
`IntegrationsResult` lives in `src/lib/tracking/types.ts`, so the `"use server"` file exports only the action (`.claude/CLAUDE.md`).

### 3.5 Why the save is immediate, and how the column stays out of every other write [all three]

**Facts**
- Builder **Save** writes only the Redis draft (`src/actions/catalogue.ts:319-366`).
- **Publish** is refused once the month's traffic limit is reached (`src/lib/entitlements/plan.ts:67-79`), so an owner over the limit could not even *remove* a tag through Publish.
- `pickEditable` copies only `CATALOGUE_EDITABLE_FIELDS`, verbatim, on create, publish and duplicate (`src/utils/db/columns.ts:38-66`).
- **Precedent:** the immediate-save QR setting (`src/actions/qr-configs.ts:15-69`).

**Edits**

| File | Change |
|---|---|
| `src/utils/db/columns.ts:10-31` | Add `integrations` to `PUBLIC_CATALOGUE_COLUMNS` |
| `src/utils/db/columns.ts:38-53` | **Not** in `CATALOGUE_EDITABLE_FIELDS`, with a comment saying why. Create and duplicate therefore insert `{}`, and publish can never write it |
| `src/lib/catalogue/draft-cache.ts:61-71` | Add `integrations: row.integrations` to the server-owned overrides, so a stale Redis copy cannot shadow the saved value in the builder pointer |
| `src/lib/catalogue/draft-cache.ts:75-82` | Strip `integrations` in `writeOwnedDraft` |
| `src/lib/rate-limit.ts:8-19` | `integrations: { requests: 20, window: "1 h" }` |
| `src/actions/catalogue.ts` publish (`:437-445`) and re-activation (`:145-152`) | Optional belt and braces [SecF]: when the tier lacks the flag, also `set({ integrations: {} })` |

### 3.6 Downgrades [SF, SecF]
```ts
// src/lib/entitlements/catalogue.ts (server-only, beside applyPlanDowngrade)
/** Clears tracking the tier no longer includes; returns names to revalidate after commit. */
export async function clearUnentitledIntegrations(tx: Tx, userId: string, tier: Tier): Promise<string[]> {
  if (allowsGoogleAnalytics(tier)) return [];
  const rows = await tx.execute<{ name: string }>(sql`
    update public.catalogues set integrations = '{}'::jsonb
     where user_id = ${userId} and integrations <> '{}'::jsonb
    returning name`);
  return [...rows].map((row) => row.name);
}
```
- **Where it is called.** In **both** plan-changing webhook branches: activation and resume (`src/utils/paddle/process-webhook.ts:131-155`) and cancellation to Starter (`:157-187`).
- **After commit.** Revalidate each returned name. Today only deactivated catalogues are revalidated (`:213-215`), so a removed tag could otherwise keep serving for up to 24 h (`src/app/catalogues/[name]/page.tsx:11`).
- **Email.** The cancellation email lists catalogues whose Google Analytics was removed (`:216-222`) [SecF].
- **Why a separate function.** Keeping it out of `applyPlanDowngrade`'s return type leaves that function's callers stable [SF].
- **Why it runs even with Basic+.** The public page cannot check plans, because `app_public` never sees `user_id` (`src/utils/db/columns.ts:6-9`). Downgrades must change stored data.

### 3.7 Analytics page wiring
- **Read.** In `src/app/admin/[name]/analytics/page.tsx:29-31`, replace the `ownsCatalogue` check with `readOwnedTrackingState` in the same block. A null result is still `notFound()`; `listOwnedCatalogues` stays. PostHog is still called after the block closes.
- **Pass down.** Give `{ ga4MeasurementId, status: trackingStatus(row), businessName: row.legal?.legalName ?? null, language, paused: process.env.TENANT_TAGS_DISABLED === "true", beta: trackingBetaAllows(me.userId) }` to `CatalogueAnalytics` (`src/components/analytics/CatalogueAnalytics.tsx:24-73`).
- **Render.** It renders the new client `GoogleAnalyticsCard` under the traffic report. The card renders even when PostHog failed [CV].
- **Locked state.** It uses `useUserContext().userData.currentPlan`, which is derived server-side from `users.plan_id`. The action re-checks on every save [SF].

---

## 4. Render path

### 4.1 Where it mounts (Decision) [SF, CV]
**Facts**
- The preview renders the identical `<Catalogue item=… type="view" />` (`src/app/catalogues/[name]/preview/page.tsx:36` vs `src/app/catalogues/[name]/page.tsx:144`).
- `src/app/catalogues/[name]/` holds only `page.tsx`, `error.tsx` and `preview/`, so a `[name]/layout.tsx` would wrap the preview too.
- The root layout wraps every route (`src/app/layout.tsx:36-56`).

**Decision.** A sibling of `<Catalogue>` in the published page's active branch, wrapped in the events provider (§9.1):
```tsx
// src/app/catalogues/[name]/page.tsx - replaces :143-144 (the else branch is unchanged)
if (item.status === "active") {
  // Reading an env var at render is catalogue-independent and keeps the page ISR (no cookies, no identity).
  const tags = publicTagConfig(item, process.env.TENANT_TAGS_DISABLED !== "true");
  if (!tags) return <Catalogue item={item} type="view" />;
  return (
    <CatalogueEventsProvider>
      <Catalogue item={item} type="view" />
      <CatalogueTracking config={tags} />
    </CatalogueEventsProvider>
  );
}
```
- **The config travels as props.** They go through the RSC payload, the same escaped channel the whole row already uses (`../research/code-render-path.md` §2.4). Nothing is interpolated into script text.
- **An architecture test** asserts that `src/app/catalogues/[name]/page.tsx` is the only importer of `CatalogueTracking` and `CatalogueEventsProvider`. It is modelled on `tests/unit/architecture/db-boundaries.test.ts` [SF].

### 4.2 Server-side config (re-validates, derives the minimum, or returns null) [SecF, CV]
```ts
// src/lib/tracking/public-config.ts
import "server-only";
import { createHash } from "node:crypto";
import type { Catalogue } from "@quicktalog/common";
import { checkGa4Id } from "@/lib/tracking/ids";
import type { PublicTagConfig } from "@/lib/tracking/types";   // the type lives in a non-server module

/** Bump when the notice text changes: every visitor is asked again. */
export const NOTICE_VERSION = 1;

export function publicTagConfig(item: Catalogue, enabled: boolean): PublicTagConfig | null {
  if (!enabled || item.status !== "active") return null;
  const id = checkGa4Id(item.integrations?.ga4MeasurementId);         // never trust the stored value alone
  if (!id.ok) return null;
  const businessName = item.legal?.legalName?.trim().slice(0, 120);
  if (!businessName) return null;                                      // no identifiable controller: no notice, no tag
  return {
    catalogueId: item.id,                                              // immutable: cookie prefix and consent key
    slug: item.name,                                                   // cookie_path and the path guards
    ga4MeasurementId: id.id,
    businessName,                                                      // rendered as React text, never HTML
    businessAddress: item.legal?.address?.trim().slice(0, 300) || null,
    language: item.language,
    privacyPolicyUrl: httpsUrlOrNull(item.legal?.privacyPolicy),       // the AI schema treats it as text (navigation.ts:96)
    noticeVersion: NOTICE_VERSION,
    // Re-prompt when the purpose, vendor or controller changes (EDPB 05/2020 para 110). The ID itself is
    // not in the hash: a new property of the same business is not a new controller or purpose.
    vendorHash: createHash("sha256").update(`analytics:google|controller:${businessName}`).digest("hex").slice(0, 12),
  };
}

const httpsUrlOrNull = (v: unknown) =>
  typeof v === "string" && v.length <= 500 && /^https:\/\/[^\s"'<>]+$/.test(v.trim()) ? v.trim() : null;
```
```ts
// src/lib/tracking/types.ts - no server-only imports: shared by the server config, the action and the client
import type { CatalogueIntegrations } from "@quicktalog/common";
import type { TrackingStatus } from "@/lib/tracking/status";

export type PublicTagConfig = {
  catalogueId: string; slug: string; ga4MeasurementId: string;
  businessName: string; businessAddress: string | null; language: string;
  privacyPolicyUrl: string | null; noticeVersion: number; vendorHash: string;
};
export type IntegrationsResult =
  | { success: true; data: { integrations: CatalogueIntegrations; status: TrackingStatus } }
  | { success: false; error: string };
```

### 4.3 The client component (`src/components/catalogue/tracking/CatalogueTracking.tsx`)
```tsx
"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCatalogueEventsContext } from "@/context/CatalogueEventsContext";
import { readConsent, writeConsent } from "@/lib/tracking/consent-store";
import { installHardExitGuard } from "@/lib/tracking/exit-guard";
import { isGoogleTagLoaded, loadGoogleTag, toTenantEvent, withdrawGoogleTag } from "@/lib/tracking/google-tag";
import { blockReason, hasQuicktalogSession, watchForSession } from "@/lib/tracking/guards";
import { installLinkTapEvents } from "@/lib/tracking/link-events";
import type { PublicTagConfig } from "@/lib/tracking/types";
import { recordCatalogueConsent } from "@/actions/catalogue-consent";   // Phase 1b
// ConsentSheet, PrivacyChoicesLink, SignedInNote: sibling files in this folder.

type Phase = "off" | "signed-in" | "ask" | "decided";

export function CatalogueTracking({ config }: { config: PublicTagConfig }) {
  const { setSink } = useCatalogueEventsContext();
  const [phase, setPhase] = useState<Phase>("off");
  const [root, setRoot] = useState<HTMLElement | null>(null);

  function start() {
    if (!loadGoogleTag(config)) return;
    setSink(toTenantEvent);                 // item_view, newsletter -> GA4 events (section 9)
    installLinkTapEvents();                 // window capture, registered BEFORE the exit guard
    installHardExitGuard(config.slug);      // same-origin exits become full page loads
    watchForSession(config.ga4MeasurementId);
  }

  useEffect(() => {
    if (blockReason(config.slug)) return;                         // framed | wrong path | soft-navigated document
    // Inside the themed root: the font/radius variables are inline there (Catalogue.tsx:188-203).
    setRoot(document.querySelector<HTMLElement>(".catalogue-root"));
    if (hasQuicktalogSession()) return setPhase("signed-in");
    const stored = readConsent(config.catalogueId, config.noticeVersion, config.vendorHash);
    if (!stored) return setPhase("ask");
    if (stored.analytics) start();
    setPhase("decided");
  }, []); // once per document: the published page never re-renders with another config

  function decide(analytics: boolean) {
    const record = writeConsent(config.catalogueId, { v: config.noticeVersion, h: config.vendorHash, a: analytics });
    void recordCatalogueConsent({                                 // Phase 1b server action, fire-and-forget (section 5.6)
      catalogueId: config.catalogueId, choiceId: record.id, noticeVersion: config.noticeVersion,
      vendorHash: config.vendorHash, analytics, language: config.language,
    });
    if (analytics) start();
    else if (isGoogleTagLoaded()) return withdrawGoogleTag(config);   // deny, delete cookies, reload
    setPhase("decided");
  }

  if (!root || phase === "off") return null;
  if (phase === "signed-in") return createPortal(<SignedInNote />, root);
  return createPortal(
    <>
      {phase === "ask" && <ConsentSheet config={config} onDecide={decide} />}
      <PrivacyChoicesLink onOpen={() => setPhase("ask")} />
    </>,
    root,
  );
}
```

### 4.4 Guards [SF; SecF watcher; J cookie names]
```ts
// src/lib/tracking/guards.ts (browser only)
import { sessionCookieName } from "@/lib/auth/cookie-options";   // pure; type-only import of @supabase/ssr

const SUPABASE_ANY = /^sb-[a-z0-9-]+-auth-token(\.\d+)?$/;

/** A Quicktalog session exists in this browser (Supabase or Clerk). Presence only: no value is read. */
export function hasQuicktalogSession(cookie = document.cookie): boolean {
  const sb = sessionCookieName();                                   // exact name the auth clients use (cookie-options.ts:24-33)
  return cookie.split(";").some((pair) => {
    const [rawName, ...rest] = pair.split("=");
    const name = rawName?.trim() ?? "";
    if (!rest.join("=").trim()) return false;                       // an emptied cookie is not a session
    return name === sb || name.startsWith(`${sb}.`) || name === "sb-auth-token" || SUPABASE_ANY.test(name) ||
      name === "__session" || name.startsWith("__session_") ||      // Clerk (src/utils/supabase/session.ts:8-16);
      name === "__refresh" || name.startsWith("__refresh_");        // __client_uat is deliberately not matched
  });
}

export function blockReason(slug: string): "framed" | "wrong-path" | "soft-navigation" | null {
  if (window.top !== window.self) return "framed";                  // /showcases frames catalogues unsandboxed
  const home = `/catalogues/${slug}`;
  if (location.pathname.replace(/\/$/, "") !== home) return "wrong-path";
  const nav = performance.getEntriesByType?.("navigation")[0] as PerformanceNavigationTiming | undefined;
  if (nav && new URL(nav.name).pathname.replace(/\/$/, "") !== home) return "soft-navigation";
  return null;
}

/** A session that appears after the tag loaded (sign-in in another tab): stop sending and reload. */
export function watchForSession(id: string): void {
  const check = () => {
    if (!hasQuicktalogSession()) return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = true;
    location.reload();                                               // the guard then keeps the tag out
  };
  document.addEventListener("visibilitychange", check);
  window.addEventListener("focus", check);
  (window as { cookieStore?: EventTarget }).cookieStore?.addEventListener("change", check);
}
```

**What each guard covers**
- **Framing.** `/showcases` frames live catalogues same-origin with no sandbox. Below `lg` the frame is `pointer-events-none`, so a notice there could not even be tapped (`src/components/showcases/ShowcaseFrame.tsx:64-69`, `:65`).
- **Soft-navigated entries.** These come from the dashboard's `<Link href="/catalogues/…">` (`src/components/dashboard/overview/DashboardItem.tsx:151`).
- **Session presence.** The check reads cookie presence only, in the browser after hydration. It is consistent with "Public pages and ISR never read cookies or user identity" (`.claude/CLAUDE.md`), which is about server rendering and caches. The founder should confirm this reading (SecF).

### 4.5 The loader: consent first, no inline script [SF base; SecF blocklist; CV lifetime and debug]
```ts
// src/lib/tracking/google-tag.ts (imported only by the tracking client components)
import { GA4_MEASUREMENT_ID } from "@quicktalog/common";
import type { CatalogueEvent } from "@/context/CatalogueEventsContext";
import type { PublicTagConfig } from "@/lib/tracking/types";

const LAYER = "qtDataLayer";                               // private data layer, never window.dataLayer
const GTAG_SRC = "https://www.googletagmanager.com/gtag/js";
/** Issued by Google on request (CMS integration guide). Empty until issued; then attached everywhere. */
const DEVELOPER_ID = "";
/** 13 months from the first visit (cookie_update: false), disclosed in the notice. */
const COOKIE_MAX_AGE_S = 395 * 24 * 60 * 60;
/**
 * PROBE-GATED (section 15, R1 item b): variable types that read cookies, globals or DOM text, plus classes a
 * G- container may not run anyway. Removed if the probe shows it stops page_view.
 */
const BLOCKLIST = ["k", "j", "d", "jsm", "customScripts", "customPixels", "nonGoogleScripts", "nonGooglePixels", "nonGoogleIframes"];

declare global { interface Window { qtDataLayer?: unknown[] } }

let loadedId: string | null = null;
const disabled = (id: string) => (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] === true;

// gtag.js only processes Arguments objects; the same values pushed as an array are ignored (probe).
function qtag(..._args: unknown[]): void {
  // biome-ignore lint/style/noArguments: gtag.js requires the Arguments object itself
  (window[LAYER] ??= []).push(arguments);
}

/** Short, stable, never reused: from the immutable catalogue id, not the slug. */
export const cookiePrefix = (catalogueId: string) => `qt_${catalogueId.replace(/-/g, "").slice(0, 12)}`;

/** Basic consent mode: call only after the visitor accepted. Once per document. Order matters. */
export function loadGoogleTag(cfg: PublicTagConfig): boolean {
  if (loadedId || !GA4_MEASUREMENT_ID.test(cfg.ga4MeasurementId)) return false;   // re-validated at the sink
  loadedId = cfg.ga4MeasurementId;
  (window as unknown as Record<string, boolean>)[`ga-disable-${loadedId}`] = false;

  (window[LAYER] ??= []).push({ "gtm.blocklist": BLOCKLIST });                   // 0. before any tag can fire
  qtag("consent", "default", {                                                   // 1. everything denied first...
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied",
  });
  qtag("consent", "update", { analytics_storage: "granted" });                   //    ...then only what was accepted
  if (DEVELOPER_ID) qtag("set", `developer_id.${DEVELOPER_ID}`, true);
  qtag("set", "ads_data_redaction", true);
  qtag("set", "allow_google_signals", false);                                    // no ad features without ad consent
  qtag("set", "allow_ad_personalization_signals", false);
  qtag("set", {                                                                  // 2. page-wide, before any config
    cookie_prefix: cookiePrefix(cfg.catalogueId),                                //    qt_<12hex>_ga, qt_<12hex>_ga_<ID>
    cookie_domain: "none",                                                       //    host-only: www.quicktalog.app
    cookie_path: `/catalogues/${cfg.slug}`,                                      //    not visible to other catalogues
    cookie_flags: "SameSite=Lax;Secure",
    cookie_expires: COOKIE_MAX_AGE_S,
    cookie_update: false,
  });
  qtag("js", new Date());
  // 3. config sends page_view with the full URL (UTMs kept). debug_mode only when asked: false would not disable it.
  qtag("config", loadedId, new URLSearchParams(location.search).has("qt_debug") ? { debug_mode: true } : {});

  const script = document.createElement("script");                               // 4. only now Google's library
  script.async = true;
  script.src = `${GTAG_SRC}?id=${encodeURIComponent(loadedId)}&l=${LAYER}`;
  document.head.appendChild(script);
  return true;
}

export const isGoogleTagLoaded = () => loadedId !== null;

export function sendTenantEvent(name: string, params: Record<string, unknown> = {}): void {
  if (!loadedId || disabled(loadedId)) return;                                   // no consent, no tag: no event
  qtag("event", name, { ...params, send_to: loadedId, ...(DEVELOPER_ID ? { [`developer_id.${DEVELOPER_ID}`]: true } : {}) });
}

/** The sink CatalogueTracking registers for semantic events (section 9). */
export function toTenantEvent(e: CatalogueEvent): void {
  if (e.type === "newsletter_signup") return sendTenantEvent("generate_lead", { lead_source: "newsletter" });
  const { id, name, section, price } = e.item;
  sendTenantEvent("view_item", {
    currency: e.currency,
    ...(price === undefined ? {} : { value: price }),
    items: [{ item_id: id, item_name: name, ...(section ? { item_category: section } : {}), ...(price === undefined ? {} : { price }) }],
  });
}

/** Withdrawal: a loaded gtag.js cannot be unloaded, so stop it, delete this catalogue's cookies and reload. */
export function withdrawGoogleTag(cfg: PublicTagConfig): void {
  if (loadedId) {
    qtag("consent", "update", { analytics_storage: "denied" });
    (window as unknown as Record<string, boolean>)[`ga-disable-${loadedId}`] = true;
  }
  const prefix = cookiePrefix(cfg.catalogueId);
  for (const name of document.cookie.split(/;\s*/).map((pair) => pair.split("=")[0] ?? "")) {
    if (name.startsWith(`${prefix}_ga`)) document.cookie = `${name}=; Max-Age=0; Path=/catalogues/${cfg.slug}; Secure; SameSite=Lax`;
  }
  if (loadedId) location.reload();
}
```

**Facts behind each step**
| Step | Source |
|---|---|
| Consent default before `config` | [Google](https://developers.google.com/tag-platform/security/guides/consent) |
| Basic mode sends nothing before consent | [Google](https://developers.google.com/tag-platform/security/concepts/consent-mode) |
| `l=` renames the data layer | [Google](https://developers.google.com/tag-platform/devguides/datalayer) |
| Cookie parameters | [Google](https://developers.google.com/tag-platform/security/guides/customize-cookies), [GA4 config reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config) |
| `allow_google_signals`, `allow_ad_personalization_signals`, `ga-disable-<ID>` | [Google](https://developers.google.com/tag-platform/security/guides/privacy) |
| `ads_data_redaction` | [Google consent guide](https://developers.google.com/tag-platform/security/guides/consent) |
| Data-layer allowlist/blocklist "override any and all configuration in the container" | [Google](https://developers.google.com/tag-platform/tag-manager/restrict), fetched today |
| Arguments-only processing; `gcs=G101` for analytics-only consent; cookie names `<prefix>_ga` and `<prefix>_ga_<ID without "G-">` | Probes in `../research/google-tag-docs.md` §3.2 and §4.4-4.6, and `customer-value.md` App. A.2 |

**Not `@next/third-parties`.** Its `GoogleAnalytics` component:
- interpolates the ID into an inline script (`node_modules/@next/third-parties/dist/google/ga.js:30-37`);
- drops `&l=` when the data layer is renamed (zero hits, probe P5);
- emits no consent default;
- is deduplicated by `next/script`'s id/src cache (`node_modules/next/dist/client/script.js:71-75`) [all three].

**Why `set` and not `config` options for the cookie fields [SF].**
- Since 2026-08-20 Google tags are upgraded to Tag Manager containers, and new snippets have no `config`. Initialisation can use a `gtm init` trigger ([Google](https://support.google.com/tagmanager/answer/17079602), fetched today).
- Page-wide `set` commands queued before the library are the best chance of covering that case (inference).
- R2 makes it a QA gate.

### 4.6 Kill switch and beta [SF, CV; J correction]
- **Kill switch.** Set `TENANT_TAGS_DISABLED=true` in Vercel and redeploy, because Vercel applies environment-variable changes to new deployments only ([Vercel](https://vercel.com/docs/environment-variables), not re-fetched here).
  - Then `POST /api/revalidate` with `{"names":["<any active slug>"]}`. That revalidates the shared `catalogue-detail` tag, so every catalogue regenerates without the config (`src/app/api/revalidate/route.ts:52-58`; `src/lib/cache/revalidate.ts:15`). Next.js documents that revalidating the Data Cache invalidates the Full Route Cache for pages that used it ([Next.js caching](https://nextjs.org/docs/15/app/guides/caching), not re-fetched here).
  - IDs stay stored, and the card shows "Paused by Quicktalog".
- **Not the flags store.** A Global Config switch via `src/lib/ops/flags.ts` is allowed only after a production build proves that `/catalogues/[name]` still builds as ISR with the read in place (J correction 1).
- **Beta.** `src/lib/tracking/beta.ts` (server-only) reads `TRACKING_BETA_USER_IDS`. During the beta, the action refuses **connect** for others (remove always works) and the card shows "Coming soon". Delete the file at general availability.

### 4.7 Hard exits [SF]
**Fact.** The catalogue leaves through `next/link` to Quicktalog pages:
- the default legal links (`src/components/catalogue/view/components/LegalLinks.tsx:17-40`);
- relative owner URLs through `SmartLink` (`src/components/general/SmartLink.tsx:54-58`);
- the logo's `"/"` fallback (`src/components/catalogue/view/CatalogueHeader.tsx:157-160`);
- `/contact` (`src/components/catalogue/view/components/Contact.tsx:52-55`).

GA4's history listener reacts to `pushState`, `replaceState` and `popstate` ([Google](https://support.google.com/analytics/answer/9216061)).
```ts
// src/lib/tracking/exit-guard.ts - installed only after the tag loaded
export function installHardExitGuard(slug: string): () => void {
  const home = `/catalogues/${slug}`;
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;               // other sites, tel:, mailto: keep browser defaults
    if (url.pathname.replace(/\/$/, "") === home) return;     // same catalogue (?q=, #...)
    e.preventDefault();
    e.stopImmediatePropagation();                             // window capture runs before React's root listener
    location.assign(url.href);                                // full load: the tag dies with this document
  };
  window.addEventListener("click", onClick, { capture: true });
  return () => window.removeEventListener("click", onClick, { capture: true });
}
```
- Catalogue-to-catalogue links are exits too, so the next catalogue starts clean with its own consent.
- No programmatic navigation exists in the view except the search `replace` (`src/components/catalogue/view/CatalogueContent.tsx:94`). A future `router.push` there would bypass the guard (R9).

### 4.8 Search URL (Phase 0, S) [SF; CV's PII filter]
**Fact.** The search box calls `router.replace('?q=…')` on every change (`src/components/catalogue/view/CatalogueContent.tsx:88-95`). `q` is one of GA4's five default site-search keys ([Google](https://support.google.com/analytics/answer/9216061)).
```ts
// CatalogueContent.tsx:88-103 (sketch)
const lastWritten = useRef(urlQuery);
const timer = useRef<ReturnType<typeof setTimeout>>();
const looksPersonal = (s: string) => s.includes("@") || /\d{7,}/.test(s.replace(/[\s()+.-]/g, ""));

const handleQueryChange = (next: string) => {
  setQuery(next);
  clearTimeout(timer.current);
  timer.current = setTimeout(() => {
    const params = new URLSearchParams(window.location.search);
    if (next.trim() && !looksPersonal(next)) params.set("q", next);
    else params.delete("q");                                   // never put an email or phone number in page_location
    lastWritten.current = params.get("q") ?? "";
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : pathname, { scroll: false });
  }, 800);
};
// URL -> state sync ignores echoes of our own writes, so keystrokes typed after the timer fired survive.
useEffect(() => {
  if (urlQuery === lastWritten.current) return;
  setQuery((prev) => (prev === urlQuery ? prev : urlQuery));
}, [urlQuery]);
```
**Inference.** Each finished search becomes one `page_view` and one `view_search_results` in GA's site-search report, instead of one per keystroke.

---

## 5. Consent banner

### 5.1 Scope and mode (Decisions) [all three]
- **Per catalogue, keyed by the immutable catalogue id.**
  - Consent must be specific and name the controller, and one origin hosts many controllers (GDPR Art. 4(11); EDPB 05/2020 paras 64-65, [PDF](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf)).
  - Slugs can be reused after deletion; ids cannot.
- **Shown only when the catalogue has a valid ID and a business name.** That is decided at ISR time from catalogue data (§4.2). Catalogues without tags show no notice.
- **Shown to every visitor.**
  - An ISR page cannot vary by geography.
  - Region-scoped defaults only take effect once gtag.js has loaded, which basic mode prevents (`../research/google-tag-docs.md` §4.3).
  - Serbia's 2023 Law on Electronic Communications, Art. 160(4), requires consent anyway ([Paragraf](https://www.paragraf.rs/propisi/zakon-o-elektronskim-komunikacijama.html)).
- **Basic Consent Mode only. No Google request of any kind before Accept.**
  - EDPB Guidelines 2/2023 treat JavaScript-built requests as "gaining access" (paras 50-53, 63, [PDF](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf)).
  - Every shared-origin analogue that was inspected blocks scripts until consent (`../research/shared-domain-implementations.md` §5.7).
  - Google's CMS guide prefers advanced mode ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration)). That is a possible owner opt-in only after counsel review (Phase 4).

### 5.2 Phone UX [SF, SecF, CV]
- **A non-modal bottom sheet.** `role="region"` with a labelled heading. No backdrop, no scroll lock, no focus trap, so the menu stays usable. A cookie wall would not give freely given consent (EDPB 05/2020 paras 39-41).
- **Placement.**
  - Anchored to the bottom safe area, at most about 35% of a 390×844 viewport.
  - Its `z-index` sits below the item dialogs, so opening an item is never blocked.
  - While it is open, a spacer of its height keeps the footer reachable.
- **Buttons.**
  - **Reject** and **Accept** side by side, the same size, style and weight, at least 44 px tall.
  - **Details** expands inline.
  - Built with `CatalogueButton` (`src/components/catalogue/view/components/CatalogueButton.tsx`), never `ui/button`. Product styling must not reach the published catalogue (`.claude/skills/code-conventions/SKILL.md`).
  - Equal reject on the first layer: EDPB Cookie Banner Taskforce para 08 ([PDF](https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf)); [CNIL FAQ](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ) Q37-38.
- **No "×" close.** "Accept & close" is not valid consent (VG Hannover 10 A 5385/22, [voris](https://voris.wolterskluwer-online.de/browse/document/230df5cf-d76c-4561-9499-e44445a96f11)).
- **Ignoring it is a refusal** [SecF, CV]. After the visitor scrolls one screen without choosing, the sheet collapses to a "Privacy choices" pill. Nothing is stored and nothing loads, and the sheet returns on the next visit (CNIL FAQ Q19).
- **Withdrawal** [all three]. A "Privacy choices" link is portalled to the end of `.catalogue-root`, after the footer: a visible, standard place (taskforce para 33). It reopens the same layer, so withdrawal happens in the same interface (EDPB 05/2020 para 114).
- **Theme and motion.** Theme tokens come from the root, which works for standard and custom themes. Contrast is checked against WCAG AA in all 7 standard themes and in custom ones. `prefers-reduced-motion` is respected.

### 5.3 Copy (EN template; Serbian drafts from SF §6.3; native and counsel review required)
**First layer.** "**{business}** would like to use Google Analytics to measure visits to this page. If you accept, cookies are stored on your device and information about your visit and device is sent to Google, which may process it outside the EU, including in the USA. Google Analytics loads only if you accept. You can change your choice at any time under "Privacy choices" at the bottom of the page." **[Reject] [Accept] · Details**

**Details** (the in-page generated notice) [SecF]
- **Who is asking:** {legal name}{, address}.
- **Purpose:** visit statistics only; no advertising or ad personalisation.
- **Recipients:** Google Ireland Limited and Google LLC, as the business's service provider. Google describes GA as processing "on behalf of" customers: (snippet) [Google](https://support.google.com/analytics/answer/6004245).
- **Cookies:** `{prefix}_ga` and `{prefix}_ga_{stream}`, kept up to 13 months and used only on this catalogue's pages.
- **Your choice:** kept on this device for 6 months.
- **Hosting:** "This page is hosted by Quicktalog, which shows this choice for {business}." It also covers Quicktalog's own consent-free visit counting and security cookies, with a link to Quicktalog's privacy policy.
- **Your rights:** withdraw at any time, and complain to a supervisory authority.
- **Links:**
  - {business}'s privacy policy, shown only when it is an `https:` URL;
  - Google's "How Google uses information from sites that use our services". The URL is `https://policies.google.com/technologies/partner-sites`, not fetched here; verify it during implementation.

**Serbian.** SF's Latin and Cyrillic drafts (`ship-fast.md` §6.3), updated to "do 13 meseci" / "до 13 месеци".

**Copy location.** The dictionary lives in `src/constants/tracking-notice.ts`, because copy that isn't component logic belongs in `src/constants/` (code-conventions skill).

**Picking the language.**
1. The catalogue's `language` when copy exists for it: `srp` gives Cyrillic, `srp_latn` gives Latin (`src/lib/catalogue/items.ts:60-100`).
2. Otherwise the first supported `navigator.languages` entry.
3. Otherwise English.

The card tells the owner which language visitors get [SF, SecF].

### 5.4 Storage, expiry and re-prompting [all three]
```ts
// src/lib/tracking/consent-store.ts (browser only)
export type ConsentRecord = { v: number; h: string; a: boolean; t: string; id: string };
const key = (catalogueId: string) => `qt:consent:v1:${catalogueId}`;
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;      // about 6 months, for either answer (CNIL FAQ Q21)

export function readConsent(catalogueId: string, version: number, vendorHash: string): { analytics: boolean; id: string } | null {
  try {
    const raw = window.localStorage.getItem(key(catalogueId));
    if (!raw) return null;
    const r = JSON.parse(raw) as Partial<ConsentRecord>;
    if (r.v !== version || r.h !== vendorHash || typeof r.t !== "string") return null;   // copy or controller changed
    if (!(Date.now() - Date.parse(r.t) <= MAX_AGE_MS)) return null;                      // expired or unparsable
    return { analytics: r.a === true, id: typeof r.id === "string" ? r.id : "" };
  } catch {
    return null;                                                                         // blocked storage = "no answer yet"
  }
}

export function writeConsent(catalogueId: string, rec: Pick<ConsentRecord, "v" | "h" | "a">): ConsentRecord {
  const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  const full: ConsentRecord = { ...rec, t: new Date().toISOString(), id };
  try { window.localStorage.setItem(key(catalogueId), JSON.stringify(full)); } catch { /* this page view only */ }
  return full;
}
```
- **Exempt from consent.** A record of the visitor's choice is strictly necessary (taskforce para 30; CNIL Délibération 2020-091 art. 5).
- **Never sent with requests**, so the ISR and "no `Set-Cookie` on public paths" rules hold (`src/middleware.ts:28-33`, `:66-69`).
- **Safari.** ITP clears script-writable storage after 7 days without interaction ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)), so iPhone visitors are asked more often. This is accepted.
- **Weakness, accepted.** localStorage is readable from any path, so a container with the JavaScript Variable type could probe other catalogues' records. The blocklist removes `j` if the probe confirms it works [SecF].

### 5.5 Consent Mode flow

| Moment | What happens | Network |
|---|---|---|
| Load, no stored answer | Sheet shows; no `qtDataLayer` | None to Google |
| Accept | `writeConsent(true)` → blocklist → default (all denied) → update (`analytics_storage` granted) → `set` (developer id, redaction, signals off, cookie scope) → `js` → `config` → inject gtag.js | `page_view` with `gcs=G101` (probe) |
| Reject or ignore | `writeConsent(false)`, or nothing on ignore | None, ever, for that page view |
| Return visit, valid accept | Loads directly; no sheet | As on Accept |
| Return visit, valid reject | "Privacy choices" link only | None |
| Withdraw after accepting | Update denied → `ga-disable-<ID>` → delete `qt_<12hex>_ga*` at the catalogue path → reload | None after reload |
| Accept after rejecting | Loads in place | As on Accept |

### 5.6 Records of consent (Phase 1b, before general availability) [CV implementation; SecF timing]
**Why**
- Google's EU user consent policy requires the business to "retain records of consent" ([Google](https://www.google.com/about/company/user-consent-policy/)).
- EDPB 05/2020 para 108 says pointing to a correct configuration "would not be sufficient".
- The localStorage record lives on the visitor's device, so the business cannot produce it.

```sql
-- supabase/migrations/<ts>_catalogue_consent_events.sql (Phase 1b)
create table public.catalogue_consent_events (
  id             bigint generated always as identity primary key,
  catalogue_id   uuid not null references public.catalogues(id) on delete cascade,
  choice_id      text not null check (length(choice_id) between 8 and 64),  -- the device record's random id
  notice_version smallint not null check (notice_version between 1 and 1000),
  vendor_hash    text not null check (vendor_hash ~ '^[a-f0-9]{12}$'),
  analytics      boolean not null,
  language       text not null check (language ~ '^[a-z_]{2,12}$'),
  created_at     timestamptz not null default now()
);
create index catalogue_consent_events_catalogue_created_idx on public.catalogue_consent_events (catalogue_id, created_at desc);
alter table public.catalogue_consent_events enable row level security;
create policy catalogue_consent_events_select_owner on public.catalogue_consent_events for select to app_user
  using (catalogue_id in (select id from public.catalogues where user_id = (select private.current_user_id())));
grant select on public.catalogue_consent_events to app_user;
-- No IP, no cookie, no identity. app_public cannot insert directly; it executes this function only.
create function private.record_catalogue_consent(
  p_catalogue uuid, p_choice text, p_version smallint, p_hash text, p_analytics boolean, p_language text
) returns void language sql security definer set search_path = '' as $$
  insert into public.catalogue_consent_events (catalogue_id, choice_id, notice_version, vendor_hash, analytics, language)
  select c.id, p_choice, p_version, p_hash, p_analytics, p_language
    from public.catalogues c
   where c.id = p_catalogue and c.status = 'active' and c.integrations ? 'ga4MeasurementId';
$$;
revoke all on function private.record_catalogue_consent(uuid, text, smallint, text, boolean, text) from public;
grant execute on function private.record_catalogue_consent(uuid, text, smallint, text, boolean, text) to app_public;
-- Mirror the schema-usage grant used for private.subscribe_catalogue_newsletter.
```
```ts
// src/actions/catalogue-consent.ts - same shape as newsletterSignup (src/actions/newsletter.ts:26-57)
"use server";
export async function recordCatalogueConsent(input: unknown): Promise<void> {
  const parsed = catalogueConsentSchema.safeParse(input);   // uuid, short ids, enum-like language, boolean
  if (!parsed.success) return;
  try {
    // Redis first; the IP is only a rate-limit key and is never stored (src/lib/http/client-ip.ts:10-15).
    if (!(await withinRateLimit("catalogueConsent", await clientIp()))) return;   // generous: venue Wi-Fi shares an IP
    const d = parsed.data;
    await withPublic((tx) => tx.execute(sql`select private.record_catalogue_consent(
      ${d.catalogueId}::uuid, ${d.choiceId}, ${d.noticeVersion}::smallint, ${d.vendorHash}, ${d.analytics}, ${d.language})`));
  } catch (err) {
    Sentry.captureException(err, { level: "warning", tags: { op: "recordCatalogueConsent" } });
  }
}
```
- **Retention.** Set by counsel; a scheduled purge goes in the worker.
- **Owner value (Phase 2).** "Last 30 days: 64% of visitors allowed statistics" on the card, plus a CSV export [SecF, CV].

---

## 6. Cookie isolation

| Control | Value | Why |
|---|---|---|
| `cookie_prefix` | `qt_` + the first 12 hex digits of the catalogue UUID [SecF] | GA renames `_ga` to `<prefix>_ga` ([Google](https://developers.google.com/tag-platform/security/guides/customize-cookies)). From the immutable id, so a re-registered slug never inherits returning visitors' client ids |
| `cookie_path` | `/catalogues/<slug>` [SF, SecF] | RFC 6265 path matching: sent to the catalogue and its sub-paths only. Not sent to `/catalogues/<slug>-other`, and not listed in `document.cookie` there. Slugs match `^[a-z0-9]+(-[a-z0-9]+)*$` (`supabase/migrations/20260921181107_validate_after_audit.sql:12-14`), so they are safe in a cookie path |
| `cookie_domain` | `'none'` (host-only) | The default `'auto'` writes on `.quicktalog.app`, visible to `test.quicktalog.app` and shared with Quicktalog's `_ga` (probe, `../research/google-tag-docs.md` §3.2) |
| `cookie_flags` | `SameSite=Lax;Secure` | GA's default is not `Secure`, even on https (probe, same section) |
| `cookie_expires` + `cookie_update: false` | 13 months from the first visit [CV] | Disclosable maximum; counsel may change it |
| Data layer | `qtDataLayer` via `&l=`, module-scoped `qtag`, `send_to` on every event [all three] | Nothing pushed to `window.dataLayer` (`src/utils/cookies.ts:36-83`) ever reaches a tenant's queue |
| No Quicktalog Google tag in the document | GTM off published catalogues (§7) | Removes the first-visit shared client id and the page-global consent bleed (probes, `../research/code-render-path.md` §10.1-10.2) |

**Probe facts**
- Per-catalogue prefix + path + `cookie_domain:'none'` gave each catalogue its own client id.
- The standard snippet instead reused Quicktalog's `_ga` client id.
- Consent set on a separate data layer changed Quicktalog's own GA4 hits to `gcs=G100`.
- Sources: `../research/code-render-path.md` App. A; `../research/google-tag-docs.md` §3.2, §4.6.
- Only Chromium was probed, so Safari and Firefox are QA items.

**Why not per measurement ID (C2) [J].**
- CV's path `/catalogues` means `qt_<id>_ga` for *every* business is listed in `document.cookie` on every catalogue.
- Since the 2026-08-20 upgrade a `G-` container can use the Google-provided First Party Cookie variable (class `google`, [Google](https://developers.google.com/tag-platform/tag-manager/restrict)). One tenant could then learn which other catalogues a visitor has opened (inference).
- The per-catalogue path hides those cookies from other catalogues' `document.cookie`.
- **Cost, accepted:** one business's two catalogues count a visitor twice in one property. Revisit with the separate domain (§11), where tenants are separated by the browser.

**Residual (inference).** Path scoping is not a same-origin security boundary: a same-origin script could frame another path and read its cookies. G- containers cannot run such code ([Google](https://support.google.com/tagmanager/answer/17070049), fetched today). Quicktalog's own earlier root-path cookies (marketing `_ga`, PostHog) remain readable until §7 and §11 land.

---

## 7. Quicktalog's own tools on published catalogues

| Tool | Today (fact) | Change on `/catalogues/<slug>` | Why | Meter |
|---|---|---|---|---|
| GTM `GTM-W9RHLVK6` (GA4, a URL-named event, Hotjar) | Root `<head>` on every route (`src/app/layout.tsx:46-49`); no consent settings in container v6 (`../research/code-render-path.md` §6.4) | **Off** [all three] | (1) A tenant's Accept would switch on Quicktalog's GA4 (consent is page-global, probe). (2) The first-visit client-id collision. (3) Loading GTM itself needs consent (VG Hannover). (4) A remotely editable script channel on tenant pages | None |
| Microsoft Clarity | Same `<head>` (`src/components/general/ClarityScript.tsx:5-17`) | **Off** [all three] | Session recording is not exempt. Clarity "honors GCM consent signals" ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-gcm)), so it would ride a tenant's consent | None |
| PostHog | `capture_pageview: true`, default persistence (`src/instrumentation-client.ts:5-19`) | **`cookieless_mode: "always"`, `person_profiles: "never"`** (Phase 0, gated) [SecF, CV] | No cookies or storage and no cross-catalogue id ([PostHog](https://posthog.com/tutorials/cookieless-tracking)). Both options exist in the installed posthog-js 1.434.7 (`node_modules/posthog-js/dist/module.d.ts:4304`, `:5156`) | `$pageview` keeps flowing, so the worker (`quicktalog-backend/src/utils/analytics.ts:6-20`) and the dashboard (`src/lib/analytics/catalogue-traffic.ts:30-38`) keep working. Period uniques over-count, so relabel them |
| Sentry Replay | `replayIntegration()` (`src/instrumentation-client.ts:26`) | **Off**; errors stay, `sendDefaultPii: false` [all three] | Replay buffers the DOM and writes `sentryReplaySession` | None |
| Site cookie banner | Non-reactive path check (`src/components/general/CookieBanner.tsx:28-37`, `:65`) | Add the pathname to the effect's dependencies [SecF, CV] | After a client-side navigation it can show on, or skip, the wrong pages | None |
| Auth SDK, `UserContext` | `PageWrapperClient` on every route (`src/components/general/PageWrapperClient.tsx:15-25`) | Unchanged until the separate root layout (Phase 4) | Removing them needs C1's Option C | None |

```tsx
// src/components/general/QuicktalogSiteTags.tsx - replaces src/app/layout.tsx:47-48 inside <head>
"use client";
import { GoogleTagManager } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { ClarityScript } from "@/components/general/ClarityScript";

/** A published catalogue is the business's page: Quicktalog's GTM (GA4, Hotjar) and Clarity never load there. */
const PUBLIC_CATALOGUE = /^\/catalogues\/[^/]+\/?$/;

export function QuicktalogSiteTags({ gtmId }: { gtmId?: string }) {
  if (PUBLIC_CATALOGUE.test(usePathname() ?? "")) return null;   // /preview and /admin keep them
  return (
    <>
      <ClarityScript />
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
    </>
  );
}
```
```ts
// src/instrumentation-client.ts (sketch of the branch at :5-26)
const onPublicCatalogue = typeof window !== "undefined" && /^\/catalogues\/[^/]+\/?$/.test(window.location.pathname);
posthog.init(KEY, {
  /* ...existing options... */
  ...(onPublicCatalogue && process.env.NEXT_PUBLIC_POSTHOG_COOKIELESS_CATALOGUES === "true"
    ? { cookieless_mode: "always", person_profiles: "never" } : {}),
});
Sentry.init({ /* ... */ integrations: onPublicCatalogue ? [] : [Sentry.replayIntegration()] });
```

**Gate for the PostHog change.**
1. Turn on PostHog's project setting "Cookieless server hash mode".
2. Compare a week of TEST `$pageview` counts and the dashboard before and after.
3. Relabel "unique visitors over the period" (`docs/architecture/analytics.md:38`).

If it misbehaves, leave the flag off. The GA slice does not depend on it [SF].

**Legal status (inference, from `../research/consent.md` §5.2).** Cookieless PostHog still "gains access" under EDPB 2/2023. It is consent-free only under national exemptions. It is an improvement, not the end state, which is server-side counting (Phase 4).

**Soft-navigation caveat (inference) [SF].**
- Landing on marketing and soft-navigating into a catalogue keeps an already-loaded GTM in that document.
- That document never loads a tenant tag (the landing guard), so the two never coexist.
- The visitor's view of that page is recorded by Quicktalog's GA4 only, which is today's behaviour on a rare path.

---

## 8. CSP

**Facts**
- The policy is `Content-Security-Policy-Report-Only` on `/:path*`, with no report endpoint (`next.config.ts:47-70`). PROD sends none (`../research/code-render-path.md` §1).
- `script-src` already allows `https://*.googletagmanager.com` (`:50`), and `img-src` is `https:`.
- `connect-src` lacks `https://*.google.com` and `https://*.analytics.google.com` (`:55`). `frame-src` lacks googletagmanager (`:56`).

**What Google requires**
- GA4 without Ads features needs `connect-src … https://*.google.com` ([Google CSP](https://developers.google.com/tag-platform/security/guides/csp)).
- EU collection needs `*.analytics.google.com` ([Google](https://support.google.com/analytics/answer/12017362)).

**Decision [SF]: a directive map plus a second rule for published catalogues only.** When two header rules set the same key for a path the later one wins, and `/catalogues/:name` does not match nested paths ([Next.js 15](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers)).
```ts
// next.config.ts headers() (sketch)
const BASE_CSP: Record<string, string[]> = { /* today's directives at :49-61, as arrays */ };
const CATALOGUE_CSP = {
  ...BASE_CSP,
  "connect-src": [...BASE_CSP["connect-src"], "https://*.analytics.google.com", "https://*.google.com"],
  "frame-src": [...BASE_CSP["frame-src"], "https://www.googletagmanager.com"],   // service-worker / iframe paths
};
const serialize = (p: Record<string, string[]>) => Object.entries(p).map(([d, v]) => [d, ...v].join(" ")).join("; ");
return [
  { source: "/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(BASE_CSP) }] },
  { source: "/catalogues/:name", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(CATALOGUE_CSP) }] },
];
```
- **Not widened:** `/admin/*` and `/catalogues/<slug>/preview`. A test asserts that the catalogue rule matches `/catalogues/x` and not `/catalogues/x/preview`.
- **Trailing slash.** Because of `skipTrailingSlashRedirect: true` (`next.config.ts:87`), the trailing-slash variant must be checked too.
- **The CSP is not the security boundary.** `'unsafe-inline'` stays because nonces need dynamic rendering, which ISR forbids ([Next.js 15](https://nextjs.org/docs/15/app/guides/content-security-policy)). ID validation is the boundary.
- **Separate S item [SecF]:** a report endpoint (Sentry's CSP endpoint). Once reports exist, try the catalogue rule without `'unsafe-eval'` in report-only.
- **Later [SecF].** Enforcement, possibly with nonces through Vercel's middleware self-fetch pattern ([Vercel KB](https://vercel.com/kb/guide/csp-nonces-with-cdn-cache)), at a per-request cost (Phase 4). Ads and Meta hosts arrive with Phases 2-3.

---

## 9. Events and UTMs

### 9.1 Mechanism (Decision) [SecF context; SF/CV classifier]
- **Semantic events go through a React Context.** That is the project's state pattern (`.claude/skills/code-conventions/SKILL.md`).
  - The default value is a no-op, so the preview, builder and demo send nothing.
  - Only the published page mounts the provider (§4.1).
- **Link taps** are classified by a capture listener that `CatalogueTracking` installs after the tag loaded. No shared component changes are needed for them.
```tsx
// src/context/CatalogueEventsContext.tsx
"use client";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef } from "react";

export type CatalogueEvent =
  | { type: "item_view"; item: { id: string; name: string; section?: string; price?: number }; currency: string }
  | { type: "newsletter_signup" };
type Sink = (e: CatalogueEvent) => void;
type Value = { emit: Sink; setSink: (sink: Sink | null) => void };

const CatalogueEventsContext = createContext<Value>({ emit: () => {}, setSink: () => {} });

export function CatalogueEventsProvider({ children }: { children: ReactNode }) {
  const sink = useRef<Sink | null>(null);
  const emit = useCallback<Sink>((e) => sink.current?.(e), []);
  const setSink = useCallback((s: Sink | null) => { sink.current = s; }, []);
  const value = useMemo(() => ({ emit, setSink }), [emit, setSink]);
  return <CatalogueEventsContext.Provider value={value}>{children}</CatalogueEventsContext.Provider>;
}

export const useCatalogueEventsContext = () => useContext(CatalogueEventsContext);
// src/hooks/useCatalogueEvents.ts: export const useCatalogueEvents = () => useCatalogueEventsContext().emit;
```
```ts
// src/lib/tracking/link-events.ts - installed after load, registered BEFORE the exit guard (both window capture)
import { sendTenantEvent } from "@/lib/tracking/google-tag";

type Action = { event: "generate_lead" | "book_appointment" | "get_directions"; params: Record<string, string> };
const lead = (lead_source: string): Action => ({ event: "generate_lead", params: { lead_source } });
const SCHEMES: Array<[string, string]> = [["tel:", "phone"], ["sms:", "sms"], ["mailto:", "email"], ["whatsapp:", "whatsapp"], ["viber:", "viber"]];
const HOSTS: Array<[RegExp, (host: string) => Action]> = [
  [/^(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)$/, () => lead("whatsapp")],
  [/^(m\.me|(www\.)?messenger\.com)$/, () => lead("messenger")],
  [/^t\.me$/, () => lead("telegram")],
  [/^(maps\.app\.goo\.gl|maps\.google\.[a-z.]+|maps\.apple\.com|(www\.)?waze\.com)$/, () => ({ event: "get_directions", params: {} })],
  [/(^|\.)(fresha|booksy|treatwell|calendly|opentable|thefork|resy|simplybook|setmore)\.[a-z.]+$/,
    (host) => ({ event: "book_appointment", params: { booking_provider: host } })],
];

export function classifyLink(a: HTMLAnchorElement): Action | null {
  const href = (a.getAttribute("href") ?? "").trim();
  for (const [scheme, source] of SCHEMES) if (href.toLowerCase().startsWith(scheme)) return lead(source);
  let url: URL;
  try { url = new URL(href, location.href); } catch { return null; }
  if (/^(www\.)?google\.[a-z.]+$/.test(url.hostname) && url.pathname.startsWith("/maps")) return { event: "get_directions", params: {} };
  for (const [re, make] of HOSTS) if (re.test(url.hostname)) return make(url.hostname);
  return null;   // other outbound clicks: GA4's enhanced measurement already records them
}

export function installLinkTapEvents(): () => void {
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    const action = a && classifyLink(a);
    if (action) sendTenantEvent(action.event, action.params);   // never the number, address or email itself
  };
  window.addEventListener("click", onClick, { capture: true });
  return () => window.removeEventListener("click", onClick, { capture: true });
}
```

**Two small component edits**
- **Item card.** In `src/components/catalogue/cards/index.tsx:99`, when `mode !== "edit"`, call `emit({ type: "item_view", item, currency })` alongside `setIsModalOpen(true)`. The section name is threaded from `ItemsSection`.
  - **Price rule [CV].** Use the raw `record` (the formatted `validatedRecord.price` is a string, `:65-76`) and send the discounted price when a discount applies.
  - **Omit `price` and `value`** when the price is 0 and `isFree` is not true (`quicktalog-packages/src/types/catalogue.ts:128-140`). A blank price saves as 0 and renders "Free" today (`src/components/catalogue/cards/index.tsx:69-70`), so sending 0 would plant false zeros in GA4.
- **Newsletter.** On the success branch of the footer form (`src/components/catalogue/view/CatalogueFooter.tsx:50-53`), call `emit({ type: "newsletter_signup" })`. The email is never sent.

### 9.2 What is sent (v1)

| Visitor action | GA4 event | Parameters | Owner value |
|---|---|---|---|
| Lands, after Accept | `page_view` (from `config`) | Full URL with UTMs, `gclid` kept | Sources and campaigns ([Google](https://support.google.com/analytics/answer/10917952)) |
| Scrolls, outbound clicks, site search | Enhanced Measurement, the owner's own setting | `view_search_results` from the debounced `?q=` (§4.8) | No code from us ([Google](https://support.google.com/analytics/answer/9216061)) |
| Opens an item | `view_item` (recommended) | `currency`, `value`, `items[{item_id, item_name, item_category, price}]` | "Items viewed" ([Google](https://support.google.com/analytics/answer/12924131), via CV) |
| Taps phone, email, WhatsApp, Viber, SMS, Messenger or Telegram | `generate_lead` (recommended) | `lead_source` | Lead acquisition report ([Google](https://support.google.com/analytics/answer/16376749), via CV) |
| Subscribes to the newsletter | `generate_lead` | `lead_source: "newsletter"` | Same report |
| Taps a booking-provider link | `book_appointment` (on Google's CMS core list) | `booking_provider` (the host) | Salons, gyms, clinics ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration)) |
| Taps a map link | `get_directions` (custom) | none | Visit intent |

**Rules**
- No visitor-entered text; no phone numbers or emails, not even the business's.
- Values are capped at 100 characters and names at 40 ([GA4 limits](https://support.google.com/analytics/answer/9267744)).
- `developer_id.<id>` goes on every event once Google issues it ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration)).

**Phase 2 events [CV]:** `order_online`, `cta_click` (needs `data-qt-cta` forwarding in `SmartLink`), section opens as `select_content`, and the planned Buttons and Hours & Location blocks.

### 9.3 UTMs
- **Phase 1 (docs only).** Owners can add `utm_*` to links they share. Query strings do not fragment the ISR cache: never-seen UTM URLs were cache HITs (`../research/code-write-path.md` §6, probe B1). The search handler keeps other parameters.
- **Phase 2: QR placement UTMs [CV].**
  - **Fact.** The QR URL is pinned to `${NEXT_PUBLIC_BASE_URL}/catalogues/<slug>` (`src/lib/qr/design.ts:143-146`).
  - `catalogueUrl(catalogue, placement?)` appends `?utm_source=qr&utm_medium=print&utm_campaign=<placement>`, with the placement chosen from a fixed list (table, counter, window, flyer, poster, card, packaging). Never free text, so the pinning rule holds.
  - Already-printed codes keep working.
- **Phase 2: tagged share links** for the Instagram bio, Facebook, Google Business Profile, WhatsApp and email signatures [CV].

---

## 10. Security controls and AI-agent exclusion

### 10.1 Threats and controls (condensed from SecF §2)

| Threat | Controls | Residual |
|---|---|---|
| T1 Arbitrary JS through the setting (GTM, snippet, head code) | `G-` only. The anchored pattern is checked in four places: form, action, DB CHECK, render and loader. No free-form field. The ID is never interpolated into script text (props + `encodeURIComponent`). Google: `G-` containers are "limited to Google tags"; `GTM-` "allows all tag types" ([Google](https://support.google.com/tagmanager/answer/17070049), fetched today) | None known |
| T2 A tenant's upgraded `G-` container reads Quicktalog session cookies: Supabase's is non-httpOnly at path `/` (`src/lib/auth/cookie-options.ts:8-21`), and Clerk's `__session` is script-readable. Unverified hypothesis (`../research/google-tag-docs.md` §2.5) | Session guard; session watcher; `gtm.blocklist` for `k`, `j`, `d` (probe-gated); never on preview or admin; hard exits; paid plans only | Sign-in in another browser tab while a catalogue tab is open, before the watcher fires: worst in Safari and Firefox, which lack `cookieStore` change events. Closed only by httpOnly sessions or a separate domain (Phases 4-5). **The Phase 0 probe decides launch (§15, R1)** |
| T3 Cross-tenant leakage | Per-catalogue prefix and path; private data layer; hard exits; no tags when framed; Quicktalog GTM off | Root-path Quicktalog cookies readable until §7 and §11 land |
| T4 The AI agent writes tracking (prompt injection from scraped pages or OCR) | §10.2 | None known |
| T5 A forged create, publish, duplicate or save payload | Not in `CATALOGUE_EDITABLE_FIELDS`; server-owned in the draft cache; column grant + CHECK | None known |
| T6 Plan bypass, or a tag left live after a downgrade | Plan read in the action; clearing in both webhook branches + revalidate; optional publish forcing | Up to one webhook delay |
| T7 Secrets in a public column | The CHECK admits one key; "public by construction" is documented | None |
| T8 Spam on the consent log | Strict schema; IP-keyed rate limit; the function requires an active catalogue with tracking; no public reads | Rows within rate limits |
| T9 Per-visitor data in the ISR cache | Consent and session checks run only in the browser; no `Set-Cookie` | None |
| T10 Data pollution by anyone who knows the ID | Inherent to client-side tags | Accepted |

### 10.2 The AI agent cannot reach the setting (facts) [all three] and the hardening added [SecF]
**Facts**
- The tool schema is a closed `z.object` (`src/agent/tools/general.ts:8-49`).
- The applier copies named fields only (`src/lib/catalogue/operations.ts:474-534`).
- The snapshot lists fields explicitly (`src/agent/session.ts:375-419`).
- The column is outside `CATALOGUE_EDITABLE_FIELDS`, so even a forged draft cannot persist it.
- The prompt already forbids copying "tracking snippets" out of pages (`src/agent/instructions.ts:73`).

**Added**
1. **A prompt line** in `settingsRules` (`src/agent/instructions.ts:48-53`): "Tracking (Google Analytics, Google Tag Manager, Meta Pixel or any pixel or snippet) is not something you can set. The owner connects Google Analytics on the catalogue's Analytics page; if asked, say so and point them there. Never put a tracking snippet into an embedding or custom_code section."
2. **Strip `integrations` in `/api/agent`** before building the session (`src/app/api/agent/route.ts:125-138`). The editor state now carries the row's value (§3.5), so a future prompt or snapshot change must not be able to echo it.
3. **Tests:**
   - walk every agent tool's input schema as JSON schema and find no property matching `/integration|measurement|gtag|pixel|tracking/i`;
   - `catalogueFieldsSchema.parse({ integrations })` yields none;
   - `snapshot()` and the instructions never contain a `G-` ID;
   - the prompt line is present.

---

## 11. GTM and the separate-domain path [all three]
- **Position: no `GTM-` containers and no free-form head code while public catalogues are served from `www.quicktalog.app`.**
  - A `GTM-` container "allows all tag types", including Custom HTML and third-party scripts ([Google](https://support.google.com/tagmanager/answer/17070049), fetched today). That holds even when loaded through `/gtag/js` ([release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708), via the research notes).
  - On this origin its code would run first-party next to the builder, where session cookies are script-readable.
- **The CSP cannot contain it.** `script-src` has `'unsafe-inline'`, `'unsafe-eval'` and `*.googletagmanager.com` (`next.config.ts:50`). Nonces are impossible on ISR.
- **A blocklisted GTM container buys nothing [SecF].** It would then run only Google tags, which a `G-` ID already gives. Blocklisting any class also blocks custom templates ([Google](https://developers.google.com/tag-platform/tag-manager/restrict)).
- **The market agrees.**
  - Calendly "doesn't support direct integration with Google Tag Manager" ([Calendly](https://calendly.com/help/calendly-google-analytics)).
  - Gumroad runs snippets on `gumroad-analytics.com`; a 2025 pentest rated stored XSS there "Info" for that reason ([Hacktron](https://www.hacktron.ai/reports/Gumroad_01.pdf)).
  - Tally offers code injection only on custom domains ([Tally](https://tally.so/help/code-injection)).
- **The path (Phase 5, L+).** Serve published catalogues from a separate registrable domain, ideally `<slug>.<new-domain>` on the Public Suffix List. These must move together (`../research/code-write-path.md` §6):
  - permanent 301s from `www.quicktalog.app/catalogues/<slug>`, because printed QR codes point there;
  - QR pinning (`src/lib/qr/design.ts:143-146`);
  - the worker's host filter (`quicktalog-backend/src/utils/analytics.ts:6-7`) and the dashboard's `$host` match (`src/lib/analytics/catalogue-traffic.ts:56`);
  - the CRM view URLs;
  - canonical and OG URLs, the sitemap, Vercel domains and the CSP.
- **After that,** GTM can be offered (Premium) behind the same notice, and per-tenant cookie isolation becomes the browser's job.

---

## 12. Plan gating
- **Flag:** `features.integrations.googleAnalytics: boolean` on all six tiers. `features.analytics` already means the built-in dashboard tier (`quicktalog-packages/src/types/general.ts:39`).
- **Recommended values (founder decides) [CV]:**

| Tier | Line | Value |
|---|---|---|
| Starter | `:6` | `false` |
| Basic | `:39` | `true` |
| Pro | `:71` | `true` |
| Growth | `:103` | `true` |
| Premium | `:135` | `true` |
| German Silva Custom Plan | `:167` | `true` |

- **Why Basic+.**
  1. The business name is a precondition, and only `branding` plans can set it (`src/components/catalogue/inputs/sidebar/FooterTab.tsx:15`, `:76-82`; Basic `branding: true`, `pricing.ts:56`).
  2. The cost per catalogue is near zero.
  3. With Basic+ only paid-to-free changes remove it, the one path that already reconciles today.
  4. Free accounts cannot attach third-party tags.
- **Alternative, Pro+ [SF, SecF].** It gives a stronger Pro upsell and matches Linktree (`../research/shared-domain-implementations.md` §5.1). It needs no code change: six booleans, with clearing already in both webhook branches.
- **Enforcement.**
  - Server-side in the action (§3.4) and on downgrade (§3.6); optionally at publish and re-activation.
  - The UI lock is a convenience only (§1.2).
  - Add pricing rows (`src/constants/pricing.ts:24-59`, `:112-204`; `src/components/dashboard/subscription/PlanFeatures.tsx:32-59`).

---

## 13. Testing, docs, rollout and outreach

### 13.1 Unit (Vitest; conventions in `tests/unit/server_actions/qr-configs.test.ts`)
1. **`tracking/ids`**
   - Normalization: case and typographic dashes.
   - Every refused prefix; non-ASCII (`ſ`, fullwidth); length bounds.
   - Snippet extraction: one, repeated, two, and GTM present.
   - The pattern source equals the migration literal.
2. **`actions/integrations`**
   - Identity before anything; parse before the database.
   - Starter refused for connect but allowed to remove; beta refusal.
   - 0 rows gives "not found".
   - `23514` returns a message and no Sentry event; `42501` goes to Sentry.
   - `revalidateCatalogue` runs after `withUser` resolves; no Redis inside the block; the rate limit applies.
3. **Columns:** `CATALOGUE_EDITABLE_FIELDS` lacks `integrations`, `pickEditable` drops it, `PUBLIC_CATALOGUE_COLUMNS` has it.
4. **Draft cache** (new file): the row's `integrations` wins on read; it is stripped on write.
5. **Entitlements and webhook:** clearing on cancellation and on activation of a tier without the flag; names revalidated; an upgrade leaves the ID alone.
6. **Agent:** the §10.2 tests.
7. **Loader (happy-dom)**
   - Nothing without consent, with an invalid ID, framed, off-path, after a soft navigation, or with each session cookie form (exact `sessionCookieName()`, `sb-auth-token`, hyphenated, chunked `.0`, `__session_x`).
   - With consent: the layer order is exactly blocklist → default → update → `set`s → `js` → `config`, and every command entry is an `Arguments` object.
   - The `src` is exact; `window.dataLayer` and `window.gtag` are untouched; it runs once.
   - Withdrawal sets `ga-disable`, deletes only the prefixed cookies at that path, and reloads.
8. **Consent store:** per-catalogue key; 6-month expiry; version or hash change re-prompts; throwing storage returns null.
9. **Notice:** equal buttons; no close "×"; collapse stores nothing; language fallback.
10. **Events:**
    - The classifier table (`tel:`, `wa.me`, `viber:`, a maps link, Fresha, a plain outbound link).
    - The price rule (0 without `isFree` omits value).
    - No event before load; `send_to` present; the newsletter event never carries the email.
11. **Search:** a burst of keystrokes calls `router.replace` once; a phone or email query is never written; an echo does not overwrite newer typing.
12. **`QuicktalogSiteTags`:** nothing on `/catalogues/x`; rendered on `/` and `/catalogues/x/preview`.
13. **Architecture:** only `src/app/catalogues/[name]/page.tsx` imports `CatalogueTracking` and `CatalogueEventsProvider`.
14. **CSP:** the catalogue rule is last and matches `/catalogues/x` but not `/catalogues/x/preview`.

### 13.2 Database
- pgTAP as in §2.2, plus the Phase 1b consent table and function: active-with-tracking only; owners read only their own; `app_public` executes only.
- PGlite applies only `PHASE_MIGRATIONS` (`../research/code-write-path.md` §1), so pgTAP is the real gate.

### 13.3 End-to-end (Playwright, TEST only: `playwright.config.ts:22-26` refuses production)
**Setup.** Route-abort or 204 every request to `*.google-analytics.com`, `*.analytics.google.com`, `*.google.com` and `doubleclick`, so no real property is touched.

**Scenarios**
1. **Accept flow.** A beta user on an eligible plan saves `G-QTE2E00001`, fills in the business name and publishes.
   - In a fresh signed-out context there is no `gtag/js` request before Accept.
   - After Accept there is exactly one, with `id=G-QTE2E00001&l=qtDataLayer`, and a collect hit with `gcs=G101`.
   - Cookies are `qt_<12hex>_ga*`, host-only, at `/catalogues/<slug>`, `Secure`.
   - Opening an item sends `view_item`; a `tel:` tap sends `generate_lead`.
2. **Reject:** zero Google requests, also after reload.
3. **No business name:** no notice and no request.
4. **Preview and `/admin`:** zero requests and no notice.
5. **Signed in:** the note shows and no request is made.
6. **`/showcases` frames:** zero requests.
7. **Exits:** links to `/` and `/privacy-policy` after Accept are full document navigations, and `gtag` is absent there.
8. **Withdrawal:** deletes the cookies and reloads; no further hits.
9. **Starter:** the card is locked, and Remove still works after a simulated downgrade.
10. **Headers:** the catalogue CSP header differs from `/admin`'s.

### 13.4 Manual QA (needs a Quicktalog-owned GA4 property)
- **Realtime and DebugView** through `?qt_debug=1`, and Tag Assistant with the renamed layer. If Tag Assistant fails, document `?qt_debug=1` as the test path.
- **Browsers:** prefixed and path-scoped cookies in Chrome, Safari iOS, Firefox, and the Instagram and Facebook in-app browsers.
- **Layout:** 360 px, all 7 themes plus a custom theme, EN and both Serbian scripts; a screen-reader pass.
- **A one-week TEST meter comparison** for the PostHog flag (§7).
- **The Phase 0 security probe** (§15).

### 13.5 Docs and skills
- **New: `docs/architecture/catalogue-tracking.md`**, listed in `docs/README.md`. It covers:
  - storage, the CHECK and the grants;
  - the immediate action and why it bypasses the draft;
  - plan clearing;
  - the mount rule and guards;
  - consent order and storage;
  - cookie isolation;
  - the CSP rule;
  - events;
  - the kill switch and its purge step;
  - why GTM, `GT-` and `AW-` are refused;
  - why GA4 differs from the dashboard.
- **Update:**
  - `analytics.md`: Quicktalog's GTM, Clarity and Replay are off catalogue pages; PostHog cookieless and visitor semantics.
  - `catalogue-html-safety.md`: tracking is a typed setting, not a fifth sink.
  - `data-access.md`: the new grants and the consent function.
  - `builder.md`: the General pointer.
  - `ai-chat-flow.md`: the agent cannot set tracking.
  - `qr-codes.md`: only when UTMs ship.
- **Skills:**
  - `server-action-and-route`: the "setting applied outside the draft" pattern and the 42501 nuance.
  - `data-revalidation`: an integrations row, and the purge-by-shared-tag note (J correction 2).
  - `adding-new-content-block`: tracking is never a block.
- **Owner help:** `src/content/docs/connect-google-analytics.tsx`, registered in `src/content/docs/registry.ts` and cross-linked from `track-performance.tsx`.
- **Legal (counsel):** Art. 28 terms, a visitor section in the privacy policy, the cookie table, and the governing law, which is still a placeholder (`src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:506-509`, per `../research/consent.md` §3.5).

### 13.6 Rollout
1. **TEST.** Phase 0 items, then Phase 1 behind the beta allowlist; unit, e2e and manual QA; the security probe.
2. **PROD prerequisites.** This feature uses the new data layer (`withUser`, `app_user`/`app_public`), which exists only on `test`. It therefore ships **with or after the release that brings `test` to `main`** (`.claude/plans/README.md`, "PROD cutover pending").
   - Apply the pending PROD migrations in order, then ours, then deploy.
3. **Beta.** Quicktalog's own catalogues, then the founder's, then 5-10 owners found by the PROD audit.
4. **General availability** after the Phase 1b gates (consent log, counsel, translations). Then the launch email, the help article and an in-app note on the Analytics page.
5. **Metrics:**
   - share of eligible catalogues connected;
   - card opened → saved → status "connected";
   - consent acceptance rate (from the log);
   - support tickets tagged GA.

### 13.7 Outreach [all three; corrected premise]
- **Fact.** `origin/main` (`ef02164`, 2026-05-09) does not contain the sandbox commit `e87e1f2` (verified today with `git merge-base --is-ancestor`).
- **Fact.** PROD serves a build matching `origin/main`, whose embed and custom-code blocks re-create scripts first-party (LIVE chunk check, `../research/code-render-path.md` §1; not re-checked here).
- **So** owners' pasted GA, GTM or Pixel snippets still run on PROD today. They stop **on the day `test` reaches PROD**, not on 2026-09-15.
- **Steps:**
  1. With the founder's go-ahead, run the drafted read-only PROD audit (`../research/code-write-path.md` §7), plus counts of active catalogues by `language` and plan. These decide the next notice languages.
  2. Email segmented owners 7-14 days before the release. Segments: a `G-` ID found (paste it; consent now applies, so expect fewer visits), GTM only, Meta Pixel, and plans without the feature.
  3. Don't present the old snippets as legitimate: they ran without visitor consent.

---

## 14. Phased delivery
S = a sitting, M = a few sittings, L = a week or more.

| Phase | Work | Size | Gate |
|---|---|---|---|
| **0. Decide, verify, clean** | 0.1 Founder decisions (§15.2); PROD audit approval | S | |
| | 0.2 **Security probe** with a Quicktalog-owned GA4 property and an upgraded tag (R1-R2 items a-f) | M | Launch gate |
| | 0.3 Apply for a Google tag Developer ID ([form via the CMS guide](https://developers.google.com/tag-platform/devguides/gtag-integration)) | S + wait | |
| | 0.4 Counsel brief: notice, processor terms, consent-log need, cookie lifetime, basic mode | external | General availability |
| | 0.5 `QuicktalogSiteTags` (GTM and Clarity off published catalogues); Sentry Replay off there; `CookieBanner` path fix | S | |
| | 0.6 Search URL debounce with echo and PII handling | S | |
| | 0.7 PostHog cookieless on published catalogues + project setting + one-week TEST meter check | S-M | Meter unchanged |
| **1. GA4 setting (beta)** | 1a Migration, pgTAP, TEST push; package (`drizzle-kit pull`, type, default, constant, tier flags), release, app bump | M | §2.4 order |
| | 1b Validator, messages, schema, server-only helpers, action, status, beta gate, rate limit, draft-cache rule, webhook clearing + revalidation, optional publish forcing | M | |
| | 1c Analytics card (field, states, plain lock, notice preview, test steps, guided setup); General pointer | M | |
| | 1d Visitor side: config, `CatalogueTracking`, guards + watcher, consent store, sheet + details + privacy link, loader, exit guard, kill switch | M-L | |
| | 1e Events: context + hook, item and newsletter emits, link classifier | S-M | |
| | 1f Catalogue CSP rule | S | |
| | 1g Agent prompt line, route strip, tests | S | |
| | 1h Unit, component, architecture and e2e tests; manual QA | M | Probe passed |
| | 1i Docs, help article, skills | S | |
| **1b. General availability gates** | Consent log (migration, function, action, pgTAP); EU notice translations by PROD language counts, native-reviewed; counsel sign-off; Terms DPA and privacy policy (legal); outreach email | M + external | All three done |
| **2. Fast follows** | 2a "I advertise with Google Ads" switch (CHECK widened to `advertising`; second-layer toggle; `ad_*` grant; GPC = no ads; Ads CSP hosts) [SecF, CV]; 2b QR placement UTMs; 2c tagged share links; 2d consent rate + CSV on the card; 2e apply to all catalogues + duplicate prompt; 2f old-snippet helper + builder warning; 2g Phase 2 events; 2h "Found at Google" check (optional); 2i accept `GT-` after the probe | S-M each | |
| **3. Meta Pixel** | `metaPixelId` key, advertising purpose naming Meta (joint controller), `fbq` after consent with `autoConfig` off, `trackSingle`, Meta CSP hosts | M | PROD audit shows demand |
| **4. Structural** | 4a Separate root layout for published catalogues (build spike first) [SecF]; 4b server-side page-view counting from middleware [SecF, CV]; 4c CSP report endpoint → enforce on catalogues; 4d httpOnly session cookies (auth plan); 4e advanced consent mode as an owner opt-in after counsel | M-L each | |
| **5. Separate catalogue domain** | PSL-listed tenant domains, then GTM for Premium | L+ | Strategic decision |

**Estimate (inference).**
- Phase 0 dev items: about 2-3 days.
- Phase 1: about 1.5-2 developer-weeks (60-75 focused hours).
- Phase 1b: 3-5 days of development plus counsel's and translators' turnaround.

**If Phase 1 runs long, cut in this order:**
1. the General pointer;
2. the guided-setup copy;
3. the booking and directions events;
4. Serbian Cyrillic (keep Latin);
5. the notice preview.

**Never cut:**
- consent before load;
- per-catalogue cookies;
- GTM and Clarity off;
- the landing, exit and session guards and the watcher;
- server validation, the plan check and downgrade clearing;
- the business-name gate.

---

## 15. Risks and open questions

### 15.1 Risks
- **R1. Tenant-container exfiltration (T2), unverified. A launch gate.** Phase 0.2 probe with a real upgraded `G-` container:
  - (a) Can a First Party Cookie or JavaScript Variable read a test cookie and send it in a GA4 event parameter via `gtag/js?id=G-…&l=qtDataLayer`?
  - (b) Does the `qtDataLayer` blocklist stop it without stopping `page_view`?
  - (e) Is `GT-` restricted like `G-`?
  - (f) Do the cookies behave the same in Safari and Firefox?

  **Decision rule**
  - (a) fails: launch with the guards as defense in depth.
  - (a) succeeds and (b) works: launch with the blocklist and the guards.
  - (a) succeeds and (b) fails: no launch until httpOnly sessions (4d) or the separate domain (5) [SecF].
- **R2. Cookie scoping under `gtm init`.** Upgraded tags may initialise without our `config` ([Google](https://support.google.com/tagmanager/answer/17079602)).
  - Probe items (c) and (d) check that the page-wide `set` cookie parameters and Tag Assistant still apply.
  - If (c) fails: document it and ask owners not to enable that trigger, or move the separate domain earlier.
- **R3. Legal.** No DPA in the Terms, no visitor section in the privacy policy, and a placeholder governing law (`../research/consent.md` §3.5). Counsel must approve the copy. The general-availability gate holds until then.
- **R4. Expectation gap.** GA shows roughly half to two-thirds of PostHog's visits (consent, ad blockers, Safari's 7-day storage). Said up front on the card.
- **R5. PostHog cookieless semantics.** Unique visitors become daily hashes, and how the stored `distinct_id` looks is unverified. Gated (§7).
- **R6. Release coupling.** The feature depends on the `test`→`main` release and the auth cutover, and PROD owners lose their pasted snippets that same day.
- **R7. Future navigation code.** A programmatic `router.push` in the public view would bypass the exit guard. Covered by the component test and the docs.
- **R8. Paddle.** `SubscriptionUpdated` never updates `users.plan_id` (`src/utils/paddle/process-webhook.ts:58-64`, `:131-187`). Pre-existing; check how plan switches arrive.
- **R9. Cache churn.** Each save purges every catalogue's `catalogue-detail` data (`src/lib/cache/revalidate.ts:15`). The rate limit bounds it.
- **R10. Google changes `gtag.js`** (`l=`, consent handling) at any time. Covered by the kill switch, the QA re-run and the release-note watch.
- **R11. Translation quality and the English fallback** on EU catalogues. Counsel decides.
- **R12. Owners who iframe their catalogue** on their own site get no GA inside the frame (documented).
- **R13. Pre-existing gaps** that stay after Phase 1:
  - the embed and text `<img>` beacon channel (any https host);
  - Clerk for anonymous visitors on PROD until the cutover;
  - Quicktalog's marketing-site consent is not real Consent Mode (`src/utils/cookies.ts:36-71`).

### 15.2 Open questions for the founder
1. **Tier.** Basic and up (recommended), or Pro and up? Is the custom plan id 5 included?
2. **Quicktalog's own tools.** May its GTM (GA4, Hotjar) and Clarity stop running on published catalogue pages? Does anyone rely on that GA4 data?
3. **PostHog.** Approve cookieless counting on published catalogue pages, gated on the TEST meter check, with relabelled unique visitors?
4. **PROD audit.** Go-ahead for the read-only query, plus the language and plan counts?
5. **Timing.** Ship in the `test`→`main` release, or right after it? When should outreach go out?
6. **Counsel.** Availability for:
   - the notice copy and processor terms;
   - whether the consent log must precede general availability (this design says yes);
   - the 13-month cookie lifetime;
   - basic mode;
   - an English fallback on EU catalogues.
7. **Business-name gate.** Require only the legal name, or also an address or email (consent research recommends one contact)?
8. **Developer ID.** Apply now?
9. **Beta.** Who is on the allowlist?
10. **Structural fixes.** Timing for httpOnly sessions and a separate catalogue domain. These decide when GTM becomes possible, and R1 may force them earlier.

---

## Appendix A: File-level change list

**`quicktalog-app`: database**

| File | Phase | Change |
|---|---|---|
| `supabase/migrations/<ts>_catalogue_integrations.sql` (new) | 1a | Column, CHECK, comment, two column grants (§2.1) |
| `supabase/tests/database/10_catalogues.test.sql` | 1a | Grant, RLS and CHECK assertions; bump `plan(20)` (`:24`) |
| `supabase/migrations/<ts>_catalogue_consent_events.sql` (new) + a pgTAP file | 1b | Table, owner policy, `private.record_catalogue_consent` (§5.6) |

**`quicktalog-packages`**

| File | Phase | Change |
|---|---|---|
| `src/drizzle/migrations/schema.ts` | 1a | `drizzle-kit pull` only |
| `src/types/catalogue.ts` | 1a | `CatalogueIntegrations`; `integrations` in the `Update` map (`:15-29`) |
| `src/constants/integrations.ts` (new) | 1a | `GA4_MEASUREMENT_ID_SOURCE`, `GA4_MEASUREMENT_ID` |
| `src/constants/catalogue.ts` | 1a | `integrations: {}` (`:3`) |
| `src/types/general.ts` | 1a | `features.integrations.googleAnalytics` (`:25-46`) |
| `src/constants/pricing.ts` | 1a | The flag on all six tiers |

**`quicktalog-app`: server**

| File | Phase | Change |
|---|---|---|
| `package.json`, `package-lock.json` | 1a | `@quicktalog/common` ^1.67.0 |
| `src/utils/db/columns.ts` | 1b | `integrations` in `PUBLIC_CATALOGUE_COLUMNS` only, with a comment |
| `src/constants/schemas.ts` | 1b | `integrationsInputSchema`; Phase 1b `catalogueConsentSchema` |
| `src/lib/tracking/ids.ts`, `messages.ts`, `status.ts`, `types.ts` (new) | 1b | Pure checks, copy, status, shared types |
| `src/lib/tracking/beta.ts` (new, server-only) | 1b | Allowlist; delete at general availability |
| `src/lib/tracking/public-config.ts` (new, server-only) | 1d | `publicTagConfig`, `NOTICE_VERSION` |
| `src/lib/catalogue/integrations.ts` (new, server-only) | 1b | `setOwnedIntegrations`, `readOwnedTrackingState` |
| `src/lib/entitlements/integrations.ts` (new) | 1b | `allowsGoogleAnalytics` |
| `src/lib/entitlements/catalogue.ts` | 1b | `clearUnentitledIntegrations` |
| `src/actions/integrations.ts` (new) | 1b | `updateCatalogueIntegrations` |
| `src/actions/catalogue-consent.ts` (new) | 1b-GA | `recordCatalogueConsent` |
| `src/actions/catalogue.ts` | 1b (optional) | Publish and re-activation force `{}` when the tier lacks the flag |
| `src/utils/paddle/process-webhook.ts` | 1b | Clearing in the activation and cancellation branches; revalidate cleared names; email list |
| `src/lib/catalogue/draft-cache.ts` | 1b | Server-owned on read (`:61-71`); stripped on write (`:75-82`) |
| `src/lib/rate-limit.ts` | 1b | `integrations` rule; Phase 1b `catalogueConsent` rule |
| `src/app/api/agent/route.ts` | 1g | Strip `integrations` before building the session |
| `src/agent/instructions.ts` | 1g | `settingsRules` line |

**`quicktalog-app`: render, UI and config**

| File | Phase | Change |
|---|---|---|
| `src/app/catalogues/[name]/page.tsx` | 1d | Config + provider + `CatalogueTracking`; env kill switch |
| `src/components/catalogue/tracking/CatalogueTracking.tsx`, `ConsentSheet.tsx`, `NoticeDetails.tsx`, `PrivacyChoicesLink.tsx`, `SignedInNote.tsx` (new) | 1d | The visitor side |
| `src/constants/tracking-notice.ts` (new) | 1d | EN, SR Latin and SR Cyrillic copy; language picker |
| `src/lib/tracking/google-tag.ts`, `guards.ts`, `consent-store.ts`, `exit-guard.ts`, `link-events.ts` (new) | 1d-1e | Loader, guards, storage, exits, classifier |
| `src/context/CatalogueEventsContext.tsx`, `src/hooks/useCatalogueEvents.ts` (new) | 1e | The events channel |
| `src/components/catalogue/cards/index.tsx` (`:99`), the `ItemsSection` prop, `src/components/catalogue/view/CatalogueFooter.tsx` (`:50-53`) | 1e | `item_view` and newsletter emits |
| `src/components/catalogue/view/CatalogueContent.tsx` | 0.6 | Debounced `?q=` write with echo and PII handling (`:88-103`) |
| `src/components/general/QuicktalogSiteTags.tsx` (new); `src/app/layout.tsx` (`:47-48`) | 0.5 | GTM and Clarity off published catalogues |
| `src/components/general/CookieBanner.tsx` | 0.5 | Pathname in the effect's dependencies (`:65`) |
| `src/instrumentation-client.ts` | 0.5 / 0.7 | Replay off on published catalogues; flagged PostHog cookieless branch |
| `src/app/admin/[name]/analytics/page.tsx`; `src/components/analytics/CatalogueAnalytics.tsx`; `GoogleAnalyticsCard.tsx`, `NoticePreview.tsx` (new) | 1c | Owner UI (plain lock, not `LockedGroup`) |
| `src/components/catalogue/inputs/sidebar/GeneralTab.tsx` | 1c | "Analytics & tracking" pointer |
| `next.config.ts` | 1f | Directive map + `/catalogues/:name` rule |
| `src/constants/pricing.ts`; `src/components/dashboard/subscription/PlanFeatures.tsx` | 1c | Feature rows |
| `src/content/docs/connect-google-analytics.tsx` (new); `src/content/docs/registry.ts`; `track-performance.tsx` | 1i | Owner help |
| Tests (§13.1-13.3), docs and skills (§13.5) | 1h-1i | As listed |

**`quicktalog-backend`**
- No change for GA4.
- Optional, pre-existing worker fixes from `../research/code-write-path.md` §6:
  - `%admin%` is matched on the full URL;
  - `/preview` counts toward the meter;
  - partial-day first-write-wins.

---

## Appendix B: Verification done for this synthesis (2026-10-01)

**Code** (`test` HEAD `d785bb8`). Each `file:line` cited above was opened today. The checks that decided something:
- **Mount point:** the published page and the identical preview render (`src/app/catalogues/[name]/page.tsx:11`, `:120`, `:143-144`; `preview/page.tsx:10`, `:36`); the root layout (`src/app/layout.tsx:46-49`).
- **Write path:** the allowlists (`src/utils/db/columns.ts:10-66`), the draft cache (`src/lib/catalogue/draft-cache.ts:26-31`, `:61-82`) and the grants (`supabase/migrations/20260921181104_app_role_grants_policies.sql:54-60`, `:82-84`).
- **Session cookies:** `src/lib/auth/cookie-options.ts:8-33` and `src/utils/supabase/session.ts:8-16`.
- **CSP:** `next.config.ts:47-70`, `:87`.
- **Search:** `src/components/catalogue/view/CatalogueContent.tsx:58-59`, `:88-103`.
- **Lock UI:** `LimitsOverlay.tsx:17`, `:26-36`; `LockedGroup.tsx:35-41`.
- **Plans and downgrades:** `src/lib/entitlements/plan.ts:27-38`, `:67-79`; `src/lib/entitlements/catalogue.ts:37-78`; `src/utils/paddle/process-webhook.ts:58-64`, `:131-222`.
- **Revalidation:** `src/lib/cache/revalidate.ts:8-27`; `src/app/api/revalidate/route.ts:10-63`.
- **Agent:** `src/agent/tools/general.ts:8-60`; `src/agent/instructions.ts:48-53`, `:73`; `src/agent/session.ts:375-419`; `src/lib/catalogue/operations.ts:474-534`; `src/app/api/agent/route.ts:125-138`.
- **Kill switch:** `src/lib/ops/flags.ts:1-23`; `node_modules/@vercel/global-config/dist/index.js:197-200`, `:220`, `:610-613` (v1.5.1).
- **Themes:** `src/components/catalogue/view/Catalogue.tsx:44-45`, `:181-203`, `:264`; `src/lib/themes/custom-theme.ts:221-233`.
- **Items and links:** `src/components/catalogue/cards/index.tsx:65-110`; `FooterTab.tsx:15`, `:76-82`; `LegalLinks.tsx:17-61`; `SmartLink.tsx:40-58`; `CatalogueHeader.tsx:77-217` (links); `Contact.tsx:22-55`.
- **Other cited files:** `src/lib/catalogue/items.ts:60-100`; `src/actions/newsletter.ts:26-57`; `src/actions/qr-configs.ts:15-69`; `src/lib/rate-limit.ts:8-58`; `src/components/showcases/ShowcaseFrame.tsx:64-69`; `src/components/general/CookieBanner.tsx:22-65`; `src/instrumentation-client.ts:5-42`; `src/middleware.ts:28-86`.
- **Package:** `quicktalog-packages/src/types/{catalogue.ts:15-29,128-140; functions.ts:1-3; general.ts:25-46}`, `src/constants/{catalogue.ts:3; pricing.ts}`.
- **Skills:** `.claude/skills/code-conventions/SKILL.md`, `server-action-and-route/SKILL.md`, `data-revalidation/SKILL.md`.

**TEST (read-only SELECTs, `imhinsgyzzyblghwnedk`)**
1. **The §2.1 CHECK expression over 21 literal jsonb samples.**
   - Passes: `{}`, `G-PSW1MY7HB4` and `G-TEST123` only.
   - Fails: lowercase, `GTM-`, `GT-`, `AW-`, a script payload, a trailing newline, a leading space, a 16-character and a 3-character suffix, fullwidth letters, a number, JSON null, a nested object, an array root, a scalar-null root, an extra `headCode` key, a `metaPixelId`-only object, and the `advertising` key.
2. **`information_schema` privileges on `catalogues`.**
   - `app_public` SELECT is column-level, all columns but `user_id`.
   - `app_user` UPDATE is column-level, without `name`, `id`, `source`, `user_id` and `created_at`.
   - `app_user` holds table-level INSERT, SELECT and DELETE.
   - No `integrations` column exists.

**git (read-only).** `origin/main` = `ef02164` (2026-05-09). `e87e1f2` (2026-09-15, "run custom code in a sandboxed frame") is an ancestor of `HEAD` but not of `origin/main`.

**Pages fetched live today**
- [Manage tagging behavior using the container ID](https://support.google.com/tagmanager/answer/17070049): `GTM-` allows all tag types; "product-specific prefixes like G- or AW-" are "limited to Google tags"; `GT-` is not named.
- [Restrict tag deployment](https://developers.google.com/tag-platform/tag-manager/restrict), last updated 2026-07-30:
  - the data-layer allowlist and blocklist "override any and all configuration in the container";
  - First Party Cookie `k`, JavaScript Variable `j` and DOM Element `d` are class `google`; Custom JavaScript Variable `jsm` is `customScripts`;
  - sandboxed template JS is blocked when any class is blocklisted.
- [Updates to Google tag and Google Tag Manager, 2026-08-20](https://support.google.com/tagmanager/answer/17079602): tags upgraded to "fully capable Google Tag Manager containers"; new snippets have no `config`; the `gtm init` trigger "can also configure the tag to wait for the config command".

All other external claims carry the URL cited by the research note or design they came from; those notes record their fetch dates.

---

## Appendix C: Detailed scores (1-10; higher is better; for owner friction, higher means less friction)

| Criterion | Ship-fast | Security-first | Customer-value |
|---|---|---|---|
| Correctness against the research | 9 | 7.5 | 7 |
| Security | 8 | 9 | 7 |
| Legal compliance | 7 | 9 | 8.5 |
| Customer value | 6 | 7 | 9.5 |
| Owner friction | 8 | 6 | 8.5 |
| Implementation cost and codebase fit | 9 | 5 | 6 |
| Extensibility | 8 | 8 | 8.5 |
| **Overall** (correctness, security and legal weighted ×2; value and cost ×1.5; the rest ×1) | **7.9** | **7.5** | **7.8** |

**Ship-fast**
- **Strengths:**
  - every code claim held when re-checked;
  - it alone caught the `LimitsOverlay` trap;
  - the most robust exit guard;
  - an honest kill switch and scope cuts;
  - a verified CHECK.
- **Gaps:**
  - no consent log (Google's "retain records");
  - a soft legal-name warning;
  - Google's 2-year default cookie;
  - PostHog left persistent;
  - thin events: no `view_item`.

**Security-first**
- **Strengths:**
  - the threat model;
  - the blocklist and the session watcher;
  - the agent route strip and schema walk;
  - the legal posture;
  - the Vercel nonce correction.
- **Problems:**
  - the separate root layout as a launch gate is costly and unproven;
  - the flags-store kill switch read in the ISR page risks dynamic rendering;
  - the save-time legal check goes stale;
  - `LockedGroup` reuse;
  - 19 legal translations before launch;
  - Pro+ and a publish-first legal step add friction.

**Customer-value**
- **Strengths:**
  - the clearest owner value: Items viewed and Lead acquisition with zero setup;
  - QR placements, guided setup and the migration helper;
  - the consent log on the codebase's own newsletter pattern;
  - the render-time business-name gate;
  - two useful probes.
- **Problems:**
  - the `/catalogues`-wide cookie path weakens tenant isolation;
  - `LockedGroup` reuse;
  - a large Phase 1;
  - 32 languages;
  - a DOM event bus against the Context convention;
  - turning dashboard links into `<a>` would add owner self-views to the meter.

---

## Appendix D: Critical claims this design depends on
These are the same 30 statements returned to the workflow. Each is checkable, and its falsity would change the design.

**Code**
- **C1.** The preview renders the same `<Catalogue type="view">` as the published page (`preview/page.tsx:36` vs `page.tsx:144`), and `src/app/catalogues/[name]/` has no layout file.
- **C2.** `app_user` UPDATE and `app_public` SELECT on `public.catalogues` are column-level grants (`20260921181104_app_role_grants_policies.sql:55-60`), so the migration needs both column grants.
- **C3.** `pickEditable` copies only `CATALOGUE_EDITABLE_FIELDS` on create, publish and duplicate (`src/utils/db/columns.ts:38-66`).
- **C4.** The Supabase session cookie:
  - is non-httpOnly, at path `/`, for 400 days;
  - is named by `sessionCookieName()`, with fallback `sb-auth-token` (`src/lib/auth/cookie-options.ts:8-33`).

  Clerk's session cookies are `__session` and `__refresh` (`src/utils/supabase/session.ts:8-16`).
- **C5.** The activation webhook branch only sets `users.plan_id`, and only deactivated catalogues are revalidated after a downgrade (`src/utils/paddle/process-webhook.ts:131-155`, `:213-215`).
- **C6.** `LimitsOverlay`'s button saves whatever `CatalogueContext` holds before opening `/pricing` (`LimitsOverlay.tsx:17`, `:26-36`), and `LockedGroup` always renders it when locked.
- **C7.** `@vercel/global-config` 1.5.1, used by `src/lib/ops/flags.ts`, defaults to `cache: "no-store"` (`dist/index.js:197-200`, `:220`).
- **C8.** The agent cannot write a new column:
  - the closed `catalogueFieldsSchema` (`src/agent/tools/general.ts:8-49`);
  - the named-field applier (`src/lib/catalogue/operations.ts:474-534`);
  - the explicit `snapshot()` (`src/agent/session.ts:375-419`).
- **C9.** PROD serves a build matching `origin/main` (`ef02164`), which lacks `e87e1f2`, so pasted owner scripts run first-party on PROD until the `test`→`main` release.

**Google and Next.js**
- **G1.** A `G-` or `AW-` container is limited to Google tags; a `GTM-` container allows all tag types, even through `/gtag/js` ([Google](https://support.google.com/tagmanager/answer/17070049); [release note](https://support.google.com/tagmanager/answer/4620708)).
- **G2.** Since 2026-08-20 an owner can manage their `G-` tag as a Tag Manager container ([Google](https://support.google.com/tagmanager/answer/17079602)). First Party Cookie, JavaScript Variable and DOM Element are class-`google` variable types ([Google](https://developers.google.com/tag-platform/tag-manager/restrict)).
- **G3.** The consent default must precede `config` and `event`, and basic mode sends nothing to Google before consent ([Google](https://developers.google.com/tag-platform/security/guides/consent); [Google](https://developers.google.com/tag-platform/security/concepts/consent-mode)).
- **G4.** gtag.js reads a renamed data layer only when the script URL has `l=<name>` ([Google](https://developers.google.com/tag-platform/devguides/datalayer)).
- **G5.** In Next.js 15 `headers()`, the later rule wins for the same key, and `/catalogues/:name` does not match `/catalogues/:name/preview` ([Next.js](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers)).
- **G6.** A `fetch` with `cache: 'no-store'` during server rendering makes an App Router route dynamic ([Next.js](https://nextjs.org/docs/15/app/api-reference/functions/fetch)).
- **G7.** `gtag('set', 'allow_google_signals', false)` and `gtag('set', 'allow_ad_personalization_signals', false)` turn off Google signals and ad personalization for the tag regardless of property settings. `window['ga-disable-<ID>'] = true` stops GA ([Google](https://developers.google.com/tag-platform/security/guides/privacy)).

**Legal**
- **L1.** Customer GA4 on EU/EEA visitors needs prior opt-in under ePrivacy Art. 5(3) as read in EDPB Guidelines 2/2023 (paras 50-53, 63), so basic mode is the defensible default.
- **L2.** An equally prominent reject is required on the first layer (EDPB Taskforce para 08; CNIL FAQ Q37-38), and "Accept & close ×" is not valid consent (VG Hannover 10 A 5385/22).
- **L3.** Storing the visitor's choice is strictly necessary and needs no consent (EDPB Taskforce para 30; CNIL 2020-091 art. 5).
- **L4.** Consent must be specific to, and name, each controller (GDPR Art. 4(11); EDPB 05/2020 paras 64-65). Hence per-catalogue consent naming the business.
- **L5.** Google's EU User Consent Policy requires retained records of consent, and EDPB 05/2020 para 108 says a correct configuration alone is not proof.
- **L6.** Loading GTM itself requires consent (VG Hannover, 19 Mar 2025).
- **L7.** Quicktalog acts as each business's Art. 28 processor for rendering tags, the notice and the consent log, which needs processing terms its Terms lack today.

**Browser**
- **B1.** The per-catalogue prefix, path and host-only domain give each catalogue its own client ID and keep its cookies out of `document.cookie` on other catalogues, in Chromium, Safari and Firefox.
- **B2.** Google consent state is page-global across differently named data layers.
- **B3.** Before Accept and after Reject there are zero Google requests. After Accept there is exactly one `gtag/js?id=G-…&l=qtDataLayer` request, hits carry `gcs=G101`, and no `window.dataLayer` exists.
- **B4.** A `window` capture-phase listener with `preventDefault` + `stopImmediatePropagation` runs before React's root listener, so `next/link` exits become full loads.
- **B5.** Page-wide `set` cookie parameters queued before gtag.js still apply when an upgraded container initialises on the `gtm init` trigger.
- **B6.** A real upgraded `G-` container loaded through `gtag/js?id=G-…&l=qtDataLayer` can read a non-httpOnly first-party cookie through a First Party Cookie variable and send it in an event parameter (the T2 hypothesis).
- **B7.** A `gtm.blocklist` with `k`, `j` and `d`, pushed into `qtDataLayer` before gtag.js loads, stops that read without stopping `page_view`.
