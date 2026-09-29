import { describe, expect, it } from "vitest";
import { moduleCount, qrVersion } from "@/lib/qr/version";

describe("qrVersion", () => {
	// Expected values checked against qrcode-generator (37 modules for the URL).
	it("picks the smallest byte-mode version that fits", () => {
		expect(qrVersion("a".repeat(17), "L")).toBe(1);
		expect(qrVersion("a".repeat(18), "L")).toBe(2);
		expect(qrVersion("a".repeat(11), "Q")).toBe(1);
		expect(qrVersion("a".repeat(12), "Q")).toBe(2);
		expect(
			qrVersion("https://www.quicktalog.app/catalogues/bean-there", "Q"),
		).toBe(5);
	});

	it("honours a fixed version and gives up on non-byte data", () => {
		expect(qrVersion("anything", "H", { typeNumber: 7 })).toBe(7);
		expect(qrVersion("12345", "Q")).toBeNull();
		expect(qrVersion("12345", "Q", { mode: "Byte" })).toBe(1);
		expect(qrVersion("a".repeat(3000), "L")).toBeNull();
	});

	it("counts modules per side", () => {
		expect(moduleCount(1)).toBe(21);
		expect(moduleCount(40)).toBe(177);
	});
});
