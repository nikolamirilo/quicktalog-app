import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Playwright doesn't load Next's env files automatically. Load the app's
// `.env` plus `.env.test.local` (which holds the E2E Clerk credentials).
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.test.local", override: true });

const STORAGE_STATE = "playwright/.clerk/user.json";

export default defineConfig({
	testDir: "./tests/e2e",
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	globalSetup: "./tests/e2e/global.setup.ts",
	use: {
		baseURL: process.env.NEXT_PUBLIC_BASE_URL! || "http://localhost:3000",
		trace: "on-first-retry",
	},
	projects: [
		{ name: "setup", testMatch: /auth\.setup\.ts/ },
		{
			name: "chromium",
			testMatch: /create-catalogue\.spec\.ts/,
			dependencies: ["setup"],
			use: { ...devices["Desktop Chrome"], storageState: STORAGE_STATE },
		},
	],
	webServer: {
		command: "npm run dev",
		url: "http://localhost:3000",
		timeout: 120_000,
		reuseExistingServer: !process.env.CI,
	},
});
