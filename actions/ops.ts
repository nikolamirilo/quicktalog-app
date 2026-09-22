"use server";

import { getVerifiedIdentity } from "@/lib/auth/identity";
import { accountChangesPaused } from "@/lib/ops/flags";

/**
 * Whether the account forms should show the cutover freeze notice.
 *
 * The flag has to flip without a deploy (plan 3.4 turns it on at T-3 and the
 * cutover turns it off again), and the settings tab is deep inside a client
 * tree, so it is read through an action rather than passed down as a prop.
 *
 * It tells an anonymous caller nothing, but the rule is the rule: every action
 * establishes identity itself. Signed out, the answer is "not paused", because
 * there is no account page to put a notice on.
 */
export async function getAccountChangesPaused(): Promise<boolean> {
	if (!(await getVerifiedIdentity())) return false;
	return accountChangesPaused();
}
