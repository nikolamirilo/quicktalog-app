import { Link, Section, Text } from "@react-email/components";
import EmailShell from "./EmailShell";
import {
	ctaButton,
	ctaWrapper,
	fieldCard,
	fieldLabel,
	fieldLink,
	fieldValue,
	messageBlock,
	paragraph,
	paragraphLast,
	section,
} from "./style";

function InformationEmail({
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
	return (
		<EmailShell
			bottomSlot={
				<Section style={ctaWrapper}>
					<Link
						href={`mailto:${email}?subject=${encodeURIComponent(
							`Re: ${subject || "Contact Form Message"}`,
						)}`}
						style={ctaButton}
					>
						Reply to {name} →
					</Link>
				</Section>
			}
			eyebrow="New contact message"
			heroSubtitle="A new message just arrived through the Quicktalog contact form. Reply directly from your inbox."
			heroTitle="Someone reached out from your site"
			preview={`New contact message: ${subject || "Contact form"} - ${name}`}
		>
			<Section style={section}>
				<Section style={fieldCard}>
					<Text style={fieldLabel}>From</Text>
					<Text style={fieldValue}>{name}</Text>
				</Section>

				<Section style={fieldCard}>
					<Text style={fieldLabel}>Email address</Text>
					<Link href={`mailto:${email}`} style={fieldLink}>
						{email}
					</Link>
				</Section>

				{subject && (
					<Section style={fieldCard}>
						<Text style={fieldLabel}>Subject</Text>
						<Text style={fieldValue}>{subject}</Text>
					</Section>
				)}

				<Section style={fieldCard}>
					<Text style={fieldLabel}>Message</Text>
					<Text style={messageBlock}>{message}</Text>
				</Section>

				<Text style={paragraph}>
					This message was sent through the Quicktalog contact form. Hit "Reply"
					in your email client, or use the button above, to respond directly.
				</Text>
				<Text style={paragraphLast}>- Quicktalog notifications</Text>
			</Section>
		</EmailShell>
	);
}

export default InformationEmail;
