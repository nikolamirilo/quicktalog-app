import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
	type Catalogue,
	type OverallAnalytics,
	schema,
} from "@quicktalog/common";
import { and, count, eq, sum } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { NewsletterSubscriber } from "@/types/shared";
import { type Tx, withUser } from "@/utils/db";

const { analytics, catalogues, newsletter } = schema;

/** The overview totals; the catalogue count is added on the client from the list. */
export type DashboardAnalytics = Omit<
	OverallAnalytics,
	"totalServiceCatalogues"
>;

/** Everything the dashboard overview shows, in the same shape the `/api/dashboard/*` routes return. */
export type DashboardOverview = {
	analytics: DashboardAnalytics;
	catalogues: Catalogue[];
	newsletter: NewsletterSubscriber[];
};

/** Traffic and subscriber totals of the caller. */
export async function selectDashboardAnalytics(
	tx: Tx,
	me: VerifiedIdentity,
): Promise<DashboardAnalytics> {
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

	return {
		totalPageViews: Number(traffic?.pageViews ?? 0),
		totalUniqueVisitors: Number(traffic?.uniqueVisitors ?? 0),
		totalNewsletterSubscriptions: subscribers?.total ?? 0,
	};
}

/** The caller's catalogues. */
export function selectMyCatalogues(tx: Tx, me: VerifiedIdentity) {
	return tx
		.select()
		.from(catalogues)
		.where(eq(catalogues.createdBy, me.userId));
}

/**
 * The caller's newsletter subscribers. The catalogue name is joined in, and the
 * join itself is owner-filtered: a subscriber row pointing at someone else's
 * catalogue reports no name instead of leaking it.
 */
export function selectMyNewsletterSubscribers(tx: Tx, me: VerifiedIdentity) {
	return tx
		.select({
			id: newsletter.id,
			email: newsletter.email,
			catalogueName: catalogues.name,
			catalogueId: newsletter.catalogueId,
			createdAt: newsletter.createdAt,
		})
		.from(newsletter)
		.leftJoin(
			catalogues,
			and(
				eq(catalogues.id, newsletter.catalogueId),
				eq(catalogues.createdBy, me.userId),
			),
		)
		.where(eq(newsletter.ownerId, me.userId));
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
			catalogues: await selectMyCatalogues(tx, me),
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
