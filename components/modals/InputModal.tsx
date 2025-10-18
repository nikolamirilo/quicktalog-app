"use client";

import { Link2 } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { generateUniqueSlug } from "@/shared";

interface InputModalProps {
	isOpen: boolean;
	onConfirm: (name: string) => void;
	onCancel: () => void;
	title: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	loading?: boolean;
	name: string;
	setName: (name: string) => void;
}

export default function InputModal({
	isOpen,
	onConfirm,
	onCancel,
	title,
	description,
	confirmText = "Confirm",
	cancelText = "Cancel",
	loading = false,
	name,
	setName,
}: InputModalProps) {
	const handleConfirm = () => {
		if (!loading) onConfirm(name.trim());
	};

	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open) onCancel();
			}}
			open={isOpen}
		>
			<AlertDialogContent className="text-product-foreground w-[95vw] max-w-lg mx-auto p-6 sm:p-8 bg-product-background border border-product-border shadow-product-shadow rounded-2xl">
				<AlertDialogHeader className="space-y-3">
					<AlertDialogTitle className="text-xl font-bold text-product-foreground font-heading mb-3">
						{title}
					</AlertDialogTitle>
					<AlertDialogDescription className="text-product-foreground-accent text-base leading-relaxed">
						{description}
					</AlertDialogDescription>

					<div className="mt-4">
						<label
							className="block text-sm font-medium text-product-foreground mb-2"
							htmlFor="name"
						>
							Name
						</label>
						<Input
							className="bg-product-background border-product-border focus:border-product-primary focus:ring-product-primary"
							id="name"
							onChange={(e) => setName(e.target.value)}
							placeholder="Enter name..."
							type="text"
							value={name}
						/>
					</div>
				</AlertDialogHeader>
				{name && (
					<div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
						<div className="flex items-start gap-2">
							<Link2 className="text-product-primary" size={25} />
							<div className="flex-1 min-w-0">
								<p className="text-sm text-product-foreground font-medium mb-1">
									Your catalogue URL will be:
								</p>
								<p className="text-sm text-product-primary font-mono break-all">
									{`${process.env.NEXT_PUBLIC_BASE_URL}/catalogue/${generateUniqueSlug(name)}`}
								</p>
							</div>
						</div>
					</div>
				)}

				<AlertDialogFooter className="pt-4 border-t border-product-border">
					{cancelText && (
						<AlertDialogCancel
							className="bg-product-foreground-accent/10 text-product-foreground-accent hover:bg-product-foreground-accent/20 border border-product-border hover:border-product-foreground-accent/30 transition-colors duration-200"
							disabled={loading}
						>
							{cancelText}
						</AlertDialogCancel>
					)}
					<AlertDialogAction
						className="bg-product-primary text-product-foreground hover:bg-product-primary-accent border border-product-primary hover:border-product-primary-accent transition-colors duration-200 font-semibold"
						disabled={loading || !name.trim()}
						onClick={handleConfirm}
					>
						{loading ? "Processing..." : confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
