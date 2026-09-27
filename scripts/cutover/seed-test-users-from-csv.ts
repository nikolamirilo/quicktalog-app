/**
 * Recreates `public.users` on TEST from a Clerk CSV export, keyed by Clerk id.
 *
 * PROD never needs this — its rows have always been there. TEST lost its
 * Clerk-era rows during Phase 2 testing, and without them a re-key rehearsal
 * has nothing to re-key, so the whole drill proves nothing. This puts TEST back
 * into the shape PROD is in today.
 *
 * It creates **only** `public.users` (and optionally a catalogue each, so the
 * re-key's `ON UPDATE CASCADE` is genuinely exercised). The `auth.users` side is
 * `migrate-clerk-to-supabase.ts`'s job: it claims a uuid in
 * `migration.clerk_user_map` *before* creating the identity, which is the
 * ordering the M10 sign-up trigger depends on. Do not create auth users here.
 *
 *   DRY_RUN=1 npx tsx scripts/cutover/seed-test-users-from-csv.ts
 *   DRY_RUN=0 npx tsx scripts/cutover/seed-test-users-from-csv.ts --catalogues
 *
 * Env: `CLERK_CSV`, plus the usual `NEXT_PUBLIC_SUPABASE_URL` /
 * `MIGRATION_DATABASE_URL` the guard requires. No Clerk API key needed — names
 * come from the CSV.
 */

import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { fail, guard, maskEmail } from "../lib/guard";
import { config } from "./config";
import { loadCsv } from "./migrate-clerk-to-supabase";

export type SeedUser = { id: string; email: string; name: string };

/**
 * `loadCsv` validates the columns and strips the MFA secrets, but drops the
 * name fields, so those are read separately from the same file.
 */
export function readSeedUsers(path: string): SeedUser[] {
	const validated = loadCsv(path);
	const raw = parse(readFileSync(path), {
		bom: true,
		columns: true,
		skip_empty_lines: true,
		trim: true,
	}) as Record<string, string>[];

	const namesById = new Map(
		raw.map((row) => [
			row.id?.trim(),
			[row.first_name, row.last_name]
				.map((part) => (part ?? "").trim())
				.filter(Boolean)
				.join(" ")
				.slice(0, 200),
		]),
	);

	const seed: SeedUser[] = [];
	for (const user of validated) {
		// No address means nothing to key a user row on; the import would skip
		// them too.
		if (!user.primaryEmail) continue;
		seed.push({
			email: user.primaryEmail,
			id: user.id,
			name: namesById.get(user.id) || user.primaryEmail.split("@")[0],
		});
	}
	return seed;
}

async function main(): Promise<void> {
	const csvPath = config.clerkCsv;
	if (!csvPath) {
		throw new Error(
			"CLERK_CSV is not set (e.g. export CLERK_CSV=~/Downloads/users-test.csv)",
		);
	}
	const withCatalogues = process.argv.includes("--catalogues");

	const users = readSeedUsers(csvPath);

	const rail = await guard({
		details: [
			`csv          ${users.length} user(s) from ${csvPath}`,
			`catalogues   ${withCatalogues ? "one per user" : "none"}`,
		],
		intent:
			"recreate public.users on TEST from a Clerk export, keyed by Clerk id",
		needsAuthAdmin: false,
		// PROD's rows already exist. Inserting there would invent users.
		prodForbidden: true,
		script: "seed-test-users-from-csv",
		writes: true,
	});

	try {
		const [plan] = await rail.sql<{ id: string | null }[]>`
			select s.value as id from private.settings s where s.key = 'default_plan_id'`;
		if (!plan?.id) {
			throw new Error(
				"private.settings.default_plan_id is not set: apply M10 and set it first",
			);
		}
		const [planRow] = await rail.sql<{ id: string }[]>`
			select id from public.plans where id = ${plan.id}`;
		if (!planRow) {
			throw new Error(
				`default_plan_id ${plan.id} is not a row in public.plans`,
			);
		}

		const [existing] = await rail.sql<{ uuid_keyed: number }[]>`
			select count(*)::int as uuid_keyed from public.users
			 where id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'`;
		if (existing.uuid_keyed > 0) {
			// A re-key already ran, or Phase 2 sign-ups are still present. Mixing
			// Clerk-keyed seed rows into either makes the rehearsal meaningless.
			throw new Error(
				`${existing.uuid_keyed} uuid-keyed user(s) already exist: run purge-dark-test-users.ts first, or roll the re-key back`,
			);
		}

		console.log(`  plan         ${plan.id}`);
		console.log("");

		let inserted = 0;
		let skipped = 0;
		for (const user of users) {
			if (rail.dryRun) {
				console.log(`  would insert ${user.id}  ${maskEmail(user.email)}`);
				inserted++;
				continue;
			}
			const rows = await rail.sql<{ id: string }[]>`
				insert into public.users (id, email, name, plan_id)
				values (${user.id}, ${user.email}, ${user.name}, ${plan.id})
				on conflict (id) do nothing
				returning id`;
			if (rows.length === 0) {
				skipped++;
			} else {
				inserted++;
				if (withCatalogues) {
					await rail.sql`
						insert into public.catalogues (name, created_by, status, tags, footer, content)
						values (${`rehearsal-${user.id.slice(-8).toLowerCase()}`}, ${user.id},
						        'draft', '{}', '{}', '[]')`;
				}
			}
			console.log(`  ${user.id}  ${maskEmail(user.email)}`);
		}

		console.log("");
		console.log(
			`  ${rail.dryRun ? "would insert" : "inserted"} ${inserted}, already present ${skipped}`,
		);

		const [totals] = await rail.sql<{ users: number; catalogues: number }[]>`
			select (select count(*)::int from public.users where id like 'user\\_%') as users,
			       (select count(*)::int from public.catalogues) as catalogues`;
		console.log(
			`  public.users clerk-keyed: ${totals.users}, catalogues: ${totals.catalogues}`,
		);
		if (rail.dryRun) console.log("\n  dry run: nothing was written\n");
	} finally {
		await rail.close();
	}
}

if (process.argv[1]?.endsWith("seed-test-users-from-csv.ts")) {
	main().catch(fail);
}
