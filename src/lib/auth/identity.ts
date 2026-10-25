import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";

declare const verified: unique symbol;

/**
 * The only identity server code may trust. `userId` equals `public.users.id`,
 * the Supabase auth user id. Only this module can create one.
 */
export type VerifiedIdentity = Readonly<{
	userId: string;
	sessionId: string | null;
	[verified]: true;
}>;

export class UnauthorizedError extends Error {
	constructor() {
		super("Unauthorized");
		this.name = "UnauthorizedError";
	}
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const mint = (value: { userId: string; sessionId: string | null }) =>
	Object.freeze(value) as VerifiedIdentity;

type AuthApi = Pick<SupabaseClient["auth"], "getClaims">;

/**
 * Turns verified Supabase claims into an identity. Split out so it can be
 * tested without a request, and so the app and middleware share the same
 * rules. `getClaims()` verifies the token locally against the project's JWKS.
 * Anonymous sessions and a non-uuid `sub` are refused - `public.users.id` is a uuid.
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
	});
}

/**
 * The signed-in user for this request, or null. Deduplicated per request;
 * verified locally against the JWKS via `getClaims()`.
 */
export const getVerifiedIdentity = cache(
	async (): Promise<VerifiedIdentity | null> => {
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
 * For operations where stale-but-valid isn't good enough (account deletion,
 * credential changes, billing): a JWT can stay valid up to an hour after a ban,
 * deletion or sign-out-everywhere, so this round-trips the auth service.
 */
export async function requireFreshUser(): Promise<
	VerifiedIdentity & { email: string | null }
> {
	const me = await requireIdentity();
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
