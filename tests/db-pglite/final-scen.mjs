// Reusable scenario blocks (ported from wf2 run.mjs, adapted to the final object names and M06 signatures).
import {
	IDS,
	applyTx,
	run,
	inRole,
	U,
	P,
	REST,
	admin,
	isErr,
	rowsJson,
	col,
	eqArr,
	summarize,
} from "./final-lib.mjs";
import { makeApp, pgError, isUniqueViolation } from "./drizzle-app-final.mjs";

export async function ownerMatrix(
	{ env, check },
	dbSnap,
	a,
	b,
	label,
	{ loginRole = "postgres" } = {},
) {
	const db = await env.load(dbSnap, { role: loginRole });
	const g = (s) => `[${label}] ${s}`;
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
		`select plan_id from public.users where id = $1 for no key update`,
		[a],
	);
	check(
		g("users: getPlanForUpdate SELECT ... FOR NO KEY UPDATE own row"),
		"1 row",
		o,
		o.ok && o.n === 1,
	);
	o = await U(
		db,
		a,
		`select plan_id from public.users where id = $1 for no key update`,
		[b],
	);
	check(
		g("users: SELECT ... FOR NO KEY UPDATE on B's row"),
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

	o = await U(db, a, `select name from public.catalogues order by name`);
	check(
		g("catalogues: A selects all"),
		"a-draft, a-live (not B's)",
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
		"1 row",
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
			"catalogues: Drizzle-shaped INSERT (every column, default, client id/created_at) + RETURNING",
		),
		"1 row; id and created_at pinned; status draft",
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
		"23505",
		o,
		isErr(o, "23505"),
	);
	o = await inRole(db, "app_user", { sub: a }, async () => {
		const d = await run(
			db,
			`delete from public.catalogues where name = 'a-draft' returning name`,
		);
		await db.exec("reset role");
		const after = await run(
			db,
			`select (select count(*)::int from public.prompts where user_id = $1) prompts, (select count(*)::int from public.prompts where user_id = $1 and catalogue is null) prompts_null_cat,
        (select count(*)::int from public.analytics where user_id = $1) analytics`,
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
	const resetDenied = loginRole === "app_rls";
	check(
		g(
			"catalogues: A deletes own a-draft; usage rows survive (prompts catalogue set NULL)",
		),
		resetDenied
			? "RESET ROLE lands on app_rls: count query 42501"
			: "deleted; prompts kept with catalogue NULL; analytics kept",
		o,
		resetDenied
			? isErr(o, "42501")
			: o.ok &&
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
		`private.begin_ai_turn('a-live', 1, 'agent', null, null)`,
		`private.set_plan_state(gen_random_uuid(), false, 0, null)`,
		`private.refund_ai_turn(gen_random_uuid())`,
		`private.current_user_id()`,
	]) {
		o = await P(db, `select ${f}`);
		check(g(`app_public: select ${f}`), "42501", o, isErr(o, "42501"));
	}
	o = await P(db, `select * from private.settings`);
	check(g("app_public: private.settings"), "42501", o, isErr(o, "42501"));

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
		`3 calls ok; exactly 1 row foo@example.com owner ${b}`,
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
	for (const [id, em] of [
		[IDS.CAT.bDraft, "draft@x.io"],
		[IDS.CAT.aLive, "disabled@x.io"],
		[IDS.CAT.aDraft, "draft-enabled@x.io"],
		[IDS.CAT.bLive, "not-an-email"],
		[IDS.CAT.bLive, "a".repeat(290) + "@x.io"],
		["99999999-0000-4000-8000-000000000000", "rand@x.io"],
		[IDS.CAT.bLive, "sub@X.IO"],
		[IDS.CAT.bLive, null],
		[IDS.CAT.bLive, '=HYPERLINK("http://x")@a.io'],
		[IDS.CAT.bLive, `"quoted"@a.io`],
		[IDS.CAT.bLive, "o'brien@a.io"],
		[IDS.CAT.bLive, "-2+3+cmd|' /C calc'!A0@a.io"],
		[IDS.CAT.bLive, "a@b"],
	])
		outs.push(await sub(id, em));
	const after = (
		await admin(
			db,
			`select count(*)::int n, string_agg(email, ',') filter (where email ~ '[="''+]') odd from public.newsletter`,
		)
	).rows[0];
	check(
		g(
			"newsletter: draft / disabled / invalid / 300-char / random uuid / case-variant / null / C6 formula (=HYPERLINK, DDE pipe), quotes, apostrophe, no TLD -> silent no-op",
		),
		"13 calls ok, 0 new rows",
		`calls=${outs.map((x) => (x.ok ? "ok" : x.code)).join(",")}; new rows=${after.n - before}; odd=${after.odd}`,
		outs.every((x) => x.ok) && after.n === before,
	);
	const okMails = [];
	for (const em of [
		"first.last+tag@sub.example.co.uk",
		"x_y%z-1@a-b.io",
		"+leading@a.io",
	])
		okMails.push(await sub(IDS.CAT.bLive, em));
	const after2 = (
		await admin(db, `select count(*)::int n from public.newsletter`)
	).rows[0].n;
	check(
		g(
			"C6: normal addresses (dots, plus tag, subdomains, %, _, -) are accepted; a leading + is also accepted (CSV export escaping must neutralise it)",
		),
		"+3 rows",
		`calls=${okMails.map(summarize).join(" | ")}; delta=${after2 - after.n}`,
		okMails.every((x) => x.ok) && after2 - after.n === 3,
	);
	o = await P(
		db,
		`select private.subscribe_catalogue_newsletter('not-a-uuid', 'x@y.io')`,
	);
	check(
		g("newsletter: malformed catalogue id"),
		"22P02 (TS must validate)",
		o,
		isErr(o, "22P02"),
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
	const p4 = await P(
		db,
		`select private.subscribe_product_newsletter('=cmd|"/c calc"@x.io')`,
		[],
		{ commit: true },
	);
	const pa = (
		await admin(db, `select count(*)::int n from public.product_newsletter`)
	).rows[0].n;
	check(
		g("product newsletter: X@y.io, x@Y.io, existing P@X.io, formula payload"),
		"all ok; +1 row",
		`${[p1, p2, p3, p4].map(summarize).join(" | ")}; delta=${pa - pb}`,
		p1.ok && p2.ok && p3.ok && p4.ok && pa - pb === 1,
	);

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
		"42501",
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
		"42501",
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
		"42501",
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
			"only own rows (foreign = 0, n > 0)",
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
		"private.paddle_unresolved_events",
		"private.backup_prompts_null_user",
		"private.backup_newsletter_forged_owner",
	]) {
		const qn = t.includes(".") ? t : `public.${t}`;
		o = await U(db, a, `select 1 from ${qn} limit 1`);
		check(
			g(`app_user: select from ${qn}`),
			"42501 (or 42P01 once dropped by M13)",
			o,
			isErr(o, ["42501", "42P01"]),
		);
	}
	for (const sql of [
		`truncate public.catalogues`,
		`create table public.x (a int)`,
		`create function private.x() returns int language sql as 'select 1'`,
		`select public.call_edge_function_with_vault_secret()`,
		`select private.display_name_from_meta('{}')`,
		`select private.handle_auth_user_created()`,
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

export async function appLayer(
	{ env, check },
	snap,
	a,
	b,
	label,
	catIds,
	sessionRole = "postgres",
) {
	const g = (x) => `[${label}] ${x}`;
	const db = await env.load(snap, { role: sessionRole });

	// The app layer runs the REAL @quicktalog/common schema, which is pulled from
	// a post-M10 database: every Drizzle statement on `users` names
	// `welcome_email_sent_at`. Running it against a pre-M10 snapshot tests a
	// combination that can never be deployed, so bring the snapshot up to M10
	// first. Snapshots that already have it are left alone — M10 rewrites the
	// legacy consent marker and must not run twice.
	{
		const prev = db.session;
		await db.as("postgres");
		const present = await db.rows(
			`select 1 from information_schema.columns
			  where table_schema = 'public' and table_name = 'users'
			    and column_name = 'welcome_email_sent_at'`,
		);
		if (present.length === 0) await applyTx(env, db, "M10");
		await db.as(prev);
	}
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
	const A_ = { userId: a };
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
	const sv = (o) =>
		o.ok
			? `ok ${JSON.stringify(o.value)?.slice(0, 300)}`
			: `ERROR ${o.code}: ${o.msg}`;
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
		g("createCatalogue (pickEditable strips createdBy/status/id)"),
		"created_by = A, status draft, id not client-chosen",
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
		g("createCatalogue BUG variant: created_by = B"),
		"42501",
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
		g("createCatalogue BUG variant: status active"),
		"42501",
		sv(o),
		!o.ok && o.code === "42501",
	);
	let e2 = null;
	try {
		await app.createCatalogue(A_, { name: "b-live", tags: [] });
	} catch (e) {
		e2 = e;
	}
	check(
		g("createCatalogue with another owner's slug"),
		"23505 via DrizzleQueryError.cause",
		`isUniqueViolation=${isUniqueViolation(e2)}`,
		isUniqueViolation(e2),
	);
	o = await tryApp(() =>
		app.createCatalogue(
			A_,
			{ name: "a-quota", tags: [] },
			{ maxCatalogues: 1 },
		),
	);
	check(
		g("createCatalogue over plan quota"),
		"PlanLimitError catalogues",
		sv(o),
		!o.ok && /plan_limit:catalogues/.test(o.msg),
	);
	o = await tryApp(() =>
		app.duplicateItem(A_, catIds.aLive, "a-live", 100, true),
	);
	check(
		g("duplicateItem: slug taken -> SAVEPOINT rollback -> -copy retry"),
		"a-live-copy, draft, A; role app_user and sub A after ROLLBACK TO SAVEPOINT",
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
		"null",
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
		"active, A, id unchanged",
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
		g("publishCatalogue BUG variant with createdBy"),
		"42501",
		sv(o),
		!o.ok && o.code === "42501",
	);
	o = await tryApp(() =>
		app.publishCatalogue(A_, { name: "b-draft", heading: "defaced" }),
	);
	check(
		g("publishCatalogue of B's draft"),
		"null",
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
		g("publishCatalogue over traffic limit (my_usage)"),
		"PlanLimitError traffic",
		sv(o),
		!o.ok && /plan_limit:traffic/.test(o.msg),
	);
	o = await tryApp(() => app.updateItemStatus(A_, catIds.bLive, "inactive"));
	check(
		g("updateItemStatus on B's id"),
		"null",
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
		g("deleteMultipleItems([own, B's]) all-or-nothing"),
		"null; both exist",
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
		"success x2, v=2",
		`${sv(o)} | ${sv(o2)} | ${sv(qr)}`,
		o.value?.success && o2.value?.success && qr.value?.config?.v === 2,
	);
	o = await tryApp(() => app.upsertQrConfig(A_, "b-live", { v: 666 }));
	const bq = await admin(
		db,
		`select config from public.qr_configs where catalogue = 'b-live'`,
	);
	check(
		g("upsertQrConfig onto B's catalogue"),
		"Not found (42501); B unchanged",
		`${sv(o)}; B=${rowsJson(bq)}`,
		o.ok &&
			o.value.success === false &&
			o.value.code === "42501" &&
			!JSON.stringify(bq.rows).includes("666"),
	);
	const t1 = await tryApp(() => app.saveTheme(A_, "mine", { bg: "#111" }));
	const t2 = await tryApp(() => app.saveTheme(A_, "mine", { bg: "#222" }));
	const tl = await tryApp(() => app.listSavedThemes(A_));
	check(
		g("saveTheme upsert twice + list"),
		"same id, #222, only A's",
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
		g("deleteSavedTheme(B's id)"),
		"false",
		sv(o),
		o.ok && o.value === false,
	);
	o = await tryApp(() => app.getMyUserData(A_));
	check(
		g("getMyUserData"),
		"A's row with usage",
		sv(o),
		o.ok && o.value?.user?.id === a && Number(o.value.usage.catalogues) >= 1,
	);
	o = await tryApp(() =>
		app.saveCookiePreferences(A_, {
			accepted: true,
			analytics: false,
			timestamp: new Date().toISOString(),
			version: "1",
		}),
	);
	check(g("saveCookiePreferences"), "true", sv(o), o.ok && o.value === true);
	// M06 metering through the plan's startAiTurn/setPlanState/refundAiTurn
	const H = "a".repeat(64);
	const s1 = await tryApp(() =>
		app.startAiTurn(A_, "a-live", 100, "agent", null, null),
	);
	const sp = s1.ok
		? await tryApp(() => app.setPlanState(A_, s1.value.turnId, true, 3, H))
		: s1;
	const s2 = s1.ok
		? await tryApp(() =>
				app.startAiTurn(A_, "a-live", 100, "agent", s1.value.turnId, H),
			)
		: s1;
	const s3 = await tryApp(() =>
		app.startAiTurn(A_, "b-live", 100, "agent", null, null),
	);
	const s4 = await tryApp(() =>
		app.startAiTurn(A_, "a-live", null, "describe", null, null),
	);
	const rf = s4.ok
		? await tryApp(() => app.refundAiTurn(A_, s4.value.turnId))
		: s4;
	const rfOpen = s1.ok
		? await tryApp(() => app.refundAiTurn(A_, s1.value.turnId))
		: s1;
	check(
		g(
			"startAiTurn (getPlanForUpdate FOR NO KEY UPDATE + begin_ai_turn M06): charged, set_plan_state open, continuation with turn id + hash, B's catalogue, describe unlimited + refund, refund of open-plan turn",
		),
		"charged, true, continued (same turn id), not_found, charged, true, false",
		[s1, sp, s2, s3, s4, rf, rfOpen].map(sv).join(" | "),
		s1.value?.outcome === "charged" &&
			sp.value === true &&
			s2.value?.outcome === "continued" &&
			s2.value?.turnId === s1.value?.turnId &&
			s3.value?.outcome === "not_found" &&
			s4.value?.outcome === "charged" &&
			rf.value === true &&
			rfOpen.value === false,
	);
	o = await tryApp(() => app.checkCatalogueName(A_, "b-draft"));
	const o3 = await tryApp(() => app.checkCatalogueName(A_, "brand-new-slug"));
	check(
		g("checkCatalogueName"),
		"false, true",
		`${sv(o)} | ${sv(o3)}`,
		o.value === false && o3.value === true,
	);
	o = await tryApp(() => app.getPublicCatalogue("b-live"));
	const pd = await tryApp(() => app.getPublicCatalogue("b-draft"));
	const names = await tryApp(() => app.listPublicCatalogueNames());
	const activeNow = await admin(
		db,
		`select string_agg(name, ',' order by name) names from public.catalogues where status = 'active'`,
	);
	check(
		g(
			"public reads: active row without createdBy, draft null, names == active set",
		),
		"row; null; equal",
		`${[o, pd, names].map(sv).join(" | ")}; db=${rowsJson(activeNow)}`,
		o.ok &&
			o.value &&
			!("createdBy" in o.value) &&
			pd.value === null &&
			names.ok &&
			names.value.join(",") === activeNow.rows[0].names,
	);
	o = await tryApp(() => app.publicSelectAllMistake());
	const ff = await tryApp(() => app.publicFindFirstMistake());
	check(
		g("app_public select() / findFirst() without columns"),
		"42501 both",
		[o, ff].map(sv).join(" | "),
		!o.ok && o.code === "42501" && !ff.ok && ff.code === "42501",
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
		g("newsletterSignup x2 + productNewsletterSignup"),
		`1 row owner ${b}`,
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
		g("dashboard routes"),
		"only A's rows",
		[o, dn, da].map(sv).join(" | "),
		o.ok &&
			o.value.every((r) => r.createdBy === a) &&
			dn.ok &&
			da.ok &&
			da.value.pv < 99,
	);
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
		g("asAdmin claimEvent twice"),
		"true, false",
		`${sv(c1)} | ${sv(c2)}`,
		c1.value === true && c2.value === false,
	);
	await db.close();
}
