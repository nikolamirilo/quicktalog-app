"use client";

import { UserProfile } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getAccountChangesPaused } from "@/actions/ops";

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
export default function ClerkAccount() {
	const [paused, setPaused] = useState(false);

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
		<div className="space-y-6">
			{paused && (
				<div
					className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
					role="status"
				>
					<p className="font-semibold">Account changes are paused</p>
					<p className="mt-1 text-sm">
						We are moving Quicktalog to a new sign-in system. Until that is
						done, changes to your name, email address or password will not be
						carried over, so please make them after the move.
					</p>
					<p className="mt-2 text-sm">
						Signing in and everything else in Quicktalog work as usual. You will
						be asked to sign in once when the move is complete, with the same
						email address and password.
					</p>
				</div>
			)}
			<UserProfile />
		</div>
	);
}
