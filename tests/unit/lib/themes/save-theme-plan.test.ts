import { tiers } from "@quicktalog/common";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	withUser: vi.fn(),
	getPlanForUpdate: vi.fn(),
	insert: vi.fn(),
	update: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/utils/db", () => ({
	withUser: mocks.withUser,
	isUniqueViolation: () => false,
}));
vi.mock("@/lib/entitlements/plan", () => ({
	getPlanForUpdate: mocks.getPlanForUpdate,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { saveOwnTheme, updateOwnTheme } from "@/lib/themes/upsert";

const ME = { userId: "user-1", sessionId: "s" } as unknown as VerifiedIdentity;
const COLORS = { primary: "#2563eb" };
const named = (name: string) => tiers.find((t) => t.name === name)!;
const saved = { id: "th-1", name: "Mine", colors: COLORS };

const chain = (row: unknown) => {
	const end = { returning: async () => [row] };
	return {
		values: () => ({ onConflictDoUpdate: () => end }),
		set: () => ({ where: () => end }),
	};
};

describe("custom themes follow the plan", () => {
	beforeEach(() => {
		mocks.insert.mockReset().mockReturnValue(chain(saved));
		mocks.update.mockReset().mockReturnValue(chain(saved));
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (tx: unknown) => unknown) =>
				Promise.resolve(fn({ insert: mocks.insert, update: mocks.update })),
		);
	});

	it("refuses to save a theme on Starter", async () => {
		mocks.getPlanForUpdate.mockResolvedValue(named("Starter"));
		const result = await saveOwnTheme(ME, "Mine", COLORS);
		expect(result).toEqual({
			success: false,
			error: "Custom themes are not part of your plan",
		});
		expect(mocks.insert).not.toHaveBeenCalled();
	});

	it("refuses to update a theme on Basic", async () => {
		mocks.getPlanForUpdate.mockResolvedValue(named("Basic"));
		const result = await updateOwnTheme(
			ME,
			"0f8fad5b-d9cb-469f-a165-70867728950e",
			"Mine",
			COLORS,
		);
		expect(result.success).toBe(false);
		expect(mocks.update).not.toHaveBeenCalled();
	});

	it("saves a theme on Pro", async () => {
		mocks.getPlanForUpdate.mockResolvedValue(named("Pro"));
		const result = await saveOwnTheme(ME, "Mine", COLORS);
		expect(result).toEqual({ success: true, data: saved });
	});
});
