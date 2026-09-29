"use client";
import { cn } from "@/lib/ui/cn";
import type { NavIcon } from "@/types/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Pill styles shared by nav links and the dropdown triggers. */
export const navPillBase =
	"inline-flex items-center gap-2 rounded-full border border-transparent text-product-foreground-accent transition-colors duration-200 hover:bg-product-background-hero hover:text-product-foreground [&_svg]:shrink-0";
export const navPillActive =
	"border-product-primary/55 bg-product-primary-soft font-bold text-product-foreground hover:bg-product-primary-soft";

/** Size of each nav pill: the desktop bar (40px) or a full-width mobile sheet row (48px). */
export const navPillSizes = {
	bar: "h-10 px-3.5 text-[15px] font-medium",
	sheet: "h-12 w-full px-4 text-base font-medium",
} as const;

/** A hash link (`/#faq`) points into a page, so it never marks itself active. */
export function isActivePath(pathname: string | null, href: string) {
	if (!pathname || href.includes("#")) return false;
	if (href === "/") return pathname === "/";
	return pathname === href || pathname.startsWith(`${href}/`);
}

type NavLinkProps = {
	href: string;
	children: ReactNode;
	icon?: NavIcon;
	/** `bar`: desktop navbar pill. `sheet`: mobile sheet row. */
	variant?: keyof typeof navPillSizes;
	className?: string;
	onClick?: () => void;
};

/** Navbar link pill; marks itself `aria-current="page"` on its route. */
export const NavLink = ({
	href,
	children,
	icon: Icon,
	variant = "bar",
	className,
	onClick,
}: NavLinkProps) => {
	const pathname = usePathname();
	const isActive = isActivePath(pathname, href);

	return (
		<Link
			aria-current={isActive ? "page" : undefined}
			className={cn(
				navPillBase,
				navPillSizes[variant],
				isActive && navPillActive,
				className,
			)}
			href={href}
			onClick={onClick}
		>
			{Icon && <Icon className="h-4 w-4" />}
			{children}
		</Link>
	);
};
