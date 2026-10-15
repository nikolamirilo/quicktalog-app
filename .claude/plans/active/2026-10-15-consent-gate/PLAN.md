# Consent gate: recording acceptance of all three legal documents

Status: in progress

Code complete and verified locally on 2026-10-15 (§13). What remains is not
code: the operator insert of `terms_version`, a TEST deploy with
`AUTH_PROVIDER=supabase`, and legal sign-off on the wording and on re-consenting
existing users at the cutover (the auth migration plan's "input 14"). Design
decisions are settled in §12.

## 1. Problem

A Google sign-up accepts nothing. `GoogleButton` goes straight to
`signInWithOAuth`, and the only legal text the user sees is Google's own consent
screen — which is Google disclosing *Google's* data sharing and linking our
documents, not the user assenting to our contract. Nothing comes back from it:
no version, no timestamp, no row.

The database already treats this correctly. `private.create_user_row`
(`supabase/migrations/20260922090002_auth_users_sync.sql:127-128`) sets
`consents` to not-accepted unless the sign-up metadata carries the current
`terms_version`, which only the email form sends. So today a Google user lands
on the dashboard with:

```json
{"terms-and-conditions": false, "privacy-policy": false, "refund-policy": false, "source": "signup"}
```

and nothing ever asks them again. `tests/integration/auth/signup.test.ts:142`
already asserts this and says why: *"Nobody agreed to anything by signing up;
the gate asks separately."* The gate is the missing half.

Second defect, independent of Google: the email form's checkbox
(`src/components/auth/forms/SignUpForm.tsx:176-206`) names the Terms and the
Privacy Policy, but both `create_user_row` and `private.record_consents` write
`refund-policy: true` as well. The stored record claims an acceptance the UI
never asked for.

## 2. Decision

Build what the auth migration plan already specified (`PLAN.md:693`, `:1109`):
a **post-authentication consent gate** that records acceptance server-side
against a version, plus a **point-of-action notice** next to the Google button.

Rejected: a modal before the Google redirect. At that moment there is no user
id, so the only place to put the answer is `localStorage` — which is what
`useSignupConsent` does today, and it is not a record: another device, a private
window or cleared storage loses it. It also costs a step on the highest-intent
path, and it would not cover terms updates, imported Clerk users or legacy rows,
so the gate has to exist regardless. Once the gate exists the pre-modal is
redundant.

### The consent contract

- Three documents, always together: Terms & Conditions, Privacy Policy, Refund
  Policy (`src/constants/legal.ts` is the single source of the list and order).
- All-or-nothing. `private.record_consents` sets all three `true` from one call,
  so the UI must require all three before enabling the button. There is no
  partial state to store.
- One `version` per acceptance, from `private.settings.terms_version`. In
  practice this is a single permanent value, not a versioning scheme (§12.2).
  The user accepts the version they were shown; `record_consents` refuses a stale one
  (`errcode 22023`), so a terms change mid-session cannot be mis-recorded.
- `accepted_at` and `source` (`'signup'` from the form, `'gate'` from the gate)
  come from the database, never the client.

## 3. Current state

| Piece | Where | State |
|---|---|---|
| `private.record_consents(text)` | `supabase/migrations/20260922090002_auth_users_sync.sql:241-266` | exists, granted to `app_user`, **no caller in `src/`** |
| `private.current_terms_version()` | same file, `:217` | exists, read by `src/lib/auth/terms.ts` |
| Not-accepted default | same file, `:127-128` | correct; Google sign-ups land not-accepted |
| `app/admin/layout.tsx` | — | does not exist |
| `/auth/consent` page | — | does not exist |
| Email checkbox | `src/components/auth/forms/SignUpForm.tsx:176-206` | names 2 of 3 documents |
| Google button notice | `src/components/auth/common/GoogleButton.tsx` | none |
| `useSignupConsent` + `ConsentModal` | `src/components/auth/common/useSignupConsent.tsx`, `src/components/modals/ConsentModal.tsx` | localStorage, gates the *tab switch* only, records nothing, bypassed by the Google button on the sign-in card |
| `Consents` TS type | `../quicktalog-packages/src/types/general.ts:142` | shape does not match the DB jsonb; unused in `src/` |

## 4. Design

### 4.1 Point-of-action notice (transparency)

A short line under the Google button: "By continuing you agree to our Terms &
Conditions, Privacy Policy and Refund Policy", each a real link. It goes in
`GoogleButton`, which renders on both the sign-in and sign-up cards, and the
wording is accurate in both.

This is the notice, not the record. It does not replace the gate.

### 4.2 The gate (where it runs)

New `src/app/admin/layout.tsx`. One `withUser` transaction, one statement:

```sql
select u.consents ->> 'version' as accepted,
       private.current_terms_version() as current
  from public.users u
 where u.id = $1          -- explicit owner filter, as well as RLS
```

Both values in one statement so an `/admin` navigation adds one round trip, not
two. If `accepted` differs from `current`, redirect to
`/auth/consent?next=<current path>`.

Rules:

- **`current` is null → no gate.** `terms_version` unset (or unreadable) means
  `record_consents` would reject every acceptance, so a gate there locks the
  user out of their own account with no way through. Fail open and let
  `currentTermsVersion()`'s existing Sentry warning carry the alarm.
- **No `users` row → no gate.** Provisioning races are `getUserData`'s problem,
  not the gate's.
- The layout adds no `AppShell`; `/admin` pages render their own.
- This is a UX gate, not a security boundary — a layout is not guaranteed to
  re-run on every soft navigation. That is acceptable: the consequence of a
  bypass is a user clicking around without having accepted, and the DB record
  stays the authoritative artifact. Pages keep their own `requireUser`.

`/auth/consent` is outside `/admin`, so the layout cannot redirect to itself.
Middleware's `NEEDS_SESSION` already covers `^/(admin|auth)(/|$)`, and `/auth/consent`
is deliberately **not** in `PROTECTED`, so the page does its own identity check
like `auth/update-password/page.tsx` does.

### 4.3 The gate (what the user sees)

`src/app/(site)/(with-footer)/auth/consent/page.tsx` — same folder as
`update-password`, so the URL is `/auth/consent` and the site footer (with the
legal links) is present.

Server component: `AUTH_PROVIDER !== "supabase"` → `notFound()`; no identity →
`redirect("/auth")`; reads `currentTermsVersion()` and passes it to the form.

`src/components/auth/ConsentForm.tsx` (client, named like
`UpdatePasswordForm`): `AuthCard` + `AuthHeader` + the three checkboxes from
`legalDocuments`, each linking to its document in a new tab. The submit button
stays disabled until all three are checked. Reuses the checkbox rows that
`ConsentModal` has today.

Copy should say plainly that acceptance is required to keep using the account,
and name what changed when this is a re-consent rather than a first one.

### 4.4 The record

`src/actions/consent.ts` (already holds `saveCookiePreferences`) gains:

```ts
export async function acceptLegalTerms(
  version: string,
): Promise<{ accepted: boolean; stale?: boolean }>
```

Per `server-action-and-route`: identity from `getVerifiedIdentity()` (never an
argument), one short `withUser` transaction, `Sentry.captureException` in the
catch, and a return shape consistent with its sibling.

```ts
await withUser(me, (tx) =>
  tx.execute(sql`select private.record_consents(${version})`),
);
```

`version` is accepted from the client **on purpose**: it is what the user was
shown, and the database is what validates it. `pgError(err)?.code === "22023"`
→ `{ accepted: false, stale: true }`, and the form reloads so the user accepts
the current version instead. Any other failure → `{ accepted: false }` with the
exception captured.

On success the form `router.replace`s the `next` path (through `safeNext`) and
calls `router.refresh()` so the layout re-reads the row.

### 4.5 Refusal

A "Decline" button that signs out via `useAuth().signOut()` (provider-agnostic,
`src/context/AuthContext.tsx`) and lands on `/`, with a line pointing at account
deletion in settings for a user who wants their data gone. Refusing must be
possible; silently trapping someone in a modal is worse than losing the account.

### 4.6 Refund policy, everywhere

- `SignUpForm`'s checkbox label lists all three documents, built from
  `legalDocuments` rather than hard-coded, so the three places cannot drift
  again.
- `ConsentForm` lists all three (it already would).
- Nothing changes in SQL: both `create_user_row` and `record_consents` already
  write all three keys.

## 5. Changes, file by file

**New**

| File | What |
|---|---|
| `src/app/admin/layout.tsx` | the gate check + redirect |
| `src/lib/auth/consent.ts` | `server-only`; `needsConsentGate(me)` → `{ needed, version }`, the single statement above |
| `src/app/(site)/(with-footer)/auth/consent/page.tsx` | provider check, identity check, reads the version |
| `src/components/auth/ConsentForm.tsx` | the three checkboxes, submit, decline |

**Changed**

| File | What |
|---|---|
| `src/actions/consent.ts` | add `acceptLegalTerms` |
| `src/components/auth/common/GoogleButton.tsx` | point-of-action notice under the button |
| `src/components/auth/forms/SignUpForm.tsx` | checkbox covers all three documents, from `legalDocuments` |
| `src/components/auth/SupabaseAuthForms.tsx` | drop `useSignupConsent`; the sign-up tab and `?mode=signup` just switch view |
| `src/components/auth/Auth.tsx` | docstring no longer refers to `useSignupConsent` |

**Deleted**

| File | Why |
|---|---|
| `src/components/auth/common/useSignupConsent.tsx` | localStorage consent, replaced by the gate |
| `src/components/modals/ConsentModal.tsx` | only `useSignupConsent` used it; its checkbox rows move into `ConsentForm` |

Also drop the `"consent"` `localStorage` key — no migration, the gate asks once
and records properly.

## 6. Shared package follow-up (needs a release)

`../quicktalog-packages/src/types/general.ts:142` declares

```ts
export type Consents = { termsAndConditions: string; privacyPolicy: string; refundPolicy: string };
```

The column is `jsonb` with kebab-case booleans plus `version`, `accepted_at` and
`source` (`drizzle/migrations/schema.ts:146`). Nothing in `src/` reads it, so
this is safe to correct:

```ts
export type Consents = {
  "terms-and-conditions": boolean;
  "privacy-policy": boolean;
  "refund-policy": boolean;
  version?: string | null;
  accepted_at?: string | null;
  source?: "signup" | "gate" | "legacy_default" | "default";
};
```

Per the repo rules this is a `../quicktalog-packages` change and needs a release
before the app can depend on it. The gate does not depend on it — keep it a
separate step so it cannot block the fix.

## 7. Rollout

Ship the gate active only under `AUTH_PROVIDER === "supabase"`, like every other
Phase 2 auth surface. Reason: the gate keys on `consents->>'version'`, and no
Clerk-era row has a `version` at all, so enabling it on PROD-while-Clerk would
show the gate to **every existing user** at once. That re-consent wave is
intended — but as part of the auth cutover, with legal sign-off, not as a
side effect of this change.

Order:

1. Confirm `private.record_consents` and `private.current_terms_version` exist on
   TEST (`imhinsgyzzyblghwnedk`); read-only check, no new migration needed.
2. Set `private.settings.terms_version` to `2026-10-15` on TEST, then PROD. It
   is an operator insert (M10's comment at `:14` says so); no migration carries
   it. Until it is set the gate is inert by §4.2 and the sign-up form is already
   disabled, so this blocks end-to-end testing.

   ```sql
   insert into private.settings (key, value)
   values ('terms_version', '2026-10-15')
   on conflict (key) do update set value = excluded.value, updated_at = now();
   ```
3. Deploy with `AUTH_PROVIDER=supabase` on a TEST preview; walk both paths.
4. PROD stays on `clerk`, so the gate is dormant there until the cutover. Fold
   the re-consent wave into the cutover comms.

No new migration file. If `terms_version` turns out to be unset on TEST, that is
a data insert, not schema.

## 8. Tests

| Test | Where | Asserts |
|---|---|---|
| `acceptLegalTerms` | `tests/unit/server_actions/consent.test.ts` (new) | no identity → `{ accepted: false }`; `22023` → `stale: true`; success calls `record_consents` with the passed version; failures captured in Sentry |
| `needsConsentGate` | `tests/unit/lib/auth/consent.test.ts` (new) | version mismatch → needed; equal → not needed; `current` null → not needed; no row → not needed |
| gate round trip | `tests/integration/auth/signup.test.ts` (extend) | a Google-shaped sign-up (no `terms_version` metadata) lands not-accepted, then `record_consents(current)` flips all three with `source: 'gate'`, `version` and `accepted_at`; a stale version raises `22023` |
| pgTAP | `supabase/tests/database/50_auth_triggers.test.sql` (per the auth plan) | `record_consents` refuses when there is no verified identity (`42501`) and when the version is stale |
| e2e | `tests/e2e/` | signed-in TEST user with a mismatched version is redirected from `/admin/dashboard` to `/auth/consent`, cannot submit until all three boxes are checked, and reaches the dashboard after accepting |

e2e runs against TEST only, and uses the existing `auth.supabase.setup.ts`
`generateLink` + `verifyOtp` session (not captcha-gated).

## 9. Verification

```
npx tsc --noEmit
npm run check
npm test
```

Plus, on a TEST preview with `AUTH_PROVIDER=supabase`:

- Google sign-up → `/auth/consent`, not the dashboard.
- Accept → dashboard; `users.consents` shows all three true, `source: 'gate'`,
  the current `version` and an `accepted_at`.
- Reload `/admin/dashboard` → no gate (the record matches).
- Change `private.settings.terms_version` → the gate returns once, then stops.
- Decline → signed out, back on `/`.
- Email sign-up with all three boxes checked → `source: 'signup'`, no gate.

## 10. Docs

- `docs/architecture/` gains a short consent section: the three documents, the
  version, the two `source` values, where the record is written, and the gate's
  fail-open rule. Link it from the auth architecture doc.
- Fold the gate's existence into the auth migration plan's Phase 2 checklist
  rather than restating it there.
- No skill changes: this follows `server-action-and-route` as written.

## 11. Open questions

1. **Legal wording** for the gate screen and the Google-button notice, and
   whether re-consenting existing users at the cutover is acceptable to whoever
   signs off (input 14). This is the only thing blocking implementation; the
   rest can be built with placeholder copy.
2. **Legacy rows.** `source: legacy_default` rows (all-true, no `version`) will
   be caught by the gate at the cutover, which is the intent per the auth plan.
   Worth naming explicitly in the sign-off rather than assumed.

## 12. Decisions (2026-10-15)

### 12.1 Supabase only; nothing built for Clerk

The gate, the notice and the record ship under `AUTH_PROVIDER === "supabase"`
only. Clerk is being deprecated, so the Clerk path gets no consent work at all —
Clerk hosts its own sign-up terms and `ClerkAuthForms` is untouched. This also
avoids showing the gate to every existing PROD user before the cutover (§7).

### 12.2 Keep the `version` field, as one permanent stamp

`terms_version` stays, set once to `2026-10-15` and treated as permanent. This
is **not** a versioning scheme: there is one terms document, and the stored
string is a stamp recording which text was live when someone accepted. Nobody
maintains old copies by hand.

Why not remove it, which was considered:

- Removing it means a migration rewriting both `private.record_consents` (which
  raises `22023` without a matching version) and `private.create_user_row`, plus
  app and test changes. Keeping it is one `insert`.
- It is what makes the gate work at all: the gate compares the user's stamp
  against the current one. Without it the booleans are the only signal, which
  works while there is one version but leaves no way to re-ask if the terms are
  ever rewritten — that would become a hand-written `UPDATE` over every row.
- Legally it is not the proof. `accepted_at` plus the git history of
  `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx` already answers
  "what did they accept, and when". The version is cheap redundancy.

**Only bump it when the terms are materially rewritten.** Changing the value
re-asks every user on their next visit, so it is not for typo fixes.

### 12.3 Per-person record: the current acceptance, not a history

`users.consents` on each user's own row carries `version`, `accepted_at` and
`source` (`'signup'` from the form's checkbox, `'gate'` from the gate), so
"which version did this person accept, and how" is a single query:

```sql
select email,
       consents ->> 'version'     as accepted_version,
       consents ->> 'accepted_at' as accepted_at,
       consents ->> 'source'      as how
  from public.users
 where email = $1;
```

`record_consents` replaces the whole object, so only the latest acceptance is
kept. With one permanent version there is no history to lose. If the version is
ever bumped and a full trail is wanted, that is the point to add a small
append-only table — deliberately out of scope now.

### 12.4 The terms text is archived by git, not by hand

The documents are React pages in the repo, so the text that was live on any
given date is recoverable from git history. No copies of retired terms are kept
anywhere else, and none need to be.

### 12.5 Standing design, not contested

Fail-open when `terms_version` is null (§4.2): a gate nobody can satisfy would
lock users out of their own accounts. Flagged to the owner and not objected to;
revisit only if the preference is to block instead.

## 13. Implementation (2026-10-15)

### Done

| File | |
|---|---|
| `src/lib/auth/consent.ts` | new - `needsConsentGate`, one statement, fails open |
| `src/app/admin/layout.tsx` | new - the gate, Supabase-only |
| `src/app/(site)/(with-footer)/auth/consent/page.tsx` | new - `/auth/consent` |
| `src/components/auth/ConsentForm.tsx` | new - three checkboxes, accept, decline-and-sign-out |
| `src/components/auth/common/LegalLinks.tsx` | new - the shared "A, B and C" link list |
| `src/actions/consent.ts` | `acceptLegalTerms`, beside `saveCookiePreferences` |
| `src/components/auth/common/GoogleButton.tsx` | the point-of-action notice |
| `src/components/auth/forms/SignUpForm.tsx` | checkbox now covers all three documents |
| `src/components/auth/SupabaseAuthForms.tsx` | `useSignupConsent` gone |
| `src/components/auth/Auth.tsx` | docstring |
| `useSignupConsent.tsx`, `ConsentModal.tsx` | deleted, with the `"consent"` localStorage key |
| `docs/architecture/legal-consent.md` | new, indexed in `docs/README.md` |

Tests: `tests/unit/lib/auth/consent.test.ts` (7) and
`tests/unit/server_actions/consent.test.ts` (5), both green;
`tests/integration/auth/signup.test.ts` gained the gate round trip (a sign-up
with no `terms_version` metadata lands not-accepted, a stale version raises
`22023`, the current one writes all three with `source: 'gate'`).

Verified: `npx tsc --noEmit` clean, `npm run check` clean for these files (the
19 warnings are pre-existing, in `tests/db-pglite/*`, `src/context/MainContext.tsx`
and `src/components/docs/DocHero.tsx`), `npm test` 620 passed / 62 files.

Fixed after first run on TEST: the consent page originally re-read the version
through `currentTermsVersion()` (`withPublic`/`app_public`) while the gate read
it through `needsConsentGate` (`withUser`/`app_user`). Any disagreement between
those two reads - a drifted grant, or just a transient error, since
`currentTermsVersion` returns null on any failure - put the user in an infinite
redirect loop between `/admin` and `/auth/consent`, which presents as a blank
screen with an application error. The page now calls `needsConsentGate` itself,
so both sides share one read and cannot disagree; it also bounces someone who
has already accepted straight to the dashboard.

Fixed again after a second report ("error just before the consent screen, then
it autofixes"): sharing one function was not enough, because `needsConsentGate`
folded a failed read into the same answer as "already accepted". The gate and
the page ask in separate requests, so a single transient failure made them
disagree and bounced the user between `/admin` and `/auth/consent` until it
settled. It now returns `needed` / `satisfied` / `unknown`: the layout gates only
on `needed`, the page redirects away only on `satisfied`, and `unknown` renders a
retry card that navigates rather than redirects, so no automatic loop exists.

Deviation from §4.2: the gate redirects without a `next` parameter. A Next
layout cannot read its own pathname, and the alternative was a middleware header
on a security-sensitive file for a screen each user sees once. `/auth/consent`
still honours `next` if something ever supplies it.

### Not done

- **The operator insert.** `private.settings.terms_version` on TEST then PROD
  (§7.2). Until it exists the gate is inert and nothing can be tested end to end.
- **Integration and e2e not executed.** `tests/integration/auth/signup.test.ts`
  refuses anything but a local stack (`supabase start`), so the new case is
  written but unrun. No Playwright spec was added: PROD is on `clerk`, so a spec
  requiring Supabase auth would fail the `auth: [clerk, supabase]` matrix.
- **pgTAP.** `supabase/tests/database/50_auth_triggers.test.sql` does not exist
  yet; it belongs to the auth migration's Phase 2, not here.
- **Shared package.** The `Consents` type (§6) still has the wrong shape. Needs a
  `../quicktalog-packages` release and nothing depends on it.
- **Copy.** The gate's heading, subtitle and the Google notice are plain
  placeholders pending sign-off; they live in two components. §4.3's
  "name what changed on a re-consent" is now implemented: the `needed` result
  carries `previous`, and `ConsentForm` switches between "Our terms have changed"
  and the first-time wording. Both strings still need sign-off.
