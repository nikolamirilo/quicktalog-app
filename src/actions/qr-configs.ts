"use server";
import * as Sentry from "@sentry/nextjs";
import { QR_CONFIG_MAX_BYTES, qrConfigSchema } from "@/constants/schemas";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { upsertOwnedQrConfig } from "@/lib/qr/configs";
import {
	catalogueUrl,
	normalizeQrConfig,
	type QrConfig,
} from "@/lib/qr/design";
import { pgError, withUser } from "@/utils/db";

const TOO_LARGE = "Design too large. Remove the logo or shorten the text.";

export async function upsertQrConfig(
	catalogue: string,
	config: QrConfig,
): Promise<{ success: boolean; error?: string }> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };
		if (typeof catalogue !== "string" || catalogue.length > 200) {
			return { success: false, error: "Catalogue not found" };
		}

		// Only known option groups survive, with checked colours, sizes and an
		// uploaded logo; everything else the client sent is dropped.
		const parsed = qrConfigSchema.safeParse(config);
		if (!parsed.success) {
			return { success: false, error: "Invalid QR design" };
		}

		// The code always points at the catalogue's own URL, whatever was sent.
		const design = normalizeQrConfig(
			parsed.data as QrConfig,
			catalogueUrl(catalogue),
		);
		if (
			new TextEncoder().encode(JSON.stringify(design)).length >
			QR_CONFIG_MAX_BYTES
		) {
			return { success: false, error: TOO_LARGE };
		}

		const saved = await withUser(me, (tx) =>
			upsertOwnedQrConfig(tx, me, catalogue, design),
		);
		if (!saved) return { success: false, error: "Catalogue not found" };

		return { success: true };
	} catch (err) {
		const pg = pgError(err);
		// A policy violation means the catalogue is not the caller's (or stopped
		// being theirs mid-transaction). That is a "not found", not a 500.
		if (pg?.code === "42501") {
			return { success: false, error: "Catalogue not found" };
		}
		// The database's own size limit: a user-facing answer, not a Sentry event.
		if (pg?.code === "23514" && pg.constraint === "qr_configs_config_size") {
			return { success: false, error: TOO_LARGE };
		}
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "upsertQrConfig" },
		});
		console.error("Unexpected error while saving QR config:", err);
		return { success: false, error: "Failed to save QR design" };
	}
}
