import type { CSSProperties } from "react";

// Hex copies of src/styles/product.css tokens: email clients have no CSS variables.
export const brand = {
	fontHead:
		"'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
	fontBody:
		"'Inter Tight', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",

	background: "#faf8f3",
	backgroundAlt: "#f4f1ea",
	card: "#ffffff",
	border: "#ece7dc",
	borderStrong: "#dcd5c6",

	foreground: "#16140f",
	foregroundAccent: "#5e584d",
	muted: "#7a7466",

	primary: "#ffb020",
	primaryInk: "#8a5a00",
	primarySoft: "#fff4dc",
	primarySoftBorder: "#fbe3b0",
};

type Style = CSSProperties;

export const body: Style = {
	margin: 0,
	padding: 0,
	backgroundColor: brand.background,
	WebkitFontSmoothing: "antialiased",
};

export const preheader: Style = {
	display: "none",
	maxHeight: 0,
	overflow: "hidden",
	opacity: 0,
	color: brand.background,
};

export const outer: Style = {
	backgroundColor: brand.background,
	padding: "32px 16px",
};

export const column: Style = {
	width: "100%",
	maxWidth: "600px",
	margin: "0 auto",
};

export const logoCell: Style = { padding: "0 4px 18px" };

export const logo: Style = {
	display: "block",
	border: 0,
	width: "118px",
	height: "auto",
};

export const card: Style = {
	backgroundColor: brand.card,
	border: `1px solid ${brand.border}`,
	borderRadius: "22px",
	padding: "40px 40px 36px",
	boxShadow:
		"0 1px 2px rgba(22,20,15,.04), 0 4px 12px rgba(22,20,15,.05), 0 16px 32px -12px rgba(22,20,15,.08)",
};

export const footerCell: Style = { padding: "22px 4px 0" };

export const footerText: Style = {
	margin: "0 0 10px",
	fontFamily: brand.fontBody,
	fontSize: "13px",
	lineHeight: 1.55,
	color: brand.foregroundAccent,
};

export const footerLink: Style = {
	color: brand.foregroundAccent,
	textDecoration: "underline",
};

export const badge = {
	amber: {
		backgroundColor: brand.primarySoft,
		border: `1px solid ${brand.primarySoftBorder}`,
		color: brand.primaryInk,
	},
	neutral: {
		backgroundColor: brand.backgroundAlt,
		border: `1px solid ${brand.border}`,
		color: brand.foregroundAccent,
	},
} satisfies Record<string, Style>;

export const badgeCell: Style = {
	borderRadius: "999px",
	padding: "5px 12px",
	fontFamily: brand.fontBody,
	fontSize: "13px",
	lineHeight: 1.2,
	fontWeight: 600,
};

export const title: Style = {
	margin: "18px 0 12px",
	fontFamily: brand.fontHead,
	fontSize: "28px",
	lineHeight: 1.15,
	fontWeight: 800,
	letterSpacing: "-0.03em",
	color: brand.foreground,
};

export const lead: Style = {
	margin: "0 0 24px",
	fontFamily: brand.fontBody,
	fontSize: "16px",
	lineHeight: 1.6,
	color: brand.foregroundAccent,
};

export const paragraph: Style = {
	margin: "0 0 16px",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.6,
	color: brand.foregroundAccent,
};

export const heading: Style = {
	margin: "0 0 8px",
	fontFamily: brand.fontHead,
	fontSize: "18px",
	lineHeight: 1.3,
	fontWeight: 700,
	letterSpacing: "-0.015em",
	color: brand.foreground,
};

export const link: Style = {
	color: brand.primaryInk,
	textDecoration: "underline",
};

export const buttonRow: Style = { margin: "0 0 24px" };

export const buttonGap: Style = { width: "8px", fontSize: 0 };

export const primaryButtonCell: Style = {
	backgroundColor: brand.primary,
	border: `1px solid ${brand.primary}`,
	borderRadius: "999px",
	boxShadow: "0 6px 18px -6px rgba(245,163,0,.55)",
};

export const secondaryButtonCell: Style = {
	backgroundColor: brand.card,
	border: `1px solid ${brand.borderStrong}`,
	borderRadius: "999px",
};

export const buttonLink: Style = {
	display: "inline-block",
	padding: "14px 26px",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.1,
	fontWeight: 600,
	color: brand.foreground,
	textDecoration: "none",
	borderRadius: "999px",
};

export const chipRow: Style = { margin: "0 0 24px" };

export const chipCell: Style = { padding: "0 6px 0 0" };

export const chip: Style = {
	display: "inline-block",
	backgroundColor: brand.backgroundAlt,
	borderRadius: "999px",
	padding: "4px 10px",
	fontFamily: brand.fontBody,
	fontSize: "12px",
	fontWeight: 500,
	color: brand.foregroundAccent,
};

export const detailTable: Style = {
	margin: "0 0 24px",
	backgroundColor: brand.background,
	border: `1px solid ${brand.border}`,
	borderRadius: "14px",
	borderCollapse: "separate",
};

export const detailCell: Style = { padding: "12px 16px" };

export const detailCellDivided: Style = {
	...detailCell,
	borderTop: `1px solid ${brand.border}`,
};

export const detailLabel: Style = {
	margin: "0 0 2px",
	fontFamily: brand.fontBody,
	fontSize: "13px",
	lineHeight: 1.4,
	color: brand.muted,
};

export const detailValue: Style = {
	margin: 0,
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.45,
	fontWeight: 600,
	color: brand.foreground,
	wordBreak: "break-word",
};

export const fallbackText: Style = {
	margin: 0,
	fontFamily: brand.fontBody,
	fontSize: "13px",
	lineHeight: 1.55,
	color: brand.muted,
};

export const fallbackLink: Style = { ...link, wordBreak: "break-all" };

export const divider: Style = {
	border: "none",
	borderTop: `1px solid ${brand.border}`,
	margin: "28px 0 24px",
};

export const noteHeading: Style = {
	margin: "0 0 4px",
	fontFamily: brand.fontBody,
	fontSize: "14px",
	lineHeight: 1.5,
	fontWeight: 600,
	color: brand.foreground,
};

export const noteText: Style = {
	margin: 0,
	fontFamily: brand.fontBody,
	fontSize: "14px",
	lineHeight: 1.55,
	color: brand.foregroundAccent,
};

export const stepsTable: Style = { margin: "0 0 8px" };

export const stepNumberCell: Style = {
	width: "30px",
	padding: "0 14px 18px 0",
	verticalAlign: "top",
};

export const stepNumber: Style = {
	width: "30px",
	height: "30px",
	lineHeight: "30px",
	borderRadius: "999px",
	backgroundColor: brand.primary,
	textAlign: "center",
	fontFamily: brand.fontHead,
	fontSize: "14px",
	fontWeight: 800,
	color: brand.foreground,
};

export const stepTextCell: Style = {
	padding: "4px 0 18px",
	verticalAlign: "top",
};

export const stepTitle: Style = {
	margin: "0 0 2px",
	fontFamily: brand.fontHead,
	fontSize: "16px",
	lineHeight: 1.3,
	fontWeight: 700,
	letterSpacing: "-0.01em",
	color: brand.foreground,
};

export const stepDescription: Style = {
	margin: 0,
	fontFamily: brand.fontBody,
	fontSize: "14px",
	lineHeight: 1.55,
	color: brand.foregroundAccent,
};

export const messageBox: Style = {
	backgroundColor: brand.backgroundAlt,
	borderRadius: "14px",
	padding: "18px 20px",
	fontFamily: brand.fontBody,
	fontSize: "15px",
	lineHeight: 1.65,
	color: brand.foreground,
	whiteSpace: "pre-wrap",
};

export const finePrint: Style = {
	margin: 0,
	fontFamily: brand.fontBody,
	fontSize: "13px",
	lineHeight: 1.55,
	color: brand.muted,
};

// Gmail and Apple Mail honour <style> media queries; the rest keep desktop padding.
export const responsiveCss = `@media (max-width:520px){.qt-card{padding:28px 22px 26px!important}.qt-title{font-size:24px!important}.qt-outer{padding:20px 10px!important}}`;
