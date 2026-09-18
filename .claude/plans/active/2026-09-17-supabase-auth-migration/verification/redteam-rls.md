# Red-team review: RLS design

> Review of the earlier design drafts (2026-09-16). Every critical and high finding is resolved in `../PLAN.md` (see its Appendix D.4). Section and line references point at those drafts, which are not included.


## Summary

## Red-team review: rls.sql + rls-design.md (decision B, private app roles)

The core design holds up. Once migration 06 is applied, I found no way in through the Data API and no cross-tenant path through the SQL policies. The real problems are in **sequencing**, the **cutover trigger**, **AI metering**, the **Redis overlay**, and **guardrail gaps**. Nothing was executed. Evidence comes from read-only SELECTs on TEST, repo files, and GoTrue source.

**Checked and holding**
- **Perimeter after 06:**
  - On TEST, the only functions in `public` are `call_edge_function_with_vault_secret` (no PUBLIC EXECUTE) and `get_pageview_totals` (dropped in 06), so no hidden RPC is exposed.
  - Nothing is in a Realtime publication.
  - `private` is never granted to anon/authenticated.
  - `pg_auth_members` on TEST: authenticator, storage and realtime roles cannot reach `postgres` or the app roles. Only `cli_login_postgres` can SET ROLE postgres.
- **App roles will not break on privileges:**
  - `public` schema USAGE is granted to PUBLIC.
  - Every id/timestamp default used by app_user INSERTs is `gen_random_uuid()` or `now()`, so no USAGE is needed on `extensions` or any sequence.
- **Column grants and policies:**
  - UPDATE column grants plus WITH CHECK block changes to created_by/id/name and to plan_id/customer_id.
  - app_user has no UPDATE on `name`/`id`, so FK ON UPDATE CASCADE cannot be abused.
  - RLS WITH CHECK runs before unique and FK checks, so the only existence oracle is the intended slug one.
  - Definer functions pin `search_path=''` and qualify every name.
- **AI ledger:** the UNIQUE(catalogue), cascade-reset, race and month-bound defects are closed.

**Most important problems**
1. **8.3 skip check (breaks cutover):** `handle_auth_user_created`'s `raw_app_meta_data ? 'clerk_user_id'` check can never match.
   - GoTrue INSERTs the user first and merges `app_metadata` in a later UPDATE.
   - Every imported user would get a uuid `public.users` row and fire a Brevo POST.
   - The remap would then abort.
2. **Most severe hole stays open longest:** the anon DML hole (self-upgrade plan, delete or take over any user) closes only in 06. rls.sql gates 06 on the whole withUser refactor, but the actual precondition is just "no supabase-js data call left".
3. **Policies inert while withUser code runs:** users, catalogues, analytics and newsletter get RLS only in 06. rls-design's call-site table relies on RLS alone for delete, status and publish statements during that window.
4. **Forged continuations:** still give about 10 steerable free agent turns per charged turn, because the plan comes from client messages.
5. **Redis overlay keyed by slug, not id:** when a slug is reused, the new owner sees the previous owner's draft.
6. **Weak SQL-injection containment:**
   - In Phases 1-3 an injected statement inside withUser can RESET ROLE to BYPASSRLS `postgres`. After M3 it can still rewrite `request.jwt.claims`.
   - Drizzle's `execute(string)` gets past the `sql.raw(` ban.

**Still open from the digest list:** unauthenticated worker routes running with service_role. Paddle linking via client-set `customData.user_id` can be used to deny a specific victim their subscription. Entitlements are enforced only on writes, so a downgrade leaves paid features live. The Brevo trigger can be amplified through user-editable name/metadata.

Relevant files:
- draft `rls.sql`
- draft `rls-design.md`
- draft `app-changes.md`
- draft `identity-cutover.md`

## Findings

### [high] Imported-user skip in handle_auth_user_created never matches (GoTrue sets app_metadata in a second UPDATE)

- **Where:** rls.sql:1059-1061 (MIGRATION 08, 8.3); rls-design.md:900 (pgTAP 7.8 row); RUNBOOK R2 rls.sql:1211-1213
- **Problem:** The trigger skips imported Clerk users only when `new.raw_app_meta_data ? 'clerk_user_id'`. GoTrue's adminUserCreate runs `tx.Create(user)` first (app_metadata holds only provider/providers) and merges `params.AppMetaData` later with `user.UpdateAppMetaData(tx, ...)`, so the AFTER INSERT trigger never sees the key. On PROD, while M4 is live and the import script runs:
- every imported user gets a uuid-keyed public.users row with the default Starter plan;
- each row fires the Brevo AFTER INSERT webhook, creating duplicate CRM contacts with uuid ids;
- in the maintenance window the remap guard 'a target uuid is already present in public.users' aborts the cutover. Without that guard, the PK would collide.
The pgTAP case inserts `raw_app_meta_data` directly in SQL, so it passes and gives false confidence.
- **Evidence:** - supabase/auth master internal/api/admin.go adminUserCreate: `if terr := tx.Create(user)` comes before `if terr := user.UpdateAppMetaData(tx, params.AppMetaData)` (fetched and verified).
- identity-cutover.md:44 (A1) reached the same conclusion, but rls.sql was not updated.
- TEST: auth.users has no triggers yet (read-only check).
- **Fix:** - Skip by map lookup instead: `if exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = new.id) then return new; end if;`.
- The import script inserts the map row (the uuid claim) BEFORE calling createUser.
- Move creation of the `migration` schema and `clerk_user_map` from RUNBOOK R1 into migration 08, so the trigger function compiles against an existing table.
- Replace the pgTAP case with one that seeds a map row.
- Add an integration test that calls the real `auth.admin.createUser({ app_metadata: { clerk_user_id } })` on the local stack and asserts no public.users row is created.

### [high] Closing the critical anon-DML hole is gated on the entire withUser refactor

- **Where:** rls.sql:906-913 (MIGRATION 06 header), rls.sql:20-21 phase map; rls-design.md:998-1009 (§11 order); decision §14 Phase 3
- **Problem:** Today the publishable key grants anon users S/I/U/D, catalogues S/I/U, subscriptions S/I/U, analytics S/I, newsletter S and job_logs I, with RLS off. That allows self-upgrading plan_id, deleting any user by cascade, id-swap account takeover and dumping subscriber emails. rls.sql closes this only in 06 and states the precondition as 'every call site on withUser/withPublic/asAdmin', i.e. after all of P0+P1 plus the test→main merge. The real precondition is narrower: no supabase-js data call left (Clerk webhook, Paddle webhook, on-demand sync, /api/items, dashboard analytics). app-changes.md:711-721 even proposes applying M2 right after P0, which contradicts rls.sql. As written, the worst hole stays open for the longest phase.
- **Evidence:** - TEST role_table_grants (read-only, today): users DELETE,INSERT,SELECT,UPDATE; catalogues INSERT,SELECT,UPDATE; subscriptions INSERT,SELECT,UPDATE; analytics INSERT,SELECT; newsletter SELECT; job_logs INSERT; relrowsecurity=false on all tables.
- Exploit: data-access.md:130.
- The old browser client in git history (public-and-system-surfaces.md:116) means the key may already have been exposed.
- **Fix:** - Restate 06's precondition as 'no supabase-js data path deployed'.
- Add a hotfix migration (06a) that can be cherry-picked to main within days:
  1. Move the three anon writers (app/api/clerk, utils/paddle/process-webhook.ts, lib/users/fetchUserData.ts:55) to a secret-key or postgres client.
  2. Revoke all anon/authenticated privileges on users, subscriptions, analytics, newsletter and job_logs, and EXECUTE on get_pageview_totals.
  3. Revoke catalogues INSERT/UPDATE.
  4. Enable RLS on catalogues with a temporary `to anon using (status='active')` policy until /api/items moves.
- Then apply 01-06 before any withUser code (see the next finding).

### [high] app_user policies on users/catalogues/analytics/newsletter are inert while withUser code already runs

- **Where:** rls.sql:486-490 and 540-559 (policies in 04), rls.sql:921-924 (RLS enabled only in 06); rls-design.md:189 (#4), :191 (#6), :197 (#12), :200 (#15), :234 (#49); app-changes.md:2595 (#49)
- **Problem:** Migration 04 creates the owner policies, but RLS on users, catalogues, analytics and newsletter is enabled only in 06, which is ordered AFTER the Drizzle-only code ships. In that window `withUser` gives no row isolation on those tables: app_user holds table-level SELECT/DELETE and UPDATE(status, content, …) on every catalogue. `withPublic` also sees drafts (only `created_by` is withheld). rls-design's call-site table relies on RLS alone and marks cross-tenant access 'Denied now' for statements with no owner predicate:
- #4 `delete … where id in (…)`
- #6 `update … set status returning name`
- #12 `select name where name=$1 (a row means owned)`
- #15 `update … where name=$1`
- #49 `where id in (…)`
app-changes.md:2595 also says 'RLS hides non-owned names'. pgTAP runs on a local stack with all migrations applied, so CI never exercises this window.
- **Evidence:** - rls.sql:490 comment: 'Until 06 runs, policies on those four tables exist but are inert'.
- PostgreSQL ignores policies when relrowsecurity=false. TEST confirms relrowsecurity=false on users/catalogues/analytics/newsletter today.
- app-changes.md:1058-1098 does add explicit `created_by = me` filters, but the reviewed DB design and its examples do not require them.
- **Fix:** Preferred: in migration 04, enable RLS on all 12 tables and add temporary passthrough policies that replicate today's anon access, e.g. `create policy tmp_anon_users on public.users for all to anon using (true) with check (true)` (same for catalogues, subscriptions, analytics, newsletter select, job_logs insert). postgres and service_role bypass RLS, so nothing breaks. Migration 06 then drops the tmp policies and revokes. With that ordering, the app_user policies are active from the first withUser deploy.

Additionally:
- make an explicit owner predicate mandatory in every withUser statement (review checklist plus a unit test on Drizzle SQL);
- fix the rls-design examples #4/#6/#12/#15/#49.

### [medium] Forged plan continuations still give ~10 steerable free agent turns per charged turn

- **Where:** rls.sql:815-832 (private.begin_ai_turn continuation branch); agent/plan.ts:199-205, :215; app/api/agent/route.ts:67-68
- **Problem:** `p_continuation` comes from `isPlanContinuation(messages)`, which only checks that the last user message equals CONTINUE_PLAN_MARKER. The DB grants a free turn whenever ANY charged, unrefunded prompts row for the same user and catalogue is younger than 15 minutes and has continuations < 9. The continued request's plan is rebuilt from client-supplied messages (`planFromMessages`), so the attacker writes arbitrary tasks, and each forged continuation is a full, fully steerable agent turn of up to 50s of model spend.
- A cheap `writeItemDescription` charge (actions/ai.ts) also unlocks agent continuations, because prompts rows record no turn kind and no plan state.
- The DB cap (9) also disagrees with the app's MAX_PLAN_CONTINUATIONS = 8.
- Example: a Pro user with 10 prompts/month gets about 100 agent turns.
- **Evidence:** - agent/plan.ts:199-205: `return textParts(last).some((text) => text.trim() === CONTINUE_PLAN_MARKER);`
- app/api/agent/route.ts:67-68: `const plan = resuming ? planFromMessages(messages) : null;`
- rls.sql:818-826 lookup filters only user, catalogue, refunded_at, datetime > now()-15min, continuations < 9.
- **Fix:** Make plan state server-authoritative:
1. Add `kind` ('agent'|'describe'), `plan_open boolean`, `plan_tasks_pending int` and `plan_hash bytea` to prompts.
2. In onFinish of a charged agent turn that ends with an unfinished `session.plan`, call a new definer `private.open_plan(p_turn_id, p_pending, p_hash)`.
3. Return turn_id to the client in stream metadata.
4. Change `begin_ai_turn` to take `p_turn_id` for continuations and require: same user and catalogue, kind='agent', plan_open, continuations < least(8, plan_tasks_pending), and a matching hash of the plan the client resends (or load the plan from the DB instead of the messages).
5. Close the plan when it is finished, stalled or halted.

### [medium] Redis draft overlay is keyed by slug and not bound to catalogue id: the previous owner's draft leaks on slug reuse

- **Where:** app-changes.md:912 (draftKey), :925-936 (readOwnedDraft), :944-946 (deleteDrafts); rls.sql:681-692 (catalogue_name_available); rls.sql:1136-1146 (handle_auth_user_deleted)
- **Problem:** `readOwnedDraft` proves ownership of the DB row, then overlays whatever is stored under `${prefix}:catalogue:${name}` (30-day sliding TTL). It never compares `draft.id` with `row.id`, so every content field comes from Redis. Stale keys survive every catalogue delete path that does not call deleteDrafts:
- the Clerk `user.deleted` cascade (actions/users.ts:83);
- `on_auth_user_deleted` when a user is deleted from Studio or the admin API;
- the worker and e2e/admin deletes;
- any Redis DEL that fails after commit.
Once the row is gone, `catalogue_name_available` returns true. A new user who creates the same slug opens the builder or preview and gets the previous owner's unsaved content (contact, legal, custom code), which they can then publish.
- **Evidence:** - app-changes.md:935: `return { ...row, ...(draft ?? {}), id: row.id, name: row.name, status: row.status, ... }`. There is no `draft.id === row.id` check, and writeOwnedDraft stores `rest`, which includes id.
- Clerk user deletion today does no Redis cleanup (data-access.md:96).
- **Fix:** - Key drafts by the immutable catalogue uuid, `${prefix}:catalogue:${row.id}`, which the insert trigger pins so it is never reused.
- Alternatively, keep the slug key but discard the overlay unless `draft.id === row.id`.
- In createCatalogue/duplicateItem, delete any existing key for the new slug before first use.

### [medium] SQL-injection containment: RESET ROLE escalates to BYPASSRLS in Phases 1-3, claims are forgeable after M3, and Drizzle execute(string) evades the sql.raw ban

- **Where:** rls-design.md:327-345 (inRole), :661-667 (architecture test regexes); rls.sql:955-983 (M3 app_rls); node_modules/drizzle-orm/pg-core/db.js:273-274
- **Problem:** - **Phases 1-3 (which may last long):** withUser only runs `set_config('role','app_user',true)` on a `postgres` login. Any injected statement inside a withUser block can run `RESET ROLE` or `SET SESSION ROLE NONE` and act as BYPASSRLS postgres.
- **After M3 (app_rls):** RESET ROLE lands on a role with no grants, but app_user can still call `set_config('request.jwt.claims','{"sub":"<victim>"}',true)`, because custom GUCs are USERSET. That impersonates any tenant.
- **Guardrail gaps:** the architecture test bans the text `sql.raw(` and a `SET\s+(LOCAL\s+)?ROLE` regex. Drizzle's `execute()` accepts a plain string and wraps it in sql.raw internally, so ``tx.execute(`select … '${name}'`)`` passes both lint and test. `SET SESSION ROLE` is also not matched.
- **Evidence:** - node_modules/drizzle-orm/pg-core/db.d.ts:280 `execute<TRow>(query: SQLWrapper | string)`.
- db.js:274 `const sequel = typeof query === "string" ? sql.raw(query) : query.getSQL();`
- TEST: postgres rolbypassrls=true (rls.sql:34).
- **Fix:** - Extend db-boundaries.test.ts and Biome/grit rules to reject `.execute(` whose argument is not a `sql` tagged template, and to match `SET SESSION ROLE` and `RESET`.
- Pull M3 (app_rls) forward to directly after 06, so Phase 1-3 injections cannot reach BYPASSRLS.
- Keep all dynamic SQL in reviewed modules under utils/db.

### [medium] User-controllable name changes amplify into service_role-authenticated edge-function calls (Brevo)

- **Where:** rls.sql:293-296 (Brevo trigger UPDATE OF email, name, plan_id, customer_id), rls.sql:1111-1117 (handle_auth_user_updated name sync), rls.sql:511 (app_user UPDATE(name)); app-changes.md:2261 (updateProfile)
- **Problem:** After cutover, any signed-in user can loop `supabase.auth.updateUser({ data: { full_name: String(i) } })` directly against GoTrue with the publishable key. Each change:
1. fires `on_auth_user_updated`;
2. updates public.users.name;
3. fires 'Brevo New Contact Webhook', which calls pg_net `http_post` to the PROD create-brevo-contact edge function with the service_role bearer;
4. triggers a Brevo API call.
The planned `updateProfile({name})` server action does the same through app_user's UPDATE(name) grant. Result: exhausted Brevo and edge-function quotas, a flooded pg_net queue, CRM churn. Whether GoTrue rate-limits user metadata updates is unverified.
- **Evidence:** - rls.sql:295 `after insert or update of email, name, plan_id, customer_id`.
- rls.sql:1115 `update public.users u set name = v_new_name where …`.
- `UPDATE OF` triggers fire whenever the column is in the SET list.
- **Fix:** - Drop `name` from the Brevo trigger column list, or replace the direct pg_net call with a `private.crm_outbox` row that a pg_cron job drains with per-user coalescing.
- Stop syncing name from user_metadata after row creation (identity-cutover.md §5.5 already does not).
- Rate-limit updateProfile per user.

### [medium] Worker stays an unauthenticated internet-facing service_role surface (digest issue #3 not closed)

- **Where:** ../quicktalog-backend/src/index.ts:16-26; src/handlers/cleanupImages.ts:206-212; app-changes.md:2639
- **Problem:** After M2, the Cloudflare worker is the only BYPASSRLS component reachable from the internet, and its HTTP routes still have no auth:
- `/api/images/cleanup?delete=true` deletes every UploadThing file not referenced by the worker's (misconfigured) project;
- `/api/generate/pdf` dumps D1 logs and triggers revalidation.
The plans defer this as a 'follow-up', so an RLS rollout marked done still leaves destructive privileged endpoints open.
- **Evidence:** - public-and-system-surfaces.md:50 and :119.
- app-changes.md:2639: 'Not required by this migration. Recommended: shared-secret header … follow-up'.
- The test worker points at tpcfltcupcofteovrvmu (wrangler.jsonc:28).
- **Fix:** - Before M2: require a shared-secret header (or Cloudflare Access) on every worker HTTP route.
- Move cron-only logic to `scheduled()` with no HTTP trigger.
- Point the test worker at TEST.

### [low] Paddle linking by client-set customData.user_id enables targeted billing denial

- **Where:** components/home/Pricing/PricingColumn.tsx:141-146 (+ app-changes.md:565); app-changes.md:618-624, :668-673 (resolveUserId); TEST FK subscriptions_customer_id_fkey -> users(customer_id) ON UPDATE/DELETE CASCADE
- **Problem:** `customData` is set in the browser. When the Paddle customer is not yet linked, resolveUserId trusts `customData.user_id`.
1. An attacker (paying once, using a different email) binds their Paddle customer X to a victim V who has no customer_id.
2. Later, V's own checkout creates customer Y.
3. The link update `where id=V and (customer_id is null or customer_id=Y)` silently does nothing.
4. The subscriptions insert with customer_id=Y violates subscriptions_customer_id_fkey, the handler throws, and Paddle retries forever. V pays but never gets the plan.
Pre-cutover Clerk ids are public in catalogue HTML, which makes the victim's id easy to obtain.
- **Evidence:** - app-changes.md:623-624 guarded update.
- app-changes.md:625-627 insert.
- TEST FK definition: `FOREIGN KEY (customer_id) REFERENCES users(customer_id) ON UPDATE CASCADE ON DELETE CASCADE`.
- **Fix:** - Put a server-issued HMAC token `{user_id, exp}` in customData (or create the transaction server-side through the Paddle API) and verify it in the webhook.
- On a link conflict, record the event in a manual-review table and return 200 instead of looping on an FK error.

### [low] Entitlements are enforced only on writes: a downgrade keeps paid features live, and newsletter collection ignores the plan

- **Where:** rls.sql:530-532 (app_user UPDATE(status)), rls.sql:716-720 (subscribe_catalogue_newsletter eligibility); app-changes.md:557, :1086-1098 (updateItemStatus); components/catalogue/view/CatalogueFooter.tsx:148
- **Problem:** - **Downgrade keeps features:** applyPlanToCatalogue and assertContentWithinPlan run only on create, update and publish. After a Premium→Starter downgrade (Paddle cancel), up to 50 active catalogues keep custom code and branding.
- **Re-activation skips plan checks:** updateItemStatus re-activation checks only traffic.
- **Newsletter signup ignores the plan:** the definer accepts signups whenever `footer.newsletter = true`, regardless of the owner's plan `newsletter` feature. The UI shows the form only when `footer.type === 'custom'`, but the definer does not check that, so direct action calls collect subscribers for catalogues that show no form.
- **Evidence:** - CatalogueFooter.tsx:148: `type === "custom" && activeData?.footer.newsletter`.
- rls.sql:720 checks only `(c.footer -> 'newsletter') = 'true'::jsonb`.
- rls-design.md:1248 lists this as open.
- **Fix:** - In the Paddle cancel/downgrade handler (asAdmin), apply the new plan: deactivate over-quota catalogues and strip features from header/footer.
- Run applyPlanToCatalogue on re-activation.
- Snapshot entitlements into a DB column written only by admin (e.g. `users.features jsonb`), so the newsletter definer can require the `newsletter` feature and footer.type='custom'.

### [low] Size ceilings cover only 4 columns, and their VALIDATE is bundled into the perimeter migration

- **Where:** rls.sql:329-336 (03 CHECKs), rls.sql:530-532 (app_user UPDATE columns), rls.sql:945-948 (06 validate)
- **Problem:** - **Uncapped columns:** app_user can write appearance (custom CSS), legal, contact, header, footer, partners, metadata and tags with no DB size limit. Only content, colors, config and cookie_preferences are capped. The normal path is bounded by Next's 1 MB server-action body limit (no serverActions.bodySizeLimit in next.config.ts), but the stated goal 'invariants that survive app bugs' is not met, and oversized appearance or metadata is mirrored to Redis and ISR.
- **Validation coupled to the perimeter:** 06 runs VALIDATE on the size caps, so a single oversized PROD row makes the security-critical perimeter migration fail and roll back.
- **Existing oversized rows become unwritable:** NOT VALID CHECKs are still enforced on every UPDATE of an existing oversized row, which also fails the worker's bulk `update catalogues set status='inactive' where created_by=…`.
- **Evidence:** - rls.sql:329: `check (pg_column_size(content) < 1048576) not valid`, with no equivalent for other jsonb columns.
- rls.sql:945-948 VALIDATE statements inside MIGRATION 06.
- **Fix:** - Add a row-level cap, e.g. `check (pg_column_size(appearance)+pg_column_size(header)+… < N)`, or a cap per column.
- Move all VALIDATE statements to a separate migration applied after the PROD audit, so 06 contains only perimeter changes.

### [low] No DB check on the catalogue slug format

- **Where:** rls.sql:529 (table-level INSERT for app_user), rls.sql:320-323 (only a status CHECK); data-access.md:60
- **Problem:** Slugs are public URLs, Redis keys and revalidate tags, but nothing in the DB constrains `catalogues.name`. A code path that skips `toSlug` (duplicateItem built candidates from the client-supplied name) can create mixed-case or unicode lookalike slugs (e.g. /catalogues/Victim-Menu next to victim-menu), or names containing ':' that collide in the `${prefix}:catalogue:${name}` key space. This is the kind of structural invariant the decision says belongs in the DB.
- **Evidence:** TEST read-only check: all current catalogue names match `^[a-z0-9-]+$`, so a CHECK constraint would validate cleanly on TEST.
- **Fix:** `alter table public.catalogues add constraint catalogues_name_slug check (name ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(name) <= 64) not valid;` then VALIDATE after the PROD audit.

### [low] Newsletter email regex allows CSV-formula payloads; legacy forged subscriber rows are not cleaned

- **Where:** rls.sql:712-713 and :742-743 (email regex); components/dashboard/overview/NewsletterTable.tsx:29; rls.sql:350-362 (03 newsletter dedupe)
- **Problem:** - **Formula injection:** `^[^@\s]+@[^@\s]+\.[^@\s]+$` accepts `=HYPERLINK("https://evil","x")@a.io` and quotes. The owner's CSV export wraps values in `"${v}"` without escaping quotes or neutralising a leading `=`, `+`, `-` or `@`, so an anonymous visitor can plant a spreadsheet formula in the owner's export.
- **Legacy forged rows:** rows injected with a forged owner_id (possible today through the client-trusted ownerId) remain in victims' subscriber lists, because migration 03 dedupes but never removes rows where owner_id differs from the catalogue owner.
- **Evidence:** - NewsletterTable.tsx:29: `const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");`
- TEST: 0 forged-owner rows (read-only check); PROD unverified.
- **Fix:** - Tighten the regex, e.g. `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$`.
- Escape `"` as `""` and prefix a `'` to cells starting with `=`, `+`, `-` or `@` in the export.
- In 03, back up and then run `delete from public.newsletter n using public.catalogues c where c.id = n.catalogue_id and c.created_by <> n.owner_id`.

### [low] Perimeter guarantees are checked only on the local CI stack, and the supautils argument is overstated

- **Where:** rls-design.md:680-785 (00_perimeter.test.sql), rls-design.md:947; decision §3 ('supautils.reserved_memberships includes authenticator')
- **Problem:** - **Misread setting:** on TEST, `supautils.reserved_memberships` lists roles whose membership cannot be granted to others (pg_read_server_files, …, authenticator). That stops `GRANT authenticator TO x`; it does not obviously stop `GRANT app_user TO authenticator` (unverified).
- **Drift source:** TEST pg_default_acl gives anon/authenticated ALL on any object `supabase_admin` creates in public/graphql/graphql_public.
- **No hosted check:** all perimeter assertions run only in CI on a fresh local stack. Drift on hosted TEST/PROD (Studio edits, extension installs, a manual grant, a new migration table without RLS) goes undetected until someone looks.
- **Evidence:** - TEST: `current_setting('supautils.reserved_memberships')` = 'pg_read_server_files, pg_write_server_files, pg_execute_server_program, supabase_admin, …, authenticator'.
- TEST pg_default_acl: supabase_admin/public r {anon=arwdDxtm, authenticated=arwdDxtm, …}.
- **Fix:** - Run the 00_perimeter catalog queries (read-only) and the PostgREST curl matrix against TEST and PROD after every deploy and on a daily schedule, and alert on any non-empty result.
- Drop the supautils claim from the rationale; rely on the explicit pg_has_role assertions.

### [low] Import guardrails match alias strings only; admin access can leak through relative imports, re-exports and 'use server' modules

- **Where:** rls-design.md:604-627 (Biome noRestrictedImports paths), :647-656 (imports() regex in db-boundaries.test.ts), :636 (SCAN list)
- **Problem:** - **Alias-only matching:** both guards match the literal specifier `@/utils/db/admin`. A relative import (`../db/admin`), dynamic `import()` or `require` passes both.
- **Re-exports:** allow-listed modules (`lib/users/provision.ts`, all of `utils/paddle/**`, `actions/account.ts`) can re-export asAdmin-backed helpers that any module may import.
- **'use server' exposure:** `actions/account.ts` is a 'use server' file, so every export there is a public RPC. An exported helper that takes a user id would be a BYPASSRLS IDOR.
- **Unscanned files:** SCAN omits root files (middleware.ts, instrumentation.ts).
- **Evidence:** rls-design.md:648: `new RegExp(`from\\s+["']${mod…}["']`)` on the alias string.
- **Fix:** - Build the check on the resolved module graph (dependency-cruiser or the TS compiler API) and include root files.
- Forbid any module that transitively imports utils/db/admin from also containing 'use server'.
- Require admin-backed exports to take a VerifiedIdentity or a webhook event, never a raw user id.

### [low] Refund-on-no-op makes chat-only agent turns unlimited for any user below their limit

- **Where:** rls.sql:855-873 (refund_ai_turn); rls-design.md:1100-era agent flow (decision §10 onFinish refund when session.applied is empty and no plan)
- **Problem:** Every charged turn that applies nothing and creates no plan is refunded. Users steer this through the prompt (questions, edits the model knows will be rejected), which gives unlimited ~50s DeepSeek generations whose text they can copy by hand. This matches today's intent, but it is uncapped cost exposure, and the ledger now makes it measurable.
- **Evidence:** - app/api/agent/route.ts:112-116 comment: 'a question … stays free'.
- rls.sql:866-869: refund allowed whenever continuations = 0 and the turn is < 10 min old.
- **Fix:** Cap refunds, e.g. in refund_ai_turn count this month's refunded rows per user and stop refunding after N. Or charge a fractional unit for no-op turns.

### [low] FOR UPDATE on users for plan/charge serialisation blocks FK key-share locks

- **Where:** rls.sql:813 (`perform 1 from public.users u where u.id = v_uid for update`); rls-design.md:473 (getPlanForUpdate `.for("update")`)
- **Problem:** FOR UPDATE conflicts with the FOR KEY SHARE locks taken by FK checks. While a user's start transaction holds it, every insert or key update that references that users row waits: catalogues, user_themes, prompts, the worker's analytics upsert for that user, Paddle writes. `lock_timeout` 1-3s turns that contention into 55P03 errors under concurrency (agent start and theme save from two tabs).
- **Evidence:** PostgreSQL row-lock conflict table: FOR UPDATE conflicts with FOR KEY SHARE; FOR NO KEY UPDATE does not, but still conflicts with itself.
- **Fix:** Use `FOR NO KEY UPDATE` in both begin_ai_turn and getPlanForUpdate (Drizzle: `.for("no key update")`). It still serialises charges per user.

### [low] M4 sync records data the user never confirmed (email change without confirmation, default consents)

- **Where:** rls.sql:1091-1093 and :1107-1109 (email sync), rls.sql:1080-1084 (consents fallback); identity-cutover.md:1176 (mailer_secure_email_change_enabled unverified)
- **Problem:** - **Email sync:** the comment assumes GoTrue writes auth.users.email only after the change is confirmed. That holds only if email confirmation / secure email change is enabled on each project. With autoconfirm, a user can point public.users.email at any address, which then feeds Brevo contact creation and transactional mail (cancellation emails) to third parties.
- **Consents:** OAuth sign-ups without consents metadata get the column default (all three consents = true) without ever seeing the consent UI.
- **Evidence:** - TEST column default: `consents` = '{"refund-policy": true, "privacy-policy": true, "terms-and-conditions": true}'.
- identity-cutover.md:1176 lists mailer_secure_email_change_enabled as to-confirm.
- **Fix:** - Assert `mailer_autoconfirm=false` and `mailer_secure_email_change_enabled=true` on both projects before enabling sign-ups (a Management API GET in the cutover checklist).
- Change the consents column default to all-false (or null plus an /auth/consent gate), so missing metadata never records consent.

