-- M04 (RLS stays on: M00 owns that):
drop trigger if exists catalogues_pin_insert        on public.catalogues;
drop trigger if exists catalogues_touch_updated_at  on public.catalogues;
drop trigger if exists qr_configs_touch_updated_at  on public.qr_configs;
drop trigger if exists user_themes_touch_updated_at on public.user_themes;
drop function if exists private.catalogues_pin_insert();
drop function if exists private.touch_updated_at();
drop policy if exists users_select_self        on public.users;
drop policy if exists users_update_self        on public.users;
drop policy if exists catalogues_select_owner  on public.catalogues;
drop policy if exists catalogues_insert_owner  on public.catalogues;
drop policy if exists catalogues_update_owner  on public.catalogues;
drop policy if exists catalogues_delete_owner  on public.catalogues;
drop policy if exists catalogues_select_public on public.catalogues;
drop policy if exists qr_configs_owner         on public.qr_configs;
drop policy if exists user_themes_owner        on public.user_themes;
drop policy if exists analytics_select_owner   on public.analytics;
drop policy if exists prompts_select_owner     on public.prompts;
drop policy if exists ocr_select_owner         on public.ocr;
drop policy if exists newsletter_select_owner  on public.newsletter;
revoke all on public.users, public.catalogues, public.qr_configs, public.user_themes,
              public.analytics, public.prompts, public.ocr, public.newsletter
  from app_user, app_public;
