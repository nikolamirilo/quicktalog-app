import * as Sentry from "@sentry/nextjs";
import {
	getPublicCatalogue,
	getPublicCatalogueMeta,
} from "@/lib/catalogue/public";

/** One published catalogue by name, without its owner id. 404 for drafts and unknown names. */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ name: string }> },
) {
	try {
		const { name } = await params;
		const type = new URL(request.url).searchParams.get("type");

		const data =
			type === "meta"
				? await getPublicCatalogueMeta(name)
				: await getPublicCatalogue(name);

		if (!data) {
			return Response.json({ error: "Catalogue not found" }, { status: 404 });
		}

		return Response.json(data);
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { route: "items/[name]", method: "GET" },
		});
		console.error("Error retrieving catalogue:", error);
		return Response.json(
			{ error: "Failed to retrieve catalogue" },
			{ status: 500 },
		);
	}
}
