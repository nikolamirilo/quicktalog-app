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

interface InformModalProps {
	isOpen: boolean;
	onConfirm: () => void;
	onCancel?: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
	loading?: boolean;
	type?: "default" | "consent";
	image?: string;
	imageAlt?: string;
	icon?: React.ReactElement;
}

export default function InformModal({
	isOpen,
	onConfirm,
	onCancel,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
	loading = false,
	type = "default",
	image,
	imageAlt = "Screenshot",
	icon,
}: InformModalProps) {
	return (
		<AlertDialog
			onOpenChange={(open) => {
				if (!open && onCancel) onCancel();
			}}
			open={isOpen}
		>
			<AlertDialogContent className="text-product-foreground w-[95vw] max-w-lg mx-auto p-6 sm:p-8 bg-product-background border border-product-border shadow-product-shadow rounded-2xl">
				<AlertDialogHeader className="space-y-3">
					<AlertDialogTitle className="text-xl font-bold text-product-foreground font-heading mb-3">
						<div className="flex flex-row items-center justify-start gap-2">
							{icon} {title}
						</div>
					</AlertDialogTitle>
					<AlertDialogDescription className="text-product-foreground-accent text-base leading-relaxed">
						{message}
					</AlertDialogDescription>
					{image && (
						<div className="mt-4 rounded-lg overflow-hidden border border-product-border">
							<img
								alt={imageAlt}
								className="w-full h-auto max-h-64 object-cover"
								src={image}
							/>
						</div>
					)}
				</AlertDialogHeader>
				<AlertDialogFooter className="pt-4 border-t border-product-border">
					{onCancel && (
						<AlertDialogCancel
							className="bg-product-foreground-accent/10 text-product-foreground-accent hover:bg-product-foreground-accent/20 border border-product-border hover:border-product-foreground-accent/30 transition-colors duration-200"
							disabled={loading}
						>
							{cancelText}
						</AlertDialogCancel>
					)}
					<AlertDialogAction
						className="bg-product-primary text-product-foreground hover:bg-product-primary-accent border border-product-primary hover:border-product-primary-accent transition-colors duration-200 font-semibold"
						disabled={loading}
						onClick={onConfirm}
					>
						{loading ? "Processing..." : confirmText}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
