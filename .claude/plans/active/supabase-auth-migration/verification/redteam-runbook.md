# Red-team review: cutover runbook

> Review of the earlier design drafts (2026-09-16). Every critical and high finding is resolved in `../PLAN.md` (see its Appendix D.4). Section and line references point at those drafts, which are not included.


## Summary

## Adversarial review of the identity cutover plan

I reviewed draft `identity-cutover.md` against:
- the binding decision;
- the two sibling artifacts, draft `rls.sql` and draft `app-changes.md`;
- the research reports;
- the repo, plus read-only checks on TEST and the Supabase and Vercel docs.

Nothing was written to any repo, and PROD was not touched.

**Verdict:** the plan is thorough, and its amendments A1–A4 are correct. But several gaps would cause data loss, lockouts or a failed window as written.

**Blockers:**
1. **The import script can delete user data after the re-key.** Its `deleteUser` paths (stale-hash recreate, and "absent from the Clerk list") have no post-re-key guard. After the re-key, the M4 delete trigger plus the FK cascades would wipe that user's catalogues, analytics and subscriptions. The plan itself expects the script to be re-run after cutover for orphan triage.
2. **The three artifacts contradict each other on executable steps.** `rls.sql` still skips imported users by `app_metadata` (the A1 bug), aborts the remap on any leftover non-uuid row, applies a validated `users_id_is_uuid`, and flushes Redis. `app-changes.md` keeps the Clerk webhook on and uses a different rollback script.
3. **The T-0 delta import never refreshes existing users.** A password changed between the T-3 and T-0 exports keeps the old digest; the `staleHash` check runs against the new export time. Email, verification and ban changes are never synced either. The Clerk Account Portal and `<UserProfile/>` are not frozen.
4. **`customData.user_id` is set in the browser** (`components/home/Pricing/PricingColumn.tsx:141`). With the sibling webhook design, an attacker's checkout plus cancellation downgrades any victim. A5 makes the Clerk ids that `/api/items` exposed usable for this forever.
5. **Legacy Supabase keys end in late 2026, but the worker and Vault key migration is scheduled for Phase 5 at T+30.** That will probably land after the deadline and break the worker cron and the edge-function triggers mid-rollback window.

**Other significant risks:**
- **Rate limits.** Server-side `verifyOtp`, the PKCE exchange and refreshes from Vercel IPs hit `/verify` (360/h per IP) and `/token` (1800/h per IP). Supabase docs mark both limits **not customizable**, so the plan's "raise them for cutover week" step cannot work. Every cutover sign-in's token also expires together at T+1h.
- **Re-key locking.** `ADD CONSTRAINT` upgrades to an ACCESS EXCLUSIVE lock while Paddle webhooks (not blocked by maintenance) hold ACCESS SHARE. That deadlock would roll back the re-key.
- **Rollback.**
  - Unconfirmed Supabase sign-ups get pushed into Clerk (whose backend `createUser` probably marks emails verified; unverified).
  - A re-cutover after rollback is blocked, because `rollback_clerk_ids` is never merged into the map.
  - Hobby Instant Rollback can only go back one deployment, so any hotfix deploy changes the rollback target.
- **Monitoring.** It is manual and depends on log retention that Vercel Hobby likely does not give (unverified). The ">5% `invalid_credentials`" rollback trigger has no baseline.
- **M2 on PROD in Phase 0.** It runs before the PROD edge functions and the view consumers are inspected. PROD migration mechanics are also unspecified: `main` has no `supabase/migrations`, and PROD may still have default privileges that grant `anon` access to new tables.
- **Maintenance mode.** The bypass fails open when the token env var is unset. Sign-ups open before the smoke tests. Builder edits are lost silently, because the client error from the 503 is in Sentry `ignoreErrors`.
- **Security regressions.**
  - Client-side `next` redirects can go off-site (e.g. `/\t/evil.com`), since `safeNext` is server-only.
  - MFA users are silently downgraded to password-only.
  - TEST uses an always-pass captcha and shares the Resend quota with PROD.
  - Login-CSRF through the confirm interstitial.
  - Clerk DNS records are removed after the instance is deleted, which opens a subdomain-takeover window.

**Unverified (checked by nobody):** Vercel Hobby log retention and auto-assign after rollback; the clerk-js `__client_uat` cookie domain; whether Clerk's backend `createUser` marks emails verified; whether Clerk external-account `image_url` is a Clerk proxy URL; the Resend plan quota.

## Findings

### [critical] Import script can cascade-delete user data after the re-key (no post-cutover guard)

- **Where:** draft `identity-cutover.md` §5.3 lines 694-707 (deleteUser on staleHash) and line 735 (after-loop deleteUser for users absent from the Clerk list); §4.5 lines 536-537; §8.1 lines 1252-1257 (handle_auth_user_deleted)
- **Problem:** The import script has two destructive paths:
- `deleteUser` when `existing && staleHash && importable`. It is commented "before the re-key only" but has no code guard.
- `deleteUser` for every map row missing from the fetched Clerk list.

The plan expects the script to be re-run after the re-key (§4.5 re-imports orphans "and re-key that row alone"; §9.2 monitoring fixes). After the re-key, `handle_auth_user_deleted` deletes `public.users` by uuid, and the FK cascades remove catalogues, analytics, newsletter, prompts, ocr, user_themes and subscriptions (via customer_id).

It gets worse in two ways:
- The recreated auth user gets no `public.users` row, because the A1 trigger skips uuids that are in the map. The user is left with no data.
- If Clerk pagination fails part-way (429s exhausted, or at T+30 when the instance is deleted), the "absent from Clerk list" set covers many or all users. That is a mass deletion.
- **Evidence:** - identity-cutover.md:696-699: `if (existing && staleHash && importable) { // before the re-key only ... await supabase.auth.admin.deleteUser(id) }`
- :735: `map rows whose clerk_user_id is absent from the Clerk list -> deleteUser(supabase_user_id)`
- :1222-1224: the trigger skips users in the map.
- :1255 deletes `public.users`.
- FKs are ON DELETE CASCADE (initial inventory: TEST FK facts).
- §4.5:536 re-imports and re-keys after cutover.
- **Fix:** - **Refuse destructive work after the re-key.** At startup, check `exists (select 1 from public.users u join migration.clerk_user_map m on m.supabase_user_id::text = u.id)`. If it is true, run in post-cutover mode: never call `deleteUser`, never recreate users, only create missing users and map rows. Update password digests with `update auth.users set encrypted_password` (row DML is allowed) instead of delete-and-recreate.
- **Pre-cutover deletions need an explicit `--allow-delete` flag.** The script must also abort when fetched Clerk users ≠ `totalCount`, or when the deletion set exceeds a small threshold (e.g. max(3, 1%)).
- **Test it.** Add a unit test for the guard, and a pgTAP/integration test showing a post-re-key run never touches owned rows.

### [high] Sibling SQL/runbook artifacts still contain the bugs this plan's amendments fix

- **Where:** draft `rls.sql`:1059-1061, 1253-1262, 1276-1278; draft `app-changes.md`:2417, 2446, 2462-2464, 2497 vs identity-cutover.md A1:44, A2:45, A9:52, §4.3, §4.6, §9.2
- **Problem:** The executable artifacts disagree with identity-cutover.md.

`rls.sql` (M4):
- It still skips imported users with `raw_app_meta_data ? 'clerk_user_id'`, which never matches at INSERT time (A1). If this M4 ships, the T-3 dark import creates a uuid `public.users` row with the Starter plan for every imported user. The Brevo trigger then fires to PROD edge functions and creates duplicate CRM contacts.
- At T-0 the remap then aborts on its own "target uuid already present" check, in the middle of the window.

`rls.sql` (remap and migration 09):
- The remap raises if any non-uuid row remains, contradicting A2's accepted orphans.
- Migration 09 is a validated CHECK.
- It says to "flush the Redis prefix" (contradicts A9).

`app-changes.md` §4.3/§5:
- It keeps the Clerk webhook running; this plan disables it at step 3.
- It flushes Redis on hits.
- It removes maintenance at the provider flip, before sign-ups are enabled.
- Its rollback script, `unmap-user-ids.sql`, ignores `rollback_clerk_ids`.

Operators will run whichever file they open.
- **Evidence:** - rls.sql:1059: `if coalesce(new.raw_app_meta_data, '{}'::jsonb) ? 'clerk_user_id' then return new;`
- rls.sql:1219-1221: `raise exception 'a target uuid is already present in public.users'`
- rls.sql:1253-1258: raises if any non-uuid ids remain.
- rls.sql:1262: `flush the Redis prefix`
- rls.sql:1276-1278: validated CHECK.
- app-changes.md:2446: `Keep the webhook running.`
- app-changes.md:2497: `unmap-user-ids.sql`
- **Fix:** - **Pick one source of truth** (identity-cutover.md §4, §8.1, §9) and regenerate from it: `rls.sql` M4, the remap, migration 09, and `app-changes.md` §4.2-§5.4.
- **Delete the duplicate runbooks** and replace them with a pointer.
- **Test the shipped migration file itself.** Add a CI check that runs pgTAP `50_auth_triggers` case (4) ("map row pre-claimed → no `public.users` row") and `55_remap` against the migration file that will be applied, not against SQL copied into the test.

### [high] Delta import never refreshes password digests, emails, verification or bans for users who already exist

- **Where:** identity-cutover.md §5.3 lines 687-707; §5.4 row line 751; §9.2 steps 3-5 lines 1419-1421
- **Problem:** `staleHash` compares `passwordLastUpdatedAt` with the **current** `EXPORTED_AT`.

Take a user whose password changed between export #1 (T-3) and export #2 (T-0):
- At T-0, `staleHash` is false and `existing` is true.
- The script does nothing, so `auth.users` keeps the T-3 digest and the user's current password fails.

When `staleHash` is true, the script deletes and recreates the user **without** `password_hash` (`importable && !staleHash` is false), so the user gets a random password.

The delta also never syncs:
- email changes;
- newly verified emails (`email_confirm` stays false, leading to `email_not_confirmed`);
- new bans;
- unlinked Google accounts.

Nothing freezes the Clerk Account Portal or `<UserProfile/>`. Signed-out redirects go to the Portal (auth-surface §1), and password resets there still work in Restricted mode. So changes can happen until step 11.

The users hit are exactly the recently active ones, which can trip the >5% `invalid_credentials` rollback trigger.
- **Evidence:** - :687: `const staleHash = u.passwordLastUpdatedAt && u.passwordLastUpdatedAt > Date.parse(process.env.EXPORTED_AT!)`
- :700: `if (!existing || (staleHash && importable))`
- :703: `...(importable && !staleHash ? { password_hash: ... } : {})`
- app-changes.md:2446 does freeze UserProfile; this plan does not.
- auth-surface.md §1: middleware redirects to the Clerk Account Portal.
- **Fix:** - **Compare digests on every delta run.** For each existing user, compare `auth.users.encrypted_password` with the CSV digest over `MIGRATION_DATABASE_URL`. If they differ and the CSV digest is importable, run `update auth.users set encrypted_password=$csv, updated_at=now()`.
- **Sync other fields** through `admin.updateUserById`: email, `email_confirm`, `ban_duration`. Delete Google identities that are no longer on the Clerk user.
- **Freeze Clerk at T-3.** Ship the `UserProfile` notice (app-changes.md:2446), and disable password reset and profile edits in the Clerk Account Portal settings. After the T-0 export, add every user with `passwordLastUpdatedAt > EXPORTED_AT` to `needs-reset.csv`.
- **Add verify V12 as a go/no-go check before sign-ups open.** For 100% of `password_imported` rows, `auth.users.encrypted_password` must equal the CSV digest.

### [high] Paddle linking trusts browser-set customData; A5 keeps harvested Clerk ids exploitable forever

- **Where:** identity-cutover.md A5 line 48, §3.2 item 4 lines 170-173, §9.4 step 11 line 1522, §10.4 line 1573; app-changes.md resolveUserId lines 664-681 and handleSubscription lines 611-641
- **Problem:** Checkout runs entirely in the browser through Paddle.js, so `customData.user_id` is whatever the caller sends.

With the resolution order "customer_id, then customData.user_id, then the Clerk id through the map", the attack works like this:
1. The attacker opens a checkout with the victim's id.
2. The webhook resolves the victim.
3. On `subscription.canceled`, with no active subs left for the attacker's customer, it sets the victim's `plan_id` to Starter (`where id = userId`), even though the victim pays through their own `customer_id`.
4. The worker then deactivates the victim's catalogues that exceed Starter limits.

The ids are known to attackers:
- Clerk ids were public through `/api/items` (`select *` including `created_by`) until Phase 0.
- A5 keeps the map "permanently", so a harvested Clerk id resolves forever.

The map fallback is also mostly unnecessary. Pre-cutover renewals already resolve through the linked `customer_id` in step 1.
- **Evidence:** - PricingColumn.tsx:141-147: client-side `paddle.Checkout.open({ items, customer: { email } })`.
- app-changes.md:565 adds `customData: { user_id }` on the client.
- app-changes.md:637-639: cancel path `tx.update(users).set({ planId: tiers[0].priceId.month }).where(eq(users.id, userId))`.
- identity-coupling.md security: `/api/items` exposes `created_by`.
- **Fix:** - **Bind checkout to the server.** A server action (`requireIdentity`) creates the Paddle transaction with `custom_data: { user_id, sig: HMAC(secret, user_id|transaction nonce) }` and passes `transactionId` to `Paddle.Checkout.open`. The webhook verifies `sig`, or re-fetches the transaction from the Paddle API and checks it was server-created.
- **Only touch `plan_id` where `users.customer_id = event.customerId`.** Link a `customer_id` only when the user has none, and never downgrade by `customData`.
- **Drop A5 step 3** (the Clerk-id lookup through the map), or limit it to subscriptions created before T-0 whose customer is unlinked, with an operator review queue.

### [high] Legacy Supabase API keys end in late 2026, but the worker and Vault key migration waits until T+30

- **Where:** identity-cutover.md §3.6 line 317, §7.8 lines 1132-1142, §10.1 line 1554 (Phase 5)
- **Problem:** The plan migrates the worker's `SUPABASE_SERVICE_ROLE_KEY` and the Vault `service_role_key` (used by `call_edge_function_with_vault_secret` and the Sync Plans cron) only at T+30.

Today is 2026-09-17. Phases 0-3 include several 24h and 72h soaks, a T-14 checklist and rehearsals, so T+30 very likely falls after Supabase's end-of-2026 legacy-key cutoff.

When the legacy keys stop working:
- the worker cron stops (catalogue deactivation, analytics);
- the Brevo, CRM and Discord edge-function triggers fail;
- this may happen in the middle of the rollback window.

Nothing ties this key migration to the auth cutover.
- **Evidence:** - ssr-session-research.md §2.2: legacy keys "deprecat[ed] by the end of 2026".
- Binding §4: "legacy keys end in late 2026".
- remote_schema.sql:55-91: Vault `service_role_key` sent as a Bearer token.
- backend/src/lib/supabase.ts:4-8.
- **Fix:** - **Move the migration to Phase 0**, with no auth dependency:
  1. Create the `worker` sb_secret_ key.
  2. Switch the worker env.
  3. Download the edge functions, then set `verify_jwt=false` plus an `apikey` check.
  4. Replace the Vault secret and parameterise the edge-function base URL.
- **Record the exact legacy-key shutdown date** from the dashboard in the T-14 go/no-go, with a hard rule that T+30 must fall before it.
- **Keep only the "disable legacy keys / revoke legacy JWT secret" step for Phase 5.**

### [medium] Server-side verify/exchange/refresh from Vercel IPs hits per-IP limits that cannot be raised; tokens expire together at T+1h

- **Where:** identity-cutover.md D6 line 29, A7 line 50, §6.5 lines 919-932, §7.4 flow lines 1082-1093
- **Problem:** D6 moves credential calls to the browser, but these still run server-side from Vercel egress IPs:
- D7's interstitial `verifyOtp` (the reset wave at cutover);
- the OAuth `exchangeCodeForSession`;
- middleware and server-action refreshes.

Supabase docs list `/auth/v1/verify` at 360/h per IP (burst 30) and token refresh at 1800/h per IP (burst 30), both **not customizable**. So the plan's cutover-week step "raise `rate_limit_verify` / `rate_limit_token_refresh`" will not help.

Everyone signs in during the same ~1-2h window at T-0, so the 3600s access tokens expire together around T+1h. Users who return through `/admin` navigations then refresh from Vercel IPs all at once.

The forwarded-IP contingency needs code, a deploy and a config change. That is exactly when the Hobby rollback limits hurt.
- **Evidence:** - Supabase rate-limits doc (docs search 2026-09-17): "Verification requests /auth/v1/verify IP Address Customizable No", "Token refresh requests /auth/v1/token IP Address No"; IP forwarding requires a secret key.
- identity-cutover.md:925-927 plans to raise these limits.
- **Fix:** - **Build the forwarded-IP auth client in Phase 2**, not as a contingency: an auth-only `sb_secret_` client with `sb-forwarded-for` from `x-forwarded-for`, used for `/auth/callback`, the confirm action and the middleware refresh. Enable `security_sb_forwarded_for_enabled` on TEST and PROD before T-14, and load-test on TEST: 60 verifies in 1 minute from one deployment.
- **Drop the rate-limit raise step.**
- **Add a monitoring row for 429s on `/token` around T+1h.**

### [medium] Re-key lock upgrade to ACCESS EXCLUSIVE can deadlock with Paddle webhooks and roll back the cutover

- **Where:** identity-cutover.md §4.3 lines 392, 418-419, 478-479; middleware matcher line 902 (api/paddle excluded from maintenance); §10.4 line 1575
- **Problem:** The script takes SHARE ROW EXCLUSIVE on `users` and six children at step 1. It then runs `ALTER TABLE users ADD CONSTRAINT ... NOT VALID`, which needs ACCESS EXCLUSIVE.

Paddle webhooks are not blocked by maintenance. A webhook `asAdmin` transaction that has already read `users` holds ACCESS SHARE while it waits for ROW EXCLUSIVE.
1. The re-key waits on the webhook, and the webhook waits on the re-key.
2. The re-key is the later waiter, so its deadlock check finds the cycle and it is the transaction that aborts (or it hits `lock_timeout=10s`).
3. The whole re-key rolls back.

An operator's idle-in-transaction psql or Studio session on `users` has the same effect. §10.4 calls webhook contention harmless.
- **Evidence:** - :418-419 `lock table ... in share row exclusive mode`
- :478 `alter table public.users add constraint ... not valid` (ADD CHECK needs ACCESS EXCLUSIVE; only FK adds take SHARE ROW EXCLUSIVE, per the PG ALTER TABLE docs)
- :902 matcher excludes `api/paddle`
- :1575 "Webhooks that hit users locks time out ... No action needed"
- **Fix:** - **Take the strongest lock up front.** Run `lock table public.users in access exclusive mode` (with `nowait` in a short retry loop) before the children, then add the NOT VALID CHECK right after locking and before the UPDATE.
- **Block Paddle during maintenance.** Have `/api/paddle` return 503 when `MAINTENANCE_MODE=1` so Paddle retries after the window.
- **Clear stray sessions.** Add a preflight step that lists `pg_stat_activity` idle-in-transaction sessions and terminates them.
- **Document retry.** If the re-key raises a lock or deadlock error, retry once.

### [medium] Rollback pushes unconfirmed Supabase sign-ups into Clerk and revives accounts deleted during the window

- **Where:** identity-cutover.md §9.4 steps 4-5 lines 1501-1512; §8.6 lines 1353-1366
- **Problem:** Step 4 lists every `auth.users` row outside the map, including users who never confirmed their email. Step 5 calls Clerk `createUser({ emailAddress: [email], passwordDigest })`. Clerk's backend API likely marks those addresses verified (unverified).

An attacker who signs up on Supabase with a victim's email during the window therefore gets a verified Clerk account with a password they know. When the real owner later uses Google on Clerk, email linking can hand the attacker access (pre-account takeover).

The reverse gap: migrated users who deleted their account on Supabase during the window (Paddle cancelled, rows cascaded) still exist in Clerk. After rollback they can sign in, and `ensureUserRow` creates a fresh row. That undoes an erasure request.
- **Evidence:** - :1503-1506: the query has no `email_confirmed_at` filter.
- :1509: `clerk.users.createUser({ emailAddress: [email], ... passwordDigest })`
- identity-migration-research.md §3.1: linking by verified email.
- **Fix:** - **Push only confirmed users:** `where email_confirmed_at is not null` (and not banned). Drop unconfirmed sign-ups and email them.
- **Record deletions.** Have `handle_auth_user_deleted` (or `actions/account.ts`) insert into `migration.deleted_during_window(supabase_user_id, clerk_user_id, at)`.
- **Delete those Clerk users** (`clerk.users.deleteUser`) in rollback R1/R2 before re-enabling the Clerk webhook.

### [medium] Re-cutover after an R1/R2 rollback is blocked: rollback_clerk_ids is never merged into the map

- **Where:** identity-cutover.md §4.3 preconditions lines 405-407; §4.6 lines 540-577; §9.4 step 5 line 1510; §3.4 item 2 line 266
- **Problem:** After rollback, Supabase-only users hold new Clerk ids that are recorded only in `migration.rollback_clerk_ids`, while their `auth.users` rows stay.

On the next cutover attempt:
- The re-key precondition "auth.users has users outside the map" raises.
- The delta import claims a **new** uuid for their new Clerk id, so `createUser` returns `email_exists` and the user becomes a conflict.

The plan says keeping `auth.users` "makes a retry cheap", but for these users the retry fails.

The TEST drill ("R1, then cut over again") will not catch this unless a Supabase-only sign-up happens between cutover and rollback.
- **Evidence:** - :405-407 raises on auth users outside `clerk_user_map`.
- :1510 `insert into migration.rollback_clerk_ids`
- :575 "keeping them makes a retry cheap"
- `claimUuid` keys on `clerk_user_id` (:681).
- **Fix:** - **Write pushed users into the main map.** The push script inserts `migration.clerk_user_map(clerk_user_id=<new Clerk id>, supabase_user_id=<existing uuid>, status='migrated', password_imported=true)`, drops the separate table, and the rollback-remap uses the map alone.
- **Exercise it in the TEST drill.** Between cutover and R1, run a Supabase-only sign-up, a password change, an account deletion and a Paddle sandbox checkout, then re-cut over and verify V1-V12.

### [medium] Hobby rollback mechanics: one-deployment Instant Rollback breaks after any hotfix; redeploys sit on the critical path

- **Where:** identity-cutover.md §9.4 R1 step 1 line 1498, step 9 line 1519; rollback triggers line 1485; §3.3 flags lines 199-202
- **Problem:** R1 step 1 relies on Instant Rollback to D-supa-maint. On Hobby only the immediately previous production deployment is available.

The rollback triggers invite hotfixes ("fix trigger within 30 minutes"). Any hotfix deploy after D-supa makes the previous deployment D-supa, which has maintenance off. The rollback then lands on a live Supabase build with no write freeze.

Whether production domain auto-assignment is suspended after an Instant Rollback, which would make step 9's redeploy not serve traffic, is unverified.

Every flag flip is a full Next build of several minutes, and `instrumentation.ts` throwing on a flag mismatch turns an env typo into a total outage.
- **Evidence:** - Vercel docs (search 2026-09-17): "Rollback a project to a specific older deployment ... available for Pro or Enterprise plans".
- identity-cutover.md:1485 hotfix window.
- :200 `instrumentation.ts throws at boot if they differ`.
- **Fix:** - **Make the switches runtime-readable.** Read `MAINTENANCE_MODE` and `AUTH_PROVIDER` from Vercel Edge Config (read by middleware and server) and pass the provider to the client as a server-rendered prop instead of `NEXT_PUBLIC_AUTH_PROVIDER`. Flips then need no redeploy.
- **Freeze deploys from T-0 to T+72h** unless the operator has re-checked the rollback target.
- **Rehearse on TEST.** Do an Instant Rollback followed by a redeploy, and confirm the domain assignment.
- **Replace the `instrumentation.ts` throw** with Sentry fatal plus the maintenance response.

### [medium] Monitoring and rollback triggers depend on manual log reading, short Hobby log retention and a threshold with no baseline

- **Where:** identity-cutover.md §9.2 monitoring lines 1436-1455; rollback triggers lines 1483-1488
- **Problem:** All signals are read by hand: every 15 minutes, then hourly, from Vercel runtime logs and the Supabase `auth_logs` explorer. Vercel Hobby keeps runtime logs only briefly (1 hour is typical; unverified), so the hourly checks between T+4h and T+24h see little. There are no alert rules.

The primary rollback trigger (">5% of imported-user password sign-ins fail with `invalid_credentials`") has no Clerk baseline. Typos plus password managers that saved credentials for the Clerk Account Portal host will not autofill on `www/auth`, so the threshold can fire falsely, or be ignored.
- **Evidence:** - :1437-1439 manual cadence
- :1443 `joined mentally with needs-reset.csv`
- :1484 >5% trigger
- auth-surface.md §1: signed-out users are redirected to the Clerk Account Portal.
- **Fix:** - **Emit tagged Sentry events with alert rules** from the auth UI and server: `auth.signin_failed{imported:true, reason}`, `db.23514`, `db.23503`, `trigger.signup_failed`.
- **Watch DB signals.** Run a scheduled read-only SQL check every 5 minutes (V3 row integrity, adoption).
- **Replace the % trigger with deterministic gates.** Use V12 (digest equality for 100% of imported users) before opening, plus canary accounts per strategy (password, Google, reset) re-tested at T+15m, T+1h (token expiry wave) and T+4h.
- **Set `autocomplete="username"` and `autocomplete="current-password"`** on the forms.

### [medium] M2 on PROD in Phase 0 comes before the edge functions, view consumers and migration history are inspected

- **Where:** identity-cutover.md A6 line 49, §3.1 steps 5-6 lines 137-138, exit line 147; §10.5 line 1582 (T-14); §12 #9 line 1645 (by T-14)
- **Problem:** M2 revokes everything from `anon`/`authenticated` and enables RLS on PROD in Phase 0. Several things it could break or miss are only looked at later.

Unknown consumers:
- The PROD edge functions (`create-brevo-contact`, `create-crm-contact`, `sync-available-plans`, `discord-subscription-alert`) and any consumer of the `contacts` / `active_subscriptions` views are inspected only at T-14. Any of them using the anon key breaks silently.
- The PROD Vercel `DB_CONNECTION_STRING` role is assumed to be `postgres` (BYPASSRLS) but was never checked.

Migration history:
- `main` has no `supabase/migrations`, so how migrations reach PROD is unspecified. `supabase db push` would try to apply the baseline dump again unless the history is repaired.

Default privileges:
- If the lockdown migration never ran on PROD, the `postgres` default ACL in `public` still grants anon/authenticated ALL on new tables and functions, and M2 does not revoke default privileges.
- On TEST, `pg_default_acl` shows lockdown removed them for `postgres` but `supabase_admin` still grants them.

Exit gate:
- "Advisor 0013 cleared" cannot pass, because `prompts`, `ocr`, `qr_configs`, `user_themes`, `product_newsletter` and `plans` get RLS only in M1 §12 (Phase 1).
- **Evidence:** - `git ls-tree -r main -- supabase` → only `supabase/config.toml`.
- TEST `pg_default_acl`: postgres/public tables `{postgres,service_role}`; supabase_admin/public still grants anon/authenticated `arwdDxtm`.
- Binding M2 SQL has no `alter default privileges`.
- rls.sql:133 only revokes function EXECUTE from PUBLIC.
- **Fix:** Before M2 on PROD:
- Download the edge functions and grep them for the anon key or `SUPABASE_ANON_KEY`.
- Identify the consumers of the two views.
- Check `select rolbypassrls from pg_roles where rolname = <PROD DB_CONNECTION_STRING user>`.
- Run `supabase migration list --linked` and `supabase db diff --linked` against PROD, then `supabase migration repair --status applied` for the 4 baseline versions only if the schema matches.
- Add `alter default privileges for role postgres in schema public revoke all on tables, sequences, functions from anon, authenticated;` to M2.
- Move M1 §12's six `enable row level security` statements into M2.

### [medium] Maintenance mode fails open, sign-ups open before the smoke tests, and builder edits are lost silently

- **Where:** identity-cutover.md §6.4 lines 888-892; §9.2 steps 2 and 10-13 lines 1418, 1426-1429; §6.10 line 1006; instrumentation-client.ts:47
- **Problem:** Bypass fails open:
- The bypass check is `cookie !== process.env.MAINTENANCE_BYPASS_TOKEN`. With the token env var unset, a visitor without the cookie compares `undefined !== undefined`, so everyone bypasses.
- Step 2 only mentions setting `MAINTENANCE_MODE=1`.

Sign-ups open too early:
- Step 10 opens Supabase sign-ups before the provider flip and before go/no-go #3.
- Browser clients and scripts can call GoTrue directly with the public key during maintenance.
- A failed #3 then needs Supabase-only users pushed to Clerk.

Builder edits are lost:
- Server actions get a plain-text 503. Next's client then throws "An unexpected response was received from the server.", which `instrumentation-client.ts` already puts in `ignoreErrors`.
- In-memory builder edits and autosaves fail invisibly, and after cutover every action returns 401.
- The claim that "unsaved builder drafts survive" only covers what was already saved to Redis.
- **Evidence:** - :889: `req.cookies.get("qt-maint-bypass")?.value !== process.env.MAINTENANCE_BYPASS_TOKEN`
- :1426 step 10 comes before :1427 step 11.
- instrumentation-client.ts:47 ignores the exact error.
- **Fix:** - **Fail closed on the bypass:** `const t = process.env.MAINTENANCE_BYPASS_TOKEN; const bypass = !!t && t.length >= 32 && cookie === t;`, with a unit test for the unset case.
- **Move step 10 after step 12 passes**, immediately before step 13.
- **Warn users 30 minutes ahead** with a `NEXT_PUBLIC` banner.
- **Protect builder state.** Wrap builder server-action calls so that a non-OK or unexpected response writes state to `localStorage` and shows a "saved locally, sign in again to sync" notice.
- **Stop hiding the error.** Temporarily remove that `ignoreErrors` entry, or tag it.

### [medium] Open redirect in browser-side post-sign-in 'next' handling

- **Where:** identity-cutover.md D6 line 29, §7.4 line 1093, §11 safeNext test line 1626; ssr-session-research.md §3.2 (safeNext is `import "server-only"`)
- **Problem:** D6 moves sign-in to the browser, so the redirect to `next` after `signInWithPassword` happens client-side (`router.push` or `location.assign`). But `safeNext` is specified as server-only, and it only checks `startsWith('/')`, `//` and `/\`.

The WHATWG URL parser strips tab, CR and LF. So `next=/%09/evil.com` decodes to `/\t/evil.com`, which passes those checks and navigates to `//evil.com`.

On the server this is safe, because the redirect prefixes the origin. On the client it is not.
- **Evidence:** - ssr-session-research.md:295-298 safeNext implementation
- identity-cutover.md:1626 test cases list only `//evil.com`, `/\evil.com` and absolute URLs
- :29 browser sign-in
- **Fix:** - **Use one isomorphic `safeNext`:** `const u = new URL(raw, origin); if (u.origin !== origin) return fallback; return u.pathname + u.search + u.hash;`. Also reject any control characters or backslashes in the raw value.
- **Use it in both places:** the browser form redirect and the middleware or route handlers.
- **Add tests** for `/\t/evil.com`, `/%09/evil.com`, `/%5Cevil.com`, `\/evil.com` and `javascript:`.

### [medium] MFA users are silently downgraded to password-only at cutover

- **Where:** identity-cutover.md §5.4 line 760; §6.10 lines 1008, 1012; §12 #20
- **Problem:** TOTP, backup-code and SMS second factors cannot be imported. The plan still imports these users' bcrypt hash and lets them sign in without a second factor "until TOTP is built".

Those users are exactly the ones who judged their account worth protecting. Anyone holding their leaked or reused password gets in after cutover.

The T-7 email also announces publicly that 2FA will be unavailable.
- **Evidence:** - :760: `mfa_enabled=true in map; mfa-users.csv. Build Supabase TOTP enrol/verify only if count > 0`
- :1008: `MFA users sign in without a second factor until TOTP is built`
- **Fix:** - **If the count is greater than 0, do one of the following:**
  - build Supabase TOTP enrolment and challenge before T-0, and require enrolment on first sign-in; or
  - import MFA users **without** `password_hash`, so they must reset by email (which proves the mailbox) or use Google.
- **Change the T-7 email wording** so it does not advertise the gap.

### [medium] TEST's always-pass captcha plus shared email quota lets TEST abuse block PROD auth email; link tracking can corrupt links

- **Where:** identity-cutover.md §7.1 lines 1037-1041; §6.10 line 1011; §7.3
- **Problem:** Once TEST opens sign-ups, `test.quicktalog.app` is public with Cloudflare's always-pass Turnstile secret. Bots can then create TEST accounts that send confirmation email through Resend (30/h cap on TEST).

The TEST and PROD Resend API keys belong to the same Resend account, so account quotas are shared. On a free Resend plan (100/day; unverified which plan is in use), TEST abuse or the T-7 all-user announcement sent through Resend can exhaust the quota and block PROD reset and confirmation emails on cutover day.

Supabase docs also warn that link tracking rewrites auth links; the plan never disables Resend click tracking.
- **Evidence:** - :1041: `Turnstile with Cloudflare's always-pass test secret`
- :1037: same Resend provider for both environments
- :1011: T-7 blast "sent through Resend"
- Supabase going-into-prod doc: "disable link tracking when using a custom SMTP service"
- **Fix:** - **Use a real Turnstile widget on `test.quicktalog.app`.** For Playwright, create sessions with `admin.generateLink` plus `verifyOtp` (`/verify` is not captcha-gated), or keep an always-pass key only on local stacks.
- **Separate Resend quotas** (a separate account or provider for TEST), confirm the PROD plan quota covers ≥ 2× the user count on cutover day, and send the T-7 blast through Brevo or throttle it.
- **Disable Resend open and click tracking** for `auth.quicktalog.app`.

### [medium] The NOT VALID uuid CHECK makes accepted legacy rows un-updatable, including paying customers

- **Where:** identity-cutover.md A2 line 45, §4.3 lines 478-479, §4.5 lines 532-538, V7 line 526
- **Problem:** A NOT VALID CHECK is still evaluated on every UPDATE of any row, not only when `id` changes.

Legacy rows stay until T+30 (orphans, conflicts, skipped users). Any Paddle webhook updating `plan_id` or `customer_id` on those rows fails with 23514, so billing state goes stale. Under the rethrow design, Paddle retries until it gives up.

V7 (`image ilike '%clerk.com%'` = 0) also fails whenever an orphan keeps a Clerk avatar, which causes a false no-go at step 9.
- **Evidence:** - :478-479 NOT VALID CHECK
- :538 keep legacy rows until T+30
- app-changes.md:572: webhook errors now rethrow
- :526 V7 expects 0
- **Fix:** - **Go/no-go:** zero unmapped `public.users` rows with `customer_id is not null` or active subscriptions. Resolve those users manually before T-0.
- **Or allowlist legacy ids in the CHECK:** `check (id ~ uuid_re or private.is_legacy_user_id(id))`, backed by a `migration.legacy_user_ids` table.
- **Scope V7 and V5** to mapped users only.

### [low] Login CSRF through the /auth/confirm interstitial

- **Where:** identity-cutover.md §7.4 lines 1082-1093
- **Problem:** An attacker can generate a sign-up, recovery or magic-link email for their **own** account and send the victim `https://www.quicktalog.app/auth/confirm?token_hash=<attacker>&type=email`.

The first-party "Confirm and continue" page makes this look legitimate. One click signs the victim into the attacker's account, replacing any existing session. The victim may then build catalogues or pay through Paddle into the attacker's account.
- **Evidence:** - :1085 sets the cookie from any `token_hash`
- :1087 generic confirm button
- :1090 `verifyOtp` replaces the session
- **Fix:** - **If the browser already has a session,** refuse to verify and ask the user to sign out first.
- **After verify, show the account email before continuing,** and require re-typing the email for `type=email` or magic links (or require that the flow was started in this browser via a short-lived "pending sign-up" cookie set at `signUp`).
- **Rate-limit confirm by IP.**

### [low] Clerk cookie expiry misses eTLD+1 cookies, can sign PROD out from TEST, and contradicts the 'no Set-Cookie on public pages' rule

- **Where:** identity-cutover.md §6.2 lines 847-851; §6.4 line 897; §6.6 point 3 line 938; §11 middleware test line 1625
- **Problem:** **Missed cookies.** clerk-js sets `__client_uat` with `Domain=<eTLD+1>` (unverified; clerk-js is loaded from a CDN and not installed). A host-only `Max-Age=0` does not delete it.

**Cross-environment sign-outs.** If the fix adds `Domain=quicktalog.app`, then a visit to `test.quicktalog.app` after the TEST cutover would also delete PROD's unsuffixed Clerk cookies, because the two share an eTLD+1.

**Contradiction.** `expireClerkCookies` runs for every matched path, including public ISR pages and `/api/items`. That breaks the plan's own invariant and unit test ("Public page: no Set-Cookie"). It also stops the CDN caching responses for visitors who still carry Clerk cookies.
- **Evidence:** - :897 `expireClerkCookies(req, res)` runs unconditionally.
- :938 and :1625 assert no Set-Cookie.
- node_modules/@clerk has no clerk-js to confirm the domain behaviour.
- **Fix:** - **Expire only cookies that are present,** and only on NEEDS_SESSION paths.
- **Emit both host-only and `Domain=quicktalog.app` deletions on PROD only**, for unsuffixed and PROD-suffixed names. On TEST, delete only TEST-suffixed names.
- **Update the test.**
- **Verify on TEST** with devtools before cutover.

### [low] Avatar replacement probably copies another Clerk-hosted URL

- **Where:** identity-cutover.md §5.3 line 691, §5.5 line 774, V7 line 526, M4 regex line 1231
- **Problem:** The import takes `externalAccounts[].imageUrl` as the "Google picture URL". The installed `@clerk/backend` ExternalAccount type exposes only `image_url` and no raw provider `avatar_url`. Clerk's `image_url` values are `img.clerk.com` proxies; TEST `users.image` values are proxies of `images.clerk.dev/oauth_google`.

If so, the re-key writes Clerk URLs again:
- V7 fails at go/no-go #2;
- avatars die at T+30.

Imported Google users never get a Google avatar later either, because M4 writes `image` only at INSERT.
- **Evidence:** - node_modules/@clerk/backend/dist/api/resources/JSON.d.ts:167-182: `ExternalAccountJSON` has `image_url?` only.
- auth-surface.md §1: TEST images are `img.clerk.com` proxies.
- **Fix:** - **At the re-key, set `image` to null** whenever the chosen URL is not `^https://lh[0-9]+\.googleusercontent\.com/`.
- **Fill it on first Google sign-in** from `raw_user_meta_data.avatar_url`, applying the same regex. Do this either in `/auth/callback` through `withUser`, or with an `after update of raw_user_meta_data` trigger that only sets `image` when it is null.
- **Make V7 check** for no `img.clerk.com` among mapped users.

### [low] Imported unconfirmed-email accounts, with their data and billing, can be claimed by whoever controls that Google account

- **Where:** identity-cutover.md §5.4 line 756
- **Problem:** Users whose Clerk primary email is unverified are imported with `email_confirm:false`. The re-key then attaches their catalogues, plan and `customer_id` to that uuid.

On a later Google sign-in with that email, GoTrue runs RemoveUnconfirmedIdentities: it confirms the user, wipes the password and deletes other identities. The Google account owner takes over the migrated data.

The plan calls this "acceptable: none imported", but the data is attached.
- **Evidence:** - identity-migration-research.md §3.1 step 5 (external.go:411-428)
- :756
- **Fix:** - **Skip unverified users who own data.** Mark users without a verified email who own catalogues or have a `customer_id` as `skipped`, and resolve them through support.
- **Or have them verify first:** ask them to verify the email in Clerk before T-3.

### [low] Clerk DNS removal comes after instance deletion; sibling subdomains can toss session cookies

- **Where:** identity-cutover.md §3.6 line 313; §10.6 line 1594
- **Problem:** The T+30 order is: delete the Clerk instances, then remove the DNS records. That leaves `clerk.quicktalog.app` (and any `clkmail` / `clk._domainkey` records) pointing at Clerk with no owning instance, which is a subdomain-takeover window (unverified for Clerk).

A takeover lets the attacker:
- set `Domain=quicktalog.app` cookies (cookie tossing a `sb-...-auth-token` for login CSRF on `www`);
- send mail as the domain.

`test.quicktalog.app` running preview-grade code has the same cookie-tossing reach.
- **Evidence:** - :313: "Delete the Clerk production and development instances, then remove the Clerk DNS records"
- **Fix:** - **Remove the Clerk CNAMEs and DKIM records first**, once no rollback is possible, then delete the instances.
- **Harden the middleware** to reject requests carrying duplicate `sb-<ref>-auth-token` cookies (for example one with a Domain attribute) by clearing them.

### [low] Clerk-mode CI coverage is removed at the TEST cutover while PROD and the rollback still depend on it

- **Where:** identity-cutover.md §7.10 line 1168; §3.4 item 2 line 267
- **Problem:** The Clerk secrets are removed from the GitHub TEST environment, and TEST flips to Supabase at T-10.

From then until R2 closes (about T+7), PROD runs the Clerk branch, and R1/R2 roll back onto it. But no e2e run exercises the Clerk path against Phase 1/2 code, and any hotfix merged to `main` in that period is untested on Clerk.
- **Evidence:** - :1168: `remove at TEST cutover (ci.yaml:45-48)`
- **Fix:** - **Keep a Clerk-mode e2e job until R2 closes.** Run it against the local stack with `AUTH_PROVIDER=clerk` and the Clerk dev instance.
- **Re-run R1 on TEST (or a local rehearsal)** within 48h before T-0.

### [low] Legacy all-true consents keep being exported as real consent

- **Where:** identity-cutover.md §5.7 lines 789-795; supabase/migrations/20260911213819_remote_schema.sql:185
- **Problem:** Existing rows keep `{terms, privacy, refund: true}` from the column default. Nobody gave that consent in the DB. The `contacts` view and the Brevo trigger payload (`to_jsonb(NEW)`) still export these booleans to the CRM and marketing after M4, and re-key step 5 fires more payloads later.

The gate only records new acceptance.
- **Evidence:** - remote_schema.sql:185 default all-true
- :793 legacy booleans kept and read by `contacts`
- **Fix:** - **Mark legacy rows in M4:** `update public.users set consents = consents || '{"source":"legacy_default"}' where consents ? 'version' is false`.
- **Treat `legacy_default` as unknown** in the `contacts` view and the edge-function payload.
- **Get the legal decision (§12 #11) before the T-7 email.**

