# Ship-fast design: how a Quicktalog customer adds their Google tag / GA4

Design written 2026-10-01 for the founder's question "How the google tag and analytics will be added". Lens: **ship fast**. The goal is the smallest slice that is legally safe, genuinely useful, buildable by one developer in about a week, and easy to extend.

**Inputs.** Every file in `../research/` was read in full. So were the tracking parts of the 2026-09-30 strategy report and its two research notes, and section 3 of the 2026-09-25 PLAN.
- **Re-checked here:** every code claim below, against the `quicktalog-app` working tree (branch `test`, HEAD `d785bb8`), `quicktalog-packages` (HEAD `7a2ca85`, v1.66.0) and `quicktalog-backend` (HEAD `133512e`).
- **Database:** one read-only SELECT on TEST (Appendix B). PROD was not queried.
- **Google pages fetched today:** the container-ID rule, the 2026-07-09 release note, the 2026-08-20 tag upgrade note and the privacy-controls page.

**Labels.**
- Unprefixed paths are in `quicktalog-app/`; other repos are prefixed.
- **Fact** means read in code, in a cited source, or in a probe recorded in the research notes.
- **Inference** means my reasoning.
- **(snippet)** means the claim comes only from a search-result excerpt.
- **(probe)** means a headless-Chromium result recorded in a research note. The note is named next to it.

---

## 0. The answer in one page

### What the owner does
1. They open their catalogue's **Analytics** page (`/admin/<slug>/analytics`). Below the built-in numbers there is a new **Google Analytics** card.
2. They paste their GA4 **Measurement ID** (`G-XXXXXXXXXX`). Pasting Google's whole snippet also works: the card picks out the `G-` ID.
3. They press **Save**.
   - The ID is checked on the server and stored on the catalogue. It is live on the published page within seconds, with no Publish step.
   - For a draft catalogue it goes live when the catalogue is published.
4. The feature is a paid one. Pro and up is recommended; the founder decides.
5. The card refuses three kinds of ID, each with a message saying what to paste instead:
   - Google Tag Manager containers (`GTM-`);
   - Google tag IDs (`GT-`);
   - Google Ads IDs (`AW-`).

### What a visitor gets
1. The menu renders exactly as today, and nothing from Google has loaded yet.
2. A small, non-blocking notice slides up from the bottom, in the catalogue's language (English and Serbian at launch). It says that "**Bistro Luna** would like to use Google Analytics…", with two equal buttons: **Reject** and **Accept**.
3. **Accept.** Quicktalog's own bundled code then:
   - sets Google Consent Mode v2: everything denied, then analytics granted;
   - loads Google's `gtag.js` with the business's ID;
   - stores cookies that belong only to that catalogue.
4. **Reject, or no answer.** Nothing loads. The choice is remembered on that device for that catalogue for 6 months.
5. A **Privacy choices** link at the bottom of the page reopens the notice at any time.

### What Quicktalog guarantees
1. The tag is never rendered on the owner's `/preview`, in the builder or under `/admin`.
2. Quicktalog accepts **no Google Tag Manager containers and no pasted code** while catalogues share `www.quicktalog.app` with the signed-in builder.
3. Quicktalog switches **its own** GTM container and Microsoft Clarity off on published catalogue pages. Otherwise the business's consent would also switch on Quicktalog's own Google tag (verified behaviour, §8).
4. PostHog keeps counting every visit, so the traffic meter and the owner dashboard are unchanged.

### The slice
**In the one-week slice (Phase 1)**
- One `G-` field, with server validation, a plan check and immediate save.
- A database column with a CHECK.
- A published-page-only loader with basic Consent Mode.
- A per-catalogue banner (EN, SR Latin, SR Cyrillic) and a withdrawal link.
- Per-catalogue cookies.
- Guards: framed pages, soft-navigation entries, signed-in visitors, and hard exits.
- Quicktalog GTM and Clarity off published catalogues.
- A debounced search URL.
- `generate_lead` events on call, email, WhatsApp and Viber taps.
- A route-scoped CSP addition.
- An agent prompt line, tests, docs, rollout and outreach.

**Not in it** (each cut is justified in §15)
- Meta Pixel, Google Ads, `GT-` IDs, GTM and head code.
- Advanced consent mode.
- A server-side consent log.
- Item, search and directions events.
- UTM parameters on QR codes.
- Further banner languages.
- A PostHog switch to cookieless counting.
- A separate root layout for catalogues.

---

## 1. Decisions at a glance

| Topic | Choice | One-line reason |
|---|---|---|
| IDs accepted | `G-` (GA4 Measurement ID) only | Every GA4 property has one. Google states `G-` containers "can send data exclusively to Google services" ([Google](https://support.google.com/tagmanager/answer/17070049)) |
| `GTM-` | Refused until public catalogues move to a separate registrable domain | A `GTM-` container "allows all tag types… Custom HTML and JavaScript" ([Google](https://support.google.com/tagmanager/answer/17070049)), even when loaded via `/gtag/js` ([release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708)) |
| `GT-` | Refused for now, with "paste your `G-` ID" | Google's restriction text names only `G-`/`AW-` ([Google](https://support.google.com/tagmanager/answer/17070049)). Verify, then add (Phase 3) |
| `AW-` (Google Ads) | Phase 3 | Needs an advertising consent purpose, Ads CSP hosts and conversion labels: a different feature |
| Meta Pixel | Phase 2, same card and loader pattern | Needs an "Advertising" purpose and Meta joint-controller wording |
| Where the field lives | A card on `/admin/[name]/analytics` | It sits next to the built-in numbers, applies immediately, and leaves the builder's 4-column tab bar and draft model alone (§2) |
| Save semantics | Immediate, through a dedicated server action | Publishing is refused at the traffic limit, and `pickEditable` forwards client JSON unchecked (§4) |
| Storage | `catalogues.integrations jsonb not null default '{}'`, with a CHECK that admits only `{"ga4MeasurementId":"G-…"}` | One column for all future vendor IDs; the DB is the last line of defence (§3) |
| Plan flag | `features.integrations.googleAnalytics` on all six tiers | `features.analytics` already means the built-in dashboard |
| Render | A sibling client component mounted only by `src/app/catalogues/[name]/page.tsx` | Preview renders the same `<Catalogue type="view">` (§5) |
| Consent mode | **Basic** (no Google request before Accept), one purpose, banner shown to everyone | The conservative EU reading. ISR cannot geo-target, and basic mode cannot use region defaults |
| Consent storage | `localStorage["qt:consent:v1:<catalogueId>"]`, 6 months | One controller per catalogue. The record is exempt as strictly necessary |
| Cookies | `cookie_prefix` from the catalogue id + `cookie_path=/catalogues/<slug>` + `cookie_domain:'none'` + `Secure` | Separates tenants from each other and from Quicktalog's `_ga` (verified by probe, §7) |
| Data layer | Own name `qtDataLayer` via `&l=`, with a local `qtag()` | Nothing Quicktalog pushes to `window.dataLayer` can reach a tenant's container |
| Quicktalog's own tags | GTM and Clarity off `/catalogues/<slug>`. PostHog unchanged. Sentry Replay off there (rider) | Consent state is page-global (probe). PostHog drives the meter (§8) |
| Events | `page_view` plus GA4 Enhanced Measurement, plus `generate_lead` on contact taps | Useful on day one with no shared-component edits |
| Kill switch | `TENANT_TAGS_DISABLED=true` stops the published page from passing the ID | A redeploy resets the ISR cache on Vercel (inference) |

---

## 2. Owner UX

### 2.1 Where it lives, and why not the builder (inference, based on facts)
- **The builder is the wrong fit.**
  - Its tab bar is deliberately four equal columns sized for 360 px (`src/components/catalogue/inputs/sidebar/index.tsx:28-33`, `:128`).
  - Every builder field is draft-then-publish.
  - A tracking field that saves immediately would be the only exception, and owners would reasonably assume Publish is needed.
- **The Analytics page is a natural home.**
  - It is a server page that already proves ownership inside one `withUser` block (`src/app/admin/[name]/analytics/page.tsx:25-34`).
  - It is the page an owner opens when thinking about "analytics".
  - It works for draft catalogues too: `ownsCatalogue` does not check status (`src/lib/catalogue/ownership.ts:19-41`).
- **Do not reuse `LockedGroup`/`LimitsOverlay` there.** The overlay's button calls `updateCatalogue(catalogue)` with whatever the global `CatalogueContext` holds before going to `/pricing` (`src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:17`, `:26-36`). Off the builder that would save a draft of the context's default catalogue. Use a plain locked state with a link instead.
- **Optional (cut first):** a read-only row in the builder's General tab, "Google Analytics: Connected (G-…) · Manage", linking to the card.

### 2.2 The card, step by step
**Title:** Google Analytics.
**Subtitle:** "See this catalogue's visits in your own Google Analytics 4 property."

**The field**
- **Label:** Measurement ID. **Placeholder:** `G-XXXXXXXXXX`.
- **Help text:** "In Google Analytics, open Admin → Data streams → your web stream and copy the Measurement ID (it starts with G-). You can also paste Google's whole tag snippet; we'll pick out the ID." Google documents the ID format and where to find it ([Google](https://support.google.com/analytics/answer/12270356)).

**Buttons**
- **Save** is disabled until the client-side check passes.
- **Disconnect** appears once an ID is saved, asks for confirmation, and stays enabled even when the plan no longer includes the feature.

**Validation messages.** The same parser runs on the client (for instant feedback) and the strict regex runs on the server; see §4.1.

| Input | Message |
|---|---|
| Empty | "Enter your Measurement ID. It starts with G-." |
| `GTM-…` (alone or in a snippet) | "This is a Google Tag Manager container. Tag Manager isn't supported on Quicktalog catalogues. Paste your Google Analytics Measurement ID (G-…) instead." |
| `GT-…` | "This is a Google tag ID. Paste the Measurement ID that starts with G- (Google Analytics → Admin → Data streams)." |
| `AW-…` | "This is a Google Ads ID. Google Ads conversion tracking isn't available yet. Paste your Google Analytics Measurement ID (G-…)." |
| `UA-…` | "This is a Universal Analytics ID, which Google has shut down. Create a Google Analytics 4 property and paste its G- Measurement ID." |
| Digits only | "This looks like a Meta (Facebook) Pixel ID. This field only takes Google Analytics IDs." |
| A snippet with exactly one `G-` ID | Fills the field: "We found G-ABC123XYZ in your snippet." |
| A snippet with several different `G-` IDs | "Your snippet contains more than one ID. Paste the one Measurement ID for this catalogue." |
| Anything else | "That doesn't look like a Measurement ID. It starts with G- followed by letters and numbers, like G-PSW1MY7HB4." |
| Server: plan | "Your plan doesn't include Google Analytics." |
| Server: rate limit | "Too many changes. Try again in a few minutes." |
| Server: other | "Couldn't save. Please try again." |

**Status line**
- **Not connected:** shown when no ID is saved.
- **Connected:** "● Connected. Google Analytics loads on your published catalogue for visitors who accept cookies." Shown for an ID on an `active` catalogue.
- **Saved, not live:** "Saved. It starts when you publish this catalogue." Shown for an ID on a `draft` or `inactive` catalogue.
- **Plan lost** (fallback only; downgrades clear the ID, §13): "Paused: your plan doesn't include Google Analytics. [Disconnect] [See plans]".

**Locked state** (when the plan lacks the flag): "Google Analytics is available on Pro, Growth and Premium. [See plans]". Show the field dimmed and inert, with no `LimitsOverlay`.

**Expectations block** (always visible)
- "Visitors see a short cookie notice naming {business} and Google. Google Analytics only loads for visitors who tap Accept, so it will show fewer visits than the Quicktalog numbers above."
  - Industry benchmarks put opt-in at 55.7-67.6% of banners shown ([Didomi](https://www.didomi.io/blog/benchmark-average-consent-rate-europe), vendor data).
  - Gumroad and Eventbrite publish the same caveat (`../research/shared-domain-implementations.md` §5.8).
- "Your business is responsible for its Google Analytics data. Mention Google Analytics in your privacy policy."
- **Soft warning** when `legal.legalName` is empty: "Visitors will see '{catalogue heading}' as the business asking. To show your registered name, add it in the builder: Footer → Business info." The field and its rendering are in `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx` and `src/components/catalogue/view/components/CompanyInfo.tsx`. This is a warning, not a blocker: the heading already identifies the business, and a hard check against the published row would confuse owners with unpublished edits (inference).
- **Banner language:** "Notice language: Serbian (Cyrillic)", or "English (your catalogue's language isn't translated yet)".

**Test instructions** (collapsible)
1. "Open a **private (incognito) window**. We never load your tag while you are signed in to Quicktalog (§11)."
2. "Open your catalogue: [Open catalogue ↗]. Tap **Accept** on the notice."
3. "In Google Analytics, open **Reports → Realtime**. Your visit appears within a minute or so."
4. "For event detail, open **tagassistant.google.com in the same private window**, connect your catalogue's address, accept the notice in the tab it opens, then watch **Admin → DebugView**."
   - Google: debug mode is enabled through Tag Assistant ([Google](https://support.google.com/analytics/answer/7201382)).
   - Google: "Events are not visible in debug mode… if you've implemented consent mode and users have not given consent" (same page). Hence the "accept" step.

**After a successful save:** a toast "Saved. Live on your published catalogue in a few seconds." The card updates from the action's return value, with no `router.refresh`.

---

## 3. Data model and migration

### 3.1 Migration (new file via `supabase migration new catalogue_integrations`)
```sql
-- Owner-chosen tracking IDs for the published catalogue. IDs only: never markup, URLs,
-- snippets or secrets. The column is public through /api/items/<slug> and the ISR payload.
alter table public.catalogues
  add column integrations jsonb not null default '{}'::jsonb;   -- constant default: no table rewrite

alter table public.catalogues
  add constraint catalogues_integrations_check check (
        jsonb_typeof(integrations) = 'object'
    and pg_catalog.pg_column_size(integrations) < 512
    and integrations - 'ga4MeasurementId' = '{}'::jsonb          -- no other keys in v1
    and (not integrations ? 'ga4MeasurementId'
         or (jsonb_typeof(integrations->'ga4MeasurementId') = 'string'
             and integrations->>'ga4MeasurementId' ~ '^G-[A-Z0-9]{4,15}$'))
  );

comment on column public.catalogues.integrations is
  'Tracking IDs rendered on the published catalogue, e.g. {"ga4MeasurementId":"G-XXXX"}. '
  'Written only by updateCatalogueIntegrations and plan downgrades. Public.';

-- Column-level grants (20260921181104_app_role_grants_policies.sql:54-60): without these,
-- every owner write and every public read of this column fails with 42501.
grant update (integrations) on public.catalogues to app_user;
grant select (integrations) on public.catalogues to app_public;
```
- **Fact (Appendix B).** This exact expression, run as a read-only SELECT on TEST:
  - **accepts** `{}`, `G-PSW1MY7HB4` and `G-TEST123`;
  - **rejects** lowercase, `GTM-`, `GT-`, `AW-`, a `<script>` payload, a trailing newline, a 16-character suffix, a number, an array, an unknown `headCode` key, a `metaPixelId` key and a JSON null.
- **Why `app_user` has no `insert` grant here.** `app_user` already holds table-level `select, insert, delete`, while UPDATE is column-level. `app_public`'s SELECT is column-level too (`supabase/migrations/20260921181104_app_role_grants_policies.sql:54-60`).
- **Why the CHECK admits only `ga4MeasurementId`.** The write-path note also proposed `metaPixelId`. Phase 2 needs a package release anyway, so widening the CHECK then costs one small migration, and the database never admits a value no code renders.

### 3.2 pgTAP (`supabase/tests/database/10_catalogues.test.sql`, currently `plan(20)` at `:24`)
Add the following assertions and bump `plan(n)`:
- an owner can update `integrations` on their own row;
- the same update on another owner's row affects 0 rows;
- `app_public` can read `integrations` on active rows and sees no drafts;
- the CHECK raises `23514` for `GTM-…`, for an unknown key and for a script payload.

### 3.3 Order of operations (`docs/guides/drizzle.md:19-31`, `.claude/CLAUDE.md` rules)
1. Write the migration, then run `npm run test:db` and `supabase test db` locally.
2. `supabase db push` to **TEST**.
3. In `../quicktalog-packages`, run `npx drizzle-kit pull` (with `DB_ADMIN_CONNECTION_STRING` pointing at TEST) and review the diff to `src/drizzle/migrations/schema.ts`. Never hand-edit it, and never run `drizzle-kit push/generate/migrate`.
4. Package edits (one commit; the pre-commit hook bumps 1.66.0 to 1.67.0, `quicktalog-packages/.husky/pre-commit`):
   - `src/types/catalogue.ts`: add `export type Integrations = { ga4MeasurementId?: string }` and `integrations: Integrations` to the `Update` map at `:15-29`. Without the override the column types as `unknown`. `Update` maps every row key (`src/types/functions.ts:1-3`).
   - `src/constants/catalogue.ts:3`: add `integrations: {}` to `defaultCatalogueData`. It is typed `Omit<Catalogue,"id">`, so the build fails without it.
   - `src/types/general.ts:25-46`: add `integrations: { googleAnalytics: boolean }` to `PricingPlan.features`, with a doc comment saying it is *not* the built-in dashboard (`analytics: string`, `:39`).
   - `src/constants/pricing.ts`: set the value on all six tiers (Starter `:6`, Basic `:39`, Pro `:71`, Growth `:103`, Premium `:135`, custom `:167`).
5. Release the package (`docs/guides/drizzle.md:30`) and bump `@quicktalog/common` in the app.
6. **PROD:** push this migration **before** deploying any app build that reads the column.
   - Drizzle's bare `select()` and `.returning()` list every schema column. Builder load, save, publish and duplicate would therefore fail with `42703` (`src/lib/catalogue/draft-cache.ts:26-31`; the write-path note §1).
   - Without the `app_public` grant, `/api/items/[name]` would return 500. The page only calls `notFound()` for a 404, so it would render the "not found" modal, which ISR can cache for up to 24 h (`src/app/catalogues/[name]/page.tsx:11`, `:125-150`).
   - PROD already lags TEST: it still renders legacy `category` blocks (the write-path note, probe B3), so the pending migrations go first, in order.

The backend pins `@quicktalog/common ^1.42.0` and uses only `tiers` traffic limits, so it needs no change (the write-path note §1).

---

## 4. Write path

### 4.1 Shared validator (pure; imported by the card and the server)
`src/lib/integrations/google-tag.ts`:
```ts
/** GA4 measurement ID. Same pattern as the DB CHECK `catalogues_integrations_check`. */
export const GA4_MEASUREMENT_ID = /^G-[A-Z0-9]{4,15}$/;

export type GoogleTagInput =
  | { ok: true; id: string; extracted: boolean }
  | { ok: false; reason: "empty" | "gtm" | "gt" | "aw" | "ua" | "meta" | "multiple" | "format" };

// Longest prefix first, so "GTM-ABC" is never read as "G-…"-ish or "GT-".
const ANY_GOOGLE_ID = /\b(GTM|GT|AW|UA|G)-[A-Z0-9-]{2,}/gi;

export function parseGoogleTagInput(raw: string): GoogleTagInput {
  const text = raw.trim();
  if (!text) return { ok: false, reason: "empty" };
  const upper = text.toUpperCase();
  if (GA4_MEASUREMENT_ID.test(upper)) return { ok: true, id: upper, extracted: false };
  if (/^\d{8,20}$/.test(text)) return { ok: false, reason: "meta" };

  const ids = [...text.matchAll(ANY_GOOGLE_ID)].map((m) => m[0].toUpperCase().replace(/-+$/, ""));
  if (ids.some((id) => id.startsWith("GTM-"))) return { ok: false, reason: "gtm" }; // never half-accept a container
  const ga4 = [...new Set(ids.filter((id) => GA4_MEASUREMENT_ID.test(id)))];
  if (ga4.length === 1) return { ok: true, id: ga4[0], extracted: true };
  if (ga4.length > 1) return { ok: false, reason: "multiple" };
  if (ids.some((id) => id.startsWith("GT-"))) return { ok: false, reason: "gt" };
  if (ids.some((id) => id.startsWith("AW-"))) return { ok: false, reason: "aw" };
  if (ids.some((id) => id.startsWith("UA-"))) return { ok: false, reason: "ua" };
  return { ok: false, reason: "format" };
}
```
- **Why not Google's own pattern.** Google's CMS guide suggests `[A-Z]{1,3}\\w{5,}[\w]*`. It has no hyphen, so anchored it rejects every real ID, and unanchored it matches inside `GTM-…` (fact: `../research/google-tag-docs.md` §2.2, [Google](https://developers.google.com/tag-platform/devguides/gtag-integration)). The anchored regex above is the real security boundary.
- **JavaScript and PostgreSQL agree on line ends.** JavaScript's `$` (no `m` flag) and PostgreSQL's ARE `$` both refuse a trailing newline (fact: Appendix B).

### 4.2 Input schema (`src/constants/schemas.ts`, next to `qrConfigSchema` at `:458`)
```ts
export const integrationsInputSchema = z.object({
  // "" disconnects. The server never extracts from snippets: the client sends a bare ID.
  ga4MeasurementId: z.union([
    z.literal(""),
    z.string().trim().toUpperCase().regex(GA4_MEASUREMENT_ID),
  ]),
});
```
`zod` is `^3.25.76` (`package.json:89`), so `.toUpperCase()` is available.

### 4.3 Server-only DB helper (`src/lib/catalogue/integrations.ts`, `import "server-only"`)
```ts
export async function updateOwnedIntegrations(tx: Tx, me: VerifiedIdentity, name: string, next: Integrations) {
  const [row] = await tx.update(c).set({ integrations: next })
    .where(and(eq(c.name, name), eq(c.userId, me.userId)))                 // explicit owner filter
    .returning({ name: c.name, status: c.status, integrations: c.integrations });
  return row ? { ...row, integrations: row.integrations as Integrations } : null;   // null = 0 rows
}

/** For the Analytics page: the card's initial state, read in the page's existing withUser block. */
export async function readOwnedIntegrations(tx: Tx, me: VerifiedIdentity, name: string) {
  const [row] = await tx.select({ status: c.status, integrations: c.integrations, legal: c.legal,
                                  heading: c.heading, language: c.language })
    .from(c).where(and(eq(c.name, name), eq(c.userId, me.userId))).limit(1);
  return row ?? null;
}
```

### 4.4 The action (`src/actions/integrations.ts`, `"use server"`, exports only the action)
It follows `src/actions/qr-configs.ts:15-69` and the project rules: identity first, one short `withUser` block, the plan read from the database, an owner predicate, a row-count check, and revalidation after the block.
```ts
type Result =
  | { success: true; data: { integrations: Integrations; live: boolean } }
  | { success: false; error: string };

export async function updateCatalogueIntegrations(catalogue: string, input: unknown): Promise<Result> {
  try {
    const me = await getVerifiedIdentity();
    if (!me) return { success: false, error: "Unauthorized" };
    if (typeof catalogue !== "string" || catalogue.length > 200) return { success: false, error: "Catalogue not found" };

    const parsed = integrationsInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Enter the Measurement ID that starts with G-" };

    // Each save purges every catalogue's `catalogue-detail` cache (revalidate.ts:15), so bound it.
    if (!(await withinRateLimit("integrations", me.userId)))         // Redis outside the DB block
      return { success: false, error: "Too many changes. Try again in a few minutes." };

    const id = parsed.data.ga4MeasurementId;
    const next: Integrations = id ? { ga4MeasurementId: id } : {};

    const out = await withUser(me, async (tx) => {
      // Connecting needs the plan (users.plan_id + tiers, row locked). Disconnecting is always allowed.
      if (next.ga4MeasurementId && !allowsGoogleAnalytics(await getPlanForUpdate(tx, me))) return "locked" as const;
      return updateOwnedIntegrations(tx, me, catalogue, next);
    });
    if (out === "locked") return { success: false, error: "Your plan doesn't include Google Analytics" };
    if (!out) return { success: false, error: "Catalogue not found" };

    revalidateCatalogue(out.name);                                      // after the block, never inside
    return { success: true, data: { integrations: out.integrations, live: out.status === "active" } };
  } catch (err) {
    const pg = pgError(err);
    if (pg?.code === "23514" && pg.constraint === "catalogues_integrations_check")
      return { success: false, error: "That Measurement ID isn't valid" };     // DB backstop: not a Sentry event
    // Unlike upsertQrConfig (qr-configs.ts:52-57), 42501 is NOT mapped to "not found": a foreign row
    // gives 0 rows here, so 42501 can only mean a missing column grant, a deployment bug.
    Sentry.captureException(err, { tags: { op: "updateCatalogueIntegrations" } });
    console.error("Unexpected error while saving tracking settings:", err);
    return { success: false, error: "Couldn't save. Please try again." };
  }
}
```
Supporting edits:
- `src/lib/entitlements/integrations.ts`: `allowsGoogleAnalytics(tier) => tier.features.integrations?.googleAnalytics === true`. It fails closed for any tier object missing the key.
- `src/lib/rate-limit.ts:8-19`: add the rule `integrations: { requests: 20, window: "1 h" }`. The API is `withinRateLimit(rule, key)` (`:46`).

### 4.5 Draft vs immediate, and keeping the column out of every other write
**Immediate is the only safe choice here (facts)**
- Builder **Save** writes only the Redis draft (`src/actions/catalogue.ts:319-366`).
- **Publish** is refused once the month's traffic limit is reached (`src/lib/entitlements/plan.ts:67-79`). Through Publish, an owner over the limit could not even *remove* a tag.
- `pickEditable` copies whitelisted fields verbatim from the client payload on create, publish and duplicate (`src/utils/db/columns.ts:58-66`).

**Consequences**
- **Allowlists.** `integrations` goes into `PUBLIC_CATALOGUE_COLUMNS` (`src/utils/db/columns.ts:10-31`) and **not** into `CATALOGUE_EDITABLE_FIELDS` (`:38-53`). Add a comment saying why.
  - Create and duplicate therefore insert the DB default `{}`: duplicates do not inherit the ID.
  - Publish can never write it.
- **Draft cache.** In `readOwnedDraft`, add `integrations: row.integrations` to the server-owned overrides (`src/lib/catalogue/draft-cache.ts:61-71`). In `writeOwnedDraft`, strip it (`:75-82`). Otherwise a stale copy written by Save or after Publish (`src/actions/catalogue.ts:351`, `:455`) would shadow the real value wherever the builder reads it. It costs one line each, as defence in depth: the card itself reads the DB directly.
- **Semantics the owner sees.**
  - Active catalogue: live on the next request after `revalidateCatalogue` (`src/lib/cache/revalidate.ts:8-18`).
  - Draft or inactive catalogue: stored, and live from the moment it is published. `app_public` sees only `status = 'active'` (the write-path note, Q5).
  - Deleting the catalogue deletes the ID with the row.

### 4.6 Analytics page wiring
- **Read.** In `src/app/admin/[name]/analytics/page.tsx:29-31`, replace the `ownsCatalogue` check with `readOwnedIntegrations`. A null result is still a 404. `listOwnedCatalogues` stays in the same block.
- **Pass down.** Give `{ ga4MeasurementId, status, legalName, headingText, language }` to `CatalogueAnalytics` (`src/components/analytics/CatalogueAnalytics.tsx:24-73`).
- **Render.** It renders a new client component, `src/components/analytics/GoogleAnalyticsCard.tsx`, at the bottom.
- **Plan in the UI.** The card reads the plan for its locked state from `useUserContext().userData.currentPlan`, which is derived on the server from `users.plan_id`. The server re-checks on every save.
- **Unchanged.** PostHog is still called after the block closes.

---

## 5. Render path

### 5.1 Where it mounts (facts → choice)
- **Why not inside `Catalogue`.**
  - The preview renders the identical `<Catalogue item=… type="view" />` (`src/app/catalogues/[name]/preview/page.tsx:36` vs `src/app/catalogues/[name]/page.tsx:144`).
  - The catalogue route has no layout file. A `[name]/layout.tsx` would also wrap `/preview` (`ls src/app/catalogues/[name]`: `page.tsx`, `error.tsx`, `preview/`).
  - The root layout wraps everything (`src/app/layout.tsx:36-56`).
- **Choice: a sibling in the published page's `active` branch** (`src/app/catalogues/[name]/page.tsx:143-147`):
```tsx
if (item.status === "active") {
  const ga4 = process.env.TENANT_TAGS_DISABLED === "true" ? undefined : item.integrations?.ga4MeasurementId;
  return (
    <>
      <Catalogue item={item} type="view" />
      {ga4 && (
        <CatalogueTracking
          businessName={item.legal?.legalName?.trim() || htmlToText(item.heading) || kebabToTitle(item.name)}
          catalogueId={item.id}
          ga4MeasurementId={ga4}
          language={item.language}
          legal={{ address: item.legal?.address ?? "", privacyPolicy: item.legal?.privacyPolicy ?? "" }}
          slug={item.name}
          theme={item.appearance.theme.name}
        />
      )}
    </>
  );
}
```
- **How the ID reaches the client.** Props are serialized into the RSC payload, exactly like `item` already is (`src/app/catalogues/[name]/page.tsx:144`).
- **What the server decides.** Nothing per visitor: no cookies or identity are read, and the page stays ISR with `revalidate = 86400` (`:11`). Reading an env var at render time is catalogue-independent, not identity.
- **`htmlToText` and `kebabToTitle`** are already imported there (`:5-6`).
- **An architecture test** asserts that `src/app/catalogues/[name]/page.tsx` is the **only** importer of `CatalogueTracking`. Model it on `tests/unit/architecture/db-boundaries.test.ts`, so nobody later moves the tag into `Catalogue` or the preview.

### 5.2 Loader: no inline executable JavaScript
- **Not `@next/third-parties` `<GoogleAnalytics>`.** It interpolates the ID into an inline script (`node_modules/@next/third-parties/dist/google/ga.js:30-37`), drops `&l=` when the data layer is renamed (zero hits, probe P5 in `../research/google-tag-docs.md` §5.1), and has no consent support.
- **Instead,** bundled module code builds the command queue and injects one `<script src>` with `document.createElement`. There is no `dangerouslySetInnerHTML` and no inline `next/script`.
- **CSP compatibility.** If the CSP is ever tightened, our code needs no inline allowance. `'unsafe-inline'` stays for Next's own flight scripts on ISR pages, where nonces are impossible ([Next.js 15](https://nextjs.org/docs/15/app/guides/content-security-policy)).

`src/lib/integrations/gtag-loader.ts` (imported only by `CatalogueTracking`):
```ts
import { GA4_MEASUREMENT_ID } from "./google-tag";

const LAYER = "qtDataLayer";
const GTAG_SRC = "https://www.googletagmanager.com/gtag/js";
/** Issued by Google on request (CMS guide). Empty until issued; the `set` is skipped. */
const DEVELOPER_ID = "";

declare global {
  interface Window { qtDataLayer?: unknown[] }
}

/** gtag.js only honours Arguments objects; an array push is silently ignored (probe, google-tag-docs §4.6). */
function qtag(..._args: unknown[]): void {
  // biome-ignore lint/style/noArguments: gtag.js needs the Arguments object itself
  (window[LAYER] ??= []).push(arguments);
}

export const cookiePrefixFor = (catalogueId: string) => `qt${catalogueId.replace(/-/g, "").slice(0, 8)}`;
const disableKey = (id: string) => `ga-disable-${id}` as const;
let loadedId: string | null = null;

/** Call only after the visitor accepted. Order matters: consent, settings, js, config, then the library. */
export function loadGoogleTag({ id, catalogueId, slug }: { id: string; catalogueId: string; slug: string }): boolean {
  if (loadedId || !GA4_MEASUREMENT_ID.test(id)) return false;          // once per document; re-validated
  loadedId = id;
  (window as unknown as Record<string, boolean>)[disableKey(id)] = false;

  qtag("consent", "default", {                                       // 1. everything denied first...
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied",
  });
  qtag("consent", "update", { analytics_storage: "granted" });        // ...then only what was accepted

  if (DEVELOPER_ID) qtag("set", `developer_id.${DEVELOPER_ID}`, true);
  qtag("set", "ads_data_redaction", true);
  qtag("set", {                                                       // 2. page-wide, before any config
    cookie_prefix: cookiePrefixFor(catalogueId),                      //    qt3f9a2b1c_ga, qt3f9a2b1c_ga_<ID>
    cookie_domain: "none",                                            //    host-only: www.quicktalog.app
    cookie_path: `/catalogues/${slug}`,                               //    invisible to other catalogues
    cookie_flags: "SameSite=Lax;Secure",
    allow_google_signals: false,                                      //    no ad features without ad consent
    allow_ad_personalization_signals: false,
  });
  qtag("js", new Date());
  qtag("config", id);                                                 // 3. sends page_view (full URL, UTMs kept)

  const s = document.createElement("script");                         // 4. only now the library
  s.async = true;
  s.src = `${GTAG_SRC}?id=${encodeURIComponent(id)}&l=${LAYER}`;
  document.head.appendChild(s);
  return true;
}

/** Withdrawal in the same page: deny, stop GA, delete this catalogue's cookies. */
export function revokeGoogleTag({ id, catalogueId, slug }: { id: string; catalogueId: string; slug: string }) {
  qtag("consent", "update", { analytics_storage: "denied" });
  (window as unknown as Record<string, boolean>)[disableKey(id)] = true;
  const prefix = cookiePrefixFor(catalogueId);
  for (const name of [`${prefix}_ga`, `${prefix}_ga_${id.slice(2)}`]) {
    document.cookie = `${name}=; Max-Age=0; Path=/catalogues/${slug}; Secure; SameSite=Lax`;
  }
}

/** No-op unless this document loaded the tag and the visitor has not withdrawn. */
export function sendTenantEvent(name: string, params: Record<string, string | number> = {}) {
  if (!loadedId || (window as unknown as Record<string, boolean>)[disableKey(loadedId)]) return;
  qtag("event", name, { ...params, send_to: loadedId });
}
```
Sources for each command:
- `consent` default before `config`: [Google](https://developers.google.com/tag-platform/security/guides/consent).
- `allow_google_signals: false` "overrides any property settings established in the Google Analytics user interface", and `allow_ad_personalization_signals: false` adds `npa=1`. Both read on [Google](https://developers.google.com/tag-platform/security/guides/privacy) today.
- `ga-disable-<ID>`: same page.
- Cookie parameters: [Google](https://developers.google.com/tag-platform/security/guides/customize-cookies).
- `l=`: [Google](https://developers.google.com/tag-platform/devguides/datalayer).
- `ads_data_redaction`: [Google](https://developers.google.com/tag-platform/security/guides/consent).
- The session cookie is named `_ga_<ID without "G-">` (probe: `qt_ab12_ga_QTPROBEB2` for `G-QTPROBEB2`, `../research/google-tag-docs.md` §3.2).

**Why `set` and not `config` options for the cookie fields.**
- A probe found the two identical (`../research/google-tag-docs.md` §3.2).
- Since 2026-08-20 Google upgrades Google tags to Tag Manager containers that can initialise on a `gtm init` trigger "without the gtag config command" ([Google](https://support.google.com/tagmanager/answer/17079602)).
- Page-wide `set` commands queued before the library loads are the best chance of covering that case (inference). §17, risk R2, makes this a QA gate.

### 5.3 `CatalogueTracking` behaviour (`src/components/catalogue/tracking/CatalogueTracking.tsx`, client)
**On mount, in order.** If any guard fails, render nothing.
1. `GA4_MEASUREMENT_ID.test(ga4MeasurementId)` is true. This defends against a bypassed CHECK.
2. **Not framed:** `window.self === window.top`.
   - `/showcases` frames live catalogues same-origin with no sandbox (`src/components/showcases/ShowcaseFrame.tsx:64-69`). Below `lg` that frame is `pointer-events-none` (`:65`), so a banner there could not even be tapped.
   - Owners who iframe their catalogue on their own site get no GA inside the frame. Document this.
3. **The document landed on this catalogue:** `performance.getEntriesByType("navigation")[0].name` has pathname `/catalogues/<slug>`. If the API is missing, assume true.
   - Soft-navigation entries come from the dashboard's `<Link href="/catalogues/…">` (`src/components/dashboard/overview/DashboardItem.tsx:151`) and marketing links.
   - In such a document Quicktalog's GTM may already be running. Skipping keeps the two out of one document; these visitors are mostly signed-in owners anyway (inference).
4. **No Quicktalog session cookie is readable.** See §11.
5. **Read the consent record (§6).** Then:
   - `accepted` → call `loadGoogleTag`, install the hard-exit guard and the contact-tap listener, and show the "Privacy choices" bar;
   - `rejected` → show only the bar;
   - nothing stored → show the banner and the bar.

**Rendered output**
- The component renders **after** `<Catalogue>`, wrapped in the same theme class as the catalogue root (`catalogue-root ${theme}`, `src/components/catalogue/view/Catalogue.tsx:184-186`), so theme tokens apply.
- That root is `min-h-screen flex flex-col` with the footer inside (`:186`, `:264`), so the bar sits just below the catalogue footer.
- While the banner is visible, a spacer of its height keeps the footer scrollable above it.

**Hard-exit guard.** Installed only once the tag has loaded. This is Option A from `../research/code-render-path.md` §9.2; there is no route-group refactor.
- **What it fixes.** Without it, `next/link` exits keep `gtag.js` alive. GA's history listener would then record `/auth?mode=signup`, the policy pages and `/` in the tenant's property:
  - `src/components/catalogue/view/components/DefaultActions.tsx:27-33`;
  - `src/components/catalogue/view/components/LegalLinks.tsx:19-39`;
  - `src/components/catalogue/view/CatalogueHeader.tsx:115-124`, `:157-161`;
  - `src/components/catalogue/view/components/Contact.tsx:55`;
  - relative owner URLs via `src/components/general/SmartLink.tsx:54-58`.
  - Google says history page views listen to `pushState`/`popState`/`replaceState` ([Google](https://support.google.com/analytics/answer/9216061)).
- **Why a capture listener works.** No programmatic navigation exists in the view: the only `router` call is the search `replace` (grep, `src/components/catalogue/view/CatalogueContent.tsx:94`).
```ts
export function installHardExitGuard(slug: string): () => void {
  const home = `/catalogues/${slug}`;
  const onClick = (e: MouseEvent) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;                 // other sites, tel:, mailto: - browser default
    if (url.pathname.replace(/\/$/, "") === home) return;       // same catalogue (?q=, #…)
    e.preventDefault();
    e.stopImmediatePropagation();                               // runs before React's root listener on `document`
    location.assign(url.href);                                  // full load: the tag dies with this document
  };
  window.addEventListener("click", onClick, { capture: true });
  return () => window.removeEventListener("click", onClick, { capture: true });
}
```
Catalogue-to-catalogue links are exits too, so the next catalogue starts clean with its own consent.

### 5.4 Search must stop rewriting the URL on every keystroke (Phase 1, S)
- **Fact.** The search box calls `router.replace('?q=…')` on every change (`src/components/catalogue/view/CatalogueContent.tsx:88-95`).
- **Fact.** GA4's history listener reacts to `replaceState`, and `q` is one of the five default site-search keys ([Google](https://support.google.com/analytics/answer/9216061)).
- **Inference.** Unchanged, a tenant's property would get a `page_view` and a `view_search_results` per keystroke, which makes the data useless.
- **Change.**
  - Debounce the URL write by 600 ms, building params from `window.location.search` when the timer fires.
  - Keep a ref of the last value written, so the URL-to-state sync (`:97-103`) ignores echoes of our own writes.
  - Each finished search then becomes one `page_view` with `?q=` and one free `view_search_results` in GA's Site search report. Document both.

---

## 6. Consent banner

### 6.1 Scope and storage
- **One record per catalogue, keyed by the immutable catalogue id:** `qt:consent:v1:<catalogueId>`.
  - Consent must name the controller, and one origin hosts many controllers (`../research/consent.md` §4.1).
  - Slugs could be reused; ids cannot.
- **Value:** `{ v: 1, h: "ga4", a: true|false, t: ISO, id: crypto.randomUUID() }`.
  - `v` is the banner wording version: bump it when the copy changes.
  - `h` is the vendor set: `"ga4,meta"` in Phase 2 forces a re-prompt.
  - `id` makes a future server-side log trivial (Phase 2).
- **Expiry: 182 days for either answer.** The CNIL calls 6 months good practice ([CNIL FAQ Q21](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)).
- **No answer means nothing is stored** and the banner shows on the next visit.
- **Robustness.** Every read and write is wrapped in `try/catch`. Blocked storage means "no answer yet": the banner shows and the answer lasts for that page view only.
- **Exempt from consent.** A record of the user's choice counts as strictly necessary (EDPB Cookie Banner Taskforce para 30; `../research/consent.md` §4.2).
- **Rules respected.** It is client-only, so the public page still never reads a cookie, and middleware still sends no `Set-Cookie` on public paths (`src/middleware.ts:28-33`, `:66-69`).
- **Known cost.** Safari deletes script-writable storage after 7 days without interaction ([WebKit](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/)), so returning iPhone visitors are asked more often. This is acceptable.

### 6.2 Phone UX
- **Non-blocking.** A non-modal bottom sheet (`role="region"`, `aria-labelledby`), with no backdrop, no scroll lock and no focus trap. The menu stays fully usable (`../research/consent.md` §6.3).
- **Placement.**
  - Anchored to the bottom safe area, at most about 30% of a 390×844 viewport, with `z-40` so item dialogs cover it.
  - The public view has no other fixed elements; grep for `fixed`/`sticky` finds only the dialogs.
- **Buttons.**
  - **Reject** and **Accept** sit side by side, with the same size, the same style and the same weight. Taps are at least 44 px.
  - Equal first-layer reject is required (EDPB taskforce para 08; [CNIL FAQ Q37-38](https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ)).
  - No "×" button: "Accept & close" is not valid consent (VG Hannover, `../research/consent.md` §2.5).
- **Details** expands inline (`aria-expanded`). With a single purpose there are no toggles, so the first layer is already fully granular.
- **Motion and contrast.** Respect `prefers-reduced-motion`. Check contrast in all 7 standard themes, including the dark ones.

### 6.3 Copy (draft for native-speaker and counsel review)
**English (`en`)**
- **Title:** Privacy choice
- **Body:** "**{business}** would like to use Google Analytics to measure visits to this page. If you accept, cookies are stored on your device and information about your visit and device is sent to Google, which may process it outside the EU, including in the USA. Google Analytics loads only if you accept. You can change your choice at any time with "Privacy choices" at the bottom of the page."
- **Buttons:** [Reject] [Accept] · Details
- **Details**
  - **Who is asking:** {legal name}{, address}
  - **Purpose:** visit statistics only. No advertising or ad personalisation.
  - **Who receives the data:** Google Ireland Limited and Google LLC (USA), as the business's service provider.
  - **Cookies:** `{prefix}_ga` and `{prefix}_ga_{id}`, kept for up to 2 years (Google's default, [Google](https://support.google.com/analytics/answer/11397207)), used only on this catalogue's pages.
  - **Hosting:** "This page is hosted by Quicktalog, which shows this choice for {business} and keeps your answer only on your device."
  - **Links:** {business}'s privacy policy, shown only if `legal.privacyPolicy` parses as an absolute `https:` URL, because the AI schema treats that field as text up to 20,000 characters (`src/agent/tools/navigation.ts:96`). Google's "How Google uses information from sites that use our services" page: the URL is `https://policies.google.com/technologies/partner-sites`, not fetched here, so verify it during implementation.
- **Bottom bar:** "Privacy choices"

**Serbian, Latin script (`srp_latn`)**
- **Title:** Izbor privatnosti
- **Body:** "**{business}** želi da koristi Google Analytics za merenje poseta ovoj stranici. Ako prihvatite, na vašem uređaju se čuvaju kolačići, a podaci o vašoj poseti i uređaju šalju se kompaniji Google, koja ih može obrađivati i van EU, uključujući SAD. Google Analytics se učitava samo ako prihvatite. Izbor možete promeniti u svakom trenutku preko „Podešavanja privatnosti“ na dnu stranice."
- **Buttons:** [Odbij] [Prihvati] · Detalji
- **Bottom bar:** Podešavanja privatnosti

**Serbian, Cyrillic script (`srp`)**
- **Title:** Избор приватности
- **Body:** "**{business}** жели да користи Google Analytics за мерење посета овој страници. Ако прихватите, на вашем уређају се чувају колачићи, а подаци о вашој посети и уређају шаљу се компанији Google, која их може обрађивати и ван ЕУ, укључујући САД. Google Analytics се учитава само ако прихватите. Избор можете променити у сваком тренутку преко „Подешавања приватности“ на дну странице."
- **Buttons:** [Одбиј] [Прихвати] · Детаљи
- **Bottom bar:** Подешавања приватности

**Picking the language**
1. The catalogue's `language`, when we have copy for it: `srp` gives Cyrillic, `srp_latn` gives Latin. The 32 codes are listed in `src/lib/catalogue/items.ts:60-93`.
2. Otherwise the first supported `navigator.languages` entry: an `sr` tag containing `Latn` gives Latin, any other `sr` gives Cyrillic, `en` gives English.
3. Otherwise English.

The visitor is already reading the menu in the catalogue's language, which is why it comes first (inference). The catalogue UI has no translation system today: "Search items…" and "Privacy Policy" are hard-coded English (`src/components/catalogue/view/CatalogueSearchBar.tsx:15`, `LegalLinks.tsx:20-31`). This dictionary is therefore new and self-contained, at `src/components/catalogue/tracking/consent-copy.ts`.

### 6.4 Consent Mode v2 flow (basic mode)

| Moment | What happens |
|---|---|
| Page load, no stored answer | No `qtDataLayer`, no request to any Google host. The banner shows |
| Accept | `writeConsent(true)`, then `loadGoogleTag`: `consent default` (all denied) → `consent update` (`analytics_storage: granted`) → `set` → `js` → `config` → inject `gtag.js`. Probe values: `gcs=G101` for analytics-only consent (`../research/google-tag-docs.md` §4.4) |
| Reject or ignore | `writeConsent(false)` (or nothing). No Google request, ever, for that page view |
| Return visit, valid accept | Load directly, no banner |
| Return visit, valid reject | Bar only |
| Privacy choices → Reject after accepting | `revokeGoogleTag`: `consent update` denied, `ga-disable-<ID>=true`, delete the two prefixed cookies, store the reject |
| Privacy choices → Accept after rejecting | `loadGoogleTag` in place |

**Why basic, not advanced.**
- Google's platform guide asks platforms to load tags before consent, so that they send cookieless pings ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration)).
- EDPB Guidelines 2/2023 treat JavaScript-built requests as "gaining access" under ePrivacy Art. 5(3) ([EDPB](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf), paras 50-53).
- For a platform carrying many EU and Serbian small businesses, basic mode is the defensible default.
- Every shared-origin analogue inspected also blocks the scripts until consent: Linktree, Calendly, and Tally with its banner on (`../research/shared-domain-implementations.md` §5.7).
- Advanced mode becomes a possible owner opt-in only after counsel review (Phase 3).

**Why the banner is shown everywhere.**
- An ISR page cannot vary by visitor geography.
- Region-scoped defaults only apply once `gtag.js` has loaded, which basic mode prevents (`../research/google-tag-docs.md` §4.3).
- Serbia's 2023 Electronic Communications Law, Art. 160(4), requires consent anyway ([Paragraf](https://www.paragraf.rs/propisi/zakon-o-elektronskim-komunikacijama.html), translated in `../research/consent.md` §2.8).

---

## 7. Cookie and data-layer isolation

Probe facts are from `../research/code-render-path.md` Appendix A and `../research/google-tag-docs.md` §3.2 and §4.6.
- **The standard snippet shares visitor IDs.** With a shared `dataLayer`, the customer's GA4 reused Quicktalog's `_ga` client ID. Every property on `.quicktalog.app` would see the same visitor ID.
- **Platform scoping separates tenants.** With `cookie_prefix` + `cookie_path` + `cookie_domain:'none'`:
  - cookies became `qt…_ga` and `qt…_ga_<ID>`, host-only, at path `/catalogues/<slug>`, `Secure`;
  - two catalogues got **distinct** client IDs.
- **The first-visit collision.** On a visitor's very first page load with Quicktalog's container on the page, Quicktalog's tag and the tenant's tag minted the **same** ID. Removing Quicktalog's GTM from catalogue pages (§8) removes this case.
- **Consent state is page-global across differently named layers.** A tenant's `consent default` on its own layer put `gcs=G100` on Quicktalog's own GA4 hits. Another reason Quicktalog's Google tag must not share the page.

**Design choices**
- **Prefix:** `qt` + the first 8 hex digits of the catalogue UUID.
  - It is short and unique per catalogue.
  - It is not derived from the slug, so renaming slugs later would not orphan cookies.
  - It must differ from Quicktalog's `_ga`; a path alone would collide on the name.
- **Path:** `/catalogues/<slug>`.
  - By RFC 6265 path-matching, the cookies are sent to `/catalogues/<slug>` and its sub-paths (including `/preview`, where nothing reads them).
  - They are **not** sent to `/catalogues/<slug>-other`, and other catalogues' scripts cannot read them through `document.cookie` (inference from the RFC).
  - Slugs are `^[a-z0-9]+(-[a-z0-9]+)*$` (`supabase/migrations/20260921181107_validate_after_audit.sql:12-14`), so they are safe in a cookie path.
- **Domain:** `'none'` gives host-only `www.quicktalog.app`, so `test.quicktalog.app` and sibling subdomains are out.
- **Data layer:** `qtDataLayer` via `&l=`, with a local `qtag`, never a global `gtag` or `dataLayer`.
  - **Where the notes disagree.** `../research/google-tag-docs.md` §3.4 prefers the default `dataLayer` once Quicktalog's GTM is gone; `../research/code-render-path.md` §10.3 prefers a custom name.
  - **Choice: the custom name.** The tenant container is, since 2026-08-20, a remotely configured Tag-Manager-class container that can read Data Layer Variables. Existing Quicktalog code pushes `{event:…}` objects to `window.dataLayer` (`src/utils/cookies.ts:73-83`). A private layer guarantees none of that ever reaches a tenant.
  - **Evidence it works.** The probe showed `gtag.js` honours `&l=` (hits sent, `../research/code-render-path.md` App. A, scenario B).
  - **Fallback.** If Tag Assistant fails to attach in QA (§12.3), switch to the default name: a one-line change, safe because no other Google tag is on these pages.
- **Residual, accepted for now.** Quicktalog's *own* earlier cookies (`_ga` from marketing visits, PostHog's `ph_…_posthog`) sit at path `/` on `.quicktalog.app`. A tenant container's "First Party Cookie" variable could read them. That is a pseudonymous cross-tenant join key, not a credential (inference); the long-term fix is §11.4.

---

## 8. Quicktalog's own tags on published catalogues

| Tool | Today (fact) | Phase 1 change | Why |
|---|---|---|---|
| GTM `GTM-W9RHLVK6`: GA4 `G-RXHJ9X3T5T`→`G-DT7TJQYK3K`, a URL-named event, Hotjar | Root-layout `<head>` on every route (`src/app/layout.tsx:46-49`). No consent settings in container v6 (LIVE parse, `../research/code-render-path.md` §6.4) | **Off** on `^/catalogues/[^/]+/?$`. Kept on `/preview`, `/admin` and marketing | (1) A tenant's Accept would switch on Quicktalog's GA4 (probe, §7). (2) First-visit client-ID collision. (3) It runs GA4 and Hotjar unconsented: VG Hannover held that GTM itself needs consent (`../research/consent.md` §2.5). (4) It is a remotely editable script channel on tenant pages |
| Microsoft Clarity `t0vbket8rt` | Same root `<head>` (`src/components/general/ClarityScript.tsx:5-17`) | **Off** on the same pattern | Session recording is not exempt. Clarity "honors GCM consent signals" ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-gcm)), so it could ride a tenant's consent. It has enforced consent for the EEA, UK and CH since 2025-10-31 ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-consent-api-v2)) |
| PostHog `$pageview` | `capture_pageview: true`, default persistence (`src/instrumentation-client.ts:5-19`). Feeds the owner dashboard (`src/lib/analytics/catalogue-traffic.ts:30-36`) and the meter (`quicktalog-backend/src/utils/analytics.ts:1-27`) | **Unchanged** | It is load-bearing for `canActivate` and the worker's deactivation. It does not read Google consent, so the tenant banner does not affect it. Gating it behind the tenant banner would drop roughly a third or more of visits from the meter (inference from the Didomi opt-in rates). Its own legal gap (persistent IDs without consent) is pre-existing; fix it in a parallel plan (§14, Phase 2) |
| Sentry errors + Replay | `replayIntegration()`, error-only replay, `sendDefaultPii: false` (`src/instrumentation-client.ts:20-42`) | Errors unchanged. **Replay off** on published catalogue documents (rider; can be dropped from the PR) | Replay buffers the DOM and writes `sentryReplaySession` (`../research/consent.md` §1.1). Not strictly necessary on a business's page |
| Clerk/Supabase auth SDK, `UserContext` | `PageWrapperClient` on every route (`src/components/general/PageWrapperClient.tsx:15-25`) | Unchanged | Removing it needs a separate root layout (Option C, Phase 3) |

Implementation, about 15 lines:
- **A new client wrapper**, `src/components/general/QuicktalogTags.tsx`:
```tsx
"use client";
const PUBLIC_CATALOGUE = /^\/catalogues\/[^/]+\/?$/;
export function QuicktalogTags({ gtmId }: { gtmId?: string }) {
  // A published catalogue is the business's page: no Quicktalog GTM (GA4, Hotjar) or Clarity there.
  if (PUBLIC_CATALOGUE.test(usePathname() ?? "")) return null;
  return (<><ClarityScript />{gtmId && <GoogleTagManager gtmId={gtmId} />}</>);
}
```
  `GoogleTagManager` is itself a client component (`'use client'` at the top of `node_modules/@next/third-parties/dist/google/gtm.js`).
- **Layout:** `<head><QuicktalogTags gtmId={process.env.GTM_ID} /></head>` replaces `src/app/layout.tsx:47-48`.
- **Sentry:** `integrations: /^\/catalogues\/[^/]+\/?$/.test(location.pathname) ? [] : [Sentry.replayIntegration()]` at `src/instrumentation-client.ts:26`.

**Soft-navigation caveat (inference).**
- Landing on marketing and soft-navigating into a catalogue keeps an already-loaded GTM running in that document.
- That document never loads a tenant tag (the landing guard, §5.3), so the two still never coexist.
- Quicktalog's own GA4 recording that one view is the pre-existing behaviour, on a rare path.

**Effects to accept**
- Quicktalog loses its own GA4, Hotjar and Clarity data for catalogue pages. PostHog remains the source of truth.
- The hard-exit guard turns some soft navigations into full loads. The destination page then gets its own PostHog `$pageview`. The render-path note reads PostHog's minified code as counting only hard loads when `capture_pageview: true`; that was read, not run (`../research/code-render-path.md` §5, labelled inference there). For catalogue-to-catalogue links this would make the meter slightly more accurate.

---

## 9. CSP

**Facts**
- The CSP is `Content-Security-Policy-Report-Only` on `/:path*`, with no report endpoint (`next.config.ts:47-70`).
- PROD sends no CSP at all (`../research/code-render-path.md` §1).
- `script-src` already allows `https://*.googletagmanager.com` (`:50`). `img-src` is `https:` (`:53`). `connect-src` has `*.google-analytics.com` and `*.googletagmanager.com` but not `*.google.com` (`:55`). `frame-src` lacks googletagmanager (`:56`).

**What Google requires**
- GA4 without Ads features needs `connect-src … https://*.google.com` ([Google CSP guide](https://developers.google.com/tag-platform/security/guides/csp)).
- EU collection needs `*.analytics.google.com` ([Google](https://support.google.com/analytics/answer/12017362)).

**Change (S).** Build the policy from a directive map, and add a second header rule that carries the tenant hosts **only** for published catalogues. When two rules set the same key for a path, Next uses the last one, and `/catalogues/:name` does not match nested paths ([Next.js](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers)).
```ts
const CATALOGUE_CSP = {
  ...BASE_CSP,
  "connect-src": [...BASE_CSP["connect-src"], "https://*.analytics.google.com", "https://*.google.com"],
  "frame-src": [...BASE_CSP["frame-src"], "https://www.googletagmanager.com"],   // service-worker/iframe paths
};
return [
  { source: "/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(BASE_CSP) }] },
  { source: "/catalogues/:name", headers: [{ key: "Content-Security-Policy-Report-Only", value: serialize(CATALOGUE_CSP) }] },
];
```
- `/admin/*` and `/catalogues/<slug>/preview` do not widen.
- Our loader adds no inline script.
- **The CSP is not the security boundary** (`'unsafe-inline'`/`'unsafe-eval'` stay, nonces are impossible on ISR). ID validation is.
- Adding a `report-to` endpoint and enforcing the policy are separate work; enforcing today would also break 36 of 37 embed hosts (`../../2026-09-30-content-block-strategy/reports/Quicktalog content block strategy.md`).

---

## 10. Events Quicktalog sends, and UTM

**Phase 1**
- **`page_view`** is sent automatically by `config`, with the full URL, so UTM parameters arrive in Page location ([Google](https://support.google.com/analytics/answer/10917952)).
- **The owner's Enhanced Measurement defaults** add scrolls, outbound clicks and site search ([Google](https://support.google.com/analytics/answer/9216061)).
  - Outbound clicks include `wa.me` and Google Maps links. Owners get these with no code from us.
  - Site search works once §5.4 debounces the URL.
- **`generate_lead`** on contact taps comes from one delegated listener installed by `CatalogueTracking` after the tag loads. No shared component changes.
  - `generate_lead` is a GA4 recommended event and is on Google's CMS core list ([Google](https://support.google.com/analytics/answer/9267735), [Google](https://developers.google.com/tag-platform/devguides/gtag-integration)).
  - `tel:`, `mailto:` and `viber:` are not "outbound" links, so Enhanced Measurement misses them (inference, `../research/google-tag-docs.md` §7.1).
  - Contact links in the view: `src/components/catalogue/view/CatalogueHeader.tsx:86-109`, `src/components/catalogue/view/components/Contact.tsx:22,40`.
```ts
const LEAD_SOURCES: [RegExp, string][] = [
  [/^tel:/i, "phone"], [/^mailto:/i, "email"], [/^viber:/i, "viber"],
  [/^(https:\/\/(wa\.me|api\.whatsapp\.com)\/|whatsapp:)/i, "whatsapp"],
];
// document capture listener: closest("a[href]") → first match → sendTenantEvent("generate_lead", { lead_source })
```
  This is the first item to cut if Phase 1 runs long.

**Phase 2**
- `view_item` when the item modal opens. It needs a `data-` attribute on the card or a hook in `CatalogueContent`.
- `select_content` or `get_directions`, and `book_appointment`, from the planned Buttons and Hours & Location blocks.
- A `search` event only if GA's automatic `view_search_results` proves insufficient.
- Attach `developer_id.<id>` to every event once Google issues it ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration)).

**UTM on QR codes (Phase 2, S-M).**
- **Fact.** QR codes are pinned to `${NEXT_PUBLIC_BASE_URL}/catalogues/<slug>` on the server (`src/lib/qr/design.ts:143-146`).
- **Proposal.** A fixed-choice option in the QR editor ("Add tracking tags for Google Analytics") appends `?utm_source=qr&utm_medium=print&utm_campaign=<slug>`, chosen on the server, never free text.
- **Effects that are already measured.**
  - Query strings did not fragment the ISR cache on PROD (`x-vercel-cache: HIT`, same `age`; the write-path note §6, probe B1).
  - Pageviews fold into the right catalogue (the worker's slug regex stops at `?`).
  - `unique_visitors` in the rollup is already an upper bound (`docs/architecture/analytics.md:30`).
- **Cost.** The code becomes denser; the editor already shows the version and scan risk.
- **Meanwhile.** Phase 1 docs tell owners they can add `utm_*` to links they share themselves. Search keeps other query parameters (`src/components/catalogue/view/CatalogueContent.tsx:90`).

---

## 11. Security and AI-agent exclusion

### 11.1 Layers of ID validation
1. **Client parser:** UX only.
2. **Server Zod regex:** the security boundary.
3. **DB CHECK:** the backstop if any other writer appears.
4. **Loader re-check** before building the URL with `encodeURIComponent`.

The ID is never interpolated into script text.

### 11.2 Never on preview or admin
- **Mount point.** Only the published page mounts the component (§5.1), enforced by the architecture test.
- **Middleware.** It already treats `/catalogues/*/preview` as a session path (`src/middleware.ts:32-36`).
- **Calendly does the same.** It never loads `gtag.js` in preview embeds (`../research/shared-domain-implementations.md` §2.2).

### 11.3 The signed-in session guard
**The threat chain**
1. Since 2026-08-20, a `G-` tag can be managed as a Tag Manager container ([Google](https://support.google.com/tagmanager/answer/17079602)).
2. `G-` containers may run Google-provided tags *and variables*. Google's restrict doc lists First Party Cookie, DOM Element and JavaScript Variable in the `google` class (fact, `../research/google-tag-docs.md` §2.4).
3. Supabase's session cookie is "Deliberately NOT `httpOnly`", at path `/`, for 400 days (`src/lib/auth/cookie-options.ts:8-21`).
4. Clerk's `__session` is readable by scripts (`../research/code-render-path.md` §10.7).

**Inference, untested.** A malicious tenant could configure their container to read a signed-in visitor's session cookie and send it to their own property. That visitor could be another owner, or a Quicktalog admin.

**Mitigation (about 10 lines)**
- If a Quicktalog session cookie is readable, never load a tenant tag.
- Cookie names come from the code:
  - Clerk: `__session`, `__refresh`, with optional `_<suffix>` (`src/utils/supabase/session.ts:8-16`, `:80`).
  - Supabase: `sb-<ref>-auth-token`, chunked `.N` (`src/lib/auth/cookie-options.ts:24-33`; `src/utils/supabase/session.ts:115`).
```ts
const SESSION_COOKIE = /(?:^|;\s*)(?:__session(?:_[^=;]*)?|__refresh(?:_[^=;]*)?|sb-[a-z0-9]+-auth-token(?:\.\d+)?)=/;
export const hasQuicktalogSession = () => { try { return SESSION_COOKIE.test(document.cookie); } catch { return false; } };
```
- **Side effect:** owners' own visits never pollute their GA. **Cost:** owners must test in a private window (§2.2).
- **Not relaxed for `?gtm_debug=`.** Anyone can add that parameter to a link sent to a signed-in victim.

### 11.4 The real fix is a separate domain (§13)
Until then, a validated `G-` ID is the ceiling. Every other shared-origin platform inspected draws the same line (`../research/shared-domain-implementations.md` §5.2).

### 11.5 The AI agent cannot reach the setting (facts)
- **The tool schema is closed.** `catalogueFieldsSchema` is a closed `z.object` (`src/agent/tools/general.ts:8-49`).
- **The applier copies named fields only** (`src/lib/catalogue/operations.ts:474-534`, per the write-path note §5).
- **The snapshot lists fields explicitly** (`src/agent/session.ts:375-419`).
- **The column is not editable.** It is not in `CATALOGUE_EDITABLE_FIELDS`, so even a forged draft cannot persist it.

**Add a line to `settingsRules`** (`src/agent/instructions.ts:48-53`): "Tracking (Google Analytics, Google Tag Manager, Meta Pixel) is not something you can set. If asked, tell the user to open the catalogue's Analytics page and paste their Google Analytics Measurement ID (it starts with G-) under Google Analytics. Never put a tracking snippet or tag into an embedding or custom_code section."

This complements `:73` ("Never copy … tracking snippets"). Today, "add my GA, here is the snippet" can still produce an embed block whose script the sanitizer silently strips.

### 11.6 Public by design
`/api/items/<slug>` returns every `PUBLIC_CATALOGUE_COLUMNS` field (`src/app/api/items/[name]/route.ts:16-25`). That is fine for a GA ID, which every tagged site exposes anyway. **Never** put a secret in this column; that rules out, for example, a Meta Conversions API token. The CHECK enforces the key list.

---

## 12. Testing, docs, rollout, outreach

### 12.1 Unit tests (Vitest; conventions in `tests/unit/server_actions/qr-configs.test.ts`)
- **`tests/unit/lib/integrations/google-tag.test.ts`.** The parser and regex table must match Appendix B sample for sample. Cover snippet extraction, GTM inside a snippet, several `G-` IDs, a trailing newline and lowercase input.
- **`tests/unit/server_actions/integrations.test.ts`.** Cover:
  - identity before anything else;
  - invalid input never reaches `withUser`;
  - Starter is refused for connect but allowed to disconnect;
  - 0 rows gives "Catalogue not found";
  - `23514` returns a message and no Sentry event;
  - `42501` *does* go to Sentry;
  - `revalidateCatalogue` runs after `withUser` resolves;
  - the rate limit is applied;
  - no Redis call happens inside the block.
- **`tests/unit/entitlements/plan-limits.test.ts`.**
  - `CATALOGUE_EDITABLE_FIELDS` excludes `integrations` and `pickEditable` drops it.
  - `PUBLIC_CATALOGUE_COLUMNS` includes it.
  - Every tier has a boolean `features.integrations.googleAnalytics`.
- **New `tests/unit/lib/catalogue/draft-cache.test.ts`.** `readOwnedDraft` keeps the row's `integrations` over a draft value, and `writeOwnedDraft` strips it.
- **`tests/unit/paddle/process-webhook.test.ts`.**
  - Cancel to Starter clears and revalidates.
  - Activation of a tier without the flag clears and revalidates.
  - An upgrade leaves the ID untouched.
- **Agent tests.** The schema strips `integrations`, `snapshot()` contains no `G-`, and the new prompt line is present (`instructions.test.ts` asserts prompt text).
- **New `tests/unit/components/catalogue-tracking.test.tsx`** (happy-dom). Cover:
  - no `script[src*="gtag/js"]` before Accept, or after Reject;
  - after Accept, exactly one script with `src = https://www.googletagmanager.com/gtag/js?id=G-TEST123&l=qtDataLayer`;
  - the `qtDataLayer` entries are Arguments objects in the order consent default → update → set… → js → config;
  - cookie fields as specified;
  - nothing when framed, when a `__session` or `sb-x-auth-token` cookie exists, or when the navigation entry's path differs;
  - a stored, unexpired accept loads without a banner; an expired record or a different `v`/`h` shows the banner;
  - withdrawal calls the deny update, sets `ga-disable` and expires the cookies;
  - the exit guard calls `location.assign` for `/privacy-policy` but not for `?q=x`;
  - a `tel:` tap pushes `generate_lead` with `send_to`.
- **Search.** A burst of keystrokes calls `router.replace` once.
- **`QuicktalogTags`.** It renders nothing for `/catalogues/x` and renders for `/` and `/catalogues/x/preview`.
- **Architecture.** Only `src/app/catalogues/[name]/page.tsx` imports `CatalogueTracking`.

### 12.2 Database
pgTAP as in §3.2, and `npm run test:db`. PGlite applies only `PHASE_MIGRATIONS` (the write-path note §1), so pgTAP is the real gate here.

### 12.3 End-to-end on TEST only (`playwright.config.ts:22-26` refuses production)
**Setup**
- Put an eligible TEST user on a Pro price (through the Paddle sandbox or a seed; my SQL access was read-only).
- In every context, route-abort `*.google-analytics.com`, `*.analytics.google.com`, `www.google.com` and `*.doubleclick.net`, so no real property ever receives data.

**Scenarios**
1. Save `G-TEST1234` on the Analytics page and publish the catalogue.
2. In a fresh signed-out context, assert there is no `googletagmanager.com/gtag/js` request until Accept, then exactly one, containing `id=G-TEST1234&l=qtDataLayer`.
3. Reload: no banner, and the tag loads.
4. Reject in a new context: zero gtag requests across two reloads.
5. Signed-in owner on `/catalogues/<slug>/preview`: no banner and no gtag request.
6. Signed-in context on the public page: no tag (the session guard).
7. Disconnect: the next load shows no banner.
8. A link from the catalogue to `/privacy-policy` after Accept produces a full document navigation.

### 12.4 Manual QA (needs a Quicktalog-owned GA4 property)
- **Realtime** shows a visit after Accept, and **DebugView** works via Tag Assistant in a private window. If Tag Assistant will not attach with `&l=`, use the §7 fallback.
- **Cookie names, scope, path and `Secure`** in Chrome, **Safari iOS** and **Firefox**. Only Chromium was probed.
- **Risk R2 gate:** in the QA property, enable the upgraded-container `gtm init` behaviour, then confirm the prefixed and path-scoped cookies still apply.
- **One `page_view` per search, not per keystroke**, with Enhanced Measurement on.
- **The banner at 360 px** in all 7 themes, in EN and both Serbian scripts. The bar sits below the footer; the spacer works.

### 12.5 Docs and skills to update
- **New:** `docs/architecture/catalogue-tracking.md`, listed in `docs/README.md`. It covers:
  - storage, the CHECK and the grants;
  - the dedicated action and why it bypasses the draft;
  - the plan flag and downgrade clearing;
  - mount-point rules and guards;
  - consent order and storage;
  - cookie and layer isolation;
  - the CSP rule;
  - why GTM/GT/AW are refused;
  - why GA4 differs from the dashboard;
  - the kill switch.
- **Update:**
  - `docs/architecture/analytics.md`: Quicktalog's GTM and Clarity are no longer on catalogue pages; PostHog is still the meter; GA4 vs PostHog.
  - `docs/architecture/catalogue-html-safety.md`: tracking is a typed setting, not a fifth sink; the session guard.
  - `docs/architecture/data-access.md`: the new column grants.
  - `docs/architecture/ai-chat-flow.md`: the agent cannot set tracking.
  - `docs/architecture/qr-codes.md`: only when UTM ships.
- **Owner help:** `src/content/docs/connect-google-analytics.tsx`, registered in `src/content/docs/registry.ts` and cross-linked from `track-performance.tsx`. Steps, test instructions, numbers differ, GTM not supported, consent behaviour.
- **Skills:**
  - `.claude/skills/server-action-and-route`: an "immediately-applied setting outside the draft" pattern, plus the 42501 nuance.
  - `.claude/skills/data-revalidation`: an integrations row (action plus downgrade revalidation).
- **Plan files:** `.claude/plans/README.md` and a PLAN.md for this folder when the founder approves. Not written here, per my file rules.

### 12.6 Rollout
1. TEST: migration, package release, app on `test`, unit tests, e2e and manual QA.
2. **PROD prerequisites.** This feature uses the new data layer (`withUser`, `app_user`/`app_public`), which exists only on `test`. It therefore ships **with or after the release that brings `test` to `main`**, which is coupled to the Supabase Auth cutover (`.claude/plans/README.md`, "PROD cutover pending").
   - Apply all pending PROD migrations in order, including our migration.
   - Only then deploy.
3. **Launch state.** The plan flags are `true` for the chosen tiers in the release, so there is no feature-flag service.
   - **Kill switch:** set `TENANT_TAGS_DISABLED=true` and redeploy. No page passes an ID any more; a new deployment starts with an empty ISR cache (inference about Vercel).
   - The card can stay; IDs stay stored.
4. **Pricing UI rows:** S, optional for launch.
   - `src/constants/pricing.ts:24-59`, `:112-204`;
   - `src/components/dashboard/subscription/PlanFeatures.tsx:32-59`.

### 12.7 Outreach to owners whose tracking snippets stop
**Correction to the brief.** "Custom code ran first-party until `e87e1f2` (2026-09-15), so owners silently lost tracking then" is true **on TEST only**.
- **PROD runs code matching `origin/main` (2026-05-09).** There, embed *and* custom-code blocks re-create scripts first-party with no sanitizer (LIVE chunk check, `../research/code-render-path.md` §1). PROD owners' pasted GA, GTM or Pixel snippets therefore **still run today**.
- **They will stop on the day `test` reaches PROD.** The GA setting should ship in that release, or the email should say when it arrives.

**Finding the owners.** Use the read-only PROD audit query already drafted and syntax-checked on TEST (`../research/code-write-path.md` §7). It needs the founder's go-ahead.
- **Add two read-only counts to the same request:** active catalogues by `language` (it decides which banner languages come next) and by plan.
- **Limitation:** Redis drafts are not covered.

**Segments**

| Who | Message |
|---|---|
| GA4 snippet, eligible plan | "On {date} Quicktalog stops running pasted scripts, for security. Your Google Analytics keeps working if you paste your Measurement ID (G-…) under Analytics → Google Analytics. Visitors will now be asked for consent first, so expect fewer recorded visits than before." |
| GTM container | "Google Tag Manager isn't supported on quicktalog.app, for security. If your container only ran Google Analytics, paste your G- Measurement ID instead. Tell us what else it ran; we are adding Meta Pixel next." |
| Meta Pixel snippet | "Your Pixel stops on {date}. Built-in Meta Pixel support is coming; we will email you when it is ready." |
| Snippet on a plan without the feature (UI-gated blocks were never enforced on the server, so these can exist) | The GA4 text plus the upgrade path |

**Timing:** send 7 days before the release. **Tone:** do not present the old snippets as legitimate; they ran without visitor consent.

---

## 13. GTM position and the separate-domain path
- **Position: refused for now.**
  - A `GTM-` container may run third-party scripts and Custom HTML even when loaded via `/gtag/js` ([Google](https://support.google.com/tagmanager/answer/17070049); [release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708)).
  - On `www.quicktalog.app` that is arbitrary first-party JavaScript on the builder's origin, where session cookies are script-readable (§11.3).
  - The CSP cannot contain it (`'unsafe-inline' 'unsafe-eval' *.googletagmanager.com`; no nonces on ISR).
- **Precedent.** Calendly says it "doesn't support direct integration with Google Tag Manager" ([Calendly](https://calendly.com/help/calendly-google-analytics)). Platforms that allow GTM or code put tenant pages on another origin:
  - Gumroad runs snippets on `gumroad-analytics.com`, and a 2025 pentest rated stored XSS there "Info" for that reason ([Hacktron report](https://www.hacktron.ai/reports/Gumroad_01.pdf));
  - Tally allows code only on custom domains ([Tally](https://tally.so/help/code-injection)).
- **The path to GTM (Phase 3, L+).** Serve published catalogues from a separate registrable domain that shares no cookies with the builder. Ideally it is listed on the Public Suffix List, as `myshopify.com` and `carrd.co` are.
  - **Then** a GTM container ID field becomes reasonable, with the same consent banner (basic mode), never on preview or admin.
  - **Coupled changes** that must move together (`../research/code-write-path.md` §6):
    - QR pinning (`src/lib/qr/design.ts:143-146`);
    - the worker's domain filter (`quicktalog-backend/src/utils/analytics.ts:6-7`);
    - the dashboard's `$host` match (`src/lib/analytics/catalogue-traffic.ts:56`);
    - canonical, OG and sitemap entries;
    - 301s from old URLs;
    - the CRM views' hard-coded catalogue URLs.
  - **Free-form head code stays out** even then, unless it runs on that separate origin.

---

## 14. Plan gating
- **Flag:** `features.integrations.googleAnalytics: boolean` on all six tiers (`quicktalog-packages/src/constants/pricing.ts`). The name is explicit because `features.analytics` already means the dashboard tier (`quicktalog-packages/src/types/general.ts:39`).
- **Recommended values** (founder decides):
  - Starter `false`;
  - Basic `false`;
  - Pro `true`;
  - Growth `true`;
  - Premium `true`;
  - custom plan id 5 `true`. It already has `embedding: true`, so it is Pro-equivalent (`pricing.ts:167-186`).
- This matches the analogues: Linktree Pro and Premium, Calendly paid plans, Tally Pro (`../research/shared-domain-implementations.md` §5.1).
- **Server enforcement.** Connecting requires the flag, read through `getPlanForUpdate` (`src/lib/entitlements/plan.ts:27-38`), inside the action. Disconnecting never does.
- **Render time cannot check the plan.** `app_public` cannot read `users`, and the page never sees `user_id` (`src/utils/db/columns.ts:6-9`). Downgrades must therefore change stored data.
- **Downgrades.** Add `clearUnentitledIntegrations(tx, userId, tier): Promise<string[]>` in `src/lib/entitlements/catalogue.ts`. It runs `update … set integrations='{}' where user_id=$1 and integrations <> '{}' returning name` when the tier lacks the flag. Call it in **both** webhook branches that change `users.plan_id`:
  - cancellation to Starter (`src/utils/paddle/process-webhook.ts:157-187`);
  - activation or resume at a new price (`:131-155`), which today never reconciles anything.
  - **Revalidate the returned names after commit.** Today only deactivated catalogues are revalidated (`:213-215`), so a removed tag could otherwise keep serving for up to 24 h (`src/app/catalogues/[name]/page.tsx:11`).
  - It is a separate function rather than a change to `applyPlanDowngrade`'s return type, to keep its callers stable.
- **Re-upgrading does not restore the ID.** The owner re-pastes it. A "suspended" state would need another CHECK key, which is not worth it in v1.

---

## 15. Phased delivery and scope cuts

### 15.1 Phase 0: decisions and prep (no code)
- Choose the tiers (§14).
- Approve **or skip** removing Quicktalog's GTM and Clarity from catalogue pages. It is recommended, and Phase 1 depends on it for consent integrity.
- Approve the read-only PROD query (§12.7).
- Request a Google tag Developer ID via the form linked from [Google's CMS guide](https://developers.google.com/tag-platform/devguides/gtag-integration).
- Create a Quicktalog-owned GA4 property for QA.
- Counsel skims the banner copy and the processor wording.
- Fix the release date relative to the `test`→`main` release.

### 15.2 Phase 1: GA4 behind consent (one developer, about a week; L in total)

| # | Work | Size |
|---|---|---|
| 1a | Migration + pgTAP + TEST push; package: `drizzle-kit pull`, `Integrations`, `defaultCatalogueData`, tier flags, release; app bump | M |
| 1b | Validator, schema, server-only helper, action, entitlement helper, rate-limit rule, draft-cache server-owned field, downgrade/activation clearing + revalidation | M |
| 1c | Analytics-page read + `GoogleAnalyticsCard` (field, messages, status, lock, expectations, test steps, disconnect) | M |
| 1d | `CatalogueTracking`: guards, consent store, banner (EN + SR Latin/Cyrillic), bar, loader, withdrawal, exit guard, contact-tap events; mount in `page.tsx`; kill switch | M (the largest item) |
| 1e | `QuicktalogTags` wrapper (GTM + Clarity off published catalogues); Sentry Replay rider | S |
| 1f | Search URL debounce | S |
| 1g | Route-scoped CSP rule | S |
| 1h | Agent prompt line + tests | S |
| 1i | Unit, component and architecture tests; e2e on TEST | M |
| 1j | Docs, help article, skills | S |
| 1k | Manual QA with a real property (Chrome, Safari, Firefox), PROD migration, release, outreach | S-M |

My estimate is about 50-55 focused hours, which fits one developer-week only if QA finds nothing structural (inference). **If it runs long, cut in this order:**
1. the builder pointer row;
2. the pricing UI rows;
3. the Sentry Replay rider;
4. contact-tap events (they move to Phase 2);
5. Serbian Cyrillic (keep Latin).

**Never cut:**
- consent before load;
- per-catalogue cookies;
- GTM and Clarity off;
- the landing and exit guards;
- the session guard;
- server validation, the plan check and downgrade clearing.

### 15.3 Phase 2: fast follows (each S-M; order by founder priority)
- **Meta Pixel (M).**
  - A `metaPixelId` key (migration widens the CHECK) and a `features.integrations.metaPixel` flag.
  - A second field on the card.
  - The banner gains an **Advertising** purpose: a first-layer "Choose" with toggles defaulting off.
  - `fbevents.js` loads only after consent, followed by `fbq('consent','grant')`, `init`, `PageView` and `fbq('set','autoConfig',false,id)` ([Meta](https://developers.facebook.com/documentation/meta-pixel/implementation/gdpr), [Meta](https://developers.facebook.com/documentation/meta-pixel/advanced.md)).
  - Meta is named as joint controller ([Meta Controller Addendum](https://www.facebook.com/legal/controller_addendum)).
  - CSP adds `connect.facebook.net` / `www.facebook.com` on the catalogue rule.
  - The GPC signal counts as rejecting advertising.
  - The vendor hash changes, so everyone is asked again.
- **Server-side consent log (S-M).**
  - An append-only `consent_events` table with no IP, an insert-only public path and rate limiting.
  - The localStorage `id` becomes the record key.
  - This makes Quicktalog a processor of those records, so it needs Terms/DPA wording first.
- **More banner languages (S per batch).** Driven by the PROD language counts; likely `hrv`, `deu`, `fra`, `spa`, `ita` first.
- **More events (S):** `view_item`; directions, book and call from the new Buttons and Hours blocks.
- **QR UTM option (S-M).**
- **PostHog consent-free counting (M, its own plan with the worker).**
  - Use `cookieless_mode: "always"` on published catalogue documents. posthog-js 1.434.7 ships the option: `cookieless_mode` appears in `node_modules/posthog-js/dist/module.js`.
  - It needs the project's server-hash setting ([PostHog](https://posthog.com/tutorials/cookieless-tracking)).
  - Relabel "unique visitors over the period", which would overcount (`../research/consent.md` §5.2).
  - Recommended to run in parallel. It is not a prerequisite for the GA slice.

### 15.4 Phase 3: later
- **Google Ads `AW-` conversions (M):** the advertising purpose, `send_to: 'AW-…/label'` per action, and the Ads CSP hosts.
- **Accept `GT-` (S):** after a probe with a real `GT-` tag shows Custom HTML cannot run.
- **Advanced consent mode as an owner opt-in (S):** after counsel review.
- **Separate root layout for catalogues (M-L).** This is Option C, `../research/code-render-path.md` §9.4. It removes Clerk, `UserContext` and the site banner from public pages and makes every exit a full load by construction.
- **Separate catalogue domain, then GTM (L+).**

### 15.5 Why each cut is safe for "legally safe and genuinely useful"
- **Meta Pixel and `AW-`.** Each needs an advertising purpose, which doubles the banner's legal surface (joint controller, ad-consent signals under Google's EU user consent policy, [Google](https://www.google.com/about/company/user-consent-policy/)) and its UI. GA4 alone answers the founder's question.
- **`GT-`.** Every GA4 property exposes a `G-` ID, so refusing `GT-` loses no GA4 user, and it avoids betting on an unstated restriction.
- **GTM and head code.** A security cut, not a schedule cut (§13).
- **Advanced mode.** Shipping without it removes legal risk. Google itself says advertisers need "consent mode v2", not advanced mode specifically ([Google](https://support.google.com/google-ads/answer/14625550)).
- **Server consent log.** Phase 1 sends Quicktalog's servers nothing about consent, so Quicktalog processes no new personal data for this feature. The banner text is versioned in git as the "information presented" (EDPB 05/2020 para 108 discusses keeping a copy). Flagged for counsel as R3.
- **More events, QR UTM and languages.** Pure value adds. English fallback is honest and shown to the owner.
- **PostHog change.** The GA slice neither depends on it nor makes it worse; it is a separate pre-existing gap with its own metering risks.

---

## 16. Where the research notes disagree, and what I chose

| Question | Notes | Choice |
|---|---|---|
| Field location | Builder General tab or Analytics page (`code-write-path` §4); Integrations tab (`google-tag-docs` §1.1) | Analytics page: immediate-save semantics fit there and the tab bar is untouched |
| Data layer name | Default `dataLayer` once Quicktalog GTM is gone (`google-tag-docs` §3.4) vs a custom name (`code-render-path` §10.3) | Custom `qtDataLayer`, with a documented one-line fallback (§7) |
| Consent key | Slug (`code-render-path` §9.6) vs catalogue id (`consent` §4.2) | Id: immutable |
| Advertising category for a `G-` tag | Always offer it, since owners can add Ads destinations remotely (`google-tag-docs` §2.3) vs one purpose (`consent` §6.3) | One purpose, plus on-page `allow_google_signals:false`, `allow_ad_personalization_signals:false`, all ad types denied and `ads_data_redaction`. No ad consent is needed |
| CHECK keys | GA4 + Meta (`code-write-path` §1) | GA4 only in v1 |
| Events | A rich mapping (`google-tag-docs` §7.3) | Phase 1: `page_view`, Enhanced Measurement and `generate_lead` on contact taps |
| `page_location` sanitising | Calendly and Gumroad do it (`shared-domain` §5.5) | Not in v1: catalogue URLs carry no secrets, and automatic history page views use the raw URL anyway |
| Our own tags before the feature | Remove GTM, Clarity, Replay **and** move the meter first (`consent` §8) | Remove GTM and Clarity (required for consent integrity) and Replay (rider). Moving the meter is a parallel plan |
| Mount structure | Option C separate root layout recommended as structural (`code-render-path` §9.4) | Option A sibling + landing/exit guards now; C later |
| Legal name | Make it a precondition (`consent` §3.4) | A soft warning, with fallback to the heading |
| Session guard | Recommended only in `google-tag-docs` §2.5 | Included: cheap, and it closes a high-severity hypothesis |

---

## 17. Risks and open questions

### 17.1 Risks (R)
- **R1. Tenant-container exfiltration via Google-provided variables.** Unverified.
  - **Mitigation:** the session guard, hard exits, and no tag on preview or admin.
  - **Residual:** anonymous visitors' Quicktalog-level IDs are readable (§7).
  - **Decisive test:** a real upgraded `G-` container with a First Party Cookie variable.
  - **If confirmed,** move the separate domain earlier.
- **R2. Cookie isolation under upgraded containers.** Upgraded tags configured with `gtm init` may initialise before our page-wide `set` takes effect ([Google](https://support.google.com/tagmanager/answer/17079602)).
  - **Effect:** isolation degrades to default `_ga` on `.quicktalog.app`, only for visitors who accepted.
  - **This is a QA gate (§12.4).** If it fails, document the limitation, or ask owners not to enable that trigger.
- **R3. No server-side consent records in Phase 1.** Demonstrating consent rests on the versioned banner and configuration (EDPB 05/2020 para 108; Google's EU UCP "retain records"). Counsel decides whether Phase 2's log must ship first.
- **R4. Legal copy and languages.** The copy is a draft. Catalogues in other languages get an English banner until translated, and the owner card says so.
- **R5. Pre-existing gaps that remain on catalogue pages after Phase 1:**
  - PostHog with persistent IDs, unconsented;
  - Clerk loading for anonymous visitors on PROD;
  - the site cookie banner's non-reactive path check (`src/components/general/CookieBanner.tsx:28-37`, `:65`).
- **R6. Release coupling.** The feature depends on the `test`→`main` release, the auth cutover and pending PROD migrations. Owners lose their pasted snippets on that same day.
- **R7. Expectation gap.** GA shows a fraction of the visits PostHog shows: consent rates, ad blockers, and Safari's 7-day storage cap prompting again.
- **R8. Owner testing friction.** Tag Assistant must run in a private window, because of the session guard.
- **R9. Future navigation code.** A programmatic `router.push` added to the public view later would bypass the exit guard. The component test and docs must say so.
- **R10. Paddle plan changes.** `SubscriptionUpdated` is processed but never updates `users.plan_id` (`src/utils/paddle/process-webhook.ts:61`, `:131-187`). If Paddle delivers plan switches only as updates, plan-dependent features never reconcile. This is pre-existing; check it.
- **R11. Google can change `gtag.js` behaviour** (`l=`, consent handling) at any time. The kill switch and QA monitoring cover this.
- **R12. Cache churn.** Each save purges every catalogue's `catalogue-detail` cache (`src/lib/cache/revalidate.ts:15`). The rate limit bounds it.
- **R13. Orphaned cookies.** Disconnecting leaves inert prefixed cookies on returning visitors' devices until they expire, with no reader.

### 17.2 Open questions for the founder
1. Tiers: is Pro and up, plus custom plan 5, right?
2. May Quicktalog's own GA4, Hotjar and Clarity stop running on published catalogues?
3. Go-ahead for the read-only PROD audit, plus the language and plan counts.
4. Ship in the `test`→`main` release, or right after it?
5. What is Phase 2's first item: Meta Pixel, the consent log, or PostHog cookieless counting?
6. Counsel availability for the banner copy, processor wording, the consent-log timing and basic mode.

---

## Appendix A: file change list (Phase 1)

| Repo / file | Change |
|---|---|
| `supabase/migrations/<ts>_catalogue_integrations.sql` (new) | Column, CHECK, comment, two grants |
| `supabase/tests/database/10_catalogues.test.sql` | Grant, RLS and CHECK assertions; `plan(n)` |
| `quicktalog-packages/src/drizzle/migrations/schema.ts` | `drizzle-kit pull` only |
| `quicktalog-packages/src/types/catalogue.ts` | `Integrations`; `integrations` in the `Update` map |
| `quicktalog-packages/src/types/general.ts` | `features.integrations.googleAnalytics` |
| `quicktalog-packages/src/constants/catalogue.ts`, `pricing.ts` | `integrations: {}`; the flag on six tiers |
| `package.json`, `package-lock.json` | Bump `@quicktalog/common` |
| `src/utils/db/columns.ts` | Add to `PUBLIC_CATALOGUE_COLUMNS`, with a comment on why it is not editable |
| `src/lib/integrations/google-tag.ts` (new) | Regex + parser |
| `src/lib/integrations/gtag-loader.ts` (new) | Loader, revoke, events |
| `src/lib/integrations/consent-store.ts` (new) | Per-catalogue record |
| `src/lib/integrations/guards.ts` (new) | Framed, landing, session, exit guard, contact taps |
| `src/constants/schemas.ts` | `integrationsInputSchema` |
| `src/lib/catalogue/integrations.ts` (new, server-only) | Owned update and read |
| `src/actions/integrations.ts` (new) | `updateCatalogueIntegrations` |
| `src/lib/entitlements/integrations.ts` (new); `src/lib/entitlements/catalogue.ts` | `allowsGoogleAnalytics`; `clearUnentitledIntegrations` |
| `src/utils/paddle/process-webhook.ts` | Call it in both plan-changing branches; revalidate after commit |
| `src/lib/catalogue/draft-cache.ts` | Server-owned on read, stripped on write |
| `src/lib/rate-limit.ts` | `integrations` rule |
| `src/app/admin/[name]/analytics/page.tsx`, `src/components/analytics/CatalogueAnalytics.tsx`, `src/components/analytics/GoogleAnalyticsCard.tsx` (new) | Owner UI |
| `src/app/catalogues/[name]/page.tsx` | Mount `CatalogueTracking`; kill switch |
| `src/components/catalogue/tracking/CatalogueTracking.tsx`, `consent-copy.ts` (new) | Banner, bar, wiring |
| `src/components/general/QuicktalogTags.tsx` (new); `src/app/layout.tsx` | GTM and Clarity off published catalogues |
| `src/instrumentation-client.ts` | Replay off published catalogues (rider) |
| `src/components/catalogue/view/CatalogueContent.tsx` | Debounced `?q=` write |
| `next.config.ts` | Directive map + catalogue rule |
| `src/agent/instructions.ts` | One `settingsRules` line |
| Tests (§12.1), docs and skills (§12.5) | As listed |

## Appendix B: TEST query run for this design (read-only, project `imhinsgyzzyblghwnedk`, 2026-10-01)
I evaluated the §3.1 CHECK expression over literal jsonb values with a `with samples(...) select ...` query. It touched no table.

| Sample | Passes |
|---|---|
| `{}` | true |
| `{"ga4MeasurementId":"G-PSW1MY7HB4"}` | true |
| `{"ga4MeasurementId":"G-TEST123"}` | true |
| lowercase `g-psw1my7hb4` | false |
| `GTM-AB12CD3` | false |
| `GT-ABCD1234` | false |
| `AW-123456789` | false |
| `G-X<script>alert(1)</script>` | false |
| `G-PSW1MY7HB4\n` (trailing newline) | false |
| `G-ABCDEFGHIJKLMNOP` (16-character suffix) | false |
| a number | false |
| an array | false |
| an extra `headCode` key | false |
| `{"metaPixelId":"123456789012345"}` | false |
| `{"ga4MeasurementId":null}` | false |

## Appendix C: external sources re-read for this design (2026-10-01)
- [Manage tagging behavior using the container ID](https://support.google.com/tagmanager/answer/17070049). Live fetch: `GTM-` allows all tag types; `G-`/`AW-` are "limited to Google tags". `GT-` is not named.
- [Tag Manager release notes](https://support.google.com/tagmanager/answer/4620708). Cached 2026-09-30: the 2026-07-09 entry on `/gtag/js` restriction by ID type.
- [Updates to Google tag and Google Tag Manager, 2026-08-20](https://support.google.com/tagmanager/answer/17079602). Cached 2026-09-30: Google tags are upgraded to containers; new snippets have no `config`; the `gtm init` trigger.
- [Manage privacy settings](https://developers.google.com/tag-platform/security/guides/privacy). Last updated 2026-07-30; cached 2026-09-30: `allow_google_signals`, `allow_ad_personalization_signals`, `ga-disable-<ID>`.

All other external claims carry the URL cited by the research note they come from. That note records the fetch date.
