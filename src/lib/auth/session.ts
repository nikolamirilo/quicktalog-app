import "server-only";
import { redirect } from "next/navigation";
import {
	getVerifiedIdentity,
	type VerifiedIdentity,
} from "@/lib/auth/identity";

/**
 * For server components under /admin: the signed-in user, or a redirect to /auth.
 * Middleware protects these routes too; this is the second check.
 */
export async function requireUser(next: string): Promise<VerifiedIdentity> {
	const me = await getVerifiedIdentity();
	if (!me) redirect(`/auth?next=${encodeURIComponent(next)}`);
	return me;
}
