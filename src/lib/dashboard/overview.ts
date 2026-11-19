import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
	type Catalogue,
	type OverallAnalytics,
	schema,
} from "@quicktalog/common";
import { count, eq, sql, sum } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { NewsletterSubscriber } from "@/types/shared";
import { type Tx, withUser } from "@/utils/db";

const { analytics, catalogues, catalogueSubscribers } = schema;

/** The overview totals; the catalogue count is added on the client from the list. */
export type DashboardAnalytics = Omit<
	OverallAnalytics,
	"totalServiceCatalogues"
>;

/**
 * What the dashboard card says about a catalogue beyond its row: how much is in the
 * draft, when it was last saved, and whether any of it is still unpublished. Drafts
 * autosave now, so a card that showed only "Updated" could say nothing about 25 items
 * sitting in the builder.
 */
export type CatalogueDraftSummary = {
	itemCount: number;
	sectionCount: number;
	/** When the draft was last written, or null for a catalogue with no draft. */
	lastSavedAt: string | null;
	/** The draft has changes the published catalogue does not have. */
	unpublished: boolean;
};

export type CatalogueWithDraft = Catalogue & { draft: CatalogueDraftSummary };

/** Everything the dashboard overview shows, in the same shape the `/api/dashboard/*` routes return. */
export type DashboardOverview = {
	analytics: DashboardAnalytics;
	catalogues: CatalogueWithDraft[];
	newsletter: NewsletterSubscriber[];
};

/** Traffic and subscriber totals of the caller. */
export async function selectDashboardAnalytics(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<DashboardAnalytics> {
	const [traffic] = await tx
		.select({
			pageViews: sum(analytics.pageviews),
			uniqueVisitors: sum(analytics.uniqueVisitors),
		})
		.from(analytics)
		.where(eq(analytics.userId, me.userId));

	const [subscribers] = await tx
		.select({ total: count() })
		.from(catalogueSubscribers)
		.innerJoin(catalogues, eq(catalogues.id, catalogueSubscribers.catalogueId))
		.where(eq(catalogues.userId, me.userId));

	return {
		totalPageViews: Number(traffic?.pageViews ?? 0),
		totalUniqueVisitors: Number(traffic?.uniqueVisitors ?? 0),
		totalNewsletterSubscriptions: subscribers?.total ?? 0,
	};
}

/** The caller's catalogues. */
export function selectMyCatalogues(tx: Tx, me: VerifiedIdentity) {
	return tx.select().from(catalogues).where(eq(catalogues.userId, me.userId));
}

/** A draft's `content`, or an empty array when it is missing or not one. */
const DRAFT_CONTENT = sql`(case jsonb_typeof(d.draft -> 'content')
                             when 'array' then d.draft -> 'content'
                             else '[]'::jsonb end)`;

/**
 * The draft summary of every catalogue the caller has one for. Counting in SQL keeps
 * the drafts themselves off the wire: the dashboard needs two numbers and a date, not
 * everybody's unsaved catalogue.
 */
export async function selectMyDraftSummaries(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<Map<string, CatalogueDraftSummary>> {
	const rows = await tx.execute<{
		catalogue_id: string;
		updated_at: string;
		unpublished: boolean;
		item_count: string | number;
		section_count: string | number;
	}>(sql`
		select d.catalogue_id,
		       d.updated_at,
		       (d.published_at is null or d.updated_at > d.published_at) as unpublished,
		       coalesce(jsonb_array_length(${DRAFT_CONTENT}), 0) as section_count,
		       coalesce((select sum(jsonb_array_length(coalesce(b -> 'items', '[]'::jsonb)))
		                   from jsonb_array_elements(${DRAFT_CONTENT}) b), 0) as item_count
		  from public.catalogue_drafts d
		  join public.catalogues c on c.id = d.catalogue_id
		 where c.user_id = ${me.userId}`);

	const out = new Map<string, CatalogueDraftSummary>();
	for (const row of rows) {
		out.set(row.catalogue_id, {
			itemCount: Number(row.item_count) || 0,
			sectionCount: Number(row.section_count) || 0,
			lastSavedAt: row.updated_at,
			unpublished: row.unpublished === true,
		});
	}
	return out;
}

/** Items across a catalogue's content blocks, for a catalogue with no draft row. */
function countPublishedItems(content: unknown): number {
	if (!Array.isArray(content)) return 0;
	return content.reduce((total: number, block) => {
		const items = (block as { items?: unknown })?.items;
		return total + (Array.isArray(items) ? items.length : 0);
	}, 0);
}

/** The caller's catalogues, each with what its draft holds. */
export async function selectMyCataloguesWithDrafts(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<CatalogueWithDraft[]> {
	const rows = await selectMyCatalogues(tx, me);
	const drafts = await selectMyDraftSummaries(tx, me);

	return rows.map((row) => {
		const catalogue = row as Catalogue;
		const draft = drafts.get(catalogue.id);
		return {
			...catalogue,
			draft: draft ?? {
				itemCount: countPublishedItems(catalogue.content),
				sectionCount: Array.isArray(catalogue.content)
					? catalogue.content.length
					: 0,
				lastSavedAt: null,
				unpublished: false,
			},
		};
	});
}

/** The subscribers of the caller's catalogues, with each catalogue's name. */
export function selectMyNewsletterSubscribers(tx: Tx, me: VerifiedIdentity) {
	return tx
		.select({
			id: catalogueSubscribers.id,
			email: catalogueSubscribers.email,
			catalogueName: catalogues.name,
			catalogueId: catalogueSubscribers.catalogueId,
			createdAt: catalogueSubscribers.createdAt,
		})
		.from(catalogueSubscribers)
		.innerJoin(catalogues, eq(catalogues.id, catalogueSubscribers.catalogueId))
		.where(eq(catalogues.userId, me.userId));
}

/**
 * The whole overview in one `app_user` transaction, for the dashboard page to
 * render with instead of the browser asking three routes after hydration.
 *
 * The result goes through JSON so dates arrive as the same strings the routes
 * send, and the client cache holds one shape whichever path filled it. Returns
 * undefined on failure: the page still renders and the client fetches instead.
 */
export async function loadDashboardOverview(
	me: VerifiedIdentity,
): Promise<DashboardOverview | undefined> {
	try {
		const overview = await withUser(me, async (tx) => ({
			analytics: await selectDashboardAnalytics(tx, me),
			catalogues: await selectMyCataloguesWithDrafts(tx, me),
			newsletter: await selectMyNewsletterSubscribers(tx, me),
		}));
		return JSON.parse(JSON.stringify(overview)) as DashboardOverview;
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { op: "loadDashboardOverview" },
		});
		console.error("Dashboard overview load failed:", error);
		return undefined;
	}
}
