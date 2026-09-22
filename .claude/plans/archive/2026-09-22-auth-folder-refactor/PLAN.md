# Auth folder refactor

Status: done

Restructure `components/auth/` before building the new sign-in layout (option C: one card,
a segmented Sign in / Create account toggle, mode held in state instead of `?mode=`).

Implemented 2026-09-22, all three steps. `SupabaseAuthForms.tsx` went from 512 lines to 74.
Behaviour changes are listed under "One decision this refactor has to settle" and in the
sequence below; everything else is motion.

## Why

`components/auth/` is 10 flat files, and one of them does almost everything:

| File | Lines | What is inside |
|---|---|---|
| `SupabaseAuthForms.tsx` | 512 | landing-error copy, GoTrue error mapping, the Turnstile hook, the Google button, three separate screens (sign-in, sign-up, reset), and the switcher between them |
| `ConfirmContinue.tsx` | 141 | its own copy table + the screen |
| `AuthCard.tsx` | 120 | five unrelated presentational primitives + shared class constants |
| `UpdatePasswordForm.tsx` | 104 | its own error mapping + the screen |

Three concrete problems:

1. **`SupabaseAuthForms.tsx` holds six independent units.** Editing the sign-up terms checkbox
   means opening the same file as the captcha hook and the reset flow. Option C adds a seventh
   (the mode toggle) to the same file.
2. **Error copy is written three times.** `errorMessage()` in `SupabaseAuthForms.tsx` and
   `message()` in `UpdatePasswordForm.tsx` both map `AuthError.code` → copy and return
   *character-identical* strings for `weak_password` and `over_request_rate_limit`. `ConfirmContinue.tsx`
   keeps a third table. A wording change today means finding all three.
3. **Clerk is scheduled for deletion** (migration plan phase 5.1, "remove Clerk code, packages,
   provider switch and e2e leg") but its two files sit interleaved with the Supabase ones, so
   that deletion is a hunt rather than a `rm -rf`.

What is *not* broken and should not be touched: `lib/auth/` (6 focused modules),
`utils/supabase/` (6 focused modules), `context/AuthContext.tsx`, `app/auth/**`.
Those are already one-concern-per-file.

## Proposed structure

Derived from a survey of all 18 folders in `components/`. The conventions, their evidence, and
the full before/after trees are in [STRUCTURE.md](STRUCTURE.md); the four that shape this are:

1. **Subfolder names are lowercase** — `catalogue/{builder,cards,chat,inputs,modals,sections,view}`,
   `dashboard/{account,components,overview,subscription}`, `qr-editor/controls`. (`home/` is the
   lone PascalCase outlier.)
2. **The feature root holds whole screens, flat; subfolders hold their parts** — `dashboard/`
   keeps `Dashboard.tsx`, `Overview.tsx`, `Settings.tsx` flat and pushes pieces into
   `overview/`, `subscription/`, `account/`.
3. **Shared pieces within a group go in `common/`** — `catalogue/sections/common/`,
   `catalogue/cards/common/`.
4. **Provider variants sit side by side under a `Clerk*` / `Supabase*` filename prefix, never in
   a provider-named folder** — `dashboard/account/{ClerkAccount.tsx, SupabaseAccount.tsx}`.

```
components/auth/
  Auth.tsx                    /auth entry: consent gate + provider switch
  AuthProvider.tsx            session provider switch
  SupabaseAuthForms.tsx       /auth screen, Supabase — picks sign-in / sign-up / reset
  ClerkAuthForms.tsx          /auth screen, Clerk
  UpdatePasswordForm.tsx      /auth/update-password screen
  ConfirmContinue.tsx         /auth/confirm/continue screen

  common/                     shared parts — no supabase-js import
    AuthLayout.tsx            page frame: centring, navbar clearance
    AuthCard.tsx              card shell + centred title/subtitle
    AuthField.tsx             label + input + optional label-row action
    AuthNotice.tsx            error / info block (today's AuthError)
    AuthDivider.tsx
    AuthFooter.tsx
    AuthModeTabs.tsx          NEW — option C's segmented control
    SubmitButton.tsx          NEW — today's SUBMIT constant + busy-label handling
    GoogleButton.tsx          shared OAuth control
    useTurnstile.ts           NEW home for useCaptcha
    authMessages.ts           NEW — every user-facing auth string

  forms/                      the three screens behind /auth
    SignInForm.tsx
    SignUpForm.tsx
    ResetPasswordForm.tsx

  session/                    who is signed in; variants by filename, not folder
    SupabaseAuthProvider.tsx
    ClerkAuthProvider.tsx
```

Nothing leaves `components/auth/`. Two co-locations that an earlier draft had sending elsewhere:

- **`common/useTurnstile.ts`**, not `hooks/useTurnstile.ts` — `catalogue/inputs/heading/useHeadingEditor.ts`
  is the precedent for a single-feature hook living beside its components.
- **`common/authMessages.ts`**, not `lib/auth/messages.ts` — `lib/auth/*` is auth *mechanics*
  (identity, redirects, cookies, terms). User-facing copy is `modals/limits/limitContent.ts`'s
  kind of file. Plain exported objects either way, so `tests/unit/` can still import it.

`session/` is named for the concern, the way `dashboard/account/` is, rather than for the
mechanism; the `Clerk*` / `Supabase*` prefixes carry the variant.

The `common/` ↔ `forms/` split is the load-bearing one: `common/` may not import
`@/utils/supabase/*`. That keeps the layout work (what you are actually changing) free of auth
logic, and is worth enforcing in review.

### Rough sizes after the split

`SignUpForm` ~150, `SignInForm` ~100, `ResetPasswordForm` ~90, `GoogleButton` ~50,
`SupabaseAuthForms` ~45, `common/authMessages.ts` ~90, `common/useTurnstile.ts` ~35.
Nothing over ~150; today's peak is 512.

## Blast radius outside the folder

**Two lines**, both `AuthLayout` moving into `common/`:

- `app/auth/update-password/page.tsx`
- `app/auth/confirm/continue/page.tsx`

Everything else keeps its import path, because the screens stay at the folder root:
`Auth`, `AuthProvider`, `UpdatePasswordForm`, `ConfirmContinue` are imported by
`app/auth/[[...rest]]/page.tsx`, the two pages above, and
`components/wrappers/PageWrapperClient.tsx` — all unchanged.

No test imports a component from `components/auth/`, so the unit and integration suites are
unaffected by the moves. `tests/e2e/auth.supabase.setup.ts` drives the real page and will catch
anything that breaks.

## One decision this refactor has to settle

Option C moves the mode from the URL into React state, which collides with the consent gate in
`Auth.tsx`. Today it reads `?mode=signup` on mount, checks `localStorage.consent`, and blocks
rendering behind a `useEffect` — which is also why the card is missing from the server HTML and
flashes in on hydration.

With a tab toggle there is no page load to hang that check on. Proposal: extract
**`common/useSignupConsent.ts`** (co-located, same as `useTurnstile.ts`), and have the sign-up
*tab* request consent when it is selected rather than the page requesting it on mount. Side
benefit: the sign-in screen renders server-side again, removing the hydration flash.

`?mode=signup` stays supported as the *initial* tab (links elsewhere in the app point at it) but
stops being the source of truth.

## Sequence

1. **Moves and extractions only** — no behaviour change. `npx tsc --noEmit`, `npm run check`,
   `npm test` green, `/auth`, `/auth?mode=signup`, `/auth/update-password`,
   `/auth/confirm/continue` render unchanged. One commit, easy to review as pure motion.
2. **Consent gate** — `useSignupConsent`, server-rendered sign-in screen.
3. **Option C** — `AuthModeTabs`, state-driven mode, tinted page ground. The navbar stays
   (it carries the logo, so the card needs no logo of its own).

Steps 2 and 3 are where behaviour changes and where review effort belongs. Keeping step 1
separate is the point of doing it first.

## Open question

Does the Clerk leg still need to work while this lands?

*How* Clerk is arranged is settled by convention — `Clerk*` / `Supabase*` filename prefixes side
by side, as in `dashboard/account/`. Phase 5.1 ("remove Clerk code, packages, provider switch and
e2e leg") is then a matter of deleting the four `Clerk*`-prefixed files and the `AUTH_PROVIDER`
branch, which a filename grep already finds — the same way the rest of the codebase would handle
it. No quarantine folder is needed, and inventing one here would make `components/auth/` the only
place in the repo that does it differently.

*Whether* to do that deletion now is still open. If 5.1 is close, this pass could drop
`ClerkAuthForms.tsx`, `ClerkAuthProvider.tsx`, `AuthProvider.tsx` and the branch in `Auth.tsx`
outright. That is a bigger change and is not assumed here.
