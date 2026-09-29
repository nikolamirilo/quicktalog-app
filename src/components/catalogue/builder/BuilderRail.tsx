"use client";

import { CHAT_PANEL_ID } from "@/components/catalogue/chat/CatalogueChat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui/cn";
import { ArrowLeft, SlidersHorizontal, Sparkles } from "lucide-react";
import Link from "next/link";
import type { BuilderAction } from "./useBuilderActions";

/** A rail item: icon over a short label, 56px wide, at least 52px tall. */
const railItemClass =
	"h-auto min-h-[52px] w-14 flex-col gap-1 rounded-2xl px-0 py-2 text-[11px] font-semibold leading-none hover:translate-y-0 [&_svg]:size-5";

const RailDivider = () => (
	<span aria-hidden="true" className="my-1 h-px w-10 bg-product-border" />
);

/**
 * The builder's desktop rail (from `md`): the editor toggle, the catalogue
 * actions, and the ways out (AI assistant, dashboard). Every item carries a
 * visible label, so nothing needs a tooltip to be understood.
 */
export const BuilderRail = ({
	isPanelOpen,
	onTogglePanel,
	panelId,
	actions,
	isChatOpen,
	onToggleChat,
}: {
	isPanelOpen: boolean;
	onTogglePanel: () => void;
	panelId: string;
	actions: BuilderAction[];
	isChatOpen: boolean;
	onToggleChat: () => void;
}) => (
	<div
		aria-label="Builder tools"
		className="hidden h-full w-full flex-col items-center gap-1 overflow-y-auto border-l border-product-border bg-product-card px-2 py-3 md:flex"
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

		<Button
			aria-controls={isChatOpen ? CHAT_PANEL_ID : undefined}
			aria-expanded={isChatOpen}
			className={cn(
				railItemClass,
				isChatOpen &&
					"border-product-primary bg-product-primary-soft text-product-foreground hover:bg-product-primary-soft",
			)}
			onClick={onToggleChat}
			variant="ghost"
		>
			<Sparkles />
			<span>Ask AI</span>
		</Button>

		<RailDivider />

		<Button asChild className={railItemClass} variant="ghost">
			<Link href="/admin/dashboard">
				<ArrowLeft />
				<span>Dashboard</span>
			</Link>
		</Button>
	</div>
);
