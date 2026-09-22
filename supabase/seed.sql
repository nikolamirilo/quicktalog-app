-- Seed for the local Supabase stack (`supabase start` / `supabase db reset`).
-- Never runs against TEST or PROD: those get their rows from the Paddle plan
-- sync and from the operator.

-- The Starter plan. Its id is the Paddle monthly price id of tiers[0] in
-- @quicktalog/common, which is what `users.plan_id` holds for free accounts.
insert into public.plans (id, name)
values ('pri_01k27ajepm199twd1x77rpwdrq', 'Starter')
on conflict (id) do nothing;

-- The plan new sign-ups get. M10's sign-up trigger reads this, so without it a
-- local sign-up would create a user row with no plan.
insert into private.settings (key, value)
select 'default_plan_id', p.id
  from public.plans p
 where p.id = 'pri_01k27ajepm199twd1x77rpwdrq'
on conflict (key) do nothing;

-- The terms version new sign-ups are asked to accept. The app reads it through
-- `private.current_terms_version()`; when it is null the sign-up form disables
-- itself, so without this a local stack cannot exercise sign-up or consent at
-- all. TEST and PROD get their own value from the operator after legal sign-off.
insert into private.settings (key, value)
values ('terms_version', '0000-00-00-local')
on conflict (key) do nothing;

-- A password for the fail-closed login role, so the integration suite can
-- actually connect as it and prove that a query outside the wrapper is refused.
-- Local stack only: this file never runs against TEST or PROD, and the role has
-- no privileges of its own by design (M08).
do $$
begin
  if exists (select 1 from pg_catalog.pg_roles where rolname = 'app_rls') then
    alter role app_rls password 'postgres';
  end if;
end $$;
