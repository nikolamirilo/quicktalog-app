"use client";

import { UserProfile } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import { getAccountChangesPaused } from "@/actions/ops";
import { CookiesRow } from "@/components/dashboard/settings/CookiesRow";
import {
	SettingsGroup,
	SettingsRow,
} from "@/components/dashboard/settings/SettingsGroup";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

/**
 * The provider-specific half of the settings page. Clerk ships a whole account
 * UI as one component; Phase 2 replaces this file with Quicktalog's own profile,
 * email, password and identity forms, and nothing around it has to change.
 *
 * From T-3 it carries the cutover freeze notice (plan 3.4). Clerk's own settings
 * cannot reliably hide its forms, so the notice sits above them: a change made
 * after the Clerk export would be lost, because the export is what the import
 * carries across.
 */
export function ClerkAccount() {
	const [paused, setPaused] = useState(false);
	const { signOut } = useAuth();

	useEffect(() => {
		let active = true;
		getAccountChangesPaused()
			.then((value) => {
				if (active) setPaused(value);
			})
			// A flag that cannot be read is not a reason to break the page; the
			// notice simply does not appear.
			.catch(() => {});
		return () => {
			active = false;
		};
	}, []);

	return (
		<div className="flex min-w-0 flex-col gap-4">
			{paused && (
				<div
					className="rounded-product-card border border-product-primary/50 bg-product-primary-soft p-4 text-product-foreground"
					role="status"
				>
					<p className="font-product-heading font-bold">
						Account changes are paused
					</p>
					<p className="mt-1 text-sm text-product-foreground-accent">
						We are moving Quicktalog to a new sign-in system. Until that is
						done, changes to your name, email address or password will not be
						carried over, so please make them after the move.
					</p>
					<p className="mt-2 text-sm text-product-foreground-accent">
						Signing in and everything else in Quicktalog work as usual. You will
						be asked to sign in once when the move is complete, with the same
						email address and password.
					</p>
				</div>
			)}
			<div className="max-w-full overflow-x-auto">
				<UserProfile />
			</div>
			<SettingsGroup title="Privacy and sessions">
				<CookiesRow />
				<SettingsRow
					action={
						<Button onClick={() => signOut()} size="sm" variant="outline">
							<LogOut aria-hidden="true" /> Sign out
						</Button>
					}
					description="Sign out of Quicktalog on this device."
					label="Sessions"
				/>
			</SettingsGroup>
		</div>
	);
}
