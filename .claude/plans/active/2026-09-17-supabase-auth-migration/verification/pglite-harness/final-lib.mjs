// Shared helpers for executing the FINAL_PLAN.md Appendix A SQL (wf3) on the PGlite Supabase stub.
import fs from "node:fs";
import path from "node:path";
import { PGlite as PG17 } from "pglite17";
import { PGlite as PG18 } from "@electric-sql/pglite";
import { pageinspect as pi17 } from "pglite17/contrib/pageinspect";
import { pageinspect as pi18 } from "@electric-sql/pglite/contrib/pageinspect";
import {
	Db,
	SUPABASE_BOOTSTRAP,
	readAppMigrations,
	splitSql,
	stripAppStatement,
	errInfo,
} from "./lib.mjs";
import { LEGACY_SEED, IDS } from "./base.mjs";

export { IDS, splitSql };

export const FILES = {
	M00: "00_A.0_M00_perimeter_close.sql",
	M01: "01_A.1_M01_app_roles_private_schema.sql",
	M02: "02_A.2_M02_edge_functions_per_project.sql",
	M03: "03_A.3_M03_integrity_constraints_ai_ledger.sql",
	M04: "04_A.4_M04_app_role_grants_policies.sql",
	M05: "05_A.5_M05_private_entry_points.sql",
	M06: "06_A.6_M06_ai_turn_plan_binding.sql",
	M07: "07_A.7_M07_validate_after_audit.sql",
	M08: "08_A.8_M08_app_rls_login_role.sql",
	M09: "09_A.9_M09_edge_webhook_secret.sql",
	M10: "10_A.10_M10_auth_users_sync.sql",
	R1: "11_A.R1_remap-user-ids.sql",
	R2: "12_A.R2_rollback-remap.sql",
	M11: "13_A.11_M11_users_id_uuid_check.sql",
	M12: "14_A.12_M12_validate_users_id_uuid.sql",
	M13: "15_A.13_M13_post_cutover_cleanup.sql",
	A15: "17_A.15_preflight.sql",
	A16: "18_A.16_exposure-audit.sql",
};
for (const k of [
	"M00",
	"M01",
	"M02",
	"M03",
	"M04",
	"M05",
	"M06",
	"M07",
	"M08",
	"M10",
	"M12",
	"M13",
	"R1",
])
	FILES[`RB_${k}`] = `A.14_split/rollback_${k}.sql`;
FILES.RB_M09 = "A.14_split/rollback_M09.sql";

export class Sql {
	constructor(dir) {
		this.dir = dir;
	}
	text(key) {
		return fs.readFileSync(path.join(this.dir, FILES[key] ?? key), "utf8");
	}
	// text between a line starting with `from` (inclusive) and a line starting with `to` (exclusive)
	section(key, from, to) {
		const lines = this.text(key).split("\n");
		const a = lines.findIndex((l) => l.startsWith(from));
		const b = to
			? lines.findIndex((l, i) => i > a && l.startsWith(to))
			: lines.length;
		if (a < 0) throw new Error(`section ${from} not found in ${key}`);
		return lines.slice(a, b < 0 ? lines.length : b).join("\n");
	}
}

export const EXTRA_STUB = String.raw`
-- auth.identities (columns and owner as TEST, read-only 2026-09-17)
set session authorization supabase_auth_admin;
create table auth.identities (
  provider_id text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  identity_data jsonb not null,
  provider text not null,
  last_sign_in_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  email text generated always as (lower(identity_data ->> 'email')) stored,
  id uuid primary key default gen_random_uuid(),
  unique (provider_id, provider)
);
set session authorization supabase_admin;
alter table auth.users add column last_sign_in_at timestamptz, add column phone_confirmed_at timestamptz;
-- TEST: vault.secrets ACL postgres=r*d*D*x*/supabase_admin
grant select, delete, truncate, references on vault.secrets to postgres with grant option;
-- TEST: schema supabase_migrations owner postgres, table schema_migrations(version text, statements text[], name text)
create schema supabase_migrations authorization postgres;
set session authorization postgres;
create table supabase_migrations.schema_migrations (version text primary key, statements text[], name text);
insert into supabase_migrations.schema_migrations (version, name) values
  ('20260911213819', 'remote_schema'), ('20260911220341', 'add_user_themes'),
  ('20260912093000', 'lockdown_privileges_and_schema_fixes'), ('20260912203000', 'fix_newsletter_catalogue_fk_cascade');
set session authorization supabase_admin;
`;

export const EXTRA_SEED = `
-- C3: subscriber row injected with a forged owner (A) on B's catalogue, earliest of the case-variant group
insert into public.newsletter (id, email, catalogue_id, owner_id, created_at) values
  ('0e000000-0000-4000-8000-0000000000f0', 'SUB@X.IO', '${IDS.CAT.bLive}', '${IDS.A}', now() - interval '3 days');
-- Clerk-hosted avatars and an older cookie consent (R1 profile rules)
update public.users set image = 'https://img.clerk.com/eyJ.a', cookie_preferences = '{"analytics": false, "timestamp": "2026-01-01T00:00:00Z"}' where id = '${IDS.A}';
update public.users set image = 'https://img.clerk.com/eyJ.b' where id = '${IDS.B}';
`;

export class Env {
	constructor(ver, sqlDir) {
		this.ver = ver;
		this.PGlite = ver === "18" ? PG18 : PG17;
		this.pageinspect = ver === "18" ? pi18 : pi17;
		this.sql = new Sql(sqlDir);
	}
	async load(dump, { role = "postgres", pageinspect = false } = {}) {
		const opts = { loadDataDir: dump, username: "supabase_admin" };
		if (pageinspect) opts.extensions = { pageinspect: this.pageinspect };
		const pg = new this.PGlite(opts);
		await pg.waitReady;
		const db = new Db(pg, "x");
		await db.as(role);
		return db;
	}
	async buildBase(report) {
		const db = await Db.create(this.PGlite, { label: "base" });
		await db.exec(SUPABASE_BOOTSTRAP);
		await db.exec(EXTRA_STUB);
		await db.as("postgres");
		const appErrors = [];
		for (const mig of readAppMigrations()) {
			for (const st of splitSql(mig.text)) {
				if (stripAppStatement(st)) continue;
				try {
					await db.exec(st.sql);
				} catch (e) {
					appErrors.push({ file: mig.file, line: st.line, ...errInfo(e) });
				}
			}
			await db.exec("reset all");
		}
		await db.as("postgres");
		await db.exec(LEGACY_SEED);
		await db.exec(EXTRA_SEED);
		if (report) report.appErrors = appErrors;
		return db;
	}
}

// `supabase db push`: one transaction per migration file, as postgres
export async function applyTx(env, db, key, { role = "postgres", text } = {}) {
	const sts = splitSql(text ?? env.sql.text(key));
	await db.as(role);
	await db.exec("begin");
	for (const st of sts) {
		try {
			await db.exec(st.sql);
		} catch (e) {
			try {
				await db.exec("rollback");
			} catch {}
			await db.as(role);
			return {
				ok: false,
				key,
				line: st.line,
				stmt: st.body.replace(/\s+/g, " ").slice(0, 220),
				code: e.code,
				message: e.message,
			};
		}
	}
	await db.exec("commit");
	await db.as(role);
	return { ok: true, key };
}

// statement mode: every error, no transaction
export async function applyStatements(env, db, key, { text } = {}) {
	const errs = [];
	await db.as("postgres");
	for (const st of splitSql(text ?? env.sql.text(key))) {
		try {
			await db.exec(st.sql);
		} catch (e) {
			errs.push({
				key,
				line: st.line,
				stmt: st.body.replace(/\s+/g, " ").slice(0, 200),
				code: e.code,
				message: e.message,
			});
			try {
				await db.exec("rollback");
			} catch {}
		}
	}
	await db.as("postgres");
	return errs;
}

// psql -v ON_ERROR_STOP=1 -f script: meta-commands are psql-only; stop at first error; disconnect = rollback
export async function psql(env, db, key, { text } = {}) {
	const raw = text ?? env.sql.text(key);
	const meta = raw.split("\n").filter((l) => /^\\/.test(l));
	const body = raw
		.split("\n")
		.map((l) => (/^\\/.test(l) ? `-- psql meta-command: ${l}` : l))
		.join("\n");
	await db.as("postgres");
	for (const st of splitSql(body)) {
		try {
			await db.exec(st.sql);
		} catch (e) {
			try {
				await db.exec("rollback");
			} catch {}
			await db.as("postgres");
			return {
				ok: false,
				meta,
				line: st.line,
				stmt: st.body.replace(/\s+/g, " ").slice(0, 200),
				code: e.code,
				message: e.message,
			};
		}
	}
	await db.as("postgres");
	return { ok: true, meta };
}

export async function run(db, sql, params = []) {
	try {
		const r = await db.query(sql, params);
		return { ok: true, rows: r.rows, n: r.rows.length || r.affectedRows || 0 };
	} catch (e) {
		return { ok: false, code: e.code, msg: e.message };
	}
}
export async function runMany(db, sql) {
	try {
		const r = await db.exec(sql);
		return { ok: true, results: r.map((x) => x.rows), n: r.length };
	} catch (e) {
		return { ok: false, code: e.code, msg: e.message };
	}
}

// plan B.3 utils/db/rls.ts: one tx, one set_config statement incl. search_path
export const LIMITS = {
	app_user: ["8s", "3s", "10s"],
	app_public: ["3s", "1s", "5s"],
};
export const WRAPPER_SQL = `select
  pg_catalog.set_config('role', $1, true),
  pg_catalog.set_config('request.jwt.claims', $2, true),
  pg_catalog.set_config('search_path', 'public, pg_temp', true),
  pg_catalog.set_config('statement_timeout', $3, true),
  pg_catalog.set_config('lock_timeout', $4, true),
  pg_catalog.set_config('idle_in_transaction_session_timeout', $5, true)`;
export async function inRole(db, role, claims, fn, { commit = false } = {}) {
	if (role !== "app_user" && role !== "app_public")
		throw new Error("invalid app role");
	const [st, lk, idle] = LIMITS[role];
	await db.exec("begin");
	try {
		await db.query(WRAPPER_SQL, [
			role,
			JSON.stringify({ ...claims, role }),
			st,
			lk,
			idle,
		]);
		const v = await fn();
		await db.exec(commit ? "commit" : "rollback");
		return v;
	} catch (e) {
		try {
			await db.exec("rollback");
		} catch {}
		return { ok: false, code: e.code, msg: e.message };
	}
}
export const U = (db, sub, sql, params = [], opts) =>
	inRole(
		db,
		"app_user",
		sub == null ? {} : { sub },
		() => run(db, sql, params),
		opts,
	);
export const P = (db, sql, params = [], opts) =>
	inRole(db, "app_public", {}, () => run(db, sql, params), opts);
export async function REST(db, role, claims, sql, params = []) {
	const prev = db.session;
	await db.as("authenticator");
	await db.exec("begin");
	let out;
	try {
		await db.query(
			`select set_config('role', $1, true), set_config('request.jwt.claims', $2, true)`,
			[role, JSON.stringify(claims)],
		);
		out = await run(db, sql, params);
	} catch (e) {
		out = { ok: false, code: e.code, msg: e.message };
	}
	try {
		await db.exec("rollback");
	} catch {}
	await db.as(prev);
	return out;
}
export async function admin(db, sql, params = []) {
	const prev = db.session;
	await db.as("supabase_admin");
	const o = await run(db, sql, params);
	await db.as(prev);
	return o;
}
export async function as(db, role, sql, params = []) {
	const prev = db.session;
	await db.as(role);
	const o = await run(db, sql, params);
	await db.as(prev);
	return o;
}
// GoTrue: supabase_auth_admin login (search_path auth)
export async function gotrue(db, sql, params = []) {
	const prev = db.session;
	await db.as("supabase_auth_admin");
	const o = await run(db, sql, params);
	await db.as(prev);
	return o;
}
// GoTrue signUp / admin.createUser order: one tx, INSERT auth.users (user_metadata, app_metadata {}), then UPDATE raw_app_meta_data
export async function gotrueCreate(
	db,
	{
		id,
		email,
		userMeta = {},
		appMeta = { provider: "email", providers: ["email"] },
		confirmed = false,
		anonymous = false,
		phone = null,
	},
) {
	const prev = db.session;
	await db.as("supabase_auth_admin");
	let out;
	try {
		await db.exec("begin");
		await db.query(
			`insert into users (instance_id, id, aud, role, email, phone, email_confirmed_at, raw_user_meta_data, raw_app_meta_data, is_anonymous)
                    values ('00000000-0000-0000-0000-000000000000', $1, 'authenticated', 'authenticated', $2, $3, $4, $5, '{}'::jsonb, $6)`,
			[
				id,
				email,
				phone,
				confirmed ? new Date().toISOString() : null,
				JSON.stringify(userMeta),
				anonymous,
			],
		);
		await db.query(
			`update users set raw_app_meta_data = raw_app_meta_data || $2::jsonb where id = $1`,
			[id, JSON.stringify(appMeta)],
		);
		await db.exec("commit");
		out = { ok: true, rows: [], n: 1 };
	} catch (e) {
		try {
			await db.exec("rollback");
		} catch {}
		out = { ok: false, code: e.code, msg: e.message };
	}
	await db.as(prev);
	return out;
}

export const isErr = (o, code) =>
	!!o &&
	o.ok === false &&
	(Array.isArray(code) ? code.includes(o.code) : o.code === code);
export const rowsJson = (o) => (o && o.ok ? JSON.stringify(o.rows) : null);
export const col = (o, k) => (o && o.ok ? o.rows.map((r) => r[k]) : null);
export const eqArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
export function summarize(o) {
	if (o === undefined) return "undefined";
	if (o && typeof o === "object" && "ok" in o) {
		if (!o.ok)
			return `ERROR ${o.code}: ${o.msg ?? o.message}${o.line ? ` @line ${o.line}` : ""}`;
		if (o.rows)
			return `ok rows=${o.rows.length ? JSON.stringify(o.rows.slice(0, 6)) : "[]"} affected=${o.n}`;
		return "ok";
	}
	return typeof o === "string" ? o : JSON.stringify(o);
}
export const T = (r) =>
	r.ok
		? "ok"
		: `ERROR ${r.code}: ${r.message} @${r.key ?? ""} line ${r.line} :: ${r.stmt}`;
