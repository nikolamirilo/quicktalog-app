import { get } from "@vercel/global-config";

/**
 * Switches that flip without a deploy, so maintenance mode can go on/off in
 * minutes. Hobby allows one Global Config store per
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

/** A banner shown to everyone, e.g. to announce planned maintenance. */
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

/** Fail closed: no/short token means nobody gets past maintenance. Set by hand to smoke-test during a maintenance window. */
export function maintenanceBypass(cookieValue: string | undefined): boolean {
	const token = process.env.MAINTENANCE_BYPASS_TOKEN;
	return Boolean(token && token.length >= 32 && cookieValue === token);
}
