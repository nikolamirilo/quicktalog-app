"use client";
import { Button } from "@/components/ui/button";
import { NavDropdownProps } from "@/types/components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { FiChevronDown } from "react-icons/fi";

const NavDropdown = ({ menu, isOpen, onToggle, onClose }: NavDropdownProps) => {
	const pathname = usePathname();
	const containerRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);

	const isActive =
		isOpen ||
		menu.items.some((item) => !item.url.includes("#") && pathname === item.url);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: MouseEvent | TouchEvent) => {
			if (!containerRef.current?.contains(event.target as Node)) {
				onClose();
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
				triggerRef.current?.focus();
			}
		};

		document.addEventListener("mousedown", handlePointerDown);
		document.addEventListener("touchstart", handlePointerDown);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handlePointerDown);
			document.removeEventListener("touchstart", handlePointerDown);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, onClose]);

	return (
		<div className="relative" ref={containerRef}>
			<Button
				aria-expanded={isOpen}
				aria-haspopup="true"
				className={`${isActive ? "font-bold !bg-product-background-hover !text-product-nav-active !border !border-product-primary shadow-sm hover:scale-[1.03] hover:transform" : "font-medium"}`}
				onClick={() => onToggle(menu.label)}
				ref={triggerRef}
				variant="nav"
			>
				{menu.label}
				<FiChevronDown
					className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
				/>
			</Button>

			{isOpen && (
				<div className="absolute left-0 top-full mt-2 min-w-[20rem] rounded-lg border border-product-border bg-product-background p-2 shadow-lg z-50">
					{menu.items.map((item) => {
						const Icon = item.icon;
						return (
							<Link
								className="flex items-start gap-3 p-2.5 rounded-lg transition-colors duration-200 hover:bg-product-background-hover group"
								href={item.url}
								key={item.url}
								onClick={onClose}
							>
								<Icon className="w-4 h-4 mt-1 flex-shrink-0 text-gray-600 transition-colors duration-200 group-hover:text-product-primary" />
								<span>
									<span className="block text-sm font-medium text-product-foreground">
										{item.text}
									</span>
									<span className="block text-[11px] leading-snug text-product-foreground-accent">
										{item.description}
									</span>
								</span>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default NavDropdown;
