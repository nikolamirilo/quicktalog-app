import { clerk, setupClerkTestingToken } from "@clerk/testing/playwright";
import { expect, test as setup } from "@playwright/test";

const STORAGE_STATE = "playwright/.clerk/user.json";

setup("authenticate with Clerk", async ({ page }) => {
	const identifier = process.env.E2E_CLERK_USER_USERNAME;
	const password = process.env.E2E_CLERK_USER_PASSWORD;

	if (!identifier || !password) {
		throw new Error(
			"Missing E2E_CLERK_USER_USERNAME / E2E_CLERK_USER_PASSWORD. " +
				"Add them to .env.test.local (see .env.test.local.example).",
		);
	}

	await setupClerkTestingToken({ page });

	// Load a page where ClerkJS is mounted, then sign in programmatically with
	// the provided credentials (more reliable than driving the Clerk UI).
	await page.goto("/");
	await clerk.signIn({
		page,
		signInParams: { strategy: "password", identifier, password },
	});

	// Confirm the session actually works on a protected route before saving it.
	await page.goto("/admin/dashboard");
	await expect(page).toHaveURL(/\/admin\/dashboard/);

	await page.context().storageState({ path: STORAGE_STATE });
});
