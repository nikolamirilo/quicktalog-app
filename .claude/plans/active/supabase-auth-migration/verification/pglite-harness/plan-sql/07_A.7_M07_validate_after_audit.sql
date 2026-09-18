-- CHANGE C9 (PGlite-verified, final run: validates on clean data; a legacy bad slug or oversized row makes the
-- whole migration fail with 23514 and roll back).
-- Apply only after the A.15 audits return zero violations on that project. Kept separate from the perimeter
-- migration so a single oversized PROD row cannot roll back security changes.

alter table public.catalogues  validate constraint catalogues_content_size;
alter table public.user_themes validate constraint user_themes_colors_size;
alter table public.qr_configs  validate constraint qr_configs_config_size;
alter table public.users       validate constraint users_cookie_prefs_size;

-- Slugs are public URLs, Redis/rate-limit key parts and revalidate tags. TEST: all names match.
alter table public.catalogues add constraint catalogues_name_slug
  check (name ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and pg_catalog.length(name) <= 100) not valid;
alter table public.catalogues validate constraint catalogues_name_slug;

-- Row cap for the owner-writable jsonb/array columns that have no individual ceiling (limit is a product decision).
alter table public.catalogues add constraint catalogues_other_json_size
  check (  coalesce(pg_catalog.pg_column_size(appearance), 0) + coalesce(pg_catalog.pg_column_size(legal), 0)
         + coalesce(pg_catalog.pg_column_size(contact), 0)    + coalesce(pg_catalog.pg_column_size(header), 0)
         + coalesce(pg_catalog.pg_column_size(footer), 0)     + coalesce(pg_catalog.pg_column_size(partners), 0)
         + coalesce(pg_catalog.pg_column_size(metadata), 0)   + coalesce(pg_catalog.pg_column_size(tags), 0)
         < 1048576) not valid;
alter table public.catalogues validate constraint catalogues_other_json_size;
