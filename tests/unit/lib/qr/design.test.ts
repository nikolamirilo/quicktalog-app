import {
	DEFAULT_FRAME_TEXT,
	defaultQrConfig,
	designKey,
	isUploadedLogoUrl,
	loadQrConfig,
	LOGO_SIZE_MAX,
	mergeQrConfig,
	normalizeQrConfig,
	type QrConfig,
	toStylingOptions,
	visibleFrameText,
} from "@/lib/qr/design";
import { describe, expect, it } from "vitest";

const URL = "https://example.test/catalogues/bean-there";

describe("loadQrConfig", () => {
	it("starts a new design from the defaults with frame text off", () => {
		const config = loadQrConfig(undefined, URL);
		expect(config.data).toBe(URL);
		expect(visibleFrameText(config)).toBeNull();
		expect(config.frameText).toEqual({
			show: false,
			text: DEFAULT_FRAME_TEXT,
		});
	});

	it("loads a design saved before frame text existed without adding it", () => {
		const saved = { data: "https://evil.test", margin: 4 } as QrConfig;
		const config = loadQrConfig(saved, URL);
		expect(config.data).toBe(URL);
		expect(config.margin).toBe(4);
		expect(visibleFrameText(config)).toBeNull();
		expect(config.showLogo).toBe(true);
	});
});

describe("normalizeQrConfig", () => {
	it("pins the URL and trims frame text to 28 characters", () => {
		const config = normalizeQrConfig(
			{
				data: "https://evil.test",
				frameText: { show: "yes" as unknown as boolean, text: "x".repeat(40) },
			},
			URL,
		);
		expect(config.data).toBe(URL);
		expect(config.frameText).toEqual({ show: false, text: "x".repeat(28) });
	});
});

describe("toStylingOptions", () => {
	it("strips app fields and clears a hidden logo", () => {
		const options = toStylingOptions({
			...defaultQrConfig(URL),
			image: "https://cdn.test/logo.png",
			showLogo: false,
		});
		expect(options).not.toHaveProperty("frameText");
		expect(options).not.toHaveProperty("showLogo");
		expect(options.image).toBe("");
	});
});

describe("logo size cap", () => {
	const oversized: QrConfig = {
		...defaultQrConfig(URL),
		imageOptions: { imageSize: 1, hideBackgroundDots: true },
	};

	it("caps an oversized logo when loading, saving and drawing", () => {
		expect(loadQrConfig(oversized, URL).imageOptions?.imageSize).toBe(
			LOGO_SIZE_MAX,
		);
		expect(normalizeQrConfig(oversized, URL).imageOptions?.imageSize).toBe(
			LOGO_SIZE_MAX,
		);
		expect(toStylingOptions(oversized).imageOptions?.imageSize).toBe(
			LOGO_SIZE_MAX,
		);
		expect(oversized.imageOptions?.hideBackgroundDots).toBe(true);
	});

	it("leaves a logo within the cap alone", () => {
		const config: QrConfig = {
			...defaultQrConfig(URL),
			imageOptions: { imageSize: 0.3 },
		};
		expect(toStylingOptions(config).imageOptions?.imageSize).toBe(0.3);
	});
});

describe("designKey", () => {
	it("ignores key order and undefined values", () => {
		expect(designKey({ margin: 1, data: "a" })).toBe(
			designKey({ data: "a", margin: 1, image: undefined }),
		);
	});
});

describe("mergeQrConfig", () => {
	it("merges only the option groups the patch mentions", () => {
		const legacy = { data: URL, margin: 4 } as QrConfig;
		const changed = mergeQrConfig(legacy, {
			dotsOptions: { color: "#111111" },
		});
		expect(changed.dotsOptions).toEqual({ color: "#111111" });
		expect(changed).not.toHaveProperty("qrOptions");
		expect(changed).not.toHaveProperty("cornersDotOptions");
	});

	it("returns an old design to its saved key when a change is undone", () => {
		const legacy = {
			data: URL,
			dotsOptions: { color: "#000000", type: "square" },
		} as QrConfig;
		const changed = mergeQrConfig(legacy, {
			dotsOptions: { color: "#FF0000" },
		});
		const undone = mergeQrConfig(changed, {
			dotsOptions: { color: "#000000" },
		});
		expect(designKey(undone)).toBe(designKey(legacy));
	});

	it("keeps the rest of a group it merges", () => {
		const merged = mergeQrConfig(defaultQrConfig(URL), {
			imageOptions: { imageSize: 0.3 },
		});
		expect(merged.imageOptions).toMatchObject({
			imageSize: 0.3,
			hideBackgroundDots: true,
			crossOrigin: "anonymous",
		});
	});
});

describe("isUploadedLogoUrl", () => {
	it("accepts UploadThing file URLs", () => {
		expect(isUploadedLogoUrl("https://abc123xyz.ufs.sh/f/KEY")).toBe(true);
		expect(isUploadedLogoUrl("https://utfs.io/f/KEY")).toBe(true);
	});

	it("refuses data URLs, other hosts, http and look-alikes", () => {
		for (const url of [
			"data:image/png;base64,AAAA",
			"http://abc.ufs.sh/f/KEY",
			"https://evil.test/f/KEY",
			"https://ufs.sh.evil.test/f/KEY",
			"https://a.b.ufs.sh/f/KEY",
			"https://abc.ufs.sh/other/KEY",
			"https://user:pw@abc.ufs.sh/f/KEY",
			"https://abc.ufs.sh:8443/f/KEY",
			`https://abc.ufs.sh/f/${"k".repeat(600)}`,
			"javascript:alert(1)",
			"",
		]) {
			expect(isUploadedLogoUrl(url), url).toBe(false);
		}
	});

	it("drops a logo that breaks the rule when a saved design loads", () => {
		const saved = {
			data: URL,
			image: "data:image/png;base64,AAAA",
		} as QrConfig;
		expect(loadQrConfig(saved, URL).image).toBe("");
	});
});
