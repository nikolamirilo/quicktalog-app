import "server-only";
import { type Catalogue, defaultCatalogueData } from "@quicktalog/common";
import { sql } from "drizzle-orm";
import {
	DEFAULT_BACKGROUND,
	normalizeBackground,
} from "@/lib/catalogue/background";
import { normalizeTagline } from "@/lib/catalogue/footer";
import { DEFAULT_GLASS, normalizeGlass } from "@/lib/catalogue/glass";
import { normalizeSearch } from "@/lib/catalogue/items";
import { normalizeLogoRadius } from "@/lib/catalogue/logo";
import {
	dropInvalidTrackingIds,
	stripTrackingIds,
} from "@/lib/catalogue/tracking-providers";
import type { Tx } from "@/utils/db";
import type { Tier } from "./plan";

/**
 * Forces the plan's limits onto catalogue data before it is stored: a custom
 * header/footer only on plans that include branding (where the owner may still
 * choose the default one); newsletter and advanced appearance (custom themes,
 * style, overlay, glass and background) only on plans that include them, reset
 * to the defaults otherwise. Glass, background, search, the footer tagline and
 * the logo's corner rounding arrive from the client, so their shape is
 * normalized here as well. Applied on create, update and publish, so a client
 * that sends a branded payload on a free plan cannot buy features for free.
 */
export function applyPlanToCatalogue<T extends Partial<Catalogue>>(
	data: T,
	tier: Tier,
): T {
	const allowedType = (type: string | undefined) =>
		tier.features.branding && type === "custom" ? "custom" : "default";
	const out = { ...data };
	if (out.header) {
		out.header = {
			...out.header,
			type: allowedType(out.header.type),
			...("logoRadius" in out.header
				? { logoRadius: normalizeLogoRadius(out.header.logoRadius) }
				: {}),
		};
	}
	// The client sends the whole `metadata` object back on every save, so both
	// the plan and the shape are enforced here rather than trusted from the
	// builder. A malformed id would be dropped at render anyway, but persisting
	// it leaves the owner looking at a field they think is connected.
	if (out.metadata) {
		out.metadata =
			tier.features.integrations?.tracking === true
				? dropInvalidTrackingIds(out.metadata)
				: stripTrackingIds(out.metadata);
	}
	if (out.appearance) {
		const { advancedAppearance } = tier.features;
		const appearance = { ...out.appearance };
		if (!advancedAppearance) {
			appearance.style = defaultCatalogueData.appearance.style;
			appearance.overlay = defaultCatalogueData.appearance.overlay;
		}
		if ("glass" in appearance) {
			appearance.glass = advancedAppearance
				? normalizeGlass(appearance.glass)
				: DEFAULT_GLASS;
		}
		if ("background" in appearance) {
			appearance.background = advancedAppearance
				? normalizeBackground(appearance.background)
				: DEFAULT_BACKGROUND;
		}
		if ("search" in appearance) {
			appearance.search = normalizeSearch(appearance.search);
		}
		if (!advancedAppearance && appearance.theme?.type === "custom") {
			appearance.theme = defaultCatalogueData.appearance.theme;
		}
		out.appearance = appearance;
	}
	if (out.footer) {
		out.footer = {
			...out.footer,
			type: allowedType(out.footer.type),
			newsletter: tier.features.newsletter ? out.footer.newsletter : false,
			...("tagline" in out.footer
				? { tagline: normalizeTagline(out.footer.tagline) }
				: {}),
			...("logoRadius" in out.footer
				? { logoRadius: normalizeLogoRadius(out.footer.logoRadius) }
				: {}),
		};
	}
	return out;
}

/**
 * Brings a user's catalogues back within a plan they no longer pay for:
 * deactivates the ones over the new catalogue quota (most recently updated
 * kept), and removes branding and newsletter where the plan no longer includes
 * them. Returns the names that were deactivated and the names that merely lost
 * their analytics tags, so both can be revalidated after the transaction
 * commits - a catalogue that stays active still has stale HTML in the ISR
 * cache.
 */
export async function applyPlanDowngrade(
	tx: Tx,
	userId: string,
	tier: Tier,
): Promise<{ deactivated: string[]; trackingCleared: string[] }> {
	const deactivated = await tx.execute<{ name: string }>(sql`
		with ranked as (
			select id,
			       row_number() over (
			         order by updated_at desc nulls last, created_at desc
			       ) as rn
			  from public.catalogues
			 where user_id = ${userId}
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
			 where user_id = ${userId}
		`);
	}

	if (!tier.features.newsletter) {
		await tx.execute(sql`
			update public.catalogues
			   set footer = jsonb_set(footer, '{newsletter}', 'false')
			 where user_id = ${userId}
		`);
	}

	if (!tier.features.advancedAppearance) {
		await tx.execute(sql`
			update public.catalogues
			   set appearance = jsonb_set(
			         jsonb_set(
			           jsonb_set(appearance, '{style}', ${JSON.stringify(defaultCatalogueData.appearance.style)}::jsonb),
			           '{overlay}', ${JSON.stringify(defaultCatalogueData.appearance.overlay)}::jsonb),
			         '{glass}', ${JSON.stringify(DEFAULT_GLASS)}::jsonb)
			         || jsonb_build_object('background', ${JSON.stringify(DEFAULT_BACKGROUND)}::jsonb)
			 where user_id = ${userId}
		`);

		await tx.execute(sql`
			update public.catalogues
			   set appearance = jsonb_set(appearance, '{theme}', ${JSON.stringify(defaultCatalogueData.appearance.theme)}::jsonb)
			 where user_id = ${userId}
			   and appearance -> 'theme' ->> 'type' = 'custom'
		`);
	}

	// Catalogues that stay active but lose their tags still have stale HTML in
	// the ISR cache, so their names are returned for revalidation too.
	let trackingCleared: string[] = [];
	if (!tier.features.integrations?.tracking) {
		const cleared = await tx.execute<{ name: string }>(sql`
			update public.catalogues
			   set metadata = metadata - 'googleAnalyticsId' - 'metaPixelId'
			 where user_id = ${userId}
			   and (metadata ? 'googleAnalyticsId' or metadata ? 'metaPixelId')
			returning name
		`);
		trackingCleared = [...cleared].map((row) => row.name);
	}

	return {
		deactivated: [...deactivated].map((row) => row.name),
		trackingCleared,
	};
}
