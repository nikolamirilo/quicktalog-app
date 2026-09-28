import type { ClerkProfile } from "@/lib/users/provision";

export interface ClerkWebhookEvent {
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

function sanitizeString(value: unknown): string {
	if (typeof value === "string") {
		return value.trim();
	}
	return "";
}

export function validateEmail(email: string | null): boolean {
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

/**
 * Maps a Clerk `user.created` / `user.updated` webhook payload to the profile
 * fields the users row keeps. Returns null for an unusable payload.
 * Plan and Paddle customer are deliberately not part of it (see upsertClerkUser).
 */
export function buildClerkProfile(
	event: ClerkWebhookEvent,
): ClerkProfile | null {
	const {
		id,
		email_addresses,
		first_name,
		last_name,
		image_url,
		public_metadata,
	} = event.data;

	if (!id || typeof id !== "string") {
		console.error("Invalid or missing user ID");
		return null;
	}

	const email = extractUserEmail(email_addresses);

	if (event.type === "user.created" && !validateEmail(email)) {
		console.error("Invalid email for user creation");
		return null;
	}

	return {
		id: id.trim(),
		email,
		image: sanitizeString(image_url) || null,
		name: buildFullName(first_name, last_name) || "Unknown User",
		cookiePreferences: public_metadata?.cookieConsent ?? undefined,
	};
}
