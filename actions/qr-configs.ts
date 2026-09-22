"use server";
import * as Sentry from "@sentry/nextjs";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { upsertOwnedQrConfig } from "@/lib/qr/configs";
import { pgError, withUser } from "@/utils/db";
import type { Options } from "qr-code-styling";

export async function upsertQrConfig(
	catalogue: string,
	config: Options,
): Promise<{ success: boolean; error?: string }> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };

		const saved = await withUser(me, (tx) =>
			upsertOwnedQrConfig(tx, me, catalogue, config),
		);
		if (!saved) return { success: false, error: "Catalogue not found" };

		return { success: true };
	} catch (err) {
		// A policy violation means the catalogue is not the caller's (or stopped
		// being theirs mid-transaction). That is a "not found", not a 500.
		if (pgError(err)?.code === "42501") {
			return { success: false, error: "Catalogue not found" };
		}
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "upsertQrConfig" },
		});
		console.error("Unexpected error while saving QR config:", err);
		return { success: false, error: "Failed to save QR design" };
	}
}
