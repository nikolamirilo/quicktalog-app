import * as Sentry from "@sentry/nextjs";
import { drizzleClient } from "@/utils/drizzle";
import { currentUser } from "@clerk/nextjs/server";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

const catalogues = schema.catalogues;

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
		Sentry.captureException(error);
		console.error("Failed to fetch catalogues:", error);
		return NextResponse.json(
			{ error: "Failed to fetch catalogues" },
			{ status: 500 },
		);
	}
}
