import "server-only";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { Tx } from "@/utils/db";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";

const { catalogues } = schema;

/**
 * True when `me` owns the catalogue with this name. Always call inside the
 * caller's `withUser` block, so the check and the work it guards see the same
 * snapshot and cannot be separated by a concurrent rename or delete.
 */
export async function ownsCatalogue(
	tx: Tx,
	me: VerifiedIdentity,
	catalogue: string,
): Promise<boolean> {
	const [row] = await tx
		.select({ id: catalogues.id })
		.from(catalogues)
		.where(
			and(eq(catalogues.name, catalogue), eq(catalogues.createdBy, me.userId)),
		)
		.limit(1);
	return Boolean(row);
}
