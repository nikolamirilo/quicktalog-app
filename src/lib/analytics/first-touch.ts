/**
 * The first touch: where a visitor arrived from, recorded on their very first page and
 * never overwritten.
 *
 * It is written by the browser rather than by middleware on purpose. The middleware
 * returns public pages with no `Set-Cookie` so the CDN can cache them for everyone; a
 * cookie set there would make the landing page uncacheable. A first-party cookie
 * written here is not blocked by the ad blockers that hide PostHog for part of the
 * traffic, which is the gap this fills.
 */

import { COOKIE_KEY } from "@/constants";

export const FIRST_TOUCH_COOKIE = "qt_ft";

/** First touch means first touch: 90 days, and never rewritten while it is there. */
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

export type FirstTouch = {
	utm_source?: string;
	utm_medium?: string;
	utm_campaign?: string;
	utm_content?: string;
	utm_term?: string;
	referrer_domain?: string;
	landing_path?: string;
	first_seen_at?: string;
};

const UTM_KEYS = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_content",
	"utm_term",
] as const;

/** Values ride in a cookie and end up in the database; both ends are bounded. */
const clamp = (value: string, max: number) => value.trim().slice(0, max);

/** The registrable host of a referrer, or undefined for our own pages and junk. */
export function referrerDomain(
	referrer: string,
	ownHost: string,
): string | undefined {
	if (!referrer) return undefined;
	try {
		const host = new URL(referrer).hostname.replace(/^www\./, "");
		if (!host || host === ownHost.replace(/^www\./, "")) return undefined;
		return clamp(host, 253);
	} catch {
		return undefined;
	}
}

/** What this visit says about where the visitor came from. */
export function readFirstTouch(
	search: string,
	referrer: string,
	pathname: string,
	ownHost: string,
	now: Date = new Date(),
): FirstTouch {
	const params = new URLSearchParams(search);
	const out: FirstTouch = {
		landing_path: clamp(pathname || "/", 512),
		first_seen_at: now.toISOString(),
	};
	for (const key of UTM_KEYS) {
		const value = params.get(key);
		if (value?.trim()) out[key] = clamp(value, 200);
	}
	const domain = referrerDomain(referrer, ownHost);
	if (domain) out.referrer_domain = domain;
	return out;
}

const readCookie = (name: string): string | null => {
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
};

/** Whether the visitor has turned analytics cookies down; unanswered is not a no. */
function analyticsDeclined(): boolean {
	try {
		const raw = window.localStorage.getItem(COOKIE_KEY);
		if (!raw) return false;
		const prefs = JSON.parse(raw) as {
			accepted?: boolean;
			analytics?: boolean;
		};
		return prefs.accepted === true && prefs.analytics === false;
	} catch {
		return false;
	}
}

/**
 * Records the first touch once, on the visitor's first page.
 *
 * With analytics cookies declined it is kept in `sessionStorage` instead, and only
 * promoted to a cookie at the moment of signing up - so it travels with that one
 * request and is not stored on the device.
 */
export function recordFirstTouch(): void {
	if (typeof window === "undefined") return;
	try {
		if (readCookie(FIRST_TOUCH_COOKIE)) return;

		const existing = window.sessionStorage.getItem(FIRST_TOUCH_COOKIE);
		const value =
			existing ??
			JSON.stringify(
				readFirstTouch(
					window.location.search,
					document.referrer,
					window.location.pathname,
					window.location.hostname,
				),
			);

		if (analyticsDeclined()) {
			window.sessionStorage.setItem(FIRST_TOUCH_COOKIE, value);
			return;
		}
		writeCookie(value, MAX_AGE_SECONDS);
	} catch {
		// Blocked storage: attribution is not worth an error on the landing page.
	}
}

function writeCookie(value: string, maxAge: number): void {
	const secure = window.location.protocol === "https:" ? "; Secure" : "";
	document.cookie = `${FIRST_TOUCH_COOKIE}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
}

/**
 * Called on the auth page: a first touch kept out of cookies by a declined consent is
 * put into a session cookie, so it reaches the server with the sign-up and nothing
 * else. The server clears it as soon as it has stored it.
 */
export function attachFirstTouchForSignup(): void {
	if (typeof window === "undefined") return;
	try {
		if (readCookie(FIRST_TOUCH_COOKIE)) return;
		const held = window.sessionStorage.getItem(FIRST_TOUCH_COOKIE);
		if (!held) return;
		// No Max-Age: it lives for this browser session only.
		const secure = window.location.protocol === "https:" ? "; Secure" : "";
		document.cookie = `${FIRST_TOUCH_COOKIE}=${encodeURIComponent(held)}; Path=/; SameSite=Lax${secure}`;
	} catch {
		// As above.
	}
}
