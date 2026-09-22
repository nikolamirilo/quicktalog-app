"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FiGrid, FiLogOut, FiUser } from "react-icons/fi";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { initialsFrom } from "@/lib/users/initials";

/**
 * The signed-in user's menu. Replaces Clerk's `<UserButton/>`, which could only
 * ever render Clerk's own account UI and would have had to be swapped during
 * the cutover; this reads `useAuth()` and works with whichever provider is live.
 */
export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
	const { user, accountHref, signOut } = useAuth();
	const router = useRouter();
	const [signingOut, setSigningOut] = useState(false);

	if (!user) return null;

	const initials = initialsFrom(user.name);

	const handleSignOut = async () => {
		setSigningOut(true);
		try {
			await signOut();
			router.push("/");
		} finally {
			setSigningOut(false);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				aria-label="Account menu"
				className="flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-product-primary ring-offset-2 ring-offset-product-background bg-product-background-hover text-product-foreground text-xs font-semibold overflow-hidden cursor-pointer hover:ring-product-primary-accent hover:shadow-md transition-all duration-200"
			>
				{user.imageUrl ? (
					<img
						alt=""
						className="w-full h-full object-cover"
						referrerPolicy="no-referrer"
						src={user.imageUrl}
					/>
				) : (
					initials
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="bg-product-background border border-product-border rounded-xl shadow-lg min-w-52 p-1 text-sm"
				sideOffset={8}
			>
				<DropdownMenuLabel className="px-2 py-1.5 text-product-foreground">
					<span className="block truncate text-sm font-semibold leading-tight">
						{user.name}
					</span>
					{user.email && (
						<span className="mt-0.5 block truncate text-xs font-normal text-product-foreground-accent">
							{user.email}
						</span>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="my-1" />
				<DropdownMenuItem asChild>
					<Link
						className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
						href="/admin/dashboard"
						onClick={onNavigate}
					>
						<FiGrid className="shrink-0 opacity-70" size={15} />
						Dashboard
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link
						className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
						href={accountHref}
						onClick={onNavigate}
					>
						<FiUser className="shrink-0 opacity-70" size={15} />
						Account
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator className="my-1" />
				<DropdownMenuItem
					className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm"
					disabled={signingOut}
					onClick={handleSignOut}
				>
					<FiLogOut className="shrink-0 opacity-70" size={15} />
					{signingOut ? "Signing out…" : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default UserMenu;
