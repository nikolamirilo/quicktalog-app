"use server";

import type { Options } from "qr-code-styling";
import { createClient } from "@/utils/supabase/server";

export async function upsertQrConfig(
	catalogue: string,
	config: Options,
): Promise<{ success: boolean; error?: string }> {
	try {
		const supabase = await createClient();

		// First, check if a config already exists for this catalogue
		const { data: existingConfig, error: fetchError } = await supabase
			.from("qr_configs")
			.select("id")
			.eq("catalogue", catalogue)
			.single();

		if (fetchError && fetchError.code !== "PGRST116") {
			// PGRST116 is "not found" error, which is fine
			console.error("Error fetching existing config:", fetchError.message);
			return { success: false, error: fetchError.message };
		}

		if (existingConfig) {
			// Update existing config
			const { error: updateError } = await supabase
				.from("qr_configs")
				.update({
					config,
					updated_at: new Date().toISOString(),
				})
				.eq("catalogue", catalogue);

			if (updateError) {
				console.error("Failed to update QR config:", updateError.message);
				return { success: false, error: updateError.message };
			}
		} else {
			// Insert new config
			const { error: insertError } = await supabase.from("qr_configs").insert({
				catalogue,
				config,
			});

			if (insertError) {
				console.error("Failed to insert QR config:", insertError.message);
				return { success: false, error: insertError.message };
			}
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
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("qr_configs")
			.select("config")
			.eq("catalogue", catalogue)
			.single();

		if (error) {
			if (error.code === "PGRST116") {
				// No config found, return success with no config
				return { success: true };
			}
			console.error("Failed to fetch QR config:", error.message);
			return { success: false, error: error.message };
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
