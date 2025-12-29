"use client";

import { useUser } from "@clerk/nextjs";
import { Cookie, ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { COOKIE_KEY } from "@/constants";
import { CookiePreferences } from "@/types";
import {
	initializeGTMConsent,
	loadPreferences,
	savePreferences,
	trackGTMEvent,
	updateGTMConsent,
	updateUserConsent,
} from "@/utils/cookies";
import CookiePreferencesModal from "./CookiePreferencesModal";

const CookieBanner = () => {
	const { user, isSignedIn } = useUser();
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

		// Initialize GTM consent on component mount
		initializeGTMConsent();

		if (isSignedIn && user) {
			// For logged-in users, check Clerk's publicMetadata.cookieConsent
			const hasClerkPreferences = !!user.publicMetadata.cookieConsent;
			if (hasClerkPreferences) {
				const clerkPrefs = user.publicMetadata
					.cookieConsent as CookiePreferences;
				savePreferences(clerkPrefs);
				// Apply existing consent to GTM
				updateGTMConsent(clerkPrefs.analytics, clerkPrefs.marketing);
				setIsVisible(false);
			} else {
				// Show banner if no Clerk preferences
				setIsVisible(true);
			}
		} else {
			// For non-logged-in users, check localStorage
			const hasLocalPreferences = !!localStorage.getItem(COOKIE_KEY);
			if (hasLocalPreferences) {
				const localPrefs = loadPreferences();
				// Apply existing consent to GTM
				updateGTMConsent(localPrefs.analytics, localPrefs.marketing);
				setIsVisible(false);
			} else {
				setIsVisible(true);
			}
		}

		setIsLoading(false);
	}, [isSignedIn, user]);

	const handleAcceptAll = async () => {
		const prefs = savePreferences({
			accepted: true,
			analytics: true,
			marketing: true,
		});

		// Update GTM consent
		updateGTMConsent(true, true);

		await updateUserConsent(prefs, isSignedIn, user?.id);
		setIsVisible(false);

		// Track accept all event
		trackGTMEvent("cookie_banner_accept_all");
	};

	const handleAcceptEssential = async () => {
		const prefs = savePreferences({
			accepted: true,
			analytics: false,
			marketing: false,
		});

		// Update GTM consent
		updateGTMConsent(false, false);

		await updateUserConsent(prefs, isSignedIn, user?.id);
		setIsVisible(false);

		// Track essential only event
		trackGTMEvent("cookie_banner_essential_only");
	};

	if (isLoading || !isVisible) return null;

	return (
		<>
			<div className="fixed bottom-0 left-0 right-0 z-50 bg-product-background border-t border-product-border shadow-lg">
				<div className="container mx-auto px-4 py-4">
					<div className="flex flex-col md:flex-row items-start md:items-center gap-4">
						<div className="flex items-start gap-3 flex-1">
							<div className="flex-shrink-0 w-10 h-10 rounded-full bg-product-primary/10 flex items-center justify-center">
								<Cookie className="w-5 h-5 text-product-primary" />
							</div>
							<div className="flex-1">
								<h3 className="text-sm font-semibold text-product-foreground mb-1">
									We respect your privacy
								</h3>
								<p className="text-xs text-product-foreground-accent leading-relaxed">
									We use cookies and similar technologies to improve your
									experience, analyze site usage, and assist in marketing
									efforts. You can choose which types of cookies to allow.{" "}
									<Link
										className="text-product-primary hover:underline inline-flex items-center gap-1"
										href="/privacy-policy"
										rel="noopener noreferrer"
										target="_blank"
									>
										Learn more
										<ExternalLink className="w-3 h-3" />
									</Link>
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 flex-shrink-0">
							<Button
								aria-label="Open cookie settings"
								className="text-xs px-3 py-2"
								onClick={() => setIsSettingsOpen(true)}
								size="sm"
								variant="outline"
							>
								<Settings className="w-3 h-3 mr-1" />
								Customize
							</Button>
							<Button
								className="text-xs px-3 py-2"
								onClick={handleAcceptEssential}
								size="sm"
								variant="outline"
							>
								Essential Only
							</Button>
							<Button
								className="text-xs px-4 py-2"
								onClick={handleAcceptAll}
								size="sm"
								variant="cta"
							>
								Accept All
							</Button>
						</div>
					</div>
				</div>
			</div>
			<CookiePreferencesModal
				isOpen={isSettingsOpen}
				onClose={() => setIsSettingsOpen(false)}
				onSave={() => setIsVisible(false)}
			/>
		</>
	);
};

export default CookieBanner;
