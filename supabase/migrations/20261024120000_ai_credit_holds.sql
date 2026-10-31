-- AI credits become a hard cap (plan 2026-10-24-ai-credit-hard-cap).
--
-- Until now begin_ai_turn checked the balance only when a request started, and
-- settle_ai_turn added the variable part afterwards with no ceiling, so one ask - or
-- several sent at once - could finish well past the allowance. A request now holds the
-- most it may spend, under the same users-row lock as the charge, and every live hold
-- counts against the month's balance. It spends only from its hold (spend_ai_hold) and
-- gives the rest back when it ends (release_ai_hold). A hold left behind by a request
-- that was killed expires on its own.
--
-- settle_ai_turn is left in place for the app still deployed while this runs; it is
-- dropped once the new app is live everywhere.

alter table public.ai_credits
  add column if not exists held       integer not null default 0,
  add column if not exists held_until timestamptz;

alter table public.ai_credits
  add constraint ai_credits_held_range check (held between 0 and 100);

drop function if exists private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean);

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

  -- Serialise this user's charges without blocking FK key-share locks (CHANGE C7).
  perform 1 from public.users u where u.id = v_uid for no key update;

  -- Confirmed charges plus every hold still live: what another request may not spend.
  select coalesce(pg_catalog.sum(a.credits), 0)
       + coalesce(pg_catalog.sum(a.held) filter (where a.held_until > pg_catalog.now()), 0)
    into v_used
    from public.ai_credits a
   where a.user_id = v_uid
     and a.refunded_at is null
     and a.created_at >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');

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
       -- A root row from last month would put this month's spend on last month's bill.
       and a.created_at >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC')
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

-- Moves part of a request's hold into its charge. Never more than is held, so the
-- balance can never pass the allowance however a request's spend is reported.
create or replace function private.spend_ai_hold(
  p_turn_id uuid,
  p_credits integer)
returns integer
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid   text := private.current_user_id();
  v_moved integer;
begin
  if p_credits is null or p_credits < 0 or p_credits > 100 then
    raise exception 'spend_ai_hold: invalid credits %', p_credits using errcode = '22023';
  end if;
  if v_uid is null then
    return 0;
  end if;

  select least(p_credits, a.held) into v_moved
    from public.ai_credits a
   where a.turn_id = p_turn_id
     and a.user_id = v_uid
     and a.refunded_at is null
     and a.held_until > pg_catalog.now()
   for update;
  if v_moved is null or v_moved = 0 then
    return 0;
  end if;

  update public.ai_credits a
     set credits = least(a.credits + v_moved, 100),
         held    = a.held - v_moved
   where a.turn_id = p_turn_id
     and a.user_id = v_uid;
  return v_moved;
end;
$$;

-- Gives back what a request held and did not spend.
create or replace function private.release_ai_hold(p_turn_id uuid)
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
  update public.ai_credits a
     set held = 0,
         held_until = null
   where a.turn_id = p_turn_id
     and a.user_id = v_uid;
  return found;
end;
$$;

alter function private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean, integer) owner to postgres;
alter function private.spend_ai_hold(uuid, integer) owner to postgres;
alter function private.release_ai_hold(uuid) owner to postgres;
revoke all on function
  private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean, integer),
  private.spend_ai_hold(uuid, integer),
  private.release_ai_hold(uuid)
from public;
grant execute on function
  private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean, integer),
  private.spend_ai_hold(uuid, integer),
  private.release_ai_hold(uuid)
to app_user;
