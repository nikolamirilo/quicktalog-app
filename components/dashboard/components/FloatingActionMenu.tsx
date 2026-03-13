"use client";
import { Button } from "@/components/ui/button";
import { AreLimitesReached } from "@quicktalog/common";
import { Plus, Scan, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import CreateCatalogueButton from "./CreateCatalogueButton";

const FloatingActionMenu = ({
	planId,
	areLimitsReached,
}: {
	planId: number;
	areLimitsReached: AreLimitesReached;
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const menuRef = useRef(null);
	const router = useRouter();

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (menuRef.current && !menuRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleOptionClick = (option) => {
		router.push(option);
		setIsOpen(false);
	};

	return (
		<div className="fixed bottom-6 right-6 z-50" ref={menuRef}>
			{isOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-20 -z-10"
					onClick={() => setIsOpen(false)}
				/>
			)}
			<div
				className={`absolute bottom-16 right-0 flex flex-col-reverse gap-3 transition-all duration-300 ${isOpen
						? "opacity-100 translate-y-0"
						: "opacity-0 translate-y-4 pointer-events-none"
					}`}
			>
				{/* Create Catalogue */}
				<div
					className={`transform transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
						}`}
					style={{ transitionDelay: isOpen ? "0ms" : "0ms" }}
				>
					<CreateCatalogueButton
						className="min-w-[11rem] w-fit rounded-full shadow-lg z-10 hover:shadow-xl transform transition-all duration-200 "
						disabled={planId < 0 || areLimitsReached["catalogues"]}
						showUpgradeTooltip={true}
						type="dashboard"
					/>
				</div>

				{/* Generate with AI */}
				<div
					className={`transform transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
						}`}
					style={{ transitionDelay: isOpen ? "50ms" : "0ms" }}
				>
					<Button
						className="min-w-[11rem] w-fit flex items-center gap-3 px-4 py-3 rounded-full shadow-lg z-10 hover:shadow-xl transform transition-all duration-200 whitespace-nowrap text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
						disabled={planId < 1 || areLimitsReached["prompts"]}
						onClick={() => handleOptionClick("/admin/create/ai")}
						variant="outline"
					>
						<Sparkles size={18} />
						<span className="inline">Generate with AI</span>
					</Button>
				</div>

				{/* Scan & Import */}
				<div
					className={`transform transition-all duration-300 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
						}`}
					style={{ transitionDelay: isOpen ? "100ms" : "0ms" }}
				>
					<Button
						className="min-w-[11rem] w-fit flex items-center gap-3 px-4 py-3 rounded-full shadow-lg z-10 hover:shadow-xl transform transition-all duration-200 whitespace-nowrap text-sm font-medium bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
						disabled={planId < 2 || areLimitsReached["ocr"]}
						onClick={() => handleOptionClick("/admin/create/ocr")}
						variant="outline"
					>
						<Scan size={18} />
						<span className="inline">Scan & Import</span>
					</Button>
				</div>
			</div>

			<button
				aria-label={isOpen ? "Close menu" : "Open create menu"}
				className={`w-14 h-14 bg-product-primary hover:product-primary/20 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center ${isOpen ? "rotate-45" : "rotate-0"
					}`}
				onClick={() => setIsOpen(!isOpen)}
			>
				{isOpen ? (
					<X className="transition-transform duration-200" size={30} />
				) : (
					<Plus className="transition-transform duration-200" size={30} />
				)}
			</button>
		</div>
	);
};

export default FloatingActionMenu;
