import * as Sentry from "@sentry/nextjs";
import { endOfMonth, startOfMonth } from "@/helpers/client";
import { drizzleClient } from "@/utils/drizzle";
import { schema, tiers } from "@quicktalog/common";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const { analytics, catalogues, ocr, prompts, users } = schema;

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		// Fetch user data
		const user = await drizzleClient.query.users.findFirst({
			where: eq(users.id, id),
		});

		if (!user) {
			console.warn(`User data not found for Clerk ID: ${id}.`);
			return NextResponse.json({ error: "User not found" }, { status: 404 });
		}

		const planId = user.planId;
		const pricingPlan = tiers.find((tier) =>
			planId ? Object.values(tier.priceId).includes(planId) : false,
		);

		if (!pricingPlan) {
			console.warn(`Pricing plan not found for Plan ID: ${planId}.`);
			return NextResponse.json(
				{ error: "Pricing plan not found" },
				{ status: 500 },
			);
		}

		const nextPlan =
			tiers
				.filter((item) => item.type === "standard")
				.find(
					(item) =>
						item.features.items_per_catalogue >
							pricingPlan.features.items_per_catalogue && item.id > 1,
				) || pricingPlan;

		const billingPeriod = Object.entries(pricingPlan.priceId).find(
			([_, id]) => id === planId,
		)?.[0] as "month" | "year";

		try {
			// Fetch usage data parallel
			const [cataloguesUsage, trafficUsage, ocrUsage, promptsUsage] =
				await Promise.all([
					// Catalogues count
					drizzleClient
						.select({ count: count() })
						.from(catalogues)
						.where(eq(catalogues.createdBy, id)),

					// Traffic analytics
					drizzleClient
						.select({
							pageviewCount: analytics.pageviewCount,
							uniqueVisitors: analytics.uniqueVisitors,
						})
						.from(analytics)
						.where(
							and(
								eq(analytics.userId, id),
								gte(analytics.date, startOfMonth.toISOString()),
								lt(analytics.date, endOfMonth.toISOString()),
							),
						),

					// OCR count
					drizzleClient
						.select({ count: count() })
						.from(ocr)
						.where(
							and(
								eq(ocr.userId, id),
								gte(ocr.datetime, startOfMonth.toISOString()),
								lt(ocr.datetime, endOfMonth.toISOString()),
							),
						),

					// Prompts count
					drizzleClient
						.select({ count: count() })
						.from(prompts)
						.where(
							and(
								eq(prompts.userId, id),
								gte(prompts.datetime, startOfMonth.toISOString()),
								lt(prompts.datetime, endOfMonth.toISOString()),
							),
						),
				]);

			const traffic = trafficUsage.reduce(
				(acc, curr) => ({
					pageview_count: acc.pageview_count + (curr.pageviewCount || 0),
					unique_visitors: acc.unique_visitors + (curr.uniqueVisitors || 0),
				}),
				{ pageview_count: 0, unique_visitors: 0 },
			);

			const { cookiePreferences, ...adjustedUser } = user;

			const userData = {
				...adjustedUser,
				currentPlan: {
					...pricingPlan,
					billing_period: billingPeriod || "year",
				},
				nextPlan: nextPlan || tiers[1],
				usage: {
					traffic,
					ocr: ocrUsage[0]?.count ?? 0,
					prompts: promptsUsage[0]?.count ?? 0,
					catalogues: cataloguesUsage[0]?.count ?? 0,
				},
			};

			return NextResponse.json(userData, { status: 200 });
		} catch (error) {
			Sentry.captureException(error);
			console.error("Usage fetch errors:", error);
			return NextResponse.json(
				{
					error: "Failed to fetch usage data",
					details: error instanceof Error ? error.message : "Unknown error",
				},
				{ status: 500 },
			);
		}
	} catch (error) {
		Sentry.captureException(error);
		console.error(
			"Unexpected error in API route:",
			error instanceof Error ? error.message : error,
		);
		return NextResponse.json(
			{ error: "An unexpected error occurred" },
			{ status: 500 },
		);
	}
}
