"use client";
import { QuickAiMark } from "@/components/catalogue/chat/QuickAiMark";
import type { BuilderAction } from "@/components/catalogue/builder/useBuilderActions";
import { CHAT_PANEL_ID } from "@/components/catalogue/chat/CatalogueChat";
import SelectTemplateModal from "@/components/catalogue/modals/SelectTemplateModal";
import SuccessModal from "@/components/modals/SuccessModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/ui/cn";
import { ChevronUp, SlidersHorizontal, X } from "lucide-react";

/**
 * A bar item: icon over label, at least 52px tall. Neutral ink until pressed,
 * so nothing looks selected before it is tapped.
 */
const barItemClass =
	"flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-xl pb-1 px-1 text-product-foreground-accent transition-colors duration-200 hover:text-product-foreground active:bg-product-background-hero disabled:pointer-events-none disabled:opacity-40 [-webkit-tap-highlight-color:transparent]";

const barLabelClass = "max-w-full truncate text-[11px] font-semibold";

/**
 * The phone bottom bar (below `md`). Quick AI and Templates, then the editor
 * button in the middle, then Save and a Publish slot whose menu also holds
 * Preview. The editor button sits in the bar rather than floating over it, so
 * it never covers the catalogue.
 */
export const BuilderBottomBar = ({
	isPanelOpen,
	onTogglePanel,
	panelId,
	onAskAi,
	isChatOpen,
	actions,
}: {
	isPanelOpen: boolean;
	onTogglePanel: () => void;
	panelId: string;
	onAskAi: () => void;
	isChatOpen: boolean;
	actions: Record<BuilderAction["key"], BuilderAction>;
}) => {
	const { templates, save, preview, publish } = actions;
	const PublishIcon = publish.icon;
	const PreviewIcon = preview.icon;

	return (
		<div
			aria-label="Builder actions"
			className="flex shrink-0 items-stretch gap-0.5 border-t border-product-border bg-product-card px-1 pt-1 pb-[max(0.25rem,env(safe-area-inset-bottom))] font-product-body shadow-[0_-8px_24px_-12px_rgb(var(--product-dark-rgb)/0.18)] md:hidden"
			role="toolbar"
		>
			<button
				aria-controls={isChatOpen ? CHAT_PANEL_ID : undefined}
				aria-expanded={isChatOpen}
				aria-label="Quick AI"
				className={barItemClass}
				onClick={onAskAi}
				type="button"
			>
				<QuickAiMark className="h-5 w-5" />
				<span className={barLabelClass}>Quick AI</span>
			</button>

			<button
				className={barItemClass}
				disabled={templates.disabled}
				onClick={templates.onClick}
				type="button"
			>
				<templates.icon className="h-5 w-5" />
				<span className={barLabelClass}>{templates.label}</span>
			</button>

			<button
				aria-controls={isPanelOpen ? panelId : undefined}
				aria-expanded={isPanelOpen}
				aria-label={isPanelOpen ? "Close editor panel" : "Open editor panel"}
				className="flex min-h-[52px] w-16 shrink-0 flex-col items-center justify-end gap-1 rounded-xl pb-1 text-product-foreground [-webkit-tap-highlight-color:transparent]"
				onClick={onTogglePanel}
				type="button"
			>
				<span
					className={cn(
						"flex h-8 w-11 items-center justify-center rounded-full transition-colors",
						isPanelOpen
							? "bg-product-dark text-product-on-dark"
							: "bg-product-primary text-product-foreground",
					)}
				>
					{isPanelOpen ? (
						<X className="h-5 w-5" />
					) : (
						<SlidersHorizontal className="h-5 w-5" />
					)}
				</span>
				<span className={barLabelClass}>
					{isPanelOpen ? "Close" : "Editor"}
				</span>
			</button>

			<button
				className={barItemClass}
				disabled={save.disabled}
				onClick={save.onClick}
				type="button"
			>
				<save.icon className="h-5 w-5" />
				<span className={barLabelClass}>{save.label}</span>
			</button>

			{/* Preview and publish share one slot; both are gated by the same condition. */}
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label={`${publish.label} or preview`}
					className={barItemClass}
					disabled={publish.disabled}
				>
					<span className="relative flex items-center">
						<PublishIcon className="h-5 w-5" />
						<ChevronUp className="-mr-2 ml-0.5 h-3 w-3" />
					</span>
					<span className={barLabelClass}>{publish.label}</span>
				</DropdownMenuTrigger>
				{/* Above the builder frame (z-1000), below the chat sheet and dialogs. */}
				<DropdownMenuContent
					align="end"
					className="z-[1010] mb-2 font-product-body"
					side="top"
				>
					<DropdownMenuItem onClick={preview.onClick}>
						<PreviewIcon className="mr-2 h-4 w-4" />
						{preview.label}
					</DropdownMenuItem>
					<DropdownMenuItem onClick={publish.onClick}>
						<PublishIcon className="mr-2 h-4 w-4" />
						{publish.label}
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
};

/** The modals the builder actions open; rendered once for both layouts. */
export const BuilderActionModals = ({
	catalogueName,
	isSuccessModalOpen,
	closeSuccessModal,
	isTemplateModalOpen,
	closeTemplateModal,
}: {
	catalogueName: string;
	isSuccessModalOpen: boolean;
	closeSuccessModal: () => void;
	isTemplateModalOpen: boolean;
	closeTemplateModal: () => void;
}) => (
	<>
		<SuccessModal
			catalogueUrl={`/catalogues/${catalogueName}`}
			isOpen={isSuccessModalOpen}
			onClose={closeSuccessModal}
			type="regular"
		/>
		{isTemplateModalOpen && (
			<SelectTemplateModal
				isOpen={isTemplateModalOpen}
				onClose={closeTemplateModal}
			/>
		)}
	</>
);
