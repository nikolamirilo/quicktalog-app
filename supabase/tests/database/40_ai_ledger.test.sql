-- 40_ai_ledger.test.sql
--
-- The AI turn ledger: the shape `public.prompts` gets in M03 (section 3.7) and the
-- server-authoritative metering entry points it exists for.
--
-- Note on signatures: M05 5.5 defined private.begin_ai_turn(text, integer, boolean) and
-- M05 5.6 defined private.refund_ai_turn(uuid). M06 line 18 drops the M05 begin_ai_turn and
-- replaces both, so at the end of the migration chain the callable forms are
-- private.begin_ai_turn(text, integer, text, uuid, text) and private.refund_ai_turn(uuid).
-- This file exercises those. The plan binding added by M06 is covered by 41_ai_plan_binding.test.sql.
--
-- Fixtures use uuid-shaped user ids (plan section 11.3), never Clerk `user_...` ids.
--
-- Everything runs inside one transaction that is rolled back, so the fixture schema,
-- the fixture rows and the extra grants never survive the test.

create extension if not exists pgtap with schema extensions;

begin;

-- pg_temp stays implicit (and therefore first) so pgTAP finds its own result tables.
set local search_path to extensions, public;

select plan(23);

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

-- Observations captured while a test statement runs as app_user, asserted afterwards as postgres.
create table pgtap_fixtures.obs (
  label   text primary key,
  outcome text,
  turn_id uuid,
  flag    boolean,
  code    text
);
grant select, insert, update on pgtap_fixtures.obs to app_user, app_public;

-- Runs SQL under the current role and reports the SQLSTATE instead of aborting the test file.
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

-- ---------------------------------------------------------------------------
-- Fixture data (uuid-shaped ids, slug-shaped catalogue names per M07 catalogues_name_slug)
-- ---------------------------------------------------------------------------
insert into public.plans (id, name)
values ('pri_pgtap_ai_ledger', 'pgTAP fixture plan')
on conflict (id) do nothing;

insert into public.users (id, name, email, plan_id)
values ('11111111-1111-4111-8111-111111111111', 'Owner A', 'pgtap-owner-a@example.com', 'pri_pgtap_ai_ledger'),
       ('22222222-2222-4222-8222-222222222222', 'Owner B', 'pgtap-owner-b@example.com', 'pri_pgtap_ai_ledger');

insert into public.catalogues (name, created_by, status, tags)
values ('pgtap-ledger-a', '11111111-1111-4111-8111-111111111111', 'draft', '{}'::text[]),
       ('pgtap-ledger-b', '22222222-2222-4222-8222-222222222222', 'draft', '{}'::text[]);

-- ===========================================================================
-- 1. The ledger shape M03 3.7 gives public.prompts
-- ===========================================================================

-- M03:143-145 - null-user rows are moved to the backup table and user_id becomes NOT NULL,
-- so a charge can never silently fall out of the monthly count.
select col_not_null(
  'public', 'prompts', 'user_id',
  'M03 3.7c: prompts.user_id is NOT NULL, so no charge can be booked against nobody');

-- M03:138 - the catalogue FK becomes ON DELETE SET NULL, which requires a nullable column.
select col_is_null(
  'public', 'prompts', 'catalogue',
  'M03 3.7b: prompts.catalogue is nullable, so deleting a catalogue cannot delete its charges');

-- M03:151-154 - turn_id is backfilled, defaulted and made NOT NULL.
select col_not_null(
  'public', 'prompts', 'turn_id',
  'M03 3.7d: prompts.turn_id is NOT NULL, so every ledger row is addressable for refunds');

-- M03:157
select ok(
  exists (
    select 1
      from pg_catalog.pg_index i
      join pg_catalog.pg_class ic on ic.oid = i.indexrelid
     where i.indrelid = 'public.prompts'::regclass
       and ic.relname = 'prompts_turn_id_key'
       and i.indisunique
  ),
  'M03 3.7d: prompts_turn_id_key makes turn_id unique, so one turn is charged at most once');

-- M03:139-141 - ON DELETE SET NULL (confdeltype = ''n''), never CASCADE, so deleting a catalogue
-- cannot reset the monthly quota behind RLS.
select is(
  (select c.confdeltype
     from pg_catalog.pg_constraint c
    where c.conrelid = 'public.prompts'::regclass
      and c.contype = 'f'
      and c.confrelid = 'public.catalogues'::regclass),
  'n'::"char",
  'M03 3.7b: prompts -> catalogues is ON DELETE SET NULL, so deleting a catalogue keeps its charges');

-- M03:121-136 - the UNIQUE(catalogue) that made every charge after the first per catalogue fail is gone.
select is(
  (select count(*)::int
     from pg_catalog.pg_constraint c
    where c.conrelid = 'public.prompts'::regclass
      and c.contype = 'u'
      and c.conkey = array[(select a.attnum
                              from pg_catalog.pg_attribute a
                             where a.attrelid = 'public.prompts'::regclass
                               and a.attname = 'catalogue')]::int2[]),
  0,
  'M03 3.7a: no UNIQUE constraint on prompts(catalogue) survives, so charges can repeat per catalogue');

-- ===========================================================================
-- 2. The ledger is writable only through the entry points
-- ===========================================================================

-- M06:176-180
select ok(
  pg_catalog.has_function_privilege(
    'app_user', 'private.begin_ai_turn(text, integer, text, uuid, text)'::regprocedure, 'EXECUTE'),
  'M06 grants: app_user may execute private.begin_ai_turn');

select ok(
  pg_catalog.has_function_privilege(
    'app_user', 'private.refund_ai_turn(uuid)'::regprocedure, 'EXECUTE'),
  'M06 grants: app_user may execute private.refund_ai_turn');

-- M04:115 - app_user gets SELECT on public.prompts and nothing else; quota rows are written only by
-- the definer entry points or by the worker under service_role.
select ok(
  not pg_catalog.has_any_column_privilege('app_user', 'public.prompts'::regclass, 'INSERT'),
  'M04 4.5: app_user holds no INSERT privilege on public.prompts, not even column-level');

select ok(
  not pg_catalog.has_any_column_privilege('app_user', 'public.prompts'::regclass, 'UPDATE'),
  'M04 4.5: app_user holds no UPDATE privilege on public.prompts, not even column-level');

select ok(
  not pg_catalog.has_table_privilege('app_user', 'public.prompts'::regclass, 'DELETE'),
  'M04 4.5: app_user holds no DELETE privilege on public.prompts (the ledger is append-only)');

-- The same thing proved by running it: a signed-in caller cannot write its own charge.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, code)
values ('direct_insert', pgtap_fixtures.errcode($sql$
  insert into public.prompts (user_id, catalogue)
  values ('11111111-1111-4111-8111-111111111111', 'pgtap-ledger-a')
$sql$));
insert into pgtap_fixtures.obs (label, code)
values ('direct_update', pgtap_fixtures.errcode($sql$
  update public.prompts set refunded_at = pg_catalog.now()
$sql$));
reset role;

select is(
  (select code from pgtap_fixtures.obs where label = 'direct_insert'),
  '42501',
  'M04 4.5: app_user inserting straight into public.prompts is denied (42501)');

select is(
  (select code from pgtap_fixtures.obs where label = 'direct_update'),
  '42501',
  'M04 4.5: app_user refunding itself by UPDATE on public.prompts is denied (42501)');

-- ===========================================================================
-- 3. A charge is written before any model work
-- ===========================================================================
-- private.begin_ai_turn does the whole charge in one call and hands back the turn id;
-- the route only starts streaming afterwards (M05 5.5 header, M06:86-89).

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'a1', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-ledger-a', 100, 'agent', null::uuid, null::text) t;
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'a1'),
  'charged',
  'M06:86-89: a first agent turn on an owned catalogue is charged');

select ok(
  exists (
    select 1
      from public.prompts p
     where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'a1')
       and p.user_id = '11111111-1111-4111-8111-111111111111'
       and p.catalogue = 'pgtap-ledger-a'
       and p.kind = 'agent'
       and p.continuations = 0
       and p.refunded_at is null
  ),
  'M06:86-88: the ledger row exists as soon as begin_ai_turn returns, i.e. before any model work');

-- ===========================================================================
-- 4. A caller cannot charge on behalf of another user
-- ===========================================================================

-- M06:47-51 - the catalogue must be owned by the JWT subject; the caller passes no user id at all.
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'b_on_a', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-ledger-a', 100, 'agent', null::uuid, null::text) t;
reset role;

select is(
  (select outcome from pgtap_fixtures.obs where label = 'b_on_a'),
  'not_found',
  'M06:47-51: a caller charging against another owner''s catalogue gets not_found, never a charge');

-- M06:37-39 - no verified identity, no charge.
do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, code)
values ('no_identity', pgtap_fixtures.errcode($sql$
  select * from private.begin_ai_turn('pgtap-ledger-a', 100, 'agent', null::uuid, null::text)
$sql$));
reset role;

select is(
  (select code from pgtap_fixtures.obs where label = 'no_identity'),
  '42501',
  'M06:37-39: begin_ai_turn without a verified identity raises 42501');

-- ===========================================================================
-- 5. A refund only reverses a charge that exists, and only the caller's own
-- ===========================================================================

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, flag)
values ('refund_a1', private.refund_ai_turn(
  (select turn_id from pgtap_fixtures.obs where label = 'a1')));
insert into pgtap_fixtures.obs (label, flag)
values ('refund_a1_again', private.refund_ai_turn(
  (select turn_id from pgtap_fixtures.obs where label = 'a1')));
insert into pgtap_fixtures.obs (label, flag)
values ('refund_unknown', private.refund_ai_turn('99999999-9999-4999-8999-999999999999'::uuid));
-- A second charged turn for owner A, so owner B has something real to try to refund.
insert into pgtap_fixtures.obs (label, outcome, turn_id)
select 'a2', t.outcome, t.ai_turn_id
  from private.begin_ai_turn('pgtap-ledger-a', 100, 'agent', null::uuid, null::text) t;
reset role;

select ok(
  (select flag from pgtap_fixtures.obs where label = 'refund_a1'),
  'M06:156-164: the owner can refund its own fresh, un-continued, un-refunded turn');

select ok(
  exists (select 1 from public.prompts p
           where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'a1')
             and p.refunded_at is not null),
  'M06:157: the refund flags the existing row (append-only ledger), it does not delete it');

select ok(
  not (select flag from pgtap_fixtures.obs where label = 'refund_a1_again'),
  'M06:161: refunding the same turn twice returns false (refunded_at is null guard)');

select ok(
  not (select flag from pgtap_fixtures.obs where label = 'refund_unknown'),
  'M06:158: refunding a turn id that was never charged returns false');

-- M06:159 - the row must belong to private.current_user_id().
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"app_user"}', true); end $$;
set local role app_user;
insert into pgtap_fixtures.obs (label, flag)
values ('b_refunds_a2', private.refund_ai_turn(
  (select turn_id from pgtap_fixtures.obs where label = 'a2')));
reset role;

select ok(
  not (select flag from pgtap_fixtures.obs where label = 'b_refunds_a2'),
  'M06:159: a caller cannot refund another user''s turn');

select ok(
  exists (select 1 from public.prompts p
           where p.turn_id = (select turn_id from pgtap_fixtures.obs where label = 'a2')
             and p.refunded_at is null),
  'M06:159: the other user''s charge is still on the ledger after the forged refund attempt');

select * from finish();

rollback;
