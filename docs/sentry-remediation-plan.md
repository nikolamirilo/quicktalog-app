# Sentry Remediation Plan — quicktalog / javascript-nextjs

Generated 2026-06-20. Covers all **24 unresolved** issues. Investigation only — no code changed yet.
Dashboard: https://quicktalog.sentry.io/issues/?project=javascript-nextjs&query=is%3Aunresolved

## ⚠️ Cross-cutting finding: deployed release is stale

Production runs release `ef021648e4c11ed20b2a94260513df2b156acc3f` (commit `ef02164`, 2026-05-09).
Fixes already on disk in commit `39c7a8b` ("addressed issues from sentry", 2026-05-19) were **never merged/deployed**
(`git merge-base --is-ancestor 39c7a8b ef02164` → false). Several `instrumentation-client.ts` noise filters also
postdate the deployed release.

**Action 0 (do first): ship the current branch to production.** This alone resolves -R and -N and activates the
existing filters for -9 / -D. Then re-triage what events still arrive on the new release before doing more work.

## Disposition summary

| # | Issue | Title (short) | Users/Events | Class | Disposition |
|---|---|---|---|---|---|
| 1 | -10 | Maximum update depth (catalogue) | 5 / 16 | Real bug | Fix render loop |
| 2 | -11 | Maximum update depth (catalogue) | 4 / 4 | Real bug | Same fix as -10 |
| 3 | -H | Maximum update depth (catalogue) | 3 / 4 | Real bug | Same fix as -10 |
| 4 | -6 | Hydration Error (homepage) | 8 / 62 | Real bug | Pin locale in toLocaleString |
| 5 | -19 | subscriptions.customer_id NOT NULL | 4 / 5 | Real bug | DB trigger guard |
| 6 | -R | Cannot read 'Checkout' (pricing) | 1 / 12 | Real bug | Already fixed on HEAD → deploy |
| 7 | -16 | Failed to load Paddle.js | 3 / 3 | Resilience | Add .catch to initializePaddle |
| 8 | -Q | Paddle.js not available | 1 / 2 | Resilience | Same fix as -16 |
| 9 | -N | ProcessWebhook FK violation | 5 / 7 | Real bug | Guard on HEAD → deploy + harden |
| 10 | -18 | Paddle webhook sig verify failed | 1 / 1 | Config | Fix preview env secret + 400/noise |
| 11 | -1A | N+1 API Call (dashboard) | 3 / 15 | Real bug (perf) | Stop per-row fetch |
| 12 | -B | Failed to fetch (server action) | 2 / 8 | Noise | Sentry filter |
| 13 | -17 | Failed to fetch (consent POST) | 1 / 1 | Noise | Don't capture aborts |
| 14 | -9 | Unexpected response from server | 1 / 11 | Noise | Already filtered → verify |
| 15 | -D | removeChild NotFoundError | 3 / 6 | External (translate) | Harden existing filter |
| 16 | -14 | Clerk failed to load script | 1 / 6 | External/transient | Filter + monitor |
| 17 | -13 | postMessage: Java object is gone | 4 / 6 | External (WebView) | Sentry filter |
| 18 | -15 | enableDidUserType…: Java gone | 5 / 5 | External (WebView) | Sentry filter |
| 19 | -X | window.__firefox__ / ethereum | 1 / 3 | External (injected) | Sentry filter |
| 20 | -Y | Can't find variable __firefox__ | 1 / 2 | External (injected) | Sentry filter |
| 21 | -1B | window.webkit.messageHandlers | 1 / 1 | External (WebView) | Sentry filter |
| 22 | -12 | NS_ERROR_FAILURE | 2 / 2 | External (Gecko) | Sentry filter |
| 23 | -M | <anonymous> (Paddle network_error) | 4 / 6 | Ours/benign | Tighten existing filter |
| 24 | -Z | Failed to load image: sunshine body.png | 1 / 2 | Real (low) | Don't capture validation errors |

Score: **6 real code bugs**, 2 already-fixed-pending-deploy, 1 perf bug, 1 config, **~14 noise/external** to filter.

---

## P0 — High impact

### -10 / -11 / -H — Catalogue infinite render loop  (same root cause)
**Root cause:** URL↔state sync cycle in `components/catalogue/view/CatalogueContent.tsx`.
- The back/forward sync effect (`CatalogueContent.tsx:71-76`) depends on the `searchParams` *object* (new ref every
  render) and calls `setQuery`, with `query` omitted from deps → stale closure keeps firing `setQuery`.
- Two expanded-reset effects (`:78-95` and a duplicate at `:185-199`) call `setExpandedSections` with a freshly-built
  object literal every run; the `:185-199` one re-runs on every `searchParams` change. React never bails out → commit loop.
- `framer-motion` `AnimatePresence` (`components/catalogue/sections/common/Items.tsx:60`) is the amplifier that trips
  "Maximum update depth exceeded" during commit. Introduced by `0d33e61`/`f2a1758` (in-catalogue search).

**Fix:**
1. Make the sync effect idempotent with a primitive dep + functional updater:
   ```js
   const urlQuery = searchParams.get("q") ?? "";
   useEffect(() => {
     setQuery((prev) => (prev === urlQuery ? prev : urlQuery)); // returning prev → React bails out
   }, [urlQuery]);
   ```
2. Delete the duplicate expanded effect at `:185-199` (`?expanded` is never set in the view path).
3. Optional: in `handleQueryChange` (`:62-69`) skip `router.replace` when the query string is unchanged.

**Effort:** Low (one file). **Verify:** type fast in search on a multi-category public catalogue; `console.count` settles
instead of climbing; back/forward + clear-X still work. Tag commit `Fixes JAVASCRIPT-NEXTJS-10/-11/-H`.

### -6 — Hydration error on homepage  (62 events / 8 users — highest volume)
**Root cause:** `components/home/Pricing/PricingColumn.tsx:59` calls `traffic_limit.toLocaleString()` with **no locale**.
Server (en-US) renders `"15,000"`; a `tr-TR` client (exact locale in the event) renders `"15.000"` → text-node mismatch.
Only unguarded locale/date/random render on the homepage.

**Fix (one line):** pin the locale — `traffic_limit.toLocaleString("en-US")` (repo precedent: `helpers/client.ts:87`).
Apply the same to sibling unguarded calls in dashboard/analytics (`MonthlyUsage.tsx`, `CatalogueAnalytics.tsx`,
`LimitUpgradeComparison.tsx:163`) — not this issue but same latent bug. **Effort:** Low.

### -19 — subscriptions.customer_id NOT NULL violation (POST /api/clerk)
**Root cause:** Clerk `user.created` upserts a `users` row with `customer_id = null`
(`lib/users/syncFromClerk.ts:107,126,194`; throw at `:155-157` via upsert `:142`, from `app/api/clerk/route.ts:67/71`).
The error names relation `subscriptions`, not `users` — so a **production DB trigger on `public.users`** cascades an
insert into `subscriptions` using `NEW.customer_id`, and `subscriptions.customer_id` is `NOT NULL`
(schema: `@quicktalog/common .../migrations/schema.js:33-43`). Subscriptions should only be written by the Paddle webhook
(`utils/paddle/process-webhook.ts:84-92`), which already guards on a linked user.

**Fix (DB, the real culprit):** guard or drop the `users→subscriptions` trigger:
```sql
IF NEW.customer_id IS NOT NULL THEN
  INSERT INTO subscriptions (customer_id, ...) VALUES (NEW.customer_id, ...);
END IF;
RETURN NEW;
```
Confirm the trigger name first via `pg_get_triggerdef` on `public.users`. **Do not** make `customer_id` nullable —
it's the join key throughout `process-webhook.ts`. **Effort:** Low. (Could not introspect prod DB — the connected
Supabase MCP project is an unrelated database; verify against the real project.)

---

## P1 — Paddle + dashboard

### -R — Cannot read 'Checkout' (pricing)  — ALREADY FIXED ON HEAD
Guard exists at `components/home/Pricing/PricingColumn.tsx:136-139` (`if (!paddle?.Checkout) { … return }`).
**Action: deploy.** Optional polish: disable the CTA / show spinner while `paddle === undefined`.

### -16 / -Q — Paddle.js failed to load / not available
**Root cause:** `initializePaddle({...}).then(...)` has **no `.catch()`** at three sites
(`components/home/Pricing/Pricing.tsx:53`, `components/dashboard/Subscription.tsx:24`,
`components/modals/UpgradePlanModal.tsx:39`). When the CDN script is blocked (adblock/network/region), the rejection is
unhandled and Sentry records it.
**Fix:** add `.catch()` to all three; down-level to `warning` or don't report (client-environment noise). Combined with
the -R guard the pricing page degrades gracefully. **Effort:** Low.

### -N — Paddle webhook FK violation (subscriptions_customer_id_fkey)  — GUARD ON HEAD
`subscription.*` arrives for a `customer_id` with no `users` row (customer webhook late/missing). Guard already on
HEAD at `utils/paddle/process-webhook.ts:70-82` (look up user, `return` if unlinked). **Action: deploy.**
**Caveat:** the early `return` **silently drops the subscription**. Harden: return non-2xx so Paddle retries until the
user exists, OR fetch the customer email from Paddle and create/link the `users` row before upsert. **Effort:** Low to
deploy; Medium to harden.

### -18 — Paddle webhook signature verification failed
**Root cause:** `paddle.webhooks.unmarshal(...)` at `app/api/paddle/route.ts:22` threw HMAC failure. Single event, on
**`vercel-preview`** (`test.quicktalog.app`), not prod. Raw body is read correctly (`request.text()` at `:10`) — not the
raw-vs-parsed bug. Likely the preview env's `PADDLE_NOTIFICATION_WEBHOOK_SECRET` doesn't match the destination, or an
internet probe hitting the public URL.
**Fix:** mainly config — set the matching secret on preview; don't cross sandbox/prod secrets. Code polish: return `400`
(not `500`) on verify failure and don't `captureException` (scanner noise); guard the empty-string secret fallback at `:11`.
**Effort:** Low.

### -1A — N+1 API Call on /admin/dashboard
**Root cause:** each `DashboardItem` → `ItemDropdownMenu` calls `useCatalogueName({type:"create"})`, whose mount effect
(`hooks/useCatalogueName.ts:109-112`) fires `GET /api/items?type=name` (uncached) — once per catalogue. The names are
**already in memory** (`useDashboardData` → `catalogues`).
**Fix:** drop the mount-time fetch; either pass names down from already-loaded `catalogues`, or fetch lazily only when the
Duplicate modal opens (`ItemDropdownMenu.tsx:168-174` already calls `refetchNames()`). **Effort:** Low.

---

## P2 — Noise & external (filter, don't chase)

All filtering lives in **`instrumentation-client.ts`** (the project's `@sentry/nextjs` client init; there is no
`sentry.client.config.*`). Existing `ignoreErrors` at lines 44-49, `beforeSend` at 55-101.

### -D — removeChild NotFoundError (browser auto-translate)
100% React-internal stack, zero first-party frames, `es-ES` client on a Spanish catalogue → Chrome auto-translate
reparents text nodes, React's `removeChild` hits a stale node. Already known (`instrumentation-client.ts:62-69`,
`app/catalogues/[name]/error.tsx`), **but the filter misses the `onerror`-mechanism variant** (empty/non-react-dom stack).
**Fix:** loosen the `beforeSend` guard to match on message alone, and/or add to `ignoreErrors`:
`"The node to be removed is not a child of this node"`, `"The node before which the new node is to be inserted is not a child of this node"`.

### -13 / -15 / -X / -Y / -1B / -12 — WebView / injected-script noise
External browser environments (Android WebView bridge `app://navigation_performance_logger_android`, iOS WKWebView
`window.webkit.messageHandlers`, Firefox-iOS `__firefox__`, injected `window.ethereum`, Gecko `NS_ERROR_FAILURE` from a
3rd-party `pagehide`). None are our code. **Fix — add to `instrumentation-client.ts`:**
```ts
// ignoreErrors additions:
"Java object is gone", /messageHandlers/, "__firefox__", /window\.ethereum/, "NS_ERROR_FAILURE",
// new denyUrls key in Sentry.init:
denyUrls: [/app:\/\/navigation_performance_logger_android/, /^app:\/\//],
```
Or set as Sentry Inbound Filters in the UI (keeps them out of quota with no deploy).

### -14 — Clerk failed to load clerk.browser.js
`clerk.quicktalog.app` is Clerk's managed custom-domain CDN (dashboard/DNS, not app code). Signal is 1 user / 6 events in
a 5-minute window, single browser → transient (network/blocker/CDN blip), not a misconfig. **Fix:** verify the domain is
healthy (CNAME/TLS/200), then filter `ignoreErrors: [/Failed to load Clerk/i, "failed_to_load_clerk_js"]` and monitor;
only escalate if volume climbs.

### -B / -17 / -9 — fetch/server-action noise
- **-B** "Failed to fetch" from Next's `server-action-reducer.ts:92` — aborted in-flight server action (navigation/offline).
  No first-party frame. Add a `beforeSend` branch dropping `Failed to fetch` when stack matches `/server-action-reducer/`.
- **-17** "Failed to fetch" is the consent POST (`utils/cookies.ts:95`); it's caught but **unconditionally**
  `captureException`-ed at `cookies.ts:104`. Fix: skip capture on abort/offline (`AbortError` / `!navigator.onLine` /
  "Failed to fetch") for this best-effort write.
- **-9** "An unexpected response was received from the server." — Next framework (`server-action-reducer.ts:172-174`) when
  a server action returns a non-RSC response (auth expiry, oversized image upload, gateway HTML). **Already filtered**
  (`instrumentation-client.ts:47` + `beforeSend` `:92-99`). Verify the filter catches minified prod stacks on the new
  release; optionally harden the editor save action to return JSON/redirect on auth-expiry / large payloads.

### -M — Paddle network_error (`<anonymous>`)
Ours but benign: `hooks/usePaddlePrices.ts:53` captures Paddle `PricePreview.failed` network_error. `beforeSend`
(`:71-76`) tries to drop `err.error.type === "network_error"` but the payload nests it as `__serialized__.error.type`, so
it may miss. **Fix:** add `"PricePreview.failed"` / `/Network error encountered when calling Paddle/` to `ignoreErrors`.

### -Z — Failed to load image: sunshine body.png
Genuinely ours but low severity (1 user / 2). `helpers/imageProcessing.ts:13-16` `loadImage` rejects on `img.onerror`
because the browser couldn't **decode** the file bytes (the filename space is incidental — it's a blob URL). The dropzone
only checks `file.type.startsWith("image/")` (`ImageDropzone.tsx:34`) and advertises SVG (`:176`), but the canvas pipeline
can't decode SVG/corrupt files. **Fix:** (1) don't `Sentry.captureException` expected validation failures
(`ImageDropzone.tsx:51-52`) — surface to the user only; (2) reject `image/svg+xml` before `processImage`, or drop SVG from
advertised formats; (3) include `file.type`/size in the thrown error.

---

## Bonus (not in the 24, found en route)
`app/api/items/route.ts` POST (~lines 39-40) returns `` `/catalogues/${name}` `` referencing an undefined `name` instead
of `slug` — latent bug, worth a separate fix.

## Suggested execution order
1. **Deploy current branch** (resolves -R, -N; activates -9/-D filters). Re-triage on the new release.
2. P0 code fixes: -10/-11/-H (one file), -6 (one line), -19 (DB trigger).
3. P1: Paddle `.catch()` (-16/-Q), harden -N retry, -1A per-row fetch, -18 env secret.
4. P2: one `instrumentation-client.ts` PR for all noise filters (-D, -13/-15/-X/-Y/-1B/-12, -14, -B, -17, -M) + -Z capture change.
