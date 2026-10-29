-- Plan allowances reset 30 days from signup, not on the 1st
-- (plan .claude/plans/active/2026-10-29-usage-period-from-signup).
--
-- Until now AI credits and page views were counted from date_trunc('month', now()), so the
-- length of an account's first allowance depended on the day it signed up: one created on
-- the 28th got three days of it. Each account now has its own 30-day period, anchored on
-- the day it was created, and the three functions that counted a calendar month count
-- inside that period instead: begin_ai_turn, refund_ai_turn and my_usage.
--
-- my_usage also returns the window it counted with, so the dashboard can name the reset
-- date from the same source that enforces the limit. The Cloudflare Worker cannot reach
-- private.* over REST and mirrors usage_period_* in TypeScript (@quicktalog/common
-- usagePeriod()); the two must stay in step, including the epoch below.

-- Whole 30-day steps since the signup day, in UTC days so a period starts at 00:00 UTC and
-- lines up with analytics.day. greatest(..., 0) keeps a signup in the future (clock skew)
-- on its own first period instead of stepping backwards.
create or replace function private.usage_period_anchor(p_signup timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select ((((p_signup at time zone 'UTC')::date
            + (greatest(((pg_catalog.now() at time zone 'UTC')::date
                         - (p_signup at time zone 'UTC')::date) / 30, 0) * 30))::timestamp)
          at time zone 'UTC')
$$;

-- The start of the account's current period. Usage before the switch-over was already
-- forgiven by the monthly reset, so the first signup-anchored period never reaches back
-- past it: without this an account whose anchor falls before the 1st would have that usage
-- counted a second time and could be over its traffic limit the moment this is deployed.
-- A no-op once every anchor is past the epoch (30 days), and ignored until the epoch is
-- reached, so deploying earlier than planned cannot stop usage being counted.
--
-- 2026-11-01 is the first day of the month this is applied in. Mirrored by
-- USAGE_PERIOD_EPOCH in @quicktalog/common; applying this outside November 2026 means
-- changing both first.
create or replace function private.usage_period_start(p_signup timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select case
           when e.epoch <= pg_catalog.now()
             then greatest(private.usage_period_anchor(p_signup), e.epoch)
           else private.usage_period_anchor(p_signup)
         end
    from (select '2026-11-01 00:00:00+00'::timestamptz as epoch) e
$$;

-- When the allowance resets. Taken from the anchor, not from the clamped start, so the
-- epoch above can only shorten the first period and never moves a reset date.
create or replace function private.usage_period_end(p_signup timestamptz)
returns timestamptz
language sql
stable
set search_path = ''
as $$
  select private.usage_period_anchor(p_signup) + interval '30 days'
$$;

-- my_usage gains the window it counted with, so its return type changes.
drop function if exists private.my_usage();

create or replace function private.my_usage()
returns table (catalogues bigint, credits bigint, pageviews bigint, unique_visitors bigint,
               period_start timestamptz, period_end timestamptz)
language sql
stable
set search_path = ''
as $$
  with me as (select private.current_user_id() as uid),
       -- Visible under users_select_self, so this is the caller's own signup date.
       u  as (select u.created_at as signup from public.users u, me where u.id = me.uid),
       m  as (select private.usage_period_start(u.signup) as s,
                     private.usage_period_end(u.signup)   as e from u),
       d  as (select (m.s at time zone 'UTC')::date as s, (m.e at time zone 'UTC')::date as e from m)
  select
    (select pg_catalog.count(*) from public.catalogues c, me where c.user_id = me.uid),
    (select coalesce(pg_catalog.sum(a.credits), 0)::bigint from public.ai_credits a, me, m
      where a.user_id = me.uid and a.refunded_at is null and a.created_at >= m.s and a.created_at < m.e),
    (select coalesce(pg_catalog.sum(t.pageviews), 0)::bigint from public.analytics t, me, d
      where t.user_id = me.uid and t.day >= d.s and t.day < d.e),
    (select coalesce(pg_catalog.sum(t.unique_visitors), 0)::bigint from public.analytics t, me, d
      where t.user_id = me.uid and t.day >= d.s and t.day < d.e),
    (select m.s from m),
    (select m.e from m)
$$;

-- Unchanged from 20261024120000 except the window: the balance is now read from the
-- caller's current period, and created_at comes from the users row this already locks.
create or replace function private.begin_ai_turn(
  p_catalogue        text,
  p_limit            integer,
  p_kind             text,
  p_continuation_of  uuid,
  p_plan_hash        text,
  p_credits          integer default 1,
  p_require_verified boolean default false,
  p_hold             integer default 0)
returns table (outcome text, ai_turn_id uuid, held integer)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  -- The function's maxDuration (60 s) plus margin: a hold outlives its request only briefly.
  c_hold_for  constant interval := interval '90 seconds';
  v_uid       text := private.current_user_id();
  v_catalogue uuid;
  v_signup    timestamptz;
  v_window    timestamptz;
  v_used      bigint;
  v_hold      integer;
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
  if p_hold is null or p_hold < 0 or p_hold > 100 then
    raise exception 'begin_ai_turn: invalid hold %', p_hold using errcode = '22023';
  end if;

  -- Cheapest defence against signup farming, and read here rather than from the JWT
  -- because user_metadata.email_verified is writable by the user it describes.
  -- Only rows that have an auth.users match are judged: the ones that do not predate
  -- the Supabase cutover and cannot be a fresh unconfirmed signup.
  if p_require_verified and exists (
       select 1 from auth.users a
        where a.id::text = v_uid and a.email_confirmed_at is null) then
    return query select 'unverified'::text, null::uuid, 0;
    return;
  end if;

  select c.id into v_catalogue
    from public.catalogues c
   where c.name = p_catalogue and c.user_id = v_uid;
  if v_catalogue is null then
    return query select 'not_found'::text, null::uuid, 0;
    return;
  end if;

  -- Serialise this user's charges without blocking FK key-share locks (CHANGE C7), and
  -- take the signup date the period is counted from in the same read.
  select u.created_at into v_signup
    from public.users u
   where u.id = v_uid
     for no key update;
  if not found then
    raise exception 'begin_ai_turn: no account row' using errcode = '42501';
  end if;
  v_window := private.usage_period_start(v_signup);

  -- Confirmed charges plus every hold still live: what another request may not spend.
  select coalesce(pg_catalog.sum(a.credits), 0)
       + coalesce(pg_catalog.sum(a.held) filter (where a.held_until > pg_catalog.now()), 0)
    into v_used
    from public.ai_credits a
   where a.user_id = v_uid
     and a.refunded_at is null
     and a.created_at >= v_window;

  if p_kind = 'agent' and p_continuation_of is not null and p_plan_hash is not null then
    -- A continuation takes no charge up front, so it needs room for at least one task.
    if p_limit is not null and v_used >= p_limit then
      return query select 'limit'::text, null::uuid, 0;
      return;
    end if;

    v_hold := case when p_limit is null then p_hold
                   else least(p_hold, (p_limit - v_used)::integer) end;

    -- One request in flight per turn: a second copy sent in parallel is not a
    -- continuation and falls through to be charged as a new turn.
    update public.ai_credits a
       set continuations = a.continuations + 1,
           held          = v_hold,
           held_until    = pg_catalog.now() + c_hold_for
     where a.turn_id = p_continuation_of
       and a.user_id = v_uid
       and a.catalogue_id = v_catalogue
       and a.kind = 'agent'
       and a.plan_open
       and a.plan_hash = p_plan_hash
       and a.refunded_at is null
       and a.created_at > pg_catalog.now() - interval '15 minutes'
       -- A root row from the previous period would put this period's spend on its bill.
       and a.created_at >= v_window
       and a.continuations < a.plan_budget
       and (a.held = 0 or a.held_until is null or a.held_until <= pg_catalog.now())
    returning a.turn_id into v_turn;
    if v_turn is not null then
      return query select 'continued'::text, v_turn, v_hold;
      return;
    end if;
  end if;
  -- Anything that is not a proven continuation falls through and is charged.

  -- A new turn must be able to pay its base price.
  if p_limit is not null and v_used + p_credits > p_limit then
    return query select 'limit'::text, null::uuid, 0;
    return;
  end if;

  v_hold := case when p_limit is null then p_hold
                 else least(p_hold, (p_limit - v_used - p_credits)::integer) end;

  insert into public.ai_credits as a (user_id, catalogue_id, turn_id, kind, credits, held, held_until)
  values (v_uid, v_catalogue, pg_catalog.gen_random_uuid(), p_kind, p_credits,
          v_hold, pg_catalog.now() + c_hold_for)
  returning a.turn_id into v_turn;
  return query select 'charged'::text, v_turn, v_hold;
end;
$$;

-- Unchanged from 20260929120000 except the window the refund cap is counted in, and the
-- setting key that names it: the cap protects one allowance, so it follows the same clock.
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
  v_signup   timestamptz;
begin
  if v_uid is null then
    return false;
  end if;
  select coalesce((select s.value from private.settings s
                    where s.key = 'ai_refund_cap_per_period' and s.value ~ '^[0-9]{1,6}$')::integer, 30)
    into v_cap;
  select u.created_at into v_signup from public.users u where u.id = v_uid;
  if not found then
    return false;
  end if;
  select pg_catalog.count(*) into v_refunded
    from public.ai_credits a
   where a.user_id = v_uid
     and a.refunded_at >= private.usage_period_start(v_signup);
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

update private.settings set key = 'ai_refund_cap_per_period'
 where key = 'ai_refund_cap_per_month';

alter function private.usage_period_anchor(timestamptz) owner to postgres;
alter function private.usage_period_start(timestamptz)  owner to postgres;
alter function private.usage_period_end(timestamptz)    owner to postgres;
alter function private.my_usage()                       owner to postgres;
alter function private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean, integer) owner to postgres;
alter function private.refund_ai_turn(uuid)             owner to postgres;

revoke all on function
  private.usage_period_anchor(timestamptz),
  private.usage_period_start(timestamptz),
  private.usage_period_end(timestamptz),
  private.my_usage(),
  private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean, integer),
  private.refund_ai_turn(uuid)
from public;

-- my_usage() is not security definer: it runs as the caller, so app_user needs the helpers.
grant execute on function
  private.usage_period_anchor(timestamptz),
  private.usage_period_start(timestamptz),
  private.usage_period_end(timestamptz),
  private.my_usage(),
  private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean, integer),
  private.refund_ai_turn(uuid)
to app_user;
