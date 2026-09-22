import { describe, expect, it } from "vitest";
import { isLegacyDraft } from "@/scripts/redis/delete-legacy-keys";

/**
 * The one decision this script makes, and the only one that matters: a false
 * positive deletes somebody's unsaved catalogue draft, and there is no undo.
 */

const draft = JSON.stringify({ content: [], name: "my-menu" });

describe("isLegacyDraft", () => {
	it("matches a pre-Phase-1 key: a bare slug holding a JSON object", () => {
		expect(isLegacyDraft("my-menu", draft)).toBe(true);
		expect(isLegacyDraft("cafe", draft)).toBe(true);
		expect(isLegacyDraft("a1-b2-c3", draft)).toBe(true);
	});

	it("accepts an object the client already parsed", () => {
		expect(isLegacyDraft("my-menu", { content: [] })).toBe(true);
	});

	it("leaves every namespaced key alone", () => {
		// Everything the current code writes carries an environment prefix,
		// including the rate limiter's keys.
		expect(isLegacyDraft("prod:catalogue:abc", draft)).toBe(false);
		expect(isLegacyDraft("test:catalogue:abc", draft)).toBe(false);
		expect(isLegacyDraft("dev:rl:newsletter:1.2.3.4", draft)).toBe(false);
		expect(isLegacyDraft("ci:catalogue:abc", draft)).toBe(false);
	});

	it("leaves keys that are not slug-shaped alone", () => {
		expect(isLegacyDraft("My-Menu", draft)).toBe(false);
		expect(isLegacyDraft("my_menu", draft)).toBe(false);
		expect(isLegacyDraft("my--menu", draft)).toBe(false);
		expect(isLegacyDraft("-menu", draft)).toBe(false);
		expect(isLegacyDraft("menu-", draft)).toBe(false);
		expect(isLegacyDraft("", draft)).toBe(false);
		expect(isLegacyDraft("a".repeat(101), draft)).toBe(false);
	});

	it("leaves anything that is not a JSON object alone", () => {
		expect(isLegacyDraft("my-menu", "not json")).toBe(false);
		expect(isLegacyDraft("my-menu", "42")).toBe(false);
		expect(isLegacyDraft("my-menu", '"a string"')).toBe(false);
		expect(isLegacyDraft("my-menu", "[1, 2]")).toBe(false);
		expect(isLegacyDraft("my-menu", [1, 2])).toBe(false);
		expect(isLegacyDraft("my-menu", null)).toBe(false);
		expect(isLegacyDraft("my-menu", undefined)).toBe(false);
		expect(isLegacyDraft("my-menu", 42)).toBe(false);
	});
});
