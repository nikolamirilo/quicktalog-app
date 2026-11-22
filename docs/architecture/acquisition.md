# Where a signup came from

Two different questions, kept in two different columns, because neither answers the
other: tracking never shows word of mouth, and people misremember which link they
clicked.

| Column on `public.users` | What it holds |
|---|---|
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | The UTM tags on the URL the visitor first landed on |
| `referrer_domain`, `landing_path`, `first_seen_at` | The rest of the first touch |
| `acquisition_source` | The **derived channel** (`google`, `linkedin`, `ai_search`, `catalogue_badge`, `direct`, …) |
| `self_reported_source` | The answer to "How did you hear about us?", in the user's own words |

Before November 2026 `acquisition_source` was the self-reported answer, and it was null
for 2,180 of 2,200 accounts, because that modal is the only thing that ever wrote it.

## How the first touch is recorded

1. **The browser writes it, on the first page.** `FirstTouch` (mounted in
   `PageWrapperClient`) calls `recordFirstTouch` from `lib/analytics/first-touch.ts`,
   which puts a `qt_ft` cookie on the visitor: the UTM tags, the referring domain, the
   landing path and the time. It is written once and never overwritten for 90 days.

   **Not in middleware, on purpose.** The middleware returns public pages with no
   `Set-Cookie` so the CDN can cache them for everyone; a cookie set there would make
   the landing page uncacheable. A first-party cookie written by the page is also not
   blocked by the ad blockers that hide PostHog for part of the traffic, which is the
   gap this fills.

   Published catalogues (`/catalogues/*`) are skipped: they are the owner's pages.

2. **Consent is respected.** With analytics cookies explicitly declined, the same object
   is held in `sessionStorage` instead. On `/auth` it is promoted to a *session* cookie
   (`attachFirstTouchForSignup`), so it travels with the sign-up request and is not
   stored on the device.

3. **The server claims it at signup.** `claimFirstTouch` (`lib/users/acquisition.ts`)
   runs in the two paths a new account comes through - `/auth/callback` for Google and
   `confirmEmailToken` for email - reads the cookie, writes the columns and derives the
   channel. Both can read and write cookies; the database trigger that creates the user
   row never sees one.

   The write is guarded by `first_seen_at is null`, so the first touch stays the first
   touch however many times someone signs in, and the cookie is cleared once it has
   done its job.

4. **PostHog is identified.** `UserContext` calls `posthog.identify(user.id)` as soon as
   there is a session, so the anonymous visit history joins the account.

## Deriving the channel

`deriveChannel`, in this order:

1. `utm_source` if there is one, lowercased;
2. otherwise the referring domain: `google.*` → `google`, `linkedin.com`/`lnkd.in` →
   `linkedin`, `producthunt.com` → `producthunt`, `chatgpt.com`/`perplexity.ai`/
   `gemini.google.com`/`claude.ai` → `ai_search`, `t.co`/`x.com` → `x`,
   `facebook.com`/`instagram.com` → `meta`, plus bing, duckduckgo, youtube and reddit;
3. a referrer on our own domain → `catalogue_badge` (a published catalogue's footer);
4. any other referrer → `referral`;
5. nothing at all → `direct`.

## Link convention when sharing

Tag every link you put somewhere, or it arrives as `direct` (no referrer) or as a bare
domain:

| Where you post | Link |
|---|---|
| Product Hunt | `quicktalog.app/?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_2026` |
| LinkedIn post | `quicktalog.app/?utm_source=linkedin&utm_medium=social&utm_campaign=<post-topic>` |
| Outreach email | `quicktalog.app/?utm_source=<tool>&utm_medium=email&utm_campaign=<segment>` |
| Paid ads | `quicktalog.app/?utm_source=<google or meta>&utm_medium=cpc&utm_campaign=<ad-group>` |
| Catalogue footer badge | `quicktalog.app/?utm_source=catalogue&utm_medium=referral&utm_campaign=badge` |
| Agency partner | `quicktalog.app/?utm_source=partner&utm_medium=referral&utm_campaign=<agency-name>` |

The footer badge is already tagged in code: `CATALOGUE_BADGE_UTM` in
`src/constants/marketing.ts`, used by the catalogue footer's logo link and its "Create
your own" button.

## Reading the result

`public.acquisition_funnel` is a `security_invoker` view with no grants to the app
roles, so only `postgres` and `service_role` can read it. One row per month and
channel: `signups`, `created_a_catalogue`, `published`, `paying`.

```sql
select * from public.acquisition_funnel order by month desc, signups desc;
```

## Backfilling older accounts

`scripts/supabase/backfill-acquisition.ts` reads `$initial_utm_source` and
`$initial_referring_domain` from PostHog persons and runs them through `deriveChannel`,
so a backfilled channel means the same thing as a tracked one. It never overwrites a
channel that is already there, and it leaves `first_seen_at` null: PostHog's first touch
has no timestamp we could honestly put there.
