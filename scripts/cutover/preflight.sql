\set ON_ERROR_STOP on
\timing off
\pset pager off

--
-- Cutover preflight (Appendix A.15, with the Phase 3/4 queries enabled).
--
-- Read-only. Run it on PROD at T-3 and again at T-0 step 8, and keep both
-- outputs: the T-0 run is the baseline that verify.sql V6 is compared against.
--
--   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 \
--        -f scripts/cutover/preflight.sql > preflight-t0.txt
--
-- The whole script runs inside a READ ONLY transaction, so it cannot write even
-- if someone edits a query into an UPDATE by accident. That also means no temp
-- tables: the two sections that depend on optional objects (vault, pg_cron, the
-- migration schema) are dispatched with \gexec instead.
--
-- It prints, and never decides. The go/no-go table at the end is the summary;
-- `pass = f` anywhere is a stop, and a null `pass` is a value to read by hand.
--

begin;
set transaction read only;
set local statement_timeout = '120s';
set local application_name = 'cutover:preflight';

\echo ''
\echo '=== 0. Where am I ========================================================='

select current_database()                          as database,
       current_user                                as run_as,
       current_setting('server_version')           as pg_version,
       pg_catalog.now()                            as ran_at;

\echo ''
\echo '--- migrations applied (the tail should match supabase/migrations/) ---'
select version from supabase_migrations.schema_migrations order by version desc limit 20;

\echo ''
\echo '=== 1. Perimeter =========================================================='

\echo '--- private roles (none before M01; app_user/app_public from M01, app_rls from M08) ---'
select rolname, rolcanlogin, rolbypassrls
  from pg_roles where rolname in ('app_user', 'app_public', 'app_rls') order by 1;

\echo '--- table grants to anon/authenticated in public (expect none after M00) ---'
select grantee, table_name,
       string_agg(privilege_type, '/' order by privilege_type) as privs
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated')
 group by 1, 2 order by 1, 2;

\echo '--- functions in public executable by anon/authenticated (expect none) ---'
select p.oid::regprocedure as function
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
   and (has_function_privilege('anon', p.oid, 'EXECUTE')
     or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
 order by 1;

\echo '--- default ACLs (R4: a supabase_admin default here re-grants on every new object) ---'
select defaclrole::regrole   as owner,
       defaclnamespace::regnamespace as schema,
       defaclobjtype         as objtype,
       defaclacl             as acl
  from pg_default_acl order by 1, 2;

\echo '--- RLS on every public table (expect t everywhere after M00) ---'
select c.relname as table, c.relrowsecurity as rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r'
 order by 1;

\echo ''
\echo '=== 2. Schema the re-key depends on ======================================='

\echo '--- constraints on the re-keyed tables (the six ON UPDATE CASCADE FKs, users_id_is_uuid) ---'
select conrelid::regclass as table, conname, contype, pg_get_constraintdef(oid) as definition
  from pg_constraint
 where conrelid in ('public.prompts'::regclass, 'public.ocr'::regclass,
                    'public.catalogues'::regclass, 'public.users'::regclass)
 order by 1, 2;

\echo '--- user triggers in public (R1 disables three of them; anything else is a surprise) ---'
-- CHANGE W5: filter by pg_namespace; regclass text omits "public." for tables on the search_path.
select t.tgrelid::regclass as table, t.tgname, t.tgenabled
  from pg_trigger t
  join pg_class c on c.oid = t.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where not t.tgisinternal and n.nspname = 'public'
 order by 1, 2;

\echo ''
\echo '=== 3. Data integrity ====================================================='

select status, count(*) from public.catalogues group by 1 order by 1;

select count(*) filter (where user_id is null) as prompts_null_user from public.prompts;
select count(*) filter (where user_id is null) as ocr_null_user     from public.ocr;

\echo '--- duplicates that a unique index would reject ---'
select catalogue_id, lower(email) as email, count(*)
  from public.newsletter group by 1, 2 having count(*) > 1 order by 3 desc;
select lower(email) as email, count(*)
  from public.product_newsletter group by 1 having count(*) > 1 order by 2 desc;
select catalogue, count(*)
  from public.qr_configs group by 1 having count(*) > 1 order by 2 desc;

\echo '--- newsletter rows whose owner is not the catalogue owner (forged ownerId) ---'
select count(*) as forged_newsletter_owner
  from public.newsletter n join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;

\echo '--- catalogue names outside the slug shape M03 enforces ---'
select name from public.catalogues
 where name !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(name) > 100 order by 1;

\echo '--- payload sizes against the M03 limits (CHANGE C2: raw bytes, not compressed) ---'
select max(octet_length(content::text))            as content_bytes,
       (select max(octet_length(colors::text))            from public.user_themes) as colors_bytes,
       (select max(octet_length(config::text))            from public.qr_configs)  as qr_config_bytes,
       (select max(octet_length(cookie_preferences::text)) from public.users)      as cookie_prefs_bytes
  from public.catalogues;

\echo '--- Clerk ids embedded in catalogue JSON (they survive the re-key and go stale) ---'
select count(*) as user_ids_in_jsonb from public.catalogues
 where content::text ~ 'user_[A-Za-z0-9]{10,}' or metadata::text ~ 'user_[A-Za-z0-9]{10,}';

\echo ''
\echo '=== 4. Users and billing =================================================='

select count(*)                                             as users,
       count(*) filter (where id like 'user\_%')            as clerk_ids,
       count(*) filter (where id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') as uuid_ids,
       count(*) filter (where email is null)                as null_email,
       count(*) filter (where customer_id is not null)      as with_customer
  from public.users;

\echo '--- duplicate emails (they block the import: one Supabase identity per address) ---'
select lower(email) as email, count(*) from public.users
 where email is not null group by 1 having count(*) > 1 order by 2 desc;

select exists (select 1 from public.plans where id = 'pri_01k27ajepm199twd1x77rpwdrq')
       as starter_plan_present;

\echo ''
\echo '=== 5. V6 baselines (verify.sql compares against these) ==================='

select (select count(*) from public.catalogues)                        as catalogues,
       (select coalesce(sum(pageview_count), 0) from public.analytics) as pageviews,
       (select count(*) from public.subscriptions)                     as subscriptions,
       (select count(*) from public.users where customer_id is not null) as users_with_customer,
       (select count(*) from auth.users)                               as auth_users;

\echo ''
\echo '=== 6. Platform objects ==================================================='

\echo '--- vault secret names (names only; never the values) ---'
select case when to_regclass('vault.secrets') is null
            then $g$select 'vault.secrets is not present on this project'::text as note$g$
            else $g$select name from vault.secrets order by 1$g$
       end \gexec

\echo '--- scheduled jobs ---'
select case when to_regclass('cron.job') is null
            then $g$select 'pg_cron is not installed on this project'::text as note$g$
            else $g$select jobname, schedule, command from cron.job order by 1$g$
       end \gexec

\echo ''
\echo '=== 7. Sessions that would block the re-key (T-0 step 8) =================='

\echo '--- idle in transaction on this database ---'
select pid, usename, application_name, state,
       pg_catalog.now() - xact_start as xact_age,
       left(query, 100) as last_query
  from pg_stat_activity
 where datname = current_database()
   and pid <> pg_backend_pid()
   and state in ('idle in transaction', 'idle in transaction (aborted)')
 order by xact_start;

\echo '--- sessions holding a lock on public.users (R1 takes ACCESS EXCLUSIVE) ---'
select distinct a.pid, a.usename, a.application_name, a.state, l.mode,
       left(a.query, 100) as last_query
  from pg_locks l join pg_stat_activity a on a.pid = l.pid
 where l.relation = 'public.users'::regclass and a.pid <> pg_backend_pid()
 order by 1;

\echo '(terminate with: select pg_terminate_backend(<pid>); — not from this script)'

\echo ''
\echo '=== 8. Cutover gates (Phase 3/4; needs M10) ==============================='

select case when to_regclass('migration.clerk_user_map') is null
  then $g$select 'migration.clerk_user_map is absent: M10 has not been applied, so the cutover gates cannot be evaluated'::text as note$g$
  else $g$
    select status, origin, count(*) from migration.clerk_user_map group by 1, 2 order by 1, 2
  $g$ end \gexec

select case when to_regclass('migration.clerk_user_map') is null
  then $g$select null::int where false$g$
  else $g$
    select 1 as n, 'G1  auth.users outside the map' as check,
           (select count(*) from auth.users a
             where not exists (select 1 from migration.clerk_user_map m
                                where m.supabase_user_id = a.id))::text as value,
           '0' as expected,
           not exists (select 1 from auth.users a
                        where not exists (select 1 from migration.clerk_user_map m
                                           where m.supabase_user_id = a.id)) as pass
    union all
    select 2, 'G2  paying users with no migrated map row',
           (select count(*) from public.users u
             where u.customer_id is not null
               and u.id like 'user\_%'
               and not exists (select 1 from migration.clerk_user_map m
                                where m.clerk_user_id = u.id and m.status = 'migrated'))::text,
           '0',
           not exists (select 1 from public.users u
                        where u.customer_id is not null
                          and u.id like 'user\_%'
                          and not exists (select 1 from migration.clerk_user_map m
                                           where m.clerk_user_id = u.id and m.status = 'migrated'))
    union all
    select 3, 'G3  map rows still claimed (never created)',
           (select count(*) from migration.clerk_user_map where status = 'claimed')::text,
           '0',
           not exists (select 1 from migration.clerk_user_map where status = 'claimed')
    order by 1
  $g$ end \gexec

\echo ''
\echo '=== 9. Go / no-go ========================================================='
\echo '(pass = f is a stop; a null pass is a number to read, not a gate)'

with
grants as (
  select count(*)::bigint as value from information_schema.role_table_grants
   where table_schema = 'public' and grantee in ('anon', 'authenticated')),
funcs as (
  select count(*)::bigint as value from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public'
     and (has_function_privilege('anon', p.oid, 'EXECUTE')
       or has_function_privilege('authenticated', p.oid, 'EXECUTE'))),
norls as (
  select count(*)::bigint as value from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity),
upsert as (
  select count(*)::bigint as value from pg_trigger
   where tgname = 'analytics_upsert_trigger' and not tgisinternal),
plan as (
  select count(*)::bigint as value from public.plans where id = 'pri_01k27ajepm199twd1x77rpwdrq'),
dupes as (
  select count(*)::bigint as value from (
    select 1 from public.users where email is not null
     group by lower(email) having count(*) > 1) d),
locks as (
  select count(distinct l.pid)::bigint as value
    from pg_locks l join pg_stat_activity a on a.pid = l.pid
   where l.relation = 'public.users'::regclass and a.pid <> pg_backend_pid()),
version as (
  select current_setting('server_version_num')::int as value)

select * from (
  select 1 as n, 'P1  server version >= 16' as check, (version.value / 10000)::text as value,
         '>= 16' as expected, version.value >= 160000 as pass from version
  union all
  select 2, 'P2  table grants to anon/authenticated in public', grants.value::text, '0',
         grants.value = 0 from grants
  union all
  select 3, 'P3  functions in public executable by anon/authenticated', funcs.value::text, '0',
         funcs.value = 0 from funcs
  union all
  select 4, 'P4  public tables without RLS', norls.value::text, '0', norls.value = 0 from norls
  union all
  select 5, 'P5  analytics_upsert_trigger present', upsert.value::text, '0',
         upsert.value = 0 from upsert
  union all
  select 6, 'P6  default plan row present', plan.value::text, '1', plan.value = 1 from plan
  union all
  select 7, 'P7  duplicate emails in public.users', dupes.value::text, '0',
         dupes.value = 0 from dupes
  union all
  select 8, 'P8  other sessions locking public.users', locks.value::text, '0 at T-0',
         locks.value = 0 from locks
  order by n) gates;

\echo ''
\echo '=== end of preflight ======================================================'

commit;
