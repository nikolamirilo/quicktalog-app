-- M08: set DB_CONNECTION_STRING back to postgres.<ref>, redeploy, wait for drain, then:
select pg_catalog.pg_terminate_backend(pid) from pg_catalog.pg_stat_activity where usename = 'app_rls';
drop role if exists app_rls;
