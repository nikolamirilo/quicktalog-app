-- CHANGE C10 and W7 (PGlite-verified, final run).
-- Apply only after the edge functions accept header x-webhook-secret (verify_jwt = false) and the Vault secret
-- `edge_webhook_secret` is set. Once the secret exists, the service_role key is no longer placed in the
-- PUBLIC-readable pg_net queue. Residual: the webhook secret itself is readable there (it only authorises the
-- four edge functions).

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
