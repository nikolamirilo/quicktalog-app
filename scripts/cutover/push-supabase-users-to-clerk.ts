/**
 * Rollback step 3 (plan 12.5, R1/R2): carry Supabase-only people back to Clerk.
 *
 * `rollback-remap.sql` re-keys `public.users` from uuids back to Clerk ids by
 * following `migration.clerk_user_map`. Anyone who signed up *during* the
 * cutover window has no row in that map — there was never a Clerk user to map
 * them to — so the re-key refuses to start until this script has created one
 * and written it into the map with `origin='rollback_push'`.
 *
 * It does four things, in this order:
 *
 *   1. **Push.** Every confirmed, unbanned `auth.users` row outside the map
 *      gets a Clerk user (`externalId` = the uuid) and a `migrated` map row.
 *      Their bcrypt digest is carried across, so their password still works.
 *   2. **Drop.** Unconfirmed or banned sign-ups are *not* pushed — an
 *      unconfirmed address is unproven, and pushing a banned account would
 *      quietly unban it. They are listed so the operator can email them.
 *   3. **Erase.** Anyone in `migration.auth_user_deletions` who has a Clerk id
 *      is deleted in Clerk. They asked for their account to be removed during
 *      the window; a rollback must not resurrect it.
 *   4. **Re-push passwords.** A user who changed their password while Supabase
 *      was live has a digest that no longer matches the one Clerk holds. Where
 *      the new digest is bcrypt it is pushed to Clerk, so the password they
 *      last chose is the one that works after the rollback.
 *
 * This runs during an incident, so it is built to be run twice: every step is
 * idempotent, a Clerk user is found by `externalId` before one is created, and
 * the final assertion is the exact precondition `rollback-remap.sql` checks.
 *
 * It never prints an email address or a digest. The addresses for step 2 are
 * pulled from the database with the query the report prints.
 */

import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
	fail,
	type Guard,
	guard,
	mapWithConcurrency,
	maskEmail,
	redact,
	would,
} from "../lib/guard";

/* -------------------------------------------------------------------------- */
/* Pure decisions (unit-tested)                                               */
/* -------------------------------------------------------------------------- */

/** GoTrue stores bcrypt; anything else cannot be handed to Clerk as a digest. */
export function bcryptDigest(encryptedPassword: string | null): string | null {
	if (!encryptedPassword) return null;
	return /^\$2[aby]?\$[0-9]{2}\$/.test(encryptedPassword)
		? encryptedPassword
		: null;
}

/** The same fingerprint the import records, so the two can be compared. */
export function fingerprint(digest: string): string {
	return createHash("sha256").update(digest, "utf8").digest("hex");
}

export type AuthUserRow = {
	id: string;
	email: string | null;
	email_confirmed_at: Date | null;
	banned_until: Date | null;
	deleted_at: Date | null;
	encrypted_password: string | null;
};

/**
 * `reason` is optional rather than a discriminated union: this project compiles
 * with `strict: false`, so narrowing on the boolean literal does not happen.
 */
export type PushDecision = {
	push: boolean;
	reason?: "no-email" | "unconfirmed" | "banned" | "deleted";
};

/**
 * Who may be carried back. An unconfirmed address is one nobody has proven
 * they control: creating a Clerk user for it would hand that account to
 * whoever typed the address.
 */
export function decidePush(row: AuthUserRow, now: Date): PushDecision {
	if (row.deleted_at) return { push: false, reason: "deleted" };
	if (!row.email) return { push: false, reason: "no-email" };
	if (!row.email_confirmed_at) return { push: false, reason: "unconfirmed" };
	if (row.banned_until && row.banned_until > now)
		return { push: false, reason: "banned" };
	return { push: true };
}

/* -------------------------------------------------------------------------- */
/* Reports                                                                    */
/* -------------------------------------------------------------------------- */

function csvCell(value: unknown): string {
	const text = value === null || value === undefined ? "" : String(value);
	return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function writeCsvFile(path: string, header: string[], rows: unknown[][]): void {
	const body = [header, ...rows]
		.map((row) => row.map(csvCell).join(","))
		.join("\n");
	writeFileSync(path, `${body}\n`, "utf8");
}

/* -------------------------------------------------------------------------- */
/* Clerk                                                                      */
/* -------------------------------------------------------------------------- */

type ClerkUser = { id: string; externalId?: string | null };
type ClerkClient = {
	users: {
		getUserList: (params: Record<string, unknown>) => Promise<{
			data: ClerkUser[];
			totalCount: number;
		}>;
		createUser: (params: Record<string, unknown>) => Promise<ClerkUser>;
		updateUser: (
			id: string,
			params: Record<string, unknown>,
		) => Promise<ClerkUser>;
		deleteUser: (id: string) => Promise<unknown>;
	};
};

async function clerkClient(secretKey: string): Promise<ClerkClient> {
	const { createClerkClient } = await import("@clerk/backend");
	return createClerkClient({ secretKey }) as unknown as ClerkClient;
}

/** Retries 429s the way the import does; anything else is the caller's problem. */
async function withRetry<T>(work: () => Promise<T>): Promise<T> {
	for (let attempt = 0; ; attempt++) {
		try {
			return await work();
		} catch (error) {
			const status = (error as { status?: number }).status;
			if (status !== 429 || attempt === 4) throw error;
			await new Promise((resolve) => setTimeout(resolve, 2000 * (attempt + 1)));
		}
	}
}

/** The Clerk user already carrying this uuid, if a previous run created one. */
async function findByExternalId(
	clerk: ClerkClient,
	uuid: string,
): Promise<ClerkUser | null> {
	const page = await withRetry(() =>
		clerk.users.getUserList({ externalId: [uuid], limit: 2 }),
	);
	if (page.data.length > 1) {
		throw new Error(`more than one Clerk user carries externalId ${uuid}`);
	}
	return page.data[0] ?? null;
}

/* -------------------------------------------------------------------------- */
/* Database                                                                   */
/* -------------------------------------------------------------------------- */

type Db = Guard["sql"];

async function assertPreconditions(db: Db): Promise<{ fingerprints: boolean }> {
	const [tables] = await db<
		{ map: boolean; deletions: boolean; fingerprints: boolean }[]
	>`
		select to_regclass('migration.clerk_user_map')      is not null as map,
		       to_regclass('migration.auth_user_deletions') is not null as deletions,
		       to_regclass('migration.t0_password_digests') is not null as fingerprints`;

	if (!tables.map) {
		throw new Error(
			"migration.clerk_user_map is missing: nothing was ever imported, so there is nothing to roll back",
		);
	}
	if (!tables.deletions) {
		throw new Error(
			"migration.auth_user_deletions is missing: M10 is not applied on this project",
		);
	}
	if (!tables.fingerprints) {
		console.log(
			"  note: migration.t0_password_digests is absent, so password drift cannot be detected (step 4 is skipped)",
		);
	}
	return { fingerprints: tables.fingerprints };
}

async function loadUnmapped(db: Db): Promise<AuthUserRow[]> {
	return db<AuthUserRow[]>`
		select a.id::text            as id,
		       a.email,
		       a.email_confirmed_at,
		       a.banned_until,
		       a.deleted_at,
		       a.encrypted_password
		  from auth.users a
		 where not exists (select 1 from migration.clerk_user_map m
		                    where m.supabase_user_id = a.id)
		 order by a.created_at`;
}

/* -------------------------------------------------------------------------- */
/* Steps                                                                      */
/* -------------------------------------------------------------------------- */

type Pushed = {
	uuid: string;
	clerkUserId: string;
	maskedEmail: string;
	passwordImported: boolean;
	reused: boolean;
};
type Dropped = { uuid: string; maskedEmail: string; reason: string };
type Failure = { uuid: string; step: string; detail: string };

async function pushUsers(
	rail: Guard,
	clerk: ClerkClient,
	rows: AuthUserRow[],
	concurrency: number,
): Promise<{ pushed: Pushed[]; failures: Failure[] }> {
	const pushed: Pushed[] = [];
	const failures: Failure[] = [];

	await mapWithConcurrency(rows, concurrency, async (row) => {
		const digest = bcryptDigest(row.encrypted_password);
		try {
			let user = await findByExternalId(clerk, row.id);
			const reused = user !== null;

			if (!user) {
				if (rail.dryRun) {
					pushed.push({
						clerkUserId: "(dry run)",
						maskedEmail: maskEmail(row.email),
						passwordImported: digest !== null,
						reused: false,
						uuid: row.id,
					});
					return;
				}
				user = await withRetry(() =>
					clerk.users.createUser({
						emailAddress: [row.email as string],
						externalId: row.id,
						...(digest
							? { passwordDigest: digest, passwordHasher: "bcrypt" }
							: { skipPasswordRequirement: true }),
					}),
				);
			}

			if (!rail.dryRun) {
				await rail.sql`
					insert into migration.clerk_user_map
						(clerk_user_id, supabase_user_id, origin, status, email, email_verified,
						 password_imported, password_hasher, updated_at)
					values (${user.id}, ${row.id}::uuid, 'rollback_push', 'migrated', ${row.email},
					        true, ${digest !== null}, ${digest ? "bcrypt" : null}, now())
					on conflict (clerk_user_id) do update
						set supabase_user_id  = excluded.supabase_user_id,
						    origin            = 'rollback_push',
						    status            = 'migrated',
						    email             = excluded.email,
						    email_verified    = true,
						    password_imported = excluded.password_imported,
						    password_hasher   = excluded.password_hasher,
						    updated_at        = now()`;
			}

			pushed.push({
				clerkUserId: user.id,
				maskedEmail: maskEmail(row.email),
				passwordImported: digest !== null,
				reused,
				uuid: row.id,
			});
		} catch (error) {
			failures.push({ detail: redact(error), step: "push", uuid: row.id });
		}
	});

	return { failures, pushed };
}

async function eraseDeleted(
	rail: Guard,
	clerk: ClerkClient,
	concurrency: number,
): Promise<{ erased: string[]; failures: Failure[] }> {
	const rows = await rail.sql<
		{ supabase_user_id: string; clerk_user_id: string }[]
	>`
		select d.supabase_user_id::text as supabase_user_id, d.clerk_user_id
		  from migration.auth_user_deletions d
		 where d.clerk_user_id is not null`;

	const erased: string[] = [];
	const failures: Failure[] = [];

	await mapWithConcurrency(rows, concurrency, async (row) => {
		try {
			if (!rail.dryRun) {
				await withRetry(() => clerk.users.deleteUser(row.clerk_user_id));
			}
			erased.push(row.clerk_user_id);
		} catch (error) {
			// Already gone is the state we want; a second run must not fail on it.
			if ((error as { status?: number }).status === 404) {
				erased.push(row.clerk_user_id);
				return;
			}
			failures.push({
				detail: redact(error),
				step: "erase",
				uuid: row.supabase_user_id,
			});
		}
	});

	return { erased, failures };
}

type Drift = {
	clerk_user_id: string;
	supabase_user_id: string;
	encrypted_password: string | null;
	digest_sha256: string | null;
};

async function repushPasswords(
	rail: Guard,
	clerk: ClerkClient,
	concurrency: number,
): Promise<{ updated: string[]; skipped: number; failures: Failure[] }> {
	// Imported users only: a rollback_push user was just created from the digest
	// this query would compare against.
	const rows = await rail.sql<Drift[]>`
		select m.clerk_user_id,
		       m.supabase_user_id::text as supabase_user_id,
		       a.encrypted_password,
		       d.digest_sha256
		  from migration.clerk_user_map m
		  join auth.users a on a.id = m.supabase_user_id
		  left join migration.t0_password_digests d on d.supabase_user_id = m.supabase_user_id
		 where m.status = 'migrated'
		   and m.origin = 'import'
		   and a.encrypted_password is not null`;

	const updated: string[] = [];
	const failures: Failure[] = [];
	let skipped = 0;

	const drifted = rows.filter((row) => {
		const digest = bcryptDigest(row.encrypted_password);
		if (!digest) {
			// A non-bcrypt digest cannot be pushed; the user resets in Clerk instead.
			if (row.digest_sha256 === null) return false;
			skipped++;
			return false;
		}
		return fingerprint(digest) !== row.digest_sha256;
	});

	await mapWithConcurrency(drifted, concurrency, async (row) => {
		const digest = bcryptDigest(row.encrypted_password) as string;
		try {
			if (!rail.dryRun) {
				await withRetry(() =>
					clerk.users.updateUser(row.clerk_user_id, {
						passwordDigest: digest,
						passwordHasher: "bcrypt",
					}),
				);
				await rail.sql`
					update migration.clerk_user_map
					   set password_imported = true, password_hasher = 'bcrypt', updated_at = now()
					 where clerk_user_id = ${row.clerk_user_id}`;
			}
			updated.push(row.clerk_user_id);
		} catch (error) {
			failures.push({
				detail: redact(error),
				step: "password",
				uuid: row.supabase_user_id,
			});
		}
	});

	return { failures, skipped, updated };
}

/**
 * The precondition `rollback-remap.sql` raises on, checked here so the operator
 * finds out now rather than from a failed transaction.
 */
async function assertRemapCanRun(db: Db): Promise<number> {
	const [row] = await db<{ blocking: number }[]>`
		select count(*)::int as blocking
		  from public.users u
		 where u.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
		   and not exists (select 1 from migration.clerk_user_map m
		                    where m.supabase_user_id::text = u.id and m.status = 'migrated')`;
	return row.blocking;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

async function main(): Promise<void> {
	const outDir = process.env.OUT_DIR ?? "";
	const concurrency = Math.max(1, Number(process.env.CONCURRENCY ?? 4) || 4);

	const rail = await guard({
		details: [
			`reports      ${outDir || "(none: set OUT_DIR to keep them)"}`,
			`concurrency  ${concurrency}`,
		],
		intent:
			"create Clerk users for Supabase-only accounts so the re-key can be rolled back",
		script: "push-supabase-users-to-clerk",
		writes: true,
	});

	try {
		await rail.assertSameInstance();

		const clerkKey = process.env.CLERK_SECRET_KEY;
		if (!clerkKey) throw new Error("CLERK_SECRET_KEY is not set");
		if (clerkKey.startsWith("sk_live_") && rail.environment !== "prod") {
			throw new Error(
				"a live Clerk key with a non-PROD Supabase project — refusing",
			);
		}
		if (clerkKey.startsWith("sk_test_") && rail.environment === "prod") {
			throw new Error(
				"a Clerk development key with the PROD Supabase project — refusing",
			);
		}

		const { fingerprints } = await assertPreconditions(rail.sql);
		const clerk = await clerkClient(clerkKey);

		const now = new Date();
		const unmapped = await loadUnmapped(rail.sql);
		const pushable: AuthUserRow[] = [];
		const dropped: Dropped[] = [];
		for (const row of unmapped) {
			const decision = decidePush(row, now);
			if (decision.push) pushable.push(row);
			else
				dropped.push({
					maskedEmail: maskEmail(row.email),
					reason: decision.reason ?? "unknown",
					uuid: row.id,
				});
		}

		console.log(
			`  ${unmapped.length} auth users outside the map: ${pushable.length} to push, ${dropped.length} dropped`,
		);

		console.log(`\n  1. ${would(rail.dryRun, "push to Clerk")}`);
		const push = await pushUsers(rail, clerk, pushable, concurrency);
		const reused = push.pushed.filter((entry) => entry.reused).length;
		console.log(
			`     ${push.pushed.length} pushed (${reused} already existed), ${push.pushed.filter((e) => e.passwordImported).length} with a password, ${push.failures.length} failed`,
		);

		console.log("\n  2. dropped (not pushed)");
		for (const entry of dropped) {
			console.log(`     ${entry.reason.padEnd(12)} ${entry.maskedEmail}`);
		}

		console.log(`\n  3. ${would(rail.dryRun, "erase in Clerk")}`);
		const erase = await eraseDeleted(rail, clerk, concurrency);
		console.log(
			`     ${erase.erased.length} deleted accounts kept deleted, ${erase.failures.length} failed`,
		);

		console.log(
			`\n  4. ${fingerprints ? would(rail.dryRun, "re-push changed passwords") : "password drift: skipped (no fingerprints)"}`,
		);
		const passwords = fingerprints
			? await repushPasswords(rail, clerk, concurrency)
			: { failures: [] as Failure[], skipped: 0, updated: [] as string[] };
		if (fingerprints) {
			console.log(
				`     ${passwords.updated.length} updated, ${passwords.skipped} left for a reset (digest not bcrypt), ${passwords.failures.length} failed`,
			);
		}

		const failures = [
			...push.failures,
			...erase.failures,
			...passwords.failures,
		];

		if (outDir) {
			mkdirSync(outDir, { recursive: true });
			const stamp = new Date().toISOString().replace(/[:.]/g, "-");
			writeCsvFile(
				join(outDir, `rollback-pushed.${stamp}.csv`),
				[
					"supabase_user_id",
					"clerk_user_id",
					"email",
					"password_imported",
					"already_existed",
				],
				push.pushed.map((entry) => [
					entry.uuid,
					entry.clerkUserId,
					entry.maskedEmail,
					entry.passwordImported,
					entry.reused,
				]),
			);
			writeCsvFile(
				join(outDir, `rollback-dropped.${stamp}.csv`),
				["supabase_user_id", "email", "reason"],
				dropped.map((entry) => [entry.uuid, entry.maskedEmail, entry.reason]),
			);
			writeCsvFile(
				join(outDir, `rollback-errors.${stamp}.csv`),
				["supabase_user_id", "step", "detail"],
				failures.map((entry) => [entry.uuid, entry.step, entry.detail]),
			);
			console.log(`\n  reports written to ${outDir}`);
		}

		if (dropped.length > 0) {
			console.log(
				"\n  the dropped users still need an email; their addresses are in the database, not in the report:",
			);
			console.log(
				"    select id, email from auth.users where id = any($1::uuid[]);  -- ids from rollback-dropped.csv",
			);
		}

		const blocking = await assertRemapCanRun(rail.sql);
		console.log(
			`\n  uuid-keyed public.users rows without a migrated map row: ${blocking}`,
		);
		if (rail.dryRun) {
			console.log(
				"  (dry run: this is the count rollback-remap.sql would still refuse on)",
			);
		}

		if (failures.length > 0) {
			for (const entry of failures) {
				console.error(`  ${entry.step} ${entry.uuid}: ${entry.detail}`);
			}
			throw new Error(`${failures.length} user(s) failed`);
		}
		if (!rail.dryRun && blocking > 0) {
			throw new Error(
				`${blocking} uuid-keyed user(s) still have no migrated map row — rollback-remap.sql will refuse to run`,
			);
		}

		console.log("\n  done: rollback-remap.sql can run\n");
	} finally {
		await rail.close();
	}
}

if (process.argv[1]?.endsWith("push-supabase-users-to-clerk.ts")) {
	main().catch(fail);
}
