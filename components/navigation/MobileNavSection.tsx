"use client";
import { MobileNavSectionProps } from "@/types/components";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiChevronDown } from "react-icons/fi";

const MobileNavSection = ({
	menu,
	isOpen,
	onToggle,
	onLinkClick,
}: MobileNavSectionProps) => {
	const pathname = usePathname();
	const Icon = menu.icon;
	const panelId = `mobile-nav-${menu.label.toLowerCase()}`;

	return (
		<div>
			<button
				aria-controls={panelId}
				aria-expanded={isOpen}
				className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 ${
					isOpen
						? "bg-product-background-hover text-product-primary border border-product-primary shadow-sm font-semibold"
						: "hover:bg-product-nav-hover-bg hover:text-product-nav-hover-text hover:shadow-md hover:scale-[1.03] hover:transform hover:-translate-y-[2px] border border-transparent hover:border-product-nav-hover-border hover:font-bold"
				}`}
				onClick={() => onToggle(menu.label)}
			>
				<Icon
					className={`${isOpen ? "text-product-primary" : "text-gray-600"} sm:w-5 sm:h-5`}
					size={18}
				/>
				<span
					className={`font-medium text-sm sm:text-base ${isOpen ? "text-product-primary" : "text-product-foreground"}`}
				>
					{menu.label}
				</span>
				<FiChevronDown
					className={`ml-auto w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-product-primary" : "text-gray-600"}`}
				/>
			</button>

			{isOpen && (
				<div className="flex flex-col pl-6 sm:pl-7" id={panelId}>
					{menu.items.map((item) => {
						const isActive = !item.url.includes("#") && pathname === item.url;
						return (
							<Link href={item.url} key={item.url} onClick={onLinkClick}>
								<button
									className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors duration-200 ${
										isActive
											? "text-product-primary font-semibold"
											: "text-product-foreground-accent hover:bg-product-background-hover hover:text-product-foreground"
									}`}
								>
									<span className="font-medium text-sm sm:text-base">
										{item.text}
									</span>
								</button>
							</Link>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default MobileNavSection;
