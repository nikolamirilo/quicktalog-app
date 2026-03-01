"use client";
import SmartLink from "@/components/general/SmartLink";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import Link from "next/link";
import React from "react";

interface ContactLink {
	href: string;
	icon: React.ReactNode;
	label: string;
	className: string;
}

interface CtaProps {
	href: string;
	label: string;
	shortLabel?: string;
	icon: React.ReactNode;
	ariaLabel: string;
}

interface CatalogueSidebarProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	contactLinks: ContactLink[];
	ctaProps: CtaProps | null;
	themeClass: string;
}

const CatalogueSidebar: React.FC<CatalogueSidebarProps> = ({
	isOpen,
	onOpenChange,
	contactLinks,
	ctaProps,
	themeClass,
}) => {
	return (
		<Sheet open={isOpen} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<Menu className="w-8 h-8" />
			</SheetTrigger>

			<SheetContent
				side="right"
				className={`z-[100] w-[300px] sm:w-[400px] bg-catalogue-navigation-background border-catalogue-card-border p-6 flex flex-col gap-6 ${themeClass}`}
				closeClassName="text-catalogue-navigation-text hover:text-catalogue-navigation-text border-none outline-none"
			>
				<SheetTitle className="sr-only">Mobile Menu</SheetTitle>
				<div className="flex flex-col gap-4 mt-8">
					{contactLinks.length > 0 && (
						<div className="flex flex-col gap-3">
							<h4 className="text-sm font-semibold text-catalogue-navigation-text opacity-70 uppercase tracking-wider">
								Contact Us
							</h4>
							{contactLinks.map((linkProps, index) => (
								<Link
									aria-label={linkProps.label}
									className="flex items-center gap-3 w-full p-3 rounded-lg border border-catalogue-card-border hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-catalogue-navigation-text"
									href={linkProps.href}
									key={`mobile-contact-${index}`}
									onClick={() => onOpenChange(false)}
								>
									<div className="shrink-0">{linkProps.icon}</div>
									<span className="text-sm font-medium break-all">
										{linkProps.label}
									</span>
								</Link>
							))}
						</div>
					)}
					{ctaProps && (
						<Button
							asChild
							className="w-full font-heading tracking-heading transition-all duration-200 border text-catalogue-navigation-text border-primary footer-cta-button"
							size="lg"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							<SmartLink
								aria-label={ctaProps.ariaLabel}
								className="flex items-center justify-center w-full"
								href={ctaProps.href}
							>
								{ctaProps.icon}
								<span>{ctaProps.label}</span>
							</SmartLink>
						</Button>
					)}
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default CatalogueSidebar;
