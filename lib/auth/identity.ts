import "server-only";
import { cache } from "react";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

declare const verified: unique symbol;

/**
 * The only identity server code may trust. `userId` equals `public.users.id`:
 * the Clerk id ("user_...") until the cutover, the Supabase auth user id after it.
 * Only this module can create one.
 */
export type VerifiedIdentity = Readonly<{
	userId: string;
	sessionId: string | null;
	provider: "clerk" | "supabase";
	[verified]: true;
}>;

export class UnauthorizedError extends Error {
	constructor() {
		super("Unauthorized");
		this.name = "UnauthorizedError";
	}
}

const CLERK_ID = /^user_[A-Za-z0-9]{10,64}$/;

const mint = (value: {
	userId: string;
	sessionId: string | null;
	provider: "clerk" | "supabase";
}) => Object.freeze(value) as VerifiedIdentity;

/**
 * The signed-in user for this request, or null. Uses Clerk `auth()` (verified by
 * clerkMiddleware, no Backend API call). Deduplicated per request.
 */
export const getVerifiedIdentity = cache(
	async (): Promise<VerifiedIdentity | null> => {
		if (AUTH_PROVIDER !== "clerk") {
			// The Supabase branch ships with the Supabase Auth build (migration Phase 2).
			return null;
		}
		const { auth } = await import("@clerk/nextjs/server");
		const { userId, sessionId } = await auth();
		if (!userId || !CLERK_ID.test(userId)) return null;
		return mint({ userId, sessionId: sessionId ?? null, provider: "clerk" });
	},
);

/** Throws UnauthorizedError when nobody is signed in. For server actions and route handlers. */
export async function requireIdentity(): Promise<VerifiedIdentity> {
	const me = await getVerifiedIdentity();
	if (!me) throw new UnauthorizedError();
	return me;
}
