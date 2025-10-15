import { createClient } from "@/utils/supabase/server";

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ name: string }> },
) {
	try {
		const { name } = await params;
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");
		const supabase = await createClient();

		const { data, error } = await supabase
			.from("catalogues")
			.select(type === "meta" ? "title, subtitle" : "*")
			.eq("name", name)
			.single();

		if (error) {
			return new Response(JSON.stringify({ error: error.message }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (!data) {
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
		return new Response(JSON.stringify({ error: error.message }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}
}
