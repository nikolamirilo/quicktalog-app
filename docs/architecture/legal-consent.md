# Legal consent

Acceptance of the Terms & Conditions, Privacy Policy and Refund Policy. Two paths lead to the same record: the sign-up form's checkbox, and the gate that catches everyone the checkbox cannot reach — every Google sign-up, every imported account, and everyone again if the documents are ever rewritten.

Cookie and analytics choices are a different thing entirely and live in `users.cookie_preferences` (`saveCookiePreferences`). Bundling them with contract acceptance would invalidate the consent, so the two never share a control.

## Where things live

| Module | Purpose |
|---|---|
| `src/constants/legal.ts` | `legalDocuments`: the three documents, their order and their URLs. The single source |
| `src/components/auth/common/LegalLinks.tsx` | The documents as one inline "A, B and C" link list |
| `src/components/auth/forms/SignUpForm.tsx` | The email sign-up checkbox; sends `terms_version` in the sign-up metadata |
| `src/components/auth/common/GoogleButton.tsx` | The notice under the Google button: clicking it is the assent |
| `src/app/admin/layout.tsx` | The gate: holds `/admin` shut until the record matches |
| `src/lib/auth/consent.ts` | `needsConsentGate` — one statement, the user's stamp against the current version |
| `src/app/(site)/(with-footer)/auth/consent/page.tsx` | `/auth/consent`, where the gate sends people |
| `src/components/auth/ConsentForm.tsx` | The three checkboxes, accept, and decline-and-sign-out |
| `src/actions/consent.ts` | `acceptLegalTerms` — calls `private.record_consents` |
| `src/lib/auth/terms.ts` | `currentTermsVersion` — reads `private.current_terms_version()` |

## The record

`users.consents` (jsonb, not null) on each user's own row:

```json
{
  "terms-and-conditions": true,
  "privacy-policy": true,
  "refund-policy": true,
  "version": "2026-10-15",
  "accepted_at": "2026-10-15T09:31:44Z",
  "source": "gate"
}
```

All three documents are written as one set — `private.record_consents` takes no per-document argument — so the UI requires all three before enabling its button. There is no partial state to store.

`source` says which path recorded it: `signup` for the form's checkbox, `gate` for `/auth/consent`, `legacy_default` for rows that predate the contract, `default` for the column default. Only the latest acceptance is kept; `record_consents` replaces the whole object rather than appending.

## The version

`private.settings.terms_version` holds one value for the whole project. It is a stamp recording which text was live when someone accepted, not a versioning scheme: there is one terms document, and the retired text is recoverable from the git history of `src/app/(site)/(with-footer)/terms-and-conditions/page.tsx`.

No migration carries it. An operator inserts it per project after legal sign-off:

```sql
insert into private.settings (key, value)
values ('terms_version', '2026-10-15')
on conflict (key) do update set value = excluded.value, updated_at = now();
```

**Changing the value re-asks every user** on their next visit into `/admin`, so it is bumped only when the documents are materially rewritten — never for a typo.

Both write paths compare against it, and neither trusts the client:

- **Sign-up.** `private.create_user_row` marks the consents accepted only when `raw_user_meta_data.terms_version` equals the current value. A Google sign-up sends no metadata, so it lands not-accepted by design.
- **The gate.** `acceptLegalTerms` passes the version the screen showed, and `private.record_consents` raises `22023` for anything but the current one. A terms change mid-session is reported back as stale and the user re-accepts, instead of being recorded as something they never saw.

## The gate

`src/app/admin/layout.tsx` runs one `withUser` statement per entry into `/admin` — the version on the user's row and `private.current_terms_version()` together — and redirects to `/auth/consent` when they differ.

Three rules worth knowing:

- **It fails open when `terms_version` is null.** `record_consents` would refuse every acceptance in that state, so a gate there would shut the user out of their own account with no way through. The sign-up form disables itself for the same reason.

  Failing open has a sharp edge worth knowing: `GoogleButton` does not read the version, so with no `terms_version` set, Google sign-ups still succeed — and land with `consents` all false and no gate to catch them. Email sign-up is blocked while Google sign-up is not. Nothing throws, so `currentTermsVersion` sends a Sentry **error** when the read succeeds but returns no version; that event means new accounts are being created with no recorded acceptance.
- **It tells a returning user why they are being asked again.** The `needed` result carries `previous`, the version they accepted before, so `ConsentForm` can say "Our terms have changed" rather than greeting someone who already accepted as a first-time user. A user with no previous version — a Google sign-up, or a legacy row that never recorded one — gets the first-time wording.
- **A failed check is `unknown`, not "satisfied".** `needsConsentGate` returns one of `needed` / `satisfied` / `unknown`. The layout gates only on `needed`, and the consent screen redirects away only on `satisfied`; on `unknown` it renders a retry instead. Collapsing `unknown` into `satisfied` is what bounced users between `/admin` and `/auth/consent` — the two sides ask in separate requests, so one transient read failure made them disagree.
- **It is a nudge, not a boundary.** A layout is not guaranteed to re-run on every soft navigation. Slipping past means browsing without having accepted, not exposed data; the record on the row is the authoritative artifact, and pages keep their own `requireUser`.
- **Supabase only.** Clerk hosts its own sign-up terms, so the gate is inert under `AUTH_PROVIDER=clerk`. No Clerk-era row carries a `version`, so enabling it there would gate every existing user at once — that re-consent belongs to the auth cutover.

`/auth/consent` sits outside `/admin` so the gate cannot redirect to itself, and it is deliberately not a `PROTECTED` path in middleware, so the page checks identity itself. It carries no `next`: a layout does not know its own pathname, and the screen is a once-ever stop, so a deep link costs one redirect to the dashboard.

Declining signs the user out and points at account deletion in settings. Refusing has to be possible.
