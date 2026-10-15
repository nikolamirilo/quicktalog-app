# Catalogue Google tag and GA4: security-first design

Status: proposed design (one of the competing designs for the 2026-10-01 plan). Written 2026-10-01.

Lens: security and compliance first. Public catalogues share `www.quicktalog.app` with the signed-in builder, an AI agent writes catalogue content from scraped pages and OCR, many customers and visitors are in the EU and Serbia, and the CSP is Report-Only with `'unsafe-inline'` and `'unsafe-eval'`. The goal is the smallest attack surface and the least legal exposure, with a design that would survive an enforced strict CSP later.

Inputs: the five research notes in `../research/` (read in full), the four prior files named in the task (read in full; the 09-25 PLAN.md section 3 and its tracking-related lines), and my own checks on 2026-10-01: code reads in all three repos, two read-only SELECTs on TEST, `git` checks of `origin/main`, and fresh fetches of the four Google pages and one Vercel page the security model rests on.

Labels: **Fact** = read in code, returned by a TEST query, or stated by the cited page. **Inference** = my reasoning. **Decision** = what this design chooses. "(snippet)" = taken from a search-result excerpt only. Code paths are repo-relative to `quicktalog-app` unless prefixed `packages/` (quicktalog-packages) or `backend/` (quicktalog-backend). "Research §x" points at a note in `../research/`.

---

## 0. The answer in brief

**How a customer adds their Google tag, and what visitors see (Decision).**

1. A Pro-or-higher owner opens the catalogue's **Analytics** page (`/admin/[name]/analytics`) and pastes the **Google Analytics measurement ID** that starts with `G-`. Pasting the whole Google snippet also works: the form picks the single `G-` ID out of it. The owner can tick "I also use this tag for Google Ads".
2. A dedicated server action re-checks identity, the plan (from `users.plan_id` + `tiers`), the ID (strict anchored regex), and that the catalogue names its business. It stores only `{ ga4MeasurementId, googleAds? }` in a new `catalogues.integrations` column, guarded by a database CHECK, and revalidates the published page at once. No draft, no publish needed.
3. The **published page only** (`/catalogues/<slug>`) renders a small, identity-free consent notice in the catalogue's language, naming the business and Google. **Nothing from Google loads until the visitor taps Accept** (basic consent mode). Reject means zero requests to Google.
4. On Accept, Quicktalog's own bundled code (no inline script) pushes the consent default and update, cookie-isolation settings and a tag-type blocklist into a private data layer, then injects `gtag/js?id=G-…&l=qtDataLayer`. Cookies are scoped to that one catalogue (prefix from the catalogue's immutable id, path `/catalogues/<slug>`, host-only, `Secure`). Quicktalog then sends a few events: item opened, call/email/WhatsApp/website taps, CTA and social taps, newsletter sign-up, and search.
5. The tag **never** loads in the owner's preview, the builder, the dashboard, inside an iframe, or for anyone signed in to Quicktalog. Published catalogues get their **own root layout**, so every move between a catalogue and the rest of the app is a full page load, and Quicktalog's own GTM, Clarity and login code are not in the catalogue document at all.

**Other IDs (Decision).**

| ID | v1 | Why |
|---|---|---|
| `G-` (GA4 measurement ID) | **Accepted** | Google: a `G-` container "is limited to Google tags" ([Google](https://support.google.com/tagmanager/answer/17070049), re-fetched 2026-10-01) |
| `AW-` (Google Ads) | Refused with a pointer to "link GA4 to Google Ads and import key events"; native support in phase 4 | Same Google restriction as `G-`, but needs per-action conversion labels, advertising consent and more CSP hosts |
| `GT-` (Google tag ID) | Refused ("paste the G- measurement ID") until verified | Not named in Google's restriction article; unverified whether it is restricted like `G-` |
| `GTM-` (Tag Manager) | **Refused** while catalogues share the builder's origin | Google: `GTM-` "allows all tag types", including Custom HTML, even when loaded through `/gtag/js` ([release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708), re-fetched) |
| Meta Pixel | Phase 4, same pattern, only if the PROD audit shows demand | Non-Google script with remote config; joint controllership with Meta; new CSP hosts |

**Launch gates (Decision).** The setting does not ship until: (a) catalogue pages run in their own root layout without Quicktalog's GTM, Clarity, auth SDK and site cookie banner; (b) PostHog on catalogue pages stops using cookies and storage; (c) the consent notice and consent records exist; (d) a test with a real Google account confirms the controls in section 2 against a tenant's tag (the hypothesis in T2 is unverified); (e) counsel signs off the processor terms and notice text for EU launch.

**Corrections to the prior files (Facts, details in Appendix A).**
- "Custom code ran first-party until `e87e1f2` (2026-09-15), so owners have silently lost tracking since then" is true for **TEST only**. `e87e1f2` is not in `origin/main` (`git merge-base --is-ancestor` fails), and `origin/main:components/catalogue/sections/CustomCode.tsx:43` and `EmbeddingBlock.tsx:199` still re-create `<script>` elements first-party. PROD (which serves `origin/main`, research code-render-path §1) still runs owners' pasted scripts today. Those owners lose tracking **on the release that brings `test` to PROD**, so outreach happens before that release, not after.
- "Nonce CSP is impossible on ISR" holds for Next.js rendering itself, but Vercel documents a middleware self-fetch pattern that adds per-request nonces to CDN-cached HTML ([Vercel KB](https://vercel.com/kb/guide/csp-nonces-with-cdn-cache)). It costs latency on every request, so it is a future option, not a v1 dependency.

---

## 1. Facts this design rests on

| # | Fact | Source |
|---|---|---|
| F1 | The published page is ISR (`revalidate = 86400`), fetches its own `/api/items/<name>`, and renders `<Catalogue item={item} type="view" />` for active rows | `src/app/catalogues/[name]/page.tsx:11`, `:114-123`, `:143-144` |
| F2 | The owner preview renders the **same** `<Catalogue type="view">` from the owner's draft | `src/app/catalogues/[name]/preview/page.tsx:10`, `:26-28`, `:36` |
| F3 | The root layout puts Clarity and Quicktalog's GTM in `<head>` of every route, plus the UploadThing SSR plugin and `PageWrapperClient` (auth, user context, catalogue context, site cookie banner) | `src/app/layout.tsx:46-52`; `src/components/general/PageWrapperClient.tsx:15-25` |
| F4 | `PUBLIC_CATALOGUE_COLUMNS` is everything except `userId`, and is served as public JSON | `src/utils/db/columns.ts:10-31`; `src/app/api/items/[name]/route.ts:16-25` |
| F5 | `pickEditable` copies only `CATALOGUE_EDITABLE_FIELDS`, verbatim, on create, publish and duplicate | `src/utils/db/columns.ts:38-66`; `src/actions/catalogue.ts:202`, `:280`, `:440` |
| F6 | Save writes only the Redis draft; publish is refused once the month's traffic limit is reached | `src/actions/catalogue.ts:351`, `:430`; `src/lib/entitlements/plan.ts:67-79` |
| F7 | `readOwnedDraft` returns `{...row, ...draft}` and re-imposes only id, name, status, source, userId and timestamps | `src/lib/catalogue/draft-cache.ts:61-71` |
| F8 | Only a cancellation to Starter reconciles stored data; a paid-to-paid activation only sets `plan_id`; only deactivated catalogues are revalidated | `src/utils/paddle/process-webhook.ts:131-155`, `:157-187`, `:213-215` |
| F9 | The Supabase session cookie is deliberately not `httpOnly`, path `/`, 400-day max age, and holds the refresh token; Clerk's `__session` is readable by scripts | `src/lib/auth/cookie-options.ts:3-21`; [Clerk](https://clerk.com/docs/guides/how-clerk-works/overview) (research google-tag-docs §2.5) |
| F10 | The CSP is `Content-Security-Policy-Report-Only` on `/:path*`, with `'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com` in `script-src`, no `report-uri`, and no `https://*.google.com` or `https://*.analytics.google.com` in `connect-src` | `next.config.ts:48-69` |
| F11 | The site cookie banner reads identity and returns early on any `/catalogues/` path; its "consent" is a custom `{event:'consent_default'}` push, which `gtag.js` ignores | `src/components/general/CookieBanner.tsx:22`, `:28-37`; `src/utils/cookies.ts:36-71`; research google-tag-docs §4.6 (probe) |
| F12 | PostHog captures pageviews on every route with default persistence; Sentry loads `replayIntegration()` | `src/instrumentation-client.ts:5-19`, `:26`, `:36-42` |
| F13 | The traffic meter counts PostHog `$pageview` events whose `$current_url` contains `/catalogues/` and the site host; the owner dashboard matches `$host` + `$pathname` | `backend/src/utils/analytics.ts:6-20`; `backend/src/handlers/analyticsProcessingJob.ts:85-86`; `src/lib/analytics/catalogue-traffic.ts:30-36` |
| F14 | The AI tool schema is a closed object, the applier copies named fields only, and the snapshot lists fields explicitly | `src/agent/tools/general.ts:8-49`; `src/lib/catalogue/operations.ts:474-535`; `src/agent/session.ts:375-419` |
| F15 | Google: `G-`/`AW-` containers are "limited to Google tags … prevents loading or executing other tag types"; `GTM-` allows "Custom HTML and JavaScript tags" | [Google, container ID](https://support.google.com/tagmanager/answer/17070049) (re-fetched 2026-10-01) |
| F16 | Google, 2026-07-09: "Containers loaded with a GTM-XXXX ID won't be restricted, while product-specific ID types like G-XXXX or AW-XXXX will only permit tags and variables provided by Google", regardless of path (`/gtag/js` included) | [Release notes](https://support.google.com/tagmanager/answer/4620708) (re-fetched) |
| F17 | Google, 2026-08-20: "Your Google tags will be upgraded to fully capable Google Tag Manager containers"; owners "gain the option to use Google Tag Manager features"; new snippets "will not have the gtag config command" | [Google](https://support.google.com/tagmanager/answer/17079602) (re-fetched) |
| F18 | Google-provided variables include First Party Cookie (`k`), JavaScript Variable (`j`) and DOM Element (`d`), all class `google`. `gtm.allowlist`/`gtm.blocklist` pushed into the data layer "will override any and all configuration in the container"; blocklisting any class also blocks custom-template sandboxed JS | [Google, restrict tag deployment](https://developers.google.com/tag-platform/tag-manager/restrict) (re-fetched, last updated 2026-07-30) |
| F19 | Vercel Routing Middleware "runs before the CDN cache" | [Vercel KB](https://vercel.com/kb/guide/csp-nonces-with-cdn-cache); [Vercel docs](https://vercel.com/docs/routing-middleware) (snippet) |
| F20 | TEST: `app_user` UPDATE and `app_public` SELECT on `catalogues` are column-level and name no tracking column | TEST SELECT on `information_schema.column_privileges`, 2026-10-01; `supabase/migrations/20260921181104_app_role_grants_policies.sql:54-60` |
| F21 | TEST: the CHECK expression in section 4, run as a SELECT over 16 literal samples, accepts `{}`, a GA4 ID and GA4 + `googleAds:true`, and rejects 13 others (GTM-, GT-, AW-, lowercase, a quote-and-script payload, a trailing newline, too long, unknown key, a Meta key, an array, a numeric ID, `googleAds` without an ID or as a string) | TEST SELECT, 2026-10-01 |
| F22 | `@next/third-parties` `GoogleAnalytics` interpolates the ID into an inline script and omits `&l=` | `node_modules/@next/third-parties/dist/google/ga.js:30-37` |
| F23 | Chromium probes: a per-catalogue `cookie_prefix` + `cookie_path` + `cookie_domain:'none'` gives each catalogue its own client id; consent state is page-global across data layers; Quicktalog's GA4 and a customer tag mint the same id on a first-ever visit when both are on the page | Research code-render-path §10 and Appendix A; google-tag-docs §3.2, §4.6 |

---

## 2. Threat model

**Assets.** Signed-in sessions of owners and Quicktalog staff (F9); visitors' privacy and the lawfulness of each business's processing; tenant isolation (one business must never observe another's visitors or Quicktalog's pages); Quicktalog's plan enforcement and traffic meter.

**Actors.** A malicious or compromised tenant who controls their own Google tag remotely; a web page or photo that tries to steer the AI agent; a crafted client request to a server action; an anonymous attacker hitting public endpoints.

**Trust boundary (Decision).** The published catalogue document is treated as **tenant-influenced**: it may run a tenant-configured Google tag. Nothing from the app (auth SDK, user data, Quicktalog's own GTM/Clarity) lives in that document, and the tenant tag lives nowhere else.

| # | Threat | Controls | Residual |
|---|---|---|---|
| T1 | Arbitrary JS through the setting (GTM container, pasted snippet, head code) | Only `G-` IDs; anchored regex in the form, the action, the DB CHECK (F21) and again in the loader; no free-form field; the ID never enters inline script (props + `encodeURIComponent`) | None known |
| T2 | A tenant's **`G-` container reads Quicktalog session cookies**. Since F17 a Google tag is a GTM container its owner can edit; F18 lists First Party Cookie and JavaScript Variable as Google-provided. On a shared origin a GA4 event parameter could carry a signed-in visitor's refresh token to the tenant's property (Inference from research google-tag-docs §2.5; **not verified with a real property**) | (1) never load the tag while a Quicktalog session cookie exists; reload the page if one appears later; (2) push `gtm.blocklist` for `k`, `j`, `d` and the script/pixel classes before the tag loads (F18; whether gtag-loaded containers honour it is unverified); (3) separate root layout: no auth SDK in the document, every exit is a full page load; (4) never on preview/admin; (5) paid plan only, which raises the attacker's cost. Phase 0 probe decides whether this is enough to launch | Owners or staff who sign in elsewhere while a catalogue tab stays open, in the window before the watcher fires. Removed only by httpOnly sessions or a separate registrable domain (phase 5) |
| T3 | Cross-tenant leakage (tag A sees catalogue B, or Quicktalog pages) | Separate root layout (full loads at every app boundary); catalogue-to-catalogue links rendered as plain `<a>`; per-catalogue cookie prefix and path; private data layer; no tags inside frames | A tenant container could read *other* first-party cookies on the path, such as Quicktalog's `_ga` from marketing-site visits, unless `k` is blocked |
| T4 | AI agent writes tracking (prompt injection from scraped pages or OCR) | The setting is a separate column outside `CATALOGUE_EDITABLE_FIELDS`, written only by its own action; closed tool schemas (F14); `integrations` stripped from the agent's context; prompt rule; tests over every tool schema | None known |
| T5 | Client forgery: a save/publish/create/duplicate payload carrying `integrations` | `pickEditable` never copies it (F5); the draft cache treats it as server-owned; column grant + CHECK as backstop | None known |
| T6 | Plan bypass, or a tag left live after a downgrade | Plan read in the action from `users.plan_id`; downgrade clears the column on cancel **and** paid-to-paid activation and revalidates; publish and re-activation force `{}` when the tier lacks the feature | Up to one webhook delay |
| T7 | Secrets stored in a public column | CHECK admits two known keys only, so a token (Meta CAPI, API key) cannot be stored; documented "public by construction" | None |
| T8 | Abuse of the public consent-record endpoint | Strict schema, 1 KB cap, IP-keyed rate limit, insert-only policy that requires an active catalogue with tracking, no reads for the public role, retention job | Row spam within rate limits |
| T9 | Per-visitor data in the ISR cache | Consent is read on the client only; no `Set-Cookie`; the ID is catalogue data | None |
| T10 | Unconsented tracking (legal) | Basic consent mode; per-catalogue consent; Quicktalog's own GTM/Clarity removed from catalogue pages and PostHog made cookieless | ePrivacy analysis of cookieless PostHog (section 9) |
| T11 | Framed catalogues (showcases, third-party sites) recording visits or showing a banner nobody can tap | Loader and banner do nothing when `window.top !== window.self`; `frame-ancestors 'self'` stays and is enforced later | Owners who iframe their own catalogue get no GA there (documented) |
| T12 | Misleading banner text (the business name comes from `legal.legalName`, which the AI can write via `updateLegal`, `src/agent/tools/navigation.ts:82`, `:123`) | Rendered as React text, never HTML; the value is published only by the owner; banner falls back to the catalogue title | Owner-approved but wrong names |
| T13 | PII in GA4 (search text in URLs, newsletter emails) | Public catalogues stop writing search text into the URL; Quicktalog sends a sanitised `search` event; events never carry emails or phone numbers | Visitor text in the initial URL of a shared `?q=` link |
| T14 | Revalidation churn (each save purges every catalogue's `catalogue-detail` data, `src/lib/cache/revalidate.ts:15-16`) | Rate limit on the action | None material |
| T15 | Data pollution of an owner's property by anyone who knows the ID | Inherent to client-side tags; documented | Accepted |

---

## 3. Owner UX (item 1)

### 3.1 Where the setting lives (Decision)

A **"Google Analytics" card on the per-catalogue Analytics page**, `/admin/[name]/analytics`, above or beside the built-in numbers, plus a one-line pointer in the builder's General tab.

Why there and not in the builder:
- **Fact.** The page is server-rendered, `force-dynamic`, and already proves ownership inside `withUser` before anything else (`src/app/admin/[name]/analytics/page.tsx:19-34`). It can read the catalogue's `status`, `integrations` and `legal` in the same block.
- **Fact.** Every builder field today flows through the Redis draft and Save/Publish (`src/context/CatalogueContext.tsx:87-91`; F6). A field that saves immediately inside that panel invites "did I publish it?" mistakes, and a fifth builder tab would break the four-column bar that was sized for 360 px (`src/components/catalogue/inputs/sidebar/index.tsx:28-33`, `:128`).
- **Inference.** Owners look for GA next to analytics, and the card can explain right there why Google's numbers will be lower than Quicktalog's.

The General tab gets a small `PanelSection` "Google Analytics" with one sentence and a link that opens the Analytics page in a new tab (so unsaved builder edits are not lost).

### 3.2 The card

- **Title:** Google Analytics
- **Intro:** "Send visits to your own Google Analytics 4 property. Quicktalog's numbers above keep working either way."
- **Field label:** Measurement ID. **Placeholder:** `G-XXXXXXXXXX`.
- **Help:** "In Google Analytics, open Admin → Data streams → your website stream and copy the Measurement ID. It starts with G-. You can also paste the whole Google tag code and we'll take the ID from it." If the owner creates a new stream: "Use your catalogue address, https://www.quicktalog.app/catalogues/{slug}, as the website URL."
- **Checkbox:** "I also use this Google tag for Google Ads (conversions or remarketing)". Help: "Visitors will then be asked separately about advertising."
- **Buttons:** Save (primary). Remove (secondary, shown when connected). Under them: "Saving applies to your published catalogue right away. You don't need to publish again."
- **Notice preview:** a static, non-interactive rendering of the visitor notice in the catalogue's language, so the owner sees what visitors will see. No tag is loaded in the admin.
- **Language warning:** if the catalogue's language has no reviewed translation yet (section 7.6): "Your catalogue is in {language}. Until a translation is ready, the cookie notice shows in English."

### 3.3 Validation messages

Shared logic in `src/lib/tracking/ids.ts` (sketch in section 5.2); the form shows these, the action returns the same text.

| Input | Message |
|---|---|
| Empty | "Enter your measurement ID." |
| `GTM-…`, or a snippet containing `GTM-` | "Google Tag Manager containers (GTM-…) aren't supported, because a container can run any code on your catalogue. Paste your Google Analytics measurement ID instead. It starts with G-." |
| `GT-…` | "That's a Google tag ID. Paste the measurement ID that starts with G- (Admin → Data streams)." |
| `AW-…` | "Google Ads IDs aren't supported yet. Link Google Analytics to Google Ads and import your key events instead." |
| `UA-…` | "Universal Analytics (UA-…) no longer collects data. Create a Google Analytics 4 property and paste its G- ID." |
| Snippet with two different `G-` IDs | "We found more than one measurement ID in what you pasted. Paste just the one for this catalogue." |
| Anything else that fails | "That doesn't look like a measurement ID. It looks like G-PSW1MY7HB4: G- followed by letters and numbers." |
| No business name/address on the published catalogue | "Add your business name and address under Builder → Footer → Business info, then publish. Your visitors' cookie notice names your business." |
| Plan without the feature | Lock overlay: "Google Analytics is available on Pro and higher." with "See plans". |
| Rate limited | "Too many changes in a short time. Try again in an hour." |

### 3.4 Plan lock

- `LockedGroup locked={!plan.features.integrations.googleAnalytics}` around the field and checkbox.
- **Remove stays outside the LockedGroup.** `LockedGroup` makes its children `inert` (`src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:36-41`), and a downgraded owner must always be able to clear the ID.
- `LimitsOverlay` today shows generic copy and `getRequiredPlan` knows only numeric limits (research code-write-path §3). Add a feature-aware variant so the overlay names "Pro".

### 3.5 Status indicator

One line under the field, computed by the server page and refreshed from the action's return value:

| State | Text |
|---|---|
| Not connected | "Not connected." |
| Connected, catalogue active | "Connected to G-ABC123. Visitors are asked first; only visits from people who accept reach Google Analytics." |
| Connected, catalogue draft or inactive | "Saved. It starts when you publish this catalogue." (`app_public` sees only active rows, research code-write-path Q5) |
| Phase 4 addition | "Last 7 days: 140 visitors answered the notice, 81 accepted." (from consent records, section 7.5) |

Quicktalog cannot see whether Google receives hits, so the status never claims "working"; the consent counts in phase 4 are the closest honest signal.

### 3.6 Testing guidance (shown in a "Check that it works" disclosure)

1. Open your catalogue in a **private or incognito window**. Google Analytics is switched off while you are signed in to Quicktalog, to protect your account.
2. Tap **Accept** in the cookie notice.
3. In Google Analytics, open **Reports → Realtime**. Your visit appears within a minute.
4. For a closer look, open **Tag Assistant** (tagassistant.google.com), enter your catalogue address, accept cookies in the window it opens, and watch **Admin → DebugView**. Google shows no debug events until analytics cookies are accepted ([Google DebugView](https://support.google.com/analytics/answer/7201382), research google-tag-docs §7.5).
5. "Google Analytics will show fewer visits than Quicktalog: Google only counts people who accept, and ad blockers stop it. Quicktalog's own numbers don't depend on the notice."

A signed-in visitor on the public page sees a small dismissible note: "You're signed in to Quicktalog, so this catalogue's Google Analytics is off for you. Open it in a private window to test it."

---

## 4. Data model and migration (item 2)

### 4.1 Column and constraint (Decision; expression verified on TEST, F21)

`supabase migration new catalogue_integrations` → `supabase/migrations/<YYYYMMDDHHMMSS>_catalogue_integrations.sql`:

```sql
-- Owner-entered tracking settings for the published catalogue.
-- Public data: app_public reads it and /api/items/<slug> returns it. IDs only:
-- never markup, URLs, snippets or secrets. Written only by updateCatalogueIntegrations.
alter table public.catalogues
  add column integrations jsonb not null default '{}'::jsonb;  -- constant default: no table rewrite

alter table public.catalogues
  add constraint catalogues_integrations_check check (
        jsonb_typeof(integrations) = 'object'
    and pg_catalog.pg_column_size(integrations) < 512
    -- Allowlist of keys: a new vendor needs a new migration, on purpose.
    and (integrations - array['ga4MeasurementId', 'googleAds']) = '{}'::jsonb
    -- Must match GA4_MEASUREMENT_ID in @quicktalog/common.
    and (not integrations ? 'ga4MeasurementId'
         or (jsonb_typeof(integrations -> 'ga4MeasurementId') = 'string'
             and integrations ->> 'ga4MeasurementId' ~ '^G-[A-Z0-9]{4,15}$'))
    and (not integrations ? 'googleAds'
         or (jsonb_typeof(integrations -> 'googleAds') = 'boolean'
             and integrations ? 'ga4MeasurementId'))
  );

-- Both privileges on catalogues are column-level (20260921181104_app_role_grants_policies.sql:55-60).
-- Without these, every write fails with 42501 and the public page renders "not found".
grant update (integrations) on public.catalogues to app_user;
grant select (integrations) on public.catalogues to app_public;
```

Why a separate jsonb column rather than `metadata` or typed text columns:
- **Fact.** `metadata` is in `CATALOGUE_EDITABLE_FIELDS` and is forwarded verbatim from the client draft (`src/utils/db/columns.ts:51`, `:58-66`).
- **Inference.** One column keeps one grant pair and one CHECK whose key allowlist is itself a security control; typed columns would work too but multiply grants.

### 4.2 pgTAP (`supabase/tests/database/10_catalogues.test.sql`, bump `plan(n)`)

- The owner can update `integrations` on their own row.
- Updating another owner's row affects 0 rows.
- `app_public` reads `integrations` of active rows only.
- The CHECK raises 23514 for `GTM-…`, an unknown key, a script payload and `googleAds` without an ID.
- `app_user` still cannot update `name`, `user_id`, `id` or `source` (existing assertions, research code-write-path §1).

### 4.3 Package changes (`quicktalog-packages`, one commit; the hook bumps the minor; a push to `main` publishes)

| File | Change |
|---|---|
| `packages/src/drizzle/migrations/schema.ts` | Regenerated by `npx drizzle-kit pull` only (never hand-edited) |
| `packages/src/types/catalogue.ts:15-29` | `integrations: CatalogueIntegrations` in the `Update` map (otherwise `Catalogue` gains `integrations: unknown`, `packages/src/types/functions.ts:1-3`) |
| `packages/src/types/catalogue.ts` (new type) | `CatalogueIntegrations` (sketch below) |
| `packages/src/constants/catalogue.ts:3` | `integrations: {}` in `defaultCatalogueData` (the package build fails otherwise) |
| `packages/src/constants/integrations.ts` (new) | `GA4_MEASUREMENT_ID` regex and its SQL string, so app, tests and the migration agree |
| `packages/src/types/general.ts:25-46` | `integrations: { googleAnalytics: boolean }` in `features` |
| `packages/src/constants/pricing.ts` (all 6 tiers, lines 5, 38, 70, 102, 134, 166) | The value per tier (section 14) |

```ts
// packages/src/types/catalogue.ts
/**
 * Owner-entered tracking settings for the published catalogue.
 * Public by construction: the ISR page and /api/items/<slug> return it.
 * IDs only. Never markup, URLs, snippets or secrets (the DB CHECK refuses unknown keys).
 */
export type CatalogueIntegrations = {
  /** GA4 measurement ID, e.g. "G-PSW1MY7HB4". The only Google ID type accepted on the shared origin. */
  ga4MeasurementId?: string;
  /** The owner declared that this Google tag also feeds Google Ads. Adds an "Advertising" choice to the notice. */
  googleAds?: boolean;
};

// packages/src/constants/integrations.ts
/** Must stay identical to catalogues_integrations_check. A unit test compares the two. */
export const GA4_MEASUREMENT_ID_SOURCE = "^G-[A-Z0-9]{4,15}$";
export const GA4_MEASUREMENT_ID = new RegExp(GA4_MEASUREMENT_ID_SOURCE);
```

### 4.4 Release order (critical)

1. Migration → `npm run test:db` / `supabase test db` → `supabase db push` to **TEST** (`docs/guides/drizzle.md:19-31`).
2. `npx drizzle-kit pull` in the package (with `DB_ADMIN_CONNECTION_STRING`), package edits, commit, publish (1.67.0).
3. App bumps `@quicktalog/common`. Deploy to TEST.
4. **Before** the PROD app deploy that knows the column: apply the pending migrations to PROD in order, then this one. **Fact:** PROD lags TEST (it still stores legacy `category` blocks, research code-write-path §1). **Inference:** if the app ships first, Drizzle's `select()`/`.returning()` list the unknown column and every builder load, save and publish fails with 42703, and a missing `app_public` grant makes the public page render "not found" for up to 24 h (research code-write-path §1, "Deployment ordering").
5. Rule check: no `drizzle-kit push/generate/migrate`, no edits to applied migrations (`.claude/CLAUDE.md`).

---

## 5. Write path (item 3)

### 5.1 Semantics: applied immediately, not draft-then-publish (Decision)

| Reason | Evidence |
|---|---|
| One validated write path instead of four (create, save, publish, duplicate) | F5 |
| Removing a tag must always work, even when publish is refused at the traffic limit | F6 |
| Changing the ID must not force publishing unrelated content edits | F6 |
| Precedent for an immediate per-catalogue setting | `upsertQrConfig`, `src/actions/qr-configs.ts:15-69` |

For draft or inactive catalogues the saved ID takes effect on first publish, because `app_public` reads active rows only.

### 5.2 ID checks (shared, pure; used by the form, the action and the loader)

```ts
// src/lib/tracking/ids.ts
import { GA4_MEASUREMENT_ID } from "@quicktalog/common";

export type IdRefusal =
  | "empty" | "gtm" | "google_tag" | "ads" | "universal" | "multiple" | "invalid";
export type IdCheck = { ok: true; id: string } | { ok: false; reason: IdRefusal };

const REFUSED: ReadonlyArray<readonly [RegExp, IdRefusal]> = [
  [/^GTM-/, "gtm"],        // runs any code: refused on the shared origin
  [/^GT-/, "google_tag"],  // restriction status unverified: ask for the G- ID
  [/^AW-/, "ads"],         // phase 4
  [/^UA-/, "universal"],   // dead product
];

/** Normalises one value. Never parses markup on the server: the form sends only an ID. */
export function checkGa4Id(raw: unknown): IdCheck {
  if (typeof raw !== "string") return { ok: false, reason: "invalid" };
  const trimmed = raw.trim().replace(/^["'`]+|["'`]+$/g, "");
  if (!trimmed) return { ok: false, reason: "empty" };
  // ASCII check before upper-casing: "ſ".toUpperCase() is "S".
  if (trimmed.length > 32 || !/^[\x21-\x7E]+$/.test(trimmed)) {
    return { ok: false, reason: "invalid" };
  }
  const id = trimmed.toUpperCase();
  for (const [pattern, reason] of REFUSED) if (pattern.test(id)) return { ok: false, reason };
  return GA4_MEASUREMENT_ID.test(id) ? { ok: true, id } : { ok: false, reason: "invalid" };
}

/** Browser-only convenience for a pasted Google snippet. The server never sees the snippet. */
export function idFromPaste(text: string): IdCheck {
  const sample = text.slice(0, 10_000);
  if (/\bGTM-[A-Z0-9]{4,}\b/i.test(sample)) return { ok: false, reason: "gtm" };
  const ids = [...new Set(sample.toUpperCase().match(/\bG-[A-Z0-9]{4,15}\b/g) ?? [])];
  if (ids.length > 1) return { ok: false, reason: "multiple" };
  return ids.length === 1 ? { ok: true, id: ids[0] } : checkGa4Id(sample);
}
```

`\bG-` cannot match inside `GTM-…` (the `G` there is followed by `T`), and a standard gtag snippet repeats one ID, which the `Set` collapses. A third export, `refusalMessage(reason)`, maps each `IdRefusal` to the texts in section 3.3, so the form and the action say the same thing.

```ts
// src/constants/schemas.ts (addition)
export const integrationsInputSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("connect"),
    ga4MeasurementId: z.string().max(64),
    googleAds: z.boolean().default(false),
  }).strict(),
  z.object({ action: z.literal("remove") }).strict(),
]);
```

### 5.3 Server action

Follows `.claude/skills/server-action-and-route/SKILL.md` as summarised in research code-write-path §2: identity first, one short `withUser` block, plan from the database with the users row locked, owner predicate, row-count check, revalidation after the block, Sentry on the unexpected.

```ts
// src/actions/integrations.ts  ("use server": exports only this action)
"use server";
import * as Sentry from "@sentry/nextjs";
import { type CatalogueIntegrations, schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { integrationsInputSchema } from "@/constants/schemas";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { revalidateCatalogue } from "@/lib/cache/revalidate";
import { allowsIntegrations, controllerIdentified } from "@/lib/entitlements/integrations"; // server-only
import { getPlanForUpdate } from "@/lib/entitlements/plan";
import { withinRateLimit } from "@/lib/rate-limit";
import { checkGa4Id, refusalMessage } from "@/lib/tracking/ids";
import { pgError, withUser } from "@/utils/db";

const c = schema.catalogues;

type Result =
  | { success: true; data: { integrations: CatalogueIntegrations; live: boolean } }
  | { success: false; error: string };

export async function updateCatalogueIntegrations(
  catalogue: string,
  input: unknown,
): Promise<Result> {
  try {
    const me = await getVerifiedIdentity();
    if (!me) return { success: false, error: "Unauthorized" };
    if (typeof catalogue !== "string" || catalogue.length > 100) {
      return { success: false, error: "Catalogue not found" };
    }

    const parsed = integrationsInputSchema.safeParse(input);
    if (!parsed.success) return { success: false, error: "Invalid request" };

    let next: CatalogueIntegrations = {};
    if (parsed.data.action === "connect") {
      const id = checkGa4Id(parsed.data.ga4MeasurementId);
      if (!id.ok) return { success: false, error: refusalMessage(id.reason) };
      next = { ga4MeasurementId: id.id, ...(parsed.data.googleAds ? { googleAds: true } : {}) };
    }

    // Before the database: each save purges every catalogue's data cache.
    if (!(await withinRateLimit("integrations", me.userId))) {
      return { success: false, error: "Too many changes in a short time. Try again in an hour." };
    }

    const out = await withUser(me, async (tx) => {
      const [row] = await tx
        .select({ id: c.id, legal: c.legal, contact: c.contact })
        .from(c)
        .where(and(eq(c.name, catalogue), eq(c.userId, me.userId)))
        .limit(1);
      if (!row) return { kind: "missing" as const };

      // Removing is always allowed: a downgraded owner must be able to clear it.
      if (parsed.data.action === "connect") {
        const tier = await getPlanForUpdate(tx, me);
        if (!allowsIntegrations(tier)) return { kind: "locked" as const };
        if (!controllerIdentified(row)) return { kind: "legal" as const };
      }

      const [updated] = await tx
        .update(c)
        .set({ integrations: next })
        .where(and(eq(c.id, row.id), eq(c.userId, me.userId)))
        .returning({ name: c.name, status: c.status, integrations: c.integrations });
      return updated ? { kind: "ok" as const, row: updated } : { kind: "missing" as const };
    });

    if (out.kind === "missing") return { success: false, error: "Catalogue not found" };
    if (out.kind === "locked") {
      return { success: false, error: "Google Analytics is available on Pro and higher." };
    }
    if (out.kind === "legal") {
      return {
        success: false,
        error: "Add your business name and address under Builder → Footer → Business info, then publish.",
      };
    }

    revalidateCatalogue(out.row.name); // after the block, never inside it
    return {
      success: true,
      data: {
        integrations: out.row.integrations as CatalogueIntegrations,
        live: out.row.status === "active",
      },
    };
  } catch (err) {
    const pg = pgError(err);
    // The database backstop: a user-facing answer, not a Sentry event.
    if (pg?.code === "23514" && pg.constraint === "catalogues_integrations_check") {
      return { success: false, error: "That ID is not valid." };
    }
    // Unlike upsertQrConfig (qr-configs.ts:52-57), 42501 is NOT mapped to "not found":
    // a plain UPDATE on a foreign row returns 0 rows, so 42501 means a missing grant.
    Sentry.captureException(err, { tags: { op: "updateCatalogueIntegrations" } });
    console.error("Unexpected error while saving tracking settings:", err);
    return { success: false, error: "Failed to save" };
  }
}
```

Supporting changes:

| File | Change |
|---|---|
| `src/lib/entitlements/integrations.ts` (new, `server-only`) | `allowsIntegrations(tier)`; `controllerIdentified(row)` = non-empty `legal.legalName` and (`legal.address` or `contact.email`); `clearIntegrationsIfNotAllowed(tx, userId, tier)` returning names |
| `src/utils/db/columns.ts:10-31` | Add `integrations` to `PUBLIC_CATALOGUE_COLUMNS` |
| `src/utils/db/columns.ts:38-53` | **Not** in `CATALOGUE_EDITABLE_FIELDS`; add a comment saying why |
| `src/lib/catalogue/draft-cache.ts:61-71` | `integrations: row.integrations` in the server-owned list, so a stale Redis draft cannot shadow the saved value in the builder |
| `src/lib/catalogue/draft-cache.ts:75-82` | Strip `integrations` in `writeOwnedDraft` |
| `src/lib/rate-limit.ts:8-19` | `integrations: { requests: 20, window: "1 h" }` |
| `src/actions/catalogue.ts:437-445` (publish) and `:145-152` (re-activation) | When the tier lacks the feature, also `set({ integrations: {} })`. Belt and braces for a missed webhook |
| `src/actions/catalogue.ts:180-240` (duplicate) | Unchanged: `pickEditable` already leaves `integrations` behind. Decision: a duplicate starts without tracking |

Plan check: `getPlanForUpdate` locks the users row `for no key update` (`src/lib/entitlements/plan.ts:27-38`), the same order publish uses (select catalogue, lock user, update catalogue), so lock ordering stays consistent.

Revalidation: `revalidateCatalogue(name)` (`src/lib/cache/revalidate.ts:8-18`) purges `/catalogues/<name>` and its tags; `revalidateDashboard()` is not needed (no counts change).

### 5.4 Downgrades (F8)

- `applyPlanDowngrade` (`src/lib/entitlements/catalogue.ts:37-78`) also calls `clearIntegrationsIfNotAllowed` and returns those names with the deactivated ones.
- The activation branch of the webhook (`src/utils/paddle/process-webhook.ts:131-155`) calls `clearIntegrationsIfNotAllowed(tx, userId, tierForPlanId(subscription.priceId))` too, so a paid-to-lower-paid move stops the tag. It does not run the rest of `applyPlanDowngrade` (scope control; the broader paid-to-paid gap is out of scope).
- After commit, `revalidateCatalogue(name)` for every cleared name (`process-webhook.ts:213-215` today revalidates deactivated ones only).
- **Decision: clear, don't suspend.** A suspended state needs a third key, a CHECK change and render logic; re-entering a 12-character ID after an upgrade is cheap. The cancellation email lists catalogues whose tracking was removed.

---

## 6. Render path (item 4)

### 6.1 A separate root layout for the published catalogue (Decision)

```
src/app/
  (app)/layout.tsx                         current root layout: GTM, Clarity, UploadThing SSR plugin, PageWrapperClient
  (app)/(site)/…   (app)/admin/…   (app)/auth/…
  (app)/catalogues/[name]/preview/page.tsx owner preview stays in the app (identity, draft)
  (catalogue)/layout.tsx                   NEW: public catalogue root layout
  (catalogue)/catalogues/[name]/page.tsx   the ISR page, moved unchanged + tracking mount
  (catalogue)/catalogues/[name]/error.tsx
  api/…  manifest.ts  robots.ts  sitemap.ts  llms.txt/  global-error.tsx   (no layout needed)
```

- **Fact (Next.js).** "If you navigate between routes that use different root layouts, it'll trigger a full page reload" ([Next.js 15 route groups](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups); research code-render-path §9.4).
- **Gains (Inference).** Every exit from a catalogue to `/`, `/auth`, the policy pages or `/admin`, and every entry from the dashboard's `next/link` (`src/components/dashboard/overview/DashboardItem.tsx:151`), becomes a full load, so the tenant tag never shares a document with the app. The catalogue document stops loading Clerk/supabase-js, `UserContext` and its server action, the site banner, Quicktalog's GTM and Clarity (F3). No guard code can forget a link.
- **Costs (Inference, needs a build check).** Moving files under `(app)`; `not-found.tsx`, `error.tsx` and `loading.tsx` need a home per group (Next 15.4+ offers `global-not-found.js` behind a flag); the catalogue layout must provide `MainContextProvider` because `CatalogueContent` destructures it without a null check (`src/components/catalogue/view/CatalogueContent.tsx:59`); the two groups both define `catalogues/[name]` with different leaf pages, which Next allows only if the build agrees.

```tsx
// src/app/(catalogue)/layout.tsx
import "../globals.css";
import { PublicCatalogueProviders } from "@/components/catalogue/public/PublicCatalogueProviders";
// New helper: the font-variable className the app root layout builds inline today (src/app/layout.tsx:43).
import { fontVariables } from "@/lib/fonts";

/**
 * Root layout for published catalogues only. A published catalogue is a business's page:
 * no Quicktalog GTM or Clarity, no auth SDK, no user context, no site cookie banner here.
 * Crossing into another root layout is a full page load, which is what keeps a
 * business's Google tag out of the app (docs/architecture/catalogue-tracking.md).
 */
export default function CatalogueRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={fontVariables} lang="en">
      <body className="product" suppressHydrationWarning>
        <PublicCatalogueProviders>{children}</PublicCatalogueProviders>
      </body>
    </html>
  );
}
```

`PublicCatalogueProviders` holds `MainContextProvider` only (the view components already tolerate a missing `CatalogueContext`, e.g. `src/components/catalogue/view/Catalogue.tsx:44`, `CatalogueFooter.tsx:31`).

**Fallback if the build check fails (Option A from research code-render-path §9.2).** A sibling component in the same page with runtime guards: landing-document check via `performance.getEntriesByType('navigation')[0]`, pathname-aware wrappers around GTM and Clarity in the root layout, hard navigation for every link in the catalogue chrome, and the `CookieBanner` reactivity fix. It is weaker: the auth SDK still loads next to the tenant tag.

### 6.2 Where it mounts, and how the ID reaches the client

Only `src/app/(catalogue)/catalogues/[name]/page.tsx` mounts it, beside `<Catalogue>`. Never `Catalogue.tsx`, the header, footer or content components (shared with preview and the builder, F2), never a `[name]/layout.tsx` (it would wrap `/preview`), never the root layout.

```tsx
// in the published page, replacing page.tsx:143-147
if (item.status === "active") {
  const tags = publicTagConfig(item, await catalogueTagsEnabled());
  return (
    <CatalogueEventsProvider active={tags !== null}>
      <Catalogue item={item} type="view" />
      {tags && <CatalogueTracking config={tags} />}
    </CatalogueEventsProvider>
  );
}
```

```ts
// src/lib/tracking/public-config.ts (server-only, pure)
export type PublicTagConfig = {
  catalogueId: string;          // immutable: cookie prefix and consent key
  slug: string;                 // cookie_path, pathname guard
  ga4MeasurementId: string;     // re-validated here and again in the browser
  googleAds: boolean;
  businessName: string;         // rendered as text, never HTML
  locale: string;
  privacyPolicyUrl: string | null;
  developerId: string | null;   // Google tag Developer ID, once issued
};

export function publicTagConfig(item: Catalogue, enabled: boolean): PublicTagConfig | null {
  const id = checkGa4Id(item.integrations?.ga4MeasurementId);
  if (!enabled || item.status !== "active" || !id.ok) return null;
  return {
    catalogueId: item.id,
    slug: item.name,
    ga4MeasurementId: id.id,
    googleAds: item.integrations?.googleAds === true,
    businessName: (item.legal?.legalName?.trim() || item.metadata?.title?.trim() || kebabToTitle(item.name)).slice(0, 120),
    locale: localeForLanguage(item.language),            // src/lib/catalogue/items.ts:97-100
    privacyPolicyUrl: httpsUrlOrNull(item.legal?.privacyPolicy),
    developerId: developerIdOrNull(process.env.GOOGLE_TAG_DEVELOPER_ID),
  };
}
```

- The config travels as a React prop in the RSC payload, the same escaped channel the whole row already uses (research code-render-path §2.4). Nothing is interpolated into script source.
- `catalogueTagsEnabled()` is a kill switch in `src/lib/ops/flags.ts`, using the existing Global Config store with an env fallback (`src/lib/ops/flags.ts:1-23`). Flipping it plus a revalidation of all catalogues turns every tenant tag off within minutes.
- Only `/catalogues/<slug>` documents get the config. ISR stays untouched: no cookies read on the server, nothing per visitor (`.claude/CLAUDE.md`, data access rules).

### 6.3 Loader: no inline executable JS (Decision)

**Why not `@next/third-parties` or `next/script`.** F22: the GA component interpolates the ID into an inline script, drops `&l=`, and sets no consent default; `next/script` de-duplicates by `id || src` (`node_modules/next/dist/client/script.js:71-75`, research code-render-path §8.4). A plain DOM insertion from bundled code gives exact ordering and no inline script.

```ts
// src/lib/tracking/google-tag.ts  (imported only by client components)
import { GA4_MEASUREMENT_ID } from "@quicktalog/common";
import type { PublicTagConfig } from "./public-config";
import { type Choice, googleConsent, DENY_ALL } from "./consent";
import { hasQuicktalogSession, isFramed, onOwnPage } from "./guards";

const LAYER = "qtDataLayer";   // private data layer, never window.dataLayer
const GROUP = "qt_tenant";     // explicit routing; group names can't contain a dash
/**
 * User-defined variable types that can read cookies, globals or DOM text, plus the
 * script and pixel classes a G- container should not run anyway. IDs from Google's
 * restrict-tag-deployment table. UNVERIFIED for gtag-loaded containers: phase 0 probe.
 */
const BLOCKLIST = ["k", "j", "d", "jsm", "customScripts", "customPixels",
  "nonGoogleScripts", "nonGooglePixels", "nonGoogleIframes"];
const THIRTEEN_MONTHS_S = 34_128_000;

declare global { interface Window { qtDataLayer?: unknown[] } }

let loadedId: string | null = null;
let developerId: string | null = null;

// gtag.js only processes Arguments objects; the same values pushed as an array are
// ignored (probe, research google-tag-docs §4.6).
// biome-ignore lint/style/noArguments: gtag.js requires an Arguments object
function qtag(..._args: unknown[]) { window.qtDataLayer?.push(arguments); }

/** Short, stable, never reused: derived from the immutable catalogue id, not the slug. */
export const cookiePrefix = (catalogueId: string) =>
  `qt_${catalogueId.replace(/-/g, "").slice(0, 12)}`;

export function loadGoogleTag(cfg: PublicTagConfig, choice: Choice): void {
  if (loadedId || !choice.analytics) return;                 // basic mode: only after a grant
  if (!GA4_MEASUREMENT_ID.test(cfg.ga4MeasurementId)) return; // never trust the prop alone
  if (!onOwnPage(cfg.slug) || isFramed() || hasQuicktalogSession()) return;

  window.qtDataLayer = window.qtDataLayer ?? [];
  window.qtDataLayer.push({ "gtm.blocklist": BLOCKLIST });     // before any tag can fire

  // Consent first: default, then the visitor's choice (Google: default before config).
  qtag("consent", "default", DENY_ALL);
  qtag("consent", "update", googleConsent(choice));
  developerId = cfg.developerId;
  if (developerId) qtag("set", `developer_id.${developerId}`, true);
  qtag("set", "ads_data_redaction", true);
  // One catalogue, one set of cookies: host-only, path-scoped, prefixed, Secure.
  qtag("set", {
    cookie_domain: "none",
    cookie_prefix: cookiePrefix(cfg.catalogueId),
    cookie_path: `/catalogues/${cfg.slug}`,
    cookie_flags: "SameSite=Lax;Secure",
    cookie_expires: THIRTEEN_MONTHS_S,
  });
  qtag("js", new Date());
  qtag("config", cfg.ga4MeasurementId, {
    groups: GROUP,
    allow_google_signals: choice.advertising,
    allow_ad_personalization_signals: choice.advertising,
  });

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.ga4MeasurementId)}&l=${LAYER}`;
  script.dataset.qtTag = "google";
  document.head.appendChild(script);
  loadedId = cfg.ga4MeasurementId;
  watchForSession(cfg.ga4MeasurementId);
}

export function sendTenantEvent(name: string, params: Record<string, unknown>): void {
  if (!loadedId) return; // no consent, no tag: no event
  qtag("event", name, {
    ...params,
    send_to: GROUP,
    ...(developerId ? { [`developer_id.${developerId}`]: true } : {}),
  });
}

/** A signed-in session appeared (another tab): stop sending and reload, so the guard applies. */
function watchForSession(id: string): void {
  const check = () => {
    if (!hasQuicktalogSession()) return;
    (window as unknown as Record<string, boolean>)[`ga-disable-${id}`] = true;
    location.reload();
  };
  document.addEventListener("visibilitychange", check);
  window.addEventListener("focus", check);
  (window as { cookieStore?: EventTarget }).cookieStore?.addEventListener("change", check);
}

/** Withdrawal: a loaded gtag.js can't be unloaded, so stop it, delete its cookies, reload. */
export function withdraw(cfg: PublicTagConfig): void {
  if (loadedId) {
    qtag("consent", "update", DENY_ALL);
    (window as unknown as Record<string, boolean>)[`ga-disable-${cfg.ga4MeasurementId}`] = true;
  }
  deletePrefixedCookies(cookiePrefix(cfg.catalogueId), `/catalogues/${cfg.slug}`);
  if (loadedId) location.reload();
}
```

`deletePrefixedCookies(prefix, path)` walks `document.cookie` (which on this path lists only cookies visible to it) and expires each name starting with `${prefix}_ga` with the same path, host-only, `Secure`.

```ts
// src/lib/tracking/guards.ts
/** True when this browser holds a Quicktalog session (Supabase or Clerk). Presence only; no value is read. */
export function hasQuicktalogSession(cookie = document.cookie): boolean {
  return /(?:^|;\s*)(?:sb-[a-z0-9]+-auth-token(?:\.\d+)?|__session(?:_[A-Za-z0-9-]+)?|__refresh(?:_[A-Za-z0-9-]+)?)=[^;]/
    .test(cookie);
}
export const isFramed = () => window.top !== window.self;
export const onOwnPage = (slug: string) =>
  location.pathname === `/catalogues/${slug}` || location.pathname === `/catalogues/${slug}/`;
```

Cookie names come from `src/lib/auth/cookie-options.ts:23-33` (`sb-<ref>-auth-token`, chunked as `.0`, `.1`) and `src/utils/supabase/session.ts:8-16` (Clerk's `__session`, `__refresh`). `__client_uat` is deliberately not matched: Clerk sets it to `0` for signed-out visitors (research consent §1.2).

The session check runs in the browser after hydration and reads no value and no identity, so the ISR cache and the server are untouched. **Decision for the founder to confirm:** this matches the intent of "Public pages and ISR never read cookies or user identity" (`.claude/CLAUDE.md`), which is about server rendering and caches.

**Strict-CSP compatibility (Inference).** The loader adds no inline script and creates one external script from a `'self'` bundle:
- Under a host-allowlist CSP without `'unsafe-inline'` it needs only `script-src https://www.googletagmanager.com`. The page as a whole still needs `'unsafe-inline'` for Next's flight scripts (research code-render-path §7.3).
- Under a nonce + `'strict-dynamic'` CSP (the Vercel self-fetch pattern), a script created by a trusted bundle is trusted.
- Under Trusted Types, `script.src` would need a policy for the googletagmanager URL (future).

### 6.4 Navigation inside the catalogue layout

- Catalogue-to-catalogue links are the only soft navigations left (same root layout). `SmartLink` renders `next/link` for relative URLs (`src/components/general/SmartLink.tsx:54-58`). In the public layout it renders a plain `<a>` (a `hardNavigation` flag from `PublicCatalogueProviders`).
- **Search (Decision):** public catalogues stop mirroring the search box into `?q=` on every keystroke (`src/components/catalogue/view/CatalogueContent.tsx:88-95`). They keep reading `?q=` on load, so shared links still work.
  - GA4's history listener reacts to `replaceState` and treats `q` as a site-search key ([Google](https://support.google.com/analytics/answer/9216061), research google-tag-docs §7.1). Each keystroke would otherwise become a `page_view` with the visitor's raw text in `page_location`.
  - Quicktalog sends one sanitised `search` event instead (section 11).
  - Fallback if the founder wants to keep shareable search URLs: write the URL only after 1 s idle, and accept raw terms in `page_location`.

---

## 7. Consent banner (item 5)

### 7.1 Scope and mode (Decisions)

- **Per catalogue.** Consent for Bistro A's Google Analytics is not consent for Salon B's: consent must be specific and name the controller (GDPR Art. 4(11); EDPB 05/2020 paras 64-65, research consent §4.1).
- **Shown only when the published catalogue has a tag** (decided at ISR time from catalogue data). Starter catalogues and catalogues without a tag show no banner, but get the footer privacy link from section 7.4 once Quicktalog's own catalogue tools are consent-free (research consent §6.4).
- **Shown to every visitor, worldwide.** ISR cannot vary by geography, and the customer base is EU- and Serbia-heavy. Google's region-scoped defaults would need `gtag.js` loaded first, which basic mode forbids (research google-tag-docs §4.3).
- **Basic consent mode only.** No Google request of any kind before Accept.
  - **Fact.** Google's CMS guide asks platforms to unblock tags (advanced mode, cookieless pings before consent) ([Google](https://developers.google.com/tag-platform/devguides/gtag-integration), research google-tag-docs §4.4).
  - **Fact.** The EDPB treats JavaScript-built requests that collect device data as "gaining access" under ePrivacy Art. 5(3) (Guidelines 2/2023 paras 50-53, 63, research consent §2.1).
  - **Fact.** Every shared-origin analogue inspected uses basic mode: Linktree, Calendly, Tally with its banner on (research shared-domain-implementations §5.7).
  - **Inference.** Advanced mode would make Quicktalog a party to pre-consent processing for thousands of EU businesses in exchange for modelled conversions. Not offered in v1; revisit only with counsel.

### 7.2 UX on a phone opened from a QR code

- **Shape.** A non-blocking bottom sheet anchored to the bottom safe area, at most about 35% of a 390×844 viewport. No backdrop, no scroll lock, no focus trap: the menu stays fully usable, because a cookie wall is not freely given consent (EDPB 05/2020 paras 39-41).
- **Semantics.** `role="region"` with `aria-label="Cookie choices"`, placed early in DOM order so screen readers reach it, but visually fixed at the bottom. Not auto-focused (non-modal).
- **Buttons.** **Reject** and **Accept** side by side, the same size and visual weight (EDPB taskforce para 08; CNIL FAQ Q37-39; VG Hannover 2025 on steering, research consent §2.4-2.5). Below them, two links: "Choose" and "Privacy notice". Touch targets at least 44 px; WCAG AA contrast inside the catalogue theme, including dark themes.
- **Ignoring it is a refusal.** After the visitor scrolls about one screen without choosing, the sheet collapses to a small "Privacy choices" pill. Nothing is stored and no tag loads; the full sheet returns on the next visit (CNIL FAQ Q19; EDPB's own site, research consent §4.3).
- **Motion.** Respects `prefers-reduced-motion`.

### 7.3 Copy (EN template; native and legal review required)

Analytics only:
> **{Business}** uses Google Analytics to count visits to this page. If you agree, Google stores cookies on your device and receives information about your visit, including in the USA. Nothing is sent to Google unless you agree. You can change your choice anytime under "Privacy choices" at the bottom of the page.
> [Reject] [Accept] · Choose · Privacy notice

With `googleAds`: "…uses Google Analytics to count visits and Google Ads to measure its advertising."

Serbian (Latin), illustration only:
> **{Business}** koristi Google Analytics za merenje poseta ovoj stranici. Ako se saglasite, Google čuva kolačiće na vašem uređaju i dobija podatke o vašoj poseti, i u SAD. Ništa se ne šalje Google-u bez vaše saglasnosti. Izbor možete promeniti bilo kada preko „Podešavanja privatnosti" na dnu stranice.
> [Odbij] [Prihvati] · Izaberi · Obaveštenje o privatnosti

**Second layer ("Choose").**
- Toggles, all off (Planet49, research consent §2.3): "Statistics (Google Analytics)" and, only when the owner declared `googleAds`, "Advertising (Google Ads)".
- **Advertising is disabled until Statistics is on**, with the line "Advertising measurement uses the same Google tag, so it needs Statistics on." Reason: loading the tag for advertising alone would send GA4 cookieless pings for a purpose the visitor refused.
- A table of vendors and cookies; buttons "Reject all", "Accept all", "Save choices".

**GPC.** `navigator.globalPrivacyControl === true` makes "Accept" grant Statistics only; Advertising needs an explicit toggle (CCPA opt-out signal, research consent §2.9).

### 7.4 Privacy notice and the withdrawal path

- An in-page sheet generated from structured data, rendered by the public-only component, not a new route. Contents (research consent §3.3):
  - the controller (`legal.legalName`, address, contact);
  - purposes;
  - recipients: Google, as processor for GA4 per Google's terms ((snippet) [Google](https://support.google.com/analytics/answer/6004245));
  - cookie names `{prefix}_ga` and `{prefix}_ga_{stream}`, with the 13-month lifetime;
  - the consent record (localStorage, 6 months);
  - transfers (EU-US Data Privacy Framework);
  - Quicktalog as host and processor, its consent-free statistics and security cookies, and a link to Quicktalog's privacy policy;
  - rights, withdrawal, and the right to complain to a supervisory authority;
  - the owner's own policy, only when `legal.privacyPolicy` parses as an `https:` URL. Today that field is treated as a URL by the UI but as up to 20,000 characters of text by the AI schema (research consent §3.4).
- **"Privacy choices" link** after the footer, rendered by the tracking component. Not inside `CatalogueFooter`, which preview shares.
- **Withdrawal** reopens the same layer (EDPB 05/2020 para 114). Choosing Reject calls `withdraw()`: consent update to denied, `ga-disable-<ID>`, delete the prefixed cookies, then reload so no Google script remains in the document.

### 7.5 Storage, expiry and records

```ts
// src/lib/tracking/consent.ts  (browser only)
export const BANNER_VERSION = "2026-10-01.1"; // bump when the notice text or vendor wording changes
const KEY = (catalogueId: string) => `qt.consent.v1.${catalogueId}`; // immutable id: slugs can be reused
const MAX_AGE_MS = 182 * 24 * 60 * 60 * 1000;                       // ~6 months (CNIL FAQ Q21; Garante)

export type Choice = { analytics: boolean; advertising: boolean };
type Stored = Choice & { v: string; vendors: string; t: number; id: string };

export const DENY_ALL = {
  ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied",
} as const;

export function googleConsent(c: Choice) {
  const ads = c.analytics && c.advertising ? "granted" : "denied";
  return {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: ads, ad_user_data: ads, ad_personalization: ads,
  } as const;
}

/** What the visitor was asked about. A change here or in BANNER_VERSION re-prompts (EDPB 05/2020 para 110). */
export const vendorsOf = (cfg: { googleAds: boolean }): "ga" | "ga+ads" =>
  cfg.googleAds ? "ga+ads" : "ga";

export function readChoice(catalogueId: string, vendors: string, now = Date.now()) {
  try {
    const raw = window.localStorage.getItem(KEY(catalogueId));
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<Stored>;
    if (s.v !== BANNER_VERSION || s.vendors !== vendors) return null;
    if (typeof s.t !== "number" || now - s.t > MAX_AGE_MS) return null;
    return {
      analytics: s.analytics === true,
      advertising: s.analytics === true && s.advertising === true,
      id: String(s.id ?? ""),
    };
  } catch {
    return null; // private mode, blocked storage, bad JSON: "no choice yet"
  }
}

export function saveChoice(catalogueId: string, vendors: string, choice: Choice): string {
  const id = crypto.randomUUID();
  try {
    window.localStorage.setItem(
      KEY(catalogueId),
      JSON.stringify({ ...choice, v: BANNER_VERSION, vendors, t: Date.now(), id }),
    );
  } catch {
    // Storage blocked: the choice applies to this page view only.
  }
  return id;
}
```

- **Why localStorage, not a cookie (Decision).** It never reaches the server, so the ISR and "no cookies on public pages" rules stay clean. The record itself is exempt as strictly necessary (EDPB taskforce para 30; CNIL Délibération 2020-091 art. 5, research consent §4.2). Safari ITP clears it after 7 days without interaction, which only means more prompts.
- **Known weakness (Inference).** localStorage is readable by any first-party script on any path, so a tenant container with the `j` (JavaScript Variable) type could probe whether a visitor holds another catalogue's record. Low value, and the blocklist removes `j`. The alternative, a path-scoped cookie, hides other catalogues' records from `document.cookie` but is sent to the server on every request.
- **Re-prompt** after 6 months, on a vendor or text change, or when storage is empty. A refusal is remembered for 6 months too.
- **Records of consent (phase 2).** Google's EU user consent policy requires advertisers to "retain records of consent" ([Google](https://www.google.com/about/company/user-consent-policy/)), and EDPB 05/2020 para 108 says pointing to a correct configuration is not proof (research consent §4.4). Design:
  - On every choice, `fetch("/api/consent", { method: "POST", keepalive: true })` with `{ catalogueId, consentId, bannerVersion, vendors, analytics, advertising, language }`.
  - No cookie, no auth, no IP stored. A 1 KB body cap and a strict schema.
  - Rate limit keyed by a hash of the IP (a new `consent` rule in `src/lib/rate-limit.ts`).
  - Insert through `withPublic` into an append-only table whose insert policy requires an active catalogue with tracking (sketch below). Owners can export their own records.
  - Retention period set by counsel.

```sql
-- phase 2 migration (sketch)
create table public.consent_events (
  id bigint generated always as identity primary key,
  catalogue_id uuid not null references public.catalogues(id) on delete cascade,
  consent_id uuid not null,
  banner_version text not null check (banner_version ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}\.[0-9]{1,3}$'),
  vendors text not null check (vendors in ('ga', 'ga+ads')),
  analytics boolean not null,
  advertising boolean not null check (analytics or not advertising),
  language text not null check (length(language) <= 10),
  created_at timestamptz not null default now()
);
alter table public.consent_events enable row level security;
grant insert (catalogue_id, consent_id, banner_version, vendors, analytics, advertising, language)
  on public.consent_events to app_public;
create policy consent_events_insert_public on public.consent_events for insert to app_public
  with check (exists (select 1 from public.catalogues c
                      where c.id = catalogue_id and c.status = 'active' and c.integrations <> '{}'::jsonb));
grant select on public.consent_events to app_user;
create policy consent_events_select_owner on public.consent_events for select to app_user
  using (exists (select 1 from public.catalogues c
                 where c.id = catalogue_id and c.user_id = (select private.current_user_id())));
```

### 7.6 Language (Decision)

- The notice uses the catalogue's `language` mapped by `localeForLanguage` (`src/lib/catalogue/items.ts:60-100`, 32 codes), with English as the fallback.
- **Launch set:** English, Serbian Latin and Cyrillic, and the EU/EEA official languages among the 32 codes: spa, fra, deu, ita, por, nld, swe, dan, fin, nor, pol, ces, hun, bul, hrv, slk, slv.
- Every translation is reviewed by a native speaker before it is enabled, because it is legal text.
- Others fall back to English, with the owner warning from section 3.2.
- A read-only PROD query of language by plan (with approval) can trim or reorder the set.

---

## 8. Cookie isolation (item 6)

| Control | Value | Why |
|---|---|---|
| `cookie_prefix` | `qt_` + first 12 hex chars of the catalogue UUID | GA4 renames `_ga` to `<prefix>_ga` ([Google](https://developers.google.com/tag-platform/security/guides/customize-cookies)). From the immutable id because a deleted catalogue's slug can be re-registered by another business, which must not inherit returning visitors' client ids |
| `cookie_path` | `/catalogues/<slug>` | Cookies don't travel to other catalogues; RFC 6265 path matching means `/catalogues/bistro` does not match `/catalogues/bistro-luna`. Slugs are safe in a path (`^[a-z0-9]+(-[a-z0-9]+)*$`, `packages/src/drizzle/migrations/schema.ts:149`) |
| `cookie_domain` | `'none'` (host-only) | The default `'auto'` writes on `.quicktalog.app`, visible to `test.quicktalog.app` and shared with Quicktalog's own `_ga` (research google-tag-docs §3.2) |
| `cookie_flags` | `SameSite=Lax;Secure` | GA's default is not `Secure`, even on https (probe, research google-tag-docs §3.2) |
| `cookie_expires` | 13 months | Matches CNIL's guidance for audience trackers; shorter than GA's 2-year default. Founder/counsel decision |
| Data layer | `qtDataLayer` via `&l=`, module-scoped `qtag`, `groups`/`send_to: 'qt_tenant'` | The customer's command queue never mixes with anything else; Google requires `l=` for a renamed layer ([Google](https://developers.google.com/tag-platform/devguides/datalayer)) |
| No Quicktalog Google tag in the document | Separate root layout | Removes the first-visit shared client id and the page-global consent bleed (F23) |

**Where the research disagrees (Decision).** google-tag-docs §3.4 prefers "the tenant tag is the only Google tag and uses `window.dataLayer`"; code-render-path and code-write-path prefer a renamed layer. This design does both: the tenant tag is the only Google tag in the catalogue document **and** uses a renamed layer. "One data layer per page" (Google's aside, research google-tag-docs §3.3) is still met, because there is only one layer; the rename costs nothing and keeps anything that pushes to `window.dataLayer` (for example `src/utils/cookies.ts:36-71`) out of the tenant's queue.

**What no analogue does (Fact).** Linktree, Calendly, Tally and Gumroad leave `cookie_domain:'auto'` and set no prefix or path, so every tenant shares one `_ga` (research shared-domain-implementations §5.4). Per-catalogue isolation goes beyond the market; it was verified only in Chromium, so Safari and Firefox are on the test list.

---

## 9. Quicktalog's own tools on catalogue pages (item 7)

| Tool | Today on `/catalogues/<slug>` | After | Why | Traffic meter |
|---|---|---|---|---|
| GTM `GTM-W9RHLVK6` (GA4 `G-DT7TJQYK3K`, Hotjar, a GA4 event named with the full URL) | Root layout, every route, no consent (F3; research code-render-path §6.4) | **Not in the catalogue layout** | Unconsented on a business's page (VG Hannover 2025: GTM itself needs consent, research consent §2.5); page-global consent and the first-visit `_ga` collision with the tenant tag (F23); a remotely editable code channel on tenant pages | None |
| Microsoft Clarity | Root layout (`src/components/general/ClarityScript.tsx:5-17`) | **Not in the catalogue layout** | Session recording and Microsoft ad ids (research consent §1.2, §5.1); it honours Google Consent Mode, so the tenant's notice would govern it | None |
| PostHog | Cookie + localStorage, one persistent id across every catalogue and the marketing site (F12) | On catalogue documents: `cookieless_mode: "always"`, `person_profiles: "never"`, no `identify`; no pageview capture on `/catalogues/<slug>/preview` | No storage, no cross-catalogue id ([PostHog](https://posthog.com/tutorials/cookieless-tracking), research consent §5.2). Installed posthog-js 1.434.7 supports it (`node_modules/posthog-js/dist/module.js` contains `cookieless_mode`) | `$pageview` with `$current_url`, `$host` and `$pathname` keeps flowing, so the worker query (F13) and the dashboard keep working. Owner previews stop counting toward the limit (a bug today, research code-render-path §5) |
| Sentry | Errors plus replay-on-error buffer in sessionStorage (F12) | On catalogue documents: errors only, no `replayIntegration`, `sendDefaultPii: false` | Replay records the page; storage access. Error capture is disclosed as security processing | None |
| Auth SDK, `UserContext`, site cookie banner | Mounted on every page (F3) | **Not in the catalogue layout** | Identity never reaches a public page; anonymous visitors get no auth cookies; less JavaScript next to the tenant tag | None |
| Cloudflare `__cf_bm`, `cf_clearance`, `_cfuvid`; Cloudflare Web Analytics beacon (origin unknown) | Edge | Keep the cookies (security, disclosed); find what injects the beacon | Bot-management cookies are commonly strictly necessary (research consent §5.5) | None |

How `instrumentation-client.ts` branches (it runs once per document, and with a separate root layout every catalogue load is a fresh document):

```ts
// src/instrumentation-client.ts (sketch of the change around :5-26)
const path = typeof location !== "undefined" ? location.pathname : "";
const isPublicCatalogue = /^\/catalogues\/[a-z0-9-]+\/?$/.test(path);
const isPreview = /^\/catalogues\/[a-z0-9-]+\/preview\/?$/.test(path);

posthog.init(key, {
  /* …existing options… */
  capture_pageview: !isPreview,
  ...(isPublicCatalogue ? { cookieless_mode: "always", person_profiles: "never" } : {}),
});
Sentry.init({ /* … */ integrations: isPublicCatalogue ? [] : [Sentry.replayIntegration()] });
```

**What changes in the numbers (Inference).** Pageviews: unchanged. Unique visitors: PostHog's cookieless hash uses a daily salt, so multi-day uniques overcount. `docs/architecture/analytics.md:38` promises "unique visitors over the whole period", so the dashboard needs a relabel such as "visitors are counted per day". Verify on TEST with synthetic visits before PROD. PostHog's project setting "Cookieless server hash mode" must be on.

**Legal status (Inference).** Cookieless PostHog still collects device data via JavaScript, which the EDPB treats as "gaining access" (research consent §5.2). It is consent-free only under national exemptions, and Quicktalog's metering is its own purpose, not the business's audience measurement. It is a large improvement, not the end state. The end state (phase 5) is **server-side counting**: middleware runs before the CDN cache (F19), so it can send a server-side `$pageview` to PostHog for each real document request on `/catalogues/<slug>` via `event.waitUntil`, with a per-catalogue daily salted hash as `distinct_id`, no IP stored, bots and prefetches filtered. The worker and dashboard queries keep working because the same properties are set. Then no Quicktalog measurement code runs on catalogue pages at all. Counts will rise (ad-block users are counted), so `traffic_limit` may need recalibrating.

**Out of scope but noted.** On the marketing site and app, Quicktalog's GTM and Clarity still fire before any choice, because the custom `consent_default` event is not Consent Mode (F11; research consent §1.2). That needs its own fix: a real `gtag('consent','default',…)` before GTM in the app root layout, plus consent settings in the container.

---

## 10. CSP (item 8)

**Decision: a second header rule scoped to published catalogues**, placed after the global one in `next.config.ts:64-69`. Next: "If two headers match the same path and set the same header key, the last header key will override the first" ([Next.js headers](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers), research code-render-path §7.2). `/catalogues/:name` does not match `/catalogues/:name/preview`, so `/admin` and preview keep the app policy.

```ts
// next.config.ts headers() (sketch)
const catalogueCsp = [
  "default-src 'self'",
  // 'unsafe-inline' stays: Next's flight scripts on ISR pages. 'unsafe-eval' dropped here:
  // nothing on a public catalogue should need it (verify with reports first).
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  // PostHog (/ingest) and Sentry (/monitoring) are same-origin proxies.
  "connect-src 'self' https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://*.google.com",
  `frame-src 'self' https://www.googletagmanager.com ${EMBED_FRAME_HOSTS}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  `report-uri ${CSP_REPORT_URI}`,
].join("; ");

return [
  { source: "/:path*", headers: [{ key: "Content-Security-Policy-Report-Only", value: appCsp }] },
  { source: "/catalogues/:name", headers: [{ key: "Content-Security-Policy-Report-Only", value: catalogueCsp }] },
];
```

| Change | Why |
|---|---|
| `connect-src https://*.google.com` | Google lists it even for GA4 without Ads features ([Google CSP](https://developers.google.com/tag-platform/security/guides/csp), research code-render-path §7.2) |
| `connect-src https://*.analytics.google.com` | Required for EU/Swiss/UK collection ([Google](https://support.google.com/analytics/answer/12017362), research google-tag-docs §6.1) |
| `frame-src https://www.googletagmanager.com` | Google's default GA4 table and its service-worker case; the tenant can switch on Signals or Ads features remotely |
| `frame-src` embed hosts from one shared list | Fixes the existing 37-vs-3 drift for this route (09-25 PLAN 0b); without it enforcing breaks 36 embed hosts |
| Drop `'unsafe-eval'`, Clarity, Paddle, Cloudflare Turnstile and Supabase/Clerk hosts | None of them run in the catalogue layout (Turnstile is used only in `src/components/auth/`) |
| `report-uri` | Today nothing collects violations (F10). Sentry's CSP security endpoint needs no new route |

- **Not in v1 (Decision).** Google Ads hosts (`www.googleadservices.com`, `*.g.doubleclick.net`, `pagead2.googlesyndication.com`, `*.google.<TLD>`) and Meta (`connect.facebook.net`, `www.facebook.com`) are added only with phase 4. `*.google.<TLD>` cannot be wildcarded across country domains, so it is a report-only decision at enforcement time.
- **What CSP does not do here.** With `'unsafe-inline'` and a Google host allowed, CSP is not the boundary between a tenant and the app; ID validation, the root-layout boundary and the session guard are.
- **Enforcement path (phase 5).** Report-Only → read the reports → enforce on `/catalogues/:name` first. A nonce + `'strict-dynamic'` policy is possible on Vercel through the middleware self-fetch pattern ([Vercel KB](https://vercel.com/kb/guide/csp-nonces-with-cdn-cache)); its cost is a buffered transform on every document request. Also, custom-code iframes inherit the page CSP (research 09-30 codebase_embed_custom_code §3), so AI widgets that use `eval` would break once enforced; the reports will show it.

---

## 11. Events and UTMs (item 9)

### 11.1 Mechanism (Decision)

View components are shared by the public page, preview and builder, so they must not know about tags.
- They call `useCatalogueEvents()(event)`, from a small context whose default value is a no-op.
- Only the published page wraps `<Catalogue>` in `CatalogueEventsProvider` (section 6.2).
- The provider forwards to `sendTenantEvent`, which does nothing until the visitor has granted Statistics and the tag has loaded.
- Preview and builder have no provider, so their events go nowhere.

Every event carries `send_to: 'qt_tenant'` and, once Google issues one, `developer_id.<id>: true` (Google's CMS guide: "Attach the ID to every event", research google-tag-docs §7.2).

### 11.2 Events

| Moment | Code | GA4 event | Parameters |
|---|---|---|---|
| Item opened | `src/components/catalogue/cards/index.tsx:99` (card opens `ItemDetailModal`) | `view_item` | `currency`, `value` (price), `items: [{ item_id, item_name, item_list_name, price }]` |
| Phone or email tap in the header | `src/components/catalogue/view/CatalogueHeader.tsx:88-104` | `generate_lead` | `lead_source: "phone" \| "email"` |
| Phone or email tap in the footer | `src/components/catalogue/view/components/Contact.tsx:22`, `:40` | `generate_lead` | as above |
| Website link (logo) | `CatalogueHeader.tsx:157-161` | `select_content` | `content_type: "website"` |
| Header or footer CTA | `CatalogueHeader.tsx:132`; footer CTA | `select_content` | `content_type: "cta"`, `content_id: "header" \| "footer"` |
| Social link | `CatalogueFooter.tsx` socials | `select_content` | `content_type: "social"`, `content_id: <network>` |
| Newsletter sign-up succeeded | `CatalogueFooter.tsx:48-53` | `sign_up` | `method: "newsletter"`. **Never the email** |
| Search | search box, after 1 s idle, at least 2 characters, once per distinct term | `search` | `search_term`, cut to 100 characters, dropped if it looks like an email address or a 7+ digit number |
| Future Buttons block: WhatsApp, Viber, directions, book | the new blocks | `generate_lead` (`lead_source: "whatsapp" \| "viber" \| "directions"`), `book_appointment` | none beyond those |

Rules:
- No visitor-entered text other than sanitised search terms.
- No phone numbers or emails, even the business's.
- Values capped at 100 characters, event names at 40 (GA4 limits, research google-tag-docs §7.2).
- `generate_lead` + `lead_source` uses Google's recommended name, so owners can mark it a key event and import it into Google Ads. Custom names such as `contact_phone` read better but lose that (research google-tag-docs §7.3). Founder's call; this design picks the recommended names.

Owner documentation mentions overlap with enhanced measurement: outbound-click events for `wa.me` links, and scroll events.

### 11.3 UTMs on QR codes (phase 4)

- **Fact.** The QR target is pinned on the server: `catalogueUrl()` returns `${NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue}` and the action overwrites whatever was sent (`src/lib/qr/design.ts:143-146`; `src/actions/qr-configs.ts:33-37`).
- **Decision.** An optional "Add Google Analytics tags" switch in the QR editor, on by default when GA is connected, with a placement chosen from a fixed list (`table`, `window`, `flyer`, `packaging`, `other`). The server appends `?utm_source=qr_code&utm_medium=offline&utm_campaign=<placement>`. Never free text, so the pinning rule holds. Google: "always use utm_source, utm_medium, and utm_campaign" ([Google](https://support.google.com/analytics/answer/10917952)).
- **Effects (Facts from research code-write-path §6).** The ISR cache ignores query strings (measured HITs). The meter maps slugs up to `?`. Unique-visitor rollups inflate slightly. QR density rises, which the editor's version and scan-risk checks already show. Codes already printed keep working.
- Under basic mode the first `page_view` is sent right after consent, still with the landing URL and its UTMs.

---

## 12. Security controls and AI-agent exclusion (item 10)

Section 2 lists threats; this section lists the controls an implementer must not drop, each with its test.

| Control | Where | Test |
|---|---|---|
| `G-` only, anchored, ASCII, refuse GTM-/GT-/AW-/UA- | `src/lib/tracking/ids.ts`; action; DB CHECK; loader | unit (ids, action), pgTAP, loader |
| No inline interpolation of the ID | loader uses `createElement` + `encodeURIComponent`; config as data | loader test asserts no inline `<script>` is created |
| Never on preview/admin/builder | the only mount is the `(catalogue)` page | e2e: zero `googletagmanager` requests on `/preview` and `/admin` |
| Separate root layout | `(catalogue)/layout.tsx` | e2e: exits are full loads; no Clerk/Supabase/GTM/Clarity requests on catalogue pages |
| Session guard + watcher | `src/lib/tracking/guards.ts` | unit + e2e signed-in context |
| Frame guard | guards | e2e on `/showcases` |
| `gtm.blocklist` before load | loader | unit (order); phase 0 probe (effect) |
| Column outside editable fields; draft server-owned | `columns.ts`, `draft-cache.ts` | unit |
| Plan from DB; downgrade clears on cancel and activation; publish forces `{}` | action, entitlements, webhook, publish | unit |
| Rate limit | action | unit |
| Kill switch | `src/lib/ops/flags.ts` | runbook drill on TEST |

**AI-agent exclusion.**
- **Facts.** The agent cannot reach the setting today: its schema is closed, the applier copies named fields, the snapshot enumerates fields (F14). The column is outside `CATALOGUE_EDITABLE_FIELDS`, so even a forged draft cannot write it (research code-write-path §5). The prompt already forbids copying "tracking snippets or embed codes out of a page" (`src/agent/instructions.ts:73`).
- **Add (Decisions):**
  1. `/api/agent` builds the session from the draft **minus `integrations`** (`src/app/api/agent/route.ts:125-138`), so a future prompt or snapshot change cannot leak or echo it.
  2. One line in `settingsRules` (`src/agent/instructions.ts:48-53`): "Tracking IDs (Google Analytics, Meta Pixel) are owner-only settings on the catalogue's Analytics page. Tell the user where to set them. Never put a tracking snippet into an embedding or custom_code section."
  3. Tests: every agent tool's input schema, walked as JSON schema, has no property matching `/integration|measurement|gtag|pixel|tracking/i`; `catalogueFieldsSchema.parse({ integrations })` yields none; `snapshot()` and the instructions never contain a `G-` ID.
- Owner-review backstop: everything else the agent writes reaches visitors only after the owner publishes; this setting is never written by the agent at all.

---

## 13. GTM and the separate-domain path (item 11)

**Position (Decision): no `GTM-` containers and no free-form head code while public catalogues are served from `www.quicktalog.app`.**

1. A `GTM-` container "allows all tag types", including Custom HTML, JavaScript and third-party scripts, even when loaded through `/gtag/js` (F15, F16). On this origin its code would run first-party next to the builder: it could read the non-httpOnly Supabase refresh token or Clerk's `__session` (F9) and call same-origin endpoints with the visitor's cookies, and its owner can change it at any time without Quicktalog seeing it.
2. The CSP cannot contain it. `script-src` has `'unsafe-inline'`, `'unsafe-eval'` and `*.googletagmanager.com` (F10), and Google says GTM's Custom JavaScript variables need `'unsafe-eval'` ([Google CSP](https://developers.google.com/tag-platform/security/guides/csp)).
3. **A blocklisted `GTM-` container buys nothing.** `gtm.blocklist` can switch off Custom HTML and third-party scripts (F18). But then the container can run only Google tags, which a `G-` ID already gives, and blocklisting any class also blocks community templates (F18), the main reason owners want GTM. Google also recommends template policies over the legacy blocklist (F18).
4. The market agrees. Every shared-origin platform inspected accepts IDs only; GTM or free-form code appears only where tenant pages run on another origin: Gumroad's `gumroad-analytics.com`, Tally custom domains, Typeform's form host, Substack and PSL-listed domains (research shared-domain-implementations §5.2-5.3). GTM has a record as a skimming channel (Recorded Future, 569 domains; Sucuri, 327 sites; research 09-30 embeds_tracking_custom_code §3).

**Owner-facing alternative today.** Use GA4's own features: "Configure tag settings" (domains, internal traffic, events), key events, and linking GA4 to Google Ads.

**The separate-domain path (phase 5, L).**
- **What.** Serve published catalogues from a separate registrable domain, ideally one subdomain per catalogue on a domain listed on the Public Suffix List, so each business is its own site. Example: `<slug>.<new-domain>`; the name is the founder's choice.
- **Why it works (Inference).** Host-only Quicktalog cookies stay on `www.quicktalog.app`. Each tenant's cookies, storage and consent are isolated by the browser rather than by prefixes and paths. Same-site requests to the app no longer carry its cookies.
- **What has to move together** (research code-write-path §6):
  - permanent redirects from `www.quicktalog.app/catalogues/<slug>`, forever, because printed QR codes point there;
  - QR pinning (`src/lib/qr/design.ts:143-146`);
  - the worker's host filter (`backend/src/utils/analytics.ts:6-7`) and the dashboard's `$host` match (`src/lib/analytics/catalogue-traffic.ts:56`);
  - CRM view URLs (`packages/src/drizzle/migrations/schema.ts:254`, `:263`);
  - canonical and OG URLs, the sitemap, Vercel domains, the CSP, the PostHog host;
  - consent records, which reset on the new origin.
- **After that.** GTM could be offered at Premium behind the same consent notice, with a Terms clause and owner acceptance. Owner custom domains are the other natural home for it (the Tally model).

---

## 14. Plan gating (item 12)

| Tier (line in `packages/src/constants/pricing.ts`) | `features.integrations.googleAnalytics` |
|---|---|
| Starter (:5) | false |
| Basic (:38) | false |
| Pro (:70) | **true** |
| Growth (:102) | true |
| Premium (:134) | true |
| German Silva Custom Plan (:166) | founder's call; recommend true (it has Pro-like `embedding: true`) |

- **Why Pro.** Every analogue gates trackers behind a paid tier (Linktree Pro/Premium, Calendly paid, Tally Pro, Typeform Business, research shared-domain-implementations §5.1). Pro includes branding, so the owner can fill in the legal identity the notice needs (`applyPlanToCatalogue`, `src/lib/entitlements/catalogue.ts:13-28`). **Security reason (Inference):** a paid, payment-verified account raises the cost of the T2 attack and keeps the number of tenant tags small.
- **Do not reuse `features.analytics`.** It means the built-in dashboard tier ("Basic"/"Advanced", `packages/src/types/general.ts:39`).
- **Enforcement.** Server-side in the action (section 5.3), on downgrade (section 5.4), and at publish/re-activation. The public page cannot check plans, because `app_public` never sees `user_id` (`src/utils/db/columns.ts:6-9`), so downgrades must change stored data.
- **UI.** `LockedGroup` plus feature-aware overlay copy (section 3.4). New rows in `src/constants/pricing.ts:24-59`, `:112-204` and `src/components/dashboard/subscription/PlanFeatures.tsx:32-59`.

---

## 15. Testing, docs, rollout and outreach (item 13)

### 15.1 Unit (Vitest, `tests/unit/**`)

1. `ids`: valid IDs normalised; GTM-/GT-/AW-/UA-, lowercase-only after trim, non-ASCII (`ſ`), inner whitespace, too long and script payloads refused with the right reason; snippet extraction (one ID, repeated ID, two IDs, GTM present); the regex source equals the migration's literal.
2. `actions/integrations`: identity before anything; parse before the DB; Starter refused but remove allowed; legal precondition; 0 rows → "not found"; 23514 → message without Sentry; 42501 → Sentry; `revalidateCatalogue` after `withUser`; no Redis call; rate limit.
3. Columns: `CATALOGUE_EDITABLE_FIELDS` lacks `integrations`, `pickEditable` drops it, `PUBLIC_CATALOGUE_COLUMNS` has it.
4. Draft cache (a new test file): `readOwnedDraft` returns the row's value over the draft's; `writeOwnedDraft` strips it.
5. Entitlements and webhook: cleared on cancellation and on paid-to-lower-paid activation, names revalidated; publish forces `{}` on a tier without the feature.
6. Agent: schema walk, parse strip, snapshot and instructions free of `G-`, route strips the field.
7. Loader (happy-dom): nothing without consent, with an invalid ID, when framed, off-page or with a session cookie. With consent, the data-layer order is exactly blocklist → consent default → consent update → set (developer id, redaction, cookies) → js → config. The `src` is exact; `window.dataLayer` and `window.gtag` are untouched; runs once; withdrawal sets `ga-disable`, deletes only the prefixed cookies on that path, and reloads.
8. Consent store: per-catalogue key; 6-month expiry; vendor change re-prompts; storage exceptions treated as "no choice".
9. Banner: equal buttons, no pre-ticked toggles, Advertising needs Statistics, GPC, language fallback.
10. Events: no-op before load; `send_to` present; search sanitiser; newsletter event never carries the email.
11. CSP: the catalogue rule is last and its `source` matches `/catalogues/x` but not `/catalogues/x/preview`.

### 15.2 Database (pgTAP)

Section 4.2, plus the phase-2 `consent_events` policies (public insert only for active catalogues with tracking; owners read only their own; the public role reads nothing).

### 15.3 End-to-end (Playwright, TEST only, `playwright.config.ts:22-26`)

- **Setup.** A dedicated TEST account on a Pro price id (changing its `plan_id` is a TEST write that needs explicit approval) and a Quicktalog-owned GA4 test property, or route-abort `*.google-analytics.com`, `*.analytics.google.com` and `*.google.com` so no real property receives hits.
- **Cases:**
  - connect `G-…` and publish; in a fresh context there are no Google requests before Accept and exactly one `gtag/js?id=…&l=qtDataLayer` after it;
  - cookies are `qt_<12hex>_ga*`, host-only, path `/catalogues/<slug>`, `Secure`;
  - Reject → zero Google requests, also after reload;
  - preview and `/admin` → zero, and no notice;
  - a signed-in context on the public page → zero, plus the "paused" note;
  - `/showcases` frames → zero;
  - links from a catalogue to `/` and `/auth` are full navigations, and `gtag` is absent there;
  - Starter is locked, and Remove still works after a simulated downgrade;
  - GTM and snippet inputs show the right messages;
  - the catalogue CSP header differs from `/admin`'s.

### 15.4 Manual

- Real GA4 property on TEST: Tag Assistant, DebugView, Realtime.
- iOS Safari, Android Chrome and desktop Firefox: prefixed/path cookies, ITP behaviour, withdrawal.
- 360 px layout and dark themes; screen reader and keyboard; native review of every enabled translation.
- **The phase 0 security probe** (section 16).

### 15.5 Docs and skills to update

| File | Change |
|---|---|
| `docs/architecture/catalogue-tracking.md` (new; add to `docs/README.md`) | Storage and CHECK, the action, plan gate, root-layout boundary, loader order, consent flow and storage, cookie isolation, CSP, events, kill switch, why GA4 ≠ dashboard, why GTM is refused, the session guard |
| `docs/architecture/catalogue-html-safety.md` | Tracking is a typed setting, not a fifth sink; the root-layout boundary |
| `docs/architecture/analytics.md` | Cookieless PostHog on catalogue pages; visitor semantics (fix `:38`); preview no longer counted |
| `docs/architecture/data-access.md` | New column grants; `consent_events` public insert |
| `docs/architecture/builder.md` | The General-tab pointer |
| `docs/architecture/qr-codes.md` | UTM placement (phase 4) |
| `docs/architecture/ai-chat-flow.md` | The agent cannot set tracking |
| `.claude/skills/server-action-and-route/SKILL.md` | "Settings that bypass the draft" pattern; don't map 42501 to "not found" for plain updates |
| `.claude/skills/data-revalidation/SKILL.md` | An integrations row; fix the stale `src/app/api/items/route.ts` paragraph (research code-write-path §2) |
| `.claude/skills/adding-new-content-block/SKILL.md` | Tracking is never a block |
| Owner help article (marketing docs) | "Connect Google Analytics": where to find `G-`, testing, consent, lower numbers, private window, GTM not supported |
| Terms and privacy policy (legal) | Art. 28 processor terms, a visitor section, the cookie table, entity and jurisdiction (`src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:506-509` is still a placeholder, research consent §3.5) |

### 15.6 Rollout

1. Phase 0 approvals and probe (section 16).
2. Phase 1 (layout split, cookieless PostHog, no Replay, catalogue CSP Report-Only) on TEST. Check meter continuity with synthetic visits and a PostHog query. It ships with the `test` → `main` release, which also ends PROD's first-party execution of owner scripts.
3. Migrations to TEST, then PROD (section 4.4). Package release, then the app bump.
4. Kill switch on. Enable the setting for Quicktalog's own test catalogues, then the founder's, then all Pro+. Watch Sentry (loader errors), CSP reports, consent counts and support tickets.
5. Runbook: to stop all tenant tags, set the Global Config key and call the secret-protected `/api/revalidate` (`src/app/api/revalidate/route.ts:29-63`) for all catalogues.

### 15.7 Outreach (corrected premise)

- **Fact.** On PROD, owners' pasted GA, GTM or Pixel snippets in embed and custom-code blocks still run first-party (Corrections, section 0); on TEST there are no real customers (1 catalogue, 0 blocks, research code-write-path §7).
- **Steps:**
  1. With the founder's approval, run the drafted read-only PROD audit query (research code-write-path §7, syntax validated on TEST). It lists catalogues with `gtag(`, `googletagmanager`, `GTM-` or `fbq(` snippets, their block type, status, plan and owner email.
  2. Email those owners **before** the release date:

> Subject: Your Google Analytics code on Quicktalog changes on {date}
>
> Hi {name}, your catalogue "{slug}" has Google Analytics or Tag Manager code pasted into a {block} section. On {date} Quicktalog switches to a built-in, safer Google Analytics setting, and pasted tracking code will stop running. To keep measuring visits, open Quicktalog → {catalogue} → Analytics → Google Analytics and paste your measurement ID (it starts with G-). Visitors will be asked for consent first, as EU law requires. Google Tag Manager containers (GTM-…) can't be supported, because a container can run any code on your page. {If Pixel: Meta Pixel support is planned; we'll write when it's ready.}

  3. If the audit shows meaningful Meta Pixel use, pull phase 4b forward before the release. Owners on plans below Pro who rely on pasted GA get a plan note in the same email (founder's call whether to grandfather them).

---

## 16. Phased delivery with sizes (item 14)

S = a sitting, M = a few sittings, L = a week or more.

| Phase | Work | Size | Gate |
|---|---|---|---|
| **0. Decide and verify** | 0.1 Founder decisions (section 17) and approval of the read-only PROD audit | S | |
| | 0.2 **Security probe** with a Quicktalog-owned GA4 property and an upgraded Google tag: (a) can a `G-` container read a First Party Cookie or JavaScript Variable and send it in a GA4 event via `gtag/js?id=G-`; (b) does `gtm.blocklist` on `qtDataLayer` stop it without breaking `page_view`; (c) do `cookie_*` set-commands still apply when the tag uses the `gtm init` trigger (F17); (d) enhanced-measurement behaviour; (e) is `GT-` restricted; (f) Safari/Firefox cookies | M | If (a) succeeds and (b) fails, launch waits for httpOnly sessions or the separate domain |
| | 0.3 Apply for a Google tag Developer ID | S (+ wait) | |
| | 0.4 Counsel: processor terms, notice text, consent-record retention, entity/jurisdiction | external | EU launch |
| **1. Clean the catalogue document** | 1.1 `(catalogue)` root layout and file moves, not-found handling, providers | M | Build check |
| | 1.2 `instrumentation-client` branches: cookieless PostHog, no Replay, no preview capture; PostHog project setting | S | Meter continuity on TEST |
| | 1.3 Hard catalogue-to-catalogue links; search stops mirroring to the URL; `CookieBanner` reactivity fix (`CookieBanner.tsx:65`) | S | |
| | 1.4 Catalogue CSP rule, Report-Only, with a report endpoint | S | |
| **2. Consent foundation** | 2.1 Notice, choices, privacy notice, consent store, launch translations | M | Native review |
| | 2.2 `consent_events` migration, `/api/consent`, owner export | M | |
| **3. GA4 setting** | 3.1 Migration, pgTAP, drizzle pull, package 1.67.0 | S | Section 4.4 order |
| | 3.2 Action, schema, entitlements, draft cache, webhook and publish reconciliation, rate limit | M | |
| | 3.3 Analytics-page card, General pointer, pricing rows, lock copy, notice preview | M | |
| | 3.4 Loader, guards, events provider, event hooks in cards/header/footer | M | |
| | 3.5 Agent hardening and tests; docs and skills; e2e | M | Phases 0-2 done |
| **4. Extensions** | 4a QR UTM placement | S | |
| | 4b Meta Pixel: CHECK widened by migration, basic mode, `fbq('consent','revoke')` until grant, `autoConfig` off, CSP hosts | M | PROD audit shows demand |
| | 4c Google Ads `AW-` conversions: labels mapped to the fixed events, advertising consent, Ads CSP hosts | M | |
| | 4d Owner consent statistics on the card | S | |
| **5. Structural hardening** | 5a Server-side metering from middleware; PostHog JS off catalogue pages | M | Traffic-limit recalibration |
| | 5b Enforce the catalogue CSP (optionally nonces via the Vercel pattern) | M | Report data |
| | 5c httpOnly session cookies (server-side auth calls) | L | Auth plan |
| | 5d Separate registrable domain for catalogues; then reconsider GTM | L | Founder decision |

**Path to launch:** phases 0-3, about two to three weeks of work, plus counsel's turnaround and translation review.

---

## 17. Risks and open questions (item 15)

### 17.1 Risks

1. **T2 is unverified.** If a `G-` container can read cookies and the blocklist is not honoured for gtag-loaded containers, the session guard is the only control, with a race for open tabs. Mitigation: the phase 0 probe as a launch gate; phases 5c and 5d.
2. **The layout split may fight the framework** (two root layouts, `catalogues/[name]` in two groups, not-found handling). Mitigation: build check first; fallback Option A (section 6.1).
3. **Numbers change.** Cookieless PostHog changes visitor semantics. Later server-side counting adds ad-block users, so owners hit `traffic_limit` sooner. Mitigation: relabel, recalibrate, announce.
4. **Owners see fewer GA visits than expected.** Opt-in rates of about 56-68% of banners shown (Didomi 2026, vendor data, research consent §5.7). Mitigation: the card and help text say so up front.
5. **Google keeps changing the tag platform** (F16, F17): new snippets lack `config`, and the `gtm init` trigger may ignore on-page cookie settings. Mitigation: probe (c); watch the release notes; the loader's settings are the only place to adjust.
6. **PROD runs first-party owner scripts today** (Corrections). The `test` → `main` release is itself a security fix, and the GA setting should ship with it so owners have a supported path.
7. **Legal gaps block an EU launch:** no processor terms, no visitor section in the privacy policy, a placeholder governing law (research consent §3.5).
8. **Translations:** 19+ languages of legal text need native review.
9. **The `<img>` beacon channel** in the embed and text sanitizer profiles (any https image host) still allows unconsented pixels and exfiltration of URL-borne data. It predates this feature; restrict image hosts or accept it explicitly (09-25 PLAN open question 6).
10. **The new public consent endpoint** is new attack surface (T8).
11. Owners who iframe their catalogue on their own site get no GA there.
12. Quicktalog's own marketing-site consent is not real Consent Mode (section 9); separate fix.
13. The Cloudflare Web Analytics beacon's origin is unknown (research consent §1.2).

### 17.2 Open questions for the founder

1. Tier: Pro and up? What does the custom plan (id 5) get?
2. Downgrade: clear the ID (recommended) or suspend it?
3. Require a business name plus address or email on the published catalogue before tracking can be enabled (recommended)?
4. Search on public pages: stop mirroring into `?q=` (recommended), or keep it debounced?
5. GA cookie lifetime: 13 months (recommended) or Google's 2-year default?
6. Consent records in phase 2 (recommended), and how long to keep them (counsel)?
7. Run the read-only PROD audit now? It sizes the outreach and decides whether Meta Pixel moves earlier.
8. Banner languages at launch: the 19-language set, or a PROD language query first?
9. Apply for a Google tag Developer ID?
10. Commit to httpOnly sessions (5c) and/or a separate catalogue domain (5d), and when?
11. Server-side metering (5a) and a `traffic_limit` recalibration?
12. Event names: Google's recommended (`generate_lead` + `lead_source`, chosen here) or custom (`contact_phone`)?

---

## Appendix A. Where the research notes disagree or leave gaps, and what this design chooses

| Topic | Research positions | Choice | Reason |
|---|---|---|---|
| Setting placement | New Integrations tab (google-tag-docs §1.1); General-tab section, or Analytics-page card "equally good" (code-write-path §4) | Analytics-page card + General pointer | Immediate-save semantics live outside the draft model; no 5th tab; ownership already proven server-side |
| Mount | Sibling component with guards (Option A) or separate root layout (Option C) (code-render-path §9) | Option C, A as fallback | Structural boundary instead of a list of guards; removes the auth SDK, GTM and Clarity from the document |
| Data layer | Tenant tag alone on `window.dataLayer` (google-tag-docs §3.4) vs a renamed layer (code-render-path §10.3, code-write-path §6) | Alone **and** renamed | Both are cheap; still one layer per page |
| Cookie isolation | None of the analogues isolate (shared-domain-implementations §5.4); probes show per-catalogue isolation works in Chromium | Isolate | Cross-controller join keys otherwise |
| Consent key | `qt-consent:<slug>` (code-render-path §9.6) vs immutable catalogue id (consent §4.1) | Catalogue id | Slugs can be reused after deletion |
| Cookie prefix | `qt_<slug>` (probes) vs a short hash (google-tag-docs §1.3) | From the catalogue UUID | Same reason |
| Regex length | `{4,12}` (09-25 PLAN), `{4,15}` (google-tag-docs), `{4,20}` (code-write-path) | `{4,15}` | Verified as a CHECK on TEST (F21) |
| Advertising choice | Always offered, because the owner can add Ads destinations remotely (google-tag-docs §2.3) | Only when the owner declares Ads; ad signals forced off otherwise | Consent must be specific to purposes actually pursued |
| Search | Debounce (google-tag-docs §1.3) | Stop mirroring on public pages + a sanitised `search` event | Avoids raw visitor text in `page_location` and per-keystroke history page views |
| PostHog | Keep unconditional for the meter (code-write-path §6) vs consent-free counting (consent §5.7) | Cookieless now, server-side later | Keeps the meter while removing storage and the cross-catalogue id |
| Nonce CSP on ISR | "Impossible" (code-render-path §7.3, google-tag-docs §5.3) | Possible on Vercel via middleware self-fetch, at a per-request cost | [Vercel KB](https://vercel.com/kb/guide/csp-nonces-with-cdn-cache) |
| "Custom code tracking broke on 09-15" | Prior report and task context | TEST only; PROD still runs it first-party | `git merge-base` and `origin/main` source checks (section 0) |
| August 2026 upgrade | "Opt-in" (code-render-path §10.8) | Owners "gain the option" to use GTM features in their Google tag; the container capability exists | Re-fetched article text (F17) |
| Tag-type blocklist | Not in the research | Added as hardening, flagged unverified | Google's restrict doc (F18) |
| Meta Pixel ID length | `^[0-9]{15,16}$` (code-write-path) vs `^[0-9]{8,20}$` (google-tag-docs; "usually 15-16" is from Eventbrite help) | Decide in phase 4 with a real Pixel | No official length found |

## Appendix B. Sources

**Re-fetched or fetched by me on 2026-10-01**
- Google, Manage tagging behavior using the container ID: https://support.google.com/tagmanager/answer/17070049
- Google, Tag Manager release notes (2026-07-09 entry): https://support.google.com/tagmanager/answer/4620708
- Google, Updates to Google tag and Google Tag Manager (2026-08-20): https://support.google.com/tagmanager/answer/17079602
- Google, Restrict tag deployment (last updated 2026-07-30): https://developers.google.com/tag-platform/tag-manager/restrict
- Vercel, CSP nonces with CDN-cached HTML: https://vercel.com/kb/guide/csp-nonces-with-cdn-cache
- Vercel, Routing Middleware runs before the cache: https://vercel.com/docs/routing-middleware (snippet)
- TEST (`imhinsgyzzyblghwnedk`), read-only: the CHECK expression over 16 literal samples; `information_schema.column_privileges` for `catalogues`
- `git`: `origin/main` = `ef02164` (2026-05-09); `e87e1f2` and `8fdfd8f` not ancestors; `origin/main:components/catalogue/sections/CustomCode.tsx:43`, `EmbeddingBlock.tsx:199`

**Cited from the research notes (URLs as given there)**
- Google consent mode: https://developers.google.com/tag-platform/security/guides/consent ; https://developers.google.com/tag-platform/security/concepts/consent-mode
- Google CMS integration guide: https://developers.google.com/tag-platform/devguides/gtag-integration
- Google CSP guide: https://developers.google.com/tag-platform/security/guides/csp ; EU collection hosts: https://support.google.com/analytics/answer/12017362
- Google cookies and config: https://developers.google.com/tag-platform/security/guides/customize-cookies ; https://developers.google.com/analytics/devguides/collection/ga4/reference/config
- Google data layer rename: https://developers.google.com/tag-platform/devguides/datalayer
- Google privacy controls (`ga-disable`): https://developers.google.com/tag-platform/security/guides/privacy
- Enhanced measurement: https://support.google.com/analytics/answer/9216061 ; DebugView: https://support.google.com/analytics/answer/7201382 ; UTMs: https://support.google.com/analytics/answer/10917952
- Google EU user consent policy: https://www.google.com/about/company/user-consent-policy/
- GA processor role (snippet): https://support.google.com/analytics/answer/6004245
- Next.js route groups (v15): https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups ; headers: https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers
- Clerk: https://clerk.com/docs/guides/how-clerk-works/overview
- PostHog cookieless: https://posthog.com/tutorials/cookieless-tracking
- EDPB Guidelines 2/2023: https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf ; EDPB 05/2020: https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf ; Cookie Banner Taskforce: https://www.edpb.europa.eu/system/files/2023-01/edpb_20230118_report_cookie_banner_taskforce_en.pdf
- CNIL FAQ: https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/FAQ ; VG Hannover: https://voris.wolterskluwer-online.de/browse/document/230df5cf-d76c-4561-9499-e44445a96f11
- Didomi benchmarks (vendor data): https://www.didomi.io/blog/benchmark-average-consent-rate-europe
- Analogue platforms: see research shared-domain-implementations Appendix and section 2 links
