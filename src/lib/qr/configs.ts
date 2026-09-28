import "server-only";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { ownsCatalogue } from "@/lib/catalogue/ownership";
import type { Tx } from "@/utils/db";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { Options } from "qr-code-styling";

const { catalogues, qrConfigs } = schema;

/**
 * The saved QR design of a catalogue owned by `me`, or undefined. Call inside
 * the page's `withUser` block. `qr_configs` has no owner column, so ownership
 * is spelled out as a join on `catalogues.created_by`; the `qr_configs_owner`
 * policy enforces the same thing again.
 */
export async function getOwnedQrConfig(
	tx: Tx,
	me: VerifiedIdentity,
	catalogue: string,
): Promise<Options | undefined> {
	const [row] = await tx
		.select({ config: qrConfigs.config })
		.from(qrConfigs)
		.innerJoin(catalogues, eq(catalogues.name, qrConfigs.catalogue))
		.where(
			and(
				eq(qrConfigs.catalogue, catalogue),
				eq(catalogues.createdBy, me.userId),
			),
		)
		.limit(1);
	return row?.config as Options | undefined;
}

/**
 * Saves the QR design of a catalogue owned by `me`, in the caller's
 * transaction. Returns false when the catalogue is not theirs.
 *
 * One statement on the `qr_configs_catalogue_key` unique index, so two saves of
 * the same catalogue cannot race into a duplicate row. Ownership is proven in
 * the same transaction, so it cannot change between the check and the write,
 * and `app_user` only holds `update (config, updated_at)`: `updated_at` is left
 * to the `qr_configs_touch_updated_at` trigger, and nothing else is ever set.
 *
 * A row belonging to someone else does not silently no-op: the policy turns it
 * into 42501, which the caller reports as "not found".
 */
export async function upsertOwnedQrConfig(
	tx: Tx,
	me: VerifiedIdentity,
	catalogue: string,
	config: Options,
): Promise<boolean> {
	if (!(await ownsCatalogue(tx, me, catalogue))) return false;

	const [row] = await tx
		.insert(qrConfigs)
		.values({ catalogue, config })
		.onConflictDoUpdate({
			target: qrConfigs.catalogue,
			set: { config },
			setWhere: eq(qrConfigs.catalogue, catalogue),
		})
		.returning({ id: qrConfigs.id });

	return Boolean(row);
}
