"use client";

import { generateUniqueSlug } from "@quicktalog/common";
import { AlertCircle, CheckCircle, Link2 } from "lucide-react";
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
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	errors: { [key: string]: string };
	touched: { [key: string]: boolean };
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
	onChange,
	errors,
	touched,
}: InputModalProps) {
	const handleConfirm = () => {
		if (!loading && name.trim() && !errors.name) {
			onConfirm(name.trim());
		}
	};

	const isValid = name.trim() && !errors.name && touched.name;
	const nameExists =
		errors.name ===
		"This name is already in use. Please choose a different name.";

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
						<div className="relative">
							<Input
								className={`bg-product-background border-product-border focus:border-product-primary focus:ring-product-primary pr-10 ${
									errors.name
										? "border-red-500 focus:border-red-500"
										: name && !nameExists && touched.name
											? "border-green-500 focus:border-green-500"
											: ""
								}`}
								id="name"
								onChange={onChange}
								placeholder="Enter name..."
								type="text"
								value={name}
							/>
							{/* Real-time validation icon */}
							{name && touched.name && (
								<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
									{errors.name ? (
										<AlertCircle className="h-4 w-4 text-red-500" />
									) : (
										<CheckCircle className="h-4 w-4 text-green-500" />
									)}
								</div>
							)}
						</div>

						{/* Success message */}
						{name && !errors.name && touched.name && (
							<div className="text-green-600 text-sm mt-2 p-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
								<CheckCircle className="h-4 w-4" />
								Great! This name is available.
							</div>
						)}

						{/* Error message */}
						{touched.name && errors.name && (
							<div className="text-red-500 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
								<AlertCircle className="h-4 w-4" />
								{errors.name}
							</div>
						)}
					</div>
				</AlertDialogHeader>

				{/* URL Preview */}
				{name && (
					<div className="mt-2 p-3 bg-gray-100 border border-gray-200 rounded-lg">
						<div className="flex items-start gap-2">
							<Link2 className="text-product-primary" size={25} />
							<div className="flex-1 min-w-0">
								<p className="text-sm text-product-foreground font-medium mb-1">
									Your catalogue URL will be:
								</p>
								<p className="text-sm text-product-primary font-mono break-all">
									{`${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${generateUniqueSlug(name)}`}
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
						className="bg-product-primary text-product-foreground hover:bg-product-primary-accent border border-product-primary hover:border-product-primary-accent transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading || !isValid}
						onClick={handleConfirm}
					>
						{loading ? "Processing..." : confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
