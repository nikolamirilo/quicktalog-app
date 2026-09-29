"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";

import { AccountSection } from "@/components/dashboard/account/supabase/AccountSection";
import { Button } from "@/components/ui/button";

export function SessionsCard({
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
		<AccountSection
			description="Signing out everywhere ends every session on every device, including this one."
			title="Sessions"
		>
			<div className="flex flex-wrap gap-2">
				<Button
					disabled={busy}
					onClick={() => run(onSignOut)}
					size="sm"
					variant="outline"
				>
					<LogOut aria-hidden="true" /> Sign out
				</Button>
				<Button
					disabled={busy}
					onClick={() => run(onSignOutEverywhere)}
					size="sm"
					variant="destructive"
				>
					<LogOut aria-hidden="true" /> Sign out everywhere
				</Button>
			</div>
		</AccountSection>
	);
}
