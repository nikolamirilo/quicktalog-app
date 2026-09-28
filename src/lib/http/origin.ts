import "server-only";

/**
 * Whether a cookie-authenticated request came from our own pages.
 *
 * Session cookies are `SameSite=Lax`, which stops cross-site form posts but not
 * everything: a subdomain takeover or a permissive CORS response elsewhere can
 * still produce a same-site request from somewhere we did not write. Route
 * handlers that mutate data and rely on cookies check this as well.
 *
 * Requests with no `Origin` header at all (server-to-server, curl) are rejected
 * here too; webhooks authenticate with a signature instead and do not use this.
 */
export function sameOrigin(request: Request): boolean {
	const origin = request.headers.get("origin");
	if (!origin) return false;

	const allowed = new Set<string>();
	const base = process.env.NEXT_PUBLIC_BASE_URL;
	if (base) {
		try {
			allowed.add(new URL(base).origin);
		} catch {
			// A malformed base URL must not accidentally allow everything.
		}
	}
	// Vercel gives each preview deployment its own host.
	if (process.env.VERCEL_URL) allowed.add(`https://${process.env.VERCEL_URL}`);

	try {
		const host = request.headers.get("host");
		if (host) {
			allowed.add(new URL(`https://${host}`).origin);
			allowed.add(new URL(`http://${host}`).origin);
		}
	} catch {
		// Ignore an unparseable host; the base URL above still applies.
	}

	return allowed.has(origin);
}
