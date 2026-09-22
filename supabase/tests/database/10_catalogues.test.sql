-- 10_catalogues.test.sql
--
-- Asserts the catalogue grants and policies created by:
--   M04 supabase/migrations/20260921181104_app_role_grants_policies.sql (section 4.2 and 4.6)
-- using the identity helper from:
--   M01 supabase/migrations/20260921181101_app_roles_private_schema.sql (section 1.3)
--
-- Roles are entered exactly the way utils/db/rls.ts withUser()/withPublic()
-- enters them (PLAN.md Appendix B.3): SET ROLE plus a transaction-local
-- `request.jwt.claims` holding `sub` and `role`.
--
-- Run with `supabase test db` against the local stack (never TEST/PROD).
-- Everything below runs inside one transaction that is rolled back at the end.

create extension if not exists pgtap with schema extensions;

begin;

-- PGlite finding F10: the app roles cannot reach the pgTAP helper functions
-- unless they get USAGE on `extensions` *and* EXECUTE on its functions.
grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;

select plan(20);

-- ---------------------------------------------------------------------------
-- Fixtures (created as postgres, which bypasses RLS). uuid-shaped user ids.
-- ---------------------------------------------------------------------------

insert into public.plans (id, name)
values ('pgtap_plan', 'pgTAP fixture plan')
on conflict (id) do nothing;

insert into public.users (id, email, plan_id)
values ('4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', 'owner-a@example.com', 'pgtap_plan'),
       ('7b2e9d41-3c6a-4f8b-8d2e-1f2a3b4c5d6e', 'owner-b@example.com', 'pgtap_plan');

-- Names must satisfy catalogues_name_slug (M07) and tags is NOT NULL with no default.
insert into public.catalogues (name, status, created_by, tags)
values ('owner-a-active', 'active', '4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', '{}'),
       ('owner-a-draft',  'draft',  '4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', '{}'),
       ('owner-b-active', 'active', '7b2e9d41-3c6a-4f8b-8d2e-1f2a3b4c5d6e', '{}'),
       ('owner-b-draft',  'draft',  '7b2e9d41-3c6a-4f8b-8d2e-1f2a3b4c5d6e', '{}');

-- Row counts of statements run under an app role are collected here, because a
-- policy that blocks an UPDATE/DELETE affects 0 rows instead of raising.
create temp table t_res (label text primary key, n bigint);
grant select, insert on table t_res to app_user, app_public;

-- ===========================================================================
-- app_public: visitors, ISR, sitemap (M04:58-60 grant, M04:82-84 policy)
-- ===========================================================================

-- The claims are set with set_config(..., true) exactly like utils/db/rls.ts;
-- the DO wrapper only keeps the return value out of the TAP stream.
do $$ begin perform set_config('request.jwt.claims', '{"role":"app_public"}', true); end $$;
set local role app_public;

-- Restricted to this file's fixtures: any other catalogue already on the stack
-- would otherwise decide the result.
select set_eq(
  $q$ select name from public.catalogues where name like 'owner-%' $q$,
  $q$ values ('owner-a-active'), ('owner-b-active') $q$,
  'app_public sees only catalogues whose status is active'
);

-- M04:60: created_by is deliberately left out of the app_public column grant.
select throws_ok(
  $q$ select created_by from public.catalogues $q$,
  '42501'::char(5), null::text,
  'app_public cannot read catalogues.created_by'
);

-- M04:54: insert/update/delete are granted to app_user only.
select throws_ok(
  $q$
    insert into public.catalogues (name, status, created_by, tags)
    values ('public-insert', 'draft', '4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', '{}')
  $q$,
  '42501'::char(5), null::text,
  'app_public cannot insert a catalogue'
);

select throws_ok(
  $q$ update public.catalogues set heading = 'hacked' where name = 'owner-a-active' $q$,
  '42501'::char(5), null::text,
  'app_public cannot update a catalogue'
);

select throws_ok(
  $q$ delete from public.catalogues where name = 'owner-a-active' $q$,
  '42501'::char(5), null::text,
  'app_public cannot delete a catalogue'
);

reset role;

-- ===========================================================================
-- app_user with no verified subject: private.current_user_id() is NULL, so the
-- owner policies match nothing (M01:58-66).
-- ===========================================================================

do $$ begin perform set_config('request.jwt.claims', '', true); end $$;
set local role app_user;

select is(
  (select count(*) from public.catalogues),
  0::bigint,
  'app_user with no request.jwt.claims sees no catalogue at all'
);

reset role;

-- ===========================================================================
-- app_user = owner A (M04:65-80)
-- ===========================================================================

do $$
begin
  perform set_config(
    'request.jwt.claims',
    '{"sub":"4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f","role":"app_user"}',
    true
  );
end $$;
set local role app_user;

-- M04:65-67: owners see their own rows in every status and nobody else's,
-- including other owners' active ones.
select set_eq(
  $q$ select name from public.catalogues where name like 'owner-%' $q$,
  $q$ values ('owner-a-active'), ('owner-a-draft') $q$,
  'app_user sees exactly its own catalogues, in every status'
);

-- M04:70-73: a new row must belong to the caller and start unpublished.
with i as (
  insert into public.catalogues (name, status, created_by, tags)
  values ('owner-a-new', 'draft', '4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', '{}')
  returning 1
)
insert into t_res select 'insert_own_draft', count(*) from i;

select throws_ok(
  $q$
    insert into public.catalogues (name, status, created_by, tags)
    values ('owner-a-forged', 'draft', '7b2e9d41-3c6a-4f8b-8d2e-1f2a3b4c5d6e', '{}')
  $q$,
  '42501'::char(5), null::text,
  'app_user cannot insert a catalogue owned by another user'
);

select throws_ok(
  $q$
    insert into public.catalogues (name, status, created_by, tags)
    values ('owner-a-born-live', 'active', '4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', '{}')
  $q$,
  '42501'::char(5), null::text,
  'app_user cannot insert a catalogue that is already active'
);

-- M04:132-146: the BEFORE INSERT trigger overwrites a client-chosen id.
with i as (
  insert into public.catalogues (id, name, status, created_by, tags)
  values ('00000000-0000-4000-8000-000000000001', 'owner-a-pinned', 'draft',
          '4a1f0c62-1e5b-4b9a-9c3d-0a1b2c3d4e5f', '{}')
  returning id
)
insert into t_res
select 'insert_id_pinned', count(*) from i
 where i.id <> '00000000-0000-4000-8000-000000000001'::uuid;

-- M04:55-56: heading and status are both in the UPDATE column grant, so an
-- owner may edit and publish its own catalogue.
with u as (
  update public.catalogues set heading = 'mine' where name = 'owner-a-draft' returning 1
)
insert into t_res select 'update_own_heading', count(*) from u;

with u as (
  update public.catalogues set status = 'active' where name = 'owner-a-draft' returning 1
)
insert into t_res select 'publish_own', count(*) from u;

-- M04:57: id, name, created_by, created_at and source are NOT in the grant.
select throws_ok(
  $q$ update public.catalogues set name = 'owner-a-renamed' where name = 'owner-a-active' $q$,
  '42501'::char(5), null::text,
  'app_user cannot change catalogues.name'
);

select throws_ok(
  $q$
    update public.catalogues
       set created_by = '7b2e9d41-3c6a-4f8b-8d2e-1f2a3b4c5d6e'
     where name = 'owner-a-active'
  $q$,
  '42501'::char(5), null::text,
  'app_user cannot change catalogues.created_by'
);

select throws_ok(
  $q$
    update public.catalogues
       set id = '00000000-0000-4000-8000-000000000002'
     where name = 'owner-a-active'
  $q$,
  '42501'::char(5), null::text,
  'app_user cannot change catalogues.id'
);

select throws_ok(
  $q$ update public.catalogues set source = 'ai' where name = 'owner-a-active' $q$,
  '42501'::char(5), null::text,
  'app_user cannot change catalogues.source'
);

-- M04:74-80: the USING clauses hide other owners' rows from UPDATE and DELETE,
-- which affects 0 rows rather than raising.
with u as (
  update public.catalogues set heading = 'hacked' where name = 'owner-b-draft' returning 1
)
insert into t_res select 'update_other_owner', count(*) from u;

with d as (
  delete from public.catalogues where name = 'owner-b-active' returning 1
)
insert into t_res select 'delete_other_owner', count(*) from d;

with d as (
  delete from public.catalogues where name = 'owner-a-new' returning 1
)
insert into t_res select 'delete_own', count(*) from d;

reset role;

-- ---------------------------------------------------------------------------
-- Row counts collected above, asserted as postgres.
-- ---------------------------------------------------------------------------

select is((select n from t_res where label = 'insert_own_draft'), 1::bigint,
  'app_user inserts its own draft catalogue');

select is((select n from t_res where label = 'insert_id_pinned'), 1::bigint,
  'the pin trigger replaces the id supplied by an app_user insert');

select is((select n from t_res where label = 'update_own_heading'), 1::bigint,
  'app_user updates heading on its own catalogue');

select is((select n from t_res where label = 'publish_own'), 1::bigint,
  'app_user updates status on its own catalogue');

select is((select n from t_res where label = 'update_other_owner'), 0::bigint,
  'app_user updates no row of another owner');

select is((select n from t_res where label = 'delete_other_owner'), 0::bigint,
  'app_user deletes no row of another owner');

select is((select n from t_res where label = 'delete_own'), 1::bigint,
  'app_user deletes its own catalogue');

select * from finish();

rollback;
