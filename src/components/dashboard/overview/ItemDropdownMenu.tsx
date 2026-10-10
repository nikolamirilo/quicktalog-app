"use client";
import type { Catalogue, PricingPlan, Status, Usage } from "@quicktalog/common";
import {
	CircleCheck,
	Code,
	Copy,
	EllipsisVertical,
	Pencil,
	QrCode,
	RefreshCw,
	Share2,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, type ReactNode, useState } from "react";

import { DuplicateCatalogueDialog } from "@/components/dashboard/overview/DuplicateCatalogueDialog";
import { parseTimestamp } from "@/components/dashboard/overview/timestamps";
import { LimitsModal } from "@/components/modals/LimitsModal";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuPortal,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
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
	onDelete: (name: string) => void;
	onStatusChange: (id: string, status: Status) => void;
	onDuplicated: () => Promise<void>;
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
};

const ITEM_CLASS =
	"text-product-foreground-accent focus:text-product-foreground data-[disabled]:opacity-40";

const MENU_CLASS = "w-[220px]";

const USER_STATUSES: Status[] = ["active", "inactive", "draft"];
const STATUS_LABELS: Partial<Record<Status, string>> = {
	active: "Activate",
	inactive: "Deactivate",
	draft: "Save",
};

/** A catalogue in preparation can be deleted only this long after creation. */
const DELETE_LOCK_MS = 10 * 60 * 1000;

function isDeleteLocked(catalogue: Catalogue, now: number) {
	if (catalogue.status !== "in_preparation") return false;
	const created = parseTimestamp(catalogue.createdAt);
	return !Number.isNaN(created) && now - created < DELETE_LOCK_MS;
}

/** The ⋮ menu on a dashboard catalogue card. */
export function ItemDropdownMenu({
	catalogue,
	currentPlan,
	usage,
	disabled,
	deleteDialogOpen,
	statusBusy,
	onDelete,
	onStatusChange,
	onDuplicated,
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

	const menuItems: MenuItem[] = [
		{
			key: "edit",
			icon: <Pencil />,
			label: "Edit",
			disabled,
			onSelect: () => router.push(`/admin/${catalogue.name}/builder`),
		},
		{
			key: "status",
			icon: <RefreshCw />,
			label: "Change Status",
			disabled: statusBusy || disabled,
			onSelect: () => {},
		},
		{
			key: "share",
			icon: copied ? <CircleCheck /> : <Share2 />,
			label: copied ? "Link Copied" : "Share",
			disabled,
			success: copied,
			onSelect: (e) => {
				// Keep the menu open so "Link Copied" is seen.
				e.preventDefault();
				void copy(catalogueUrl);
			},
		},
		{
			key: "qr",
			icon: <QrCode />,
			label: "QR Code",
			disabled,
			onSelect: () => router.push(`/admin/${catalogue.name}/qr-editor`),
		},
		{
			key: "embed",
			icon: <Code />,
			label: "Embed",
			disabled,
			onSelect: () => handleDownloadHTML(catalogue.name, catalogueUrl),
		},
		{
			key: "duplicate",
			icon: <Copy />,
			label: duplicate.duplicating ? "Loading..." : "Duplicate",
			disabled: disabled || duplicate.duplicating,
			onSelect: duplicate.open,
		},
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
					<button
						aria-label={`Actions for ${catalogue.name}`}
						className="-mr-2.5 -mt-2 grid h-10 w-10 flex-none place-items-center rounded-full text-product-foreground-accent transition-colors hover:bg-product-background-hero hover:text-product-foreground data-[state=open]:bg-product-background-hero"
						type="button"
					>
						<EllipsisVertical aria-hidden="true" className="size-5" />
					</button>
				</DropdownMenuTrigger>

				<DropdownMenuContent align="end" className={MENU_CLASS}>
					{menuItems.map((item) => {
						if (item.key === "status") {
							return (
								<DropdownMenuSub key="status">
									<DropdownMenuSubTrigger
										className={ITEM_CLASS}
										disabled={item.disabled}
									>
										{item.icon}
										{item.label}
									</DropdownMenuSubTrigger>
									<DropdownMenuPortal>
										<DropdownMenuSubContent className={cn(MENU_CLASS, "w-44")}>
											{availableStatuses.map((status) => {
												const blocked = status === "active" && atTrafficLimit;
												return (
													<DropdownMenuItem
														className={ITEM_CLASS}
														disabled={blocked}
														key={status}
														onSelect={() =>
															onStatusChange(catalogue.id, status)
														}
														title={
															blocked ? "Traffic limit reached" : undefined
														}
													>
														{STATUS_LABELS[status]}
													</DropdownMenuItem>
												);
											})}
										</DropdownMenuSubContent>
									</DropdownMenuPortal>
								</DropdownMenuSub>
							);
						}
						return (
							<Fragment key={item.key}>
								{item.danger && <DropdownMenuSeparator />}
								<DropdownMenuItem
									className={cn(
										ITEM_CLASS,
										item.danger &&
											"text-product-error focus:bg-product-error-soft focus:text-product-error",
										item.success && "text-product-success",
									)}
									disabled={item.disabled}
									onSelect={item.onSelect}
									title={item.title}
								>
									{item.icon}
									{item.label}
								</DropdownMenuItem>
							</Fragment>
						);
					})}
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
