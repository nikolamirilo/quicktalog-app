import "server-only";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import { PUBLIC_CATALOGUE_COLUMNS, withPublic } from "@/utils/db";

const c = schema.catalogues;

/**
 * Visitor-facing reads. They run as `app_public`, which RLS limits to active
 * catalogues, and they never select `createdBy`, so an owner id cannot reach a
 * public page, an API response or the ISR cache.
 *
 * None of these read cookies or identity: their results are cached and shared
 * between visitors.
 */

export function listPublicCatalogueNames(): Promise<{ name: string }[]> {
	return withPublic((tx) =>
		tx.select({ name: c.name }).from(c).orderBy(c.name),
	);
}

export function getPublicCatalogue(name: string) {
	return withPublic(async (tx) => {
		const [row] = await tx
			.select(PUBLIC_CATALOGUE_COLUMNS)
			.from(c)
			.where(eq(c.name, name))
			.limit(1);
		return row ?? null;
	});
}

/** The subset a page needs for `generateMetadata`. */
export function getPublicCatalogueMeta(name: string) {
	return withPublic(async (tx) => {
		const [row] = await tx
			.select({
				name: c.name,
				heading: c.heading,
				logo: c.logo,
				metadata: c.metadata,
			})
			.from(c)
			.where(eq(c.name, name))
			.limit(1);
		return row ?? null;
	});
}
