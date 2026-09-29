-- Schema consistency (plan 2026-09-29-db-consistency). One transaction, so no half-renamed schema is ever live.
-- Rules it applies:
--   * the owning user is always user_id (catalogues.created_by and newsletter.owner_id go);
--   * a row that belongs to a catalogue points at catalogues.id through catalogue_id, never at the slug;
--   * tables are named for what they hold; times are created_at / updated_at, timestamptz, not null;
--   * closed value sets are checked.
-- Changes: prompts -> ai_credits; newsletter -> catalogue_subscribers (owner copy dropped);
-- product_newsletter -> newsletter_subscribers; qr_configs, ai_credits and analytics get catalogue_id;
-- analytics.date (timestamptz at midnight) -> day (date), pageview_count -> pageviews;
-- status 'in preparation' -> 'in_preparation'; leftover catalogues_new_* names; missing defaults/NOT NULLs.
-- The private.* entry points keep their signatures, so the grants on them stay.

-- Renames every constraint, index, policy and trigger of a table that starts with p_old. Looked up by
-- prefix rather than by name, like 20260921181103, because PROD may carry names TEST does not.
create function pg_temp.rename_prefixed(p_table regclass, p_old text, p_new text)
returns void
language plpgsql
as $$
declare
  r   record;
  len integer := pg_catalog.length(p_old);
begin
  for r in select c.conname as n from pg_catalog.pg_constraint c
            where c.conrelid = p_table and pg_catalog.left(c.conname, len) = p_old loop
    execute pg_catalog.format('alter table %s rename constraint %I to %I',
                              p_table, r.n, p_new || pg_catalog.substr(r.n, len + 1));
  end loop;
  for r in select i.relname as n from pg_catalog.pg_index x join pg_catalog.pg_class i on i.oid = x.indexrelid
            where x.indrelid = p_table and pg_catalog.left(i.relname, len) = p_old loop
    execute pg_catalog.format('alter index public.%I rename to %I', r.n, p_new || pg_catalog.substr(r.n, len + 1));
  end loop;
  for r in select p.polname as n from pg_catalog.pg_policy p
            where p.polrelid = p_table and pg_catalog.left(p.polname, len) = p_old loop
    execute pg_catalog.format('alter policy %I on %s rename to %I', r.n, p_table, p_new || pg_catalog.substr(r.n, len + 1));
  end loop;
  for r in select t.tgname as n from pg_catalog.pg_trigger t
            where t.tgrelid = p_table and not t.tgisinternal and pg_catalog.left(t.tgname, len) = p_old loop
    execute pg_catalog.format('alter trigger %I on %s rename to %I', r.n, p_table, p_new || pg_catalog.substr(r.n, len + 1));
  end loop;
end;
$$;

-- 0. Values the new checks will reject, reported together instead of one failed constraint at a time.
do $$
declare
  v_bad text;
begin
  select pg_catalog.string_agg(x, '; ') into v_bad from (
    select 'catalogues.source=' || pg_catalog.string_agg(distinct source, ',') x from public.catalogues
     where source not in ('builder', 'ocr_import', 'ai_prompt') having pg_catalog.count(*) > 0
    union all
    select 'catalogues.status=' || pg_catalog.string_agg(distinct status, ',') from public.catalogues
     where status not in ('draft', 'in preparation', 'active', 'inactive', 'error') having pg_catalog.count(*) > 0
    union all
    select 'subscriptions.subscription_status=' || pg_catalog.string_agg(distinct subscription_status, ',') from public.subscriptions
     where subscription_status not in ('active', 'trialing', 'past_due', 'paused', 'canceled') having pg_catalog.count(*) > 0
    union all
    select 'subscriptions.scheduled_change=' || pg_catalog.string_agg(distinct scheduled_change, ',') from public.subscriptions
     where scheduled_change is not null and scheduled_change !~ '^\d{4}-\d{2}-\d{2}T' having pg_catalog.count(*) > 0
  ) s;
  if v_bad is not null then
    raise exception 'schema_consistency: unexpected values: %', v_bad;
  end if;
end $$;

-- 1. catalogues -------------------------------------------------------------------------------------------
-- Data fixes below must not look like owner edits.
alter table public.catalogues disable trigger catalogues_touch_updated_at;

alter table public.catalogues rename column created_by to user_id;
select pg_temp.rename_prefixed('public.catalogues', 'catalogues_new_', 'catalogues_');
select pg_temp.rename_prefixed('public.catalogues', 'catalogues_created_by_', 'catalogues_user_id_');

do $$
declare
  r record;
begin
  for r in select c.conname from pg_catalog.pg_constraint c
            where c.conrelid = 'public.catalogues'::regclass and c.contype = 'c'
              and pg_catalog.pg_get_constraintdef(c.oid) like '%in preparation%' loop
    execute pg_catalog.format('alter table public.catalogues drop constraint %I', r.conname);
  end loop;
end $$;
update public.catalogues set status = 'in_preparation' where status = 'in preparation';
alter table public.catalogues
  add constraint catalogues_status_check
    check (status in ('draft', 'in_preparation', 'active', 'inactive', 'error')),
  add constraint catalogues_source_check
    check (source in ('builder', 'ocr_import', 'ai_prompt'));

drop policy catalogues_insert_owner on public.catalogues;
create policy catalogues_insert_owner on public.catalogues
  for insert to app_user
  with check (user_id = (select private.current_user_id()) and status in ('draft', 'in_preparation'));

update public.catalogues set metadata = '{}'::jsonb where metadata is null;
alter table public.catalogues
  alter column metadata set not null,
  alter column tags set default '{}'::text[];

alter table public.catalogues enable trigger catalogues_touch_updated_at;

-- 2. prompts -> ai_credits ---------------------------------------------------------------------------------
-- One row is one charged AI turn. ON DELETE SET NULL stays: deleting a catalogue keeps its charges
-- in the monthly balance (20260921181103, 3.7 b).
alter table public.prompts rename to ai_credits;
alter table public.ai_credits rename column datetime to created_at;
alter table public.ai_credits
  add column catalogue_id uuid
  constraint ai_credits_catalogue_id_fkey references public.catalogues (id) on delete set null;
update public.ai_credits a set catalogue_id = c.id from public.catalogues c where c.name = a.catalogue;
do $$
begin
  if exists (select 1 from public.ai_credits where catalogue is not null and catalogue_id is null) then
    raise exception 'ai_credits: rows name a catalogue that does not exist';
  end if;
end $$;
alter table public.ai_credits drop column catalogue;   -- takes prompts_catalogue_fkey and prompts_catalogue_idx
select pg_temp.rename_prefixed('public.ai_credits', 'prompts_', 'ai_credits_');
alter index public.ai_credits_user_datetime_idx rename to ai_credits_user_id_created_at_idx;
create index ai_credits_catalogue_id_idx on public.ai_credits (catalogue_id);

-- 3. qr_configs --------------------------------------------------------------------------------------------
-- Still one design per catalogue, still deleted with it. Its timestamps were the only ones without a
-- time zone; now() wrote them in a UTC session, so they are read as UTC.
alter table public.qr_configs disable trigger qr_configs_touch_updated_at;

alter table public.qr_configs add column catalogue_id uuid;
update public.qr_configs q set catalogue_id = c.id from public.catalogues c where c.name = q.catalogue;
do $$
begin
  if exists (select 1 from public.qr_configs where catalogue_id is null) then
    raise exception 'qr_configs: rows name a catalogue that does not exist';
  end if;
end $$;
alter table public.qr_configs
  alter column catalogue_id set not null,
  add constraint qr_configs_catalogue_id_fkey
    foreign key (catalogue_id) references public.catalogues (id) on delete cascade;
create unique index qr_configs_catalogue_id_key on public.qr_configs (catalogue_id);

drop policy qr_configs_owner on public.qr_configs;
alter table public.qr_configs drop column catalogue;   -- takes qr_configs_catalogue_fkey and qr_configs_catalogue_key
create policy qr_configs_owner on public.qr_configs
  for all to app_user
  using (catalogue_id in (select c.id from public.catalogues c where c.user_id = (select private.current_user_id())))
  with check (catalogue_id in (select c.id from public.catalogues c where c.user_id = (select private.current_user_id())));

update public.qr_configs
   set created_at = coalesce(created_at, updated_at, pg_catalog.now()),
       updated_at = coalesce(updated_at, created_at, pg_catalog.now())
 where created_at is null or updated_at is null;
alter table public.qr_configs
  alter column created_at type timestamptz using created_at at time zone 'UTC',
  alter column updated_at type timestamptz using updated_at at time zone 'UTC',
  alter column created_at set default pg_catalog.now(),
  alter column updated_at set default pg_catalog.now(),
  alter column created_at set not null,
  alter column updated_at set not null;

alter table public.qr_configs enable trigger qr_configs_touch_updated_at;

-- 4. analytics ---------------------------------------------------------------------------------------------
-- One row per catalogue per day. The worker used to key rows by page URL and find the owner by parsing the
-- slug out of it; URL variants of one catalogue become one row here (visitors summed, so an upper bound).
-- Rows of deleted catalogues keep user_id and a null catalogue_id, so the month's traffic quota still counts them.
alter table public.analytics
  add column catalogue_id uuid
  constraint analytics_catalogue_id_fkey references public.catalogues (id) on delete set null;
update public.analytics a
   set catalogue_id = c.id
  from public.catalogues c
 where c.name = pg_catalog.lower(pg_catalog.btrim(pg_catalog.substring(a.current_url, '/catalogues/([^/?#]+)')));
alter table public.analytics drop column current_url;   -- takes analytics_unique_entry

alter table public.analytics rename column date to day;
alter table public.analytics alter column day drop default;
alter table public.analytics alter column day type date using (day at time zone 'UTC')::date;
alter table public.analytics rename column pageview_count to pageviews;
update public.analytics set unique_visitors = 0 where unique_visitors is null;
update public.analytics set created_at = day::timestamptz where created_at is null;

create temp table analytics_merge on commit drop as
  select a.catalogue_id, a.day,
         (pg_catalog.array_agg(a.id order by a.id))[1]           as keep_id,
         pg_catalog.sum(a.pageviews)::integer                    as pageviews,
         pg_catalog.sum(a.unique_visitors)::integer              as unique_visitors
    from public.analytics a
   where a.catalogue_id is not null
   group by a.catalogue_id, a.day
  having pg_catalog.count(*) > 1;
update public.analytics a
   set pageviews = m.pageviews, unique_visitors = m.unique_visitors
  from analytics_merge m
 where a.id = m.keep_id;
delete from public.analytics a
 using analytics_merge m
 where a.catalogue_id = m.catalogue_id and a.day = m.day and a.id <> m.keep_id;

alter table public.analytics
  alter column unique_visitors set default 0,
  alter column unique_visitors set not null,
  alter column created_at set not null,
  add constraint analytics_catalogue_id_day_key unique (catalogue_id, day),
  add constraint analytics_counts_non_negative check (pageviews >= 0 and unique_visitors >= 0);
alter index public.analytics_user_id_date_idx rename to analytics_user_id_day_idx;

-- 5. Subscriber lists --------------------------------------------------------------------------------------
-- A catalogue's subscribers: owner_id copied the catalogue's owner (the copy M03 had to clean up after
-- forged rows); ownership now comes from the catalogue itself.
alter table public.newsletter rename to catalogue_subscribers;
drop policy newsletter_select_owner on public.catalogue_subscribers;
alter table public.catalogue_subscribers drop column owner_id;   -- takes newsletter_owner_id_fkey and newsletter_owner_id_idx
select pg_temp.rename_prefixed('public.catalogue_subscribers', 'newsletter_', 'catalogue_subscribers_');
create policy catalogue_subscribers_select_owner on public.catalogue_subscribers
  for select to app_user
  using (catalogue_id in (select c.id from public.catalogues c where c.user_id = (select private.current_user_id())));

-- Quicktalog's own newsletter.
alter table public.product_newsletter rename to newsletter_subscribers;
select pg_temp.rename_prefixed('public.newsletter_subscribers', 'product_newsletter_', 'newsletter_subscribers_');
alter table public.newsletter_subscribers add column created_at timestamptz not null default pg_catalog.now();

-- 6. users -------------------------------------------------------------------------------------------------
update public.users set created_at = pg_catalog.now() where created_at is null;
alter table public.users
  alter column created_at set default pg_catalog.now(),
  alter column created_at set not null,
  add column updated_at timestamptz not null default pg_catalog.now();
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function private.touch_updated_at();

-- 7. subscriptions -----------------------------------------------------------------------------------------
-- scheduled_change holds Paddle's scheduled_change.effective_at, an ISO timestamp. The reporting view
-- that reads it blocks the type change, so it is re-created with the same output and grants.
drop view public.active_subscriptions;
alter table public.subscriptions
  alter column scheduled_change type timestamptz using nullif(pg_catalog.btrim(scheduled_change), '')::timestamptz,
  add constraint subscriptions_status_check
    check (subscription_status in ('active', 'trialing', 'past_due', 'paused', 'canceled'));
create trigger subscriptions_touch_updated_at
  before update on public.subscriptions
  for each row execute function private.touch_updated_at();

create view public.active_subscriptions with (security_invoker = true) as
  select u.email,
         u.name,
         u.plan_id as price_id,
         s.subscription_status,
         s.created_at,
         s.updated_at,
         'https://www.quicktalog.app/catalogues/'::text || coalesce(c.name, ''::text) as catalogue_name
    from public.subscriptions s
    left join public.users u on s.customer_id = u.customer_id
    left join public.catalogues c on c.user_id = u.id
   where s.subscription_status = 'active'::text
     and u.name !~~* '%Mirilo%'::text and u.name !~~* '%Tes%'::text and u.name !~~* '%Montre%'::text
     and u.name !~~* '%Djuranov%'::text and u.email !~~* '%test%'::text
     and s.scheduled_change is null;
alter view public.active_subscriptions owner to postgres;
revoke all on public.active_subscriptions from public, anon, authenticated, app_user, app_public;
grant all on public.active_subscriptions to service_role;

-- 8. job_logs and plans ------------------------------------------------------------------------------------
update public.job_logs set created_at = pg_catalog.now() where created_at is null;
-- A log keeps its history: the check binds new rows only.
alter table public.job_logs
  alter column created_at set not null,
  add constraint job_logs_status_check check (status in ('success', 'failure')) not valid;

update public.plans set updated_at = pg_catalog.now() where updated_at is null;
alter table public.plans alter column updated_at set not null;

-- 9. Entry points on the renamed tables and columns (plpgsql resolves names at run time) ---------------------
create or replace function private.begin_ai_turn(
  p_catalogue        text,
  p_limit            integer,
  p_kind             text,
  p_continuation_of  uuid,
  p_plan_hash        text,
  p_credits          integer default 1,
  p_require_verified boolean default false)
returns table (outcome text, ai_turn_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid       text := private.current_user_id();
  v_catalogue uuid;
  v_used      bigint;
  v_turn      uuid;
begin
  if v_uid is null then
    raise exception 'begin_ai_turn: no verified identity' using errcode = '42501';
  end if;
  if p_limit is not null and p_limit < 0 then
    raise exception 'begin_ai_turn: invalid limit %', p_limit using errcode = '22023';
  end if;
  if p_kind is null or p_kind not in ('agent', 'describe') then
    raise exception 'begin_ai_turn: invalid kind' using errcode = '22023';
  end if;
  if p_credits is null or p_credits < 0 or p_credits > 100 then
    raise exception 'begin_ai_turn: invalid credits %', p_credits using errcode = '22023';
  end if;

  -- Cheapest defence against signup farming, and read here rather than from the JWT
  -- because user_metadata.email_verified is writable by the user it describes.
  -- Only rows that have an auth.users match are judged: the ones that do not predate
  -- the Supabase cutover and cannot be a fresh unconfirmed signup.
  if p_require_verified and exists (
       select 1 from auth.users a
        where a.id::text = v_uid and a.email_confirmed_at is null) then
    return query select 'unverified'::text, null::uuid;
    return;
  end if;

  select c.id into v_catalogue
    from public.catalogues c
   where c.name = p_catalogue and c.user_id = v_uid;
  if v_catalogue is null then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  -- Serialise this user's charges without blocking FK key-share locks (CHANGE C7).
  perform 1 from public.users u where u.id = v_uid for no key update;

  select coalesce(pg_catalog.sum(a.credits), 0) into v_used
    from public.ai_credits a
   where a.user_id = v_uid
     and a.refunded_at is null
     and a.created_at >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');

  if p_kind = 'agent' and p_continuation_of is not null and p_plan_hash is not null then
    -- A continuation takes no charge now but settles one per task when it ends,
    -- so it needs headroom. Refusing here stops the plan on a task boundary
    -- instead of letting it run the balance further into the red.
    if p_limit is not null and v_used >= p_limit then
      return query select 'limit'::text, null::uuid;
      return;
    end if;

    update public.ai_credits a
       set continuations = a.continuations + 1
     where a.turn_id = p_continuation_of
       and a.user_id = v_uid
       and a.catalogue_id = v_catalogue
       and a.kind = 'agent'
       and a.plan_open
       and a.plan_hash = p_plan_hash
       and a.refunded_at is null
       and a.created_at > pg_catalog.now() - interval '15 minutes'
       and a.continuations < a.plan_budget
    returning a.turn_id into v_turn;
    if v_turn is not null then
      return query select 'continued'::text, v_turn;
      return;
    end if;
  end if;
  -- Anything that is not a proven continuation falls through and is charged.

  -- A new turn must be able to pay its base price. "Has one credit left" was not
  -- enough: it let a 2-credit turn start on a balance of 1 and finish over.
  if p_limit is not null and v_used + p_credits > p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.ai_credits as a (user_id, catalogue_id, turn_id, kind, credits)
  values (v_uid, v_catalogue, pg_catalog.gen_random_uuid(), p_kind, p_credits)
  returning a.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

create or replace function private.settle_ai_turn(
  p_turn_id       uuid,
  p_extra_credits integer)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid text := private.current_user_id();
begin
  if v_uid is null then
    return false;
  end if;
  if p_extra_credits is null or p_extra_credits < 0 or p_extra_credits > 50 then
    raise exception 'settle_ai_turn: invalid extra credits %', p_extra_credits using errcode = '22023';
  end if;

  update public.ai_credits a
     set credits = least(a.credits + p_extra_credits, 100)
   where a.turn_id = p_turn_id
     and a.user_id = v_uid
     and a.refunded_at is null
     and a.created_at > pg_catalog.now() - interval '15 minutes';
  return found;
end;
$$;

create or replace function private.refund_ai_turn(p_turn_id uuid)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid      text := private.current_user_id();
  v_cap      integer;
  v_refunded bigint;
begin
  if v_uid is null then
    return false;
  end if;
  select coalesce((select s.value from private.settings s
                    where s.key = 'ai_refund_cap_per_month' and s.value ~ '^[0-9]{1,6}$')::integer, 30)
    into v_cap;
  select pg_catalog.count(*) into v_refunded
    from public.ai_credits a
   where a.user_id = v_uid
     and a.refunded_at >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if v_refunded >= v_cap then
    return false;
  end if;
  update public.ai_credits a
     set refunded_at = pg_catalog.now()
   where a.turn_id = p_turn_id
     and a.user_id = v_uid
     and a.continuations = 0
     and not a.plan_open
     and a.refunded_at is null
     and a.created_at > pg_catalog.now() - interval '10 minutes';
  return found;
end;
$$;

create or replace function private.set_plan_state(
  p_turn_id       uuid,
  p_open          boolean,
  p_tasks_pending integer,
  p_plan_hash     text)
returns boolean
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_open boolean := coalesce(p_open, false) and coalesce(p_tasks_pending, 0) > 0 and p_plan_hash is not null;
begin
  if p_plan_hash is not null and p_plan_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'set_plan_state: invalid plan hash' using errcode = '22023';
  end if;
  update public.ai_credits a
     set plan_open   = v_open,
         plan_budget = case
                         when a.plan_budget = 0 and a.continuations = 0 and v_open
                           then least(8, greatest(coalesce(p_tasks_pending, 0), 0))
                         else a.plan_budget
                       end,
         plan_hash   = case when v_open then p_plan_hash else null end
   where a.turn_id = p_turn_id
     and a.user_id = private.current_user_id()
     and a.kind = 'agent'
     and a.refunded_at is null
     and a.created_at > pg_catalog.now() - interval '15 minutes';
  return found;
end;
$$;

create or replace function private.my_usage()
returns table (catalogues bigint, credits bigint, pageviews bigint, unique_visitors bigint)
language sql
stable
set search_path = ''
as $$
  with me as (select private.current_user_id() as uid),
       m  as (select pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') as s,
                     pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') + interval '1 month' as e),
       d  as (select (m.s at time zone 'UTC')::date as s, (m.e at time zone 'UTC')::date as e from m)
  select
    (select pg_catalog.count(*) from public.catalogues c, me where c.user_id = me.uid),
    (select coalesce(pg_catalog.sum(a.credits), 0)::bigint from public.ai_credits a, me, m
      where a.user_id = me.uid and a.refunded_at is null and a.created_at >= m.s and a.created_at < m.e),
    (select coalesce(pg_catalog.sum(t.pageviews), 0)::bigint from public.analytics t, me, d
      where t.user_id = me.uid and t.day >= d.s and t.day < d.e),
    (select coalesce(pg_catalog.sum(t.unique_visitors), 0)::bigint from public.analytics t, me, d
      where t.user_id = me.uid and t.day >= d.s and t.day < d.e)
$$;

create or replace function private.subscribe_catalogue_newsletter(p_catalogue_id uuid, p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(p_email));
begin
  if v_email is null or pg_catalog.length(v_email) > 254
     or v_email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}$' then   -- CHANGE C6
    return;
  end if;
  if not exists (
       select 1 from public.catalogues c
        where c.id = p_catalogue_id
          and c.status = 'active'
          and (c.footer -> 'newsletter') = 'true'::jsonb) then
    return;
  end if;
  insert into public.catalogue_subscribers (email, catalogue_id)
  values (v_email, p_catalogue_id)
  on conflict (catalogue_id, (pg_catalog.lower(email))) do nothing;
end;
$$;

create or replace function private.subscribe_product_newsletter(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(p_email));
begin
  if v_email is null or pg_catalog.length(v_email) > 254
     or v_email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}$' then   -- CHANGE C6
    return;
  end if;
  insert into public.newsletter_subscribers (email)
  values (v_email)
  on conflict ((pg_catalog.lower(email))) do nothing;
end;
$$;

drop function pg_temp.rename_prefixed(regclass, text, text);
