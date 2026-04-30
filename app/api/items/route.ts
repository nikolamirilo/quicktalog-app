import * as Sentry from "@sentry/nextjs";
import { revalidateCatalogue } from "@/helpers/server";
import { createClient } from "@/utils/supabase/server";
import { generateUniqueSlug } from "@quicktalog/common";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
	try {
		const supabase = await createClient();
		const data = await request.json();

		const slug = generateUniqueSlug(data.name);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { createdAt, updatedAt, id, ...rest } = data;

		const { error } = await supabase
			.from("catalogues")
			.insert([
				{
					...rest,
					name: slug || data.name,
					status: data.status || "active",
				},
			])
			.select();

		if (error) {
			Sentry.captureException(error);
			console.error("Error inserting service catalogue:", error);
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}
		revalidateCatalogue(slug);
		return new Response(
			JSON.stringify({ catalogueUrl: `/catalogues/${name}`, slug: name }),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: any) {
		Sentry.captureException(error);
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
				updatedAt: new Date().toISOString(),
			})
			.eq("name", name)
			.select();

		if (error) {
			Sentry.captureException(error);
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

		revalidateCatalogue(name);

		return new Response(
			JSON.stringify({ catalogueUrl: `/catalogues/${name}`, slug: name }),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error: any) {
		Sentry.captureException(error);
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
			Sentry.captureException(error);
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
		Sentry.captureException(error);
		console.error("Request error:", error);
		return new Response(JSON.stringify({ error: error.message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
