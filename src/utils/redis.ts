import * as Sentry from "@sentry/nextjs";
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;

export function getRedis(): Redis {
	if (!_redis) {
		const url = process.env.UPSTASH_REDIS_REST_URL;
		const token = process.env.UPSTASH_REDIS_REST_TOKEN;
		if (!url || !token) {
			throw new Error(
				"UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured to use the Redis cache.",
			);
		}
		_redis = new Redis({ url, token });
	}
	return _redis;
}

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
