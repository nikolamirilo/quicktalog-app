import * as Sentry from "@sentry/nextjs";
import { Redis } from "@upstash/redis";
export const redis = new Redis({
	url: process.env.UPSTASH_REDIS_REST_URL,
	token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

/**
 * Run a cache write that follows an already-committed DB mutation. A Redis
 * failure (misconfigured credentials, network) must not make the caller report
 * the mutation as failed or skip revalidation - the row is already gone/updated.
 */
export async function syncCache(op: () => Promise<unknown>): Promise<boolean> {
	try {
		await op();
		return true;
	} catch (err) {
		Sentry.captureException(err);
		console.error("Redis cache sync failed:", err);
		return false;
	}
}
