import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
		if (body.table !== "users") {
			return json({ message: `Ignored table: ${body.table}` });
		}

		const record = body.record;
		if (!record.email) {
			return json({ error: "Missing email in record" }, 400);
		}

		const brevoKey = Deno.env.get("BREVO_API_KEY");
		if (!brevoKey) {
			return json({ error: "Missing BREVO_API_KEY" }, 500);
		}

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL") || "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
		);

		// Fetch plan name
		let planName = "Free";
		if (record.plan_id) {
			const { data: plan } = await supabase
				.from("plans")
				.select("name")
				.eq("id", record.plan_id)
				.single();
			if (plan?.name) planName = plan.name;
		}

		// Check product newsletter subscription
		const { data: newsletter } = await supabase
			.from("product_newsletter")
			.select("id")
			.eq("email", record.email)
			.maybeSingle();

		const consents = record.consents || {};

		const attributes = {
			FIRSTNAME: record.name || "",
			PLAN: planName,
			PADDLE_CUSTOMER_ID: record.customer_id || "",
			PRODUCT_NEWSLETTER: newsletter ? "Yes" : "No",
			REFUND_POLICY: consents["refund-policy"] ? "Yes" : "No",
			TERMS_AND_CONDITIONS: consents["terms-and-conditions"] ? "Yes" : "No",
			PRIVACY_POLICY: consents["privacy-policy"] ? "Yes" : "No",
		};

		// Try to create contact
		const createRes = await fetch("https://api.brevo.com/v3/contacts/", {
			method: "POST",
			headers: {
				"api-key": brevoKey,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: record.email,
				attributes,
				listIds: [8],
				updateEnabled: true,
			}),
		});

		const createBody = await createRes.json();
		console.log("Brevo Response:", createBody);

		if (!createRes.ok) {
			return json({ error: "Brevo API error", details: createBody }, 500);
		}

		return json({
			success: true,
			action: body.type,
			brevo_id: createBody.id,
		});
	} catch (err) {
		console.error("Unexpected error:", err);
		return json({ error: "Server error", details: err.message }, 500);
	}
});

function json(data: unknown, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}
