Status: proposed

# Codebase cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each numbered step is meant to be one commit, made only when the owner asks.

**Goal:** Make the app smaller, faster for catalogue visitors and easier to find your way around, without changing what it does:
- delete what nothing uses;
- replace libraries the app barely uses;
- keep one copy of every rule;
- put files where their feature lives;
- split the components that do several jobs.

Fix the bugs the review turned up first.

**Architecture:** Low-risk work comes first:
- **Bug fixes:** small behaviour changes, each checked on TEST before and after.
- **Deletions:** no visible change; the typecheck proves nothing still uses what was deleted.
- **Tooling, docs and file moves:** mechanical, proven by `tsc` and the import graph.
- **Strict TypeScript:** a safety net for the refactors after it.
- **Refactors:** the published catalogue, section types, the builder, the shared UI and the server modules.

Every step leaves the app working and passing the gates.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript 5.8, Tailwind 3, Biome 2.2, Vitest 4 (Vite 8), Drizzle, Supabase, Paddle.

**Spec:** the owner's request of 2026-10-25: "analyze in detail codebase and propose how to cleanup it". The evidence for every claim is in [FINDINGS.md](FINDINGS.md), and the plain-language version is [OVERVIEW.md](OVERVIEW.md).

## Global Constraints

- **Environments:** TEST (`imhinsgyzzyblghwnedk`) only. These steps reach PROD and run only on the owner's explicit say-so: deploying or deleting edge functions on PROD (1.6), and applying auth config (1.7).
- **Database:** no schema change and no migration in this plan. SQL is read-only (2.9).
- **Git:** no commits, pushes or branches unless the owner asks.
- **Files the owner edits by hand** (the `protect-files` hook blocks them): `.husky/pre-commit` (3.1) and `.env.example` (4.4).
- **Gates for every step:** `npx tsc --noEmit`, `npm run check`, `npm test`. Steps that touch pages, bundles or CSS also run `npm run build`. Report anything not run or failing.
- **Tests follow [docs/guides/testing.md](../../../../docs/guides/testing.md) and the existing test files.**
  - A new test only where a change touches security or data boundaries, plan limits, billing or stored data. It goes into the existing test file for that area.
  - Bug fixes are proven by reproducing the bug on TEST before and after, not by one test per bug.
  - Moved code keeps its tests, and deleted code loses them.
  - No tests for constants, copy, styling or layout.
  - The whole plan adds three: the integration-test guard fix (1.8), the public-catalogue boundary test (7.1) and one plan-gating parity case (9.4).
- **Conventions:** follow the `code-conventions`, `server-action-and-route` and `data-revalidation` skills. When a step changes a convention, update the skill in the same step.
- **Applied migrations** in `supabase/migrations/` are never edited, even where they mention Clerk or the cutover.

## Before you start

1. **Land the current work first.** The working tree has 360 uncommitted files, including four in-progress plans (agent plan limits, AI credit hard cap, catalogue chrome, phase II bugs). This cleanup touches many of the same files.
2. **Stage the 43 unstaged deletions** with the rest: `.claude/plans/archive/*`, `playwright.config.ts`, `CatalogueInitializer.tsx`, `LegalToc.tsx`, `tests/e2e/*`, `custom-visual-sandbox.test.ts`. `tests/e2e/auth.setup.ts` is `MD`. A plain `git commit` would keep these files.
3. **Record a baseline:**
   - the `npm run build` route table, especially First Load JS for `/catalogues/[name]` and `/admin/[name]/builder`;
   - the compiled CSS (`.next/static/css/*.css`, kept for Tasks 3.5 and 8.5);
   - `npm test` (86 files, 772 tests);
   - `npx biome check` (0 errors, 2 warnings).

## Decisions (please confirm)

| # | Decision | Cost / trade-off |
|---|---|---|
| D1 | Fix the bugs found in the review first, as separate small changes, before any cleanup | Behaviour changes sit inside a cleanup plan. Each is checked on TEST before and after, with no new test per bug |
| D2 | Targeted file moves, not a regroup of `components/` into `site/`/`app/`/`shared/` | About 20 top-level component folders remain. A full regroup would move 241 files and rewrite 611 import lines for little gain |
| D3 | Hooks used by one feature live in that feature's folder; `src/hooks/` keeps shared hooks only | Changes a documented rule; about 15 hook files move |
| D4 | Published catalogues use plain CSS instead of `framer-motion` (section open/close) and `swiper` (carousel layout) | On desktop the carousel can't be click-dragged; trackpad, shift+wheel, the scrollbar and touch still work |
| D5 | Remove `@material-tailwind/react` by copying the four theme values it injects (breakpoints, palette, fonts, shadows) | Needs a compiled-CSS comparison to prove nothing moved |
| D6 | One icon set: `lucide-react`, plus about 10 brand logos added by hand; `react-icons` goes | The brand logos (Facebook, Instagram, TikTok, …) are maintained in our code |
| D7 | Delete demo mode and `MainContext` | If a live demo catalogue is wanted again, it has to be rebuilt; `/demo` uses the Hexus tour |
| D8 | Delete the production console silencer, and have Biome block `console.log` instead | Warnings become visible in visitors' consoles, which is intended |
| D9 | Pre-commit runs Biome on staged files only. CI is one workflow (Biome, typecheck, tests). Delete `format-check.yaml`, `bundle-analysis.yaml` and the commented-out DB job | A broken build is caught by CI and Vercel, not at commit time |
| D10 | Turn on `"strict": true` in `tsconfig.json` | About half a day to fix 75 errors; new code must handle values that may be empty |
| D11 | The published page reads catalogue data directly (cached with the same tags), and `/api/items` and `/api/items/[name]` are deleted | Any outside caller would break. None were found in our repos; check 14 days of Vercel logs first |
| D12 | Keep `apexcharts` and `lottie-web` | Two heavy libraries stay, but both load only on demand (analytics page, homepage) |
| D13 | Fix both CRM functions (HubSpot and Brevo) now. Delete the two unwired edge functions once you confirm no dashboard trigger calls them | Two deploys, TEST then PROD. Choosing one CRM is a separate business decision |

## Review Focus

1. **The published catalogue must look and behave the same** (Tasks 1.5, 7, 8). Check all four layouts, opening and closing sections, swiping the carousel, search, the item popup, the footer, and a dark theme. Use the fixture comparison described in `docs/architecture/builder.md` plus a TEST catalogue on a phone.
2. **Breakpoints after removing Material Tailwind** (8.5). The compiled-CSS diff may only drop classes that Material Tailwind's own components defined. Any change to an `sm:`/`md:`/`lg:` rule is a bug.
3. **Plan-gating parity** (Task 9). For every tier, the agent, the builder, saving and publishing must allow exactly the same section types. Pin this with a parity test.
4. **Cache tags** (7.3). Publishing, unpublishing and editing a catalogue must still refresh the public page and the sitemap.
5. **Paddle cancellation on TEST** (1.4). After an upgrade, the older subscription is cancelled in the sandbox, and a failure is reported.

---

### Task 1: Fix the bugs found during the review

The evidence is in FINDINGS §1. Each sub-step is a small behaviour change, checked by reproducing it on TEST before and after.

None needs a new test:
- the logic that matters is already covered (prices by `item-price.test.ts`, the cancel decision by the webhook tests);
- the rest is copy, configuration or a one-line fix.

- [ ] **1.1 "Add section" reopens the last edited section (B1).**
  - Reproduce on TEST first: edit a section, Save, click "Add section". If the dialog shows the old section, the bug is confirmed. Note the result in FINDINGS.
  - Fix: `AddContentModal.handleAdd` ends with `onClose()` instead of `setIsOpen(false)`. Remove the `setIsOpen` prop and its pass-through (`Catalogue.tsx:330`). That leaves the dialog only one way to close, so the bug can't come back the same way.
- [ ] **1.2 The welcome email failure is hidden (B2).**
  - `sendWelcomeEmailSafely` calls `sendWelcomeEmail` once. When it returns `false`, call `console.error` and `Sentry.captureException(new Error("Welcome email not sent"), { level: "warning", tags: { op: "sendWelcomeEmail" } })`. Log success only on `true`.
  - Delete `retryOperation` and `MAX_RETRIES`/`RETRY_DELAY` (`constants/users.ts:1-2`).
  - No test change: `tests/unit/lib/users/welcome.test.ts` mocks this function.
- [ ] **1.3 Search-engine data (B3):**
  - `constants/metadata.ts:107` → `https://www.quicktalog.app/auth`;
  - `constants/schemas.ts:268` → `auth?mode=signup`;
  - remove the `SearchAction` that points at `/search` (`schemas.ts:47`);
  - build the pricing JSON-LD offers (104-114) from `tiers`, or remove them.
  - Check: the page source of `/auth` on TEST shows the `/auth` canonical.
- [ ] **1.4 Paddle cancellation uses the right environment (B4).**
  - In `actions/paddle.ts`, replace the raw `fetch("https://api.paddle.com/…")` with `getPaddleInstance().subscriptions.cancel(id, { effectiveFrom: "immediately" })`. Return `{ success: true } | { error: string }` with a correct message.
  - In `utils/paddle/process-webhook.ts:254-258` and `actions/account.ts`, report a failed cancel (`Sentry.captureException`: payments are "critical" under the Sentry noise policy) instead of dropping it.
  - The file stays where it is until Task 12.1.
  - No new test: `process-webhook.test.ts` already checks when a cancel happens. The bug is which Paddle environment gets called, and only the sandbox can show that.
  - TEST sandbox:
    - upgrading Basic → Growth cancels the Basic subscription;
    - deleting an account with an active subscription cancels it.
- [ ] **1.5 Card price matches the popup, and the hooks order is fixed (B5, B6).**
  - In `catalogue/cards/index.tsx`, move the early return (53-64) below the hooks.
  - Pass the `getItemPrice()` result (already computed as `detailPrice`) to `PriceDisplay` and `DiscountBadge` instead of the raw `price`/`discount`.
  - Delete `DisplayItem` from `types/shared.ts` if nothing else uses it.
  - No new test: `tests/unit/lib/catalogue/item-price.test.ts` covers the price logic the card now uses, and the Biome rule in 3.8 guards the hooks order.
  - Check a published TEST catalogue that has a discounted item.
- [ ] **1.6 Edge functions (B7-B9).**
  - Fix the two broken functions:
    - `create-crm-contact/index.ts:54` → `.eq("user_id", user.id)`;
    - `create-brevo-contact/index.ts:49` → `.from("newsletter_subscribers")`.
  - Run `deno check` on both, from inside `supabase/functions/` (see 2.13 about `deno.lock`).
  - Owner: confirm on both Supabase dashboards that no hand-made trigger calls `append-catalogue-in-brevo-contact` or `discord-new-catalogue-alert`. Then delete both folders and their `supabase/config.toml` entries, and remove them from the projects.
  - Deploy the two fixed functions to TEST. Check that:
    - a new TEST subscription reaches HubSpot;
    - a new sign-up shows the right newsletter flag in Brevo.

    Then deploy to PROD with explicit approval.
- [ ] **1.7 The auth config would switch sign-ups off (B10).**
  - Run `npx tsx scripts/supabase/auth-config.ts --check` against TEST (read-only).
  - Set `"disable_signup": false` in both `auth-config.{test,prod}.json` so the files match the live projects.
  - `--apply` stays an explicit owner action.
- [ ] **1.8 The integration test must never touch PROD (B11).**
  - In `tests/integration/db/forgotten-wrapper.test.ts`, replace the guard `it` with `beforeAll(() => { if (url?.includes(PROD_REF)) throw new Error("Refusing to run against PROD"); })`.
  - Delete `ALLOW_PROD`.
- [ ] **1.9 Broken article image (B12).** Point `content/articles/digital-menu-for-restaurants.tsx:96` at an existing image (`/images/marketing/hero.png`), or drop the figure.
- [ ] **1.10 Dead revalidation paths (B13).**
  - In `lib/cache/revalidate.ts`, remove `revalidatePath("/catalogues", "page")` and `revalidatePath("/dashboard", "page")`.
  - Leave `revalidatePath("/", "layout")` as it is (see "Not in this plan").
  - Fix `.claude/skills/data-revalidation/SKILL.md` L32.

**Owner only, no code:** the Terms page placeholders (B15) need the registered jurisdiction and city/country from you or your legal adviser.

**Verify:** the gates after each sub-step, plus the TEST checks listed. 1.6 and 1.7 change nothing on PROD without approval.

---

### Task 2: Delete dead code, files and unused packages

The evidence is in FINDINGS §2 and §3. No visible change, except that the editor stops making a hidden request (2.4) and the published markup loses a stray `false` class (2.3).

- [ ] **2.1 Orphan files.** Delete:
  - `src/components/ui/sheet.tsx`;
  - `src/components/catalogue/view/components/CatalogueButton.tsx`;
  - `src/utils/deepseek.ts`.

  Then `npm uninstall openai`.
- [ ] **2.2 Dead exports.** Delete those listed in FINDINGS §2.2:
  - `defaultCookiePreferences`, `QrConfigInput`, `AcquisitionSource`, `snakeToTitleCase`, `syncCache`;
  - `hasTrackingIds`, with its test case;
  - the `loadInTx` export;
  - `CatalogueDialogContent`/`CatalogueDialogHeader`, `dismissNotice`;
  - the context interface member `applyOperations`.

  The context's `addBlock` is used only by tests. It goes in 10.1, together with the transforms its tests exercise.
- [ ] **2.3 Demo mode (D7).**
  - Remove the `"demo"` branches and type members: `Catalogue.tsx:48,244,254,263-267`, `CatalogueContent.tsx:36,64,141,288`, and the `Heading` type.
  - Delete `context/MainContext.tsx` and its provider in `general/PageWrapperClient.tsx`.
  - Delete `general/AppearanceOptions.tsx`.
- [ ] **2.4 The hidden name check (B14).**
  - Show the catalogue name read-only in `GeneralTab` (a labelled read-only `Input`).
  - Delete the editable path of `CatalogueNameInput` and all of `hooks/useCatalogueName.ts`. Move `VALID_NAME`/`NAME_TAKEN_ERROR` into `hooks/useCatalogueNameField.ts`, their remaining user.
  - Check in the browser's network tab: opening the editor makes no `checkCatalogueName` call.
- [ ] **2.5 Builder leftovers.** Delete:
  - the `placeholderColor` chain;
  - `TabKey` `"templates"`;
  - the `TemplatesInput` `direction` prop;
  - the `CatalogueSearchBar` `debounceMs` prop;
  - `EmbeddingBlock` `containerRef`;
  - the two dummy `setIsUploading` states;
  - the duplicate swiper CSS import (`ItemsSection.tsx:4-5`);
  - the HubSpot CSS (`Catalogue.tsx:182-192`, `globals.css:176-180`);
  - the two "Per user instruction" comments;
  - `console.warn("No data, rendering null")` (`CatalogueContent.tsx:235`).
- [ ] **2.6 UI leftovers:**
  - the `ui/button.tsx:49-88` `locked` branch;
  - the `SuccessModal` `"edit"`/`"ai"` branches and the `"ocr"` value;
  - the `InformModal` `image`/`imageAlt` props;
  - in `emails/style.ts`, `preheader`; replace `fallbackText` with `finePrint`.
- [ ] **2.7 Server leftovers:**
  - the description writer: `kind:"describe"` in `lib/ai/turn.ts`/`metering.ts`, `CREDITS.describe`, `AiActionResult`, and the hint "and the description writer" (`constants/pricing.ts:297`);
  - Paddle: the `SubscriptionTrialing`/`Resumed` branches and `handleCustomerData`;
  - the `"/(trpc)(.*)"` middleware matcher;
  - the unused JSON-LD blocks (`schemas.ts:33-50,138-172,254-271`);
  - the unused `siteDetails` fields and commented-out socials;
  - the pricing keys `custom_features`/`"ocr-ai-import"`;
  - the unused `limitContent.ts` fields;
  - `"svix-signature"` in `sentry-scrub.ts`.
- [ ] **2.8 The console silencer (D8).**
  - Delete `lib/observability/console.ts` and its call, and remove `NEXT_PUBLIC_DISABLE_LOGGING` from `docs/guides/vercel-env.md:182`. The owner removes it from `.env.example` and Vercel.
  - Replace the 8 `console.log` calls (FINDINGS §2.3) with nothing, `console.info` (webhook traces) or `console.error`, whichever fits.
- [ ] **2.9 Unused CSS.**
  - Delete the rules listed in FINDINGS §2.4.
  - Rename `other.css` → `rich-text.css` and `overlay.css` → `catalogue-overlay.css`, and update `styles/index.css`.
  - `.theme-winter-light`: run a read-only count on TEST (`select count(*) from catalogues where theme = 'theme-winter-light'`), and have the owner check PROD. Delete it only if both are 0.
- [ ] **2.10 Public files.**
  - Delete `public/images/marketing/hero.svg` (19.7 MB) and `public/images/builder/content.svg`.
  - Replace `app/llms.txt/route.ts` with `public/llms.txt` holding the same text. Compare the response body and its `text/plain` type before and after.
- [ ] **2.11 Packages.**
  - Run `npm uninstall bcryptjs csv-parse postcss-load-config @vitest/coverage-v8 vite-tsconfig-paths`.
  - Both vitest configs use `resolve: { tsconfigPaths: true }`, which is built into Vite 8.
  - Remove the JSDoc type line from `postcss.config.mjs`.
  - Move `@types/sanitize-html` to `devDependencies`.
  - Add `@react-email/render` at the version `@react-email/components` uses.
  - In `tests/unit/architecture/db-boundaries.test.ts`, use `globSync` from `node:fs` instead of the undeclared `fast-glob`.
  - Check that `npm ls --depth=0` reports nothing missing or extraneous.
- [ ] **2.12 One-off scripts.**
  - The owner confirms that:
    - `scripts/redis/delete-legacy-keys.ts` has run on both Redis instances;
    - `scripts/paddle/rewrite-legacy-custom-data.ts` has run on PROD. It must run before migration `20261024211643_drop_clerk_migration_schema.sql` reaches PROD.
  - Then delete both scripts, `tests/unit/scripts/*`, their `scripts/README.md` rows and `docs/guides/vercel-env.md:197-201`.
- [ ] **2.13 `deno.lock`.** Delete it; Task 3.4 ignores it.

**Verify:** the gates after each sub-step, and `npm run build` after 2.3 and 2.9-2.11. The view source of a published TEST catalogue must contain no `class="… false …"`.

---

### Task 3: Fix the tooling: commit hook, CI, editor and config

The evidence is in FINDINGS §5.

- [ ] **3.1 Pre-commit (D9; the owner edits it by hand).** `.husky/pre-commit` becomes one line: `npx biome check --staged --no-errors-on-unmatched`.
- [ ] **3.2 CI (D9).** Rewrite `.github/workflows/ci.yaml` as:
  ```yaml
  name: CI
  on:
    push:
      branches: [main, test]
    pull_request:
  concurrency:
    group: ci-${{ github.ref }}
    cancel-in-progress: true
  jobs:
    check:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 22
            cache: npm
        - run: npm ci
        - run: npx biome ci .
        - run: npx tsc --noEmit
        - run: npm test
  ```
  Delete `format-check.yaml` and `bundle-analysis.yaml`. The commented-out `db-tests` job goes with the rewrite; `docs/guides/testing.md` keeps the local instructions for the database tests.
- [ ] **3.3 `.vscode/settings.json`.**
  - Keep `editor.defaultFormatter: "biomejs.biome"`, `formatOnSave` and `source.fixAll.biome`.
  - Remove `source.organizeImports`, the `[typescriptreact]`/`[css]`/`[jsonc]` overrides and `files.exclude`.
- [ ] **3.4 `.gitignore`.**
  - Remove `/shared/node_modules`, `/shared/dist`, `/prisma/generated`, `.kilo/`, `.kilocode/` and the yarn/pnp/`.eslintcache` lines.
  - Replace `**/superpowers/` with `/.superpowers/`.
  - Add `deno.lock`.
- [ ] **3.5 Tailwind scan list.**
  - In `tailwind.config.ts`, `content` becomes `./src/{app,components,lib,constants,content}/**/*.{ts,tsx}`; drop `./src/pages/**`.
  - Verify: the compiled CSS is identical to the baseline, or only gains rules.
- [ ] **3.6 `next.config.ts`.** Remove `serverExternalPackages: ["tesseract.js"]` (OCR runs only in the browser) and `automaticVercelMonitors` (there are no crons).
- [ ] **3.7 Sentry.**
  - Create `src/sentry.shared.ts`, exporting the server/edge options with `dsn: process.env.NEXT_PUBLIC_SENTRY_DSN`. `sentry.server.config.ts` and `sentry.edge.config.ts` import it.
  - The owner confirms the variable is set for every Vercel environment.
  - Verify: a test error from a TEST deployment arrives in Sentry, from both the server and the edge.
- [ ] **3.8 Biome rules.**
  - Add `suspicious.noConsole` (`{ "level": "error", "options": { "allow": ["error", "warn", "info"] } }`) and `correctness.useHookAtTopLevel: "error"`.
  - `scripts/**` and `tests/**` are exempt through the existing override. Fix any hits.
- [ ] **3.9 `package.json`.** Add the script `"typecheck": "tsc --noEmit"` and `"engines": { "node": ">=22" }`.

**Verify:**
- A staged file with bad formatting blocks the commit within seconds.
- A pushed branch runs CI once, and it passes.
- A deliberate type error fails CI.

---

### Task 4: Bring docs, skills, the plans index and comments up to date

The evidence is in FINDINGS §6.

- [ ] **4.1 `.claude/plans/README.md`.**
  - Delete rows L17-29 and L35-40, which point at 21 missing files, and close the gap at L26.
  - Keep the four 2026-10-24 rows and this plan.
  - The Archive section stays empty until something is archived.
- [ ] **4.2 The AI chat doc.**
  - Replace `docs/architecture/ai-chat-flow.md` (551 lines about the removed JSON editor) with a short, current description of `src/agent/`: session, plan mode, tools, skills and credits, linking to `ai-credits.md`. Keep the "Removed AI surfaces" note.
  - Update `docs/README.md`: add an `ai-credits.md` row, correct the `vercel-env.md` description, and correct the AI-chat status.
- [ ] **4.3 Doc fixes:**
  - `catalogue-html-safety.md`: `custom_code` → `custom_visual`, `CustomCode.tsx` → `CustomVisual.tsx`;
  - `product-theme.md:78,82,85`: the deleted sidebar sheet and `CatalogueButton`;
  - the M08 transition text in `data-access.md`, `drizzle.md` and `vercel-env.md`: describe the current state and name `20260922090001_app_rls_login_role.sql`;
  - `vercel-env.md`: its errors and gaps (`.env.example` exists; `UPLOADTHING_TOKEN`; `SENTRY_WIDEN_CLIENT_FILE_UPLOAD`; the edge-function secrets);
  - `testing.md`: the folder list;
  - `git-workflow.md`: the PR from test to main;
  - `solid-principles.md`: delete the chatbot line at L189;
  - `README.md`: "Prisma" → Drizzle, and add a link to `docs/`;
  - `supabase/templates/README.md`: the paths.
- [ ] **4.4 `.env.example` (the owner edits it by hand).**
  - Use `cp .env.example .env.local`.
  - Drop the "no leading dot" note, the M08 text, "e2e cleanup" and `NEXT_PUBLIC_DISABLE_LOGGING`.
  - Add `UPLOADTHING_TOKEN` and `SENTRY_WIDEN_CLIENT_FILE_UPLOAD`.
- [ ] **4.5 Skills:**
  - **`code-conventions`:**
    - remove the `CatalogueButton` line;
    - in the adapter list, drop `deepseek` and add `posthog`/`resend`;
    - correct the `lib/` domain list;
    - describe `UserContext` vs `AuthContext`;
    - add the hooks rule from D3.
  - **`data-revalidation`:** the dead link, `/dashboard`, and delete the "two data layers" section.
  - **`server-action-and-route`:** "provisioning", and the stale pointer.
  - **`adding-new-content-block`:** `limitRules`, `countSections`, and the TrackingBlock example. Task 9 rewrites this skill again.
- [ ] **4.6 `CLAUDE.md`** (the owner approves the wording):
  - L20: `createdBy`/`ownerId` → `userId`;
  - L16/L51: "provisioning" → "account deletion".
- [ ] **4.7 Code comments:**
  - replace the codenames M03/M08/M10 with migration file names in `utils/db/pool.ts:44`, `auth/forms/SignUpForm.tsx:71`, the two integration tests and `supabase/seed.sql`, but not in the migrations;
  - also fix `hooks/useSignOut.ts:8`, `context/AuthContext.tsx:5-10,25`, `lib/auth/consent.ts:49`, `actions/newsletter.ts:59`, `actions/auth-confirm.ts:61` and `agent/session.ts:41`;
  - replace "provisioning" in `utils/db/{index,admin,pool}.ts`.

**Verify:** a one-off link check over `docs/**/*.md` and `.claude/**/*.md` (a throwaway script, not committed): every relative link target exists.

---

### Task 5: Move files so folders match features

The evidence is in FINDINGS §7. These are pure moves and renames: `tsc` proves every import, and `git diff -M --stat` should show renames. Convert every moved component to named exports (83 of the 84 default exports are in `catalogue/`).

- [ ] **5.1 `components/catalogue/`: separate the builder from the published catalogue.**

  | From | To |
  |---|---|
  | `inputs/sidebar/index.tsx` | `builder/BuilderFrame.tsx` |
  | `inputs/sidebar/ActionButtons.tsx` | `builder/BuilderBottomBar.tsx` |
  | `inputs/ContentBlockButton.tsx` | `builder/AddSectionButton.tsx` (rename the prop to `onClick`) |
  | `view/AiReviewHighlights.tsx` | `builder/AiReviewHighlights.tsx` |
  | `components/modals/{SuccessModal,PublishQrPanel}.tsx` | `builder/` (used only by the bottom bar) |
  | `inputs/sidebar/panel/*`, `inputs/sidebar/LimitsOverlay.tsx`, `modals/content/{BuilderDialog,OptionSwitch,LayoutPicker}.tsx` | `builder/ui/` (fold `panel/tabRoot.ts` into `builder/ui/index.ts`) |
  | the rest of `inputs/sidebar/**` (tabs, `appearance/`, `footer/`, `general/`) | `editor/` |
  | `modals/AddContentModal.tsx`, `modals/content/{BlockConfigForm,BlockConfigHeader,SectionTypePicker,ItemsBlockFields}.tsx`, `inputs/{CustomVisualInput,DividerInput,EmbeddingInput,BlockNameInput}.tsx`, `inputs/custom-visual/` | `blocks/` |
  | `cards/common/{BlockControls,BlockMenu}.tsx` | `sections/common/` |
  | `sections/common/RichTextEditor.tsx` | `inputs/RichTextEditor.tsx` |
  | `view/components/Heading.tsx` | `view/Heading.tsx` |
  | the rest of `view/components/*` (all footer parts) | `view/footer/` |
  | `modals/{ItemDetailModal,ItemPhotoViewer,CatalogueDialog}.tsx` | `view/dialogs/` |
  | `view/CatalogueAnalytics.tsx` | `view/CatalogueTrackingTags.tsx` (two components shared one name) |
  | `components/general/{SmartLink,HtmlContent,OptimizedImage,Overlay}.tsx` | `view/` (used only by the catalogue) |
  | `components/modals/{CatalogueNameField,NameHint,UrlPreview}.tsx` | `create/` |

  Afterwards, `inputs/` holds `ItemInput` + `item/`, `HeadingInput` + `heading/`, `RichTextEditor`, `TemplatesInput`, `CurrencySelect`, `LanguageInput`, and the read-only name display from 2.4.
- [ ] **5.2 The rest of `components/`:**

  | From | To |
  |---|---|
  | `general/PageWrapperClient.tsx` | `src/context/AppProviders.tsx` |
  | `auth/session/SupabaseAuthProvider.tsx` | `src/context/SupabaseAuthProvider.tsx` (the `session/` folder goes) |
  | `general/CookieBanner.tsx`, `modals/CookiePreferencesModal.tsx` | `components/consent/` |
  | `general/UpgradePlanCTA.tsx` | `dashboard/common/` |
  | `general/GoogleLogo.tsx` | `auth/common/` |
  | `navigation/Loader.tsx` | `status/Loader.tsx` |
  | `dashboard/navigation/` | `dashboard/tabs/` |
  | `contact/SupportContactCard.tsx` | `dashboard/support/` |
  | `home/Benefits/` | `home/benefits/` |
  | `dashboard/account/supabase/*` | `dashboard/account/`, with `SupabaseAccount` → `AccountSettings` |
  | `auth/Auth.tsx` + `auth/SupabaseAuthForms.tsx` | `auth/AuthForms.tsx` (merged; the first was a 27-line pass-through) |
  | `hooks/useBeforeUnload.tsx` | `hooks/useNavigationGuard.ts` + `components/general/NavigationGuard.tsx` |
- [ ] **5.3 Non-UI modules:**

  | From | To |
  |---|---|
  | `constants/server.ts` (the Resend client) | `utils/resend.ts`; `scripts/test-emails.ts` reuses it |
  | `lib/rate-limit.ts` | `lib/http/rate-limit.ts` |
  | `lib/auth/cookie-options.ts` | `utils/supabase/cookie-options.ts` |
  | `utils/cookies.ts` | `lib/consent/cookie-preferences.ts` |
  | `components/dashboard/overview/timestamps.ts` | `lib/format/date.ts` |
  | `components/legal/readingTime.ts` | `lib/content/reading-time.ts` |
  | `loadOwnedCatalogue` (in `lib/catalogue/draft-cache.ts`) | `lib/catalogue/ownership.ts` |
  | `constants/builder.ts` | `constants/catalogue-style.ts` |
  | `constants/sort.ts` | inline into its single consumer |
  | `lib/http/domain.ts` | `lib/format/url.ts` |
  | `hooks/useUpgrade.ts` | `useSaveBeforeUpgrade.ts` (it saves the draft; it doesn't bill) |
- [ ] **5.4 Feature hooks next to their feature (D3).**

  | Hooks | Move to |
  |---|---|
  | `useCatalogueChat`, `useKeepAiChanges`, `useChatImageOcr`, `usePastedImages`, `useSaveBeforeUpgrade` | `catalogue/chat/` |
  | `useSaveDraft` | `catalogue/builder/` |
  | `useCreateCatalogue` | `catalogue/create/` |
  | `useSavedThemes` | `catalogue/editor/appearance/` |
  | `useDuplicateCatalogue` | `dashboard/overview/` |
  | `useQrActions` | `qr-editor/` |
  | `useTypedPrompt`, `useTypewriter` | `home/ai/` |

  Generic hooks stay in `src/hooks/`: media queries, swipe, in-view, scroll, Paddle, copy-link and similar.
- [ ] **5.5 Test folders.** `tests/unit/server_actions` → `tests/unit/actions`; `tests/unit/ai` → `tests/unit/lib/ai`; merge `tests/unit/entitlements` into `tests/unit/lib/entitlements`. Update the `vi.mock` paths.
- [ ] **5.6 Legal copy.** Move the `sections` arrays of the terms, privacy and refund pages into `src/content/legal/{terms,privacy,refund}.tsx`, the same pattern as `src/content/docs`. Each page shrinks to about 20 lines.
- [ ] **5.7 Docs.** Update the "Where code goes" table in `code-conventions` (the route for each folder, the catalogue subfolders, `consent/`, the hooks rule) and the paths in `docs/architecture/builder.md`, `catalogue-html-safety.md` and `qr-codes.md`.

**Verify:**
- the gates and `npm run build`;
- a smoke check of a published TEST catalogue, the builder (editor tabs, add section, chat), the dashboard, the QR editor, sign-in and the cookie banner.

---

### Task 6: Turn on strict TypeScript

The evidence is in FINDINGS §5: 75 errors in 30 files. Most come from context hooks that may return `null`.

- [ ] **6.1 Guarded context hooks.**
  - `useCatalogueContext`, `useUserContext`, `useAuth` and `useQr` throw `new Error("<hook> must be used inside <Provider>")` when the context is missing.
  - Remove the guards that can never fire: 10 `|| {}`, about 20 `?.` reads, 11 `?.()` calls, and 5 `if (!catalogue || !updateCatalogue) return null`. The comments at `CatalogueHeader.tsx:55` and `CatalogueFooter.tsx:88` claim the public page has no provider; that is wrong, so delete them.
- [ ] **6.2 Fix the remaining errors** (about 40): `string | null` props, possibly-undefined callbacks (TS2722), and `UserData | undefined`. Don't use `!` assertions where a real check belongs.
- [ ] **6.3 Set `"strict": true`** in `tsconfig.json`.

**Verify:** `npx tsc --noEmit` is clean with strict on, and the gates pass.

---

### Task 7: Published catalogue: ship only visitor code and read data directly

The evidence is in FINDINGS §4. This task has the highest risk: the public page is ISR-rendered and scanned from QR codes. See Review Focus 1 and 4.

- [ ] **7.1 Measure.**
  - From the baseline build, record First Load JS for `/catalogues/[name]` and the list of client chunks.
  - Add `tests/unit/architecture/public-catalogue-boundary.test.ts`, the same pattern as `db-boundaries.test.ts`.
    - It walks the static imports from `src/app/catalogues/[name]/page.tsx` and fails if it reaches `components/catalogue/{builder,editor,blocks,chat}/`, `components/catalogue/create/` or `components/modals/LimitsModal`.
    - It fails today and passes after 7.2.
    - It is the only thing that stops one stray import from silently shipping the builder to visitors again.
- [ ] **7.2 Split the renderer from the builder.**
  - `view/Catalogue.tsx` becomes a pure renderer. Props: `catalogue`, `mode: "view" | "edit"`, and slots `builderChrome?: ReactNode`, `heading?: ReactNode` and `afterContent?: ReactNode`.
  - `CatalogueContent` takes an optional `editor` object (the item and section callbacks) instead of reading `CatalogueContext`.
  - A new `builder/BuilderCanvas.tsx`, used by `CatalogueBuilder`, owns:
    - the editing state and the "edit section" state;
    - `AddContentModal`, `SelectTemplateModal`, `AddSectionButton`, `BuilderFrame`, `CatalogueChat`, `AiReviewHighlights`;
    - the limit dialogs;
    - the document title/favicon effect, which becomes builder-only (B18).
  - Move the style derivation (`Catalogue.tsx:61-92,205-223`) to `lib/catalogue/root-style.ts` (`catalogueRootStyle(catalogue)`).
  - `userData` no longer reaches public components.
- [ ] **7.3 Read data directly (D11).**
  - In `app/catalogues/[name]/page.tsx` (three fetches) and `app/sitemap.ts`, replace the self-fetches with `listPublicCatalogueNames`/`getPublicCatalogue`/`getPublicCatalogueMeta` from `lib/catalogue/public.ts`.
  - Wrap them in `unstable_cache`, keeping the tags (`catalogues-list`, `catalogue-${name}`, `catalogue-detail`, `catalogue-metadata`) and `revalidate: 3600`. These are public reads (`withPublic`) with no user identity, as CLAUDE.md requires.
  - Check 14 days of Vercel runtime logs for outside callers of `/api/items`, then delete `app/api/items/route.ts` and `app/api/items/[name]/route.ts`.
- [ ] **7.4 Re-measure.**
  - Run `npm run build` and record the new First Load JS in FINDINGS §4.
  - On TEST, publish, edit and unpublish a catalogue: the page and the sitemap update.
  - Walk Review Focus 1.

**Verify:** the gates, the build, the new boundary test, and the fixture comparison from `docs/architecture/builder.md`.

---

### Task 8: Replace barely-used libraries

The evidence is in FINDINGS §3. One commit per library; each removes the package with `npm uninstall`.

- [ ] **8.1 `framer-motion` → CSS (D4).**
  - In `sections/common/Items.tsx`, collapse with a `grid-template-rows: 0fr → 1fr` and opacity transition (350 ms, the same easing).
  - Under `prefers-reduced-motion`, there is no transition.
  - The `aria-controls`/`id`/`role="region"` attributes stay.
- [ ] **8.2 `swiper` → CSS scroll-snap (D4).**
  - The carousel becomes `overflow-x-auto snap-x snap-mandatory`, and each slide `snap-start shrink-0 w-[220px] md:w-[240px]`.
  - It keeps its `role="region"` and `aria-label`, plus `tabIndex={0}` for keyboard scrolling.
  - Remove the swiper CSS imports.
- [ ] **8.3 `react-spinners` → CSS.** In `status/Loader.tsx`, three bars with staggered `animate-pulse`, in `product-primary`. Keep `role="status"` and the screen-reader text.
- [ ] **8.4 `react-calendly` → `<iframe>`.**
  - `MeetingCta` embeds `${CALENDLY_URL}?embed_type=Inline&hide_gdpr_banner=1`, with a `title`. It mounts only while the dialog is open, as today.
  - Add `https://calendly.com` to the CSP `frame-src` in `next.config.ts`.
- [ ] **8.5 `@material-tailwind/react` → copied theme values (D5).**
  - In `tailwind.config.ts`, set `theme.screens` to `{ sm: "540px", md: "720px", lg: "960px", xl: "1140px", "2xl": "1320px" }` and keep Material Tailwind's `fontFamily` and `boxShadow`.
  - Either copy the palette for the colours actually used (gray, red, white, black) or move those 8 files to `product-*` tokens.
  - Remove `withMT` and the `lg-max` deletion hack.
  - Verify: the compiled CSS against the baseline. The only lines allowed to disappear are classes from Material Tailwind's own components. Check the homepage at 540/720/960/1140/1320 px.
- [ ] **8.6 `react-icons` → `lucide-react` (D6).**
  - Map the 25 `Fi*` icons to their lucide equivalents (Feather is lucide's ancestor), and `BsGlobe2` to `Globe`.
  - The brand logos (Facebook, GitHub, Instagram, LinkedIn, Pinterest, Threads, TikTok, X, Twitter, YouTube) become inline SVG components in `catalogue/view/footer/SocialIcon.tsx`, the single source. The site `Footer` uses it too, replacing `getPlatformIconByName` in `constants/ui.tsx`.
  - `IconType` → `LucideIcon` in `content/docs/_types.ts`.
  - Remove `optimizePackageImports: ["react-icons"]`.

**Verify:**
- the gates and the build after each library;
- Review Focus 1 and 2;
- the dashboard "Schedule a meeting" dialog and the route loading screens.

---

### Task 9: One definition per section type

The evidence is in FINDINGS §8.1 (open/closed) and §8.3. Today, 7 lists decide which section types a plan unlocks, and adding a type means 13 edits in 6 files.

- [ ] **9.1 `lib/catalogue/section-types.ts`** (pure, safe on the server).
  - It holds one list: `{ type, legacyKeys, planFlag, label, hint, defaults }`.
  - Plus `isSectionTypeLocked(features, type)`, `allowedSectionTypes(features)`, and `measureContent(catalogue)` (section and item counts).
  - Replace the 7 copies:
    - `lib/entitlements/catalogue-fit.ts:14-27`, `lib/catalogue/operations.ts:60-96`, `lib/entitlements/operation-limits.ts:16-20`;
    - `agent/schemas.ts:14-20`, `agent/instructions.ts:98-100`;
    - `constants/pricing.ts:104-112,263-292`, `types/ai.ts:43-49`.
  - Replace the 3 "over the plan" computations: `catalogueFitsPlan`, `contentWithinPlan` and `instructions.ts:171-183`.
  - Use one label per type. The picker's "External content" and the code's "Embed" disagree today; use the picker's wording everywhere.
  - Divider defaults come from here (4 copies today).
- [ ] **9.2 `components/catalogue/blocks/registry.tsx`** (client).
  - `satisfies Record<SectionType, BlockTypeDef>`, with `icon`, `Form`, `Renderer`, `fromBlock`, `toBlock` and `isValid`.
  - It drives `SectionTypePicker`, `BlockConfigHeader`, `BlockConfigForm`, `AddContentModal` (defaults, hydration, lock, add, validity) and the `CatalogueContent` render loop.
- [ ] **9.3 Add `canAddSection`** next to `canAddItem` in `lib/entitlements/operation-limits.ts`. It replaces the inline checks at `Catalogue.tsx:289-296` and `AddContentModal.tsx:126-140`; the latter returns `"items"` for a section limit.
- [ ] **9.4 One parity case**, added to the existing tests in `tests/unit/lib/entitlements/`.
  - It checks that, for every tier in `tiers`, the agent's allowed types, the builder's allowed types, the save check and the publish check agree.
  - The registry needs no test: `satisfies` enforces its completeness at compile time.
- [ ] **9.5 Rewrite the `adding-new-content-block` skill:** a new type is now one row in `section-types.ts`, one registry entry, and its renderer and form.

**Verify:** the gates. In the builder on TEST, the locked and unlocked section types match the plan for a Starter and a Growth user.

---

### Task 10: Split the builder's large components

The evidence is in FINDINGS §8.1. Each sub-step is one commit. Existing tests move with the code they cover. No new tests, because these splits change neither plan limits nor what gets saved.

- [ ] **10.1 `CatalogueContext`.**
  - Move the pure block and item transforms (105-324) to `lib/catalogue/content-edits.ts`.
  - `addBlock` goes. The cases in `tests/unit/context/CatalogueContext.test.tsx` move with the transforms and call them directly: the same cases, none new.
  - Move the UI flags to `context/BuilderUiContext.tsx`, renaming `isSidebarOpen` → `isEditorOpen`.
  - Replace `updateAppearance`/`updateThemeColors` with `updateAppearance(partial)`.
  - Add a typed `patchCatalogue(key, partial)`. It replaces the three string-path `handleChange(field: string, value: any)` parsers (`GeneralTab` 26-46, `HeaderTab` 31-67, `FooterTab` 21-65).
  - Memoize the provider value.
- [ ] **10.2 `CatalogueChat`** (497 lines).
  - Split it into `ChatLauncher`, `ChatPanelHeader`, `ChatEmptyState`, `ChatComposer` and `ChatThinking`, plus `useChatFocus(isOpen)` and `useTurnAnnouncement()`.
  - Move the message helpers to `lib/ai/messages.ts`.
  - Target: about 120 lines.
- [ ] **10.3 `useCatalogueChat`** (288 lines).
  - Split it into `useApplyAgentEdits`, `usePlanContinuation` (exposing `restart()`) and `useRefreshCreditsAfterTurn`.
  - Write the loop reset and the keep-and-toast flow once.
- [ ] **10.4 `CatalogueContent`.**
  - Move URL search to `useCatalogueSearch`.
  - Move the item add/edit state machine to a builder-only `ItemEditorController`.
  - Render through the registry from Task 9.
- [ ] **10.5 Limit dialogs.**
  - One `BuilderLimitsProvider` with `showLimit(type)` replaces the 5 `LimitsModal` mounts.
  - `LimitsModal` derives the required plan itself.
  - The agent's `limitReached` says which limit was hit, so the chat shows the right dialog.
- [ ] **10.6 Prop drilling.**
  - An edit-only `ItemEditingContext` (`edit`, `remove`, `move`, `canReorder`) replaces the handlers passed down six levels.
  - A `sections/common/BlockShell.tsx` with one `controls` object replaces the 7 control props re-declared by each renderer.
  - `ItemModal` loses `checkItemLimits`/`onShowLimits`; the limit is checked three times per add today.
  - `Newsletter` owns its form state, not `CatalogueFooter`.
- [ ] **10.7 Duplicates:**
  - **Colour:** an `editor/appearance/ColorField.tsx` replaces the 3 colour fields; `lib/color/hex.ts` (`isHex`) replaces the 7 regex copies.
  - **Header/Footer tabs:** `CtaFields`, `LogoWidthField` and `CustomizableGroup` are shared by both.
  - `InitCatalogueModal` reuses `LanguageInput`/`CurrencySelect`.
  - Every save goes through `useSaveDraft`; `TemplatesInput`'s "Save & continue" then marks the draft saved and shows errors.
  - `lib/http/brand-logo.ts` builds the `img.logo.dev` URL (3 copies today).
  - `SelectTemplateModal` has one controlled mount.
  - One helper handles "close the editor when a dialog opens" (3 copies).
- [ ] **10.8 Smaller splits:**
  - **`BackgroundConfiguration`:** the type picker uses `useRadioKeys`; add `GradientGrid`; use `ColorField`.
  - **`useHeadingEditor`:** split into `lib/catalogue/heading.ts` (parse and serialise), `lib/html/selection.ts` and `useHeadingFormatting`; drop the one-consumer barrel `inputs/heading/index.ts`.
  - **`ItemPricing`:** `useDecimalInput` plus `lib/catalogue/item-pricing.ts` (`setSalePrice`, `setSalePercent`, `toggleSale`).
  - **`RichTextEditor`:** `ToolbarButton` moves to module level, driven by a config array.
  - **`Items.tsx`:** the carousel and the grid share one item renderer, and `getGridStyle` folds the two identical variants.
  - **`EmbeddingBlock`:** `detectEmbedType` → `lib/catalogue/embed.ts`.
  - **`CatalogueTrackingTags`:** the consent storage → `lib/catalogue/analytics-consent.ts`.

**Verify:** the gates after each sub-step, and the builder smoke check from Task 5 after each one. Steps that touch `view/` also run Review Focus 1.

---

### Task 11: Shared building blocks for the rest of the UI

The evidence is in FINDINGS §8.2. Do one primitive at a time, each with a visual check of the screens that use it.

- [ ] **11.1 Primitives:**
  - `ui/card` gets variants (default, interactive, amber, dashed) and padding, replacing the 29 hand-copied card class strings.
  - `ui/badge` gets a size and an icon slot. Use it in `StatusBadge` (which maps 1:1 to the existing variants), `ReleaseTagBadge`, `CategoryTag`, `VersionPill`, `MonthlyUsage`, `ReleaseNoteEntry` and the amber pills.
  - A new `ui/alert.tsx` replaces the 6 notice boxes.
  - `modals/AppDialog` folds into `ui/` (a `size` prop, `AppDialogFooter`, `AppDialogIcon`).
  - A new `ui/form-field.tsx` is the base for `AuthField`, `ContactField`, `CatalogueNameField` and the account rows.
  - A `HeroBackdrop` replaces 5 copies.
  - `MiniCTA` becomes a `CtaStrip` with a `tone`. `ArticleCTA` stays as a preset, and `GetStartedCTA` goes.
  - One `CheckList`.
  - A `JsonLd` component replaces the hand-written `<script>` in 11 pages.
  - A `FilterChipGroup`.
- [ ] **11.2 Reuse the hooks that already exist:**
  - `useCopyLink` in `SuccessModal`, `ContactAside` and `QrUrlBar`;
  - a new `useCookieConsent` replaces 3 copies of the consent save;
  - a new `useQrCodeStyling(ref, options)` is shared by `QrPreview` and `PublishQrPanel`.
- [ ] **11.3 Logic out of components:**
  - merge the two auth message tables into `lib/auth/messages.ts`, with a context argument where the copy differs;
  - in `limitContent.ts`, the plan lookup becomes `limitValue(plan, type)` in `lib/entitlements/` and `formatLimit` moves to `lib/format/`;
  - CSV escaping goes to `lib/format/csv.ts`, with one `downloadBlob` (3 copies today);
  - one `formatTimestamp` (3 local copies today).
- [ ] **11.4 Dashboard catalogue cards:**
  - `getLimitState(plan, usage)` in `lib/entitlements/` (3 copies today);
  - `getPublishBlockers(catalogue)` in `lib/catalogue/` (2 implementations today);
  - a `usePublishCatalogue` hook (2 toast flows today);
  - lift the duplicate and limits dialogs into `Overview`, so there is one mount instead of one per card;
  - cards take `catalogue`, `limits` and one `actions` object;
  - render the status submenu explicitly, without the fake menu item.
- [ ] **11.5 Contexts:**
  - Memoize the `UserContext` value and `refreshUserData`.
  - `CookieBanner`/`CookiePreferencesModal` decide "signed in" from `useAuth()` and wait for `loading`, which fixes B17.
  - `QRContext` shrinks to `options`, `updateOptions`, `isDirty` and `markSaved`; the QR instance becomes a ref in `QrPreview`.
  - Drop `AuthContext`'s pass-through `AuthStateProvider` and `accountHref`.
- [ ] **11.6 Components that do several jobs:**
  - **`ContactForm`:** `useContactForm`.
  - **`ImageDropzone`:** `validateImageFile` with typed errors in `lib/images/`, `useImageUpload`, and separate `UploadedImagePreview` and `ImageUploadDropzone`; drop the unused `"logo"` type.
  - **`Navbar`:** `useScrolled`, `useModalSheet` and `MobileNavSheet`.
  - **`NavDropdown`:** `useHoverDisclosure` and `useArrowKeyFocus`.
  - **`AuthLinks`:** three components that share a `UserIdentity`.
  - **`HelpCenter`:** `useFaqFilter`, `HelpSearch` and `FaqEmptyState`.
  - **`PricingColumn`:** `PlanCard`, `StarterPlanRow` and `StarterPlanCard`; pass the `usePricingPlans()` result, and share a `PaidTierGrid` between home and pricing.
  - **`LimitsModal type="notFound"`:** becomes a `CatalogueNotFoundDialog`.
  - **`FloatingActionMenu`:** becomes `CreateCatalogueFab`.
  - **Email parts** get an `Email*` prefix.
  - **`NewsletterForm`:** uses `ui/input` and a Zod schema.
- [ ] **11.7 Small repeats:**
  - `authLinks.signup` replaces 9 hard-coded `"/auth?mode=signup"`;
  - `footerDetails.email` replaces 6 copies of the support email literal.

**Verify:** the gates after each sub-step, and a visual check of the pages that use the changed primitive (listed in FINDINGS §8.2).

---

### Task 12: Tidy the server-side modules

The evidence is in FINDINGS §7 and §8.3. These are mostly moves and pure-function splits that the existing tests cover.

- [ ] **12.1 Paddle.**

  | From | To |
  |---|---|
  | `actions/paddle.ts` (SDK-based after 1.4) | `utils/paddle/subscriptions.ts` |
  | `lib/paddle/checkout.ts` | `actions/checkout.ts` |
  | `utils/paddle/process-webhook.ts` | `lib/paddle/webhook.ts`, as plain functions |

  Delete `utils/paddle/types.ts`. Update `tests/unit/architecture/db-boundaries.test.ts:118,222` and `docs/architecture/billing.md`.
- [ ] **12.2 `lib/catalogue/operations.ts`** (736 lines).
  - Split into `lib/catalogue/operations/{index,sections,items,settings}.ts`, where each handler updates one shared result object.
  - Move `CatalogueOperation` and the `Ai*Fields` types there; this breaks the `types/ai.ts` ↔ operations cycle.
  - Make the switch exhaustive.
- [ ] **12.3 `actions/catalogue.ts`.**
  - Rename the catalogue-level actions so they stop colliding with item tools: `deleteItem` → `deleteCatalogue`, `deleteMultipleItems` → `deleteCatalogues`, `updateItemStatus` → `setCatalogueStatus`, `duplicateItem` → `duplicateCatalogue`.
  - One `ActionResult<T>` in `src/types/` replaces the 5 result types.
- [ ] **12.4 The agent.**

  | Move | To |
  |---|---|
  | `session.ts` snapshot (402-466) | `agent/snapshot.ts` |
  | `planSnapshot` | `agent/plan.ts` |
  | `DEFAULT_AI_LIMITS` | reuse `PAID` from `lib/ai/limits.ts` |
  | `web.ts` SSRF guard and picture markers | `agent/web/{safe-url,pictures}.ts` |
  | `web.ts` Firecrawl client | `utils/firecrawl.ts` |
  | `plan.ts` history parsing and resume decision | `agent/history.ts` + `agent/resume.ts` |
  | `AgentToolResult`, `AgentMessageMetadata` | `agent/types.ts` |

  The session constructor takes an options object instead of 9 positional parameters.
- [ ] **12.5 One `htmlToText`.**
  - Keep the `agent/web.ts` version in `lib/html/to-text.ts`. Replace `session.ts` `stripHtml` and `useBuilderActions` `isHeadingEmpty` with it.
  - The old lib version joined inline tags without a space, so check catalogue headings and search after the swap.
- [ ] **12.6 Tiers.** Create `lib/entitlements/tiers.ts`:
  - one lookup of the tier by Paddle price id (3 copies today);
  - one free-tier definition (2 today);
  - one type name (3 today).

  `my-user-data.ts` returns `no_plan` where the others fall back to Starter. Use the Starter fallback, the entitlements behaviour, unless the owner says otherwise. This changes how a plan is resolved, so update the existing case that covers it rather than adding a file.
- [ ] **12.7 SEO.**
  - Create `lib/seo/{pages,metadata,structured-data}.ts`, with one `SITE_URL` (54 hard-coded copies today) and one `buildMetadata()`.
  - `constants/schemas.ts` keeps only the Zod schemas; `qrConfigSchema` moves to `lib/qr/schema.ts`.
- [ ] **12.8 Colour maths.** Create `lib/color/{hex,contrast}.ts`, shared by `lib/themes/custom-theme.ts` (35-176) and `lib/qr/scan-risk.ts` (13-27).
- [ ] **12.9 Smaller moves:**
  - the OCR canvas preprocessing → `lib/images/ocr-preprocess.ts` (reuse `calculateDimensions`);
  - one language list in `constants/languages.ts` (the OCR options plus `LOCALE_BY_LANGUAGE`);
  - merge `lib/auth/consent.ts` into `terms.ts` and `session.ts` into `identity.ts`;
  - split `actions/consent.ts` into cookie preferences and legal terms;
  - `constants/dashboard.tsx` → `.ts`, storing icon components instead of elements;
  - dissolve `constants/ui.tsx`;
  - one catalogue font list, in `lib/fonts`.
- [ ] **12.10 Dashboard data.**
  - One `GET /api/dashboard/overview`, backed by `loadDashboardOverview` and one SWR key, replaces the three routes `analytics`, `catalogues` and `newsletter`.
  - Change `useDashboardData` and `refreshDashboardData` to match, and update the `data-revalidation` skill.
- [ ] **12.11 Checkout messages.** `usePlanCheckout` shows toasts instead of `alert()`.

**Verify:** the gates after each sub-step. 12.1 and 12.10 also need TEST checks: a sandbox checkout and webhook, and dashboard refreshes after a publish and a delete.

---

## Not in this plan

- **Tailwind 3 → 4.** Task 8.5 (removing Material Tailwind) is a prerequisite; the upgrade is a separate plan.
- **Choosing one CRM** (Brevo or HubSpot). Task 1.6 fixes both.
- **The server-side delete lock (B16).** The 10-minute rule exists only in the UI. Enforcing it on the server, or dropping it, is a product and security decision.
- **`revalidateDashboard` purges every page**, including every published catalogue, through `revalidatePath("/", "layout")`. Narrowing it belongs to the `data-revalidation` work.
- **The Terms page wording (B15)**, the docs "Was this helpful?" vote that is never stored, and other product copy.
- **The four active 2026-10-24 plans.** Finish and commit them before starting (see "Before you start").
- **The edge webhook's service-role fallback** (`supabase/functions/_shared/webhook.ts:7-10`). Removing it needs the Vault secret on both projects and a migration.
- **The legacy `category`/`container` handling** (`lib/catalogue/content-blocks.ts:13-50`). It can go once PROD has run `20260926130000` and old drafts have expired.
- **Enforcing the CSP** (it is report-only today) and adding the Monaco CDN to it.
- **Replacing `apexcharts`/`lottie-web`** (D12).
