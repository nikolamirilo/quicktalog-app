# Auth folder structure: before and after

Companion to [PLAN.md](PLAN.md). Derived from how the rest of `components/` is already
organised — the conventions and their evidence are listed first, then the tree that follows them.

## Conventions this project already follows

Surveyed across all 18 folders in `components/`.

| # | Convention | Evidence |
|---|---|---|
| 1 | **Subfolder names are lowercase**, kebab-case when multiword | `catalogue/{builder,cards,chat,inputs,modals,sections,view}`, `catalogue/inputs/custom-code`, `dashboard/{account,components,overview,subscription}`, `qr-editor/controls`, `modals/limits`. Only `home/{Benefits,Pricing,Showcases}` is PascalCase — the lone outlier |
| 2 | **The feature root holds whole screens, flat; subfolders hold their parts** | `dashboard/` keeps `Dashboard.tsx`, `Overview.tsx`, `Settings.tsx`, `Subscription.tsx`, `Support.tsx` flat and pushes the pieces into `overview/`, `subscription/`, `account/`. `qr-editor/` keeps `QrEditor.tsx`, `QrControls.tsx`, `QrPreview.tsx` flat, parts in `controls/` |
| 3 | **Shared pieces within a group go in `common/`** | `catalogue/sections/common/` (7 files), `catalogue/cards/common/` (4 files) |
| 4 | **Provider variants sit side by side, distinguished by a `Clerk*` / `Supabase*` filename prefix — never by folder** | `dashboard/account/{ClerkAccount.tsx, SupabaseAccount.tsx}`. All six provider-variant files in the repo follow this; none is in a provider-named folder |
| 5 | **A hook used by one feature is co-located with it** | `catalogue/inputs/heading/useHeadingEditor.ts` lives beside its components, not in `hooks/` |
| 6 | **Copy and content tables are co-located as `.ts` beside the components** | `modals/limits/limitContent.ts` |
| 7 | **`index.ts` barrels are optional and rare** | Only `navigation/index.ts`, `emails/index.ts`, `catalogue/inputs/heading/index.ts`. Not proposed here |

### Where this corrects the first draft

- `ui/` → **`common/`** (convention 3). The project already has a name for this folder.
- `providers/clerk/` → **dropped** (convention 4). Quarantining Clerk in its own folder would
  make `components/auth/` the only place in the codebase doing it that way, and it would split
  the `Clerk*`/`Supabase*` pairing that `dashboard/account/` established for exactly this problem.
- `hooks/useTurnstile.ts` → **`common/useTurnstile.ts`** (convention 5). `useHeadingEditor.ts`
  is the precedent; the earlier claim that no hook lives under `components/` was wrong.
- `lib/auth/messages.ts` → **`common/authMessages.ts`** (convention 6). `lib/auth/*` is auth
  *mechanics* (identity, redirects, cookies, terms); user-facing copy is `limitContent.ts`'s kind
  of file. Still plain exported objects, so `tests/unit/` can import it directly.

## Before

```
components/auth/                        10 flat files, 1127 lines
├── Auth.tsx                             63   consent gate + provider switch + layout
├── AuthCard.tsx                        120   5 unrelated primitives + class constants
├── AuthLayout.tsx                       17
├── AuthProvider.tsx                     21   session provider switch
├── ClerkAuthForms.tsx                   24
├── ClerkAuthProvider.tsx                45
├── ConfirmContinue.tsx                 141   screen + its own copy table
├── SupabaseAuthForms.tsx               512   ⚠ six independent units in one file
├── SupabaseAuthProvider.tsx             80
└── UpdatePasswordForm.tsx              104   screen + its own error mapping
```

What is packed into `SupabaseAuthForms.tsx`:

```
SupabaseAuthForms.tsx (512)
├── LANDING_ERRORS          copy for /auth?error=
├── errorMessage()          GoTrue code → copy      ← duplicated in UpdatePasswordForm
├── useCaptcha()            Turnstile widget hook
├── GoogleButton()          OAuth control
├── SignInForm()            screen 1
├── SignUpForm()            screen 2
├── ResetForm()             screen 3
└── default export          the switcher between them
```

## After

Root = whole screens (convention 2). Subfolders = their parts.

```
components/auth/
├── Auth.tsx                     /auth entry: consent gate + provider switch
├── AuthProvider.tsx             session provider switch
├── SupabaseAuthForms.tsx        /auth screen, Supabase — picks sign-in / sign-up / reset
├── ClerkAuthForms.tsx           /auth screen, Clerk
├── UpdatePasswordForm.tsx       /auth/update-password screen
├── ConfirmContinue.tsx          /auth/confirm/continue screen
│
├── common/                      shared parts — no supabase-js import
│   ├── AuthLayout.tsx           page frame: centring, navbar clearance
│   ├── AuthCard.tsx             card shell + centred title/subtitle
│   ├── AuthField.tsx            label + input + optional label-row action
│   ├── AuthNotice.tsx           error / info block (today's AuthError)
│   ├── AuthDivider.tsx
│   ├── AuthFooter.tsx
│   ├── AuthModeTabs.tsx         NEW — option C's segmented control
│   ├── SubmitButton.tsx         NEW — today's SUBMIT constant + busy label
│   ├── GoogleButton.tsx         shared OAuth control
│   ├── useTurnstile.ts          NEW home for useCaptcha
│   └── authMessages.ts          NEW — every user-facing auth string
│
├── forms/                       the three screens behind /auth
│   ├── SignInForm.tsx
│   ├── SignUpForm.tsx
│   └── ResetPasswordForm.tsx
│
└── session/                     who is signed in; variants by filename, not folder
    ├── SupabaseAuthProvider.tsx
    └── ClerkAuthProvider.tsx
```

`session/` is named for the concern, the way `dashboard/account/` is, rather than for the
mechanism (`providers/`). The `Clerk*` / `Supabase*` prefixes carry the variant.

**The one rule worth enforcing in review:** nothing in `common/` may import `@/utils/supabase/*`.
That is what keeps layout work free of auth logic.

### What `authMessages.ts` absorbs

```
common/authMessages.ts
├── ← errorMessage()   from SupabaseAuthForms.tsx   GoTrue code → copy
├── ← message()        from UpdatePasswordForm.tsx  same shape, overlapping strings
├── ← LANDING_ERRORS   from SupabaseAuthForms.tsx   /auth?error= copy
└── ← MESSAGES         from ConfirmContinue.tsx     confirm-link outcomes
```

`errorMessage()` and `message()` return character-identical strings for `weak_password` and
`over_request_rate_limit` today.

## Import sites that change

Only two lines, both for `AuthLayout` moving into `common/`. Everything else keeps its path,
because the screens stay at the folder root.

```
app/auth/update-password/page.tsx          AuthLayout
app/auth/confirm/continue/page.tsx         AuthLayout
```

Unchanged: `Auth`, `AuthProvider`, `UpdatePasswordForm`, `ConfirmContinue` imports in
`app/auth/[[...rest]]/page.tsx`, the two pages above, and `components/wrappers/PageWrapperClient.tsx`.
No test imports a component from this folder.

## Untouched — already one concern per file

Listed so the whole auth surface is visible in one place. No changes proposed here.

```
lib/auth/                               262 lines, 6 modules — auth mechanics
├── identity.ts                         127   server-side verified identity
├── redirects.ts                         45   safeNext()
├── terms.ts                             34   current terms version
├── cookie-options.ts                    33
├── session.ts                           16
└── provider.ts                           7   AUTH_PROVIDER build-time switch

utils/supabase/                         328 lines, 6 modules
├── session.ts                          128
├── server-forwarded.ts                  81
├── middleware.ts                        40
├── server.ts                            38
├── client.ts                            21
└── auth-admin.ts                        20

app/auth/                               288 lines
├── [[...rest]]/page.tsx                 29   /auth
├── callback/route.ts                    69   OAuth PKCE exchange
├── confirm/route.ts                     43
├── confirm/continue/page.tsx            29
├── confirm/continue/actions.ts          85
└── update-password/page.tsx             33

context/
└── AuthContext.tsx                            provider-agnostic useAuth()
```
