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

interface FeedbackFormEmailProps {
	userName: string;
	microsoftFormUrl: string;
	context?: "welcome" | "catalogue" | "general";
}

export const FeedbackFormEmail = ({
	userName,
	microsoftFormUrl,
	context = "general",
}: FeedbackFormEmailProps) => {
	const getContextMessage = () => {
		switch (context) {
			case "welcome":
				return "We'd love to hear about your first impressions of Quicktalog!";
			case "catalogue":
				return "How was your experience creating your digital catalog?";
			default:
				return "We value your feedback and would love to hear from you!";
		}
	};

	const getContextTitle = () => {
		switch (context) {
			case "welcome":
				return "How's your Quicktalog experience so far?";
			case "catalogue":
				return "How did your catalog creation go?";
			default:
				return "Share Your Feedback";
		}
	};

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
			<Preview>Quick feedback request - Help us improve Quicktalog!</Preview>

			<Body style={main}>
				<Container style={container}>
					{/* Header */}
					<Section style={header}>
						<Row>
							<Column align="center">
								<Img
									alt="Quicktalog Logo"
									height="40"
									src="https://www.quicktalog.app/logo.svg"
									style={logo}
									width="120"
								/>
							</Column>
						</Row>
					</Section>

					{/* Main Message */}
					<Section style={messageSection}>
						<Text style={greeting}>Hi {userName},</Text>
						<Text style={messageText}>
							{getContextMessage()} Your feedback helps us make Quicktalog
							better for everyone.
						</Text>
					</Section>

					{/* Rating Section */}
					<Section style={ratingSection}>
						<Text style={ratingTitle}>{getContextTitle()}</Text>
						<Text style={ratingSubtitle}>
							Please rate your experience on a scale of 1-10:
						</Text>

						<div style={ratingContainer}>
							{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
								<Link
									href={`${microsoftFormUrl}?rating=${rating}&user=${encodeURIComponent(userName)}&context=${context}`}
									key={rating}
									style={getRatingButtonStyle(rating)}
								>
									{rating}
								</Link>
							))}
						</div>

						<div style={ratingLabels}>
							<Text style={ratingLabel}>Poor</Text>
							<Text style={ratingLabel}>Excellent</Text>
						</div>
					</Section>

					{/* Additional Feedback */}
					<Section style={additionalSection}>
						<Text style={additionalTitle}>Want to share more details?</Text>
						<Text style={additionalText}>
							Click any rating above to open our feedback form where you can
							share more detailed thoughts, suggestions, or report any issues
							you encountered.
						</Text>

						<div style={buttonContainer}>
							<Link href={microsoftFormUrl} style={feedbackButton}>
								Open Feedback Form
							</Link>
						</div>
					</Section>

					{/* Why Feedback Matters */}
					<Section style={whySection}>
						<Text style={whyTitle}>Why Your Feedback Matters</Text>

						<div style={benefitsList}>
							<div style={benefitItem}>
								<Text style={benefitIcon}>🚀</Text>
								<div style={benefitContent}>
									<Text style={benefitTitle}>Improve Our Platform</Text>
									<Text style={benefitDescription}>
										Your insights help us prioritize new features and
										improvements.
									</Text>
								</div>
							</div>

							<div style={benefitItem}>
								<Text style={benefitIcon}>💡</Text>
								<div style={benefitContent}>
									<Text style={benefitTitle}>Shape the Future</Text>
									<Text style={benefitDescription}>
										Help us build the features that matter most to you and your
										business.
									</Text>
								</div>
							</div>

							<div style={benefitItem}>
								<Text style={benefitIcon}>🤝</Text>
								<div style={benefitContent}>
									<Text style={benefitTitle}>Better Support</Text>
									<Text style={benefitDescription}>
										Your feedback helps us provide better support and resources.
									</Text>
								</div>
							</div>
						</div>
					</Section>

					{/* Privacy Note */}
					<Section style={privacySection}>
						<Text style={privacyText}>
							<strong>Privacy:</strong> Your feedback is completely anonymous
							and will only be used to improve our platform. We never share
							personal information.
						</Text>
					</Section>

					<Hr style={divider} />

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerText}>
							Thank you for helping us make Quicktalog better!
						</Text>

						<div style={footerLinks}>
							<Link href="mailto:quicktalog@outlook.com" style={footerLink}>
								Contact Support
							</Link>
							<span style={footerSeparator}>•</span>
							<Link href="https://www.quicktalog.app/help" style={footerLink}>
								Help Center
							</Link>
							<span style={footerSeparator}>•</span>
							<Link href="https://www.quicktalog.app" style={footerLink}>
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

// Helper function to get rating button styles with product colors
const getRatingButtonStyle = (rating: number) => {
	const baseStyle = {
		backgroundColor: "#ffffff",
		color: "#ffc107", // product-primary
		border: "2px solid #ffc107", // product-primary
		borderRadius: "8px",
		width: "50px",
		height: "50px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		textDecoration: "none",
		fontSize: "18px",
		fontWeight: "600",
		transition: "all 0.2s ease",
		margin: "0 4px",
	};

	// Highlight higher ratings with different colors
	if (rating >= 8) {
		return {
			...baseStyle,
			backgroundColor: "#10b981",
			color: "#ffffff",
			border: "2px solid #10b981",
		};
	} else if (rating >= 6) {
		return {
			...baseStyle,
			backgroundColor: "#f59e0b",
			color: "#ffffff",
			border: "2px solid #f59e0b",
		};
	} else if (rating >= 4) {
		return {
			...baseStyle,
			backgroundColor: "#f97316",
			color: "#ffffff",
			border: "2px solid #f97316",
		};
	} else {
		return {
			...baseStyle,
			backgroundColor: "#ef4444",
			color: "#ffffff",
			border: "2px solid #ef4444",
		};
	}
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

const messageSection = {
	padding: "30px 0",
};

const greeting = {
	fontSize: "18px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 16px 0",
};

const messageText = {
	fontSize: "16px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	lineHeight: "1.6",
};

const ratingSection = {
	padding: "30px 0",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	margin: "20px 0",
	textAlign: "center" as const,
};

const ratingTitle = {
	fontSize: "22px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 12px 0",
};

const ratingSubtitle = {
	fontSize: "16px",
	color: "#454545", // product-foreground-accent
	margin: "0 0 30px 0",
};

const ratingContainer = {
	display: "flex",
	justifyContent: "center",
	gap: "8px",
	margin: "0 0 20px 0",
	flexWrap: "wrap" as const,
};

const ratingLabels = {
	display: "flex",
	justifyContent: "space-between",
	margin: "0 20px",
};

const ratingLabel = {
	fontSize: "12px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	fontWeight: "500",
};

const additionalSection = {
	padding: "30px 0",
	textAlign: "center" as const,
};

const additionalTitle = {
	fontSize: "18px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 16px 0",
};

const additionalText = {
	fontSize: "16px",
	color: "#454545", // product-foreground-accent
	margin: "0 0 24px 0",
	lineHeight: "1.6",
};

const buttonContainer = {
	textAlign: "center" as const,
	margin: "20px 0",
};

const feedbackButton = {
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

const whySection = {
	padding: "30px 0",
};

const whyTitle = {
	fontSize: "20px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 24px 0",
	textAlign: "center" as const,
};

const benefitsList = {
	margin: "20px 0",
};

const benefitItem = {
	display: "flex",
	alignItems: "flex-start",
	marginBottom: "20px",
	padding: "20px",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	border: "1px solid #eaeaea", // product-border
};

const benefitIcon = {
	fontSize: "24px",
	margin: "0 16px 0 0",
	flexShrink: 0,
};

const benefitContent = {
	flex: 1,
};

const benefitTitle = {
	fontSize: "16px",
	fontWeight: "600",
	color: "#171717", // product-foreground
	margin: "0 0 8px 0",
};

const benefitDescription = {
	fontSize: "14px",
	color: "#454545", // product-foreground-accent
	margin: "0",
	lineHeight: "1.5",
};

const privacySection = {
	padding: "20px",
	backgroundColor: "#fff9e5", // product-hover-background
	borderRadius: "8px",
	margin: "20px 0",
	textAlign: "center" as const,
};

const privacyText = {
	fontSize: "14px",
	color: "#171717", // product-foreground
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

export default FeedbackFormEmail;
