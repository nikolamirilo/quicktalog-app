import { Mail } from "lucide-react";
import Link from "next/link";

import { TextLink, textLinkClass } from "@/components/general/TextLink";
import { Button } from "@/components/ui/button";
import { footerDetails } from "@/constants/details";
import { type LegalDocumentKey, legalDocuments } from "@/constants/legal";

/** The closing "Questions about this policy?" box, linking the other documents. */
export function LegalContactBox({ current }: { current: LegalDocumentKey }) {
	const email = footerDetails.email;
	const others = legalDocuments.filter((document) => document.key !== current);

	return (
		<div className="mt-14 grid gap-4 rounded-product-panel border border-product-border bg-product-amber-panel px-[22px] py-6 shadow-product md:grid-cols-[auto_minmax(0,1fr)] md:gap-x-5 md:px-[30px] md:py-7">
			<span
				aria-hidden="true"
				className="grid size-12 place-items-center rounded-[15px] bg-product-primary text-product-foreground shadow-product-primary"
			>
				<Mail className="size-[22px]" />
			</span>
			<div>
				<h2 className="text-[21px] font-extrabold tracking-[-0.02em]">
					Questions about this policy?
				</h2>
				<p className="mt-1.5 text-[15.5px] leading-[1.6] text-product-foreground-accent">
					Email{" "}
					<a className={textLinkClass} href={`mailto:${email}`}>
						{email}
					</a>
					. We aim to respond to all support inquiries within 1 business day.
				</p>
				<p className="mt-1.5 text-sm text-product-muted">
					Also read:{" "}
					{others.map((document, index) => (
						<span key={document.key}>
							{index > 0 ? " · " : null}
							<TextLink href={document.href}>{document.name}</TextLink>
						</span>
					))}
				</p>
			</div>
			<div className="flex flex-wrap gap-2.5 md:col-start-2">
				<Button asChild className="w-full min-[480px]:w-auto">
					<a href={`mailto:${email}`}>
						<Mail aria-hidden="true" />
						Email us
					</a>
				</Button>
				<Button asChild className="w-full min-[480px]:w-auto" variant="outline">
					<Link href="/contact">Contact page</Link>
				</Button>
			</div>
		</div>
	);
}
