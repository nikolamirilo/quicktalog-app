import { tiers } from "@quicktalog/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getVerifiedIdentity: vi.fn(),
	withUser: vi.fn(),
	loadOwnedCatalogue: vi.fn(),
	loadOwnedDraftRow: vi.fn(),
	saveOwnedDraft: vi.fn(),
	getPlanForUpdate: vi.fn(),
	update: vi.fn(),
	storedContent: [] as unknown[],
}));

vi.mock("server-only", () => ({}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
vi.mock("@/lib/auth/identity", () => ({
	getVerifiedIdentity: mocks.getVerifiedIdentity,
}));
vi.mock("@/lib/cache/revalidate", () => ({
	revalidateCatalogue: vi.fn(),
	revalidateDashboard: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({ withinRateLimit: vi.fn() }));
vi.mock("@/lib/catalogue/draft-store", () => ({
	listDraftVersions: vi.fn(),
	loadOwnedCatalogue: mocks.loadOwnedCatalogue,
	loadOwnedDraftRow: mocks.loadOwnedDraftRow,
	readDraftVersion: vi.fn(),
	readOwnedDraft: vi.fn(),
	recordDraftVersion: vi.fn().mockResolvedValue(undefined),
	saveOwnedDraft: mocks.saveOwnedDraft,
	writeOwnedDraft: vi.fn().mockResolvedValue({
		draftUpdatedAt: "2026-11-19T10:00:00Z",
		unpublished: false,
	}),
}));
vi.mock("@/lib/entitlements/plan", async (importOriginal) => ({
	...(await importOriginal<object>()),
	getPlanForUpdate: mocks.getPlanForUpdate,
}));
vi.mock("@/utils/db", () => ({
	withUser: mocks.withUser,
	isUniqueViolation: () => false,
	pickEditable: (row: unknown) => row,
}));

import {
	publishCatalogue,
	updateCatalogue,
	updateItemStatus,
} from "@/actions/catalogue";

const basic = tiers.find((t) => t.name === "Basic")!;
const items = (count: number) => [
	{
		id: "a",
		order: 0,
		type: "items",
		name: "A",
		items: Array.from({ length: count }, (_, i) => ({ id: `i${i}` })),
	},
];

const tx = () => {
	const returning = async () => [{ id: "c1", name: "menu" }];
	return {
		execute: async () => [{ pageviews: 0 }],
		select: () => ({
			from: () => ({
				where: () => ({
					limit: async () => [{ content: mocks.storedContent }],
				}),
			}),
		}),
		update: mocks.update.mockImplementation(() => ({
			set: () => ({ where: () => ({ returning }) }),
		})),
	};
};

describe("going live needs a full fit", () => {
	beforeEach(() => {
		mocks.update.mockReset();
		mocks.loadOwnedDraftRow.mockResolvedValue(null);
		mocks.getVerifiedIdentity.mockResolvedValue({
			userId: "u1",
			sessionId: "s",
		});
		mocks.getPlanForUpdate.mockResolvedValue(basic);
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (t: unknown) => unknown) => Promise.resolve(fn(tx())),
		);
	});

	it("reactivation is refused until the catalogue fits", async () => {
		mocks.storedContent = items(80);
		const refused = await updateItemStatus("c1", "active");
		expect(refused.success).toBe(false);
		expect(refused.error).toMatch(/Remove 50 item\(s\) to fit the Basic plan/);
		expect(mocks.update).not.toHaveBeenCalled();

		mocks.storedContent = items(30);
		expect((await updateItemStatus("c1", "active")).success).toBe(true);
	});

	it("deactivating never needs a fit", async () => {
		mocks.storedContent = items(80);
		expect((await updateItemStatus("c1", "inactive")).success).toBe(true);
	});

	it("publish is refused for a catalogue over its plan", async () => {
		mocks.loadOwnedCatalogue.mockResolvedValue({
			id: "c1",
			name: "menu",
			content: items(80),
		});
		const result = await publishCatalogue({
			name: "menu",
			content: items(80),
		} as never);
		expect(result.success).toBe(false);
		expect(result.error).toMatch(/Remove 50 item/);
	});
});

describe("draft saves while over the plan", () => {
	beforeEach(() => {
		mocks.getVerifiedIdentity.mockResolvedValue({
			userId: "u1",
			sessionId: "s",
		});
		mocks.getPlanForUpdate.mockResolvedValue(basic);
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (t: unknown) => unknown) => Promise.resolve(fn(tx())),
		);
		mocks.saveOwnedDraft.mockResolvedValue({
			ok: true,
			draftUpdatedAt: "2026-11-19T10:00:00Z",
			unpublished: true,
		});
		// Published long ago with nothing in it; the saved draft grew on a bigger plan.
		mocks.loadOwnedCatalogue.mockResolvedValue({
			id: "c1",
			name: "menu",
			content: [],
		});
		mocks.loadOwnedDraftRow.mockResolvedValue({
			draft: { content: items(80) },
			updated_at: "2026-11-19T09:00:00Z",
			published_at: null,
		});
	});

	it("a draft over the plan can be trimmed step by step", async () => {
		const result = await updateCatalogue({
			name: "menu",
			content: items(75),
		} as never);
		expect(result.success).toBe(true);
	});

	it("a draft over the plan cannot grow", async () => {
		const result = await updateCatalogue({
			name: "menu",
			content: items(81),
		} as never);
		expect(result.success).toBe(false);
		expect(mocks.saveOwnedDraft).not.toHaveBeenCalled();
	});

	// Two tabs: the second save carries a timestamp the stored draft no longer has.
	it("a save against an older draft is refused instead of overwriting", async () => {
		mocks.saveOwnedDraft.mockResolvedValue({
			ok: false,
			conflict: true,
			draftUpdatedAt: "2026-11-19T09:30:00Z",
		});
		const result = await updateCatalogue(
			{ name: "menu", content: items(75) } as never,
			"2026-11-19T09:00:00Z",
		);
		expect(result.success).toBe(false);
		expect(result.conflict).toBe(true);
		expect(result.draftUpdatedAt).toBe("2026-11-19T09:30:00Z");
	});
});
