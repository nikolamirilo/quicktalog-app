-- Verified core: the map-based skip (PATCH P5), trigger functions in `private` firing for supabase_auth_admin,
-- anonymous skip, missing-plan failure, delete cascade (PGlite G7/scenario 08).
-- CHANGE C11 (PGlite-verified, final run): one reconciled auth-sync migration replacing the two earlier drafts
-- (not included) - map columns and statuses, consent contract via terms_version (coalesce to false), Google-only
-- avatars, no name sync from user_metadata, legacy consent marker, deletion log, welcome/consent/terms definers.
-- CHANGE W1 and W2 (PGlite-verified, final run): rows only for confirmed email addresses; deletions mark the map row.
-- Sign-ups and anonymous sign-ins must stay DISABLED on the project. A failing AFTER INSERT trigger on auth.users
-- blocks EVERY sign-up ("Database error saving new user").
-- postgres does not own auth.users. On hosted Supabase it may DROP TRIGGER there through
-- supautils.drop_trigger_grants (TEST); PGlite has no supautils and returns 42501, so trigger DDL on auth.users is
-- verified on the local stack and TEST only. Prefer CREATE OR REPLACE FUNCTION for behaviour changes; before a
-- re-run of this migration, drop the three triggers first (drop trigger if exists ... on auth.users).

-- 10.1 Per-project settings (terms_version is inserted by an operator per project after legal sign-off)
insert into private.settings (key, value)
select 'default_plan_id', p.id
  from public.plans p
 where p.id = 'pri_01k27ajepm199twd1x77rpwdrq'
on conflict (key) do nothing;

-- 10.2 Migration schema (must exist before the sign-up trigger)
create schema if not exists migration;
alter schema migration owner to postgres;
revoke all on schema migration from public;

create table if not exists migration.clerk_user_map (
  clerk_user_id          text primary key check (clerk_user_id ~ '^user_[A-Za-z0-9]+$'),
  supabase_user_id       uuid not null unique,
  origin                 text not null default 'import' check (origin in ('import', 'rollback_push')),
  status                 text not null default 'claimed'
                         check (status in ('claimed', 'migrated', 'conflict', 'skipped', 'error', 'deleted')),
  email                  text,
  email_verified         boolean,
  password_imported      boolean not null default false,
  password_hasher        text,
  google_sub             text,
  avatar_url             text,
  cookie_consent         jsonb,
  mfa_enabled            boolean not null default false,
  banned                 boolean not null default false,
  owns_data              boolean not null default false,
  clerk_created_at       timestamptz,
  clerk_last_sign_in_at  timestamptz,
  detail                 text,
  updated_at             timestamptz not null default now()
);
create table if not exists migration.auth_user_deletions (
  supabase_user_id uuid primary key,
  clerk_user_id    text,
  deleted_at       timestamptz not null default now()
);
create table if not exists migration.cutover_log (
  id     bigint generated always as identity primary key,
  at     timestamptz not null default now(),
  step   text not null,
  detail jsonb
);
alter table migration.clerk_user_map      owner to postgres;
alter table migration.auth_user_deletions owner to postgres;
alter table migration.cutover_log         owner to postgres;
revoke all on table migration.clerk_user_map, migration.auth_user_deletions, migration.cutover_log from public;

-- 10.3 users columns and consent default (legal sign-off: section 14 input 14)
alter table public.users add column if not exists welcome_email_sent_at timestamptz;
alter table public.users alter column consents set default
  '{"terms-and-conditions": false, "privacy-policy": false, "refund-policy": false, "source": "default"}'::jsonb;
-- Existing rows carry the old all-true default that nobody actively gave; mark them so CRM exports treat them as unknown.
-- consents is not in the Brevo trigger column list, so this update sends no webhooks.
update public.users
   set consents = coalesce(consents, '{}'::jsonb) || '{"source": "legacy_default"}'::jsonb
 where not (coalesce(consents, '{}'::jsonb) ? 'source');

-- 10.4 Metadata normalisers (user_metadata is user-writable: cosmetic only, capped). No {m,n} above 255.
create or replace function private.display_name_from_meta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.left(pg_catalog.btrim(coalesce(p_meta ->> 'full_name', p_meta ->> 'name', '')), 200)
$$;

create or replace function private.avatar_from_meta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
           when v ~ '^https://lh[0-9]+\.googleusercontent\.com/\S*$' and pg_catalog.length(v) <= 2048 then v
           else null
         end
    from (select coalesce(p_meta ->> 'avatar_url', p_meta ->> 'picture') as v) s
$$;

-- 10.5 Row creation on sign-up
-- CHANGE W1: the row, and with it the Brevo/CRM webhook, exists only for a confirmed email address. An unconfirmed
-- email sign-up gets its row when GoTrue sets email_confirmed_at (handle_auth_user_updated below).
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
  -- PATCH P5: imported Clerk users are claimed in the map BEFORE admin.createUser; GoTrue writes app_metadata in a
  -- later UPDATE, so the app_metadata check alone never matches at INSERT time.
  if exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = p_id) then
    return;
  end if;
  if coalesce(p_app_meta, '{}'::jsonb) ? 'clerk_user_id' then
    return;
  end if;
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
  -- PATCH P5 (kept inline: the import script guard greps this definition for clerk_user_map)
  if exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = new.id) then
    return new;
  end if;
  if new.email is not null and new.email_confirmed_at is null then   -- CHANGE W1
    return new;
  end if;
  perform private.create_user_row(new.id, new.email, new.raw_user_meta_data, new.raw_app_meta_data, new.is_anonymous);
  return new;
end;
$$;

-- 10.6 Email sync and avatar fill (no name sync: users edit names in-app and it would amplify Brevo calls)
create or replace function private.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_img text;
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then   -- CHANGE W1
    perform private.create_user_row(new.id, new.email, new.raw_user_meta_data, new.raw_app_meta_data, new.is_anonymous);
  end if;
  -- auth.users.email changes only after confirmation when mailer_autoconfirm=false and secure email change are on
  -- (asserted in the section 8 go/no-go).
  if new.email is distinct from old.email and new.email is not null then
    update public.users u set email = pg_catalog.lower(new.email) where u.id = new.id::text;
  end if;
  if new.raw_user_meta_data is distinct from old.raw_user_meta_data then
    v_img := private.avatar_from_meta(coalesce(new.raw_user_meta_data, '{}'::jsonb));
    if v_img is not null then
      update public.users u set image = v_img where u.id = new.id::text and u.image is null;
    end if;
  end if;
  return new;
end;
$$;

-- 10.7 Deletion. actions/account.ts cancels Paddle BEFORE authAdmin().deleteUser (hard delete). FK cascades remove
-- owned rows and subscriptions (via customer_id). The log lets a rollback delete the matching Clerk user.
create or replace function private.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into migration.auth_user_deletions (supabase_user_id, clerk_user_id)
  values (old.id, (select m.clerk_user_id from migration.clerk_user_map m where m.supabase_user_id = old.id))
  on conflict (supabase_user_id) do nothing;
  -- CHANGE W2: a deleted account must not stay 'migrated' in the map, or the re-cutover A.R1 precondition
  -- 'map rows marked migrated without an auth.users row' blocks after a rollback drill with a deletion.
  update migration.clerk_user_map m set status = 'deleted', updated_at = pg_catalog.now()
   where m.supabase_user_id = old.id and m.status <> 'deleted';
  delete from public.users u where u.id = old.id::text;
  return old;
end;
$$;

-- 10.8 App-callable definers
create or replace function private.current_terms_version()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select s.value from private.settings s where s.key = 'terms_version'
$$;

create or replace function private.claim_welcome_email()
returns table (email text, name text)
language sql
volatile
security definer
set search_path = ''
as $$
  update public.users u
     set welcome_email_sent_at = pg_catalog.now()
   where u.id = private.current_user_id()
     and u.welcome_email_sent_at is null
  returning u.email, u.name
$$;

create or replace function private.record_consents(p_version text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid text := private.current_user_id();
begin
  if v_uid is null then
    raise exception 'record_consents: no verified identity' using errcode = '42501';
  end if;
  if p_version is null or p_version is distinct from (select s.value from private.settings s where s.key = 'terms_version') then
    raise exception 'record_consents: stale terms version' using errcode = '22023';
  end if;
  update public.users u
     set consents = pg_catalog.jsonb_build_object(
           'terms-and-conditions', true, 'privacy-policy', true, 'refund-policy', true,
           'version', p_version, 'accepted_at', pg_catalog.now(), 'source', 'gate')
   where u.id = v_uid;
end;
$$;

-- 10.9 Ownership and EXECUTE
alter function private.display_name_from_meta(jsonb)  owner to postgres;
alter function private.avatar_from_meta(jsonb)        owner to postgres;
alter function private.create_user_row(uuid, text, jsonb, jsonb, boolean) owner to postgres;   -- CHANGE W1
alter function private.handle_auth_user_created()     owner to postgres;
alter function private.handle_auth_user_updated()     owner to postgres;
alter function private.handle_auth_user_deleted()     owner to postgres;
alter function private.current_terms_version()        owner to postgres;
alter function private.claim_welcome_email()          owner to postgres;
alter function private.record_consents(text)          owner to postgres;
revoke all on function
  private.display_name_from_meta(jsonb), private.avatar_from_meta(jsonb),
  private.create_user_row(uuid, text, jsonb, jsonb, boolean),
  private.handle_auth_user_created(), private.handle_auth_user_updated(), private.handle_auth_user_deleted(),
  private.current_terms_version(), private.claim_welcome_email(), private.record_consents(text)
from public;
grant execute on function private.claim_welcome_email(), private.record_consents(text) to app_user;
grant execute on function private.current_terms_version() to app_user, app_public;

-- 10.10 Triggers (postgres holds TRIGGER on auth.users; TEST has none yet)
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_auth_user_created();
create trigger on_auth_user_updated
  after update of email, email_confirmed_at, raw_user_meta_data on auth.users   -- CHANGE W1
  for each row execute function private.handle_auth_user_updated();
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function private.handle_auth_user_deleted();
