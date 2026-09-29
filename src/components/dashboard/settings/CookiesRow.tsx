"use client";

import { useState } from "react";

import { SettingsRow } from "@/components/dashboard/settings/SettingsGroup";
import { CookiePreferencesModal } from "@/components/modals/CookiePreferencesModal";
import { Button } from "@/components/ui/button";

export function CookiesRow() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<CookiePreferencesModal isOpen={open} onClose={() => setOpen(false)} />
			<SettingsRow
				action={
					<Button onClick={() => setOpen(true)} size="sm" variant="outline">
						Manage
					</Button>
				}
				description="Choose which optional cookies we may use."
				label="Cookies"
			/>
		</>
	);
}
