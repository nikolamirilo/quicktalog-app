# Catalogue navbar, search, footer, glass and background

The parts of a published catalogue around its content: the floating navbar, the opt-in search bar, the footer, the glass effect that can make them see-through, and an optional custom page background. All of them are styled in [`src/styles/catalogue-chrome.css`](../../src/styles/catalogue-chrome.css), scoped to `.catalogue-root` and coloured only by `--catalogue-*` variables, so product theme changes never reach them (see [product-theme.md](product-theme.md)).

## Settings

Stored in the catalogue's JSONB columns, typed in `@quicktalog/common` (1.71.0+). All of them are optional, so rows saved before they existed need no migration and read as "off".

| Setting | Where | Default | Plan |
|---|---|---|---|
| `appearance.search` `{ isEnabled, placeholder }` | General tab, Search | off | every plan |
| `appearance.glass` `{ level, opacity, frost, splay, apply }` | Appearance tab, Style | level 0 (off) | plans with `apperance.styles` |
| `appearance.background` `{ isEnabled, type, gradient, color, image, fade }` | Appearance tab, Background | off | plans with `apperance.styles` |
| `footer.tagline` | Footer tab, Business information | empty | custom footer (branding) |

`applyPlanToCatalogue` ([`lib/entitlements/catalogue.ts`](../../src/lib/entitlements/catalogue.ts)) normalizes them on create, save and publish: glass is clamped and background is cleaned (known gradient key, `#rrggbb` colour, http(s) photo URL without quotes, fade 0-80), and both reset to off without style controls; the placeholder is capped at 40 characters and the tagline is collapsed to one line of at most 120. `applyPlanDowngrade` resets stored glass and background with the other style settings.

## Navbar

`CatalogueHeader` is a pill (`.cat-nav`) that sticks 9px below the top edge. Its corners follow the owner's corner radius (`--cat-pill`), so radius 0 gives a square bar. Past 8px of scroll it gets a stronger shadow (`data-scrolled`). From `md` up the contact icons and the button sit in the pill; on phones the button stays and the icons move into a dropdown under it. The logo keeps the owner's width but stops at 44px tall.

## Search

When `appearance.search.isEnabled`, `CatalogueContent` renders `CatalogueSearchBar` above the sections, in view and edit mode. It filters items by name and description (`getDisplayItems` in [`lib/catalogue/items.ts`](../../src/lib/catalogue/items.ts)), hides sections with no match, opens every matching section, and reports the match count in a status line. `/` focuses it and Esc clears it. Only the published page mirrors the query into `?q=`; in the builder it is local state, and item edit controls are hidden while a query is active. There is no item-count threshold any more: the owner decides.

## Footer

`CatalogueFooter` follows the site footer: a brand column, information columns, a partners row and a bottom bar with the copyright and legal links. The Quicktalog footer always has four columns. A custom footer shows only what the owner filled in (Contact, Visit us, Stay updated), and the grid template is built from those columns. Without a newsletter the footer button sits under the brand column; with one it becomes a link under the form. Without a logo the legal name takes its place.

## Glass effect

[`lib/catalogue/glass.ts`](../../src/lib/catalogue/glass.ts) resolves the stored settings against four presets (Off, Clear, Semi-frosted, Frosted). `Catalogue` writes the result onto `.catalogue-root` as CSS variables (`--glass-frost`, `--glass-splay`, `--glass-tint-pct`, ...) and one `data-glass-<surface>` attribute per surface in glass (`navbar`, `search`, `headers`, `cards`), plus `data-dark` on dark themes. The stylesheet does the rest, so cards and headers need no props:

- Light themes fill glass with white; dark themes keep each surface's own colour.
- Section headers tint through a `.cat-glass-fill` layer, because their background is a gradient.
- Phones cap the blur at 20px and drop it on cards. Browsers without `backdrop-filter`, and visitors who ask for reduced transparency, get a nearly solid fill.

## Background

[`lib/catalogue/background.ts`](../../src/lib/catalogue/background.ts) holds the gradient library (light and dark groups) and turns the setting into the style of one fixed layer, `.cat-bg`, rendered first inside `.catalogue-root`. With a layer present the root gets `data-bg`, which drops the theme background and isolates the root so the layer sits behind its content. Each type keeps its own value, so switching type and back keeps the owner's pick. A photo gets a fade layer in the theme background colour (0-80 %) to keep text readable. Cards, headers and text keep the theme's colours, so the builder warns when the background's lightness matches the theme text (a dark gradient under a light theme). Photos are UploadThing uploads; the worker's image cleanup scans the whole `appearance` value, so they count as in use.
