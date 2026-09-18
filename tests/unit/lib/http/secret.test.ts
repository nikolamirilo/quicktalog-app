import { describe, expect, it } from "vitest";
import { secretMatches } from "@/lib/http/secret";

describe("secretMatches", () => {
	it("accepts the exact secret", () => {
		expect(secretMatches("s3cret-value", "s3cret-value")).toBe(true);
	});

	it("rejects a different secret, including a prefix", () => {
		expect(secretMatches("s3cret", "s3cret-value")).toBe(false);
		expect(secretMatches("other", "s3cret-value")).toBe(false);
	});

	it("rejects when either side is missing", () => {
		expect(secretMatches(null, "s3cret-value")).toBe(false);
		expect(secretMatches("s3cret-value", undefined)).toBe(false);
		expect(secretMatches("", "")).toBe(false);
	});
});
