import * as Sentry from "@sentry/nextjs";
import { listPublicCatalogueNames } from "@/lib/catalogue/public";

export const dynamic = "force-dynamic";

/**
 * Names of published catalogues, for generateStaticParams and the sitemap.
 * Drafts, content and owners are never listed here.
 */
export async function GET() {
	try {
		const data = await listPublicCatalogueNames();

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
