import { describe, expect, it } from "vitest";
import {
	legacyClerkId,
	type MappedUser,
	type PaddleSubscription,
	planAction,
	signerFor,
} from "@/scripts/paddle/rewrite-legacy-custom-data";

const CLERK = "user_2aAaaaaaaaaaaaaaaaaaaaa1";
const UUID = "3f1a7c9e-2b4d-4a6f-8c1e-5d9b7a2f4e60";
const sign = (id: string) => `sig:${id}`;

const sub = (over: Partial<PaddleSubscription> = {}): PaddleSubscription => ({
	id: "sub_1",
	status: "active",
	customerId: "ctm_1",
	customData: { user_id: CLERK, sig: "old", source: "pricing" },
	...over,
});

const mapOf = (user: MappedUser) => new Map([[CLERK, user]]);

describe("legacyClerkId", () => {
	it("finds a Clerk id in custom data", () => {
		expect(legacyClerkId(sub())).toBe(CLERK);
	});

	it("ignores a subscription already on a uuid, or without custom data", () => {
		expect(legacyClerkId(sub({ customData: { user_id: UUID } }))).toBeNull();
		expect(legacyClerkId(sub({ customData: null }))).toBeNull();
	});
});

describe("planAction", () => {
	it("rewrites to the mapped uuid, re-signed, keeping other keys", () => {
		expect(
			planAction(
				sub(),
				CLERK,
				mapOf({ userId: UUID, customerId: "ctm_1" }),
				sign,
			),
		).toEqual({
			kind: "rewrite",
			userId: UUID,
			customData: { user_id: UUID, sig: `sig:${UUID}`, source: "pricing" },
		});
	});

	it("rewrites for a user who is not linked to a customer yet", () => {
		expect(
			planAction(sub(), CLERK, mapOf({ userId: UUID, customerId: null }), sign)
				.kind,
		).toBe("rewrite");
	});

	it("refuses when the mapped user owns a different Paddle customer", () => {
		expect(
			planAction(
				sub(),
				CLERK,
				mapOf({ userId: UUID, customerId: "ctm_2" }),
				sign,
			),
		).toEqual({ kind: "customer-mismatch", userId: UUID });
	});

	it("reports a Clerk id with no map row", () => {
		expect(planAction(sub(), CLERK, new Map(), sign)).toEqual({
			kind: "unmapped",
		});
	});

	it("only reports a canceled subscription, which Paddle will not update", () => {
		expect(
			planAction(
				sub({ status: "canceled" }),
				CLERK,
				mapOf({ userId: UUID, customerId: "ctm_1" }),
				sign,
			),
		).toEqual({ kind: "canceled", userId: UUID });
	});
});

describe("signerFor", () => {
	it("matches the app's v1 HMAC format", async () => {
		process.env.PADDLE_CUSTOM_DATA_SECRET = "test-secret";
		const { signUserId } = await import("@/lib/paddle/signature");
		expect(signerFor("test-secret")(UUID)).toBe(signUserId(UUID));
	});
});
