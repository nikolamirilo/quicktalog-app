import "server-only";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import type { Options } from "qr-code-styling";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { drizzleClient } from "@/utils/drizzle";

const { catalogues, qrConfigs } = schema;

/** The saved QR design of a catalogue owned by `me`, or undefined. */
export async function getOwnedQrConfig(
	me: VerifiedIdentity,
	catalogue: string,
): Promise<Options | undefined> {
	const [row] = await drizzleClient
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
