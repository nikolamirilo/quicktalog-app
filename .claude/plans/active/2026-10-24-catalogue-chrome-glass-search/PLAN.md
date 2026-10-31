Status: done (awaiting a browser check on TEST)

# Catalogue glass effect, opt-in search, floating navbar, site-style footer and custom background

**Spec:** the "Premium Catalogue Builder" HTML prototype (shared in chat 2026-10-24). Plain-language version: [OVERVIEW.md](OVERVIEW.md). Lasting knowledge: [docs/architecture/catalogue-chrome.md](../../../../docs/architecture/catalogue-chrome.md).

## Decisions

1. **No migration.** `appearance` and `footer` are JSONB with no key validation; the new fields are optional and read as off when missing.
2. **Glass is a style control** (gated by `apperance.styles`, like fonts and shadows). Search is on every plan. The tagline belongs to the custom footer (branding).
3. **Search is opt-in and the 20-item threshold is gone** (`SEARCH_MIN_ITEMS`, `getTotalItemCount` removed). It shows in the builder too; only the published page writes `?q=`.
4. **Glass is pure CSS** driven by `data-glass-*` attributes and `--glass-*` variables on `.catalogue-root`, so cards and headers take no new props.
5. **Social icons are line icons** (react-icons) instead of logo.dev images; partner avatars still try logo.dev and fall back to the initial.
6. **The phone menu is a dropdown under the pill**, replacing the Radix side sheet (`CatalogueSidebar` deleted).
7. **A custom footer without a logo shows the legal name** in its place (keeps the 2026-10-24 phase-2 fix).
8. **Background is a style control** (gated by `apperance.styles`), stored as `appearance.background` with one value per type. The gradient library lives in the app, not the package; the server keeps only known keys, `#rrggbb` colours and http(s) photo URLs without quotes. The prototype's "Or use a sample photo" button is a preview-only stand-in and is not built.

## Tasks

1. `@quicktalog/common` 1.70.0: `GlassSettings`, `GlassLevel`, `GlassTarget`, `CatalogueSearch`, `Appearance.glass?`, `Appearance.search?`, `Footer.tagline?`; defaults in `defaultCatalogueData`. Pushed to `main`, published by CI.
2. `lib/catalogue/glass.ts` (presets, `normalizeGlass`, `resolveGlass`, `glassStyle`, `glassAttributes`), `normalizeSearch` in `items.ts`, `lib/catalogue/footer.ts`, `lib/catalogue/socials.ts`; unit tests.
3. `styles/catalogue-chrome.css`: navbar, search, footer, glass (phone cap, `@supports` and reduced-transparency fallbacks).
4. View: `Catalogue` root vars/attributes, `CatalogueHeader` floating pill, `CatalogueSearchBar` + `CatalogueContent` wiring, `CatalogueFooter` and its parts, `SectionHeader` glass hook.
5. Builder: General › Search, Appearance › Style › glass (`GlassConfiguration`), Header › Floating navbar note with a jump to glass (tabs now controlled), Footer › tagline; panel `NewBadge`, `PillToggle`, `SliderField` info/new/disabled.
6. Server: `applyPlanToCatalogue` normalizes glass/search/tagline and resets glass without styles; `applyPlanDowngrade` resets glass.
7. Docs: `catalogue-chrome.md`, docs index, builder doc note, help article "Customize design".
8. Background (added 2026-10-24 from the updated prototype): `@quicktalog/common` 1.71.0 `CatalogueBackground`; `lib/catalogue/background.ts` (gradients, `normalizeBackground`, `backgroundLayerStyle`, `backgroundIsDark`); `.cat-bg` layer and `data-bg` in `Catalogue`; `appearance/BackgroundConfiguration` in Appearance between Themes and Style; plan gate and downgrade; `isDarkTheme` helper shared by `Catalogue` and the heading editor; tests.

## Verification

`npx tsc --noEmit`, `npm run check`, `npm test` pass. Not checked in a browser (dev server access was not available in the session): sticky navbar inside the builder frame, glass on each theme, footer grid at each width, the background layer behind the builder frame and with glass over a photo.

## Follow-ups (not done)

- Quick AI cannot toggle search or glass yet (`update_appearance` has no fields for them); the snapshot does not mention them.
