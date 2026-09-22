"use client";
import { Button } from "@/components/ui/button";
import { MobileNavLinkProps, NavLinkProps } from "@/types/components";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const NavLink = ({
	href,
	children,
	icon: Icon,
	className = "",
}: NavLinkProps) => {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link href={href}>
			<Button
				className={`${isActive ? "font-bold !bg-product-background-hover !text-product-nav-active !border !border-product-primary shadow-sm hover:scale-[1.03] hover:transform" : "font-medium"} ${className}`}
				variant="nav"
			>
				{Icon && <Icon className="w-4 h-4" />}
				{children}
			</Button>
		</Link>
	);
};

export const MobileNavLink = ({
	href,
	children,
	icon: Icon,
	onClick,
}: MobileNavLinkProps) => {
	const pathname = usePathname();
	const isActive = pathname === href;

	return (
		<Link href={href} onClick={onClick}>
			<button
				className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 ${
					isActive
						? "bg-product-background-hover text-product-primary border border-product-primary shadow-sm font-semibold"
						: "hover:bg-product-nav-hover-bg hover:text-product-nav-hover-text hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] border border-transparent hover:border-product-nav-hover-border hover:font-bold"
				}`}
			>
				{Icon && (
					<Icon
						className={`${isActive ? "text-product-primary" : "text-gray-600"} sm:w-5 sm:h-5`}
						size={18}
					/>
				)}
				<span
					className={`font-medium text-sm sm:text-base ${isActive ? "text-product-primary" : "text-product-foreground"}`}
				>
					{children}
				</span>
			</button>
		</Link>
	);
};
