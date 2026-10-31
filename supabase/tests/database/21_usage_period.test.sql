-- 21_usage_period.test.sql
--
-- 20261029120000_usage_period_from_signup: an account's allowances are counted inside a
-- 30-day period anchored on the day it was created, not inside the calendar month.
--
-- Every assertion is written relative to now(), so the file is correct on any day it runs.
-- The switch-over clamp (USAGE_PERIOD_EPOCH) is asserted as a property that holds both
-- before and after that date.
--
-- Runs inside one transaction that is rolled back.

create extension if not exists pgtap with schema extensions;

begin;

set local search_path to extensions, public;

select plan(16);

grant usage on schema extensions to app_user;
grant execute on all functions in schema extensions to app_user;

-- ---------------------------------------------------------------------------------------------------------
-- Fixtures, as postgres (BYPASSRLS). created_at is set explicitly: it is the anchor under test.
-- ---------------------------------------------------------------------------------------------------------
insert into public.plans (id, name) values ('pri_pgtap_period', 'pgTAP period plan')
on conflict (id) do nothing;

insert into public.users (id, name, email, plan_id, created_at) values
  ('a3a3a3a3-0000-4000-8000-00000000002a', 'Period a', 'pgtap-period-a@example.com', 'pri_pgtap_period',
   pg_catalog.now() - interval '2 days'),
  ('b3b3b3b3-0000-4000-8000-00000000002b', 'Period b', 'pgtap-period-b@example.com', 'pri_pgtap_period',
   pg_catalog.now() - interval '31 days'),
  ('c3c3c3c3-0000-4000-8000-00000000002c', 'Period c', 'pgtap-period-c@example.com', 'pri_pgtap_period',
   pg_catalog.now() - interval '60 days'),
  ('d3d3d3d3-0000-4000-8000-00000000002d', 'Period d', 'pgtap-period-d@example.com', 'pri_pgtap_period',
   pg_catalog.now() - interval '61 days');

insert into public.catalogues (name, user_id, status, tags) values
  ('pgtap-period-b', 'b3b3b3b3-0000-4000-8000-00000000002b', 'draft', '{}'::text[]),
  ('pgtap-period-b2', 'b3b3b3b3-0000-4000-8000-00000000002b', 'draft', '{}'::text[]),
  ('pgtap-period-d', 'd3d3d3d3-0000-4000-8000-00000000002d', 'draft', '{}'::text[]);

-- Period b signed up 31 days ago, so its current period started yesterday at 00:00 UTC.
-- The credits differ per row on purpose, so a regression to count(*) fails here.
insert into public.ai_credits (user_id, catalogue_id, created_at, refunded_at, credits)
select 'b3b3b3b3-0000-4000-8000-00000000002b', c.id, d.created_at, d.refunded_at, d.credits
  from public.catalogues c,
       (values (pg_catalog.now(), null::timestamptz, 2),                      -- counted
               (pg_catalog.now(), pg_catalog.now(), 9),                       -- refunded
               (pg_catalog.now(), null::timestamptz, 3),                      -- counted
               (private.usage_period_start(pg_catalog.now() - interval '31 days')
                  - interval '1 second', null::timestamptz, 7))               -- previous period
         as d(created_at, refunded_at, credits)
 where c.name = 'pgtap-period-b';

-- analytics is one row per catalogue per UTC day (analytics_catalogue_id_day_key). The
-- period starts on its first day, so a row on that day counts and the day before it does
-- not. Two catalogues, so the rows never share a key on a day the period starts today.
insert into public.analytics (user_id, catalogue_id, day, pageviews, unique_visitors)
select 'b3b3b3b3-0000-4000-8000-00000000002b', c.id, d.day, d.pageviews, d.unique_visitors
  from public.catalogues c,
       (values ('pgtap-period-b',  (pg_catalog.now() at time zone 'UTC')::date, 10, 4),
               ('pgtap-period-b2', ((private.usage_period_start(pg_catalog.now() - interval '31 days'))
                                      at time zone 'UTC')::date, 5, 2),
               ('pgtap-period-b',  ((private.usage_period_start(pg_catalog.now() - interval '31 days')
                                      - interval '1 day') at time zone 'UTC')::date, 99, 99))
         as d(catalogue, day, pageviews, unique_visitors)
 where c.name = d.catalogue;

-- Period d spent 2 credits 40 days ago: inside its previous period, outside this one.
insert into public.ai_credits (user_id, catalogue_id, created_at, credits)
select 'd3d3d3d3-0000-4000-8000-00000000002d', c.id, pg_catalog.now() - interval '40 days', 2
  from public.catalogues c where c.name = 'pgtap-period-d';

-- ---------------------------------------------------------------------------------------------------------
-- The anchor. Run as app_user, which also proves the EXECUTE grant.
-- ---------------------------------------------------------------------------------------------------------
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"b3b3b3b3-0000-4000-8000-00000000002b","role":"app_user"}', true); end $$;
set local role app_user;

select is(
  private.usage_period_anchor(pg_catalog.now() - interval '2 days'),
  (((pg_catalog.now() - interval '2 days') at time zone 'UTC')::date::timestamp at time zone 'UTC'),
  'a signup 2 days ago is still in its first period, which started on the signup day at 00:00 UTC'
);

select is(
  private.usage_period_anchor(pg_catalog.now() - interval '31 days'),
  ((((pg_catalog.now() - interval '31 days') at time zone 'UTC')::date + 30)::timestamp at time zone 'UTC'),
  'a signup 31 days ago is one whole 30-day step along'
);

select is(
  private.usage_period_anchor(pg_catalog.now() - interval '60 days'),
  ((((pg_catalog.now() - interval '60 days') at time zone 'UTC')::date + 60)::timestamp at time zone 'UTC'),
  'day 60 starts the third period, so the anchor is today'
);

select is(
  private.usage_period_anchor(pg_catalog.now() - interval '61 days'),
  ((((pg_catalog.now() - interval '61 days') at time zone 'UTC')::date + 60)::timestamp at time zone 'UTC'),
  'the anchor moves in whole 30-day steps, never part of one'
);

select is(
  private.usage_period_anchor(pg_catalog.now() + interval '1 day'),
  (((pg_catalog.now() + interval '1 day') at time zone 'UTC')::date::timestamp at time zone 'UTC'),
  'a signup in the future (clock skew) does not step the anchor backwards'
);

select is(
  private.usage_period_end('2020-03-01 00:00:00+00'::timestamptz),
  private.usage_period_anchor('2020-03-01 00:00:00+00'::timestamptz) + interval '30 days',
  'a period ends 30 days after its anchor; the switch-over clamp never moves a reset date'
);

select ok(
  (select bool_and(private.usage_period_anchor(s) <= pg_catalog.now()
               and pg_catalog.now() <  private.usage_period_end(s))
     from (values (pg_catalog.now() - interval '2 days'),
                  (pg_catalog.now() - interval '31 days'),
                  (pg_catalog.now() - interval '60 days'),
                  (pg_catalog.now() - interval '61 days'),
                  (pg_catalog.now() - interval '900 days')) v(s)),
  'now() always falls inside the current period, whatever the signup date'
);

select ok(
  case when pg_catalog.now() < '2026-11-01 00:00:00+00'::timestamptz then true
       else private.usage_period_start('2020-03-01 00:00:00+00'::timestamptz)
              >= '2026-11-01 00:00:00+00'::timestamptz end,
  'after the switch-over no period reaches back past it (vacuously true before it)'
);

-- ---------------------------------------------------------------------------------------------------------
-- my_usage() counts inside the period and reports the window it used.
-- ---------------------------------------------------------------------------------------------------------
select is((select credits from private.my_usage()), 5::bigint,
  'credits: 2+3 inside the period; the refunded 9 and the previous period''s 7 are left out');

select is((select pageviews from private.my_usage()), 15::bigint,
  'pageviews: the period''s first day counts, the day before it does not');

select is((select unique_visitors from private.my_usage()), 6::bigint,
  'unique visitors are counted over the same days');

select is((select catalogues from private.my_usage()), 2::bigint,
  'the catalogue count is a stock, not usage, so the period does not apply to it');

select is(
  (select period_start from private.my_usage()),
  private.usage_period_start(pg_catalog.now() - interval '31 days'),
  'my_usage() reports the start it counted from, so the dashboard can name it'
);

select is(
  (select period_end from private.my_usage()),
  private.usage_period_end(pg_catalog.now() - interval '31 days'),
  'my_usage() reports when the allowance resets'
);

-- ---------------------------------------------------------------------------------------------------------
-- begin_ai_turn charges against the period, not the month.
-- ---------------------------------------------------------------------------------------------------------
reset role;
do $$ begin perform set_config('request.jwt.claims',
  '{"sub":"d3d3d3d3-0000-4000-8000-00000000002d","role":"app_user"}', true); end $$;
set local role app_user;

select is(
  (select outcome from private.begin_ai_turn('pgtap-period-d', 2, 'describe', null::uuid, null::text,
                                             2, false, 0)),
  'charged',
  'a charge from the previous period does not use up this period''s allowance'
);

select is(
  (select outcome from private.begin_ai_turn('pgtap-period-d', 2, 'describe', null::uuid, null::text,
                                             2, false, 0)),
  'limit',
  'the charge just made does count, so the allowance is now spent'
);

select * from finish();

rollback;
