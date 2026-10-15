# Code render path: how a customer's Google tag would reach a published catalogue

Research notes for the founder's question "How the google tag and analytics will be added". Written 2026-10-01.

**Scope.** `quicktalog-app` working tree on branch `test` (HEAD `d785bb8`), `origin/main` as last fetched on 2026-09-28, `quicktalog-packages`, `quicktalog-backend`, public responses from `www.quicktalog.app` and `test.quicktalog.app` (fetched 2026-10-01), one read-only SELECT on TEST, and a local Chromium probe.

**Evidence labels.**
- `path:line` is the `quicktalog-app` working tree on `test`. Other prefixes: `packages/` (quicktalog-packages), `backend/` (quicktalog-backend), `node_modules/` (installed library source in quicktalog-app), `main:` (`origin/main` as of the 2026-09-28 fetch).
- **LIVE** means fetched from the public site on 2026-10-01 with plain GETs. No PROD database was queried.
- **PROBE** means a local headless Chromium run on 2026-10-01 (Playwright 1.62.1, chromium-1234). Real `gtm.js` and `gtag.js` came from Google, but every collection request to Google, Hotjar and Clarity was answered or aborted locally, so nothing reached a real property. Method and raw output are in Appendix A.
- **(snippet)** marks a claim taken only from a search-result snippet. **(third-party)** marks a source that is not the vendor's own documentation.
- **Inference** marks my own reasoning, which was not verified.

---

## 0. Summary for the decision

1. **The answer has to be a platform-rendered tag mounted only from the published page.** That page is `src/app/catalogues/[name]/page.tsx`. Its ID comes from a validated catalogue setting and reaches the client as a prop, the same way the whole catalogue row already does. The draft preview renders the *same* `<Catalogue type="view">` component (`src/app/catalogues/[name]/preview/page.tsx:36`). So the loader cannot live inside `Catalogue`, its header or footer, a `[name]/layout.tsx`, or the root layout.
2. **PROD and TEST run different code today.** PROD serves a build that matches `origin/main` (May 2026). There, embed and custom-code blocks execute owners' scripts first-party with no sanitizer (LIVE chunk check, §1). On PROD, an owner can paste a GA snippet into an embed block today and it runs. The sandbox and sanitizer exist only on `test`. Shipping `test` to PROD will silently stop those snippets, so the GA setting should ship with that release or before it.
3. **Quicktalog's own GTM container already runs GA4 and Hotjar on every catalogue page, with no consent.** The live container `GTM-W9RHLVK6` v6 holds three tags: a Google tag (`G-RXHJ9X3T5T`, sending to `G-DT7TJQYK3K`), a misconfigured GA4 event whose event name is the full page URL, and Hotjar site `6516875` on All Pages. None has consent settings. Nothing in it reads the app's custom `consent_default`/`consent_update` dataLayer events (LIVE parse, §6.4).
4. **A customer tag on the same origin collides with Quicktalog's GA4 in two verified ways (PROBE, §10):**
   - **Shared visitor ID.** With the standard snippet, the customer's GA4 reuses Quicktalog's `_ga` client ID, so every customer's property and Quicktalog's own property get the same ID for a visitor. A per-catalogue `cookie_prefix` + `cookie_path` + `cookie_domain:'none'` separates the IDs, except on a visitor's first-ever page load when Quicktalog's GA4 is on the page; then both tags still mint the same ID.
   - **Shared consent.** Consent set on a *separate* data layer also changed Quicktalog's own GA4 hits (`gcs=G100`). One catalogue banner will therefore govern Quicktalog's Google tags too. It very likely governs Clarity as well: Microsoft says Clarity honors Google Consent Mode signals, though this was not observed with a custom-named data layer.
5. **Single-page navigation is the main leak.**
   - **What GA listens to.** Once gtag.js is loaded it listens to `pushState`/`replaceState`/`popstate` and sends `page_view` on its own; Quicktalog cannot turn that off from code ([Google](https://support.google.com/analytics/answer/9216061), [Google](https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag)).
   - **Exits through `next/link`.** The catalogue header, footer and legal links leave via `next/link` to `/`, `/auth`, `/contact` and the policy pages, so a customer's property would record Quicktalog's own URLs.
   - **Search.** Catalogue search rewrites `?q=` on every keystroke (`CatalogueContent.tsx:88-95`).
   - **Fixes.** A separate root layout for the public page forces a full page load at the boundary ([Next.js](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups)); a smaller alternative is a loader that only runs in landing documents and forces hard exits.
6. **Don't use `@next/third-parties` `<GoogleAnalytics>` for customer tags.**
   - It interpolates the ID into inline JS (`node_modules/@next/third-parties/dist/google/ga.js:30-37`).
   - It uses fixed script ids that `next/script` will not re-run after a client-side navigation (`node_modules/next/dist/client/script.js:71-75`).
   - It has no consent support.

   A small custom loader is needed instead.
7. **GTM containers and free-form head code stay out.** Two facts back this:
   - **Session cookies are readable from page scripts.** On TEST and after the cutover, the Supabase session cookie is deliberately not HttpOnly and is scoped to path `/` (`src/lib/auth/cookie-options.ts:8-21`). Clerk's `__session` is not HttpOnly either ([Clerk](https://clerk.com/docs/guides/how-clerk-works/overview)).
   - **Only G- and AW- IDs are locked to Google tags.** Google now documents that a deployment loaded with `G-` or `AW-` is limited to Google tags, while `GTM-` allows Custom HTML and third-party scripts ([Google](https://support.google.com/tagmanager/answer/17070049), [release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708)). The ID check must therefore be a strict `G-` pattern.

---

## 1. PROD is not TEST: two different codebases are live

**Facts**
- `origin/main` ends at `ef02164` (2026-05-09). It contains neither the sandbox commit `e87e1f2` (2026-09-15) nor the CSP commit `8fdfd8f` (2026-09-22): `git merge-base --is-ancestor` fails for both. `origin/test` is 80 commits ahead. The last fetch was 2026-09-28 (`.git/FETCH_HEAD` mtime).
- **LIVE `www.quicktalog.app/catalogues/montre-shop`:**
  - The response has **no CSP header** of either kind.
  - It carries `x-clerk-auth-status: signed-out` and `x-clerk-auth-reason: session-token-and-uat-missing`, plus `x-nextjs-prerender: 1`, `x-vercel-cache: HIT` and `server: cloudflare`.
  - There is no `Set-Cookie`.
  - The HTML loads `clerk.browser.js` from `clerk.quicktalog.app` and contains `GTM-W9RHLVK6`.
- **LIVE PROD chunk `/_next/static/chunks/4827-28b289d2183e277a.js`** is the one holding the embed block ("No embed code provided").
  - It contains the old first-party script re-creation: `querySelectorAll("script")` then `document.createElement("script")`, copying attributes and `innerHTML`.
  - None of the 51 chunks loaded by the page contains `srcDoc`, `allow-scripts` or `quicktalog-widget-height`.
- **`main:` source agrees.**
  - `main:components/general/HtmlContent.tsx` renders raw HTML with no sanitizer.
  - `main:components/catalogue/sections/EmbeddingBlock.tsx:192-199` and `main:components/catalogue/sections/CustomCode.tsx` both re-create `<script>` elements.
  - `main:middleware.ts` is plain `clerkMiddleware` on every route.
- **LIVE `test.quicktalog.app/`** sends `content-security-policy-report-only` and no `x-clerk-*` headers, so TEST runs `test` with the Supabase auth branch. TEST uses the **same** container `GTM-W9RHLVK6`.

**Inferences**
- PROD is deployed from `main`. So "custom code ran first-party until e87e1f2" is true for TEST only. On PROD it still runs first-party today, embeds included.
- Owners on PROD who pasted GA or GTM into an embed or custom-code block are probably still being tracked. They will lose it, silently, on the release that brings `test` to PROD. The drafted read-only PROD query from the 09-30 notes would size this, but it needs the founder's approval.
- TEST traffic flows into the same GA4 property and Hotjar site as PROD.

---

## 2. The public render path (branch `test`)

### 2.1 Route files and ISR config
- `src/app/catalogues/[name]/` holds `page.tsx`, `error.tsx` and `preview/page.tsx`. There is **no `layout.tsx`** under `catalogues`. Layouts exist only at `src/app/layout.tsx`, `src/app/(site)/layout.tsx`, `src/app/(site)/(with-footer)/layout.tsx` and `src/app/(site)/demo/layout.tsx`. A root `src/app/loading.tsx` also exists.
- `export const revalidate = 86400` (`src/app/catalogues/[name]/page.tsx:11`).
- `generateStaticParams` fetches `${NEXT_PUBLIC_BASE_URL}/api/items?type=name&status=active` with tag `catalogues-list` and revalidate 3600, and returns `[]` on error (`page.tsx:13-43`).
- `dynamicParams` is not exported, so it defaults to true. The local build's prerender manifest lists `/catalogues/[name]` as a dynamic ISR route with `"fallback": null` (blocking on-demand render) and no prebuilt slugs (`.next/prerender-manifest.json`).
- `generateMetadata` fetches `/api/items/${name}?type=meta` with tags `catalogue-${name}` and `catalogue-metadata`, revalidate 3600 (`page.tsx:45-104`). It reads only name, heading, logo and metadata (`src/lib/catalogue/public.ts:35-49`), and builds canonical and OG data in `src/constants/metadata.ts:177-221`.

### 2.2 How the row is fetched
- **The page fetches its own API over HTTP.** It requests `${NEXT_PUBLIC_BASE_URL}/api/items/${name}` with tags `catalogue-${name}` and `catalogue-detail`, and no per-fetch revalidate, so the page's 86400 applies (`page.tsx:114-123`).
- The route `src/app/api/items/[name]/route.ts:16-23` calls `getPublicCatalogue(name)`, or `getPublicCatalogueMeta`, and returns 404 when there is no row.
- `getPublicCatalogue` runs inside `withPublic` (role `app_public`, which RLS limits to active catalogues) and selects `PUBLIC_CATALOGUE_COLUMNS` (`src/lib/catalogue/public.ts:23-32`). The file header says none of these reads touch cookies or identity (`public.ts:8-15`).
- `PUBLIC_CATALOGUE_COLUMNS` lists every catalogue column except `userId` (`src/utils/db/columns.ts:10-31`). Any column added there becomes **publicly fetchable** at `/api/items/<slug>` and is baked into the ISR payload.
- **TEST database (read-only SELECT, 2026-10-01).** `catalogues` has no tracking or integrations column. There is 1 catalogue (active), and 0 whose content contains `gtag(`, `googletagmanager`, `fbq(` or `google-analytics`.

### 2.3 Render and component tree
- `page.tsx:143-147`: `status === "active"` renders `<Catalogue item={item} type="view" />`; anything else renders `<LimitsModal type="notFound">`.
- The tree is: root layout (`src/app/layout.tsx`) → `PageWrapperClient` (client) → providers → page → `Catalogue` (client, `src/components/catalogue/view/Catalogue.tsx`).
  - `Catalogue` renders `CatalogueHeader` (`Catalogue.tsx:209-211`), `Heading`, `CatalogueContent` (`:234-245`) and `CatalogueFooter` (`:264`).
  - `CatalogueContent` renders the block components (`src/components/catalogue/view/CatalogueContent.tsx:21-27`).
- The `(site)` group's Navbar and Footer layouts do **not** wrap catalogues. Only the root layout does.

### 2.4 How data reaches client components on this page (relevant for passing IDs)
- The server page passes the **whole public row** as the `item` prop of the client component `Catalogue` (`page.tsx:144`). React serializes props into the RSC flight payload.
- **LIVE PROD HTML** has 18 inline `self.__next_f.push(...)` scripts carrying `"item":{"id":…,"name":"montre-shop",…}` and `"gtmId":"GTM-W9RHLVK6"` (the root layout passes GTM_ID as a prop to the client `GoogleTagManager`). `userId` appears 0 times.
- Other inline scripts on every page:
  - UploadThing's `NextSSRPlugin` injects `globalThis.__UPLOADTHING = …` via `useServerInsertedHTML` with no nonce (`src/app/layout.tsx:50`; `node_modules/@uploadthing/react/next-ssr-plugin/index.js:9-17`; LIVE HTML contains it).
  - Custom-theme CSS goes in through `<style dangerouslySetInnerHTML>` (`Catalogue.tsx:181-183`).
- **Inference.** Props are the established, escaped channel. A separate `<script type="application/json">` data island or `data-*` attributes would add nothing.

### 2.5 Side finding: unknown slugs return 200
`notFound()` is called inside the `try` at `page.tsx:125-128`, and the `catch` at `page.tsx:148-151` swallows its special error and renders `LimitsModal` with status 200. LIVE TEST `/catalogues/does-not-exist-xyz` returned 200 with `x-nextjs-prerender: 1`. This is not tag-related, but it means the not-found UI is also ISR-cached per unknown slug.

---

## 3. Preview and builder

**Facts**
- **Who can open preview.**
  - `export const dynamic = "force-dynamic"` and `robots: noindex, nofollow` (`src/app/catalogues/[name]/preview/page.tsx:10-16`).
  - Signed-out visitors are redirected to `/auth?next=…` (`:26-28`).
  - It renders `getCatalogueByName(name)` (`:31`), which returns data only for the owner: `readOwnedDraft` → `loadOwnedCatalogue` with `eq(c.userId, me.userId)` (`src/lib/catalogue/draft-cache.ts:21-29, 40-44`).
  - What it shows is the **DB row plus the unsaved Redis draft on top** (`draft-cache.ts:46-72`).
- Middleware treats `^/catalogues/[^/]+/preview$` as a session path and a protected path (`src/middleware.ts:32-36`).
- **How it differs from the public page.**
  - Preview is dynamic with identity; public is ISR with no identity.
  - Preview shows draft data; public shows the published DB row.
  - Preview has static noindex metadata.
- **It shares every visual component.** `<Catalogue item=… type="view" />` is identical on both (`preview/page.tsx:36` vs `page.tsx:144`). The builder uses the same `Catalogue` with `type="edit"` (`src/components/catalogue/builder/CatalogueBuilder` via `src/app/admin/[name]/builder/page.tsx:22-27`; edit-only UI at `Catalogue.tsx:164-180`). The demo uses `type="demo"`.
- The builder opens preview in a new window (`src/components/catalogue/builder/useBuilderActions.ts:94-97`) and the live page with `window.open` (`:133`).
- `preview/` is a child segment of `[name]`. Any `src/app/catalogues/[name]/layout.tsx` would therefore wrap `/catalogues/<slug>/preview` too.

**Inference.** Anything placed in `Catalogue`, `CatalogueHeader`, `CatalogueFooter` or `CatalogueContent`, or keyed off `type === "view"`, would also run in the owner's signed-in preview. The tag loader has to be a sibling rendered only by the public `page.tsx`, or sit behind a public-only layout (§9).

---

## 4. Revalidation: when a setting change goes live

- **Save** (`updateCatalogue`) writes **only the Redis draft** (`writeOwnedDraft`), then calls `revalidateCatalogue(name)` (`src/actions/catalogue.ts:319-366`, draft write at `:350-357`).
- **Publish** (`publishCatalogue`) writes the DB row through `pickEditable`, sets status active, then calls `revalidateCatalogue(name)` and `revalidateDashboard()` (`src/actions/catalogue.ts:420-469`, revalidation at `:461-462`).
- `revalidateCatalogue(name)` does three things (`src/lib/cache/revalidate.ts:8-18`):
  - `revalidatePath("/catalogues","page")`. There is no `/catalogues` page, so this does nothing useful.
  - `revalidateTag("catalogues-list")`.
  - `revalidatePath(/catalogues/${name},"page")` plus the tags `catalogue-${name}`, `catalogue-detail` and `catalogue-metadata`.
- `revalidateDashboard()` revalidates `/dashboard` (the real path is `/admin/dashboard`) and `revalidatePath("/","layout")` (`revalidate.ts:24-27`). In practice every publish purges every page under the root layout, all catalogues included.
- The worker can purge through `POST /api/revalidate`, which needs the shared secret (`src/app/api/revalidate/route.ts:29-63`).
- The `data-revalidation` skill matches this split (`.claude/skills/data-revalidation/SKILL.md:20-44`).
- **Plan downgrades** go through `applyPlanDowngrade`. It strips branding and the newsletter from *all* the user's catalogues (`src/lib/entitlements/catalogue.ts:60-75`). But the webhook only revalidates catalogues it **deactivated** (`src/utils/paddle/process-webhook.ts:180-184, 213-215`).

**Inferences**
- A tracking setting written by its own action takes effect on the next request after `revalidateCatalogue(name)`.
- If the setting is plan-gated, the downgrade path must also revalidate every still-active catalogue of that user. Otherwise a removed tag can keep serving for up to 24 h (`revalidate = 86400`).

---

## 5. Everything that loads on a catalogue page today

The root layout `<head>` holds `<ClarityScript />` and `<GoogleTagManager gtmId={process.env.GTM_ID} />` (`src/app/layout.tsx:46-49`). The body is `PageWrapperClient` (`:51-53`). The layout is a server component, `GTM_ID` is a server-only env read at render (`:48`), and the root layout wraps every route.

| What | Source | Also on `/preview` and `/admin/*`? | Cookies / storage | Consent-gated on catalogues? |
|---|---|---|---|---|
| Quicktalog GTM `GTM-W9RHLVK6` (container v6) | `@next/third-parties` `GoogleTagManager`, default `dataLayer`, afterInteractive (`layout.tsx:48`; `node_modules/@next/third-parties/dist/google/gtm.js:15-38`) | Yes | **PROBE**: `_ga` and `_ga_DT7TJQYK3K` on the eTLD+1 at path `/`. On PROD that is `.quicktalog.app`, also shared with `test.quicktalog.app` (inference from Google's `cookie_domain:'auto'` = eTLD+1, [Google](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)). Hotjar sets `_hjSessionUser_{site}` (365 d) and `_hjSession_{site}` (30 min) as first-party cookies ([Hotjar](https://help.hotjar.com/hc/en-us/articles/36819973371409-Cookies-Set-by-the-Hotjar-Tracking-Code), snippet) | **No.** No consent state (PROBE: no `gcs`, `gcd=13l3l3l3l1l1`) and no tag consent settings (§6.4) |
| Microsoft Clarity `t0vbket8rt` | `src/components/general/ClarityScript.tsx:5-17`, production builds only (`:6`), `next/script` afterInteractive | Yes | `_clck` and `_clsk` (first-party) plus third-party `CLID`, `MUID`, `ANONCHK`, `MR`, `SM` ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-cookies)). Since 2025-10-31 Consent Mode is on by default for EEA/UK/CH visitors, so no cookies until a consent signal ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)). The project-level cookie setting is unknown | Not by Quicktalog; only Clarity's own EEA default |
| PostHog | `src/instrumentation-client.ts:5-19`: `capture_pageview: true`, `autocapture: false`, session recording off, no persistence or consent options | Yes | Default `persistence: "localStorage+cookie"`, `cookie_expiration: 365`, `cross_subdomain_cookie` true unless the eTLD+1 is a hosting suffix (`node_modules/posthog-js/dist/module.js`, default config object and `Qn()`; v1.434.7). Cookie `ph_<token>_posthog`, 365 days ([PostHog](https://posthog.com/docs/libraries/js/persistence)) | No |
| Sentry (+ Replay) | `src/instrumentation-client.ts:20-42`: production only, `replayIntegration()`, `replaysSessionSampleRate: 0`, `replaysOnErrorSampleRate: 1.0`, `sendDefaultPii: false`, tunnel `/monitoring` (`next.config.ts:113`) | Yes | Replay keeps its session in `sessionStorage` key `sentryReplaySession` (`node_modules/@sentry/replay/build/npm/cjs/index.js:7, 5695`) and records into a buffer that is sent on error | No |
| Auth SDK | `PageWrapperClient` → `AuthProvider` → `ClerkProvider` (PROD) or Supabase browser client `getUser()` (TEST) (`src/components/general/PageWrapperClient.tsx:15-25`; `src/components/auth/AuthProvider.tsx:16-21`; `.../session/ClerkAuthProvider.tsx:35-45`; `.../session/SupabaseAuthProvider.tsx:44-53`) | Yes | **LIVE** PROD catalogue HTML loads `clerk.browser.js`. Clerk's `__session` is set by JS on the app domain and is not HttpOnly ([Clerk](https://clerk.com/docs/guides/how-clerk-works/overview)). Supabase session cookie: path `/`, host-only, **not HttpOnly** by design (`src/lib/auth/cookie-options.ts:8-21`) | n/a (auth) |
| UserContext | `src/context/UserContext.tsx:22-49`: for a signed-in visitor it calls the `getUserData()` server action from the browser, even on a catalogue page | Yes | none new | n/a |
| Cookie banner | `src/components/general/CookieBanner.tsx`, mounted for every route (`PageWrapperClient.tsx:20-22`) | Yes (shows on other routes) | `localStorage.cookiePreferences` (`src/constants/index.ts:13`; `src/utils/cookies.ts:14-34`) | **Skips `/catalogues/`** (`CookieBanner.tsx:28-37`) |
| Middleware | `src/middleware.ts` (matcher `:79-86` includes `/catalogues/*`) | | TEST (Supabase): public paths return `NextResponse.next()` with no auth call and no cookies (`:66-69`). PROD (Clerk): every matched route runs `clerkMiddleware` (`:62-64`; `main:middleware.ts`), and LIVE shows `x-clerk-auth-*` headers on the ISR catalogue response. Neither branch sent `Set-Cookie` on the LIVE catalogue responses | n/a |

**Related to "Quicktalog's own scripts on /preview":** the worker's plan-meter query counts any `$current_url LIKE '%/catalogues/%'` that is not `%admin%` (`backend/src/utils/analytics.ts:16-20`). It maps the slug with `/\/catalogues\/([^/?#]+)/` (`backend/src/handlers/analyticsProcessingJob.ts:85-86`), so **an owner's own `/preview` page views count toward their monthly traffic limit**. The app's dashboard query matches the exact pathname, so the dashboard excludes them (`src/lib/analytics/catalogue-traffic.ts:30-36`).

**Inference.** With `capture_pageview: true` rather than `'history_change'`, PostHog counts only hard loads. `fv()` returns `{}` for `true`, so no history tracking is installed (`node_modules/posthog-js/dist/module.js`; minified code read, not run).

---

## 6. Quicktalog's own GTM and its "consent"

### 6.1 Data layer
The default name is `dataLayer`. `layout.tsx:48` passes only `gtmId`, and the component defaults `dataLayerName = 'dataLayer'` (`gtm.js:15`). The init script pushes `{'gtm.start', event:'gtm.js'}` to `window.dataLayer` (`gtm.js:31-37`). `window.dataLayer` is typed by `node_modules/@next/third-parties/dist/types/google.d.ts:1-6`, and `src/` has no augmentation of its own.

### 6.2 What the app pushes
- `initializeGTMConsent()` pushes `{event:"consent_default", consent:{analytics_storage:"denied", …, wait_for_update:2000}}` (`src/utils/cookies.ts:52-71`). `updateGTMConsent()` pushes `{event:"consent_update", consent:{…}}` (`:36-50`). `trackGTMEvent()` pushes plain events (`:73-83`), used for `cookie_banner_accept_all`, `cookie_banner_essential_only` and `cookie_modal_save_settings` (`CookieBanner.tsx:78, 92`; `src/components/modals/CookiePreferencesModal.tsx:114-117`).
- Google Consent Mode needs `gtag('consent','default',…)`, where `gtag` pushes the `arguments` object, issued "before any commands that send measurement data" ([Google](https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced)). The app never issues that command: grep for `gtag(` and `'consent'` in `src/` finds none.
- `sendGTMEvent` and `sendGAEvent` are unused (grep).

### 6.3 Why the banner skips catalogue pages, and a reactivity bug
- The banner reads identity (`useUserContext()`, `CookieBanner.tsx:22-23`) and syncs choices to the signed-in user's row through the server action `saveCookiePreferences` (`src/actions/consent.ts:25-49`). The early return on `pathname.includes("/catalogues/")` (`CookieBanner.tsx:28-37`) keeps that out of customer pages. The code gives no reason; the 09-25 plan's reading is that this is about the identity read.
- **Bug (inference from code):** the effect's dependencies are `[isSignedIn, userData]` (`CookieBanner.tsx:65`), not the pathname. `PageWrapperClient` sits in the root layout and survives client-side navigation. So:
  - A visitor who lands on a catalogue and then soft-navigates to `/` never sees the banner on the marketing site, and `initializeGTMConsent()` never runs.
  - A visitor who lands on `/` and soft-navigates to a catalogue keeps seeing Quicktalog's banner there.

### 6.4 What the container actually contains (LIVE)
I parsed `https://www.googletagmanager.com/gtm.js?id=GTM-W9RHLVK6` (container `"version":"6"`), which is public and served to every visitor.

| Tag | Type | Fires on | Notes |
|---|---|---|---|
| tag_id 3 | `__googtag` (Google tag), `vtp_tagId: G-RXHJ9X3T5T` | `gtm.init` (Initialization) | **PROBE**: its hits go to `tid=G-DT7TJQYK3K` with `page_view` and `scroll`, so Enhanced Measurement is on for Quicktalog's own stream |
| tag_id 4 | `__gaawe` (GA4 event), `vtp_measurementIdOverride: G-DT7TJQYK3K`, `vtp_eventName: {{Page URL}}` (macro 1 = `__u` URL) | `gtm.init_consent` (Consent Initialization) | **PROBE**: sends `en=https://…/catalogues/demo-bistro`. The event *name* is the full URL, query string included. Misconfigured |
| tag_id 5 | `__hjtc` (Hotjar), `vtp_hotjar_site_id: 6516875` | `gtm.js` (All Pages) | `security_groups.nonGoogleScripts: ["__hjtc"]`. **PROBE**: requests `static.hotjar.com` |

- **No consent anywhere.** No tag has consent settings. The only "consent" string in the resource is the `gtm.init_consent` trigger. There is no trigger on `consent_default`, `consent_update` or `cookie_banner_*`, so the app's custom consent events reach nothing.
- **In-repo documentation of the container:** none. `docs/` mentions only `GTM_ID` as an optional env (`docs/guides/vercel-env.md:188-191`). The only product copy is "Google Analytics via GTM" in the preferences dialog (`CookiePreferencesModal.tsx:163-170`).

**Inferences**
- On the marketing site, "Essential only" changes nothing for GA4 or Hotjar today.
- On catalogue pages, Quicktalog runs GA4 plus Hotjar session recording for every visitor of every business, unconsented. The GTM container is in `<head>` of the root layout, so the same happens on `/admin/*`, including the signed-in builder and dashboard.

---

## 7. Content-Security-Policy

### 7.1 Verbatim (branch `test`, `next.config.ts:48-62`)
It is sent as **`Content-Security-Policy-Report-Only`** for `source: "/:path*"` (`next.config.ts:64-69`).

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://challenges.cloudflare.com https://*.paddle.com https://cdn.paddle.com;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data: blob: https:;
media-src 'self' blob: https:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://clerk.quicktalog.app https://*.ingest.sentry.io https://*.posthog.com https://*.clarity.ms https://*.google-analytics.com https://*.googletagmanager.com https://*.paddle.com https://*.uploadthing.com https://uploadthing.com https://api.deepseek.com;
frame-src 'self' https://challenges.cloudflare.com https://*.paddle.com https://*.clerk.accounts.dev;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
frame-ancestors 'self';
form-action 'self'
```

- **No `report-uri` or `report-to`.** Violations show only in each browser's console, so nothing is collected despite the comment at `next.config.ts:37-46`. The only `report-to` header on LIVE PROD is Cloudflare's NEL group.
- **Not deployed on PROD** (LIVE, §1).
- It already lacks hosts Quicktalog itself loads:
  - `clerk.quicktalog.app` is missing from `script-src`. LIVE PROD loads `clerk.browser.js` from it. This matters only if the policy reaches PROD before the Clerk cutover.
  - Hotjar is missing everywhere: `static.hotjar.com`, plus whatever else Hotjar connects to (not checked).
  - `frame-ancestors 'self'` would block third-party framing once enforced, but `/showcases` frames catalogues same-origin, which is allowed.

### 7.2 What a customer Google tag needs, from Google's table (last updated 2026-09-18, [Google](https://developers.google.com/tag-platform/security/guides/csp))

| Case | Google requires | Missing today |
|---|---|---|
| GA4 **without** Ads features | `script-src(-elem)`: `https://www.googletagmanager.com`. `img-src`: `https://www.googletagmanager.com https://*.google-analytics.com`. `connect-src`: `https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com` | `connect-src https://*.google.com` |
| GA4 (default table, Ads features / Google signals) | adds `img-src`/`connect-src` `https://*.google.com https://*.google.<TLD> https://*.g.doubleclick.net`, `connect-src https://pagead2.googlesyndication.com`, `frame-src https://www.googletagmanager.com` | all of these. `*.google.<TLD>` means every country domain and cannot be wildcarded |
| Google Ads conversion/remarketing (`AW-`) | `script-src https://www.googletagmanager.com https://www.googleadservices.com https://www.google.com`. `img-src`/`connect-src` add `googleadservices`, `googleads.g.doubleclick.net`, `pagead2.googlesyndication.com`, `www.google.com`, `www.google.<TLD>`, `ad.doubleclick.net`. `frame-src https://www.googletagmanager.com` | `script-src` googleadservices and google.com; most `connect-src` entries; `frame-src` |
| Meta Pixel | `script-src https://connect.facebook.net`, `connect-src https://www.facebook.com`. `img-src` is already covered by `https:` ([jonashaag/content-security-policy-rules](https://github.com/jonashaag/content-security-policy-rules/blob/master/facebook.md), third-party; Meta publishes no CSP list that I found) | `script-src connect.facebook.net`; `connect-src www.facebook.com` |

- `img-src https:` already covers every image beacon. The 09-30 notes record that the Meta `noscript` image already survives the sanitizer and fires unconsented.
- **Scoping (fact from Next docs).** "If two headers match the same path and set the same header key, the last header key will override the first". `/blog/:slug` matches no nested path ([Next.js](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers)). A second rule `source: '/catalogues/:name'` placed *after* the global one could carry the extra tracking hosts for public catalogues only, without widening `/admin/*` or `/catalogues/<slug>/preview`.

### 7.3 What CSP cannot do here
- **`'unsafe-inline'` stays on ISR pages.** Next's own inline flight scripts, UploadThing's inline script and the GTM init need it.
- **Nonces are out.** They require dynamic rendering, and "Static optimization and Incremental Static Regeneration (ISR) are disabled" ([Next.js 15](https://nextjs.org/docs/15/app/guides/content-security-policy)). Next reads the nonce from the request's CSP header at render time (`node_modules/next/dist/server/app-render/app-render.js:108-109`; `get-script-nonce-from-header.js:12-29`), which an ISR page served from cache never has. The app sets no nonce anywhere (grep `x-nonce`).
- **SRI is experimental and webpack-only, and works by hashing JavaScript files at build time** ([Next.js 15](https://nextjs.org/docs/15/app/guides/content-security-policy)). Inference: that does not cover the per-page inline flight payload.
- **A GTM container cannot be contained** while `script-src` includes `'unsafe-inline'`, `'unsafe-eval'` and `*.googletagmanager.com`. Google's CSP guide itself says GTM Custom JavaScript variables need `'unsafe-eval'`.

---

## 8. Framework constraints

1. **Project rule.**
   - "Public pages and ISR never read cookies or user identity; never put per-user queries inside a cache." (`.claude/CLAUDE.md`, Data access section)
   - Restated in `src/lib/catalogue/public.ts:8-15`.
   - Middleware must keep public responses free of `Set-Cookie` "or a CDN could cache one user's session for everyone" (`src/utils/supabase/session.ts:28-34`; `src/middleware.ts:28-31, 66-69`).
   - No test enforces it. `tests/unit/architecture/db-boundaries.test.ts` covers database boundaries only, and `src/app/catalogues` and `src/components/catalogue/view` import no `next/headers` (grep).
   - So consent can only be read on the client, from localStorage or `document.cookie`, after hydration.
2. **Nonce vs ISR.** Incompatible in Next 15 (§7.3).
3. **`beforeInteractive` outside the root layout does not work in the App Router.**
   - Next: "beforeInteractive scripts must be placed inside the root layout (app/layout.tsx)" ([Next.js 15](https://nextjs.org/docs/15/app/api-reference/components/script)).
   - Source: in the App Router the client `HeadManagerContext` is `{appDir:true}` only (`node_modules/next/dist/client/app-index.js:200-203`), so the `beforeInteractive` client branch does nothing (`node_modules/next/dist/client/script.js:230-253`). The server renders a `self.__next_s.push(...)` stub (`script.js:274-318`), and `appBootstrap` consumes that once, before hydration (`node_modules/next/dist/client/app-bootstrap.js:52-66`).
   - Inference: a page-level `beforeInteractive` never runs on client-side navigation and is racy on hard loads.
4. **`@next/third-parties` 15.5.26 internals.**
   - `GoogleTagManager({gtmId, gtmScriptUrl, dataLayerName, auth, preview, dataLayer, nonce})`:
     - renders an inline `next/script` `_next-gtm-init` that pushes `gtm.start` plus an optional `JSON.stringify(dataLayer)`;
     - then renders `<Script id="_next-gtm" src=…gtm.js?id=${gtmId}&l=…>` (`gtm.js:14-39`);
     - `sendGTMEvent` pushes to the module's current layer name (`gtm.js:40-46`).
   - `GoogleAnalytics({gaId, debugMode, dataLayerName, nonce})`:
     - renders inline `_next-ga-init` with `gtag('js'…); gtag('config', '${gaId}' …)` built by **string interpolation** (`ga.js:30-36`);
     - then renders `<Script id="_next-ga" src=…/gtag/js?id=${gaId}>` (`ga.js:37`);
     - `currDataLayerName` is fixed by the first instance (`ga.js:13-18`).
   - **No consent support** in either, and **no ordering guarantee.** Both use the default `afterInteractive`, injected from a `useEffect` and appended to `body` (`script.js:217-229, 131`). `GoogleAnalytics` issues `config` immediately, so a consent default has to be in the same data layer before its effect runs.
   - `next/script` skips any script whose `id || src` is already in its module-level `LoadCache` (`script.js:37-38, 71-75`). Inference: a second `<GoogleAnalytics gaId="G-B">` after a client-side navigation would never configure `G-B`.
   - Next's own docs say GA "automatically tracks pageviews when the browser history state changes" ([Next.js 15](https://nextjs.org/docs/15/app/guides/third-party-libraries)).
5. **React and Next behaviour on navigation.** The root layout and its client providers persist across client-side navigations, which is why the banner bug in §6.3 exists. Scripts appended to the document stay loaded until a full page load.

---

## 9. Where a customer tag and its consent banner can mount

### 9.1 Places that would also hit `/preview`, `/admin` or other customers' pages (do not use)
- **Root layout** (`src/app/layout.tsx`): every route.
- **`src/app/catalogues/[name]/layout.tsx`** (does not exist yet): it would wrap `/preview` (§3).
- **Inside `Catalogue`, `CatalogueHeader`, `CatalogueFooter`, `CatalogueContent`, or anything keyed on `type="view"`**: preview uses the same component and type (`preview/page.tsx:36`).
- **`PageWrapperClient` or the existing `CookieBanner`**: global, and identity-reading.

### 9.2 Option A, minimal: a sibling client component in the public page
At `src/app/catalogues/[name]/page.tsx:143-145`, render `<Catalogue item={item} type="view" />` and a new client component, for example `<CatalogueTags slug={item.name} ga4Id={…} language={item.language} />`. It receives only validated IDs as props, the same channel `item` uses today (§2.4).

Inference: it needs runtime guards, because a page-level component cannot stop the SPA from keeping gtag.js alive:
- Run only when `usePathname() === "/catalogues/" + slug`.
- Do nothing when `window.top !== window.self`. The `/showcases` page frames live catalogues same-origin with no sandbox (`src/components/showcases/ShowcaseFrame.tsx:64-69`; URLs in `src/constants/marketing.ts:8-16`). Below `lg` the frame is `pointer-events-none`, so a banner inside it can't even be clicked (`ShowcaseFrame.tsx:65`).
- Load tags only in a document whose *landing* URL was this catalogue, for example by comparing `performance.getEntriesByType('navigation')[0].name`. Otherwise do a one-time `location.reload()` or skip.
- Once tags are loaded, turn same-origin link clicks that leave `/catalogues/<slug>` into full navigations.
- Treat a slug change as leaving, which covers catalogue-to-catalogue links.

### 9.3 Option B: a public-only layout through a route group
`src/app/catalogues/[name]/(public)/layout.tsx` plus `(public)/page.tsx`, with `preview/` left outside the group. Inference: it has the same SPA caveats as A. A layout receives only `params`, so it would refetch the row (deduplicated by the fetch cache within one render). It gains little over A.

### 9.4 Option C, structural: a separate root layout for the public catalogue
- Route groups with two root layouts: `app/(app)/layout.tsx` for everything else, and `app/(catalogue)/layout.tsx` for `/catalogues/[name]`.
- Next: "If you navigate between routes that use different root layouts, it'll trigger a full page reload" ([Next.js 15](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups)).
- **Gains (inference):**
  - Every exit from a catalogue to `/`, `/auth`, `/contact` or `/admin`, and every entry from the dashboard's `<Link href="/catalogues/…">` (`src/components/dashboard/overview/DashboardItem.tsx:151`; `NewsletterTable.tsx:121-126`), becomes a hard load. The customer tag and the Quicktalog app never share a document.
  - The public catalogue no longer needs to load Clerk JS or supabase-js, `UserContext`'s server action, or the global banner.
  - Quicktalog decides explicitly whether GTM, Clarity and Hotjar belong on catalogues.
- **Costs (inference, needs a build check):**
  - `preview/` must stay in the app group, so `catalogues/[name]` would exist in two groups at different paths. Next only forbids two groups resolving to the *same* path.
  - `CatalogueContent` destructures `useMainContext()` without a null check (`CatalogueContent.tsx:59`; `src/context/MainContext.tsx:20-24`), so the catalogue layout must provide `MainContextProvider` or the code must change.
  - The root `not-found.tsx` and `global-error.tsx` need rework with multiple root layouts.
  - Catalogue-to-catalogue links would still be soft navigations inside the catalogue layout, so keep the slug-change guard from A.

### 9.5 Passing the ID: props, validated, never interpolated
- **Store** a typed ID, not a snippet, in a dedicated column such as `catalogues.integrations`. Keep it **out of** `CATALOGUE_EDITABLE_FIELDS` (`src/utils/db/columns.ts:38-53`), because `pickEditable` forwards client-supplied JSON verbatim into save and publish.
- **Write it** through a dedicated action that checks identity, the plan from the database and a strict regex, with an owner filter and a row count check (rules in `.claude/CLAUDE.md`). Revalidate outside the DB block.
- **Read it** by adding it to `PUBLIC_CATALOGUE_COLUMNS` so ISR sees it. Never put a secret there: `/api/items/<slug>` returns those columns to anyone (`src/app/api/items/[name]/route.ts:16-25`). That rules out a Meta Conversions API token, for example.
- **Validate** at write time *and* in the loader with an allowlist regex, for example `^G-[A-Z0-9]{4,15}$`. **Reject `GTM-`.** A `GTM-` container loaded even through `/gtag/js` is unrestricted ([release note 2026-07-09](https://support.google.com/tagmanager/answer/4620708)), whereas `G-` and `AW-` deployments are "limited to Google tags" ([Google](https://support.google.com/tagmanager/answer/17070049)). `GT-` IDs exist as Google tag IDs ([Google](https://support.google.com/tagmanager/answer/12326985), snippet); whether `GT-` falls under the same restriction is not stated, so leave it out until checked.
- **Build the script URL** with `encodeURIComponent`, and run the gtag bootstrap from the component's bundled module code rather than `dangerouslySetInnerHTML`. Keep the setting out of AI tool schemas. The current `updateCatalogue` tool's `metadata` is a closed zod object (`src/agent/tools/general.ts:21-34`), and operations merge only known keys (`src/lib/catalogue/operations.ts:515-517`). A separate column also keeps it out of the agent's write path.

### 9.6 Consent banner: placement and storage
- Mount it in the same public-only component as the loader, from A or C. It must be **identity-free**, so no `useUserContext` or `useAuth`. Do not reuse `CookieBanner`, `CookiePreferencesModal` or the `cookiePreferences` key: they read identity and store a site-wide Quicktalog choice (`CookieBanner.tsx:22-62`; `src/utils/cookies.ts:14-34`).
- Inference: consent for Business A's tags is not consent for Business B's, so key storage **per catalogue**, for example `localStorage["qt-consent:<slug>"]`, with `try/catch`, read only on the client.
- Provide a re-open control. The footer is shared with preview, so render it from the public-only component.
- Issue `gtag('consent','default',…)` in the loader before any `config` ([Google](https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced)). Do it synchronously in the same function that injects gtag.js, rather than depending on effect ordering between components.
- Basic consent mode loads no tag before consent; advanced mode loads tags that send cookieless pings while consent is denied ([Google](https://developers.google.com/tag-platform/security/concepts/consent-mode)). That choice belongs to the PLAN.
- Fix `CookieBanner`'s non-reactive path check (§6.3) at the same time. Otherwise Quicktalog's banner can still appear on a catalogue after a client-side navigation.

---

## 10. Collisions and conflicts

### 10.1 GA cookies on one origin (PROBE)
- **Standard snippet** (shared `dataLayer`, defaults) on a page that also runs Quicktalog's container:
  - The customer's hits carried **the same `cid` as Quicktalog's `G-DT7TJQYK3K` hits** (`2134770778.1790834233`).
  - Cookies: `_ga` (shared), `_ga_TEST123` and `_ga_DT7TJQYK3K`, all at `.<eTLD+1>` path `/`.
  - Inference: on PROD every customer property and Quicktalog's own property would see one client ID per visitor through `.quicktalog.app`'s `_ga`, which links visitors across tenants.
- **Platform config** `cookie_prefix:'qt_<slug>'`, `cookie_path:'/catalogues/<slug>'`, `cookie_domain:'none'`:
  - Cookies became `qt_bistro_a_ga` and `qt_bistro_a_ga_AAAA111` on host `www.<origin>` at path `/catalogues/bistro-a`.
  - For a returning visitor, after `_ga` already existed, customers A and B each got **distinct** client IDs, different from Quicktalog's.
  - Customer tags with no Quicktalog container also got distinct IDs.
  - **However**, on a visitor's **first-ever** page load landing on a catalogue with both tags present, Quicktalog's and customer A's tags minted **the same** ID (`414032399.1790834350`) and persisted it into both `_ga` and `qt_bistro_a_ga`.
  - Inference: full separation from Quicktalog's GA4 needs Quicktalog's own Google tag off catalogue pages, or a separate origin. Prefix, path and domain still separate customers from each other.
- Google documents `cookie_domain:'auto'` as eTLD+1, `cookie_prefix` renaming `_ga` to `<prefix>_ga`, and `cookie_path` with default `/` ([Google](https://developers.google.com/analytics/devguides/collection/ga4/reference/config), [Google](https://developers.google.com/tag-platform/security/guides/customize-cookies)).

### 10.2 Consent state is page-global (PROBE)
- In the isolated scenario the customer tag ran on its own data layer (`l=qtDataLayer`, own `qtag`). Its `consent default denied` made **Quicktalog's** `G-DT7TJQYK3K` hits carry `gcs=G100`.
- After the customer's `consent update` (analytics granted), Quicktalog's tag wrote `_ga` as well.
- Clarity "automatically interprets and honors GCM consent signals" ([Microsoft](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-gcm)).
- Hotjar has no Google consent integration in this container (§6.4).
- Inference: one catalogue banner will, in practice, decide consent for Quicktalog's Google tag and Clarity on that page. It will not decide it for Hotjar or PostHog. The banner text and the legal disclosure must cover that, or Quicktalog's tags must leave catalogue pages.

### 10.3 Shared `dataLayer` and event routing (PROBE)
- In the shared-`dataLayer` scenario, an unrouted `gtag('event','probe_unrouted_event')` went **only** to `G-TEST123`, not to Quicktalog's GTM-configured destination.
- Google's routing doc says the default group "includes all products and accounts from config commands on the page that have executed prior to the event" ([Google](https://developers.google.com/tag-platform/gtagjs/routing)).
- Recommended anyway (inference): a custom data layer name through the `l=` parameter ([Google](https://developers.google.com/tag-platform/tag-manager/datalayer)), explicit `send_to`, and a separate `gtag` function, so the container's runtime never processes customer commands.

### 10.4 Single-page navigation leaks
Facts from Google: history-based `page_view` "listens for pushState, popState, and replaceState", and site search detects the `q` parameter by default ([Google](https://support.google.com/analytics/answer/9216061)). Enhanced Measurement sends history page views "independently of the send_page_view parameter", and turning them off is a property setting ([Google](https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag)).

Paths in the code:
- **Exits through `next/link`:**
  - default header CTA `/auth?mode=signup` and Quicktalog email (`src/components/catalogue/view/CatalogueHeader.tsx:74-84, 115-124`);
  - logo link to `contact.website || "/"`, where relative paths become `next/link` (`CatalogueHeader.tsx:160`; `src/components/general/SmartLink.tsx:54-58`);
  - default legal links (`src/components/catalogue/view/components/LegalLinks.tsx:17-40`);
  - "Create Your Digital Catalog" (`.../components/DefaultActions.tsx:27-33`);
  - `/contact` (`.../components/Contact.tsx:50-56`);
  - owner-entered relative URLs in custom CTAs and legal links (via `SmartLink`).
- **Entries by soft navigation:** the dashboard's "View Catalogue" (`DashboardItem.tsx:151`) and the newsletter table (`NewsletterTable.tsx:121-126`). Inference: going back from the catalogue would send `/admin/dashboard` to the customer's property through GA's `popstate` listener.
- **Search:** `router.replace('?q=…')` on every keystroke (`CatalogueContent.tsx:88-95`). Inference: this produces `page_view` and `view_search_results` per keystroke in the customer's property, unless the URL update is debounced or excluded. Not verified, because a fake measurement ID carries no property settings.
- **Mitigation:** Option C (§9.4), or Option A's landing-document and hard-exit guards.

### 10.5 Framing
`/showcases` embeds catalogues in non-sandboxed same-origin iframes (§9.2). A customer tag would count those as visits, with Quicktalog's marketing page as the referrer context. PostHog already counts them today for the showcased catalogues (inference). The loader should do nothing when framed.

### 10.6 Quicktalog's scripts on `/preview` and `/admin`
GTM (GA4 and Hotjar), Clarity, PostHog and Sentry Replay all load on every route, including the signed-in builder, dashboard and preview (`src/app/layout.tsx:46-52`; `src/instrumentation-client.ts`). Preview page views count toward the owner's plan meter (§5). These are Quicktalog decisions, but they mean a "no tracking in preview" promise is only true for *customer* tags.

### 10.7 Session-token exposure
- **Facts:**
  - The Supabase session cookie `sb-<ref>-auth-token` is deliberately not HttpOnly and lives at path `/` (`src/lib/auth/cookie-options.ts:8-21`).
  - Clerk's `__session` is not HttpOnly, 60-second JWT ([Clerk](https://clerk.com/docs/guides/how-clerk-works/overview)).
  - Clerk sets some production cookies with `Domain=quicktalog.app` (`src/utils/supabase/session.ts:67-75`).
- **Inference:**
  - Any first-party script on any catalogue path can read the tokens of a signed-in visitor, such as another owner or a Quicktalog admin. That covers a GTM Custom HTML tag, a head-code field, or the pre-sandbox custom code still live on PROD.
  - A validated `G-` ID loads only Google-provided tags per Google's ID rules above, which is why it is the ceiling until catalogues move to a separate registrable domain.

### 10.8 Google's tag platform is changing in 2026
- **Upgrade announcement.** Google's Aug 20, 2026 article says "Your Google tags will be upgraded to fully capable Google Tag Manager containers", that new deployment snippets "will not have the gtag config command", and that the change is opt-in ([Google](https://support.google.com/tagmanager/answer/17079602)).
- **Restriction release note.** The July 9, 2026 note says containers loaded through `/gtag/js` are now restricted by ID type ([Google](https://support.google.com/tagmanager/answer/4620708)).
- **Inference:**
  - Owners will increasingly copy snippets without `gtag('config')`, so the UI should ask for the ID, not the snippet.
  - Confirm that `config` and `set` parameters (`cookie_prefix`, `cookie_path`, `cookie_domain`) still apply to upgraded Google tags.
  - A third-party summary claims a new "gtm init" trigger replaces `gtag config` ([gaoptimizer](https://www.gaoptimizer.com/blog/google-tag-manager-biggest-update-2026/), third-party).

---

## 11. The end-to-end mechanism this implies (inference, for the PLAN)

1. **Owner side.** A builder settings section, for example "Analytics & tracking" in the sidebar next to General, Header, Footer and Appearance (`src/components/catalogue/inputs/sidebar/index.tsx:52-82`).
   - It has one field: "Google Analytics measurement ID (G-…)". The client validates the format and links to "where to find it".
   - It is plan-gated on the server. Packages have an `analytics: "Basic" | "Advanced"` flag per tier (`packages/src/constants/pricing.ts:21, 58, 85, 117, 149`).
   - It saves through a dedicated action (§9.5), which calls `revalidateCatalogue(name)`.
2. **Publish and cache.** The ID is catalogue data in `PUBLIC_CATALOGUE_COLUMNS`, so the ISR HTML carries it in the RSC payload. There is no `Set-Cookie` and nothing per visitor.
3. **Visitor side.**
   - The public-only loader mounts after hydration and checks the guards: pathname, not framed, landing document.
   - It reads `qt-consent:<slug>`, or shows the identity-free banner in the catalogue's language.
   - On accept, it issues consent default, then update; loads `https://www.googletagmanager.com/gtag/js?id=G-…&l=qtDataLayer`; and calls `config` with `cookie_prefix`, `cookie_path` and `cookie_domain:'none'`.
   - On decline, it loads nothing (basic mode) or sends cookieless pings (advanced mode).
   - Either way the choice also reaches Quicktalog's Google tag and Clarity (§10.2).
4. **Leaving.** The visitor leaves by a full page load: Option C, or hard-exit guards.
5. **CSP.** Add `connect-src https://*.google.com` at minimum, plus Ads and Signals hosts if supported, in a later `headers()` rule for `/catalogues/:name`. Add a `report-to` endpoint before enforcing.
6. **Release order.**
   - Ship the GA setting with the release that brings `test` to PROD, or before it, and warn owners whose embed or custom-code snippets will stop. Finding those owners needs the PROD query, which requires approval.
   - Fix Quicktalog's own container (consent settings or removal from catalogue pages, Hotjar, the URL-named event) either before the customer banner ships or as part of it.

---

## 12. Open questions and things not verified

- **Enhanced Measurement under the catalogue's `?q=` replace-per-keystroke.** Untested; needs a real GA4 property.
- **Safari and Firefox behaviour** of path-scoped and prefixed GA cookies. Only Chromium was probed.
- **Is the first-visit shared ID deterministic?** Probe 2 observed it once, and probe 1's consent scenario matched it. Needs repeated runs and other orderings, for example customer tag first.
- **Does Clarity's GCM reading** pick up consent issued on a *custom-named* data layer? Inferred from the `gcs` result plus Microsoft's docs; not observed.
- **Should Quicktalog's GA4, Hotjar and Clarity run on customer catalogues at all?** This is a controller question for the founder. Removing PostHog would zero the plan meter (`backend/src/utils/analytics.ts:9-26`).
- **Quicktalog's own container.** Are `G-RXHJ9X3T5T` → `G-DT7TJQYK3K`, the URL-named event and Hotjar on all pages (admin included) intended?
- **Clarity project cookie setting** and whether `GTM_ID`/PostHog keys differ by environment. `.env*` values are off-limits; LIVE shows the same container on both sites.
- **PROD usage of embed or custom code for tracking.** Not queried, because PROD queries need approval.
- **Feasibility of two root layouts** (Option C) with `preview/` in another group, plus not-found and global-error handling. Needs a build check.
- **Whether `GT-` IDs** count as "product-specific" in Google's restriction.
- **Meta Pixel consent API and CSP** should come from Meta's own docs. Only a third-party list was found.

---

## Appendix A: probe method and raw results

**Setup.** Scripts are `crp-probe/probe.mjs` and `probe2.mjs` in the session scratchpad.
- **Fake origin:** `https://www.quicktalog-probe.test`, served through Playwright `route.fulfill`.
- **Quicktalog side:** the page head reproduced the root layout's GTM init plus `gtm.js?id=GTM-W9RHLVK6` (real container v6).
- **Customer side:** fake measurement IDs `G-TEST123`, `G-AAAA111` and `G-BBBB222`.
- **Interception:** requests to `*.google-analytics.com`, `*.analytics.google.com`, `*.google.com`, `doubleclick.net`, `googlesyndication.com` and `googleadservices.com` were logged and answered `204`. `static.hotjar.com` and anything else not on `www.googletagmanager.com` were aborted.

**Probe 1** (one fresh context per scenario; 7 s wait, then `history.replaceState(null,'','?q=pizza')`, then 2.5 s)

| Scenario | Hits (tid → events; cid) | `gcs` | Cookies |
|---|---|---|---|
| C: Quicktalog container only | `G-DT7TJQYK3K` → `https://…/catalogues/demo-bistro` (event named with URL), `page_view`, `scroll`; cid `1036925885.1790834223` | absent (`gcd 13l3l3l3l1l1`) | `_ga`, `_ga_DT7TJQYK3K` @ `.quicktalog-probe.test/` |
| A: + standard customer snippet (shared `dataLayer`) | `G-TEST123` → `page_view`, `probe_unrouted_event`; `G-DT7TJQYK3K` → URL-event, `page_view`, `scroll`; **both cid `2134770778.1790834233`** | absent | `_ga`, `_ga_TEST123`, `_ga_DT7TJQYK3K` @ `.quicktalog-probe.test/` |
| B: + isolated customer tag (`l=qtDataLayer`, consent default denied, prefix/path/domain none, update granted at 2.5 s) | `G-TEST123` → `page_view` (`G100`), then batched `user_engagement` + `probe_unrouted_event` (`G101`); `G-DT7TJQYK3K` → URL-event, `page_view`, `scroll`, **all `G100`**; both cid `898651753.1790834243` | `G100` on **both** before the update | `qt_demo_bistro_ga`, `qt_demo_bistro_ga_TEST123` @ `www.quicktalog-probe.test/catalogues/demo-bistro`; `_ga`, `_ga_DT7TJQYK3K` @ `.quicktalog-probe.test/` |

The `?q=pizza` replace produced no extra hits for either property. That is inconclusive, because a fake ID has no Enhanced Measurement settings and Quicktalog's stream may not use history page views.

**Probe 2** (one context per sequence, consent granted by default, 6 s per page)

| Sequence | Unique (page, tid, cid) |
|---|---|
| `/qt-only` → `/catalogues/bistro-a` → `/catalogues/salon-b` (both catalogue pages also run Quicktalog's container) | Quicktalog `1122454194.1790834318` throughout; A `517043095.1790834324`; B `896658532.1790834330`. **All distinct** |
| Customer tags alone: A then B | A `1624369633.1790834337`; B `865842334.1790834343`. Distinct |
| First-ever visit lands on `/catalogues/bistro-a` (Quicktalog container + A) | **Quicktalog and A share `414032399.1790834350`**; cookies `_ga=GA1.1.414032399.1790834350` and `qt_bistro_a_ga=GA1.1-3.414032399.1790834350` |

---

## Appendix B: sources

**Next.js**
- [Content Security Policy (v15)](https://nextjs.org/docs/15/app/guides/content-security-policy)
- [Script component (v15)](https://nextjs.org/docs/15/app/api-reference/components/script)
- [Third-party libraries (v15)](https://nextjs.org/docs/15/app/guides/third-party-libraries)
- [headers (v15)](https://nextjs.org/docs/15/app/api-reference/config/next-config-js/headers)
- [Route groups (v15)](https://nextjs.org/docs/15/app/api-reference/file-conventions/route-groups)

**Google**
- [Tag Manager and CSP](https://developers.google.com/tag-platform/security/guides/csp)
- [Set up consent mode](https://developers.google.com/tag-platform/security/guides/consent?consentmode=advanced)
- [Consent mode overview](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Customize cookies](https://developers.google.com/tag-platform/security/guides/customize-cookies)
- [GA4 config reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
- [Measure pageviews](https://developers.google.com/analytics/devguides/collection/ga4/views?client_type=gtag)
- [Enhanced measurement](https://support.google.com/analytics/answer/9216061)
- [Data layer](https://developers.google.com/tag-platform/tag-manager/datalayer)
- [Group and route data](https://developers.google.com/tag-platform/gtagjs/routing)
- [Manage tagging behavior using the container ID](https://support.google.com/tagmanager/answer/17070049)
- [Tag Manager release notes (2026-07-09 entry)](https://support.google.com/tagmanager/answer/4620708)
- [Google tag upgrade announcement (2026-08-20)](https://support.google.com/tagmanager/answer/17079602)
- [Google tag ID definition](https://support.google.com/tagmanager/answer/12326985) (snippet)

**Microsoft**
- [Clarity consent mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)
- [Clarity cookies](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-cookies)
- [Clarity and Google Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/cookie-gcm)

**Others**
- [PostHog persistence](https://posthog.com/docs/libraries/js/persistence)
- [How Clerk works](https://clerk.com/docs/guides/how-clerk-works/overview)
- [Hotjar tracking-code cookies](https://help.hotjar.com/hc/en-us/articles/36819973371409-Cookies-Set-by-the-Hotjar-Tracking-Code) (snippet)
- [Facebook CSP rules](https://github.com/jonashaag/content-security-policy-rules/blob/master/facebook.md) (third-party)
- [GTM 2026 update summary](https://www.gaoptimizer.com/blog/google-tag-manager-biggest-update-2026/) (third-party)

**LIVE (2026-10-01)**
- `https://www.quicktalog.app/catalogues/montre-shop` (headers, HTML, chunk `4827-28b289d2183e277a.js`)
- `https://test.quicktalog.app/` and `/catalogues/does-not-exist-xyz` (headers)
- `https://www.googletagmanager.com/gtm.js?id=GTM-W9RHLVK6` (container v6)

**Prior files checked**
- `.claude/plans/active/2026-09-30-content-block-strategy/reports/Quicktalog content block strategy.md`
- `.../research_notes/Quicktalog content block strategy/codebase_embed_custom_code.md`
- `.../research_notes/Quicktalog content block strategy/embeds_tracking_custom_code.md`
- `.claude/plans/active/2026-09-25-content-blocks-expansion/PLAN.md` §3

**Corrections to the prior files**
- "Custom code ran first-party until e87e1f2 … owners have silently lost tracking since then" holds for TEST only. PROD still runs the pre-sandbox, unsanitized code (§1).
- "Middleware keeps public paths cookie-free" holds for the Supabase branch. PROD runs Clerk middleware on catalogue pages (§5); no `Set-Cookie` was observed there either.
- The custom `consent_default` event "does nothing unless a container has a matching template" is now confirmed against the live container, which has none (§6.4).
- The 09-25 plan's "inline script before any tag" is not required for the customer tag: defaults can be issued from the loader's own module code before gtag.js is injected. It would be required to put *Quicktalog's* GTM behind consent, through a root-layout `beforeInteractive` script, because that is the only place it works (§8.3).
