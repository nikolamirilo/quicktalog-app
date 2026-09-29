import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useCatalogueName } from "@/hooks/useCatalogueName";
import { cn } from "@/lib/ui/cn";
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

	const showStatus = !disabled && !!catalogue.name?.trim() && touched?.name;
	const hasError = !!errors?.name || nameExists;
	const isAvailable = showStatus && !hasError;

	return (
		<div className="space-y-2">
			<Label htmlFor="catalogName">
				Catalogue name
				{!disabled && (
					<span aria-hidden="true" className="ml-1 text-product-error">
						*
					</span>
				)}
			</Label>
			<div className="relative">
				<Input
					aria-describedby={
						disabled
							? "catalogName-hint"
							: showStatus
								? "catalogName-status"
								: undefined
					}
					aria-invalid={
						!disabled && touched?.name && hasError ? true : undefined
					}
					className={cn(
						"pr-10",
						isAvailable &&
							"border-product-success focus-visible:border-product-success focus-visible:ring-product-success/20",
					)}
					disabled={disabled}
					id="catalogName"
					onChange={disabled ? undefined : handleNameChange}
					placeholder="e.g. Burger House"
					required={!disabled}
					type="text"
					value={catalogue.name}
				/>
				{showStatus && (
					<div className="absolute right-3 top-1/2 -translate-y-1/2">
						{hasError ? (
							<AlertCircle
								aria-hidden="true"
								className="h-4 w-4 text-product-error"
							/>
						) : (
							<CheckCircle
								aria-hidden="true"
								className="h-4 w-4 text-product-success"
							/>
						)}
					</div>
				)}
			</div>
			{disabled && (
				<p className="text-[12.5px] text-product-muted" id="catalogName-hint">
					The name is part of your catalogue's link, so it can't be changed
					here.
				</p>
			)}
			{isAvailable && (
				<p
					className="flex items-center gap-2 rounded-xl border border-product-success/30 bg-product-success-soft p-2 text-xs font-medium text-product-success"
					id="catalogName-status"
					role="status"
				>
					Great! This name is available.
				</p>
			)}
			{!disabled && touched?.name && hasError && (
				<p
					className="flex items-center gap-2 rounded-xl border border-product-error/30 bg-product-error-soft p-2 text-xs font-medium text-product-error-ink"
					id="catalogName-status"
					role="alert"
				>
					{errors?.name ||
						"This name is already in use. Please choose a different name."}
				</p>
			)}
		</div>
	);
};

export default CatalogueNameInput;
