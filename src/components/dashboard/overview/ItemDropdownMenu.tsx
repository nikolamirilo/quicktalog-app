"use client";
import type { Catalogue, PricingPlan, Status, Usage } from "@quicktalog/common";
import {
	ChevronDown,
	CircleCheck,
	Code,
	Copy,
	FileText,
	Pencil,
	Power,
	PowerOff,
	QrCode,
	Rocket,
	Share2,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, type ReactNode, useState } from "react";

import { DuplicateCatalogueDialog } from "@/components/dashboard/overview/DuplicateCatalogueDialog";
import { parseTimestamp } from "@/components/dashboard/overview/timestamps";
import { LimitsModal } from "@/components/modals/LimitsModal";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCopyLink } from "@/hooks/useCopyLink";
import { useDuplicateCatalogue } from "@/hooks/useDuplicateCatalogue";
import { handleDownloadHTML } from "@/lib/catalogue/download";
import { getRequiredPlan } from "@/lib/entitlements/required-plan";
import { cn } from "@/lib/ui/cn";

type ItemDropdownMenuProps = {
	catalogue: Catalogue;
	currentPlan: PricingPlan;
	usage: Usage;
	/** Everything but Delete is off for a catalogue in preparation or error. */
	disabled: boolean;
	deleteDialogOpen: boolean;
	statusBusy: boolean;
	/** The publish row's label, or null when there is nothing to publish. */
	publishLabel: string | null;
	onPublish: () => void;
	onDelete: (name: string) => void;
	onStatusChange: (id: string, status: Status) => void;
	onDuplicated: () => Promise<void>;
	className?: string;
};

type MenuItem = {
	key: string;
	icon: ReactNode;
	label: string;
	disabled: boolean;
	onSelect: (e: Event) => void;
	title?: string;
	danger?: boolean;
	success?: boolean;
	accent?: boolean;
};

const ITEM_CLASS =
	"text-product-foreground-accent focus:text-product-foreground data-[disabled]:opacity-40";

const MENU_CLASS = "w-[232px]";

const USER_STATUSES: Status[] = ["active", "inactive", "draft"];
const STATUS_ACTIONS: Record<string, { label: string; icon: ReactNode }> = {
	active: { label: "Activate", icon: <Power /> },
	inactive: { label: "Switch off", icon: <PowerOff /> },
	draft: { label: "Save as draft", icon: <FileText /> },
};

/** A catalogue in preparation can be deleted only this long after creation. */
const DELETE_LOCK_MS = 10 * 60 * 1000;

function isDeleteLocked(catalogue: Catalogue, now: number) {
	if (catalogue.status !== "in_preparation") return false;
	const created = parseTimestamp(catalogue.createdAt);
	return !Number.isNaN(created) && now - created < DELETE_LOCK_MS;
}

/**
 * The actions menu on a dashboard catalogue card, opened by a labelled button in
 * the card's second row. Every mutation lives here rather than on the card face,
 * so the button row keeps the same shape in every state and only the menu varies.
 */
export function ItemDropdownMenu({
	catalogue,
	currentPlan,
	usage,
	disabled,
	deleteDialogOpen,
	statusBusy,
	publishLabel,
	onPublish,
	onDelete,
	onStatusChange,
	onDuplicated,
	className,
}: ItemDropdownMenuProps) {
	const router = useRouter();
	// Controlled, so the menu re-renders on opening and the delete lock is
	// judged against the time the menu was opened, not the page load.
	const [menuOpen, setMenuOpen] = useState(false);
	const [openedAt, setOpenedAt] = useState(() => Date.now());
	const { copied, copy } = useCopyLink();

	const atTrafficLimit =
		usage.traffic.pageviews >= currentPlan.features.traffic_limit;
	const atCatalogueLimit = usage.catalogues >= currentPlan.features.catalogues;
	const duplicate = useDuplicateCatalogue({
		catalogueId: catalogue.id,
		atCatalogueLimit,
		onDuplicated,
	});

	const deleteLocked = isDeleteLocked(catalogue, openedAt);
	const availableStatuses = USER_STATUSES.filter((s) => s !== catalogue.status);
	const catalogueUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/catalogues/${catalogue.name}`;
	// Sharing needs a page to share: the public route 404s on anything not active.
	const notShareable = disabled || catalogue.status !== "active";
	// publishCatalogue runs canActivate, which refuses at the traffic limit
	// whatever the current status, so offering the row would only raise a toast.
	const publishBlocked = atTrafficLimit;
	const showPublishDot = publishLabel !== null && !publishBlocked;

	const menuItems: MenuItem[] = [
		...(publishLabel
			? [
					{
						key: "publish",
						icon: <Rocket />,
						label: publishLabel,
						disabled: disabled || publishBlocked,
						title: publishBlocked ? "Traffic limit reached" : undefined,
						accent: true,
						onSelect: () => onPublish(),
					},
				]
			: []),
		{
			key: "edit",
			icon: <Pencil />,
			label: "Edit catalogue",
			disabled,
			onSelect: () => router.push(`/admin/${catalogue.name}/builder`),
		},
		{
			key: "share",
			icon: copied ? <CircleCheck /> : <Share2 />,
			label: copied ? "Link copied" : "Copy link",
			disabled: notShareable,
			success: copied,
			onSelect: (e) => {
				// Keep the menu open so "Link copied" is seen.
				e.preventDefault();
				void copy(catalogueUrl);
			},
		},
		{
			key: "qr",
			icon: <QrCode />,
			label: "QR code",
			// The QR editor has no status guard, so a draft can be designed before it goes live.
			disabled,
			onSelect: () => router.push(`/admin/${catalogue.name}/qr-editor`),
		},
		{
			key: "embed",
			icon: <Code />,
			label: "Embed on your site",
			disabled: notShareable,
			onSelect: () => handleDownloadHTML(catalogue.name, catalogueUrl),
		},
		{
			key: "duplicate",
			icon: <Copy />,
			label: duplicate.duplicating ? "Loading..." : "Duplicate",
			disabled: disabled || duplicate.duplicating,
			onSelect: duplicate.open,
		},
		...availableStatuses.map((status) => {
			const blocked = status === "active" && atTrafficLimit;
			return {
				key: `status-${status}`,
				icon: STATUS_ACTIONS[status].icon,
				label: STATUS_ACTIONS[status].label,
				disabled: statusBusy || disabled || blocked,
				title: blocked ? "Traffic limit reached" : undefined,
				onSelect: () => onStatusChange(catalogue.id, status),
			};
		}),
		{
			key: "delete",
			icon: <Trash2 />,
			label: "Delete",
			disabled: deleteDialogOpen || deleteLocked,
			title: deleteLocked ? "Available 10 minutes after creation" : undefined,
			danger: true,
			onSelect: () => onDelete(catalogue.name),
		},
	];

	return (
		<>
			<DropdownMenu
				onOpenChange={(open) => {
					if (open) setOpenedAt(Date.now());
					setMenuOpen(open);
				}}
				open={menuOpen}
			>
				<DropdownMenuTrigger asChild>
					<Button
						aria-label={`Options for ${catalogue.name}${
							showPublishDot ? " — changes not published yet" : ""
						}`}
						className={cn("gap-1.5", className)}
						size="sm"
						variant="outline"
					>
						{showPublishDot && (
							<span
								aria-hidden="true"
								className="size-2 flex-none rounded-full bg-product-primary-accent"
							/>
						)}
						Options
						<ChevronDown aria-hidden="true" />
					</Button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className={MENU_CLASS}>
					{menuItems.map((item) => (
						<Fragment key={item.key}>
							{item.danger && <DropdownMenuSeparator />}
							<DropdownMenuItem
								className={cn(
									ITEM_CLASS,
									item.danger &&
										"text-product-error focus:bg-product-error-soft focus:text-product-error",
									item.success && "text-product-success",
									item.accent &&
										"bg-product-primary-soft font-semibold text-product-primary-ink focus:bg-product-primary-soft focus:text-product-primary-ink",
								)}
								disabled={item.disabled}
								onSelect={item.onSelect}
								title={item.title}
							>
								{item.icon}
								{item.label}
							</DropdownMenuItem>
						</Fragment>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			<DuplicateCatalogueDialog
				field={duplicate.nameField}
				isOpen={duplicate.isDialogOpen}
				loading={duplicate.duplicating}
				onCancel={duplicate.close}
				onConfirm={duplicate.confirm}
			/>
			<LimitsModal
				currentPlan={currentPlan}
				isOpen={duplicate.isLimitOpen}
				onClose={duplicate.closeLimit}
				requiredPlan={getRequiredPlan(currentPlan, "catalogue")}
				type="catalogue"
			/>
		</>
	);
}
