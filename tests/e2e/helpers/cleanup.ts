import { Redis } from "@upstash/redis";
import postgres from "postgres";

const PROD_PROJECT_REF = "uhfbapjuzvlyzyodxhqn";

/**
 * The database URL for test cleanup. Prefers the admin connection: cleanup
 * deletes rows it does not own, which the `app_rls` login cannot do after M08.
 * Refuses to touch the PROD project unless ALLOW_PROD=1 is set explicitly.
 */
function cleanupDatabaseUrl(): string | undefined {
	const url =
		process.env.DB_ADMIN_CONNECTION_STRING ?? process.env.DB_CONNECTION_STRING;
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
	if (
		(url?.includes(PROD_PROJECT_REF) ||
			supabaseUrl.includes(PROD_PROJECT_REF)) &&
		process.env.ALLOW_PROD !== "1"
	) {
		throw new Error(
			"E2E cleanup refuses to run against the PROD Supabase project.",
		);
	}
	return url;
}

/**
 * Removes a catalogue created during an E2E run from Postgres + Redis,
 * mirroring the app's own deleteItem server action. Self-contained (no
 * @quicktalog/common import) so it loads cleanly under Playwright's runner.
 */
export async function deleteCatalogueBySlug(slug: string): Promise<void> {
	if (!slug) return;

	const databaseUrl = cleanupDatabaseUrl();
	if (databaseUrl) {
		const sql = postgres(databaseUrl, { prepare: false });
		try {
			await sql`DELETE FROM catalogues WHERE name = ${slug}`;
		} finally {
			await sql.end({ timeout: 5 });
		}
	}

	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (url && token) {
		const redis = new Redis({ url, token });
		await redis.del(slug);
	}
}

/**
 * Removes every catalogue whose slug starts with `prefix`.
 *
 * Deleting by the slug the test captured is not enough on its own. The test
 * plan allows a single catalogue, so one run that dies between creating the
 * catalogue and learning its slug leaves the account full - and every run
 * after it gets the upgrade modal where it expected the create dialog, which
 * looks like a product bug rather than a dirty fixture. Sweeping by prefix
 * cleans up after a run that never got far enough to clean up after itself.
 *
 * Returns the slugs it removed, so a caller can say what it found.
 */
export async function deleteCataloguesByPrefix(
	prefix: string,
): Promise<string[]> {
	if (!prefix) return [];

	const databaseUrl = cleanupDatabaseUrl();
	if (!databaseUrl) return [];

	const sql = postgres(databaseUrl, { prepare: false });
	let slugs: string[] = [];
	try {
		const rows = await sql<{ name: string }[]>`
			DELETE FROM catalogues WHERE name LIKE ${`${prefix}%`} RETURNING name
		`;
		slugs = rows.map((row) => row.name);
	} finally {
		await sql.end({ timeout: 5 });
	}

	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (slugs.length > 0 && url && token) {
		const redis = new Redis({ url, token });
		await Promise.all(slugs.map((slug) => redis.del(slug)));
	}

	return slugs;
}
