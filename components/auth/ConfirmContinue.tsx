"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	type ConfirmResult,
	confirmEmailToken,
} from "@/app/auth/confirm/continue/actions";
import { safeNext } from "@/lib/auth/redirects";
import { createClient } from "@/utils/supabase/client";

const MESSAGES: Record<
	Extract<ConfirmResult, { ok: false }>["code"],
	{ title: string; body: string }
> = {
	rate_limited: {
		title: "Too many attempts",
		body: "Wait a few minutes and open the link again.",
	},
	signed_in: {
		title: "You are already signed in",
		body: "Sign out of this account first, then open the link from your email again. Confirming a link while signed in could attach the wrong account to this browser.",
	},
	expired: {
		title: "This link has expired",
		body: "Confirmation links are valid for 10 minutes after you open them. Request a new one and try again.",
	},
	link: {
		title: "This link did not work",
		body: "It may already have been used or it has expired. Request a new one and try again.",
	},
};

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
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold text-product-foreground">
					Email confirmed
				</h1>
				<p className="text-sm text-product-foreground-accent">
					You are now signed in as{" "}
					<strong className="text-product-foreground">
						{result.email ?? "your account"}
					</strong>
					. Continue only if that is you.
				</p>
				<Button
					className="w-full"
					onClick={() => {
						const next = safeNext(result.next);
						router.replace(next);
						router.refresh();
					}}
					type="button"
				>
					Continue
				</Button>
			</div>
		);
	}

	if (result && result.ok === false) {
		const message = MESSAGES[result.code];
		return (
			<div className="space-y-4">
				<h1 className="text-2xl font-semibold text-product-foreground">
					{message.title}
				</h1>
				<p className="text-sm text-product-foreground-accent">{message.body}</p>
				{result.code === "signed_in" ? (
					<Button
						className="w-full"
						disabled={busy}
						onClick={signOut}
						type="button"
						variant="outline"
					>
						Sign out of this browser
					</Button>
				) : (
					<Button
						className="w-full"
						onClick={() => router.push("/auth")}
						type="button"
						variant="outline"
					>
						Back to sign in
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-semibold text-product-foreground">
				Confirm it was you
			</h1>
			<p className="text-sm text-product-foreground-accent">
				Press the button to finish what you started by email. The link is used
				once and only from this browser.
			</p>
			<Button
				className="w-full"
				disabled={busy}
				onClick={confirm}
				type="button"
			>
				{busy ? "Confirming…" : "Confirm and continue"}
			</Button>
		</div>
	);
}
