# Codebase cleanup: findings

The evidence behind [PLAN.md](PLAN.md). The plain-language version is [OVERVIEW.md](OVERVIEW.md).

Written 2026-10-25 against the working tree on `test`: HEAD `1c59c70` plus 360 uncommitted files, including four in-progress plans. Line numbers refer to that tree.

**Verified** means the claim was checked by reading the code or by measurement. **Inferred** means it follows from the code but was not reproduced. **Per review** means a reviewer reported it and it was not re-checked by hand.

---

## 0. Method and baseline

### Method

- **Import graph.** A script (session scratchpad, not committed) parsed every `.ts`/`.tsx`/`.css` file in `src/`, `tests/`, `scripts/` and the root configs with the TypeScript compiler API. It resolved specifiers through `tsconfig.json`, so `@/` paths resolve. From the graph it computed:
  - files that the Next.js entry points cannot reach (`page`/`layout`/`route`/… files, `middleware.ts`, `instrumentation*.ts`, configs);
  - exports that no other module imports, with re-exports followed through barrels;
  - the importers of every npm package.

  Every candidate was then re-checked with `grep` on the symbol name.
- **Bundle sizes.** `esbuild` (already installed through Vite) bundled exactly what the app imports from each library, minified and gzipped, with React external.
- **Last production build.** `.next/` still holds the production build of 2026-10-22. Its client reference manifest for `/catalogues/[name]` was read, and its chunks were searched for builder-only strings.
- **Four read-only reviews**, all checked against [docs/standards/solid-principles.md](../../../../docs/standards/solid-principles.md) and the `code-conventions` skill:
  - the catalogue builder and published catalogue;
  - the rest of the UI;
  - the non-UI code in `src/`;
  - stale docs, tests, scripts, `supabase/` and assets.

  Every claim the plan relies on was re-checked by hand. Claims that weren't are marked "per review".

### Baseline (all gates green)

| Measure | Value |
|---|---|
| `src/` | 648 TS/TSX files, 60,579 lines |
| `src/components/` | 380 files, 35,406 lines; `catalogue/` alone 119 files, 14,152 lines |
| `npx tsc --noEmit` | clean |
| `npx biome check` | 0 errors, 2 warnings (`components/docs/DocHero.tsx:6`, `context/MainContext.tsx:33`) |
| `npm test` | 86 files, 772 tests, all passing (3.7 s) |
| `tsc --strict` (trial, no build info written) | 75 errors in 30 files |

### Already done by earlier work (do not redo)

- **2026-09-27 cleanup:**
  - `helpers/` dissolved into `lib/`;
  - 28 unused shadcn primitives and 21 packages removed;
  - `../` imports made a Biome error.
- **2026-09-28:** code moved into `src/`.
- **2026-10-24 (uncommitted):**
  - Clerk removed;
  - cutover scripts, `supabase/phase5/` and the PGlite harness deleted;
  - Playwright replaced by Vitest.

---

## 1. Things that are broken (found during the review)

| # | What happens | Where | Status |
|---|---|---|---|
| B1 | After you edit a section and save, the next "Add section" opens that section again, and saving overwrites it. `handleAdd` closes with `setIsOpen(false)`, which skips the `onClose` that clears `editingBlock`. "Add section" then opens without clearing it. | `catalogue/modals/AddContentModal.tsx:204`, `catalogue/view/Catalogue.tsx:167-172,288-298,326-330` | Traced in code, **not reproduced** |
| B2 | The welcome email "retry" never retries, and it logs "sent successfully" when sending failed. `sendWelcomeEmail` catches every error and returns `false`, so `retryOperation` never sees a throw. | `lib/email/transactional.ts:22-52,83-99,141-143` | Verified |
| B3 | Search-engine data is wrong in several places (detail below). | `constants/metadata.ts:107`, `constants/schemas.ts:47,104-114,268` | Verified (the fourth item per review) |
| B4 | Cancelling a Paddle subscription calls the hard-coded live API (`https://api.paddle.com`), even on TEST, where the SDK runs in sandbox. The webhook ignores the returned error. So on TEST, cancelling the older subscription after an upgrade, and cancelling on account deletion, most likely fail without anyone noticing. The error text says "Failed to create customer". | `actions/paddle.ts:1-35` (no `"use server"`, so it is not an action), `utils/paddle/process-webhook.ts:254-258` | Code verified, TEST failure **inferred** |
| B5 | The card shows the raw `discount.discountedPrice` (for example "9.5"), while the item popup shows the formatted price from `getItemPrice`. The card also skips the `0 < sale < price` check, so the two can disagree. | `catalogue/cards/common/PriceDisplay.tsx:22,34`, `catalogue/cards/index.tsx:68-90` | Code verified, visible mismatch inferred |
| B6 | `CardsSwitcher` returns early before calling `useState`/`useMemo`, which breaks the Rules of Hooks if a nameless item later gets a name. | `catalogue/cards/index.tsx:53-66` | Verified |
| B7 | The HubSpot function filters catalogues on `created_by`. That column was renamed `user_id` on 2026-09-29, so the function returns 400 before it reaches HubSpot. | `supabase/functions/create-crm-contact/index.ts:51-58`; migration `20260929120000_schema_consistency.sql:70` | Code verified, runtime inferred |
| B8 | The Brevo function reads `product_newsletter`, which was renamed `newsletter_subscribers`. The error is ignored, so `PRODUCT_NEWSLETTER` is always "No". | `supabase/functions/create-brevo-contact/index.ts:48-52`; migration `:220` | Verified |
| B9 | Two edge functions have no trigger, cron or caller in the repo, and both read `created_by`. | `append-catalogue-in-brevo-contact`, `discord-new-catalogue-alert` (only in `config.toml:51-52,60-61`) | Repo verified; dashboard-made triggers unknown |
| B10 | Both auth-config files still say `"disable_signup": true`, a cutover leftover. A full `--apply` would switch sign-ups off. | `scripts/supabase/auth-config.{test,prod}.json:4` | File verified; live value not checked |
| B11 | The integration test's PROD guard is a separate `it` with an `ALLOW_PROD=1` bypass. The read test in the same `describe` runs even when the guard fails. CLAUDE.md says integration tests never run against PROD. | `tests/integration/db/forgotten-wrapper.test.ts:39-46` | Verified |
| B12 | An article shows a broken image: `/images/marketing/hero-mockup.png` was deleted in `5219ca9`. | `content/articles/digital-menu-for-restaurants.tsx:96` | Verified |
| B13 | The revalidation helpers target routes that don't exist: `/catalogues` (page) and `/dashboard`, where the real path is `/admin/dashboard`. This is hidden because `revalidatePath("/", "layout")` purges everything. | `lib/cache/revalidate.ts:9,25-26` | Verified |
| B14 | Opening the editor's General tab calls the rate-limited `checkCatalogueName` action, which runs a database query, for the catalogue's own locked name. The input is always `disabled`, but its hook hard-codes `type: "create"`. | `catalogue/inputs/sidebar/GeneralTab.tsx:54`, `catalogue/inputs/CatalogueNameInput.tsx:31-37`, `hooks/useCatalogueName.ts:53-80` | Verified |
| B15 | The live Terms page shows the placeholders `[JURISDICTION]` and `[CITY / COUNTRY]`. | `app/(site)/(with-footer)/terms-and-conditions/page.tsx:506-512` | Verified |
| B16 | The 10-minute delete lock exists only in the dashboard UI; `deleteItem` on the server does not check it. | `dashboard/overview/ItemDropdownMenu.tsx:76,110`, `actions/catalogue.ts` | Verified |
| B17 | A signed-in user may see the cookie banner flash while their data loads, because "signed in" is read from `!!userData`. | `general/CookieBanner.tsx:22-65`, `modals/CookiePreferencesModal.tsx:89-90` | Inferred |
| B18 | On the published page, the builder's title/favicon effect overrides the server's favicon with a different fallback. | `catalogue/view/Catalogue.tsx:94-151` vs `app/catalogues/[name]/page.tsx:88` | Per review |

The four search-engine problems in B3:
- `/auth` declares the canonical address `/authentication`, which is a 404.
- `auth??mode=signup` has a double `?`.
- The site-search action points at `/search`, which does not exist.
- The pricing data hard-codes a $10 "Pro Plan".

---

## 2. Dead code

### 2.1 Files nothing imports (import graph, then grep)

| File | Lines | Notes |
|---|---|---|
| `src/components/ui/sheet.tsx` | 165 | Carries `//@ts-nocheck`. It became orphaned when `CatalogueSidebar` was deleted. `docs/architecture/product-theme.md:85` still describes it. |
| `src/components/catalogue/view/components/CatalogueButton.tsx` | ~40 | Same cause. `code-conventions` (L68) and `product-theme.md:82` still say the published catalogue uses it. |
| `src/utils/deepseek.ts` | ~30 | Left over from the description writer, which was removed on 2026-10-15. It is the only user of `openai`. |

### 2.2 Exports nothing uses

| Export | Where | Notes |
|---|---|---|
| `defaultCookiePreferences` | `constants/index.ts:4` | No references |
| `QrConfigInput` (type) | `constants/schemas.ts:521` | No references |
| `AcquisitionSource` (type) | `constants/users.ts:19` | No references |
| `snakeToTitleCase` | `lib/format/text.ts:8` | No references |
| `syncCache` | `utils/redis.ts:25` | No references |
| `hasTrackingIds` | `lib/catalogue/tracking-providers.ts:159` | Only its test uses it |
| `loadInTx` export | `lib/users/my-user-data.ts:55` | Used only in its own file |
| `addBlock` (context member) | `context/CatalogueContext.tsx` | Only `tests/unit/context/CatalogueContext.test.tsx` uses it; production appends through `updateCatalogue` |
| `applyOperations` in the context interface | same | Used only inside the provider |
| `CatalogueDialogContent`, `CatalogueDialogHeader` | `catalogue/modals/CatalogueDialog.tsx:16-39,107-118` | No references |
| `dismissNotice` | `hooks/useChatImageOcr.ts` | No references |

About 65 more exports are used only inside their own file, and 26 exist only for tests. Dropping `export` from the first group is optional tidying, not part of the plan.

### 2.3 Dead features and branches

**Demo mode.** `<Catalogue>` is only ever rendered with `"edit"` or `"view"` (`CatalogueBuilder.tsx:21`, `catalogues/[name]/page.tsx:144`, `preview/page.tsx:36`), and `CatalogueContent` always gets `type="item"`. That leaves dead:
- `Catalogue.tsx:48,244,254,263-267`, and the `"demo"` member of the `Heading` type;
- `CatalogueContent.tsx:36,64,141,288`;
- `context/MainContext.tsx` (47 lines; `isLoading` is never read);
- `general/AppearanceOptions.tsx` (218 lines; its only importer is `Catalogue.tsx`).

`Catalogue.tsx:254` also writes `${type === "demo" && "pt-16"}`, which puts the class `false` into the published markup. `/demo` now embeds the Hexus tour instead (`demo/DemoTour.tsx`). (Verified.)

**The editable name check.** The enabled path of `CatalogueNameInput` and all of `hooks/useCatalogueName.ts` (115 lines) are dead (see B14). (Verified.)

**`placeholderColor`.** It runs `useHeadingEditor` 22/240-247/259 → `HeadingInput` 21/66 → `EditableHeading` 13/30/92 and feeds a CSS variable that nothing reads. (Per review.)

**Description-writer leftovers:**
- `kind:"describe"` (`lib/ai/turn.ts:45,55`, `lib/ai/metering.ts:44`);
- `CREDITS.describe` (`lib/ai/pricing.ts:11`);
- `AiActionResult` (`types/ai.ts:9-14`);
- the user-facing hint "and the description writer" (`constants/pricing.ts:297`). (Verified.)

**`retryOperation`** and `MAX_RETRIES`/`RETRY_DELAY` (`constants/users.ts:1-2`); see B2.

**Paddle:**
- `SubscriptionTrialing`/`Resumed` are handled at `process-webhook.ts:23-24,38-39,138-139`, but `processEvent` (64-79) never routes those events;
- `handleCustomerData` (285-291) does nothing. (Verified.)

**Middleware matcher** `"/(trpc)(.*)"` (`middleware.ts:54`): the app has no tRPC. (Verified.)

**UI leftovers:**
- `ui/button.tsx:49-88`: the `locked` branch, which no `<Button>` passes;
- `modals/SuccessModal.tsx`: the `"edit"`/`"ai"` branches and the `"ocr"` value; only `type="regular"` is ever passed (`ActionButtons.tsx:167`);
- `modals/InformModal.tsx:28-29`: `image`/`imageAlt`, never passed;
- `emails/style.ts:35-41`: `preheader`, unused, and `fallbackText` (227-233) is identical to `finePrint`. (Verified, apart from `style.ts`, which is per review.)

**Builder leftovers** (per review, spot-checked):
- `TabKey` `"templates"` (`inputs/sidebar/index.tsx:21-26`);
- the `TemplatesInput` `direction` prop;
- the `CatalogueSearchBar` `debounceMs` prop;
- `EmbeddingBlock` `containerRef` (104/186);
- dummy `setIsUploading` states (`GeneralTab.tsx:22`, `BackgroundConfiguration.tsx:52`);
- a duplicate import of the swiper CSS (`ItemsSection.tsx:4-5`);
- two "// Per user instruction" comments (`TemplatesInput.tsx:53,63`).

**HubSpot chat CSS:** `Catalogue.tsx:182-192` and `app/globals.css:176-180`. No HubSpot script is loaded anywhere. (Verified.)

**Console silencer:**
- `lib/observability/console.ts`, called from `MainContext.tsx:35`, clears the console and silences `log`, `debug`, `info` and `warn` in production when `NEXT_PUBLIC_DISABLE_LOGGING` is set;
- it hides warnings rather than removing stray logs;
- there are 8 `console.log` calls in `src/` (`constants/ui.tsx:51`, `catalogue/view/Catalogue.tsx:108`, `api/items/uploadthing/core.ts:34`, `process-webhook.ts:78,288`, `images/processing.ts:143`, `email/transactional.ts:143`). (Verified.)

**Unused search-engine data and settings:**
- JSON-LD blocks that no page requests (`constants/schemas.ts:33-50,138-172,254-271`);
- `siteDetails` fields other than `siteUrl`/`siteName` (`constants/details.ts:7-19`, plus commented-out socials at 30-37);
- unreachable explanation keys `custom_features` and `"ocr-ai-import"` (`constants/pricing.ts:174,176`);
- about 90 of the 164 lines in `modals/limits/limitContent.ts` (`icon`, `description`, `upgradeText`, `benefit`, `valueProposition`). (Per review.)

**Clerk leftovers:**
- `"svix-signature"` in `lib/observability/sentry-scrub.ts:16`, the Clerk webhook header;
- comments that still mention "whichever auth provider is live" (`hooks/useSignOut.ts:8`, `context/AuthContext.tsx:5-10,25`). (Verified.)

### 2.4 Unused CSS

None of these has a reference in any TS/TSX file (verified with grep):
- `other.css`: `.theme-swiper`, `#language-select`, `.scrollbar-hide`, `.rsw-ce` (37-45, repeated at 47-57) and `.footer-cta-button`. Only `.rich-text-content` is used.
- `animation.css`: `matrix`, `slideDown`, `fadeInScale` and `fadeInUp`. `fadeIn`/`fade-in` are used only by `.animate-fadeIn`/`.animate-fade-in` (`globals.css:106,129`), which are themselves unused, as is `.dashboard-sidebar` (`globals.css:95`).
- `catalogue-chrome.css:414`: `.cat-foot-muted`.
- `overlay.css:19-22`: an `:nth-of-type(0)` rule, which can never match.
- `themes.css:225-300`: `.theme-winter-light`. The shared package has no such theme, but a saved catalogue could still carry the value; **check before deleting**.

### 2.5 Public files

| File | Size | Status |
|---|---|---|
| `public/images/marketing/hero.svg` | **19.7 MB** | Unreferenced; `Hero.tsx` uses `hero.png` (verified) |
| `public/images/builder/content.svg` | 13 KB | Unreferenced since `a27978f` (verified) |

Everything else in `public/` is referenced, including the 5 animations through `/animations/${name}.json` and both template images. (Per review.)

### 2.6 Other leftovers

- `app/llms.txt/route.ts` (65 lines) returns a fixed string with no data access, so it could be `public/llms.txt`. (Verified.)
- **One-off scripts:**
  - `scripts/redis/delete-legacy-keys.ts` says "run once after Phase 1".
  - `scripts/paddle/rewrite-legacy-custom-data.ts` reads `migration.clerk_user_map`, which the uncommitted migration `20261024211643_drop_clerk_migration_schema.sql` drops. It must run on PROD before that migration does.

  Both have tests in `tests/unit/scripts/`. Whether either has run is unknown.
- `deno.lock` (untracked) was created on 2026-10-24 by a `deno check` run in `supabase/functions`. With no `deno.json`, Deno locked the root `package.json` (80+ npm entries). Nothing else uses Deno. (Per review; the file's contents were checked.)

---

## 3. npm packages

The sizes are what the app imports, minified and gzipped, with React external (esbuild).

| Package | Used by | Verdict |
|---|---|---|
| `openai` | `utils/deepseek.ts` (dead) | Remove |
| `bcryptjs`, `csv-parse` (dev) | nothing (their importers were the deleted cutover scripts) | Remove |
| `postcss-load-config` (dev) | a JSDoc type in `postcss.config.mjs` | Remove |
| `@vitest/coverage-v8` (dev) | nothing; no script runs coverage | Remove |
| `vite-tsconfig-paths` (dev) | both vitest configs | Remove: Vite 8.3 (installed) has `resolve.tsconfigPaths` built in |
| `framer-motion` | `sections/common/Items.tsx`: one collapse animation | Replace with CSS. **41.5 KB**, on every published catalogue |
| `swiper` | `Items.tsx`: `slidesPerView="auto"`, no modules; plus CSS imports in `ItemsSection.tsx` | Replace with CSS scroll-snap. **24.6 KB JS + 3.6 KB CSS**, on every published catalogue |
| `react-spinners` | `navigation/Loader.tsx` (`ScaleLoader`) | Replace with CSS (1.3 KB; one dependency fewer) |
| `react-calendly` | `dashboard/support/MeetingCta.tsx` (`InlineWidget`) | Replace with an `<iframe>` (3.3 KB). Add `calendly.com` to CSP `frame-src` |
| `@material-tailwind/react` (13 MB installed) | only `withMT` in `tailwind.config.ts` | Remove by copying its theme values (see below) |
| `react-icons` (84 MB installed) | 22 files: 25 Feather (`Fi*`) icons, which lucide covers, plus 10 brand logos; `IconType` in `content/docs/_types.ts` | Replace: lucide plus hand-added brand logos. One icon set instead of two |
| `apexcharts` + `react-apexcharts` | `charts/LineChart.tsx`, loaded with `next/dynamic` | **Keep**: 154 KB, but loaded only on the analytics page |
| `lottie-web` | `general/LottiePlayer.tsx`, a dynamic import of `lottie_light` | **Keep**: 48 KB, loaded on demand on the homepage |
| `@types/sanitize-html` | types | Move to `devDependencies` |
| `@react-email/render` | `lib/email/auth-templates.ts`, `scripts/test-emails.ts` | **Declare it**: today it resolves only through `@react-email/components` and `resend`, at two versions |
| `fast-glob` | `tests/unit/architecture/db-boundaries.test.ts` | Undeclared; it comes through Tailwind 3. Use `node:fs` `globSync` (Node 22+) |
| `@testing-library/dom`, `happy-dom`, `postcss`, `react-dom`, `tsx`, `husky`, `dotenv` | peers, test environment, CLI or a script | Keep |

**What `withMT` actually does.** It replaces four theme values and adds Material Tailwind's own component folders to the files Tailwind scans:
- breakpoints: `sm 540`, `md 720`, `lg 960`, `xl 1140`, `2xl 1320`, plus `lg-max`, which the config already deletes by hand. Tailwind's defaults are 640/768/1024/1280/1536.
- colours: the whole palette;
- fonts: `sans`/`serif`/`body` are Roboto;
- shadows.

So removing it means copying those values, or the breakpoint of every responsive class moves. The raw palette (gray, red, white, black) is used in 8 files.

---

## 4. The published catalogue page

- **Builder code is bundled in.** `catalogue/view/Catalogue.tsx:28-34` statically imports these builder-only modules: `CatalogueChat`, `AiReviewHighlights`, `ContentBlockButton`, `BuilderSidebar` (the whole editor panel), `AddContentModal`, `SelectTemplateModal`. `AppearanceOptions` (demo) and `LimitsModal` are imported too. The same component renders the public page (`app/catalogues/[name]/page.tsx`), the preview and the builder. (Verified.)
- **The last production build (2026-10-22)** confirms it. The client manifest for `/catalogues/[name]` lists 47 chunks: 2,125 KB raw, 644 KB gzipped, including the root layout's shared chunks.
  - Chunk `5829` (299 KB raw / 82 KB gzipped) contains "Choose a Template", "/api/agent" and "Add section".
  - Chunk `3746` (513 KB / 170 KB gzipped) contains the tesseract and monaco loaders and swiper.

  The saving will be measured with a before/after build. (Verified.)
- **Unneeded libraries:** `framer-motion` and `swiper` add about **70 KB gzipped** to the page, for a collapse animation and a swipe row (§3).
- **The page fetches its own API over HTTP:**
  - `app/catalogues/[name]/page.tsx:15,53,114` and `app/sitemap.ts:11` call `${NEXT_PUBLIC_BASE_URL}/api/items…`. This happens at build time too, so a build depends on whatever is deployed at that address.
  - The route handlers only wrap `getPublicCatalogue`/`getPublicCatalogueMeta`/`listPublicCatalogueNames` from `lib/catalogue/public.ts`.
  - `?type=name&status=active` is ignored.
  - The background-jobs repo calls only `/api/revalidate`. (Verified.)
- **The editing state lives in the public renderer.** `userData` flows into it, and so does the title/favicon effect (B18).

---

## 5. Tooling, CI and configuration

- **`.husky/pre-commit`** runs `npm run format` and then `npm run build`.
  - The formatter rewrites files without re-staging them, so the commit gets the unformatted version.
  - The production build runs on every commit (minutes).
  - The `protect-files` hook blocks edits under `.husky/`, so the owner has to make this change by hand.
- **`ci.yaml`:**
  - it triggers on `push` and `pull_request`, so PR branches run twice;
  - "lint" is `biome lint --write`, which fixes code in CI and never checks formatting;
  - there is no typecheck;
  - there is a 40-line commented-out `db-tests` job (L40-80);
  - there is no npm cache.
- **`format-check.yaml`:** the job is named `prettier`, and it runs only on pushes that change more than 1,000 files.
- **`bundle-analysis.yaml`:** named "Bundle Size"/`bundlemon`, but it only runs `npm run build`.
- **`.vscode/settings.json`:**
  - it sets VS Code's own formatters for `.tsx`, CSS and JSONC, overriding Biome;
  - it runs TypeScript's `organizeImports`, which `biome.json` turns off.
- **`.gitignore`:**
  - `/shared/*`, `/prisma/generated`, `.kilo/` and `.kilocode/` point at paths that don't exist;
  - `**/superpowers/` doesn't match `.superpowers/`;
  - `deno.lock` is not ignored.
- **`tailwind.config.ts`:** it scans `./src/pages/**`, which doesn't exist; `src/lib/**` (`ui/pill-tab.ts` holds class names) isn't scanned; and the constants glob misses `.tsx`. No class is missing today, because those classes also appear in scanned files.
- **`next.config.ts`:**
  - `serverExternalPackages: ["tesseract.js"]` is unnecessary: OCR runs only in the browser (`hooks/useChatImageOcr.ts`, a client file);
  - `automaticVercelMonitors: true` does nothing, because there are no Vercel crons;
  - `optimizePackageImports: ["react-icons"]` goes when react-icons does.
- **Sentry:** `sentry.server.config.ts` and `sentry.edge.config.ts` are identical apart from comments. Both hard-code the DSN, while the client reads `NEXT_PUBLIC_SENTRY_DSN`.
- **TypeScript:** `"strict": false`. A strict trial gives 75 errors in 30 files.
  - 31 of them are TS2339, which almost all come from `useCatalogueContext()` (29 consumers) and `useMainContext()` returning a possibly-null context without a guard.
  - The provider wraps the whole app (`PageWrapperClient.tsx:17`), so the guards scattered across consumers can never fire: 10 `|| {}`, about 20 `?.` reads, 11 `?.()` calls and 5 `if (!catalogue…) return null`.
- **Biome** is missing two rules that would have caught bugs found here: `noConsole` and `useHookAtTopLevel` (see B6).

---

## 6. Docs, skills, plans and memory

- **`.claude/plans/README.md`:** 21 of its links point at files that don't exist (rows L17-29 and L35-40). A blank line at L26 splits the table. `archive/` is empty.
- **`docs/architecture/ai-chat-flow.md`** (551 lines) describes the old single-shot JSON editor. None of these exist any more:
  - `lib/ai/catalogueEditor.ts`;
  - `toClientOperations`, `buildEditorSystemPrompt`, `buildCatalogueSnapshot`, `chatEditCatalogue`;
  - the `MAX_*`/`HISTORY_*` caps.

  The agent now lives in `src/agent/`.
- **Other docs:**
  - `catalogue-html-safety.md:25,57,70` says `custom_code`/`CustomCode.tsx`; they are now `custom_visual`/`CustomVisual.tsx`.
  - `product-theme.md:78,82,85` describes the deleted sidebar sheet and `CatalogueButton`.
  - `data-access.md:44-49`, `guides/drizzle.md:25-27` and `guides/vercel-env.md:90-117,168,211` still contain the "until M08" transition text.
- **`guides/vercel-env.md`** has errors and gaps:
  - it says "There is no `.env.example`" (L147-150), but the file exists;
  - `UPLOADTHING_TOKEN` and `SENTRY_WIDEN_CLIENT_FILE_UPLOAD` are missing;
  - so are the edge-function secrets.
- **Smaller docs:**
  - `guides/testing.md:52-53`: the folder list is incomplete.
  - `guides/git-workflow.md`: it describes a direct push to main, while the real flow is a PR from test to main.
  - `standards/solid-principles.md:189`: it ends with a chatbot leftover ("Do you want me to also make you a minimal single-page cheatsheet version?").
  - `README.md:41`: it says "Prisma".
  - `supabase/templates/README.md:36-37`: wrong paths.
- **`.env.example`:**
  - wrong filename in its own instructions (`cp env.example`);
  - a false "no leading dot" note;
  - the M08 transition text and "e2e cleanup";
  - `UPLOADTHING_TOKEN` and `SENTRY_WIDEN_CLIENT_FILE_UPLOAD` missing.

  The `protect-files` hook blocks `.env*`, so the owner has to edit it.
- **Skills:**
  - `code-conventions` cites `CatalogueButton`, lists the dead `deepseek` adapter, misses `posthog`, and misdescribes `UserContext` (auth is in `AuthContext`).
  - `data-revalidation` links a deleted plan, documents `/dashboard`, and has a "two data layers" section about a route that is now read-only.
  - `server-action-and-route` says "provisioning" and points to that stale section.
  - `adding-new-content-block` cites `limitRules`/`countSections` (both gone) and gives "TrackingBlock" as an example.
- **CLAUDE.md:**
  - L20 names `createdBy`/`ownerId`, which were renamed to `userId` on 2026-09-29.
  - L16 and L51 say "provisioning", although `asAdmin` now serves webhooks and account deletion only.
- **Code comments** refer to codenames from the deleted auth plan (M03, M08, M10):
  - `utils/db/pool.ts:44`, `auth/forms/SignUpForm.tsx:71`, `scripts/redis/delete-legacy-keys.ts:29`;
  - `supabase/seed.sql:11,30`, two integration tests, and pgTAP comments.

  M08 is `20260922090001_app_rls_login_role.sql`.
- **Memory:** the auto-memory note `block-level-ai-foundation` described removed code (`server_actions/ai.ts`, `useAiAssist`, Clerk). It was deleted on 2026-10-25, in the same session as this review.
- **Git index:** 43 deletions are not staged, among them all of `.claude/plans/archive/*`, `playwright.config.ts`, `CatalogueInitializer.tsx` and `LegalToc.tsx`. `tests/e2e/auth.setup.ts` is `MD`. Stage them before the next commit, or they stay in the repo.

---

## 7. Structure and naming

- **Top-level `components/` folders.** There are 23, and their names already map to routes. A full regroup into `site/`/`app/`/`shared/` would move 241 files and rewrite 611 import lines in 209 files. **Not worth it.** The real problems are misplaced files:
  - **`general/`** (27 files) mixes four groups:
    - catalogue-only pieces: `SmartLink` (7 importers, all in `catalogue/view`), `HtmlContent`, `OptimizedImage`, `Overlay`;
    - the app's provider tree: `PageWrapperClient`;
    - cookie consent: `CookieBanner`;
    - single-owner pieces: `UpgradePlanCTA`, `GoogleLogo`, `GetStartedCTA`.
  - **`modals/`** holds builder-only dialogs (`SuccessModal`, `PublishQrPanel`, imported only by `catalogue/inputs/sidebar/ActionButtons.tsx`), name-field parts used by catalogue creation (`CatalogueNameField`, `NameHint`, `UrlPreview`), and the dialog primitive `AppDialog`.
  - **`navigation/`** holds `Loader` (route loading screens).
  - **`dashboard/navigation/`** holds tab switches.
  - **`contact/SupportContactCard.tsx`** has one importer: `dashboard/Support.tsx`.
  - **`home/Benefits/`** is the only PascalCase folder.
  - **Clerk-era names:** `dashboard/account/supabase/` and `SupabaseAccount` (siblings of the deleted `ClerkAccount`), and `auth/Auth.tsx` (a 27-line pass-through to `SupabaseAuthForms`).
  - **Two components named `CatalogueAnalytics`:** `components/analytics/` is the owner's analytics page; `catalogue/view/` is the visitor tracking-tag loader with its consent gate.
- **`components/catalogue/`** doesn't separate builder from published code:
  - `inputs/sidebar/index.tsx` is the builder frame, and `ActionButtons.tsx` is the phone bottom bar;
  - panel primitives live in `inputs/sidebar/panel/`, and `BuilderDialog` lives in `modals/content/`;
  - `BlockControls`/`BlockMenu` (section chrome) sit in `cards/common/`;
  - published dialogs share `modals/` with builder dialogs;
  - `AiReviewHighlights` is builder-only but sits in `view/`;
  - 83 of the 84 default-exported component files are in `catalogue/`, against the rule that components use named exports.
- **Hooks:**
  - 15 of the 34 hooks in `src/hooks/` have a single consumer;
  - four hook files already live in component folders (`useTurnstile`, `useBuilderActions`, `useSeedCatalogue`, `useHeadingEditor`);
  - `hooks/useBeforeUnload.tsx` exports `useNavigationGuard` and a `NavigationGuard` component, and nothing called `useBeforeUnload`;
  - `useUpgrade` saves the builder draft and has nothing to do with billing.
- **Non-UI modules in the wrong place** (verified unless noted):

  | Module | Problem | Belongs in |
  |---|---|---|
  | `constants/server.ts` | creates the Resend client | `utils/resend.ts` |
  | `lib/rate-limit.ts` | at the `lib/` root, not in a domain folder | `lib/http/` |
  | `actions/paddle.ts` | not an action (no `"use server"`) | an SDK wrapper in `utils/paddle/` |
  | `lib/paddle/checkout.ts` | a `"use server"` action | `actions/` |
  | `utils/paddle/process-webhook.ts` | our billing logic, not a vendor wrapper | `lib/paddle/` |
  | `lib/auth/cookie-options.ts` | Supabase cookie config | `utils/supabase/` |
  | `utils/cookies.ts` | localStorage plus the GTM `dataLayer`; wraps no SDK | `lib/consent/` |
  | `constants/dashboard.tsx`, `constants/ui.tsx` | JSX inside constants | plain data (`constants/ui.tsx` also duplicates `SocialIcon`) |
  | `loadOwnedCatalogue` | a database read inside the Redis module (`lib/catalogue/draft-cache.ts:21-32`) | `lib/catalogue/ownership.ts` |
  | `utils/ocr.ts` | its first half is canvas preprocessing, our logic | `lib/images/` |
  | `constants/ocr.ts` | language list duplicates the 32 codes in `LOCALE_BY_LANGUAGE` (`lib/catalogue/items.ts:64-97`) | merge into one list |

- **Tests:** the folder names `tests/unit/server_actions` (the folder is now `src/actions`), `tests/unit/ai` and `tests/unit/entitlements` don't mirror `src/`.

---

## 8. SOLID findings

### 8.1 Builder and published catalogue

- **Single responsibility** (what each file mixes, by line):

  | File | Lines | What it mixes |
  |---|---|---|
  | `chat/CatalogueChat.tsx` | 497 | message helpers (36-85), 4 effects (138-183), keep/reject (203-219, which duplicates `useCatalogueChat` 221-226), about 270 lines of JSX, two `LimitsModal`s |
  | `hooks/useCatalogueChat.ts` | 288 | error parsing, replaying tool edits onto the draft, the plan-continuation loop, credit refresh, send/reset (the loop reset is duplicated at 229-233/260-266); returns 16 fields |
  | `view/CatalogueContent.tsx` | 444 | URL search sync (92-133), expand state, the item add/edit state machine with limits (162-232), the empty state, the render chain (273-409), two dialogs |
  | `view/Catalogue.tsx` | 352 | public render, builder chrome (§4), style derivation (61-92, 205-223), title/favicon effect (94-151) |
  | `context/CatalogueContext.tsx` | 465 | 30 members, value not memoized: draft and dirty tracking, about 220 lines of pure transforms (105-324), the AI review (326-396), two special appearance updaters (398-425), three UI-panel flags |
  | `inputs/heading/useHeadingEditor.ts` | 273 | HTML parse/serialise (the `<h1 class>` string appears 3 times), selection save/restore, the character limit enforced twice; returns 22 values that `HeadingInput` only passes along |
  | `inputs/sidebar/appearance/BackgroundConfiguration.tsx` | 310 | four panels; a hand-written roving-key handler that duplicates `hooks/useRadioKeys` |
  | `inputs/item/ItemPricing.tsx` | 265 | two mirrored string states with sync effects; pricing rules (72-138) inside the component |
  | `sections/common/RichTextEditor.tsx` | 275 | `ToolbarButton` declared inside render (122-158), so 8 buttons remount on every render (verified) |
  | `view/CatalogueAnalytics.tsx` | 261 | consent storage, context detection and cookie withdrawal next to the render |

- **Interface segregation:**
  - item handlers travel six levels (`CatalogueContent` → `ItemsSection` (23 props) → `Items` (15) → `CardsSwitcher` (15) → card → `BaseCard` → `CardControls`), and `blockIndex` goes all six only to support "Move to section";
  - every section renderer re-declares the same 7 control props (`TextBlock`, `DividerBlock`, `EmbeddingBlock`, `CustomVisual`);
  - `userData` threads from the page through the public components;
  - `AddContentModal` takes both `onClose` and `setIsOpen` (the cause of B1).
- **Open/closed:**
  - adding a section type means 13 edits across 6 files: the `CatalogueContent` render chain, `SectionTypePicker`, `BlockConfigHeader`, `BlockConfigForm`, `AddContentModal` (in five places) and `ContentBlockButton`;
  - the labels already disagree: "External content" in the picker, "Embed" in `EmbeddingBlock:192` and `operations.ts:90`;
  - the divider defaults are copied 4 times;
  - `AddContentModal.isLocked` (109-124) re-implements `isSectionTypeLocked`;
  - the builder mounts `LimitsModal` five times, and the chat always shows the "items" dialog, whichever limit was hit.
- **Duplication:**
  - three colour fields: `CustomThemeConfiguration` (186-200), `BackgroundConfiguration` (237-303) and `DividerInput` (98-127);
  - `HeaderTab` and `FooterTab` share their `handleChange` string-path parser, the branding-lock wrapper, the CTA fields and the logo slider;
  - `InitCatalogueModal` (123-161) re-implements `LanguageInput`/`CurrencySelect`;
  - there are three client save paths (`useBuilderActions.handleSave`, `useSaveDraft`, `TemplatesInput` "Save & continue", which neither marks the draft saved nor shows an error);
  - the `img.logo.dev` URL is built in 3 places;
  - `SelectTemplateModal` is mounted twice.

### 8.2 The rest of the UI

- **Primitives that get bypassed:**
  - `ui/card` is used by 3 files, but **29 files** copy its class string by hand;
  - `ui/badge` variants are bypassed by `StatusBadge`, `ReleaseTagBadge`, `CategoryTag`, `VersionPill`, `MonthlyUsage` and four hand-copied amber pills;
  - six notice boxes have no shared primitive.
- **Duplication:**
  - copy-to-clipboard is re-implemented 3 times, although `useCopyLink` exists;
  - the cookie-consent save is written 3 times;
  - the QR-instance lifecycle appears twice (`QrPreview`, `PublishQrPanel`);
  - the grid-and-glow background is copied 5 times;
  - the pricing tier grid appears twice (`home/Pricing`, `pricing/PricingPlans`);
  - there are two overlapping GoTrue error-message tables (`auth/common/authMessages.ts`, `dashboard/account/supabase/authErrors.ts`);
  - "at plan limit" is computed 3 times on the dashboard;
  - "ready to publish" has 2 different implementations, and so does the publish toast flow.
- **Single responsibility:**
  - `contact/ContactForm.tsx` (317);
  - `general/ImageDropzone.tsx` (272: validation, resizing, Sentry, toasts, and errors classified by matching message text);
  - `dashboard/overview/ItemDropdownMenu.tsx` (268; a fake "status" menu item, plus one `DuplicateCatalogueDialog` and one `LimitsModal` mounted **per card**);
  - `navigation/Navbar.tsx`, `NavDropdown.tsx` and `AuthLinks.tsx` (three render trees behind a `variant`);
  - `qr-editor/QrPreview.tsx`, `help/HelpCenter.tsx` and `pricing/PricingColumn.tsx` (three render trees, 13 props).
- **Contexts:**
  - `AuthContext` (the session) and `UserContext` (the database row) are separate on purpose; **keep both**;
  - `UserContext` rebuilds its value on every render, so its 10 consumers re-render;
  - `QRContext` exposes 7 members where 4 are needed;
  - `AuthContext` has a pass-through `AuthStateProvider` and a Clerk-era `accountHref`.
- **Static content:**
  - the legal pages are about 95% copy held in page files (terms 632 lines, privacy 285, refund 143);
  - the JSON-LD `<script>` is repeated in 11 pages.

### 8.3 Server-side modules

- **Section-type gating is written out in 7 places:**
  - `lib/entitlements/catalogue-fit.ts:14-27`, `lib/catalogue/operations.ts:60-96`, `lib/entitlements/operation-limits.ts:16-20`;
  - `agent/schemas.ts:14-20`, `agent/instructions.ts:98-100`;
  - `constants/pricing.ts:104-112,263-292`, `types/ai.ts:43-49`.

  "Is this catalogue over its plan" is computed 3 times: `catalogueFitsPlan`, `contentWithinPlan` and `instructions.ts:171-183`.
- **Large modules:**
  - `lib/catalogue/operations.ts` (736 lines) has six parts: types, gating, builders, section ops, item ops, and settings ops (505-728).
  - `agent/session.ts` (467): a pure snapshot (402-466), a constructor with 9 positional parameters, and `DEFAULT_AI_LIMITS`, which duplicates `PAID` in `lib/ai/limits.ts`.
  - `agent/web.ts` (445): an SSRF guard, a Firecrawl client, picture markers and `htmlToText`.
  - `agent/plan.ts` (221): plan state, history parsing (the same loop as `agent/skills/index.ts:40-60`) and a browser-side resume decision.
  - `constants/schemas.ts` (527): 360 of its lines are schema.org data, not Zod, and they repeat the titles in `metadata.ts`, which have already drifted. `https://www.quicktalog.app` is hard-coded 54 times in `constants/`.
- **Duplication:**

  | Concept | Copies |
  |---|---|
  | HTML to text | 3 (`lib/html/to-text.ts`, `agent/web.ts:342-363`, `agent/session.ts:61-66`) |
  | Hex-colour regex | 7 |
  | Tier lookup by Paddle price id | 3 (one returns `no_plan` where the others fall back to Starter) |
  | Free-tier definition | 2 |
  | Action result type | 5 |
  | Limit formatting | 3 (they disagree on "–" vs "N/A") |
  | Blob download | 3 |
  | Timestamp formatting | 3 |
  | Catalogue font list | 3 (`lib/fonts`, `constants/builder.ts`, `StyleConfiguration.tsx`) |
  | `DisplayItem` (two unrelated types with one name) | 2 |

- **API routes:**
  - no write exists both as an action and as a route;
  - `/api/items*` exists only for the self-fetch (§4);
  - `/api/dashboard/{analytics,catalogues,newsletter}` are three copies of one handler over selectors that `loadDashboardOverview` already runs in one transaction.
- **Naming:**
  - `actions/catalogue.ts` exports `deleteItem`, `deleteMultipleItems`, `updateItemStatus` and `duplicateItem`, which act on **catalogues**; the names collide with the agent's item tools;
  - `usePlanCheckout` uses `alert()` 4 times, where the rest of the app uses toasts.
