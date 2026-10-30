-- Catalogues switched off for the traffic limit come back when the allowance resets
-- (plan .claude/plans/active/2026-10-29-traffic-off-auto-return).
--
-- The plan-check job takes a catalogue offline when its owner's page views run out, and
-- nothing ever puts it back. It now records that it was the one that switched it off, and
-- re-activates it in the first run after the owner's 30-day period rolls over
-- (20261029120000).
--
-- The flag must never outlive the owner's own decision: someone who switches a catalogue
-- off deliberately must not have it switched back on. The trigger below clears the flag on
-- any status change that does not set the flag in the same statement - so the job keeps its
-- own stamp and everybody else cancels it. A trigger rather than a line in each server
-- action, because a future action cannot forget it.

alter table public.catalogues
  add column if not exists traffic_off_at timestamptz;

comment on column public.catalogues.traffic_off_at is
  'When the plan-check job switched this catalogue off because the owner''s page view allowance ran out; null otherwise. The job makes one attempt to switch it back on in the first run after the owner''s next 30-day period starts. Any status change by anyone else clears it.';

-- selectMyCatalogues reads every column, so the owner's dashboard needs this one.
grant select (traffic_off_at) on public.catalogues to app_user;

-- The job's lookup, against a table whose rows carry their whole content.
create index if not exists catalogues_traffic_off_at_idx
  on public.catalogues (traffic_off_at)
  where traffic_off_at is not null;

create or replace function private.catalogue_status_clears_traffic_off()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.status is distinct from old.status
     and new.traffic_off_at is not distinct from old.traffic_off_at then
    new.traffic_off_at := null;
  end if;
  return new;
end;
$$;

alter function private.catalogue_status_clears_traffic_off() owner to postgres;
revoke all on function private.catalogue_status_clears_traffic_off() from public;
-- Harmless and avoids relying on fire-time ACL behaviour (20260921181104, 4.6).
grant execute on function private.catalogue_status_clears_traffic_off() to app_user;

drop trigger if exists catalogues_status_clears_traffic_off on public.catalogues;
create trigger catalogues_status_clears_traffic_off before update on public.catalogues
  for each row execute function private.catalogue_status_clears_traffic_off();
