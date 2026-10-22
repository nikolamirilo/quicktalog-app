-- 60_edge_functions.test.sql
--
-- M02 (20260921181102_edge_functions_per_project.sql): database webhooks post to THIS project's
-- edge functions instead of the hard-coded PROD host, the base URL can only ever be written in a
-- shape that belongs to this stack, the trigger function is reachable by nobody on the API
-- perimeter, and the Brevo trigger only fires on the columns Brevo reads.
--
-- M02 2.1 and the http_post path need a `service_role_key` in Vault, which a local stack does not
-- have (that is the point of 2.1: no secret -> no URL -> no outbound call). Those two assertions
-- are skipped when the secret is absent; everything else is wiring that exists without it.
-- The pg_cron assertion is likewise skipped when pg_cron is not installed, because M02 2.3 only
-- schedules the job `if exists (select 1 from pg_extension where extname = 'pg_cron')`.
--
-- Everything runs inside one transaction that is rolled back.

create extension if not exists pgtap with schema extensions;

begin;

-- pg_temp stays implicit (and therefore first) so pgTAP finds its own result tables.
set local search_path to extensions, public;

select plan(28);

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

-- `vault` and `cron` may not exist on a local stack at all, so both are reached dynamically:
-- a static reference would fail at parse time even inside a branch that is never taken.
create function pgtap_fixtures.vault_service_role_key() returns text
language plpgsql
as $fn$
declare v_token text;
begin
  execute 'select ds.decrypted_secret from vault.decrypted_secrets ds where ds.name = $1 limit 1'
    into v_token using 'service_role_key';
  return v_token;
exception when others then
  return null;
end;
$fn$;

create function pgtap_fixtures.cron_command(p_jobname text) returns text
language plpgsql
as $fn$
declare v_cmd text;
begin
  execute 'select j.command from cron.job j where j.jobname = $1 limit 1' into v_cmd using p_jobname;
  return v_cmd;
exception when others then
  return null;
end;
$fn$;

-- ===========================================================================
-- 1. The webhook trigger function exists and is the hardened one
-- ===========================================================================

-- M02:53-54
select ok(
  exists (
    select 1
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'call_edge_function_with_vault_secret'
       and p.prorettype = 'pg_catalog.trigger'::regtype
  ),
  'M02 2.2: public.call_edge_function_with_vault_secret() exists and returns trigger');

-- M02:56
select ok(
  (select p.prosecdef
     from pg_catalog.pg_proc p
    where p.oid = 'public.call_edge_function_with_vault_secret()'::regprocedure),
  'M02 2.2: the webhook trigger function is SECURITY DEFINER (it reads Vault and private.settings)');

-- M02:57 - search_path tightened from 'public' to '' (every name inside is qualified).
select ok(
  exists (
    select 1
      from pg_catalog.pg_proc p,
           unnest(p.proconfig) as cfg(setting)
     where p.oid = 'public.call_edge_function_with_vault_secret()'::regprocedure
       and cfg.setting ~ '^search_path=(""|)$'
  ),
  'M02 2.2: the webhook trigger function pins search_path to the empty string');

-- M02:88
select is(
  (select p.proowner::regrole::text
     from pg_catalog.pg_proc p
    where p.oid = 'public.call_edge_function_with_vault_secret()'::regprocedure),
  'postgres',
  'M02:88: the webhook trigger function is owned by postgres');

-- ===========================================================================
-- 2. It is executable only by the intended roles
-- ===========================================================================

-- M02:89 (and the earlier revoke in 20260912093000_lockdown_privileges_and_schema_fixes.sql:110)
select ok(
  not pg_catalog.has_function_privilege(
    'public', 'public.call_edge_function_with_vault_secret()'::regprocedure, 'EXECUTE'),
  'M02:89: PUBLIC holds no EXECUTE on the webhook trigger function');

select ok(
  not pg_catalog.has_function_privilege(
    'anon', 'public.call_edge_function_with_vault_secret()'::regprocedure, 'EXECUTE'),
  'M02:89: anon holds no EXECUTE on the webhook trigger function (no /rest/v1/rpc reach)');

select ok(
  not pg_catalog.has_function_privilege(
    'authenticated', 'public.call_edge_function_with_vault_secret()'::regprocedure, 'EXECUTE'),
  'M02:89: authenticated holds no EXECUTE on the webhook trigger function');

-- M02:88-89 - the only EXECUTE grantees left are the owner and the admin roles the worker uses.
-- Trigger functions need EXECUTE at CREATE TRIGGER time, not at fire time, so this list stays short.
select is(
  (select count(*)::int
     from pg_catalog.pg_proc p,
          pg_catalog.aclexplode(p.proacl) a
    where p.oid = 'public.call_edge_function_with_vault_secret()'::regprocedure
      and a.privilege_type = 'EXECUTE'
      and coalesce(a.grantee::regrole::text, '-') not in ('postgres', 'service_role', 'supabase_admin')),
  0,
  'M02:88-89: no role outside postgres/service_role/supabase_admin may execute the webhook function');

-- ===========================================================================
-- 3. The Brevo trigger is wired the way M02 2.4 rewires it
-- ===========================================================================

-- M02:125-127 - AFTER ... FOR EACH ROW on public.users.
select ok(
  exists (
    select 1
      from pg_catalog.pg_trigger t
     where t.tgrelid = 'public.users'::regclass
       and t.tgname = 'Brevo New Contact Webhook'
       and not t.tgisinternal
       and (t.tgtype & 1) = 1      -- FOR EACH ROW
       and (t.tgtype & 2) = 0      -- AFTER, not BEFORE
  ),
  'M02 2.4: "Brevo New Contact Webhook" is an AFTER ... FOR EACH ROW trigger on public.users');

-- M02:126 - `after insert or update of ...`: insert and update only.
select ok(
  (select (t.tgtype &  4) =  4       -- INSERT
      and (t.tgtype & 16) = 16       -- UPDATE
      and (t.tgtype &  8) =  0       -- not DELETE
      and (t.tgtype & 32) =  0       -- not TRUNCATE
     from pg_catalog.pg_trigger t
    where t.tgrelid = 'public.users'::regclass
      and t.tgname = 'Brevo New Contact Webhook'),
  'M02:126: the Brevo trigger fires on INSERT and UPDATE only');

-- M02:126 - the whole point of 2.4: cookie_preferences writes and the re-key must not create CRM traffic.
select is(
  (select pg_catalog.string_agg(a.attname, ',' order by a.attname)
     from pg_catalog.pg_trigger t
     cross join unnest(pg_catalog.string_to_array(nullif(t.tgattr::text, ''), ' ')::int[]) as ta(attnum)
     join pg_catalog.pg_attribute a on a.attrelid = t.tgrelid and a.attnum = ta.attnum
    where t.tgrelid = 'public.users'::regclass
      and t.tgname = 'Brevo New Contact Webhook'),
  'customer_id,email,name,plan_id',
  'M02:126: the Brevo trigger is scoped to UPDATE OF email, name, plan_id, customer_id only');

-- M02:127
select ok(
  (select t.tgfoid = 'public.call_edge_function_with_vault_secret()'::regprocedure
     from pg_catalog.pg_trigger t
    where t.tgrelid = 'public.users'::regclass
      and t.tgname = 'Brevo New Contact Webhook'),
  'M02:127: the Brevo trigger executes public.call_edge_function_with_vault_secret');

select matches(
  (select pg_catalog.pg_get_triggerdef(t.oid)
     from pg_catalog.pg_trigger t
    where t.tgrelid = 'public.users'::regclass
      and t.tgname = 'Brevo New Contact Webhook'),
  'create-brevo-contact',
  'M02:127: the Brevo trigger passes the edge function name create-brevo-contact as TG_ARGV[0]');

-- ===========================================================================
-- 4. The base URL can only be written in a shape that belongs to this stack
-- ===========================================================================

-- M02:8-10
select ok(
  exists (
    select 1
      from pg_catalog.pg_constraint c
     where c.conrelid = 'private.settings'::regclass
       and c.conname = 'settings_edge_functions_base_url_format'
       and c.contype = 'c'
  ),
  'M02 2.0: private.settings carries settings_edge_functions_base_url_format');

-- Vault-dependent: M02 2.1 can only seed the URL when this project's Vault holds a JWT
-- service_role_key. A local stack has none, and then the correct behaviour is "no URL".
select case
  when pgtap_fixtures.vault_service_role_key() is null then
    collect_tap(skip(
      'no service_role_key in this stack''s Vault: M02 2.1 cannot seed edge_functions_base_url and the http_post path cannot run',
      2))
  else
    collect_tap(
      ok(exists (select 1 from private.settings s where s.key = 'edge_functions_base_url'),
         'M02 2.1: edge_functions_base_url is seeded from this project''s own Vault key'),
      matches((select s.value from private.settings s where s.key = 'edge_functions_base_url'),
         '^https://[a-z]{20}\.supabase\.co/functions/v1$',
         'M02 2.1: the seeded base URL points at a Supabase project, derived from the local Vault key')
    )
end;

-- The constraint itself, exercised. The key is cleared first so a seeded row cannot turn a
-- CHECK violation into a duplicate-key error; the whole transaction is rolled back afterwards.
delete from private.settings where key = 'edge_functions_base_url';

select is(
  pgtap_fixtures.errcode($sql$
    insert into private.settings (key, value)
    values ('edge_functions_base_url', 'https://evil.example.com/functions/v1')
  $sql$),
  '23514',
  'M02:9-10: a base URL on a foreign host is rejected on write (23514), not silently used');

delete from private.settings where key = 'edge_functions_base_url';

select is(
  pgtap_fixtures.errcode($sql$
    insert into private.settings (key, value)
    values ('edge_functions_base_url', 'http://127.0.0.1:54321/functions/v1')
  $sql$),
  '00000',
  'M02:10: a local-stack functions URL is accepted');

delete from private.settings where key = 'edge_functions_base_url';

select is(
  pgtap_fixtures.errcode($sql$
    insert into private.settings (key, value)
    values ('edge_functions_base_url', 'https://imhinsgyzzyblghwnedk.supabase.co/functions/v1')
  $sql$),
  '00000',
  'M02:9: a Supabase project functions URL (20-letter ref) is accepted');

delete from private.settings where key = 'edge_functions_base_url';

-- Vault-independent, but pg_cron-dependent: M02 2.3 only schedules when the extension is there.
select case
  when not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    collect_tap(skip('pg_cron is not installed on this stack, so M02 2.3 schedules no "Sync Plans" job', 1))
  else
    collect_tap(
      matches(coalesce(pgtap_fixtures.cron_command('Sync Plans'), ''),
        'edge_functions_base_url',
        'M02 2.3: the "Sync Plans" cron job builds its URL from private.settings, not a hard-coded host')
    )
end;

-- ===========================================================================
-- 5. Nothing behind the webhook wiring is reachable from the API perimeter
-- ===========================================================================
-- private.settings holds the base URL and is read only by postgres-owned SECURITY DEFINER
-- functions (M01 1.4); private itself is not exposed through the Data API (M01 1.2).

-- M01:78
select ok(
  not pg_catalog.has_table_privilege('app_user', 'private.settings'::regclass, 'SELECT'),
  'M01:78: app_user cannot read private.settings (the base URL is definer-only)');

-- M01:78
select ok(
  not pg_catalog.has_table_privilege('public', 'private.settings'::regclass, 'SELECT')
  and not pg_catalog.has_table_privilege('anon', 'private.settings'::regclass, 'SELECT')
  and not pg_catalog.has_table_privilege('authenticated', 'private.settings'::regclass, 'SELECT'),
  'M01:78: PUBLIC, anon and authenticated cannot read private.settings');

-- M01:49-50 - only app_user and app_public get USAGE on the private schema.
select ok(
  not pg_catalog.has_schema_privilege('anon', 'private', 'USAGE'),
  'M01:49-50: anon has no USAGE on schema private');

select ok(
  not pg_catalog.has_schema_privilege('authenticated', 'private', 'USAGE'),
  'M01:49-50: authenticated has no USAGE on schema private');

select ok(
  not pg_catalog.has_schema_privilege('public', 'private', 'USAGE'),
  'M01:49: PUBLIC has no USAGE on schema private');

-- M01:56 (default privileges) plus the explicit revokes in M04:162, M05:213-220 and M06:171-175.
select is(
  (select count(*)::int
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and pg_catalog.has_function_privilege('public', p.oid, 'EXECUTE')),
  0,
  'M01/M04/M05/M06: no function in schema private is executable by PUBLIC');

select is(
  (select count(*)::int
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')),
  0,
  'M01/M04/M05/M06: no function in schema private is executable by anon');

select is(
  (select count(*)::int
     from pg_catalog.pg_proc p
     join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')),
  0,
  'M01/M04/M05/M06: no function in schema private is executable by authenticated');

select * from finish();

rollback;
