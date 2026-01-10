"use server";
import { drizzleClient } from "@/drizzle/db";
import { newsletter, productNewsletter } from "@/drizzle/migrations/schema";

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

export async function productNewsletterSignup(email: string) {
	try {
		await drizzleClient.insert(productNewsletter).values({ email });

		return true;
	} catch (err) {
		console.error(
			"Unexpected error while inserting record in newsletter table:",
			err,
		);
		return false;
	}
}
