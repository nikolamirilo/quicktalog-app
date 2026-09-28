"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { layouts } from "@quicktalog/common";

interface ContentInputProps {
	value: {
		name: string;
		layout: any;
		showHeading?: boolean;
		isExpanded?: boolean;
		items?: any[];
	};
	onChange: (value: any) => void;
}

const ContentInput = ({ value, onChange }: ContentInputProps) => {
	const showHeading = value.showHeading ?? true;

	return (
		<div className="flex flex-col gap-6 w-full">
			<div className="flex flex-col gap-1.5 max-w-md">
				<Label
					className="text-product-foreground font-medium"
					htmlFor="items-name-input"
				>
					{showHeading ? "Heading" : "Section name"}
					<span className="text-red-500 ml-1">*</span>
				</Label>

				<Input
					id="items-name-input"
					onChange={(e) => onChange({ ...value, name: e.target.value })}
					placeholder={showHeading ? "Enter heading" : "Enter section name"}
					value={value.name}
				/>
				{!showHeading && (
					<span className="text-xs text-gray-500 -mt-0.5">
						Used to identify this section when moving items. Not visible to end
						users.
					</span>
				)}
			</div>

			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					<Switch
						checked={showHeading}
						id="show-heading"
						onCheckedChange={(checked) =>
							onChange({ ...value, showHeading: checked })
						}
					/>
					<Label
						className="text-sm font-medium leading-none"
						htmlFor="show-heading"
					>
						Show heading above the items
					</Label>
				</div>

				{/* The heading is the collapse toggle, so without one there is nothing to expand. */}
				{showHeading && (
					<div className="flex items-center gap-2">
						<Switch
							checked={value.isExpanded ?? true}
							id="expanded"
							onCheckedChange={(checked) =>
								onChange({ ...value, isExpanded: checked })
							}
						/>
						<Label
							className="text-sm font-medium leading-none"
							htmlFor="expanded"
						>
							Auto-expand on page load
						</Label>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-3">
				<Label
					className="text-product-foreground font-medium"
					htmlFor="items-layout-input"
				>
					Select Layout
					<span className="text-red-500 ml-1">*</span>
				</Label>
				<div
					className="grid grid-cols-4 gap-1 md:gap-3"
					id="items-layout-input"
				>
					{layouts.map((layoutOption) => (
						<div
							className={`relative cursor-pointer rounded-xl border p-1.5 transition-colors ${
								value.layout === layoutOption.key
									? "border-product-primary border-2"
									: "border-gray-200 hover:border-gray-300"
							}`}
							key={layoutOption.key}
							onClick={() =>
								onChange({ ...value, layout: layoutOption.key as any })
							}
						>
							<img
								alt={layoutOption.label}
								className="w-full aspect-square sm:aspect-[3/4] object-contain rounded-lg"
								src={layoutOption.image}
							/>
							<p className="text-center text-[10px] sm:text-xs mt-1 font-medium text-product-foreground truncate">
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
