export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000;

/**
 * Self-reported acquisition channels, asked once in a dashboard modal. The value lands in
 * `users.self_reported_source`, never in `acquisition_source`, which holds the tracked
 * channel. For "other" the user's own words are stored instead of the slug.
 */
export const ACQUISITION_SOURCES = [
	{ value: "google", label: "Google" },
	{ value: "social_media", label: "Social media" },
	{ value: "friend_or_colleague", label: "Friend or colleague" },
	{ value: "youtube", label: "YouTube" },
	{ value: "linkedin", label: "LinkedIn" },
	{ value: "quicktalog_catalogue", label: "A Quicktalog catalogue" },
	{ value: "ai_assistant", label: "AI assistant" },
	{ value: "other", label: "Other" },
] as const;

export type AcquisitionSource = (typeof ACQUISITION_SOURCES)[number]["value"];

/** Stored when the modal is skipped, so the question is asked only once. */
export const ACQUISITION_SKIPPED = "Skipped";

/** Matches the length bound in the `acquisition_source` CHECK. */
export const ACQUISITION_SOURCE_MAX = 120;
