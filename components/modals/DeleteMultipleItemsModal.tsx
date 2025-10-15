"use client";
import { useState } from "react";
import { FiAlertTriangle, FiTrash2 } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Catalogue } from "@/types";

interface DeleteMultipleItemsModalProps {
	isOpen: boolean;
	catalogues: Catalogue[];
	onConfirm: (selectedIds: string[]) => Promise<void>;
	maxAllowed: number;
}

const DeleteMultipleItemsModal = ({
	isOpen,
	catalogues,
	onConfirm,
	maxAllowed,
}: DeleteMultipleItemsModalProps) => {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [isDeleting, setIsDeleting] = useState(false);

	const statusColors: Record<string, string> = {
		active: "text-white bg-green-700",
		inactive: "text-white bg-product-secondary",
		draft: "text-white bg-product-primary",
	};

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

	return (
		<Dialog open={isOpen}>
			<DialogContent
				className="max-w-4xl max-h-[80vh] overflow-hidden bg-product-background border border-product-border"
				showClose={false}
			>
				<DialogHeader className="pb-4">
					<DialogTitle className="flex items-center gap-2 text-product-foreground font-heading">
						<FiAlertTriangle className="text-orange-500 w-6 h-6" />
						Catalogue Limit Exceeded
					</DialogTitle>
					<DialogDescription className="text-product-foreground-accent">
						You have {catalogues.length} catalogues, but your plan allows only{" "}
						{maxAllowed}. Please select at least {requiredDeletions} catalogue
						{requiredDeletions > 1 ? "s" : ""} to delete.
						<br />
						<span className="text-red-500 font-medium">
							Selected: {selectedIds.length} / Required: {requiredDeletions}
						</span>
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-wrap overflow-y-auto pr-2 gap-3 max-h-96">
					{catalogues.map((catalogue) => (
						<Card
							className={`p-4 flex items-center gap-4 w-[45%] transition-all duration-200 ${
								selectedIds.includes(catalogue.id)
									? "border-red-500 bg-red-50/50"
									: "border-product-border bg-product-background hover:shadow-product-hover-shadow"
							}`}
							key={catalogue.id}
						>
							<Checkbox
								checked={selectedIds.includes(catalogue.id)}
								className="data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
								id={catalogue.id}
								onCheckedChange={(checked) =>
									handleCheckboxChange(catalogue.id, checked as boolean)
								}
							/>

							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-3 mb-2">
									<h3 className="font-semibold text-product-foreground truncate font-heading">
										{catalogue.name}
									</h3>
									<Badge
										className={`${
											statusColors[catalogue.status] ||
											"bg-gray-100 text-gray-700"
										} shrink-0`}
									>
										{catalogue.status.toUpperCase()}
									</Badge>
								</div>

								<div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-product-foreground-accent">
									<span>
										Updated:{" "}
										{new Date(catalogue.updated_at).toLocaleString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</span>
									<span>
										Created:{" "}
										{new Date(catalogue.created_at).toLocaleString("en-US", {
											year: "numeric",
											month: "short",
											day: "numeric",
										})}
									</span>
								</div>
							</div>
						</Card>
					))}
				</div>

				<DialogFooter className="pt-4 border-t border-product-border">
					{/* <Button variant="outline" onClick={handleCancel} disabled={isDeleting} className="mr-2">
            Cancel
          </Button> */}
					<Button
						className="bg-red-600 hover:bg-red-700"
						disabled={!canProceed || isDeleting}
						onClick={handleConfirm}
						variant="destructive"
					>
						{isDeleting ? (
							"Deleting..."
						) : (
							<>
								<FiTrash2 className="w-4 h-4 mr-2" />
								Delete {selectedIds.length} Catalogue
								{selectedIds.length !== 1 ? "s" : ""}
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default DeleteMultipleItemsModal;
