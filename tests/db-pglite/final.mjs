// Executes the FINAL_PLAN.md Appendix A SQL in the plan's real phase order and runs scenarios at every gate.
// usage: node final.mjs <sql dir> <17|18> <out.json> [groups comma list]
import fs from "node:fs";
import {
	Env,
	IDS,
	applyTx,
	applyStatements,
	psql,
	run,
	runMany,
	inRole,
	U,
	P,
	REST,
	admin,
	as,
	gotrue,
	gotrueCreate,
	isErr,
	rowsJson,
	col,
	eqArr,
	summarize,
	T,
	WRAPPER_SQL,
} from "./final-lib.mjs";
import { makeApp, pgError, isUniqueViolation } from "./drizzle-app-final.mjs";

const DIR = process.argv[2];
const VER = process.argv[3] ?? "17";
const OUT = process.argv[4] ?? `final-results-${VER}.json`;
const ONLY = process.argv[5] ? process.argv[5].split(",") : null;
const env = new Env(VER, DIR);
const R = { dir: DIR, pg: VER, apply: [], scenarios: [], notes: [] };
let group = "";
function check(scenario, expected, outcome, pass, extra = {}) {
	R.scenarios.push({
		group,
		scenario,
		expected,
		actual: summarize(outcome),
		pass: !!pass,
		...extra,
	});
}
const want = (g) => !ONLY || ONLY.includes(g);
const A = IDS.A,
	B = IDS.B,
	C = IDS.C;
const load = (dump, o) => env.load(dump, o);
const TABLES12 = [
	"analytics",
	"catalogues",
	"job_logs",
	"newsletter",
	"ocr",
	"plans",
	"product_newsletter",
	"prompts",
	"qr_configs",
	"subscriptions",
	"user_themes",
	"users",
];
const H64 = (c) => c.repeat(64);

async function applyChain(db, keys, label) {
	for (const k of keys) {
		const r = await applyTx(env, db, k);
		R.apply.push({ chain: label, key: k, result: T(r) });
		if (!r.ok) return r;
	}
	return { ok: true };
}

// ======================================================================================================
// Base
// ======================================================================================================
const baseDb = await env.buildBase(R);
const S_base = await baseDb.dump();
await baseDb.close();
const snaps = {};

// statement-mode error inventory M00..M10 on a throwaway copy
{
	const db = await load(S_base);
	const errs = [];
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
		"M09",
		"M10",
	])
		errs.push(...(await applyStatements(env, db, k)));
	R.statementModeErrors = errs;
	await db.close();
}

// ======================================================================================================
group = "A gate 0A: baseline + M00";
// ======================================================================================================
{
	const db = await load(S_base);
	let o = await REST(
		db,
		"anon",
		{ role: "anon" },
		`select name, created_by from public.catalogues order by name`,
	);
	check(
		"baseline (today's grants): anon reads catalogues through PostgREST",
		"4 rows (the hole M00 closes)",
		o,
		o.ok && o.n === 4,
	);
	o = await REST(
		db,
		"anon",
		{ role: "anon" },
		`update public.users set plan_id = $1 where id = $2 returning id`,
		[IDS.PRO, A],
	);
	check(
		"baseline: anon self-upgrades users.plan_id",
		"1 row (hole)",
		o,
		o.ok && o.n === 1,
	);
	const r = await applyTx(env, db, "M00");
	R.apply.push({ chain: "A", key: "M00", result: T(r) });
	check(
		"apply M00 as one transaction as postgres on today's grants",
		"ok (all DO assertions pass)",
		T(r),
		r.ok,
	);
	const notices = db.notices
		.filter((n) => n.severity !== "NOTICE" || /M00/.test(n.message))
		.map((n) => `${n.severity}: ${n.message}`);
	R.notes.push(`M00 notices: ${JSON.stringify(notices.slice(0, 5))}`);
	o = await admin(
		db,
		`select string_agg(c.relname, ',' order by c.relname) t, count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') and c.relrowsecurity`,
	);
	check(
		"M00: RLS enabled on the 12 public tables",
		TABLES12.join(","),
		o,
		o.ok && o.rows[0].t === TABLES12.join(",") && o.rows[0].n === 12,
	);
	o = await admin(
		db,
		`select count(*)::int n from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public'`,
	);
	check(
		"M00 creates no policy (RLS on + zero grants = deny)",
		"0 policies",
		o,
		o.ok && o.rows[0].n === 0,
	);
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
				const x = await REST(db, role, claims, sql);
				if (
					!(
						isErr(x, "42501") ||
						(["contacts", "active_subscriptions"].includes(t) &&
							isErr(x, "55000"))
					)
				)
					bad.push(`${role}/${claims.sub ?? "-"}: ${sql} -> ${summarize(x)}`);
			}
		}
		for (const sql of [
			`select nextval('public.job_logs_id_seq')`,
			`select public.call_edge_function_with_vault_secret()`,
		]) {
			total++;
			const x = await REST(db, role, claims, sql);
			if (!isErr(x, ["42501", "0A000"]))
				bad.push(`${role}: ${sql} -> ${summarize(x)}`);
		}
		total++;
		const g = await REST(
			db,
			role,
			claims,
			`select * from public.get_pageview_totals(now() - interval '1 year', now())`,
		);
		if (!isErr(g, "42883"))
			bad.push(`${role}: get_pageview_totals -> ${summarize(g)}`);
	}
	check(
		"M00 PostgREST perimeter: anon, authenticated (uuid sub), authenticated (Clerk sub) x 14 relations x S/I/U/D + sequence + RPCs",
		`all ${total} denied (42501 / 55000 on views / 42883 dropped RPC)`,
		bad.length ? bad.slice(0, 6).join(" || ") : `all ${total} denied`,
		bad.length === 0,
	);
	o = await admin(
		db,
		`select defaclrole::regrole::text r, coalesce(defaclnamespace::regnamespace::text,'-') s, defaclobjtype t, defaclacl::text acl from pg_default_acl where defaclrole = 'postgres'::regrole order by 2, 3`,
	);
	check(
		"M00: postgres default ACLs in public grant nothing to anon/authenticated",
		"no anon=/authenticated= entries",
		o,
		o.ok && !/(anon|authenticated)=/.test(JSON.stringify(o.rows)),
	);

	// Phase 0A app paths (Drizzle as postgres through asAdmin / DB_CONNECTION_STRING=postgres) still work
	const app = makeApp(db);
	const tryApp = async (f) => {
		try {
			return { ok: true, value: await f() };
		} catch (e) {
			return {
				ok: false,
				code: pgError(e)?.code ?? e.message,
				msg: String(e.cause?.message ?? e.message).slice(0, 200),
			};
		}
	};
	const sv = (x) =>
		x.ok
			? `ok ${JSON.stringify(x.value)?.slice(0, 200)}`
			: `ERROR ${x.code}: ${x.msg}`;
	const up = await tryApp(() =>
		app.upsertClerkUser(
			{ id: B, email: "b@test.dev", name: "Bob2", image: null },
			IDS.PLAN,
		),
	);
	const ens = await tryApp(() =>
		app.ensureUserRow(
			{
				id: "user_2eEeeeeeeeeeeeeeeeeeee5",
				email: "e@test.dev",
				name: "Eve",
				image: null,
			},
			IDS.PLAN,
		),
	);
	const pads = await tryApp(() => app.paddleSetPlan("ctm_b", IDS.PRO));
	const pub = await tryApp(() =>
		app.asAdmin("items", (t) =>
			t.execute(
				`select name from public.catalogues where status = 'active' order by name`,
			),
		),
	);
	const dash = await tryApp(() =>
		app.asAdmin("dash", (t) =>
			t.execute(
				`select coalesce(sum(pageview_count),0)::int pv from public.analytics where user_id = '${A}'`,
			),
		),
	);
	const subs = await run(
		db,
		`insert into public.subscriptions (subscription_id, subscription_status, price_id, customer_id) values ('sub_b', 'active', $1, 'ctm_b') on conflict (subscription_id) do update set subscription_status = excluded.subscription_status returning 1`,
		[IDS.PRO],
	);
	const del = await tryApp(() =>
		app.deleteClerkUser("user_2eEeeeeeeeeeeeeeeeeeee5"),
	);
	check(
		"Phase 0A app paths after M00 (DB_CONNECTION_STRING/DATABASE_ADMIN_URL = postgres): Paddle plan update + subscriptions upsert (fires CRM triggers), public items read, dashboard analytics, Clerk delete",
		"all ok",
		[pads, pub, dash, del].map(sv).join(" | ") + ` | subs=${summarize(subs)}`,
		pads.ok && pub.ok && dash.ok && del.ok && subs.ok,
	);
	// Drizzle names EVERY column of a table in an INSERT, filling the ones the
	// caller omitted with `default`. The installed @quicktalog/common schema is
	// pulled from a post-M10 database, so every insert into `users` names
	// `welcome_email_sent_at` — and fails on a database that has not had M10.
	//
	// That makes M10 a hard precondition for deploying this app, not a migration
	// that can follow the deploy the way M00 did. This check is here so the
	// constraint is asserted rather than discovered in production; it is expected
	// to start failing the day the baseline includes M10, and should be deleted
	// then. UPDATE and DELETE name only the columns they touch, which is why
	// `paddleSetPlan` and `deleteClerkUser` above still pass.
	check(
		"Clerk-era inserts into public.users need M10 first (the installed schema has welcome_email_sent_at)",
		"both fail 42703",
		[up, ens].map(sv).join(" | "),
		!up.ok && up.code === "42703" && !ens.ok && ens.code === "42703",
	);
	o = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`select count(*)::int n from public.catalogues`,
	);
	const w2 = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`insert into public.job_logs (job_name, status, log) values ('x', 'ok', '{}') returning id`,
	);
	const w3 = await REST(
		db,
		"service_role",
		{ role: "service_role" },
		`update public.catalogues set status = 'inactive' where created_by = $1 returning name`,
		[B],
	);
	check(
		"worker (service_role over PostgREST) after M00: read catalogues, insert job_logs, inactivate",
		"ok, ok, 2 rows",
		`${summarize(o)} | ${summarize(w2)} | ${summarize(w3)}`,
		o.ok && w2.ok && w3.ok && w3.n === 2,
	);
	snaps.m00 = null; // snapshot taken from a clean apply below (the scenarios above mutated data)
	// idempotency
	const r2 = await applyTx(env, db, "M00");
	check("re-apply M00 (idempotent)", "ok", T(r2), r2.ok);
	await db.close();
}
{
	const db = await load(S_base);
	const r = await applyTx(env, db, "M00");
	snaps.m00 = await db.dump();
	await db.close();
	// C1 negative: a PUBLIC-executable function in public
	const db2 = await load(S_base);
	await run(
		db2,
		`create function public.zz_public_exec() returns int language sql as 'select 1'`,
	);
	const r2 = await applyTx(env, db2, "M00");
	check(
		"C1: M00 with a function in public that PUBLIC can execute",
		"fails with 'functions in public are still executable by anon/authenticated (PUBLIC grant?)'",
		T(r2),
		!r2.ok && /still executable/.test(r2.message ?? ""),
	);
	await db2.close();
	// C1 negative: an object created in public by supabase_admin (default ACL grants anon ALL; postgres cannot revoke)
	const db3 = await load(S_base);
	await admin(db3, `create table public.zz_ext_table (a int)`);
	const r3 = await applyTx(env, db3, "M00");
	check(
		"C1: M00 when supabase_admin created a table in public (its default ACL grants anon ALL; postgres is not the grantor)",
		"fails loudly (RLS off or anon privileges message), nothing applied",
		T(r3),
		!r3.ok && /M00:/.test(r3.message ?? ""),
	);
	await db3.close();
	R.apply.push({ chain: "A-clean", key: "M00", result: T(r) });
}

// ======================================================================================================
group = "B gate 1: M01..M06 (Clerk ids)";
// ======================================================================================================
{
	// M04 without M00 on a fresh stub
	const db = await load(S_base);
	const r = await applyChain(db, ["M01", "M02", "M03", "M04"], "B-no-M00");
	check(
		"C5: M01..M04 without M00 on a fresh stub",
		"M04 fails with 'M04: apply M00_perimeter_close first'",
		T(r),
		!r.ok &&
			r.key === "M04" &&
			/apply M00_perimeter_close first/.test(r.message ?? ""),
	);
	await db.close();
}
{
	const db = await load(snaps.m00);
	const labels = ["M01", "M02", "M03", "M04", "M05", "M06"];
	for (const k of labels) {
		const r = await applyTx(env, db, k);
		R.apply.push({ chain: "main", key: k, result: T(r) });
		check(
			`apply ${k} (after M00) as one transaction as postgres`,
			"ok",
			T(r),
			r.ok,
		);
		if (k === "M03") snaps.m03 = await db.dump();
		if (k === "M05") snaps.m05 = await db.dump();
	}
	snaps.m06 = await db.dump();
	await db.close();
}
if (want("B"))
	await import("./final-gate-b.mjs").then((m) =>
		m.gateB({ env, R, check, snaps, setGroup: (g) => (group = g), S_base }),
	);
if (want("C"))
	await import("./final-gate-c.mjs").then((m) =>
		m.gateC({ env, R, check, snaps, setGroup: (g) => (group = g), S_base }),
	);
else {
	const db = await load(snaps.m06);
	await applyTx(env, db, "M07");
	snaps.m07 = await db.dump();
	await db.close();
}
{
	const db = await load(snaps.m07);
	const r = await applyTx(env, db, "M08");
	R.apply.push({ chain: "main", key: "M08", result: T(r) });
	group = "D gate 1 end: M08 app_rls";
	check("apply M08 as postgres", "ok", T(r), r.ok);
	snaps.m08 = await db.dump();
	const r9 = await applyTx(env, db, "M09");
	R.apply.push({ chain: "main", key: "M09", result: T(r9) });
	group = "E Track K: M09";
	check("apply M09 as postgres", "ok", T(r9), r9.ok);
	snaps.m09 = await db.dump();
	const r10 = await applyTx(env, db, "M10");
	R.apply.push({ chain: "main", key: "M10", result: T(r10) });
	group = "F gate 2: M10";
	check("apply M10 as postgres", "ok", T(r10), r10.ok);
	snaps.m10 = await db.dump();
	await db.close();
}
if (want("D"))
	await import("./final-gate-d.mjs").then((m) =>
		m.gateD({ env, R, check, snaps, setGroup: (g) => (group = g) }),
	);
if (want("E"))
	await import("./final-gate-e.mjs").then((m) =>
		m.gateE({ env, R, check, snaps, setGroup: (g) => (group = g), S_base }),
	);
if (want("F"))
	await import("./final-gate-f.mjs").then((m) =>
		m.gateF({ env, R, check, snaps, setGroup: (g) => (group = g) }),
	);
if (want("G"))
	await import("./final-gate-g.mjs").then((m) =>
		m.gateG({ env, R, check, snaps, setGroup: (g) => (group = g) }),
	);
if (want("H"))
	await import("./final-gate-h.mjs").then((m) =>
		m.gateH({ env, R, check, snaps, setGroup: (g) => (group = g), S_base }),
	);
if (want("I"))
	await import("./final-gate-i.mjs").then((m) =>
		m.gateI({ env, R, check, snaps, setGroup: (g) => (group = g), S_base }),
	);

fs.writeFileSync(OUT, JSON.stringify(R, null, 2));
const fails = R.scenarios.filter((s) => !s.pass);
console.log(
	`pg${VER} ${DIR.split("/").pop()}: statementModeErrors=${R.statementModeErrors.length} applyFailures=${R.apply.filter((a) => a.result !== "ok").length} failed scenarios=${fails.length}/${R.scenarios.length}`,
);
for (const e of R.statementModeErrors)
	console.log(
		` STMT ${e.key}@${e.line}: ${e.code} ${e.message} :: ${e.stmt.slice(0, 120)}`,
	);
for (const f of fails)
	console.log(
		` FAIL [${f.group}] ${f.scenario}\n   expected: ${f.expected}\n   actual:   ${f.actual.slice(0, 700)}`,
	);
// CI gate: a failing scenario or a statement the plan SQL cannot run must fail
// the job. Apply failures are not counted here: one chain applies M04 without
// M00 on purpose, and its scenario asserts that the apply is rejected.
process.exitCode = fails.length > 0 || R.statementModeErrors.length > 0 ? 1 : 0;
