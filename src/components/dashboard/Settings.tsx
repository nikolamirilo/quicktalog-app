"use client";

import { Cookie, LogOut, Settings as SettingsIcon } from "lucide-react";
import { lazy, Suspense, useState } from "react";

import { AppTitle } from "@/components/dashboard/common/AppHeadings";
import { CookiePreferencesModal } from "@/components/modals/CookiePreferencesModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

// The account forms are provider-specific and heavy; everything above them is
// not, so they load separately. `AUTH_PROVIDER` is inlined at build time, so
// only the live provider's forms end up in the bundle.
const Account = lazy(() =>
	AUTH_PROVIDER === "supabase"
		? import("@/components/dashboard/account/supabase/SupabaseAccount").then(
				(m) => ({ default: m.SupabaseAccount }),
			)
		: import("@/components/dashboard/account/ClerkAccount").then((m) => ({
				default: m.ClerkAccount,
			})),
);

export const Settings = () => {
	const [isCookieSettingsOpen, setIsCookieSettingsOpen] = useState(false);
	const { signOut } = useAuth();

	return (
		<div>
			<CookiePreferencesModal
				isOpen={isCookieSettingsOpen}
				onClose={() => setIsCookieSettingsOpen(false)}
			/>
			<AppTitle icon={<SettingsIcon />}>Settings</AppTitle>
			<div className="-mt-1 mb-5 flex flex-wrap gap-2">
				<Button
					onClick={() => setIsCookieSettingsOpen(true)}
					size="sm"
					variant="outline"
				>
					<Cookie aria-hidden="true" />
					Manage Cookie Preferences
				</Button>
				<Button onClick={() => signOut()} size="sm" variant="destructive">
					<LogOut aria-hidden="true" />
					Sign Out
				</Button>
			</div>
			<Suspense
				fallback={
					<div className="h-32 w-full animate-pulse rounded-product-card bg-product-background-hero" />
				}
			>
				<Account />
			</Suspense>
		</div>
	);
};
