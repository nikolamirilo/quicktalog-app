"use server";
import { drizzleClient } from "@/utils/drizzle";
import { schema } from "@quicktalog/common";
import { eq } from "drizzle-orm";

const { newsletter, productNewsletter } = schema;

export type ProductNewsletterResult =
	| { status: "success" }
	| { status: "already_subscribed" }
	| { status: "error" };

export async function newsletterSignup(
	email: string,
	catalogueId: string,
	ownerId: string,
) {
	try {
		await drizzleClient.insert(newsletter).values({
			email,
			catalogueId: catalogueId, // Mapping camelCase args to schema columns if needed or just passing
			ownerId: ownerId,
		});

		return true;
	} catch (err) {
		console.error(
			"Unexpected error while inserting record in newsletter table:",
			err,
		);
		return false;
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
		console.error(
			"Unexpected error while inserting record in product newsletter table:",
			err,
		);
		return { status: "error" };
	}
}
