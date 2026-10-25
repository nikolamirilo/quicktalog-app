"use client";
import { SmartLink } from "@/components/general/SmartLink";
import { useCatalogueContext } from "@/context/CatalogueContext";
import type { Catalogue } from "@quicktalog/common";
import Link from "next/link";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	FiExternalLink,
	FiMail,
	FiMenu,
	FiPhone,
	FiPlus,
	FiX,
} from "react-icons/fi";

export type CatalogueHeaderProps = {
	type?: "default" | "custom";
	logo?: string;
	data?: Catalogue;
};

type ContactLink = {
	key: string;
	href: string;
	icon: React.ReactNode;
	label: string;
	value: string;
};

/** Past this many pixels of scroll the navbar lifts with a stronger shadow. */
const SCROLLED_AT = 8;

const useScrolled = () => {
	const [scrolled, setScrolled] = useState(false);
	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > SCROLLED_AT);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	return scrolled;
};

/**
 * The floating navbar: a pill that sticks below the top edge while visitors
 * scroll. From `md` up the contact icons and the button sit in the pill; on
 * phones the button stays and the icons move into a menu under it.
 */
const CatalogueHeader: React.FC<CatalogueHeaderProps> = ({
	type = "default",
	data,
	logo,
}) => {
	// Not in the builder on the public catalogue view - there is no provider
	// there, so the context is null and `data` is the only source.
	const { catalogue } = useCatalogueContext() || {};
	const activeData = catalogue?.name ? catalogue : data;
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const scrolled = useScrolled();
	const wrapRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isMenuOpen) return;
		const onPointerDown = (e: PointerEvent) => {
			if (!wrapRef.current?.contains(e.target as Node)) setIsMenuOpen(false);
		};
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setIsMenuOpen(false);
		};
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [isMenuOpen]);

	const contactLinks: ContactLink[] = [];
	if (type === "default") {
		contactLinks.push({
			key: "email",
			href: "mailto:quicktalog@outlook.com",
			icon: <FiMail aria-hidden="true" />,
			label: "Email",
			value: "quicktalog@outlook.com",
		});
	} else if (activeData) {
		const { contact, header } = activeData;
		if (contact?.email && header?.emailCta) {
			contactLinks.push({
				key: "email",
				href: `mailto:${contact.email}`,
				icon: <FiMail aria-hidden="true" />,
				label: "Email",
				value: contact.email,
			});
		}
		if (contact?.phone && header?.phoneCta) {
			contactLinks.push({
				key: "phone",
				href: `tel:${contact.phone}`,
				icon: <FiPhone aria-hidden="true" />,
				label: "Phone",
				value: contact.phone,
			});
		}
	}

	const cta =
		type === "default"
			? {
					href: "/auth?mode=signup",
					label: "Create Your Catalog",
					shortLabel: "Get Started",
					icon: <FiPlus aria-hidden="true" />,
				}
			: activeData?.header?.cta?.isEnabled && activeData.header.cta.url
				? {
						href: activeData.header.cta.url,
						label: activeData.header.cta.label || "Learn more",
						shortLabel: activeData.header.cta.label || "Learn more",
						icon: <FiExternalLink aria-hidden="true" />,
					}
				: null;

	const companyName = type === "default" ? "Quicktalog" : "Company";
	const hasActions = contactLinks.length > 0 || cta !== null;
	const logoWidth =
		type === "default" ? 160 : activeData?.header?.logoSize?.width || 100;

	return (
		<header
			aria-label={`${companyName} header navigation`}
			className="cat-nav-wrap"
			ref={wrapRef}
			role="banner"
		>
			<nav
				aria-label="Contact and actions"
				className="cat-nav"
				data-scrolled={scrolled ? "" : undefined}
			>
				<SmartLink
					ariaLabel={`Go to ${companyName} homepage`}
					className="cat-nav-brand"
					href={activeData?.contact?.website || "/"}
				>
					{logo && (
						<img
							alt={`${companyName} logo`}
							fetchPriority="high"
							src={logo}
							style={{ width: `${logoWidth}px` }}
						/>
					)}
				</SmartLink>

				{hasActions && (
					<div className="cat-nav-actions">
						{contactLinks.map((link) => (
							<Link
								aria-label={link.label}
								className="cat-nav-icon"
								href={link.href}
								key={link.key}
								title={link.value}
							>
								{link.icon}
							</Link>
						))}
						{cta && (
							<SmartLink className="cat-nav-cta" href={cta.href}>
								{cta.icon}
								<span>{cta.label}</span>
							</SmartLink>
						)}
					</div>
				)}

				{hasActions && (
					<div className="cat-nav-mobile">
						{cta && (
							<SmartLink className="cat-nav-cta" href={cta.href}>
								<span>{cta.shortLabel}</span>
							</SmartLink>
						)}
						{contactLinks.length > 0 && (
							<button
								aria-controls="catalogue-nav-menu"
								aria-expanded={isMenuOpen}
								aria-label={isMenuOpen ? "Close menu" : "Open menu"}
								className="cat-nav-burger"
								onClick={() => setIsMenuOpen((open) => !open)}
								type="button"
							>
								{isMenuOpen ? (
									<FiX aria-hidden="true" />
								) : (
									<FiMenu aria-hidden="true" />
								)}
							</button>
						)}
					</div>
				)}
			</nav>

			{isMenuOpen && (
				<div className="cat-nav-sheet" id="catalogue-nav-menu">
					<p className="cat-nav-sheet-title">Contact us</p>
					{contactLinks.map((link) => (
						<Link
							className="cat-nav-row"
							href={link.href}
							key={link.key}
							onClick={() => setIsMenuOpen(false)}
						>
							{link.icon}
							<span>{link.value}</span>
						</Link>
					))}
					{cta && (
						<SmartLink className="cat-nav-cta" href={cta.href}>
							{cta.icon}
							<span>{cta.label}</span>
						</SmartLink>
					)}
				</div>
			)}
		</header>
	);
};

export default CatalogueHeader;
