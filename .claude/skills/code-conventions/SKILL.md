---
name: code-conventions
description: Use when writing or reviewing any code in the Quicktalog app - creating a component, hook, context, type, server action, or constant - to follow this project's actual structure and conventions (feature-based folders, the renderer/input component pairing, React Context for state, types re-exported from @quicktalog/common, @/ imports, Biome formatting). Apply SOLID through these concrete rules rather than in the abstract.
---

# Quicktalog Code Conventions

Where things go and how they're shaped in this codebase. This is the project-specific layer on top of generic React/TypeScript good practice (SOLID, small components) - see [docs/solid-principles.md](../../../docs/solid-principles.md) for the principles; this skill is how they land *here*.

## Where code goes

| Kind | Location | Notes |
|---|---|---|
| Feature components | `components/<feature>/` | Grouped by feature: `catalogue/`, `dashboard/`, `auth/`, `emails/`, `charts/` |
| UI primitives | `components/ui/` | Radix/shadcn wrappers - reuse before building new |
| Server mutations (React) | `server_actions/<domain>.ts` | `"use server"`, Drizzle. See [[server-action-and-route]] |
| HTTP endpoints / webhooks | `app/api/<name>/route.ts` | Only when a URL is needed |
| Pages | `app/<route>/page.tsx` | App Router |
| Custom hooks | `hooks/use<Thing>.ts(x)` | `use`-prefixed, one concern each |
| Cross-cutting state | `context/<Name>Context.tsx` | See "State" below |
| Pure helpers | `helpers/`, `utils/`, `lib/` | `helpers/server.ts` (server-only), `helpers/client.ts` (client) |
| Types | `types/shared.ts`, `types/api.ts`, `types/components.ts` | See "Types" below |
| Constants & schemas | `constants/` | `constants/schemas.ts` for Zod, `constants/index.ts` for the rest |

## Types: `@quicktalog/common` is the source of truth

Domain types (`Catalogue`, `ContentBlock`, `Item`, `User`, `UserData`, `Usage`, the Drizzle `schema`, helpers like `generateUniqueSlug`) live in the external **`@quicktalog/common`** package. [types/shared.ts](../../../types/shared.ts) **re-exports** them and adds app-local types (`DisplayItem`, etc.).

- Need a domain type? Import from `@quicktalog/common` (or via `@/types/shared`), don't redefine it.
- A domain type/schema change happens in `@quicktalog/common`, then flows here - see [[adding-new-section]] and the Drizzle workflow in [docs/drizzle.md](../../../docs/drizzle.md).
- App-only prop/helper types → `types/components.ts` / `types/shared.ts`.

## State: React Context, not Redux/Zustand

Cross-component state lives in [context/](../../../context/): `CatalogueContext` (builder), `UserContext` (auth + plan/usage), `QRContext`, `MainContext`. There is **no Redux/Zustand** - don't add one. Local state → `useState`; shared server data on the dashboard → SWR via [hooks/useDashboardData.ts](../../../hooks/useDashboardData.ts). Refreshing after a write → [[data-revalidation]].

## Component patterns

- **Renderer / Input pairing** - a catalogue block is a pair: `sections/[Name].tsx` (display, view+edit) and `inputs/[Name]Input.tsx` (config form). Keep them split; don't merge display and form into one component (SRP). Full flow: [[adding-new-section]].
- **Modals** use Radix `AlertDialog` (`components/ui/`), with `sonner` for toasts and Zod schemas from `constants/schemas.ts` for validation.
- **One job per component/hook.** Data-fetching, presentation, and form state are separate units (this is SRP/ISP in practice - the patterns [docs/solid-principles.md](../../../docs/solid-principles.md) argues for).

## Mechanical conventions

- **Imports use the `@/` alias** for anything outside the current folder: `import { drizzleClient } from "@/utils/drizzle"` (`@/*` → repo root, per `tsconfig.json`). Avoid `../../..` chains.
- **Formatting/linting is Biome**, not Prettier/ESLint. Run `npm run format` (write), `npm run lint` (write), `npm run check`. Tabs, double quotes - let Biome decide; don't hand-format.
- **Errors** are reported with `Sentry.captureException(err)` + `console.error(...)` in catches (see [[server-action-and-route]]).
- **Branches**: develop on `test`, release via `main` - see [docs/github-workflow.md](../../../docs/github-workflow.md).

## Common Mistakes

- **Redefining a domain type locally** instead of importing from `@quicktalog/common` → drift between app and shared package.
- **Adding a state library** - use Context + hooks; the project deliberately has none.
- **Relative `../../..` imports** - use `@/`.
- **Hand-formatting / adding ESLint or Prettier config** - Biome owns this.
- **God components** - fetch + render + form-state in one file. Split them; mirror the renderer/input pairing.
- **New top-level folder** for something that fits an existing bucket (`helpers/`, `utils/`, `lib/`, `constants/`).
