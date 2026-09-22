import "server-only";
import * as Sentry from "@sentry/nextjs";
import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "@/utils/redis";

type Window = `${number} ${"s" | "m" | "h"}`;

const RULES = {
	upload: { requests: 30, window: "1 h" },
	catalogueName: { requests: 60, window: "1 m" },
	newsletter: { requests: 5, window: "1 h" },
	contact: { requests: 5, window: "1 h" },
	confirm: { requests: 20, window: "10 m" }, // auth email links, keyed by IP
	profile: { requests: 5, window: "1 h" }, // renames fire the CRM sync trigger
} satisfies Record<string, { requests: number; window: Window }>;

export type RateLimitRule = keyof typeof RULES;

const limiters = new Map<RateLimitRule, Ratelimit>();

function limiterFor(rule: RateLimitRule): Ratelimit {
	let limiter = limiters.get(rule);
	if (!limiter) {
		const { requests, window } = RULES[rule];
		const prefix = process.env.REDIS_KEY_PREFIX ?? "dev";
		limiter = new Ratelimit({
			redis: getRedis(),
			limiter: Ratelimit.slidingWindow(requests, window),
			prefix: `${prefix}:rl:${rule}`,
		});
		limiters.set(rule, limiter);
	}
	return limiter;
}

/**
 * True when `key` (a user id or IP) is still within `rule`. A Redis outage is
 * reported to Sentry and, by default, lets the request through so an outage
 * cannot take the product down. Pass `failOpen: false` where the limit is the
 * only protection, such as an unauthenticated form that sends mail.
 */
export async function withinRateLimit(
	rule: RateLimitRule,
	key: string,
	{ failOpen = true }: { failOpen?: boolean } = {},
): Promise<boolean> {
	try {
		const { success } = await limiterFor(rule).limit(key);
		return success;
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "rateLimit", rule } });
		return failOpen;
	}
}
