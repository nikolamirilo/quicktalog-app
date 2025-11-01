import { revalidateData, revalidatePageData } from "@/helpers/server";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		await revalidateData();
		return new Response(
			JSON.stringify({ message: "Data revalidated successuflly" }),
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
