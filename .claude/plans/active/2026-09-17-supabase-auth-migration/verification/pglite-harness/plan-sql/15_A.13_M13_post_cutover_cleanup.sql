drop table if exists private.backup_newsletter_dupes;
drop table if exists private.backup_product_newsletter_dupes;
drop table if exists private.backup_qr_configs_dupes;
drop table if exists private.backup_prompts_null_user;
drop table if exists private.backup_ocr_null_user;
drop table if exists private.backup_newsletter_forged_owner;
drop table if exists migration.pre_remap_counts;
-- CHANGE W3: the M10 delete trigger inserts into migration.auth_user_deletions; replace its body first, or every
-- auth.admin.deleteUser fails with 42P01 after this migration.
create or replace function private.handle_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update migration.clerk_user_map m set status = 'deleted', updated_at = pg_catalog.now()
   where m.supabase_user_id = old.id and m.status <> 'deleted';
  delete from public.users u where u.id = old.id::text;
  return old;
end;
$$;
drop table if exists migration.auth_user_deletions;
-- Keep migration.clerk_user_map permanently, minimised (signed legacy Paddle ids, support); export cutover_log first.
update migration.clerk_user_map
   set email = null, avatar_url = null, cookie_consent = null, google_sub = null, password_hasher = null,
       detail = null, clerk_last_sign_in_at = null, updated_at = now();
drop table if exists migration.cutover_log;
