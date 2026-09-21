import "server-only";
import { schema, tiers } from "@quicktalog/common";
import { count, eq } from "drizzle-orm";
import { drizzleClient } from "@/utils/drizzle";

export type Tier = (typeof tiers)[number];

const users = schema.users;
const catalogues = schema.catalogues;

/** The tier a Paddle price id belongs to; Starter when it matches none. */
export function tierForPlanId(planId: string | null | undefined): Tier {
	if (!planId) return tiers[0];
	return (
		tiers.find((tier) => Object.values(tier.priceId).includes(planId)) ??
		tiers[0]
	);
}

/**
 * The signed-in user's plan, read from the database. Never trust a plan or
 * feature flag sent by the client: the UI hides features, the server enforces
 * them.
 */
export async function getUserTier(userId: string): Promise<Tier> {
	const [row] = await drizzleClient
		.select({ planId: users.planId })
		.from(users)
		.where(eq(users.id, userId))
		.limit(1);
	return tierForPlanId(row?.planId);
}

export async function countCatalogues(userId: string): Promise<number> {
	const [row] = await drizzleClient
		.select({ total: count() })
		.from(catalogues)
		.where(eq(catalogues.createdBy, userId));
	return row?.total ?? 0;
}

/** Whether the user may create one more catalogue on their plan. */
export async function withinCatalogueQuota(
	userId: string,
	tier: Tier,
): Promise<boolean> {
	return (await countCatalogues(userId)) < tier.features.catalogues;
}
