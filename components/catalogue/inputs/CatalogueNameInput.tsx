import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useCatalogueName } from "@/hooks/useCatalogueName";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const CatalogueNameInput = ({
	disabled = false,
	onErrorChange,
}: {
	disabled?: boolean;
	onErrorChange?: (hasError: boolean) => void;
}) => {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	const [errors, setErrors] = useState<{ name?: string }>({});
	const [touched, setTouched] = useState<{ name?: boolean }>({});

	const setFormDataWrapper = useCallback(
		(updater: any) => {
			if (typeof updater === "function") {
				updateCatalogue({ name: updater({ name: catalogue.name }).name });
			} else {
				updateCatalogue({ name: updater.name });
			}
		},
		[catalogue.name, updateCatalogue],
	);

	const { handleNameChange, nameExists } = useCatalogueName({
		initialName: catalogue.name,
		type: "create",
		setFormData: setFormDataWrapper,
		setErrors,
		setTouched,
	});

	useEffect(() => {
		if (onErrorChange) {
			onErrorChange(!!errors.name || nameExists);
		}
	}, [errors.name, nameExists, onErrorChange]);

	return (
		<div className="space-y-2">
			<Label
				className="text-sm font-medium text-product-foreground"
				htmlFor="catalogName"
			>
				CatalogueName<span className="text-red-500 ml-1">*</span>
			</Label>
			<div className="relative">
				<Input
					className={`bg-product-background border-product-border text-product-foreground placeholder:text-product-foreground-accent/50 focus:border-product-primary focus:ring-product-primary pr-10 ${
						!disabled && errors?.name
							? "border-red-500 focus:border-red-500"
							: catalogue.name && !nameExists && touched?.name && !disabled
								? "border-green-500 focus:border-green-500"
								: ""
					}`}
					disabled={disabled}
					id="catalogName"
					onChange={disabled ? undefined : handleNameChange}
					placeholder="e.g. Burger House"
					type="text"
					value={catalogue.name}
				/>
				{!disabled && catalogue.name && touched?.name && (
					<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
						{errors?.name || nameExists ? (
							<AlertCircle className="h-4 w-4 text-red-500" />
						) : (
							<CheckCircle className="h-4 w-4 text-green-500" />
						)}
					</div>
				)}
			</div>
			{!disabled &&
				catalogue.name &&
				!errors?.name &&
				touched?.name &&
				!nameExists && (
					<div className="text-green-600 text-xs mt-2 p-2 bg-green-50 border border-green-200 rounded-lg font-body flex items-center gap-2">
						Great! This name is available.
					</div>
				)}
			{!disabled && touched?.name && (errors?.name || nameExists) && (
				<div className="text-red-500 text-xs mt-2 p-2 bg-red-50 border border-red-200 rounded-lg font-body flex items-center gap-2">
					{errors?.name ||
						"This name is already in use. Please choose a different name."}
				</div>
			)}
		</div>
	);
};

export default CatalogueNameInput;
