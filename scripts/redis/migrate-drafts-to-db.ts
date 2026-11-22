/**
 * Moves the builder drafts out of Redis and into `public.catalogue_drafts`.
 *
 * Until Track A (QT-01) the only copy of an unsaved draft was a Redis key,
 * `${REDIS_KEY_PREFIX}:catalogue:${catalogueId}`, on a 30-day sliding TTL. The draft is
 * a database row now. This copies what is still in Redis across, so nobody loses the
 * work they left in the builder before the deploy.
 *
 * **Run it once per environment, after that environment is on the new code**, and
 * before deleting the Redis keys. The order matters: an old deployment still reading
 * Redis would not see a draft written only to the database.
 *
 *   DRY_RUN=1 npx tsx scripts/redis/migrate-drafts-to-db.ts
 *   DRY_RUN=0 npx tsx scripts/redis/migrate-drafts-to-db.ts
 *
 * Environment: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`,
 * `REDIS_KEY_PREFIX`, and whatever `@/utils/db/admin` needs to reach the database.
 * `DRY_RUN=0` is what makes it write. `MAX_DRAFTS` (default 2000) stops a run that
 * matched far more than anyone expected.
 *
 * What it will not do: overwrite a draft the database already holds. A row that is
 * already there was written by the new code, so it is newer than anything in Redis by
 * definition, and it is left alone.
 */

import { schema } from "@quicktalog/common";
import { Redis } from "@upstash/redis";
import { eq, sql } from "drizzle-orm";
import { asAdmin } from "@/utils/db/admin";
import { CATALOGUE_EDITABLE_FIELDS } from "@/utils/db/columns";

const catalogues = schema.catalogues;

/** `${prefix}:catalogue:${uuid}` - the shape the app has written since Phase 1. */
const DRAFT_KEY =
	/^[a-z0-9-]+:catalogue:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const catalogueIdFromKey = (key: string): string | null =>
	DRAFT_KEY.test(key) ? (key.split(":").pop() ?? null) : null;

/** Only the fields a draft may carry; anything else in the cached object is dropped. */
export function editableOnly(value: unknown): Record<string, unknown> | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}
	const source = value as Record<string, unknown>;
	const out: Record<string, unknown> = {};
	for (const field of CATALOGUE_EDITABLE_FIELDS) {
		if (field in source && source[field] !== undefined)
			out[field] = source[field];
	}
	return Object.keys(out).length > 0 ? out : null;
}

function isTruthy(value: string | undefined): boolean {
	return value === "1" || value === "true" || value === "yes";
}

async function main(): Promise<void> {
	const url = process.env.UPSTASH_REDIS_REST_URL;
	const token = process.env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		throw new Error(
			"UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set",
		);
	}

	const prefix = process.env.REDIS_KEY_PREFIX ?? "dev";
	const dryRun = process.env.DRY_RUN !== "0";
	const maxDrafts = Math.max(1, Number(process.env.MAX_DRAFTS ?? 2000) || 2000);
	const redis = new Redis({ token, url });

	console.log("");
	console.log("  ────────────────────────────────────────────────────────────");
	console.log("  script       migrate-drafts-to-db");
	console.log(
		"  intent       copy the Redis builder drafts into catalogue_drafts",
	);
	console.log(`  redis        ${new URL(url).hostname}`);
	console.log(`  prefix       ${prefix}`);
	console.log(
		`  mode         ${dryRun ? "DRY RUN - nothing will be written" : "LIVE - this run writes"}`,
	);
	console.log("  ────────────────────────────────────────────────────────────");
	console.log("");

	const found = new Map<string, Record<string, unknown>>();
	let scanned = 0;
	let cursor = "0";

	do {
		const [next, keys] = (await redis.scan(cursor, {
			match: `${prefix}:catalogue:*`,
			count: 500,
		})) as [string, string[]];
		cursor = String(next);
		scanned += keys.length;

		for (const key of keys) {
			const catalogueId = catalogueIdFromKey(key);
			if (!catalogueId) continue;
			const raw = await redis.get(key);
			const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
			const draft = editableOnly(parsed);
			if (draft) found.set(catalogueId, draft);
		}
	} while (cursor !== "0");

	console.log(`  scanned ${scanned} keys, ${found.size} drafts to move`);
	if (found.size === 0) {
		console.log("\n  nothing to do\n");
		return;
	}
	if (found.size > maxDrafts) {
		throw new Error(
			`${found.size} drafts matched, over the ${maxDrafts} cap - check the list, then re-run with MAX_DRAFTS set higher if it is right`,
		);
	}
	if (dryRun) {
		for (const id of found.keys()) console.log(`    ${id}`);
		console.log(`\n  would move ${found.size} drafts; re-run with DRY_RUN=0\n`);
		return;
	}

	// One at a time: a partial run is recoverable and re-running is safe, because a
	// draft already in the database is never overwritten.
	let moved = 0;
	let skipped = 0;
	let orphaned = 0;
	for (const [catalogueId, draft] of found) {
		const outcome = await asAdmin("migrate-drafts-to-db", async (tx) => {
			const [owner] = await tx
				.select({ userId: catalogues.userId })
				.from(catalogues)
				.where(eq(catalogues.id, catalogueId))
				.limit(1);
			if (!owner) return "orphaned" as const;

			const rows = await tx.execute<{ catalogue_id: string }>(sql`
				insert into public.catalogue_drafts (catalogue_id, user_id, draft, updated_at)
				values (${catalogueId}, ${owner.userId}, ${JSON.stringify(draft)}::jsonb, now())
				on conflict (catalogue_id) do nothing
				returning catalogue_id`);
			return [...rows].length > 0 ? ("moved" as const) : ("skipped" as const);
		});

		if (outcome === "moved") moved += 1;
		else if (outcome === "skipped") skipped += 1;
		else orphaned += 1;
	}

	console.log(
		`\n  moved ${moved}, already in the database ${skipped}, no such catalogue ${orphaned}\n`,
	);
	if (!isTruthy(process.env.SKIP_CONFIRM)) {
		console.log(
			"  The Redis keys were left in place. Delete them once every environment\n" +
				"  is on the new code and this run looks right.\n",
		);
	}
}

if (process.argv[1]?.endsWith("migrate-drafts-to-db.ts")) {
	main().catch((error) => {
		console.error(
			`\n  FAILED: ${error instanceof Error ? error.message : error}\n`,
		);
		process.exit(1);
	});
}
