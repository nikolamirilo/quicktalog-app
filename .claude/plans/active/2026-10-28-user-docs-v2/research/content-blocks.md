# Research: content blocks, sections, items and their fields

Read-only research for end-user documentation. Every fact carries `path:line`.

**Path roots**
- Unprefixed paths → `/Users/nikola/Desktop/Quicktalog/quicktalog-app/`
- `pkg:` prefix → `/Users/nikola/Desktop/Quicktalog/quicktalog-packages/src/`

**Block types that exist (5 live, 2 legacy)**
- `items`, `text`, `divider`, `embedding`, `custom_visual` — the `ContentOption` union — `src/components/catalogue/modals/content/BlockConfigHeader.tsx:6-11`
- Stored union also keeps `category` and `container`, both `@deprecated`, normalized to `items` on read, never written — `pkg:types/catalogue.ts:89-104`, `pkg:types/catalogue.ts:131-138`, `src/lib/catalogue/content-blocks.ts:25-51`
- There is no Zod schema for catalogue content; `src/constants/schemas.ts` covers only the contact form and QR designs (grep of that file shows `contactSchema` at :387 and `qrConfigSchema` at :458 and nothing for blocks/items). Validation of blocks is: UI enable/disable rules, plan checks, and the render-time HTML sanitizer.

**Where the "add content" picker is**
- Opened from the "Add Section" tile under the catalogue, subtitle "Items, text, a divider, an embed or a custom visual" — `src/components/catalogue/inputs/ContentBlockButton.tsx:24-28`
- Dialog title is "Add section", or "Edit section" when editing — `src/components/catalogue/modals/AddContentModal.tsx:226`
- Left/top picker is a radiogroup labelled "Section type" — `src/components/catalogue/modals/content/SectionTypePicker.tsx:49`
- Footer buttons: "Cancel" and "Add section" / "Save section" — `src/components/catalogue/modals/AddContentModal.tsx:255-260`
- A locked type stays selectable; the form shows the upgrade overlay and the add button stays disabled — `SectionTypePicker.tsx:27-31`, `AddContentModal.tsx:201`, `BlockConfigForm.tsx:49`
- Locked types show a padlock plus screen-reader text "(upgrade required)" — `SectionTypePicker.tsx:79-87`

---

## Items

- Picker label: **"Items"** (icon `LayoutGrid`) — `src/components/catalogue/modals/content/SectionTypePicker.tsx:18`
- Header label: **"Items"** — `src/components/catalogue/modals/content/BlockConfigHeader.tsx:19`
- Picker/header description, exact: **"A group of items. With a heading it can collapse; without one it is a plain grid."** — `BlockConfigHeader.tsx:27-28`
- What it is for: the only block that holds items/cards; `showHeading` decides whether a collapsible heading is drawn — `pkg:types/catalogue.ts:74-87`, `.claude/skills/adding-new-content-block/SKILL.md` ("The item-bearing block")
- What the customer sees: optional heading bar (also the collapse toggle), then the item cards in the chosen layout — `src/components/catalogue/sections/ItemsSection.tsx:108-161`, `src/components/catalogue/sections/common/Items.tsx:114-231`
- On every plan (never gated) — `src/components/catalogue/modals/AddContentModal.tsx:109-120` (`default: return false`), `src/lib/catalogue/operations.ts:67` (`UNGATED_SECTION_TYPES = new Set(["items", "text"])`)

### Fields, in form order (`ItemsBlockFields`)

1. **Heading** / **Section name** (same input, label swaps)
   - Label is `Heading` while "Show heading" is on, `Section name` while it is off; followed by a red `*` — `src/components/catalogue/modals/content/ItemsBlockFields.tsx:32-37`
   - Type: single-line text — `ItemsBlockFields.tsx:38-46`
   - Placeholder: `e.g. Breakfast` with the heading on, `e.g. Weekly specials` with it off — `ItemsBlockFields.tsx:43`
   - Required: yes. The add/save button is disabled until `name.trim().length > 0` — `AddContentModal.tsx:202-203`. There is no error message text; the rule is expressed only as a disabled button plus the `*`.
   - Default value: `""` — `AddContentModal.tsx:36`
   - Max length: none set (no `maxLength` on the input) — `ItemsBlockFields.tsx:38-46`; the AI path caps the same field at 120 chars — `src/agent/tools/sections.ts:52-59`
   - Hint, shown only when the heading is off: **"Not shown to customers. It names the section when you move items."** — `ItemsBlockFields.tsx:47-51`
2. **Show heading** (switch)
   - Label "Show heading", hint **"Title bar above the items"**, icon `Heading` — `ItemsBlockFields.tsx:55-64`
   - Default: on (`showHeading: true`) — `AddContentModal.tsx:51`; when editing, `showHeading ?? true` — `AddContentModal.tsx:96`
   - Off → no heading, so no collapse; the section is always open — `ItemsSection.tsx:94`, `pkg:types/catalogue.ts:83`
3. **Auto-expand** (switch)
   - Label "Auto-expand", hint **"Open when the page loads"**, or **"Turn on the heading first"** when disabled; icon `ChevronsUpDown` — `ItemsBlockFields.tsx:65-79`
   - Disabled whenever "Show heading" is off, and reads as off then — `ItemsBlockFields.tsx:66-67`
   - Default: on (`isExpanded: true`) — `AddContentModal.tsx:52`, `AddContentModal.tsx:97`
   - A disabled option stays visible, dashed and muted, with the hint saying why — `src/components/catalogue/modals/content/OptionSwitch.tsx:17-21,34-36`
4. **Layout** (radio tiles, 4 options)
   - Group label: **"Layout"** — `ItemsBlockFields.tsx:82-88`
   - Options and exact labels, in order: `variant_1` **"Side Image"**, `variant_2` **"Top Image"**, `variant_3` **"Text Only"**, `variant_4` **"Carousel"** — `pkg:constants/general.ts:75-104`
   - Rendered as drawn SVG thumbnails, keyboard-operable with arrow keys — `src/components/catalogue/modals/content/LayoutPicker.tsx:14-124,149-158`
   - Default: `variant_1` — `AddContentModal.tsx:37`, `AddContentModal.tsx:76`
   - Required: effectively always set (no empty state)
   - Layout can also be changed later from the section's ⋯ menu, as a 4-tile radio group under the heading "Layout", with the current layout's label printed under it — `src/components/catalogue/cards/common/BlockMenu.tsx:94-123`
   - `variant_3` (Text Only) hides the item Image field entirely — `src/components/catalogue/inputs/item/ItemImage.tsx:29`

### Items inside the section
- Items are added from the card grid, not from this form: edit mode draws an **"Add New Item"** tile at the end of the grid (or as the last carousel slide) — `src/components/catalogue/sections/common/Items.tsx:36-57,178-185,226-228`
- Editing an existing items section never rewrites its items; the form's item snapshot is dropped on save — `AddContentModal.tsx:146-164`
- Item fields: see **Shared item fields** below.

### Empty / optional states
- With no items: in view mode the grid renders empty (nothing visible under the heading) — `Items.tsx:99-102,190-229` with `getDisplayItems` returning `[]` for an empty array — `src/lib/catalogue/items.ts:33-34`
- In edit mode an empty section shows only the "Add New Item" tile — `Items.tsx:226-228`
- A headless section is outlined with a dashed border in edit mode so it can still be found — `ItemsSection.tsx:99-105`

### Ordering and paging
- Items render in array order; `order` is rewritten to the array index on every add/remove/move — `src/context/CatalogueContext.tsx:107-108,231-266`
- First 20 items render, then a button **"Show more (N remaining)"** adds 20 more — `src/lib/catalogue/items.ts:3-4`, `Items.tsx:99,233-245`
- Per-item controls (⋯ menu): "Edit item", "Move up", "Move down", "Move to section", "Delete item" — `src/components/catalogue/cards/common/CardControls.tsx:97-157`
- "Move to section" lists every other items section by name, or **"Untitled section"** when it has none — `CardControls.tsx:124-141`

### Every user-visible message
| Text | Cause |
|---|---|
| `Invalid data for this section` | `block.items` is not an array and mode is not edit — `ItemsSection.tsx:71-91` |
| `Invalid item data` | An item has no `name` — `src/components/catalogue/cards/index.tsx:53-65` |
| `Add New Item` | Edit-mode add tile — `Items.tsx:54-56` |
| `Show more (N remaining)` | More matching items than currently shown — `Items.tsx:242` |
| `Show {n} more items in {section}` | aria-label of that button — `Items.tsx:236` |
| `Collapse {title} section` / `Expand {title} section` | aria-label of the heading button — `src/components/catalogue/sections/common/SectionHeader.tsx:46` |
| `{name} items` / `{name} carousel` | aria-labels of the item region and the carousel — `Items.tsx:119,133` |
| `Item {n} of {total}` | aria-label of each carousel slide — `Items.tsx:140` |
| `Are you sure you want to delete this item?` | `confirm()` before deleting an item — `CardControls.tsx:150` |
| `Are you sure you want to delete this section?` | `confirm()` before deleting any section — `BlockMenu.tsx:150` |
| `Item added` | Shown for 2s after "Add item & add another" — `src/components/catalogue/modals/ItemModal.tsx:81-118` |
| `Nothing here yet` + `Content you add will appear here. Get started by adding your first item.` | Published catalogue with zero blocks — `src/components/catalogue/view/CatalogueContent.tsx:230-255` |

### HTML / Markdown
- No field of an items block accepts HTML. Item name and description render as plain text — `src/components/catalogue/cards/common/CardTitle.tsx:11-20`, `CardDescription.tsx:15-24`; the detail modal keeps line breaks via `whitespace-pre-line` — `src/components/catalogue/modals/ItemDetailModal.tsx:148-152`

---

## Text

- Picker label: **"Text"** (icon `Type`) — `SectionTypePicker.tsx:19`
- Header label: **"Text"** — `BlockConfigHeader.tsx:20`
- Description, exact: **"Add rich text content with headings, lists, links, and formatting."** — `BlockConfigHeader.tsx:33`
- What the customer sees: the formatted prose, with no heading or frame of its own — `src/components/catalogue/sections/TextBlock.tsx:35-41`
- On every plan — `AddContentModal.tsx:118-120`, `src/lib/catalogue/operations.ts:67`

### Fields, in form order
1. **Section name** (optional)
   - Label **"Section name"**, placeholder **"e.g. Summer sale banner"** — `src/components/catalogue/inputs/BlockNameInput.tsx:24-32`
   - Hint, exact: **"Describes this section for screen readers and identifies it in the builder. Not shown on the page."** — `BlockNameInput.tsx:33-39`
   - Not required, no max length, default `""` — `AddContentModal.tsx:36`; saved as `undefined` when left blank — `AddContentModal.tsx:179`
   - Empty → the `<section>` has no accessible name and is not exposed as a landmark — `BlockNameInput.tsx:13-21`, `TextBlock.tsx:37`
2. **Content** (rich text editor)
   - Field label: **"Content"** — `src/components/catalogue/modals/content/BlockConfigForm.tsx:77-79`
   - Editor starts at `<p></p>` in the dialog — `BlockConfigForm.tsx:84`
   - Default saved value when left empty: `<p>New text block</p>` — `AddContentModal.tsx:181`
   - Not required: the add button is always enabled for `text` — `AddContentModal.tsx:208`
   - Editing surface is `contentEditable`, min-height 200px, max-height 300px, vertically resizable — `src/components/catalogue/sections/common/RichTextEditor.tsx:257-272`
   - Toolbar, in order, with exact button titles/aria-labels: `Bold`, `Italic`, `Underline`, `Bullet List`, `Numbered List`, `Align Left`, `Align Center`, `Align Right`, then a size `<select>` with aria-label `Text size` and options **Small / Medium / Large / Extra Large** (values 4/5/6/7, default 5 = Medium) — `RichTextEditor.tsx:168-253`; toolbar aria-label is `Text formatting` — `RichTextEditor.tsx:164`; editor aria-label is `Text content` — `RichTextEditor.tsx:258`
   - Paste is forced to plain text (HTML is stripped to its text) — `RichTextEditor.tsx:85-98`
   - No character limit anywhere in the builder; the AI path caps `content` at 4000 chars — `src/agent/tools/sections.ts:67-71`
3. In-place editing on the block itself
   - Clicking the block in the builder opens the same editor; the edit row shows the type chip "Text" and the entry **"Edit text"**, replaced by a **"Done"** button while editing — `TextBlock.tsx:49-60`, `src/components/catalogue/cards/common/BlockControls.tsx:54-66`

### HTML allowed vs stripped
- Author HTML is filtered at render by the `text` sanitizer profile, inside `HtmlContent` — `src/components/general/HtmlContent.tsx:25-35`, `src/lib/html/sanitize.ts:177-183`
- Allowed tags: `p br hr div span section article h1-h6 strong b em i u s small sub sup mark ul ol li dl dt dd blockquote figure figcaption a img table thead tbody tfoot tr th td caption pre code` — `src/lib/html/sanitize.ts:59-104`
- Allowed attributes: `class style dir lang title aria-label role` on any tag; `href target rel name` on `a`; `src srcset alt width height loading decoding` on `img`; `colspan rowspan` on `td`; `colspan rowspan scope` on `th` — `sanitize.ts:109-117`
- Allowed URL schemes: `http https mailto tel`, plus `data:` on `img` only — `sanitize.ts:120-124`
- Links get `rel="noopener noreferrer"` added — `sanitize.ts:126-129`
- Stripped (allowlist, so nothing needs enumerating): `on*` handlers, `<script>`, `<form>`, `<svg>`, `<object>`, `<iframe>` (text profile) — `sanitize.ts:7-11`, `docs/architecture/catalogue-html-safety.md` ("The three that are filtered")
- Markdown is **not** supported in a text block. The Markdown parser in `src/lib/format/markdown.ts:1-11` is for AI chat messages only.

### Messages
- None of its own in view mode. Builder chip label "Text", edit entry "Edit text" — `TextBlock.tsx:51-54`; delete confirm as above.

---

## Divider

- Picker label: **"Divider"** (icon `SeparatorHorizontal`) — `SectionTypePicker.tsx:20`
- Header label: **"Divider"** — `BlockConfigHeader.tsx:23`
- Description, exact: **"Add a visual separator with customizable spacing and border styles."** — `BlockConfigHeader.tsx:34-35`
- What the customer sees: vertical space, optionally with a horizontal rule across the content column — `src/components/catalogue/sections/DividerBlock.tsx:35-52`
- **Gated**: needs `features.sections.divider === true` — `AddContentModal.tsx:111-112`, `pkg:helpers/plan-fit.ts:38`. Off on Starter, on from Basic up — `pkg:constants/pricing.ts:24-28,50-54,85-89,115-119,146-150,176-180`

### Fields, in form order
1. **Section name** — identical to the Text block's (same `BlockNameInput`, placeholder "e.g. Summer sale banner", same hint); optional, default `""`, saved as `undefined` when blank — `BlockConfigForm.tsx:96-100`, `AddContentModal.tsx:185`
2. **Vertical spacing** (slider)
   - Label **"Vertical spacing"**, min 0, max 10, step 0.5, value shown as `{n}rem` — `src/components/catalogue/inputs/DividerInput.tsx:45-53`
   - Default: `2` — `DividerInput.tsx:22`, `AddContentModal.tsx:42`
   - Rendered as `spacing / 2` rem above **and** below, i.e. 2 → 1rem top + 1rem bottom — `DividerBlock.tsx:44-48`
3. **Show a border line** (checkbox)
   - Label, exact: **"Show a border line"** — `DividerInput.tsx:56-67`
   - Default: checked (`isEnabled: true`) — `DividerInput.tsx:23-29`, `AddContentModal.tsx:44`
   - Unchecked → the four border fields disappear and only spacing remains — `DividerInput.tsx:69`
4. **Style** (select, shown only when the border is on)
   - Label **"Style"**; options **Solid / Dashed / Dotted** (values `solid`/`dashed`/`dotted`) — `DividerInput.tsx:71-86`
   - Default: `solid` — `DividerInput.tsx:25`, `AddContentModal.tsx:45`
5. **Thickness** (slider)
   - Label **"Thickness"**, min 1, max 10, step 1, value shown as `{n}px` — `DividerInput.tsx:88-96`
   - Default: `1` — `DividerInput.tsx:26,41`
6. **Colour** (colour swatch + hex text field)
   - Label **"Colour"** (British spelling) — `DividerInput.tsx:99`
   - Native colour input, aria-label **"Border colour picker"** — `DividerInput.tsx:105-113`
   - Hex text field: `maxLength={7}`, monospace, uppercase display, no autocomplete/spellcheck — `DividerInput.tsx:115-125`
   - Default: `#000000` — `DividerInput.tsx:27`, `AddContentModal.tsx:46`
   - No validation message: any string is accepted and passed straight to `borderTopColor` — `DividerBlock.tsx:39`
7. **Opacity** (slider)
   - Label **"Opacity"**, min 0, max 100, step 10, value shown as `{n}%` — `DividerInput.tsx:129-137`
   - Default: `100` — `DividerInput.tsx:28,40`
   - Applied as CSS `opacity` on the whole divider element — `DividerBlock.tsx:40`

- Required: nothing. The add button is always enabled for `divider` — `AddContentModal.tsx:208`
- Also editable in place: clicking the divider in the builder opens the same controls; chip label "Divider", edit entry **"Edit divider"**, "Done" to finish — `DividerBlock.tsx:60-81`
- Messages: none of its own.

---

## External content  (stored type `embedding`)

- Picker label: **"External content"** (icon `Globe`) — `SectionTypePicker.tsx:21`
- Header label: **"External content"** — `BlockConfigHeader.tsx:21`
- Description, exact: **"Embed external content such as maps, videos, or third-party widgets."** — `BlockConfigHeader.tsx:29-30`
- What the customer sees: whatever the pasted embed renders (an iframe is forced to 100% width, with a per-type minimum height: media/social 16:9 and min 300px, maps min 400px, booking min 500px, anything else min 400px) — `src/components/catalogue/sections/EmbeddingBlock.tsx:107-155`
- **Gated**: needs `features.sections.embedding === true` — `AddContentModal.tsx:113-114`; on from Pro up, off on Starter and Basic — `pkg:constants/pricing.ts:24-28,50-54,85-89`

### Fields, in form order
1. **Section name** — same `BlockNameInput` as above; optional; becomes the section's accessible name — `src/components/catalogue/inputs/EmbeddingInput.tsx:63-67`, `EmbeddingBlock.tsx:183`
2. **"What would you like to embed?"** (preset chips — a placeholder helper, not a stored field)
   - Fieldset legend, exact: **"What would you like to embed?"** — `EmbeddingInput.tsx:70-72`
   - Chips, in order, with their exact placeholder text for the code box:
     - **Maps** → `Go to Google Maps, click Share > Embed a map, and paste the <iframe> code here.`
     - **Booking** → `Copy the embed code from Calendly, OpenTable, or your booking provider and paste it here.`
     - **Media** → `Paste the embed code from YouTube, Vimeo, Spotify, or other media platforms.`
     - **Commerce** → `Paste payment buttons or product embeds from Stripe, Shopify, or PayPal.`
     - **Social Media** → `Go to Instagram, TikTok, or Twitter, click Share > Embed, and paste the code here. Example: TikTok videos and Instagram posts.`
     — `EmbeddingInput.tsx:20-56`
   - Default selection: **Maps** (first preset) — `EmbeddingInput.tsx:59`
   - The choice is **not stored**; it only swaps the textarea placeholder — `EmbeddingInput.tsx:109`
3. **Embed code** (textarea, required)
   - Label **"Embed code"** with a red `*` — `EmbeddingInput.tsx:99-104`
   - Monospace, min-height 180px, vertically resizable, spellcheck off — `EmbeddingInput.tsx:105-113`
   - Required: add/save disabled until `code.trim().length > 0` — `AddContentModal.tsx:204-205`. No error text; the rule is the disabled button plus the `*`.
   - Default: `""` — `AddContentModal.tsx:39`
   - No max length in the builder; the AI path caps `code` at 40000 chars — `src/agent/core/schemas.ts:7`, `src/agent/tools/sections.ts:72-76`

### HTML allowed vs stripped (the `embed` profile)
- Filtered at render through `HtmlContent` with `profile="embed"` — `EmbeddingBlock.tsx:203-207`, `src/lib/html/sanitize.ts:138-167`
- Everything the `text` profile allows, **plus** `iframe video audio source` — `sanitize.ts:107`
- `iframe` attributes allowed: `src width height allow allowfullscreen frameborder scrolling loading referrerpolicy sandbox` — `sanitize.ts:143-154`
- `video`: `src poster controls muted loop playsinline`; `audio`: `src controls loop`; `source`: `src type srcset media` — `sanitize.ts:155-157`
- **An iframe is kept only if its host is on the allowlist**, matched as the host itself or a `.host` suffix — `sanitize.ts:159-162`. Hosts: `google.com, maps.google.com, bing.com, mapbox.com, openstreetmap.org, yandex.com, youtube.com, youtube-nocookie.com, youtu.be, vimeo.com, dailymotion.com, twitch.tv, soundcloud.com, spotify.com, mixcloud.com, calendly.com, booking.com, expedia.com, hotels.com, airbnb.com, tripadvisor.com, hrs.de, agoda.com, stripe.com, paypal.com, gumroad.com, lemonsqueezy.com, ko-fi.com, buymeacoffee.com, paddle.com, facebook.com, instagram.com, twitter.com, x.com, tiktok.com, linkedin.com, reddit.com` — `sanitize.ts:14-57`
- Relative iframe URLs are refused, and an iframe left without a `src` is dropped whole rather than left as an empty frame — `sanitize.ts:163-166`
- **`<script>` is always discarded**, so script-based embeds (many social embeds) will not run; no script is re-created either — `EmbeddingBlock.tsx:179-180`, `docs/architecture/catalogue-html-safety.md` ("Because `<script>` is discarded…")
- Practical consequence for docs: a TikTok/Instagram "blockquote + script" embed will render only the static blockquote fallback. The TikTok/Instagram preset copy promises more than the sanitizer delivers (see **Contradictions**).

### Messages
| Text | Cause |
|---|---|
| `No embed code provided` | The block has an empty `code` — `EmbeddingBlock.tsx:210-213` |
- Builder chip label is **"Embed"**, not "External content" — `EmbeddingBlock.tsx:195`

---

## Custom visual  (stored type `custom_visual`)

- Picker label: **"Custom visual"** (icon `Sparkles`) — `SectionTypePicker.tsx:22`
- Header label: **"Custom visual"** — `BlockConfigHeader.tsx:22`
- Description, exact: **"Build a banner, animation or small interactive object with your own HTML, CSS and JavaScript."** — `BlockConfigHeader.tsx:31-32`
- What the customer sees: the author's own markup running inside a sandboxed iframe, transparent background, width 100%, height driven by the content — `src/components/catalogue/sections/CustomVisual.tsx:183-211`
- Starting frame height 200px, clamped at 5000px maximum — `CustomVisual.tsx:14-16,171`
- The frame inherits the catalogue's font plus `--catalogue-font-body` / `--catalogue-font-heading`; `img, video, iframe, table, canvas, svg` are capped at `max-width: 100%` — `CustomVisual.tsx:61-92,143-150`
- **Gated**: needs `features.sections.customVisual === true` — `AddContentModal.tsx:115-116`; on from Pro up — `pkg:constants/pricing.ts:85-89`
- Formerly called `custom_code`; renamed and migrated on 2026-10-25 — `.claude/skills/adding-new-content-block/SKILL.md` ("Renaming an existing block type")

### Fields, in form order
1. **Section name** — same `BlockNameInput`; optional; used as the iframe's `title`, falling back to **"Custom content"** — `src/components/catalogue/inputs/CustomVisualInput.tsx:16-20`, `CustomVisual.tsx:209`
2. **HTML code** (Monaco editor, required)
   - Field label: **"HTML code"** with a red `*` — `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:18-23`
   - Toggle button: **"Expand editor"** / **"Collapse editor"**; height 120px collapsed, 350px expanded — `CodeEditor.tsx:24-50`
   - Monaco: language `html`, font size 14, word wrap on, minimap off, aria-label `HTML code`, theme `vs-dark` — `CodeEditor.tsx:52-67`
   - Required: add/save disabled until `code.trim().length > 0` — `AddContentModal.tsx:206-207`
   - Default: `""` — `AddContentModal.tsx:39`
   - No max length in the builder; AI path caps at 40000 chars — `src/agent/core/schemas.ts:7`
   - Hint under the editor, exact: **"HTML, CSS and JavaScript for a banner, animation or small interactive object. It runs in an isolated frame, so analytics and tracking scripts will not work here - connect those under Analytics & tracking in the General tab."** — `CodeEditor.tsx:69-74`

### HTML allowed vs stripped
- **Nothing is stripped.** This is the one sink that is not sanitized; it is isolated instead, in an iframe with `sandbox="allow-scripts"` and **no** `allow-same-origin`, giving it an opaque origin — `CustomVisual.tsx:106-125,202-207`, `docs/architecture/catalogue-html-safety.md` ("The one that is isolated instead")
- Consequences the user feels: inline `<script>` runs, but the frame can reach no cookie, no storage, no parent DOM, and no credentialed request; analytics/tracking tags cannot work here (use the catalogue's Analytics & tracking setting instead) — `CustomVisual.tsx:106-125`, `CodeEditor.tsx:69-74`, `pkg:types/catalogue.ts:112-118`
- Verified in Chromium: `document.cookie`, `parent.document.title`, `localStorage.setItem` all throw; the widget's own inline script runs — `docs/architecture/catalogue-html-safety.md` (probe table)

### Messages
- No block-level message. Builder chip label **"Custom visual"** — `CustomVisual.tsx:196`. An empty/blank fragment just renders a 200px-tall transparent frame (no "nothing here" notice) — `CustomVisual.tsx:140,178-181`

---

## Legacy: Category and Container  (not in the picker)

- Old catalogues and cached drafts can still carry `type: "category"` or `type: "container"`; both are read as `items` — `pkg:types/catalogue.ts:89-104`, `src/lib/catalogue/content-blocks.ts:12-51`
- `category` → `items` with `showHeading: true`; `container` → `items` with `showHeading: false, isExpanded: true` — `src/lib/catalogue/content-blocks.ts:25-49`
- Normalization happens once, before anything matches on `block.type`, so a stored legacy row never renders blank — `src/components/catalogue/view/CatalogueContent.tsx:65-75`
- Nothing writes these keys any more — `.claude/skills/adding-new-content-block/SKILL.md` ("The item-bearing block")
- Not something an end user ever sees or chooses; relevant only if docs must explain an old catalogue.

---

## Section settings

- **Section name / heading** (items only, required) and **Show heading** / **Auto-expand**: see the Items block above — `ItemsBlockFields.tsx:31-80`
- **Layout**: items only, 4 options, changeable from the form or the section ⋯ menu — `ItemsBlockFields.tsx:82-93`, `BlockMenu.tsx:94-123`
- **No column count setting.** Columns come from the layout: `variant_1` and `variant_3` are 1 column on phones and 2 from `md`, `variant_2` is a wrapping flex row of ~45%-wide cards, `variant_4` is a swipeable carousel — `src/components/catalogue/sections/common/Items.tsx:16-29`, `src/components/catalogue/cards/TopImageCard.tsx:13`, `Items.tsx:129-187`
- **Visibility**: there is no per-section hide/show. The only visibility control is collapse, and only when the section has a heading — `ItemsSection.tsx:94`, `SectionHeader.tsx:40-54`
- **Collapse state**: `isExpanded` seeds the initial state on load; visitors toggle it per session and it is not persisted — `CatalogueContent.tsx:134-159`
- In edit mode every items section is shown expanded regardless of `isExpanded` — `ItemsSection.tsx:94` (`mode === "edit" || isExpanded`)
- While a search query is active, every matching section is force-expanded and non-matching sections are hidden entirely — `CatalogueContent.tsx:276-286`
- **Anchors**: each section renders with `id="{block.id}-{block.order}"`; the heading button gets `id="section-header-{that}"` and `aria-controls="section-content-{that}"` — `ItemsSection.tsx:67-68,106`, `SectionHeader.tsx:44-53`; text, divider, embed and custom-visual blocks use the same `{id}-{order}` pattern — `TextBlock.tsx:47`, `DividerBlock.tsx:58`, `EmbeddingBlock.tsx:185`, `CustomVisual.tsx:187`
- **Order**: sections render in array order; `order` is rewritten to the array index after every add/remove/move, and a new section is appended at the end — `src/context/CatalogueContext.tsx:107-108,191-229`
- **Section ⋯ menu** (edit mode): trigger aria-label/title `{name} options`, menu heading = the section name, then "Edit section" (or the block's own `editLabel`), "Layout" (items only), "Move up", "Move down", "Delete section" — `BlockMenu.tsx:49-159`
- Move up is disabled on the first section, move down on the last — `BlockMenu.tsx:130,136`, `CatalogueContent.tsx:287-288`
- Blocks with no heading of their own get an edit row above them with a type chip and the ⋯ menu — `src/components/catalogue/cards/common/BlockControls.tsx:30-78`
- **Type chips, exact**: `Items` (headless items section), `Text`, `Divider`, `Embed`, `Custom visual` — `ItemsSection.tsx:133`, `TextBlock.tsx:54`, `DividerBlock.tsx:65`, `EmbeddingBlock.tsx:195`, `CustomVisual.tsx:196`
- **Section count for plan limits counts every block**, text and dividers included; the catalogue heading is not a block — `pkg:helpers/plan-fit.ts:11-14`, `.claude/skills/adding-new-content-block/SKILL.md` ("The section count")

---

## Shared item fields

Form: `ItemModal` → `ItemInput` → `ItemDetails`, `ItemPricing`, `ItemImage`, in that order — `src/components/catalogue/inputs/ItemInput.tsx:21-32`

- Dialog title: **"Add item"** / **"Edit item"**; description is **"In {section name}"** when known, else **"Name, price and picture of the item."** — `src/components/catalogue/modals/ItemModal.tsx:98-105`
- Footer: **"Cancel"**, **"Add item & add another"** (shortened to **"Add another"** on phones, add mode only), **"Add item"** / **"Save item"** — `ItemModal.tsx:131-154`
- Save is disabled unless `name.trim()` is non-empty, `(isFree || price >= 0)`, and no image upload is in flight — `ItemModal.tsx:88-91`

### 1. Name — required
- Label **"Name"** with a red `*` — `src/components/catalogue/inputs/item/ItemDetails.tsx:21-26`
- Type: text; placeholder **`e.g. Pancakes`** — `ItemDetails.tsx:27-34`
- Default: `""` — `ItemModal.tsx:35-43`
- Max length: none in the UI; AI path caps at 120 chars, min 1 — `src/agent/core/schemas.ts:47`
- No validation message text; the rule shows as a disabled save button
- Empty is unreachable through the UI; a stored nameless item renders the card as `Invalid item data` — `src/components/catalogue/cards/index.tsx:53-65`
- Rendered as the card title, truncated to one line — `CardTitle.tsx:11-20`

### 2. Description — optional
- Label **"Description"** (no asterisk) — `ItemDetails.tsx:38`
- Type: textarea, min-height 84px, not resizable — `ItemDetails.tsx:39-45`
- Placeholder, exact: **`e.g. Pancakes with Nutella, cherries, and ice cream`** — `ItemDetails.tsx:43`
- Default: `""` — `ItemModal.tsx:35-43`
- Max length: none in the UI; AI path caps at 600 chars — `src/agent/core/schemas.ts:48`
- Empty → no description line on the card (an empty `<p>`), and the detail modal omits the description entirely — `CardDescription.tsx:15-24`, `ItemDetailModal.tsx:148-152`
- Clamped on cards: 3–4 lines (Side Image), 2–3 lines (Top Image), 2 lines (Text Only), 3–4 lines (Carousel) — `SideImageCard.tsx:33`, `TopImageCard.tsx:33`, `TextOnlyCard.tsx:25`, `CarouselCard.tsx:30`
- Plain text only, no HTML or Markdown — same evidence as above
- Searchable: visitor search matches name + description, accent- and case-insensitive, all terms must match — `src/lib/catalogue/items.ts:11-27`

### 3. Price, unit, Free, On sale — see **Price and currency**

### 4. Image — optional
- Field label: **"Image"** — `src/components/catalogue/inputs/item/ItemImage.tsx:38-43`
- Two tabs: **"Upload"** (default) and **"URL"** — `ItemImage.tsx:22,44-59`
- Not shown at all when the section layout is **Text Only** (`variant_3`) — `ItemImage.tsx:29`
- **URL tab**: single text input, `type="url"`, aria-label **"Image URL"**, placeholder **`https://example.com/image.jpg`**; once a URL is present the preview/dropzone appears under it — `ItemImage.tsx:70-89`
- **Upload tab** (`ImageDropzone`):
  - Dropzone label: **"Choose a file or drag it here"** — `src/components/general/ImageDropzone.tsx:216-222`
  - Allowed-content line, exact: **"PNG, JPG or WebP, up to 50 MB. We resize it for you."** — `ImageDropzone.tsx:11-18,244-252`
  - Accepts any raster image the browser can decode up to 50 MB; **SVG is refused** — `ImageDropzone.tsx:11-18,65-78`
  - The file is resized to max 1024px on the long side and recompressed to WebP under 1200 KB in the browser before upload — `ItemImage.tsx:62-68` (no overrides → defaults), `ImageDropzone.tsx:48-49`, `src/lib/images/processing.ts:65-155`
  - Upload endpoint `imageUploader`: `maxFileSize: "4MB"`, `maxFileCount: 1` (one image per item) — `src/app/api/items/uploadthing/core.ts:11-19`; the browser-side resize is why that limit is never hit — `ImageDropzone.tsx:13-18`
  - Upload happens from the browser to UploadThing; the server route only authorizes it — `src/app/api/items/uploadthing/core.ts:22-32`
  - Uploading state shows a spinner with aria-label **"Uploading"** and blocks saving the item — `ImageDropzone.tsx:20-26`, `ItemModal.tsx:91`
  - Preview: 192×192 box with a remove button, aria-label **"Remove image"**; removing sets `image: ""` — `ImageDropzone.tsx:168-199`, `ItemImage.tsx:66`
- Default: `""` — `ItemModal.tsx:35-43`
- Empty → the card shows the shared placeholder image `DEFAULT_IMAGE` — `src/components/catalogue/cards/index.tsx:79-84`, `pkg:constants/catalogue.ts:194-195`; the item detail modal instead shows **no** photo area and no enlarge button — `ItemDetailModal.tsx:51-52,99-106`
- `DEFAULT_IMAGE` and the old Unsplash-miss URL count as "no photo of its own" — `src/lib/catalogue/item-image.ts:4-18`
- A broken image URL falls back to that same placeholder — `src/components/general/OptimizedImage.tsx:40-51`
- Card alt text: `Image of {item name}` — `SideImageCard.tsx:19`, `TopImageCard.tsx:20`, `CarouselCard.tsx:17`; in the detail modal the alt is the item name — `ItemDetailModal.tsx:71`

#### Exact image error messages
| Text | Cause |
|---|---|
| `Please select a valid image file` | File MIME type does not start with `image/` — `ImageDropzone.tsx:65-67` |
| `File is too large. Please select a smaller image` | File larger than 50 MB — `ImageDropzone.tsx:69-71` |
| `SVG images aren't supported here. Please upload a PNG or JPG.` | `image/svg+xml` — `ImageDropzone.tsx:73-78` |
| `Failed to load image: {filename}` | The browser could not decode the file — `src/lib/images/processing.ts:15` |
| `Processed image size ({n}KB) exceeds maximum allowed size of 1200KB` | Still too big after 8 compression passes — `src/lib/images/processing.ts:137-141` (with `targetSizeKB` = 1200 from `ImageDropzone.tsx:49`) |
| `Failed to process image` | Fallback when the thrown error has no message — `ImageDropzone.tsx:114-117` |
| `No URL received from upload service` | Upload finished with no URL (reported to Sentry, not toasted) — `ImageDropzone.tsx:132-136` |
| `Unauthorized` | Not signed in, refused server-side before the upload — `src/app/api/items/uploadthing/core.ts:24-25` |
| `Too many uploads, try again later` | Upload rate limit hit — `src/app/api/items/uploadthing/core.ts:26-28` |
- All messages are shown as a toast unless the caller passes its own `onError`; item uploads use the toast — `ImageDropzone.tsx:107-117`, `ItemImage.tsx:62-68`

### Fields that do NOT exist
- No **tags**, **badges** or **link/URL** field on an item. `Item` is exactly `id, order, name, description, image, isFree?, discount?, price, denominator?` — `pkg:types/catalogue.ts:149-159`
- The only badge-like thing is the automatic discount corner badge (see below). `catalogue.tags` exists at catalogue level — `pkg:constants/catalogue.ts:96` — but no UI in the inputs folder writes it (grep for `tags` under `src/components/catalogue/inputs` returns nothing).

### What the customer can do with an item
- Tapping a card opens a detail modal (bottom sheet under 720px) with the photo, section-name pill, name, description, price and a **"Close"** button; the photo has **"Enlarge photo"** → full-screen viewer with **"Close photo"** — `src/components/catalogue/cards/index.tsx:110-117`, `ItemDetailModal.tsx:29-30,81-97,155-166`, `src/components/catalogue/modals/ItemPhotoViewer.tsx:19-42`

---

## Price and currency

### Entry (`ItemPricing`)
- **Price ({CUR})** — label interpolates the catalogue's currency **code**, e.g. "Price (EUR)" — `src/components/catalogue/inputs/item/ItemPricing.tsx:144`
- Type: text input with `inputMode="decimal"`; keystrokes are filtered by `/^\d*\.?\d{0,2}$/`, so digits plus at most 2 decimals, no minus sign, no thousands separator, no comma decimal — `ItemPricing.tsx:60-64,146-155`
- Default: `0`, displayed as an empty field — `ItemModal.tsx:35-43`, `ItemPricing.tsx:34-36`
- Empty field is stored as `0` — `ItemPricing.tsx:72-75` (`parseFloat("") || 0`)
- Blurring with a typed `0` flips the item to **Free** and clears any discount — `ItemPricing.tsx:125-130`
- **Price unit** (select next to the price) — aria-label **"Price unit"**, placeholder **"Unit"**; options, exact labels: **none, kg, g, l, ml, pcs, portion**; `none` stores `undefined` — `ItemPricing.tsx:23-31,156-179`
  - Default: `none` — `ItemPricing.tsx:164`
  - Shown after the price as ` / {unit}` — `src/components/catalogue/cards/common/PriceDisplay.tsx:23,41,62`; in the detail modal as `/ {unit}` on its own line — `ItemDetailModal.tsx:213-217`
  - AI path caps the unit at 30 chars and is free-text there, e.g. "hour" — `src/agent/core/schemas.ts:55-60`
- **Free** (checkbox) — label **"Free"**; checking it sets `price: 0` and disables the price and unit fields — `ItemPricing.tsx:184-198,148,157`
- **On sale** (checkbox) — label **"On sale"**; disabled while Free is on — `ItemPricing.tsx:200-209`
  - Turning it on seeds `{ isOnDiscount: true, discountPercentage: 0, discountedPrice: <current price> }` — `ItemPricing.tsx:107-123`
  - **Sale price ({CUR})** with a red `*` — same digit filter as the price — `ItemPricing.tsx:216-230`
  - **Percentage** with a red `*` and a `%` suffix inside the field, `inputMode="numeric"` — `ItemPricing.tsx:233-257`
  - The two are linked: typing a sale price recomputes the percentage (rounded), typing a percentage recomputes the sale price (2 dp) — `ItemPricing.tsx:77-105`
  - Neither is actually enforced: `isFormValid` ignores them — `ItemModal.tsx:88-91`
  - Blurring with 100% or a sale price of 0 turns the item **Free** and clears the discount — `ItemPricing.tsx:132-138`

### Formatting and display
- Whole amounts print without decimals, anything else with exactly two: `10`, `9.50` — `src/lib/catalogue/item-price.ts:14-20`
- The number is formatted with the catalogue's locale, derived from `catalogue.language` (`eng → en-US`, `deu → de-DE`, … default `en-US`) — `src/lib/catalogue/items.ts:64-104`, `src/components/catalogue/view/Catalogue.tsx:271`
- The **symbol** (not the code) is shown on cards: `getCurrencySymbol(code)` via `Intl` — `src/lib/format/price.ts:36-46`, `src/components/catalogue/sections/common/Items.tsx:147,194`
- Price `0` renders as the word **"Free"** with no currency symbol — `src/components/catalogue/cards/index.tsx:69-84`, `src/lib/catalogue/item-price.ts:33-34`
- An item whose `price` is `undefined`/`null` renders **no price row at all** — `PriceDisplay.tsx:25-28`, `item-price.ts:31` ("a service list or an 'ask us' menu")
- On sale, the card strikes through the list price and shows the sale price; `variant_1` lays the two out side by side, the others stack them right-aligned — `PriceDisplay.tsx:30-64`
- A red triangular corner badge shows `{n}%`, but only when `discountPercentage` is truthy — `src/components/catalogue/cards/common/BaseCard.tsx:52-58`, `DiscountBadge.tsx:25-44`; it sits top-left on most cards and top-right/small on Text Only — `TextOnlyCard.tsx:13-15`
- Price aria-label on cards: `Price: {amount} {currency}{ / unit}` — `PriceDisplay.tsx:37,55`
- Detail modal shows `Was {original} {cur}` (screen-reader "Was "), a `−{n}%` pill, then the amount — `ItemDetailModal.tsx:191-219`

### Currency choice
- One currency per catalogue, not per item or per section: `catalogue.currency` — `pkg:constants/catalogue.ts:9`
- Chosen in the builder sidebar under **General information** → label **"Currency"**, placeholder **"Select currency"** — `src/components/catalogue/inputs/CurrencySelect.tsx:16-24`, `src/components/catalogue/inputs/sidebar/GeneralTab.tsx:51-57`
- 156 currencies, listed as `CODE → full name` (e.g. `EUR → Euro`, `USD → United States dollar`), each carrying a locale and a derived symbol — `src/constants/index.ts:52-216` (156 entries), `pkg:types/general.ts:121-126`
- **Default currency: `EUR`** — `pkg:constants/catalogue.ts:9`
- The neighbouring **Language** select (same panel) is what changes number formatting — `src/components/catalogue/inputs/LanguageInput.tsx:16-32`, `src/constants/ocr.ts:10-30`

---

## Catalogue heading (not a block)

Included because it is the one other author-HTML field on the page and it blocks publishing.

- Inline editor above the content, placeholder **"+ Add Heading"**, aria-label **"Catalogue heading"** — `src/components/catalogue/inputs/heading/EditableHeading.tsx:6,72`
- Floating toolbar aria-label **"Heading formatting"** with **Bold**, **Italic** and a size select (aria-label **"Heading size"**) offering **Small / Medium / Large / Extra Large** — `src/components/catalogue/inputs/heading/FormattingToolbar.tsx:18-23,54,92-94`
- Default size: `large` — `src/components/catalogue/inputs/heading/useHeadingEditor.ts:15`, `src/lib/catalogue/heading.ts:6`
- Hard limit **100 characters** of text, counted live as `{n}/{100}` (turns red at the limit) and enforced on typing and pasting — `src/lib/catalogue/heading.ts:4`, `src/components/catalogue/inputs/heading/CharacterCount.tsx:19-22`, `useHeadingEditor.ts:128-145,199-211`
- At most 2 line breaks — `useHeadingEditor.ts:188-197`
- Stored as one `<h1 …>` with a `data-size`, and rendered through the `text` sanitizer profile — `src/lib/catalogue/heading.ts:19-22`, `docs/architecture/catalogue-html-safety.md` (sink table)
- Over the limit, formatting is dropped rather than cut mid-tag — `src/lib/catalogue/heading.ts:49-59`

---

## Plan gating and limits (what the user hits)

- Gated block types and their flags: `divider → sections.divider`, `embedding → sections.embedding`, `custom_visual → sections.customVisual`; `items` and `text` are never gated — `pkg:helpers/plan-fit.ts:33-41`, `src/lib/catalogue/operations.ts:67`
- Flags are read as `=== true`, so a tier that omits one does not get the block — `AddContentModal.tsx:109-120`, `pkg:helpers/plan-fit.ts:80-84`
- Per-tier limits (`sections_per_catalogue` / `items_per_catalogue` / divider / embedding / customVisual) — `pkg:constants/pricing.ts`:
  | Plan | Sections | Items | Divider | External content | Custom visual |
  |---|---|---|---|---|---|
  | Starter (id 0) | 5 | 15 | no | no | no | (`:23-33`) |
  | Basic (id 1) | 8 | 30 | yes | no | no | (`:50-63`) |
  | Pro (id 2) | 15 | 100 | yes | yes | yes | (`:85-94`) |
  | Growth (id 3) | 30 | 200 | yes | yes | yes | (`:115-125`) |
  | Premium (id 4) | 50 | 300 | yes | yes | yes | (`:146-156`) |
  | German Silva Custom Plan (id 5) | 20 | 200 | yes | yes | yes | (`:176-187`) |
- Section count = number of blocks of any type — `pkg:helpers/plan-fit.ts:11-14`; item count = items inside items blocks — `pkg:helpers/plan-fit.ts:16-26`
- **Locked type** → the form is covered by an overlay: heading **"Upgrade required"**, body **"Upgrade your plan to unlock this feature."**, button **"Upgrade now"** — `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:32-49`
- **Out of section slots** → the add is refused and a different modal opens (feature "Sections"), description: `Better organization drives more sales. Upgrade to create {n} categories and help customers find exactly what they need.` — `AddContentModal.tsx:123-146,266-272`, `src/components/modals/limits/limitContent.ts:128-139`
- **Out of item slots** → same modal for "Items": `Showcase your complete product range! Upgrade to add up to {n} items per catalogue and never miss a sales opportunity.` — `CatalogueContent.tsx:215-228,404-425`, `limitContent.ts:116-127`
- The item limit is re-checked on every "Add item & add another" — `CatalogueContent.tsx:204-212`

### Before publishing
- **Publish** and **Preview** are disabled until the catalogue has at least one block, a name, and a non-empty heading — `src/components/catalogue/builder/useBuilderActions.ts:75-78,166-181`
- Server refuses a publish that does not fit the plan, with `Remove {…} to fit the {plan} plan.` — `src/lib/entitlements/plan.ts:77-97`, `pkg:helpers/plan-fit.ts:92-111`
- Server also refuses when this month's traffic limit is reached: `This month's traffic limit for your plan is reached` — `src/lib/entitlements/plan.ts:90-95`
- Growth-only save rules: `Your plan allows {n} sections per catalogue`, `Your plan allows {n} items per catalogue`, `{Label} sections are not part of your plan` — `src/lib/entitlements/plan.ts:128-166`; a downgraded owner keeps and can edit what they had, but cannot add more — `src/lib/entitlements/plan.ts:148-156`
- Save/publish toasts: `Saving...` / `Catalogue saved successfully` / `Failed to save catalogue`; `Publishing...` / `Catalogue published successfully`; `Updating...` / `Catalogue updated successfully` (with a **View** action); `Please save the catalogue first`; `Catalogue has no name/slug` — `useBuilderActions.ts:53-140`

### AI assistant messages about blocks (same vocabulary, different surface)
- `{Label} sections are not part of your plan.` — `src/lib/catalogue/operations.ts:238-243`
- `Your plan allows {n} sections in the whole catalogue and it already has {m}, so the section was not added.` — `operations.ts:245-251`
- `{n} item(s) were left out: your plan allows {limit} items in the whole catalogue.` — `operations.ts:122-123`
- `{Label} sections are not part of your plan, so this one cannot be edited. It can be deleted.` — `operations.ts:290-299`
- Default names the assistant uses when none is given: items → `New section`, text → `<p>New text block</p>`, divider → spacing 2 with a 1px solid `#000000` 100% border — `operations.ts:136-195`

### Templates (what a new catalogue starts with)
- Three choices: **Quick Start** (badge **Recommended**, "Everything you need to start selling right away", details "2 categories", "6 items"), **Standard Catalog** ("A flexible layout that works for everyone", "4 categories", "15 items"), **Start from Scratch** ("Build your catalog exactly the way you want it", "Blank Catalogue") — `src/components/catalogue/inputs/TemplatesInput.tsx:32-65`
- Button **"Select template"**; replacing existing content asks: title **"Change template?"**, body **"This will change your existing content. Please save it first to not lose progress."**, actions **Cancel** / **Save & continue** — `TemplatesInput.tsx:193-222`
- Both filled templates contain only `items` blocks — `src/constants/catalogueTemplates.ts:26,97,153,194,265,310,366`; each applied copy gets fresh ids and 0-based order — `catalogueTemplates.ts:4-22`

---

## Contradictions

- **"External content" vs "Embed".** The picker and plan tables say **External content** (`SectionTypePicker.tsx:21`, `BlockConfigHeader.tsx:21`, `pkg:helpers/plan-fit.ts:39`), but the builder chip on the block and the assistant's label say **Embed** (`EmbeddingBlock.tsx:195`, `src/lib/catalogue/operations.ts:96`). The block-authoring skill explicitly requires these to match — `.claude/skills/adding-new-content-block/SKILL.md` (step 2).
- **Social embeds are promised but cannot run.** The Social Media preset tells the user to paste Instagram/TikTok/Twitter embed code (`EmbeddingInput.tsx:49-55`), and `EmbeddingBlock` even styles `blockquote` embeds (`EmbeddingBlock.tsx:134-145`), but the sanitizer discards `<script>` (`src/lib/html/sanitize.ts:7-11,107`), which is how those embeds hydrate. Only an allowlisted `<iframe>` works — `sanitize.ts:159-162`.
- **A blank price shows as "Free".** The builder stores an empty price field as `0` (`ItemPricing.tsx:72-75`) and the card prints `0` as the word "Free" (`src/components/catalogue/cards/index.tsx:69-77`, `src/lib/catalogue/item-price.ts:33-34`). The "no price at all" path (`PriceDisplay.tsx:25-28`, `item-price.ts:31`) is unreachable from the builder and from the AI (`operations.ts:125-134` defaults `price` to 0) — only older stored rows can have it.
- **Card vs detail modal disagree about a bad discount.** `PriceDisplay` shows `discount.discountedPrice` whenever `isOnDiscount` is set, even if it is `0` or higher than the list price (`PriceDisplay.tsx:21-22`), while `getItemPrice` (used by the detail modal) falls back to the list price unless `0 < sale < price` (`src/lib/catalogue/item-price.ts:37-43`). Turning "On sale" on and saving without touching the fields leaves `discountedPrice = price, percentage = 0`: the card then prints the price twice (struck through and not) and the modal prints it once.
- **Sale fields are marked required but are not enforced.** "Sale price" and "Percentage" both carry a red `*` (`ItemPricing.tsx:216-221,233-238`) yet `isFormValid` only checks name, price and upload state (`ItemModal.tsx:88-91`).
- **Builder has no length limits, the assistant does.** Item name 120 / description 600 / unit 30, text content 4000, embed & custom-visual code 40000, section name 120 — `src/agent/core/schemas.ts:7,47-60`, `src/agent/tools/sections.ts:52-76`. None of these are applied to the equivalent builder fields (no `maxLength` anywhere in `src/components/catalogue/inputs` except the hex colour fields and the sidebar's tagline/search placeholder).
- **UI gating is not the control.** `AddContentModal.isLocked` returns `false` outright when the plan object has no `features.sections` (`AddContentModal.tsx:107`); the authoritative checks are server-side in `src/lib/entitlements/plan.ts:148-166` and `src/lib/entitlements/plan.ts:77-97`.
- **"Auto-expand" is advisory.** It is ignored in the builder (always expanded — `ItemsSection.tsx:94`) and overridden while a visitor is searching (`CatalogueContent.tsx:286`).
- **Divider spacing reads as half.** The slider says e.g. `2rem` (`DividerInput.tsx:52`) but the value is split into `1rem` above and `1rem` below (`DividerBlock.tsx:45-47`), so total spacing equals the number shown — the per-side figure is half of it.
- **Upload limits are stated three different ways.** The dropzone says 50 MB (`ImageDropzone.tsx:11-18`), the processor refuses anything still over 1200 KB after compression (`src/lib/images/processing.ts:137-141`), and the upload route caps at 4 MB (`src/app/api/items/uploadthing/core.ts:17`). Only the 50 MB figure is user-facing.
- **"Images" are described as "PNG, JPG or WebP" but any decodable raster is accepted** except SVG — `ImageDropzone.tsx:65-78` only rejects non-`image/*` and `image/svg+xml`.

---

## Could not confirm

- **No validation message strings exist for required fields.** Every "required" rule in these forms is expressed as a disabled button plus a red `*` (`AddContentModal.tsx:200-209`, `ItemModal.tsx:88-91`). I found no inline error text for section name, embed code, custom-visual code, item name, sale price or percentage. If the docs need "the exact validation message", the honest answer is that there is none.
- **Divider colour accepts any string.** `maxLength={7}` is the only constraint (`DividerInput.tsx:119`); I found no hex validation or error for this field, and the value is passed straight to CSS (`DividerBlock.tsx:39`). What a browser does with `#12` is undefined by the code.
- **Percentage field has no numeric bounds.** Unlike the price it has no input filter (`ItemPricing.tsx:244-248`); whether a user can type `-10` or `500` and what the badge then shows is not constrained anywhere I read. `?`
- **Catalogue `tags`.** The field exists on the type and the default catalogue (`pkg:constants/catalogue.ts:96`) but I found no input component writing it, so I cannot say whether it is user-visible at all. `?`
- **Exact OCR / AI-created defaults for items** beyond `toItem` (`operations.ts:125-134`) were not traced; the import flow was out of scope.
- **The `discount` object on template items** is written as `{isOnDiscount:false, discountPercentage:0, discountedPrice:0}` (`src/constants/catalogueTemplates.ts:43-48`), whereas the builder sets `discount: undefined` when "On sale" is off (`ItemPricing.tsx:117-122`). Both render the same today, but I did not verify every consumer. `?`
- **Whether a visitor's collapse state is remembered** across page loads: I found only component state seeded from `isExpanded` (`CatalogueContent.tsx:134-159`) and no persistence, but I did not search for a cookie/localStorage layer elsewhere. `?`
