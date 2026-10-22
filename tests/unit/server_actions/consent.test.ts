import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getVerifiedIdentity: vi.fn(),
	withUser: vi.fn(),
	execute: vi.fn(),
	captureException: vi.fn(),
}));

vi.mock("@/lib/auth/identity", () => ({
	getVerifiedIdentity: mocks.getVerifiedIdentity,
}));
vi.mock("@/utils/db", async () => {
	const { pgError } = await import("@/utils/db/errors");
	return { pgError, withUser: mocks.withUser };
});
vi.mock("@sentry/nextjs", () => ({ captureException: mocks.captureException }));

import { acceptLegalTerms } from "@/actions/consent";

const ME = {
	userId: "11111111-1111-1111-1111-111111111111",
	sessionId: "sess_1",
	provider: "supabase",
};

const pgThrow = (code: string) =>
	Object.assign(new Error(`pg ${code}`), { code });

/** The literal SQL of a drizzle template; parameters are separate chunks. */
const sqlText = (query: unknown) =>
	(query as { queryChunks: { value?: unknown }[] }).queryChunks
		.map((chunk) => (Array.isArray(chunk.value) ? chunk.value.join("") : ""))
		.join("");

describe("acceptLegalTerms", () => {
	beforeEach(() => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		mocks.getVerifiedIdentity.mockResolvedValue(ME);
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (tx: unknown) => unknown) =>
				Promise.resolve(fn({ execute: mocks.execute })),
		);
		mocks.execute.mockResolvedValue([]);
	});

	it("records the version the gate showed", async () => {
		expect(await acceptLegalTerms("2026-10-15")).toEqual({ accepted: true });
		expect(mocks.withUser).toHaveBeenCalledWith(ME, expect.any(Function));
		expect(sqlText(mocks.execute.mock.calls[0][0])).toContain(
			"private.record_consents",
		);
	});

	it("refuses when nobody is signed in, without touching the database", async () => {
		mocks.getVerifiedIdentity.mockResolvedValue(null);
		expect(await acceptLegalTerms("2026-10-15")).toEqual({ accepted: false });
		expect(mocks.withUser).not.toHaveBeenCalled();
	});

	it("rejects an empty or oversized version before asking who is calling", async () => {
		expect(await acceptLegalTerms("")).toEqual({ accepted: false });
		expect(await acceptLegalTerms("x".repeat(65))).toEqual({
			accepted: false,
		});
		expect(mocks.getVerifiedIdentity).not.toHaveBeenCalled();
	});

	it("reports a stale version instead of capturing it as a failure", async () => {
		mocks.execute.mockRejectedValue(pgThrow("22023"));
		expect(await acceptLegalTerms("2026-01-01")).toEqual({
			accepted: false,
			stale: true,
		});
		expect(mocks.captureException).not.toHaveBeenCalled();
	});

	it("captures any other database failure", async () => {
		mocks.execute.mockRejectedValue(pgThrow("42501"));
		expect(await acceptLegalTerms("2026-10-15")).toEqual({ accepted: false });
		expect(mocks.captureException).toHaveBeenCalled();
	});
});
