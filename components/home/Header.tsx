"use client";

import { Button } from "@/components/ui/button";
import { menuItems } from "@/constants";
import { siteDetails } from "@/constants/details";
import { Transition } from "@headlessui/react";
import Link from "next/link";
import React, { useState } from "react";
import { FaFingerprint } from "react-icons/fa";
import { HiBars3, HiOutlineXMark } from "react-icons/hi2";
import Container from "./Container";

const Header: React.FC = () => {
	const [isOpen, setIsOpen] = useState(false);

	const toggleMenu = () => {
		setIsOpen(!isOpen);
	};

	return (
		<header className="bg-transparent fixed top-0 left-0 right-0 md:absolute z-50 mx-auto w-full">
			<Container className="!px-0">
				<nav className="shadow-md md:shadow-none bg-product-background md:bg-transparent mx-auto flex justify-between items-center py-2 px-5 md:py-10">
					{/* Logo */}
					<Link href="/" className="flex items-center gap-2">
						<FaFingerprint className="text-product-foreground min-w-fit w-7 h-7" />
						<span className="manrope text-xl font-semibold text-product-foreground cursor-pointer">
							{siteDetails.siteName}
						</span>
					</Link>

					{/* Desktop Catalogue */}
					<ul className="hidden md:flex space-x-6">
						{menuItems.map((item) => (
							<li key={item.text}>
								<Link
									href={item.url}
									className="text-product-foreground hover:text-product-foreground-accent transition-colors"
								>
									{item.text}
								</Link>
							</li>
						))}
						<li>
							<Button asChild variant="header">
								<Link href="#cta">Download</Link>
							</Button>
						</li>
					</ul>

					{/* Mobile Catalogue Button */}
					<div className="md:hidden flex items-center">
						<button
							onClick={toggleMenu}
							type="button"
							className="bg-product-primary text-black focus:outline-none rounded-full w-10 h-10 flex items-center justify-center"
							aria-controls="mobile-menu"
							aria-expanded={isOpen}
						>
							{isOpen ? (
								<HiOutlineXMark className="h-6 w-6" aria-hidden="true" />
							) : (
								<HiBars3 className="h-6 w-6" aria-hidden="true" />
							)}
							<span className="sr-only">Toggle navigation</span>
						</button>
					</div>
				</nav>
			</Container>

			{/* Mobile Catalogue with Transition */}
			<Transition
				show={isOpen}
				enter="transition ease-out duration-200 transform"
				enterFrom="opacity-0 scale-95"
				enterTo="opacity-100 scale-100"
				leave="transition ease-in duration-75 transform"
				leaveFrom="opacity-100 scale-100"
				leaveTo="opacity-0 scale-95"
			>
				<div
					id="mobile-menu"
					className="md:hidden bg-product-background shadow-lg"
				>
					<ul className="flex flex-col space-y-4 pt-1 pb-6 px-6">
						{menuItems.map((item) => (
							<li key={item.text}>
								<Link
									href={item.url}
									className="text-product-foreground hover:text-product-primary block"
									onClick={toggleMenu}
								>
									{item.text}
								</Link>
							</li>
						))}
						<li>
							<Button asChild variant="header-mobile" onClick={toggleMenu}>
								<Link href="#cta">Get Started</Link>
							</Button>
						</li>
					</ul>
				</div>
			</Transition>
		</header>
	);
};

export default Header;
