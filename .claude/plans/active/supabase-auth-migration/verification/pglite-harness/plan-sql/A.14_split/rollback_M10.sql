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
