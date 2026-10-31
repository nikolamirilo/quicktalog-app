-- catalogues.source recorded how a catalogue was first created ('builder', 'ocr_import',
-- 'ai_prompt'). Nothing reads it: no view, index, RLS policy or function depends on it, and
-- every row on TEST is 'builder'. The value is write-only history, so the column goes.
--
-- catalogues_source_check (20260929120000_schema_consistency.sql) and the column-level grants
-- from 20260921181104_app_role_grants_policies.sql (insert/select to app_user, select to
-- app_public) are dropped with the column; the table-level grants are untouched.
alter table public.catalogues drop column if exists source;
