"use client";
import type { Catalogue } from "@quicktalog/common";
import { Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "@/components/dashboard/overview/StatusBadge";
import { parseTimestamp } from "@/components/dashboard/overview/timestamps";
import {
	AppDialogContent,
	AppDialogFooter,
	AppDialogIcon,
} from "@/components/modals/AppDialog";
import {
	AlertDialog,
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/ui/cn";

interface DeleteMultipleItemsModalProps {
	isOpen: boolean;
	catalogues: Catalogue[];
	onConfirm: (selectedIds: string[]) => Promise<void>;
	maxAllowed: number;
}

/**
 * Shown when the plan allows fewer catalogues than the user has (after a
 * downgrade): pick which to delete. It cannot be dismissed.
 */
export const DeleteMultipleItemsModal = ({
	isOpen,
	catalogues,
	onConfirm,
	maxAllowed,
}: DeleteMultipleItemsModalProps) => {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);

	const excessCount = catalogues.length - maxAllowed;
	const requiredDeletions = Math.max(excessCount, 0);
	const canProceed = selectedIds.length >= requiredDeletions;

	const handleCheckboxChange = (catalogueId: string, checked: boolean) => {
		if (checked) {
			setSelectedIds((prev) => [...prev, catalogueId]);
		} else {
			setSelectedIds((prev) => prev.filter((id) => id !== catalogueId));
		}
	};

	const handleConfirm = async () => {
		if (!canProceed) return;

		setIsDeleting(true);
		try {
			await onConfirm(selectedIds);
			setSelectedIds([]);
		} finally {
			setIsDeleting(false);
		}
	};

	const formatDate = (value: string) => {
		const time = parseTimestamp(value);
		return Number.isNaN(time)
			? "-"
			: new Date(time).toLocaleString("en-US", {
					year: "numeric",
					month: "short",
					day: "numeric",
				});
	};

	return (
		<AlertDialog open={isOpen}>
			<AppDialogContent className="max-h-[85dvh] overflow-hidden" size="lg">
				<AppDialogIcon tone="red">
					<TriangleAlert />
				</AppDialogIcon>
				<div className="flex flex-col gap-1.5">
					<AlertDialogTitle>Catalogue Limit Exceeded</AlertDialogTitle>
					<AlertDialogDescription className="text-sm">
						You have {catalogues.length} catalogues, but your plan allows only{" "}
						{maxAllowed}. Please select at least {requiredDeletions} catalogue
						{requiredDeletions > 1 ? "s" : ""} to delete.
					</AlertDialogDescription>
					<p
						aria-live="polite"
						className={cn(
							"text-sm font-semibold",
							canProceed ? "text-product-success" : "text-product-error",
						)}
					>
						Selected: {selectedIds.length} / Required: {requiredDeletions}
					</p>
				</div>

				<ul className="-mr-2 grid min-h-0 flex-1 grid-cols-1 gap-2.5 overflow-y-auto pr-2 sm:grid-cols-2">
					{catalogues.map((catalogue) => {
						const selected = selectedIds.includes(catalogue.id);
						return (
							<li key={catalogue.id}>
								<label
									className={cn(
										"flex cursor-pointer items-start gap-3 rounded-2xl border bg-product-card p-3.5 transition-colors",
										selected
											? "border-product-error bg-product-error-soft"
											: "border-product-border hover:border-product-border-strong",
									)}
									htmlFor={`delete-${catalogue.id}`}
								>
									<Checkbox
										checked={selected}
										className="mt-0.5"
										id={`delete-${catalogue.id}`}
										onCheckedChange={(checked) =>
											handleCheckboxChange(catalogue.id, checked as boolean)
										}
									/>
									<span className="flex min-w-0 flex-1 flex-col gap-1.5">
										<span className="flex flex-wrap items-center gap-2">
											<span className="min-w-0 break-words font-product-heading text-[15px] font-bold">
												{catalogue.name}
											</span>
											<StatusBadge status={catalogue.status} />
										</span>
										<span className="text-xs text-product-muted">
											Updated: {formatDate(catalogue.updatedAt)} · Created:{" "}
											{formatDate(catalogue.createdAt)}
										</span>
									</span>
								</label>
							</li>
						);
					})}
				</ul>

				<AppDialogFooter className="border-t border-product-border pt-4">
					<Button
						aria-busy={isDeleting || undefined}
						disabled={!canProceed || isDeleting}
						onClick={handleConfirm}
						variant="destructive"
					>
						{isDeleting ? (
							"Deleting..."
						) : (
							<>
								<Trash2 aria-hidden="true" />
								Delete {selectedIds.length} Catalogue
								{selectedIds.length !== 1 ? "s" : ""}
							</>
						)}
					</Button>
				</AppDialogFooter>
			</AppDialogContent>
		</AlertDialog>
	);
};
