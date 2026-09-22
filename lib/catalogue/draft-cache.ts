import "server-only";
import * as Sentry from "@sentry/nextjs";
import { type Catalogue, schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { type Tx, withUser } from "@/utils/db";
import { getRedis } from "@/utils/redis";

const TTL_SECONDS = 60 * 60 * 24 * 30;
const c = schema.catalogues;

/**
 * Keyed by the immutable catalogue id, never the slug: a reused name must not
 * show the previous owner's draft. The environment prefix keeps local, CI,
 * TEST and PROD apart when they share a Redis database.
 */
export const draftKey = (catalogueId: string) =>
	`${process.env.REDIS_KEY_PREFIX ?? "dev"}:catalogue:${catalogueId}`;

/** The caller's own catalogue by name, or null. Always call inside a `withUser` block. */
export async function loadOwnedCatalogue(
	tx: Tx,
	me: VerifiedIdentity,
	name: string,
): Promise<Catalogue | null> {
	const [row] = await tx
		.select()
		.from(c)
		.where(and(eq(c.name, name), eq(c.createdBy, me.userId)))
		.limit(1);
	return (row as Catalogue | undefined) ?? null;
}

/**
 * The editor's view: the database row with the unsaved draft on top. The row is
 * read first, in its own short transaction, and Redis is read outside it, so a
 * slow cache never holds a database connection. Server-owned fields always come
 * from the row, so a tampered draft cannot change owner, name or status.
 */
export async function readOwnedDraft(
	me: VerifiedIdentity,
	name: string,
): Promise<Catalogue | null> {
	const row = await withUser(me, (tx) => loadOwnedCatalogue(tx, me, name));
	if (!row) return null;

	let draft: Partial<Catalogue> | null = null;
	try {
		const raw = await getRedis().getex(draftKey(row.id), { ex: TTL_SECONDS });
		draft =
			typeof raw === "string"
				? JSON.parse(raw)
				: (raw as Partial<Catalogue> | null);
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "readOwnedDraft" },
		});
	}

	return {
		...row,
		...(draft ?? {}),
		id: row.id,
		name: row.name,
		status: row.status,
		source: row.source,
		createdBy: row.createdBy,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	};
}

/** Call only after a `withUser` statement proved ownership. Never stores `createdBy`. */
export async function writeOwnedDraft(
	row: Partial<Catalogue> & { id: string },
): Promise<void> {
	const { createdBy: _owner, ...rest } = row;
	await getRedis().set(draftKey(row.id), JSON.stringify(rest), {
		ex: TTL_SECONDS,
	});
}

export async function deleteDrafts(catalogueIds: string[]): Promise<void> {
	if (catalogueIds.length > 0) {
		await getRedis().del(...catalogueIds.map(draftKey));
	}
}
