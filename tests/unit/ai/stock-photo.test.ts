import { findStockPhoto } from "@/lib/images/stock-photo";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { get, set } = vi.hoisted(() => ({ get: vi.fn(), set: vi.fn() }));
vi.mock("@/utils/redis", () => ({ getRedis: () => ({ get, set }) }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

const answer = (body: unknown, status = 200) =>
	vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(typeof body === "string" ? body : JSON.stringify(body), {
			status,
		}),
	);

const photo = (url: string) => ({ results: [{ urls: { regular: url } }] });

beforeEach(() => {
	get.mockResolvedValue(null);
	set.mockResolvedValue("OK");
	vi.stubEnv("UNSPLASH_API_KEY", "unsplash-test");
});

afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
	vi.clearAllMocks();
});

describe("findStockPhoto", () => {
	it("returns the first photo of a search", async () => {
		answer(photo("https://images.test/a.jpg"));

		expect(await findStockPhoto("butter croissant")).toEqual({
			status: "found",
			url: "https://images.test/a.jpg",
		});
	});

	// The bug: Unsplash answers an exhausted quota with 403 and a plain-text
	// body, which the old helper swallowed into "no photo found".
	it("reports a rate limit as unavailable, not as an empty search", async () => {
		answer("Rate Limit Exceeded", 403);

		const result = await findStockPhoto("butter croissant");

		expect(result.status).toBe("unavailable");
		expect(set).not.toHaveBeenCalled();
	});

	it("reports a body that is not JSON as unavailable", async () => {
		answer("<html>maintenance</html>");

		expect((await findStockPhoto("croissant")).status).toBe("unavailable");
	});

	it("reports a search that matched nothing as none", async () => {
		answer({ results: [] });

		expect(await findStockPhoto("qwertyuiop")).toEqual({ status: "none" });
	});

	it("answers a repeated query from the cache without spending quota", async () => {
		get.mockResolvedValue("https://images.test/cached.jpg");
		const fetchMock = answer(photo("https://images.test/live.jpg"));

		expect(await findStockPhoto("croissant")).toEqual({
			status: "found",
			url: "https://images.test/cached.jpg",
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it("searches anyway when the cache cannot be read", async () => {
		get.mockRejectedValue(new Error("redis down"));
		answer(photo("https://images.test/a.jpg"));

		expect((await findStockPhoto("croissant")).status).toBe("found");
	});

	it("does not search without a key", async () => {
		vi.stubEnv("UNSPLASH_API_KEY", "");
		const fetchMock = answer(photo("https://images.test/a.jpg"));

		expect((await findStockPhoto("croissant")).status).toBe("unavailable");
		expect(fetchMock).not.toHaveBeenCalled();
	});
});
