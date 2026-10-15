-- =====================================================================================================
-- Quicktalog - PROPOSED Supabase migrations: user-level RLS with private app roles
--
-- STATUS: design artefact. Nothing here has been applied to any project.
-- ARCHITECTURE: decision "B-private-app-role" (Drizzle over Supavisor 6543, per-transaction SET ROLE into
--   app_user / app_public; anon + authenticated keep zero privileges in public; admin paths use postgres).
--
-- HOW TO USE
--   * Every "-- MIGRATION <nn>_<name>" section becomes supabase/migrations/<UTC timestamp>_<name>.sql,
--     in this order. The one "-- RUNBOOK" section is NOT a migration (operator script for the cutover).
--   * Author/apply with the Supabase CLI only. Never drizzle-kit push/generate (stale pgPolicy at
--     ../quicktalog-packages/src/drizzle/migrations/schema.ts:35). After each migration: drizzle-kit pull
--     in quicktalog-packages, strip pgPolicy, release, bump consumers.
--   * PREREQUISITE (local + CI): supabase/config.toml:16 says major_version = 15. `GRANT ... WITH INHERIT
--     FALSE, SET TRUE` is PG16+ syntax, so migration 01 fails on a PG15 local stack. Set major_version = 17
--     (TEST is PostgreSQL 17.6, verified with select version()).
--
-- PHASE MAP (decision section 14)
--   Phase 1  (M1, additive, safe with Clerk + today's code) ... 01, 02, 03, 04, 05
--   Phase 3  (M2, only after the Drizzle-only code is live in that environment; PROD also needs test->main
--             merged first because main still ships anon-client routes) ............................... 06
--   Phase 4  (M3, fail-closed login role for DB_CONNECTION_STRING) ............................................ 07
--   Phase 5  (M4, Supabase Auth build; sign-ups still disabled) ......................................... 08
--   Phase 6  (M5 cutover) ........................ RUNBOOK remap-user-ids, then 09
--   Phase 7  (cleanup, after the agreed retention period) .............................................. 10
--
-- EVIDENCE LABELS
--   file:line  = quicktalog-app, branch `test` (fcee862).
--   TEST       = verified today with read-only SELECTs on imhinsgyzzyblghwnedk.
--   (unverified) = nobody checked; PROD (uhfbapjuzvlyzyodxhqn) was never queried.
--
-- TEST FACTS THESE STATEMENTS RELY ON (all verified 2026-09-16)
--   * PG 17.6; createrole_self_grant = ''; max_connections = 60.
--   * postgres: rolbypassrls = true, rolcreaterole = true, rolinherit = true; member of anon/authenticated/
--     service_role/authenticator with admin+inherit+set.
--   * authenticator: member ONLY of anon, authenticated, service_role (inherit=false,set=true).
--     supabase_realtime_admin: member of the same three. supabase_storage_admin: member of authenticator.
--   * schema auth ACL: postgres=U/supabase_admin (no grant option) -> postgres cannot grant auth USAGE.
--     auth.users ACL: postgres=ar*wdDxtm -> postgres holds TRIGGER on auth.users.
--   * No global pg_default_acl entry for postgres functions (only IN SCHEMA public/storage entries).
--   * 12 public tables, RLS off, 0 policies. Views contacts, active_subscriptions: security_invoker=on,
--     grants postgres + service_role only.
--   * anon grants (relacl): users arwd, catalogues arw, subscriptions arw, analytics ar, newsletter r,
--     job_logs a, job_logs_id_seq U, EXECUTE get_pageview_totals. authenticated: none.
--   * Constraint names: catalogues_new_pkey, catalogues_new_name_key, catalogues_new_created_by_fkey,
--     prompts_service_catalogue_key UNIQUE(catalogue), prompts_catalogue_fkey + ocr_catalogue_fkey
--     (-> catalogues(name) ON UPDATE CASCADE ON DELETE CASCADE), prompts_user_id_fkey, ocr_user_id_fkey,
--     user_themes_user_id_name_key, users_customer_id_key, users_plan_id_fkey, newsletter_catalogue_id_fkey
--     (CASCADE), analytics_unique_entry.
--   * Non-unique indexes that new unique indexes make redundant: qr_configs_catalogue_idx,
--     newsletter_catalogue_id_idx; prompts_user_id_idx (superseded by (user_id, datetime)).
--   * Triggers: users "Brevo New Contact Webhook" AFTER INSERT OR UPDATE; subscriptions "New Lead Webhook",
--     "Subscription Notification Webhook". analytics_upsert_trigger ABSENT. No triggers on auth.users.
--   * pg_cron job "Sync Plans" posts to the hard-coded PROD functions URL. pg_graphql NOT installed.
--   * Data: users 3, catalogues 4 (active 2, draft 2), prompts 3 (0 null user_id), ocr 0, newsletter 0,
--     product_newsletter 0, qr_configs 0, user_themes 2, subscriptions 2, analytics 0, auth.users 0.
--     No duplicate newsletter/product_newsletter/qr_configs keys. max pg_column_size: content 9702,
--     colors 149, cookie_preferences 115. footer->'newsletter' is JSON false on all 4 catalogues.
--   * plans contains pri_01k27ajepm199twd1x77rpwdrq (Starter) = DEFAULT_PLAN_ID in lib/users/syncFromClerk.ts:3.
-- =====================================================================================================



-- MIGRATION 01_app_roles_private_schema
-- -----------------------------------------------------------------------------------------------------
-- Phase 1 (M1). Additive: creates roles, the non-exposed `private` schema, the identity helper and a
-- settings table. Nothing that runs today changes behaviour.
-- Rollback: rls-design.md section 13, migration 01.
-- -----------------------------------------------------------------------------------------------------

-- 1.1 Private application roles ------------------------------------------------------------------------
-- WHY: every Drizzle query today runs as postgres (utils/drizzle.ts:5-8), which has BYPASSRLS (TEST), so
-- RLS cannot protect the 39 Drizzle references (actions/*.ts, lib/ai/access.ts, lib/users/fetchUserData.ts,
-- app/api/dashboard/*). app_user / app_public are NOLOGIN NOINHERIT NOBYPASSRLS and are NOT granted to
-- authenticator, so no JWT presented to PostgREST can ever assume them (TEST: authenticator is a member of
-- anon/authenticated/service_role only). That is what lets plan limits stay in TypeScript (decision s.9).
--
-- Membership for postgres: a CREATEROLE non-superuser that creates a role is implicitly granted ADMIN
-- OPTION only. createrole_self_grant='set' makes that implicit grant SET TRUE / INHERIT FALSE (PostgreSQL
-- 17 docs, runtime-config-client). The DO block after it covers roles that already exist or were created
-- by a superuser (e.g. if the local CLI applies migrations as supabase_admin - unverified): "a CREATEROLE
-- user ... could always execute a GRANT statement that would achieve the same effect" (same docs page).
-- INHERIT FALSE must be explicit: an unspecified INHERIT defaults to the member's rolinherit, which is
-- true for postgres (TEST).
set createrole_self_grant = 'set';

do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_user') then
    create role app_user nologin noinherit nobypassrls;
  end if;
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_public') then
    create role app_public nologin noinherit nobypassrls;
  end if;
end $$;

reset createrole_self_grant;

do $$
declare
  r text;
begin
  foreach r in array array['app_user', 'app_public'] loop
    -- Fail loudly if a role with this name pre-exists with dangerous attributes (roles are cluster-global).
    if exists (select 1 from pg_catalog.pg_roles
                where rolname = r and (rolcanlogin or rolbypassrls or rolsuper or rolinherit or rolcreaterole)) then
      raise exception 'role % already exists with unsafe attributes; refusing to continue', r;
    end if;
    if not pg_catalog.pg_has_role('postgres', r, 'SET') then
      execute pg_catalog.format('grant %I to postgres with inherit false, set true', r);
    end if;
  end loop;
end $$;

comment on role app_user is
  'Signed-in owner traffic. Reached only by SET ROLE inside utils/db/rls.ts withUser(). Never grant to authenticator.';
comment on role app_public is
  'Visitor/ISR/public-signup traffic. Reached only by SET ROLE inside utils/db/rls.ts withPublic(). Never grant to authenticator.';

-- 1.2 Private schema --------------------------------------------------------------------------------------
-- WHY: SECURITY DEFINER helpers must live in a schema PostgREST does not expose (exposed schemas stay
-- public + graphql_public; supabase/config.toml:7 exposes only public locally). anon/authenticated get no
-- USAGE, so even if `private` were ever exposed by mistake they could not resolve anything in it.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to app_user, app_public;
comment on schema private is
  'Not exposed via the Data API. Helpers for app_user/app_public and admin-only tables. No anon/authenticated access.';

-- WHY (global form, no IN SCHEMA): functions get EXECUTE for PUBLIC by default. TEST has no global default
-- ACL entry for postgres functions, and a per-schema ALTER DEFAULT PRIVILEGES cannot remove the hard-wired
-- PUBLIC EXECUTE. Every function below also gets an explicit REVOKE ... FROM public.
alter default privileges for role postgres revoke execute on functions from public;

-- 1.3 Identity helper ------------------------------------------------------------------------------------
-- WHY: policies need the verified user id. auth.uid() casts to uuid and raises 22P02 on Clerk ids
-- ("user_..."; TEST), and app roles cannot call auth.jwt() because postgres cannot grant USAGE on schema
-- auth (TEST ACL). This helper reads the same GUC PostgREST uses, which withUser() sets from
-- lib/auth/identity.ts (Clerk auth() today, supabase.auth.getClaims() after cutover). It returns text, so
-- the policies are identical before and after the id remap (decision s.7).
-- Always call it as (select private.current_user_id()) in policies: initPlan, evaluated once per statement.
create or replace function private.current_user_id()
returns text
language sql
stable
set search_path = ''
as $$
  select nullif((nullif(pg_catalog.current_setting('request.jwt.claims', true), '')::jsonb) ->> 'sub', '')
$$;
alter function private.current_user_id() owner to postgres;
revoke all on function private.current_user_id() from public;
grant execute on function private.current_user_id() to app_user;
comment on function private.current_user_id() is
  'Verified subject (text) set by withUser(). NULL when unset -> every owner policy matches nothing (fail closed).';

-- 1.4 Per-project settings --------------------------------------------------------------------------------
-- WHY: some values differ per project and must not be hard-coded in migrations that run on TEST and PROD:
--   edge_functions_base_url  (migration 02; today hard-coded to PROD at 20260911213819_remote_schema.sql:74)
--   default_plan_id          (migration 08; today DEFAULT_PLAN_ID in lib/users/syncFromClerk.ts:3)
-- Readable only by postgres-owned SECURITY DEFINER functions; no app role grants.
create table if not exists private.settings (
  key        text primary key check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  value      text not null,
  updated_at timestamptz not null default now()
);
revoke all on table private.settings from public;
comment on table private.settings is 'Per-project configuration read by SECURITY DEFINER functions. Set by operators.';



-- MIGRATION 02_edge_functions_per_project
-- -----------------------------------------------------------------------------------------------------
-- Phase 1 (M1). Makes DB-originated webhooks post to THIS project's edge functions, never to PROD from TEST,
-- and stops the Brevo webhook firing on every users UPDATE.
-- PROD PRE-CHECK: after applying, `select value from private.settings where key='edge_functions_base_url'`
-- must return https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1. If it is empty (for example the Vault
-- secret is already an sb_secret_ key, which is not a JWT), insert it in the same session or the users/
-- subscriptions webhooks stop firing (they log a WARNING and skip).
-- Rollback: rls-design.md section 13, migration 02.
-- -----------------------------------------------------------------------------------------------------

-- 2.1 Seed the base URL from this project's own Vault key -------------------------------------------------
-- WHY: legacy service_role keys are JWTs whose payload carries "ref" = the project ref (unverified for the
-- PROD secret specifically). Deriving the URL from the key already stored in THIS project's Vault means
-- PROD keeps working with no manual step, and TEST (0 Vault secrets) gets no URL -> no outbound call.
do $$
declare
  v_token   text;
  v_part    text;
  v_payload jsonb;
  v_ref     text;
begin
  if exists (select 1 from private.settings where key = 'edge_functions_base_url') then
    return;
  end if;
  select ds.decrypted_secret into v_token
    from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
  if v_token is null or v_token !~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' then
    raise notice 'edge_functions_base_url not seeded (no JWT service_role_key in Vault). Insert it manually if this project must call edge functions.';
    return;
  end if;
  v_part := pg_catalog.translate(pg_catalog.split_part(v_token, '.', 2), '-_', '+/');
  v_part := pg_catalog.rpad(v_part, ((pg_catalog.length(v_part) + 3) / 4) * 4, '=');
  v_payload := pg_catalog.convert_from(pg_catalog.decode(v_part, 'base64'), 'UTF8')::jsonb;
  v_ref := v_payload ->> 'ref';
  if v_ref ~ '^[a-z]{20}$' then
    insert into private.settings (key, value)
    values ('edge_functions_base_url', 'https://' || v_ref || '.supabase.co/functions/v1');
    raise notice 'edge_functions_base_url seeded for project %', v_ref;
  else
    raise notice 'edge_functions_base_url not seeded (JWT has no usable ref claim).';
  end if;
exception when others then
  raise notice 'edge_functions_base_url not seeded: %', sqlerrm;
end $$;

-- 2.2 Webhook trigger function reads the base URL -------------------------------------------------------
-- WHY: 20260911213819_remote_schema.sql:74 hard-codes https://uhfbapjuzvlyzyodxhqn.supabase.co, so any
-- TEST row with a Vault key would post real user rows to PROD Brevo/CRM/Discord. search_path tightened
-- from 'public' to '' (every name qualified). CREATE OR REPLACE keeps the existing ACL
-- (TEST: postgres + service_role only) and the three triggers that reference it.
create or replace function public.call_edge_function_with_vault_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base       text;
  v_token      text;
  v_request_id bigint;
begin
  select s.value into v_base from private.settings s where s.key = 'edge_functions_base_url';
  if v_base is null then
    raise warning 'call_edge_function_with_vault_secret: edge_functions_base_url not set, skipping %', tg_argv[0];
    return new;
  end if;

  select ds.decrypted_secret into v_token
    from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
  if v_token is null then
    raise warning 'call_edge_function_with_vault_secret: service_role_key not found in Vault, skipping %', tg_argv[0];
    return new;
  end if;

  select net.http_post(
    url                  := v_base || '/' || tg_argv[0],
    headers              := pg_catalog.jsonb_build_object('Content-type', 'application/json',
                                                          'Authorization', 'Bearer ' || v_token),
    body                 := pg_catalog.to_jsonb(new),
    timeout_milliseconds := 5000
  ) into v_request_id;

  return new;
end;
$$;
alter function public.call_edge_function_with_vault_secret() owner to postgres;
revoke all on function public.call_edge_function_with_vault_secret() from public, anon, authenticated;

-- 2.3 "Sync Plans" cron job reads the same setting ----------------------------------------------------
-- WHY: 20260912093000_lockdown_privileges_and_schema_fixes.sql:245-264 schedules a POST to the PROD URL
-- from every project. Zero rows in private.settings -> the SELECT returns nothing -> no request.
do $do$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'Sync Plans',
      '0 8 */3 * *',
      $job$
      select net.http_post(
        url := s.value || '/sync-available-plans',
        headers := jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                          where name = 'service_role_key' limit 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      )
      from private.settings s
      where s.key = 'edge_functions_base_url'
      $job$
    );
  end if;
end
$do$;

-- 2.4 Brevo trigger: only on columns Brevo cares about ----------------------------------------------------
-- WHY: AFTER INSERT OR UPDATE (remote_schema.sql:437) posts the whole row on every UPDATE. After this plan,
-- app_user updates users.cookie_preferences (app/api/update-consent/route.ts after cutover) and the M5 remap
-- rewrites users.id; neither should create CRM traffic. Which columns the PROD edge function actually reads
-- is (unverified) - its source is in no repo.
drop trigger if exists "Brevo New Contact Webhook" on public.users;
create trigger "Brevo New Contact Webhook"
  after insert or update of email, name, plan_id, customer_id on public.users
  for each row execute function public.call_edge_function_with_vault_secret('create-brevo-contact');



-- MIGRATION 03_integrity_constraints_ai_ledger
-- -----------------------------------------------------------------------------------------------------
-- Phase 1 (M1). Structural invariants that must hold even when app code has bugs (decision s.9), plus the
-- unique keys that let public writes use ON CONFLICT instead of a pre-check SELECT.
-- Destructive steps (dedupe, null-user ledger rows) copy the affected rows into private.backup_* first.
-- PROD PRE-CHECKS (user runs read-only, Phase 0):
--   select status, count(*) from catalogues group by 1;                           -- only the 5 known statuses
--   select count(*) from prompts where user_id is null; same for ocr;              -- rows that will be removed
--   select catalogue_id, lower(email), count(*) from newsletter group by 1,2 having count(*) > 1;
--   select lower(email), count(*) from product_newsletter group by 1 having count(*) > 1;
--   select catalogue, count(*) from qr_configs group by 1 having count(*) > 1;
--   select max(pg_column_size(content)) from catalogues;  (and colors, config, cookie_preferences)
-- BEHAVIOUR CHANGE ON TODAY'S CODE: dropping prompts UNIQUE(catalogue) makes lib/ai/access.ts:98 meter()
-- succeed after the first prompt per catalogue, so users start reaching ai_prompts limits they never hit.
-- Rollback: rls-design.md section 13, migration 03 (dedupe deletions restore from private.backup_*).
-- -----------------------------------------------------------------------------------------------------

-- 3.1 catalogues.status domain --------------------------------------------------------------------------
-- WHY: updateItemStatus (actions/catalogue.ts:105) writes an unvalidated status; the public policy keys on
-- status = 'active'. Values from ../quicktalog-packages/src/types/enums.ts:9-14. TEST has only active/draft.
alter table public.catalogues
  add constraint catalogues_status_check
  check (status in ('active', 'inactive', 'draft', 'in preparation', 'error')) not valid;
alter table public.catalogues validate constraint catalogues_status_check;

-- 3.2 jsonb size ceilings ---------------------------------------------------------------------------------
-- WHY: app_user can write these columns directly; a size cap stops one owner from storing arbitrarily large
-- blobs (DoS on ISR, Redis mirror, Sentry). Limits are product decisions (TEST maxima are far below).
-- NOT VALID now (enforced for new writes); validated in migration 06 after the PROD audit.
alter table public.catalogues  add constraint catalogues_content_size
  check (pg_column_size(content) < 1048576) not valid;
alter table public.user_themes add constraint user_themes_colors_size
  check (pg_column_size(colors) < 4096) not valid;
alter table public.qr_configs  add constraint qr_configs_config_size
  check (pg_column_size(config) < 65536) not valid;
alter table public.users       add constraint users_cookie_prefs_size
  check (cookie_preferences is null or pg_column_size(cookie_preferences) < 2048) not valid;

-- 3.3 Backups for the destructive steps below -------------------------------------------------------------
create table if not exists private.backup_newsletter_dupes         (like public.newsletter);
create table if not exists private.backup_product_newsletter_dupes (like public.product_newsletter);
create table if not exists private.backup_qr_configs_dupes         (like public.qr_configs);
create table if not exists private.backup_prompts_null_user        (like public.prompts);
create table if not exists private.backup_ocr_null_user            (like public.ocr);
revoke all on table private.backup_newsletter_dupes, private.backup_product_newsletter_dupes,
  private.backup_qr_configs_dupes, private.backup_prompts_null_user, private.backup_ocr_null_user from public;

-- 3.4 newsletter: one row per (catalogue, case-insensitive email) -----------------------------------------
-- WHY: actions/newsletter.ts:25-44 dedupes with a racy SELECT; the replacement definer function
-- (migration 05) relies on ON CONFLICT against this index. Keeps the earliest row.
insert into private.backup_newsletter_dupes
select n.* from public.newsletter n
 where exists (select 1 from public.newsletter d
                where d.catalogue_id = n.catalogue_id and lower(d.email) = lower(n.email)
                  and (d.created_at, d.id) < (n.created_at, n.id));
delete from public.newsletter n
 using public.newsletter d
 where d.catalogue_id = n.catalogue_id and lower(d.email) = lower(n.email)
   and (d.created_at, d.id) < (n.created_at, n.id);
create unique index if not exists newsletter_catalogue_email_key
  on public.newsletter (catalogue_id, lower(email));
-- Leading column catalogue_id now serves the FK newsletter_catalogue_id_fkey; avoid lint 0005/0009.
drop index if exists public.newsletter_catalogue_id_idx;

-- 3.5 product_newsletter: one row per case-insensitive email ------------------------------------------------
-- WHY: actions/newsletter.ts:64-74 SELECT-then-INSERT; replaced by ON CONFLICT in migration 05.
insert into private.backup_product_newsletter_dupes
select n.* from public.product_newsletter n
 where exists (select 1 from public.product_newsletter d where lower(d.email) = lower(n.email) and d.id < n.id);
delete from public.product_newsletter n
 using public.product_newsletter d
 where lower(d.email) = lower(n.email) and d.id < n.id;
create unique index if not exists product_newsletter_email_key
  on public.product_newsletter (lower(email));

-- 3.6 qr_configs: one config per catalogue --------------------------------------------------------------
-- WHY: actions/qr-configs.ts:14-33 select-then-insert race; the new code uses
-- INSERT ... ON CONFLICT (catalogue) DO UPDATE. TEST has only a non-unique index even though the Drizzle
-- schema declares qr_configs_catalogue_key (../quicktalog-packages/src/drizzle/migrations/schema.ts:124).
-- Keeps the most recently updated row.
insert into private.backup_qr_configs_dupes
select q.* from public.qr_configs q
 where exists (select 1 from public.qr_configs d
                where d.catalogue = q.catalogue
                  and (coalesce(d.updated_at, '-infinity'::timestamp), d.id)
                    > (coalesce(q.updated_at, '-infinity'::timestamp), q.id));
delete from public.qr_configs q
 using public.qr_configs d
 where d.catalogue = q.catalogue
   and (coalesce(d.updated_at, '-infinity'::timestamp), d.id)
     > (coalesce(q.updated_at, '-infinity'::timestamp), q.id);
create unique index if not exists qr_configs_catalogue_key on public.qr_configs (catalogue);
drop index if exists public.qr_configs_catalogue_idx;

-- 3.7 AI ledger (prompts) --------------------------------------------------------------------------------
-- WHY (each defect is from research/ai-agent.md s.5):
--   a) UNIQUE(catalogue) makes every meter() after the first per catalogue fail (lib/ai/access.ts:98;
--      swallowed at app/api/agent/route.ts:123-127) -> drop it.
--   b) catalogue FK ON DELETE CASCADE: deleting a catalogue (actions/catalogue.ts:52) deletes its charges
--      and resets the monthly quota; FK actions bypass RLS -> ON DELETE SET NULL, catalogue nullable.
--   c) user_id nullable -> a null row silently leaves the count -> NOT NULL.
--   d) turn_id (unique), continuations, refunded_at support server-authoritative metering in
--      private.begin_ai_turn / refund_ai_turn (migration 05). turn_id gets a DB default so today's meter()
--      insert (Drizzle schema without turn_id) keeps working during Phase 1.
-- Constraint lookups are name-independent so a differently named FK/UNIQUE on PROD cannot be skipped
-- silently (an IF EXISTS on the wrong name would leave the CASCADE FK in place next to the new one).
do $$
declare
  r record;
begin
  for r in
    select c.conname
      from pg_catalog.pg_constraint c
     where c.conrelid = 'public.prompts'::regclass
       and (   (c.contype = 'f' and c.confrelid = 'public.catalogues'::regclass)
            or (c.contype = 'u' and c.conkey = array[(select a.attnum from pg_catalog.pg_attribute a
                                                       where a.attrelid = 'public.prompts'::regclass
                                                         and a.attname = 'catalogue')]::int2[]))
  loop
    execute pg_catalog.format('alter table public.prompts drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.prompts alter column catalogue drop not null;
alter table public.prompts
  add constraint prompts_catalogue_fkey foreign key (catalogue)
  references public.catalogues (name) on update cascade on delete set null;

insert into private.backup_prompts_null_user select * from public.prompts where user_id is null;
delete from public.prompts where user_id is null;
alter table public.prompts alter column user_id set not null;

alter table public.prompts
  add column if not exists turn_id       uuid,
  add column if not exists continuations integer not null default 0,
  add column if not exists refunded_at   timestamptz;
update public.prompts set turn_id = gen_random_uuid() where turn_id is null;
alter table public.prompts
  alter column turn_id set default gen_random_uuid(),
  alter column turn_id set not null;
alter table public.prompts
  add constraint prompts_continuations_range check (continuations between 0 and 1000);
create unique index if not exists prompts_turn_id_key       on public.prompts (turn_id);
create index        if not exists prompts_user_datetime_idx on public.prompts (user_id, datetime);
create index        if not exists prompts_catalogue_idx     on public.prompts (catalogue);   -- FK cascade lookups (was served by the dropped UNIQUE)
drop index if exists public.prompts_user_id_idx;                                              -- superseded by (user_id, datetime)

-- 3.8 ocr (same ledger rules; nothing writes it today, TEST 0 rows) ---------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.conname from pg_catalog.pg_constraint c
     where c.conrelid = 'public.ocr'::regclass and c.contype = 'f'
       and c.confrelid = 'public.catalogues'::regclass
  loop
    execute pg_catalog.format('alter table public.ocr drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.ocr alter column catalogue drop not null;
alter table public.ocr alter column catalogue drop default;   -- '' can never satisfy the FK to catalogues(name)
alter table public.ocr
  add constraint ocr_catalogue_fkey foreign key (catalogue)
  references public.catalogues (name) on update cascade on delete set null;
insert into private.backup_ocr_null_user select * from public.ocr where user_id is null;
delete from public.ocr where user_id is null;
alter table public.ocr alter column user_id set not null;

-- 3.9 Paddle webhook idempotency (admin only) ---------------------------------------------------------------
-- WHY: utils/paddle/process-webhook.ts has no idempotency or ordering (research/public-and-system-surfaces.md
-- finding at :22-40) and swallows errors (:44-50). asAdmin inserts event_id first, ON CONFLICT DO NOTHING
-- -> already processed. No app-role grants.
create table if not exists private.paddle_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  processed_at timestamptz not null default now()
);
revoke all on table private.paddle_events from public;



-- MIGRATION 04_app_role_grants_policies
-- -----------------------------------------------------------------------------------------------------
-- Phase 1 (M1). Grants + policies for app_user / app_public, server-owned-column triggers, and RLS on the
-- six tables that no anon path uses. users/catalogues/analytics/newsletter/subscriptions/job_logs get RLS in
-- migration 06, because anon supabase-js paths still read/write them until Phase 2 code ships
-- (app/api/items/route.ts:13, app/api/items/[name]/route.ts:13, app/api/dashboard/analytics/route.ts:17-25,
-- app/api/clerk/route.ts:51, lib/users/fetchUserData.ts:55, utils/paddle/process-webhook.ts:62-223).
-- Until 06 runs, policies on those four tables exist but are inert (advisor 0007 is expected).
--
-- Grant design rules:
--   * INSERT is table-level: Drizzle's buildInsertQuery lists EVERY schema column and emits `default` for
--     missing ones (node_modules/drizzle-orm/pg-core/dialect.js:356-392), so column-limited INSERT grants
--     would fail. Server-owned columns are pinned by a BEFORE INSERT trigger instead.
--   * UPDATE is column-level: columns an owner must never change (ids, ownership, slug, plan, billing,
--     consents) are simply not granted -> 42501 instead of silent mass assignment
--     (actions/catalogue.ts:337-347 today writes client createdBy/id).
--   * app_public SELECT on catalogues is column-level: created_by is withheld (today it leaks through
--     /api/items and every public page's RSC payload, app/catalogues/[name]/page.tsx:143).
--   * One permissive policy per role+command (avoids advisor 0006). Every policy is TO an app role.
-- Rollback: rls-design.md section 13, migration 04.
-- -----------------------------------------------------------------------------------------------------

-- 4.1 users -----------------------------------------------------------------------------------------------
-- Call sites: lib/users/fetchUserData.ts:42,64 -> lib/users/my-user-data.ts; lib/entitlements/plan.ts
-- (SELECT ... FOR UPDATE needs UPDATE on >= 1 column, satisfied by name/cookie_preferences);
-- app/api/update-consent/route.ts (cookie_preferences, Supabase phase).
-- Denied: plan_id, customer_id, email, consents, id, image, created_at (Paddle/auth sync write them via admin).
grant select on public.users to app_user;
grant update (name, cookie_preferences) on public.users to app_user;

create policy users_select_self on public.users
  for select to app_user
  using (id = (select private.current_user_id()));
create policy users_update_self on public.users
  for update to app_user
  using      (id = (select private.current_user_id()))
  with check (id = (select private.current_user_id()));

-- 4.2 catalogues ------------------------------------------------------------------------------------------
-- Call sites (app_user): actions/catalogue.ts:46,52 deleteItem; :69,79 deleteMultipleItems; :99,105
-- updateItemStatus; :137,161 duplicateItem; :204 createCatalogue; :246 updateCatalogue ownership proof;
-- :328,340 publishCatalogue; :289 getCatalogueByName -> getOwnedCatalogueForEditor; lib/ai/access.ts:40;
-- app/api/dashboard/catalogues/route.ts:18; app/api/dashboard/newsletter/route.ts:35;
-- app/admin/[name]/{builder,qr-editor,analytics}/page.tsx ownership reads.
-- Call sites (app_public): app/api/items/route.ts:13, app/api/items/[name]/route.ts:13 via
-- lib/catalogue/public.ts, feeding app/catalogues/[name]/page.tsx:14,52,113 and app/sitemap.ts:11.
grant select, insert, delete on public.catalogues to app_user;
grant update (logo, heading, status, language, currency, business_type, content, legal, appearance,
              contact, header, footer, partners, metadata, tags, updated_at)
  on public.catalogues to app_user;                                  -- NOT id, name, created_by, created_at, source
grant select (id, name, logo, heading, status, source, language, currency, business_type, content, legal,
              appearance, contact, header, footer, partners, metadata, tags, created_at, updated_at)
  on public.catalogues to app_public;                                -- NOT created_by

-- Owners see only their own rows, including their own active ones; app_user never sees other owners'
-- active catalogues, so "a row came back" always means "owned" (lib/ai/access.ts:47 style checks stay
-- correct; public reads use app_public).
create policy catalogues_select_owner on public.catalogues
  for select to app_user
  using (created_by = (select private.current_user_id()));
-- New rows must belong to the caller and start unpublished: blocks createCatalogue with status:'active'
-- (actions/catalogue.ts:204) and duplicating an active catalogue straight to live (:161).
create policy catalogues_insert_owner on public.catalogues
  for insert to app_user
  with check (created_by = (select private.current_user_id())
              and status in ('draft', 'in preparation'));
create policy catalogues_update_owner on public.catalogues
  for update to app_user
  using      (created_by = (select private.current_user_id()))
  with check (created_by = (select private.current_user_id()));
create policy catalogues_delete_owner on public.catalogues
  for delete to app_user
  using (created_by = (select private.current_user_id()));
-- Drafts never reach visitors, ISR, generateMetadata or the sitemap (today /api/items returns drafts).
create policy catalogues_select_public on public.catalogues
  for select to app_public
  using (status = 'active');

-- 4.3 qr_configs (no owner column; ownership through catalogues.name) ------------------------------------
-- Call sites: actions/qr-configs.ts:14,21,30 upsertQrConfig (no auth today), :54 getQrConfig.
-- The subquery runs under app_user's catalogues policy too, so it can only ever return the caller's names.
-- INSERT ... ON CONFLICT DO UPDATE on another owner's existing row RAISES (UPDATE USING violation), it does
-- not silently no-op.
grant select, insert, delete on public.qr_configs to app_user;
grant update (config, updated_at) on public.qr_configs to app_user;
create policy qr_configs_owner on public.qr_configs
  for all to app_user
  using      (catalogue in (select c.name from public.catalogues c
                             where c.created_by = (select private.current_user_id())))
  with check (catalogue in (select c.name from public.catalogues c
                             where c.created_by = (select private.current_user_id())));

-- 4.4 user_themes ------------------------------------------------------------------------------------------
-- Call sites: actions/themes.ts:20 list, :48/:57/:62 persistTheme (-> lib/themes/upsert.ts ON CONFLICT
-- (user_id, name)), :91 delete; agent/tools.ts:433 via the saveTheme port.
grant select, insert, delete on public.user_themes to app_user;
grant update (name, colors, updated_at) on public.user_themes to app_user;
create policy user_themes_owner on public.user_themes
  for all to app_user
  using      (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id()));

-- 4.5 Read-only owner views of ledgers and subscribers ----------------------------------------------------
-- Call sites: lib/users/fetchUserData.ts:93,98,112,123 (-> private.my_usage()), app/api/dashboard/
-- analytics/route.ts:17,22, app/api/dashboard/newsletter/route.ts:18.
-- No INSERT/UPDATE/DELETE: quota rows are written only by private.begin_ai_turn/refund_ai_turn (definer)
-- or the worker (service_role); subscriber rows only by private.subscribe_catalogue_newsletter.
grant select on public.analytics, public.prompts, public.ocr, public.newsletter to app_user;
create policy analytics_select_owner  on public.analytics  for select to app_user
  using (user_id  = (select private.current_user_id()));
create policy prompts_select_owner    on public.prompts    for select to app_user
  using (user_id  = (select private.current_user_id()));
create policy ocr_select_owner        on public.ocr        for select to app_user
  using (user_id  = (select private.current_user_id()));
create policy newsletter_select_owner on public.newsletter for select to app_user
  using (owner_id = (select private.current_user_id()));

-- No app-role privileges at all on: subscriptions, plans, job_logs, product_newsletter, views contacts and
-- active_subscriptions (CRM exports; postgres/service_role only; security_invoker already on).

-- 4.6 Server-owned columns -----------------------------------------------------------------------------------
-- WHY: INSERT must stay table-level (see header), so pin id/created_at/updated_at for app_user inserts;
-- a client-chosen catalogue id could otherwise collide with or shadow Redis/ISR keys. updated_at is touched
-- on every UPDATE regardless of caller (the worker's inactivation now bumps it too - intended).
create or replace function private.catalogues_pin_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user = 'app_user' then
    new.id         := pg_catalog.gen_random_uuid();
    new.created_at := pg_catalog.now();
    new.updated_at := pg_catalog.now();
  end if;
  return new;
end;
$$;

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

alter function private.catalogues_pin_insert() owner to postgres;
alter function private.touch_updated_at()      owner to postgres;
revoke all on function private.catalogues_pin_insert(), private.touch_updated_at() from public;
-- Harmless and avoids relying on fire-time ACL behaviour (PG checks EXECUTE at CREATE TRIGGER time).
grant execute on function private.catalogues_pin_insert(), private.touch_updated_at() to app_user;

drop trigger if exists catalogues_pin_insert        on public.catalogues;
drop trigger if exists catalogues_touch_updated_at  on public.catalogues;
drop trigger if exists qr_configs_touch_updated_at  on public.qr_configs;
drop trigger if exists user_themes_touch_updated_at on public.user_themes;
create trigger catalogues_pin_insert        before insert on public.catalogues
  for each row execute function private.catalogues_pin_insert();
create trigger catalogues_touch_updated_at  before update on public.catalogues
  for each row execute function private.touch_updated_at();
create trigger qr_configs_touch_updated_at  before update on public.qr_configs
  for each row execute function private.touch_updated_at();
create trigger user_themes_touch_updated_at before update on public.user_themes
  for each row execute function private.touch_updated_at();

-- 4.7 RLS on tables no anon path uses ---------------------------------------------------------------------
-- WHY now: postgres (today's Drizzle) and service_role (worker) bypass RLS, and anon/authenticated hold no
-- grants on these (TEST relacl), so enabling RLS changes nothing that runs today and makes app_user
-- enforcement real for qr_configs/user_themes/prompts/ocr from the first converted call site.
-- plans and product_newsletter intentionally get no policies (advisor 0008 INFO is expected).
alter table public.prompts            enable row level security;
alter table public.ocr                enable row level security;
alter table public.qr_configs         enable row level security;
alter table public.user_themes        enable row level security;
alter table public.product_newsletter enable row level security;
alter table public.plans              enable row level security;



-- MIGRATION 05_private_entry_points
-- -----------------------------------------------------------------------------------------------------
-- Phase 1 (M1). Narrow SECURITY DEFINER functions for the few operations that must look across tenants or
-- write append-only ledgers. All live in `private` (not exposed; anon/authenticated have no USAGE), are
-- owned by postgres, pin search_path = '', and are EXECUTE-able only by the app roles listed.
-- Rollback: rls-design.md section 13, migration 05.
-- -----------------------------------------------------------------------------------------------------

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
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
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
     or v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
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
-- decisions, unverified against docs/ai-agent-plan-mode.md). A forged continuation falls through and is
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
  perform 1 from public.users u where u.id = v_uid for update;

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



-- MIGRATION 06_close_data_api
-- -----------------------------------------------------------------------------------------------------
-- Phase 3 (M2). APPLY ONLY AFTER the Drizzle-only code (every call site on withUser/withPublic/asAdmin)
-- is deployed to the same environment. PROD order: merge test -> main, 01-05, deploy, 06. On PROD, main
-- still ships anon-client routes (POST/PATCH /api/items, /api/analytics, /api/analytics/all,
-- /api/subscriptions/check) that this migration breaks on purpose.
-- Exit gate: the publishable key gets 401/403/42501 on every table and /rpc (tests/integration/db/
-- postgrest-perimeter.test.ts).
-- Rollback: rls-design.md section 13, migration 06 (prefer rolling the app forward).
-- -----------------------------------------------------------------------------------------------------

-- 6.1 RLS on the remaining six tables ------------------------------------------------------------------
-- users/catalogues/analytics/newsletter already carry app-role policies (migration 04).
-- subscriptions and job_logs get no policies: only postgres (asAdmin, Paddle) and service_role (worker)
-- touch them; both bypass RLS (advisor 0008 INFO is expected and intentional).
alter table public.users         enable row level security;
alter table public.catalogues    enable row level security;
alter table public.analytics     enable row level security;
alter table public.newsletter    enable row level security;
alter table public.subscriptions enable row level security;
alter table public.job_logs      enable row level security;

-- 6.2 Stale anon grants (20260912093000_lockdown_privileges_and_schema_fixes.sql:57-119) --------------------
-- They cite files that no longer exist on `test` (utils/paddle/get-customer-id.ts, app/api/subscriptions/
-- check/route.ts, app/api/analytics/route.ts, app/api/items POST/PATCH). Today they let anyone with the
-- publishable key dump users, self-upgrade plan_id, cascade-delete other users, deface catalogues, read every
-- subscriber email and forge subscriptions (research/data-access.md "security today").
-- ALL TABLES includes the views contacts and active_subscriptions; ALL SEQUENCES includes job_logs_id_seq.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on schema private from anon, authenticated;                   -- defensive; never granted

-- 6.3 get_pageview_totals --------------------------------------------------------------------------------
-- Declares user_id uuid over a text column -> 42804 on every call (TEST). No caller on `test`
-- (only origin/main app/api/subscriptions/check/route.ts:25). Anon EXECUTE is exposure only.
drop function if exists public.get_pageview_totals(timestamp with time zone, timestamp with time zone);

-- 6.4 Validate the size ceilings added NOT VALID in migration 03 ------------------------------------------
alter table public.catalogues  validate constraint catalogues_content_size;
alter table public.user_themes validate constraint user_themes_colors_size;
alter table public.qr_configs  validate constraint qr_configs_config_size;
alter table public.users       validate constraint users_cookie_prefs_size;

-- 6.5 Make PostgREST drop the revoked objects from its schema cache now --------------------------------------
notify pgrst, 'reload schema';



-- MIGRATION 07_app_rls_login_role
-- -----------------------------------------------------------------------------------------------------
-- Phase 4 (M3). Fail-closed user pool. After this, DB_CONNECTION_STRING logs in as app_rls.<ref> (Supavisor 6543).
-- app_rls owns no privileges, so a query that forgets withUser/withPublic gets 42501 instead of running as
-- BYPASSRLS postgres. DATABASE_ADMIN_URL keeps postgres.<ref> for asAdmin.
-- Password: set once per project out of band (SQL editor): alter role app_rls with password '...';
-- never committed, no VALID UNTIL (an expired role surfaces as EAUTHQUERY at the pooler).
-- Whether Supavisor authenticates a custom login role on each project is (unverified); test on TEST first.
-- Rollback: point DB_CONNECTION_STRING back to postgres.<ref>; then the SQL in rls-design.md section 13.
-- -----------------------------------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_catalog.pg_roles where rolname = 'app_rls') then
    create role app_rls login noinherit nobypassrls nocreatedb nocreaterole connection limit 40;
  end if;
  if exists (select 1 from pg_catalog.pg_roles
              where rolname = 'app_rls' and (rolbypassrls or rolsuper or rolinherit or rolcreaterole)) then
    raise exception 'role app_rls exists with unsafe attributes';
  end if;
end $$;

grant app_user   to app_rls with inherit false, set true;
grant app_public to app_rls with inherit false, set true;

-- Backstops only (applied at login; the wrapper still sets per-transaction limits because SET ROLE does not
-- apply ALTER ROLE settings).
alter role app_rls set statement_timeout = '8s';
alter role app_rls set lock_timeout = '3s';
alter role app_rls set idle_in_transaction_session_timeout = '10s';

comment on role app_rls is
  'DB_CONNECTION_STRING login for user/visitor traffic. No own privileges; may only SET ROLE app_user/app_public.';



-- MIGRATION 08_auth_users_sync
-- -----------------------------------------------------------------------------------------------------
-- Phase 5 (M4). Supabase Auth build, sign-ups and anonymous sign-ins still DISABLED on the project.
-- Replaces the Clerk webhook (app/api/clerk/route.ts:19-151, lib/users/syncFromClerk.ts:94-195,
-- actions/users.ts:75-101) and the on-demand sync (lib/users/fetchUserData.ts:46-74).
-- RISK: a failing AFTER INSERT trigger on auth.users blocks EVERY sign-up ("Database error saving new user").
-- Gate: pgTAP 50_auth_triggers.test.sql plus a real local sign-up test. Whether supabase_auth_admin needs
-- anything extra to fire triggers whose functions live in `private` is (unverified) - the local sign-up test
-- settles it. postgres holds TRIGGER on auth.users (TEST ACL ar*wdDxtm).
-- Rollback: rls-design.md section 13, migration 08.
-- -----------------------------------------------------------------------------------------------------

-- 8.1 default_plan_id per project ------------------------------------------------------------------------
-- Seeded only if that plan exists in this project's plans table (Paddle sandbox vs live price ids may
-- differ - unverified; the app uses one constant in lib/users/syncFromClerk.ts:3, present on TEST).
-- If not seeded, handle_auth_user_created raises -> sign-ups fail loudly; set it before enabling sign-ups.
insert into private.settings (key, value)
select 'default_plan_id', p.id
  from public.plans p
 where p.id = 'pri_01k27ajepm199twd1x77rpwdrq'
on conflict (key) do nothing;

-- 8.2 Metadata normalisers (user_metadata is user-writable: only cosmetic fields, length-capped) --------------
create or replace function private.display_name_from_meta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  select pg_catalog.left(pg_catalog.btrim(coalesce(p_meta ->> 'full_name', p_meta ->> 'name', '')), 200)
$$;

create or replace function private.avatar_from_meta(p_meta jsonb)
returns text
language sql
immutable
set search_path = ''
as $$
  -- NB: no {m,n} repetition here - PostgreSQL caps regex repetition counts at 255 and raises 2201B
  -- ("invalid repetition count(s)") above that, which inside this trigger would block every sign-up
  -- (caught by a read-only probe on TEST).
  select case
           when v ~ '^https://\S+$' and pg_catalog.length(v) <= 2048 then v
           else null
         end
    from (select coalesce(p_meta ->> 'avatar_url', p_meta ->> 'picture') as v) s
$$;

-- 8.3 Row creation on sign-up ------------------------------------------------------------------------------
-- * id = auth.users.id::text (ownership columns stay text; policies unchanged - decision s.7).
-- * plan_id ONLY from private.settings, never from metadata.
-- * customer_id stays null (Paddle links it later via customData.user_id).
-- * consents: when the sign-up form sends options.data.consents, record exactly those three booleans;
--   otherwise fall back to the column default, which is what today's Clerk sync does (syncFromClerk.ts never
--   sets consents). Whether OAuth sign-ups should default to false is a legal/product decision.
-- * Imported Clerk users (app_metadata.clerk_user_id) are skipped: their row is remapped in M5, and a second
--   row here would collide with that remap.
-- * ON CONFLICT (id) DO NOTHING keeps the trigger idempotent (re-delivery, retries).
create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_meta     jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_plan     text;
  v_consents jsonb;
begin
  if coalesce(new.raw_app_meta_data, '{}'::jsonb) ? 'clerk_user_id' then
    return new;
  end if;
  if new.is_anonymous then
    return new;   -- anonymous sign-ins are disabled; identity.ts also rejects is_anonymous claims
  end if;

  select s.value into v_plan from private.settings s where s.key = 'default_plan_id';
  if v_plan is null then
    raise exception 'private.settings.default_plan_id is not set' using errcode = 'P0001';
  end if;

  if pg_catalog.jsonb_typeof(v_meta -> 'consents') = 'object' then
    v_consents := pg_catalog.jsonb_build_object(
      'refund-policy',        coalesce((v_meta -> 'consents' -> 'refund-policy')        = 'true'::jsonb, false),
      'privacy-policy',       coalesce((v_meta -> 'consents' -> 'privacy-policy')       = 'true'::jsonb, false),
      'terms-and-conditions', coalesce((v_meta -> 'consents' -> 'terms-and-conditions') = 'true'::jsonb, false));
    insert into public.users (id, email, name, image, plan_id, consents)
    values (new.id::text, pg_catalog.lower(new.email), private.display_name_from_meta(v_meta),
            private.avatar_from_meta(v_meta), v_plan, v_consents)
    on conflict (id) do nothing;
  else
    insert into public.users (id, email, name, image, plan_id)
    values (new.id::text, pg_catalog.lower(new.email), private.display_name_from_meta(v_meta),
            private.avatar_from_meta(v_meta), v_plan)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

-- 8.4 Email and cosmetic metadata sync --------------------------------------------------------------------
-- * email: GoTrue writes auth.users.email only after the change is confirmed; Paddle linking and Brevo need
--   public.users.email to follow it (utils/paddle/process-webhook.ts:220 matches on email today).
-- * name/image: copied only when the metadata-derived value changed AND public.users still holds the old
--   derived value, so an OAuth re-login never clobbers a name the user edited in-app (app_user UPDATE(name)).
create or replace function private.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_name text;
  v_new_name text;
  v_old_img  text;
  v_new_img  text;
begin
  if new.email is distinct from old.email and new.email is not null then
    update public.users u set email = pg_catalog.lower(new.email) where u.id = new.id::text;
  end if;

  if new.raw_user_meta_data is distinct from old.raw_user_meta_data then
    v_old_name := private.display_name_from_meta(coalesce(old.raw_user_meta_data, '{}'::jsonb));
    v_new_name := private.display_name_from_meta(coalesce(new.raw_user_meta_data, '{}'::jsonb));
    if v_new_name is distinct from v_old_name then
      update public.users u set name = v_new_name
       where u.id = new.id::text and u.name is not distinct from v_old_name;
    end if;

    v_old_img := private.avatar_from_meta(coalesce(old.raw_user_meta_data, '{}'::jsonb));
    v_new_img := private.avatar_from_meta(coalesce(new.raw_user_meta_data, '{}'::jsonb));
    if v_new_img is distinct from v_old_img then
      update public.users u set image = v_new_img
       where u.id = new.id::text and u.image is not distinct from v_old_img;
    end if;
  end if;
  return new;
end;
$$;

-- 8.5 Deletion ----------------------------------------------------------------------------------------------
-- actions/account.ts calls authAdmin().deleteUser(me.userId) (hard delete; never shouldSoftDelete, which sets
-- deleted_at without a DELETE and would not fire this). Deleting public.users cascades through every
-- ownership FK (all ON DELETE CASCADE, TEST) and through subscriptions via users.customer_id, so the Paddle
-- subscription must be cancelled BEFORE deleteUser. A text id cannot carry an FK to auth.users(id) (uuid),
-- hence a trigger instead of a cascade.
create or replace function private.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.users u where u.id = old.id::text;
  return old;
end;
$$;

alter function private.display_name_from_meta(jsonb)   owner to postgres;
alter function private.avatar_from_meta(jsonb)         owner to postgres;
alter function private.handle_auth_user_created()      owner to postgres;
alter function private.handle_auth_user_updated()      owner to postgres;
alter function private.handle_auth_user_deleted()      owner to postgres;
revoke all on function
  private.display_name_from_meta(jsonb),
  private.avatar_from_meta(jsonb),
  private.handle_auth_user_created(),
  private.handle_auth_user_updated(),
  private.handle_auth_user_deleted()
from public;

-- No DROP TRIGGER here: auth.users is owned by supabase_auth_admin and postgres is not a member (TEST), and
-- PostgreSQL requires table ownership to drop a trigger. postgres does hold TRIGGER (TEST), which is all
-- CREATE TRIGGER needs. TEST has no triggers on auth.users today. Consequence for rollback: disable these by
-- replacing the (postgres-owned) function bodies with no-ops, not by dropping the triggers
-- (rls-design.md section 13, migration 08).
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_auth_user_created();
create trigger on_auth_user_updated
  after update of email, raw_user_meta_data on auth.users
  for each row execute function private.handle_auth_user_updated();
create trigger on_auth_user_deleted
  after delete on auth.users
  for each row execute function private.handle_auth_user_deleted();



-- RUNBOOK remap-user-ids   (scripts/cutover/remap-user-ids.sql - NOT a migration)
-- -----------------------------------------------------------------------------------------------------
-- Phase 6 (M5). Operator machine only, MIGRATION_DATABASE_URL (session pooler 5432 or direct), inside the
-- maintenance window: worker cron paused, Clerk sign-ups frozen, final delta import done.
-- Refuse to run against PROD unless ALLOW_PROD=1 is set by the wrapper script.
-- -----------------------------------------------------------------------------------------------------

-- R1 (once, before the import script runs) - mapping table in a non-exposed schema with no grants.
create schema if not exists migration;
revoke all on schema migration from public;
create table if not exists migration.clerk_user_map (
  clerk_user_id     text primary key check (clerk_user_id ~ '^user_[A-Za-z0-9]+$'),
  supabase_user_id  uuid not null unique,
  status            text not null default 'pending'
                    check (status in ('pending', 'migrated', 'failed', 'skipped')),
  password_imported boolean not null default false,
  google_sub        text,
  note              text,
  updated_at        timestamptz not null default now()
);

-- R2 (the remap, one transaction)
begin;
set local lock_timeout = '5s';
set local statement_timeout = '5min';

do $$
begin
  -- A cascaded UPDATE of analytics.user_id would double counters if this trigger still exists (PROD unverified).
  if exists (select 1 from pg_catalog.pg_trigger
              where tgrelid = 'public.analytics'::regclass and tgname = 'analytics_upsert_trigger') then
    raise exception 'analytics_upsert_trigger exists; drop it before remapping';
  end if;
  if exists (select 1 from migration.clerk_user_map m join public.users u on u.id = m.supabase_user_id::text) then
    raise exception 'a target uuid is already present in public.users';
  end if;
  if exists (select 1 from migration.clerk_user_map m left join auth.users a on a.id = m.supabase_user_id
              where m.status = 'migrated' and a.id is null) then
    raise exception 'map says migrated but auth.users has no such id';
  end if;
end $$;

lock table public.users in share row exclusive mode;

-- Disable by NAME only (never DISABLE TRIGGER ALL, which also disables FK enforcement).
-- Touch triggers are disabled so the ON UPDATE CASCADE rewrite does not bump every updated_at.
alter table public.users       disable trigger "Brevo New Contact Webhook";
alter table public.catalogues  disable trigger catalogues_touch_updated_at;
alter table public.user_themes disable trigger user_themes_touch_updated_at;

-- users.id is referenced ON UPDATE CASCADE by catalogues.created_by, analytics.user_id, newsletter.owner_id,
-- ocr.user_id, prompts.user_id, user_themes.user_id (TEST), so children follow.
update public.users u
   set id = m.supabase_user_id::text
  from migration.clerk_user_map m
 where m.clerk_user_id = u.id
   and m.status = 'migrated';

alter table public.users       enable trigger "Brevo New Contact Webhook";
alter table public.catalogues  enable trigger catalogues_touch_updated_at;
alter table public.user_themes enable trigger user_themes_touch_updated_at;

-- Migrated auth users whose Clerk webhook never created a row (created here, AFTER Brevo is re-enabled so
-- Brevo learns about them).
insert into public.users (id, email, name, image, plan_id)
select a.id::text, pg_catalog.lower(a.email), private.display_name_from_meta(coalesce(a.raw_user_meta_data, '{}'::jsonb)),
       private.avatar_from_meta(coalesce(a.raw_user_meta_data, '{}'::jsonb)),
       (select s.value from private.settings s where s.key = 'default_plan_id')
  from migration.clerk_user_map m
  join auth.users a on a.id = m.supabase_user_id
 where m.status = 'migrated'
   and not exists (select 1 from public.users u where u.id = a.id::text);

do $$
declare
  n bigint;
begin
  select count(*) into n from public.users
   where id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  if n > 0 then
    raise exception '% public.users rows still hold non-uuid ids; resolve their map status before commit', n;
  end if;
end $$;
commit;
-- After commit (ops, not SQL): flush the Redis prefix, revalidate all tags, AUTH_PROVIDER=supabase,
-- redeploy, then apply migration 09.



-- MIGRATION 09_users_id_uuid_check
-- -----------------------------------------------------------------------------------------------------
-- Phase 6 (M5), immediately after the remap commits. Any stale Clerk id written back (open tab, old Redis
-- payload, forgotten webhook) now fails loudly: a users row cannot hold it, and child rows cannot reference
-- it through the FKs. Replaces the idea of converting columns to uuid (blocked by the contacts /
-- active_subscriptions views; decision s.16).
-- Delete supabase/tests/database/15_clerk_ids.test.sql in the same commit.
-- Rollback: alter table public.users drop constraint users_id_is_uuid;
-- -----------------------------------------------------------------------------------------------------
alter table public.users
  add constraint users_id_is_uuid
  check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');



-- MIGRATION 10_post_cutover_cleanup
-- -----------------------------------------------------------------------------------------------------
-- Phase 7. Apply only after the retention period agreed for the Clerk id map and the dedupe backups
-- (log/CRM correlation, support). Irreversible.
-- -----------------------------------------------------------------------------------------------------
drop table if exists private.backup_newsletter_dupes;
drop table if exists private.backup_product_newsletter_dupes;
drop table if exists private.backup_qr_configs_dupes;
drop table if exists private.backup_prompts_null_user;
drop table if exists private.backup_ocr_null_user;
drop schema if exists migration cascade;
