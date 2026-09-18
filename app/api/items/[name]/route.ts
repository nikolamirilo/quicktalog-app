import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { PUBLIC_CATALOGUE_COLUMNS } from "@/utils/db/columns";
import { drizzleClient } from "@/utils/drizzle";

const { catalogues } = schema;

const META_COLUMNS = {
	name: catalogues.name,
	heading: catalogues.heading,
	logo: catalogues.logo,
	metadata: catalogues.metadata,
};

/** One published catalogue by name, without its owner id. 404 for drafts and unknown names. */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ name: string }> },
) {
	try {
		const { name } = await params;
		const type = new URL(request.url).searchParams.get("type");

		const [data] = await drizzleClient
			.select(type === "meta" ? META_COLUMNS : PUBLIC_CATALOGUE_COLUMNS)
			.from(catalogues)
			.where(and(eq(catalogues.name, name), eq(catalogues.status, "active")))
			.limit(1);

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
