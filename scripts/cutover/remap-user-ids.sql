-- Operator machine, MIGRATION_DATABASE_URL (session pooler 5432 or direct), inside the maintenance window:
-- maintenance on (writes and /api/paddle return 503), worker paused, Clerk frozen, delta import done.
-- The wrapper script refuses the PROD ref unless ALLOW_PROD=1.
-- CHANGE C12 and W9 (PGlite-verified, final run, run as a psql script).
\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local statement_timeout = '10min';
set local application_name = 'cutover:remap';

-- 1. CHANGE C12 + W9: strongest lock first, BEFORE the precondition reads (they would otherwise take ACCESS SHARE on
-- public.users and turn this into a lock upgrade, and a webhook could change a checked row before the lock).
lock table public.users in access exclusive mode;
lock table public.catalogues, public.analytics, public.newsletter, public.ocr, public.prompts, public.user_themes
  in share row exclusive mode;

-- 0. Preconditions
do $$
begin
  if exists (select 1 from pg_catalog.pg_trigger where tgname = 'analytics_upsert_trigger' and not tgisinternal) then
    raise exception 'analytics_upsert_trigger exists: a cascaded UPDATE would double analytics counters';
  end if;
  if exists (select 1 from auth.users a
              where not exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = a.id)) then
    raise exception 'auth.users has users outside the map (sign-ups not disabled? run purge-dark-test-users on TEST)';
  end if;
  if exists (select 1 from migration.clerk_user_map m join public.users u on u.id = m.supabase_user_id::text) then
    raise exception 'a target uuid is already present in public.users';
  end if;
  if exists (select 1 from migration.clerk_user_map m left join auth.users a on a.id = m.supabase_user_id
              where m.status = 'migrated' and a.id is null) then
    raise exception 'map rows marked migrated without an auth.users row';
  end if;
  if exists (select 1 from migration.clerk_user_map where status = 'claimed') then
    raise exception 'map rows still claimed: finish or classify them';
  end if;
  if not exists (select 1 from public.plans where id = (select s.value from private.settings s where s.key = 'default_plan_id')) then
    raise exception 'private.settings.default_plan_id is not a row in public.plans';
  end if;
  -- CHANGE C12: legacy rows stay un-updatable under the NOT VALID check, so no paying user may be left unmapped.
  if exists (select 1 from public.users u
              where u.customer_id is not null
                and not exists (select 1 from migration.clerk_user_map m where m.clerk_user_id = u.id and m.status = 'migrated')) then
    raise exception 'unmapped users with a Paddle customer_id: resolve them before the re-key';
  end if;
end $$;

-- 2. From here a stale Clerk id written back fails loudly. NOT VALID: accepted legacy orphans are validated at T+30 (M12).
alter table public.users add constraint users_id_is_uuid
  check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') not valid;

-- 3. Named triggers only. Never DISABLE TRIGGER ALL or session_replication_role (they skip the RI cascade triggers).
alter table public.users       disable trigger "Brevo New Contact Webhook";
alter table public.catalogues  disable trigger catalogues_touch_updated_at;
alter table public.user_themes disable trigger user_themes_touch_updated_at;

-- 4. Evidence for the assertions and verify.sql
drop table if exists migration.pre_remap_counts;
create table migration.pre_remap_counts as
select u.id as old_id, u.plan_id, u.customer_id,
       (select count(*) from public.catalogues  c where c.created_by = u.id) as catalogues,
       (select count(*) from public.analytics   a where a.user_id    = u.id) as analytics,
       (select coalesce(sum(a.pageview_count), 0) from public.analytics a where a.user_id = u.id) as pageviews,
       (select count(*) from public.newsletter  n where n.owner_id   = u.id) as newsletter,
       (select count(*) from public.ocr         o where o.user_id    = u.id) as ocr,
       (select count(*) from public.prompts     p where p.user_id    = u.id) as prompts,
       (select count(*) from public.user_themes t where t.user_id    = u.id) as themes
  from public.users u;

-- 5. Re-key; the 6 ownership FKs are ON UPDATE CASCADE (TEST). subscriptions link via customer_id and are untouched.
update public.users u
   set id = m.supabase_user_id::text
  from migration.clerk_user_map m
 where m.clerk_user_id = u.id
   and m.status = 'migrated';

-- 6. Profile fields gathered at import
update public.users u
   set email = pg_catalog.lower(a.email),
       image = case
                 when u.image ~* '^https://(img\.clerk\.com|images\.clerk\.dev)/'
                   then case when m.avatar_url ~ '^https://lh[0-9]+\.googleusercontent\.com/' then m.avatar_url end
                 else u.image
               end,
       cookie_preferences = case
                              when m.cookie_consent is not null
                               and (u.cookie_preferences is null
                                    or coalesce(m.cookie_consent ->> 'timestamp', '') > coalesce(u.cookie_preferences ->> 'timestamp', ''))
                                then m.cookie_consent
                              else u.cookie_preferences
                            end,
       welcome_email_sent_at = coalesce(u.welcome_email_sent_at, u.created_at, pg_catalog.now())
  from migration.clerk_user_map m
  join auth.users a on a.id = m.supabase_user_id
 where u.id = m.supabase_user_id::text;

-- 7. Migrated Clerk users that never had a public.users row (webhook gap). Consents take the M10 default -> gate.
insert into public.users (id, email, name, image, plan_id, cookie_preferences, welcome_email_sent_at)
select m.supabase_user_id::text,
       pg_catalog.lower(a.email),
       private.display_name_from_meta(coalesce(a.raw_user_meta_data, '{}'::jsonb)),
       case when m.avatar_url ~ '^https://lh[0-9]+\.googleusercontent\.com/' then m.avatar_url end,
       (select s.value from private.settings s where s.key = 'default_plan_id'),
       m.cookie_consent,
       pg_catalog.now()
  from migration.clerk_user_map m
  join auth.users a on a.id = m.supabase_user_id
 where m.status = 'migrated'
   and not exists (select 1 from public.users u where u.id = m.supabase_user_id::text);

-- 8. Re-enable exactly what step 3 disabled
alter table public.users       enable trigger "Brevo New Contact Webhook";
alter table public.catalogues  enable trigger catalogues_touch_updated_at;
alter table public.user_themes enable trigger user_themes_touch_updated_at;

-- 9. Nothing owned, billed or counted changed hands
do $$
begin
  if exists (
    select 1
      from migration.pre_remap_counts b
      join migration.clerk_user_map m on m.clerk_user_id = b.old_id and m.status = 'migrated'
      join public.users u on u.id = m.supabase_user_id::text
     where b.plan_id is distinct from u.plan_id
        or b.customer_id is distinct from u.customer_id
        or b.catalogues <> (select count(*) from public.catalogues  c where c.created_by = u.id)
        or b.analytics  <> (select count(*) from public.analytics   a where a.user_id    = u.id)
        or b.pageviews  <> (select coalesce(sum(a.pageview_count), 0) from public.analytics a where a.user_id = u.id)
        or b.newsletter <> (select count(*) from public.newsletter  n where n.owner_id   = u.id)
        or b.ocr        <> (select count(*) from public.ocr         o where o.user_id    = u.id)
        or b.prompts    <> (select count(*) from public.prompts     p where p.user_id    = u.id)
        or b.themes     <> (select count(*) from public.user_themes t where t.user_id    = u.id)
  ) then
    raise exception 'ownership, plan, customer or counters changed during re-key';
  end if;
end $$;

insert into migration.cutover_log (step, detail)
values ('remap', pg_catalog.jsonb_build_object(
  'uuid_users',        (select count(*) from public.users where id ~ '^[0-9a-f]{8}-'),
  'legacy_users_left', (select count(*) from public.users where id like 'user\_%')));
commit;
