import {
	ArrowRight,
	BookOpen,
	Mail,
	MessageSquare,
	type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import { IconTile } from "@/components/general/IconTile";
import { Section } from "@/components/general/Section";
import { footerDetails } from "@/constants/details";
import { getAllDocs } from "@/lib/content/docs";

type Card = {
	icon: LucideIcon;
	title: string;
	body: string;
	action: string;
	href: string;
};

const numberWords = [
	"Zero",
	"One",
	"Two",
	"Three",
	"Four",
	"Five",
	"Six",
	"Seven",
	"Eight",
	"Nine",
	"Ten",
	"Eleven",
	"Twelve",
];

/** "Eight" for small counts, digits beyond twelve. */
const countWord = (count: number) => numberWords[count] ?? String(count);

/** "Still need help?" cards: contact form, docs, and email. */
export function SupportCards() {
	const email = footerDetails.email;
	const lessons = getAllDocs().length;
	const cards: Card[] = [
		{
			icon: MessageSquare,
			title: "Contact us",
			body: "Send us a message about pricing, a custom plan, a feature request or anything else.",
			action: "Open the contact form",
			href: "/contact",
		},
		{
			icon: BookOpen,
			title: "Read the docs",
			body: `${countWord(lessons)} short ${lessons === 1 ? "lesson" : "lessons"}, from a new account to a live catalogue you can share.`,
			action: "Browse the docs",
			href: "/docs",
		},
		{
			icon: Mail,
			title: "Email support",
			body: `Prefer your inbox? Write to ${email} and we will get back to you.`,
			action: email,
			href: `mailto:${email}`,
		},
	];

	return (
		<Section
			description="Our team typically responds within 1 business day."
			eyebrow="Support"
			title="Still need help?"
		>
			<div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3 lg:gap-[22px]">
				{cards.map((card) => {
					const Icon = card.icon;
					return (
						<Link
							className="group flex flex-col gap-2.5 rounded-product-card border border-product-border bg-product-card px-[22px] py-6 text-product-foreground shadow-product transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-product-hover"
							href={card.href}
							key={card.title}
						>
							<IconTile className="group-hover:border-product-primary group-hover:bg-product-primary group-hover:text-product-foreground">
								<Icon />
							</IconTile>
							<h3 className="mt-1.5 text-[19px] font-bold tracking-[-0.015em]">
								{card.title}
							</h3>
							<p className="text-[15px] leading-[1.6] text-product-foreground-accent">
								{card.body}
							</p>
							<span className="mt-auto inline-flex items-center gap-1.5 break-all pt-1.5 text-[14.5px] font-bold">
								{card.action}
								<ArrowRight
									aria-hidden="true"
									className="h-[15px] w-[15px] flex-none transition-transform duration-200 group-hover:translate-x-[3px]"
								/>
							</span>
						</Link>
					);
				})}
			</div>
		</Section>
	);
}
