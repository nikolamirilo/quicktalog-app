import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/constants";
import { useCatalogueContext } from "@/context/CatalogueContext";

const CurrencySelect = ({ disabled = false }: { disabled?: boolean }) => {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	return (
		<div className="space-y-2">
			<Label
				className="text-sm font-medium text-product-foreground"
				htmlFor="currency"
			>
				Currency
			</Label>
			<Select
				disabled={disabled}
				onValueChange={(value) => updateCatalogue({ currency: value })}
				value={catalogue.currency}
			>
				<SelectTrigger
					className="bg-product-background border-product-border text-product-foreground focus:border-product-primary focus:ring-product-primary"
					id="currency"
				>
					<SelectValue placeholder="Select currency" />
				</SelectTrigger>
				<SelectContent>
					{CURRENCIES.map((curr) => (
						<SelectItem key={curr.value} value={curr.value}>
							{curr.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default CurrencySelect;
