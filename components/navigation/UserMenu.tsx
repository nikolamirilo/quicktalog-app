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

	const initials =
		user.name
			.split(" ")
			.map((part) => part.trim()[0])
			.filter(Boolean)
			.slice(0, 2)
			.join("")
			.toUpperCase() || "Q";

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
				className="flex items-center justify-center w-9 h-9 rounded-full border border-product-border bg-product-background-hover text-product-foreground text-sm font-semibold overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
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
				className="bg-product-background border border-product-border rounded-xl shadow-lg min-w-56"
			>
				<DropdownMenuLabel className="text-product-foreground">
					<span className="block font-semibold">{user.name}</span>
					{user.email && (
						<span className="block text-xs text-product-foreground-accent font-normal">
							{user.email}
						</span>
					)}
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem asChild>
					<Link
						className="flex items-center gap-2 cursor-pointer"
						href="/admin/dashboard"
						onClick={onNavigate}
					>
						<FiGrid size={16} />
						Dashboard
					</Link>
				</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Link
						className="flex items-center gap-2 cursor-pointer"
						href={accountHref}
						onClick={onNavigate}
					>
						<FiUser size={16} />
						Account
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="flex items-center gap-2 cursor-pointer"
					disabled={signingOut}
					onClick={handleSignOut}
				>
					<FiLogOut size={16} />
					{signingOut ? "Signing out…" : "Sign out"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export default UserMenu;
