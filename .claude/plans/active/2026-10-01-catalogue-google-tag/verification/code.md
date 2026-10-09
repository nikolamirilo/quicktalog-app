# Code verification of the synthesized design (C1-C9)

Written 2026-10-01 by an adversarial verification pass over `designs/synthesis.md`.

**Base.** `quicktalog-app` local `test` at `d785bb8`. `quicktalog-packages` at `7a2ca85` (1.66.0). `quicktalog-backend` at `133512e`.

**Caveat.** `git ls-remote` today shows remote `test` at `ade76b0`, which is not in the local clone. Local `origin/test` is stale (last fetch 2026-09-28). Every line number below is for `d785bb8`.

**What was run.** Repo reads only, and read-only `git` (`merge-base`, `ls-tree`, `show`, `ls-remote`).
- One read-only SELECT on TEST `imhinsgyzzyblghwnedk` (`information_schema` privileges).
- One live fetch of a public PROD catalogue page (FireCrawl, `maxAge: 0`), searched for markers only.
- One Vercel API call (`list_deployments`), which was refused with 403.
- Two Clerk documentation fetches.
- PROD Supabase was not queried, and nothing in the repos was changed.

**Labels.** **Fact** = code, a query result or a cited page. **Inference** = my reasoning.

## Verdicts

| Claim | Verdict | One-line reason |
|---|---|---|
| C1 | confirmed | Identical `<Catalogue type="view">` in both pages; no layout under `src/app/catalogues` |
| C2 | confirmed | Column-level UPDATE and SELECT in the migration, and the same on TEST today |
| C3 | confirmed (wording nuance) | `pickEditable` gates create, publish and duplicate; for duplicate the source is the DB row, not a client payload |
| C4 | partially | Attributes are right; the cookie is *named by supabase-js*, not by `sessionCookieName()`; `session.ts` lists 7 Clerk cookies without calling two of them "session" cookies |
| C5 | confirmed (design wording wrong) | All three parts hold. But Trialing and Resumed are never dispatched, so the "activation and resume" branch runs only for Activated |
| C6 | confirmed | `LimitsOverlay` saves `CatalogueContext` then routes; `LockedGroup` always renders it when locked |
| C7 | confirmed (nuance) | The default client uses `cache: "no-store"`; `get()` tries local copies before fetching |
| C8 | confirmed (nuances) | Named-field applier; `z.object` strips unknown keys; a second producer (`updateLegal`) exists |
| C9 | partially | `origin/main` = `ef02164` lacks `e87e1f2`, and live PROD HTML lacks a test-only marker. The exact deployed commit is unverifiable (Vercel 403) |

---

## C1: preview vs published mount point: confirmed

**Facts**
- `src/app/catalogues/[name]/page.tsx:143-144` renders `<Catalogue item={item} type="view" />` when `item.status === "active"`. It is ISR: `revalidate = 86400` at `:11`.
- `src/app/catalogues/[name]/preview/page.tsx:36` renders the identical `<Catalogue item={result.data as CatalogueType} type="view" />`. It is `force-dynamic` (`:10`) and its identity check is at `:26-28`.
- `find src/app/catalogues -type f` returns exactly:
  - `[name]/error.tsx`
  - `[name]/page.tsx`
  - `[name]/preview/page.tsx`
- There is no `layout.tsx` or `template.tsx` anywhere under `src/app/catalogues`.
- App layouts are `src/app/layout.tsx` and the `(site)` group only.

**Inference.** A `[name]/layout.tsx` would wrap `/preview` too, and so would anything inside `Catalogue`. A sibling in the active branch of `page.tsx` is the right mount.

## C2: column-level grants: confirmed

**Facts**
- `supabase/migrations/20260921181104_app_role_grants_policies.sql:54` grants table-level `select, insert, delete` to `app_user`.
- `:55-57` grants `update (logo, heading, status, language, currency, business_type, content, legal, appearance, contact, header, footer, partners, metadata, tags, updated_at)` to `app_user`.
- `:58-60` grants column-level `select (...)` to `app_public`, without the owner column.
- `20260929120000_schema_consistency.sql:70` renames `created_by` to `user_id`. Column privileges follow the column.
- No later migration touches catalogue grants (grep).
- There is no default privilege that would auto-grant a new column. The only default-privilege statements revoke (`20260917133921_perimeter_close.sql:30-31`) or are legacy.

**TEST (`information_schema.role_table_grants` + `column_privileges`, today)**
- `app_user`: table-level DELETE, INSERT and SELECT.
- `app_user`: column-level UPDATE on appearance, business_type, contact, content, currency, footer, header, heading, language, legal, logo, metadata, partners, status, tags and updated_at. No id, name, source, user_id or created_at.
- `app_public`: column-level SELECT on every column except `user_id`. Nothing table-level.
- So a new `integrations` column is automatically covered by `app_user` SELECT and INSERT (table-level), and is NOT covered by `app_user` UPDATE or `app_public` SELECT. Both grants in §2.1 are needed.

**Correction to the "why it matters" text.** It is slightly overstated.
- Without `update (integrations)`, only the new integrations action fails with 42501. Builder saves go to Redis, and publish never sets the column.
- The webhook clearing runs under `asAdmin` (postgres) and needs no grant (`src/utils/paddle/process-webhook.ts:89`).
- Without `select (integrations)`, only `getPublicCatalogue` fails, because it selects `PUBLIC_CATALOGUE_COLUMNS` (`src/lib/catalogue/public.ts:23-31`). That is every catalogue page body.
- `listPublicCatalogueNames` (`:17-21`) and `getPublicCatalogueMeta` (`:35-48`) select fixed subsets and would keep working.

## C3: `pickEditable` is the only client-to-column path: confirmed (wording nuance)

**Facts**
- `src/utils/db/columns.ts:38-53` defines `CATALOGUE_EDITABLE_FIELDS`. `:58-66` defines `pickEditable`, which copies only those keys when present and defined.
- Its call sites (grep):
  - create: `src/actions/catalogue.ts:277-289`, `pickEditable(shaped)`;
  - publish: `:437-449`, `pickEditable(shaped)` plus server-set `status` and `updatedAt`;
  - duplicate: `:201-204`.
- For duplicate, the source is the **stored DB row** (`:186-190`), not a client payload. So "from the client payload" is inaccurate for duplicate, though the effect is the same: a duplicate gets the column default `{}`.
- `applyPlanToCatalogue` (`src/lib/entitlements/catalogue.ts:13-28`) only rewrites `header` and `footer`, so it cannot add keys.
- The only other `catalogues` writes in `src/` are:
  - the status flips (`src/actions/catalogue.ts:145-162`);
  - the webhook's `applyPlanDowngrade` raw SQL (`src/lib/entitlements/catalogue.ts:42-75`).
  - Neither touches arbitrary keys.
- `updateCatalogue` (`:319-366`) writes Redis only (`writeOwnedDraft`, `src/lib/catalogue/draft-cache.ts:75-82`). A forged `integrations` there would reach the draft, never the row. The design's strip-on-write and row-wins-on-read (`:61-71`) handle that.

## C4: session cookies: partially

**Facts that hold**
- `src/lib/auth/cookie-options.ts:14-21`: `path: "/"`, `sameSite: "lax"`, `secure` only in production, and `maxAge: 400 days`. No `httpOnly`.
- The comment at `:8-10` says it is deliberately not httpOnly.
- `@supabase/ssr` 0.12.7 defaults to `httpOnly: false` (`node_modules/@supabase/ssr/dist/main/utils/constants.js:4-11`).

**Correction: naming**
- `COOKIE_OPTIONS` has no `name`. `@supabase/ssr` only overrides the storage key when `cookieOptions.name` is set (`createBrowserClient.js:41-42`, `createServerClient.js:33-34`).
- So the real cookie name is supabase-js's default `sb-${hostname.split(".")[0]}-auth-token` (`node_modules/@supabase/supabase-js/dist/index.mjs:651`, v2.116.0).
- `sessionCookieName()` (`cookie-options.ts:24-33`) **mirrors** that derivation. Today its only caller is `dropDuplicateSessionCookies` (`src/utils/supabase/session.ts:112`).
- The `sb-auth-token` fallback is only its `catch` branch for an unparsable URL. In that case no Supabase client can be built, so no real cookie carries that name. Matching it in the guard is harmless, but it is not a real cookie name.
- Large sessions are chunked as `<name>.0`, `<name>.1`; the design's guard handles that.

**Correction: Clerk**
- `src/utils/supabase/session.ts:8-16` lists seven "Clerk's cookies": `__session`, `__client_uat`, `__refresh`, `__clerk_db_jwt`, `__clerk_handshake`, `__clerk_handshake_nonce` and `__clerk_redirect_count`. It does not classify any of them as session cookies.
- Clerk's own constants define `Session: "__session"`, `Refresh: "__refresh"` and `ClientUat: "__client_uat"` (`node_modules/@clerk/backend/dist/constants.d.ts:19-21`).
- The refresh token is read from a suffixed cookie (`chunk-Q7SUSUFL.mjs:536`, `getSuffixedCookie(constants.Cookies.Refresh)`).
- Clerk documents `__session` as not HttpOnly ([Clerk, How Clerk works](https://clerk.com/docs/guides/how-clerk-works/overview), via search excerpt (snippet)). Its cookie page lists `__session` and `__client_uat` as first party ([Clerk cookies](https://clerk.com/docs/guides/how-clerk-works/cookies), fetched today).
- Clerk is still the **default** provider: `src/lib/auth/provider.ts:6-7` uses Supabase only when `NEXT_PUBLIC_AUTH_PROVIDER === "supabase"`. `src/middleware.ts:62-64` routes everything else through `clerkMiddleware`. So Clerk cookies are what PROD browsers hold until the cutover.

**Inference.** The guard deliberately ignores `__client_uat`. Clerk's `__session` is set client-side by clerk-js (Clerk docs above), so a signed-in browser may briefly lack `__session` before clerk-js refreshes it. The watcher then reloads, but only browsers with `cookieStore` change events catch it immediately. Treat `__client_uat` with a non-zero value as a session signal too, or accept the gap.

## C5: Paddle webhook: confirmed, but the design's wording needs a fix

**Facts**
- `src/utils/paddle/process-webhook.ts:131-155` is the activation branch. Its only DB write is `users.plan_id` (`:139-147`).
- It also returns the other active subscription IDs (`:149-154`), which are cancelled after commit (`:207-211`). So "only sets plan_id" is true for DB writes, not for side effects.
- `SubscriptionUpdated` reaches `handleSubscriptionData` (`:61`). It falls through to `return { kind: "stored" }` (`:189`), so it never changes `plan_id`.
- After a downgrade, only `outcome.deactivated` names are revalidated (`:213-215`).
- **Not in the claim, and important.** `processEvent`'s switch routes only Created, Updated, Activated and Canceled (`:59-65`). `SubscriptionTrialing` and `SubscriptionResumed` fall to `default` ("Unhandled", `:72-73`). So the Trialing/Resumed condition at `:133-134` is dead code.
  - The design's "activation and resume (`:131-155`)" is effectively **activation only**.
- `src/actions/paddle.ts` exports only `cancelSubscription`, so plan changes arrive as a new checkout (Activated) plus cancellation of the old subscription. That old cancellation hits `:158-159` (`active.length > 0`, stored, no downgrade).
  - So a paid-to-paid downgrade does go through the activation branch, and clearing there is needed if the founder picks Pro+.
- **Pre-existing.** `applyPlanDowngrade` also strips branding and newsletter (`src/lib/entitlements/catalogue.ts:60-75`), and those catalogues are not revalidated either.
- **The design omits.** The `activated` outcome variant (`process-webhook.ts:43`) must be extended to carry the cleared names, so they can be revalidated after commit.
- The backend worker never changes `plan_id`. It only sets `status = 'inactive'` and revalidates (`quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:80-105`).

## C6: LimitsOverlay trap: confirmed

**Facts**
- `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:17` has `const { catalogue } = useCatalogueContext();`.
- `:26-36`: `handleUpgrade` calls `updateCatalogue(catalogue)` and calls `router.push("/pricing")` in `toast.promise`'s `finally`, so it routes after the save settles.
- `src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:35` has `{locked && <LimitsOverlay ... />}` unconditionally.
- `CatalogueContextProvider` is mounted for every route (`src/components/general/PageWrapperClient.tsx:17`) and starts from `defaultCatalogueData` (`src/context/CatalogueContext.tsx:68-74`).

**Inference.** On `/admin/<slug>/analytics`, the button would either fail (default `name: ""` is not owned, giving "Unauthorized") or write a stale draft of the last catalogue opened in the builder into Redis. The plain locked state is correct.

## C7: `@vercel/global-config` default `no-store`: confirmed (nuance)

**Facts (v1.5.1, `node_modules/@vercel/global-config/package.json:3`)**
- `dist/index.js:196-200`: `createClient2(connectionString, options = { staleIfError: 604800, cache: "no-store" })`.
- `:220`: `const fetchCache = options.cache || "no-store"`.
- The default client is built with no options (`:709-711`), and `get` uses it (`:714-717`).
- `src/lib/ops/flags.ts:1` imports `get` from it.

**Nuance**
- `get()` first tries `getLocalEdgeConfig` (`:234-243`):
  - a private Edge Config on `globalThis` (`:506-520`);
  - or `/opt/edge-config/<id>.json`, only when `AWS_LAMBDA_FUNCTION_NAME` is set (`:490-505`).
- It fetches with `cache: fetchCache` (`:245-252`, `:610-612`) only when neither exists.
- **Inference.** Whether a read inside the ISR page triggers a `no-store` fetch therefore differs between `next build` and runtime. That supports the design's "build check first" rule more than a flat "rules out". The design's env-var choice stands.

## C8: AI agent cannot reach a new column: confirmed (nuances)

**Facts**
- `src/agent/tools/general.ts:8-49` is a plain `z.object` (zod `^3.25.76`, `package.json:89`).
  - It strips unknown keys rather than rejecting them (it is not `.strict()`).
  - The AI SDK passes the parsed value to `execute` (`:56-58`).
- **A second producer of `update_catalogue`.** `updateLegal` (`src/agent/tools/navigation.ts:81-104` schema, `:123-129` tool) sends `{ legal: fields }` with a closed `legalFieldsSchema`.
- The applier copies named fields only (`src/lib/catalogue/operations.ts:494-526`): heading, currency, language, businessType, logo, metadata, contact and legal. It merges them with `next = { ...next, ...patch }` (`:532`). The other catalogue-level ops (`:537-668`) touch only appearance, header and footer.
- `snapshot()` (`src/agent/session.ts:375-419`) prints named fields only.
- Agent operations are "Replayed against the builder draft" (`src/types/ai.ts:190`). So they reach the DB only through `publishCatalogue`'s `pickEditable`, which is the real barrier.
- The prompt line already exists at `src/agent/instructions.ts:73` ("Never copy markup, scripts, tracking snippets…"). The design's new line belongs in `settingsRules` (`:49-53`).

**Inference: a design consequence.** The agent can set `legal.legalName` from scraped or OCR text. The design uses that value as the consent notice's controller name and as the render gate. It only goes live after the owner publishes, but it means the controller identity in the notice can be AI-written.

## C9: PROD runs `main`, not `test`: partially

**Facts**
- `git ls-remote origin` today: `refs/heads/main` = `ef021648e4c1…`, the same as local `origin/main`, "Merge pull request #55", 2026-05-09.
- `git merge-base --is-ancestor e87e1f2 origin/main` fails. `e87e1f2` (2026-09-15, "run custom code in a sandboxed frame") is an ancestor of `HEAD`.
- `main:components/catalogue/sections/CustomCode.tsx:36-52` and `main:components/catalogue/sections/EmbeddingBlock.tsx` both re-create `<script>` elements first-party (`querySelectorAll("script")` then `document.createElement("script")`).
- `main` has no `utils/db`, no `lib/auth/cookie-options` and no `supabase/migrations` (`git ls-tree`), so the new data layer exists only on `test`.
- **Live PROD.** `https://www.quicktalog.app/catalogues/montre-shop` was fetched today with `maxAge: 0`: status 200, title "Montre Shop | Quicktalog".
  - It contains `GTM-W9RHLVK6`, `clerk.browser` and Clarity.
  - It contains **no** `catalogue-root`, `allow-scripts` or `srcdoc`.
  - The test build always renders `className="catalogue-root …"` on the catalogue root (`src/components/catalogue/view/Catalogue.tsx:186`), and that string does not exist on `origin/main` (`git grep`).
  - So PROD is not serving the `test` code.

**Not verified**
- The exact production deployment commit. Vercel `list_deployments` for project `quicktalog` returned `403 forbidden` (scope `quicktalogs-projects`).
- "Matching `ef02164`" is therefore inferred from the branch head plus the HTML marker, not read from Vercel.

**Inference.** Owners' pasted scripts still run first-party on PROD and stop on the test-to-main release. This holds as stated.

---

## Files the design creates or changes

**New files (correctly absent today).**
- `src/lib/tracking/*` (new domain folder, which fits code-conventions "lib/<domain>/")
- `src/lib/catalogue/integrations.ts`, `src/lib/entitlements/integrations.ts`
- `src/actions/integrations.ts`, `src/actions/catalogue-consent.ts`
- `src/context/CatalogueEventsContext.tsx`, `src/hooks/useCatalogueEvents.ts`
- `src/components/catalogue/tracking/*`, `src/components/general/QuicktalogSiteTags.tsx`
- `src/constants/tracking-notice.ts`, `src/content/docs/connect-google-analytics.tsx`
- `quicktalog-packages/src/constants/integrations.ts`

**Existing files: all present, with anchors checked.**
- `src/app/catalogues/[name]/page.tsx:143-144`
- `src/utils/db/columns.ts:10-66`
- `src/lib/catalogue/draft-cache.ts:26-31`, `:61-82`
- `src/lib/rate-limit.ts:8-19` (no `integrations` rule yet; `RateLimitRule` is a key union, so the rule must be added)
- `src/actions/catalogue.ts:145-152`, `:437-445`
- `src/utils/paddle/process-webhook.ts`
- `src/app/admin/[name]/analytics/page.tsx:19`, `:29-31` (uses `requireUser`, not `getVerifiedIdentity`)
- `src/components/catalogue/cards/index.tsx` (`"Free"` at `:69-70`; modal open at `:99`)
- `src/components/catalogue/view/CatalogueFooter.tsx:50-53`
- `src/components/catalogue/view/CatalogueContent.tsx:88-95`
- `src/app/layout.tsx:46-49`, `src/components/general/ClarityScript.tsx` (already `"use client"`)
- `src/components/general/CookieBanner.tsx:28-37`, `:65`
- `supabase/tests/database/10_catalogues.test.sql:24` (`plan(20)`)
- `src/utils/db/index.ts:26` (exports `pgError` and `Tx`), `src/utils/db/errors.ts:7-32` (`constraint` from `constraint_name`)
- `src/lib/http/client-ip.ts:10` (`clientIp`)
- package `src/types/catalogue.ts:15-29`, `src/types/functions.ts:1-3`, `src/constants/catalogue.ts:3`, `src/types/general.ts:25-46` (`analytics: string` at `:39`)
- package `pricing.ts`: six tiers, `name:` at `:6/39/71/103/135/167`; Basic `branding: true` at `:56`
- docs and skills paths listed in §13.5

**Gaps**
1. `quicktalog-packages/src/constants/index.ts` exports only `general`, `pricing` and `catalogue`. The new `integrations.ts` must be added there, or `GA4_MEASUREMENT_ID` is not importable from `@quicktalog/common`. This is not in Appendix A.
2. `process-webhook.ts:40-48`: the `SubscriptionOutcome` `activated` variant needs the cleared names.

## Project rules the design may break

1. **CLAUDE.md, "Docs and plans".** The plan folder has no `PLAN.md` with a status line, and `.claude/plans/README.md` does not list it. The other active plans have one.
2. **server-action-and-route skill, "Return-shape conventions".**
   - `IntegrationsResult` is a union of literal shapes.
   - The skill says to use `{ success: boolean; data?: T; error?: string }`, because `strict: false` (`tsconfig.json:7`) stops literal unions narrowing at the call site.
3. **server-action-and-route skill, step 7** ("ALWAYS capture + log in the catch"). The 23514 branch returns without Sentry. That deviation is deliberate and defensible, but the skill update in §13.5 should record it.
4. **CLAUDE.md, "Every server action … checks identity itself".**
   - `recordCatalogueConsent` is an unauthenticated public action. There is precedent: `newsletterSignup`, `src/actions/newsletter.ts:26-57`.
   - Side effects of being a server action:
     - maintenance mode 503s every server action (`src/middleware.ts:49-60`);
     - on the Supabase provider every action runs `updateSession` (`:67-71`), which is an auth call per visitor choice.
5. **CLAUDE.md, "Code … link to docs/, not to plans".** The design's code comments point at plan sections ("section 15, R1 item b", "section 9", "section 5.6", "Phase 1b").
6. **code-conventions skill, "copy that isn't component logic lives in `src/constants/`".** `src/lib/tracking/messages.ts` holds user-facing copy. Move it next to `tracking-notice.ts` in `src/constants/`.
7. **CLAUDE.md, "Public pages and ISR never read cookies or user identity".** The browser-side `document.cookie` presence check on the public page needs the founder's reading, as the design already says. The server and ISR side is clean: the env read and props are catalogue-independent.

## Other issues

- **Wording to fix in the design** (§3.6, §15 R8):
  - The design says "activation and resume"; it is Activated only (`process-webhook.ts:59-65`, `:72-73`).
  - Revalidation should cover all names touched by the downgrade, including branding and newsletter removal (`src/lib/entitlements/catalogue.ts:60-75`), not only the cleared ones.
- **Verification base drift.** Remote `test` is `ade76b0`, but the design was verified on `d785bb8` (not fetched locally). Re-check the anchors after a fetch.
- **Unverified.** The Vercel project `quicktalog-admin` exists (`list_projects`). If it consumes `@quicktalog/common`, a new required `PricingPlan.features.integrations` key could break it on the next package bump. It is not in the three repos checked.
- **Inference from the design's own code (§3.1).** `idFromPaste` on a snippet containing only a `GT-` ID falls through to `checkGa4Id(sample)`. That returns `invalid` (length > 32) instead of the `google_tag` guidance.
