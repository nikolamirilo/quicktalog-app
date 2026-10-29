import "server-only";
import { type Catalogue, schema, tiers } from "@quicktalog/common";
import { count, eq, sql } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import {
	countPlanItems,
	countPlanSections,
} from "@/lib/catalogue/content-blocks";
import {
	catalogueFitsPlan,
	GATED_SECTION_TYPES,
	misfitMessage,
} from "@/lib/entitlements/catalogue-fit";
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
		.where(eq(catalogues.userId, me.userId));
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
 * Whether a catalogue may be published or re-activated: it must fit the plan
 * completely (no grandfathering after a downgrade), and the plan's traffic
 * allowance for the account's current 30-day period must not be used up. The
 * traffic numbers come from `private.my_usage()`, the same source the dashboard
 * shows.
 */
export type PlanCheck = { ok: boolean; reason?: string };

export async function canActivate(
	tx: Tx,
	tier: Tier,
	content: unknown,
): Promise<PlanCheck> {
	const fit = catalogueFitsPlan(content, tier.features);
	if ("misfit" in fit)
		return { ok: false, reason: misfitMessage(fit.misfit, tier.name) };

	const rows = await tx.execute<{ pageviews: string | number }>(
		sql`select pageviews from private.my_usage()`,
	);
	const pageviews = Number([...rows][0]?.pageviews ?? 0);
	if (pageviews >= tier.features.traffic_limit) {
		return {
			ok: false,
			reason: "Your plan's page view limit for this period is reached",
		};
	}
	return { ok: true };
}

/**
 * Whether stored content stays within the plan's section and item limits.
 * Growth-only: content that is already over the limit (after a downgrade) may
 * be saved again as long as it does not grow.
 */
const countOfTypes = (content: unknown, types: string[]): number =>
	Array.isArray(content)
		? content.filter((block: any) => types.includes(block?.type)).length
		: 0;

export function contentWithinPlan(
	next: Partial<Catalogue>,
	previous: Partial<Catalogue> | null,
	tier: Tier,
): PlanCheck {
	const content = next.content;
	if (!Array.isArray(content)) return { ok: true };

	const sections = countPlanSections(content);
	const items = countPlanItems(content);

	const before = Array.isArray(previous?.content) ? previous.content : null;
	const sectionsBefore = countPlanSections(before);
	const itemsBefore = countPlanItems(before);

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

	// Block types the plan does not include. The builder and the agent both
	// gate these already, but neither is a control: `content` arrives from the
	// client on every save, so a crafted payload could otherwise add a paid
	// block on any plan.
	//
	// Judged the same way as the counts above - refused only when the save adds
	// one. A user who downgrades keeps the blocks they already had and can go on
	// editing the catalogue; they just cannot add more.
	for (const { types, label, flag } of GATED_SECTION_TYPES) {
		if (tier.features.sections[flag] === true) continue;
		const used = countOfTypes(content, types);
		if (used === 0) continue;
		if (used > countOfTypes(before, types)) {
			return {
				ok: false,
				reason: `${label} sections are not part of your plan`,
			};
		}
	}

	return { ok: true };
}
