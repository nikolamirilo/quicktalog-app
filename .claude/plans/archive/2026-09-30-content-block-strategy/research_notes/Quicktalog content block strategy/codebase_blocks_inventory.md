# Quicktalog content blocks: codebase inventory (state as of 2026-09-30)

Audited 2026-09-30/10-01, read-only, against `quicktalog-app` branch `test` at `d785bb8`, `quicktalog-packages` 1.66.0 at `7a2ca85` (the app's installed `node_modules/@quicktalog/common` is also 1.66.0 and its `dist` matches `src`), and `quicktalog-backend` at `133512e`.

**How to read the citations.** `app:` = `quicktalog-app/`, `pkg:` = `quicktalog-packages/`, `be:` = `quicktalog-backend/`. The format is `repo:path:lines`. "TEST SQL" means a read-only SELECT on Supabase project `imhinsgyzzyblghwnedk`. "Showcase parse" means the public HTML of the 7 showcase URLs listed in `app:src/constants/marketing.ts:7-16`, downloaded with curl and parsed locally. Only aggregate numbers were kept. PROD (`uhfbapjuzvlyzyodxhqn`) was never queried.

---

## Q1. What each content block is today: data shape, editor, renderer, variants, defaults, and what it can and cannot do

### Takeaway
There are **5 writable block types**: `items`, `text`, `divider`, `embedding` and `custom_code`. Two **deprecated keys**, `category` and `container`, are still in the union and are turned into `items` when read. Blocks share only `{id, order}`. There is no block registry. `items` is the only block with structured data. `text` is a thin `contentEditable` over HTML. `divider` is an empty styled `<div>`. The page is a flat list with no nesting, columns, anchors or per-block presentation settings.

### Cited Findings
**Shared plumbing**
- `BaseContentBlock` is `{ id: string; order: number }` and nothing else. There is no visibility, anchor, width, background, padding or device field. - `pkg:src/types/catalogue.ts:46-49`
- The union is `ItemsBlock | CategoryBlock | ContainerBlock | EmbeddingBlock | CustomCodeBlock | TextBlock | DividerBlock`. `AnyItemsBlock` is `items` plus the two legacy keys. - `pkg:src/types/catalogue.ts:114-124`
- The legacy keys are normalized on read:
  - `category` becomes `items` with `showHeading: true`, and `isExpanded` is kept.
  - `container` becomes `items` with `showHeading: false` and `isExpanded: true`.
  - The helpers are `isItemsBlock`, `normalizeBlock`, `normalizeContent` and `asItemsBlock`. - `app:src/lib/catalogue/content-blocks.ts:12-64`
  - Stored rows are rewritten by `app:supabase/migrations/20260926130000_merge_category_container_into_items.sql:1-40`.
- Rendering is a hand-written if/else chain:
  - `items` renders `ItemsSection`, `embedding` renders `EmbeddingBlockComponent`, `custom_code` renders `CustomCodeBlockComponent`, `text` renders `TextBlockComponent`, and `divider` renders `DividerBlockComponent`.
  - Any other type renders `null`. - `app:src/components/catalogue/view/CatalogueContent.tsx:237-373`
- **No registry exists.** `BLOCK_DEFINITIONS`, `BLOCK_COMPONENTS` and `BlockDefinition` have zero matches in app `src/`, `tests/` or package `src/` (grep, 2026-09-30).
- The only DB guard on `content` is a size cap, `pg_column_size(content) < 1048576`. - `app:supabase/migrations/20260921181103_integrity_constraints_ai_ledger.sql:26-27`, validated at `…20260921181107_validate_after_audit.sql:6`. The block shape is never validated anywhere (see Q5).
- Section DOM ids are built as `${block.id}-${block.order}`, so they change on every reorder.
  - Sites: `app:src/components/catalogue/sections/ItemsSection.tsx:69`; text and divider set an id in edit mode only (`TextBlock.tsx:47`, `DividerBlock.tsx:58`); the React keys and expand state also use it (`CatalogueContent.tsx:117,238,262`).
  - Nothing consumes these ids. The only `scrollIntoView` in catalogue code is in `AppearanceTab.tsx:59`.

**`items`, the only item-bearing block**
- **Shape:** `{type:"items", name: string, showHeading: boolean, isExpanded: boolean, layout: ContentLayout, items: Item[]}`.
  - `name` is always stored but is shown as the heading only when `showHeading` is true.
  - `isExpanded` is the initial state and matters only when a heading exists. - `pkg:src/types/catalogue.ts:64-77`
  - `ContentLayout` is `variant_1`…`variant_4`. - `pkg:src/types/enums.ts:18-22`
- **Add and edit dialog (`ItemsBlockFields`):**
  - Heading (required). The label reads "Section name" when the heading is hidden, with the hint *"Used to identify this section when moving items. Not visible to end users."*
  - Switch "Show heading above the items".
  - Switch "Auto-expand on page load", shown only when the heading is on.
  - `LayoutPicker`: 4 drawn SVG tiles labelled Side Image, Top Image, Text Only, Carousel. - `app:src/components/catalogue/modals/content/ItemsBlockFields.tsx:22-92`, `LayoutPicker.tsx:14-199`, labels from `pkg:src/constants/general.ts:75-104`
- **Manual defaults:** name `""`, layout `variant_1`, `showHeading` true, `isExpanded` true, items `[]`. The name is required even when the heading is hidden. - `app:src/components/catalogue/modals/AddContentModal.tsx:34-52,208-211`
- **AI defaults:** name "New section", `showHeading` true, `isExpanded` always true, layout `variant_1`. - `app:src/lib/catalogue/operations.ts:131-140`
- **Renderer:**
  - The heading is `SectionHeader`, a full-width gradient `<button>` sized `text-xl`→`md:text-3xl` with a chevron. It is **always a collapse toggle**; there is no static visible heading.
  - In edit mode the section is always expanded. A section without a heading is always open and gets a dashed frame and an "Items" toolbar in the builder. - `app:src/components/catalogue/sections/common/SectionHeader.tsx:5-6,40-122`, `ItemsSection.tsx:96-164`
- **Paging:** 20 items render first, then a "Show more (N remaining)" button adds 20 at a time. - `app:src/lib/catalogue/items.ts:4-5`, `app:src/components/catalogue/sections/common/Items.tsx:101-107,236-248`
- **"Add New Item" tile:** a dashed tile shown last, in edit mode only. - `Items.tsx:36-58,179-186,226-231`
- **What it cannot do:**
  - No section subtitle or description line.
  - No section image or banner.
  - No column or density control beyond the 4 layouts.
  - No sort or filter.
  - Search looks only at item `name` and `description`, only in view mode, and only when the catalogue has more than 20 items. - `CatalogueContent.tsx:83-86`, `items.ts:7,25-30`

**`text`**
- **Shape:** `{type:"text", name?: string, content: string /* HTML */}`. - `pkg:src/types/catalogue.ts:108-112`
- **Add:**
  - The dialog shows `BlockNameInput`: "Section name", optional, with the hint *"Not shown on the page"*.
  - Below it sits `RichTextEditor` in light mode. - `app:src/components/catalogue/modals/content/BlockConfigForm.tsx:69-92`, `app:src/components/catalogue/inputs/BlockNameInput.tsx:21-39`
  - Empty content is allowed and is saved as the literal `<p>New text block</p>`. - `AddContentModal.tsx:183-188,216`
- **Edit:**
  - Editing is **inline only**: the pencil, or a click on the text, swaps in an in-place `RichTextEditor` with `themeMode="catalogue"`. - `app:src/components/catalogue/sections/TextBlock.tsx:43-77`
  - `CatalogueContent` passes no `onEdit` to text blocks, so they never open the dialog and **the name cannot be changed after creation**. - `CatalogueContent.tsx:332-351`
- **View:**
  - Markup is `<section aria-label={name}>` wrapping sanitized `HtmlContent` (`.rich-text-content`). - `TextBlock.tsx:35-41`, `app:src/components/general/HtmlContent.tsx:29-35`
  - The default body size is `clamp(1.25rem, 2.5vw + 0.75rem, 1.5rem)` with line-height 2rem, noted as "matches font[size="5"] Medium". - `app:src/styles/other.css:92-100`
- **AI default content** is also `<p>New text block</p>`. - `operations.ts:141-147`
- The toolbar and sanitizer are covered in Q3.

**`divider`**
- **Shape:** `{type:"divider", name?: string, spacing: number /* rem */, border?: {isEnabled, style?: "solid"|"dashed"|"dotted", thickness?: number /* px */, color?: string, opacity?: number /* 0-100 */}}`. - `pkg:src/types/catalogue.ts:51-62`
- **Editor (`DividerInput`):**
  - "Vertical spacing" slider, 0–10rem in steps of 0.5.
  - "Show a border line" checkbox.
  - Style select: Solid, Dashed, Dotted.
  - Thickness, 1–10px.
  - Colour: a native colour picker plus a hex input.
  - Opacity, 0–100 in steps of 10. - `app:src/components/catalogue/inputs/DividerInput.tsx:45-139`
- **Defaults (manual and AI are identical):** spacing 2, border `{isEnabled: true, solid, 1px, #000000, 100}`. - `AddContentModal.tsx:40-49`, `operations.ts:162-175`, `DividerInput.tsx:22-29`
- **View:** a bare `<div class="w-full" style={margins + borderTop}>`. It is not an `<hr>`, has no role, and drops the name. - `app:src/components/catalogue/sections/DividerBlock.tsx:35-52`
- **Edit:** inline `DividerInput`; the name cannot be edited after creation. - `DividerBlock.tsx:54-88`, `CatalogueContent.tsx:352-371`
- **Theme fit:** the default colour is hardcoded black, not a theme token. 3 of the 7 standard themes (elegant, modern, creative) are dark. - `pkg:src/constants/general.ts:28-64`

**`embedding` (summary only)**
- **Shape:** `{type:"embedding", name?, code: string}`. - `pkg:src/types/catalogue.ts:96-100`
- **Picker:** labelled "External content" with a Globe icon.
- **Dialog:** 5 "presets" (Maps, Booking, Media, Commerce, Social Media) that only swap the textarea placeholder; nothing preset is stored. - `app:src/components/catalogue/inputs/EmbeddingInput.tsx:20-59,99-110`
- **Rendering:** sanitized with the `embed` profile, which is the text tags plus `iframe`, `video`, `audio` and `source`.
  - `<iframe>` is allowed only from **37 allowlisted hosts**.
  - There is no `<script>`. - `app:src/lib/html/sanitize.ts:14-57,107,138-167`
- **Aspect ratio** is guessed by URL regex into 6 categories. - `app:src/components/catalogue/sections/EmbeddingBlock.tsx:10-40`
- **Plan gate:** `features.sections.embedding`.

**`custom_code` (summary only)**
- **Shape:** `{type:"custom_code", name?, code}`. - `pkg:src/types/catalogue.ts:102-106`
- **Dialog:** a name field plus the Monaco `CodeEditor`. - `app:src/components/catalogue/inputs/CustomCodeInput.tsx:13-28`
- **Rendering:** a `sandbox="allow-scripts"` iframe built by `buildWidgetDocument`. Height is reported by postMessage and capped at 5000px. - `app:src/components/catalogue/sections/CustomCode.tsx:16-19,61-89,107-134`
- **Plan gate:** `features.sections.customCode`.

### Inferences
- Structurally, the page is one item-section type plus three escape hatches (text, embed, code) and a styled spacer. Anything that is not a priced list has to become prose in a text block or third-party/custom code on higher plans. That covers intro, hours, contact, FAQ, promo, team and gallery content.
- A text or divider name can be set only at creation and is never shown on the page. It adds friction for little visible value; its only uses are screen-reader naming and identifying the block to the builder and the AI.
- Dividers are black by default, and the AI cannot change a divider's colour (Q6). On the 3 dark themes the AI therefore produces a low-visibility rule. This is inferred from the code, not observed on a page.

### Gaps
- Whether PROD rows were migrated to `items` is unverified. The public showcase data still carries `type:"category"` (Q9).
- No end-to-end test covers adding any section type. `tests/e2e/` contains only auth and create-catalogue specs.

---

## Q2. The Item model, the 4 card layouts, the item detail modal, the "no price" rule, and content that is impossible or awkward to express

### Takeaway
An `Item` is `name, description, image, price` plus an optional free flag, discount and unit. The old render guard that rejected items without a price was removed on 2026-09-26, but **no authoring path can create an unpriced item**:
- The manual editor turns an empty price into `0`.
- The AI defaults a missing price to `0`.
- The card renders `price === 0` as **"Free"**.

So "on request", "from €30" and durations are not expressible, and any item without a price reads as "Free". The detail modal is read-only, shows the *undiscounted* price and hides the unit.

### Cited Findings
**Model**
- `Item = { id, order, name, description, image, isFree?, discount?: {isOnDiscount, discountPercentage, discountedPrice}, price: number /* still required in the type */, denominator? }`. - `pkg:src/types/catalogue.ts:126-142`

**Manual editor (`ItemModal` → `ItemInput`)**
- Name is required, with the placeholder "e.g. Pancakes". - `app:src/components/catalogue/inputs/item/ItemDetails.tsx:50-64`
- Description is a plain textarea with a "Generate/Enhance with AI" button (`writeItemDescription`), which spends AI credits. - `ItemDetails.tsx:30-45,66-97`
- **Price** is a text input that accepts up to 2 decimals.
  - An empty price is stored as `0`. - `app:src/components/catalogue/inputs/item/ItemPricing.tsx:57-72`
  - Leaving the field after typing "0" sets `isFree: true`. - `ItemPricing.tsx:122-127`
- **Unit** is a fixed select: none, kg, g, l, ml, pcs, portion. There is **no hour, session, person, night or minute**. - `ItemPricing.tsx:20-28,154-177`
- The "Free" checkbox sets price 0 and `isFree: true`.
- The "Discount" checkbox reveals "Sale Price" and "Percentage" fields, each computed from the other. - `ItemPricing.tsx:74-120,181-260`
- **Image:** tabs for "Upload File" (UploadThing, image only, 4MB, 1 file) and "URL".
  - The whole image section is hidden when the block's layout is `variant_3`. - `app:src/components/catalogue/inputs/item/ItemImage.tsx:28,38-84`, `app:src/app/api/items/uploadthing/core.ts:12-18`
- Validation is `name.trim().length > 0 && (isFree || price >= 0) && !uploading`, which is always true for any numeric price. - `app:src/components/catalogue/modals/ItemModal.tsx:88-91`
- New items get "Add Item" or "Add Item & Add Another". - `ItemModal.tsx:70-86,135-156`

**Render ("no price" rule, current)**
- `CardsSwitcher` now rejects only a *nameless* record. That case shows a red "Invalid item data" box, with the comment *"A missing price is a valid item (a service list, an 'ask us' menu)"*. - `app:src/components/catalogue/cards/index.tsx:48-61`
- Price formatting:
  - `undefined` or `null` gives `""` and no price row (`PriceDisplay.tsx:25-28`).
  - `== 0` gives the text **"Free"**.
  - Anything else is formatted with the catalogue-language locale and shown as `"{price} {symbol}"`, with the symbol always after the number. - `cards/index.tsx:65-86`, `app:src/components/catalogue/cards/common/PriceDisplay.tsx:21-64`
- The renderer never reads `isFree` (grep: `isFree` appears only in editors, the AI and templates).
- The AI defaults a missing price to 0 (`price: input.price ?? 0` at `app:src/lib/catalogue/operations.ts:119`) and is told *"Use 0 when there is no price"* (`app:src/agent/instructions.ts:95`).
- A missing image is replaced with `DEFAULT_IMAGE` in cards and in the modal. - `cards/index.tsx:82`, `pkg:src/constants/catalogue.ts:175`
- The title is single-line `truncate`. - `app:src/components/catalogue/cards/common/CardTitle.tsx:11-19`

**The 4 card layouts (by `ItemsBlock.layout`)** - `cards/index.tsx:10-15`, grids in `Items.tsx:16-29`
| Key | Label | What it looks like |
|---|---|---|
| `variant_1` | Side Image | 1 column on phone, 2 from `md`. Horizontal card with a 4:3 image at 40% width on the left, and on the right the title (truncated), description clamped to 3–4 lines and price at the bottom. The sale price sits beside the struck original. - `SideImageCard.tsx:11-46` |
| `variant_2` | Top Image | Wrapping cards at 45% width (max 180/220/260px), 4:3 image on top, title, description clamped to 2–3 lines, price. - `TopImageCard.tsx:11-46` |
| `variant_3` | Text Only | 1–2 column grid; name plus 2-line description on the left, price on the right; no image. The discount ribbon is small and on the right. - `TextOnlyCard.tsx:10-38` |
| `variant_4` | Carousel | Swiper horizontal scroller, 220–240px slides, image on top, title, description clamped to 3–4 lines, price. - `CarouselCard.tsx:11-42`, `Items.tsx:131-188` |
- **Discount badge:** a red triangle ribbon with the percentage, top-left (or small, top-right on Text Only). - `app:src/components/catalogue/cards/common/DiscountBadge.tsx:7-44`, `BaseCard.tsx:51-57`

**Item detail modal (`ItemDetailModal`)**
- It opens when a card is clicked; the whole `<article>` is the click target. - `cards/index.tsx:99,106-113`, `BaseCard.tsx:34-37`
- It shows the image (except on `variant_3`, so a placeholder image appears for items with no photo) with a zoom button to a fullscreen viewer, then the name and the full description. - `app:src/components/catalogue/modals/ItemDetailModal.tsx:43-76,96-114`
- The "Price" row shows `item.price` and the currency. That is the **original price, not the sale price**, and the **unit is omitted**. - `ItemDetailModal.tsx:78-90`. The card shows the sale price. - `PriceDisplay.tsx:21-22`
- The modal has no action, link, CTA or extra fields; it is read-only.
- Cards are `<article role="article" tabIndex={0}>` with `onClick` and no key handler. `slugId` comes from `name`, so duplicate names produce duplicate DOM ids. - `app:src/hooks/useCard.ts:3-15`
- The discounted price is printed raw, without locale formatting, while the regular price is locale-formatted. - `PriceDisplay.tsx:22`, `cards/index.tsx:71-74`

**Common non-menu content: can it be expressed today?**
| Content | Today | Verdict / evidence |
|---|---|---|
| Service "from €30" | No price prefix or mode. The fixed unit list has no suitable unit. Only possible as text in the name or description. | Awkward - `pkg:src/types/catalogue.ts:132-142`, `ItemPricing.tsx:20-28` |
| "Price on request" / no price | An empty price is saved as 0 and renders **"Free"**. | Impossible in `items` - `ItemPricing.tsx:69-72`, `cards/index.tsx:69-70` |
| Duration (salons, classes) | No field; description text only. The AI may set a free-text `denominator` up to 30 chars, e.g. "/ session", but the manual unit select cannot show or keep such values. | Awkward - `app:src/agent/schemas.ts:55-60`, `ItemPricing.tsx:154-177` |
| Price tiers or variants (S/M/L, 30/60/90 min) | No variants; one item per variant. | Awkward |
| Team members / staff | Items only: they need a price (renders "Free"), the image is optional, and there is no role field. | Awkward |
| Opening hours | No structured field anywhere in the app. The docs tell owners to use a text block; the AI is told to "take … opening hours" from web pages. | Text block only - `app:src/content/docs/build-and-edit.tsx:109-116`, `instructions.ts:73`; grep for hours fields finds nothing |
| Address / map | `legal.address` appears only in the custom footer's "Company Information" (plans with branding). A map needs an `embedding` block (Pro+). | Plan-gated / indirect - `app:src/components/catalogue/view/components/CompanyInfo.tsx:5,25-29` |
| Standalone image / banner | No image block. The text toolbar cannot insert images and paste flattens to plain text. Fallbacks: a single-item items block (image, name, "Free"), `<img>` in an embedding block (Pro+; the embed profile allows `img`), or `custom_code` (Growth+). | Impossible on Starter/Basic; hacks above that - `sanitize.ts:59-104,107` |
| Buttons / CTAs | One header CTA and one footer CTA, custom header/footer only (branding plans), plus email/phone icons in the header. No button in the page body; a text block cannot author links. | Impossible in body - `app:src/components/catalogue/view/CatalogueHeader.tsx:115-138`, `CatalogueFooter.tsx:159-174` |
| FAQs | A text block with bold questions (no accordion), or an items section per question used as a collapsible header (costs a section and needs items). | Awkward |
| Gallery | An items block in Carousel layout with image-only "items" (each shows a price or "Free"). | Awkward |
| Video | `embedding` iframe from allowlisted hosts (YouTube, Vimeo, etc.), Pro+. No upload. | Plan-gated - `sanitize.ts:22-31` |
| Allergen / dietary tags | No tag or badge field. | Impossible (only as text) - `pkg:src/types/catalogue.ts:132-142` |
| Per-item "Order/Book on WhatsApp" | No per-item action; the modal is read-only; no WhatsApp anywhere in the app. | Impossible - `ItemDetailModal.tsx:78-90` |

### Inferences
- The renderer's tolerance for a missing price is **unreachable from the UI and the AI**. Removing the "Free" conflation needs an authoring change (a price mode, or allowing an empty price), not a render change. Until then every "ask us" service shows as free, a trust problem for service businesses.
- Marketing promises durations, tiers, packages and allergen tags (Q10); the Item model has none of them.
- The detail modal contradicts the card for discounted items (it shows the full price). This is a correctness bug that reached published pages.

### Gaps
- Line-break handling of multi-line descriptions in the modal was not verified in a browser.
- How many real items have price 0 but are not truly free: no representative data (TEST is empty; the 7 showcases have 0 zero-priced items).

---

## Q3. The text block editor: toolbar, paste behaviour and sanitizer profile

### Takeaway
`RichTextEditor` is a `document.execCommand` `contentEditable`. It can author:
- bold, italic and underline;
- bullet and numbered lists;
- left, centre and right alignment;
- a 4-step "Text size" select.

It cannot author links, headings, tables, images, colours or quotes. **Paste strips all formatting.** The sanitizer's `text` profile *does* allow headings, links, images and tables, so the data layer is richer than the toolbar. The **text-size control is silently broken on published pages**: it writes `<font size>` tags, which the sanitizer strips.

### Cited Findings
- **Toolbar buttons:**
  - Bold, Italic, Underline (`RichTextEditor.tsx:168-190`).
  - Bullet List, Numbered List (`:194-208`).
  - Align Left, Center, Right (`:212-234`).
  - "Text size" select with Small=4, Medium=5, Large=6, Extra Large=7, implemented as `execCommand("fontSize")` (`:238-253`). - all in `app:src/components/catalogue/sections/common/RichTextEditor.tsx`
- **Missing controls:** no link, heading, table, image, colour, quote or clear-formatting button. The imported icon set is only those 8 icons. - `RichTextEditor.tsx:2-11`
- **Paste:**
  - The handler takes `text/html`, reads its `innerText`, and inserts it with `execCommand("insertText")`.
  - If there is no HTML it uses `text/plain`.
  - All pasted formatting, links and lists are therefore dropped. - `RichTextEditor.tsx:85-98`
- **Editing surface:** min 200px, max 300px, vertically resizable. - `RichTextEditor.tsx:257-272`
- **The copy over-promises.** The dialog describes the text type as *"Add rich text content with headings, lists, links, and formatting."* The toolbar has no heading or link control. - `app:src/components/catalogue/modals/content/BlockConfigHeader.tsx:32`
- **Sanitizer `text` profile (allowlist):**
  - Tags: p, br, hr, div, span, section, article, h1–h6, strong, b, em, i, u, s, small, sub, sup, mark, ul, ol, li, dl, dt, dd, blockquote, figure, figcaption, a, img, table, thead, tbody, tfoot, tr, th, td, caption, pre, code. - `app:src/lib/html/sanitize.ts:59-104`
  - Attributes on all tags: class, style, dir, lang, title, aria-label, role. `a` also allows href, target, rel, name. `img` allows src, srcset, alt, width, height, loading, decoding. `td` and `th` allow colspan and rowspan. - `sanitize.ts:109-117`
  - URL schemes: http, https, mailto and tel; `img` also allows `data:`. Links are forced to `rel="noopener noreferrer"`. Disallowed tags are discarded. - `sanitize.ts:119-130`
  - Sanitizing happens at render in `HtmlContent`, on both server and client, for text content, the catalogue heading and embed code. - `app:src/components/general/HtmlContent.tsx:25-35`
  - Introduced in commit `ab7b16d` (2026-09-15, "fix(security): filter author HTML before it reaches a published catalogue").
- **Text size never reaches the published page:**
  - `font` is not in `TEXT_TAGS` (`sanitize.ts:59-104`), yet CSS still styles `.rich-text-content font[size="1…7"]` (`app:src/styles/other.css:59-87`).
  - In edit mode, a text block that is not being edited also renders through `HtmlContent`, so the size vanishes there too. - `app:src/components/catalogue/sections/TextBlock.tsx:69-74`
  - Because the default body size equals size 5 (`other.css:92-99`), "Medium" looks right. **Small, Large and Extra Large are lost.**
  - Showcase evidence: all 5 showcase text blocks store `<font size="5">`, and the rendered DOM of all 7 pages contains 0 `<font>` tags. - showcase parse, 2026-10-01
- **Only the AI can create headings.** It is told to keep text HTML simple, *"(<h1>, <p>, <strong>, <em>, <br>)"*. Links are not in that list, so an owner can edit an AI-written heading but cannot create one. - `app:src/agent/instructions.ts:44`. The AI's text content is capped at 4000 chars. - `app:src/agent/tools/sections.ts:66-70,116`

### Inferences
- The cheapest capability gains for `text` need no data or security change, because the profile already allows headings, links, images and tables:
  - link insert and edit;
  - a heading-level control;
  - keeping sanitized `text/html` on paste;
  - fixing text size by mapping it to allowed markup such as `span style` or headings.
  This agrees with the 09-25 plan §6.7.
- Owners cannot create even a "Call us" or "Book here" link in body text. That pushes every CTA into the header or footer, which are branding-gated.

### Gaps
- Exactly how `insertText` handles pasted newlines (`<br>` or `<div>`) was not verified in a browser.
- Whether the showcase `<font size="5">` came from a deliberate "Medium" choice or from browser defaults cannot be told from the data.

---

## Q4. The "Add content" flow: picker, click paths, and edit, reorder, delete and duplicate

### Takeaway
There is **one entry point**: the "Add Section" tile at the very bottom of the catalogue, plus the AI chat.
- It opens a single dialog. On the left is a flat, ungrouped list of 5 types; on the right is the form.
- New blocks are **always appended to the end**. Moving one up means clicking "Move up" once per position.
- There is no insert-at-position, drag-and-drop or duplicate (for blocks or items), and no undo. Deletes use a browser `confirm()`.
- Editing is split: `items`, `embedding` and `custom_code` edit in the dialog; `text` and `divider` edit inline.

### Cited Findings
**Entry point**
- The "Add Section" tile (big +, subtitle *"Items, text, a divider, an embed or custom code"*) renders after all blocks, in edit mode only. - `app:src/components/catalogue/inputs/ContentBlockButton.tsx:8-37`, `app:src/components/catalogue/view/Catalogue.tsx:246-259`
- The builder rail has Editor, Save, Templates, Preview and Publish/Update, but **no add action**. - `app:src/components/catalogue/builder/useBuilderActions.ts:131-175`, `app:docs/architecture/builder.md:13-17`
- If `content.length >= sections_per_catalogue`, the tile opens the Sections `LimitsModal` instead of the dialog. That count includes text blocks. - `Catalogue.tsx:249-255`

**The dialog (`AddContentModal`, redesigned 2026-09-29)**
- The title is "Add section" or "Edit section".
- `SectionTypePicker` shows wrapping chips on phones and a vertical list in a 240px left column from `md`. It is keyboard-operable as a radio group.
- The dialog is `max-w-5xl` wide and `min(660px, 100dvh-48px)` tall. - `AddContentModal.tsx:224-244`, `app:src/components/catalogue/modals/content/SectionTypePicker.tsx:30-91`, `app:.claude/plans/active/2026-09-29-builder-redesign/PLAN.md:99`

**Picker entries (fixed order, no grouping)**
| # | Key | Picker label | Icon (lucide) | Description (right-hand header) | Gate | Primary button |
|---|---|---|---|---|---|---|
| 1 | `items` | Items | LayoutGrid | "A section of items. Give it a heading to make it collapsible, or leave the heading off for a plain grid." | none | "Add Items" |
| 2 | `text` | Text | Type | "Add rich text content with headings, lists, links, and formatting." | none | "Add Text" |
| 3 | `divider` | Divider | SeparatorHorizontal | "Add a visual separator with customizable spacing and border styles." | `divider` | "Add Divider" |
| 4 | `embedding` | External content | Globe | "Embed external content such as maps, videos, or third-party widgets." | `embedding` | "Add Embedding" |
| 5 | `custom_code` | Custom code | Code | "Insert custom HTML to add advanced or custom functionality." | `customCode` | "Add Custom Code" |
- Sources for the table: `SectionTypePicker.tsx:15-21`; `BlockConfigHeader.tsx:18-35`; button text built by `snakeToTitleCase(selectedOption)` in `AddContentModal.tsx:263-266` and `app:src/lib/format/text.ts:8-13`, so the embed button says "Embedding" while the picker says "External content".
- Descriptions appear only in the form header once a type is selected; phones show only the description. - `BlockConfigHeader.tsx:37-58`
- **Lock state:**
  - A locked type gets a small Lock icon plus screen-reader text "(upgrade required)". It stays selectable. - `SectionTypePicker.tsx:25-29,77-85`
  - Selecting it overlays the form with `LimitsOverlay`: "Upgrade required / Upgrade your plan to unlock this feature. / [Upgrade now]". That button saves the draft and goes to `/pricing`. - `BlockConfigForm.tsx:47-49`, `app:src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:24-65`
  - The primary button is disabled. - `AddContentModal.tsx:208-209,263`
  - **No plan name is shown.** `getRequiredPlan` understands only count limits, not block types. - `app:src/lib/entitlements/required-plan.ts:16-31`
- **The sections limit modal calls sections "categories":** *"Upgrade to create N categories and help customers find exactly what they need."* - `app:src/components/modals/limits/limitContent.ts:128-139`

**Click paths (from the builder, with the default "Items" preselected)**
- **Items:**
  1. Scroll to the bottom and click **Add Section**.
  2. Type the Heading (or toggle it off and type a section name).
  3. Optionally change the switches and layout.
  4. Click **Add Items**. The section is appended at the end and is empty.
  5. Click the **Add New Item** tile.
  6. Type the name, then optionally the description, price, unit, Free, Discount and image.
  7. Click **Add Item**, or **Add Item & Add Another** to loop.
  - Minimum: 4 clicks plus 2 typed fields for one section with one item, plus N× "Move up" to place the section. - `Items.tsx:36-58`, `ItemModal.tsx:130-156`
- **Text:** Add Section → **Text** → optional name → type in the editor → **Add Text**. It works even with empty content, which saves the placeholder "New text block".
- **Divider:** Add Section → **Divider** (padlocked on Starter) → spacing and border → **Add Divider**.
- **External content:** Add Section → **External content** → paste code (required) → **Add Embedding**.
- **Custom code:** Add Section → **Custom code** → code (required) → **Add Custom Code**. - validity rules at `AddContentModal.tsx:208-217`

**Insert position**
- Manual adds always go to the end: `updateCatalogue({content: [...catalogue.content, newBlock]})`. - `AddContentModal.tsx:200-204`
- `addBlock(block, index)` exists in context but **has zero callers**. - `app:src/context/CatalogueContext.tsx:94-105` (grep)
- The **AI can insert at any position** through `addSection.position`. - `operations.ts:247-254`, `app:src/agent/tools/sections.ts:77-79`

**Reordering**
- Blocks move one place at a time with up/down in the block toolbar (`BlockControls.tsx:160-169`, `CatalogueContext.tsx:125-141`).
- Items move with ⋮ → Move up/down, or "Move to section", which appends to the end of the target section. - `app:src/components/catalogue/cards/common/CardControls.tsx:100-148`, `CatalogueContext.tsx:225-260`
- No drag library is installed (grep for dnd-kit, react-dnd, Sortable and draggable found nothing).

**Toolbars**
- Block toolbar: Edit, a Layout dropdown (items only), Move up, Move down, Delete ("Are you sure you want to delete this section?" via `confirm()`). **No duplicate.** - `app:src/components/catalogue/cards/common/BlockControls.tsx:84-186`
- Item menu: Edit item, Move up/down, Move to section, Delete item (`confirm()`). **No duplicate.** - `CardControls.tsx:100-160`
- Only whole catalogues can be duplicated, from the dashboard. - `app:src/actions/catalogue.ts:180-240`

**Inline or dialog editing**
- The `items` settings open the dialog (pencil → `onEditBlock`); layout can also change inline from the toolbar dropdown. - `CatalogueContent.tsx:246-300`, `Catalogue.tsx:154-160`
- Items are edited in the item dialog.
- `text` and `divider` edit inline (Q1); `embedding` and `custom_code` open the dialog. - `CatalogueContent.tsx:301-331`
- **The type can be changed while editing.** The picker's `onChange` is not disabled for an existing block, and `updateBlock` merges fields, so switching an items block to text keeps a hidden `items` array. - `AddContentModal.tsx:238-243`, `CatalogueContext.tsx:115-123`
  - The server still counts those hidden items toward the item limit; the client does not. - `app:src/lib/entitlements/plan.ts:95-99` vs `app:src/lib/catalogue/items.ts:47-53`

**Templates**
- The template dialog opens automatically when the builder has an empty catalogue, and from the rail. - `app:src/components/catalogue/modals/SelectTemplateModal.tsx:46-55`
- Picking a template **replaces all content**; the confirmation reads "Save & continue". - `app:src/components/catalogue/inputs/TemplatesInput.tsx:81-100,197-220`

### Inferences
- The time-to-value path for a structured page (for example intro, hours and menu) is long:
  - each block appended at the bottom needs repositioning;
  - intro text above the menu takes up to N "Move up" clicks;
  - there are no multi-block starters apart from the three templates.
- The AI can insert at a position and the manual UI cannot, so the AI is strictly more capable at page structure.
- A flat 5-item list works today. The 09-25 plan's grouping and search become necessary only if the type list grows.

### Gaps
- The builder's actual click counts were not measured in a running app. The paths above come from code.

---

## Q5. Plan gating: tiers, limits, `features.sections`, where it is enforced and how sections are counted

### Takeaway
- **Block-type gating is enforced only in the client and in the AI path.** The server actions that save and publish catalogues (create, update, publish, duplicate) accept any block type. This breaks the repo's own rule that plan limits are enforced on the server.
- **Section counting uses 2 incompatible rules across 4 places:**
  - text-exempt: the dialog and the AI applier;
  - count-everything: the Add Section tile and the server.
- Starter gets 5 sections and 15 items and no divider. The cheapest paid block feature (Basic) is the divider.

### Cited Findings
**Tiers** - `pkg:src/constants/pricing.ts:3-197`; type at `pkg:src/types/general.ts:16-48`
| Tier (id) | Sections | Items | divider | embedding | customCode | branding | newsletter | styles / customThemes | AI credits | Catalogues | Views/mo |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Starter (0) | 5 | 15 | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ / ✗ | 15 | 1 | 500 |
| Basic (1) | 8 | 30 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ / ✗ | 50 | 1 | 2,000 |
| Pro (2) | 15 | 100 | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ / ✓ | 150 | 6 | 5,000 |
| Growth (3) | 30 | 200 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ / ✓ | 300 | 20 | 15,000 |
| Premium (4) | 50 | 300 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ / ✓ | 600 | 50 | 40,000 |
| "German Silva Custom Plan" (5, `type:"custom"`) | 20 | 200 | ✓ | ✓ | ✗ | ✓ | ✗ | ✓ / ✓ | 50 | 1 | 4,000 |
- `features.sections` is a required trio `{divider, embedding, customCode}`. There is no flag for `items` or `text`. - `pkg:src/types/general.ts:30-34`
- Prices are not in code; they are Paddle price ids. "Pro" is marked popular (`POPULAR_TIER_ID = 2`). - `app:src/constants/pricing.ts:16`
- **AI limits by plan:**
  - Starter: `maxFetches 0` (no website import), `maxPlanTasks 4`, the cheaper model, and a verified email required.
  - Paid: 3 fetches, 12 tasks. - `app:src/lib/ai/limits.ts:21-36`
  - `fetchUrl` is removed from the tool set when `maxFetches` is 0. - `app:src/agent/tools/index.ts:33-38`

**Where block-type gating happens**
| Layer | Mechanism | Fails | Evidence |
|---|---|---|---|
| Picker / dialog (client) | `isLocked(key)` returns `features.sections.X === false`, and **returns unlocked when `features.sections` is missing** | open | `AddContentModal.tsx:107-120` |
| AI tool schema (server) | `allowedSectionTypes(access)` puts a gated type in the per-request zod enum only when the flag is `=== true` | closed | `app:src/agent/schemas.ts:9-28` |
| AI applier (server) | `isSectionTypeLocked` locks unknown types when access is given; with no access nothing is gated (the browser replays already-authorised ops) | closed | `operations.ts:49-71`, `app:src/hooks/useCatalogueChat.ts:110` |
| Plan source for AI | `features.sections` from the DB plan through `openAiTurn` | - | `app:src/lib/ai/turn.ts:72-84`, `app:src/app/api/agent/route.ts:125-137` |
| **Manual save/publish (server)** | **none.** `createCatalogue`, `updateCatalogue` and `publishCatalogue` run only `applyPlanToCatalogue` (header/footer type and newsletter) and `contentWithinPlan` (counts). `pickEditable` copies `content` verbatim. | **open** | `app:src/actions/catalogue.ts:265-275,331-339,433-435`; `app:src/lib/entitlements/catalogue.ts:13-28`; `app:src/utils/db/columns.ts:38-66` |
| Duplicate catalogue | copies content, **no `contentWithinPlan`** | open | `actions/catalogue.ts:180-240` |
| Downgrade | adjusts only header/footer, newsletter and catalogue count | - | `entitlements/catalogue.ts:37-78` |
- The repo rule reads *"Plan limits are enforced on the server from `users.plan_id` and `tiers`, never only in the UI."* - `app:.claude/CLAUDE.md:22`
- The skill says flags are read as `=== true`. - `app:.claude/skills/adding-new-content-block/SKILL.md:55-57`. The client uses `=== false`. - `AddContentModal.tsx:111-117`

**How sections and items are counted**
| Site | Sections counted | Text exempt? | Items counted |
|---|---|---|---|
| "Add Section" tile | `item.content.length` | **No** | - | 
| `AddContentModal.checkLimits` (adding only) | non-text blocks | **Yes** | - |
| AI applier `countSections` / `countItems` | non-text blocks | **Yes** | items in items-blocks; a batch is cut to the remaining budget |
| Server `contentWithinPlan` (growth-only vs the stored row) | `content.length` | **No** | any block with an `items` array |
| Client `checkItemLimits` (opening Add Item and saving) | - | - | `getTotalItemCount` over items-blocks |
- Sources for the table, in row order: `Catalogue.tsx:249-255`; `AddContentModal.tsx:122-141`; `operations.ts:94-103,225-246,344-355`; `app:src/lib/entitlements/plan.ts:86-135`; `CatalogueContent.tsx:178-186` with `ItemModal.tsx:70-75` and `items.ts:47-53`.
- `contentWithinPlan` has no unit test. It appears only in `actions/catalogue.ts` and `plan.ts` (grep).
- Public copy never says text blocks are free. The plan card reads *"Up to N sections & M items per catalogue"* (`app:src/constants/pricing.ts:31-37`). The FAQ says Starter includes "up to 5 sections and 15 items" (`app:src/constants/pricingFaqs.ts:23`).
- The comparison table's "Section types" rows are **Divider section**, **External content section** ("Maps, video, booking widgets") and **Custom code section**. - `app:src/constants/pricing.ts:151-166`

### Inferences
- With a Starter plan and 5 blocks, one of them text:
  - The owner cannot open the dialog at all (the tile counts all blocks), even though the dialog would allow a text block.
  - The AI *will* add a text block (its count exempts text), but the next save is rejected by the server ("Your plan allows 5 sections per catalogue") because the server counts all blocks and the count grew.
- Because saves do not check block types, a Starter user can store and publish `custom_code` or `embedding` by calling the server action directly. The only barrier is the UI.
- The "Standard Catalog" template has exactly 5 sections and 15 items (Q7). A Starter user who picks it hits both caps at once.

### Gaps
- Real tier prices and the distribution of customers per tier: not in code; TEST has 3 Starter users only.

---

## Q6. The AI agent: what it can create and update, how blocks are described to it, and every hand-maintained list of block types

### Takeaway
- **Create and update:** the agent can create all 5 types, with gated ones removed per plan from its tool enum. It can update only `name` on every type; `layout`, `showHeading` and `isExpanded` on items; `content` on text; and `code` on embed and custom code.
- **Cannot touch:** divider styling, discounts, and `isExpanded` at creation.
- **Stale instructions:** its prose still names the **deprecated `category` and `container` types** and says *"Use 'category' for items"*, while its tool schema accepts only `items`.
- **Snapshot gaps:** each block is one line, without `showHeading`, `isExpanded` or divider settings.
- **No registry:** the block vocabulary is hand-copied into about 20 places.

### Cited Findings
**Tools that touch blocks**
- Section tools: `readSection`, `addSection`, `updateSection`, `deleteSection`, `moveSection` (up or down one step). - `app:src/agent/tools/sections.ts:17-158`
- Item tools: `addItems`, `updateItem`, `deleteItem`, `moveItem`. - `app:src/agent/tools/items.ts:15,38,84,101`
- Other tools: `updateCatalogue`, `updateHeader`, `updateFooter`, `updateLegal`, `updateAppearance`, `setCustomTheme`, the planning tools, `loadSkill` and `fetchUrl`. - `app:src/agent/tools/*.ts` (tool list via grep)

**`addSection` input**
- `sectionType`: the per-plan enum.
- `name`: up to 120 chars; always set one.
- `showHeading`: items only.
- `layout`.
- `content`: up to 4000 chars, text sections, "Simple HTML only".
- `code`: up to 40,000 chars, embed and custom code.
- `items`: up to 40 per call.
- `position`: insert index. - `sections.ts:46-107`, `app:src/agent/schemas.ts:6-7`

**`updateSection` input**
- `name`, `layout`, `content`, `code`, `showHeading`, `isExpanded`. - `sections.ts:109-130`
- The applier drops fields that do not fit the type:
  - items keep `layout`, `showHeading` and `isExpanded`;
  - text keeps `content`;
  - embed and custom code keep `code`;
  - **a divider can only be renamed**. - `operations.ts:265-305`

**Item input**
- `name` (up to 120), `description` (up to 600), `price` (≥0, optional; "Use 0 when there is none"), `isFree`, `denominator` (up to 30, e.g. "kg" or "hour").
- `pageImage` (the number of a picture on a page read this turn) or `imageQuery` (a stock-photo search).
- **No discount and no raw image URL.** - `schemas.ts:46-77`, `app:src/types/ai.ts:41-53`

**Build defaults** (`buildSection`, with an exhaustive `never` default)
- items: "New section", heading on, expanded, `variant_1`.
- text: `<p>New text block</p>`.
- embed and custom code: `code ?? ""`.
- divider: 2rem, solid 1px `#000000` at 100%. - `operations.ts:124-183`

**Snapshot the model sees** - `app:src/agent/session.ts:375-419`
- A header with slug, heading, currency, language, business type and appearance.
- Items blocks: `  [i] items "Name" layout=variant_1 items=N`, then up to 40 items as `    [j] "Item" 12.5 [img] - description…(80)`.
- Text blocks: `  [i] text "Name" - "first 160 chars"`.
- Embed and custom code: `  [i] custom_code - <name or 140-char code excerpt>`.
- Anything else (divider): `  [i] divider - Name`.
- **Not shown:** `showHeading`, `isExpanded`, divider settings.
- Price 0 shows as `0`, while the page shows "Free" (`session.ts:359`).
- Caps: 40 sections and 40 items per section. - `session.ts:32-33`

**How the instructions describe blocks** - `app:src/agent/instructions.ts`
- **Stale type list:** *"Section types: "category" (collapsible list of items), "container" (always-open list of items), "text" (a block of prose, set content), "divider" (a horizontal rule), "embedding" (third-party embed…, set code), "custom_code" (raw HTML/CSS/JS, set code). Use "category" for items unless the user asks otherwise."* - `:42`. The schema enum is `["items","text", …gated]`. - `schemas.ts:14-20`, `types/ai.ts:27-32`
- *"Every section type accepts a name. On text, divider, embedding and custom_code sections it is never drawn on the page…"* - `:43`
- *"Headings and text-section content are HTML fragments; keep them simple (<h1>, <p>, <strong>, <em>, <br>)."* - `:44`
- The code rules for embedding and custom code are included only when one of them is unlocked. - `:56-61,108-119`
- Stale naming in the photo rules: *"if container/category has layout: variant_3 then change it…"* - `:66`
- The web rules say *"Take the words: names, descriptions, prices, opening hours."* No block exists for hours. - `:73`
- The per-catalogue context says prices are plain numbers, "Use 0 when there is no price", and lists locked types as *"This user's plan cannot use these section types: divider, embedding, custom_code…"*. - `:85-106`
- The planning rules forbid shipping a "materially different" substitute such as prose instead of a widget. - `:33`. A test asserts it. - `app:tests/unit/agent/instructions.test.ts:115-121`
- A test asserts the locked-types sentence verbatim (the canary for any new gated type). - `instructions.test.ts:51-60`

**Skills and suggestions**
- `authentic-writing` is always loaded. `responsive-design` loads on demand, is required before any code write, and is active only when embed or custom code is unlocked. - `app:src/agent/skills/authentic-writing.ts:4-6`, `app:src/agent/skills/responsive-design.ts:3-13`
- The chat suggestions are deliberately industry-neutral: "Add a new section with 6 items", "Make every description shorter and friendlier", "Raise every price by 10%", "Switch the theme to something more elegant". - `app:src/components/catalogue/chat/CatalogueChat.tsx:33-39`

**Import paths feeding the agent**
- Photographed menus go through in-browser OCR, up to 10 images per turn, and are available on every plan. - `app:src/constants/ocr.ts:7`, `instructions.ts:79-82`
- Websites go through `fetchUrl` (Firecrawl), paid plans only (Q5).
- No code sets `source` to `ocr_import` or `ai_prompt` any more (grep). - `pkg:src/types/enums.ts:14`

**Hand-maintained lists of block types (no registry)**
| # | Where | What |
|---|---|---|
| 1 | `pkg:src/types/catalogue.ts:114-121` | `ContentBlock` union |
| 2 | `pkg:src/types/general.ts:30-34` + 6 tier literals in `pkg:src/constants/pricing.ts` | `features.sections` trio |
| 3 | `app:src/types/ai.ts:27-39` | `AiSectionType`, `AiSectionAccess` |
| 4 | `app:src/agent/schemas.ts:14-20` | `allowedSectionTypes` |
| 5 | `app:src/agent/instructions.ts:42-43,56-57,66,91,111` | prose roster (stale), name rule, code rules, locked list, `canWriteCode` |
| 6 | `app:src/agent/skills/responsive-design.ts:8-9` | code-type check |
| 7 | `app:src/agent/session.ts:388-409` | snapshot branches |
| 8 | `app:src/lib/catalogue/operations.ts:50,61-71,73-83,101-103,124-183,275-292` | `UNGATED_SECTION_TYPES`, `isSectionTypeLocked`, `SECTION_TYPE_LABELS`, `countSections`, `buildSection`, update patch rules |
| 9 | `app:src/lib/catalogue/content-blocks.ts:12-18` | item-bearing keys (with legacy) |
| 10 | `app:src/components/catalogue/modals/content/BlockConfigHeader.tsx:6-35` | `ContentOption`, `LABELS`, `DESCRIPTIONS` |
| 11 | `app:src/components/catalogue/modals/content/SectionTypePicker.tsx:15-21` | `OPTIONS` (label, icon, order) |
| 12 | `app:src/components/catalogue/modals/AddContentModal.tsx:34-52,107-120,122-141,158-196,208-217` | defaults, lock switch, count, build, validity |
| 13 | `app:src/components/catalogue/modals/content/BlockConfigForm.tsx:13-31,51-111` | flat draft type and form branches |
| 14 | `app:src/components/catalogue/view/CatalogueContent.tsx:246-372` | render chain |
| 15 | `app:src/components/catalogue/inputs/ContentBlockButton.tsx:31` | tile subtitle copy |
| 16 | `app:src/constants/pricing.ts:151-166` | comparison-table rows |
| 17 | `app:src/components/dashboard/subscription/PlanFeatures.tsx:45-47` | plan feature list |
| 18 | `app:.claude/skills/adding-new-content-block/SKILL.md:38-51` | 12-step checklist (omits #5–7 and #15–17) |

### Inferences
- The stale roster at `instructions.ts:42` probably costs failed tool calls: a model that follows the prose and sends `"category"` fails zod validation and must retry. This was not observed live. It is a direct result of the 09-26 merge updating the schema but not the prose.
- Any new block with structured settings (hours rows, buttons, images) would be **create-and-delete only** for the AI unless `updateSection` stops being a fixed field list. Today dividers are already create-only apart from renaming.

### Gaps
- Agent behaviour with the stale roster was not measured. No transcripts or logs were queried.
- Whether the agent routes scraped opening hours or contact details into a text block when branding blocks `updateCatalogue.contact` on Starter (`operations.ts:479-492`) is not specified in the instructions and was not tested.

---

## Q7. Catalogue-level features that overlap with possible blocks, and whether customers would expect them in the page body

### Takeaway
**Branding (Basic+) gates** contact details, the logo, SEO, the custom header and footer, CTAs, socials, partners and legal. Starter pages show **Quicktalog's own email and a "Create Your Catalog" button** in the header, plus Quicktalog promotion in the footer.

So for the plan every new account starts on, a **text block is the only place an owner can publish their own phone, address or hours**. All catalogue-level features are fixed in the header or footer; none can be placed in the body.

### Cited Findings
**Header**
- The type is forced on every save: `"custom"` if the plan has branding, otherwise `"default"`. - `app:src/lib/entitlements/catalogue.ts:13-28`
- A **default** header shows `mailto:quicktalog@outlook.com` and the CTA "Create Your Catalog" linking to `/auth?mode=signup`. - `app:src/components/catalogue/view/CatalogueHeader.tsx:74-84,115-124`
- A **custom** header shows an email icon (if `contact.email` and `emailCta`), a phone icon (if `contact.phone` and `phoneCta`), and **one** CTA button (label and URL). - `CatalogueHeader.tsx:85-110,126-138`
- Header tab: "Customize header", "Logo size", "Interaction → Header action link" (label and URL), "Icons → Phone number icon / Email icon". Everything sits behind `LimitsOverlay type="branding"`. - `app:src/components/catalogue/inputs/sidebar/HeaderTab.tsx:17,72,99-195`

**Footer**
- A **default** footer shows Quicktalog's contact, "Platform Features" and a "Create your own digital catalog" CTA. - `app:src/components/catalogue/view/CatalogueFooter.tsx:112-130`, `components/DefaultActions.tsx:28-29`
- A **custom** footer shows:
  - Brand (logo, legal name, socials detected by URL: instagram, facebook, twitter/x, linkedin, tiktok, youtube, pinterest). - `CatalogueFooter.tsx:65-110`
  - "Contact & Support" (email, phone). - `components/Contact.tsx:6-61`
  - "Company Information" (legal name, **address**). - `components/CompanyInfo.tsx:5-29`
  - "Trusted Partners" (name, link, description). - `components/Partners.tsx:5-21`
  - Legal links (privacy, terms). - `components/LegalLinks.tsx:43-56`
  - Newsletter form (Growth+). - `CatalogueFooter.tsx:147-157`
  - **One** footer CTA. - `CatalogueFooter.tsx:159-174`
- Footer tab sections are LogoSize, Interaction (footer action link and Newsletter), Business information (legal name, address, terms URL, privacy URL), Social links and Partners. - `app:src/components/catalogue/inputs/sidebar/FooterTab.tsx:113-131`, `footer/InteractionSection.tsx:22-80`, `footer/BusinessInfoSection.tsx:16-51`, `footer/SocialLinksSection.tsx:107-118`, `footer/PartnersSection.tsx:43-66,133-147`

**General tab**
- Name (read-only) and Language are always available.
- **Logo**, **Contact information** (phone, email, website) and **Search and sharing** (SEO title, description, icon) are each wrapped in `LockedGroup locked={!hasBranding}`. - `app:src/components/catalogue/inputs/sidebar/GeneralTab.tsx:16,45-163`
- The AI respects the same lock. - `operations.ts:479-492,588-593,629-634`

**Heading**
- The catalogue `heading` is a separate rich field above the blocks, edited inline with Bold, Italic and 4 sizes.
- It is stored as `<h1 class=… data-size>`, the page's only "hero" text. - `app:src/components/catalogue/view/components/Heading.tsx:12-31`, `app:src/components/catalogue/inputs/heading/FormattingToolbar.tsx:18-77`

**Appearance**
- 7 standard themes are available on all plans. Custom colours need `customThemes` (Pro+). Style controls (font, size, radius, shadow) and the **emoji overlay** need `styles` (Pro+). - `app:src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:27-28,102-158`
- The overlay is one `icon` string holding up to 3 emojis, repeated as floating particles. - `pkg:src/types/catalogue.ts:175-178`, `app:src/components/catalogue/inputs/sidebar/appearance/OverlayConfiguration.tsx:12-18`, `app:src/components/general/Overlay.tsx:1-13`

**Templates** (typed `ContentBlock[]`, items only)
- **"Quick Start"** (Recommended): 2 headed items sections, 6 placeholder items.
- **"Standard Catalog"**: 5 items sections (4 headed and 1 headless "Complementary Extras" in Text Only layout), 15 items, layouts 1/2/4/1/3.
- **"Start from Scratch"**: empty.
- Every item uses `DEFAULT_IMAGE` and generic English copy. **No text, divider or other block, and nothing industry-specific.** - `app:src/constants/catalogueTemplates.ts:3-285,286-399`, `app:src/components/catalogue/inputs/TemplatesInput.tsx:32-65`

**Other catalogue-level facts**
- No catalogue-level opening hours field exists anywhere (grep).
- `contact` is `{phone, email, website, socials[]}`; the address lives in `legal`. - `pkg:src/types/catalogue.ts:144-149,215-220`
- There is no JSON-LD on catalogue routes (grep for `ld+json` under `src/app/catalogues`).

**Could it reasonably go in the page body?**
| Feature | Where it renders now | Would a customer expect it in the body? |
|---|---|---|
| Header CTA (1 button) | Header (branding) | Yes. Booking, order and WhatsApp buttons are usually wanted next to the items they relate to. |
| Email / phone CTAs | Header icons (branding) | Often. A "Call to book" line beside services. |
| Contact, address, socials | Footer (branding); none on Starter | Yes. Customers ask "where are you / when are you open" near the top. Today this is text-block prose. |
| Opening hours | Nowhere | Yes. The docs already steer owners to a text block. |
| Partners | Footer "Trusted Partners" (branding) | Sometimes, as a logo strip or "suppliers" section. |
| Newsletter | Footer bottom bar (Growth+) | Sometimes, as an inline signup. |
| Legal | Footer | No. |
| Heading | Above the blocks | Already acts as a hero title. There is no hero image or banner. |
| Emoji overlay | Whole page | No; decorative and catalogue-wide. |
| Templates | Replace all content | Industry starters would be expected, not only generic ones. |
*(The expectation column is inference, not code.)*

### Inferences
- Plans and blocks are tangled: the contact-type content most service businesses need is plan-locked at catalogue level, so a body block for contact or hours would be the only way for Starter users unless branding rules change. Whether such a block should itself be gated is a product decision.
- All 7 showcase catalogues use the default header and footer (Q9), so the most visible real pages carry Quicktalog's email and CTA instead of the merchant's.

### Gaps
- No usage data on how often paid owners fill header CTAs, contact details or partners (TEST is empty; PROD not queried).

---

## Q8. Status of the 09-25 plan's §2 findings (1–30), plus new findings

### Takeaway
Of 30 findings, **12 are fixed**. The rest are changed or still open:
- **Changed** (moved or improved, but not resolved): 2, 18, 19, 23, 26, 27, 30.
- **Still true**: 7, 8, 14, 17, 20, 21, 22, 24, 25, 28, 29.

The most important open items for block strategy are:
- **#7**: no server-side check on block types;
- **#8**: two section-count rules;
- **#17**: search covers items only;
- **#21**: item cards cannot be used from the keyboard;
- **no registry**.

This audit adds **18 new findings**, N1–N18.

### Cited Findings
| # | 09-25 finding (short) | Status 2026-09-30 | Evidence |
|---|---|---|---|
| 1 | Dead `ContentBlockType` missing `divider` | **Fixed**: removed | `pkg:src/types/enums.ts:1-22` (not present); grep 0 hits |
| 2 | Block-type union hand-written in 4 app files | **Changed**: the UI now shares one `ContentOption` (`BlockConfigHeader.tsx:6-11`) and the AI uses `AiSectionType` (`types/ai.ts:27-32`). Neither derives from `ContentBlock["type"]`; about 18 hand lists remain (Q6). | as cited |
| 3 | `buildSection` default writes a divider | **Fixed**: exhaustive `never` | `operations.ts:176-181` |
| 4 | `isSectionTypeLocked` fails open for unknown types | **Fixed** when access is given (still ungated with no access, by design) | `operations.ts:61-71` |
| 5 | `allowedSectionTypes` grants all when access is undefined | **Fixed**: `=== true` | `schemas.ts:9-20` |
| 6 | `SECTION_TYPE_LABELS` lacks types, shows "undefined" | **Fixed**: 5 labels plus fallback | `operations.ts:73-83` |
| 7 | No server-side validation or type gating of `content` | **Still true** (duplicate too) | `actions/catalogue.ts:180-240,265-275,331-339,433-435`; `columns.ts:58-66` |
| 8 | Sections counted 3 ways | **Still true**: 4 sites, 2 rules | Q5 table |
| 9 | Padlocks never rendered | **Fixed**: Lock icon and sr-text; the overlay shows as soon as the type is picked; the button is disabled. Still no plan name. | `SectionTypePicker.tsx:77-85`, `BlockConfigForm.tsx:47-49` |
| 10 | Same-origin script sink in `EmbeddingBlock` | **Fixed**: no `createElement("script")` in catalogue components | grep 0 hits |
| 11 | Script sink in `CodePreview` | **Fixed**: file deleted | `inputs/custom-code/` holds only `CodeEditor.tsx` |
| 12 | Dangling `aria-controls` | **Fixed**: `contentId` is shared by header and region. The region unmounts while collapsed, so the reference is empty then. | `ItemsSection.tsx:70,113,150`, `Items.tsx:117-130` |
| 13 | Emoji overlay rendered twice | **Fixed** | `Catalogue.tsx:205-207` |
| 14 | Anchor ids `${id}-${order}` change on reorder and are unused | **Still true** | `ItemsSection.tsx:69`, `CatalogueContent.tsx:117,238` |
| 15 | Dead `src` in the dialog draft | **Fixed** | `AddContentModal.tsx:34-52` |
| 16 | `showcase.json` with an invalid type | **Fixed**: deleted (`find` 0 hits) | - |
| 17 | Search covers item name and description only; other blocks stay visible | **Still true** | `items.ts:25-30`, `CatalogueContent.tsx:246-250,301-371` |
| 18 | Templates untyped, only category/container | **Changed**: typed `ContentBlock[]` using `items`, but still items-only and generic | `catalogueTemplates.ts:3,286` |
| 19 | Card price uses a hardcoded locale | **Mostly fixed**: cards use `localeForLanguage(catalogue.language)`. The modal's `toLocaleString("en-US")` now runs on an already formatted string, so it does nothing. The **sale price is still unformatted.** | `Catalogue.tsx:238`, `items.ts:60-100`, `cards/index.tsx:71-74`, `ItemDetailModal.tsx:86`, `PriceDisplay.tsx:22` |
| 20 | `<html lang="en">` hardcoded | **Still true** (confirmed in the showcase DOM) | `app:src/app/layout.tsx:42-44` |
| 21 | Cards are focusable `role=article` with no key handler; `slugId` from name | **Still true** | `useCard.ts:3-15`, `BaseCard.tsx:34-37` |
| 22 | Zero print styles | **Still true**: no `@media print` or `print:` | grep 0 hits |
| 23 | `prefers-reduced-motion` honoured once | **Changed**: honoured in product and marketing UI (`app:src/styles/product.css:142`, `useReducedMotion`, `LottiePlayer`, `Rise`) but **not** in catalogue components (framer-motion in `Items.tsx`, Swiper, Overlay) | grep |
| 24 | `images.unoptimized` in prod, `remotePatterns "**"` | **Still true** | `app:next.config.ts:16-24` |
| 25 | `ai-chat-flow.md` documents the removed path | **Still true** (`chatEditCatalogue`, `catalogueEditor.ts`, `[0] category …`) | `app:docs/architecture/ai-chat-flow.md:62,83,297,318-323,534-542` |
| 26 | Skill documents 5 of 10+ wiring areas | **Improved**: 12 steps, gating rules, legacy-key rule. It still omits the instruction roster, snapshot, pricing and PlanFeatures rows, and tile copy. | `SKILL.md:38-76` |
| 27 | `Subscription.tsx` / `BillingHistory.tsx` hand-expand `features.sections` | **Changed (moved)**: those files are gone; the same expansion now lives in `PlanFeatures.tsx:45-47` and `constants/pricing.ts:151-166` | as cited |
| 28 | 37 sanitizer iframe hosts vs 3 CSP `frame-src`; Report-Only | **Still true** | `sanitize.ts:14-57`; `next.config.ts:56,67` |
| 29 | `connect-src` lacks `utfs.io` / `*.ufs.sh` | **Still true** (`img-src` allows `https:` so images work) | `next.config.ts:53-55`; `be:src/utils/uploadthing.ts:3-7` |
| 30 | Overlay is one string, not a list | **Changed**: still one `icon: string`, but the input allows up to 3 emojis | `pkg:src/types/catalogue.ts:175-178`, `OverlayConfiguration.tsx:12-18` |

**New findings (not in the 09-25 plan)**
- **N1.** The agent prose still says `category`/`container` and "Use 'category' for items"; the schema accepts only `items`. - `instructions.ts:42,66` vs `schemas.ts:14-20`
- **N2.** The text-size control writes `<font size>`, which the sanitizer strips. Small, Large and Extra Large never publish, and the CSS for `font[size]` is dead. - `RichTextEditor.tsx:238-253`, `sanitize.ts:59-104`, `other.css:59-87`; showcase parse
- **N3.** The text-type description claims "headings, lists, links"; the toolbar has no heading or link control. - `BlockConfigHeader.tsx:32`
- **N4.** A missing price is authored as 0 by both the UI and the AI, and 0 renders "Free". `isFree` is never read by the renderer. - Q2
- **N5.** The detail modal shows the original price for discounted items and drops the unit. - `ItemDetailModal.tsx:78-90`
- **N6.** A block's type can be switched while editing, leaving stale fields. Hidden `items` then count toward the server item limit but not the client one. - Q4
- **N7.** Text and divider names are set only at creation; there is no rename. - Q1
- **N8.** The divider default is `#000000`, not theme-aware, and the AI cannot restyle dividers. - Q1, Q6
- **N9.** The agent snapshot omits `showHeading`, `isExpanded` and divider style. The agent cannot set discounts, or `isExpanded` when adding. - `session.ts:388-409`, `types/ai.ts:41-53`, `operations.ts:137`
- **N10.** The client lock predicate fails open (`=== false`, and unlocked when the flags are missing), contradicting the skill's `=== true` rule. - `AddContentModal.tsx:107-120`
- **N11.** The sections limit modal calls sections "categories", and no public copy says text blocks are exempt. - `limitContent.ts:128-139`
- **N12.** `addBlock(block, index)` has no callers, and new blocks always append at the end. - `CatalogueContext.tsx:94-105`, `AddContentModal.tsx:200-204`
- **N13.** Catalogue duplication skips `contentWithinPlan`. - `actions/catalogue.ts:180-240`
- **N14.** Website-to-catalogue import is paid-only (`maxFetches 0` on Starter); photo OCR is available on all plans. - `limits.ts:21-29`, `tools/index.ts:33-38`, `ocr.ts:7`
- **N15.** Starter pages show Quicktalog's email and signup CTA in the header, and Starter owners cannot enter their own contact details. - Q7
- **N16.** Label drift across surfaces: "External content" in the picker, "Add Embedding" on the button, "Embed" in AI messages, "External content section" in pricing. - `SectionTypePicker.tsx:19`, `AddContentModal.tsx:265`, `operations.ts:77`, `constants/pricing.ts:158-161`
- **N17.** Public showcase data still carries `type:"category"`, so the 09-26 migration appears not to have reached PROD, or the data predates it. Unverified in the DB. - showcase parse
- **N18.** Marketing claims features that do not exist (allergen and dietary tagging; durations, tiers and packages; class timetables). - Q10

### Inferences
- The fixes landed on 09-26 closed the AI-path fail-open bugs and the XSS sinks. The remaining open items are in manual authoring and presentation: server gating, count rules, search, keyboard access, print. Those grow worse with every new block type.

### Gaps
- #23 and #28 were not checked at runtime.
- #24's performance impact was not measured.

---

## Q9. Usage data: TEST database, plus a supplementary look at public showcase pages

### Takeaway
**The TEST database has no usable content.** It holds 1 catalogue with an empty `content` array, 3 users (all on Starter), and 0 analytics or QR rows, so every block-usage metric on TEST is zero or undefined. TEST does not represent real customers.

As a clearly labelled supplement, the **7 public showcase catalogues** that Quicktalog promotes use only item sections and one intro text block:
- 31 legacy `category` blocks and 5 `text` blocks;
- **0** divider, embedding or custom code blocks;
- all 5 text blocks are an unnamed welcome/about paragraph placed first on the page;
- all 7 use the default Quicktalog-branded header and footer.

### Cited Findings
**TEST SQL** (read-only; the `postgres` role has `rolbypassrls = true`, so counts are complete)
- `public.catalogues`:
  - 1 row, status `active`, created 2026-09-28, last updated 2026-09-29;
  - `content` is `[]`, so 0 blocks in total;
  - the per-type, per-status aggregate returned `by_type: null`. - TEST SQL q1–q3
- `public.users`: 3 rows, all with `plan_id = pri_01k27ajepm199twd1x77rpwdrq`, the Starter price id (`pkg:src/constants/pricing.ts:8-11`). `public.analytics` and `public.qr_configs` have 0 rows. - TEST SQL q3
- `migration.pre_remap_counts` shows 3 users with 1 catalogue each before the auth remap. - TEST SQL q5
- No other table holds content-like JSON; the only one is `public.catalogues.content`. - TEST SQL q4 (information_schema scan)
- Planned metrics that cannot be computed on TEST: blocks per type, share of catalogues per type, blocks per catalogue, items per items block, items without an image or description, the status and plan breakdowns, and the text-block heuristics for hours, address, contact, FAQ and promotions. All return 0 rows.

**Showcase supplement**
- Method:
  - The 7 URLs come from `app:src/constants/marketing.ts:7-16`. Pages were fetched from `https://www.quicktalog.app/catalogues/<slug>` on 2026-10-01; all returned HTTP 200.
  - Each page's inline Next.js flight data was parsed for its `content`, `header`, `footer`, `contact` and `appearance` objects.
  - Only counts and booleans were kept. No contact data was copied. PROD DB was not touched.
  - The sample is **curated by marketing and not random**.
- Findings:
  - **Blocks: 36.** 31 `category` (86%) and 5 `text` (14%); 0 `items`, `container`, `divider`, `embedding` or `custom_code`.
  - **Blocks per catalogue:** 8, 5, 7, 3, 5, 4, 4 (median 5).
  - **Share of catalogues using a type:** category 7/7, text 5/7, every other type 0/7.
  - **Items:** 200 in total. Per items block: min 1, median 5, mean 6.5, max 40 (31 blocks). Per catalogue: 25, 30, 61, 13, 15, 16, 40.
  - **Item fields:** 0/200 without an image, 8/200 (4%) without a description, 0 at price 0, 0 without a price, 0 with a unit, 0 on discount.
  - **Layouts** (31 items blocks): Side Image 17, Top Image 9, Carousel 5, Text Only 0.
  - **Text blocks:** all 5 sit at position 0 (first block), all are unnamed, and they are 12–83 words long.
    - Content types (paraphrased): a restaurant welcome, a fashion brand statement, a one-line catalogue description, a watch shop intro, and an IT shop intro.
    - Keyword heuristics: 1 of 5 matched a contact pattern; 0 matched hours, address, FAQ or promo.
    - All 5 contain `<font size="5">`, and the rendered DOM has 0 `<font>` tags.
  - **Header and footer:** 7/7 `default` (no branding). 0/7 have a contact phone or email, 0 socials, 0 partners, overlay off everywhere.
    - `default` is what `applyPlanToCatalogue` writes for plans without branding (`entitlements/catalogue.ts:17`).
    - Yet 5/7 exceed Starter's 15 items and 2/7 exceed its 5 sections. That fits downgraded or grandfathered accounts; the plan cannot be verified without PROD.
  - **Themes:** luxury 4, elegant 2, organic 1.
  - **Currency:** USD ×2, NGN, RSD, XOF, CAD, GTQ.
  - **Language:** `language` is `"eng"` on all 7, although at least 4 intros are in Spanish, Serbian or French. Price locale and `<html lang>` are therefore English for them.
  - **Source:** `builder` 6, `ai_prompt` 1.

### Inferences
- In real published pages, **the text block is overwhelmingly used as an intro or "about" paragraph at the top**, which is a hero/intro job. On these retail-heavy showcases it is not used for hours. Dividers, embeds and custom code were absent from all 7, though this may reflect plan level or curation.
- Every showcase item has a photo, and Side Image dominates the layouts. Media matters to these users, and image-free Text Only layout was unused.
- The language mismatch suggests owners never set `language`. Any locale-sensitive block (hours, days, prices) cannot rely on it without better defaults or detection.

### Gaps
- **No representative usage data is available.** TEST is empty, PROD was out of bounds, and the 7 showcases are curated and mostly retail (1 restaurant, 0 salons, gyms or clinics).
- How often real customers put hours, addresses or FAQs in text blocks is unknown; this needs a read-only PROD analysis if the owner approves.

---

## Q10. Target customer: ICP, segments and promised use cases

### Takeaway
Quicktalog speaks to **small, often non-English-speaking businesses worldwide**. Food and drink leads, followed by beauty and wellness, fitness, retail, and local services and trades. It promises a mobile-first catalogue, menu or price list shared by QR code or link, built with AI from a description, a website or a photo of a printed menu. The marketing also promises **durations, tiered pricing, packages, allergen and dietary tags, class timetables and portfolios**, which the block and Item model cannot express today.

### Cited Findings
- **Site metadata:** *"…Perfect for restaurants, salons, gyms, retail & more. No code required, mobile-friendly, QR code sharing."* - `app:src/constants/metadata.ts:7-8`
- **Home hero:** *"Create a Stunning Digital Catalogue in Minutes … Turn your services, menus, or products into an interactive, mobile-friendly digital catalog or price list."* - `app:src/components/home/Hero.tsx:36-46`
- **SEO keywords** include "price list", "service catalog", "product showcase", "menu catalog", "restaurant menu", "beauty salon services", "fitness gym classes", "café menu", "retail products", "spa services", "electronics catalog", "hospitality", "QR code sharing", "AI-powered creation", "OCR import" and "5 minutes setup". - `app:src/constants/index.ts:15-50`
- **Business types** (they drive AI copy tone), 11 in all: Food & Beverage, Beauty & Wellness, Health & Fitness, Retail & E-commerce, Professional Services, Home & Trades, Events & Hospitality, Education & Training, Automotive, Real Estate, Other. - `pkg:src/constants/catalogue.ts:81-143`
- **Home AI prompt examples:** a café, a hair salon ("prices per service"), a boutique, and a bike repair shop. - `app:src/constants/marketing.ts:33-50`
- **Showcases:** a restaurant, a fashion label, an auto-parts workshop, two watch shops, an electronics shop and a tech shop. - `marketing.ts:7-16`
- **Article "12 Businesses That Need a Digital Catalog"** - `app:src/content/articles/businesses-that-need-digital-catalog.tsx:14-16,77-230`. Segments and the job each is promised:
  - restaurants and cafés: daily specials;
  - food trucks: a moving location;
  - salons and spas: "every service, its duration, and its price";
  - gyms and studios: "class timetable … membership tiers … personal training packages";
  - boutiques;
  - artists and makers: a portfolio;
  - florists: seasonal photos;
  - real estate: "listings with photos and key details";
  - event planners: "packages, add-ons, and a few examples of past work";
  - hotels and B&Bs: "rooms, the rates, and the on-site extras";
  - home services: "common jobs with starting prices";
  - schools, clubs and nonprofits.
- **Restaurant guide FAQ:** *"Can I handle allergens and dietary tags? Yes. Mark a dish as vegetarian, vegan, or containing common allergens…"* - `app:src/content/articles/digital-menu-for-restaurants.tsx:283-287`. No tag or badge field exists (`pkg:src/types/catalogue.ts:132-142`).
- **Salon guide:** *"Service menus need durations, packages, and tiered pricing"*; "Duration next to each service"; "Tiered pricing for short, medium, and long hair…"; "Packages". - `app:src/content/articles/digital-service-menu-salons-spas.tsx:17,65,86-100,136-141`. None of these are Item fields.
- **Themes:** 5 of 7 theme descriptions target restaurants, venues, cafés or coffee shops. - `pkg:src/constants/general.ts:19-74`
- **Pricing copy by tier:**
  - Starter: "individuals and small businesses getting started";
  - Basic: "small businesses to digitalize their offer";
  - Pro: "growing businesses with multiple services";
  - Growth: "teams";
  - Premium: "enterprise-grade". - `pkg:src/constants/pricing.ts:12-13,45,77,109,141`
- **Agent framing:** scanned photos are "a printed menu, a price list, a flyer" (`app:src/agent/instructions.ts:79`). Photo examples are "espresso coffee cup" and "margherita pizza" (`:65`).
- **Docs:** *"Items are the core … Categories group items … Content blocks add text and dividers between items, with embeds and custom code on higher plans"*. *"Text blocks let you add a welcome note, opening hours, or a short story about the business."* - `app:src/content/docs/build-and-edit.tsx:48-50,109-116`
- **Global footprint:** 7 showcase currencies across the Americas, Africa and Europe; non-English content (Q9).

### Inferences
- The ICP's most frequent non-list needs are hours, location or map, contact and booking, an intro, photos or gallery, and service price qualifiers ("from", duration, on request). The segments named in marketing confirm this. None has a dedicated block or field today.
- The gap between promised and possible is largest for **service businesses** (salons, gyms, clinics, home services): prices are qualified or absent, durations matter, and booking is the key action. The current model was built for priced menu items.
- Clinics are named in the brief but appear nowhere in the code's marketing, business types or articles. "Health & Fitness" is the nearest business type.

### Gaps
- There is no quantitative split of real customers by segment. TEST holds no data; `businessType` distribution would need PROD.
- No customer interviews or support data were examined; that was out of scope for a codebase audit.
