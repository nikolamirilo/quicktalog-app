-- 41_ai_plan_binding.test.sql
--
-- M06 (20260921181106_ai_turn_plan_binding.sql): a turn is bound to the plan it was started
-- under, so a continuation is free only when the client presents the turn id it was given and
-- the hash of the plan it is resuming, and the DB still holds that user's open plan on that
-- catalogue. Everything the caller sends is a claim; every limit is read from the database.
--
-- Fixtures use uuid-shaped user ids (plan section 11.3), never Clerk `user_...` ids.
-- Everything runs inside one transaction that is rolled back.

create extension if not exists pgtap with schema extensions;

begin;

-- pg_temp stays implicit (and therefore first) so pgTAP finds its own result tables.
set local search_path to extensions, public;

select plan(35);

-- ---------------------------------------------------------------------------
-- Fixture scaffolding
-- ---------------------------------------------------------------------------

-- The app roles (M01 1.1) must be able to reach the pgTAP extension objects while a test
-- statement runs under `set local role`. Assertions themselves are always made after
-- `reset role`, because pgTAP records results in temp tables owned by the session user.
grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;

create schema pgtap_fixtures;
grant usage on schema pgtap_fixtures to app_user, app_public;

create table pgtap_fixtures.obs (
  label   text primary key,
  outcome text,
  turn_id uuid,
  flag    boolean,
  code    text
);
grant select, insert, update on pgtap_fixtures.obs to app_user, app_public;

create function pgtap_fixtures.errcode(p_sql text) returns text
language plpgsql
as $fn$
begin
  execute p_sql;
  return '00000';
exception when others then
  return sqlstate;
end;
$fn$;
grant execute on function pgtap_fixtures.errcode(text) to app_user, app_public;

-- Two 64-hex plan hashes in the shape prompts_plan_hash_format demands (M06:16).
create table pgtap_fixtures.hashes (label text primary key, value text);
insert into pgtap_fixtures.hashes (label, value)
values ('h1', pg_catalog.repeat('a', 64)),
       ('h2', pg_catalog.repeat('b', 64));
grant select on pgtap_fixtures.hashes to app_user, app_public;

-- ---------------------------------------------------------------------------
-- Fixture data
-- ---------------------------------------------------------------------------
insert into public.plans (id, name)
values ('pri_pgtap_plan_binding', 'pgTAP fixture plan')
on conflict (id) do nothing;

insert into public.users (id, name, email, plan_id)
values ('33333333-3333-4333-8333-333333333333', 'Owner C', 'pgtap-owner-c@example.com', 'pri_pgtap_plan_binding'),
       ('44444444-4444-4444-8444-444444444444', 'Owner D', 'pgtap-owner-d@example.com', 'pri_pgtap_plan_binding'),
       ('55555555-5555-4555-8555-555555555555', 'Owner E', 'pgtap-owner-e@example.com', 'pri_pgtap_plan_binding');

insert into public.catalogues (name, created_by, status, tags)
values ('pgtap-plan-c', '33333333-3333-4333-8333-333333333333', 'draft', '{}'::text[]),
       ('pgtap-plan-d', '44444444-4444-4444-8444-444444444444', 'draft', '{}'::text[]),
       ('pgtap-plan-e', '55555555-5555-4555-8555-555555555555', 'draft', '{}'::text[]);

-- Owner E already has two charged turns this month; the limit tests read them back out of the DB.
insert into public.prompts (user_id, catalogue, turn_id)
values ('55555555-5555-4555-8555-555555555555', 'pgtap-plan-e', '5e000000-0000-4000-8000-000000000001'::uuid),
       ('55555555-5555-4555-8555-555555555555', 'pgtap-plan-e', '5e000000-0000-4000-8000-000000000002'::uuid);

-- ===========================================================================
-- 1. The columns and constraints the binding is made of (M06:9-16)
-- ===========================================================================

select col_not_null('public', 'prompts', 'kind',
  'M06:10: prompts.kind is NOT NULL (agent turns and describe turns are metered apart)');

select col_not_null('public', 'prompts', 'plan_open',
  'M06:11: prompts.plan_open is NOT NULL, so "is there an open plan" is never unknown');

select col_not_null('public', 'prompts', 'plan_budget',
  'M06:12: prompts.plan_budget is NOT NULL, so the free-continuation budget is never unknown');

select has_column('public', 'prompts', 'plan_hash',
  'M06:13: prompts.plan_hash stores the hash of the plan the turn was started under');

-- M06:14
select is(
  pgtap_fixtures.errcode($sql$
    insert into public.prompts (user_id, catalogue, kind)
    values ('33333333-3333-4333-8333-333333333333', 'pgtap-plan-c', 'bogus')
  $sql$),
  '23514',
  'M06:14: prompts_kind_check rejects a kind outside (agent, describe)');

-- M06:15
select is(
  pgtap_fixtures.errcode($sql$
    insert into public.prompts (user_id, catalogue, plan_budget)
    values ('33333333-3333-4333-8333-333333333333', 'pgtap-plan-c', 9)
  $sql$),
  '23514',
  'M06:15: prompts_plan_budget_range caps the stored budget at 8 (MAX_PLAN_CONTINUATIONS)');

-- M06:16
select is(
  pgtap_fixtures.errcode($sql$
    insert into public.prompts (user_id, catalogue, plan_hash)
    values ('33333333-3333-4333-8333-333333333333', 'pgtap-plan-c', 'not-a-sha256')
  $sql$),
  '23514',
  'M06:16: prompts_plan_hash_format only accepts a 64-character lowercase hex digest');

-- M06:18 drops the M05 (text, integer, boolean) form; M06:20-25 creates the plan-bound one.
select is(
  (select pg_catalog.string_agg(pg_catalog.pg_get_function_identity_arguments(p.oid), ' | ' order by p.oid)
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private' and p.proname = 'begin_ai_turn'),
  'p_catalogue text, p_limit integer, p_kind text, p_continuation_of uuid, p_plan_hash text',
  'M06:18-25: the M05 boolean-continuation begin_ai_turn is dropped; only the plan-bound form remains');

-- M06:176-180
select ok(
  pg_catalog.has_function_privilege(
    'app_user', 'private.set_plan_state(uuid, boolean, integer, text)'::regprocedure, 'EXECUTE'),
  'M06:176-180: app_user may execute private.set_plan_state');

-- M06:171-175
select ok(
  not pg_catalog.has_function_privilege(
    'public', 'private.set_plan_state(uuid, boolean, integer, text)'::regprocedure, 'EXECUTE'),
  'M06:171-175: PUBLIC holds no EXECUTE on private.set_plan_state');

-- ===========================================================================
-- 2. A turn is bound to the plan it was started under
-- ===========================================================================

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c1', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent', null::uuid, null::text) t;
-- onFinish of the charged turn: the server, not the client, writes the plan state.
insert into pgtap_fixtures.obs (label, flag)
values ('c1_open', private.set_plan_state(
  (select turn_id from pgtap_fixtures.obs where label = 'c1'),
  true, 3, (select value from pgtap_fixtures.hashes where label = 'h1')));
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'c1'),
  'charged',
  'M06:86-89: the first agent turn on an owned catalogue is charged');

select ok(
  (select flag from pgtap_fixtures.obs where label = 'c1_open'),
  'M06:112-125: set_plan_state opens the plan on the caller''s own fresh turn');

select ok(
  exists (select 1 from public.prompts p
           where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')
             and p.plan_open
             and p.plan_budget = 3
             and p.plan_hash = (select value from pgtap_fixtures.hashes where label = 'h1')),
  'M06:113-119: the turn is bound to the plan it was started under (open, budget 3, hash h1)');

-- M06:121 - set_plan_state only ever touches private.current_user_id()'s own row.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, flag)
values ('d_rebinds_c1', private.set_plan_state(
  (select turn_id from pgtap_fixtures.obs where label = 'c1'),
  true, 8, (select value from pgtap_fixtures.hashes where label = 'h2')));
reset role;

select ok(
  not (select flag from pgtap_fixtures.obs where label = 'd_rebinds_c1'),
  'M06:121: another user cannot rebind someone else''s turn to a different plan');

select ok(
  exists (select 1 from public.prompts p
           where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')
             and p.plan_budget = 3
             and p.plan_hash = (select value from pgtap_fixtures.hashes where label = 'h1')),
  'M06:121: the binding of the victim''s turn is untouched after the foreign rebind attempt');

-- ===========================================================================
-- 3. A matching continuation is free; a stale or forged one is charged
-- ===========================================================================

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c1_cont_ok', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c1'),
         (select value from pgtap_fixtures.hashes where label = 'h1')) t;
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'c1_cont_ok'),
  'continued',
  'M06:56-72: the real turn id plus the real plan hash continues for free');

select ok(
  (select turn_id from pgtap_fixtures.obs where label = 'c1_cont_ok')
    = (select turn_id from pgtap_fixtures.obs where label = 'c1'),
  'M06:68: a continuation returns the root turn id it was charged under');

select is(
  (select p.continuations from public.prompts p
    where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')),
  1,
  'M06:58: the free continuation is counted against the root turn');

-- M06:64 - the plan hash must match the one the server stored.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c1_cont_forged', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c1'),
         (select value from pgtap_fixtures.hashes where label = 'h2')) t;
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'c1_cont_forged'),
  'charged',
  'M06:64,74: a continuation carrying a stale or forged plan hash falls through and is charged');

select ok(
  (select turn_id from pgtap_fixtures.obs where label = 'c1_cont_forged')
    <> (select turn_id from pgtap_fixtures.obs where label = 'c1'),
  'M06:86-88: the forged continuation gets a brand new, separately charged turn id');

select is(
  (select p.continuations from public.prompts p
    where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')),
  1,
  'M06:64: the forged continuation did not consume the root turn''s free budget');

-- M06:60 - the turn must belong to the caller.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'd_cont_c1', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-d', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c1'),
         (select value from pgtap_fixtures.hashes where label = 'h1')) t;
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'd_cont_c1'),
  'charged',
  'M06:60: another user replaying a captured turn id and plan hash is charged, not continued');

select is(
  (select p.continuations from public.prompts p
    where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')),
  1,
  'M06:60: the victim''s free budget is untouched by the replay');

-- ===========================================================================
-- 4. The budget is the database's, not the caller's
-- ===========================================================================

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"app_user"}', true); end $$;
set local role app_user;
-- The client now claims a much bigger plan on a turn that is already open and continued.
insert into pgtap_fixtures.obs (label, flag)
values ('c1_regrow', private.set_plan_state(
  (select turn_id from pgtap_fixtures.obs where label = 'c1'),
  true, 8, (select value from pgtap_fixtures.hashes where label = 'h1')));
-- A fresh turn whose first open claims 50 pending tasks.
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c2', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent', null::uuid, null::text) t;
insert into pgtap_fixtures.obs (label, flag)
values ('c2_open', private.set_plan_state(
  (select turn_id from pgtap_fixtures.obs where label = 'c2'),
  true, 50, (select value from pgtap_fixtures.hashes where label = 'h1')));
reset role;

select is(
  (select p.plan_budget from public.prompts p
    where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')),
  3,
  'M06:114-118: the budget is fixed at the first open and never grows on a later set_plan_state');

select is(
  (select p.plan_budget from public.prompts p
    where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c2')),
  8,
  'M06:116: a caller claiming 50 pending tasks gets the DB ceiling of 8, not what it asked for');

-- M06:67 - continuations < plan_budget. c1 has budget 3 and 1 continuation; two more are free,
-- the fourth falls through to a charge.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c1_cont_2', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c1'),
         (select value from pgtap_fixtures.hashes where label = 'h1')) t;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c1_cont_3', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c1'),
         (select value from pgtap_fixtures.hashes where label = 'h1')) t;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c1_cont_4', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c1'),
         (select value from pgtap_fixtures.hashes where label = 'h1')) t;
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'c1_cont_4'),
  'charged',
  'M06:67: the continuation past plan_budget is charged instead of being free');

select is(
  (select p.continuations from public.prompts p
    where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c1')),
  3,
  'M06:67: free continuations stop at the stored plan_budget (3)');

-- ===========================================================================
-- 5. The monthly limit is counted in the database
-- ===========================================================================
-- p_limit comes from `tiers` via users.plan_id read in the same transaction (M05 5.5 header);
-- the usage it is compared against is counted from public.prompts, not supplied by the caller.

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555555","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'e_at_limit', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-e', 2, 'agent', null::uuid, null::text) t;
-- Refunding one of the two existing charges must give the quota back.
insert into pgtap_fixtures.obs (label, flag)
values ('e_refund', private.refund_ai_turn('5e000000-0000-4000-8000-000000000001'::uuid));
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'e_after_refund', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-e', 2, 'agent', null::uuid, null::text) t;
insert into pgtap_fixtures.obs (label, code)
values ('e_negative_limit', pgtap_fixtures.errcode($sql$
  select * from private.begin_ai_turn('pgtap-plan-e', -1, 'agent', null::uuid, null::text)
$sql$));
insert into pgtap_fixtures.obs (label, code)
values ('e_bad_kind', pgtap_fixtures.errcode($sql$
  select * from private.begin_ai_turn('pgtap-plan-e', 100, 'bogus', null::uuid, null::text)
$sql$));
insert into pgtap_fixtures.obs (label, code)
values ('e_bad_hash', pgtap_fixtures.errcode($sql$
  select private.set_plan_state('5e000000-0000-4000-8000-000000000002'::uuid, true, 2, 'not-a-sha256')
$sql$));
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'e_at_limit'),
  'limit',
  'M06:76-84: usage is counted from public.prompts in the DB, so two charged rows exhaust a limit of 2');

select ok(
  (select flag from pgtap_fixtures.obs where label = 'e_refund'),
  'M06:156-164: the owner refunds one of its own charged turns');

select is(
  (select outcome from pgtap_fixtures.obs where label = 'e_after_refund'),
  'charged',
  'M06:78-79: refunded rows drop out of the monthly count, so the same limit now allows a charge');

select is(
  (select code from pgtap_fixtures.obs where label = 'e_negative_limit'),
  '22023',
  'M06:40-42: a negative p_limit from the caller is rejected (22023), never treated as "no limit"');

select is(
  (select code from pgtap_fixtures.obs where label = 'e_bad_kind'),
  '22023',
  'M06:43-45: a kind outside (agent, describe) is rejected (22023)');

select is(
  (select code from pgtap_fixtures.obs where label = 'e_bad_hash'),
  '22023',
  'M06:109-110: set_plan_state rejects a plan hash that is not a 64-character hex digest');

-- ===========================================================================
-- 6. Closing a plan ends the free window
-- ===========================================================================

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333333","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, flag)
values ('c2_close', private.set_plan_state(
  (select turn_id from pgtap_fixtures.obs where label = 'c2'), false, 0, null::text));
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'c2_cont_closed', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-plan-c', 100, 'agent',
         (select turn_id from pgtap_fixtures.obs where label = 'c2'),
         (select value from pgtap_fixtures.hashes where label = 'h1')) t;
reset role;

select ok(
  exists (select 1 from public.prompts p
           where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'c2')
             and not p.plan_open
             and p.plan_hash is null),
  'M06:107,113,119: closing the plan clears plan_open and drops the stored plan hash');

select is(
  (select outcome from pgtap_fixtures.obs where label = 'c2_cont_closed'),
  'charged',
  'M06:63: once the plan is closed the same turn id and hash no longer buy a free continuation');

select * from finish();

rollback;
