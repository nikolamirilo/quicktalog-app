-- ============================================================================
-- Quicktalog — privilege lockdown + schema defect fixes
--
-- Context:
--   * RLS is intentionally NOT enabled and is not planned. That makes the
--     GRANT layer the ONLY thing standing between the public `anon` key and
--     the data, so the grants have to be exact.
--   * The Next.js app talks to PostgREST with SUPABASE_ANON_KEY (server-side
--     only — there is no browser Supabase client and no Supabase Auth), so
--     every app query executes as `anon`.
--   * The Cloudflare worker (quicktalog-backend) uses SUPABASE_SERVICE_ROLE_KEY
--     for everything, so `service_role` keeps full access.
--   * Catalogue/theme/qr/prompt/newsletter writes in the app go through Drizzle
--     over DATABASE_URL (role `postgres`), NOT through PostgREST, so those
--     tables need no `anon` privileges at all.
--   * `authenticated` is never used anywhere in the codebase (auth is Clerk).
--
-- No application code changes are required by this migration.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Blanket revoke from anon + authenticated
--
-- Today every table and view in `public` is `GRANT ALL` to anon, authenticated
-- and service_role. `ALL` includes TRUNCATE, REFERENCES and TRIGGER — i.e. the
-- anon key can currently truncate `users`. Start from zero, then hand back only
-- what the app actually calls.
-- ----------------------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "anon", "authenticated";
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon", "authenticated";

-- `authenticated` gets nothing back. Schema USAGE is left in place only so
-- PostgREST can still introspect; with no object privileges it can read nothing.

-- service_role is the backend's identity — make sure it is whole, including on
-- `user_themes`, which was created outside this migration history.
GRANT ALL ON ALL TABLES IN SCHEMA "public" TO "service_role";
GRANT ALL ON ALL SEQUENCES IN SCHEMA "public" TO "service_role";
GRANT ALL ON ALL FUNCTIONS IN SCHEMA "public" TO "service_role";


-- ----------------------------------------------------------------------------
-- 2. Minimum privileges handed back to anon
--
-- Each grant below is justified by a specific call site. Anything not listed
-- here is now unreachable with the anon key.
-- ----------------------------------------------------------------------------

-- users
--   SELECT  utils/paddle/get-customer-id.ts, utils/paddle/process-webhook.ts,
--           app/api/subscriptions/check/route.ts
--   INSERT  lib/users/syncFromClerk.ts (upsertUser, Clerk user.created)
--   UPDATE  lib/users/syncFromClerk.ts, utils/paddle/process-webhook.ts
--   DELETE  server_actions/users.ts (Clerk user.deleted)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."users" TO "anon";

-- catalogues
--   SELECT  app/api/items/route.ts (GET), app/api/items/[name]/route.ts,
--           app/api/analytics/route.ts
--   INSERT  app/api/items/route.ts (POST)
--   UPDATE  app/api/items/route.ts (PATCH)
--   No DELETE: catalogue deletion runs through Drizzle in server_actions/catalogue.ts.
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."catalogues" TO "anon";

-- subscriptions
--   SELECT + INSERT + UPDATE: utils/paddle/process-webhook.ts performs a
--   merge-upsert on subscription_id, which PostgREST executes as
--   INSERT ... ON CONFLICT DO UPDATE and therefore needs both verbs.
GRANT SELECT, INSERT, UPDATE ON TABLE "public"."subscriptions" TO "anon";

-- analytics
--   SELECT  app/api/dashboard/analytics/route.ts, and the body of
--           get_pageview_totals() (SECURITY INVOKER).
--   INSERT  app/api/analytics/route.ts and /all — both use
--           ignoreDuplicates: true, i.e. ON CONFLICT DO NOTHING, so UPDATE is
--           not required. If either is ever switched to a merge upsert
--           (ignoreDuplicates: false), UPDATE must be granted here too.
GRANT SELECT, INSERT ON TABLE "public"."analytics" TO "anon";

-- newsletter
--   SELECT only — app/api/dashboard/analytics/route.ts does a head count.
--   Signup inserts go through Drizzle in server_actions/newsletter.ts.
GRANT SELECT ON TABLE "public"."newsletter" TO "anon";

-- job_logs
--   INSERT only — app/api/analytics/{route,all/route}.ts write job records and
--   never read them back (no .select() chained), so SELECT is not needed.
GRANT INSERT ON TABLE "public"."job_logs" TO "anon";
GRANT USAGE ON SEQUENCE "public"."job_logs_id_seq" TO "anon";

-- Deliberately left with ZERO anon privileges:
--   plans, ocr, prompts, qr_configs, product_newsletter, user_themes
--     -> only ever touched by Drizzle (postgres) or the worker (service_role).
--   contacts, active_subscriptions
--     -> CRM export views containing every user's email, name and Paddle
--        customer id. Nothing in the app reads them over PostgREST.


-- ----------------------------------------------------------------------------
-- 3. Function privileges
-- ----------------------------------------------------------------------------

-- Trigger function, SECURITY DEFINER, reads service_role_key out of Vault.
-- It was exposed at /rest/v1/rpc/call_edge_function_with_vault_secret to both
-- anon and authenticated (Supabase lints 0028 / 0029). Trigger functions only
-- need EXECUTE at CREATE TRIGGER time, not at fire time, so revoking here does
-- not affect the users/subscriptions webhook triggers.
REVOKE ALL ON FUNCTION "public"."call_edge_function_with_vault_secret"()
    FROM PUBLIC, "anon", "authenticated";

-- app/api/subscriptions/check/route.ts calls this over the anon key.
-- It is SECURITY INVOKER and only reads `analytics`, which anon can already
-- SELECT, so keeping EXECUTE here grants no additional reach.
REVOKE ALL ON FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone)
    FROM PUBLIC, "authenticated";
GRANT EXECUTE ON FUNCTION "public"."get_pageview_totals"("start_date" timestamp with time zone, "end_date" timestamp with time zone)
    TO "anon";


-- ----------------------------------------------------------------------------
-- 4. Default privileges
--
-- `user_themes` was created recently and silently inherited GRANT ALL for anon
-- and authenticated from these defaults. Stop that from happening again — new
-- tables must be granted explicitly from now on.
-- ----------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
    REVOKE ALL ON TABLES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
    REVOKE ALL ON SEQUENCES FROM "anon", "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public"
    REVOKE ALL ON FUNCTIONS FROM "anon", "authenticated";


-- ----------------------------------------------------------------------------
-- 5. Views: SECURITY DEFINER -> SECURITY INVOKER
--
-- Both views are owned by postgres, so they ran with postgres' permissions
-- regardless of the caller (Supabase lint 0010). With security_invoker on they
-- run with the caller's permissions, which means the revoke in section 1
-- actually holds for them.
-- ----------------------------------------------------------------------------
ALTER VIEW "public"."contacts" SET (security_invoker = on);
ALTER VIEW "public"."active_subscriptions" SET (security_invoker = on);


-- ----------------------------------------------------------------------------
-- 6. analytics_upsert_trigger
--
-- The trigger was BEFORE UPDATE ... FOR EACH ROW and unconditionally did
-- NEW.pageview_count = OLD.pageview_count + NEW.pageview_count. It fires on
-- EVERY update, not just conflict resolution, so any ordinary correction to a
-- row silently doubles its counters.
--
-- It is also dead today: both writers (app/api/analytics and the worker's
-- analyticsProcessingJob) upsert with ignoreDuplicates: true, which compiles to
-- ON CONFLICT DO NOTHING and never reaches an UPDATE. Dropping it is therefore
-- behaviour-neutral for the current code.
--
-- If accumulation is wanted, express it in the statement instead of a trigger:
--   INSERT INTO analytics (...) VALUES (...)
--   ON CONFLICT (date, current_url) DO UPDATE
--     SET pageview_count  = analytics.pageview_count  + EXCLUDED.pageview_count,
--         unique_visitors = analytics.unique_visitors + EXCLUDED.unique_visitors;
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS "analytics_upsert_trigger" ON "public"."analytics";
DROP FUNCTION IF EXISTS "public"."update_analytics_on_conflict"();


-- ----------------------------------------------------------------------------
-- 7. job_logs.log
--
-- quicktalog-backend/src/handlers/analyticsProcessingJob.ts inserts
-- { job_name, status, execution_time_ms, log } but `log` does not exist, so
-- every worker job-log insert fails — and the return value is never checked,
-- so it fails silently. jsonb because the success path writes an object and the
-- failure path writes a string.
-- ----------------------------------------------------------------------------
ALTER TABLE "public"."job_logs" ADD COLUMN IF NOT EXISTS "log" "jsonb";


-- ----------------------------------------------------------------------------
-- 8. users.image default
--
-- The default was the four-character string 'NULL', not SQL NULL, so every user
-- created without an avatar carries a literal "NULL" that reads as a truthy
-- value in the app.
-- ----------------------------------------------------------------------------
ALTER TABLE "public"."users" ALTER COLUMN "image" DROP DEFAULT;
UPDATE "public"."users" SET "image" = NULL WHERE "image" = 'NULL';


-- ----------------------------------------------------------------------------
-- 9. Foreign-key indexes
--
-- There is currently not a single index on any FK column in this schema. Every
-- ON DELETE / ON UPDATE CASCADE from `users`, `catalogues` and `plans` does a
-- sequential scan of each referencing table, and the dashboard's per-user
-- lookups do the same.
-- ----------------------------------------------------------------------------
-- (user_id, date) also serves app/api/dashboard/analytics' filter+sort.
CREATE INDEX IF NOT EXISTS "analytics_user_id_date_idx"
    ON "public"."analytics" ("user_id", "date" DESC);
CREATE INDEX IF NOT EXISTS "catalogues_created_by_idx"
    ON "public"."catalogues" ("created_by");
CREATE INDEX IF NOT EXISTS "newsletter_owner_id_idx"
    ON "public"."newsletter" ("owner_id");
CREATE INDEX IF NOT EXISTS "newsletter_catalogue_id_idx"
    ON "public"."newsletter" ("catalogue_id");
CREATE INDEX IF NOT EXISTS "ocr_user_id_idx"
    ON "public"."ocr" ("user_id");
CREATE INDEX IF NOT EXISTS "ocr_catalogue_idx"
    ON "public"."ocr" ("catalogue");
CREATE INDEX IF NOT EXISTS "prompts_user_id_idx"
    ON "public"."prompts" ("user_id");
CREATE INDEX IF NOT EXISTS "qr_configs_catalogue_idx"
    ON "public"."qr_configs" ("catalogue");
CREATE INDEX IF NOT EXISTS "subscriptions_customer_id_idx"
    ON "public"."subscriptions" ("customer_id");
CREATE INDEX IF NOT EXISTS "subscriptions_price_id_idx"
    ON "public"."subscriptions" ("price_id");
CREATE INDEX IF NOT EXISTS "users_plan_id_idx"
    ON "public"."users" ("plan_id");
-- user_themes.user_id is already covered by user_themes_user_id_name_key.


-- ----------------------------------------------------------------------------
-- 10. pg_cron job "Sync Plans": hard-coded service_role JWT -> Vault
--
-- The job body embedded the service_role key in plaintext inside
-- cron.job.command. Read it from Vault instead, matching the pattern already
-- used by call_edge_function_with_vault_secret(). cron.schedule() replaces a
-- job of the same name in place, so the jobid and schedule are preserved.
--
-- ACTION REQUIRED OUTSIDE THIS MIGRATION: rotate the service_role key in the
-- Supabase dashboard (Settings -> API -> JWT keys), update the Vault secret
-- `service_role_key`, and update SUPABASE_SERVICE_ROLE_KEY in the Cloudflare
-- worker. The old key has been sitting in cleartext in the database.
-- ----------------------------------------------------------------------------
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM "pg_extension" WHERE "extname" = 'pg_cron') THEN
    PERFORM "cron"."schedule"(
      'Sync Plans',
      '0 8 */3 * *',
      $job$
      select net.http_post(
        url := 'https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1/sync-available-plans',
        headers := jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'service_role_key'
            limit 1
          )
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      );
      $job$
    );
  END IF;
END
$do$;


-- ----------------------------------------------------------------------------
-- 11. Make PostgREST pick up the new privileges immediately.
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
