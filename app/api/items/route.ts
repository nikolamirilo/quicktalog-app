import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { asc, eq } from "drizzle-orm";
import { drizzleClient } from "@/utils/drizzle";

const { catalogues } = schema;

export const dynamic = "force-dynamic";

/**
 * Names of published catalogues, for generateStaticParams and the sitemap.
 * Drafts, content and owners are never listed here.
 */
export async function GET() {
	try {
		const data = await drizzleClient
			.select({ name: catalogues.name })
			.from(catalogues)
			.where(eq(catalogues.status, "active"))
			.orderBy(asc(catalogues.name));

		return Response.json(data);
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { route: "items", method: "GET" },
		});
		console.error("Error retrieving catalogues:", error);
		return Response.json(
			{ error: "Failed to retrieve catalogues" },
			{ status: 500 },
		);
	}
}
