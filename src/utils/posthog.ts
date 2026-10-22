import "server-only";

/**
 * Our wrapper around PostHog's query API (`POST /api/projects/:id/query/`).
 * It knows about environment variables, HTTP and the response shape; what to
 * ask lives with the domain (`lib/analytics/catalogue-traffic.ts`).
 *
 * Values are never spliced into the HogQL text: they go in `values` and the
 * query refers to them as `{name}` placeholders, which PostHog parses as
 * constants ("Constant values that can be referenced with the {placeholder}
 * syntax in the query", `HogQLQuery.values` in PostHog's query schema).
 */

export type HogQLValue = string | number | boolean;
export type HogQLValues = Record<string, HogQLValue>;

export type HogQLRequest = {
	query: { kind: "HogQLQuery"; query: string; values: HogQLValues };
};

/** Default per-query timeout: callers run queries in parallel, well under 60s. */
export const HOGQL_TIMEOUT_MS = 20_000;

/** The request body for one HogQL query with placeholder values. */
export function hogqlRequest(query: string, values: HogQLValues): HogQLRequest {
	return { query: { kind: "HogQLQuery", query, values } };
}

function posthogConfig() {
	const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
	const projectId = process.env.POSTHOG_PROJECT_ID;
	const apiKey = process.env.POSTHOG_API_KEY;
	if (!host) throw new Error("PostHog host environment variable is not set");
	if (!projectId) {
		throw new Error("PostHog project ID environment variable is not set");
	}
	if (!apiKey) {
		throw new Error("PostHog API key environment variable is not set");
	}
	return { host: host.replace(/\/+$/, ""), projectId, apiKey };
}

/**
 * Runs one HogQL query and returns its `results` rows. Throws on a missing
 * setting, a non-2xx answer, a timeout or a response without `results`.
 * Never call it inside a database block: it is a network round trip.
 */
export async function runHogQL(
	query: string,
	values: HogQLValues = {},
	timeoutMs = HOGQL_TIMEOUT_MS,
): Promise<unknown[][]> {
	const { host, projectId, apiKey } = posthogConfig();
	const res = await fetch(
		`${host}/api/projects/${encodeURIComponent(projectId)}/query/`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(hogqlRequest(query, values)),
			cache: "no-store",
			signal: AbortSignal.timeout(timeoutMs),
		},
	);
	if (!res.ok) {
		const detail = await res.text();
		throw new Error(
			`PostHog query failed: ${res.status} ${res.statusText} - ${detail.slice(0, 500)}`,
		);
	}
	const data = (await res.json()) as { results?: unknown };
	if (!data || !Array.isArray(data.results)) {
		throw new Error("PostHog response is missing the 'results' array");
	}
	return data.results as unknown[][];
}
