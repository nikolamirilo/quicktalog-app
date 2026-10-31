/**
 * Rewrites the pre-rename `custom_code` blocks left in cached builder drafts to
 * `custom_visual`, so the read-time conversion can be removed. The database has
 * none (checked on TEST and PROD 2026-10-25); drafts live in Redis for 30 days
 * from their last read, so an old one can still carry the key.
 *
 * Covers every environment prefix in the Redis database it points at
 * (`prod:`, `test:`, `dev:`, ...). The draft keeps its TTL.
 *
 *   DRY_RUN=1 npx tsx --env-file=.env scripts/redis/rename-custom-code-blocks.ts
 *   DRY_RUN=0 npx tsx --env-file=.env scripts/redis/rename-custom-code-blocks.ts
 *
 * Environment: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and
 * `DRY_RUN=0` to actually write.
 */

import { Redis } from "@upstash/redis";

/** What the current code writes a draft under: `${prefix}:catalogue:${catalogueId}`. */
const DRAFT_KEY = /^[a-z0-9-]+:catalogue:[0-9a-f-]+$/;

const LEGACY = "custom_code";
const CURRENT = "custom_visual";

/** The draft with every legacy block renamed, or null when it has none. */
export function renameLegacyBlocks(draft: unknown): unknown | null {
	if (typeof draft !== "object" || draft === null) return null;
	const content = (draft as { content?: unknown }).content;
	if (!Array.isArray(content)) return null;
	if (!content.some((block) => block?.type === LEGACY)) return null;
	return {
		...draft,
		content: content.map((block) =>
			block?.type === LEGACY ? { ...block, type: CURRENT } : block,
		),
	};
}

const parse = (value: unknown): unknown => {
	if (typeof value !== "string") return value;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
};

async function main(): Promise<void> {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		throw new Error(
			"UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set",
		);
	}
	const dryRun = process.env.DRY_RUN !== "0";
	const redis = new Redis({ token, url });

	console.log("");
	console.log(`  script   rename-custom-code-blocks`);
	console.log(`  redis    ${new URL(url).hostname}`);
	console.log(
		`  mode     ${dryRun ? "DRY RUN - nothing will be written" : "LIVE - this run writes"}`,
	);
	console.log("");

	const perPrefix = new Map<string, number>();
	const matches: { key: string; next: unknown }[] = [];
	let drafts = 0;
	let cursor = "0";
	do {
		const [next, keys] = (await redis.scan(cursor, {
			match: "*:catalogue:*",
			count: 500,
		})) as [string, string[]];
		cursor = String(next);
		for (const key of keys.filter((k) => DRAFT_KEY.test(k))) {
			drafts += 1;
			const prefix = key.split(":")[0] as string;
			perPrefix.set(prefix, perPrefix.get(prefix) ?? 0);
			const renamed = renameLegacyBlocks(parse(await redis.get(key)));
			if (renamed) {
				matches.push({ key, next: renamed });
				perPrefix.set(prefix, (perPrefix.get(prefix) ?? 0) + 1);
			}
		}
	} while (cursor !== "0");

	console.log(`  drafts scanned ${drafts}, with ${LEGACY}: ${matches.length}`);
	for (const [prefix, count] of perPrefix) {
		console.log(`    ${prefix}: ${count}`);
	}
	for (const { key } of matches) console.log(`    ${key}`);

	if (matches.length === 0 || dryRun) {
		console.log(
			matches.length === 0
				? "\n  nothing to do\n"
				: "\n  re-run with DRY_RUN=0 to write\n",
		);
		return;
	}

	let written = 0;
	for (const { key, next } of matches) {
		await redis.set(key, JSON.stringify(next), { keepTtl: true });
		written += 1;
	}
	console.log(`\n  rewrote ${written} drafts\n`);
}

if (process.argv[1]?.endsWith("rename-custom-code-blocks.ts")) {
	main().catch((error) => {
		console.error(
			`\n  FAILED: ${error instanceof Error ? error.message : error}\n`,
		);
		process.exit(1);
	});
}
