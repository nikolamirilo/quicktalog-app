/**
 * Deletes the Phase 2 "dark build" test users from a TEST project before the
 * dress rehearsal (PLAN 5.6, and the R1 precondition that refuses to run while
 * `auth.users` holds anyone outside `migration.clerk_user_map`).
 *
 *   DRY_RUN=1 npx tsx scripts/cutover/purge-dark-test-users.ts
 *   DRY_RUN=0 npx tsx scripts/cutover/purge-dark-test-users.ts
 *
 * Candidates are auth users that are **not** in the map: during Phase 2 they
 * can only have come from the dark build's own sign-up tests. Everything in the
 * map is an imported Clerk identity and is never touched.
 *
 * This script can never run against PROD. `ALLOW_PROD=1` does not unlock it,
 * because on PROD the same query selects real people who signed up during the
 * window — those are handled by the rollback push (12.5 step 3), not by a
 * delete.
 *
 * Deleting an auth user cascades: the M10 delete trigger removes the
 * `public.users` row, and the foreign keys remove that user's catalogues,
 * analytics, newsletter subscribers, OCR jobs, prompts and themes. There is no
 * undo.
 */

import { fail, guard, maskEmail, redact } from "../lib/guard";

/** Nothing above this many deletions runs without a deliberate raise. */
const DEFAULT_MAX_DELETIONS = 50;

type Candidate = { id: string; email: string | null; createdAt: string | null };

function keepList(name: string): Set<string> {
	return new Set(
		(process.env[name] ?? "")
			.split(",")
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean),
	);
}

async function main(): Promise<void> {
	const keepIds = keepList("KEEP_USER_IDS");
	const keepEmails = keepList("KEEP_EMAILS");
	const maxDeletions = Number(
		process.env.MAX_DELETIONS ?? DEFAULT_MAX_DELETIONS,
	);

	const rail = await guard({
		details: [
			`keep         ${keepIds.size} id(s), ${keepEmails.size} email(s)`,
			`cap          ${maxDeletions} deletions (MAX_DELETIONS)`,
		],
		intent: "delete dark-build test users that are not in the Clerk map",
		prodForbidden: true,
		script: "purge-dark-test-users",
		writes: true,
	});

	try {
		await rail.assertSameInstance();

		const [map] = await rail.sql<{ present: boolean }[]>`
			select to_regclass('migration.clerk_user_map') is not null as present`;
		if (!map.present) {
			throw new Error(
				"migration.clerk_user_map is missing: without it every auth user would look like a test user",
			);
		}

		const mapped = await rail.sql<{ supabase_user_id: string }[]>`
			select supabase_user_id::text from migration.clerk_user_map`;
		const mappedIds = new Set(mapped.map((row) => row.supabase_user_id));
		console.log(`  ${mappedIds.size} mapped identities are protected`);

		// The Auth API is the source of truth for who exists; auth.users is read
		// afterwards only to show what a deletion would take with it.
		const candidates: Candidate[] = [];
		for (let page = 1; ; page++) {
			const { data, error } = await rail.auth.listUsers({
				page,
				perPage: 1000,
			});
			if (error) throw new Error(redact(error));
			for (const user of data.users) {
				if (mappedIds.has(user.id)) continue;
				if (keepIds.has(user.id.toLowerCase())) continue;
				if (user.email && keepEmails.has(user.email.toLowerCase())) continue;
				candidates.push({
					createdAt: user.created_at ?? null,
					email: user.email ?? null,
					id: user.id,
				});
			}
			if (data.users.length < 1000) break;
		}

		if (candidates.length === 0) {
			console.log("  nothing to purge: every auth user is in the map or kept");
			return;
		}

		const footprint = await rail.sql<
			{
				id: string;
				catalogues: number;
				analytics: number;
				newsletter: number;
				themes: number;
			}[]
		>`
			select u.id,
			       (select count(*)::int from public.catalogues  c where c.created_by = u.id) as catalogues,
			       (select count(*)::int from public.analytics   a where a.user_id    = u.id) as analytics,
			       (select count(*)::int from public.newsletter  n where n.owner_id   = u.id) as newsletter,
			       (select count(*)::int from public.user_themes t where t.user_id    = u.id) as themes
			  from public.users u
			 where u.id = any(${candidates.map((candidate) => candidate.id)}::text[])`;
		const footprintById = new Map(footprint.map((row) => [row.id, row]));

		console.log("");
		console.log(`  ${candidates.length} auth user(s) outside the map:`);
		for (const candidate of candidates) {
			const owned = footprintById.get(candidate.id);
			const carries = owned
				? `catalogues=${owned.catalogues} analytics=${owned.analytics} newsletter=${owned.newsletter} themes=${owned.themes}`
				: "no public.users row";
			console.log(
				`    ${rail.dryRun ? "would delete" : "deleting   "} ${candidate.id}  ${maskEmail(candidate.email)}  ${carries}`,
			);
		}
		console.log("");

		if (candidates.length > maxDeletions) {
			throw new Error(
				`${candidates.length} candidates is over the cap of ${maxDeletions}: check the list, then re-run with MAX_DELETIONS set deliberately`,
			);
		}

		if (rail.dryRun) {
			console.log(
				"  DRY RUN: nothing was deleted. Re-run with DRY_RUN=0 to apply.",
			);
			return;
		}

		let deleted = 0;
		const failures: string[] = [];
		for (const candidate of candidates) {
			const { error } = await rail.auth.deleteUser(candidate.id);
			if (error) {
				failures.push(`${candidate.id}: ${redact(error)}`);
				continue;
			}
			deleted++;
		}

		// The M10 delete trigger should have taken the public row with it.
		const leftovers = await rail.sql<{ id: string }[]>`
			select id from public.users
			 where id = any(${candidates.map((candidate) => candidate.id)}::text[])`;

		console.log(`  deleted ${deleted} of ${candidates.length} auth user(s)`);
		if (leftovers.length > 0) {
			console.log(
				`  WARNING: ${leftovers.length} public.users row(s) survived the delete — the M10 delete trigger is not doing its job`,
			);
			for (const row of leftovers) console.log(`    ${row.id}`);
		}
		for (const failure of failures) console.log(`  FAILED ${failure}`);
		if (failures.length > 0 || leftovers.length > 0) process.exitCode = 1;
	} finally {
		await rail.close();
	}
}

main().catch(fail);
