import type { AuthError } from "@supabase/supabase-js";
import type { ConfirmResult } from "@/app/auth/confirm/continue/actions";

/**
 * Every user-facing auth string, in one place.
 *
 * It used to be three: `SupabaseAuthForms` and `UpdatePasswordForm` each mapped
 * `AuthError.code` and returned character-identical copy for `weak_password`
 * and `over_request_rate_limit`, and `ConfirmContinue` kept a third table.
 */

/**
 * GoTrue's error codes, in the product's words. Anything unmapped falls back to
 * the API message, which is safe to show: it never names another account.
 */
export function authErrorMessage(error: AuthError): string {
	switch (error.code) {
		case "invalid_credentials":
			return "That email and password do not match an account.";
		case "email_not_confirmed":
			return "Confirm your email address first — the link is in your inbox.";
		case "captcha_failed":
			return "The anti-bot check did not pass. Try again.";
		case "over_request_rate_limit":
		case "over_email_send_rate_limit":
			return "Too many attempts. Wait a few minutes and try again.";
		case "weak_password":
			return "That password is too weak. Use a longer one.";
		case "signup_disabled":
			return "New accounts are closed at the moment.";
		// Only reachable from the update-password screen, which holds a recovery
		// session rather than credentials.
		case "same_password":
			return "That is already your password. Choose a different one.";
		case "reauthentication_needed":
			return "This recovery link is no longer fresh enough. Request a new one and try again.";
		default:
			return error.message || "Something went wrong. Try again.";
	}
}

/** What `/auth?error=...` means, in the words of the route that sent it here. */
export const LANDING_ERRORS: Record<string, string> = {
	link: "That link is no longer valid. Links can be used once and expire; request a new one below.",
	oauth:
		"Google sign-in did not finish. Try again, or use your email and password.",
	recovery:
		"Open the reset link from your email again — this page needs the session it creates.",
	config:
		"Sign-in is misconfigured on our side, not yours. We have been alerted; please try again shortly.",
};

/** Why an email confirmation link did not work. */
export const CONFIRM_MESSAGES: Record<
	Extract<ConfirmResult, { ok: false }>["code"],
	{ title: string; body: string }
> = {
	rate_limited: {
		title: "Too many attempts",
		body: "Wait a few minutes and open the link again.",
	},
	signed_in: {
		title: "You are already signed in",
		body: "Sign out of this account first, then open the link from your email again. Confirming a link while signed in could attach the wrong account to this browser.",
	},
	expired: {
		title: "This link has expired",
		body: "Confirmation links are valid for 10 minutes after you open them. Request a new one and try again.",
	},
	link: {
		title: "This link did not work",
		body: "It may already have been used or it has expired. Request a new one and try again.",
	},
	config: {
		title: "Something is wrong on our side",
		body: "Sign-in is misconfigured, and a new link will not help. We have been alerted — please try again shortly.",
	},
};
