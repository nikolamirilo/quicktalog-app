"use client";
import { BUSINESS_TYPES, resolveBusinessType } from "@quicktalog/common";
import { X } from "lucide-react";
import { type MouseEvent, useEffect } from "react";

import {
	AppDialogContent,
	AppDialogFooter,
} from "@/components/modals/AppDialog";
import {
	CatalogueNameField,
	CatalogueUrlPreview,
} from "@/components/modals/CatalogueNameField";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
	SearchableSelect,
	type SearchableSelectOption,
} from "@/components/ui/searchable-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/constants";
import { LANGUAGE_OPTIONS } from "@/constants/ocr";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { useCatalogueNameField } from "@/hooks/useCatalogueNameField";

const LANGUAGE_SELECT_OPTIONS: SearchableSelectOption[] = LANGUAGE_OPTIONS.map(
	(lang) => ({ value: lang.code, label: lang.name }),
);

const CURRENCY_SELECT_OPTIONS: SearchableSelectOption[] = CURRENCIES.map(
	(currency) => ({
		value: currency.value,
		label: currency.label,
		keywords: currency.value,
	}),
);

interface InitCatalogueModalProps {
	isOpen: boolean;
	/** Creates the catalogue; resolves to true once the builder is being opened. */
	onConfirm: () => Promise<boolean>;
	onCancel?: () => void;
	loading?: boolean;
	/** Warms the builder route while the form is being filled in. */
	onNameSettled?: (name: string) => void;
}

/**
 * "Create a Catalogue" dialog. The values live in CatalogueContext, which the
 * create hook sends to the server; the server derives the slug again and
 * decides whether the name is free.
 */
export function InitCatalogueModal({
	isOpen,
	onConfirm,
	onCancel,
	loading = false,
	onNameSettled,
}: InitCatalogueModalProps) {
	const { catalogue, updateCatalogue } = useCatalogueContext();
	const nameField = useCatalogueNameField({
		value: catalogue.name ?? "",
		onValueChange: (name) => updateCatalogue({ name }),
		// Check availability only while the dialog is open.
		enabled: isOpen,
	});
	const { reset: resetNameField } = nameField;

	// Each opening starts clean; the values were reset by the opener.
	useEffect(() => {
		if (isOpen) resetNameField();
	}, [isOpen, resetNameField]);

	const typedName = catalogue.name ?? "";
	useEffect(() => {
		if (isOpen && typedName.trim()) onNameSettled?.(typedName);
	}, [isOpen, typedName, onNameSettled]);

	const isFormValid = Boolean(
		catalogue.name?.trim() &&
			catalogue.language &&
			catalogue.currency &&
			catalogue.businessType &&
			!nameField.error,
	);

	const handleConfirm = async (event: MouseEvent) => {
		// Stay open and loading until the builder replaces the page: closing first
		// left the home page on screen with nothing happening.
		event.preventDefault();
		if (!isFormValid || loading) return;
		const created = await onConfirm();
		// If it failed (the name may have been taken meanwhile), the hint must
		// not keep saying "available": ask again.
		if (!created) nameField.revalidate();
	};

	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open && onCancel && !loading) onCancel();
			}}
			open={isOpen}
		>
			<AppDialogContent>
				<div className="flex items-start justify-between gap-3">
					<div className="flex flex-col gap-1">
						<AlertDialogTitle>Create a Catalogue</AlertDialogTitle>
						<AlertDialogDescription className="text-sm">
							Please enter the following information to get started
						</AlertDialogDescription>
					</div>
					{onCancel && (
						<button
							aria-label="Close"
							className="-mr-1.5 -mt-1.5 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent transition-colors hover:bg-product-background-hero hover:text-product-foreground disabled:opacity-50"
							disabled={loading}
							onClick={onCancel}
							type="button"
						>
							<X aria-hidden="true" className="size-5" />
						</button>
					)}
				</div>

				<div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
					<CatalogueNameField
						disabled={loading}
						field={nameField}
						id="catalogName"
						required
						showUrlPreview={false}
					/>

					<div className="flex min-w-0 flex-col gap-1.5">
						<Label htmlFor="language">Language</Label>
						<SearchableSelect
							disabled={loading}
							id="language"
							onValueChange={(value) => updateCatalogue({ language: value })}
							options={LANGUAGE_SELECT_OPTIONS}
							placeholder="Select language"
							searchPlaceholder="Search languages"
							value={catalogue.language}
						/>
					</div>

					<div className="flex min-w-0 flex-col gap-1.5">
						<Label htmlFor="currency">Currency</Label>
						<SearchableSelect
							disabled={loading}
							id="currency"
							onValueChange={(value) => updateCatalogue({ currency: value })}
							options={CURRENCY_SELECT_OPTIONS}
							placeholder="Select currency"
							searchPlaceholder="Search currencies"
							value={catalogue.currency}
						/>
					</div>

					<div className="flex min-w-0 flex-col gap-1.5">
						<Label htmlFor="businessType">Business Type</Label>
						<Select
							disabled={loading}
							onValueChange={(value) =>
								updateCatalogue({ businessType: value })
							}
							value={resolveBusinessType(catalogue.businessType)?.value ?? ""}
						>
							<SelectTrigger id="businessType">
								<SelectValue placeholder="Select business type" />
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
				</div>

				<CatalogueUrlPreview name={catalogue.name ?? ""} />

				<AppDialogFooter>
					{onCancel && (
						<AlertDialogCancel className="mt-0" disabled={loading}>
							Cancel
						</AlertDialogCancel>
					)}
					<AlertDialogAction
						aria-busy={loading || undefined}
						disabled={loading || !isFormValid}
						onClick={handleConfirm}
					>
						{loading ? "Creating..." : "Create Catalogue"}
					</AlertDialogAction>
				</AppDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
}
