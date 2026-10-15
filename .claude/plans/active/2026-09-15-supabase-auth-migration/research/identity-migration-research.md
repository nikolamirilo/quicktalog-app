# Research: migrating identities from Clerk to Supabase Auth

> Phase-1 report produced on 2026-09-16 while preparing `../PLAN.md`. It reflects branch `test` at `fcee862` and read-only queries on the TEST project. Where it disagrees with `../PLAN.md`, the plan wins.

Repo root: `/Users/nikola/Desktop/Quicktalog/quicktalog-app`. Paths below are relative to it. I did not change any files, and I ran only read-only SELECTs on TEST (`imhinsgyzzyblghwnedk`).

---

## 0. Short answer and recommended path

1. **Passwords come across and nobody has to reset.** Clerk's Dashboard export CSV includes `password_digest` and `password_hasher`. Clerk hashes with bcrypt. Supabase Auth accepts bcrypt, Argon2 and Firebase-scrypt hashes through `auth.admin.createUser({ password_hash })`. So password users keep their passwords.
   - Some community posts say Supabase cannot import bcrypt, for example dev.to "How to Migrate from Clerk to Supabase Auth". That is wrong for today's docs and source.
2. **Use the Admin API for users, not raw SQL.** Supabase's own migration guide (Auth0) uses `admin.createUser`. Keep SQL for two narrow jobs: pre-creating Google identities in `auth.identities`, and optionally copying Clerk's `created_at`.
3. **Sessions cannot be converted.** Pick one of three ways to handle logged-in users:
   - (a) a forced re-login at cutover;
   - (b) a short dual-run "session bridge": Clerk proves who the user is, then the server mints a Supabase session with `admin.generateLink` + `verifyOtp`, and no email is sent;
   - (c) a password trickle: Clerk `verifyPassword`, then Supabase `updateUserById`.

   Options (b) and (c) only work while Clerk is still live.
4. **Google users link automatically** on their first Supabase Google sign-in, as long as both the Google email and the imported user's email are verified. To remove edge cases, pre-create `auth.identities` rows with `provider_id = <Clerk external_account.provider_user_id>`.
5. **TOTP secrets, backup codes, passkeys and sessions do not migrate.** Users re-enroll MFA and passkeys.
6. **Custom SMTP (Resend) is required before cutover.**
   - The built-in sender allows **2 emails/hour** and only delivers to members of the Supabase organization.
   - Once custom SMTP is on, the limit starts at 30/hour and can be raised.
   - Fix the redirect allow-list at the same time (section 6.3).
7. **Interim step (optional but recommended):** turn on RLS now while still on Clerk, using Supabase's Clerk third-party auth integration. Write policies on `auth.jwt()->>'sub'` (the text Clerk id) and never on `auth.uid()`, which casts to uuid and fails. Then swap auth. A provider-neutral claim (section 5.4) avoids rewriting policies at cutover.

---

## 1. Exporting from Clerk

### 1.1 Dashboard "Export users" CSV
- **Where:** Clerk Dashboard, then the instance's **Settings**, then **User exports**, then **Export users**. A new row appears in export history; click **Download**.
- **Who can export:** admins, or users in their personal workspace. The CSV "includes their hashed passwords", and export and download history is logged. (https://clerk.com/docs/guides/development/migrating/overview#export-your-users-data-from-the-clerk-dashboard, last updated Sep 15 2026)
- **File expiry:** the download button stays visible "until the file expires" (https://clerk.com/changelog/2024-10-23-export-users). Download promptly and treat the file as a secret, since it holds bcrypt digests.
- **No plan gating is documented** for the export.
- **Dev and prod are separate instances:** "You cannot migrate users from your Development instance to your Production instance" (same page).
  - Dev instances are "capped at 100 users" (https://clerk.com/docs/guides/development/managing-environments). A web-search snippet mentions a 500-user cap, so the exact number is uncertain.
  - Export from the **production** Clerk instance for Supabase PROD, and from the dev instance for TEST.

**Columns.** Clerk's docs do not list them, but Clerk's own migration tool sample and the WorkOS and Better Auth importers agree on the same 13-column header:

```
id,first_name,last_name,username,primary_email_address,primary_phone_number,verified_email_addresses,unverified_email_addresses,verified_phone_numbers,unverified_phone_numbers,totp_secret,password_digest,password_hasher
```

Example row from `clerk/migration-tool` `samples/clerk.csv`:

```
user_2YDryYFVMM1W1plDDKz7Gzf4we6,Jane,Doe,,jane.doe@test.com,,janedoe@test.com,,,,,$2b$10$U4C0ZY8OG8y41F9LusfKyu3HRMBL0rCZcKBVsXhgr.n8Ou6FPhzO2,bcrypt
```

- **Multi-valued cells** (several emails or phones) are pipe-separated, for example `primary@test.com|secondary@test.com`. Clerk's tool splits on `[,|]` (commit c6d6eb1c, 2026-01-22). WorkOS documents "pipe-separated, with the primary email first".
  - Use a real CSV parser that handles quoted fields. The Better Auth guide's `line.split(',')` breaks on quoted cells.
  - Key columns by header name, not position.
- **Not in the CSV:** `created_at`, `image_url`, external (OAuth) accounts, public/private/unsafe metadata, banned/locked flags, passkeys, and backup codes.
  - Clerk's tool also maps `backup_codes`, `public_metadata` and similar keys, but only for the JSON export Clerk support provides.
  - Get everything else from the Backend API (1.3).
- **Is `password_digest` bcrypt?**
  - WorkOS: "Clerk uses the `bcrypt` password hashing algorithm" (https://workos.com/docs/migrate/clerk).
  - Better Auth: "Clerk uses bcrypt to hash passwords" (https://better-auth.com/docs/guides/clerk-migration-guide).
  - The samples are `$2b$10$...` with `password_hasher=bcrypt`.
  - **One exception:** users who were *imported into* Clerk with another hasher (argon2i/id, pbkdf2_*, scrypt_firebase, md5 and others) keep that hash until they next sign in. Clerk says it "will transparently upgrade your users' password hashes to ... Bcrypt" only then.
  - So the script must check `password_hasher` on every row.
  - Empty `password_digest` means the user has no password (OAuth-only or email-code-only).

### 1.2 The Backend API never returns password hashes
- The Backend `User` object has `password_enabled`, `password_last_updated_at`, `totp_enabled`, `backup_code_enabled`, `two_factor_enabled`, `external_accounts`, `email_addresses`, `public_metadata`, `private_metadata`, `unsafe_metadata`, `external_id`, `banned`, `locked`, `created_at`, `last_sign_in_at` and similar fields. There is **no digest field**.
  - Verified in installed `node_modules/@clerk/backend` 2.33.3, `dist/api/resources/JSON.d.ts` `UserJSON` lines 527-568.
  - Docs: https://clerk.com/docs/reference/backend/types/backend-user
- **The CSV is the only self-serve source of hashes.**
- `password_last_updated_at` is useful for the delta: any user whose value is later than the CSV export time needs a new export or a password reset.

### 1.3 Pagination and rate limits
- **`getUserList(params)`** (https://clerk.com/docs/reference/backend/user/get-user-list):
  - `limit` is an integer from 1 to 500 (default 10); `offset` defaults to 0.
  - `orderBy` defaults to `-created_at`.
  - Returns `{ data, totalCount }`.
  - Filters include `emailAddress[]`, `userId[]`, `externalId[]`, `createdAtAfter/Before`, `lastSignInAtAfter/Before`, `lastActiveAtAfter/Before`, `query`.
  - Use `orderBy: '+created_at'` so pages stay stable while new users sign up.
- **Rate limits** (https://clerk.com/docs/guides/how-clerk-works/system-limits):
  - Production: 1000 requests per 10 seconds per instance (secret key). Development: 100 requests per 10 seconds.
  - A 429 includes `Retry-After`.
  - User/Org update endpoints are limited to 10 requests per 10 seconds per entity.
  - Clerk's migration tool picks the rate from the key: 100 req/s for prod and 10 req/s for dev, and on a 429 waits 10 s and retries up to 5 times (`clerk/migration-tool` README).
- **External accounts:** each `user.externalAccounts[]` has `provider` (JSON value like `oauth_google`; Better Auth strips it with `provider.replace("oauth_", "")`), `providerUserId`, `emailAddress`, `verification.status`, `approvedScopes`, `firstName`, `lastName`, `imageUrl`, `label` and `publicMetadata`.
  - Docs: https://clerk.com/docs/reference/backend/types/backend-external-account
  - Installed `ExternalAccountJSON`: `provider`, `provider_user_id`, `email_address`, `verification` (JSON.d.ts:167-182).
- **Metadata:** available only through the Backend API (`publicMetadata`, `privateMetadata`, `unsafeMetadata`).
  - Quicktalog stores cookie consent in `publicMetadata.cookieConsent` (`app/api/update-consent/route.ts:32`, `components/general/CookieBanner.tsx:41-44`).
  - It is already mirrored into `public.users.cookie_preferences` (`lib/users/syncFromClerk.ts:99-100,127-128`), so no Clerk metadata needs to reach `auth.users`.

### 1.4 What login methods Quicktalog uses
- The app renders Clerk's prebuilt `<SignUp>` and `<SignIn>` (`components/auth/Auth.tsx:46-57`) and `<UserProfile>` (`components/dashboard/Settings.tsx:6,39`), so the enabled strategies live in Clerk Dashboard settings, not in code.
- E2E tests sign in with the `password` strategy (`tests/e2e/auth.setup.ts:24`).
- **Check the Clerk dashboard** for whether Google, email code/link, TOTP or passkeys are enabled. That decides which parts of sections 3 and 4 apply.

---

## 2. Importing into Supabase Auth

### 2.1 Admin API `auth.admin.createUser` (recommended)
**Fields** (Supabase Auth source `internal/api/admin.go` `AdminUserParams`, lines 22-35, master at v2.197.0): `id`, `aud`, `role`, `email`, `phone`, `password`, `password_hash`, `email_confirm`, `phone_confirm`, `user_metadata`, `app_metadata`, `ban_duration`. Installed supabase-js 2.105.3 types include `password_hash?: string` ("Supports bcrypt, scrypt (firebase), and argon2 password hashes") and `id?: string`.

**`password_hash` behavior**
- Docs: "Supabase supports bcrypt and Argon2 password hashes" (https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0).
- In source, `models.NewUserWithPasswordHash` (user.go:79-107) accepts:
  - a `$argon2(d|i|id)$v=..$m=..,t=..,p=..` PHC string;
  - a `$fbscrypt$...` string;
  - anything else only if `bcrypt.Cost()` parses it, so `$2a$`/`$2b$`/`$2y$` all work.
- Sending both `password` and `password_hash` returns 400 "Only a password or a password hash should be provided" (admin.go:447-449).
- Strength rules apply only to a plaintext `password`, so imported hashes skip them (admin.go:451-457).
- If neither is given, Supabase stores a random 64-char password (admin.go:459-465). Passwordless users therefore get an unusable password; they can still use OTP or magic link, or set one through a reset.
- **Automatic rehash:** on sign-in Supabase rehashes a bcrypt hash if its cost is above 10 or equals 4 (`User.Authenticate`, user.go:490-504). Clerk's cost 10 is kept as-is.
- Password sign-in still succeeds when the password is weaker than the current policy; the response carries a `weak_password` field (token.go:129-137).

**Custom `id`**
- Supported. The docs FAQ says: "If your UUID format is identical, you can specify it" (Auth0 guide).
- Source: `uuid.FromString(params.Id)`, which rejects nil (admin.go:481-490). The error text says "uuid v4", but any parseable UUID gets through (inferred from source).
- Clerk ids like `user_2Y...` are **not** UUIDs, so generate a v4 UUID per user and keep the mapping.

**Side effects**
- The user row and an `email` identity (`provider_id = user.id`, `identity_data {sub,email}`) are written in one transaction.
- `app_metadata` is set to `{provider:'email', providers:['email']}`, then your `app_metadata` is merged in.
- `email_confirm:true` sets `email_confirmed_at`.
- **No email is sent**: `adminUserCreate` never calls the mailer.
- Duplicate email returns **422 `email_exists`**; duplicate phone returns `phone_exists` (admin.go:420-445).
- Email validation is format-only (`checkmail.ValidateFormat`, max 255 chars, lowercased; mail.go `validateEmail`).
- The admin create endpoint does **not** check "Allow new users to sign up" (`DisableSignup` is only checked for OAuth `CreateAccount`, external.go:343). You can turn public sign-ups off in Supabase while you import.

**Rate limits**
- `/admin/*` routes have only `requireAdminCredentials` and no `limitHandler` (api.go:359-394, verified in source).
- The Auth rate-limit docs list no admin limit (https://supabase.com/docs/guides/auth/rate-limits).
- Platform or gateway limits may still exist but are not documented. Keep concurrency modest (4-8).

**Keys**
- Call these methods only on a server with the secret key (`sb_secret_...`) or the legacy `service_role` key. The docs say "This function should only be called on a server. Never expose your `service_role` key in the browser" (https://supabase.com/docs/reference/javascript/auth-admin-createuser).
- The app has **no secret key today** (`utils/supabase/server.ts:8,25` uses the publishable key), so the import script needs a new secret env var and should run outside Vercel (60 s Hobby limit).

**Password sign-in needs a confirmed email.** If Confirm email is on, `signInWithPassword` for an unconfirmed user returns `email_not_confirmed` (token.go:181-182). Import Clerk-verified primary emails with `email_confirm: true`.

**Metadata warning (verified in source)**
- On every OAuth sign-in or link, the provider's identity data is **merged into** `raw_user_meta_data` (external.go:326,391; merge in user.go:230-243). Keys like `full_name`, `name`, `avatar_url`, `picture` and `email` get overwritten.
- If the user is *unconfirmed*, `raw_user_meta_data` is replaced outright and the password is wiped (1.1 and 3.3).
- Keep app data in `public.users`. Put only `clerk_user_id` in `app_metadata`, which users cannot edit (but it is embedded in the JWT).

### 2.2 Direct SQL into `auth.users` and `auth.identities` (not recommended except for identities)
**What Supabase says**
- The migration guides use the Admin API.
- A troubleshooting page warns that manual SQL inserts cause `500: Database error querying schema` when string columns are `NULL` (https://supabase.com/docs/guides/troubleshooting/auth-error-500-database-error-querying-schema-eb6b44).
- A Feb 5 2026 announcement covers `Scan error on column confirmation_token: converting NULL to string is unsupported` (https://github.com/orgs/supabase/discussions/42489).
- Since April 21 2025 the `postgres` role can no longer create tables, functions or indexes in `auth`, or write to `auth.schema_migrations` (https://github.com/orgs/supabase/discussions/34270). Row DML on `auth.users` and `auth.identities` still works: on TEST, `has_table_privilege('postgres','auth.users','INSERT')` and the same for `auth.identities` are both `true`.

**Column facts from TEST `information_schema`** (auth migration version 20260831180000):

| Table | Column facts |
| --- | --- |
| `auth.users` | Nullable with **no default**, so they must be `''`: `confirmation_token`, `recovery_token`, `email_change_token_new`, `email_change` |
| `auth.users` | Default `''`: `phone_change`, `phone_change_token`, `email_change_token_current`, `reauthentication_token` |
| `auth.users` | `is_sso_user` and `is_anonymous` are NOT NULL, default false |
| `auth.users` | `confirmed_at` is a generated column; do not insert it |
| `auth.users` | Partial unique index on `email where is_sso_user = false` (migration 20221215195500) |
| `auth.identities` | `provider_id`, `user_id`, `identity_data`, `provider` are NOT NULL |
| `auth.identities` | `id uuid default gen_random_uuid()` |
| `auth.identities` | `email` is **GENERATED ALWAYS** as `lower(identity_data->>'email')`; never insert it |
| `auth.identities` | Unique `(provider_id, provider)` (migration 20231117164230) |

Other facts:
- GoTrue writes `instance_id = 00000000-0000-0000-0000-000000000000` (the zero value of `DONTUSEINSTANCEID`), `aud='authenticated'`, `role='authenticated'`.
- For an email identity it writes `provider_id = user.id::text` and `identity_data = {sub: user.id, email}` (admin.go:517-523).

Only if you ever must bypass the API, a full-user template:

```sql
-- NOT the recommended path; shown for completeness
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  is_sso_user, is_anonymous)
values (
  '00000000-0000-0000-0000-000000000000', $1::uuid, 'authenticated', 'authenticated',
  lower($2), $3 /* bcrypt digest or null */, $4 /* timestamptz or null */,
  '{"provider":"email","providers":["email"]}'::jsonb, $5::jsonb, $6, now(),
  '', '', '', '', false, false);

insert into auth.identities (provider_id, user_id, provider, identity_data, created_at, updated_at)
values ($1::text, $1::uuid, 'email',
        jsonb_build_object('sub', $1::text, 'email', lower($2), 'email_verified', $4 is not null, 'phone_verified', false),
        $6, now());
```

**Risks of raw SQL:**
- `NULL` token columns cause 500 errors on sign-in.
- The email uniqueness check (`IsDuplicatedEmail`) and email lowercasing are skipped.
- No audit-log entries are written.
- The schema can change between Auth releases; the Supabase Auth repo is at v2.197.0 with 600+ migrations.

### 2.3 Existing migration tooling
- **Supabase official guides:**
  - "Migrate from Auth0 to Supabase Auth": rolling vs one-off strategies, `admin.createUser` with `password_hash`, a fallback sign-in path, and the custom-id FAQ. https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0
  - "Migrate from Firebase Auth": uses `supabase-community/firebase-to-supabase` `auth/import_users.ts`, an old script that inserts SQL into `auth.users` only. https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth
  - "Migrating Auth Users Between Supabase Projects": pg_dump of the auth schema. https://supabase.com/docs/guides/troubleshooting/migrating-auth-users-between-projects
- **There is no Clerk-to-Supabase guide or tool from Supabase or Clerk.** The supabase-community org's migration repo is `firebase-to-supabase`. A GitHub code search found no maintained Clerk-to-Supabase script, only one private project plan doc.
- **Useful references that go the other way or to other targets:**
  - `github.com/clerk/migration-tool`: Supabase to Clerk. Its `docs/exporting-users.md` reads `auth.users.encrypted_password` (bcrypt) over Postgres, which proves the reverse path for rollback.
  - `github.com/workos/migrate-clerk-users`: CSV parsing, verified-email rules, bcrypt-only.
  - Better Auth "Migrating from Clerk": merges the CSV with `GET https://api.clerk.com/v1/users?offset&limit=500` to get `external_accounts` and timestamps.

---

## 3. OAuth users (Google)

### 3.1 How Supabase decides on OAuth sign-in
Source: `internal/models/linking.go` `DetermineAccountLinking`, and `internal/api/external.go` lines 301-440.

1. It looks for `auth.identities` where `provider_id = <provider sub>` and `provider = 'google'`. If found, the result is **AccountExists**: sign in, refresh `identity_data`, and merge metadata.
2. Otherwise it collects the *verified* provider emails. Google's verified flag is `verified_email || email_verified` (provider/google.go:25-27). `provider_id` is the Google userinfo `id` (google.go:123,132), which is the Google `sub`.
3. If a non-SSO user with that email exists in `auth.users`, the result is **LinkAccount**: a new google identity is attached to that user. This is the "Automatic linking" described at https://supabase.com/docs/guides/auth/auth-identity-linking.
4. If there are no verified provider emails, the result is **CreateAccount**. If that email already belongs to someone, the new user is created **without an email** (linking.go:99-114).
5. If the target user is **unconfirmed**, `RemoveUnconfirmedIdentities` runs: the password is nulled, `raw_user_meta_data` is replaced, other identities are deleted, then the user is confirmed (external.go:411-428; user.go:1020-1051). The docs call this pre-account-takeover protection.
6. With "Allow new users to sign up" off, **CreateAccount** returns `signup_disabled`, but **LinkAccount** still works (external.go:342-345).

### 3.2 Recommendations for Quicktalog
- Import every user whose Clerk primary email is verified with `email_confirm: true`. Then a first Google sign-in auto-links with **no pre-creation**, which is the Supabase Auth0 guide's approach: "This works without pre-migrating existing users".
- **Pre-create google identities** from Clerk `externalAccounts` (provider `oauth_google`, `verification.status === 'verified'`), with `provider_id = providerUserId`. This matters when:
  - the Google account email differs from the Clerk primary email (a user changed primary email after connecting Google), or
  - two Clerk users could collide on email (Google email X linked to user A while user B's primary email is X). Without a pre-created identity, auto-linking would attach Google to B.
- The Google `sub` does not depend on the OAuth client, so a Clerk-era `provider_user_id` matches Supabase's `provider_id` even with a new Google OAuth client. This is inferred from the Google provider code and Clerk's field description.
- **Other providers:**
  - GitHub: stable global numeric `id` (provider/github.go:90,97).
  - Microsoft: `sub` is "a pairwise identifier ... unique to each application ID" (https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference), so a Clerk-era sub will **not** match. Rely on email linking.
  - Apple: team-scoped sub (not verified here).
- `app_metadata.providers` is recalculated from identities on the next sign-in (`UpdateAppMetaDataProviders`, external.go:330,394), so no SQL update is needed after pre-creating identities.
- **Manual linking** (`supabase.auth.linkIdentity({ provider: 'google' })`) is beta and off by default. Enable it in Authentication > Providers, or with `GOTRUE_SECURITY_MANUAL_LINKING_ENABLED` when self-hosting. It is only needed if signed-in users link Google accounts with a *different* email themselves.
- **Google setup:**
  - Add Supabase's callback (`https://<ref>.supabase.co/auth/v1/callback`, or your custom auth domain) under Authorized redirect URIs.
  - Scopes: `openid`, `userinfo.email`, `userinfo.profile`.
  - Supabase "strongly" recommends a custom domain, because otherwise the consent screen shows `<ref>.supabase.co` (https://supabase.com/docs/guides/auth/social-login/auth-google).
  - In Next.js the PKCE callback calls `exchangeCodeForSession(code)`.

SQL to pre-create a Google identity (run with the postgres role; idempotent):

```sql
insert into auth.identities (provider_id, user_id, provider, identity_data, created_at, updated_at)
values ($1 /* clerk providerUserId (google sub) */, $2::uuid /* supabase user id */, 'google',
        jsonb_build_object('sub', $1, 'provider_id', $1, 'email', lower($3), 'email_verified', true),
        now(), now())
on conflict (provider_id, provider) do nothing
returning user_id;   -- 0 rows => sub already owned; check owner and flag a conflict if it differs
```

---

## 4. Passwordless, MFA, passkeys, phone, username

| Clerk feature | Can it migrate? | How |
|---|---|---|
| Email + password (bcrypt) | Yes | `password_hash` from the CSV |
| Password with a non-bcrypt `password_hasher` | Partly | Argon2 PHC strings import; pbkdf2, md5 and others do not, so trigger a reset |
| Email code / email link (no password) | Yes | Create with `email_confirm:true` and no password. Users sign in with `signInWithOtp({ email, options: { shouldCreateUser: false } })`. Needs the Magic Link / OTP email template and SMTP (Auth0 guide, "Passwordless methods") |
| Google / GitHub OAuth | Yes | Auto-link by verified email, or pre-created identities (section 3) |
| Phone number and SMS OTP | Data yes; login needs setup | `admin.createUser({ phone, phone_confirm:true })`. Phone login needs an SMS provider (Twilio and others, default 30 SMS/hour) |
| Multiple emails per user | No | Supabase keeps one `auth.users.email`; secondary Clerk emails are dropped |
| Username sign-in | No | Supabase Auth has no username identifier |
| TOTP MFA | Not through the API | CSV has `totp_secret`, but the admin factor API only lists, deletes or renames factors (admin.go routes 370-378). Inserting into `auth.mfa_factors` (`factor_type`, `status`, `secret`, ...) is technically possible but unsupported. Supabase's own FAQ: TOTP users "may need to re-enroll" |
| Backup codes | No | Not in the CSV; Supabase has its own recovery-code factor type |
| SMS second factor | Re-enroll | Supabase supports phone MFA (https://supabase.com/docs/guides/auth/auth-mfa) |
| Passkeys | No | Clerk exposes no credential export. Supabase passkeys are **experimental**, need supabase-js >= 2.105.0 and `auth: { experimental: { passkey: true } }`, and are "cryptographically bound to the Relying Party (RP) ID"; the admin API can only list or delete them (https://supabase.com/docs/guides/auth/passkeys). Users register again |
| Banned users | Yes | `ban_duration: '876000h'` |
| Clerk organizations | N/A | Not used by Quicktalog |

---

## 5. Sessions, and the interim third-party auth path

### 5.1 Clerk sessions cannot become Supabase sessions
- Clerk session tokens are Clerk-signed JWTs with a **60-second** lifetime, refreshed every 50 s. They live in the `__session` cookie on your domain; the `__client` cookie is HttpOnly on the FAPI domain (https://clerk.com/docs/guides/how-clerk-works/overview).
- Supabase sessions are Supabase-signed access and refresh tokens.
- Neither side has an import endpoint.
- Clerk's docs say switching providers "will likely end any currently active sessions". Better Auth's Clerk guide says "This migration will invalidate all active sessions".

**Options:**
1. **Forced re-login at cutover** (simplest). Remove Clerk middleware; users hit `/auth` and sign in with the same password or Google account. Supabase's table calls this "One-off: some downtime; users will need to log in again".
2. **Session bridge during a dual-run** (no re-login for users active in the window). While Clerk is live, a server route uses the Clerk session to find the mapped Supabase user, then:
   - calls `admin.generateLink({ type: 'magiclink', email })`, which only builds the link and token hash and sends no email (mail.go `adminGenerateLink`);
   - calls `verifyOtp({ type: 'email', token_hash })` on the cookie-based SSR client, which sets Supabase cookies. `type:'email'` accepts magiclink token hashes (verify.go:735-743).

   Caveats:
   - `generateLink` **creates** the user if the email is missing, so look up the mapping first.
   - `/verify` is rate-limited **per IP** (default 30 per 5 min). All calls come from Vercel egress IPs, so raise that limit for the window. This is inferred from api.go:270 and the rate-limits page.
3. **Password trickle.** When `signInWithPassword` fails with `invalid_credentials`:
   - call Clerk `users.getUserList({ emailAddress: [email] })`, then `users.verifyPassword({ userId, password })` (`POST /users/{user_id}/verify_password`, https://clerk.com/docs/reference/backend/user/verify-password);
   - then `admin.updateUserById(id, { password })` or `createUser`, and retry.

   With CSV hash import this only catches users who changed their password after the export.
   - The admin update enforces password strength (admin.go comment at 451-452), so handle `weak_password` by starting a reset.
   - Whether Clerk's lockout counts `verifyPassword` failures is not documented.
4. **Dual-run length.** Clerk's trickle-migration advice: "a few weeks" to "months"; migrate inactive users with a bulk import anyway.

### 5.2 Supabase Third-party auth with Clerk (interim: enforce RLS first, then swap auth)
**Steps** (https://supabase.com/docs/guides/auth/third-party/clerk and https://clerk.com/docs/guides/development/integrations/databases/supabase, updated Sep 14 2026):
1. In Clerk, open https://dashboard.clerk.com/setup/supabase, choose options, click **Activate Supabase integration**, and copy the **Clerk domain**. Do this separately for the dev instance (TEST) and prod instance (PROD). This adds `"role": "authenticated"` to every session token.
   - Manual alternative: customize the session token so it carries a `role` claim, and add the Supabase integration only once *all* tokens have it.
2. In Supabase, go to **Authentication > Sign In / Providers > Third-party**, click **Add provider**, pick **Clerk**, and paste the domain. For local dev, add to `supabase/config.toml`:
   ```toml
   [auth.third_party.clerk]
   enabled = true
   domain = "example.clerk.accounts.dev"
   ```
   The current `supabase/config.toml:18-37` has no such block.
3. Create the client:
   ```ts
   // server (Clerk example repo app/ssr/client.tsx)
   import { auth } from "@clerk/nextjs/server";
   import { createClient } from "@supabase/supabase-js";
   export function createServerSupabaseClient() {
     return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
       async accessToken() { return (await auth()).getToken(); },
     });
   }
   // browser: accessToken: async () => session?.getToken() ?? null   (useSession())
   ```
4. Write policies on the text Clerk id:
   ```sql
   alter table public.catalogues enable row level security;
   create policy "owner can read" on public.catalogues for select to authenticated
     using ((select auth.jwt()->>'sub') = created_by);
   create policy "owner can insert" on public.catalogues for insert to authenticated
     with check ((select auth.jwt()->>'sub') = created_by);
   ```
   **Never use `auth.uid()` here.** On TEST it is defined as `coalesce(current_setting('request.jwt.claim.sub'), request.jwt.claims->>'sub')::uuid`, and casting `user_...` to uuid raises an error.

**Limitations**
- The provider must use asymmetric JWTs with a `kid`. Key rotation takes up to 30 min to be picked up. **Supabase Auth cannot be disabled** (https://supabase.com/docs/guides/auth/third-party/overview).
- Billed as Third-Party MAU: Free quota 50,000, Pro/Team 100,000, then $0.00325 each (https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users-third-party).
- A client created with `accessToken` throws on any `supabase.auth.*` call ("Supabase Client is configured with the accessToken option, accessing supabase.auth.X is not possible", `@supabase/supabase-js` dist/index.mjs:389).
- The old JWT-template integration is deprecated (April 1 2025).
- RLS only affects PostgREST, Storage and Realtime requests. **Drizzle connects as `postgres` (BYPASSRLS)**, and the Cloudflare worker's service_role also bypasses RLS, so those paths need their own ownership checks.
- The Clerk webhook `app/api/clerk/route.ts:14,51` writes `public.users` through `@/utils/supabase/server`, which uses the publishable key (anon role). It **will be blocked** once RLS is on for `users`. Move it to Drizzle or a secret-key client first.
- Existing `anon` grants on users, catalogues, subscriptions and analytics stay in place, so policies (or revokes) must cover `anon` too.

### 5.3 Swap to Supabase Auth
- Replace `clerkMiddleware` (`middleware.ts:1-7`) with the `@supabase/ssr` session-refresh middleware. On Next 15.5 the file is still named `middleware.ts`; `proxy.ts` is the Next 16 name.
- Use `supabase.auth.getClaims()` to protect pages; never trust `getSession()` on the server (https://supabase.com/docs/guides/auth/server-side/creating-a-client).
- Installed `@supabase/ssr` is 0.5.2; the latest on npm is 0.12.7, so plan to upgrade.

### 5.4 Keeping policies the same across the swap (optional)
Point policies at a custom claim both providers can issue, instead of `sub`:
- **Clerk:** customize the session token with `{ "app_user_id": "{{user.id}}" }`. Clerk documents shortcode claims such as `"userId": "{{user.external_id || user.id}}"` in its migration guide.
- **Supabase:** a Custom Access Token Hook sets the same claim from `public.users` (top-level claims are allowed; the RBAC guide uses `jsonb_set(claims, '{user_role}', ...)`):
  ```sql
  create or replace function public.custom_access_token_hook(event jsonb) returns jsonb language plpgsql stable as $$
  declare claims jsonb := event->'claims'; app_id text;
  begin
    select u.id into app_id from public.users u where u.auth_user_id = (event->>'user_id')::uuid;  -- or u.id = event->>'user_id' if ids were swapped
    if app_id is not null then claims := jsonb_set(claims, '{app_user_id}', to_jsonb(app_id)); end if;
    return jsonb_set(event, '{claims}', claims);
  end $$;
  grant execute on function public.custom_access_token_hook to supabase_auth_admin;
  revoke execute on function public.custom_access_token_hook from authenticated, anon, public;
  ```
- **Policy:** `using ((select auth.jwt()->>'app_user_id') = created_by)`.

---

## 6. Email deliverability, templates, redirect URLs

### 6.1 SMTP
From https://supabase.com/docs/guides/auth/auth-smtp and https://supabase.com/docs/guides/auth/rate-limits:
- **The built-in SMTP is not for production.**
  - It sends only to addresses in the org's Team; others fail with "Email address not authorized".
  - The limit is **2 emails per hour**, and it can change without notice.
  - There is no SLA.
- **After enabling custom SMTP** the email rate limit starts at **30/hour**; raise it under Authentication > Rate Limits.
- **Resend SMTP:** host `smtp.resend.com`, port `465`, user `resend`, password = API key. A verified domain is required (https://resend.com/docs/send-with-supabase-smtp).
  - It can also be set through the Management API with `PATCH /v1/projects/{ref}/config/auth` (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `smtp_admin_email`, `smtp_sender_name`).
- **Supabase best practices:** DKIM/SPF/DMARC; a separate auth subdomain (for example `auth.quicktalog.app`); **do not mix auth mail with marketing mail**; a standby provider; CAPTCHA; a custom domain.
  - Brevo is already used for marketing contacts (the `public.users` trigger "Brevo New Contact Webhook"), so send auth mail through Resend on a separate subdomain.
- **Other auth rate limits:**
  - `/signup`, `/recover`, `/resend`, `/magiclink`, `/otp`, `/user`: 30 per 5 min per IP.
  - `/otp`: 60 s between sends per user.
  - `/verify`: 30 per 5 min per IP.
  - `/token`: 150 per 5 min per IP.

### 6.2 Templates
- **Types** (https://supabase.com/docs/guides/auth/auth-email-templates): Confirm sign up, Invite user, Magic link / OTP, Change email address, Reset password, Reauthentication, plus security notifications (password changed, email changed, identity linked/unlinked, and others).
- **Variables:** `{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`, `{{ .RedirectTo }}`, `{{ .Data }}`, `{{ .Email }}`.
- **SSR token-hash links** (Password-based Auth docs):
  - Confirm sign up: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}`
  - Reset password: `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/account/update-password`
  - Both are handled by `app/auth/confirm/route.ts`, which calls `supabase.auth.verifyOtp({ token_hash, type })`.
  - The magic-link template uses the same pattern with `type=email` (inferred from verify.go).
- **Email prefetching:** some mail scanners open links and use up tokens. Mitigate with OTP codes or a click-to-confirm page.
- **Vercel previews:** `{{ .SiteURL }}` always points to the project Site URL. Use `{{ .RedirectTo }}` so preview users return to the preview host (https://supabase.com/docs/guides/auth/redirect-urls).

### 6.3 Redirect URL allow-list
- **Matching rules** (source `internal/utilities/request.go` `IsRedirectURLValid`):
  - Any URL on the **Site URL's host, scheme and port** is allowed automatically.
  - Every other host must match a glob in the allow-list. `*` matches any characters except the separators `.` and `/`; `**` matches anything.
- **Recommended entries:**
  - `https://test.quicktalog.app/**` (for PROD, when the Site URL is `https://www.quicktalog.app`)
  - `http://localhost:3000/**`
  - `https://*-<vercel-team-or-account-slug>.vercel.app/**` (the pattern Supabase documents for Vercel previews)
- **Current problem:** `supabase/config.toml:23` lists `"https://www.quicktalog.app", "https://test.quicktalog.app"` with **no `/**`**. `https://test.quicktalog.app/auth/callback` would be rejected there, and on PROD the Site URL rule only covers the www host.
- **Note:** `config.toml` only drives local dev and `supabase config push`. Hosted settings live in the dashboard or Management API. Set each project's own Site URL (TEST should be `https://test.quicktalog.app`).

---

## 7. Cutover checklist (combined from Supabase, Clerk, Better Auth, WorkOS and the Auth0 case study)

**Preparation (T-14 to T-7 days)**
- [ ] Record which Clerk instance PROD uses (`sk_live_` or `sk_test_` key) and which strategies are enabled (password, Google, email code, TOTP, passkeys).
- [ ] Supabase Auth config, per project:
  - Site URL and redirect allow-list (6.3)
  - Resend SMTP with DKIM/SPF/DMARC, and a raised email rate limit
  - Templates switched to token_hash links (6.2)
  - Google provider with its own OAuth client and callback URL
  - Confirm email on
  - Leaked-password protection and password policy decided
  - "Allow new users to sign up" **off** until cutover (admin import still works)
- [ ] Set up a secret key for scripts, never exposed to the browser or Vercel public env.
- [ ] Create the mapping table (`migration.clerk_user_map`, see 8.1) in a schema not exposed to PostgREST.
- [ ] Decide how `public.users.id` changes (8.4). Check every FK is `ON UPDATE CASCADE`. Plan to disable the **"Brevo New Contact Webhook"** trigger during the backfill, otherwise every row fires an edge-function call.
- [ ] Rehearse end to end on TEST (3 users on TEST today, all `user_%` ids, no duplicate emails). Test password sign-in, Google sign-in (auto-link and pre-created identity), OTP, reset, and the webhook-to-`public.users` path.
- [ ] Optional: turn on the Clerk third-party integration and RLS first (5.2).

**Freeze and export (T-1 day to T-0)**
- [ ] Set Clerk to **Restricted** sign-up mode ("Invite-only"): new sign-ups are blocked, existing users can still sign in (https://clerk.com/docs/guides/secure/restricting-access).
- [ ] Hide or disable Clerk `<UserProfile>` (`components/dashboard/Settings.tsx:39`) so emails, passwords and connected accounts stop changing. Keep the Clerk webhook (`app/api/clerk/route.ts`, events `user.created/updated/deleted` at :58-59 and :88) running and logging.
- [ ] Export the Dashboard CSV **as late as possible**. Clerk warns: "any export of your data will be a snapshot in time". Record the export timestamp.
- [ ] Run the import in dry-run, then for real (section 8). Reconcile counts (Clerk `totalCount` vs `auth.users` vs the map) and investigate every `conflict`, `error` and `skipped` row. In the Auth0 case study, 1,600 users were missing from the final hash export and needed resets.
- [ ] **Delta pass right before cutover:**
  - re-run the script; it is idempotent;
  - users with `created_at` after the export: `getUserList({ createdAtAfter })`;
  - users with `password_last_updated_at` after the export: re-export the CSV, or trigger a reset;
  - `user.deleted` webhooks since the export: delete in Supabase.
- [ ] Remap `public.users` and FKs (8.4); run the verification queries.

**Cutover (T-0)**
- [ ] Deploy the Supabase-auth build behind a flag (for example `AUTH_PROVIDER=supabase`). Turn Supabase sign-ups **on**.
- [ ] Choose a session strategy: forced re-login, or a short bridge window (5.1).
- [ ] Watch Auth logs for `email_not_confirmed`, `invalid_credentials`, `over_email_send_rate_limit` and 500 `Database error querying schema`.

**After cutover (T+1 to T+30 days)**
- [ ] Keep the Clerk instance and its users **untouched** (read-only) for N days, commonly 14-30. Better Auth: "Keep Clerk installed and configured until the migration is complete".
- [ ] Keep `clerk_user_id` in `app_metadata` and the mapping table for audit and support.
- [ ] Send an email to users who were `skipped`, had non-importable hashes or were created after the export, asking them to reset their password.
- [ ] Remove `@clerk/*`, the Clerk webhook route and Clerk env vars only after the rollback window closes.

**Rollback plan**
- Flip the flag back to Clerk; Clerk still holds every pre-cutover user.
- Users who signed up on Supabase after cutover can be pushed into Clerk with Clerk `createUser({ passwordDigest: auth.users.encrypted_password, passwordHasher: 'bcrypt' })`. Clerk's migration tool already exports Supabase `encrypted_password` as bcrypt.
- Keep `public.users` ids reversible: the map has both ids, and FKs cascade on update.

---

## 8. Import script

### 8.1 Mapping table (DDL for you to review and apply; not run by me)
```sql
create schema if not exists migration;
revoke all on schema migration from anon, authenticated;
create table if not exists migration.clerk_user_map (
  clerk_user_id     text primary key,
  supabase_user_id  uuid not null unique,
  email             text,
  status            text not null default 'pending', -- pending|migrated|conflict|skipped|error
  password_imported boolean not null default false,
  google_sub        text,
  detail            text,
  updated_at        timestamptz not null default now()
);
```

### 8.2 `scripts/migrate-clerk-to-supabase.ts`
Run it locally or in CI (`npx tsx`), never as a Vercel route. It is idempotent, batched, and writes the clerk_id-to-uuid map.

```ts
/* env: CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SECRET_KEY, MIGRATION_DATABASE_URL (postgres role; the
   existing Supavisor URL works with prepare:false), CLERK_CSV, DRY_RUN=1, CONCURRENCY=4 */
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { parse } from "csv-parse/sync";
import { createClerkClient, type User as ClerkUser } from "@clerk/backend";
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const DRY_RUN = process.env.DRY_RUN === "1";
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 4);
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
const sql = postgres(process.env.MIGRATION_DATABASE_URL!, { prepare: false, max: CONCURRENCY + 1 });

type CsvRow = Record<string, string> & { id: string };
const csvRows: CsvRow[] = parse(fs.readFileSync(process.env.CLERK_CSV!, "utf8"),
  { columns: true, skip_empty_lines: true, trim: true, comment: "#" });
const csvById = new Map(csvRows.map((r) => [r.id, r]));

const BCRYPT = /^\$2[abxy]\$\d{2}\$[./A-Za-z0-9]{53}$/;
const ARGON2 = /^\$argon2(id|i|d)\$v=(16|19)\$m=\d+,t=\d+,p=\d+/;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function clerkCall<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(); }
    catch (e: any) {
      if (e?.status === 429 && attempt < 8) { await sleep((Number(e?.retryAfter) || 10) * 1000); continue; }
      throw e;
    }
  }
}

async function* clerkUsers() {
  const limit = 500; // Clerk max
  for (let offset = 0; ; offset += limit) {
    const page = await clerkCall(() => clerk.users.getUserList({ limit, offset, orderBy: "+created_at" }));
    yield* page.data;
    if (page.data.length < limit) return;
  }
}

async function record(clerkUserId: string, p: { status: string; email?: string | null; detail?: string; passwordImported?: boolean }) {
  console.log(JSON.stringify({ clerkUserId, ...p }));
  if (DRY_RUN) return;
  await sql`
    insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, email, status, detail, password_imported)
    values (${clerkUserId}, ${randomUUID()}, ${p.email ?? null}, ${p.status}, ${p.detail ?? null}, ${p.passwordImported ?? false})
    on conflict (clerk_user_id) do update set
      status = excluded.status, detail = excluded.detail,
      email = coalesce(excluded.email, migration.clerk_user_map.email),
      password_imported = migration.clerk_user_map.password_imported or excluded.password_imported,
      updated_at = now()`;
}

/** Write-ahead UUID: fixed on first sight, reused by every re-run. */
async function claimUuid(clerkUserId: string, email: string): Promise<string> {
  if (DRY_RUN) return randomUUID();
  const [row] = await sql<{ supabase_user_id: string }[]>`
    insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, email)
    values (${clerkUserId}, ${randomUUID()}, ${email})
    on conflict (clerk_user_id) do update set updated_at = now()
    returning supabase_user_id`;
  return row.supabase_user_id;
}

/** Returns a conflict message, or null. */
async function linkGoogle(u: ClerkUser, userId: string): Promise<string | null> {
  for (const ea of u.externalAccounts) {
    if (ea.provider.replace(/^oauth_/, "") !== "google") continue;
    if (ea.verification?.status !== "verified" || !ea.providerUserId) continue;
    if (DRY_RUN) { console.log(JSON.stringify({ clerkUserId: u.id, wouldLinkGoogle: ea.providerUserId })); continue; }
    const inserted = await sql`
      insert into auth.identities (provider_id, user_id, provider, identity_data, created_at, updated_at)
      values (${ea.providerUserId}, ${userId}::uuid, 'google',
              ${sql.json({ sub: ea.providerUserId, provider_id: ea.providerUserId,
                           email: ea.emailAddress?.toLowerCase() ?? null, email_verified: true })},
              now(), now())
      on conflict (provider_id, provider) do nothing
      returning user_id`;
    if (inserted.length === 0) {
      const [owner] = await sql`select user_id from auth.identities where provider = 'google' and provider_id = ${ea.providerUserId}`;
      if (owner && owner.user_id !== userId) return `google sub ${ea.providerUserId} already linked to ${owner.user_id}`;
    }
    await sql`update migration.clerk_user_map set google_sub = ${ea.providerUserId} where clerk_user_id = ${u.id}`;
  }
  return null;
}

async function migrateOne(u: ClerkUser) {
  const primary = u.emailAddresses.find((e) => e.id === u.primaryEmailAddressId);
  const email = primary?.emailAddress.trim().toLowerCase();
  if (!email) return record(u.id, { status: "skipped", detail: "no primary email (phone/username/web3-only)" });
  const emailVerified = primary!.verification?.status === "verified";
  const id = await claimUuid(u.id, email);

  const csv = csvById.get(u.id);
  const digest = csv?.password_digest ?? "";
  const hasher = csv?.password_hasher ?? "";
  const importable = (hasher === "bcrypt" && BCRYPT.test(digest)) || (hasher.startsWith("argon2") && ARGON2.test(digest));
  if (u.passwordEnabled && !importable)
    console.warn(JSON.stringify({ clerkUserId: u.id, warn: `password not importable (hasher='${hasher}', inCsv=${!!csv}) -> reset needed` }));

  if (!DRY_RUN) {
    const existing = await supabase.auth.admin.getUserById(id);
    if (!existing.data.user) {
      const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ");
      const { error } = await supabase.auth.admin.createUser({
        id, email, email_confirm: emailVerified,
        ...(importable ? { password_hash: digest } : {}),
        user_metadata: { ...(fullName ? { full_name: fullName } : {}), ...(u.hasImage ? { avatar_url: u.imageUrl } : {}) },
        app_metadata: { clerk_user_id: u.id },
        ...(u.banned ? { ban_duration: "876000h" } : {}),
      });
      if (error) {
        if (error.code === "email_exists") {
          const [owner] = await sql`select id from auth.users where email = ${email} and is_sso_user = false`;
          return record(u.id, { status: "conflict", email, detail: `email_exists (owner ${owner?.id})` });
        }
        return record(u.id, { status: "error", email, detail: `${error.status} ${error.code ?? ""} ${error.message}` });
      }
      await sql`update auth.users set created_at = ${new Date(u.createdAt)} where id = ${id}::uuid`; // optional
    }
  }
  const googleConflict = await linkGoogle(u, id);
  if (googleConflict) return record(u.id, { status: "conflict", email, detail: googleConflict });
  return record(u.id, { status: "migrated", email, passwordImported: importable });
}

async function main() {
  const seen = new Set<string>();
  let batch: Promise<unknown>[] = [];
  for await (const u of clerkUsers()) {
    seen.add(u.id);
    batch.push(migrateOne(u).catch((e) => record(u.id, { status: "error", detail: String(e?.message ?? e) })));
    if (batch.length >= CONCURRENCY) { await Promise.all(batch); batch = []; }
  }
  await Promise.all(batch);
  for (const r of csvRows) if (!seen.has(r.id))
    console.warn(JSON.stringify({ clerkUserId: r.id, warn: "in CSV but not in Backend API (deleted after export?)" }));
  if (!DRY_RUN) {
    console.table(await sql`select status, count(*)::int as n from migration.clerk_user_map group by 1 order by 1`);
    const map = await sql`select clerk_user_id, supabase_user_id, email, status, password_imported, google_sub
                          from migration.clerk_user_map order by clerk_user_id`;
    fs.writeFileSync(`clerk-supabase-map.${new Date().toISOString().replace(/[:.]/g, "-")}.json`, JSON.stringify(map, null, 2));
  }
  await sql.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
```

**Why it is idempotent**
- The UUID is claimed once per Clerk id.
- `getUserById` skips users who already exist, including after a crash between create and record.
- `email_exists` is recorded as a conflict and never retried blindly.
- Identity inserts use `on conflict do nothing`.
- Clerk calls retry on 429 using `Retry-After`.
- Throughput: only about ceil(N/500) Clerk calls are made; Supabase calls run at `CONCURRENCY`.

### 8.3 Verification queries (read-only)
```sql
-- mapped but missing / email mismatch
select m.* from migration.clerk_user_map m left join auth.users a on a.id = m.supabase_user_id
where m.status = 'migrated' and (a.id is null or a.email <> m.email);
-- NULL token columns (would 500 on sign-in; only possible after manual SQL)
select count(*) from auth.users
where confirmation_token is null or recovery_token is null or email_change_token_new is null or email_change is null;
-- users with a password vs imported hashes
select count(*) filter (where encrypted_password like '$2%') as bcrypt, count(*) as total from auth.users;
select status, count(*) from migration.clerk_user_map group by 1;
select count(*) from auth.identities where provider = 'google';
```

### 8.4 Remapping `public.users` (you decide)
**Option A (smallest change):** add `public.users.auth_user_id uuid unique references auth.users(id)` and backfill it from the map. Text ids and FKs stay as they are, and policies and the access-token hook map through this column.

**Option B:** move `public.users.id` to the uuid text. Every FK is `ON UPDATE CASCADE`, so children follow.

```sql
begin;
alter table public.users disable trigger "Brevo New Contact Webhook";   -- named trigger only, NOT "ALL"
update public.users u set id = m.supabase_user_id::text
from migration.clerk_user_map m
where m.clerk_user_id = u.id and m.status = 'migrated';
alter table public.users enable trigger "Brevo New Contact Webhook";
commit;
```

Cautions for Option B:
- Do **not** use `session_replication_role = replica` or `DISABLE TRIGGER ALL`. Foreign-key cascades are implemented as internal triggers and would be skipped, leaving orphaned rows.
- Update the `created_by` owner of `catalogues.name` Redis/cache keys if they embed user ids.
- `subscriptions` link through `users.customer_id` (Paddle), which is unaffected.

---

## 9. Sources
- Clerk: migrating overview/export https://clerk.com/docs/guides/development/migrating/overview ; export changelog https://clerk.com/changelog/2024-10-23-export-users ; system limits https://clerk.com/docs/guides/how-clerk-works/system-limits ; getUserList https://clerk.com/docs/reference/backend/user/get-user-list ; Backend User https://clerk.com/docs/reference/backend/types/backend-user ; ExternalAccount https://clerk.com/docs/reference/backend/types/backend-external-account ; verifyPassword https://clerk.com/docs/reference/backend/user/verify-password ; restricted mode https://clerk.com/docs/guides/secure/restricting-access ; environments https://clerk.com/docs/guides/development/managing-environments ; how Clerk works https://clerk.com/docs/guides/how-clerk-works/overview ; Supabase integration https://clerk.com/docs/guides/development/integrations/databases/supabase ; session tokens https://clerk.com/docs/guides/sessions/session-tokens ; github.com/clerk/migration-tool ; github.com/clerk/clerk-supabase-nextjs
- Supabase: Auth0 migration https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 ; Firebase Auth migration https://supabase.com/docs/guides/platform/migrating-to-supabase/firebase-auth ; identity linking https://supabase.com/docs/guides/auth/auth-identity-linking ; third-party overview https://supabase.com/docs/guides/auth/third-party/overview ; Clerk https://supabase.com/docs/guides/auth/third-party/clerk ; TP-MAU https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users-third-party ; SMTP https://supabase.com/docs/guides/auth/auth-smtp ; rate limits https://supabase.com/docs/guides/auth/rate-limits ; redirect URLs https://supabase.com/docs/guides/auth/redirect-urls ; email templates https://supabase.com/docs/guides/auth/auth-email-templates ; passwords https://supabase.com/docs/guides/auth/passwords ; passkeys https://supabase.com/docs/guides/auth/passkeys ; MFA https://supabase.com/docs/guides/auth/auth-mfa ; custom access token hook https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook ; RBAC https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac ; SSR client https://supabase.com/docs/guides/auth/server-side/creating-a-client ; Google https://supabase.com/docs/guides/auth/social-login/auth-google ; 500 schema error https://supabase.com/docs/guides/troubleshooting/auth-error-500-database-error-querying-schema-eb6b44 ; discussions #34270, #42489 ; source github.com/supabase/auth (master, v2.197.0 released 2026-09-09): internal/api/admin.go, internal/models/{user,identity,linking,factor}.go, internal/crypto/password.go, internal/api/{external,mail,verify,token,api}.go, internal/utilities/request.go, migrations 20221215195500/20221215195800/20231117164230
- Other: WorkOS https://workos.com/docs/migrate/clerk and github.com/workos/migrate-clerk-users ; Better Auth https://better-auth.com/docs/guides/clerk-migration-guide ; Resend https://resend.com/docs/send-with-supabase-smtp ; Auth0-to-Supabase case study https://kevcodez.medium.com/migrating-125-000-users-from-auth0-to-supabase-81c0568de307 ; Microsoft id token claims https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference
## facts
- (verified-in-docs) Clerk Dashboard (instance Settings > User exports > Export users) produces a CSV that includes hashed passwords; admins or personal-workspace users can export; export history is logged. [https://clerk.com/docs/guides/development/migrating/overview#export-your-users-data-from-the-clerk-dashboard]
- (verified-in-source) Clerk export CSV columns are: id, first_name, last_name, username, primary_email_address, primary_phone_number, verified_email_addresses, unverified_email_addresses, verified_phone_numbers, unverified_phone_numbers, totp_secret, password_digest, password_hasher. There are no created_at, image_url, external account or metadata columns. [github.com/clerk/migration-tool samples/clerk.csv; github.com/workos/migrate-clerk-users README; better-auth.com clerk-migration-guide]
- (inferred) Multi-valued email/phone cells in the Clerk CSV are pipe-separated (Clerk's migration tool splits on [,|]). [github.com/clerk/migration-tool commit c6d6eb1c (2026-01-22) and src/migrate/functions.ts; WorkOS README]
- (verified-in-docs) Clerk hashes passwords with bcrypt; export rows show password_hasher=bcrypt with $2b$10$ digests. Users imported into Clerk with other hashers keep them until their next sign-in, when Clerk upgrades them to bcrypt. [https://workos.com/docs/migrate/clerk ; https://better-auth.com/docs/guides/clerk-migration-guide ; https://clerk.com/docs/guides/development/migrating/overview]
- (verified-in-source) Clerk's Backend API User object has no password hash field (only password_enabled and password_last_updated_at). [node_modules/@clerk/backend 2.33.3 dist/api/resources/JSON.d.ts:527-568; https://clerk.com/docs/reference/backend/types/backend-user]
- (verified-in-docs) getUserList: limit must be 1..500 (default 10), offset for pagination, orderBy default -created_at, returns data + totalCount; filters include emailAddress, createdAtAfter, lastSignInAtAfter. [https://clerk.com/docs/reference/backend/user/get-user-list]
- (verified-in-docs) Clerk Backend API rate limits: production 1000 req/10s, development 100 req/10s per instance; 429 responses include Retry-After. [https://clerk.com/docs/guides/how-clerk-works/system-limits]
- (verified-in-docs) Clerk ExternalAccount exposes provider, providerUserId, emailAddress, verification, approvedScopes, label, publicMetadata; the JSON provider value is prefixed (e.g. oauth_google). [https://clerk.com/docs/reference/backend/types/backend-external-account ; @clerk/backend JSON.d.ts:167-182 ; Better Auth guide provider.replace('oauth_','')]
- (verified-in-docs) Users cannot be migrated from a Clerk Development instance to a Production instance; dev instances are capped at 100 users (a web-search snippet says 500, so the number is uncertain). [https://clerk.com/docs/guides/development/managing-environments ; https://clerk.com/docs/guides/development/migrating/overview]
- (verified-in-source) Supabase auth.admin.createUser accepts id, email, phone, password, password_hash, email_confirm, phone_confirm, user_metadata, app_metadata, role, aud, ban_duration. [github.com/supabase/auth internal/api/admin.go:22-35; installed @supabase/auth-js 2.105.3 types.d.ts]
- (verified-in-source) Supabase password_hash supports bcrypt ($2a/$2b/$2y), Argon2 PHC strings ($argon2i/d/id) and Firebase scrypt ($fbscrypt$); providing both password and password_hash returns 400. [https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 ; supabase/auth internal/models/user.go:79-107, internal/crypto/password.go, admin.go:447-449]
- (verified-in-source) A custom user id can be set via admin.createUser({ id }); it must parse as a UUID and not be nil. [https://supabase.com/docs/guides/platform/migrating-to-supabase/auth0 (FAQ) ; admin.go:481-490]
- (verified-in-source) admin.createUser sends no email, returns 422 email_exists for duplicates, generates a random 64-char password when none is given, and is not blocked by the disable-signup setting. [supabase/auth internal/api/admin.go adminUserCreate (400-570); internal/api/apierrors/errorcode.go]
- (verified-in-source) Supabase Auth /admin routes have no GoTrue rate limiter (only requireAdminCredentials); the rate-limits docs list no admin limit. [supabase/auth internal/api/api.go:359-394 ; https://supabase.com/docs/guides/auth/rate-limits]
- (verified-in-docs) Manual SQL inserts into auth.users that leave confirmation_token/recovery_token/email_change_token_new/email_change NULL cause '500: Database error querying schema'; on TEST those four columns are nullable with no default. [https://supabase.com/docs/guides/troubleshooting/auth-error-500-database-error-querying-schema-eb6b44 ; https://github.com/orgs/supabase/discussions/42489 ; TEST information_schema query]
- (verified-in-source) auth.identities.email is a generated column (lower(identity_data->>'email')); identities have unique (provider_id, provider) and id default gen_random_uuid(). [supabase/auth migrations 20221215195800 and 20231117164230; TEST information_schema]
- (verified-in-source) On TEST the postgres role has INSERT privilege on auth.users and auth.identities; auth.users and auth.identities are empty; auth.users has no triggers. [TEST read-only query (has_table_privilege, counts, pg_trigger)]
- (verified-in-docs) Since April 21 2025, users cannot create or drop tables, functions or indexes in auth/storage/realtime, write to their migration tables, or revoke API-role privileges there. [https://github.com/orgs/supabase/discussions/34270]
- (verified-in-source) Supabase automatically links an OAuth identity to an existing user with the same verified email; identities with no verified email create a new user (without an email if it is already taken). [https://supabase.com/docs/guides/auth/auth-identity-linking ; supabase/auth internal/models/linking.go]
- (verified-in-source) If an existing user is unconfirmed when an OAuth identity links, Supabase nulls the password, replaces raw_user_meta_data, deletes other identities, then confirms the user. [supabase/auth internal/api/external.go:409-428; internal/models/user.go:1020-1051]
- (verified-in-source) Every OAuth sign-in/link merges provider identity data into raw_user_meta_data (overwriting keys like full_name/avatar_url). [supabase/auth internal/api/external.go:326,391; internal/models/user.go:230-243]
- (verified-in-source) Supabase's Google identity provider_id is the Google user id/sub from userinfo; an existing identity with matching (provider_id, provider) always wins over email linking. [supabase/auth internal/api/provider/google.go:13-27,116-132; linking.go FindIdentityByIdAndProvider]
- (verified-in-docs) Microsoft Entra 'sub' is pairwise per application ID, so a Clerk-era sub will not match a new OAuth app; GitHub ids are global. [https://learn.microsoft.com/en-us/entra/identity-platform/id-token-claims-reference ; supabase/auth provider/github.go:90-97]
- (verified-in-docs) Manual identity linking (linkIdentity) is beta and must be enabled (GOTRUE_SECURITY_MANUAL_LINKING_ENABLED / dashboard). [https://supabase.com/docs/guides/auth/auth-identity-linking]
- (verified-in-source) Password sign-in returns email_not_confirmed for users whose email is not confirmed. [supabase/auth internal/api/token.go:181-182]
- (verified-in-source) Supabase MFA supports TOTP and phone; the admin factor API can only list, update or delete factors (no import); Supabase's Auth0 guide says TOTP users may need to re-enroll. [https://supabase.com/docs/guides/auth/auth-mfa ; supabase/auth api.go admin factor routes ; Auth0 migration FAQ]
- (verified-in-docs) Supabase passkeys are experimental, require supabase-js >= 2.105.0 with auth.experimental.passkey, are bound to the RP ID, and the admin API only lists or deletes them. [https://supabase.com/docs/guides/auth/passkeys ; https://supabase.com/docs/guides/self-hosting/self-hosted-passkeys]
- (verified-in-docs) Clerk session tokens live 60 seconds and refresh every ~50 seconds; __session cookie on the app domain, __client HttpOnly cookie on the FAPI domain. [https://clerk.com/docs/guides/how-clerk-works/overview]
- (verified-in-docs) Changing auth providers ends active sessions (Clerk docs), and Better Auth's Clerk guide states the migration invalidates all active sessions. [https://clerk.com/docs/guides/development/migrating/overview#active-sessions-session-management ; https://better-auth.com/docs/guides/clerk-migration-guide]
- (verified-in-source) admin.generateLink only builds the action link and hashed_token and does not send email; verifyOtp with type 'email' accepts magiclink token hashes. [supabase/auth internal/api/mail.go adminGenerateLink; internal/api/verify.go:735-743; auth-js GoTrueAdminApi.d.ts]
- (verified-in-docs) Clerk Backend API has verifyPassword({ userId, password }) at POST /users/{user_id}/verify_password. [https://clerk.com/docs/reference/backend/user/verify-password]
- (verified-in-docs) Clerk Restricted sign-up mode blocks new self sign-ups while existing users keep signing in. [https://clerk.com/docs/guides/secure/restricting-access]
- (verified-in-docs) Supabase third-party auth with Clerk: activate at dashboard.clerk.com/setup/supabase (adds role: authenticated to session tokens), add the Clerk domain under Authentication > Third-party, and pass accessToken: () => session.getToken() to supabase-js; RLS uses auth.jwt()->>'sub'. [https://supabase.com/docs/guides/auth/third-party/clerk ; https://clerk.com/docs/guides/development/integrations/databases/supabase]
- (verified-in-docs) Third-party auth limitations: needs asymmetric JWTs with kid, key changes can take 30 min to be picked up, Supabase Auth cannot be disabled; billed as Third-Party MAU (Free quota 50,000; Pro/Team 100,000; $0.00325 over quota). [https://supabase.com/docs/guides/auth/third-party/overview ; https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users-third-party]
- (verified-in-source) A supabase-js client created with the accessToken option throws on any supabase.auth.* access. [node_modules/@supabase/supabase-js dist/index.mjs:383-389]
- (verified-in-source) On TEST, auth.uid() casts the sub claim to uuid, so it errors for Clerk ids like user_xxx. [TEST pg_get_functiondef(auth.uid)]
- (verified-in-docs) Built-in Supabase SMTP only delivers to organization team members and is limited to 2 emails per hour; after enabling custom SMTP the limit starts at 30/hour and can be raised. [https://supabase.com/docs/guides/auth/auth-smtp ; https://supabase.com/docs/guides/auth/rate-limits]
- (verified-in-docs) Resend SMTP for Supabase: host smtp.resend.com, port 465, user resend, password = API key; requires a verified domain. [https://resend.com/docs/send-with-supabase-smtp]
- (verified-in-source) Redirect URLs on the Site URL's host are always allowed; other hosts must match allow-list globs (* excludes . and /; ** matches all); Vercel preview pattern is https://*-<team-or-account-slug>.vercel.app/**. [supabase/auth internal/utilities/request.go IsRedirectURLValid ; https://supabase.com/docs/guides/auth/redirect-urls]
- (verified-in-source) supabase/config.toml lists additional_redirect_urls without /** wildcards and has no third_party, SMTP, or Google provider sections. [supabase/config.toml:18-37]
- (verified-in-docs) SSR email templates should link to /auth/confirm?token_hash={{ .TokenHash }}&type=email (signup) or type=recovery (reset), handled by verifyOtp; use {{ .RedirectTo }} instead of {{ .SiteURL }} for preview hosts. [https://supabase.com/docs/guides/auth/passwords ; https://supabase.com/docs/guides/auth/redirect-urls ; https://supabase.com/docs/guides/auth/auth-email-templates]
- (verified-in-docs) Custom Access Token Hooks may add top-level claims (the RBAC guide sets user_role via jsonb_set). [https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook ; https://supabase.com/docs/guides/api/custom-claims-and-role-based-access-control-rbac]
- (inferred) No official Clerk-to-Supabase Auth migration guide or tool exists; Supabase community tooling covers Firebase only. [supabase-community org repo listing (firebase-to-supabase); GitHub code/repo search]
- (verified-in-source) public.users has AFTER INSERT OR UPDATE trigger "Brevo New Contact Webhook"; subscriptions has "New Lead Webhook" and "Subscription Notification Webhook". [TEST pg_trigger query]
- (verified-in-source) TEST public.users has 3 rows, all with Clerk-style ids, no missing emails and no case-insensitive duplicate emails. [TEST read-only SELECT]
- (verified-in-source) The app renders Clerk <SignIn>/<SignUp> and <UserProfile>, the E2E setup signs in with the password strategy, and the Clerk webhook writes users via the publishable-key server client. [components/auth/Auth.tsx:46-57; components/dashboard/Settings.tsx:6,39; tests/e2e/auth.setup.ts:24; app/api/clerk/route.ts:14,51,58-59,88; utils/supabase/server.ts:8,25]
- (verified-in-source) Installed versions: @supabase/ssr 0.5.2 (npm latest 0.12.7), @supabase/supabase-js 2.105.3 (latest 2.116.0), @clerk/nextjs 6.39.3, next 15.5.16. [node_modules/*/package.json; npm view]
- (verified-in-docs) Clerk dashboard export files expire (the download button stays visible only until the file expires). [https://clerk.com/changelog/2024-10-23-export-users]
- (verified-in-source) Community article claiming Supabase cannot import bcrypt hashes from Clerk is incorrect. [https://dev.to/depfixer/how-to-migrate-from-clerk-to-supabase-auth-save-200month-2j4p vs Supabase Auth0 guide and supabase/auth source]
## gotchas
- Clerk ids (user_...) are not UUIDs, so generate a v4 UUID per user and keep a clerk_id-to-uuid map. Never write RLS with auth.uid() while tokens still carry Clerk ids: auth.uid() casts sub to uuid and throws.
- The Clerk CSV is the only self-serve source of password hashes (the Backend API has none). It does not include external accounts, metadata, created_at or banned flags, so merge it with getUserList. Parse by header with a real CSV parser (cells can be quoted or pipe-separated).
- Check password_hasher on every CSV row. Users imported into Clerk with pbkdf2/md5/scrypt_werkzeug and similar hashers that have not signed in since are not bcrypt. Supabase accepts only bcrypt, Argon2 PHC and Firebase scrypt; everyone else needs a reset.
- Clerk dev and prod instances are separate. Export PROD users from the production Clerk instance; dev instances are capped (about 100 users) and cannot be migrated into prod.
- Import verified Clerk primary emails with email_confirm: true. Otherwise password sign-in returns email_not_confirmed, and a later Google sign-in to that unconfirmed user wipes the imported password, replaces user_metadata and deletes other identities.
- OAuth sign-ins merge provider claims into raw_user_meta_data on every login (full_name, avatar_url, name, picture), so don't store app data there. Keep public.users as the source of truth and put only clerk_user_id in app_metadata.
- Automatic Google linking only works on verified emails and matches by email. Pre-create auth.identities (provider_id = Clerk providerUserId) when the Google email differs from the Clerk primary email or could collide with another user. Microsoft subs are per app and won't match.
- Supabase keeps one email per user, so secondary Clerk emails are dropped. Username-only and web3-only Clerk users cannot be created (email or phone is required).
- If you insert into auth.users by SQL, set confirmation_token, recovery_token, email_change_token_new and email_change to '' (they are nullable with no default); NULLs cause 500 'Database error querying schema'. Never insert auth.identities.email or auth.users.confirmed_at (both generated).
- generateLink(type:'magiclink') creates the user if the email doesn't exist. In a session bridge, look up the mapped Supabase user first and use that user's email.
- Supabase /verify and /token are rate-limited per IP (30/5min and 150/5min). A server-side bridge or confirm route on Vercel shares egress IPs, so raise these limits during the bridge window.
- Clerk session tokens cannot be turned into Supabase sessions. Without a bridge, every user logs in again at cutover.
- Built-in Supabase SMTP sends only to organization team members (other addresses fail with 'Email address not authorized') and allows 2 emails/hour. Password-reset and OTP flows will silently fail for real users until custom SMTP (Resend) is configured; the default custom-SMTP cap of 30/hour must also be raised.
- supabase/config.toml:23 lists redirect URLs without /**, so https://test.quicktalog.app/auth/callback would be rejected. Localhost and Vercel preview hosts also need wildcard entries, and templates using {{ .SiteURL }} send preview users to production.
- Turning on RLS for public.users breaks the Clerk webhook (app/api/clerk/route.ts:14,51), which writes through the publishable-key (anon) client. Drizzle (postgres role, BYPASSRLS) and the Cloudflare worker (service_role) bypass RLS, so RLS protects nothing on those paths.
- A client created with supabase-js's accessToken option (Clerk third-party mode) cannot call supabase.auth.* at all; any leftover auth calls will throw.
- Third-party auth MAU is billed separately, and Supabase Auth itself cannot be disabled while in third-party mode.
- When backfilling public.users.id, disable only the named "Brevo New Contact Webhook" trigger. DISABLE TRIGGER ALL or session_replication_role=replica also turns off the internal FK cascade triggers, leaving catalogues/analytics/newsletter/ocr/prompts/user_themes orphaned.
- Clerk <UserProfile> (components/dashboard/Settings.tsx:39) lets users change emails, passwords and connected accounts after the export. Freeze it, or re-export and run the delta pass (compare password_last_updated_at with the export time).
- Paginate getUserList with orderBy '+created_at'. The default -created_at shifts offsets when users sign up mid-export.
- admin.updateUserById({ password }) enforces the password policy (unlike password_hash import), so a trickle migration must handle weak_password by starting a reset.
- Supabase passkeys are experimental and bound to the RP ID, and Clerk passkeys cannot be exported; plan on re-enrollment. The same goes for TOTP (no import API) and backup codes.
- Do not run the import as a Vercel route; the Hobby plan caps routes at 60 s. Run it locally or in CI with the secret key.
## recommendations
- Before anything else, confirm in the Clerk dashboard which strategies are enabled (password, Google, email code/link, TOTP, passkeys) and whether PROD uses a live (sk_live_) instance. That decides which migration paths apply.
- Import users with auth.admin.createUser({ id: <new uuid>, email, email_confirm: <Clerk verified>, password_hash: <CSV bcrypt digest>, app_metadata: { clerk_user_id } }) from a local or CI Node script using the secret key. Use SQL only to pre-create Google identities and optionally copy created_at.
- Keep a write-ahead mapping table migration.clerk_user_map (clerk_user_id primary key, supabase_user_id unique, status, password_imported, google_sub) in a schema not exposed to PostgREST, and export it to JSON after each run. Re-runs then reuse the same UUIDs.
- Pre-create auth.identities rows for verified Clerk oauth_google accounts (provider_id = providerUserId, on conflict do nothing, flag if another user owns the sub); rely on automatic email linking for everyone else.
- Configure Supabase Auth per project before cutover: Resend custom SMTP on an auth subdomain with DKIM/SPF/DMARC, a raised email rate limit, token_hash email templates using {{ .RedirectTo }}, redirect allow-list entries with /** (test host, localhost, https://*-<slug>.vercel.app/**), a Google provider with its own OAuth client, and ideally a custom auth domain.
- Optional interim phase: enable Clerk as a Supabase third-party provider and ship RLS policies first. Use (select auth.jwt()->>'sub') or a provider-neutral app_user_id claim (Clerk custom session claim plus a Supabase Custom Access Token Hook) so policies survive the auth swap. First move the Clerk webhook's users writes off the anon client.
- Freeze Clerk before the final export: switch to Restricted sign-up mode, hide <UserProfile>, export the CSV as late as possible, then run a delta pass (createdAtAfter, password_last_updated_at later than export time, user.deleted webhooks) right before cutover.
- Decide how logged-in users move over: a forced re-login (simplest) or a short dual-run bridge route (Clerk auth(), then mapped Supabase user, then admin.generateLink magiclink, then server-side verifyOtp type 'email', no email sent). Use the Clerk verifyPassword trickle only for users whose password changed after the export.
- Plan for TOTP MFA and passkey users to re-enroll after migration, and email the users who were skipped or lacked importable hashes a password-reset link.
- For public.users, prefer adding auth_user_id uuid (Option A) during the transition. If you swap ids (Option B), use the ON UPDATE CASCADE FKs and disable only the named Brevo trigger inside one transaction.
- Keep the Clerk instance untouched for a 14-30 day rollback window behind an AUTH_PROVIDER flag. For rollback, push post-cutover Supabase sign-ups back into Clerk with passwordDigest from auth.users.encrypted_password and passwordHasher 'bcrypt'.
- Upgrade @supabase/ssr (0.5.2 to the current 0.12.x) as part of the swap, and protect server routes with supabase.auth.getClaims() rather than getSession().