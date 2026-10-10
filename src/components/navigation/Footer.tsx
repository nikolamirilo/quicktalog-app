import { Container } from "@/components/general/Container";
import { NewsletterForm } from "@/components/navigation/NewsletterForm";
import { footerDetails, siteDetails } from "@/constants/details";
import {
	footerContactLink,
	footerLegalLinks,
	footerLinkColumns,
} from "@/constants/navigation";
import { getPlatformIconByName } from "@/constants/ui";
import type { ILinkItem } from "@/types/shared";
import { Globe, Linkedin, Mail } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

const socialTileClass =
	"grid h-11 w-11 place-items-center rounded-[14px] border border-product-border bg-product-card text-product-foreground-accent transition-[transform,color,box-shadow] duration-200 hover:-translate-y-[3px] hover:text-product-secondary hover:shadow-product [&_svg]:h-[21px] [&_svg]:w-[21px]";

const socialIcon = (platform: string): ReactNode =>
	platform === "linkedin" ? (
		<Linkedin aria-hidden="true" />
	) : (
		getPlatformIconByName(platform)
	);

/** Internal links go through next/link; files like the sitemap load directly. */
const FooterLink = ({
	link,
	className,
}: {
	link: ILinkItem;
	className: string;
}) =>
	link.url.endsWith(".xml") ? (
		<a className={className} href={link.url}>
			{link.text}
		</a>
	) : (
		<Link className={className} href={link.url}>
			{link.text}
		</Link>
	);

const FooterLinkColumn = ({
	title,
	links,
}: {
	title: string;
	links: ILinkItem[];
}) => (
	<div>
		<h2 className="mb-4 text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
		<ul className="flex flex-col gap-3">
			{links.map((link) => (
				<li key={link.url}>
					<FooterLink
						className="rounded-md text-product-foreground-accent transition-colors duration-200 hover:text-product-secondary"
						link={link}
					/>
				</li>
			))}
		</ul>
	</div>
);

export const Footer = () => {
	const year = new Date().getFullYear();

	return (
		<footer className="mt-12 border-t border-product-border bg-product-background-hero pb-[calc(32px+env(safe-area-inset-bottom))] pt-16 text-product-foreground">
			<Container>
				<div className="mb-12 grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-[1.2fr_1fr_1fr_1.3fr] md:gap-10">
					{/* Brand */}
					<div className="col-span-full md:col-span-1">
						<Link className="inline-block rounded-full" href="/">
							<img
								alt="Quicktalog Logo"
								className="h-11 w-auto"
								height={44}
								loading="lazy"
								src="/images/brand/logo.svg"
								width={121}
							/>
						</Link>
						<p className="mt-4 max-w-[320px] text-[16.5px] text-product-foreground-accent">
							{footerDetails.subheading}
						</p>
						<div className="mt-5 flex gap-3">
							{Object.entries(footerDetails.socials ?? {}).map(
								([platform, href]) =>
									href ? (
										<a
											aria-label={platform}
											className={socialTileClass}
											href={href}
											key={platform}
											rel="noopener noreferrer"
											target="_blank"
										>
											{socialIcon(platform)}
										</a>
									) : null,
							)}
							<a
								aria-label="Email us"
								className={socialTileClass}
								href={`mailto:${footerDetails.email}`}
							>
								<Mail aria-hidden="true" />
							</a>
							<a
								aria-label="Visit our website"
								className={socialTileClass}
								href={siteDetails.siteUrl}
								rel="noopener noreferrer"
								target="_blank"
							>
								<Globe aria-hidden="true" />
							</a>
						</div>
					</div>

					{footerLinkColumns.map((column) => (
						<FooterLinkColumn
							key={column.title}
							links={column.links}
							title={column.title}
						/>
					))}

					{/* Newsletter */}
					<div className="col-span-full md:col-span-1">
						<h2 className="mb-4 text-[17px] font-bold tracking-[-0.01em]">
							Stay Updated
						</h2>
						<p className="mb-3.5 text-[14.5px] text-product-foreground-accent">
							Subscribe to our newsletter for the latest updates and features.
						</p>
						<NewsletterForm />
						<Link
							className="mt-4 inline-flex items-center gap-2 border-b-2 border-product-primary/70 pb-0.5 font-semibold text-product-foreground transition-colors hover:text-product-primary-ink"
							href={footerContactLink.url}
						>
							<Mail
								aria-hidden="true"
								className="h-4 w-4 text-product-primary-ink"
							/>
							{footerContactLink.text}
						</Link>
					</div>
				</div>

				<div className="flex flex-col items-center gap-3.5 border-t border-product-border-strong pt-7 text-center text-sm text-product-foreground-accent md:flex-row md:justify-between md:text-left">
					<p>
						Copyright &copy; {year} {siteDetails.siteName}. All rights reserved.
					</p>
					<nav aria-label="Legal">
						<ul className="flex flex-wrap justify-center gap-x-[22px] gap-y-2">
							{footerLegalLinks.map((link) => (
								<li key={link.url}>
									<FooterLink
										className="transition-colors hover:text-product-secondary"
										link={link}
									/>
								</li>
							))}
						</ul>
					</nav>
				</div>
			</Container>
		</footer>
	);
};
