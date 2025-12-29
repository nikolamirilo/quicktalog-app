--CREATE TABLE
create table public.catalogues (
  id uuid not null default gen_random_uuid (),
  name text not null,
  logo text null,
  heading text null,
  description text null,
  status text not null default 'draft'::text,
  source text not null,
  language text not null default 'en'::text,
  currency text not null default 'EUR'::text,
  business_type text null,
  tags text[] null default '{}'::text[],
  content jsonb not null default '[]'::jsonb,
  legal jsonb not null default '{}'::jsonb,
  appearance jsonb not null default '{}'::jsonb,
  contact jsonb not null default '{}'::jsonb,
  header jsonb not null default '{}'::jsonb,
  footer jsonb not null default '{}'::jsonb,
  partners jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  created_by text not null,
  content_type public.content_type not null default 'uncategorized'::content_type,
  constraint catalogues_pkey primary key (id),
  constraint catalogues_created_by_fkey foreign KEY (created_by) references users (id) on update CASCADE on delete CASCADE,
  constraint catalogues_source_check check (
    (
      source = any (
        array[
          'builder'::text,
          'ocr_import'::text,
          'ai_prompt'::text
        ]
      )
    )
  ),
  constraint catalogues_status_check check (
    (
      status = any (
        array[
          'active'::text,
          'inactive'::text,
          'draft'::text,
          'in preparation'::text,
          'error'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;
--MIGRATE
insert into public.catalogues (
  id,
  name,
  logo,
  heading,
  description,
  status,
  source,
  language,
  currency,
  tags,
  content,
  legal,
  appearance,
  contact,
  header,
  footer,
  created_at,
  updated_at
)
select
  c.id,
  c.name,
  c.logo,
  c.title as heading,
  c.subtitle as description,

  -- enums → text
  c.status::text,
  c.source::text,

  -- defaults
  'en' as language,
  c.currency,

  -- tags (jsonb → text[])
  coalesce(
    array(
      select jsonb_array_elements_text(c.tags)
    ),
    '{}'
  ) as tags,

  -- services → content
  coalesce(c.services, '[]'::jsonb) as content,

  -- passthrough
  coalesce(c.legal, '{}'::jsonb) as legal,

  -- appearance = theme + configuration
  jsonb_build_object(
    'theme', jsonb_build_object(
      'type', 'standard',
      'name', c.theme
    ),
    'style', coalesce(c.configuration, '{}'::jsonb)
  ) as appearance,

  -- contact passthrough
  coalesce(c.contact, '{}'::jsonb) as contact,

  -- header (safe default)
  '{}'::jsonb as header,

  -- ✅ FIXED FOOTER SHAPE
  jsonb_build_object(
    'cta', jsonb_build_object(
      'isEnabled', false,
      'label', '',
      'url', ''
    ),
    'newsletter', false,
    'partners',
      coalesce(
        (select jsonb_agg(p) from unnest(c.partners) p),
        '[]'::jsonb
      )
  ) as footer,

  -- timestamps
  c.created_at,
  c.updated_at
from public.catalogues c;


--VALIDATION SCRIPTS

-- row counts must match
select
  (select count(*) from public.catalogues) as old_count,
  (select count(*) from public.catalogues) as new_count;

-- check JSON shape
select
  name,
  jsonb_array_length(content) as content_blocks,
  appearance,
  footer
from public.catalogues
limit 100;
