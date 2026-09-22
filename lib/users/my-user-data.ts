import "server-only";
import * as Sentry from "@sentry/nextjs";
import { schema, tiers } from "@quicktalog/common";
import { eq, sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import { type Tx, withUser } from "@/utils/db";

const { users } = schema;

type Code = "not_found" | "no_plan" | "usage_failed";

export interface MyUserDataResult {
	ok: boolean;
	data?: any;
	code?: Code;
	details?: string;
}

type UsageRow = {
	catalogues: string | number;
	prompts: string | number;
	ocr: string | number;
	pageviews: string | number;
	unique_visitors: string | number;
};

const asNumber = (value: string | number | null | undefined) =>
	typeof value === "number" ? value : Number(value ?? 0);

/**
 * Profile, plan and this month's usage of the caller. Both statements run in
 * one `app_user` transaction, so RLS decides what is visible and no user id is
 * accepted from the caller.
 *
 * The usage numbers come from `private.my_usage()`, which computes the month
 * boundary in SQL (a long-lived server instance would otherwise keep using the
 * month it started in) and leaves out refunded AI turns.
 */
export async function getMyUserData(
	me: VerifiedIdentity,
): Promise<MyUserDataResult> {
	try {
		return await withUser(me, async (tx) => loadInTx(tx, me));
	} catch (error) {
		Sentry.captureException(error, { tags: { area: "user-usage-query" } });
		console.error("Error fetching user data:", error);
		return {
			ok: false,
			code: "usage_failed",
			details: error instanceof Error ? error.message : String(error),
		};
	}
}

/** Same payload, for callers that already hold a `withUser` transaction. */
export async function loadInTx(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<MyUserDataResult> {
	const [user] = await tx
		.select()
		.from(users)
		.where(eq(users.id, me.userId))
		.limit(1);

	if (!user) return { ok: false, code: "not_found" };

	const planId = user.planId;
	const pricingPlan = tiers.find((tier) =>
		planId ? Object.values(tier.priceId).includes(planId) : false,
	);
	if (!pricingPlan) {
		console.warn(`Pricing plan not found for Plan ID: ${planId}.`);
		return { ok: false, code: "no_plan" };
	}

	const billingPeriod = Object.entries(pricingPlan.priceId).find(
		([_, id]) => id === planId,
	)?.[0] as "month" | "year";

	const usageRows = await tx.execute<UsageRow>(
		sql`select * from private.my_usage()`,
	);
	const usage = [...usageRows][0];

	return {
		ok: true,
		data: {
			// Includes cookiePreferences: the cookie banner reads the stored
			// choice from here instead of from the auth provider's metadata.
			...user,
			currentPlan: { ...pricingPlan, billing_period: billingPeriod || "year" },
			usage: {
				traffic: {
					pageview_count: asNumber(usage?.pageviews),
					unique_visitors: asNumber(usage?.unique_visitors),
				},
				ocr: asNumber(usage?.ocr),
				prompts: asNumber(usage?.prompts),
				catalogues: asNumber(usage?.catalogues),
			},
		},
	};
}
