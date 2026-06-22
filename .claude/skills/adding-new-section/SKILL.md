---
name: adding-new-section
description: Use when adding a new content block / section type to the Quicktalog catalogue (e.g. DividerBlock, VideoBlock) - covers the type definition, renderer + input components, AddContentModal wiring, ContentOptionsSelector option, and CatalogueContent render branch.
---

# Adding a New Content Block

Reference for adding a new content block type (a "section") to the Quicktalog catalogue. A new block touches five areas: the type union, two UI components, the add-content modal, the option selector, and the main renderer. Miss any one and the block won't render, won't be selectable, or won't save.

## When to Use

- Adding a new block/section kind such as `DividerBlock`, `VideoBlock`, `GalleryBlock`.
- Symptoms that you skipped a step: new option missing from the "Add Content" modal, block selected but no input form shows, block saved but renders blank in the catalogue, or a TS error on the `ContentBlock` union.

Not for: editing an existing block's fields (just update its interface + components) or styling-only changes.

## Quick Reference

| # | Area | File(s) | What to do |
|---|------|---------|------------|
| 1 | Type definitions | `@quicktalog/common` (or [types/shared.ts](../../../types/shared.ts)) | New interface extends `BaseContentBlock`; add to `ContentBlock` union |
| 2 | UI components | [components/catalogue/sections/](../../../components/catalogue/sections/)`[Name].tsx`, [components/catalogue/inputs/](../../../components/catalogue/inputs/)`[Name]Input.tsx` | Renderer (view + edit modes) + config Input |
| 3 | Modal integration | [components/catalogue/modals/AddContentModal.tsx](../../../components/catalogue/modals/AddContentModal.tsx) | `ContentOption` key, `blockData` state, render logic, `handleAdd`, header description |
| 4 | Selection UI | [components/catalogue/sections/common/ContentOptionsSelector.tsx](../../../components/catalogue/sections/common/ContentOptionsSelector.tsx) | `lucide-react` icon, `OptionKey` type, `OPTIONS` entry |
| 5 | Main renderer | [components/catalogue/view/CatalogueContent.tsx](../../../components/catalogue/view/CatalogueContent.tsx) | Import renderer, add `block.type` branch in render loop |

## 1. Type Definitions

**Update in:** `@quicktalog/common` (or local types in [types/shared.ts](../../../types/shared.ts), which re-exports from `@quicktalog/common`)

1. Define the block interface extending `BaseContentBlock`.
2. Add the new type to the `ContentBlock` union type.

## 2. UI Components

**Create:** `components/catalogue/sections/[SectionName].tsx` and `components/catalogue/inputs/[SectionName]Input.tsx`

1. **Renderer** (`[SectionName].tsx`) - displays the block in the catalogue. Handle both "view" and "edit" modes.
2. **Input** (`[SectionName]Input.tsx`) - the configuration form shown in the "Add Content" modal.

## 3. Modal Integration

**Update in:** [components/catalogue/modals/AddContentModal.tsx](../../../components/catalogue/modals/AddContentModal.tsx)

1. Add the new block key to the `ContentOption` type.
2. Add initial values for the new block to the `blockData` state.
3. Add the option to the render logic so the Input Component shows when selected.
4. Update `handleAdd` to construct the correct block object when saving.
5. Add description text for the new block type in the modal header.

## 4. Selection UI

**Update in:** [components/catalogue/sections/common/ContentOptionsSelector.tsx](../../../components/catalogue/sections/common/ContentOptionsSelector.tsx)

1. Import a suitable icon from `lucide-react`.
2. Add the new option key to the `OptionKey` type.
3. Add the new option object (`key`, `label`, `icon`) to the `OPTIONS` array.

## 5. Main Renderer

**Update in:** [components/catalogue/view/CatalogueContent.tsx](../../../components/catalogue/view/CatalogueContent.tsx)

1. Import the new Renderer Component.
2. Add a condition in the main render loop to render it when `block.type` matches.

## Common Mistakes

- **Block saves but renders blank** → missing step 5 (no `block.type` branch in `CatalogueContent.tsx`).
- **Option not in modal** → missing step 4 (`OPTIONS` array / `OptionKey`).
- **Selecting the option shows no form** → missing step 3 render logic, or `blockData` has no initial values.
- **`handleAdd` produces a malformed block** → step 3.4 not aligned with the step-1 interface shape.
- **TS union error** → step 1.2 not done; the new interface isn't part of `ContentBlock`.
