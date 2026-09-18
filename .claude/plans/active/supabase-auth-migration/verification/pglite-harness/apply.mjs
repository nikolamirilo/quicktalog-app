// Applies rls.sql (original or patched) section by section and records every error.
import fs from "node:fs";
import { PGlite as PGlite17 } from "pglite17";
import { PGlite as PGlite18 } from "@electric-sql/pglite";
import { Db, parseSections, errInfo } from "./lib.mjs";
import { buildBase } from "./base.mjs";

export async function applySectionStatementMode(db, section) {
	const errors = [];
	await db.as("postgres");
	for (const st of section.statements) {
		try {
			await db.exec(st.sql);
		} catch (e) {
			errors.push({
				section: section.name,
				line: st.line,
				statement: st.body.slice(0, 400),
				...errInfo(e),
			});
			// leave a failed explicit transaction so later statements are not all 25P02
			try {
				await db.exec("rollback");
			} catch {}
		}
	}
	try {
		await db.exec("reset all");
	} catch {}
	return errors;
}

// Emulates `supabase migration up`: one transaction per migration file.
export async function applySectionTxMode(db, section) {
	await db.as("postgres");
	try {
		await db.exec("begin");
		for (const st of section.statements) {
			try {
				await db.exec(st.sql);
			} catch (e) {
				await db.exec("rollback");
				await db.exec("reset all");
				return {
					ok: false,
					section: section.name,
					line: st.line,
					statement: st.body.slice(0, 400),
					...errInfo(e),
				};
			}
		}
		await db.exec("commit");
		await db.exec("reset all");
		return { ok: true };
	} catch (e) {
		return { ok: false, section: section.name, ...errInfo(e) };
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	const file = process.argv[2];
	const pgVersion = process.argv[3] ?? "17";
	const PGlite = pgVersion === "18" ? PGlite18 : PGlite17;
	const sections = parseSections(fs.readFileSync(file, "utf8"));
	const report = { file, pgVersion };
	const db = await buildBase(PGlite, report);
	console.log(
		JSON.stringify(
			{
				stripped: report.appMigrationStripped.length,
				appErrors: report.appMigrationErrors,
			},
			null,
			2,
		),
	);
	const base = await db.dump();
	// statement mode on one DB (01..08 only; RUNBOOK/09/10 need the cutover fixture)
	const all = [];
	for (const s of sections.filter(
		(s) => s.kind === "MIGRATION" && s.name < "09",
	)) {
		const errs = await applySectionStatementMode(db, s);
		all.push(...errs);
	}
	console.log("STATEMENT MODE ERRORS", JSON.stringify(all, null, 2));
	// tx mode on a fresh copy
	const db2 = await Db.create(PGlite, { dump: base });
	const txr = [];
	for (const s of sections.filter(
		(s) => s.kind === "MIGRATION" && s.name < "09",
	)) {
		txr.push({ name: s.name, ...(await applySectionTxMode(db2, s)) });
	}
	console.log("TX MODE", JSON.stringify(txr, null, 2));
	console.log("NOTICES", JSON.stringify(db2.notices.slice(0, 20), null, 2));
}
