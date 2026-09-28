import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_OPTIONS } from "@/constants/ocr";
import { useCatalogueContext } from "@/context/CatalogueContext";

const LanguageInput = ({ disabled = false }: { disabled?: boolean }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	return (
		<div className="space-y-2">
			<Label
				className="text-sm font-medium text-product-foreground"
				htmlFor="language"
			>
				Language
			</Label>
			<Select
				disabled={disabled}
				onValueChange={(value) => updateCatalogue({ language: value })}
				value={catalogue.language}
			>
				<SelectTrigger
					className="bg-product-background border-product-border text-product-foreground focus:border-product-primary focus:ring-product-primary"
					id="language"
				>
					<SelectValue placeholder="Select language" />
				</SelectTrigger>
				<SelectContent>
					{LANGUAGE_OPTIONS.map((lang) => (
						<SelectItem key={lang.code} value={lang.code}>
							{lang.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default LanguageInput;
