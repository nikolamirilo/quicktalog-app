"use client";
import { mobileHomeLink, navLinks, navMenus } from "@/constants/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import { GiHamburgerMenu } from "react-icons/gi";
import AuthLinks from "./AuthLinks";
import MobileNavSection from "./MobileNavSection";
import NavDropdown from "./NavDropdown";
import { MobileNavLink, NavLink } from "./NavLink";

const Navbar = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const [openMenu, setOpenMenu] = useState<string | null>(null);
	const [openMobileMenu, setOpenMobileMenu] = useState<string | null>(null);
	const pathname = usePathname();

	// A hash link keeps the same pathname, so close the menus on every click too.
	useEffect(() => {
		setMobileOpen(false);
		setOpenMenu(null);
		setOpenMobileMenu(null);
	}, [pathname]);

	const toggleMenu = useCallback((label: string) => {
		setOpenMenu((current) => (current === label ? null : label));
	}, []);

	const closeMenu = useCallback(() => setOpenMenu(null), []);

	const toggleMobileMenu = useCallback((label: string) => {
		setOpenMobileMenu((current) => (current === label ? null : label));
	}, []);

	const closeMobile = useCallback(() => {
		setMobileOpen(false);
		setOpenMobileMenu(null);
	}, []);

	return (
		<nav className="w-full flex items-center justify-between px-4 sm:px-6 font-lora py-2 sm:py-3 bg-product-background shadow-lg border-b border-gray-100 fixed top-0 left-0 z-50">
			<div className="flex items-center gap-2 sm:gap-3">
				<Link href="/">
					<img
						alt="Quicktalog Logo"
						className="h-[7vh] w-auto rounded-full"
						fetchPriority="high"
						height={160}
						src="/images/brand/logo.svg"
						style={{ width: "auto", height: "7vh" }}
						width={160}
					/>
				</Link>
			</div>

			{/* Desktop links */}
			<div className="hidden lg:flex items-center gap-2">
				{navMenus.map((menu) => (
					<NavDropdown
						isOpen={openMenu === menu.label}
						key={menu.label}
						menu={menu}
						onClose={closeMenu}
						onToggle={toggleMenu}
					/>
				))}

				{navLinks.map((link) => (
					<NavLink href={link.url} icon={link.icon} key={link.url}>
						{link.text}
					</NavLink>
				))}

				<AuthLinks />
			</div>

			{/* Hamburger for mobile */}
			<div className="lg:hidden flex items-center">
				<button
					aria-label="Open menu"
					className="p-2"
					onClick={() => setMobileOpen((v) => !v)}
				>
					<GiHamburgerMenu className="text-product-foreground" size={22} />
				</button>
			</div>

			{/* Mobile menu overlay */}
			{mobileOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
					onClick={closeMobile}
				/>
			)}

			{/* Mobile menu */}
			<div
				className={`mobile-menu fixed flex flex-col top-0 right-0 h-screen w-80 bg-product-background  z-50 transform transition-transform duration-300 ease-in-out ${
					mobileOpen ? "translate-x-0" : "translate-x-full"
				}`}
				style={{ willChange: "transform" }}
			>
				{/* Mobile menu header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100">
					<span className="font-bold text-base sm:text-lg text-black">
						Menu
					</span>
					<button
						aria-label="Close menu"
						className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 transition-colors"
						onClick={closeMobile}
					>
						<FiX className="text-product-foreground" size={20} />
					</button>
				</div>

				{/* Mobile menu items */}
				<div className="flex flex-col p-4 sm:p-6 gap-2 sm:gap-3 overflow-y-auto">
					<MobileNavLink
						href={mobileHomeLink.url}
						icon={mobileHomeLink.icon}
						onClick={closeMobile}
					>
						{mobileHomeLink.text}
					</MobileNavLink>

					{navMenus.map((menu) => (
						<MobileNavSection
							isOpen={openMobileMenu === menu.label}
							key={menu.label}
							menu={menu}
							onLinkClick={closeMobile}
							onToggle={toggleMobileMenu}
						/>
					))}

					{navLinks.map((link) => (
						<MobileNavLink
							href={link.url}
							icon={link.icon}
							key={link.url}
							onClick={closeMobile}
						>
							{link.text}
						</MobileNavLink>
					))}

					<AuthLinks isMobile onLinkClick={closeMobile} />
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
