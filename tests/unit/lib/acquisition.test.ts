import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/utils/db", () => ({ withUser: vi.fn() }));

import { readFirstTouch, referrerDomain } from "@/lib/analytics/first-touch";
import { deriveChannel, parseFirstTouch } from "@/lib/users/acquisition";

/**
 * `users.acquisition_source` was null for 2,180 of 2,200 accounts. The channel now
 * comes from the first touch, so the mapping decides what every acquisition report
 * says.
 */
describe("deriveChannel", () => {
	it("prefers the UTM tag over everything else", () => {
		expect(
			deriveChannel({
				utm_source: "linkedin",
				referrer_domain: "google.com",
			}),
		).toBe("linkedin");
	});

	it("lowercases and bounds a tag, so one channel is not two", () => {
		expect(deriveChannel({ utm_source: "  LinkedIn " })).toBe("linkedin");
	});

	it.each([
		["google.com", "google"],
		["google.co.uk", "google"],
		["www.google.de", "google"],
		["linkedin.com", "linkedin"],
		["lnkd.in", "linkedin"],
		["producthunt.com", "producthunt"],
		["chatgpt.com", "ai_search"],
		["perplexity.ai", "ai_search"],
		["t.co", "x"],
		["x.com", "x"],
		["instagram.com", "meta"],
		["facebook.com", "meta"],
	])("maps %s to %s", (domain, channel) => {
		expect(deriveChannel({ referrer_domain: domain })).toBe(channel);
	});

	it("counts a visit from a published catalogue as the footer badge", () => {
		expect(deriveChannel({ referrer_domain: "www.quicktalog.app" })).toBe(
			"catalogue_badge",
		);
	});

	it("keeps an unknown referrer as a referral, not as direct", () => {
		expect(deriveChannel({ referrer_domain: "somebodysblog.example" })).toBe(
			"referral",
		);
	});

	it("is direct with neither a tag nor a referrer", () => {
		expect(deriveChannel({})).toBe("direct");
	});
});

describe("readFirstTouch", () => {
	it("takes the UTM tags and the landing path from the first page", () => {
		const touch = readFirstTouch(
			"?utm_source=producthunt&utm_medium=launch&utm_campaign=ph_2026",
			"",
			"/pricing",
			"www.quicktalog.app",
			new Date("2026-11-19T10:00:00.000Z"),
		);
		expect(touch).toMatchObject({
			utm_source: "producthunt",
			utm_medium: "launch",
			utm_campaign: "ph_2026",
			landing_path: "/pricing",
			first_seen_at: "2026-11-19T10:00:00.000Z",
		});
		expect(touch.referrer_domain).toBeUndefined();
	});

	it("records the referring domain when there is no tag", () => {
		expect(
			readFirstTouch(
				"",
				"https://www.google.com/search?q=menu",
				"/",
				"www.quicktalog.app",
			).referrer_domain,
		).toBe("google.com");
	});

	it("ignores a referrer from our own site", () => {
		expect(
			referrerDomain(
				"https://www.quicktalog.app/pricing",
				"www.quicktalog.app",
			),
		).toBeUndefined();
	});

	it("ignores a referrer that is not a URL", () => {
		expect(
			referrerDomain("android-app://", "www.quicktalog.app"),
		).toBeUndefined();
	});
});

describe("parseFirstTouch", () => {
	it("bounds every field, because the values come from a URL", () => {
		const long = "x".repeat(400);
		const parsed = parseFirstTouch(
			JSON.stringify({ utm_source: long, landing_path: long }),
		);
		expect(parsed?.utm_source).toHaveLength(120);
		expect(parsed?.landing_path).toHaveLength(400);
	});

	it("drops a cookie that is not an object", () => {
		expect(parseFirstTouch("not json")).toBeNull();
		expect(parseFirstTouch(undefined)).toBeNull();
	});

	it("replaces an unusable timestamp rather than storing it", () => {
		const parsed = parseFirstTouch(
			JSON.stringify({ utm_source: "x", first_seen_at: "whenever" }),
		);
		expect(Number.isNaN(Date.parse(parsed?.first_seen_at ?? ""))).toBe(false);
	});
});
