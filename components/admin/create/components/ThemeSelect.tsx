"use client";
import { themes } from "@quicktalog/common";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { ThemeSelectProps } from "@/types/components";

const ThemeSelect = ({
	formData,
	setFormData,
	infoButtonComponent,
}: ThemeSelectProps) => {
	const [themeIndex, setThemeIndex] = useState<number>(1);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const themeKey = themes.find((item) => item.id === themeIndex)?.key;
		if (themeKey) {
			setFormData((prev: any) => ({
				...prev,
				theme: themeKey,
			}));
		}

		// Smooth scroll reveal of selected button
		const activeBtn = document.getElementById(`theme-btn-${themeIndex}`);
		const container = containerRef.current;
		if (activeBtn && container) {
			const rect = activeBtn.getBoundingClientRect();
			const parentRect = container.getBoundingClientRect();

			// Calculate center position for smoother scrolling
			const btnCenter = rect.left + rect.width / 2;
			const containerCenter = parentRect.left + parentRect.width / 2;
			const offset = btnCenter - containerCenter;

			// More responsive edge detection with smooth scrolling
			if (Math.abs(offset) > 100) {
				container.scrollBy({
					left: offset,
					behavior: "smooth",
				});
			}
		}
	}, [themeIndex, setFormData]);

	useEffect(() => {
		if (formData.theme !== "") {
			const theme = themes.find((item) => item.key === formData.theme);
			setThemeIndex(theme.id);
		} else {
			setThemeIndex(1);
		}
	}, []);

	const handlePrev = (e: React.MouseEvent) => {
		e.preventDefault();
		if (themeIndex === 1) {
			setThemeIndex(themes.length);
		} else {
			setThemeIndex(themeIndex - 1);
		}
	};

	const handleNext = (e: React.MouseEvent) => {
		e.preventDefault();
		if (themeIndex === themes.length) {
			setThemeIndex(1);
		} else {
			setThemeIndex(themeIndex + 1);
		}
	};

	return (
		<div className="space-y-4">
			<div className="text-center">
				<div className="flex items-center justify-start gap-2">
					<Label className="text-sm font-medium text-gray-700">
						Select Theme<span className="text-red-500 ml-1">*</span>
					</Label>
					{infoButtonComponent}
				</div>
			</div>

			<div className="relative flex items-center">
				<button
					className="absolute left-0 z-10 bg-product-primary text-white rounded-full shadow p-2 hover:scale-105 transition-transform duration-200"
					onClick={handlePrev}
				>
					<ChevronLeft className="w-5 h-5" />
				</button>

				{/* Themes container */}
				<div
					className="flex flex-row gap-2 overflow-hidden py-5 transition-all duration-150 ease-in px-10 w-full md:w-11/12 mx-auto"
					ref={containerRef}
					style={{ scrollBehavior: "smooth" }}
				>
					{themes
						.sort((a, b) => a.id - b.id)
						.map((themeItem) => (
							<button
								className={`flex-shrink-0 p-3 w-32 h-24 md:w-40 md:h-32 rounded-lg transition-all duration-300 ease-in-out hover:scale-[1.02] ${themeItem.key} ${
									themeIndex === themeItem.id
										? "border-product-primary shadow-md scale-[1.03] border-[3px]"
										: "hover:shadow-sm"
								}`}
								id={`theme-btn-${themeItem.id}`}
								key={themeItem.key}
								onClick={() => setThemeIndex(themeItem.id)}
								style={{
									borderColor:
										themeIndex === themeItem.id
											? "var(--product-primary)"
											: "var(--section-border)",
									backgroundColor: "var(--background)",
									color: "var(--foreground)",
									fontFamily: "var(--font-family-body)",
								}}
								type="button"
							>
								<div className="text-center">
									<div
										className="w-8 h-8 mx-auto mb-2 rounded-full border-2"
										style={{
											backgroundColor: "var(--primary)",
											borderColor: "var(--foreground)",
										}}
									></div>
									<div
										className="text-xs font-medium"
										style={{
											color: "var(--heading)",
											fontFamily: "var(--font-family-heading)",
											fontWeight: "var(--font-weight-heading)",
											letterSpacing: "var(--letter-spacing-heading)",
										}}
									>
										{themeItem.label}
									</div>
								</div>
							</button>
						))}
				</div>

				<button
					className="absolute right-0 z-10 bg-product-primary text-white rounded-full shadow p-2 hover:scale-105 transition-transform duration-200"
					onClick={handleNext}
				>
					<ChevronRight className="w-5 h-5" />
				</button>
			</div>
		</div>
	);
};

export default ThemeSelect;
