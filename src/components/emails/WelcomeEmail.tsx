import { Link, Section, Text } from "@react-email/components";
import EmailShell from "./EmailShell";
import {
	ctaButton,
	ctaWrapper,
	helpItem,
	helpLabel,
	helpLink,
	helpText,
	leadText,
	paragraph,
	paragraphLast,
	section,
	stepBadge,
	stepBody,
	stepDescription,
	stepItem,
	stepTitle,
	stepsList,
} from "./style";

type Step = { title: string; description: string };

const DEFAULT_STEPS: Step[] = [
	{
		title: "Create your first catalog",
		description:
			"Spin up a digital catalog in minutes. Add your items, descriptions, prices and photos with our intuitive editor.",
	},
	{
		title: "Customize the design",
		description:
			"Choose from beautiful themes and tweak colors, fonts and layouts so the catalog looks like your brand.",
	},
	{
		title: "Share with your customers",
		description:
			"Publish and instantly get a QR code and a shareable link - your catalog is ready for any device, anywhere.",
	},
];

const WelcomeEmail = ({
	name,
	steps = DEFAULT_STEPS,
}: {
	name?: string;
	steps?: Step[];
}) => {
	const greetingName = name && name !== "Unknown User" ? name : "there";
	const baseUrl =
		process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.quicktalog.app";

	return (
		<EmailShell
			eyebrow="Welcome"
			heroSubtitle="Your Quicktalog account is ready. Here's how to publish your first catalog and start sharing it with customers today."
			heroTitle={`Welcome aboard, ${greetingName}`}
			preview="Welcome to Quicktalog - your digital catalog journey starts here."
		>
			<Section style={section}>
				<Text style={leadText}>
					Thanks for signing up! We're excited to help you turn your menu,
					product list or service catalog into a beautiful, shareable digital
					experience.
				</Text>

				<Section>
					<ul style={stepsList}>
						{steps.map((step, idx) => (
							<li key={step.title} style={{ ...stepItem, listStyle: "none" }}>
								<Text style={stepBadge}>{idx + 1}</Text>
								<div style={stepBody}>
									<Text style={stepTitle}>{step.title}</Text>
									<Text style={stepDescription}>{step.description}</Text>
								</div>
							</li>
						))}
					</ul>
				</Section>
			</Section>

			<Section style={ctaWrapper}>
				<Link href={`${baseUrl}/admin/create`} style={ctaButton}>
					Create your first catalog →
				</Link>
			</Section>

			<Section style={section}>
				<Text style={paragraph}>
					Have questions, feature ideas, or just want to say hi? We're here to
					help you make the most of Quicktalog.
				</Text>

				<ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
					<li style={helpItem}>
						<Text style={helpLabel}>Email support</Text>
						<Link href="mailto:quicktalog@outlook.com" style={helpLink}>
							quicktalog@outlook.com
						</Link>
						<Text style={helpText}>We reply within one business day.</Text>
					</li>
					<li style={helpItem}>
						<Text style={helpLabel}>Help center</Text>
						<Link href={`${baseUrl}/help`} style={helpLink}>
							Visit our Help Center
						</Link>
						<Text style={helpText}>
							Guides, FAQs and step-by-step tutorials.
						</Text>
					</li>
				</ul>

				<Text style={paragraphLast}>
					Welcome to Quicktalog - happy cataloging!
					<br />
					The Quicktalog team
				</Text>
			</Section>
		</EmailShell>
	);
};

export default WelcomeEmail;
