# Product theme and catalogue isolation

Quicktalog renders two kinds of UI that must not influence each other:

- **The product UI:** marketing pages, resources, auth, the dashboard, analytics, the QR editor and the builder's own controls. It uses the single product theme described here.
- **The catalogue:** a customer's published catalogue, its preview, and the catalogue shown inside the builder. It is styled only by the catalogue themes (`src/styles/themes.css`, the `--catalogue-*` variables) and by the customer's appearance settings.

A change to the product theme must never change how a published catalogue looks.

## How the product theme flows

```
src/styles/product.css      --product-* tokens on `.product` (set on <body>)
        │
tailwind.config.ts          Tailwind names for them: product-*, font-product-*, rounded-product-*,
        │                   shadow-product*, and the type scale (text-display-*, text-title-*, text-lead*)
        │
src/components/ui/*         Radix/shadcn primitives styled only with those names
        │
src/components/general/*    Shared page blocks: Section, SectionHeading, PageHero, CtaBand,
        │                   IconTile, Eyebrow, FaqAccordion, LottiePlayer
        │
feature components          Use the primitives and blocks; no hard-coded colours
```

**To restyle the product, change a token or a primitive, not individual pages.**

### Tokens (`src/styles/product.css`)

Every colour is stored as RGB channels (`--product-primary-rgb: 255 176 32`) with a ready-to-use `--product-primary: rgb(...)` beside it, so Tailwind opacity modifiers work: `bg-product-primary/10`, `border-product-secondary/20`. Use those instead of hand-written `rgba(...)`.

| Group | Tokens |
|---|---|
| Surfaces | `background` (page), `background-hero` (alt fill), `card`, `background-hover` (amber tint), `dark`, `dark-raised`, `dark-deep` |
| Text | `foreground`, `foreground-accent` (secondary), `muted` (tertiary), `on-dark`, `on-dark-muted`, `on-dark-subtle` (text on dark bands) |
| Lines | `border`, `border-strong`, `border-hover` (field hover) |
| Brand | `primary` (amber), `primary-accent` (amber hover), `primary-ink` (amber text on light), `primary-soft`, `primary-bright` (amber on dark), `secondary` (navy, focus ring), `secondary-soft` |
| Status | `error`, `error-soft`, `error-ink`, `warning`, `success`, `success-bright`, `success-soft`, `success-on-dark`, `info`, `info-soft` |
| Data | `chart` (analytics line) |

Every name above is `--product-<name>` in CSS and `product-<name>` in Tailwind. Amber gradient panels are Tailwind background images: `bg-product-amber-panel`, `bg-product-amber-strip`, `bg-product-amber-glow`.
| Elevation and shape | `--product-shadow`, `--product-shadow-hover`, `--product-shadow-primary`, `--product-radius-card` (22px), `--product-radius-panel` (28px), `--product-radius-band` (36px) |
| Type | `--product-font-heading` (Plus Jakarta Sans), `--product-font-body` (Inter Tight) |

Rules:

- **Amber text on a light background uses `text-product-primary-ink`, never `text-product-primary`**, which fails contrast.
- **`cn()` (`lib/ui/cn.ts`) is told about the custom sizes, shadows, radii and gradients.** Add any new custom Tailwind name there too, or tailwind-merge will drop it next to a colour class.
- **Headings `h1`–`h6` get the heading font automatically**, through a zero-specificity rule, so utility classes still win.

### Primitives (`src/components/ui`)

- **`Button`** variants: `default` (amber), `outline`, `secondary` (navy outline), `ghost`, `destructive`, `link`, `inverse` (for dark surfaces).
  - Sizes: `sm` (36px), `default` (44px), `lg` (56px), `icon`.
  - The variant type is checked, so an unknown variant fails `tsc`.
- **`Badge`** variants: `default`, `primary`, `secondary`, `success`, `info`, `destructive`, `outline`.
- **Toasts** go through `sonner` (`toast` from `sonner`); there is no second toast system.

### Breakpoints

`@material-tailwind`'s `withMT` replaces Tailwind's breakpoints with `sm` 540px, `md` 720px, `lg` 960px, `xl` 1140px and `2xl` 1320px.

It also adds an object-valued `lg-max` breakpoint. `tailwind.config.ts` removes that one after the merge, because its presence silently disables `max-*` variants and arbitrary `min-[…]` / `max-[…]` variants. All of these now compile: `max-md:`, `min-[1100px]:`. (Before this change, any `max-*` class in the code base was dead, which is why the frozen catalogue dialog deliberately leaves out its old `max-md:` classes.)

### Page frames

- **Public pages** live under `src/app/(site)/`.
  - `(site)/layout.tsx` renders the navbar.
  - `(site)/(with-footer)/layout.tsx` renders `<main id="main">` and the footer. `(site)/demo` has no footer.
  - Pages don't render `Navbar`, `Footer` or `<main>` themselves.
- **App pages** (dashboard, analytics, QR editor) wrap their content in `components/navigation/AppShell`. It is a component, not a layout, because `admin/[name]/builder` sits next to them and must stay outside it.
- **Auth route handlers** (`app/auth/callback`, `app/auth/confirm`) stay outside the UI groups.

## How the catalogue stays independent

The product theme is global: `<body class="product">`. So the catalogue explicitly opts out of everything it would otherwise inherit.

1. **`.catalogue-root`** is set on the catalogue root (`components/catalogue/view/Catalogue.tsx`), on its portaled panels (the sidebar sheet and the item modal) and on their overlays. It pins the catalogue's own base typography: Lora, 18px / 28px, normal letter-spacing.
   - It does **not** set `--catalogue-font-heading` / `--catalogue-font-body`. `Catalogue.tsx` writes the customer's font to those variables on `<html>`, so portaled panels inherit it; a default here would override that.
   - Product heading, focus and reduced-motion rules exclude `.catalogue-root` and everything inside it.
2. **Catalogue-owned copies of shared UI.**
   - `CatalogueButton` (`components/catalogue/view/components/`) and `CatalogueDialog` (`components/catalogue/modals/`) are frozen copies of the pre-redesign `ui/button` outline style and `ui/dialog`.
   - The section header keeps its own class string.
   - The published catalogue does not import `ui/button` or `ui/dialog`. `ui/sheet` is used only by the catalogue sidebar, so treat it as catalogue-owned.
3. **`--radius` and the generic Tailwind colours stay catalogue-only.**
   - `--radius`, used by `rounded-sm/md/lg`, is unchanged.
   - The generic names `primary`, `secondary`, `accent`, `background`, `foreground`, `card`, `border`, `heading`, `text` and `price` point at catalogue theme variables. Product code must not use them; use `product-*` instead.

**When you change something shared, check both a product page and a published catalogue.**

Builder controls, such as the sidebar inputs and the card and block edit controls, are product UI and follow the product theme. What renders as the customer's catalogue is not product UI.
