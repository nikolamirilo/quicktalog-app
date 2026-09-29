"use client";
import { AuthLinks } from "@/components/navigation/AuthLinks";
import { inertOutside } from "@/components/navigation/inertOutside";
import { MobileNavSection } from "@/components/navigation/MobileNavSection";
import { NavDropdown } from "@/components/navigation/NavDropdown";
import { NavLink } from "@/components/navigation/NavLink";
import { mobileHomeLink, navLinks, navMenus } from "@/constants/navigation";
import { cn } from "@/lib/ui/cn";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const SHEET_ID = "nav-sheet";
/** The `lg` breakpoint, where the sheet gives way to the desktop menus. */
const DESKTOP_QUERY = "(min-width: 960px)";

/**
 * Public and app navbar: a floating translucent pill. Desktop (lg, 960px+)
 * shows the dropdowns, Pricing and the auth corner; smaller screens get
 * "Start free" and a burger that opens a sheet under the bar.
 */
export const Navbar = () => {
	const pathname = usePathname();
	const [scrolled, setScrolled] = useState(false);
	const [sheetOpen, setSheetOpen] = useState(false);
	const [openMenu, setOpenMenu] = useState<string | null>(null);
	const rootRef = useRef<HTMLDivElement>(null);
	const sheetRef = useRef<HTMLDivElement>(null);
	const burgerRef = useRef<HTMLButtonElement>(null);

	// A hash link keeps the same pathname, so links also close menus on click.
	useEffect(() => {
		setSheetOpen(false);
		setOpenMenu(null);
	}, [pathname]);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const closeSheet = useCallback(() => setSheetOpen(false), []);

	// While the sheet is open it behaves like a modal: focus moves into it, the
	// page behind stops scrolling and is inert, and Esc closes it.
	useEffect(() => {
		if (!sheetOpen) return;
		const root = rootRef.current;
		const sheet = sheetRef.current;
		const burger = burgerRef.current;

		const html = document.documentElement;
		const previousOverflow = html.style.overflow;
		html.style.overflow = "hidden";
		const restoreInert = root ? inertOutside(root) : undefined;

		sheet
			?.querySelector<HTMLElement>("a[href], button:not([disabled])")
			?.focus();

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setSheetOpen(false);
		};
		const desktop = window.matchMedia(DESKTOP_QUERY);
		const onBreakpoint = (event: MediaQueryListEvent) => {
			if (event.matches) setSheetOpen(false);
		};
		document.addEventListener("keydown", onKeyDown);
		desktop.addEventListener("change", onBreakpoint);

		return () => {
			document.removeEventListener("keydown", onKeyDown);
			desktop.removeEventListener("change", onBreakpoint);
			html.style.overflow = previousOverflow;
			restoreInert?.();
			// Esc, the backdrop or a sheet link closed it: the focused element is
			// gone or inside the sheet, so hand focus back to the burger.
			const active = document.activeElement;
			if (!active || active === document.body || sheet?.contains(active)) {
				burger?.focus();
			}
		};
	}, [sheetOpen]);

	const setMenuOpen = useCallback((label: string, open: boolean) => {
		setOpenMenu((current) => {
			if (open) return label;
			return current === label ? null : current;
		});
	}, []);

	return (
		<div ref={rootRef}>
			<a
				className="sr-only z-[60] rounded-full bg-product-card px-5 py-3 font-semibold text-product-foreground shadow-product-hover focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
				href="#main"
			>
				Skip to content
			</a>

			{sheetOpen && (
				<div
					aria-hidden="true"
					className="fixed inset-0 z-[48] bg-product-foreground/[0.28] backdrop-blur-[3px] animate-in fade-in-0 lg:hidden"
					onClick={closeSheet}
				/>
			)}

			<div className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-[calc(9px+env(safe-area-inset-top))]">
				<nav
					aria-label="Main"
					className={cn(
						"pointer-events-auto mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 rounded-full border border-product-foreground/[0.08] pl-[18px] pr-2.5 backdrop-blur-[14px] backdrop-saturate-[1.6] transition-[box-shadow,background-color] duration-300",
						scrolled
							? "bg-product-card/90 shadow-[0_10px_30px_-10px_rgba(22,20,15,0.18),0_2px_6px_rgba(22,20,15,0.05)]"
							: "bg-product-card/80 shadow-[0_1px_2px_rgba(22,20,15,0.04)]",
					)}
				>
					<Link
						aria-label="Quicktalog home"
						className="flex items-center rounded-full"
						href="/"
					>
						<img
							alt="Quicktalog Logo"
							className="h-[38px] w-auto"
							fetchPriority="high"
							height={38}
							src="/images/brand/logo.svg"
							width={105}
						/>
					</Link>

					{/* Desktop */}
					<div className="hidden items-center gap-1 lg:flex">
						{navMenus.map((menu) => (
							<NavDropdown
								isOpen={openMenu === menu.label}
								key={menu.label}
								menu={menu}
								onOpenChange={setMenuOpen}
							/>
						))}
						{navLinks.map((link) => (
							<NavLink href={link.url} icon={link.icon} key={link.url}>
								{link.text}
							</NavLink>
						))}
						<AuthLinks />
					</div>

					{/* Mobile */}
					<div className="flex items-center gap-1.5 lg:hidden">
						<AuthLinks onLinkClick={closeSheet} variant="mobile-cta" />
						<button
							aria-controls={SHEET_ID}
							aria-expanded={sheetOpen}
							aria-label={sheetOpen ? "Close menu" : "Open menu"}
							className="grid h-11 w-11 cursor-pointer place-items-center rounded-full text-product-foreground transition-colors hover:bg-product-background-hero"
							onClick={() => setSheetOpen((open) => !open)}
							ref={burgerRef}
							type="button"
						>
							{sheetOpen ? (
								<X aria-hidden="true" className="h-[22px] w-[22px]" />
							) : (
								<Menu aria-hidden="true" className="h-[22px] w-[22px]" />
							)}
						</button>
					</div>
				</nav>

				<div
					className={cn(
						"pointer-events-auto relative z-[51] mx-auto mt-2.5 max-h-[calc(100dvh-110px)] max-w-[1240px] flex-col gap-1 overflow-y-auto rounded-[26px] border border-product-border bg-product-card p-2.5 shadow-product-hover animate-in fade-in-0 slide-in-from-top-2 duration-200 [scrollbar-width:thin] [scrollbar-color:rgb(var(--product-border-strong-rgb))_transparent] [&::-webkit-scrollbar-thumb]:bg-product-border-strong [&::-webkit-scrollbar]:w-1 lg:hidden",
						sheetOpen ? "flex" : "hidden",
					)}
					id={SHEET_ID}
					ref={sheetRef}
				>
					{sheetOpen && (
						<>
							<div className="grid grid-cols-2 gap-1">
								{[mobileHomeLink, ...navLinks].map((link) => (
									<NavLink
										href={link.url}
										icon={link.icon}
										key={link.url}
										onClick={closeSheet}
										variant="sheet"
									>
										{link.text}
									</NavLink>
								))}
							</div>
							{navMenus.map((menu) => (
								<MobileNavSection
									items={menu.items}
									key={menu.label}
									onLinkClick={closeSheet}
									title={menu.label}
								/>
							))}
							<AuthLinks onLinkClick={closeSheet} variant="sheet" />
						</>
					)}
				</div>
			</div>
		</div>
	);
};
