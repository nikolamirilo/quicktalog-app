-- Verified (PGlite, first and final run; CHANGE W6 PGlite-verified, final run). Makes DB webhooks post to THIS
-- project's edge functions (never PROD from TEST) and stops the Brevo webhook firing on every users UPDATE.
-- PROD check right after apply: select value from private.settings where key = 'edge_functions_base_url'
-- must be https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1; insert it by hand if the Vault key is not a JWT.
-- Comments below come from earlier drafts (not included; superseded by this plan); the SQL is the verified file.

-- 2.0 CHANGE W6: a mistyped or foreign base URL fails on write instead of silently posting user rows elsewhere
alter table private.settings add constraint settings_edge_functions_base_url_format
  check (key <> 'edge_functions_base_url'
         or value ~ '^(https://[a-z]{20}\.supabase\.co|http://(127\.0\.0\.1|localhost|host\.docker\.internal|kong):[0-9]{2,5})/functions/v1$');

-- 2.1 Seed the base URL from this project's own Vault key -------------------------------------------------
-- WHY: legacy service_role keys are JWTs whose payload carries "ref" = the project ref (verified on TEST: the
-- legacy JWT payload carries ref; the PROD Vault value is still checked right after apply). Deriving the URL
-- from the key already stored in THIS project's Vault means
-- PROD keeps working with no manual step, and TEST (0 Vault secrets) gets no URL -> no outbound call.
do $$
declare
  v_token   text;
  v_part    text;
  v_payload jsonb;
  v_ref     text;
begin
  if exists (select 1 from private.settings where key = 'edge_functions_base_url') then
    return;
  end if;
  select ds.decrypted_secret into v_token
    from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
  if v_token is null or v_token !~ '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$' then
    raise notice 'edge_functions_base_url not seeded (no JWT service_role_key in Vault). Insert it manually if this project must call edge functions.';
    return;
  end if;
  v_part := pg_catalog.translate(pg_catalog.split_part(v_token, '.', 2), '-_', '+/');
  v_part := pg_catalog.rpad(v_part, ((pg_catalog.length(v_part) + 3) / 4) * 4, '=');
  v_payload := pg_catalog.convert_from(pg_catalog.decode(v_part, 'base64'), 'UTF8')::jsonb;
  v_ref := v_payload ->> 'ref';
  if v_ref ~ '^[a-z]{20}$' then
    insert into private.settings (key, value)
    values ('edge_functions_base_url', 'https://' || v_ref || '.supabase.co/functions/v1');
    raise notice 'edge_functions_base_url seeded for project %', v_ref;
  else
    raise notice 'edge_functions_base_url not seeded (JWT has no usable ref claim).';
  end if;
exception when others then
  raise notice 'edge_functions_base_url not seeded: %', sqlerrm;
end $$;

-- 2.2 Webhook trigger function reads the base URL -------------------------------------------------------
-- WHY: 20260911213819_remote_schema.sql:74 hard-codes https://uhfbapjuzvlyzyodxhqn.supabase.co, so any
-- TEST row with a Vault key would post real user rows to PROD Brevo/CRM/Discord. search_path tightened
-- from 'public' to '' (every name qualified). CREATE OR REPLACE keeps the existing ACL
-- (TEST: postgres + service_role only) and the three triggers that reference it.
create or replace function public.call_edge_function_with_vault_secret()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_base       text;
  v_token      text;
  v_request_id bigint;
begin
  select s.value into v_base from private.settings s where s.key = 'edge_functions_base_url';
  if v_base is null then
    raise warning 'call_edge_function_with_vault_secret: edge_functions_base_url not set, skipping %', tg_argv[0];
    return new;
  end if;

  select ds.decrypted_secret into v_token
    from vault.decrypted_secrets ds where ds.name = 'service_role_key' limit 1;
  if v_token is null then
    raise warning 'call_edge_function_with_vault_secret: service_role_key not found in Vault, skipping %', tg_argv[0];
    return new;
  end if;

  select net.http_post(
    url                  := v_base || '/' || tg_argv[0],
    headers              := pg_catalog.jsonb_build_object('Content-type', 'application/json',
                                                          'Authorization', 'Bearer ' || v_token),
    body                 := pg_catalog.to_jsonb(new),
    timeout_milliseconds := 5000
  ) into v_request_id;

  return new;
end;
$$;
alter function public.call_edge_function_with_vault_secret() owner to postgres;
revoke all on function public.call_edge_function_with_vault_secret() from public, anon, authenticated;

-- 2.3 "Sync Plans" cron job reads the same setting ----------------------------------------------------
-- WHY: 20260912093000_lockdown_privileges_and_schema_fixes.sql:245-264 schedules a POST to the PROD URL
-- from every project. Zero rows in private.settings -> the SELECT returns nothing -> no request.
do $do$
begin
  if exists (select 1 from pg_catalog.pg_extension where extname = 'pg_cron') then
    perform cron.schedule(
      'Sync Plans',
      '0 8 */3 * *',
      $job$
      select net.http_post(
        url := s.value || '/sync-available-plans',
        headers := jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets
                                          where name = 'service_role_key' limit 1)
        ),
        body := '{}'::jsonb,
        timeout_milliseconds := 5000
      )
      from private.settings s
      where s.key = 'edge_functions_base_url'
      $job$
    );
  end if;
end
$do$;

-- 2.4 Brevo trigger: only on columns Brevo cares about ----------------------------------------------------
-- WHY: AFTER INSERT OR UPDATE (remote_schema.sql:437) posts the whole row on every UPDATE. After this plan,
-- app_user updates users.cookie_preferences (saveCookiePreferences, Phase 1) and the re-key (R1)
-- rewrites users.id; neither should create CRM traffic. Which columns the PROD edge function actually reads
-- is (unverified) - its source is in no repo.
drop trigger if exists "Brevo New Contact Webhook" on public.users;
create trigger "Brevo New Contact Webhook"
  after insert or update of email, name, plan_id, customer_id on public.users
  for each row execute function public.call_edge_function_with_vault_secret('create-brevo-contact');
