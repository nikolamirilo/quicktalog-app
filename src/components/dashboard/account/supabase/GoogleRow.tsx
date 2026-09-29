"use client";

import type { UserIdentity } from "@supabase/supabase-js";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import {
	ACCOUNT_PATH,
	type SupabaseBrowserClient,
} from "@/components/dashboard/account/supabase/types";
import { SettingsRow } from "@/components/dashboard/settings/SettingsGroup";
import { GoogleLogo } from "@/components/general/GoogleLogo";
import { Button } from "@/components/ui/button";

function GoogleBadge({ connected }: { connected: boolean }) {
	return (
		<span className="inline-flex h-[30px] flex-none items-center gap-[7px] rounded-full border border-product-border bg-product-card pl-2 pr-3 text-[13px] font-semibold text-product-foreground">
			<GoogleLogo className="size-4" />
			{connected ? "Connected" : "Not connected"}
			{connected && (
				<Check
					aria-hidden="true"
					className="size-3.5 text-product-success"
					strokeWidth={3}
				/>
			)}
		</span>
	);
}

export function GoogleRow({ supabase }: { supabase: SupabaseBrowserClient }) {
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
	const googleEmail = google?.identity_data?.email as string | undefined;

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
		<SettingsRow
			action={
				identities !== null &&
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
					<Button disabled={busy} onClick={connect} size="sm" variant="outline">
						Connect Google
					</Button>
				))
			}
			label="Google"
			value={
				identities === null ? (
					<span className="text-sm text-product-muted">Checking...</span>
				) : (
					<span className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
						<GoogleBadge connected={Boolean(google)} />
						{googleEmail && (
							<span className="text-sm font-normal text-product-foreground-accent">
								as {googleEmail}
							</span>
						)}
					</span>
				)
			}
		/>
	);
}
