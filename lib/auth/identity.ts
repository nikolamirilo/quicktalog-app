import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
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
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const mint = (value: {
	userId: string;
	sessionId: string | null;
	provider: "clerk" | "supabase";
}) => Object.freeze(value) as VerifiedIdentity;

type AuthApi = Pick<SupabaseClient["auth"], "getClaims">;

/**
 * Turns verified Supabase claims into an identity. Split out so it can be
 * tested without a request, and so both the app and the middleware read the
 * same rules.
 *
 * `getClaims()` verifies the access token locally against the project's JWKS
 * while an asymmetric (ES256) key is current. Anonymous sessions and anything
 * whose `sub` is not a uuid are refused: `public.users.id` holds that uuid, and
 * an id of another shape would not match any row.
 */
export async function identityFromSupabaseAuth(
	auth: AuthApi,
): Promise<VerifiedIdentity | null> {
	const { data, error } = await auth.getClaims();
	const claims = data?.claims;
	if (error || !claims) return null;
	if (claims.role !== "authenticated") return null;
	if (claims.is_anonymous === true) return null;
	if (typeof claims.sub !== "string" || !UUID.test(claims.sub)) return null;

	return mint({
		userId: claims.sub,
		sessionId: typeof claims.session_id === "string" ? claims.session_id : null,
		provider: "supabase",
	});
}

/**
 * The signed-in user for this request, or null. Deduplicated per request, so a
 * page and the actions it renders verify once.
 *
 * Clerk: `auth()`, already verified by clerkMiddleware, no Backend API call.
 * Supabase: local JWT verification through `getClaims()`.
 */
export const getVerifiedIdentity = cache(
	async (): Promise<VerifiedIdentity | null> => {
		if (AUTH_PROVIDER === "clerk") {
			const { auth } = await import("@clerk/nextjs/server");
			const { userId, sessionId } = await auth();
			if (!userId || !CLERK_ID.test(userId)) return null;
			return mint({ userId, sessionId: sessionId ?? null, provider: "clerk" });
		}

		const { createClient } = await import("@/utils/supabase/server");
		return identityFromSupabaseAuth((await createClient()).auth);
	},
);

/** Throws UnauthorizedError when nobody is signed in. For server actions and route handlers. */
export async function requireIdentity(): Promise<VerifiedIdentity> {
	const me = await getVerifiedIdentity();
	if (!me) throw new UnauthorizedError();
	return me;
}

/**
 * For the few operations where a stale-but-valid token is not good enough:
 * deleting the account, changing credentials, billing actions.
 *
 * A JWT stays valid for up to an hour after a user is banned, deleted or signed
 * out everywhere. This costs a round trip to the auth service, which sees all
 * three, and returns the account's email so a caller does not have to trust one
 * from the client.
 */
export async function requireFreshUser(): Promise<
	VerifiedIdentity & { email: string | null }
> {
	const me = await requireIdentity();

	if (me.provider === "clerk") {
		const { clerkClient } = await import("@clerk/nextjs/server");
		const user = await (await clerkClient()).users.getUser(me.userId);
		if (!user || user.banned || user.locked) throw new UnauthorizedError();
		return Object.freeze({
			...me,
			email:
				user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ?? null,
		});
	}

	const { createClient } = await import("@/utils/supabase/server");
	const { data, error } = await (await createClient()).auth.getUser();
	if (error || !data.user || data.user.id !== me.userId) {
		throw new UnauthorizedError();
	}
	return Object.freeze({
		...me,
		email: data.user.email?.trim().toLowerCase() ?? null,
	});
}
