-- Verified (PGlite, patch P3) plus CHANGE C2-C4 (PGlite-verified, final run).
-- PROD PRE-CHECKS (read-only, A.15): status values; prompts/ocr rows with null user_id; duplicate
-- newsletter (catalogue_id, lower(email)), product_newsletter lower(email), qr_configs.catalogue; forged
-- newsletter owners; and CHANGE C2: sizes measured as max(octet_length(content::text)) (and colors, config,
-- cookie_preferences), because pg_column_size reports the compressed size and under-reports (PGlite F8).
-- CHANGE W8 (comment corrected; PGlite-verified, final run):
-- If any row exceeds a limit below, raise the limit or fix the row BEFORE applying: NOT VALID checks are still
-- enforced on every INSERT and on every UPDATE of the row, including updates that do not touch the column (for an
-- unchanged toasted column pg_column_size sees the stored, possibly compressed, size).
-- Behaviour change on code running at this time: dropping UNIQUE(catalogue) makes today's meter() succeed after
-- the first prompt per catalogue (quotas start counting); case-variant newsletter duplicates hit 23505 in
-- today's newsletter action (ship the Phase 1 newsletter action with this migration).

-- 3.1 catalogues.status domain --------------------------------------------------------------------------
-- WHY: updateItemStatus (actions/catalogue.ts:105) writes an unvalidated status; the public policy keys on
-- status = 'active'. Values from ../quicktalog-packages/src/types/enums.ts:9-14. TEST has only active/draft.
alter table public.catalogues
  add constraint catalogues_status_check
  check (status in ('active', 'inactive', 'draft', 'in preparation', 'error')) not valid;
alter table public.catalogues validate constraint catalogues_status_check;

-- 3.2 jsonb size ceilings ---------------------------------------------------------------------------------
-- WHY: app_user can write these columns directly; a size cap stops one owner from storing arbitrarily large
-- blobs (DoS on ISR, Redis mirror, Sentry). Limits are product decisions (TEST maxima are far below).
-- NOT VALID now (enforced for new writes); validated in M07 after the PROD audit.
alter table public.catalogues  add constraint catalogues_content_size
  check (pg_column_size(content) < 1048576) not valid;
alter table public.user_themes add constraint user_themes_colors_size
  check (pg_column_size(colors) < 4096) not valid;
alter table public.qr_configs  add constraint qr_configs_config_size
  check (pg_column_size(config) < 65536) not valid;
alter table public.users       add constraint users_cookie_prefs_size
  check (cookie_preferences is null or pg_column_size(cookie_preferences) < 2048) not valid;

-- 3.3 Backups for the destructive steps below -------------------------------------------------------------
create table if not exists private.backup_newsletter_dupes         (like public.newsletter);
create table if not exists private.backup_product_newsletter_dupes (like public.product_newsletter);
create table if not exists private.backup_qr_configs_dupes         (like public.qr_configs);
create table if not exists private.backup_prompts_null_user        (like public.prompts);
create table if not exists private.backup_ocr_null_user            (like public.ocr);
alter table private.backup_newsletter_dupes         owner to postgres;   -- PATCH P3
alter table private.backup_product_newsletter_dupes owner to postgres;
alter table private.backup_qr_configs_dupes         owner to postgres;
alter table private.backup_prompts_null_user        owner to postgres;
alter table private.backup_ocr_null_user            owner to postgres;
revoke all on table private.backup_newsletter_dupes, private.backup_product_newsletter_dupes,
  private.backup_qr_configs_dupes, private.backup_prompts_null_user, private.backup_ocr_null_user from public;

-- 3.3b CHANGE C3: remove subscriber rows injected with a forged owner_id (today's action trusts the client
-- ownerId). Backed up first. Runs before the dedupe so a forged earliest row cannot win.
create table if not exists private.backup_newsletter_forged_owner (like public.newsletter);
alter table private.backup_newsletter_forged_owner owner to postgres;
revoke all on table private.backup_newsletter_forged_owner from public;
insert into private.backup_newsletter_forged_owner
select n.* from public.newsletter n
  join public.catalogues c on c.id = n.catalogue_id
 where c.created_by is distinct from n.owner_id;
delete from public.newsletter n
 using public.catalogues c
 where c.id = n.catalogue_id and c.created_by is distinct from n.owner_id;

-- 3.4 newsletter: one row per (catalogue, case-insensitive email) -----------------------------------------
-- WHY: actions/newsletter.ts:25-44 dedupes with a racy SELECT; the replacement definer function
-- (M05) relies on ON CONFLICT against this index. Keeps the earliest row.
insert into private.backup_newsletter_dupes
select n.* from public.newsletter n
 where exists (select 1 from public.newsletter d
                where d.catalogue_id = n.catalogue_id and lower(d.email) = lower(n.email)
                  and (d.created_at, d.id) < (n.created_at, n.id));
delete from public.newsletter n
 using public.newsletter d
 where d.catalogue_id = n.catalogue_id and lower(d.email) = lower(n.email)
   and (d.created_at, d.id) < (n.created_at, n.id);
create unique index if not exists newsletter_catalogue_email_key
  on public.newsletter (catalogue_id, lower(email));
-- Leading column catalogue_id now serves the FK newsletter_catalogue_id_fkey; avoid lint 0005/0009.
drop index if exists public.newsletter_catalogue_id_idx;

-- 3.5 product_newsletter: one row per case-insensitive email ------------------------------------------------
-- WHY: actions/newsletter.ts:64-74 SELECT-then-INSERT; replaced by ON CONFLICT in M05.
insert into private.backup_product_newsletter_dupes
select n.* from public.product_newsletter n
 where exists (select 1 from public.product_newsletter d where lower(d.email) = lower(n.email) and d.id < n.id);
delete from public.product_newsletter n
 using public.product_newsletter d
 where lower(d.email) = lower(n.email) and d.id < n.id;
create unique index if not exists product_newsletter_email_key
  on public.product_newsletter (lower(email));

-- 3.6 qr_configs: one config per catalogue --------------------------------------------------------------
-- WHY: actions/qr-configs.ts:14-33 select-then-insert race; the new code uses
-- INSERT ... ON CONFLICT (catalogue) DO UPDATE. TEST has only a non-unique index even though the Drizzle
-- schema declares qr_configs_catalogue_key (../quicktalog-packages/src/drizzle/migrations/schema.ts:124).
-- Keeps the most recently updated row.
insert into private.backup_qr_configs_dupes
select q.* from public.qr_configs q
 where exists (select 1 from public.qr_configs d
                where d.catalogue = q.catalogue
                  and (coalesce(d.updated_at, '-infinity'::timestamp), d.id)
                    > (coalesce(q.updated_at, '-infinity'::timestamp), q.id));
delete from public.qr_configs q
 using public.qr_configs d
 where d.catalogue = q.catalogue
   and (coalesce(d.updated_at, '-infinity'::timestamp), d.id)
     > (coalesce(q.updated_at, '-infinity'::timestamp), q.id);
create unique index if not exists qr_configs_catalogue_key on public.qr_configs (catalogue);
drop index if exists public.qr_configs_catalogue_idx;

-- 3.7 AI ledger (prompts) --------------------------------------------------------------------------------
-- WHY (each defect is from research/ai-agent.md s.5):
--   a) UNIQUE(catalogue) makes every meter() after the first per catalogue fail (lib/ai/access.ts:98;
--      swallowed at app/api/agent/route.ts:123-127) -> drop it.
--   b) catalogue FK ON DELETE CASCADE: deleting a catalogue (actions/catalogue.ts:52) deletes its charges
--      and resets the monthly quota; FK actions bypass RLS -> ON DELETE SET NULL, catalogue nullable.
--   c) user_id nullable -> a null row silently leaves the count -> NOT NULL.
--   d) turn_id (unique), continuations, refunded_at support server-authoritative metering in
--      private.begin_ai_turn / refund_ai_turn (M05, replaced by M06). turn_id gets a DB default so today's meter()
--      insert (Drizzle schema without turn_id) keeps working during Phase 1.
-- Constraint lookups are name-independent so a differently named FK/UNIQUE on PROD cannot be skipped
-- silently (an IF EXISTS on the wrong name would leave the CASCADE FK in place next to the new one).
do $$
declare
  r record;
begin
  for r in
    select c.conname
      from pg_catalog.pg_constraint c
     where c.conrelid = 'public.prompts'::regclass
       and (   (c.contype = 'f' and c.confrelid = 'public.catalogues'::regclass)
            or (c.contype = 'u' and c.conkey = array[(select a.attnum from pg_catalog.pg_attribute a
                                                       where a.attrelid = 'public.prompts'::regclass
                                                         and a.attname = 'catalogue')]::int2[]))
  loop
    execute pg_catalog.format('alter table public.prompts drop constraint %I', r.conname);
  end loop;
end $$;

alter table public.prompts alter column catalogue drop not null;
alter table public.prompts
  add constraint prompts_catalogue_fkey foreign key (catalogue)
  references public.catalogues (name) on update cascade on delete set null;

insert into private.backup_prompts_null_user select * from public.prompts where user_id is null;
delete from public.prompts where user_id is null;
alter table public.prompts alter column user_id set not null;

alter table public.prompts
  add column if not exists turn_id       uuid,
  add column if not exists continuations integer not null default 0,
  add column if not exists refunded_at   timestamptz;
update public.prompts set turn_id = gen_random_uuid() where turn_id is null;
alter table public.prompts
  alter column turn_id set default gen_random_uuid(),
  alter column turn_id set not null;
alter table public.prompts
  add constraint prompts_continuations_range check (continuations between 0 and 1000);
create unique index if not exists prompts_turn_id_key       on public.prompts (turn_id);
create index        if not exists prompts_user_datetime_idx on public.prompts (user_id, datetime);
create index        if not exists prompts_catalogue_idx     on public.prompts (catalogue);   -- FK cascade lookups (was served by the dropped UNIQUE)
drop index if exists public.prompts_user_id_idx;                                              -- superseded by (user_id, datetime)

-- 3.8 ocr (same ledger rules; nothing writes it today, TEST 0 rows) ---------------------------------------
do $$
declare
  r record;
begin
  for r in
    select c.conname from pg_catalog.pg_constraint c
     where c.conrelid = 'public.ocr'::regclass and c.contype = 'f'
       and c.confrelid = 'public.catalogues'::regclass
  loop
    execute pg_catalog.format('alter table public.ocr drop constraint %I', r.conname);
  end loop;
end $$;
alter table public.ocr alter column catalogue drop not null;
alter table public.ocr alter column catalogue drop default;   -- '' can never satisfy the FK to catalogues(name)
alter table public.ocr
  add constraint ocr_catalogue_fkey foreign key (catalogue)
  references public.catalogues (name) on update cascade on delete set null;
insert into private.backup_ocr_null_user select * from public.ocr where user_id is null;
delete from public.ocr where user_id is null;
alter table public.ocr alter column user_id set not null;

-- 3.9 Paddle webhook idempotency (admin only) ---------------------------------------------------------------
-- WHY: utils/paddle/process-webhook.ts has no idempotency or ordering (research/public-and-system-surfaces.md
-- finding at :22-40) and swallows errors (:44-50). asAdmin inserts event_id first, ON CONFLICT DO NOTHING
-- -> already processed. No app-role grants.
create table if not exists private.paddle_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  processed_at timestamptz not null default now()
);
alter table private.paddle_events owner to postgres;   -- PATCH P3 (PGlite run: asAdmin got 42501 when a superuser applied 03)
revoke all on table private.paddle_events from public;

-- 3.10 CHANGE C4: Paddle events that cannot be linked to a user go to a review queue (200 to Paddle, Sentry
-- fatal), instead of silent drops or infinite retries. Admin only.
create table if not exists private.paddle_unresolved_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz not null,
  customer_id  text,
  reason       text not null,
  payload      jsonb not null,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
alter table private.paddle_unresolved_events owner to postgres;
revoke all on table private.paddle_unresolved_events from public;
