-- The webhook triggers posted the bare row (`to_jsonb(new)`), but every edge
-- function expects the Supabase Database Webhook envelope and rejects anything
-- without `table` and `record` with a 400. pg_net ignores the response, so the
-- Brevo, HubSpot and Discord calls failed silently.
--
-- Same function as 20260922090003_edge_webhook_secret.sql; only the body changes.
-- CREATE OR REPLACE keeps the owner, the ACL and the triggers that reference it.

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
    body                 := pg_catalog.jsonb_build_object(
                              'type', tg_op,
                              'table', tg_table_name,
                              'schema', tg_table_schema,
                              'record', pg_catalog.to_jsonb(new),
                              'old_record', case when tg_op = 'UPDATE' then pg_catalog.to_jsonb(old) end),
    timeout_milliseconds := 5000
  ) into v_request_id;
  return new;
end;
$$;
alter function public.call_edge_function_with_vault_secret() owner to postgres;
revoke all on function public.call_edge_function_with_vault_secret() from public, anon, authenticated;
