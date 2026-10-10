import {
	AlertDialogDescription,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LimitContentData } from "./limitContent";
import { IoSearch } from "react-icons/io5";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";

interface LimitsModalHeaderProps {
	isNotFound: boolean;
	content: LimitContentData;
	IconComponent: LucideIcon | IconType;
	onClose?: () => void;
}

const CloseIcon = () => (
	<svg
		className="w-5 h-5"
		fill="none"
		stroke="currentColor"
		viewBox="0 0 24 24"
	>
		<path
			d="M6 18L18 6M6 6l12 12"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth={2}
		/>
	</svg>
);

const LimitsModalHeader = ({
	isNotFound,
	content,
	IconComponent,
	onClose,
}: LimitsModalHeaderProps) => {
	return (
		<AlertDialogHeader className="relative p-4 sm:p-6 md:p-8 text-center bg-product-background-hero space-y-0 flex-shrink-0">
			{onClose ? (
				<button
					aria-label="Close"
					className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors z-10"
					onClick={onClose}
				>
					<CloseIcon />
				</button>
			) : (
				<Link
					aria-label="Go to dashboard"
					className="absolute top-4 right-4 text-product-foreground-accent hover:text-product-foreground transition-colors z-10"
					href="/admin/dashboard"
				>
					<CloseIcon />
				</Link>
			)}

			<div className="flex justify-center mb-2">
				<div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center bg-product-primary shadow-lg">
					{isNotFound ? (
						<IoSearch className="w-5 h-5 sm:w-6 sm:h-6 text-product-secondary" />
					) : (
						<IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-product-secondary" />
					)}
				</div>
			</div>

			<AlertDialogTitle className="text-xl sm:text-2xl font-bold mb-2 text-product-foreground text-center">
				{isNotFound
					? "Catalogue Not Found"
					: `Need ${+content.currentLimit > 0 ? "More" : ""} ${content.feature}?`}
			</AlertDialogTitle>
			<AlertDialogDescription className="text-sm sm:text-base text-product-foreground-accent text-center leading-relaxed">
				{isNotFound
					? "The selected catalogue is inactive or doesn't exist. Join thousands of businesses already using Quicktalog to showcase their offerings digitally."
					: "Upgrade your plan to unlock more features and take your digital catalogues to the next level."}
			</AlertDialogDescription>
		</AlertDialogHeader>
	);
};

export default LimitsModalHeader;
