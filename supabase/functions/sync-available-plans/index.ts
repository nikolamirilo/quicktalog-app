import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { tiers } from "https://unpkg.com/@quicktalog/common@1.15.0/dist/pricing.js";
import { isAuthorizedWebhook, unauthorized } from "../_shared/webhook.ts";

Deno.serve(async (req) => {
	if (!isAuthorizedWebhook(req)) return unauthorized();

	try {
		if (!tiers || !Array.isArray(tiers)) {
			return json({ error: "tiers is not available" }, 500);
		}

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL")!,
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
		);

		const rows = tiers.flatMap((tier: any) =>
			Object.values(tier.priceId).map((priceId) => ({
				id: priceId as string,
				name: tier.name,
				updated_at: new Date().toISOString(),
			})),
		);

		// Deduplicate by id (keep first occurrence)
		const unique = [...new Map(rows.map((r) => [r.id, r])).values()];

		if (!unique.length) {
			return json({ error: "No tiers found in package" }, 500);
		}

		const { error } = await supabase
			.from("plans")
			.upsert(unique, { onConflict: "id" });

		if (error) {
			return json(
				{
					error: "Upsert failed",
					details: error.message,
					code: error.code,
					hint: error.hint,
				},
				500,
			);
		}

		return json({
			success: true,
			synced: unique.length,
			plans: unique.map((r) => `${r.name} (${r.id})`),
		});
	} catch (err) {
		console.error("sync-plans error:", err);
		return json(
			{ error: "Server error", details: (err as Error).message },
			500,
		);
	}
});

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
