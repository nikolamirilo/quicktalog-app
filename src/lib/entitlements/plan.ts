import "server-only";
import { type Catalogue, schema, tiers } from "@quicktalog/common";
import { count, eq, sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { Tx } from "@/utils/db";

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
 * The caller's plan, read with the users row locked (`for no key update`) so
 * two parallel requests can't both pass the same quota check; a no-key-update
 * lock so child-table inserts aren't blocked. Never trust a plan/flag from the
 * client - the UI hides features, this decides them.
 */
export async function getPlanForUpdate(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<Tier> {
	const [row] = await tx
		.select({ planId: users.planId })
		.from(users)
		.where(eq(users.id, me.userId))
		.for("no key update")
		.limit(1);
	return tierForPlanId(row?.planId);
}

export async function countCatalogues(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<number> {
	const [row] = await tx
		.select({ total: count() })
		.from(catalogues)
		.where(eq(catalogues.createdBy, me.userId));
	return row?.total ?? 0;
}

/** Whether the user may create one more catalogue on this plan. */
export async function withinCatalogueQuota(
	tx: Tx,
	me: VerifiedIdentity,
	tier: Tier,
): Promise<boolean> {
	return (await countCatalogues(tx, me)) < tier.features.catalogues;
}

/**
 * Whether a catalogue may be published or re-activated: the plan's traffic
 * allowance for this month must not be used up. The numbers come from
 * `private.my_usage()`, the same source the dashboard shows.
 */
export type PlanCheck = { ok: boolean; reason?: string };

export async function canActivate(tx: Tx, tier: Tier): Promise<PlanCheck> {
	const rows = await tx.execute<{ pageviews: string | number }>(
		sql`select pageviews from private.my_usage()`,
	);
	const pageviews = Number([...rows][0]?.pageviews ?? 0);
	if (pageviews >= tier.features.traffic_limit) {
		return {
			ok: false,
			reason: "This month's traffic limit for your plan is reached",
		};
	}
	return { ok: true };
}

/**
 * Whether stored content stays within the plan's section and item limits.
 * Growth-only: content that is already over the limit (after a downgrade) may
 * be saved again as long as it does not grow.
 */
export function contentWithinPlan(
	next: Partial<Catalogue>,
	previous: Partial<Catalogue> | null,
	tier: Tier,
): PlanCheck {
	const content = next.content;
	if (!Array.isArray(content)) return { ok: true };

	const sections = content.length;
	const items = content.reduce(
		(total, block: any) =>
			total + (Array.isArray(block?.items) ? block.items.length : 0),
		0,
	);

	const before = Array.isArray(previous?.content) ? previous.content : null;
	const sectionsBefore = before ? before.length : 0;
	const itemsBefore = before
		? before.reduce(
				(total, block: any) =>
					total + (Array.isArray(block?.items) ? block.items.length : 0),
				0,
			)
		: 0;

	// "unlimited" means nothing to enforce.
	const limitOf = (value: number | "unlimited" | undefined) =>
		typeof value === "number" ? value : null;

	const sectionLimit = limitOf(tier.features.sections_per_catalogue);
	if (
		sectionLimit !== null &&
		sections > sectionLimit &&
		sections > sectionsBefore
	) {
		return {
			ok: false,
			reason: `Your plan allows ${sectionLimit} sections per catalogue`,
		};
	}

	const itemLimit = limitOf(tier.features.items_per_catalogue);
	if (itemLimit !== null && items > itemLimit && items > itemsBefore) {
		return {
			ok: false,
			reason: `Your plan allows ${itemLimit} items per catalogue`,
		};
	}
	return { ok: true };
}
