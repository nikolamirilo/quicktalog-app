-- M13 (plan A.13): drop the cutover scaffolding once the retention period agreed
-- in section 14 has passed.
--
-- What survives this migration is `migration.clerk_user_map`, minimised. It is
-- kept permanently and deliberately: Paddle still carries signed Clerk ids in
-- the custom data of old subscriptions, and support needs to resolve them. Only
-- the personal columns are cleared.
--
-- Export `migration.cutover_log` before running this; it is dropped here.

-- 1. Integrity backups taken by M03 and the dedupe work.
drop table if exists private.backup_newsletter_dupes;
drop table if exists private.backup_product_newsletter_dupes;
drop table if exists private.backup_qr_configs_dupes;
drop table if exists private.backup_prompts_null_user;
drop table if exists private.backup_ocr_null_user;
drop table if exists private.backup_newsletter_forged_owner;

-- 2. Scratch evidence written by the re-key.
drop table if exists migration.pre_remap_counts;
drop table if exists migration.t0_password_digests;

-- 3. CHANGE W3: the M10 delete trigger inserts into migration.auth_user_deletions.
-- Replace its body BEFORE that table is dropped, or every auth.admin.deleteUser
-- fails with 42P01 ("Database error deleting user") and the public.users row
-- survives the account deletion. CREATE OR REPLACE keeps the owner and the ACL.
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

-- 4. Minimise the map: keep clerk_user_id, supabase_user_id, origin and status.
update migration.clerk_user_map
   set email = null, avatar_url = null, cookie_consent = null, google_sub = null,
       password_hasher = null, detail = null, clerk_last_sign_in_at = null,
       updated_at = now();

drop table if exists migration.cutover_log;
