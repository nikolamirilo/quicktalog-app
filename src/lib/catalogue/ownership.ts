import "server-only";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { Tx } from "@/utils/db";
import { schema } from "@quicktalog/common";
import { and, desc, eq } from "drizzle-orm";

const { catalogues } = schema;

/**
 * Owner-scoped catalogue reads. Every helper runs in the caller's `withUser`
 * block, so a check and the work it guards see the same snapshot and cannot be
 * separated by a concurrent rename or delete. The owner predicate is spelled
 * out even though RLS enforces it too.
 */

export type OwnedCatalogue = { id: string; status: string };

/** The catalogue with this name when `me` owns it, otherwise undefined. */
export async function getOwnedCatalogue(
	tx: Tx,
	me: VerifiedIdentity,
	catalogue: string,
): Promise<OwnedCatalogue | undefined> {
	const [row] = await tx
		.select({ id: catalogues.id, status: catalogues.status })
		.from(catalogues)
		.where(
			and(eq(catalogues.name, catalogue), eq(catalogues.userId, me.userId)),
		)
		.limit(1);
	return row;
}

/** True when `me` owns the catalogue with this name. */
export async function ownsCatalogue(
	tx: Tx,
	me: VerifiedIdentity,
	catalogue: string,
): Promise<boolean> {
	return Boolean(await getOwnedCatalogue(tx, me, catalogue));
}

/** The names of `me`'s catalogues, newest first (the analytics switcher). */
export async function listOwnedCatalogues(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<string[]> {
	const rows = await tx
		.select({ name: catalogues.name })
		.from(catalogues)
		.where(eq(catalogues.userId, me.userId))
		.orderBy(desc(catalogues.createdAt));
	return rows.map((row) => row.name);
}
