import "server-only";
import * as Sentry from "@sentry/nextjs";
import type React from "react";
import { InformationEmail, WelcomeEmail } from "@/components/emails";
import CancellationEmail from "@/components/emails/CancelationEmail";
import { MAX_RETRIES, RETRY_DELAY } from "@/constants/users";
import { validateEmail } from "@/lib/users/syncFromClerk";
import { isUniqueViolation } from "@/utils/db/errors";
import { getResend } from "@/constants/server";
import type { ContactData } from "@quicktalog/common";

const FROM = "Quicktalog<office@quicktalog.app>";
const SUPPORT_INBOX = "quicktalog@outlook.com";

/**
 * Retries a transient failure with a growing delay. A unique-key violation is
 * rethrown at once: retrying it can never succeed and only amplifies the race
 * that caused it.
 */
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

/** Message from the public contact form, sent to the support inbox. */
export async function sendContactMessage(
	contactData: ContactData,
): Promise<boolean> {
	const { message, email, name, subject } = contactData;
	try {
		const res = await getResend().emails.send({
			from: FROM,
			to: SUPPORT_INBOX,
			subject,
			replyTo: email,
			react: InformationEmail({
				email,
				name,
				message,
				subject,
			}) as React.ReactElement,
		});
		return res.error == null;
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { op: "sendContactMessage" },
		});
		console.error("Failed to send contact email:", error);
		return false;
	}
}

export async function sendWelcomeEmail(
	contactData: Omit<ContactData, "message" | "subject">,
): Promise<boolean> {
	const { email, name } = contactData;
	try {
		const res = await getResend().emails.send({
			from: FROM,
			to: email,
			subject: "[Quicktalog] Welcome to Quicktalog! 🎉",
			react: WelcomeEmail({ name }) as React.ReactElement,
		});
		return res.error == null;
	} catch (error) {
		console.error("Failed to send welcome email:", error);
		return false;
	}
}

export async function sendSubscriptionCancelationEmail(
	contactData: Omit<ContactData, "message" | "subject">,
): Promise<boolean> {
	const { email, name } = contactData;
	try {
		const res = await getResend().emails.send({
			from: FROM,
			to: email,
			subject: "[Quicktalog] We are Sorry to See You Go",
			react: CancellationEmail({ name }) as React.ReactElement,
		});
		return res.error == null;
	} catch (error) {
		Sentry.captureException(error, {
			level: "warning",
			tags: { op: "sendSubscriptionCancelationEmail" },
		});
		console.error("Failed to send cancellation email:", error);
		return false;
	}
}

/** Welcome email for the Clerk webhook: never throws, never blocks the 200. */
export async function sendWelcomeEmailSafely(
	email: string | null,
	name: string,
): Promise<void> {
	if (!validateEmail(email)) {
		console.warn("Skipping welcome email - invalid email address:", email);
		return;
	}

	try {
		await retryOperation(() => sendWelcomeEmail({ email: email!, name }));
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
