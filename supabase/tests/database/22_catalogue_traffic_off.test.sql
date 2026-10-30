-- 22_catalogue_traffic_off.test.sql
--
-- 20261029180000_catalogue_traffic_off_at: `catalogues.traffic_off_at` marks a catalogue the
-- plan-check job switched off because the owner's page views ran out, and only while nobody
-- else has touched its status. The trigger is the whole guarantee: an owner who switches a
-- catalogue off deliberately must not have the job switch it back on.
--
-- Run with `supabase test db` against the local stack (never TEST/PROD). One transaction,
-- rolled back at the end.

create extension if not exists pgtap with schema extensions;

begin;

grant usage on schema extensions to app_user;
grant execute on all functions in schema extensions to app_user;

select plan(8);

insert into public.plans (id, name) values ('pgtap_traffic_off', 'pgTAP fixture plan')
on conflict (id) do nothing;

insert into public.users (id, email, plan_id)
values ('a4a4a4a4-0000-4000-8000-00000000003a', 'traffic-off@example.com', 'pgtap_traffic_off');

insert into public.catalogues (name, status, user_id, tags, content)
values ('pgtap-off-a', 'active', 'a4a4a4a4-0000-4000-8000-00000000003a', '{}', '[]'::jsonb),
       ('pgtap-off-b', 'active', 'a4a4a4a4-0000-4000-8000-00000000003a', '{}', '[]'::jsonb),
       ('pgtap-off-c', 'active', 'a4a4a4a4-0000-4000-8000-00000000003a', '{}', '[]'::jsonb),
       ('pgtap-off-d', 'active', 'a4a4a4a4-0000-4000-8000-00000000003a', '{}', '[]'::jsonb);

-- ---------------------------------------------------------------------------
-- The column itself.
-- ---------------------------------------------------------------------------
select col_is_null('public', 'catalogues', 'traffic_off_at',
  'traffic_off_at is nullable: null means "nobody switched this off for traffic"');

select is(
  (select traffic_off_at from public.catalogues where name = 'pgtap-off-a'),
  null::timestamptz,
  'a catalogue starts with no flag'
);

-- ---------------------------------------------------------------------------
-- The job's own write: status and flag set in one statement, so the stamp survives.
-- ---------------------------------------------------------------------------
update public.catalogues
   set status = 'inactive', traffic_off_at = pg_catalog.now()
 where name = 'pgtap-off-a';

select isnt(
  (select traffic_off_at from public.catalogues where name = 'pgtap-off-a'),
  null::timestamptz,
  'a status change that sets the flag in the same statement keeps it (the job switching a catalogue off)'
);

-- ---------------------------------------------------------------------------
-- Everyone else's status change cancels the automatic return. Entered the way
-- utils/db/rls.ts withUser() enters it: SET ROLE plus transaction-local claims.
-- ---------------------------------------------------------------------------
update public.catalogues
   set status = 'inactive', traffic_off_at = pg_catalog.now()
 where name in ('pgtap-off-b', 'pgtap-off-c', 'pgtap-off-d');

do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"a4a4a4a4-0000-4000-8000-00000000003a","role":"app_user"}', true); end $$;
set local role app_user;

-- The owner switches it off themselves while it is flagged (dashboard: Change status).
update public.catalogues set status = 'draft' where name = 'pgtap-off-b';

select is(
  (select traffic_off_at from public.catalogues where name = 'pgtap-off-b'),
  null::timestamptz,
  'the owner changing the status clears the flag, so the job never puts it back'
);

-- Editing the catalogue is not a decision about whether it should be online.
update public.catalogues set heading = 'edited while off' where name = 'pgtap-off-c';

select isnt(
  (select traffic_off_at from public.catalogues where name = 'pgtap-off-c'),
  null::timestamptz,
  'editing a switched-off catalogue keeps the flag: fixing it is not asking for it to stay off'
);

-- A save that carries the unchanged status along with other fields.
update public.catalogues set status = 'inactive', heading = 'same status' where name = 'pgtap-off-d';

select isnt(
  (select traffic_off_at from public.catalogues where name = 'pgtap-off-d'),
  null::timestamptz,
  'writing the same status does not clear the flag'
);

-- The owner may read the flag (selectMyCatalogues reads every column) but not write it.
select ok(
  (select pg_catalog.has_column_privilege('app_user', 'public.catalogues', 'traffic_off_at', 'select')),
  'app_user may select traffic_off_at'
);

select ok(
  not (select pg_catalog.has_column_privilege('app_user', 'public.catalogues', 'traffic_off_at', 'update')),
  'app_user may not write traffic_off_at: only the job sets it'
);

reset role;

select * from finish();

rollback;
