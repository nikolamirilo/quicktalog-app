# Completeness review of the design drafts

> Review of the earlier design drafts (2026-09-16). Every critical and high finding is resolved in `../PLAN.md` (see its Appendix D.4). Section and line references point at those drafts, which are not included.


## Summary

## Completeness review: rls.sql, rls-design.md, identity-cutover.md, app-changes.md

I read all four artifacts, the digest and the phase-1 reports in full, plus pglite-results.md and both review outputs. I also checked the repo and ran two read-only SELECTs on TEST. Nothing was written to any repo.

**Covered well**
- **Call sites:** all 76 DB call sites in `data-access.md` are mapped twice, in rls-design §4 and app-changes §7. The digest's figure of 68 is stale.
- **Clerk touchpoints:** every one listed in `auth-surface.md` is in app-changes §8.
- **Security issues:** every digest issue in groups 1, 2, 4 and 6 has an owner.
- **AI quota:** all six defects are addressed. Forged continuations and uncapped refunds are only partly closed; the red team already reported both.
- **User asks 1 and 2:** covered in depth.

**What is still missing or broken**
1. **Verification results are not folded back in.** `rls.sql`, `rls-design.md` and decision §5.3 are still the unpatched versions. As written, a user can read other users' data while Phase 1-2 code is live, and the cutover aborts. The wrapper also still lacks the `search_path` fix.
2. **Early M2 cannot run as written.** identity-cutover and app-changes both apply "M2 = rls.sql 06" before M1. But 06 needs objects that only 01 and 03 create. PGlite patch P1 would also leave permanent allow-all anon policies behind if 06 runs first.
3. **No check of PROD for past abuse of the open anon grants.** Self-upgraded plans, forged subscriptions and analytics, and moved catalogues would all survive M2. Nobody assesses whether exposed subscriber emails need a GDPR notification, and nobody checks the API logs for other anon callers.
4. **Two cutover runbooks and two M4 designs disagree in ways that break execution.**
   - Map columns, status values and trigger names differ between the documents.
   - app-changes has no maintenance-mode middleware and no `JOBS_PAUSED` switch, which identity-cutover's runbook relies on.
5. **An unauthenticated worker route can delete images.** The plan points the test worker at the TEST database while app-changes leaves the worker's HTTP routes unprotected. Whether the UploadThing token is shared with PROD was never asked. If it is, one request could delete PROD images.
6. **Findings from verification missing from every artifact:**
   - pg_net is open to PUBLIC. TEST confirms `net.http_request_queue =arwdDxtm`, and queued requests carry the Vault service_role key.
   - Any role can create temp tables (TEST `datacl =Tc/postgres`), which lets one tenant hijack another's queries on a shared pooled connection.
7. **Smaller contradictions:**
   - **Consent gate:** app_user cannot read `private.settings`, and the terms version has two sources of truth.
   - **Map retention:** rls.sql 10 drops the migration schema, while identity-cutover keeps the map forever for Paddle.
   - **Paddle linking:** three different designs, and app-changes ships one in P0 before anyone checks that subscription events carry `customData`.
   - **Middleware:** app-changes refreshes sessions on public ISR pages; identity-cutover forbids that.
   - **Redirect allow-list:** app-changes uses a Vercel preview glob that identity-cutover rejects as insecure.
   - **Phase 2 rollback:** it drops `auth.users` triggers, which postgres is not allowed to do.
   - **Phase numbering:** three different schemes across the documents.
8. **Unverified or disproven claims still stated as fact.**
9. **Test gaps:**
   - no test applies the migrations in the chosen order;
   - nothing tests the pg_net or temp-table exposure;
   - no connection-budget test for app_rls;
   - no agent e2e;
   - no fallback if CI cannot replay the migrations.
10. **Phase-1 questions never carried into any artifact:**
    - the `ai_credits` roadmap, whose client-minted turnId conflicts with DB-side metering;
    - OCR metering (`ocr_ai_import`);
    - D1 logs PII;
    - a unique index on `users.email`;
    - a PROD scan for Clerk ids inside jsonb columns.
11. **User ask 3:** the correction to the ORM / supabase-js / hybrid framing exists only in the decision text, not in any artifact.

**TEST evidence gathered here (read-only):**
- The abuse-check queries run and return clean on TEST: 0 paid plans without an active subscription, 0 orphan subscriptions, 0 newsletter owner mismatches, 0 orphan analytics rows.
- `net.http_request_queue` and `net._http_response` grant ALL to PUBLIC; the database grants TEMP to PUBLIC.
- The worker cleanup route is HTTP-only with CORS * and no auth (`../quicktalog-backend/src/index.ts:17-26`), and is not run by the cron.

Relevant files:
- draft `rls.sql`
- draft `rls-design.md`
- draft `identity-cutover.md`
- draft `app-changes.md`
- pglite-results.md
- pglite-harness (first run) rls.patched.sql

## Findings

### [high] Verified fixes (PGlite P1-P5, wrapper search_path, pgTAP 50 fixture, size audit) are not propagated into the deliverable artifacts

- **Where:** rls.sql:78-84, :109-111, :486-490, :921-926, :1059-1061, :1211-1213, :311; rls-design.md:54, :338-342, :900, :994; app-changes.md:749 ('decision §5.3 verbatim'); decision §5.3
- **Problem:** The executable artifacts still contain defects that verification proved and patched only in the harness copy (pglite-harness/rls.patched.sql):
- **Cross-tenant window:** policies on users/catalogues/analytics/newsletter stay inert until 06 while withUser code is live (F2: A read and deleted B's catalogues and read B's subscribers).
- **Imported-user skip:** it never matches, so the RUNBOOK aborts (F1).
- **01 GRANT fallback:** it fails with a bare 42501 (F6).
- **Object ownership:** private objects are owned by whoever applies the migration (F7).
- **Temp-table shadowing:** the TS wrapper has no search_path fix (F3).
- **pgTAP 50:** it asserts the skip with a direct INSERT that GoTrue never performs.
- **Size audit:** `max(pg_column_size(content))` under-reports (F8).

rls-design.md:54 still says the SQL was never executed, and :994 still calls the size CHECK 'slightly lenient', although verification showed that any content edit on a large legacy row fails. A developer following app-changes ('decision §5.3 verbatim') ships the unpatched wrapper.
- **Evidence:** - pglite-results.md:23-30: rls.sql as written fails 19/475 scenarios, the patched file 4/475.
- pglite-results.md:55-146: F1-F8 with fixes.
- rls.sql:1059 still `if coalesce(new.raw_app_meta_data,'{}') ? 'clerk_user_id'`.
- rls-design.md:337-342: set_config statement without search_path.
- **Fix:** - Regenerate rls.sql from rls.patched.sql (P1-P5).
- Add `pg_catalog.set_config('search_path','public, pg_temp', true)` to inRole in decision §5.3, rls-design §5.3 and app-changes §2.2.
- Add `alter role app_rls set search_path = public, pg_temp` to 07.
- Change the pgTAP 50 fixture to INSERT, then UPDATE raw_app_meta_data, with a pre-claimed map row.
- Replace the audit query at rls.sql:311 with `max(octet_length(content::text))`.
- Correct the claims at rls.sql:78-84 and rls-design §1.1/§10.10.
- Add a CI step that runs the harness (`pglite-harness/run-all.sh`) or the equivalent pgTAP against the exact files that will be applied.

### [high] Early M2 (Phase 0 / end of P0) is not executable with rls.sql 06, and conflicts with PGlite P1

- **Where:** identity-cutover.md:34 (D11), :49 (A6), :137-138; app-changes.md:47, :711-721; rls.sql:906-951 (06), :937, :945-948; pglite-results.md:81-85 (P1)
- **Problem:** identity-cutover and app-changes both apply 'M2 (draft `rls.sql` migration 06)' before M1 (01-05). As written, 06 depends on M1 objects:
- `revoke all on schema private from anon, authenticated` fails with 3F000 when 01 has not run.
- `alter table … validate constraint catalogues_content_size` (and the other three) fails with 42704 when 03 has not run.

The transaction rolls back, so the most severe hole (anon DML) stays open.

PGlite P1 also moves 'RLS on + temporary legacy_anon_* policies (for all to anon using (true))' into 04 and drops them in 06. If 06 runs first (the early-M2 order), 04 later recreates those allow-all anon policies and nothing ever drops them. That leaves a latent full-access policy that any future anon grant would activate, for example an object created in public by supabase_admin, whose default ACL grants anon ALL (rls-design.md:947).

The decision (§14 Phase 3), rls.sql (header :20-21) and the two plans disagree on when M2 lands, and no SQL exists for the order two of them choose.
- **Evidence:** - rls.sql:937 `revoke all on schema private from anon, authenticated;`
- rls.sql:945 `alter table public.catalogues validate constraint catalogues_content_size;` (constraint created only at rls.sql:329).
- identity-cutover.md:137: 'M2 close_data_api on TEST after 3 and 4 have run'.
- app-changes.md:716: 'the DB plan may apply M2 (draft `rls.sql` migration 06)'.
- **Fix:** - Split 06 into two migrations:
  - **06a close_data_api:** enable RLS on the 12 tables, `revoke all … from anon, authenticated` on tables, sequences and functions in public, `drop function get_pageview_totals`, `notify pgrst`. It must have no dependency on private or 03.
  - **06b validate_size_checks:** apply after the PROD octet_length audit.
- Make P1's legacy anon policies conditional: create them only `if has_table_privilege('anon','public.users','SELECT')`, and have 04 drop any `legacy_anon_*` policy when anon holds no grants.
- Fix one order in all four documents and in decision §14.
- Add a CI job that applies migrations in that exact order on a fresh stack.

### [high] No PROD audit for past exploitation of the open anon grants, and no breach assessment

- **Where:** All four artifacts (no forensic or audit step; grep for audit, tamper and log-review terms is empty); identity-cutover.md §3.1 Phase 0; rls-design.md §11; data-access.md:130-134, :155; public-and-system-surfaces.md:116
- **Problem:** Today the publishable key allows the following, and the key existed in a browser client in git history:
- self-upgrading users.plan_id;
- id-swap takeovers and cascade deletes;
- reassigning or defacing catalogues;
- forging subscriptions (which fire CRM and Discord edge functions);
- forging analytics (which make the worker deactivate a victim's catalogues, and after P1 would block the victim via my_usage/assertCanActivate);
- dumping every end-customer subscriber email.

The plans close the hole (M2) but never check whether it was used:
- No step reconciles plan_id against Paddle.
- No step finds forged subscriptions, analytics or newsletter rows.
- No step reviews Supabase API/edge logs for anon non-GET `/rest/v1` traffic or unknown anon consumers (phase-1 open question at data-access.md:155).
- No step makes the legal decision on GDPR Art. 33/34 notification for exposed subscriber emails.

Tampered state survives M2 and M1 unchanged, because asAdmin and the worker bypass RLS.
- **Evidence:** - TEST read-only audit queries (run 2026-09-17) all return 0: paid_plan_without_active_sub=0, orphan_subscriptions=0, newsletter_owner_mismatch=0, analytics_for_users_without_catalogues=0. The checks are cheap and read-only; PROD was never checked.
- data-access.md:130-134 lists the exploits.
- **Fix:** Add a Phase 0 'exposure audit' gate, run by the user read-only on PROD before and right after M2:
1. Users whose plan_id is not Starter and who have no active subscription for their customer_id (then reconcile with the Paddle API).
2. Subscriptions whose subscription_id is unknown to Paddle.
3. Newsletter rows with owner_id ≠ catalogues.created_by.
4. Analytics rows whose (date, current_url) is not in PostHog, or whose counts are outliers.
5. users/catalogues created_at/updated_at anomalies.
6. Supabase Logs Explorer: edge_logs for `/rest/v1/*` with anon apikey and method in (POST, PATCH, DELETE) over the retention window (retention per plan is unverified).

Then:
- Remediate through an asAdmin script with backups.
- Record the legal decision on breach notification.
- Rotate nothing (grants are what matter), but document it.

### [high] Two incompatible executable cutover runbooks and M4 contracts (column, status, trigger and switch mismatches)

- **Where:** identity-cutover.md §4.3 :447-469, :508, §5.2 :616-644, §6.4 :887-892, §8.1 :1209-1269, §9.2; rls.sql R1 :1188-1197, 08 :1048-1174; app-changes.md §4.1 :2421-2428, §5.1 :2453-2474, §1.6 :701-709, §10.1
- **Problem:** The PGlite and runbook reviews flagged that the documents differ. The specific incompatibilities, which break execution if steps from both are mixed:

**Re-key script vs map table**
- identity's re-key reads `m.avatar_url`, `m.cookie_consent` and `users.welcome_email_sent_at`, and writes `migration.cutover_log` and `pre_remap_counts`.
- rls.sql R1's map has none of those columns. rls.sql 08 adds no `welcome_email_sent_at`.
- Map status: `('pending','migrated','failed','skipped')` vs `('claimed','migrated','conflict','skipped','error','deleted')`. PGlite P5 inserts 'pending', while identity's script expects 'claimed' (C4 check `claimed = 0`).
- If rls.sql 08 + P5 is adopted, as PGlite recommends, the identity re-key fails with 42703 inside the maintenance window.

**Triggers and consent**
- Trigger and function names differ: `on_auth_user_updated` / `handle_auth_user_updated` vs `on_auth_user_email_changed`. identity §7.4 references the latter.
- Avatar sync from metadata: on (rls.sql 8.4) vs off (identity §5.5).
- Consent default: all-true vs all-false.
- Welcome email: `isFirstSignIn` heuristic (app-changes) vs the `claim_welcome_email()` claim function (identity).

**Runbook switches**
- identity's T-0 runbook sets `MAINTENANCE_MODE=1` and uses the `qt-maint-bypass` cookie and `JOBS_PAUSED=true`, but app-changes (the implementation map developers build from) implements neither. Its middleware (app-changes.md:2005-2011) has no maintenance branch, and its worker changes (§1.6, §10.1) add no kill switch.
- Operators would believe writes and cron are frozen when they are not. Clerk-mode writes during the re-key hit lock timeouts or write stale Clerk ids.
- app-changes keeps the Clerk webhook running (:2446) and leaves the old Clerk build live against remapped ids (:2471-2474); identity disables the webhook and keeps a 503 freeze.

**Import script**
- Unverified primary emails: skipped (app-changes :2426) vs imported with email_confirm:false (identity :756).
- avatar_url is written into user_metadata (app-changes :2424) vs 'never avatar here' (identity :704).
- **Evidence:** - identity-cutover.md:449-455, :461-465 (map columns and welcome_email_sent_at).
- rls.sql:1188-1197 (map schema without them).
- identity-cutover.md:1266 vs rls.sql:1169 (trigger names).
- app-changes.md:2457 (only an optional `NEXT_PUBLIC_MAINTENANCE` banner).
- identity-cutover.md:1418, :1417 (MAINTENANCE_MODE, JOBS_PAUSED).
- **Fix:** - Declare identity-cutover §4, §5.2, §8 and §9 the single source for cutover SQL, scripts and runbook, and regenerate rls.sql 08/R1/09 and app-changes §4-§5 from it.
- Add to app-changes P2: the `MAINTENANCE_MODE` middleware branch (fail-closed bypass), the `instrumentation.ts` flag check and the worker `JOBS_PAUSED` check in `scheduled()`.
- Add a reconciliation table (column, status, trigger name, consent, avatar, welcome, unverified-email policy) that all documents reference.
- CI: run identity's `55_remap` pgTAP and the rehearsal test against the actual migration files.

### [high] Repointing the test worker plus an unauthenticated destructive cleanup route; UploadThing token sharing never asked

- **Where:** ../quicktalog-backend/src/index.ts:17-26; ../quicktalog-backend/wrangler.jsonc:18,28; app-changes.md:705, :2639, :2765; identity-cutover.md:133-134, :1550-1552; public-and-system-surfaces.md:131 (open question)
- **Problem:** - Both plans switch the test worker's SUPABASE_URL to TEST, which has 4 catalogues.
- `/api/images/cleanup?delete=true` deletes every UploadThing file not referenced by catalogues in the worker's DB. It has no auth and CORS *, and it is HTTP-only (not in the cron).
- app-changes explicitly defers worker route auth to a 'follow-up', and the decision is silent.
- The phase-1 open question 'Is UPLOADTHING_TOKEN shared between test and prod?' appears in no artifact (grep empty).
- If the token is shared (unverified), one anonymous GET to the test worker after the repoint deletes essentially all PROD catalogue images. The plan's own P2 note says avatars must not live in UploadThing for the same reason.
- **Evidence:** - backend src/index.ts:26: `openapi.get("/api/images/cleanup", CleanupImages);` with `cors({ origin: "*" })` at :17-23 and no auth middleware.
- backend types/index.ts:11: `UPLOADTHING_TOKEN: string` (one per env).
- app-changes.md:2639: 'Not required by this migration … follow-up'.
- **Fix:** - Add input question: is UPLOADTHING_TOKEN per environment?
- Make worker route auth (bearer `WORKER_ADMIN_TOKEN` or Cloudflare Access) a Phase 0 prerequisite in all documents, deployed **before** the SUPABASE_URL repoint.
- Add a safety floor in cleanupImages: refuse delete when the referenced-catalogue count is below a threshold, or when the listed files are mostly unreferenced; default to dry-run.
- Use separate UploadThing apps per environment.

### [medium] pg_net PUBLIC access and TEMP shadowing are verified exposures absent from every design artifact

- **Where:** rls.sql 02 :222-256 (Vault service_role bearer in net.http_post); decision §5.3 / rls-design.md:327-345; rls-design §8 tests; identity §7.8 (key move deferred to T+30); pglite-results.md:88-115 (F3, F4)
- **Problem:** - **pg_net:** any app role, not only postgres, can read the Vault service_role bearer from queued webhook rows in net.http_request_queue. It can also make arbitrary outbound HTTP calls (SSRF) and delete queued webhooks. Combined with any SQL-injection primitive inside withUser/withPublic, this escalates to full BYPASSRLS through PostgREST with the service_role key.
- **TEMP:** PUBLIC holds TEMP on the database, so an injected temp table shadows Drizzle's unqualified table names for the next tenant on a pooled backend.
- **Where it is missing:** no artifact mentions either issue, the service_role-in-webhook design stays until T+30, and there is no test for either.
- **Guardrail gap:** the architecture test does not catch `tx.execute(string)`, which Drizzle wraps in sql.raw (redteam).
- **Evidence:** - TEST read-only (2026-09-17): `net.http_request_queue: supabase_admin=arwdDxtm/supabase_admin,=arwdDxtm/supabase_admin`; `net._http_response` is the same; database ACL `{=Tc/postgres,…}`.
- PGlite F4: postgres cannot revoke (grantor supabase_admin).
- **Fix:** - Add search_path to the wrapper and to app_rls (see the first finding).
- Move 'stop sending service_role from call_edge_function_with_vault_secret' to Phase 0/1: use a dedicated per-webhook secret checked by edge functions (sources must be downloaded first).
- Ask Supabase support whether revoking PUBLIC on net.* is supported.
- Optionally `revoke temporary on database postgres from public` and re-grant it to platform roles (platform impact unverified).
- Pull M3 (app_rls) earlier.
- Add integration tests: as app_user, `select from net.http_request_queue` and `create temp table` must both give 42501 or be documented as accepted risk.
- Extend db-boundaries to reject non-template `.execute(`.

### [medium] Consent gate cannot read private.settings as app_user; terms version has two sources of truth

- **Where:** identity-cutover.md:1337 (§8.4 'read in the same transaction'), :1279-1291 (record_consents); rls.sql:161-167 (settings revoked, no grant); app-changes.md:85, :2249 (NEXT_PUBLIC_TERMS_VERSION)
- **Problem:** - **identity-cutover's gate:** app/admin/layout.tsx is to load consents under withUser and compare them with `private.settings.terms_version` read in the same transaction. app_user has no privilege on private.settings (01 revokes everything and grants nothing), so the layout throws 42501 and every /admin page errors once the gate ships.
- **app-changes' gate:** it compares against a build-time env var, `NEXT_PUBLIC_TERMS_VERSION`, while `private.record_consents(p_version)` rejects any version that differs from private.settings with 22023. Any drift between env and DB puts users in an endless /auth/consent loop.
- **Sign-up:** metadata `terms_version` comes from env (app-changes SignUpForm), but the trigger compares it with settings (identity M4).
- **Evidence:** - rls.sql:166 `revoke all on table private.settings from public;` and no grant in 04/05.
- identity-cutover.md:1284-1285 `if p_version is distinct from (select … 'terms_version') then raise … '22023'`.
- app-changes.md:2249 compares `data.consents?.version !== process.env.NEXT_PUBLIC_TERMS_VERSION`.
- **Fix:** - Pick one source. Recommended: a SECURITY DEFINER `private.current_terms_version()` granted to app_user; the app reads it in the gate and passes it to sign-up metadata through a server-rendered prop instead of an env var.
- Add a pgTAP case: as app_user, the gate query succeeds.
- Add an e2e case: stale version → gate → accept → dashboard, with no loop.

### [medium] migration.clerk_user_map retention contradiction breaks Paddle legacy-id resolution

- **Where:** rls.sql:1292 (10 `drop schema if exists migration cascade`); rls-design.md:102, :1024; identity-cutover.md:48 (A5 'keep the map permanently'), :1538; app-changes.md:674-678, :684, :2529
- **Problem:** - **The conflict:** migration 10 (Phase 7 cleanup) drops the whole migration schema, including the map. identity-cutover A5 and app-changes' `resolveUserId` rely on the map permanently, to resolve renewals of pre-cutover checkouts whose customData.user_id is a Clerk id.
- **Silent failure:** app-changes probes `to_regclass` and silently returns null when the table is gone. The event is then logged as 'unlinked customer' with Sentry fatal and **not retried** (app-changes.md:619-621), so a renewal or cancel for a user whose customer_id was never linked leaves plan_id wrong.
- **Undecided:** retention and PII policy for the map (emails, avatar URLs, cookie consent, google_sub) and for private.backup_* (subscriber emails).
- **Evidence:** - rls.sql:1292.
- identity-cutover.md:1538 'keep migration.clerk_user_map'.
- app-changes.md:676 `if (!probe?.present) return null;`.
- **Fix:** - Change migration 10 to drop only the backups and cutover scratch tables (pre_remap_counts, cutover_log after export). Keep `migration.clerk_user_map` minimised to (clerk_user_id, supabase_user_id, status) after T+30 by nulling email, avatar and consent columns.
- Add a retention decision to the inputs.
- Make the unlinked-customer path retryable, or write it to a manual-review table.

### [medium] Paddle linking: three different designs, and P0 ships before customData on subscription events is verified

- **Where:** rls-design.md:254 (#69 customData only); app-changes.md:565, :604-607, :619-621, :683; identity-cutover.md:170-173, :1573, :1701
- **Problem:** Three different designs:
- rls-design links only by `customData.user_id`.
- app-changes P0 removes email linking entirely (CustomerCreated/Updated are ignored) and resolves customer_id, then customData, then the map.
- identity-cutover keeps email linking as a last resort when the email is unique.

Whether Paddle subscription events carry the checkout customData is explicitly unverified in app-changes and identity §13. Yet app-changes ships the rewrite in P0, and its P0 exit gate (app-changes.md:47, :711-716) has no Paddle sandbox test. If customData is absent, every new customer is 'unlinked', not retried, and never gets their plan.

The browser-set customData trust issue (red team and runbook) also remains unresolved in all three documents.
- **Evidence:** - app-changes.md:683 'Whether Paddle subscription webhooks carry the checkout customData is (unverified)'.
- :621 'needs a manual link; not retried'.
- PricingColumn.tsx:141-147 (today: only customer.email, opened client-side).
- **Fix:** - Add a P0 exit gate: a Paddle sandbox checkout, activation, one simulated renewal and a cancel all resolve the right user through customData. Otherwise keep the email fallback until that passes.
- Adopt one design in all three documents.
- Bind customData server-side (a transaction created by a server action, or an HMAC over user_id).
- Make unresolved events throw (so Paddle retries) or go to a review table, never silently null.

### [medium] Middleware designs contradict: app-changes refreshes sessions on public ISR pages; Clerk-cookie and maintenance handling differ

- **Where:** app-changes.md:1957-2011 (updateSession on every matched path); identity-cutover.md:883-903, :938, :1625
- **Problem:** **app-changes:**
- `middleware.ts` calls `updateSession` for every path the matcher includes, including `/catalogues/[name]` ISR pages, `/api/items*` and marketing pages.
- Each call runs `getClaims()`. An expired token triggers a GoTrue refresh from Vercel egress, and middleware then sets `Set-Cookie` plus `private, no-store` headers on public responses.
- It expires only 3 Clerk cookie names and has no maintenance branch.

**identity-cutover:**
- It requires that public pages never run session work or carry Set-Cookie (§6.6 point 3), and unit-tests that ('Public page: no GoTrue call, no Set-Cookie').
- It restricts refresh to NEEDS_SESSION paths or next-action requests, expires 10 base names plus suffixed variants, and adds the maintenance switch.

Implementing app-changes as written fails identity's test. It also adds per-request Edge invocations and refresh load on the highest-traffic routes on Hobby.
- **Evidence:** - app-changes.md:2006 `return AUTH_PROVIDER === "supabase" ? updateSession(request) : clerk(request, event);` with matcher :2010.
- identity-cutover.md:895-896 `needs ? await updateSession(...) : NextResponse.next()`.
- **Fix:** - Adopt identity §6.4 in app-changes §3.7: NEEDS_SESSION gating, a static superset matcher, the maintenance branch, and expiring only Clerk cookies that are present, only on session paths.
- Keep the unit test.
- Narrow the matcher in P5.

### [medium] Environment and config contradictions, including an insecure preview redirect glob

- **Where:** app-changes.md:2391 vs identity-cutover.md:1027, :1052; app-changes.md:131-143 vs identity-cutover.md:199-201 vs decision §5.1; identity-cutover.md:945 vs app-changes.md:442; identity-cutover.md:1041, :1113 vs app-changes.md:86, :2394; app-changes.md:2221 vs identity-cutover.md:1084
- **Problem:** **Security-relevant**
- The TEST redirect allow-list in app-changes §3.14 includes `https://*-<vercel-team-slug>.vercel.app/**`. identity-cutover §7.2 forbids exactly that glob, because anyone can claim a matching vercel.app alias and receive a victim's PKCE code.

**Provider flag has three mechanisms**
- Decision: runtime `process.env.AUTH_PROVIDER`.
- app-changes: build-time mirror via next.config `env`.
- identity-cutover: two independently set Vercel vars plus a boot-time throw if they differ.

**Other disagreements**
- sendDefaultPii: off in Phase 0 (identity) vs kept pending legal (app-changes).
- Turnstile: required (identity) vs optional (app-changes).
- /auth/confirm type whitelist: email, recovery, email_change (identity) vs also signup, invite, magiclink (app-changes).
- Interstitial: default (identity D7) vs optional (app-changes).
- Worker secrets `JOBS_PAUSED` and `WORKER_ADMIN_TOKEN` exist only in identity; the decision §4 env table lacks them.
- Module paths differ: `utils/supabase/cookie-options.ts` vs `lib/auth/cookie-options.ts`, `lib/observability/scrub.ts` vs `sentry-scrub.ts`, `scripts/migrate-clerk-to-supabase.ts` vs `scripts/cutover/…`, `rollback-remap.sql` vs `unmap-user-ids.sql`.
- **Evidence:** - app-changes.md:2391: 'allow-list … `https://*-<vercel-team-slug>.vercel.app/**`'.
- identity-cutover.md:1052: 'No `https://*-<team>.vercel.app/**` glob, on either project.'
- **Fix:** - Produce one env and config matrix (extend decision §4) covering app, worker, GitHub and operator machine, and delete the per-document variants.
- Remove the vercel.app glob from app-changes.
- Pick one AUTH_PROVIDER mechanism.
- Normalise module and script paths and the confirm-type whitelist.

### [medium] Phase numbering: three schemes with different contents; rls.sql has no crosswalk

- **Where:** rls.sql:18-25 (decision phases 1-7); identity-cutover.md:79-96 (0-5); app-changes.md:45-52 (P0-P5); rls-design.md:998-1009
- **Problem:** - **Same step, different phases:**
  - M2 is decision/rls.sql Phase 3, identity Phase 0, and app-changes end of P0 (optional).
  - M3 is decision Phase 4 but sits inside identity Phase 1 and app-changes P1.
  - M4 is applied to PROD in identity Phase 2 ('same release'), but in rls-design §11 after 07.
- **Same number, different contents:** 'Phase 2' means 'code on Clerk' in the decision and 'Supabase Auth dark' in identity; 'Phase 5' means 'Supabase Auth build' in rls.sql and 'Decommission Clerk' in identity.
- **Risk:** operators reading rls.sql headers ('Phase 3 … APPLY ONLY AFTER …') alongside identity's runbook will apply migrations at the wrong gate (see the early-M2 finding).
- **Evidence:** - rls.sql:23 'Phase 5 (M4 …) 08' vs identity-cutover.md:88 'Phase 5 Decommission Clerk'.
- **Fix:** - Define one phase list with named gates, e.g. G0 perimeter, G1 RLS on Clerk, G2 app_rls, G3 auth dark, G4 cutover, G5 cleanup.
- Label each migration header in rls.sql with the gate and its precondition checks rather than a number.
- Update the decision §14 table and both plans to reference the gates.

### [medium] Rollback steps that cannot run, and rollback gaps

- **Where:** identity-cutover.md:251 (Phase 2 rollback 'drop trigger on_auth_user_created on auth.users'); rls-design.md:1031-1046 vs identity-cutover.md:540-572 vs app-changes.md:2417, :2492-2502; rls-design.md:1008-1009 (PROD order without backup); app-changes.md:1849 (P1 exit gate)
- **Problem:** **Phase 2 rollback cannot run**
- identity's Phase 2 rollback drops the auth.users triggers. postgres does not own auth.users, so this gives 42501 (rls.sql:1161-1165, PGlite verified), and the rollback silently fails.

**Three different remap-rollback scripts**
- rls-design §13 inline: no rollback_clerk_ids, no handling of Supabase-only users, and it re-adds no NOT VALID check.
- identity rollback-remap.sql.
- app-changes unmap-user-ids.sql: 'requested from the DB plan', which never wrote it.

**No PROD backup gate before M1/M2**
- The rls-design §11 PROD order has no backup/PITR checkpoint before M1 03 (destructive dedupe, null-user deletes, FK swaps) or M2. identity only takes a pg_dump before the re-key.

**No numeric abort criteria**
- There are no numeric abort or rollback criteria for the Phase 1 PROD rollout (withUser latency on agent pre-stream and pages under the 60s Hobby limit, pool errors 53300/57014). The gate text is 'within budget'.
- **Evidence:** - identity-cutover.md:251: 'M4: `drop trigger on_auth_user_created on auth.users;`'.
- pglite-results.md:120: 'postgres can CREATE but not DROP triggers there'.
- app-changes.md:2417: 'requested from the DB plan'.
- **Fix:** - Replace identity's Phase 2 rollback with no-op function bodies plus `disable_signup=true` (rls-design §13).
- Keep one rollback-remap script (identity §4.6, with pushed users written into the main map).
- Add 'record PITR / take pg_dump' as a precondition row before M1 and M2 on PROD.
- Define Phase 1 abort thresholds: p95 agent start < N ms, 0 sustained 53300/57014, admin page p95, plus rollback by reverting code while M1 stays in place.

### [medium] Claims presented as fact that are unverified or disproven

- **Where:** rls.sql:78-84; rls-design.md:54, :994; rls.sql:1091-1092; decision §3 (supautils); identity-cutover.md:925-927, :392/:417-419; app-changes.md:1929 vs identity-cutover.md:919-921; rls-design.md:234 (#49), app-changes.md:2595 (#49)
- **Problem:** **Disproven by PGlite**
- rls.sql:78-84: 'a CREATEROLE user could always execute a GRANT' (F6).
- rls-design.md:54: 'the SQL was not executed'. It has since been executed.
- rls-design.md:994: the size CHECK is 'slightly lenient for old rows'. In fact, any content edit on a large legacy row fails (F8).

**Depends on settings nobody confirmed**
- rls.sql:1091: 'GoTrue writes auth.users.email only after the change is confirmed'. This holds only with confirm/secure email change enabled per project, and those settings are listed as unverified at identity-cutover.md:1176.
- Decision §3 relies on 'supautils.reserved_memberships includes authenticator' to show unreachability. That setting blocks granting authenticator to others, not granting app_user to authenticator (redteam).

**Contradicted by docs or the design itself**
- identity-cutover.md:925-927 plans to raise rate_limit_token_refresh/verify, but the docs mark them not customizable.
- Per-IP limit numbers differ: app-changes.md:1929 says '30 per 5 min / 150 per 5 min'; the runbook review cites 360/h verify and 1800/h refresh.
- identity §4.3 says readers continue under the SHARE ROW EXCLUSIVE lock, but ADD CONSTRAINT takes ACCESS EXCLUSIVE.
- rls-design #49 and app-changes #49 say 'RLS hides non-owned names' while RLS on catalogues is off until 06.
- **Evidence:** - pglite-results.md:128-131 (F6), :139-146 (F8).
- identity-cutover.md:1176 lists mailer_secure_email_change_enabled as to-confirm.
- **Fix:** - Correct or mark each claim (unverified) in place.
- Add explicit checks to the go/no-go:
  - GET `/config/auth` shows `mailer_autoconfirm=false` and `mailer_secure_email_change_enabled=true`;
  - the pgTAP perimeter assertion replaces the supautils rationale;
  - measured GoTrue 429 behaviour on TEST replaces the quoted limit numbers.

### [medium] Test coverage gaps for the chosen ordering, verified exposures, pooling and the agent

- **Where:** rls-design.md §7-§8; app-changes.md §2.12, §3.12-§3.13; identity-cutover.md §11; decision §15
- **Problem:** Missing tests:
1. **Migration order:** nothing applies migrations in the order the plans actually choose (early M2, then M1), which would have caught the 06 dependency failure.
2. **Verified exposures:** no test for search_path/temp-table shadowing, pg_net privileges or `tx.execute(string)`.
3. **Remap tests:** the pgTAP 50 imported-user test and the remap tests do not reproduce GoTrue's INSERT-then-UPDATE order (only identity's integration test would).
4. **Pooling:** no connection-budget or load test for app_rls. Pool max 3 per Fluid instance, CONNECTION LIMIT 40, TEST max_connections 60, and a Supavisor pool per (db,user) that is unverified now that a second login role exists.
5. **Agent:** no e2e covering an agent turn (charge, continuation, refund) or Paddle sandbox flows in CI.
6. **Clerk regression:** no Clerk-mode regression job after TEST flips to Supabase while PROD still runs Clerk (runbook review).
7. **CI fallback:** the db-tests job depends on an unverified replay of remote_schema.sql (pg_cron, pg_net, vault) on the CLI image. The PGlite harness that already runs 475 scenarios is not planned into the repo as a fallback or fast gate.
- **Evidence:** - app-changes.md:1840: 'Whether … remote_schema.sql replays cleanly on the local image … is (unverified)'.
- pglite-results.md:3 (the harness then existed only outside the repo).
- rls-design.md:981-982 (pool numbers, per-user pool unverified).
- **Fix:** - Add `tests/integration/db/migration-order.test.ts`, which applies migrations in the declared gate order on a fresh stack.
- Port the pglite-harness into `tests/db-pglite/` as a CI job that runs without Docker.
- Add privilege tests for net.* and TEMP.
- Add a k6 or autocannon smoke run against a TEST preview after M3 while watching `pg_stat_activity` by usename.
- Add a Playwright agent turn plus a metering assertion via `DATABASE_ADMIN_URL`.
- Keep a Clerk-mode e2e leg until R2 closes.

### [low] Phase-1 open questions never recorded as decisions or inputs

- **Where:** ai-agent.md:127, :129; plans/active/ai-agent-plan-mode.md:212-230, :364-390; app/admin/dashboard/[[...rest]]/page.tsx:35; identity-coupling.md:162, :166; data-access.md:161; public-and-system-surfaces.md:134, :139
- **Problem:** No artifact records these phase-1 open questions (grep is empty for each):
- **ai_credits roadmap:** does the plan-mode ledger ship before, with or after RLS? Its design has the **client** mint a turnId and relies on a partial unique index for 'one charge per request' (plan-mode doc :212-230, :384-390). That is forgeable and would undo the DB-authoritative `begin_ai_turn` design if implemented later.
- **OCR metering:** should chat OCR be metered, and should `ocr_ai_import` be enforced? The dashboard shows an OCR limit computed from a table nothing writes.
- **D1 logs:** can the worker's D1 logs hold user ids or PII?
- **users.email:** is a unique index intended? Duplicates block import and email-based linking.
- **PROD jsonb scan:** scan PROD jsonb columns for Clerk ids (only TEST was scanned).
- **External consumers** of /api/pdf and the worker's /api/generate/pdf, before deleting them.
- **Draft sharing:** should owners be able to share draft previews via signed links (preview becomes owner-only)?
- **Evidence:** - plans/active/ai-agent-plan-mode.md:220: '`send()` mints `turnId.current = crypto.randomUUID()` … passes `turnId` in the body'.
- app/admin/dashboard/[[...rest]]/page.tsx:35: `ocr: usage.ocr >= currentPlan.features.ocr_ai_import`.
- **Fix:** - Add these to identity §12 or app-changes §11 as inputs.
- Add a decision note that any future ai_credits ledger must use a server-minted turn id through a definer function (and update plans/active/ai-agent-plan-mode.md Part 2 accordingly).
- Add a read-only PROD scan for `%user_%` in jsonb columns to preflight.sql.

### [low] Clerk-period account deletion (P0-P4) still leaves Paddle billing active

- **Where:** app-changes.md:425-432 (deleteClerkUser), :2575 (#29); auth-surface.md:112; identity-cutover.md §8.6 (Supabase phase only)
- **Problem:** - **Deletion path:** until cutover, 'Delete account' in Clerk `<UserProfile/>` fires user.deleted, and `deleteClerkUser` deletes public.users through asAdmin. The FK cascade removes the subscriptions rows through customer_id. It purges only Redis and ISR and never cancels the Paddle subscription, which is the pre-existing gap flagged in auth-surface.md:112.
- **Consequence:** the user keeps being billed.
- **Late events:** later Paddle events for that customer resolve to no user, logged as a fatal 'unlinked customer' and not retried (app-changes). identity §8.6 handles cancellation only for the Supabase-phase deleteMyAccount.
- **Evidence:** - app-changes.md:429: `await tx.delete(users).where(eq(users.id, id)); // FK cascades` with no Paddle call.
- auth-surface.md:112: 'Nothing cancels the Paddle subscription'.
- **Fix:** - In the Clerk webhook user.deleted handler, read customer_id first, call `cancelActiveSubscriptionsForCustomer` after commit (or before the delete, returning 500 on failure so Svix retries).
- Alternatively, disable Delete account in Clerk until cutover (an input question).
- Treat Paddle events for deleted users as 200 plus log, as identity §8.6 step 6 says.

### [low] The answer to user ask 3 (framing correction) exists only in the decision text

- **Where:** binding decision §1-§2; rls-design.md:5-10; identity-cutover.md:3; app-changes.md:7-10
- **Problem:** The user asked for a decision among 'ORM only / supabase client / hybrid' and to be corrected if that framing is wrong. The correction lives only in the binding decision §1: every option is a hybrid, 'ORM only' today means no RLS, keys are not access paths, and avoiding supabase-js does not avoid the Data API.

The three artifacts only say 'decision B, binding'. None restates the answer, the credential and path table (decision §2), or why proposals A and C were rejected (§16). If the final deliverable is assembled from the artifacts, the direct answer to ask 3 could be lost or appear only implicitly.
- **Evidence:** - rls-design.md:5-10 (architecture summary with no framing discussion).
- app-changes.md:7-10 (lists the decision as input only).
- **Fix:** - Include decision §1 (framing correction plus the decision table), §2 (target state) and §16 (rejected alternatives) verbatim or summarised at the top of the final user-facing report.
- Cross-link from each artifact.

