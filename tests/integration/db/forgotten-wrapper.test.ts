import postgres from "postgres";
import { describe, expect, it } from "vitest";

/**
 * The point of M08: the login role the app uses for user traffic owns nothing.
 * A query that forgets `withUser`/`withPublic` must be refused by the database
 * rather than quietly returning every tenant's rows.
 *
 * Run against whatever `DB_CONNECTION_STRING` points at (the local stack in CI,
 * TEST when pointed at it). Before M08 that is still the `postgres` login, so
 * the assertions are skipped with a message instead of failing: the migration
 * is what turns them on.
 */

/**
 * Prefer a connection that is actually the `app_rls` login. CI points
 * `DB_CONNECTION_STRING` at `postgres` because the other integration tests read
 * `auth`, `migration` and `private` — so without this the assertions below
 * skipped themselves on every run and M08's guarantee was never checked
 * anywhere.
 */
const url =
	process.env.DB_RLS_CONNECTION_STRING || process.env.DB_CONNECTION_STRING;
const PROD_REF = "uhfbapjuzvlyzyodxhqn";

const sqlClient = () =>
	postgres(url as string, { prepare: false, max: 1, idle_timeout: 5 });

async function loginRole(): Promise<string> {
	const sql = sqlClient();
	try {
		const [row] = await sql<{ me: string }[]>`select current_user as me`;
		return row.me;
	} finally {
		await sql.end({ timeout: 5 });
	}
}

describe.skipIf(!url)("the login role cannot read data on its own", () => {
	it("refuses to touch PROD", () => {
		// A destructive test against production data would be a very expensive
		// mistake; this test only reads, but the guard belongs here anyway.
		expect(url?.includes(PROD_REF) && process.env.ALLOW_PROD !== "1").toBe(
			false,
		);
	});

	it("is refused (42501) when selecting outside the wrapper", async () => {
		const role = await loginRole();
		if (role !== "app_rls") {
			console.warn(
				`Skipping: connected as "${role}", so M08 has not been applied here yet.`,
			);
			return;
		}

		const sql = sqlClient();
		try {
			await expect(
				sql`select id from public.catalogues limit 1`,
			).rejects.toHaveProperty("code", "42501");
		} finally {
			await sql.end({ timeout: 5 });
		}
	});

	it("still works inside the wrapper's role switch", async () => {
		const role = await loginRole();
		if (role !== "app_rls") return;

		const sql = sqlClient();
		try {
			// The same statement the wrapper issues, minus the app's plumbing.
			const rows = await sql.begin(async (tx) => {
				await tx`select
					pg_catalog.set_config('role', 'app_public', true),
					pg_catalog.set_config('request.jwt.claims', '{"role":"app_public"}', true),
					pg_catalog.set_config('search_path', 'public, pg_temp', true)`;
				return tx`select id from public.catalogues limit 1`;
			});
			expect(Array.isArray(rows)).toBe(true);
		} finally {
			await sql.end({ timeout: 5 });
		}
	});
});
