"use client";
import { layouts, themes } from "@quicktalog/common";
import { useMainContext } from "@/context/MainContext";
import { Button } from "../ui/button";

const Toggle = ({ type = "home" }: { type?: string }) => {
	const context = useMainContext();
	if (!context) return null;
	const { setLayout, layout, theme, setTheme } = context;

	return (
		<div className="flex flex-col justify-center items-center gap-8 w-full max-w-5xl mx-auto px-4">
			{/* Layout Section */}
			{type === "home" && (
				<div className="flex flex-col items-center gap-6 w-full">
					<h3
						className="text-xl font-semibold text-center"
						style={{
							color: "var(--section-heading)",
							fontFamily: "var(--font-family-heading)",
							fontWeight: "var(--font-weight-heading)",
							letterSpacing: "var(--letter-spacing-heading)",
						}}
					>
						Choose Layout Style
					</h3>
					<div className="w-full max-w-2xl">
						<div
							className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2 rounded-2xl bg-section-bg shadow-product-shadow border border-section-border"
							role="group"
						>
							{layouts.map((layoutOption) => (
								<Button
									className={`
                  relative flex-1 px-3 py-3 text-xs sm:text-sm transition-all duration-300 ease-out
                  ${
										layout === layoutOption.key
											? "shadow-product-hover-shadow scale-105 transform font-semibold"
											: ""
									}
                  rounded-xl
                  hover:shadow-md hover:scale-102 transform
                  active:scale-95
                  backdrop-blur-sm
                  min-w-0
                  flex flex-col items-center gap-1
                `}
									key={layoutOption.key}
									onClick={() => setLayout(layoutOption.key)}
									size="sm"
									style={{
										backgroundColor:
											layout === layoutOption.key
												? "var(--primary)"
												: "transparent",
										color:
											layout === layoutOption.key
												? "var(--primary-foreground)"
												: "var(--section-heading)",
										fontFamily: "var(--font-family-body)",
										fontWeight:
											layout === layoutOption.key
												? "var(--font-weight-heading)"
												: "var(--font-weight-body)",
										letterSpacing: "var(--letter-spacing-body)",
									}}
									type="button"
									variant="ghost"
								>
									<span className="relative z-10 text-center leading-tight">
										{layoutOption.label}
									</span>
									{layout === layoutOption.key && (
										<div
											className="absolute inset-0 rounded-xl opacity-20 blur-sm"
											style={{ backgroundColor: "var(--primary)" }}
										/>
									)}
								</Button>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Theme Section */}
			<div className="flex flex-col items-center gap-6 w-full">
				<h3
					className="text-xl font-semibold text-center"
					style={{
						color: "var(--section-heading)",
						fontFamily: "var(--font-family-heading)",
						fontWeight: "var(--font-weight-heading)",
						letterSpacing: "var(--letter-spacing-heading)",
					}}
				>
					Choose Color Theme
				</h3>
				<div className="w-full max-w-4xl">
					<div
						className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 p-3 rounded-2xl bg-section-bg shadow-product-shadow border border-section-border"
						role="group"
					>
						{themes.map((themeOption) => (
							<button
								className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-102 ${themeOption.key} ${
									theme === themeOption.key
										? "border-product-primary shadow-md"
										: "hover:shadow-sm"
								}`}
								key={themeOption.key}
								onClick={() => setTheme(themeOption.key)}
								style={{
									borderColor:
										theme === themeOption.key
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
										{themeOption.label}
									</div>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Toggle;
