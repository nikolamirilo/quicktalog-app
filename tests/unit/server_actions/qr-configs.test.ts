import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	getVerifiedIdentity: vi.fn(),
	withUser: vi.fn(),
	upsertOwnedQrConfig: vi.fn(),
	captureException: vi.fn(),
}));

vi.mock("@/lib/auth/identity", () => ({
	getVerifiedIdentity: mocks.getVerifiedIdentity,
}));
vi.mock("@/lib/qr/configs", () => ({
	upsertOwnedQrConfig: mocks.upsertOwnedQrConfig,
}));
vi.mock("@/utils/db", async () => {
	const { pgError } = await import("@/utils/db/errors");
	return { withUser: mocks.withUser, pgError };
});
vi.mock("@sentry/nextjs", () => ({ captureException: mocks.captureException }));

import { upsertQrConfig } from "@/actions/qr-configs";
import { defaultQrConfig, type QrConfig } from "@/lib/qr/design";

const ME = { userId: "user_1", sessionId: "sess_1", provider: "clerk" };

describe("upsertQrConfig", () => {
	beforeEach(() => {
		vi.stubEnv("NEXT_PUBLIC_BASE_URL", "https://www.quicktalog.test");
		mocks.getVerifiedIdentity.mockResolvedValue(ME);
		mocks.withUser.mockImplementation(
			(_me: unknown, fn: (tx: unknown) => unknown) => Promise.resolve(fn({})),
		);
		mocks.upsertOwnedQrConfig.mockResolvedValue(true);
	});

	it("checks identity before anything else", async () => {
		mocks.getVerifiedIdentity.mockResolvedValue(null);
		const result = await upsertQrConfig("a", defaultQrConfig("x"));
		expect(result).toEqual({ success: false, error: "Unauthorized" });
		expect(mocks.withUser).not.toHaveBeenCalled();
	});

	it("stores the parsed design with the catalogue's own URL", async () => {
		const config = {
			...defaultQrConfig("https://evil.test"),
			extra: "dropped",
		} as QrConfig;
		expect(await upsertQrConfig("bean-there", config)).toEqual({
			success: true,
		});
		const stored = mocks.upsertOwnedQrConfig.mock.calls[0][3];
		expect(stored.data).toBe(
			"https://www.quicktalog.test/catalogues/bean-there",
		);
		expect(stored).not.toHaveProperty("extra");
	});

	it("refuses a hostile design without touching the database", async () => {
		const config = {
			...defaultQrConfig("x"),
			image: "data:image/png;base64,AAAA",
		};
		expect(await upsertQrConfig("a", config)).toEqual({
			success: false,
			error: "Invalid QR design",
		});
		expect(mocks.withUser).not.toHaveBeenCalled();
	});

	it("maps the database size check to a user-facing error, not Sentry", async () => {
		mocks.withUser.mockRejectedValue(
			Object.assign(new Error("wrapped"), {
				cause: { code: "23514", constraint_name: "qr_configs_config_size" },
			}),
		);
		const result = await upsertQrConfig("a", defaultQrConfig("x"));
		expect(result.success).toBe(false);
		expect(result.error).toMatch(/Design too large/);
		expect(mocks.captureException).not.toHaveBeenCalled();
	});

	it("reports a missing catalogue as not found", async () => {
		mocks.upsertOwnedQrConfig.mockResolvedValue(false);
		expect(await upsertQrConfig("a", defaultQrConfig("x"))).toEqual({
			success: false,
			error: "Catalogue not found",
		});
	});
});
