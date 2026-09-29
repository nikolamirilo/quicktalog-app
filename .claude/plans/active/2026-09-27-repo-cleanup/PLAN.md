# Repository cleanup: dead code removal and structural consolidation

Status: in progress - Tier 1 and Tier 3 executed 2026-09-27; Tier 2 deferred to the cutover.

Written 2026-09-27 against `test` (`2db4548`). Tier 1 (dead code) and Tier 3 (structure)
were executed the same day and are recorded in [RESULTS.md](./RESULTS.md). Tier 2 (the
Clerk dual-path) is unchanged and stays blocked on the PROD cutover; this plan stays
`active` until that lands.

## What this is

A full-repo sweep of `quicktalog-app` for (a) files and folders nothing references,
(b) dependencies nothing imports, and (c) places where the folder layout fights the
conventions in [`.claude/skills/code-conventions`](../../../skills/code-conventions/SKILL.md)
and [`docs/standards/solid-principles.md`](../../../../docs/standards/solid-principles.md).

Headline: **~4,900 lines and 32 files of verifiably dead code, plus 21 npm packages**
can go with zero behaviour change. A further **~5,300 lines** goes when the Clerk
cutover completes. The structural work is smaller in volume but is what actually
makes the tree easier to navigate.

## Method

Two scripts were run over `git ls-files` (both in the session scratchpad, not committed):

1. **Import graph** - resolved every `import`/`export from`/`require`/`@import` specifier
   (`@/` alias, relative, barrel `index` files) into a file graph, then computed
   (a) files nothing imports and (b) files unreachable from the Next.js App Router
   entrypoints. Entrypoints were whitelisted explicitly: `app/**/{page,layout,loading,error,
   not-found,route,global-error,sitemap,robots,manifest,icon}.tsx`, `middleware.ts`,
   `instrumentation*.ts`, all `*.config.ts`, `tests/**`, `scripts/**`.
2. **Export usage** - for every exported symbol in every non-test file, searched all other
   files' bodies (imports and comments stripped) for a word-boundary match.

Every candidate below was then re-verified by hand with `git grep` on the symbol name as
well as the path, because a path-only search misses `import { Foo } from "../bar"`.
Results distinguish "referenced by nothing" from "referenced only by its own test" -
the latter is dead code with a test keeping it warm, which is the more common case here.

**Known limits of the method.** Dynamic imports built from template strings, files loaded
by string path at runtime, and anything referenced only from `.claude/` docs would be
missed. Nothing in the candidate list falls into those categories, but Tier 1 should still
be gated on `npx tsc --noEmit && npm run check && npm test && npm run build`.

---

## Tier 1 - Safe deletions (verified dead, no behaviour change)

### 1.1 Unused shadcn/Radix UI primitives - 28 files, 3,492 lines

`components/ui/` holds 56 files. **28 of them are imported by nothing.** These were
scaffolded in by `shadcn add` and never wired up.

Directly unreferenced (23):
`accordion` `alert` `aspect-ratio` `avatar` `breadcrumb` `calendar` `carousel` `chart`
`collapsible` `command` `context-menu` `drawer` `form` `hover-card` `input-otp` `menubar`
`navigation-menu` `pagination` `progress` `radio-group` `resizable` `sidebar` `toggle-group`

Reachable only *through* the above, so they fall with them (4):
`separator` (← sidebar) · `skeleton` (← sidebar) · `toggle` (← toggle-group) · `use-mobile` (← sidebar)

Plus `components/ui/use-toast.ts` (192 lines) - a **stale copy** of `hooks/use-toast.ts`
carrying `//@ts-nocheck`. Both live consumers (`components/ui/toaster.tsx`,
`components/qr-editor/QrPreview.tsx`) import the `hooks/` one. Delete the `components/ui/` copy.

> Verified two ways: no `from "@/components/ui/<name>"` anywhere, and no JSX usage of the
> exported component names outside the files themselves.

### 1.2 Dependencies freed by 1.1 - 21 packages

Each of these has **exactly one** reference in the repo, inside a file from 1.1:

| Package | Sole reference |
|---|---|
| `@radix-ui/react-accordion` `-aspect-ratio` `-avatar` `-collapsible` `-context-menu` `-hover-card` `-menubar` `-navigation-menu` `-progress` `-radio-group` `-separator` `-toggle` `-toggle-group` (13) | the matching `components/ui/*.tsx` |
| `recharts` | `components/ui/chart.tsx` |
| `react-hook-form` | `components/ui/form.tsx` |
| `react-day-picker` | `components/ui/calendar.tsx` |
| `cmdk` | `components/ui/command.tsx` |
| `embla-carousel-react` | `components/ui/carousel.tsx` |
| `input-otp` | `components/ui/input-otp.tsx` |
| `react-resizable-panels` | `components/ui/resizable.tsx` |
| `vaul` | `components/ui/drawer.tsx` |

Note `react-hook-form` is listed in `CLAUDE.md`'s tech-stack table as the forms library.
It is not actually used - the forms in `components/auth/forms/` and `components/contact/`
use plain `useState` + Zod from `constants/schemas.ts`. **Update the table** when removing it.

Keep `apexcharts` (peer dependency of `react-apexcharts`, which `components/charts/LineChart.tsx`
uses) and `@types/sanitize-html` (`sanitize-html` ships no bundled types).

### 1.3 Dead theme subsystem - 5 files, 731 lines

`constants/themes.ts` (386) → `types/theme.ts` (47) → `helpers/catalogueTheme.ts` (55) →
`helpers/color.ts` (39) form a **closed island**. The only file outside the island that
touches any of them is `tests/unit/helpers/catalogueTheme.test.ts` (204).

The live theme system is a different set of files entirely - `helpers/theme.ts` (255 lines,
11 consumers), `styles/themes.css`, `lib/themes/upsert.ts`, `actions/themes.ts`,
`hooks/useSavedThemes.ts`. The island is a superseded parallel implementation.

Delete all five files. **Before deleting**, confirm with the owner that no in-flight branch
is building on `constants/themes.ts` - 386 lines of theme tokens is the kind of thing that
gets written ahead of a feature.

### 1.4 Stray files at the repo root - 3 files

- `app/test/page.tsx` - a 5-line `<div>page</div>` stub. It **ships a live public `/test` route**
  and is in the sitemap's route space. Delete the folder.
- `preflight-test.txt` (17 KB) and `verify-test.txt` (2.7 KB) - committed `psql` output from the
  TEST cutover run on 2026-09-27. These are evidence from a plan run, not source. Per `CLAUDE.md`
  they belong in `.claude/plans/active/supabase-auth-migration/verification/`. Move, don't delete -
  `verify-test.txt` records that check V8 failed (`catalogues updated in the last 30 minutes: 3, expected ~0`).
- `tsconfig.tsbuildinfo` (1.1 MB) and `.DS_Store` are untracked and already gitignored - leave them,
  or `rm` locally.

### 1.5 Duplicated PGlite harness - 62 tracked files, 808 KB

`.claude/plans/active/supabase-auth-migration/verification/pglite-harness/` is an **older
snapshot** of `tests/db-pglite/`. `apply.mjs` and `base.mjs` are byte-identical; `lib.mjs`,
`final.mjs` and `final-lib.mjs` differ only by later fixes that landed in `tests/db-pglite`.
The plan copy also carries `rls.original.sql` + `rls.patched.sql` (150 KB) and a 116 KB `run.mjs`.

`tests/db-pglite/` is the live one - it is what `npm run test:db` invokes.

Delete the plan copy and leave a one-line pointer in the plan's `verification/README` to
`tests/db-pglite/`. Keep `verification/*.md` (the results write-ups) - those are the
knowledge, the harness is just the tool.

### 1.6 Orphaned public assets - 5 files, 616 KB

`public/images/layouts/variant_{1,2,3,4}.jpg` and `public/images/marketing/step2.svg` are
referenced from **no code and no stylesheet**. The only mentions are in
`.claude/plans/archive/articles-implementation-plan.md`, which proposed using them in
articles that shipped without them.

Caveat worth naming: `variant_1`..`variant_4` *are* live layout keys in
`components/catalogue/cards/index.tsx` and `agent/schemas.ts`. The **keys** stay; only the
**JPEGs** are orphaned. Do not let a careless grep take the card mapping with them.

### 1.7 Small unused exports

- `helpers/client.ts` → `startOfMonth`, `endOfMonth` (module-level `new Date()` constants,
  evaluated once at import and then stale - worth deleting on correctness grounds alone).
- `agent/tools/types.ts` → `ToolGroup`, referenced nowhere.
- `helpers/sanitizeHtml.ts` → `EMBED_IFRAME_HOSTS`, used only by its test. Either make the test
  assert through the public function or keep the export and note why.

**Tier 1 total: ~4,900 lines, 32 source files, 62 plan files, 21 npm packages, 616 KB of images.**

---

## Tier 2 - Gated on the Clerk → Supabase cutover

The migration is mid-flight: `lib/auth/provider.ts` inlines `AUTH_PROVIDER` at build time and
**13 call sites** branch on it. `.claude/plans/active/supabase-auth-migration/PLAN.md` is still
`in progress`. **None of this can be deleted yet** - but it is the single largest future win,
so it is worth writing down now while the shape is fresh.

When `AUTH_PROVIDER` is permanently `supabase` on PROD:

| What | Lines |
|---|---|
| `styles/clerk.css` (+ its `@import` in `styles/index.css`, + the `clerk` layer in `app/globals.css:5`) | 480 |
| `app/api/clerk/route.ts` (the Clerk webhook) | 140 |
| `lib/users/syncFromClerk.ts` - **first move `validateEmail` out**, `lib/email/transactional.ts` imports it | 86 |
| `components/dashboard/account/ClerkAccount.tsx` | 57 |
| `components/auth/session/ClerkAuthProvider.tsx` | 45 |
| `components/auth/ClerkAuthForms.tsx` | 24 |
| `scripts/cutover/**` (one-shot migration scripts + SQL) | 3,324 |
| `tests/unit/cutover/**`, `tests/integration/cutover/**`, `tests/e2e/auth.setup.ts` | ~600 |
| `@clerk/nextjs`, `@clerk/testing`, `bcryptjs`, `csv-parse` from `package.json` | - |
| The 13 `AUTH_PROVIDER` branches collapse to their `supabase` arm | - |

Then `Auth.tsx` / `AuthProvider.tsx` / `Settings.tsx` lose their split, and the
`components/auth/{Clerk,Supabase}*` + `components/dashboard/account/{Clerk,Supabase}Account`
pairs each collapse into one file. `lib/auth/provider.ts` itself disappears.

`scripts/cutover/` should move to the plan folder rather than be deleted outright - it is the
record of how PROD was migrated, and `PROD_GUIDE.md` references it. Same for `supabase/phase5/`.

**Do this as its own change, after the cutover, not as part of Tier 1.**

---

## Tier 3 - Structural consolidation

These are judgement calls, not dead code. Ordered by payoff.

### 3.1 The `helpers/` vs `lib/` vs `utils/` three-way split - the main problem

Three top-level folders hold "not a component". `code-conventions` lists all three under one
row ("Pure helpers | `helpers/`, `utils/`, `lib/`") without saying which gets what, so the
split is real but undocumented. Reading the contents, the *de facto* rule is:

| Folder | What is actually in it | Coherent? |
|---|---|---|
| `lib/` (34 files, 2,221 lines) | Domain logic in feature subfolders: `auth/` `ai/` `paddle/` `catalogue/` `entitlements/` `users/` `email/` `qr/` `themes/` `http/` `ops/` `observability/` | **Yes** - this is the good one |
| `utils/` (19 files, 1,256 lines) | Third-party adapters: `db/` `supabase/` `paddle/` `redis` `deepseek` `uploadthing` `ocr` `cookies` | **Yes** - "our wrapper around someone else's SDK" |
| `helpers/` (12 files, 2,069 lines) | Flat, no subfolders, mixed client/server | **No** |

**Proposal: keep `lib/` and `utils/` with their existing (implicit) rule made explicit, and
dissolve `helpers/` into them.** Concretely:

- `helpers/server.ts` (2 revalidation fns) → `lib/cache/revalidate.ts`. It is domain logic, and
  the `data-revalidation` skill already treats it as the canonical pair.
- `helpers/catalogueOperations.ts` (673) + `helpers/catalogueItems.ts` (100) +
  `helpers/contentBlocks.ts` (64) → `lib/catalogue/` alongside the existing
  `draft-cache.ts` / `ownership.ts` / `public.ts`.
- `helpers/theme.ts` (255) → `lib/themes/` alongside `upsert.ts`.
- `helpers/sanitizeHtml.ts` (186) → `lib/html/sanitize.ts`.
- `helpers/imageProcessing.ts` (156) → `lib/images/`.
- `helpers/articles.ts` + `helpers/docs.ts` → `lib/content/` (they serve `content/`).
- `helpers/client.ts` - see 3.2.

This is a pure-move refactor: `@/` imports mean every call site is a find-and-replace, and
`npx tsc --noEmit` proves completeness. Do it **one folder per commit** so a bad move is one revert.

### 3.2 `helpers/client.ts` is a 410-line grab-bag - 16 unrelated exports

`cn` (Tailwind class merge) · `formatPrice` · `kebabToTitle` · `snakeToTitleCase` ·
`startOfMonth`/`endOfMonth` (dead, see 1.7) · `disableConsoleInProduction` ·
`getCurrencySymbol` · `getGridStyle` · `contentVariants` (framer-motion) ·
`handleDownloadHTML` · `handleDownloadPng` · `validateStepHelper` (~90 lines of form
validation) · `extractDomain` · `htmlToText` · `getRequiredPlan`

This is the single clearest SRP violation in the repo and it is imported nearly everywhere,
which is exactly why it keeps growing. Split by concern:

- `lib/ui/cn.ts` - `cn` alone. It is imported by ~60 files; giving it its own module makes every
  other import in this list narrower.
- `lib/format/` - `formatPrice`, `getCurrencySymbol`, `kebabToTitle`, `snakeToTitleCase`
- `lib/html/to-text.ts` - `htmlToText`, `extractDomain`
- `lib/catalogue/download.ts` - `handleDownloadHTML`, `handleDownloadPng`
- `lib/entitlements/` - `getRequiredPlan` (it already belongs with `plan.ts`)
- colocate `getGridStyle` + `contentVariants` with the catalogue view that uses them
- colocate `validateStepHelper` with the wizard it validates
- `disableConsoleInProduction` → `instrumentation-client.ts` or `lib/observability/`

### 3.3 `types/shared.ts` is a props dumping ground - 22 types, 168 lines

`code-conventions` says app-local prop types go in `types/components.ts` / `types/shared.ts`.
In practice `types/shared.ts` holds **one-component prop types** - `ImageDropzoneProps`,
`SuccessModalProps`, `CatalogueHeaderProps`, `CatalogueFooterProps`, `GaugeChartProps`,
`CatalogueAnalyticsProps`, `SubscriptionProps`, `DashboardProps`, `OverviewProps`, `CardProps`,
`IFAQ`, `IBenefit`, `IBenefitBullet`, `ILinkItem` - each used by exactly one component.

A type used in one place is not shared. Move each next to its component; the export-usage scan
already shows several components define their props locally *and* have an entry here.

What genuinely stays: the `@quicktalog/common` re-exports and the cross-cutting types
(`DisplayItem`, `TabKey`, `HeadingSize`, `ISocials`, `NewsletterSubscriber`).

`types/components.ts` (45 lines) holds only navigation types - rename to `types/navigation.ts`
or fold into `components/navigation/`. `types/api.ts` holds one Paddle response type - move to
`utils/paddle/`. **This changes the convention, so update `code-conventions` in the same change.**

### 3.4 Single-file component folders

`components/analytics/` (1 file) · `components/scripts/` (1) · `components/wrappers/` (1).
Fold into `components/general/`, or - better for `wrappers/PageWrapperClient.tsx`, which is the
provider stack - introduce `components/providers/` and move the auth/session providers there too.
Low priority; it is noise, not debt.

### 3.5 61 relative imports that should use `@/`

`code-conventions` says "Avoid `../../..` chains", and there are 61 cross-folder `../` imports,
including `../../../ui/button` in `components/catalogue/sections/common/SectionHeader.tsx` and
7 in `components/catalogue/modals/content/BlockConfigForm.tsx`. Mechanical, and it can be a
Biome rule so it stays fixed. Worth doing **after** 3.1/3.2 so paths are only rewritten once.

### 3.6 Plan hygiene (`CLAUDE.md` requires this)

- `.claude/plans/active/2026-09-25-content-blocks-expansion/PLAN.md` says `Status: proposed`
  but its own note says the P0 work was **implemented 2026-09-26**. Update the status line, or
  archive it and move what's left to a new plan.
- `.claude/plans/active/ai-agent-plan-mode.md` is a loose file, not a dated folder. Part 1 is
  built and Part 2 is superseded by `2026-09-21-ai-credits`. Archive it.
- `.claude/plans/active/2026-09-21-ai-credits/PLAN.md` says `Status: proposed`, but commit
  `8799c61` is "implementation of ai credits mechanism" and `docs/architecture/ai-credits.md`
  exists. Reconcile.
- `.claude/plans/README.md` needs updating after any archive move.

---

## Suggested order

Each step ends with `npx tsc --noEmit && npm run check && npm test`, and steps 1 and 3 also
need `npm run build` (the UI deletions and the moves both touch the bundle).

1. **Tier 1 deletions** - 1.1 + 1.3 + 1.4 + 1.5 + 1.6 + 1.7, one commit per numbered item.
2. **Dependency removal** (1.2) - separate commit, so a surprise is one `npm install` away from
   being undone. Run `npm run build` and compare bundle size via the existing
   `.github/workflows/bundle-analysis.yaml`.
3. **Tier 3.1 + 3.2** - the `helpers/` dissolution, one destination folder per commit.
4. **Tier 3.3** - props colocation, plus the `code-conventions` update.
5. **Tier 3.5** - the `@/` import sweep, with a Biome rule to hold the line.
6. **Tier 3.6** - plan hygiene, any time.
7. **Tier 2** - after the PROD cutover, as its own piece of work.

`CLAUDE.md` also requires: update `docs/` where behaviour is documented (the tech-stack table
loses `react-hook-form`; `code-conventions` gains the `lib/` vs `utils/` rule and loses
`helpers/`), and update `.claude/skills/code-conventions` in the same change as 3.1–3.3.

## Explicitly NOT dead - do not delete

Flagged by the tooling, verified live:

- **All `app/**/{page,route,layout,...}.tsx`** - App Router entrypoints, imported by nothing by design.
- `components/charts/{LineChart,GaugeChart}.tsx` - reached via relative imports from
  `CatalogueAnalytics.tsx` and `MonthlyUsage.tsx`.
- `instrumentation.ts` → `onRequestError`, `instrumentation-client.ts` → `onRouterTransitionStart`,
  `app/api/agent/route.ts` → `maxDuration` - framework-called by name.
- `@biomejs/biome`, `typescript`, `husky`, `postcss`, `@types/react*`, `happy-dom`,
  `@vitest/coverage-v8`, `@testing-library/dom` - used by config/tooling, never imported.
- `apexcharts` - peer of `react-apexcharts`.
- `@types/sanitize-html` - `sanitize-html` ships no types.
- `scripts/redis/delete-legacy-keys.ts` - still pending its one PROD run.
- `supabase/phase5/` - post-cutover migrations, not yet applied.
- Every `components/ui/*` **not** in the 1.1 list.

## Two things to fix that are not cleanup

Found while sweeping; recording them so they are not lost:

1. `helpers/client.ts:22-23` - `startOfMonth`/`endOfMonth` are `new Date()` evaluated at
   **module load**. In a long-lived server process they go stale at the month boundary. They are
   unused today, so deleting them is the fix, but if anything reaches for that pattern again it
   needs to be a function.
2. `playwright` and `drizzle-kit` are in `dependencies`, not `devDependencies`. No app code
   imports either - `playwright` appears only in `playwright.config.ts`, `tests/e2e/**`, and as a
   defensive entry in `next.config.ts:12` `serverExternalPackages`; `drizzle-kit` only in
   `drizzle.config.ts`. `@playwright/test` is already a devDependency. Moving both shrinks the
   production install. Verify on a Vercel preview before merging: Vercel prunes devDependencies,
   so if anything does reach for `playwright` at runtime it will fail there and not locally.
