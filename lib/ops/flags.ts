import { get } from "@vercel/global-config";

/**
 * Switches that have to flip without a deploy. The cutover needs to put the app
 * into maintenance and take it out again in minutes; a redeploy is too slow and
 * too risky to be the only lever.
 *
 * Hobby allows one Global Config store per account, so PROD and TEST share it
 * and are told apart by the key suffix. An environment variable is the fallback
 * when no store is connected (local, CI, previews).
 */
const ENV = process.env.VERCEL_ENV === "production" ? "prod" : "test";

const hasStore = () =>
	Boolean(process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG);

export async function isMaintenance(): Promise<boolean> {
	if (hasStore()) {
		try {
			return (await get<boolean>(`maintenance_${ENV}`)) === true;
		} catch {
			// An unreachable store must not take the site down: fall through to
			// the environment variable.
		}
	}
	return process.env.MAINTENANCE_MODE === "1";
}

/** A banner shown to everyone, e.g. to announce the sign-in change. */
export async function banner(): Promise<string | null> {
	if (hasStore()) {
		try {
			const value = await get<string>(`banner_${ENV}`);
			return value?.trim() ? value : null;
		} catch {
			return null;
		}
	}
	return process.env.BANNER_MESSAGE?.trim() || null;
}

/**
 * The T-3 Clerk freeze (plan 3.4).
 *
 * In the three days before the cutover, the Clerk export is the source of truth
 * for passwords and email addresses. A profile edit or a password reset made
 * after the export lands in Clerk but not in the import, so the user would
 * arrive on the other side with credentials nobody carried across. Clerk's own
 * settings cannot reliably turn those forms off, so the app says so instead.
 *
 * It is a notice, not an enforcement: sign-in, and everything that is not an
 * account change, keeps working throughout.
 */
export async function accountChangesPaused(): Promise<boolean> {
	if (hasStore()) {
		try {
			return (await get<boolean>(`clerk_frozen_${ENV}`)) === true;
		} catch {
			// An unreachable store must not put the account page into a freeze
			// nobody asked for: fall through to the environment variable.
		}
	}
	return process.env.CLERK_FROZEN === "1";
}

/**
 * Fail closed: with no token configured, or one too short to be worth anything,
 * nobody gets past maintenance. Operators set the cookie by hand during the
 * cutover so they can smoke-test before users are let back in.
 */
export function maintenanceBypass(cookieValue: string | undefined): boolean {
	const token = process.env.MAINTENANCE_BYPASS_TOKEN;
	return Boolean(token && token.length >= 32 && cookieValue === token);
}
