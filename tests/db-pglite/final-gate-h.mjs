// Gate H: A.14 rollback SQL applied in reverse after applying everything.
import fs from "node:fs";
import {
	IDS,
	applyTx,
	psql,
	run,
	U,
	P,
	REST,
	admin,
	gotrue,
	gotrueCreate,
	isErr,
	rowsJson,
	col,
	summarize,
	T,
} from "./final-lib.mjs";
const APPMIG = new URL("../../supabase/migrations", import.meta.url).pathname;

export async function gateH(ctx) {
	const { env, R, check, snaps, setGroup } = ctx;
	setGroup("H A.14 rollback SQL in reverse");
	const lines = (f, a, b) =>
		fs
			.readFileSync(`${APPMIG}/${f}`, "utf8")
			.split("\n")
			.slice(a - 1, b)
			.join("\n");
	const prose = {
		M09: () =>
			env.sql.section(
				"M02",
				"-- 2.2 Webhook trigger function",
				"-- 2.4 Brevo trigger",
			),
		M06pre: () => env.sql.section("M05", "-- 5.5 AI charge", null),
		M02: () =>
			[
				lines("20260911213819_remote_schema.sql", 55, 91),
				`drop trigger if exists "Brevo New Contact Webhook" on public.users;`,
				`CREATE OR REPLACE TRIGGER "Brevo New Contact Webhook" AFTER INSERT OR UPDATE ON "public"."users" FOR EACH ROW EXECUTE FUNCTION "public"."call_edge_function_with_vault_secret"('create-brevo-contact');`,
				lines(
					"20260912093000_lockdown_privileges_and_schema_fixes.sql",
					242,
					267,
				),
				`delete from private.settings where key = 'edge_functions_base_url';`,
			].join("\n"),
	};
	// state expected after each rollback step (i.e. the schema of the previous migration)
	const expectAfter = {
		M10: `select (select pg_get_functiondef('private.handle_auth_user_created()'::regprocedure) !~ 'insert into public.users') ok`,
		M09: `select pg_get_functiondef('public.call_edge_function_with_vault_secret()'::regprocedure) !~ 'x-webhook-secret' and (select command from cron.job where jobname = 'Sync Plans') !~ 'edge_webhook_secret' ok`,
		M08: `select not exists (select 1 from pg_roles where rolname = 'app_rls') ok`,
		M07: `select not exists (select 1 from pg_constraint where conname in ('catalogues_name_slug', 'catalogues_other_json_size')) ok`,
		M06: `select to_regprocedure('private.begin_ai_turn(text, integer, boolean)') is not null and to_regprocedure('private.begin_ai_turn(text, integer, text, uuid, text)') is null and to_regprocedure('private.set_plan_state(uuid, boolean, integer, text)') is null
            and has_function_privilege('app_user', 'private.begin_ai_turn(text, integer, boolean)', 'EXECUTE') and has_function_privilege('app_user', 'private.refund_ai_turn(uuid)', 'EXECUTE') ok`,
		M05: `select to_regprocedure('private.begin_ai_turn(text, integer, boolean)') is null and to_regprocedure('private.my_usage()') is null and to_regprocedure('private.subscribe_catalogue_newsletter(uuid, text)') is null ok`,
		M04: `select not exists (select 1 from pg_policy p join pg_class c on c.oid = p.polrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public')
            and not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','v') and has_any_column_privilege('app_user', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES'))
            and not exists (select 1 from pg_trigger where tgname in ('catalogues_pin_insert', 'catalogues_touch_updated_at')) ok`,
		M03: `select not exists (select 1 from pg_constraint where conname in ('catalogues_status_check', 'catalogues_content_size', 'users_cookie_prefs_size')) ok`,
		M02: `select pg_get_functiondef('public.call_edge_function_with_vault_secret()'::regprocedure) ~ 'uhfbapjuzvlyzyodxhqn' and not exists (select 1 from private.settings where key = 'edge_functions_base_url') ok`,
		M01: `select not exists (select 1 from pg_roles where rolname in ('app_user', 'app_public')) and to_regnamespace('private') is null ok`,
		M00: `select has_table_privilege('anon', 'public.catalogues', 'SELECT') and exists (select 1 from pg_policy where polname = 'tmp_rollback_anon_catalogues_select') ok`,
	};
	const consistency = async (db, label, { signup }) => {
		const out = {};
		const slug = label
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
		out.pg_update = await run(
			db,
			`update public.users set name = coalesce(name, '') where id = (select id from public.users order by id limit 1) returning id`,
		);
		out.pg_cat = await run(
			db,
			`insert into public.catalogues (name, created_by, tags, status) select $1, id, '{}', 'draft' from public.users order by id limit 1 returning name`,
			[`rb-${slug}`],
		);
		if (signup)
			out.signup = await gotrueCreate(db, {
				id: crypto.randomUUID(),
				email: `rb-${slug}@x.io`,
				confirmed: true,
			});
		out.anon = await REST(
			db,
			"anon",
			{ role: "anon" },
			`select 1 from public.users limit 1`,
		);
		out.broken = await admin(
			db,
			`select count(*)::int n from pg_trigger t where not t.tgisinternal and not exists (select 1 from pg_proc p where p.oid = t.tgfoid)`,
		);
		return out;
	};
	const irreversibleM01 = /cannot be rolled back once M10/.test(
		env.sql.text("RB_M01"),
	);
	const variants = [
		["all applied through M13", snaps.m13, { m13: true, m10: true }],
		[
			"all applied through M12, R2 still in its window",
			snaps.m12,
			{ m13: false, m10: true },
		],
		[
			"Phase 1 rollback: M00-M09 applied (before M10)",
			snaps.m09,
			{
				m13: false,
				m10: false,
				only: [
					"M09",
					"M08",
					"M07",
					"M06",
					"M05",
					"M04",
					"M03",
					"M02",
					"M01",
					"M00",
				],
			},
		],
	];
	for (const [vlabel, dump, opt] of variants) {
		if (!dump) {
			R.notes.push(`H variant '${vlabel}' skipped: snapshot missing`);
			continue;
		}
		const db = await env.load(dump);
		let steps = [
			["M13", null, "irreversible (comment only)"],
			[
				"M12",
				env.sql
					.text("RB_M12")
					.replace(/^-- M12: /, "")
					.replace(/;.*$/s, ";"),
				"statement inside the comment",
			],
			[
				"R1",
				opt.m13 ? null : env.sql.text("R2"),
				opt.m13
					? "A.R2 after M13 is outside its window (cutover_log dropped)"
					: "A.R2",
			],
			["M10", env.sql.text("RB_M10"), "runnable"],
			["M09", prose.M09(), "prose: re-run M02 2.2 + 2.3"],
			["M08", env.sql.text("RB_M08"), "runnable"],
			["M07", env.sql.text("RB_M07"), "runnable"],
			[
				"M06",
				prose.M06pre() + "\n" + env.sql.text("RB_M06"),
				"prose (re-run M05 5.5-5.7) + runnable drops",
			],
			["M05", env.sql.text("RB_M05"), "runnable"],
			["M04", env.sql.text("RB_M04"), "runnable"],
			["M03", env.sql.text("RB_M03"), "runnable"],
			[
				"M02",
				prose.M02(),
				"prose (optional): original function body, unnarrowed trigger, original cron",
			],
			[
				"M01",
				opt.m10 && irreversibleM01 ? null : env.sql.text("RB_M01"),
				opt.m10 && irreversibleM01
					? "documented as irreversible once M10 is applied"
					: "runnable",
			],
			["M00", env.sql.text("RB_M00"), "runnable example"],
		];
		if (opt.only) steps = steps.filter(([k]) => opt.only.includes(k));
		let afterR1 = !!opt.m13 || !opt.m10;
		for (const [k, text, kind] of steps) {
			if (k === "R1") afterR1 = true;
			if (!text) {
				check(
					`[${vlabel}] A.14 rollback ${k}`,
					`${kind}: skipped`,
					"skipped",
					true,
					{ severity: "info" },
				);
				continue;
			}
			const r =
				k === "R1"
					? await psql(env, db, null, { text })
					: await applyTx(env, db, null, { text });
			const c = r.ok
				? await consistency(db, `${vlabel}-${k}`, {
						signup: afterR1 && k !== "R1",
					})
				: null;
			const e = r.ok && expectAfter[k] ? await admin(db, expectAfter[k]) : null;
			const cs = c
				? Object.entries(c)
						.map(([n, x]) => `${n}=${summarize(x).slice(0, 80)}`)
						.join("; ")
				: "";
			const consistent =
				!!c &&
				c.pg_update.ok &&
				c.pg_cat.ok &&
				(!c.signup || c.signup.ok) &&
				c.broken.ok &&
				c.broken.rows[0].n === 0 &&
				(k === "M00" ? true : isErr(c.anon, "42501")) &&
				(!expectAfter[k] || (e?.ok && e.rows[0].ok === true));
			check(
				`[${vlabel}] A.14 rollback ${k}`,
				`${kind}: runs without error and leaves the previous migration's schema, still usable`,
				`${r.ok ? "ok" : `ERROR ${r.code}: ${r.message} :: ${r.stmt}`}; expect=${e ? summarize(e) : "-"}; ${cs}`,
				r.ok && consistent,
			);
		}
		await db.close();
	}
}
