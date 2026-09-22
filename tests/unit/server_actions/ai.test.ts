import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getVerifiedIdentity: vi.fn(),
	openAiTurn: vi.fn(),
	refundAiTurn: vi.fn(),
	withUser: vi.fn(),
	generateText: vi.fn(),
}));

vi.mock("@/lib/auth/identity", () => ({
	getVerifiedIdentity: mocks.getVerifiedIdentity,
}));
vi.mock("@/lib/ai/turn", () => ({ openAiTurn: mocks.openAiTurn }));
vi.mock("@/lib/ai/metering", () => ({ refundAiTurn: mocks.refundAiTurn }));
vi.mock("@/utils/db", () => ({
	withUser: mocks.withUser,
}));
vi.mock("@/utils/deepseek", () => ({ generateText: mocks.generateText }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { writeItemDescription } from "@/actions/ai";

const ME = { userId: "user_1", sessionId: "sess_1", provider: "clerk" };
const grant = {
	ok: true,
	turnId: "11111111-1111-4111-8111-111111111111",
	charged: true,
	limits: {},
};

describe("AI block-level server actions", () => {
	beforeEach(() => {
		mocks.getVerifiedIdentity.mockResolvedValue(ME);
		mocks.openAiTurn.mockResolvedValue(grant);
		mocks.refundAiTurn.mockResolvedValue(true);
		// The action's refund runs inside withUser; run the callback with a stub tx.
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (tx: unknown) => unknown) => Promise.resolve(fn({})),
		);
	});

	describe("writeItemDescription", () => {
		it("charges before the model runs and keeps the charge on success", async () => {
			mocks.generateText.mockResolvedValue('"A rich, velvety espresso shot."');

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(true);
			expect(res.data).toBe("A rich, velvety espresso shot.");
			expect(mocks.openAiTurn).toHaveBeenCalledWith(
				ME,
				expect.objectContaining({ catalogue: "cafe", kind: "describe" }),
			);
			// The turn is opened before the model call, not after it.
			expect(mocks.openAiTurn.mock.invocationCallOrder[0]).toBeLessThan(
				mocks.generateText.mock.invocationCallOrder[0],
			);
			expect(mocks.refundAiTurn).not.toHaveBeenCalled();
		});

		it("refunds the charge when the model call throws", async () => {
			mocks.generateText.mockRejectedValue(new Error("boom"));

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("ai_error");
			expect(mocks.refundAiTurn).toHaveBeenCalledTimes(1);
		});

		it("refunds the charge when the model returns nothing usable", async () => {
			mocks.generateText.mockResolvedValue('  ""  ');

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(mocks.refundAiTurn).toHaveBeenCalledTimes(1);
		});
	});

	describe("gating", () => {
		it("returns a limit error and never calls DeepSeek when over quota", async () => {
			mocks.openAiTurn.mockResolvedValue({
				ok: false,
				error: "You have reached your monthly AI limit.",
				code: "limit",
			});

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("limit");
			expect(mocks.generateText).not.toHaveBeenCalled();
		});

		it("blocks a non-owner without calling DeepSeek", async () => {
			mocks.openAiTurn.mockResolvedValue({
				ok: false,
				error: "Catalogue not found.",
				code: "not_found",
			});

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("not_found");
			expect(mocks.generateText).not.toHaveBeenCalled();
		});

		it("blocks an unauthenticated caller", async () => {
			mocks.getVerifiedIdentity.mockResolvedValue(null);

			const res = await writeItemDescription("cafe", { itemName: "Espresso" });

			expect(res.success).toBe(false);
			expect(res.code).toBe("unauthorized");
			expect(mocks.openAiTurn).not.toHaveBeenCalled();
			expect(mocks.generateText).not.toHaveBeenCalled();
		});
	});
});
