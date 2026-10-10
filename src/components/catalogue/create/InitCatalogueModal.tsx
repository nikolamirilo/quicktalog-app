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

interface InitCatalogueModalProps {
	isOpen: boolean;
	/** Creates the catalogue; resolves once the server has answered. */
	onConfirm: () => unknown | Promise<unknown>;
	onCancel?: () => void;
	loading?: boolean;
}

/**
 * "Create a Catalog" dialog. The values live in CatalogueContext, which the
 * create hook sends to the server; the server derives the slug again and
 * decides whether the name is free.
 *
 * Playwright relies on: role=alertdialog, the "Create a Catalog" title, the
 * ids #catalogName / #language / #currency / #businessType (Radix selects with
 * option roles) and the "Create Catalog" button.
 */
export function InitCatalogueModal({
	isOpen,
	onConfirm,
	onCancel,
	loading = false,
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

	const isFormValid = Boolean(
		catalogue.name?.trim() &&
			catalogue.language &&
			catalogue.currency &&
			catalogue.businessType &&
			!nameField.error,
	);

	const handleConfirm = async (event: MouseEvent) => {
		// Stay open while the catalogue is created: the hook closes the dialog
		// on success and keeps the values when it fails.
		event.preventDefault();
		if (!isFormValid || loading) return;
		await onConfirm();
		// If it failed (the name may have been taken meanwhile), the hint must
		// not keep saying "available": ask again. A closed dialog skips this.
		nameField.revalidate();
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
						<AlertDialogTitle>Create a Catalog</AlertDialogTitle>
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
						<Select
							disabled={loading}
							onValueChange={(value) => updateCatalogue({ language: value })}
							value={catalogue.language}
						>
							<SelectTrigger id="language">
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

					<div className="flex min-w-0 flex-col gap-1.5">
						<Label htmlFor="currency">Currency</Label>
						<Select
							disabled={loading}
							onValueChange={(value) => updateCatalogue({ currency: value })}
							value={catalogue.currency}
						>
							<SelectTrigger id="currency">
								<SelectValue placeholder="Select currency" />
							</SelectTrigger>
							<SelectContent>
								{CURRENCIES.map((currency) => (
									<SelectItem key={currency.value} value={currency.value}>
										{currency.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
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
						{loading ? "Creating..." : "Create Catalog"}
					</AlertDialogAction>
				</AppDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
}
