import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * The admin auth API: creating, updating and deleting `auth.users`.
 *
 * Only two callers are allowed — the account-deletion action and the cutover
 * scripts — and the architecture test enforces that, because this key can act
 * as any user. It carries no session and must never be handed a request's
 * cookies.
 */
export function authAdmin() {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const key = process.env.SUPABASE_SECRET_KEY;
	if (!url || !key) throw new Error("Supabase admin auth env is not set");

	return createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false },
	}).auth.admin;
}
