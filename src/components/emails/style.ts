// Brand-aligned design tokens for Quicktalog transactional emails.
// Mirrors src/styles/product.css so an email feels like a page of the app.

export const brand = {
	fontBody:
		"'Plus Jakarta Sans', 'Inter Tight', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
	fontHeading:
		"'Plus Jakarta Sans', 'Inter Tight', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",

	background: "#f4f1ea", // product-background-hero
	surface: "#ffffff", // product-card
	surfaceMuted: "#faf8f3", // product-background
	border: "#ece7dc", // product-border
	borderStrong: "#dcd5c6", // product-border-strong

	foreground: "#16140f", // product-foreground
	foregroundAccent: "#5e584d", // product-foreground-accent
	muted: "#7a7466", // product-muted

	primary: "#ffb020", // product-primary
	primaryAccent: "#f5a300", // product-primary-accent
	primaryInk: "#8a5a00", // product-primary-ink
	primaryBright: "#ffc75a", // product-primary-bright
	primarySoft: "#fff4dc", // product-primary-soft

	secondary: "#010e58", // product-secondary
	secondarySoft: "#f3f4fa", // product-secondary-soft

	dark: "#15130e", // product-dark
	darkRaised: "#1f1c16", // product-dark-raised
	darkDeep: "#0e0d0a", // product-dark-deep
	onDark: "#f4efe6", // product-on-dark
	onDarkMuted: "#cfc8ba", // product-on-dark-muted

	success: "#1f7a4a", // product-success
	error: "#c8322b", // product-error

	radius: "22px",
	shadow:
		"0 1px 2px rgba(22,20,15,0.04), 0 4px 12px rgba(22,20,15,0.05), 0 16px 32px -12px rgba(22,20,15,0.08)",
};

// Page-level wrapper. Sits on the cream brand background and centers the card.
export const main = {
	backgroundColor: brand.background,
	fontFamily: brand.fontBody,
	margin: "0",
	padding: "40px 16px",
	WebkitFontSmoothing: "antialiased",
};

// Outer card. White surface with the brand's large radius + soft layered shadow.
export const card = {
	margin: "0 auto",
	maxWidth: "600px",
	backgroundColor: brand.surface,
	borderRadius: brand.radius,
	border: `1px solid ${brand.border}`,
	boxShadow: brand.shadow,
	overflow: "hidden",
};

// Hero band at the top of the email - mirrors the user-profile header on the
// dashboard: warm amber panel gradient on a cream card. Matches
// `bg-product-amber-panel` from tailwind.config.ts.
export const hero = {
	backgroundColor: "#fffbf2",
	backgroundImage:
		"linear-gradient(160deg, #fff4dc 0%, #fffbf2 45%, #ffffff 100%)",
	padding: "44px 40px 36px",
	textAlign: "center" as const,
	borderBottom: `1px solid ${brand.border}`,
	position: "relative" as const,
};

export const heroEyebrow = {
	display: "inline-block",
	margin: "0 0 14px 0",
	padding: "6px 12px",
	borderRadius: "999px",
	backgroundColor: brand.primarySoft,
	border: `1px solid rgba(245, 163, 0, 0.30)`,
	color: brand.primaryInk,
	fontFamily: brand.fontHeading,
	fontSize: "11px",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase" as const,
};

export const heroTitle = {
	margin: "0",
	fontFamily: brand.fontHeading,
	fontSize: "30px",
	fontWeight: 800,
	lineHeight: 1.15,
	letterSpacing: "-0.025em",
	color: brand.foreground,
};

export const heroSubtitle = {
	margin: "14px 0 0 0",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.55,
	color: brand.foregroundAccent,
};

// Brand-mark block - small amber square + wordmark on a white strip below hero.
export const brandBar = {
	padding: "24px 40px",
	textAlign: "center" as const,
	backgroundColor: brand.surfaceMuted,
	borderBottom: `1px solid ${brand.border}`,
};

export const brandMark = {
	fontFamily: brand.fontHeading,
	fontSize: "20px",
	fontWeight: 800,
	letterSpacing: "-0.02em",
	color: brand.foreground,
	textDecoration: "none",
	display: "inline-flex",
	alignItems: "center",
	gap: "10px",
};

export const brandMarkDot = {
	display: "inline-block",
	width: "12px",
	height: "12px",
	borderRadius: "4px",
	backgroundColor: brand.primary,
	boxShadow: "0 4px 14px rgba(245, 163, 0, 0.45)",
};

// Body section padding.
export const section = {
	padding: "32px 40px",
};

export const sectionMuted = {
	padding: "28px 40px",
	backgroundColor: brand.surfaceMuted,
	borderTop: `1px solid ${brand.border}`,
	borderBottom: `1px solid ${brand.border}`,
};

export const heading = {
	margin: "0 0 10px 0",
	fontFamily: brand.fontHeading,
	fontSize: "18px",
	fontWeight: 700,
	letterSpacing: "-0.015em",
	color: brand.foreground,
	lineHeight: 1.3,
};

export const paragraph = {
	margin: "0 0 16px 0",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.65,
	color: brand.foregroundAccent,
};

export const paragraphLast = {
	margin: "0",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.65,
	color: brand.foregroundAccent,
};

export const leadText = {
	margin: "0 0 20px 0",
	fontFamily: brand.fontBody,
	fontSize: "16px",
	lineHeight: 1.65,
	color: brand.foreground,
};

// Numbered instruction list (welcome flow).
export const stepsList = {
	margin: "8px 0 0 0",
	padding: "0",
	listStyle: "none" as const,
};

export const stepItem = {
	display: "flex",
	alignItems: "flex-start",
	marginBottom: "12px",
	padding: "16px 18px",
	backgroundColor: brand.primarySoft,
	border: `1px solid ${brand.border}`,
	borderRadius: "14px",
};

export const stepBadge = {
	flexShrink: 0,
	width: "28px",
	height: "28px",
	marginRight: "14px",
	borderRadius: "8px",
	backgroundColor: brand.primary,
	color: brand.foreground,
	fontFamily: brand.fontHeading,
	fontSize: "14px",
	fontWeight: 800,
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	boxShadow: "0 6px 18px -6px rgba(245, 163, 0, 0.55)",
};

export const stepBody = {
	flex: 1,
};

export const stepTitle = {
	margin: "2px 0 4px 0",
	fontFamily: brand.fontHeading,
	fontSize: "15px",
	fontWeight: 700,
	color: brand.foreground,
	lineHeight: 1.3,
};

export const stepDescription = {
	margin: "0",
	fontFamily: brand.fontBody,
	fontSize: "13.5px",
	lineHeight: 1.55,
	color: brand.foregroundAccent,
};

// CTA button.
export const ctaWrapper = {
	padding: "8px 40px 36px",
	textAlign: "center" as const,
};

export const ctaButton = {
	backgroundColor: brand.primary,
	backgroundImage: `linear-gradient(180deg, ${brand.primary} 0%, ${brand.primaryAccent} 100%)`,
	color: brand.foreground,
	padding: "14px 28px",
	borderRadius: "12px",
	textDecoration: "none",
	fontFamily: brand.fontHeading,
	fontSize: "15px",
	fontWeight: 700,
	letterSpacing: "-0.005em",
	display: "inline-block",
	boxShadow: "0 6px 18px -6px rgba(245, 163, 0, 0.55)",
	border: `1px solid ${brand.primaryAccent}`,
};

// Secondary button (outline). Used when offering two paths.
export const ctaSecondary = {
	backgroundColor: brand.surface,
	color: brand.foreground,
	padding: "13px 26px",
	borderRadius: "12px",
	textDecoration: "none",
	fontFamily: brand.fontHeading,
	fontSize: "15px",
	fontWeight: 700,
	display: "inline-block",
	border: `1px solid ${brand.borderStrong}`,
};

// Pill / chip.
export const chip = {
	display: "inline-block",
	padding: "4px 10px",
	borderRadius: "999px",
	backgroundColor: brand.primarySoft,
	color: brand.primaryInk,
	fontFamily: brand.fontHeading,
	fontSize: "12px",
	fontWeight: 700,
	letterSpacing: "0.02em",
	border: `1px solid ${brand.border}`,
};

// Contact message - label/value card.
export const fieldCard = {
	margin: "0 0 14px 0",
	padding: "16px 18px",
	backgroundColor: brand.surface,
	border: `1px solid ${brand.border}`,
	borderLeft: `4px solid ${brand.primary}`,
	borderRadius: "14px",
};

export const fieldLabel = {
	margin: "0 0 6px 0",
	fontFamily: brand.fontHeading,
	fontSize: "11px",
	fontWeight: 700,
	letterSpacing: "0.08em",
	textTransform: "uppercase" as const,
	color: brand.secondary,
};

export const fieldValue = {
	margin: "0",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	color: brand.foreground,
	fontWeight: 600,
	lineHeight: 1.45,
};

export const fieldLink = {
	fontFamily: brand.fontBody,
	fontSize: "15px",
	color: brand.secondary,
	fontWeight: 600,
	textDecoration: "underline",
};

export const messageBlock = {
	margin: "0",
	padding: "16px 18px",
	backgroundColor: brand.surfaceMuted,
	border: `1px solid ${brand.border}`,
	borderRadius: "12px",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.65,
	color: brand.foreground,
	whiteSpace: "pre-wrap" as const,
};

// Help / contact grid.
export const helpGrid = {
	margin: "12px 0 0 0",
	padding: "0",
	listStyle: "none" as const,
};

export const helpItem = {
	padding: "16px 18px",
	backgroundColor: brand.surfaceMuted,
	border: `1px solid ${brand.border}`,
	borderRadius: "14px",
	marginBottom: "10px",
};

export const helpLabel = {
	margin: "0 0 4px 0",
	fontFamily: brand.fontHeading,
	fontSize: "13px",
	fontWeight: 700,
	color: brand.foreground,
};

export const helpLink = {
	fontFamily: brand.fontBody,
	fontSize: "14px",
	color: brand.secondary,
	textDecoration: "underline",
	fontWeight: 600,
};

export const helpText = {
	margin: 0,
	fontFamily: brand.fontBody,
	fontSize: "14px",
	color: brand.foregroundAccent,
};

// Footer.
export const footer = {
	padding: "28px 40px 24px",
	textAlign: "center" as const,
	backgroundColor: brand.surface,
};

export const footerText = {
	margin: "0 0 14px 0",
	fontFamily: brand.fontBody,
	fontSize: "13px",
	color: brand.foregroundAccent,
	lineHeight: 1.55,
};

export const footerLinksRow = {
	margin: "0 0 12px 0",
};

export const footerLink = {
	fontFamily: brand.fontBody,
	fontSize: "13px",
	color: brand.secondary,
	textDecoration: "none",
	fontWeight: 600,
	margin: "0 8px",
};

export const footerDot = {
	fontSize: "13px",
	color: brand.borderStrong,
	margin: "0 2px",
};

export const footerCopyright = {
	margin: "8px 0 0 0",
	fontFamily: brand.fontBody,
	fontSize: "12px",
	color: brand.muted,
	letterSpacing: "0.02em",
};

// Divider.
export const divider = {
	border: "none",
	borderTop: `1px solid ${brand.border}`,
	margin: "0",
};

// Legacy aliases kept so existing imports keep working during the migration.
export const main_alias = main;
export const container = card;
export const header = hero;
export const logo = brandMark;
export const welcomeSection = section;
export const welcomeTitle = heroTitle;
export const welcomeText = heroSubtitle;
export const contentSection = section;
export const sectionTitle = heading;
export const contentText = paragraph;
export const instructionList = stepsList;
export const instructionItem = stepItem;
export const instructionNumber = stepBadge;
export const instructionContent = stepBody;
export const instructionTitle = stepTitle;
export const instructionDescription = stepDescription;
export const ctaSection = ctaWrapper;
export const supportSection = sectionMuted;
export const contactInfo = helpGrid;
export const contactItem = helpItem;
export const contactLabel = helpLabel;
export const contactLink = helpLink;
export const hr = divider;
export const footerInner = footer;
export const footerInnerText = footerText;
export const footerLinks = footerLinksRow;
export const footerLinkAnchor = footerLink;
export const footerSep = footerDot;
export const footerCopy = footerCopyright;

// Grouped hero styles for EmailShell consumers.
export const heroStyles = {
	eyebrow: heroEyebrow,
	title: heroTitle,
	subtitle: heroSubtitle,
};
