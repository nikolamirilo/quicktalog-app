"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import type { BuilderAction } from "./useBuilderActions";

/** A rail item: icon over a short label, 56px wide, at least 52px tall. */
const railItemClass =
	"h-auto min-h-[52px] w-full flex-col gap-1 whitespace-normal rounded-2xl px-0.5 py-2 text-center text-[11px] font-semibold leading-tight hover:translate-y-0 [&_svg]:size-5";

const RailDivider = () => (
	<span aria-hidden="true" className="my-1 h-px w-10 bg-product-border" />
);

/**
 * The builder's desktop rail (from `md`): the editor toggle, the catalogue
 * actions, and the way out (dashboard). Every item carries a
 * visible label, so nothing needs a tooltip to be understood.
 */
export const BuilderRail = ({
	isPanelOpen,
	onTogglePanel,
	panelId,
	actions,
}: {
	isPanelOpen: boolean;
	onTogglePanel: () => void;
	panelId: string;
	actions: BuilderAction[];
}) => (
	<div
		aria-label="Builder tools"
		className="hidden h-full w-full flex-col items-center gap-1 overflow-y-auto overflow-x-hidden border-l border-product-border bg-product-card px-1.5 py-3 md:flex"
		role="group"
	>
		<Button
			aria-controls={isPanelOpen ? panelId : undefined}
			aria-expanded={isPanelOpen}
			aria-label="Editor panel"
			className={cn(
				railItemClass,
				isPanelOpen &&
					"border-product-primary bg-product-primary-soft text-product-foreground hover:bg-product-primary-soft",
			)}
			onClick={onTogglePanel}
			title={isPanelOpen ? "Close the editor panel" : "Open the editor panel"}
			variant="ghost"
		>
			<SlidersHorizontal />
			<span aria-hidden="true">Editor</span>
		</Button>

		<RailDivider />

		{actions.map(({ key, icon: Icon, label, onClick, disabled, primary }) => (
			<Button
				className={cn(
					railItemClass,
					primary && "mt-1 shadow-none hover:shadow-none",
				)}
				disabled={disabled}
				key={key}
				onClick={onClick}
				variant={primary ? "default" : "ghost"}
			>
				<Icon />
				<span>{label}</span>
			</Button>
		))}

		<span aria-hidden="true" className="flex-1" />

		<RailDivider />

		<Button asChild className={railItemClass} variant="ghost">
			<Link href="/admin/dashboard">
				<ArrowLeft />
				<span>Dashboard</span>
			</Link>
		</Button>
	</div>
);
