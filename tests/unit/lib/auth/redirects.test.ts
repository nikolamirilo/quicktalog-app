import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/auth/redirects";

const ORIGIN = "https://www.quicktalog.app";

describe("safeNext", () => {
	it("keeps same-origin relative paths with query and hash", () => {
		expect(safeNext("/admin/lux/builder?tab=1#top", ORIGIN)).toBe(
			"/admin/lux/builder?tab=1#top",
		);
	});

	it.each([
		["missing", null],
		["empty", ""],
		["absolute URL", "https://evil.com/admin"],
		["protocol-relative", "//evil.com"],
		["backslash", "/\\evil.com"],
		["encoded backslash", "/%5Cevil.com"],
		["tab", "/\t/evil.com"],
		["encoded tab", "/%09/evil.com"],
		["javascript scheme", "javascript:alert(1)"],
		["relative without slash", "admin/dashboard"],
		["malformed encoding", "/%E0%A4%A"],
	])("falls back for %s", (_label, raw) => {
		expect(safeNext(raw, ORIGIN)).toBe("/admin/dashboard");
	});

	it("does not loop back into /auth", () => {
		expect(safeNext("/auth?mode=signup", ORIGIN)).toBe("/admin/dashboard");
		expect(safeNext("/auth/update-password", ORIGIN)).toBe(
			"/auth/update-password",
		);
	});

	it("uses the given fallback", () => {
		expect(safeNext("//evil.com", ORIGIN, "/")).toBe("/");
	});
});
