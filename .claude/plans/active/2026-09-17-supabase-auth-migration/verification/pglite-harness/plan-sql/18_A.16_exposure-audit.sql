-- E1 paid plan without a live subscription for the linked customer (compare with the Paddle API)
select u.id, u.email, u.plan_id, u.customer_id, u.created_at
  from public.users u
 where u.plan_id <> 'pri_01k27ajepm199twd1x77rpwdrq'   -- add the Starter yearly id if it exists
   and not exists (select 1 from public.subscriptions s
                    where s.customer_id = u.customer_id and s.subscription_status in ('active', 'trialing', 'past_due'));
-- E2 all subscription ids, to reconcile against a Paddle export (rows unknown to Paddle were forged)
select subscription_id, customer_id, subscription_status, price_id from public.subscriptions order by 1;
-- E3 newsletter rows whose owner is not the catalogue owner (forged ownerId)
select n.id, n.email, n.catalogue_id, n.owner_id, c.created_by
  from public.newsletter n join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;
-- E4 analytics for users without catalogues, and outliers
select a.user_id, count(*), sum(a.pageview_count) from public.analytics a
 where not exists (select 1 from public.catalogues c where c.created_by = a.user_id) group by 1;
select * from public.analytics
 where pageview_count > 10 * (select percentile_cont(0.99) within group (order by pageview_count) from public.analytics);
-- E5 catalogues owned by a user created after the catalogue (possible reassignment through anon PATCH)
select c.name, c.created_by, c.created_at, u.created_at as owner_created_at
  from public.catalogues c join public.users u on u.id = c.created_by
 where u.created_at > c.created_at + interval '1 minute';
-- E6 Supabase logs (ClickHouse SQL; Logs Explorer or Management API /analytics/endpoints/logs; max 24 h per query,
-- repeat per day within retention; https://supabase.com/docs/guides/observability/advanced-log-filtering)
-- select timestamp, log_attributes['request.method'] as method, log_attributes['request.path'] as path,
--        toInt32OrZero(log_attributes['response.status_code']) as status
--   from logs
--  where source = 'edge_logs' and log_attributes['request.path'] like '/rest/v1/%'
--    and log_attributes['request.method'] in ('POST', 'PATCH', 'PUT', 'DELETE')
--  order by timestamp desc limit 1000;
