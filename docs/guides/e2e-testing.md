# Running the e2e suite

Playwright drives a real browser against a real database. The suite signs in,
creates a catalogue and deletes it again, so it runs against a local dev server
or TEST — **never production**. `playwright.config.ts` refuses the production
hostname outright rather than trusting anyone to remember.

```sh
npm run test:e2e          # headless
npm run test:e2e:ui       # the Playwright UI
```

## Configuration

Credentials go in `.env.test.local`, which is git-ignored. There is no template
file in the repo: a git hook blocks writing any `.env*` path, which is the
correct trade — so create it by hand with the variables below.

Everything is read by `playwright.config.ts`, which loads `.env` first and then
`.env.test.local` on top.

### Always needed

| Variable | Meaning |
|---|---|
| `AUTH_PROVIDER` | `clerk` or `supabase`. Picks the setup project and the saved session file. |
| `NEXT_PUBLIC_BASE_URL` | `http://localhost:3000` (Playwright starts `npm run dev` for you) or the TEST deployment (no dev server is started). |
| `DB_CONNECTION_STRING` | TEST pooler URL, port 6543. What the app reads. |
| `DB_ADMIN_CONNECTION_STRING` | The `postgres` login. Cleanup between tests needs it: after M08 the app login cannot delete another user's rows. |
| `REDIS_KEY_PREFIX` | Something local, e.g. `dev-local`, so your drafts never collide with TEST or PROD. |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | The builder writes drafts through Redis. |

### `AUTH_PROVIDER=clerk`

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | A Clerk **development** instance. `clerkSetup()` uses the secret key to fetch a testing token so the run is not treated as a bot; a production instance will not issue one. |
| `E2E_CLERK_USER_USERNAME`, `E2E_CLERK_USER_PASSWORD` | An existing test user. |

### `AUTH_PROVIDER=supabase`

| Variable | Meaning |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The TEST project. |
| `SUPABASE_SECRET_KEY` | Used only by the setup project, to mint a login link. |
| `E2E_SUPABASE_USER_EMAIL` | An existing, confirmed test user. |

The setup **never creates the user**. A misconfigured run fails loudly instead
of quietly inventing an account.

## How each leg signs in

**Clerk** signs in programmatically with `clerk.signIn()` rather than driving
the Clerk UI, which is more reliable and does not break when Clerk restyles its
forms.

**Supabase** cannot use the sign-in form at all: it is captcha-gated, and a
captcha cannot be solved in CI. Instead the setup asks the admin API for a magic
link and lets the browser complete it, so the session cookies are written by the
app exactly as they are for a real visitor.

That link lands on `/auth/confirm`, which **verifies nothing**. It moves the
token into a short-lived cookie and redirects to an interstitial, so that a mail
scanner or a link prefetcher cannot spend a one-time token. The token is only
consumed when something presses the button — so the setup presses it, twice:
*Confirm and continue*, then *Continue*. Anything that navigates straight to
`/admin/dashboard` after opening the link ends up with no session at all.

## When it fails

- **"The confirm interstitial did not offer the button"** — the setup prints
  what the page said. The usual causes are a session already in the browser
  (the interstitial refuses to confirm while signed in, which is a login-CSRF
  defence), the 10-minute cookie having expired, or the `confirm` rate limit
  being hit by repeated runs from one IP.
- **Clerk testing token errors on the Supabase leg** — `AUTH_PROVIDER` is not
  set to `supabase`. `globalSetup` skips `clerkSetup()` only when it is.
- **The create button opens the upgrade modal** — a catalogue was left behind by
  an earlier run and the test account's plan allows exactly one. The spec sweeps
  before *and* after each test for this reason; if it still happens, delete the
  `e2e-test-*` catalogues by hand.
- **A dev server starts when you wanted TEST** — `NEXT_PUBLIC_BASE_URL` is
  localhost. The dev server is only started for a local base URL.

## In CI

`.github/workflows/ci.yaml` runs the suite as a matrix over both providers,
because both exist between Phase 2 and the Clerk cutover and the suite has to
pass on each. The `supabase` leg skips itself while `E2E_SUPABASE_USER_EMAIL` is
unset — a skip says more than a red build that means "not configured yet".
