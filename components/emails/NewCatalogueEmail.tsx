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

interface NewCatalogueEmailProps {
	name: string;
	catalogueName: string;
	catalogueSlug: string;
}

// Function to generate QR code URL using a free QR code API
const generateQRCodeUrl = (url: string): string => {
	const encodedUrl = encodeURIComponent(url);
	// Using QR Server API - free and reliable
	return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}&format=png&margin=10`;
};

export const NewCatalogueEmail = ({
	name,
	catalogueName,
	catalogueSlug,
}: NewCatalogueEmailProps) => {
	// Generate QR code URL automatically
	const catalogueUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}/catalogues/${catalogueSlug}`;
	const analyticsUrl = `${process.env.NEXT_PUBLIC_BASE_URL!}/admin/items/${catalogueSlug}/analytics`;
	const qrCodeUrl = generateQRCodeUrl(catalogueUrl);

	return (
		<Html>
			<Head>
				<link href="https://fonts.googleapis.com" rel="preconnect" />
				<link href="https://fonts.gstatic.com" rel="preconnect" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<Preview>🎉 Your digital catalog "{catalogueName}" is now live!</Preview>

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

					{/* Success Message */}
					<Section style={successSection}>
						<Text style={successTitle}>
							🎉 Congratulations{name === "" ? null : `, ${name}`}!
						</Text>
						<Text style={successText}>
							Your digital catalog <strong>"{catalogueName}"</strong> is now
							live and ready to share with your customers!
						</Text>
					</Section>

					{/* Catalogue Link Section */}
					<Section style={linkSection}>
						<Text style={sectionTitle}>Your Catalog is Live</Text>
						<Text style={contentText}>
							Share this link with your customers to let them browse your
							catalog:
						</Text>

						<div style={linkContainer}>
							<Link href={catalogueUrl} style={catalogueLink}>
								{catalogueUrl}
							</Link>
						</div>

						<div style={buttonContainer}>
							<Link href={catalogueUrl} style={primaryButton}>
								View Your Catalog
							</Link>
						</div>
					</Section>

					{/* QR Code Section - Now always present */}
					<Section style={qrSection}>
						<Text style={sectionTitle}>QR Code for Easy Sharing</Text>
						<Text style={contentText}>
							Use this QR code to make your catalog easily accessible. Customers
							can simply scan it with their phone camera to view your catalog
							instantly.
						</Text>

						<div style={qrContainer}>
							<Img
								alt="QR Code for your catalog"
								height="200"
								src={qrCodeUrl}
								style={qrCode}
								width="200"
							/>
						</div>

						<Text style={qrNote}>
							Print this QR code on business cards, flyers, or display it in
							your store for easy access.
						</Text>
					</Section>

					{/* HTML Embed Code Section */}
					<Section style={embedSection}>
						<Text style={sectionTitle}>Embed in Your Website</Text>
						<Text style={contentText}>
							Want to embed your catalog directly into your website? Use this
							HTML code:
						</Text>

						<div style={codeContainer}>
							<Text style={codeText}>
								{`<iframe src="${catalogueUrl}" style="width:100vw;height:100vh;border:none;position:fixed;top:0;left:0;z-index:9999;background:white;"></iframe>`}
							</Text>
						</div>

						<Text style={codeNote}>
							Copy and paste this code into your website to embed your catalog
							as a full-screen overlay.
						</Text>
					</Section>

					{/* Analytics Section */}
					{analyticsUrl && (
						<Section style={analyticsSection}>
							<Text style={sectionTitle}>Track Your Performance</Text>
							<Text style={contentText}>
								Monitor how your catalog is performing with detailed analytics.
								See how many people are viewing your catalog, which items are
								most popular, and more.
							</Text>

							<div style={buttonContainer}>
								<Link href={analyticsUrl} style={secondaryButton}>
									View Analytics Dashboard
								</Link>
							</div>
						</Section>
					)}

					{/* Tips Section */}
					<Section style={tipsSection}>
						<Text style={sectionTitle}>Pro Tips for Success</Text>

						<div style={tipsList}>
							<div style={tipItem}>
								<Text style={tipIcon}>📱</Text>
								<div style={tipContent}>
									<Text style={tipTitle}>Share on Social Media</Text>
									<Text style={tipDescription}>
										Post your catalog link on your social media profiles to
										reach more customers.
									</Text>
								</div>
							</div>

							<div style={tipItem}>
								<Text style={tipIcon}>🔄</Text>
								<div style={tipContent}>
									<Text style={tipTitle}>Keep It Updated</Text>
									<Text style={tipDescription}>
										Regularly update your catalog with new products, prices, and
										seasonal offerings.
									</Text>
								</div>
							</div>

							<div style={tipItem}>
								<Text style={tipIcon}>📊</Text>
								<div style={tipContent}>
									<Text style={tipTitle}>Monitor Performance</Text>
									<Text style={tipDescription}>
										Check your analytics regularly to understand what your
										customers are most interested in.
									</Text>
								</div>
							</div>
						</div>
					</Section>

					<Hr style={divider} />

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerText}>
							Need help or have questions? We're here to support you!
						</Text>

						<div style={footerLinks}>
							<Link href="mailto:quicktalog@outlook.com" style={footerLink}>
								Contact Support
							</Link>
							<span style={footerSeparator}>•</span>
							<Link
								href={`${process.env.NEXT_PUBLIC_BASE_URL!}/help`}
								style={footerLink}
							>
								Help Center
							</Link>
							<span style={footerSeparator}>•</span>
							<Link
								href={`${process.env.NEXT_PUBLIC_BASE_URL!}`}
								style={footerLink}
							>
								Website
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
};

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

const successSection = {
	padding: "30px 0",
	textAlign: "center" as const,
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	margin: "20px 0",
};

const successTitle = {
	fontSize: "28px",
	fontWeight: "700",
	color: "#171717", // product-foreground
	margin: "0 0 16px 0",
	lineHeight: "1.3",
};

const successText = {
	fontSize: "16px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	lineHeight: "1.6",
};

const linkSection = {
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

const linkContainer = {
	backgroundColor: "#fff9e5", // product-hover-background
	border: "1px solid #eaeaea", // product-border
	borderRadius: "8px",
	padding: "16px",
	margin: "20px 0",
	textAlign: "center" as const,
};

const catalogueLink = {
	fontSize: "16px",
	color: "#ffc107", // product-primary
	textDecoration: "none",
	fontWeight: "500",
	wordBreak: "break-all" as const,
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "20px 0",
};

const primaryButton = {
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

const secondaryButton = {
	backgroundColor: "#ffffff",
	color: "#ffc107", // product-primary
	border: "2px solid #ffc107", // product-primary
	padding: "14px 30px",
	borderRadius: "8px",
	textDecoration: "none",
	fontSize: "16px",
	fontWeight: "600",
	display: "inline-block",
};

const qrSection = {
	padding: "30px 0",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	margin: "20px 0",
	textAlign: "center" as const,
};

const qrContainer = {
	margin: "20px 0",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	width: "100%",
};

const qrCode = {
	border: "1px solid #eaeaea", // product-border
	borderRadius: "8px",
	backgroundColor: "#ffffff",
	display: "block",
	margin: "0 auto", // This ensures centering even if flex is not supported
};

const qrNote = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "16px 0 0 0",
	fontStyle: "italic",
};

const embedSection = {
	padding: "30px 0",
};

const codeContainer = {
	backgroundColor: "#171717", // product-foreground
	border: "1px solid #eaeaea", // product-border
	borderRadius: "8px",
	padding: "20px",
	margin: "20px 0",
	overflow: "auto",
};

const codeText = {
	fontSize: "14px",
	color: "#ffffff",
	margin: "0",
	fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
	lineHeight: "1.5",
	wordBreak: "break-all" as const,
};

const codeNote = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "16px 0 0 0",
	fontStyle: "italic",
};

const analyticsSection = {
	padding: "30px 0",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	margin: "20px 0",
	textAlign: "center" as const,
};

const tipsSection = {
	padding: "30px 0",
};

const tipsList = {
	margin: "20px 0",
};

const tipItem = {
	display: "flex",
	alignItems: "flex-start",
	marginBottom: "20px",
	padding: "20px",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	border: "1px solid #eaeaea", // product-border
};

const tipIcon = {
	fontSize: "24px",
	margin: "0 16px 0 0",
	flexShrink: 0,
};

const tipContent = {
	flex: 1,
};

const tipTitle = {
	fontSize: "16px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 8px 0",
};

const tipDescription = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	lineHeight: "1.5",
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
	margin: "0 0 20px 0",
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

export default NewCatalogueEmail;
