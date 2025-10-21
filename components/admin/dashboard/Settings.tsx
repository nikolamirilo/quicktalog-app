// components/Settings.tsx
"use client";

import { SignOutButton, UserProfile } from "@clerk/nextjs";
import { useState } from "react";
import { FiSettings } from "react-icons/fi";
import { LuCookie } from "react-icons/lu";
import { MdLogout } from "react-icons/md";
import CookiePreferencesModal from "@/components/common/CookiePreferencesModal";
import { Button } from "@/components/ui/button";

const Settings = () => {
	const [isCookieSettingsOpen, setIsCookieSettingsOpen] = useState(false);

	return (
		<div className="max-w-5xl space-y-6 relative">
			<CookiePreferencesModal
				isOpen={isCookieSettingsOpen}
				onClose={() => setIsCookieSettingsOpen(false)}
			/>
			<h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-4 sm:mb-6 text-product-foreground flex items-center gap-2 sm:gap-3 font-heading">
				<FiSettings className="text-product-primary w-6 h-6 sm:w-8 sm:h-8" />{" "}
				Settings
			</h2>
			<div className="flex flex-col max-w-[300px] mx-auto md:mx-0 md:flex-row gap-5 my-8">
				<Button
					aria-label="Manage cookie preferences"
					onClick={() => setIsCookieSettingsOpen(true)}
				>
					<LuCookie className="w-4 h-4" />
					Manage Cookie Preferences
				</Button>
				<SignOutButton component="div" redirectUrl="/">
					<Button variant="destructive">
						<MdLogout /> Sign Out
					</Button>
				</SignOutButton>
			</div>
			<UserProfile />
		</div>
	);
};

export default Settings;
