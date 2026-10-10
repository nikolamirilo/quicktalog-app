import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { selectMyCatalogues } from "@/lib/dashboard/overview";
import { withUser } from "@/utils/db";

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await withUser(me, (tx) => selectMyCatalogues(tx, me));

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
