import React from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "@/constants/ocr";
import { LanguageSelectorProps } from "@/types/components";

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
	selectedLanguage,
	touched,
	errors,
	onLanguageChange,
	type = "ai",
}) => {
	return (
		<div className="mb-6 w-full max-w-md">
			<label className="block text-sm font-medium !text-product-foreground mb-2">
				{type === "ai"
					? "Select Catalogue Language"
					: "Select Language of Images"}
				<span className="text-red-500 ml-1">*</span>
			</label>
			<Select
				onValueChange={(e) => onLanguageChange(e)}
				value={selectedLanguage || "eng"}
			>
				<SelectTrigger>
					<SelectValue placeholder="Select currency" />
				</SelectTrigger>
				<SelectContent>
					{LANGUAGE_OPTIONS.map((lang) => (
						<SelectItem
							className="cursor-pointer"
							key={lang.code}
							value={lang.code}
						>
							{lang.flag} {lang.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{touched?.language && errors?.language && (
				<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body">
					{errors?.language}
				</div>
			)}
		</div>
	);
};
