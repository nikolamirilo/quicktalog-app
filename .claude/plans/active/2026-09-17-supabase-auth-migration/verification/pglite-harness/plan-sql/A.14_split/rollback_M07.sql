-- M07:
alter table public.catalogues drop constraint if exists catalogues_name_slug;
alter table public.catalogues drop constraint if exists catalogues_other_json_size;
-- (size checks stay; validation is harmless)
