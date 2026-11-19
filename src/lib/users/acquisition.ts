import "server-only";
import * as Sentry from "@sentry/nextjs";
import { sql } from "drizzle-orm";
import { cookies } from "next/headers";
import {
	FIRST_TOUCH_COOKIE,
	type FirstTouch,
} from "@/lib/analytics/first-touch";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";

/** Referring domains that name a channel. Longest suffix wins, so `lnkd.in` is linkedin. */
const REFERRER_CHANNELS: [RegExp, string][] = [
	[/(^|\.)google\.[a-z.]+$/, "google"],
	[/(^|\.)bing\.com$/, "bing"],
	[/(^|\.)duckduckgo\.com$/, "duckduckgo"],
	[/(^|\.)linkedin\.com$|^lnkd\.in$/, "linkedin"],
	[/(^|\.)producthunt\.com$/, "producthunt"],
	[
		/(^|\.)chatgpt\.com$|(^|\.)perplexity\.ai$|(^|\.)gemini\.google\.com$|(^|\.)claude\.ai$/,
		"ai_search",
	],
	[/^t\.co$|(^|\.)x\.com$|(^|\.)twitter\.com$/, "x"],
	[/(^|\.)facebook\.com$|(^|\.)instagram\.com$/, "meta"],
	[/(^|\.)youtube\.com$|^youtu\.be$/, "youtube"],
	[/(^|\.)reddit\.com$/, "reddit"],
];

/** Our own host: a visit from a published catalogue is the footer badge doing its job. */
const OWN_HOST = /(^|\.)quicktalog\.app$/;

/**
 * The channel a signup is counted under, in the action plan's order: a UTM tag wins,
 * then the referring domain, then a referral from one of our own catalogue pages, then
 * direct.
 */
export function deriveChannel(touch: FirstTouch): string {
	const tagged = touch.utm_source?.trim().toLowerCase();
	if (tagged) return tagged.slice(0, 120);

	const domain = touch.referrer_domain?.trim().toLowerCase();
	if (domain) {
		for (const [pattern, channel] of REFERRER_CHANNELS) {
			if (pattern.test(domain)) return channel;
		}
		if (OWN_HOST.test(domain)) return "catalogue_badge";
		return "referral";
	}

	return "direct";
}

/** The first touch the browser recorded, or null. Values are bounded on the way in. */
export function parseFirstTouch(raw: string | undefined): FirstTouch | null {
	if (!raw) return null;
	try {
		const parsed = JSON.parse(raw) as Record<string, unknown>;
		if (typeof parsed !== "object" || parsed === null) return null;
		const pick = (key: string, max: number) => {
			const value = parsed[key];
			return typeof value === "string" && value.trim()
				? value.trim().slice(0, max)
				: undefined;
		};
		const seen = pick("first_seen_at", 40);
		return {
			utm_source: pick("utm_source", 120),
			utm_medium: pick("utm_medium", 120),
			utm_campaign: pick("utm_campaign", 200),
			utm_content: pick("utm_content", 200),
			utm_term: pick("utm_term", 200),
			referrer_domain: pick("referrer_domain", 253),
			landing_path: pick("landing_path", 512),
			first_seen_at:
				seen && !Number.isNaN(Date.parse(seen))
					? seen
					: new Date().toISOString(),
		};
	} catch {
		return null;
	}
}

/**
 * Stores where this account came from, once.
 *
 * `first_seen_at is null` is what makes it once: a second sign-in, or a second tab
 * finishing the same sign-up, cannot overwrite the first touch. The self-reported
 * answer lives in its own column and is never touched here.
 */
export async function recordFirstTouch(
	me: VerifiedIdentity,
	touch: FirstTouch,
): Promise<boolean> {
	const channel = deriveChannel(touch);
	try {
		// Raw SQL until the next `drizzle-kit pull` release puts these columns on
		// `schema.users`; every value is a bound parameter, and RLS still applies.
		const rows = await withUser(me, (tx) =>
			tx.execute<{ id: string }>(sql`
				update public.users
				   set utm_source      = ${touch.utm_source ?? null},
				       utm_medium      = ${touch.utm_medium ?? null},
				       utm_campaign    = ${touch.utm_campaign ?? null},
				       utm_content     = ${touch.utm_content ?? null},
				       utm_term        = ${touch.utm_term ?? null},
				       referrer_domain = ${touch.referrer_domain ?? null},
				       landing_path    = ${touch.landing_path ?? null},
				       first_seen_at   = ${touch.first_seen_at ?? null}::timestamptz,
				       acquisition_source = coalesce(acquisition_source, ${channel})
				 where id = ${me.userId}
				   and first_seen_at is null
				returning id`),
		);
		return [...rows].length > 0;
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { op: "recordFirstTouch" },
		});
		return false;
	}
}

/**
 * Reads the first-touch cookie and stores it against the signed-in user. Called from
 * the two paths a new account comes through: the Google callback and the email
 * confirmation. A database trigger could not do this - it never sees a cookie.
 *
 * Returns true when the cookie has done its job and the caller should clear it; the
 * caller does that, because a route handler clears it on the response it is building.
 */
export async function claimFirstTouch(me: VerifiedIdentity): Promise<boolean> {
	const jar = await cookies();
	const touch = parseFirstTouch(jar.get(FIRST_TOUCH_COOKIE)?.value);
	if (!touch) return false;

	await recordFirstTouch(me, touch);
	// True whatever the update did: a second attempt writes nothing either way, and
	// keeping the cookie means carrying the landing URL around for another 90 days.
	return true;
}
