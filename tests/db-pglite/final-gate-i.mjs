// Gate I: A.15 preflight and A.16 exposure audit (read-only) as postgres.
import {
	IDS,
	run,
	admin,
	splitSql,
	isErr,
	rowsJson,
	summarize,
	applyTx,
} from "./final-lib.mjs";

export async function gateI(ctx) {
	const { env, R, check, snaps, setGroup, S_base } = ctx;
	setGroup("I read-only scripts A.15 / A.16");
	for (const [label, dump] of [
		["PROD today (baseline, before M00)", S_base],
		["after M00", snaps.m00],
		["after M00-M10", snaps.m10],
		["after cutover (A.R1 + M11)", snaps.cut],
	]) {
		for (const key of ["A15", "A16"]) {
			if (!dump) continue;
			const db = await env.load(dump);
			const sts = splitSql(env.sql.text(key));
			const errs = [];
			const results = [];
			await db.exec("begin read only");
			for (const st of sts) {
				await db.exec("savepoint s");
				try {
					const r = await db.query(st.sql);
					results.push({
						line: st.line,
						rows: r.rows.length,
						sample: JSON.stringify(r.rows.slice(0, 3)).slice(0, 200),
					});
					await db.exec("release savepoint s");
				} catch (e) {
					errs.push(`line ${st.line}: ${e.code} ${e.message}`);
					await db.exec("rollback to savepoint s");
				}
			}
			await db.exec("rollback");
			check(
				`[${label}] ${key} parses and runs read-only as postgres`,
				`${sts.length} statements, 0 errors`,
				errs.length ? errs.join(" | ") : `${sts.length} ok`,
				errs.length === 0,
			);
			if (key === "A15") {
				const trig = results.find((x) => {
					const q = sts.find((s) => s.line === x.line)?.sql ?? "";
					return /tgname/.test(q) && /pg_trigger/.test(q) && !/count\(/.test(q);
				});
				const real = await admin(
					db,
					`select count(*)::int n from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where not t.tgisinternal and n.nspname = 'public'`,
				);
				check(
					`[${label}] A.15 trigger inventory query lists the public triggers (Brevo, CRM, Discord, touch/pin ...)`,
					`${real.rows[0].n} rows`,
					`query returned ${trig?.rows} rows: ${trig?.sample}`,
					trig && trig.rows === real.rows[0].n,
					{ severity: "low", finding: "a15-trigger-inventory" },
				);
			}
			await db.close();
		}
	}
}
