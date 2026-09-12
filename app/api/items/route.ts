import { createClient } from "@/utils/supabase/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const status = searchParams.get("status");
		const supabase = await createClient();

		let query = supabase
			.from("catalogues")
			.select(type === "name" ? "name" : "*");

		if (status) {
			query = query.eq("status", status);
		}

		const { data, error } = await query;

		if (error) {
			Sentry.captureException(error, {
				level: "warning",
				tags: { route: "items", method: "GET" },
			});
			console.error("Error retreiving catalogues:", error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!data || data.length === 0) {
			return new Response(JSON.stringify({ error: "Catalogues not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new Response(JSON.stringify(data), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error: any) {
		console.error("Request error:", error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
