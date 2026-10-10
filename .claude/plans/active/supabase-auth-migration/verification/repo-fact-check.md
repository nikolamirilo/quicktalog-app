# Repository fact-check of the plan

> Fact-check of the plan run on 2026-09-17. All findings were applied to `../PLAN.md` (listed at the end of its Appendix D.4). Line references point at the pre-edit version of the plan.


## Summary

## Repo fact-check of FINAL_PLAN.md (sections 0-12, Appendix B/C)

I checked every file:line citation in sections 1, 2, 5, 6, 9, 10 and 12 against the files. For the app I used `quicktalog-app` at `fcee862` (branch `test`). For the worker and packages I used `../quicktalog-backend` (branch `test`, HEAD `6d3a5cf` plus 3 uncommitted edits) and `../quicktalog-packages` (branch `main`). I also checked **all 76 rows of Appendix C**, not just a sample: the set of locations matches `data-access.md` exactly, and every cited line is the statement the plan describes.

For `components/navigation/AuthLinks.tsx`, all citations match HEAD (`git show HEAD:`). The working tree adds one import (`TbDeviceAnalytics`), which shifts later lines by +1.

**Result: the plan is highly accurate.**
- **Line numbers:** almost all are exact. Only 3 are off, each by one line or a small range.
- **Git facts:** all confirmed.
- **Package versions and env var names:** all confirmed.
- **CI, Biome, Vitest, Husky, Playwright, Sentry, `next.config.ts` and middleware:** all confirmed.
- **TEST facts in 1.4:** re-checked with read-only SELECTs, all confirmed.

**Discrepancies, all minor except one:**
1. **Medium:** the Local column of section 8 does not match today's `supabase/config.toml`. `site_url` and the redirect list point at PROD/TEST, and several settings are missing. Phase 1 step 1 only lists `major_version`, `project_id` and `[db.seed]`.
2. **Low:** the S24 evidence leaves out where the Sync Plans cron hard-codes the PROD URL: the lockdown migration, lines 242-267.
3. **Low:** `app/admin/layout.tsx` does not exist, yet 5.5 and 7.4 treat it as an existing file.
4. **Low:** three line ranges are slightly off:
   - `Overview.tsx:115-127` should be `116-132`.
   - `ActionButtons.tsx:39-45` should be `39-46`.
   - worker `src/index.ts` CORS `:17-23` should be `:16-23`, and `scheduled()` is `:31-36`.
5. **Low:** `backend/src/lib/supabase.ts:4-8` matches the uncommitted working tree only. At HEAD it is `:9-13`, and an anon `supabaseClient` still exists at `:3-6`.
6. **Low:** the CI job in 11.2 runs `run-all.mjs`, but the harness ships `run-all.sh`.
7. **Low:** 9.1 says `tools.test.ts:24,336-401` holds Clerk/drizzle mocks. They are actually a `persistTheme` mock and session `userId` fixtures. The Clerk and drizzle mocks are in `ai.test.ts:11-12`.
8. **Low:** in Phase 0A, removing the catch-all at `process-webhook.ts:44-50` is not enough on its own. The inner handlers return early on supabase-js `{error}` results, so an error only reaches the 500 path once those returns become throws.

## Findings

### [medium] Section 8 'Supabase project configuration checklist', Local (`supabase/config.toml`) column (~lines 940-964); Section 5.4 Phase 1 step 1 (~line 619)

- **Where:** Section 8 'Supabase project configuration checklist', Local (`supabase/config.toml`) column (~lines 940-964); Section 5.4 Phase 1 step 1 (~line 619)
- **Problem:** The Local column reads as the local config, but `supabase/config.toml` does not match it today, and no plan step lists the edits needed. `site_url` is the PROD URL, not localhost. The redirect allow-list is PROD+TEST, not localhost. Minimum password length, secure password change, the email-change double confirm and `supabase/templates/*.html` are all unset. Phase 1 step 1 only changes `major_version`, `project_id` and `[db.seed]`. Local PKCE/confirm flows and the Phase 2 local `auth/signup` integration test would redirect to www.quicktalog.app.
- **Evidence:** supabase/config.toml:21 `site_url = "https://www.quicktalog.app"`; :23 `additional_redirect_urls = ["https://www.quicktalog.app", "https://test.quicktalog.app"]`; the file ends at :37 with `max_frequency = "1s"` and has no minimum_password_length, secure_password_change, double_confirm_changes, captcha or template entries; :1 `project_id = "pro_01k11h4bv62fv5vx936tm5wge0"`.
- **Fix:** In 5.4 step 1, extend the config.toml bullet to: "`supabase/config.toml`: `major_version = 17` (`:16`), `project_id = "quicktalog"` (`:1`), `site_url = "http://localhost:3000"` (`:21`, today PROD), `additional_redirect_urls = ["http://localhost:3000/**", "http://127.0.0.1:3000/**"]` (`:23`, today PROD+TEST), `[auth] minimum_password_length = 8`, `[auth.email] double_confirm_changes = true`, `secure_password_change = true`, `[auth.email.template.*] content_path = "./supabase/templates/<name>.html"`, `[db.seed] sql_paths = ["./seed.sql"]`." Add a note under the section 8 table: "Local column = target state; today's config.toml differs (see 5.4 step 1)."

### [low] Section 1.6 table, row S24 (~line 138)

- **Where:** Section 1.6 table, row S24 (~line 138)
- **Problem:** The evidence cites only the webhook function in remote_schema.sql. The 'Sync Plans cron' part of the finding is in a different migration.
- **Evidence:** supabase/migrations/20260911213819_remote_schema.sql:55-91 = call_edge_function_with_vault_secret (PROD URL at :74). The Sync Plans cron with the hard-coded PROD URL is supabase/migrations/20260912093000_lockdown_privileges_and_schema_fixes.sql:242-267 (cron.schedule at :245, url at :250). The Brevo trigger is remote_schema.sql:437.
- **Fix:** Replace the S24 evidence cell with: `supabase/migrations/20260911213819_remote_schema.sql:55-91` (webhook function; trigger `:437`), `supabase/migrations/20260912093000_lockdown_privileges_and_schema_fixes.sql:242-267` (Sync Plans cron, URL `:250`)

### [low] Section 5.5 step 5 (~line 661) and Section 7.4 (~line 902)

- **Where:** Section 5.5 step 5 (~line 661) and Section 7.4 (~line 902)
- **Problem:** The plan refers to `app/admin/layout.tsx` as if it exists (consent gate, server-side identity read). It does not exist, and it is not listed as a new file in 2.4, 9.1 or 9.2.
- **Evidence:** `ls app/admin` → `[name]`, `checkout`, `dashboard` only; `app/admin/layout.tsx: No such file or directory`.
- **Fix:** In 5.5 step 5 write "gate: new `app/admin/layout.tsx` (does not exist today) compares ..."; add a row to 9.2: "| `app/admin/layout.tsx` (new) | server-side `requireUser()` + consent-version gate inside one `withUser` tx | 2 |".

### [low] Section 5.2 step 1, updateItemStatus bullet (~line 578)

- **Where:** Section 5.2 step 1, updateItemStatus bullet (~line 578)
- **Problem:** The line range is slightly off for the caller in Overview.tsx.
- **Evidence:** components/dashboard/Overview.tsx: `async function handleUpdateItemStatus(` is at :116, `await updateItemStatus(id, status, name)` at :122, and the function ends at :132. ItemDropdownMenu.tsx only calls the `handleUpdateItemStatus` prop (:120, :250).
- **Fix:** Replace `components/dashboard/Overview.tsx:115-127` with `components/dashboard/Overview.tsx:116-132` (call at `:122`; `ItemDropdownMenu.tsx:120,250` via the prop).

### [low] Section 5.2 step 6 'UI results' (~line 591)

- **Where:** Section 5.2 step 6 'UI results' (~line 591)
- **Problem:** The cited range stops one line before the `if (!res)` check that the step is about.
- **Evidence:** components/catalogue/inputs/sidebar/ActionButtons.tsx:39 `const promise = updateCatalogueAction(catalogue);` … :45 `const res = await promise;` :46 `if (!res) throw new Error("Save failed");`. Publish is 88-99, with `if (!success)` at :94.
- **Fix:** Replace `ActionButtons.tsx:39-45,88-99` with `ActionButtons.tsx:39-46,88-99`.

### [low] Section 10.1 table rows 'HTTP route auth' and 'Kill switch' (~lines 1019-1021)

- **Where:** Section 10.1 table rows 'HTTP route auth' and 'Kill switch' (~lines 1019-1021)
- **Problem:** Two worker line ranges are imprecise.
- **Evidence:** ../quicktalog-backend/src/index.ts:16 `app.use(` … :18-22 `cors({ origin: "*", ... })` … :23 `);`. The routes are :25-26 (correct). :29 `export default {`, :31 `async scheduled(...) {` … :36 `},` :37 `};`.
- **Fix:** Change `drop CORS * (:17-23)` to `drop CORS * (:16-23)`, and `JOBS_PAUSED checked in scheduled() (src/index.ts:29-37)` to `JOBS_PAUSED checked at the top of scheduled() (src/index.ts:31-36)`.

### [low] Section 1.1 table row 'Worker' (~line 55) and Section 5.3 Track K step 2 (~line 603)

- **Where:** Section 1.1 table row 'Worker' (~line 55) and Section 5.3 Track K step 2 (~line 603)
- **Problem:** `backend/src/lib/supabase.ts:4-8` matches only the uncommitted working tree of quicktalog-backend. At the committed HEAD, supabaseAdmin is at :9-13, and an unused anon `supabaseClient(host, anon_key)` still exists at :3-6. Anyone reading the plan against a clean checkout, or PROD's deployed source, sees different lines and an anon client.
- **Evidence:** `git -C ../quicktalog-backend status` → ` M src/lib/supabase.ts` (+ src/constants/index.ts, src/handlers/cleanupImages.ts); `git show HEAD:src/lib/supabase.ts` → :3 `export function supabaseClient(host: string, anon_key: string)`, :9 `export function supabaseAdmin(...)`. Working tree :4 `export function supabaseAdmin`. `SUPABASE_ANON_KEY` is still declared at src/types/index.ts:4 and has no other reference.
- **Fix:** Replace `backend/src/lib/supabase.ts:4-8` with `backend/src/lib/supabase.ts:9-13 at HEAD 6d3a5cf (:4-8 in the uncommitted working tree, which also removes the anon supabaseClient at HEAD :3-6)` in both places, and in Track K step 2 add: "commit the pending removal of `supabaseClient` first".

### [low] Section 11.2 CI jobs, item 3 `db-pglite` (~line 1100)

- **Where:** Section 11.2 CI jobs, item 3 `db-pglite` (~line 1100)
- **Problem:** The CI command names an entry point that the harness being ported does not have.
- **Evidence:** the first-run PGlite harness has `run-all.sh` (a shell loop over `node run.mjs rls.*.sql 17|18`, then `run-decision.mjs` and `run-identity-m4.mjs`) and no `run-all.mjs`. Appendix D.1 heading (line 3829) says `./run-all.sh`.
- **Fix:** Replace with: `db-pglite`: `sh tests/db-pglite/run-all.sh` (or add a `run-all.mjs` wrapper during the Phase 1 port and name it in 5.4 step 1).

### [low] Section 9.1 table row `tests/unit/context/CatalogueContext.test.tsx:6-8`, `tests/unit/server_actions/ai.test.ts`, `tests/unit/agent/tools.test.ts:24,336-401` (~line 991)

- **Where:** Section 9.1 table row `tests/unit/context/CatalogueContext.test.tsx:6-8`, `tests/unit/server_actions/ai.test.ts`, `tests/unit/agent/tools.test.ts:24,336-401` (~line 991)
- **Problem:** The 'Clerk and `@/utils/drizzle` mocks' description does not fit tools.test.ts. That file mocks `@/actions/themes` and passes `userId` into the session. The Clerk and drizzle mocks are in ai.test.ts and CatalogueContext.test.tsx.
- **Evidence:** tests/unit/agent/tools.test.ts:24 `vi.mock("@/actions/themes", () => ({ persistTheme: vi.fn() }));`, :336 `userId: "user-1",` in the setCustomTheme tests (:331-402). tests/unit/server_actions/ai.test.ts:11 `vi.mock("@clerk/nextjs/server", ...)`, :12 `vi.mock("@/utils/drizzle", ...)`. CatalogueContext.test.tsx:6-8 `vi.mock("@clerk/nextjs", ...)`.
- **Fix:** Change the 'Today' cell to: "Clerk mocks (`CatalogueContext.test.tsx:6-8`, `ai.test.ts:11`), `@/utils/drizzle` mock (`ai.test.ts:12`), `@/actions/themes` `persistTheme` mock + session `userId` (`tools.test.ts:24,331-402`)".

### [low] Section 5.1 step 4, first sub-bullet of 'Move every supabase-js data call off anon' (~line 531)

- **Where:** Section 5.1 step 4, first sub-bullet of 'Move every supabase-js data call off anon' (~line 531)
- **Problem:** Removing the catch-all at `:44-50` does not by itself make the route return 500. The inner handlers handle supabase-js `{ error }` results by logging to Sentry and then `return`. They also silently return when no user is linked. The claim only holds once the Drizzle/asAdmin rewrite turns those paths into throws.
- **Evidence:** utils/paddle/process-webhook.ts:91-97 (subError → return), :112-122, :140-146 (logs only), :157-167, :176-183, :197-204, :225-230 (handleCustomerData only captures). The linked-user skip is at :79-85. app/api/paddle/route.ts:44-50 returns 500 only on a throw.
- **Fix:** Append to the bullet: "; in the asAdmin rewrite every `if (error) { Sentry...; return; }` branch (`:91-97, :112-122, :140-146, :157-167, :176-183, :197-204, :225-230`) becomes a throw; the unlinked-customer skip (`:79-85`) stays a logged 200 until 0B's unresolved queue."


## Verified OK

- Git: HEAD fcee862 on test; `git rev-list --count origin/main..test` = 39 (origin/main = local main = ef02164; origin/main has 5 PR merge commits not on test); origin/main has no supabase/migrations (only supabase/config.toml); origin/main ships POST/PATCH/GET /api/items, /api/analytics, /api/analytics/all, /api/subscriptions/check, all via the anon createClient; test has 4 migrations
- Package versions: @clerk/nextjs 6.39.3 (package.json:21), @clerk/testing (:111), @clerk/backend 2.33.3 transitive, drizzle-orm 0.45.2, postgres 3.4.9, @supabase/ssr ^0.5.2 / supabase-js ^2.47.10 installed 2.105.3 (:59-60), next 15.5.16, react 19.2, @quicktalog/common ^1.54.0 (:28); zod and server-only only transitive, @upstash/ratelimit absent; worker lock @quicktalog/common 1.51.0; packages version 1.54.0, `release` runs npm version minor and .husky/pre-push also runs `npm version minor` (double bump)
- .env.local names: DB_CONNECTION_STRING (shape checked without printing: postgres.<TEST ref> @ pooler:6543), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (sb_publishable_), CLERK_SECRET_KEY, CLERK_WEBHOOK_SIGNING_SECRET, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, E2E_CLERK_USER_USERNAME/PASSWORD; no NEXT_PUBLIC_CLERK_SIGN_IN_URL (consistent with 0A adding it); no .env.test.local
- CI: ci.yaml jobs lint (`npm run lint` = `biome lint --write`), unit-tests (`npm test`), e2e-tests with Clerk secrets at :45-48; bundle-analysis.yaml runs `npm run build` with no env; vitest.config.ts has no server-only alias and includes only tests/unit; biome.json has no noRestrictedImports; app .husky/pre-commit = format + build
- middleware.ts:1-14 clerkMiddleware protecting /admin(.*), broad matcher (covers /monitoring, /ingest, /api/*); utils/drizzle.ts:5-8 postgres(prepare:false), :7; utils/supabase/server.ts:1 and helpers/server.ts:1 are "use server" with no client importers; supabase/config.toml:16 major_version=15, :25 jwt_expiry 3600, :26-27 rotation/reuse 10, :7 schemas ["public"]
- next.config.ts:23-45 CORS block (Allow-Origin * + Allow-Credentials true), :7 puppeteer in serverExternalPackages, no env block; sentry.server.config.ts:19 sendDefaultPii/:22 beforeSend; sentry.edge.config.ts:20/:23; instrumentation-client.ts:42 sendDefaultPii, :47 'An unexpected response...' ignore, :58-60 Clerk ignoreErrors, :74 beforeSend
- Section 1.2: Auth.tsx:46-56 hash routing, :14-31 localStorage consent; UserContext.tsx:3-4,23,36,46-50; CatalogueContext.tsx:9,73,284-290; Settings.tsx:6,33-39; clerk route :51 anon client, :67/:78/:95; syncFromClerk.ts:103-110 (default plan + null customer on user.created), :142, :171; update-consent :25-42; 18 currentUser() call sites total, 16 that need only user.id
- Section 1.3: drizzleClient 39 non-import usages across the listed files; anon createClient at items/route.ts:11, items/[name]/route.ts:11, dashboard/analytics:8, clerk:51, fetchUserData.ts:53, process-webhook.ts:62,217; cleanup.ts:12-55 raw postgres; Redis createCatalogue/publish set without TTL, including createdBy
- Section 1.6 evidence exact: users/[id]/route.ts:6-31, actions/users.ts:9-39, items/route.ts:13, preview/page.tsx:28, catalogue.ts:284-321, qr-configs.ts:8-72, analytics/page.tsx:41-57 (HogQL LIKE with raw name, no owner check), catalogue.ts:337-347, :161, :177-239, useCreateCatalogue.ts:22-25,59, newsletter.ts:19-58, process-webhook.ts:44-50,214-223, pdf/route.ts:5-25, revalidate/route.ts:5-9 (GET), uploadthing/core.ts:6 fakeId, catalogue.ts:90-130, :79, themes.ts:37, users.ts:41-127, email.ts:9-36, :37-83; month bounds are module-level constants (helpers/client.ts:22-23)
- Section 1.4 (TEST read-only SELECTs): PG 17.6; 12 public tables, 0 RLS, 0 policies; anon grants exactly as listed; authenticated 0; datacl has =Tc/postgres; auth.users 0, public.users 3, all user_ ids matching B.1 CLERK_ID regex (length 32); postgres rolbypassrls true; no private/migration schemas, no app roles; 6 FKs to users.id all ON UPDATE/DELETE CASCADE; subscriptions → users.customer_id; prompts_service_catalogue_key UNIQUE(catalogue); prompts/ocr → catalogues ON DELETE CASCADE
- Section 2: page.tsx:14,52,113 (fetches /api/items; meta type has no status filter); sitemap.ts:11; CatalogueFooter.tsx:42-46 (passes createdBy as ownerId); Footer.tsx:31; catalogue.ts:151,187; useCatalogueName.ts:91 and :89-119; DashboardItem.tsx:35-62; fetchUserData.ts:46-74; CustomCode.tsx:202 sandbox="allow-scripts"; app/layout.tsx reads no cookies; no serverActions bodySizeLimit (1 MB default)
- Section 5: PageWrapperClient.tsx:21-26 (CookieBanner outside UserContextProvider at :26); NewsletterTable.tsx:29 unescaped CSV; agent/session.ts:68-90; agent/tools.ts:425-433; PricingColumn.tsx:141-146 Checkout.open with items/customer email; dashboard/catalogues/route.ts:12 null destructure; terms page:403 lists Clerk; css/index.css:4; app/globals.css:5 @layer clerk; worker src/index.ts:25-26 unauthenticated routes, subscriptionProcessingJob.ts:29 fetches /api/users/${id}, :17-20 skips free tier, src/helpers/index.ts:1-3 GET /api/revalidate without secret, src/types/index.ts:4-5, wrangler.jsonc:18,28 tpcfltcupcofteovrvmu, cron 0 3 * * *; packages schema.ts:35 stale pgPolicy, :33 consents default all-true
- Section 9: AuthLinks.tsx at HEAD :3,15,34-80 (.cl-userButtonBox hack at :50-55),104-112 (+1 in the working tree); catalogue.ts currentUser at 14,43,66,96,134,182,243,325; themes.ts:3,17,79,88; users.ts:5,11-27; lib/ai/access.ts:5,35; CookieBanner/CookiePreferencesModal use Clerk publicMetadata; utils/cookies.ts:87-106; playwright.config.ts:5,9; .gitignore:25,55-56; README.md:37; docs/architecture/ai-chat-flow.md:61; plans/archive/sentry-remediation-plan.md:35,83-85,167-171; constants/schemas.ts:270 `auth??mode=signup`; app drizzle.config.ts points at non-existent ./drizzle/schema.ts; vercel.json has no regions; every file importing @clerk is covered by 9.1
- Section 10: worker @quicktalog/common lock 1.51.0; .claude/skills/server-action-and-route/SKILL.md is 101 lines (:20-21 Drizzle/Supabase guidance); code-conventions SKILL.md:16,35,45; ISR tags catalogue-${name}, catalogues-list, catalogue-detail, catalogue-metadata exist (helpers/server.ts, page.tsx)
- Section 12: worker cron 03:00 UTC and `/__scheduled` test hint (src/index.ts:28); the /api/revalidate, paddle and edge-config steps are new designs with no repo claims to contradict
- Appendix C: all 76 locations identical to data-access.md call_sites and each line verified (catalogue.ts 46,52,69,79,99,105,137,151,161,187,204,246,289,328,340; newsletter.ts 25,40,64,74; qr-configs.ts 14,21,30,54; themes.ts 20,48,57,62,91; users.ts 83,29; access.ts 40,98; fetchUserData.ts 42,55,64,93,98,112,123; syncFromClerk.ts 142,171; clerk route 67,78,95; dashboard analytics 17,22; catalogues 18; newsletter 18,35; items 13; items/[name] 13; page.tsx 14,52,113; sitemap 11; useCatalogueName 91; builder 13; qr-editor 18; dashboard 14; DashboardItem 35; preview 28; process-webhook 73,87,106,136,151,170,192,220; tools.ts 433; agent route 56,125; ai.ts 29; users/[id] 31; cleanup.ts 16,53); outside-76 items (uploadthing core:6, email.ts:9-36, analytics page 41-57) also OK
- Appendix B repo assumptions: utils/paddle/get-paddle-instance.ts exports getPaddleInstance; utils/redis.ts exports getRedis; @upstash/redis 1.38 has getex; drizzle-orm errors.js:10-18 DrizzleQueryError sets .cause; @quicktalog/common exports schema, tiers, Catalogue; app/api/paddle/route.ts exists (catch at :44-50 returns 500)
