# Research: the catalogue builder (for end-user documentation)

Read-only research. Every fact ends with `path:line` evidence. Paths are relative to
`/Users/nikola/Desktop/Quicktalog/quicktalog-app` unless they start with `../quicktalog-packages`.

Breakpoints matter for the whole document: this project uses Material Tailwind's
breakpoints, so `sm`=540px, `md`=720px, `lg`=960px, `xl`=1140px, `2xl`=1320px
(`node_modules/@material-tailwind/react/theme/base/breakpoints.js:1`, applied by
`tailwind.config.ts:49-50` via `withMT`). So every `md:` in the builder means **720px**, not 768px.

---

## How to reach the builder

- Route: `/admin/[name]/builder`, where `[name]` is the catalogue slug (`src/app/admin/[name]/builder/page.tsx:8-9`).
- Sign-in required; an anonymous visitor is redirected back here after auth (`src/app/admin/[name]/builder/page.tsx:10`).
- The page loads only a catalogue the signed-in user owns; otherwise `notFound()` (`src/app/admin/[name]/builder/page.tsx:12-16`).
- Dashboard card, draft/inactive catalogues: a primary button **Continue Editing** linking to `/admin/<name>/builder` (`src/components/dashboard/overview/DashboardItem.tsx:165-171`).
- Dashboard card ⋯ menu: first entry **Edit** (pencil icon) pushes `/admin/<name>/builder` (`src/components/dashboard/overview/ItemDropdownMenu.tsx:115-121`).
- Active catalogues show **View Catalogue** and **Analytics** instead; the only way into the builder for an active catalogue is the ⋯ menu's **Edit** (`src/components/dashboard/overview/DashboardItem.tsx:151-163`).
- Publishing from the dashboard with a missing heading or content fails with a toast carrying an **Open Builder** action that navigates to `/admin/<name>/builder` (`src/components/dashboard/overview/DashboardItem.tsx:73-81`).
- What the builder renders: the real catalogue through `Catalogue` in `type="edit"`, wrapped in the unsaved-changes guard (`src/components/catalogue/builder/CatalogueBuilder.tsx:17-23`).

---

## The builder frame: overview

- Sizes live in one file: rail 72px, editor panel 440px, wide breakpoint 1280px (`src/components/catalogue/builder/frame.ts:1-19`).
- The whole frame is one `<aside aria-label="Catalogue builder">` at `z-index 1000` (`src/components/catalogue/inputs/sidebar/index.tsx:104-114`).
  - Phone: `fixed inset-x-0 bottom-0`, and `h-[100dvh]` while the editor panel is open (`.../index.tsx:107,112`).
  - From `md` (720px): `md:right-0 md:top-0 md:h-[100dvh] md:w-[72px]` (`.../index.tsx:113`).
- The catalogue itself reserves room for the frame; **edit mode only**:
  - bottom padding `4rem + safe-area` below 720px, and `padding-right: 72px` from 720px (`src/components/catalogue/builder/frame.ts:16`).
  - `padding-right: 512px` (72 + 440) from 1280px **while the panel is open** (`src/components/catalogue/builder/frame.ts:18`).
  - Padding transitions over 300ms (`src/components/catalogue/builder/frame.ts:17`).
  - Applied only when `type === "edit"` (`src/components/catalogue/view/Catalogue.tsx:195`).
- Three layouts:
  - **< 720px**: catalogue full width, phone bottom bar, editor opens as a full-height sheet (`src/components/catalogue/builder/frame.ts:9`, `src/components/catalogue/builder/BuilderPanel.tsx:17-18`, `docs/architecture/builder.md:15`).
  - **720–1279px**: rail on the right; the panel opens **over** the catalogue with a scrim and is a modal dialog (`src/components/catalogue/inputs/sidebar/index.tsx:118-124`, `src/components/catalogue/builder/BuilderPanel.tsx:86,91`).
  - **≥ 1280px**: the panel opens **beside** the catalogue, which shrinks; not modal (`src/components/catalogue/builder/BuilderPanel.tsx:40-41,86,91`, `src/components/catalogue/builder/frame.ts:18`).
- The scrim: `bg-product-dark/40` + 2px blur, shown only between 720px and 1279px, clicking it closes the panel, `aria-hidden` (`src/components/catalogue/inputs/sidebar/index.tsx:118-124`).

---

## The left… actually right-hand rail (720px and up)

The rail is on the **right** edge, not the left (`src/components/catalogue/inputs/sidebar/index.tsx:113`; `border-l` in `src/components/catalogue/builder/BuilderRail.tsx:35`).

- Container: 72px wide, full viewport height, `px-1.5 py-3`, scrolls vertically if needed, `role="group"`, `aria-label="Builder tools"` (`src/components/catalogue/builder/BuilderRail.tsx:33-37`).
- Every rail item is icon-over-label, full rail width, min 52px tall, 11px semibold label, 20px icon (`src/components/catalogue/builder/BuilderRail.tsx:9-11`). The code comment says "56px wide" but the width is whatever 72px minus `px-1.5` leaves (`src/components/catalogue/builder/BuilderRail.tsx:9,35`).
- Order, top to bottom:
  1. **Editor** — `SlidersHorizontal` icon, `aria-label="Editor panel"`, tooltip "Open the editor panel" / "Close the editor panel"; toggles the panel and gets an amber tint + amber border while open (`src/components/catalogue/builder/BuilderRail.tsx:38-53`).
  2. a 1px, 40px-wide divider (`src/components/catalogue/builder/BuilderRail.tsx:13-15,55`).
  3. **Save** — `Save` icon (`src/components/catalogue/inputs/sidebar/index.tsx:128`, `src/components/catalogue/builder/useBuilderActions.ts:147-154`).
  4. **Templates** — `LayoutTemplate` icon (`src/components/catalogue/builder/useBuilderActions.ts:156-165`).
  5. **Preview** — `Eye` icon (`src/components/catalogue/builder/useBuilderActions.ts:167-173`).
  6. **Publish** / **Update** — `Rocket` when the catalogue is not yet live, `RefreshCw` when it is; the only filled (primary) button in the rail (`src/components/catalogue/builder/useBuilderActions.ts:174-181`, `src/components/catalogue/builder/BuilderRail.tsx:57-71`).
  7. a spacer, a divider, then **Dashboard** — `ArrowLeft` icon, links to `/admin/dashboard` (`src/components/catalogue/builder/BuilderRail.tsx:73-82`).
- The rail has **no Quick AI button**. On desktop Quick AI is a separate floating button, fixed at `bottom-6 left-6`, labelled **Quick AI**, hidden below 720px (`src/components/catalogue/chat/CatalogueChat.tsx:252-263`). `docs/architecture/builder.md:16` says the rail holds "Ask AI" — see Contradictions.

---

## The editor panel ("Edit catalogue")

- Opened by the rail's Editor button or the phone bar's Editor button (`src/components/catalogue/inputs/sidebar/index.tsx:134,186`); id `builder-editor-panel` (`.../index.tsx:28`).
- Shell: header (title, optional description, close), then the content (`src/components/catalogue/builder/BuilderPanel.tsx:83-131`).
- Title **Edit catalogue**, subtitle **Name, header, footer and appearance** (`src/components/catalogue/inputs/sidebar/index.tsx:140-143`).
- Close button: `aria-label="Close editor"`, tooltip "Close editor (Esc)", `X` icon (`src/components/catalogue/builder/BuilderPanel.tsx:120-128`).
- Phone only, in the panel header: a back arrow, `aria-label="Back to dashboard"` / tooltip "Back to dashboard", linking to `/admin/dashboard` (`src/components/catalogue/builder/BuilderPanel.tsx:95-106`).
- Sizes: from 720px it is `absolute right-full top-0`, `440px` wide, full height, capped at `100vw - 72px`, with a left border and the product shadow; the shadow is dropped from 1280px (`src/components/catalogue/builder/BuilderPanel.tsx:87`).
- Below 720px it fills the remaining height of the `100dvh` aside, above the bottom bar (`src/components/catalogue/builder/BuilderPanel.tsx:87` `flex min-h-0 flex-1`, `src/components/catalogue/inputs/sidebar/index.tsx:112`).
- Animation: fades and slides in, 300ms; slides from the bottom on phones and from the right from 720px; respects reduced motion (`src/components/catalogue/builder/BuilderPanel.tsx:87`).
- Focus: focus moves into the panel on open and returns to whatever opened it on close (`src/components/catalogue/builder/BuilderPanel.tsx:43-52`).
- Keyboard: **Esc** closes it; below 1280px **Tab** is trapped inside; from 1280px Tab can leave (`src/components/catalogue/builder/BuilderPanel.tsx:61-80`). Esc coming from a portaled menu or picker is ignored, so those close themselves first (`src/components/catalogue/builder/BuilderPanel.tsx:56-59`).
- ARIA: `role="dialog"` + `aria-modal` below 1280px, `role="region"` from 1280px (`src/components/catalogue/builder/BuilderPanel.tsx:86,91`).
- Four tabs, icon over label, in one 4-column grid; active tab gets an amber tint with an amber border (`src/components/catalogue/inputs/sidebar/index.tsx:34-35,151-162`):
  - **General** (`Home`), **Header** (`Layout`), **Footer** (`FileText`), **Appearance** (`Palette`) (`src/components/catalogue/inputs/sidebar/index.tsx:73-100`).
  - The tab strip is fixed; the body below it scrolls (`src/components/catalogue/inputs/sidebar/index.tsx:150-173`).
  - The tab opens on **General** every time the panel mounts (`src/components/catalogue/inputs/sidebar/index.tsx:50`).
- Panel sections are white cards with a 15px bold title, an optional (i) popover and an optional one-line description (`src/components/catalogue/inputs/sidebar/panel/PanelSection.tsx:19-58`).
- Section titles, for reference:
  - General: **General information** ("Basic settings for your catalogue."), **Search**, **Logo** ("Shown in your catalogue's header and footer."), **Contact information**, **Search and sharing**, **Analytics & tracking** (`src/components/catalogue/inputs/sidebar/GeneralTab.tsx:50-53,59-66,68-71,90-93,137-140,184-188`, `src/components/catalogue/inputs/sidebar/general/SearchSection.tsx:33`, `src/components/catalogue/inputs/sidebar/general/TrackingSection.tsx:119`).
  - Header: **Customize header**, **Floating navbar** ("The header floats above the catalogue and stays at the top while visitors scroll."), **Logo size**, **Interaction**, **Icons** (`src/components/catalogue/inputs/sidebar/HeaderTab.tsx:107,111-112,146,166,209`).
  - Footer: **Customize footer**, **Business information**, **Logo size**, **Interaction**, **Social media links**, **Partners** (`src/components/catalogue/inputs/sidebar/FooterTab.tsx:103`, `src/components/catalogue/inputs/sidebar/footer/BusinessInfoSection.tsx:53`, `.../LogoSizeSection.tsx:17`, `.../InteractionSection.tsx:26`, `.../SocialLinksSection.tsx:63`, `.../PartnersSection.tsx:147`).
  - Appearance: **Themes**, **Custom colors**, **Background**, **Style**, **Overlay** (`src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:152,172,188,201,219`).
- **The catalogue name cannot be changed here.** The General tab renders `CatalogueNameInput` with `disabled={true}` (`src/components/catalogue/inputs/sidebar/GeneralTab.tsx:54`); disabled hides the required marker and the availability status (`src/components/catalogue/inputs/CatalogueNameInput.tsx:45,52-57,76-83`).
- A link inside the Header tab can jump to the glass settings: it switches to **Appearance** and smooth-scrolls to the glass panel two frames later (`src/components/catalogue/inputs/sidebar/index.tsx:51-61,83-86`).

---

## The phone bottom bar (below 720px)

- `role="toolbar"`, `aria-label="Builder actions"`, hidden from 720px; top border, card background, `padding-top: 20px`, bottom padding `max(0.25rem, safe-area)`, and an upward shadow (`src/components/catalogue/inputs/sidebar/ActionButtons.tsx:51-55`).
- Items are icon-over-label, min 52px tall, 11px semibold label, neutral ink until pressed; disabled items drop to 40% opacity (`src/components/catalogue/inputs/sidebar/ActionButtons.tsx:20-23`).
- Order, left to right (`src/components/catalogue/inputs/sidebar/ActionButtons.tsx:56-143`):
  1. **Quick AI** — the Quick AI mark, `aria-label="Quick AI"`; opens the chat sheet and closes the editor panel (`.../ActionButtons.tsx:56-66`, `src/components/catalogue/inputs/sidebar/index.tsx:182-185`).
  2. **Templates** (`.../ActionButtons.tsx:68-76`).
  3. **Editor** — the centre control: a 56×56 round button floating 40px above the bar (`-top-10`), amber with the sliders icon when closed, dark with an `X` when open; its label reads **Editor** or **Close**; the hit area is 64px wide (`.../ActionButtons.tsx:78-103`).
  4. **Save** (`.../ActionButtons.tsx:105-113`).
  5. **Publish** / **Update** — a dropdown trigger (`ChevronUp` beside the icon), `aria-label="<Publish|Update> or preview"`, whose menu (opening upward, right-aligned) holds **Preview** then **Publish**/**Update** (`.../ActionButtons.tsx:115-143`).
- While the Quick AI sheet is open the whole bar hides on phones and comes back from 720px, so the two never fight for the thumb zone (`src/components/catalogue/inputs/sidebar/index.tsx:108-112`).
- The publish dropdown sits at `z-1010`, above the frame's `z-1000` (`src/components/catalogue/inputs/sidebar/ActionButtons.tsx:128-133`, `.../index.tsx:107`).

---

## Saving

- **Saving is manual.** There is no timer, interval or debounce that saves: no `setInterval` or autosave loop exists in `src/` (searched; only `useSaveDraft` exists and it is called explicitly). `src/hooks/useSaveDraft.ts:8` calls itself "the one save path for autosaves", but the only callers are the AI "Accept" flow and the upgrade flow (`src/hooks/useKeepAiChanges.ts:10-13`, `src/hooks/useUpgrade.ts:15-25`).
- Button label: **Save** (`src/components/catalogue/builder/useBuilderActions.ts:150`).
- What the user sees, as one `toast.promise` (`src/components/catalogue/builder/useBuilderActions.ts:53-64`):
  - while it runs: **"Saving..."**
  - on success: **"Catalogue saved successfully"**
  - on failure: the server's own reason, or **"Failed to save catalogue"**
- Saving first keeps any AI edits that are still under review (`src/components/catalogue/builder/useBuilderActions.ts:51`).
- After a successful save the draft is marked as saved, which clears the unsaved-changes state (`src/components/catalogue/builder/useBuilderActions.ts:67`, `src/context/CatalogueContext.tsx:178-180,167`).
- Save is **never disabled** (`src/components/catalogue/builder/useBuilderActions.ts:153`).
- **What Save actually writes:** `updateCatalogue` writes the draft to **Redis only** (30-day TTL), keyed by catalogue id; the database row is untouched (`src/actions/catalogue.ts:368-376`, `src/lib/catalogue/draft-cache.ts:9,17-18,74-81`). The id, name, owner, status and timestamps always come from the database row, never from the draft (`src/lib/catalogue/draft-cache.ts:61-70`).
- Save still refuses a draft that grows past the plan; the refusal text is the server's (`src/actions/catalogue.ts:355-358`, `src/lib/entitlements/plan.ts:109-167`).
- If Redis itself fails the save reports **"Failed to save the draft"** (`src/actions/catalogue.ts:375`).
- A save also revalidates the public catalogue page's cache (`src/actions/catalogue.ts:378`, `src/lib/cache/revalidate.ts:8-18`) — which has no visible effect, since the public page reads the database row, not the draft (`src/lib/catalogue/public.ts:23-32`).

### Leaving with unsaved changes

- "Unsaved" means the draft object differs by identity from what was last seeded or saved (`src/context/CatalogueContext.tsx:166-167`).
- The builder always renders the guard (`src/components/catalogue/builder/CatalogueBuilder.tsx:20`).
- Reload, tab close and links to other sites get the **browser's own** prompt (`src/hooks/useBeforeUnload.ts:100-105`).
- In-app links and the Back button open the app's dialog (`src/hooks/useBeforeUnload.ts:107-131`).
- Exact dialog text (`src/hooks/useBeforeUnload.ts:160-180` with `src/components/modals/InformModal.tsx:63-94`):
  - Title: **Unsaved Changes**
  - Body: **You have unsaved changes. Are you sure you want to leave?**
  - Buttons: **Stay** (cancel) and **Leave** (confirm)
- Choosing **Leave** discards the draft: the context is reset to the blank default catalogue (`src/components/catalogue/builder/CatalogueBuilder.tsx:20`, `src/context/CatalogueContext.tsx:182-185`, `src/hooks/useBeforeUnload.ts:143-150`).
- Back is handled by pushing one tagged history entry while dirty; **Leave** then steps back two entries, or to `/admin/dashboard` if this page opened the tab (`src/hooks/useBeforeUnload.ts:80-98,119-131,9-10`).
- A **remount keeps the draft**: the same catalogue id plus unsaved changes skips re-seeding from the server (`src/components/catalogue/builder/useSeedCatalogue.ts:16-20`).

---

## Draft vs published

- The builder edits a **draft**. `getCatalogueByName` returns the database row with the Redis draft layered on top (`src/actions/catalogue.ts:388-400`, `src/lib/catalogue/draft-cache.ts:40-71`).
- Customers see the **database row**, and only while its status is `active`; the public page reads it through the public API and shows a "Catalogue Not Found" dialog otherwise (`src/lib/catalogue/public.ts:23-32`, `src/app/api/items/[name]/route.ts:7-25`, `src/app/catalogues/[name]/page.tsx:143-147`).
- The public page is ISR with `revalidate = 86400` (24h) plus tag-based revalidation (`src/app/catalogues/[name]/page.tsx:11,119-121`).
- **Saving never changes what customers see.** Only publishing writes the row (`src/actions/catalogue.ts:368-371` vs `:453-470`).
- Publish control label: **Publish** when the catalogue is not live, **Update** when it already is (`src/components/catalogue/builder/useBuilderActions.ts:143,177`).
- Publish/Update is **disabled** when the catalogue has no content blocks, no slug, or an empty heading (`src/components/catalogue/builder/useBuilderActions.ts:75-78,179`); heading emptiness is measured on the heading's text, tags stripped (`src/lib/catalogue/heading.ts:37-47`).
- If the catalogue somehow has no id, publishing toasts **"Please save the catalogue first"** (`src/components/catalogue/builder/useBuilderActions.ts:98-101`).
- There is **no confirmation dialog before publishing** (`src/components/catalogue/builder/useBuilderActions.ts:97-141`).
- First publish (status was not `active`) — `src/components/catalogue/builder/useBuilderActions.ts:105-120`:
  - closes the editor panel,
  - toast **"Publishing..."** → **"Catalogue published successfully"**, or the server's error / **"Failed to publish catalogue"**,
  - opens the success modal,
  - refreshes the dashboard data, the user data and the route.
- Re-publishing an already-live catalogue — `src/components/catalogue/builder/useBuilderActions.ts:121-139`:
  - toast **"Updating..."** → **"Catalogue updated successfully"**, or the server's error / **"Failed to update catalogue"**,
  - the toast carries a **View** action that opens `/catalogues/<name>` in a new tab,
  - **no success modal**.
- The success modal (first publish only), `src/components/modals/SuccessModal.tsx:57-93,109-174` with `type="regular"` from `src/components/catalogue/inputs/sidebar/ActionButtons.tsx:163-168`:
  - party-popper icon, title **Congratulations!**, body **"Your Catalogue is now live and ready to share with your customers."**
  - a read-only **Direct link** field with a **Copy** button that flips to **Copied** for 2 seconds (`:114-141,45-49`)
  - a QR panel (`:169-173`)
  - **Embed on your website** — "A ready-made HTML file, full-screen." with an **HTML file** download button (`:143-164`)
  - footer: **Dashboard** (navigates to `/admin/dashboard`) and **View Catalogue** (opens the live URL in a new tab) (`:77-92`)
- What publishing does on the server (`src/actions/catalogue.ts:440-485`):
  - forces the plan's limits onto the payload (`:452`, `src/lib/entitlements/catalogue.ts:28-84`),
  - refuses unless the catalogue **fully fits** the plan and this month's traffic limit is not reached (`:453-454`, `src/lib/entitlements/plan.ts:77-97`),
  - refuses a payload that grows past a limit (`:456-458`),
  - writes the editable fields to the database row, sets `status = "active"` and bumps `updatedAt` (`:460-473`),
  - rewrites the Redis draft from the stored row, so the draft and the row agree (`:477-482`),
  - revalidates the catalogue pages and the dashboard (`:483-484`).
- Publishing also keeps AI edits under review (`src/components/catalogue/builder/useBuilderActions.ts:102`) and marks the catalogue as saved with `status: "active"` in the browser (`:112,127`).
- Publishing sends the **browser's current draft**, not the Redis draft (`src/components/catalogue/builder/useBuilderActions.ts:103` passes `catalogue`).

---

## Preview

- Opened from the rail's **Preview** button, or from the phone Publish dropdown's **Preview** entry (`src/components/catalogue/inputs/sidebar/index.tsx:130`, `src/components/catalogue/inputs/sidebar/ActionButtons.tsx:134-137`).
- Disabled under the same condition as Publish: no content, no name, or an empty heading (`src/components/catalogue/builder/useBuilderActions.ts:172`).
- **Preview saves first.** The flow opens a blank tab synchronously (so Safari does not treat it as a popup), saves, then points that tab at `/catalogues/<name>/preview` (`src/components/catalogue/builder/useBuilderActions.ts:80-95`).
- If the save fails, the blank tab is closed again and nothing opens (`src/components/catalogue/builder/useBuilderActions.ts:84-90`). If the saved catalogue has no slug the toast is **"Catalogue has no name/slug"** (`:87`).
- Route: `/catalogues/[name]/preview` (`src/app/catalogues/[name]/preview/page.tsx`).
- It is owner-only: without a verified identity it redirects to `/auth?next=…` (`src/app/catalogues/[name]/preview/page.tsx:26-28`).
- It renders the **saved draft** (row + Redis draft) with `type="view"`, so it looks exactly like the live page but shows unpublished work (`src/app/catalogues/[name]/preview/page.tsx:31-36`, `src/lib/catalogue/draft-cache.ts:40-71`).
- Differences from the live catalogue:
  - `dynamic = "force-dynamic"` — no ISR, always fresh (`src/app/catalogues/[name]/preview/page.tsx:10`); the live page is ISR (`src/app/catalogues/[name]/page.tsx:11`).
  - Browser title **"Preview | Quicktalog"** and `robots: noindex, nofollow` (`src/app/catalogues/[name]/preview/page.tsx:12-16`).
  - It works for a catalogue that is **not** `active`, where the live URL would show "Catalogue Not Found" (`src/app/catalogues/[name]/preview/page.tsx:31-36` vs `src/app/catalogues/[name]/page.tsx:143-147`).
  - A missing / unowned catalogue shows the "Catalogue Not Found" dialog (`src/app/catalogues/[name]/preview/page.tsx:32-33,39-40`).
  - The owner's own analytics tags do **not** load on a `/preview` path (`src/components/catalogue/view/CatalogueAnalytics.tsx:76-78`).
- The preview shows what was **saved**, so unsaved edits only reach it because Preview saves first.

---

## Adding content

### The "Add Section" tile

- A dashed tile below the last section, in edit mode only (`src/components/catalogue/view/Catalogue.tsx:280-294`, `src/components/catalogue/inputs/ContentBlockButton.tsx:14-30`).
- Exact wording: a `+` in an amber circle, title **Add Section**, subtitle **"Items, text, a divider, an embed or a custom visual"** (`src/components/catalogue/inputs/ContentBlockButton.tsx:20-28`).
- Looks: 2px dashed border in the catalogue's own colours, 48px circle, 18px bold title, 14px subtitle, 40px/16px padding, lifts 2px on hover (`src/styles/catalogue-chrome.css:253-310`).
- Clicking it first checks the plan's `sections_per_catalogue` against the current number of blocks; at or over the limit it opens the plan-limit dialog instead of the add dialog (`src/components/catalogue/view/Catalogue.tsx:282-292`).

### The "Add section" dialog

- Component `AddContentModal`, rendered once per catalogue (`src/components/catalogue/view/Catalogue.tsx:315-322`).
- Opening it **closes the editor panel** (`src/components/catalogue/modals/AddContentModal.tsx:68-69`).
- Opening to add always clears the edit target, so the previous edit cannot leak in (`src/components/catalogue/view/useSectionDialog.ts:28-31`).
- Layout: up to 880px wide and 600px tall from 720px, with the type list as a left column (224px) and the form on the right; below 720px it is a bottom sheet, full width, rounded top corners, sliding up, capped at `100dvh - 24px` (`src/components/catalogue/modals/AddContentModal.tsx:216-221`, `src/components/catalogue/modals/content/BuilderDialog.tsx:14-20`).
- Title: **Add section**, or **Edit section** when editing (`src/components/catalogue/modals/AddContentModal.tsx:225-227`).
- Footer buttons: **Cancel** (outline) and **Add section** / **Save section** (`src/components/catalogue/modals/AddContentModal.tsx:254-261`).
- Close: an `X` button (`aria-label="Close"`), in the title row on phones and in the form header from 720px (`src/components/catalogue/modals/AddContentModal.tsx:228-231`, `src/components/catalogue/modals/content/BlockConfigHeader.tsx:57`, `src/components/catalogue/modals/content/BuilderDialog.tsx:32-50`). It is an alert dialog, so a click outside does not close it; Esc does (`src/components/catalogue/modals/AddContentModal.tsx:215`).
- The type picker is a radio group, `aria-label="Section type"`: a scrolling pill bar on phones, a vertical list from 720px, arrow-key operable (`src/components/catalogue/modals/content/SectionTypePicker.tsx:43-58`, `src/hooks/useRadioKeys.ts:10-23`).
- The chosen pill is scrolled into view automatically (`src/components/catalogue/modals/content/SectionTypePicker.tsx:45`).

### Every content type offered, with its exact name and description

Names from `src/components/catalogue/modals/content/SectionTypePicker.tsx:17-23` and
`src/components/catalogue/modals/content/BlockConfigHeader.tsx:18-24`; descriptions from
`src/components/catalogue/modals/content/BlockConfigHeader.tsx:26-36`.

| Order | Name | Icon | Description shown under it |
|---|---|---|---|
| 1 | **Items** | `LayoutGrid` | "A group of items. With a heading it can collapse; without one it is a plain grid." |
| 2 | **Text** | `Type` | "Add rich text content with headings, lists, links, and formatting." |
| 3 | **Divider** | `SeparatorHorizontal` | "Add a visual separator with customizable spacing and border styles." |
| 4 | **External content** | `Globe` | "Embed external content such as maps, videos, or third-party widgets." |
| 5 | **Custom visual** | `Sparkles` | "Build a banner, animation or small interactive object with your own HTML, CSS and JavaScript." |

- The default selection when adding is **Items** (`src/components/catalogue/modals/AddContentModal.tsx:63,100`).
- Plan-locked types still show, with a padlock and the screen-reader text **"(upgrade required)"** (`src/components/catalogue/modals/content/SectionTypePicker.tsx:79-87`).
- Which types are locked: **Divider**, **External content** and **Custom visual**, each gated by its own plan flag; a tier that omits a flag does not get the block (`src/components/catalogue/modals/AddContentModal.tsx:106-121`).
- A locked type keeps its form visible but covers it with the upgrade overlay and disables the add button (`src/components/catalogue/modals/AddContentModal.tsx:201,211`, `src/components/catalogue/modals/content/BlockConfigForm.tsx:47-49`).
- Upgrade overlay text: lock tile, **Upgrade required**, **"Upgrade your plan to unlock this feature."**, button **Upgrade now** (`src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:29-49`).

### Fields per type

- **Items** (`src/components/catalogue/modals/content/ItemsBlockFields.tsx:29-95`):
  - A required text field labelled **Heading** (placeholder "e.g. Breakfast"), which becomes **Section name** (placeholder "e.g. Weekly specials") when the heading is turned off, with the hint **"Not shown to customers. It names the section when you move items."** (`:31-52`).
  - Two switches side by side from 720px, stacked below: **Show heading** — "Title bar above the items"; **Auto-expand** — "Open when the page loads", which becomes "Turn on the heading first" and is disabled while the heading is off (`:54-80`).
  - **Layout** — four radio tiles with drawn SVG thumbnails, two columns under 360px and four above; arrow-key operable; the chosen tile gets an amber ring and a check badge (`:82-94`, `src/components/catalogue/modals/content/LayoutPicker.tsx:149-218`).
  - The four layout labels, exactly: **Side Image** (`variant_1`), **Top Image** (`variant_2`), **Text Only** (`variant_3`), **Carousel** (`variant_4`) (`../quicktalog-packages/src/constants/general.ts:75-104`). The `image` field on those entries (`/layouts/variant_*.jpg`) is **not used** any more — the tiles are drawn SVGs (`src/components/catalogue/modals/content/LayoutPicker.tsx:13-124`, `docs/architecture/builder.md:45`).
  - **Text Only** hides the image field in the item dialog entirely (`src/components/catalogue/inputs/item/ItemImage.tsx:29`).
- **Text**: an optional **Section name** plus a **Content** rich-text editor that previews in the catalogue font (`src/components/catalogue/modals/content/BlockConfigForm.tsx:69-92`).
- **Divider**: an optional **Section name** plus **Vertical spacing** (0–10 rem, 0.5 steps), a **Show a border line** checkbox and, when on, **Style** (Solid / Dashed / Dotted), **Thickness** (1–10px), **Colour** and opacity (`src/components/catalogue/modals/content/BlockConfigForm.tsx:94-111`, `src/components/catalogue/inputs/DividerInput.tsx:45-125`).
- **External content**: an optional **Section name**, a "What would you like to embed?" row of preset pills — **Maps**, **Booking**, **Media**, **Commerce**, **Social Media** — which only change the placeholder, and a required **Embed code** textarea, min 180px, monospace (`src/components/catalogue/inputs/EmbeddingInput.tsx:20-114`).
- **Custom visual**: an optional **Section name** plus a required **HTML code** Monaco editor, 120px tall with an **Expand editor** / **Collapse editor** button taking it to 350px, and the note "HTML, CSS and JavaScript for a banner, animation or small interactive object. It runs in an isolated frame, so analytics and tracking scripts will not work here - connect those under Analytics & tracking in the General tab." (`src/components/catalogue/inputs/CustomVisualInput.tsx:13-27`, `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:18-74`).
- The optional **Section name** field for text / divider / embed / custom visual carries the hint **"Describes this section for screen readers and identifies it in the builder. Not shown on the page."** with placeholder "e.g. Summer sale banner" (`src/components/catalogue/inputs/BlockNameInput.tsx:22-40`).
- Validation (what disables the add button) (`src/components/catalogue/modals/AddContentModal.tsx:200-209`):
  - **Items** needs a non-empty heading/name.
  - **External content** and **Custom visual** need non-empty code.
  - **Text** and **Divider** need nothing.
  - A locked type is always invalid.
- A **Text** section saved with no content gets the placeholder markup `<p>New text block</p>` (`src/components/catalogue/modals/AddContentModal.tsx:177-182`).

### Where new content lands

- A new section is **appended to the end** of the catalogue, and every block's `order` is renumbered from 0 (`src/components/catalogue/modals/AddContentModal.tsx:192-196`, `src/context/CatalogueContext.tsx:191-201,107-109`).
- A new section gets a fresh `crypto.randomUUID()` id (`src/components/catalogue/modals/AddContentModal.tsx:152-154`).
- A new item is **appended to the end** of its section's items (`src/context/CatalogueContext.tsx:231-236`).

### Adding an item

- Entry point: the dashed **Add New Item** tile, the last cell in a section's grid (or the last slide of a carousel), edit mode only (`src/components/catalogue/sections/common/Items.tsx:36-58,178-185,226-228`).
- Clicking it checks the plan's item limit first and opens the plan-limit dialog instead if the catalogue is full (`src/components/catalogue/view/CatalogueContent.tsx:218-228,215-216`).
- Dialog title **Add item** (or **Edit item**), subtitle **"In <section name>"**, or **"Name, price and picture of the item."** when the section has no name (`src/components/catalogue/modals/ItemModal.tsx:96-108,404-407`).
- Opening it also closes the editor panel (`src/components/catalogue/modals/ItemModal.tsx:63-64`).
- Up to 640px wide; a bottom sheet below 720px (`src/components/catalogue/modals/ItemModal.tsx:95`).
- Fields (`src/components/catalogue/inputs/ItemInput.tsx:21-31`):
  - **Name** (required, placeholder "e.g. Pancakes") and **Description** (placeholder "e.g. Pancakes with Nutella, cherries, and ice cream", min 84px, not resizable) (`src/components/catalogue/inputs/item/ItemDetails.tsx:20-46`).
  - **Price (<currency>)** with a unit dropdown — none / kg / g / l / ml / pcs / portion — and checkboxes **Free** and **On sale**; price accepts at most two decimals (`src/components/catalogue/inputs/item/ItemPricing.tsx:23-31,60-63,142-210`).
  - With **On sale** on: **Sale price** and **Percentage**, each required-marked, kept in sync with each other (`src/components/catalogue/inputs/item/ItemPricing.tsx:77-105,213-259`).
  - Entering a price of 0, a 100% discount, or a sale price of 0 flips the item to **Free** and drops the discount (`src/components/catalogue/inputs/item/ItemPricing.tsx:125-138`).
  - **Image** with **Upload** / **URL** tabs; the URL tab accepts `https://example.com/image.jpg`. The whole image block is hidden for the text-only layout (`variant_3`) (`src/components/catalogue/inputs/item/ItemImage.tsx:29,31-90`).
- Footer (`src/components/catalogue/modals/ItemModal.tsx:129-155`):
  - When adding: **Cancel** (hidden below 720px — the header `X` cancels there), **Add item & add another** (shortened to **Add another** below 720px) and **Add item**.
  - When editing: **Cancel** and **Save item**.
- **Add another** keeps the dialog open, resets the form and shows a green status strip **"Item added"** for 2 seconds (`src/components/catalogue/modals/ItemModal.tsx:78-85,111-119`).
- The save button is disabled until the name is non-empty, the price is valid, and no image upload is in flight (`src/components/catalogue/modals/ItemModal.tsx:88-91`).
- Every **Add another** re-checks the plan item limit; hitting it closes the item dialog and opens the plan-limit dialog (`src/components/catalogue/view/CatalogueContent.tsx:204-212`, `src/components/catalogue/modals/ItemModal.tsx:70-75`).

### Templates

- Opened from the rail/bar **Templates** button, which closes the editor panel first (`src/components/catalogue/builder/useBuilderActions.ts:156-165`).
- **It also opens by itself**: a catalogue with an id and zero content blocks opens the template picker on load, once (`src/components/catalogue/modals/SelectTemplateModal.tsx:68-77`, mounted at `src/components/catalogue/view/Catalogue.tsx:335`).
- While it is open, Quick AI and the editor panel are forced closed (`src/components/catalogue/modals/SelectTemplateModal.tsx:40-50`).
- Dialog: title **Choose a Template**, subtitle **"Start with a pre-made layout or build from scratch"**, up to 1024px wide (`src/components/catalogue/modals/SelectTemplateModal.tsx:86-97`).
- Three options, as a radio group, arrow-key operable (`src/components/catalogue/inputs/TemplatesInput.tsx:32-65,104-112`):
  - **Quick Start** — badge **Recommended**, "Everything you need to start selling right away", details "2 categories" · "6 items" (really 2 items blocks, 6 items — counted in `src/constants/catalogueTemplates.ts:307-420`).
  - **Standard Catalog** — "A flexible layout that works for everyone", details "4 categories" · "15 items". The data actually holds **5** items blocks and 15 items; one of them has `showHeading: false`, so only 4 headings are visible, but all 5 count against the plan (`src/constants/catalogueTemplates.ts:24-305`, `:265-266`).
  - **Start from Scratch** — "Build your catalog exactly the way you want it", detail "Blank Catalogue".
- Button: **Select template** (`src/components/catalogue/inputs/TemplatesInput.tsx:193-197`).
- Applying a template **replaces** `content` entirely (`src/components/catalogue/inputs/TemplatesInput.tsx:83-88`).
- If the catalogue already has content, a confirm dialog appears first (`src/components/catalogue/inputs/TemplatesInput.tsx:90-100,199-222`):
  - Title: **Change template?**
  - Body: **"This will change your existing content. Please save it first to not lose progress."**
  - Buttons: **Cancel** and **Save & continue** (destructive styling). **Save & continue** saves the current draft and only then swaps the content in; if the save fails nothing is replaced.
- Each application mints fresh ids and 0-based order, so two catalogues from the same template never share ids (`src/constants/catalogueTemplates.ts:4-22,422-426`).

---

## Editing in place: section controls

- Controls render **only in edit mode** (`src/components/catalogue/sections/ItemsSection.tsx:116-144`, `src/components/catalogue/sections/TextBlock.tsx:35-41`, `src/components/catalogue/sections/EmbeddingBlock.tsx:188`, `src/components/catalogue/sections/CustomVisual.tsx:189`).
- Two shapes:
  - **Section with a heading**: one ⋯ button inside the header, right side, where the collapse chevron sits in view mode; the header gets extra right padding in edit mode so the title never runs under it (`src/components/catalogue/sections/common/SectionHeader.tsx:44-52,116-129`).
  - **Section without a heading** (text, divider, embed, custom visual, items with the heading off): a row **above** the block, with the type label on the left as a pill and the ⋯ on the right (`src/components/catalogue/cards/common/BlockControls.tsx:36-78`). The type labels are **Items**, **Text**, **Divider**, **Embed**, **Custom visual** (`src/components/catalogue/sections/ItemsSection.tsx:133`, `src/components/catalogue/sections/TextBlock.tsx:54`, `src/components/catalogue/sections/DividerBlock.tsx:65`, `src/components/catalogue/sections/EmbeddingBlock.tsx:192`, `src/components/catalogue/sections/CustomVisual.tsx:193`).
- Visibility: on devices that can hover the ⋯ (or the whole row) is invisible until the section is hovered or focused, or the menu is open; on touch it is always visible (`src/components/catalogue/cards/common/BlockMenu.tsx:71`, `src/components/catalogue/cards/common/BlockControls.tsx:47-49`).
- Trigger: a round `MoreHorizontal` button, 36×36 in a header and 32×32 in a control row, `aria-label`/tooltip **"<section name> options"** (`src/components/catalogue/cards/common/BlockMenu.tsx:68-83`).
- Menu contents, in order (`src/components/catalogue/cards/common/BlockMenu.tsx:85-160`):
  1. the section's name as a (truncated) heading,
  2. **Edit section** (pencil) — the default label; text blocks say **Edit text** and dividers **Edit divider** (`src/components/catalogue/cards/common/BlockMenu.tsx:52,87-92`, `src/components/catalogue/sections/TextBlock.tsx:50`, `src/components/catalogue/sections/DividerBlock.tsx:61`),
  3. a **Layout** group — items sections only: four drawn tiles in one row as a radio group, with the current layout's name printed under them (`src/components/catalogue/cards/common/BlockMenu.tsx:94-124`),
  4. **Move up** (chevron up, disabled on the first section) and **Move down** (chevron down, disabled on the last) (`:126-142`),
  5. **Delete section** (trash, error-coloured) (`:144-159`).
- **Delete asks for confirmation — with the browser's own dialog**: `confirm("Are you sure you want to delete this section?")`, so the buttons are the browser's OK / Cancel (`src/components/catalogue/cards/common/BlockMenu.tsx:149-152`).
- **Editing a section** reopens the Add/Edit dialog with that section loaded (`src/components/catalogue/view/Catalogue.tsx:164-167`, `src/components/catalogue/view/useSectionDialog.ts:32-35`). The save is a **patch**: it carries no id, no order and, for items sections, no items — so a section keeps the items it has now, not the ones the form snapshotted (`src/components/catalogue/modals/AddContentModal.tsx:148-164,195`).
- **Text** and **Divider** are edited **inline**, not in a dialog: clicking the block starts editing, and while editing the control row shows a green-on-amber **Done** button (with a check) instead of the Edit entry (`src/components/catalogue/sections/TextBlock.tsx:57,61-77`, `src/components/catalogue/sections/DividerBlock.tsx:68,73-88`, `src/components/catalogue/cards/common/BlockControls.tsx:58-67,73`).
- In edit mode a section with a heading is always expanded in the builder, whatever its auto-expand setting (`src/components/catalogue/sections/ItemsSection.tsx:94`, `src/components/catalogue/sections/common/SectionHeader.tsx:40`).
- Edit-mode-only outlines: a headless items section gets a 2px dashed border (`src/components/catalogue/sections/ItemsSection.tsx:99-105`); text and divider blocks get a dashed border that turns amber while being edited (`src/components/catalogue/sections/TextBlock.tsx:46`, `src/components/catalogue/sections/DividerBlock.tsx:57`).

## Editing in place: card (item) controls

- One ⋮-style menu per card: a small pill, 32×22 (32×32 from 540px), in the card's **top-right** corner, `aria-label`/tooltip **"More options"** (`src/components/catalogue/cards/common/CardControls.tsx:44-49,80-88`).
- It never covers the title: the title gets right padding, except on cards whose first full-width child is the image (top-image, carousel), where the pill sits over the image instead (`src/components/catalogue/cards/common/CardControls.tsx:35-48`).
- Hidden until hover/focus on hover-capable devices, always visible on touch (`src/components/catalogue/cards/common/CardControls.tsx:46`).
- Rendered only in edit mode and only when both an edit and a delete handler exist (`src/components/catalogue/cards/common/BaseCard.tsx:40-51`).
- Menu contents, in order (`src/components/catalogue/cards/common/CardControls.tsx:90-158`):
  1. **Edit item** (pencil),
  2. **Move up** (disabled on the first item), **Move down** (disabled on the last),
  3. **Move to section** — a submenu listing every **other** items section by name, or **"Untitled section"** when a section has none; it only appears when another items section exists (`:65-70,113-145`),
  4. a separator, then **Delete item** (trash, error-coloured).
- **Delete asks for confirmation with the browser's own dialog**: `confirm("Are you sure you want to delete this item?")` (`src/components/catalogue/cards/common/CardControls.tsx:149-152`).
- Clicking the card body itself opens the **customer-facing item detail popup**, in edit mode too — editing is only via the menu (`src/components/catalogue/cards/index.tsx:95-118`, `src/components/catalogue/cards/common/BaseCard.tsx:33-38`).
- A card's control resolves which item it means at click time, from the block it is rendered in (`src/components/catalogue/view/CatalogueContent.tsx:162-194`).
- An item moved to another section lands at the **end** of that section's items (`src/context/CatalogueContext.tsx:290-302`).

## Reordering

- Reordering is **menu only — there is no drag and drop anywhere in the builder.** No `draggable`, `onDragStart` or DnD library appears in `src/components/catalogue` or `src/components/ui` (searched).
- Sections move one step at a time, by id; a move that would go past either end is a no-op, and the whole list's `order` is renumbered after every move (`src/context/CatalogueContext.tsx:220-229,107-109`).
- Items move the same way inside their section (`src/context/CatalogueContext.tsx:255-268`).
- Move up/down entries are disabled at the ends, computed from the block's index (`src/components/catalogue/view/CatalogueContent.tsx:284-285`, `src/components/catalogue/sections/common/Items.tsx:149-150,196-197`).
- Every content edit addresses a **section id** and an **item id**, never a position; an id that is gone silently drops the edit and nothing else moves (`src/context/CatalogueContext.tsx:50-68,141-163`).

---

## Undo

- **There is no general undo and no redo.** The context exposes no undo/history API (`src/context/CatalogueContext.tsx:27-100`).
- The only undo is for **Quick AI** edits, while they are still under review: the review bar's **Reject** button puts the catalogue back to how it was before the first AI edit in that batch (`src/components/catalogue/chat/AiReviewBar.tsx:96-111`, `src/context/CatalogueContext.tsx:359-364`).
- Review bar text (`src/components/catalogue/chat/AiReviewBar.tsx:36-111`):
  - `aria-label` **"Review AI changes"**
  - headline **"N AI change(s) to review"**, or **"Quick AI is still making changes"** while it works
  - body **"Highlighted on your catalogue. Accept to keep them, or reject to undo them all."**
  - **Show details** / **Hide details** reveals one line per edit
  - buttons **Reject** (undo icon) and **Accept** (check); both disabled while the AI is still working
- Accepting saves the draft and announces **"Kept and saved the AI changes."**, or **"Kept the AI changes, but they are not saved yet."** plus an error toast (`src/components/catalogue/chat/CatalogueChat.tsx:230-238`, `src/hooks/useKeepAiChanges.ts:10-13`).
- Rejecting announces **"Undid the AI changes."** (`src/components/catalogue/chat/CatalogueChat.tsx:239-242`).
- Any **hand edit** made while a review is open silently ends the review and keeps the AI edits — rejecting afterwards would throw the hand edit away too (`src/context/CatalogueContext.tsx:366-372`).
- Saving or publishing also ends the review and keeps the AI edits (`src/components/catalogue/builder/useBuilderActions.ts:51,102`).

**What cannot be undone, plainly:**

- Deleting a section or an item. Both only ask the browser's `confirm`, then the block or item is gone from the draft (`src/components/catalogue/cards/common/BlockMenu.tsx:149-152`, `src/components/catalogue/cards/common/CardControls.tsx:149-152`, `src/context/CatalogueContext.tsx:203-208,248-253`). Reloading before saving brings back the last **saved** draft (`src/lib/catalogue/draft-cache.ts:40-71`), which is the only recovery.
- Applying a template: it replaces all content, and the confirm dialog's only mitigation is saving first (`src/components/catalogue/inputs/TemplatesInput.tsx:83-88,199-222`).
- Saving: it overwrites the stored draft (`src/actions/catalogue.ts:368-371`).
- Publishing: it overwrites the live row and there is no version history or rollback (`src/actions/catalogue.ts:460-473`).
- Leaving with **Leave**: the in-memory draft is discarded (`src/hooks/useBeforeUnload.ts:143-150`, `src/context/CatalogueContext.tsx:182-185`).
- A move, a layout change, a heading edit: no step-back exists for any of them.

---

## Sections vs items: the structure

- A catalogue is one object with a `heading`, a `content` array, plus appearance/header/footer/contact/metadata settings (`src/context/CatalogueContext.tsx:27-35`, `src/components/catalogue/view/Catalogue.tsx:192-335`).
- `content` is a flat array of **blocks** ("sections" in the UI). **Nesting is not possible** — a block never contains another block (`src/components/catalogue/view/CatalogueContent.tsx:269-402`).
- Five block types: `items`, `text`, `divider`, `embedding`, `custom_visual` (`src/components/catalogue/modals/content/BlockConfigHeader.tsx:6-11`).
- **Only an `items` block holds items.** Items are a flat array inside it; items cannot nest either (`src/context/CatalogueContext.tsx:150-163,231-236`).
- So the hierarchy is exactly: catalogue → blocks → (for items blocks) items. Two levels deep, no more.
- Legacy block keys `category` and `container` are mapped to `items` before anything matches on type, so old rows keep working (`src/components/catalogue/view/CatalogueContent.tsx:64-75`, `../quicktalog-packages/src/helpers/plan-fit.ts:6`).
- An items block's heading doubles as its collapse toggle, so a headless section is always open (`src/components/catalogue/sections/ItemsSection.tsx:37-40,94`).
- Items render as one of four card layouts, chosen per section: **Side Image** (`variant_1`), **Top Image** (`variant_2`), **Text Only** (`variant_3`), **Carousel** (`variant_4`) (`src/components/catalogue/cards/index.tsx:12-17`, `../quicktalog-packages/src/constants/general.ts:75-104`).
- Grid per layout: 1 column (2 from 720px) for side-image and text-only, a wrapping flex row for top-image, a swipeable carousel for `variant_4` (`src/components/catalogue/sections/common/Items.tsx:16-29,129-187`).
- The catalogue **heading is not a block** and is edited directly on the page (`docs/architecture/builder.md:70-71`, `src/components/catalogue/view/components/Heading.tsx:17`).

### The catalogue heading, in place

- In edit mode the heading is a `contenteditable` box with a dashed border, placeholder **"+ Add Heading"**, `aria-label="Catalogue heading"` (`src/components/catalogue/inputs/heading/EditableHeading.tsx:6,41-96`).
- The border turns amber and solid while focused (`src/components/catalogue/inputs/heading/EditableHeading.tsx:49-50`).
- A floating toolbar appears above it while focused: **Bold**, **Italic**, and a **Heading size** dropdown with **Small**, **Medium**, **Large**, **Extra Large** (`src/components/catalogue/inputs/heading/FormattingToolbar.tsx:18-23,49-110`, `src/components/catalogue/inputs/HeadingInput.tsx:42-52`).
- A character counter sits under it while focused, as `N/100`, turning error-coloured at the limit (`src/components/catalogue/inputs/heading/CharacterCount.tsx:9-23`, `src/components/catalogue/inputs/HeadingInput.tsx:68-72`).
- **Hard limit: 100 characters**, counted on the visible text; typing and pasting past it are blocked, and a paste is truncated to what fits (`src/lib/catalogue/heading.ts:4`, `src/components/catalogue/inputs/heading/useHeadingEditor.ts:128-145,199-211`).
- Over the limit the AI's heading is cut and its formatting dropped rather than cut mid-tag (`src/lib/catalogue/heading.ts:49-59`).
- At most **two** line breaks: a third Enter is ignored (`src/components/catalogue/inputs/heading/useHeadingEditor.ts:188-197`).
- Typing that would make the box taller than it is is reverted, with the caret restored (`src/components/catalogue/inputs/heading/useHeadingEditor.ts:147-165`).
- A heading written by Quick AI or a template appears here, but only once the caret has left the box — it never interrupts someone mid-word (`src/components/catalogue/inputs/heading/useHeadingEditor.ts:38-54`).
- Width: the box is 80%→30% min-width and 94%→50% max-width as the screen grows (`src/components/catalogue/inputs/heading/EditableHeading.tsx:52-53`).
- Published heading sizes: large = `text-3xl md:text-4xl lg:text-5xl`, and so on (`src/constants/builder.ts:44-49`); the default is `large` (`src/lib/catalogue/heading.ts:6`).

---

## Every user-visible message in and around the builder

### Toasts

| Text | Cause | Evidence |
|---|---|---|
| "Saving..." | Save (and Preview) in flight | `src/components/catalogue/builder/useBuilderActions.ts:55` |
| "Catalogue saved successfully" | Save succeeded | `src/components/catalogue/builder/useBuilderActions.ts:60` |
| "Failed to save catalogue" | Save failed with no server reason | `src/components/catalogue/builder/useBuilderActions.ts:62-63` |
| "Publishing..." | First publish in flight | `src/components/catalogue/builder/useBuilderActions.ts:106` |
| "Catalogue published successfully" | First publish succeeded | `src/components/catalogue/builder/useBuilderActions.ts:117` |
| "Failed to publish catalogue" | First publish failed with no reason | `src/components/catalogue/builder/useBuilderActions.ts:119` |
| "Updating..." | Re-publishing a live catalogue | `src/components/catalogue/builder/useBuilderActions.ts:123` |
| "Catalogue updated successfully" + a **View** action | Re-publish succeeded | `src/components/catalogue/builder/useBuilderActions.ts:126,132-137` |
| "Failed to update catalogue" | Re-publish failed with no reason | `src/components/catalogue/builder/useBuilderActions.ts:138` |
| "Failed to update status" | The publish action returned unsuccessfully with no error text | `src/components/catalogue/builder/useBuilderActions.ts:110,125` |
| "Please save the catalogue first" | Publish pressed with no catalogue id | `src/components/catalogue/builder/useBuilderActions.ts:99` |
| "Catalogue has no name/slug" | Preview saved but the result has no slug | `src/components/catalogue/builder/useBuilderActions.ts:87` |
| "Could not save your changes" | Keeping AI changes could not save | `src/components/catalogue/chat/CatalogueChat.tsx:237`, `src/hooks/useSaveDraft.ts:20` |
| "`<reason>`. Your changes are still here." + pricing opens in a new tab | Upgrade pressed while the draft cannot be saved | `src/hooks/useUpgrade.ts:21-24` |
| "Started a new custom theme. Customize the colors below, then save it to reuse later." | Choosing the Custom theme in Appearance | `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:95-96` |
| "Theme saved" / "Theme updated" | Saving a custom theme | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:115` |
| "Give your theme a name first" | Saving a custom theme without a name | `src/components/catalogue/inputs/sidebar/appearance/CustomThemeConfiguration.tsx:106` |
| "Failed to save theme" / "Failed to delete theme" | Theme action failed | `.../CustomThemeConfiguration.tsx:117`, `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:108` |
| "Please select a valid image file" | A non-image file dropped | `src/components/general/ImageDropzone.tsx:65-67,114-116` |
| "File is too large. Please select a smaller image" | Image over 50 MB | `src/components/general/ImageDropzone.tsx:69-71` |
| "SVG images aren't supported here. Please upload a PNG or JPG." | SVG dropped | `src/components/general/ImageDropzone.tsx:73-78` |
| "Failed to process image" | Image decode/resize failed | `src/components/general/ImageDropzone.tsx:114-116` |

### Server refusal texts (surfaced in the save/publish toast)

| Text | Cause | Evidence |
|---|---|---|
| "Your plan allows N sections per catalogue" | Save/publish would add a section past the limit | `src/lib/entitlements/plan.ts:134-137` |
| "Your plan allows N items per catalogue" | Save/publish would add an item past the limit | `src/lib/entitlements/plan.ts:140-144` |
| "Divider sections are not part of your plan" / "External content sections are not part of your plan" / "Custom visual sections are not part of your plan" | Save/publish would add a block type the plan lacks | `src/lib/entitlements/plan.ts:155-166`, `../quicktalog-packages/src/helpers/plan-fit.ts:33-41` |
| "Remove N item(s), N section(s) and the X sections to fit the `<plan>` plan." | Publishing a catalogue that does not fully fit the plan | `../quicktalog-packages/src/helpers/plan-fit.ts:92-111`, `src/lib/entitlements/plan.ts:82-84` |
| "This month's traffic limit for your plan is reached" | Publishing while over the traffic limit | `src/lib/entitlements/plan.ts:90-95` |
| "Failed to save the draft" | Redis write failed on save | `src/actions/catalogue.ts:375` |
| "Unauthorized" / "Not found" / "An unexpected error occurred" | Not signed in, not the owner, or an unexpected failure | `src/actions/catalogue.ts:338,363,381,445,448` |

### Status lines, empty states and inline notes

- **"Item added"** — green strip in the item dialog after **Add another**, 2 seconds (`src/components/catalogue/modals/ItemModal.tsx:111-118,81-85`).
- **"Invalid data for this section"** — red alert box when a stored items section has no items array, in **view mode only** (`src/components/catalogue/sections/ItemsSection.tsx:71-92`).
- **"Invalid item data"** — red box in place of a card whose record has no name (`src/components/catalogue/cards/index.tsx:54-65`).
- **"No embed code provided"** — dashed grey placeholder for an embed block with no code (`src/components/catalogue/sections/EmbeddingBlock.tsx:210-214`).
- **"Show more (N remaining)"** — button under a section showing more than 20 items (`src/components/catalogue/sections/common/Items.tsx:233-245`).
- **"Nothing here yet"** / **"Content you add will appear here. Get started by adding your first item."** — the empty state for a catalogue with no blocks, rendered **only in view mode**; the builder shows the Add Section tile instead (`src/components/catalogue/view/CatalogueContent.tsx:230-257`).
- Search bar (shown when the owner turns it on, in the builder too): **"No items match “q”."** or **"N item(s) match “q”"**, placeholder **"Search items…"** unless the owner set one, `aria-label="Search catalogue items"` (`src/components/catalogue/view/CatalogueSearchBar.tsx:67-99`).
- Background clash note in Appearance: **"Your theme's text is `<tone>`, so it will be hard to read on this `<tone>` background. Pick a `<other tone>` one, or a `<tone>` theme."** (`src/components/catalogue/inputs/sidebar/appearance/BackgroundConfiguration.tsx:127-142`).
- Upgrade overlay over a locked group: **Upgrade required** / **"Upgrade your plan to unlock this feature."** / **Upgrade now**; the branding variant reads **"Make your catalog truly yours. Add your logo and brand details, and customize the header and footer. Upgrade your plan to unlock this feature."** (`src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:29-49`). Locked fields stay visible, dimmed to 30% and `inert` (`src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:26-41`).
- Image dropzone: label **"Choose a file or drag it here"**, hint **"PNG, JPG or WebP, up to 50 MB. We resize it for you."**, a spinner with `aria-label="Uploading"` while it works, and `aria-label="Remove image"` on the preview's × (`src/components/general/ImageDropzone.tsx:11,18,20-26,191-198,217-250`).

### Validation markers

- A red `*` marks required fields: items heading, item name, embed code, custom-visual HTML, sale price, percentage (`src/components/catalogue/modals/content/ItemsBlockFields.tsx:34-36`, `src/components/catalogue/inputs/item/ItemDetails.tsx:22-26`, `src/components/catalogue/inputs/EmbeddingInput.tsx:100-103`, `src/components/catalogue/inputs/custom-visual/CodeEditor.tsx:19-22`, `src/components/catalogue/inputs/item/ItemPricing.tsx:216-237`).
- Validation is **button-disabling only** — no inline error text appears in the add-section or item dialogs (`src/components/catalogue/modals/AddContentModal.tsx:200-209,258`, `src/components/catalogue/modals/ItemModal.tsx:88-91`).
- Price fields reject anything that is not digits with at most two decimals, by refusing the keystroke (`src/components/catalogue/inputs/item/ItemPricing.tsx:60-70`).

---

## Limits

Plan numbers from `../quicktalog-packages/src/constants/pricing.ts:3-191`:

| Plan | Sections per catalogue | Items per catalogue | Divider | External content | Custom visual | Catalogues | Page views/month | AI credits |
|---|---|---|---|---|---|---|---|---|
| Starter | 5 | 15 | no | no | no | 1 | 500 | 15 |
| Basic | 8 | 30 | yes | no | no | 1 | 2,000 | 50 |
| Pro | 15 | 100 | yes | yes | yes | 6 | 5,000 | 150 |
| Growth | 30 | 200 | yes | yes | yes | 20 | 15,000 | 300 |
| Premium | 50 | 300 | yes | yes | yes | 50 | 40,000 | 600 |

(evidence lines: Starter `:23,32,24-28`; Basic `:62-63,50-54`; Pro `:93-94,85-89`; Growth `:124-125,115-119`; Premium `:155-157,146-150`. A bespoke "German Silva Custom Plan" also exists at 20 sections / 200 items, `:160-190`.)

- **What counts as a section: every block, text and dividers included.** The catalogue heading is not a block (`../quicktalog-packages/src/helpers/plan-fit.ts:11-14`, `docs/architecture/builder.md:70-71`).
- **What counts as an item: the items inside items blocks, across the whole catalogue** — not per section (`../quicktalog-packages/src/helpers/plan-fit.ts:16-26`, `src/lib/catalogue/operations.ts:121-123`).
- **Heading: 100 characters** (`src/lib/catalogue/heading.ts:4`).
- **Search placeholder: 40 characters; footer tagline: 120, collapsed to one line** (`docs/architecture/catalogue-chrome.md:16`).
- **Image upload: 50 MB before the browser resizes it**; SVG refused; resized to 1024px on the long edge and about 1200 KB by default, 400 KB for the logo (`src/components/general/ImageDropzone.tsx:11,48-49,73-78`, `src/components/catalogue/inputs/sidebar/GeneralTab.tsx:79`).
- **A custom visual's frame is capped at 5000px tall** (`src/components/catalogue/sections/CustomVisual.tsx:16,171`).
- **Items render 20 at a time**, with "Show more" adding 20 more (`src/lib/catalogue/items.ts:3-4`, `src/components/catalogue/sections/common/Items.tsx:99,105`).
- **Divider: spacing 0–10 rem in 0.5 steps, thickness 1–10px** (`src/components/catalogue/inputs/DividerInput.tsx:46-52,88-96`).

### What the user sees at a limit

- **Add Section** at the section limit, and **Add section** inside the dialog at the section limit, both open the plan-limit dialog instead of adding (`src/components/catalogue/view/Catalogue.tsx:282-292`, `src/components/catalogue/modals/AddContentModal.tsx:123-144`).
- **Add New Item**, and every **Add another**, at the item limit open the plan-limit dialog (`src/components/catalogue/view/CatalogueContent.tsx:204-228`).
- The plan-limit dialog (`src/components/modals/LimitsModal.tsx:21-56`):
  - Title **"Need More Sections?"** / **"Need More Items?"** — "More" only when the current plan already allows some (`src/components/modals/limits/LimitsModalHeader.tsx:28-62`, `src/components/modals/limits/limitContent.ts:117,129`).
  - Body **"Upgrade your plan to unlock more features and take your digital catalogues to the next level."** (`src/components/modals/limits/LimitsModalHeader.tsx:63-67`).
  - Sections copy: **"Better organization drives more sales. Upgrade to create N categories and help customers find exactly what they need."** (`src/components/modals/limits/limitContent.ts:128-139`).
  - Items copy: **"Showcase your complete product range! Upgrade to add up to N items per catalogue and never miss a sales opportunity."** (`src/components/modals/limits/limitContent.ts:116-127`).
  - A **Current plan → Required plan** comparison with both numbers and plan names (`src/components/modals/limits/LimitUpgradeComparison.tsx:104-130`).
  - A **"What You'll Get with `<plan>`"** tick list of the next plan's catalogues, sections, items, AI credits, branding, page views and newsletter (`src/components/modals/limits/LimitUpgradeComparison.tsx:71-99,142-147`).
  - Button **"Upgrade to `<plan>` Now"**, which **saves the draft first** and then goes to `/pricing` (`src/components/modals/limits/LimitUpgradeComparison.tsx:163-172`, `src/hooks/useUpgrade.ts:15-25`).
  - On the top plan it becomes **Purchase Custom Plan** — "Get limits and features fully tailored to your needs. Contact our team to get more information." with a **Contact us Now** button to `/contact` (`src/components/modals/limits/LimitUpgradeComparison.tsx:133-140,152-161`).
  - "unlimited" prints as **Unlimited**, a missing limit as **N/A** (`src/components/modals/limits/limitContent.ts:22-26`).
- A **locked block type** shows the padlock in the type list and the upgrade overlay over its form, with the add button disabled — it is never silently hidden (`src/components/catalogue/modals/content/SectionTypePicker.tsx:79-87`, `src/components/catalogue/modals/content/BlockConfigForm.tsx:47-49`).
- Limits are enforced in three places with the same counters: Quick AI on the server, the browser's replay of its edits, and the save/publish actions as the authority (`docs/architecture/builder.md:49-66`, `src/lib/entitlements/operation-limits.ts:12-25`, `src/lib/entitlements/plan.ts:109-167`).
- **After a downgrade, the limits are growth-only:** an over-limit catalogue can still be saved, edited, moved and trimmed — just not grown; and a locked block already there can be deleted but not added again (`src/lib/entitlements/plan.ts:99-103,129-167`, `docs/architecture/builder.md:74-77`).
- **Going live needs a full fit**: publishing refuses until the catalogue fits the plan completely, naming what to remove (`src/lib/entitlements/plan.ts:77-85`, `../quicktalog-packages/src/helpers/plan-fit.ts:54-111`).

---

## Keyboard shortcuts

- **Esc** closes the editor panel (and is swallowed if it came from a portaled menu, which closes itself first) (`src/components/catalogue/builder/BuilderPanel.tsx:61-65,56-59`).
- **Tab** is trapped inside the editor panel below 1280px and free from 1280px (`src/components/catalogue/builder/BuilderPanel.tsx:66-80`).
- **Arrow keys** move and select inside every radio group: section type, layout tiles, templates (`src/hooks/useRadioKeys.ts:10-23`, used at `src/components/catalogue/modals/content/SectionTypePicker.tsx:43`, `.../LayoutPicker.tsx:158`, `src/components/catalogue/inputs/TemplatesInput.tsx:77-81`).
- **/** focuses the catalogue search bar, when the owner has turned it on — it is ignored while a text field has focus; **Esc** inside it clears the query (`src/components/catalogue/view/CatalogueSearchBar.tsx:43-53,71-73,14-16`). The bar renders in the builder too (`src/components/catalogue/view/CatalogueContent.tsx:261-268`).
- **Enter** in the heading box inserts a line break, and is blocked once there are two (`src/components/catalogue/inputs/heading/useHeadingEditor.ts:188-197`). `enterKeyHint="done"` on phones (`src/components/catalogue/inputs/heading/EditableHeading.tsx:74`).
- Esc closes the builder dialogs, since they are Radix alert dialogs wired to close on `onOpenChange` (`src/components/catalogue/modals/AddContentModal.tsx:215`, `src/components/catalogue/modals/ItemModal.tsx:94`).
- No Cmd/Ctrl+S, no undo/redo shortcut, no shortcut help panel exists (searched; nothing binds `metaKey`/`ctrlKey` in the builder components).

---

## Surprising automatic behavior

- **Save does not touch the database.** It writes the draft to Redis with a 30-day TTL; only Publish writes the catalogue row (`src/actions/catalogue.ts:368-371,460-473`, `src/lib/catalogue/draft-cache.ts:9,74-81`). So a saved-but-unpublished change is invisible to customers, and a draft untouched for 30 days expires back to the published row.
- **The Redis key is the catalogue id, never the slug**, so a reused name can never show the previous owner's draft (`src/lib/catalogue/draft-cache.ts:12-18`).
- **A tampered draft cannot change identity**: id, name, status, owner and timestamps always come from the database row (`src/lib/catalogue/draft-cache.ts:61-70`), and the draft never stores `userId` (`:77`).
- **Two tabs: last save wins, silently.** There is no lock, version or conflict check — each tab holds its own in-memory draft and `updateCatalogue` overwrites the Redis key outright (`src/actions/catalogue.ts:368-371`, `src/lib/catalogue/draft-cache.ts:74-81`). Growth is judged against the **last saved draft**, not the published row, which is also what lets an over-limit catalogue be trimmed one save at a time (`src/actions/catalogue.ts:341-344,355`).
- **The template picker opens by itself** on a catalogue with an id and zero content blocks, once per mount (`src/components/catalogue/modals/SelectTemplateModal.tsx:68-77`).
- **Opening any content dialog closes the editor panel** (`src/components/catalogue/modals/AddContentModal.tsx:68-69`, `src/components/catalogue/modals/ItemModal.tsx:63-64`).
- **Opening the template picker closes both Quick AI and the editor panel**, and leaving the builder with it open still restores Quick AI (`src/components/catalogue/modals/SelectTemplateModal.tsx:40-58`).
- **Preview saves before it opens** (`src/components/catalogue/builder/useBuilderActions.ts:80-95`).
- **Publishing closes the editor panel**, refreshes the dashboard data, the user data and the route (`src/components/catalogue/builder/useBuilderActions.ts:107,114-116`).
- **Upgrading from any limit dialog saves first**, and if the save is refused it opens `/pricing` in a new tab so this one keeps the work (`src/hooks/useUpgrade.ts:15-25`).
- **A hand edit silently ends an open AI review** and keeps the AI's edits (`src/context/CatalogueContext.tsx:366-372`).
- **Quick AI's edits land on the draft immediately**, outlined with a dashed amber box per section and a solid amber outline plus an **"AI edit"** tab per card, until Accept or Reject (`src/components/catalogue/view/AiReviewHighlights.tsx:24-49`).
- **The browser tab's title and favicon are rewritten** to `<catalogue title> | Quicktalog` and the catalogue's icon while the builder is open, and restored on leaving (`src/components/catalogue/view/Catalogue.tsx:91-148`).
- **The catalogue's font and corner radius are written onto `document.documentElement`** so portaled dialogs inherit them, and removed on unmount (`src/components/catalogue/view/Catalogue.tsx:150-162`).
- **The HubSpot chat widget is hidden below 768px in the builder** via an injected stylesheet (`src/components/catalogue/view/Catalogue.tsx:176-186`).
- **Sections appear expanded in the builder regardless of auto-expand** (`src/components/catalogue/sections/ItemsSection.tsx:94`).
- **Searching in the builder hides the item controls and the Add New Item tile**, and hides sections with no match (`src/components/catalogue/view/CatalogueContent.tsx:276-278,292-319`).
- **The builder's search query stays local** — only the published page mirrors it into `?q=` (`src/components/catalogue/view/CatalogueContent.tsx:114-123`).
- **Legacy `category` / `container` blocks are silently mapped to `items`** before rendering (`src/components/catalogue/view/CatalogueContent.tsx:64-75`).
- **A heading saved before the wrapper existed is re-wrapped at the default size when published**, and `line-clamp-*` / `whitespace-nowrap` are stripped so long headings wrap (`src/components/catalogue/view/components/Heading.tsx:19-28`).
- **Plan settings are forced onto the payload on every save and publish** — branding header/footer, newsletter, tracking ids, custom themes, style, overlay, glass and background are reset when the plan lacks them, whatever the client sent (`src/lib/entitlements/catalogue.ts:28-84`, `src/actions/catalogue.ts:351-354,452`).
- **Custom visuals run in a sandboxed iframe with no same-origin access**, so analytics/tracking snippets cannot work there; the frame reports its own height back to the page (`src/components/catalogue/sections/CustomVisual.tsx:106-125,28-52,152-176`).
- **Embeds are sanitized**: `<script>` is discarded by the embed profile, and iframes are re-sized by type (16:9 for video/social, min 400px for maps, min 500px for booking) (`src/components/catalogue/sections/EmbeddingBlock.tsx:107-155,179-180`).
- **The item price/percentage pair rewrites itself**: typing a sale price recomputes the percentage and vice versa, and a zero price or 100% discount flips the item to Free (`src/components/catalogue/inputs/item/ItemPricing.tsx:77-105,125-138`).
- **A price of exactly 0 renders as "Free"**, and an item with no price renders with no price at all (`src/components/catalogue/cards/index.tsx:70-77`).
- **Images are resized and re-compressed in the browser before upload**, so the upload route's own limit is never reached (`src/components/general/ImageDropzone.tsx:13-18,80-88`).
- **Analytics never fire from the builder or the preview**: `/admin*` paths, `/preview` paths and any browser carrying a Quicktalog session are excluded (`src/components/catalogue/view/CatalogueAnalytics.tsx:66-101`).
- **Two edits in the same tick compose rather than overwrite**: every writer goes through one `commit` that reads a ref holding the live draft (`src/context/CatalogueContext.tsx:122-139`).

---

## Contradictions

- **The rail does not hold Ask AI.** `docs/architecture/builder.md:16` says "The rail holds Editor, Save, Templates, Preview, Publish, Ask AI and Dashboard", and `:22` says the chat "opens only from the rail or bar Ask AI buttons". In code the rail holds exactly Editor, Save, Templates, Preview, Publish and Dashboard (`src/components/catalogue/builder/BuilderRail.tsx:38-82`, `src/components/catalogue/inputs/sidebar/index.tsx:126-136`); on desktop the chat opens from a separate floating button labelled **Quick AI** at `bottom-6 left-6` (`src/components/catalogue/chat/CatalogueChat.tsx:252-263`).
- **"Ask AI" vs "Quick AI".** The docs call the control "Ask AI" (`docs/architecture/builder.md:15,22`); every visible label and `aria-label` in the code says **Quick AI** (`src/components/catalogue/inputs/sidebar/ActionButtons.tsx:59,65`, `src/components/catalogue/chat/CatalogueChat.tsx:262,318`).
- **"Autosave" is named but never scheduled.** `src/hooks/useSaveDraft.ts:8` calls itself "the one save path for autosaves" and `src/context/CatalogueContext.tsx:86,100` mentions autosave, but nothing in `src/` calls it on a timer — its only callers are Accept-AI-changes and Upgrade (`src/hooks/useKeepAiChanges.ts:10-13`, `src/hooks/useUpgrade.ts:15-25`). For the user, saving is manual.
- **Delete confirmations are native browser dialogs, not product dialogs.** Everything else in the builder uses `InformModal` / `BuilderDialog`, but both deletes use `window.confirm` (`src/components/catalogue/cards/common/BlockMenu.tsx:150`, `src/components/catalogue/cards/common/CardControls.tsx:150`). `docs/architecture/builder.md:30` only says "after a confirm prompt", which is accurate but easy to read as a styled dialog.
- **Review bar buttons: "Keep" in the docs, "Accept" in the UI.** `docs/architecture/builder.md:110-111` says "the Keep button"; the bar's buttons are **Accept** and **Reject** (`src/components/catalogue/chat/AiReviewBar.tsx:96-111`).
- **Standard Catalog template: "4 categories" vs 5 blocks.** The picker says "4 categories" (`src/components/catalogue/inputs/TemplatesInput.tsx:51`) but the data holds 5 items blocks — four with a heading and one headless (`src/constants/catalogueTemplates.ts:24-305`, `:265-266`). All 5 count against `sections_per_catalogue` (`../quicktalog-packages/src/helpers/plan-fit.ts:11-14`), so on the Starter plan (5 sections) this template fills the whole allowance, and its 15 items exactly fill Starter's 15.
- **Section-limit check: two different counts.** The Add Section tile compares `item.content.length` to the limit (`src/components/catalogue/view/Catalogue.tsx:283-289`), while the dialog uses `countPlanSections` (`src/components/catalogue/modals/AddContentModal.tsx:132`). They agree today, because `countPlanSections` is just the array length (`../quicktalog-packages/src/helpers/plan-fit.ts:12-14`), but they are two code paths for one rule.
- **The tile blocks at the limit; the dialog's "at limit" branch is reachable another way.** `checkLimits()` returns the string `"items"` whenever the section count is at the limit, regardless of the chosen type (`src/components/catalogue/modals/AddContentModal.tsx:123-137`) — the name is misleading but the behaviour (open the plan dialog, type `sections`) is right (`:139-145,266-272`).
- **Save revalidates the public page for nothing.** `updateCatalogue` calls `revalidateCatalogue` (`src/actions/catalogue.ts:378`) although it changed only the Redis draft, which the public page never reads (`src/lib/catalogue/public.ts:23-32`). Harmless, but it means a save does touch the ISR cache.
- **`CatalogueContent`'s comment claims index-addressed callbacks**; the callbacks it actually builds are id-addressed (`src/components/catalogue/view/CatalogueContent.tsx:71-74` vs `:272,301,308,320`).

---

## Could not confirm

- **Currency and language option lists.** `CurrencySelect` and `LanguageInput` are in the General tab (`src/components/catalogue/inputs/sidebar/GeneralTab.tsx:55-56`) but I did not read their option sets. **?**
- **Appearance tab details** (theme names, style sliders, glass presets, overlay emoji list) — only the section titles were confirmed (`src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:152,172,188,201,219`). The glass presets are named Off / Clear / Semi-frosted / Frosted in `docs/architecture/catalogue-chrome.md:32`, which I did not verify against `src/lib/catalogue/glass.ts`. **?**
- **Header and Footer tab field-level copy** — titles confirmed, individual labels and hints not read in full. **?**
- **Quick AI's own flow** (credits, what it can edit, the plan checklist, image attachments, OCR) — only the labels needed for Undo and the frame were read (`src/components/catalogue/chat/CatalogueChat.tsx`, `src/components/catalogue/chat/AiReviewBar.tsx`). Treat the AI chat as a separate research topic. **?**
- **Rail item width.** The comment says 56px (`src/components/catalogue/builder/BuilderRail.tsx:9`) but the buttons are `w-full` inside a 72px column with `px-1.5`, which computes to 60px. I could not confirm 56px from the code; use "fills the 72px rail minus 6px either side". **?**
- **Whether the panel's 440px is ever narrower in practice.** It is `md:w-[440px] md:max-w-[calc(100vw-72px)]` (`src/components/catalogue/builder/BuilderPanel.tsx:87`), so between 720px and ~512px of viewport it would clamp — but the panel is only 440px from 720px up, where the clamp never bites. Stated as 440px. **?**
- **Exact catalogue-name rules.** The builder cannot edit the name (`src/components/catalogue/inputs/sidebar/GeneralTab.tsx:54`); the slug/availability rules live in `useCatalogueName` and `generateUniqueSlug`, which I did not read (`src/components/catalogue/inputs/CatalogueNameInput.tsx:31-37`, `src/actions/catalogue.ts:416-437`). **?**
- **Whether anything warns the user that Save does not publish.** I found no such copy; the Save toast says only "Catalogue saved successfully" (`src/components/catalogue/builder/useBuilderActions.ts:60`). If such a hint exists it is outside the files read. **?**
- **The 30-day draft TTL refresh.** Reads refresh the TTL (`getex` with `ex`, `src/lib/catalogue/draft-cache.ts:49`), so an unsaved draft expires 30 days after the last time the builder or preview was opened, not after the last save. I did not test this. **?**
