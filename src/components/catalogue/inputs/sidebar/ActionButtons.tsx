"use client";
import { QuickAiMark } from "@/components/catalogue/chat/QuickAiMark";
import { SaveStatus } from "@/components/catalogue/builder/SaveStatus";
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
import Link from "next/link";

/**
 * A bar item: icon over label, at least 52px tall. Neutral ink until pressed,
 * so nothing looks selected before it is tapped.
 */
const barItemClass =
	"flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-end gap-1 rounded-xl pb-2.5 px-1 text-product-foreground-accent transition-colors duration-200 hover:text-product-foreground active:bg-product-background-hero disabled:pointer-events-none disabled:opacity-40 [-webkit-tap-highlight-color:transparent]";

const barLabelClass = "max-w-full truncate text-[11px] font-semibold";

/**
 * The phone bottom bar (below `md`). Quick AI and Templates, then the editor
 * button in the middle, then the autosave status and a Publish slot whose menu
 * also holds Preview and the QR code. The editor button sits in the bar rather
 * than floating over it, so it never covers the catalogue. There is no Save:
 * edits are written by themselves, and the status slot says so and opens the
 * kept versions.
 */
export const BuilderBottomBar = ({
	isPanelOpen,
	onTogglePanel,
	onOpenHistory,
	panelId,
	onAskAi,
	isChatOpen,
	highlightAi = false,
	actions,
}: {
	isPanelOpen: boolean;
	onTogglePanel: () => void;
	onOpenHistory: () => void;
	panelId: string;
	onAskAi: () => void;
	isChatOpen: boolean;
	/** A new, empty catalogue: Quick AI is what fills it, so it is pointed out once. */
	highlightAi?: boolean;
	actions: Record<BuilderAction["key"], BuilderAction>;
}) => {
	const { templates, preview, publish, qr } = actions;
	const PublishIcon = publish.icon;
	const PreviewIcon = preview.icon;
	const QrIcon = qr.icon;

	return (
		<div
			aria-label="Builder actions"
			className="flex shrink-0 items-stretch gap-0.5 border-t border-product-border bg-product-card px-1 pt-5 pb-[max(0.25rem,env(safe-area-inset-bottom))] font-product-body shadow-[0_-8px_24px_-12px_rgb(var(--product-dark-rgb)/0.18)] md:hidden"
			role="toolbar"
		>
			<button
				aria-controls={isChatOpen ? CHAT_PANEL_ID : undefined}
				aria-expanded={isChatOpen}
				aria-label="Quick AI"
				className={cn(
					barItemClass,
					highlightAi && "relative text-product-primary-ink",
				)}
				onClick={onAskAi}
				type="button"
			>
				{highlightAi && (
					// The sheet is not opened on a phone (it would cover the catalogue),
					// so the button says where to start instead.
					<span
						className="pointer-events-none absolute -top-9 left-1 z-10 w-max max-w-[64vw] animate-in rounded-full bg-product-dark px-3 py-1.5 text-[11px] font-semibold text-product-on-dark shadow-product fade-in slide-in-from-bottom-1 motion-reduce:animate-none"
						role="status"
					>
						Build your menu with AI
					</span>
				)}
				<span
					className={cn(
						"relative",
						highlightAi && "animate-pulse motion-reduce:animate-none",
					)}
				>
					<QuickAiMark className="h-5 w-5" />
				</span>
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
				className="relative flex min-h-[52px] w-16 shrink-0 flex-col items-center justify-end pb-2.5 text-product-foreground [-webkit-tap-highlight-color:transparent]"
				onClick={onTogglePanel}
				type="button"
			>
				<span
					className={cn(
						"absolute -top-10 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full shadow-[0_14px_28px_-6px_rgb(var(--product-primary-accent-rgb)/0.6),0_3px_6px_rgb(var(--product-dark-rgb)/0.12)] transition-colors",
						isPanelOpen
							? "bg-product-dark text-product-on-dark"
							: "bg-product-primary text-product-foreground",
					)}
				>
					{isPanelOpen ? (
						<X className="h-7 w-7" />
					) : (
						<SlidersHorizontal className="h-7 w-7" />
					)}
				</span>
				<span className={barLabelClass}>
					{isPanelOpen ? "Close" : "Editor"}
				</span>
			</button>

			<SaveStatus onOpenHistory={onOpenHistory} variant="bar" />

			{/* Preview and publish share one slot; both are gated by the same condition. */}
			<DropdownMenu>
				<DropdownMenuTrigger
					aria-label={`${publish.label} or preview${publish.badge ? ", unpublished changes" : ""}`}
					className={barItemClass}
					disabled={publish.disabled}
				>
					<span className="relative flex items-center">
						<PublishIcon className="h-5 w-5" />
						{publish.badge && (
							<span
								aria-hidden="true"
								className="absolute -right-1 -top-1 size-2 rounded-full bg-product-error"
							/>
						)}
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
					{qr.href && (
						<DropdownMenuItem asChild>
							{/* A new tab: the guard ignores it, so the draft stays put. */}
							<Link href={qr.href} rel="noreferrer" target="_blank">
								<QrIcon className="mr-2 h-4 w-4" />
								{qr.label}
							</Link>
						</DropdownMenuItem>
					)}
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
	successType,
	closeSuccessModal,
	isTemplateModalOpen,
	closeTemplateModal,
}: {
	catalogueName: string;
	isSuccessModalOpen: boolean;
	successType: "regular" | "edit";
	closeSuccessModal: () => void;
	isTemplateModalOpen: boolean;
	closeTemplateModal: () => void;
}) => (
	<>
		<SuccessModal
			catalogueUrl={`/catalogues/${catalogueName}`}
			isOpen={isSuccessModalOpen}
			onClose={closeSuccessModal}
			type={successType}
		/>
		{isTemplateModalOpen && (
			<SelectTemplateModal
				isOpen={isTemplateModalOpen}
				onClose={closeTemplateModal}
			/>
		)}
	</>
);
