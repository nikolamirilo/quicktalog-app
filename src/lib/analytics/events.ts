"use client";
import posthog from "posthog-js";

/**
 * The product events the activation funnel is measured on. They are named here rather
 * than spelled out at each call site, so a rename cannot quietly split one funnel step
 * into two in PostHog.
 */
export const PRODUCT_EVENTS = {
	/** The builder opened on a catalogue with no sections yet. */
	builderOpenedEmpty: "builder_opened_empty",
	/** The first Quick AI message of a session in an empty catalogue. */
	quickAiFirstUsed: "quick_ai_first_used",
	/** A catalogue went from no sections to one. */
	firstSectionCreated: "first_section_created",
	/** A catalogue was published for the first time. */
	firstPublish: "first_publish",
} as const;

export type ProductEvent = (typeof PRODUCT_EVENTS)[keyof typeof PRODUCT_EVENTS];

/**
 * Records a product event, if PostHog is loaded. It is loaded from
 * `instrumentation-client.ts` only when the key is configured, and an ad blocker can
 * stop it at any time, so nothing here may throw.
 */
export function captureEvent(
	event: ProductEvent,
	properties?: Record<string, unknown>,
): void {
	try {
		posthog.capture(event, properties);
	} catch {
		// Analytics is never worth an error in the builder.
	}
}

/**
 * Ties the anonymous visit history to the account once someone signs in, so the
 * first-touch properties PostHog recorded before signup stay attached to the person.
 */
export function identifyUser(userId: string): void {
	try {
		posthog.identify(userId);
	} catch {
		// As above.
	}
}
