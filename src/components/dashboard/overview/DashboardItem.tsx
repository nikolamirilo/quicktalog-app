"use client";
import type { Catalogue, PricingPlan, Status, Usage } from "@quicktalog/common";
import { ChartColumn, Settings, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { getCatalogueByName, publishCatalogue } from "@/actions/catalogue";
import { ItemDropdownMenu } from "@/components/dashboard/overview/ItemDropdownMenu";
import { StatusBadge } from "@/components/dashboard/overview/StatusBadge";
import { parseTimestamp } from "@/components/dashboard/overview/timestamps";
import { Button } from "@/components/ui/button";
import { cardState } from "@/lib/dashboard/catalogue-card";
import type { CatalogueWithDraft } from "@/lib/dashboard/overview";
import { formatIsoDay } from "@/lib/format/date";
import { htmlToText } from "@/lib/html/to-text";
import { cn } from "@/lib/ui/cn";

type DashboardItemProps = {
	catalogue: CatalogueWithDraft;
	currentPlan: PricingPlan;
	usage: Usage;
	deleteDialogOpen: boolean;
	statusBusyId: string | null;
	onDelete: (name: string) => void;
	onStatusChange: (id: string, status: Status) => void;
	onChanged: () => Promise<void>;
	onDuplicated: () => Promise<void>;
};

/** "3 minutes ago" down to the minute, then the date; drafts save themselves now. */
const formatSince = (value: string | null) => {
	if (!value) return null;
	const time = parseTimestamp(value);
	if (Number.isNaN(time)) return null;
	const minutes = Math.round((Date.now() - time) / 60000);
	if (minutes < 1) return "just now";
	if (minutes < 60) return `${minutes} min ago`;
	if (minutes < 24 * 60) {
		const hours = Math.round(minutes / 60);
		return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
	}
	return new Date(time).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
	});
};

const formatDateTime = (value: string) => {
	const time = parseTimestamp(value);
	if (Number.isNaN(time)) return "-";
	return new Date(time).toLocaleString("en-US", {
		year: "numeric",
		month: "numeric",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

/** Thumb-sized on a phone, back to the dashboard's height from `md`. */
const BUTTON_HEIGHT = "h-11 md:h-9";

/** One catalogue card on the overview (`.as-cat`). */
export function DashboardItem({
	catalogue,
	currentPlan,
	usage,
	deleteDialogOpen,
	statusBusyId,
	onDelete,
	onStatusChange,
	onChanged,
	onDuplicated,
}: DashboardItemProps) {
	const lastSaved = formatSince(catalogue.draft.lastSavedAt);
	const {
		publishLabel,
		signal,
		primaryAction,
		analyticsEnabled,
		itemsSummary,
		isTerminal,
	} = cardState({
		backOnline: formatIsoDay(usage.period.end),
		draft: catalogue.draft,
		name: catalogue.name,
		status: catalogue.status,
		trafficOffAt: catalogue.trafficOffAt,
	});

	const viewAction = {
		label: "View",
		onClick: () => {
			window.open(`/catalogues/${catalogue.name}`, "_blank");
		},
	};

	const handlePublish = async () => {
		const result = await getCatalogueByName(catalogue.name);
		if (!result.success || !result.data) {
			toast.error("Could not retrieve catalogue data. Please try again.");
			return;
		}

		const raw = result.data;
		const latest = (
			typeof raw === "string" ? JSON.parse(raw) : raw
		) as Catalogue;
		const heading = htmlToText(latest.heading) || "";
		const missingFields: string[] = [];
		if (!heading || heading.length === 0) missingFields.push("heading");
		if (!latest.content || latest.content.length === 0)
			missingFields.push("content");
		if (missingFields.length > 0) {
			toast.error(`Cannot publish: missing ${missingFields.join(" and ")}.`, {
				action: {
					label: "Open Builder",
					onClick: () => {
						window.location.href = `/admin/${catalogue.name}/builder`;
					},
				},
			});
			return;
		}

		const promise = publishCatalogue(latest);
		if (catalogue.status === "draft") {
			toast.promise(promise, {
				loading: "Publishing...",
				success: async (result) => {
					if (!result.success) {
						throw new Error(result.error ?? "Failed to update status");
					}
					await onChanged();
					return "Catalogue published successfully";
				},
				action: viewAction,
				error: (err: Error) => err.message || "Failed to publish catalogue",
			});
		} else {
			toast.promise(promise, {
				loading: "Updating...",
				success: async (result) => {
					if (!result.success) {
						throw new Error(result.error ?? "Failed to update status");
					}
					await onChanged();
					return "Catalogue updated successfully";
				},
				action: viewAction,
				error: (err: Error) => err.message || "Failed to update catalogue",
			});
		}
	};

	const menuProps = {
		catalogue,
		currentPlan,
		deleteDialogOpen,
		disabled: !["active", "inactive", "draft"].includes(catalogue.status),
		onDelete,
		onDuplicated,
		onPublish: handlePublish,
		onStatusChange,
		publishLabel,
		statusBusy: statusBusyId === catalogue.id,
		usage,
	};

	return (
		<article className="relative flex min-w-0 flex-col gap-3 rounded-product-card border border-product-border bg-product-card p-[18px] shadow-product transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-product-hover">
			<h3 className="min-w-0 break-words text-[17px] font-bold leading-snug tracking-[-0.015em] [overflow-wrap:anywhere]">
				{catalogue.name}
			</h3>

			<StatusBadge status={catalogue.status} />

			<dl className="grid gap-0.5 text-[13px] text-product-muted">
				<div className="flex gap-1.5">
					<dt className="font-semibold text-product-foreground-accent">
						Items:
					</dt>
					<dd>{itemsSummary}</dd>
				</div>
				{lastSaved && (
					<div className="flex gap-1.5">
						<dt className="font-semibold text-product-foreground-accent">
							Last saved:
						</dt>
						<dd>{lastSaved}</dd>
					</div>
				)}
				<div className="flex gap-1.5">
					<dt className="font-semibold text-product-foreground-accent">
						Updated:
					</dt>
					<dd>{formatDateTime(catalogue.updatedAt)}</dd>
				</div>
			</dl>

			{signal && (
				<p
					className={cn(
						"flex items-center gap-2 text-[12.5px] font-semibold",
						signal.warn ? "text-product-primary-ink" : "text-product-muted",
					)}
				>
					<span
						aria-hidden="true"
						className={cn(
							"size-[7px] flex-none rounded-full",
							signal.warn
								? "bg-product-primary-accent"
								: "bg-product-border-strong",
						)}
					/>
					{signal.text}
				</p>
			)}

			<div className="mt-auto flex flex-col gap-2 pt-1">
				{catalogue.status === "error" && (
					<p className="flex items-start gap-2 text-[13.5px] font-semibold text-product-error">
						<TriangleAlert
							aria-hidden="true"
							className="mt-px size-[18px] flex-none"
						/>
						Error occurred. Please delete the catalogue and retry.
					</p>
				)}
				{catalogue.status === "in_preparation" && (
					<p className="flex h-9 items-center text-product-info">
						<Settings
							aria-hidden="true"
							className="size-6 animate-[spin_3s_linear_infinite]"
						/>
						<span className="sr-only">Catalogue is being prepared</span>
					</p>
				)}

				{isTerminal ? (
					/*
					 * No page to visit and no traffic to chart, but Delete lives in the
					 * menu and the error copy tells the owner to use it, so Options stays.
					 */
					<div className="flex">
						<ItemDropdownMenu
							{...menuProps}
							className={cn(BUTTON_HEIGHT, "flex-1")}
						/>
					</div>
				) : (
					<>
						<Button asChild className={BUTTON_HEIGHT} size="sm">
							<Link href={primaryAction.href}>{primaryAction.label}</Link>
						</Button>
						<div className="flex gap-2">
							{analyticsEnabled ? (
								<Button
									asChild
									className={cn(BUTTON_HEIGHT, "flex-1")}
									size="sm"
									variant="outline"
								>
									<Link href={`/admin/${catalogue.name}/analytics`}>
										<ChartColumn aria-hidden="true" />
										Analytics
									</Link>
								</Button>
							) : (
								/* A real button, not a Link: an <a> can never match :disabled. */
								<Button
									className={cn(BUTTON_HEIGHT, "flex-1")}
									disabled
									size="sm"
									title="Available once the catalogue is published"
									type="button"
									variant="outline"
								>
									<ChartColumn aria-hidden="true" />
									Analytics
								</Button>
							)}
							<ItemDropdownMenu
								{...menuProps}
								className={cn(BUTTON_HEIGHT, "flex-1")}
							/>
						</div>
					</>
				)}
			</div>
		</article>
	);
}
