-- CHANGE C1 (PGlite-verified, final run): statements from verified migration 06 of the SQL draft (sections 6.1-6.3, 6.5), now applied BEFORE M01.
-- The temporary legacy anon policies of PATCH P1 are not needed with this order: RLS is on and anon holds no
-- grants before any app_user policy or withUser code exists.
-- Gate: Phase 0A code live 24h in this environment; no app /rest/v1 traffic in API logs; PROD: test merged
-- into main, edge functions checked for anon-key use, exposure audit saved.
-- postgres (Drizzle today) and service_role (worker) bypass RLS. No policies are created: RLS on + zero grants = deny.
-- Rollback: A.14 (re-grant one privilege plus a temporary permissive anon policy; never disable RLS).

alter table public.users              enable row level security;
alter table public.catalogues         enable row level security;
alter table public.analytics          enable row level security;
alter table public.newsletter         enable row level security;
alter table public.subscriptions      enable row level security;
alter table public.job_logs           enable row level security;
alter table public.prompts            enable row level security;
alter table public.ocr                enable row level security;
alter table public.qr_configs         enable row level security;
alter table public.user_themes        enable row level security;
alter table public.product_newsletter enable row level security;
alter table public.plans              enable row level security;

-- Stale grants from 20260912093000_lockdown_privileges_and_schema_fixes.sql:57-119 (views included).
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
-- CHANGE C1: PROD may still carry default privileges granting anon/authenticated on new objects.
alter default privileges for role postgres in schema public revoke all on tables    from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- Declares user_id uuid over a text column: 42804 on every call (TEST). No caller on `test`.
drop function if exists public.get_pageview_totals(timestamp with time zone, timestamp with time zone);

-- CHANGE C1: fail the migration instead of leaving a hole (e.g. a PROD function with a PUBLIC EXECUTE grant).
do $$
declare
  v_bad text;
begin
  select pg_catalog.string_agg(c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
  if v_bad is not null then
    raise exception 'M00: RLS is still off on: %', v_bad;
  end if;

  select pg_catalog.string_agg(r.rolname || ':' || c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
   where n.nspname = 'public'
     and (   (c.relkind in ('r', 'p', 'v', 'm', 'f')
              and (pg_catalog.has_table_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
                   or pg_catalog.has_any_column_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')))
          or (c.relkind = 'S' and pg_catalog.has_sequence_privilege(r.rolname, c.oid, 'USAGE,SELECT,UPDATE')));
  if v_bad is not null then
    raise exception 'M00: anon/authenticated still hold privileges on: %', v_bad;
  end if;

  select pg_catalog.string_agg(r.rolname || ':' || p.oid::regprocedure::text, ', ') into v_bad
    from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
   where n.nspname = 'public' and pg_catalog.has_function_privilege(r.rolname, p.oid, 'EXECUTE');
  if v_bad is not null then
    raise exception 'M00: functions in public are still executable by anon/authenticated (PUBLIC grant?): %. Revoke EXECUTE from PUBLIC for each, grant it back to postgres/service_role explicitly, then re-run.', v_bad;
  end if;
end $$;

notify pgrst, 'reload schema';
