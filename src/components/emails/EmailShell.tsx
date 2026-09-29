import {
	Body,
	Container,
	Head,
	Hr,
	Html,
	Link,
	Preview,
	Section,
	Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import {
	brandBar,
	brandMark,
	brandMarkDot,
	card,
	divider,
	footer,
	footerCopyright,
	footerDot,
	footerLink,
	footerLinksRow,
	footerText,
	hero,
	heroStyles,
	main,
} from "./style";

type EmailShellProps = {
	/** Inbox preview text (also used by `Preview`). */
	preview: string;
	/** Small uppercase eyebrow above the hero title (e.g. "WELCOME"). */
	eyebrow?: string;
	/** Big hero title rendered on the dark band. */
	heroTitle: string;
	/** Optional supporting line under the hero title. */
	heroSubtitle?: string;
	/** Custom hero replacement (e.g. for the support / contact email). */
	heroSlot?: ReactNode;
	/** Body content. */
	children: ReactNode;
	/** Optional secondary CTA block shown above the footer. */
	bottomSlot?: ReactNode;
	/** Page-relative footer links. */
	footerLinks?: { label: string; href: string }[];
};

/**
 * Shared layout for every Quicktalog transactional email.
 *
 * Renders:
 *   - Brand-styled dark hero band (or a custom replacement slot)
 *   - White card body
 *   - Brand bar with the wordmark
 *   - Consistent footer with privacy / terms links
 */
export default function EmailShell({
	preview,
	eyebrow,
	heroTitle,
	heroSubtitle,
	heroSlot,
	children,
	bottomSlot,
	footerLinks,
}: EmailShellProps) {
	const baseUrl =
		process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.quicktalog.app";
	const links = footerLinks ?? [
		{ label: "Website", href: baseUrl },
		{ label: "Privacy Policy", href: `${baseUrl}/privacy-policy` },
		{ label: "Terms of Service", href: `${baseUrl}/terms-and-conditions` },
	];

	return (
		<Html lang="en">
			<Head>
				<link href="https://fonts.googleapis.com" rel="preconnect" />
				<link href="https://fonts.gstatic.com" rel="preconnect" />
				<link
					crossOrigin="anonymous"
					href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=Inter+Tight:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
			</Head>
			<Preview>{preview}</Preview>

			<Body style={main}>
				<Container style={card}>
					{heroSlot ? (
						heroSlot
					) : (
						<Section style={hero}>
							{eyebrow && <Text style={heroStyles.eyebrow}>{eyebrow}</Text>}
							<Text style={heroStyles.title}>{heroTitle}</Text>
							{heroSubtitle && (
								<Text style={heroStyles.subtitle}>{heroSubtitle}</Text>
							)}
						</Section>
					)}

					{/* Brand bar */}
					<Section style={brandBar}>
						<Link href={baseUrl} style={brandMark}>
							<span style={brandMarkDot} />
							Quicktalog
						</Link>
					</Section>

					{/* Body */}
					{children}

					{bottomSlot}

					<Hr style={divider} />

					{/* Footer */}
					<Section style={footer}>
						<Text style={footerText}>
							Need help? Reach us at{" "}
							<Link
								href="mailto:quicktalog@outlook.com"
								style={{ ...footerLink, margin: 0 }}
							>
								quicktalog@outlook.com
							</Link>
							.
						</Text>
						<div style={footerLinksRow}>
							{links.map((l, i) => (
								<span key={l.href}>
									<Link href={l.href} style={footerLink}>
										{l.label}
									</Link>
									{i < links.length - 1 && <span style={footerDot}>•</span>}
								</span>
							))}
						</div>
						<Text style={footerCopyright}>
							© {new Date().getFullYear()} Quicktalog. All rights reserved.
						</Text>
					</Section>
				</Container>
			</Body>
		</Html>
	);
}
