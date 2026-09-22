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
 * Fail closed: with no token configured, or one too short to be worth anything,
 * nobody gets past maintenance. Operators set the cookie by hand during the
 * cutover so they can smoke-test before users are let back in.
 */
export function maintenanceBypass(cookieValue: string | undefined): boolean {
	const token = process.env.MAINTENANCE_BYPASS_TOKEN;
	return Boolean(token && token.length >= 32 && cookieValue === token);
}
