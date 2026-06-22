import { HANDLED_EVENT_TYPES } from "@/constants/users";
import {
    buildUserData,
    type ClerkWebhookEvent,
    isUniqueViolation,
    updateOrCreateUser,
    upsertUser,
} from "@/lib/users/syncFromClerk";
import {
    handleUserDeletion,
    retryOperation,
    sendWelcomeEmailSafely,
} from "@/server_actions/users";
import { createClient } from "@/utils/supabase/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import * as Sentry from "@sentry/nextjs";
import { NextRequest } from "next/server";

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

		console.log(
			`Processing webhook event: ${event.type} for user: ${event.data?.id}`,
		);

		if (!HANDLED_EVENT_TYPES.includes(event.type as any)) {
			console.log(`Event type '${event.type}' not handled`);
			return new Response("Event type not handled", { status: 200 });
		}

		const supabase = await createClient();
		if (!supabase) {
			console.error("Failed to create Supabase client");
			return new Response("Database connection failed", { status: 500 });
		}

		switch (event.type) {
			case "user.created":
			case "user.updated": {
				const userData = buildUserData(event);
				if (!userData) {
					console.error("Failed to build user data from event");
					return new Response("Invalid user data", { status: 400 });
				}

				if (event.type === "user.created") {
					await retryOperation(() => upsertUser(supabase, userData));
					sendWelcomeEmailSafely(userData.email, userData.name).catch(
						(error) => {
							Sentry.captureException(error, {
								level: "warning",
								tags: { route: "clerk-webhook", op: "welcome-email" },
							});
							console.error("Background welcome email failed:", error);
						},
					);
				} else {
					await retryOperation(() => updateOrCreateUser(supabase, userData));
				}

				const processingTime = Date.now() - startTime;
				console.log(
					`Successfully processed ${event.type} for user ${userData.id} in ${processingTime}ms`,
				);
				return new Response("User processed successfully", { status: 200 });
			}

			case "user.deleted": {
				const userId = event.data?.id;
				if (!userId) {
					console.error("Missing user ID in deletion event");
					return new Response("Invalid deletion request", { status: 400 });
				}

				await retryOperation(() => handleUserDeletion(supabase, userId));

				const processingTime = Date.now() - startTime;
				console.log(
					`Successfully deleted user ${userId} in ${processingTime}ms`,
				);
				return new Response("User deleted successfully", { status: 200 });
			}

			default:
				console.log(`Unhandled event type: ${event.type}`);
				return new Response("Event type not handled", { status: 200 });
		}
	} catch (error) {
		const processingTime = Date.now() - startTime;
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";

		// A unique-violation here means a concurrent webhook delivery already
		// inserted the row - the desired end state is reached, so acknowledge 200
		// and skip the Sentry capture to stop the alert noise.
		if (isUniqueViolation(error)) {
			console.warn("Concurrent webhook delivery resolved by peer:", {
				eventType: event?.type,
				userId: event?.data?.id,
				processingTime,
			});
			return new Response("User already synced", { status: 200 });
		}

		console.error("Webhook processing failed:", {
			error: errorMessage,
			eventType: event?.type,
			userId: event?.data?.id,
			processingTime,
			stack: error instanceof Error ? error.stack : undefined,
		});

		if (
			errorMessage.includes("verification") ||
			errorMessage.includes("timeout")
		) {
			return new Response("Webhook verification failed", { status: 401 });
		}

		Sentry.captureException(error, { tags: { route: "clerk-webhook" } });

		if (
			errorMessage.includes("Database") ||
			errorMessage.includes("Supabase")
		) {
			return new Response("Database operation failed", { status: 500 });
		}

		return new Response("Internal server error", { status: 500 });
	}
}
