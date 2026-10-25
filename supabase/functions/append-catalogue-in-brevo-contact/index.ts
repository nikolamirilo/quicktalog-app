import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isAuthorizedWebhook, unauthorized } from "../_shared/webhook.ts";

Deno.serve(async (req) => {
	if (!isAuthorizedWebhook(req)) return unauthorized();

	try {
		const raw = await req.text();
		if (!raw.trim()) {
			return json({ error: "Empty body" }, 400);
		}

		const body = JSON.parse(raw);
		if (!body.table || !body.record) {
			return json({ message: "Invalid webhook format" }, 400);
		}
		if (body.table !== "catalogues") {
			return json({ message: `Ignored table: ${body.table}` });
		}

		const record = body.record;
		if (!record.created_by || !record.name) {
			return json({ error: "Missing required fields in record" }, 400);
		}

		const brevoKey = Deno.env.get("BREVO_API_KEY");
		if (!brevoKey) {
			return json({ error: "Missing BREVO_API_KEY" }, 500);
		}

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL") || "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
		);

		// Get user email
		const { data: user, error: userErr } = await supabase
			.from("users")
			.select("email")
			.eq("id", record.created_by)
			.single();

		if (userErr || !user?.email) {
			return json({ error: "User not found" }, 400);
		}

		// Fetch existing contact from Brevo
		const getRes = await fetch(
			`https://api.brevo.com/v3/contacts/${encodeURIComponent(user.email)}`,
			{
				headers: {
					"api-key": brevoKey,
					"Content-Type": "application/json",
				},
			},
		);

		if (!getRes.ok) {
			return json({ error: "Contact not found in Brevo" }, 404);
		}

		const contact = await getRes.json();
		const existing = contact.attributes?.CATALOGUES || "";
		const newUrl = `https://www.quicktalog.app/catalogues/${record.name}`;
		const updated = existing ? `${existing}, ${newUrl}` : newUrl;

		// Update contact
		const updateRes = await fetch(
			`https://api.brevo.com/v3/contacts/${encodeURIComponent(user.email)}`,
			{
				method: "PUT",
				headers: {
					"api-key": brevoKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					attributes: {
						CATALOGUES: updated,
					},
				}),
			},
		);

		if (!updateRes.ok) {
			const updateBody = await updateRes.json();
			return json({ error: "Brevo update failed", details: updateBody }, 500);
		}

		return json({
			success: true,
			email: user.email,
			catalogues: updated,
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
