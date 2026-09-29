"use client";

import { LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuthCard, AuthHeader } from "@/components/auth/common/AuthCard";
import { AuthField } from "@/components/auth/common/AuthField";
import { authErrorMessage } from "@/components/auth/common/authMessages";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { SubmitButton } from "@/components/auth/common/SubmitButton";
import { createClient } from "@/utils/supabase/client";

/**
 * Sets a new password for the recovery session the confirm interstitial just
 * created. `updateUser` is not captcha-gated, so there is no widget here.
 */
export function UpdatePasswordForm() {
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
		<AuthCard>
			<AuthHeader
				badge={<LockKeyhole />}
				subtitle="You will stay signed in here. Every other device is signed out."
				title="Choose a new password"
			/>
			<form className="mt-6 grid gap-[18px]" onSubmit={submit}>
				<AuthNotice message={error} />
				<AuthField
					autoComplete="new-password"
					hint="Use at least 8 characters. Longer is stronger."
					id="password"
					label="New password"
					meter
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
					placeholder="Type it again"
					required
					type="password"
					value={confirmation}
				/>
				<SubmitButton
					busy={busy}
					busyLabel="Saving…"
					className="mt-1"
					type="submit"
				>
					Save password
				</SubmitButton>
			</form>
		</AuthCard>
	);
}
