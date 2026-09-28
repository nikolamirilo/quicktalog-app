"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
	type ConfirmResult,
	confirmEmailToken,
} from "@/app/auth/confirm/continue/actions";
import AuthCard from "@/components/auth/common/AuthCard";
import { CONFIRM_MESSAGES } from "@/components/auth/common/authMessages";
import SubmitButton from "@/components/auth/common/SubmitButton";
import { safeNext } from "@/lib/auth/redirects";
import { createClient } from "@/utils/supabase/client";

/**
 * The interstitial's only interactive part. The token is spent when the user
 * presses the button, and the account it belongs to is shown before this
 * browser follows it anywhere.
 */
export default function ConfirmContinue() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [result, setResult] = useState<ConfirmResult | null>(null);

	const confirm = async () => {
		setBusy(true);
		setResult(await confirmEmailToken());
		setBusy(false);
	};

	const signOut = async () => {
		setBusy(true);
		// Local scope only: signing out everywhere is not what a user who clicked
		// a link on one device asked for.
		await createClient().auth.signOut({ scope: "local" });
		router.refresh();
		setResult(null);
		setBusy(false);
	};

	if (result?.ok) {
		return (
			<AuthCard
				subtitle={
					<>
						You are now signed in as{" "}
						<strong className="font-medium text-product-foreground">
							{result.email ?? "your account"}
						</strong>
						. Continue only if that is you.
					</>
				}
				title="Email confirmed"
			>
				<SubmitButton
					onClick={() => {
						// verifyOtp ran on the server, so the browser client never saw an
						// auth event and still believes it is signed out; only a document
						// load makes it read the new cookie.
						window.location.assign(safeNext(result.next));
					}}
					type="button"
				>
					Continue
				</SubmitButton>
			</AuthCard>
		);
	}

	if (result && result.ok === false) {
		const message = CONFIRM_MESSAGES[result.code];
		return (
			<AuthCard subtitle={message.body} title={message.title}>
				{result.code === "signed_in" ? (
					<SubmitButton
						busy={busy}
						onClick={signOut}
						type="button"
						variant="outline"
					>
						Sign out of this browser
					</SubmitButton>
				) : (
					<SubmitButton
						onClick={() => router.push("/auth")}
						type="button"
						variant="outline"
					>
						Back to sign in
					</SubmitButton>
				)}
			</AuthCard>
		);
	}

	return (
		<AuthCard
			subtitle="Press the button to finish what you started by email. The link is used once and only from this browser."
			title="Confirm it was you"
		>
			<SubmitButton
				busy={busy}
				busyLabel="Confirming…"
				onClick={confirm}
				type="button"
			>
				Confirm and continue
			</SubmitButton>
		</AuthCard>
	);
}
