import { Label } from "@/components/ui/label";
import { themes } from "@/constants";
import { ThemeSelectProps } from "@/types/components";

const ThemeSelect = ({
	formData,
	setFormData,
	infoButtonComponent,
}: ThemeSelectProps) => (
	<div className="space-y-4">
		<div className="text-center">
			<div className="flex items-center justify-start gap-2">
				<Label className="text-sm font-medium text-gray-700">
					Select Theme<span className="text-red-500 ml-1">*</span>
				</Label>
				{infoButtonComponent}
			</div>
		</div>

		<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
			{themes.map((themeItem) => (
				<button
					className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-[1.02] ${themeItem.key} ${
						formData.theme === themeItem.key
							? "border-product-primary shadow-md"
							: "hover:shadow-sm"
					}`}
					key={themeItem.key}
					onClick={() => {
						setFormData((prev: any) => ({ ...prev, theme: themeItem.key }));
					}}
					style={{
						borderColor:
							formData.theme === themeItem.key
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
	</div>
);

export default ThemeSelect;
