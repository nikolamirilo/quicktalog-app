"use client";

import { lazy, Suspense, useState } from "react";
import { FiSettings } from "react-icons/fi";
import { LuCookie } from "react-icons/lu";
import { MdLogout } from "react-icons/md";
import CookiePreferencesModal from "@/components/modals/CookiePreferencesModal";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { AUTH_PROVIDER } from "@/lib/auth/provider";

// The account forms are provider-specific and heavy; everything above them is
// not, so they load separately. `AUTH_PROVIDER` is inlined at build time, so
// only the live provider's forms end up in the bundle.
const Account = lazy(() =>
	AUTH_PROVIDER === "supabase"
		? import("./account/SupabaseAccount")
		: import("./account/ClerkAccount"),
);

const Settings = () => {
	const [isCookieSettingsOpen, setIsCookieSettingsOpen] = useState(false);
	const { signOut } = useAuth();

	return (
		<div className="max-w-5xl space-y-4 relative">
			<CookiePreferencesModal
				isOpen={isCookieSettingsOpen}
				onClose={() => setIsCookieSettingsOpen(false)}
			/>
			<h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 text-product-foreground flex items-center gap-2 font-heading">
				<FiSettings className="text-product-primary w-5 h-5 sm:w-6 sm:h-6" />{" "}
				Settings
			</h2>
			<div className="flex flex-col max-w-[300px] mx-auto md:mx-0 md:flex-row gap-3 my-4">
				<Button
					aria-label="Manage cookie preferences"
					onClick={() => setIsCookieSettingsOpen(true)}
				>
					<LuCookie className="w-4 h-4" />
					Manage Cookie Preferences
				</Button>
				<Button onClick={() => signOut()} variant="destructive">
					<MdLogout /> Sign Out
				</Button>
			</div>
			<Suspense
				fallback={
					<div className="h-32 w-full bg-product-background-hover animate-pulse rounded-xl" />
				}
			>
				<Account />
			</Suspense>
		</div>
	);
};

export default Settings;
