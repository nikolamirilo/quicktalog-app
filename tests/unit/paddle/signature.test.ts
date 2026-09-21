import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
	process.env.PADDLE_CUSTOM_DATA_SECRET = "test-paddle-custom-data-secret";
});

const { signUserId, verifyUserIdSig } = await import("@/lib/paddle/signature");

describe("Paddle custom data signature", () => {
	it("accepts a signature it produced", () => {
		const userId = "user_3JKGwhqCeeGEfYNS0vLEbDUmECk";
		expect(verifyUserIdSig(userId, signUserId(userId))).toBe(true);
	});

	it("rejects a signature made for another user", () => {
		expect(verifyUserIdSig("user_a", signUserId("user_b"))).toBe(false);
	});

	it("rejects missing, malformed and oversized input", () => {
		expect(verifyUserIdSig("user_a", undefined)).toBe(false);
		expect(verifyUserIdSig(undefined, "abc")).toBe(false);
		expect(verifyUserIdSig("", signUserId(""))).toBe(false);
		expect(verifyUserIdSig("u".repeat(65), signUserId("u".repeat(65)))).toBe(
			false,
		);
	});
});
