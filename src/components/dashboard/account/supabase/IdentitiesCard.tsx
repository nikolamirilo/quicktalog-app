"use client";

import type { UserIdentity } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AccountSection } from "@/components/dashboard/account/supabase/AccountSection";
import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import {
	ACCOUNT_PATH,
	type SupabaseBrowserClient,
} from "@/components/dashboard/account/supabase/types";
import { Button } from "@/components/ui/button";

export function IdentitiesCard({
	supabase,
}: {
	supabase: SupabaseBrowserClient;
}) {
	const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
	const [busy, setBusy] = useState(false);

	const load = async () => {
		const { data, error } = await supabase.auth.getUserIdentities();
		setIdentities(error ? [] : (data?.identities ?? []));
	};

	// Once, on mount: the client is stable for the life of the component.
	useEffect(() => {
		load();
	}, []);

	const google = identities?.find((identity) => identity.provider === "google");

	const connect = async () => {
		setBusy(true);
		try {
			const next = encodeURIComponent(ACCOUNT_PATH);
			const { error } = await supabase.auth.linkIdentity({
				provider: "google",
				options: {
					redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
				},
			});
			if (error)
				toast.error(describeAuthError(error, "Could not connect Google."));
		} finally {
			setBusy(false);
		}
	};

	const disconnect = async (identity: UserIdentity) => {
		setBusy(true);
		try {
			const { error } = await supabase.auth.unlinkIdentity(identity);
			if (error) {
				toast.error(describeAuthError(error, "Could not disconnect Google."));
				return;
			}
			await load();
			toast.success("Google was disconnected.");
		} finally {
			setBusy(false);
		}
	};

	return (
		<AccountSection
			description="Sign in with Google instead of a password."
			title="Connected accounts"
		>
			<div className="flex flex-wrap items-center gap-3 rounded-2xl border border-product-border p-3">
				<span
					aria-hidden="true"
					className="grid h-[38px] w-[38px] flex-none place-items-center rounded-[11px] bg-product-background-hero font-product-heading text-base font-extrabold text-product-secondary"
				>
					G
				</span>
				<div className="min-w-0 flex-[1_1_140px]">
					<b className="block text-[14.5px]">Google</b>
					<small className="text-[13px] text-product-muted [overflow-wrap:anywhere]">
						{identities === null
							? "checking..."
							: google
								? `connected${google.identity_data?.email ? ` as ${google.identity_data.email}` : ""}`
								: "not connected"}
					</small>
				</div>
				{identities !== null &&
					(google ? (
						<Button
							// The last identity cannot be removed; GoTrue refuses it too.
							disabled={busy || identities.length < 2}
							onClick={() => disconnect(google)}
							size="sm"
							variant="outline"
						>
							Disconnect
						</Button>
					) : (
						<Button
							disabled={busy}
							onClick={connect}
							size="sm"
							variant="outline"
						>
							Connect Google
						</Button>
					))}
			</div>
		</AccountSection>
	);
}
