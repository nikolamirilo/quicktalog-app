/**
 * Fills in where existing accounts came from, from what PostHog already knows.
 *
 * Tracking only starts with Track A (QT-09), so every account created before it has a
 * null channel. PostHog has been loaded on the site the whole time and records
 * `$initial_utm_source` and `$initial_referring_domain` as person properties on a
 * visitor's first visit, so for the share of people it was not blocked for, the first
 * touch is already there. This reads those two properties and runs them through the
 * same mapping the app uses, so a backfilled channel means the same thing as a
 * tracked one.
 *
 *   DRY_RUN=1 npx tsx scripts/supabase/backfill-acquisition.ts
 *   DRY_RUN=0 npx tsx scripts/supabase/backfill-acquisition.ts
 *
 * Environment: `NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_PROJECT_ID`, `POSTHOG_API_KEY`,
 * and whatever `@/utils/db/admin` needs. `DRY_RUN=0` is what makes it write.
 *
 * What it will not do: touch an account that already has a channel, or one PostHog
 * knows nothing about. Those stay null, which is honest - it is not the same as
 * "direct".
 */

import { schema } from "@quicktalog/common";
import { and, eq, isNull } from "drizzle-orm";
import { deriveChannel } from "@/lib/users/acquisition";
import { asAdmin } from "@/utils/db/admin";
import { hogqlRequest, HOGQL_TIMEOUT_MS } from "@/utils/posthog";

const users = schema.users;

/**
 * One row per person PostHog has a first touch for. `distinct_id` is the user id for
 * anyone who signed in after `posthog.identify`, which is what ties the two together.
 */
const QUERY = `
select person.properties.$initial_utm_source,
       person.properties.$initial_referring_domain,
       distinct_id
  from persons
 where person.properties.$initial_utm_source is not null
    or person.properties.$initial_referring_domain is not null
 limit 50000`;

type Person = { userId: string; channel: string };

/** Rows PostHog returns, mapped through the app's own channel rules. */
export function toPeople(rows: unknown[][]): Person[] {
	const out: Person[] = [];
	for (const row of rows) {
		if (!Array.isArray(row)) continue;
		const [utmSource, referrer, distinctId] = row;
		if (typeof distinctId !== "string" || !distinctId) continue;
		// Only ids that look like our user ids: PostHog also holds anonymous ones.
		if (!/^[0-9a-f-]{36}$/.test(distinctId)) continue;

		const channel = deriveChannel({
			utm_source: typeof utmSource === "string" ? utmSource : undefined,
			referrer_domain:
				typeof referrer === "string" && referrer !== "$direct"
					? referrer
					: undefined,
		});
		// "direct" from a backfill means "PostHog had neither property", which this
		// query already excluded - so anything landing there is noise.
		if (channel === "direct") continue;
		out.push({ userId: distinctId, channel });
	}
	return out;
}

async function queryPostHog(): Promise<unknown[][]> {
	const host = process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/+$/, "");
	const projectId = process.env.POSTHOG_PROJECT_ID;
	const apiKey = process.env.POSTHOG_API_KEY;
	if (!host || !projectId || !apiKey) {
		throw new Error(
			"NEXT_PUBLIC_POSTHOG_HOST, POSTHOG_PROJECT_ID and POSTHOG_API_KEY must be set",
		);
	}

	const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
		body: JSON.stringify(hogqlRequest(QUERY, {})),
		signal: AbortSignal.timeout(HOGQL_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new Error(`PostHog answered ${response.status}`);
	}
	const body = (await response.json()) as { results?: unknown[][] };
	return body.results ?? [];
}

async function main(): Promise<void> {
	const dryRun = process.env.DRY_RUN !== "0";

	console.log("");
	console.log("  ────────────────────────────────────────────────────────────");
	console.log("  script       backfill-acquisition");
	console.log(
		"  intent       fill acquisition_source from PostHog first touches",
	);
	console.log(
		`  mode         ${dryRun ? "DRY RUN - nothing will be written" : "LIVE - this run writes"}`,
	);
	console.log("  ────────────────────────────────────────────────────────────");
	console.log("");

	const people = toPeople(await queryPostHog());
	const byChannel = new Map<string, number>();
	for (const person of people) {
		byChannel.set(person.channel, (byChannel.get(person.channel) ?? 0) + 1);
	}

	console.log(
		`  ${people.length} people with a first touch PostHog knows about`,
	);
	for (const [channel, count] of [...byChannel].sort((a, b) => b[1] - a[1])) {
		console.log(`    ${channel.padEnd(20)} ${count}`);
	}

	if (people.length === 0 || dryRun) {
		console.log(
			dryRun ? "\n  dry run; re-run with DRY_RUN=0\n" : "\n  nothing to do\n",
		);
		return;
	}

	let written = 0;
	for (const person of people) {
		const rows = await asAdmin("backfill-acquisition", (tx) =>
			tx
				.update(users)
				.set({ acquisitionSource: person.channel })
				.where(
					and(eq(users.id, person.userId), isNull(users.acquisitionSource)),
				)
				.returning({ id: users.id }),
		);
		written += rows.length;
	}

	// `first_seen_at` is deliberately left null on backfilled rows: PostHog's first
	// touch has no timestamp we can honestly put there, and a null is what keeps
	// `recordFirstTouch` able to fill one in properly if they come back.
	console.log(`\n  wrote ${written} channels; the rest already had one\n`);
}

if (process.argv[1]?.endsWith("backfill-acquisition.ts")) {
	main().catch((error) => {
		console.error(
			`\n  FAILED: ${error instanceof Error ? error.message : error}\n`,
		);
		process.exit(1);
	});
}
