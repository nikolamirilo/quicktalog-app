import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	currentUser: vi.fn(),
	findFirst: vi.fn(),
	insertValues: vi.fn(),
	fetchUserData: vi.fn(),
	generateText: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ currentUser: mocks.currentUser }));
vi.mock("@/utils/drizzle", () => ({
	drizzleClient: {
		query: { catalogues: { findFirst: mocks.findFirst } },
		insert: () => ({ values: mocks.insertValues }),
	},
}));
vi.mock("@/lib/users/fetchUserData", () => ({
	fetchUserData: mocks.fetchUserData,
}));
vi.mock("@/utils/deepseek", () => ({
	generateText: mocks.generateText,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { writeItemDescription } from "@/actions/ai";

const withPlan = (aiPrompts: number, used: number) => ({
	ok: true,
	data: {
		currentPlan: { features: { ai_prompts: aiPrompts } },
		usage: { prompts: used },
	},
});

describe("AI block-level server actions", () => {
	beforeEach(() => {
		mocks.currentUser.mockResolvedValue({ id: "user_1" });
		mocks.findFirst.mockResolvedValue({ createdBy: "user_1" });
		mocks.insertValues.mockResolvedValue(undefined);
		mocks.fetchUserData.mockResolvedValue(withPlan(100, 0));
	});

	describe("writeItemDescription", () => {
		it("returns a trimmed, unquoted description and meters usage", async () => {
			mocks.generateText.mockResolvedValue('"A rich, velvety espresso shot."');

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(true);
			expect(res.data).toBe("A rich, velvety espresso shot.");
			expect(mocks.insertValues).toHaveBeenCalledTimes(1);
		});

		it("does not meter when the model call throws", async () => {
			mocks.generateText.mockRejectedValue(new Error("boom"));

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("ai_error");
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});
	});

	describe("gating", () => {
		it("returns a limit error and never calls DeepSeek when over quota", async () => {
			mocks.fetchUserData.mockResolvedValue(withPlan(5, 5));

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("limit");
			expect(mocks.generateText).not.toHaveBeenCalled();
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});

		it("blocks a non-owner without calling DeepSeek", async () => {
			mocks.findFirst.mockResolvedValue({ createdBy: "someone_else" });

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("unauthorized");
			expect(mocks.generateText).not.toHaveBeenCalled();
		});

		it("blocks an unauthenticated caller", async () => {
			mocks.currentUser.mockResolvedValue(null);

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("unauthorized");
			expect(mocks.generateText).not.toHaveBeenCalled();
		});
	});
});
