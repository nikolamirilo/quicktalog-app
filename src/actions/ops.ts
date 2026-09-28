"use server";

import { getVerifiedIdentity } from "@/lib/auth/identity";
import { accountChangesPaused } from "@/lib/ops/flags";

/**
 * Whether account forms should show the cutover freeze notice. Read through
 * an action (not a prop) since it must flip without a deploy. Signed out
 * always answers "not paused" - there's no account page to notice on anyway.
 */
export async function getAccountChangesPaused(): Promise<boolean> {
	if (!(await getVerifiedIdentity())) return false;
	return accountChangesPaused();
}
