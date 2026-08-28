import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
	// Must be declared in here: `vi.mock` factories are hoisted above the file's
	// own top-level declarations.
	class DeepseekResponseError extends Error {
		constructor(readonly reason: "truncated" | "invalid_json") {
			super(reason);
		}
	}

	return {
		currentUser: vi.fn(),
		findFirst: vi.fn(),
		insertValues: vi.fn(),
		fetchUserData: vi.fn(),
		generateJSON: vi.fn(),
		generateText: vi.fn(),
		generateChatJSON: vi.fn(),
		DeepseekResponseError,
	};
});

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
	generateJSON: mocks.generateJSON,
	generateText: mocks.generateText,
	generateChatJSON: mocks.generateChatJSON,
	DeepseekResponseError: mocks.DeepseekResponseError,
}));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import {
	chatEditCatalogue,
	generateCategoryItems,
	parseItemsFromText,
	writeItemDescription,
} from "@/server_actions/ai";
import type { Catalogue } from "@quicktalog/common";
import { defaultCatalogueData } from "@quicktalog/common";

const chatCatalogue = {
	...defaultCatalogueData,
	id: "cat-1",
	name: "cafe",
	content: [
		{
			id: "sec-1",
			order: 0,
			type: "category",
			name: "Drinks",
			layout: "variant_1",
			isExpanded: true,
			items: [
				{
					id: "it-1",
					order: 0,
					name: "Espresso",
					description: "",
					image: "",
					price: 2.5,
				},
			],
		},
	],
} as Catalogue;

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

	describe("parseItemsFromText", () => {
		it("returns zod-valid items and fills defaults", async () => {
			mocks.generateJSON.mockResolvedValue({
				items: [
					{
						name: "Espresso",
						description: "Strong",
						price: 2.5,
						isFree: false,
					},
					{ name: "Latte", price: 4 },
				],
			});

			const res = await parseItemsFromText(
				"cafe",
				"Espresso 2.50\nLatte 4",
				"EUR",
			);

			expect(res.success).toBe(true);
			expect(res.data).toHaveLength(2);
			expect(res.data?.[0]).toEqual({
				name: "Espresso",
				description: "Strong",
				price: 2.5,
				isFree: false,
			});
			// Missing fields are filled with schema defaults.
			expect(res.data?.[1]).toEqual({
				name: "Latte",
				description: "",
				price: 4,
				isFree: false,
			});
			expect(mocks.insertValues).toHaveBeenCalledTimes(1);
		});

		it("rejects malformed model output without metering", async () => {
			mocks.generateJSON.mockResolvedValue({
				items: [{ description: "no name" }],
			});

			const res = await parseItemsFromText("cafe", "junk", "EUR");

			expect(res.success).toBe(false);
			expect(res.code).toBe("ai_error");
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});
	});

	describe("generateCategoryItems", () => {
		it("returns validated items from a brief", async () => {
			mocks.generateJSON.mockResolvedValue({
				items: [{ name: "Pancakes", description: "Fluffy", price: 6 }],
			});

			const res = await generateCategoryItems("cafe", {
				name: "Breakfast",
				description: "classic breakfast",
				currency: "EUR",
			});

			expect(res.success).toBe(true);
			expect(res.data?.[0].name).toBe("Pancakes");
			expect(mocks.insertValues).toHaveBeenCalledTimes(1);
		});
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

	describe("chatEditCatalogue", () => {
		it("resolves snapshot indices to ids and meters the prompt", async () => {
			mocks.generateChatJSON.mockResolvedValue({
				reply: "Updated the price.",
				operations: [{ op: "update_item", section: 0, item: 0, price: 3 }],
			});

			const res = await chatEditCatalogue("cafe", {
				message: "make the espresso 3 euros",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(true);
			expect(res.data?.reply).toBe("Updated the price.");
			expect(res.data?.operations).toEqual([
				{
					op: "update_item",
					sectionId: "sec-1",
					itemId: "it-1",
					name: undefined,
					description: undefined,
					price: 3,
					isFree: undefined,
					denominator: undefined,
				},
			]);
			expect(mocks.insertValues).toHaveBeenCalledTimes(1);
		});

		it("meters a question that produces no edits", async () => {
			mocks.generateChatJSON.mockResolvedValue({
				reply: "Which section did you mean?",
				operations: [],
			});

			const res = await chatEditCatalogue("cafe", {
				message: "change it",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(true);
			expect(res.data?.operations).toEqual([]);
			expect(mocks.insertValues).toHaveBeenCalledTimes(1);
		});

		it("sends prior turns back as context", async () => {
			mocks.generateChatJSON.mockResolvedValue({ reply: "ok", operations: [] });

			await chatEditCatalogue("cafe", {
				message: "and the latte too",
				catalogue: chatCatalogue,
				history: [
					{ role: "user", content: "make the espresso 3 euros" },
					{ role: "assistant", content: "Updated the price." },
				],
			});

			const [messages] = mocks.generateChatJSON.mock.calls[0];
			expect(messages).toHaveLength(4);
			expect(messages[0].role).toBe("system");
			expect(messages[0].content).toContain('[0] category "Drinks"');
			expect(messages[3]).toEqual({
				role: "user",
				content: "and the latte too",
			});
		});

		it("rejects malformed model output without metering", async () => {
			mocks.generateChatJSON.mockResolvedValue({
				operations: [{ op: "drop_database" }],
			});

			const res = await chatEditCatalogue("cafe", {
				message: "delete everything",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(false);
			expect(res.code).toBe("ai_error");
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});

		it("says so plainly when the generated code is too big", async () => {
			mocks.generateChatJSON.mockResolvedValue({
				reply: "Added the game.",
				operations: [
					{
						op: "add_section",
						sectionType: "custom_code",
						code: "x".repeat(45000),
					},
				],
			});

			const res = await chatEditCatalogue("cafe", {
				message: "build super mario",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(false);
			expect(res.error).toMatch(/too big/i);
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});

		it("accepts a widget large enough to be a real game", async () => {
			mocks.generateChatJSON.mockResolvedValue({
				reply: "Added the game.",
				operations: [
					{
						op: "add_section",
						sectionType: "custom_code",
						name: "Game",
						code: `<div>${"x".repeat(30000)}</div>`,
					},
				],
			});

			const res = await chatEditCatalogue("cafe", {
				message: "build a game",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(true);
			expect(res.data?.operations).toHaveLength(1);
		});

		it("explains a truncated reply instead of failing generically", async () => {
			mocks.generateChatJSON.mockRejectedValue(
				new mocks.DeepseekResponseError("truncated"),
			);

			const res = await chatEditCatalogue("cafe", {
				message: "rewrite every description",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(false);
			expect(res.error).toMatch(/fewer changes/i);
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});

		it("refuses an empty message without calling DeepSeek", async () => {
			const res = await chatEditCatalogue("cafe", {
				message: "   ",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(false);
			expect(mocks.generateChatJSON).not.toHaveBeenCalled();
		});

		it("blocks a non-owner even though the catalogue came from the client", async () => {
			mocks.findFirst.mockResolvedValue({ createdBy: "someone_else" });

			const res = await chatEditCatalogue("cafe", {
				message: "delete the drinks section",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(false);
			expect(res.code).toBe("unauthorized");
			expect(mocks.generateChatJSON).not.toHaveBeenCalled();
		});

		it("returns a limit error when the monthly allowance is spent", async () => {
			mocks.fetchUserData.mockResolvedValue(withPlan(5, 5));

			const res = await chatEditCatalogue("cafe", {
				message: "add a desserts section",
				catalogue: chatCatalogue,
			});

			expect(res.success).toBe(false);
			expect(res.code).toBe("limit");
			expect(mocks.generateChatJSON).not.toHaveBeenCalled();
			expect(mocks.insertValues).not.toHaveBeenCalled();
		});
	});

	describe("gating", () => {
		it("returns a limit error and never calls DeepSeek when over quota", async () => {
			mocks.fetchUserData.mockResolvedValue(withPlan(5, 5));

			const res = await parseItemsFromText("cafe", "Espresso 2.50", "EUR");

			expect(res.success).toBe(false);
			expect(res.code).toBe("limit");
			expect(mocks.generateJSON).not.toHaveBeenCalled();
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

			const res = await generateCategoryItems("cafe", {
				name: "Breakfast",
				currency: "EUR",
			});

			expect(res.success).toBe(false);
			expect(res.code).toBe("unauthorized");
			expect(mocks.generateJSON).not.toHaveBeenCalled();
		});
	});
});
