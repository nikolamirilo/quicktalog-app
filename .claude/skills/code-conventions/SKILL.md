---
name: code-conventions
description: Use when writing or reviewing any code in the Quicktalog app - creating a component, hook, context, type, server action, or constant - to follow this project's actual structure and conventions (feature-based folders, the renderer/input component pairing, React Context for state, types re-exported from @quicktalog/common, @/ imports, Biome formatting). Apply SOLID through these concrete rules rather than in the abstract.
---

# Quicktalog Code Conventions

Where things go and how they're shaped in this codebase. This is the project-specific layer on top of generic React/TypeScript good practice (SOLID, small components) - see [docs/standards/solid-principles.md](../../../docs/standards/solid-principles.md) for the principles; this skill is how they land *here*.

## Where code goes

All application source lives under **`src/`** (moved there 2026-09-28). `public/`,
`tests/`, `scripts/`, `supabase/` and `docs/` stay at the repo root. The `@/` alias maps
to `src/`, so `@/lib/...` and `@/components/...` are unchanged; `@/scripts/*` is mapped
separately and still resolves to the root `scripts/`.

Next finds `src/app`, and `middleware.ts`, `instrumentation.ts`,
`instrumentation-client.ts` and the two `sentry.*.config.ts` files live in `src/` too -
Next looks for them beside the app directory.


| Kind | Location | Notes |
|---|---|---|
| Feature components | `components/<feature>/` | Grouped by feature: `catalogue/`, `dashboard/`, `auth/`, `emails/`, `charts/` |
| UI primitives | `src/components/ui/` | Radix/shadcn wrappers styled with product tokens - reuse before building new |
| Shared page blocks | `src/components/general/` | Sections, heroes, CTA band, FAQ, Lottie, `Rise`, `Container`, `TextLink`, `FilterChip` - see Styling below |
| Resource pages | `src/components/resources/` | Pieces shared by articles, docs, help and release notes (prose, TOC, CTA, meta line) |
| Status pages | `src/components/status/` | 404 / error screen content |
| Create catalogue | `src/components/catalogue/create/` | `CreateCatalogueProvider` (mount once per page), button, dialog |
| Server mutations (React) | `actions/<domain>.ts` | `"use server"`, Drizzle. See [[server-action-and-route]] |
| HTTP endpoints / webhooks | `app/api/<name>/route.ts` | Only when a URL is needed |
| Pages | `app/<route>/page.tsx` | App Router |
| Custom hooks | `hooks/use<Thing>.ts(x)` | `use`-prefixed, one concern each |
| Cross-cutting state | `context/<Name>Context.tsx` | See "State" below |
| Domain logic | `lib/<domain>/` | Our own logic, grouped by domain: `auth/` `ai/` `catalogue/` `entitlements/` `themes/` `src/content/` `email/` `paddle/` `qr/` `users/` `format/` `html/` `http/` `images/` `cache/` `observability/` `ops/` `ui/` |
| Third-party adapters | `utils/<vendor>/` | Our wrapper around someone else's SDK: `db/` `supabase/` `paddle/` `redis` `deepseek` `uploadthing` `ocr` `cookies` |
| Types | `src/types/shared.ts`, `src/types/navigation.ts`, `src/types/ai.ts` | See "Types" below |
| Constants & schemas | `src/constants/` | `src/constants/schemas.ts` for Zod, `src/constants/index.ts` for the rest |

## Types: `@quicktalog/common` is the source of truth

Domain types (`Catalogue`, `ContentBlock`, `Item`, `User`, `UserData`, `Usage`, the Drizzle `schema`, helpers like `generateUniqueSlug`) live in the external **`@quicktalog/common`** package. [types/shared.ts](../../../src/types/shared.ts) **re-exports** them and adds app-local types (`DisplayItem`, etc.).

- Need a domain type? Import from `@quicktalog/common` (or via `@/types/shared`), don't redefine it.
- A domain type/schema change happens in `@quicktalog/common`, then flows here - see [[adding-new-content-block]] and the Drizzle workflow in [docs/guides/drizzle.md](../../../docs/guides/drizzle.md).
- **Props belong with their component**, not in `src/types/`. A type used by exactly one component is declared in that component's file.
- `src/types/` is only for types genuinely shared across modules (`DisplayItem`, `HeadingSize`, `ISocials`, `NewsletterSubscriber`, `CardProps`).

## State: React Context, not Redux/Zustand

Cross-component state lives in [context/](../../../src/context/): `CatalogueContext` (builder), `UserContext` (auth + plan/usage), `QRContext`, `MainContext`. There is **no Redux/Zustand** - don't add one. Local state → `useState`; shared server data on the dashboard → SWR via [hooks/useDashboardData.ts](../../../src/hooks/useDashboardData.ts). Refreshing after a write → [[data-revalidation]].

## Component patterns

- **Renderer / Input pairing** - a catalogue block is a pair: `sections/[Name].tsx` (display, view+edit) and `inputs/[Name]Input.tsx` (config form). Keep them split; don't merge display and form into one component (SRP). Full flow: [[adding-new-content-block]].
- **Modals** use Radix `AlertDialog` (`src/components/ui/`), with `sonner` for toasts and Zod schemas from `src/constants/schemas.ts` for validation.
- **One job per component/hook.** Data-fetching, presentation, and form state are separate units (this is SRP/ISP in practice - the patterns [docs/standards/solid-principles.md](../../../docs/standards/solid-principles.md) argues for).

## Styling

The product UI has one theme: `--product-*` tokens in `src/styles/product.css` → Tailwind `product-*` names → `src/components/ui/*` → shared blocks in `src/components/general/` (`Section`, `SectionHeading`, `PageHero`, `CtaBand`, `IconTile`, `Eyebrow`, `FaqAccordion`, `LottiePlayer`). See [docs/architecture/product-theme.md](../../../docs/architecture/product-theme.md).

- Restyle by changing a token or primitive, not by adding a parallel component or hard-coded colours.
- Use `product-*` colours (opacity modifiers like `bg-product-primary/10` work); never the generic `primary`/`background`/`card`/`border` names (those are catalogue theme variables). No hand-written `rgba(...)`/hex for colours a token covers.
- Merge classes with `cn()`; when you add a custom Tailwind name (size, shadow, radius, gradient), register it in `lib/ui/cn.ts`.
- Shared helpers: `Container` and `TextLink` (`components/general`), `formatIsoDay` (`lib/format/date.ts`), `formatPrice` (`lib/format/price.ts`); hooks live in `src/hooks/`, not inside component files; data and copy that isn't component logic lives in `src/constants/`.
- Components use **named exports**; only Next special files (`page`, `layout`, `loading`, `error`, `not-found`, `global-error`) use default exports.
- Never let product styling reach the published catalogue: it uses `.catalogue-root`, `CatalogueButton` and `CatalogueDialog`, not `ui/button`/`ui/dialog`. Check a published catalogue after changing anything shared.
- Public pages sit under `app/(site)` layouts (no per-page `Navbar`/`Footer`/`<main>`); app pages wrap in `AppShell`.

## Mechanical conventions

- **Imports use the `@/` alias** for anything outside the current folder: `import { withUser } from "@/utils/db"` (`@/*` → `src/`, and `@/scripts/*` → the root `scripts/`, per `tsconfig.json`). A `../` import is a **Biome error** (`noRestrictedImports`); same-folder `./` is fine.
- **Formatting/linting is Biome**, not Prettier/ESLint. Run `npm run format` (write), `npm run lint` (write), `npm run check`. Tabs, double quotes - let Biome decide; don't hand-format.
- **Errors** are reported with `Sentry.captureException(err)` + `console.error(...)` in catches (see [[server-action-and-route]]).
- **Branches**: develop on `test`, release via `main` - see [docs/guides/git-workflow.md](../../../docs/guides/git-workflow.md).

## Common Mistakes

- **Redefining a domain type locally** instead of importing from `@quicktalog/common` → drift between app and shared package.
- **Adding a state library** - use Context + hooks; the project deliberately has none.
- **Relative `../../..` imports** - use `@/`.
- **Hand-formatting / adding ESLint or Prettier config** - Biome owns this.
- **God components** - fetch + render + form-state in one file. Split them; mirror the renderer/input pairing.
- **New top-level folder** for something that fits an existing bucket (`src/lib/`, `src/utils/`, `src/constants/`). There is no `helpers/` - it was dissolved into `src/lib/` on 2026-09-27; our logic goes in `lib/<domain>/`, vendor wrappers in `src/utils/`.
- **Parking a one-component prop type in `src/types/shared.ts`** - it is not shared, so it belongs in the component.
