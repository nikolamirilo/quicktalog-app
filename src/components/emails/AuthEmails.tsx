import { EmailShell } from "./EmailShell";
import {
	Badge,
	Buttons,
	Chips,
	DetailRows,
	FallbackLink,
	Lead,
	SafetyNote,
	Title,
} from "./parts";

/**
 * Supabase Auth emails. They are rendered once into supabase/templates/*.html by
 * scripts/emails/render-auth-templates.ts, with GoTrue placeholders as the props.
 */
type AuthEmailProps = {
	/** Origin for the logo and footer links. */
	siteUrl: string;
	/** The app's /auth/confirm interstitial, never GoTrue's verify endpoint. */
	confirmUrl: string;
};

export function ConfirmationEmail({ siteUrl, confirmUrl }: AuthEmailProps) {
	return (
		<EmailShell
			preview="Confirm your email to finish setting up your Quicktalog account. The link expires in 24 hours."
			siteUrl={siteUrl}
		>
			<Badge>Confirm your email</Badge>
			<Title>Confirm your email to finish signing up</Title>
			<Lead>
				You're one step away from your dashboard. Confirming this address lets
				you publish catalogues and get back into your account if you ever lose
				your password.
			</Lead>
			<Buttons buttons={[{ label: "Confirm email", href: confirmUrl }]} />
			<Chips items={["Works once", "Expires in 24 hours"]} />
			<FallbackLink href={confirmUrl} />
			<SafetyNote heading="Didn't sign up?">
				Someone may have typed your address by mistake. You can safely ignore
				this email.
			</SafetyNote>
		</EmailShell>
	);
}

export function RecoveryEmail({ siteUrl, confirmUrl }: AuthEmailProps) {
	return (
		<EmailShell
			preview="Choose a new password for your Quicktalog account. The link expires in one hour."
			siteUrl={siteUrl}
		>
			<Badge>Password reset</Badge>
			<Title>Reset your password</Title>
			<Lead>
				We got a request to reset the password for your Quicktalog account.
				Press the button to choose a new one.
			</Lead>
			<Buttons
				buttons={[{ label: "Choose a new password", href: confirmUrl }]}
			/>
			<Chips items={["Works once", "Expires in 1 hour"]} />
			<FallbackLink href={confirmUrl} />
			<SafetyNote heading="Didn't ask for this?">
				Ignore this email. Your current password keeps working and nothing
				changes.
			</SafetyNote>
		</EmailShell>
	);
}

export function EmailChangeEmail({
	siteUrl,
	confirmUrl,
	currentEmail,
	newEmail,
}: AuthEmailProps & { currentEmail: string; newEmail: string }) {
	return (
		<EmailShell
			preview="Confirm the change from your current address to your new one."
			siteUrl={siteUrl}
		>
			<Badge>Email change</Badge>
			<Title>Confirm your new email address</Title>
			<Lead>
				You asked to change the email address on your Quicktalog account. The
				change takes effect once both addresses are confirmed.
			</Lead>
			<DetailRows
				rows={[
					{ label: "Current address", value: currentEmail },
					{ label: "New address", value: newEmail },
				]}
			/>
			<Buttons
				buttons={[{ label: "Confirm email change", href: confirmUrl }]}
			/>
			<FallbackLink href={confirmUrl} />
			<SafetyNote heading="Didn't ask for this?">
				Ignore this email and your address stays the same. If you think someone
				else made the request, change your password.
			</SafetyNote>
		</EmailShell>
	);
}
