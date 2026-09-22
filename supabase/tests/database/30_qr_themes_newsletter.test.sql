-- 30_qr_themes_newsletter.test.sql
--
-- Owner-only access to qr_configs and user_themes, and newsletter signups that only the M05 entry points can
-- write, with an owner derived from the catalogue instead of from the caller.
--
-- Sources (every assertion below quotes one of these):
--   M04  supabase/migrations/20260921181104_app_role_grants_policies.sql
--        (4.3 qr_configs, 4.4 user_themes, 4.5 newsletter read-only, line 125 product_newsletter)
--   M05  supabase/migrations/20260921181105_private_entry_points.sql
--        (5.2 subscribe_catalogue_newsletter, 5.3 subscribe_product_newsletter, 5.7 EXECUTE)
--   M03  supabase/migrations/20260921181103_integrity_constraints_ai_ledger.sql (3.4 unique index behind ON CONFLICT)
--
-- Run by `supabase test db` on the local stack, with every migration in supabase/migrations/ applied.

begin;

create extension if not exists pgtap with schema extensions;

-- pgTAP lives in `extensions`. M01 1.2 revokes the default PUBLIC EXECUTE on postgres-owned functions, so the
-- app roles need USAGE *and* EXECUTE here to run assertions while the role is switched (PLAN 4.5, PGlite F10).
grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;
set local search_path = public, extensions, pg_temp;

select plan(23);

-- ---------------------------------------------------------------------------------------------------------
-- Fixtures, inserted as postgres (BYPASSRLS). User ids are uuid-shaped, as after the M11 re-key.
-- ---------------------------------------------------------------------------------------------------------
insert into public.plans (id, name) values ('pri_pgtap_starter', 'pgTAP Starter');

insert into public.users (id, name, email, plan_id) values
  ('11111111-1111-1111-1111-111111111111', 'Alice', 'alice@example.com', 'pri_pgtap_starter'),
  ('22222222-2222-2222-2222-222222222222', 'Bob',   'bob@example.com',   'pri_pgtap_starter');

-- M05 5.2 only accepts an active catalogue whose footer.newsletter is the jsonb boolean true.
insert into public.catalogues (id, name, created_by, status, footer, tags) values
  ('c0000000-0000-0000-0000-000000000001', 'alice-live',   '11111111-1111-1111-1111-111111111111',
   'active', '{"newsletter": true}'::jsonb, '{}'),
  ('c0000000-0000-0000-0000-000000000002', 'alice-draft',  '11111111-1111-1111-1111-111111111111',
   'draft',  '{"newsletter": true}'::jsonb, '{}'),
  ('c0000000-0000-0000-0000-000000000003', 'alice-nonews', '11111111-1111-1111-1111-111111111111',
   'active', '{}'::jsonb, '{}'),
  ('c0000000-0000-0000-0000-000000000004', 'bob-live',     '22222222-2222-2222-2222-222222222222',
   'active', '{"newsletter": true}'::jsonb, '{}'),
  ('c0000000-0000-0000-0000-000000000005', 'bob-two',      '22222222-2222-2222-2222-222222222222',
   'active', '{"newsletter": true}'::jsonb, '{}');

insert into public.qr_configs (catalogue, config) values ('bob-live', '{"dotsOptions": {"type": "dots"}}'::jsonb);

insert into public.user_themes (user_id, name, colors)
values ('22222222-2222-2222-2222-222222222222', 'bob-theme', '{"primary": "#000000"}'::jsonb);

insert into public.newsletter (email, catalogue_id, owner_id)
values ('bobfan@example.com', 'c0000000-0000-0000-0000-000000000004',
        '22222222-2222-2222-2222-222222222222');

-- ---------------------------------------------------------------------------------------------------------
-- Alice, signed in. Roles are entered exactly the way utils/db/rls.ts withUser() enters them (PLAN B.3):
-- SET ROLE plus transaction-local `request.jwt.claims` carrying sub and role, which is what
-- private.current_user_id() reads (M01 1.3). The DO wrapper keeps set_config's return value out of the
-- TAP stream.
-- ---------------------------------------------------------------------------------------------------------
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"app_user"}', true); end $$;
set local role app_user;

-- --- qr_configs (M04 4.3: ownership through catalogues.name) ---------------------------------------------
select results_eq(
  $$ with i as (
       insert into public.qr_configs (catalogue, config)
       values ('alice-live', '{"dotsOptions": {"type": "rounded"}}'::jsonb)
       returning 1
     ) select * from i $$,
  $$ values (1) $$,
  'qr_configs_owner: app_user inserts a config for its own catalogue'
);

select throws_ok(
  $$ insert into public.qr_configs (catalogue, config)
     values ('bob-two', '{"dotsOptions": {"type": "rounded"}}'::jsonb) $$,
  '42501', null,
  'qr_configs_owner WITH CHECK rejects a config for another owner''s catalogue'
);

select is_empty(
  $$ select 1 from public.qr_configs where catalogue = 'bob-live' $$,
  'qr_configs_owner USING hides another owner''s config'
);

select is_empty(
  $$ with u as (
       update public.qr_configs set config = '{"pwned": true}'::jsonb
        where catalogue = 'bob-live'
       returning 1
     ) select * from u $$,
  'qr_configs_owner USING blocks UPDATE of another owner''s config (0 rows)'
);

select is_empty(
  $$ with d as (
       delete from public.qr_configs where catalogue = 'bob-live' returning 1
     ) select * from d $$,
  'qr_configs_owner USING blocks DELETE of another owner''s config (0 rows)'
);

-- M04 4.3 line 92 grants UPDATE only on (config, updated_at); catalogue is the ownership key.
select throws_ok(
  $$ update public.qr_configs set catalogue = 'alice-live' where catalogue = 'alice-live' $$,
  '42501', null,
  'app_user cannot move a qr_config to another catalogue (column not granted)'
);

-- --- user_themes (M04 4.4: user_id is the owner) ----------------------------------------------------------
select results_eq(
  $$ with i as (
       insert into public.user_themes (user_id, name, colors)
       values ('11111111-1111-1111-1111-111111111111', 'alice-theme', '{"primary": "#ffffff"}'::jsonb)
       returning 1
     ) select * from i $$,
  $$ values (1) $$,
  'user_themes_owner: app_user inserts a theme for itself'
);

select throws_ok(
  $$ insert into public.user_themes (user_id, name, colors)
     values ('22222222-2222-2222-2222-222222222222', 'stolen-theme', '{}'::jsonb) $$,
  '42501', null,
  'user_themes_owner WITH CHECK rejects a theme inserted for another user'
);

select is_empty(
  $$ select 1 from public.user_themes where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'user_themes_owner USING hides another user''s themes'
);

select is_empty(
  $$ with u as (
       update public.user_themes set colors = '{"primary": "#ff0000"}'::jsonb
        where user_id = '22222222-2222-2222-2222-222222222222'
       returning 1
     ) select * from u $$,
  'user_themes_owner USING blocks UPDATE of another user''s theme (0 rows)'
);

select is_empty(
  $$ with d as (
       delete from public.user_themes
        where user_id = '22222222-2222-2222-2222-222222222222'
       returning 1
     ) select * from d $$,
  'user_themes_owner USING blocks DELETE of another user''s theme (0 rows)'
);

-- M04 4.4 line 104 grants UPDATE only on (name, colors, updated_at); user_id is the ownership key.
select throws_ok(
  $$ update public.user_themes set user_id = '22222222-2222-2222-2222-222222222222'
      where user_id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null,
  'app_user cannot hand a theme to another user (column not granted)'
);

-- --- newsletter (M04 4.5: SELECT only, and only the caller's subscribers) ----------------------------------
select throws_ok(
  $$ insert into public.newsletter (email, catalogue_id, owner_id)
     values ('direct@example.com', 'c0000000-0000-0000-0000-000000000001',
             '11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'app_user cannot INSERT newsletter rows directly (SELECT is the only grant)'
);

select is_empty(
  $$ select 1 from public.newsletter where owner_id = '22222222-2222-2222-2222-222222222222' $$,
  'newsletter_select_owner hides another owner''s subscribers'
);

-- ---------------------------------------------------------------------------------------------------------
-- A visitor: withPublic() sets no sub (PLAN B.3). The claims here carry Bob's id on purpose - it must not
-- influence the owner of the row the entry point writes.
-- ---------------------------------------------------------------------------------------------------------
reset role;
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"22222222-2222-2222-2222-222222222222","role":"app_public"}', true); end $$;
set local role app_public;

select throws_ok(
  $$ insert into public.newsletter (email, catalogue_id, owner_id)
     values ('visitor@example.com', 'c0000000-0000-0000-0000-000000000001',
             '11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'app_public cannot INSERT newsletter rows directly (no grant at all)'
);

-- M05 5.7 grants EXECUTE on the entry point to app_public and app_user.
select lives_ok(
  $$ select private.subscribe_catalogue_newsletter('c0000000-0000-0000-0000-000000000001', 'Visitor@Example.COM') $$,
  'app_public may execute private.subscribe_catalogue_newsletter()'
);

-- Duplicate (different case) is a no-op: ON CONFLICT against newsletter_catalogue_email_key (M03 3.4, M05 5.2).
-- Draft catalogue, newsletter disabled in the footer and a malformed address are all silently ignored (M05 5.2).
-- The DO wrapper keeps these void calls out of the TAP stream.
do $$
begin
  perform private.subscribe_catalogue_newsletter('c0000000-0000-0000-0000-000000000001', 'VISITOR@example.com');
  perform private.subscribe_catalogue_newsletter('c0000000-0000-0000-0000-000000000002', 'draft@example.com');
  perform private.subscribe_catalogue_newsletter('c0000000-0000-0000-0000-000000000003', 'nonews@example.com');
  perform private.subscribe_catalogue_newsletter('c0000000-0000-0000-0000-000000000001', 'not-an-email');
end $$;

-- M04 line 125: no app-role privileges on product_newsletter; 5.3 is the only way in.
select throws_ok(
  $$ insert into public.product_newsletter (email) values ('direct@example.com') $$,
  '42501', null,
  'app_public cannot INSERT product_newsletter rows directly (no grant at all)'
);

do $$
begin
  perform private.subscribe_product_newsletter('Reader@Example.COM');
  perform private.subscribe_product_newsletter('reader@example.com');
end $$;

reset role;

-- ---------------------------------------------------------------------------------------------------------
-- Back to postgres to read what the definer functions wrote.
-- ---------------------------------------------------------------------------------------------------------
select results_eq(
  $$ select email from public.newsletter
      where catalogue_id = 'c0000000-0000-0000-0000-000000000001' $$,
  $$ values ('visitor@example.com'::text) $$,
  'subscribe_catalogue_newsletter lower-cases the address and dedupes case variants to one row'
);

select results_eq(
  $$ select owner_id from public.newsletter
      where catalogue_id = 'c0000000-0000-0000-0000-000000000001' $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::text) $$,
  'owner_id follows catalogues.created_by, never the caller''s claims'
);

select is_empty(
  $$ select 1 from public.newsletter where catalogue_id = 'c0000000-0000-0000-0000-000000000002' $$,
  'no subscriber row for a draft catalogue'
);

select is_empty(
  $$ select 1 from public.newsletter where catalogue_id = 'c0000000-0000-0000-0000-000000000003' $$,
  'no subscriber row when footer.newsletter is not true'
);

select is_empty(
  $$ select 1 from public.newsletter where email = 'not-an-email' $$,
  'no subscriber row for a malformed address'
);

select results_eq(
  $$ select email from public.product_newsletter where email like '%reader%' $$,
  $$ values ('reader@example.com'::text) $$,
  'subscribe_product_newsletter lower-cases the address and dedupes case variants to one row'
);

select * from finish();
rollback;
