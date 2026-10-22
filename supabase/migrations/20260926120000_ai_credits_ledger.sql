-- C01: prompts rows gain a price, so the monthly balance is sum(credits) rather than count(*).
-- The ledger itself (turn binding, refunds, per-user serialisation) already landed in
-- 20260921181103 and 20260921181106; this only adds the unit and reprices the entry point.

alter table public.prompts
  add column if not exists credits  integer not null default 1,
  add column if not exists metadata jsonb;

-- Bounded so a settle can never push a row past the range check and abort a paid turn.
alter table public.prompts add constraint prompts_credits_range check (credits between 0 and 100);

drop function if exists private.begin_ai_turn(text, integer, text, uuid, text);

create or replace function private.begin_ai_turn(
  p_catalogue       text,
  p_limit           integer,
  p_kind            text,
  p_continuation_of uuid,
  p_plan_hash       text,
  p_credits         integer default 1,
  p_require_verified boolean default false)
returns table (outcome text, ai_turn_id uuid)
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid  text := private.current_user_id();
  v_used bigint;
  v_turn uuid;
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

  if p_catalogue is null or not exists (
       select 1 from public.catalogues c where c.name = p_catalogue and c.created_by = v_uid) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  -- Serialise this user's charges without blocking FK key-share locks (CHANGE C7).
  perform 1 from public.users u where u.id = v_uid for no key update;

  if p_kind = 'agent' and p_continuation_of is not null and p_plan_hash is not null then
    update public.prompts p
       set continuations = p.continuations + 1
     where p.turn_id = p_continuation_of
       and p.user_id = v_uid
       and p.catalogue = p_catalogue
       and p.kind = 'agent'
       and p.plan_open
       and p.plan_hash = p_plan_hash
       and p.refunded_at is null
       and p.datetime > pg_catalog.now() - interval '15 minutes'
       and p.continuations < p.plan_budget
    returning p.turn_id into v_turn;
    if v_turn is not null then
      return query select 'continued'::text, v_turn;
      return;
    end if;
  end if;
  -- Anything that is not a proven continuation falls through and is charged.

  -- Floor test: spend anything only while the balance is not already used up. A turn may
  -- overshoot on settle, which blocks the next ask rather than abandoning a half-applied plan.
  select coalesce(pg_catalog.sum(p.credits), 0) into v_used
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if p_limit is not null and v_used >= p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.prompts (user_id, catalogue, turn_id, kind, credits)
  values (v_uid, p_catalogue, pg_catalog.gen_random_uuid(), p_kind, p_credits)
  returning prompts.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

-- The variable part of a turn's price, known only once the turn is over.
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

  update public.prompts p
     set credits = least(p.credits + p_extra_credits, 100)
   where p.turn_id = p_turn_id
     and p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime > pg_catalog.now() - interval '15 minutes';
  return found;
end;
$$;

alter function private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean) owner to postgres;
alter function private.settle_ai_turn(uuid, integer)                           owner to postgres;
revoke all on function
  private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean),
  private.settle_ai_turn(uuid, integer)
from public;
grant execute on function
  private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean),
  private.settle_ai_turn(uuid, integer)
to app_user;

-- my_usage reports the credit balance; the prompt row count and the OCR count are retired.
-- Return type changes, so it is dropped rather than replaced.
drop function if exists private.my_usage();

create or replace function private.my_usage()
returns table (catalogues bigint, credits bigint, pageviews bigint, unique_visitors bigint)
language sql
stable
set search_path = ''
as $$
  with me as (select private.current_user_id() as uid),
       m  as (select pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') as s,
                     pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') + interval '1 month' as e)
  select
    (select pg_catalog.count(*) from public.catalogues c, me where c.created_by = me.uid),
    (select coalesce(pg_catalog.sum(p.credits), 0)::bigint from public.prompts p, me, m
      where p.user_id = me.uid and p.refunded_at is null and p.datetime >= m.s and p.datetime < m.e),
    (select coalesce(pg_catalog.sum(a.pageview_count), 0)::bigint from public.analytics a, me, m
      where a.user_id = me.uid and a.date >= m.s and a.date < m.e),
    (select coalesce(pg_catalog.sum(a.unique_visitors), 0)::bigint from public.analytics a, me, m
      where a.user_id = me.uid and a.date >= m.s and a.date < m.e)
$$;

alter function private.my_usage() owner to postgres;
revoke all on function private.my_usage() from public;
grant execute on function private.my_usage() to app_user;

-- The OCR limit is retired: recognition runs in the browser and nothing has written
-- this table since. Dropped after my_usage stops reading it, so the order above matters.
-- No CASCADE: nothing references it today, and a plain drop fails loudly if that changes.
drop table if exists public.ocr;
