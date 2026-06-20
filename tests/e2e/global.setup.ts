import { clerkSetup } from "@clerk/testing/playwright";

// Fetches a Clerk Testing Token (using CLERK_SECRET_KEY) so automated runs
// bypass bot detection. Requires a Clerk *development* instance.
export default async function globalSetup() {
	await clerkSetup();
}
