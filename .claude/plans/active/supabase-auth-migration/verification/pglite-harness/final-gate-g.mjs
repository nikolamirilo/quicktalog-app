// Gate G: import emulation, A.R1 re-key (preconditions, success), M11, V-queries, cutover-window activity,
// A.R2 rollback-remap, re-cutover with A.R1, M12, M13.
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
	eqArr,
	summarize,
	T,
} from "./final-lib.mjs";
import { ownerMatrix, appLayer } from "./final-scen.mjs";

const A = IDS.A,
	B = IDS.B,
	C = IDS.C,
	UA = IDS.UA,
	UB = IDS.UB;
const D = "user_2dDddddddddddddddddddd4",
	UD = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const S_CLERK = "user_2sSssssssssssssssssss9",
	US = "55555555-5555-4555-8555-555555555555",
	UU = "66666666-6666-4666-8666-666666666666";
const BASE = "https://abcdefghijklmnopqrst.supabase.co/functions/v1";
const GOOGLE = "https://lh3.googleusercontent.com/a/bob-google=s96-c";
const COUNTS = `select u.id, u.plan_id, u.customer_id,
  (select count(*)::int from public.catalogues c where c.created_by = u.id) catalogues,
  (select count(*)::int from public.analytics a where a.user_id = u.id) analytics,
  (select coalesce(sum(a.pageview_count), 0)::int from public.analytics a where a.user_id = u.id) pageviews,
  (select count(*)::int from public.newsletter n where n.owner_id = u.id) newsletter,
  (select count(*)::int from public.ocr o where o.user_id = u.id) ocr,
  (select count(*)::int from public.prompts p where p.user_id = u.id) prompts,
  (select count(*)::int from public.user_themes t where t.user_id = u.id) themes
  from public.users u order by u.id`;
// V1-V11 reconstructed from plan section 6.7 descriptions (verify.sql is not in Appendix A)
const VQ = `select
  (select count(*)::int from public.users where id like 'user\\_%') v1_legacy_users,
  (select count(*)::int from public.users u where u.id ~ '^[0-9a-f]{8}-' and not exists (select 1 from auth.users a where a.id::text = u.id)) v2_uuid_without_auth,
  (select count(*)::int from auth.users a where not a.is_anonymous and not exists (select 1 from public.users u where u.id = a.id::text)) v3_auth_without_public,
  (select count(*)::int from migration.clerk_user_map m join public.users u on u.id = m.supabase_user_id::text join auth.users a on a.id = m.supabase_user_id where u.email is distinct from lower(a.email)) v4_email_mismatch,
  (select (select count(*) from public.catalogues where created_by like 'user\\_%') + (select count(*) from public.analytics where user_id like 'user\\_%') + (select count(*) from public.newsletter where owner_id like 'user\\_%')
        + (select count(*) from public.ocr where user_id like 'user\\_%') + (select count(*) from public.prompts where user_id like 'user\\_%') + (select count(*) from public.user_themes where user_id like 'user\\_%'))::int v5_legacy_child_rows,
  (select json_build_object('catalogues', (select count(*) from public.catalogues), 'pageviews', (select sum(pageview_count) from public.analytics), 'subscriptions', (select count(*) from public.subscriptions), 'with_customer', (select count(*) from public.users where customer_id is not null))) v6_totals,
  (select count(*)::int from public.users u join migration.clerk_user_map m on m.supabase_user_id::text = u.id where u.image ~* 'img\\.clerk\\.com') v7_mapped_clerk_images,
  (select string_agg(tgname || ':' || tgenabled::text, ',' order by tgname) from pg_trigger where tgname in ('Brevo New Contact Webhook', 'catalogues_touch_updated_at', 'user_themes_touch_updated_at')) v9_triggers,
  (select convalidated from pg_constraint where conrelid = 'public.users'::regclass and conname = 'users_id_is_uuid') v10_convalidated`;

export async function gateG(ctx) {
	const { env, R, check, snaps, setGroup } = ctx;
	setGroup("G1 import emulation (M00-M10 applied)");
	let S_import;
	const preCounts = {};
	{
		const db = await env.load(snaps.m10);
		await admin(
			db,
			`insert into private.settings (key, value) values ('edge_functions_base_url', $1), ('terms_version', '2026-09')`,
			[BASE],
		);
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('edge_webhook_secret', 'whsec')`,
		);
		await admin(db, "truncate net.http_request_queue");
		const pre = await run(db, COUNTS);
		for (const r of pre.rows) preCounts[r.id] = r;
		const catBefore = (
			await run(
				db,
				`select name, updated_at from public.catalogues order by name`,
			)
		).rows;
		// 6.3 per Clerk user: claim uuid first, admin.createUser (INSERT, app_metadata UPDATE, confirm UPDATE), identities, mark migrated
		const imports = [
			{
				clerk: A,
				id: UA,
				email: "A@Test.dev",
				meta: { full_name: "Alice" },
				map: {
					password_imported: true,
					cookie_consent: {
						analytics: true,
						timestamp: "2026-06-01T00:00:00Z",
					},
				},
			},
			{
				clerk: B,
				id: UB,
				email: "b@test.dev",
				meta: { full_name: "Bob" },
				google: "109876543210",
				map: { google_sub: "109876543210", avatar_url: GOOGLE },
			},
			{
				clerk: D,
				id: UD,
				email: "D@Test.dev",
				meta: { full_name: "Dora" },
				map: { password_imported: true },
			},
		];
		const res = [];
		for (const u of imports) {
			const claim = await run(
				db,
				`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, email, status) values ($1, $2, $3, 'claimed')
        on conflict (clerk_user_id) do update set email = excluded.email returning supabase_user_id`,
				[u.clerk, u.id, u.email.toLowerCase()],
			);
			const cr = await gotrueCreate(db, {
				id: u.id,
				email: u.email,
				userMeta: u.meta,
				appMeta: {
					provider: u.google ? "google" : "email",
					providers: [u.google ? "google" : "email"],
					clerk_user_id: u.clerk,
				},
			});
			const cf = await gotrue(
				db,
				`update users set email_confirmed_at = now() where id = $1`,
				[u.id],
			);
			const ca = await run(
				db,
				`update auth.users set created_at = now() - interval '300 days' where id = $1`,
				[u.id],
			);
			let idn = { ok: true };
			if (u.google)
				idn = await run(
					db,
					`insert into auth.identities (provider_id, user_id, provider, identity_data) values ($1, $2, 'google', $3) on conflict (provider_id, provider) do nothing`,
					[
						u.google,
						u.id,
						JSON.stringify({
							sub: u.google,
							provider_id: u.google,
							email: u.email,
							email_verified: true,
						}),
					],
				);
			const mk = await run(
				db,
				`update migration.clerk_user_map set status = 'migrated', email_verified = true, password_imported = $2, google_sub = $3, avatar_url = $4, cookie_consent = $5, owns_data = true, updated_at = now() where clerk_user_id = $1`,
				[
					u.clerk,
					!!u.map.password_imported,
					u.map.google_sub ?? null,
					u.map.avatar_url ?? null,
					u.map.cookie_consent ? JSON.stringify(u.map.cookie_consent) : null,
				],
			);
			res.push([claim, cr, cf, ca, idn, mk].every((x) => x.ok));
		}
		const uuidRows = await run(
			db,
			`select count(*)::int n from public.users where id ~ '^[0-9a-f]{8}-'`,
		);
		const calls = await admin(
			db,
			`select count(*)::int n from net._http_calls`,
		);
		check(
			"import of 3 Clerk users (claim -> admin.createUser order -> confirm -> identities -> migrated): no uuid public.users rows, no webhook calls",
			"all steps ok; 0 rows; 0 calls",
			`steps=${JSON.stringify(res)}; uuid rows=${rowsJson(uuidRows)}; calls=${rowsJson(calls)}`,
			res.every(Boolean) && uuidRows.rows[0].n === 0 && calls.rows[0].n === 0,
		);
		// A.15 Phase 3/4 preflight queries (commented in A.15; enabled in scripts/cutover/preflight.sql)
		const ph = env.sql
			.text("A15")
			.split("\n")
			.filter(
				(l) => /^-- (select|  and not exists)/.test(l) && !/Phase 3\/4/.test(l),
			)
			.map((l) => l.replace(/^-- ?/, ""))
			.join("\n");
		const phr = await run(db, ph.split(";")[0]);
		const phr2 = await run(db, ph.split(";")[1]);
		const phr3 = await run(db, ph.split(";")[2]);
		check(
			"A.15 Phase 3/4 queries (uncommented) after the import",
			"claimed 0 / migrated 3; unmapped_auth_users 0; unmapped_paying_users 0",
			[phr, phr2, phr3].map(summarize).join(" | "),
			phr.ok &&
				phr2.ok &&
				Number(phr2.rows[0].unmapped_auth_users) === 0 &&
				phr3.ok &&
				Number(phr3.rows[0].unmapped_paying_users) === 0,
		);
		S_import = await db.dump();
		snaps.import = S_import;
		snaps.catBefore = catBefore;
		await db.close();
	}

	for (const key of ["R1", "R2"]) {
		// lock order: when the ACCESS EXCLUSIVE lock on public.users is requested, the script must not already hold a weaker lock on it
		const db = await env.load(key === "R1" ? S_import : S_import);
		const { splitSql } = await import("./final-lib.mjs");
		const sts = splitSql(
			env.sql
				.text(key)
				.split("\n")
				.map((l) => (l.startsWith("\\") ? "-- " + l : l))
				.join("\n"),
		);
		let held = null,
			err = null;
		for (const st of sts) {
			if (/^lock table public\.users in access exclusive mode/.test(st.body)) {
				const l = await run(
					db,
					`select string_agg(mode, ',' order by mode) modes from pg_locks where relation = 'public.users'::regclass`,
				);
				held = l.rows?.[0]?.modes ?? null;
				break;
			}
			try {
				await db.exec(st.sql);
			} catch (e) {
				err = e.message;
				break;
			}
		}
		try {
			await db.exec("rollback");
		} catch {}
		check(
			`${key === "R1" ? "A.R1" : "A.R2"} lock order (C12 'strongest lock first'): locks already held on public.users when ACCESS EXCLUSIVE is requested`,
			"none (no AccessShare -> AccessExclusive upgrade; preconditions checked under the lock)",
			`held=${held}; error before lock=${err}`,
			held === null && err === null,
			{ severity: "low" },
		);
		await db.close();
	}

	setGroup("G2 A.R1 preconditions (each on a copy of the post-import state)");
	const negative = [
		[
			"unmapped user with a Paddle customer_id (C)",
			`update public.users set customer_id = 'ctm_c' where id = '${C}'`,
			/unmapped users with a Paddle customer_id/,
		],
		[
			"analytics_upsert_trigger present",
			`create function public.update_analytics_on_conflict() returns trigger language plpgsql as 'begin return new; end'; create trigger analytics_upsert_trigger before update on public.analytics for each row execute function public.update_analytics_on_conflict()`,
			/analytics_upsert_trigger exists/,
		],
		[
			"map row still claimed",
			`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status) values ('user_2claimed00000000000001', gen_random_uuid(), 'claimed')`,
			/map rows still claimed/,
		],
		[
			"auth.users row outside the map (dark test user)",
			null,
			/auth\.users has users outside the map/,
		],
		[
			"mapped uuid already present in public.users",
			`insert into public.users (id, plan_id) values ('${UD}', '${IDS.PLAN}')`,
			/a target uuid is already present/,
		],
		[
			"map row migrated without auth.users",
			`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status) values ('user_2noauth000000000000001', gen_random_uuid(), 'migrated')`,
			/migrated without an auth\.users row/,
		],
		[
			"default_plan_id not in plans",
			`update private.settings set value = 'pri_missing' where key = 'default_plan_id'`,
			/default_plan_id is not a row/,
		],
	];
	for (const [label, setup, re] of negative) {
		const db = await env.load(S_import);
		let s = { ok: true };
		if (setup)
			s = await (async () => {
				try {
					await db.exec(setup);
					return { ok: true };
				} catch (e) {
					return { ok: false, code: e.code, msg: e.message };
				}
			})();
		else {
			// GoTrue order; the M10 trigger itself creates a public.users row for it, drop that row so only the target precondition fires
			s = await gotrueCreate(db, {
				id: "77777777-7777-4777-8777-777777777777",
				email: "dark@x.io",
				confirmed: true,
			});
			await run(
				db,
				`delete from public.users where id = '77777777-7777-4777-8777-777777777777'`,
			);
		}
		const r = await psql(env, db, "R1");
		const after = await admin(
			db,
			`select (select count(*)::int from pg_constraint where conname = 'users_id_is_uuid') chk, (select count(*)::int from public.users where id ~ '^[0-9a-f]{8}-' and id <> '${UD}') uuids,
      (select string_agg(tgenabled::text, '') from pg_trigger where tgname in ('Brevo New Contact Webhook', 'catalogues_touch_updated_at', 'user_themes_touch_updated_at')) trg,
      (select count(*)::int from pg_class where relname = 'pre_remap_counts') counts_table`,
		);
		check(
			`A.R1 aborts: ${label}`,
			"exception naming the precondition; transaction rolled back (no CHECK, no uuids, triggers OOO)",
			`setup=${summarize(s)}; R1=${summarize(r)}; after=${rowsJson(after)}`,
			s.ok &&
				!r.ok &&
				re.test(r.message) &&
				after.rows[0].chk === 0 &&
				after.rows[0].uuids === 0 &&
				after.rows[0].trg === "OOO" &&
				after.rows[0].counts_table === 0,
		);
		await db.close();
	}

	setGroup("G3 A.R1 re-key, M11, V-queries, post-cutover isolation");
	let S_cut;
	{
		const db = await env.load(S_import);
		const r = await psql(env, db, "R1");
		check(
			"A.R1 as psql -v ON_ERROR_STOP=1 (meta-command \\set is psql-only and was not sent to the server)",
			"COMMIT",
			`${summarize(r)} meta=${JSON.stringify(r.meta)}`,
			r.ok,
		);
		const post = await run(db, COUNTS);
		const map = { [A]: UA, [B]: UB, [D]: UD, [C]: C };
		const diffs = [];
		for (const [old, pre] of Object.entries(preCounts)) {
			const nu = post.rows.find((x) => x.id === map[old]);
			for (const k of [
				"plan_id",
				"customer_id",
				"catalogues",
				"analytics",
				"pageviews",
				"newsletter",
				"ocr",
				"prompts",
				"themes",
			])
				if (!nu || nu[k] !== pre[k])
					diffs.push(`${old}.${k}: ${pre[k]} -> ${nu?.[k]}`);
		}
		check(
			"A.R1: per-user plan, customer and owned counts preserved across the re-key (A, B re-keyed; C legacy orphan untouched)",
			"no differences",
			diffs.length ? diffs.join("; ") : "no differences",
			diffs.length === 0,
		);
		const u = await admin(
			db,
			`select id, email, name, image, plan_id, customer_id, cookie_preferences, consents ->> 'source' consent_src, consents ->> 'terms-and-conditions' tc, welcome_email_sent_at is not null welcomed from public.users order by id`,
		);
		const byId = Object.fromEntries(u.rows.map((x) => [x.id, x]));
		check(
			"A.R1 profile rules: emails from auth.users lowercased; Clerk image -> null (A) or mapped Google avatar (B); newer cookie consent (A); welcome_email_sent_at set; D inserted with default plan, name Dora, not-accepted consents",
			"as designed",
			rowsJson(u),
			byId[UA]?.email === "a@test.dev" &&
				byId[UA]?.image === null &&
				byId[UA]?.cookie_preferences?.timestamp === "2026-06-01T00:00:00Z" &&
				byId[UA]?.welcomed &&
				byId[UB]?.image === GOOGLE &&
				byId[UB]?.customer_id === "ctm_b" &&
				byId[UB]?.welcomed &&
				byId[UD]?.email === "d@test.dev" &&
				byId[UD]?.name === "Dora" &&
				byId[UD]?.plan_id === IDS.PLAN &&
				byId[UD]?.tc === "false" &&
				byId[UD]?.welcomed &&
				byId[C]?.image === null &&
				Object.keys(byId).length === 4,
		);
		const v = await admin(db, VQ);
		const catAfter = (
			await run(
				db,
				`select name, updated_at from public.catalogues order by name`,
			)
		).rows;
		const calls = await admin(
			db,
			`select count(*)::int n from net._http_calls`,
		);
		const log = await admin(
			db,
			`select step, detail from migration.cutover_log`,
		);
		check(
			"V-queries after A.R1 (reconstructed): V1=1 (accepted orphan C), V2=0, V3=0, V4=0, V5=0, V7=0, V9 OOO, V10 false; catalogues.updated_at unchanged; no webhooks; cutover_log remap",
			"as listed",
			`${rowsJson(v)}; updated_at unchanged=${catAfter.every((x, i) => x.updated_at?.getTime() === snaps.catBefore[i].updated_at?.getTime())}; calls=${rowsJson(calls)}; log=${rowsJson(log)}`,
			v.ok &&
				v.rows[0].v1_legacy_users === 1 &&
				v.rows[0].v2_uuid_without_auth === 0 &&
				v.rows[0].v3_auth_without_public === 0 &&
				v.rows[0].v4_email_mismatch === 0 &&
				v.rows[0].v5_legacy_child_rows === 0 &&
				v.rows[0].v7_mapped_clerk_images === 0 &&
				v.rows[0].v9_triggers ===
					"Brevo New Contact Webhook:O,catalogues_touch_updated_at:O,user_themes_touch_updated_at:O" &&
				v.rows[0].v10_convalidated === false &&
				catAfter.every(
					(x, i) =>
						x.updated_at?.getTime() ===
						snaps.catBefore[i].updated_at?.getTime(),
				) &&
				calls.rows[0].n === 0 &&
				log.rows.some(
					(x) =>
						x.step === "remap" &&
						x.detail.uuid_users === 3 &&
						x.detail.legacy_users_left === 1,
				),
		);
		const m11 = await applyTx(env, db, "M11");
		const m11b = await applyTx(env, db, "M11");
		check(
			"M11 after A.R1 (constraint already present) and again",
			"ok, ok; still NOT VALID",
			`${T(m11)} | ${T(m11b)}`,
			m11.ok && m11b.ok,
		);
		let o = await run(
			db,
			`update public.users set name = 'Carol2' where id = $1`,
			[C],
		);
		const o2 = await run(
			db,
			`insert into public.users (id, plan_id) values ('user_2stale000000000000001', $1)`,
			[IDS.PLAN],
		);
		const o3 = await run(
			db,
			`insert into public.catalogues (name, created_by, tags) values ('stale-owner', 'user_2stale000000000000001', '{}')`,
		);
		const o4 = await U(db, A, `select name from public.catalogues`);
		const o5 = await U(
			db,
			UA,
			`select name from public.catalogues order by name`,
		);
		check(
			"after the re-key: legacy orphan row cannot be updated (NOT VALID CHECK); stale Clerk id insert 23514; stale owner FK 23503; old Clerk sub sees nothing; uuid sub sees own",
			"23514, 23514, 23503, 0 rows, a-draft/a-live",
			[o, o2, o3, o4, o5].map(summarize).join(" | "),
			isErr(o, "23514") &&
				isErr(o2, "23514") &&
				isErr(o3, "23503") &&
				o4.ok &&
				o4.n === 0 &&
				eqArr(col(o5, "name"), ["a-draft", "a-live"]),
		);
		const w1 = await U(
			db,
			UA,
			`select * from private.claim_welcome_email()`,
			[],
			{ commit: true },
		);
		const w2 = await U(
			db,
			UD,
			`select * from private.claim_welcome_email()`,
			[],
			{ commit: true },
		);
		check(
			"migrated users (re-keyed A, inserted D) never receive a welcome email",
			"0 rows, 0 rows",
			`${summarize(w1)} | ${summarize(w2)}`,
			w1.ok && w1.rows.length === 0 && w2.ok && w2.rows.length === 0,
		);
		S_cut = await db.dump();
		snaps.cut = S_cut;
		await db.close();
	}
	{
		const db = await env.load(S_cut);
		await applyTx(env, db, "M08");
		snaps.cutRls = await db.dump();
		await db.close();
	}
	await ownerMatrix(
		ctx,
		snaps.cut,
		UA,
		UB,
		"uuid ids after A.R1 + M11, app_rls login",
		{ loginRole: "app_rls" },
	);
	await appLayer(
		ctx,
		snaps.cut,
		UA,
		UB,
		"uuid ids after A.R1 + M11, DB_CONNECTION_STRING=app_rls",
		IDS.CAT,
		"app_rls",
	);

	setGroup("G4 cutover window, A.R2 rollback-remap, re-cutover");
	{
		// plain rollback and re-cutover with no activity in the window
		const db = await env.load(S_cut);
		const pre = (await run(db, COUNTS)).rows;
		const r2 = await psql(env, db, "R2");
		const mid = (await run(db, COUNTS)).rows;
		const r1 = await psql(env, db, "R1");
		const post = (await run(db, COUNTS)).rows;
		const strip = (rows) =>
			JSON.stringify(
				rows
					.map(({ id, ...rest }) => rest)
					.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
			);
		const ids = await admin(
			db,
			`select string_agg(id, ',' order by id) ids, (select convalidated from pg_constraint where conname = 'users_id_is_uuid') v10 from public.users`,
		);
		check(
			"A.R2 then A.R1 with no activity in the window: back to Clerk ids, then to the same uuids; per-user data identical at every step",
			"COMMIT, COMMIT; identical counts; ids UA,UB,UD + C; CHECK NOT VALID again",
			`R2=${summarize(r2)}; R1=${summarize(r1)}; mid ids=${mid.map((x) => x.id).join(",")}; ${rowsJson(ids)}`,
			r2.ok &&
				r1.ok &&
				strip(pre) === strip(mid) &&
				strip(mid) === strip(post) &&
				mid.every((x) => x.id.startsWith("user_")) &&
				ids.rows[0].ids === [C, UA, UB, UD].sort().join(",") &&
				ids.rows[0].v10 === false,
		);
		await db.close();
	}
	let S_rolled;
	const windowCounts = {};
	{
		const db = await env.load(S_cut);
		// Supabase-only confirmed sign-up S (becomes a paying customer), unconfirmed sign-up U, D deletes the account, A changes email
		const s1 = await gotrueCreate(db, {
			id: US,
			email: "sam@x.io",
			userMeta: { full_name: "Sam", terms_version: "2026-09" },
		});
		const s1c = await gotrue(
			db,
			`update users set email_confirmed_at = now() where id = $1`,
			[US],
		);
		const s1p = await run(
			db,
			`update public.users set customer_id = 'ctm_s', plan_id = $2 where id = $1 returning id`,
			[US, IDS.PRO],
		);
		const s1cat = await run(
			db,
			`insert into public.catalogues (name, created_by, tags) values ('sam-cat', $1, '{}')`,
			[US],
		);
		const u1 = await gotrueCreate(db, { id: UU, email: "unconfirmed@x.io" });
		const d1 = await gotrue(db, `delete from users where id = $1`, [UD]);
		const a1 = await gotrue(
			db,
			`update users set email = 'alice.new@test.dev' where id = $1`,
			[UA],
		);
		const st = await admin(
			db,
			`select (select count(*)::int from public.users where id = '${US}') s, (select count(*)::int from public.users where id = '${UD}') d,
      (select json_agg(clerk_user_id) from migration.auth_user_deletions) dels, (select email from public.users where id = '${UA}') a_email, (select status from migration.clerk_user_map where supabase_user_id = '${UD}') d_map`,
		);
		check(
			"cutover window: Supabase-only sign-up (confirmed, paying), unconfirmed sign-up, imported user D deletes account, A changes email",
			"S row; D gone + deletion log with Clerk id; A email synced",
			`${[s1, s1c, s1p, s1cat, u1, d1, a1].map(summarize).join(" | ")}; ${rowsJson(st)}`,
			[s1, s1c, s1p, s1cat, u1, d1, a1].every((x) => x.ok) &&
				st.rows[0].s === 1 &&
				st.rows[0].d === 0 &&
				JSON.stringify(st.rows[0].dels).includes(D) &&
				st.rows[0].a_email === "alice.new@test.dev",
		);
		// rollback steps 3 (push-supabase-users-to-clerk.ts emulation)
		const push = await run(
			db,
			`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, origin, status, email) values ($1, $2, 'rollback_push', 'migrated', 'sam@x.io')`,
			[S_CLERK, US],
		);
		const drop = await gotrue(
			db,
			`delete from users where id = $1 and email_confirmed_at is null`,
			[UU],
		);
		const pre = await run(db, COUNTS);
		for (const r of pre.rows) windowCounts[r.id] = r;
		const r2 = await psql(env, db, "R2");
		const post = await run(db, COUNTS);
		const back = { [UA]: A, [UB]: B, [US]: S_CLERK, [C]: C };
		const diffs = [];
		for (const [uid, preRow] of Object.entries(windowCounts)) {
			const nu = post.rows.find((x) => x.id === back[uid]);
			for (const k of [
				"plan_id",
				"customer_id",
				"catalogues",
				"analytics",
				"pageviews",
				"newsletter",
				"ocr",
				"prompts",
				"themes",
			])
				if (!nu || nu[k] !== preRow[k])
					diffs.push(`${uid}.${k}: ${preRow[k]} -> ${nu?.[k]}`);
		}
		const st2 = await admin(
			db,
			`select (select count(*)::int from public.users where id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-') uuid_left, (select count(*)::int from pg_constraint where conname = 'users_id_is_uuid') chk,
      (select string_agg(tgenabled::text, '') from pg_trigger where tgname in ('Brevo New Contact Webhook', 'catalogues_touch_updated_at', 'user_themes_touch_updated_at')) trg,
      (select detail from migration.cutover_log where step = 'rollback-remap') log`,
		);
		const clerkA = await U(
			db,
			A,
			`select name from public.catalogues order by name`,
		);
		check(
			"A.R2 rollback-remap after the window (S pushed to Clerk as rollback_push, unconfirmed U dropped): no uuid ids, CHECK dropped, triggers on, per-user counts/plan/customer preserved, Clerk sub works again",
			"COMMIT; uuid_left 0; no differences; A sees a-draft/a-live",
			`push=${summarize(push)} drop=${summarize(drop)}; R2=${summarize(r2)}; diffs=${diffs.join("; ") || "none"}; ${rowsJson(st2)}; clerk A=${summarize(clerkA)}`,
			push.ok &&
				r2.ok &&
				diffs.length === 0 &&
				st2.rows[0].uuid_left === 0 &&
				st2.rows[0].chk === 0 &&
				st2.rows[0].trg === "OOO" &&
				eqArr(col(clerkA, "name"), ["a-draft", "a-live"]),
		);
		S_rolled = await db.dump();
		await db.close();
	}
	let S_recut;
	{
		const db = await env.load(S_rolled);
		const pre = await run(db, COUNTS);
		const preBy = Object.fromEntries(pre.rows.map((x) => [x.id, x]));
		const r = await psql(env, db, "R1");
		check(
			"re-cutover: A.R1 again after A.R2 (plan: map-based rollback and re-cutover, section 5.6 drill with an account deletion in the window)",
			"COMMIT",
			summarize(r),
			r.ok,
			{ severity: "high", finding: "recutover-deleted-user" },
		);
		let rr = r;
		if (!r.ok) {
			// operator workaround to continue the drill: classify map rows of users deleted in the window
			await run(
				db,
				`update migration.clerk_user_map m set status = 'deleted', updated_at = now() where m.status = 'migrated' and not exists (select 1 from auth.users a where a.id = m.supabase_user_id)`,
			);
			rr = await psql(env, db, "R1");
			R.notes.push(
				`re-cutover needed a manual 'deleted' classification of map rows for accounts deleted in the window; second A.R1: ${summarize(rr)}`,
			);
		}
		const post = await run(db, COUNTS);
		const fwd = { [A]: UA, [B]: UB, [S_CLERK]: US, [C]: C };
		const diffs = [];
		for (const [old, p] of Object.entries(preBy)) {
			const nu = post.rows.find((x) => x.id === fwd[old]);
			for (const k of [
				"plan_id",
				"customer_id",
				"catalogues",
				"analytics",
				"pageviews",
				"newsletter",
				"ocr",
				"prompts",
				"themes",
			])
				if (!nu || nu[k] !== p[k])
					diffs.push(`${old}.${k}: ${p[k]} -> ${nu?.[k]}`);
		}
		const sRow = await admin(
			db,
			`select id, customer_id, plan_id from public.users where id = $1`,
			[US],
		);
		const v = await admin(db, VQ);
		check(
			"re-cutover result: rollback_push user S maps back to its uuid with customer/plan; counts preserved; V2/V3/V5 = 0",
			"S uuid, ctm_s; no differences",
			`R1=${summarize(rr)}; diffs=${diffs.join("; ") || "none"}; S=${rowsJson(sRow)}; V=${rowsJson(v)}`,
			rr.ok &&
				diffs.length === 0 &&
				sRow.rows[0]?.customer_id === "ctm_s" &&
				v.rows[0].v2_uuid_without_auth === 0 &&
				v.rows[0].v3_auth_without_public === 0 &&
				v.rows[0].v5_legacy_child_rows === 0,
		);
		S_recut = await db.dump();
		await db.close();
	}

	setGroup("G5 M12 and M13");
	{
		const db = await env.load(S_recut);
		const m12bad = await applyTx(env, db, "M12");
		check(
			"M12 before orphan triage (legacy C row still present)",
			"fails 23514 (validation refuses legacy ids)",
			T(m12bad),
			!m12bad.ok && m12bad.code === "23514",
		);
		const tri = await run(db, `delete from public.users where id = $1`, [C]);
		const m12 = await applyTx(env, db, "M12");
		const v = await admin(
			db,
			`select convalidated from pg_constraint where conname = 'users_id_is_uuid'`,
		);
		check(
			"M12 after triage (C owned nothing, deleted)",
			"ok; convalidated true",
			`${summarize(tri)}; ${T(m12)}; ${rowsJson(v)}`,
			tri.ok && m12.ok && v.rows[0].convalidated === true,
		);
		snaps.m12 = await db.dump();
		const m13 = await applyTx(env, db, "M13");
		const st = await admin(
			db,
			`select (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace where (n.nspname = 'private' and c.relname like 'backup\\_%') or (n.nspname = 'migration' and c.relname in ('pre_remap_counts','auth_user_deletions','cutover_log'))) dropped_left,
      (select count(*)::int from migration.clerk_user_map where email is not null or avatar_url is not null or cookie_consent is not null or google_sub is not null) pii_left,
      (select count(*)::int from migration.clerk_user_map) map_rows`,
		);
		check(
			"M13: backups and scratch tables dropped; map kept and minimised",
			"ok; 0 tables; pii 0; map rows kept",
			`${T(m13)}; ${rowsJson(st)}`,
			m13.ok &&
				st.rows[0].dropped_left === 0 &&
				st.rows[0].pii_left === 0 &&
				st.rows[0].map_rows >= 3,
		);
		snaps.m13 = await db.dump();
		const del = await gotrue(db, `delete from users where id = $1`, [UB]);
		const gone = await admin(
			db,
			`select count(*)::int n from public.users where id = $1`,
			[UB],
		);
		check(
			"after M13: account deletion (authAdmin().deleteUser -> DELETE auth.users -> M10 trigger)",
			"ok; public.users row removed",
			`${summarize(del)}; ${rowsJson(gone)}`,
			del.ok && gone.rows[0].n === 0,
			{ severity: "high", finding: "m13-breaks-deletion" },
		);
		const sig = await gotrueCreate(db, {
			id: "88888888-8888-4888-8888-888888888888",
			email: "late@x.io",
			confirmed: true,
		});
		const sigRow = await admin(
			db,
			`select count(*)::int n from public.users where id = '88888888-8888-4888-8888-888888888888'`,
		);
		const upd = await gotrue(
			db,
			`update users set email = 'sam2@x.io' where id = $1`,
			[US],
		);
		check(
			"after M13: sign-up and email change still work",
			"ok; row; ok",
			`${summarize(sig)} ${rowsJson(sigRow)} ${summarize(upd)}`,
			sig.ok && sigRow.rows[0].n === 1 && upd.ok,
		);
		await db.close();
	}
}
