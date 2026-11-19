-- Durable catalogue drafts (Track A, QT-01).
--
-- Until now the builder's unsaved work lived only in Upstash Redis
-- (`${REDIS_KEY_PREFIX}:catalogue:${id}`, 30-day sliding TTL). Save wrote the cache and
-- nothing else, so `public.catalogues.content` stayed `[]` until the owner pressed
-- Publish - 160 of 628 PROD catalogues are empty rows for exactly that reason - and an
-- eviction or a cache outage lost the work outright.
--
-- `catalogue_drafts` holds one draft per catalogue: the whole editable payload as jsonb,
-- the same shape the cache held (content *and* heading, appearance, header, footer, …),
-- because a draft that kept only `content` would drop unsaved style edits.
-- `published_at` is stamped by Publish, so "unpublished changes" is
-- `published_at is null or updated_at > published_at` - one comparison, no deep diff.
--
-- `catalogue_draft_versions` keeps the last 10 autosaves per catalogue. There is no
-- manual save point any more, so this is the only way back from an edit the owner
-- regrets. The trim runs in the write path (lib/catalogue/draft-store.ts).
--
-- Neither table is readable by `app_public`: a draft is not published content.

create table if not exists public.catalogue_drafts (
  catalogue_id uuid        primary key references public.catalogues (id) on delete cascade,
  user_id      text        not null references public.users (id) on update cascade on delete cascade,
  draft        jsonb       not null,
  updated_at   timestamptz not null default now(),
  published_at timestamptz,
  -- Mirrors the catalogues size checks: content < 1 MiB plus the other json < 1 MiB.
  constraint catalogue_drafts_size check (pg_column_size(draft) < 2097152)
);
create index if not exists catalogue_drafts_user_id_idx
  on public.catalogue_drafts (user_id);

create table if not exists public.catalogue_draft_versions (
  id           bigint      generated always as identity primary key,
  catalogue_id uuid        not null references public.catalogues (id) on delete cascade,
  user_id      text        not null references public.users (id) on update cascade on delete cascade,
  draft        jsonb       not null,
  created_at   timestamptz not null default now(),
  constraint catalogue_draft_versions_size check (pg_column_size(draft) < 2097152)
);
create index if not exists catalogue_draft_versions_catalogue_idx
  on public.catalogue_draft_versions (catalogue_id, created_at desc);

alter table public.catalogue_drafts         owner to postgres;
alter table public.catalogue_draft_versions owner to postgres;
alter table public.catalogue_drafts         enable row level security;
alter table public.catalogue_draft_versions enable row level security;
revoke all on table public.catalogue_drafts, public.catalogue_draft_versions from public;

-- `catalogue_id`, `user_id` and `created_at` are set on insert and never updated, so the
-- update grants are column-level: a draft row can only ever change its payload and its
-- two timestamps, and can never be moved to another catalogue or another owner.
grant select, insert, delete on public.catalogue_drafts to app_user;
grant update (draft, updated_at, published_at) on public.catalogue_drafts to app_user;
grant select, insert, delete on public.catalogue_draft_versions to app_user;

-- Owner-only, and the catalogue has to be the caller's as well: `user_id` alone would let
-- a caller park their own draft row on somebody else's catalogue id. The subquery runs
-- under `catalogues_select_owner`, so it can only ever return the caller's ids.
create policy catalogue_drafts_owner on public.catalogue_drafts
  for all to app_user
  using      (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id())
              and catalogue_id in (select c.id from public.catalogues c
                                    where c.user_id = (select private.current_user_id())));

create policy catalogue_draft_versions_owner on public.catalogue_draft_versions
  for all to app_user
  using      (user_id = (select private.current_user_id()))
  with check (user_id = (select private.current_user_id())
              and catalogue_id in (select c.id from public.catalogues c
                                    where c.user_id = (select private.current_user_id())));

-- `updated_at` is sent explicitly by the save path, because the conflict check compares
-- the caller's base against the stored value; a trigger that always set `now()` would
-- make the returned timestamp disagree with the one the client then sends back.
