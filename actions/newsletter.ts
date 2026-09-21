"use server";
import * as Sentry from "@sentry/nextjs";
import { clientIp } from "@/lib/http/client-ip";
import { withinRateLimit } from "@/lib/rate-limit";
import { drizzleClient } from "@/utils/drizzle";
import { schema } from "@quicktalog/common";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const { catalogues, newsletter, productNewsletter } = schema;

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const signupSchema = z.object({
	email: emailSchema,
	catalogueId: z.string().uuid(),
});

export type ProductNewsletterResult =
	| { status: "success" }
	| { status: "already_subscribed" }
	| { status: "error" };

export type NewsletterSignupResult = { status: "success" | "error" };

/**
 * Public signup on a published catalogue. The owner is read from the catalogue
 * row, never sent by the browser, and the answer is the same whether the address
 * was new or already stored, so the form cannot be used to test who is on a
 * merchant's list.
 */
export async function newsletterSignup(
	email: string,
	catalogueId: string,
): Promise<NewsletterSignupResult> {
	const parsed = signupSchema.safeParse({ email, catalogueId });
	if (!parsed.success) return { status: "error" };

	try {
		if (!(await withinRateLimit("newsletter", await clientIp()))) {
			return { status: "error" };
		}

		// The owner comes from the published catalogue, never from the browser.
		const catalogue = await drizzleClient.query.catalogues.findFirst({
			where: and(
				eq(catalogues.id, parsed.data.catalogueId),
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
					eq(newsletter.email, parsed.data.email),
					eq(newsletter.catalogueId, parsed.data.catalogueId),
				),
			)
			.limit(1);

		if (existing.length === 0) {
			await drizzleClient.insert(newsletter).values({
				email: parsed.data.email,
				catalogueId: parsed.data.catalogueId,
				ownerId: catalogue.createdBy,
			});
		}

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
	const parsed = emailSchema.safeParse(email);
	if (!parsed.success) return { status: "error" };

	try {
		if (!(await withinRateLimit("newsletter", await clientIp()))) {
			return { status: "error" };
		}

		const existing = await drizzleClient
			.select({ id: productNewsletter.id })
			.from(productNewsletter)
			.where(eq(productNewsletter.email, parsed.data))
			.limit(1);

		if (existing.length > 0) {
			return { status: "already_subscribed" };
		}

		await drizzleClient
			.insert(productNewsletter)
			.values({ email: parsed.data });
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
