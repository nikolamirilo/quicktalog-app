"use client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { UserMenu } from "./UserMenu";
import Link from "next/link";
import React from "react";
import { FiUser, FiUserPlus } from "react-icons/fi";
import { MdOutlineDashboard } from "react-icons/md";
import { MobileNavLink, NavLink } from "./NavLink";

interface AuthLinksProps {
	isMobile?: boolean;
	onLinkClick?: () => void;
}

const AuthLinks: React.FC<AuthLinksProps> = ({ isMobile, onLinkClick }) => {
	const { isSignedIn, user, isLoaded } = useAuth();

	if (!isLoaded) {
		if (isMobile) {
			return (
				<div className="border-t border-product-border pt-3 sm:pt-4 mt-3 sm:mt-4">
					<div className="w-full h-10 bg-product-background-hover animate-pulse rounded mb-2"></div>
					<div className="w-full h-10 bg-product-background-hover animate-pulse rounded"></div>
				</div>
			);
		}
		return (
			<div className="ml-3 flex items-center gap-2">
				<div className="w-20 h-9 bg-product-background-hover animate-pulse rounded"></div>
				<div className="w-20 h-9 bg-product-background-hover animate-pulse rounded"></div>
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
								icon={MdOutlineDashboard}
								onClick={onLinkClick}
							>
								Dashboard
							</MobileNavLink>
							<div className="w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left border border-transparent">
								<FiUser
									className="text-product-foreground-accent sm:w-5 sm:h-5 flex-shrink-0"
									size={18}
								/>
								<span className="text-product-foreground font-medium text-sm sm:text-base flex-1 text-left">
									{user?.name ?? "Account"}
								</span>
								<div className="flex-shrink-0">
									<UserMenu onNavigate={onLinkClick} />
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
									Log In
								</Button>
							</Link>
							<Link href="/auth?mode=signup" onClick={onLinkClick}>
								<Button className="w-full bg-product-primary text-product-foreground  hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9">
									<FiUserPlus className="w-4 h-4" />
									Start free
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
					<NavLink href="/admin/dashboard" icon={MdOutlineDashboard}>
						Dashboard
					</NavLink>
					<div className="ml-2 flex items-center gap-1">
						<UserMenu />
					</div>
				</>
			) : (
				<>
					<Link href="/auth">
						<Button className="bg-product-background text-product-foreground border-2 border-product-primary hover:bg-product-primary hover:text-white hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9">
							<FiUser className="w-4 h-4" />
							Log In
						</Button>
					</Link>
					<Link href="/auth?mode=signup">
						<Button className="bg-product-primary text-product-foreground  hover:shadow-lg hover:scale-[1.03] hover:transform hover:-translate-y-[2px] transition-all duration-200 font-semibold text-sm px-3 py-2 h-9">
							<FiUserPlus className="w-4 h-4" />
							Start free
						</Button>
					</Link>
				</>
			)}
		</div>
	);
};

export default AuthLinks;
