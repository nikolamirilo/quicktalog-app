select current_setting('server_version') as pg_version;                                    -- must be >= 16
select version from supabase_migrations.schema_migrations order by version;
select rolname from pg_roles where rolname in ('app_user', 'app_public', 'app_rls');          -- expect none before M01
select grantee, table_name, string_agg(privilege_type, '/' order by privilege_type) as privs
  from information_schema.role_table_grants
 where table_schema = 'public' and grantee in ('anon', 'authenticated') group by 1, 2 order by 1, 2;
select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and (has_function_privilege('anon', p.oid, 'EXECUTE') or has_function_privilege('authenticated', p.oid, 'EXECUTE'));
select defaclrole::regrole, defaclnamespace::regnamespace, defaclobjtype, defaclacl from pg_default_acl order by 1, 2;
select c.relname, c.relrowsecurity from pg_class c join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public' and c.relkind = 'r' order by 1;
select conrelid::regclass, conname, contype, pg_get_constraintdef(oid) from pg_constraint
 where conrelid in ('public.prompts'::regclass, 'public.ocr'::regclass, 'public.catalogues'::regclass, 'public.users'::regclass) order by 1, 2;
-- CHANGE W5: filter by pg_namespace; regclass text omits "public." for tables on the search_path
select t.tgrelid::regclass, t.tgname, t.tgenabled from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
 where not t.tgisinternal and n.nspname = 'public' order by 1, 2;
select count(*) as analytics_upsert_trigger from pg_trigger where tgname = 'analytics_upsert_trigger' and not tgisinternal;
select status, count(*) from public.catalogues group by 1;
select count(*) filter (where user_id is null) as prompts_null_user from public.prompts;
select count(*) filter (where user_id is null) as ocr_null_user from public.ocr;
select catalogue_id, lower(email), count(*) from public.newsletter group by 1, 2 having count(*) > 1;
select lower(email), count(*) from public.product_newsletter group by 1 having count(*) > 1;
select catalogue, count(*) from public.qr_configs group by 1 having count(*) > 1;
select count(*) as forged_newsletter_owner from public.newsletter n join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;
-- CHANGE C2: raw sizes, not compressed
select max(octet_length(content::text)) as content_bytes from public.catalogues;
select max(octet_length(colors::text)) as colors_bytes from public.user_themes;
select max(octet_length(config::text)) as qr_config_bytes from public.qr_configs;
select max(octet_length(cookie_preferences::text)) as cookie_prefs_bytes from public.users;
select name from public.catalogues where name !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(name) > 100;
select count(*) as users, count(*) filter (where id like 'user\_%') as clerk_ids,
       count(*) filter (where email is null) as null_email, count(*) filter (where customer_id is not null) as with_customer
  from public.users;
select lower(email), count(*) from public.users group by 1 having count(*) > 1;
select exists (select 1 from public.plans where id = 'pri_01k27ajepm199twd1x77rpwdrq') as starter_plan_present;
select name from vault.secrets order by 1;                                                     -- names only
select jobname, schedule, command from cron.job;
select count(*) as auth_users from auth.users;
select count(*) as user_ids_in_jsonb from public.catalogues
 where content::text ~ 'user_[A-Za-z0-9]{10,}' or metadata::text ~ 'user_[A-Za-z0-9]{10,}';
-- Phase 3/4 additions once M10 exists:
-- select status, count(*) from migration.clerk_user_map group by 1;
-- select count(*) as unmapped_auth_users from auth.users a where not exists (select 1 from migration.clerk_user_map m where m.supabase_user_id = a.id);
-- select count(*) as unmapped_paying_users from public.users u where u.customer_id is not null
--   and not exists (select 1 from migration.clerk_user_map m where m.clerk_user_id = u.id and m.status = 'migrated');
