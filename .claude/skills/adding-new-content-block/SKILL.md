---
name: adding-new-content-block
description: Use when adding a new content block / section type to the Quicktalog catalogue (e.g. VideoBlock, GalleryBlock, TrackingBlock) - covers the type definition, renderer + input components, AddContentModal wiring, SectionTypePicker option, CatalogueContent render branch, the section count, the plan-gating paths, the agent paths (instructions, snapshot, schema, builder, skills) and the three plan tables that must agree.
---

# Adding a New Content Block

Reference for adding a new block/section type to the Quicktalog catalogue. A block
type's identity is declared in ~20 places that do not import from each other, so
missing one fails quietly: the block won't be selectable, won't render, will be
written to the database as a *different* type, or will be free on a plan that
should not have it.

## When to Use

- Adding a new block kind such as `VideoBlock`, `GalleryBlock`, `FaqBlock`.
- Symptoms you skipped a step: the option is missing from "Add Content"; selecting
  it shows no form; it saves but renders blank; the AI can create it on a plan that
  should not have it; the pricing page and the dashboard disagree about who gets
  it; a TS error on the `ContentBlock` union.

Not for: editing an existing block's fields (update its interface + its two
components) or styling-only changes.

## Decide first: does the agent need this block?

**A block absent from `AiSectionType` is invisible to the agent, and both gates
fail closed on their own.** `isSectionTypeLocked` returns `true` for any type it
does not recognise, and `allowedSectionTypes` never offers one it was not taught.
So if the assistant has no business creating the block - it carries an account id,
a credential, or anything the model must not invent - **leave it out of
`AiSectionType` entirely** and skip steps 9-13 below. That is a feature, not a
shortcut: it is strictly safer and much less code.

Two consequences to accept when you do: the agent can still `delete_section` and
rename it (every op addresses by id, not by type), and it shows through the
`else` fallback in the snapshot. Give it a readable snapshot line (step 11) so the
model can see it is there rather than tidying it away.

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

### Shape and rendering

| # | Area | File(s) | What to do |
|---|------|---------|------------|
| 1 | Shared type | `@quicktalog/common` → `src/types/catalogue.ts` | Interface extends `BaseContentBlock`; add to the `ContentBlock` union. **Needs a package release.** |
| 2 | Renderer | [components/catalogue/sections/](../../../src/components/catalogue/sections/)`[Name].tsx` | View + edit mode; in edit mode `BlockControls` (type label + ⋯ menu), with `BLOCK_CONTROLS_GROUP` on the outer element and the block's `name` passed through. The `label` is what the builder shows on the block, so it must match the picker's label |
| 3 | Input | [components/catalogue/inputs/](../../../src/components/catalogue/inputs/)`[Name]Input.tsx` | The config form. Use `BlockNameInput` for any block that draws no heading of its own |
| 4 | Main renderer | [view/CatalogueContent.tsx](../../../src/components/catalogue/view/CatalogueContent.tsx) | Import + a `block.type` branch in the render loop |
| 5 | Sanitizer | [lib/html/sanitize.ts](../../../src/lib/html/sanitize.ts) | Only if the block renders author HTML as live DOM. Render it through `HtmlContent` with a profile; add a profile rather than loosening `text`/`embed` |

### Builder modal

| # | Area | File(s) | What to do |
|---|------|---------|------------|
| 6 | Picker option | [modals/content/SectionTypePicker.tsx](../../../src/components/catalogue/modals/content/SectionTypePicker.tsx) | `OPTIONS` entry (key, label, lucide icon) |
| 7 | Modal state | [modals/AddContentModal.tsx](../../../src/components/catalogue/modals/AddContentModal.tsx) | `DEFAULT_BLOCK_DATA`, edit-hydration, `handleAdd`, `isFormValid`, `isLocked` and `checkLimits` (the section count is shared; see below) |
| 8 | Modal form + copy | [modals/content/BlockConfigForm.tsx](../../../src/components/catalogue/modals/content/BlockConfigForm.tsx), [BlockConfigHeader.tsx](../../../src/components/catalogue/modals/content/BlockConfigHeader.tsx) | Render branch; `ContentOption` union, `LABELS` + `DESCRIPTIONS` entry. The dialog's add button reads `snakeToTitleCase(selectedOption)`, so a two-word type key reads correctly for free |

### Agent paths - skip all of these if the block stays out of `AiSectionType`

| # | Area | File(s) | What to do |
|---|------|---------|------------|
| 9 | AI section type | [types/ai.ts](../../../src/types/ai.ts) | Add to `AiSectionType`; add any new op field to `add_section` / `update_section` |
| 10 | AI schema + gate | [agent/schemas.ts](../../../src/agent/schemas.ts) | `allowedSectionTypes` - gated types are pushed only on `=== true` |
| 11 | AI prompt + snapshot | [agent/instructions.ts](../../../src/agent/instructions.ts), [agent/session.ts](../../../src/agent/session.ts) | `contentRules` type list; the `locked` array in `limitRules`; `canWriteCode` if it carries code. In `session.ts`, a `snapshot()` branch - the `else` fallback prints only `type` and `name`, which is usually too thin to edit from |
| 12 | AI tool schema | [agent/tools/sections.ts](../../../src/agent/tools/sections.ts) | Any new field on `addSection` / `updateSection`, and the `readSection` projection |
| 13 | Agent skills | [agent/skills/](../../../src/agent/skills/) | `applies` / `requiredFor` predicates that name section types (e.g. `responsive-design`) |

### Operations and gating

| # | Area | File(s) | What to do |
|---|------|---------|------------|
| 14 | AI builder | [lib/catalogue/operations.ts](../../../src/lib/catalogue/operations.ts) | `buildSection` case (the `default:` is an exhaustive `never` - a missing case is a **compile error**, by design), `isSectionTypeLocked`, `UNGATED_SECTION_TYPES`, `SECTION_TYPE_LABELS`, `countSections`, and the `update_section` patch branch that decides which fields the type accepts |
| 15 | Plan flags | `@quicktalog/common` → `src/constants/pricing.ts` + `src/types/general.ts` | If gated: add the flag to `PricingPlan.features.sections` **and** to `features.sections` for **every tier**, and to `AiSectionAccess` in `types/ai.ts` |
| 16 | Plan tables | [constants/pricing.ts](../../../src/constants/pricing.ts), [dashboard/subscription/PlanFeatures.tsx](../../../src/components/dashboard/subscription/PlanFeatures.tsx) | Two separate tables - the public pricing page and the dashboard plan view - both enumerate the section flags by hand and will silently disagree |
| 17 | User-facing copy | [inputs/ContentBlockButton.tsx](../../../src/components/catalogue/inputs/ContentBlockButton.tsx), [content/docs/build-and-edit.tsx](../../../src/content/docs/build-and-edit.tsx), [content/docs/plans-and-billing.tsx](../../../src/content/docs/plans-and-billing.tsx) | Three places spell the block types out in prose - the "Add Section" button's subtitle and two docs pages - and none of them will fail a build when they go stale |
| 18 | Tests | `tests/unit/agent/skills.test.ts`, `tests/unit/lib/catalogue/operations.test.ts` | Fixtures enumerate section types (`PAID_PLAN`, access objects); a new gated type must appear there or the gating tests prove nothing |

## Gating rules

- `features.sections` flags are read as **`=== true`**, not `!== false`. Every tier
  must set the flag explicitly or the feature is off there. This is deliberate: a
  missing flag must not grant a paid block.
- `isSectionTypeLocked` in `operations.ts` only gates when an access object is
  supplied. The browser replays operations the server already authorised and
  passes none - re-gating there would drop blocks the user paid for. The server
  always supplies one, so that is where the gate bites.
- Gating in the UI is never sufficient. It is duplicated in the AI path because
  the assistant must not be a way around a lock the builder applies.
- A locked type stays **selectable** in the picker so the form can show
  `LimitsOverlay` and explain why; `isFormValid` keeps the add button disabled.
- There are two different "limit" surfaces and they are not interchangeable:
  `LimitsOverlay` (this block type is not on your plan) and `LimitsModal` with
  `getRequiredPlan(plan, "sections")` (you have run out of section slots).

## The section count

`sections_per_catalogue` counts **every block**, `text` included; the catalogue heading
is not a block. `countPlanSections` and `countPlanItems` in
`src/lib/catalogue/content-blocks.ts` are the only counters: the agent's applier,
`AddContentModal`, the item modal and `contentWithinPlan` all call them, so the builder,
the assistant and the save cannot disagree. A new block type needs no change here.

## Renaming an existing block type

Know which half of a rename is cheap before you quote one.

**The stored `type` key is expensive.** Rows in the database and drafts in the
Redis cache still carry the old key, so the only safe route is the one
`category`/`container` took: keep the old interface in the `ContentBlock` union
marked `@deprecated`, map it forward in `normalizeBlock`
([lib/catalogue/content-blocks.ts](../../../src/lib/catalogue/content-blocks.ts)),
and read everywhere through a helper instead of matching the key.

The mapping can only be removed once no stored copy is left: count the key in
`catalogues.content` on TEST and PROD, and rewrite or check the drafts in every
Redis database (`scripts/redis/rename-custom-code-blocks.ts` is the pattern).
`custom_code` → `custom_visual` was retired that way on 2026-10-25.

**The `features.sections` plan flag is free.** Plans are not persisted: a user
row stores only `planId`, and `currentPlan` is resolved by looking that up in the
static `tiers` array
([lib/users/my-user-data.ts](../../../src/lib/users/my-user-data.ts)). So renaming
a flag is a pure code change with no migration - just make sure all six tiers,
`PricingPlan`, `AiSectionAccess` and both plan tables move together.

**Renaming only the label is free too.** `LABELS`, `DESCRIPTIONS`, the picker
option, `SECTION_TYPE_LABELS`, the `BlockControls` label, the `ContentBlockButton`
subtitle and the plan tables are everything a user reads. Change those and the
block is renamed as far as anyone outside the codebase can tell - so if the key
rename is not worth the permanent mapping, this is the version to ship.

## Common Mistakes

- **Saves but renders blank** → no branch in `CatalogueContent.tsx` (step 4).
- **Option missing from the modal** → `OPTIONS` / `ContentOption` (steps 6, 8).
- **Option shows no form** → step 8, or `DEFAULT_BLOCK_DATA` has no initial values.
- **Editing an existing block loses fields** → the hydration block in step 7.
- **Written as the wrong type** → a missing `buildSection` case. This now fails to
  compile; before, the `default:` silently produced a divider.
- **Free on the AI path** → step 10 or 15; check the flag exists on every tier.
- **Pricing page and dashboard disagree** → step 16; the two tables are separate.
- **The agent cannot edit it** → step 12's `readSection` projection, or the thin
  `else` branch in `snapshot()`.
- **Matching a legacy key** → use `isItemsBlock`, never `=== "category"`.
- **Forgot the release** → steps 1 and 15 live in `@quicktalog/common`; the app
  pins a published version, so CI fails until it is released and bumped.
