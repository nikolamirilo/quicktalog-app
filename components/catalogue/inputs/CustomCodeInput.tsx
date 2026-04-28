"use client";
import { UserData } from "@quicktalog/common";
import { useState } from "react";
import CodeEditor from "./custom-code/CodeEditor";
import CodePreview from "./custom-code/CodePreview";

interface CustomCodeInputProps {
	value: {
		code?: string;
	};
	onChange: (value: any) => void;
	userData: UserData;
}

const CustomCodeInput = ({
	value,
	onChange,
	userData,
}: CustomCodeInputProps) => {
	const [previewTemplate, setPreviewTemplate] = useState<{
		name: string;
		code: string;
	} | null>(null);

	// Check if user has access to premium features (Growth or Premium plans)
	const canUseTemplates = userData?.planId && userData.currentPlan.id >= 2; // 2 = Growth, 3 = Premium

	// Convert camelCase to Title Case
	const toTitleCase = (str: string) => {
		return str
			.replace(/([A-Z])/g, " $1")
			.replace(/^./, (str) => str.toUpperCase())
			.trim();
	};

	const handleUseTemplate = (code: string) => {
		if (!canUseTemplates) return;
		onChange({ ...value, code });
	};

	return (
		<div className="space-y-6">
			{/* Code Editor Section */}
			<CodeEditor
				code={value.code || ""}
				onChange={(code) => onChange({ ...value, code })}
			/>

			{/* Code Preview (used for template script execution) */}
			<CodePreview code={value.code} previewTemplate={previewTemplate} />

			{/* Template Library Section */}
			{/* <div className="space-y-4 pt-4 border-t border-gray-200">
				<div>
					<h3 className="text-product-foreground font-semibold font-body mb-1">
						Custom Code Library
					</h3>
					<p className="text-xs text-gray-500 mb-6">
						Pre-made components ready to be added to your catalogue
					</p>
				</div> */}

			{/* <div className="grid grid-cols-2 gap-4 w-full pb-8 grid-flow-dense">
					{Object.entries(customCodeTemplates).map(([key, code]) => {
						const isHorizontal = [
							"ctaSection",
							"jewelryCollection",
							"giftShopBanner",
							"cafeLoyalty",
							"fashionLookbook"
						].includes(key);

						return (
							<PreviewItem
								key={key}
								code={code}
								label={toTitleCase(key)}
								onSelect={() => handleUseTemplate(code)}
								canUse={canUseTemplates}
								isHorizontal={isHorizontal}
							/>
						);
					})}
				</div> */}
			{/* </div> */}
		</div>
	);
};

export default CustomCodeInput;
