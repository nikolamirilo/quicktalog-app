import { describe, expect, it } from "vitest";
import { countEmojis, isOnlyEmojis, splitEmojis } from "@/lib/format/emoji";

describe("splitEmojis", () => {
	it("keeps a multi-code-point emoji whole", () => {
		expect(splitEmojis("❤️")).toEqual(["❤️"]);
		expect(splitEmojis("👨‍👩‍👧")).toEqual(["👨‍👩‍👧"]);
		expect(splitEmojis("👍🏽")).toEqual(["👍🏽"]);
		expect(splitEmojis("🇺🇸")).toEqual(["🇺🇸"]);
		expect(splitEmojis("1️⃣")).toEqual(["1️⃣"]);
	});

	it("splits a run of emoji and drops everything else", () => {
		expect(splitEmojis("🎁🎉❤️")).toEqual(["🎁", "🎉", "❤️"]);
		expect(splitEmojis("a🎁 1")).toEqual(["🎁"]);
		expect(splitEmojis("")).toEqual([]);
	});
});

describe("countEmojis", () => {
	it("counts emoji, not code units", () => {
		expect(countEmojis("❤️")).toBe(1);
		expect(countEmojis("🎁🎉❤️")).toBe(3);
		expect(countEmojis("plain text")).toBe(0);
	});
});

describe("isOnlyEmojis", () => {
	it("accepts emoji-only strings", () => {
		expect(isOnlyEmojis("🎁")).toBe(true);
		expect(isOnlyEmojis("🎁❤️👨‍👩‍👧")).toBe(true);
		expect(isOnlyEmojis("")).toBe(true);
	});

	it("rejects letters, digits and spaces", () => {
		expect(isOnlyEmojis("🎁a")).toBe(false);
		expect(isOnlyEmojis("1")).toBe(false);
		expect(isOnlyEmojis("🎁 🎉")).toBe(false);
	});
});
