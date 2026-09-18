import { EventName } from "@paddle/paddle-node-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	asAdmin: vi.fn(),
	cancelSubscription: vi.fn(),
	sendSubscriptionCancelationEmail: vi.fn(),
	captureMessage: vi.fn(),
}));

vi.mock("@/utils/db/admin", () => ({ asAdmin: mocks.asAdmin }));
vi.mock("@/actions/paddle", () => ({
	cancelSubscription: mocks.cancelSubscription,
}));
vi.mock("@/actions/email", () => ({
	sendSubscriptionCancelationEmail: mocks.sendSubscriptionCancelationEmail,
}));
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
	captureMessage: mocks.captureMessage,
}));

import { ProcessWebhook } from "@/utils/paddle/process-webhook";

const subscriptionEvent = (eventType: EventName) =>
	({
		eventType,
		data: {
			id: "sub_1",
			status: "active",
			customerId: "ctm_1",
			items: [{ price: { id: "pri_paid", productId: "pro_1" } }],
			scheduledChange: null,
		},
	}) as any;

describe("ProcessWebhook", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("rethrows database errors so the route answers 500 and Paddle retries", async () => {
		mocks.asAdmin.mockRejectedValue(new Error("connection refused"));
		await expect(
			new ProcessWebhook().processEvent(
				subscriptionEvent(EventName.SubscriptionCreated),
			),
		).rejects.toThrow("connection refused");
	});

	it("does not throw for a subscription whose customer is not linked yet", async () => {
		mocks.asAdmin.mockResolvedValue({ kind: "unlinked" });
		await expect(
			new ProcessWebhook().processEvent(
				subscriptionEvent(EventName.SubscriptionCreated),
			),
		).resolves.toBeUndefined();
		expect(mocks.cancelSubscription).not.toHaveBeenCalled();
	});

	it("cancels other active subscriptions only after the plan update committed", async () => {
		mocks.asAdmin.mockResolvedValue({
			kind: "activated",
			otherActiveSubscriptionIds: ["sub_old"],
		});
		await new ProcessWebhook().processEvent(
			subscriptionEvent(EventName.SubscriptionActivated),
		);
		expect(mocks.cancelSubscription).toHaveBeenCalledWith("sub_old");
	});

	it("emails the user after a downgrade on cancellation", async () => {
		mocks.asAdmin.mockResolvedValue({
			kind: "downgraded",
			user: { name: "Ana", email: "ana@example.com" },
		});
		await new ProcessWebhook().processEvent(
			subscriptionEvent(EventName.SubscriptionCanceled),
		);
		expect(mocks.sendSubscriptionCancelationEmail).toHaveBeenCalledWith({
			email: "ana@example.com",
			name: "Ana",
		});
	});

	it("reports a customer that cannot be linked to exactly one user", async () => {
		mocks.asAdmin.mockResolvedValue(2);
		await new ProcessWebhook().processEvent({
			eventType: EventName.CustomerCreated,
			data: { id: "ctm_1", email: "Shared@Example.com" },
		} as any);
		expect(mocks.captureMessage).toHaveBeenCalledWith(
			"Paddle customer not linked to a single user",
			expect.objectContaining({ extra: { customerId: "ctm_1", matches: 2 } }),
		);
	});
});
