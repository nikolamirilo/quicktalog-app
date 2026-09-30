Status: done (implemented 2026-09-30; awaiting check on TEST)

# Builder mobile controls

Design: [Catalogue Builder Mobile canvas](https://claude.ai/artifact/HDjVJX1QfAZ4qrVgyC6BpU) (row 1 today, rows 2 and 3 proposed). Follows [2026-09-29-builder-redesign](../2026-09-29-builder-redesign/PLAN.md).

## 1. Section menu instead of the toolbar

- **New `cards/common/BlockMenu.tsx`:** one ⋯ button and a dropdown with Edit, Layout, Move up, Move down and Delete. Layout is a row of four drawn tiles, shown for item sections only. Delete keeps the confirm prompt. The trigger looks like the item card ⋯.
- **`SectionHeader`:** in edit mode the ⋯ sits inside the header on the right, where the chevron is in view mode. The title gets extra right padding in edit mode only, so the published header does not change.
- **`BlockControls`:** becomes a slim row for sections without a header (text, divider, embed, custom code, items with no heading). Type label on the left, ⋯ on the right. Text and divider show a "Done" button while you edit them inline.
- **Visibility stays as it is:** always shown on touch, shown on hover or focus on desktop.
- `LayoutPicker` exports its glyphs so the menu reuses them.

## 2. Builder dialogs become bottom sheets on phones

- `builderDialogFrame` in `BuilderDialog.tsx`: below 720px the dialog is pinned to the bottom, full width, with rounded top corners, and slides up. The footer clears the iPhone home bar. From 720px nothing changes.
- No drag handle, because swipe to close is not supported.

## 3. One compact scale for every builder dialog

- Title 18px, hints 13px, fields 40px tall, 16px between fields, 16px side padding on phones.
- Fields keep 16px text on phones, so iOS does not zoom in on focus.
- One shared `builderFieldClass` is used by every field in Add section and Add item, so they cannot drift apart.

## 4. Add section

- **Type picker on phones:** the dashboard's scrolling pill bar, with the same styles. The active pill scrolls into view. From 720px the side list stays, slightly tighter.
- **Shared code:** the pill classes move to `lib/ui/pill-tab.ts`, and the "centre the active pill" logic moves from `DashboardTabBar` to `hooks/useScrollActiveIntoView.ts`. Both the dashboard and the picker use them.
- **Type description:** a short hint at the top of the form instead of its own band.
- **Heading options:** two rows, each with an icon, a title, a hint and a switch. When the heading is off, Auto-expand stays visible but disabled, with "Turn on the heading first". Stacked on phones, side by side from 720px.
- **Layout tiles:** shorter on phones, labels on one line.
- **Button text:** "Add section" or "Save section", instead of "Add Items" or "Update Custom Code".

## 5. Add item

- Title "Add item" or "Edit item" at 18px. Labels drop the word "Item" (Name, Description, Price).
- Free and Discount become pill toggles. They are still checkboxes underneath. Discount is renamed "On sale".
- The Upload / URL switch moves next to the "Image" label. The drop area is 128px tall on phones.
- **Footer on phones:** "Add another" and "Add item" on one row, and Cancel is the × in the header. When editing, it is Cancel and Save. Desktop keeps all three buttons.

## Not changing

- How the published catalogue looks.
- Save logic, plan limits and data.
- Delete still asks with the browser confirm prompt.

## Checks

- `npx tsc --noEmit`, `npm run check`, `npm test`.
- New unit tests: the menu calls edit, move and layout; delete asks first; Auto-expand is disabled while the heading is off.
- View mode unchanged: render `<Catalogue type="view">` from a fixture before and after, and compare the markup.
- Screenshots at 390px and 1280px from a temporary fixture page (not committed), if the app runs here.
- Update `docs/architecture/builder.md` (controls and dialogs) and the `adding-new-content-block` skill if it describes the picker.

## Branch

`feature/builder-mobile-controls`.

## Results

- `tsc`, `npm run check` pass. `npm test`: all pass except `tests/unit/agent/skills.test.ts` (dashes in `src/agent/skills/*`), which this branch does not touch.
- 14 new tests in `tests/unit/components/blockMenu.test.tsx` and `itemsBlockFields.test.tsx`.
- `<Catalogue type="view">` and `type="demo"` markup from the standard template plus a text and a divider block is identical before and after (ids normalised).
- Screenshots at 390px and 1280px from a temporary fixture page (deleted): section menu, Add section (items, heading off, embed), Add item (with On sale), text block row, desktop dialogs.
- Not checked: a real signed-in builder on TEST.
