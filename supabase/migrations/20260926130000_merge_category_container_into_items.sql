-- Merge the `category` and `container` content blocks into a single `items` block.
--
-- A category was an items section with a heading; a container was one without.
-- The merged block carries `showHeading`, so:
--   category  -> showHeading true,  isExpanded preserved (default true)
--   container -> showHeading false, isExpanded true
--
-- A container's `name` was stored but never rendered - it labelled the section in
-- the builder only - so it is kept and `showHeading` is set false. That is what
-- makes an already-published page render identically after this runs.
--
-- Idempotent: only rows still holding a legacy key are touched, and re-running
-- finds none. The app also normalizes these keys at read time, so a Redis-cached
-- draft written before this migration stays correct.

update catalogues c
set content = merged.content
from (
  select
    c2.id,
    coalesce(
      jsonb_agg(
        case
          -- Anything that is not an object is left exactly as found; the content
          -- column has never been validated, so it may hold surprises.
          when jsonb_typeof(block) <> 'object' then block
          when block->>'type' in ('category', 'container') then
            block || jsonb_build_object(
              'type', 'items',
              'showHeading', block->>'type' = 'category',
              'isExpanded',
                case
                  when block->>'type' = 'container' then to_jsonb(true)
                  when jsonb_typeof(block->'isExpanded') = 'boolean'
                    then block->'isExpanded'
                  else to_jsonb(true)
                end,
              'name',
                case
                  when jsonb_typeof(block->'name') = 'string' then block->'name'
                  else to_jsonb(''::text)
                end,
              'layout',
                case
                  when jsonb_typeof(block->'layout') = 'string' then block->'layout'
                  else to_jsonb('variant_1'::text)
                end,
              'items',
                case
                  when jsonb_typeof(block->'items') = 'array' then block->'items'
                  else '[]'::jsonb
                end
            )
          else block
        end
        order by ordinality
      ),
      '[]'::jsonb
    ) as content
  from catalogues c2
  cross join lateral jsonb_array_elements(c2.content)
    with ordinality as t(block, ordinality)
  where jsonb_typeof(c2.content) = 'array'
    and (
      c2.content @> '[{"type":"category"}]'::jsonb
      or c2.content @> '[{"type":"container"}]'::jsonb
    )
  group by c2.id
) as merged
where c.id = merged.id;

-- Verification (expects 0):
--   select count(*) from catalogues
--   where content @> '[{"type":"category"}]'::jsonb
--      or content @> '[{"type":"container"}]'::jsonb;
