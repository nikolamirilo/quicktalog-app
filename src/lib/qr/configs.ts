import "server-only";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { getOwnedCatalogue } from "@/lib/catalogue/ownership";
import type { Tx } from "@/utils/db";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { QrConfig } from "@/lib/qr/design";

const { catalogues, qrConfigs } = schema;

/**
 * The saved QR design of a catalogue owned by `me`, or undefined. Call inside
 * the page's `withUser` block. `qr_configs` has no owner column, so ownership
 * is spelled out as a join on `catalogues.user_id`; the `qr_configs_owner`
 * policy enforces the same thing again.
 */
export async function getOwnedQrConfig(
	tx: Tx,
	me: VerifiedIdentity,
	catalogue: string,
): Promise<QrConfig | undefined> {
	const [row] = await tx
		.select({ config: qrConfigs.config })
		.from(qrConfigs)
		.innerJoin(catalogues, eq(catalogues.id, qrConfigs.catalogueId))
		.where(
			and(eq(catalogues.name, catalogue), eq(catalogues.userId, me.userId)),
		)
		.limit(1);
	return row?.config as QrConfig | undefined;
}

/**
 * Saves the QR design of a catalogue owned by `me`, in the caller's
 * transaction. Returns false when the catalogue is not theirs.
 *
 * One statement on the `qr_configs_catalogue_id_key` unique index, so two saves of
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
	config: QrConfig,
): Promise<boolean> {
	const owned = await getOwnedCatalogue(tx, me, catalogue);
	if (!owned) return false;

	const [row] = await tx
		.insert(qrConfigs)
		.values({ catalogueId: owned.id, config })
		.onConflictDoUpdate({
			target: qrConfigs.catalogueId,
			set: { config },
			setWhere: eq(qrConfigs.catalogueId, owned.id),
		})
		.returning({ id: qrConfigs.id });

	return Boolean(row);
}
