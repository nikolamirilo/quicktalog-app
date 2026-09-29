import type { LucideIcon } from "lucide-react";
import { Search, X } from "lucide-react";
import Link from "next/link";

import { AppDialogIcon } from "@/components/modals/AppDialog";
import {
	AlertDialogDescription,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LimitContentData } from "@/components/modals/limits/limitContent";

interface LimitsModalHeaderProps {
	isNotFound: boolean;
	content: LimitContentData;
	IconComponent: LucideIcon;
	onClose?: () => void;
}

const closeClass =
	"-mr-1.5 -mt-1.5 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent transition-colors hover:bg-product-background-hero hover:text-product-foreground [&_svg]:size-5";

export const LimitsModalHeader = ({
	isNotFound,
	content,
	IconComponent,
	onClose,
}: LimitsModalHeaderProps) => {
	const hasExistingAccess =
		content.currentLimit === "unlimited" ||
		(typeof content.currentLimit === "number" && content.currentLimit > 0);

	return (
		<>
			<div className="flex items-start justify-between gap-3">
				<AppDialogIcon>
					{isNotFound ? <Search /> : <IconComponent />}
				</AppDialogIcon>
				{onClose ? (
					<button
						aria-label="Close"
						className={closeClass}
						onClick={onClose}
						type="button"
					>
						<X aria-hidden="true" />
					</button>
				) : (
					<Link
						aria-label="Go to dashboard"
						className={closeClass}
						href="/admin/dashboard"
					>
						<X aria-hidden="true" />
					</Link>
				)}
			</div>

			<AlertDialogTitle>
				{isNotFound
					? "Catalogue Not Found"
					: `Need ${hasExistingAccess ? "More " : ""}${content.feature}?`}
			</AlertDialogTitle>
			<AlertDialogDescription className="text-sm">
				{isNotFound
					? "The selected catalogue is inactive or doesn't exist. Join thousands of businesses already using Quicktalog to showcase their offerings digitally."
					: "Upgrade your plan to unlock more features and take your digital catalogues to the next level."}
			</AlertDialogDescription>
		</>
	);
};
