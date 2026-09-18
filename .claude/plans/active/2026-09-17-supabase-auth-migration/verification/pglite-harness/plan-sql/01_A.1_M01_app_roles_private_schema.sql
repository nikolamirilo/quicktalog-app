-- Verified (PGlite, patches P2 and P3). Additive; nothing that runs today changes behaviour.

-- 1.1 Private application roles. NOLOGIN NOINHERIT NOBYPASSRLS; never granted to authenticator (TEST:
-- authenticator is a member of anon/authenticated/service_role only). A CREATEROLE non-superuser that creates
-- a role gets ADMIN OPTION; createrole_self_grant='set' makes the implicit grant SET TRUE / INHERIT FALSE.
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
    if exists (select 1 from pg_catalog.pg_roles
                where rolname = r and (rolcanlogin or rolbypassrls or rolsuper or rolinherit or rolcreaterole)) then
      raise exception 'role % already exists with unsafe attributes; refusing to continue', r;
    end if;
    if not pg_catalog.pg_has_role('postgres', r, 'SET') then
      -- PATCH P2: PG16+ GRANT needs ADMIN OPTION; fail with the fix instead of a bare 42501.
      if not (select rolsuper from pg_catalog.pg_roles where rolname = current_user)
         and not pg_catalog.pg_has_role(current_user, r, 'USAGE WITH ADMIN OPTION') then
        raise exception 'role % exists but % has no ADMIN OPTION on it; ask a superuser (Supabase support) to run: grant % to postgres with inherit false, set true', r, current_user, r
          using errcode = '42501';
      end if;
      execute pg_catalog.format('grant %I to postgres with inherit false, set true', r);
    end if;
  end loop;
end $$;

comment on role app_user is
  'Signed-in owner traffic. Reached only by SET ROLE inside utils/db/rls.ts withUser(). Never grant to authenticator.';
comment on role app_public is
  'Visitor/ISR/public-signup traffic. Reached only by SET ROLE inside utils/db/rls.ts withPublic(). Never grant to authenticator.';

-- 1.2 Private schema (not exposed through the Data API; anon/authenticated get no USAGE)
create schema if not exists private;
alter schema private owner to postgres;   -- PATCH P3
revoke all on schema private from public;
grant usage on schema private to app_user, app_public;
comment on schema private is
  'Not exposed via the Data API. Helpers for app_user/app_public and admin-only tables. No anon/authenticated access.';

-- Global form (no IN SCHEMA): TEST has no global default ACL entry for postgres functions, and a per-schema
-- entry cannot remove the hard-wired PUBLIC EXECUTE. Every function below also revokes explicitly.
alter default privileges for role postgres revoke execute on functions from public;

-- 1.3 Identity helper: the verified subject set by withUser(); NULL when unset, so owner policies match nothing.
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

-- 1.4 Per-project settings read only by postgres-owned SECURITY DEFINER functions
create table if not exists private.settings (
  key        text primary key check (key ~ '^[a-z][a-z0-9_]{1,62}$'),
  value      text not null,
  updated_at timestamptz not null default now()
);
alter table private.settings owner to postgres;   -- PATCH P3
revoke all on table private.settings from public;
