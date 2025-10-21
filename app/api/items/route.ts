import { generateUniqueSlug } from "@quicktalog/common";
import { revalidateData } from "@/helpers/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const {
			name,
			created_by,
			services,
			theme,
			logo,
			title,
			currency,
			legal,
			contact,
			partners,
			subtitle,
			configuration,
			status,
		} = await request.json();

		const slug = generateUniqueSlug(name);

		const { error } = await supabase
			.from("catalogues")
			.insert([
				{
					name: slug || name,
					created_by,
					services,
					theme,
					logo,
					title,
					currency,
					legal,
					contact,
					partners,
					subtitle,
					status: status || "active",
					configuration,
				},
			])
			.select();

		if (error) {
			console.error("Error inserting service catalogue:", error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
		await revalidateData();
		return new Response(
			JSON.stringify({ catalogueUrl: `/catalogues/${name}`, slug: name }),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: any) {
		console.error("Request error:", error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
export async function PATCH(request: Request) {
	try {
		const supabase = await createClient();
		const {
			name,
			services,
			theme,
			logo,
			title,
			currency,
			partners,
			legal,
			contact,
			subtitle,
			configuration,
			status,
		} = await request.json();
		const { data, error } = await supabase
			.from("catalogues")
			.update({
				services,
				theme,
				logo,
				title,
				currency,
				legal,
				contact,
				subtitle,
				partners,
				configuration,
				status: status || "active",
				updated_at: new Date().toISOString(),
			})
			.eq("name", name)
			.select();

		if (error) {
			console.error("Error updating service catalogue:", error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!data || data.length === 0) {
			return new Response(JSON.stringify({ error: "Catalogue not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		await revalidateData();

		return new Response(
			JSON.stringify({ catalogueUrl: `/catalogues/${name}`, slug: name }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: any) {
		console.error("Request error:", error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const supabase = await createClient();

		// Update the service catalogue record
		const { data, error } = await supabase
			.from("catalogues")
			.select(type === "name" ? "name" : "*");

		if (error) {
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
