"use server";
import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import type { Options } from "qr-code-styling";
import { drizzleClient } from "@/utils/drizzle";

export async function upsertQrConfig(
	catalogue: string,
	config: Options,
): Promise<{ success: boolean; error?: string }> {
	try {
		// First, check if a config already exists for this catalogue
		const existingConfig = await drizzleClient.query.qrConfigs.findFirst({
			where: eq(schema.qrConfigs.catalogue, catalogue),
			columns: { id: true },
		});

		if (existingConfig) {
			// Update existing config
			await drizzleClient
				.update(schema.qrConfigs)
				.set({
					config,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(schema.qrConfigs.catalogue, catalogue));
		} else {
			// Insert new config
			await drizzleClient.insert(schema.qrConfigs).values({
				catalogue,
				config,
			});
		}

		return { success: true };
	} catch (err) {
		Sentry.captureException(err);
		console.error("Unexpected error while saving QR config:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}

export async function getQrConfig(
	catalogue: string,
): Promise<{ success: boolean; config?: Options; error?: string }> {
	try {
		const data = await drizzleClient.query.qrConfigs.findFirst({
			where: eq(schema.qrConfigs.catalogue, catalogue),
			columns: { config: true },
		});

		if (!data) {
			// No config found, return success with no config
			return { success: true };
		}

		return { success: true, config: data.config as Options };
	} catch (err) {
		Sentry.captureException(err);
		console.error("Unexpected error while fetching QR config:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}
