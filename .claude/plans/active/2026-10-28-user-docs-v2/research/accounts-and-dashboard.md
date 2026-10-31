# Accounts, sign in and dashboard — research for end-user docs

Read-only research, 2026-10-28. Evidence paths are relative to
`/Users/nikola/Desktop/Quicktalog/quicktalog-app` unless they start with
`../quicktalog-packages`. Nothing was run, queried or changed.

Breakpoints used below: `md` = 720px, `lg` = 960px (Material Tailwind's scale via
`withMT`; confirmed by the navbar matching `lg:flex` against
`(min-width: 960px)` — `src/components/navigation/Navbar.tsx:16`, and by the
sidebar comment "720px and up" on a `md:block` element —
`src/components/dashboard/navigation/DashboardSidebar.tsx:6,15`).

---

## `/auth` — the sign-in / create-account card (shared shell)

- Route: `/auth`, page `src/app/(site)/(with-footer)/auth/page.tsx:15`. Browser tab title "Login & Sign Up - Access Your Quicktalog Account" (`src/constants/metadata.ts:103-104` via `generatePageMetadata("authentication")`, `src/app/(site)/(with-footer)/auth/page.tsx:8`).
- Reached from: navbar "Log In" button (`src/components/navigation/AuthLinks.tsx:168-171`, href `/auth` from `src/constants/navigation.ts:86`), navbar/mobile "Start free" button (`/auth?mode=signup`, `src/constants/navigation.ts:87`, `src/components/navigation/AuthLinks.tsx:55-57,173-178`), the footer link "Create a catalogue" (`src/constants/navigation.ts:107`), and any redirect from a protected page (`src/utils/supabase/session.ts:24-30`).
- Page has the normal site navbar and footer (`src/app/(site)/layout.tsx:10`, `src/app/(site)/(with-footer)/layout.tsx:10-11`).
- Layout: full-height section, faint 44px grid and a centred amber glow, one centred column; top padding clears the fixed navbar (`src/components/auth/common/AuthLayout.tsx:14-25`).
- The card: white, max width 460px, rounded, bordered, 28px top / 30px bottom padding growing to 40px/42px from 480px (`src/components/auth/common/AuthCard.tsx:18`).
- Before the client code runs, an empty pulsing card 520px tall is shown with `aria-label="Loading"` (`src/components/auth/common/AuthSkeleton.tsx:8-16`, used at `src/app/(site)/(with-footer)/auth/page.tsx:21`).
- Mode switch at the top of the card: a 2-up pill group labelled "Account" with buttons "Sign in" and "Create account" (`src/components/auth/common/AuthModeTabs.tsx:42-48`).
- `?mode=signup` opens the "Create account" tab; any other value opens sign-in (`src/components/auth/SupabaseAuthForms.tsx:35,44-46`).
- `?next=<path>` is where the user lands after sign-in; it is sanitised to a same-origin path, falls back to `/admin/dashboard`, and any `/auth…` target other than `/auth/update-password` also falls back (`src/lib/auth/redirects.ts:1,18-44`, used at `src/components/auth/SupabaseAuthForms.tsx:36`).
- Password reset replaces the whole card (no tabs) rather than being a third tab (`src/components/auth/SupabaseAuthForms.tsx:64-65`).
- Arrival errors (`/auth?error=…`) show above the card as a blue "info" notice with an `Info` icon and `role="status"` (`src/components/auth/SupabaseAuthForms.tsx:38,59-63`; `src/components/auth/common/AuthNotice.tsx:16,22-26`). Exact texts (`src/components/auth/common/authMessages.ts:43-51`):
  - `error=link` → "That link is no longer valid. Links can be used once and expire; request a new one below."
  - `error=oauth` → "Google sign-in did not finish. Try again, or use your email and password."
  - `error=recovery` → "Open the reset link from your email again - this page needs the session it creates."
  - `error=config` → "Sign-in is misconfigured on our side, not yours. We have been alerted; please try again shortly."
- Form-level errors are a red box with an `AlertCircle` icon and `role="alert"` (`src/components/auth/common/AuthNotice.tsx:16,21-26`).
- The page is revalidated every 300s and is served from the CDN; only the terms version comes from the server (`src/app/(site)/(with-footer)/auth/page.tsx:13,16`).

## `/auth` — "Sign in" tab

- Title "Welcome back", subtitle "Sign in to your Quicktalog account." (`src/components/auth/forms/SignInForm.tsx:59-62`).
- "Continue with Google" button with the Google logo; while redirecting the label becomes "Opening Google…" and the button is disabled (`src/components/auth/common/GoogleButton.tsx:47-59`).
- Under the Google button: "By continuing you agree to our Terms & Conditions, Privacy Policy and Refund Policy" (notice on, `src/components/auth/forms/SignInForm.tsx:63`; text `src/components/auth/common/GoogleButton.tsx:62-64`; the three names and order from `src/constants/legal.ts:5-24` rendered "A, B and C" by `src/components/auth/common/LegalLinks.tsx:16-22`). All three open in a new tab (`src/components/auth/common/LegalLinks.tsx:18`).
- Divider with the word "or" (`src/components/auth/common/AuthDivider.tsx:6`).
- Field **Email**: label "Email", `type="email"`, `inputMode="email"`, `autoComplete="username"`, placeholder "name@company.com", required, no max length (`src/components/auth/forms/SignInForm.tsx:67-77`). Required/format enforcement is the browser's only (HTML `required` + `type=email`); there is no Zod schema for sign-in — `src/constants/schemas.ts` holds only the contact and QR schemas.
- Field **Password**: label "Password", `type="password"`, `autoComplete="current-password"`, placeholder "••••••••", required, no min length on this field (`src/components/auth/forms/SignInForm.tsx:78-96`).
- Beside the password label: a text button "Forgot password?" that swaps the card to the reset view (`src/components/auth/forms/SignInForm.tsx:79-87`, `src/components/auth/SupabaseAuthForms.tsx:84`).
- Every password input has an eye toggle with `aria-label="Show password"` (`src/components/auth/common/AuthField.tsx:64-75`).
- Cloudflare Turnstile widget sits above the submit button when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set; the submit button is disabled until it produces a token, and the token is reset after each attempt (`src/components/auth/common/useTurnstile.tsx:6,39-58`, `src/components/auth/forms/SignInForm.tsx:97,102`, `46`).
- Submit button "Sign in"; while working it shows a spinner and the label "Signing in…" and is disabled (`src/components/auth/forms/SignInForm.tsx:98-106`, `src/components/auth/common/SubmitButton.tsx:19-36`).
- Below the form, when the captcha is present: "Protected by Cloudflare Turnstile against bots." with a shield icon (`src/components/auth/forms/SignInForm.tsx:108-113`).
- Under the card: "New to Quicktalog? Create a free account" (the link switches tabs in place) (`src/components/auth/SupabaseAuthForms.tsx:87-96`).
- On success: `router.replace(next)` — no toast, no confirmation screen (`src/components/auth/forms/SignInForm.tsx:54`). The auth provider refreshes the server components itself (`src/components/auth/forms/SignInForm.tsx:53`, `src/components/auth/session/SupabaseAuthProvider.tsx:66-71`).
- Sign-in runs in the browser against Supabase, so rate limits are per end-user IP (`src/components/auth/forms/SignInForm.tsx:39-45`; rationale `src/components/auth/SupabaseAuthForms.tsx:17-19`).
- Error texts (mapped from GoTrue codes, `src/components/auth/common/authMessages.ts:16-39`):
  - wrong email/password → "That email and password do not match an account."
  - unconfirmed email → "Confirm your email address first - the link is in your inbox."
  - captcha failed → "The anti-bot check did not pass. Try again."
  - too many attempts → "Too many attempts. Wait a few minutes and try again."
  - weak password → "That password is too weak. Use a longer one."
  - signups off → "New accounts are closed at the moment."
  - anything unmapped → the raw Supabase message, or "Something went wrong. Try again."

## `/auth` — "Create account" tab

- Title "Create your account", subtitle "Build your first catalogue in minutes." (`src/components/auth/forms/SignUpForm.tsx:125-128`).
- "Continue with Google" is shown with `legalNotice={false}` — the legal line sits under the Create-account button instead, so the documents are named once per screen (`src/components/auth/forms/SignUpForm.tsx:129`; rule in `docs/architecture/legal-consent.md:5`).
- Field **Full name**: label "Full name", `type="text"`, `autoComplete="name"`, placeholder "Jane Doe", required, `maxLength={100}` (`src/components/auth/forms/SignUpForm.tsx:139-149`). It is trimmed and sent as `full_name` sign-up metadata (`src/components/auth/forms/SignUpForm.tsx:72`). No custom message: the browser's own "Please fill out this field" is what the user sees.
- Field **Email**: label "Email", `type="email"`, `inputMode="email"`, `autoComplete="username"`, placeholder "name@company.com", required (`src/components/auth/forms/SignUpForm.tsx:150-161`). Trimmed before sending (`:63`).
- Field **Password**: label "Password", `type="password"`, `autoComplete="new-password"`, placeholder "At least 8 characters", hint "Use at least 8 characters.", required, `minLength={8}`, strength meter on (`src/components/auth/forms/SignUpForm.tsx:162-174`).
- Strength meter: four bars plus a live line. 0 chars → the hint; <8 chars → "Strength: Too weak. Try a longer password with numbers or symbols."; then "Fair"/"Good" (also with the "Try a longer password…" tail below level 3) and "Strong." (`src/components/auth/common/PasswordMeter.tsx:3,16-24,38-40`). The meter never blocks submit — "the real rule is the field's `minLength` and GoTrue's own password policy" (`src/components/auth/common/AuthField.tsx:18-19`, `src/components/auth/common/PasswordMeter.tsx:13-15`).
- Server-side password policy: minimum 8 characters, and at least one lowercase, one uppercase **and** one digit are required (`password_min_length: 8`, `password_required_characters: "abc…:ABC…:0123456789"` in `scripts/supabase/auth-config.prod.json:10-11` and `scripts/supabase/auth-config.test.json:10-11`; local mirror `supabase/config.toml:28`). A password that fails that returns "That password is too weak. Use a longer one." (`src/components/auth/common/authMessages.ts:27-28`).
- Submit button "Create account"; busy label "Creating your account…" (`src/components/auth/forms/SignUpForm.tsx:177-184`).
- Under the button: "By creating your account you agree to our Terms & Conditions, Privacy Policy and Refund Policy." — pressing the button *is* the acceptance; there is no checkbox here (`src/components/auth/forms/SignUpForm.tsx:185-188`, `docs/architecture/legal-consent.md:3`).
- If the terms version cannot be read from the database, the form shows a permanent red notice "Sign-up is briefly unavailable. Please try again in a minute." and the submit button is disabled (`src/components/auth/forms/SignUpForm.tsx:132-138,180`; version read at `src/lib/auth/terms.ts:18-43`, returns null on failure `:26-35`). Google sign-up is **not** blocked in that state (`docs/architecture/legal-consent.md:71`).
- Under the card: "Already have an account? Sign in" (`src/components/auth/SupabaseAuthForms.tsx:69-78`).
- On success the card is replaced by the "Check your inbox" view (below); nothing is signed in yet (`src/components/auth/forms/SignUpForm.tsx:82,94`).

## `/auth` — "Check your inbox" (after sign-up)

- Replaces the form inside the same card; the mode tabs stay (`src/components/auth/forms/SignUpForm.tsx:94-120`).
- Amber 68px circle with an inbox icon, title "Check your inbox", subtitle "We sent a confirmation link to **<email>**. Open it to finish creating your account." (`src/components/auth/forms/SignUpForm.tsx:97-106`, circle `src/components/auth/common/AuthDone.tsx:40-44`).
- Fine print: "Wrong address? Start again" — "Start again" clears the email and password, returns to the form and focuses the email field (`src/components/auth/forms/SignUpForm.tsx:108-117,86-92,49-54`).
- The view takes focus when it appears so screen readers announce it (`src/components/auth/common/AuthDone.tsx:26-28,31-38`).

## `/auth` — "Reset your password"

- Reached only from "Forgot password?" on the sign-in card (`src/components/auth/forms/SignInForm.tsx:79-87`); there is no URL for it (view state, `src/components/auth/SupabaseAuthForms.tsx:64`).
- Key-icon badge, title "Reset your password", subtitle "We will email you a link to choose a new one." (`src/components/auth/forms/ResetPasswordForm.tsx:123-127`).
- Field **Email**: label "Email", `type="email"`, `inputMode="email"`, `autoComplete="username"`, placeholder "name@company.com", required (`src/components/auth/forms/ResetPasswordForm.tsx:130-141`).
- Turnstile widget, then submit button "Send reset link" / busy "Sending…" (`src/components/auth/forms/ResetPasswordForm.tsx:142-151`).
- Below the form: a back row "← Back to sign in" (`src/components/auth/forms/ResetPasswordForm.tsx:153-156`).
- **Deliberate non-disclosure:** anything other than a failed captcha or a rate limit is reported as success, so the form cannot be used to test whether an address has an account (`src/components/auth/forms/ResetPasswordForm.tsx:58-69`). Only these two show a red notice: "The anti-bot check did not pass. Try again." / "Too many attempts. Wait a few minutes and try again." (`src/components/auth/common/authMessages.ts:21-26`).

## `/auth` — "Check your inbox" (after a reset request)

- Inbox icon, title "Check your inbox", subtitle "If **<email>** has an account, a reset link is on its way." (`src/components/auth/forms/ResetPasswordForm.tsx:72-83`).
- Tips list, in order (`src/components/auth/forms/ResetPasswordForm.tsx:21-25,85-94`):
  1. "The link can be used once and expires, so open it soon."
  2. "Open it in this browser to keep things simple."
  3. "Nothing after a few minutes? Check your spam folder."
- Primary button "Back to sign in" (48px tall) (`src/components/auth/forms/ResetPasswordForm.tsx:95-101`).
- Fine print "Used the wrong address? Try another email" — clears the field and returns to the form (`src/components/auth/forms/ResetPasswordForm.tsx:102-115`).

## `/auth/confirm` — the email-link landing route (no screen)

- Every auth email points at `{{ .RedirectTo }}/auth/confirm?token_hash=…&type=…` (`src/app/auth/confirm/route.ts:5`; templates `supabase/templates/confirmation.html:48` area, `supabase/templates/recovery.html` "Button not working? Paste this link…", `supabase/templates/email-change.html` likewise).
- It verifies nothing. It moves the one-time token into an HttpOnly cookie `__Host-qt-confirm` with `maxAge: 600` (10 minutes) and 303-redirects to `/auth/confirm/continue`, so the token leaves the address bar and a mail scanner cannot spend it (`src/app/auth/confirm/route.ts:7-10,25-37`).
- Accepted `type` values: `email`, `recovery`, `email_change`; the token hash must match `^[A-Za-z0-9_-]{16,128}$`. Anything else redirects to `/auth?error=link` (`src/app/auth/confirm/route.ts:15-23`).

## `/auth/confirm/continue` — "Confirm it was you"

- Route `/auth/confirm/continue`, always dynamic, reached only by following an auth email link (`src/app/(site)/(with-footer)/auth/confirm/continue/page.tsx:11-18`).
- Shield badge, title "Confirm it was you", subtitle "Press the button to finish what you started by email. The link is used once and only from this browser." (`src/components/auth/ConfirmContinue.tsx:138-142`).
- Button "Confirm and continue" / busy "Confirming…" (`src/components/auth/ConfirmContinue.tsx:145-152`).
- Fine print: "Didn't request this? You can close this page. Nothing happens until you press the button." (`src/components/auth/ConfirmContinue.tsx:154-157`).
- Under the card: "Link not working? Links can be used once and expire. Request a new one" → `/auth` (`src/components/auth/ConfirmContinue.tsx:22-30,159`).
- Pressing the button is what spends the token (`src/actions/auth-confirm.ts:22-27,28`).

### Success state — "Email confirmed"

- Check icon, title "Email confirmed", subtitle "You are now signed in as **<email>**. Continue only if that is you." (falls back to "your account" when no email) (`src/components/auth/ConfirmContinue.tsx:63-76`).
- Button "Continue" with an arrow; it does a full page load so the browser picks up the new session cookie (`src/components/auth/ConfirmContinue.tsx:77-92`).
- Where it goes: `/auth/update-password` for a recovery link, `/admin/dashboard` for email confirmation and email change (`src/actions/auth-confirm.ts:70`), sanitised again by `safeNext` (`src/components/auth/ConfirmContinue.tsx:83`).

### Failure states (each replaces the card and takes focus)

All five show a warning-triangle badge, a title, a body and one outline button (`src/components/auth/ConfirmContinue.tsx:98-132`). Texts from `src/components/auth/common/authMessages.ts:54-78`:

- **"Too many attempts"** — "Wait a few minutes and open the link again." Button "Back to sign in". Cause: more than 20 confirm attempts from one IP in 10 minutes (`src/lib/rate-limit.ts:13`, checked first at `src/actions/auth-confirm.ts:30-32`).
- **"You are already signed in"** — "Sign out of this account first, then open the link from your email again. Confirming a link while signed in could attach the wrong account to this browser." Button "Sign out of this browser" (local scope only), after which the "Confirm it was you" card comes back and takes focus; the "Request a new one" line is hidden in this state (`src/components/auth/ConfirmContinue.tsx:110-118,130`, `:52-61`; cause `src/actions/auth-confirm.ts:34-38`).
- **"This link has expired"** — "Confirmation links are valid for 10 minutes after you open them. Request a new one and try again." Cause: the `__Host-qt-confirm` cookie is gone (`src/actions/auth-confirm.ts:41-44`).
- **"This link did not work"** — "It may already have been used or it has expired. Request a new one and try again." Cause: a malformed cookie or a rejected `verifyOtp` (`src/actions/auth-confirm.ts:48-58,65,83`).
- **"Something is wrong on our side"** — "Sign-in is misconfigured, and a new link will not help. We have been alerted - please try again shortly." Cause: missing `SUPABASE_SECRET_KEY` / project URL (`src/utils/supabase/server-forwarded.ts:30-46`, `src/actions/auth-confirm.ts:75-80`).
- The cookie is deleted whether or not the token verifies — one attempt per link (`src/actions/auth-confirm.ts:42-43`).

## `/auth/update-password` — "Choose a new password"

- Route `/auth/update-password`, dynamic; reached from a recovery link after the confirm interstitial (`src/app/(site)/(with-footer)/auth/update-password/page.tsx:6-13`).
- Without a session the page redirects to `/auth?error=recovery` → the notice "Open the reset link from your email again - this page needs the session it creates." (`src/app/(site)/(with-footer)/auth/update-password/page.tsx:17`, `src/components/auth/common/authMessages.ts:46-48`).
- Lock badge, title "Choose a new password", subtitle "You will stay signed in here. Every other device is signed out." (`src/components/auth/UpdatePasswordForm.tsx:51-55`).
- Field **New password**: `type="password"`, `autoComplete="new-password"`, placeholder "At least 8 characters", hint "Use at least 8 characters. Longer is stronger.", required, `minLength={8}`, strength meter on (`src/components/auth/UpdatePasswordForm.tsx:58-70`).
- Field **Repeat new password**: `type="password"`, placeholder "Type it again", required, `minLength={8}`, no meter (`src/components/auth/UpdatePasswordForm.tsx:71-81`).
- Submit "Save password" / busy "Saving…" (`src/components/auth/UpdatePasswordForm.tsx:82-89`).
- Mismatch error (client-side, before any request): "The two passwords do not match." (`src/components/auth/UpdatePasswordForm.tsx:26-29`).
- No captcha here — `updateUser` is not captcha-gated (`src/components/auth/UpdatePasswordForm.tsx:15-16`).
- Other errors use the same map; the two that only appear here: "That is already your password. Choose a different one." and "This recovery link is no longer fresh enough. Request a new one and try again." (`src/components/auth/common/authMessages.ts:31-36`).
- On success: every **other** session is signed out, this browser stays signed in, and the user is sent to `/admin/dashboard` (`src/components/auth/UpdatePasswordForm.tsx:41-46`). No toast.

## `/auth/callback` — Google return route (no screen)

- Exchanges the PKCE code for a session, then redirects to the sanitised `next` (default `/admin/dashboard`) (`src/app/auth/callback/route.ts:22-63`).
- Google reporting a refusal (closed popup, denied consent) → `/auth?error=oauth` (`src/app/auth/callback/route.ts:27-29`).
- A missing/invalid code or a failed exchange → `/auth?error=link`; the usual real cause is a missing PKCE verifier cookie, e.g. the sign-in was started on a different host or cookies were cleared mid-flow (`src/app/auth/callback/route.ts:24,31-47`).
- Misconfigured server → `/auth?error=config` (`src/app/auth/callback/route.ts:49-55`).
- The exchange forwards the visitor's IP so Supabase rate-limits per user, not per Vercel region (`src/app/auth/callback/route.ts:11-14`, `src/utils/supabase/server-forwarded.ts:7-16,48-54`).

## `/auth/consent` — the legal consent gate

- Route `/auth/consent`, dynamic, `maxDuration = 60` (`src/app/(site)/(with-footer)/auth/consent/page.tsx:18,22`).
- Reached by a redirect from the `/admin` layout when the signed-in user's recorded acceptance does not match the current terms version (`src/app/admin/layout.tsx:23-29`; the check `src/lib/auth/consent.ts:36-57`).
- Signed out → redirect to `/auth?next=/auth/consent` (`src/app/(site)/(with-footer)/auth/consent/page.tsx:50-51`). Already satisfied → redirect to `/admin/dashboard` (`:57`).
- **The navbar's auth corner is empty on this page** — no Dashboard link, no avatar menu, no Log In / Start free (`src/components/navigation/AuthLinks.tsx:39-45`, `src/constants/navigation.ts:96`).
- Two wordings, chosen by whether they had accepted an earlier version (`src/components/auth/ConsentForm.tsx:76-83`):
  - first time → title "Review and accept", subtitle "One last step before you continue. Accepting these is required to use your Quicktalog account."
  - after a change → title "Our terms have changed", subtitle "We have updated the documents below since you last accepted them. Please review and accept to carry on using your account."
- Three checkbox rows, each in its own bordered box, in this order: "I agree to the Terms & Conditions", "I agree to the Privacy Policy", "I agree to the Refund Policy" (built from `src/constants/legal.ts:5-24` at `src/components/auth/ConsentForm.tsx:87-113`). Each document name is a link opening in a new tab (`:108`).
- All three are required: the button is disabled until every box is ticked, because the database writes them as one set (`src/components/auth/ConsentForm.tsx:45,49,120`; `docs/architecture/legal-consent.md:40`).
- Button "Accept and continue" / busy "Saving…" (`src/components/auth/ConsentForm.tsx:115-123`).
- Errors (red notice above the boxes) (`src/components/auth/ConsentForm.tsx:60-65`):
  - terms changed while the page was open → "Our terms changed while this page was open. Reload the page to see the current version."
  - anything else → "We could not record that just now. Please try again."
- Fine print 1: "Would rather not? **Decline and sign out**" — signs the user out and sends them to `/` (`src/components/auth/ConsentForm.tsx:125-135,68-72`).
- Fine print 2: "You can delete your account and its data from your account settings at any time." (`src/components/auth/ConsentForm.tsx:136-139`).
- On success: `router.replace(next)` + refresh; `next` defaults to `/admin/dashboard` (`src/components/auth/ConsentForm.tsx:54-57`, `src/app/(site)/(with-footer)/auth/consent/page.tsx:59-60`).
- **Failure-to-check state** ("unknown"): the page shows a separate card instead — warning triangle, title "Something went wrong", subtitle "We could not load the documents to accept. Nothing has been recorded, and nothing is lost.", and a "Try again" link back to `next` (`src/app/(site)/(with-footer)/auth/consent/page.tsx:29-42,71`).
- Who lands here: every Google sign-up (Google sends no `terms_version`, so the row is created not-accepted), every imported account, and everybody again whenever the terms version is bumped (`docs/architecture/legal-consent.md:3,56,60`).
- The gate is a nudge, not a boundary — a soft navigation can slip past it; the record on the row is authoritative (`src/app/admin/layout.tsx:10-16`, `docs/architecture/legal-consent.md:74`).

## `/admin/dashboard` — the dashboard frame

- Route `/admin/dashboard`, `force-dynamic` (`src/app/admin/dashboard/page.tsx:16`).
- Reached from: navbar "Dashboard" pill (desktop, signed in) (`src/components/navigation/AuthLinks.tsx:152-157`), the avatar menu item "Dashboard" (`src/components/navigation/UserMenu.tsx:87-92`), the mobile sheet "Dashboard" (`src/components/navigation/AuthLinks.tsx:78-85`), "Return to Dashboard" after checkout (`src/app/admin/checkout/success/page.tsx:51-59`), and as the default `next` after sign-in (`src/lib/auth/redirects.ts:1`).
- Shell: fixed floating navbar pill, 64px tall, max 1240px wide, with a 9px top offset (`src/components/navigation/Navbar.tsx:112-120`); then a 1280px page column with 96–120px of top padding to clear it, and an amber blur at the top right (`src/components/navigation/AppShell.tsx:28-41`, `src/components/general/Container.tsx:19`); footer at the bottom (`src/components/navigation/AppShell.tsx:42`).
- Body: sidebar + panel in a row with a 24px gap (28px from `lg`) (`src/components/dashboard/Dashboard.tsx:129`).
- **Sidebar** (`md` 720px and up): `aside` labelled "Dashboard", sticky 96px from the top, **224px wide** (`w-56`), a white card with 12px padding and a shadow, holding a `nav` labelled "Dashboard tabs" with 6px gaps (`src/components/dashboard/navigation/DashboardSidebar.tsx:12-24`). Rows are 46px tall, 14px radius; the active row gets an amber border, amber-soft fill, bold text and grows 3% on hover (`src/components/dashboard/navigation/DashboardTabButtons.tsx:14-18`).
- **Below 720px** the sidebar is replaced by a horizontally scrolling pill bar above the panel, with a bottom border; the active pill is scrolled into view (`src/components/dashboard/navigation/DashboardTabBar.tsx:12-39`; pill styles `src/lib/ui/pill-tab.ts:5-13`).
- Tab order and labels, with their `?tab=` values and icons (`src/constants/dashboard.tsx:10-16`):
  1. **Overview** — `?tab=overview` (the param is removed for this tab) — `FileChartColumn`
  2. **Subscription** — `?tab=subscription` — `CalendarDays`
  3. **Usage** — `?tab=usage` — `ChartColumn`
  4. **Settings** — `?tab=settings` — `Settings`
  5. **Support** — `?tab=support` — `CircleHelp`
- An unknown `?tab=` value opens Overview (`src/constants/dashboard.tsx:21-25`).
- Tabs switch content in place with `history.replaceState` — no page load, other query params and the hash are kept (`src/components/dashboard/Dashboard.tsx:81-95`). They are `aria-pressed`, not links (`src/components/dashboard/navigation/DashboardTabButtons.tsx:23-25,40`).
- Panel: rounded, bordered, translucent white card, 16px padding (28px from `md`, 36px from `lg`) (`src/components/dashboard/Dashboard.tsx:132`).
- Loading: the frame (navbar + sidebar + pill bar) renders at once with the tabs **disabled**, and the panel shows three pulsing blocks labelled "Loading" (`src/app/admin/dashboard/loading.tsx:5-11`, `src/components/dashboard/DashboardSkeleton.tsx:9-37`).
- A round amber **"+"** floating button, 60px, bottom-right (20px/32px inset, respecting the safe area), `aria-label` and tooltip "Create catalogue". At the catalogue limit it is dimmed to 60% opacity but still opens the upgrade dialog (`src/components/dashboard/FloatingActionMenu.tsx:30-42`, `:15-18`).
- If the user's data cannot be loaded at all, the whole panel is replaced by "Something went wrong. Please try again later." and a large "Go to Home" button (`src/app/admin/dashboard/page.tsx:55-66`).
- Subscription, Usage, Settings and Support are code-split and show the three-block skeleton while their code loads (`src/components/dashboard/Dashboard.tsx:16-35,137-146`).

## Overview tab

- **Profile strip** (top): amber panel, centred on phones and a row from `md`; 72px avatar (96px from `md`) with a 4px amber ring, the user's photo or their initials (up to two, uppercased, "Q" when there is no name); heading "Welcome back, <FirstName>!" or just "Welcome back!" when the stored name is missing or literally "Unknown User"; the email underneath (`src/components/dashboard/overview/UserProfile.tsx:6-47`, initials `src/lib/users/initials.ts:2-11`). Section label "Your profile" (`:16`).
- **Section heading "Dashboard"** with a chart icon (`src/components/dashboard/Overview.tsx:156-163`).
- **Four stat cards**, 2 per row, 4 per row from 1100px, in this order (`src/components/dashboard/overview/OverallAnalytics.tsx:78-103`):
  - "Total Views" (eye icon), "Total Visitors" (users), "Catalogues" (grid), "Newsletter" (mail).
  - Values are formatted with US thousands separators and show `0` when missing (`:58`).
  - Each card has a small `i` button, `aria-label="About <label>"`, that opens an explainer dialog (`:48-55`).
- Explainer dialog: title "<Metric> Explained", a single "Got it!" button and no cancel button (`src/components/dashboard/Overview.tsx:223-232`). Bodies (`src/components/dashboard/overview/OverallAnalytics.tsx:13-28`):
  - Total Views — "This shows the total number of times your catalogues have been viewed by visitors. It includes all page visits across all your catalogues."
  - Total Visitors — "This represents the number of individuals who have visited your catalogues. Each person is counted only once per day, regardless of how many times they visit your catalogue on that day."
  - Catalogues — "This displays the total number of catalogues you have created. Each catalogue represents a different business or service offering."
  - Newsletter — "This shows how many people have subscribed to your newsletter service. These are users who have opted in to receive updates from you."
- **Section heading "Catalogues"** with a grid icon (`src/components/dashboard/Overview.tsx:170-177`).
- **Limit strips** (amber, above the grid) (`src/components/dashboard/overview/LimitCTAs.tsx:19-34`):
  - at the catalogue limit → "You've reached your current catalogue limit" / "Upgrade your plan to get more catalogues, features, and higher limits." / button "Upgrade plan" → `/pricing`
  - at the traffic limit → "You've reached your traffic limit" / "Upgrade your plan to increase your traffic limit and reactivate your catalogues." / button "Upgrade plan" → `/pricing`
- **Empty state:** a single dashed-border box, centred text "No catalogues created yet." (`src/components/dashboard/overview/CatalogueGrid.tsx:32-38`).
- **Grid:** 1 column, 2 from `sm`, 3 from 1200px; 8 cards shown at first, then a centred outline button "Show More (<n> more)" that reveals the rest (`src/components/dashboard/overview/CatalogueGrid.tsx:24,30,53,63-72`). Sort order: by status (`src/constants/sort.ts` order) then newest `updatedAt` first (`:40-46`).
- **Section heading "Newsletter Subscribers"** with a mail icon (`src/components/dashboard/Overview.tsx:194-197`).
- Data: the server loads the overview with the page when Overview is the opening tab; otherwise SWR fetches `/api/dashboard/analytics`, `/api/dashboard/catalogues` and `/api/dashboard/newsletter` after hydration. Analytics auto-refresh every 5 minutes; nothing is fetched while another tab is open (`src/app/admin/dashboard/page.tsx:45-53`, `src/hooks/useDashboardData.ts:9-13,32-36,54-87`).
- If analytics or the catalogue list fails: the whole overview is replaced by an alert card "We couldn't load your dashboard. Please try again." with an outline "Try again" button (`src/components/dashboard/Dashboard.tsx:45-59,107`).

## Overview — one catalogue card

- Card: white, 18px padding, lifts slightly on hover (`src/components/dashboard/overview/DashboardItem.tsx:116`).
- Top row: the catalogue name as a heading, and a `⋮` button `aria-label="Actions for <name>"` (`src/components/dashboard/overview/DashboardItem.tsx:117-132`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:182-189`).
- Status pill, one of (`src/components/dashboard/overview/StatusBadge.tsx:6-29`): "Active" (green), "Draft" (amber), "Inactive" (grey), "In preparation" (blue), "Error" (red). Pill is 24px tall, 11.5px bold text (`src/components/ui/badge.tsx:7`).
- Definition list "Updated:" and "Created:", each a US-locale date + 2-digit time, or "-" when unparseable (`src/components/dashboard/overview/DashboardItem.tsx:26-36,136-149`).
- Buttons by status (`src/components/dashboard/overview/DashboardItem.tsx:151-195`):
  - **active** → "View Catalogue" (→ `/catalogues/<name>`) and outline "Analytics" (→ `/admin/<name>/analytics`).
  - **draft** or **inactive** → "Continue Editing" (→ `/admin/<name>/builder`) and outline "Publish Catalogue" with a rocket icon.
  - **error** → red line "Error occurred. Please delete the catalogue and retry."
  - **in_preparation** → a spinning cog with the screen-reader text "Catalogue is being prepared".
- "Publish Catalogue" first re-reads the catalogue, then:
  - missing pieces → error toast "Cannot publish: missing heading." / "…missing content." / "…missing heading and content." with an action button "Open Builder" (`src/components/dashboard/overview/DashboardItem.tsx:68-83`).
  - could not read it → "Could not retrieve catalogue data. Please try again." (`:58-62`).
  - from **draft** → toast "Publishing..." then "Catalogue published successfully", with a "View" action that opens the public page in a new tab (`:50-55,86-98`).
  - from any other status → "Updating..." then "Catalogue updated successfully" (`:99-111`).
  - failure → the server's reason, else "Failed to publish catalogue" / "Failed to update catalogue" (`:97,110`).

### The `⋮` menu (220px wide)

Items in order (`src/components/dashboard/overview/ItemDropdownMenu.tsx:114-171`):

1. **Edit** (pencil) → `/admin/<name>/builder`
2. **Change Status** (submenu, 176px): lists the two statuses the catalogue is not currently in, labelled "Activate" / "Deactivate" / "Save" (`:66-71,206-223`). "Activate" is disabled with the tooltip "Traffic limit reached" when this month's page views are at the plan limit (`:207,216-218`).
3. **Share** (share icon) → copies `NEXT_PUBLIC_BASE_URL/catalogues/<name>`; the item then reads "Link Copied" with a check icon and turns green, and the menu stays open (`:129-140`, `:112`)
4. **QR Code** → `/admin/<name>/qr-editor`
5. **Embed** → downloads an HTML embed file (`:150-154`)
6. **Duplicate** → the name dialog; label becomes "Loading..." while working
7. *(separator)* **Delete** (red) — disabled while the delete dialog is open, and disabled with the tooltip "Available 10 minutes after creation" for a catalogue still in preparation (`:73-80,166-169`)

- For a catalogue in `in_preparation` or `error`, everything except Delete is disabled (`src/components/dashboard/overview/DashboardItem.tsx:125`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:41-42`).
- Status change failure → toast with the server's reason, else "Could not activate this catalogue." (when activating) or "Failed to update status. Please try again."; an exception → "Failed to update status." (`src/components/dashboard/Overview.tsx:110-127`). Server reasons include "This month's traffic limit for your plan is reached" and "Not found" (`src/lib/entitlements/plan.ts:90-95`, `src/actions/catalogue.ts:146,165,175`).

### Delete-one dialog

- Trash icon in a red tile, title "Delete Catalogue", body "Are you sure you want to delete this catalogue? This action cannot be undone.", buttons "Cancel" and a red "Confirm" that becomes "Processing..." while working (`src/components/dashboard/Overview.tsx:204-214`; defaults `src/components/modals/InformModal.tsx:45-46,76-95`).
- Cancel is ignored while the delete is running (`src/components/dashboard/Overview.tsx:101-103`).
- Failure → toast "Failed to delete catalogue. Please try again." (`src/components/dashboard/Overview.tsx:93`).
- Irreversible: the row is deleted, its cached drafts are removed and its public page is revalidated (`src/actions/catalogue.ts:61-78`).

### Duplicate dialog

- Title "Duplicate Catalogue", description "Please provide a name for the catalogue" (`src/components/dashboard/overview/DuplicateCatalogueDialog.tsx:47-50`).
- Field label "Name", placeholder "Enter name...", `maxLength={60}`, `autoComplete="off"` (`:52-61`; max length `src/components/modals/CatalogueNameField.tsx:12,85`).
- Live hint under the field (`src/components/modals/NameHint.tsx:32-45`):
  - "Checking availability…" while the server is asked (400ms after the last keystroke, `src/hooks/useCatalogueName.ts:26`)
  - "Great! This name is available." (green, check icon)
  - "Name cannot be just spaces." (`src/hooks/useCatalogueName.ts:33-35`)
  - "Name must only contain letters, numbers, and spaces (no special characters)." (`:36-38`)
  - "This name is already in use. Please choose a different name." (`:20-21`)
- Under the field: a URL preview "Your URL will be <base>/catalogues/<slug>" (`src/components/modals/CatalogueNameField.tsx:15-31,98`).
- Buttons "Cancel" and "Confirm" (→ "Duplicating..." while working). Confirm is enabled only with a non-empty, error-free, fully checked name; Enter also confirms (`src/components/dashboard/overview/DuplicateCatalogueDialog.tsx:34-37,57-73`).
- Success → toast `Catalogue "<name>" created.`; the dashboard and plan usage refresh (`src/hooks/useDuplicateCatalogue.ts:66-68`).
- Server refusal (`null`) → toast "Could not duplicate this catalogue. Your plan may not allow another one." with an action button "View plans" that opens the plan-limit dialog (`:52-64`). Exception → "Failed to duplicate the catalogue." (`:70-72`).
- At the catalogue limit the menu item opens the plan-limit dialog instead of the name dialog (`src/hooks/useDuplicateCatalogue.ts:31-40`, `src/components/dashboard/overview/ItemDropdownMenu.tsx:259-265`).

### "Catalogue Limit Exceeded" dialog (after a downgrade)

- Opens by itself, as soon as the overview sees more catalogues than the plan allows, and **cannot be dismissed** — no cancel button, no close on outside click (`src/components/dashboard/Overview.tsx:73-75`, `src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:29-32,78`).
- Red warning tile, title "Catalogue Limit Exceeded", body "You have <n> catalogues, but your plan allows only <m>. Please select at least <k> catalogue(s) to delete." (`:84-89`).
- Live counter line "Selected: <n> / Required: <k>", red until enough are ticked, then green (`:90-98`).
- A scrollable checkbox list (1 column, 2 from `sm`) of every catalogue: name, status pill and "Updated: <date> · Created: <date>" (short month format) (`:101-139,66-75`). A ticked row turns red.
- Footer: one red button "Delete <n> Catalogue(s)" with a trash icon, disabled until the required number is ticked; "Deleting..." while working (`:141-157`).
- Failure → toast "Failed to delete some catalogues. Please try again." or "Failed to delete catalogues. Please try again." (`src/components/dashboard/Overview.tsx:136-142`). Server-side it is all-or-nothing (`src/actions/catalogue.ts:93-106`).
- Dialog width 768px (`size="lg"`), max height 85% of the viewport (`src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:79`, `src/components/modals/AppDialog.tsx:17`).

## Overview — Newsletter Subscribers table

- Card with a header row: "<n> subscriber" / "<n> subscribers" on the left, outline button "Export CSV" with a download icon on the right, disabled at 0 (`src/components/dashboard/overview/NewsletterTable.tsx:65-78`).
- Column headers: "Email", "Catalogue", "Date" (`:24,99-107`). Table has a 460px minimum width and scrolls horizontally; the scroll area is focusable for keyboard users (`:90-96`).
- Catalogue cell links to `/catalogues/<name>`, or shows "-" when there is none (`:119-130`). Date cell shows e.g. "Mar 4, 2026" (`:131-137`).
- Empty state: mail icon + "No newsletter subscribers yet." (`:84-88`).
- Error state: red, `role="alert"`, "We couldn't load your newsletter subscribers." (`:80-83`).
- "Export CSV" downloads `newsletter-subscribers.csv` with a UTF-8 BOM, the three headers, ISO dates, every cell quoted and cells starting with `= + - @` prefixed with `'` (CSV-injection guard) (`:28-58`).

## Overview — "How did you hear about us?" dialog

- Opens on the dashboard the first time, while `users.acquisition_source` is null; it is modal and has no close button or cancel (`src/components/dashboard/overview/AcquisitionSourceModal.tsx:33-38,69-70`, mounted at `src/components/dashboard/Dashboard.tsx:149`).
- Question-mark tile, title "How did you hear about us?", description "One question, and it tells us where to keep showing up." (`:71-79`).
- **Select** with placeholder "Select an option"; options in order: "Google", "Social media", "Friend or colleague", "YouTube", "LinkedIn", "A Quicktalog catalogue", "AI assistant", "Other" (`:81-92`; values/labels `src/constants/users.ts:8-17`).
- Choosing "Other" reveals a free-text input, `aria-label="Where did you hear about us?"`, placeholder "Where was it?", `maxLength={120}` (`:93-102`, `src/constants/users.ts:25`).
- Buttons: outline "Skip" and "Save". Save is enabled only once an option is chosen (and, for "Other", the text is non-empty) (`:66,104-118`).
- "Skip" also answers the question — it stores the literal value `Skipped`, so it is never asked again (`:107`, `src/constants/users.ts:21-22`).
- Failure → toast "Could not save that. Please try again." (`:58-60`).
- The first answer is final: the update has an `acquisition_source is null` predicate, so a second call cannot overwrite it (`src/actions/users.ts:36-58`).

## Subscription tab

- Title "Subscription Overview" with a calendar icon (`src/components/dashboard/Subscription.tsx:29`).
- If the plan is below the highest standard tier, an amber strip on top: "Upgrade your plan" / "Get more features, higher limits, and premium support." / button "Upgrade plan" → `/pricing` (`src/components/dashboard/subscription/PlanDetails.tsx:38-43,86-93`).
- **Plan card:** a 48px amber icon tile (star for Pro/Premium/Growth/Custom, shield for Enterprise, lightning otherwise), the plan name, the plan description, and a green "Active" badge (`src/components/dashboard/subscription/PlanDetails.tsx:25-36,99-118`).
- Two-cell detail grid: "Price" (formatted Paddle price, "…" while loading, "–" when unavailable) and "Subscription Cycle" ("monthly"/"yearly", or "-") (`:71-82,120-134`).
- Prices come from Paddle in the browser with country "US" (`src/components/dashboard/Subscription.tsx:20`).
- **"Manage your subscription"** row: "Update billing details, check transactions or cancel subscription." and an outline button "Manage subscription" that opens Paddle's customer portal in a new tab (with the screen-reader hint "(opens in a new tab)"). On the free plan (`id === 0`) the button is **disabled** because there is no Paddle subscription (`:136-163`; portal URL `src/components/dashboard/Subscription.tsx:11-12`).
- Subscription start and renewal dates are deliberately **not** shown — the app role cannot read the `subscriptions` table (`src/components/dashboard/subscription/PlanDetails.tsx:45-48`).
- No-plan fallback card: credit-card icon, "No Subscription Plan Found", "You haven't selected a Subscription plan yet. Choose a plan to get started.", button "View Available Plans" → `/pricing` (`:56-68`).
- **Plan Features** card: heading "Plan Features" with a star icon; when anything is not included, a "Compare plans →" link to `/pricing` (`src/components/dashboard/subscription/PlanFeatures.tsx:30-43`).
  - Limit tiles, in order: "Catalogues", "Sections per catalogue", "Items per catalogue", "Page views / month", "AI credits / month"; a value of `"unlimited"` prints "Unlimited", a missing value prints "–" (`src/constants/pricing.ts:42-80`, rendered `src/components/dashboard/subscription/PlanFeatures.tsx:45-59`).
  - Then three groups (`src/constants/pricing.ts:83-133`): **Design** (Standard themes, Advanced styling, Custom branding), **Section types** (Items, Text, Divider, External content, Custom visual), **Growth & support** (Analytics, Your own analytics tags, Newsletter sign-ups, …).
  - Included rows get an amber check, excluded rows a grey minus plus the screen-reader text "Included" / "Not included" (`src/components/dashboard/subscription/PlanFeatures.tsx:75-106`).
- Plan numbers for reference (Starter / Basic / Pro / Growth): catalogues 1 / 1 / 6 / 20, page views 500 / 2 000 / 5 000 / 15 000, AI credits 15 / 50 / 150 / …, sections 5 / 8 / 15 / …, items 15 / 30 / 100 / … (`../quicktalog-packages/src/constants/pricing.ts:3-130`).

## Usage tab

- Title "Usage Overview" with a chart icon, lead "Monitor your resource consumption and track usage across all features" (`src/components/dashboard/MonthlyUsage.tsx:98-101`).
- Section label "Usage against your plan limits"; 1 column, 3 from 900px (`:102-105`).
- Three meters in order: **Traffic** (eye, unit "views"), **Catalogues** (grid, "catalogues"), **AI Credits** (sparkles, "credits"). AI Credits is hidden when the plan grants 0 (`:69-94,106-110`).
- Each card: icon tile, title, an arc meter with the percentage in the middle and "of limit" (or "over limit") under it, then "<used> / <limit> <unit>" (`src/components/charts/GaugeChart.tsx:39-95`).
- Status thresholds: normal below 80%, **"Near limit"** amber badge from 80%, **"Limit reached"** red badge at 100%, or "<n> <unit> over" when past the limit; the card's border and tint change with it (`src/components/charts/GaugeChart.tsx:19-24`, `src/components/dashboard/MonthlyUsage.tsx:25-50`).
- Percentages are floored, so 100% only shows at the limit; the arc stops at 100% but the number does not (`src/components/charts/GaugeChart.tsx:26-30,43-44`).
- The meter is exposed as `role="meter"` with the spoken value "<used> of <limit> <unit>, <n>%" (`src/components/charts/GaugeChart.tsx:50-57`).
- Usage figures come from `private.my_usage()`, which computes the month boundary in SQL and excludes refunded AI turns (`src/lib/users/my-user-data.ts:29-37,80-83`).

## Settings tab

- Title "Settings" with a cog icon; the account forms load separately behind a pulsing 128px placeholder (`src/components/dashboard/Settings.tsx:15-25`).
- Reached from: the sidebar/pill "Settings", the navbar avatar menu item "Account" and the mobile sheet "Account" — both of which link to `/admin/dashboard?tab=settings` (`src/components/navigation/UserMenu.tsx:93-98`, `src/components/navigation/AuthLinks.tsx:99-106`; href from `src/components/auth/session/SupabaseAuthProvider.tsx:89`).
- Three cards, in order: **"Account"**, **"Privacy and sessions"**, **"Danger zone"** (red-tinted border and red title) (`src/components/dashboard/account/supabase/SupabaseAccount.tsx:44,58,74`; `src/components/dashboard/account/supabase/DeleteAccountRow.tsx:55`; styles `src/components/dashboard/settings/SettingsGroup.tsx:12-41`).
- Row layout: label / value / action on one line from `lg` (960px), stacked below that; an open editor tints the row amber (`src/components/dashboard/settings/SettingsGroup.tsx:61-110`).
- Only one editor can be open at a time (`src/components/dashboard/account/supabase/SupabaseAccount.tsx:35-40`). Opening one focuses its first field; closing hands focus back to the button that opened it (`src/components/dashboard/settings/SettingsGroup.tsx:82-92`).
- Each editor ends with its save button plus a ghost "Cancel" (`src/components/dashboard/settings/SettingsGroup.tsx:164-180`).

### Account › Name

- Row "Name", value the stored name or "Not set", button "Edit" (`src/components/dashboard/account/supabase/ProfileRow.tsx:52-58`).
- Editor: label "Name", `autoComplete="name"`, `maxLength={80}`, help text "Shown in your dashboard and used in emails we send you." (`:59-71`).
- Button "Save name" / "Saving..."; disabled while saving, when the name is unchanged, or when it is empty after trimming (`:73-81`).
- Success → toast "Your name was updated." and the row closes (`:43-46`).
- Server rules (authoritative): whitespace collapsed and trimmed, 1–80 characters, no control characters; a violation returns "Enter a name of 1 to 80 characters." (`src/actions/account.ts:28-38,48-51`).
- Rate limit: 5 renames per hour per user, fail-closed → "Too many name changes. Try again in an hour." (`src/actions/account.ts:53-58`, `src/lib/rate-limit.ts:14`).
- Other errors: "Not signed in." / "Account not found." / "Could not save your name." (`src/actions/account.ts:67,73,76`; fallback toast `ProfileRow.tsx:40`).

### Account › Email

- Row "Email", value the current address or "Unknown", button "Change" (`src/components/dashboard/account/supabase/EmailRow.tsx:61-76`).
- Editor: a line "Current address: **<email>**", then label "New email address", `type="email"`, `autoComplete="email"`, placeholder "name@company.com" — no max length and no format validation beyond the browser's (`:78-94`).
- Help text: "We send a link to both addresses. Nothing changes until both links are opened." (`:95-98`).
- Button "Send confirmation links" / "Sending..."; enabled only once the field contains an `@` (`:100-106`).
- The address is trimmed and lowercased before sending (`:41`).
- Success → toast "Confirmation links sent.", the editor closes, and a green status line appears under the (unchanged) value: "Check both inboxes. The change is applied only after both links are confirmed." (`:52-54,69-74`; style `src/components/dashboard/settings/SettingsGroup.tsx:183-192`).
- Both confirmations are required — "secure email change" is on in both projects (`scripts/supabase/auth-config.prod.json:8`, `scripts/supabase/auth-config.test.json:8`; `supabase/config.toml:45`).
- Errors (toasts) from `describeAuthError` (`src/components/dashboard/account/supabase/authErrors.ts:7-39`): "That email address is already in use.", "That email address is not valid.", "Too many emails were sent. Please wait a few minutes.", "Too many attempts. Please wait a few minutes.", otherwise the Supabase message or "Could not start the email change."
- The email the user receives: subject "Confirm your new Quicktalog email", heading "Confirm your new email address", body "You asked to change the email address on your Quicktalog account. The change takes effect once both addresses are confirmed.", current and new address shown, button "Confirm email change", and "Didn't ask for this? Ignore this email and your address stays the same. If you think someone else made the request, change your password." (`scripts/supabase/auth-config.prod.json:30`, `supabase/templates/email-change.html`).

### Account › Password

- Row "Password", value `••••••••` (screen readers hear "Set"), button "Change" (`src/components/dashboard/account/supabase/PasswordRow.tsx:98-110`).
- Editor fields: "Current password" (`autoComplete="current-password"`), then "New password" and "Repeat new password" side by side from `sm` (both `autoComplete="new-password"`) (`:112-143`). None of them carries a `maxLength` or `minLength` attribute.
- Help text: "At least 8 characters. Every other device is signed out; this one stays signed in." (`:156-159`).
- Button "Change password" / "Changing..."; disabled until the current password is filled, the new one is at least 8 characters and the repeat is non-empty (`:160-167`).
- Mismatch → toast "The two new passwords do not match." (checked before any request) (`:44-47`).
- **Second factor:** the projects have "secure password change" on, so GoTrue asks for an emailed code. When it does, a field "Emailed confirmation code" appears (`autoComplete="one-time-code"`, numeric keyboard), the form keeps its values, and an info toast says "We emailed you a confirmation code. Enter it below." (or "Could not send the confirmation code." / the mapped error) (`:28-31,56-73,144-155`; setting `scripts/supabase/auth-config.prod.json:9`, `supabase/config.toml:46`).
- Success → toast "Password changed. Other devices were signed out." (or "Password changed. Other devices may stay signed in." if the revoke failed), and the editor closes (`:81-91`).
- Errors (`src/components/dashboard/account/supabase/authErrors.ts:12-36`): "That password is not correct.", "The new password has to be different from the current one.", "That password is too weak. Use at least 8 characters with letters and digits.", "That code is not valid. Request a new one.", otherwise the Supabase message or "Could not change your password."

### Account › Google

- Row "Google". Value while loading: "Checking..."; then a pill "Connected ✓" or "Not connected", followed by "as <google email>" when known (`src/components/dashboard/account/supabase/GoogleRow.tsx:17-31,111-124`).
- Action: outline "Connect Google" when not linked, outline "Disconnect" when linked (`:86-104`).
- When Google is the only identity, "Disconnect" is disabled and a description appears instead of the value: "Google is the only sign-in provider linked to this account, so it can't be disconnected. A password you have set still works." (`:51,92,105-109`).
- Connecting sends the browser to Google and returns through `/auth/callback?next=/admin/dashboard?tab=settings` (`:56-62`, path `src/components/dashboard/account/supabase/types.ts:8`).
- Success on disconnect → toast "Google was disconnected." (`:79`). Errors: "Google connections are turned off right now. Please try again later.", "That Google account is already connected to an account.", "This is your only sign-in method, so it cannot be disconnected.", "Disconnecting this would leave your account without its email address.", or "Could not connect Google." / "Could not disconnect Google." (`src/components/dashboard/account/supabase/authErrors.ts:27-34`, `GoogleRow.tsx:64,75`).
- Known quirk: GoTrue keeps a Google-only user at one identity even after they set a password, so the "only sign-in method" state can persist (`:49-51`).

### Privacy and sessions › Cookies

- Row "Cookies", description "Choose which optional cookies we may use.", outline button "Manage" (`src/components/dashboard/settings/CookiesRow.tsx:14-23`).
- Opens the **Cookie Settings** dialog (max 512px wide, scrolls at 90% viewport height) (`src/components/modals/CookiePreferencesModal.tsx:127`):
  - Shield tile, title "Cookie Settings", description "Choose how we use your data" (`:128-138`).
  - Notice: "**Your Rights:** Withdraw consent anytime. If signed in, preferences sync with your account. Privacy Policy" (link to `/privacy-policy`) (`:141-153`).
  - Row "Essential Cookies" — "Needed for site security, login, and core features. Cannot be disabled." / "Examples: Sessions, tokens, accessibility, user details." Switch is on and **disabled** (`:155-162`).
  - Row "Analytics" — "Anonymous data to improve site performance and fix issues." / "Examples: Google Analytics via GTM, page views, clicks, errors". Switch, default **off** (`:163-169`; default `src/utils/cookies.ts:5-12`).
  - Row "Marketing" — "Personalized ads and content. May share data with partners." / "Examples: Ad pixels, retargeting, A/B tests, recommendations". Switch, default **off** (`:171-177`).
  - Footer note: "**Retention:** Analytics kept 26 months, marketing 13 months. You may request deletion anytime." (`:180-186`).
  - Buttons "Cancel" and "Save Settings" (`:189-196`).
- Saving writes localStorage, updates Google Tag Manager consent, and — only when signed in — stores the choice on the user's own row; a failed server write is swallowed so the dialog still closes (`:102-118`, `src/utils/cookies.ts:85-99`, `src/actions/consent.ts:25-50`).
- Cookie choices are deliberately separate from the legal consent gate (`docs/architecture/legal-consent.md:7`).

### Privacy and sessions › Sessions

- Row "Sessions", description "Signing out everywhere ends every session, this one included." (`src/components/dashboard/account/supabase/SessionsRow.tsx:50-51`).
- Two outline buttons: "Sign out" (with a logout icon) and a red-tinted "Sign out everywhere"; both disabled while one is running (`:29-48`).
- "Sign out" ends this browser's session and goes to `/` (`src/components/auth/session/SupabaseAuthProvider.tsx:85-88`).
- "Sign out everywhere" ends every session and redirects to `/`; on failure a toast with the mapped error or "Could not sign out everywhere." (`src/components/dashboard/account/supabase/SupabaseAccount.tsx:61-72`).
- No confirmation dialog for either.

### Danger zone › Delete account

- Row "Delete account" (red label), description "Cancels your subscription and permanently removes your catalogues and their public pages. This cannot be undone.", red button "Delete account" with a trash icon (`src/components/dashboard/account/supabase/DeleteAccountRow.tsx:55-65`).
- Dialog (440px): red warning tile, title "Delete your account?", body "Your active subscription is cancelled first, then your account and every catalogue you own are deleted. Published pages stop working immediately. There is no way back." (`:72-83`).
- Confirmation field: label "Type **DELETE** to confirm", `autoCapitalize="characters"`, `autoComplete="off"`, spellcheck off (`:85-97`).
- Buttons "Keep my account" (outline) and red "Delete permanently" / "Deleting..."; the delete button is enabled only when the field is exactly `DELETE` (case-sensitive) (`:99-114`). The dialog cannot be dismissed while deleting (`:66-70`).
- Success → toast "Your account was deleted.", local sign-out, then a hard navigation to `/` (`:46-48`, `src/components/dashboard/account/supabase/SupabaseAccount.tsx:74-85`).
- Failure messages: "We could not cancel your subscription, so nothing was deleted. Please contact support.", "We could not delete your account. Please contact support.", "We could not delete your account. Please try again.", "Not signed in.", or the fallback toast "Could not delete your account." (`src/actions/account.ts:105-110,117-122,141-147`, `DeleteAccountRow.tsx:43`).
- Order of operations: Paddle subscriptions are cancelled first and the whole deletion aborts if that fails; then the auth user is deleted (cascading `public.users`); then cached drafts; public pages are revalidated after the response (`src/actions/account.ts:80-139`).
- This action re-checks identity against the auth service rather than trusting the token, because a token can outlive a ban or sign-out-everywhere by up to an hour (`src/actions/account.ts:86-87,91`; `src/lib/auth/identity.ts:71-88`).

## Support tab

- Title "Support" with a question-mark icon, lead "We're here to help you get the most out of Quicktalog. Choose your preferred support method below." (`src/components/dashboard/Support.tsx:11-15`).
- **Meeting strip** (amber): calendar tile, heading "Prefer to talk it through?", text "Book a free 30-minute call to discuss your needs or get personalized help.", button "Schedule a meeting" (`src/components/dashboard/support/MeetingCta.tsx:22-49`).
- The button opens a dialog (max 760px) titled "Schedule a meeting" with the description "Customer support · 30 min. Pick a time that suits you.", the Calendly widget inline, and a footer link "Open Calendly in a new tab" (`:50-72`). Default Calendly URL `https://calendly.com/quicktalog/customer-support` unless `NEXT_PUBLIC_CALENDLY_URL` is set (`:15-17`).
- **Email Support card:** mail tile, title "Email Support", text "Send us a detailed message and we'll respond within 1 business day.", then the contact form prefilled with the signed-in user's name and email (`src/components/contact/SupportContactCard.tsx:26-48`).
- Contact-form validation (same Zod schema on client and server, server authoritative) (`src/constants/schemas.ts:376-416`): name required, max 100 ("Please enter your name." / "Please keep your name under 100 characters."); email required, valid, max 254 ("Please enter your email address." / "Enter a valid email address, for example name@company.com." / "This email address is too long."); subject required, max 150 ("Please choose a subject." / "This subject is too long."); message required, max 5000 ("Please tell us how we can help." / "Please keep your message under 5000 characters."). Rate limit 5 per hour (`src/lib/rate-limit.ts:12`).

## `/admin/checkout/success` — "Payment Successful!"

- Route `/admin/checkout/success`; Paddle sends the browser here after a successful checkout (`src/hooks/usePlanCheckout.ts:61-66`).
- Bare frame: **no navbar and no footer** — just the Quicktalog logo linking home, and a centred card (max 440px) on a grid-and-glow background (`src/app/admin/checkout/success/page.tsx:8-41`).
- Animated success mark, heading "Payment Successful!", line "Thank you for your purchase.", full-width button "Return to Dashboard" → `/admin/dashboard` (`:41-59`).
- Footer line: "Have questions? Contact us at:" followed by the support email as a `mailto:` link (`:60-69`; address from `src/constants/details.ts` `footerDetails.email`).
- Still behind the `/admin` guards: middleware redirects signed-out visitors (`src/middleware.ts:16,44`) and the consent gate applies (`src/app/admin/layout.tsx:27-29`).

## Navbar auth corner and account menu (how the user moves around)

- Signed out, desktop (960px+): outline "Log In" and solid "Start free", both 42px tall (`src/components/navigation/AuthLinks.tsx:161-179`).
- Signed in, desktop: a "Dashboard" pill plus a 42px amber avatar button; the avatar shows the photo or up to two initials (`src/components/navigation/AuthLinks.tsx:150-158`, `src/components/navigation/UserMenu.tsx:20-47`).
- Avatar menu (250px): the user's name and email at the top, then "Dashboard", "Account" (→ `/admin/dashboard?tab=settings`), a separator, and "Sign out" (which becomes "Signing out…") (`src/components/navigation/UserMenu.tsx:72-108`); trigger label "Account menu, <name>" (`:64`).
- Below 960px: only "Start free" (hidden when signed in) plus a burger that opens a sheet; the sheet's bottom block holds "Dashboard", the name/email row, "Account" and "Sign out" (`src/components/navigation/AuthLinks.tsx:47-59,62-125`).
- Until the auth state is known the corner keeps the signed-out footprint (236×42px) so the bar does not jump (`src/components/navigation/AuthLinks.tsx:145-148`).
- Signing out goes to `/` (`src/hooks/useSignOut.ts:14-22`).
- The displayed name falls back, in order, to `full_name`, `name`, the email's local part, then the literal "Account" (`src/components/auth/session/SupabaseAuthProvider.tsx:14-19`).

## Who can do what — guards, redirects, states

- Middleware protects `/admin/**` and `/catalogues/<name>/preview`: a signed-out visitor is redirected to `/auth?next=<the path they wanted>` (`src/middleware.ts:16,44`, `src/utils/supabase/session.ts:24-37`).
- Sessions are only read or refreshed on `/admin`, `/auth`, the preview route and `/api/dashboard|agent|items/uploadthing`; every other page is answered without touching cookies so a CDN can cache it (`src/middleware.ts:12-13,39-42`).
- `/admin/**` also passes the consent gate (`src/app/admin/layout.tsx:18-29`); `/admin/<name>/builder`, `/analytics` and `/qr-editor` additionally call `requireUser` themselves (`src/app/admin/[name]/builder/page.tsx:10`, `src/app/admin/[name]/analytics/page.tsx:25`, `src/app/admin/[name]/qr-editor/page.tsx:17`; helper `src/lib/auth/session.ts:12-15`).
- There is no `/admin` page — only `[name]`, `checkout` and `dashboard` live under it (directory listing of `src/app/admin`), so a signed-in user hitting `/admin` gets the 404 page; a signed-out one is redirected to `/auth` first (`src/middleware.ts:16`).
- The three dashboard API routes each check identity themselves and answer `401 {"error":"Unauthorized"}` when signed out, `500 {"error":"Failed to fetch …"}` on failure (`src/app/api/dashboard/analytics/route.ts:9-27`, `src/app/api/dashboard/catalogues/route.ts:9-26`, `src/app/api/dashboard/newsletter/route.ts:9-28`).
- Every query runs as a restricted role with the owner's id taken from the session, never from the client (`src/lib/dashboard/overview.ts:29-72`, `src/lib/auth/identity.ts:7-15,37-51`).
- **Email not confirmed:** sign-in fails with "Confirm your email address first - the link is in your inbox." (`src/components/auth/common/authMessages.ts:19-20`), and no `public.users` row exists yet — the sign-up trigger returns early until `email_confirmed_at` is set (`supabase/migrations/20260922090002_auth_users_sync.sql:159-162`, and `:177-179` creates it on confirmation).
- **Consent not accepted:** `/admin/**` bounces to `/auth/consent`; the navbar auth corner disappears there; declining signs the user out (`src/app/admin/layout.tsx:27-29`, `src/components/navigation/AuthLinks.tsx:39-45`, `src/components/auth/ConsentForm.tsx:68-72`).
- **Already signed in, following an email link:** the confirm interstitial refuses and asks the user to sign out first (`src/actions/auth-confirm.ts:34-38`).
- **Maintenance mode:** any request to `/admin`, `/auth`, those API routes, or any server action is answered with plain text "Quicktalog is down for maintenance. Back in a few minutes." (HTTP 503, `Retry-After: 900`) unless a bypass cookie is present (`src/middleware.ts:19-37`).
- Session tokens: access token lifetime 1 hour, refresh-token rotation on with a 10s reuse interval; the cookie itself is host-only, `SameSite=Lax`, not HttpOnly (the browser client must rotate the refresh token) with a 400-day `Max-Age`, but the real session lifetime is enforced by Supabase (`scripts/supabase/auth-config.prod.json:12-14`, `src/lib/auth/cookie-options.ts:8-21`).
- Anonymous sign-ins are off and are rejected by the identity check even if they existed (`scripts/supabase/auth-config.prod.json:5`, `src/lib/auth/identity.ts:44`).

## Limits and timing (one place)

- Password: minimum 8 characters, must contain a lowercase letter, an uppercase letter and a digit (`scripts/supabase/auth-config.prod.json:10-11`).
- Confirmation email link: "Expires in 24 hours" (`supabase/templates/confirmation.html:12,48`). Reset link: "Works once", "Expires in 1 hour" (`supabase/templates/recovery.html`).
- Once a link is *opened*, the parked token lasts 10 minutes (`src/app/auth/confirm/route.ts:35`), which is what the "This link has expired" card means (`src/components/auth/common/authMessages.ts:66-69`).
- Confirm attempts: 20 per IP per 10 minutes (`src/lib/rate-limit.ts:13`).
- Name changes: 5 per user per hour, fail-closed (`src/lib/rate-limit.ts:14`, `src/actions/account.ts:53`).
- Auth emails: 60 per hour on PROD, 30 on TEST (`rate_limit_email_sent`, `scripts/supabase/auth-config.prod.json:19`, `scripts/supabase/auth-config.test.json:19`).
- Contact/support messages: 5 per hour; newsletter sign-ups 5 per hour (`src/lib/rate-limit.ts:11-12`).
- Dashboard data: SWR dedupes for 60s, analytics re-fetch every 5 minutes, no re-fetch on focus or reconnect (`src/hooks/useDashboardData.ts:32-36,74`).
- Catalogue name: max 60 characters, letters/numbers/spaces only (`src/components/modals/CatalogueNameField.tsx:12`, `src/hooks/useCatalogueName.ts:23`).
- "Delete" on a catalogue in preparation unlocks 10 minutes after creation (`src/components/dashboard/overview/ItemDropdownMenu.tsx:73-80`).
- Acquisition-source free text: max 120 characters (`src/constants/users.ts:25`).

## Surprising automatic behaviour

- **A welcome email is sent on the first dashboard load**, not at sign-up: Supabase Auth has no `user.created` webhook, so `getUserData()` claims and sends it exactly once, after the response (`src/actions/users.ts:22-24`, `src/lib/users/welcome.ts:8-47`). Subject "Welcome to Quicktalog, your account is ready" (`src/lib/email/transactional.ts:91`). A Resend outage silently skips it rather than risking a resend (`src/lib/users/welcome.ts:19-22`).
- **The `public.users` row is created on email confirmation**, not at sign-up, and it is stamped with the plan from `private.settings.default_plan_id` plus the three consent flags; the flags are true only when the submitted `terms_version` matches the live one, so a **Google sign-up always lands not-accepted** and meets the consent gate (`supabase/migrations/20260922090002_auth_users_sync.sql:123-144,159-162,177-179`; `docs/architecture/legal-consent.md:60`).
- Changing a password signs out every other device automatically, from both the recovery screen and the settings row (`src/components/auth/UpdatePasswordForm.tsx:41-44`, `src/components/dashboard/account/supabase/PasswordRow.tsx:83-85`).
- The "How did you hear about us?" dialog appears unprompted on the first dashboard visit and cannot be dismissed without answering or skipping (`src/components/dashboard/overview/AcquisitionSourceModal.tsx:69`).
- After a downgrade the "Catalogue Limit Exceeded" dialog opens by itself and blocks the overview until enough catalogues are deleted (`src/components/dashboard/Overview.tsx:73-75`, `src/components/dashboard/overview/DeleteMultipleItemsModal.tsx:78`).
- Signing out in one browser tab signs out the others (`onAuthStateChange` fires everywhere) (`src/components/auth/session/SupabaseAuthProvider.tsx:27-29`).
- A rename fires the CRM sync trigger, which is why it is rate limited (`src/actions/account.ts:41-42`).
- Deleting the account cancels the Paddle subscription first and takes every published catalogue page offline (`src/actions/account.ts:80-139`).
- A duplicate session cookie set by a sibling subdomain is silently cleared in production (it used to look like a random sign-out) (`src/utils/supabase/session.ts:42-66`).
- An avatar from Google is copied onto the user row only when none is stored; the display name is never synced back from the provider (`supabase/migrations/20260922090002_auth_users_sync.sql:167,185-190`).

---

## Contradictions

- **Sign-ups may be switched off.** Both `scripts/supabase/auth-config.{test,prod}.json:4` declare `"disable_signup": true`. If that desired state matches the live projects, the "Create account" form looks fully functional but every submit returns "New accounts are closed at the moment." (`src/components/auth/common/authMessages.ts:29-30`). An existing plan note flags it as a cutover leftover whose live value was not checked (`.claude/plans/active/2026-10-25-codebase-cleanup/FINDINGS.md:69`), and the integration test reads the live value rather than assuming it (`tests/integration/auth/signup.test.ts:98-99`). **Must be verified against the live project before documenting sign-up.**
- **Password rules as shown vs as enforced.** The UI says "Use at least 8 characters." / "At least 8 characters." and the meter only talks about length and variety (`src/components/auth/forms/SignUpForm.tsx:164`, `src/components/dashboard/account/supabase/PasswordRow.tsx:156-157`, `src/components/auth/common/PasswordMeter.tsx:16-24`), but the server also requires a lowercase letter, an uppercase letter **and** a digit (`scripts/supabase/auth-config.prod.json:11`). The user hits the server rule, and the only feedback is "That password is too weak. Use a longer one." on the auth screens (`src/components/auth/common/authMessages.ts:27-28`) — which does not mention the character requirement at all. The settings row's version does: "That password is too weak. Use at least 8 characters with letters and digits." (`src/components/dashboard/account/supabase/authErrors.ts:17`). Two different messages for the same rule.
- **"Confirmation links are valid for 10 minutes"** (`src/components/auth/common/authMessages.ts:68`) describes the app's own 10-minute cookie (`src/app/auth/confirm/route.ts:35`), while the email itself says "Expires in 24 hours" (`supabase/templates/confirmation.html:48`) and the recovery email says "Expires in 1 hour" (`supabase/templates/recovery.html`). Both are true of different clocks (time to open the link vs time to press the button once opened), but the wording will read as a contradiction to a user.
- **Reset-link tips vs reality.** The success card says "The link can be used once and expires, so open it soon." and "Open it in this browser to keep things simple." (`src/components/auth/forms/ResetPasswordForm.tsx:21-23`). Opening it in another browser does work (the confirm action creates the session there), but the browser that *started* the request is not the one that matters — only the browser that opens the link gets the recovery session (`src/actions/auth-confirm.ts:60-70`).
- **Sign-up "required" fields vs server checks.** Full name is `required` with `maxLength={100}` in the form (`src/components/auth/forms/SignUpForm.tsx:143,147`), but the server-side rename rule is 1–80 characters (`src/actions/account.ts:28-38`). A 100-character name can be set at sign-up (it goes into auth metadata, `:72`) and then cannot be re-saved unchanged from Settings, where `maxLength={80}` applies (`src/components/dashboard/account/supabase/ProfileRow.tsx:63`).
- **Email change has no client-side validation worth the name.** The button only checks for an `@` (`src/components/dashboard/account/supabase/EmailRow.tsx:101`); everything else is the server's "That email address is not valid." (`src/components/dashboard/account/supabase/authErrors.ts:21-22`).
- **Dashboard "signed-out" branch is unreachable in practice.** `src/app/admin/dashboard/page.tsx:55-66` renders "Something went wrong. Please try again later." when `getUserData()` returns null, which includes the signed-out case (`src/actions/users.ts:14-15`) — but middleware redirects signed-out visitors before the page runs (`src/middleware.ts:16,44`). The message a user actually sees there is about a database failure, not about being signed out.
- **The free plan's "Manage subscription" button.** The row's text promises "Update billing details, check transactions or cancel subscription." while the button next to it is disabled on the free plan (`src/components/dashboard/subscription/PlanDetails.tsx:139-148`).
- **Sidebar tab labels vs page titles.** The tab says "Subscription" but the page title is "Subscription Overview"; the tab says "Usage" but the title is "Usage Overview" (`src/constants/dashboard.tsx:12-13` vs `src/components/dashboard/Subscription.tsx:29`, `src/components/dashboard/MonthlyUsage.tsx:98`). The Overview tab's own first section heading is "Dashboard", not "Overview" (`src/components/dashboard/Overview.tsx:162`).

## Could not confirm

- **Whether sign-ups are actually open.** Only the desired-state JSON was read; the live Supabase setting was not queried (no DB/API access used, per the rules). See the contradiction above.
- **Whether the Turnstile captcha is live.** `useTurnstile` renders nothing without `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (`src/components/auth/common/useTurnstile.tsx:6,44`) and env values were not read. The config files say captcha is required (`scripts/supabase/auth-config.prod.json:16-17`, go/no-go check `scripts/supabase/auth-config.ts:182-184`), which implies the widget is present in both hosted environments — but the exact widget text beyond the app's own "Protected by Cloudflare Turnstile against bots." is Cloudflare's and was not read.
- **Whether the emailed confirmation code for a password change always appears.** `security_update_password_require_reauthentication: true` is in both config files (`scripts/supabase/auth-config.prod.json:9`), which should make the nonce step unconditional, yet the UI treats it as a surprise branch triggered by an error code (`src/components/dashboard/account/supabase/PasswordRow.tsx:56-73`). Whether a user *always* gets the extra field on the first attempt was not verified against a live project.
- **The exact OTP/link expiry values in the hosted projects.** `mailer_otp_exp` is not managed by `scripts/supabase/auth-config.*.json`, so "24 hours" and "1 hour" come only from the email copy (`supabase/templates/confirmation.html:48`, `supabase/templates/recovery.html`), not from a setting in the repo.
- **The support email address shown on the checkout-success page.** It is `footerDetails.email` from `src/constants/details.ts`, which was not opened; the schema files quote `quicktalog@outlook.com` (`src/constants/schemas.ts:22-24`) and the auth emails say "Write to quicktalog@outlook.com" (`supabase/templates/recovery.html`), but the constant itself was not read.
- **`statusOrder`** (the catalogue card sort order on the overview) lives in `src/constants/sort.ts`, which was not read; only that it exists and is used (`src/components/dashboard/overview/CatalogueGrid.tsx:8,41`).
- **The "Embed" menu item's output.** `handleDownloadHTML` (`src/lib/catalogue/download.ts`) was not read, so the downloaded file name and contents are unknown (`src/components/dashboard/overview/ItemDropdownMenu.tsx:153`).
- **The plan-limit dialog's copy** (opened by "Duplicate" at the limit, and by the "+" button) comes from `src/components/modals/limits/*`, which were not read — only the dialog's wiring (`src/components/dashboard/overview/ItemDropdownMenu.tsx:259-265`, `src/components/modals/LimitsModal.tsx:21-56`).
- **Google's own consent screen** text is not ours (`src/components/auth/common/GoogleButton.tsx:61`).
- **Browser-default validation messages.** Fields marked `required` / `type="email"` / `minLength` rely on the browser's own bubbles ("Please fill out this field", etc.); the app supplies no custom text for them, and the wording varies by browser.
- **Whether the mobile breakpoints are exactly 540/720/960/1140/1320px.** `tailwind.config.ts` sets no `screens` block and wraps the config in `withMT` (`tailwind.config.ts:48-49`), so the values come from Material Tailwind rather than from this repo; the 960px figure is corroborated by `src/components/navigation/Navbar.tsx:16` and the 720px figure by the comments at `src/components/dashboard/navigation/DashboardSidebar.tsx:6` and `src/components/dashboard/navigation/DashboardTabBar.tsx:14`.
