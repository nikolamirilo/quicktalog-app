-- Verified (PGlite, patch P4). After applying: set the password out of band, then switch DB_CONNECTION_STRING to
-- app_rls.<ref> on 6543. Whether Supavisor authenticates a custom login role on each project is (unverified);
-- test on TEST first. Rollback: DB_CONNECTION_STRING back to postgres.<ref>, then A.14.

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
-- PATCH P4: PUBLIC holds TEMP on the database (TEST datacl =Tc/postgres) and pg_temp is searched FIRST unless listed.
-- Drizzle emits unqualified table names, so a temp table planted on a pooled backend (via any SQL-injection
-- primitive) would shadow public.catalogues for the next tenant on that backend (PGlite run: forged read and a
-- captured INSERT). Listing pg_temp last makes unqualified names resolve to public. The TS wrapper should also
-- set it per transaction (set_config('search_path', 'public, pg_temp', true)) for the postgres-login phases 1-3.
alter role app_rls set search_path = public, pg_temp;

comment on role app_rls is
  'DB_CONNECTION_STRING login for user/visitor traffic. No own privileges; may only SET ROLE app_user/app_public.';
