import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { tiers } from "https://unpkg.com/@quicktalog/common@1.15.0/dist/pricing.js";

Deno.serve(async (req) => {
	try {
		const raw = await req.text();
		if (!raw.trim()) {
			return json({ error: "Empty body" }, 400);
		}

		const body = JSON.parse(raw);
		if (!body.table || !body.record) {
			return json({ message: "Invalid webhook format" }, 400);
		}
		if (body.table !== "subscriptions") {
			return json({ message: `Ignored table: ${body.table}` });
		}

		const record = body.record;
		if (
			!record.customer_id ||
			!record.price_id ||
			!record.subscription_status
		) {
			return json({ error: "Missing required fields in record" }, 400);
		}

		const hubspotKey = Deno.env.get("HUBSPOT_API_TOKEN");
		if (!hubspotKey) {
			return json({ error: "Missing HUBSPOT_API_TOKEN" }, 500);
		}

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL") || "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
		);

		const { data: user, error: userErr } = await supabase
			.from("users")
			.select("id,email,name")
			.eq("customer_id", record.customer_id)
			.single();

		if (userErr || !user?.email) {
			return json({ error: "User not found for subscription" }, 400);
		}

		const { data: catalogues, error: cataloguesError } = await supabase
			.from("catalogues")
			.select("name")
			.eq("created_by", user.id);

		if (cataloguesError) {
			return json({ error: "Catalogues not found for selected user" }, 400);
		}

		const cataloguesData = catalogues
			.map((i) => `https://www.quicktalog.app/catalogues/${i.name}`)
			.join(", ");

		const matchedTier = tiers.find((tier) =>
			Object.values(tier.priceId).includes(record.price_id),
		);

		const payload = {
			properties: {
				email: user.email,
				firstname: user.name || "",
				subscription_status: record.subscription_status,
				price_id: record.price_id,
				plan_name: matchedTier ? matchedTier.name : "Starter",
				subscription_created_at: record.created_at,
				subscription_updated_at: record.updated_at,
				catalogues: cataloguesData,
			},
		};

		// CREATE contact in HubSpot
		const createRes = await fetch(
			"https://api.hubapi.com/crm/v3/objects/contacts",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${hubspotKey}`,
				},
				body: JSON.stringify(payload),
			},
		);

		const createBody = await createRes.json();
		console.log("HubSpot Create Response:", createBody);

		// If creation fails, check for "contact already exists"
		if (!createRes.ok) {
			const message = createBody?.message || "";

			if (
				createBody.status === "error" &&
				createBody.category === "CONFLICT" &&
				message.includes("Contact already exists")
			) {
				// Extract ID from: "Existing ID: 533139849419"
				const idMatch = message.match(/Existing ID: (\d+)/);
				const existingId = idMatch ? idMatch[1] : null;

				if (!existingId) {
					return json(
						{ error: "Conflict but no existing ID found", details: createBody },
						500,
					);
				}

				// PATCH the existing contact
				const patchRes = await fetch(
					`https://api.hubapi.com/crm/v3/objects/contacts/${existingId}`,
					{
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${hubspotKey}`,
						},
						body: JSON.stringify(payload),
					},
				);

				const patchBody = await patchRes.json();
				console.log("HubSpot Patch Response:", patchBody);

				if (!patchRes.ok) {
					return json(
						{
							error: "Failed to update existing HubSpot contact",
							details: patchBody,
						},
						500,
					);
				}

				return json({
					success: true,
					action: "updated_existing",
					hubspot_id: existingId,
				});
			}

			return json({ error: "HubSpot API error", details: createBody }, 500);
		}

		// Successful creation
		return json({
			success: true,
			action: body.type,
			hubspot_id: createBody.id,
		});
	} catch (err) {
		console.error("Unexpected error:", err);
		return json({ error: "Server error", details: err.message }, 500);
	}
});

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
