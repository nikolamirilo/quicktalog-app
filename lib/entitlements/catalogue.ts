import "server-only";
import type { Catalogue } from "@quicktalog/common";
import { sql } from "drizzle-orm";
import type { Tx } from "@/utils/db";
import type { Tier } from "./plan";

/**
 * Forces the plan's limits onto catalogue data before it is stored: branded
 * header/footer only on plans that include branding, newsletter only on plans
 * that include it. Applied on create, update and publish, so a client that
 * sends a branded payload on a free plan cannot buy features for free.
 */
export function applyPlanToCatalogue<T extends Partial<Catalogue>>(
	data: T,
	tier: Tier,
): T {
	const type = tier.features.branding ? "custom" : "default";
	const out = { ...data };
	if (out.header) out.header = { ...out.header, type };
	if (out.footer) {
		out.footer = {
			...out.footer,
			type,
			newsletter: tier.features.newsletter ? out.footer.newsletter : false,
		};
	}
	return out;
}

/**
 * Brings a user's catalogues back within a plan they no longer pay for:
 * deactivates the ones over the new catalogue quota (most recently updated
 * kept), and removes branding and newsletter where the plan no longer includes
 * them. Returns the names that were deactivated so their pages can be
 * revalidated after the transaction commits.
 */
export async function applyPlanDowngrade(
	tx: Tx,
	userId: string,
	tier: Tier,
): Promise<string[]> {
	const deactivated = await tx.execute<{ name: string }>(sql`
		with ranked as (
			select id,
			       row_number() over (
			         order by updated_at desc nulls last, created_at desc
			       ) as rn
			  from public.catalogues
			 where created_by = ${userId}
			   and status = 'active'
		)
		update public.catalogues c
		   set status = 'inactive'
		  from ranked
		 where c.id = ranked.id
		   and ranked.rn > ${tier.features.catalogues}
		returning c.name
	`);

	if (!tier.features.branding) {
		await tx.execute(sql`
			update public.catalogues
			   set header = jsonb_set(header, '{type}', '"default"'),
			       footer = jsonb_set(footer, '{type}', '"default"')
			 where created_by = ${userId}
		`);
	}

	if (!tier.features.newsletter) {
		await tx.execute(sql`
			update public.catalogues
			   set footer = jsonb_set(footer, '{newsletter}', 'false')
			 where created_by = ${userId}
		`);
	}

	return [...deactivated].map((row) => row.name);
}
