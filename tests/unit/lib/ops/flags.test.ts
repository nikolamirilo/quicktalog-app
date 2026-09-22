import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@vercel/global-config", () => ({ get: mocks.get }));

import {
	accountChangesPaused,
	banner,
	isMaintenance,
	maintenanceBypass,
} from "@/lib/ops/flags";

const env = { ...process.env };

describe("maintenance flag", () => {
	beforeEach(() => {
		mocks.get.mockReset();
		process.env.GLOBAL_CONFIG = "";
		process.env.EDGE_CONFIG = "";
		delete process.env.MAINTENANCE_MODE;
	});
	afterEach(() => {
		process.env = { ...env };
	});

	it("falls back to the environment variable with no store connected", async () => {
		await expect(isMaintenance()).resolves.toBe(false);
		process.env.MAINTENANCE_MODE = "1";
		await expect(isMaintenance()).resolves.toBe(true);
		expect(mocks.get).not.toHaveBeenCalled();
	});

	it("reads the store when one is connected", async () => {
		process.env.GLOBAL_CONFIG = "https://config.example";
		mocks.get.mockResolvedValue(true);
		await expect(isMaintenance()).resolves.toBe(true);
		expect(mocks.get).toHaveBeenCalledWith("maintenance_test");
	});

	it("does not take the site down when the store is unreachable", async () => {
		process.env.GLOBAL_CONFIG = "https://config.example";
		mocks.get.mockRejectedValue(new Error("unreachable"));
		await expect(isMaintenance()).resolves.toBe(false);
	});

	it("returns a banner only when one is set", async () => {
		await expect(banner()).resolves.toBeNull();
		process.env.BANNER_MESSAGE = "  ";
		await expect(banner()).resolves.toBeNull();
		process.env.BANNER_MESSAGE = "Sign-in is changing on Friday";
		await expect(banner()).resolves.toBe("Sign-in is changing on Friday");
	});
});

describe("maintenance bypass", () => {
	beforeEach(() => {
		delete process.env.MAINTENANCE_BYPASS_TOKEN;
	});
	afterEach(() => {
		process.env = { ...env };
	});

	it("lets nobody through when no token is configured", () => {
		expect(maintenanceBypass("anything")).toBe(false);
		expect(maintenanceBypass(undefined)).toBe(false);
	});

	it("refuses a token that is too short to be worth anything", () => {
		process.env.MAINTENANCE_BYPASS_TOKEN = "short";
		expect(maintenanceBypass("short")).toBe(false);
	});

	it("accepts only the exact configured token", () => {
		const token = "b".repeat(40);
		process.env.MAINTENANCE_BYPASS_TOKEN = token;
		expect(maintenanceBypass(token)).toBe(true);
		expect(maintenanceBypass(`${token}x`)).toBe(false);
		expect(maintenanceBypass(undefined)).toBe(false);
	});
});

describe("Clerk freeze flag", () => {
	beforeEach(() => {
		mocks.get.mockReset();
		process.env.GLOBAL_CONFIG = "";
		process.env.EDGE_CONFIG = "";
		delete process.env.CLERK_FROZEN;
	});
	afterEach(() => {
		process.env = { ...env };
	});

	it("is off by default, so the notice never appears unasked", async () => {
		await expect(accountChangesPaused()).resolves.toBe(false);
		expect(mocks.get).not.toHaveBeenCalled();
	});

	it("falls back to the environment variable with no store connected", async () => {
		process.env.CLERK_FROZEN = "1";
		await expect(accountChangesPaused()).resolves.toBe(true);
	});

	it("reads the store when one is connected", async () => {
		process.env.GLOBAL_CONFIG = "https://config.example";
		mocks.get.mockResolvedValue(true);
		await expect(accountChangesPaused()).resolves.toBe(true);
		expect(mocks.get).toHaveBeenCalledWith(
			expect.stringMatching(/^clerk_frozen_(prod|test)$/),
		);
	});

	it("treats anything but true as not frozen", async () => {
		process.env.GLOBAL_CONFIG = "https://config.example";
		mocks.get.mockResolvedValue("yes");
		await expect(accountChangesPaused()).resolves.toBe(false);
	});

	it("does not freeze the page when the store is unreachable", async () => {
		process.env.GLOBAL_CONFIG = "https://config.example";
		mocks.get.mockRejectedValue(new Error("unreachable"));
		await expect(accountChangesPaused()).resolves.toBe(false);
	});
});
