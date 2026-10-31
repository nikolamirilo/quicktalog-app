import "server-only";
import { getRedis } from "@/utils/redis";
import * as Sentry from "@sentry/nextjs";

/**
 * A search that ran and matched nothing is not the same as one that could not
 * run. Collapsing the two is what told the agent "no results" while Unsplash
 * was answering "Rate Limit Exceeded", so it retried with new words and burned
 * the rest of the hour's quota.
 */
export type StockPhotoResult =
	| { status: "found"; url: string }
	| { status: "none" }
	| { status: "unavailable"; reason: string };

/** The same query returns the same photo, so a hit never costs quota again. */
const FOUND_TTL_SECONDS = 60 * 60 * 24 * 30;
/** Shorter: a word that matches nothing today may match once Unsplash grows. */
const NONE_TTL_SECONDS = 60 * 60 * 24;
/** Stored where a URL would be, so one GET answers both outcomes. */
const NONE_MARKER = "none";

const REQUEST_TIMEOUT_MS = 4000;

const RATE_LIMITED =
	"The stock photo service is rate limited right now, so no photo search can run.";
const UNREACHABLE = "The stock photo service could not be reached.";

const cacheKey = (query: string) =>
	`${process.env.REDIS_KEY_PREFIX ?? "dev"}:stock-photo:${query.toLowerCase()}`;

/** Never lets the cache break a lookup: a Redis failure just means a live search. */
async function cached(query: string): Promise<StockPhotoResult | null> {
	try {
		const hit = await getRedis().get<string>(cacheKey(query));
		if (!hit) return null;
		return hit === NONE_MARKER
			? { status: "none" }
			: { status: "found", url: hit };
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "stockPhotoCache" },
		});
		return null;
	}
}

async function remember(query: string, url: string | null): Promise<void> {
	try {
		await getRedis().set(cacheKey(query), url ?? NONE_MARKER, {
			ex: url ? FOUND_TTL_SECONDS : NONE_TTL_SECONDS,
		});
	} catch {
		// A photo that cannot be cached is still a photo; the next search pays again.
	}
}

/**
 * One stock photo for a plain-English query. Reads the shared cache first, so a
 * query any catalogue has already searched costs no quota.
 */
export async function findStockPhoto(query: string): Promise<StockPhotoResult> {
	const hit = await cached(query);
	if (hit) return hit;

	const key = process.env.UNSPLASH_API_KEY;
	if (!key) {
		return { status: "unavailable", reason: "Photo search is not configured." };
	}

	let res: Response;
	try {
		res = await fetch(
			`https://api.unsplash.com/search/photos?page=1&per_page=1&query=${encodeURIComponent(query)}`,
			{
				headers: { Authorization: `Client-ID ${key}` },
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			},
		);
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "findStockPhoto" },
		});
		return { status: "unavailable", reason: UNREACHABLE };
	}

	// Unsplash answers an exhausted quota with 403 and a plain-text body.
	if (res.status === 403 || res.status === 429) {
		return { status: "unavailable", reason: RATE_LIMITED };
	}
	if (!res.ok) {
		return { status: "unavailable", reason: UNREACHABLE };
	}

	let url: string | undefined;
	try {
		const data = (await res.json()) as {
			results?: { urls?: { regular?: string } }[];
		};
		url = data.results?.[0]?.urls?.regular;
	} catch {
		// A 200 that is not JSON is the service misbehaving, not an empty search.
		return { status: "unavailable", reason: UNREACHABLE };
	}

	await remember(query, url ?? null);
	return url ? { status: "found", url } : { status: "none" };
}
