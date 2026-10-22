import type { Metadata } from "@quicktalog/common";
import {
	dropInvalidTrackingIds,
	GA_DATA_LAYER,
	hasTrackingIds,
	isValidTrackingId,
	QT_FRAME_PARAM,
	stripTrackingIds,
	TRACKING_VENDOR_KEYS,
	TRACKING_VENDORS,
	trackingIdError,
	trackingScript,
	validTrackingIds,
	withQtFrame,
} from "@/lib/catalogue/tracking-providers";
import { describe, expect, it } from "vitest";

/**
 * The setting's safety rests on one claim: nothing an owner types ever reaches
 * the page as code. These tests pin both halves - the id is validated, and the
 * id is the only thing interpolated into the vendor's template.
 */

const VALID = {
	googleAnalytics: "G-ABC1234567",
	metaPixel: "1234567890123456",
} as const;

const meta = (extra: Partial<Metadata> = {}): Metadata => ({
	title: "",
	description: "",
	icon: "",
	...extra,
});

describe("isValidTrackingId", () => {
	it("accepts a well-formed id for both vendors", () => {
		for (const vendor of TRACKING_VENDOR_KEYS) {
			expect(isValidTrackingId(vendor, VALID[vendor])).toBe(true);
		}
	});

	it("accepts an id with surrounding whitespace", () => {
		expect(isValidTrackingId("googleAnalytics", "  G-ABC1234567 ")).toBe(true);
	});

	it("rejects the other vendor's id", () => {
		expect(isValidTrackingId("googleAnalytics", VALID.metaPixel)).toBe(false);
		expect(isValidTrackingId("metaPixel", VALID.googleAnalytics)).toBe(false);
	});

	it("rejects a GTM container, which is never supported", () => {
		for (const vendor of TRACKING_VENDOR_KEYS) {
			expect(isValidTrackingId(vendor, "GTM-ABC1234")).toBe(false);
		}
	});

	it("rejects anything that could break out of the template", () => {
		const attacks = [
			"G-ABC1234567'; alert(1); //",
			"G-ABC1234567</script><script>alert(1)</script>",
			'G-ABC1234567", "x',
			"G-ABC1234567\n+alert(1)",
			"<img src=x onerror=alert(1)>",
			"1234567890123456'+document.cookie+'",
		];
		for (const attack of attacks) {
			for (const vendor of TRACKING_VENDOR_KEYS) {
				expect(isValidTrackingId(vendor, attack)).toBe(false);
			}
		}
	});

	it("rejects empty, missing and non-string ids", () => {
		expect(isValidTrackingId("googleAnalytics", "")).toBe(false);
		expect(isValidTrackingId("googleAnalytics", undefined)).toBe(false);
		expect(isValidTrackingId("googleAnalytics", 12345)).toBe(false);
	});
});

describe("trackingIdError", () => {
	it("treats an empty field as no error, since clearing removes the tag", () => {
		expect(trackingIdError("googleAnalytics", "")).toBeNull();
		expect(trackingIdError("googleAnalytics", "   ")).toBeNull();
	});

	it("returns null for a valid id", () => {
		expect(
			trackingIdError("googleAnalytics", VALID.googleAnalytics),
		).toBeNull();
		expect(trackingIdError("metaPixel", VALID.metaPixel)).toBeNull();
	});

	it("names Tag Manager specifically, since owners will try it", () => {
		const message = trackingIdError("googleAnalytics", "GTM-ABC1234");
		expect(message).toMatch(/Tag Manager/);
	});

	it("recognises the common wrong Google ids", () => {
		expect(trackingIdError("googleAnalytics", "GT-ABC1234")).toMatch(
			/Google tag ID/,
		);
		expect(trackingIdError("googleAnalytics", "AW-123456789")).toMatch(
			/Google Ads/,
		);
		expect(trackingIdError("googleAnalytics", "UA-12345-1")).toMatch(
			/Universal Analytics/,
		);
	});

	it("points a pixel id at the right field and back", () => {
		expect(trackingIdError("googleAnalytics", VALID.metaPixel)).toMatch(
			/Meta Pixel field/,
		);
		expect(trackingIdError("metaPixel", VALID.googleAnalytics)).toMatch(
			/Google Analytics field/,
		);
	});

	it("falls back to a format hint for junk", () => {
		expect(trackingIdError("googleAnalytics", "hello")).toMatch(
			/doesn't look like/,
		);
	});
});

describe("validTrackingIds", () => {
	it("returns only the ids that are loadable", () => {
		const ids = validTrackingIds(
			meta({
				googleAnalyticsId: VALID.googleAnalytics,
				metaPixelId: "not-a-pixel",
			}),
		);
		expect(ids).toEqual({ googleAnalytics: VALID.googleAnalytics });
	});

	it("trims what it returns", () => {
		const ids = validTrackingIds(meta({ googleAnalyticsId: " G-ABC1234567 " }));
		expect(ids.googleAnalytics).toBe("G-ABC1234567");
	});

	it("is empty for missing, empty or junk metadata", () => {
		expect(validTrackingIds(undefined)).toEqual({});
		expect(validTrackingIds(null)).toEqual({});
		expect(validTrackingIds(meta())).toEqual({});
		expect(
			validTrackingIds(meta({ googleAnalyticsId: "GTM-ABC1234" })),
		).toEqual({});
	});

	it("drives hasTrackingIds", () => {
		expect(hasTrackingIds(meta())).toBe(false);
		expect(hasTrackingIds(meta({ metaPixelId: VALID.metaPixel }))).toBe(true);
		expect(hasTrackingIds(meta({ metaPixelId: "12" }))).toBe(false);
	});
});

describe("stripTrackingIds", () => {
	it("removes both ids and keeps the rest of the metadata", () => {
		const out = stripTrackingIds(
			meta({
				title: "Keep me",
				googleAnalyticsId: VALID.googleAnalytics,
				metaPixelId: VALID.metaPixel,
			}),
		);
		expect(out.title).toBe("Keep me");
		expect(out.googleAnalyticsId).toBeUndefined();
		expect(out.metaPixelId).toBeUndefined();
	});

	it("does not mutate its input", () => {
		const input = meta({ googleAnalyticsId: VALID.googleAnalytics });
		stripTrackingIds(input);
		expect(input.googleAnalyticsId).toBe(VALID.googleAnalytics);
	});
});

describe("dropInvalidTrackingIds", () => {
	it("keeps valid ids and drops malformed ones", () => {
		const out = dropInvalidTrackingIds(
			meta({
				googleAnalyticsId: VALID.googleAnalytics,
				metaPixelId: "GTM-ABC1234",
			}),
		);
		expect(out.googleAnalyticsId).toBe(VALID.googleAnalytics);
		expect(out.metaPixelId).toBeUndefined();
	});

	it("trims what it keeps", () => {
		const out = dropInvalidTrackingIds(
			meta({ googleAnalyticsId: " G-ABC1234567 " }),
		);
		expect(out.googleAnalyticsId).toBe("G-ABC1234567");
	});

	it("treats an emptied field as a removal", () => {
		const out = dropInvalidTrackingIds(meta({ googleAnalyticsId: "   " }));
		expect("googleAnalyticsId" in out).toBe(false);
	});

	it("leaves the rest of the metadata alone and does not mutate", () => {
		const input = meta({ title: "Keep", metaPixelId: "oops" });
		const out = dropInvalidTrackingIds(input);
		expect(out.title).toBe("Keep");
		expect(input.metaPixelId).toBe("oops");
	});
});

describe("trackingScript", () => {
	it("carries the id into the tag", () => {
		for (const vendor of TRACKING_VENDOR_KEYS) {
			const { src, inline } = trackingScript(vendor, VALID[vendor]);
			expect(`${src ?? ""}${inline}`).toContain(VALID[vendor]);
		}
	});

	it("never emits a closing script tag that would end the block early", () => {
		for (const vendor of TRACKING_VENDOR_KEYS) {
			const { inline } = trackingScript(vendor, VALID[vendor]);
			expect(inline).not.toMatch(/<\/script/i);
		}
	});

	it("only loads from the vendor's own host", () => {
		const allowed = ["googletagmanager.com", "connect.facebook.net"];
		for (const vendor of TRACKING_VENDOR_KEYS) {
			const { src, inline } = trackingScript(vendor, VALID[vendor]);
			const hosts = `${src ?? ""}${inline}`.match(/https:\/\/([a-z0-9.-]+)/gi);
			for (const host of hosts ?? []) {
				expect(allowed.some((a) => host.includes(a))).toBe(true);
			}
		}
	});

	it("keeps the owner's tag off window.dataLayer, which belongs to Quicktalog's GTM", () => {
		const { src, inline } = trackingScript(
			"googleAnalytics",
			VALID.googleAnalytics,
		);
		// Sharing the array would apply the owner's consent and signal commands
		// to Quicktalog's own container, loaded by the root layout everywhere.
		expect(inline).not.toMatch(/window\.dataLayer/);
		expect(inline).not.toMatch(/[^.\w]gtag\(/);
		expect(inline).toContain(GA_DATA_LAYER);
		expect(src).toContain(`l=${GA_DATA_LAYER}`);
	});

	it("denies consent by default and grants only analytics, with ad signals off", () => {
		const { inline } = trackingScript("googleAnalytics", VALID.googleAnalytics);
		// Order matters: defaults must be set before the vendor script can send.
		expect(inline.indexOf("'default'")).toBeLessThan(
			inline.indexOf("'update'"),
		);
		expect(inline).toContain("'ad_storage':'denied'");
		expect(inline).toContain("'analytics_storage':'granted'");
		expect(inline).toContain("allow_google_signals',false");
	});
});

describe("TRACKING_VENDORS", () => {
	it("gives every vendor a label, hint and placeholder", () => {
		for (const vendor of TRACKING_VENDOR_KEYS) {
			const spec = TRACKING_VENDORS[vendor];
			expect(spec.label.length).toBeGreaterThan(0);
			expect(spec.hint.length).toBeGreaterThan(0);
			expect(spec.placeholder.length).toBeGreaterThan(0);
		}
	});

	it("writes to a distinct metadata field per vendor", () => {
		const fields = TRACKING_VENDOR_KEYS.map((v) => TRACKING_VENDORS[v].field);
		expect(new Set(fields).size).toBe(fields.length);
	});

	it("does not offer Google Tag Manager", () => {
		const labels = TRACKING_VENDOR_KEYS.map((v) => TRACKING_VENDORS[v].label);
		expect(labels.join(" ")).not.toMatch(/Tag Manager/);
	});
});

describe("withQtFrame", () => {
	it("marks our own frames so they report no visit", () => {
		const marked = withQtFrame(
			"https://www.quicktalog.app/catalogues/montre-shop",
		);
		expect(new URL(marked).searchParams.get(QT_FRAME_PARAM)).toBe("1");
	});

	it("keeps existing query params", () => {
		const marked = withQtFrame("https://example.com/x?q=tea");
		expect(new URL(marked).searchParams.get("q")).toBe("tea");
	});

	it("handles a relative url", () => {
		expect(withQtFrame("/catalogues/x")).toContain(`${QT_FRAME_PARAM}=1`);
	});
});
