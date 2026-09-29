"use client";

import {
	ArrowRight,
	BookOpen,
	Check,
	Copy,
	ExternalLink,
	HelpCircle,
	Linkedin,
	Mail,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useEffect, useState } from "react";

import { IconTile } from "@/components/general/IconTile";
import { Button } from "@/components/ui/button";
import { footerDetails } from "@/constants/details";
import { cn } from "@/lib/ui/cn";

const cardClass =
	"flex items-start gap-3.5 rounded-product-card border border-product-border bg-product-card p-[18px] text-product-foreground shadow-product";

function LinkCard({
	href,
	icon,
	title,
	description,
	external,
}: {
	href: string;
	icon: ReactNode;
	title: string;
	description: string;
	external?: boolean;
}) {
	const body = (
		<>
			<IconTile className="h-11 w-11" size="md">
				{icon}
			</IconTile>
			<div className="min-w-0 flex-1">
				<h2 className="text-[17px] font-bold tracking-[-0.01em]">{title}</h2>
				<p className="mt-[3px] text-sm leading-normal text-product-foreground-accent">
					{description}
				</p>
			</div>
			{external ? (
				<ExternalLink
					aria-hidden="true"
					className="mt-1 h-[17px] w-[17px] flex-none text-product-muted transition-[transform,color] group-hover:translate-x-[3px] group-hover:text-product-primary-ink"
				/>
			) : (
				<ArrowRight
					aria-hidden="true"
					className="mt-1 h-[17px] w-[17px] flex-none text-product-muted transition-[transform,color] group-hover:translate-x-[3px] group-hover:text-product-primary-ink"
				/>
			)}
		</>
	);
	const className = cn(
		cardClass,
		"group transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-product-hover",
	);
	return external ? (
		<a
			className={className}
			href={href}
			rel="noopener noreferrer"
			target="_blank"
		>
			{body}
			<span className="sr-only">(opens in a new tab)</span>
		</a>
	) : (
		<Link className={className} href={href}>
			{body}
		</Link>
	);
}

/** Other ways to reach us, beside the contact form. */
export function ContactAside() {
	const [copied, setCopied] = useState(false);
	const email = footerDetails.email;

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 2500);
		return () => clearTimeout(timer);
	}, [copied]);

	const copyEmail = async () => {
		try {
			await navigator.clipboard.writeText(email);
			setCopied(true);
		} catch {
			// Clipboard blocked: the address stays selectable on the card.
		}
	};

	return (
		<aside aria-label="Other ways to reach us" className="flex flex-col gap-3">
			<div className={cardClass}>
				<IconTile className="h-11 w-11" size="md">
					<Mail />
				</IconTile>
				<div className="min-w-0 flex-1">
					<h2 className="text-[17px] font-bold tracking-[-0.01em]">Email us</h2>
					<p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-2">
						<a
							className="select-all break-all text-[15.5px] font-bold text-product-foreground hover:text-product-primary-ink"
							href={`mailto:${email}`}
						>
							{email}
						</a>
						<Button
							aria-describedby="contact-copy-note"
							className={cn(
								"h-8 px-3 text-[13px]",
								copied &&
									"border-product-success-bright bg-product-success-soft text-product-success hover:border-product-success-bright hover:bg-product-success-soft",
							)}
							onClick={copyEmail}
							size="sm"
							variant="secondary"
						>
							{copied ? (
								<Check aria-hidden="true" />
							) : (
								<Copy aria-hidden="true" />
							)}
							{copied ? "Copied" : "Copy"}
						</Button>
					</p>
					<p
						aria-live="polite"
						className="mt-[3px] text-sm leading-normal text-product-foreground-accent"
						id="contact-copy-note"
					>
						{copied
							? "Email address copied to your clipboard."
							: "We usually reply within 1 business day."}
					</p>
				</div>
			</div>
			<LinkCard
				description="Follow product updates and news."
				external
				href={footerDetails.socials.linkedin}
				icon={<Linkedin />}
				title="LinkedIn"
			/>
			<LinkCard
				description="Answers to common questions about plans, sharing and the builder."
				href="/help"
				icon={<HelpCircle />}
				title="Help Center"
			/>
			<LinkCard
				description="Step-by-step guides from your first catalogue to analytics."
				href="/docs"
				icon={<BookOpen />}
				title="Docs"
			/>
			<div className="rounded-product-card border border-product-border bg-product-amber-strip p-[18px]">
				<h2 className="text-[17px] font-bold">Need a custom plan?</h2>
				<p className="mt-1 text-sm text-product-foreground-accent">
					Higher limits or a feature built for you. Choose "Custom Plan" as the
					subject and tell us what you need.
				</p>
			</div>
		</aside>
	);
}
