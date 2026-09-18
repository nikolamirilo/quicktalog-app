// Quicktalog RLS executable verification (PGlite).
// usage: node run.mjs <rls file> <pg version 17|18> <out json>
import fs from "node:fs";
import { PGlite as PG17 } from "pglite17";
import { PGlite as PG18 } from "@electric-sql/pglite";
import { Db, parseSections } from "./lib.mjs";
import { buildBase, IDS } from "./base.mjs";
import { applySectionStatementMode, applySectionTxMode } from "./apply.mjs";
import { makeApp, pgError, isUniqueViolation } from "./drizzle-app.mjs";

const RLS_FILE = process.argv[2] ?? "rls.patched.sql";
const VER = process.argv[3] ?? "17";
const OUT = process.argv[4] ?? `results-${VER}.json`;
const PGlite = VER === "18" ? PG18 : PG17;
const sections = parseSections(fs.readFileSync(RLS_FILE, "utf8"));
const sec = (prefix) =>
	sections.find((s) => s.kind === prefix || s.name.startsWith(prefix));

const R = {
	file: RLS_FILE,
	pg: VER,
	sqlErrors: [],
	txMode: [],
	stripped: [],
	appErrors: [],
	scenarios: [],
	notes: [],
};
let group = "";
function check(scenario, expected, outcome, pass, extra = {}) {
	const actual = summarize(outcome);
	R.scenarios.push({
		group,
		scenario,
		expected,
		actual,
		pass: !!pass,
		...extra,
	});
}
function summarize(o) {
	if (o === undefined) return "undefined";
	if (o && typeof o === "object" && "ok" in o) {
		if (!o.ok) return `ERROR ${o.code}: ${o.msg}`;
		const rows = o.rows?.length ? JSON.stringify(o.rows.slice(0, 6)) : "[]";
		return `ok rows=${rows} affected=${o.n}`;
	}
	return typeof o === "string" ? o : JSON.stringify(o);
}

// ---- execution helpers -------------------------------------------------------------------------------
async function run(db, sql, params = []) {
	try {
		const r = await db.query(sql, params);
		return { ok: true, rows: r.rows, n: r.rows.length || r.affectedRows || 0 };
	} catch (e) {
		return { ok: false, code: e.code, msg: e.message };
	}
}
const LIMITS = {
	app_user: ["8s", "3s", "10s"],
	app_public: ["3s", "1s", "5s"],
};
const WRAPPER_SQL = `select
  pg_catalog.set_config('role', $1, true),
  pg_catalog.set_config('request.jwt.claims', $2, true),
  pg_catalog.set_config('statement_timeout', $3, true),
  pg_catalog.set_config('lock_timeout', $4, true),
  pg_catalog.set_config('idle_in_transaction_session_timeout', $5, true)`;
// Exact emulation of utils/db/rls.ts inRole(): one tx, one parameterised set_config statement.
async function inRole(db, role, claims, fn, { commit = false } = {}) {
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
const U = (db, sub, sql, params = [], opts) =>
	inRole(
		db,
		"app_user",
		sub == null ? {} : { sub },
		() => run(db, sql, params),
		opts,
	);
const P = (db, sql, params = [], opts) =>
	inRole(db, "app_public", {}, () => run(db, sql, params), opts);
// PostgREST emulation: authenticator session, SET LOCAL ROLE + claims GUC.
async function REST(db, role, claims, sql, params = []) {
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
const isErr = (o, code) => o && o.ok === false && o.code === code;
const rowsJson = (o) => (o && o.ok ? JSON.stringify(o.rows) : null);
const col = (o, k) => (o && o.ok ? o.rows.map((r) => r[k]) : null);
const eqArr = (a, b) => JSON.stringify(a) === JSON.stringify(b);
async function admin(db, sql, params = []) {
	const prev = db.session;
	await db.as("supabase_admin");
	const o = await run(db, sql, params);
	await db.as(prev);
	return o;
}
async function load(dump) {
	const db = await Db.create(PGlite, { dump });
	await db.as("postgres");
	return db;
}

// ---- build phases -------------------------------------------------------------------------------------
const base = await buildBase(PGlite, R);
R.stripped = base.constructor === Db ? R.appMigrationStripped : [];
const S_base = await base.dump();

// statement mode (all errors, original ordering) on a throwaway copy
{
	const db = await load(S_base);
	for (const s of sections.filter(
		(s) => s.kind === "MIGRATION" && s.name < "09",
	))
		R.sqlErrors.push(...(await applySectionStatementMode(db, s)));
	await db.close();
}
// tx mode, snapshot after each phase
const snaps = {};
{
	const db = await load(S_base);
	for (const s of sections.filter(
		(s) => s.kind === "MIGRATION" && s.name < "09",
	)) {
		const r = await applySectionTxMode(db, s);
		R.txMode.push({ name: s.name, ...r });
		if (s.name.startsWith("05")) snaps.p1 = await db.dump();
		if (s.name.startsWith("06")) snaps.p3 = await db.dump();
		if (s.name.startsWith("07")) snaps.p4 = await db.dump();
		if (s.name.startsWith("08")) snaps.p5 = await db.dump();
	}
	await db.close();
}

// ======================================================================================================
group = "G0 migration mechanics";
// ======================================================================================================
for (const t of R.txMode)
	check(
		`apply ${t.name} as one transaction (supabase CLI style) as postgres`,
		"ok",
		t.ok ? "ok" : `ERROR ${t.code}: ${t.message} @line ${t.line}`,
		t.ok,
	);
check(
	"statement-by-statement apply of 01..08: SQL errors",
	"0 errors",
	`${R.sqlErrors.length} errors`,
	R.sqlErrors.length === 0,
);

{
	// re-run 01
	const db = await load(snaps.p1);
	const r = await applySectionTxMode(db, sec("01"));
	check(
		"re-apply 01 on a project where the roles/schema already exist (idempotency)",
		"ok",
		r.ok ? "ok" : `ERROR ${r.code}: ${r.message}`,
		r.ok,
	);
	await db.close();
}
{
	// roles pre-created by supabase_admin
	const db = await load(S_base);
	await admin(db, "create role app_user nologin noinherit nobypassrls; ");
	await admin(db, "create role app_public nologin noinherit nobypassrls");
	const r = await applySectionTxMode(db, sec("01"));
	check(
		"01 when app_user/app_public already exist but postgres has no ADMIN OPTION on them (e.g. created by a superuser)",
		"migration stops with an actionable message naming the GRANT a superuser must run (the rls.sql:78-83 comment claims a CREATEROLE user can always GRANT, which PG16+ refuses)",
		r.ok ? "ok" : `ERROR ${r.code}: ${r.message} @line ${r.line}`,
		!r.ok && /ADMIN OPTION/.test(r.message ?? ""),
		{ severity: "low" },
	);
	await db.close();
}
{
	// 01..05 applied as supabase_admin (superuser) instead of postgres
	const db = await load(S_base);
	await db.as("supabase_admin");
	let err = null;
	for (const s of sections.filter(
		(s) => s.kind === "MIGRATION" && s.name < "06",
	)) {
		await db.exec("begin");
		for (const st of s.statements) {
			try {
				await db.exec(st.sql);
			} catch (e) {
				err = `${s.name}@${st.line}: ${e.code} ${e.message}`;
				break;
			}
		}
		await db.exec(err ? "rollback" : "commit");
		await db.exec("reset all");
		if (err) break;
	}
	const owners = await run(
		db,
		`select (select nspowner::regrole::text from pg_namespace where nspname='private') schema_owner,
     (select relowner::regrole::text from pg_class where oid='private.settings'::regclass) settings_owner,
     (select relowner::regrole::text from pg_class where oid='private.paddle_events'::regclass) paddle_owner`,
	);
	await run(
		db,
		`insert into private.settings(key, value) values ('edge_functions_base_url','https://x.supabase.co/functions/v1')`,
	);
	await db.as("postgres");
	const paddle = await run(
		db,
		`insert into private.paddle_events (event_id, event_type, occurred_at) values ('evt_1','subscription.updated', now()) on conflict do nothing`,
	);
	const brevo = await run(
		db,
		`update public.users set name = 'Renamed' where id = $1`,
		[IDS.A],
	);
	check(
		"01..05 applied by supabase_admin instead of postgres (only if the CLI connects as supabase_admin - unverified): asAdmin can use private.paddle_events and the Brevo trigger can read private.settings",
		"both ok",
		`apply=${err ?? "ok"}; owners=${rowsJson(owners)}; paddle=${summarize(paddle)}; users update=${summarize(brevo)}`,
		!err && paddle.ok && brevo.ok,
		{ severity: "medium" },
	);
	await db.close();
}
{
	// 02 seeding + Brevo trigger narrowing + cron command
	const b64u = (s) =>
		Buffer.from(s)
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/, "");
	let payload = {
		iss: "supabase",
		ref: "abcdefghijklmnopqrst",
		role: "service_role",
		pad: "",
	};
	for (let i = 0; i < 200 && !/[-_]/.test(b64u(JSON.stringify(payload))); i++)
		payload.pad += String.fromCharCode(0x3e + (i % 3)) + "ÿ";
	const jwt = `${b64u('{"alg":"HS256","typ":"JWT"}')}.${b64u(JSON.stringify(payload))}.c2lnbmF0dXJl`;
	const db = await load(S_base);
	await admin(
		db,
		`insert into vault.secrets (name, secret) values ('service_role_key', $1)`,
		[jwt],
	);
	const r1 = await applySectionTxMode(db, sec("01"));
	const r2 = await applySectionTxMode(db, sec("02"));
	const url = await run(
		db,
		`select value from private.settings where key = 'edge_functions_base_url'`,
	);
	check(
		"02 seeds edge_functions_base_url from a base64url JWT (contains -/_ and no padding) in Vault",
		"https://abcdefghijklmnopqrst.supabase.co/functions/v1",
		`apply01=${r1.ok} apply02=${r2.ok} jwt-payload-has-url-chars=${/[-_]/.test(jwt.split(".")[1])} value=${rowsJson(url)}`,
		r1.ok &&
			r2.ok &&
			col(url, "value")?.[0] ===
				"https://abcdefghijklmnopqrst.supabase.co/functions/v1",
	);
	await admin(db, "truncate net.http_request_queue");
	await run(
		db,
		`update public.users set cookie_preferences = '{"a":1}' where id = $1`,
		[IDS.A],
	);
	const c0 = await admin(db, "select count(*)::int n from net._http_calls");
	await run(db, `update public.users set name = 'Alice2' where id = $1`, [
		IDS.A,
	]);
	const c1 = await admin(
		db,
		"select url, headers->>'Authorization' like 'Bearer %' as bearer, body->>'id' as id from net._http_calls",
	);
	check(
		"Brevo trigger does not fire on cookie_preferences update, fires once on name update with this project's URL",
		"0 calls, then 1 call to https://abcdefghijklmnopqrst.supabase.co/functions/v1/create-brevo-contact",
		`after cookie update=${rowsJson(c0)}; after name update=${rowsJson(c1)}`,
		col(c0, "n")[0] === 0 &&
			c1.ok &&
			c1.rows.length === 1 &&
			c1.rows[0].url ===
				"https://abcdefghijklmnopqrst.supabase.co/functions/v1/create-brevo-contact" &&
			c1.rows[0].bearer,
	);
	await admin(db, "truncate net.http_request_queue");
	const job = await admin(
		db,
		"select command, username from cron.job where jobname = 'Sync Plans'",
	);
	const runJob = await run(db, job.rows[0].command);
	const c2 = await admin(db, "select url from net._http_calls");
	check(
		"'Sync Plans' cron command (as job owner postgres) posts to this project's URL",
		"1 call to .../sync-available-plans",
		`owner=${job.rows[0].username}; run=${summarize(runJob)}; calls=${rowsJson(c2)}`,
		runJob.ok &&
			col(c2, "url")?.[0] ===
				"https://abcdefghijklmnopqrst.supabase.co/functions/v1/sync-available-plans",
	);
	await db.close();

	const db2 = await load(S_base);
	await admin(
		db2,
		`insert into vault.secrets (name, secret) values ('service_role_key', 'sb_secret_abc123')`,
	);
	await applySectionTxMode(db2, sec("01"));
	await applySectionTxMode(db2, sec("02"));
	db2.notices = [];
	const u = await run(db2, `update public.users set name = 'x' where id = $1`, [
		IDS.A,
	]);
	const calls = await admin(db2, "select count(*)::int n from net._http_calls");
	const jobRun = await run(
		db2,
		(await admin(db2, "select command from cron.job")).rows[0].command,
	);
	const calls2 = await admin(
		db2,
		"select count(*)::int n from net._http_calls",
	);
	check(
		"02 with an sb_secret_ Vault key (not a JWT): no URL seeded -> users update still succeeds, trigger warns and skips, cron posts nothing",
		"update ok, 0 calls, WARNING logged",
		`update=${summarize(u)}; calls=${rowsJson(calls)}; cron=${summarize(jobRun)} calls=${rowsJson(calls2)}; notices=${JSON.stringify(db2.notices.map((n) => n.severity + ": " + n.message))}`,
		u.ok &&
			col(calls, "n")[0] === 0 &&
			col(calls2, "n")[0] === 0 &&
			db2.notices.some((n) => n.severity === "WARNING"),
	);
	await db2.close();
}
{
	// 03 data effects
	const db = await load(snaps.p1);
	const nl = await admin(
		db,
		`select id, email from public.newsletter where catalogue_id = $1 order by id`,
		[IDS.CAT.bLive],
	);
	const nlb = await admin(db, `select id from private.backup_newsletter_dupes`);
	check(
		"03 newsletter dedupe keeps earliest case-variant row and backs up the rest",
		"kept ...0001 Sub@x.io; backup ...0002",
		`kept=${rowsJson(nl)} backup=${rowsJson(nlb)}`,
		eqArr(col(nl, "id"), ["0e000000-0000-4000-8000-000000000001"]) &&
			eqArr(col(nlb, "id"), ["0e000000-0000-4000-8000-000000000002"]),
	);
	const qr = await admin(
		db,
		`select id from public.qr_configs where catalogue = 'a-live'`,
	);
	const qrb = await admin(
		db,
		`select id from private.backup_qr_configs_dupes order by id`,
	);
	check(
		"03 qr_configs dedupe keeps the most recently updated row (NULL updated_at loses)",
		"kept ...0002; backup ...0001, ...0003",
		`kept=${rowsJson(qr)} backup=${rowsJson(qrb)}`,
		eqArr(col(qr, "id"), ["0d000000-0000-4000-8000-000000000002"]) &&
			eqArr(col(qrb, "id"), [
				"0d000000-0000-4000-8000-000000000001",
				"0d000000-0000-4000-8000-000000000003",
			]),
	);
	const pn = await admin(
		db,
		`select lower(email) e, count(*)::int n from public.product_newsletter group by 1 order by 1`,
	);
	check(
		"03 product_newsletter dedupe (case-insensitive)",
		"p@x.io 1, q@x.io 1",
		rowsJson(pn),
		rowsJson(pn) ===
			JSON.stringify([
				{ e: "p@x.io", n: 1 },
				{ e: "q@x.io", n: 1 },
			]),
	);
	const pr = await admin(
		db,
		`select (select count(*)::int from public.prompts where user_id is null) nulls, (select count(*)::int from private.backup_prompts_null_user) backup,
      (select count(*)::int from public.ocr where user_id is null) ocr_nulls, (select count(*)::int from private.backup_ocr_null_user) ocr_backup,
      (select string_agg(conname||':'||confdeltype::text, ',' order by conname) from pg_constraint where conrelid in ('public.prompts'::regclass,'public.ocr'::regclass) and contype='f' and confrelid='public.catalogues'::regclass) fks,
      (select count(*)::int from pg_constraint where conrelid='public.prompts'::regclass and contype='u') uniques,
      (select attnotnull from pg_attribute where attrelid='public.prompts'::regclass and attname='turn_id') turn_id_not_null`,
	);
	check(
		"03 AI ledger: null-user rows backed up+removed, catalogue FKs ON DELETE SET NULL, UNIQUE(catalogue) gone, turn_id NOT NULL",
		"nulls 0, backup 1, ocr_nulls 0, ocr_backup 1, fks n, uniques 0, turn_id not null",
		rowsJson(pr),
		rowsJson(pr) ===
			JSON.stringify([
				{
					nulls: 0,
					backup: 1,
					ocr_nulls: 0,
					ocr_backup: 1,
					fks: "ocr_catalogue_fkey:n,prompts_catalogue_fkey:n",
					uniques: 0,
					turn_id_not_null: true,
				},
			]),
	);
	// pg_column_size semantics for the size CHECKs
	const big1 = await run(
		db,
		`insert into public.catalogues (name, created_by, tags, content) values ('big-compressible', $1, '{}', jsonb_build_array(repeat('a', 1500000)))`,
		[IDS.A],
	);
	const big2 = await run(
		db,
		`insert into public.catalogues (name, created_by, tags, content) values ('big-random', $1, '{}', (select jsonb_agg(md5(i::text) || md5((i*7)::text)) from generate_series(1, 20000) i))`,
		[IDS.A],
	);
	check(
		"size CHECK on catalogues.content for a NEW highly compressible 1.5 MB value (design: raw size is checked)",
		"23514 (raw size > 1 MiB)",
		summarize(big1),
		isErr(big1, "23514"),
		{ note: "settles rls-design.md s.10 item 10 (unverified)" },
	);
	check(
		"size CHECK on catalogues.content for a NEW ~1.3 MB low-compressibility value",
		"23514",
		summarize(big2),
		isErr(big2, "23514"),
	);
	await db.close();
}

// ======================================================================================================
group = "G1 phase 1 (01-05 applied, 06 not yet): today's code keeps working";
// ======================================================================================================
{
	const db = await load(snaps.p1);
	const anonCat = await REST(
		db,
		"anon",
		{ role: "anon" },
		`select name, created_by from public.catalogues order by name`,
	);
	check(
		"legacy anon supabase-js path (/api/items) still reads catalogues",
		"4 rows (drafts included, as today)",
		anonCat,
		anonCat.ok && anonCat.rows.length === 4,
	);
	const anonUsers = await REST(
		db,
		"anon",
		{ role: "anon" },
		`update public.users set plan_id = $1 where id = $2 returning id`,
		[IDS.PRO, IDS.A],
	);
	check(
		"legacy anon grants still allow self-upgrade of plan_id until 06 (known issue, closed by 06)",
		"ok 1 row (vulnerability persists until 06)",
		anonUsers,
		anonUsers.ok && anonUsers.n === 1,
		{ severity: "info" },
	);
	const meter = await run(
		db,
		`insert into public.prompts (user_id, catalogue) values ($1, 'a-draft'), ($1, 'a-draft') returning turn_id is not null as has_turn`,
		[IDS.A],
	);
	check(
		"today's meter() insert (no turn_id, repeated catalogue) as postgres",
		"ok 2 rows, turn_id defaulted",
		meter,
		meter.ok && meter.n === 2 && meter.rows.every((r) => r.has_turn),
	);
	const nlDup = await run(
		db,
		`insert into public.newsletter (email, catalogue_id, owner_id) values ('SUB@x.io', $1, $2)`,
		[IDS.CAT.bLive, IDS.B],
	);
	check(
		"today's newsletterSignup insert of a case-variant duplicate as postgres",
		"23505 (behaviour change documented in rls-design s.2)",
		nlDup,
		isErr(nlDup, "23505"),
	);
	const leakCat = await U(
		db,
		IDS.A,
		`select name from public.catalogues order by name`,
	);
	check(
		"Phase 1/2 window (01-05 applied, 06 not yet): converted withUser code, A reads catalogues",
		"only a-draft, a-live (owner policy effective as soon as withUser code ships)",
		leakCat,
		leakCat.ok && eqArr(col(leakCat, "name"), ["a-draft", "a-live"]),
		{ severity: "high", finding: "phase-window" },
	);
	const leakUpd = await U(
		db,
		IDS.A,
		`update public.users set name = 'pwned' where id = $1`,
		[IDS.B],
	);
	check(
		"Phase 1/2 window: converted withUser code, A updates B's users.name",
		"0 rows",
		leakUpd,
		leakUpd.ok && leakUpd.n === 0,
		{ severity: "high", finding: "phase-window" },
	);
	const leakDel = await U(
		db,
		IDS.A,
		`delete from public.catalogues where name = 'b-live' returning name`,
	);
	check(
		"Phase 1/2 window: converted deleteMultipleItems-style DELETE by id/name of B's catalogue as A",
		"0 rows",
		leakDel,
		leakDel.ok && leakDel.n === 0,
		{ severity: "high", finding: "phase-window" },
	);
	const leakNl = await U(
		db,
		IDS.A,
		`select email from public.newsletter where owner_id <> $1`,
		[IDS.A],
	);
	check(
		"Phase 1/2 window: A reads other owners' newsletter subscribers",
		"0 rows",
		leakNl,
		leakNl.ok && leakNl.n === 0,
		{ severity: "high", finding: "phase-window" },
	);
	const legacyAnonIns = await REST(
		db,
		"anon",
		{ role: "anon" },
		`insert into public.users (id, email, plan_id) values ('user_legacyclerkwebhook1', 'l@x.io', $1) on conflict (id) do update set email = excluded.email returning id`,
		[IDS.PLAN],
	);
	const legacyAnonSub = await REST(
		db,
		"anon",
		{ role: "anon" },
		`insert into public.subscriptions (subscription_id, subscription_status, price_id, customer_id) values ('sub_b', 'active', $1, 'ctm_b') on conflict (subscription_id) do update set subscription_status = excluded.subscription_status returning 1`,
		[IDS.PRO],
	);
	const legacyAnonAn = await REST(
		db,
		"anon",
		{ role: "anon" },
		`select count(*)::int n from public.analytics where user_id = $1`,
		[IDS.A],
	);
	const legacyAnonNl = await REST(
		db,
		"anon",
		{ role: "anon" },
		`select count(*)::int n from public.newsletter where owner_id = $1`,
		[IDS.B],
	);
	const legacyAnonJob = await REST(
		db,
		"anon",
		{ role: "anon" },
		`insert into public.job_logs (job_name, status) values ('x', 'ok')`,
	);
	const legacyAnonDel = await REST(
		db,
		"anon",
		{ role: "anon" },
		`delete from public.users where id = $1 returning id`,
		[IDS.C],
	);
	check(
		"Phase 1: today's legacy anon supabase-js paths still work (Clerk webhook upsert/delete, Paddle subscriptions upsert, dashboard analytics/newsletter counts, job_logs insert)",
		"all ok, 1 row each for writes, counts > 0",
		[
			legacyAnonIns,
			legacyAnonSub,
			legacyAnonAn,
			legacyAnonNl,
			legacyAnonJob,
			legacyAnonDel,
		]
			.map(summarize)
			.join(" | "),
		legacyAnonIns.ok &&
			legacyAnonIns.n === 1 &&
			legacyAnonSub.ok &&
			legacyAnonSub.n === 1 &&
			legacyAnonAn.ok &&
			legacyAnonAn.rows[0].n > 0 &&
			legacyAnonNl.ok &&
			legacyAnonNl.rows[0].n > 0 &&
			legacyAnonJob.ok &&
			legacyAnonDel.ok &&
			legacyAnonDel.n === 1,
	);
	const qr = await U(
		db,
		IDS.A,
		`select catalogue from public.qr_configs order by 1`,
	);
	check(
		"app_user A on qr_configs (RLS already on in 04)",
		"only a-live",
		qr,
		eqArr(col(qr, "catalogue"), ["a-live"]),
	);
	await db.close();
}

// ======================================================================================================
group =
	"G2 target state (06 applied), Clerk text ids, withUser/withPublic emulation";
// ======================================================================================================
const A = IDS.A,
	B = IDS.B;
async function ownerMatrix(dbSnap, a, b, label) {
	const db = await load(dbSnap);
	const g = (s) => `[${label}] ${s}`;
	// users
	let o = await U(db, a, `select id from public.users order by id`);
	check(g("users: A selects users"), "only A", o, eqArr(col(o, "id"), [a]));
	for (const [c, v] of [
		["plan_id", IDS.PRO],
		["customer_id", "ctm_x"],
		["email", "x@y.z"],
		["consents", "{}"],
		["id", "hijack"],
		["image", "https://x"],
		["created_at", "2000-01-01"],
	]) {
		o = await U(db, a, `update public.users set ${c} = $1 where id = $2`, [
			v,
			a,
		]);
		check(g(`users: A updates own ${c}`), "42501", o, isErr(o, "42501"));
	}
	o = await U(db, a, `update public.users set name = 'x' where id = $1`, [b]);
	check(g("users: A updates B's name"), "0 rows", o, o.ok && o.n === 0);
	o = await U(
		db,
		a,
		`update public.users set cookie_preferences = '{"analytics":true}' where id = $1 returning id`,
		[a],
	);
	check(
		g("users: A updates own cookie_preferences"),
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await U(
		db,
		a,
		`update public.users set cookie_preferences = jsonb_build_object('x', repeat('y', 3000)) where id = $1`,
		[a],
	);
	check(g("users: cookie_preferences > 2 KiB"), "23514", o, isErr(o, "23514"));
	o = await U(
		db,
		a,
		`select plan_id from public.users where id = $1 for update`,
		[a],
	);
	check(
		g("users: getPlanForUpdate SELECT ... FOR UPDATE own row"),
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await U(
		db,
		a,
		`select plan_id from public.users where id = $1 for update`,
		[b],
	);
	check(
		g("users: SELECT ... FOR UPDATE on B's row"),
		"0 rows",
		o,
		o.ok && o.n === 0,
	);
	o = await U(
		db,
		a,
		`insert into public.users (id, plan_id) values ('evil', $1)`,
		[IDS.PLAN],
	);
	check(g("users: A inserts a users row"), "42501", o, isErr(o, "42501"));
	o = await U(db, a, `delete from public.users where id = $1`, [b]);
	check(
		g("users: A deletes B (cascade-delete attack)"),
		"42501",
		o,
		isErr(o, "42501"),
	);

	// catalogues
	o = await U(db, a, `select name from public.catalogues order by name`);
	check(
		g("catalogues: A selects all"),
		"a-draft, a-live (not b-live)",
		o,
		eqArr(col(o, "name"), ["a-draft", "a-live"]),
	);
	o = await U(
		db,
		a,
		`update public.catalogues set heading = 'x' where name = 'b-live' returning 1`,
	);
	check(
		g("catalogues: A updates B's active catalogue"),
		"0 rows",
		o,
		o.ok && o.n === 0,
	);
	o = await U(
		db,
		a,
		`delete from public.catalogues where name = 'b-draft' returning 1`,
	);
	check(g("catalogues: A deletes B's draft"), "0 rows", o, o.ok && o.n === 0);
	for (const [c, v] of [
		["created_by", b],
		["name", "renamed"],
		["id", "00000000-0000-4000-8000-000000000000"],
		["created_at", "2000-01-01"],
		["source", "x"],
	]) {
		o = await U(
			db,
			a,
			`update public.catalogues set ${c} = $1 where name = 'a-draft'`,
			[v],
		);
		check(
			g(`catalogues: A sets ${c} on own catalogue (mass assignment)`),
			"42501",
			o,
			isErr(o, "42501"),
		);
	}
	o = await U(
		db,
		a,
		`update public.catalogues set heading = 'ok', content = '[{"t":1}]' where name = 'a-draft' and created_by = $1 returning name, updated_at > created_at as touched`,
		[a],
	);
	check(
		g("catalogues: A updates own editable fields (returning)"),
		"1 row, updated_at touched",
		o,
		o.ok && o.n === 1 && o.rows[0].touched,
	);
	o = await U(
		db,
		a,
		`update public.catalogues set status = 'bogus' where name = 'a-draft'`,
	);
	check(g("catalogues: invalid status"), "23514", o, isErr(o, "23514"));
	o = await U(
		db,
		a,
		`update public.catalogues set status = 'active' where name = 'a-draft' returning status`,
	);
	check(
		g("catalogues: publish own draft (status active via UPDATE)"),
		"1 row (traffic/plan checks are TS, by design)",
		o,
		o.ok && o.n === 1,
	);
	o = await U(
		db,
		a,
		`insert into public.catalogues (name, created_by, status, tags) values ('a-new-live', $1, 'active', '{}')`,
		[a],
	);
	check(
		g("catalogues: A inserts status active"),
		"42501 (WITH CHECK)",
		o,
		isErr(o, "42501"),
	);
	o = await U(
		db,
		a,
		`insert into public.catalogues (name, created_by, tags) values ('a-foreign', $1, '{}')`,
		[b],
	);
	check(
		g("catalogues: A inserts created_by = B"),
		"42501 (WITH CHECK)",
		o,
		isErr(o, "42501"),
	);
	o = await U(
		db,
		a,
		`insert into public.catalogues (id, name, logo, heading, status, source, language, currency, business_type, content, legal, appearance, contact, header, footer, partners, created_at, updated_at, created_by, metadata, tags)
      values ('00000000-0000-4000-8000-000000000000', 'a-new', default, default, default, default, default, default, default, default, default, default, default, default, default, default, '2000-01-01', '2000-01-01', $1, default, '{}')
      returning id <> '00000000-0000-4000-8000-000000000000'::uuid as id_pinned, created_at > '2001-01-01' as created_pinned, status`,
		[a],
	);
	check(
		g(
			"catalogues: Drizzle-shaped INSERT (every column, `default`, client id/created_at) + RETURNING",
		),
		"1 row; id and created_at pinned by trigger; status draft",
		o,
		o.ok &&
			o.rows[0]?.id_pinned &&
			o.rows[0]?.created_pinned &&
			o.rows[0]?.status === "draft",
	);
	o = await U(
		db,
		a,
		`insert into public.catalogues (name, created_by, status, tags, content, footer)
      select 'a-live-copy', created_by, 'draft', tags, content, footer from public.catalogues where name = 'a-live' and created_by = $1 returning name`,
		[a],
	);
	check(
		g("catalogues: duplicateItem (INSERT ... SELECT own row as draft)"),
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await U(
		db,
		a,
		`insert into public.catalogues (name, created_by, status, tags) select 'b-copy', $1, 'draft', tags from public.catalogues where name = 'b-live'`,
		[a],
	);
	check(
		g("catalogues: duplicate B's catalogue (source row invisible)"),
		"0 rows inserted",
		o,
		o.ok && o.n === 0,
	);
	o = await U(
		db,
		a,
		`update public.catalogues set created_by = $2, id = gen_random_uuid(), heading = 'x' where name = 'a-live' and created_by = $1`,
		[a, b],
	);
	check(
		g("catalogues: publishCatalogue mass-assignment of createdBy/id"),
		"42501",
		o,
		isErr(o, "42501"),
	);
	o = await U(
		db,
		a,
		`update public.catalogues set content = (select jsonb_agg(md5(i::text) || md5((i * 7)::text)) from generate_series(1, 20000) i) where name = 'a-draft'`,
	);
	check(g("catalogues: content > 1 MiB"), "23514", o, isErr(o, "23514"));
	o = await U(
		db,
		a,
		`insert into public.catalogues (name, created_by, tags) values ('a-live', $1, '{}')`,
		[a],
	);
	check(
		g("catalogues: insert with a taken slug"),
		"23505 catalogues_new_name_key",
		o,
		isErr(o, "23505"),
	);
	// delete keeps usage rows
	o = await inRole(db, "app_user", { sub: a }, async () => {
		await db.exec(`savepoint s`);
		const d = await run(
			db,
			`delete from public.catalogues where name = 'a-draft' returning name`,
		);
		await db.exec("reset role");
		const after = await run(
			db,
			`select (select count(*)::int from public.prompts where user_id = $1) prompts, (select count(*)::int from public.prompts where user_id = $1 and catalogue is null) prompts_null_cat,
        (select count(*)::int from public.ocr where user_id = $1) ocr, (select count(*)::int from public.analytics where user_id = $1) analytics`,
			[a],
		);
		return {
			ok: d.ok && after.ok,
			rows: [{ deleted: d.rows, ...(after.rows?.[0] ?? {}) }],
			n: 1,
			code: d.code ?? after.code,
			msg: d.msg ?? after.msg,
		};
	});
	check(
		g(
			"catalogues: A deletes own a-draft; usage rows survive (prompts catalogue set NULL)",
		),
		"deleted a-draft; prompts rows kept with catalogue NULL; analytics kept",
		o,
		o.ok &&
			o.rows[0].deleted?.length === 1 &&
			o.rows[0].prompts >= 1 &&
			o.rows[0].prompts_null_cat >= 1 &&
			o.rows[0].analytics === 2,
	);
	for (const [lbl, claims] of [
		["claims {} (no sub)", {}],
		["sub ''", { sub: "" }],
	]) {
		o = await inRole(db, "app_user", claims, () =>
			run(db, `select name from public.catalogues`),
		);
		check(
			g(`catalogues: fail closed with ${lbl}`),
			"0 rows",
			o,
			o.ok && o.n === 0,
		);
	}

	// app_public
	o = await P(db, `select name from public.catalogues order by name`);
	check(
		g("app_public: select name from catalogues"),
		"a-live, b-live",
		o,
		eqArr(col(o, "name"), ["a-live", "b-live"]),
	);
	o = await P(db, `select * from public.catalogues`);
	check(
		g("app_public: select * (created_by not granted)"),
		"42501",
		o,
		isErr(o, "42501"),
	);
	o = await P(db, `select created_by from public.catalogues`);
	check(g("app_public: select created_by"), "42501", o, isErr(o, "42501"));
	o = await P(
		db,
		`select id, name, logo, heading, status, source, language, currency, business_type, content, legal, appearance, contact, header, footer, partners, metadata, tags, created_at, updated_at from public.catalogues where name = $1`,
		["b-live"],
	);
	check(
		g("app_public: PUBLIC_CATALOGUE_COLUMNS select of an active catalogue"),
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await P(db, `select id from public.catalogues where name = 'a-draft'`);
	check(g("app_public: draft by name"), "0 rows", o, o.ok && o.n === 0);
	for (const sql of [
		`insert into public.catalogues (name, created_by, tags) values ('p', 'x', '{}')`,
		`update public.catalogues set heading = 'x'`,
		`delete from public.catalogues`,
	]) {
		o = await P(db, sql);
		check(
			g(`app_public: ${sql.split(" ").slice(0, 3).join(" ")}`),
			"42501",
			o,
			isErr(o, "42501"),
		);
	}
	for (const t of [
		"users",
		"newsletter",
		"prompts",
		"ocr",
		"analytics",
		"qr_configs",
		"user_themes",
		"subscriptions",
		"plans",
		"job_logs",
		"product_newsletter",
		"contacts",
		"active_subscriptions",
	]) {
		o = await P(db, `select 1 from public.${t} limit 1`);
		check(g(`app_public: select from ${t}`), "42501", o, isErr(o, "42501"));
	}
	for (const f of [
		`private.catalogue_name_available('x')`,
		`private.my_usage()`,
		`private.begin_ai_turn('a-live', 1, false)`,
		`private.refund_ai_turn(gen_random_uuid())`,
		`private.current_user_id()`,
	]) {
		o = await P(db, `select ${f}`);
		check(g(`app_public: select ${f}`), "42501", o, isErr(o, "42501"));
	}
	o = await P(db, `select * from private.settings`);
	check(g("app_public: private.settings"), "42501", o, isErr(o, "42501"));

	// newsletter signups (commit, then inspect as admin)
	const sub = (id, email) =>
		P(
			db,
			`select private.subscribe_catalogue_newsletter($1::uuid, $2)`,
			[id, email],
			{ commit: true },
		);
	await admin(
		db,
		`delete from public.newsletter where catalogue_id = $1 and lower(email) like 'foo@%'`,
		[IDS.CAT.bLive],
	);
	const s1 = await sub(IDS.CAT.bLive, "  Foo@Example.com ");
	const s2 = await sub(IDS.CAT.bLive, "  Foo@Example.com ");
	const s3 = await sub(IDS.CAT.bLive, "foo@example.com");
	o = await admin(
		db,
		`select email, owner_id from public.newsletter where catalogue_id = $1 and lower(email) = 'foo@example.com'`,
		[IDS.CAT.bLive],
	);
	check(
		g(
			"newsletter: app_public signup x3 (case/space variants) to active+enabled b-live",
		),
		`3 calls ok; exactly 1 row email foo@example.com owner ${b}`,
		`calls=${[s1, s2, s3].map(summarize).join(" | ")}; rows=${rowsJson(o)}`,
		s1.ok &&
			s2.ok &&
			s3.ok &&
			rowsJson(o) ===
				JSON.stringify([{ email: "foo@example.com", owner_id: b }]),
	);
	const before = (
		await admin(db, `select count(*)::int n from public.newsletter`)
	).rows[0].n;
	const outs = [];
	outs.push(await sub(IDS.CAT.bDraft, "draft@x.io"));
	outs.push(await sub(IDS.CAT.aLive, "disabled@x.io"));
	outs.push(await sub(IDS.CAT.aDraft, "draft-enabled@x.io"));
	outs.push(await sub(IDS.CAT.bLive, "not-an-email"));
	outs.push(await sub(IDS.CAT.bLive, "a".repeat(290) + "@x.io"));
	outs.push(await sub("99999999-0000-4000-8000-000000000000", "rand@x.io"));
	outs.push(await sub(IDS.CAT.bLive, "sub@X.IO"));
	outs.push(await sub(IDS.CAT.bLive, null));
	const after = (
		await admin(db, `select count(*)::int n from public.newsletter`)
	).rows[0].n;
	check(
		g(
			"newsletter: draft / disabled / invalid email / 300-char / random uuid / existing case-variant / null -> silent no-op",
		),
		"8 calls ok, 0 new rows",
		`calls=${outs.map((x) => (x.ok ? "ok" : x.code)).join(",")}; new rows=${after - before}`,
		outs.every((x) => x.ok) && after === before,
	);
	o = await P(
		db,
		`select private.subscribe_catalogue_newsletter('not-a-uuid', 'x@y.io')`,
	);
	check(
		g("newsletter: malformed catalogue id"),
		"22P02 raised by the ::uuid cast (TS must validate/catch to keep a constant response)",
		o,
		isErr(o, "22P02"),
		{ severity: "low" },
	);
	o = await P(
		db,
		`insert into public.newsletter (email, catalogue_id, owner_id) values ('spoof@x.io', $1, $2)`,
		[IDS.CAT.bLive, a],
	);
	check(
		g("newsletter: app_public direct insert with spoofed owner_id"),
		"42501",
		o,
		isErr(o, "42501"),
	);
	o = await U(
		db,
		a,
		`insert into public.newsletter (email, catalogue_id, owner_id) values ('spoof@x.io', $1, $2)`,
		[IDS.CAT.aLive, a],
	);
	check(g("newsletter: app_user direct insert"), "42501", o, isErr(o, "42501"));
	const pb = (
		await admin(db, `select count(*)::int n from public.product_newsletter`)
	).rows[0].n;
	const p1 = await P(
		db,
		`select private.subscribe_product_newsletter('X@y.io')`,
		[],
		{ commit: true },
	);
	const p2 = await P(
		db,
		`select private.subscribe_product_newsletter('x@Y.io ')`,
		[],
		{ commit: true },
	);
	const p3 = await P(
		db,
		`select private.subscribe_product_newsletter('P@X.io')`,
		[],
		{ commit: true },
	);
	const pa = (
		await admin(db, `select count(*)::int n from public.product_newsletter`)
	).rows[0].n;
	check(
		g("product newsletter: X@y.io, x@Y.io, existing P@X.io"),
		"all ok; +1 row",
		`${[p1, p2, p3].map(summarize).join(" | ")}; delta=${pa - pb}`,
		p1.ok && p2.ok && p3.ok && pa - pb === 1,
	);

	// name availability
	for (const [lbl, sb, arg, exp] of [
		["B's draft slug", a, "b-draft", false],
		["free slug", a, "free-slug-123", true],
		["own slug", a, "a-live", false],
		["empty string", a, "", false],
		["null", a, null, false],
		["free slug with no sub", null, "free-slug-123", false],
	]) {
		o = await U(db, sb, `select private.catalogue_name_available($1) as ok`, [
			arg,
		]);
		check(
			g(`name availability: ${lbl}`),
			String(exp),
			o,
			o.ok && o.rows[0].ok === exp,
		);
	}
	o = await U(
		db,
		a,
		`select id, created_by from public.catalogues where name = 'b-draft'`,
	);
	check(
		g("name availability leaks nothing else: A cannot read B's draft row"),
		"0 rows",
		o,
		o.ok && o.n === 0,
	);

	// qr_configs
	o = await U(
		db,
		a,
		`insert into public.qr_configs (catalogue, config) values ('a-draft', '{}') returning id`,
	);
	check(g("qr_configs: insert for own a-draft"), "1 row", o, o.ok && o.n === 1);
	o = await U(
		db,
		a,
		`insert into public.qr_configs (catalogue, config) values ('b-draft', '{}')`,
	);
	check(
		g("qr_configs: insert for B's b-draft"),
		"42501 (WITH CHECK)",
		o,
		isErr(o, "42501"),
	);
	o = await U(
		db,
		a,
		`insert into public.qr_configs (catalogue, config) values ('b-live', '{"x":1}') on conflict (catalogue) do update set config = excluded.config, updated_at = now()`,
	);
	check(
		g("qr_configs: upsert onto B's existing b-live row"),
		"42501 (UPDATE USING violation raises)",
		o,
		isErr(o, "42501"),
	);
	o = await U(
		db,
		a,
		`select * from public.qr_configs where catalogue = 'b-live'`,
	);
	check(g("qr_configs: select B's"), "0 rows", o, o.ok && o.n === 0);
	o = await U(
		db,
		a,
		`delete from public.qr_configs where catalogue = 'b-live'`,
	);
	check(g("qr_configs: delete B's"), "0 rows", o, o.ok && o.n === 0);
	o = await U(
		db,
		a,
		`insert into public.qr_configs (catalogue, config) values ('a-live', '{"v":2}') on conflict (catalogue) do update set config = excluded.config, updated_at = now() returning config`,
	);
	check(
		g("qr_configs: upsertQrConfig on own existing row"),
		"1 row config v=2",
		o,
		o.ok && o.rows[0]?.config?.v === 2,
	);
	o = await U(
		db,
		a,
		`update public.qr_configs set catalogue = 'b-live' where catalogue = 'a-live'`,
	);
	check(
		g("qr_configs: move own config to B's catalogue"),
		"42501 (column not granted)",
		o,
		isErr(o, "42501"),
	);
	o = await inRole(db, "app_user", { sub: a }, async () => {
		const x = await run(
			db,
			`insert into public.qr_configs (catalogue, config) values ('a-draft', '{}')`,
		);
		if (!x.ok) return x;
		return run(
			db,
			`insert into public.qr_configs (catalogue, config) values ('a-draft', '{}')`,
		);
	});
	check(
		g("qr_configs: second row for the same catalogue"),
		"23505",
		o,
		isErr(o, "23505"),
	);

	// user_themes
	o = await U(
		db,
		a,
		`insert into public.user_themes (user_id, name, colors) values ($1, 't9', '{}')`,
		[b],
	);
	check(g("user_themes: insert for B"), "42501", o, isErr(o, "42501"));
	o = await inRole(db, "app_user", { sub: a }, async () => {
		for (let i = 0; i < 2; i++) {
			const x = await run(
				db,
				`insert into public.user_themes (user_id, name, colors) values ($1, 'mine', $2) on conflict (user_id, name) do update set colors = excluded.colors`,
				[a, JSON.stringify({ i })],
			);
			if (!x.ok) return x;
		}
		return run(
			db,
			`select colors from public.user_themes where user_id = $1 and name = 'mine'`,
			[a],
		);
	});
	check(
		g("user_themes: persistTheme upsert twice"),
		"1 row, colors {i:1}",
		o,
		o.ok && o.n === 1 && o.rows[0].colors.i === 1,
	);
	o = await U(
		db,
		a,
		`update public.user_themes set colors = '{}' where user_id = $1`,
		[b],
	);
	check(g("user_themes: update B's"), "0 rows", o, o.ok && o.n === 0);
	o = await U(
		db,
		a,
		`update public.user_themes set user_id = $1 where user_id = $2`,
		[b, a],
	);
	check(
		g("user_themes: reassign own theme to B"),
		"42501 (column not granted)",
		o,
		isErr(o, "42501"),
	);
	o = await U(db, a, `select name from public.user_themes`);
	check(
		g("user_themes: select"),
		"own only (t1)",
		o,
		eqArr(col(o, "name"), ["t1"]),
	);

	// ledgers & subscribers
	for (const [t, ownerCol] of [
		["analytics", "user_id"],
		["prompts", "user_id"],
		["ocr", "user_id"],
		["newsletter", "owner_id"],
	]) {
		o = await U(
			db,
			a,
			`select count(*)::int n, count(*) filter (where ${ownerCol} <> $1)::int foreign from public.${t}`,
			[a],
		);
		check(
			g(`${t}: select`),
			"only own rows (foreign = 0)",
			o,
			o.ok && o.rows[0].foreign === 0 && o.rows[0].n > 0,
		);
		for (const sql of [
			`insert into public.${t} default values`,
			`update public.${t} set ${ownerCol} = ${ownerCol}`,
			`delete from public.${t}`,
		]) {
			o = await U(db, a, sql);
			check(g(`${t}: ${sql.split(" ")[0]}`), "42501", o, isErr(o, "42501"));
		}
	}
	for (const t of [
		"subscriptions",
		"plans",
		"job_logs",
		"product_newsletter",
		"contacts",
		"active_subscriptions",
		"private.settings",
		"private.paddle_events",
		"private.backup_prompts_null_user",
	]) {
		const qn = t.includes(".") ? t : `public.${t}`;
		o = await U(db, a, `select 1 from ${qn} limit 1`);
		check(g(`app_user: select from ${qn}`), "42501", o, isErr(o, "42501"));
	}
	for (const sql of [
		`truncate public.catalogues`,
		`create table public.x (a int)`,
		`create function private.x() returns int language sql as 'select 1'`,
		`select public.call_edge_function_with_vault_secret()`,
		`select private.display_name_from_meta('{}')`,
	]) {
		o = await U(db, a, sql);
		check(
			g(`app_user: ${sql}`),
			"42501 (or not found / trigger-only)",
			o,
			o.ok === false && ["42501", "0A000", "42883"].includes(o.code),
		);
	}
	await db.close();
}

await ownerMatrix(snaps.p3, A, B, "clerk ids");

{
	// usage + AI ledger (clerk ids)
	const db = await load(snaps.p3);
	await run(db, `delete from public.prompts`);
	await run(
		db,
		`insert into public.prompts (user_id, catalogue, datetime, refunded_at) values ($1,'a-draft', now(), null), ($1,'a-draft', now(), now()), ($1,'a-draft', now() - interval '40 days', null), ($2,'b-live', now(), null)`,
		[A, B],
	);
	let o = await U(db, A, `select * from private.my_usage()`);
	check(
		"my_usage for A (catalogues, this-month unrefunded prompts, ocr, pageviews, uniques)",
		"{catalogues:2, prompts:1, ocr:1, pageviews:10, unique_visitors:4}",
		o,
		rowsJson(o) ===
			JSON.stringify([
				{
					catalogues: 2,
					prompts: 1,
					ocr: 1,
					pageviews: 10,
					unique_visitors: 4,
				},
			]),
	);
	o = await inRole(db, "app_user", {}, () =>
		run(db, `select catalogues from private.my_usage()`),
	);
	check("my_usage with no sub", "0", o, o.ok && o.rows[0].catalogues === 0);
	await run(db, `delete from public.prompts`);
	const bt = (sub, cat, limit, cont, opts = { commit: true }) =>
		U(
			db,
			sub,
			`select outcome, ai_turn_id from private.begin_ai_turn($1, $2, $3)`,
			[cat, limit, cont],
			opts,
		);
	const rf = (sub, id) =>
		U(db, sub, `select private.refund_ai_turn($1::uuid) as refunded`, [id], {
			commit: true,
		});
	o = await bt(A, "b-draft", 5, false);
	check(
		"begin_ai_turn on B's catalogue",
		"not_found",
		o,
		o.ok && o.rows[0].outcome === "not_found",
	);
	const c1 = await bt(A, "a-draft", 2, false);
	const c2 = await bt(A, "a-draft", 2, false);
	check(
		"begin_ai_turn x2 within limit 2",
		"charged, charged",
		`${summarize(c1)} | ${summarize(c2)}`,
		c1.rows?.[0]?.outcome === "charged" && c2.rows?.[0]?.outcome === "charged",
	);
	o = await bt(A, "a-draft", 2, false);
	check(
		"begin_ai_turn third with limit 2",
		"limit",
		o,
		o.ok && o.rows[0].outcome === "limit",
	);
	const cont = await bt(A, "a-draft", 2, true);
	check(
		"continuation at limit with a recent charged turn",
		"continued (free), turn id = one of the charged ids",
		cont,
		cont.ok &&
			cont.rows[0].outcome === "continued" &&
			[c1.rows[0].ai_turn_id, c2.rows[0].ai_turn_id].includes(
				cont.rows[0].ai_turn_id,
			),
	);
	const forged = await bt(A, "a-live", 5, true);
	check(
		"forged continuation on a catalogue with no prior turn",
		"charged",
		forged,
		forged.ok && forged.rows[0].outcome === "charged",
	);
	o = await rf(A, cont.rows[0].ai_turn_id);
	check(
		"refund a turn that has continuations",
		"false",
		o,
		o.ok && o.rows[0].refunded === false,
	);
	const r1 = await rf(A, forged.rows[0].ai_turn_id);
	const r2 = await rf(A, forged.rows[0].ai_turn_id);
	check(
		"refund own no-op turn, then again",
		"true, then false",
		`${summarize(r1)} | ${summarize(r2)}`,
		r1.rows?.[0]?.refunded === true && r2.rows?.[0]?.refunded === false,
	);
	o = await bt(A, "a-live", 3, false);
	check(
		"refunded row no longer counts (2 used, limit 3)",
		"charged",
		o,
		o.ok && o.rows[0].outcome === "charged",
	);
	const bTurn = await bt(B, "b-live", 5, false);
	o = await rf(A, bTurn.rows[0].ai_turn_id);
	check("A refunds B's turn", "false", o, o.ok && o.rows[0].refunded === false);
	const old = await bt(A, "a-live", 99, false);
	await run(
		db,
		`update public.prompts set datetime = now() - interval '11 minutes' where turn_id = $1`,
		[old.rows[0].ai_turn_id],
	);
	o = await rf(A, old.rows[0].ai_turn_id);
	check(
		"refund outside the 10-minute window",
		"false",
		o,
		o.ok && o.rows[0].refunded === false,
	);
	await run(
		db,
		`update public.prompts set continuations = 9 where user_id = $1 and catalogue = 'a-draft'`,
		[A],
	);
	o = await bt(A, "a-draft", 99, true);
	check(
		"continuation when every recent turn reached the cap (9)",
		"charged",
		o,
		o.ok && o.rows[0].outcome === "charged",
	);
	o = await bt(A, "a-draft", -1, false);
	check("negative limit", "22023", o, isErr(o, "22023"));
	o = await inRole(db, "app_user", {}, () =>
		run(db, `select * from private.begin_ai_turn('a-draft', 5, false)`),
	);
	check("begin_ai_turn with no sub", "42501", o, isErr(o, "42501"));
	o = await U(db, A, `select * from private.begin_ai_turn(null, 5, false)`);
	check(
		"begin_ai_turn with null catalogue",
		"not_found",
		o,
		o.ok && o.rows[0].outcome === "not_found",
	);
	const used = (
		await run(
			db,
			`select count(*)::int n from public.prompts where user_id = $1 and refunded_at is null and datetime >= date_trunc('month', now(), 'UTC')`,
			[A],
		)
	).rows[0].n;
	await run(
		db,
		`insert into public.prompts (user_id, catalogue, datetime) values ($1, 'a-draft', now() - interval '40 days')`,
		[A],
	);
	o = await bt(A, "a-draft", used, false);
	check(
		"rows from a previous month are not counted (limit = current count)",
		"limit",
		o,
		o.ok && o.rows[0].outcome === "limit",
	);
	o = await bt(A, "a-draft", used + 1, false);
	check(
		"... and limit = current count + 1",
		"charged",
		o,
		o.ok && o.rows[0].outcome === "charged",
	);
	const beforeDel = (
		await run(
			db,
			`select count(*)::int n from public.prompts where user_id = $1`,
			[A],
		)
	).rows[0].n;
	const del = await U(
		db,
		A,
		`delete from public.catalogues where name = 'a-draft' returning name`,
		[],
		{ commit: true },
	);
	const afterDel = await run(
		db,
		`select count(*)::int n, count(*) filter (where catalogue is null)::int nulls from public.prompts where user_id = $1`,
		[A],
	);
	check(
		"owner deletes a-draft: AI ledger rows survive (no quota reset)",
		`count unchanged (${beforeDel}), catalogue NULL on a-draft rows`,
		`delete=${summarize(del)}; after=${rowsJson(afterDel)}`,
		del.ok && afterDel.rows[0].n === beforeDel && afterDel.rows[0].nulls > 0,
	);
	o = await run(
		db,
		`insert into public.prompts (user_id, catalogue) values (null, 'a-live')`,
	);
	check(
		"postgres inserts prompts with null user_id",
		"23502",
		o,
		isErr(o, "23502"),
	);
	o = await U(db, A, `update public.prompts set refunded_at = now()`);
	check("app_user self-refunds by UPDATE", "42501", o, isErr(o, "42501"));
	await db.close();
}

// ======================================================================================================
group = "G3 admin, worker and PostgREST perimeter (06 applied)";
// ======================================================================================================
{
	const db = await load(snaps.p3);
	// asAdmin (postgres, no role switch)
	let o = await run(
		db,
		`insert into private.paddle_events (event_id, event_type, occurred_at) values ('evt_1', 'subscription.updated', now()) on conflict do nothing returning event_id`,
	);
	const o2 = await run(
		db,
		`insert into private.paddle_events (event_id, event_type, occurred_at) values ('evt_1', 'subscription.updated', now()) on conflict do nothing returning event_id`,
	);
	check(
		"asAdmin Paddle idempotency: same event twice",
		"1 row, then 0 rows",
		`${summarize(o)} | ${summarize(o2)}`,
		o.n === 1 && o2.ok && o2.n === 0,
	);
	o = await run(
		db,
		`update public.users set plan_id = $1, customer_id = 'ctm_a' where id = $2 returning plan_id`,
		[IDS.PRO, A],
	);
	check(
		"asAdmin Paddle: update users plan_id/customer_id",
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await run(
		db,
		`insert into public.subscriptions (subscription_id, subscription_status, price_id, customer_id) values ('sub_a', 'active', $1, 'ctm_a') on conflict (subscription_id) do update set subscription_status = excluded.subscription_status returning 1`,
		[IDS.PRO],
	);
	check(
		"asAdmin Paddle: upsert subscriptions (fires CRM/Discord triggers)",
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await run(
		db,
		`insert into public.users (id, email, name, image, plan_id) values ($1, 'a2@test.dev', 'A2', null, $2) on conflict (id) do update set email = excluded.email, name = excluded.name, image = excluded.image returning plan_id`,
		[A, IDS.PLAN],
	);
	check(
		"asAdmin Clerk provisioning upsert never overwrites plan_id",
		`plan_id stays ${IDS.PRO}`,
		o,
		o.ok && o.rows[0].plan_id === IDS.PRO,
	);
	o = await run(db, `select count(*)::int n from public.contacts`);
	check("asAdmin CRM view contacts (security_invoker)", "ok", o, o.ok);
	o = await run(db, `delete from public.catalogues where name like 'e2e-%'`);
	check("e2e cleanup delete as postgres", "ok", o, o.ok);
	// worker via PostgREST as service_role
	o = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`select name, created_by from public.catalogues`,
	);
	check(
		"worker (service_role over PostgREST): read catalogues name,created_by",
		"4 rows",
		o,
		o.ok && o.n === 4,
	);
	o = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`update public.catalogues set status = 'inactive' where created_by = $1 returning name`,
		[B],
	);
	check("worker: inactivate B's catalogues", "2 rows", o, o.ok && o.n === 2);
	o = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`insert into public.analytics (date, current_url, pageview_count, unique_visitors, user_id) values (now(), 'https://q/x', 1, 1, $1) on conflict (date, current_url) do nothing`,
		[A],
	);
	check("worker: analytics upsert", "ok", o, o.ok);
	o = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`insert into public.job_logs (job_name, status, log) values ('x', 'ok', '{}') returning id`,
	);
	check("worker: job_logs insert", "1 row", o, o.ok && o.n === 1);

	// perimeter
	const tables = {
		users: "name",
		catalogues: "heading",
		subscriptions: "price_id",
		analytics: "pageview_count",
		plans: "name",
		product_newsletter: "email",
		job_logs: "status",
		newsletter: "email",
		ocr: "catalogue",
		prompts: "catalogue",
		qr_configs: "config",
		user_themes: "colors",
		contacts: "email",
		active_subscriptions: "email",
	};
	const bad = [];
	let total = 0;
	for (const [role, claims] of [
		["anon", { role: "anon" }],
		[
			"authenticated",
			{ role: "authenticated", sub: IDS.UA, aud: "authenticated" },
		],
		["authenticated", { role: "authenticated", sub: A }],
	]) {
		for (const [t, c] of Object.entries(tables)) {
			for (const sql of [
				`select * from public.${t} limit 1`,
				`insert into public.${t} default values`,
				`update public.${t} set ${c} = ${c}`,
				`delete from public.${t}`,
			]) {
				total++;
				const r = await REST(db, role, claims, sql);
				if (
					!(
						isErr(r, "42501") ||
						(["contacts", "active_subscriptions"].includes(t) &&
							isErr(r, "55000"))
					)
				)
					bad.push(`${role}/${claims.sub ?? "-"}: ${sql} -> ${summarize(r)}`);
			}
		}
	}
	check(
		"PostgREST perimeter: anon, authenticated (uuid sub), authenticated (Clerk sub) x 14 relations x S/I/U/D",
		`all ${total} -> 42501`,
		bad.length ? bad.slice(0, 8).join(" || ") : `all ${total} -> 42501`,
		bad.length === 0,
	);
	const rpcBad = [];
	for (const [role, claims] of [
		["anon", { role: "anon" }],
		["authenticated", { role: "authenticated", sub: A }],
	]) {
		for (const f of [
			`private.begin_ai_turn('a-live', 5, false)`,
			`private.subscribe_catalogue_newsletter('${IDS.CAT.bLive}', 'x@y.io')`,
			`private.catalogue_name_available('x')`,
			`private.my_usage()`,
			`private.current_user_id()`,
			`public.call_edge_function_with_vault_secret()`,
		]) {
			const r = await REST(db, role, claims, `select ${f}`);
			if (!(r.ok === false && ["42501", "0A000"].includes(r.code)))
				rpcBad.push(`${role}: ${f} -> ${summarize(r)}`);
		}
		const r = await REST(
			db,
			role,
			claims,
			`select public.get_pageview_totals(now(), now())`,
		);
		if (!isErr(r, "42883"))
			rpcBad.push(`${role}: get_pageview_totals -> ${summarize(r)}`);
	}
	check(
		"PostgREST perimeter: /rpc to private functions and dropped get_pageview_totals",
		"42501 / 42883",
		rpcBad.length ? rpcBad.join(" || ") : "all denied",
		rpcBad.length === 0,
	);
	const escal = [];
	for (const sess of [
		"authenticator",
		"supabase_storage_admin",
		"supabase_auth_admin",
		"supabase_realtime_admin",
		"anon",
		"authenticated",
		"service_role",
	]) {
		for (const target of ["app_user", "app_public"]) {
			await db.as("supabase_admin");
			await db.exec(`set session authorization ${sess}`);
			const r = await run(db, `select set_config('role', $1, false)`, [target]);
			if (r.ok) escal.push(`${sess} -> ${target}`);
			await db.as("supabase_admin");
		}
	}
	await db.as("postgres");
	check(
		"no Supabase service role can SET ROLE app_user/app_public",
		"all denied (42501)",
		escal.length ? escal.join(", ") : "all denied",
		escal.length === 0,
	);
	// pgTAP 00_perimeter queries (design s.7.1) as plain SQL
	await db.as("supabase_admin");
	const perimeter = {
		"RLS enabled on every public table": `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity`,
		"anon/authenticated: no table or column privilege in public": `select r.rolname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join (values ('anon'), ('authenticated')) r(rolname) where n.nspname = 'public' and c.relkind in ('r','p','v','m','f') and (has_table_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_any_column_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES'))`,
		"anon/authenticated: no sequence privilege": `select r.rolname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join (values ('anon'), ('authenticated')) r(rolname) where n.nspname = 'public' and c.relkind = 'S' and has_sequence_privilege(r.rolname, c.oid, 'USAGE,SELECT,UPDATE')`,
		"anon/authenticated: no EXECUTE on public/private functions": `select r.rolname, p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace cross join (values ('anon'), ('authenticated')) r(rolname) where n.nspname in ('public', 'private') and has_function_privilege(r.rolname, p.oid, 'EXECUTE')`,
		"no Supabase service role can become an app role": `select m.rolname, t.rolname from (values ('authenticator'), ('anon'), ('authenticated'), ('service_role'), ('supabase_realtime_admin'), ('supabase_storage_admin'), ('supabase_auth_admin'), ('pgbouncer'), ('dashboard_user')) m(rolname) cross join (values ('app_user'), ('app_public')) t(rolname) where exists (select 1 from pg_roles where rolname = m.rolname) and pg_has_role(m.rolname, t.rolname, 'MEMBER')`,
		"no private function is executable by PUBLIC": `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))`,
		"every SECURITY DEFINER function pins search_path to empty": `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'private') and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c in ('search_path=""', 'search_path='))`,
		"app_public has no privilege on any public table except catalogues": `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','v') and c.relname not in ('catalogues') and has_any_column_privilege('app_public', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')`,
		"app_user has nothing on system tables and CRM views": `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('subscriptions','plans','job_logs','product_newsletter','contacts','active_subscriptions') and has_any_column_privilege('app_user', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')`,
	};
	for (const [name, sql] of Object.entries(perimeter)) {
		const r = await run(db, sql);
		check(`pgTAP 00_perimeter query: ${name}`, "empty", r, r.ok && r.n === 0);
	}
	let r = await run(
		db,
		`select pg_has_role('postgres', 'app_user', 'SET') s, pg_has_role('postgres', 'app_user', 'USAGE') u, has_schema_privilege('anon', 'private', 'USAGE') anon_u, has_schema_privilege('authenticated', 'private', 'USAGE') auth_u, has_column_privilege('app_public', 'public.catalogues', 'created_by', 'SELECT') pub_cb`,
	);
	check(
		"postgres can SET app_user but not inherit; anon/authenticated no USAGE on private; app_public no created_by",
		"s=true u=false anon_u=false auth_u=false pub_cb=false",
		r,
		rowsJson(r) ===
			JSON.stringify([
				{ s: true, u: false, anon_u: false, auth_u: false, pub_cb: false },
			]),
	);
	r = await run(
		db,
		`select string_agg(a.attname, ',' order by a.attname) cols from pg_attribute a where a.attrelid = 'public.catalogues'::regclass and a.attnum > 0 and not a.attisdropped and has_column_privilege('app_user', a.attrelid, a.attnum, 'UPDATE')`,
	);
	const editable = [
		"logo",
		"heading",
		"language",
		"currency",
		"business_type",
		"content",
		"legal",
		"appearance",
		"contact",
		"header",
		"footer",
		"partners",
		"metadata",
		"tags",
		"status",
		"updated_at",
	]
		.sort()
		.join(",");
	check(
		"grants-match-columns: app_user UPDATE on catalogues == CATALOGUE_EDITABLE_FIELDS + status, updated_at",
		editable,
		r,
		r.ok && r.rows[0].cols === editable,
	);
	r = await run(
		db,
		`select string_agg(a.attname, ',' order by a.attname) cols from pg_attribute a where a.attrelid = 'public.catalogues'::regclass and a.attnum > 0 and not a.attisdropped and has_column_privilege('app_public', a.attrelid, a.attnum, 'SELECT')`,
	);
	const pubcols = [
		"id",
		"name",
		"logo",
		"heading",
		"status",
		"source",
		"language",
		"currency",
		"business_type",
		"content",
		"legal",
		"appearance",
		"contact",
		"header",
		"footer",
		"partners",
		"metadata",
		"tags",
		"created_at",
		"updated_at",
	]
		.sort()
		.join(",");
	check(
		"grants-match-columns: app_public SELECT on catalogues == PUBLIC_CATALOGUE_COLUMNS",
		pubcols,
		r,
		r.ok && r.rows[0].cols === pubcols,
	);
	await db.close();
}

// ======================================================================================================
group = "G4 wrapper semantics: injection, role allowlist, leakage";
// ======================================================================================================
{
	const db = await load(snaps.p3);
	const evil = `x', true); drop table public.users; --"\\`;
	let o = await inRole(db, "app_user", { sub: evil }, () =>
		run(
			db,
			`select private.current_user_id() uid, (select count(*)::int from public.catalogues) n`,
		),
	);
	const tbl = await run(db, `select count(*)::int n from public.users`);
	check(
		"claims injection: sub with quotes, backslash, -- and a DROP",
		"helper returns the literal string; 0 rows visible; users table intact",
		`${summarize(o)}; users=${rowsJson(tbl)}`,
		o.ok && o.rows[0].uid === evil && o.rows[0].n === 0 && tbl.ok,
	);
	o = await inRole(db, "app_user", { sub: A, role: "service_role" }, () =>
		run(
			db,
			`select current_user::text cu, current_setting('request.jwt.claims') c`,
		),
	);
	check(
		"claims carrying role:'service_role' cannot change the DB role (wrapper overwrites role, DB role comes from set_config)",
		"current_user app_user",
		o,
		o.ok && o.rows[0].cu === "app_user",
	);
	o = await run(db, `begin; select 1;`).catch(() => null);
	await db.exec("rollback").catch(() => {});
	o = await (async () => {
		await db.exec("begin");
		const x = await run(
			db,
			`select pg_catalog.set_config('role', 'app_user', true), pg_catalog.set_config('request.jwt.claims', 'not json', true)`,
		);
		const y = await run(db, `select name from public.catalogues`);
		await db.exec("rollback");
		return { ok: y.ok, rows: y.rows, n: y.n, code: y.code, msg: y.msg };
	})();
	check(
		"malformed claims string (not JSON) reaching the helper",
		"error 22P02 (fail closed, no rows)",
		o,
		isErr(o, "22P02"),
	);
	o = await inRole(db, "app_user", { sub: 123 }, () =>
		run(
			db,
			`select private.current_user_id() uid, (select count(*)::int from public.catalogues) n`,
		),
	);
	check(
		"non-string sub (number) - unreachable from TS, documented",
		"uid '123', 0 rows",
		o,
		o.ok && o.rows[0].uid === "123" && o.rows[0].n === 0,
	);

	// role allowlist at the DB level
	const allowed = {};
	for (const target of [
		"app_user",
		"app_public",
		"postgres",
		"service_role",
		"authenticated",
		"anon",
		"authenticator",
		"supabase_admin",
	]) {
		await db.exec("begin");
		const x = await run(db, `select set_config('role', $1, true)`, [target]);
		await db.exec("rollback");
		allowed[target] = x.ok ? "allowed" : x.code;
	}
	check(
		"DB-side role reachability from the postgres DB_CONNECTION_STRING session (phases 1-3)",
		"app_user, app_public allowed; service_role/authenticated/anon ALSO allowed (only the TS allowlist prevents them); supabase_admin denied",
		JSON.stringify(allowed),
		allowed.app_user === "allowed" && allowed.supabase_admin === "42501",
		{ severity: "info", finding: "TS allowlist is the only guard until 07" },
	);

	// SQL-injection inside a withUser block (threat model check)
	o = await inRole(db, "app_user", { sub: A }, async () => {
		const a1 = await run(
			db,
			`select set_config('request.jwt.claims', $1, true)`,
			[JSON.stringify({ sub: B })],
		);
		const a2 = await run(
			db,
			`select name from public.catalogues order by name`,
		);
		const a3 = await run(db, `reset role`);
		const a4 = await run(
			db,
			`select current_user::text cu, (select count(*)::int from public.users) users`,
		);
		return {
			ok: a2.ok && a4.ok,
			rows: [
				{ spoofed: col(a2, "name"), reset: a3.ok, after_reset: a4.rows?.[0] },
			],
			n: 1,
		};
	});
	check(
		"threat model: injected SQL inside withUser (phases 1-3, postgres session) can re-set claims and RESET ROLE",
		"spoof sees B's rows; RESET ROLE returns to BYPASSRLS postgres (by design - sql.raw ban is load-bearing)",
		o,
		o.ok &&
			eqArr(o.rows[0].spoofed, ["b-draft", "b-live"]) &&
			o.rows[0].after_reset?.cu === "postgres",
		{ severity: "info" },
	);

	// leakage
	await inRole(db, "app_user", { sub: A }, () => run(db, "select 1"), {
		commit: true,
	});
	o = await run(
		db,
		`select current_user::text cu, current_setting('request.jwt.claims', true) c, private.current_user_id() uid, current_setting('statement_timeout') st, current_setting('lock_timeout') lt`,
	);
	check(
		"after COMMIT of withUser: role/claims/timeouts reset on the pooled session",
		"cu postgres, claims '' (uid null), statement_timeout 0, lock_timeout 0",
		o,
		o.ok &&
			o.rows[0].cu === "postgres" &&
			!o.rows[0].c &&
			o.rows[0].uid === null &&
			o.rows[0].st === "0" &&
			o.rows[0].lt === "0",
	);
	await inRole(
		db,
		"app_user",
		{ sub: A },
		async () => {
			await run(db, "select 1/0");
			return { ok: true };
		},
		{ commit: true },
	);
	o = await run(
		db,
		`select current_user::text cu, private.current_user_id() uid`,
	);
	check(
		"after an error inside withUser (aborted tx -> COMMIT acts as ROLLBACK)",
		"cu postgres, uid null",
		o,
		o.ok && o.rows[0].cu === "postgres" && o.rows[0].uid === null,
	);
	await run(db, WRAPPER_SQL, [
		"app_user",
		JSON.stringify({ sub: A, role: "app_user" }),
		"8s",
		"3s",
		"10s",
	]);
	o = await run(
		db,
		`select current_user::text cu, private.current_user_id() uid`,
	);
	check(
		"wrapper statement accidentally run in autocommit (no BEGIN): is_local settings end with that statement",
		"cu postgres, uid null",
		o,
		o.ok && o.rows[0].cu === "postgres" && o.rows[0].uid === null,
	);
	o = await inRole(db, "app_public", {}, () =>
		run(
			db,
			`select current_setting('request.jwt.claims', true) c, current_user::text cu`,
		),
	);
	check(
		"withPublic after withUser on the same connection carries no sub",
		`claims {"role":"app_public"}`,
		o,
		o.ok &&
			o.rows[0].c === '{"role":"app_public"}' &&
			o.rows[0].cu === "app_public",
	);
	// ALTER ROLE settings are not applied by SET ROLE
	await admin(db, `alter role app_user set statement_timeout = '1234ms'`);
	o = await inRole(db, "app_user", { sub: A }, () =>
		run(db, `select current_setting('statement_timeout') st`),
	);
	check(
		"SET ROLE does not apply ALTER ROLE ... SET (why the wrapper sets timeouts per tx)",
		"8s (from wrapper), not 1234ms",
		o,
		o.ok && o.rows[0].st === "8s",
	);
	await admin(db, `alter role app_user reset statement_timeout`);

	// temp table shadowing across tenants on the same pooled backend (Supavisor transaction mode reuses backends)
	{
		// attacker A (needs an SQL-injection primitive inside withUser) plants a temp table named like the Drizzle target
		const plant = await inRole(
			db,
			"app_user",
			{ sub: A },
			async () => {
				const x = await run(
					db,
					`create temp table catalogues (like public.catalogues including defaults)`,
				);
				if (!x.ok) return x;
				return run(
					db,
					`insert into pg_temp.catalogues (id, name, created_by, status, tags, content) values ('bbbbbbbb-0000-4000-8000-000000000002', 'b-live', $1, 'active', '{}', '[{"forged":true}]')`,
					[B],
				);
			},
			{ commit: true },
		);
		// victim B later lands on the same backend; Drizzle emits unqualified "catalogues"
		const bRead = await inRole(db, "app_user", { sub: B }, () =>
			run(
				db,
				`select "id", "name", "content" from "catalogues" where ("catalogues"."name" = $1 and "catalogues"."created_by" = $2) limit $3`,
				["b-live", B, 1],
			),
		);
		const bWrite = await inRole(
			db,
			"app_user",
			{ sub: B },
			() =>
				run(
					db,
					`insert into "catalogues" ("id", "name", "created_by", "status", "tags", "content") values (default, $1, $2, $3, $4, $5) returning "name"`,
					["b-secret-new", B, "draft", "{}", '[{"secret":"B business data"}]'],
				),
			{ commit: true },
		);
		const stolen = await inRole(db, "app_user", { sub: A }, () =>
			run(
				db,
				`select name, content from pg_temp.catalogues where created_by = $1 and name = 'b-secret-new'`,
				[B],
			),
		);
		const inPublic = await admin(
			db,
			`select count(*)::int n from public.catalogues where name = 'b-secret-new'`,
		);
		check(
			"temp-table shadowing (as designed): A plants pg_temp.catalogues on a pooled backend; B's Drizzle loadOwnedCatalogue reads A's forged row and B's createCatalogue INSERT is captured into A's temp table",
			"B reads public rows only; B's insert lands in public.catalogues; A cannot read it",
			`plant=${summarize(plant)}; B read=${summarize(bRead)}; B insert=${summarize(bWrite)}; A reads B's captured insert=${summarize(stolen)}; rows in public=${rowsJson(inPublic)}`,
			bRead.ok &&
				!JSON.stringify(bRead.rows).includes("forged") &&
				inPublic.ok &&
				inPublic.rows[0].n === 1,
			{ severity: "medium", finding: "temp-shadowing" },
		);
		// mitigation 1 (TS wrapper): pin search_path transaction-locally with pg_temp LAST
		const WR2 = `select pg_catalog.set_config('search_path', 'public, pg_temp', true)`;
		const bRead2 = await inRole(db, "app_user", { sub: B }, async () => {
			await run(db, WR2);
			return run(
				db,
				`select "id", "name", "content" from "catalogues" where ("catalogues"."name" = $1 and "catalogues"."created_by" = $2) limit $3`,
				["b-live", B, 1],
			);
		});
		const fnCheck = await inRole(db, "app_user", { sub: B }, async () => {
			await run(db, WR2);
			return run(
				db,
				`select private.current_user_id() uid, gen_random_uuid() is not null g, now() is not null n`,
			);
		});
		check(
			"mitigation: wrapper adds set_config('search_path', 'public, pg_temp', true) -> unqualified Drizzle names resolve to public even with a planted temp table",
			"B reads the real b-live (no forged content); builtins still resolve",
			`read=${summarize(bRead2)}; builtins=${summarize(fnCheck)}`,
			bRead2.ok &&
				bRead2.n === 1 &&
				!JSON.stringify(bRead2.rows).includes("forged") &&
				fnCheck.ok,
			{ finding: "temp-shadowing-fix" },
		);
		await run(db, `discard temp`);
		// mitigation 2 (SQL, optional): revoke TEMP on the database from PUBLIC, give it back to platform roles
		const rv = await run(
			db,
			`do $$ begin execute format('revoke temporary on database %I from public', current_database()); execute format('grant temporary on database %I to postgres, service_role, authenticated, anon, dashboard_user', current_database()); end $$`,
		);
		const tmp = await inRole(db, "app_user", { sub: A }, () =>
			run(db, `create temp table x (a int)`),
		);
		const tmpPg = await run(db, `create temp table y (a int)`);
		await run(db, `discard temp`);
		check(
			"mitigation (optional): postgres (database owner) revokes TEMP from PUBLIC -> app_user CREATE TEMP TABLE is denied while postgres keeps TEMP",
			"revoke ok; app_user 42501; postgres ok",
			`revoke=${summarize(rv)}; app_user=${summarize(tmp)}; postgres=${summarize(tmpPg)}`,
			rv.ok && isErr(tmp, "42501") && tmpPg.ok,
			{ finding: "temp-shadowing-fix2" },
		);
		await run(
			db,
			`do $$ begin execute format('grant temporary on database %I to public', current_database()); end $$`,
		);
	}

	// pg_net objects are PUBLIC on TEST (schema net =U, http_post proacl NULL, http_request_queue/_http_response =arwdDxtm)
	{
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('service_role_key', 'eyJhbGciOiJIUzI1NiJ9.eyJyZWYiOiJ4In0.SERVICE_ROLE_SIGNATURE')`,
		);
		await admin(
			db,
			`insert into private.settings (key, value) values ('edge_functions_base_url', 'https://abcdefghijklmnopqrst.supabase.co/functions/v1') on conflict (key) do update set value = excluded.value`,
		);
		await admin(db, `truncate net.http_request_queue`);
		const ren = await U(
			db,
			A,
			`update public.users set name = 'Alice Renamed' where id = $1 returning id`,
			[A],
			{ commit: true },
		);
		const q = await admin(
			db,
			`select url, headers->>'Authorization' auth from net.http_request_queue`,
		);
		check(
			"app_user renames itself (UPDATE OF name) -> Brevo trigger (SECURITY DEFINER postgres) queues the webhook without a permission error",
			"1 row updated; 1 queued POST to .../create-brevo-contact with Bearer header",
			`update=${summarize(ren)}; queue=${rowsJson(q)}`,
			ren.ok &&
				ren.n === 1 &&
				q.ok &&
				q.n === 1 &&
				q.rows[0].url.endsWith("/create-brevo-contact") &&
				/^Bearer /.test(q.rows[0].auth),
		);
		const leakQ = await P(
			db,
			`select url, headers->>'Authorization' as auth from net.http_request_queue`,
		);
		check(
			"defence in depth: app_public (and app_user) can SELECT net.http_request_queue, i.e. the Vault service_role key in pending webhook headers",
			"42501",
			leakQ,
			isErr(leakQ, "42501"),
			{ severity: "medium", finding: "pg_net-public" },
		);
		const post = await P(
			db,
			`select net.http_post(url := 'http://169.254.169.254/latest/meta-data', body := '{}'::jsonb)`,
		);
		check(
			"defence in depth: app_public can call net.http_post (arbitrary outbound HTTP from the DB)",
			"42501",
			post,
			isErr(post, "42501"),
			{ severity: "low", finding: "pg_net-public" },
		);
		const del = await P(db, `delete from net.http_request_queue returning id`);
		check(
			"defence in depth: app_public can DELETE queued webhooks (suppress Brevo/CRM/Discord notifications)",
			"42501",
			del,
			isErr(del, "42501"),
			{ severity: "low", finding: "pg_net-public" },
		);
		db.notices = [];
		const rv = await run(
			db,
			`revoke all on table net.http_request_queue from public`,
		);
		const still = await P(db, `select count(*) from net.http_request_queue`);
		check(
			"fix feasibility: postgres cannot revoke the PUBLIC grants on net.* (granted by supabase_admin)",
			"revoke is a no-op with WARNING; app_public still reads the queue",
			`revoke=${summarize(rv)}; notices=${JSON.stringify(db.notices.map((n) => n.severity + ": " + n.message))}; app_public select=${summarize(still)}`,
			rv.ok &&
				still.ok &&
				db.notices.some((n) =>
					/no privileges could be revoked/i.test(n.message),
				),
			{ finding: "pg_net-public-fix" },
		);
	}
	await db.close();
}

// ======================================================================================================
group = "G5 migration 07: app_rls fail-closed login role";
// ======================================================================================================
{
	const db = await load(snaps.p4);
	await db.as("app_rls");
	let o = await run(db, `select name from public.catalogues`);
	check(
		"forgotten wrapper: raw query as app_rls",
		"42501",
		o,
		isErr(o, "42501"),
	);
	for (const sql of [
		`select id from public.users`,
		`select private.current_user_id()`,
		`select * from public.contacts`,
		`insert into public.newsletter (email, catalogue_id, owner_id) values ('x@y.z', '${IDS.CAT.bLive}', '${B}')`,
	]) {
		o = await run(db, sql);
		check(
			`forgotten wrapper: ${sql.slice(0, 50)}`,
			"42501",
			o,
			isErr(o, "42501"),
		);
	}
	o = await U(db, A, `select name from public.catalogues order by name`);
	check(
		"app_rls + withUser(A)",
		"a-draft, a-live",
		o,
		eqArr(col(o, "name"), ["a-draft", "a-live"]),
	);
	o = await P(db, `select name from public.catalogues order by name`);
	check(
		"app_rls + withPublic",
		"a-live, b-live",
		o,
		eqArr(col(o, "name"), ["a-live", "b-live"]),
	);
	const allowed = {};
	for (const target of [
		"app_user",
		"app_public",
		"postgres",
		"service_role",
		"authenticated",
		"anon",
		"authenticator",
	]) {
		await db.exec("begin");
		const x = await run(db, `select set_config('role', $1, true)`, [target]);
		await db.exec("rollback");
		allowed[target] = x.ok ? "allowed" : x.code;
	}
	check(
		"app_rls role reachability",
		"only app_user, app_public",
		JSON.stringify(allowed),
		Object.entries(allowed).every(([k, v]) =>
			["app_user", "app_public"].includes(k) ? v === "allowed" : v === "42501",
		),
	);
	o = await inRole(db, "app_user", { sub: A }, async () => {
		const r1 = await run(db, `reset role`);
		const r2 = await run(db, `select count(*) from public.catalogues`);
		return {
			ok: r2.ok,
			code: r2.code,
			msg: r2.msg,
			rows: [{ reset: r1.ok }],
			n: 1,
		};
	});
	check(
		"injected RESET ROLE under app_rls lands on a role with no privileges",
		"42501",
		o,
		isErr(o, "42501"),
	);
	{
		const plant = await inRole(
			db,
			"app_user",
			{ sub: A },
			async () => {
				const x = await run(
					db,
					`create temp table catalogues (like public.catalogues including defaults)`,
				);
				if (!x.ok) return x;
				return run(
					db,
					`insert into pg_temp.catalogues (id, name, created_by, status, tags, content) values (gen_random_uuid(), 'b-live', $1, 'active', '{}', '[{"forged":true}]')`,
					[B],
				);
			},
			{ commit: true },
		);
		const bRead = await inRole(db, "app_user", { sub: B }, () =>
			run(
				db,
				`select "name", "content" from "catalogues" where ("catalogues"."name" = $1 and "catalogues"."created_by" = $2) limit $3`,
				["b-live", B, 1],
			),
		);
		const sp = await run(db, `select current_setting('search_path') sp`);
		check(
			"temp-table shadowing under the app_rls login (07): planted pg_temp.catalogues vs B's unqualified Drizzle read",
			"B reads the real row (no forged content)",
			`search_path=${rowsJson(sp)}; plant=${summarize(plant)}; B read=${summarize(bRead)}`,
			bRead.ok &&
				bRead.n === 1 &&
				!JSON.stringify(bRead.rows).includes("forged"),
			{ severity: "medium", finding: "temp-shadowing" },
		);
		await run(db, `discard temp`);
	}
	o = await run(
		db,
		`select rolname, rolconnlimit, rolconfig::text from pg_roles where rolname = 'app_rls'`,
	);
	check(
		"app_rls attributes (connection limit 40, login timeouts as backstop)",
		"connlimit 40, statement_timeout=8s,...",
		o,
		o.ok && o.rows[0].rolconnlimit === 40,
	);
	await db.close();
}

// ======================================================================================================
group =
	"G6 migration 08: auth.users triggers (GoTrue emulated as supabase_auth_admin)";
// ======================================================================================================
async function gotrue(db, sql, params = []) {
	const prev = db.session;
	await db.as("supabase_admin");
	await db.exec("set session authorization supabase_auth_admin");
	await db.exec("set search_path = auth");
	const o = await run(db, sql, params);
	await db.exec("reset search_path");
	await db.as(prev);
	return o;
}
// GoTrue admin.createUser, faithful to supabase/auth internal/api/admin.go adminUserCreate: ONE transaction,
// INSERT auth.users with user_metadata (NewUser), identities, THEN user.UpdateAppMetaData (separate UPDATE).
async function gotrueAdminCreate(db, id, email, userMeta, appMeta) {
	const prev = db.session;
	await db.as("supabase_admin");
	await db.exec("set session authorization supabase_auth_admin");
	await db.exec("set search_path = auth");
	let out;
	try {
		await db.exec("begin");
		await db.query(
			`insert into users (id, email, raw_user_meta_data, raw_app_meta_data) values ($1, $2, $3, '{"provider":"email","providers":["email"]}')`,
			[id, email, JSON.stringify(userMeta ?? {})],
		);
		if (appMeta)
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
	await db.exec("reset search_path");
	await db.as(prev);
	return out;
}
{
	const db = await load(snaps.p5);
	const usage = await admin(
		db,
		`select has_schema_privilege('supabase_auth_admin', 'private', 'USAGE') u, has_function_privilege('supabase_auth_admin', 'private.handle_auth_user_created()', 'EXECUTE') x`,
	);
	const U3 = "33333333-3333-4333-8333-333333333333";
	let o = await gotrue(
		db,
		`insert into users (id, email, raw_user_meta_data, raw_app_meta_data) values ($1, 'New@Test.dev', '{"full_name":" Ana ","avatar_url":"https://x/y.png"}', '{"provider":"email"}')`,
		[U3],
	);
	let row = await admin(
		db,
		`select id, email, name, image, plan_id, consents from public.users where id = $1`,
		[U3],
	);
	check(
		"sign-up: GoTrue insert (supabase_auth_admin, no USAGE on private) creates public.users with default plan",
		`row id=${U3}, email lowercased, name 'Ana', image, plan ${IDS.PLAN}, default consents`,
		`auth_admin private usage=${rowsJson(usage)}; insert=${summarize(o)}; row=${rowsJson(row)}`,
		o.ok &&
			row.rows[0]?.email === "new@test.dev" &&
			row.rows[0]?.name === "Ana" &&
			row.rows[0]?.image === "https://x/y.png" &&
			row.rows[0]?.plan_id === IDS.PLAN &&
			row.rows[0]?.consents?.["privacy-policy"] === true,
	);
	const U4 = "44444444-4444-4444-8444-444444444444";
	o = await gotrue(
		db,
		`insert into users (id, email, raw_user_meta_data) values ($1, 'c@t.dev', '{"consents":{"terms-and-conditions":true,"privacy-policy":"true"}}')`,
		[U4],
	);
	row = await admin(db, `select consents from public.users where id = $1`, [
		U4,
	]);
	check(
		"sign-up with consents metadata (string 'true' is not accepted)",
		`{"refund-policy":false,"privacy-policy":false,"terms-and-conditions":true}`,
		`${summarize(o)}; ${rowsJson(row)}`,
		o.ok &&
			row.rows[0]?.consents?.["privacy-policy"] === false &&
			row.rows[0]?.consents?.["refund-policy"] === false &&
			row.rows[0]?.consents?.["terms-and-conditions"] === true &&
			Object.keys(row.rows[0]?.consents ?? {}).length === 3,
	);
	const U5 = "55555555-5555-4555-8555-555555555555";
	const claim = await run(
		db,
		`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status) values ('user_x', $1, 'pending')`,
		[U5],
	);
	o = await gotrueAdminCreate(
		db,
		U5,
		"imp@t.dev",
		{ full_name: "Imp" },
		{ clerk_user_id: "user_x" },
	);
	row = await admin(
		db,
		`select count(*)::int n, max(plan_id) plan from public.users where id = $1`,
		[U5],
	);
	check(
		"imported Clerk user via GoTrue admin.createUser (INSERT, then app_metadata UPDATE in the same tx; map row pre-claimed by the import script) gets no public.users row",
		"0 rows",
		`map claim=${summarize(claim)}; createUser=${summarize(o)}; public.users=${rowsJson(row)}`,
		o.ok && row.rows[0].n === 0,
		{ severity: "high", finding: "import-trigger" },
	);
	const U6 = "66666666-6666-4666-8666-666666666666";
	o = await gotrue(
		db,
		`insert into users (id, email, is_anonymous) values ($1, null, true)`,
		[U6],
	);
	row = await admin(
		db,
		`select count(*)::int n from public.users where id = $1`,
		[U6],
	);
	check(
		"anonymous user gets no row",
		"0 rows",
		`${summarize(o)}; ${rowsJson(row)}`,
		o.ok && row.rows[0].n === 0,
	);
	const U7 = "77777777-7777-4777-8777-777777777777";
	o = await gotrue(
		db,
		`insert into users (id, email, raw_user_meta_data) values ($1, 'j@t.dev', $2)`,
		[U7, JSON.stringify({ name: "Nm", avatar_url: "javascript:alert(1)" })],
	);
	row = await admin(db, `select name, image from public.users where id = $1`, [
		U7,
	]);
	check(
		"'name' fallback and javascript: avatar",
		"name Nm, image null",
		`${summarize(o)}; ${rowsJson(row)}`,
		o.ok && row.rows[0]?.name === "Nm" && row.rows[0]?.image === null,
	);
	const U8 = "88888888-8888-4888-8888-888888888888";
	o = await gotrue(
		db,
		`insert into users (id, email, raw_user_meta_data) values ($1, 'l@t.dev', $2)`,
		[U8, JSON.stringify({ picture: "https://x/" + "a".repeat(1500) })],
	);
	row = await admin(
		db,
		`select length(image) l from public.users where id = $1`,
		[U8],
	);
	check(
		"1.5 KB avatar URL via 'picture' (regex has no {m,n} > 255)",
		"row created, image kept",
		`${summarize(o)}; ${rowsJson(row)}`,
		o.ok && row.rows[0]?.l > 1500,
	);
	const U9 = "99999999-9999-4999-8999-999999999999";
	o = await gotrue(db, `insert into users (id, phone) values ($1, '+100')`, [
		U9,
	]);
	row = await admin(db, `select email, name from public.users where id = $1`, [
		U9,
	]);
	check(
		"phone sign-up with null email and no metadata",
		"row with email null, name ''",
		`${summarize(o)}; ${rowsJson(row)}`,
		o.ok && row.rows.length === 1,
	);
	o = await gotrue(
		db,
		`update users set email = 'Changed@Test.dev' where id = $1`,
		[U3],
	);
	row = await admin(db, `select email from public.users where id = $1`, [U3]);
	check(
		"email change sync",
		"changed@test.dev",
		`${summarize(o)}; ${rowsJson(row)}`,
		row.rows[0]?.email === "changed@test.dev",
	);
	o = await gotrue(
		db,
		`update users set raw_user_meta_data = '{"full_name":"Ana B","avatar_url":"https://x/y.png"}' where id = $1`,
		[U3],
	);
	row = await admin(db, `select name from public.users where id = $1`, [U3]);
	check(
		"metadata name sync when not edited in-app",
		"Ana B",
		`${summarize(o)}; ${rowsJson(row)}`,
		row.rows[0]?.name === "Ana B",
	);
	await U(
		db,
		U3,
		`update public.users set name = 'Custom' where id = $1`,
		[U3],
		{ commit: true },
	);
	o = await gotrue(
		db,
		`update users set raw_user_meta_data = '{"full_name":"Ana C","avatar_url":"https://x/y.png"}' where id = $1`,
		[U3],
	);
	row = await admin(db, `select name from public.users where id = $1`, [U3]);
	check(
		"metadata name sync does not clobber a name edited in-app (app_user UPDATE(name))",
		"Custom",
		`${summarize(o)}; ${rowsJson(row)}`,
		row.rows[0]?.name === "Custom",
	);
	await admin(
		db,
		`insert into public.catalogues (name, created_by, tags) values ('u3-cat', $1, '{}')`,
		[U3],
	);
	await admin(
		db,
		`insert into public.user_themes (user_id, name) values ($1, 't')`,
		[U3],
	);
	o = await gotrue(db, `delete from users where id = $1`, [U3]);
	row = await admin(
		db,
		`select (select count(*)::int from public.users where id = $1) u, (select count(*)::int from public.catalogues where created_by = $1) c, (select count(*)::int from public.user_themes where user_id = $1) t`,
		[U3],
	);
	check(
		"account deletion: auth.users delete cascades public.users and owned rows",
		"u 0, c 0, t 0",
		`${summarize(o)}; ${rowsJson(row)}`,
		o.ok && rowsJson(row) === JSON.stringify([{ u: 0, c: 0, t: 0 }]),
	);
	await admin(db, `delete from private.settings where key = 'default_plan_id'`);
	o = await gotrue(
		db,
		`insert into users (id, email) values ('aaaaaaaa-1111-4111-8111-111111111111', 'np@t.dev')`,
	);
	check(
		"missing default_plan_id blocks sign-up loudly",
		"P0001",
		o,
		isErr(o, "P0001"),
	);
	await admin(
		db,
		`insert into private.settings (key, value) values ('default_plan_id', $1)`,
		[IDS.PLAN],
	);
	o = await U(db, U4, `select id, plan_id from public.users`);
	check(
		"new Supabase user (uuid sub) under withUser sees only own row",
		`only ${U4}`,
		o,
		eqArr(col(o, "id"), [U4]),
	);
	o = await REST(
		db,
		"authenticated",
		{ role: "authenticated", sub: U4 },
		`select * from public.users`,
	);
	check(
		"same user with a real JWT via PostgREST",
		"42501",
		o,
		isErr(o, "42501"),
	);
	o = await admin(db, `select count(*)::int n from net._http_calls`);
	check(
		"no outbound webhook calls without edge_functions_base_url",
		"0",
		o,
		o.ok && o.rows[0].n === 0,
	);
	await db.close();
}

// ======================================================================================================
group =
	"G7 cutover: RUNBOOK remap-user-ids, 09, post-cutover policies with uuid ids, 10";
// ======================================================================================================
{
	const db = await load(snaps.p5);
	// import flow (decision s.13): R1 map, claim uuids, GoTrue admin.createUser (faithful sequence), mark migrated
	const UD = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
	const runbook = sec("RUNBOOK");
	const r1 = runbook.statements.slice(0, 3); // R1: schema + map table
	for (const st of r1) await run(db, st.sql);
	await run(
		db,
		`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status) values ($1, $2, 'pending'), ($3, $4, 'pending'), ('user_2dDdddddddddddddddd', $5, 'pending')`,
		[A, IDS.UA, B, IDS.UB, UD],
	);
	for (const [uid, cid, email, nm] of [
		[IDS.UA, A, "a@test.dev", "imp"],
		[IDS.UB, B, "b@test.dev", "imp"],
		[UD, "user_2dDdddddddddddddddd", "d@test.dev", "Dora"],
	]) {
		await gotrueAdminCreate(
			db,
			uid,
			email,
			{ full_name: nm },
			{ clerk_user_id: cid },
		);
	}
	await run(db, `update migration.clerk_user_map set status = 'migrated'`);
	const preRows = await run(
		db,
		`select id, plan_id from public.users where id in ($1, $2, $3) order by id`,
		[IDS.UA, IDS.UB, UD],
	);
	check(
		"after importing 3 Clerk users through GoTrue admin.createUser (before the remap)",
		"no uuid public.users rows yet (remap re-keys the Clerk rows; D is inserted by the RUNBOOK)",
		rowsJson(preRows),
		preRows.ok && preRows.n === 0,
		{ severity: "high", finding: "import-trigger" },
	);
	const catBefore = (
		await run(
			db,
			`select name, updated_at from public.catalogues order by name`,
		)
	).rows;
	async function runRemap() {
		const errs = [];
		for (const st of runbook.statements.slice(3)) {
			try {
				await db.exec(st.sql);
			} catch (e) {
				errs.push({ line: st.line, code: e.code, message: e.message });
			}
		}
		try {
			await db.exec("rollback");
		} catch {}
		return errs;
	}
	// attempt 1: user C (never imported) still has a Clerk id
	let errs = await runRemap();
	let state = await run(
		db,
		`select string_agg(id, ',' order by id) ids from public.users`,
	);
	check(
		"remap aborts when a Clerk user has no migrated mapping (C)",
		"exception from final DO check; transaction rolled back; ids unchanged",
		`errors=${JSON.stringify(errs.slice(0, 3))}; users=${rowsJson(state)}`,
		errs.length > 0 &&
			errs[0].message.includes("non-uuid") &&
			!state.rows[0].ids.includes(IDS.UA),
	);
	await run(db, `delete from public.users where id = $1`, [IDS.C]);
	db.notices = [];
	await admin(db, "truncate net.http_request_queue");
	errs = await runRemap();
	state = await run(
		db,
		`select (select string_agg(id, ',' order by id) from public.users) ids,
      (select string_agg(distinct created_by, ',') from public.catalogues) cat_owners,
      (select string_agg(distinct user_id, ',') from public.analytics) analytics,
      (select string_agg(distinct owner_id, ',') from public.newsletter) newsletter,
      (select string_agg(distinct user_id, ',') from public.prompts) prompts,
      (select string_agg(distinct user_id, ',') from public.ocr) ocr,
      (select string_agg(distinct user_id, ',') from public.user_themes) themes,
      (select name from public.users where id = $1) d_name, (select plan_id from public.users where id = $1) d_plan,
      (select string_agg(tgname || ':' || tgenabled::text, ',' order by tgname) from pg_trigger where tgrelid in ('public.users'::regclass, 'public.catalogues'::regclass, 'public.user_themes'::regclass) and not tgisinternal) triggers`,
		[UD],
	);
	const catAfter = (
		await run(
			db,
			`select name, updated_at from public.catalogues order by name`,
		)
	).rows;
	check(
		"remap succeeds after resolving C: ids remapped and every ownership column cascaded",
		`users ${IDS.UA},${IDS.UB},${UD}; all child owner columns uuid; D inserted with Dora/default plan; triggers re-enabled (O)`,
		`errors=${JSON.stringify(errs)}; state=${rowsJson(state)}`,
		errs.length === 0 &&
			state.rows[0].ids === [IDS.UA, IDS.UB, UD].sort().join(",") &&
			!/user_2/.test(JSON.stringify(state.rows[0])) &&
			state.rows[0].d_name === "Dora" &&
			state.rows[0].d_plan === IDS.PLAN &&
			!/:D/.test(state.rows[0].triggers),
	);
	check(
		"remap does not bump catalogues.updated_at (touch trigger disabled during cascade)",
		"updated_at unchanged",
		JSON.stringify(
			catAfter.map(
				(r, i) =>
					r.updated_at?.getTime() === catBefore[i].updated_at?.getTime(),
			),
		),
		catAfter.every(
			(r, i) => r.updated_at?.getTime() === catBefore[i].updated_at?.getTime(),
		),
	);
	const r09 = await applySectionTxMode(db, sec("09"));
	check(
		"apply 09 users_id_is_uuid",
		"ok",
		r09.ok ? "ok" : `${r09.code} ${r09.message}`,
		r09.ok,
	);
	let o = await run(
		db,
		`insert into public.users (id, plan_id) values ('user_stale', $1)`,
		[IDS.PLAN],
	);
	check("after 09: stale Clerk id into users", "23514", o, isErr(o, "23514"));
	o = await run(
		db,
		`insert into public.catalogues (name, created_by, tags) values ('stale', 'user_stale', '{}')`,
	);
	check(
		"after 09: stale Clerk id into catalogues.created_by",
		"23503 (FK)",
		o,
		isErr(o, "23503"),
	);
	o = await U(db, A, `select name from public.catalogues`);
	check(
		"after remap: old Clerk sub sees nothing",
		"0 rows",
		o,
		o.ok && o.n === 0,
	);
	await db.close();
	// full owner matrix with uuid ids on a snapshot of the remapped DB
}
{
	// Build a remapped snapshot then rerun the whole owner matrix with uuid subs (policies unchanged)
	const db = await load(snaps.p5);
	const runbook = sec("RUNBOOK");
	for (const st of runbook.statements.slice(0, 3)) await run(db, st.sql);
	await run(
		db,
		`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status) values ($1, $2, 'pending'), ($3, $4, 'pending')`,
		[A, IDS.UA, B, IDS.UB],
	);
	for (const [uid, cid] of [
		[IDS.UA, A],
		[IDS.UB, B],
	])
		await gotrueAdminCreate(db, uid, `${cid}@y.z`, {}, { clerk_user_id: cid });
	await run(db, `update migration.clerk_user_map set status = 'migrated'`);
	const dupes = await run(
		db,
		`delete from public.users where id in ($1, $2) returning id`,
		[IDS.UA, IDS.UB],
	);
	if (dupes.ok && dupes.n)
		R.notes.push(
			`uuid matrix setup: had to delete ${dupes.n} public.users rows auto-created by handle_auth_user_created for imported users before the remap (import-trigger finding)`,
		);
	await run(db, `delete from public.users where id = $1`, [IDS.C]);
	for (const st of runbook.statements.slice(3)) {
		try {
			await db.exec(st.sql);
		} catch (e) {
			R.notes.push(`remap for uuid matrix failed: ${e.message}`);
		}
	}
	await applySectionTxMode(db, sec("09"));
	const snapU = await db.dump();
	snaps.uuid = snapU;
	await db.close();
	await ownerMatrix(snapU, IDS.UA, IDS.UB, "uuid ids after remap+09");
	const db2 = await load(snapU);
	const r10 = await applySectionTxMode(db2, sec("10"));
	check(
		"apply 10 post-cutover cleanup",
		"ok",
		r10.ok ? "ok" : `${r10.code} ${r10.message}`,
		r10.ok,
	);
	await db2.close();
}

// ======================================================================================================
group =
	"G8 app layer: real drizzle-orm 0.45.2 SQL for the P1 call sites (app-changes.md s.2.3-2.6)";
// ======================================================================================================
async function tryApp(f) {
	try {
		return { ok: true, value: await f() };
	} catch (e) {
		return {
			ok: false,
			code: pgError(e)?.code ?? e.message,
			msg: String(e.cause?.message ?? e.message).slice(0, 200),
		};
	}
}
const sv = (o) =>
	o.ok
		? `ok ${JSON.stringify(o.value)?.slice(0, 400)}`
		: `ERROR ${o.code}: ${o.msg}`;
async function appLayer(snap, a, b, label, catIds, sessionRole = "postgres") {
	const g = (x) => `[${label}] ${x}`;
	const db = await load(snap);
	if (sessionRole !== "postgres") await db.as(sessionRole);
	const adm = async (f) => {
		const prev = db.session;
		await db.as("postgres");
		try {
			return await f();
		} finally {
			await db.as(prev);
		}
	};
	const app = makeApp(db);
	const A_ = { userId: a },
		B_ = { userId: b };
	let o;
	o = await tryApp(() =>
		app.createCatalogue(A_, {
			name: "a-created",
			tags: ["t"],
			content: [{ id: "s1", type: "x" }],
			createdBy: b,
			status: "active",
			id: "00000000-0000-4000-8000-000000000000",
		}),
	);
	check(
		g(
			"createCatalogue (pickEditable strips createdBy/status/id from client payload)",
		),
		"created, created_by = A, status draft, id not client-chosen",
		sv(o),
		o.ok &&
			o.value.createdBy === a &&
			o.value.status === "draft" &&
			o.value.id !== "00000000-0000-4000-8000-000000000000",
	);
	o = await tryApp(() =>
		app.createCatalogue(
			A_,
			{ name: "a-bug", tags: [], createdBy: b, status: "draft" },
			{ bypassPick: true },
		),
	);
	check(
		g("createCatalogue BUG variant (no pickEditable): created_by = B"),
		"42501 (WITH CHECK)",
		sv(o),
		!o.ok && o.code === "42501",
	);
	o = await tryApp(() =>
		app.createCatalogue(
			A_,
			{ name: "a-bug2", tags: [], createdBy: a, status: "active" },
			{ bypassPick: true },
		),
	);
	check(
		g("createCatalogue BUG variant (no pickEditable): status active"),
		"42501 (WITH CHECK)",
		sv(o),
		!o.ok && o.code === "42501",
	);
	o = await tryApp(() => app.createCatalogue(A_, { name: "b-live", tags: [] }));
	let e2 = null;
	try {
		await app.createCatalogue(A_, { name: "b-live", tags: [] });
	} catch (e) {
		e2 = e;
	}
	check(
		g("createCatalogue with another owner's slug"),
		"23505 surfaced through DrizzleQueryError.cause (isUniqueViolation true)",
		`${sv(o)}; isUniqueViolation=${isUniqueViolation(e2)}; errorClass=${e2?.constructor?.name}`,
		!o.ok && o.code === "23505" && isUniqueViolation(e2),
	);
	o = await tryApp(() =>
		app.createCatalogue(
			A_,
			{ name: "a-quota", tags: [] },
			{ maxCatalogues: 1 },
		),
	);
	check(
		g("createCatalogue over plan quota (count under RLS = own rows only)"),
		"PlanLimitError catalogues",
		sv(o),
		!o.ok && /plan_limit:catalogues/.test(o.msg),
	);
	o = await tryApp(() =>
		app.duplicateItem(A_, catIds.aLive, "a-live", 100, true),
	);
	check(
		g(
			"duplicateItem own active catalogue: slug taken -> SAVEPOINT rollback -> '-copy' retry",
		),
		"row a-live-copy, draft, created_by A; after ROLLBACK TO SAVEPOINT role still app_user and sub still A",
		sv(o),
		o.ok &&
			o.value?.name === "a-live-copy" &&
			o.value.status === "draft" &&
			o.value.createdBy === a &&
			o.value.__probe?.cu === "app_user" &&
			o.value.__probe?.uid === a,
	);
	o = await tryApp(() => app.duplicateItem(A_, catIds.bLive, "b-live-stolen"));
	check(
		g("duplicateItem of B's catalogue id"),
		"null (source invisible)",
		sv(o),
		o.ok && o.value === null,
	);
	o = await tryApp(() =>
		app.publishCatalogue(A_, {
			name: "a-draft",
			heading: "Published",
			createdBy: b,
			id: catIds.bLive,
			status: "inactive",
			source: "x",
		}),
	);
	check(
		g("publishCatalogue own draft with mass-assignment payload"),
		"status active, created_by A, id unchanged, heading Published",
		sv(o),
		o.ok &&
			o.value?.status === "active" &&
			o.value.createdBy === a &&
			o.value.id === catIds.aDraft &&
			o.value.heading === "Published",
	);
	o = await tryApp(() =>
		app.publishCatalogue(
			A_,
			{ name: "a-live", heading: "x", createdBy: b },
			{ bypassPick: true },
		),
	);
	check(
		g("publishCatalogue BUG variant (no pickEditable) with createdBy"),
		"42501 (column grant)",
		sv(o),
		!o.ok && o.code === "42501",
	);
	o = await tryApp(() =>
		app.publishCatalogue(A_, { name: "b-draft", heading: "defaced" }),
	);
	check(
		g("publishCatalogue of B's draft by name"),
		"null (not found)",
		sv(o),
		o.ok && o.value === null,
	);
	o = await tryApp(() =>
		app.publishCatalogue(
			A_,
			{ name: "a-created", heading: "x" },
			{ trafficLimit: 1 },
		),
	);
	check(
		g(
			"publishCatalogue when this month's pageviews >= traffic limit (assertCanActivate via private.my_usage)",
		),
		"PlanLimitError traffic",
		sv(o),
		!o.ok && /plan_limit:traffic/.test(o.msg),
	);
	o = await tryApp(() => app.updateItemStatus(A_, catIds.bLive, "inactive"));
	check(
		g("updateItemStatus on B's id"),
		"null (not found)",
		sv(o),
		o.ok && o.value === null,
	);
	o = await tryApp(() => app.updateItemStatus(A_, catIds.aLive, "inactive"));
	check(
		g("updateItemStatus own"),
		"{name: a-live}",
		sv(o),
		o.ok && o.value?.name === "a-live",
	);
	o = await tryApp(() =>
		app.deleteMultipleItems(A_, [catIds.aLive, catIds.bLive]),
	);
	const still = await admin(
		db,
		`select count(*)::int n from public.catalogues where id in ($1, $2)`,
		[catIds.aLive, catIds.bLive],
	);
	check(
		g("deleteMultipleItems([own, B's]) is all-or-nothing"),
		"null; both rows still exist",
		`${sv(o)}; rows=${rowsJson(still)}`,
		o.ok && o.value === null && still.rows[0].n === 2,
	);
	o = await tryApp(() => app.deleteItem(A_, "b-live"));
	check(
		g("deleteItem('b-live') as A"),
		"false",
		sv(o),
		o.ok && o.value === false,
	);
	o = await tryApp(() => app.upsertQrConfig(A_, "a-live", { v: 1 }));
	const o2 = await tryApp(() => app.upsertQrConfig(A_, "a-live", { v: 2 }));
	const qr = await tryApp(() => app.getOwnedQrConfig(A_, "a-live"));
	check(
		g("upsertQrConfig own twice + getOwnedQrConfig"),
		"success x2, config v=2",
		`${sv(o)} | ${sv(o2)} | ${sv(qr)}`,
		o.value?.success && o2.value?.success && qr.value?.config?.v === 2,
	);
	o = await tryApp(() => app.upsertQrConfig(A_, "b-live", { v: 666 }));
	const bq = await admin(
		db,
		`select config from public.qr_configs where catalogue = 'b-live'`,
	);
	check(
		g("upsertQrConfig onto B's catalogue (existing row)"),
		"{success:false, Not found} via isPermissionDenied; B's config unchanged",
		`${sv(o)}; B row=${rowsJson(bq)}`,
		o.ok &&
			o.value.success === false &&
			o.value.code === "42501" &&
			!JSON.stringify(bq.rows).includes("666"),
	);
	o = await tryApp(() => app.upsertQrConfig(A_, "does-not-exist", { v: 1 }));
	check(
		g("upsertQrConfig for a nonexistent catalogue"),
		"Not found (WITH CHECK 42501 before FK)",
		sv(o),
		o.ok && o.value.success === false,
	);
	o = await tryApp(() => app.getOwnedQrConfig(A_, "b-live"));
	check(
		g("getOwnedQrConfig for B's catalogue"),
		"null",
		sv(o),
		o.ok && o.value === null,
	);
	const t1 = await tryApp(() => app.saveTheme(A_, "mine", { bg: "#111" }));
	const t2 = await tryApp(() => app.saveTheme(A_, "mine", { bg: "#222" }));
	const tl = await tryApp(() => app.listSavedThemes(A_));
	check(
		g("saveTheme upsert twice + listSavedThemes"),
		"same id both times, colors #222, list only A's",
		`${sv(t1)} | ${sv(t2)} | ${sv(tl)}`,
		t1.ok &&
			t2.ok &&
			t1.value.id === t2.value.id &&
			t2.value.colors.bg === "#222" &&
			tl.ok &&
			tl.value.every((r) => r.userId === a),
	);
	const bTheme = await admin(
		db,
		`select id from public.user_themes where user_id = $1 limit 1`,
		[b],
	);
	o = await tryApp(() => app.deleteSavedTheme(A_, bTheme.rows[0].id));
	check(
		g("deleteSavedTheme(B's theme id)"),
		"false",
		sv(o),
		o.ok && o.value === false,
	);
	o = await tryApp(() => app.getMyUserData(A_));
	check(
		g("getMyUserData (select * users + private.my_usage())"),
		"A's row only with usage",
		sv(o),
		o.ok &&
			o.value?.user?.id === a &&
			o.value.usage &&
			Number(o.value.usage.catalogues) >= 1,
	);
	o = await tryApp(() =>
		app.saveCookiePreferences(A_, {
			accepted: true,
			essential: true,
			analytics: false,
			marketing: false,
			timestamp: new Date().toISOString(),
			version: "1",
		}),
	);
	check(g("saveCookiePreferences"), "true", sv(o), o.ok && o.value === true);
	const s1 = await tryApp(() => app.startAiTurn(A_, "a-live", 100, false));
	const s2 = await tryApp(() => app.startAiTurn(A_, "a-live", 100, true));
	const s3 = await tryApp(() => app.startAiTurn(A_, "b-live", 100, false));
	const s4 = await tryApp(() => app.startAiTurn(A_, "a-live", null, false));
	const rf = s4.ok
		? await tryApp(() => app.refundAiTurn(A_, s4.value.turnId))
		: s4;
	check(
		g(
			"startAiTurn (getPlanForUpdate FOR UPDATE + begin_ai_turn) charged / continued / B's catalogue / null limit + refund",
		),
		"charged, continued, not_found, charged (unlimited), refund true",
		[s1, s2, s3, s4, rf].map(sv).join(" | "),
		s1.value?.outcome === "charged" &&
			s2.value?.outcome === "continued" &&
			s3.value?.outcome === "not_found" &&
			s4.value?.outcome === "charged" &&
			rf.value === true,
	);
	o = await tryApp(() => app.checkCatalogueName(A_, "b-draft"));
	const o3 = await tryApp(() => app.checkCatalogueName(A_, "brand-new-slug"));
	check(
		g("checkCatalogueName"),
		"b-draft false, brand-new-slug true",
		`${sv(o)} | ${sv(o3)}`,
		o.value === false && o3.value === true,
	);
	o = await tryApp(() => app.getPublicCatalogue("b-live"));
	const pd = await tryApp(() => app.getPublicCatalogue("b-draft"));
	const names = await tryApp(() => app.listPublicCatalogueNames());
	const meta = await tryApp(() => app.getPublicCatalogueMeta("a-created"));
	const activeNow = await admin(
		db,
		`select string_agg(name, ',' order by name) names from public.catalogues where status = 'active'`,
	);
	check(
		g(
			"lib/catalogue/public.ts: getPublicCatalogue(active)/(draft), listPublicCatalogueNames == active rows, meta of a draft",
		),
		"row without createdBy; null; names == DB active set; null",
		`${[o, pd, names, meta].map(sv).join(" | ")}; active in DB=${rowsJson(activeNow)}`,
		o.ok &&
			o.value &&
			!("createdBy" in o.value) &&
			pd.value === null &&
			names.ok &&
			names.value.join(",") === activeNow.rows[0].names &&
			meta.ok &&
			meta.value === null,
	);
	o = await tryApp(() => app.publicSelectAllMistake());
	const ff = await tryApp(() => app.publicFindFirstMistake());
	const ffc = await tryApp(() => app.publicFindFirstColumns("b-live"));
	check(
		g(
			"app_public mistakes: tx.select().from(catalogues) and query.catalogues.findFirst() without columns",
		),
		"42501 both; findFirst with explicit columns works",
		[o, ff, ffc].map(sv).join(" | "),
		!o.ok &&
			o.code === "42501" &&
			!ff.ok &&
			ff.code === "42501" &&
			ffc.ok &&
			ffc.value?.name === "b-live",
	);
	const nl1 = await tryApp(() =>
		app.newsletterSignup(catIds.bLive, "drizzle@x.io"),
	);
	const nl2 = await tryApp(() =>
		app.newsletterSignup(catIds.bLive, "drizzle@x.io"),
	);
	const pn = await tryApp(() => app.productNewsletterSignup("drizzle@x.io"));
	const nlc = await admin(
		db,
		`select owner_id from public.newsletter where email = 'drizzle@x.io'`,
	);
	check(
		g(
			"newsletterSignup x2 + productNewsletterSignup via withPublic tx.execute",
		),
		`ok, ok, ok; 1 row owner ${b}`,
		`${[nl1, nl2, pn].map(sv).join(" | ")}; rows=${rowsJson(nlc)}`,
		nl1.ok &&
			nl2.ok &&
			pn.ok &&
			nlc.rows.length === 1 &&
			nlc.rows[0].owner_id === b,
	);
	o = await tryApp(() => app.dashboardCatalogues(A_));
	const dn = await tryApp(() => app.dashboardNewsletter(A_));
	const da = await tryApp(() => app.dashboardAnalytics(A_));
	check(
		g("dashboard routes: catalogues / newsletter (left join) / analytics sums"),
		"only A's rows; pageviews = A's sum only",
		[o, dn, da].map(sv).join(" | "),
		o.ok &&
			o.value.every((r) => r.createdBy === a) &&
			dn.ok &&
			dn.value.every((r) => r.email !== "Sub@x.io") &&
			da.ok &&
			da.value.pv < 99,
	);
	// admin paths (DATABASE_ADMIN_URL = postgres)
	const c1 = await tryApp(() =>
		adm(() =>
			app.claimEvent({
				eventId: "evt_d1",
				eventType: "subscription.updated",
				occurredAt: new Date().toISOString(),
			}),
		),
	);
	const c2 = await tryApp(() =>
		adm(() =>
			app.claimEvent({
				eventId: "evt_d1",
				eventType: "subscription.updated",
				occurredAt: new Date().toISOString(),
			}),
		),
	);
	check(
		g(
			"asAdmin Paddle claimEvent (drizzle pgSchema private.paddle_events) twice",
		),
		"true, false",
		`${sv(c1)} | ${sv(c2)}`,
		c1.value === true && c2.value === false,
	);
	const bPlan = (
		await admin(db, `select plan_id from public.users where id = $1`, [b])
	).rows[0].plan_id;
	o = await tryApp(() =>
		adm(() =>
			app.upsertClerkUser(
				{ id: b, email: "b2@test.dev", name: "B2", image: null },
				IDS.PLAN,
			),
		),
	);
	const bAfter = await admin(
		db,
		`select plan_id, email from public.users where id = $1`,
		[b],
	);
	check(
		g(
			"asAdmin upsertClerkUser on an existing paid user never overwrites plan_id",
		),
		`plan_id stays ${bPlan}`,
		`${sv(o)}; row=${rowsJson(bAfter)}`,
		o.ok &&
			bAfter.rows[0].plan_id === bPlan &&
			bAfter.rows[0].email === "b2@test.dev",
	);
	o = await tryApp(() => adm(() => app.deleteClerkUser(b)));
	const gone = await admin(
		db,
		`select (select count(*)::int from public.catalogues where created_by = $1) c, (select count(*)::int from public.newsletter where owner_id = $1) n`,
		[b],
	);
	check(
		g("asAdmin deleteClerkUser returns catalogue names and cascades"),
		"names [b-draft, b-live]; c 0, n 0",
		`${sv(o)}; ${rowsJson(gone)}`,
		o.ok &&
			o.value.length === 2 &&
			gone.rows[0].c === 0 &&
			gone.rows[0].n === 0,
	);
	await db.close();
}
await appLayer(snaps.p3, A, B, "clerk ids, 06 applied", IDS.CAT);
if (snaps.uuid)
	await appLayer(
		snaps.uuid,
		IDS.UA,
		IDS.UB,
		"uuid ids after remap+09",
		IDS.CAT,
	);
if (snaps.p4)
	await appLayer(
		snaps.p4,
		A,
		B,
		"clerk ids, DB_CONNECTION_STRING=app_rls (07)",
		IDS.CAT,
		"app_rls",
	);

// ======================================================================================================
group = "G9 additional SQL semantics";
// ======================================================================================================
{
	const db = await load(snaps.p3);
	// initPlan: helper evaluated once per statement
	let o = await inRole(db, "app_user", { sub: A }, () =>
		run(db, `explain (costs off) select name from public.catalogues`),
	);
	const plan = o.ok
		? o.rows.map((r) => r["QUERY PLAN"]).join(" / ")
		: summarize(o);
	check(
		"policy (select private.current_user_id()) is planned as an InitPlan (once per statement)",
		"plan contains InitPlan",
		plan,
		/InitPlan/.test(plan),
	);
	// app_public count(*) with only column grants, filter on created_by
	o = await P(db, `select count(*)::int n from public.catalogues`);
	const o2 = await P(
		db,
		`select name from public.catalogues where created_by = $1`,
		[B],
	);
	check(
		"app_public: count(*) works with column-level SELECT; filtering on created_by is denied",
		"count 2; 42501",
		`${summarize(o)} | ${summarize(o2)}`,
		o.ok && o.rows[0].n === 2 && isErr(o2, "42501"),
	);
	// statement_timeout from the wrapper
	o = await P(
		db,
		`select pg_sleep(4), current_setting('statement_timeout') st`,
	);
	if (isErr(o, "57014"))
		check(
			"wrapper statement_timeout (app_public 3s) cancels a 4s statement",
			"57014",
			o,
			true,
		);
	else
		R.notes.push(
			`LIMITATION: PGlite does not enforce statement_timeout (pg_sleep(4) under the app_public wrapper returned ${summarize(o)}); the GUC value itself is set per transaction as designed.`,
		);
	// savepoint rollback keeps transaction-local role/claims set before it
	o = await inRole(db, "app_user", { sub: A }, async () => {
		await db.exec("savepoint s1");
		await run(
			db,
			`select pg_catalog.set_config('request.jwt.claims', '{"sub":"evil"}', true)`,
		);
		await run(
			db,
			`insert into public.catalogues (name, created_by, tags) values ('a-live', $1, '{}')`,
			[A],
		);
		await db.exec("rollback to savepoint s1");
		return run(
			db,
			`select current_user::text cu, private.current_user_id() uid`,
		);
	});
	check(
		"ROLLBACK TO SAVEPOINT restores claims to the value set before the savepoint and keeps SET ROLE",
		`cu app_user, uid ${A}`,
		o,
		o.ok && o.rows[0].cu === "app_user" && o.rows[0].uid === A,
	);
	// auth.users trigger drop needs ownership (design claim in 08)
	await db.as("postgres");
	const tr = await run(
		db,
		`create trigger zz_probe after insert on auth.users for each row execute function private.touch_updated_at()`,
	);
	const dr = await run(db, `drop trigger zz_probe on auth.users`);
	check(
		"design claim (08 rollback): postgres can CREATE TRIGGER on auth.users (TRIGGER privilege) but cannot DROP it (needs ownership)",
		"create ok; drop 42501",
		`${summarize(tr)} | ${summarize(dr)}`,
		tr.ok && isErr(dr, "42501"),
	);
	await admin(db, `drop trigger if exists zz_probe on auth.users`);
	// global default privilege from 01: new functions by postgres have no PUBLIC EXECUTE (pgTAP-in-extensions implication)
	await run(
		db,
		`create function extensions.zz_probe() returns int language sql as 'select 1'`,
	);
	await run(
		db,
		`create function public.zz_probe() returns int language sql as 'select 1'`,
	);
	o = await admin(
		db,
		`select has_function_privilege('app_user', 'extensions.zz_probe()', 'EXECUTE') ext_app_user, has_schema_privilege('app_user', 'extensions', 'USAGE') ext_usage,
      has_function_privilege('anon', 'public.zz_probe()', 'EXECUTE') pub_anon, (select proacl::text from pg_proc where oid = 'public.zz_probe()'::regprocedure) acl`,
	);
	check(
		"after 01, a function postgres creates later (e.g. pgTAP installed by `create extension pgtap` as postgres - unverified) is not EXECUTE-able by app roles or anon, and app roles lack USAGE on extensions",
		"ext_app_user false, ext_usage false, pub_anon false",
		o,
		o.ok &&
			o.rows[0].ext_app_user === false &&
			o.rows[0].ext_usage === false &&
			o.rows[0].pub_anon === false,
		{
			note: "pgTAP files that assert while SET ROLE app_user need both grant usage on schema extensions AND grant execute on all functions in schema extensions (rolled back)",
		},
	);
	// newsletter unique index vs today's case-sensitive pre-check (Phase 1 behaviour change)
	await db.close();
}
{
	// size CHECK semantics on legacy toasted rows
	const db = await load(S_base);
	await run(
		db,
		`insert into public.catalogues (name, created_by, tags, content) values ('legacy-big', $1, '{}', jsonb_build_array(repeat('a', 1500000)))`,
		[IDS.A],
	);
	for (const s of sections.filter(
		(s) => s.kind === "MIGRATION" && s.name < "07",
	)) {
		const r = await applySectionTxMode(db, s);
		if (!r.ok)
			R.notes.push(`size-semantics apply ${s.name}: ${r.code} ${r.message}`);
	}
	const sz = await admin(
		db,
		`select pg_column_size(content) stored from public.catalogues where name = 'legacy-big'`,
	);
	const v = await admin(
		db,
		`select convalidated from pg_constraint where conname = 'catalogues_content_size'`,
	);
	const u1 = await U(
		db,
		IDS.A,
		`update public.catalogues set heading = 'h' where name = 'legacy-big' returning name`,
	);
	const u2 = await U(
		db,
		IDS.A,
		`update public.catalogues set content = content where name = 'legacy-big' returning name`,
	);
	const u3 = await U(
		db,
		IDS.A,
		`update public.catalogues set content = content || '[1]'::jsonb where name = 'legacy-big' returning name`,
	);
	check(
		"size CHECK semantics: legacy 1.5 MB compressible content (stored toasted ~17 KB) passes 06 VALIDATE; unrelated UPDATE ok; content = content ok (toast pointer); any real content edit fails",
		"validated; heading ok; content=content ok; edit 23514",
		`stored=${rowsJson(sz)} validated=${rowsJson(v)} heading=${summarize(u1)} same=${summarize(u2)} edit=${summarize(u3)}`,
		v.rows[0]?.convalidated === true &&
			u1.ok &&
			u3.ok === false &&
			u3.code === "23514",
		{
			severity: "info",
			note: "owners of grandfathered huge catalogues can no longer save content; PROD audit query max(pg_column_size) reports COMPRESSED size and under-reports this",
		},
	);
	await db.close();
}
{
	// runbook guard: analytics_upsert_trigger present
	const db = await load(snaps.p5);
	await run(
		db,
		`create function public.update_analytics_on_conflict() returns trigger language plpgsql as 'begin return new; end'`,
	);
	await run(
		db,
		`create trigger analytics_upsert_trigger before update on public.analytics for each row execute function public.update_analytics_on_conflict()`,
	);
	const rb = sec("RUNBOOK");
	for (const st of rb.statements.slice(0, 3)) await run(db, st.sql);
	const errs = [];
	for (const st of rb.statements.slice(3)) {
		try {
			await db.exec(st.sql);
		} catch (e) {
			errs.push(e.message);
		}
	}
	try {
		await db.exec("rollback");
	} catch {}
	check(
		"RUNBOOK aborts when analytics_upsert_trigger exists",
		"first error mentions analytics_upsert_trigger",
		JSON.stringify(errs.slice(0, 2)),
		/analytics_upsert_trigger/.test(errs[0] ?? ""),
	);
	await db.close();
}

fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
const fails = R.scenarios.filter((s) => !s.pass);
console.log(
	`pg${VER} ${RLS_FILE}: sqlErrors=${R.sqlErrors.length} tx=${R.txMode.filter((t) => !t.ok).length} failed scenarios=${fails.length}/${R.scenarios.length}`,
);
for (const f of fails)
	console.log(
		` FAIL [${f.group}] ${f.scenario}\n   expected: ${f.expected}\n   actual:   ${f.actual}`,
	);
