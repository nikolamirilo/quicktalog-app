"use client";

import { FileCheck2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { acceptLegalTerms } from "@/actions/consent";
import { AuthCard, AuthHeader } from "@/components/auth/common/AuthCard";
import { AuthFine } from "@/components/auth/common/AuthFine";
import { AuthNotice } from "@/components/auth/common/AuthNotice";
import { SubmitButton } from "@/components/auth/common/SubmitButton";
import { textLinkClass } from "@/components/general/TextLink";
import { Checkbox } from "@/components/ui/checkbox";
import { type LegalDocumentKey, legalDocuments } from "@/constants/legal";
import { useAuth } from "@/context/AuthContext";

const NOTHING_CHECKED = Object.fromEntries(
	legalDocuments.map(({ key }) => [key, false]),
) as Record<LegalDocumentKey, boolean>;

/**
 * The consent gate. Everyone who did not tick the sign-up checkbox - every
 * Google sign-up, every imported account - accepts here instead, and the answer
 * is stored on their row against the version they were shown.
 *
 * All three documents or none: `private.record_consents` writes them as one
 * set, so there is no partial state the button could usefully submit.
 */
export function ConsentForm({
	next,
	updated,
	version,
}: {
	next: string;
	/** True when they accepted an earlier version: the ask is different. */
	updated: boolean;
	/** The version this screen is showing, checked again by the database. */
	version: string;
}) {
	const router = useRouter();
	const { signOut } = useAuth();
	const [accepted, setAccepted] = useState(NOTHING_CHECKED);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	const all = legalDocuments.every(({ key }) => accepted[key]);

	const submit = async (event: FormEvent) => {
		event.preventDefault();
		if (!all) return;
		setBusy(true);
		setError(null);

		const result = await acceptLegalTerms(version);
		if (result.accepted) {
			router.replace(next);
			router.refresh();
			return;
		}

		setBusy(false);
		setError(
			result.stale
				? "Our terms changed while this page was open. Reload the page to see the current version."
				: "We could not record that just now. Please try again.",
		);
	};

	const declineAndSignOut = async () => {
		setBusy(true);
		await signOut();
		router.replace("/");
	};

	return (
		<AuthCard>
			<AuthHeader
				badge={<FileCheck2 />}
				subtitle={
					updated
						? "We have updated the documents below since you last accepted them. Please review and accept to carry on using your account."
						: "One last step before you continue. Accepting these is required to use your Quicktalog account."
				}
				title={updated ? "Our terms have changed" : "Review and accept"}
			/>
			<form className="mt-6 grid grid-cols-1 gap-[18px]" onSubmit={submit}>
				<AuthNotice message={error} />
				<div className="grid gap-2">
					{legalDocuments.map(({ key, href, name }) => (
						<div
							className="flex items-start gap-3 rounded-[14px] border border-product-border bg-product-background px-4 py-3"
							key={key}
						>
							<Checkbox
								checked={accepted[key]}
								className="mt-0.5"
								id={`consent-${key}`}
								onCheckedChange={(checked) =>
									setAccepted((previous) => ({
										...previous,
										[key]: checked === true,
									}))
								}
							/>
							<label
								className="cursor-pointer text-[14.5px] leading-normal text-product-foreground-accent"
								htmlFor={`consent-${key}`}
							>
								I agree to the{" "}
								<Link className={textLinkClass} href={href} target="_blank">
									{name}
								</Link>
							</label>
						</div>
					))}
				</div>
				<SubmitButton
					busy={busy}
					busyLabel="Saving…"
					className="mt-1"
					disabled={!all}
					type="submit"
				>
					Accept and continue
				</SubmitButton>
			</form>
			<AuthFine>
				Would rather not?{" "}
				<button
					className={textLinkClass}
					disabled={busy}
					onClick={declineAndSignOut}
					type="button"
				>
					Decline and sign out
				</button>
			</AuthFine>
			<AuthFine className="mt-2">
				You can delete your account and its data from your account settings at
				any time.
			</AuthFine>
		</AuthCard>
	);
}
