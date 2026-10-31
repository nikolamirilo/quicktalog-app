import { EventName } from "@paddle/paddle-node-sdk";
import { tiers } from "@quicktalog/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	selectResults: [] as unknown[][],
	sets: [] as Record<string, unknown>[],
	sendSubscriptionCancelationEmail: vi.fn(),
	captureMessage: vi.fn(),
	applyPlanDowngrade: vi.fn(),
}));

// A drizzle chain stand-in: any method returns itself, awaiting it yields `result`.
const chain = (result: unknown): any => {
	const proxy: any = new Proxy(() => proxy, {
		get: (_target, prop) =>
			prop === "then"
				? (resolve: (v: unknown) => void) => resolve(result)
				: () => proxy,
	});
	return proxy;
};

const tx = {
	select: () => chain(mocks.selectResults.shift() ?? []),
	insert: () => chain(undefined),
	update: () => ({
		set: (values: Record<string, unknown>) => {
			mocks.sets.push(values);
			return chain(undefined);
		},
	}),
};

vi.mock("@/utils/db/admin", () => ({
	asAdmin: (_name: string, fn: (t: typeof tx) => unknown) => fn(tx),
}));
vi.mock("@/lib/paddle/resolve-user", () => ({
	resolveUserId: async () => ({ userId: "user_1" }),
}));
vi.mock("@/lib/entitlements/catalogue", () => ({
	applyPlanDowngrade: mocks.applyPlanDowngrade,
}));
vi.mock("@/lib/cache/revalidate", () => ({
	revalidateCatalogue: vi.fn(),
	revalidateDashboard: vi.fn(),
}));
vi.mock("@/actions/paddle", () => ({ cancelSubscription: vi.fn() }));
vi.mock("@/lib/email/transactional", () => ({
	sendSubscriptionCancelationEmail: mocks.sendSubscriptionCancelationEmail,
}));
vi.mock("@sentry/nextjs", () => ({
	captureException: vi.fn(),
	captureMessage: mocks.captureMessage,
}));

import { ProcessWebhook } from "@/utils/paddle/process-webhook";

const canceled = {
	eventType: EventName.SubscriptionCanceled,
	occurredAt: "2026-10-22T10:00:00Z",
	data: {
		id: "sub_old",
		status: "canceled",
		customerId: "ctm_1",
		items: [{ price: { id: "pri_basic", productId: "pro_1" } }],
		scheduledChange: null,
	},
} as any;

const user = (planId: string) => ({
	name: "Ana",
	email: "ana@example.com",
	planId,
});

describe("ProcessWebhook on subscription.canceled", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mocks.selectResults = [];
		mocks.sets = [];
		mocks.applyPlanDowngrade.mockResolvedValue({
			deactivated: [],
			trackingCleared: [],
		});
	});

	it("keeps the plan and sends no email when the old subscription of an upgrade is canceled", async () => {
		mocks.selectResults = [[{ status: "active" }], [user("pri_growth")]];
		await new ProcessWebhook().processEvent(canceled);
		expect(mocks.sets).toEqual([]);
		expect(mocks.sendSubscriptionCancelationEmail).not.toHaveBeenCalled();
	});

	it("downgrades and emails when the current plan's subscription is canceled", async () => {
		mocks.selectResults = [[], [user("pri_basic")]];
		await new ProcessWebhook().processEvent(canceled);
		expect(mocks.sets).toEqual([{ planId: tiers[0].priceId.month }]);
		expect(mocks.sendSubscriptionCancelationEmail).toHaveBeenCalledWith({
			email: "ana@example.com",
			name: "Ana",
			unpublished: [],
		});
	});

	it("reports a cancel it cannot explain instead of downgrading", async () => {
		mocks.selectResults = [[{ status: "canceled" }], [user("pri_growth")]];
		await new ProcessWebhook().processEvent(canceled);
		expect(mocks.sets).toEqual([]);
		expect(mocks.sendSubscriptionCancelationEmail).not.toHaveBeenCalled();
		expect(mocks.captureMessage).toHaveBeenCalledWith(
			"Paddle cancel left the user on a plan no live subscription pays for",
			expect.objectContaining({ level: "warning" }),
		);
	});
});
