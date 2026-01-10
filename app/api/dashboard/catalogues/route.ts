import { drizzleClient } from "@/drizzle/db";
import { catalogues } from "@/drizzle/migrations/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const { id } = await currentUser();

		if (!id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await drizzleClient.query.catalogues.findMany({
			where: eq(catalogues.createdBy, id),
		});

		return NextResponse.json(data || []);
	} catch (error) {
		console.error("Failed to fetch catalogues:", error);
		return NextResponse.json(
			{ error: "Failed to fetch catalogues" },
			{ status: 500 },
		);
	}
}
