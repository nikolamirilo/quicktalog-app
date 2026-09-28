import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";

const catalogues = schema.catalogues;

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await withUser(me, (tx) =>
			tx.select().from(catalogues).where(eq(catalogues.createdBy, me.userId)),
		);

		return NextResponse.json(data);
	} catch (error) {
		Sentry.captureException(error, {
			tags: { route: "dashboard/catalogues" },
		});
		console.error("Failed to fetch catalogues:", error);
		return NextResponse.json(
			{ error: "Failed to fetch catalogues" },
			{ status: 500 },
		);
	}
}
