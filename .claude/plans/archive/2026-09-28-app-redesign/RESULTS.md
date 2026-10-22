# App redesign: results

Implemented 2026-09-28/29 on `test`, not committed. The decisions are in [PLAN.md §0](./PLAN.md). How the theme works now is in [docs/architecture/product-theme.md](../../../../docs/architecture/product-theme.md).

## What was done

**Foundation** (lead)
- **Tokens:** the new palette, shadows, radii and fonts are `--product-*` tokens in `styles/product.css`.
- **Tailwind** (`tailwind.config.ts`): the matching names and the type scale (`text-display-*`, `text-title-*`, `text-lead*`).
- **Fonts:** Plus Jakarta Sans and Inter Tight are added.
- **Primitives:** every `ui/*` primitive is restyled. `Button` has 7 typed variants; the old variants were migrated at every call site. `//@ts-nocheck` is removed from 17 primitives.
- **Shared blocks** in `components/general`: `Section`, `SectionHeading`, `PageHero`, `CtaBand`, `IconTile`, `Eyebrow`, `FaqAccordion`, `LottiePlayer`. The 5 Lottie animations are in `public/animations/`, and `lottie-web` is added.
- **Catalogue isolation:**
  - `.catalogue-root` pins Lora at 18px and gives the catalogue font variables a Lora default.
  - `CatalogueButton` and `CatalogueDialog` are frozen copies.
  - The section header owns its classes.
- **Route groups** `(site)` and `(site)/(with-footer)` provide the shared navbar, `<main>` and footer; URLs are unchanged.
  - Auth route handlers moved back out to `app/auth/`.
  - The confirm action moved to `actions/auth-confirm.ts`, and the architecture-test allow-list names exactly that file.

**Screens** (six parallel agents, then lead cleanup)
- **Shells:** pill navbar with dropdowns, mobile sheet and signed-in menu; footer; `AppShell`; 404, error and global-error; loaders; cookie banner and preferences.
- **Marketing:** home, pricing (toggle, starter card, tier grid, comparison table, info dialogs), showcases, demo, contact.
- **Resources:**
  - Articles and article pages, with all prose components restyled; `src/content` bodies needed no layout changes.
  - Docs and doc pages: 3 columns, scroll-spy table of contents, "Was this helpful?" and a pager.
  - Help: search, highlighting, topics. Release notes: timeline.
- **Account:** sign-in/up card, forgot and update password, confirm, and a shared `LegalPage` for terms, privacy and refund (wording kept).
- **Dashboard:** frame with sidebar, mobile tabs and floating create button; overview; all dialogs including the create-catalogue dialog; subscription; usage gauges; settings; support; checkout success.
- **Analytics:**
  - A `range` of 7/30/90 days, validated on the server.
  - Deltas against the previous period, a catalogue switcher, a restyled chart, and a by-day table.
  - Two aggregate PostHog queries with timeouts replace a query that pulled up to 1M raw events.
- **QR editor:**
  - Presets, scan-risk status, contrast pill, style tiles, and frame text (saved in the jsonb config and composed into PNG, JPEG and SVG downloads).
  - The unsaved-changes guard is fixed.

**Cleanup**
- Removed:
  - The Radix toast system (sonner is the only one) and `next-themes`.
  - `BackLink`, `BusinessType`, the old home section components and the Demo component.
  - `MarketingHero`, merged into `PageHero`.
  - Old navigation types, dead Clerk `UserButton` CSS, unused nav tokens, `benefits` / `IBenefit*`, unused footer link data, and 8 unused marketing images.
  - `ArticleCTA`'s unused `end` variant; its default copy is now generic.
  - `Contact`'s dead support mode. `contactSubjects` is shared by the contact and support forms.
- Found and fixed:
  - `product-shadow` was registered as a Tailwind **colour**, so `shadow-product-shadow` never drew a shadow. Replaced by real `shadow-product*` utilities.
  - `withMT`'s `lg-max` breakpoint silently disabled every arbitrary `min-[…]`/`max-[…]` variant. It is removed after the merge. Dead `max-md:` classes that would now apply were removed from `CatalogueDialog` and `ui/dialog`.
  - `product-error` was missing as a Tailwind colour.

## Verification

| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm test -- --run` | 44 files, 445 tests pass (16 new: analytics traffic helpers, QR design) |
| Biome on every changed file | clean (one old warning in `SuccessModal`) |
| `next build` | pass, all routes keep their URL and rendering mode |
| Screenshots (dev, 390 and 1440px) | Checked in the images: home, sign-in and 404. Also loaded without JS errors: pricing, a doc page, an article and help. Found and fixed the breakpoint bug above |
| Published catalogue | Computed styles on a fixture catalogue (monochrome, winter-light) match the pre-redesign values: Lora/theme font, 18px/28px, 8px button radius, 36px buttons, theme border-radius on headers, item modal font and size |

## Not verified

- **Pixel diff of the catalogue against `HEAD`.** The baseline checkout cannot boot without `.env.local`, and the guard hook rightly blocks sharing it. Only computed styles were compared.
- **Signed-in screens in a browser:** dashboard, analytics and the QR editor.
- **PostHog:** the new analytics queries have not been run against real PostHog.
- **Playwright e2e** (`create-catalogue`, `auth.supabase.setup`) has not been run against TEST.

## Behaviour changes to know about

- **Analytics:** "Avg. views / day" divides by the whole range, not only by days that had views.
- **QR:** downloads no longer offer to save first. Configs saved before frame text existed load with it off.
- **Create dialog:** stays open and keeps its values when creation fails. Duplicating at the limit opens the upgrade dialog.
- **Showcases:** follow the prototype's 7 catalogues and drop `take-a-vape-catalogo`. This needs owner confirmation.
- **FAQ:** the analytics answer now describes the real analytics (views, visitors, busiest day). This also changes the home FAQ and its schema.
- **Legal:**
  - The Terms page still shows the existing `[JURISDICTION]` / `[CITY / COUNTRY]` placeholders; its text was kept.
  - The Refund policy's "last updated" date (2026-03-14) came from the prototype and is unverified.
- **Links fixed:** the sign-up consent link (`/terms-of-service` → `/terms-and-conditions`) and the cookie modal's privacy link (`/privacy` → `/privacy-policy`).

## Left for later

- `LottiePlayer` has no replay control, so the AI card's animation doesn't restart when a chip is clicked.
- The builder's own panels (chat, credit meter, `SuccessModal`, `ImageDropzone`) still use `font-lora` and old palette colours in places. They get the new primitives but were otherwise out of scope.

## Review round (2026-09-29)

Five read-only reviewers audited the redesign. Every verified finding was fixed by the lead plus five parallel agents with separate file ownership; owner decisions are in [PLAN.md §0](./PLAN.md).

**Bugs fixed (highlights):**
- The published catalogue's item modal fell back to Lora instead of the customer's font. The `.catalogue-root` font-variable default was removed; it now inherits the variables `Catalogue.tsx` sets on `<html>`. Verified on monochrome and luxury.
- The Clerk profile sub-routes closed the Settings tab.
- `cn()` dropped the custom font sizes, shadows and radii. It now uses `extendTailwindMerge`.
- Opacity modifiers on `product-*` colours never compiled. Colours are now RGB-channel tokens.
- Form fields caused iOS to zoom in.
- The pricing FAQ was false about page-view limits.
- The contact form could hang. The contact and support forms are now one form with a shared Zod schema.
- The QR save action accepted any config. It now uses a strict schema, logo-host rules and a size cap.
- HogQL was string-built. It now uses `values` placeholders, explicit UTC day windows, and host + pathname matching.
- The navigation guard stacked history entries.
- Showcases loaded twice. "Start free" could open a Paddle checkout.
- Dashboard: server refusals were ignored, API errors crashed the page, gauge maths, the stale duplicate hint, the delete-lock date comparison, the CSV export, a single shared "Link copied" flag, and hard-coded subscription dates.
- Focus management on the auth and confirm views, a11y semantics (tabs, tables, dots, labels), and effect cleanups.

**Organization:**
- New folders: `components/{pricing,showcases,demo,resources,status}`, `catalogue/create` (with `CreateCatalogueProvider`) and `dashboard/{overview,navigation}`.
- Hooks moved to `src/hooks/`.
- Data moved to `src/constants/` (`pricing`, `marketing`, `help`, `legal`, `dashboard`).
- The PostHog wrapper moved to `utils/posthog.ts`, and ownership queries to `lib/catalogue/ownership.ts`.
- Shared `Container`, `TextLink`, `FilterChip`, `formatIsoDay`, `useScrollSpy`, `useRadioKeys`, `MetaLine`, `PageDisclosure` and `AppDialog`.
- The big files were split: `SupabaseAccount`, `ItemDropdownMenu`, `ContactForm`, `Showcases`, `ProblemSection`, `LegalPage`, `QrPreview`.
- Components use named exports.
- New docs: `docs/architecture/analytics.md` and `qr-codes.md`.

**Owner decisions applied:**
- The legal pages are dated 2026-09-29.
- The refund wording is reverted to the original.
- The restyled `LimitsModal` stays on public catalogues.

**Verification:** `tsc` passes. 512 unit tests pass (one obsolete builder test that asserted "max-* variants don't compile" was removed). Biome is clean on the changed files, apart from an older warning in `SuccessModal`. `next build` passes. A dev-server screenshot pass over 10 pages at 390 and 1440px showed no JS errors. Catalogue computed styles match the pre-redesign values, and the item modal font is fixed.

**Still open:**
- Playwright e2e and signed-in screens have not been checked in a browser.
- The new PostHog queries have not been checked against real TEST data.
- Pinning QR logo URLs to our UploadThing app ID needs a constant.
- Real subscription dates would need a migration: `app_user` cannot read `subscriptions`.
- The backend page-view enforcement skips free-plan users, and nothing re-activates catalogues after the monthly reset. Worth a product decision.
