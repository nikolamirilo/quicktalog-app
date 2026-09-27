-- The cap has to bind during a plan, not only before it.
--
-- As shipped in 20260926120000 the floor test ran only for a fresh turn, and only
-- asked "is anything left" - so a turn could start with 1 credit and settle far past
-- the allowance, and a continuation skipped the test entirely because it returns
-- before reaching it. A free user building one catalogue landed on 16 of 15 credits.
--
-- Two changes, both in the same function; the signature is unchanged so this is a
-- plain replace:
--   1. A new turn must be able to afford its base price, not merely have a credit left.
--   2. A continuation is refused once the balance is spent, so a long plan stops on a
--      task boundary. The route turns that into a plan halt, and the checklist shows
--      exactly which tasks landed.

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

  select coalesce(pg_catalog.sum(p.credits), 0) into v_used
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');

  if p_kind = 'agent' and p_continuation_of is not null and p_plan_hash is not null then
    -- A continuation takes no charge now but settles one per task when it ends,
    -- so it needs headroom. Refusing here stops the plan on a task boundary
    -- instead of letting it run the balance further into the red.
    if p_limit is not null and v_used >= p_limit then
      return query select 'limit'::text, null::uuid;
      return;
    end if;

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

  -- A new turn must be able to pay its base price. "Has one credit left" was not
  -- enough: it let a 2-credit turn start on a balance of 1 and finish over.
  if p_limit is not null and v_used + p_credits > p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.prompts (user_id, catalogue, turn_id, kind, credits)
  values (v_uid, p_catalogue, pg_catalog.gen_random_uuid(), p_kind, p_credits)
  returning prompts.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

alter function private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean) owner to postgres;
revoke all on function private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean) from public;
grant execute on function private.begin_ai_turn(text, integer, text, uuid, text, integer, boolean) to app_user;
