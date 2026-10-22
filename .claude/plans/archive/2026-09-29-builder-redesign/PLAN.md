Status: done (implemented 2026-09-29; awaiting check on TEST)

# Builder redesign and responsive fixes

Written 2026-09-29 against `test` (`d983919`). This follows the app redesign ([2026-09-28-app-redesign](../2026-09-28-app-redesign/PLAN.md)). The builder uses the same product theme: `--product-*` tokens → Tailwind `product-*` → `components/ui/*`, as described in [docs/architecture/product-theme.md](../../../../docs/architecture/product-theme.md).

## The hard rule

The builder shows the customer's catalogue in edit mode (`Catalogue.tsx` with `type="edit"`). **The catalogue itself must keep looking exactly like the published catalogue.** Only the builder's own controls get the product design. These controls are:

- the editor rail and panel;
- the mobile bottom bar and the controls button;
- the AI chat;
- the dialogs;
- the edit controls that appear inside the catalogue: section header tools, card tools, block tools, the editable heading frame, the "Add New Item" tile, and the "Add Section" button.

Anything that changes `view` / `demo` rendering is a bug.

Edit controls render inside `.catalogue-root`, which uses Lora at 18px. They must set the product typography explicitly, for example `font-product-body text-sm`, instead of inheriting it.

## How the bugs were found

A temporary fixture page, `src/app/builder-check/page.tsx`, renders the real builder with the standard template and a Premium plan user, so it needs no sign-in and writes no data. It was screenshotted at 360, 390, 768, 1024, 1280 and 1440px, and in eight states: panel, chat, add section, edit section, item menu, templates, publish menu and add item. **The fixture is not shipped;** it is deleted before commit.

## Findings

**Layout / responsive**
1. At 768 and 1024px, the fixed right rail (about 80px) covers the catalogue: the header CTA and the right column of cards are cut off. The catalogue does not reserve space for the rail.
2. When the editor panel is open, it covers the catalogue at every desktop width, so the thing being edited is hidden. On wide screens it should push the preview aside. Where it can't fit, it should be an overlay with a scrim and a clear close control.
3. Phone: the section header edit controls (edit, layout, up, down, delete) sit on top of the section title ("Featured Colle✎on").
4. Phone: the card controls (up, down, ⋮) cover the item title ("Signature S ^ v ⋮").
5. Phone: the floating "controls" button in the middle of the bottom bar covers catalogue content. The bottom bar and floating button use the old style.
6. Phone: the editor panel's tab bar overflows ("Appearance" is clipped). The panel has no header or title, and the only close control is the floating ×.
7. Desktop: the floating "Dashboard" and "Ask AI" pills sit bottom-left, over catalogue content ("Add New Item").
8. The add/edit section dialog's type tabs overflow on a phone (the 4th tab is cut off). The dialog footer has a white strip that doesn't match the dialog.
9. The layout picker's thumbnails are broken. They point at `/layouts/variant_*.jpg`, which was deleted in `49abc20`. Replace them with drawn layout glyphs, like the QR editor's style tiles.
10. Add Item dialog: the discount select is clipped ("none"). The image source tabs use the old underline style, and the upload zone isn't visible.
11. There is a runtime JS error at 360px ("Invalid or unexpected token"). Find and fix it.

**Design system**
12. The rail, panel toolbar, tabs, mobile bottom bar, controls button, chat, credit meter and plan checklist still use Lora, old colours, `gray-*`, and the solid-amber tab pill. Move them to the product theme and `ui/*` primitives.
13. The AI chat renders in Lora. It is product UI, so it should use Inter Tight and Plus Jakarta Sans.
14. The rail's expand/collapse button has no accessible name.

## Approach

- **Builder frame.**
  - On `md` and wider, the catalogue always reserves the rail width. The panel pushes the preview when there is room (≥ 1280px) and becomes an overlay with a scrim below that.
  - On a phone, the panel is a full-height sheet with its own header (title and close). The bottom bar is restyled; the controls button no longer floats over content, and the catalogue gets bottom padding equal to the bar.
  - "Dashboard" and "Ask AI" move into the rail and the bottom bar instead of floating over content.
- **Edit controls inside the catalogue.**
  - Section header tools move out of the title row on small screens (a compact toolbar row above the header, or an overflow menu). On larger screens they appear on hover or focus.
  - Card tools become a single ⋮ menu that also holds up/down on small screens, so they never cover the title.
  - Everything uses `font-product-body` and tokens, and nothing changes the catalogue's own layout in view mode.
- **Dialogs.**
  - Section-type tabs become a wrapping or scrollable segmented control.
  - Layout thumbnails become SVG glyphs.
  - Footers use `AppDialogFooter` / `ui` parts.
  - Item dialog fields and upload tabs use `ui` Tabs, Select and `ImageDropzone`.
- **Chat.** Product typography and tokens. Keep the existing behaviour and the tests' hooks.

## Ownership (parallel agents)

| Agent | Files |
|---|---|
| Frame | `inputs/sidebar/index.tsx`, `ActionButtons.tsx`, `LimitsOverlay.tsx`, and the edit-mode frame in `view/Catalogue.tsx` (edit-only branches: padding for rail/panel/bottom bar; view mode untouched) |
| Panel tabs | `inputs/sidebar/{General,Header,Footer,Appearance}Tab.tsx`, `inputs/sidebar/appearance/**`, `inputs/sidebar/footer/**`, `inputs/*.tsx` (name, language, currency, templates input, content inputs), `general/AppearanceOptions.tsx` (builder side only), `general/ImageDropzone.tsx` |
| Edit controls | `sections/common/SectionHeader.tsx` (edit-only controls; the frozen header button classes stay), `sections/common/ContentOptionsSelector.tsx`, `cards/common/{CardControls,BlockControls}.tsx`, `inputs/heading/**`, `sections/*` (edit-mode UI only), `sections/common/Items.tsx` (Add New Item tile only) |
| Dialogs | `modals/{AddContentModal,ItemModal,SelectTemplateModal}.tsx`, `modals/content/**`, `inputs/item/**`, `components/modals/SuccessModal.tsx` |
| Chat | `chat/**`, `hooks/useCatalogueChat.ts` (UI-facing only) |

## Tests to keep

- `tests/unit/components/mobileChatSwitch.test.tsx`: the builder sidebar classes, the "Builder actions" toolbar, and no `text-product-primary` on the bar buttons. Update deliberately if the structure changes.
- `creditMeter.test.tsx`: the texts "16 of 15 used" and "1 over", plus the colour class names. If the classes move to `text-product-error`, update the test with them.
- Playwright `create-catalogue` lands on `/admin/[slug]/builder`.

## Verification

- `tsc`, Biome, and unit tests.
- Fixture screenshots at 360, 390, 768, 1024, 1280 and 1440px in all eight states, with no element overflowing and no overlap of controls and titles.
- The catalogue in `view` mode checked unchanged: the computed-style check from the redesign.
- `next build`, then delete the fixture before committing.

## Results (2026-09-29)

All findings are fixed by five parallel agents, and the lead did the follow-ups. How the builder works is documented in [docs/architecture/builder.md](../../../../docs/architecture/builder.md).

**The frame** (`builder/BuilderRail`, `BuilderPanel`, `useBuilderActions`, `frame.ts`):
- The rail is 72px and reserved in edit mode.
- The panel is 440px and pushes the preview from 1280px. Below that it is a modal overlay with a scrim.
- On phones the panel is a sheet with its own header and a Dashboard link, and the bottom bar includes the Editor button.
- The floating pills are gone. The rail toggle has a label.

**Panel tabs:** the shared `panel/*` blocks (`PanelSection`, `InfoTip`, `SwitchField`, `SliderField`, `LockedGroup`). The theme tiles keep the catalogue look. `ImageDropzone` has the real limits in its copy.

**Edit controls:** section tools sit in a toolbar row above each block, and each card has a single ⋮ menu. A DOM and computed-style diff of view mode showed 0 differences (2 themes × 2 widths × 325 elements).

**Dialogs:** `BuilderDialog`, `SectionTypePicker` (wrapping chips), `LayoutPicker` (drawn SVG tiles instead of the deleted `/layouts/*.jpg`), and the item dialog fixes. `SuccessModal` was restyled.

**Chat:** product typography. On desktop it is a floating panel clear of the rail; on phones a sheet that follows the visual viewport. It has dialog semantics and one live announcement per turn.

**Finding 11** was a dev-server artifact: a JS chunk served half-rebuilt while agents were editing. It does not appear in `next build`.

**Cleanup:**
- Deleted `inputs/ContentInput.tsx`, `sections/common/ContentOptionsSelector.tsx` and `ui/color-picker.tsx`.
- Added `hooks/useMediaQuery.ts`, which `useReducedMotion` and `BuilderPanel` now use.
- Updated the `adding-new-content-block` skill (step 4 is now `SectionTypePicker`).

**Verification:**
- `tsc` passes, all 512 unit tests pass, and Biome is clean.
- `next build` passes.
- Fixture screenshots at 360–1440px in every state show no page overflow and no control/title overlap.
- The published catalogue's computed styles and item-modal font are unchanged.
- Temporary fixtures were removed.

**Known trade-off:** on devices that can hover, the hidden section toolbar row reserves about 48px above each block in the builder. The published catalogue is not affected.
