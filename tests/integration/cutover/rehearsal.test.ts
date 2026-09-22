import { execFileSync } from "node:child_process";
import postgres from "postgres";
import { beforeAll, describe, expect, it } from "vitest";
import {
	FIXTURES,
	ORPHAN,
	REHEARSAL_PASSWORD,
	writeFixtureFiles,
} from "./fixtures";

/**
 * Plan 3.1: the fixture rehearsal.
 *
 * Runs the real cutover scripts - the import, `remap-user-ids.sql`,
 * `verify.sql` and `rollback-remap.sql` - against a real Postgres and a real
 * GoTrue, in runbook order, then rolls back and does it again. The point isn't
 * that the SQL parses (the PGlite suite proves that) but that the import
 * script and GoTrue agree: a pre-claimed map row stops the sign-up trigger, an
 * imported digest still lets someone sign in, and the re-key refuses while a
 * paying user is unmapped.
 *
 * **It rewrites every user in the database it is pointed at.** It refuses
 * anything that isn't a local stack, and only runs with `REHEARSAL=1` set.
 *
 *   supabase start
 *   sed -i '' 's/^enable_signup = true/enable_signup = false/' supabase/config.toml
 *   supabase stop && supabase start        # GoTrue reads the flag at boot
 *   REHEARSAL=1 \
 *   DB_CONNECTION_STRING=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SECRET_KEY=<the local service key from `supabase status`> \
 *   npm run test:integration
 *
 * Sign-ups have to be off because the import refuses to run while they are on:
 * between claiming an email and creating the identity, a real person could take
 * it.
 */

const dbUrl = process.env.DB_CONNECTION_STRING;
const authUrl =
	process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const secretKey = process.env.SUPABASE_SECRET_KEY;
const apiKey =
	process.env.SUPABASE_PUBLISHABLE_KEY ??
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
	secretKey;

function isLocal(url: string | undefined): boolean {
	if (!url) return false;
	try {
		const host = new URL(url).hostname;
		return host === "127.0.0.1" || host === "localhost" || host === "::1";
	} catch {
		return false;
	}
}

const enabled =
	process.env.REHEARSAL === "1" &&
	isLocal(dbUrl) &&
	isLocal(authUrl) &&
	Boolean(secretKey);

const sql = enabled
	? postgres(dbUrl as string, { prepare: false, max: 4, idle_timeout: 10 })
	: (null as unknown as ReturnType<typeof postgres>);

const exportedAt = new Date();
const files = enabled ? writeFixtureFiles(exportedAt) : null;

/* -------------------------------------------------------------------------- */
/* Running the real scripts                                                   */
/* -------------------------------------------------------------------------- */

type Run = { status: number; output: string };

function runScript(args: string[], extraEnv: Record<string, string>): Run {
	try {
		const output = execFileSync("npx", ["tsx", ...args], {
			encoding: "utf8",
			env: {
				...process.env,
				CONFIRM_REF: "local",
				MIGRATION_DATABASE_URL: dbUrl,
				...extraEnv,
			},
			stdio: "pipe",
		});
		return { output, status: 0 };
	} catch (error) {
		const failure = error as {
			status?: number;
			stdout?: string;
			stderr?: string;
		};
		return {
			output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
			status: failure.status ?? 1,
		};
	}
}

function runImport(dryRun: boolean): Run {
	return runScript(
		[
			"scripts/cutover/migrate-clerk-to-supabase.ts",
			"--fixture",
			files?.fixturePath as string,
			"--out",
			`${files?.dir}/reports`,
		],
		{
			CLERK_CSV: files?.csvPath as string,
			DRY_RUN: dryRun ? "1" : "0",
			EXPORTED_AT: exportedAt.toISOString(),
			OUT_DIR: `${files?.dir}/reports`,
		},
	);
}

let psqlAvailable = false;

function runPsql(file: string, variables: string[] = []): Run {
	const args = ["-v", "ON_ERROR_STOP=1"];
	for (const variable of variables) args.push("-v", variable);
	try {
		const output = execFileSync(
			"psql",
			[dbUrl as string, ...args, "-A", "-F", "|", "-f", file],
			{ encoding: "utf8", stdio: "pipe" },
		);
		return { output, status: 0 };
	} catch (error) {
		const failure = error as {
			status?: number;
			stdout?: string;
			stderr?: string;
		};
		return {
			output: `${failure.stdout ?? ""}${failure.stderr ?? ""}`,
			status: failure.status ?? 1,
		};
	}
}

/* -------------------------------------------------------------------------- */
/* Fixture state                                                              */
/* -------------------------------------------------------------------------- */

async function resetAndSeed(): Promise<void> {
	// Deleting the auth user is what the M10 delete trigger watches, so this
	// also clears public.users and everything cascading from it.
	await sql`delete from auth.users`;
	await sql`delete from public.users`;
	await sql`alter table public.users drop constraint if exists users_id_is_uuid`;
	await sql`truncate table migration.clerk_user_map`;
	await sql`truncate table migration.auth_user_deletions`;
	await sql`drop table if exists migration.pre_remap_counts`;
	await sql`drop table if exists migration.t0_password_digests`;

	const [plan] = await sql<{ id: string }[]>`
		select s.value as id from private.settings s where s.key = 'default_plan_id'`;
	await sql`
		insert into public.plans (id, name) values (${plan.id}, 'Rehearsal')
		on conflict (id) do nothing`;

	const seeded = [
		...FIXTURES.filter((fixture) => fixture.ownsRow).map((fixture) => ({
			catalogues: fixture.catalogues,
			customerId: fixture.customerId,
			email: fixture.email,
			id: fixture.id,
		})),
		{
			catalogues: ORPHAN.catalogues,
			customerId: ORPHAN.customerId,
			email: ORPHAN.email,
			id: ORPHAN.id,
		},
	];

	for (const user of seeded) {
		await sql`
			insert into public.users (id, email, name, plan_id, customer_id)
			values (${user.id}, ${user.email}, 'Test Person', ${plan.id}, ${user.customerId})`;
		for (let index = 0; index < user.catalogues; index++) {
			await sql`
				insert into public.catalogues (name, created_by, status, tags, footer, content)
				values (${`${user.id.slice(-8)}-${index}`.toLowerCase()}, ${user.id},
				        'draft', '{}', '{}', '[]')`;
		}
	}
}

async function mapRow(clerkUserId: string) {
	const [row] = await sql<
		{
			status: string;
			origin: string;
			password_imported: boolean;
			supabase_user_id: string | null;
		}[]
	>`
		select status, origin, password_imported, supabase_user_id::text as supabase_user_id
		  from migration.clerk_user_map where clerk_user_id = ${clerkUserId}`;
	return row ?? null;
}

async function authUserFor(clerkUserId: string) {
	const [row] = await sql<
		{
			id: string;
			email: string;
			encrypted_password: string | null;
			banned_until: Date | null;
			email_confirmed_at: Date | null;
		}[]
	>`
		select a.id::text as id, a.email, a.encrypted_password, a.banned_until,
		       a.email_confirmed_at
		  from migration.clerk_user_map m
		  join auth.users a on a.id = m.supabase_user_id
		 where m.clerk_user_id = ${clerkUserId}`;
	return row ?? null;
}

/** Clerk-keyed rows that will still be Clerk-keyed after the re-key. */
async function expectedOrphans(): Promise<number> {
	const [row] = await sql<{ count: number }[]>`
		select count(*)::int as count from public.users u
		 where u.id like 'user\\_%'
		   and not exists (select 1 from migration.clerk_user_map m
		                    where m.clerk_user_id = u.id and m.status = 'migrated')`;
	return row.count;
}

function verifyFailures(output: string): string[] {
	return output
		.split("\n")
		.filter((line) => line.split("|").length >= 5 && line.endsWith("|f"));
}

/* -------------------------------------------------------------------------- */
/* The rehearsal                                                              */
/* -------------------------------------------------------------------------- */

describe.skipIf(!enabled)("cutover rehearsal against local fixtures", () => {
	let orphanCount = 0;

	beforeAll(async () => {
		expect(isLocal(dbUrl), "the rehearsal rewrites every user").toBe(true);
		try {
			execFileSync("psql", ["--version"], { stdio: "pipe" });
			psqlAvailable = true;
		} catch {
			psqlAvailable = false;
		}
		await resetAndSeed();
	});

	it("changes nothing on a dry run", async () => {
		const run = runImport(true);
		expect(run.output).toContain("DRY RUN");
		const [row] = await sql<{ count: number }[]>`
			select count(*)::int as count from migration.clerk_user_map`;
		expect(row.count).toBe(0);
	});

	it("refuses to finish while a paying user is left unmapped", () => {
		// The orphan carries a customer_id and has no Clerk user to import from,
		// so it can never be re-keyed and can never be updated afterwards.
		const run = runImport(false);
		expect(run.status).not.toBe(0);
		expect(run.output).toMatch(/customer_id|paying|unmapped/i);
	});

	it("imports every fixture once the orphan has been triaged", async () => {
		await sql`update public.users set customer_id = null where id = ${ORPHAN.id}`;
		const run = runImport(false);
		expect(run.output).not.toMatch(/FAILED/);
		expect(run.status).toBe(0);

		const happy = await mapRow(FIXTURES[0].id);
		expect(happy?.status).toBe("migrated");
		expect(happy?.origin).toBe("import");
		expect(happy?.password_imported).toBe(true);
	});

	it("does not import a password it cannot carry across", async () => {
		const scrypt = FIXTURES.find((f) => f.hasher === "scrypt");
		const mfa = FIXTURES.find((f) => f.mfa);
		const google = FIXTURES.find((f) => f.googleSub);

		expect((await mapRow(scrypt?.id as string))?.password_imported).toBe(false);
		// MFA: importing the password without the second factor would weaken the
		// account, so the user resets instead.
		expect((await mapRow(mfa?.id as string))?.password_imported).toBe(false);
		expect((await authUserFor(google?.id as string))?.encrypted_password).toBe(
			null,
		);
	});

	it("skips an unverified address on an account that owns data", async () => {
		const unverified = FIXTURES.find((f) => !f.verified);
		const row = await mapRow(unverified?.id as string);
		expect(row?.status).toBe("skipped");
		expect(await authUserFor(unverified?.id as string)).toBe(null);
	});

	it("keeps a banned user banned", async () => {
		const banned = FIXTURES.find((f) => f.banned);
		const user = await authUserFor(banned?.id as string);
		expect(user?.banned_until).not.toBe(null);
	});

	it("gives an imported user exactly one public.users row", async () => {
		// The map claim is written before the identity is created precisely so the
		// M10 sign-up trigger skips it. If that ordering ever breaks, the imported
		// user gets a second, empty row and loses everything they own.
		const [row] = await sql<{ count: number }[]>`
			select count(*)::int as count from public.users u
			  join migration.clerk_user_map m on m.supabase_user_id::text = u.id`;
		expect(row.count).toBe(0);

		const [duplicates] = await sql<{ count: number }[]>`
			select count(*)::int as count from (
			  select lower(email) from public.users where email is not null
			   group by 1 having count(*) > 1) d`;
		expect(duplicates.count).toBe(0);
	});

	it("re-keys public.users to uuids", async () => {
		if (!psqlAvailable) {
			console.warn("Skipping: psql is not on PATH.");
			return;
		}
		orphanCount = await expectedOrphans();

		const run = runPsql("scripts/cutover/remap-user-ids.sql");
		expect(run.output).not.toMatch(/ERROR/);
		expect(run.status).toBe(0);

		const [row] = await sql<{ clerk: number; uuid: number }[]>`
			select count(*) filter (where id like 'user\\_%')::int as clerk,
			       count(*) filter (where id ~ '^[0-9a-f]{8}-')::int as uuid
			  from public.users`;
		expect(row.clerk).toBe(orphanCount);
		expect(row.uuid).toBeGreaterThan(0);
	});

	it("carries every catalogue across with its owner", async () => {
		const [row] = await sql<{ orphaned: number }[]>`
			select count(*)::int as orphaned from public.catalogues c
			 where not exists (select 1 from public.users u where u.id = c.created_by)`;
		expect(row.orphaned).toBe(0);
	});

	it("passes verify.sql", () => {
		if (!psqlAvailable) {
			console.warn("Skipping: psql is not on PATH.");
			return;
		}
		const run = runPsql("scripts/cutover/verify.sql", [
			`accepted_orphans=${orphanCount}`,
		]);
		expect(run.status).toBe(0);
		expect(verifyFailures(run.output)).toEqual([]);
	});

	it("lets an imported user sign in with the password they already had", async () => {
		const happy = FIXTURES[0];
		const response = await fetch(
			`${authUrl}/auth/v1/token?grant_type=password`,
			{
				body: JSON.stringify({
					email: happy.email,
					password: REHEARSAL_PASSWORD,
				}),
				headers: {
					"Content-Type": "application/json",
					apikey: apiKey as string,
				},
				method: "POST",
			},
		);
		const body = (await response.json()) as { access_token?: string };
		expect(response.status, JSON.stringify(body)).toBe(200);
		expect(body.access_token).toBeTruthy();
	});

	it("refuses to roll back while somebody signed up during the window", async () => {
		if (!psqlAvailable) {
			console.warn("Skipping: psql is not on PATH.");
			return;
		}
		// A sign-up during the window has a uuid and no map row. In a real
		// rollback push-supabase-users-to-clerk.ts gives it a Clerk id; here the
		// refusal itself is what is being tested.
		const [newcomer] = await sql<{ id: string }[]>`
			insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at,
			                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
			values (gen_random_uuid(), '00000000-0000-0000-0000-000000000000', 'authenticated',
			        'authenticated', 'window-signup@rehearsal.test', now(),
			        '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
			returning id::text as id`;

		const refused = runPsql("scripts/cutover/rollback-remap.sql");
		expect(refused.status).not.toBe(0);
		expect(refused.output).toMatch(/push-supabase-users-to-clerk/);

		await sql`delete from auth.users where id = ${newcomer.id}::uuid`;
	});

	it("rolls the re-key back to Clerk ids", async () => {
		if (!psqlAvailable) {
			console.warn("Skipping: psql is not on PATH.");
			return;
		}
		const run = runPsql("scripts/cutover/rollback-remap.sql");
		expect(run.output).not.toMatch(/ERROR/);
		expect(run.status).toBe(0);

		const [row] = await sql<{ uuid: number }[]>`
			select count(*) filter (where id ~ '^[0-9a-f]{8}-')::int as uuid
			  from public.users`;
		expect(row.uuid).toBe(0);
	});

	it("re-keys again after the rollback", async () => {
		if (!psqlAvailable) {
			console.warn("Skipping: psql is not on PATH.");
			return;
		}
		const run = runPsql("scripts/cutover/remap-user-ids.sql");
		expect(run.output).not.toMatch(/ERROR/);
		expect(run.status).toBe(0);

		const [row] = await sql<{ clerk: number }[]>`
			select count(*) filter (where id like 'user\\_%')::int as clerk
			  from public.users`;
		expect(row.clerk).toBe(orphanCount);
	});
});
