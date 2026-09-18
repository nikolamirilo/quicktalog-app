-- M00: prefer rolling the app forward. If one missed anon path must work again while RLS stays on,
-- re-grant only that privilege and add a temporary permissive policy for it, for example:
grant select on public.catalogues to anon;
create policy tmp_rollback_anon_catalogues_select on public.catalogues for select to anon using (true);
notify pgrst, 'reload schema';
-- Never "disable row level security": once M04 exists that would let app_user read every row.
