# Catalogue builder: frame and controls

The builder (`/admin/[name]/builder`) renders the customer's catalogue with `Catalogue.tsx` in `type="edit"` and wraps it in builder controls.

**Two rules:**
1. The catalogue in the middle must look exactly like the published catalogue.
2. Everything around it and on top of it is product UI and uses the product theme ([product-theme.md](product-theme.md)).

## Frame

Sizes live in `components/catalogue/builder/frame.ts`: rail 72px, panel 440px, and the wide breakpoint at 1280px.

| Width | Layout |
|---|---|
| < 720px (phone) | Catalogue full width with bottom padding for the **bottom bar**: Ask AI, Templates, Editor, Save, Publish. The **editor panel** opens as a full-height sheet with its own header (Dashboard link, title, close). |
| 720–1279px | The catalogue reserves the **rail** width (`md:pr-[72px]`). The rail holds Editor, Save, Templates, Preview, Publish, Ask AI and Dashboard. The panel opens **over** the catalogue with a scrim; it is a modal dialog (focus trapped, Esc or scrim closes). |
| ≥ 1280px | The panel opens **beside** the catalogue, which gets extra right padding and shrinks. It is not modal. |

- **Padding is edit-mode only.** The extra padding is added only when `type === "edit"`, so view and demo output are unchanged.
- **Shared actions.** Save, Templates, Preview and Publish run through `useBuilderActions`, which both the rail and the bottom bar use.
- **Panel shell.** `BuilderPanel` handles the header, focus in and out, and Esc. Esc ignores key presses coming from portaled menus.
- **AI chat.** On desktop it is a floating panel at the bottom left, clear of the rail. On phones it is a full-height sheet that follows the visual viewport, so the keyboard never covers the composer. It opens only from the rail or bar Ask AI buttons, which carry `aria-controls` pointing at `CHAT_PANEL_ID`.

## Controls inside the catalogue

Section menus (`cards/common/BlockMenu`), the edit row of blocks without a header (`cards/common/BlockControls`), card menus (`CardControls`), the editable heading, the "Add New Item" tile and the "Add Section" button all render inside `.catalogue-root`. That element pins Lora at 18px.

- **Set product typography explicitly.** Controls must set it themselves (`font-product-body` plus a size) and use tokens.
- **Only in edit mode.** They render only in edit mode. Section renderers add `BLOCK_CONTROLS_GROUP` (the `group/block` class) to their outer element only when `mode === "edit"`.
- **One ⋯ menu per section.** `BlockMenu` holds Edit, Layout (a row of four drawn tiles, items sections only), Move up, Move down and Delete (after a confirm prompt).
  - **Sections with a header:** the ⋯ sits inside the header on the right, where the collapse chevron is in view mode. The header button gets extra right padding in edit mode only, so the title never runs under it.
  - **Blocks without a header** (text, divider, embed, custom code, items without a heading): `BlockControls` is a row above the block with the type label on the left and the ⋯ on the right. While text or a divider is edited inline, the row shows a Done button instead of the Edit entry.
  - **Visibility:** on devices that can hover, the ⋯ (or the row) shows on hover or focus; on touch it is always visible.
- **Never over content.** Card tools are one ⋮ menu (edit, move up/down, move to section, delete) that never covers the title.
- **Checking view mode.** Frozen catalogue pieces must not change: `SectionHeader`'s `headerButtonClasses`, `CatalogueButton` and `CatalogueDialog`. To prove a change leaves view mode alone, render `<Catalogue type="view">` from a fixture and compare every element's classes and computed styles before and after.

## Dialogs

Builder dialogs use `modals/content/BuilderDialog`. It has a fixed header and footer with a scrolling body, and builds its footer on `AppDialogFooter`.

- **Phones get a bottom sheet.** Below `md`, `builderDialogFrame` pins the dialog to the bottom at full width with rounded top corners, and it slides up. The footer clears the iPhone home bar. From `md` the dialog is centred.
- **One size for every builder dialog.** Titles are `text-lg`, hints 13px, and fields use `builderFieldClass` (40px, 12px radius) or `builderTextareaClass`, with 16px between fields. Field text stays 16px on phones so iOS does not zoom in.
- **Section types** come from `modals/content/SectionTypePicker`. It is a radio group: the dashboard's scrolling pill bar on phones (`lib/ui/pill-tab`, with `useScrollActiveIntoView` keeping the chosen pill in view), a list from `md`.
- **Heading options** of an items section are two `OptionSwitch` rows, stacked on phones and side by side from `md`. Auto-expand is disabled while Show heading is off, because the heading is the collapse toggle.
- **Layout tiles** come from `LayoutPicker`. They are drawn SVGs (`LayoutGlyph`, also used by the section menu); the `image` field on the `@quicktalog/common` `layouts` entries is not used.
- **Add item on phones** has two footer buttons, Add another and Add item. Cancel is the header ×. When editing, the footer is Cancel and Save item.
- **Adding a new block type** is covered by the `adding-new-content-block` skill.
