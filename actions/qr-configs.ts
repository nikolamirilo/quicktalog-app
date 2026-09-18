"use server";
import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import type { Options } from "qr-code-styling";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { ownsCatalogue } from "@/lib/catalogue/ownership";
import { drizzleClient } from "@/utils/drizzle";

export async function upsertQrConfig(
	catalogue: string,
	config: Options,
): Promise<{ success: boolean; error?: string }> {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return { success: false, error: "Unauthorized" };
		if (!(await ownsCatalogue(me, catalogue))) {
			return { success: false, error: "Catalogue not found" };
		}

		const existingConfig = await drizzleClient.query.qrConfigs.findFirst({
			where: eq(schema.qrConfigs.catalogue, catalogue),
			columns: { id: true },
		});

		if (existingConfig) {
			await drizzleClient
				.update(schema.qrConfigs)
				.set({
					config,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.qrConfigs.catalogue, catalogue));
		} else {
			await drizzleClient.insert(schema.qrConfigs).values({
				catalogue,
				config,
			});
		}

		return { success: true };
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "upsertQrConfig" },
		});
		console.error("Unexpected error while saving QR config:", err);
		return { success: false, error: "Failed to save QR design" };
	}
}
