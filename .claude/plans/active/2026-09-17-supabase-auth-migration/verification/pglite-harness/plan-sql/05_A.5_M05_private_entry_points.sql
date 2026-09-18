-- Verified (PGlite) plus CHANGE C6 (stricter email pattern: no quotes or spreadsheet-formula payloads) and
-- CHANGE C7 (FOR NO KEY UPDATE: serialises one user's charges without blocking FK key-share locks); both
-- PGlite-verified (final run; C7 through the tuple lock bits, since PGlite has one connection).
-- begin_ai_turn and refund_ai_turn defined here are replaced by M06 before any code calls them.

-- 5.1 Slug availability, drafts included -------------------------------------------------------------------
-- Call sites: actions/catalogue.ts:151 (duplicate loop), :187 (create pre-check), hooks/useCatalogueName.ts:91
-- (today downloads every slug via GET /api/items?type=name). app_user cannot see other owners' rows, so a
-- definer check is required. One boolean per call, signed-in only, rate-limited in the server action.
-- catalogues_new_name_key stays the final guard (map 23505 to "name taken").
create or replace function private.catalogue_name_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.current_user_id() is not null
     and p_name is not null
     and pg_catalog.length(p_name) > 0
     and not exists (select 1 from public.catalogues c where c.name = p_name)
$$;

-- 5.2 Catalogue newsletter signup ----------------------------------------------------------------------------
-- Call site: actions/newsletter.ts:19-58 (callers components/catalogue/view/CatalogueFooter.tsx:42-46).
-- WHY: today owner_id and catalogue_id come from the browser and the catalogue need not be active or have
-- the newsletter enabled. The owner is now derived from the row; draft/inactive/disabled catalogues and
-- malformed emails are silently ignored and duplicates are no-ops, so the caller gets one constant response
-- (no subscription or catalogue-state oracle). Footer.newsletter is a boolean
-- (../quicktalog-packages/src/types/catalogue.d.ts:175); jsonb equality avoids cast errors on bad data.
create or replace function private.subscribe_catalogue_newsletter(p_catalogue_id uuid, p_email text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_email text := pg_catalog.lower(pg_catalog.btrim(p_email));
  v_owner text;
begin
  if v_email is null or pg_catalog.length(v_email) > 254
     or v_email !~ '^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,63}$' then   -- CHANGE C6
    return;
  end if;
  select c.created_by into v_owner
    from public.catalogues c
   where c.id = p_catalogue_id
     and c.status = 'active'
     and (c.footer -> 'newsletter') = 'true'::jsonb;
  if v_owner is null then
    return;
  end if;
  insert into public.newsletter (email, catalogue_id, owner_id)
  values (v_email, p_catalogue_id, v_owner)
  on conflict (catalogue_id, (pg_catalog.lower(email))) do nothing;
end;
$$;

-- 5.3 Product newsletter signup -----------------------------------------------------------------------------
-- Call site: actions/newsletter.ts:60-87 (caller components/navigation/Footer.tsx:31).
create or replace function private.subscribe_product_newsletter(p_email text)
returns void
language plpgsql
volatile
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
  insert into public.product_newsletter (email)
  values (v_email)
  on conflict ((pg_catalog.lower(email))) do nothing;
end;
$$;

-- 5.4 Usage for the signed-in user (SECURITY INVOKER: runs under app_user RLS) ------------------------------
-- Call sites: lib/users/fetchUserData.ts:93,98,112,123 (4 queries, month bounds frozen at module load in
-- helpers/client.ts:21-23). One round trip; month bounds computed in SQL in UTC.
create or replace function private.my_usage()
returns table (catalogues bigint, prompts bigint, ocr bigint, pageviews bigint, unique_visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  with me as (select private.current_user_id() as uid),
       m  as (select pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') as s,
                     pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC') + interval '1 month' as e)
  select
    (select pg_catalog.count(*) from public.catalogues c, me where c.created_by = me.uid),
    (select pg_catalog.count(*) from public.prompts p, me, m
      where p.user_id = me.uid and p.refunded_at is null and p.datetime >= m.s and p.datetime < m.e),
    (select pg_catalog.count(*) from public.ocr o, me, m
      where o.user_id = me.uid and o.datetime >= m.s and o.datetime < m.e),
    (select coalesce(pg_catalog.sum(a.pageview_count), 0)::bigint from public.analytics a, me, m
      where a.user_id = me.uid and a.date >= m.s and a.date < m.e),
    (select coalesce(pg_catalog.sum(a.unique_visitors), 0)::bigint from public.analytics a, me, m
      where a.user_id = me.uid and a.date >= m.s and a.date < m.e)
$$;

-- 5.5 AI charge (server-authoritative metering) ---------------------------------------------------------------
-- Call sites: app/api/agent/route.ts:56 (authorize, before streaming) and :112-129 (onFinish meter, today
-- after the stream and skipped for client-forged plan continuations at :123); actions/ai.ts:29,58.
-- Charges BEFORE any model spend, in the same short withUser transaction that read the plan
-- (lib/entitlements/plan.ts getPlanForUpdate). Serialised per user by locking the users row, which closes
-- the check-then-charge race (lib/ai/access.ts:66-75). A continuation is free only if the DB holds a recent,
-- unrefunded, charged turn for the same user and catalogue (<15 min, <9 continuations; caps are product
-- decisions, unverified against plans/active/ai-agent-plan-mode.md). A forged continuation falls through and is
-- charged. p_limit comes from `tiers` via users.plan_id read in the same transaction; acceptable because
-- app_user is reachable only by server code.
create or replace function private.begin_ai_turn(p_catalogue text, p_limit integer, p_continuation boolean)
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

  if p_catalogue is null or not exists (
       select 1 from public.catalogues c where c.name = p_catalogue and c.created_by = v_uid) then
    return query select 'not_found'::text, null::uuid;
    return;
  end if;

  -- The catalogue FK guarantees the users row exists; lock it to serialise this user's charges.
  perform 1 from public.users u where u.id = v_uid for no key update;   -- CHANGE C7

  if coalesce(p_continuation, false) then
    update public.prompts p
       set continuations = p.continuations + 1
     where p.id = (select p2.id
                     from public.prompts p2
                    where p2.user_id = v_uid
                      and p2.catalogue = p_catalogue
                      and p2.refunded_at is null
                      and p2.datetime > pg_catalog.now() - interval '15 minutes'
                      and p2.continuations < 9
                    order by p2.datetime desc, p2.id desc   -- id breaks ties (now() is constant within one transaction)
                    limit 1)
    returning p.turn_id into v_turn;
    if v_turn is not null then
      return query select 'continued'::text, v_turn;
      return;
    end if;
  end if;

  select pg_catalog.count(*) into v_used
    from public.prompts p
   where p.user_id = v_uid
     and p.refunded_at is null
     and p.datetime >= pg_catalog.date_trunc('month', pg_catalog.now(), 'UTC');
  if p_limit is not null and v_used >= p_limit then
    return query select 'limit'::text, null::uuid;
    return;
  end if;

  insert into public.prompts (user_id, catalogue, turn_id)
  values (v_uid, p_catalogue, pg_catalog.gen_random_uuid())
  returning prompts.turn_id into v_turn;
  return query select 'charged'::text, v_turn;
end;
$$;

-- 5.6 AI refund (only for a turn that did nothing) ---------------------------------------------------------
-- Call sites: app/api/agent/route.ts onFinish when session.applied is empty and no plan was created;
-- actions/ai.ts when generation fails. Only the caller's own, un-continued, un-refunded turn younger than
-- 10 minutes. Rows are flagged, never deleted (append-only ledger).
create or replace function private.refund_ai_turn(p_turn_id uuid)
returns boolean
language sql
volatile
security definer
set search_path = ''
as $$
  with r as (
    update public.prompts
       set refunded_at = pg_catalog.now()
     where turn_id = p_turn_id
       and user_id = private.current_user_id()
       and continuations = 0
       and refunded_at is null
       and datetime > pg_catalog.now() - interval '10 minutes'
    returning 1
  )
  select exists (select 1 from r)
$$;

-- 5.7 Ownership and EXECUTE --------------------------------------------------------------------------------
alter function private.catalogue_name_available(text)               owner to postgres;
alter function private.subscribe_catalogue_newsletter(uuid, text)     owner to postgres;
alter function private.subscribe_product_newsletter(text)             owner to postgres;
alter function private.my_usage()                                     owner to postgres;
alter function private.begin_ai_turn(text, integer, boolean)          owner to postgres;
alter function private.refund_ai_turn(uuid)                           owner to postgres;

revoke all on function
  private.catalogue_name_available(text),
  private.subscribe_catalogue_newsletter(uuid, text),
  private.subscribe_product_newsletter(text),
  private.my_usage(),
  private.begin_ai_turn(text, integer, boolean),
  private.refund_ai_turn(uuid)
from public;

grant execute on function
  private.catalogue_name_available(text),
  private.my_usage(),
  private.begin_ai_turn(text, integer, boolean),
  private.refund_ai_turn(uuid)
to app_user;

grant execute on function
  private.subscribe_catalogue_newsletter(uuid, text),
  private.subscribe_product_newsletter(text)
to app_public, app_user;
