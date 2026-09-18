// Gate D: M08 app_rls login role.
import {
	IDS,
	applyTx,
	run,
	inRole,
	U,
	P,
	admin,
	isErr,
	rowsJson,
	col,
	eqArr,
	summarize,
	T,
} from "./final-lib.mjs";
import { ownerMatrix, appLayer } from "./final-scen.mjs";
const A = IDS.A,
	B = IDS.B;

export async function gateD(ctx) {
	const { env, check, snaps, setGroup } = ctx;
	setGroup("D gate 1 end: M08 app_rls");
	{
		const db = await env.load(snaps.m08, { role: "app_rls" });
		let o = await run(
			db,
			`select current_user::text cu, session_user::text su, current_setting('search_path') sp, current_setting('statement_timeout') st, current_setting('lock_timeout') lt, current_setting('idle_in_transaction_session_timeout') it`,
		);
		check(
			"app_rls login: search_path and backstop timeouts applied at login",
			"search_path 'public, pg_temp'; 8s / 3s / 10s",
			o,
			o.ok &&
				o.rows[0].sp === "public, pg_temp" &&
				o.rows[0].st === "8s" &&
				o.rows[0].lt === "3s" &&
				o.rows[0].it === "10s",
		);
		const forgotten = [];
		for (const sql of [
			`select name from public.catalogues`,
			`select id from public.users`,
			`select private.current_user_id()`,
			`select * from public.contacts`,
			`select private.my_usage()`,
			`insert into public.newsletter (email, catalogue_id, owner_id) values ('x@y.z', '${IDS.CAT.bLive}', '${B}')`,
			`select private.subscribe_product_newsletter('x@y.io')`,
			`select * from private.settings`,
			`select count(*) from catalogues`,
		]) {
			forgotten.push([sql, await run(db, sql)]);
		}
		check(
			"forgotten wrapper: raw queries as app_rls (tables, views, private functions, unqualified names)",
			"all 42501",
			forgotten
				.map(([s, x]) => `${s.slice(0, 40)} -> ${summarize(x)}`)
				.join(" | "),
			forgotten.every(([, x]) => isErr(x, "42501")),
		);
		o = await U(db, A, `select name from public.catalogues order by name`);
		const o2 = await P(db, `select name from public.catalogues order by name`);
		check(
			"app_rls + wrapper: withUser(A) / withPublic",
			"a-draft,a-live / a-live,b-live",
			`${summarize(o)} | ${summarize(o2)}`,
			eqArr(col(o, "name"), ["a-draft", "a-live"]) &&
				eqArr(col(o2, "name"), ["a-live", "b-live"]),
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
			"supabase_admin",
			"app_rls",
		]) {
			await db.exec("begin");
			const x = await run(db, `select set_config('role', $1, true)`, [target]);
			await db.exec("rollback");
			allowed[target] = x.ok ? "allowed" : x.code;
		}
		check(
			"app_rls role reachability",
			"only app_user, app_public (and itself)",
			JSON.stringify(allowed),
			Object.entries(allowed).every(([k, v]) =>
				["app_user", "app_public", "app_rls"].includes(k)
					? v === "allowed"
					: v === "42501",
			),
		);
		o = await inRole(db, "app_user", { sub: A }, async () => {
			const r1 = await run(db, `reset role`);
			const who = await run(db, `select current_user::text cu`);
			await db.exec("savepoint s1");
			const r3 = await run(db, `select set_config('role', 'postgres', true)`);
			await db.exec("rollback to savepoint s1");
			const r2 = await run(db, `select count(*) from public.catalogues`);
			return {
				ok: r2.ok,
				code: r2.code,
				msg: `${r2.msg}; reset=${r1.ok}; who=${who.rows?.[0]?.cu}; set postgres=${r3.code}`,
				rows: [{ reset: r1.ok }],
				n: 1,
			};
		});
		check(
			"injected RESET ROLE inside the wrapper lands on app_rls without privileges; SET ROLE postgres denied",
			"42501 (current_user app_rls; set postgres 42501)",
			o,
			isErr(o, "42501") &&
				/who=app_rls/.test(o.msg) &&
				/set postgres=42501/.test(o.msg),
		);
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
		// same planted table, reader WITHOUT the wrapper search_path (login search_path from M08 only)
		await db.exec("begin");
		await db.query(
			`select set_config('role', 'app_user', true), set_config('request.jwt.claims', $1, true)`,
			[JSON.stringify({ sub: B, role: "app_user" })],
		);
		const bRead2 = await run(
			db,
			`select "name", "content" from "catalogues" where "catalogues"."name" = 'b-live'`,
		);
		await db.exec("rollback");
		check(
			"temp-table shadowing under app_rls: planted pg_temp.catalogues vs B's unqualified read (with wrapper search_path / with M08 login search_path only)",
			"real row both times",
			`plant=${summarize(plant)}; wrapper=${summarize(bRead)}; login-only=${summarize(bRead2)}`,
			bRead.ok &&
				bRead.n === 1 &&
				!JSON.stringify(bRead.rows).includes("forged") &&
				bRead2.ok &&
				bRead2.n === 1 &&
				!JSON.stringify(bRead2.rows).includes("forged"),
		);
		await run(db, `discard temp`);
		o = await admin(
			db,
			`select rolcanlogin, rolinherit, rolbypassrls, rolcreaterole, rolcreatedb, rolconnlimit, rolconfig::text cfg,
      pg_has_role('app_rls', 'app_user', 'SET') s1, pg_has_role('app_rls', 'app_user', 'USAGE') u1, pg_has_role('app_rls', 'app_public', 'SET') s2, pg_has_role('app_rls', 'app_public', 'USAGE') u2 from pg_roles where rolname = 'app_rls'`,
		);
		check(
			"app_rls attributes and SET-only memberships",
			"login, noinherit, nobypassrls, connlimit 40, SET true / USAGE false",
			o,
			o.ok &&
				o.rows[0].rolcanlogin &&
				!o.rows[0].rolinherit &&
				!o.rows[0].rolbypassrls &&
				o.rows[0].rolconnlimit === 40 &&
				o.rows[0].s1 &&
				!o.rows[0].u1 &&
				o.rows[0].s2 &&
				!o.rows[0].u2,
		);
		await db.close();
		const db2 = await env.load(snaps.m08);
		const r = await applyTx(env, db2, "M08");
		check("re-apply M08 (role exists)", "ok", T(r), r.ok);
		await db2.close();
	}
	setGroup("D2 owner matrix and Drizzle app layer under the app_rls login");
	await ownerMatrix(ctx, snaps.m08, A, B, "clerk ids, app_rls login", {
		loginRole: "app_rls",
	});
	await appLayer(
		ctx,
		snaps.m08,
		A,
		B,
		"clerk ids, DB_CONNECTION_STRING=app_rls",
		IDS.CAT,
		"app_rls",
	);
}
