Status: in progress

# Phase II open bugs (billing, auth, UI, docs) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the open rows of the Confluence database "[Phase II] Bugs and Adjustments" (https://quicktalog.atlassian.net/wiki/x/AYA-B), except the "AI builder and plan limits" group, which belongs to [2026-10-24-ai-credit-hard-cap](../2026-10-24-ai-credit-hard-cap/PLAN.md).

**Architecture:** Each task is independent and maps to one or two tracker rows. Billing gets a pure decision function so the webhook guard can be unit tested. Auth is mostly a TEST config fix plus clearer copy. UI items are Tailwind-only changes, checked by eye at fixed widths.

**Tech Stack:** Next.js 15, React 19, Tailwind 3, Vitest + Testing Library, Paddle webhooks, Supabase Auth (GoTrue).

**Spec:** the tracker export of 2026-10-24 (rows reported 14–22 Oct 2026). Plain-language version: [OVERVIEW.md](OVERVIEW.md).

## Global Constraints

- TEST (`imhinsgyzzyblghwnedk`) only; nothing touches PROD.
- SQL is read-only. The one config change (Task 3) uses `scripts/supabase/auth-config.ts`, never the dashboard or `supabase config push`.
- No commits, pushes or branches unless the user asks (CLAUDE.md).
- Before finishing: `npx tsc --noEmit`, `npm run check`, `npm test`.
- Copy uses US spelling ("Colors", not "Colours"), matching the rest of the app.

## Tracker rows covered

| # | Row (shortened) | Task | Confidence in the cause |
|---|---|---|---|
| B1 | Upgrading sends "your plan is now Starter" email | 1 | Fix is certain; root cause still to confirm |
| B2 | Change plan email says the subscription was canceled (marked WON'T DO) | 1 | Same bug as B1; reopen and merge |
| B3 | Plan cards don't match the subscription overview | 2 | Waiting on a decision (see Task 2) |
| A1 | Infinite spinner signing in with email after Google sign-in/out | 4 | Probably fixed in `1c59c70`; needs a retest |
| A2 | Can't connect/disconnect Google; message says "connecting" | 3 | High |
| U1 | Prices too thin on desktop and mobile | 5 | High (`font-thin` in `PriceDisplay`) |
| U2 | No warning when a logo is added but the custom header/footer is off | 6 | High |
| U3 | Numbers too big on small screens | 7 | Guess: needs the screenshot |
| U4 | Growth & support rows should stack on small screens | 7 | High (`PlanFeatures`) |
| U5 | Buttons should stack | 8 | Unknown screen: needs the screenshot |
| U6 | Move the icon to the top right corner | 8 | Unknown screen: needs the screenshot |
| D1 | "Option two: generate with AI" text is out of date | 9 | High |

Clean-up in the tracker, no code: close the untitled High row from Nov 2025 ("in preparation" for over 10 minutes). That background generator was removed (see the archived 2026-10-14 docs plan).

## Review Focus

1. **Monthly ↔ yearly switch on the same tier.** It is a new subscription with a different price id. The cancel guard in Task 1 must not downgrade the user. Pinned by a `shouldDowngradeOnCancel` test.
2. **Real cancellation after an earlier upgrade.** The user's last subscription is canceled in the Paddle portal. The user must still be downgraded and emailed. Pinned by a `shouldDowngradeOnCancel` test.
3. **Google-only account that has set a password.** GoTrue still lists only the `google` identity, so Disconnect stays disabled. The row must say why. Pinned by a GoogleRow test.
4. **Custom footer with the default header.** The footer must show the user's logo, not the Quicktalog logo. Today `logoSrc` follows `header.type` for both. Fixed and pinned in Task 6.
5. **320px phone width on the subscription tab.** Limit tiles such as "100,000" and "Unlimited" must not overflow. Checked by eye in Task 7.

---

### Task 1: Plan change must not send the cancellation email (B1, B2)

**What happens today.** An upgrade is a new Paddle checkout. On `subscription.activated`, `ProcessWebhook` sets `users.plan_id` to the new price and cancels the old subscription. The old subscription's `subscription.canceled` then reaches the `SubscriptionCanceled` branch ([process-webhook.ts](../../../../src/utils/paddle/process-webhook.ts)). That branch downgrades the user to free, runs `applyPlanDowngrade` and sends `CancellationEmail` whenever it finds no *active* row for the customer. The tester got that email after an upgrade, so that check gave the wrong answer at least once. If so, the downgrade also ran: their plan was reset to free and catalogues may have been taken offline. That makes this the most serious item in the plan.

**Fix regardless of root cause.** Downgrade only when the canceled subscription is the one granting the user's current plan (`users.plan_id === canceled priceId`) *and* no other subscription is active. After an upgrade, `plan_id` already holds the new price, so the old subscription's cancel event does nothing.

**Files:**
- Create: `src/lib/paddle/downgrade.ts`
- Modify: `src/utils/paddle/process-webhook.ts` (`SubscriptionCanceled` branch: select `planId` along with `name`/`email`, then call the function)
- Test: `tests/unit/paddle/downgrade.test.ts`

**Interfaces:**
- Produces: `shouldDowngradeOnCancel(input: { currentPlanId: string | null; canceledPriceId: string | null; otherActiveCount: number }): boolean`

- [ ] **Step 0: Confirm what happened (read-only).** On TEST, look up the tester's `users.plan_id`, then their `subscriptions` rows (`subscription_status`, `price_id`, `updated_at`) for the 22 Oct change. Pull the `/api/paddle` runtime logs for 22 Oct from Vercel (TEST project). Write the event order you find into `FINDINGS.md` in this folder. If the tester was downgraded, restore their plan through the Paddle sandbox, not with SQL.
- [ ] **Step 1: Write the failing tests** in `tests/unit/paddle/downgrade.test.ts`:
  - `keeps the plan when the canceled subscription is not the current plan`: `{ currentPlanId: "pri_growth", canceledPriceId: "pri_basic", otherActiveCount: 0 }` → `false`
  - `keeps the plan when switching monthly to yearly`: `{ currentPlanId: "pri_basic_year", canceledPriceId: "pri_basic_month", otherActiveCount: 0 }` → `false`
  - `downgrades when the current plan's subscription ends`: `{ currentPlanId: "pri_basic", canceledPriceId: "pri_basic", otherActiveCount: 0 }` → `true`
  - `keeps the plan while another subscription is active`: `{ currentPlanId: "pri_basic", canceledPriceId: "pri_basic", otherActiveCount: 1 }` → `false`
  - `downgrades when the user has no plan recorded`: `{ currentPlanId: null, canceledPriceId: "pri_basic", otherActiveCount: 0 }` → `true`
- [ ] **Step 2: Run** `npx vitest run tests/unit/paddle/downgrade.test.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `shouldDowngradeOnCancel` and use it in the `SubscriptionCanceled` branch in place of the bare `active.length > 0` check. Return `{ kind: "stored" }` when it is `false`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/paddle`. Expected: all PASS, existing webhook tests included.
- [ ] **Step 5: Retest on TEST** with the Paddle sandbox: Basic → Growth sends no cancellation email and leaves `plan_id` on Growth. Then cancel Growth in the portal: the user moves to Starter and gets the email.

**Decision for the user.** Once the fix is in, a plan change sends no email at all. Row B2 suggests users expect a "your plan changed" email. If you want one, add a `PlanChangedEmail` sent from the `activated` outcome when `otherActiveSubscriptionIds` is not empty. That is a separate small task, not included here.

**Related finding, not in scope.** `processEvent` never routes `SubscriptionTrialing` or `SubscriptionResumed`, so the branches for them in `handleSubscriptionData` never run. A price change made inside an existing subscription (`subscription.updated`) also never updates `plan_id`. Neither is reachable from the app's own checkout today.

---

### Task 2: Plan cards match the subscription overview (B3)

Three lists describe the same plan facts in different words:
- The pricing cards use `getFeatureList` in [constants/pricing.ts](../../../../src/constants/pricing.ts): "Up to 3 sections & 30 items per catalogue", "Custom Branding", "Newsletter".
- The subscription overview uses `limitsOf`/`groupsOf` in [PlanFeatures.tsx](../../../../src/components/dashboard/subscription/PlanFeatures.tsx): separate "Sections per catalogue" and "Items per catalogue", "AI credits / month", "Newsletter sign-ups", and the Design / Section types / Growth & support groups.
- The comparison table uses `comparisonGroups`.

**Proposed fix:** one source of labels. Move `limitsOf` and `groupsOf` into `constants/pricing.ts` as `planLimitRows(features)` and `planFeatureGroups(features)`. `PlanFeatures` imports them. `getFeatureList` builds the card list from the same rows: the five limits with overview wording, then the included rows from the overview groups. The `type` keys stay as they are, so the info dialogs keep working.

**Decision needed before starting:** should the cards list *every* included feature (long cards, but identical to the overview) or *the limits plus four or five highlights*? I recommend limits plus highlights, worded exactly as in the overview. The screenshot on the row may show what the tester expected; please confirm.

**Files:** `src/constants/pricing.ts`, `src/components/dashboard/subscription/PlanFeatures.tsx`. Test: `tests/unit/lib/pricing.test.ts` (create it if missing).

- [ ] **Step 1: Failing test** `card features use the overview labels`. For `tiers[1]`, `getFeatureList(...).map(f => f.text)` contains `"Items per catalogue: 30"` (format to be agreed in the decision above). It does not contain `"Custom Branding"`.
- [ ] **Step 2:** run, see FAIL. **Step 3:** move the helpers and rebuild `getFeatureList`. **Step 4:** run `npx vitest run tests/unit/lib`. Expected: PASS.
- [ ] **Step 5:** check `/pricing`, the home pricing section and the dashboard subscription tab side by side.

---

### Task 3: Google connect/disconnect (A2)

**Cause (high confidence).** Both buttons fail with the same error, and its text, "Connecting accounts is not available yet.", is the `manual_linking_disabled` message in [authErrors.ts](../../../../src/components/dashboard/account/supabase/authErrors.ts). GoTrue returns that code for `linkIdentity` *and* `unlinkIdentity` when manual linking is off. `scripts/supabase/auth-config.test.json` sets `security_manual_linking_enabled: true`, but that file only takes effect once someone runs `--apply`. TEST has probably drifted from it.

**Files:**
- Modify: `src/components/dashboard/account/supabase/authErrors.ts` (neutral `manual_linking_disabled` copy)
- Modify: `src/components/dashboard/account/supabase/GoogleRow.tsx` (say why Disconnect is disabled)
- Test: `tests/unit/components/googleRow.test.tsx`

- [ ] **Step 1: Check drift (read-only, needs `SUPABASE_ACCESS_TOKEN` in your shell):** `npx tsx scripts/supabase/auth-config.ts --project test --check --only security_manual_linking_enabled`. Expected: it reports drift (`false` on TEST).
- [ ] **Step 2: Apply on TEST** (a config change, so it needs your go-ahead): `... --project test --apply --only security_manual_linking_enabled`. Also confirm that `https://<test domain>/auth/callback**` is in TEST's redirect allow-list, because `linkIdentity` returns there.
- [ ] **Step 3: Failing tests** in `googleRow.test.tsx`, with a mocked `supabase.auth`:
  - `explains why Google cannot be disconnected when it is the only sign-in method`: identities `[google]` → Disconnect is disabled and the text "Google is your only sign-in method" is shown.
  - `shows a neutral message when linking is turned off`: `unlinkIdentity` resolves `{ error: { code: "manual_linking_disabled" } }` → the toast text has no "Connecting".
- [ ] **Step 4:** run `npx vitest run tests/unit/components/googleRow.test.tsx`. Expected: FAIL.
- [ ] **Step 5: Implement.** New `manual_linking_disabled` copy: "Google connections are turned off right now. Please try again later." Under the row, when `google && identities.length < 2`, show: "Google is your only sign-in method, so it can't be disconnected." Expected: PASS.
- [ ] **Step 6: Retest on TEST** with three accounts: email/password → Connect Google → Disconnect; Google-only → Disconnect is disabled with the explanation; a Google account already used by another user → "already connected" message. If a Google-only user who has set a password still sees only one identity, that is GoTrue's behavior, and the explanation text covers it.

---

### Task 4: Sign-in spinner after Google sign-out (A1)

`1c59c70` removed the `router.refresh()` calls queued behind navigations (`SignInForm`, `SupabaseAuthProvider.signOut`, `SupabaseAccount`), and `tests/unit/components/authNavigation.test.tsx` covers it.

- [ ] **Step 1:** once `1c59c70` is on TEST, repeat the tester's steps: Google sign-in → sign out → email/password sign-in for the same address → you land on `/admin/dashboard` within 2 seconds. Also try a different address.
- [ ] **Step 2:** if it passes, mark the row DONE with a comment pointing to `1c59c70`. If it still spins, open a separate debugging task (superpowers:systematic-debugging). Don't patch it in this plan.

---

### Task 5: Heavier prices in catalogues (U1)

[PriceDisplay.tsx:58](../../../../src/components/catalogue/cards/common/PriceDisplay.tsx#L58) gives regular prices `font-thin` (weight 100); discounted prices are already `font-bold`.

- [ ] **Step 1:** change the regular price to `font-semibold`. Leave size and color (`text-price`, `--catalogue-price`) unchanged.
- [ ] **Step 2:** check all four card types (top image, side image, carousel, text only) in a light and a dark theme, at 375px and desktop. A discounted price must still be visibly stronger than its struck-through original.

---

### Task 6: Logo hint, and footer logo follows the footer setting (U2)

The logo appears only when the header is custom. [Catalogue.tsx:83](../../../../src/components/catalogue/view/Catalogue.tsx#L83) computes one `logoSrc` from `header.type` and passes it to both `CatalogueHeader` and `CatalogueFooter`. So a custom footer with a default header shows the Quicktalog logo (Review Focus 4).

**Files:**
- Modify: `src/components/catalogue/view/Catalogue.tsx` (`headerLogo` from `header.type`, `footerLogo` from `footer.type`)
- Modify: `src/components/catalogue/inputs/sidebar/GeneralTab.tsx` (hint under the Logo dropzone)
- Test: `tests/unit/components/logoHint.test.tsx`

- [ ] **Step 1: Failing test** `shows the custom header hint when a logo is set but header and footer are default`: catalogue `{ logo: "x.png", header: { type: "default" }, footer: { type: "default" } }` → the text "Your logo shows in a custom header or footer" is visible. Second test, `hides the hint when the header is custom` → not visible.
- [ ] **Step 2:** run, FAIL. **Step 3:** add the hint, only when `hasBranding && catalogue.logo && header.type !== "custom" && footer.type !== "custom"`, with the copy: "Your logo shows in a custom header or footer. Turn on Customize header in the Header tab to show it." Split `logoSrc`. **Step 4:** PASS.
- [ ] **Step 5:** in the builder preview: default header + custom footer shows your logo in the footer only.

---

### Task 7: Subscription tab on small screens (U3, U4)

Both rows came in together with B3, so they most likely refer to the subscription tab. Please confirm against the screenshots.

In [PlanFeatures.tsx](../../../../src/components/dashboard/subscription/PlanFeatures.tsx):
- [ ] **U4:** the groups grid goes from `md:grid-cols-3` to `lg:grid-cols-3`, so Design / Section types / Growth & support stack below 1024px. Rows with a string value ("Priority support") get `flex-wrap`, so the value drops under the label instead of squeezing it.
- [ ] **U3:** limit values go from `text-xl` to `text-lg sm:text-xl`, and each tile gets `min-w-0 break-words`.
- [ ] **Check** at 320, 375, 768 and 1024px on the Starter and the highest plan (longest values: "100,000", "Unlimited").

---

### Task 8: "Buttons should stack" and "Move the icon to the top right" (U5, U6)

The rows don't name a screen, and the screenshots can't be downloaded from the export (their links need a Confluence session). **Blocked until someone says which screen each one is about.** Once known, the change follows the patterns already in the app:
- stacking: `flex-col gap-2 sm:flex-row` on the container, `w-full sm:w-auto` on the buttons;
- icon: `relative` on the card, and the icon `absolute right-3 top-3`, as on the item cards.

---

### Task 9: Bring the remaining AI and OCR copy up to date (D1)

The quoted "Option two: generate with AI… ready in about five minutes" text came from `/docs`, which the 2026-10-14 docs refresh (archived) already rewrote. Text that still describes the removed separate AI generator and OCR import:
- `src/content/articles/create-catalog-with-ai.tsx` ("Generate the draft" stepper, "Option two: photograph what you already have" as a standalone import)
- `src/content/articles/digital-menu-for-restaurants.tsx` (lines ~143–165)
- `src/content/articles/digital-catalog-alternatives.tsx` (lines ~66, 151–152, 177, 218, 260)
- `src/app/llms.txt/route.ts` ("OCR Import Technology", "OCR import")

- [ ] **Step 1:** first check on TEST `/docs` that the old text is gone. If it is, tell Marko on the row which page now covers it.
- [ ] **Step 2:** rewrite the passages above to describe how it works now. Create a catalogue (name, language, currency, business type), pick a template, then use Quick AI in the builder. To import from photos, attach up to 10 images to a Quick AI message (OCR runs in the browser; no PDFs). Keep the "always set your own prices" warning. No new claims about timings.
- [ ] **Step 3:** search `grep -rn "AI generator\|OCR import\|Scan and Import" src/content src/app/llms.txt` and confirm that only accurate mentions remain.

---

## After implementation

- Run `npx tsc --noEmit`, `npm run check`, `npm test`.
- Update the tracker rows with a Comment Dev line each.
- Update docs: billing behavior in `docs/architecture/` (cancel vs plan change), and the auth config drift check in the auth guide if it isn't already there.
- Move this plan to `archive/` and update `.claude/plans/README.md`.

## Implementation notes (2026-10-24)

- **Task 1 changed after review.** `shouldDowngradeOnCancel` became `cancelDecision` in `src/lib/paddle/downgrade.ts`, returning `keep | downgrade | unexplained`. Any other non-canceled subscription → keep. Otherwise, a canceled price equal to `plan_id` → downgrade. Anything else is unexplained: the plan is kept and a Sentry warning is sent. This closes the hole the review found (a price changed on the Paddle side, then canceled, would otherwise leave the user on a paid plan without any signal). `tests/unit/paddle/process-webhook-cancel.test.ts` runs the real canceled branch against a fake transaction.
- **Task 6 extra fix.** `CatalogueFooter` renders `Brand` for a custom footer even without a logo, so the legal name and socials are not lost now that the footer logo follows `footer.type`.
- **Task 2:** the cards show the 5 limits plus the included highlight rows (`type` set in `planFeatureGroups`). The choice was not confirmed by the owner.
- **Not done:** Task 1 Step 0 (Vercel logs returned 403; no TEST DB tool) and Step 5 (sandbox retest); Task 3 Steps 1–2 (needs `SUPABASE_ACCESS_TOKEN`); Task 4 retest; visual checks for Tasks 5 and 7; Task 8 blocked; Task 9 Step 1 (`/docs` on TEST).
- **Deferred minors:** the sections card line still uses info type `sections_and_items`; `LogoHint` mentions only the header toggle; Lato has no 600 weight; `cancelSubscription` failures are not checked in the webhook.
- **Task 8 (2026-10-24, follow-up):** the owner named the screen for "Buttons should stack": Settings → Sessions. Cause: `SettingsRow` switched to its 3-column grid at `md`, where the dashboard sidebar also appears, so the content beside it was too narrow. The grid now starts at `lg`, and row actions are a column (full width on phones). The same sidebar squeeze was fixed elsewhere: the subscription limit tiles and groups go multi-column at `xl`; overview stat numbers start at 22px and keep clear of the corner icon; usage card headers wrap. "Move the icon to the top right" is still unnamed.
- Manual linking was enabled on TEST by the owner (Task 3 Steps 1–2 done).
