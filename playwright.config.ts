import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Playwright doesn't load Next's env files automatically. Load the app's
// `.env` plus `.env.test.local` (which holds the E2E Clerk credentials).
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.test.local", override: true });

// Which provider the app under test is running. The e2e suite has to sign in
// the way that provider does, so the setup project and the saved session differ.
const AUTH_PROVIDER =
	process.env.AUTH_PROVIDER === "supabase" ? "supabase" : "clerk";
const STORAGE_STATE =
	AUTH_PROVIDER === "supabase"
		? "playwright/.supabase/user.json"
		: "playwright/.clerk/user.json";

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
		{
			name: "setup",
			testMatch:
				AUTH_PROVIDER === "supabase"
					? /auth\.supabase\.setup\.ts/
					: /auth\.setup\.ts/,
		},
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
