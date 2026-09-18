-- M03: the ledger defects (UNIQUE(catalogue), ON DELETE CASCADE, nullable user_id) are NOT restored.
alter table public.catalogues  drop constraint if exists catalogues_status_check;
alter table public.catalogues  drop constraint if exists catalogues_content_size;
alter table public.user_themes drop constraint if exists user_themes_colors_size;
alter table public.qr_configs  drop constraint if exists qr_configs_config_size;
alter table public.users       drop constraint if exists users_cookie_prefs_size;
-- Restore deduped or forged rows only if they are really wanted back:
-- insert into public.newsletter select * from private.backup_newsletter_dupes;   (drop newsletter_catalogue_email_key first)
-- insert into public.newsletter select * from private.backup_newsletter_forged_owner;
