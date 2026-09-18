import "server-only";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { drizzleClient } from "@/utils/drizzle";

const { catalogues } = schema;

/** True when `me` owns the catalogue with this name. */
export async function ownsCatalogue(
	me: VerifiedIdentity,
	catalogue: string,
): Promise<boolean> {
	const row = await drizzleClient.query.catalogues.findFirst({
		where: and(
			eq(catalogues.name, catalogue),
			eq(catalogues.createdBy, me.userId),
		),
		columns: { id: true },
	});
	return Boolean(row);
}
