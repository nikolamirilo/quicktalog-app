# Research: catalogue design and appearance (for end-user docs)

Read-only research. Repo root `/Users/nikola/Desktop/Quicktalog/quicktalog-app`; shared package `/Users/nikola/Desktop/Quicktalog/quicktalog-packages/src` (paths prefixed `packages/`). Evidence is `path:line`. Labels are copied letter by letter. Anything not confirmable from code is marked `?` and listed under **Could not confirm**.

---

## Where design settings live (how the owner gets there)

- Design lives in the **catalogue builder**, at the route `/admin/[name]/builder` — `src/app/admin/[name]/builder` exists as a route folder and the doc states the path — `docs/architecture/builder.md:3`.
- The builder renders the catalogue with `Catalogue.tsx` in `type="edit"` and wraps it in builder chrome — `docs/architecture/builder.md:3`, `src/components/catalogue/view/Catalogue.tsx:171-188`.
- The design controls sit in the **editor panel**. It is opened from the desktop rail button labelled `Editor` (`aria-label="Editor panel"`, title `Open the editor panel` / `Close the editor panel`) — `src/components/catalogue/builder/BuilderRail.tsx:38-53`.
- On phones the same panel opens from the bottom bar — `docs/architecture/builder.md:15`, `src/components/catalogue/inputs/sidebar/index.tsx:178-188`.
- The panel header reads title `Edit catalogue` and subtitle `Name, header, footer and appearance` — `src/components/catalogue/inputs/sidebar/index.tsx:139-144`.
- The panel has **four tabs in this order**: `General`, `Header`, `Footer`, `Appearance`, each icon-over-label in four equal columns — `src/components/catalogue/inputs/sidebar/index.tsx:66-101`, `src/components/catalogue/inputs/sidebar/index.tsx:151`.
- Tab icons: General = `Home`, Header = `Layout`, Footer = `FileText`, Appearance = `Palette` — `src/components/catalogue/inputs/sidebar/index.tsx:11`, `:73-100`.
- The tab that opens first is `general` — `src/components/catalogue/inputs/sidebar/index.tsx:50`.
- **Appearance tab** holds themes, custom colours, background, style (fonts/corners/shadow/glass) and overlay — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:148-228`.
- **General tab** holds the opt-in search bar — `src/components/catalogue/inputs/sidebar/GeneralTab.tsx:59-66`.
- **Header tab** holds the navbar settings — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:88-234`.
- **Footer tab** holds the footer settings — `src/components/catalogue/inputs/sidebar/FooterTab.tsx:84-136`.
- Per-section **item layout** is *not* in the panel: it is in each section's `⋯` menu inside the catalogue, and in the Add/Edit section dialog — `src/components/catalogue/cards/common/BlockMenu.tsx:94-124`, `src/components/catalogue/modals/content/LayoutPicker.tsx:149-219`, `docs/architecture/builder.md:30`, `:45`.
- There is a cross-link from Header to the glass settings: the button `Open glass settings` switches to Appearance and scrolls to the glass block (`panel-glass`) — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:127-134`, `src/components/catalogue/inputs/sidebar/index.tsx:51-61`, `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:18`.

### Order of the Appearance tab (top to bottom)

1. `Themes` — info text `Select the overall visual theme for your catalogue.` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:150-165`
2. `Custom colors` — only shown when a custom theme is active; info `Pick each color of your theme, then save it to reuse it on other catalogues.` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:167-183`
3. `Background` — info `Replace the theme's background with your own photo, a gradient or a single colour. Cards, headers and text keep the theme's colours. Photos and gradients also give the glass effect something to show through.` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:185-197`
4. `Style` — info `Customize fonts, rounded corners, shadows and the glass effect.`; contains the four style fields then the glass block — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:199-215`
5. `Overlay` — info `Add a floating icon overlay to your catalogue.` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:217-227`

### Order of the Header tab

1. `Customize header` (switch only, no body) — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:88-108`
2. `Floating navbar` (note + link to glass) — `:110-135`
3. `Logo size` — `:144-162`
4. `Interaction` — `:164-205`
5. `Icons` — `:207-233`

### Order of the Footer tab

1. `Customize footer` (switch only) — `src/components/catalogue/inputs/sidebar/FooterTab.tsx:84-104`
2. `Logo size` — `src/components/catalogue/inputs/sidebar/footer/LogoSizeSection.tsx:15-28`
3. `Interaction` — `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:24-84`
4. `Business information` — `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:51-89`
5. `Social media links` — `src/components/catalogue/inputs/sidebar/footer/SocialLinksSection.tsx:61-136`
6. `Partners` — `src/components/catalogue/inputs/sidebar/footer/PartnersSection.tsx:136-242`

### Order of the General tab

1. `General information` — `src/components/catalogue/inputs/sidebar/GeneralTab.tsx:50-57`
2. `Search` — `src/components/catalogue/inputs/sidebar/GeneralTab.tsx:59-66`
3. `Logo` — `:68-88`
4. `Contact information` — `:90-135`
5. `Search and sharing` — `:137-182`
6. Analytics & tracking (`TrackingSection`) — `:184-188`

---

## Built-in themes

Only **7** themes are offered. The list comes from the shared package and is sorted by `id` ascending in the picker — `packages/constants/general.ts:1-74`, `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:45`.

| Order | Display name (exact) | id / key | Light or dark | One plain sentence |
|---|---|---|---|---|
| 1 | `Monochrome` | 3 / `theme-monochrome` | light | Near-white page, pure-black text and buttons, white cards — a plain high-contrast black-and-white look. `packages/constants/general.ts:18-25`, `src/styles/themes.css:38-73` |
| 2 | `Elegant` | 4 / `theme-elegant` | dark | Almost-black page with a soft dark gradient, off-white text and cool blue accents. `packages/constants/general.ts:26-33`, `src/styles/themes.css:149-186` |
| 3 | `Organic` | 5 / `theme-organic` | light | Warm beige page with muted green text and accents and a soft gold secondary. `packages/constants/general.ts:34-41`, `src/styles/themes.css:112-147` |
| 4 | `Modern` | 6 / `theme-modern` | dark | Deep navy-purple page, white text, violet buttons and a pink price colour. `packages/constants/general.ts:42-49`, `src/styles/themes.css:188-223` |
| 5 | `Luxury` | 7 / `theme-luxury` | light | Cream page, near-black text, white cards and gold buttons and accents. `packages/constants/general.ts:50-57`, `src/styles/themes.css:1-36` |
| 6 | `Creative` | 8 / `theme-creative` | dark | Very dark blue-grey page with coral-red, blue and yellow accents on lifted slate cards. `packages/constants/general.ts:58-65`, `src/styles/themes.css:75-110` |
| 7 | `Coffee` | 10 / `theme-coffee` | light | Warm oat page with a faint woven pattern, dark brown text and ochre accents. `packages/constants/general.ts:66-73`, `src/styles/themes.css:424-481` |

- Theme `type` (`"light"` / `"dark"`) is what drives the dark-theme handling (`data-dark`, glass fills, default logo) — `src/lib/themes/custom-theme.ts:319-323`, `src/components/catalogue/view/Catalogue.tsx:65`, `:79-81`, `:197`.
- The tile for each theme is drawn **in that theme's own colours and fonts** (a live preview, not a screenshot): a coloured dot plus the theme label, 96px tall, in a grid of at least 92px columns — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:60-62`, `:138-183`.
- **Only 5 tiles show by default.** `Show more themes` adds 6 more; once everything is shown the button becomes `Show fewer themes`, which goes back to 5 — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:43`, `:186-207`.
- The `Custom` tile (dashed border, rainbow conic-gradient dot with a `+`) is first in the grid and only appears on plans with advanced appearance — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:25-26`, `:64-89`, `:48`.
- The selection marker is a ring **outside** the tile (2.5px accent ring with offset), so the tile keeps the theme's own look — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:28-30`.
- Picking a standard theme stores `{ name: <key>, type: "standard" }` and discards any custom colours — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:62-73`.
- Standard themes are **not** plan-gated: the `Themes` section is the only Appearance section with no lock wrapper — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:150-165`; and the plan table lists `Standard themes` as included on every tier — `src/constants/pricing.ts:89`, `:240-242`.

### Themes that exist in CSS but are NOT selectable

- `.theme-winter-light`, `.theme-advent-1`, `.theme-advent-2` are fully defined in CSS but are not in the `themes` array (`Advent 1` / `Advent 2` are commented out, `Winter Light` has no entry at all) — `src/styles/themes.css:225-300`, `:302-360`, `:362-422`, `packages/constants/general.ts:2-17`.
- These three are also the **only** themes that set their own fonts (`--catalogue-font-heading` / `--catalogue-font-body`, weights and letter-spacing) — `src/styles/themes.css:261-266`, `:338-343`, `:398-403`. The 7 selectable themes set no font variables at all.

### Saved custom themes (theme library)

- Saved themes are listed as tiles **before** the standard themes, each drawn in its own saved colours, with a small palette badge top-left and a delete `×` button (`aria-label` `Delete {name}`) — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:49`, `:91-136`.
- Tile accessible name: `{name} (saved custom theme)` — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:101`.
- Saved themes only appear on plans with advanced appearance — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:21-22`, `:48`.
- They are stored per user in `user_themes` and listed newest-updated first — `src/actions/themes.ts:20-26`.
- The 5-tile default is **shared** between saved and standard themes (saved first), so 5 saved themes hide every standard one until `Show more themes` — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:46-54`.

---

## Fonts

- There is **one** font setting. It is labelled `Font style` and it sets **both** the heading font and the body font: `Catalogue.tsx` writes the same value to `--catalogue-font-heading` and `--catalogue-font-body` — `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:107`, `src/components/catalogue/view/Catalogue.tsx:202-203`, `:154-155`.
- The control is a select; each option is rendered in its own font, so the dropdown previews the typeface — `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:108-127`.
- **19 options, in this exact order and spelling** — `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:33-77`:

| # | Label (exact) | stored value |
|---|---|---|
| 1 | `Inter` | `inter` |
| 2 | `Arial` | `arial` |
| 3 | `Roboto` | `roboto` |
| 4 | `Open Sans` | `open-sans` |
| 5 | `Montserrat` | `montserrat` |
| 6 | `Lato` | `lato` |
| 7 | `Poppins` | `poppins` |
| 8 | `Nunito` | `nunito` |
| 9 | `Raleway` | `raleway` |
| 10 | `Oswald` | `oswald` |
| 11 | `Lora` | `lora` |
| 12 | `Playfair Display` | `playfair` |
| 13 | `Merriweather` | `merriweather` |
| 14 | `Roboto Slab` | `roboto-slab` |
| 15 | `Crimson Text` | `crimson` |
| 16 | `Source Sans 3` | `source-sans` |
| 17 | `Work Sans` | `work-sans` |
| 18 | `DM Sans` | `dm-sans` |
| 19 | `Josefin Sans` | `josefin-sans` |

- **Default font: `Inter`** (`fontFamily: "inter"` in the default catalogue; the control also falls back to `inter` for an unknown stored value) — `packages/constants/catalogue.ts:28-33`, `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:96-99`, `src/components/catalogue/view/Catalogue.tsx:67-68`.
- `Arial` is the only non-Google option; it maps to `Arial, sans-serif`. All 18 others map to a `next/font` CSS variable — `src/constants/builder.ts:3-23`, `src/lib/fonts/index.ts:34-181`.
- All 19 font variables are attached to `<html>`, so every option resolves — `src/app/layout.tsx:43`.
- Font weights in the catalogue are fixed at heading 700 / body 400 (the owner cannot change them) — `src/components/catalogue/view/Catalogue.tsx:204-205`.
- `.catalogue-root` pins Lora 18px/28px as the base, but the owner's font variables override it for real content — `docs/architecture/product-theme.md:78-79`.

---

## Colours the owner can set

### Custom theme colours (Appearance › Custom colors)

Shown only when the `Custom` tile or a saved theme is active. Five rows, each with a label, a one-line hint, a swatch button and a hex field — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:168-205`.

| Order | Label (exact) | Hint (exact) | Default |
|---|---|---|---|
| 1 | `Page background` | `Behind the whole catalogue` | `#f3f3f3` |
| 2 | `Titles` | `Catalogue name and section titles` | `#000000` |
| 3 | `Card background` | `Behind each item` | `#ffffff` |
| 4 | `Item text` | `Item names and descriptions on cards` | `#1a1a1a` |
| 5 | `Buttons and prices` | `Buttons, prices and section accents` | `#000000` |

Evidence: labels and hints `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:30-56`; defaults `src/lib/themes/custom-theme.ts:14-21`.

- A sixth stored colour, `secondary` (default `#4d4d4d`), has **no picker**: the comment says no catalogue element uses it, so the control did nothing; saved themes keep whatever value they had — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:25-29`, `src/lib/themes/custom-theme.ts:14-21`, `src/lib/themes/custom-theme.ts:26-33`.
- The defaults mirror `theme-monochrome` — `src/lib/themes/custom-theme.ts:13`, cf. `src/styles/themes.css:38-50`.
- Everything else in the palette (borders, section backgrounds, navbar colours, price colour, category gradient, button text) is **derived**, not chosen — `src/lib/themes/custom-theme.ts:217-272`.
- The custom theme is stored under the name `theme-custom` and rendered as an inline `<style>` block — `src/lib/themes/custom-theme.ts:23`, `src/components/catalogue/view/Catalogue.tsx:60-63`, `:189-191`.
- Custom palettes pass through an **allowlist** before they can reach the document: only `--catalogue-[a-z-]+` names and only a six-digit hex or the exact 135deg gradient shape are serialized — `src/lib/themes/custom-theme.ts:274-295`.
- `Theme name` field: label `Theme name`, placeholder `e.g. Summer menu`, max 60 characters — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:155-165`.
- Save button text is `Save theme` for a new theme, `Update theme` when editing one, `Saving...` while it runs — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:224-235`.

### Contrast / validation checks

- **One real contrast check, on item text over cards.** `isTextReadableOnCard` requires WCAG AA 4.5:1 between `Item text` and `Card background` — `src/lib/themes/custom-theme.ts:150-151`, `:182-190`.
  - When it fails, cards render the text nudged toward black or white automatically (`readableOn`) — `src/lib/themes/custom-theme.ts:157-176`, `:229`, `:252-253`.
  - The panel shows a warning (see **Messages**).
- Button/price text colours are auto-picked for legibility (`onColor`, with a 1.15 margin so a mid-brightness brand colour keeps white text) and the price colour is nudged to AA against the card (`ensureContrast`) — `src/lib/themes/custom-theme.ts:128-148`, `:245-249`.
- Card description is held to 3:1 — `src/lib/themes/custom-theme.ts:254-258`.
- **No contrast check at all** on `Page background` vs `Titles`, or on the picked `Buttons and prices` colour against the page.
- Hex validation: the picker only accepts `/^#[0-9a-f]{6}$/i`; the hex text field accepts any 7 characters while typing, and anything that is not a valid 6-digit (or 3-digit, expanded) hex is **silently dropped** when saved — `src/components/catalogue/inputs/sidebar/appearance/ColorPicker.tsx:15`, `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:192-200`, `src/lib/themes/custom-theme.ts:35-56`, `:197-209`, `src/actions/catalogue.ts:39-54`.
- Background colour has a second, separate check: the **theme-text clash** warning (see Background).
- The divider section has its own colour field, labelled `Colour`, default `#000000`, with no contrast check — `src/components/catalogue/inputs/DividerInput.tsx:98-127`, `src/components/catalogue/modals/AddContentModal.tsx:41-50`.

### What the colour picker looks like

- Trigger: a 44×44px rounded swatch filled with the current colour, `aria-label` = `Pick the {label in lower case} color` — `src/components/catalogue/inputs/sidebar/appearance/ColorPicker.tsx:148-153`.
- Popover is 248px wide (capped to the viewport minus 32px), aligned to the end, and contains, top to bottom — `src/components/catalogue/inputs/sidebar/appearance/ColorPicker.tsx:155-246`:
  1. a 144px-tall saturation/brightness pad with a round draggable handle (`role="slider"`, arrow keys move 1%, Shift+arrow 10%) — `:160-195`, `:123-135`
  2. a full-spectrum hue slider (0–359) — `:197-214`
  3. a `Quick picks` grid, 6 per row, up to 18 swatches: the theme's own five colours first, then the 12 presets, de-duplicated — `:216-246`, `:138-142`
- Preset quick picks: `#ffffff`, `#f5f0e8`, `#d4d4d4`, `#737373`, `#262626`, `#000000`, `#c77f00`, `#b91c1c`, `#ea580c`, `#15803d`, `#1d4ed8`, `#7e22ce` — `src/components/catalogue/inputs/sidebar/appearance/ColorPicker.tsx:20-34`.
- Beside each swatch is a 104px-wide monospace uppercase hex field, max 7 characters — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:192-200`.
- The in-app picker deliberately replaces the browser's native colour dialog — `src/components/catalogue/inputs/sidebar/appearance/ColorPicker.tsx:57-61`.

---

## Layout options (item layouts)

Four layouts, from the shared package — `packages/constants/general.ts:75-104`:

| Key | Label (exact) | What it changes |
|---|---|---|
| `variant_1` | `Side Image` | Stacked full-width cards, image on the left, name/description on the right (grid: 1 column on phones, 2 on desktop). `packages/constants/general.ts:76-82` |
| `variant_2` | `Top Image` | Cards side by side, image above the text, wrapping as needed. `packages/constants/general.ts:83-89` |
| `variant_3` | `Text Only` | Stacked cards with name, description and price, **no image**. `packages/constants/general.ts:90-96` |
| `variant_4` | `Carousel` | One horizontally scrollable row with page dots; visitors swipe through items. `packages/constants/general.ts:97-103` |

- **Default layout for a new items section: `variant_1`** (`Side Image`) — `src/components/catalogue/modals/AddContentModal.tsx:35-37`, and the agent's fallback is the same — `src/lib/catalogue/operations.ts:150`.
- Layout is **per items section**, not per catalogue — `src/components/catalogue/sections/ItemsSection.tsx:120`, `:138`.
- Two places to change it:
  - the section `⋯` menu, under the heading `Layout`: a 4-across radio row of drawn tiles, with the chosen layout's name printed underneath — `src/components/catalogue/cards/common/BlockMenu.tsx:94-124`
  - the Add/Edit section dialog's `LayoutPicker`: 2 columns on narrow screens, 4 from 360px, each tile a drawn SVG thumbnail plus the label, with a tick badge on the chosen one — `src/components/catalogue/modals/content/LayoutPicker.tsx:164-218`
- The thumbnails are hand-drawn SVGs; the `image` field on the shared `layouts` entries (`/layouts/variant_*.jpg`) is **not used** — `src/components/catalogue/modals/content/LayoutPicker.tsx:13`, `docs/architecture/builder.md:45`.
- Layouts are keyboard-operable with the arrow keys — `src/components/catalogue/modals/content/LayoutPicker.tsx:158-169`.
- Layout is **not** plan-gated anywhere.
- The `/demo` page has its own layout + theme switcher with headings `Choose Layout Style` and `Choose Color Theme`, and the labels `Side Image`, `Top Image`, `Text Only`, `Carousel` — `src/components/general/AppearanceOptions.tsx:8-13`, `:85`, `:151`.

### Other shape/size style controls (Appearance › Style)

All four are sliders. Order and exact labels — `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:105-163`:

| Order | Label | Range / step | Marks under the track | Default | What it changes |
|---|---|---|---|---|---|
| 1 | `Font style` | select, 19 options | — | `Inter` | heading + body font |
| 2 | `Content font size` | 0–2, step 1 | `Small` `Medium` `Large` | `medium` | item title and description size (fluid `clamp()`) — `src/constants/builder.ts:25-35`, `src/components/catalogue/cards/common/CardTitle.tsx:17`, `src/components/catalogue/cards/common/CardDescription.tsx:21` |
| 3 | `Corner radius` | 0–16, step 1, shown as `{n}px` | — | `12` | card corners, section headers, item images, the navbar pill, the search pill, the item sheet — `src/app/globals.css:170-173`, `src/styles/catalogue-chrome.css:5`, `:72`, `:331`, `src/components/catalogue/sections/common/SectionHeader.tsx:61`, `src/components/catalogue/sections/common/Items.tsx:239`, `src/components/catalogue/modals/CatalogueDialog.tsx:67` |
| 4 | `Shadow` | 0–3, step 1 | `None` `High` | `low` | card and section-header shadow depth — `src/constants/builder.ts:37-42`, `src/components/catalogue/view/Catalogue.tsx:209-214` |

- Stored shadow values: `none`, `low`, `medium`, `high`; stored font sizes: `small`, `medium`, `large` — `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:79-80`.
- The slider's current value is echoed to the right of the label, capitalised (so the shadow slider reads `Low`, `Medium`, `High`) — `src/components/catalogue/inputs/sidebar/panel/SliderField.tsx:43-45`.
- A corner radius of 0 makes the navbar and search bar square, because `--cat-pill` is `radius × 999` — `src/styles/catalogue-chrome.css:3`, `:5`.
- Defaults in a new catalogue: `contentFontSize: "medium"`, `fontFamily: "inter"`, `borderRadius: 12`, `shadow: "low"` — `packages/constants/catalogue.ts:28-33`.

---

## Published catalogue chrome

### Navbar (header)

| Setting (exact label) | Where | Default | Off → on |
|---|---|---|---|
| `Customize header` | Header tab, top section | off (`type: "default"`) | Off: the Quicktalog navbar. On: the owner's own navbar. `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:88-108`, `packages/constants/catalogue.ts:64-65` |
| `Logo width` | Header tab › `Logo size` | 160px in the slider's fallback (stored default is 100) | Widens the logo in the pill; it stops growing at 44px tall. 20–300px, step 2. `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:148-161`, `:69`, `packages/constants/catalogue.ts:66-69` |
| `Header action link` | Header tab › `Interaction` | on in stored data (`cta.isEnabled: true`), but nothing shows until a link is filled in | Adds a button to the navbar. `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:168-176`, `packages/constants/catalogue.ts:70-74`, `src/components/catalogue/view/CatalogueHeader.tsx:117-123` |
| `Button label` | shown when the action link is on | empty → renders as `Learn more` | `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:180-190`, `src/components/catalogue/view/CatalogueHeader.tsx:120` |
| `Button link` | shown when the action link is on | empty | With no URL the button does not render at all. `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:191-202`, `src/components/catalogue/view/CatalogueHeader.tsx:117` |
| `Phone number icon` | Header tab › `Icons`, hint `Show a phone icon in the header.` | on (`phoneCta: true`) | Only shows if a phone number is filled in under General › Contact information. `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:212-221`, `packages/constants/catalogue.ts:76`, `src/components/catalogue/view/CatalogueHeader.tsx:99-107` |
| `Email icon` | Header tab › `Icons`, hint `Show an email icon in the header.` | on (`emailCta: true`) | Same rule for email. `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:222-231`, `packages/constants/catalogue.ts:75`, `src/components/catalogue/view/CatalogueHeader.tsx:90-98` |

What the customer sees:

- A floating pill (`.cat-nav`) that sticks 9px below the top edge, 64px tall, max 1240px wide, in the theme's navigation colours, with the owner's corner radius — `src/styles/catalogue-chrome.css:45-77`, `docs/architecture/catalogue-chrome.md:20`.
- Past 8px of scroll it gains a stronger shadow — `src/components/catalogue/view/CatalogueHeader.tsx:31-32`, `src/styles/catalogue-chrome.css:78-82`.
- From 768px the icons and the button sit in the pill; below that they move into a burger menu that opens under it, headed `Contact us` — `src/styles/catalogue-chrome.css:242-250`, `src/components/catalogue/view/CatalogueHeader.tsx:180-221`, `:201`.
- The logo is capped at 44px tall regardless of the width setting — `src/styles/catalogue-chrome.css:89-95`.
- Clicking the logo goes to the owner's website if one is set, otherwise `/` — `src/components/catalogue/view/CatalogueHeader.tsx:143-147`.
- With `Customize header` **off** the visitor sees the Quicktalog navbar: a Quicktalog logo at 160px, a mail icon to `quicktalog@outlook.com` and a button `Create Your Catalog` pointing at sign-up — `src/components/catalogue/view/CatalogueHeader.tsx:80-87`, `:110-116`, `:125-128`.
- The navbar is not rendered at all in the `/demo` view — `src/components/catalogue/view/Catalogue.tsx:238-244`.

### Search bar (opt-in)

| Setting (exact label) | Default | Off → on |
|---|---|---|
| `Search` section, switch `aria-label` = `Show search bar` | **off** | `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:17-34`, `packages/constants/catalogue.ts:45-48` |
| `Placeholder text` (field, shown only when on) | empty → the bar shows `Search items…` | `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:35-55`, `src/components/catalogue/view/CatalogueSearchBar.tsx:74` |

- Section description flips with the switch: on = `Visitors can search items by name or description.`; off = `Off. Turn it on to add a search bar under the heading.` — `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:26-30`.
- Section info popover: `A search bar under the catalogue heading. Visitors type part of an item's name or description and the items filter as they type.` — `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:32`.
- Placeholder field: placeholder `Search items…`, hint `Shown in the empty search bar.`, **40 character limit** — `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:38-53`, `src/lib/catalogue/items.ts:44`, `:52-55`.
- **Available on every plan** — `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:13`, `docs/architecture/catalogue-chrome.md:11`; `normalizeSearch` is applied regardless of plan — `src/lib/entitlements/catalogue.ts:65-67`.
- What the visitor sees when on: a 52px-tall pill, max 560px wide, in card colours with the owner's corner radius, a magnifier on the left and a `/` key hint on the right (desktop only) — `src/styles/catalogue-chrome.css:314-423`, `src/components/catalogue/view/CatalogueSearchBar.tsx:63-93`.
- Input accessible name: `Search catalogue items` — `src/components/catalogue/view/CatalogueSearchBar.tsx:68`.
- Behaviour: filters items by name and description, hides sections with no match, opens every matching section, reports a match count, `/` focuses, `Esc` clears; on the published page the query is mirrored into `?q=` — `docs/architecture/catalogue-chrome.md:24`, `src/components/catalogue/view/CatalogueSearchBar.tsx:43-53`, `:71-73`, `src/components/catalogue/view/CatalogueContent.tsx:95`, `:118`.
- Typing is debounced 200ms — `src/components/catalogue/view/CatalogueSearchBar.tsx:24`, `:37-41`.
- Off: no bar, nothing else changes.

### Footer

| Setting (exact label) | Where | Default | Off → on |
|---|---|---|---|
| `Customize footer` | Footer tab, top | off (`type: "default"`) | Off: the Quicktalog footer (four columns). On: only the columns the owner filled in. `src/components/catalogue/inputs/sidebar/FooterTab.tsx:84-104`, `packages/constants/catalogue.ts:78-79`, `src/components/catalogue/view/CatalogueFooter.tsx:130-137` |
| `Logo width` | Footer › `Logo size` | 160px fallback (stored default 100) | 20–400px, step 2. `src/components/catalogue/inputs/sidebar/footer/LogoSizeSection.tsx:13`, `:19-27` |
| `Footer action link` | Footer › `Interaction` | on in stored data, nothing shows without a URL | `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:28-36`, `src/components/catalogue/view/CatalogueFooter.tsx:129` |
| `Button label` / `Button link` | shown when the action link is on | empty, placeholders `e.g. Contact Us` / `e.g. https://mywebsite.com/contact` | `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:40-58` |
| `Newsletter` | Footer › `Interaction` | off | Adds a sign-up form column. Plan-gated. `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:67-75`, `packages/constants/catalogue.ts:89` |
| `Footer tagline` | Footer › `Business information` | empty | One line under the logo, **120 characters**, live counter. `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:55-73`, `src/lib/catalogue/footer.ts:1` |
| `Legal business name` | Footer › `Business information` | empty, placeholder `e.g. Quicktalog Inc.` | Also used in the copyright line and, with no logo, in the logo's place. `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:17-23`, `src/components/catalogue/view/CatalogueFooter.tsx:140-142`, `docs/architecture/catalogue-chrome.md:28` |
| `Business address` | same | empty, placeholder `e.g. 123 Main St, San Francisco, CA` | `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:24-30` |
| `Terms & conditions link` | same | empty | `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:31-37` |
| `Privacy policy link` | same | empty | `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:38-44` |
| `Add a profile link` | Footer › `Social media links` | none | Up to 5 links, each with an auto-fetched site icon. `src/components/catalogue/inputs/sidebar/footer/SocialLinksSection.tsx:99-130`, `src/constants/index.ts:221` |
| `Partners` (switch `aria-label` `Show partners`) | Footer › `Partners` | off (`showPartners: false`) | Shows a partners row; max 3 partners, each with `Partner name`, `Link`, `Description`. `src/components/catalogue/inputs/sidebar/footer/PartnersSection.tsx:136-148`, `:11`, `:43-69`, `packages/constants/catalogue.ts:90` |

- Footer structure (both modes): brand column, information columns, a partners row, a bottom bar with the copyright and legal links — `docs/architecture/catalogue-chrome.md:28`, `src/components/catalogue/view/CatalogueFooter.tsx:144-189`.
- Custom footer columns are built only from what is filled in: brand always, `Contact` if any contact detail exists, company info if a legal name or address exists, newsletter if it is on — `src/components/catalogue/view/CatalogueFooter.tsx:126-137`, `:155-175`.
- Copyright line: `© {year} {legal name or "Your Company"}. All rights reserved.` for a custom footer; `© {year} Quicktalog. All rights reserved.` for the default one — `src/components/catalogue/view/CatalogueFooter.tsx:140-142`, `:183-186`.
- Default footer columns: Quicktalog logo at 160px + tagline + socials, `Contact & Support`, a features column and a create-your-own column — `src/components/catalogue/view/CatalogueFooter.tsx:28-77`.
- Without a newsletter the footer button sits under the brand column; with one it becomes a link under the form — `docs/architecture/catalogue-chrome.md:28`, `src/components/catalogue/view/CatalogueFooter.tsx:157-161`.

---

## Glass effect

In **Appearance › Style**, under a divider, in a block with the id `panel-glass` — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:18`, `:37-41`, `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:209-212`.

| Control (exact label) | Options / range | Default |
|---|---|---|
| `Glass effect` (slider) | marks `Off` `Clear` `Semi` `Frosted`; 0–3, step 1 | **`Off`** (level 0) |
| `Use glass on` (pill checkboxes) | `Navbar`, `Search bar`, `Section headers`, `Item cards` | all four **on** |
| `Fine-tune` › `Opacity` | 20–85%, step 5; marks `See-through` `Solid` | from the level's preset |
| `Fine-tune` › `Frost` | 0–40px, step 1; marks `Sharp` `Soft` | from the preset |
| `Fine-tune` › `Splay` | 0–24px, step 1; marks `Flat` `Thick` | from the preset |

Evidence: `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:42-58`, `:60-79`, `:114-161`; targets `src/lib/catalogue/glass.ts:7-12`; limits `src/lib/catalogue/glass.ts:22-26`; defaults `src/lib/catalogue/glass.ts:28-34`, `packages/constants/catalogue.ts:38-44`.

- Presets: `Off` (opacity 100, frost 0, splay 0), `Clear` (35 / 2px / 4px, saturate 120%), `Semi-frosted` (55 / 8px / 8px, saturate 140%), `Frosted` (70 / 20px / 12px, saturate 160%) — `src/lib/catalogue/glass.ts:15-20`.
- The slider marks say `Semi` but the value readout says `Semi-frosted` — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:45`, `src/lib/catalogue/glass.ts:18`.
- Once a fine-tune slider is touched the readout becomes `{preset label}, tuned` and a reset link appears: `Reset to {preset label}` — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:52-57`, `:162-171`.
- Changing the level **clears** any fine-tuning — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:33`, `:46-50`.
- The `Fine-tune` row's summary line always shows the effective numbers: `Opacity {n}% · Frost {n}px · Splay {n}px` — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:101-104`.
- The surface pills are disabled while the level is Off — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:68`.
- `Glass effect` info popover: `Makes the navbar, search bar, section headers and item cards see-through, like frosted glass. What sits behind them shows through softly, most of all under the navbar while visitors scroll.` — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:43`.
- Hints: `Lower lets more of the page show through.`, `Blur of what's behind, like content scrolling under the navbar. Phones cap it at 20 px.`, `Light along the edges. Past 16 px it starts to glow.` — `:127-129`, `:142-145`, `:158-160`.
- Rendering rules the customer actually gets: light themes fill glass with white, dark themes keep each surface's own colour; phones cap the blur at 20px and drop it on cards entirely; browsers without `backdrop-filter` and visitors who ask for reduced transparency get a nearly solid fill (90% / 95%) — `docs/architecture/catalogue-chrome.md:34-36`, `src/styles/catalogue-chrome.css:872-923`.
- Dark themes get a quarter of the edge sheen — `src/lib/catalogue/glass.ts:97-98`.
- Glass is only visible against something: the panel info for `Background` says photos and gradients "give the glass effect something to show through" — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:187`.
- **Plan: needs advanced appearance** — the whole `Style` section is wrapped in `LockedGroup` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:203`; the server resets glass to `DEFAULT_GLASS` without it — `src/lib/entitlements/catalogue.ts:55-59`, `docs/architecture/catalogue-chrome.md:12`.
- There are **no** image/file limits for glass: it is pure CSS.

---

## Custom background

In **Appearance › Background**, block id `panel-background` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:185-197`.

| Control (exact label) | Options | Default |
|---|---|---|
| `Customize background` (switch) | on / off | **off** |
| `Background type` (radio group) | `Photo`, `Gradient`, `Colour` | `Gradient` |
| `Photo` + dropzone | one image | none |
| `Fade` (slider, photo only) | 0–80%, step 5; marks `Photo` `Theme colour` | 35% |
| gradient tiles | 12 presets | `Oat milk` (`oat`) |
| `Colour` | hex field + `Any colour` native picker + 12 `Quick picks` | `#f6f1e9` |

Evidence: switch `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:89-94`; types `:26-34`, `:98-125`; photo `:144-178`; fade `:163-172` with `src/lib/catalogue/background.ts:105`; colour `:232-298`; defaults `src/lib/catalogue/background.ts:107-114`, `packages/constants/catalogue.ts:49-56`.

- The three type buttons are a keyboard radio group (arrow keys cycle) — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:72-85`, `:101-103`.
- Each type keeps its own value, so switching type and back keeps the owner's pick — `docs/architecture/catalogue-chrome.md:40`, `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:56-57`.
- **12 gradient presets, all light** (`dark: false`): `Oat milk`, `Peach glow`, `Sunset`, `Sage`, `Meadow`, `Sea glass`, `Morning sky`, `Lavender`, `Orchid`, `Blush`, `Stone`, `Mist` — `src/lib/catalogue/background.ts:15-88`. Tiles are 4:3, in an auto-fill grid of at least 82px, with a tick on the chosen one — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:186-227`.
- Because every gradient is light, a dark theme always clashes with a gradient and the panel can only advise switching theme — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:68-70`, `:136-141`.
- 12 colour `Quick picks`: `#ffffff`, `#f6f1e9`, `#f3ece2`, `#eef2e6`, `#eaf3fb`, `#fcedf0`, `#f2eef9`, `#fdf8e1`, `#1f1712`, `#0f1424`, `#0f1a14`, `#1a1020` — `src/lib/catalogue/background.ts:90-103`.
- **Photo limits:**
  - hint `Landscape photos at least 1600 px wide look best.` and the browser downsizes to a 1600px max dimension — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:150-152`, `:156`.
  - dropzone accepts `PNG, JPG or WebP, up to 50 MB. We resize it for you.`; it refuses SVG and anything that is not an image; it resizes and compresses before upload — `src/components/general/ImageDropzone.tsx:10-18`, `:65-78`, `:244-252`.
  - the UploadThing route itself allows `maxFileSize: "4MB"`, 1 file, signed-in users only, rate-limited — `src/app/api/items/uploadthing/core.ts:11-32`.
  - stored URLs must be absolute `http(s)` with no quotes or newlines, or they are dropped — `src/lib/catalogue/background.ts:122-133`.
  - photos are UploadThing uploads and the worker's image cleanup treats them as in use — `docs/architecture/catalogue-chrome.md:40`.
- The background is one fixed layer (`.cat-bg`) rendered first inside the catalogue root; with a layer present the theme's own background is dropped — `src/styles/catalogue-chrome.css:23-43`, `src/components/catalogue/view/Catalogue.tsx:219-233`.
- Cards, headers and text keep the theme's colours — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:187`, `docs/architecture/catalogue-chrome.md:40`.
- A photo gets a fade layer in the theme's background colour, so text stays readable — `src/styles/catalogue-chrome.css:39-43`, hint `Blends the photo into the theme background so text stays readable.` — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:173-176`.
- A `Photo` type with no photo yet falls back to the theme background — `src/lib/catalogue/background.ts:168-169`.
- Fade is clamped 0–80 and the colour must be a 6-digit hex on the server too — `src/lib/catalogue/background.ts:136-157`.
- **Plan: needs advanced appearance** — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:190`; the server resets it to `DEFAULT_BACKGROUND` without it — `src/lib/entitlements/catalogue.ts:60-64`, `docs/architecture/catalogue-chrome.md:13`.

---

## Overlay (falling emoji)

- Section `Overlay`, info `Add a floating icon overlay to your catalogue.` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:217-227`.
- Switch `Enable overlay`, default **off** — `src/components/catalogue/inputs/sidebar/appearance/OverlayConfiguration.tsx:27-32`, `packages/constants/catalogue.ts:34-37`.
- Field `Overlay icon`, placeholder `e.g. 🎁`, hint `Emojis only · {n}/3` — `src/components/catalogue/inputs/sidebar/appearance/OverlayConfiguration.tsx:36-56`.
- **Emojis only, max 3** — anything else is rejected as you type — `src/components/catalogue/inputs/sidebar/appearance/OverlayConfiguration.tsx:12-18`, `:40-47`.
- What the visitor sees: ten copies of the emoji falling down the page on a 10s loop with a 3s side-to-side shake, at staggered delays, `aria-hidden` — `src/components/general/Overlay.tsx:1-16`, `src/styles/overlay.css:1-103`.
- **Plan: needs advanced appearance** — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:221`; reset to the default without it — `src/lib/entitlements/catalogue.ts:51-54`.

---

## Catalogue heading (title) formatting

- In edit mode the catalogue heading is edited in place; a floating toolbar (`aria-label` `Heading formatting`) appears above the box — `src/components/catalogue/view/components/Heading.tsx:17`, `src/components/catalogue/inputs/heading/FormattingToolbar.tsx:49-57`.
- Toolbar controls in order: `Bold`, `Italic`, a divider, then a `Heading size` select — `src/components/catalogue/inputs/heading/FormattingToolbar.tsx:58-109`.
- Heading size options: `Small`, `Medium`, `Large`, `Extra Large` — `src/components/catalogue/inputs/heading/FormattingToolbar.tsx:18-23`.
- **Default heading size: `large`** — `src/lib/catalogue/heading.ts:6`.
- Heading limit: **100 characters** of visible text; over the limit the formatting is dropped rather than cut mid-tag — `src/lib/catalogue/heading.ts:4`, `:54-59`.
- Size maps to responsive Tailwind sizes, e.g. `extraLarge` = `text-4xl md:text-5xl lg:text-6xl` — `src/constants/builder.ts:44-49`.
- A heading cannot be empty if the owner wants to publish: `Preview` and `Publish` are disabled while the heading is empty — `src/components/catalogue/builder/useBuilderActions.ts:75-78`, `src/lib/catalogue/heading.ts:45-47`.

---

## Custom code / custom CSS

There is **no CSS box** and no stylesheet upload anywhere. The only place an owner writes code is the **Custom visual** section type.

- Found via the Add/Edit section dialog: section type `Custom visual` (icon `Sparkles`), last in the type list — `src/components/catalogue/modals/content/SectionTypePicker.tsx:17-23`, `src/components/catalogue/modals/AddContentModal.tsx:233-238`.
- The editor is Monaco: label `HTML code` with a red required `*`, language `html`, theme `vs-dark`, 14px, word wrap on, no minimap — `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:18-23`, `:52-67`.
- It is 120px tall collapsed and 350px expanded; the toggle button reads `Expand editor` / `Collapse editor` — `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:24-49`.
- Hint under the editor: `HTML, CSS and JavaScript for a banner, animation or small interactive object. It runs in an isolated frame, so analytics and tracking scripts will not work here - connect those under Analytics & tracking in the General tab.` — `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:69-74`.
- **What is allowed: arbitrary HTML, CSS and JavaScript. Nothing is stripped.** The code is dropped verbatim into a document and run — `src/components/catalogue/sections/CustomVisual.tsx:54-60`, `:88`.
- **What makes that safe: isolation, not filtering.** The block renders in an `<iframe sandbox="allow-scripts">` **without** `allow-same-origin`, which gives it an opaque origin: no cookies, no storage, no parent DOM, no credentialed requests. Adding `allow-same-origin` would let the frame remove its own sandbox, so it is deliberately absent — `src/components/catalogue/sections/CustomVisual.tsx:106-125`, `:202-210`.
- The frame gets a small reset stylesheet, the catalogue's font, and `--catalogue-font-body` / `--catalogue-font-heading`, so code written against those variables resolves — `src/components/catalogue/sections/CustomVisual.tsx:73-85`, `:143-150`.
- The frame reports its own height; the parent starts it at **200px** and caps it at **5000px** — `src/components/catalogue/sections/CustomVisual.tsx:14`, `:16`, `:169-171`.
- Analytics and tracking tags **cannot** work here (they need the real document URL and cookies); they go through the separate tracking block, which stores an id, not a snippet — `src/components/catalogue/sections/CustomVisual.tsx:116-119`.
- **Size limit:** `MAX_CODE_CHARS = 40000` — but it is only applied to the AI assistant's tool schema, not to the Monaco editor — `src/agent/core/schemas.ts:7`, `src/agent/tools/sections.ts:74`, `:118`. The Monaco editor imposes no limit; see **Could not confirm**.
- Validation in the dialog: the `Add section` / `Save section` button stays disabled until the code field is non-empty — `src/components/catalogue/modals/AddContentModal.tsx:206-207`.
- **Plan:** needs `features.sections.customVisual` (Pro and up) — `src/components/catalogue/modals/AddContentModal.tsx:116-117`, `src/constants/pricing.ts:88`.
- A separate, *different* path exists for **External content** (`embedding`): that HTML **is** filtered at render through an allowlist — tags `iframe`, `video`, `audio`, `source` on top of prose tags, schemes `http`/`https`/`mailto`/`tel`, and `<iframe src>` only to ~35 allowed hosts (YouTube, Vimeo, Google Maps, Calendly, Stripe, Instagram, …); `<script>`, `<form>`, `on*` handlers and `<svg>` are discarded because the list is an allowlist — `src/lib/html/sanitize.ts:1-11`, `:13-57`, `:106-167`, `:177-183`.
- Text sections and the catalogue heading go through the stricter `text` profile of the same allowlist — `src/lib/html/sanitize.ts:132-136`.

---

## Which design features are plan-gated, and the exact locked text

### The gates

| Feature | Flag | Plans that have it |
|---|---|---|
| Standard themes, item layouts, corner-less basics, search bar | — | every plan — `src/constants/pricing.ts:89`, `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:13` |
| Custom themes / `Custom colors`, `Background`, `Style` (font, text size, corners, shadow, glass), `Overlay` | `advancedAppearance` | Pro (id 2), Growth (3), Premium (4), and the custom plan (5). **Not** Starter (0) or Basic (1) — `packages/constants/pricing.ts:33`, `:64`, `:95`, `:126`, `:157`, `:188` |
| Logo, contact details, metadata, custom header, custom footer | `branding` | Basic and up — `packages/constants/pricing.ts:19`, `:58`, `:81` |
| Footer newsletter form | `newsletter` | Growth and up — `packages/constants/pricing.ts:17`, `:48`, `:79`, `:110` |
| `Divider` section (spacing, border style/thickness/colour/opacity) | `sections.divider` | Basic and up — `packages/constants/pricing.ts:25`, `:51` |
| `External content`, `Custom visual` sections | `sections.embedding`, `sections.customVisual` | Pro and up — `packages/constants/pricing.ts:26-27`, `:52-53`, `:87-88` |

Plan names as the user sees them: `Starter`, `Basic`, `Pro`, `Growth`, `Premium` — `packages/constants/pricing.ts:6`, `:38`, `:69`, `:100`, `:131`.

In the plan comparison the design rows read `Standard themes (7)`, `Custom branding` (hint `Logo, contact details, metadata, custom header & footer`) and `Advanced styling` (hint `Your own colour themes, fonts, shapes, glass & background`) under the group title `Design & branding` — `src/constants/pricing.ts:237-253`. The subscription overview uses the group title `Design` with rows `Standard themes`, `Advanced styling`, `Custom branding` — `src/constants/pricing.ts:86-97`.

### What the user sees when the plan does not allow it

1. **The upgrade overlay** (`LimitsOverlay`): a lock tile, the heading `Upgrade required`, a paragraph, and a button `Upgrade now`. The fields stay visible underneath at 30% opacity and are `inert`, so they read as a preview — `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:22-50`, `src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:14-42`.
   - Generic paragraph (used for every Appearance section): `Upgrade your plan to unlock this feature.` — `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:44`.
   - Branding paragraph (used for the whole Header and Footer tabs, and the General tab's logo / contact / metadata groups): `Make your catalog truly yours. Add your logo and brand details, and customize the header and footer.` then, on a new line, `Upgrade your plan to unlock this feature.` — `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:37-42`.
   - `Upgrade now` saves the draft first, then goes to `/pricing`; if the save is refused it opens pricing in a new tab and keeps the builder open — `src/hooks/useUpgrade.ts:11-25`.
2. **The newsletter inline notice**: `Upgrade your plan for the newsletter form.` with a small lock, under the dimmed switch — `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:77-82`.
3. **A locked section type** shows a lock icon in the type list plus the screen-reader text `(upgrade required)`, stays selectable so the form can explain itself, and the dialog's add button stays disabled — `src/components/catalogue/modals/content/SectionTypePicker.tsx:79-87`, `:27-31`, `src/components/catalogue/modals/AddContentModal.tsx:200-201`; the form body shows the same `Upgrade required` overlay — `src/components/catalogue/modals/content/BlockConfigForm.tsx:47-49`.
4. **The `Custom` theme tile and the saved-theme tiles simply do not appear** on plans without advanced appearance — no lock, no message — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:64`, `:48`.
5. **Server-side refusals** (plain strings, not toasts of their own):
   - `Custom themes are not part of your plan` — returned by the theme save/update actions — `src/lib/themes/upsert.ts:59-62`, surfaced as a toast via `toast.error(res.error || "Failed to save theme")` — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:117`.
6. **The AI assistant** is gated the same way: the `setCustomTheme` tool is removed entirely on plans without advanced appearance, so the model never offers it — `src/agent/tools/index.ts:40-43`; and an appearance edit it does attempt is refused with `Custom themes and the font, text size, corner and shadow settings are not part of your plan.` — `src/lib/catalogue/operations.ts:614-627`.

---

## Every user-visible message in this area

### Appearance tab / themes

| Text (exact) | Kind | Cause | Evidence |
|---|---|---|---|
| `Started a new custom theme. Customize the colors below, then save it to reuse later.` | success toast | clicking the `Custom` tile | `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:95-97` |
| `Show more themes` / `Show fewer themes` | button | more than 5 themes exist / everything is shown | `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:194`, `:205` |
| `New custom theme. Name it and save it to reuse it later.` | inline note | building a new custom theme | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:149` |
| `Editing {theme name}` | inline note | a saved theme is being edited | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:132-136` |
| `Item text is hard to read on this card background, so cards show it a little lighter.` / `… a little darker.` | status note | `Item text` vs `Card background` is under 4.5:1; "lighter" on a dark card, "darker" on a light one | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:207-221`, `src/lib/themes/custom-theme.ts:182-190` |
| `Give your theme a name first` | error toast | Save pressed with an empty name | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:105-109` |
| `Theme saved` / `Theme updated` | success toast | save succeeded (new / existing) | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:115` |
| `Failed to save theme` | error toast | save failed with no server message | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:117` |
| `No changes to update yet.` | inline note | editing a saved theme with nothing changed | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:236-240` |
| `Failed to delete theme` | error toast | deleting a saved theme failed with no server message | `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:108` |
| `Custom themes are not part of your plan` | server error (shown as a toast) | saving/updating a theme without advanced appearance | `src/lib/themes/upsert.ts:59-62` |
| `You already have a theme with that name` | server error (toast) | renaming a theme onto an existing name | `src/lib/themes/upsert.ts:130-135` |
| `Name is required` | server error (toast) | empty name reached the server | `src/lib/themes/upsert.ts:38`, `:107` |
| `Not found` | server error (toast) | theme id missing or not the caller's | `src/lib/themes/upsert.ts:108-110`, `:128`; `src/actions/themes.ts:69` |
| `Unauthorized` | server error (toast) | not signed in | `src/actions/themes.ts:18`, `:41`, `:52`, `:61` |
| `Unknown error` | server error (toast) | unexpected failure | `src/lib/themes/upsert.ts:55`, `:89`, `:138`; `src/actions/themes.ts:32`, `:74` |

### Background

| Text (exact) | Kind | Cause | Evidence |
|---|---|---|---|
| `Your theme's text is dark, so it will be hard to read on this dark background. Pick a light one, or a light theme.` (tones swap; the second sentence becomes `Pick a {text tone} theme.` when no preset of the other tone exists) | status note | the background's lightness matches the theme's text colour | `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:127-141`, `:58-70` |
| `Landscape photos at least 1600 px wide look best.` | hint | always, under `Photo` | `:150-152` |
| `Blends the photo into the theme background so text stays readable.` | hint | always, under `Fade` | `:173-176` |
| `Choose a file or drag it here` | dropzone label | idle dropzone | `src/components/general/ImageDropzone.tsx:216-222` |
| `PNG, JPG or WebP, up to 50 MB. We resize it for you.` | dropzone hint | idle dropzone | `src/components/general/ImageDropzone.tsx:18`, `:244-252` |
| `Please select a valid image file` | error toast | a non-image file | `src/components/general/ImageDropzone.tsx:65-67` |
| `File is too large. Please select a smaller image` | error toast | over 50 MB | `src/components/general/ImageDropzone.tsx:69-71` |
| `SVG images aren't supported here. Please upload a PNG or JPG.` | error toast | an SVG | `src/components/general/ImageDropzone.tsx:73-78` |
| `Failed to process image` | error toast | decode/resize failed | `src/components/general/ImageDropzone.tsx:114-116` |

### Glass

| Text (exact) | Kind | Cause | Evidence |
|---|---|---|---|
| `Off keeps every surface solid.` | info note | glass level 0 | `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:81-89` |
| `Opacity {n}% · Frost {n}px · Splay {n}px` | summary | always on the `Fine-tune` row | `:101-104` |
| `Reset to Clear` / `Reset to Semi-frosted` / `Reset to Frosted` | link button | a fine-tune slider was moved | `:162-171` |
| `Lower lets more of the page show through.` | hint | under `Opacity` | `:127-129` |
| `Blur of what's behind, like content scrolling under the navbar. Phones cap it at 20 px.` | hint | under `Frost` | `:142-145` |
| `Light along the edges. Past 16 px it starts to glow.` | hint | under `Splay` | `:158-160` |

### Header / footer / search

| Text (exact) | Kind | Cause | Evidence |
|---|---|---|---|
| `Your settings below are used for the header.` / `Using the default header. Turn this on to change it.` | section description | `Customize header` on / off | `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:100-106` |
| `The header floats above the catalogue and stays at the top while visitors scroll.` | section description | always | `:111` |
| `How see-through it is comes from Appearance › Glass effect. On phones the icons and button move into a menu.` | info note | always, in `Floating navbar` | `:114-126` |
| `Open glass settings` | link button | always | `:132` |
| `In the floating navbar the logo stops growing at 44 px tall.` | hint | always, under `Logo width` | `:159-161` |
| `Your settings below are used for the footer.` / `Using the default footer. Turn this on to change it.` | section description | `Customize footer` on / off | `src/components/catalogue/inputs/sidebar/FooterTab.tsx:96-102` |
| `Upgrade your plan for the newsletter form.` | locked notice | plan has no newsletter | `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:77-82` |
| `One line under your logo in the footer. {n}/120` | hint + counter | always, under `Footer tagline` | `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:66-72` |
| `{n} of 5 links added.` / `Maximum of 5 social links reached.` | hint | adding social links (`MAX_SOCIALS = 5`) | `src/components/catalogue/inputs/sidebar/footer/SocialLinksSection.tsx:127-134`, `src/constants/index.ts:221` |
| `Maximum of 3 partners reached.` | hint | 3 partners added | `src/components/catalogue/inputs/sidebar/footer/PartnersSection.tsx:236-238` |
| `Visitors can search items by name or description.` / `Off. Turn it on to add a search bar under the heading.` | section description | search on / off | `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:26-30` |
| `Shown in the empty search bar.` | hint | search on | `:48-53` |
| `No items match “{query}”.` | live status on the published page | a query matches nothing | `src/components/catalogue/view/CatalogueSearchBar.tsx:96-98` |
| `{n} items match “{query}”` / `1 item matches “{query}”` | live status | a query matches | `src/components/catalogue/view/CatalogueSearchBar.tsx:98` |

### Overlay / custom code / layout

| Text (exact) | Kind | Cause | Evidence |
|---|---|---|---|
| `Emojis only · {n}/3` | hint | overlay on | `src/components/catalogue/inputs/sidebar/appearance/OverlayConfiguration.tsx:51-56` |
| `HTML, CSS and JavaScript for a banner, animation or small interactive object. It runs in an isolated frame, so analytics and tracking scripts will not work here - connect those under Analytics & tracking in the General tab.` | hint | always, under the code editor | `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:69-74` |
| `Expand editor` / `Collapse editor` | button | code editor collapsed / expanded | `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:32-42` |
| `Are you sure you want to delete this section?` | browser confirm | deleting a section from its `⋯` menu | `src/components/catalogue/cards/common/BlockMenu.tsx:150` |
| `Upgrade required` + `Upgrade your plan to unlock this feature.` + `Upgrade now` | locked overlay | the plan lacks the group | `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:32`, `:44`, `:48` |
| `Make your catalog truly yours. Add your logo and brand details, and customize the header and footer.` | locked overlay (branding variant) | the plan lacks branding | `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:37-42` |

### Saving and publishing (the design changes ride on these)

| Text (exact) | Kind | Cause | Evidence |
|---|---|---|---|
| `Saving...` → `Catalogue saved successfully` / `Failed to save catalogue` | toast | `Save` | `src/components/catalogue/builder/useBuilderActions.ts:54-64` |
| `Publishing...` → `Catalogue published successfully` | toast | `Publish` on a catalogue that is not live yet | `:105-120` |
| `Updating...` → `Catalogue updated successfully` (with a `View` action) | toast | `Update` on a live catalogue | `:121-139` |
| `Please save the catalogue first` | error toast | publishing before the catalogue has an id | `:98-101` |
| `Catalogue has no name/slug` | error toast | preview of a catalogue with no slug | `:84-90` |
| `{error}. Your changes are still here.` | error toast | the `Upgrade now` save was refused | `src/hooks/useUpgrade.ts:21-23` |

### AI assistant refusals that touch design

| Text (exact) | Cause | Evidence |
|---|---|---|
| `Custom themes and the font, text size, corner and shadow settings are not part of your plan.` | an appearance edit on a plan without advanced appearance | `src/lib/catalogue/operations.ts:623-625` |
| `Custom theme colours were all invalid.` | every colour the model sent failed the hex check | `src/lib/catalogue/operations.ts:642-645` |
| `No appearance settings to change.` | the tool call carried no fields | `src/lib/catalogue/operations.ts:668-671` |
| `Header settings are not part of your plan.` | header edit without branding | `src/lib/catalogue/operations.ts:678-682` |
| `Footer settings are not part of your plan.` | footer edit without branding | `src/lib/catalogue/operations.ts:718-723` |
| `The newsletter form is not part of your plan.` | turning the newsletter on without the plan | `src/lib/catalogue/operations.ts:724-730` |
| `Not signed in, so the custom theme was applied but not saved.` | `setCustomTheme` with no verified identity | `src/agent/tools/appearance.ts:92-98` |
| `Could not save the theme.` | the library save failed while the theme itself applied | `src/agent/tools/appearance.ts:104-107` |

---

## Rules the owner needs to know

### Immediate vs after publishing

- **Every design control is immediate on screen.** Each one writes through the builder context's single `commit`, so the catalogue in the middle of the builder repaints at once — `src/context/CatalogueContext.tsx:374-394`, `docs/architecture/builder.md:95-100`.
- The colour picker throttles a drag to one update per frame, so the catalogue follows the drag without stuttering — `src/components/catalogue/inputs/sidebar/appearance/ColorPicker.tsx:97-106`.
- **`Save` does not change the live page.** It writes the draft to Redis only; the comment is explicit that "the database row stays the source of the id, name, owner and status" — `src/actions/catalogue.ts:368-371`.
- **`Publish` / `Update` is what changes the live page**: it writes the shaped catalogue into the database row, sets `status: "active"`, and revalidates — `src/actions/catalogue.ts:460-486`.
- `Preview` saves the draft first and then opens `/catalogues/{name}/preview`, which reads the draft on top of the row — `src/components/catalogue/builder/useBuilderActions.ts:80-95`, `src/app/catalogues/[name]/preview/page.tsx:1`, `:31`, `src/actions/catalogue.ts:388`.
- `Preview` and `Publish` are **disabled** until the catalogue has at least one section, a name and a non-empty heading — `src/components/catalogue/builder/useBuilderActions.ts:75-78`.
- The published page is ISR with `revalidate = 86400`; a publish busts the path and the tags, so the new design appears without waiting — `src/app/catalogues/[name]/page.tsx:11`, `src/lib/cache/revalidate.ts:8-18`.
- Saving a **theme to the library** is a different thing from applying it: `Save theme` / `Update theme` writes a row in `user_themes` immediately, independent of catalogue save or publish — `src/actions/themes.ts:36-54`, `src/lib/themes/upsert.ts:31-57`.
- Leaving the builder with unsaved changes warns; choosing Leave discards the draft — `docs/architecture/builder.md:110-112`.

### Does a built-in theme change reach an existing catalogue?

- **Yes.** A standard theme is stored only as its class name (`appearance.theme.name`, e.g. `theme-coffee`); the colours live in `src/styles/themes.css` and are applied at render — `src/components/catalogue/view/Catalogue.tsx:195`, `src/styles/themes.css`. So editing a built-in theme's CSS restyles every catalogue already using it, published ones included, with no action by the owner. **There is no frozen copy of a standard theme.**

### Does a catalogue keep its own copy of a custom theme?

- **Yes.** A custom theme stores its colours *on the catalogue row*: `{ type: "custom", name: "theme-custom", colors }` — `src/context/CatalogueContext.tsx:386-394`, `packages/constants/catalogue.ts:23-27` (shape), `src/components/catalogue/view/Catalogue.tsx:60-63`.
- The saved-theme row in `user_themes` is a **separate** copy. Editing a saved theme changes that library row; it does not reach catalogues that already use those colours — `src/lib/themes/upsert.ts:100-127` only touches `user_themes`.
  - Exception: while the panel *is* editing that theme and that catalogue, each picker move also writes the catalogue draft — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:101-104`, `:175-180`.
- Deleting a saved theme leaves the catalogue's colours alone: they stay "as a new, unsaved theme" — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:106-111`.
- Picking a standard theme after a custom one **discards** the custom colours — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:62-73`; the AI path does the same — `src/lib/catalogue/operations.ts:632-638`.
- Clicking `Custom` from a standard theme seeds the five pickers from what is on screen; clicking `Custom` while already on a custom theme resets to the neutral defaults — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:83-99`, `src/lib/themes/custom-theme.ts:302-317`.
- `theme-custom` is also the class name used by every custom theme, so only one custom palette can exist per catalogue — `src/lib/themes/custom-theme.ts:23`, `:283-295`.

### Downgrade

- On a downgrade the server resets `style`, `overlay`, `glass` and `background` to the defaults and converts any custom theme back to `theme-monochrome`, for **all** of the user's catalogues at once — `src/lib/entitlements/catalogue.ts:135-153`, `packages/constants/catalogue.ts:24-27`.
- The same reset runs on every create, save and publish, so a client cannot buy a design feature by sending it — `src/lib/entitlements/catalogue.ts:28-72`, `docs/architecture/builder.md:63-66`.
- Branding loss also forces `header.type` and `footer.type` back to `"default"` and the newsletter off — `src/lib/entitlements/catalogue.ts:118-133`, `:32-37`.
- Saved themes in the library survive a downgrade (nothing deletes `user_themes`), they just cannot be applied; confirmed only by absence — see **Could not confirm**.

### Product theme vs catalogue

- The builder's own controls follow the **product** theme; the catalogue in the middle follows only the catalogue themes and the owner's settings. A change to the product theme must never change a published catalogue — `docs/architecture/product-theme.md:3-8`, `:92`.
- The catalogue explicitly opts out of everything it would inherit from the product: `.catalogue-root`, frozen copies of the button and dialog, and catalogue-only generic colour names — `docs/architecture/product-theme.md:74-89`.

---

## Layout facts for drawing the design panel accurately

- **Panel width: 440px** from `md` (720px), capped at `calc(100vw - 72px)`; the desktop rail is **72px**; the wide breakpoint is **1280px** — `src/components/catalogue/builder/frame.ts:1-11`, `src/components/catalogue/builder/BuilderPanel.tsx:87`.
- Below 720px the panel is a full-height sheet over the whole screen, above the bottom bar — `src/components/catalogue/inputs/sidebar/index.tsx:104-115`, `docs/architecture/builder.md:15`.
- From 720px to 1279px the panel overlays the catalogue with a dark blurred scrim (`bg-product-dark/40`, `backdrop-blur-[2px]`) and is a modal dialog: focus is trapped, Esc or the scrim closes it — `src/components/catalogue/inputs/sidebar/index.tsx:116-124`, `src/components/catalogue/builder/BuilderPanel.tsx:54-81`, `:86-92`.
- From 1280px the panel sits beside the catalogue, which gets 512px (72 + 440) of right padding, and it is not modal — `src/components/catalogue/builder/frame.ts:14-19`, `src/components/catalogue/builder/BuilderPanel.tsx:40-41`.
- Panel background is `bg-product-background`; the panel header and the tab strip are `bg-product-card`, and the panel has a left border and a product shadow (the shadow is dropped from 1280px) — `src/components/catalogue/builder/BuilderPanel.tsx:87`, `:94`, `src/components/catalogue/inputs/sidebar/index.tsx:150`.
- Panel header: 44px ghost icon buttons; on phones a back arrow to `/admin/dashboard`, then the title (`text-base`, bold, heading font) and subtitle (`text-xs`, muted), then a close `×` titled `Close editor (Esc)` — `src/components/catalogue/builder/BuilderPanel.tsx:94-129`.
- Tab strip: `grid-cols-4`, 1px gap, `rounded-2xl`, 4px padding, on a `border-b` strip with 12px padding (16px from `md`) — `src/components/catalogue/inputs/sidebar/index.tsx:150-151`.
- Active tab style: **amber tint with an amber border, not a solid fill** (`border-product-primary`, `bg-product-primary-soft`, no shadow); labels are `text-xs` semibold, truncated, under the icon — `src/components/catalogue/inputs/sidebar/index.tsx:30-35`, `:152-160`.
- Tab content scrolls in a `ScrollArea` with 16px padding; sections are spaced 16px apart (`space-y-4`) — `src/components/catalogue/inputs/sidebar/index.tsx:165-172`, `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:149`.
- Each setting group is one white card: `rounded-product-card` (22px), 1px `product-border`, `bg-product-card`, 16px padding, 16px between its own children — `src/components/catalogue/inputs/sidebar/panel/PanelSection.tsx:32-36`, `docs/architecture/product-theme.md:42`.
- Group heading: 15px bold in the heading font; optional 13px muted description under it; optional `(i)` button beside it; optional control (usually a switch) at the end of the title row — `src/components/catalogue/inputs/sidebar/panel/PanelSection.tsx:38-56`.
- The `(i)` button is 28px visible with a 44px hit area; its popover is 264px wide, opens above, 13px text — `src/components/catalogue/inputs/sidebar/panel/InfoTip.tsx:16-40`.
- Panel content is width-contained (`contain: inline-size`) so a long URL or partner name truncates instead of widening the panel — `src/components/catalogue/inputs/sidebar/panel/tabRoot.ts:1-7`.

### Control anatomy

- **Select** (`Font style`, divider `Style`, heading size): 44px tall, full width, `rounded-[14px]`, 1.5px `product-border-strong` border, `bg-product-card`, 16px left/right padding, 16px text (15px from `md`), a chevron on the right that rotates 180° when open; on focus the border turns amber with a 4px amber ring at 25%. The dropdown is `rounded-[18px]`, `bg-product-card`, a product-hover shadow, `z-[2000]`, 6px padding, and the chosen row shows a tick on the right — `src/components/ui/select.tsx:19-39`, `:88-116`, `:143-160`.
- **Slider**: a 6px track in `product-border-strong` with an amber-accent filled range, and a 22px white thumb with a 2px amber border and a soft shadow that scales 110% on hover. The hit area is forced to 44px tall in panel fields — `src/components/ui/slider.tsx:29-37`, `src/components/catalogue/inputs/sidebar/panel/SliderField.tsx:47-56`.
- **Slider field layout**: label (plus optional `(i)`) on the left, the current value on the right in 13px semibold tabular-nums, capitalised; then the track; then the end marks in `text-xs` muted, spread with `justify-between` — `src/components/catalogue/inputs/sidebar/panel/SliderField.tsx:36-66`.
- **Switch**: 44 × 26px, 3px transparent border, amber-accent when on, `product-border-strong` when off, with a 20px white thumb that slides 18px — `src/components/ui/switch.tsx:11-25`.
- **Switch row**: at least 44px tall, label on the left (clickable, tied to the switch), optional 12.5px muted hint under it, switch on the right — `src/components/catalogue/inputs/sidebar/panel/SwitchField.tsx:33-57`.
- **Pill toggle** (the glass surfaces): 36px tall, fully rounded, 1.5px border, a 16px checkbox then the label in 13.5px semibold; checked = amber-accent border on `product-primary-soft` — `src/components/catalogue/inputs/sidebar/panel/PillToggle.tsx:5-30`.
- **Theme tiles**: `grid-cols-[repeat(auto-fill,minmax(92px,1fr))]`, 10px gap, each tile 96px tall, `rounded-2xl`, a 32px round colour dot above a truncated 12px label, lifting 1px on hover — `src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:60-62`, `:138-183`.
- **Background type switch**: three buttons in a 1-px-padded `rounded-[14px]` tray on `product-background-hero`, each 40px tall with a 16px icon and a 13px semibold label; the active one gets a white card fill and a ring-like shadow — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:98-125`.
- **Gradient tiles**: `grid-cols-[repeat(auto-fill,minmax(82px,1fr))]`, 10px gap, 4:3 swatch with the gradient as its background, `rounded-xl`, a tick when chosen, a truncated 12px caption under it — `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:186-227`.
- **Layout tiles**: 2 columns under 360px, 4 from 360px, 8px gap, max 560px wide; each a `rounded-[12px]` card (14px from `md`) with a drawn glyph in a tinted box plus a centred 12px label, and a round amber tick badge on the chosen one — `src/components/catalogue/modals/content/LayoutPicker.tsx:164-218`.
- **Locked group**: minimum 200px tall (`sm`) or 240px (`default`) so the lock, text and button fit; content dimmed to 30% and `inert` — `src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:26-41`.
- The locked Header and Footer tabs are sized `h-[calc(100dvh-250px)]` (`100dvh-200px` from `sm`) with the overlay at `size="lg"` — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:72-80`, `src/components/catalogue/inputs/sidebar/FooterTab.tsx:68-76`.
- A group that depends on a switch (everything under `Customize header` / `Customize footer`) is dimmed to 50% and `inert` while the switch is off — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:137-143`, `src/components/catalogue/inputs/sidebar/FooterTab.tsx:106-112`.
- Hex fields are 44px tall and 104px wide, monospace, uppercase — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:192-200`, `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:241-253`.
- Colour rows are a divided list (`divide-y` with a top and bottom border), each row at least 56px tall — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:168-176`.

---

## Contradictions

1. **Logo-width default: 160 in the panel, 100 in the data and the renderer.** The Header and Footer `Logo width` sliders fall back to `160`, the stored default is `100`, and the published navbar falls back to `100`. A catalogue created from the defaults therefore shows `100px` on the slider, while a catalogue whose `logoSize.width` is missing or `0` shows `160px` in the builder but renders at `100px`. The footer slider's `handleChange` fallback object is `{ width: 120, height: 40 }`, a third number — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:69`, `:45-48`, `src/components/catalogue/inputs/sidebar/footer/LogoSizeSection.tsx:13`, `src/components/catalogue/inputs/sidebar/FooterTab.tsx:35-38`, `packages/constants/catalogue.ts:66-69`, `:80-83`, `src/components/catalogue/view/CatalogueHeader.tsx:128`.
2. **Glass slider marks vs the preset name.** The slider mark reads `Semi`, the value readout and the reset link read `Semi-frosted` — `src/components/catalogue/inputs/sidebar/appearance/GlassConfiguration.tsx:45`, `:53-57`, `src/lib/catalogue/glass.ts:18`.
3. **Shadow slider marks only name the two ends.** The slider has four stops (`none`, `low`, `medium`, `high`) but only `None` and `High` are printed under it; the two middle values are named only by the value readout — `src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:153-162`.
4. **Fine-tune defaults vs stored defaults.** `Opacity` can only be set between 20 and 85, but the `Off` preset's opacity is 100 and the `Frosted` preset's is 70; "Opacity 100%" can be displayed but never dialled — `src/lib/catalogue/glass.ts:16`, `:22-26`, `:77`.
5. **The `Custom colors` lock is unreachable in practice.** The section is wrapped in `LockedGroup locked={!hasAdvancedAppearance}`, but it only renders when the theme is already custom, and the server resets a custom theme to `theme-monochrome` on every save and on downgrade — so the lock can only ever flash on stale client state — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:167-183`, `src/lib/entitlements/catalogue.ts:68-70`, `:147-152`.
6. **Hex typing is accepted by the UI and dropped by the server.** The hex text field writes whatever is typed straight onto the catalogue (no validation, no error), and `sanitizeCustomThemeColors` silently drops any key that is not a valid hex on save, falling back to the default colour. The owner gets no message — `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:192-200`, `src/lib/themes/custom-theme.ts:197-209`, `src/actions/catalogue.ts:39-54`.
7. **`Custom visual` code size: 40,000 characters on the AI path only.** The Monaco editor and `AddContentModal` apply no length check, so a hand-typed block can exceed what the assistant is allowed to write — `src/agent/core/schemas.ts:7`, `src/agent/tools/sections.ts:74`, cf. `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:52-67`, `src/components/catalogue/modals/AddContentModal.tsx:200-208`.
8. **Glass, background and overlay cannot be changed by the AI assistant, only by hand.** `appearanceFieldsSchema` covers theme, font, size, radius, shadow and custom colours and nothing else; `update_appearance` has no glass/background/overlay branch — so "ask the AI to turn on the glass effect" will not work, even though the UI groups glass inside `Style` — `src/agent/tools/appearance.ts:47-54`, `src/lib/catalogue/operations.ts:612-674`.
9. **Three themes exist in CSS but cannot be chosen** (`Winter Light`, `Advent 1`, `Advent 2`), and they are the only ones that set their own fonts — so the font-per-theme mechanism exists but no selectable theme uses it — `src/styles/themes.css:225-422`, `packages/constants/general.ts:2-17`.
10. **Docs vs code on the glass doc's claim that background gradients are "all light today".** That is still accurate (every preset has `dark: false`), but the panel's code already branches for dark gradients and the warning text promises "Pick a {other tone} one" whenever such a preset exists — a doc-visible behaviour that is currently dead — `docs/architecture/catalogue-chrome.md:40`, `src/lib/catalogue/background.ts:15-88`, `src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:62-70`, `:138-140`.
11. **Header `cta.isEnabled` defaults to `true` in stored data** but the panel's switch reads `catalogue.header?.cta?.isEnabled || false`, and the navbar only renders a button when a URL is set — so a new catalogue has the setting on, shows the switch as on, and still shows no button — `packages/constants/catalogue.ts:70-74`, `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:169`, `src/components/catalogue/view/CatalogueHeader.tsx:117-123`.

---

## Could not confirm

- **Whether saved themes survive a downgrade.** Nothing in `applyPlanDowngrade` touches `user_themes` (`src/lib/entitlements/catalogue.ts:95-173`) and `listSavedThemes` has no plan check (`src/actions/themes.ts:11-34`), so they should still be listed — but the `Custom`/saved tiles are hidden by `allowCustom` (`src/components/catalogue/inputs/sidebar/appearance/ThemeSelection.tsx:48`), so the owner cannot see them. Confirmed only by absence of code, not by a positive statement. `?`
- **Whether the preview route shows the draft or the published row.** `preview/page.tsx` calls `getCatalogueByName`, whose doc comment says "DB row with any unsaved draft on top" (`src/actions/catalogue.ts:388`), which implies the draft — but I did not read the body of `getCatalogueByName` or the preview page in full. `?`
- **Exact `aria`/visible text of the `cat-nav-sheet` burger menu beyond `Contact us`** — I read the component but not the full CSS block for the sheet (`src/styles/catalogue-chrome.css:181-241`). `?`
- **Whether the `Corner radius` maximum of 16px is also the server-side cap.** The slider caps at 16 (`src/components/catalogue/inputs/sidebar/appearance/StyleConfiguration.tsx:146`) while the AI schema allows 0–64 (`src/agent/tools/appearance.ts:51`), and `applyPlanToCatalogue` does not clamp `style` at all (`src/lib/entitlements/catalogue.ts:48-72`) — so a value above 16 can probably be stored via the assistant, but I did not find a test or a normalizer proving it. `?`
- **The exact rendered look of the `Items` layouts** (spacing, columns per breakpoint). I read the layout descriptions in `packages/constants/general.ts:75-104` and the thumbnails in `LayoutPicker`, but not `src/components/catalogue/sections/common/Items.tsx` in full, so the descriptions above come from the shared-package text and the glyphs, not from the renderer. `?`
- **Whether the demo page's theme/layout switcher is reachable by a signed-in owner** (it is on `/demo`, `src/components/general/AppearanceOptions.tsx:20`, rendered only for `type === "demo"`, `src/components/catalogue/view/Catalogue.tsx:257-261`). Whether `/demo` is linked from the marketing site is outside what I read. `?`
