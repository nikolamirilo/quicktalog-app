"use client";
import { SquarePen } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import {
	CreateCatalogueProvider,
	useCreateCatalogueDialog,
} from "@/components/catalogue/create/CreateCatalogueProvider";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/ui/cn";

interface CreateCatalogueButtonProps {
	disabled?: boolean;
	/** `hero` is the large home-page button. */
	size?: "default" | "hero";
	showUpgradeTooltip?: boolean;
	className?: string;
	/** Replaces the default label. */
	children?: ReactNode;
}

/**
 * Opens the create-catalogue flow of the nearest `CreateCatalogueProvider`,
 * so a page with several of these mounts the dialogs once. Outside a provider
 * it brings its own, so it still works anywhere.
 */
export function CreateCatalogueButton(props: CreateCatalogueButtonProps) {
	const dialog = useCreateCatalogueDialog();
	if (!dialog) {
		return (
			<CreateCatalogueProvider>
				<CreateCatalogueButton {...props} />
			</CreateCatalogueProvider>
		);
	}

	const {
		disabled = false,
		showUpgradeTooltip = false,
		size = "default",
		className,
		children,
	} = props;

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						className={cn(
							size === "hero" ? "w-fit min-w-[224px]" : "w-full",
							className,
						)}
						disabled={disabled}
						onClick={() => {
							if (!disabled) dialog.openCreateCatalogue();
						}}
						size={size === "hero" ? "lg" : "default"}
					>
						{children ??
							(size === "default" ? (
								<>
									<SquarePen aria-hidden="true" />
									Create Catalogue
								</>
							) : (
								"Start Creating Now"
							))}
					</Button>
				</TooltipTrigger>
				{showUpgradeTooltip && disabled && (
					<TooltipContent className="max-w-[240px]">
						<div className="flex flex-col gap-3">
							<p className="text-sm leading-relaxed">
								Upgrade to unlock more catalogues and get higher limits.
							</p>
							<Button asChild className="self-start" size="sm">
								<Link href="/pricing">View Pricing</Link>
							</Button>
						</div>
					</TooltipContent>
				)}
			</Tooltip>
		</TooltipProvider>
	);
}
