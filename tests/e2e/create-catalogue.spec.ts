import { type Locator, type Page, expect, test } from "@playwright/test";
import { deleteCatalogueBySlug } from "./helpers/cleanup";

/**
 * Picks the first option of a Radix <Select>. The trigger lives inside the
 * dialog; the options render in a portal at the document root, so they're
 * queried from `page` rather than the dialog scope.
 */
async function selectFirstOption(page: Page, trigger: Locator) {
	await trigger.click();
	const option = page.getByRole("option").first();
	await option.waitFor({ state: "visible" });
	await option.click();
}

test.describe("create catalogue", () => {
	let createdSlug = "";

	test.afterEach(async () => {
		if (createdSlug) {
			await deleteCatalogueBySlug(createdSlug);
			createdSlug = "";
		}
	});

	test("creates a catalogue via the manual builder", async ({ page }) => {
		const name = `E2E Test ${Date.now()}`;
		const dialog = page.getByRole("alertdialog");
		const createBtn = page
			.getByRole("button", { name: /create catalogue/i })
			.filter({ visible: true })
			.first();

		// Open the create modal. The button redirects to /auth when the Clerk
		// UserContext hasn't hydrated yet, so we wait for hydration before
		// clicking. `toPass` stays as a safety net for cold-cache runs.
		await expect(async () => {
			if (!page.url().includes("/admin/dashboard")) {
				await page.goto("/admin/dashboard", { waitUntil: "networkidle" });
			}
			await page.waitForLoadState("networkidle");
			await createBtn.waitFor({ state: "visible" });
			await createBtn.click();
			await expect(dialog.getByText("Create a Catalog")).toBeVisible({
				timeout: 5_000,
			});
		}).toPass({ timeout: 30_000 });

		// Fill the form: unique name + the three required selects.
		await dialog.locator("#catalogName").fill(name);
		await selectFirstOption(page, dialog.locator("#language"));
		await selectFirstOption(page, dialog.locator("#currency"));
		await selectFirstOption(page, dialog.locator("#businessType"));

		// Submit and assert the redirect to the builder for the new catalogue.
		await dialog.getByRole("button", { name: /create catalog/i }).click();
		await page.waitForURL(/\/admin\/[^/]+\/builder/, { timeout: 30_000 });

		const match = page.url().match(/\/admin\/([^/]+)\/builder/);
		expect(match, "should land on the builder URL").not.toBeNull();
		createdSlug = decodeURIComponent(match![1]);
		expect(createdSlug.length).toBeGreaterThan(0);
	});
});
