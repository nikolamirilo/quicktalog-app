-- Verified (PGlite) minus section 4.8 (PATCH P1 legacy anon policies, not needed after M00) plus CHANGE C5
-- (PGlite-verified, final run).
-- Grant rules: INSERT table-level (Drizzle lists every column and emits `default`,
-- node_modules/drizzle-orm/pg-core/dialect.js:356-392) with a pin trigger; UPDATE column-level; app_public
-- SELECT on catalogues without created_by; one permissive policy per role and command, always TO an app role.

-- 4.0 CHANGE C5: refuse to create owner policies unless the perimeter is closed and RLS is on everywhere.
-- This makes the cross-tenant window found by PGlite (policies inert while withUser code runs) impossible.
do $$
declare
  v_bad text;
begin
  select pg_catalog.string_agg(c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;
  if v_bad is not null then
    raise exception 'M04: apply M00_perimeter_close first (RLS off on: %)', v_bad;
  end if;
  select pg_catalog.string_agg(r.rolname || ':' || c.relname, ', ') into v_bad
    from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    cross join (values ('anon'), ('authenticated')) r(rolname)
   where n.nspname = 'public' and c.relkind in ('r', 'p', 'v', 'm')
     and (pg_catalog.has_table_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,DELETE')
          or pg_catalog.has_any_column_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE'));
  if v_bad is not null then
    raise exception 'M04: apply M00_perimeter_close first (anon/authenticated privileges on: %)', v_bad;
  end if;
end $$;

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
