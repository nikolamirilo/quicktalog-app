// Gate F: M10 auth.users sync (GoTrue emulated as supabase_auth_admin).
import {
	IDS,
	applyTx,
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
const BASE = "https://abcdefghijklmnopqrst.supabase.co/functions/v1";
const uid = (n) =>
	`f${String(n).padStart(7, "0")}-0000-4000-8000-${String(n).padStart(12, "0")}`;
const GOOGLE = "https://lh3.googleusercontent.com/a/ACg8ocJ-x=s96-c";

export async function gateF(ctx) {
	const { env, R, check, snaps, setGroup } = ctx;
	setGroup("F gate 2: M10 auth sync");
	const brevoCalls = (db) =>
		admin(
			db,
			`select body ->> 'id' id, body ->> 'email' email, url from net._http_calls where url like '%create-brevo-contact' order by id`,
		);
	{
		// C11: M10 applied with webhooks configured: the legacy consent marker update sends no Brevo webhook
		const db = await env.load(snaps.m09);
		await admin(
			db,
			`insert into private.settings (key, value) values ('edge_functions_base_url', $1)`,
			[BASE],
		);
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('edge_webhook_secret', 'whsec')`,
		);
		await admin(db, "truncate net.http_request_queue");
		const r = await applyTx(env, db, "M10");
		const c = await admin(db, `select count(*)::int n from net._http_calls`);
		const legacy = await admin(
			db,
			`select id, consents from public.users order by id`,
		);
		check(
			"C11: M10 on a project with live webhooks: apply ok, legacy consent marker update sends no webhook, existing booleans kept + source legacy_default",
			"ok; 0 calls; every row source=legacy_default",
			`${T(r)}; calls=${rowsJson(c)}; ${rowsJson(legacy)}`,
			r.ok &&
				c.rows[0].n === 0 &&
				legacy.rows.every(
					(x) =>
						x.consents.source === "legacy_default" &&
						x.consents["privacy-policy"] === true,
				),
		);
		const shape = await admin(
			db,
			`select
      (select string_agg(tgname || ':' || tgenabled::text, ',' order by tgname) from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal) triggers,
      (select value from private.settings where key = 'default_plan_id') plan,
      (select pg_get_expr(adbin, adrelid) from pg_attrdef where adrelid = 'public.users'::regclass and adnum = (select attnum from pg_attribute where attrelid = 'public.users'::regclass and attname = 'consents')) consents_default,
      has_schema_privilege('anon', 'migration', 'USAGE') anon_mig, has_schema_privilege('app_user', 'migration', 'USAGE') app_mig, has_schema_privilege('supabase_auth_admin', 'migration', 'USAGE') auth_mig,
      has_function_privilege('app_user', 'private.handle_auth_user_created()', 'EXECUTE') trig_x,
      has_function_privilege('app_public', 'private.current_terms_version()', 'EXECUTE') ctv_pub,
      has_function_privilege('app_public', 'private.record_consents(text)', 'EXECUTE') rc_pub`,
		);
		check(
			"M10 shape: 3 triggers on auth.users enabled, default plan seeded, not-accepted consents default, migration schema private, function ACLs",
			"as designed",
			shape,
			shape.ok &&
				shape.rows[0].triggers ===
					"on_auth_user_created:O,on_auth_user_deleted:O,on_auth_user_updated:O" &&
				shape.rows[0].plan === IDS.PLAN &&
				/"source": "default"/.test(shape.rows[0].consents_default) &&
				!shape.rows[0].anon_mig &&
				!shape.rows[0].app_mig &&
				!shape.rows[0].auth_mig &&
				!shape.rows[0].trig_x &&
				shape.rows[0].ctv_pub &&
				!shape.rows[0].rc_pub,
		);
		const guard = await run(
			db,
			`select pg_get_functiondef('private.handle_auth_user_created'::regproc) ~ 'clerk_user_map' ok`,
		);
		check(
			"plan 6.3 import-script guard: pg_get_functiondef('private.handle_auth_user_created'::regproc) contains clerk_user_map",
			"true",
			guard,
			guard.ok && guard.rows[0].ok === true,
		);
		snaps.m10hooks = await db.dump();
		await db.close();
	}
	{
		const db = await env.load(snaps.m10hooks);
		const row = (id) =>
			admin(
				db,
				`select id, email, name, image, plan_id, consents, welcome_email_sent_at from public.users where id = $1`,
				[id],
			);
		// 1 unconfirmed email sign-up
		await admin(db, "truncate net.http_request_queue");
		let o = await gotrueCreate(db, {
			id: uid(1),
			email: "Victim@Example.com",
			userMeta: {
				full_name: " Ana ",
				avatar_url: "https://evil.example/a.png",
			},
		});
		let r = await row(uid(1));
		let calls = await brevoCalls(db);
		check(
			"email sign-up (unconfirmed, GoTrue INSERT then app_metadata UPDATE): public.users row, default plan, not-accepted consents (never null), non-Google avatar dropped",
			"row; plan Starter; consents false x3, source signup; image null; name Ana",
			`${summarize(o)}; ${rowsJson(r)}`,
			o.ok &&
				r.rows.length <= 1 &&
				(r.rows.length === 0 ||
					(r.rows[0].plan_id === IDS.PLAN &&
						r.rows[0].consents["terms-and-conditions"] === false &&
						r.rows[0].consents["privacy-policy"] === false &&
						r.rows[0].image === null &&
						r.rows[0].name === "Ana" &&
						r.rows[0].email === "victim@example.com")),
		);
		check(
			"unconfirmed email sign-up and the Brevo webhook: no CRM contact for an address nobody has confirmed (anyone can sign up with a third party's email)",
			"0 Brevo calls before confirmation; row + 1 call after email_confirmed_at is set",
			`rows before confirm=${r.rows.length}; calls=${rowsJson(calls)}`,
			calls.rows.length === 0,
			{ severity: "medium", finding: "unconfirmed-signup-crm" },
		);
		const conf = await gotrue(
			db,
			`update users set email_confirmed_at = now() where id = $1`,
			[uid(1)],
		);
		r = await row(uid(1));
		calls = await brevoCalls(db);
		check(
			"confirmation (GoTrue UPDATE email_confirmed_at): row exists afterwards with sign-up metadata; exactly one Brevo call in total",
			"row; 1 call",
			`${summarize(conf)}; ${rowsJson(r)}; calls=${rowsJson(calls)}`,
			conf.ok &&
				r.rows.length === 1 &&
				r.rows[0].name === "Ana" &&
				r.rows[0].consents.source === "signup" &&
				calls.rows.length === 1,
		);
		// 2 OAuth Google user, confirmed at insert, no terms_version
		await admin(db, "truncate net.http_request_queue");
		o = await gotrueCreate(db, {
			id: uid(2),
			email: "g@gmail.com",
			confirmed: true,
			userMeta: {
				full_name: "Gee Google",
				name: "Gee",
				avatar_url: GOOGLE,
				picture: GOOGLE,
				email_verified: true,
				iss: "https://accounts.google.com",
				sub: "1234567890",
			},
			appMeta: { provider: "google", providers: ["google"] },
		});
		r = await row(uid(2));
		check(
			"OAuth (Google) user with confirmed email: row with Google avatar, full_name, consents not accepted (gate)",
			"image lh3, name 'Gee Google', consents false",
			`${summarize(o)}; ${rowsJson(r)}`,
			o.ok &&
				r.rows[0]?.image === GOOGLE &&
				r.rows[0]?.name === "Gee Google" &&
				r.rows[0]?.consents["terms-and-conditions"] === false &&
				r.rows[0]?.consents.version === null,
		);
		// 3 OAuth insert without confirmation, then GoTrue confirms in a separate UPDATE (createAccountFromExternalIdentity order)
		o = await gotrueCreate(db, {
			id: uid(3),
			email: "g2@gmail.com",
			confirmed: false,
			userMeta: { full_name: "G Two", picture: GOOGLE },
			appMeta: { provider: "google", providers: ["google"] },
		});
		const o3 = await gotrue(
			db,
			`update users set email_confirmed_at = now() where id = $1`,
			[uid(3)],
		);
		r = await row(uid(3));
		check(
			"OAuth insert then separate confirm UPDATE: exactly one row with the Google avatar ('picture')",
			"1 row, image lh3",
			`${summarize(o)} ${summarize(o3)}; ${rowsJson(r)}`,
			r.rows.length === 1 && r.rows[0].image === GOOGLE,
		);
		// 4 terms_version contract
		o = await gotrueCreate(db, {
			id: uid(4),
			email: "t0@x.io",
			confirmed: true,
			userMeta: { terms_version: "2026-09" },
		});
		r = await row(uid(4));
		await admin(
			db,
			`insert into private.settings (key, value) values ('terms_version', '2026-09')`,
		);
		const o5 = await gotrueCreate(db, {
			id: uid(5),
			email: "t1@x.io",
			confirmed: true,
			userMeta: { terms_version: "2026-09" },
		});
		const r5 = await row(uid(5));
		const o6 = await gotrueCreate(db, {
			id: uid(6),
			email: "t2@x.io",
			confirmed: true,
			userMeta: {
				terms_version: "2025-01",
				consents: { "terms-and-conditions": true },
			},
		});
		const r6 = await row(uid(6));
		check(
			"consent contract: terms_version unset -> false; matching -> true with version/accepted_at; stale version or legacy booleans in metadata -> false",
			"false/null; true 2026-09 + accepted_at; false",
			`${rowsJson(r)} | ${rowsJson(r5)} | ${rowsJson(r6)}`,
			r.rows[0]?.consents["privacy-policy"] === false &&
				r5.rows[0]?.consents["privacy-policy"] === true &&
				r5.rows[0]?.consents.version === "2026-09" &&
				r5.rows[0]?.consents.accepted_at &&
				r6.rows[0]?.consents["terms-and-conditions"] === false &&
				r6.rows[0]?.consents.version === null,
		);
		// 5 imported user: pre-claimed map row (status claimed) + GoTrue admin.createUser order
		await admin(db, "truncate net.http_request_queue");
		const claim = await run(
			db,
			`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, email, status) values ('user_2imported0000000000001', $1, 'imp@x.io', 'claimed') returning supabase_user_id`,
			[uid(7)],
		);
		o = await gotrueCreate(db, {
			id: uid(7),
			email: "imp@x.io",
			confirmed: true,
			userMeta: { full_name: "Imp" },
			appMeta: {
				provider: "email",
				providers: ["email"],
				clerk_user_id: "user_2imported0000000000001",
			},
		});
		const oc = await gotrue(
			db,
			`update users set email_confirmed_at = now(), raw_user_meta_data = raw_user_meta_data || '{"avatar_url":"${GOOGLE}"}' where id = $1`,
			[uid(7)],
		);
		r = await row(uid(7));
		calls = await brevoCalls(db);
		check(
			"imported Clerk user (map row claimed first, then INSERT + app_metadata UPDATE + later confirm/metadata UPDATE): no public.users row, no Brevo call",
			"0 rows; 0 calls",
			`claim=${summarize(claim)}; create=${summarize(o)}; later update=${summarize(oc)}; rows=${rowsJson(r)}; calls=${rowsJson(calls)}`,
			o.ok && r.rows.length === 0 && calls.rows.length === 0,
		);
		o = await gotrueCreate(db, {
			id: uid(8),
			email: "noclaim@x.io",
			confirmed: true,
			appMeta: {
				provider: "email",
				providers: ["email"],
				clerk_user_id: "user_2notclaimed00000000001",
			},
		});
		r = await row(uid(8));
		check(
			"why the claim must come first: same createUser order WITHOUT a map row creates a default public.users row (app_metadata arrives after the INSERT)",
			"1 row (documented P5 behaviour)",
			`${summarize(o)}; ${rowsJson(r)}`,
			o.ok && r.rows.length === 1,
			{ severity: "info" },
		);
		// 6 anonymous, phone
		o = await gotrueCreate(db, {
			id: uid(9),
			email: null,
			anonymous: true,
			appMeta: { provider: "anonymous", providers: ["anonymous"] },
		});
		r = await row(uid(9));
		const op = await gotrueCreate(db, {
			id: uid(10),
			email: null,
			phone: "+38160000000",
			appMeta: { provider: "phone", providers: ["phone"] },
		});
		const rp = await row(uid(10));
		check(
			"anonymous user: no row; phone user (no email): row with null email",
			"0; 1",
			`${summarize(o)} ${rowsJson(r)} | ${summarize(op)} ${rowsJson(rp)}`,
			o.ok &&
				r.rows.length === 0 &&
				op.ok &&
				rp.rows.length === 1 &&
				rp.rows[0].email === null,
		);
		// 7 avatar rules
		const av = [];
		for (const [i, meta, exp] of [
			[11, { avatar_url: "javascript:alert(1)" }, null],
			[
				12,
				{ avatar_url: "https://lh3.googleusercontent.com.evil.com/x" },
				null,
			],
			[
				13,
				{ picture: "https://lh5.googleusercontent.com/" + "a".repeat(2100) },
				null,
			],
			[14, { avatar_url: "https://lh3.googleusercontent.com/a b" }, null],
			[15, { avatar_url: "https://img.clerk.com/x", picture: GOOGLE }, null],
			[16, { avatar_url: "http://lh3.googleusercontent.com/x" }, null],
			[
				17,
				{ picture: "https://lh6.googleusercontent.com/-abc/photo.jpg" },
				"https://lh6.googleusercontent.com/-abc/photo.jpg",
			],
		]) {
			await gotrueCreate(db, {
				id: uid(i),
				email: `av${i}@x.io`,
				confirmed: true,
				userMeta: meta,
			});
			const x = await row(uid(i));
			av.push([i, x.rows[0]?.image ?? null, exp, x.rows.length]);
		}
		check(
			"avatar rules (Google lh*.googleusercontent.com over https only, <= 2048 chars, avatar_url wins over picture)",
			"all as expected",
			JSON.stringify(av),
			av.every(([, got, exp, n]) => n === 1 && got === exp),
		);
		// 8 email change sync, no name sync, avatar fill-if-null
		await admin(db, "truncate net.http_request_queue");
		o = await gotrue(
			db,
			`update users set email = 'Changed@Example.COM' where id = $1`,
			[uid(2)],
		);
		r = await row(uid(2));
		calls = await brevoCalls(db);
		check(
			"email change sync (after confirmation): lowercased; one Brevo call",
			"changed@example.com; 1 call",
			`${summarize(o)}; ${rowsJson(r)}; ${rowsJson(calls)}`,
			r.rows[0]?.email === "changed@example.com" && calls.rows.length === 1,
		);
		await U(
			db,
			uid(2),
			`update public.users set name = 'Custom' where id = $1`,
			[uid(2)],
			{ commit: true },
		);
		o = await gotrue(
			db,
			`update users set raw_user_meta_data = raw_user_meta_data || '{"full_name":"Provider Name","avatar_url":"https://lh3.googleusercontent.com/new"}' where id = $1`,
			[uid(2)],
		);
		r = await row(uid(2));
		const noImg = uid(11);
		const o2 = await gotrue(
			db,
			`update users set raw_user_meta_data = '{"avatar_url":"https://lh3.googleusercontent.com/filled"}' where id = $1`,
			[noImg],
		);
		const r2 = await row(noImg);
		check(
			"no name sync from user_metadata; existing image not overwritten; null image filled from a Google avatar",
			"name Custom, image unchanged; filled",
			`${summarize(o)} ${rowsJson(r)} | ${summarize(o2)} ${rowsJson(r2)}`,
			r.rows[0]?.name === "Custom" &&
				r.rows[0]?.image === GOOGLE &&
				r2.rows[0]?.image === "https://lh3.googleusercontent.com/filled",
		);
		// 9 consents default for direct inserts
		o = await run(
			db,
			`insert into public.users (id, plan_id) values ($1, $2) returning consents`,
			[uid(20), IDS.PLAN],
		);
		check(
			"public.users consents default is not-accepted (source default)",
			"false x3, source default",
			o,
			o.ok &&
				o.rows[0].consents["terms-and-conditions"] === false &&
				o.rows[0].consents.source === "default",
		);
		// 10 definers
		const U5 = uid(5);
		let s1 = await U(db, U5, `select private.current_terms_version() v`);
		let s2 = await P(db, `select private.current_terms_version() v`);
		let s3 = await REST(
			db,
			"anon",
			{ role: "anon" },
			`select private.current_terms_version()`,
		);
		check(
			"current_terms_version: app_user and app_public read it; anon via PostgREST denied",
			"2026-09, 2026-09, 42501",
			[s1, s2, s3].map(summarize).join(" | "),
			s1.rows?.[0]?.v === "2026-09" &&
				s2.rows?.[0]?.v === "2026-09" &&
				isErr(s3, "42501"),
		);
		const U1 = uid(1);
		s1 = await U(db, U1, `select private.record_consents('2025-01')`, [], {
			commit: true,
		});
		s2 = await U(db, U1, `select private.record_consents(null)`, [], {
			commit: true,
		});
		s3 = await U(db, U1, `select private.record_consents('2026-09')`, [], {
			commit: true,
		});
		const s4 = await U(db, null, `select private.record_consents('2026-09')`);
		const s5 = await P(db, `select private.record_consents('2026-09')`);
		r = await row(U1);
		check(
			"record_consents: stale 22023, null 22023, current ok (true, version, accepted_at, source gate), no sub 42501, app_public 42501",
			"22023, 22023, ok, 42501, 42501",
			`${[s1, s2, s3, s4, s5].map(summarize).join(" | ")}; ${rowsJson(r)}`,
			isErr(s1, "22023") &&
				isErr(s2, "22023") &&
				s3.ok &&
				isErr(s4, "42501") &&
				isErr(s5, "42501") &&
				r.rows[0]?.consents.source === "gate" &&
				r.rows[0]?.consents.version === "2026-09" &&
				r.rows[0]?.consents["refund-policy"] === true,
		);
		s1 = await U(db, U1, `select * from private.claim_welcome_email()`, [], {
			commit: true,
		});
		s2 = await U(db, U1, `select * from private.claim_welcome_email()`, [], {
			commit: true,
		});
		s3 = await P(db, `select * from private.claim_welcome_email()`);
		const other = await row(uid(2));
		check(
			"claim_welcome_email: once per user; app_public denied; other users untouched",
			"1 row (victim@example.com, Ana), 0 rows, 42501",
			`${[s1, s2, s3].map(summarize).join(" | ")}; other welcome=${other.rows[0]?.welcome_email_sent_at}`,
			s1.ok &&
				s1.rows.length === 1 &&
				s1.rows[0].email === "victim@example.com" &&
				s2.ok &&
				s2.rows.length === 0 &&
				isErr(s3, "42501") &&
				other.rows[0]?.welcome_email_sent_at === null,
		);
		// 11 deletion
		await admin(
			db,
			`insert into public.catalogues (name, created_by, tags) values ('u2-cat', $1, '{}')`,
			[uid(2)],
		);
		await run(
			db,
			`insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status) values ('user_2mappeddeleted00000001', $1, 'migrated')`,
			[uid(3)],
		);
		const d1 = await gotrue(db, `delete from users where id = $1`, [uid(2)]);
		const d2 = await gotrue(db, `delete from users where id = $1`, [uid(3)]);
		const del = await admin(
			db,
			`select (select count(*)::int from public.users where id in ($1::text, $2::text)) users_left, (select count(*)::int from public.catalogues where created_by = $1::text) cats,
      (select json_agg(json_build_object('u', supabase_user_id, 'c', clerk_user_id) order by clerk_user_id nulls first) from migration.auth_user_deletions) log,
      (select status from migration.clerk_user_map where supabase_user_id = $2::uuid) map_status`,
			[uid(2), uid(3)],
		);
		check(
			"deletion: auth.users delete removes public.users and owned rows; migration.auth_user_deletions logs both (clerk id only for the mapped user)",
			"users 0, cats 0, 2 log rows",
			`${summarize(d1)} ${summarize(d2)}; ${rowsJson(del)}`,
			d1.ok &&
				d2.ok &&
				del.ok &&
				del.rows[0].users_left === 0 &&
				del.rows[0].cats === 0 &&
				del.rows[0].log.length === 2 &&
				del.rows[0].log.some((x) => x.c === "user_2mappeddeleted00000001"),
		);
		// 12 perimeter for new objects
		s1 = await U(db, U5, `select * from migration.clerk_user_map`);
		s2 = await REST(
			db,
			"authenticated",
			{ role: "authenticated", sub: U5 },
			`select * from public.users`,
		);
		s3 = await U(db, U5, `select id from public.users`);
		check(
			"uuid user under withUser sees only own row; same user with a real JWT via PostgREST 42501; app_user cannot read migration.*",
			"own row; 42501; 42501",
			[s3, s2, s1].map(summarize).join(" | "),
			eqArr(col(s3, "id"), [U5]) && isErr(s2, "42501") && isErr(s1, "42501"),
		);
		const cv = await run(
			db,
			`select count(*)::int n, count(*) filter (where terms_and_conditions = 'Yes')::int yes from public.contacts`,
		);
		check(
			"contacts view (CRM export) still works with the new consents objects",
			"ok",
			cv,
			cv.ok,
		);
		// 13 missing default plan
		await admin(
			db,
			`delete from private.settings where key = 'default_plan_id'`,
		);
		o = await gotrueCreate(db, {
			id: uid(30),
			email: "np@x.io",
			confirmed: true,
		});
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
		// 14 webhook failure does not block sign-up
		await admin(
			db,
			`update private.settings set value = 'https://abcdefghijklmnopqrst.supabase.co/functions/v1' where key = 'edge_functions_base_url'`,
		);
		o = await gotrueCreate(db, {
			id: uid(31),
			email: "wh@x.io",
			confirmed: true,
		});
		check(
			"sign-up with webhook secret + base url present succeeds (Brevo trigger does not block)",
			"ok",
			o,
			o.ok,
		);
		await db.close();
	}
	{
		// M10 re-apply (informational: not idempotent because CREATE TRIGGER on auth.users cannot be guarded with DROP)
		const db = await env.load(snaps.m10);
		const r = await applyTx(env, db, "M10");
		check(
			"re-apply M10",
			"fails 42710 trigger exists (informational: migrations run once; never add DROP TRIGGER)",
			T(r),
			true,
			{ severity: "info" },
		);
		await db.close();
	}
}
