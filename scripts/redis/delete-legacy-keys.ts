/**
 * Drops the draft-cache keys written before Phase 1. The old cache was keyed
 * by the catalogue *slug* with no environment prefix, so a reused slug served
 * the previous owner's draft and every environment sharing one Redis database
 * shared one keyspace. Phase 1 moved to
 * `${REDIS_KEY_PREFIX}:catalogue:${catalogueId}`, leaving the old keys behind.
 *
 * **Run it once, after every environment is on Phase 1 code** — on a shared
 * Redis that means after PROD, not after TEST. A legacy key deleted while an
 * old deployment is still reading it loses that user's unsaved draft.
 *
 *   DRY_RUN=1 npx tsx scripts/redis/delete-legacy-keys.ts
 *   DRY_RUN=0 npx tsx scripts/redis/delete-legacy-keys.ts
 *
 * Environment: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
 * `DRY_RUN=0` to actually delete. `MAX_DELETIONS` (default 500) is the cap that
 * stops a run that has matched far more than anyone expected.
 *
 * What it will not touch: anything namespaced (`prod:`, `test:`, `ci:`,
 * `dev:`…), which covers every key the current code writes, including the rate
 * limiter's. A key is only a candidate when it looks like a catalogue slug
 * *and* holds a JSON object — both have to be true, because the cost of being
 * wrong is somebody's unsaved work.
 */

import { createInterface } from "node:readline/promises";
import { Redis } from "@upstash/redis";

/** The shape `public.catalogues.name` is constrained to (M03). */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Anything the current code writes carries an environment prefix. */
const NAMESPACED = /^[a-z0-9-]+:/;

export type Candidate = { key: string; reason: "legacy-draft" };

/**
 * A key is legacy only when it is shaped like a slug, carries no namespace and
 * holds a JSON object. A bare string, a number or a list is something else and
 * is left alone.
 */
export function isLegacyDraft(key: string, value: unknown): boolean {
	if (NAMESPACED.test(key)) return false;
	if (!SLUG.test(key)) return false;
	if (key.length > 100) return false;

	const parsed =
		typeof value === "string"
			? (() => {
					try {
						return JSON.parse(value);
					} catch {
						return null;
					}
				})()
			: value;

	return (
		typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
	);
}

function isTruthy(value: string | undefined): boolean {
	return value === "1" || value === "true" || value === "yes";
}

async function confirm(count: number): Promise<void> {
	const expected = String(count);
	if (!process.stdin.isTTY) {
		if (process.env.CONFIRM_COUNT !== expected) {
			throw new Error(
				`no terminal to confirm on: re-run with CONFIRM_COUNT=${expected}`,
			);
		}
		return;
	}
	const rl = createInterface({ input: process.stdin, output: process.stdout });
	try {
		const answer = await rl.question(
			`  Type the number of keys to delete (${expected}) to continue: `,
		);
		if (answer.trim() !== expected) {
			throw new Error("confirmation did not match");
		}
	} finally {
		rl.close();
	}
}

async function main(): Promise<void> {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		throw new Error(
			"UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set",
		);
	}

	const dryRun = process.env.DRY_RUN !== "0";
	const maxDeletions = Math.max(
		1,
		Number(process.env.MAX_DELETIONS ?? 500) || 500,
	);
	const redis = new Redis({ token, url });

	console.log("");
	console.log("  ────────────────────────────────────────────────────────────");
	console.log("  script       delete-legacy-keys");
	console.log("  intent       drop the pre-Phase-1 slug-keyed draft cache");
	console.log(`  redis        ${new URL(url).hostname}`);
	console.log(`  prefix now   ${process.env.REDIS_KEY_PREFIX ?? "(unset)"}`);
	console.log(
		`  mode         ${dryRun ? "DRY RUN — nothing will be deleted" : "LIVE — this run deletes"}`,
	);
	console.log("  ────────────────────────────────────────────────────────────");
	console.log("");

	const candidates: Candidate[] = [];
	let scanned = 0;
	let cursor = "0";

	do {
		const [next, keys] = (await redis.scan(cursor, { count: 500 })) as [
			string,
			string[],
		];
		cursor = String(next);
		scanned += keys.length;

		// Shape first, value second: reading a value costs a round trip, and most
		// keys are ruled out by their name alone.
		const shaped = keys.filter(
			(key) => !NAMESPACED.test(key) && SLUG.test(key),
		);
		for (const key of shaped) {
			const value = await redis.get(key);
			if (isLegacyDraft(key, value)) {
				candidates.push({ key, reason: "legacy-draft" });
			}
		}
	} while (cursor !== "0");

	console.log(`  scanned ${scanned} keys, ${candidates.length} legacy drafts`);
	for (const candidate of candidates) console.log(`    ${candidate.key}`);

	if (candidates.length === 0) {
		console.log("\n  nothing to do\n");
		return;
	}
	if (candidates.length > maxDeletions) {
		throw new Error(
			`${candidates.length} keys matched, over the ${maxDeletions} cap — check the list, then re-run with MAX_DELETIONS set higher if it is right`,
		);
	}
	if (dryRun) {
		console.log(
			`\n  would delete ${candidates.length} keys; re-run with DRY_RUN=0\n`,
		);
		return;
	}
	if (!isTruthy(process.env.SKIP_CONFIRM)) {
		await confirm(candidates.length);
	}

	// One at a time: a partial run is recoverable, and the count printed at the
	// end is then the count that actually happened.
	let deleted = 0;
	for (const candidate of candidates) {
		deleted += await redis.del(candidate.key);
	}
	console.log(`\n  deleted ${deleted} keys\n`);
}

if (process.argv[1]?.endsWith("delete-legacy-keys.ts")) {
	main().catch((error) => {
		console.error(
			`\n  FAILED: ${error instanceof Error ? error.message : error}\n`,
		);
		process.exit(1);
	});
}
