"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
	AccountHint,
	AccountSection,
} from "@/components/dashboard/account/supabase/AccountSection";
import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import type { SupabaseBrowserClient } from "@/components/dashboard/account/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailCard({
	currentEmail,
	supabase,
}: {
	currentEmail: string | null;
	supabase: SupabaseBrowserClient;
}) {
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	const requestChange = async () => {
		setSending(true);
		try {
			const { error } = await supabase.auth.updateUser(
				{ email: email.trim().toLowerCase() },
				// Exactly the origin, with no path and no query: the email template
				// appends its own `/auth/confirm?token_hash=...` to it.
				{ emailRedirectTo: window.location.origin },
			);
			if (error) {
				toast.error(
					describeAuthError(error, "Could not start the email change."),
				);
				return;
			}
			setSent(true);
			setEmail("");
			toast.success("Confirmation links sent.");
		} finally {
			setSending(false);
		}
	};

	return (
		<AccountSection
			description="Changing your email takes two confirmations, one from the current address and one from the new one. Nothing changes until both links are opened."
			footer={
				<Button
					disabled={sending || !email.includes("@")}
					onClick={requestChange}
					size="sm"
				>
					{sending ? "Sending..." : "Send confirmation links"}
				</Button>
			}
			title="Email address"
		>
			<p className="text-[13.5px] text-product-foreground-accent">
				Current address:{" "}
				<b className="font-semibold text-product-foreground">
					{currentEmail ?? "unknown"}
				</b>
			</p>
			<div className="flex flex-col gap-1.5">
				<Label htmlFor="account-new-email">New email address</Label>
				<Input
					autoComplete="email"
					id="account-new-email"
					onChange={(event) => setEmail(event.target.value)}
					placeholder="name@company.com"
					type="email"
					value={email}
				/>
			</div>
			{sent && (
				<AccountHint>
					Check both inboxes. The change is applied only after both links are
					confirmed.
				</AccountHint>
			)}
		</AccountSection>
	);
}
