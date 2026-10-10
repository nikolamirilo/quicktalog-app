"use client";

import { IconTile } from "@/components/general/IconTile";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useUserContext } from "@/context/UserContext";
import {
	loadPreferences,
	savePreferences,
	trackGTMEvent,
	updateGTMConsent,
	updateUserConsent,
} from "@/utils/cookies";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

export type CookiePreferencesModalProps = {
	isOpen: boolean;
	onClose: () => void;
	onSave?: () => void;
};

type CategoryRowProps = {
	title: string;
	description: string;
	examples: string;
	switchLabel: string;
	checked: boolean;
	disabled?: boolean;
	onCheckedChange?: (checked: boolean) => void;
};

const CategoryRow = ({
	title,
	description,
	examples,
	switchLabel,
	checked,
	disabled,
	onCheckedChange,
}: CategoryRowProps) => {
	const descriptionId = useId();
	return (
		<div
			className={
				disabled
					? "flex items-start justify-between gap-4 rounded-[18px] border border-product-border bg-product-background-hero p-4"
					: "flex items-start justify-between gap-4 rounded-[18px] border border-product-border bg-product-card p-4"
			}
		>
			<div className="min-w-0 flex-1" id={descriptionId}>
				<h3 className="text-[15px] font-bold text-product-foreground">
					{title}
				</h3>
				<p className="mt-1 text-[13.5px] leading-relaxed text-product-foreground-accent">
					{description}
				</p>
				<p className="mt-2 text-[13px] text-product-muted">
					<strong className="font-semibold text-product-foreground-accent">
						Examples:
					</strong>{" "}
					{examples}
				</p>
			</div>
			<Switch
				aria-describedby={descriptionId}
				aria-label={switchLabel}
				checked={checked}
				className="mt-0.5"
				disabled={disabled}
				onCheckedChange={onCheckedChange}
			/>
		</div>
	);
};

export const CookiePreferencesModal = ({
	isOpen,
	onClose,
	onSave,
}: CookiePreferencesModalProps) => {
	const { userData } = useUserContext();
	const isSignedIn = !!userData;
	const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
	const [marketingEnabled, setMarketingEnabled] = useState(false);

	// Read the saved choice each time the dialog opens (localStorage is client-only).
	useEffect(() => {
		if (!isOpen) return;
		const prefs = loadPreferences();
		setAnalyticsEnabled(prefs.analytics);
		setMarketingEnabled(prefs.marketing);
	}, [isOpen]);

	const handleSaveSettings = async () => {
		const prefs = savePreferences({
			accepted: true,
			analytics: analyticsEnabled,
			marketing: marketingEnabled,
		});

		updateGTMConsent(analyticsEnabled, marketingEnabled);

		await updateUserConsent(prefs, isSignedIn);
		onClose();
		onSave?.();
		trackGTMEvent("cookie_modal_save_settings", {
			consent_analytics: analyticsEnabled,
			consent_marketing: marketingEnabled,
		});
	};

	return (
		<Dialog
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			open={isOpen}
		>
			<DialogContent className="max-h-[90vh] max-w-lg gap-0 overflow-y-auto p-0">
				<div className="flex items-start gap-3.5 border-b border-product-border px-6 pb-5 pt-6 pr-16">
					<IconTile>
						<ShieldCheck />
					</IconTile>
					<div>
						<DialogTitle>Cookie Settings</DialogTitle>
						<DialogDescription className="mt-1 text-sm">
							Choose how we use your data
						</DialogDescription>
					</div>
				</div>

				<div className="space-y-3 px-6 py-5">
					<p className="rounded-[14px] border border-product-secondary/[0.12] bg-product-background-hero px-4 py-3 text-[13.5px] leading-relaxed text-product-foreground-accent">
						<strong className="font-semibold text-product-foreground">
							Your Rights:
						</strong>{" "}
						Withdraw consent anytime. If signed in, preferences sync with your
						account.{" "}
						<Link
							className="font-semibold text-product-foreground underline decoration-product-primary/80 decoration-2 underline-offset-[3px] hover:text-product-primary-ink"
							href="/privacy-policy"
						>
							Privacy Policy
						</Link>
					</p>

					<CategoryRow
						checked
						description="Needed for site security, login, and core features. Cannot be disabled."
						disabled
						examples="Sessions, tokens, accessibility, user details."
						switchLabel="Essential cookies always enabled"
						title="Essential Cookies"
					/>
					<CategoryRow
						checked={analyticsEnabled}
						description="Anonymous data to improve site performance and fix issues."
						examples="Google Analytics via GTM, page views, clicks, errors"
						onCheckedChange={setAnalyticsEnabled}
						switchLabel="Enable analytics cookies"
						title="Analytics"
					/>
					<CategoryRow
						checked={marketingEnabled}
						description="Personalized ads and content. May share data with partners."
						examples="Ad pixels, retargeting, A/B tests, recommendations"
						onCheckedChange={setMarketingEnabled}
						switchLabel="Enable marketing cookies"
						title="Marketing"
					/>

					<p className="px-1 text-[13px] text-product-muted">
						<strong className="font-semibold text-product-foreground-accent">
							Retention:
						</strong>{" "}
						Analytics kept 26 months, marketing 13 months. You may request
						deletion anytime.
					</p>
				</div>

				<div className="flex flex-col-reverse gap-3 border-t border-product-border px-6 py-5 sm:flex-row sm:justify-end">
					<Button onClick={onClose} type="button" variant="outline">
						Cancel
					</Button>
					<Button onClick={handleSaveSettings} type="button">
						Save Settings
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
};
