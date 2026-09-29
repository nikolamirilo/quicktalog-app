"use client";

import { useState } from "react";
import { toast } from "sonner";

import { AccountSection } from "@/components/dashboard/account/supabase/AccountSection";
import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import type { SupabaseBrowserClient } from "@/components/dashboard/account/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordCard({
	supabase,
}: {
	supabase: SupabaseBrowserClient;
}) {
	const [current, setCurrent] = useState("");
	const [next, setNext] = useState("");
	const [confirm, setConfirm] = useState("");
	// Only filled when the project asks for a second factor on password change;
	// the code is emailed by `reauthenticate()`.
	const [nonce, setNonce] = useState("");
	const [nonceNeeded, setNonceNeeded] = useState(false);
	const [saving, setSaving] = useState(false);

	const reset = () => {
		setCurrent("");
		setNext("");
		setConfirm("");
		setNonce("");
		setNonceNeeded(false);
	};

	const change = async () => {
		if (next !== confirm) {
			toast.error("The two new passwords do not match.");
			return;
		}
		setSaving(true);
		try {
			const { error } = await supabase.auth.updateUser({
				current_password: current,
				password: next,
				...(nonce ? { nonce } : {}),
			});

			// "Secure password change" is on: GoTrue wants a code it emailed, on top
			// of the current password. Ask for it and keep the form as it is.
			if (
				error?.code === "reauthentication_needed" ||
				error?.code === "reauth_nonce_missing"
			) {
				setNonceNeeded(true);
				const sent = await supabase.auth.reauthenticate();
				toast.info(
					sent.error
						? describeAuthError(
								sent.error,
								"Could not send the confirmation code.",
							)
						: "We emailed you a confirmation code. Enter it below.",
				);
				return;
			}
			if (error) {
				toast.error(
					describeAuthError(error, "Could not change your password."),
				);
				return;
			}

			// The new password is in place; every other device keeps a refresh token
			// minted with the old one until it is revoked.
			const { error: signOutError } = await supabase.auth.signOut({
				scope: "others",
			});
			reset();
			toast.success(
				signOutError
					? "Password changed. Other devices may stay signed in."
					: "Password changed. Other devices were signed out.",
			);
		} finally {
			setSaving(false);
		}
	};

	return (
		<AccountSection
			description="Changing your password signs out every other device. This one stays signed in."
			footer={
				<Button
					disabled={saving || !current || next.length < 8 || !confirm}
					onClick={change}
					size="sm"
				>
					{saving ? "Changing..." : "Change password"}
				</Button>
			}
			title="Password"
		>
			<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
				<div className="flex min-w-0 flex-col gap-1.5">
					<Label htmlFor="account-current-password">Current password</Label>
					<Input
						autoComplete="current-password"
						id="account-current-password"
						onChange={(event) => setCurrent(event.target.value)}
						type="password"
						value={current}
					/>
				</div>
				<div className="flex min-w-0 flex-col gap-1.5">
					<Label htmlFor="account-new-password">New password</Label>
					<Input
						autoComplete="new-password"
						id="account-new-password"
						onChange={(event) => setNext(event.target.value)}
						type="password"
						value={next}
					/>
				</div>
				<div className="flex min-w-0 flex-col gap-1.5">
					<Label htmlFor="account-confirm-password">Repeat new password</Label>
					<Input
						autoComplete="new-password"
						id="account-confirm-password"
						onChange={(event) => setConfirm(event.target.value)}
						type="password"
						value={confirm}
					/>
				</div>
				{nonceNeeded && (
					<div className="flex min-w-0 flex-col gap-1.5 sm:col-span-3">
						<Label htmlFor="account-nonce">Emailed confirmation code</Label>
						<Input
							autoComplete="one-time-code"
							id="account-nonce"
							inputMode="numeric"
							onChange={(event) => setNonce(event.target.value.trim())}
							value={nonce}
						/>
					</div>
				)}
			</div>
		</AccountSection>
	);
}
