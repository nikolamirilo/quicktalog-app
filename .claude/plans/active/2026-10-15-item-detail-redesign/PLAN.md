Status: in progress: implemented and verified locally 2026-10-15; awaiting a check on TEST in a browser

# Item detail modal redesign

Written 2026-10-15 against `test` (`f42fc20`). Branch `feat/item-detail-redesign`.

Design proposal (three options, today's modal recreated): <https://claude.ai/artifact/Bs8VDSiNzbNvjhj2fEQLp8>. The owner picked **Option A: bottom sheet**.

## Why

The item modal (`components/catalogue/modals/ItemDetailModal.tsx`) was left out of the app redesign on purpose, because the published catalogue must keep the customer's theme. It still uses the frozen pre-redesign `CatalogueDialog` and has bugs:

1. A discounted item shows its list price (the card shows the sale price and badge).
2. The price unit (`denominator`, "/ portion") is never shown.
3. An item with no price still renders an empty "PRICE" row.
4. An item without a photo shows the `DEFAULT_IMAGE` stock placeholder at 320px.
5. The Text-only layout (`variant_3`) hides the photo even when the item has one.
6. The catalogue's corner setting never reaches the modal: it is portaled outside the root that sets `--border-radius`.
7. Line breaks in descriptions collapse.
8. Phones get a centred box with the close button out of thumb reach; desktop gets a narrow 448px column.

## Design (Option A)

- **Phones (below `md`, 720px):** bottom sheet, full width, slides up. A swipe down on the photo or the handle closes it.
- **`md` and up:** centred 520px dialog.
- Photo full-bleed at the top (only a real photo) with frosted round Close and Enlarge buttons; Enlarge opens a full-screen viewer.
- Section chip, title, description with line breaks kept.
- Footer bar pinned at the bottom: sale price, struck-through list price with a "−20%" pill, unit, and a Close button. No price: the Close button fills the bar.
- Colours and fonts come only from the catalogue theme (`--catalogue-*`, customer font). From the redesign it takes shape and motion only: radii, pills, soft layered shadow, blurred backdrop, 40px icon buttons.
- Corners follow the catalogue's corner setting: sheet radius `min(2 × corner, 28px)`, pills collapse to square when the corner setting is 0.
- Elevation is fixed: a floating panel always needs a shadow, so the customer's card shadow setting does not apply to it.

## Changes

| File | Change |
|---|---|
| `lib/catalogue/item-price.ts` (new) | `formatItemAmount` (the card's existing number format) and `getItemPrice` (sale price, list price, percent off, unit, Free) |
| `components/catalogue/cards/index.tsx` | Uses both helpers; passes the price, the raw item and the section name to the modal |
| `components/catalogue/sections/common/Items.tsx` | Passes `sectionName` to `CardsSwitcher` |
| `components/catalogue/modals/CatalogueDialog.tsx` | Adds `CatalogueSheetContent`, `CatalogueLightboxContent` and `CatalogueDialogClose`; the frozen `CatalogueDialogContent` stays |
| `hooks/useSwipeToClose.ts` (new) | Touch swipe-down to close, sheet layout only |
| `components/catalogue/modals/ItemDetailModal.tsx` | Rewritten as Option A |
| `components/catalogue/modals/ItemPhotoViewer.tsx` (new) | Full-screen photo |
| `components/catalogue/view/Catalogue.tsx` | Also writes `--border-radius` to `<html>`, beside the fonts, so portaled panels get it |
| `docs/architecture/product-theme.md` | Documents the new catalogue dialog parts and the `<html>` variables |

Out of scope: cards show a sale price unformatted ("7.6" next to "9.50"), because `CardsSwitcher` formats `price` but not `discount.discountedPrice`. Left for a separate change.

## Verification

- `npx tsc --noEmit`, `npm run check` (exit 0; the 19 warnings are in other files) and `npm test` (65 files, 640 tests) pass.
- New unit tests: `tests/unit/lib/catalogue/item-price.test.ts`, `tests/unit/components/itemDetailModal.test.tsx`, `tests/unit/hooks/useSwipeToClose.test.tsx`.
- The real components were bundled into a local harness with the project's compiled CSS and checked in Chromium at 390×844 and 1280×800: monochrome, creative and elegant (dark), organic and luxury themes; a sale with a photo, no photo (`DEFAULT_IMAGE`), no price; corner setting 0, 12 and 24. Touch swipe: a short drag snaps back, a long drag closes. The Enlarge button opens the full-screen photo and Escape closes only the photo.
- Not done: a check of a real published catalogue on TEST (no `.env` in the session), including iOS Safari's safe-area padding and the swipe on a real phone.
