-- M12 (plan A.12): validate the uuid check on public.users.
--
-- The re-key added `users_id_is_uuid` as NOT VALID, so the rows that were left
-- behind on Clerk ids — the accepted orphans of 12.6 — could stay without
-- blocking the cutover. NOT VALID means new and updated rows are checked but
-- existing ones are not, which is exactly the property that lets a stale Clerk
-- id fail loudly while the orphans sit still.
--
-- Run this only once orphan triage is finished (T+30). Validating takes a
-- SHARE UPDATE EXCLUSIVE lock on public.users: reads and writes continue.

do $$
declare
  v_missing  boolean;
  v_orphans  bigint;
begin
  select not exists (
    select 1 from pg_catalog.pg_constraint
     where conrelid = 'public.users'::pg_catalog.regclass
       and conname  = 'users_id_is_uuid')
    into v_missing;
  if v_missing then
    raise exception 'users_id_is_uuid is missing: the re-key has not run here, or a rollback dropped it'
      using errcode = 'P0001';
  end if;

  -- A bare 23514 thirty days after the cutover says nothing about which rows
  -- are in the way. Name them first.
  select count(*) into v_orphans from public.users u
   where u.id !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  if v_orphans > 0 then
    raise exception 'orphan triage is not finished: % row(s) in public.users still carry a non-uuid id', v_orphans
      using errcode = 'P0001',
            hint = 'list them with: select id, email, customer_id from public.users where id like ''user\_%''';
  end if;
end $$;

alter table public.users validate constraint users_id_is_uuid;
