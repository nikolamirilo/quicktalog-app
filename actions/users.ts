"use server";
import { MAX_RETRIES, RETRY_DELAY } from "@/constants/users";
import { getVerifiedIdentity } from "@/lib/auth/identity";
import { fetchUserData } from "@/lib/users/fetchUserData";
import { ensureUserRow, loadClerkProfile } from "@/lib/users/provision";
import { validateEmail } from "@/lib/users/syncFromClerk";
import { isUniqueViolation } from "@/utils/db/errors";
import * as Sentry from "@sentry/nextjs";
import { sendWelcomeEmail } from "./email";

/** Profile, plan and usage of the signed-in user, or null when signed out. */
export async function getUserData() {
	try {
		const me = await getVerifiedIdentity();
		if (!me) return null;

		let result = await fetchUserData({ userId: me.userId });
		if (!result.ok && result.code === "not_found") {
			// The user.created webhook has not arrived yet: create the row now.
			const profile = await loadClerkProfile(me.userId);
			if (profile) {
				await ensureUserRow(profile);
				result = await fetchUserData({ userId: me.userId });
			}
		}
		if (!result.ok) {
			throw new Error(`Failed to fetch user data: ${result.code}`);
		}
		return result.data;
	} catch (error) {
		Sentry.captureException(error, { tags: { op: "getUserData" } });
		console.error("Error in getUserData:", error);
		return null;
	}
}

export async function retryOperation<T>(
	operation: () => Promise<T>,
	maxRetries: number = MAX_RETRIES,
	delay: number = RETRY_DELAY,
): Promise<T> {
	let lastError: Error;

	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			// Retrying a unique-key violation can never succeed and only amplifies
			// the original race that caused it.
			if (isUniqueViolation(error)) {
				throw lastError;
			}

			if (attempt === maxRetries) {
				throw lastError;
			}

			console.warn(
				`Operation failed (attempt ${attempt}/${maxRetries}):`,
				lastError.message,
			);
			await new Promise((resolve) => setTimeout(resolve, delay * attempt));
		}
	}

	throw lastError!;
}

export async function sendWelcomeEmailSafely(
	email: string | null,
	name: string,
): Promise<void> {
	if (!validateEmail(email)) {
		console.warn("Skipping welcome email - invalid email address:", email);
		return;
	}

	try {
		const contactData = { email: email!, name };
		await retryOperation(() => sendWelcomeEmail(contactData));
		console.log("Welcome email sent successfully to:", email);
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { op: "sendWelcomeEmail" },
		});
		console.error("Failed to send welcome email:", {
			error: error instanceof Error ? error.message : String(error),
			email,
			name,
		});
	}
}
