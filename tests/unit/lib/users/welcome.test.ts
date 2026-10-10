import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	send: vi.fn(),
	withUser: vi.fn(),
	captureException: vi.fn(),
}));

vi.mock("@/utils/db", () => ({ withUser: mocks.withUser }));
vi.mock("@/lib/email/transactional", () => ({
	sendWelcomeEmailSafely: mocks.send,
}));
vi.mock("@sentry/nextjs", () => ({
	captureException: mocks.captureException,
}));

import { sendWelcomeEmailOnce } from "@/lib/users/welcome";

const me = { userId: "u-1", sessionId: "s-1", provider: "supabase" } as never;

/** `withUser` hands the callback a tx; the claim's rows are all that matter. */
const claimReturns = (rows: unknown[]) =>
	mocks.withUser.mockImplementation(async (_me, fn) =>
		fn({ execute: async () => rows }),
	);

describe("sendWelcomeEmailOnce", () => {
	beforeEach(() => {
		mocks.send.mockReset();
		mocks.withUser.mockReset();
		mocks.captureException.mockReset();
	});

	it("sends to the address the claim returned", async () => {
		claimReturns([{ email: "new@example.com", name: "Ana" }]);
		await sendWelcomeEmailOnce(me);
		expect(mocks.send).toHaveBeenCalledWith("new@example.com", "Ana");
	});

	it("sends nothing when the claim matched no row", async () => {
		// The second caller in a race, and every later page load, land here.
		claimReturns([]);
		await sendWelcomeEmailOnce(me);
		expect(mocks.send).not.toHaveBeenCalled();
	});

	it("sends nothing when the claimed row has no address", async () => {
		claimReturns([{ email: null, name: "Ana" }]);
		await sendWelcomeEmailOnce(me);
		expect(mocks.send).not.toHaveBeenCalled();
	});

	it("falls back to an empty name rather than printing null", async () => {
		claimReturns([{ email: "new@example.com", name: null }]);
		await sendWelcomeEmailOnce(me);
		expect(mocks.send).toHaveBeenCalledWith("new@example.com", "");
	});

	it("never throws when the claim fails, and sends nothing", async () => {
		// A failed claim leaves welcome_email_sent_at null, so the next visit
		// retries; what must not happen is the dashboard load failing.
		mocks.withUser.mockRejectedValue(new Error("42501"));
		await expect(sendWelcomeEmailOnce(me)).resolves.toBeUndefined();
		expect(mocks.send).not.toHaveBeenCalled();
		expect(mocks.captureException).toHaveBeenCalled();
	});

	it("closes the database block before sending", async () => {
		// An open wrapper across a network call pins a pooled connection.
		const order: string[] = [];
		mocks.withUser.mockImplementation(async (_me, fn) => {
			order.push("tx:open");
			const rows = await fn({
				execute: async () => [{ email: "new@example.com", name: "Ana" }],
			});
			order.push("tx:close");
			return rows;
		});
		mocks.send.mockImplementation(async () => {
			order.push("send");
		});

		await sendWelcomeEmailOnce(me);
		expect(order).toEqual(["tx:open", "tx:close", "send"]);
	});
});
