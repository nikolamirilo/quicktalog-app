# Adding a New Content Block Flow

This document outlines the step-by-step flow for adding a new Content Block to the Quicktalog application, using the `DividerBlock` as an example.

## 1. Type Definition
Ensure the block type definition exists. Ideally, this lives in `@quicktalog/common`, but for development, ensure the interface extends `BaseContentBlock`.

```typescript
export type DividerBlock = BaseContentBlock & {
  type: "divider";
  spacing: number // rem
  border?: {
    isEnabled: boolean
    style?: "solid" | "dashed" | "dotted"
    thickness?: number // px
    color?: string
    opacity?: number //0-100
  }
};
```

## 2. Main Block Renderer
The main rendering loop (likely in `Catalogue.tsx` or `CatalogueContent.tsx`) iterates over `catalogue.content`. You must add a case to handle the new block types.

```typescript
{catalogue.content.map((block, index) => {
    switch(block.type) {
        // ... existing blocks
        case "divider":
             return <DividerBlockRenderer block={block} ... />;
    }
})}
```

## 3. Creating the Renderer Component
Create a new component (e.g., `components/catalogue/blocks/DividerBlock.tsx`) that visualizes the block.
- It should accept the block data as props.
- It should apply the styles (spacing, border, etc.).
- It should handle "edit mode" capabilities if necessary (e.g., clicking to edit).

## 4. Add Content Modal (`AddContentModal.tsx`)
This modal allows users to select which block to add.
1.  **Update `ContentOption` type**: Add `"divider"` to the union type.
2.  **Update `ContentOptionsSelector`**: Ensure the new option appears in the UI (icon + label).
3.  **Update `blockData` state**: Add initial state for the new block (e.g., default spacing, border settings).
4.  **Update Form UI**: Add the input fields for the new block configuration inside the modal (or a separate configuration step).
    - *For Divider*: Add inputs for Spacing (Slider), Border Style (Dropdown), Color (Picker), etc.
5.  **Update `handleAdd`**: Ensure the new block object is constructed correctly with the specific `type` and properties before calling `addBlock` or `updateCatalogue`.

## 5. State Management (`CatalogueContext.tsx`)
The `CatalogueContext` exposes `addBlock` and `updateBlock`.
- `addBlock` should already handle generic `ContentBlock` types.
- Ensure any specific validation or logic for the new block is handled (usually not needed if generic).

## 6. Input Components
If the modal needs specific inputs (like `DividerInput`), create them or reuse existing ones.
- **Slider**: Use `components/ui/slider.tsx`.
- **Dropdown**: Use `components/ui/dropdown-menu.tsx` or `select`.
- **Color Picker**: Use a color picker component.

## 7. Saving
The `updateCatalogue` or `addBlock` function in context will trigger a state update. If there's a backend sync, it usually happens via an effect or explicit save action in the context. Ensure the new block data structure matches what the backend expects (JSON).
