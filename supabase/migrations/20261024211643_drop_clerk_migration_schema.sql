-- Removes what the Clerk -> Supabase Auth cutover left in the database.
--
-- Run scripts/paddle/rewrite-legacy-custom-data.ts on this environment FIRST:
-- it reads migration.clerk_user_map, the only record of which Clerk id became
-- which uuid, and that table is dropped here.

-- 1. The auth.users triggers stop consulting the map. Imported users already
-- have their row, and the insert's ON CONFLICT covers any that do not.
-- CREATE OR REPLACE keeps the owner and the ACL.
create or replace function private.create_user_row(p_id uuid, p_email text, p_user_meta jsonb, p_app_meta jsonb, p_is_anonymous boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta     jsonb := coalesce(p_user_meta, '{}'::jsonb);
  v_plan     text;
  v_terms    text;
  v_accepted boolean;
begin
  if coalesce(p_is_anonymous, false) then
    return;
  end if;

  select s.value into v_plan from private.settings s where s.key = 'default_plan_id';
  if v_plan is null then
    raise exception 'private.settings.default_plan_id is not set' using errcode = 'P0001';
  end if;
  select s.value into v_terms from private.settings s where s.key = 'terms_version';
  v_accepted := coalesce(v_terms is not null and (v_meta ->> 'terms_version') = v_terms, false);

  insert into public.users (id, email, name, image, plan_id, consents)
  values (
    p_id::text,
    pg_catalog.lower(p_email),
    private.display_name_from_meta(v_meta),
    private.avatar_from_meta(v_meta),
    v_plan,
    pg_catalog.jsonb_build_object(
      'terms-and-conditions', v_accepted,
      'privacy-policy',       v_accepted,
      'refund-policy',        v_accepted,
      'version',              case when v_accepted then v_terms end,
      'accepted_at',          case when v_accepted then pg_catalog.now() end,
      'source',               'signup'))
  on conflict (id) do nothing;
end;
$$;

create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- The row waits for a confirmed address; handle_auth_user_updated creates it then.
  if new.email is not null and new.email_confirmed_at is null then
    return new;
  end if;
  perform private.create_user_row(new.id, new.email, new.raw_user_meta_data, new.raw_app_meta_data, new.is_anonymous);
  return new;
end;
$$;

-- actions/account.ts cancels Paddle before deleting the auth user; FK cascades
-- remove the owned rows.
create or replace function private.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.users u where u.id = old.id::text;
  return old;
end;
$$;

-- 2. Integrity backups taken before the cutover's dedupe work.
drop table if exists private.backup_newsletter_dupes;
drop table if exists private.backup_product_newsletter_dupes;
drop table if exists private.backup_qr_configs_dupes;
drop table if exists private.backup_prompts_null_user;
drop table if exists private.backup_ocr_null_user;
drop table if exists private.backup_newsletter_forged_owner;

-- 3. The cutover schema. No CASCADE: anything unexpected left in it should
-- stop the migration rather than disappear unseen.
drop table if exists migration.pre_remap_counts;
drop table if exists migration.t0_password_digests;
drop table if exists migration.auth_user_deletions;
drop table if exists migration.cutover_log;
drop table if exists migration.clerk_user_map;
drop schema if exists migration;
