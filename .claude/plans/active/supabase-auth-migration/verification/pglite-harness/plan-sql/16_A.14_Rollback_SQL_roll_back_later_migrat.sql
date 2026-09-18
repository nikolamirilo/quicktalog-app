-- M13: irreversible (backups dropped, map minimised).
-- M12: alter table public.users drop constraint if exists users_id_is_uuid;   (then re-add NOT VALID if still needed)
-- R1:  A.R2, only while Clerk is still available.

-- M10: keep disable_signup = true. Hosted Supabase lets postgres drop triggers on auth.users through
-- supautils.drop_trigger_grants (TEST); check it first on that project:
--   select setting from pg_settings where name = 'supautils.drop_trigger_grants';
-- If auth.users is listed for postgres, drop the triggers (not PGlite-verified; local stack and TEST first):
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop trigger if exists on_auth_user_updated on auth.users;
--   drop trigger if exists on_auth_user_deleted on auth.users;
-- Otherwise (and in PGlite, which has no supautils) neutralise the functions:
create or replace function private.handle_auth_user_created() returns trigger
  language plpgsql security definer set search_path = '' as $$ begin return new; end $$;
create or replace function private.handle_auth_user_updated() returns trigger
  language plpgsql security definer set search_path = '' as $$ begin return new; end $$;
create or replace function private.handle_auth_user_deleted() returns trigger
  language plpgsql security definer set search_path = '' as $$ begin return old; end $$;
drop function if exists private.create_user_row(uuid, text, jsonb, jsonb, boolean);   -- CHANGE W1
-- Consent default: restore only on legal instruction
-- alter table public.users alter column consents set default '{"refund-policy": true, "privacy-policy": true, "terms-and-conditions": true}'::jsonb;

-- M09: re-run the M02 body of public.call_edge_function_with_vault_secret() and the M02 cron DO block.

-- M08: set DB_CONNECTION_STRING back to postgres.<ref>, redeploy, wait for drain, then:
select pg_catalog.pg_terminate_backend(pid) from pg_catalog.pg_stat_activity where usename = 'app_rls';
drop role if exists app_rls;

-- M07:
alter table public.catalogues drop constraint if exists catalogues_name_slug;
alter table public.catalogues drop constraint if exists catalogues_other_json_size;
-- (size checks stay; validation is harmless)

-- M06: re-run the M05 definitions of begin_ai_turn(text, integer, boolean) and refund_ai_turn(uuid), then:
drop function if exists private.begin_ai_turn(text, integer, text, uuid, text);
drop function if exists private.set_plan_state(uuid, boolean, integer, text);
-- prompts columns kind/plan_* may stay (defaults are harmless).

-- M05:
drop function if exists private.refund_ai_turn(uuid);
drop function if exists private.begin_ai_turn(text, integer, boolean);
drop function if exists private.my_usage();
drop function if exists private.subscribe_product_newsletter(text);
drop function if exists private.subscribe_catalogue_newsletter(uuid, text);
drop function if exists private.catalogue_name_available(text);

-- M04 (RLS stays on: M00 owns that):
drop trigger if exists catalogues_pin_insert        on public.catalogues;
drop trigger if exists catalogues_touch_updated_at  on public.catalogues;
drop trigger if exists qr_configs_touch_updated_at  on public.qr_configs;
drop trigger if exists user_themes_touch_updated_at on public.user_themes;
drop function if exists private.catalogues_pin_insert();
drop function if exists private.touch_updated_at();
drop policy if exists users_select_self        on public.users;
drop policy if exists users_update_self        on public.users;
drop policy if exists catalogues_select_owner  on public.catalogues;
drop policy if exists catalogues_insert_owner  on public.catalogues;
drop policy if exists catalogues_update_owner  on public.catalogues;
drop policy if exists catalogues_delete_owner  on public.catalogues;
drop policy if exists catalogues_select_public on public.catalogues;
drop policy if exists qr_configs_owner         on public.qr_configs;
drop policy if exists user_themes_owner        on public.user_themes;
drop policy if exists analytics_select_owner   on public.analytics;
drop policy if exists prompts_select_owner     on public.prompts;
drop policy if exists ocr_select_owner         on public.ocr;
drop policy if exists newsletter_select_owner  on public.newsletter;
revoke all on public.users, public.catalogues, public.qr_configs, public.user_themes,
              public.analytics, public.prompts, public.ocr, public.newsletter
  from app_user, app_public;

-- M03: the ledger defects (UNIQUE(catalogue), ON DELETE CASCADE, nullable user_id) are NOT restored.
alter table public.catalogues  drop constraint if exists catalogues_status_check;
alter table public.catalogues  drop constraint if exists catalogues_content_size;
alter table public.user_themes drop constraint if exists user_themes_colors_size;
alter table public.qr_configs  drop constraint if exists qr_configs_config_size;
alter table public.users       drop constraint if exists users_cookie_prefs_size;
-- Restore deduped or forged rows only if they are really wanted back:
-- insert into public.newsletter select * from private.backup_newsletter_dupes;   (drop newsletter_catalogue_email_key first)
-- insert into public.newsletter select * from private.backup_newsletter_forged_owner;

-- M02: only if M02 misbehaves on PROD (re-introduces TEST->PROD posting): recreate the function body from
-- 20260911213819_remote_schema.sql:55-88, the unnarrowed Brevo trigger, and the cron DO block from
-- 20260912093000_lockdown_privileges_and_schema_fixes.sql:242-267; delete from private.settings where key = 'edge_functions_base_url'.

-- M01 (CHANGE W4) cannot be rolled back once M10 is applied: the auth.users triggers depend on
-- private.handle_auth_user_*() (leave roles and schema in place; dropping the triggers first is possible only where
-- supautils allows it, see M10 above). Before M10, after M02-M09 are rolled back (export private.paddle_events /
-- paddle_unresolved_events first if they are still needed):
drop table if exists private.paddle_events, private.paddle_unresolved_events,
  private.backup_newsletter_dupes, private.backup_product_newsletter_dupes, private.backup_qr_configs_dupes,
  private.backup_prompts_null_user, private.backup_ocr_null_user, private.backup_newsletter_forged_owner;
drop function if exists private.current_user_id();
drop table if exists private.settings;
alter default privileges for role postgres grant execute on functions to public;
drop schema if exists private;
drop role if exists app_public;
drop role if exists app_user;

-- M00: prefer rolling the app forward. If one missed anon path must work again while RLS stays on,
-- re-grant only that privilege and add a temporary permissive policy for it, for example:
grant select on public.catalogues to anon;
create policy tmp_rollback_anon_catalogues_select on public.catalogues for select to anon using (true);
notify pgrst, 'reload schema';
-- Never "disable row level security": once M04 exists that would let app_user read every row.
