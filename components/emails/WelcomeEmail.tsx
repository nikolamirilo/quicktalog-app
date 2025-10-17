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

interface WelcomeEmailProps {
	name: string;
}

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
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

// Styles using your product color system
const main = {
	fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
	backgroundColor: "#f3f3f5", // hero-product-background
	margin: "0",
	padding: "0",
};

const container = {
	margin: "0 auto",
	padding: "20px",
	maxWidth: "600px",
	backgroundColor: "#ffffff", // product-background
	borderRadius: "12px",
	boxShadow: "0 2px 6px rgba(0, 0, 0, 0.06)", // product-shadow
};

const header = {
	padding: "40px 0 30px",
	textAlign: "center" as const,
	borderBottom: "1px solid #eaeaea", // product-border
};

const logo = {
	margin: "0 auto",
};

const welcomeSection = {
	padding: "30px 0",
	textAlign: "center" as const,
};

const welcomeTitle = {
	fontSize: "28px",
	fontWeight: "700",
	color: "#171717", // product-foreground
	margin: "0 0 16px 0",
	lineHeight: "1.3",
};

const welcomeText = {
	fontSize: "16px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	lineHeight: "1.6",
};

const contentSection = {
	padding: "30px 0",
};

const sectionTitle = {
	fontSize: "20px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 16px 0",
};

const contentText = {
	fontSize: "16px",
	color: "#454545", // product-foreground-accent
	margin: "0 0 20px 0",
	lineHeight: "1.6",
};

const instructionList = {
	margin: "20px 0",
};

const instructionItem = {
	display: "flex",
	alignItems: "flex-start",
	marginBottom: "20px",
	padding: "20px",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	border: "1px solid #eaeaea", // product-border
};

const instructionNumber = {
	fontSize: "18px",
	fontWeight: "700",
	color: "#171717",
	width: "32px",
	height: "32px",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	margin: "0 16px 0 0",
	flexShrink: 0,
};

const instructionContent = {
	flex: 1,
};

const instructionTitle = {
	fontSize: "16px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 8px 0",
};

const instructionDescription = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	lineHeight: "1.5",
};

const ctaSection = {
	padding: "30px 0",
	textAlign: "center" as const,
};

const ctaButton = {
	backgroundColor: "#ffc107", // product-primary
	color: "#171717", // product-foreground
	padding: "16px 32px",
	borderRadius: "8px",
	textDecoration: "none",
	fontSize: "16px",
	fontWeight: "600",
	display: "inline-block",
	boxShadow: "0 4px 10px rgba(229, 194, 48, 0.15)", // product-hover-shadow
};

const supportSection = {
	padding: "30px 0",
};

const contactInfo = {
	margin: "20px 0",
};

const contactItem = {
	marginBottom: "16px",
	padding: "16px",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	border: "1px solid #eaeaea", // product-border
};

const contactLabel = {
	fontSize: "14px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 8px 0",
};

const contactLink = {
	fontSize: "16px",
	color: "#ffc107", // product-primary
	textDecoration: "none",
	fontWeight: "500",
};

const divider = {
	border: "none",
	borderTop: "1px solid #eaeaea", // product-border
	margin: "40px 0",
};

const footer = {
	padding: "30px 0 20px",
	textAlign: "center" as const,
};

const footerText = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "0 0 16px 0",
	lineHeight: "1.5",
};

const footerLinks = {
	margin: "20px 0",
};

const footerLink = {
	fontSize: "14px",
	color: "#ffc107", // product-primary
	textDecoration: "none",
	margin: "0 8px",
};

const footerSeparator = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "0 4px",
};

const footerCopyright = {
	fontSize: "12px",
	color: "#454545", // product-foreground-accent
	margin: "20px 0 0 0",
};

export default WelcomeEmail;
