import { DEFAULT_SITE_URL, EmailShell, SUPPORT_EMAIL } from "./EmailShell";
import {
	Badge,
	Buttons,
	DetailRows,
	Heading,
	Lead,
	Paragraph,
	Steps,
	TextLink,
	Title,
} from "./parts";

const STEPS = [
	{
		title: "Create your catalogue",
		description:
			"Add your items, descriptions, prices and photos in the editor.",
	},
	{
		title: "Make it look like you",
		description:
			"Pick a theme and adjust colours, fonts and layout to match your brand.",
	},
	{
		title: "Share it",
		description:
			"Publish and get a link and a QR code. It opens on any phone, no app needed.",
	},
];

export function WelcomeEmail({ name }: { name?: string }) {
	const firstName = name && name !== "Unknown User" ? name : null;

	return (
		<EmailShell preview="Your account is ready. Here's how to publish your first catalogue.">
			<Badge>Account ready</Badge>
			<Title>
				{firstName
					? `Welcome to Quicktalog, ${firstName}`
					: "Welcome to Quicktalog"}
			</Title>
			<Lead>
				Your account is set up. Here's how to get your first catalogue in front
				of customers today.
			</Lead>
			<Steps steps={STEPS} />
			<Buttons
				buttons={[
					{
						label: "Create your first catalogue",
						href: `${DEFAULT_SITE_URL}/admin/dashboard`,
					},
				]}
			/>
			<Heading>Need a hand?</Heading>
			<DetailRows
				rows={[
					{
						label: "Help center",
						value: (
							<TextLink href={`${DEFAULT_SITE_URL}/help`}>
								Step-by-step guides and FAQs
							</TextLink>
						),
					},
					{
						label: "Email support, we reply within one business day",
						value: (
							<TextLink href={`mailto:${SUPPORT_EMAIL}`}>
								{SUPPORT_EMAIL}
							</TextLink>
						),
					},
				]}
			/>
			<Paragraph last>
				Happy building,
				<br />
				The Quicktalog team
			</Paragraph>
		</EmailShell>
	);
}
