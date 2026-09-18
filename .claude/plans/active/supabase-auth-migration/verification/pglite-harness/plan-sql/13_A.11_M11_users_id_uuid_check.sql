-- Records the constraint added inside the re-key transaction in migration history; idempotent.
-- Delete supabase/tests/database/15_clerk_ids.test.sql in the same commit.
do $$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
                  where conrelid = 'public.users'::regclass and conname = 'users_id_is_uuid') then
    alter table public.users add constraint users_id_is_uuid
      check (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') not valid;
  end if;
end $$;
