Status: proposed

Re-verified against the codebase on 2026-11-19: none of the ten tasks has been implemented, and every finding in [FINDINGS.md](FINDINGS.md) still holds. One decision changed - see D1: PROD's database is in Frankfurt, not Ireland, so the function region is `fra1`.

# Fast navigation with visible progress: implementation plan

**Goal:** A click on Dashboard, Log In, Start free or any other internal link shows feedback at once. For a signed-in user, the page it opens arrives in well under a second, instead of today's 1.3-4 s with nothing on screen.

**Architecture:** Three levers that can ship independently:

1. **Feedback:** a thin progress bar at the top of the window, plus a pending state on the link that was clicked. Both are driven by Next's own navigation state.
2. **Latency:** run the server functions in the same AWS region as the database, turn on Fluid compute, and let PROD verify sessions locally like TEST already does.
3. **Duplicate work:**
   - stop the auth provider's refresh on every page load;
   - move the per-page user-data read off server actions, so a click no longer queues an extra full render behind it;
   - skip the welcome-email claim for accounts that already got it.

**Tech Stack:** Next.js 15.5 App Router (`next/link` `useLinkStatus`), React 19, SWR, Supabase Auth (`@supabase/ssr`), Drizzle via `utils/db`, Sentry, Vercel project settings.

**Spec:** Plain-language summary: [OVERVIEW.md](OVERVIEW.md). Evidence, baseline numbers and trace ids: [FINDINGS.md](FINDINGS.md).

## Decisions to confirm

| # | Decision | Why / cost |
|---|---|---|
| D1 | **Server functions move from `iad1` (Washington) to `fra1` (Frankfurt)**, the same region as the PROD database | One dashboard render makes about 11 database round trips one after another, but only one trip to the browser. Moving next to the database saves ~1 s per render. **Checked 2026-11-19: PROD is `eu-central-1` (Frankfurt), TEST is `eu-west-1` (Ireland)** - they do *not* share a region, so this plan's original `dub1` is wrong. `fra1` puts PROD functions beside the PROD database (~1-5 ms) and leaves preview/TEST on a Frankfurt-Ireland hop (~25 ms), still a third of today's Atlantic crossing. Cost: visitors in the Americas wait ~70-100 ms longer per uncached server request. Cached public pages (ISR catalogues, marketing pages) come from the CDN and are unaffected. One region applies to both preview and production, so PROD wins the tie |
| D2 | **Fluid compute on** | Instances get reused, so fewer requests pay a cold start (p95 1.1 s today), and the warm database pool and signing-key cache survive between requests. Cost: Vercel bills active CPU instead of wall-clock time; Hobby's included allowance still applies. The 60 s route budget we design for does not change |
| D3 | **PROD switches to asymmetric JWT signing keys**, rotated but with the legacy secret kept as "previously used", never revoked. The owner does this in the Supabase dashboard | Removes a 300-850 ms auth-server call from every protected request, every prefetch and every server action on PROD. TEST already works this way. Cost: the PROD edge functions and the backend worker must be checked first (task 9). Revoking the legacy secret would break the legacy `anon`/`service_role` keys, so it stays |
| D4 | **The progress bar is written in-house, with no new package** | About 80 lines, and the cleanup plan is removing libraries rather than adding them. `nextjs-toploader` and `@bprogress/next` do the same thing with a global click listener |
| D5 | **The root full-screen spinner goes away.** Pages without their own loading screen keep the current page on screen, with the bar, until the next one is ready | A blank screen with a spinner is worse than the current page plus a bar. Cost: a slow public page shows the old page a little longer instead of a spinner |
| D6 | **The navbar shows the signed-in state from the session cookie at once.** `getUser()` still runs in the background and switches the UI to signed-out if the auth server rejects the session | The Dashboard link (and its prefetch) no longer waits for a network round trip. Cost: a revoked session can show "Dashboard" for one round trip. Clicking it is still refused by middleware and the server, and no server decision reads this state |
| D7 | **The browser reads user data from a GET route through SWR**, not a server action | Server actions share the router's queue, and a click during one forces a full refresh after the navigation. A route handler is a plain fetch. Cost: one new route handler with its own identity check |

## Global Constraints

- Work on TEST (`imhinsgyzzyblghwnedk`). Touch PROD only when the owner asks explicitly; task 9 is a PROD change and is the owner's.
- No migration, no `drizzle-kit pull`, no `@quicktalog/common` release.
- **Measure on a deployed preview, or `next build && next start`, never on `next dev`.** Dev doesn't prefetch and compiles each route on its first visit.
- Every route handler checks identity itself (`requireIdentity`); data goes through `withUser`; no `withUser` block is held across `fetch`, Redis or `after`.
- Public pages and ISR read no cookies. The progress bar and pending states are client-only.
- Before finishing each code task: `npx tsc --noEmit`, `npm run check`, `npm test`.

## Expected results

| | Today | After (estimate) |
|---|---|---|
| Feedback after a click | none until the page arrives | bar within 150 ms; spinner in the clicked link |
| Dashboard server render, p50, TEST | 1.26 s | 0.3-0.5 s (tasks 2, 6, 7) |
| Server renders per full dashboard load | 3: render, refresh, user-data action | 1 |
| PROD auth check per protected request | 300-850 ms network call | local, ~1 ms, once the keys are cached (task 9) |

The "after" figures are estimates from the round-trip count in FINDINGS F2. Tasks 1 and 2 replace them with measurements.

## Tasks

### Task 1: Make database time visible in Sentry

**Files:** modify `src/utils/db/rls.ts`; test `tests/unit/lib/db/rls-span.test.ts`.

- Wrap the `getUserDb().transaction(...)` call in `inRole` in `Sentry.startSpan({ name: role, op: "db.transaction" }, () => ...)`.
  - postgres-js is not auto-instrumented, so database time is currently invisible inside `render route`.
- The span records only the role. No SQL and no user id in its attributes.
- Check: a TEST dashboard trace shows `db.transaction` spans, and their sum matches the gap in `render route`.
- Do this first, so task 2 has a measured baseline.

### Task 2: Functions next to the database, Fluid on

**Pre-checks (all before changing anything):**

1. ~~PROD Supabase region.~~ Done 2026-11-19 from the project list (metadata only, no PROD data read): PROD `uhfbapjuzvlyzyodxhqn` is `eu-central-1`, TEST `imhinsgyzzyblghwnedk` is `eu-west-1`. Hence `fra1`, not `dub1`.
2. Upstash Redis region (Upstash console). If it is in `us-east-1`, move it, or add an `eu-central-1` read region, in the same change. Otherwise draft-cache calls become the new cross-region hop.
3. Nothing else the server calls on every request is US-only. Paddle, Resend, UploadThing and DeepSeek are per-action and not latency-critical.

**Change:** `vercel.json` gets `"regions": ["fra1"]` and `"fluid": true`, so the setting lives in code and is reviewed. The project setting in the Vercel dashboard must not contradict it. Redeploy the `test` preview.

**Check:**

- Sentry `GET /admin/dashboard` p50/p95 on preview before and after;
- the `db.transaction` spans from task 1;
- a dashboard response header `x-vercel-id` naming `fra1`.

**Rollback:** revert the `vercel.json` lines and redeploy.

### Task 3: Top-of-window progress bar

**Files:**

- create `src/lib/navigation/progress.ts`: a tiny store with `start()`, `done()` and `subscribe()`, no React;
- create `src/components/navigation/NavigationProgress.tsx`;
- modify `src/components/general/PageWrapperClient.tsx`: mount it inside `<Suspense fallback={null}>`, because it reads `useSearchParams`;
- modify the programmatic navigations so they call `start()` first: `src/hooks/useSignOut.ts:18`, `components/auth/session/SupabaseAuthProvider.tsx:87`, `components/auth/forms/SignInForm.tsx:54`, `components/auth/ConsentForm.tsx:55,71`, `components/auth/UpdatePasswordForm.tsx:45`, `components/auth/ConfirmContinue.tsx:121`;
- test `tests/unit/lib/navigation/progress.test.ts`.

**Behaviour:**

- A capture-phase `click` listener on `document` calls `start()` only when the pure helper `isClientNavigationClick(event, location)` is true:
  - primary button, and no meta, ctrl, shift or alt key;
  - the closest `<a href>` has no `target` other than `_self` and no `download`;
  - the link is same-origin;
  - `pathname + search` differs from the current location, so a hash-only link like `/#faq` and a link to the current page don't count.
- `done()` runs when `usePathname()` or `useSearchParams()` changes, on `popstate`, and after a 10 s safety timeout.
- The bar appears only after 150 ms, so prefetched navigations don't flash it. It creeps toward 90 %, then completes and fades.
- Styling: `fixed top-0 inset-x-0 z-[60] h-[3px] bg-product-primary`, `aria-hidden="true"`. With `prefers-reduced-motion`, a static bar replaces the creep animation.

**Tests:** `isClientNavigationClick` across every filter above. The store: `start` then `done` resets it; two `start`s need one `done`.

### Task 4: Pending state on the clicked link

**Files:**

- create `src/components/navigation/LinkPending.tsx`: a client component calling `useLinkStatus()` from `next/link`;
- modify `NavLink.tsx`, `AuthLinks.tsx` (Log In, Start free, Dashboard, all variants), `UserMenu.tsx` (Dashboard, Account), `general/SignupButton.tsx`, `general/GetStartedCTA.tsx`.

**Behaviour:**

- While pending, the link's icon swaps for a 14 px spinner. The swap is delayed 100 ms with CSS `animation-delay` from opacity 0, so instant navigations don't flicker.
- The label stays and the width doesn't change. Links without an icon (`GetStartedCTA`) get a trailing spinner slot of fixed width.
- `useLinkStatus` must be rendered inside the `<Link>`, which is why it is a child component and not a prop.

**Check:** on a throttled preview ("Fast 3G" in devtools), every listed link shows the spinner, and it disappears when the page changes.

### Task 5: Loading screens keep the frame

**Files:**

- delete `src/app/loading.tsx` (D5);
- create `src/app/admin/[name]/analytics/loading.tsx` and `src/app/admin/[name]/qr-editor/loading.tsx`: `AppShell` plus a skeleton shaped like each page, as in `admin/dashboard/loading.tsx`;
- keep `src/app/admin/[name]/loading.tsx` (full-screen) for the builder, which is full-screen itself.

**Check:**

- dashboard → analytics shows the navbar and skeleton, not a blank spinner;
- home → pricing keeps the home page with the bar until pricing renders.

### Task 6: No refresh on page load; the auth corner shows at once

**Files:** modify `src/components/auth/session/SupabaseAuthProvider.tsx`; test `tests/unit/components/supabaseAuthProvider.test.tsx`; update `tests/unit/components/authLinks.test.tsx` and `authNavigation.test.tsx` where they assume the placeholder waits for `getUser()`.

- Track a `baseline` ref. The first state seen, whichever arrives first of `INITIAL_SESSION` and `getUser()`, sets `seenUserId` and the UI state with **no** `router.refresh()`.
- Later events refresh only when the user id changes, as today.
- `INITIAL_SESSION` sets `user` and `isLoaded` from the cookie session, so the auth corner renders without waiting (D6).
- `getUser()` stays as the background check: if it finds no user while the state says signed in, the state goes to signed-out, and that counts as a change, so it refreshes.
- Keep the comment about not refreshing after a navigation; it still applies.

**Tests:** with a mocked browser client:

- `INITIAL_SESSION(A)` then `getUser → A`: no refresh;
- then `TOKEN_REFRESHED(A)`: no refresh;
- then `SIGNED_OUT`: one refresh;
- then `SIGNED_IN(B)`: one refresh;
- `INITIAL_SESSION(A)` then `getUser → null`: state signed-out, one refresh.

**Check:** Sentry shows one `GET /admin/dashboard` per full dashboard load, not two (compare with traces `68d0a384…` and `c07e037c…` in FINDINGS F4).

### Task 7: User data through a GET route and SWR

**Files:**

- create `src/app/api/dashboard/me/route.ts`. `/api/dashboard/*` is already a session path in `src/middleware.ts:12`.
- modify `src/context/UserContext.tsx`.
- create `src/components/dashboard/UserDataSeed.tsx`, and use it in `src/app/admin/dashboard/page.tsx` and `src/app/admin/[name]/builder/page.tsx`.
- test `tests/unit/api/dashboard-me.test.ts`, plus `tests/integration/auth/dashboard-me.test.ts` against TEST.

**Route.** `GET` follows the `server-action-and-route` skill:

- `requireIdentity()` → `getMyUserData(me)` → JSON;
- `401` when signed out, `500` with a Sentry capture on `!ok`;
- headers `Cache-Control: private, no-store`; `export const dynamic = "force-dynamic"`.
- No welcome email here; the dashboard page still triggers it (task 8).

**Context.**

- `useSWR(authUser ? "/api/dashboard/me" : null, fetcher, { revalidateOnFocus: false, revalidateIfStale: false })`.
- `refreshUserData` becomes `mutate()`.
- The public shape `{ userData, loading, refreshUserData }` stays, so the ten consumers (`grep -rln useUserContext src`) don't change.

**Seed.** `UserDataSeed` receives the server-loaded `userData` and calls `mutate("/api/dashboard/me", data, { revalidate: false })` in an effect. Child effects run before the provider's, so the dashboard and builder don't fetch what they already rendered.

**Tests:**

- route: 401 signed out; returns only the caller's row (RLS + owner predicate);
- context: no fetch while signed out; one fetch when signed in; no fetch when seeded.

**Check:** Sentry `POST /` and `POST /admin/dashboard` from page loads drop to ~0. A click during the first second of a page load causes no extra `GET` of the target page.

### Task 8: Skip the welcome-email claim when it was already sent

**Files:** modify `src/actions/users.ts:24`; test `tests/unit/server_actions/get-user-data.test.ts`.

- `if (!result.data.welcomeEmailSentAt) after(() => sendWelcomeEmailOnce(me));`
- The claim (`private.claim_welcome_email()`) stays the only "exactly once" guarantee. This only skips the transaction for accounts already stamped.

**Tests:** stamped → `after` not called; unstamped → called once.

### Task 9 (owner, PROD): Verify sessions locally on PROD

**Pre-checks:**

1. Download the four PROD edge functions (`supabase functions download <name> --project-ref uhfbapjuzvlyzyodxhqn --use-api`; see memory "edge functions are PROD-only"). Check how each verifies its caller (`verify_jwt`, the legacy secret, or the webhook secret).
2. Search `../quicktalog-backend` for any use of the JWT secret or the legacy `service_role` key.
3. Record which API keys PROD uses: the app uses the publishable and secret keys.

**Steps** (Supabase dashboard → Project Settings → JWT Keys):

1. Migrate the legacy secret.
2. Create an ECC (P-256) standby key.
3. Rotate it to current.
4. **Do not revoke** the legacy secret.

Existing sessions keep working until their next refresh, within the hour.

**Check:** in Sentry, PROD middleware spans `GET …/auth/v1/user` drop to ~0, replaced by occasional `jwks.json` fetches. PROD `GET /admin/dashboard` p50 falls.

### Task 10: Docs and skills

- Create `docs/architecture/navigation.md`. It covers:
  - how a click becomes a page: prefetch, `loading.tsx`, the progress bar, `LinkPending`;
  - why the browser never fetches data with a server action on mount;
  - why `next dev` can't be used to judge speed.
- Update `docs/guides/vercel-env.md`: the region and Fluid settings, and that the function region must follow the database region.
- Update `.claude/skills/code-conventions`:
  - internal links that can be slow render `LinkPending`;
  - programmatic navigations call `start()` from `lib/navigation/progress`;
  - client reads use GET routes with SWR, never a server action on mount.
- Update `.claude/skills/server-action-and-route` with the same rule about reads.

## Verification

- Sentry, before and after each of tasks 2, 6, 7 and 9 (links in FINDINGS):
  - p50/p95 of `GET /admin/dashboard`;
  - count of `POST /`;
  - count of PROD middleware `/auth/v1/user` spans.
- TEST preview checklist, signed in, desktop and phone, normal and "Fast 3G":
  - home → Dashboard (bar under 150 ms, spinner in the pill, skeleton, then data);
  - Log In and Start free from home;
  - sign in → dashboard; sign out → home;
  - dashboard → builder → back;
  - back/forward;
  - cmd-click a link (new tab, no stuck bar);
  - `/#faq` (no bar);
  - the link to the current page (no bar).
- `npx tsc --noEmit`, `npm run check`, `npm test`. Integration tests on TEST only.

## Considered and not doing

- **`prefetch={true}` on the Dashboard link.** It would run all the dashboard queries on every page view of every signed-in visitor, and the result would be up to 5 minutes stale. The loading-screen prefetch the link already does is enough once the server is fast.
- **Folding the consent check into the dashboard query.** After task 2 it costs a few milliseconds, and the layout is the right place for the gate.
- **Moving the database to `us-east-1`.** A Supabase project can't change region in place; it means a new project and a data migration.
- **Partial prerendering / Cache Components.** Not stable on Next 15. Revisit with Next 16.
- **Public-site bundle size** (63 scripts in one trace). Covered by [codebase-cleanup](../2026-10-25-codebase-cleanup/PLAN.md).
