// Gate E: M09 edge webhook secret (Track K).
import {
	IDS,
	applyTx,
	run,
	U,
	P,
	admin,
	isErr,
	rowsJson,
	col,
	summarize,
	T,
} from "./final-lib.mjs";
const A = IDS.A,
	B = IDS.B;
const BASE = "https://abcdefghijklmnopqrst.supabase.co/functions/v1";

export async function gateE(ctx) {
	const { env, R, check, snaps, setGroup } = ctx;
	setGroup("E Track K: M09 edge webhook secret");
	const calls = (db) =>
		admin(
			db,
			`select url, headers ->> 'x-webhook-secret' secret, headers ? 'Authorization' has_auth, headers ->> 'Authorization' auth, body ->> 'id' id from net._http_calls order by id`,
		);
	{
		const db = await env.load(snaps.m09);
		const fdef = await admin(
			db,
			`select pg_get_functiondef('public.call_edge_function_with_vault_secret()'::regprocedure) d, (select proacl::text from pg_proc where oid = 'public.call_edge_function_with_vault_secret()'::regprocedure) acl, (select proconfig::text from pg_proc where oid = 'public.call_edge_function_with_vault_secret()'::regprocedure) cfg`,
		);
		check(
			"M09 function definition: SECURITY DEFINER, search_path '', ACL without PUBLIC/anon/authenticated",
			"x-webhook-secret in body; acl postgres+service_role",
			fdef,
			fdef.ok &&
				/x-webhook-secret/.test(fdef.rows[0].d) &&
				/SECURITY DEFINER/.test(fdef.rows[0].d) &&
				!/(^|[{,])=X|anon=|authenticated=/.test(fdef.rows[0].acl ?? "") &&
				/search_path=\\?"\\?"/.test(fdef.rows[0].cfg),
		);
		// no base url
		db.notices = [];
		let u = await run(db, `update public.users set name = 'n0' where id = $1`, [
			A,
		]);
		let c = await calls(db);
		check(
			"no edge_functions_base_url: update ok, trigger warns and skips",
			"ok; 0 calls; WARNING",
			`${summarize(u)}; ${rowsJson(c)}; ${JSON.stringify(db.notices.map((n) => n.message).slice(-1))}`,
			u.ok &&
				c.rows.length === 0 &&
				db.notices.some(
					(n) =>
						n.severity === "WARNING" &&
						/edge_functions_base_url not set/.test(n.message),
				),
		);
		await admin(
			db,
			`insert into private.settings (key, value) values ('edge_functions_base_url', $1)`,
			[BASE],
		);
		// base url, no credentials at all
		db.notices = [];
		u = await run(db, `update public.users set name = 'n1' where id = $1`, [A]);
		c = await calls(db);
		check(
			"base url but no Vault credential: update ok, skipped with WARNING",
			"ok; 0 calls",
			`${summarize(u)}; ${rowsJson(c)}`,
			u.ok &&
				c.rows.length === 0 &&
				db.notices.some((n) => /no webhook credential/.test(n.message)),
		);
		// legacy fallback: service_role_key only
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('service_role_key', 'eyJ.legacy.SERVICE_ROLE')`,
		);
		u = await run(db, `update public.users set name = 'n2' where id = $1`, [A]);
		c = await calls(db);
		check(
			"transition fallback (only service_role_key in Vault): Bearer header",
			"1 call with Authorization Bearer, no x-webhook-secret",
			`${summarize(u)}; ${rowsJson(c)}`,
			u.ok &&
				c.rows.length === 1 &&
				c.rows[0].auth === "Bearer eyJ.legacy.SERVICE_ROLE" &&
				c.rows[0].secret === null &&
				c.rows[0].url === `${BASE}/create-brevo-contact`,
		);
		await admin(db, "truncate net.http_request_queue");
		// with edge_webhook_secret (and service_role_key still present)
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('edge_webhook_secret', 'whsec_test_123')`,
		);
		u = await U(
			db,
			A,
			`update public.users set name = 'Renamed by app_user' where id = $1 returning id`,
			[A],
			{ commit: true },
		);
		const sub = await run(
			db,
			`insert into public.subscriptions (subscription_id, subscription_status, price_id, customer_id) values ('sub_k', 'active', $1, 'ctm_b')`,
			[IDS.PRO],
		);
		c = await calls(db);
		check(
			"C10: with edge_webhook_secret: app_user rename (users trigger) and subscriptions insert (CRM + Discord triggers) send x-webhook-secret and NO Authorization header",
			"3 calls, each x-webhook-secret=whsec_test_123, has_auth=false",
			`${summarize(u)} | ${summarize(sub)} | ${rowsJson(c)}`,
			u.ok &&
				sub.ok &&
				c.rows.length === 3 &&
				c.rows.every(
					(r) => r.secret === "whsec_test_123" && r.has_auth === false,
				) &&
				eqSet(
					c.rows.map((r) => r.url.split("/").pop()),
					[
						"create-brevo-contact",
						"create-crm-contact",
						"discord-subscription-alert",
					],
				),
		);
		const q = await P(db, `select headers from net.http_request_queue`);
		check(
			"residual (documented): app roles can read the pg_net queue, which now holds the webhook secret instead of the service_role key",
			"readable (pg_net PUBLIC ACL, not fixable by a postgres migration)",
			q,
			q.ok && !JSON.stringify(q.rows).includes("SERVICE_ROLE"),
			{ severity: "info" },
		);
		await admin(db, "truncate net.http_request_queue");
		// cron
		const job = await admin(
			db,
			`select jobname, schedule, command, username from cron.job where jobname = 'Sync Plans'`,
		);
		check(
			"Sync Plans cron definition after M09",
			"one job, '0 8 */3 * *', owner postgres, command reads private.settings + edge_webhook_secret",
			job,
			job.ok &&
				job.rows.length === 1 &&
				job.rows[0].schedule === "0 8 */3 * *" &&
				job.rows[0].username === "postgres" &&
				/edge_webhook_secret/.test(job.rows[0].command) &&
				/private\.settings/.test(job.rows[0].command),
		);
		const jr = await run(db, job.rows[0].command);
		c = await calls(db);
		check(
			"Sync Plans command as postgres (job owner) with the secret",
			"1 call to .../sync-available-plans with x-webhook-secret, no Authorization",
			`${summarize(jr)}; ${rowsJson(c)}`,
			jr.ok &&
				c.rows.length === 1 &&
				c.rows[0].url === `${BASE}/sync-available-plans` &&
				c.rows[0].secret === "whsec_test_123" &&
				c.rows[0].has_auth === false,
		);
		await admin(db, "truncate net.http_request_queue");
		await admin(db, `delete from vault.secrets`);
		const jr2 = await run(db, job.rows[0].command);
		c = await calls(db);
		check(
			"Sync Plans command with neither secret nor key in Vault",
			"no request (trigger function skips in that case)",
			`${summarize(jr2)}; ${rowsJson(c)}`,
			jr2.ok && c.rows.length === 0,
			{ severity: "low" },
		);
		await admin(db, "truncate net.http_request_queue");
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('edge_webhook_secret', 'whsec_test_123')`,
		);
		// base url validation
		const bad = [];
		for (const v of [
			"https://uhfbapjuzvlyzyodxhqn.supabase.co/functions/v1/",
			"http://attacker.example/functions/v1",
			"https://abcdefghijklmnopqrst.supabase.co/functions/v1?x=",
			" https://abcdefghijklmnopqrst.supabase.co/functions/v1",
		]) {
			const w = await run(
				db,
				`update private.settings set value = $1 where key = 'edge_functions_base_url'`,
				[v],
			);
			bad.push(`${JSON.stringify(v)} -> ${w.ok ? "accepted" : w.code}`);
			await run(
				db,
				`update private.settings set value = $1 where key = 'edge_functions_base_url'`,
				[BASE],
			);
		}
		const good = await run(
			db,
			`update private.settings set value = $1 where key = 'edge_functions_base_url'`,
			["http://127.0.0.1:54321/functions/v1"],
		);
		await run(
			db,
			`update private.settings set value = $1 where key = 'edge_functions_base_url'`,
			[BASE],
		);
		check(
			"validation of the edge_functions_base_url setting: trailing slash, http/foreign host, query suffix, leading space are rejected; local stack URL accepted",
			"4 rejected (23514); local ok",
			`${bad.join(" | ")} | local -> ${good.ok ? "accepted" : good.code}`,
			bad.every((x) => /23514$/.test(x)) && good.ok,
			{ severity: "low" },
		);
		await db.close();
	}
	{
		// M09 applied on a project where M02 seeded nothing and Vault is empty (TEST): nothing breaks, cron job replaced not duplicated
		const db = await env.load(snaps.m08);
		await admin(
			db,
			`insert into vault.secrets (name, secret) values ('edge_webhook_secret', 'w')`,
		);
		const r = await applyTx(env, db, "M09");
		const jobs = await admin(
			db,
			`select count(*)::int n from cron.job where jobname = 'Sync Plans'`,
		);
		check(
			"M09 apply keeps exactly one 'Sync Plans' job (cron.schedule upsert by name)",
			"ok; 1 job",
			`${T(r)}; ${rowsJson(jobs)}`,
			r.ok && jobs.rows[0].n === 1,
		);
		await db.close();
	}
}
function eqSet(a, b) {
	return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
}
