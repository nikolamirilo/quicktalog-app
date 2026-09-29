"use client";
import { NavLink } from "@/components/navigation/NavLink";
import type { NavItem } from "@/types/navigation";
import { useId } from "react";

type MobileNavSectionProps = {
	title: string;
	items: Pick<NavItem, "text" | "url" | "icon">[];
	onLinkClick: () => void;
};

/** A labelled group of links in the mobile sheet ("Product", "Resources", "More"). */
export const MobileNavSection = ({
	title,
	items,
	onLinkClick,
}: MobileNavSectionProps) => {
	const headingId = useId();

	return (
		<div
			aria-labelledby={headingId}
			className="flex flex-col gap-1"
			role="group"
		>
			<p
				className="mx-4 mb-0.5 mt-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-product-muted"
				id={headingId}
			>
				{title}
			</p>
			{items.map((item) => (
				<NavLink
					href={item.url}
					icon={item.icon}
					key={item.url}
					onClick={onLinkClick}
					variant="sheet"
				>
					{item.text}
				</NavLink>
			))}
		</div>
	);
};
