# Clerk to Supabase Auth + RLS: High-Level Plan

The detailed steps, SQL and runbook for each step are in [`PLAN.md`](PLAN.md) (section numbers in brackets).

**Environments:** every step is done on TEST (`imhinsgyzzyblghwnedk`) first and repeated on PROD (`uhfbapjuzvlyzyodxhqn`) only after it works on TEST. The two databases are separate, so migrations are pushed to each project on its own.

## How the app talks to the database

**Decision (confirmed 2026-09-17): Drizzle ORM for all data, running as private roles; supabase-js for login only.**

**Private roles:** `app_user` (signed-in users) and `app_public` (visitors) are database roles that only the app's server connection can switch into. The public Supabase API cannot use them, and the standard `anon`/`authenticated` roles get no access to app tables. A user's session token therefore opens nothing on its own: every request goes through the app (plan and business rules), then RLS (the user's own rows only).

| Job | Tool |
|---|---|
| All app data (queries, inserts, updates, transactions) | **Drizzle ORM** over `DB_CONNECTION_STRING` |
| Schema changes, policies, grants, functions | **Supabase CLI** migrations (`supabase/migrations/*.sql`) |
| Login, sign-up, sessions, Google | **supabase-js** (`@supabase/ssr`), auth only |

- **RLS enforcement:** every request runs inside a short transaction that sets the database role and the verified user id, the same mechanism PostgREST uses behind supabase-js. Policies apply to every Drizzle query, and a query outside the wrapper is rejected (step 2).
- **Migrations:** written and applied with the Supabase CLI (`supabase migration new`, `supabase db push` to TEST, then PROD). Drizzle is used only for querying; `drizzle-kit pull` refreshes the TypeScript schema after each migration, and `drizzle-kit push/migrate` is never used.
- **camelCase to snake_case:** Drizzle maps it automatically in both directions. The schema declares `createdBy: text("created_by")`, so the app writes `{ createdBy }` and reads `row.createdBy`, while the database column stays `created_by`. `drizzle-kit pull` generates these camelCase keys by default. supabase-js has no such mapping and returns snake_case, which is one reason it is used for auth only.

## High-level steps

1. **Close the open database access now** [5.1]
   Remove the public (`anon`) permissions that let anyone with the publishable key read, change or delete users and catalogues, and fix the endpoints that return other users' data. This is urgent and does not depend on the migration.

2. **Set up the database access layer** [2.3-2.6]
   Add private database roles (`app_user` for signed-in users, `app_public` for visitors) and one wrapper that runs every query as the right role for the current user. Webhooks get a separate admin connection.

3. **Implement RLS in the database** [4, Appendix A]
   Turn on RLS for every table and add policies so a user can only read and change their own rows, while visitors see only published catalogues. This is done while still on Clerk, and the policies stay the same after the switch.

4. **Move all database calls in the code to the new layer** [5.4, Appendix C]
   Route every query through the wrapper, add server-side plan limits, and lock down the remaining unsafe actions (drafts, QR configs, newsletter, AI usage).

5. **Configure Supabase Auth** [8]
   Enable the Google provider with the Google Cloud client ID and secret, set custom email sending (Resend), redirect URLs, captcha and email templates. Keep sign-ups off until cutover.

6. **Build the Supabase login in the app, behind a switch** [5.5, 7]
   Replace the Clerk sign-in/sign-up forms, user menu and account settings, and add the middleware that refreshes the session and the callback/confirm routes. A flag lets the app run on Clerk or Supabase.

7. **Keep app users in sync with auth users** [A.10]
   Add database triggers so creating, updating or deleting a Supabase auth user creates, updates or deletes the matching row in `users`.

8. **Migrate user identities** [6]
   Export users from Clerk (including password hashes), import them into Supabase so existing passwords and Google logins keep working, then switch the user ids in the database to the new Supabase ids.

9. **Rehearse on TEST, then cut over PROD** [5.6, 12]
   Run the full cutover and a rollback on TEST first. On PROD: maintenance window, final import, id switch, flip the flag to Supabase, smoke tests.
   Sessions cannot be moved from Clerk to Supabase, so every user signs in once more with the same email/password or Google account.

10. **Remove Clerk** [5.8]
    After a safe rollback window, delete the Clerk code, packages, environment variables, DNS records and legal mentions.

## Note on "migrate user cookies"

Clerk session cookies cannot be converted into Supabase sessions. Instead of migrating cookies, the plan migrates the user accounts (step 8), and users sign in once at cutover to get a new Supabase session cookie.
