-- Where a signup came from (Track A, QT-09).
--
-- `acquisition_source` was the self-reported answer to "How did you hear about us?",
-- asked once in a dashboard modal. It is null for 2,180 of 2,200 PROD users, because
-- most people skip the question and nothing else was ever recorded.
--
-- This splits the two apart:
--
--   * the tracked first touch - UTM tags from the landing URL, the referring domain,
--     the landing path and when it happened - written once at signup from a first-party
--     cookie the browser set on the visitor's first page;
--   * `self_reported_source`, the answer to the modal, which is the user's own words and
--     must never overwrite the tracked source;
--   * `acquisition_source`, now the *derived* channel (google, linkedin, ai_search,
--     catalogue_badge, direct, …), worked out from the first touch.
--
-- Writes happen through `actions/users.ts` inside `withUser`, so `users_update_self`
-- limits them to the caller's own row, and every write is guarded by
-- `first_seen_at is null` so the first touch stays the first touch.

alter table public.users
  add column if not exists utm_source          text,
  add column if not exists utm_medium          text,
  add column if not exists utm_campaign        text,
  add column if not exists utm_content         text,
  add column if not exists utm_term            text,
  add column if not exists referrer_domain     text,
  add column if not exists landing_path        text,
  add column if not exists first_seen_at       timestamptz,
  add column if not exists self_reported_source text;

-- Values come from a URL the visitor controls, so they are bounded in the database too,
-- not only in the code that writes them.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'users_acquisition_fields_length') then
    alter table public.users
      add constraint users_acquisition_fields_length check (
        (utm_source           is null or pg_catalog.length(utm_source)           between 1 and 120) and
        (utm_medium           is null or pg_catalog.length(utm_medium)           between 1 and 120) and
        (utm_campaign         is null or pg_catalog.length(utm_campaign)         between 1 and 200) and
        (utm_content          is null or pg_catalog.length(utm_content)          between 1 and 200) and
        (utm_term             is null or pg_catalog.length(utm_term)             between 1 and 200) and
        (referrer_domain      is null or pg_catalog.length(referrer_domain)      between 1 and 253) and
        (landing_path         is null or pg_catalog.length(landing_path)         between 1 and 512) and
        (self_reported_source is null or pg_catalog.length(self_reported_source) between 1 and 120)
      );
  end if;
end $$;

-- The 20 answers already stored were self-reported; they move to the column that now
-- means that. 'Skipped' is not a channel, so it does not stay in the derived one.
update public.users
   set self_reported_source = acquisition_source
 where acquisition_source is not null
   and self_reported_source is null;

update public.users
   set acquisition_source = null
 where acquisition_source = 'Skipped';

-- Same grant as `acquisition_source` (20261015120000): the row is the user's own, and
-- `users_update_self` already limits which row that is. Not in the Brevo trigger's
-- column list (email, name, plan_id, customer_id), so these writes send no webhooks.
grant update (
  utm_source, utm_medium, utm_campaign, utm_content, utm_term,
  referrer_domain, landing_path, first_seen_at, self_reported_source
) on public.users to app_user;

-- Channel → signups → owners with something published → owners paying, by signup month.
-- `security_invoker` so it carries no privileges of its own; no grants to app_user or
-- app_public, so only postgres and service_role can read it. The paid test is "not on
-- the default plan", which is the same definition the sign-up trigger uses.
create or replace view public.acquisition_funnel
with (security_invoker = on) as
select pg_catalog.date_trunc('month', u.created_at)::date as month,
       coalesce(u.acquisition_source, 'unknown')            as channel,
       pg_catalog.count(*)                                       as signups,
       pg_catalog.count(*) filter (
         where exists (select 1 from public.catalogues c
                        where c.user_id = u.id)
       )                                                          as created_a_catalogue,
       pg_catalog.count(*) filter (
         where exists (select 1 from public.catalogues c
                        where c.user_id = u.id and c.status = 'active')
       )                                                          as published,
       pg_catalog.count(*) filter (
         where u.plan_id is distinct from
               (select s.value from private.settings s where s.key = 'default_plan_id')
       )                                                          as paying
  from public.users u
 group by 1, 2;

alter view public.acquisition_funnel owner to postgres;
revoke all on public.acquisition_funnel from public;
