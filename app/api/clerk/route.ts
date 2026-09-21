import {
	retryOperation,
	sendWelcomeEmailSafely,
} from "@/lib/email/transactional";
import { HANDLED_EVENT_TYPES } from "@/constants/users";
import {
	deleteClerkUser,
	loadUserFootprint,
	upsertClerkUser,
} from "@/lib/users/provision";
import { cancelSubscription } from "@/actions/paddle";
import { revalidateCatalogue, revalidateDashboard } from "@/helpers/server";
import { getRedis, syncCache } from "@/utils/redis";
import {
	buildClerkProfile,
	type ClerkWebhookEvent,
} from "@/lib/users/syncFromClerk";
import { isUniqueViolation } from "@/utils/db/errors";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import * as Sentry from "@sentry/nextjs";
import { after, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
	const startTime = Date.now();
	let event: ClerkWebhookEvent | null = null;

	try {
		const verificationPromise = verifyWebhook(req);
		const timeoutPromise = new Promise((_, reject) =>
			setTimeout(
				() => reject(new Error("Webhook verification timeout")),
				10000,
			),
		);

		event = (await Promise.race([
			verificationPromise,
			timeoutPromise,
		])) as ClerkWebhookEvent;

		if (!event || typeof event !== "object") {
			console.error("Invalid webhook event received");
			return new Response("Invalid webhook event", { status: 400 });
		}

		if (!HANDLED_EVENT_TYPES.includes(event.type as any)) {
			return new Response("Event type not handled", { status: 200 });
		}

		switch (event.type) {
			case "user.created":
			case "user.updated": {
				const profile = buildClerkProfile(event);
				if (!profile) {
					console.error("Failed to build user profile from event");
					return new Response("Invalid user data", { status: 400 });
				}

				await retryOperation(() => upsertClerkUser(profile));

				if (event.type === "user.created") {
					// after() keeps the function alive until the email is sent.
					after(() => sendWelcomeEmailSafely(profile.email, profile.name));
				}

				console.log(`Processed ${event.type} in ${Date.now() - startTime}ms`);
				return new Response("User processed successfully", { status: 200 });
			}

			case "user.deleted": {
				const userId = event.data?.id;
				if (!userId) {
					console.error("Missing user ID in deletion event");
					return new Response("Invalid deletion request", { status: 400 });
				}

				// Cancel billing BEFORE the row is gone: afterwards the customer
				// link is lost and the user would keep being charged. A failure here
				// returns 500 so Svix retries the delivery.
				const footprint = await loadUserFootprint(userId);
				for (const subscriptionId of footprint.activeSubscriptionIds) {
					const result = await cancelSubscription(subscriptionId);
					if ("error" in result && result.error) {
						throw new Error(
							`Failed to cancel subscription ${subscriptionId}: ${result.details ?? result.error}`,
						);
					}
				}

				const deleted = await retryOperation(() => deleteClerkUser(userId));

				if (footprint.catalogueNames.length > 0) {
					await syncCache(() => getRedis().del(...footprint.catalogueNames));
					for (const name of footprint.catalogueNames) {
						revalidateCatalogue(name);
					}
				}
				revalidateCatalogue();
				revalidateDashboard();

				console.log(
					`Deleted ${deleted} user row(s) in ${Date.now() - startTime}ms`,
				);
				return new Response("User deleted successfully", { status: 200 });
			}

			default:
				return new Response("Event type not handled", { status: 200 });
		}
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		// A concurrent delivery already wrote the row: the end state is reached.
		if (isUniqueViolation(error)) {
			return new Response("User already synced", { status: 200 });
		}

		if (
			errorMessage.includes("verification") ||
			errorMessage.includes("timeout")
		) {
			console.warn("Clerk webhook verification failed:", {
				eventType: event?.type,
				processingTime,
			});
			return new Response("Webhook verification failed", { status: 401 });
		}

		Sentry.captureException(error, { tags: { route: "clerk-webhook" } });
		console.error("Webhook processing failed:", {
			error: errorMessage,
			eventType: event?.type,
			processingTime,
		});
		// 500 so Svix retries the delivery.
		return new Response("Internal server error", { status: 500 });
	}
}
