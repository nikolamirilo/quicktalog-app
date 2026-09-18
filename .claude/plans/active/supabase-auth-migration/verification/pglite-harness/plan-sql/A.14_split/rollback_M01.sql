-- M01 (CHANGE W4) cannot be rolled back once M10 is applied: the auth.users triggers depend on
-- private.handle_auth_user_*() (leave roles and schema in place; dropping the triggers first is possible only where
-- supautils allows it, see M10 above). Before M10, after M02-M09 are rolled back (export private.paddle_events /
-- paddle_unresolved_events first if they are still needed):
drop table if exists private.paddle_events, private.paddle_unresolved_events,
  private.backup_newsletter_dupes, private.backup_product_newsletter_dupes, private.backup_qr_configs_dupes,
  private.backup_prompts_null_user, private.backup_ocr_null_user, private.backup_newsletter_forged_owner;
drop function if exists private.current_user_id();
drop table if exists private.settings;
alter default privileges for role postgres grant execute on functions to public;
drop schema if exists private;
drop role if exists app_public;
drop role if exists app_user;
