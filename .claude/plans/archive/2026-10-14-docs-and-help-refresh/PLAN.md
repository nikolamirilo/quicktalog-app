Status: done

# Docs portal and Help Center refresh

Bring `/docs` and `/help` back in line with the product as it is on `test`
(2026-10-14). The docs were written for the pre-Builder-2.0 product and describe
two flows that no longer exist, while the single biggest feature of the current
builder - Quick AI - is not documented at all.

Scope: `src/content/docs/*`, `src/constants/details.ts` (the `faqs` array),
`src/constants/help.ts`, `src/components/help/PopularGuides.tsx`, and new
illustrations in `public/images/documentation/`. No component or route changes.

## What the investigation found

### Flows the docs describe that do not exist

| Doc says | Reality |
|---|---|
| "Open the AI Catalogue Generator, describe your business, pick a theme, turn on Generate Images, the job runs in the background and is ready in about five minutes" | There is no generator route and no background job. `CreateCatalogueButton` → `InitCatalogueModal` (name, language, currency, business type) → `createCatalogue` → straight to `/admin/[name]/builder`. AI happens *inside* the builder, through Quick AI. |
| "Open Scan and Import, upload a photo or PDF, choose the language from more than thirty options" | There is no Scan and Import screen. OCR is `tesseract.js` in the browser, attached to a Quick AI message: up to `MAX_CHAT_OCR_IMAGES` (10) images, no PDF, no language picker (the catalogue's language is used). |
| Dashboard "shows the status of any AI or import jobs that are still running" | Dashboard tabs are Overview, Subscription, Usage, Settings, Support. No job status. |
| Three starting routes: scratch / AI / photo import | Real routes: the template picker that auto-opens on an empty catalogue (Quick Start, Standard Catalog, Start from Scratch), then Quick AI for anything generated. |

### Features with no coverage at all

- **Quick AI** (`src/agent/*`, `src/components/catalogue/chat/*`) - the builder
  assistant: a tool-loop agent that edits sections, items, appearance, header,
  footer and legal; plan mode with a visible checklist; image attachments read
  by OCR; `fetchUrl` to work from the user's own page; an accept/reject review
  bar; a credit meter.
- **AI credits** - the whole billing unit for AI. Prices in
  `src/lib/ai/pricing.ts` (agent turn 2, +1 per extra task, +2 per page read,
  description 1, a question is free, a turn that changed nothing is refunded),
  allowances on `tiers.features.ai_credits`, free-plan controls in
  `src/lib/ai/limits.ts` (no page reads, shorter plans, confirmed email).
- **Per-item "Generate / Enhance with AI"** in `ItemDetails.tsx`.
- **Embed** - the third share route (`SuccessModal` iframe tab + the dashboard
  row menu), not mentioned anywhere.
- **Catalogue status** - active / draft / inactive, changed from the row menu.
- **Analytics as it is now** - unique visitors, a 7/30/90 range, KPI deltas
  against the previous period, a "By day" table, a catalogue switcher. The doc
  describes three numbers and one chart.
- **Your own analytics tags** - `metadata.googleAnalyticsId` /
  `metaPixelId`, Growth and above, behind a visitor consent gate. Only a
  paragraph in `build-and-edit` mentions it; the measurement doc does not.
- **Section types by their real names** - Items, Text, Divider, External
  content, Custom visual, with Divider on Basic+ and External content / Custom
  visual on Pro+. Text blocks do not count against `sections_per_catalogue`
  (`countSections` in `src/lib/catalogue/operations.ts`).
- **Appearance** - 7 themes, 4 item layouts, style controls (font, size, radius,
  shadow) and overlay on Pro+, plus a saved custom-theme library via
  `setCustomTheme`.
- **QR editor** - PNG/JPEG/SVG, frame text (28 chars), logo, a
  "Scannable / May be hard to scan" check.
- **Starter locks** - `branding: false` locks the logo, contact details, SEO
  metadata, legal details and both header and footer tabs.

### Facts to state carefully

- Prices are fetched from Paddle at runtime (`usePaddlePrices`); nothing in the
  repo knows the dollar amount. **No doc or FAQ may quote a price.** The current
  FAQ claiming "$5/month for the Basic plan" is the one to delete.
- `features.analytics` ("Basic" / "Advanced") is only ever rendered in the
  pricing comparison table - nothing enforces it. The analytics page is the same
  on every plan. Do not promise that upgrading unlocks analytics features.
- Every plan number must be derived from `tiers`, the way `pricingFaqs.ts`
  already does it, so the Help Center cannot drift from the pricing page.

## Changes

### 1. New doc: `quick-ai.tsx` - "Build with Quick AI" (order 4)

The one page that is genuinely missing. One page, not a set: it covers what
Quick AI is, the three things you can give it (words, photos, a page address),
plan mode, the accept/reject review, credits, and how to write a good ask.

Needs five new illustrations in the existing style (360x270 or 480x270, the
shared `<defs>` symbol library copied verbatim, palette `#fff` / `#010e58` /
`#ffc107` / `#fff9e5` / `#f3f3f5` / `#eaeaea` / `#171717` / `#6b7280` /
`#d3af37`): cover, what-it-does, sources, review, credits.

### 2. Rewrites

| File | Change |
|---|---|
| `create-a-catalogue.tsx` | Replace the generator/Scan-and-Import story with the real flow: the create dialog, the template picker, then Quick AI. Keep the "always set your own prices" warning. Existing AI-flow / OCR-flow / decision SVGs still fit and are reused. |
| `track-performance.tsx` | Rewrite around the current page: range, four KPIs with deltas, chart, By-day table, switcher. Add the traffic allowance and a short section on connecting your own GA / Meta Pixel. |
| `plans-and-billing.tsx` | Add AI credits, the Usage tab, what each limit does when you reach it (page views pause a catalogue; counts just stop you adding), Paddle as merchant of record, the 10-day guarantee, and what Starter locks. |

### 3. Smaller updates

| File | Change |
|---|---|
| `getting-started.tsx` | Fix the dashboard paragraph and the "three ways" line; name Quick AI in the path; free-plan facts from `tiers`. |
| `build-and-edit.tsx` | Real section-type names and their plan gates, the text-block exemption, the 4 layouts, the section and card menus, Save vs Preview vs Publish. |
| `customize-design.tsx` | 7 themes, custom colours saved to a theme library, the style controls, overlay, header/footer custom layouts, logo size, and that these are Pro / Basic gates. |
| `share-your-catalogue.tsx` | Add embed and status; QR formats, frame text and the scannability check. |
| `responsive-and-accessible.tsx` | Content unchanged; `order` 7 → 8. |
| `registry.ts` | Register `quick-ai`. |

Reading order after the change: getting-started 1, create-a-catalogue 2,
build-and-edit 3, quick-ai 4, customize-design 5, share-your-catalogue 6,
track-performance 7, responsive-and-accessible 8, plans-and-billing 9.
`relatedSlugs` rewired so Quick AI is reachable from the build and create pages.

### 4. Help Center

- Rewrite `faqs` in `src/constants/details.ts`. Essential questions only, every
  number interpolated from `tiers`/`themes`. No prices. Note that this array
  also feeds the homepage FAQ (`initialCount={5}`) and the `FAQPage` JSON-LD in
  `constants/schemas.ts`, so the first five must be the broad ones.
- `helpPopularSearches`: "Quick AI" replaces "AI features" so the one-tap search
  matches the new copy.
- `PopularGuides.popularSlugs`: swap `share-your-catalogue` for `quick-ai`
  (the grid wants four).

## Out of scope, worth a follow-up

- `src/app/llms.txt/route.ts` still advertises "OCR Import Technology" and an
  AI that "builds your entire catalog" as separate features, and repeats the old
  FAQ answers.
- `src/constants/releaseNotes.ts` has no entry for Quick AI, AI credits, the
  custom-visual rename or the analytics-tag setting.
- `docs/architecture/ai-chat-flow.md` is marked outdated and still describes a
  single-shot JSON translator.

## Verification

`npx tsc --noEmit` clean. `npm run check` clean: the 18 warnings it reports are
pre-existing and all in `src/context/MainContext.tsx`, which this change does
not touch. `npm test` 610 passed.

Every page was also fetched from the dev server: all 10 docs pages and `/help`
return 200 with no error markers, all 40 referenced illustrations resolve (no
orphans, nothing missing), and the interpolated plan numbers come out right -
"The free plan gives you 1 catalogue with up to 5 sections and 15 items, 500
page views a month, 15 AI credits a month, all 7 themes, the QR code editor,
analytics and email support."

Not run: `next build` and the Playwright e2e suite (its browser is not
installed here). Nothing was checked in a real browser beyond the five new SVGs,
which were rendered to PNG and inspected.

### Merged with `8166bf3`

That commit ("Builder: switches for Google Analytics and Meta Pixel in the
General tab") landed on `test` while this work was stashed, and its only docs
change was the same Analytics & tracking paragraph this plan rewrote. Its
wording is the newer and more accurate one - each vendor has its own switch, the
ID field appears once the switch is on, and turning a switch off clears the ID,
which removes the tag on save - so it was kept and moved into the "Find your way
around the tabs" section, where catalogue-wide settings now live. The same
detail was carried into `track-performance.tsx`, whose "Bring your own
analytics" section had the older "paste in the ID" wording.
