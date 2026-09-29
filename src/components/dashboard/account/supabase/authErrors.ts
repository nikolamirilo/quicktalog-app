import type { AuthError } from "@supabase/supabase-js";

/**
 * GoTrue's error codes turned into something a person can act on. Anything not
 * listed keeps the server's own message, which is already user-facing.
 */
export function describeAuthError(
	error: AuthError | null,
	fallback: string,
): string {
	switch (error?.code) {
		case "invalid_credentials":
			return "That password is not correct.";
		case "same_password":
			return "The new password has to be different from the current one.";
		case "weak_password":
			return "That password is too weak. Use at least 8 characters with letters and digits.";
		case "email_exists":
		case "user_already_exists":
			return "That email address is already in use.";
		case "email_address_invalid":
			return "That email address is not valid.";
		case "over_email_send_rate_limit":
			return "Too many emails were sent. Please wait a few minutes.";
		case "over_request_rate_limit":
			return "Too many attempts. Please wait a few minutes.";
		case "manual_linking_disabled":
			return "Connecting accounts is not available yet.";
		case "identity_already_exists":
			return "That Google account is already connected to an account.";
		case "single_identity_not_deletable":
			return "This is your only sign-in method, so it cannot be disconnected.";
		case "email_conflict_identity_not_deletable":
			return "Disconnecting this would leave your account without its email address.";
		case "reauthentication_not_valid":
			return "That code is not valid. Request a new one.";
		default:
			return error?.message || fallback;
	}
}
