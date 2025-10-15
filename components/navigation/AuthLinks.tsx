"use client";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { FiGrid, FiUser, FiUserPlus } from "react-icons/fi";
import { MobileNavLink, NavLink } from "./Navbar"; // Assuming NavLink and MobileNavLink are exported from Navbar.tsx

interface AuthLinksProps {
	isMobile?: boolean;
	onLinkClick?: () => void;
}

const AuthLinks: React.FC<AuthLinksProps> = ({ isMobile, onLinkClick }) => {
	const { isSignedIn, user } = useUser();
	const [isMounted, setIsMounted] = useState(false);

	useEffect(() => {
		setIsMounted(true);
	}, []);

	// Don't render anything until the component is mounted on the client
	if (!isMounted) {
		if (isMobile) {
			return (
				<div className="border-t border-product-border pt-3 sm:pt-4 mt-3 sm:mt-4">
					<div className="w-full h-10 bg-product-hover-background animate-pulse rounded mb-2"></div>
					<div className="w-full h-10 bg-product-hover-background animate-pulse rounded"></div>
				</div>
			);
		}
		return (
			<div className="ml-3 flex items-center gap-2">
				<div className="w-20 h-9 bg-product-hover-background animate-pulse rounded"></div>
				<div className="w-20 h-9 bg-product-hover-background animate-pulse rounded"></div>
			</div>
		);
	}

	if (isMobile) {
		return (
			<>
				{isSignedIn ? (
					<>
						<div className="border-t border-product-border pt-3 sm:pt-4 mt-3 sm:mt-4">
							<MobileNavLink
								href="/admin/dashboard"
								icon={FiGrid}
								onClick={onLinkClick}
							>
								Dashboard
							</MobileNavLink>
							<div
								onClick={() => {
									const userButton = document.querySelector(
										".cl-userButtonBox",
									) as HTMLElement;
									if (userButton) {
										userButton.click();
									}
								}}
								className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 hover:bg-navbar-button-hover-bg hover:text-navbar-button-hover-text hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] border border-transparent hover:border-navbar-button-hover-border hover:font-bold cursor-pointer"
							>
								<FiUser
									size={18}
									className="text-product-foreground-accent sm:w-5 sm:h-5 flex-shrink-0"
								/>
								<span className="text-product-foreground font-medium text-sm sm:text-base flex-1 text-left">
									{user?.firstName
										? `${user.firstName} ${user.lastName || ""}`
										: "Account"}
								</span>
								<div className="flex-shrink-0 pointer-events-none">
									<UserButton
										appearance={{
											elements: {
												userButtonBox: "w-8 h-8 sm:w-10 sm:h-10 cursor-pointer",
												userButtonPopoverCard: "mobile-menu-dropdown",
												userButtonPopoverCardRoot: "mobile-menu-dropdown-root",
											},
										}}
									/>
								</div>
							</div>
						</div>
					</>
				) : (
					<>
						<div className="border-t border-product-border pt-3 sm:pt-4 mt-3 sm:mt-4">
							<Link href="/auth" onClick={onLinkClick}>
								<Button className="w-full bg-product-background text-product-foreground border-2 border-product-primary hover:bg-product-primary hover:text-white hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9 mb-2 sm:mb-3">
									<FiUser className="w-4 h-4" />
									Sign In
								</Button>
							</Link>
							<Link href="/auth?mode=signup" onClick={onLinkClick}>
								<Button className="w-full bg-product-primary text-product-foreground hover:bg-primary-accent hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9">
									<FiUserPlus className="w-4 h-4" />
									Sign Up
								</Button>
							</Link>
						</div>
					</>
				)}
			</>
		);
	}

	return (
		<div className="ml-3 flex items-center gap-2">
			{isSignedIn ? (
				<>
					<NavLink href="/admin/dashboard" icon={FiGrid}>
						Dashboard
					</NavLink>
					<div className="ml-2 flex items-center gap-1">
						<UserButton />
					</div>
				</>
			) : (
				<>
					<Link href="/auth">
						<Button className="bg-product-background text-product-foreground border-2 border-product-primary hover:bg-product-primary hover:text-white hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9">
							<FiUser className="w-4 h-4" />
							Sign In
						</Button>
					</Link>
					<Link href="/auth?mode=signup">
						<Button className="bg-product-primary text-product-foreground hover:bg-primary-accent hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9">
							<FiUserPlus className="w-4 h-4" />
							Sign Up
						</Button>
					</Link>
				</>
			)}
		</div>
	);
};

export default AuthLinks;
