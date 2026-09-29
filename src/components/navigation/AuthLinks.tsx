"use client";
import {
	NavLink,
	navPillBase,
	navPillSizes,
} from "@/components/navigation/NavLink";
import { UserAvatar, UserMenu } from "@/components/navigation/UserMenu";
import { Button } from "@/components/ui/button";
import { authLinks } from "@/constants/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSignOut } from "@/hooks/useSignOut";
import { cn } from "@/lib/ui/cn";
import { LayoutDashboard, LogOut, User, UserPlus } from "lucide-react";
import Link from "next/link";

type AuthLinksProps = {
	/**
	 * `desktop`: Log In / Start free, or Dashboard + avatar menu.
	 * `mobile-cta`: the single "Start free" button beside the burger.
	 * `sheet`: the auth block at the bottom of the mobile sheet.
	 */
	variant?: "desktop" | "mobile-cta" | "sheet";
	onLinkClick?: () => void;
};

/**
 * The auth corner of the navbar. It reads the client-side auth state only, so
 * public and ISR pages never touch cookies; until that state is known it holds
 * the logged-out width so the bar does not jump.
 */
export const AuthLinks = ({
	variant = "desktop",
	onLinkClick,
}: AuthLinksProps) => {
	const { isSignedIn, user, isLoaded, accountHref } = useAuth();
	const { signingOut, handleSignOut } = useSignOut();

	if (variant === "mobile-cta") {
		if (isLoaded && isSignedIn) return null;
		return (
			<Button
				asChild
				className={cn("h-10 px-4 text-sm", !isLoaded && "invisible")}
				tabIndex={isLoaded ? undefined : -1}
			>
				<Link href={authLinks.signup} onClick={onLinkClick}>
					Start free
				</Link>
			</Button>
		);
	}

	if (variant === "sheet") {
		if (!isLoaded) {
			return (
				<div
					aria-hidden="true"
					className="mt-1.5 grid grid-cols-2 gap-2 border-t border-product-border pt-3"
				>
					<div className="h-[46px] animate-pulse rounded-full bg-product-background-hero" />
					<div className="h-[46px] animate-pulse rounded-full bg-product-background-hero" />
				</div>
			);
		}

		if (isSignedIn && user) {
			return (
				<div className="mt-1.5 flex flex-col gap-1 border-t border-product-border pt-2.5">
					<NavLink
						href={authLinks.dashboard}
						icon={LayoutDashboard}
						onClick={onLinkClick}
						variant="sheet"
					>
						Dashboard
					</NavLink>
					<div className="flex items-center gap-3 px-4 py-2">
						<UserAvatar user={user} />
						<span className="min-w-0">
							<span className="block truncate font-product-heading text-[15px] font-bold leading-[1.3]">
								{user.name}
							</span>
							{user.email && (
								<span className="block truncate text-[13px] text-product-muted">
									{user.email}
								</span>
							)}
						</span>
					</div>
					<NavLink
						href={accountHref}
						icon={User}
						onClick={onLinkClick}
						variant="sheet"
					>
						Account
					</NavLink>
					<button
						className={cn(
							navPillBase,
							navPillSizes.sheet,
							"cursor-pointer disabled:opacity-50",
						)}
						disabled={signingOut}
						onClick={async () => {
							onLinkClick?.();
							await handleSignOut();
						}}
						type="button"
					>
						<LogOut aria-hidden="true" className="h-4 w-4" />
						{signingOut ? "Signing out…" : "Sign out"}
					</button>
				</div>
			);
		}

		return (
			<div className="mt-1.5 grid grid-cols-2 gap-2 border-t border-product-border pt-3">
				<Button asChild className="h-[46px] px-4" variant="outline">
					<Link href={authLinks.login} onClick={onLinkClick}>
						<User aria-hidden="true" />
						Log In
					</Link>
				</Button>
				<Button asChild className="h-[46px] px-4">
					<Link href={authLinks.signup} onClick={onLinkClick}>
						<UserPlus aria-hidden="true" />
						Start free
					</Link>
				</Button>
			</div>
		);
	}

	if (!isLoaded) {
		// Same footprint as the logged-out buttons (the common case on public pages).
		return <div aria-hidden="true" className="ml-2.5 h-[42px] w-[236px]" />;
	}

	if (isSignedIn) {
		return (
			<div className="ml-2.5 flex items-center gap-1.5">
				<NavLink href={authLinks.dashboard} icon={LayoutDashboard}>
					Dashboard
				</NavLink>
				<UserMenu />
			</div>
		);
	}

	return (
		<div className="ml-2.5 flex items-center gap-2">
			<Button
				asChild
				className="h-[42px] px-[18px] text-[14.5px]"
				variant="outline"
			>
				<Link href={authLinks.login}>
					<User aria-hidden="true" />
					Log In
				</Link>
			</Button>
			<Button asChild className="h-[42px] px-[18px] text-[14.5px]">
				<Link href={authLinks.signup}>
					<UserPlus aria-hidden="true" />
					Start free
				</Link>
			</Button>
		</div>
	);
};
