import { Link, Section, Text } from "@react-email/components";
import EmailShell from "./EmailShell";
import {
	ctaButton,
	ctaWrapper,
	heading,
	leadText,
	paragraph,
	section,
} from "./style";

const CancellationEmail = ({ name }: { name?: string }) => {
	const greetingName = name && name !== "Unknown User" ? name : "there";

	return (
		<EmailShell
			eyebrow="Subscription canceled"
			heroSubtitle="Your Quicktalog subscription has been canceled. Your account stays active until the end of the billing period."
			heroTitle={`We're sorry to see you go, ${greetingName}`}
			preview="Your Quicktalog subscription has been canceled - help us improve."
		>
			<Section style={section}>
				<Text style={leadText}>
					Thank you for trying Quicktalog. We're sorry it didn't fully fit your
					needs - your experience matters to us, and we'd appreciate a moment of
					your time to understand how we can improve.
				</Text>
			</Section>

			{/* Help us improve - offboarding survey */}
			<Section style={section}>
				<Text style={heading}>Help us improve</Text>
				<Text style={paragraph}>
					Please fill out our short offboarding form. Your answers directly help
					us build a better product and possibly bring back the features you
					needed.
				</Text>
				<Link
					href="https://forms.office.com/r/nxYghvYAEx"
					style={{ ...ctaButton, display: "inline-block" }}
				>
					Leave feedback →
				</Link>
			</Section>

			{/* Want to talk? */}
			<Section style={section}>
				<Text style={heading}>Want to talk?</Text>
				<Text style={paragraph}>
					If you'd like, schedule a short call with our team. We'd be happy to
					hear your feedback in person or discuss options like a custom plan or
					a discounted offer that better fits your needs.
				</Text>
				<Link
					href="https://calendly.com/quicktalog/customer-support"
					style={{ ...ctaButton, display: "inline-block" }}
				>
					Schedule a call →
				</Link>
			</Section>

			<Section style={ctaWrapper}>
				<Text style={paragraph}>
					Whatever you decide, thank you for being part of Quicktalog.
					<br />
					The Quicktalog team
				</Text>
			</Section>
		</EmailShell>
	);
};

export default CancellationEmail;
