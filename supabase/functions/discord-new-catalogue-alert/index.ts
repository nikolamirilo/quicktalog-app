import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
Deno.serve(async (req) => {
	try {
		if (req.method !== "POST") {
			return new Response(
				JSON.stringify({
					error: "POST only",
				}),
				{
					status: 405,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}
		let body;
		try {
			const rawBody = await req.text();
			console.log("Raw request body:", rawBody);
			if (!rawBody.trim()) {
				return new Response(
					JSON.stringify({
						error: "Request body is empty",
					}),
					{
						status: 400,
						headers: {
							"Content-Type": "application/json",
						},
					},
				);
			}
			body = JSON.parse(rawBody);
			console.log("Parsed body type:", body.type);
		} catch (parseError) {
			console.error("JSON parse error:", parseError);
			return new Response(
				JSON.stringify({
					error: "Invalid JSON in request body",
					details: parseError.message,
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}
		// Handle database webhook payload
		if (body.type && body.table && body.record) {
			console.log("Processing database webhook for table:", body.table);
			if (body.table !== "catalogues") {
				return new Response(
					JSON.stringify({
						message: "Ignoring webhook for table: " + body.table,
					}),
					{
						status: 200,
						headers: {
							"Content-Type": "application/json",
						},
					},
				);
			}
			const record = body.record;
			const action = body.type;
			const webhook = Deno.env.get("DISCORD_WEBHOOK_URL");
			// Initialize Supabase client
			const supabase = createClient(
				Deno.env.get("SUPABASE_URL") || "",
				Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "",
			);
			// Fetch user email from users table
			let userEmail = "N/A";
			if (record.created_by) {
				const { data, error } = await supabase
					.from("users")
					.select("email")
					.eq("id", record.created_by)
					.single();
				if (error) {
					console.error("Error fetching user email:", error);
				} else if (data?.email) {
					userEmail = data.email;
				}
			}
			// Build payload for Discord webhook
			const payload = {
				content: "",
				username: "Quicktalog Bot",
				embeds: [
					{
						title: `🆕 Catalogue Created!`,
						color:
							action === "INSERT"
								? 0x00ff00
								: action === "UPDATE"
									? 0xffff00
									: 0xff0000,
						fields: [
							{
								name: "Catalogue URL",
								value:
									`https://www.quicktalog.app/catalogues/${record.name}` ||
									"N/A",
								inline: false,
							},
							{
								name: "Created By",
								value: userEmail,
								inline: false,
							},
							{
								name: "Title",
								value: record.title || "N/A",
								inline: false,
							},
							{
								name: "Created At",
								value: record.created_at || "N/A",
								inline: false,
							},
						],
					},
				],
			};
			console.log(
				"Sending payload to Discord:",
				JSON.stringify(payload, null, 2),
			);
			// Send to Discord
			const resp = await fetch(webhook, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			const text = await resp.text();
			const status = resp.status;
			console.log("Discord response status:", status);
			console.log("Discord response:", text);
			return new Response(
				JSON.stringify({
					success: true,
					action: action,
					table: body.table,
					discord_status: status,
				}),
				{
					status: 200,
					headers: {
						"Content-Type": "application/json",
					},
				},
			);
		}
		// Handle manual API calls
		if (body.message) {
			const webhook = Deno.env.get("DISCORD_WEBHOOK_URL");
			const payload = {
				content: body.message,
				username: body.username || undefined,
				avatar_url: body.avatar_url || undefined,
				embeds: body.embeds || undefined,
				allowed_mentions: body.allowed_mentions || undefined,
			};
			Object.keys(payload).forEach(
				(k) => payload[k] === undefined && delete payload[k],
			);
			const resp = await fetch(webhook, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			const text = await resp.text();
			const status = resp.status;
			const ct = resp.headers.get("content-type") || "text/plain";
			return new Response(text, {
				status,
				headers: {
					"Content-Type": ct,
				},
			});
		}
		// If neither webhook nor manual message format
		return new Response(
			JSON.stringify({
				error:
					"Invalid request format. Expected either database webhook or message field.",
				received_keys: Object.keys(body),
			}),
			{
				status: 400,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	} catch (err) {
		console.error("Unexpected error:", err);
		return new Response(
			JSON.stringify({
				error: "Internal server error",
				details: err.message,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
	}
});
