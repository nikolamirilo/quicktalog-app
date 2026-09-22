"use server";
import * as Sentry from "@sentry/nextjs";
import { clientIp } from "@/lib/http/client-ip";
import { withinRateLimit } from "@/lib/rate-limit";
import { withPublic } from "@/utils/db";
import { sql } from "drizzle-orm";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const signupSchema = z.object({
	email: emailSchema,
	catalogueId: z.string().uuid(),
});

export type ProductNewsletterResult = { status: "success" | "error" };

export type NewsletterSignupResult = { status: "success" | "error" };

/**
 * Public signup on a published catalogue; runs as `app_public`, no identity read.
 * `app_public` has no INSERT on `newsletter` - the row is written by
 * `private.subscribe_catalogue_newsletter`, which derives the owner, requires
 * the catalogue active with signups on, and de-dupes. Same answer regardless
 * of outcome, so the form can't be used to probe a merchant's list.
 */
export async function newsletterSignup(
	email: string,
	catalogueId: string,
): Promise<NewsletterSignupResult> {
	const parsed = signupSchema.safeParse({ email, catalogueId });
	if (!parsed.success) return { status: "error" };

	try {
		// Redis first: the rate limit must not hold a pooled connection open.
		if (!(await withinRateLimit("newsletter", await clientIp()))) {
			return { status: "error" };
		}

		await withPublic((tx) =>
			tx.execute(
				sql`select private.subscribe_catalogue_newsletter(${parsed.data.catalogueId}::uuid, ${parsed.data.email})`,
			),
		);

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

/** Marketing footer signup; same shape as `subscribeToNewsletter` via `private.subscribe_product_newsletter`. */
export async function productNewsletterSignup(
	email: string,
): Promise<ProductNewsletterResult> {
	const parsed = emailSchema.safeParse(email);
	if (!parsed.success) return { status: "error" };

	try {
		if (!(await withinRateLimit("newsletter", await clientIp()))) {
			return { status: "error" };
		}

		await withPublic((tx) =>
			tx.execute(
				sql`select private.subscribe_product_newsletter(${parsed.data})`,
			),
		);

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
