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
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CURRENCIES } from "@/constants";
import { BUSINESS_TYPES } from "@/constants/catalogue";
import { LANGUAGE_OPTIONS } from "@/constants/ocr";
import { useCatalogueContext } from "@/context/CatalogueContext";
import { Search, X } from "lucide-react";

interface InitCatalogueModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel?: () => void;
	loading?: boolean;
}

export default function InitCatalogueModal({
	isOpen,
	onConfirm,
	onCancel,
	loading = false,
}: InitCatalogueModalProps) {
	const { catalogue, updateCatalogue } = useCatalogueContext();

	// Generate URL based on catalog name
	const generatedUrl = catalogue.name
		? `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "")}`
		: `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/`;

	const handleConfirm = () => {
		if (
			catalogue.name &&
			catalogue.language &&
			catalogue.currency &&
			catalogue.business_type
		) {
			onConfirm();
		}
	};

	const isFormValid =
		catalogue.name &&
		catalogue.language &&
		catalogue.currency &&
		catalogue.business_type;

	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open && onCancel) onCancel();
			}}
			open={isOpen}
		>
			<AlertDialogContent className="font-lora text-product-foreground w-[95vw] max-w-lg mx-auto p-6 sm:p-8 bg-product-background border border-product-border shadow-product-shadow rounded-2xl">
				<AlertDialogHeader className="space-y-3 relative">
					{onCancel && (
						<button
							className="absolute -top-2 -right-2 p-1 rounded-full hover:bg-product-foreground-accent/10 transition-colors duration-200 text-product-foreground-accent hover:text-product-foreground"
							disabled={loading}
							onClick={onCancel}
							type="button"
						>
							<X className="h-5 w-5" />
						</button>
					)}
					<AlertDialogTitle className="text-xl font-bold text-product-foreground font-heading mb-3">
						Create a Catalog
					</AlertDialogTitle>
					<AlertDialogDescription className="text-product-foreground-accent text-base leading-relaxed">
						Please enter the following information to get started
					</AlertDialogDescription>
				</AlertDialogHeader>

				<div className="space-y-4 py-4">
					{/* Catalog Name and Language Row */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label
								className="text-sm font-medium text-product-foreground"
								htmlFor="catalogName"
							>
								Catalog Name
							</Label>
							<Input
								className="bg-product-background border-product-border text-product-foreground placeholder:text-product-foreground-accent/50 focus:border-product-primary focus:ring-product-primary"
								disabled={loading}
								id="catalogName"
								onChange={(e) => updateCatalogue({ name: e.target.value })}
								placeholder="e.g. Burger House"
								type="text"
								value={catalogue.name}
							/>
						</div>

						<div className="space-y-2">
							<Label
								className="text-sm font-medium text-product-foreground"
								htmlFor="language"
							>
								Language
							</Label>
							<Select
								disabled={loading}
								onValueChange={(value) => updateCatalogue({ language: value })}
								value={catalogue.language}
							>
								<SelectTrigger
									className="bg-product-background border-product-border text-product-foreground focus:border-product-primary focus:ring-product-primary"
									id="language"
								>
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
					</div>

					{/* Currency and Business Type Row */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label
								className="text-sm font-medium text-product-foreground"
								htmlFor="currency"
							>
								Currency
							</Label>
							<Select
								disabled={loading}
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

						<div className="space-y-2">
							<Label
								className="text-sm font-medium text-product-foreground"
								htmlFor="business_type"
							>
								Business Type
							</Label>
							<Select
								disabled={loading}
								onValueChange={(value) =>
									updateCatalogue({ business_type: value })
								}
								value={catalogue.business_type}
							>
								<SelectTrigger
									className="bg-product-background border-product-border text-product-foreground focus:border-product-primary focus:ring-product-primary"
									id="business_type"
								>
									<SelectValue placeholder="Select type" />
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

					{/* URL Preview */}
					<div className="space-y-2 pt-2">
						<Label
							className="text-sm font-medium text-product-foreground"
							htmlFor="urlPreview"
						>
							Your URL will be
						</Label>
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-product-foreground-accent" />
							<Input
								className="bg-product-background border-product-border text-product-foreground-accent pl-10 cursor-not-allowed"
								disabled
								id="urlPreview"
								readOnly
								type="text"
								value={generatedUrl}
							/>
						</div>
					</div>
				</div>

				<AlertDialogFooter className="pt-4 border-t border-product-border">
					{onCancel && (
						<AlertDialogCancel
							className="bg-product-foreground-accent/10 text-product-foreground-accent hover:bg-product-foreground-accent/20 border border-product-border hover:border-product-foreground-accent/30 transition-colors duration-200"
							disabled={loading}
						>
							Cancel
						</AlertDialogCancel>
					)}
					<AlertDialogAction
						className="bg-product-primary text-product-foreground hover:bg-product-product-primary-accent border border-product-primary hover:border-product-product-primary-accent transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
						disabled={loading || !isFormValid}
						onClick={handleConfirm}
					>
						{loading ? "Creating..." : "Create Catalog"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
