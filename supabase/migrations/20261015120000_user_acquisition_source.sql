-- Self-reported acquisition channel, asked in a dashboard modal while this column is null.
-- Holds either a slug from src/constants/users.ts (ACQUISITION_SOURCES), the user's own words
-- when they pick "Other", or 'Skipped' when they skip. Any value closes the question for good;
-- null means never answered, which is what makes the modal open.
-- Not in the Brevo trigger's column list (email, name, plan_id, customer_id), so this sends no webhooks.
alter table public.users add column if not exists acquisition_source text;

alter table public.users
  add constraint users_acquisition_source_length
    check (acquisition_source is null
           or pg_catalog.length(acquisition_source) between 1 and 120);

-- The answer is the user's own, written by actions/users.ts inside `withUser`; users_update_self
-- already limits the row. Denied elsewhere: see 20260921181104 section 4.1.
grant update (acquisition_source) on public.users to app_user;
