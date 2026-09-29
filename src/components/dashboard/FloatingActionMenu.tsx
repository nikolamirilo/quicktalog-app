"use client";
import type { AreLimitesReached } from "@quicktalog/common";
import { Plus } from "lucide-react";

import {
	CreateCatalogueProvider,
	useCreateCatalogueDialog,
} from "@/components/catalogue/create/CreateCatalogueProvider";
import { cn } from "@/lib/ui/cn";

type FloatingActionMenuProps = {
	areLimitsReached: AreLimitesReached;
};

/**
 * The round "+" button that opens the create dialog (`.as-fab`). It uses the
 * page's `CreateCatalogueProvider`, so the dialogs are mounted once; at the
 * catalogue limit the provider shows the upgrade dialog instead.
 */
export function FloatingActionMenu(props: FloatingActionMenuProps) {
	const dialog = useCreateCatalogueDialog();
	if (!dialog) {
		return (
			<CreateCatalogueProvider>
				<FloatingActionMenu {...props} />
			</CreateCatalogueProvider>
		);
	}

	return (
		<button
			aria-label="Create catalogue"
			className={cn(
				"fixed bottom-[calc(20px+env(safe-area-inset-bottom))] right-5 z-[45] grid h-[60px] w-[60px] place-items-center rounded-full bg-product-primary text-product-foreground shadow-[0_14px_30px_-8px_rgb(var(--product-primary-accent-rgb)/0.7),0_2px_6px_rgb(var(--product-foreground-rgb)/0.14)] transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:rotate-90 hover:bg-product-primary-accent active:scale-[0.96] lg:bottom-[calc(32px+env(safe-area-inset-bottom))] lg:right-8",
				props.areLimitsReached.catalogues && "opacity-60",
			)}
			onClick={dialog.openCreateCatalogue}
			title="Create catalogue"
			type="button"
		>
			<Plus aria-hidden="true" className="size-[26px]" strokeWidth={2.4} />
		</button>
	);
}
