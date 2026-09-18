import "server-only";
import { schema } from "@quicktalog/common";

const { catalogues } = schema;

/**
 * Catalogue columns that may be shown publicly. `createdBy` is left out so owner
 * ids never reach public pages, API responses or the ISR cache.
 */
export const PUBLIC_CATALOGUE_COLUMNS = {
	id: catalogues.id,
	name: catalogues.name,
	logo: catalogues.logo,
	heading: catalogues.heading,
	status: catalogues.status,
	source: catalogues.source,
	language: catalogues.language,
	currency: catalogues.currency,
	businessType: catalogues.businessType,
	content: catalogues.content,
	legal: catalogues.legal,
	appearance: catalogues.appearance,
	contact: catalogues.contact,
	header: catalogues.header,
	footer: catalogues.footer,
	partners: catalogues.partners,
	metadata: catalogues.metadata,
	tags: catalogues.tags,
	createdAt: catalogues.createdAt,
	updatedAt: catalogues.updatedAt,
};
