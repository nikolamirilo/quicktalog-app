"use client";

import type { AuthError } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

const FIELD =
	"w-full px-4 py-3 bg-product-background border-2 border-product-border rounded-xl text-product-foreground placeholder-product-foreground-accent/60 focus:outline-none focus:border-product-primary focus:bg-product-background-hover transition-all duration-300";
const LABEL = "block text-sm font-semibold text-product-foreground mb-2";

function message(error: AuthError): string {
	switch (error.code) {
		case "weak_password":
			return "That password is too weak. Use a longer one.";
		case "same_password":
			return "That is already your password. Choose a different one.";
		case "reauthentication_needed":
			return "This recovery link is no longer fresh enough. Request a new one and try again.";
		case "over_request_rate_limit":
			return "Too many attempts. Wait a few minutes and try again.";
		default:
			return error.message || "Something went wrong. Try again.";
	}
}

/**
 * Sets a new password for the recovery session the confirm interstitial just
 * created. `updateUser` is not captcha-gated, so there is no widget here.
 */
export default function UpdatePasswordForm() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [confirmation, setConfirmation] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (password !== confirmation) {
			setError("The two passwords do not match.");
			return;
		}
		setBusy(true);
		setError(null);

		const supabase = createClient();
		const { error: updateError } = await supabase.auth.updateUser({ password });
		if (updateError) {
			setBusy(false);
			setError(message(updateError));
			return;
		}

		// A password change ends every other session: whoever knew the old
		// password (or held a stolen refresh token) is signed out. This browser
		// keeps its own session.
		await supabase.auth.signOut({ scope: "others" });
		router.replace("/admin/dashboard");
		router.refresh();
	};

	return (
		<form className="space-y-4" onSubmit={submit}>
			<h1 className="text-2xl font-semibold text-product-foreground">
				Choose a new password
			</h1>
			<p className="text-sm text-product-foreground-accent">
				You will stay signed in here. Every other device is signed out.
			</p>
			<div>
				<label className={LABEL} htmlFor="password">
					New password
				</label>
				<input
					autoComplete="new-password"
					className={FIELD}
					id="password"
					minLength={8}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="At least 8 characters"
					required
					type="password"
					value={password}
				/>
			</div>
			<div>
				<label className={LABEL} htmlFor="password-confirmation">
					Repeat new password
				</label>
				<input
					autoComplete="new-password"
					className={FIELD}
					id="password-confirmation"
					minLength={8}
					onChange={(e) => setConfirmation(e.target.value)}
					placeholder="At least 8 characters"
					required
					type="password"
					value={confirmation}
				/>
			</div>
			{error ? (
				<p className="text-sm text-red-500" role="alert">
					{error}
				</p>
			) : null}
			<Button className="w-full" disabled={busy} type="submit">
				{busy ? "Saving…" : "Save password"}
			</Button>
		</form>
	);
}
