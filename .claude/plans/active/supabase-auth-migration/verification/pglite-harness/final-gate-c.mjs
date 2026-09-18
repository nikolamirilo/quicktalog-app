// Gate C: M07 after audit (data that passes, data that violates).
import {
	IDS,
	applyTx,
	run,
	U,
	admin,
	isErr,
	rowsJson,
	summarize,
	T,
} from "./final-lib.mjs";
const A = IDS.A;

export async function gateC(ctx) {
	const { env, R, check, snaps, setGroup } = ctx;
	setGroup("C gate 1: M07 validate after audit");
	{
		const db = await env.load(snaps.m06);
		const audit = await admin(
			db,
			`select (select count(*)::int from public.catalogues where name !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(name) > 100) bad_slugs,
      (select max(octet_length(content::text)) from public.catalogues) content_bytes`,
		);
		const r = await applyTx(env, db, "M07");
		R.apply.push({ chain: "main", key: "M07", result: T(r) });
		check(
			"M07 on data that passes the A.15 audit",
			"ok; 6 constraints validated",
			`audit=${rowsJson(audit)}; apply=${T(r)}`,
			r.ok,
		);
		const v = await admin(
			db,
			`select string_agg(conname || ':' || convalidated::text, ',' order by conname) c from pg_constraint where conname in ('catalogues_content_size','user_themes_colors_size','qr_configs_config_size','users_cookie_prefs_size','catalogues_name_slug','catalogues_other_json_size')`,
		);
		check(
			"M07 constraints validated",
			"all 6 true",
			v,
			v.ok && (v.rows[0].c.match(/:true/g) || []).length === 6,
		);
		snaps.m07 = await db.dump();
		let o = await U(
			db,
			A,
			`insert into public.catalogues (name, created_by, tags) values ('Bad_Slug', $1, '{}')`,
			[A],
		);
		const o2 = await U(
			db,
			A,
			`insert into public.catalogues (name, created_by, tags) values ($2, $1, '{}')`,
			[A, "a".repeat(101)],
		);
		const o3 = await U(
			db,
			A,
			`update public.catalogues set appearance = (select jsonb_agg(md5(i::text) || md5((i * 7)::text)) from generate_series(1, 20000) i) where name = 'a-draft'`,
		);
		const o4 = await U(
			db,
			A,
			`update public.catalogues set heading = 'fine', appearance = '{"x":1}' where name = 'a-draft' returning name`,
		);
		const o5 = await run(
			db,
			`insert into public.catalogues (name, created_by, tags) values ('admin-Bad', $1, '{}')`,
			[A],
		);
		check(
			"C9 after M07: bad slug (app_user) 23514; 101-char slug 23514; oversized appearance 23514; normal update ok; bad slug via asAdmin 23514",
			"23514, 23514, 23514, ok, 23514",
			[o, o2, o3, o4, o5].map(summarize).join(" | "),
			isErr(o, "23514") &&
				isErr(o2, "23514") &&
				isErr(o3, "23514") &&
				o4.ok &&
				isErr(o5, "23514"),
		);
		await db.close();
	}
	{
		// violating data: a bad slug and an oversized appearance row written before M07 (Phase 1 window)
		const db = await env.load(snaps.m06);
		await run(
			db,
			`insert into public.catalogues (name, created_by, tags) values ('Legacy Name', $1, '{}')`,
			[A],
		);
		const r = await applyTx(env, db, "M07");
		const left = await admin(
			db,
			`select count(*)::int n from pg_constraint where conname in ('catalogues_name_slug', 'catalogues_other_json_size')`,
		);
		const sizes = await admin(
			db,
			`select string_agg(conname || ':' || convalidated::text, ',' order by conname) c from pg_constraint where conname in ('catalogues_content_size','users_cookie_prefs_size')`,
		);
		check(
			"M07 with a legacy bad slug ('Legacy Name'): fails loudly, whole migration rolled back",
			"23514 catalogues_name_slug; no M07 constraint left; size checks still NOT VALID",
			`apply=${T(r)}; M07 constraints left=${rowsJson(left)}; size checks=${rowsJson(sizes)}`,
			!r.ok &&
				r.code === "23514" &&
				/catalogues_name_slug/.test(r.message) &&
				left.rows[0].n === 0 &&
				/:false/.test(sizes.rows[0].c),
		);
		await db.close();
		const db2 = await env.load(snaps.m06);
		await run(
			db2,
			`update public.catalogues set appearance = (select jsonb_agg(md5(i::text) || md5((i * 7)::text)) from generate_series(1, 20000) i) where name = 'b-draft'`,
		);
		const r2 = await applyTx(env, db2, "M07");
		check(
			"M07 with an oversized appearance (no individual NOT VALID check existed): fails loudly on catalogues_other_json_size",
			"23514",
			T(r2),
			!r2.ok &&
				r2.code === "23514" &&
				/catalogues_other_json_size/.test(r2.message),
		);
		await db2.close();
		const db3 = await env.load(snaps.m03);
		// a NOT VALID size check from M03: legacy low-compressibility content > 1 MiB inserted before M03 would already have been... insert as postgres after M03 is blocked, so simulate a pre-M03 row via ALTER ... NO INHERIT is impossible; disable the check with a superuser to emulate a legacy row
		await admin(
			db3,
			`alter table public.user_themes drop constraint user_themes_colors_size`,
		);
		await admin(
			db3,
			`update public.user_themes set colors = (select jsonb_object_agg(md5(i::text), md5((i*3)::text)) from generate_series(1, 200) i) where user_id = '${A}'`,
		);
		await admin(
			db3,
			`alter table public.user_themes add constraint user_themes_colors_size check (pg_column_size(colors) < 4096) not valid`,
		);
		for (const k of ["M04", "M05", "M06"]) await applyTx(env, db3, k);
		const ed = await U(
			db3,
			A,
			`update public.user_themes set name = name where user_id = $1 returning name`,
			[A],
		);
		const r3 = await applyTx(env, db3, "M07");
		const claimColumnOnly =
			/enforced on every UPDATE that rewrites the column/.test(
				env.sql.text("M03"),
			);
		check(
			"NOT VALID semantics vs the M03 header comment: legacy row whose STORED colors exceed 4 KiB - unrelated UPDATE (set name = name); then M07 VALIDATE",
			claimColumnOnly
				? "M03 comment claims only UPDATEs that rewrite the column are checked: unrelated update ok; M07 23514"
				: "corrected comment (every UPDATE of the row is checked): unrelated update 23514; M07 23514",
			`update=${summarize(ed)}; M07=${T(r3)}`,
			(claimColumnOnly ? ed.ok : isErr(ed, "23514")) &&
				!r3.ok &&
				r3.code === "23514" &&
				/user_themes_colors_size/.test(r3.message),
		);
		await db3.close();
	}
}
