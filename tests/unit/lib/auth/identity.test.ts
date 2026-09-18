import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));

import {
	getVerifiedIdentity,
	requireIdentity,
	UnauthorizedError,
} from "@/lib/auth/identity";

describe("getVerifiedIdentity (Clerk)", () => {
	beforeEach(() => {
		mocks.auth.mockReset();
	});

	it("returns the Clerk user id and session", async () => {
		mocks.auth.mockResolvedValue({
			userId: "user_3JKGwhqCeeGEfYNS0vLEbDUmECk",
			sessionId: "sess_1",
		});
		await expect(getVerifiedIdentity()).resolves.toEqual({
			userId: "user_3JKGwhqCeeGEfYNS0vLEbDUmECk",
			sessionId: "sess_1",
			provider: "clerk",
		});
	});

	it("returns null when signed out", async () => {
		mocks.auth.mockResolvedValue({ userId: null, sessionId: null });
		await expect(getVerifiedIdentity()).resolves.toBeNull();
	});

	it("rejects ids that are not Clerk user ids", async () => {
		mocks.auth.mockResolvedValue({ userId: "admin", sessionId: null });
		await expect(getVerifiedIdentity()).resolves.toBeNull();
	});

	it("returns a frozen identity", async () => {
		mocks.auth.mockResolvedValue({
			userId: "user_3JKGwhqCeeGEfYNS0vLEbDUmECk",
			sessionId: null,
		});
		const me = await getVerifiedIdentity();
		expect(Object.isFrozen(me)).toBe(true);
	});
});

describe("requireIdentity", () => {
	it("throws UnauthorizedError when signed out", async () => {
		mocks.auth.mockResolvedValue({ userId: null, sessionId: null });
		await expect(requireIdentity()).rejects.toBeInstanceOf(UnauthorizedError);
	});
});
