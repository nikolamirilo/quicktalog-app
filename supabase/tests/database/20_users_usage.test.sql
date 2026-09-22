-- 20_users_usage.test.sql
--
-- What app_user may read and write on public.users, and what private.my_usage() returns.
--
-- Sources (every assertion below quotes one of these):
--   M01  supabase/migrations/20260921181101_app_roles_private_schema.sql   (1.3 private.current_user_id)
--   M04  supabase/migrations/20260921181104_app_role_grants_policies.sql   (4.1 users grants + policies)
--   M05  supabase/migrations/20260921181105_private_entry_points.sql       (5.4 my_usage, 5.7 EXECUTE)
--
-- Run by `supabase test db` on the local stack, with every migration in supabase/migrations/ applied.

begin;

create extension if not exists pgtap with schema extensions;

-- pgTAP lives in `extensions`. M01 1.2 revokes the default PUBLIC EXECUTE on postgres-owned functions, so the
-- app roles need USAGE *and* EXECUTE here to run assertions while the role is switched (PLAN 4.5, PGlite F10).
-- These grants are part of the transaction and disappear with the rollback.
grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;
set local search_path = public, extensions, pg_temp;

select plan(15);

-- ---------------------------------------------------------------------------------------------------------
-- Fixtures, inserted as postgres (BYPASSRLS). User ids are uuid-shaped, as after the M11 re-key.
-- ---------------------------------------------------------------------------------------------------------
insert into public.plans (id, name) values ('pri_pgtap_starter', 'pgTAP Starter');

insert into public.users (id, name, email, plan_id) values
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'alice@example.com', 'pri_pgtap_starter'),
  ('22222222-2222-2222-2222-222222222222', 'Bob',   'bob@example.com',   'pri_pgtap_starter');

-- Alice owns 2 catalogues, Bob 1. Names are slugs (catalogues_name_slug, M07).
insert into public.catalogues (id, name, created_by, status, tags) values
  ('c0000000-0000-0000-0000-000000000001', 'alice-one', '11111111-1111-1111-1111-111111111111', 'active', '{}'),
  ('c0000000-0000-0000-0000-000000000002', 'alice-two', '11111111-1111-1111-1111-111111111111', 'draft',  '{}'),
  ('c0000000-0000-0000-0000-000000000003', 'bob-one',   '22222222-2222-2222-2222-222222222222', 'active', '{}');

-- AI ledger: my_usage() counts this month's unrefunded prompts only (M05 5.4 lines 97-98).
insert into public.prompts (user_id, catalogue, datetime, refunded_at) values
  ('11111111-1111-1111-1111-111111111111', 'alice-one', now(), null),                                      -- counted
  ('11111111-1111-1111-1111-111111111111', 'alice-one', now(), now()),                                     -- refunded
  ('11111111-1111-1111-1111-111111111111', 'alice-two', now(), null),                                      -- counted
  ('11111111-1111-1111-1111-111111111111', 'alice-one', date_trunc('month', now(), 'UTC') - interval '1 second', null), -- last month
  ('22222222-2222-2222-2222-222222222222', 'bob-one',   now(), null);

insert into public.ocr (user_id, catalogue, datetime) values
  ('11111111-1111-1111-1111-111111111111', 'alice-one', now()),
  ('11111111-1111-1111-1111-111111111111', 'alice-one', date_trunc('month', now(), 'UTC') - interval '1 second');

insert into public.analytics (user_id, date, current_url, pageview_count, unique_visitors) values
  ('11111111-1111-1111-1111-111111111111', now(), 'https://quicktalog.app/catalogues/alice-one', 10, 4),
  ('11111111-1111-1111-1111-111111111111', now(), 'https://quicktalog.app/catalogues/alice-two',  5, 2),
  ('11111111-1111-1111-1111-111111111111', date_trunc('month', now(), 'UTC') - interval '1 second',
                                                  'https://quicktalog.app/catalogues/last-month', 99, 99),
  ('22222222-2222-2222-2222-222222222222', now(), 'https://quicktalog.app/catalogues/bob-one',  100, 50);

-- ---------------------------------------------------------------------------------------------------------
-- Alice, signed in. Roles are entered exactly the way utils/db/rls.ts withUser() enters them (PLAN B.3):
-- SET ROLE plus transaction-local `request.jwt.claims` carrying sub and role, which is what
-- private.current_user_id() reads (M01 1.3). The DO wrapper keeps set_config's return value out of the
-- TAP stream.
-- ---------------------------------------------------------------------------------------------------------
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"app_user"}', true); end $$;
set local role app_user;

-- M01 1.3: the helper returns the verified subject of the current transaction.
select is(
  private.current_user_id(),
  '11111111-1111-1111-1111-111111111111',
  'private.current_user_id() is the sub of the transaction-local claims'
);

-- M04 4.1 users_select_self (lines 38-40) + grant select (line 35).
select results_eq(
  $$ select name from public.users $$,
  $$ values ('Alice'::text) $$,
  'app_user sees its own users row and no other'
);

select is_empty(
  $$ select 1 from public.users where id = '22222222-2222-2222-2222-222222222222' $$,
  'app_user cannot read another user''s row'
);

-- M04 4.1 users_update_self (lines 41-44) + grant update (name, cookie_preferences) (line 36).
select results_eq(
  $$ with u as (
       update public.users set cookie_preferences = '{"analytics":true}'::jsonb
        where id = '11111111-1111-1111-1111-111111111111'
       returning 1
     ) select * from u $$,
  $$ values (1) $$,
  'app_user updates a granted column on its own row'
);

select is_empty(
  $$ with u as (
       update public.users set name = 'pwned'
        where id = '22222222-2222-2222-2222-222222222222'
       returning 1
     ) select * from u $$,
  'users_update_self hides another user''s row from UPDATE (0 rows)'
);

-- M04 4.1 line 34: plan_id, customer_id and email are written by the Paddle/auth sync through asAdmin only.
select throws_ok(
  $$ update public.users set plan_id = 'pri_pgtap_starter'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'app_user cannot write users.plan_id (not in the column grant)'
);

select throws_ok(
  $$ update public.users set customer_id = 'ctm_forged'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501',  null,
  'app_user cannot write users.customer_id (Paddle customer, not in the column grant)'
);

select throws_ok(
  $$ update public.users set email = 'attacker@example.com'
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'app_user cannot write users.email (not in the column grant)'
);

-- M04 4.1 grants SELECT and a column UPDATE only: no INSERT, no DELETE on users.
select throws_ok(
  $$ insert into public.users (id, plan_id)
     values ('33333333-3333-3333-3333-333333333333', 'pri_pgtap_starter') $$,
  '42501', null,
  'app_user cannot INSERT into users'
);

select throws_ok(
  $$ delete from public.users where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'app_user cannot DELETE from users'
);

-- M05 5.4: catalogues, this month's unrefunded prompts, this month's ocr, pageviews, unique visitors.
-- Alice: 2 catalogues, 2 of 4 prompts, 1 of 2 ocr rows, 10+5 pageviews, 4+2 unique visitors.
select results_eq(
  $$ select * from private.my_usage() $$,
  $$ values (2::bigint, 2::bigint, 1::bigint, 15::bigint, 6::bigint) $$,
  'private.my_usage() returns the caller''s own numbers'
);

-- ---------------------------------------------------------------------------------------------------------
-- Bob, signed in: the same call returns his numbers, never Alice's.
-- ---------------------------------------------------------------------------------------------------------
reset role;
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"app_user"}', true); end $$;
set local role app_user;

select results_eq(
  $$ select * from private.my_usage() $$,
  $$ values (1::bigint, 1::bigint, 0::bigint, 100::bigint, 50::bigint) $$,
  'private.my_usage() is per caller: Bob gets only Bob''s numbers'
);

-- ---------------------------------------------------------------------------------------------------------
-- app_user with no verified identity: M01 1.3 returns NULL, so owner policies match nothing.
-- ---------------------------------------------------------------------------------------------------------
reset role;
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role app_user;

select is_empty(
  $$ select 1 from public.users $$,
  'app_user without claims sees no users row (current_user_id() is NULL)'
);

-- ---------------------------------------------------------------------------------------------------------
-- app_public (visitors, ISR): M04 grants it nothing on users, M05 5.7 grants it no EXECUTE on my_usage().
-- ---------------------------------------------------------------------------------------------------------
reset role;
do $$ begin perform set_config('request.jwt.claims', '{"role":"app_public"}', true); end $$;
set local role app_public;

select throws_ok(
  $$ select 1 from public.users $$,
  '42501', null,
  'app_public has no privilege on users at all'
);

select throws_ok(
  $$ select * from private.my_usage() $$,
  '42501', null,
  'app_public cannot execute private.my_usage() (granted to app_user only)'
);

reset role;

select * from finish();
rollback;
