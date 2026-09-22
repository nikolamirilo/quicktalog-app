// Shared helpers for the Quicktalog RLS PGlite harness.
// Emulates a Supabase project closely enough to execute rls.sql as the non-superuser `postgres` role.
import fs from "node:fs";
import path from "node:path";

export const APP_MIGRATIONS_DIR = new URL(
	"../../supabase/migrations",
	import.meta.url,
).pathname;

// ---------------------------------------------------------------------------------------------------
// SQL splitting (handles -- and /* */ comments, '' strings, "" identifiers, $tag$ dollar quotes)
// ---------------------------------------------------------------------------------------------------
export function stripComments(s) {
	let out = "";
	let i = 0;
	while (i < s.length) {
		const c = s[i];
		const c2 = s[i + 1];
		if (c === "-" && c2 === "-") {
			const j = s.indexOf("\n", i);
			i = j === -1 ? s.length : j;
			continue;
		}
		if (c === "/" && c2 === "*") {
			const j = s.indexOf("*/", i + 2);
			i = j === -1 ? s.length : j + 2;
			continue;
		}
		if (c === "'") {
			let j = i + 1;
			while (j < s.length) {
				if (s[j] === "'") {
					if (s[j + 1] === "'") {
						j += 2;
						continue;
					}
					break;
				}
				j++;
			}
			out += s.slice(i, j + 1);
			i = j + 1;
			continue;
		}
		if (c === "$") {
			const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(s.slice(i, i + 100));
			if (m && !/[A-Za-z0-9_]/.test(s[i - 1] || "")) {
				const j = s.indexOf(m[0], i + m[0].length);
				const end = j === -1 ? s.length : j + m[0].length;
				out += s.slice(i, end);
				i = end;
				continue;
			}
		}
		out += c;
		i++;
	}
	return out;
}

export function splitSql(text, baseLine = 1) {
	const out = [];
	let buf = "";
	let startIdx = 0;
	let i = 0;
	const n = text.length;
	const lineAt = (idx) =>
		baseLine + (text.slice(0, idx).match(/\n/g) || []).length;
	const push = (endIdx) => {
		const body = stripComments(buf).trim();
		if (body && body !== ";") {
			// line of first non-comment, non-space char
			let k = startIdx;
			const lead = text.slice(startIdx, endIdx);
			const firstReal = lead.search(/^(?!\s*--)\s*\S/m);
			k = startIdx + Math.max(0, firstReal);
			// skip leading comment lines
			const leadLines = lead.split("\n");
			let offset = 0;
			for (const ln of leadLines) {
				if (ln.trim() === "" || ln.trim().startsWith("--")) {
					offset += ln.length + 1;
					continue;
				}
				break;
			}
			out.push({ sql: buf.trim(), body, line: lineAt(startIdx + offset) });
		}
		buf = "";
		startIdx = endIdx;
	};
	while (i < n) {
		const c = text[i];
		const c2 = text[i + 1];
		if (c === "-" && c2 === "-") {
			const j = text.indexOf("\n", i);
			const end = j === -1 ? n : j;
			buf += text.slice(i, end);
			i = end;
			continue;
		}
		if (c === "/" && c2 === "*") {
			const j = text.indexOf("*/", i + 2);
			const end = j === -1 ? n : j + 2;
			buf += text.slice(i, end);
			i = end;
			continue;
		}
		if (c === "'") {
			let j = i + 1;
			while (j < n) {
				if (text[j] === "'") {
					if (text[j + 1] === "'") {
						j += 2;
						continue;
					}
					break;
				}
				j++;
			}
			buf += text.slice(i, j + 1);
			i = j + 1;
			continue;
		}
		if (c === '"') {
			const j = text.indexOf('"', i + 1);
			buf += text.slice(i, j + 1);
			i = j + 1;
			continue;
		}
		if (c === "$") {
			const m = /^\$([A-Za-z_][A-Za-z0-9_]*)?\$/.exec(text.slice(i, i + 100));
			if (m && !/[A-Za-z0-9_]/.test(text[i - 1] || "")) {
				const j = text.indexOf(m[0], i + m[0].length);
				const end = j === -1 ? n : j + m[0].length;
				buf += text.slice(i, end);
				i = end;
				continue;
			}
		}
		if (c === ";") {
			buf += ";";
			i++;
			push(i);
			continue;
		}
		buf += c;
		i++;
	}
	push(n);
	return out;
}

// Split rls.sql into sections by "-- MIGRATION" / "-- RUNBOOK" markers.
export function parseSections(text) {
	const lines = text.split("\n");
	const sections = [];
	let cur = null;
	lines.forEach((ln, idx) => {
		const m = /^-- (MIGRATION|RUNBOOK) (\S+)/.exec(ln);
		if (m) {
			cur = { kind: m[1], name: m[2], startLine: idx + 1, lines: [] };
			sections.push(cur);
		}
		if (cur) cur.lines.push(ln);
	});
	return sections.map((s) => ({
		...s,
		text: s.lines.join("\n"),
		statements: splitSql(s.lines.join("\n"), s.startLine),
	}));
}

// ---------------------------------------------------------------------------------------------------
// Supabase stub
// ---------------------------------------------------------------------------------------------------
export const SUPABASE_BOOTSTRAP = String.raw`
-- rename the PGlite bootstrap superuser to supabase_admin, then create a NON-superuser postgres
create role tmp_su superuser login;
set session authorization tmp_su;
alter role postgres rename to supabase_admin;
set session authorization supabase_admin;
drop role tmp_su;

create role postgres login createrole bypassrls inherit;
alter role postgres set search_path = "$user", public, extensions;
create role anon nologin inherit;
create role authenticated nologin inherit;
create role service_role nologin inherit bypassrls;
create role authenticator login noinherit;
create role supabase_auth_admin login noinherit createrole;
create role supabase_storage_admin login noinherit createrole;
create role supabase_realtime_admin nologin noinherit;
create role dashboard_user nologin createrole;
create role pgbouncer login;
create role supabase_privileged_role nologin;
alter role anon set statement_timeout = '3s';
alter role authenticated set statement_timeout = '8s';

grant anon, authenticated, service_role, authenticator to postgres with admin option, inherit true, set true;
grant anon, authenticated, service_role to authenticator with inherit false, set true;
grant anon, authenticated, service_role to supabase_realtime_admin with inherit false, set true;
grant authenticator to supabase_storage_admin with inherit false, set true;
grant pg_read_all_data, pg_monitor, pg_signal_backend to postgres with admin option;
grant supabase_privileged_role to postgres with inherit true, set true;

do $$ begin execute format('alter database %I owner to postgres', current_database()); end $$;

-- public schema (PG15+: owner pg_database_owner)
grant usage on schema public to postgres, anon, authenticated, service_role;
alter default privileges for role supabase_admin in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges for role supabase_admin in schema public grant all on functions to postgres, anon, authenticated, service_role;
alter default privileges for role supabase_admin in schema public grant all on sequences to postgres, anon, authenticated, service_role;

create schema extensions authorization postgres;
grant usage on schema extensions to anon, authenticated, service_role;

-- pg_net stub (records calls instead of sending). ACLs copied from TEST (read-only, 2026-09-16):
--   schema net owner supabase_admin, ACL includes =U (PUBLIC USAGE)
--   net.http_post(text,jsonb,jsonb,jsonb,integer): proacl NULL (PUBLIC EXECUTE), prosecdef = false
--   net.http_request_queue / net._http_response: =arwdDxtm (PUBLIC has ALL), sequence =rwU
create schema net;
grant usage on schema net to public;
create table net.http_request_queue (id bigserial primary key, method text not null default 'POST', url text, headers jsonb, body bytea, timeout_milliseconds int);
grant all on table net.http_request_queue to public;
grant all on sequence net.http_request_queue_id_seq to public;
create table net._http_response (id bigint, status_code int, content text, created timestamptz default now());
grant all on table net._http_response to public;
create view net._http_calls as
  select id, url, headers, convert_from(body, 'UTF8')::jsonb as body, timeout_milliseconds as timeout_ms from net.http_request_queue;
create function net.http_post(url text, body jsonb default '{}'::jsonb, params jsonb default '{}'::jsonb,
                              headers jsonb default '{"Content-Type":"application/json"}'::jsonb, timeout_milliseconds integer default 5000)
returns bigint language plpgsql security invoker as $f$
declare v bigint;
begin
  insert into net.http_request_queue (url, headers, body, timeout_milliseconds)
  values (url, headers, convert_to(body::text, 'UTF8'), timeout_milliseconds)
  returning id into v;
  return v;
end $f$;

-- supabase_vault stub
create schema vault;
grant usage on schema vault to postgres with grant option;
create table vault.secrets (id uuid primary key default gen_random_uuid(), name text unique, secret text);
create view vault.decrypted_secrets as select id, name, secret as decrypted_secret from vault.secrets;
grant select, delete on vault.decrypted_secrets to postgres with grant option;
grant select, delete on vault.decrypted_secrets to service_role;

-- pg_cron stub
create schema cron;
grant usage on schema cron to postgres with grant option;
create table cron.job (jobid bigserial primary key, jobname text unique, schedule text, command text, username text default current_user);
grant select on cron.job to postgres;
create function cron.schedule(job_name text, schedule text, command text) returns bigint language plpgsql security definer set search_path = '' as $f$
declare v bigint; u text := session_user::text;
begin
  insert into cron.job (jobname, schedule, command, username) values (job_name, schedule, command, u)
  on conflict (jobname) do update set schedule = excluded.schedule, command = excluded.command, username = excluded.username
  returning jobid into v;
  return v;
end $f$;
grant execute on function cron.schedule(text, text, text) to postgres with grant option;
insert into pg_catalog.pg_extension (oid, extname, extowner, extnamespace, extrelocatable, extversion)
  values (99999, 'pg_cron', 10, 11, false, '1.6-stub');

-- auth schema (owner supabase_admin; ACL as TEST)
create schema auth authorization supabase_admin;
grant usage on schema auth to anon, authenticated, service_role, dashboard_user, postgres;
grant all on schema auth to supabase_auth_admin;
alter default privileges for role supabase_auth_admin in schema auth grant all on tables to postgres, dashboard_user;
alter default privileges for role supabase_auth_admin in schema auth grant all on functions to postgres, dashboard_user;

set session authorization supabase_auth_admin;
create table auth.users (
  instance_id uuid,
  id uuid not null primary key,
  aud varchar(255),
  role varchar(255),
  email varchar(255),
  encrypted_password varchar(255),
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb,
  raw_user_meta_data jsonb,
  is_super_admin boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  phone text default null,
  banned_until timestamptz,
  is_sso_user boolean not null default false,
  deleted_at timestamptz,
  is_anonymous boolean not null default false
);
alter table auth.users enable row level security;
create function auth.uid() returns uuid language sql stable as $f$
  select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid $f$;
create function auth.jwt() returns jsonb language sql stable as $f$
  select coalesce(nullif(current_setting('request.jwt.claim', true), ''),
                  nullif(current_setting('request.jwt.claims', true), ''))::jsonb $f$;
create function auth.role() returns text language sql stable as $f$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''),
                  (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'))::text $f$;
grant all on auth.users to postgres;
grant select on auth.users to postgres with grant option;
set session authorization supabase_admin;

create publication supabase_realtime;
alter publication supabase_realtime owner to postgres;
`;

// ---------------------------------------------------------------------------------------------------
// PGlite wrapper with session tracking, notice capture and error normalisation
// ---------------------------------------------------------------------------------------------------
export class Db {
	constructor(pg, label) {
		this.pg = pg;
		this.label = label;
		this.notices = [];
		this.session = "supabase_admin";
	}
	static async create(PGlite, { label, dump } = {}) {
		const pg = dump
			? new PGlite({ loadDataDir: dump, username: "supabase_admin" })
			: new PGlite();
		await pg.waitReady;
		const db = new Db(pg, label);
		return db;
	}
	onNotice = (n) => {
		this.notices.push({ severity: n.severity, message: n.message });
	};
	async exec(sql) {
		return this.pg.exec(sql, { onNotice: this.onNotice });
	}
	async query(sql, params = []) {
		return this.pg.query(sql, params, { onNotice: this.onNotice });
	}
	async rows(sql, params = []) {
		return (await this.query(sql, params)).rows;
	}
	async one(sql, params = []) {
		return (await this.query(sql, params)).rows[0];
	}
	async as(role) {
		await this.exec(`set session authorization ${role}`);
		// SET SESSION AUTHORIZATION does not apply ALTER ROLE ... SET, but a real login does. Emulate a login:
		// reset all, apply the role's rolconfig (from the DB, so migrations like 07 are honoured), and fall back to
		// the login search_path read from TEST pg_db_role_setting (2026-09-16) for roles the stub does not configure.
		await this.exec("reset all");
		const SP = {
			postgres: `"\\$user", public, extensions`,
			supabase_admin: `"$user", public, auth, extensions`,
			supabase_auth_admin: `auth`,
			supabase_storage_admin: `storage`,
			supabase_realtime_admin: `public, extensions, realtime`,
		};
		const cfg =
			(
				await this.pg.query(
					`select coalesce(rolconfig, '{}') c from pg_catalog.pg_roles where rolname = $1`,
					[role],
				)
			).rows[0]?.c ?? [];
		let hasSp = false;
		for (const kv of cfg) {
			const i = kv.indexOf("=");
			const k = kv.slice(0, i),
				v = kv.slice(i + 1);
			if (k === "search_path") hasSp = true;
			if (["session_preload_libraries", "log_statement"].includes(k)) continue;
			await this.pg.query(`select pg_catalog.set_config($1, $2, false)`, [
				k,
				v,
			]);
		}
		if (!hasSp)
			await this.exec(`set search_path = ${SP[role] ?? `"$user", public`}`);
		this.session = role;
	}
	async try(fn) {
		try {
			return { ok: true, value: await fn() };
		} catch (e) {
			return {
				ok: false,
				code: e.code,
				message: e.message,
				detail: e.detail,
				hint: e.hint,
			};
		}
	}
	async dump() {
		return this.pg.dumpDataDir("none");
	}
	async close() {
		await this.pg.close();
	}
}

export function errInfo(e) {
	return {
		code: e.code,
		message: e.message,
		detail: e.detail,
		hint: e.hint,
		where: e.where,
	};
}

/**
 * Repo migrations that this harness applies itself, as the phases of the plan.
 * The key is the migration key used by the scenarios; the value is the suffix
 * of the migration file name. Everything NOT listed here is the baseline the
 * scenarios start from.
 */
export const PHASE_MIGRATIONS = {
	M00: "perimeter_close",
	M01: "app_roles_private_schema",
	M02: "edge_functions_per_project",
	M03: "integrity_constraints_ai_ledger",
	M04: "app_role_grants_policies",
	M05: "private_entry_points",
	M06: "ai_turn_plan_binding",
	M07: "validate_after_audit",
};

const phaseSuffixes = Object.values(PHASE_MIGRATIONS).map((n) => `_${n}.sql`);
const isPhaseMigration = (file) => phaseSuffixes.some((s) => file.endsWith(s));

/** Absolute path of the repo migration for a phase key, or null. */
export function phaseMigrationPath(key) {
	const suffix = PHASE_MIGRATIONS[key];
	if (!suffix) return null;
	const file = fs
		.readdirSync(APP_MIGRATIONS_DIR)
		.filter((f) => f.endsWith(`_${suffix}.sql`))
		.sort()
		.pop();
	return file ? path.join(APP_MIGRATIONS_DIR, file) : null;
}

export function readAppMigrations() {
	return fs
		.readdirSync(APP_MIGRATIONS_DIR)
		.filter((f) => f.endsWith(".sql") && !isPhaseMigration(f))
		.sort()
		.map((f) => ({
			file: f,
			text: fs.readFileSync(path.join(APP_MIGRATIONS_DIR, f), "utf8"),
		}));
}

// Statements PGlite/the stub cannot run as-is (recorded in the report).
export function stripAppStatement(stmt) {
	const b = stmt.body.replace(/\s+/g, " ").trim();
	if (/^CREATE EXTENSION/i.test(b))
		return "extension pre-provisioned by the Supabase stub (pg_cron/pg_net/vault stubs; pgcrypto/uuid-ossp/pg_stat_statements not needed)";
	return null;
}
