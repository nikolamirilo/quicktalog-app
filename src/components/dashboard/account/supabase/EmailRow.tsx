"use client";

import { useState } from "react";
import { toast } from "sonner";

import { describeAuthError } from "@/components/dashboard/account/supabase/authErrors";
import type { SupabaseBrowserClient } from "@/components/dashboard/account/supabase/types";
import {
	SettingsEditorActions,
	SettingsHint,
	SettingsRow,
} from "@/components/dashboard/settings/SettingsGroup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EmailRow({
	currentEmail,
	supabase,
	open,
	onOpenChange,
}: {
	currentEmail: string | null;
	supabase: SupabaseBrowserClient;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const [email, setEmail] = useState("");
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);

	const close = () => {
		setEmail("");
		onOpenChange(false);
	};

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
			close();
			toast.success("Confirmation links sent.");
		} finally {
			setSending(false);
		}
	};

	return (
		<SettingsRow
			editLabel="Change"
			label="Email"
			onOpenChange={onOpenChange}
			open={open}
			value={
				<>
					{currentEmail ?? "Unknown"}
					{sent && (
						<SettingsHint>
							Check both inboxes. The change is applied only after both links
							are confirmed.
						</SettingsHint>
					)}
				</>
			}
		>
			<p className="text-sm text-product-foreground-accent">
				Current address:{" "}
				<b className="font-semibold text-product-foreground [overflow-wrap:anywhere]">
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
			<p className="text-[13px] text-product-muted">
				We send a link to both addresses. Nothing changes until both links are
				opened.
			</p>
			<SettingsEditorActions onCancel={close}>
				<Button
					disabled={sending || !email.includes("@")}
					onClick={requestChange}
					size="sm"
				>
					{sending ? "Sending..." : "Send confirmation links"}
				</Button>
			</SettingsEditorActions>
		</SettingsRow>
	);
}
