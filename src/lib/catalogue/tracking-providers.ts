import type { Metadata } from "@quicktalog/common";

/**
 * The owner's own analytics tags on a published catalogue.
 *
 * The setting stores an **id**, never a snippet, and the tag is built here from
 * a fixed template. Nothing author-written ever becomes code, so there is no
 * markup to sanitize - there is nothing arbitrary in the first place.
 *
 * Google Tag Manager is deliberately not here. A `GTM-` container is arbitrary
 * JavaScript its owner edits in Google's UI and Google serves into the page,
 * and published catalogues share an origin with the signed-in app, whose
 * session cookie is script-readable by design
 * (`src/lib/auth/cookie-options.ts`). GA4 and Meta Pixel are fixed vendor
 * scripts selected by an id, which is a different thing entirely. GTM becomes
 * offerable once catalogues move to their own registrable domain.
 */

export type TrackingVendor = "googleAnalytics" | "metaPixel";

/**
 * The owner's GA tag gets its own data layer and its own push function, kept
 * away from `window.dataLayer`/`window.gtag`, which belong to Quicktalog's own
 * GTM container.
 */
export const GA_DATA_LAYER = "qtOwnerDataLayer";
const GA_FN = "qtOwnerGtag";

export interface TrackingVendorSpec {
	/** Key on `catalogue.metadata` holding this vendor's id. */
	field: "googleAnalyticsId" | "metaPixelId";
	label: string;
	/** One line under the vendor's switch in the builder. */
	summary: string;
	/** Where in the vendor's own UI the id is found. Shown under the input. */
	hint: string;
	placeholder: string;
	/**
	 * The id's shape, anchored. Checked in the builder, on save, and again at
	 * render - so a row written before a pattern tightened, or edited by hand,
	 * still cannot reach the page.
	 */
	pattern: RegExp;
	/** Message for an id that looks like a different vendor's. */
	mistakes: { pattern: RegExp; message: string }[];
}

export const TRACKING_VENDORS: Record<TrackingVendor, TrackingVendorSpec> = {
	googleAnalytics: {
		field: "googleAnalyticsId",
		label: "Google Analytics",
		summary: "See visits in your own GA4 property.",
		hint: "In Google Analytics: Admin → Data streams → your web stream. It starts with G-.",
		placeholder: "G-XXXXXXXXXX",
		pattern: /^G-[A-Z0-9]{4,15}$/i,
		mistakes: [
			{
				pattern: /^GTM-/i,
				message:
					"This is a Google Tag Manager container. Tag Manager isn't supported on catalogues, because a container can run any code on the page. Paste your Google Analytics Measurement ID (G-…) instead.",
			},
			{
				pattern: /^GT-/i,
				message:
					"This is a Google tag ID. Paste the Measurement ID of your GA4 web stream; it starts with G-.",
			},
			{
				pattern: /^AW-/i,
				message:
					"This is a Google Ads ID. Paste your GA4 Measurement ID here, and link Analytics to Ads to measure campaigns.",
			},
			{
				pattern: /^UA-/i,
				message:
					"This is an old Universal Analytics ID, which Google no longer processes. Create a GA4 property and paste its G- Measurement ID.",
			},
			{
				pattern: /^\d{8,20}$/,
				message:
					"This looks like a Meta Pixel ID. Turn on Meta Pixel below and paste it in the Meta Pixel field.",
			},
		],
	},
	metaPixel: {
		field: "metaPixelId",
		label: "Meta Pixel",
		summary: "Measure visits from your Meta ads.",
		hint: "In Meta Events Manager: Data sources → your pixel. A long number.",
		placeholder: "1234567890123456",
		pattern: /^\d{8,20}$/,
		mistakes: [
			{
				pattern: /^G-/i,
				message:
					"This looks like a Google Analytics Measurement ID. Turn on Google Analytics above and paste it in the Google Analytics field.",
			},
			{
				pattern: /^GTM-/i,
				message:
					"This is a Google Tag Manager container, which isn't supported on catalogues.",
			},
		],
	},
};

export const TRACKING_VENDOR_KEYS = Object.keys(
	TRACKING_VENDORS,
) as TrackingVendor[];

/** True when this id is safe to interpolate into the vendor's template. */
export function isValidTrackingId(
	vendor: TrackingVendor,
	id: unknown,
): boolean {
	if (typeof id !== "string") return false;
	return TRACKING_VENDORS[vendor].pattern.test(id.trim());
}

/**
 * Why an id was refused, phrased for the owner. `null` means it is valid.
 * An empty value is not an error: clearing the field removes the tag.
 */
export function trackingIdError(
	vendor: TrackingVendor,
	id: string,
): string | null {
	const value = id.trim();
	if (!value) return null;
	if (isValidTrackingId(vendor, value)) return null;

	const spec = TRACKING_VENDORS[vendor];
	for (const mistake of spec.mistakes) {
		if (mistake.pattern.test(value)) return mistake.message;
	}
	return `That doesn't look like a ${spec.label} ID. It should look like ${spec.placeholder}.`;
}

/**
 * The ids on a catalogue that are safe to load, keyed by vendor.
 *
 * The single place the render path and the save path agree on what counts as
 * connected. An id that no longer matches its pattern is simply absent.
 */
export function validTrackingIds(
	metadata: Metadata | undefined | null,
): Partial<Record<TrackingVendor, string>> {
	const out: Partial<Record<TrackingVendor, string>> = {};
	if (!metadata) return out;
	for (const vendor of TRACKING_VENDOR_KEYS) {
		const raw = metadata[TRACKING_VENDORS[vendor].field];
		if (typeof raw === "string" && isValidTrackingId(vendor, raw)) {
			out[vendor] = raw.trim();
		}
	}
	return out;
}

/** True when a catalogue has at least one loadable tag. */
export const hasTrackingIds = (
	metadata: Metadata | undefined | null,
): boolean => Object.keys(validTrackingIds(metadata)).length > 0;

/**
 * Strips any tracking id the plan does not include. Called on the server from
 * `applyPlanToCatalogue`, so the gate does not depend on the builder - the
 * client sends the whole `metadata` object back on every save.
 */
export function stripTrackingIds(metadata: Metadata): Metadata {
	const out = { ...metadata };
	for (const vendor of TRACKING_VENDOR_KEYS) {
		delete out[TRACKING_VENDORS[vendor].field];
	}
	return out;
}

/**
 * Removes only the ids that do not match their vendor's pattern, keeping the
 * valid ones. Used on save when the plan allows tracking, so a typo does not
 * persist as a field the owner believes is connected.
 */
export function dropInvalidTrackingIds(metadata: Metadata): Metadata {
	const out = { ...metadata };
	for (const vendor of TRACKING_VENDOR_KEYS) {
		const field = TRACKING_VENDORS[vendor].field;
		const raw = out[field];
		if (raw === undefined) continue;
		if (typeof raw === "string" && raw.trim() === "") {
			// Clearing the field is how a tag is removed.
			delete out[field];
			continue;
		}
		if (!isValidTrackingId(vendor, raw)) delete out[field];
		else out[field] = (raw as string).trim();
	}
	return out;
}

/**
 * The script for a vendor, with the id already checked by the caller.
 *
 * Templates only: every interpolation is either a literal from this file or an
 * id that matched its anchored pattern. Those ids are alphanumeric with at most
 * a dash, so none can close a string or a script tag.
 */
export function trackingScript(
	vendor: TrackingVendor,
	id: string,
): { src?: string; inline: string } {
	switch (vendor) {
		case "googleAnalytics":
			return {
				// `l=` puts the tag on its own data layer. The root layout loads
				// Quicktalog's own GTM container on every route, including
				// `/catalogues/*`, and it reads `window.dataLayer`. Sharing that
				// array would make the owner's consent and signal commands apply
				// to Quicktalog's container too - granting it analytics storage
				// the visitor only gave the owner, and switching off Google
				// Signals for Quicktalog's own property.
				src: `https://www.googletagmanager.com/gtag/js?id=${id}&l=${GA_DATA_LAYER}`,
				// Consent denied by default, then analytics granted - the visitor
				// has already allowed it by the time this runs. Ad signals off.
				inline: [
					`window.${GA_DATA_LAYER}=window.${GA_DATA_LAYER}||[];`,
					`function ${GA_FN}(){window.${GA_DATA_LAYER}.push(arguments);}`,
					`${GA_FN}('consent','default',{'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied','analytics_storage':'denied','wait_for_update':500});`,
					`${GA_FN}('consent','update',{'analytics_storage':'granted'});`,
					`${GA_FN}('set','allow_google_signals',false);`,
					`${GA_FN}('set','allow_ad_personalization_signals',false);`,
					`${GA_FN}('js',new Date());`,
					`${GA_FN}('config','${id}',{'anonymize_ip':true});`,
				].join(""),
			};
		case "metaPixel":
			return {
				inline: [
					"!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');",
					`fbq('init','${id}');`,
					"fbq('track','PageView');",
				].join(""),
			};
	}
}

/**
 * Marks one of **our** frames, so a catalogue embedded on `/showcases` or in the
 * demo does not report a visit to its owner's analytics.
 *
 * Deliberately not `window.top !== window.self`: the success modal hands every
 * owner an `<iframe>` snippet, so refusing to run whenever framed would
 * silently break analytics for catalogues embedded in a customer's own site -
 * a case the product actively promotes. Our own frames opt out instead.
 */
export const QT_FRAME_PARAM = "qt_frame";

/** The same URL, marked as one of our frames. */
export function withQtFrame(url: string): string {
	try {
		const parsed = new URL(url);
		parsed.searchParams.set(QT_FRAME_PARAM, "1");
		return parsed.toString();
	} catch {
		// Relative or malformed: fall back to a plain append.
		return url.includes("?")
			? `${url}&${QT_FRAME_PARAM}=1`
			: `${url}?${QT_FRAME_PARAM}=1`;
	}
}
