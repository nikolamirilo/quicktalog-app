"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authLinks } from "@/constants/navigation";
import { type AuthUser, useAuth } from "@/context/AuthContext";
import { useSignOut } from "@/hooks/useSignOut";
import { cn } from "@/lib/ui/cn";
import { initialsFrom } from "@/lib/users/initials";
import { LayoutDashboard, LogOut, User } from "lucide-react";
import Link from "next/link";

/** 42px amber avatar: the user's photo, or their initials. */
export function UserAvatar({
	user,
	className,
}: {
	user: AuthUser;
	className?: string;
}) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"grid h-[42px] w-[42px] flex-none place-items-center overflow-hidden rounded-full border-2 border-product-primary bg-product-primary-soft font-product-heading text-sm font-extrabold leading-none tracking-[0.02em] text-product-foreground transition-colors",
				className,
			)}
		>
			{user.imageUrl ? (
				<img
					alt=""
					className="h-full w-full object-cover"
					referrerPolicy="no-referrer"
					src={user.imageUrl}
				/>
			) : (
				initialsFrom(user.name)
			)}
		</span>
	);
}

const itemClass =
	"h-10 min-h-10 gap-2.5 rounded-[12px] px-3 text-[14.5px] font-medium text-product-foreground-accent focus:bg-product-background-hero focus:text-product-foreground [&_svg]:size-4";

/**
 * The signed-in user's menu. Replaces Clerk's `<UserButton/>`, which could only
 * ever render Clerk's own account UI and would have had to be swapped during
 * the cutover; this reads `useAuth()` and works with whichever provider is live.
 */
export function UserMenu() {
	const { user, accountHref } = useAuth();
	const { signingOut, handleSignOut } = useSignOut();

	if (!user) return null;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label={`Account menu, ${user.name}`}
				className="group grid cursor-pointer place-items-center rounded-full"
			>
				<UserAvatar
					className="group-hover:bg-product-primary group-data-[state=open]:bg-product-primary"
					user={user}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="z-[52] w-[250px] rounded-[20px] p-2"
				sideOffset={12}
			>
				<DropdownMenuLabel className="px-3 pb-2.5 pt-2 font-normal">
					<span className="block truncate font-product-heading text-[15px] font-bold leading-[1.3] text-product-foreground">
						{user.name}
					</span>
					{user.email && (
						<span className="block truncate text-[13px] text-product-muted">
							{user.email}
						</span>
					)}
				</DropdownMenuLabel>
				<DropdownMenuItem asChild className={itemClass}>
					<Link href={authLinks.dashboard}>
						<LayoutDashboard aria-hidden="true" />
						Dashboard
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild className={itemClass}>
					<Link href={accountHref}>
						<User aria-hidden="true" />
						Account
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator className="mx-1 my-1.5 bg-product-border" />
				<DropdownMenuItem
					className={itemClass}
					disabled={signingOut}
					onSelect={handleSignOut}
				>
					<LogOut aria-hidden="true" />
					{signingOut ? "Signing out…" : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
