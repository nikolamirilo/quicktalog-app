-- M09 (plan A.9, CHANGE C10 and W7): stop putting the service_role key in the
-- pg_net queue.
--
-- `net.http_post` stores its headers in a queue table that any role able to run
-- SQL can read. Sending the service_role key as a bearer token therefore leaves
-- a key that can read and write every table sitting in a readable queue. After
-- this migration the webhooks send `x-webhook-secret` instead, which only
-- authorises the four edge functions.
--
-- File order note: this is plan M09, but it is numbered after M10 because M08
-- had already been applied remotely when it was written, and Supabase refuses
-- local files that sort before the last applied migration. Nothing in M10
-- depends on it, so the order is immaterial.
--
-- Apply only once BOTH are true, or the webhooks fall back to the old header:
--   1. the edge functions accept `x-webhook-secret` and have verify_jwt = false;
--   2. the Vault secret `edge_webhook_secret` is set on this project.
--
-- Residual risk: the webhook secret itself is readable in the queue. It grants
-- far less than the service_role key did.

create or replace function public.call_edge_function_with_vault_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base       text;
  v_secret     text;
  v_token      text;
  v_headers    jsonb;
  v_request_id bigint;
begin
  select s.value into v_base from private.settings s where s.key = 'edge_functions_base_url';
  if v_base is null then
    raise warning 'call_edge_function_with_vault_secret: edge_functions_base_url not set, skipping %', tg_argv[0];
    return new;
  end if;

  select ds.decrypted_secret into v_secret
    from vault.decrypted_secrets ds where ds.name = 'edge_webhook_secret' limit 1;
  if v_secret is not null then
    v_headers := pg_catalog.jsonb_build_object('Content-type', 'application/json', 'x-webhook-secret', v_secret);
  else
    -- Transition fallback until the Vault secret exists.
    select ds.decrypted_secret into v_token
      from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
    if v_token is null then
      raise warning 'call_edge_function_with_vault_secret: no webhook credential in Vault, skipping %', tg_argv[0];
      return new;
    end if;
    v_headers := pg_catalog.jsonb_build_object('Content-type', 'application/json', 'Authorization', 'Bearer ' || v_token);
  end if;

  select net.http_post(
    url                  := v_base || '/' || tg_argv[0],
    headers              := v_headers,
    body                 := pg_catalog.to_jsonb(new),
    timeout_milliseconds := 5000
  ) into v_request_id;
  return new;
end;
$$;
alter function public.call_edge_function_with_vault_secret() owner to postgres;
revoke all on function public.call_edge_function_with_vault_secret() from public, anon, authenticated;

-- CHANGE W7: like the trigger function, the Sync Plans job posts nothing when Vault holds neither credential
-- (it would otherwise send an unauthenticated request with "Authorization": null).
do $do$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'Sync Plans',
      '0 8 */3 * *',
      $job$
      select net.http_post(
        url := s.value || '/sync-available-plans',
        headers := case
                     when w.secret is not null
                       then jsonb_build_object('Content-type', 'application/json', 'x-webhook-secret', w.secret)
                     else jsonb_build_object('Content-type', 'application/json', 'Authorization', 'Bearer ' ||
                            (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key' limit 1))
                   end,
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      )
      from private.settings s
      left join lateral (select decrypted_secret as secret from vault.decrypted_secrets
                          where name = 'edge_webhook_secret' limit 1) w on true
      where s.key = 'edge_functions_base_url'
        and (w.secret is not null
             or exists (select 1 from vault.decrypted_secrets where name = 'service_role_key'))
      $job$
    );
  end if;
end
$do$;
