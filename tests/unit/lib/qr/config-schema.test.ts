import { describe, expect, it } from "vitest";
import { qrConfigSchema } from "@/constants/schemas";
import { defaultQrConfig } from "@/lib/qr/design";

const LOGO = "https://abc123.ufs.sh/f/logo-key";
const base = () => ({
	...defaultQrConfig("https://example.test/c/a"),
	image: LOGO,
});

describe("qrConfigSchema", () => {
	it("accepts what the editor produces", () => {
		const parsed = qrConfigSchema.safeParse(base());
		expect(parsed.success).toBe(true);
	});

	it("strips unknown keys at every level", () => {
		const parsed = qrConfigSchema.parse({
			...base(),
			__proto__: { polluted: true },
			evil: "x",
			nodeCanvas: {},
			dotsOptions: {
				color: "#000000",
				type: "rounded",
				gradient: { type: "linear", colorStops: [] },
				onclick: "alert(1)",
			},
			frameText: { show: true, text: "Hi", html: "<b>" },
		});
		expect(parsed).not.toHaveProperty("evil");
		expect(parsed).not.toHaveProperty("nodeCanvas");
		expect(parsed.dotsOptions).toEqual({ color: "#000000", type: "rounded" });
		expect(parsed.frameText).toEqual({ show: true, text: "Hi" });
	});

	it.each([
		["a data: URL logo", { image: "data:image/png;base64,AAAA" }],
		[
			"a huge image string",
			{ image: `https://abc.ufs.sh/f/${"a".repeat(100_000)}` },
		],
		["a logo on another host", { image: "https://evil.test/f/logo.png" }],
		["an http logo", { image: "http://abc.ufs.sh/f/logo" }],
		["a named colour", { dotsOptions: { color: "red" } }],
		["a short hex colour", { backgroundOptions: { color: "#fff" } }],
		["CSS in a colour", { cornersDotOptions: { color: "#000000;x" } }],
		["an unknown dot type", { dotsOptions: { type: "hearts" } }],
		["an unknown error level", { qrOptions: { errorCorrectionLevel: "X" } }],
		["a tiny logo", { imageOptions: { imageSize: 0.01 } }],
		["an oversized logo", { imageOptions: { imageSize: 2 } }],
		["a giant width", { width: 100_000 }],
		["a negative margin", { margin: -5 }],
		["long frame text", { frameText: { show: true, text: "x".repeat(29) } }],
		["a non-boolean show", { frameText: { show: "yes", text: "x" } }],
	])("rejects %s", (_label, patch) => {
		expect(qrConfigSchema.safeParse({ ...base(), ...patch }).success).toBe(
			false,
		);
	});

	it("allows an empty logo", () => {
		expect(qrConfigSchema.safeParse({ ...base(), image: "" }).success).toBe(
			true,
		);
	});
});
