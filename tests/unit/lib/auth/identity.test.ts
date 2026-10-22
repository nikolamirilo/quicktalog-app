import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ auth: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));

import {
	getVerifiedIdentity,
	identityFromSupabaseAuth,
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

describe("identityFromSupabaseAuth", () => {
	const claims = (extra: Record<string, unknown> = {}) => ({
		data: {
			claims: {
				sub: "3f1a7c9e-2b4d-4a6f-8c1e-5d9b7a2f4e60",
				role: "authenticated",
				session_id: "sess_sb",
				...extra,
			},
		},
		error: null,
	});

	const auth = (result: unknown) =>
		({ getClaims: async () => result }) as never;

	it("accepts a verified session and keeps the uuid as the user id", async () => {
		await expect(identityFromSupabaseAuth(auth(claims()))).resolves.toEqual({
			userId: "3f1a7c9e-2b4d-4a6f-8c1e-5d9b7a2f4e60",
			sessionId: "sess_sb",
			provider: "supabase",
		});
	});

	it("refuses an anonymous session", async () => {
		await expect(
			identityFromSupabaseAuth(auth(claims({ is_anonymous: true }))),
		).resolves.toBeNull();
	});

	it("refuses a token that is not for an authenticated user", async () => {
		await expect(
			identityFromSupabaseAuth(auth(claims({ role: "anon" }))),
		).resolves.toBeNull();
	});

	it("refuses a subject that is not a uuid", async () => {
		await expect(
			identityFromSupabaseAuth(auth(claims({ sub: "user_clerkish" }))),
		).resolves.toBeNull();
	});

	it("refuses when verification failed", async () => {
		await expect(
			identityFromSupabaseAuth(
				auth({ data: null, error: new Error("bad signature") }),
			),
		).resolves.toBeNull();
	});
});
