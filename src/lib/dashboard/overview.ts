import "server-only";
import * as Sentry from "@sentry/nextjs";
import {
	type Catalogue,
	type OverallAnalytics,
	schema,
} from "@quicktalog/common";
import { count, eq, sum } from "drizzle-orm";
import type { VerifiedIdentity } from "@/lib/auth/identity";
import type { NewsletterSubscriber } from "@/types/shared";
import { type Tx, withUser } from "@/utils/db";

const { analytics, catalogues, catalogueSubscribers } = schema;

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
