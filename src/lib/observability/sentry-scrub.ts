/**
 * Removes credentials and personal data from Sentry events before they leave the
 * app: cookies (Clerk `__session`, future `sb-*-auth-token`), auth headers,
 * token-like query parameters and the bound parameters Drizzle adds to error
 * messages (`params: ...`, which can hold emails and user ids).
 * Shared by the server, edge and browser Sentry configs, so no `server-only`.
 */

const SENSITIVE_HEADERS = new Set([
	"cookie",
	"set-cookie",
	"authorization",
	"proxy-authorization",
	"x-revalidate-secret",
	"paddle-signature",
	"svix-signature",
	"apikey",
]);

const SENSITIVE_QUERY_KEYS =
	/^(code|token|token_hash|access_token|refresh_token|apikey|api_key|secret|password)$/i;

const DRIZZLE_PARAMS = /\s*params:[\s\S]*$/;

const FILTERED = "[Filtered]";

type Headers = Record<string, string>;

type ScrubbableEvent = {
	message?: string;
	request?: {
		cookies?: unknown;
		headers?: Headers;
		query_string?: unknown;
		url?: string;
		data?: unknown;
	};
	exception?: { values?: Array<{ value?: string }> };
	breadcrumbs?: Array<ScrubbableBreadcrumb>;
	user?: Record<string, unknown>;
};

type ScrubbableBreadcrumb = {
	message?: string;
	data?: Record<string, unknown>;
};

export function stripDrizzleParams(text: string): string {
	return text.replace(DRIZZLE_PARAMS, "");
}

export function scrubUrl(url: string): string {
	const queryStart = url.indexOf("?");
	if (queryStart === -1) return url;
	const base = url.slice(0, queryStart);
	const params = new URLSearchParams(url.slice(queryStart + 1));
	for (const key of [...params.keys()]) {
		if (SENSITIVE_QUERY_KEYS.test(key)) params.set(key, FILTERED);
	}
	const query = params.toString();
	return query ? `${base}?${query}` : base;
}

function scrubHeaders(headers: Headers): Headers {
	const clean: Headers = {};
	for (const [key, value] of Object.entries(headers)) {
		clean[key] = SENSITIVE_HEADERS.has(key.toLowerCase()) ? FILTERED : value;
	}
	return clean;
}

export function scrubBreadcrumb<T extends ScrubbableBreadcrumb>(crumb: T): T {
	if (crumb.message) crumb.message = stripDrizzleParams(crumb.message);
	if (crumb.data && typeof crumb.data.url === "string") {
		crumb.data.url = scrubUrl(crumb.data.url);
	}
	return crumb;
}

export function scrubEvent<T extends ScrubbableEvent>(event: T): T {
	if (event.message) event.message = stripDrizzleParams(event.message);

	for (const value of event.exception?.values ?? []) {
		if (value.value) value.value = stripDrizzleParams(value.value);
	}

	if (event.request) {
		if (event.request.cookies) event.request.cookies = {};
		if (event.request.headers) {
			event.request.headers = scrubHeaders(event.request.headers);
		}
		if (event.request.url) event.request.url = scrubUrl(event.request.url);
		if (event.request.query_string) event.request.query_string = FILTERED;
		if (event.request.data) event.request.data = FILTERED;
	}

	if (event.user) {
		// Keep the opaque id for grouping; drop email, username and IP.
		const { id } = event.user;
		event.user = id === undefined ? {} : { id };
	}

	for (const crumb of event.breadcrumbs ?? []) scrubBreadcrumb(crumb);

	return event;
}
