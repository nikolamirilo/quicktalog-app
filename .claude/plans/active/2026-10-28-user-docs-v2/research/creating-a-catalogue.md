# Research: creating a catalogue

Read-only code research for end-user documentation. Every bullet ends with its evidence.

Paths without a prefix are relative to the app repo root `/Users/nikola/Desktop/Quicktalog/quicktalog-app`.
Paths starting `packages/` are relative to `/Users/nikola/Desktop/Quicktalog/quicktalog-packages/src`.

Creating a catalogue is **two separate screens**, not one wizard: a 4-field dialog that creates the row, and (once the builder opens) a template picker that fills the empty page. Nothing is published by either.

---

## Entry points (which button, which screen, which route)

- All of them funnel through one component pair: `CreateCatalogueButton` calls `openCreateCatalogue()` of the nearest `CreateCatalogueProvider`, which owns the create dialog and the plan-limit dialog — `src/components/catalogue/create/CreateCatalogueButton.tsx:34-63`, `src/components/catalogue/create/CreateCatalogueProvider.tsx:27-62`.
- **Dashboard (`/admin/dashboard`)** — the only create control is the round amber "+" floating button, bottom right. `aria-label="Create catalogue"`, `title="Create catalogue"`, a `Plus` icon, no text label — `src/components/dashboard/FloatingActionMenu.tsx:30-42`.
  - The dashboard page wraps the dashboard and the FAB in one provider, so the dialogs mount once — `src/app/admin/dashboard/page.tsx:77-85`.
  - The FAB is drawn at 60% opacity when the catalogue **or** traffic limit is reached, but it is never disabled — `src/components/dashboard/FloatingActionMenu.tsx:35`, limit computed at `src/app/admin/dashboard/page.tsx:69-74`.
  - The dashboard's empty catalogue list is plain text with no button: "No catalogues created yet." — `src/components/dashboard/overview/CatalogueGrid.tsx:32-38`.
- **Home page (`/`), hero** — large button labelled **"Start Creating Now"** (min width 224px) next to a "Try Demo" outline button — `src/components/catalogue/create/CreateCatalogueButton.tsx:58,74`, `src/components/home/Hero.tsx:61-72`.
- **Home page, "Let AI do the work" card** — button labelled **"Try AI"** with a right arrow; it opens exactly the same create dialog (the typed example prompt above it is decoration and is not carried into the app) — `src/components/home/ai/AiShortcut.tsx:87-93`, `src/components/home/ai/AiPromptBox.tsx:10-53`.
- One provider for the whole home page, so both home buttons share one dialog — `src/app/(site)/(with-footer)/page.tsx:23,73`.
- **Marketing CTAs are not create buttons.** "Start Creating Now" / "Create your catalogue" / "Create Your Catalogue Now" in the problems, how-it-works, pricing and CTA sections are plain links to `/auth?mode=signup` — `src/components/general/SignupButton.tsx:10-24`, used at `src/components/home/problems/ProblemSection.tsx:28`, `src/components/home/HowItWorks.tsx:80`, `src/components/home/CTA.tsx:17`, `src/app/(site)/(with-footer)/pricing/page.tsx:62`.
- There is **no** create entry in the navbar or user menu (only "Dashboard") — `src/components/navigation/AuthLinks.tsx:79-84,153-154`, `src/components/navigation/UserMenu.tsx:88-90`.
- What `openCreateCatalogue` does, in order — `src/hooks/useCreateCatalogue.ts:55-68`:
  1. not signed in → `router.push("/auth?mode=signup")`, no dialog — `:10,56-59`;
  2. `usage.catalogues >= currentPlan.features.catalogues` → the plan-limit dialog — `:60-63`;
  3. otherwise `resetCatalogue()` then open the create dialog — `:64-67`.
- The server-side create is the server action `createCatalogue` — `src/actions/catalogue.ts:261-332`. There is no create API route; the only two catalogue INSERTs in the app are create and duplicate (`src/actions/catalogue.ts:293`, `:230`).
- `src/app/api/items/route.ts` and `src/app/api/items/[name]/route.ts` are **not** part of creating: the first lists published catalogue names for `generateStaticParams` and the sitemap (`src/app/api/items/route.ts:6-13`), the second returns one published catalogue (404 for drafts) (`src/app/api/items/[name]/route.ts:7-25`). Name availability no longer goes through them (see "Name vs URL").

## Screen 1: the "Create a Catalog" dialog

- Title **"Create a Catalog"**; description **"Please enter the following information to get started"** — `src/components/catalogue/create/InitCatalogueModal.tsx:112-115`.
- Top-right round **×** button, `aria-label="Close"`, disabled while creating — `:117-127`.
- Four fields in a one-column grid that becomes two columns from the `sm` breakpoint, 14px gaps; order: **Catalogue Name, Language, Currency, Business Type** — `:130-186`.
- Under the fields, the URL preview box; under that, the footer — `:188-203`.
- Footer buttons, left to right: **Cancel**, then the primary **"Create Catalog"** (label becomes **"Creating..."** while the server answers) — `:190-203`.
- The primary button is disabled while loading or while the form is invalid — `:198`.
- `handleConfirm` calls `event.preventDefault()` so the dialog stays open during the request; the hook closes it on success and the name hint is re-checked after a failure — `:91-100`.
- Every opening resets the name field; the values themselves were already reset by the opener — `:78-81`, `src/hooks/useCreateCatalogue.ts:65`.
- Esc (or ×, or Cancel) closes it; clicking the dimmed background does not, because it is a Radix **alert** dialog — `:103-108`, `src/components/ui/alert-dialog.tsx:28-48`.
- Form validity = non-blank name **and** language **and** currency **and** business type **and** no name error — `:83-89`. It does **not** wait for the availability check to finish.

### Field by field

| Field | Label | Control | Required | Default |
|---|---|---|---|---|
| Name | "Catalogue Name" + red `*` | text input, `maxLength=60`, placeholder "e.g. Burger House", `autoComplete="off"` | yes (asterisk + `aria-required`) | empty |
| Language | "Language" | searchable select, placeholder "Select language", search box "Search languages" | yes (by form validity) | English (`eng`) |
| Currency | "Currency" | searchable select, placeholder "Select currency", search box "Search currencies" | yes (by form validity) | Euro (`EUR`) |
| Business Type | "Business Type" | plain select, placeholder "Select business type" | yes (by form validity) | none — must be chosen |

- Name label, asterisk, placeholder and 60-character cap — `src/components/modals/CatalogueNameField.tsx:12,52,56,70-91`.
- Language/currency/business-type labels, placeholders and search placeholders — `src/components/catalogue/create/InitCatalogueModal.tsx:139-185`.
- Defaults come from `defaultCatalogueData`: `language: "eng"`, `currency: "EUR"`, `businessType: ""`, `content: []`, `status: "draft"` — `packages/constants/catalogue.ts:3-11`.
- Language list: 32 OCR languages (English, Spanish, French, German, Italian, Portuguese, Russian, Chinese Simplified/Traditional, Japanese, Korean, Arabic, Hindi, Thai, Vietnamese, Dutch, Swedish, Norwegian, Danish, Finnish, Polish, Czech, Hungarian, Turkish, Hebrew, Ukrainian, Bulgarian, Croatian, Slovak, Slovenian, Serbian Cyrillic, Serbian Latin) — `src/constants/ocr.ts:10-43`, mapped to options at `src/components/catalogue/create/InitCatalogueModal.tsx:38-40`.
- The language doubles as the Tesseract OCR language for photos attached in chat later — `src/hooks/useCatalogueChat.ts:60-61`, `src/utils/ocr.ts:199-210`.
- Currency list: 156 currencies by full name (e.g. "Euro"), the three-letter code is searchable but not shown — `src/constants/index.ts:52-217` (`EUR` at `:99`), keyword wiring at `src/components/catalogue/create/InitCatalogueModal.tsx:42-48`, hidden-keyword contract at `src/components/ui/searchable-select.tsx:22-27`.
- Business types, 11 options in this order: Food & Beverage, Beauty & Wellness, Health & Fitness, Retail & E-commerce, Professional Services, Home & Trades, Events & Hospitality, Education & Training, Automotive, Real Estate, Other — `packages/constants/catalogue.ts:100-162`.
- Two retired values (`online-sales`, `services`) are still resolved for older catalogues so the select shows Retail / Professional Services — `packages/constants/catalogue.ts:171-183`, used at `src/components/catalogue/create/InitCatalogueModal.tsx:172`.
- The business type only feeds the AI's writing style; it is a prompt clause, nothing else — `packages/constants/catalogue.ts:185-192`.
- Searchable selects: a search box pinned at the top of the open list, filtered alphabetically, Enter picks the first match, "No matches" when nothing matches — `src/components/ui/searchable-select.tsx:41-152`.

### Name rules and the exact messages

- Allowed characters: letters, numbers and spaces only — regex `/^[a-zA-Z0-9\s]*$/` — `src/hooks/useCatalogueName.ts:23`.
- "Name must only contain letters, numbers, and spaces (no special characters)." — shown for anything else — `src/hooks/useCatalogueName.ts:36-38`.
- "Name cannot be just spaces." — shown when the value is non-empty but trims to nothing — `src/hooks/useCatalogueName.ts:33-35`.
- "This name is already in use. Please choose a different name." — shown when the server says the slug is taken — `src/hooks/useCatalogueName.ts:20-21`, used at `src/hooks/useCatalogueNameField.ts:91`.
- "Checking availability…" — while the answer for the current text is pending — `src/components/modals/NameHint.tsx:40`.
- "Great! This name is available." — only when the server confirmed this exact trimmed name is free — `src/components/modals/NameHint.tsx:44`, `src/hooks/useCatalogueNameField.ts:120-122`.
- The hint line appears only once the user has typed, the field is non-empty, and there is an error, a pending check or a confirmed availability — `src/components/modals/CatalogueNameField.tsx:62-66`.
- The check fires 400 ms after the last keystroke — `src/hooks/useCatalogueName.ts:26`, `src/hooks/useCatalogueNameField.ts:62-85`.
- Checks only run while the dialog is open — `src/components/catalogue/create/InitCatalogueModal.tsx:70-75`, `src/hooks/useCatalogueNameField.ts:60`.
- An answer for an older name can never show as current (it is derived, not stored) — `src/hooks/useCatalogueNameField.ts:87-89`.
- If the check itself fails (rate limit, network), no hint is shown at all and the server decides on submit — `src/hooks/useCatalogueNameField.ts:69-78,120-122`.
- Server-side availability: `checkCatalogueName` slugifies, then asks the definer function `private.catalogue_name_available`, returning one boolean so names cannot be enumerated — `src/actions/catalogue.ts:416-438`.
  - Its own refusals (never surfaced to the user, they only suppress the hint): "Unauthorized" `:420`, "Invalid name" for a non-string or over 200 characters `:421-423`, "Too many requests" `:424-426`.
  - Rate limit: 60 checks per minute per user — `src/lib/rate-limit.ts:10`.
- **Names are globally unique across all users**, drafts included — the SQL checks the whole `catalogues` table — `supabase/migrations/20260921181105_private_entry_points.sql:11-22`; final guard is the unique constraint `catalogues_name_key` — `packages/drizzle/migrations/schema.ts:154`.
- **No reserved-name list exists** anywhere in the app or the migrations (searched; nothing).
- The database also enforces the slug shape and length: `name ~ '^[a-z0-9]+(-[a-z0-9]+)*$'` and `length(name) <= 100` — `packages/drizzle/migrations/schema.ts:161`.

## Name vs URL slug

- The URL preview box shows `"Your URL will be"` and `${NEXT_PUBLIC_BASE_URL}/catalogues/<slug>`, with `…` as the slug until something is typed — `src/components/modals/CatalogueNameField.tsx:15-32`; the box itself is a dashed-border panel with a globe icon — `src/components/modals/UrlPreview.tsx:3-23`.
- Slug rule (`generateUniqueSlug`): lowercase, trim, every run of whitespace → one `-`, collapse repeated `-`, strip leading/trailing `-`. Nothing else is stripped and no uniqueness suffix is added despite the name — `packages/helpers/index.ts:26-35`.
  - So "Burger House" → `burger-house`; "  Cafe   42 " → `cafe-42`.
- The browser's preview is only a preview: the server slugifies the submitted name again and that is what is stored as `name` — `src/actions/catalogue.ts:268,300`, comment at `src/components/catalogue/create/InitCatalogueModal.tsx:58-62`.
- An empty slug is refused: "Invalid catalogue name" — `src/actions/catalogue.ts:268-269`.
- **The slug cannot be changed afterwards.** `name` is not in `CATALOGUE_EDITABLE_FIELDS`, so it never reaches an UPDATE; save and publish both pass the payload through `pickEditable` — `src/utils/db/columns.ts:32-52`, `src/actions/catalogue.ts:295-297,463-465`.
- Nothing in the app renames a catalogue, so there is no old link to break; the only way to a different address is **Duplicate** under a new name (then delete the old one) — `src/actions/catalogue.ts:190-259`.
- The slug is the identity everywhere afterwards: the builder route `/admin/<slug>/builder`, the public page `/catalogues/<slug>`, the preview `/catalogues/<slug>/preview`, the QR editor and the share link — `src/hooks/useCreateCatalogue.ts:45`, `src/components/catalogue/builder/useBuilderActions.ts:93,135`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:112,120,146`.

## What happens on "Create Catalog" (server, in order)

1. Identity from the session, else `{ success: false, error: "Unauthorized" }` — `src/actions/catalogue.ts:265-266`.
2. Slug derived; empty → "Invalid catalogue name" — `:268-269`.
3. Plan read with the user row locked, so two parallel clicks cannot both pass the quota — `src/lib/entitlements/plan.ts:36-47`, called at `src/actions/catalogue.ts:272`.
4. Quota: `count(catalogues of this user) < plan.features.catalogues`, else **"You have reached the catalogue limit of your plan"** — `src/lib/entitlements/plan.ts:49-67`, `src/actions/catalogue.ts:273-278`.
5. Custom theme colours re-sanitised, then `applyPlanToCatalogue` strips everything the plan does not include (custom header/footer type, tracking ids, advanced style, glass, background, custom theme, newsletter) — `src/actions/catalogue.ts:280-283`, `src/lib/entitlements/catalogue.ts:28-73`.
6. `contentWithinPlan(shaped, null, tier)` — judged from scratch; its reason is returned, falling back to "Plan limit reached" — `src/actions/catalogue.ts:284-290`.
7. INSERT with only the editable fields plus `name: slug`, `status: "draft"`, `userId` from the session, `tags: []` — `:292-303`. No row → "Failed to insert catalogue" — `:306`.
8. The new row is written to the Redis draft cache (30-day TTL, keyed by catalogue id) — `:312-317`, `src/lib/catalogue/draft-cache.ts:9,17-18,74-81`.
9. ISR revalidation for the slug plus the dashboard — `:318-319`.
10. A unique-constraint violation anywhere above becomes **"A catalogue with this name already exists"**; any other throw becomes **"An unexpected error occurred"** — `:321-331`.

## What the user sees after creating

- Success toast: ``Catalogue "<slug>" created successfully!`` — note it prints the **slug** returned by the server, not what was typed — `src/hooks/useCreateCatalogue.ts:40`, slug stored at `src/actions/catalogue.ts:300`.
- Then: dialog closes, user data is refreshed (so usage counters are current), and the browser goes to **`/admin/<slug>/builder`** — `src/hooks/useCreateCatalogue.ts:43-45`.
- Failure: `toast.error(result.error || "Failed to create catalogue")`, the dialog stays open with the values intact, and the availability hint is re-checked — `src/hooks/useCreateCatalogue.ts:35-38`, `src/components/catalogue/create/InitCatalogueModal.tsx:96-99`.
- Unexpected client/network throw: `toast.error("An unexpected error occurred")` — `src/hooks/useCreateCatalogue.ts:47-49`.
- The builder page re-checks identity (signed-out → `/auth?next=/admin/<slug>/builder`) and ownership (not the owner → Next.js 404) — `src/app/admin/[name]/builder/page.tsx:8-21`, `src/lib/auth/session.ts:12-16`, `src/actions/catalogue.ts:389-413`.

## Screen 2: the "Choose a Template" dialog

- It opens **by itself** the first time a catalogue with zero content blocks is loaded in the builder, i.e. right after creating — `src/components/catalogue/modals/SelectTemplateModal.tsx:68-77`; mounted only in edit mode — `src/components/catalogue/view/Catalogue.tsx:335`.
- Title **"Choose a Template"**, description **"Start with a pre-made layout or build from scratch"**, round ghost **×** (`aria-label="Close"`) top right — `src/components/catalogue/modals/SelectTemplateModal.tsx:89-108`.
- Dialog frame: `max-w-5xl`, `max-h-[calc(100dvh-24px)]`, header fixed, body scrolls — `:85-112`.
- While it is open, Quick AI's pill and the editor sidebar are hidden so the two do not fight for the screen — `:38-50`.
- It can be reopened any time from the builder's **Templates** control (rail on desktop, bottom bar on phones) — `src/components/catalogue/builder/useBuilderActions.ts:155-165`, `docs/architecture/builder.md:15-16`.
- Three cards in a `grid-cols-1 md:grid-cols-3` radio group labelled "Templates", in this order: **Quick Start** (badge "Recommended", top right), **Standard Catalog**, **Start from Scratch** — `src/components/catalogue/inputs/TemplatesInput.tsx:32-65,104-140`.
- **Quick Start is pre-selected** — `:72`. Arrow keys move and select like native radios — `:77-81`, `src/hooks/useRadioKeys.ts:4-36`.
- Card layout: a 1.5px-bordered card; on phones a horizontal row (thumbnail ~28–32% wide on the left, text right); from `md` it becomes a centred column with the title above the image and the text below — `:124-187`. Selected card: amber border plus a 3px ring — `:125-127`. "Start from Scratch" is dashed when unselected and shows a big `+` instead of a thumbnail — `:128-131,150-153`.
- Each card shows title, one-line description and dot-separated detail chips — `:159-187`.
- Thumbnails: `/images/templates/quick-template.png`, `/images/templates/standard-template.png` (both exist in `public/images/templates/`) — `:38,51`.
- One primary button under the grid, label **"Select template"**, sticky to the bottom edge on phones — `:193-197`.
- Pressing it applies the chosen template to the draft and closes the dialog — `:83-100`, `src/components/catalogue/modals/SelectTemplateModal.tsx:79-81`.
- If the catalogue already has content, a confirm dialog appears first: title **"Change template?"**, body **"This will change your existing content. Please save it first to not lose progress."**, buttons **Cancel** and a destructive **"Save & continue"** which saves the current draft and only then swaps the content — `:90-100,199-222`.

## Every template in `src/constants/catalogueTemplates.ts`

The file holds **two** content templates (plus the blank option, which lives in the picker). Templates are content only — they set no theme, colours, heading, logo or settings.

- Applying one mints fresh ids and renumbers sections and items from 0, so two catalogues from the same template never share ids — `src/constants/catalogueTemplates.ts:4-22`; `docs/architecture/builder.md:101-102`.

### 1. "Quick Start" — `placeholderTemplate`

- Card: title **"Quick Start"**, badge **"Recommended"**, description **"Everything you need to start selling right away"**, chips **"2 categories"**, **"6 items"** — `src/components/catalogue/inputs/TemplatesInput.tsx:33-43`.
- Content: 2 items sections, both with a visible heading, both expanded, 3 items each, **all prices 0**, every item on the stock placeholder image — `src/constants/catalogueTemplates.ts:307-420`.
  - Section 1 "Core Offerings", layout `variant_1`: Standard Option, Enhanced Option, Premium Option — `:308-363`.
  - Section 2 "Additional Selections", layout `variant_2`: Flexible Choice, Customizable Choice, Optional Add-On — `:364-419`.
- Chips match the content exactly (2 sections, 6 items).

### 2. "Standard Catalog" — `standardTemplate`

- Card: title **"Standard Catalog"**, no badge, description **"A flexible layout that works for everyone"**, chips **"4 categories"**, **"15 items"** — `src/components/catalogue/inputs/TemplatesInput.tsx:44-54`.
- Content: **5** items sections, 15 items, example prices between 2.49 and 10.99, every item on the stock placeholder image, no discounts — `src/constants/catalogueTemplates.ts:24-305`.
  - "Featured Collection", `variant_1`, heading shown, 4 items: Signature Selection 5.99, Classic Choice 7.49, Specialty Pick 6.99, Premium Highlight 10.99 — `:25-95`.
  - "Main Offerings", `variant_2`, heading shown, 3 items: Standard Package 8.99, Popular Bundle 9.99, Complete Set 10.99 — `:96-151`.
  - "Limited Additions", `variant_4`, heading shown, 2 items: Seasonal Option 6.49, Exclusive Item 5.99 — `:152-192`.
  - "Premium Range", `variant_1`, heading shown, 4 items: Signature Premium 4.99, Deluxe Option 5.49, Exclusive Edition 5.99, Luxury Pick 5.49 — `:193-263`.
  - "Complementary Extras", `variant_3`, **heading hidden** (`showHeading: false`), 2 items: Essential Add-On 3.99, Optional Upgrade 2.49 — `:264-304`.
- The chip says "4 categories" while the template has 5 sections — four of them draw a heading, the fifth does not. See Contradictions.
- All 15 items and 5 sections sit exactly on the Starter plan's ceiling (5 sections / 15 items) — `packages/constants/pricing.ts:23,32`.

### 3. "Start from Scratch" — not a template

- Card: title **"Start from Scratch"**, description **"Build your catalog exactly the way you want it"**, chip **"Blank Catalogue"**, `+` glyph instead of a thumbnail, dashed border — `src/components/catalogue/inputs/TemplatesInput.tsx:55-64,150-153`.
- Value is `defaultCatalogueData.content`, i.e. `[]` — `:63`, `packages/constants/catalogue.ts:11`.
- From `md` the card's title is only drawn in the lower text block (the top title row renders empty for this card) — `:142-144`.

### The theme every new catalogue gets

- Not from the template: `defaultCatalogueData.appearance.theme` is `{ type: "standard", name: "theme-monochrome" }`, with `fontFamily: "inter"`, `contentFontSize: "medium"`, `borderRadius: 12`, `shadow: "low"`, glass off, background off, search off — `packages/constants/catalogue.ts:23-57`.
- Header and footer both start as `type: "default"` with the CTA block enabled but empty, email and phone CTAs on, newsletter off, partners off — `packages/constants/catalogue.ts:64-92`.

## Starting method: a template or a blank page

- Exact labels the user selects: **"Quick Start"**, **"Standard Catalog"**, **"Start from Scratch"**, confirmed with **"Select template"** — `src/components/catalogue/inputs/TemplatesInput.tsx:35,46,58,196`.
- What happens next: the content is written into `CatalogueContext` only — `updateCatalogue({ content: templateToUse.value() })` — and the dialog closes — `:83-88`.
- **Nothing is saved to the server at this point.** There is no timer autosave; the draft is persisted only by Save, by Preview (which saves first), by "Save & continue" in the template-change confirm, by keeping AI changes, or by the upgrade flow — `src/hooks/useSaveDraft.ts:8-25` and its only callers `src/hooks/useKeepAiChanges.ts:8`, `src/hooks/useUpgrade.ts:13`; `src/components/catalogue/builder/useBuilderActions.ts:49-95`.
- What the user ends up with: a `draft` catalogue in the builder showing the template's sections and items, every item on the stock placeholder photo, an **empty heading**, and example prices.
- The empty heading matters: Preview and Publish stay **disabled** until the content is non-empty, the name is non-empty and the heading has text — `src/components/catalogue/builder/useBuilderActions.ts:75-78`, `src/lib/catalogue/heading.ts:45-47`. The heading box shows the placeholder **"+ Add Heading"** — `src/components/catalogue/inputs/heading/EditableHeading.tsx:6`.
- Below the content, edit mode shows the **"Add Section"** tile with the sub-line "Items, text, a divider, an embed or a custom visual" — `src/components/catalogue/inputs/ContentBlockButton.tsx:24-28`; at the plan's section ceiling it opens the sections limit dialog instead of the add dialog — `src/components/catalogue/view/Catalogue.tsx:280-294`.

## Starting method: AI (Quick AI)

- Entry label: the floating **"Quick AI"** pill, bottom left on desktop; on phones the bottom bar's **Ask AI** button — `src/components/catalogue/chat/CatalogueChat.tsx:252-263`, `docs/architecture/builder.md:15-16,22`.
- Panel header: **"Quick AI"** with the subtitle **"Ask for any change to this catalogue"**, a credit meter, a "Clear conversation" button (only once there are messages) and **"Minimize Quick AI"** (`title="Minimize, your conversation is kept"`) — `:305-355`.
- Empty state: heading **"What should we change?"**, then: "Describe it in your own words - add or remove sections and items, rewrite text, adjust prices or restyle the whole catalogue. Attach or paste photos of a printed menu or price list and it will read them for you." and "Tip: the more detail you give - item names, prices, sizes and the order you want them in - the better the result." — `:361-377`.
- Under **"Try one of these"**, four one-tap suggestions: "Add a new section with 6 items", "Make every description shorter and friendlier", "Raise every price by 10%", "Switch the theme to something more elegant" — `:38-43,378-400`.
- Composer: textarea `aria-label="Message Quick AI"`, placeholder **"Describe the change you want…"**, attach button, send button; hint line "Enter to send · Changes apply to the builder - review them, then save" — `:459-494`.
- While it works: a three-dot bubble reading **"Working on it…"** — `:412-419`; multi-part requests show a ticking checklist instead — `:408-410`.
- What the user ends up with: edits applied to the **draft on screen** and held for review — the review bar's Keep saves them through `useSaveDraft`; Undo throws them away — `:226-242`, `src/hooks/useKeepAiChanges.ts`, `docs/architecture/builder.md:106-110`.
- Cost: a turn charges 2 credits as a base, +1 per extra planned task, +2 per page read; a turn that changed nothing is refunded — `src/lib/ai/pricing.ts:9-19`.
- Out of credits: the ask is blocked client-side and the AI-credits limit dialog opens; the server's own check is authoritative — `src/hooks/useCatalogueChat.ts:202-214,88-92`, `src/components/catalogue/chat/CatalogueChat.tsx:500-506`.
- Hitting the plan's item ceiling mid-turn opens the items limit dialog — `src/hooks/useCatalogueChat.ts:112-124`, `src/components/catalogue/chat/CatalogueChat.tsx:507-515`.
- Generic failure line: **"Something went wrong. Try again."** (replaced by the server's message when it sent one) — `src/components/catalogue/chat/CatalogueChat.tsx:422-435`, `src/hooks/useCatalogueChat.ts:32-41`.
- Rules the model is held to that matter for documentation: it must never invent items, prices or contact details, must ask when a request is ambiguous (`src/agent/core/instructions.ts:58`), writes prices as plain numbers in the catalogue's currency and all text in the catalogue's language (`:110-111`), and is told the plan's whole-catalogue item/section counts and refuses past them (`:59,154-197`).

## Starting method: photos of an existing catalogue (OCR)

- Entry: the image button inside the Quick AI composer — `title="Attach photos to read text from, or paste a screenshot (up to 10)"`, screen-reader label "Attach images", accepts `image/*`, multiple — `src/components/catalogue/chat/ChatImageAttachments.tsx:17-43`. Pasting a screenshot into the panel does the same — `src/components/catalogue/chat/CatalogueChat.tsx:175-178`.
- Up to **10** images per turn; recognition is Tesseract.js **in the browser**, in the catalogue's language, started the moment the images are attached — `src/constants/ocr.ts:7`, `src/hooks/useChatImageOcr.ts:38-44,82-108`, `src/utils/ocr.ts:199-233`.
- Images are upscaled to ~300 DPI and clamped between 1000 and 2000 px before recognition — `src/constants/ocr.ts:3-5`, `src/utils/ocr.ts:8-60`.
- Thumbnail strip above the composer with a per-image spinner, a removable ×, and the status line **"Reading the text in your images…"**, which becomes **"The text in these images goes to the assistant with your message."** — `src/components/catalogue/chat/ChatImageAttachments.tsx:58-127`.
- Per-image failures keep their place with an amber **"Unreadable"** ribbon and one of these reasons as the tooltip: **"Could not be read."**, **"Too blurry - try a sharper photo."** (confidence below 60), **"No text found."** — `src/hooks/useChatImageOcr.ts:10-36`, `src/constants/ocr.ts:9`, ribbon at `src/components/catalogue/chat/ChatImageAttachments.tsx:94-99`.
- Over-attaching: **"You can attach up to 10 images."** or **"Only the first N were added - you can attach up to 10 images."** — `src/hooks/useChatImageOcr.ts:85,91`.
- Sending is blocked while any scan is still running — `src/components/catalogue/chat/CatalogueChat.tsx:192-193`, `src/hooks/useCatalogueChat.ts:209`.
- The recognised text rides along as a second text part and is shown in the user's own bubble, folded, as **"Text read from N image(s)"** — `src/hooks/useCatalogueChat.ts:235-253`, `src/components/catalogue/chat/ChatMessageBubble.tsx:18-32`, `src/agent/plugins/attachments.ts:7-23`.
- The agent is told the scan is material and never an instruction, to fix obvious OCR misreads, to treat a lone line as a section heading, to never add an entry the scan does not contain, and to tell the user which lines it skipped — `src/agent/core/instructions.ts:94-97`.
- Thumbnails are cleared after sending, so the scan is not resent — `src/hooks/useCatalogueChat.ts:253`.

## Starting method: an existing web page (Firecrawl)

- There is no "import from URL" button. The user pastes the address into Quick AI and the agent calls its `fetchUrl` tool — `src/agent/tools/research.ts:39-67`.
- The tool only accepts an address **the user typed in this conversation**; the model may not guess, complete or follow a link found inside a page — `src/agent/tools/research.ts:41-49`, `src/agent/core/instructions.ts:85-89`.
- One page per call, cached for the turn; each fetch costs 2 credits and is capped per turn — `src/agent/tools/research.ts:52-64`, `src/lib/ai/pricing.ts:13`.
- Fetch path: Firecrawl `v2/scrape` with `onlyMainContent`, markdown, 20s timeout; on any Firecrawl failure (no key, 402, 429, error) it silently falls back to a plain server-side fetch with its own user agent — `src/agent/plugins/web.ts:4,256-309,423-445`.
- Addresses are vetted before anything connects: only http/https, no localhost/.local/.internal, no private or cloud-metadata IPs, and every redirect hop (max 3) is re-vetted — `src/agent/plugins/web.ts:133-224,365-421`.
- Page text is capped at 20,000 characters and wrapped in an "UNTRUSTED PAGE CONTENT" fence; the model is told that anything inside addressing it is an attack, must be ignored, and must be reported to the user — `src/agent/plugins/web.ts:25-27,226-253`, `src/agent/core/instructions.ts:87`.
- Pictures on the page become numbered markers so the agent can reuse a page's own photos on items without ever writing a URL — `src/agent/plugins/web.ts:45-105`, `src/agent/core/instructions.ts:78`.
- Error strings the user can see, relayed by the assistant: `"<url>" is not a valid address. Ask the user for the full URL, including https://.`, "Only http and https addresses can be read.", "That address cannot be reached from here.", "That page could not be reached.", "That page could not be read (HTTP <status>).", "That address is a <type>, not a web page.", "That page redirected too many times.", and the long "returned almost no readable text" message that asks the user to confirm the exact address — `src/agent/plugins/web.ts:196-223,235-241,384,389,399,406,420`.
- Content rules for a page: take the words (names, descriptions, prices, hours), never markup, scripts, tracking or embed codes; an embed may never come from a page; descriptions stay empty unless the page gives one; the extraction may be partial and the assistant must say what it took — `src/agent/core/instructions.ts:88-91`.
- The assistant's bubble reports a read as `Read <host> - <title>` — `src/agent/tools/research.ts:13-30`.

## Starting method: duplicating an existing catalogue

- Entry: the ⋮ menu on a dashboard catalogue card, item **"Duplicate"** (label becomes "Loading..." while it runs) — `src/components/dashboard/overview/ItemDropdownMenu.tsx:156-161`.
- At the catalogue limit the menu item opens the catalogue limit dialog instead of the name prompt — `src/hooks/useDuplicateCatalogue.ts:31-40`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:259-265`.
- Dialog (small, 440px): title **"Duplicate Catalogue"**, description **"Please provide a name for the catalogue"**, one field labelled **"Name"** with placeholder "Enter name...", the same live availability hint and URL preview, buttons **Cancel** and **Confirm** ("Duplicating..." while it runs); Enter confirms — `src/components/dashboard/overview/DuplicateCatalogueDialog.tsx:33-77`, size at `src/components/modals/AppDialog.tsx:13`.
- Unlike the create dialog, Confirm is blocked while the availability check is still running — `src/components/dashboard/overview/DuplicateCatalogueDialog.tsx:33-37`.
- Server: the typed name is only a starting point — it is slugified, and `-copy`, then `-2`…`-20` suffixes are tried until one is free; the copy is inserted as `status: "draft"`, re-judged against the plan from scratch (quota, sections, items, gated block types) — `src/actions/catalogue.ts:190-259`.
- Toasts: ``Catalogue "<slug>" created.`` on success; **"Could not duplicate this catalogue. Your plan may not allow another one."** with a **"View plans"** action on a server `null`; **"Failed to duplicate the catalogue."** on a throw — `src/hooks/useDuplicateCatalogue.ts:55-73`.

## Plan limits that block creating

- Quota per plan (`features.catalogues`) — `packages/constants/pricing.ts`:

| Plan | Catalogues | Sections/catalogue | Items/catalogue | AI credits/month | Pageviews/month |
|---|---|---|---|---|---|
| Starter (id 0) | 1 | 5 | 15 | 15 | 500 |
| Basic (id 1) | 1 | 8 | 30 | 50 | 2,000 |
| Pro (id 2) | 6 | 15 | 100 | 150 | 5,000 |
| Growth (id 3) | 20 | 30 | 200 | 300 | 15,000 |
| Premium (id 4) | 50 | 50 | 300 | 600 | 40,000 |
| "German Silva Custom Plan" (id 5, type `custom`) | 1 | 20 | 200 | 50 | 4,000 |

Evidence: `packages/constants/pricing.ts:16,23,32,18,22` (Starter), `:47,62,63,49,61` (Basic), `:78,93,94,80,84` (Pro), `:109,124,125,111,123` (Growth), `:140,155,156,142,154` (Premium), `:171,186,187,173,185` (custom).

- The count includes **drafts and inactive catalogues** — both the client gate (`usage.catalogues` from `private.my_usage()`, a plain `count(*)` of the user's rows) and the server check (`countCatalogues`) — `supabase/migrations/20260929120000_schema_consistency.sql:490`, `src/lib/users/my-user-data.ts:91-98`, `src/lib/entitlements/plan.ts:49-67`.
- Client gate: at or over the limit the create dialog never opens — the limit dialog opens instead — `src/hooks/useCreateCatalogue.ts:60-63`.
- Server gate (authoritative): "You have reached the catalogue limit of your plan" — `src/actions/catalogue.ts:273-278`.

### Exact text of the catalogue limit dialog

Shown with `type="catalogue"`, `currentPlan` = the user's plan, `requiredPlan` = `getRequiredPlan(plan, "catalogue")` — `src/components/catalogue/create/CreateCatalogueProvider.tsx:50-60`.

- Amber icon tile (layers glyph), then a **×** that closes the dialog — `src/components/modals/limits/LimitsModalHeader.tsx:34-56`, `src/components/modals/limits/limitContent.ts:28-42`.
- Title: **"Need More Catalogues?"** — "More " is included whenever the current limit is above 0, which it always is for catalogues — `src/components/modals/limits/LimitsModalHeader.tsx:28-62`.
- Description: **"Upgrade your plan to unlock more features and take your digital catalogues to the next level."** — `:63-67`.
- Comparison strip: left column "Current plan" with the number, the unit ("catalogue"/"catalogues") and the plan name; a right arrow; right column "Required plan", highlighted — `src/components/modals/limits/LimitUpgradeComparison.tsx:21-53,106-130`.
- Below it, in an amber panel: **"What You'll Get with <plan>"** and a tick list built from the required plan: "<n> catalogues with <n> sections and <n> items per catalogue to manage all your product lines", "<n> AI credits per month", **"Custom Branding"** (only when the current plan lacks branding and the next one has it), "<n> page views per month to reach more customers", **"Newsletter feature"** to keep customers engaged (only when the next plan includes it) — `:71-99,132-148`.
- Primary button: **"Upgrade to <plan> Now"**, which saves the builder draft first and then goes to pricing — `:163-172`, `src/hooks/useUpgrade.ts`.
- On the top plan (current limit equals next limit and the same plan id) the dialog switches to: right column "TBD · Custom Plan", panel **"Purchase Custom Plan"** / "Get limits and features fully tailored to your needs. Contact our team to get more information.", and the button becomes **"Contact us Now"** linking to `/contact` — `:101,121-139,152-161`.
- Which plan is offered: the first standard plan with a strictly larger allowance, else the last standard plan; a custom plan is compared against all standard plans — `src/lib/entitlements/required-plan.ts:3-46`. For catalogues that means **Starter → Pro** and **Basic → Pro** (Basic also allows only 1), Pro → Growth, Growth → Premium, Premium → itself (the custom-plan variant above).
- The description text that `limitContent` supplies for this type is not drawn by this dialog's header (the header uses its own copy), but it exists: "Your business is growing! Get <n> catalogues to manage all your product lines in one place and serve more customers." — `src/components/modals/limits/limitContent.ts:105-115`, header copy at `src/components/modals/limits/LimitsModalHeader.tsx:63-67`.
- This dialog has **no** `onOpenChange`, so Esc does not close it; the × (or, where no close handler is passed, a link to `/admin/dashboard`) is the only way out — `src/components/modals/LimitsModal.tsx:36`, `src/components/modals/limits/LimitsModalHeader.tsx:38-55`.

### After a downgrade: forced deletion

- When the user holds more catalogues than the new plan allows, the dashboard shows an undismissable dialog: title **"Catalogue Limit Exceeded"**, body "You have <n> catalogues, but your plan allows only <m>. Please select at least <k> catalogue(s) to delete.", a live "Selected: x / Required: k" line, a checkbox list of catalogues with status badge and dates, and a destructive **"Delete <n> Catalogue(s)"** button ("Deleting..." while it runs) — `src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:29-162`, mounted at `src/components/dashboard/Overview.tsx:216-221` with the trigger at `:70-71`.

## Surprising automatic behaviour, defaults, caching

- **Nothing is published.** Create always inserts `status: "draft"`; publishing is a separate action with its own full-fit plan check — `src/actions/catalogue.ts:301,440-487`.
- The new row is immediately **cached in Redis** as the editing draft (30-day TTL, key by catalogue id so a re-used name can never show a previous owner's draft) — `src/actions/catalogue.ts:312-317`, `src/lib/catalogue/draft-cache.ts:9-18,74-81`.
- The builder always reads the DB row **with the Redis draft layered on top**, while id, name, status, owner and timestamps always come from the row — `src/lib/catalogue/draft-cache.ts:34-71`, `src/actions/catalogue.ts:389-400`.
- Saving in the builder writes **only to Redis**, not to the catalogues table; the table is written by publish — `src/actions/catalogue.ts:334-386` vs `:440-487`.
- `tags` is always sent as `[]` because the column is NOT NULL without a default — `src/actions/catalogue.ts:298-299`.
- A fresh catalogue carries a full default appearance/header/footer object (monochrome theme, Inter, 12px radius, low shadow, CTA block enabled but empty, email+phone CTAs on) even though the user was asked nothing about them — `packages/constants/catalogue.ts:23-92`.
- Plan stripping happens on create too: `applyPlanToCatalogue` runs before the INSERT, so a plan without branding or advanced appearance silently gets the defaults — `src/actions/catalogue.ts:280-283`, `src/lib/entitlements/catalogue.ts:28-73`.
- The create dialog's values live in the shared `CatalogueContext` and are deliberately left there while the dialog animates out; the builder replaces them and the next opening resets them — `src/hooks/useCreateCatalogue.ts:41-43,65`, `src/context/CatalogueContext.tsx:182-183`.
- The template picker auto-opens **once per mount**, judged on `content.length === 0`; choosing "Start from Scratch" leaves content empty, so it opens again after a reload — `src/components/catalogue/modals/SelectTemplateModal.tsx:33,68-77`.
- Applying a template does **not** check the plan. The content lands in the draft and the limit is only enforced on save/publish (the Standard template is exactly at the Starter ceiling, so this only bites a catalogue that already has content) — `src/components/catalogue/inputs/TemplatesInput.tsx:83-88`, `src/actions/catalogue.ts:355-358`.
- Items in both templates use the shared stock placeholder image, and the agent counts a placeholder as "no photo", so an AI pass will try to fill them — `packages/constants/catalogue.ts:194-195`, `src/agent/core/instructions.ts:76`.
- `CreateCatalogueButton`'s `disabled` / `showUpgradeTooltip` props (tooltip "Upgrade to unlock more catalogues and get higher limits." plus a "View Pricing" button) are never passed by any caller today, so that tooltip never appears — `src/components/catalogue/create/CreateCatalogueButton.tsx:19-27,78-89`; the only two usages pass neither (`src/components/home/Hero.tsx:61`, `src/components/home/ai/AiShortcut.tsx:87`).
- Both `CreateCatalogueButton` and `FloatingActionMenu` mount their own provider when used outside one, so they keep working anywhere — `src/components/catalogue/create/CreateCatalogueButton.tsx:35-42`, `src/components/dashboard/FloatingActionMenu.tsx:21-28`.
- A catalogue in `in_preparation` state cannot be deleted for 10 minutes after creation, and the dashboard draws a spinning cog for it — but nothing in the current app ever sets that status (see Could not confirm) — `src/components/dashboard/overview/ItemDropdownMenu.tsx:73-80,166-170`, `src/components/dashboard/overview/DashboardItem.tsx:187-195`.

## Every user-visible message in this flow, with its cause

| Text | Where | Cause |
|---|---|---|
| "Name cannot be just spaces." | name hint | value non-empty but blank after trim — `src/hooks/useCatalogueName.ts:33-35` |
| "Name must only contain letters, numbers, and spaces (no special characters)." | name hint | any other character typed — `src/hooks/useCatalogueName.ts:36-38` |
| "Checking availability…" | name hint | server answer pending for the current text — `src/components/modals/NameHint.tsx:40` |
| "Great! This name is available." | name hint | server confirmed the slug is free — `src/components/modals/NameHint.tsx:44` |
| "This name is already in use. Please choose a different name." | name hint | slug already exists (any owner) — `src/hooks/useCatalogueName.ts:20-21` |
| "Your URL will be … /catalogues/\<slug\>" | under the fields | always; `…` until a name is typed — `src/components/modals/CatalogueNameField.tsx:17-30` |
| `Catalogue "<slug>" created successfully!` | toast | create succeeded — `src/hooks/useCreateCatalogue.ts:40` |
| "Failed to create catalogue" | toast | create returned no error text — `src/hooks/useCreateCatalogue.ts:36` |
| "An unexpected error occurred" | toast / action error | client throw, or an unhandled server throw — `src/hooks/useCreateCatalogue.ts:48`, `src/actions/catalogue.ts:330` |
| "Unauthorized" | action error | no session — `src/actions/catalogue.ts:266` |
| "Invalid catalogue name" | action error | name slugifies to "" — `src/actions/catalogue.ts:269` |
| "You have reached the catalogue limit of your plan" | action error → toast | quota full at insert time — `src/actions/catalogue.ts:276` |
| "Plan limit reached" (or the fit reason) | action error → toast | content does not fit the plan — `src/actions/catalogue.ts:288` |
| "Failed to insert catalogue" | action error → toast | INSERT returned no row — `src/actions/catalogue.ts:306` |
| "A catalogue with this name already exists" | action error → toast | unique violation on `name` — `src/actions/catalogue.ts:324` |
| "Need More Catalogues?" + "Upgrade your plan to unlock more features and take your digital catalogues to the next level." | limit dialog | at the catalogue quota — `src/components/modals/limits/LimitsModalHeader.tsx:58-67` |
| "Upgrade to \<plan\> Now" / "Contact us Now" / "Purchase Custom Plan" | limit dialog | an upgrade exists / top plan reached — `src/components/modals/limits/LimitUpgradeComparison.tsx:135-172` |
| "Choose a Template" + "Start with a pre-made layout or build from scratch" | template dialog | builder opened on an empty catalogue, or Templates pressed — `src/components/catalogue/modals/SelectTemplateModal.tsx:91-96` |
| "Change template?" + "This will change your existing content. Please save it first to not lose progress." | confirm dialog | a template chosen while content exists — `src/components/catalogue/inputs/TemplatesInput.tsx:202-206` |
| "+ Add Heading" | heading box | heading empty in the builder — `src/components/catalogue/inputs/heading/EditableHeading.tsx:6` |
| "Add Section" + "Items, text, a divider, an embed or a custom visual" | under the content | edit mode — `src/components/catalogue/inputs/ContentBlockButton.tsx:24-28` |
| "Saving..." / "Catalogue saved successfully" / "Failed to save catalogue" | toast | Save pressed — `src/components/catalogue/builder/useBuilderActions.ts:54-64` |
| "You can attach up to 10 images." / "Only the first N were added - you can attach up to 10 images." | chat strip | too many photos attached — `src/hooks/useChatImageOcr.ts:85,91` |
| "Reading the text in your images…" / "The text in these images goes to the assistant with your message." | chat strip | scan running / finished — `src/components/catalogue/chat/ChatImageAttachments.tsx:122-125` |
| "Could not be read." / "Too blurry - try a sharper photo." / "No text found." | photo tooltip + "Unreadable" ribbon | OCR failed / confidence < 60 / empty text — `src/hooks/useChatImageOcr.ts:10-36` |
| "Working on it…" | chat | a turn is running — `src/components/catalogue/chat/CatalogueChat.tsx:166,417` |
| "Something went wrong. Try again." | chat | the turn failed with no server message — `src/components/catalogue/chat/CatalogueChat.tsx:432` |
| "Catalogue Limit Exceeded" + "You have N catalogues, but your plan allows only M…" | dashboard, undismissable | more catalogues than the plan allows after a downgrade — `src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:84-98` |
| "No catalogues created yet." | dashboard list | no catalogues — `src/components/dashboard/overview/CatalogueGrid.tsx:35` |

## Layout facts for drawing the screens

- **Create dialog**: centred Radix alert dialog, `max-w-[600px]`, width `calc(100vw-24px)`, max height `calc(100dvh-24px)`, 24px padding, 14px gaps, column layout, scrolls internally; on phones it sits at 40dvh from the top rather than centred — `src/components/modals/AppDialog.tsx:15,31-46`, `src/components/ui/alert-dialog.tsx:36`.
- Create dialog footer: right-aligned row; on phones the buttons stretch (`flex-[1_1_140px]`) and from 520px they size to content — `src/components/modals/AppDialog.tsx:49-62`.
- Field order top to bottom / left to right: Catalogue Name (with the × in the title row above it), Language, Currency, Business Type, URL preview, footer — `src/components/catalogue/create/InitCatalogueModal.tsx:110-203`.
- Each field is a 6px-gap column of label + control + (for the name) hint line, which reserves one line of height so the dialog does not jump — `src/components/modals/CatalogueNameField.tsx:69-97`, `src/components/modals/NameHint.tsx:21-31`.
- URL preview: dashed-border rounded box (14px radius), globe icon left, 12px bold grey label, monospaced 13px breakable URL — `src/components/modals/UrlPreview.tsx:14-21`.
- **Limit dialog**: same 600px frame; icon tile 46px with 14px radius, amber; comparison strip is a bordered rounded-2xl panel with two centred number columns (28px extra-bold) and an arrow between; the gains panel is an amber-tinted rounded-2xl box with 18px amber tick discs; the CTA is full width below 520px — `src/components/modals/AppDialog.tsx:72-93`, `src/components/modals/limits/LimitUpgradeComparison.tsx:106-174`, `src/components/modals/limits/TickList.tsx:5-23`.
- **Template dialog**: `max-w-5xl`, width `calc(100vw-24px)`, fixed header (title 20px → 24px from `sm`) and a scrolling body, `p-0` with its own inner padding — `src/components/catalogue/modals/SelectTemplateModal.tsx:85-112`.
- Template cards: 12px gaps, one column on phones and three from `md`; "Recommended" badge pinned top-right; on phones the title repeats inside the text block and gets right padding so the badge does not cover it; the "Select template" button bar is sticky at the bottom on phones and static from `sm` — `src/components/catalogue/inputs/TemplatesInput.tsx:103-197`.
- **Quick AI panel**: desktop a floating panel 24px from the bottom-left, clear of the 72px rail, `min(420px, 100vw-72px-3rem)` wide and `min(640px, 100dvh-3rem)` tall; on phones a full-height sheet with a 24px rounded top that tracks the visual viewport so the keyboard never covers the composer — `src/components/catalogue/chat/CatalogueChat.tsx:281-303`.
- **Builder frame** (where the user lands): rail 72px, editor panel 440px, wide breakpoint 1280px; phone gets a bottom bar with Ask AI, Templates, Editor, Save, Publish — `docs/architecture/builder.md:11-17`.

---

## Contradictions

- **"4 categories" vs 5 sections.** The Standard Catalog card advertises "4 categories · 15 items" but `standardTemplate` returns 5 sections (15 items is right). Four of the five draw a heading; the fifth, "Complementary Extras", has `showHeading: false` — `src/components/catalogue/inputs/TemplatesInput.tsx:50` vs `src/constants/catalogueTemplates.ts:24-305,266`.
- **Create lets you submit while the name check is still running; Duplicate does not.** `isFormValid` ignores `checking`, so "Create Catalog" is clickable while the hint still says "Checking availability…" (the server then decides and the hint is re-asked); the duplicate dialog blocks Confirm until the check settles — `src/components/catalogue/create/InitCatalogueModal.tsx:83-89,96-99` vs `src/components/dashboard/overview/DuplicateCatalogueDialog.tsx:33-37`.
- **Three different name length limits.** The input stops at 60 characters, the availability action accepts up to 200, and the database allows a slug of up to 100 — `src/components/modals/CatalogueNameField.tsx:12`, `src/actions/catalogue.ts:421-423`, `packages/drizzle/migrations/schema.ts:161`.
- **Client-side character rule is stricter than the server's.** The browser refuses anything but letters, numbers and spaces; the server only requires that the slug be non-empty and match the DB's slug pattern, so punctuation submitted by other means (e.g. an underscore) would be rejected by the DB check with a raw unique/constraint path rather than the friendly message — `src/hooks/useCatalogueName.ts:23` vs `src/actions/catalogue.ts:268-269` and `packages/drizzle/migrations/schema.ts:161`.
- **The FAB looks blocked for a reason the create flow does not check.** It dims when the catalogues **or** traffic limit is reached, but `openCreateCatalogue` only blocks on the catalogue count, so a user over the traffic limit sees a faded button that still opens the create dialog — `src/components/dashboard/FloatingActionMenu.tsx:35` and `src/app/admin/dashboard/page.tsx:69-74` vs `src/hooks/useCreateCatalogue.ts:60-63`.
- **The success toast shows the slug, not the typed name.** The user types "Burger House" and reads `Catalogue "burger-house" created successfully!` — `src/hooks/useCreateCatalogue.ts:40` with `name: slug` at `src/actions/catalogue.ts:300`.
- **`limitContent`'s catalogue description is never shown.** The dialog header writes its own generic description, so the written-for-this-case line ("Your business is growing! …") is dead copy in this dialog — `src/components/modals/limits/limitContent.ts:109` vs `src/components/modals/limits/LimitsModalHeader.tsx:63-67`.
- **The limit dialog's default props disagree with the Basic plan.** `LimitsModal` defaults `requiredPlan` to `tiers[1]` (Basic), which allows the same 1 catalogue as Starter; the real call site computes Pro via `getRequiredPlan`, so the default is only a fallback that would read oddly if ever used — `src/components/modals/LimitsModal.tsx:24-25` vs `src/lib/entitlements/required-plan.ts:36-45`.
- **Existing user docs say "two short steps" and "two ready templates or a blank page" with "four sections and fifteen items" for Standard** — consistent with the card copy but not with the code's 5 sections; the published doc also calls the AI step "step three" — `src/content/docs/create-a-catalogue.tsx:41-44,56,110-112,125`.
- **Migration comment names a constraint that no longer exists under that name.** The comment says "catalogues_new_name_key stays the final guard"; the current schema calls it `catalogues_name_key` — `supabase/migrations/20260921181105_private_entry_points.sql:10` vs `packages/drizzle/migrations/schema.ts:154`.

## Could not confirm

- **Whether a catalogue name can ever be re-used after deletion.** The slug check is `not exists` over live rows and the Redis draft key is the catalogue id, so re-use looks possible, but I did not find a test or a cleanup job proving the public ISR cache is dropped for the old slug beyond `revalidateCatalogue(name)` on delete (`src/actions/catalogue.ts:77`). Not verified end to end.
- **What sets `status: "in_preparation"` or `"error"`.** Both are allowed by the DB check and rendered by the dashboard (badge "In preparation", spinner, 10-minute delete lock, "Error occurred. Please delete the catalogue and retry."), but no code in this repo writes them. They may come from the Cloudflare worker repo (`../quicktalog-backend`), which I did not read. Evidence of the UI only: `packages/drizzle/migrations/schema.ts:163`, `src/components/dashboard/overview/StatusBadge.tsx:21-24`, `src/components/dashboard/overview/DashboardItem.tsx:178-195`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:73-80`.
- **Whether the "German Silva Custom Plan" is reachable by a normal user.** It is `type: "custom"` and tied to one Paddle price id; I did not query any database (forbidden) to see if anyone holds it — `packages/constants/pricing.ts:160-190`.
- **The exact rendered width of the template thumbnails.** The images are given `object-contain` inside a percentage-width span with no intrinsic size stated in code; actual sizes come from the PNGs — `src/components/catalogue/inputs/TemplatesInput.tsx:146-157`.
- **Whether `/pricing` is reached in the same tab from the limit dialog's upgrade button.** `useUpgrade` saves the draft first and opens pricing in a new tab if the save is refused, per the docs; I read the doc statement, not the whole hook — `docs/architecture/builder.md:111-113`, `src/components/modals/limits/LimitUpgradeComparison.tsx:163-166`.
- **`src/constants/schemas.ts` holds no catalogue name/slug/URL validation.** It is JSON-LD page schemas plus the contact form and QR config Zod schemas; name validation lives in `src/hooks/useCatalogueName.ts`, the slug helper and the DB check — `src/constants/schemas.ts:356-376,387-418,458-476`.
- **No OCR/Firecrawl import exists outside Quick AI.** I found no upload-a-menu or import-a-URL screen in the create flow; both are chat attachments/tools. If such a screen is planned, it is not in this codebase as of this read.
