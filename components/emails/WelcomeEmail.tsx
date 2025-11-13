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
	contactInfo,
	contactItem,
	contactLabel,
	contactLink,
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
	supportSection,
	welcomeSection,
	welcomeText,
	welcomeTitle,
} from "./style";

export const WelcomeEmail = ({ name }: { name: string }) => (
	<Html>
		<Head>
			<link href="https://fonts.googleapis.com" rel="preconnect" />
			<link href="https://fonts.gstatic.com" rel="preconnect" />
			<link
				href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
				rel="stylesheet"
			/>
		</Head>
		<Preview>
			Welcome to Quicktalog - Your Digital Catalog Journey Starts Here!
		</Preview>

		<Body style={main}>
			<Container style={container}>
				{/* Header */}
				<Section style={header}>
					<Row>
						<Column align="center">
							<Img
								alt="Quicktalog Logo"
								height="40"
								src={`https://www.quicktalog.app/images/logo.png`}
								style={logo}
								width="120"
							/>
						</Column>
					</Row>
				</Section>

				{/* Welcome Message */}
				<Section style={welcomeSection}>
					<Text style={welcomeTitle}>
						Welcome to Quicktalog
						{name && name !== "Unknown User" ? `, ${name}!` : "!"}🎉
					</Text>
					<Text style={welcomeText}>
						Thank you for joining Quicktalog! We're excited to help you create
						stunning digital catalogs that will transform how you showcase your
						business.
					</Text>
				</Section>

				{/* Getting Started Section */}
				<Section style={contentSection}>
					<Text style={sectionTitle}>Getting Started</Text>
					<Text style={contentText}>
						Here's how to make the most of your Quicktalog experience:
					</Text>

					<div style={instructionList}>
						<div style={instructionItem}>
							<Text style={instructionNumber}>1</Text>
							<div style={instructionContent}>
								<Text style={instructionTitle}>Create Your First Catalog</Text>
								<Text style={instructionDescription}>
									Start by creating your first digital catalog. Our intuitive
									interface makes it easy to add your products and services.
								</Text>
							</div>
						</div>

						<div style={instructionItem}>
							<Text style={instructionNumber}>2</Text>
							<div style={instructionContent}>
								<Text style={instructionTitle}>Customize Your Design</Text>
								<Text style={instructionDescription}>
									Choose from our beautiful themes and customize colors, fonts,
									and layouts to match your brand.
								</Text>
							</div>
						</div>

						<div style={instructionItem}>
							<Text style={instructionNumber}>3</Text>
							<div style={instructionContent}>
								<Text style={instructionTitle}>Share with Your Customers</Text>
								<Text style={instructionDescription}>
									Generate QR codes and shareable links to make your catalog
									accessible to customers anywhere, anytime.
								</Text>
							</div>
						</div>
					</div>
				</Section>

				{/* CTA Button */}
				<Section style={ctaSection}>
					<Link
						href={`${process.env.NEXT_PUBLIC_BASE_URL}/admin/create`}
						style={ctaButton}
					>
						Create Your First Catalog
					</Link>
				</Section>

				{/* Support Section */}
				<Section style={supportSection}>
					<Text style={sectionTitle}>Need Help?</Text>
					<Text style={contentText}>
						Our support team is here to help you succeed. Here's how to reach
						us:
					</Text>

					<div style={contactInfo}>
						<div style={contactItem}>
							<Text style={contactLabel}>Email Support</Text>
							<Link href="mailto:quicktalog@outlook.com" style={contactLink}>
								quicktalog@outlook.com
							</Link>
						</div>

						<div style={contactItem}>
							<Text style={contactLabel}>Help Center</Text>
							<Link
								href={`${process.env.NEXT_PUBLIC_BASE_URL}/help`}
								style={contactLink}
							>
								Visit our Help Center
							</Link>
						</div>
					</div>
				</Section>
				<Hr style={divider} />

				{/* Footer */}
				<Section style={footer}>
					<Text style={footerText}>
						Thank you for choosing Quicktalog. We're here to help you succeed!
					</Text>
					<Text style={footerText}>
						Best regards,
						<br />
						The Quicktalog Team
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

export default WelcomeEmail;
