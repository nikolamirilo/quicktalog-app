# Fast navigation: findings

Investigation of 2026-10-31 into "clicking Dashboard / Log In / Start free is very slow and nothing shows that anything is happening". Evidence is code (`path:line`), the Vercel project settings, and Sentry traces from the deployed app (tracing is sampled at 10 %, so counts are a tenth of real traffic). No PROD data was queried; the PROD numbers come from Sentry.

## Baseline (Sentry, last 30 days, server time only)

| Transaction | Env | p50 | p95 |
|---|---|---|---|
| `GET /admin/dashboard` | production | 1.75 s | 4.19 s |
| `GET /admin/dashboard` | preview (TEST) | 1.26-1.37 s | 3.5-4.5 s |
| `POST /` (user-data server action fired by every page load) | production | 2.15 s | 2.48 s |
| `POST /` | preview | 3.49 s | 3.56 s |
| `POST /admin/dashboard` (same action, on the dashboard) | production / preview | 2.13 s / 1.61 s | 4.0 s / 4.4 s |
| `GET /auth/consent` | preview | 2.92 s | 4.64 s |
| `GET /auth` (ISR, mostly cache hits) | production | 0.08 s | 2.19 s |

The browser waits longer than these numbers: they leave out the browser-to-server trip, middleware and downloading the page's scripts.

## F1. Nothing on screen shows that a navigation has started

- No progress bar, no `useLinkStatus`, and no `onNavigate` anywhere. Links are plain `next/link` (`src/components/navigation/NavLink.tsx:50`, `AuthLinks.tsx:145-181`, `UserMenu.tsx:88-94`, `general/SignupButton.tsx:24`).
- The App Router keeps the old page on screen until the next page's first payload arrives. Feedback appears only when a prefetched `loading.tsx` exists *and* the prefetch has finished. Only `admin/dashboard` and `admin/[name]` have one.
- `src/app/loading.tsx` is a full-screen spinner (`components/navigation/Loader.tsx:4`). When it does show, it covers the navbar.
- In `next dev`, links never prefetch and each route compiles on its first visit. Local testing is always slower than the deployed app and can't be used to measure this.

## F2. The server functions run in the US, the database in Ireland

- Vercel project `quicktalog`: `serverlessFunctionRegion: "iad1"` (Washington DC), `fluid: false`.
- TEST Supabase: `region: "eu-west-1"` (Ireland). **PROD region not checked** (needs the owner's go-ahead or a look at the dashboard).
- Every database statement crosses the Atlantic. A typical us-east-1 ↔ eu-west-1 round trip is ~70 ms (published AWS figure, not measured here).
- Each `withUser` block is a transaction (`src/utils/db/rls.ts:26`): `BEGIN`, the `set_config` statement, its queries, then `COMMIT`. Every step waits for the one before it.
- The critical path of one dashboard render:
  - the admin layout's consent check (`src/app/admin/layout.tsx:23-27`, `lib/auth/consent.ts:40`): 4 round trips;
  - then the overview transaction (`lib/dashboard/overview.ts:86`): 7 round trips, in parallel with `getMyUserData`'s 5.
  - That's **about 11 sequential round trips, ~0.8 s** before any cold-start, connection-setup or auth-key fetch.
- With Fluid off, instances are reused less, so more requests pay a cold start: Sentry's `resolve page components` span has p95 1.09 s. They also lose the warm database pool (`utils/db/pool.ts:36`, max 3) and the cached signing keys. On TEST, server-side `jwks.json` fetches have p50 290 ms and p95 1.21 s.
- Sentry does not see database time: postgres-js is not instrumented, so it is folded into `render route`.

## F3. PROD checks every session over the network; TEST does not

- `identityFromSupabaseAuth` calls `auth.getClaims()` (`src/lib/auth/identity.ts:40`). With asymmetric signing keys this verifies the session locally. With the legacy shared secret (HS256) it falls back to `getUser()`, a call to the auth server (`node_modules/@supabase/auth-js/dist/module/GoTrueClient.js:5528-5536`).
- Sentry, last 7 days, http.client spans inside middleware:
  - `GET https://uhfbapjuzvlyzyodxhqn.supabase.co/auth/v1/user` (PROD): 610 spans, p50 299 ms, p95 844 ms.
  - `GET https://imhinsgyzzyblghwnedk.supabase.co/auth/v1/.well-known/jwks.json` (TEST): 70 spans, p50 101 ms.
- The same PROD call appears on the server inside server actions: `POST /` → `/auth/v1/user`, p50 426 ms.
- Middleware runs it on every `/admin/*` and `/auth/*` request, every prefetch of them, and every server action (`src/middleware.ts:12-13, 39-46`). The server runs it again for each request (`getVerifiedIdentity`, deduplicated only within one request).

## F4. Every signed-in page load renders the page twice

- `SupabaseAuthProvider` starts with `seenUserId = null` (`src/components/auth/session/SupabaseAuthProvider.tsx:46`) and calls `router.refresh()` whenever an auth event names a different user (`:66-71`).
- The browser client has no lock (`GoTrueClient.js:154`), so `INITIAL_SESSION` is read from the cookie and delivered before `getUser()` (`:51`) gets its network answer. The first event therefore always looks like a change, and the page refreshes.
- On the dashboard that is a second full server render: Sentry traces `68d0a384ec4e4960b6ba582be51db12f` (1.37 s, then 1.41 s, one second apart) and `c07e037cc5344aa2b0e00b7385a6a2ee` (4.46 s, then 3.50 s).

## F5. A user-data server action on every page load, which makes a click cost an extra refresh

- `UserContextProvider` (mounted for every page in `components/general/PageWrapperClient.tsx:16`) calls the `getUserData` server action as soon as auth is known (`src/context/UserContext.tsx:36, 45-49`). It needs the data for the cookie banner (`CookieBanner.tsx:22`), pricing and the admin screens. The dashboard and builder pages also load the same data on the server (`app/admin/dashboard/page.tsx:49`), so the dashboard gets it twice.
- Server actions share the router's queue. A click while one is in flight marks the action discarded **and sets `needsRefresh`**, so a full `router.refresh()` runs right after the navigation (`node_modules/next/dist/client/components/app-router-instance.js:131-146`). Clicking Dashboard during the first seconds after a page loads therefore renders the dashboard twice.
- Trace `23211a83e7164b08b3c3c4c17e1753af` (home page, 2026-10-30) shows the same page load doing all of this at once:
  - the dashboard prefetch: 3.10 s, including 680 ms of middleware with a 615 ms auth call;
  - the `POST /` user-data action: 3.12 s;
  - 63 script downloads, average 594 ms.

## F6. Work repeated on every call

- `getUserData` schedules `sendWelcomeEmailOnce` on every call (`src/actions/users.ts:24`). That's one more transaction (4 round trips) per page load, even though the row it has just read already says whether the email went out (`users.welcome_email_sent_at`).
- The navbar's auth corner is an invisible placeholder until `supabase.auth.getUser()` answers from the auth server (`AuthLinks.tsx:145-148`, `SupabaseAuthProvider.tsx:51`). For a signed-in user, the Dashboard link, and its prefetch, wait one network round trip after the page has rendered.

## Not a cause

- Fonts: the theme fonts are already not preloaded (`src/lib/fonts/index.ts:24-27`).
- The dashboard's own client code is split per tab (`components/dashboard/Dashboard.tsx:16-35`).
- Middleware's maintenance flag read (`middleware.ts:30`): sub-10 ms on most requests (`http.server.middleware` p50 8 ms when it makes no auth call).
- Bundle weight on the public site (63 scripts in one trace) is real but belongs to [codebase-cleanup](../2026-10-25-codebase-cleanup/PLAN.md).
