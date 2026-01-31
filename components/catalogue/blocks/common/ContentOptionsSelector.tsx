import { Button } from "@/components/ui/button";
import { PricingPlan } from "@quicktalog/common";
import { Code, Globe, Layout, SeparatorHorizontal, Type } from "lucide-react";
import { TbCategoryPlus } from "react-icons/tb";

type OptionKey =
	| "container"
	| "category"
	| "iframe"
	| "custom_code"
	| "text"
	| "divider";

interface ContentOptionsSelectorProps {
	selectedOption: OptionKey;
	onSelect: (value: OptionKey) => void;
	planFeatures?: PricingPlan["features"];
}

const OPTIONS: {
	key: OptionKey;
	label: string;
	icon: React.ElementType;
}[] = [
	{ key: "container", label: "Container", icon: Layout },
	{ key: "category", label: "Category", icon: TbCategoryPlus },
	{ key: "text", label: "Text", icon: Type },
	{ key: "divider", label: "Divider", icon: SeparatorHorizontal },
	{ key: "iframe", label: "Iframe", icon: Globe },
	{ key: "custom_code", label: "Custom Code", icon: Code },
];

export function ContentOptionsSelector({
	selectedOption,
	onSelect,
	planFeatures,
}: ContentOptionsSelectorProps) {
	const isLocked = (key: OptionKey) => {
		if (!planFeatures) return false;

		switch (key) {
			case "divider":
				return planFeatures.blocks?.divider === false;
			case "iframe":
				return planFeatures.blocks?.iframe === false;
			case "custom_code":
				return planFeatures.blocks?.customCode === false;
			default:
				return false;
		}
	};

	return (
		<div className="flex-1 px-3 space-y-2">
			{/* Mobile Dropdown (Slider) */}
			<div className="md:hidden mobile-tab-scroll flex flex-row gap-2 overflow-x-auto py-2 px-1 bg-product-background/95 mb-4">
				{OPTIONS.map(({ key, label, icon: Icon }) => {
					const isActive = selectedOption === key;
					const locked = isLocked(key);
					return (
						<Button
							className={`${
								isActive
									? "!bg-product-hover-background !text-navbar-button-active !border !border-product-primary shadow-sm font-semibold hover:scale-[1.03] hover:transform"
									: ""
							} flex items-center justify-center font-body flex-shrink-0 whitespace-nowrap min-w-[80px] h-10 px-4`}
							key={key}
							onClick={() => onSelect(key)}
							variant="nav"
							locked={locked}
						>
							<Icon
								className={`w-4 h-4 mr-2 ${
									isActive ? "text-product-primary" : "text-product-foreground"
								}`}
							/>
							{label}
						</Button>
					);
				})}
			</div>

			{/* Desktop List */}
			<div className="hidden md:block space-y-2">
				{OPTIONS.map(({ key, label, icon: Icon }) => {
					const isActive = selectedOption === key;
					const locked = isLocked(key);

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
							locked={locked}
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
		</div>
	);
}
