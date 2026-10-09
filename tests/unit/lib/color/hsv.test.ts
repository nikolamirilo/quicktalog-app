import { describe, expect, it } from "vitest";
import { hexToHsv, hsvToHex } from "@/lib/color/hsv";

describe("hexToHsv / hsvToHex", () => {
	it.each([
		"#000000",
		"#ffffff",
		"#ff0000",
		"#00ff33",
		"#c77f00",
		"#16140f",
		"#9e9494",
	])("round-trips %s", (hex) => {
		expect(hsvToHex(hexToHsv(hex))).toBe(hex);
	});

	it("reads a pure hue and a grey", () => {
		expect(hexToHsv("#ff0000")).toMatchObject({ s: 1, v: 1 });
		expect(hexToHsv("#ff0000").h).toBe(0);
		expect(hexToHsv("#808080").s).toBe(0);
	});

	it("wraps the hue and clamps saturation and value", () => {
		expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe("#ff0000");
		expect(hsvToHex({ h: -120, s: 1, v: 1 })).toBe("#0000ff");
		expect(hsvToHex({ h: 0, s: 2, v: -1 })).toBe("#000000");
	});

	it("reads anything that isn't a six-digit hex as black", () => {
		expect(hexToHsv("red")).toEqual(hexToHsv("#000000"));
	});
});
