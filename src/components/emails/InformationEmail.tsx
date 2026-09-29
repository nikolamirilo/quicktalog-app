import { EmailShell } from "./EmailShell";
import {
	Badge,
	Buttons,
	DetailRows,
	FinePrint,
	MessageBox,
	TextLink,
	Title,
} from "./parts";

/** Contact-form message, sent to the support inbox with `replyTo` set to the sender. */
export function InformationEmail({
	email,
	name,
	message,
	subject,
}: {
	email: string;
	name: string;
	message: string;
	subject: string;
}) {
	const heading = subject || "Contact form message";
	const replyHref = `mailto:${email}?subject=${encodeURIComponent(`Re: ${heading}`)}`;

	return (
		<EmailShell preview={`New contact message from ${name}: ${heading}`}>
			<Badge tone="neutral">Contact form</Badge>
			<Title>{heading}</Title>
			<DetailRows
				rows={[
					{ label: "From", value: name },
					{
						label: "Email",
						value: <TextLink href={`mailto:${email}`}>{email}</TextLink>,
					},
				]}
			/>
			<MessageBox>{message}</MessageBox>
			<Buttons buttons={[{ label: `Reply to ${name}`, href: replyHref }]} />
			<FinePrint>
				Hitting Reply in your mail app also goes straight to {name}.
			</FinePrint>
		</EmailShell>
	);
}
