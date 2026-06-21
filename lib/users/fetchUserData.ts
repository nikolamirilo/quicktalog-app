import * as Sentry from "@sentry/nextjs";
import { endOfMonth, startOfMonth } from "@/helpers/client";
import {
	buildUserDataFromClerkProfile,
	upsertUser,
} from "@/lib/users/syncFromClerk";
import { drizzleClient } from "@/utils/drizzle";
import { createClient } from "@/utils/supabase/server";
import { schema, tiers } from "@quicktalog/common";
import { and, count, eq, gte, lt } from "drizzle-orm";

const { analytics, catalogues, ocr, prompts, users } = schema;

export interface OwnerProfile {
	id: string;
	emailAddresses?: Array<{ emailAddress: string }>;
	firstName?: string | null;
	lastName?: string | null;
	imageUrl?: string | null;
	publicMetadata?: Record<string, any>;
}

export type FetchUserDataCode = "not_found" | "no_plan" | "usage_failed";
export interface FetchUserDataResult {
	ok: boolean;
	data?: any;
	code?: FetchUserDataCode;
	details?: string;
}

/**
 * Loads a user's dashboard payload (profile + plan + usage). When the row is
 * missing and the caller proves ownership by passing `ownerProfile`, performs
 * an on-demand Clerk → Supabase sync to cover the webhook race for new signups.
 */
export async function fetchUserData(args: {
	userId: string;
	ownerProfile?: OwnerProfile | null;
}): Promise<FetchUserDataResult> {
	const { userId, ownerProfile } = args;

	let user = await drizzleClient.query.users.findFirst({
		where: eq(users.id, userId),
	});

	if (!user) {
		if (!ownerProfile || ownerProfile.id !== userId) {
			console.warn(`User data not found for Clerk ID: ${userId}.`);
			return { ok: false, code: "not_found" };
		}

		try {
			const supabase = await createClient();
			const seed = buildUserDataFromClerkProfile(ownerProfile);
			await upsertUser(supabase, seed);
		} catch (syncError) {
			Sentry.captureException(syncError, {
				tags: { area: "user-sync", phase: "on-demand" },
			});
			console.error("On-demand Clerk sync failed:", syncError);
			return { ok: false, code: "not_found" };
		}

		user = await drizzleClient.query.users.findFirst({
			where: eq(users.id, userId),
		});

		if (!user) {
			console.warn(
				`User data not found for Clerk ID after on-demand sync: ${userId}.`,
			);
			return { ok: false, code: "not_found" };
		}
	}

	const planId = user.planId;
	const pricingPlan = tiers.find((tier) =>
		planId ? Object.values(tier.priceId).includes(planId) : false,
	);

	if (!pricingPlan) {
		console.warn(`Pricing plan not found for Plan ID: ${planId}.`);
		return { ok: false, code: "no_plan" };
	}

	const standardTiers = tiers.filter((item) => item.type === "standard");
	const nextPlan =
		standardTiers.find(
			(item) =>
				item.features.items_per_catalogue >
					pricingPlan.features.items_per_catalogue && item.id > pricingPlan.id,
		) ?? standardTiers[standardTiers.length - 1];

	const billingPeriod = Object.entries(pricingPlan.priceId).find(
		([_, id]) => id === planId,
	)?.[0] as "month" | "year";

	try {
		const [cataloguesUsage, trafficUsage, ocrUsage, promptsUsage] =
			await Promise.all([
				drizzleClient
					.select({ count: count() })
					.from(catalogues)
					.where(eq(catalogues.createdBy, userId)),

				drizzleClient
					.select({
						pageviewCount: analytics.pageviewCount,
						uniqueVisitors: analytics.uniqueVisitors,
					})
					.from(analytics)
					.where(
						and(
							eq(analytics.userId, userId),
							gte(analytics.date, startOfMonth.toISOString()),
							lt(analytics.date, endOfMonth.toISOString()),
						),
					),

				drizzleClient
					.select({ count: count() })
					.from(ocr)
					.where(
						and(
							eq(ocr.userId, userId),
							gte(ocr.datetime, startOfMonth.toISOString()),
							lt(ocr.datetime, endOfMonth.toISOString()),
						),
					),

				drizzleClient
					.select({ count: count() })
					.from(prompts)
					.where(
						and(
							eq(prompts.userId, userId),
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

		const data = {
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

		return { ok: true, data };
	} catch (error) {
		Sentry.captureException(error, {
			tags: { area: "user-usage-query" },
		});
		console.error("Usage fetch errors:", error);
		return {
			ok: false,
			code: "usage_failed",
			details: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
