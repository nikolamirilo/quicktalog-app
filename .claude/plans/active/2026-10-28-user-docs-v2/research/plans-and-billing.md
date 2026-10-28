# Plans, limits, billing and subscriptions — research for end-user docs

Read-only research, 2026-10-28. Every fact carries `path:line`. Paths are relative to
`/Users/nikola/Desktop/Quicktalog/quicktalog-app` unless they start with `../quicktalog-packages`
or `../quicktalog-backend`.

`tiers` in `../quicktalog-packages/src/constants/pricing.ts` is the single source of truth: the
pricing page, the plan cards, the comparison table, the dashboard, the limit modals, the server
checks and the Cloudflare cron all read it (`src/constants/pricing.ts:1`,
`src/lib/entitlements/plan.ts:2`, `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:4`).

---

## The plans (from `tiers`)

- Six tiers exist. Five are `type: "standard"` (ids 0–4) and one is `type: "custom"` (id 5) — `../quicktalog-packages/src/constants/pricing.ts:7,39,70,101,132,163`.
- Only `type: "standard"` tiers appear on the pricing page, the comparison table and the dashboard plan lists — `src/constants/pricing.ts:8` (`standardTiers = tiers.filter((tier) => tier.type === "standard")`).
- Tier id 5 is named `German Silva Custom Plan` and is assigned by hand (one named customer); it never shows on any public list — `../quicktalog-packages/src/constants/pricing.ts:161-163`, `src/constants/pricing.ts:8`.
- `FREE_TIER_ID = 0` and `POPULAR_TIER_ID = 2`, i.e. Starter is the free plan and Pro carries the "Most popular" badge — `src/constants/pricing.ts:9,16`, `src/components/pricing/PricingColumn.tsx:179-181`.

### Exact display names and descriptions

| id | Name (letter for letter) | Description (letter for letter) | Evidence |
|---|---|---|---|
| 0 | `Starter` | `Perfect for individuals and small businesses getting started.` | `../quicktalog-packages/src/constants/pricing.ts:6,12-13` |
| 1 | `Basic` | `Perfect fit for small businesses to digitalize their offer.` | `../quicktalog-packages/src/constants/pricing.ts:38,44` |
| 2 | `Pro` | `Ideal for growing businesses with multiple services.` | `../quicktalog-packages/src/constants/pricing.ts:69,75` |
| 3 | `Growth` | `Built for teams that need advanced features and analytics.` | `../quicktalog-packages/src/constants/pricing.ts:100,106` |
| 4 | `Premium` | `Enterprise-grade solution with unlimited possibilities.` | `../quicktalog-packages/src/constants/pricing.ts:131,137` |
| 5 | `German Silva Custom Plan` | `Custom plan tailored for needs of German Silva.` | `../quicktalog-packages/src/constants/pricing.ts:162,168` |

### Prices and billing periods

- `tiers` holds **no money amounts at all** — only Paddle price ids, one for `month` and one for `year` — `../quicktalog-packages/src/constants/pricing.ts:8-11,40-43,71-74,102-105,133-136,164-167`.
- Every price shown to the user is fetched live from Paddle in the browser (`paddle.PricePreview`), for country `US`, and cached only in React state — `src/hooks/usePaddlePrices.ts:63-69`, `src/hooks/usePricingPlans.ts:18`.
- Starter's `month` and `year` price ids are the **same string** (`pri_01k27ajepm199twd1x77rpwdrq`), so the free plan costs the same on both cycles — `../quicktalog-packages/src/constants/pricing.ts:9-10`.
- The custom plan (id 5) also has the same id for `month` and `year` — `../quicktalog-packages/src/constants/pricing.ts:165-166`.
- Billing toggle: two options labelled `Monthly` and `Yearly`, default `monthly` — `src/components/pricing/BillingToggle.tsx:6-9`, `src/hooks/usePricingPlans.ts:20`.
- Price suffix on a card is `/year` when the yearly cycle is selected, otherwise `/month` — `src/components/pricing/PricingColumn.tsx:60-62`.
- Under a paid card, the note reads `Billed monthly` on the monthly cycle; on the yearly cycle it is `Billed yearly · vs $144 paid monthly` (the amount is `monthly × 12`, formatted), or just `Billed yearly` when Paddle prices have not loaded — `src/components/pricing/PricingPlans.tsx:96-103`, `src/lib/format/price.ts:27-34`.
- Zero cents are dropped from a Paddle price: `$12.00` → `$12`, while `$12.99` stays — `src/lib/format/price.ts:5-7`.
- While Paddle has not answered, a card's price shows `–` with the screen-reader text `Price loading`; if Paddle fails or times out (8 s) it shows `–` with `Price shown at checkout`, except the free plan, which then shows `$0` — `src/components/pricing/PriceAmount.tsx:20-29`, `src/hooks/usePaddlePrices.ts:15,95`.

### Every limit and feature, per plan (verbatim from `tiers`)

| Feature key (`features.*`) | Starter | Basic | Pro | Growth | Premium | German Silva Custom Plan |
|---|---|---|---|---|---|---|
| `catalogues` | 1 | 1 | 6 | 20 | 50 | 1 |
| `sections_per_catalogue` | 5 | 8 | 15 | 30 | 50 | 20 |
| `items_per_catalogue` | 15 | 30 | 100 | 200 | 300 | 200 |
| `traffic_limit` (page views / month) | 500 | 2000 | 5000 | 15000 | 40000 | 4000 |
| `ai_credits` (per month) | 15 | 50 | 150 | 300 | 600 | 50 |
| `branding` | false | true | true | true | true | true |
| `advancedAppearance` | false | false | true | true | true | true |
| `sections.divider` | false | true | true | true | true | true |
| `sections.embedding` | false | false | true | true | true | true |
| `sections.customVisual` | false | false | true | true | true | true |
| `integrations.tracking` | false | false | false | true | true | true |
| `newsletter` | false | false | false | true | true | false |
| `analytics` | `Basic` | `Basic` | `Basic` | `Advanced` | `Advanced` | `Basic` |
| `custom_features` | false | false | false | false | true | false |
| `support` | `Email support` | `Email support` | `Email support` | `Email & Chat support` | `Priority Support (Email, Chat, Meeting)` | `Email` |

Evidence, line by line: Starter `../quicktalog-packages/src/constants/pricing.ts:15-33`; Basic `:46-64`;
Pro `:77-95`; Growth `:108-126`; Premium `:139-157`; custom `:170-188`.

- There is **no plan with "unlimited" anything**. The type allows `"unlimited"` for `sections_per_catalogue` and `items_per_catalogue` (`../quicktalog-packages/src/types/general.ts:28-29`) and the UI renders it as `Unlimited` (`src/constants/pricing.ts:43`, `src/components/modals/limits/limitContent.ts:23`), but no tier uses it — `../quicktalog-packages/src/constants/pricing.ts:23,32,62,63,93,94,124,125,155,156,186,187`.
- There is **no analytics-history limit anywhere in `tiers`**. The only analytics field is the label `analytics` (`Basic` / `Advanced`).
- Features that are on **every** plan and therefore not flags: standard themes (9 of them), the items section, the text section, the shareable link and the QR code editor — `src/constants/pricing.ts:89,101-102,239-242,258-267,298-303`, `../quicktalog-packages/src/constants/general.ts:1` (9 entries in `themes`).

### What "sections" and "items" count

- `sections_per_catalogue` counts **every block in the catalogue, text and divider blocks included** — `../quicktalog-packages/src/helpers/plan-fit.ts:14-16` (`countPlanSections` = `blocksOf(content).length`).
- `items_per_catalogue` counts the items inside items-type blocks (`items`, plus the legacy `category` and `container` keys), across the whole catalogue — `../quicktalog-packages/src/helpers/plan-fit.ts:6,19-28`.
- `catalogues` counts **all** the owner's catalogues, whatever their status (draft, inactive, active) — `src/lib/entitlements/plan.ts:49-58` (`count()` with only an owner filter), and in `my_usage()` `supabase/migrations/20260926120000_ai_credits_ledger.sql:161`.
- `traffic_limit` is page views summed over **all** the owner's catalogues for the current UTC calendar month — `supabase/migrations/20260926120000_ai_credits_ledger.sql:157-158,163-164`.
- AI credits used are the sum of non-refunded prompt credits in the current UTC month — `supabase/migrations/20260926120000_ai_credits_ledger.sql:162-163`.

---

## Which plan a new account starts on, and whether it expires

- A new confirmed sign-up gets `plan_id` from `private.settings.default_plan_id`, which is seeded to `pri_01k27ajepm199twd1x77rpwdrq` — the **Starter** price id — `supabase/migrations/20260922090002_auth_users_sync.sql:15-19`, `supabase/migrations/20261024211643_drop_clerk_migration_schema.sql:26-29,33-39`.
- Sign-up fails outright if that setting is missing (`private.settings.default_plan_id is not set`) — `supabase/migrations/20261024211643_drop_clerk_migration_schema.sql:27-29`.
- Any `plan_id` that matches no tier falls back to Starter on the server — `src/lib/entitlements/plan.ts:22-28`; same fallback in the cron — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:48-50`.
- **Starter does not expire.** There is no trial, no expiry date and no trial handling: `subscription.trialing` is not routed by the webhook — `src/utils/paddle/process-webhook.ts:64-79`, `docs/architecture/billing.md` ("Not handled" section). The pricing FAQ says it plainly: Starter has `with no time limit` — `src/constants/pricingFaqs.ts:23`.
- The pricing page's starter card carries the badge `Free forever` — `src/components/pricing/PricingColumn.tsx:142-144`.
- The free plan's AI limits are stricter than its credit count suggests: Starter gets `maxFetches: 0` (Quick AI cannot read a web page for you), `maxPlanTasks: 4`, the cheaper model, and **requires a verified email** before any AI turn; paid plans get `maxFetches: 3`, `maxPlanTasks: 12`, the pro model and no e-mail requirement — `src/lib/ai/limits.ts:19-37`.

---

## Upgrading: exact steps, labels, checkout

### Entry points and exact button labels

1. Dashboard → `Subscription` tab (sidebar label `Subscription`, URL `?tab=subscription`) — `src/constants/dashboard.tsx:12`.
2. At the top of that tab, when the plan is standard and below the highest standard id (i.e. not Premium), a strip appears: title `Upgrade your plan`, subtitle `Get more features, higher limits, and premium support.`, button `Upgrade plan` → `/pricing` — `src/components/dashboard/subscription/PlanDetails.tsx:38-43,86-93`.
3. The plan-features card shows `Compare plans` → `/pricing` whenever anything is not included — `src/components/dashboard/subscription/PlanFeatures.tsx:21-23,34-42`.
4. On the overview, `You've reached your current catalogue limit` / `You've reached your traffic limit` strips both have the button `Upgrade plan` → `/pricing` — `src/components/dashboard/overview/LimitCTAs.tsx:19-34`.
5. Inside any limit modal the main button reads `Upgrade to <Plan> Now` — `src/components/modals/limits/LimitUpgradeComparison.tsx:167`.
6. Inside the builder, locked panels show `Upgrade now` — `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:48`.

- The limit-modal and builder buttons do **not** navigate straight away: `useUpgrade()` saves the builder draft first. On success it routes to `/pricing` in the same tab. If the save is refused it shows the toast `<reason>. Your changes are still here.` and opens `/pricing` in a **new tab** — `src/hooks/useUpgrade.ts:15-25`.

### On `/pricing`

- Page title `Simple, transparent pricing`, eyebrow `Pricing`, lead `Start free and upgrade as you grow. No hidden fees, no surprises, and every paid plan comes with a 10-day money-back guarantee.` — `src/app/(site)/(with-footer)/pricing/page.tsx:35-39`.
- Three check lines under the hero: `No credit card to start`, `Cancel anytime`, `10-day money-back guarantee` — `src/app/(site)/(with-footer)/pricing/page.tsx:20-24`.
- Under the billing toggle: `Showing yearly prices in USD, billed once a year.` or `Showing monthly prices in USD. Switch to yearly to pay once a year.` — `src/components/pricing/PricingPlans.tsx:66-69`.
- Starter card CTA is `Start free`; each paid card CTA is `Get started`; both read `Starting...` while a checkout is being created — `src/components/pricing/PricingPlans.tsx:73,92`, `src/components/pricing/PricingColumn.tsx:98`.
- Comparison-table footer buttons: `Start free` for the free tier, `Get started` otherwise, with aria-label `<label> with <Plan>` — `src/components/pricing/ComparisonTable.tsx:208,215,224`.
- Three assurance lines below the cards: `10-day money-back guarantee on your first purchase`, `Secure checkout by Paddle, our merchant of record`, `Prices in USD. Local taxes may apply.` — `src/components/pricing/PricingPlans.tsx:26-33`.

### What happens when the button is pressed

- Free plan: no checkout. A signed-in user goes to `/admin/dashboard?tab=subscription`; a visitor goes to `/auth?mode=signup` — `src/hooks/usePlanCheckout.ts:11-12,27-30`.
- Not signed in and a paid plan: redirect to `/auth` — `src/hooks/usePlanCheckout.ts:32-35`.
- Already on that plan: a browser `alert` with the exact text `You currently have this plan` — `src/hooks/usePlanCheckout.ts:41-44`.
- Paddle.js not ready: `alert` — `Checkout is still loading. Please try again in a moment.` — `src/hooks/usePlanCheckout.ts:46-49`.
- Otherwise the server creates the Paddle transaction (`createCheckout`), pinned to the user's Paddle customer and carrying their signed user id, and the browser opens Paddle's overlay checkout with `transactionId` — `src/hooks/usePlanCheckout.ts:51-66`, `src/lib/paddle/checkout.ts:19-33`.
- Server-side refusals surface as an `alert` with the server's string: `Unauthorized`, `Unknown plan`, or `Could not start checkout` — `src/lib/paddle/checkout.ts:23-24,37`, `src/hooks/usePlanCheckout.ts:57-59`.
- Any thrown error: `alert` — `We couldn't start the checkout. Please try again in a moment.` — `src/hooks/usePlanCheckout.ts:67-69`.
- The checkout is Paddle's own hosted overlay (`paddle.Checkout.open`), so its fields, taxes and payment methods are Paddle's, not Quicktalog's — `src/hooks/usePlanCheckout.ts:61-66`. Paddle is the merchant of record and charges local sales tax/VAT; prices are quoted in USD and Paddle may show local prices — `src/constants/pricingFaqs.ts:47-49`, `src/components/pricing/PricingPlans.tsx:31-32`.

### Straight after payment

- Paddle redirects to `successUrl` = `<NEXT_PUBLIC_BASE_URL>/admin/checkout/success` — `src/hooks/usePlanCheckout.ts:64`.
- That page is a bare frame (no navbar, no footer) with an animated 84px tick, the heading `Payment Successful!`, the line `Thank you for your purchase.`, a full-width button `Return to Dashboard` → `/admin/dashboard`, and under it `Have questions? Contact us at:` with the support address — `src/app/admin/checkout/success/page.tsx:9,41-69`, `src/components/dashboard/checkout/SuccessMark.tsx:3-6`.

### How soon the new limits apply

- The plan changes when Paddle's `subscription.activated` webhook arrives: it writes `users.plan_id = <new price id>` — `src/utils/paddle/process-webhook.ts:136-152`.
- Nothing in the app polls or waits for it; the success page just links back to the dashboard. The dashboard reads `users.plan_id` on each load / refresh — `src/lib/users/my-user-data.ts:67-70,90`.
- Every server-side limit decision reads the plan from the database inside the same transaction, with the users row locked, so the new limits take effect on the first request after the webhook lands — `src/lib/entitlements/plan.ts:36-47`.
- If the webhook secret is wrong or rotated, every webhook fails with a 403 and only a `console.warn` is produced — billing sync stops silently — `src/app/api/paddle/route.ts:39-47`.

---

## Changing plan vs cancelling

| | Changing plan | Cancelling |
|---|---|---|
| Where | `/pricing`, press `Get started` on another plan | Paddle customer portal, reached from the Subscription tab |
| Mechanism | A **brand-new Paddle checkout**; the old subscription is then cancelled by the app through the Paddle API with `effective_from: "immediately"` | Paddle-side cancellation |
| Takes effect | Immediately on `subscription.activated` | End of the current billing period (per the Terms) |
| Email | None | `Your Quicktalog subscription has ended` |

- A plan change is a new checkout, so for a moment the user holds two subscriptions — `docs/architecture/billing.md` ("Plan changes"), `src/hooks/usePlanCheckout.ts:51-66`.
- `subscription.activated` for the new subscription sets `plan_id`, then every *other* active subscription of that customer is cancelled — `src/utils/paddle/process-webhook.ts:144-159,254-258`.
- The cancel call uses `effective_from: "immediately"` — `src/actions/paddle.ts:13-15`. **The remaining paid time on the old plan is not carried over by the app, and the app asks for no proration or refund.**
- That cancel's return value is never checked, so a failed cancel of the old subscription goes unnoticed — the user can keep paying for both — `src/utils/paddle/process-webhook.ts:255-257`, `docs/architecture/billing.md` ("Not handled").
- The old subscription's `subscription.canceled` then changes nothing, because the new one is live (`cancelDecision` → `keep`) — `src/lib/paddle/downgrade.ts:23`, `src/utils/paddle/process-webhook.ts:184-189`.
- **No email is sent for a plan change** — `docs/architecture/billing.md` ("Plan changes").
- Terms, section `Subscriptions, Renewals & Price Changes`: `Paid subscriptions renew automatically at the end of each billing period unless cancelled before the renewal date. You can cancel a subscription at any time through your account settings or by contacting support. Cancellation takes effect at the end of the current billing period, and you'll retain access until then.` — `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:198-208`.
- Price/feature changes: `We may change subscription prices or plan features from time to time. When we do, we'll notify active subscribers by email at least 30 days before the change takes effect. If you don't accept the new price, you may cancel before the next renewal.` — `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:209-214`.
- Money back: renewals are **generally non-refundable**; the 10-day guarantee covers the **first purchase only** and explicitly not renewals or upgrades — `src/app/(site)/(with-footer)/refund-policy/page.tsx:21-26,97-101`.

---

## Cancelling: steps, labels, confirmation text, what happens at the end

### Steps and labels

1. Dashboard → `Subscription` tab — `src/constants/dashboard.tsx:12`.
2. The card `Manage your subscription`, subtitle `Update billing details, check transactions or cancel subscription.` — `src/components/dashboard/subscription/PlanDetails.tsx:136-141`.
3. Button `Manage subscription`, with an external-link icon and the screen-reader note `(opens in a new tab)`; it opens Paddle's customer portal at `https://customer-portal.paddle.com/cpl_01k11h2axbrhg4fzmw2zey50x0` in a new tab — `src/components/dashboard/subscription/PlanDetails.tsx:150-161`, `src/components/dashboard/Subscription.tsx:11-12,35`.
4. On the free plan the same button exists but is **disabled** ("The free plan has no Paddle subscription to manage") — `src/components/dashboard/subscription/PlanDetails.tsx:143-148`.

- **There is no cancel button, no cancel dialog and no confirmation text inside Quicktalog.** The whole cancellation happens in Paddle's portal, so its wording is Paddle's. Nothing in this repo contains cancellation confirmation copy.
- The FAQ on the pricing page says: `You can upgrade or cancel from the Subscription tab in your dashboard. Cancel before your renewal date, because renewals are generally not refundable.` — `src/constants/pricingFaqs.ts:40`.
- The site FAQ says: `You can upgrade, downgrade or cancel at any time from the Subscription tab in your dashboard.` — `src/constants/details.ts:132` (answer text).

### What happens at the end of the period

When Paddle finally sends `subscription.canceled` and nothing else of that customer is live, and the cancelled price is the user's current `plan_id`:

1. `users.plan_id` is set to the Starter monthly price id — `src/utils/paddle/process-webhook.ts:184-203`, decision table in `src/lib/paddle/downgrade.ts:14-25`.
2. `applyPlanDowngrade` runs in the same transaction — `src/utils/paddle/process-webhook.ts:206-210`.
3. The changed catalogues are revalidated and the dashboard cache is cleared — `src/utils/paddle/process-webhook.ts:260-268`.
4. `CancellationEmail` is sent, subject `Your Quicktalog subscription has ended` — `src/utils/paddle/process-webhook.ts:269-275`, `src/lib/email/transactional.ts:101-113`.

If nothing is live but `plan_id` is a *different* price, **nothing changes** and a Sentry warning is raised: `Paddle cancel left the user on a plan no live subscription pays for` — `src/lib/paddle/downgrade.ts:24`, `src/utils/paddle/process-webhook.ts:237-251`.

---

## Downgrading: exactly what happens to content

`applyPlanDowngrade(tx, userId, tier)` — `src/lib/entitlements/catalogue.ts:95-173`:

- **Catalogues over the new quota are switched off, not deleted.** Active catalogues are ranked by `updated_at desc nulls last, created_at desc`; everything past the plan's `catalogues` number is set to `status = 'inactive'`. The most recently updated ones are kept — `src/lib/entitlements/catalogue.ts:100-116`.
- **Branding is stripped** when the new plan has no `branding`: every catalogue's `header.type` and `footer.type` are forced back to `"default"` — `src/lib/entitlements/catalogue.ts:118-125`.
- **Newsletter sign-ups are switched off** when the new plan has no `newsletter`: `footer.newsletter` is set to `false` on every catalogue — `src/lib/entitlements/catalogue.ts:127-133`.
- **Advanced styling is reset** when the new plan has no `advancedAppearance`: `appearance.style`, `appearance.overlay`, `appearance.glass` and `appearance.background` go back to defaults, and any `appearance.theme.type = 'custom'` is replaced by the default theme — `src/lib/entitlements/catalogue.ts:135-153`.
- **Your own analytics tags are deleted** when the new plan has no `integrations.tracking`: `googleAnalyticsId` and `metaPixelId` are removed from `metadata` on every catalogue that had them — `src/lib/entitlements/catalogue.ts:157-167`.
- **Sections and items over the limit are NOT deleted.** Nothing trims content. Instead the catalogue stops being publishable and gets switched off (next bullet), and the owner may keep editing it as long as it does not grow — `src/lib/entitlements/plan.ts:109-166`.
- Separately, the Cloudflare cron switches off **any active catalogue that no longer fits its owner's plan** (too many items, too many sections, or a gated block type the plan lacks) — for every user, free plan included — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:52-113,162-163`.
- The downgrade is applied in the same transaction as the plan write, so it is atomic — `src/utils/paddle/process-webhook.ts:94-221`.

### What the user is told, and when

- **On cancellation only**: the `CancellationEmail`. Nothing is emailed for a plan change or a Paddle-side price change — `docs/architecture/billing.md` ("Plan changes"), `src/utils/paddle/process-webhook.ts:260-276`.
- Quoted email text, `src/components/emails/CancelationEmail.tsx:30-80`:
  - Preview line: `Your Quicktalog subscription has ended and your account is now on the free Starter plan.`
  - Badge: `Subscription ended`
  - Title: `Your subscription has ended`
  - Lead (with a name): `Thanks for giving Quicktalog a try, <First name>. Your account is now on the free Starter plan, so you can keep using it and upgrade again at any time.` Without a usable name the first sentence is `Thanks for giving Quicktalog a try.` (names equal to `Unknown User` are treated as missing) — `:26,34-39`.
  - When catalogues went offline: `Starter includes 1 live catalogue, so we took these offline. They're still in your dashboard.` followed by one row per catalogue, each labelled `Offline` with the catalogue name — `:40-54`. (The "1 live catalogue" number and the word "catalogue"/"catalogues" come from `tiers[0].features.catalogues`.)
  - Button: `Go to your dashboard` → `<site>/admin/dashboard` — `:55-62`.
  - Then: heading `Tell us what didn't work`, paragraph `Your answers help us decide what to build next. If you'd rather talk, book a call and we can look at a custom plan or an offer that fits better.`, buttons `Leave feedback` (`https://forms.office.com/r/nxYghvYAEx`) and `Book a call` (`https://calendly.com/quicktalog/customer-support`) — `:63-75`, URLs at `:14-15`.
  - Sign-off: `Thank you for being part of Quicktalog,` / `The Quicktalog team` — `:76-80`.
  - Email subject: `Your Quicktalog subscription has ended`; sender `Quicktalog<office@quicktalog.app>` — `src/lib/email/transactional.ts:14,111-112`.
- **Catalogues merely switched off by the cron are not emailed at all.** The cron only logs and revalidates — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:109-111,165-178`.
- **In the dashboard**, if the user still has more catalogues than the plan allows, an **un-dismissable** dialog opens automatically (see "Catalogue Limit Exceeded" below) — `src/components/dashboard/Overview.tsx:70-76,216-220`.

---

## Every limit modal and paywall, with exact text

### The plan-limit dialog (`LimitsModal`)

Composition: `src/components/modals/LimitsModal.tsx:35-56`, header `src/components/modals/limits/LimitsModalHeader.tsx`, body `src/components/modals/limits/LimitUpgradeComparison.tsx`.

- **Title**: `Need More <Feature>?` when the current plan already has some of that thing (`currentLimit` is `unlimited` or a number > 0); otherwise `Need <Feature>?` — `src/components/modals/limits/LimitsModalHeader.tsx:28-31,58-62`.
- **Description** (always the same for a limit): `Upgrade your plan to unlock more features and take your digital catalogues to the next level.` — `src/components/modals/limits/LimitsModalHeader.tsx:63-67`.
- **Close**: an `X` button, aria-label `Close`, when the modal has an `onClose`; otherwise a link with aria-label `Go to dashboard` → `/admin/dashboard` — `src/components/modals/limits/LimitsModalHeader.tsx:38-55`.
- **Comparison strip**: left column labelled `Current plan`, right column labelled `Required plan`, with an arrow between. Each column shows the number big, then `<unit> · <plan name>` — `src/components/modals/limits/LimitUpgradeComparison.tsx:106-130,34-52`.
  - The unit is the feature name, singularised when the count is 1: `Items` → `item`/`items`, `Sections` → `section`/`sections`, `Catalogues` → `catalogue`/`catalogues`, `Traffic` → `traffic`; `AI Catalogue Generation` → `AI prompt` and `OCR AI Import` → `OCR import` — `src/components/modals/limits/LimitUpgradeComparison.tsx:61-69`.
  - Numbers use US thousands separators; `unlimited` prints `Unlimited`; a missing value prints `N/A` — `src/components/modals/limits/limitContent.ts:22-26`.
- **Gain box** heading: `What You'll Get with <Required plan>`, then a tick list — `src/components/modals/limits/LimitUpgradeComparison.tsx:143-146`. Lines, in order (`:71-99`):
  1. `<N> catalogues with <N> sections and <N> items per catalogue to manage all your product lines` (`catalogue` singular when the required plan allows 1)
  2. `<N> AI credits per month` (only when the required plan has credits > 0)
  3. `Custom Branding` (only when the current plan lacks branding and the required plan has it)
  4. `<N> page views per month to reach more customers`
  5. `Newsletter feature to keep customers engaged` (only when the required plan has newsletter)
- **Main button**: `Upgrade to <Required plan> Now` — `src/components/modals/limits/LimitUpgradeComparison.tsx:167`.
- **Top-of-the-range variant**: when the current limit equals the next limit and the current plan *is* the required plan (i.e. the user is already on Premium, or on a custom plan whose number nothing beats), the right column shows `TBD` with plan name `Custom Plan`, and the box reads title `Purchase Custom Plan`, body `Get limits and features fully tailored to your needs. Contact our team to get more information.` — `src/components/modals/LimitsModal.tsx:31-33`, `src/components/modals/limits/LimitUpgradeComparison.tsx:120-140`.
- **Contact variant**: whenever `currentLimit === nextLimit`, the button becomes `Contact us Now` → `/contact` — `src/components/modals/limits/LimitUpgradeComparison.tsx:101,152-161`.

#### The five limit bodies (exact `description` strings)

These `description` strings live in `src/components/modals/limits/limitContent.ts:87-162`. **Note: none of them is actually rendered** — `LimitsModalHeader` always prints the fixed "Upgrade your plan to unlock more features…" line, and `LimitUpgradeComparison` uses only `content.feature`, `content.currentLimit` and `content.nextLimit`. They are listed because they are the only per-limit copy in the codebase.

| `type` | `feature` (shown in the title) | Icon | `description` (not currently rendered) | Evidence |
|---|---|---|---|---|
| `ai` | `AI Credits` | Sparkles | On Starter (or when the limit is 0): `You get <N> free AI credits a month. Upgrading gives you <N> - enough to build and refine a full catalogue by chatting.` Otherwise: `You have used all <N> AI credits this month. Upgrade to <N> and keep going.` | `limitContent.ts:88-104` |
| `catalogue` | `Catalogues` | Layers | `Your business is growing! Get <N> catalogues to manage all your product lines in one place and serve more customers.` | `limitContent.ts:105-115` |
| `items` | `Items` | Layers | `Showcase your complete product range! Upgrade to add up to <N> items per catalogue and never miss a sales opportunity.` | `limitContent.ts:116-127` |
| `sections` | `Sections` | FolderTree | `Better organization drives more sales. Upgrade to create <N> categories and help customers find exactly what they need.` | `limitContent.ts:128-139` |
| `traffic` | `Traffic` | FolderTree (icon map gives ChartColumn) | `Your catalogue is getting noticed! Upgrade to get <N> page views per month and keep serving customers without interruption.` | `limitContent.ts:140-150`, icon map `:28-43` |
| anything else | `Premium Features` | Lock | `Unlock the full potential of your digital catalogues with premium features designed to grow your business.` | `limitContent.ts:151-162` |

#### What opens the limit dialog, and with which type

| Trigger | Type | Evidence |
|---|---|---|
| `Create Catalogue` / the floating `+` button when `usage.catalogues >= plan.catalogues` | `catalogue` | `src/hooks/useCreateCatalogue.ts:60-63`, `src/components/catalogue/create/CreateCatalogueProvider.tsx:50-56`, `src/components/dashboard/FloatingActionMenu.tsx:15-18` |
| `Duplicate` on a catalogue card when already at the catalogue limit | `catalogue` | `src/hooks/useDuplicateCatalogue.ts:31-40`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:103-106,259-264` |
| Pressing `View plans` on the failed-duplicate toast | `catalogue` | `src/hooks/useDuplicateCatalogue.ts:55-63` |
| Pressing the add-section button in the builder when the section count has reached the limit | `sections` | `src/components/catalogue/view/Catalogue.tsx:281-292,324-331` |
| Pressing `Add section` in the Add-content dialog when the section count has reached the limit | `sections` | `src/components/catalogue/modals/AddContentModal.tsx:123-147,266-272` |
| Adding an item (or `Add another`) when the item count has reached the limit | `items` | `src/components/catalogue/view/CatalogueContent.tsx:196-228,417-423` |
| Quick AI refusing to start an ask because credits are exhausted | `ai` | `src/hooks/useCatalogueChat.ts:203-207`, `src/components/catalogue/chat/CatalogueChat.tsx:500-506` |
| Quick AI hitting the item limit mid-run | `items` | `src/components/catalogue/chat/CatalogueChat.tsx:507-515` |
| Opening a public catalogue URL that is not `active`, or that errors | `notFound` | `src/app/catalogues/[name]/page.tsx:143-151` |
| Opening a preview of a catalogue that cannot be loaded | `notFound` | `src/app/catalogues/[name]/preview/page.tsx:31-41` |

### The "catalogue not available" paywall (`notFound`)

Shown full-screen in place of a catalogue page — `src/app/catalogues/[name]/page.tsx:146,150`.

- Icon: magnifying glass — `src/components/modals/limits/LimitsModalHeader.tsx:36`.
- Title: `Catalogue Not Found` — `src/components/modals/limits/LimitsModalHeader.tsx:59-60`.
- Body: `The selected catalogue is inactive or doesn't exist. Join thousands of businesses already using Quicktalog to showcase their offerings digitally.` — `src/components/modals/limits/LimitsModalHeader.tsx:64-65`.
- Box heading `Create Your Digital Catalogue with Quicktalog` with three ticks: `Beautiful, mobile-friendly catalogs in minutes`, `Share via QR codes and get real-time analytics`, `No coding required - start today` — `src/components/modals/limits/NotFoundContent.tsx:11-20`.
- Button `Get Started Today`, opening the marketing site in a new tab — `src/components/modals/limits/NotFoundContent.tsx:22-30`.
- There is **no close button** on this variant in the sense that it has no `onClose`, so the `X` is a link with aria-label `Go to dashboard` → `/admin/dashboard` — `src/components/modals/limits/LimitsModalHeader.tsx:46-55`.

### The forced "Catalogue Limit Exceeded" dialog

Auto-opens on the dashboard overview whenever `catalogues.length > plan.catalogues`, and **cannot be dismissed** (no cancel, no `X`, no overlay close) — `src/components/dashboard/Overview.tsx:70-76,216-220`, `src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:29-32,77-79`.

- Red triangle-alert icon — `DeleteMultipleItemsModal.tsx:80-82`.
- Title: `Catalogue Limit Exceeded` — `:84`.
- Body: `You have <N> catalogues, but your plan allows only <M>. Please select at least <K> catalogue` (plus `s` when `K > 1`) `to delete.` — `:85-89`.
- Live counter: `Selected: <n> / Required: <K>`, green when enough is selected, red otherwise — `:90-98`.
- Each row: checkbox, catalogue name, a status badge, and `Updated: <date> · Created: <date>` — `:101-138`.
- Button: `Delete <n> Catalogue` / `Delete <n> Catalogues`, destructive style, disabled until enough is selected; `Deleting...` while running — `:141-157`.
- This is the only place where plan enforcement **deletes** anything, and the user chooses what goes.

### Builder paywalls (overlays and inline notes)

- `LimitsOverlay`: a blurred overlay over the locked group, lock icon, heading `Upgrade required`, button `Upgrade now` — `src/components/catalogue/inputs/sidebar/LimitsOverlay.tsx:22-50`.
  - Branding variant body: `Make your catalog truly yours. Add your logo and brand details, and customize the header and footer.` then a line break and `Upgrade your plan to unlock this feature.` — `:37-42`.
  - Default body: `Upgrade your plan to unlock this feature.` — `:44`.
  - Locked fields stay visible but are dimmed to 30% opacity and `inert` — `src/components/catalogue/inputs/sidebar/panel/LockedGroup.tsx:26-41`.
- Where it appears: the whole Header tab and the whole Footer tab when the plan has no `branding` (size `lg`, branding copy) — `src/components/catalogue/inputs/sidebar/HeaderTab.tsx:80`, `src/components/catalogue/inputs/sidebar/FooterTab.tsx:76`; three General-tab groups when there is no `branding` — `src/components/catalogue/inputs/sidebar/GeneralTab.tsx:72,94,141`; four Appearance-tab groups when there is no `advancedAppearance` — `src/components/catalogue/inputs/sidebar/AppearanceTab.tsx:44,174,190,203,221`; and the section form for a locked section type — `src/components/catalogue/modals/content/BlockConfigForm.tsx:49`.
- Newsletter switch, when the plan has no `newsletter`: the switch is dimmed and `inert`, and under it an amber pill reads `Upgrade your plan for the newsletter form.` — `src/components/catalogue/inputs/sidebar/footer/InteractionSection.tsx:62-83`.
- Analytics tags, when the plan has no `integrations.tracking`: an amber pill reads `Upgrade your plan to connect your own analytics.` — `src/components/catalogue/inputs/sidebar/general/TrackingSection.tsx:134-138`.
- Section-type picker: a locked type keeps a padlock icon plus the screen-reader text `(upgrade required)`, and stays selectable so the form can explain why — `src/components/catalogue/modals/content/SectionTypePicker.tsx:27-31,79-87`. The five options are labelled `Items`, `Text`, `Divider`, `External content`, `Custom visual` — `:17-23`.
- `Create Catalogue` button tooltip at the catalogue limit: `Upgrade to unlock more catalogues and get higher limits.` with a button `View Pricing` → `/pricing` — `src/components/catalogue/create/CreateCatalogueButton.tsx:78-89`.
- Catalogue card → `Change Status` → `Activate` is disabled with the `title` tooltip `Traffic limit reached` when this month's page views have reached the plan's allowance — `src/components/dashboard/overview/ItemDropdownMenu.tsx:101-102,206-219`. Status labels are `Activate`, `Deactivate`, `Save` — `:67-71`.

### Upgrade strips (`UpgradePlanCTA`)

Amber strip with a star tile, a title, a subtitle and a small button — `src/components/general/UpgradePlanCTA.tsx:28-68`.

| Where | Title | Subtitle | Button |
|---|---|---|---|
| Subscription tab, when the plan can still go up | `Upgrade your plan` | `Get more features, higher limits, and premium support.` | `Upgrade plan` → `/pricing` |
| Overview, at the catalogue limit | `You've reached your current catalogue limit` | `Upgrade your plan to get more catalogues, features, and higher limits.` | `Upgrade plan` → `/pricing` |
| Overview, at the traffic limit | `You've reached your traffic limit` | `Upgrade your plan to increase your traffic limit and reactivate your catalogues.` | `Upgrade plan` → `/pricing` |

Evidence: `src/components/dashboard/subscription/PlanDetails.tsx:86-93`, `src/components/dashboard/overview/LimitCTAs.tsx:12-34`.

---

## Where the user sees their current plan, usage and renewal date

### Subscription tab (`?tab=subscription`)

- Page heading `Subscription Overview` with a calendar icon — `src/components/dashboard/Subscription.tsx:29`.
- Plan card: a 48px amber icon tile (a star for Pro/Premium/Growth/custom names, a shield for "enterprise", a lightning bolt otherwise), the plan **name** as an `h2`, the plan **description**, and a green badge reading `Active` — `src/components/dashboard/subscription/PlanDetails.tsx:25-36,99-118`.
- A two-cell definition list:
  - `Price` — the live Paddle price for the plan's current billing period, `…` while loading, `–` if unavailable — `src/components/dashboard/subscription/PlanDetails.tsx:71-82`, `src/components/dashboard/Subscription.tsx:22-25`.
  - `Subscription Cycle` — `monthly` or `yearly` (CSS-capitalised to `Monthly`/`Yearly`), from `billing_period` — `src/components/dashboard/subscription/PlanDetails.tsx:76-81,129`. `billing_period` is derived by matching `users.plan_id` against the tier's `priceId.month` / `priceId.year`, defaulting to `year` — `src/lib/users/my-user-data.ts:76-78,90`.
- **The renewal date and the subscription start date are not shown anywhere in the app.** The code comment says why: they live in `subscriptions`, which the app role cannot read — `src/components/dashboard/subscription/PlanDetails.tsx:45-48`. The only place to see a renewal date is Paddle's customer portal.
- `Plan Features` card: the five limit figures (`Catalogues`, `Sections per catalogue`, `Items per catalogue`, `Page views / month`, `AI credits / month`), then three groups of included/not-included rows — `src/components/dashboard/subscription/PlanFeatures.tsx:31-33,45-59`, labels at `src/constants/pricing.ts:49-80`.
  - Group `Design`: `Standard themes`, `Advanced styling`, `Custom branding` — `src/constants/pricing.ts:86-97`.
  - Group `Section types`: `Items`, `Text`, `Divider`, `External content`, `Custom visual` — `src/constants/pricing.ts:98-107`.
  - Group `Growth & support`: `Analytics`, `Your own analytics tags`, `Newsletter sign-ups`, `Support`, `Custom features` — `src/constants/pricing.ts:108-131`.
  - Included rows get an amber tick; excluded rows a grey minus, with the screen-reader words `Included` / `Not included`; a string value (e.g. `Basic`, `Email support`) is printed right-aligned — `src/components/dashboard/subscription/PlanFeatures.tsx:69-106`.
- Empty state (if no plan resolves): icon, `No Subscription Plan Found`, `You haven't selected a Subscription plan yet. Choose a plan to get started.`, button `View Available Plans` → `/pricing` — `src/components/dashboard/subscription/PlanDetails.tsx:56-68`. In practice unreachable: an unmatched `plan_id` makes the whole user-data load fail with `no_plan` instead — `src/lib/users/my-user-data.ts:67-74`.

### Usage tab (`?tab=usage`)

- Heading `Usage Overview`, lead `Monitor your resource consumption and track usage across all features` — `src/components/dashboard/MonthlyUsage.tsx:98-101`.
- Up to three gauge cards: `Traffic` (unit `views`), `Catalogues` (unit `catalogues`), `AI Credits` (unit `credits`, hidden when the plan has 0 credits) — `src/components/dashboard/MonthlyUsage.tsx:69-94`.
- Each card: a semicircular arc, the percent as a big number, `of limit` (or `over limit` when past it) under it, and `<used> / <limit> <unit>` below — `src/components/charts/GaugeChart.tsx:82-95`.
- Status badges on the card: `Near limit` at ≥ 80%, and at 100% either `Limit reached` or `<N> <unit> over` — `src/components/dashboard/MonthlyUsage.tsx:39-50`, thresholds `src/components/charts/GaugeChart.tsx:19-24`.
- Section aria-label: `Usage against your plan limits` — `src/components/dashboard/MonthlyUsage.tsx:103`.
- The pricing FAQ points here: `You can follow your usage from the Usage tab in your dashboard.` — `src/constants/pricingFaqs.ts:32`.

### AI credits in the builder

- A ring button in the chat header, aria-label `AI credits: <used> of <limit> used. Show details.`, `title` `<N> AI credits left` — `src/components/catalogue/chat/CreditMeter.tsx:112-114`.
- The popover shows the credits **left** in the middle of a ring, the label `AI credits`, the line `<used> of <limit> used` (plus ` · <N> over`), and the explainer `A question is free. A change costs 2 plus one per extra task. Resets at the start of each month.` — `src/components/catalogue/chat/CreditMeter.tsx:128-161`, the `2` from `CREDITS.agentBase` at `src/lib/ai/pricing.ts:10`.
- Status notes: at ≥ 75% `Running low - the assistant still works.`; at 100% `You are out until the month resets.` — `src/components/catalogue/chat/CreditMeter.tsx:24-34`.
- The meter is hidden when the plan's `ai_credits` is 0 or not finite — `src/components/catalogue/chat/CreditMeter.tsx:101`.

---

## Invoices and receipts

- Paddle is the merchant of record and **Paddle sends the receipts** — `src/constants/pricingFaqs.ts:47-49` (`Paddle runs the secure checkout, charges any sales tax or VAT that applies in your country, and sends your receipts.`), and `src/constants/details.ts:132` (`they run the checkout, charge any sales tax or VAT that applies where you are, and send your receipts`).
- The user reaches them through `Manage subscription` → the Paddle customer portal; the card text is `Update billing details, check transactions or cancel subscription.` — `src/components/dashboard/subscription/PlanDetails.tsx:139-141,150-161`, portal URL at `src/components/dashboard/Subscription.tsx:11-12`.
- **Quicktalog itself issues no invoice and stores no card data**: `For your security and PCI DSS compliance, we never store or have access to your credit card details. All payment information is securely processed by Paddle.com.` — `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:90-94`.
- Refund requests should carry the Paddle receipt or transaction id — `src/app/(site)/(with-footer)/refund-policy/page.tsx:50`.

---

## Refunds, in plain words

From `src/app/(site)/(with-footer)/refund-policy/page.tsx` (page title `Refund Policy for Quicktalog`, last updated `2026-09-29` — `:138-140`):

- There is a **10-day money-back guarantee** on Quicktalog software purchases and subscription plans — `:14,17-20`.
- It covers the **first purchase** only. It does not cover renewals, upgrades, or further purchases made after the initial 10-day period — `:21-26`.
- Two ways to ask: Paddle's buyer support at `paddle.net` (fastest, as Paddle is the merchant of record — have the receipt or transaction id ready), or Quicktalog support by email with the purchase details, and they will start the refund through Paddle — `:36-62`.
- Requests must be in within **10 days** of the original purchase date — `:63-66`.
- Once approved, Paddle refunds the original payment method; allow **5-10 business days** for it to show — `:75-80`.
- After a successful refund, access to the refunded product or subscription is **terminated** — `:81-85`.
- Not refundable: anything asked for after the 10 days; **renewals are generally non-refundable** (manage the subscription before the renewal date); anything sold as explicitly non-refundable — `:92-106`.
- Lead line on the page: `At Quicktalog, we want you to be completely satisfied with your purchase. We offer a straight-forward refund policy to ensure your peace of mind.` — `:136`.
- The pricing FAQ repeats it: `Your first purchase is covered by a 10-day money-back guarantee. Ask Paddle's buyer support at paddle.net, or email us at <support address> within 10 days of purchase.` — `src/constants/pricingFaqs.ts:44`.

---

## Every user-visible message in this area

### Toasts and alerts

| Text | Cause | Evidence |
|---|---|---|
| `You currently have this plan` (browser alert) | Starting a checkout for the plan you already have | `src/hooks/usePlanCheckout.ts:42` |
| `Checkout is still loading. Please try again in a moment.` (alert) | Paddle.js not loaded yet | `src/hooks/usePlanCheckout.ts:47` |
| `We couldn't start the checkout. Please try again in a moment.` (alert) | Any thrown error while starting the checkout | `src/hooks/usePlanCheckout.ts:68` |
| `Unauthorized` (alert) | Checkout attempted without a valid session | `src/lib/paddle/checkout.ts:23` |
| `Unknown plan` (alert) | A price id not present in `tiers` | `src/lib/paddle/checkout.ts:24` |
| `Could not start checkout` (alert) | Paddle transaction creation failed | `src/lib/paddle/checkout.ts:37` |
| `You have reached the catalogue limit of your plan` | `createCatalogue` with the catalogue quota full | `src/actions/catalogue.ts:273-278`; surfaced by `src/hooks/useCreateCatalogue.ts:36` |
| `Your plan allows <N> sections per catalogue` | A save/publish that *adds* sections past the limit | `src/lib/entitlements/plan.ts:133-137` |
| `Your plan allows <N> items per catalogue` | A save/publish that *adds* items past the limit | `src/lib/entitlements/plan.ts:142-145` |
| `Divider sections are not part of your plan` | A save that adds a divider block on a plan without it | `src/lib/entitlements/plan.ts:156-165`, labels `../quicktalog-packages/src/helpers/plan-fit.ts:38-40` |
| `External content sections are not part of your plan` | Same, for an `embedding` block | same |
| `Custom visual sections are not part of your plan` | Same, for a `custom_visual` block | same |
| `This month's traffic limit for your plan is reached` | Publishing or re-activating when this month's page views ≥ the allowance | `src/lib/entitlements/plan.ts:90-95` |
| `Remove <X> item(s), <Y> section(s) and the <Type> sections to fit the <Plan> plan.` | Publishing or re-activating a catalogue that does not fit the plan | `../quicktalog-packages/src/helpers/plan-fit.ts:97-120`; returned by `src/lib/entitlements/plan.ts:82-84` |
| `Could not activate this catalogue.` | Fallback when the server gave no reason on activation | `src/components/dashboard/Overview.tsx:111-115` |
| `Failed to update status. Please try again.` / `Failed to update status.` | Non-activation status change failed | `src/components/dashboard/Overview.tsx:111-115,124` |
| `Could not duplicate this catalogue. Your plan may not allow another one.` with an action button `View plans` | `duplicateItem` returned null (quota, content over plan, or missing source) | `src/hooks/useDuplicateCatalogue.ts:55-63`, server `src/actions/catalogue.ts:204,221` |
| `<reason>. Your changes are still here.` | The pre-upgrade draft save was refused | `src/hooks/useUpgrade.ts:21-23` |
| `Catalogue published successfully` / `Catalogue updated successfully` | Publish succeeded (new / already live) | `src/components/catalogue/builder/useBuilderActions.ts:117,130` |
| `Failed to publish catalogue` / `Failed to update catalogue` | Publish error without a server reason | `src/components/catalogue/builder/useBuilderActions.ts:119,138` |
| `Failed to save catalogue` | Save error without a server reason (plan reasons come through here verbatim) | `src/components/catalogue/builder/useBuilderActions.ts:58,63` |
| `Stopped - you are out of AI credits for this month. Everything ticked above is already in your draft.` | Quick AI halted a plan for want of credits | `src/components/catalogue/chat/PlanChecklist.tsx:19-20` |
| `Running low - the assistant still works.` | AI credits ≥ 75% used | `src/components/catalogue/chat/CreditMeter.tsx:26` |
| `You are out until the month resets.` | AI credits 100% used | `src/components/catalogue/chat/CreditMeter.tsx:27` |
| `Traffic limit reached` (menu tooltip) | `Activate` disabled on a catalogue card | `src/components/dashboard/overview/ItemDropdownMenu.tsx:206,218` |
| `Near limit` / `Limit reached` / `<N> <unit> over` (usage badges) | Usage gauge at ≥ 80% / 100% / over | `src/components/dashboard/MonthlyUsage.tsx:39-50` |

### FAQ answers the docs can reuse verbatim

Pricing FAQ, section title `Questions about plans and billing` — `src/app/(site)/(with-footer)/pricing/page.tsx:50-56`, items `src/constants/pricingFaqs.ts:20-51`:

- `Is the Starter plan really free?` → `Yes. Starter includes 1 catalogue with up to 5 sections and 15 items, 500 page views a month, all 9 standard themes, the QR code editor and email support, with no time limit. You don't need a credit card to sign up.` — `:22-24` (numbers interpolated from `tiers` and `themes`).
- `Which plans include Quick AI?` → `Every plan comes with a monthly allowance of AI credits for Quick AI in the builder: Starter 15, Basic 50, Pro 150, Growth 300, Premium 600. Asking the assistant a question is free.` — `:9-11,26-28`.
- `What counts as a page view?` → `Every time someone opens one of your catalogue pages. The allowance is shared across all your catalogues and resets each month. You can follow your usage from the Usage tab in your dashboard.` — `:30-33`.
- `What happens when I reach a limit?` → `It depends on the limit. Page views: once your catalogues together reach your plan's monthly allowance (Starter 500, Basic 2,000, Pro 5,000, Growth 15,000, Premium 40,000), they are paused and go offline. You can publish them again from your dashboard once the allowance resets next month, or right away after upgrading. Catalogues, sections and items: when you try to add more than your plan allows, Quicktalog shows you what the next plan unlocks so you can decide whether to upgrade, and everything you have already published stays as it is.` — `:12-17,35-37`.
- `Can I change or cancel my plan?` → `Yes. Paid plans start with Basic. You can upgrade or cancel from the Subscription tab in your dashboard. Cancel before your renewal date, because renewals are generally not refundable.` — `:8,39-41`.
- `How does the money-back guarantee work?` → `Your first purchase is covered by a 10-day money-back guarantee. Ask Paddle's buyer support at paddle.net, or email us at <support address> within 10 days of purchase. The refund policy has the details.` — `:43-45`.
- `Who handles payments and taxes?` → `Paddle is our merchant of record. Paddle runs the secure checkout, charges any sales tax or VAT that applies in your country, and sends your receipts. Prices on this page are shown in US dollars, and Paddle may show local prices at checkout.` — `:46-50`.

Site FAQ (`src/constants/details.ts`):

- `What is included in the free Starter plan?` → `The free plan gives you 1 catalogue with up to 5 sections and 15 items, 500 page views a month, 15 AI credits a month, all 9 themes, the QR code editor, analytics and email support. There is no time limit and no credit card required. Branding controls like your logo, contact details and a custom header and footer start on the first paid plan.` — `:115-116`.
- `How do AI credits work?` → `Every plan includes a monthly allowance of credits for Quick AI, from 15 on the free plan up to 600 on Premium. Asking for a change costs 2 credits however many edits it takes, and asking a question costs nothing. The allowance resets at the start of each month and unused credits do not carry over. You can see what is left in the chat panel and in the Usage tab of your dashboard.` — `:120-121`.
- `What happens when I reach a limit?` → `It depends on the limit. Page views are the only one your customers notice: when your catalogues together use the month's allowance they go offline, and you can put them back online next month or straight away after upgrading. Running out of catalogues, sections or items simply stops you adding more, and everything already published stays as it is. Running out of AI credits pauses Quick AI, while the rest of the builder keeps working.` — `:125-127`.
- `Can I change or cancel my plan, and how are payments handled?` → `You can upgrade, downgrade or cancel at any time from the Subscription tab in your dashboard. Paddle is our merchant of record: they run the checkout, charge any sales tax or VAT that applies where you are, and send your receipts. Your first purchase is covered by a 10-day money-back guarantee, and renewals are generally not refundable, so cancel before your renewal date.` — `:131-132`.

### Feature explainer dialog (the little "i" next to a plan feature)

- Title is derived: `traffic-limit` → `Traffic Limit Explained`, `advanced_styling` → `Advanced Styling Explained` — `src/constants/pricing.ts:194-200`.
- Button to close: `Got it!` — `src/components/pricing/FeatureInfoDialog.tsx:37`.
- Explainer texts live at `src/constants/pricing.ts:160-189`. Notable ones:
  - `traffic-limit`: `Monthly page view allowance across all your catalogs. This counts every time someone visits your catalog pages. Higher limits accommodate more customer traffic.` — `:167-168`.
  - `ai-catalogue-generation`: `AI assistance that helps create & edit your digital catalogues. Describe your services and the AI generates professional descriptions and organizes items into sections for your catalog.` — `:173-174`.
  - `sections_and_items`: `The number of sections allowed in each catalogue. Higher tiers allow more for complex menus or product lists.` — `:179-180`.
  - `items_per_catalogue`: `The total number of items allowed in each catalogue, across all its sections.` — `:181-182`.
  - `advanced_styling`: `Create your own color themes instead of picking a standard one, and fine-tune fonts, text size, corner radius, shadows, overlays, the glass effect and a custom page background (photo, gradient or colour).` — `:183-184`.
  - `analytics_tags`: `Connect your own Google Analytics or Meta Pixel to a catalogue to track visits in your own tools.` — `:185-186`.
  - `custom_branding`: `Control over the visual branding of your catalogues, including logo upload, legal information, partners and contact information represent your business in the best possible way.` — `:187-188`.
  - `support`: `Technical assistance when you need help. Email support provides responses within 24-48 hours. Priority Support includes email, live chat, and scheduled calls for immediate assistance.` — `:161-162`.
  - `analytics`: `Track visitor engagement on your catalogs. Basic analytics show page views and visitor counts. Advanced analytics provide detailed insights on popular services and visitor behavior patterns.` — `:165-166`.
  - Unknown key fallback: `Information about this feature.` — `:191-192`.

### Custom-plan strips

- Pricing page: title `Need more than Premium?`, description `More catalogues, higher traffic or a feature built for your business. Tell us what you need and we will put together a custom plan.`, features `Higher limits`, `Custom features & integrations`, `Priority support`, button `Talk to us` → `/contact?subject=custom-plan` — `src/components/pricing/PricingPlans.tsx:151-164`, features `src/constants/pricing.ts:344-348`.
- Home page default: title `Need something custom? We've got you covered.`, features `Unlimited catalogs`, `Custom branding`, `Advanced analytics`, `Priority support`, button `Get Started` → `/contact` — `src/components/pricing/MiniCTA.tsx:22-31`, features `src/constants/pricing.ts:338-343`.
- Pricing page bottom CTA band: title `Start free. Upgrade when you're ready.`, description `Publish your first catalogue in minutes on the Starter plan. Move to a paid plan whenever you need more room, branding or more AI credits.`, buttons `Create your catalogue` and `Try the demo`, checks `No credit card required`, `Cancel anytime`, `10-day money-back guarantee` — `src/app/(site)/(with-footer)/pricing/page.tsx:58-80`.

---

## Surprising behaviour (money, catalogues going offline, grace periods, failed payments)

- **An upgrade is a full new purchase, not a proration.** Changing plan opens a new checkout at the new plan's full price; the old subscription is then cancelled `immediately` through the Paddle API. The app neither requests nor applies any credit for the unused part of the old period — `src/hooks/usePlanCheckout.ts:51-66`, `src/actions/paddle.ts:13-15`, `docs/architecture/billing.md` ("Plan changes").
- **A failed cancel of the old subscription is never noticed**, so the user can end up paying for two subscriptions — `src/utils/paddle/process-webhook.ts:255-257`, `docs/architecture/billing.md` ("Not handled").
- **Hitting the monthly page-view allowance takes paid users' catalogues offline automatically.** The Cloudflare cron sets *every* active catalogue of that user to `inactive` once this month's page views reach the plan's `traffic_limit` — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:143-158`.
  - It runs at **03:00, 11:00 and 19:00 UTC** daily (the 03:00 run also does analytics ingestion) — `../quicktalog-backend/wrangler.jsonc` (`"crons": ["0 3 * * *", "0 11,19 * * *"]`), `../quicktalog-backend/src/index.ts:30-47`.
  - **Free (Starter) users are excluded from this traffic sweep**: step 1 selects only users whose `plan_id` is not the Starter monthly price — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126-129`. A Starter user over 500 views keeps their catalogue live until something else switches it off — but they cannot re-publish or re-activate it, because the app refuses that at the limit (`src/lib/entitlements/plan.ts:86-95`).
- **A catalogue that no longer fits the plan is switched off by the same cron, for every user including free ones** — too many items, too many sections, or any gated block type the plan lacks — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:52-113,162-163`.
- **Nothing emails the user when the cron takes a catalogue offline.** It only logs `catalogue_over_plan` and revalidates the cached page — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:109-111,165-178`.
- **Cancelling drops you to Starter, which allows 1 catalogue**, so everything beyond the most recently updated one goes offline immediately when Paddle's cancel event lands — `src/lib/entitlements/catalogue.ts:100-116`, `src/utils/paddle/process-webhook.ts:206-210`.
- **An un-dismissable deletion dialog.** If the number of catalogues (any status) still exceeds the plan, the dashboard overview opens `Catalogue Limit Exceeded` on every visit and the only way out is to delete catalogues — `src/components/dashboard/Overview.tsx:70-76`, `src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:29-32`.
- **Branding, newsletter, advanced styling and analytics-tag settings are wiped, not just hidden, on a downgrade** — the stored JSON is rewritten — `src/lib/entitlements/catalogue.ts:118-167`.
- **There is no grace period anywhere.** No code path delays a downgrade, keeps a plan alive after cancellation, or gives extra days.
- **Failed payments are not handled.** The webhook routes only `subscription.created`, `subscription.updated`, `subscription.activated`, `subscription.canceled`, `customer.created` and `customer.updated`; everything else, including payment failure and `past_due`, hits `default` and is only logged as `Unhandled event type: <name>` — `src/utils/paddle/process-webhook.ts:64-79`. In practice the plan simply stays until Paddle eventually cancels the subscription, at which point the normal downgrade + email runs.
- **`subscription.updated` with a new price does not change the plan.** A plan swapped on the Paddle side leaves `plan_id` alone; a later cancel of that subscription lands in the "unexplained" branch and changes nothing, with only a Sentry warning — `docs/architecture/billing.md` ("Not handled"), `src/lib/paddle/downgrade.ts:24`, `src/utils/paddle/process-webhook.ts:237-251`.
- **AI credits do not carry over**; they are a per-UTC-month sum and reset at the start of each month — `supabase/migrations/20260926120000_ai_credits_ledger.sql:157-158,162-163`, `src/constants/details.ts:121`.
- **An AI turn is charged before the model runs**, so a request killed by the 60s route limit stays charged; a refund is an explicit decision — `src/lib/ai/metering.ts:35-39`.
- **A free-plan catalogue may be used in Quicktalog's marketing.** `If you are on a free plan, you additionally grant us a non-exclusive, royalty-free license to display, reproduce, and reference your catalog (including its name, appearance, and publicly visible content) in our marketing materials, website, social media, and other promotional channels … You can opt out of this at any time by upgrading to a paid plan or by contacting us at <support address>.` — `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:247-256`.
- **Content already over the limit can still be edited, just not grown.** `contentWithinPlan` refuses a save only when the save *adds* sections, items or a gated block type, so a downgraded catalogue can be trimmed one save at a time — `src/lib/entitlements/plan.ts:99-166`.
- **Duplicating is judged from scratch**: a copy must fit the plan entirely, so an over-limit catalogue cannot be duplicated even though it can still be saved — `src/actions/catalogue.ts:218-221`.
- **Publishing needs both checks to pass**: the catalogue must fit the plan completely *and* the month's traffic allowance must not be used up — `src/lib/entitlements/plan.ts:77-97`, `src/actions/catalogue.ts:453-458`.

---

## Layout facts for drawing the screens

### The limit dialog

- Built on the alert dialog, size `md` → `max-width: 600px`, `width: calc(100vw - 24px)`, `max-height: calc(100dvh - 24px)`, `padding: 24px`, a vertical flex column with `14px` gaps, scrolls inside itself, text left-aligned — `src/components/modals/AppDialog.tsx:15,31-46`.
- Top row: a 46px rounded-14px amber icon tile (`bg-product-primary-soft`, `text-product-primary-ink`, 22px icon) on the left, a 40px round close button on the right — `src/components/modals/AppDialog.tsx:64-93`, `src/components/modals/limits/LimitsModalHeader.tsx:19-20,35-55`.
- Title: heading font, `text-xl`, bold, `tracking-[-0.02em]` — `src/components/ui/alert-dialog.tsx:94`.
- Description: `text-sm` here (overriding the default `15px`), muted accent colour — `src/components/modals/limits/LimitsModalHeader.tsx:63`, `src/components/ui/alert-dialog.tsx:114`.
- Comparison strip: a `rounded-2xl` bordered box, `padding: 14px`, `gap: 10px`, three children — left column, a 20px right-arrow in amber ink, right column. Each column: `11.5px` bold muted label, then a `28px` extra-bold heading-font number (amber ink when it is the required plan), then a `12.5px` line `<unit> · <plan name>` — `src/components/modals/limits/LimitUpgradeComparison.tsx:34-52,106-130`.
- Gain box: `rounded-2xl`, amber-tinted border (`border-product-primary/40`) and soft amber background, `padding: 14px`; a `text-sm` bold heading, then the tick list — `src/components/modals/limits/LimitUpgradeComparison.tsx:132-149`.
- Tick list: `grid gap-2`; each row is `padding-left: 26px` with an 18px amber-soft disc at `left: 0; top: 2px` holding an 11px check, ringed `ring-1 ring-product-primary/35`; row text is `text-sm` accent, with `<b>`/`<strong>` in full foreground — `src/components/modals/limits/TickList.tsx:7-22`.
- Footer: a single right-aligned button; it is full-width below 520px and auto-width from 520px up — `src/components/modals/limits/LimitUpgradeComparison.tsx:151-173`, same breakpoint rule as `AppDialogFooter` — `src/components/modals/AppDialog.tsx:49-62`.

### The plan screen (Subscription tab)

- The dashboard is a two-column shell: a sidebar plus a rounded panel with `border`, `bg-product-card/70`, padding `16px` → `28px` (md) → `36px` (lg) — `src/components/dashboard/Dashboard.tsx:129-139`.
- Tabs, in sidebar order: `Overview`, `Subscription`, `Usage`, `Settings`, `Support` — `src/constants/dashboard.tsx:10-16`. Any unknown `?tab=` falls back to `overview` — `:21-25`.
- Upgrade strip (when shown) sits above everything: amber gradient, `rounded-product-card`, amber border, `18px × 16px` padding, a 40px round amber circle with a 19px star, then title/subtitle, then a small button; it wraps at `220px` — `src/components/general/UpgradePlanCTA.tsx:28-68`.
- Plan card: `rounded-product-card`, `border`, `bg-product-card`, `shadow-product`, padding `20px` (`24px` from md), `margin-bottom: 18px`, column with `16px` gaps — `src/components/dashboard/subscription/PlanDetails.tsx:95-98`.
  - Header row wraps: 48px amber tile (15px radius, 22px icon) · name + description (flex-basis 200px) · a green `Active` badge — `:99-118`.
  - Details list: a **two-column** grid of hairline-separated cells (`gap-px` over a border-coloured background), each cell `14px × 12px`, with a `12.5px` semibold muted term and a `15px` bold heading-font value that is CSS-capitalised — `:120-134`.
  - Manage row: `rounded-2xl`, bordered, `bg-product-background`, `16px × 14px`, text block (flex-basis 240px) on the left and the small outline button on the right — `:136-163`.
- Plan Features card: same card frame; a `grid-cols-2` → `sm:grid-cols-3` → `xl:grid-cols-5` row of five limit tiles (`rounded-[14px]`, `bg-product-background-hero`, `14px × 12px`; `12px` term, `18/20px` extra-bold tabular number), the last tile spanning two columns on the narrowest grid — `src/components/dashboard/subscription/PlanFeatures.tsx:26-59`.
  - Below it, three feature groups in `xl:grid-cols-3`; each has a `12px` bold muted title and a divided list whose rows are at least 36px tall, with a 20px amber tick disc or a 20px grey minus disc — `:61-112`.

### The pricing page

- Starter card (`mode="starter"`): one wide card, `rounded-product-card`, 1.5px amber-ish border, a left-to-right white→cream gradient, padding `22px/26px` (`36px/32px` from lg), a decorative 380px amber radial glow at the top right, and a `lg` three-column grid `260px | 1fr | 220px`. Inside: the pill `Free forever`, a `26px` plan name in amber ink, the description, then the price at `44px` — `src/components/pricing/PricingColumn.tsx:131-165`.
- Paid cards: a `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-4` grid with `18px` gaps; each card `max-width: 384px` below md, full-height flex column, lifts 4px on hover. The popular one gets an amber ring and the floating `Most popular` pill 13px above its top edge. Name at `22px`, description with `min-height: 3.1em`, price at `42px`, then the CTA, then a `Features` heading and the tick list — `src/components/pricing/PricingPlans.tsx:85-114`, `src/components/pricing/PricingColumn.tsx:168-210`.
- Feature lines: amber 18px tick disc + `14.5px` accent text; features with an explainer get a 14px `Info` button glued to the last word so it never wraps alone, aria-label `What does <text> mean?` — `src/components/pricing/FeatureItem.tsx:16-41`, `src/components/pricing/PlanCheck.tsx:4-11`.
- Card feature order is fixed: the five limit lines first (any whose value is `0` is dropped), then the highlight lines — `src/constants/pricing.ts:146-158`. Starter adds two extra lines: `All 9 standard themes` and `QR code editor & shareable link` — `src/constants/pricing.ts:331-334`.
- Billing toggle: a 260px pill, `rounded-full`, 1px border, 4px padding, with a sliding amber thumb of `calc(50% - 4px)` that translates on `yearly`; group aria-label `Billing cycle`, buttons use `aria-pressed` — `src/components/pricing/BillingToggle.tsx:22-46`.
- Comparison table: horizontally scrollable card, `min-width: 760px`, `table-fixed`, first column sticky at `150px` (`260px` from md) with a 1px right shadow; cells `14px × 13px` with a bottom border; the Pro column is tinted `bg-product-primary-soft/50` and its header carries a 3px amber top inset plus the small `Most popular` label; `Included` renders as a 22px amber tick disc and `Not included` as a bold `–` — `src/components/pricing/ComparisonTable.tsx:20-25,27-50,86-101,114-137`.
  - Column header row starts with `Features`; the first body row is `Price` — `src/components/pricing/ComparisonTable.tsx:104-113,141-144`.
  - Group headings, in order: `Usage limits`, `Design & branding`, `Section types`, `Quick AI`, `Sharing & insights`, `Support` — `src/constants/pricing.ts:217-327`.
  - Row labels and hints are in `src/constants/pricing.ts:219-327`, e.g. `Standard themes (9)`, `Custom branding` / hint `Logo, contact details, metadata, custom header & footer`, `Advanced styling` / `Your own colour themes, fonts, shapes, glass & background`, `Divider section` / `A visual separator with adjustable spacing and border`, `External content section` / `Maps, video, booking widgets`, `Custom visual section` / `Banners, animations and interactive objects you design yourself`, `AI credits per month` / `Quick AI in the builder and the description writer`, `QR code editor` / `PNG, SVG, JPEG downloads`, `Your own analytics tags` / `Connect your Google Analytics or Meta Pixel to a catalogue`, `Custom features on request`.
  - Below the table on small screens: `Swipe the table to see every plan` with a right arrow — `src/components/pricing/ComparisonTable.tsx:233-236`.
  - Section heading above it: eyebrow `Compare plans`, title `Every feature, side by side`, description `All limits apply per account. Page views are counted across all your catalogues each month.` — `src/components/pricing/PricingPlans.tsx:136-143`.

### Usage gauge

- 180px wide, a semicircle drawn `M10 60a50 50 0 0 1 100 0` with `stroke-width: 11` and `pathLength=100` so the dash is a straight percent; the arc stops at 100% while the number keeps going — `src/components/charts/GaugeChart.tsx:13,39-80`.
- Centre: a `30px` extra-bold tabular percent with `of limit` / `over limit` in `12px` muted under it; below the arc, `<used> / <limit> <unit>` in `14px` with the used figure bolder — `src/components/charts/GaugeChart.tsx:82-95`.
- Arc colour: foreground (normal), amber (warning ≥ 80%), error red (critical ≥ 100%). Card border/background shift to amber or red to match — `src/components/charts/GaugeChart.tsx:32-36`, `src/components/dashboard/MonthlyUsage.tsx:25-32`.
- Role `meter` with `aria-valuetext` `<used> of <limit> <unit>, <percent>%` — `src/components/charts/GaugeChart.tsx:50-57`.

### AI credit ring

- Header button 44px (36px from md), containing an 18px ring with `stroke-width: 3`; the popover ring is 96px with `stroke-width: 9` and holds the remaining credits as a `20px` extra-bold number with `left` under it. Popover is 256px wide, `z-[1100]`, aligned to the end with an 8px offset — `src/components/catalogue/chat/CreditMeter.tsx:108-135,121-126`.

---

## Plan comparison table

Everything below comes from `../quicktalog-packages/src/constants/pricing.ts` (line numbers in the
"Every limit and feature" section above). Prices are not in the codebase — they come from Paddle at
runtime.

| | Starter | Basic | Pro | Growth | Premium |
|---|---|---|---|---|---|
| Who it's for | Perfect for individuals and small businesses getting started. | Perfect fit for small businesses to digitalize their offer. | Ideal for growing businesses with multiple services. | Built for teams that need advanced features and analytics. | Enterprise-grade solution with unlimited possibilities. |
| Price | Free (`$0`) | from Paddle, monthly or yearly | from Paddle, monthly or yearly | from Paddle, monthly or yearly | from Paddle, monthly or yearly |
| Billing periods | n/a (same price id for month and year) | Monthly or Yearly | Monthly or Yearly | Monthly or Yearly | Monthly or Yearly |
| Catalogues | 1 | 1 | 6 | 20 | 50 |
| Sections per catalogue | 5 | 8 | 15 | 30 | 50 |
| Items per catalogue | 15 | 30 | 100 | 200 | 300 |
| Page views per month | 500 | 2,000 | 5,000 | 15,000 | 40,000 |
| AI credits per month | 15 | 50 | 150 | 300 | 600 |
| Standard themes (9) | Yes | Yes | Yes | Yes | Yes |
| Custom branding | – | Yes | Yes | Yes | Yes |
| Advanced styling | – | – | Yes | Yes | Yes |
| Items section | Yes | Yes | Yes | Yes | Yes |
| Text section | Yes | Yes | Yes | Yes | Yes |
| Divider section | – | Yes | Yes | Yes | Yes |
| External content section | – | – | Yes | Yes | Yes |
| Custom visual section | – | – | Yes | Yes | Yes |
| Shareable link | Yes | Yes | Yes | Yes | Yes |
| QR code editor | Yes | Yes | Yes | Yes | Yes |
| Analytics | Basic | Basic | Basic | Advanced | Advanced |
| Your own analytics tags (GA4 / Meta Pixel) | – | – | – | Yes | Yes |
| Newsletter sign-ups | – | – | – | Yes | Yes |
| Support | Email support | Email support | Email support | Email & Chat support | Priority Support (Email, Chat, Meeting) |
| Custom features on request | – | – | – | – | Yes |

Hidden, assigned by hand, never listed publicly: **German Silva Custom Plan** — 1 catalogue,
20 sections, 200 items, 4,000 page views/month, 50 AI credits/month, custom branding, advanced
styling, all three gated section types, own analytics tags, no newsletter, Basic analytics,
support `Email` — `../quicktalog-packages/src/constants/pricing.ts:161-189`.

---

## Contradictions

1. **`Analytics: Basic` vs `Advanced` is a label with nothing behind it.** `features.analytics` is read in exactly two places, both of which only print it (the comparison row and the plan-features row) — `src/constants/pricing.ts:111,304`. No analytics query, chart or range is gated by plan; every catalogue gets the same 7 / 30 / 90-day analytics page — `src/lib/analytics/traffic.ts:8-10`, no `plan`/`tier` reference anywhere in `src/lib/analytics/*` or `src/components/analytics/*`. The site FAQ agrees with the code and contradicts the plan table: `Every catalogue has its own analytics page on every plan, covering the last 7, 30 or 90 days.` — `src/constants/details.ts:105`. The explainer text promises more for Advanced (`Advanced analytics provide detailed insights on popular services and visitor behavior patterns.`) — `src/constants/pricing.ts:165-166`. **Nothing in the code delivers that.**
2. **Home-page custom-plan strip promises `Unlimited catalogs`**, but no tier has unlimited anything and `getRequiredPlan` tops out at Premium — `src/constants/pricing.ts:338-343`, `../quicktalog-packages/src/constants/pricing.ts:140`, `src/lib/entitlements/required-plan.ts:12-14,45`.
3. **Premium's description says `Enterprise-grade solution with unlimited possibilities.`** while Premium has concrete limits of 50 catalogues / 50 sections / 300 items / 40,000 views — `../quicktalog-packages/src/constants/pricing.ts:137,140-156`.
4. **The pricing FAQ says page views "are paused and go offline" for every plan** (`src/constants/pricingFaqs.ts:36`), and the site FAQ repeats it (`src/constants/details.ts:127`), but the cron that does this **skips Starter users** — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:126-129`. A free user over the allowance keeps their catalogue live (they just cannot re-publish it).
5. **The site FAQ says you can `downgrade … from the Subscription tab`** (`src/constants/details.ts:132`). There is no downgrade control in the app. The Subscription tab has only `Upgrade plan` → `/pricing` and `Manage subscription` → Paddle's portal — `src/components/dashboard/subscription/PlanDetails.tsx:86-93,150-161`. Picking a cheaper plan on `/pricing` is technically possible (nothing blocks it), but it is a **new full-price checkout** with the old subscription cancelled immediately — `src/hooks/usePlanCheckout.ts:51-66`, `src/actions/paddle.ts:13-15`.
6. **Pricing-FAQ wording about limits is softer than the code.** It says `everything you have already published stays as it is` (`src/constants/pricingFaqs.ts:36`), yet the cron takes any active catalogue that no longer fits the plan offline, for every user — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:52-113`.
7. **`AddContentModal.checkLimits()` returns the string `"items"` when the *section* limit is hit** — the value is only used as a truthy flag and the dialog opened is `type="sections"`, so the user sees the right modal, but the code reads as a bug — `src/components/catalogue/modals/AddContentModal.tsx:123-137,266-272`.
8. **`billing_period` for Starter resolves to `month`** because its `month` and `year` price ids are identical, so the free plan's Subscription tab shows `Subscription Cycle: Monthly` — `../quicktalog-packages/src/constants/pricing.ts:9-10`, `src/lib/users/my-user-data.ts:76-78`, `src/components/dashboard/subscription/PlanDetails.tsx:76-81`. The code's own fallback comment assumes `year`.
9. **The refund-policy page has a typo**: `We provide a 10-day money-back guarantee or all Quicktalog software purchases` — "or" should be "for" — `src/app/(site)/(with-footer)/refund-policy/page.tsx:18-19`.
10. **`docs/architecture/billing.md` names the email `CancellationEmail`** and says it lists the catalogues that went offline; the code agrees, but the send function is spelled `sendSubscriptionCancelationEmail` and the file is `CancelationEmail.tsx` (one `l`) — `docs/architecture/billing.md` ("Cancellation"), `src/lib/email/transactional.ts:101`, `src/components/emails/CancelationEmail.tsx:18`. Cosmetic only.
12. **The Terms say you can `cancel a subscription at any time through your account settings`** — `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx:204-206`. There are no account settings that cancel anything: the Settings tab has no billing controls and cancellation happens only in Paddle's portal — `src/constants/dashboard.tsx:14`, `src/components/dashboard/subscription/PlanDetails.tsx:150-161`.
11. **The per-limit `description` strings in `limitContent.ts` are dead copy.** `LimitsModalHeader` renders a fixed description and `LimitUpgradeComparison` never reads `content.description`, so a documented "limit modal body" taken from that file would not match the screen — `src/components/modals/limits/limitContent.ts:87-162` vs `src/components/modals/limits/LimitsModalHeader.tsx:63-67`, `src/components/modals/limits/LimitUpgradeComparison.tsx:55-176`.

---

## Could not confirm

- **The actual money amounts of every plan, monthly and yearly.** `tiers` holds only Paddle price ids and the app fetches amounts from Paddle at runtime (`src/hooks/usePaddlePrices.ts:63-69`). No seed, fixture, migration or doc in either repo contains a dollar figure. Calling the Paddle API was out of scope for this research. Getting them means reading the Paddle dashboard for these ids: Starter `pri_01k27ajepm199twd1x77rpwdrq`; Basic `pri_01k7bm6p3pnskk0k71akh10mp5` (month) / `pri_01k7bme4em8fr22gztzeayny74` (year); Pro `pri_01k277hdtkkb1xdbz6karkqek9` / `pri_01k277q6ftcjfzy9v7xhe6ckdt`; Growth `pri_01k277kkzqz4ef7nc786ssnw6x` / `pri_01k277r7p899gfn5nn3ne87pww`; Premium `pri_01k277mzp3tgy7n5wvrsa5v0sx` / `pri_01k277see7qtyq30kc5g3vyqy9` — `../quicktalog-packages/src/constants/pricing.ts:8-11,40-43,71-74,102-105,133-136`.
- **What the Paddle checkout overlay actually looks like and which fields it asks for.** It is Paddle's hosted overlay, opened with only a `transactionId` and a `successUrl` — nothing about its appearance is in this codebase — `src/hooks/usePlanCheckout.ts:61-66`.
- **The exact cancellation steps and confirmation wording inside Paddle's customer portal.** The app only links out to `https://customer-portal.paddle.com/cpl_01k11h2axbrhg4fzmw2zey50x0` — `src/components/dashboard/Subscription.tsx:11-12`. Whether that portal offers cancel-at-period-end or cancel-now, and what it says, has to be checked in Paddle.
- **Whether an upgrade refunds or prorates the unused part of the old plan.** The app asks Paddle to cancel the old subscription `immediately` and never requests a credit or refund — `src/actions/paddle.ts:13-15`. Whether Paddle itself issues any proration on an immediate cancel is a Paddle-side setting, not visible here. `?`
- **Whether a renewal failure eventually produces a `subscription.canceled` and therefore the downgrade + email.** Payment-failure and `past_due` events are unhandled (`src/utils/paddle/process-webhook.ts:64-79`), so the behaviour depends entirely on Paddle's dunning configuration, which is not in this repo. `?`
- **Whether `Advanced` analytics is meant to unlock something that is not built yet, or is purely marketing.** No gating code exists; the explainer promises behaviour the code does not implement (see Contradictions 1). `?`
- **Whether Starter users are intentionally exempt from the traffic shutdown.** The `.neq("plan_id", tiers[0].priceId.month)` filter in the cron is a deliberate-looking line with a comment that says only "Get all users that are not on the free tier", but nothing explains why — `../quicktalog-backend/src/handlers/subscriptionProcessingJob.ts:125-129`. `?`
- **The exact support-response promise per plan.** The only numbers are in the explainer text (`responses within 24-48 hours` for Email support, `email, live chat, and scheduled calls` for Priority) — `src/constants/pricing.ts:161-162`. Nothing in the code enforces or routes by plan. `?`
- **How a custom plan is actually set up for a customer.** Tier id 5 exists in `tiers` with a Paddle price id, but no admin screen, script or documented procedure for creating one was found. The user-facing route is the contact form (`/contact?subject=custom-plan`) — `src/components/pricing/PricingPlans.tsx:157`. `?`
- **PROD vs TEST differences in the Paddle environment and the portal link.** The Paddle environment comes from `NEXT_PUBLIC_PADDLE_ENV` (sandbox by default) and the customer-portal URL is hard-coded, not environment-aware — `src/utils/paddle/get-paddle-instance.ts:10-13`, `src/components/dashboard/Subscription.tsx:11-12`. Whether the hard-coded portal id is the production one could not be confirmed without reading env values (forbidden). `?`
