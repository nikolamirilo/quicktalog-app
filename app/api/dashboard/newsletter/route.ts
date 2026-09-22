import * as Sentry from "@sentry/nextjs";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { withUser } from "@/utils/db";

const { newsletter, catalogues } = schema;

export async function GET() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// The catalogue name is joined in, and the join itself is owner-filtered:
		// a subscriber row pointing at someone else's catalogue reports no name
		// instead of leaking it.
		const data = await withUser(me, (tx) =>
			tx
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
				.where(eq(newsletter.ownerId, me.userId)),
		);

		return NextResponse.json(data);
	} catch (error) {
		Sentry.captureException(error, {
			tags: { route: "dashboard/newsletter" },
		});
		console.error("Failed to fetch newsletter subscribers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch newsletter subscribers" },
			{ status: 500 },
		);
	}
}
