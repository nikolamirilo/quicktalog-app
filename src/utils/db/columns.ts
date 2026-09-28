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

/**
 * Catalogue fields a client may change. `id`, `name`, `createdBy`, `status`,
 * `source` and the timestamps are server-owned: the client sends them back in
 * the full `Catalogue` object, and they must never reach an UPDATE.
 */
export const CATALOGUE_EDITABLE_FIELDS = [
	"logo",
	"heading",
	"language",
	"currency",
	"businessType",
	"content",
	"legal",
	"appearance",
	"contact",
	"header",
	"footer",
	"partners",
	"metadata",
	"tags",
] as const;

type EditableField = (typeof CATALOGUE_EDITABLE_FIELDS)[number];

/** Keeps only the editable fields that are actually present in `data`. */
export function pickEditable<T extends Record<string, unknown>>(
	data: T,
): Pick<T, Extract<keyof T, EditableField>> {
	const out: Record<string, unknown> = {};
	for (const field of CATALOGUE_EDITABLE_FIELDS) {
		if (field in data && data[field] !== undefined) out[field] = data[field];
	}
	return out as Pick<T, Extract<keyof T, EditableField>>;
}
