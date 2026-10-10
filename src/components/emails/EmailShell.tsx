import { Body, Head, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import * as s from "./style";

export const DEFAULT_SITE_URL =
	process.env.NEXT_PUBLIC_BASE_URL ?? "https://www.quicktalog.app";

export const SUPPORT_EMAIL = "quicktalog@outlook.com";

type EmailShellProps = {
	/** Inbox preview text shown after the subject. */
	preview: string;
	children: ReactNode;
	/** Origin for the logo and footer links; auth templates pass `{{ .SiteURL }}`. */
	siteUrl?: string;
};

const table = {
	role: "presentation",
	cellPadding: 0,
	cellSpacing: 0,
	border: 0,
} as const;

/** Layout shared by every Quicktalog email: logo, white card, footer. */
export function EmailShell({
	preview,
	children,
	siteUrl = DEFAULT_SITE_URL,
}: EmailShellProps) {
	return (
		<Html lang="en">
			<Head>
				<meta content="light" name="color-scheme" />
				<meta content="light" name="supported-color-schemes" />
				<link
					href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Inter+Tight:wght@400;500;600&display=swap"
					rel="stylesheet"
				/>
				<style>{s.responsiveCss}</style>
			</Head>
			<Preview>{preview}</Preview>
			<Body style={s.body}>
				<table
					{...table}
					style={{ backgroundColor: s.brand.background }}
					width="100%"
				>
					<tbody>
						<tr>
							<td align="center" className="qt-outer" style={s.outer}>
								<table {...table} style={s.column} width="600">
									<tbody>
										<tr>
											<td style={s.logoCell}>
												<a href={siteUrl}>
													<img
														alt="Quicktalog"
														height="43"
														src={`${siteUrl}/images/brand/email-logo@2x.png`}
														style={s.logo}
														width="118"
													/>
												</a>
											</td>
										</tr>
										<tr>
											<td className="qt-card" style={s.card}>
												{children}
											</td>
										</tr>
										<tr>
											<td style={s.footerCell}>
												<p style={s.footerText}>
													Need help? Write to{" "}
													<a
														href={`mailto:${SUPPORT_EMAIL}`}
														style={s.footerLink}
													>
														{SUPPORT_EMAIL}
													</a>
													.
												</p>
												<p style={{ ...s.footerText, margin: 0 }}>
													<a href={siteUrl} style={s.footerLink}>
														quicktalog.app
													</a>
													{" · "}
													<a
														href={`${siteUrl}/privacy-policy`}
														style={s.footerLink}
													>
														Privacy
													</a>
													{" · "}
													<a
														href={`${siteUrl}/terms-and-conditions`}
														style={s.footerLink}
													>
														Terms
													</a>
													{" · © Quicktalog"}
												</p>
											</td>
										</tr>
									</tbody>
								</table>
							</td>
						</tr>
					</tbody>
				</table>
			</Body>
		</Html>
	);
}
