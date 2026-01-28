import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { BUSINESS_TYPES } from "@/constants/catalogue";
import { useCatalogueContext } from "@/context/CatalogueContext";

const BusinessType = ({ disabled = false }: { disabled?: boolean }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	return (
		<div className="space-y-2">
			<Label
				className="text-sm font-medium text-product-foreground"
				htmlFor="businessType"
			>
				Business Type
			</Label>
			<Select
				disabled={disabled}
				onValueChange={(value) => updateCatalogue({ businessType: value })}
				value={catalogue.businessType}
			>
				<SelectTrigger
					className="bg-product-background border-product-border text-product-foreground focus:border-product-primary focus:ring-product-primary"
					id="businessType"
				>
					<SelectValue placeholder="Select type" />
				</SelectTrigger>
				<SelectContent>
					{BUSINESS_TYPES.map((type) => (
						<SelectItem key={type.value} value={type.value}>
							{type.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default BusinessType;
