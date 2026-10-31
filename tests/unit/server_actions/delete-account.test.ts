import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	afterCallbacks: [] as (() => unknown)[],
	revalidateCatalogue: vi.fn(),
	deleteUser: vi.fn(async () => ({ error: null })),
}));

vi.mock("next/server", () => ({
	after: (fn: () => unknown) => {
		mocks.afterCallbacks.push(fn);
	},
}));
vi.mock("@/lib/auth/identity", () => ({
	requireFreshUser: async () => ({
		userId: "0101af55-4215-451a-bcca-de2c82ac8cfd",
		email: null,
	}),
	requireIdentity: vi.fn(),
	UnauthorizedError: class extends Error {},
}));
vi.mock("@/lib/users/footprint", () => ({
	loadUserFootprint: async () => ({
		activeSubscriptionIds: [],
		catalogueNames: ["menu"],
		catalogueIds: ["c1"],
	}),
}));
vi.mock("@/lib/cache/revalidate", () => ({
	revalidateCatalogue: mocks.revalidateCatalogue,
	revalidateDashboard: vi.fn(),
}));
vi.mock("@/lib/catalogue/draft-cache", () => ({
	deleteDrafts: vi.fn(async () => {}),
}));
vi.mock("@/utils/supabase/auth-admin", () => ({
	authAdmin: () => ({ deleteUser: mocks.deleteUser }),
}));
vi.mock("@/actions/paddle", () => ({ cancelSubscription: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ withinRateLimit: vi.fn() }));
vi.mock("@/utils/db", () => ({ withUser: vi.fn() }));
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));

import { deleteAccount } from "@/actions/account";

describe("deleteAccount", () => {
	beforeEach(() => {
		mocks.afterCallbacks.length = 0;
		mocks.revalidateCatalogue.mockClear();
	});

	// Revalidating inside the action makes Next re-render the still-open
	// dashboard with the deleted user's token, so getUserData throws not_found.
	it("revalidates public pages only after the response is sent", async () => {
		const result = await deleteAccount();

		expect(result).toEqual({ success: true });
		expect(mocks.revalidateCatalogue).not.toHaveBeenCalled();

		for (const callback of mocks.afterCallbacks) await callback();

		expect(mocks.revalidateCatalogue).toHaveBeenCalledWith("menu");
		expect(mocks.revalidateCatalogue).toHaveBeenCalledWith();
	});
});
