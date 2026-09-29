"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { SettingsRow } from "@/components/dashboard/settings/SettingsGroup";
import { Button } from "@/components/ui/button";

export function SessionsRow({
	onSignOut,
	onSignOutEverywhere,
}: {
	onSignOut: () => Promise<void>;
	onSignOutEverywhere: () => Promise<void>;
}) {
	const [busy, setBusy] = useState(false);

	const run = async (action: () => Promise<void>) => {
		setBusy(true);
		try {
			await action();
		} finally {
			setBusy(false);
		}
	};

	return (
		<SettingsRow
			action={
				<>
					<Button
						disabled={busy}
						onClick={() => run(onSignOut)}
						size="sm"
						variant="outline"
					>
						<LogOut aria-hidden="true" /> Sign out
					</Button>
					<Button
						className="border-product-error/40 text-product-error hover:bg-product-error-soft"
						disabled={busy}
						onClick={() => run(onSignOutEverywhere)}
						size="sm"
						variant="outline"
					>
						Sign out everywhere
					</Button>
				</>
			}
			description="Signing out everywhere ends every session, this one included."
			label="Sessions"
		/>
	);
}
