import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { count, eq, sum } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";

const { analytics, newsletter } = schema;

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Both statements share one connection, so they run one after the other
		// rather than through Promise.all.
		const totals = await withUser(me, async (tx) => {
			const [traffic] = await tx
				.select({
					pageViews: sum(analytics.pageviewCount),
					uniqueVisitors: sum(analytics.uniqueVisitors),
				})
				.from(analytics)
				.where(eq(analytics.userId, me.userId));

			const [subscribers] = await tx
				.select({ total: count() })
				.from(newsletter)
				.where(eq(newsletter.ownerId, me.userId));

			return { traffic, subscribers };
		});

		return NextResponse.json({
			totalPageViews: Number(totals.traffic?.pageViews ?? 0),
			totalUniqueVisitors: Number(totals.traffic?.uniqueVisitors ?? 0),
			totalNewsletterSubscriptions: totals.subscribers?.total ?? 0,
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
