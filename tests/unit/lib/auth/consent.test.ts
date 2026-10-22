import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	withUser: vi.fn(),
	execute: vi.fn(),
	captureException: vi.fn(),
}));

vi.mock("@/utils/db", () => ({ withUser: mocks.withUser }));
vi.mock("@sentry/nextjs", () => ({ captureException: mocks.captureException }));

import { needsConsentGate } from "@/lib/auth/consent";
import type { VerifiedIdentity } from "@/lib/auth/identity";

const ME = {
	userId: "11111111-1111-1111-1111-111111111111",
	sessionId: "sess_1",
	provider: "supabase",
} as unknown as VerifiedIdentity;

/** The literal SQL of a drizzle template; parameters are separate chunks. */
const sqlText = (query: unknown) =>
	(query as { queryChunks: { value?: unknown }[] }).queryChunks
		.map((chunk) => (Array.isArray(chunk.value) ? chunk.value.join("") : ""))
		.join("");

describe("needsConsentGate", () => {
	beforeEach(() => {
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (tx: unknown) => unknown) =>
				Promise.resolve(fn({ execute: mocks.execute })),
		);
	});

	it("gates a user whose stamp is an older version", async () => {
		mocks.execute.mockResolvedValue([
			{ accepted: "2026-01-01", current: "2026-10-15" },
		]);
		// `previous` is what tells the screen to say the terms changed rather
		// than greeting them as a first-time acceptance.
		expect(await needsConsentGate(ME)).toEqual({
			previous: "2026-01-01",
			status: "needed",
			version: "2026-10-15",
		});
	});

	it("gates a user who has never accepted, which is every Google sign-up", async () => {
		mocks.execute.mockResolvedValue([
			{ accepted: null, current: "2026-10-15" },
		]);
		expect(await needsConsentGate(ME)).toEqual({
			previous: null,
			status: "needed",
			version: "2026-10-15",
		});
	});

	it("lets a matching stamp through", async () => {
		mocks.execute.mockResolvedValue([
			{ accepted: "2026-10-15", current: "2026-10-15" },
		]);
		expect(await needsConsentGate(ME)).toEqual({ status: "satisfied" });
	});

	it("treats no terms version as nothing to accept, rather than locking the account", async () => {
		mocks.execute.mockResolvedValue([{ accepted: null, current: null }]);
		expect(await needsConsentGate(ME)).toEqual({ status: "satisfied" });
	});

	it("does not gate a user who has no row yet", async () => {
		mocks.execute.mockResolvedValue([]);
		expect(await needsConsentGate(ME)).toEqual({ status: "satisfied" });
	});

	it("reports a failed read as unknown, never as satisfied", async () => {
		mocks.execute.mockRejectedValue(new Error("statement timeout"));
		// Folding this into `satisfied` is what bounced the user between /admin
		// and /auth/consent: the two sides ask in separate requests.
		expect(await needsConsentGate(ME)).toEqual({ status: "unknown" });
		expect(mocks.captureException).toHaveBeenCalled();
	});

	it("scopes the read to the caller's own row", async () => {
		mocks.execute.mockResolvedValue([
			{ accepted: "2026-10-15", current: "2026-10-15" },
		]);
		await needsConsentGate(ME);
		expect(mocks.withUser).toHaveBeenCalledWith(ME, expect.any(Function));
		expect(sqlText(mocks.execute.mock.calls[0][0])).toContain("where u.id =");
	});
});
