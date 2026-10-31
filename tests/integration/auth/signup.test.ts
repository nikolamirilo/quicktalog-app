import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * The M10 sign-up triggers against a real GoTrue. pgTAP already proves the
 * trigger bodies work on a hand-inserted row; this checks them against the
 * rows GoTrue actually writes.
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

/** One transaction set up the way `withUser` does it: `app_user` plus claims. */
function asUser<T>(userId: string, run: (tx: typeof sql) => Promise<T>) {
	return sql.begin(async (tx) => {
		await tx`select
			pg_catalog.set_config('role', 'app_user', true),
			pg_catalog.set_config('request.jwt.claims', ${JSON.stringify({
				sub: userId,
				role: "authenticated",
			})}, true)`;
		return run(tx as unknown as typeof sql);
	}) as Promise<T>;
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

	it("lets the gate record consent for a sign-up that accepted nothing", async (ctx) => {
		if (!signupsOpen) return;
		const [terms] = await sql<{ value: string }[]>`
			select value from private.settings where key = 'terms_version'`;
		if (!terms) {
			ctx.skip("private.settings.terms_version is not set on this stack");
		}

		// No `terms_version` in the metadata is what a Google sign-up looks like
		// to the trigger: it accepted nothing, and the gate is the second chance.
		const { data } = await track(
			await anon.auth.signUp({ email: address("gate"), password: PASSWORD }),
		);
		const userId = data.user?.id as string;
		await admin.auth.admin.updateUserById(userId, { email_confirm: true });

		const before = (await publicRow(userId))?.consents as Record<
			string,
			unknown
		>;
		expect(before["terms-and-conditions"]).toBe(false);
		expect(before.version).toBeUndefined();

		// A version that is not the current one is refused, so a terms change
		// mid-session cannot be recorded as something the user never saw.
		await expect(
			asUser(userId, (tx) => tx`select private.record_consents('1999-01-01')`),
		).rejects.toMatchObject({ code: "22023" });

		await asUser(
			userId,
			(tx) => tx`select private.record_consents(${terms.value})`,
		);

		const after = (await publicRow(userId))?.consents as Record<
			string,
			unknown
		>;
		expect(after["terms-and-conditions"]).toBe(true);
		expect(after["privacy-policy"]).toBe(true);
		expect(after["refund-policy"]).toBe(true);
		expect(after.version).toBe(terms.value);
		expect(after.accepted_at).toBeTruthy();
		expect(after.source).toBe("gate");
	});

	it("removes the public.users row when the account goes", async () => {
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
	});
});
