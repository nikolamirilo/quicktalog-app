-- CHANGE C8 (PGlite-verified, final run).
-- Resolves the red-team finding that forged plan continuations gave ~10 steerable free turns per charged turn,
-- and caps no-op refunds. A continuation is free only when the client presents the turn id it received in the
-- stream metadata AND the hash of the plan it resumes, and the DB holds that user's open agent plan on that
-- catalogue, younger than 15 minutes, with continuations < plan_budget (<= 8 = MAX_PLAN_CONTINUATIONS).
-- The plan state is written only by server code at the end of a turn (private.set_plan_state).
-- New pgTAP file: 41_ai_plan_binding.test.sql. Replaces the M05 AI functions before any code calls them.

alter table public.prompts
  add column if not exists kind        text    not null default 'agent',
  add column if not exists plan_open   boolean not null default false,
  add column if not exists plan_budget integer not null default 0,
  add column if not exists plan_hash   text;
alter table public.prompts add constraint prompts_kind_check        check (kind in ('agent', 'describe'));
alter table public.prompts add constraint prompts_plan_budget_range check (plan_budget between 0 and 8);
alter table public.prompts add constraint prompts_plan_hash_format  check (plan_hash is null or plan_hash ~ '^[0-9a-f]{64}$');

drop function if exists private.begin_ai_turn(text, integer, boolean);

create or replace function private.begin_ai_turn(
  p_catalogue       text,
  p_limit           integer,
  p_kind            text,
  p_continuation_of uuid,
  p_plan_hash       text)
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

  select pg_catalog.count(*) into v_used
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if p_limit is not null and v_used >= p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.prompts (user_id, catalogue, turn_id, kind)
  values (v_uid, p_catalogue, pg_catalog.gen_random_uuid(), p_kind)
  returning prompts.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

-- Called by the agent route in onFinish of a charged turn or a continuation, with values derived from the
-- server-side session. The budget is fixed at the first open and never grows; closing is always allowed.
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
  update public.prompts p
     set plan_open   = v_open,
         plan_budget = case
                         when p.plan_budget = 0 and p.continuations = 0 and v_open
                           then least(8, greatest(coalesce(p_tasks_pending, 0), 0))
                         else p.plan_budget
                       end,
         plan_hash   = case when v_open then p_plan_hash else null end
   where p.turn_id = p_turn_id
     and p.user_id = private.current_user_id()
     and p.kind = 'agent'
     and p.refunded_at is null
     and p.datetime > pg_catalog.now() - interval '15 minutes';
  return found;
end;
$$;

-- Refund only a charged turn that did nothing: own, not continued, no open plan, not refunded, < 10 minutes old,
-- and below the monthly refund cap (private.settings.ai_refund_cap_per_month, default 30; product decision).
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
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if v_refunded >= v_cap then
    return false;
  end if;
  update public.prompts p
     set refunded_at = pg_catalog.now()
   where p.turn_id = p_turn_id
     and p.user_id = v_uid
     and p.continuations = 0
     and not p.plan_open
     and p.refunded_at is null
     and p.datetime > pg_catalog.now() - interval '10 minutes';
  return found;
end;
$$;

alter function private.begin_ai_turn(text, integer, text, uuid, text)  owner to postgres;
alter function private.set_plan_state(uuid, boolean, integer, text)    owner to postgres;
alter function private.refund_ai_turn(uuid)                            owner to postgres;
revoke all on function
  private.begin_ai_turn(text, integer, text, uuid, text),
  private.set_plan_state(uuid, boolean, integer, text),
  private.refund_ai_turn(uuid)
from public;
grant execute on function
  private.begin_ai_turn(text, integer, text, uuid, text),
  private.set_plan_state(uuid, boolean, integer, text),
  private.refund_ai_turn(uuid)
to app_user;
