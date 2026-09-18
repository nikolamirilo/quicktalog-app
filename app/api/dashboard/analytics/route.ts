import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { count, eq, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { drizzleClient } from "@/utils/drizzle";

const { analytics, newsletter } = schema;

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const [[traffic], [subscribers]] = await Promise.all([
			drizzleClient
				.select({
					pageViews: sum(analytics.pageviewCount),
					uniqueVisitors: sum(analytics.uniqueVisitors),
				})
				.from(analytics)
				.where(eq(analytics.userId, me.userId)),
			drizzleClient
				.select({ total: count() })
				.from(newsletter)
				.where(eq(newsletter.ownerId, me.userId)),
		]);

		return NextResponse.json({
			totalPageViews: Number(traffic?.pageViews ?? 0),
			totalUniqueVisitors: Number(traffic?.uniqueVisitors ?? 0),
			totalNewsletterSubscriptions: subscribers?.total ?? 0,
		});
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
