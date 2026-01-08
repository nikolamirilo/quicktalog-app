import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
		<div>
			<div className="mt-4 p-6 pt-0 space-y-6">
				{type === "category" ? (
					<div className="flex flex-col md:flex-row space-y-4 gap-4 md:items-center">
						<div className="flex flex-col justify-center gap-4 md:w-8/12">
							<Label
								className="text-product-foreground font-medium font-body"
								htmlFor={`category-name-input`}
							>
								Category Name
								<span className="text-red-500 ml-1">*</span>
							</Label>
							<Input
								id={`category-name-input`}
								onChange={(e) => onChange({ ...value, name: e.target.value })}
								placeholder="Enter category name"
								value={value.name}
							/>
						</div>
						<div className="flex items-center gap-2 md:w-4/12">
							<Checkbox
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
								Expand on load
							</Label>
						</div>
					</div>
				) : null}

				{/* Layout Selection for this category */}
				<div className="space-y-4">
					<Label
						className="text-product-foreground font-medium font-body"
						htmlFor={`category-layout-input`}
					>
						Select Layout
						<span className="text-red-500 ml-1">*</span>
					</Label>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
						{layouts.map((layoutOption) => (
							<div
								className={`relative cursor-pointer rounded-xl border border-gray-200 p-2 ${value.layout === layoutOption.key &&
									"border-product-primary border-2"
									}`}
								key={layoutOption.key}
								onClick={() =>
									onChange({ ...value, layout: layoutOption.key as any })
								}
							>
								<img
									alt={layoutOption.label}
									className="w-full aspect-[3/4] object-contain rounded-lg"
									src={layoutOption.image}
								/>
								<p className="text-center text-sm mt-2 font-medium text-product-foreground font-body">
									{layoutOption.label}
								</p>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default ContentInput;
