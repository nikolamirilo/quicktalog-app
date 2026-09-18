// Gate B: M01..M06 applied (Clerk ids). Mechanics, owner matrix, definers, AI ledger incl. M06 plan binding,
// admin/worker/perimeter, wrapper semantics, Drizzle app layer, misc SQL semantics.
import {
	IDS,
	applyTx,
	run,
	inRole,
	U,
	P,
	REST,
	admin,
	as,
	isErr,
	rowsJson,
	col,
	eqArr,
	summarize,
	T,
	WRAPPER_SQL,
} from "./final-lib.mjs";
import { ownerMatrix, appLayer } from "./final-scen.mjs";

const A = IDS.A,
	B = IDS.B;

export async function gateB(ctx) {
	const { env, R, check, snaps, setGroup, S_base } = ctx;
	const load = (d, o) => env.load(d, o);

	// ----------------------------------------------------------------------------------------------------
	setGroup("B1 migration mechanics (M01-M06)");
	{
		const db = await load(snaps.m06);
		const r = await applyTx(env, db, "M01");
		check(
			"re-apply M01 when roles/schema already exist (idempotent)",
			"ok",
			T(r),
			r.ok,
		);
		const m04again = await applyTx(env, db, "M04");
		check(
			"re-apply M04 (policies already exist)",
			"fails 42710 (policies are not idempotent; migrations run once) - informational",
			T(m04again),
			true,
			{ severity: "info" },
		);
		await db.close();
	}
	{
		const db = await load(snaps.m00);
		await admin(db, "create role app_user nologin noinherit nobypassrls");
		await admin(db, "create role app_public nologin noinherit nobypassrls");
		const r = await applyTx(env, db, "M01");
		check(
			"P2: M01 when app_user/app_public exist without ADMIN OPTION for postgres",
			"stops with the actionable ADMIN OPTION message",
			T(r),
			!r.ok && /ADMIN OPTION/.test(r.message ?? ""),
		);
		await db.close();
	}
	{
		const db = await load(snaps.m00);
		let err = null;
		for (const k of ["M01", "M02", "M03", "M04", "M05", "M06"]) {
			const r = await applyTx(env, db, k, { role: "supabase_admin" });
			if (!r.ok) {
				err = T(r);
				break;
			}
		}
		await admin(
			db,
			`insert into private.settings(key, value) values ('edge_functions_base_url','https://abcdefghijklmnopqrst.supabase.co/functions/v1')`,
		);
		const paddle = await run(
			db,
			`insert into private.paddle_events (event_id, event_type, occurred_at) values ('evt_1','subscription.updated', now()) on conflict do nothing`,
		);
		const unres = await run(
			db,
			`insert into private.paddle_unresolved_events (event_id, event_type, occurred_at, reason, payload) values ('evt_u','transaction.completed', now(), 'no_user', '{}')`,
		);
		const brevo = await run(
			db,
			`update public.users set name = 'Renamed' where id = $1`,
			[A],
		);
		check(
			"P3: M01-M06 applied by supabase_admin: asAdmin writes private.paddle_events / paddle_unresolved_events, Brevo trigger reads private.settings",
			"apply ok; all ok",
			`apply=${err ?? "ok"}; paddle=${summarize(paddle)}; unresolved=${summarize(unres)}; users update=${summarize(brevo)}`,
			!err && paddle.ok && unres.ok && brevo.ok,
		);
		await db.close();
	}
	{
		const b64u = (s) =>
			Buffer.from(s)
				.toString("base64")
				.replace(/\+/g, "-")
				.replace(/\//g, "_")
				.replace(/=+$/, "");
		const payload = {
			iss: "supabase",
			ref: "abcdefghijklmnopqrst",
			role: "service_role",
			pad: "",
		};
		for (let i = 0; i < 200 && !/[-_]/.test(b64u(JSON.stringify(payload))); i++)
			payload.pad += String.fromCharCode(0x3e + (i % 3)) + "ÿ";
		const jwt = `${b64u('{"alg":"HS256","typ":"JWT"}')}.${b64u(JSON.stringify(payload))}.c2lnbmF0dXJl`;
		const db = await load(snaps.m00);
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('service_role_key', $1)`,
			[jwt],
		);
		const r1 = await applyTx(env, db, "M01");
		const r2 = await applyTx(env, db, "M02");
		const url = await run(
			db,
			`select value from private.settings where key = 'edge_functions_base_url'`,
		);
		check(
			"M02 seeds edge_functions_base_url from a base64url JWT in Vault",
			"https://abcdefghijklmnopqrst.supabase.co/functions/v1",
			`apply=${r1.ok}/${r2.ok}; ${rowsJson(url)}`,
			r1.ok &&
				r2.ok &&
				col(url, "value")?.[0] ===
					"https://abcdefghijklmnopqrst.supabase.co/functions/v1",
		);
		await admin(db, "truncate net.http_request_queue");
		await run(
			db,
			`update public.users set cookie_preferences = '{"a":1}' where id = $1`,
			[A],
		);
		const c0 = await admin(db, "select count(*)::int n from net._http_calls");
		await run(db, `update public.users set name = 'Alice2' where id = $1`, [A]);
		const c1 = await admin(
			db,
			"select url, headers->>'Authorization' like 'Bearer %' as bearer from net._http_calls",
		);
		check(
			"M02 Brevo trigger: none on cookie_preferences update, one on name update to this project's URL",
			"0 then 1",
			`${rowsJson(c0)} ; ${rowsJson(c1)}`,
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
			"M02 'Sync Plans' cron command (as postgres) posts to this project's URL",
			".../sync-available-plans",
			`owner=${job.rows[0].username}; run=${summarize(runJob)}; calls=${rowsJson(c2)}`,
			runJob.ok &&
				col(c2, "url")?.[0] ===
					"https://abcdefghijklmnopqrst.supabase.co/functions/v1/sync-available-plans",
		);
		await db.close();
		const db2 = await load(snaps.m00);
		await admin(
			db2,
			`insert into vault.secrets (name, secret) values ('service_role_key', 'sb_secret_abc123')`,
		);
		await applyTx(env, db2, "M01");
		await applyTx(env, db2, "M02");
		db2.notices = [];
		const u = await run(
			db2,
			`update public.users set name = 'x' where id = $1`,
			[A],
		);
		const calls = await admin(
			db2,
			"select count(*)::int n from net._http_calls",
		);
		const jobRun = await run(
			db2,
			(await admin(db2, "select command from cron.job")).rows[0].command,
		);
		const calls2 = await admin(
			db2,
			"select count(*)::int n from net._http_calls",
		);
		check(
			"M02 with an sb_secret_ Vault key: no URL, update ok with WARNING, cron posts nothing",
			"ok, 0, 0",
			`update=${summarize(u)}; calls=${rowsJson(calls)}; cron=${summarize(jobRun)} ${rowsJson(calls2)}`,
			u.ok &&
				col(calls, "n")[0] === 0 &&
				col(calls2, "n")[0] === 0 &&
				db2.notices.some((n) => n.severity === "WARNING"),
		);
		await db2.close();
	}
	{
		const db = await load(snaps.m06);
		const nl = await admin(
			db,
			`select id, email from public.newsletter where catalogue_id = $1 order by id`,
			[IDS.CAT.bLive],
		);
		const nlb = await admin(
			db,
			`select id from private.backup_newsletter_dupes`,
		);
		const forged = await admin(
			db,
			`select id, owner_id from private.backup_newsletter_forged_owner`,
		);
		check(
			"C3 + dedupe: forged-owner row backed up and deleted first; dedupe keeps earliest legitimate row",
			"forged backup ...00f0; kept ...0001; dupes backup ...0002",
			`kept=${rowsJson(nl)} dupes=${rowsJson(nlb)} forged=${rowsJson(forged)}`,
			eqArr(col(nl, "id"), ["0e000000-0000-4000-8000-000000000001"]) &&
				eqArr(col(nlb, "id"), ["0e000000-0000-4000-8000-000000000002"]) &&
				eqArr(col(forged, "id"), ["0e000000-0000-4000-8000-0000000000f0"]),
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
			"M03 qr_configs dedupe keeps most recently updated",
			"kept ...0002",
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
			"M03 product_newsletter dedupe",
			"p@x.io 1, q@x.io 1",
			pn,
			rowsJson(pn) ===
				JSON.stringify([
					{ e: "p@x.io", n: 1 },
					{ e: "q@x.io", n: 1 },
				]),
		);
		const pr = await admin(
			db,
			`select (select count(*)::int from public.prompts where user_id is null) nulls, (select count(*)::int from private.backup_prompts_null_user) backup,
        (select count(*)::int from private.backup_ocr_null_user) ocr_backup,
        (select string_agg(conname||':'||confdeltype::text, ',' order by conname) from pg_constraint where conrelid in ('public.prompts'::regclass,'public.ocr'::regclass) and contype='f' and confrelid='public.catalogues'::regclass) fks,
        (select count(*)::int from pg_constraint where conrelid='public.prompts'::regclass and contype='u') uniques,
        (select string_agg(attname||':'||attnotnull::text, ',' order by attname) from pg_attribute where attrelid='public.prompts'::regclass and attname in ('turn_id','kind','plan_open','plan_budget','plan_hash','user_id','catalogue')) cols`,
		);
		check(
			"M03/M06 ledger shape: null-user rows backed up, FKs ON DELETE SET NULL, UNIQUE(catalogue) gone, turn_id/kind/plan columns",
			"nulls 0, backup 1, ocr_backup 1, fks n,n, uniques 0",
			pr,
			pr.ok &&
				pr.rows[0].nulls === 0 &&
				pr.rows[0].backup === 1 &&
				pr.rows[0].ocr_backup === 1 &&
				pr.rows[0].fks === "ocr_catalogue_fkey:n,prompts_catalogue_fkey:n" &&
				pr.rows[0].uniques === 0 &&
				pr.rows[0].cols ===
					"catalogue:false,kind:true,plan_budget:true,plan_hash:false,plan_open:true,turn_id:true,user_id:true",
		);
		const big1 = await run(
			db,
			`insert into public.catalogues (name, created_by, tags, content) values ('big-compressible', $1, '{}', jsonb_build_array(repeat('a', 1500000)))`,
			[A],
		);
		check(
			"size CHECK on a NEW highly compressible 1.5 MB content",
			"23514",
			big1,
			isErr(big1, "23514"),
		);
		const c4a = await run(
			db,
			`insert into private.paddle_unresolved_events (event_id, event_type, occurred_at, customer_id, reason, payload) values ('evt_x', 'subscription.created', now(), 'ctm_z', 'unlinked', '{"a":1}') returning event_id`,
		);
		const c4u = await U(
			db,
			A,
			`select 1 from private.paddle_unresolved_events`,
		);
		const c4p = await P(
			db,
			`insert into private.paddle_unresolved_events (event_id, event_type, occurred_at, reason, payload) values ('e','t',now(),'r','{}')`,
		);
		const c4r = await REST(
			db,
			"service_role",
			{ role: "service_role" },
			`select 1 from private.paddle_unresolved_events`,
		);
		check(
			"C4: asAdmin inserts private.paddle_unresolved_events; app_user/app_public denied; not reachable via PostgREST schema (service_role has no USAGE on private)",
			"ok; 42501; 42501; 42501",
			[c4a, c4u, c4p, c4r].map(summarize).join(" | "),
			c4a.ok &&
				isErr(c4u, "42501") &&
				isErr(c4p, "42501") &&
				isErr(c4r, "42501"),
		);
		await db.close();
	}

	// ----------------------------------------------------------------------------------------------------
	setGroup("B2 owner matrix (Clerk ids, postgres login, plan wrapper)");
	await ownerMatrix(ctx, snaps.m06, A, B, "clerk ids");

	// ----------------------------------------------------------------------------------------------------
	setGroup("B3 usage + AI ledger incl. M06 plan binding (C7, C8)");
	{
		const db = await load(snaps.m06);
		await run(db, `delete from public.prompts`);
		await run(
			db,
			`insert into public.prompts (user_id, catalogue, datetime, refunded_at) values ($1,'a-draft', now(), null), ($1,'a-draft', now(), now()), ($1,'a-draft', now() - interval '40 days', null), ($2,'b-live', now(), null)`,
			[A, B],
		);
		let o = await U(db, A, `select * from private.my_usage()`);
		check(
			"my_usage for A",
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
		const bt = (sub, cat, limit, kind = "agent", cont = null, hash = null) =>
			U(
				db,
				sub,
				`select outcome, ai_turn_id from private.begin_ai_turn($1, $2, $3, $4::uuid, $5)`,
				[cat, limit, kind, cont, hash],
				{ commit: true },
			);
		const sps = (sub, turn, open, pending, hash) =>
			U(
				db,
				sub,
				`select private.set_plan_state($1::uuid, $2, $3, $4) as ok`,
				[turn, open, pending, hash],
				{ commit: true },
			);
		const rf = (sub, id) =>
			U(db, sub, `select private.refund_ai_turn($1::uuid) as refunded`, [id], {
				commit: true,
			});
		const out = (x) => x?.rows?.[0]?.outcome;
		const tid = (x) => x?.rows?.[0]?.ai_turn_id;
		const row = async (turn) =>
			(
				await run(
					db,
					`select continuations, plan_open, plan_budget, plan_hash, kind, refunded_at is not null refunded from public.prompts where turn_id = $1`,
					[turn],
				)
			).rows[0];
		const count = async (sub) =>
			(
				await run(
					db,
					`select count(*)::int n from public.prompts where user_id = $1`,
					[sub],
				)
			).rows[0].n;
		const H1 = "1".repeat(64),
			H2 = "2".repeat(64),
			H3 = "3".repeat(64);

		o = await bt(A, "b-draft", 5);
		check(
			"begin_ai_turn on B's catalogue",
			"not_found",
			o,
			out(o) === "not_found",
		);
		const t1 = await bt(A, "a-draft", 10);
		check(
			"agent turn without continuation",
			"charged",
			t1,
			out(t1) === "charged",
		);
		let n0 = await count(A);
		o = await bt(A, "a-draft", 10, "agent", tid(t1), H1);
		check(
			"C8: continuation of a charged turn whose plan was never opened (no set_plan_state)",
			"charged (new row)",
			`${summarize(o)} rows ${n0}->${await count(A)}`,
			out(o) === "charged" && tid(o) !== tid(t1),
		);
		o = await sps(A, tid(t1), true, 3, H1);
		check(
			"C8: set_plan_state(open, 3 pending, H1) on own charged turn",
			"true; budget 3, hash H1",
			`${summarize(o)} ${JSON.stringify(await row(tid(t1)))}`,
			o.ok && o.rows[0].ok === true && (await row(tid(t1))).plan_budget === 3,
		);
		o = await bt(A, "a-draft", 10, "agent", tid(t1), H1);
		check(
			"C8: continuation with correct turn id + hash within budget",
			"continued, same turn id, continuations 1",
			`${summarize(o)} ${JSON.stringify(await row(tid(t1)))}`,
			out(o) === "continued" &&
				tid(o) === tid(t1) &&
				(await row(tid(t1))).continuations === 1,
		);
		n0 = await count(A);
		o = await bt(A, "a-draft", 10, "agent", tid(t1), H2);
		check(
			"C8: forged hash (H2) with the right turn id",
			"charged; continuations unchanged",
			`${summarize(o)} rows ${n0}->${await count(A)} ${JSON.stringify(await row(tid(t1)))}`,
			out(o) === "charged" && (await row(tid(t1))).continuations === 1,
		);
		o = await bt(A, "a-draft", 10, "agent", tid(t1), null);
		const o2 = await bt(A, "a-draft", 10, "agent", null, H1);
		check(
			"C8: continuation without hash / without turn id",
			"charged, charged",
			`${summarize(o)} | ${summarize(o2)}`,
			out(o) === "charged" && out(o2) === "charged",
		);
		o = await bt(A, "a-live", 10, "agent", tid(t1), H1);
		check(
			"C8: right turn id + hash but a different catalogue",
			"charged",
			o,
			out(o) === "charged",
		);
		o = await bt(A, "a-draft", 10, "describe", tid(t1), H1);
		check(
			"C8: kind describe presenting the agent turn id + hash",
			"charged (describe never continues)",
			o,
			out(o) === "charged",
		);
		// B's open plan
		const tb = await bt(B, "b-live", 10);
		await sps(B, tid(tb), true, 2, H3);
		o = await bt(A, "b-live", 10, "agent", tid(tb), H3);
		const o3 = await bt(A, "a-draft", 10, "agent", tid(tb), H3);
		check(
			"C8: A presents B's open-plan turn id + hash (on B's catalogue / on own catalogue)",
			"not_found, charged",
			`${summarize(o)} | ${summarize(o3)} | B row ${JSON.stringify(await row(tid(tb)))}`,
			out(o) === "not_found" &&
				out(o3) === "charged" &&
				(await row(tid(tb))).continuations === 0,
		);
		o = await sps(A, tid(tb), false, 0, null);
		check(
			"C8: A calls set_plan_state on B's turn",
			"false; B plan still open",
			`${summarize(o)} ${JSON.stringify(await row(tid(tb)))}`,
			o.ok && o.rows[0].ok === false && (await row(tid(tb))).plan_open === true,
		);
		// budget
		o = await sps(A, tid(t1), true, 8, H1);
		check(
			"C8: set_plan_state cannot raise the budget after the first open (8 requested)",
			"true; budget stays 3",
			`${summarize(o)} ${JSON.stringify(await row(tid(t1)))}`,
			o.ok && (await row(tid(t1))).plan_budget === 3,
		);
		const c2 = await bt(A, "a-draft", 10, "agent", tid(t1), H1);
		const c3 = await bt(A, "a-draft", 10, "agent", tid(t1), H1);
		const c4 = await bt(A, "a-draft", 10, "agent", tid(t1), H1);
		check(
			"C8: budget exhaustion (budget 3: continuations 2, 3 continue; 4th charged)",
			"continued, continued, charged",
			[c2, c3, c4].map(summarize).join(" | "),
			out(c2) === "continued" &&
				out(c3) === "continued" &&
				out(c4) === "charged" &&
				(await row(tid(t1))).continuations === 3,
		);
		// hash updated after a continuation; old hash no longer works
		const t2 = await bt(A, "a-live", 50);
		await sps(A, tid(t2), true, 5, H1);
		await bt(A, "a-live", 50, "agent", tid(t2), H1);
		o = await sps(A, tid(t2), true, 4, H2);
		const oldH = await bt(A, "a-live", 50, "agent", tid(t2), H1);
		const newH = await bt(A, "a-live", 50, "agent", tid(t2), H2);
		check(
			"C8: set_plan_state after a continuation updates the hash (budget unchanged); old hash charged, new hash continued",
			"charged, continued; budget 5",
			`${summarize(oldH)} | ${summarize(newH)} | ${JSON.stringify(await row(tid(t2)))}`,
			out(oldH) === "charged" &&
				out(newH) === "continued" &&
				(await row(tid(t2))).plan_budget === 5,
		);
		// closed plan
		await sps(A, tid(t2), false, 0, null);
		o = await bt(A, "a-live", 50, "agent", tid(t2), H2);
		check(
			"C8: plan closed by set_plan_state(null plan) -> continuation",
			"charged; plan_open false, hash null",
			`${summarize(o)} ${JSON.stringify(await row(tid(t2)))}`,
			out(o) === "charged" &&
				(await row(tid(t2))).plan_open === false &&
				(await row(tid(t2))).plan_hash === null,
		);
		// expired
		const t3 = await bt(A, "a-live", 50);
		await sps(A, tid(t3), true, 2, H3);
		await run(
			db,
			`update public.prompts set datetime = now() - interval '16 minutes' where turn_id = $1`,
			[tid(t3)],
		);
		o = await bt(A, "a-live", 50, "agent", tid(t3), H3);
		const exps = await sps(A, tid(t3), true, 2, H3);
		check(
			"C8: expired window (turn 16 minutes old): continuation, set_plan_state",
			"charged, false",
			`${summarize(o)} | ${summarize(exps)}`,
			out(o) === "charged" && exps.rows?.[0]?.ok === false,
		);
		// describe
		const d1 = await bt(A, "a-live", 50, "describe");
		const dps = await sps(A, tid(d1), true, 2, H3);
		const dcont = await bt(A, "a-live", 50, "describe", tid(d1), H3);
		check(
			"C8: describe turn: set_plan_state false; describe continuation charged",
			"charged, false, charged",
			[d1, dps, dcont].map(summarize).join(" | "),
			out(d1) === "charged" &&
				dps.rows?.[0]?.ok === false &&
				out(dcont) === "charged",
		);
		// validation
		o = await bt(A, "a-live", 50, "bogus");
		const vh = await sps(A, tid(t2), true, 1, "XYZ");
		const vh2 = await sps(A, tid(t2), true, 1, "A".repeat(64));
		const neg = await bt(A, "a-live", -1);
		const nosub = await inRole(db, "app_user", {}, () =>
			run(
				db,
				`select * from private.begin_ai_turn('a-live', 5, 'agent', null, null)`,
			),
		);
		const nullcat = await U(
			db,
			A,
			`select * from private.begin_ai_turn(null, 5, 'agent', null, null)`,
		);
		const nullkind = await U(
			db,
			A,
			`select * from private.begin_ai_turn('a-live', 5, null, null, null)`,
		);
		check(
			"C8 validation: invalid kind 22023; bad hash format 22023 (uppercase too); negative limit 22023; no sub 42501; null catalogue not_found; null kind 22023",
			"22023, 22023, 22023, 22023, 42501, not_found, 22023",
			[o, vh, vh2, neg, nosub, nullcat, nullkind].map(summarize).join(" | "),
			isErr(o, "22023") &&
				isErr(vh, "22023") &&
				isErr(vh2, "22023") &&
				isErr(neg, "22023") &&
				isErr(nosub, "42501") &&
				out(nullcat) === "not_found" &&
				isErr(nullkind, "22023"),
		);
		// limit vs continuation
		await run(db, `delete from public.prompts`);
		const l1 = await bt(A, "a-draft", 1);
		await sps(A, tid(l1), true, 3, H1);
		const lLimit = await bt(A, "a-draft", 1);
		const lCont = await bt(A, "a-draft", 1, "agent", tid(l1), H1);
		const lForged = await bt(A, "a-draft", 1, "agent", tid(l1), H2);
		const nAfter = await count(A);
		check(
			"limit check vs continuation (limit 1, 1 used): new turn / proven continuation / forged continuation",
			"limit, continued (free), limit (no row added)",
			`${[lLimit, lCont, lForged].map(summarize).join(" | ")}; rows=${nAfter}`,
			out(lLimit) === "limit" &&
				out(lCont) === "continued" &&
				out(lForged) === "limit" &&
				nAfter === 1,
		);
		// refund rules and cap
		await run(db, `delete from public.prompts`);
		const r1 = await bt(A, "a-live", null);
		const rf1 = await rf(A, tid(r1));
		const rf2 = await rf(A, tid(r1));
		check(
			"refund own no-op turn, then again",
			"true, false",
			`${summarize(rf1)} | ${summarize(rf2)}`,
			rf1.rows?.[0]?.refunded === true && rf2.rows?.[0]?.refunded === false,
		);
		const r2 = await bt(A, "a-live", null);
		await sps(A, tid(r2), true, 2, H1);
		const rfOpen = await rf(A, tid(r2));
		await bt(A, "a-live", null, "agent", tid(r2), H1);
		await sps(A, tid(r2), false, 0, null);
		const rfCont = await rf(A, tid(r2));
		const r3 = await bt(A, "a-live", null);
		await run(
			db,
			`update public.prompts set datetime = now() - interval '11 minutes' where turn_id = $1`,
			[tid(r3)],
		);
		const rfOld = await rf(A, tid(r3));
		const rb = await bt(B, "b-live", null);
		const rfB = await rf(A, tid(rb));
		const rfNoSub = await inRole(db, "app_user", {}, () =>
			run(db, `select private.refund_ai_turn($1::uuid) as refunded`, [tid(rb)]),
		);
		check(
			"refund rules: open plan false; continued (then closed) false; >10 min false; B's turn false; no sub false",
			"false x5",
			[rfOpen, rfCont, rfOld, rfB, rfNoSub].map(summarize).join(" | "),
			[rfOpen, rfCont, rfOld, rfB, rfNoSub].every(
				(x) => x.ok && x.rows[0].refunded === false,
			),
		);
		const lim = await run(
			db,
			`select count(*)::int n from public.prompts where user_id = $1 and refunded_at is null`,
			[A],
		);
		const r4 = await bt(A, "a-live", lim.rows[0].n + 1);
		check(
			"refunded row does not count towards the limit (limit = unrefunded + 1)",
			"charged",
			r4,
			out(r4) === "charged",
		);
		await admin(
			db,
			`insert into private.settings (key, value) values ('ai_refund_cap_per_month', '2') on conflict (key) do update set value = excluded.value`,
		);
		const capTurns = [];
		for (let i = 0; i < 3; i++) capTurns.push(await bt(A, "a-draft", null));
		const capRes = [];
		for (const t of capTurns) capRes.push(await rf(A, tid(t)));
		check(
			"refund cap per month (ai_refund_cap_per_month = 2, 1 refund already this month)",
			"true, false, false",
			capRes.map(summarize).join(" | "),
			capRes[0].rows?.[0]?.refunded === true &&
				capRes[1].rows?.[0]?.refunded === false &&
				capRes[2].rows?.[0]?.refunded === false,
		);
		await admin(
			db,
			`update private.settings set value = 'abc' where key = 'ai_refund_cap_per_month'`,
		);
		const capBad = await rf(A, tid(capTurns[1]));
		check(
			"refund cap setting not numeric -> default 30",
			"true",
			capBad,
			capBad.rows?.[0]?.refunded === true,
		);
		const prevMonth = await run(
			db,
			`insert into public.prompts (user_id, catalogue, datetime, refunded_at) values ($1, 'a-draft', now() - interval '40 days', now() - interval '40 days')`,
			[A],
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
		const pm1 = await bt(A, "a-draft", used);
		const pm2 = await bt(A, "a-draft", used + 1);
		check(
			"rows from a previous month are not counted",
			"limit at current count, charged at +1",
			`${summarize(prevMonth)} | ${summarize(pm1)} | ${summarize(pm2)}`,
			out(pm1) === "limit" && out(pm2) === "charged",
		);
		// ledger integrity
		const beforeDel = await count(A);
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
			"owner deletes a-draft: AI ledger rows survive",
			`count ${beforeDel}, catalogue NULL`,
			`${summarize(del)} ${rowsJson(afterDel)}`,
			del.ok && afterDel.rows[0].n === beforeDel && afterDel.rows[0].nulls > 0,
		);
		o = await run(
			db,
			`insert into public.prompts (user_id, catalogue) values (null, 'a-live')`,
		);
		const uu = await U(db, A, `update public.prompts set refunded_at = now()`);
		const uu2 = await U(
			db,
			A,
			`update public.prompts set plan_budget = 8, plan_open = true`,
		);
		const kindC = await run(
			db,
			`insert into public.prompts (user_id, catalogue, kind) values ($1, 'a-live', 'x')`,
			[A],
		);
		const budC = await run(
			db,
			`insert into public.prompts (user_id, catalogue, plan_budget) values ($1, 'a-live', 9)`,
			[A],
		);
		check(
			"ledger constraints: null user 23502; app_user UPDATE refunded_at / plan columns 42501; kind check 23514; budget range 23514",
			"23502, 42501, 42501, 23514, 23514",
			[o, uu, uu2, kindC, budC].map(summarize).join(" | "),
			isErr(o, "23502") &&
				isErr(uu, "42501") &&
				isErr(uu2, "42501") &&
				isErr(kindC, "23514") &&
				isErr(budC, "23514"),
		);
		const oldSig = await U(
			db,
			A,
			`select * from private.begin_ai_turn('a-live', 5, false)`,
		);
		check(
			"M05 begin_ai_turn(text, integer, boolean) no longer exists after M06",
			"42883",
			oldSig,
			isErr(oldSig, "42883"),
		);
		await db.close();
	}
	{
		// C7: FOR NO KEY UPDATE lock strength on the users row (pageinspect t_infomask2 HEAP_KEYS_UPDATED 0x2000)
		const db = await load(snaps.m06, { pageinspect: true });
		await admin(db, `create extension if not exists pageinspect`);
		await admin(
			db,
			`create function public.zz_users_locks() returns table (infomask int, infomask2 int) language sql security definer set search_path = public, pg_catalog as $f$
      select h.t_infomask, h.t_infomask2 from generate_series(0, (pg_relation_size('public.users') / 8192)::int - 1) b,
        lateral heap_page_items(get_raw_page('public.users', b)) h where h.t_xmax::text = pg_current_xact_id()::text $f$`,
		);
		await admin(
			db,
			`grant execute on function public.zz_users_locks() to postgres`,
		);
		const probe = async (fnSql) => {
			await db.exec("begin");
			await db.query(WRAPPER_SQL, [
				"app_user",
				JSON.stringify({ sub: A, role: "app_user" }),
				"8s",
				"3s",
				"10s",
			]);
			const r = await run(db, fnSql);
			await db.query(`select set_config('role', 'none', true)`);
			const l = await run(db, `select * from public.zz_users_locks()`);
			await db.exec("rollback");
			return { r, l };
		};
		const m06 = await probe(
			`select * from private.begin_ai_turn('a-live', 100, 'agent', null, null)`,
		);
		const drz = await probe(
			`select plan_id from public.users where id = '${A}' for no key update`,
		);
		const upd = await probe(
			`select plan_id from public.users where id = '${A}' for update`,
		);
		const bits = (x) =>
			x.l.ok
				? x.l.rows
						.map(
							(r) =>
								`mask=${r.infomask} mask2=${r.infomask2} keys_updated=${(r.infomask2 & 0x2000) !== 0} excl=${(r.infomask & 0x40) !== 0} lock_only=${(r.infomask & 0x80) !== 0}`,
						)
						.join(";")
				: summarize(x.l);
		const noKey = (x) =>
			x.l.ok &&
			x.l.rows.length === 1 &&
			(x.l.rows[0].infomask & 0xc0) === 0xc0 &&
			(x.l.rows[0].infomask2 & 0x2000) === 0;
		check(
			"C7: begin_ai_turn (M06) and getPlanForUpdate lock the caller's users row FOR NO KEY UPDATE (no HEAP_KEYS_UPDATED), unlike FOR UPDATE",
			"begin_ai_turn: excl lock-only, keys_updated=false; drizzle no key update: same; FOR UPDATE reference: keys_updated=true",
			`begin_ai_turn ${summarize(m06.r)} -> ${bits(m06)} | no key update -> ${bits(drz)} | for update -> ${bits(upd)}`,
			m06.r.ok &&
				noKey(m06) &&
				noKey(drz) &&
				upd.l.ok &&
				(upd.l.rows[0]?.infomask2 & 0x2000) !== 0,
			{
				note: "PGlite is single-connection: blocking behaviour itself is not observable; lock strength read from the tuple header",
			},
		);
		await db.close();
	}

	// ----------------------------------------------------------------------------------------------------
	setGroup("B4 admin, worker and PostgREST perimeter (M01-M06)");
	{
		const db = await load(snaps.m06);
		let o = await run(
			db,
			`insert into private.paddle_events (event_id, event_type, occurred_at) values ('evt_1', 'subscription.updated', now()) on conflict do nothing returning event_id`,
		);
		const o2 = await run(
			db,
			`insert into private.paddle_events (event_id, event_type, occurred_at) values ('evt_1', 'subscription.updated', now()) on conflict do nothing returning event_id`,
		);
		check(
			"asAdmin Paddle idempotency",
			"1 row then 0",
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
		o = await run(db, `select count(*)::int n from public.contacts`);
		check("asAdmin CRM view contacts", "ok", o, o.ok);
		o = await REST(
			db,
			"service_role",
			{ role: "service_role" },
			`update public.catalogues set status = 'inactive' where created_by = $1 returning name`,
			[B],
		);
		check(
			"worker: inactivate B's catalogues (touch trigger fires as service_role)",
			"2 rows",
			o,
			o.ok && o.n === 2,
		);
		o = await REST(
			db,
			"service_role",
			{ role: "service_role" },
			`insert into public.analytics (date, current_url, pageview_count, unique_visitors, user_id) values (now(), 'https://q/x', 1, 1, $1) on conflict (date, current_url) do nothing`,
			[A],
		);
		check("worker: analytics upsert", "ok", o, o.ok);
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
						bad.push(`${role}: ${sql} -> ${summarize(r)}`);
				}
			}
			for (const f of [
				`private.begin_ai_turn('a-live', 5, 'agent', null, null)`,
				`private.set_plan_state(gen_random_uuid(), false, 0, null)`,
				`private.refund_ai_turn(gen_random_uuid())`,
				`private.subscribe_catalogue_newsletter('${IDS.CAT.bLive}', 'x@y.io')`,
				`private.subscribe_product_newsletter('x@y.io')`,
				`private.catalogue_name_available('x')`,
				`private.my_usage()`,
				`private.current_user_id()`,
				`public.call_edge_function_with_vault_secret()`,
			]) {
				total++;
				const r = await REST(db, role, claims, `select ${f}`);
				if (!isErr(r, ["42501", "0A000"]))
					bad.push(`${role}: ${f} -> ${summarize(r)}`);
			}
		}
		check(
			"PostgREST perimeter after M06: 3 identities x 14 relations x S/I/U/D + 9 RPCs",
			`all ${total} denied`,
			bad.length ? bad.slice(0, 6).join(" || ") : `all ${total} denied`,
			bad.length === 0,
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
			"dashboard_user",
			"pgbouncer",
		]) {
			for (const target of ["app_user", "app_public"]) {
				await db.as(sess);
				const r = await run(db, `select set_config('role', $1, false)`, [
					target,
				]);
				if (r.ok) escal.push(`${sess} -> ${target}`);
			}
		}
		await db.as("postgres");
		check(
			"no Supabase service role can SET ROLE app_user/app_public",
			"all denied",
			escal.length ? escal.join(", ") : "all denied",
			escal.length === 0,
		);
		await db.as("supabase_admin");
		const perimeter = {
			"RLS enabled on every public table": `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity`,
			"anon/authenticated: no table or column privilege in public": `select r.rolname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join (values ('anon'), ('authenticated')) r(rolname) where n.nspname = 'public' and c.relkind in ('r','p','v','m','f') and (has_table_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') or has_any_column_privilege(r.rolname, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES'))`,
			"anon/authenticated: no sequence privilege": `select r.rolname, c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace cross join (values ('anon'), ('authenticated')) r(rolname) where n.nspname = 'public' and c.relkind = 'S' and has_sequence_privilege(r.rolname, c.oid, 'USAGE,SELECT,UPDATE')`,
			"anon/authenticated: no EXECUTE on public/private functions": `select r.rolname, p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace cross join (values ('anon'), ('authenticated')) r(rolname) where n.nspname in ('public', 'private') and has_function_privilege(r.rolname, p.oid, 'EXECUTE')`,
			"no Supabase service role can become an app role": `select m.rolname, t.rolname from (values ('authenticator'), ('anon'), ('authenticated'), ('service_role'), ('supabase_realtime_admin'), ('supabase_storage_admin'), ('supabase_auth_admin'), ('pgbouncer'), ('dashboard_user')) m(rolname) cross join (values ('app_user'), ('app_public')) t(rolname) where pg_has_role(m.rolname, t.rolname, 'MEMBER')`,
			"no private function is executable by PUBLIC": `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'private' and (p.proacl is null or exists (select 1 from aclexplode(p.proacl) a where a.grantee = 0 and a.privilege_type = 'EXECUTE'))`,
			"every SECURITY DEFINER function pins search_path to empty": `select p.oid::regprocedure from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname in ('public', 'private') and p.prosecdef and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c in ('search_path=""', 'search_path='))`,
			"app_public has no privilege on any public table except catalogues": `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','v') and c.relname not in ('catalogues') and has_any_column_privilege('app_public', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')`,
			"app_user has nothing on system tables and CRM views": `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('subscriptions','plans','job_logs','product_newsletter','contacts','active_subscriptions') and has_any_column_privilege('app_user', c.oid, 'SELECT,INSERT,UPDATE,REFERENCES')`,
			"every policy uses (select private.current_user_id()) or no identity": `select polname from pg_policy p where p.polrelid::regclass::text not like 'auth.%' and (coalesce(pg_get_expr(p.polqual, p.polrelid), '') || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')) like '%current_user_id()%' and (coalesce(pg_get_expr(p.polqual, p.polrelid), '') || coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '')) not like '%SELECT private.current_user_id()%'`,
			"every policy targets app_user or app_public only": `select polname, polroles::regrole[]::text from pg_policy where not (polroles <@ array['app_user'::regrole, 'app_public'::regrole]::oid[])`,
		};
		for (const [name, sql] of Object.entries(perimeter)) {
			const r = await run(db, sql);
			check(
				`00_perimeter catalog query: ${name}`,
				"empty",
				r,
				r.ok && r.n === 0,
			);
		}
		let r = await run(
			db,
			`select pg_has_role('postgres', 'app_user', 'SET') s, pg_has_role('postgres', 'app_user', 'USAGE') u, has_schema_privilege('anon', 'private', 'USAGE') anon_u, has_schema_privilege('authenticated', 'private', 'USAGE') auth_u, has_column_privilege('app_public', 'public.catalogues', 'created_by', 'SELECT') pub_cb`,
		);
		check(
			"postgres SET-only membership; no private USAGE for anon/authenticated; app_public no created_by",
			"s=t u=f f f f",
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
			"grants-match-columns: app_user UPDATE on catalogues",
			editable,
			r,
			r.ok && r.rows[0].cols === editable,
		);
		await db.as("postgres");
		await db.close();
	}

	// ----------------------------------------------------------------------------------------------------
	setGroup(
		"B5 wrapper semantics: injection, leakage, temp-table shadowing blocked by the wrapper search_path",
	);
	{
		const db = await load(snaps.m06);
		const evil = `x', true); drop table public.users; --"\\`;
		let o = await inRole(db, "app_user", { sub: evil }, () =>
			run(
				db,
				`select private.current_user_id() uid, (select count(*)::int from public.catalogues) n`,
			),
		);
		const tbl = await run(db, `select count(*)::int n from public.users`);
		check(
			"claims injection via bound parameter",
			"literal sub; 0 rows; users intact",
			`${summarize(o)}; ${rowsJson(tbl)}`,
			o.ok && o.rows[0].uid === evil && o.rows[0].n === 0 && tbl.ok,
		);
		o = await inRole(db, "app_user", { sub: A }, () =>
			run(
				db,
				`select current_user::text cu, current_setting('search_path') sp`,
			),
		);
		check(
			"wrapper sets role and search_path transaction-locally",
			"app_user, 'public, pg_temp'",
			o,
			o.ok && o.rows[0].cu === "app_user" && o.rows[0].sp === "public, pg_temp",
		);
		await inRole(db, "app_user", { sub: A }, () => run(db, "select 1"), {
			commit: true,
		});
		o = await run(
			db,
			`select current_user::text cu, current_setting('request.jwt.claims', true) c, current_setting('search_path') sp, current_setting('statement_timeout') st`,
		);
		check(
			"after COMMIT: role/claims/search_path/timeouts reset on the pooled session",
			"postgres, '', login search_path, 0",
			o,
			o.ok &&
				o.rows[0].cu === "postgres" &&
				!o.rows[0].c &&
				o.rows[0].sp !== "public, pg_temp" &&
				o.rows[0].st === "0",
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
					`insert into pg_temp.catalogues (id, name, created_by, status, tags, content) values ('bbbbbbbb-0000-4000-8000-000000000002', 'b-live', $1, 'active', '{}', '[{"forged":true}]')`,
					[B],
				);
			},
			{ commit: true },
		);
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
					["b-secret-new", B, "draft", "{}", '[{"secret":"B"}]'],
				),
			{ commit: true },
		);
		const inPublic = await admin(
			db,
			`select count(*)::int n from public.catalogues where name = 'b-secret-new'`,
		);
		const fn = await inRole(db, "app_user", { sub: B }, () =>
			run(
				db,
				`select private.current_user_id() uid, gen_random_uuid() is not null g, now() is not null n`,
			),
		);
		check(
			"temp-table shadowing on a postgres-login pooled backend: A plants pg_temp.catalogues; B's unqualified Drizzle read/insert under the plan wrapper",
			"B reads the real row; B's insert lands in public; builtins resolve",
			`plant=${summarize(plant)}; read=${summarize(bRead)}; write=${summarize(bWrite)}; public=${rowsJson(inPublic)}; fn=${summarize(fn)}`,
			plant.ok &&
				bRead.ok &&
				bRead.n === 1 &&
				!JSON.stringify(bRead.rows).includes("forged") &&
				bWrite.ok &&
				inPublic.rows[0].n === 1 &&
				fn.ok,
		);
		await run(db, `discard temp`);
		o = await inRole(db, "app_user", { sub: A }, async () => {
			await run(db, `select set_config('request.jwt.claims', $1, true)`, [
				JSON.stringify({ sub: B }),
			]);
			const a2 = await run(
				db,
				`select name from public.catalogues order by name`,
			);
			const a3 = await run(db, `reset role`);
			const a4 = await run(db, `select current_user::text cu`);
			return {
				ok: a2.ok && a4.ok,
				rows: [{ spoofed: col(a2, "name"), after_reset: a4.rows?.[0]?.cu }],
				n: 1,
			};
		});
		check(
			"threat model (phases 1 until M08, postgres login): injected SQL can rewrite claims and RESET ROLE to postgres",
			"B's rows; postgres (documented residual risk R3)",
			o,
			o.ok &&
				eqArr(o.rows[0].spoofed, ["b-draft", "b-live", "b-secret-new"]) &&
				o.rows[0].after_reset === "postgres",
			{ severity: "info" },
		);
		await db.close();
	}

	{
		const db = await load(snaps.m06);
		let o = await inRole(db, "app_user", { sub: A, role: "service_role" }, () =>
			run(db, `select current_user::text cu`),
		);
		check(
			"claims carrying role:'service_role' cannot change the DB role",
			"app_user",
			o,
			o.ok && o.rows[0].cu === "app_user",
		);
		o = await (async () => {
			await db.exec("begin");
			await run(
				db,
				`select pg_catalog.set_config('role', 'app_user', true), pg_catalog.set_config('request.jwt.claims', 'not json', true)`,
			);
			const y = await run(db, `select name from public.catalogues`);
			await db.exec("rollback");
			return y;
		})();
		check(
			"malformed claims string reaching the helper",
			"22P02 (fail closed)",
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
			"non-string sub (number)",
			"uid '123', 0 rows",
			o,
			o.ok && o.rows[0].uid === "123" && o.rows[0].n === 0,
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
		]) {
			await db.exec("begin");
			const x = await run(db, `select set_config('role', $1, true)`, [target]);
			await db.exec("rollback");
			allowed[target] = x.ok ? "allowed" : x.code;
		}
		check(
			"DB-side role reachability from the postgres DB_CONNECTION_STRING session (until M08)",
			"app_user/app_public allowed; service_role/authenticated/anon also allowed (TS allowlist only); supabase_admin denied",
			JSON.stringify(allowed),
			allowed.app_user === "allowed" &&
				allowed.app_public === "allowed" &&
				allowed.supabase_admin === "42501",
			{ severity: "info" },
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
			`select current_user::text cu, private.current_user_id() uid, current_setting('search_path') sp`,
		);
		check(
			"after an error inside withUser (COMMIT acts as ROLLBACK)",
			"postgres, uid null, login search_path",
			o,
			o.ok &&
				o.rows[0].cu === "postgres" &&
				o.rows[0].uid === null &&
				o.rows[0].sp !== "public, pg_temp",
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
			`select current_user::text cu, private.current_user_id() uid, current_setting('search_path') sp`,
		);
		check(
			"wrapper statement accidentally run in autocommit: is_local settings end with the statement",
			"postgres, uid null",
			o,
			o.ok &&
				o.rows[0].cu === "postgres" &&
				o.rows[0].uid === null &&
				o.rows[0].sp !== "public, pg_temp",
		);
		await inRole(db, "app_user", { sub: A }, () => run(db, "select 1"), {
			commit: true,
		});
		o = await inRole(db, "app_public", {}, () =>
			run(
				db,
				`select current_setting('request.jwt.claims', true) c, current_user::text cu`,
			),
		);
		check(
			"withPublic after withUser on the same connection carries no sub",
			`{"role":"app_public"}`,
			o,
			o.ok &&
				o.rows[0].c === '{"role":"app_public"}' &&
				o.rows[0].cu === "app_public",
		);
		await admin(db, `alter role app_user set statement_timeout = '1234ms'`);
		o = await inRole(db, "app_user", { sub: A }, () =>
			run(db, `select current_setting('statement_timeout') st`),
		);
		check(
			"SET ROLE does not apply ALTER ROLE ... SET (why the wrapper sets timeouts)",
			"8s",
			o,
			o.ok && o.rows[0].st === "8s",
		);
		await admin(db, `alter role app_user reset statement_timeout`);
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
				`select current_user::text cu, private.current_user_id() uid, current_setting('search_path') sp`,
			);
		});
		check(
			"ROLLBACK TO SAVEPOINT restores claims and keeps role and search_path",
			`app_user, ${A}, public, pg_temp`,
			o,
			o.ok &&
				o.rows[0].cu === "app_user" &&
				o.rows[0].uid === A &&
				o.rows[0].sp === "public, pg_temp",
		);
		o = await P(db, `select count(*)::int n from public.catalogues`);
		const o2 = await P(
			db,
			`select name from public.catalogues where created_by = $1`,
			[B],
		);
		check(
			"app_public: count(*) works with column grants; filtering on created_by denied",
			"2; 42501",
			`${summarize(o)} | ${summarize(o2)}`,
			o.ok && o.rows[0].n === 2 && isErr(o2, "42501"),
		);
		const cf = await U(
			db,
			A,
			`create function public.lower(text) returns text language sql as 'select 1::text'`,
		);
		const ct = await U(db, A, `create temp table t1 (a int)`);
		check(
			"app_user cannot create objects in public (operator/function shadowing); TEMP allowed (PUBLIC TEMP on the database, neutralised by search_path)",
			"42501; ok",
			`${summarize(cf)} | ${summarize(ct)}`,
			isErr(cf, "42501") && ct.ok,
		);
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('edge_webhook_secret', 'whsec_x')`,
		);
		await admin(
			db,
			`insert into private.settings (key, value) values ('edge_functions_base_url', 'https://abcdefghijklmnopqrst.supabase.co/functions/v1') on conflict (key) do update set value = excluded.value`,
		);
		const ren = await U(
			db,
			A,
			`update public.users set name = 'Alice R' where id = $1 returning id`,
			[A],
			{ commit: true },
		);
		const q = await P(db, `select count(*)::int n from net.http_request_queue`);
		const post = await P(
			db,
			`select net.http_post(url := 'http://169.254.169.254/latest/meta-data', body := '{}'::jsonb)`,
		);
		check(
			"pg_net residual (documented, not fixable by a postgres migration): app_user rename queues the webhook through the definer; app_public can read the queue and call net.http_post",
			"rename ok; queue readable; http_post allowed",
			`${summarize(ren)} | ${summarize(q)} | ${summarize(post)}`,
			ren.ok && q.ok && post.ok,
			{ severity: "info" },
		);
		await db.close();
	}

	// ----------------------------------------------------------------------------------------------------
	setGroup(
		"B6 app layer: real drizzle-orm SQL with the plan wrapper (Clerk ids, postgres login)",
	);
	await appLayer(ctx, snaps.m06, A, B, "clerk ids, M06", IDS.CAT);

	// ----------------------------------------------------------------------------------------------------
	setGroup("B7 misc SQL semantics");
	{
		const db = await load(snaps.m06);
		let o = await inRole(db, "app_user", { sub: A }, () =>
			run(db, `explain (costs off) select name from public.catalogues`),
		);
		const plan = o.ok
			? o.rows.map((r) => r["QUERY PLAN"]).join(" / ")
			: summarize(o);
		check(
			"policy helper planned as InitPlan",
			"InitPlan",
			plan,
			/InitPlan/.test(plan),
		);
		const tr = await run(
			db,
			`create trigger zz_probe after insert on auth.users for each row execute function private.touch_updated_at()`,
		);
		const dr = await run(db, `drop trigger zz_probe on auth.users`);
		check(
			"postgres can CREATE but not DROP a trigger on auth.users",
			"ok; 42501",
			`${summarize(tr)} | ${summarize(dr)}`,
			tr.ok && isErr(dr, "42501"),
		);
		await admin(db, `drop trigger if exists zz_probe on auth.users`);
		await run(
			db,
			`create function public.zz_probe() returns int language sql as 'select 1'`,
		);
		o = await admin(
			db,
			`select has_function_privilege('anon', 'public.zz_probe()', 'EXECUTE') anon_x, has_function_privilege('app_user', 'public.zz_probe()', 'EXECUTE') app_x`,
		);
		check(
			"after M01 a new postgres function in public is not executable by anon/app roles (global default revoke)",
			"false,false",
			o,
			o.ok && o.rows[0].anon_x === false && o.rows[0].app_x === false,
		);
		await db.close();
	}
	{
		const db = await load(S_base);
		await run(
			db,
			`insert into public.catalogues (name, created_by, tags, content) values ('legacy-big', $1, '{}', jsonb_build_array(repeat('a', 1500000)))`,
			[A],
		);
		for (const k of ["M00", "M01", "M02", "M03", "M04", "M05", "M06", "M07"]) {
			const r = await applyTx(env, db, k);
			if (!r.ok) R.notes.push(`size-semantics apply ${k}: ${T(r)}`);
		}
		const v = await admin(
			db,
			`select conname, convalidated from pg_constraint where conname in ('catalogues_content_size') `,
		);
		const u1 = await U(
			db,
			A,
			`update public.catalogues set heading = 'h' where name = 'legacy-big' returning name`,
		);
		const u3 = await U(
			db,
			A,
			`update public.catalogues set content = content || '[1]'::jsonb where name = 'legacy-big' returning name`,
		);
		const audit = await admin(
			db,
			`select max(octet_length(content::text)) raw, max(pg_column_size(content)) stored from public.catalogues`,
		);
		check(
			"F8: legacy 1.5 MB compressible content passes M07 VALIDATE (compressed); heading update ok; content edit 23514; A.15 octet_length audit sees the raw size",
			"validated; ok; 23514; raw > 1 MiB",
			`${rowsJson(v)} ${summarize(u1)} ${summarize(u3)} ${rowsJson(audit)}`,
			v.rows[0]?.convalidated === true &&
				u1.ok &&
				isErr(u3, "23514") &&
				audit.rows[0].raw > 1048576,
			{ severity: "info" },
		);
		await db.close();
	}
}
