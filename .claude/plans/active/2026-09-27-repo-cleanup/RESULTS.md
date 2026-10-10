# Cleanup results - 2026-09-27

What was actually executed from [PLAN.md](./PLAN.md). **Tier 1 and Tier 3 are done.
Tier 2 (the Clerk dual-path) was deliberately not touched** and stays blocked on the
PROD cutover.

Net: **253 tracked files changed, 121 deleted, +335 / −22,948 lines** (excluding
`package-lock.json`, which lost a further 985 lines). `helpers/` no longer exists.

## Verification

| Gate | Before | After |
|---|---|---|
| `npx tsc --noEmit` | clean | clean |
| `npm test` | 42 files, 475 tests | 42 files, 429 tests |
| `npm run check` (Biome) | **194 errors**, 69 warnings, 617 files | **84 errors**, 40 warnings, 570 files |
| `npm run build` | - | compiles, 43/43 static pages |

The 46 missing tests are all deliberate deletions: 34 from
`tests/unit/helpers/catalogueTheme.test.ts` (the dead theme island) and 12 from the
`validateStepHelper` block (dead production code, see below). No test was disabled or
weakened. The remaining 84 Biome errors are all pre-existing and none are in files this
work created or moved (`content/docs` 33, surviving `components/ui` 31, `tests/db-pglite` 20).

## Tier 1 - deletions

| Item | Result |
|---|---|
| 1.1 Unused shadcn/Radix primitives | 28 files, 3,492 lines. `components/ui/` is now 23 files, down from 56 |
| 1.2 Dependencies | 21 removed. `dependencies` 88 → 67 |
| 1.3 Dead theme island | 5 files, 731 lines (`constants/themes.ts`, `types/theme.ts`, `helpers/catalogueTheme.ts`, `helpers/color.ts` + its test) |
| 1.4 Stray root files | `app/test/` deleted (it was a live public `/test` route); the two cutover logs moved to `verification/cutover-test-{preflight,verify}.txt` |
| 1.5 Duplicated PGlite harness | tooling + regenerable `plan-sql/` removed; **first-run SQL evidence kept** (see below) |
| 1.6 Orphaned public assets | 5 files, 616 KB. `public/` 8.6M → 8.0M |
| 1.7 Small unused exports | `startOfMonth`/`endOfMonth`, `ToolGroup` |

Two deviations from the plan, both deliberate:

- **1.5 was done more conservatively than written.** The plan said to delete the whole
  `verification/pglite-harness/` folder. On inspection, `rls.original.sql`,
  `rls.patched.sql` and `decision-sql.sql` exist **nowhere else** and are cited by
  `pglite-results.md` (PATCH P1–P5) and `architecture-decision.md`. Deleting them would
  have broken an audit trail for a migration that still has to run against PROD. So the
  duplicated tooling and the regenerable `plan-sql/` went; those three files stayed, with
  a `README.md` explaining where the runnable harness lives. Two live "reproduce with…"
  instructions in `PLAN.md` were repointed at `npm run test:db`; the dated write-ups were
  left alone, because rewriting them would falsify the record.
- **`EMBED_IFRAME_HOSTS` was kept.** The plan listed it as a candidate. It carries the
  comment *"Exported for the tests, so the list cannot drift without one failing"* - a
  deliberate test seam, not an oversight.

## Extra dead code found while refactoring

None of this was visible to the import-graph scan, because it is dead code *inside*
live files:

| What | Where | Size |
|---|---|---|
| `cleanValue()` - private, recursive, called by nothing | old `helpers/client.ts` | 46 lines |
| `validateStepHelper` + 3 interfaces - no production consumer, only its own test | old `helpers/client.ts` | ~110 lines + 121 test lines |
| `blockTags` Set - built then never read; the function uses regexes | `htmlToText` | 25 lines |

`validateStepHelper` validated a multi-step catalogue wizard. No such wizard remains
(checked: no component holds step state), so it went with its tests.

## Tier 3 - structure

### `helpers/` dissolved (3.1)

| Was | Now |
|---|---|
| `helpers/server.ts` | `lib/cache/revalidate.ts` |
| `helpers/catalogueOperations.ts` | `lib/catalogue/operations.ts` |
| `helpers/catalogueItems.ts` | `lib/catalogue/items.ts` |
| `helpers/contentBlocks.ts` | `lib/catalogue/content-blocks.ts` |
| `helpers/theme.ts` | `lib/themes/custom-theme.ts` |
| `helpers/sanitizeHtml.ts` | `lib/html/sanitize.ts` |
| `helpers/imageProcessing.ts` | `lib/images/processing.ts` |
| `helpers/articles.ts` · `helpers/docs.ts` | `lib/content/` |

### `helpers/client.ts` split (3.2)

The 410-line grab-bag is gone. Its 16 exports became:

| Export | Now |
|---|---|
| `cn` | `lib/ui/cn.ts` |
| `formatPrice`, `getCurrencySymbol` | `lib/format/price.ts` |
| `kebabToTitle`, `snakeToTitleCase` | `lib/format/text.ts` |
| `htmlToText` | `lib/html/to-text.ts` |
| `extractDomain` | `lib/http/domain.ts` |
| `handleDownloadHTML`, `handleDownloadPng` | `lib/catalogue/download.ts` |
| `getRequiredPlan` | `lib/entitlements/required-plan.ts` |
| `disableConsoleInProduction` | `lib/observability/console.ts` |
| `getGridStyle`, `contentVariants` | inlined into their only consumer, `components/catalogue/sections/common/Items.tsx` |
| `startOfMonth`, `endOfMonth`, `cleanValue`, `validateStepHelper` | deleted |

`getRequiredPlan` got its **own module rather than being appended to
`lib/entitlements/plan.ts`**, which the plan suggested: that file is `server-only` and
`getRequiredPlan` is called from client components, so appending would have broken the
client bundle.

### Types (3.3)

`types/shared.ts` 168 → 94 lines. Ten one-component prop types moved into their
components: `ImageDropzoneProps`, `CookiePreferencesModalProps`, `SuccessModalProps`,
`CatalogueHeaderProps`, `CatalogueFooterProps`, `CatalogueContentProps`,
`GaugeChartProps`, `CatalogueAnalyticsProps`, `SubscriptionProps`, `TabKey`.

Left in place, against the plan:
- `DashboardProps` and `OverviewProps` - each pulls 4–5 domain types, and `Overview.tsx`
  already has a local `OverallAnalytics` **component** that would collide with the
  `OverallAnalytics` **type**. They are page data contracts, not component props.
- `IBenefit`/`IBenefitBullet` - `IBenefit` references `IBenefitBullet`, so splitting them
  would make `types/` import from a component.

`types/components.ts` → `types/navigation.ts` (it only ever held nav types).
`types/api.ts` → `utils/paddle/types.ts` (one Paddle response type).

### Folders and imports (3.4, 3.5)

`components/{analytics,scripts,wrappers}/` were one file each and are gone:
`CatalogueAnalytics` → `components/dashboard/`, `ClarityScript` and `PageWrapperClient`
→ `components/general/` (which already holds this kind of cross-cutting single component,
e.g. `CookieBanner`).

All **61** cross-folder `../` imports became `@/`. A Biome `noRestrictedImports` pattern
now makes `../` an **error**, so this cannot drift back; `scripts/**` and `tests/**` are
exempt via the existing override.

### Plan hygiene (3.6)

- `ai-agent-plan-mode.md` → `archive/`.
- `2026-09-21-ai-credits` → `in progress`, with the shipped evidence named. Its §5 rollout
  and §6 open questions are **unconfirmed** - the owner should close them, then archive.
- `2026-09-25-content-blocks-expansion` → `in progress` (its own header already recorded
  the 2026-09-26 partial implementation).
- `plans/README.md` index rebuilt - it pointed at `active/2026-09-17-supabase-auth-migration/`,
  a path that does not exist, and called the migration "not started" when its PLAN.md says
  "in progress".

### Docs and skills updated

`code-conventions` (the "Where code goes" table now states the `lib/` vs `utils/` rule and
that `helpers/` is gone; props-belong-with-components added; the `@/` rule marked as
Biome-enforced), `data-revalidation`, `server-action-and-route`, `adding-new-content-block`,
`docs/architecture/ai-chat-flow.md` (including issue **H2**, the stale month-boundary
constants, now recorded as resolved), `docs/architecture/catalogue-html-safety.md`, and the
`CLAUDE.md` tech-stack table (`react-hook-form` removed - it was never used).

## Open items for the owner

1. **`playwright` and `drizzle-kit` moved to `devDependencies`.** Nothing imports either,
   but Vercel prunes devDependencies, so a runtime reach for `playwright` would fail on a
   preview and not locally. `next.config.ts:12` still lists it in `serverExternalPackages`.
   **Verify on a Vercel preview before merging.** This is the only change here with a
   failure mode that local gates cannot see.
2. **Two different types are both named `DisplayItem`** - `types/shared.ts` has
   `Omit<Item,"price"> & { price: string | number }` (used by `ItemDetailModal` and
   `CardProps`); `lib/catalogue/items.ts` has `{ item: Item; originalIndex: number }` (a
   search-result wrapper). Renaming one is the right fix, but which name is a domain call,
   so it was left alone.
3. **Nothing was committed.** All of this is in the working tree on `test`.
