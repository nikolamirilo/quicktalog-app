# Refactoring Proposal - Quicktalog App

## Overview

This document outlines all proposed refactoring changes organized by priority. Each section describes the current state, the problem, and the proposed solution.

---

## 1. Move Types/Interfaces Out of Components into `types/`

**Problem:** 50+ interfaces and types are defined inside component files instead of centralized in `types/`.

**Current state:** `types/` only has `api.ts` (34 lines) and `components.ts` (232 lines).

### Proposed new type files:

| New File | Types to Extract From |
|----------|----------------------|
| `types/modals.ts` | `LimitsModalProps` from `modals/LimitsModal.tsx`, `UpgradePlanModalProps` from `modals/UpgradePlanModal.tsx`, `InputModalProps` from `modals/InputModal.tsx`, `InformModalProps` from `modals/InformModal.tsx`, `ConsentModalProps` from `modals/ConsentModal.tsx`, `DeleteMultipleItemsModalProps` from `modals/DeleteMultipleItemsModal.tsx`, `SelectTemplateModalProps` from `catalogue/modals/SelectTemplateModal.tsx` |
| `types/catalogue.ts` | `CategoryBlockProps` from `catalogue/blocks/CategoryBlock.tsx`, `ContainerBlockProps` from `catalogue/blocks/ContainerBlock.tsx`, `TextBlockProps` from `catalogue/blocks/TextBlock.tsx`, `ContentInputProps` from `catalogue/inputs/ContentInput.tsx`, `EmbeddingInputProps` from `catalogue/inputs/EmbeddingInput.tsx`, `CustomCodeInputProps` from `catalogue/inputs/CustomCodeInput.tsx`, `TemplatesInputProps` from `catalogue/inputs/TemplatesInput.tsx`, `ContactLink` + `CtaProps` + `CatalogueSidebarProps` from `catalogue/view/CatalogueSidebar.tsx` |
| `types/dashboard.ts` | `ImprovedDashboardProps` from `dashboard/Dashboard.tsx`, `ItemDropdownMenuProps` + `MenuItem` from `dashboard/components/ItemDropdownMenu.tsx`, `CreateCatalogueButtonProps` from `dashboard/components/CreateCatalogueButton.tsx` |
| `types/home.ts` | `SectionTitleProps` from `home/SectionTitle.tsx`, `Props` from `home/Section.tsx` + `home/Container.tsx`, `FlipCardProps` from `home/ProblemSection.tsx`, `SimpleStep` from `home/HowItWorks.tsx`, `BillingCycle` from `home/Pricing/Pricing.tsx`, `PricingColumnProps` from `home/Pricing/PricingColumn.tsx`, `Props` from `home/Benefits/BenefitSection.tsx` |
| `types/navigation.ts` | `NavLinkProps` + `MobileNavLinkProps` from `navigation/Navbar.tsx`, `AuthLinksProps` from `navigation/AuthLinks.tsx` |
| `types/emails.ts` | `NewCatalogueEmailProps` from `emails/NewCatalogueEmail.tsx`, `FeedbackFormEmailProps` from `emails/FeedbackFormEmail.tsx` |
| `types/charts.ts` | `LineChartProps` from `charts/LineChart.tsx` |
| `types/general.ts` | `SmartLinkProps` from `general/SmartLink.tsx`, `JsonLdScriptProps` from `general/JsonLdScript.tsx` |
| `types/create.ts` | `EditFormMobileTabsProps` from `create/components/EditFormMobileTabs.tsx`, `EditFormSidebarProps` from `create/components/EditFormSidebar.tsx`, `OCRImportProps` from `create/components/OCRImport.tsx` |

**Note:** UI library types (`components/ui/`) will NOT be moved - those are standard shadcn/ui patterns and should stay colocated.

---

## 2. Break Down Large Components (>400 lines)

### 2a. `components/catalogue/inputs/BuilderSidebar/FooterTab.tsx` (673 lines)

**Extract into:**
- `BuilderSidebar/footer/SocialLinksEditor.tsx` - Social media links form section
- `BuilderSidebar/footer/PartnerManager.tsx` - Partner badges/logos management
- `BuilderSidebar/footer/CTAEditor.tsx` - Call-to-action button configuration
- `BuilderSidebar/footer/ContactInfoEditor.tsx` - Contact information fields
- `FooterTab.tsx` becomes a thin composition of these sub-components

### 2b. `components/qr-editor/QrControls.tsx` (606 lines)

**Extract into:**
- `qr-editor/controls/ColorControls.tsx` - Foreground/background color pickers
- `qr-editor/controls/ShapeControls.tsx` - Dot style, corner style selectors
- `qr-editor/controls/FrameControls.tsx` - Frame/border configuration
- `qr-editor/controls/LogoControls.tsx` - Logo upload and positioning
- `QrControls.tsx` becomes a composition wrapper

### 2c. `components/modals/LimitsModal.tsx` (519 lines)

**Extract into:**
- `modals/limits/LimitContent.tsx` - Renders the specific limit message per type
- `modals/limits/LimitComparison.tsx` - Free vs paid plan comparison display
- `LimitsModal.tsx` becomes the dialog shell composing these

### 2d. `components/contact/Contact.tsx` (498 lines)

**Extract into:**
- `contact/ContactForm.tsx` - Form fields and validation
- `contact/ContactInfo.tsx` - Contact information display (address, phone, etc.)
- `Contact.tsx` becomes layout wrapper

### 2e. `components/catalogue/inputs/HeadingInput.tsx` (428 lines)

**Extract into:**
- `inputs/heading/TypographySettings.tsx` - Font family, size, weight controls
- `inputs/heading/AlignmentSettings.tsx` - Text alignment controls
- `HeadingInput.tsx` composes these

### 2f. `components/create/components/OCRImport.tsx` (415 lines)

**Extract into:**
- `create/components/ocr/FileUploader.tsx` - File selection and upload UI
- `create/components/ocr/OCRPreview.tsx` - Preview of scanned results
- `create/components/ocr/OCRProcessor.tsx` - Processing state and progress
- `OCRImport.tsx` composes these

### 2g. `components/catalogue/modals/AddContentModal.tsx` (404 lines)

**Extract into:**
- `catalogue/modals/content/BlockTypeSelector.tsx` - Grid of content block types to choose
- `catalogue/modals/content/BlockPreview.tsx` - Preview of selected block type
- `AddContentModal.tsx` becomes dialog shell

### 2h. `components/catalogue/inputs/BuilderSidebar/AppearanceTab.tsx` (395 lines)

**Extract into:**
- `BuilderSidebar/appearance/ThemeSettings.tsx` - Theme selection and customization
- `BuilderSidebar/appearance/LayoutSettings.tsx` - Layout configuration options
- `BuilderSidebar/appearance/ColorSettings.tsx` - Color customization controls
- `AppearanceTab.tsx` composes these

### 2i. `components/dashboard/Subscription.tsx` (387 lines)

**Extract into:**
- `dashboard/subscription/PlanDetails.tsx` - Current plan display
- `dashboard/subscription/BillingHistory.tsx` - Transaction history
- `Subscription.tsx` composes these

### 2j. `components/dashboard/Overview.tsx` (374 lines)

**Extract into:**
- `dashboard/overview/CatalogueGrid.tsx` - Grid of catalogue cards
- `dashboard/overview/QuickActions.tsx` - Action buttons/shortcuts
- `Overview.tsx` composes these

### 2k. `components/catalogue/inputs/ItemInput.tsx` (340 lines)

**Extract into:**
- `inputs/item/ItemPricing.tsx` - Price and discount fields
- `inputs/item/ItemDetails.tsx` - Name, description, tags
- `inputs/item/ItemImage.tsx` - Image upload for items
- `ItemInput.tsx` composes these

### 2l. `components/create/components/GeneralInformationInput.tsx` (317 lines)

**Extract into:**
- `create/components/general/BasicInfoFields.tsx` - Name, description inputs
- `create/components/general/CategorySetup.tsx` - Category configuration
- `GeneralInformationInput.tsx` composes these

### 2m. `components/modals/UpgradePlanModal.tsx` (302 lines)

**Extract into:**
- `modals/upgrade/PlanComparison.tsx` - Side-by-side plan features
- `modals/upgrade/PlanSelector.tsx` - Plan selection controls
- `UpgradePlanModal.tsx` becomes dialog shell

### 2n. `components/catalogue/inputs/CustomCodeInput.tsx` (300 lines)

**Extract into:**
- `inputs/custom-code/CodeEditor.tsx` - Code editing area
- `inputs/custom-code/CodePreview.tsx` - Live preview
- `CustomCodeInput.tsx` composes these

---

## 3. Reorganize Modals - Consolidate to One Location

**Problem:** Modals are split between `components/modals/` (7 general modals) and `components/catalogue/modals/` (5 catalogue-specific modals). Additionally, `components/general/CookiePreferencesModal.tsx` is a modal sitting in `general/`.

**Proposed:** Keep the current split but move stray modals:
- Move `components/general/CookiePreferencesModal.tsx` -> `components/modals/CookiePreferencesModal.tsx`

This keeps catalogue-specific modals with catalogue components (which makes sense for domain grouping) while ensuring all general-purpose modals are in `components/modals/`.

---

## 4. Reorganize `components/general/` - It's a Catch-All

**Problem:** `components/general/` has 18 unrelated files acting as a junk drawer.

**Proposed reorganization:**

| File | Move To | Reason |
|------|---------|--------|
| `ClarityScript.tsx` | `components/scripts/ClarityScript.tsx` | Analytics script, not a UI component |
| `JsonLdScript.tsx` | `components/scripts/JsonLdScript.tsx` | SEO script, not a UI component |
| `CookieBanner.tsx` | `components/cookies/CookieBanner.tsx` | Cookie-related, group together |
| `CookiePreferencesModal.tsx` | `components/modals/CookiePreferencesModal.tsx` | It's a modal (see #3) |
| `ImageDropzone.tsx` | Keep in `general/` | Shared utility component |
| `OptimizedImage.tsx` | Keep in `general/` | Shared utility component |
| `HtmlContent.tsx` | Keep in `general/` | Shared utility component |
| `SmartLink.tsx` | Keep in `general/` | Shared utility component |
| `Overlay.tsx` | Keep in `general/` | Shared utility component |
| `Toggle.tsx` | Keep in `general/` | Shared utility component |
| `BrowserFrame.tsx` | Keep in `general/` | Shared utility component |
| `DescriptionEditor.tsx` | Keep in `general/` | Shared utility component |
| `SocialIcon.tsx` | Keep in `general/` | Shared utility component |
| `PartnerBadge.tsx` | Keep in `general/` | Shared utility component |
| `AppearanceOptions.tsx` | `components/catalogue/inputs/AppearanceOptions.tsx` | Only used in catalogue builder |
| `GetStartedCTA.tsx` | `components/home/GetStartedCTA.tsx` | Only used on home/marketing pages |
| `JoinOurCommunity.tsx` | `components/home/JoinOurCommunity.tsx` | Only used on home/marketing pages |
| `UpgradePlanCTA.tsx` | `components/dashboard/components/UpgradePlanCTA.tsx` | Only used in dashboard |

---

## 5. Inline Styles Cleanup

**Problem:** 29 files with 87 inline `style={{}}` occurrences.

**Proposed approach:**

### 5a. Catalogue card styles (4 files, identical pattern)
`TopImageCard.tsx`, `SideImageCard.tsx`, `CarouselCard.tsx`, `TextOnlyCard.tsx` all have:
```tsx
style={{ borderRadius: "var(--border-radius)", boxShadow: "var(--box-shadow)" }}
```
**Fix:** Create a Tailwind utility class in `globals.css`:
```css
.card-catalogue {
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}
```

### 5b. Toggle component (`general/Toggle.tsx` - 7 inline styles)
**Fix:** Convert repeated style objects to Tailwind classes or a small CSS module.

### 5c. AppearanceOptions (`general/AppearanceOptions.tsx` - 9 inline styles)
**Fix:** These are dynamic theme preview colors. Replace with Tailwind arbitrary values where possible, keep `style` only for truly dynamic values (user-selected colors).

### 5d. Email templates (24 inline styles in `InformationEmail.tsx`)
**Leave as-is.** Email HTML requires inline styles for compatibility. This is the correct pattern for React Email.

### 5e. Other scattered inline styles
- `Navbar.tsx` (2), `Contact.tsx` (1), `ProblemSection.tsx` (3), `Subscription.tsx` (2), `MonthlyUsage.tsx` (1)
- **Fix:** Replace with Tailwind classes where the values are static. Keep only for truly dynamic values.

---

## 6. Duplicate Card Components - Extract Shared Base

**Problem:** `TopImageCard.tsx`, `SideImageCard.tsx`, `TextOnlyCard.tsx`, `CarouselCard.tsx` (81-90 lines each) share ~70% identical code.

**Proposed:**
- Create `components/catalogue/cards/common/BaseCard.tsx` with the shared wrapper (article element, click handler, controls, discount badge, price display)
- Each card variant only defines its unique layout (image position, carousel behavior)
- This reduces each variant to ~30-40 lines

---

## 7. Naming Inconsistencies

| Current | Proposed | Reason |
|---------|----------|--------|
| `helpers/imageProccessing.ts` | `helpers/imageProcessing.ts` | Typo: double 'c' |
| `hooks/usePaddelPrices.ts` | `hooks/usePaddlePrices.ts` | Typo: 'Paddel' -> 'Paddle' |
| `components/home/Section.tsx` | `components/home/SectionWrapper.tsx` | Too generic - conflicts with HTML `<section>` |
| `components/home/Container.tsx` | `components/home/ContentContainer.tsx` | Too generic - conflicts with common CSS class |
| `types/components.ts` | `types/shared.ts` | After extracting domain types, rename to reflect it holds shared/cross-cutting types |

---

## 8. Missing Barrel Exports (Index Files)

**Problem:** Most component directories lack index files, leading to long import paths.

**Proposed - add `index.ts` barrel exports to:**
- `components/modals/index.ts`
- `components/general/index.ts`
- `components/dashboard/index.ts`
- `components/home/index.ts`
- `components/navigation/index.ts`
- `components/charts/index.ts`
- `components/qr-editor/index.ts`
- `types/index.ts`

---

## 9. Hook File Extension Inconsistency

**Problem:** `hooks/useBeforeUnload.tsx` uses `.tsx` extension but contains no JSX. `hooks/useCard.ts` is in `components/hooks/` instead of `hooks/`.

**Proposed:**
- Rename `hooks/useBeforeUnload.tsx` -> `hooks/useBeforeUnload.ts`
- Move `components/hooks/useCard.ts` -> `hooks/useCard.ts` (consolidate all hooks in one place)

---

## 10. Email Templates - Extract Shared Components

**Problem:** `NewCatalogueEmail.tsx` (506 lines) and `FeedbackFormEmail.tsx` (488 lines) duplicate email layout code (header, footer, base styles, button styles).

**Proposed:**
- Create `components/emails/shared/EmailLayout.tsx` - Base HTML wrapper with shared styles
- Create `components/emails/shared/EmailButton.tsx` - Reusable CTA button
- Create `components/emails/shared/EmailHeader.tsx` - Logo + header section
- Create `components/emails/shared/EmailFooter.tsx` - Footer with social links
- This could reduce each email template by ~150-200 lines

---

## 11. Context File Size

**Problem:** `context/CatalogueContext.tsx` is likely very large given it exposes 40+ methods/properties.

**Proposed:** Review and consider splitting into:
- `context/catalogue/CatalogueDataContext.tsx` - Data state (items, categories, blocks)
- `context/catalogue/CatalogueUIContext.tsx` - UI state (modals, active tab, edit mode)
- `context/catalogue/CatalogueActionsContext.tsx` - Action handlers (add, update, delete operations)

This only makes sense if the file is over 500 lines. Need to verify size first.

---

## 12. `components/catalogue/view/` - Possible Sub-Components

**Problem:** `CatalogueContent.tsx` (393 lines) handles multiple rendering modes.

**Proposed:** Already covered in section 2 - extract view sub-components as part of the large file breakdown.

---

## Summary - Priority Order

| Priority | Change | Impact | Effort |
|----------|--------|--------|--------|
| **P1** | Fix typos in file names (#7 partial) | Low risk, high annoyance | Small |
| **P1** | Move types to `types/` folder (#1) | Better organization, easier imports | Medium |
| **P2** | Break down large components (#2) | Maintainability, readability | Large |
| **P2** | Reorganize `general/` folder (#4) | Cleaner structure | Medium |
| **P2** | Consolidate stray modals (#3) | Consistency | Small |
| **P2** | Extract shared card base (#6) | Reduces duplication | Medium |
| **P3** | Clean up inline styles (#5) | Consistency with Tailwind approach | Medium |
| **P3** | Add barrel exports (#8) | Cleaner imports | Small |
| **P3** | Fix hook location/extensions (#9) | Consistency | Small |
| **P3** | Extract email shared components (#10) | Reduces duplication | Medium |
| **P4** | Split CatalogueContext (#11) | Only if file >500 lines | Large |

---

## Files That Will NOT Be Changed

- `components/ui/*` - shadcn/ui components, leave as generated
- `app/*` - Page routing structure is fine
- `server_actions/*` - Server action organization is fine
- `constants/*` - Well organized already
- `css/*` - CSS structure is fine
- Email inline styles - Required for email HTML compatibility
