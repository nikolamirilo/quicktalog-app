-- 00_perimeter.test.sql
--
-- Asserts the perimeter created by:
--   M00 supabase/migrations/20260917133921_perimeter_close.sql
--   M01 supabase/migrations/20260921181101_app_roles_private_schema.sql
--
-- Run with `supabase test db` against the local stack (never TEST/PROD).
-- Everything below runs inside one transaction that is rolled back at the end.

create extension if not exists pgtap with schema extensions;

begin;

-- PGlite finding F10: the app roles cannot reach the pgTAP helper functions
-- unless they get USAGE on `extensions` *and* EXECUTE on its functions.
-- Granted inside the transaction so it is rolled back with everything else.
grant usage on schema extensions to app_user, app_public;
grant execute on all functions in schema extensions to app_user, app_public;

select plan(16);

-- ---------------------------------------------------------------------------
-- RLS on every table in public (M00:12-23, re-checked by M00:42-47)
-- ---------------------------------------------------------------------------

select is_empty(
  $q$
    select c.relname::text
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and not c.relrowsecurity
  $q$,
  'no base table in schema public has row level security disabled'
);

select set_eq(
  $q$
    select c.relname::text
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and c.relrowsecurity
  $q$,
  $q$
    values ('users'), ('catalogues'), ('analytics'), ('newsletter'),
           ('subscriptions'), ('job_logs'), ('prompts'), ('ocr'),
           ('qr_configs'), ('user_themes'), ('product_newsletter'), ('plans')
  $q$,
  'RLS is enabled on exactly the 12 public tables listed in M00'
);

-- ---------------------------------------------------------------------------
-- anon / authenticated hold nothing in public (M00:26-32, re-checked M00:49-67)
-- ---------------------------------------------------------------------------

select is_empty(
  $q$
    select r.rolname || ':' || c.relname
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join (values ('anon'), ('authenticated')) r(rolname)
     where n.nspname = 'public'
       and c.relkind in ('r', 'p', 'v', 'm', 'f')
       and (pg_catalog.has_table_privilege(r.rolname, c.oid,
              'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
            or pg_catalog.has_any_column_privilege(r.rolname, c.oid,
              'SELECT,INSERT,UPDATE,REFERENCES'))
  $q$,
  'anon and authenticated hold no table or column privileges in public'
);

select is_empty(
  $q$
    select r.rolname || ':' || c.relname
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
      cross join (values ('anon'), ('authenticated')) r(rolname)
     where n.nspname = 'public'
       and c.relkind = 'S'
       and pg_catalog.has_sequence_privilege(r.rolname, c.oid, 'USAGE,SELECT,UPDATE')
  $q$,
  'anon and authenticated hold no sequence privileges in public'
);

select is_empty(
  $q$
    select r.rolname || ':' || p.oid::regprocedure::text
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
      cross join (values ('anon'), ('authenticated')) r(rolname)
     where n.nspname = 'public'
       and pg_catalog.has_function_privilege(r.rolname, p.oid, 'EXECUTE')
  $q$,
  'anon and authenticated can execute no function in public'
);

-- M00:30-32: default privileges must not hand new objects back to anon or
-- authenticated. Scoped to the roles a migration can actually change:
-- `postgres` (which every migration runs as) and the app roles.
--
-- `supabase_admin` keeps its own default ACLs, which DO grant anon and
-- authenticated on anything it creates here, and no migration can revoke them:
-- on TEST, `postgres` is neither a superuser nor a member of `supabase_admin`.
-- The next assertion covers that risk from the other side instead.
select is_empty(
  $q$
    select pg_catalog.pg_get_userbyid(d.defaclrole) || ':' || r.rolname
           || ':' || d.defaclobjtype::text
      from pg_catalog.pg_default_acl d
      join pg_catalog.pg_namespace n on n.oid = d.defaclnamespace
      cross join lateral pg_catalog.aclexplode(d.defaclacl) a
      join pg_catalog.pg_roles r on r.oid = a.grantee
     where n.nspname = 'public'
       and r.rolname in ('anon', 'authenticated')
       and pg_catalog.pg_get_userbyid(d.defaclrole) <> 'supabase_admin'
  $q$,
  'no default privileges owned by postgres in public grant anything to anon or authenticated'
);

-- The `supabase_admin` default ACLs only bite once that role owns something in
-- `public`. Nothing does today, and an object appearing here (an extension
-- installed into `public`, a dashboard action) would be handed to anon with
-- full privileges, so this is the drift check for it.
select is_empty(
  $q$
    select c.relkind::text || ':' || c.relname::text
      from pg_catalog.pg_class c
      join pg_catalog.pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p', 'v', 'm', 'S', 'f')
       and pg_catalog.pg_get_userbyid(c.relowner) = 'supabase_admin'
    union all
    select 'function:' || p.oid::regprocedure::text
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and pg_catalog.pg_get_userbyid(p.proowner) = 'supabase_admin'
  $q$,
  'nothing in public is owned by supabase_admin, whose default privileges would grant anon'
);

-- ---------------------------------------------------------------------------
-- The private application roles (M01:8-16, M01:25-27)
-- ---------------------------------------------------------------------------

select ok(
  exists (select 1 from pg_catalog.pg_roles where rolname = 'app_user'),
  'role app_user exists'
);

select results_eq(
  $q$
    select rolcanlogin, rolinherit, rolbypassrls
      from pg_catalog.pg_roles
     where rolname = 'app_user'
  $q$,
  $q$ values (false, false, false) $q$,
  'app_user is NOLOGIN, NOINHERIT and NOBYPASSRLS'
);

select ok(
  exists (select 1 from pg_catalog.pg_roles where rolname = 'app_public'),
  'role app_public exists'
);

select results_eq(
  $q$
    select rolcanlogin, rolinherit, rolbypassrls
      from pg_catalog.pg_roles
     where rolname = 'app_public'
  $q$,
  $q$ values (false, false, false) $q$,
  'app_public is NOLOGIN, NOINHERIT and NOBYPASSRLS'
);

-- M01:3-4 and M01:41-44: the app roles are never reachable from the PostgREST
-- login role, so no bearer token can ever land on them.
select is(
  pg_catalog.pg_has_role('authenticator', 'app_user', 'MEMBER'),
  false,
  'authenticator is not a member of app_user'
);

select is(
  pg_catalog.pg_has_role('authenticator', 'app_public', 'MEMBER'),
  false,
  'authenticator is not a member of app_public'
);

-- ---------------------------------------------------------------------------
-- Schema private is not exposed (M01:47-52)
-- ---------------------------------------------------------------------------

select is_empty(
  $q$
    select a.privilege_type
      from pg_catalog.pg_namespace n,
           lateral pg_catalog.aclexplode(n.nspacl) a
     where n.nspname = 'private'
       and a.grantee = 0
  $q$,
  'schema private grants nothing to PUBLIC'
);

select is_empty(
  $q$
    select r.rolname
      from pg_catalog.pg_namespace n
      cross join (values ('anon'), ('authenticated')) r(rolname)
     where n.nspname = 'private'
       and exists (select 1 from pg_catalog.pg_roles pr where pr.rolname = r.rolname)
       and pg_catalog.has_schema_privilege(r.rolname, n.oid, 'USAGE, CREATE')
  $q$,
  'anon and authenticated have no access to schema private'
);

-- ---------------------------------------------------------------------------
-- The broken helper is gone (M00:35)
-- ---------------------------------------------------------------------------

select is_empty(
  $q$
    select p.oid::regprocedure::text
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'get_pageview_totals'
  $q$,
  'public.get_pageview_totals no longer exists'
);

select * from finish();

rollback;
