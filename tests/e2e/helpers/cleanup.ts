import { Redis } from "@upstash/redis";
import postgres from "postgres";

/**
 * Removes a catalogue created during an E2E run from Postgres + Redis,
 * mirroring the app's own deleteItem server action. Self-contained (no
 * @quicktalog/common import) so it loads cleanly under Playwright's runner.
 */
export async function deleteCatalogueBySlug(slug: string): Promise<void> {
	if (!slug) return;

	const databaseUrl = process.env.DATABASE_URL;
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
