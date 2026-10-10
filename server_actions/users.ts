"use server";
import { MAX_RETRIES, RETRY_DELAY } from "@/constants/users";
import { fetchUserData } from "@/lib/users/fetchUserData";
import { isUniqueViolation, validateEmail } from "@/lib/users/syncFromClerk";
import { currentUser } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { sendWelcomeEmail } from "./email";

export async function subsribeToNewsletter(email: string) {
	try {
		const res = await fetch("/api/newsletter/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
		const data = await res.json();
		if (data.error) {
			console.error("Error subscribing to newsletter:", data.error);
			return false;
		} else {
			return true;
		}
	} catch (error: any) {
		Sentry.captureException(error);
		console.error("Error subscribing to newsletter:", error);
		return false;
	}
}
export async function subscribeToPlan(email: string) {
	try {
		const res = await fetch("/api/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});
		const data = await res.json();
		if (data.error) {
			console.error("Error subscribing to pricing plan:", data.error);
			return false;
		} else {
			return true;
		}
	} catch (error: any) {
		Sentry.captureException(error);
		console.error("Error subscribing to newsletter:", error);
		return false;
	}
}

export async function getUserData(userId?: string) {
	try {
		const profile = await currentUser();
		const id = userId ?? profile?.id;
		if (!id) throw new Error("User not authenticated");

		const ownerProfile =
			profile && profile.id === id
				? {
						id: profile.id,
						emailAddresses: profile.emailAddresses?.map((e) => ({
							emailAddress: e.emailAddress,
						})),
						firstName: profile.firstName,
						lastName: profile.lastName,
						imageUrl: profile.imageUrl,
						publicMetadata: profile.publicMetadata as Record<string, any>,
					}
				: null;

		const result = await fetchUserData({ userId: id, ownerProfile });
		if (!result.ok) {
			throw new Error(`Failed to fetch user data: ${result.code}`);
		}
		return result.data;
	} catch (error) {
		Sentry.captureException(error);
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

export async function handleUserDeletion(
	supabase: any,
	userId: string,
): Promise<void> {
	if (!userId || typeof userId !== "string") {
		throw new Error("Invalid user ID for deletion");
	}

	const { error, count } = await supabase
		.from("users")
		.delete()
		.eq("id", userId.trim())
		.select("id", { count: "exact" });

	if (error) {
		console.error("Database deletion error:", {
			message: error.message,
			details: error.details,
			hint: error.hint,
			code: error.code,
			userId,
		});
		throw new Error(`Database deletion failed: ${error.message}`);
	}

	console.log(`Successfully deleted ${count} user record(s) for ID: ${userId}`);
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
		Sentry.captureException(error);
		console.error("Failed to send welcome email:", {
			error: error instanceof Error ? error.message : String(error),
			email,
			name,
		});
	}
}
