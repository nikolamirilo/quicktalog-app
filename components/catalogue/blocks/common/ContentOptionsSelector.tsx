import { Button } from "@/components/ui/button";
import { Code, Globe, Layout, Type } from "lucide-react";
import { TbCategoryPlus } from "react-icons/tb";

type OptionKey = "container" | "category" | "iframe" | "custom_code" | "text";

interface ContentOptionsSelectorProps {
	selectedOption: OptionKey;
	onSelect: (value: OptionKey) => void;
}

const OPTIONS: {
	key: OptionKey;
	label: string;
	icon: React.ElementType;
}[] = [
	{ key: "container", label: "Container", icon: Layout },
	{ key: "category", label: "Category", icon: TbCategoryPlus },
	{ key: "text", label: "Text", icon: Type },
	{ key: "iframe", label: "Iframe", icon: Globe },
	{ key: "custom_code", label: "Custom Code", icon: Code },
];

export function ContentOptionsSelector({
	selectedOption,
	onSelect,
}: ContentOptionsSelectorProps) {
	return (
		<div className="flex-1 px-3 space-y-2">
			{OPTIONS.map(({ key, label, icon: Icon }) => {
				const isActive = selectedOption === key;

				return (
					<Button
						className={`w-full justify-start gap-3 h-auto py-3 px-4 text-base font-normal ${
							isActive
								? "bg-product-primary shadow-product-shadow text-white hover:text-white"
								: "text-product-foreground hover:text-product-foreground hover:bg-gray-100/50"
						}`}
						key={key}
						onClick={() => onSelect(key)}
						variant={isActive ? "default" : "ghost"}
					>
						<Icon
							className={`w-6 h-6 ${
								isActive ? "text-white" : "text-product-foreground"
							}`}
						/>
						<span className="font-medium">{label}</span>
					</Button>
				);
			})}
		</div>
	);
}
