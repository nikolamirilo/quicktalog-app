---
name: adding-new-content-block
description: Use when adding a new content block / section type to the Quicktalog catalogue (e.g. VideoBlock, GalleryBlock) - covers the type definition, renderer + input components, AddContentModal wiring, SectionTypePicker option, CatalogueContent render branch, and the AI-agent and plan-gating paths that are easy to miss.
---

# Adding a New Content Block

Reference for adding a new block/section type to the Quicktalog catalogue. A block
type's identity is declared in several places that do not import from each other,
so missing one fails quietly: the block won't be selectable, won't render, or -
worst - will be written to the database as a *different* type.

## When to Use

- Adding a new block kind such as `VideoBlock`, `GalleryBlock`, `FaqBlock`.
- Symptoms you skipped a step: the option is missing from "Add Content"; selecting
  it shows no form; it saves but renders blank; the AI can create it on a plan that
  should not have it; a TS error on the `ContentBlock` union.

Not for: editing an existing block's fields (update its interface + its two
components) or styling-only changes.

## The item-bearing block

There is one block that holds items: `ItemsBlock` (`type: "items"`), rendered by
[components/catalogue/sections/ItemsSection.tsx](../../../src/components/catalogue/sections/ItemsSection.tsx).
`showHeading` decides whether it renders a heading (which is also the collapse
toggle, so a headless section is always open).

`category` and `container` are its **deprecated predecessors**. They remain in the
`ContentBlock` union so old rows typecheck, and
[lib/catalogue/content-blocks.ts](../../../src/lib/catalogue/content-blocks.ts) maps them to
`items` on read. Never write them. Never match on `block.type === "category"`;
use `isItemsBlock` / `asItemsBlock` from that helper.

## Quick Reference

| # | Area | File(s) | What to do |
|---|------|---------|------------|
| 1 | Shared type | `@quicktalog/common` → `src/types/catalogue.ts` | Interface extends `BaseContentBlock`; add to the `ContentBlock` union. **Needs a package release.** |
| 2 | Renderer | [components/catalogue/sections/](../../../src/components/catalogue/sections/)`[Name].tsx` | View + edit mode; `BlockControls` in edit mode |
| 3 | Input | [components/catalogue/inputs/](../../../src/components/catalogue/inputs/)`[Name]Input.tsx` | The config form |
| 4 | Picker option | [modals/content/SectionTypePicker.tsx](../../../src/components/catalogue/modals/content/SectionTypePicker.tsx) + `ContentOption` in [BlockConfigHeader.tsx](../../../src/components/catalogue/modals/content/BlockConfigHeader.tsx) | `OPTIONS` entry (key, label, lucide icon); the `isLocked` case lives with the plan gate in `AddContentModal` |
| 5 | Modal state | [modals/AddContentModal.tsx](../../../src/components/catalogue/modals/AddContentModal.tsx) | `ContentOption`, `DEFAULT_BLOCK_DATA`, edit-hydration, `handleAdd`, `isFormValid`, `isLocked` |
| 6 | Modal form + copy | [modals/content/BlockConfigForm.tsx](../../../src/components/catalogue/modals/content/BlockConfigForm.tsx), [BlockConfigHeader.tsx](../../../src/components/catalogue/modals/content/BlockConfigHeader.tsx) | Render branch; `LABELS` + `DESCRIPTIONS` entry |
| 7 | Main renderer | [view/CatalogueContent.tsx](../../../src/components/catalogue/view/CatalogueContent.tsx) | Import + a `block.type` branch in the render loop |
| 8 | AI section type | [types/ai.ts](../../../src/types/ai.ts) | Add to `AiSectionType`, plus any new op fields |
| 9 | AI schema + gate | [agent/schemas.ts](../../../src/agent/schemas.ts) | `allowedSectionTypes` - gated types are pushed only on `=== true` |
| 10 | AI builder | [lib/catalogue/operations.ts](../../../src/lib/catalogue/operations.ts) | `buildSection` case (the `default:` is an exhaustive `never` - a missing case is a **compile error**, by design), `isSectionTypeLocked`, `SECTION_TYPE_LABELS` |
| 11 | AI tool schema | [agent/tools/sections.ts](../../../src/agent/tools/sections.ts) | Any new field on `addSection` / `updateSection` |
| 12 | Plan gating | `@quicktalog/common` → `src/constants/pricing.ts` | If gated: add the flag to `features.sections` **for every tier**, and to `AiSectionAccess` |

## Gating rules

- `features.sections` flags are read as **`=== true`**, not `!== false`. Every tier
  must set the flag explicitly or the feature is off there. This is deliberate: a
  missing flag must not grant a paid block.
- `isSectionTypeLocked` in `catalogueOperations.ts` only gates when an access
  object is supplied. The browser replays operations the server already
  authorised and passes none - re-gating there would drop blocks the user paid
  for. The server always supplies one, so that is where the gate bites.
- Gating in the UI is never sufficient. It is duplicated in the AI path because
  the assistant must not be a way around a lock the builder applies.

## Common Mistakes

- **Saves but renders blank** → no branch in `CatalogueContent.tsx` (step 7).
- **Option missing from the modal** → `OPTIONS` / `OptionKey` (step 4).
- **Option shows no form** → step 6, or `DEFAULT_BLOCK_DATA` has no initial values.
- **Editing an existing block loses fields** → the hydration block in step 5.
- **Written as the wrong type** → a missing `buildSection` case. This now fails to
  compile; before, the `default:` silently produced a divider.
- **Free on the AI path** → step 9 or 12; check the flag exists on every tier.
- **Matching a legacy key** → use `isItemsBlock`, never `=== "category"`.
- **Forgot the release** → steps 1 and 12 live in `@quicktalog/common`; the app
  pins a published version, so CI fails until it is released and bumped.
