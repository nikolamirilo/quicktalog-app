import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { selectDashboardAnalytics } from "@/lib/dashboard/overview";
import { withUser } from "@/utils/db";

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const totals = await withUser(me, (tx) => selectDashboardAnalytics(tx, me));

		return NextResponse.json(totals);
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { route: "dashboard/analytics" },
		});
		console.error("Dashboard analytics fetch failed:", error);
		return NextResponse.json(
			{ error: "Failed to fetch analytics" },
			{ status: 500 },
		);
	}
}
