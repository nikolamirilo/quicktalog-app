import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { secretMatches } from "@/lib/http/secret";
import { z } from "zod";

export const dynamic = "force-dynamic";

const BodySchema = z.object({
	names: z
		.array(
			z
				.string()
				.min(1)
				.max(200)
				.regex(/^[^/?#\s]+$/),
		)
		.max(500)
		.optional(),
	dashboard: z.boolean().optional(),
});

/**
 * Purges catalogue caches for the background worker. Requires the shared
 * REVALIDATE_SECRET in the `x-revalidate-secret` header.
 * Body: `{ names?: string[], dashboard?: boolean }`.
 */
export async function POST(request: Request) {
	if (
		!secretMatches(
			request.headers.get("x-revalidate-secret"),
			process.env.REVALIDATE_SECRET,
		)
	) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	let body: unknown = {};
	try {
		const text = await request.text();
		body = text ? JSON.parse(text) : {};
	} catch {
		return Response.json({ error: "Invalid JSON" }, { status: 400 });
	}

	const parsed = BodySchema.safeParse(body);
	if (!parsed.success) {
		return Response.json({ error: "Invalid body" }, { status: 400 });
	}

	const { names = [], dashboard = false } = parsed.data;
	if (names.length === 0) {
		await revalidateCatalogue();
	}
	for (const name of names) {
		await revalidateCatalogue(name);
	}
	if (dashboard) {
		await revalidateDashboard();
	}

	return Response.json({ revalidated: names.length, dashboard });
}
