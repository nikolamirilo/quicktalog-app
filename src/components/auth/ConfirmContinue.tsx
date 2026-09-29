"use client";

import { AlertTriangle, ArrowRight, Check, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type ConfirmResult, confirmEmailToken } from "@/actions/auth-confirm";
import {
	AuthCard,
	AuthEmphasis,
	AuthHeader,
} from "@/components/auth/common/AuthCard";
import { AuthDone } from "@/components/auth/common/AuthDone";
import { AuthFine, AuthSwitch } from "@/components/auth/common/AuthFine";
import { CONFIRM_MESSAGES } from "@/components/auth/common/authMessages";
import { SubmitButton } from "@/components/auth/common/SubmitButton";
import { safeNext } from "@/lib/auth/redirects";
import { createClient } from "@/utils/supabase/client";
import { textLinkClass } from "@/components/general/TextLink";

/** Under the card while the link has not worked yet. */
function RequestNewLink() {
	return (
		<AuthSwitch>
			Link not working? Links can be used once and expire.{" "}
			<Link className={textLinkClass} href="/auth">
				Request a new one
			</Link>
		</AuthSwitch>
	);
}

/**
 * The interstitial's only interactive part. The token is spent when the user
 * presses the button, and the account it belongs to is shown before this
 * browser follows it anywhere.
 */
export function ConfirmContinue() {
	const router = useRouter();
	const [busy, setBusy] = useState(false);
	const [result, setResult] = useState<ConfirmResult | null>(null);
	// Set once the user signs out from the error card, so the confirm view that
	// replaces it takes focus; on first load the page keeps its normal focus.
	const [returned, setReturned] = useState(false);

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
		setReturned(true);
		setResult(null);
		setBusy(false);
	};

	if (result?.ok) {
		return (
			<AuthCard key="confirmed">
				<AuthDone
					icon={<Check />}
					subtitle={
						<>
							You are now signed in as{" "}
							<AuthEmphasis>{result.email ?? "your account"}</AuthEmphasis>.
							Continue only if that is you.
						</>
					}
					title="Email confirmed"
				>
					<SubmitButton
						className="group mt-[22px] h-12"
						onClick={() => {
							// verifyOtp ran on the server, so the browser client never saw an
							// auth event and still believes it is signed out; only a document
							// load makes it read the new cookie.
							window.location.assign(safeNext(result.next));
						}}
						type="button"
					>
						Continue
						<ArrowRight
							aria-hidden="true"
							className="transition-transform group-hover:translate-x-[3px]"
						/>
					</SubmitButton>
				</AuthDone>
			</AuthCard>
		);
	}

	if (result && result.ok === false) {
		const message = CONFIRM_MESSAGES[result.code];
		return (
			<>
				<AuthCard key="failed">
					<AuthHeader
						badge={<AlertTriangle />}
						focusOnMount
						subtitle={message.body}
						title={message.title}
					/>
					<div className="mt-6">
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
					</div>
				</AuthCard>
				{result.code === "signed_in" ? null : <RequestNewLink />}
			</>
		);
	}

	return (
		<>
			<AuthCard key="confirm">
				<AuthHeader
					badge={<ShieldCheck />}
					focusOnMount={returned}
					subtitle="Press the button to finish what you started by email. The link is used once and only from this browser."
					title="Confirm it was you"
				/>
				<div className="mt-6">
					<SubmitButton
						busy={busy}
						busyLabel="Confirming…"
						onClick={confirm}
						type="button"
					>
						Confirm and continue
					</SubmitButton>
				</div>
				<AuthFine>
					Didn't request this? You can close this page. Nothing happens until
					you press the button.
				</AuthFine>
			</AuthCard>
			<RequestNewLink />
		</>
	);
}
