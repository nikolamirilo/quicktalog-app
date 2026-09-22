import { clerkSetup } from "@clerk/testing/playwright";

/**
 * Fetches a Clerk Testing Token so automated runs bypass bot detection.
 *
 * Only on the Clerk leg. `clerkSetup()` needs `CLERK_SECRET_KEY` and a Clerk
 * *development* instance, neither of which the Supabase leg has any reason to
 * carry — running it there failed the whole suite before a single test started.
 */
export default async function globalSetup() {
	if (process.env.AUTH_PROVIDER === "supabase") return;
	await clerkSetup();
}
