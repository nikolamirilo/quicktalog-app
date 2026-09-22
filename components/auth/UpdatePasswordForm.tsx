"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import AuthCard from "@/components/auth/common/AuthCard";
import AuthField from "@/components/auth/common/AuthField";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import AuthNotice from "@/components/auth/common/AuthNotice";
import SubmitButton from "@/components/auth/common/SubmitButton";
import { createClient } from "@/utils/supabase/client";

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
			setError(authErrorMessage(updateError));
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
		<AuthCard
			subtitle="You will stay signed in here. Every other device is signed out."
			title="Choose a new password"
		>
			<form className="space-y-4" onSubmit={submit}>
				<AuthField
					autoComplete="new-password"
					id="password"
					label="New password"
					minLength={8}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="At least 8 characters"
					required
					type="password"
					value={password}
				/>
				<AuthField
					autoComplete="new-password"
					id="password-confirmation"
					label="Repeat new password"
					minLength={8}
					onChange={(e) => setConfirmation(e.target.value)}
					placeholder="At least 8 characters"
					required
					type="password"
					value={confirmation}
				/>
				<AuthNotice message={error} />
				<SubmitButton busy={busy} busyLabel="Saving…" type="submit">
					Save password
				</SubmitButton>
			</form>
		</AuthCard>
	);
}
