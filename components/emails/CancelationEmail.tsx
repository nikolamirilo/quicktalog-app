import {
	Body,
	Column,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Text,
} from "@react-email/components";
import {
	container,
	contentSection,
	contentText,
	ctaButton,
	ctaSection,
	divider,
	footer,
	footerCopyright,
	footerLink,
	footerLinks,
	footerSeparator,
	footerText,
	header,
	instructionContent,
	instructionDescription,
	instructionItem,
	instructionList,
	instructionNumber,
	instructionTitle,
	logo,
	main,
	sectionTitle,
	welcomeSection,
	welcomeText,
	welcomeTitle,
} from "./style";

export const CancellationEmail = ({ name }: { name: string }) => (
	<Html>
		<Head>
			<link href="https://fonts.googleapis.com" rel="preconnect" />
			<link href="https://fonts.gstatic.com" rel="preconnect" />
			<link
				href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
				rel="stylesheet"
			/>
		</Head>

		<Preview>We are sorry to see you go - Help us improve Quicktalog</Preview>

		<Body style={main}>
			<Container style={container}>
				{/* Header */}
				<Section style={header}>
					<Row>
						<Column align="center">
							<Img
								alt="Quicktalog Logo"
								height="40"
								src="https://www.quicktalog.app/images/logo.png"
								style={logo}
								width="120"
							/>
						</Column>
					</Row>
				</Section>

				{/* Title */}
				<Section style={welcomeSection}>
					<Text style={welcomeTitle}>
						We are sorry to see you go
						{name && name !== "Unknown User" ? `, ${name}` : ""}.
					</Text>
					<Text style={welcomeText}>
						We are sorry that Quicktalog did not fully meet your needs. Your
						experience matters to us, and we’d appreciate a moment of your time
						to understand how we can improve.
					</Text>
				</Section>

				{/* Offboarding Form */}
				<Section style={contentSection}>
					<Text style={sectionTitle}>Help Us Improve</Text>
					<Text style={contentText}>
						Please fill out our short offboarding{" "}
						<Link
							href="https://forms.office.com/r/nxYghvYAEx"
							style={{ color: "#ffc107", fontWeight: "bold" }}
						>
							form
						</Link>
						. Your answers directly help us build a better product and possibly
						bring back the features you needed.
					</Text>
				</Section>

				{/* Schedule Call / Retention */}
				<Section style={ctaSection}>
					<Text style={sectionTitle}>Want to Talk?</Text>
					<Text style={contentText}>
						If you'd like, you can schedule a short call with our team. We’d be
						happy to hear your feedback in person or discuss options like a
						custom plan or a discounted offer that better fits your needs.
					</Text>

					<Link
						href="https://calendly.com/quicktalog/customer-support"
						style={ctaButton}
					>
						Schedule a Call
					</Link>
				</Section>

				<Hr style={divider} />

				{/* Footer */}
				<Section style={footer}>
					<Text style={footerText}>
						Thank you for giving Quicktalog a try. We hope to see you again in
						the future.
					</Text>

					<div style={footerLinks}>
						<Link href={process.env.NEXT_PUBLIC_BASE_URL} style={footerLink}>
							Website
						</Link>
						<span style={footerSeparator}>•</span>
						<Link
							href={`${process.env.NEXT_PUBLIC_BASE_URL}/privacy-policy`}
							style={footerLink}
						>
							Privacy Policy
						</Link>
						<span style={footerSeparator}>•</span>
						<Link
							href={`${process.env.NEXT_PUBLIC_BASE_URL}/terms-and-conditions`}
							style={footerLink}
						>
							Terms of Service
						</Link>
					</div>

					<Text style={footerCopyright}>
						© {new Date().getFullYear()} Quicktalog. All rights reserved.
					</Text>
				</Section>
			</Container>
		</Body>
	</Html>
);

export default CancellationEmail;
