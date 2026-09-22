import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The M10 sign-up triggers against a real GoTrue. pgTAP already proves the
 * trigger bodies work on a hand-inserted row; what it can't prove is how
 * GoTrue actually writes those rows - and that's the interesting bug:
 * `admin.createUser` sets `app_metadata` in a *second* UPDATE, so a trigger
 * that only looked at `app_metadata` would fire on the INSERT and give every
 * imported user a second, empty `public.users` row, losing everything they
 * own at the re-key. PATCH P5 consults `migration.clerk_user_map` instead,
 * and this is where that's checked against the real thing.
 *
 * Creates and deletes only its own users, but still refuses anything that
 * isn't a local stack.
 *
 *   supabase start
 *   DB_CONNECTION_STRING=postgresql://postgres:postgres@127.0.0.1:54322/postgres \
 *   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
 *   SUPABASE_SECRET_KEY=<service key from `supabase status`> \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key> \
 *   npm run test:integration
 */

const dbUrl = process.env.DB_CONNECTION_STRING;
const authUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const anonKey =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
	process.env.SUPABASE_PUBLISHABLE_KEY;

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
	isLocal(dbUrl) && isLocal(authUrl) && Boolean(secretKey) && Boolean(anonKey);

const sql = enabled
	? postgres(dbUrl as string, { prepare: false, max: 4, idle_timeout: 10 })
	: (null as unknown as ReturnType<typeof postgres>);

const admin = enabled
	? createClient(authUrl as string, secretKey as string, {
			auth: { autoRefreshToken: false, persistSession: false },
		})
	: (null as unknown as ReturnType<typeof createClient>);

const anon = enabled
	? createClient(authUrl as string, anonKey as string, {
			auth: { autoRefreshToken: false, persistSession: false },
		})
	: (null as unknown as ReturnType<typeof createClient>);

const created: string[] = [];
const PASSWORD = "SignupTest!12345";
const address = (label: string) =>
	`signup-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@integration.test`;

async function publicRow(userId: string) {
	const [row] = await sql<
		{ id: string; email: string; plan_id: string; consents: unknown }[]
	>`select id, email, plan_id, consents from public.users where id = ${userId}`;
	return row ?? null;
}

async function track<T extends { data: { user?: { id?: string } | null } }>(
	result: T,
): Promise<T> {
	const id = result.data?.user?.id;
	if (id) created.push(id);
	return result;
}

describe.skipIf(!enabled)("sign-up against a real GoTrue", () => {
	let signupsOpen = true;

	beforeAll(async () => {
		expect(isLocal(dbUrl)).toBe(true);
		const response = await fetch(`${authUrl}/auth/v1/settings`, {
			headers: { apikey: anonKey as string },
		});
		const settings = (await response.json()) as { disable_signup?: boolean };
		signupsOpen = settings.disable_signup !== true;
	});

	afterAll(async () => {
		for (const id of created) {
			await admin.auth.admin.deleteUser(id).catch(() => {});
		}
		await sql`delete from migration.clerk_user_map where clerk_user_id like 'user_2signuptest%'`;
		await sql.end({ timeout: 5 });
	});

	it("creates no public.users row until the address is confirmed", async () => {
		if (!signupsOpen) {
			console.warn("Skipping: sign-ups are disabled on this stack.");
			return;
		}
		const email = address("unconfirmed");
		const { data, error } = await track(
			await anon.auth.signUp({ email, password: PASSWORD }),
		);
		expect(error).toBe(null);
		const userId = data.user?.id as string;
		expect(userId).toBeTruthy();

		// The row must not exist yet: an unconfirmed address is one nobody has
		// proven they control.
		expect(await publicRow(userId)).toBe(null);

		await admin.auth.admin.updateUserById(userId, { email_confirm: true });

		const row = await publicRow(userId);
		expect(row).not.toBe(null);
		expect(row?.email).toBe(email.toLowerCase());
	});

	it("gives a new user the default plan and unaccepted consents", async () => {
		if (!signupsOpen) return;
		const email = address("consents");
		const { data } = await track(
			await anon.auth.signUp({ email, password: PASSWORD }),
		);
		const userId = data.user?.id as string;
		await admin.auth.admin.updateUserById(userId, { email_confirm: true });

		const row = await publicRow(userId);
		const [setting] = await sql<{ value: string }[]>`
			select value from private.settings where key = 'default_plan_id'`;
		expect(row?.plan_id).toBe(setting.value);

		const consents = row?.consents as Record<string, unknown>;
		expect(consents.source).toBe("signup");
		// Nobody agreed to anything by signing up; the gate asks separately.
		expect(consents["terms-and-conditions"]).toBe(false);
	});

	it("records consent when the form sends the current terms version", async (ctx) => {
		if (!signupsOpen) return;
		const [terms] = await sql<{ value: string }[]>`
			select value from private.settings where key = 'terms_version'`;
		if (!terms) {
			// Reported as skipped rather than passed: a green tick for a test that
			// never ran is how a gap stays invisible.
			ctx.skip("private.settings.terms_version is not set on this stack");
		}

		const email = address("terms");
		const { data } = await track(
			await anon.auth.signUp({
				email,
				options: { data: { terms_version: terms.value } },
				password: PASSWORD,
			}),
		);
		const userId = data.user?.id as string;
		await admin.auth.admin.updateUserById(userId, { email_confirm: true });

		const consents = (await publicRow(userId))?.consents as Record<
			string,
			unknown
		>;
		expect(consents["terms-and-conditions"]).toBe(true);
		expect(consents.version).toBe(terms.value);
		expect(consents.accepted_at).toBeTruthy();
	});

	it("creates no row for an identity that is already claimed in the map", async () => {
		// This is the import's central invariant. GoTrue writes app_metadata in a
		// later UPDATE than the INSERT the trigger fires on, so the claim in
		// migration.clerk_user_map is the only thing that can stop it in time.
		const email = address("claimed");
		const uuid = crypto.randomUUID();
		const clerkId = `user_2signuptest${Date.now()}`;

		await sql`
			insert into migration.clerk_user_map (clerk_user_id, supabase_user_id, status, email)
			values (${clerkId}, ${uuid}::uuid, 'claimed', ${email})`;

		const { data, error } = await track(
			await admin.auth.admin.createUser({
				email,
				email_confirm: true,
				// `id`, not `user_id`: GoTrue silently ignores an unknown field and
				// allocates its own uuid, which is what this test caught the first
				// time it ran. `migrate-clerk-to-supabase.ts` uses `id` too, and it
				// has to — a generated uuid would not match the claimed map row and
				// the imported user would get a second, empty public.users row.
				id: uuid,
				password: PASSWORD,
			}),
		);
		expect(error).toBe(null);
		expect(data.user?.id).toBe(uuid);

		expect(await publicRow(uuid)).toBe(null);
	});

	it("removes the public.users row and logs the deletion when the account goes", async () => {
		const email = address("deleted");
		const { data } = await track(
			await admin.auth.admin.createUser({
				email,
				email_confirm: true,
				password: PASSWORD,
			}),
		);
		const userId = data.user?.id as string;
		expect(await publicRow(userId)).not.toBe(null);

		await admin.auth.admin.deleteUser(userId);

		expect(await publicRow(userId)).toBe(null);
		const [logged] = await sql<{ supabase_user_id: string }[]>`
			select supabase_user_id::text as supabase_user_id
			  from migration.auth_user_deletions where supabase_user_id = ${userId}::uuid`;
		// The log is what lets a rollback delete the matching Clerk user.
		expect(logged?.supabase_user_id).toBe(userId);
	});
});
