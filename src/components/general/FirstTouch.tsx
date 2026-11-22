"use client";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
	attachFirstTouchForSignup,
	recordFirstTouch,
} from "@/lib/analytics/first-touch";

/**
 * Records where a visitor came from, on their first page and only then.
 *
 * `users.acquisition_source` was null for 2,180 of 2,200 accounts, because the only
 * thing ever recorded was a dashboard question most people skip. This is the other
 * half: the UTM tags on the landing URL and the referring domain, kept in a
 * first-party cookie the sign-up paths read server-side.
 *
 * Nothing is sent anywhere from here - it is written to this browser and travels with
 * the sign-up request, so an ad blocker cannot lose it the way it loses PostHog.
 */
export function FirstTouch() {
	const pathname = usePathname();

	useEffect(() => {
		// Published catalogues are the owner's pages, not ours to measure.
		if (pathname.startsWith("/catalogues/")) return;
		recordFirstTouch();
	}, [pathname]);

	useEffect(() => {
		// A visitor who declined analytics cookies has their first touch held in
		// session storage; this hands it over for the sign-up request only.
		if (pathname.startsWith("/auth")) attachFirstTouchForSignup();
	}, [pathname]);

	return null;
}
