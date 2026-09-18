"use server";
import * as Sentry from "@sentry/nextjs";
import { drizzleClient } from "@/utils/drizzle";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";

const { catalogues, newsletter, productNewsletter } = schema;

export type ProductNewsletterResult =
	| { status: "success" }
	| { status: "already_subscribed" }
	| { status: "error" };

export type NewsletterSignupResult =
	| { status: "success" }
	| { status: "already_subscribed" }
	| { status: "error" };

export async function newsletterSignup(
	email: string,
	catalogueId: string,
): Promise<NewsletterSignupResult> {
	try {
		// The owner comes from the published catalogue, never from the browser.
		const catalogue = await drizzleClient.query.catalogues.findFirst({
			where: and(
				eq(catalogues.id, catalogueId),
				eq(catalogues.status, "active"),
			),
			columns: { createdBy: true },
		});
		if (!catalogue) {
			return { status: "error" };
		}

		const existing = await drizzleClient
			.select({ id: newsletter.id })
			.from(newsletter)
			.where(
				and(
					eq(newsletter.email, email),
					eq(newsletter.catalogueId, catalogueId),
				),
			)
			.limit(1);

		if (existing.length > 0) {
			return { status: "already_subscribed" };
		}

		await drizzleClient.insert(newsletter).values({
			email,
			catalogueId,
			ownerId: catalogue.createdBy,
		});

		return { status: "success" };
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "newsletterSignup" },
		});
		console.error(
			"Unexpected error while inserting record in newsletter table:",
			err,
		);
		return { status: "error" };
	}
}

export async function productNewsletterSignup(
	email: string,
): Promise<ProductNewsletterResult> {
	try {
		const existing = await drizzleClient
			.select({ id: productNewsletter.id })
			.from(productNewsletter)
			.where(eq(productNewsletter.email, email))
			.limit(1);

		if (existing.length > 0) {
			return { status: "already_subscribed" };
		}

		await drizzleClient.insert(productNewsletter).values({ email });
		return { status: "success" };
	} catch (err) {
		Sentry.captureException(err, {
			level: "warning",
			tags: { op: "productNewsletterSignup" },
		});
		console.error(
			"Unexpected error while inserting record in product newsletter table:",
			err,
		);
		return { status: "error" };
	}
}
