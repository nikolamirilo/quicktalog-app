import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { layouts } from "@quicktalog/common";

interface ContentInputProps {
	value: {
		name: string;
		layout: any;
		isExpanded?: boolean;
	};
	onChange: (value: any) => void;
	type: "category" | "container";
}

const ContentInput = ({ value, onChange, type }: ContentInputProps) => {
	return (
		<div className="flex flex-col gap-6 w-full">
			{/* Name field */}
			<div className="flex flex-col gap-1.5 max-w-md">
				<Label
					className="text-product-foreground font-medium font-body"
					htmlFor={`${type}-name-input`}
				>
					{type === "category" ? "Category" : "Container"} Name
					<span className="text-red-500 ml-1">*</span>
				</Label>

				<Input
					id={`${type}-name-input`}
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder={`Enter ${type} name`}
					value={value.name}
				/>
				{type === "container" && (
					<span className="text-xs text-gray-500 -mt-0.5">
						Used to identify this container when moving items. Not visible to
						end users.
					</span>
				)}
			</div>

			{/* Auto-expand toggle */}
			{type === "category" && (
				<div className="flex items-center gap-2">
					<Switch
						checked={value.isExpanded}
						id="expanded"
						onCheckedChange={(checked) =>
							onChange({ ...value, isExpanded: checked })
						}
					/>
					<Label
						className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						htmlFor="expanded"
					>
						Auto-expand on page load
					</Label>
				</div>
			)}

			{/* Layout selection */}
			<div className="flex flex-col gap-3">
				<Label
					className="text-product-foreground font-medium font-body"
					htmlFor="category-layout-input"
				>
					Select Layout
					<span className="text-red-500 ml-1">*</span>
				</Label>
				<div className="grid grid-cols-4 gap-1 md:gap-3">
					{layouts.map((layoutOption) => (
						<div
							key={layoutOption.key}
							className={`relative cursor-pointer rounded-xl border p-1.5 transition-colors ${value.layout === layoutOption.key
								? "border-product-primary border-2"
								: "border-gray-200 hover:border-gray-300"
								}`}
							onClick={() =>
								onChange({ ...value, layout: layoutOption.key as any })
							}
						>
							<img
								alt={layoutOption.label}
								className="w-full aspect-square sm:aspect-[3/4] object-contain rounded-lg"
								src={layoutOption.image}
							/>
							<p className="text-center text-[10px] sm:text-xs mt-1 font-medium text-product-foreground font-body truncate">
								{layoutOption.label}
							</p>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ContentInput;
