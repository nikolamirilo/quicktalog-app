// Executes the decision text's SQL (decision-sql.sql) and probes where it differs from rls.sql.
import fs from "node:fs";
import { PGlite } from "pglite17";
import { Db, parseSections } from "./lib.mjs";
import { buildBase, IDS } from "./base.mjs";
import { applySectionStatementMode, applySectionTxMode } from "./apply.mjs";
const OUT = {
	statementModeRaw: [],
	txModeRaw: [],
	txModeDeduped: [],
	probes: [],
};
const sections = parseSections(fs.readFileSync("decision-sql.sql", "utf8"));
const probe = (name, expected, actual, pass) =>
	OUT.probes.push({ name, expected, actual, pass });
const run = async (db, sql, p = []) => {
	try {
		const r = await db.query(sql, p);
		return { ok: true, rows: r.rows, n: r.rows.length || r.affectedRows || 0 };
	} catch (e) {
		return { ok: false, code: e.code, msg: e.message };
	}
};
const S = (o) =>
	o.ok
		? `ok ${JSON.stringify(o.rows).slice(0, 300)} n=${o.n}`
		: `ERROR ${o.code}: ${o.msg}`;
async function inRole(db, role, claims, sql, p = [], commit = false) {
	await db.exec("begin");
	await db.query(
		`select set_config('role', $1, true), set_config('request.jwt.claims', $2, true)`,
		[role, JSON.stringify({ ...claims, role })],
	);
	const o = await run(db, sql, p);
	try {
		await db.exec(commit && o.ok ? "commit" : "rollback");
	} catch {}
	return o;
}
const base = await buildBase(PGlite, {});
const dump = await base.dump();
// 1) as written, on data with duplicates (the prose dedupe step not performed)
{
	const db = await Db.create(PGlite, { dump });
	await db.as("postgres");
	for (const s of sections.filter((s) => s.kind === "MIGRATION"))
		OUT.statementModeRaw.push(...(await applySectionStatementMode(db, s)));
	await db.close();
	const db2 = await Db.create(PGlite, { dump });
	await db2.as("postgres");
	for (const s of sections.filter((s) => s.kind === "MIGRATION"))
		OUT.txModeRaw.push({ name: s.name, ...(await applySectionTxMode(db2, s)) });
	await db2.close();
}
// 2) after a manual dedupe (what the prose asks for)
const db = await Db.create(PGlite, { dump });
await db.as("postgres");
await db.exec(`delete from public.newsletter where id = '0e000000-0000-4000-8000-000000000002';
  delete from public.product_newsletter where id = '0f000000-0000-4000-8000-000000000002';
  delete from public.qr_configs where id in ('0d000000-0000-4000-8000-000000000001','0d000000-0000-4000-8000-000000000003');`);
// a catalogue whose footer.newsletter is not a JSON boolean (the column is free-form jsonb; app_user can write it)
await db.exec(
	`insert into public.catalogues (name, created_by, status, tags, footer) values ('odd-footer', '${IDS.A}', 'draft', '{}', '{"newsletter": "maybe"}')`,
);
for (const s of sections.filter((s) => s.kind === "MIGRATION" && s.name < "04"))
	OUT.txModeDeduped.push({
		name: s.name,
		...(await applySectionTxMode(db, s)),
	});
let o = await inRole(
	db,
	"app_public",
	{},
	`select private.subscribe_catalogue_newsletter($1::uuid, 'x@y.io')`,
	[IDS.CAT.bLive],
);
const plan = await inRole(
	db,
	"app_public",
	{},
	`explain (costs off) select c.created_by from public.catalogues c where c.id = $1 and c.status = 'active' and coalesce((c.footer ->> 'newsletter')::boolean, false)`,
	[IDS.CAT.bLive],
);
probe(
	'decision subscribe_catalogue_newsletter when ANOTHER catalogue has footer.newsletter = "maybe" (valid jsonb, not a boolean)',
	"signup to b-live still works (rls.sql uses jsonb equality instead)",
	`${S(o)}; plan=${S(plan)}`,
	o.ok,
);
const db3 = await Db.create(PGlite, { dump: await db.dump() });
await db3.as("postgres");
await db3.exec(
	`update public.catalogues set status = 'active' where name = 'odd-footer'`,
);
o = await inRole(
	db3,
	"app_public",
	{},
	`select private.subscribe_catalogue_newsletter((select id from public.catalogues where name = 'odd-footer'), 'x@y.io')`,
);
const o2 = await inRole(
	db3,
	"app_public",
	{},
	`select private.subscribe_catalogue_newsletter(id, 'x@y.io') from (values ('${IDS.CAT.bLive}'::uuid)) v(id)`,
);
probe(
	'decision subscribe_catalogue_newsletter on an ACTIVE catalogue with footer.newsletter = "maybe"',
	"silent no-op (constant response)",
	`${S(o)} | b-live afterwards: ${S(o2)}`,
	o.ok,
);
await db3.close();
// today's meter() (no turn_id) then begin_ai_turn continuation
await db.exec(
	`insert into public.prompts (user_id, catalogue) values ('${IDS.A}', 'a-live')`,
);
o = await inRole(
	db,
	"app_user",
	{ sub: IDS.A },
	`select * from private.begin_ai_turn('a-live', 100, true)`,
	[],
	true,
);
const legacy = await run(
	db,
	`select turn_id, continuations from public.prompts where user_id = $1 and catalogue = 'a-live' order by datetime`,
	[IDS.A],
);
probe(
	"decision M1 (turn_id nullable, no default): continuation right after a Phase-1 meter() row",
	"continued or charged with a non-null turn id",
	`${S(o)}; a-live rows=${S(legacy)}`,
	o.ok && o.rows[0].ai_turn_id !== null,
);
// ocr FK not changed by the decision SQL
const fk = await run(
	db,
	`select conname, confdeltype::text from pg_constraint where conrelid = 'public.ocr'::regclass and contype = 'f' and confrelid = 'public.catalogues'::regclass`,
);
probe(
	"decision M1 only says 'same FK change for public.ocr' in a comment",
	"ocr_catalogue_fkey ON DELETE SET NULL ('n')",
	S(fk),
	fk.ok && fk.rows.every((r) => r.confdeltype === "n"),
);
// rest of the decision migrations on the deduped DB
for (const s of sections.filter(
	(s) =>
		(s.kind === "MIGRATION" && s.name >= "04") ||
		(s.kind === "MIGRATION" && s.name.startsWith("02")) ||
		(s.kind === "MIGRATION" && s.name.startsWith("03")),
)) {
}
for (const s of sections.filter(
	(s) => s.kind === "MIGRATION" && s.name >= "04",
))
	OUT.txModeDeduped.push({
		name: s.name,
		...(await applySectionTxMode(db, s)),
	});
// M4 trigger behaviour
const gotrue = async (sql, p = []) => {
	await db.as("supabase_admin");
	await db.exec(
		"set session authorization supabase_auth_admin; set search_path = auth",
	);
	const r = await run(db, sql, p);
	await db.as("postgres");
	return r;
};
o = await gotrue(
	`insert into users (id, email, raw_user_meta_data) values ('33333333-3333-4333-8333-333333333333', 'n@t.dev', '{"avatar_url":"javascript:alert(1)","full_name":"x"}')`,
);
let row = await run(
	db,
	`select image from public.users where id = '33333333-3333-4333-8333-333333333333'`,
);
probe(
	"decision M4 handle_auth_user_created copies avatar_url unvalidated",
	"image null for javascript: URL (rls.sql avatar_from_meta does this)",
	`${S(o)}; ${S(row)}`,
	row.ok && row.rows[0]?.image === null,
);
o = await gotrue(
	`insert into users (id, email, is_anonymous) values ('44444444-4444-4444-8444-444444444444', null, true)`,
);
row = await run(
	db,
	`select count(*)::int n from public.users where id = '44444444-4444-4444-8444-444444444444'`,
);
probe(
	"decision M4 creates a public.users row (with a plan) for an anonymous auth user",
	"0 rows (rls.sql skips is_anonymous)",
	`${S(o)}; ${S(row)}`,
	row.ok && row.rows[0].n === 0,
);
await db.exec(`delete from private.settings where key = 'default_plan_id'`);
o = await gotrue(
	`insert into users (id, email) values ('55555555-5555-4555-8555-555555555555', 'np@t.dev')`,
);
probe(
	"decision M4 with default_plan_id missing",
	"sign-up blocked with a clear message",
	S(o),
	!o.ok && /default_plan_id|plan/.test(o.msg ?? ""),
);
fs.writeFileSync("results-decision-17.json", JSON.stringify(OUT, null, 2));
console.log(
	JSON.stringify(
		{
			statementModeRaw: OUT.statementModeRaw.map(
				(e) => `${e.section}@${e.line}: ${e.code} ${e.message}`,
			),
			txModeRaw: OUT.txModeRaw.map(
				(t) =>
					`${t.name}: ${t.ok ? "ok" : `${t.code} ${t.message} @${t.line}`}`,
			),
			txModeDeduped: OUT.txModeDeduped.map(
				(t) =>
					`${t.name}: ${t.ok ? "ok" : `${t.code} ${t.message} @${t.line}`}`,
			),
			probes: OUT.probes,
		},
		null,
		2,
	),
);
