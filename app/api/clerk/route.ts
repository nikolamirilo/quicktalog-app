import { sendWelcomeEmail } from "@/actions/email";
import { defaultCookiePreferences } from "@/constants";
import { createClient } from "@/utils/supabase/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest } from "next/server";

// Types for better type safety
interface ClerkWebhookEvent {
	type: string;
	data: {
		id: string;
		email_addresses?: Array<{ email_address: string }>;
		first_name?: string | null;
		last_name?: string | null;
		image_url?: string | null;
		public_metadata?: Record<string, any>;
	};
}

interface UserData {
	id: string;
	email: string | null;
	image: string | null;
	name: string;
	plan_id?: string;
	customer_id?: string | null;
	cookie_preferences: any;
}

// Constants
const HANDLED_EVENT_TYPES = [
	"user.created",
	"user.updated",
	"user.deleted",
] as const;
const DEFAULT_PLAN_ID = "pri_01k27ajepm199twd1x77rpwdrq";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Utility functions
function sanitizeString(value: unknown): string {
	if (typeof value === "string") {
		return value.trim();
	}
	return "";
}

function validateEmail(email: string | null): boolean {
	if (!email) return false;
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function extractUserEmail(
	emailAddresses?: Array<{ email_address: string }>,
): string | null {
	if (!Array.isArray(emailAddresses) || emailAddresses.length === 0) {
		return null;
	}

	const primaryEmail = emailAddresses[0]?.email_address;
	return typeof primaryEmail === "string"
		? primaryEmail.trim().toLowerCase()
		: null;
}

function buildFullName(
	firstName?: string | null,
	lastName?: string | null,
): string {
	const cleanFirstName = sanitizeString(firstName);
	const cleanLastName = sanitizeString(lastName);
	return [cleanFirstName, cleanLastName].filter(Boolean).join(" ");
}

function buildUserData(event: ClerkWebhookEvent): UserData | null {
	const {
		id,
		email_addresses,
		first_name,
		last_name,
		image_url,
		public_metadata,
	} = event.data;

	// Validate required fields
	if (!id || typeof id !== "string") {
		console.error("Invalid or missing user ID");
		return null;
	}

	const email = extractUserEmail(email_addresses);
	const full_name = buildFullName(first_name, last_name);

	// For user updates, we don't require email validation as strictly
	if (event.type === "user.created" && !validateEmail(email)) {
		console.error("Invalid email for user creation:", email);
		return null;
	}

	const baseUserData: UserData = {
		id: id.trim(),
		email,
		image: sanitizeString(image_url) || null,
		name: full_name || "Unknown User",
		cookie_preferences:
			public_metadata?.cookieConsent || defaultCookiePreferences,
	};

	// Add creation-specific fields
	if (event.type === "user.created") {
		return {
			...baseUserData,
			plan_id: DEFAULT_PLAN_ID,
			customer_id: null,
			cookie_preferences: defaultCookiePreferences, // Always use default for new users
		};
	}

	return baseUserData;
}

async function retryOperation<T>(
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

async function handleUserUpsert(
	supabase: any,
	userData: UserData,
): Promise<void> {
	const { error } = await supabase.from("users").upsert([userData], {
		onConflict: "id",
		ignoreDuplicates: false,
	});

	if (error) {
		console.error("Database upsert error:", {
			message: error.message,
			details: error.details,
			hint: error.hint,
			code: error.code,
			userId: userData.id,
		});
		throw new Error(`Database upsert failed: ${error.message}`);
	}
}

async function handleUserDeletion(
	supabase: any,
	userId: string,
): Promise<void> {
	// Validate userId
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

async function sendWelcomeEmailSafely(
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
		// Don't throw - welcome email failure shouldn't break the webhook
		console.error("Failed to send welcome email:", {
			error: error instanceof Error ? error.message : String(error),
			email,
			name,
		});
	}
}

export async function POST(req: NextRequest) {
	const startTime = Date.now();
	let event: ClerkWebhookEvent | null = null;

	try {
		// Verify webhook with timeout
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

		// Check if event type is supported
		if (!HANDLED_EVENT_TYPES.includes(event.type as any)) {
			console.log(`Event type '${event.type}' not handled`);
			return new Response("Event type not handled", { status: 200 });
		}

		const supabase = await createClient();
		if (!supabase) {
			console.error("Failed to create Supabase client");
			return new Response("Database connection failed", { status: 500 });
		}

		// Handle different event types
		switch (event.type) {
			case "user.created":
			case "user.updated": {
				const userData = buildUserData(event);
				if (!userData) {
					console.error("Failed to build user data from event");
					return new Response("Invalid user data", { status: 400 });
				}

				// Upsert user with retry logic
				await retryOperation(() => handleUserUpsert(supabase, userData));

				// Send welcome email for new users (async, non-blocking)
				if (event.type === "user.created") {
					// Don't await - run in background
					sendWelcomeEmailSafely(userData.email, userData.name).catch(
						(error) => {
							console.error("Background welcome email failed:", error);
						},
					);
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

		console.error("Webhook processing failed:", {
			error: errorMessage,
			eventType: event?.type,
			userId: event?.data?.id,
			processingTime,
			stack: error instanceof Error ? error.stack : undefined,
		});

		// Return appropriate error status
		if (
			errorMessage.includes("verification") ||
			errorMessage.includes("timeout")
		) {
			return new Response("Webhook verification failed", { status: 401 });
		}

		if (
			errorMessage.includes("Database") ||
			errorMessage.includes("Supabase")
		) {
			return new Response("Database operation failed", { status: 500 });
		}

		return new Response("Internal server error", { status: 500 });
	}
}
