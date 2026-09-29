"use client";

import {
	AppDialogContent,
	AppDialogFooter,
} from "@/components/modals/AppDialog";
import { CatalogueNameField } from "@/components/modals/CatalogueNameField";
import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { CatalogueNameField as NameFieldState } from "@/hooks/useCatalogueNameField";

type DuplicateCatalogueDialogProps = {
	isOpen: boolean;
	field: NameFieldState;
	loading: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

/** Name prompt for "Duplicate", with the live availability hint and URL preview. */
export function DuplicateCatalogueDialog({
	isOpen,
	field,
	loading,
	onCancel,
	onConfirm,
}: DuplicateCatalogueDialogProps) {
	const canConfirm =
		!loading &&
		field.value.trim().length > 0 &&
		!field.error &&
		!field.checking;

	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
			open={isOpen}
		>
			<AppDialogContent size="sm">
				<AlertDialogTitle>Duplicate Catalogue</AlertDialogTitle>
				<AlertDialogDescription className="text-sm">
					Please provide a name for the catalogue
				</AlertDialogDescription>

				<CatalogueNameField
					disabled={loading}
					field={field}
					id="duplicate-catalogue-name"
					label="Name"
					onKeyDown={(event) => {
						if (event.key === "Enter" && canConfirm) onConfirm();
					}}
					placeholder="Enter name..."
				/>

				<AppDialogFooter>
					<AlertDialogCancel className="mt-0" disabled={loading}>
						Cancel
					</AlertDialogCancel>
					<Button
						aria-busy={loading || undefined}
						disabled={!canConfirm}
						onClick={onConfirm}
					>
						{loading ? "Duplicating..." : "Confirm"}
					</Button>
				</AppDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
}
