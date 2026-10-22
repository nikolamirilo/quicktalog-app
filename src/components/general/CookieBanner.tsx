"use client";

import { IconTile } from "@/components/general/IconTile";
import { Button } from "@/components/ui/button";
import { COOKIE_KEY } from "@/constants";
import {
	initializeGTMConsent,
	loadPreferences,
	savePreferences,
	trackGTMEvent,
	updateGTMConsent,
	updateUserConsent,
} from "@/utils/cookies";
import { useUserContext } from "@/context/UserContext";
import { CookiePreferences } from "@quicktalog/common";
import { Cookie, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CookiePreferencesModal } from "@/components/modals/CookiePreferencesModal";

export const CookieBanner = () => {
	const { userData } = useUserContext();
	const isSignedIn = !!userData;
	const [isVisible, setIsVisible] = useState(false);
	const [isSettingsOpen, setIsSettingsOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (
			typeof window === "undefined" ||
			!window ||
			!window.location ||
			window.location.pathname.includes("/catalogues/")
		) {
			setIsLoading(false);
			return;
		}

		initializeGTMConsent();

		if (isSignedIn) {
			// Signed in: the stored choice lives on the user's own row.
			const stored = userData?.cookiePreferences as
				| CookiePreferences
				| undefined;
			if (stored?.accepted) {
				savePreferences(stored);
				updateGTMConsent(stored.analytics, stored.marketing);
				setIsVisible(false);
			} else {
				setIsVisible(true);
			}
		} else {
			const hasLocalPreferences = !!localStorage.getItem(COOKIE_KEY);
			if (hasLocalPreferences) {
				const localPrefs = loadPreferences();
				updateGTMConsent(localPrefs.analytics, localPrefs.marketing);
				setIsVisible(false);
			} else {
				setIsVisible(true);
			}
		}

		setIsLoading(false);
	}, [isSignedIn, userData]);

	const handleAcceptAll = async () => {
		const prefs = savePreferences({
			accepted: true,
			analytics: true,
			marketing: true,
		});

		updateGTMConsent(true, true);

		await updateUserConsent(prefs, isSignedIn);
		setIsVisible(false);
		trackGTMEvent("cookie_banner_accept_all");
	};

	const handleAcceptEssential = async () => {
		const prefs = savePreferences({
			accepted: true,
			analytics: false,
			marketing: false,
		});

		updateGTMConsent(false, false);

		await updateUserConsent(prefs, isSignedIn);
		setIsVisible(false);
		trackGTMEvent("cookie_banner_essential_only");
	};

	if (isLoading || !isVisible) return null;

	return (
		<>
			<section
				aria-labelledby="cookie-banner-title"
				className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-50 mx-auto max-w-[1100px] rounded-product-card border border-product-border bg-product-card p-4 shadow-product-hover animate-in fade-in-0 slide-in-from-bottom-3 duration-300 sm:p-5"
			>
				<div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
					<div className="flex flex-1 items-start gap-3.5">
						<IconTile className="hidden sm:grid">
							<Cookie />
						</IconTile>
						<div className="flex-1">
							<h2
								className="text-base font-bold text-product-foreground"
								id="cookie-banner-title"
							>
								We respect your privacy
							</h2>
							<p className="mt-1 text-[13.5px] leading-relaxed text-product-foreground-accent">
								We use cookies and similar technologies to improve your
								experience, analyze site usage, and assist in marketing efforts.
								You can choose which types of cookies to allow.{" "}
								<Link
									className="inline-flex items-center gap-1 font-semibold text-product-foreground underline decoration-product-primary/80 decoration-2 underline-offset-[3px] hover:text-product-primary-ink"
									href="/privacy-policy"
									rel="noopener noreferrer"
									target="_blank"
								>
									Learn more
									<ExternalLink aria-hidden="true" className="h-3 w-3" />
									<span className="sr-only">(opens in a new tab)</span>
								</Link>
							</p>
						</div>
					</div>
					<div className="flex flex-wrap items-center gap-2 md:flex-none md:flex-nowrap">
						<Button
							aria-label="Customize cookie settings"
							onClick={() => setIsSettingsOpen(true)}
							size="sm"
							variant="ghost"
						>
							<Settings aria-hidden="true" />
							Customize
						</Button>
						<Button
							className="flex-1 md:flex-none"
							onClick={handleAcceptEssential}
							size="sm"
							variant="outline"
						>
							Essential Only
						</Button>
						<Button
							className="flex-1 md:flex-none"
							onClick={handleAcceptAll}
							size="sm"
						>
							Accept All
						</Button>
					</div>
				</div>
			</section>
			<CookiePreferencesModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				onSave={() => setIsVisible(false)}
			/>
		</>
	);
};
