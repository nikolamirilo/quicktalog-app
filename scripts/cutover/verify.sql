-- scripts/cutover/verify.sql — V1-V12 from PLAN section 6.7, runbook step 11.
--
--   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/cutover/verify.sql > verify-t0.txt
--
-- Read-only: it writes nothing, takes no lock beyond ACCESS SHARE, and can be
-- re-run as often as you like (12.4 loops V2/V3 for the first four hours).
-- Every row carries `pass`. The run is a go only when no row says `f` and no
-- row is null (null = could not be judged here).
--
-- Optional psql variables:
--   -v accepted_orphans=N   legacy `user_%` rows deliberately kept (V1, V5)
\set ON_ERROR_STOP on
\pset pager off

\if :{?accepted_orphans}
\else
  \set accepted_orphans 0
\endif

-- Preconditions, so a missing table gives an answer instead of a parse error.
do $$
begin
  if to_regclass('migration.clerk_user_map') is null then
    raise exception 'migration.clerk_user_map is missing: M10 has not been applied to this project';
  end if;
  if to_regclass('migration.pre_remap_counts') is null then
    raise exception 'migration.pre_remap_counts is missing: run remap-user-ids.sql (runbook step 9) first';
  end if;
  if to_regclass('migration.t0_password_digests') is null then
    raise exception 'migration.t0_password_digests is missing: V12 needs the fingerprints written by migrate-clerk-to-supabase.ts';
  end if;
end $$;

\echo ''
\echo '=== V1-V10, V12 ==========================================================='

with
uuid_re as (select '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' as re),

-- V1: legacy Clerk-id rows left behind.
v1 as (
  select count(*)::bigint as value from public.users where id like 'user\_%'
),

-- V2: a uuid row in public.users with no auth.users row would be unreachable.
v2 as (
  select count(*)::bigint as value
    from public.users u, uuid_re
   where u.id ~ uuid_re.re
     and not exists (select 1 from auth.users a where a.id::text = u.id)
),

-- V3: a confirmed auth user with no public row cannot use the app. W1 creates
-- the row at confirmation, so unconfirmed sign-ups are expected to have none.
v3 as (
  select count(*)::bigint as value
    from auth.users a
   where (a.email_confirmed_at is not null or a.phone_confirmed_at is not null)
     and coalesce(a.is_anonymous, false) = false
     and a.deleted_at is null
     and not exists (select 1 from public.users u where u.id = a.id::text)
),

-- V4: the profile email must match the identity email.
v4 as (
  select count(*)::bigint as value
    from migration.clerk_user_map m
    join auth.users   a on a.id = m.supabase_user_id
    join public.users u on u.id = m.supabase_user_id::text
   where m.status = 'migrated'
     and u.email is distinct from pg_catalog.lower(a.email)
),

-- V5: child rows still pointing at a Clerk id.
v5 as (
  select (
      (select count(*) from public.catalogues  where created_by like 'user\_%') +
      (select count(*) from public.analytics   where user_id    like 'user\_%') +
      (select count(*) from public.newsletter  where owner_id   like 'user\_%') +
      (select count(*) from public.ocr         where user_id    like 'user\_%') +
      (select count(*) from public.prompts     where user_id    like 'user\_%') +
      (select count(*) from public.user_themes where user_id    like 'user\_%')
    )::bigint as value
),

-- V6: totals against the pre-re-key snapshot R1 took under the lock.
v6 as (
  select
    (select count(*) from public.catalogues)::bigint as catalogues_now,
    (select coalesce(sum(catalogues), 0) from migration.pre_remap_counts)::bigint as catalogues_before,
    (select coalesce(sum(pageview_count), 0) from public.analytics)::bigint as pageviews_now,
    (select coalesce(sum(pageviews), 0) from migration.pre_remap_counts)::bigint as pageviews_before,
    (select count(*) from public.users where customer_id is not null)::bigint as billed_now,
    (select count(*) from migration.pre_remap_counts where customer_id is not null)::bigint as billed_before,
    (select count(*) from public.subscriptions)::bigint as subscriptions_now
),

-- V7: a migrated user must not keep a Clerk-hosted avatar; the proxy dies with
-- the Clerk instance at T+30.
v7 as (
  select count(*)::bigint as value
    from migration.clerk_user_map m
    join public.users u on u.id = m.supabase_user_id::text
   where m.status = 'migrated'
     and u.image ~* '^https://(img\.clerk\.com|images\.clerk\.dev)/'
),

-- V8: nobody should have edited a catalogue during the window.
v8 as (
  select count(*)::bigint as value
    from public.catalogues
   where updated_at > pg_catalog.now() - interval '30 minutes'
),

-- V9: the three triggers R1 disabled must be enabled again ('O' = origin).
v9 as (
  select count(*)::bigint as value
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
   where not t.tgisinternal
     and (c.relname, t.tgname) in (
       ('users',       'Brevo New Contact Webhook'),
       ('catalogues',  'catalogues_touch_updated_at'),
       ('user_themes', 'user_themes_touch_updated_at'))
     and t.tgenabled = 'O'
),

-- V10: users_id_is_uuid exists and stays NOT VALID until M12 at T+30.
v10 as (
  select count(*)::bigint as present, bool_or(con.convalidated) as validated
    from pg_catalog.pg_constraint con
   where con.conname = 'users_id_is_uuid'
),

-- V12: every imported digest still equals the T-0 CSV digest. The comparison
-- runs on sha256 fingerprints recorded by migrate-clerk-to-supabase.ts, so no
-- digest is stored here, read back or printed. Go/no-go before sign-ups open.
v12 as (
  select
    (select count(*) from migration.clerk_user_map where password_imported)::bigint as expected,
    (select count(*)
       from migration.clerk_user_map m
       join migration.t0_password_digests d on d.supabase_user_id = m.supabase_user_id
       join auth.users a on a.id = m.supabase_user_id
      where m.password_imported
        and a.encrypted_password is not null
        and pg_catalog.encode(
              pg_catalog.sha256(pg_catalog.convert_to(a.encrypted_password, 'UTF8')), 'hex')
            = d.digest_sha256)::bigint as matching
)

select * from (
  select 1 as n, 'V1  legacy user_% rows in public.users' as check,
         v1.value::text as value, :accepted_orphans::text as expected,
         (v1.value = :accepted_orphans) as pass from v1
  union all
  select 2, 'V2  uuid users without an auth.users row', v2.value::text, '0', v2.value = 0 from v2
  union all
  select 3, 'V3  confirmed auth users without a public row', v3.value::text, '0', v3.value = 0 from v3
  union all
  select 4, 'V4  mapped users whose email differs from auth', v4.value::text, '0', v4.value = 0 from v4
  union all
  select 5, 'V5  child rows still owned by user_% ids', v5.value::text,
         case when :accepted_orphans = 0 then '0' else 'orphan-owned only' end,
         case when :accepted_orphans = 0 then v5.value = 0 else null end from v5
  union all
  select 6, 'V6a catalogues total vs pre-re-key snapshot',
         format('%s vs %s', catalogues_now, catalogues_before), 'equal',
         catalogues_now = catalogues_before from v6
  union all
  select 7, 'V6b pageviews total vs pre-re-key snapshot',
         format('%s vs %s', pageviews_now, pageviews_before), 'equal',
         pageviews_now = pageviews_before from v6
  union all
  select 8, 'V6c users with a customer_id vs snapshot',
         format('%s vs %s', billed_now, billed_before), 'equal',
         billed_now = billed_before from v6
  union all
  select 9, 'V6d subscriptions (compare with preflight-t0.txt by hand)',
         subscriptions_now::text, 'unchanged', null::boolean from v6
  union all
  select 10, 'V7  mapped users with a clerk.com image', v7.value::text, '0', v7.value = 0 from v7
  union all
  select 11, 'V8  catalogues updated in the last 30 minutes', v8.value::text, '~0', v8.value = 0 from v8
  union all
  select 12, 'V9  the three disabled triggers are enabled', v9.value::text, '3', v9.value = 3 from v9
  union all
  select 13, 'V10 users_id_is_uuid present and NOT VALID',
         format('present=%s validated=%s', present, coalesce(validated, false)),
         'present=1 validated=false', present = 1 and validated is not true from v10
  union all
  select 14, 'V12 imported digests equal the T-0 CSV digests',
         format('%s of %s', matching, expected), 'all', matching = expected from v12
) checks order by n;

\echo ''
\echo '=== V11 (RLS read as a migrated user; rolled back) ========================'

-- V11 switches role, so the target is resolved first (app_user cannot read a
-- temp table owned by postgres) and the whole check is rolled back.
-- The target is the migrated user with the most catalogues: the one whose loss
-- would be the most obvious.
select coalesce((select m.supabase_user_id::text
                   from migration.pre_remap_counts b
                   join migration.clerk_user_map m
                     on m.clerk_user_id = b.old_id and m.status = 'migrated'
                  where b.catalogues > 0
                  order by b.catalogues desc, m.clerk_user_id
                  limit 1), '') as v11_uuid,
       coalesce((select b.catalogues
                   from migration.pre_remap_counts b
                   join migration.clerk_user_map m
                     on m.clerk_user_id = b.old_id and m.status = 'migrated'
                  where b.catalogues > 0
                  order by b.catalogues desc, m.clerk_user_id
                  limit 1), -1) as v11_expected
\gset

begin;
set local statement_timeout = '15s';
select pg_catalog.set_config(
  'request.jwt.claims',
  pg_catalog.jsonb_build_object('sub', :'v11_uuid', 'role', 'app_user')::text,
  true) as claims_set;
set local role app_user;

select 'V11 catalogues visible to a migrated user' as check,
       (select count(*) from public.catalogues)::text as value,
       :'v11_expected' as expected,
       case when :'v11_uuid' = '' then null
            else (select count(*) from public.catalogues) = :v11_expected end as pass;

rollback;

\echo ''
\echo '=== map status breakdown (context, not a check) ==========================='
select status, origin, count(*) from migration.clerk_user_map group by 1, 2 order by 1, 2;
