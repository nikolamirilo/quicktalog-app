import { drizzleClient } from "@/utils/drizzle";
import { currentUser } from "@clerk/nextjs/server";
import { schema } from "@quicktalog/common";
import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

const { newsletter, catalogues } = schema;

export async function GET() {
	try {
		const user = await currentUser();

		if (!user?.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const newsletterRows = await drizzleClient
			.select()
			.from(newsletter)
			.where(eq(newsletter.ownerId, user.id));

		if (newsletterRows.length === 0) {
			return NextResponse.json([]);
		}

		const uniqueCatalogueIds = [
			...new Set(
				newsletterRows.map((r) => r.catalogueId).filter(Boolean) as string[],
			),
		];

		const catalogueRows =
			uniqueCatalogueIds.length > 0
				? await drizzleClient
						.select({ id: catalogues.id, name: catalogues.name })
						.from(catalogues)
						.where(inArray(catalogues.id, uniqueCatalogueIds))
				: [];

		const catalogueNameMap: Record<string, string> = {};
		for (const c of catalogueRows) {
			if (c.id) catalogueNameMap[c.id] = c.name;
		}

		const data = newsletterRows.map((row) => ({
			id: row.id,
			email: row.email,
			catalogueName: catalogueNameMap[row.catalogueId] ?? null,
			catalogueId: row.catalogueId,
			createdAt: row.createdAt,
		}));

		return NextResponse.json(data);
	} catch (error) {
		console.error("Failed to fetch newsletter subscribers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch newsletter subscribers" },
			{ status: 500 },
		);
	}
}
