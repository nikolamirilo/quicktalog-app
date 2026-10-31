import { tiers } from "@quicktalog/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getVerifiedIdentity: vi.fn(),
	withUser: vi.fn(),
	getPlanForUpdate: vi.fn(),
	withinCatalogueQuota: vi.fn(),
	writeOwnedDraft: vi.fn(),
	revalidateCatalogue: vi.fn(),
	insertValues: vi.fn(),
	insertResult: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/auth/identity", () => ({
	getVerifiedIdentity: mocks.getVerifiedIdentity,
}));
vi.mock("@/lib/cache/revalidate", () => ({
	revalidateCatalogue: mocks.revalidateCatalogue,
	revalidateDashboard: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ withinRateLimit: vi.fn() }));
vi.mock("@/lib/catalogue/draft-cache", () => ({
	deleteDrafts: vi.fn(),
	loadOwnedCatalogue: vi.fn(),
	readOwnedDraft: vi.fn(),
	writeOwnedDraft: mocks.writeOwnedDraft,
}));
vi.mock("@/lib/entitlements/plan", async (importOriginal) => ({
	...(await importOriginal<object>()),
	getPlanForUpdate: mocks.getPlanForUpdate,
	withinCatalogueQuota: mocks.withinCatalogueQuota,
}));
vi.mock("@/utils/db", () => ({
	withUser: mocks.withUser,
	isUniqueViolation: (err: { code?: string }) => err?.code === "23505",
	pickEditable: (row: unknown) => row,
}));

import { createCatalogue } from "@/actions/catalogue";

const starter = tiers.find((t) => t.name === "Starter")!;

const tx = {
	insert: () => ({
		values: (row: Record<string, unknown>) => {
			mocks.insertValues(row);
			return { returning: mocks.insertResult };
		},
	}),
};

const form = (over: Record<string, unknown> = {}) =>
	({
		name: "  Bean There Cafe ",
		title: "Bean There",
		currency: "EUR",
		language: "en",
		content: [],
		...over,
	}) as never;

describe("createCatalogue", () => {
	beforeEach(() => {
		mocks.getVerifiedIdentity.mockResolvedValue({
			userId: "u1",
			sessionId: "s",
		});
		mocks.getPlanForUpdate.mockResolvedValue(starter);
		mocks.withinCatalogueQuota.mockResolvedValue(true);
		mocks.writeOwnedDraft.mockResolvedValue(undefined);
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (t: unknown) => unknown) => Promise.resolve(fn(tx)),
		);
		mocks.insertResult.mockImplementation(async () => [
			{ id: "c1", ...mocks.insertValues.mock.lastCall?.[0] },
		]);
	});

	it("creates a draft under the slug, owned by the signed-in user", async () => {
		const result = await createCatalogue(
			form({ userId: "someone-else", status: "active" }),
		);

		expect(result).toMatchObject({
			success: true,
			data: { name: "bean-there-cafe" },
		});
		expect(mocks.insertValues).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "bean-there-cafe",
				status: "draft",
				userId: "u1",
				tags: [],
			}),
		);
		expect(mocks.writeOwnedDraft).toHaveBeenCalled();
		expect(mocks.revalidateCatalogue).toHaveBeenCalledWith("bean-there-cafe");
	});

	it("refuses a signed-out caller without opening a database block", async () => {
		mocks.getVerifiedIdentity.mockResolvedValue(null);

		expect(await createCatalogue(form())).toEqual({
			success: false,
			error: "Unauthorized",
		});
		expect(mocks.withUser).not.toHaveBeenCalled();
	});

	it("refuses a name that leaves no slug", async () => {
		const result = await createCatalogue(form({ name: "   " }));

		expect(result).toEqual({ success: false, error: "Invalid catalogue name" });
		expect(mocks.withUser).not.toHaveBeenCalled();
	});

	it("refuses once the plan's catalogue limit is reached", async () => {
		mocks.withinCatalogueQuota.mockResolvedValue(false);

		const result = await createCatalogue(form());

		expect(result.success).toBe(false);
		expect(result.error).toMatch(/catalogue limit/);
		expect(mocks.insertValues).not.toHaveBeenCalled();
	});

	it("reports a taken name instead of an unexpected error", async () => {
		mocks.insertResult.mockRejectedValue(
			Object.assign(new Error("duplicate"), { code: "23505" }),
		);

		expect(await createCatalogue(form())).toEqual({
			success: false,
			error: "A catalogue with this name already exists",
		});
	});

	it("still creates the catalogue when the draft cache is down", async () => {
		mocks.writeOwnedDraft.mockRejectedValue(new Error("redis down"));

		expect((await createCatalogue(form())).success).toBe(true);
	});
});
