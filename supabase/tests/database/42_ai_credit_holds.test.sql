-- 42_ai_credit_holds.test.sql
--
-- 20261024120000_ai_credit_holds: AI credits are a hard cap. A request holds the most it
-- may spend under the users-row lock, live holds count against the balance of the account's
-- current 30-day period (20261029120000), a request spends only from its own hold, and an
-- unreleased hold expires on its own.
--
-- Runs inside one transaction that is rolled back. Limits are passed explicitly (20 unless
-- a row says otherwise), so the fixture plan does not matter.

create extension if not exists pgtap with schema extensions;

begin;

set local search_path to extensions, public;

select plan(28);

grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;

create schema pgtap_holds;
grant usage on schema pgtap_holds to app_user;
create table pgtap_holds.obs (label text primary key, outcome text, turn_id uuid, num integer, code text);
grant select, insert, update on pgtap_holds.obs to app_user;

create function pgtap_holds.errcode(p_sql text) returns text
language plpgsql
as $fn$
begin
  execute p_sql;
  return '00000';
exception when others then
  return sqlstate;
end;
$fn$;
grant execute on function pgtap_holds.errcode(text) to app_user;

insert into public.plans (id, name) values ('pri_pgtap_holds', 'pgTAP fixture plan')
on conflict (id) do nothing;

insert into public.users (id, name, email, plan_id) values
  ('a1a1a1a1-0000-4000-8000-00000000000a', 'Hold a', 'pgtap-hold-a@example.com', 'pri_pgtap_holds'),
  ('b1b1b1b1-0000-4000-8000-00000000000b', 'Hold b', 'pgtap-hold-b@example.com', 'pri_pgtap_holds'),
  ('c1c1c1c1-0000-4000-8000-00000000000c', 'Hold c', 'pgtap-hold-c@example.com', 'pri_pgtap_holds'),
  ('d1d1d1d1-0000-4000-8000-00000000000d', 'Hold d', 'pgtap-hold-d@example.com', 'pri_pgtap_holds'),
  ('e1e1e1e1-0000-4000-8000-00000000000e', 'Hold e', 'pgtap-hold-e@example.com', 'pri_pgtap_holds'),
  ('f1f1f1f1-0000-4000-8000-00000000000f', 'Hold f', 'pgtap-hold-f@example.com', 'pri_pgtap_holds'),
  ('a2a2a2a2-0000-4000-8000-00000000001a', 'Hold g', 'pgtap-hold-g@example.com', 'pri_pgtap_holds'),
  ('b2b2b2b2-0000-4000-8000-00000000001b', 'Hold h', 'pgtap-hold-h@example.com', 'pri_pgtap_holds'),
  ('c2c2c2c2-0000-4000-8000-00000000001c', 'Hold i', 'pgtap-hold-i@example.com', 'pri_pgtap_holds');
insert into public.catalogues (name, user_id, status, tags) values
  ('pgtap-hold-a', 'a1a1a1a1-0000-4000-8000-00000000000a', 'draft', '{}'::text[]),
  ('pgtap-hold-b', 'b1b1b1b1-0000-4000-8000-00000000000b', 'draft', '{}'::text[]),
  ('pgtap-hold-c', 'c1c1c1c1-0000-4000-8000-00000000000c', 'draft', '{}'::text[]),
  ('pgtap-hold-d', 'd1d1d1d1-0000-4000-8000-00000000000d', 'draft', '{}'::text[]),
  ('pgtap-hold-e', 'e1e1e1e1-0000-4000-8000-00000000000e', 'draft', '{}'::text[]),
  ('pgtap-hold-f', 'f1f1f1f1-0000-4000-8000-00000000000f', 'draft', '{}'::text[]),
  ('pgtap-hold-g', 'a2a2a2a2-0000-4000-8000-00000000001a', 'draft', '{}'::text[]),
  ('pgtap-hold-h', 'b2b2b2b2-0000-4000-8000-00000000001b', 'draft', '{}'::text[]),
  ('pgtap-hold-i', 'c2c2c2c2-0000-4000-8000-00000000001c', 'draft', '{}'::text[]);

-- A request holds what it may spend, and the hold counts against the balance.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"a1a1a1a1-0000-4000-8000-00000000000a","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'a1', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-a', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'a2', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-a', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
insert into pgtap_holds.obs (label, num)
select 'a3', private.spend_ai_hold((select turn_id from pgtap_holds.obs where label = 'a1'), 5);
insert into pgtap_holds.obs (label, num)
select 'a4', private.spend_ai_hold((select turn_id from pgtap_holds.obs where label = 'a1'), 50);
insert into pgtap_holds.obs (label, num)
select 'a5', private.spend_ai_hold((select turn_id from pgtap_holds.obs where label = 'a1'), 1);
reset role;

select is((select outcome from pgtap_holds.obs where label = 'a1'), 'charged', 'a new turn with room is charged');
select is((select num from pgtap_holds.obs where label = 'a1'), 18, 'it holds what it asked for while that fits');
select is((select outcome from pgtap_holds.obs where label = 'a2'), 'limit', 'a second turn sees the first one''s hold and is refused');
select is((select num from pgtap_holds.obs where label = 'a3'), 5, 'spend moves what was asked from the hold');
select is((select num from pgtap_holds.obs where label = 'a4'), 13, 'spend never moves more than is held');
select is((select num from pgtap_holds.obs where label = 'a5'), 0, 'nothing is left to spend once the hold is used');
select is((select a.credits from public.ai_credits a where a.turn_id = (select turn_id from pgtap_holds.obs where label = 'a1')), 20, 'the charge ends exactly at the allowance');

-- The base must fit; the hold takes only what is left after it.
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits)
values ('c1c1c1c1-0000-4000-8000-00000000000c', (select id from public.catalogues where name = 'pgtap-hold-c'), pg_catalog.gen_random_uuid(), 'agent', 18);
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"c1c1c1c1-0000-4000-8000-00000000000c","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'c6', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-c', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
reset role;

select is((select outcome from pgtap_holds.obs where label = 'c6'), 'charged', 'a turn that can just pay its base is charged');
select is((select num from pgtap_holds.obs where label = 'c6'), 0, 'and holds nothing more');
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits)
values ('b2b2b2b2-0000-4000-8000-00000000001b', (select id from public.catalogues where name = 'pgtap-hold-h'), pg_catalog.gen_random_uuid(), 'agent', 19);
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"b2b2b2b2-0000-4000-8000-00000000001b","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'h7', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-h', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
reset role;

select is((select outcome from pgtap_holds.obs where label = 'h7'), 'limit', 'a turn that cannot pay its base is refused');

-- An expired hold no longer counts and can no longer be spent.
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits, held, held_until)
values ('d1d1d1d1-0000-4000-8000-00000000000d', (select id from public.catalogues where name = 'pgtap-hold-d'), 'd0000000-0000-4000-8000-0000000000d0'::uuid, 'agent', 2, 10, pg_catalog.now() - interval '1 second');
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"d1d1d1d1-0000-4000-8000-00000000000d","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'd8', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-d', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
insert into pgtap_holds.obs (label, num)
select 'd9', private.spend_ai_hold('d0000000-0000-4000-8000-0000000000d0'::uuid, 1);
reset role;

select is((select num from pgtap_holds.obs where label = 'd8'), 16, 'the expired hold is not counted against the balance');
select is((select num from pgtap_holds.obs where label = 'd9'), 0, 'an expired hold cannot be spent');

-- Only the owner of a hold can spend or release it.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"b1b1b1b1-0000-4000-8000-00000000000b","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, num)
select 'b11', private.spend_ai_hold((select turn_id from pgtap_holds.obs where label = 'c6'), 1);
insert into pgtap_holds.obs (label, outcome)
select 'b11r', private.release_ai_hold((select turn_id from pgtap_holds.obs where label = 'a1'))::text;
reset role;

select is((select num from pgtap_holds.obs where label = 'b11'), 0, 'another user cannot spend someone''s hold');
select is((select outcome from pgtap_holds.obs where label = 'b11r'), 'false', 'another user cannot release someone''s hold');
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"a1a1a1a1-0000-4000-8000-00000000000a","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome)
select 'a10', private.release_ai_hold((select turn_id from pgtap_holds.obs where label = 'a1'))::text;
reset role;

select is((select outcome from pgtap_holds.obs where label = 'a10'), 'true', 'the owner releases their hold');
select is((select a.held from public.ai_credits a where a.turn_id = (select turn_id from pgtap_holds.obs where label = 'a1')), 0, 'a released hold is zero');

-- A continuation needs one credit of room, holds what is left, and runs one at a time.
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits, plan_open, plan_budget, plan_hash)
values ('e1e1e1e1-0000-4000-8000-00000000000e', (select id from public.catalogues where name = 'pgtap-hold-e'), 'e0000000-0000-4000-8000-0000000000e0'::uuid, 'agent', 20, true, 3, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"e1e1e1e1-0000-4000-8000-00000000000e","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'e12', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-e', 20, 'agent', 'e0000000-0000-4000-8000-0000000000e0'::uuid, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::text, 2, false, 18) t;
reset role;

select is((select outcome from pgtap_holds.obs where label = 'e12'), 'limit', 'a continuation with no credit left is refused');
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits, plan_open, plan_budget, plan_hash)
values ('c2c2c2c2-0000-4000-8000-00000000001c', (select id from public.catalogues where name = 'pgtap-hold-i'), 'e0000000-0000-4000-8000-0000000000e1'::uuid, 'agent', 19, true, 3, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"c2c2c2c2-0000-4000-8000-00000000001c","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'i13', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-i', 20, 'agent', 'e0000000-0000-4000-8000-0000000000e1'::uuid, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::text, 2, false, 18) t;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'i14', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-i', 20, 'agent', 'e0000000-0000-4000-8000-0000000000e1'::uuid, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::text, 2, false, 18) t;
reset role;

select is((select outcome from pgtap_holds.obs where label = 'i13'), 'continued', 'a continuation with room continues');
select is((select num from pgtap_holds.obs where label = 'i13'), 1, 'and holds only what is left');
select isnt((select outcome from pgtap_holds.obs where label = 'i14'), 'continued', 'a second copy of a continuation in flight is not a continuation');

-- A continuation is judged against the plan as it is now.
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits, plan_open, plan_budget, plan_hash)
values ('f1f1f1f1-0000-4000-8000-00000000000f', (select id from public.catalogues where name = 'pgtap-hold-f'), 'e0000000-0000-4000-8000-0000000000e2'::uuid, 'agent', 30, true, 3, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"f1f1f1f1-0000-4000-8000-00000000000f","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'f15', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-f', 15, 'agent', 'e0000000-0000-4000-8000-0000000000e2'::uuid, 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'::text, 2, false, 18) t;
reset role;

select is((select outcome from pgtap_holds.obs where label = 'f15'), 'limit', 'after a downgrade the continuation is refused under the lower limit');

-- A hold from the previous usage period does not reduce this period's allowance. The
-- fixture users were created now(), so their period starts today at 00:00 UTC.
insert into public.ai_credits (user_id, catalogue_id, turn_id, kind, credits, held, held_until, created_at)
values ('a2a2a2a2-0000-4000-8000-00000000001a', (select id from public.catalogues where name = 'pgtap-hold-g'), pg_catalog.gen_random_uuid(), 'agent', 0, 10,
        pg_catalog.now() + interval '1 hour',
        ((pg_catalog.now() at time zone 'UTC')::date::timestamp at time zone 'UTC') - interval '1 second');
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"a2a2a2a2-0000-4000-8000-00000000001a","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'g16', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-g', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
reset role;

select is((select num from pgtap_holds.obs where label = 'g16'), 18, 'a hold from the previous period is not counted');

-- Out-of-range holds and spends are rejected.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"b1b1b1b1-0000-4000-8000-00000000000b","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, code)
values ('b17', pgtap_holds.errcode($sql$ select * from private.begin_ai_turn('pgtap-hold-b', 20, 'agent', null::uuid, null::text, 2, false, 101) $sql$)),
       ('b17n', pgtap_holds.errcode($sql$ select * from private.begin_ai_turn('pgtap-hold-b', 20, 'agent', null::uuid, null::text, 2, false, -1) $sql$)),
       ('b18', pgtap_holds.errcode($sql$ select private.spend_ai_hold(pg_catalog.gen_random_uuid(), -1) $sql$));
reset role;

select is((select code from pgtap_holds.obs where label = 'b17'), '22023', 'a hold above 100 is rejected');
select is((select code from pgtap_holds.obs where label = 'b17n'), '22023', 'a negative hold is rejected');
select is((select code from pgtap_holds.obs where label = 'b18'), '22023', 'a negative spend is rejected');

-- Usage shows confirmed credits only; a hold is not usage.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"b1b1b1b1-0000-4000-8000-00000000000b","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_holds.obs (label, outcome, turn_id, num)
select 'b19', t.outcome, t.ai_turn_id, t.held
  from private.begin_ai_turn('pgtap-hold-b', 20, 'agent', null::uuid, null::text, 2, false, 18) t;
insert into pgtap_holds.obs (label, num)
select 'b19u', (select credits from private.my_usage())::integer;
reset role;

select is((select num from pgtap_holds.obs where label = 'b19u'), 2, 'my_usage counts the base, not the hold');

select ok(
  (select coalesce(sum(a.credits), 0) + coalesce(sum(a.held) filter (where a.held_until > pg_catalog.now()), 0)
     from public.ai_credits a
    where a.user_id = 'a1a1a1a1-0000-4000-8000-00000000000a' and a.refunded_at is null) <= 20,
  'confirmed credits plus live holds never pass the allowance');

select ok(
  not exists (select 1 from pg_catalog.pg_proc p
                join pg_catalog.pg_namespace n on n.oid = p.pronamespace
               where n.nspname = 'private' and p.proname = 'settle_ai_turn'),
  'the uncapped settle_ai_turn is gone');

select * from finish();

rollback;
