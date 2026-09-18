import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	revalidateCatalogue: vi.fn(),
	revalidateDashboard: vi.fn(),
}));

vi.mock("@/helpers/server", () => mocks);

import { POST } from "@/app/api/revalidate/route";

const SECRET = "test-revalidate-secret";

const request = (body: unknown, secret: string | null = SECRET) =>
	new Request("http://localhost/api/revalidate", {
		method: "POST",
		headers: secret ? { "x-revalidate-secret": secret } : {},
		body: typeof body === "string" ? body : JSON.stringify(body),
	});

describe("POST /api/revalidate", () => {
	beforeEach(() => {
		process.env.REVALIDATE_SECRET = SECRET;
		mocks.revalidateCatalogue.mockReset();
		mocks.revalidateDashboard.mockReset();
	});

	it("rejects requests without the secret", async () => {
		const res = await POST(request({}, null));
		expect(res.status).toBe(401);
		expect(mocks.revalidateCatalogue).not.toHaveBeenCalled();
	});

	it("rejects a wrong secret", async () => {
		const res = await POST(request({}, "wrong"));
		expect(res.status).toBe(401);
	});

	it("rejects when no secret is configured", async () => {
		delete process.env.REVALIDATE_SECRET;
		const res = await POST(request({}, SECRET));
		expect(res.status).toBe(401);
	});

	it("revalidates each named catalogue", async () => {
		const res = await POST(request({ names: ["lux-watches", "zara-online"] }));
		expect(res.status).toBe(200);
		expect(mocks.revalidateCatalogue).toHaveBeenCalledWith("lux-watches");
		expect(mocks.revalidateCatalogue).toHaveBeenCalledWith("zara-online");
		expect(mocks.revalidateDashboard).not.toHaveBeenCalled();
	});

	it("revalidates the catalogue list and dashboard when asked", async () => {
		const res = await POST(request({ dashboard: true }));
		expect(res.status).toBe(200);
		expect(mocks.revalidateCatalogue).toHaveBeenCalledWith();
		expect(mocks.revalidateDashboard).toHaveBeenCalled();
	});

	it("rejects invalid names and malformed JSON", async () => {
		expect((await POST(request({ names: ["../etc"] }))).status).toBe(400);
		expect((await POST(request("{not json"))).status).toBe(400);
		expect(mocks.revalidateCatalogue).not.toHaveBeenCalled();
	});
});
