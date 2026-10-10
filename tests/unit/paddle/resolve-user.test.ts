import { beforeAll, describe, expect, it } from "vitest";
import type { Tx } from "@/utils/db/admin";

beforeAll(() => {
	process.env.PADDLE_CUSTOM_DATA_SECRET = "test-paddle-custom-data-secret";
});

const { signUserId } = await import("@/lib/paddle/signature");
const { resolveUserId } = await import("@/lib/paddle/resolve-user");

/** Minimal stand-in for the Drizzle chains resolveUserId uses. */
function fakeTx({
	linked = [] as { id: string }[],
	updated = [] as { id: string }[],
} = {}) {
	const updates: { where: unknown }[] = [];
	const tx = {
		select: () => ({
			from: () => ({ where: () => ({ limit: async () => linked }) }),
		}),
		update: () => ({
			set: () => ({
				where: (where: unknown) => {
					updates.push({ where });
					return { returning: async () => updated };
				},
			}),
		}),
	} as unknown as Tx;
	return { tx, updates };
}

const signedFor = (userId: string) => ({
	user_id: userId,
	sig: signUserId(userId),
});

describe("resolveUserId", () => {
	it("uses the user the customer is already linked to", async () => {
		const { tx } = fakeTx({ linked: [{ id: "user_a" }] });
		await expect(resolveUserId(tx, null, "ctm_1")).resolves.toEqual({
			userId: "user_a",
		});
	});

	it("reports a conflict when signed data names another user", async () => {
		const { tx } = fakeTx({ linked: [{ id: "user_a" }] });
		await expect(
			resolveUserId(tx, signedFor("user_b"), "ctm_1"),
		).resolves.toEqual({ unresolved: "conflict" });
	});

	it("links an unlinked user when the signature is valid", async () => {
		const { tx, updates } = fakeTx({ updated: [{ id: "user_b" }] });
		await expect(
			resolveUserId(tx, signedFor("user_b"), "ctm_1"),
		).resolves.toEqual({ userId: "user_b" });
		expect(updates).toHaveLength(1);
	});

	it("does not link when the customer is unknown and data is unsigned", async () => {
		const { tx, updates } = fakeTx();
		await expect(
			resolveUserId(tx, { user_id: "user_b", sig: "forged" }, "ctm_1"),
		).resolves.toEqual({ unresolved: "unlinked" });
		expect(updates).toHaveLength(0);
	});

	it("reports unlinked when the signed user already has another customer", async () => {
		const { tx } = fakeTx({ updated: [] });
		await expect(
			resolveUserId(tx, signedFor("user_b"), "ctm_1"),
		).resolves.toEqual({ unresolved: "unlinked" });
	});
});
