# Adding a New Content Block

Follow these steps to add a new content block type (e.g., `DividerBlock`, `VideoBlock`).

## 1. Type Definitions
**Updates required in:** `@quicktalog/common` (or local types)

1.  Define the block interface extending `BaseContentBlock`.
2.  Add the new type to the `ContentBlock` union type.

## 2. UI Components
**Create in:** `components/catalogue/sections/[SectionName].tsx`
**Create in:** `components/catalogue/inputs/[SectionName]Input.tsx`

1.  Create the **Renderer Component** (`[SectionName].tsx`) to display the block in the catalogue. Handle both "view" and "edit" modes.
2.  Create the **Input Component** (`[SectionName]Input.tsx`) for the configuration form in the "Add Content" modal.

## 3. Modal Integration
**Update in:** `components/catalogue/modals/AddContentModal.tsx`

1.  Add the new block key to the `ContentOption` type.
2.  Update `blockData` state to include initial values for the new block.
3.  Add the new option to the render logic to show the Input Component when selected.
4.  Update `handleAdd` to construct the correct block object when saving.
5.  Add description text for the new block type in the modal header.

## 4. Selection UI
**Update in:** `components/catalogue/sections/common/ContentOptionsSelector.tsx`

1.  Import a suitable icon from `lucide-react`.
2.  Add the new option key to the `OptionKey` type.
3.  Add the new option object (key, label, icon) to the `OPTIONS` array.

## 5. Main Renderer
**Update in:** `components/catalogue/view/CatalogueContent.tsx`

1.  Import the new **Renderer Component**.
2.  Add a condition in the main rendering loop to render your component when `block.type` matches.
