Status: in progress: implemented and review-fixed 2026-09-29; awaiting signed-in, PostHog and e2e verification (see RESULTS.md)

# App redesign

Written 2026-09-28 against `test` (`1b82545`).

## What this is

Rebuild the product UI to match the redesign prototype:
<https://claude.ai/artifact/6zFR6uPGXsNdvA1sZLAaCy>. The prototype is a single-file HTML mock of 29 screens. A section-by-section spec pulled from it is in [DESIGN-SPEC.md](./DESIGN-SPEC.md). Its line numbers refer to the prototype HTML.

**In scope:**
- Marketing: home, pricing, showcases, demo, contact.
- Resources: articles and article pages, docs and doc pages, help, release notes.
- Account: sign-in, sign-up, forgot password, update password, confirm, the three legal pages, not-found, error, loading.
- App: dashboard (overview, subscription, usage, settings, support), checkout success, catalogue analytics, QR editor.
- The shared shells: public navbar, footer, app shell, auth shell.

**Out of scope:**
- The builder (`/admin/[name]/builder`, `components/catalogue/builder|inputs|chat|modals`).
- The catalogue in every state (draft, preview, published or active): `/catalogues/[name]`, `/catalogues/[name]/preview`, `components/catalogue/sections|view|cards`, `styles/themes.css`.

**Hard constraint:** nothing the builder or catalogue renders may change appearance. This applies even where they share global styles or `ui/` primitives with product screens (see §2).

## 0. Decisions (2026-09-28)

These override anything below that disagrees.

1. **No parallel component set.** There is no `.qt` scope and no `components/qt/`. The theme is updated at the source and carried through the existing primitives:
   - `--product-*` tokens (plus new ones) in `styles/product.css` → Tailwind `product-*` names → `components/ui/*` → feature components.
   - The builder controls get the new look through the shared primitives. That is accepted.
   - The **published catalogue must not change**, so it stops depending on product styling:
     - The catalogue root and its portaled panels (sidebar sheet, item modal) set their own font and size (today's Lora, 18px).
     - `--catalogue-font-*` default to Lora at `:root`.
     - The catalogue view's buttons move to a catalogue-owned `CatalogueButton` with today's exact classes, so product `Button` variants can change freely.
   - Obsolete `Button` variants (`cta`, `contact`, `header`, `store`, `tab`, `nav`, `solution`, …) are replaced by a small clean set, and their call sites are migrated. `//@ts-nocheck` comes off `button.tsx` so bad variants fail the type-check.
2. **Include all behaviour from §5:**
   - Analytics range, deltas, catalogue switcher and by-day table.
   - QR presets, scan status, contrast pill, **and frame text**. `qr_configs.config` is `jsonb` and the config type is app-local, so no migration or package release is needed.
   - Newsletter CSV export, stat info dialogs, and the doc "Was this helpful?" widget.
3. **Copy:** keep what is in place today. Take the prototype's copy wherever it is clearly better. Plan data always comes from `tiers`.
4. **`InitCatalogueModal` (create dialog) is restyled too.** It keeps its Playwright hooks.
5. **Implement everything, one phase after another.** Work that is independent runs as parallel agents with disjoint file ownership:
   - **Foundation, done sequentially:** tokens, fonts, catalogue isolation, `ui/*` primitives, route-group layouts, Lottie.
   - **Then in parallel:** shells (nav, footer, app shell, special pages), marketing, resources, account, dashboard, analytics + QR.
6. **Architecture first:** get the theme right once, then propagate it. Pages use tokens and primitives, never hard-coded colours.

> §2 (the `.qt` isolation), §9 and the `.qt` / `components/qt/` references in §4 are superseded by §0.1. §5's "later" for QR frame text is superseded by §0.2 (it shipped).

### Review decisions (2026-09-29)

After the post-implementation review:
- Legal pages show "Last updated 2026-09-29" (today) on all three.
- The refund policy wording is reverted to the original ("…guarantee or all…").
- The restyled `LimitsModal` also appears on the public catalogue page; that is accepted.
- Clerk gets only minimal fixes; it is removed after the Supabase cutover.
- All other review findings (bugs and organization) are fixed in one pass.

## 1. Design summary

Full detail is in [DESIGN-SPEC.md §1–3](./DESIGN-SPEC.md).

| | Today | Redesign |
|---|---|---|
| Page background | `#ffffff` | warm off-white `#FAF8F3`, alternate `#F4F1EA` |
| Ink | `#171717` | `#16140F` with `#5E584D` / `#7A7466` for secondary text |
| Brand | amber `#ffc107` + accent `#e5c230` | amber `#FFB020`, hover `#F5A300`, amber text `#8A5A00`, tint `#FFF4DC` |
| Navy `#010e58` | secondary brand | focus ring and one secondary button only |
| Fonts | Lora everywhere | **Plus Jakarta Sans** 600–800 (headings) + **Inter Tight** 400–700 (body) |
| Shape | `rounded-lg` / `rounded-3xl` mix | pills for buttons, chips and nav; cards 22px, panels 28px, dark CTA band 36px |
| Nav | full-width fixed bar | floating translucent pill, dropdowns, mobile sheet, signed-in avatar menu |
| Dashboard | Navbar + tab card | Navbar + sticky sidebar card (5 tabs) + translucent content panel + FAB; mobile pill tab bar |
| Motion | framer-motion in places | transform-only reveal, reduced-motion respected, 5 Lottie animations played while visible |
| Dark mode | none | none (light only) |

## 2. Isolation strategy

Found by the code survey:
- `<body class="product">` puts every `--product-*` variable and an 18px base size on catalogue and builder pages as well.
- `html` / `body` default to Lora.
- The global `a:after` underline, the scrollbar colours, `* { border-border }` and `--radius` all apply everywhere.
- 29 catalogue and builder files use `product-*` classes.
- 20 of the 58 importers of `ui/button`, and most importers of `input`, `label`, `popover` and `select`, are in the builder.
- Tailwind's generic colour names (`primary`, `background`, `card`, `border` and others) point to **catalogue** theme variables.

So the redesign is **additive and scoped**. Nothing global or shared is edited in place:

1. **New token scope `.qt`.**
   - A new file, `src/styles/qt.css`, defines `--qt-*` tokens under the `.qt` class (colours, shadows, radii, fonts) plus `.qt`-scoped base rules: body font, heading font, links without the global underline animation, and the focus ring.
   - Tailwind gets matching colour names `qt-bg`, `qt-bg-alt`, `qt-card`, `qt-line`, `qt-ink`, `qt-ink-2`, `qt-ink-3`, `qt-amber`, `qt-amber-hover`, `qt-amber-ink`, `qt-amber-soft`, `qt-navy`, `qt-red`, `qt-red-soft` and `qt-green`, plus `font-qt-head`, `font-qt-body`, `rounded-qt-card`, `rounded-qt-lg` and the `shadow-qt*` shadows. Existing names are untouched.
   - The prototype's hard-coded greens and blues get tokens here, which fixes spec §6.28.
2. **Fonts.** Add Plus Jakarta Sans and Inter Tight to `lib/fonts` with `next/font` and apply their variable classes on the `.qt` wrapper, not on `<html>`. Only weights that are loaded may be used; the prototype's 650 and 750 weights round to 600 and 700.
3. **Where `.qt` goes.** Each product shell (§3) renders its root as `<div class="qt …">`. `<body class="product">` and `globals.css` stay as they are until §6, so the builder and catalogue keep exactly what they have today.
4. **Product-only primitives in `src/components/qt/`.**
   - Button, Card, Badge/Chip, Eyebrow, SectionHeader, Field (input, textarea, select), SegmentedToggle, Dialog, Accordion, Table, CtaBand, EmptyState, Toast styling, Menu, StatCard, and Gauge.
   - They are built on the same Radix packages but styled only with `qt-*` tokens. The four input styles and three toast styles in the prototype become one of each, fixing spec §6.27.
   - `components/ui/*` is **not edited**. The builder keeps it.
   - This is a new folder under `components/`. It is justified because it mirrors `ui/`: same kind of code, different consumer. The `code-conventions` skill gets a row for it.
5. **Shared across the boundary.** Handled case by case:
   - `modals/LimitsModal` (catalogue + dashboard): add a `variant` prop; the catalogue keeps the default.
   - `components/catalogue/modals/InitCatalogueModal`: the dashboard, home Hero and FAB open it, and it is also Playwright's create flow. It is part of the builder entry, so it stays **out of scope** for now; it can be restyled later if you want. The redesigned FAB and buttons open it unchanged, and it keeps the `alertdialog` role, the "Create a Catalog" text and its field ids.
   - `general/ImageDropzone`, used by the QR editor: wrap it rather than restyle it.
   - `not-found.tsx`, `error.tsx`, `loading.tsx` and `admin/[name]/loading.tsx` also render for catalogue and builder URLs. They get the `.qt` look because they are product chrome. The catalogue already has its own `catalogues/[name]/error.tsx`. The `Loader` colour moves from the hard-coded `#ffc107` to the token.

## 3. Shells and routing

There are no shared layouts today; every page renders `<Navbar/>` and `<Footer/>` itself.

- **Route groups (URLs unchanged):**
  - `app/(site)/` holds the marketing, resources and legal pages, with `layout.tsx` = `PublicShell` (the `.qt` wrapper, pill navbar, page, footer).
  - `app/(site)/auth/**` keeps the same shell and adds `AuthShell` (grid, glow and card) as a component.
  - Demo, contact and analytics have no footer. The shell takes a `footer={false}` prop, or those pages sit in their own sub-group.
- **App pages:**
  - `admin/[name]/builder` must stay outside any new layout. Moving `analytics` and `qr-editor` into a route group next to it risks a conflict on the `admin/[name]` segment and its `loading.tsx`.
  - So `AppShell` (signed-in nav, optional sidebar, optional FAB) is a **component** used by `admin/dashboard`, `admin/[name]/analytics`, `admin/[name]/qr-editor` and `admin/checkout/success`, not a layout.
- **Signed-in nav on public pages.** Public and ISR pages must not read cookies (CLAUDE.md). The navbar's auth area stays a client island (`AuthLinks` / `UserMenu` from `useAuth`), which is how it works today. It renders the logged-out state until the client knows the user, and must keep a fixed width so the swap causes no layout shift.
- **Dashboard tabs.** Keep the current client tab state with `?tab=`, but sync the URL on change, so the sidebar and mobile tab bar are shareable and work with the back button. Real sub-routes are not needed for the design.
- `components/navigation/*` is rewritten in place. Only product pages use it; `Loader` is the exception and is handled in §2.5. Menu data stays in `constants/navigation.ts`, updated to the new items and descriptions (spec §3.1).

## 4. Phases

Each phase is a mergeable, verifiable slice. After each one: `npx tsc --noEmit`, `npm run check`, `npm test`, and a manual look at a builder page and a published catalogue on TEST to confirm they did not change.

| # | Phase | Contents | Rough size |
|---|---|---|---|
| 0 | Foundation | `qt.css` tokens, fonts, Tailwind names, `components/qt/*` primitives, and a temporary dev-only page listing them for review, deleted before merge | M |
| 1 | Shells | `PublicShell` (pill nav with dropdowns, mobile sheet, signed-in menu; new footer), `(site)` route group, `AuthShell`, `AppShell` (sidebar, mobile tabs, FAB), not-found, error, loading | M |
| 2 | Marketing | Home (hero, before/after problems, benefits + feature panel, how-it-works flow, dark AI card, pricing, CTA band, FAQ), pricing page (starter card, tier grid, comparison table), showcases, demo, contact | L |
| 3 | Resources | Articles index + featured card + filters, article page (hero, cover, prose components, author box, related), docs index, doc page (3-column, TOC scroll-spy, helpful widget, pager), help, release notes. The prose components in `components/articles` are restyled, so the ~2,800 lines of content TSX in `src/content/` do not change | L |
| 4 | Account | Sign-in/up card with pill tabs, forgot, update password, confirm-continue, legal pages (new hero with tabs, sticky TOC, numbered sections, contact box) as one shared `LegalPage` component | M |
| 5 | App | Overview (profile card, stat cards + info dialogs, catalogue grid + ⋮ menu, newsletter table), subscription, usage (gauges), settings (restyle of `SupabaseAccount` sections), support, checkout success, analytics, QR editor | L |
| 6 | Cleanup | Delete what the redesign made dead (the old `ui/button` product variants such as `cta`, `nav`, `contact`, `store`, `section-header`, the old product CSS in `clerk.css`, `.animate-fade-in`, and so on). Update `docs/` and the `code-conventions` skill. Optionally move `<body>` off `.product` once no product screen needs it; that needs a separate check that builder chrome does not depend on it | S |

Lottie: add `lottie-web` (light build) and a small `LottiePlayer` that plays only while visible and respects reduced motion. The five animation JSON files are pulled out of the prototype into `public/animations/`. The SVG illustrations stay as fallbacks.

## 5. Things the prototype adds that are behaviour, not just styling

Default for each is shown. Anything marked "later" becomes a follow-up rather than part of this plan.

| Item | Where | Default |
|---|---|---|
| Analytics date range 7/30/90 days, catalogue switcher, KPI deltas vs previous period, "By day" table | analytics | **Include.** The server already queries PostHog; it needs a `range` search param, a previous-period query and table rendering. Keep ApexCharts; add a keyboard-accessible table fallback |
| QR colour presets, "Scannable" status, contrast ratio pill, frame-text option | QR editor | Presets and status: **include** (client-only). Frame text changes the saved QR config shape in `@quicktalog/common` and needs a release: **later** |
| Newsletter "Export CSV" | overview | **Include** (client-side CSV from data already loaded) |
| Stat info dialogs | overview | Include |
| Home before/after "problems" section and dark AI card with typed prompt | home | Include (static) |
| Doc "Was this helpful?" | docs | Visual only, with no storage. Wire it to PostHog later |
| Release-notes subscribe form | release notes | **Skip**: the prototype has CSS and JS but no markup (spec §6.14) |
| Turnstile note on every auth form | auth | Keep Turnstile where it is today (sign-up) |

## 6. Content decisions needed

These come from spec §6.

1. **Plan copy.** The prototype words plans differently on home, pricing, the comparison table, the limit dialog and the subscription page. Default: **every plan name, price, limit and feature line comes from `tiers` in `@quicktalog/common`**, as it does today. The design's layout is used; its wording is not.
2. **Home keeps a full pricing section?** The prototype has both a home `#pricing` section and a `/pricing` page with different copy. Default: keep a shorter home pricing section (the tier cards) linking to `/pricing` for the comparison table.
3. **Support email.** The Help page uses `support@quicktalog.com`; everywhere else uses `quicktalog@outlook.com`. Default: use whatever `constants/details.ts` has today.
4. **Terms text.** The prototype has `[JURISDICTION]` placeholders and an internal Paddle note. Default: keep **today's legal text** and redesign the layout only.
5. **"Total Items" stat** actually shows the number of catalogues. Default: label it "Catalogues".
6. **"Try AI" → `/admin/create/ai`.** That route does not exist. Default: open the create dialog (the builder's AI chat follows).
7. **Article measure.** The prototype runs article text full width by accident. Default: 70ch, the same as docs.
8. Home copy ("under 5 minutes", 3 vs 4 steps) and "catalog" vs "catalogue" spelling: keep today's product wording.

## 7. Risks

- **Builder regressions through shared code.** This is the main risk. §2 avoids it by never editing `ui/*`, `.product`, `globals.css` or Tailwind names. Each phase ends with a visual check of a builder page and a catalogue.
- **Route-group move.** It moves about 15 page folders with `git mv`. URLs, `sitemap.ts`, the `llms.txt` route, `revalidatePath` calls and middleware matchers are path-based and do not change, but they get a grep check.
- **Fonts.** Two more `next/font` families add to the 19 already loaded. The new ones are applied only inside `.qt`, and product pages stop using Lora. Consider `preload: false` for the catalogue fonts later; that is outside this plan.
- **Playwright.** It depends on the create button's accessible name `/create catalogue/i`, the `alertdialog` "Create a Catalog", the field ids, the confirm-page buttons `/confirm and continue/i` and `/^continue$/i`, and the `/admin/dashboard` URL. All of these are kept.
- **`withMT` breakpoints.** They stay; builder tests assume them. New components use only the `sm`/`md`/`lg`/`xl` `min-width` variants, with no `max-*`.
- **Vercel 60s limit.** Not affected. The analytics range change keeps one PostHog query per period (two in total).

## 8. Verification

- Per phase: `npx tsc --noEmit`, `npm run check`, `npm test`, and `next build` (watch for the reverse-DNS stall; see memory).
- Visual: compare each redesigned route with its prototype page at 375, 768, 1024 and 1440 widths. Check the builder and one published catalogue for no visual change.
- Accessibility: contrast of amber-on-cream text (use `qt-amber-ink` for text, never `qt-amber`), focus ring visible on every control, the nav menus working by keyboard, and reduced motion respected.
- Playwright `create-catalogue` and `auth.supabase.setup` on TEST after phases 1, 4 and 5.

## 9. Open questions for approval

1. Approve the isolation approach (§2): a new `.qt` scope and `components/qt/` primitives, with `ui/*` left for the builder.
2. Approve the §5 defaults, especially including the analytics range/deltas and deferring QR frame text.
3. Approve the §6 content defaults.
4. Should `InitCatalogueModal` (the create dialog) be restyled too? It sits at the builder boundary and is excluded by default.
5. Order: the phases as listed, or app screens (phase 5) before marketing?
