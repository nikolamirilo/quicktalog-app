"use client";

import type { Metadata } from "@quicktalog/common";
import Script from "next/script";
import { Fragment, useEffect, useState } from "react";
import { sessionCookieName } from "@/lib/auth/cookie-options";
import {
	QT_FRAME_PARAM,
	type TrackingVendor,
	TRACKING_VENDORS,
	trackingScript,
	validTrackingIds,
} from "@/lib/catalogue/tracking-providers";

/**
 * Loads a catalogue's own analytics tags, once the visitor has allowed them.
 *
 * Rendered only for a published catalogue (`type === "view"`). The builder, the
 * preview and the demo must not report traffic the owner never received.
 *
 * The app's own cookie banner deliberately skips `/catalogues/` paths - it
 * reads the signed-in owner's stored preferences, which say nothing about a
 * visitor - so a published catalogue needs its own gate. This is that gate.
 */

/** Per catalogue: allowing one business's tags is not allowing another's. */
const consentKey = (slug: string) => `qt-analytics-consent:${slug}`;
/** Re-ask after this long rather than treating one yes as permanent. */
const CONSENT_MONTHS = 6;

type Consent = "granted" | "denied" | "unknown";

type Stored = { value: Exclude<Consent, "unknown">; at: number };

const readConsent = (slug: string): Consent => {
	try {
		const raw = localStorage.getItem(consentKey(slug));
		if (!raw) return "unknown";
		const stored = JSON.parse(raw) as Stored;
		if (stored.value !== "granted" && stored.value !== "denied") {
			return "unknown";
		}
		// A missing or junk timestamp would make the age NaN, and `NaN > max` is
		// false - so the choice would never expire. Re-ask instead.
		if (!Number.isFinite(stored.at)) return "unknown";
		const ageMs = Date.now() - stored.at;
		const maxMs = CONSENT_MONTHS * 30 * 24 * 60 * 60 * 1000;
		return ageMs > maxMs ? "unknown" : stored.value;
	} catch {
		// Private mode, blocked storage, or anything hand-edited: ask again.
		return "unknown";
	}
};

const writeConsent = (slug: string, value: Exclude<Consent, "unknown">) => {
	try {
		localStorage.setItem(
			consentKey(slug),
			JSON.stringify({ value, at: Date.now() } satisfies Stored),
		);
	} catch {
		// The choice still holds for this page view.
	}
};

/** True when this document must not load anyone's tag. */
function isBlockedContext(): boolean {
	if (typeof window === "undefined") return true;

	const params = new URLSearchParams(window.location.search);
	// One of our own frames (showcases, demo).
	if (params.has(QT_FRAME_PARAM)) return true;

	// The builder and the dashboard are never a visit.
	if (window.location.pathname.startsWith("/admin")) return true;
	// `endsWith`, not `includes`: a catalogue slugged "preview-menu" lives at
	// /catalogues/preview-menu and is a real published page.
	if (window.location.pathname.endsWith("/preview")) return true;

	// A browser holding a Quicktalog session is the owner or a colleague, not a
	// customer. Their visits would skew the owner's numbers, and the session
	// cookie is script-readable by design (see `cookie-options.ts`), so keeping
	// third-party tags away from them is worth the few lost views.
	try {
		const base = sessionCookieName();
		const names = document.cookie
			.split(";")
			.map((pair) => pair.split("=")[0]?.trim())
			.filter(Boolean) as string[];
		// `@supabase/ssr` splits a large session across `<base>.0`, `<base>.1`…
		// so matching only `<base>` misses every chunked session.
		// `src/utils/supabase/session.ts` matches the same two shapes.
		const signedIn = names.some(
			(name) => name === base || name.startsWith(`${base}.`),
		);
		if (signedIn) return true;
	} catch {
		// Unreadable cookies: fall through rather than block every visitor.
	}

	return false;
}

/**
 * Stops the tags and clears what they set, before the page reloads.
 *
 * Withdrawal has to actually undo something or the consent is not real: GA
 * keeps a `_ga*` client id and Meta a `_fbp`/`_fbc` pair, and both would be
 * picked straight back up on the next allow.
 */
function withdraw(ids: Partial<Record<TrackingVendor, string>>): void {
	if (ids.googleAnalytics) {
		// Documented GA opt-out flag; stops sending before the reload.
		(window as unknown as Record<string, unknown>)[
			`ga-disable-${ids.googleAnalytics}`
		] = true;
	}
	if (ids.metaPixel) {
		// fbq queues rather than exposing a kill switch, so drop the queue and
		// let the reload take the script with it.
		(window as unknown as Record<string, unknown>).fbq = undefined;
	}
	try {
		for (const pair of document.cookie.split(";")) {
			const name = pair.split("=")[0]?.trim();
			if (!name) continue;
			if (!/^(_ga|_gid|_fbp|_fbc)/.test(name)) continue;
			// Host-only and domain-scoped copies are set separately.
			document.cookie = `${name}=; Max-Age=0; path=/`;
			document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}`;
		}
	} catch {
		// Best effort: the reload still stops both tags from running again.
	}
}

const CatalogueAnalytics = ({
	metadata,
	slug,
	privacyPolicyUrl,
	businessName,
}: {
	metadata: Metadata | undefined | null;
	slug: string;
	privacyPolicyUrl?: string;
	businessName?: string;
}) => {
	const ids = validTrackingIds(metadata);
	const vendors = Object.keys(ids) as TrackingVendor[];

	const [consent, setConsent] = useState<Consent>("unknown");
	/** Nothing renders until the browser has been inspected. */
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		if (vendors.length === 0) return;
		if (isBlockedContext()) return;
		setConsent(readConsent(slug));
		setIsReady(true);
	}, [vendors.length, slug]);

	if (vendors.length === 0 || !isReady) return null;

	const decide = (value: Exclude<Consent, "unknown">) => {
		writeConsent(slug, value);
		setConsent(value);
	};

	const who = businessName || "This business";
	const names = vendors.map((v) => TRACKING_VENDORS[v].label).join(" and ");

	return (
		<>
			{consent === "granted" &&
				vendors.map((vendor) => {
					const { src, inline } = trackingScript(vendor, ids[vendor] as string);
					return (
						<Fragment key={vendor}>
							{/* The inline config runs first so consent defaults are set
							    before the vendor's script can send anything. */}
							<Script id={`tracking-${vendor}`} strategy="afterInteractive">
								{inline}
							</Script>
							{src && (
								<Script
									id={`tracking-src-${vendor}`}
									src={src}
									strategy="afterInteractive"
								/>
							)}
						</Fragment>
					);
				})}

			{consent === "unknown" && (
				<div
					aria-label="Cookie choices"
					className="fixed inset-x-0 bottom-0 z-[60] border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] backdrop-blur"
					role="region"
				>
					<div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-[13px] leading-snug text-gray-700">
							{who} uses {names} to see how this page is used.
							{privacyPolicyUrl && (
								<>
									{" "}
									<a
										className="underline underline-offset-2"
										href={privacyPolicyUrl}
										rel="noopener noreferrer"
										target="_blank"
									>
										Privacy policy
									</a>
								</>
							)}
						</p>
						{/* Equal weight, so declining is as easy as accepting. */}
						<div className="flex flex-none gap-2">
							<button
								className="min-h-11 flex-1 rounded-full border-[1.5px] border-gray-300 px-5 text-[13px] font-semibold text-gray-800 transition-colors hover:border-gray-400 sm:flex-none"
								onClick={() => decide("denied")}
								type="button"
							>
								Decline
							</button>
							<button
								className="min-h-11 flex-1 rounded-full border-[1.5px] border-gray-900 bg-gray-900 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-black sm:flex-none"
								onClick={() => decide("granted")}
								type="button"
							>
								Allow
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Lets a visitor change their mind, which consent needs to be real. */}
			{consent !== "unknown" && (
				<div className="pb-6 text-center">
					<button
						className="text-[12px] text-[var(--catalogue-text)]/60 underline underline-offset-2"
						onClick={() => {
							if (consent === "granted") withdraw(ids);
							decide(consent === "granted" ? "denied" : "granted");
							window.location.reload();
						}}
						type="button"
					>
						{consent === "granted"
							? "Turn off analytics cookies"
							: "Allow analytics cookies"}
					</button>
				</div>
			)}
		</>
	);
};

export default CatalogueAnalytics;
