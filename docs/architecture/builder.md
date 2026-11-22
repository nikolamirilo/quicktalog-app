# Catalogue builder: frame and controls

The builder (`/admin/[name]/builder`) renders the customer's catalogue with `Catalogue.tsx` in `type="edit"` and wraps it in builder controls.

**Two rules:**
1. The catalogue in the middle must look exactly like the published catalogue.
2. Everything around it and on top of it is product UI and uses the product theme ([product-theme.md](product-theme.md)).

## Frame

Sizes live in `components/catalogue/builder/frame.ts`: rail 72px, panel 440px, and the wide breakpoint at 1280px.

| Width | Layout |
|---|---|
| < 720px (phone) | Catalogue full width with bottom padding for the **bottom bar**: Ask AI, Templates, Editor, the save status, Publish. The **editor panel** opens as a full-height sheet with its own header (Dashboard link, title, close). |
| 720–1279px | The catalogue reserves the **rail** width (`md:pr-[72px]`). The rail holds Editor, Templates, Preview, QR code, Publish, the save status and Dashboard. The panel opens **over** the catalogue with a scrim; it is a modal dialog (focus trapped, Esc or scrim closes). |
| ≥ 1280px | The panel opens **beside** the catalogue, which gets extra right padding and shrinks. It is not modal. |

- **Padding is edit-mode only.** The extra padding is added only when `type === "edit"`, so view and demo output are unchanged.
- **Shared actions.** Templates, Preview, QR code and Publish run through `useBuilderActions`, which both the rail and the bottom bar use. There is no Save: see [Saving](#saving).
- **Panel shell.** `BuilderPanel` handles the header, focus in and out, and Esc. Esc ignores key presses coming from portaled menus.
- **AI chat.** On desktop it is a floating panel at the bottom left, clear of the rail. On phones it is a full-height sheet that follows the visual viewport, so the keyboard never covers the composer. It opens only from the rail or bar Ask AI buttons, which carry `aria-controls` pointing at `CHAT_PANEL_ID`.

## Controls inside the catalogue

Section menus (`cards/common/BlockMenu`), the edit row of blocks without a header (`cards/common/BlockControls`), card menus (`CardControls`), the editable heading, the "Add New Item" tile and the "Add Section" button all render inside `.catalogue-root`. That element pins Lora at 18px.

- **Set product typography explicitly.** Controls must set it themselves (`font-product-body` plus a size) and use tokens.
- **Only in edit mode.** They render only in edit mode. Section renderers add `BLOCK_CONTROLS_GROUP` (the `group/block` class) to their outer element only when `mode === "edit"`.
- **One ⋯ menu per section.** `BlockMenu` holds Edit, Layout (a row of four drawn tiles, items sections only), Move up, Move down and Delete (after a confirm prompt).
  - **Sections with a header:** the ⋯ sits inside the header on the right, where the collapse chevron is in view mode. The header gets extra right padding in edit mode only, so the title never runs under it. In edit mode the header is a `div` rather than a button - the section is open either way, so there is nothing to toggle, and the heading holds a rename input.
  - **Blocks without a header** (text, divider, embed, custom code, items without a heading): `BlockControls` is a row with the type label on the left and the ⋯ on the right, floating on the block's frame rather than sitting in the flow. While text or a divider is edited inline, the row shows a Done button instead of the Edit entry.
  - **Visibility:** a section's ⋯ is always visible, on every device. The `BlockControls` row and a card's ⋯ still show on hover or focus where the device hovers, and are always visible on touch: three dots at rest on every card in a grid read as clutter, and a card already opens its item on click.
- **Edit mode must not move content.** A block occupies exactly the box the published catalogue gives it, so the builder is a true preview. Edit chrome therefore adds no padding, no border and no row in the flow: the dashed frame is `BLOCK_FRAME` (an `outline` with an 8px offset, which does not affect layout) and the `BlockControls` row is absolutely positioned, centred on that outline like a fieldset legend. `tests/unit/components/builderBlockSpacing.test.tsx` compares the layout classes of a block in each mode.
- **Rename a heading by clicking it.** In edit mode an items section's heading is an `EditableSectionName` (`sections/common/`): click it, or focus it and press Enter, to rename in place. Enter and clicking away save through the block's `onUpdateBlock`, Escape reverts, and an empty name keeps the old one - the name is required, and it labels the section in "Move to section" and to the AI assistant. Only sections with `showHeading` have one; `Edit section` in the ⋯ still renames too.
- **Never over content.** Card tools are one ⋮ menu (edit, move up/down, move to section, delete) that never covers the title.
- **Checking view mode.** Frozen catalogue pieces must not change: `SectionHeader`'s `headerButtonClasses` (its `cat-section-header` hook only styles the glass effect, see [catalogue-chrome.md](catalogue-chrome.md)), `CatalogueButton` and `CatalogueDialog`. To prove a change leaves view mode alone, render `<Catalogue type="view">` from a fixture and compare every element's classes and computed styles before and after.

## Dialogs

Builder dialogs use `modals/content/BuilderDialog`. It has a fixed header and footer with a scrolling body, and builds its footer on `AppDialogFooter`.

- **Phones get a bottom sheet.** Below `md`, `builderDialogFrame` pins the dialog to the bottom at full width with rounded top corners, and it slides up. The footer clears the iPhone home bar. From `md` the dialog is centred.
- **One size for every builder dialog.** Titles are `text-lg`, hints 13px, and fields use `builderFieldClass` (40px, 12px radius) or `builderTextareaClass`, with 16px between fields. Field text stays 16px on phones so iOS does not zoom in.
- **Section types** come from `modals/content/SectionTypePicker`. It is a radio group: the dashboard's scrolling pill bar on phones (`lib/ui/pill-tab`, with `useScrollActiveIntoView` keeping the chosen pill in view), a list from `md`.
- **Heading options** of an items section are two `OptionSwitch` rows, stacked on phones and side by side from `md`. Auto-expand is disabled while Show heading is off, because the heading is the collapse toggle.
- **Layout tiles** come from `LayoutPicker`. They are drawn SVGs (`LayoutGlyph`, also used by the section menu); the `image` field on the `@quicktalog/common` `layouts` entries is not used.
- **Add item on phones** has two footer buttons, Add another and Add item. Cancel is the header ×. When editing, the footer is Cancel and Save item.
- **Adding a new block type** is covered by the `adding-new-content-block` skill.

## Plan limits

Every plan's limits (items and sections per catalogue, block types, branding, style
controls, custom themes, the newsletter) become one `OperationLimits` object in
`operationLimitsFor` (`src/lib/entitlements/operation-limits.ts`). They are checked in
three places, with the same counters (`countPlanSections`, `countPlanItems` in
`src/lib/catalogue/content-blocks.ts`):

1. **The agent**, on the server, against the draft the browser sent. The model is told
   the limits and the current counts as whole-catalogue numbers, and every refusal says
   what the limit is.
2. **The browser replay** of the agent's edits. `applyAiOperations` requires limits, and
   the chat passes the ones the server used (they ride on each agent message's metadata).
   The draft on screen can never pass the plan.
3. **The save and publish** (`src/actions/catalogue.ts`), the authority.
   `applyPlanToCatalogue` resets settings the plan lacks (branding, newsletter, tracking,
   style controls, custom themes). `contentWithinPlan` refuses a draft that grows past a
   limit.

Rules:

- **Every block counts** toward `sections_per_catalogue`, text included. The catalogue
  heading is not a block.
- **Going live needs a full fit.** `canActivate` refuses publishing or switching a
  catalogue on until `catalogueFitsPlan` passes, and says what to remove.
- **After a downgrade**, the plan's settings are reset (`applyPlanDowngrade`). A
  catalogue that no longer fits is switched off by the backend's subscription job. Until
  it fits, the owner and the agent can edit, move and delete, but not add. Draft saves
  stay allowed while it shrinks, and a locked block can be deleted but not edited.

## How an edit finds its target

The agent's edits land on the draft while the owner works - that is what the review
bar is for - so a section's position is never a safe handle. Everything that edits
content says *which* section and *which* item it means:

- **`CatalogueContext`'s content methods take ids** (`updateBlock(blockId, …)`,
  `addItem(blockId, …)`, `updateItem(blockId, itemId, …)`, and the rest). The id is
  resolved inside the state updater, against the draft React is holding. An id that
  is no longer there is a no-op: the edit is dropped, nothing else moves.
- **A dialog keeps ids, not positions.** `useSectionDialog` holds the section being
  edited (and clears it on both open-to-add and close, so a saved edit cannot leak
  into the next "Add section"); `CatalogueContent` keeps the item dialog's section
  and item id. A card's control resolves the item from the block it is rendered in,
  at click time.
- **An edit saved from the Add/Edit dialog is a patch**, so a section keeps the
  items it has now rather than the ones the form snapshotted when it opened.
- **One writer.** Every change - hand edit, agent replay, seed, reject - goes
  through the provider's `commit`, which computes from `catalogueRef` and writes
  both it and the state. The ref is the draft, not a mirror of the last render, so
  two edits in the same tick compose instead of one overwriting the other, and
  `getCatalogue()` (autosave, plan continuation) always sees the latest.
- **A template is instantiated, not shared.** `catalogueTemplates.ts` mints fresh
  ids and 0-based order per application.

## Saving

**There is no Save button.** Edits write themselves to a durable draft, and Publish is
the only thing that changes what a visitor sees.

- **Where a draft lives.** One row per catalogue in `public.catalogue_drafts`
  (`lib/catalogue/draft-store.ts`), holding the whole editable payload as `jsonb` -
  content, heading, appearance, header, footer. The published catalogue stays in
  `public.catalogues`. Drafts were a Redis cache until November 2026, which is why
  `catalogues.content` on older rows can be `[]` while the builder shows a full menu.
- **Autosave.** `useAutosave` writes about 1.5s after the last edit, retries with
  backoff while offline, and flushes through `POST /api/catalogue/draft` on
  `visibilitychange` (hidden) and `pagehide` - a server action started from `pagehide`
  is usually cancelled with the page, so that path uses `keepalive` / `sendBeacon`.
- **A Quick AI proposal is never autosaved.** While `aiReview` is open the draft on
  screen is a proposal: Keep saves it (`useKeepAiChanges` → `useSaveDraft` →
  `status.flush()`), Reject puts back `before`. Autosave reads the review through
  `getAiReview()`, not through the render's value, because Keep clears it and saves in
  the same tick.
- **One saver.** Everything that has to store the draft now - Keep, Preview, Publish,
  `useUpgrade` - goes through the autosave's `flush()`. Two savers would each hold their
  own base timestamp and read as two devices editing.
- **Conflicts.** Each save carries the `updated_at` the browser last saw. A newer stored
  draft means another tab or device saved in between, so the write is refused and the
  builder offers a reload rather than overwriting work the owner cannot see.
- **Status.** `SaveStatus` sits in the rail and the phone bar: Saving… / All changes
  saved / Saved, not published / Offline – retrying. It also opens
  `VersionHistoryDialog`.
- **Version history.** `catalogue_draft_versions` keeps the last 10 autosaves per
  catalogue, one every few minutes rather than one per keystroke
  (`DRAFT_VERSION_MIN_GAP`). Restoring writes a draft like any other, so the live
  catalogue is untouched until the next publish.
- **Unpublished changes.** `catalogue_drafts.published_at` is stamped by Publish;
  `updated_at > published_at` is what puts the dot on the Publish button, and on the
  dashboard card the line "Changes not published yet" plus a dot on its Options
  button. The card says it only for a live catalogue: a Draft or Inactive badge
  already means the catalogue is not published
  ([the card](dashboard-card.md)).
- **Leaving still warns.** `NavigationGuard` stays as a last resort, for the second
  between a keystroke and the write or while a save is being retried.
- **Remounts keep the draft.** `useSeedCatalogue` loads the server copy for a new
  catalogue or a clean draft, and keeps an unsaved draft of the same catalogue.

## An empty catalogue

A new catalogue opens on Quick AI rather than on an empty box
(`useEmptyCatalogueOnboarding`):

- **Desktop** (≥768px): the chat opens with the first ask already written from the
  business type, name and currency (`lib/catalogue/onboarding.ts`).
- **Phone**: the chat stays closed - the sheet would cover the catalogue - and the Quick
  AI button pulses with a one-time hint instead, retired on the first tap.
- **The suggestions create content** ("Build it from a description", "Import from a photo
  of my menu", "Start from a template") instead of assuming there is some.
- **The heading is filled from the name** at creation (`headingFromName`).
- **PostHog events**: `builder_opened_empty`, `quick_ai_first_used`,
  `first_section_created`, `first_publish` (`lib/analytics/events.ts`).
