import { get } from "@vercel/global-config";

/**
 * Switches that flip without a deploy, so maintenance mode can go on/off in
 * minutes during the cutover. Hobby allows one Global Config store per
 * account, so PROD/TEST share it and are told apart by key suffix; an env var
 * is the fallback when no store is connected.
 */
const ENV = process.env.VERCEL_ENV === "production" ? "prod" : "test";

const hasStore = () =>
	Boolean(process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG);

export async function isMaintenance(): Promise<boolean> {
	if (hasStore()) {
		try {
			return (await get<boolean>(`maintenance_${ENV}`)) === true;
		} catch {
			// An unreachable store must not take the site down.
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
 * The T-3 Clerk freeze (plan 3.4): in the three days before cutover, the Clerk
 * export is the source of truth, so a late profile edit or password reset
 * would not carry across. A notice, not an enforcement - sign-in and
 * everything else keeps working.
 */
export async function accountChangesPaused(): Promise<boolean> {
	if (hasStore()) {
		try {
			return (await get<boolean>(`clerk_frozen_${ENV}`)) === true;
		} catch {
			// An unreachable store must not put the account page into an unasked-for freeze.
		}
	}
	return process.env.CLERK_FROZEN === "1";
}

/** Fail closed: no/short token means nobody gets past maintenance. Set by hand during cutover to smoke-test. */
export function maintenanceBypass(cookieValue: string | undefined): boolean {
	const token = process.env.MAINTENANCE_BYPASS_TOKEN;
	return Boolean(token && token.length >= 32 && cookieValue === token);
}
