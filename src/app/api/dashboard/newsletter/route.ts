import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { selectMyNewsletterSubscribers } from "@/lib/dashboard/overview";
import { withUser } from "@/utils/db";

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const data = await withUser(me, (tx) =>
			selectMyNewsletterSubscribers(tx, me),
		);

		return NextResponse.json(data);
	} catch (error) {
		Sentry.captureException(error, {
			tags: { route: "dashboard/newsletter" },
		});
		console.error("Failed to fetch newsletter subscribers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch newsletter subscribers" },
			{ status: 500 },
		);
	}
}
