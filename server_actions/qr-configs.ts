"use server";

import { drizzleClient } from "@/drizzle/db";
import { qrConfigs } from "@/drizzle/migrations/schema";
import { eq } from "drizzle-orm";
import type { Options } from "qr-code-styling";

export async function upsertQrConfig(
	catalogue: string,
	config: Options,
): Promise<{ success: boolean; error?: string }> {
	try {
		// First, check if a config already exists for this catalogue
		const existingConfig = await drizzleClient.query.qrConfigs.findFirst({
			where: eq(qrConfigs.catalogue, catalogue),
			columns: { id: true },
		});

		if (existingConfig) {
			// Update existing config
			await drizzleClient
				.update(qrConfigs)
				.set({
					config,
					updatedAt: new Date().toISOString(),
				})
				.where(eq(qrConfigs.catalogue, catalogue));
		} else {
			// Insert new config
			await drizzleClient.insert(qrConfigs).values({
				catalogue,
				config,
			});
		}

		return { success: true };
	} catch (err) {
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
			where: eq(qrConfigs.catalogue, catalogue),
			columns: { config: true },
		});

		if (!data) {
			// No config found, return success with no config
			return { success: true };
		}

		return { success: true, config: data.config as Options };
	} catch (err) {
		console.error("Unexpected error while fetching QR config:", err);
		return {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error",
		};
	}
}
