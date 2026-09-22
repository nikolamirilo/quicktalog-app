import { createClient } from "@supabase/supabase-js";
import { expect, test as setup } from "@playwright/test";

const STORAGE_STATE = "playwright/.supabase/user.json";

/**
 * Signs the e2e user in without driving the sign-in form.
 *
 * The form is captcha-gated, and a captcha cannot be solved in CI. Supabase's
 * admin API can mint a magic link for a known user, and `verifyOtp` is not
 * captcha-gated, so the browser ends up with a real session created the same
 * way a user's would be.
 *
 * Requires `SUPABASE_SECRET_KEY` and an existing test user; it never creates
 * one, so a misconfigured run fails instead of quietly inventing an account.
 */
setup("authenticate with Supabase", async ({ page, baseURL }) => {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const secretKey = process.env.SUPABASE_SECRET_KEY;
	const email = process.env.E2E_SUPABASE_USER_EMAIL;

	if (!url || !secretKey || !email) {
		throw new Error(
			"Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY / E2E_SUPABASE_USER_EMAIL. " +
				"Add them to .env.test.local - see docs/guides/e2e-testing.md.",
		);
	}

	const admin = createClient(url, secretKey, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	const { data, error } = await admin.auth.admin.generateLink({
		type: "magiclink",
		email,
	});
	if (error || !data.properties?.hashed_token) {
		throw new Error(`Could not generate a login link: ${error?.message}`);
	}

	// The browser completes the link itself, so cookies are written exactly as
	// for a real visitor. `/auth/confirm` verifies nothing - it moves the token
	// into a short-lived cookie and redirects to an interstitial, so a mail
	// scanner can't spend it. The token is only consumed on button press, so
	// this setup has to press it - skipping straight to /admin/dashboard
	// leaves the session unmade.
	await page.goto(
		`${baseURL}/auth/confirm?token_hash=${data.properties.hashed_token}&type=email`,
	);
	await expect(page).toHaveURL(/\/auth\/confirm\/continue/);

	const confirmButton = page.getByRole("button", {
		name: /confirm and continue/i,
	});
	if (!(await confirmButton.isVisible().catch(() => false))) {
		// The interstitial refuses for reasons worth reading: already signed in,
		// the 10-minute cookie expired, or the confirm rate limit was hit by an
		// earlier run from this IP. A bare timeout would say none of that.
		const shown = await page.locator("body").innerText();
		throw new Error(
			`The confirm interstitial did not offer the button. Page said:\n${shown.slice(0, 500)}`,
		);
	}
	await confirmButton.click();

	// Second step: the page names the account before it lets the visitor in.
	await page.getByRole("button", { name: /^continue$/i }).click();
	await expect(page).toHaveURL(/\/admin\/dashboard/);

	await page.context().storageState({ path: STORAGE_STATE });
});
