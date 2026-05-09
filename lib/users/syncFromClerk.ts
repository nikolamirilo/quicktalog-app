import { defaultCookiePreferences } from "@/constants";

export const DEFAULT_PLAN_ID = "pri_01k27ajepm199twd1x77rpwdrq";

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

export interface UserData {
	id: string;
	email: string | null;
	image: string | null;
	name: string;
	plan_id?: string;
	customer_id?: string | null;
	cookie_preferences: any;
}

interface ClerkProfileLike {
	id: string;
	emailAddresses?: Array<{ emailAddress: string }>;
	firstName?: string | null;
	lastName?: string | null;
	imageUrl?: string | null;
	publicMetadata?: Record<string, any>;
}

export function sanitizeString(value: unknown): string {
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

export function extractUserEmail(
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

export function buildFullName(
	firstName?: string | null,
	lastName?: string | null,
): string {
	const cleanFirstName = sanitizeString(firstName);
	const cleanLastName = sanitizeString(lastName);
	return [cleanFirstName, cleanLastName].filter(Boolean).join(" ");
}

export function buildUserData(event: ClerkWebhookEvent): UserData | null {
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
	const full_name = buildFullName(first_name, last_name);

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

	if (event.type === "user.created") {
		return {
			...baseUserData,
			plan_id: DEFAULT_PLAN_ID,
			customer_id: null,
			cookie_preferences: defaultCookiePreferences,
		};
	}

	return baseUserData;
}

export function buildUserDataFromClerkProfile(
	profile: ClerkProfileLike,
): UserData {
	const email = profile.emailAddresses?.[0]?.emailAddress?.trim().toLowerCase();
	const fullName = buildFullName(profile.firstName, profile.lastName);
	return {
		id: profile.id.trim(),
		email: email ?? null,
		image: sanitizeString(profile.imageUrl) || null,
		name: fullName || "Unknown User",
		plan_id: DEFAULT_PLAN_ID,
		customer_id: null,
		cookie_preferences:
			profile.publicMetadata?.cookieConsent || defaultCookiePreferences,
	};
}

export function isUniqueViolation(error: unknown): boolean {
	if (!error || typeof error !== "object") return false;
	const code = (error as { code?: string }).code;
	return code === "23505";
}

export async function upsertUser(
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
		const wrapped = new Error(`Database upsert failed: ${error.message}`);
		(wrapped as { code?: string }).code = error.code;
		throw wrapped;
	}
}

/**
 * Update a user row by id. If no row exists, atomically upsert one with the
 * default plan. Replaces the previous "update then insert" pattern that races
 * under concurrent webhook deliveries and produced users_pkey violations.
 */
export async function updateOrCreateUser(
	supabase: any,
	userData: UserData,
): Promise<void> {
	const { email, image, name, cookie_preferences, id } = userData;
	const { error, count } = await supabase
		.from("users")
		.update({ email, image, name, cookie_preferences })
		.eq("id", id)
		.select("id", { count: "exact" });

	if (error) {
		console.error("Database update error:", {
			message: error.message,
			details: error.details,
			hint: error.hint,
			code: error.code,
			userId: id,
		});
		const wrapped = new Error(`Database update failed: ${error.message}`);
		(wrapped as { code?: string }).code = error.code;
		throw wrapped;
	}

	if (!count) {
		await upsertUser(supabase, {
			...userData,
			plan_id: DEFAULT_PLAN_ID,
			customer_id: null,
		});
	}
}
