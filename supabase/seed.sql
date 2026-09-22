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
