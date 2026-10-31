import { describe, expect, it } from "vitest";
import { socialPlatform, uniqueSocials } from "@/lib/catalogue/socials";

describe("socialPlatform", () => {
	it("recognises platforms by host, and treats the rest as a website", () => {
		expect(socialPlatform("https://Instagram.com/ember")).toBe("instagram");
		expect(socialPlatform("x.com/ember")).toBe("twitter");
		expect(socialPlatform("https://ember.example")).toBe("website");
	});
});

describe("uniqueSocials", () => {
	it("keeps one link per platform, every website link, and skips blanks", () => {
		expect(
			uniqueSocials([
				"instagram.com/a",
				"instagram.com/b",
				"",
				"a.example",
				"b.example",
			]),
		).toEqual([
			{ platform: "instagram", url: "instagram.com/a" },
			{ platform: "website", url: "a.example" },
			{ platform: "website", url: "b.example" },
		]);
		expect(uniqueSocials(undefined)).toEqual([]);
	});
});
