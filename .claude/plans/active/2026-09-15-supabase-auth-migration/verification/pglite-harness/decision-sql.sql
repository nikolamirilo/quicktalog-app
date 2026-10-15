-- Verbatim SQL from the binding ARCHITECTURE DECISION text (sections 7 and 8, M1-M5), transcribed for execution.
-- Only edits: placeholders filled (M4 '<Starter monthly price id>' -> TEST plan id), the M5 map table created first
-- (the decision references it but its DDL lives in rls.sql R1), and the "dedupe (keep one row per key)" prose
-- step is left as prose (the harness seeds duplicates, so the unique indexes are expected to fail without it).

-- MIGRATION 01_decision_m1_app_roles_rls_foundation
-- 1. Roles
do $$ begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_user') then
    create role app_user nologin noinherit nobypassrls; end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_public') then
    create role app_public nologin noinherit nobypassrls; end if;
end $$;
grant app_user   to postgres with inherit false, set true;
grant app_public to postgres with inherit false, set true;

-- 2. Private schema
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to app_user, app_public;
alter default privileges for role postgres revoke execute on functions from public;

-- 3. Identity helper (section 7)
create or replace function private.current_user_id() returns text
language sql stable set search_path = ''
as $$ select nullif((nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb) ->> 'sub', '') $$;
revoke all on function private.current_user_id() from public;
grant execute on function private.current_user_id() to app_user;

-- 4. Table privileges
grant select on public.users to app_user;
grant update (name, cookie_preferences) on public.users to app_user;
grant select, insert, delete on public.catalogues to app_user;
grant update (logo, heading, status, language, currency, business_type, content, legal, appearance,
              contact, header, footer, partners, metadata, tags, updated_at) on public.catalogues to app_user;
grant select (id, name, logo, heading, status, source, language, currency, business_type, content, legal,
              appearance, contact, header, footer, partners, metadata, tags, created_at, updated_at)
  on public.catalogues to app_public;
grant select, insert, delete on public.qr_configs to app_user;
grant update (config, updated_at) on public.qr_configs to app_user;
grant select, insert, delete on public.user_themes to app_user;
grant update (name, colors, updated_at) on public.user_themes to app_user;
grant select on public.analytics, public.prompts, public.ocr, public.newsletter to app_user;

-- 5. Policies
create policy users_select_self on public.users for select to app_user using (id = (select private.current_user_id()));
create policy users_update_self on public.users for update to app_user
  using (id = (select private.current_user_id())) with check (id = (select private.current_user_id()));
create policy catalogues_select_owner on public.catalogues for select to app_user
  using (created_by = (select private.current_user_id()));
create policy catalogues_insert_owner on public.catalogues for insert to app_user
  with check (created_by = (select private.current_user_id()) and status in ('draft', 'in preparation'));
create policy catalogues_update_owner on public.catalogues for update to app_user
  using (created_by = (select private.current_user_id())) with check (created_by = (select private.current_user_id()));
create policy catalogues_delete_owner on public.catalogues for delete to app_user
  using (created_by = (select private.current_user_id()));
create policy catalogues_select_public on public.catalogues for select to app_public using (status = 'active');
create policy qr_configs_owner on public.qr_configs for all to app_user
  using      (catalogue in (select c.name from public.catalogues c where c.created_by = (select private.current_user_id())))
  with check (catalogue in (select c.name from public.catalogues c where c.created_by = (select private.current_user_id())));
create policy user_themes_owner on public.user_themes for all to app_user
  using (user_id = (select private.current_user_id())) with check (user_id = (select private.current_user_id()));
create policy analytics_select_owner  on public.analytics  for select to app_user using (user_id  = (select private.current_user_id()));
create policy prompts_select_owner    on public.prompts    for select to app_user using (user_id  = (select private.current_user_id()));
create policy ocr_select_owner        on public.ocr        for select to app_user using (user_id  = (select private.current_user_id()));
create policy newsletter_select_owner on public.newsletter for select to app_user using (owner_id = (select private.current_user_id()));

-- 6. Server-owned columns
create or replace function private.catalogues_pin_insert() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_user = 'app_user' then
    new.id := gen_random_uuid(); new.created_at := now(); new.updated_at := now();
  end if;
  return new;
end $$;
create or replace function private.touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$ begin new.updated_at := now(); return new; end $$;
revoke all on function private.catalogues_pin_insert(), private.touch_updated_at() from public;
grant execute on function private.catalogues_pin_insert(), private.touch_updated_at() to app_user;
create trigger catalogues_pin_insert before insert on public.catalogues for each row execute function private.catalogues_pin_insert();
create trigger catalogues_touch_updated_at  before update on public.catalogues  for each row execute function private.touch_updated_at();
create trigger qr_configs_touch_updated_at  before update on public.qr_configs  for each row execute function private.touch_updated_at();
create trigger user_themes_touch_updated_at before update on public.user_themes for each row execute function private.touch_updated_at();

-- 7. Structural invariants
alter table public.catalogues add constraint catalogues_status_check
  check (status in ('active','inactive','draft','in preparation','error')) not valid;
alter table public.catalogues validate constraint catalogues_status_check;
alter table public.catalogues  add constraint catalogues_content_size check (pg_column_size(content) < 1048576) not valid;
alter table public.user_themes add constraint user_themes_colors_size check (pg_column_size(colors) < 4096) not valid;
alter table public.qr_configs  add constraint qr_configs_config_size  check (pg_column_size(config) < 65536) not valid;
alter table public.users       add constraint users_cookie_prefs_size check (cookie_preferences is null or pg_column_size(cookie_preferences) < 2048) not valid;
create unique index if not exists qr_configs_catalogue_key         on public.qr_configs (catalogue);
create unique index if not exists newsletter_catalogue_email_key   on public.newsletter (catalogue_id, lower(email));
create unique index if not exists product_newsletter_email_key     on public.product_newsletter (lower(email));

-- 8. AI ledger integrity
alter table public.prompts drop constraint if exists prompts_service_catalogue_key;
alter table public.prompts drop constraint prompts_catalogue_fkey;
alter table public.prompts alter column catalogue drop not null;
alter table public.prompts add constraint prompts_catalogue_fkey foreign key (catalogue)
  references public.catalogues(name) on update cascade on delete set null;
delete from public.prompts where user_id is null;
alter table public.prompts alter column user_id set not null;
alter table public.prompts add column if not exists turn_id uuid,
  add column if not exists continuations integer not null default 0,
  add column if not exists refunded_at timestamptz;
create unique index if not exists prompts_turn_id_key on public.prompts (turn_id);
create index if not exists prompts_user_datetime_idx on public.prompts (user_id, datetime);

-- 9. Narrow SECURITY DEFINER entry points
create or replace function private.catalogue_name_available(p_name text) returns boolean
language sql stable security definer set search_path = ''
as $$ select private.current_user_id() is not null and not exists (select 1 from public.catalogues c where c.name = p_name) $$;

create or replace function private.subscribe_catalogue_newsletter(p_catalogue_id uuid, p_email text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email)); v_owner text;
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
  select c.created_by into v_owner from public.catalogues c
   where c.id = p_catalogue_id and c.status = 'active'
     and coalesce((c.footer ->> 'newsletter')::boolean, false);
  if v_owner is null then return; end if;
  insert into public.newsletter (email, catalogue_id, owner_id) values (v_email, p_catalogue_id, v_owner)
  on conflict (catalogue_id, lower(email)) do nothing;
end $$;

create or replace function private.subscribe_product_newsletter(p_email text) returns void
language plpgsql volatile security definer set search_path = '' as $$
declare v_email text := lower(trim(p_email));
begin
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return; end if;
  insert into public.product_newsletter (email) values (v_email) on conflict (lower(email)) do nothing;
end $$;

create or replace function private.my_usage()
returns table (catalogues bigint, prompts bigint, ocr bigint, pageviews bigint, unique_visitors bigint)
language sql stable security invoker set search_path = '' as $$
  with me as (select private.current_user_id() uid),
       m  as (select date_trunc('month', now()) s, date_trunc('month', now()) + interval '1 month' e)
  select (select count(*) from public.catalogues c, me where c.created_by = me.uid),
         (select count(*) from public.prompts p, me, m where p.user_id = me.uid and p.refunded_at is null and p.datetime >= m.s and p.datetime < m.e),
         (select count(*) from public.ocr o, me, m where o.user_id = me.uid and o.datetime >= m.s and o.datetime < m.e),
         (select coalesce(sum(a.pageview_count), 0)  from public.analytics a, me, m where a.user_id = me.uid and a.date >= m.s and a.date < m.e),
         (select coalesce(sum(a.unique_visitors), 0) from public.analytics a, me, m where a.user_id = me.uid and a.date >= m.s and a.date < m.e)
$$;

create or replace function private.begin_ai_turn(p_catalogue text, p_limit integer, p_continuation boolean)
returns table (outcome text, ai_turn_id uuid)
language plpgsql volatile security definer set search_path = '' as $$
declare v_uid text := private.current_user_id(); v_used bigint; v_turn uuid;
begin
  if v_uid is null then raise exception 'no identity' using errcode = '42501'; end if;
  if not exists (select 1 from public.catalogues c where c.name = p_catalogue and c.created_by = v_uid) then
    return query select 'not_found'::text, null::uuid; return;
  end if;
  perform 1 from public.users u where u.id = v_uid for update;
  if p_continuation then
    update public.prompts p set continuations = p.continuations + 1
     where p.id = (select p2.id from public.prompts p2
                    where p2.user_id = v_uid and p2.catalogue = p_catalogue and p2.refunded_at is null
                      and p2.datetime > now() - interval '15 minutes' and p2.continuations < 9
                    order by p2.datetime desc limit 1)
    returning p.turn_id into v_turn;
    if v_turn is not null then return query select 'continued'::text, v_turn; return; end if;
  end if;
  select count(*) into v_used from public.prompts p
   where p.user_id = v_uid and p.refunded_at is null and p.datetime >= date_trunc('month', now());
  if p_limit is not null and v_used >= p_limit then return query select 'limit'::text, null::uuid; return; end if;
  insert into public.prompts (user_id, catalogue, turn_id) values (v_uid, p_catalogue, gen_random_uuid())
  returning turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end $$;

create or replace function private.refund_ai_turn(p_turn_id uuid) returns boolean
language sql volatile security definer set search_path = '' as $$
  with r as (update public.prompts set refunded_at = now()
              where turn_id = p_turn_id and user_id = private.current_user_id()
                and continuations = 0 and refunded_at is null and datetime > now() - interval '10 minutes'
              returning 1)
  select exists (select 1 from r)
$$;

revoke all on function private.catalogue_name_available(text), private.subscribe_catalogue_newsletter(uuid, text),
  private.subscribe_product_newsletter(text), private.my_usage(), private.begin_ai_turn(text, integer, boolean),
  private.refund_ai_turn(uuid) from public;
grant execute on function private.catalogue_name_available(text), private.my_usage(),
  private.begin_ai_turn(text, integer, boolean), private.refund_ai_turn(uuid) to app_user;
grant execute on function private.subscribe_catalogue_newsletter(uuid, text), private.subscribe_product_newsletter(text) to app_public, app_user;

-- 10. Paddle idempotency
create table if not exists private.paddle_events (event_id text primary key, event_type text not null,
  occurred_at timestamptz not null, processed_at timestamptz not null default now());

-- 11. Brevo trigger
drop trigger "Brevo New Contact Webhook" on public.users;
create trigger "Brevo New Contact Webhook" after insert or update of email, name, plan_id, customer_id on public.users
  for each row execute function public.call_edge_function_with_vault_secret('create-brevo-contact');

-- 12. RLS on tables no current anon path uses
alter table public.prompts enable row level security;
alter table public.ocr enable row level security;
alter table public.qr_configs enable row level security;
alter table public.user_themes enable row level security;
alter table public.product_newsletter enable row level security;
alter table public.plans enable row level security;

-- MIGRATION 02_decision_m2_close_data_api
alter table public.users         enable row level security;
alter table public.catalogues    enable row level security;
alter table public.analytics     enable row level security;
alter table public.newsletter    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.job_logs      enable row level security;
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
drop function if exists public.get_pageview_totals(timestamptz, timestamptz);

-- MIGRATION 03_decision_m3_app_rls_login_role
do $$ begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_rls') then
    create role app_rls login noinherit nobypassrls nocreatedb nocreaterole connection limit 40; end if;
end $$;
grant app_user   to app_rls with inherit false, set true;
grant app_public to app_rls with inherit false, set true;
alter role app_rls set statement_timeout = '8s';
alter role app_rls set lock_timeout = '3s';
alter role app_rls set idle_in_transaction_session_timeout = '10s';

-- MIGRATION 04_decision_m4_auth_users_sync
create table if not exists private.settings (key text primary key, value text not null);
insert into private.settings values ('default_plan_id', 'pri_01k27ajepm199twd1x77rpwdrq') on conflict (key) do nothing;

create or replace function private.handle_auth_user_created() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_app_meta_data ? 'clerk_user_id' then return new; end if;
  insert into public.users (id, email, name, image, plan_id)
  values (new.id::text, lower(new.email),
          coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
          new.raw_user_meta_data ->> 'avatar_url',
          (select s.value from private.settings s where s.key = 'default_plan_id'))
  on conflict (id) do nothing;
  return new;
end $$;
create or replace function private.handle_auth_user_email_changed() returns trigger
language plpgsql security definer set search_path = '' as $$
begin update public.users set email = lower(new.email) where id = new.id::text; return new; end $$;
create or replace function private.handle_auth_user_deleted() returns trigger
language plpgsql security definer set search_path = '' as $$
begin delete from public.users where id = old.id::text; return old; end $$;
revoke all on function private.handle_auth_user_created(), private.handle_auth_user_email_changed(), private.handle_auth_user_deleted() from public;
create trigger on_auth_user_created       after insert          on auth.users for each row execute function private.handle_auth_user_created();
create trigger on_auth_user_email_changed after update of email on auth.users for each row execute function private.handle_auth_user_email_changed();
create trigger on_auth_user_deleted       after delete          on auth.users for each row execute function private.handle_auth_user_deleted();

-- RUNBOOK decision_m5_remap
create schema if not exists migration;
create table if not exists migration.clerk_user_map (clerk_user_id text primary key, supabase_user_id uuid unique not null, status text, password_imported boolean, google_sub text);
begin;
alter table public.users disable trigger "Brevo New Contact Webhook";
update public.users u set id = m.supabase_user_id::text
  from migration.clerk_user_map m where m.clerk_user_id = u.id and m.status = 'migrated';
alter table public.users enable trigger "Brevo New Contact Webhook";
alter table public.users add constraint users_id_is_uuid
  check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
commit;
