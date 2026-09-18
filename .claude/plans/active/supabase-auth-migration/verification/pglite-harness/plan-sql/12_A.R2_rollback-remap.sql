\set ON_ERROR_STOP on
begin;
set local lock_timeout = '5s';
set local application_name = 'cutover:rollback-remap';
lock table public.users in access exclusive mode;   -- W9: before the check
lock table public.catalogues, public.analytics, public.newsletter, public.ocr, public.prompts, public.user_themes
  in share row exclusive mode;

-- Supabase-only users must already have Clerk ids written into the map (origin rollback_push).
do $$
begin
  if exists (select 1 from public.users u
              where u.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
                and not exists (select 1 from migration.clerk_user_map m
                                 where m.supabase_user_id::text = u.id and m.status = 'migrated')) then
    raise exception 'uuid users without a Clerk id: run push-supabase-users-to-clerk.ts first';
  end if;
end $$;

alter table public.users drop constraint if exists users_id_is_uuid;
alter table public.users       disable trigger "Brevo New Contact Webhook";
alter table public.catalogues  disable trigger catalogues_touch_updated_at;
alter table public.user_themes disable trigger user_themes_touch_updated_at;

update public.users u
   set id = m.clerk_user_id
  from migration.clerk_user_map m
 where u.id = m.supabase_user_id::text
   and m.status = 'migrated';

alter table public.users       enable trigger "Brevo New Contact Webhook";
alter table public.catalogues  enable trigger catalogues_touch_updated_at;
alter table public.user_themes enable trigger user_themes_touch_updated_at;

insert into migration.cutover_log (step, detail)
values ('rollback-remap', pg_catalog.jsonb_build_object(
  'uuid_left', (select count(*) from public.users where id ~ '^[0-9a-f]{8}-')));
commit;
-- auth.users rows stay (dormant under Clerk). A re-cutover maps rollback_push users back through the same map.
-- After a rollback, M11 is recorded as applied but the constraint is gone; the next re-key adds it again.
