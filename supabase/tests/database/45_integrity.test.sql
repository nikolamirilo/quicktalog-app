-- 45_integrity.test.sql
--
-- The constraints, indexes and ledger shape added by
--   M03  supabase/migrations/20260921181103_integrity_constraints_ai_ledger.sql
-- reject bad values and accept good ones. Everything runs as postgres (constraints are role-independent),
-- except the last assertion, which checks that the app roles get nothing on the admin-only tables of 3.9.
--
-- Note on the size CHECKs (3.2): pg_column_size() is evaluated on the new, in-memory value during INSERT, so
-- the values below are measured uncompressed. The M03 header's warning about compressed sizes concerns
-- UPDATEs of already toasted legacy rows, not fresh inserts.
--
-- Names are the ones after 20260929120000 (SC): prompts -> ai_credits (catalogue slug -> catalogue_id),
-- newsletter -> catalogue_subscribers (owner_id dropped), product_newsletter -> newsletter_subscribers,
-- qr_configs.catalogue -> catalogue_id, catalogues.user_id -> user_id, 'in preparation' -> 'in_preparation'.
--
-- Run by `supabase test db` on the local stack, with every migration in supabase/migrations/ applied.

begin;

create extension if not exists pgtap with schema extensions;

-- pgTAP lives in `extensions`. M01 1.2 revokes the default PUBLIC EXECUTE on postgres-owned functions, so the
-- app roles need USAGE *and* EXECUTE here to run assertions while the role is switched (PLAN 4.5, PGlite F10).
grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;
set local search_path = public, extensions, pg_temp;

select plan(26);

-- ---------------------------------------------------------------------------------------------------------
-- Fixtures. User ids are uuid-shaped; catalogue names are slugs (catalogues_name_slug, M07).
-- ---------------------------------------------------------------------------------------------------------
insert into public.plans (id, name) values ('pri_pgtap_starter', 'pgTAP Starter');

insert into public.users (id, name, email, plan_id)
values ('11111111-1111-1111-1111-111111111111', 'Alice', 'alice@example.com', 'pri_pgtap_starter');

insert into public.catalogues (id, name, user_id, status, tags) values
  ('c0000000-0000-0000-0000-000000000001', 'alice-cat',   '11111111-1111-1111-1111-111111111111', 'active', '{}'),
  ('c0000000-0000-0000-0000-000000000002', 'other-cat',   '11111111-1111-1111-1111-111111111111', 'active', '{}'),
  ('c0000000-0000-0000-0000-000000000003', 'doomed-cat',  '11111111-1111-1111-1111-111111111111', 'active', '{}'),
  ('c0000000-0000-0000-0000-000000000004', 'qr-size-cat', '11111111-1111-1111-1111-111111111111', 'active', '{}'),
  ('c0000000-0000-0000-0000-000000000005', 'qr-dup-cat',  '11111111-1111-1111-1111-111111111111', 'active', '{}');

-- ---------------------------------------------------------------------------------------------------------
-- 3.1 catalogues.status allowlist (validated constraint catalogues_status_check)
-- ---------------------------------------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.catalogues (name, user_id, status, tags)
     values ('bogus-status-cat', '11111111-1111-1111-1111-111111111111', 'published', '{}') $$,
  '23514', null,
  'catalogues_status_check rejects a status outside the allowlist on INSERT'
);

select lives_ok(
  $$ insert into public.catalogues (name, user_id, status, tags)
     values ('prep-cat', '11111111-1111-1111-1111-111111111111', 'in_preparation', '{}') $$,
  'catalogues_status_check accepts "in_preparation" (SC 1)'
);

select throws_ok(
  $$ update public.catalogues set status = 'published' where name = 'alice-cat' $$,
  '23514', null,
  'catalogues_status_check rejects a status outside the allowlist on UPDATE'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.2 jsonb size ceilings
-- ---------------------------------------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.catalogues (name, user_id, status, content, tags)
     values ('big-content-cat', '11111111-1111-1111-1111-111111111111', 'draft',
             to_jsonb(repeat('x', 1200000)), '{}') $$,
  '23514', null,
  'catalogues_content_size rejects content of 1 MiB or more'
);

select throws_ok(
  $$ insert into public.user_themes (user_id, name, colors)
     values ('11111111-1111-1111-1111-111111111111', 'big-theme', to_jsonb(repeat('x', 5000))) $$,
  '23514', null,
  'user_themes_colors_size rejects colors of 4 KiB or more'
);

select throws_ok(
  $$ insert into public.qr_configs (catalogue_id, config)
     values ('c0000000-0000-0000-0000-000000000004', to_jsonb(repeat('x', 70000))) $$,
  '23514', null,
  'qr_configs_config_size rejects a config of 64 KiB or more'
);

select throws_ok(
  $$ update public.users set cookie_preferences = to_jsonb(repeat('x', 3000))
      where id = '11111111-1111-1111-1111-111111111111' $$,
  '23514', null,
  'users_cookie_prefs_size rejects cookie_preferences of 2 KiB or more'
);

select lives_ok(
  $$ update public.users set cookie_preferences = null
      where id = '11111111-1111-1111-1111-111111111111' $$,
  'users_cookie_prefs_size tolerates a null cookie_preferences'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.4 catalogue_subscribers (catalogue_id, lower(email)) unique index
-- ---------------------------------------------------------------------------------------------------------
insert into public.catalogue_subscribers (email, catalogue_id)
values ('Fan@Example.com', 'c0000000-0000-0000-0000-000000000001');

select throws_ok(
  $$ insert into public.catalogue_subscribers (email, catalogue_id)
     values ('fan@example.COM', 'c0000000-0000-0000-0000-000000000001') $$,
  '23505', null,
  'catalogue_subscribers_catalogue_email_key rejects a case-variant duplicate on the same catalogue'
);

select lives_ok(
  $$ insert into public.catalogue_subscribers (email, catalogue_id)
     values ('Fan@Example.com', 'c0000000-0000-0000-0000-000000000002') $$,
  'catalogue_subscribers_catalogue_email_key is per catalogue: the same address may subscribe to another catalogue'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.5 newsletter_subscribers lower(email) unique index
-- ---------------------------------------------------------------------------------------------------------
insert into public.newsletter_subscribers (email) values ('P@Example.com');

select throws_ok(
  $$ insert into public.newsletter_subscribers (email) values ('p@example.com') $$,
  '23505', null,
  'newsletter_subscribers_email_key rejects a case-variant duplicate'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.6 qr_configs: one config per catalogue (SC 3: now keyed by catalogue_id)
-- ---------------------------------------------------------------------------------------------------------
insert into public.qr_configs (catalogue_id, config)
values ('c0000000-0000-0000-0000-000000000005', '{"a": 1}'::jsonb);

select throws_ok(
  $$ insert into public.qr_configs (catalogue_id, config)
     values ('c0000000-0000-0000-0000-000000000005', '{"a": 2}'::jsonb) $$,
  '23505', null,
  'qr_configs_catalogue_id_key allows only one config per catalogue'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.7 AI ledger (ai_credits, prompts before SC)
-- ---------------------------------------------------------------------------------------------------------
select throws_ok(
  $$ insert into public.ai_credits (user_id, catalogue_id)
     values (null, 'c0000000-0000-0000-0000-000000000001') $$,
  '23502', null,
  'ai_credits.user_id is NOT NULL, so no charge can fall outside a user''s count'
);

select lives_ok(
  $$ insert into public.ai_credits (user_id, catalogue_id) values
       ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001'),
       ('11111111-1111-1111-1111-111111111111', 'c0000000-0000-0000-0000-000000000001') $$,
  'no UNIQUE on ai_credits(catalogue_id): a catalogue can be charged more than once'
);

select lives_ok(
  $$ insert into public.ai_credits (user_id, catalogue_id)
     values ('11111111-1111-1111-1111-111111111111', null) $$,
  'ai_credits.catalogue_id is nullable, as required by the ON DELETE SET NULL foreign key'
);

select results_eq(
  $$ with i as (
       insert into public.ai_credits (user_id) values ('11111111-1111-1111-1111-111111111111')
       returning turn_id
     ) select turn_id is not null from i $$,
  $$ values (true) $$,
  'ai_credits.turn_id has a DB default, so a legacy insert without it still works'
);

select throws_ok(
  $$ insert into public.ai_credits (user_id, turn_id) values
       ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-00000000000a'),
       ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-00000000000a') $$,
  '23505', null,
  'ai_credits_turn_id_key keeps turn_id unique'
);

select throws_ok(
  $$ insert into public.ai_credits (user_id, continuations)
     values ('11111111-1111-1111-1111-111111111111', -1) $$,
  '23514', null,
  'ai_credits_continuations_range rejects a negative continuation count'
);

select throws_ok(
  $$ insert into public.ai_credits (user_id, continuations)
     values ('11111111-1111-1111-1111-111111111111', 1001) $$,
  '23514', null,
  'ai_credits_continuations_range rejects a continuation count above 1000'
);

-- ON DELETE SET NULL: deleting a catalogue must not delete its charges (which would reset the monthly quota).
insert into public.ai_credits (id, user_id, catalogue_id)
values ('d0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
        'c0000000-0000-0000-0000-000000000003');
delete from public.catalogues where name = 'doomed-cat';

select results_eq(
  $$ select catalogue_id from public.ai_credits where id = 'd0000000-0000-0000-0000-000000000001' $$,
  $$ values (null::uuid) $$,
  'ai_credits_catalogue_id_fkey is ON DELETE SET NULL: the charge survives the catalogue'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.9 Paddle webhook idempotency (admin only)
-- ---------------------------------------------------------------------------------------------------------
insert into private.paddle_events (event_id, event_type, occurred_at)
values ('evt_pgtap_1', 'subscription.updated', now());

select is_empty(
  $$ with i as (
       insert into private.paddle_events (event_id, event_type, occurred_at)
       values ('evt_pgtap_1', 'subscription.updated', now())
       on conflict (event_id) do nothing
       returning 1
     ) select * from i $$,
  'private.paddle_events is keyed by event_id, so a replayed webhook inserts nothing'
);

-- ---------------------------------------------------------------------------------------------------------
-- Index bookkeeping (3.4, 3.6, 3.7, SC 2-5): superseded indexes are dropped, the replacements exist.
-- The old names are checked under both spellings, since SC renames by prefix.
-- ---------------------------------------------------------------------------------------------------------
select ok(
  to_regclass('public.newsletter_catalogue_id_idx') is null
    and to_regclass('public.catalogue_subscribers_catalogue_id_idx') is null,
  'no separate catalogue_id index on catalogue_subscribers (catalogue_subscribers_catalogue_email_key leads with it)'
);

select ok(
  to_regclass('public.qr_configs_catalogue_idx') is null
    and to_regclass('public.qr_configs_catalogue_key') is null
    and to_regclass('public.qr_configs_catalogue_id_key') is not null,
  'the slug indexes on qr_configs are gone; qr_configs_catalogue_id_key replaces them'
);

select ok(
  to_regclass('public.prompts_user_id_idx') is null
    and to_regclass('public.ai_credits_user_id_idx') is null,
  'the plain user_id index on the ledger is dropped (superseded by ai_credits_user_id_created_at_idx)'
);

select ok(
  to_regclass('public.ai_credits_user_id_created_at_idx') is not null
    and to_regclass('public.prompts_user_datetime_idx') is null,
  'ai_credits_user_id_created_at_idx (was prompts_user_datetime_idx) exists for the monthly quota count'
);

-- ---------------------------------------------------------------------------------------------------------
-- 3.9: the admin-only tables get no app-role grants. Role switch as in utils/db/rls.ts (PLAN B.3).
-- ---------------------------------------------------------------------------------------------------------
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"11111111-1111-1111-1111-111111111111","role":"app_user"}', true); end $$;
set local role app_user;

select throws_ok(
  $$ select 1 from private.paddle_events $$,
  '42501', null,
  'app_user has no privilege on private.paddle_events'
);

reset role;

select * from finish();
rollback;
